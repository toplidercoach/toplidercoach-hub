// ========== RIVALES.JS - TopLiderCoach HUB ==========
// Plantillas de equipos rivales: gestion de equipos y jugadores rivales
// reutilizables en Pizarra, Plan de Partido y Analisis de Rivales.
// v2: ficha completa de jugador (pie, año, procede, foto, stats, archivos, analisis)

var RV_POSICIONES = ['Portero','Lateral Dcho.','Lateral Izdo.','Central','Central Dcho.','Central Izdo.','LT Dcho.','LT Izdo.','Mediocentro','MCD','MCO','Mediapunta','Interior','Ext Dcho.','Ext Izdo.','Delantero','2º Punta'];

var RV_LINEAS = [
    { label: 'Porteros',          color: '#22c55e', poss: ['Portero'] },
    { label: 'Linea defensiva',   color: '#3b82f6', poss: ['Lateral Dcho.','Lateral Izdo.','Central','Central Dcho.','Central Izdo.','LT Dcho.','LT Izdo.'] },
    { label: 'Linea medio campo', color: '#f59e0b', poss: ['Mediocentro','MCD','MCO','Mediapunta','Interior'] },
    { label: 'Linea delanteros',  color: '#ef4444', poss: ['Ext Dcho.','Ext Izdo.','Delantero','2º Punta'] }
];

var rvEquipos = [];
var rvJugadores = [];
var rvEquipoSel = null;

