// ============================================================
// CM-MIEMBROS.JS — Gestion de miembros del staff del club
// Parte del Club Mode integrado al HUB TopLiderCoach
// ============================================================
//
// Funcion publica de inicializacion:
//   cmInitMiembros(containerId)   — crea HTML, modal y carga datos
//
// Dependencias del HUB:
//   - supabaseClient (cliente Supabase global)
//   - localStorage 'hub_user' (con token de auth)
//   - clubId  (uuid del club activo, desde cm-core.js)
//   - cmState.esAdmin (boolean, desde cm-core.js)
//   - showToast(msg)   (helper del HUB)
//
// Tablas Supabase:
//   - club_members  (id, club_id, wp_user_id, role_id, team_ids,
//                    display_name, email, photo_url, active,
//                    invited_at, accepted_at, created_at)
//   - club_roles    (id, club_id, name, permissions, is_admin)
//   - club_teams    (id, club_id, name, active)
//
// Endpoint WP:
//   POST /wp-json/toplider/v1/club-member
//   POST /wp-json/toplider/v1/club-member/reset-password  (sub-paso 0.5.E)
//
// ============================================================

(function() {
    'use strict';

    // -------- Estado interno del modulo --------
    const cmMState = {
        miembros: [],       // listado activo
        cargos: [],         // roles del club
        equipos: [],        // equipos del club
        editingId: null     // id del miembro en edicion (null = creando)
    };

    // ============================================================
    // 1) INICIALIZACION PUBLICA
    // ============================================================
    window.cmInitMiembros = async function(containerId) {
        const cont = document.getElementById(containerId);
        if (!cont) {
            console.error('[cm-miembros] Contenedor no encontrado:', containerId);
            return;
        }
        if (!window.cmState || typeof clubId === 'undefined' || !clubId) {
            cont.innerHTML = '<p style="color:#f87171;padding:20px;">Sin club activo</p>';
            return;
        }
        if (!window.cmState.esAdmin) {
            cont.innerHTML = '<p style="color:#f87171;padding:20px;">Solo administradores del club pueden gestionar miembros</p>';
            return;
        }

        // Renderizar shell
        cont.innerHTML = cmMRenderShell();

        // Cargar datos en paralelo
        await Promise.all([
            cmMCargarCargos(),
            cmMCargarEquipos(),
            cmMCargarMiembros()
        ]);
    };

    // ============================================================
    // 2) HTML DE LA SECCION
    // ============================================================
    function cmMRenderShell() {
        return `
            <div class="cm-miembros-wrap">
                <div class="cm-card">
                    <div class="cm-card-head">
                        <h3>Miembros del staff</h3>
                        <button class="btn btn-primary" onclick="cmMAbrirModal()">+ Nuevo miembro</button>
                    </div>
                    <div class="cm-card-body">
                        <div id="cm-l-miembros">
                            <p style="text-align:center;color:#9ca3af;padding:30px;">Cargando...</p>
                        </div>
                    </div>
                </div>

                <!-- Modal alta/edicion -->
                <div id="cm-m-miembro" class="cm-modal-bg" style="display:none;">
                    <div class="cm-modal">
                        <div class="cm-modal-head">
                            <h3 id="cm-m-miembro-t">Nuevo miembro</h3>
                            <button class="cm-modal-close" onclick="cmMCerrarModal()">&times;</button>
                        </div>
                        <div class="cm-modal-body">
                            <input type="hidden" id="cm-mb-id">
                            <input type="hidden" id="cm-mb-purl">

                            <div class="cm-photo-picker">
                                <div class="cm-photo-preview" id="cm-mb-pp" onclick="document.getElementById('cm-mb-pi').click()">
                                    <span style="font-size:24px;">📷</span>
                                    <span style="font-size:11px;margin-top:4px;">Foto</span>
                                </div>
                                <input type="file" id="cm-mb-pi" accept="image/*" onchange="cmMSubirFoto(this)" style="display:none;">
                            </div>

                            <div class="cm-fr">
                                <div class="cm-fg">
                                    <label>Nombre *</label>
                                    <input id="cm-mb-nombre" type="text" maxlength="100">
                                </div>
                                <div class="cm-fg">
                                    <label>Email *</label>
                                    <input id="cm-mb-email" type="email" maxlength="120">
                                    <small id="cm-mb-email-hint" style="color:#9ca3af;font-size:11px;">
                                        Se generará una cuenta de acceso con este email
                                    </small>
                                </div>
                            </div>

                            <div class="cm-fg">
                                <label>Cargo *</label>
                                <select id="cm-mb-cargo"></select>
                            </div>

                            <div class="cm-fg">
                                <label>Equipos asignados</label>
                                <div id="cm-mb-eqs" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;"></div>
                            </div>
                        </div>
                        <div class="cm-modal-foot">
                            <button class="btn btn-secondary" onclick="cmMCerrarModal()">Cancelar</button>
                            <button class="btn btn-success" id="cm-mb-save-btn" onclick="cmMGuardar()">Guardar</button>
                        </div>
                    </div>
                </div>

                <!-- Modal credenciales generadas (solo en creacion) -->
                <div id="cm-m-credenciales" class="cm-modal-bg" style="display:none;">
                    <div class="cm-modal" style="max-width:480px;">
                        <div class="cm-modal-head">
                            <h3>✅ Cuenta creada</h3>
                        </div>
                        <div class="cm-modal-body">
                            <p style="color:#374151;font-size:14px;margin-bottom:16px;">
                                <strong>Importante:</strong> Apunta o copia esta contraseña ahora.
                                Por seguridad, no la podrás volver a ver. Si se pierde,
                                tendrás que generar una nueva con el botón "Resetear contraseña".
                            </p>
                            <div style="background:#f3f4f6;padding:14px;border-radius:8px;margin-bottom:12px;">
                                <div style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Usuario</div>
                                <div id="cm-cred-user" style="font-family:monospace;font-size:15px;font-weight:600;color:#111827;margin-top:4px;">—</div>
                            </div>
                            <div style="background:#f3f4f6;padding:14px;border-radius:8px;">
                                <div style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Contraseña temporal</div>
                                <div id="cm-cred-pass" style="font-family:monospace;font-size:15px;font-weight:600;color:#111827;margin-top:4px;">—</div>
                            </div>
                        </div>
                        <div class="cm-modal-foot">
                            <button class="btn btn-secondary" onclick="cmMCopiarCredenciales()">📋 Copiar</button>
                            <button class="btn btn-primary" onclick="cmMCerrarCredenciales()">Entendido</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================================
    // 3) CARGA DE DATOS (Supabase)
    // ============================================================
    async function cmMCargarCargos() {
        const r = await supabaseClient
            .from('club_roles')
            .select('id, name, is_admin, sort_order')
            .eq('club_id', clubId)
            .order('sort_order');
        cmMState.cargos = r.data || [];
    }

    async function cmMCargarEquipos() {
        const r = await supabaseClient
            .from('club_teams')
            .select('id, name')
            .eq('club_id', clubId)
            .eq('active', true)
            .order('name');
        cmMState.equipos = r.data || [];
    }

    async function cmMCargarMiembros() {
        const r = await supabaseClient
            .from('club_members')
            .select('*, club_roles(name, is_admin)')
            .eq('club_id', clubId)
            .eq('active', true)
            .order('created_at');
        cmMState.miembros = r.data || [];
        cmMRenderListado();
    }

    // ============================================================
    // 4) RENDERIZADO DEL LISTADO
    // ============================================================
    function cmMRenderListado() {
        const el = document.getElementById('cm-l-miembros');
        if (!el) return;

        if (!cmMState.miembros.length) {
            el.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:30px;">Aún no hay miembros. Crea el primero con "+ Nuevo miembro".</p>';
            return;
        }

        const rows = cmMState.miembros.map(function(m) {
            const rn = m.club_roles ? m.club_roles.name : '—';
            const ia = m.club_roles && m.club_roles.is_admin;
            const aceptado = m.accepted_at;
            const teamsCount = m.team_ids ? m.team_ids.length : 0;

            const fotoHTML = m.photo_url
                ? `<img src="${m.photo_url}" class="cm-avatar-sm">`
                : `<div class="cm-avatar-sm cm-avatar-letra">${(m.display_name || '?').charAt(0).toUpperCase()}</div>`;

            const estadoBadge = aceptado
                ? '<span class="cm-badge cm-badge-green" title="Ha iniciado sesion al menos una vez">✓ Activo</span>'
                : '<span class="cm-badge cm-badge-amber" title="Aun no ha iniciado sesion">Invitado</span>';

            return `
                <tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                            ${fotoHTML}
                            <div>
                                <div style="font-weight:600;">${m.display_name || '—'}</div>
                                <div style="font-size:11px;color:#6b7280;">${m.email || '—'}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="cm-badge cm-badge-blue">${rn}</span>
                        ${ia ? '<span class="cm-badge cm-badge-red" style="margin-left:4px;">ADMIN</span>' : ''}
                    </td>
                    <td>${estadoBadge}</td>
                    <td><span class="cm-badge cm-badge-gray">${teamsCount}</span></td>
                    <td style="text-align:right;">
                        <button class="btn btn-sm btn-secondary" onclick="cmMEditar('${m.id}')">Editar</button>
                        <button class="btn btn-sm btn-warning" onclick="cmMResetPassword('${m.id}')" title="Generar nueva contraseña">Reset</button>
                        <button class="btn btn-sm btn-danger" onclick="cmMDesactivar('${m.id}')" title="El miembro deja de tener acceso, pero sus datos se conservan">Desactivar</button>
                    </td>
                </tr>
            `;
        }).join('');

        el.innerHTML = `
            <table class="cm-tbl">
                <thead>
                    <tr>
                        <th>Miembro</th>
                        <th>Cargo</th>
                        <th>Estado</th>
                        <th>Equipos</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    // ============================================================
    // 5) FOTO: subida a Supabase Storage
    // ============================================================
    window.cmMSubirFoto = async function(input) {
        const f = input.files[0];
        if (!f) return;
        if (f.size > 2 * 1024 * 1024) {
            showToast('Foto demasiado grande (max 2 MB)');
            return;
        }

        const pp = document.getElementById('cm-mb-pp');
        pp.innerHTML = '<span>Subiendo...</span>';

        const ext = f.name.split('.').pop().toLowerCase();
        const fileName = `member-${clubId}-${Date.now()}.${ext}`;

        const { error } = await supabaseClient.storage
            .from('photos')
            .upload(fileName, f, { upsert: false });

        if (error) {
            showToast('Error subiendo foto: ' + error.message);
            pp.innerHTML = '<span style="font-size:24px;">📷</span><span style="font-size:11px;margin-top:4px;">Foto</span>';
            input.value = '';
            return;
        }

        const { data: urlData } = supabaseClient.storage.from('photos').getPublicUrl(fileName);
        const url = urlData.publicUrl;

        pp.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        document.getElementById('cm-mb-purl').value = url;
        input.value = '';
    };

    // ============================================================
    // 6) MODAL: abrir / cerrar / preparar
    // ============================================================
    window.cmMAbrirModal = function(miembro) {
        cmMState.editingId = miembro ? miembro.id : null;

        document.getElementById('cm-m-miembro-t').textContent = miembro ? 'Editar miembro' : 'Nuevo miembro';
        document.getElementById('cm-mb-id').value = miembro ? miembro.id : '';
        document.getElementById('cm-mb-nombre').value = miembro ? (miembro.display_name || '') : '';
        document.getElementById('cm-mb-email').value = miembro ? (miembro.email || '') : '';
        document.getElementById('cm-mb-purl').value = miembro ? (miembro.photo_url || '') : '';

        // Email: en edicion se bloquea (no se puede cambiar el WP user asociado)
        const emailInput = document.getElementById('cm-mb-email');
        const emailHint = document.getElementById('cm-mb-email-hint');
        if (miembro) {
            emailInput.readOnly = true;
            emailInput.style.background = '#f3f4f6';
            emailHint.textContent = 'El email no se puede cambiar tras crear el miembro';
        } else {
            emailInput.readOnly = false;
            emailInput.style.background = '';
            emailHint.textContent = 'Se generará una cuenta de acceso con este email';
        }

        // Foto preview
        const pp = document.getElementById('cm-mb-pp');
        if (miembro && miembro.photo_url) {
            pp.innerHTML = `<img src="${miembro.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        } else {
            pp.innerHTML = '<span style="font-size:24px;">📷</span><span style="font-size:11px;margin-top:4px;">Foto</span>';
        }

        // Select de cargos
        const sel = document.getElementById('cm-mb-cargo');
        sel.innerHTML = '<option value="">— Selecciona un cargo —</option>' +
            cmMState.cargos.map(function(c) {
                const selected = miembro && miembro.role_id === c.id ? ' selected' : '';
                return `<option value="${c.id}"${selected}>${c.name}${c.is_admin ? ' (Admin)' : ''}</option>`;
            }).join('');

        // Equipos: checkboxes
        const eqsBox = document.getElementById('cm-mb-eqs');
        const teamsActuales = miembro ? (miembro.team_ids || []) : [];
        eqsBox.innerHTML = cmMState.equipos.length
            ? cmMState.equipos.map(function(e) {
                const checked = teamsActuales.includes(e.id) ? ' checked' : '';
                return `<label class="cm-chk-pill"><input type="checkbox" class="cm-mbc" value="${e.id}"${checked}>${e.name}</label>`;
            }).join('')
            : '<p style="color:#9ca3af;font-size:12px;margin:0;">Aún no hay equipos creados</p>';

        document.getElementById('cm-m-miembro').style.display = 'flex';
    };

    window.cmMCerrarModal = function() {
        document.getElementById('cm-m-miembro').style.display = 'none';
        cmMState.editingId = null;
    };

    window.cmMEditar = function(id) {
        const m = cmMState.miembros.find(function(x) { return x.id === id; });
        if (m) cmMAbrirModal(m);
    };

    // ============================================================
    // 7) GUARDAR: crear o editar
    // ============================================================
    window.cmMGuardar = async function() {
        const id = document.getElementById('cm-mb-id').value;
        const nombre = document.getElementById('cm-mb-nombre').value.trim();
        const email = document.getElementById('cm-mb-email').value.trim();
        const role_id = document.getElementById('cm-mb-cargo').value;
        const photo_url = document.getElementById('cm-mb-purl').value;
        const team_ids = Array.from(document.querySelectorAll('.cm-mbc:checked')).map(function(c) { return c.value; });

        if (!nombre || !email || !role_id) {
            showToast('Nombre, email y cargo son obligatorios');
            return;
        }

        const btn = document.getElementById('cm-mb-save-btn');
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        try {
            if (id) {
                // ----- EDICION: solo campos cosmeticos, NO se toca wp_user_id ni email -----
                const upd = {
                    display_name: nombre,
                    role_id: role_id,
                    team_ids: team_ids,
                    photo_url: photo_url || null
                };
                const r = await supabaseClient.from('club_members').update(upd).eq('id', id);
                if (r.error) throw new Error(r.error.message);
                showToast('Miembro actualizado');
                cmMCerrarModal();
                await cmMCargarMiembros();
            } else {
                // ----- CREACION: llamar al endpoint WP que crea la cuenta -----
                const userToken = cmMGetUserToken();
                if (!userToken) {
                    showToast('Sesión expirada. Vuelve a iniciar sesión.');
                    return;
                }

                const wpRes = await fetch('https://toplidercoach.com/wp-json/toplider/v1/club-member', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + userToken
                    },
                    body: JSON.stringify({
                        email: email,
                        display_name: nombre,
                        club_id: clubId
                    })
                }).then(function(r) { return r.json(); });

                if (!wpRes.success) {
                    showToast('Error: ' + (wpRes.message || 'No se pudo crear la cuenta'));
                    return;
                }

                // 2) Insertar el miembro en club_members
                const ins = await supabaseClient.from('club_members').insert({
                    club_id: clubId,
                    wp_user_id: wpRes.wp_user_id,
                    role_id: role_id,
                    team_ids: team_ids,
                    display_name: nombre,
                    email: email,
                    photo_url: photo_url || null,
                    active: true,
                    invited_at: new Date().toISOString()
                });

                if (ins.error) {
                    // El usuario WP ya esta creado pero no se pudo insertar en club_members
                    // No es ideal, pero el admin puede reintentar el guardado
                    showToast('Cuenta creada pero error al guardar en el club: ' + ins.error.message);
                    return;
                }

                // 3) Mostrar credenciales generadas
                cmMCerrarModal();
                cmMMostrarCredenciales(wpRes.username, wpRes.password);
                await cmMCargarMiembros();
            }
        } catch (e) {
            showToast('Error: ' + e.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Guardar';
        }
    };

    // ============================================================
    // 8) DESACTIVAR (no DELETE, conservamos historial)
    // ============================================================
    window.cmMDesactivar = async function(id) {
        const m = cmMState.miembros.find(function(x) { return x.id === id; });
        const nombre = m ? m.display_name : 'este miembro';

        if (!confirm(`¿Desactivar a "${nombre}"?\n\nPerderá el acceso al club pero sus datos (notas, evaluaciones, etc.) se conservarán. Esta acción se puede revertir.`)) {
            return;
        }

        const r = await supabaseClient
            .from('club_members')
            .update({ active: false })
            .eq('id', id);

        if (r.error) {
            showToast('Error: ' + r.error.message);
            return;
        }

        showToast('Miembro desactivado');
        await cmMCargarMiembros();
    };

    // ============================================================
    // 9) RESET PASSWORD (sub-paso 0.5.E)
    // ============================================================
    window.cmMResetPassword = async function(id) {
        const m = cmMState.miembros.find(function(x) { return x.id === id; });
        if (!m) return;

        if (!confirm(`Generar nueva contraseña para "${m.display_name}"?\n\nLa contraseña anterior dejará de funcionar inmediatamente.`)) {
            return;
        }

        const userToken = cmMGetUserToken();
        if (!userToken) {
            showToast('Sesión expirada. Vuelve a iniciar sesión.');
            return;
        }

        const r = await fetch('https://toplidercoach.com/wp-json/toplider/v1/club-member/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + userToken
            },
            body: JSON.stringify({
                wp_user_id: m.wp_user_id,
                club_id: clubId
            })
        }).then(function(r) { return r.json(); }).catch(function(e) { return { success: false, message: e.message }; });

        if (!r.success) {
            showToast('Error: ' + (r.message || 'No se pudo resetear la contraseña'));
            return;
        }

        cmMMostrarCredenciales(r.username || m.email.split('@')[0], r.password);
    };

    // ============================================================
    // 10) MODAL CREDENCIALES GENERADAS
    // ============================================================
    function cmMMostrarCredenciales(username, password) {
        document.getElementById('cm-cred-user').textContent = username;
        document.getElementById('cm-cred-pass').textContent = password;
        document.getElementById('cm-m-credenciales').style.display = 'flex';
    }

    window.cmMCerrarCredenciales = function() {
        document.getElementById('cm-m-credenciales').style.display = 'none';
        // Limpiar por seguridad
        document.getElementById('cm-cred-user').textContent = '—';
        document.getElementById('cm-cred-pass').textContent = '—';
    };

    window.cmMCopiarCredenciales = function() {
        const u = document.getElementById('cm-cred-user').textContent;
        const p = document.getElementById('cm-cred-pass').textContent;
        const txt = `Usuario: ${u}\nContraseña: ${p}\n\nAcceso: https://toplidercoach.com/planificadorpro/`;
        navigator.clipboard.writeText(txt).then(function() {
            showToast('Credenciales copiadas al portapapeles');
        }).catch(function() {
            showToast('No se pudo copiar. Cópialo manualmente.');
        });
    };

    // ============================================================
    // 11) HELPER: obtener token del usuario logado
    // ============================================================
    function cmMGetUserToken() {
        // El HUB guarda el token en la clave 'hub_token' (separada de 'hub_user')
        return localStorage.getItem('hub_token') || null;
    }

    console.log('[cm-miembros] modulo cargado');
})();
