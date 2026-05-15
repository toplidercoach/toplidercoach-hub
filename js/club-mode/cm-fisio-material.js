// ============================================================
// CM-FISIO-MATERIAL.JS · Peticiones de material + Visibilidad cruzada
// TopLiderCoach HUB · Club Mode · Fase F.3
// ============================================================
// Carga DESPUES de cm-fisio.js, cm-fisio-extras.js y cm-fisio-calendario.js
// Funcionalidades:
//   1. Boton "Material" en cabecera fisio -> modal de peticiones
//   2. Visibilidad cruzada: medico ve tratamientos del fisio en ficha jugador
// ============================================================

// ========== ESTADO MATERIAL ==========
var cmFisioMaterialCatalog = [];
var cmFisioMaterialCatalogReady = false;


// ========== INYECTAR BOTON MATERIAL EN CABECERA FISIO ==========
(function() {
    var n = 0, iv = setInterval(function() {
        n++; if (n > 40) { clearInterval(iv); return; }
        var header = document.querySelector('.cmfisio-header');
        if (!header || document.getElementById('cmfisio-btn-material')) return;
        var btnDiv = header.querySelector('div');
        if (!btnDiv) return;
        var btn = document.createElement('button');
        btn.className = 'cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm';
        btn.id = 'cmfisio-btn-material';
        btn.textContent = 'Material';
        btn.onclick = function() { cmFisioMaterialAbrir(); };
        // Insertar despues de Calendario y antes de Informe diario
        var btnInforme = btnDiv.querySelector('[onclick*="cmFisioGenerarInforme"]');
        if (btnInforme) btnDiv.insertBefore(btn, btnInforme);
        else btnDiv.appendChild(btn);
        clearInterval(iv);
    }, 600);
})();


// ========== CARGAR CATALOGO ==========
async function cmFisioMaterialCargarCatalogo() {
    if (cmFisioMaterialCatalogReady) return;
    try {
        // Cargar catalogo global (club_id IS NULL) + catalogo del club
        var res = await supabaseClient.from('cm_fisio_material_catalog').select('*').or('club_id.is.null,club_id.eq.' + clubId).eq('active', true).order('sort_order');
        cmFisioMaterialCatalog = res.data || [];
        cmFisioMaterialCatalogReady = true;
    } catch (e) {
        console.error('Error cargando catalogo material:', e);
    }
}


