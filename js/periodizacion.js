// ========== PERIODIZACION.JS - TopLiderCoach HUB ==========
// Planificación por macrociclos, mesociclos y microciclos
// Archivo independiente — no modifica ningún otro módulo

// =============================================
// ESTADO
// =============================================
var pdz = {
    periodos: [],
    seleccionadoId: null,
    sesionesPeriodo: [],
    vista: 'timeline'
};

// =============================================
// COLORES POR DEFECTO SEGÚN TIPO
// =============================================
var PDZ_COLORES = {
    macro: ['#ef4444','#3b82f6','#6b7280','#8b5cf6','#f59e0b','#10b981'],
    meso:  ['#f97316','#06b6d4','#ec4899','#84cc16','#a855f7','#14b8a6'],
    micro: ['#22c55e','#0ea5e9','#f43f5e','#eab308','#6366f1','#2dd4bf']
};

var PDZ_FOCUS_TAGS = [
    'Acumulacion','Transformacion','Realizacion','Recuperacion',
    'Tapering','Fuerza','Velocidad','Resistencia','Tactico',
    'Pretemporada','Competicion','Transicion'
];

// =============================================
// INIT
// =============================================
function initPeriodizacion() {
    var root = document.getElementById('periodizacion-root');
    if (!root) return;
    pdzRenderMain();
    pdzCargarPeriodos();
}

// =============================================
// RENDER PRINCIPAL
// =============================================
function pdzRenderMain() {
    var root = document.getElementById('periodizacion-root');
    if (!root) return;

    root.innerHTML = '' +
    '<div style="max-width:1200px;margin:0 auto;padding:10px 0">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">' +
            '<h2 style="margin:0;font-size:20px;color:#e2e8f0">📅 Periodización</h2>' +
            '<div style="display:flex;gap:8px">' +
                '<button onclick="pdzMostrarFormulario(\'macro\')" style="padding:8px 16px;background:#ef4444;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">+ Macrociclo</button>' +
                '<button onclick="pdzMostrarFormulario(\'meso\')" style="padding:8px 16px;background:#f97316;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">+ Mesociclo</button>' +
                '<button onclick="pdzMostrarFormulario(\'micro\')" style="padding:8px 16px;background:#22c55e;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">+ Microciclo</button>' +
            '</div>' +
        '</div>' +
        '<div id="pdz-timeline"></div>' +
        '<div id="pdz-form-area" style="display:none"></div>' +
        '<div id="pdz-detalle-area" style="display:none"></div>' +
    '</div>';
}

// =============================================
// CARGAR PERIODOS DESDE SUPABASE
// =============================================
async function pdzCargarPeriodos() {
    if (!clubId || !seasonId) {
        document.getElementById('pdz-timeline').innerHTML = '<div style="text-align:center;padding:40px;color:#9ca3af"><p>Configura un club y temporada activa en Mi Club.</p></div>';
        return;
    }

    try {
        var { data, error } = await supabaseClient
            .from('training_periods')
            .select('*')
            .eq('club_id', clubId)
            .eq('season_id', seasonId)
            .order('date_start', { ascending: true });

        if (error) throw error;
        pdz.periodos = data || [];
        pdzRenderTimeline();
    } catch(err) {
        showToast('Error cargando periodos: ' + err.message);
    }
}

// =============================================
// RENDER TIMELINE
// =============================================
function pdzRenderTimeline() {
    var container = document.getElementById('pdz-timeline');
    if (!container) return;

    if (pdz.periodos.length === 0) {
        container.innerHTML = '' +
            '<div style="text-align:center;padding:60px 20px;background:#0f172a;border:1px solid #1e3a5f;border-radius:12px">' +
                '<div style="font-size:48px;margin-bottom:16px">📅</div>' +
                '<h3 style="color:#e2e8f0;margin:0 0 8px">Sin periodos de entrenamiento</h3>' +
                '<p style="color:#9ca3af;margin:0 0 20px;font-size:14px">Empieza creando un macrociclo para tu temporada</p>' +
                '<button onclick="pdzMostrarFormulario(\'macro\')" style="padding:10px 24px;background:#ef4444;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600">+ Crear primer Macrociclo</button>' +
            '</div>';
        return;
    }

    var macros = pdz.periodos.filter(function(p) { return p.type === 'macro'; });
    var mesos = pdz.periodos.filter(function(p) { return p.type === 'meso'; });
    var micros = pdz.periodos.filter(function(p) { return p.type === 'micro'; });

    var html = '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px">';

    html += '<div style="margin-bottom:16px">';
    html += '<div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Macrociclos</div>';
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
    if (macros.length === 0) { html += '<div style="flex:1;height:36px;border:1px dashed #334155;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:12px">Sin macrociclos</div>'; }
    else { macros.forEach(function(p) { html += pdzBarraHtml(p); }); }
    html += '</div></div>';

    html += '<div style="margin-bottom:16px">';
    html += '<div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Mesociclos</div>';
    html += '<div style="display:flex;gap:3px;flex-wrap:wrap">';
    if (mesos.length === 0) { html += '<div style="flex:1;height:30px;border:1px dashed #334155;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:11px">Sin mesociclos</div>'; }
    else { mesos.forEach(function(p) { html += pdzBarraHtml(p); }); }
    html += '</div></div>';

    html += '<div>';
    html += '<div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Microciclos</div>';
    html += '<div style="display:flex;gap:2px;flex-wrap:wrap">';
    if (micros.length === 0) { html += '<div style="flex:1;height:24px;border:1px dashed #334155;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:10px">Sin microciclos</div>'; }
    else { micros.forEach(function(p) { html += pdzBarraHtml(p); }); }
    html += '</div></div>';

    html += '</div>';
    container.innerHTML = html;
}

