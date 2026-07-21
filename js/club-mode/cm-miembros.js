// ============================================================
// CM-MIEMBROS.JS — Gestion de miembros del staff del club
// Parte del Club Mode integrado al HUB TopLiderCoach
// ============================================================
//
// Funcion publica de inicializacion:
//   cmInitMiembros(containerId)   — crea HTML, modales y carga datos
//
// Dos pestanas dentro del modulo:
//   1) "Miembros"          — alta/edicion/baja de personas del staff
//   2) "Roles y permisos"  — crear/renombrar/archivar cargos y configurar
//                            que modulos ve/edita cada cargo (Modelo A:
//                            permisos por CARGO, iguales en todos sus equipos)
//
// Dependencias del HUB / Club Mode:
//   - supabaseClient (cliente Supabase global)
//   - localStorage 'hub_token' (token de auth WP)
//   - clubId  (uuid del club activo, desde cm-core.js)
//   - cmState.esAdmin (boolean, desde cm-core.js)
//   - CM_MODULOS (catalogo de 38 modulos, desde cm-core.js)
//   - showToast(msg)   (helper del HUB)
//
// Tablas Supabase:
//   - club_members  (id, club_id, wp_user_id, role_id, team_ids,
//                    display_name, email, photo_url, active,
//                    invited_at, accepted_at, created_at)
//   - club_roles    (id, club_id, name, description, permissions,
//                    team_scope, is_admin, sort_order, active)
//   - club_teams    (id, club_id, name, active)
//
// Endpoint WP:
//   POST /wp-json/toplider/v1/club-member
//   POST /wp-json/toplider/v1/club-member/reset-password
//
// ============================================================