// ========== ABRIR PANEL MATERIAL ==========
async function cmFisioMaterialAbrir() {
    await cmFisioMaterialCargarCatalogo();

    // Cargar historial de peticiones
    var res = await supabaseClient.from('cm_fisio_material_requests').select('*').eq('club_id', clubId).eq('archived', false).order('created_at', { ascending: false }).limit(20);
    var peticiones = res.data || [];

    var statusLabels = { pending: 'Pendiente', in_process: 'En proceso', ordered: 'Pedido', delivered: 'Entregado', rejected: 'Rechazado' };
    var statusColors = { pending: '#f59e0b', in_process: '#3b82f6', ordered: '#a855f7', delivered: '#22c55e', rejected: '#ef4444' };

    // Historial
    var histHtml = '';
    if (peticiones.length === 0) {
        histHtml = '<p style="color:#64748b;font-size:13px;text-align:center;padding:20px">No hay peticiones anteriores</p>';
    } else {
        peticiones.forEach(function(p) {
            var fecha = new Date(p.created_at).toLocaleDateString('es-ES');
            var items = (p.items || []).map(function(it) { return it.quantity + ' ' + it.name; }).join(', ');
            var urgBadge = p.urgency === 'urgente' ? '<span style="background:#450a0a;color:#fca5a5;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600;margin-left:6px">URGENTE</span>' : '';
            var stColor = statusColors[p.status] || '#64748b';
            histHtml += '<div style="background:#1e293b;border-radius:8px;padding:12px;margin-bottom:8px;border-left:3px solid ' + stColor + '">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
                    '<div><div style="color:#e2e8f0;font-size:13px">' + items + urgBadge + '</div>' +
                    '<div style="color:#64748b;font-size:11px;margin-top:4px">' + fecha + (p.notes ? ' - ' + p.notes : '') + '</div>' +
                    (p.response_notes ? '<div style="color:#94a3b8;font-size:11px;margin-top:2px;font-style:italic">Respuesta: ' + p.response_notes + '</div>' : '') +
                '</div>' +
                '<span style="color:' + stColor + ';font-size:11px;font-weight:600">' + (statusLabels[p.status] || p.status) + '</span>' +
            '</div></div>';
        });
    }

    // Catalogo agrupado por categoria
    var cats = {};
    cmFisioMaterialCatalog.forEach(function(m) {
        if (!cats[m.category]) cats[m.category] = [];
        cats[m.category].push(m);
    });
    var catHtml = '';
    Object.keys(cats).forEach(function(cat) {
        catHtml += '<div style="margin-bottom:10px"><div style="color:#94a3b8;font-size:11px;font-weight:600;margin-bottom:4px">' + cat + '</div>';
        cats[cat].forEach(function(m) {
            catHtml += '<div style="display:flex;align-items:center;gap:8px;padding:4px 0" id="cmfmat-item-' + m.id + '">' +
                '<input type="number" min="0" value="0" style="width:50px;background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:3px 6px;border-radius:4px;font-size:12px;text-align:center" data-mat-id="' + m.id + '" data-mat-name="' + m.name_es + '" data-mat-unit="' + m.unit + '">' +
                '<span style="color:#e2e8f0;font-size:12px">' + m.name_es + '</span>' +
                '<span style="color:#64748b;font-size:10px">(' + m.unit + ')</span>' +
            '</div>';
        });
        catHtml += '</div>';
    });

    var ov = document.createElement('div');
    ov.className = 'cmfisio-ficha-overlay';
    ov.id = 'cmfisio-material-overlay';
    ov.style.zIndex = '9500';
    ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
    ov.innerHTML =
        '<div style="background:#0f172a;border-radius:14px;width:100%;max-width:700px;max-height:90vh;overflow-y:auto;border:1px solid #14b8a6;padding:24px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
                '<h3 style="margin:0;color:#e2e8f0;font-size:18px">Peticiones de material</h3>' +
                '<button style="background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer" onclick="document.getElementById(\'cmfisio-material-overlay\').remove()">x</button>' +
            '</div>' +

            // Nueva peticion
            '<div style="background:#1e293b;border-radius:10px;padding:16px;margin-bottom:16px">' +
                '<h4 style="margin:0 0 12px;color:#14b8a6;font-size:14px">Nueva peticion</h4>' +
                '<div style="max-height:250px;overflow-y:auto;margin-bottom:12px">' + catHtml + '</div>' +
                '<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">' +
                    '<label style="color:#94a3b8;font-size:12px;font-weight:600">Urgencia:</label>' +
                    '<select id="cmfmat-urgencia" style="background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:5px 10px;border-radius:6px;font-size:12px">' +
                        '<option value="normal">Normal</option>' +
                        '<option value="urgente">Urgente</option>' +
                    '</select>' +
                '</div>' +
                '<div class="cmfisio-form-group"><label>Notas</label><textarea id="cmfmat-notes" placeholder="Observaciones, tallas especificas, marcas preferidas..." style="min-height:40px"></textarea></div>' +
                '<div style="display:flex;justify-content:flex-end"><button class="cmfisio-btn cmfisio-btn-primary" onclick="cmFisioMaterialEnviar()">Enviar peticion</button></div>' +
            '</div>' +

            // Historial
            '<h4 style="margin:0 0 12px;color:#e2e8f0;font-size:14px">Historial de peticiones</h4>' +
            '<div id="cmfmat-historial">' + histHtml + '</div>' +
        '</div>';
    document.body.appendChild(ov);
}


// ========== ENVIAR PETICION ==========
async function cmFisioMaterialEnviar() {
    var inputs = document.querySelectorAll('[data-mat-id]');
    var items = [];
    inputs.forEach(function(inp) {
        var qty = parseInt(inp.value);
        if (qty > 0) {
            items.push({
                catalog_id: inp.getAttribute('data-mat-id'),
                name: inp.getAttribute('data-mat-name'),
                unit: inp.getAttribute('data-mat-unit'),
                quantity: qty
            });
        }
    });

    if (items.length === 0) { showToast('Selecciona al menos un articulo', 'error'); return; }

    var res = await supabaseClient.from('cm_fisio_material_requests').insert({
        club_id: clubId,
        requested_by: usuario ? usuario.id : 0,
        items: items,
        urgency: document.getElementById('cmfmat-urgencia').value,
        notes: document.getElementById('cmfmat-notes').value.trim() || null,
        status: 'pending'
    });

    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }

    // Notificacion al utillero/admin
    var fisioName = usuario ? (usuario.display_name || usuario.name || 'Fisio') : 'Fisio';
    var resumen = items.map(function(it) { return it.quantity + ' ' + it.name; }).join(', ');
    var urgente = document.getElementById('cmfmat-urgencia').value === 'urgente';

    try {
        await supabaseClient.from('cm_notifications').insert({
            club_id: clubId,
            type: 'material_request',
            title: (urgente ? 'URGENTE: ' : '') + 'Peticion de material - ' + fisioName,
            message: resumen,
            icon: 'material',
            target_permission: 'modulo_utillero',
            created_by: usuario ? usuario.id : null
        });
    } catch (e) { console.error('Error notificacion material:', e); }

    showToast('Peticion enviada');
    document.getElementById('cmfisio-material-overlay').remove();
}