function pdzBarraHtml(p) {
    var alturas = { macro: '36px', meso: '30px', micro: '24px' };
    var fontSize = p.type === 'micro' ? '10px' : (p.type === 'meso' ? '11px' : '12px');
    var inicio = new Date(p.date_start + 'T12:00:00');
    var fin = new Date(p.date_end + 'T12:00:00');
    var dias = Math.max(1, Math.round((fin - inicio) / 86400000));
    var flexVal = Math.max(1, dias);
    var fechaCorta = inicio.getDate() + '/' + (inicio.getMonth()+1) + ' - ' + fin.getDate() + '/' + (fin.getMonth()+1);

    return '<div onclick="pdzMostrarDetalle(\'' + p.id + '\')" style="flex:' + flexVal + ';height:' + alturas[p.type] + ';background:' + (p.color || '#3b82f6') + ';border-radius:6px;display:flex;align-items:center;justify-content:center;padding:0 8px;cursor:pointer;min-width:60px;overflow:hidden;position:relative;transition:opacity 0.2s" title="' + p.name + ' (' + fechaCorta + ')">' +
        '<span style="color:#fff;font-size:' + fontSize + ';font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + p.name + '</span></div>';
}

// =============================================
// FORMULARIO CREAR/EDITAR PERIODO
// =============================================
function pdzMostrarFormulario(tipo, editarId) {
    var formArea = document.getElementById('pdz-form-area');
    var detalleArea = document.getElementById('pdz-detalle-area');
    if (detalleArea) detalleArea.style.display = 'none';
    formArea.style.display = 'block';

    var periodo = editarId ? pdz.periodos.find(function(p) { return p.id === editarId; }) : null;
    var esEditar = !!periodo;
    var tipoLabel = { macro: 'Macrociclo', meso: 'Mesociclo', micro: 'Microciclo' };
    var titulo = esEditar ? ('Editar ' + tipoLabel[tipo]) : ('Nuevo ' + tipoLabel[tipo]);

    var padresHtml = '<option value="">— Sin padre —</option>';
    if (tipo === 'meso') {
        pdz.periodos.filter(function(p) { return p.type === 'macro'; }).forEach(function(p) {
            var sel = (periodo && periodo.parent_id === p.id) ? ' selected' : '';
            padresHtml += '<option value="' + p.id + '"' + sel + '>' + p.name + '</option>';
        });
    } else if (tipo === 'micro') {
        pdz.periodos.filter(function(p) { return p.type === 'meso'; }).forEach(function(p) {
            var sel = (periodo && periodo.parent_id === p.id) ? ' selected' : '';
            padresHtml += '<option value="' + p.id + '"' + sel + '>' + p.name + '</option>';
        });
    }

    var tagsActuales = (periodo && periodo.focus_tags) ? periodo.focus_tags : [];
    var tagsHtml = PDZ_FOCUS_TAGS.map(function(tag) {
        var checked = tagsActuales.indexOf(tag) >= 0 ? ' checked' : '';
        return '<label style="display:flex;align-items:center;gap:5px;font-size:12px;color:#cbd5e1;cursor:pointer;padding:4px 8px;background:#1e293b;border-radius:6px"><input type="checkbox" class="pdz-tag-check" value="' + tag + '"' + checked + '> ' + tag + '</label>';
    }).join('');

    var coloresDisponibles = PDZ_COLORES[tipo] || PDZ_COLORES.macro;
    var colorActual = periodo ? periodo.color : coloresDisponibles[0];
    var coloresHtml = coloresDisponibles.map(function(c) {
        var borde = c === colorActual ? '3px solid #fff' : '2px solid #475569';
        return '<div onclick="document.getElementById(\'pdz-color\').value=\'' + c + '\';this.parentNode.querySelectorAll(\'div\').forEach(function(d){d.style.border=\'2px solid #475569\'});this.style.border=\'3px solid #fff\'" style="width:28px;height:28px;border-radius:50%;background:' + c + ';cursor:pointer;border:' + borde + '"></div>';
    }).join('');

    formArea.innerHTML = '' +
    '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px;margin-top:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">' + titulo + '</h3><button onclick="pdzCerrarFormulario()" style="background:none;border:none;color:#9ca3af;font-size:20px;cursor:pointer">✕</button></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
            '<div style="grid-column:1/-1"><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Nombre *</label><input type="text" id="pdz-nombre" value="' + (periodo ? periodo.name : '') + '" placeholder="Ej: Pretemporada" style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:14px"></div>' +
            '<div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Fecha inicio *</label><input type="date" id="pdz-inicio" value="' + (periodo ? periodo.date_start : '') + '" style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:14px"></div>' +
            '<div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Fecha fin *</label><input type="date" id="pdz-fin" value="' + (periodo ? periodo.date_end : '') + '" style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:14px"></div>' +
            (tipo !== 'macro' ? '<div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Pertenece a</label><select id="pdz-padre" style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:14px">' + padresHtml + '</select></div>' : '<div></div>') +
            '<div><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Color</label><input type="hidden" id="pdz-color" value="' + colorActual + '"><div style="display:flex;gap:6px;flex-wrap:wrap">' + coloresHtml + '</div></div>' +
            '<div style="grid-column:1/-1"><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Objetivo</label><textarea id="pdz-objetivo" rows="2" placeholder="Objetivo del periodo..." style="width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;resize:vertical">' + (periodo ? (periodo.objective || '') : '') + '</textarea></div>' +
            '<div style="grid-column:1/-1"><label style="font-size:12px;color:#9ca3af;display:block;margin-bottom:4px">Foco del periodo</label><div style="display:flex;flex-wrap:wrap;gap:6px">' + tagsHtml + '</div></div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">' +
            '<button onclick="pdzCerrarFormulario()" style="padding:8px 20px;background:#1e293b;border:1px solid #475569;color:#9ca3af;border-radius:8px;cursor:pointer;font-size:13px">Cancelar</button>' +
            '<button onclick="pdzGuardarPeriodo(\'' + tipo + '\', ' + (esEditar ? '\'' + editarId + '\'' : 'null') + ')" style="padding:8px 20px;background:#3b82f6;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">' + (esEditar ? 'Guardar cambios' : 'Crear ' + tipoLabel[tipo]) + '</button>' +
        '</div>' +
    '</div>';
    formArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function pdzCerrarFormulario() {
    var formArea = document.getElementById('pdz-form-area');
    if (formArea) formArea.style.display = 'none';
}

// =============================================
// GUARDAR PERIODO
// =============================================
async function pdzGuardarPeriodo(tipo, editarId) {
    var nombre = document.getElementById('pdz-nombre').value.trim();
    var inicio = document.getElementById('pdz-inicio').value;
    var fin = document.getElementById('pdz-fin').value;
    var color = document.getElementById('pdz-color').value;
    var objetivo = document.getElementById('pdz-objetivo').value.trim();
    var padreEl = document.getElementById('pdz-padre');
    var parentId = padreEl ? padreEl.value : null;
    var tags = [];
    document.querySelectorAll('.pdz-tag-check:checked').forEach(function(cb) { tags.push(cb.value); });

    if (!nombre) { showToast('El nombre es obligatorio'); return; }
    if (!inicio || !fin) { showToast('Las fechas son obligatorias'); return; }
    if (new Date(fin) < new Date(inicio)) { showToast('La fecha fin debe ser posterior al inicio'); return; }

    var datos = { club_id: clubId, season_id: seasonId, type: tipo, name: nombre, date_start: inicio, date_end: fin, color: color, objective: objetivo || null, parent_id: parentId || null, focus_tags: tags };

    try {
        if (editarId) {
            var { error } = await supabaseClient.from('training_periods').update(datos).eq('id', editarId);
            if (error) throw error;
            showToast('Periodo actualizado');
        } else {
            var { error } = await supabaseClient.from('training_periods').insert(datos);
            if (error) throw error;
            showToast('Periodo creado');
        }
        pdzCerrarFormulario();
        pdzCargarPeriodos();
    } catch(err) { showToast('Error: ' + err.message); }
}

// =============================================
// DETALLE DE UN PERIODO
// =============================================
async function pdzMostrarDetalle(id) {
    var periodo = pdz.periodos.find(function(p) { return p.id === id; });
    if (!periodo) return;
    pdz.seleccionadoId = id;
    var formArea = document.getElementById('pdz-form-area');
    var detalleArea = document.getElementById('pdz-detalle-area');
    if (formArea) formArea.style.display = 'none';
    detalleArea.style.display = 'block';

    var tipoLabel = { macro: 'Macrociclo', meso: 'Mesociclo', micro: 'Microciclo' };
    var inicio = new Date(periodo.date_start + 'T12:00:00');
    var fin = new Date(periodo.date_end + 'T12:00:00');
    var dias = Math.round((fin - inicio) / 86400000) + 1;
    var fechaFmt = function(d) { return d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear(); };

    var tagsHtml = '';
    if (periodo.focus_tags && periodo.focus_tags.length > 0) {
        tagsHtml = periodo.focus_tags.map(function(t) { return '<span style="padding:3px 10px;background:#1e293b;border:1px solid #334155;border-radius:12px;font-size:11px;color:#94a3b8">' + t + '</span>'; }).join(' ');
    }

    var padreNombre = '';
    if (periodo.parent_id) { var padre = pdz.periodos.find(function(p) { return p.id === periodo.parent_id; }); if (padre) padreNombre = padre.name; }

    var hijos = pdz.periodos.filter(function(p) { return p.parent_id === id; });
    var hijosHtml = '';
    if (hijos.length > 0) {
        hijosHtml = '<div style="margin-top:12px"><div style="font-size:11px;color:#9ca3af;margin-bottom:6px">Periodos dentro:</div>';
        hijos.forEach(function(h) { hijosHtml += '<div onclick="pdzMostrarDetalle(\'' + h.id + '\')" style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;background:' + (h.color || '#334155') + ';border-radius:6px;margin:2px 4px 2px 0;cursor:pointer;font-size:12px;color:#fff">' + h.name + '</div>'; });
        hijosHtml += '</div>';
    }

    detalleArea.innerHTML = '' +
    '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:20px;margin-top:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
            '<div style="display:flex;align-items:center;gap:10px"><div style="width:12px;height:12px;border-radius:50%;background:' + (periodo.color || '#3b82f6') + '"></div><h3 style="margin:0;color:#e2e8f0;font-size:16px">' + periodo.name + '</h3><span style="padding:2px 10px;background:#1e293b;border-radius:4px;font-size:11px;color:#9ca3af">' + tipoLabel[periodo.type] + '</span></div>' +
            '<div style="display:flex;gap:6px"><button onclick="pdzMostrarFormulario(\'' + periodo.type + '\', \'' + id + '\')" style="padding:6px 14px;background:#1e293b;border:1px solid #475569;color:#94a3b8;border-radius:6px;cursor:pointer;font-size:12px">Editar</button><button onclick="pdzEliminarPeriodo(\'' + id + '\')" style="padding:6px 14px;background:#7f1d1d;border:1px solid #dc2626;color:#fca5a5;border-radius:6px;cursor:pointer;font-size:12px">Eliminar</button><button onclick="pdzCompararPeriodo(\'' + id + '\')" style="padding:6px 14px;background:#1e3a5f;border:1px solid #2563eb;color:#93c5fd;border-radius:6px;cursor:pointer;font-size:12px">Comparar</button><button onclick="pdzExportarPDF(\'' + id + '\')" style="padding:6px 14px;background:#4c1d95;border:1px solid #7c3aed;color:#c4b5fd;border-radius:6px;cursor:pointer;font-size:12px">PDF</button><button onclick="document.getElementById(\'pdz-detalle-area\').style.display=\'none\'" style="background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer">✕</button></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:14px">' +
            '<div style="background:#1e293b;border-radius:8px;padding:10px"><div style="font-size:10px;color:#9ca3af;text-transform:uppercase">Inicio</div><div style="font-size:14px;color:#e2e8f0;font-weight:600">' + fechaFmt(inicio) + '</div></div>' +
            '<div style="background:#1e293b;border-radius:8px;padding:10px"><div style="font-size:10px;color:#9ca3af;text-transform:uppercase">Fin</div><div style="font-size:14px;color:#e2e8f0;font-weight:600">' + fechaFmt(fin) + '</div></div>' +
            '<div style="background:#1e293b;border-radius:8px;padding:10px"><div style="font-size:10px;color:#9ca3af;text-transform:uppercase">Duracion</div><div style="font-size:14px;color:#e2e8f0;font-weight:600">' + dias + ' dias</div></div>' +
            (padreNombre ? '<div style="background:#1e293b;border-radius:8px;padding:10px"><div style="font-size:10px;color:#9ca3af;text-transform:uppercase">Dentro de</div><div style="font-size:14px;color:#e2e8f0;font-weight:600">' + padreNombre + '</div></div>' : '') +
        '</div>' +
        (periodo.objective ? '<div style="margin-bottom:12px"><div style="font-size:11px;color:#9ca3af;margin-bottom:4px">Objetivo</div><div style="font-size:13px;color:#cbd5e1;background:#1e293b;padding:10px;border-radius:6px">' + periodo.objective + '</div></div>' : '') +
        (tagsHtml ? '<div style="margin-bottom:12px"><div style="font-size:11px;color:#9ca3af;margin-bottom:6px">Foco</div><div style="display:flex;flex-wrap:wrap;gap:4px">' + tagsHtml + '</div></div>' : '') +
        hijosHtml +
        '<div id="pdz-sesiones-periodo" style="margin-top:16px"><div style="color:#64748b;font-size:12px">Cargando sesiones del periodo...</div></div>' +
    '</div>';
    detalleArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    pdzCargarSesionesPeriodo(periodo);
}

// =============================================
// CARGAR SESIONES DE UN PERIODO (CON MÉTRICAS)
// =============================================
async function pdzCargarSesionesPeriodo(periodo) {
    var container = document.getElementById('pdz-sesiones-periodo');
    if (!container) return;

    try {
        var { data: sesiones, error } = await supabaseClient
            .from('training_sessions')
            .select('id, name, session_date, session_time, warm_up, main_part, cool_down, rpe, num_players')
            .eq('club_id', clubId)
            .gte('session_date', periodo.date_start)
            .lte('session_date', periodo.date_end)
            .order('session_date');

        if (error) throw error;

        if (!sesiones || sesiones.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;font-size:13px">No hay sesiones en este periodo (' + periodo.date_start + ' a ' + periodo.date_end + ')</div>';
            return;
        }

        var totalSesiones = sesiones.length;
        var totalMinutos = 0;
        var sesionesConRpe = 0;
        var sumaRpe = 0;

        sesiones.forEach(function(s) {
            totalMinutos += pdzDuracionSesion(s);
            if (s.rpe && s.rpe > 0) { sesionesConRpe++; sumaRpe += parseFloat(s.rpe); }
        });

        var rpeMedia = sesionesConRpe > 0 ? (sumaRpe / sesionesConRpe).toFixed(1) : '—';

        // Asistencia
        var sesionIds = sesiones.map(function(s) { return s.id; });
        var asistenciaMedia = '—';
        try {
            var { data: asistData } = await supabaseClient.from('asistencia_sesiones').select('sesion_id, asistio').in('sesion_id', sesionIds);
            if (asistData && asistData.length > 0) {
                var totalAsistio = asistData.filter(function(a) { return a.asistio === true; }).length;
                asistenciaMedia = Math.round((totalAsistio / asistData.length) * 100) + '%';
            }
        } catch(e) { console.warn('Error asistencia:', e); }

        var acwrInfo = pdzCalcularACWR(sesiones);
        var semanasData = pdzCargaSemanal(sesiones);

        var html = '<div style="font-size:11px;color:#9ca3af;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Metricas del periodo</div>';

        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:8px;margin-bottom:16px">';
        html += pdzMetricCard(totalSesiones, 'Sesiones', '#3b82f6');
        html += pdzMetricCard(totalMinutos, 'Min totales', '#8b5cf6');
        html += pdzMetricCard(totalSesiones > 0 ? Math.round(totalMinutos / totalSesiones) : 0, 'Min/sesion', '#06b6d4');
        html += pdzMetricCard(rpeMedia, 'RPE medio', '#f59e0b');
        html += pdzMetricCard(asistenciaMedia, 'Asistencia', '#10b981');
        html += pdzMetricCard(acwrInfo.valor, 'ACWR', acwrInfo.color);
        html += '</div>';

        if (acwrInfo.valor !== '—') {
            html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#1e293b;border-radius:8px;margin-bottom:16px;border-left:4px solid ' + acwrInfo.color + '"><div style="font-size:20px">' + acwrInfo.emoji + '</div><div><div style="font-size:13px;font-weight:600;color:#e2e8f0">' + acwrInfo.label + '</div><div style="font-size:11px;color:#94a3b8">' + acwrInfo.descripcion + '</div></div></div>';
        } else {
            html += '<div style="padding:10px 14px;background:#1e293b;border-radius:8px;margin-bottom:16px;border-left:4px solid #475569;font-size:12px;color:#94a3b8">Registra el RPE en tus sesiones para activar el calculo de carga aguda/cronica (ACWR)</div>';
        }

        if (semanasData.length > 1) {
            html += '<div style="margin-bottom:16px"><div style="font-size:11px;color:#9ca3af;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Carga semanal</div>';
            var maxCarga = Math.max.apply(null, semanasData.map(function(s) { return s.carga; }));
            if (maxCarga === 0) maxCarga = 1;
            html += '<div style="display:flex;align-items:flex-end;gap:4px;height:80px;padding:0 4px">';
            semanasData.forEach(function(sem) {
                var pct = Math.round((sem.carga / maxCarga) * 100);
                var barColor = sem.cargaRpe ? '#f59e0b' : '#3b82f6';
                html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px"><div style="font-size:9px;color:#94a3b8">' + sem.carga + '</div><div style="width:100%;height:' + Math.max(4, pct * 0.7) + 'px;background:' + barColor + ';border-radius:3px 3px 0 0"></div><div style="font-size:9px;color:#64748b;white-space:nowrap">' + sem.label + '</div></div>';
            });
            html += '</div></div>';
        }

        html += '<div style="font-size:11px;color:#9ca3af;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">Sesiones (' + totalSesiones + ')</div>';
        html += '<div style="display:flex;flex-direction:column;gap:4px">';
        sesiones.forEach(function(s) {
            var fecha = new Date(s.session_date + 'T12:00:00');
            var diaSem = ['DOM','LUN','MAR','MIE','JUE','VIE','SAB'][fecha.getDay()];
            var totalEj = ((s.warm_up||[]).length) + ((s.main_part||[]).length) + ((s.cool_down||[]).length);
            var duracion = pdzDuracionSesion(s);
            var hora = s.session_time ? s.session_time.slice(0,5) : '';
            var rpeBadge = s.rpe ? '<span style="padding:1px 6px;background:#78350f;border-radius:4px;font-size:10px;color:#fbbf24">RPE ' + s.rpe + '</span>' : '';
            html += '<div onclick="cargarSesionEnEditor(\'' + s.id + '\')" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:#1e293b;border-radius:6px;cursor:pointer;transition:background 0.2s" onmouseenter="this.style.background=\'#253348\'" onmouseleave="this.style.background=\'#1e293b\'">';
            html += '<span style="color:#64748b;font-size:11px;min-width:32px">' + diaSem + '</span>';
            html += '<span style="color:#94a3b8;font-size:12px;min-width:45px">' + fecha.getDate() + '/' + (fecha.getMonth()+1) + '</span>';
            html += (hora ? '<span style="color:#64748b;font-size:11px">' + hora + '</span>' : '');
            html += '<span style="color:#e2e8f0;font-size:13px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + s.name + '</span>';
            html += rpeBadge;
            html += '<span style="color:#64748b;font-size:11px">' + duracion + 'min</span>';
            html += '<span style="color:#64748b;font-size:11px">' + totalEj + ' ej</span></div>';
        });
        html += '</div>';
        container.innerHTML = html;
    } catch(err) {
        container.innerHTML = '<div style="color:#ef4444;font-size:12px">Error: ' + err.message + '</div>';
    }
}

// =============================================
// ELIMINAR PERIODO
// =============================================
async function pdzEliminarPeriodo(id) {
    if (!await showConfirm('¿Eliminar este periodo?')) return;
    try {
        var { error } = await supabaseClient.from('training_periods').delete().eq('id', id);
        if (error) throw error;
        showToast('Periodo eliminado');
        document.getElementById('pdz-detalle-area').style.display = 'none';
        pdzCargarPeriodos();
    } catch(err) { showToast('Error: ' + err.message); }
}

// =============================================
// HELPERS DE MÉTRICAS
// =============================================
function pdzDuracionSesion(s) {
    var cal = (s.warm_up || []).reduce(function(sum, e) { return sum + (e.duracion || 0); }, 0);
    var pri = (s.main_part || []).reduce(function(sum, e) { return sum + (e.duracion || 0); }, 0);
    var enf = (s.cool_down || []).reduce(function(sum, e) { return sum + (e.duracion || 0); }, 0);
    return cal + pri + enf;
}

function pdzMetricCard(valor, label, color) {
    return '<div style="background:#1e293b;border-radius:8px;padding:10px;text-align:center;border-top:3px solid ' + color + '"><div style="font-size:20px;font-weight:700;color:#e2e8f0">' + valor + '</div><div style="font-size:10px;color:#9ca3af;margin-top:2px">' + label + '</div></div>';
}

function pdzCalcularACWR(sesiones) {
    var sesionesConRpe = sesiones.filter(function(s) { return s.rpe && s.rpe > 0; });
    if (sesionesConRpe.length < 4) return { valor: '—', color: '#475569', emoji: '', label: 'Sin datos suficientes', descripcion: 'Se necesitan al menos 4 sesiones con RPE' };

    var ordenadas = sesionesConRpe.slice().sort(function(a, b) { return new Date(a.session_date) - new Date(b.session_date); });
    var ultimaFecha = new Date(ordenadas[ordenadas.length - 1].session_date + 'T12:00:00');
    var hace7 = new Date(ultimaFecha); hace7.setDate(hace7.getDate() - 7);
    var hace28 = new Date(ultimaFecha); hace28.setDate(hace28.getDate() - 28);
    var cargaAguda = 0, cargaCronica = 0;

    ordenadas.forEach(function(s) {
        var f = new Date(s.session_date + 'T12:00:00');
        var sRPE = parseFloat(s.rpe) * pdzDuracionSesion(s);
        if (f >= hace7) cargaAguda += sRPE;
        if (f >= hace28) cargaCronica += sRPE;
    });

    var semanas = Math.max(1, Math.min(4, Math.ceil((ultimaFecha - hace28) / (7 * 86400000))));
    var mediaCronica = cargaCronica / semanas;
    if (mediaCronica === 0) return { valor: '—', color: '#475569', emoji: '', label: 'Sin carga cronica', descripcion: 'No hay datos en las ultimas 4 semanas' };

    var acwr = cargaAguda / mediaCronica;
    var v = acwr.toFixed(2);
    if (acwr >= 0.8 && acwr <= 1.3) return { valor: v, color: '#22c55e', emoji: '✅', label: 'Zona optima (0.8 - 1.3)', descripcion: 'Carga equilibrada — bajo riesgo de lesion' };
    if (acwr > 1.3 && acwr <= 1.5) return { valor: v, color: '#f59e0b', emoji: '⚠️', label: 'Zona precaucion (1.3 - 1.5)', descripcion: 'Carga elevada — monitorizar fatiga' };
    if (acwr > 1.5) return { valor: v, color: '#ef4444', emoji: '🔴', label: 'Zona de riesgo (> 1.5)', descripcion: 'Carga excesiva — riesgo de lesion' };
    return { valor: v, color: '#06b6d4', emoji: '🔵', label: 'Carga baja (< 0.8)', descripcion: 'Posible desentrenamiento' };
}

function pdzCargaSemanal(sesiones) {
    if (sesiones.length === 0) return [];
    var semanas = {};
    sesiones.forEach(function(s) {
        var fecha = new Date(s.session_date + 'T12:00:00');
        var dia = fecha.getDay();
        var diffLunes = (dia === 0 ? -6 : 1) - dia;
        var lunes = new Date(fecha); lunes.setDate(lunes.getDate() + diffLunes);
        var clave = lunes.getFullYear() + '-' + String(lunes.getMonth()+1).padStart(2,'0') + '-' + String(lunes.getDate()).padStart(2,'0');
        if (!semanas[clave]) semanas[clave] = { fecha: lunes, duracion: 0, sRPE: 0, tieneSRPE: false };
        var dur = pdzDuracionSesion(s);
        semanas[clave].duracion += dur;
        if (s.rpe && s.rpe > 0) { semanas[clave].sRPE += parseFloat(s.rpe) * dur; semanas[clave].tieneSRPE = true; }
    });
    return Object.keys(semanas).sort().map(function(clave) {
        var sem = semanas[clave];
        return { label: sem.fecha.getDate() + '/' + (sem.fecha.getMonth()+1), carga: sem.tieneSRPE ? Math.round(sem.sRPE) : sem.duracion, cargaRpe: sem.tieneSRPE };
    });
}

// =============================================
// AUTO-RELLENAR MICROCICLO Y MD AL CAMBIAR FECHA
// =============================================
async function pdzAutoRellenar() {
    var fechaInput = document.getElementById('sesion-fecha');
    if (!fechaInput || !fechaInput.value) return;
    var fecha = fechaInput.value;

    var campoMicro = document.getElementById('sesion-microciclo');
    if (campoMicro && clubId && seasonId) {
        try {
            var { data } = await supabaseClient.from('training_periods').select('name').eq('club_id', clubId).eq('season_id', seasonId).eq('type', 'micro').lte('date_start', fecha).gte('date_end', fecha).limit(1);
            if (data && data.length > 0) campoMicro.value = data[0].name;
        } catch(e) { console.warn('Auto-micro:', e); }
    }

    var campoMD = document.getElementById('sesion-md');
    if (campoMD && clubId) {
        try {
            var fechaObj = new Date(fecha + 'T12:00:00');
            var desde = new Date(fechaObj); desde.setDate(desde.getDate() - 7);
            var hasta = new Date(fechaObj); hasta.setDate(hasta.getDate() + 7);
            var desdeStr = desde.getFullYear() + '-' + String(desde.getMonth()+1).padStart(2,'0') + '-' + String(desde.getDate()).padStart(2,'0');
            var hastaStr = hasta.getFullYear() + '-' + String(hasta.getMonth()+1).padStart(2,'0') + '-' + String(hasta.getDate()).padStart(2,'0');
            var query = supabaseClient.from('matches').select('match_date').eq('club_id', clubId).gte('match_date', desdeStr).lte('match_date', hastaStr).order('match_date');
            if (seasonId) query = query.eq('season_id', seasonId);
            var { data: partidos } = await query;
            if (partidos && partidos.length > 0) {
                var mejorDist = 999;
                partidos.forEach(function(p) { var d = Math.round((new Date(p.match_date + 'T12:00:00') - fechaObj) / 86400000); if (Math.abs(d) < Math.abs(mejorDist)) mejorDist = d; });
                if (mejorDist === 0) campoMD.value = 'MD';
                else if (mejorDist > 0) campoMD.value = 'MD-' + mejorDist;
                else campoMD.value = 'MD+' + Math.abs(mejorDist);
            }
        } catch(e) { console.warn('Auto-MD:', e); }
    }
}
// =============================================
// COMPARAR DOS PERIODOS
// =============================================
async function pdzCompararPeriodo(id) {
    var periodo = pdz.periodos.find(function(p) { return p.id === id; });
    if (!periodo) return;

    // Obtener periodos del mismo tipo para comparar
    var candidatos = pdz.periodos.filter(function(p) { return p.id !== id && p.type === periodo.type; });

    if (candidatos.length === 0) {
        showToast('No hay otros ' + periodo.type + 'ciclos para comparar');
        return;
    }

    // Crear panel de selección
    var detalleArea = document.getElementById('pdz-detalle-area');
    var existente = document.getElementById('pdz-comparar-area');
    if (existente) existente.remove();

    var opcionesHtml = candidatos.map(function(c) {
        var ini = new Date(c.date_start + 'T12:00:00');
        var fin = new Date(c.date_end + 'T12:00:00');
        return '<option value="' + c.id + '">' + c.name + ' (' + ini.getDate() + '/' + (ini.getMonth()+1) + ' - ' + fin.getDate() + '/' + (fin.getMonth()+1) + ')</option>';
    }).join('');

    var panel = document.createElement('div');
    panel.id = 'pdz-comparar-area';
    panel.innerHTML = '' +
    '<div style="background:#0f172a;border:1px solid #2563eb;border-radius:12px;padding:20px;margin-top:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
            '<h3 style="margin:0;color:#93c5fd;font-size:16px">Comparar: ' + periodo.name + ' vs...</h3>' +
            '<button onclick="document.getElementById(\'pdz-comparar-area\').remove()" style="background:none;border:none;color:#9ca3af;font-size:18px;cursor:pointer">✕</button>' +
        '</div>' +
        '<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px">' +
            '<select id="pdz-comparar-select" style="flex:1;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:14px">' + opcionesHtml + '</select>' +
            '<button onclick="pdzEjecutarComparacion(\'' + id + '\')" style="padding:8px 20px;background:#2563eb;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Comparar</button>' +
        '</div>' +
        '<div id="pdz-comparar-resultado"></div>' +
    '</div>';

    detalleArea.appendChild(panel);
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function pdzEjecutarComparacion(idA) {
    var idB = document.getElementById('pdz-comparar-select').value;
    if (!idB) { showToast('Selecciona un periodo'); return; }

    var periodoA = pdz.periodos.find(function(p) { return p.id === idA; });
    var periodoB = pdz.periodos.find(function(p) { return p.id === idB; });
    if (!periodoA || !periodoB) return;

    var container = document.getElementById('pdz-comparar-resultado');
    container.innerHTML = '<div style="color:#64748b;font-size:12px;text-align:center;padding:20px">Calculando metricas...</div>';

    var metricasA = await pdzObtenerMetricas(periodoA);
    var metricasB = await pdzObtenerMetricas(periodoB);

    var filas = [
        { label: 'Sesiones', a: metricasA.sesiones, b: metricasB.sesiones },
        { label: 'Min totales', a: metricasA.minutos, b: metricasB.minutos },
        { label: 'Min/sesion', a: metricasA.minPorSesion, b: metricasB.minPorSesion },
        { label: 'RPE medio', a: metricasA.rpeMedia, b: metricasB.rpeMedia },
        { label: 'Asistencia', a: metricasA.asistencia, b: metricasB.asistencia },
        { label: 'ACWR', a: metricasA.acwr, b: metricasB.acwr },
        { label: 'Carga total (sRPE)', a: metricasA.cargaTotal, b: metricasB.cargaTotal },
        { label: 'Dias', a: metricasA.dias, b: metricasB.dias }
    ];

    var html = '';
    // Cabecera
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;margin-bottom:2px">';
    html += '<div style="padding:10px;background:#1e293b;border-radius:8px 0 0 0;font-size:11px;color:#9ca3af;text-transform:uppercase;text-align:center">Metrica</div>';
    html += '<div style="padding:10px;background:' + (periodoA.color || '#3b82f6') + '22;border-top:3px solid ' + (periodoA.color || '#3b82f6') + ';font-size:12px;color:#e2e8f0;text-align:center;font-weight:600">' + periodoA.name + '</div>';
    html += '<div style="padding:10px;background:' + (periodoB.color || '#f97316') + '22;border-top:3px solid ' + (periodoB.color || '#f97316') + ';border-radius:0 8px 0 0;font-size:12px;color:#e2e8f0;text-align:center;font-weight:600">' + periodoB.name + '</div>';
    html += '</div>';

    // Filas
    filas.forEach(function(fila, idx) {
        var bg = idx % 2 === 0 ? '#1e293b' : '#172033';
        var valA = fila.a;
        var valB = fila.b;

        // Indicador de diferencia
        var indA = '', indB = '';
        var numA = parseFloat(valA);
        var numB = parseFloat(valB);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
            if (fila.label === 'ACWR') {
                // Para ACWR, más cerca de 1.0 es mejor
                var distA = Math.abs(numA - 1.0);
                var distB = Math.abs(numB - 1.0);
                indA = distA <= distB ? ' ✅' : '';
                indB = distB <= distA ? ' ✅' : '';
            } else if (fila.label === 'Asistencia' || fila.label === 'RPE medio') {
                // Mayor es mejor (para asistencia y RPE de trabajo)
            } else {
                // Mayor en negrita
            }
        }

        var isLast = idx === filas.length - 1;
        html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0">';
        html += '<div style="padding:8px 10px;background:' + bg + ';font-size:12px;color:#94a3b8;display:flex;align-items:center' + (isLast ? ';border-radius:0 0 0 8px' : '') + '">' + fila.label + '</div>';
        html += '<div style="padding:8px 10px;background:' + bg + ';font-size:16px;color:#e2e8f0;text-align:center;font-weight:600">' + valA + indA + '</div>';
        html += '<div style="padding:8px 10px;background:' + bg + ';font-size:16px;color:#e2e8f0;text-align:center;font-weight:600' + (isLast ? ';border-radius:0 0 8px 0' : '') + '">' + valB + indB + '</div>';
        html += '</div>';
    });

    container.innerHTML = html;
}

async function pdzObtenerMetricas(periodo) {
    var resultado = { sesiones: 0, minutos: 0, minPorSesion: 0, rpeMedia: '—', asistencia: '—', acwr: '—', cargaTotal: 0, dias: 0 };

    var inicio = new Date(periodo.date_start + 'T12:00:00');
    var fin = new Date(periodo.date_end + 'T12:00:00');
    resultado.dias = Math.round((fin - inicio) / 86400000) + 1;

    try {
        var { data: sesiones } = await supabaseClient
            .from('training_sessions')
            .select('id, warm_up, main_part, cool_down, rpe')
            .eq('club_id', clubId)
            .gte('session_date', periodo.date_start)
            .lte('session_date', periodo.date_end);

        if (!sesiones || sesiones.length === 0) return resultado;

        resultado.sesiones = sesiones.length;
        var sumaRpe = 0, countRpe = 0, sumaCarga = 0;

        sesiones.forEach(function(s) {
            var dur = pdzDuracionSesion(s);
            resultado.minutos += dur;
            if (s.rpe && s.rpe > 0) {
                countRpe++;
                sumaRpe += parseFloat(s.rpe);
                sumaCarga += parseFloat(s.rpe) * dur;
            }
        });

        resultado.minPorSesion = resultado.sesiones > 0 ? Math.round(resultado.minutos / resultado.sesiones) : 0;
        resultado.rpeMedia = countRpe > 0 ? (sumaRpe / countRpe).toFixed(1) : '—';
        resultado.cargaTotal = Math.round(sumaCarga);

        // ACWR
        var acwrInfo = pdzCalcularACWR(sesiones);
        resultado.acwr = acwrInfo.valor;

        // Asistencia
        var ids = sesiones.map(function(s) { return s.id; });
        var { data: asistData } = await supabaseClient.from('asistencia_sesiones').select('asistio').in('sesion_id', ids);
        if (asistData && asistData.length > 0) {
            var asistio = asistData.filter(function(a) { return a.asistio === true; }).length;
            resultado.asistencia = Math.round((asistio / asistData.length) * 100) + '%';
        }
    } catch(e) { console.warn('Error metricas:', e); }

    return resultado;
}

// =============================================
// EXPORTAR PDF DE UN PERIODO
// =============================================
async function pdzExportarPDF(id) {
    var periodo = pdz.periodos.find(function(p) { return p.id === id; });
    if (!periodo) return;

    showToast('Generando PDF...');

    var { jsPDF } = window.jspdf;
    var doc = new jsPDF();

    // Obtener datos del club
    var clubNombre = '';
    var clubLogo = '';
    try {
        var { data: club } = await supabaseClient.from('clubs').select('name, logo_url').eq('id', clubId).single();
        if (club) { clubNombre = club.name || ''; clubLogo = club.logo_url || ''; }
    } catch(e) {}

    var tipoLabel = { macro: 'Macrociclo', meso: 'Mesociclo', micro: 'Microciclo' };
    var inicio = new Date(periodo.date_start + 'T12:00:00');
    var fin = new Date(periodo.date_end + 'T12:00:00');
    var dias = Math.round((fin - inicio) / 86400000) + 1;
    var fechaFmt = function(d) { return d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear(); };

    // ===== HEADER =====
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');

    // Color del periodo como barra lateral
    var hex = periodo.color || '#3b82f6';
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, 5, 32, 'F');

    var tituloX = 10;
    if (clubLogo) {
        try { doc.addImage(clubLogo, 'PNG', 8, 4, 24, 24); tituloX = 36; } catch(e) {}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(periodo.name, tituloX, 14);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(tipoLabel[periodo.type] + '  |  ' + fechaFmt(inicio) + ' - ' + fechaFmt(fin) + '  |  ' + dias + ' dias', tituloX, 22);

    if (clubNombre) {
        doc.setFontSize(8);
        doc.text(clubNombre, tituloX, 28);
    }

    // Barra de color decorativa
    doc.setFillColor(r, g, b);
    doc.rect(0, 32, 210, 2, 'F');

    var y = 40;

    // ===== OBJETIVO =====
    if (periodo.objective) {
        doc.setFillColor(240, 240, 245);
        doc.rect(10, y, 190, 14, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('OBJETIVO:', 14, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        var objLines = doc.splitTextToSize(periodo.objective, 160);
        doc.text(objLines[0], 38, y + 6);
        if (objLines.length > 1) doc.text(objLines[1], 14, y + 11);
        y += 18;
    }

    // ===== FOCO TAGS =====
    if (periodo.focus_tags && periodo.focus_tags.length > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('FOCO:', 14, y + 4);
        doc.setFont('helvetica', 'normal');
        doc.text(periodo.focus_tags.join(', '), 30, y + 4);
        y += 10;
    }

    // ===== MÉTRICAS =====
    var metricas = await pdzObtenerMetricas(periodo);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('METRICAS DEL PERIODO', 14, y + 4);
    y += 8;

    var metricItems = [
        { label: 'Sesiones', valor: String(metricas.sesiones) },
        { label: 'Min totales', valor: String(metricas.minutos) },
        { label: 'Min/sesion', valor: String(metricas.minPorSesion) },
        { label: 'RPE medio', valor: String(metricas.rpeMedia) },
        { label: 'Asistencia', valor: String(metricas.asistencia) },
        { label: 'ACWR', valor: String(metricas.acwr) },
        { label: 'Carga total sRPE', valor: String(metricas.cargaTotal) }
    ];

    var colW = 27;
    metricItems.forEach(function(item, idx) {
        var mx = 10 + (idx * colW);
        doc.setFillColor(240, 240, 245);
        doc.rect(mx, y, colW - 1, 16, 'F');
        doc.setFillColor(r, g, b);
        doc.rect(mx, y, colW - 1, 2, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(item.valor, mx + (colW - 1) / 2, y + 8, { align: 'center' });

        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        doc.text(item.label, mx + (colW - 1) / 2, y + 13, { align: 'center' });
    });
    y += 22;

    // ===== SESIONES =====
    try {
        var { data: sesiones } = await supabaseClient
            .from('training_sessions')
            .select('name, session_date, session_time, warm_up, main_part, cool_down, rpe')
            .eq('club_id', clubId)
            .gte('session_date', periodo.date_start)
            .lte('session_date', periodo.date_end)
            .order('session_date');

        if (sesiones && sesiones.length > 0) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text('SESIONES (' + sesiones.length + ')', 14, y + 4);
            y += 8;

            // Cabecera tabla
            doc.setFillColor(15, 23, 42);
            doc.rect(10, y, 190, 7, 'F');
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('Fecha', 14, y + 5);
            doc.text('Hora', 40, y + 5);
            doc.text('Nombre', 58, y + 5);
            doc.text('Ejerc.', 140, y + 5);
            doc.text('Min', 160, y + 5);
            doc.text('RPE', 180, y + 5);
            y += 9;

            sesiones.forEach(function(s, idx) {
                if (y > 275) { doc.addPage(); y = 15; }

                var bg = idx % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
                doc.setFillColor(bg[0], bg[1], bg[2]);
                doc.rect(10, y, 190, 6, 'F');

                var fecha = new Date(s.session_date + 'T12:00:00');
                var diaSem = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'][fecha.getDay()];
                var fechaStr = diaSem + ' ' + fecha.getDate() + '/' + (fecha.getMonth()+1);
                var hora = s.session_time ? s.session_time.slice(0,5) : '';
                var totalEj = ((s.warm_up||[]).length) + ((s.main_part||[]).length) + ((s.cool_down||[]).length);
                var duracion = pdzDuracionSesion(s);

                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 60);
                doc.text(fechaStr, 14, y + 4);
                doc.text(hora, 40, y + 4);
                doc.text(s.name.substring(0, 40), 58, y + 4);
                doc.text(String(totalEj), 145, y + 4);
                doc.text(String(duracion), 163, y + 4);
                doc.text(s.rpe ? String(s.rpe) : '—', 183, y + 4);
                y += 7;
            });
        }
    } catch(e) { console.warn('Error sesiones PDF:', e); }

    // ===== FOOTER =====
    var totalPages = doc.internal.getNumberOfPages();
    for (var i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('TopLiderCoach.com — Informe de Periodizacion', 105, 292, { align: 'center' });
    }

    doc.save('periodo_' + periodo.name.replace(/\s+/g, '_') + '.pdf');
    showToast('PDF generado');
}
// =============================================
// REGISTRO DEL MÓDULO
// =============================================
registrarSubTab('planificador', 'periodizacion', initPeriodizacion);