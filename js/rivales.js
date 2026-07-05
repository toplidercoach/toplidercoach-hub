// ========== RIVALES.JS - TopLiderCoach HUB ==========
// Plantillas de equipos rivales: gestion de equipos y jugadores rivales
// reutilizables en Pizarra y Plan de Partido.

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
var rvEditandoJugadorId = null;

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
        + '.rv-jug .dorsal { width:28px; height:28px; border-radius:50%; background:#334155; color:#facc15; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; }'
        + '.rv-jug .datos { flex:1; min-width:0; }'
        + '.rv-jug .nombre { color:#e2e8f0; font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }'
        + '.rv-jug .pos { color:#64748b; font-size:11px; }'
        + '.rv-jug .acc { display:flex; gap:4px; flex-shrink:0; }'
        + '.rv-jug .acc button { background:none; border:none; cursor:pointer; font-size:13px; padding:3px 5px; border-radius:5px; }'
        + '.rv-jug .acc button:hover { background:#1e293b; }'
        + '.rv-vacio { color:#475569; font-size:12px; text-align:center; padding:10px; background:#0f172a; border-radius:8px; }'
        + '.rv-form { background:#0f172a; border:1px solid #3b82f6; border-radius:10px; padding:14px; margin-bottom:14px; }'
        + '.rv-form-grid { display:grid; grid-template-columns:2fr 80px 1fr; gap:8px; margin-bottom:10px; }'
        + '.rv-form label { display:block; font-size:11px; color:#9ca3af; margin-bottom:3px; }'
        + '.rv-form input, .rv-form select { width:100%; padding:8px 10px; background:#1e293b; border:1px solid #334155; color:#e2e8f0; border-radius:7px; font-size:13px; box-sizing:border-box; }'
        + '.rv-form-btns { display:flex; gap:8px; justify-content:flex-end; }'
        + '@media (max-width: 700px) { .rv-col-equipos { width:100%; } .rv-form-grid { grid-template-columns:1fr; } }';
    document.head.appendChild(st);
})();

registrarSubTab('matchstats', 'rivales', function() {
    rvCargar();
});

// ---------- Modales propios (confirmar / pedir texto) ----------
function rvConfirm(msg, onOk) {
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px;';
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
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px;';
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
        .select('id, nombre, dorsal, posicion')
        .eq('equipo_rival_id', rvEquipoSel)
        .order('dorsal');
    if (res.error) { console.error(res.error); return; }
    rvJugadores = res.data || [];
}

// ---------- Render ----------
function rvRender() {
    var root = document.getElementById('rivales-root');
    if (!root) return;

    // Columna de equipos
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

    // Columna de jugadores
    var eqSel = rvEquipos.find(function(e) { return e.id === rvEquipoSel; });
    var jgHtml = '';
    if (!eqSel) {
        jgHtml = '<div class="rv-vacio" style="padding:30px">Crea o selecciona un equipo rival para gestionar sus jugadores.</div>';
    } else {
        jgHtml += '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px;flex-wrap:wrap">'
            + '<div class="rv-titulo" style="margin:0">👥 ' + rvEscapar(eqSel.nombre) + ' <span style="color:#64748b;font-size:13px;font-weight:400">(' + rvJugadores.length + ' jugadores)</span></div>'
            + '<button class="rv-btn" onclick="rvAbrirFormJugador(null)">+ Añadir jugador</button>'
            + '</div>'
            + '<div class="rv-sub">Solo el nombre es obligatorio. La posición sirve para agruparlos por líneas y usarlos en el Plan de Partido.</div>'
            + '<div id="rv-form-area"></div>';

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
    return '<div class="rv-jug">'
        + '<div class="dorsal">' + rvEscapar(j.dorsal || '–') + '</div>'
        + '<div class="datos"><div class="nombre">' + rvEscapar(j.nombre) + '</div>'
        + (j.posicion ? '<div class="pos">' + rvEscapar(j.posicion) + '</div>' : '')
        + '</div>'
        + '<div class="acc">'
        + '<button onclick="rvAbrirFormJugador(\'' + j.id + '\')" title="Editar">✏️</button>'
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
    rvEditandoJugadorId = null;
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

// ---------- Jugadores ----------
function rvAbrirFormJugador(idEdicion) {
    rvEditandoJugadorId = idEdicion || null;
    var area = document.getElementById('rv-form-area');
    if (!area) return;
    var j = idEdicion ? rvJugadores.find(function(x) { return x.id === idEdicion; }) : null;

    var opciones = '<option value="">-- Sin posición --</option>';
    RV_POSICIONES.forEach(function(p) {
        opciones += '<option value="' + p + '"' + (j && j.posicion === p ? ' selected' : '') + '>' + p + '</option>';
    });

    area.innerHTML = '<div class="rv-form">'
        + '<div class="rv-form-grid">'
        + '<div><label>Nombre *</label><input type="text" id="rv-jug-nombre" value="' + (j ? rvEscapar(j.nombre) : '') + '" placeholder="Nombre del jugador"></div>'
        + '<div><label>Dorsal</label><input type="text" id="rv-jug-dorsal" maxlength="3" value="' + (j ? rvEscapar(j.dorsal || '') : '') + '" placeholder="Nº"></div>'
        + '<div><label>Posición</label><select id="rv-jug-pos">' + opciones + '</select></div>'
        + '</div>'
        + '<div class="rv-form-btns">'
        + '<button class="rv-btn gris" onclick="rvCerrarFormJugador()">Cancelar</button>'
        + '<button class="rv-btn verde" onclick="rvGuardarJugador()">' + (idEdicion ? 'Guardar cambios' : 'Añadir jugador') + '</button>'
        + '</div></div>';
    document.getElementById('rv-jug-nombre').focus();
}

function rvCerrarFormJugador() {
    rvEditandoJugadorId = null;
    var area = document.getElementById('rv-form-area');
    if (area) area.innerHTML = '';
}

async function rvGuardarJugador() {
    var nombre = document.getElementById('rv-jug-nombre').value.trim();
    var dorsal = document.getElementById('rv-jug-dorsal').value.trim();
    var pos = document.getElementById('rv-jug-pos').value;
    if (!nombre) { showToast('El nombre es obligatorio'); return; }
    try {
        if (rvEditandoJugadorId) {
            var res = await supabaseClient
                .from('jugadores_rivales')
                .update({ nombre: nombre, dorsal: dorsal || null, posicion: pos || null })
                .eq('id', rvEditandoJugadorId);
            if (res.error) throw res.error;
            showToast('Jugador actualizado');
        } else {
            var res2 = await supabaseClient
                .from('jugadores_rivales')
                .insert({ equipo_rival_id: rvEquipoSel, nombre: nombre, dorsal: dorsal || null, posicion: pos || null });
            if (res2.error) throw res2.error;
            showToast('Jugador añadido');
        }
        rvEditandoJugadorId = null;
        await rvCargarJugadores();
        rvRender();
        // Tras añadir, dejar el formulario abierto para meter varios seguidos
        if (!rvEditandoJugadorId) rvAbrirFormJugador(null);
    } catch (e) {
        showToast('Error al guardar: ' + e.message);
    }
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