(function() {
    if (document.getElementById('rv-styles')) return;
    var st = document.createElement('style');
    st.id = 'rv-styles';
    st.textContent = ''
        + '#rivales-root { background:#0f172a; border-radius:12px; padding:20px; min-height:400px; }'
        + '.rv-layout { display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap; }'
        + '.rv-col-equipos { width:260px; flex-shrink:0; background:#1e293b; border:1px solid #334155; border-radius:10px; padding:14px; }'
        + '.rv-col-jug { flex:1; min-width:300px; background:#1e293b; border:1px solid #334155; border-radius:10px; padding:16px; }'
        + '.rv-titulo { color:#e2e8f0; font-size:16px; font-weight:700; margin:0 0 12px; }'
        + '.rv-sub { font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }'
        + '.rv-nuevo-row { display:flex; gap:6px; margin-bottom:12px; }'
        + '.rv-nuevo-row input { flex:1; padding:8px 10px; background:#0f172a; border:1px solid #334155; color:#e2e8f0; border-radius:7px; font-size:13px; min-width:0; }'
        + '.rv-btn { background:#3b82f6; border:none; color:#fff; border-radius:7px; padding:8px 12px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }'
        + '.rv-btn.verde { background:#16a34a; }'
        + '.rv-btn.gris { background:#334155; color:#cbd5e1; font-weight:400; }'
        + '.rv-equipo { display:flex; align-items:center; justify-content:space-between; gap:6px; padding:9px 10px; border-radius:8px; cursor:pointer; border:1px solid transparent; margin-bottom:4px; }'
        + '.rv-equipo:hover { background:#0f172a; }'
        + '.rv-equipo.sel { background:#1e3a5f; border-color:#3b82f6; }'
        + '.rv-equipo .nombre { color:#e2e8f0; font-size:13px; font-weight:600; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }'
        + '.rv-equipo .num { font-size:11px; color:#64748b; }'
        + '.rv-equipo .acc { display:flex; gap:2px; }'
        + '.rv-equipo .acc button { background:none; border:none; cursor:pointer; font-size:12px; padding:2px 3px; border-radius:4px; }'
        + '.rv-equipo .acc button:hover { background:#334155; }'
        + '.rv-linea-cab { display:flex; align-items:center; gap:8px; margin:14px 0 6px; }'
        + '.rv-linea-cab .barra { width:4px; height:16px; border-radius:2px; }'
        + '.rv-linea-cab .lbl { font-size:12px; font-weight:700; text-transform:uppercase; }'
        + '.rv-jug { display:flex; align-items:center; gap:10px; background:#0f172a; border:1px solid #1e3a5f; border-radius:8px; padding:8px 12px; margin-bottom:5px; }'
        + '.rv-jug .avatar { width:34px; height:34px; border-radius:50%; background:#334155; color:#facc15; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; overflow:hidden; }'
        + '.rv-jug .avatar img { width:100%; height:100%; object-fit:cover; }'
        + '.rv-jug .datos { flex:1; min-width:0; }'
        + '.rv-jug .nombre { color:#e2e8f0; font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }'
        + '.rv-jug .pos { color:#64748b; font-size:11px; }'
        + '.rv-jug .acc { display:flex; gap:4px; flex-shrink:0; }'
        + '.rv-jug .acc button { background:none; border:none; cursor:pointer; font-size:13px; padding:3px 5px; border-radius:5px; }'
        + '.rv-jug .acc button:hover { background:#1e293b; }'
        + '.rv-vacio { color:#475569; font-size:12px; text-align:center; padding:10px; background:#0f172a; border-radius:8px; }'
        // Modal ficha de jugador
        + '.rvf-ov { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:99998; display:flex; align-items:center; justify-content:center; padding:16px; }'
        + '.rvf-modal { background:#0f172a; border:1px solid #1e3a5f; border-radius:12px; max-width:640px; width:100%; max-height:88vh; overflow-y:auto; padding:22px; }'
        + '.rvf-modal h3 { margin:0 0 14px; color:#e2e8f0; font-size:16px; }'
        + '.rvf-grid { display:grid; grid-template-columns:2fr 80px 1fr; gap:10px; }'
        + '.rvf-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }'
        + '.rvf-campo { margin-bottom:11px; }'
        + '.rvf-campo label { display:block; font-size:11px; color:#9ca3af; margin-bottom:3px; }'
        + '.rvf-campo input, .rvf-campo select, .rvf-campo textarea { width:100%; padding:8px 10px; background:#1e293b; border:1px solid #334155; color:#e2e8f0; border-radius:7px; font-size:13px; font-family:inherit; box-sizing:border-box; }'
        + '.rvf-campo textarea { min-height:70px; resize:vertical; }'
        + '.rvf-foto-row { display:flex; align-items:center; gap:12px; margin-bottom:11px; }'
        + '.rvf-foto { width:56px; height:56px; border-radius:50%; background:#1e293b; border:2px dashed #334155; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0; }'
        + '.rvf-foto img { width:100%; height:100%; object-fit:cover; }'
        + '.rvf-btn-mini { padding:5px 12px; background:#1e293b; border:1px solid #334155; color:#94a3b8; border-radius:6px; cursor:pointer; font-size:11px; }'
        + '.rvf-btn-mini.rojo { background:#7f1d1d; border-color:#dc2626; color:#fca5a5; }'
        + '.rvf-archivo { display:flex; align-items:center; justify-content:space-between; gap:8px; background:#1e293b; border:1px solid #334155; border-radius:7px; padding:6px 10px; margin-bottom:5px; font-size:12px; }'
        + '.rvf-archivo a { color:#60a5fa; text-decoration:none; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }'
        + '.rvf-archivo button { background:none; border:none; color:#f87171; cursor:pointer; font-size:13px; }'
        + '.rvf-add-row { display:grid; grid-template-columns:1fr 2fr auto; gap:6px; margin-bottom:10px; }'
        + '.rvf-add-row input { padding:7px 9px; background:#1e293b; border:1px solid #334155; color:#e2e8f0; border-radius:6px; font-size:12px; box-sizing:border-box; min-width:0; }'
        + '.rvf-btns { display:flex; gap:8px; justify-content:flex-end; margin-top:14px; }'
        + '@media (max-width: 700px) { .rv-col-equipos { width:100%; } .rvf-grid, .rvf-grid-3, .rvf-add-row { grid-template-columns:1fr; } }';
    document.head.appendChild(st);
})();

registrarSubTab('matchstats', 'rivales', function() {
    rvCargar();
});

// ---------- Modales de confirmar / pedir texto ----------
function rvConfirm(msg, onOk) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    ov.innerHTML = '<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:26px 30px;max-width:360px;width:100%;text-align:center">'
        + '<p style="color:#f1f5f9;font-size:15px;margin:0 0 22px">' + msg + '</p>'
        + '<div style="display:flex;gap:12px;justify-content:center">'
        + '<button id="rvc-no" style="padding:9px 20px;border-radius:7px;border:1px solid #475569;background:transparent;color:#94a3b8;cursor:pointer;font-size:14px">Cancelar</button>'
        + '<button id="rvc-si" style="padding:9px 20px;border-radius:7px;border:none;background:#ef4444;color:#fff;cursor:pointer;font-size:14px;font-weight:600">Aceptar</button>'
        + '</div></div>';
    document.body.appendChild(ov);
    ov.querySelector('#rvc-no').onclick = function() { ov.remove(); };
    ov.querySelector('#rvc-si').onclick = function() { ov.remove(); onOk(); };
}