// ============================================================
// VISIBILIDAD CRUZADA: MEDICO VE TRATAMIENTOS DEL FISIO
// ============================================================
// Anade un tab "Fisio" a la ficha del jugador en el Panel Medico
// que muestra los tratamientos y sesiones del fisio (solo lectura)
// ============================================================

(function cmFisioCrossVisibilityInit() {
    // Esperar a que cm-medico.js este cargado
    var n = 0, iv = setInterval(function() {
        n++; if (n > 30) { clearInterval(iv); return; }
        if (typeof cmMedAbrirFicha !== 'function') return;
        if (cmMedAbrirFicha._crossPatched) { clearInterval(iv); return; }
        clearInterval(iv);

        // Guardar referencia original
        var originalAbrirFicha = cmMedAbrirFicha;

        // Override: anadir tab "Fisio" despues de abrir la ficha
        cmMedAbrirFicha = async function(playerId, playerName, photoUrl) {
            await originalAbrirFicha(playerId, playerName, photoUrl);

            // Esperar a que el DOM este listo
            setTimeout(function() {
                var tabs = document.querySelector('.cmmed-tabs');
                if (!tabs || document.getElementById('cmmed-tab-btn-fisio')) return;

                // Anadir boton de tab "Fisio"
                var tabBtn = document.createElement('button');
                tabBtn.className = 'cmmed-tab';
                tabBtn.id = 'cmmed-tab-btn-fisio';
                tabBtn.textContent = 'Fisio';
                tabBtn.onclick = function() {
                    // Cambiar tab activa
                    document.querySelectorAll('.cmmed-tab').forEach(function(t) { t.classList.remove('active'); });
                    tabBtn.classList.add('active');
                    document.querySelectorAll('.cmmed-tab-content').forEach(function(c) { c.classList.remove('active'); });
                    var container = document.getElementById('cmmed-tab-fisio');
                    if (!container) {
                        container = document.createElement('div');
                        container.className = 'cmmed-tab-content';
                        container.id = 'cmmed-tab-fisio';
                        var lastTab = document.querySelector('.cmmed-tab-content:last-of-type');
                        if (lastTab) lastTab.parentElement.insertBefore(container, lastTab.nextSibling);
                    }
                    container.classList.add('active');
                    cmFisioCrossCargarDatos(playerId, container);
                };
                tabs.appendChild(tabBtn);
            }, 200);
        };
        cmMedAbrirFicha._crossPatched = true;
        console.log('[Visibilidad cruzada] Medico -> Fisio activada');
    }, 500);
})();