(function() {
    'use strict';

    // -------- Estado interno del modulo --------
    const cmMState = {
        miembros: [],        // listado de miembros activos
        cargos: [],          // roles ACTIVOS del club (con permissions, team_scope, is_admin)
        equipos: [],         // equipos activos del club
        editingId: null,     // id del miembro en edicion (null = creando)
        selectedRoleId: null // id del cargo seleccionado en el editor de permisos
    };

    // -------- Modulos que YA estan construidos / enforced hoy --------
    // El resto del catalogo CM_MODULOS se muestra en gris ("proximamente").
    // Estas 15 claves son las que controlan algo real (MAPEO_HUB_PERMISOS
    // en cm-core.js + scouting/direccion_deportiva que comprueban permiso
    // dentro de su propio modulo).
    const CM_MODULOS_ACTIVOS = [
        'entrenamientos', 'pizarra', 'matchstats', 'asistencia', 'periodizacion',
        'analisis_postpartido', 'cuerpo_tecnico_ia', 'configuracion_club',
        'modulo_medico', 'modulo_fisio', 'modulo_preparacion_fisica',
        'scouting', 'direccion_deportiva', 'pagos_cuotas', 'comunicacion_familias',
        'modulo_analista_video'
    ];

    // -------- Orden y etiquetas de los bloques del catalogo --------
    const CM_BLOQUES = [
        { key: 'campo_comun',     label: 'Campo · Comunes' },
        { key: 'campo_despacho',  label: 'Campo · Despachos privados' },
        { key: 'oficina',         label: 'Oficina' },
        { key: 'compartido',      label: 'Compartidos' }
    ];

    function cmMCatalogo() {
        // CM_MODULOS es global (cm-core.js). Fallback defensivo si no estuviera.
        return (typeof CM_MODULOS !== 'undefined' && Array.isArray(CM_MODULOS)) ? CM_MODULOS : [];
    }

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
            cont.innerHTML = '<p style="color:#f87171;padding:20px;">Solo administradores del club pueden gestionar miembros y permisos</p>';
            return;
        }

        // Renderizar shell (estilos + pestanas + paneles + modales)
        cont.innerHTML = cmMRenderShell();

        // Cargar datos en paralelo
        await Promise.all([
            cmMCargarCargos(),
            cmMCargarEquipos(),
            cmMCargarMiembros()
        ]);

        // Render inicial de ambas pestanas
        cmMRenderListado();
        cmMRenderRolesList();
    };

    // ============================================================
    // 2) HTML DE LA SECCION (estilos + pestanas + paneles + modales)
    // ============================================================
    function cmMRenderShell() {
        return `
            <style>
                .cm-tabs-nav { display:flex; gap:6px; margin-bottom:16px; border-bottom:2px solid #e5e7eb; }
                .cm-tab-btn { background:none; border:none; padding:10px 18px; font-size:14px; font-weight:600;
                              color:#6b7280; cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; }
                .cm-tab-btn.active { color:#2563eb; border-bottom-color:#2563eb; }
                .cm-pane { display:none; }
                .cm-pane.active { display:block; }

                .cm-roles-layout { display:grid; grid-template-columns:280px 1fr; gap:18px; align-items:start; }
                @media (max-width:780px){ .cm-roles-layout { grid-template-columns:1fr; } }

                .cm-role-item { display:flex; justify-content:space-between; align-items:center; gap:8px;
                                padding:11px 12px; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:8px;
                                cursor:pointer; background:#fff; }
                .cm-role-item:hover { border-color:#93c5fd; }
                .cm-role-item.sel { border-color:#2563eb; background:#eff6ff; }
                .cm-role-item .nm { font-weight:600; color:#111827; font-size:14px; }

                .cm-perm-block { margin-bottom:18px; }
                .cm-perm-block > h5 { margin:0 0 8px; font-size:12px; text-transform:uppercase; letter-spacing:.04em;
                                      color:#6b7280; font-weight:700; }
                .cm-perm-row { display:grid; grid-template-columns:1fr 70px 70px; align-items:center; gap:8px;
                               padding:8px 10px; border-radius:6px; }
                .cm-perm-row:nth-child(even){ background:#f9fafb; }
                .cm-perm-row .lbl { font-size:13px; color:#374151; }
                .cm-perm-row.soon .lbl { color:#9ca3af; }
                .cm-perm-head { display:grid; grid-template-columns:1fr 70px 70px; gap:8px; padding:0 10px 4px;
                                font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; }
                .cm-perm-head span:not(:first-child){ text-align:center; }
                .cm-perm-row .col { text-align:center; }
                .cm-soon-badge { font-size:10px; background:#f3f4f6; color:#9ca3af; padding:2px 6px; border-radius:10px; }
            </style>

            <div class="cm-miembros-wrap">
                <div class="cm-tabs-nav">
                    <button class="cm-tab-btn active" id="cm-tabb-miembros" onclick="cmMCambiarTab('miembros')">Miembros</button>
                    <button class="cm-tab-btn" id="cm-tabb-roles" onclick="cmMCambiarTab('roles')">Roles y permisos</button>
                </div>

                <!-- ============ PANEL 1: MIEMBROS ============ -->
                <div class="cm-pane active" id="cm-pane-miembros">
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
                </div>

                <!-- ============ PANEL 2: ROLES Y PERMISOS ============ -->
                <div class="cm-pane" id="cm-pane-roles">
                    <div class="cm-roles-layout">
                        <div class="cm-card">
                            <div class="cm-card-head">
                                <h3>Cargos</h3>
                                <button class="btn btn-sm btn-primary" onclick="cmMAbrirModalRol()">+ Nuevo</button>
                            </div>
                            <div class="cm-card-body">
                                <div id="cm-l-roles">
                                    <p style="text-align:center;color:#9ca3af;padding:20px;font-size:13px;">Cargando...</p>
                                </div>
                            </div>
                        </div>
                        <div class="cm-card">
                            <div class="cm-card-body" id="cm-role-editor">
                                <p style="text-align:center;color:#9ca3af;padding:40px;">
                                    Selecciona un cargo de la izquierda para configurar sus permisos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal alta/edicion de miembro -->
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

                <!-- Modal credenciales generadas (solo en creacion / reset) -->
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

                <!-- Modal crear cargo -->
                <div id="cm-m-rol" class="cm-modal-bg" style="display:none;">
                    <div class="cm-modal" style="max-width:460px;">
                        <div class="cm-modal-head">
                            <h3>Nuevo cargo</h3>
                            <button class="cm-modal-close" onclick="cmMCerrarModalRol()">&times;</button>
                        </div>
                        <div class="cm-modal-body">
                            <div class="cm-fg">
                                <label>Nombre del cargo *</label>
                                <input id="cm-rol-nombre" type="text" maxlength="60" placeholder="Ej. Preparador físico">
                            </div>
                            <div class="cm-fg">
                                <label>Alcance de equipos</label>
                                <select id="cm-rol-scope">
                                    <option value="assigned">Solo los equipos asignados</option>
                                    <option value="all">Todos los equipos del club</option>
                                </select>
                            </div>
                            <div class="cm-fg" style="margin-top:6px;">
                                <label class="cm-chk-pill" style="display:inline-flex;">
                                    <input type="checkbox" id="cm-rol-admin">
                                    Es administrador (ve y edita todo)
                                </label>
                                <small style="display:block;color:#9ca3af;font-size:11px;margin-top:4px;">
                                    Ojo: esto no se podrá cambiar después. Solo márcalo para presidencia / dirección.
                                </small>
                            </div>
                        </div>
                        <div class="cm-modal-foot">
                            <button class="btn btn-secondary" onclick="cmMCerrarModalRol()">Cancelar</button>
                            <button class="btn btn-success" id="cm-rol-save-btn" onclick="cmMGuardarRolNuevo()">Crear cargo</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================================
    // 3) PESTANAS
    // ============================================================
    window.cmMCambiarTab = function(tab) {
        document.getElementById('cm-pane-miembros').classList.toggle('active', tab === 'miembros');
        document.getElementById('cm-pane-roles').classList.toggle('active', tab === 'roles');
        document.getElementById('cm-tabb-miembros').classList.toggle('active', tab === 'miembros');
        document.getElementById('cm-tabb-roles').classList.toggle('active', tab === 'roles');
    };

    // ============================================================
    // 4) CARGA DE DATOS (Supabase)
    // ============================================================
    async function cmMCargarCargos() {
        const r = await supabaseClient
            .from('club_roles')
            .select('id, name, description, permissions, team_scope, is_admin, sort_order')
            .eq('club_id', clubId)
            .eq('active', true)
            .order('sort_order', { nullsFirst: false })
            .range(0, 9999);
        cmMState.cargos = r.data || [];
    }

    async function cmMCargarEquipos() {
        const r = await supabaseClient
            .from('club_teams')
            .select('id, name')
            .eq('club_id', clubId)
            .eq('active', true)
            .order('name')
            .range(0, 9999);
        cmMState.equipos = r.data || [];
    }

    async function cmMCargarMiembros() {
        const r = await supabaseClient
            .from('club_members')
            .select('*, club_roles(name, is_admin)')
            .eq('club_id', clubId)
            .eq('active', true)
            .order('created_at')
            .range(0, 9999);
        cmMState.miembros = r.data || [];
    }

    // Cuenta de miembros ACTIVOS por cargo (para la lista de roles y el guard de archivar)
    function cmMContarMiembrosPorRol(roleId) {
        return cmMState.miembros.filter(function(m) { return String(m.role_id) === String(roleId); }).length;
    }

    // ============================================================
    // 5) RENDER LISTADO DE MIEMBROS
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
    // 6) ROLES Y PERMISOS — lista de cargos
    // ============================================================
    function cmMRenderRolesList() {
        const el = document.getElementById('cm-l-roles');
        if (!el) return;

        if (!cmMState.cargos.length) {
            el.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:20px;font-size:13px;">No hay cargos. Crea el primero con "+ Nuevo".</p>';
            return;
        }

        el.innerHTML = cmMState.cargos.map(function(c) {
            const n = cmMContarMiembrosPorRol(c.id);
            const sel = String(cmMState.selectedRoleId) === String(c.id) ? ' sel' : '';
            const adminBadge = c.is_admin ? '<span class="cm-badge cm-badge-red" style="margin-left:6px;">ADMIN</span>' : '';
            return `
                <div class="cm-role-item${sel}" onclick="cmMSeleccionarRol('${c.id}')">
                    <div>
                        <div class="nm">${c.name}${adminBadge}</div>
                        <div style="font-size:11px;color:#6b7280;margin-top:2px;">${n} ${n === 1 ? 'miembro' : 'miembros'}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ============================================================
    // 7) ROLES Y PERMISOS — editor del cargo seleccionado
    // ============================================================
    window.cmMSeleccionarRol = function(id) {
        cmMState.selectedRoleId = id;
        cmMRenderRolesList();
        cmMRenderEditorRol();
    };

    function cmMRenderEditorRol() {
        const box = document.getElementById('cm-role-editor');
        if (!box) return;
        const rol = cmMState.cargos.find(function(c) { return String(c.id) === String(cmMState.selectedRoleId); });
        if (!rol) {
            box.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:40px;">Selecciona un cargo.</p>';
            return;
        }

        const numMiembros = cmMContarMiembrosPorRol(rol.id);

        // Cabecera comun: nombre editable + acciones
        let html = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px;">
                <div style="flex:1;">
                    <label style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;">Nombre del cargo</label>
                    <input id="cm-re-nombre" type="text" maxlength="60" value="${(rol.name || '').replace(/"/g, '&quot;')}"
                           style="width:100%;font-size:16px;font-weight:600;padding:6px 8px;margin-top:4px;">
                </div>
                <button class="btn btn-sm btn-danger" style="margin-top:18px;" onclick="cmMArchivarRol('${rol.id}')">Archivar</button>
            </div>
        `;

        if (rol.is_admin) {
            html += `
                <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;color:#991b1b;font-size:13px;margin-bottom:14px;">
                    <strong>Cargo administrador.</strong> Ve y edita <strong>todos</strong> los módulos y equipos del club.
                    Por seguridad no se configuran permisos individuales para este cargo.
                </div>
                <div class="cm-modal-foot" style="justify-content:flex-end;border-top:1px solid #e5e7eb;padding-top:14px;">
                    <button class="btn btn-success" onclick="cmMGuardarRol()">Guardar cambios</button>
                </div>
            `;
            box.innerHTML = html;
            return;
        }

        // Aviso Modelo A
        html += `
            <p style="font-size:12px;color:#6b7280;background:#f9fafb;border-radius:6px;padding:8px 10px;margin:0 0 14px;">
                Estos permisos se aplican a <strong>todos los miembros con este cargo</strong>
                ${numMiembros ? `(ahora mismo ${numMiembros})` : ''}, en todos sus equipos.
            </p>
        `;

        // Alcance de equipos
        html += `
            <div class="cm-fg" style="margin-bottom:16px;">
                <label>Alcance de equipos</label>
                <select id="cm-re-scope">
                    <option value="assigned"${rol.team_scope !== 'all' ? ' selected' : ''}>Solo los equipos asignados a cada miembro</option>
                    <option value="all"${rol.team_scope === 'all' ? ' selected' : ''}>Todos los equipos del club</option>
                </select>
            </div>
        `;

        // Rejilla de permisos por bloque
        const perms = rol.permissions || {};
        const catalogo = cmMCatalogo();

        html += '<div id="cm-perm-grid">';
        CM_BLOQUES.forEach(function(bloque) {
            const mods = catalogo.filter(function(m) { return m.block === bloque.key; });
            if (!mods.length) return;
            html += `<div class="cm-perm-block"><h5>${bloque.label}</h5>`;
            html += `<div class="cm-perm-head"><span>Módulo</span><span>Ver</span><span>Editar</span></div>`;
            mods.forEach(function(m) {
                const activo = CM_MODULOS_ACTIVOS.indexOf(m.key) !== -1;
                const p = perms[m.key] || {};
                const verChk = p.ver === true ? ' checked' : '';
                const edChk  = p.editar === true ? ' checked' : '';
                if (activo) {
                    html += `
                        <div class="cm-perm-row">
                            <span class="lbl">${m.label}</span>
                            <span class="col"><input type="checkbox" class="cm-pg-ver" data-key="${m.key}" onchange="cmMSyncVer(this)"${verChk}></span>
                            <span class="col"><input type="checkbox" class="cm-pg-ed"  data-key="${m.key}" onchange="cmMSyncEd(this)"${edChk}></span>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="cm-perm-row soon">
                            <span class="lbl">${m.label} <span class="cm-soon-badge">próximamente</span></span>
                            <span class="col"><input type="checkbox" disabled></span>
                            <span class="col"><input type="checkbox" disabled></span>
                        </div>
                    `;
                }
            });
            html += '</div>';
        });
        html += '</div>';

        html += `
            <div class="cm-modal-foot" style="justify-content:flex-end;border-top:1px solid #e5e7eb;padding-top:14px;margin-top:8px;">
                <button class="btn btn-success" id="cm-re-save" onclick="cmMGuardarRol()">Guardar cambios</button>
            </div>
        `;

        box.innerHTML = html;
    }

    // "Editar implica Ver" — sincronizacion de casillas
    window.cmMSyncVer = function(verEl) {
        // Si quito Ver, quito tambien Editar de la misma fila
        if (!verEl.checked) {
            const ed = document.querySelector('.cm-pg-ed[data-key="' + verEl.dataset.key + '"]');
            if (ed) ed.checked = false;
        }
    };
    window.cmMSyncEd = function(edEl) {
        // Si marco Editar, marco tambien Ver
        if (edEl.checked) {
            const ver = document.querySelector('.cm-pg-ver[data-key="' + edEl.dataset.key + '"]');
            if (ver) ver.checked = true;
        }
    };

    // ============================================================
    // 8) GUARDAR cargo (nombre + alcance + permisos)
    // ============================================================
    window.cmMGuardarRol = async function() {
        const rol = cmMState.cargos.find(function(c) { return String(c.id) === String(cmMState.selectedRoleId); });
        if (!rol) return;

        const nombre = (document.getElementById('cm-re-nombre').value || '').trim();
        if (!nombre) { showToast('El nombre del cargo no puede estar vacío'); return; }

        const upd = { name: nombre };

        if (!rol.is_admin) {
            // Alcance
            const scopeEl = document.getElementById('cm-re-scope');
            upd.team_scope = scopeEl ? scopeEl.value : 'assigned';

            // Permisos: partimos de los existentes y sobrescribimos los modulos ACTIVOS
            const nuevos = Object.assign({}, rol.permissions || {});
            document.querySelectorAll('#cm-perm-grid .cm-pg-ver').forEach(function(verEl) {
                const key = verEl.dataset.key;
                const edEl = document.querySelector('.cm-pg-ed[data-key="' + key + '"]');
                nuevos[key] = {
                    ver: verEl.checked === true,
                    editar: !!(edEl && edEl.checked)
                };
            });
            upd.permissions = nuevos;
        }

        const btn = document.getElementById('cm-re-save');
        if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

        const r = await supabaseClient.from('club_roles').update(upd).eq('id', rol.id);

        if (btn) { btn.disabled = false; btn.textContent = 'Guardar cambios'; }

        if (r.error) { showToast('Error: ' + r.error.message); return; }

        showToast('Cargo guardado');
        await cmMCargarCargos();
        cmMRenderRolesList();
        cmMRenderEditorRol();
    };

    // ============================================================
    // 9) CREAR cargo nuevo
    // ============================================================
    window.cmMAbrirModalRol = function() {
        document.getElementById('cm-rol-nombre').value = '';
        document.getElementById('cm-rol-scope').value = 'assigned';
        document.getElementById('cm-rol-admin').checked = false;
        document.getElementById('cm-m-rol').style.display = 'flex';
    };
    window.cmMCerrarModalRol = function() {
        document.getElementById('cm-m-rol').style.display = 'none';
    };

    window.cmMGuardarRolNuevo = async function() {
        const nombre = (document.getElementById('cm-rol-nombre').value || '').trim();
        const scope = document.getElementById('cm-rol-scope').value;
        const esAdmin = document.getElementById('cm-rol-admin').checked;

        if (!nombre) { showToast('Pon un nombre al cargo'); return; }

        // Evitar duplicados por nombre (case-insensitive) entre los cargos activos
        const dup = cmMState.cargos.some(function(c) { return (c.name || '').toLowerCase() === nombre.toLowerCase(); });
        if (dup) { showToast('Ya existe un cargo con ese nombre'); return; }

        // sort_order = max + 1
        let maxOrder = 0;
        cmMState.cargos.forEach(function(c) { if (typeof c.sort_order === 'number' && c.sort_order > maxOrder) maxOrder = c.sort_order; });

        const btn = document.getElementById('cm-rol-save-btn');
        btn.disabled = true; btn.textContent = 'Creando...';

        const r = await supabaseClient.from('club_roles').insert({
            club_id: clubId,
            name: nombre,
            permissions: {},          // empieza sin permisos; se configuran en el editor
            team_scope: scope,
            is_admin: esAdmin,
            sort_order: maxOrder + 1,
            active: true
        }).select('id, name, description, permissions, team_scope, is_admin, sort_order').single();

        btn.disabled = false; btn.textContent = 'Crear cargo';

        if (r.error) { showToast('Error: ' + r.error.message); return; }

        showToast('Cargo creado');
        cmMCerrarModalRol();
        await cmMCargarCargos();
        cmMRenderRolesList();
        // Seleccionar el recien creado para configurarlo
        if (r.data && r.data.id) cmMSeleccionarRol(r.data.id);
    };

    // ============================================================
    // 10) ARCHIVAR cargo (no DELETE; active=false)
    // ============================================================
    window.cmMArchivarRol = async function(id) {
        const rol = cmMState.cargos.find(function(c) { return String(c.id) === String(id); });
        if (!rol) return;

        const n = cmMContarMiembrosPorRol(id);
        if (n > 0) {
            showToast(`No se puede archivar: hay ${n} ${n === 1 ? 'miembro' : 'miembros'} con este cargo. Reasígnalos primero.`);
            return;
        }

        // Nunca dejar el club sin ningun cargo administrador
        if (rol.is_admin) {
            const otrosAdmin = cmMState.cargos.filter(function(c) { return c.is_admin && String(c.id) !== String(id); }).length;
            if (otrosAdmin === 0) {
                showToast('No se puede archivar el único cargo administrador del club.');
                return;
            }
        }

        if (!confirm(`¿Archivar el cargo "${rol.name}"?\n\nDejará de estar disponible para asignar, pero no se borra. Esta acción se puede revertir desde la base de datos.`)) {
            return;
        }

        const r = await supabaseClient.from('club_roles').update({ active: false }).eq('id', id);
        if (r.error) { showToast('Error: ' + r.error.message); return; }

        showToast('Cargo archivado');
        cmMState.selectedRoleId = null;
        await cmMCargarCargos();
        cmMRenderRolesList();
        document.getElementById('cm-role-editor').innerHTML =
            '<p style="text-align:center;color:#9ca3af;padding:40px;">Selecciona un cargo de la izquierda para configurar sus permisos.</p>';
    };

    // ============================================================
    // 11) FOTO: subida a Supabase Storage
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
    // 12) MODAL MIEMBRO: abrir / cerrar / preparar
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

        // Select de cargos (solo activos)
        const sel = document.getElementById('cm-mb-cargo');
        sel.innerHTML = '<option value="">— Selecciona un cargo —</option>' +
            cmMState.cargos.map(function(c) {
                const selected = miembro && String(miembro.role_id) === String(c.id) ? ' selected' : '';
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
        const m = cmMState.miembros.find(function(x) { return String(x.id) === String(id); });
        if (m) cmMAbrirModal(m);
    };

    // ============================================================
    // 13) GUARDAR MIEMBRO: crear o editar
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
                // ----- EDICION: solo campos cosmeticos, NO se toca la cuenta -----
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
                cmMRenderListado();
                cmMRenderRolesList();
            } else {
                // ----- CREACION: Edge Function (crea cuenta Supabase + ficha club_members) -----
                const { data: sess } = await supabaseClient.auth.getSession();
                const accessToken = sess && sess.session ? sess.session.access_token : null;
                if (!accessToken) {
                    showToast('Para crear miembros debes haber entrado como administrador de club (cuenta Supabase).');
                    return;
                }

                const resp = await fetch(SUPABASE_URL + '/functions/v1/create-club-member', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_KEY,
                        'Authorization': 'Bearer ' + accessToken
                    },
                    body: JSON.stringify({
                        email: email,
                        display_name: nombre,
                        role_id: role_id,
                        team_ids: team_ids,
                        club_id: clubId
                    })
                });
                const res = await resp.json();

                if (!res.success) {
                    showToast('Error: ' + (res.message || 'No se pudo crear la cuenta'));
                    return;
                }

                // Si se subió foto, asignarla a la ficha recién creada
                if (photo_url) {
                    await supabaseClient.from('club_members')
                        .update({ photo_url: photo_url })
                        .eq('email', email).eq('club_id', clubId);
                }

                cmMCerrarModal();
                cmMMostrarCredenciales(res.username, res.password);
                await cmMCargarMiembros();
                cmMRenderListado();
                cmMRenderRolesList();
            }
        } catch (e) {
            showToast('Error: ' + e.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Guardar';
        }
    };

    // ============================================================
    // 14) DESACTIVAR MIEMBRO (no DELETE, conservamos historial)
    // ============================================================
    window.cmMDesactivar = async function(id) {
        const m = cmMState.miembros.find(function(x) { return String(x.id) === String(id); });
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
        cmMRenderListado();
        cmMRenderRolesList();
    };

    // ============================================================
    // 15) RESET PASSWORD
    // ============================================================
    window.cmMResetPassword = async function(id) {
        const m = cmMState.miembros.find(function(x) { return x.id === id; });
        if (!m) return;

        if (!confirm(`Generar nueva contraseña para "${m.display_name}"?\n\nLa contraseña anterior dejará de funcionar inmediatamente.`)) {
            return;
        }

        const { data: sess } = await supabaseClient.auth.getSession();
        const accessToken = sess && sess.session ? sess.session.access_token : null;
        if (!accessToken) {
            showToast('Para resetear contraseñas debes haber entrado como administrador de club (cuenta Supabase).');
            return;
        }

        const r = await fetch(SUPABASE_URL + '/functions/v1/reset-club-member-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + accessToken
            },
            body: JSON.stringify({
                member_id: m.id,
                club_id: clubId
            })
        }).then(function(resp) { return resp.json(); }).catch(function(e) { return { success: false, message: e.message }; });

        if (!r.success) {
            showToast('Error: ' + (r.message || 'No se pudo resetear la contraseña'));
            return;
        }

        cmMMostrarCredenciales(r.username || m.email.split('@')[0], r.password);
    };

    // ============================================================
    // 16) MODAL CREDENCIALES GENERADAS
    // ============================================================
    function cmMMostrarCredenciales(username, password) {
        document.getElementById('cm-cred-user').textContent = username;
        document.getElementById('cm-cred-pass').textContent = password;
        document.getElementById('cm-m-credenciales').style.display = 'flex';
    }

    window.cmMCerrarCredenciales = function() {
        document.getElementById('cm-m-credenciales').style.display = 'none';
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
    // 17) HELPER: token del usuario logado
    // ============================================================
    function cmMGetUserToken() {
        return localStorage.getItem('hub_token') || null;
    }

    console.log('[cm-miembros] modulo cargado (con editor de roles y permisos)');
})();