function rvPrompt(msg, valorInicial, onOk) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';
    ov.innerHTML = '<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:26px 30px;max-width:360px;width:100%;text-align:center">'
        + '<p style="color:#f1f5f9;font-size:15px;margin:0 0 14px">' + msg + '</p>'
        + '<input id="rvp-input" type="text" style="width:100%;padding:8px 12px;background:#0f172a;border:1px solid #475569;color:#fff;border-radius:6px;font-size:14px;margin-bottom:18px;box-sizing:border-box"/>'
        + '<div style="display:flex;gap:12px;justify-content:center">'
        + '<button id="rvp-no" style="padding:9px 20px;border-radius:7px;border:1px solid #475569;background:transparent;color:#94a3b8;cursor:pointer;font-size:14px">Cancelar</button>'
        + '<button id="rvp-si" style="padding:9px 20px;border-radius:7px;border:none;background:#3b82f6;color:#fff;cursor:pointer;font-size:14px;font-weight:600">Aceptar</button>'
        + '</div></div>';
    document.body.appendChild(ov);
    var input = ov.querySelector('#rvp-input');
    input.value = valorInicial || '';
    input.focus(); input.select();
    function aceptar() { var v = input.value.trim(); ov.remove(); if (v) onOk(v); }
    ov.querySelector('#rvp-no').onclick = function() { ov.remove(); };
    ov.querySelector('#rvp-si').onclick = aceptar;
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') aceptar(); });
}

function rvEscapar(t) {
    var d = document.createElement('div');
    d.textContent = t || '';
    return d.innerHTML;
}

// ---------- Carga de datos ----------
async function rvCargar() {
    var root = document.getElementById('rivales-root');
    if (!root) return;
    root.innerHTML = '<div class="rv-vacio">Cargando equipos rivales...</div>';
    try {
        var cId = window.clubId || clubId;
        var res = await supabaseClient
            .from('equipos_rivales')
            .select('id, nombre')
            .eq('club_id', cId)
            .order('nombre');
        if (res.error) throw res.error;
        rvEquipos = res.data || [];

        if (rvEquipoSel && !rvEquipos.some(function(e) { return e.id === rvEquipoSel; })) rvEquipoSel = null;
        if (!rvEquipoSel && rvEquipos.length > 0) rvEquipoSel = rvEquipos[0].id;

        await rvCargarJugadores();
        rvRender();
    } catch (e) {
        console.error('Error cargando rivales:', e);
        root.innerHTML = '<div class="rv-vacio">Error al cargar: ' + e.message + '</div>';
    }
}

async function rvCargarJugadores() {
    rvJugadores = [];
    if (!rvEquipoSel) return;
    var res = await supabaseClient
        .from('jugadores_rivales')
        .select('*')
        .eq('equipo_rival_id', rvEquipoSel)
        .order('dorsal');
    if (res.error) { console.error(res.error); return; }
    rvJugadores = res.data || [];
}