async function cmFisioCrossCargarDatos(playerId, container) {
    container.innerHTML = '<div class="cmmed-empty"><div class="icon">...</div><p>Cargando datos de fisioterapia...</p></div>';

    // Tratamientos
    var treatRes = await supabaseClient.from('cm_fisio_treatments').select('*').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('created_at', { ascending: false });
    var treatments = treatRes.data || [];

    // Sesiones (ultimas 10)
    var sesRes = await supabaseClient.from('cm_fisio_sessions').select('*').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('session_date', { ascending: false }).limit(10);
    var sessions = sesRes.data || [];

    // Nombres de tecnicas
    var techMap = {};
    if (typeof cmFisioTecnicasCatalog !== 'undefined') {
        cmFisioTecnicasCatalog.forEach(function(t) { techMap[t.code] = t.name_es; });
    }

    var html = '<div style="padding:4px 0"><p style="color:#60a5fa;font-size:12px;margin:0 0 16px;display:flex;align-items:center;gap:6px"><span style="background:#1e3a5f;color:#60a5fa;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600">Solo lectura</span> Datos del despacho de fisioterapia</p>';

    // Tratamientos
    html += '<h4 style="margin:0 0 10px;color:#e2e8f0;font-size:15px">Planes de tratamiento</h4>';
    if (treatments.length === 0) {
        html += '<p style="color:#64748b;font-size:13px;margin-bottom:16px">Sin tratamientos registrados por el fisio.</p>';
    } else {
        var statusLabels = { active: 'Activo', paused: 'Pausado', completed: 'Completado', cancelled: 'Cancelado' };
        var statusColors = { active: '#14b8a6', paused: '#f59e0b', completed: '#22c55e', cancelled: '#64748b' };
        treatments.forEach(function(t) {
            var fecha = new Date(t.start_date + 'T12:00:00').toLocaleDateString('es-ES');
            var techs = (t.techniques_planned || []).map(function(tc) { return '<span style="display:inline-block;padding:1px 6px;background:#0f3d3e;color:#14b8a6;border-radius:3px;font-size:10px;margin:1px 2px">' + (techMap[tc] || tc) + '</span>'; }).join('');
            var stColor = statusColors[t.status] || '#64748b';
            html += '<div style="background:#1e293b;border-radius:8px;padding:12px;margin-bottom:8px;border-left:3px solid ' + stColor + '">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
                    '<div><div style="color:#e2e8f0;font-weight:600;font-size:13px">' + t.title + '</div>' +
                    '<div style="color:#94a3b8;font-size:11px;margin-top:3px">Desde ' + fecha + (t.frequency_per_week ? ' | ' + t.frequency_per_week + 'x/semana' : '') + '</div>' +
                    (t.objective ? '<div style="color:#94a3b8;font-size:11px;margin-top:2px">Objetivo: ' + t.objective + '</div>' : '') +
                    (techs ? '<div style="margin-top:4px">' + techs + '</div>' : '') +
                '</div>' +
                '<span style="color:' + stColor + ';font-size:11px;font-weight:600">' + (statusLabels[t.status] || t.status) + '</span>' +
            '</div></div>';
        });
    }

    // Sesiones
    html += '<h4 style="margin:16px 0 10px;color:#e2e8f0;font-size:15px">Ultimas sesiones de fisio</h4>';
    if (sessions.length === 0) {
        html += '<p style="color:#64748b;font-size:13px">Sin sesiones registradas.</p>';
    } else {
        var recLabels = { apto: 'Apto', limitado: 'Limitado', no_disponible: 'No disponible' };
        var recColors = { apto: '#22c55e', limitado: '#f59e0b', no_disponible: '#ef4444' };
        sessions.forEach(function(s) {
            var fecha = new Date(s.session_date + 'T12:00:00').toLocaleDateString('es-ES');
            var hora = '';
            if (s.time_start) hora = ' | ' + s.time_start.substring(0, 5);
            if (s.time_end) hora += '-' + s.time_end.substring(0, 5);
            var techs = (s.techniques_applied || []).map(function(tc) { return '<span style="display:inline-block;padding:1px 6px;background:#0f3d3e;color:#14b8a6;border-radius:3px;font-size:10px;margin:1px 2px">' + (techMap[tc] || tc) + '</span>'; }).join('');
            var rec = s.coach_recommendation ? '<span style="color:' + (recColors[s.coach_recommendation] || '#64748b') + ';font-size:11px;font-weight:600;margin-left:6px">' + (recLabels[s.coach_recommendation] || '') + '</span>' : '';

            html += '<div style="background:#1e293b;border-radius:8px;padding:12px;margin-bottom:8px">' +
                '<div style="color:#14b8a6;font-weight:600;font-size:12px;margin-bottom:6px">' + fecha + hora + (s.pain_level !== null && s.pain_level !== undefined ? ' | Dolor: ' + s.pain_level + '/10' : '') + rec + '</div>' +
                (s.soap_subjective ? '<div style="margin-bottom:4px"><strong style="color:#94a3b8;font-size:10px;text-transform:uppercase">S</strong><p style="color:#e2e8f0;font-size:12px;margin:1px 0 0">' + s.soap_subjective + '</p></div>' : '') +
                (s.soap_objective ? '<div style="margin-bottom:4px"><strong style="color:#94a3b8;font-size:10px;text-transform:uppercase">O</strong><p style="color:#e2e8f0;font-size:12px;margin:1px 0 0">' + s.soap_objective + '</p></div>' : '') +
                (techs ? '<div style="margin-bottom:4px"><strong style="color:#94a3b8;font-size:10px;text-transform:uppercase">A</strong><div style="margin-top:2px">' + techs + '</div>' + (s.soap_action ? '<p style="color:#e2e8f0;font-size:12px;margin:2px 0 0">' + s.soap_action + '</p>' : '') + '</div>' : '') +
                (s.soap_plan ? '<div style="margin-bottom:4px"><strong style="color:#94a3b8;font-size:10px;text-transform:uppercase">P</strong><p style="color:#e2e8f0;font-size:12px;margin:1px 0 0">' + s.soap_plan + '</p></div>' : '') +
                (s.coach_note ? '<div><strong style="color:#94a3b8;font-size:10px;text-transform:uppercase">Nota entrenador</strong><p style="color:#e2e8f0;font-size:12px;margin:1px 0 0">' + s.coach_note + '</p></div>' : '') +
            '</div>';
        });
    }

    html += '</div>';
    container.innerHTML = html;
}


console.log('[Panel Fisio] cm-fisio-material.js cargado (material + visibilidad cruzada)');