// ---------- Render ----------
function rvRender() {
    var root = document.getElementById('rivales-root');
    if (!root) return;

    var eqHtml = '<div class="rv-titulo">🛡️ Equipos rivales</div>'
        + '<div class="rv-nuevo-row"><input type="text" id="rv-nuevo-nombre" placeholder="Nombre del equipo..." onkeydown="if(event.key===\'Enter\')rvNuevoEquipo()"><button class="rv-btn verde" onclick="rvNuevoEquipo()">+ Crear</button></div>';
    if (rvEquipos.length === 0) {
        eqHtml += '<div class="rv-vacio">Aún no has creado ningún equipo rival.</div>';
    } else {
        rvEquipos.forEach(function(e) {
            var sel = e.id === rvEquipoSel;
            eqHtml += '<div class="rv-equipo' + (sel ? ' sel' : '') + '" onclick="rvSeleccionar(\'' + e.id + '\')">'
                + '<span class="nombre">' + rvEscapar(e.nombre) + '</span>'
                + (sel ? '<span class="num">' + rvJugadores.length + ' jug</span>' : '')
                + '<span class="acc">'
                + '<button onclick="event.stopPropagation();rvRenombrarEquipo(\'' + e.id + '\')" title="Renombrar">✏️</button>'
                + '<button onclick="event.stopPropagation();rvBorrarEquipo(\'' + e.id + '\')" title="Borrar equipo">🗑️</button>'
                + '</span></div>';
        });
    }

    var eqSel = rvEquipos.find(function(e) { return e.id === rvEquipoSel; });
    var jgHtml = '';
    if (!eqSel) {
        jgHtml = '<div class="rv-vacio" style="padding:30px">Crea o selecciona un equipo rival para gestionar sus jugadores.</div>';
    } else {
        jgHtml += '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px;flex-wrap:wrap">'
            + '<div class="rv-titulo" style="margin:0">👥 ' + rvEscapar(eqSel.nombre) + ' <span style="color:#64748b;font-size:13px;font-weight:400">(' + rvJugadores.length + ' jugadores)</span></div>'
            + '<button class="rv-btn" onclick="rvNuevoJugador()">+ Añadir jugador</button>'
            + '</div>'
            + '<div class="rv-sub">Solo el nombre es obligatorio. La ficha completa (foto, pie, stats, análisis...) se usa también en Análisis de Rivales.</div>';

        var usados = {};
        RV_LINEAS.forEach(function(lin) {
            var jl = rvJugadores.filter(function(j) { return j.posicion && lin.poss.indexOf(j.posicion) > -1; });
            jl.forEach(function(j) { usados[j.id] = true; });
            jgHtml += '<div class="rv-linea-cab"><div class="barra" style="background:' + lin.color + '"></div><span class="lbl" style="color:' + lin.color + '">' + lin.label + ' (' + jl.length + ')</span></div>';
            if (jl.length === 0) {
                jgHtml += '<div class="rv-vacio">Sin jugadores</div>';
            } else {
                jl.forEach(function(j) { jgHtml += rvJugadorHtml(j); });
            }
        });
        var sinPos = rvJugadores.filter(function(j) { return !usados[j.id]; });
        if (sinPos.length > 0) {
            jgHtml += '<div class="rv-linea-cab"><div class="barra" style="background:#64748b"></div><span class="lbl" style="color:#94a3b8">Sin posición (' + sinPos.length + ')</span></div>';
            sinPos.forEach(function(j) { jgHtml += rvJugadorHtml(j); });
        }
    }

    root.innerHTML = '<div class="rv-layout">'
        + '<div class="rv-col-equipos">' + eqHtml + '</div>'
        + '<div class="rv-col-jug">' + jgHtml + '</div>'
        + '</div>';
}

function rvJugadorHtml(j) {
    var avatar = j.foto_url
        ? '<div class="avatar"><img src="' + rvEscapar(j.foto_url) + '"></div>'
        : '<div class="avatar">' + rvEscapar(j.dorsal || '–') + '</div>';
    var meta = [];
    if (j.dorsal && j.foto_url) meta.push('Nº ' + j.dorsal);
    if (j.posicion) meta.push(j.posicion);
    if (j.pie) meta.push(j.pie);
    if (j.anio) meta.push(j.anio);
    return '<div class="rv-jug">'
        + avatar
        + '<div class="datos"><div class="nombre">' + rvEscapar(j.nombre) + '</div>'
        + (meta.length ? '<div class="pos">' + rvEscapar(meta.join(' · ')) + '</div>' : '')
        + '</div>'
        + '<div class="acc">'
        + '<button onclick="rvEditarJugador(\'' + j.id + '\')" title="Editar ficha">✏️</button>'
        + '<button onclick="rvBorrarJugador(\'' + j.id + '\')" title="Borrar">🗑️</button>'
        + '</div></div>';
}

// ---------- Equipos ----------
async function rvNuevoEquipo() {
    var input = document.getElementById('rv-nuevo-nombre');
    var nombre = input ? input.value.trim() : '';
    if (!nombre) { showToast('Escribe el nombre del equipo rival'); return; }
    try {
        var cId = window.clubId || clubId;
        var res = await supabaseClient
            .from('equipos_rivales')
            .insert({ club_id: cId, nombre: nombre })
            .select('id')
            .single();
        if (res.error) throw res.error;
        rvEquipoSel = res.data.id;
        showToast('Equipo creado');
        rvCargar();
    } catch (e) {
        showToast('Error al crear: ' + e.message);
    }
}

async function rvSeleccionar(id) {
    rvEquipoSel = id;
    await rvCargarJugadores();
    rvRender();
}

function rvRenombrarEquipo(id) {
    var e = rvEquipos.find(function(x) { return x.id === id; });
    if (!e) return;
    rvPrompt('Nuevo nombre del equipo:', e.nombre, async function(nuevo) {
        try {
            var res = await supabaseClient.from('equipos_rivales').update({ nombre: nuevo }).eq('id', id);
            if (res.error) throw res.error;
            showToast('Equipo renombrado');
            rvCargar();
        } catch (err) {
            showToast('Error: ' + err.message);
        }
    });
}

function rvBorrarEquipo(id) {
    var e = rvEquipos.find(function(x) { return x.id === id; });
    if (!e) return;
    rvConfirm('¿Borrar "' + rvEscapar(e.nombre) + '" y todos sus jugadores?', async function() {
        try {
            var res = await supabaseClient.from('equipos_rivales').delete().eq('id', id);
            if (res.error) throw res.error;
            if (rvEquipoSel === id) rvEquipoSel = null;
            showToast('Equipo borrado');
            rvCargar();
        } catch (err) {
            showToast('Error: ' + err.message);
        }
    });
}

// ---------- Jugadores: acciones desde la pestaña Rivales ----------
function rvNuevoJugador() {
    rvAbrirFichaJugador(rvEquipoSel, null, async function() {
        await rvCargarJugadores();
        rvRender();
    });
}

function rvEditarJugador(id) {
    var j = rvJugadores.find(function(x) { return x.id === id; });
    if (!j) return;
    rvAbrirFichaJugador(rvEquipoSel, j, async function() {
        await rvCargarJugadores();
        rvRender();
    });
}

function rvBorrarJugador(id) {
    var j = rvJugadores.find(function(x) { return x.id === id; });
    if (!j) return;
    rvConfirm('¿Borrar a "' + rvEscapar(j.nombre) + '"?', async function() {
        try {
            var res = await supabaseClient.from('jugadores_rivales').delete().eq('id', id);
            if (res.error) throw res.error;
            showToast('Jugador borrado');
            await rvCargarJugadores();
            rvRender();
        } catch (err) {
            showToast('Error: ' + err.message);
        }
    });
}

// ========== FICHA COMPLETA DE JUGADOR RIVAL (modal compartido) ==========
// Se usa desde la pestaña Rivales y desde Analisis de Rivales.
var _rvfFile = null;        // foto nueva pendiente de subir
var _rvfFotoUrl = null;     // url actual (o null)
var _rvfArchivos = [];      // [{titulo, url}]

function rvAbrirFichaJugador(equipoRivalId, jugador, onSaved) {
    _rvfFile = null;
    _rvfFotoUrl = jugador ? (jugador.foto_url || null) : null;
    _rvfArchivos = jugador && jugador.archivos ? JSON.parse(JSON.stringify(jugador.archivos)) : [];

    var prev = document.getElementById('rvf-ov');
    if (prev) prev.remove();

    var opciones = '<option value="">-- Sin posición --</option>';
    RV_POSICIONES.forEach(function(p) {
        opciones += '<option value="' + p + '"' + (jugador && jugador.posicion === p ? ' selected' : '') + '>' + p + '</option>';
    });
    var pies = ['Diestro','Zurdo','Ambidiestro'];
    var piesOpc = '';
    pies.forEach(function(p) {
        var sel = jugador ? (jugador.pie === p) : (p === 'Diestro');
        piesOpc += '<option value="' + p + '"' + (sel ? ' selected' : '') + '>' + p + '</option>';
    });

    var ov = document.createElement('div');
    ov.className = 'rvf-ov';
    ov.id = 'rvf-ov';
    ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
    ov.innerHTML = '<div class="rvf-modal">'
        + '<h3>' + (jugador ? '✏️ Editar jugador rival' : '➕ Nuevo jugador rival') + '</h3>'
        + '<div class="rvf-grid">'
        + '<div class="rvf-campo"><label>Nombre *</label><input type="text" id="rvf-nombre" value="' + (jugador ? rvEscapar(jugador.nombre) : '') + '" placeholder="Nombre del jugador"></div>'
        + '<div class="rvf-campo"><label>Dorsal</label><input type="text" id="rvf-dorsal" maxlength="3" value="' + (jugador ? rvEscapar(jugador.dorsal || '') : '') + '" placeholder="Nº"></div>'
        + '<div class="rvf-campo"><label>Posición</label><select id="rvf-pos">' + opciones + '</select></div>'
        + '</div>'
        + '<div class="rvf-grid-3">'
        + '<div class="rvf-campo"><label>Pie</label><select id="rvf-pie">' + piesOpc + '</select></div>'
        + '<div class="rvf-campo"><label>Año</label><input type="text" id="rvf-anio" maxlength="4" value="' + (jugador ? rvEscapar(jugador.anio || '') : '') + '" placeholder="Ej: 2001"></div>'
        + '<div class="rvf-campo"><label>Procede</label><input type="text" id="rvf-procede" value="' + (jugador ? rvEscapar(jugador.procede || '') : '') + '" placeholder="Club anterior"></div>'
        + '</div>'
        + '<div class="rvf-foto-row">'
        + '<div class="rvf-foto" id="rvf-foto-prev">' + (_rvfFotoUrl ? '<img src="' + rvEscapar(_rvfFotoUrl) + '">' : '<span style="font-size:20px;color:#475569">📷</span>') + '</div>'
        + '<div style="display:flex;flex-direction:column;gap:4px">'
        + '<button type="button" class="rvf-btn-mini" onclick="document.getElementById(\'rvf-foto-input\').click()">📷 Subir foto</button>'
        + '<button type="button" class="rvf-btn-mini rojo" id="rvf-foto-quitar" style="display:' + (_rvfFotoUrl ? 'block' : 'none') + '" onclick="rvfQuitarFoto()">Quitar</button>'
        + '</div>'
        + '<input type="file" id="rvf-foto-input" accept="image/*" style="display:none" onchange="rvfPreviewFoto(this)">'
        + '</div>'
        + '<div class="rvf-grid-3">'
        + '<div class="rvf-campo"><label>PJ</label><input type="number" id="rvf-pj" min="0" value="' + (jugador && jugador.pj != null ? jugador.pj : '') + '"></div>'
        + '<div class="rvf-campo"><label>Min</label><input type="number" id="rvf-min" min="0" value="' + (jugador && jugador.minutos != null ? jugador.minutos : '') + '"></div>'
        + '<div class="rvf-campo"><label>Goles</label><input type="number" id="rvf-goles" min="0" value="' + (jugador && jugador.goles != null ? jugador.goles : '') + '"></div>'
        + '</div>'
        + '<div class="rvf-campo"><label>Archivos (vídeos o enlaces del jugador)</label>'
        + '<div id="rvf-archivos-lista"></div>'
        + '<div class="rvf-add-row"><input type="text" id="rvf-arch-titulo" placeholder="Título"><input type="text" id="rvf-arch-url" placeholder="Enlace (YouTube, Veo...)"><button type="button" class="rvf-btn-mini" onclick="rvfAgregarArchivo()">+ Añadir</button></div>'
        + '</div>'
        + '<div class="rvf-campo"><label>Análisis del jugador</label><textarea id="rvf-analisis" placeholder="Características, cómo juega, cómo defenderle...">' + (jugador ? rvEscapar(jugador.analisis || '') : '') + '</textarea></div>'
        + '<div class="rvf-btns">'
        + '<button class="rv-btn gris" onclick="document.getElementById(\'rvf-ov\').remove()">Cancelar</button>'
        + '<button class="rv-btn verde" id="rvf-guardar-btn">' + (jugador ? 'Guardar cambios' : 'Añadir jugador') + '</button>'
        + '</div></div>';
    document.body.appendChild(ov);
    rvfRenderArchivos();
    document.getElementById('rvf-nombre').focus();
    document.getElementById('rvf-guardar-btn').onclick = function() {
        rvfGuardar(equipoRivalId, jugador ? jugador.id : null, onSaved);
    };
}

function rvfPreviewFoto(input) {
    var file = input.files[0];
    if (!file) return;
    _rvfFile = file;
    var reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('rvf-foto-prev').innerHTML = '<img src="' + e.target.result + '">';
        document.getElementById('rvf-foto-quitar').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function rvfQuitarFoto() {
    _rvfFile = null;
    _rvfFotoUrl = null;
    document.getElementById('rvf-foto-prev').innerHTML = '<span style="font-size:20px;color:#475569">📷</span>';
    document.getElementById('rvf-foto-quitar').style.display = 'none';
    document.getElementById('rvf-foto-input').value = '';
}

function rvfRenderArchivos() {
    var cont = document.getElementById('rvf-archivos-lista');
    if (!cont) return;
    if (_rvfArchivos.length === 0) { cont.innerHTML = ''; return; }
    var h = '';
    _rvfArchivos.forEach(function(a, i) {
        h += '<div class="rvf-archivo"><a href="' + rvEscapar(a.url) + '" target="_blank">🎬 ' + rvEscapar(a.titulo || a.url) + '</a><button onclick="rvfQuitarArchivo(' + i + ')" title="Quitar">✕</button></div>';
    });
    cont.innerHTML = h;
}

function rvfAgregarArchivo() {
    var t = document.getElementById('rvf-arch-titulo').value.trim();
    var u = document.getElementById('rvf-arch-url').value.trim();
    if (!u) { showToast('Pega el enlace del archivo'); return; }
    _rvfArchivos.push({ titulo: t, url: u });
    document.getElementById('rvf-arch-titulo').value = '';
    document.getElementById('rvf-arch-url').value = '';
    rvfRenderArchivos();
}

function rvfQuitarArchivo(i) {
    _rvfArchivos.splice(i, 1);
    rvfRenderArchivos();
}

async function rvfGuardar(equipoRivalId, jugadorId, onSaved) {
    var nombre = document.getElementById('rvf-nombre').value.trim();
    if (!nombre) { showToast('El nombre es obligatorio'); return; }
    var btn = document.getElementById('rvf-guardar-btn');
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    try {
        var fotoUrl = _rvfFotoUrl;
        if (_rvfFile) {
            var ext = _rvfFile.name.split('.').pop();
            var fileName = 'rival-' + Date.now() + '.' + ext;
            var up = await supabaseClient.storage.from('logos').upload(fileName, _rvfFile);
            if (up.error) throw up.error;
            var urlData = supabaseClient.storage.from('logos').getPublicUrl(fileName);
            fotoUrl = urlData.data.publicUrl;
        }
        var numOrNull = function(id) {
            var v = document.getElementById(id).value;
            return v === '' ? null : parseInt(v, 10);
        };
        var payload = {
            nombre: nombre,
            dorsal: document.getElementById('rvf-dorsal').value.trim() || null,
            posicion: document.getElementById('rvf-pos').value || null,
            pie: document.getElementById('rvf-pie').value || null,
            anio: document.getElementById('rvf-anio').value.trim() || null,
            procede: document.getElementById('rvf-procede').value.trim() || null,
            foto_url: fotoUrl,
            pj: numOrNull('rvf-pj'),
            minutos: numOrNull('rvf-min'),
            goles: numOrNull('rvf-goles'),
            analisis: document.getElementById('rvf-analisis').value.trim() || null,
            archivos: _rvfArchivos
        };
        if (jugadorId) {
            var res = await supabaseClient.from('jugadores_rivales').update(payload).eq('id', jugadorId);
            if (res.error) throw res.error;
            showToast('Jugador actualizado');
        } else {
            payload.equipo_rival_id = equipoRivalId;
            var res2 = await supabaseClient.from('jugadores_rivales').insert(payload);
            if (res2.error) throw res2.error;
            showToast('Jugador añadido');
        }
        var ovf = document.getElementById('rvf-ov');
        if (ovf) ovf.remove();
        if (onSaved) onSaved();
    } catch (e) {
        console.error('Error guardando jugador rival:', e);
        showToast('Error al guardar: ' + e.message);
        btn.disabled = false;
        btn.textContent = 'Guardar';
    }
}
