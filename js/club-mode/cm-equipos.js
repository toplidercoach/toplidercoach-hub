// ============================================================
// CM-EQUIPOS.JS — Gestion de equipos del club dentro del HUB (pestana Club › Equipos)
// Permite al administrador del club crear equipos (uno o varios de golpe), editarlos
// y desactivarlos, sin salir del HUB y sea cual sea la forma en que entro (email del club
// o cuenta WordPress). Tabla: club_teams (id, club_id, name, category, gender,
// color_primary, color_secondary, active, notes).
// - No se borra ningun equipo: "desactivar" lo oculta y conserva todos sus datos.
// - Al cambiar la lista se refresca el selector de equipo de la cabecera, sin recargar.
// Lo monta cm-miembros.js llamando a cmEquiposInit('cm-pane-equipos'). Cargar ANTES de cm-miembros.js o despues: da igual.
// ============================================================
(function () {
    'use strict';
    var CATS = ['Senior', 'Juvenil', 'Cadete', 'Infantil', 'Alevin', 'Benjamin', 'Prebenjamin', 'Debutante', 'Veteranos'];
    var CAT_LBL = { Alevin: 'Alevín', Benjamin: 'Benjamín', Prebenjamin: 'Prebenjamín' };
    var GENS = [['', 'Sin indicar'], ['masculino', 'Masculino'], ['femenino', 'Femenino'], ['mixto', 'Mixto']];
    var COLORES = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#0f172a'];
    var S = { cont: null, equipos: [], inactivos: [], verInactivos: false, ocupado: false };

    function esc(t) { return String(t === null || t === undefined ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function aviso(m, tipo) { if (typeof showToast === 'function') showToast(m, tipo || 'success'); }
    function club() { try { return (typeof clubId !== 'undefined') ? clubId : null; } catch (e) { return null; } }
    function catLbl(c) { if (!c) return ''; var k = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase(); return CAT_LBL[k] || k; }
    function norm(s) { return String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' '); }

    var CSS = ''
        + '.cme-intro{background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;border-radius:10px;padding:12px 14px;font-size:13.5px;line-height:1.5;margin-bottom:14px}'
        + '.cme-intro b{color:#1e40af}'
        + '.cme-row{display:flex;align-items:center;gap:12px;padding:11px 12px;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:8px;background:#fff}'
        + '.cme-row.off{opacity:.6;background:#f9fafb}'
        + '.cme-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;border:1px solid rgba(0,0,0,.15)}'
        + '.cme-row .nm{font-weight:600;color:#111827;font-size:14.5px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
        + '.cme-tag{font-size:11.5px;background:#f3f4f6;color:#4b5563;border-radius:999px;padding:3px 9px;white-space:nowrap}'
        + '.cme-tag.sel{background:#dbeafe;color:#1d4ed8;font-weight:600}'
        + '.cme-row button{font:600 12.5px system-ui,sans-serif;border:1px solid #d1d5db;background:#fff;color:#374151;border-radius:7px;padding:6px 10px;cursor:pointer;white-space:nowrap}'
        + '.cme-row button:hover{background:#f3f4f6}'
        + '.cme-row button.pel{color:#b91c1c;border-color:#fecaca}'
        + '.cme-vacio{text-align:center;color:#9ca3af;padding:26px;font-size:14px}'
        + '.cme-link{background:none;border:0;color:#6b7280;font-size:12.5px;cursor:pointer;text-decoration:underline;padding:6px 2px}'
        + '.cme-bg{position:fixed;inset:0;z-index:9800;background:rgba(15,23,42,.6);display:flex;align-items:center;justify-content:center;padding:16px}'
        + '.cme-modal{background:#fff;color:#111827;border-radius:14px;max-width:520px;width:100%;max-height:calc(100vh - 32px);overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.35);font:14px/1.45 system-ui,sans-serif}'
        + '.cme-modal .hd{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid #e5e7eb}'
        + '.cme-modal .hd h3{margin:0;font-size:17px}'
        + '.cme-modal .hd button{background:none;border:0;font-size:22px;line-height:1;cursor:pointer;color:#6b7280}'
        + '.cme-modal .bd{padding:16px 18px}'
        + '.cme-modal label{display:block;font-size:12.5px;font-weight:600;color:#374151;margin:0 0 5px}'
        + '.cme-modal input[type=text],.cme-modal select,.cme-modal textarea{width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:8px;padding:9px 11px;font:inherit;font-size:14px;color:#111827;background:#fff}'
        + '.cme-modal textarea{min-height:150px;resize:vertical}'
        + '.cme-modal .g{margin-bottom:14px}'
        + '.cme-modal .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}'
        + '.cme-modal small{display:block;color:#6b7280;font-size:12px;margin-top:4px}'
        + '.cme-cols{display:flex;gap:8px;flex-wrap:wrap}'
        + '.cme-cols button{width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0}'
        + '.cme-cols button.on{border-color:#111827;box-shadow:0 0 0 2px #fff inset}'
        + '.cme-modal .ft{display:flex;justify-content:flex-end;gap:8px;padding:14px 18px;border-top:1px solid #e5e7eb}'
        + '.cme-modal .ft button{font:600 14px system-ui,sans-serif;border-radius:8px;padding:9px 16px;cursor:pointer;border:1px solid #d1d5db;background:#fff;color:#374151}'
        + '.cme-modal .ft button.ok{background:#2563eb;border-color:#2563eb;color:#fff}'
        + '.cme-modal .ft button:disabled{opacity:.6;cursor:default}'
        + '.cme-tabs{display:flex;gap:6px;margin-bottom:14px}'
        + '.cme-tabs button{flex:1;font:600 13px system-ui,sans-serif;border:1px solid #d1d5db;background:#fff;color:#374151;border-radius:8px;padding:8px;cursor:pointer}'
        + '.cme-tabs button.on{background:#eff6ff;border-color:#2563eb;color:#1d4ed8}'
        + '@media (max-width:560px){.cme-modal .g2{grid-template-columns:1fr}.cme-row{flex-wrap:wrap}.cme-row .nm{flex-basis:60%}}';

    /* ---------- Datos ---------- */
    async function cargar() {
        var r = await supabaseClient.from('club_teams').select('*').eq('club_id', club()).order('category').order('name').range(0, 999);
        var todos = (r && r.data) || [];
        S.equipos = todos.filter(function (e) { return e.active !== false; });
        S.inactivos = todos.filter(function (e) { return e.active === false; });
    }

    // Refresca el estado del Club Mode y el selector de la cabecera sin recargar la pagina
    function sincronizar() {
        try {
            var st = window.cmState; if (!st || !st.activo) return;
            st.equipos = S.equipos.slice();
            if (st.esAdmin || st.teamScope === 'all') st.equiposAcceso = S.equipos.slice();
            else st.equiposAcceso = (st.equiposAcceso || []).filter(function (e) { return S.equipos.some(function (x) { return x.id === e.id; }); });
            if (st.equipoSeleccionado) {
                var sigue = st.equiposAcceso.filter(function (e) { return e.id === st.equipoSeleccionado.id; })[0];
                st.equipoSeleccionado = sigue || st.equiposAcceso[0] || null;
                try { if (st.equipoSeleccionado) localStorage.setItem('cm_team_selected', st.equipoSeleccionado.id); } catch (e) {}
            } else if (st.equiposAcceso.length === 1) { st.equipoSeleccionado = st.equiposAcceso[0]; }
            var badge = document.getElementById('club-badge');
            var c = document.getElementById('cm-team-selector');
            if (!c && badge && st.equiposAcceso.length) {
                c = document.createElement('div'); c.id = 'cm-team-selector';
                c.style.cssText = 'display:inline-flex;align-items:center;gap:8px;margin-left:12px;';
                badge.parentNode.insertBefore(c, badge.nextSibling);
            }
            if (c) {
                var ops = st.equiposAcceso.length > 1 ? '<option value="__all__"' + (st.equipoSeleccionado ? '' : ' selected') + '>Todos mis equipos (' + st.equiposAcceso.length + ')</option>' : '';
                ops += st.equiposAcceso.map(function (e) {
                    return '<option value="' + e.id + '"' + (st.equipoSeleccionado && st.equipoSeleccionado.id === e.id ? ' selected' : '') + '>' + esc(e.name) + (e.category ? ' (' + esc(catLbl(e.category)) + ')' : '') + '</option>';
                }).join('');
                c.innerHTML = '<select id="cm-team-select" onchange="cmSeleccionarEquipo(this.value)" style="background:#1a1a2e;border:1px solid rgba(56,130,246,0.3);color:#e2e8f0;padding:5px 10px;border-radius:8px;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;outline:none">' + ops + '</select>';
            }
            if (typeof window.cmMRecargarEquipos === 'function') window.cmMRecargarEquipos();
        } catch (e) { console.warn('[cm-equipos] No se pudo refrescar el selector:', e); }
    }

    /* ---------- Pintar ---------- */
    function fila(e, activo) {
        var st = window.cmState, sel = st && st.equipoSeleccionado && st.equipoSeleccionado.id === e.id;
        return '<div class="cme-row' + (activo ? '' : ' off') + '">'
            + '<span class="cme-dot" style="background:' + esc(e.color_primary || '#3b82f6') + '"></span>'
            + '<span class="nm">' + esc(e.name) + '</span>'
            + (e.category ? '<span class="cme-tag">' + esc(catLbl(e.category)) + '</span>' : '')
            + (e.gender ? '<span class="cme-tag">' + esc(e.gender.charAt(0).toUpperCase() + e.gender.slice(1)) + '</span>' : '')
            + (sel && activo ? '<span class="cme-tag sel">Seleccionado</span>' : '')
            + (activo
                ? '<button type="button" onclick="cmEquiposEditar(\'' + e.id + '\')">Editar</button><button type="button" class="pel" onclick="cmEquiposDesactivar(\'' + e.id + '\')">Desactivar</button>'
                : '<button type="button" onclick="cmEquiposReactivar(\'' + e.id + '\')">Reactivar</button>')
            + '</div>';
    }
    function pintar() {
        if (!S.cont) return;
        var h = '<style>' + CSS + '</style>';
        h += '<div class="cm-card"><div class="cm-card-head"><h3>Equipos del club <span style="font-weight:500;color:#6b7280;font-size:14px">(' + S.equipos.length + ')</span></h3>'
           + '<button class="btn btn-sm btn-primary" onclick="cmEquiposNuevo()">+ Añadir equipos</button></div><div class="cm-card-body">';
        if (S.equipos.length <= 1) {
            h += '<div class="cme-intro"><b>Crea aquí todos los equipos de tu club.</b> Cada equipo tiene su propia plantilla, sesiones, partidos y estadísticas. '
               + 'Después, en la pestaña <b>Miembros</b>, das acceso a cada entrenador y le asignas su equipo. Arriba, junto al nombre del club, aparecerá un selector para cambiar de uno a otro.</div>';
        }
        if (!S.equipos.length) h += '<div class="cme-vacio">Todavía no hay equipos. Pulsa «+ Añadir equipos».</div>';
        S.equipos.forEach(function (e) { h += fila(e, true); });
        if (S.inactivos.length) {
            h += '<button type="button" class="cme-link" onclick="cmEquiposVerInactivos()">' + (S.verInactivos ? 'Ocultar' : 'Ver') + ' equipos desactivados (' + S.inactivos.length + ')</button>';
            if (S.verInactivos) S.inactivos.forEach(function (e) { h += fila(e, false); });
        }
        h += '</div></div>';
        S.cont.innerHTML = h;
    }

    /* ---------- Modal ---------- */
    function cerrar() { var m = document.getElementById('cme-modal'); if (m) m.remove(); }
    function selCat(v) {
        var actual = v ? catLbl(v) : '';
        var extra = v && CATS.map(norm).indexOf(norm(v)) < 0 ? '<option value="' + esc(v) + '" selected>' + esc(actual) + '</option>' : '';
        return '<option value="">Sin categoría</option>' + extra + CATS.map(function (c) { return '<option value="' + c + '"' + (norm(c) === norm(v) ? ' selected' : '') + '>' + (CAT_LBL[c] || c) + '</option>'; }).join('');
    }
    function selGen(v) { return GENS.map(function (g) { return '<option value="' + g[0] + '"' + ((v || '') === g[0] ? ' selected' : '') + '>' + g[1] + '</option>'; }).join(''); }
    function colores(v) {
        v = v || COLORES[0];
        var lista = COLORES.indexOf(v) < 0 ? [v].concat(COLORES) : COLORES;
        return '<div class="cme-cols" id="cme-cols">' + lista.map(function (c) { return '<button type="button" data-c="' + c + '" class="' + (c === v ? 'on' : '') + '" style="background:' + c + '" title="' + c + '"></button>'; }).join('') + '</div>';
    }
    function colorElegido() { var b = document.querySelector('#cme-cols button.on'); return b ? b.dataset.c : COLORES[0]; }
    function engancharColores() {
        Array.prototype.forEach.call(document.querySelectorAll('#cme-cols button'), function (b) {
            b.onclick = function () { Array.prototype.forEach.call(document.querySelectorAll('#cme-cols button'), function (x) { x.classList.remove('on'); }); b.classList.add('on'); };
        });
    }
    function abrir(e) {
        cerrar();
        var varios = !e;
        var m = document.createElement('div'); m.className = 'cme-bg'; m.id = 'cme-modal';
        m.innerHTML = '<div class="cme-modal"><div class="hd"><h3>' + (e ? 'Editar equipo' : 'Añadir equipos') + '</h3><button type="button" id="cme-x">&times;</button></div><div class="bd">'
            + (e
                ? '<div class="g"><label>Nombre del equipo *</label><input type="text" id="cme-nombre" maxlength="80" value="' + esc(e.name) + '"></div>'
                : '<div class="g"><label>Nombres de los equipos *</label><textarea id="cme-nombres" placeholder="Uno por línea. Por ejemplo:\nJuvenil A\nJuvenil B\nCadete A"></textarea><small>Puedes escribir uno solo o pegar la lista completa: se crean todos de una vez.</small></div>')
            + '<div class="g2"><div class="g"><label>Categoría</label><select id="cme-cat">' + selCat(e && e.category) + '</select>' + (varios ? '<small>Se aplica a todos. Luego puedes cambiarla equipo a equipo.</small>' : '') + '</div>'
            + '<div class="g"><label>Género</label><select id="cme-gen">' + selGen(e && e.gender) + '</select></div></div>'
            + '<div class="g"><label>Color</label>' + colores(e && e.color_primary) + '</div>'
            + '</div><div class="ft"><button type="button" id="cme-no">Cancelar</button><button type="button" class="ok" id="cme-ok">' + (e ? 'Guardar' : 'Crear') + '</button></div></div>';
        document.body.appendChild(m);
        engancharColores();
        document.getElementById('cme-x').onclick = cerrar;
        document.getElementById('cme-no').onclick = cerrar;
        document.getElementById('cme-ok').onclick = function () { guardar(e); };
        var f = document.getElementById(e ? 'cme-nombre' : 'cme-nombres'); if (f) f.focus();
    }

    async function guardar(e) {
        if (S.ocupado) return;
        var cat = document.getElementById('cme-cat').value || null;
        var gen = document.getElementById('cme-gen').value || null;
        var col = colorElegido();
        var btn = document.getElementById('cme-ok');
        var existentes = S.equipos.concat(S.inactivos);
        try {
            if (e) {
                var nombre = document.getElementById('cme-nombre').value.trim();
                if (!nombre) { aviso('Escribe el nombre del equipo', 'error'); return; }
                if (existentes.some(function (x) { return x.id !== e.id && norm(x.name) === norm(nombre); })) { aviso('Ya hay otro equipo con ese nombre', 'error'); return; }
                S.ocupado = true; btn.disabled = true; btn.textContent = 'Guardando…';
                var r = await supabaseClient.from('club_teams').update({ name: nombre, category: cat, gender: gen, color_primary: col }).eq('id', e.id).eq('club_id', club());
                if (r.error) throw r.error;
                aviso('Equipo actualizado');
            } else {
                var vistos = {}, nuevos = [], repetidos = [];
                document.getElementById('cme-nombres').value.split(/\r?\n/).forEach(function (l) {
                    var n = l.trim().slice(0, 80); if (!n) return;
                    var k = norm(n);
                    if (vistos[k] || existentes.some(function (x) { return norm(x.name) === k; })) { repetidos.push(n); return; }
                    vistos[k] = 1; nuevos.push(n);
                });
                if (!nuevos.length) { aviso(repetidos.length ? 'Esos equipos ya existen' : 'Escribe al menos un nombre', 'error'); return; }
                if (nuevos.length > 60) { aviso('Como mucho 60 equipos de una vez', 'error'); return; }
                S.ocupado = true; btn.disabled = true; btn.textContent = 'Creando…';
                var filas = nuevos.map(function (n) { return { club_id: club(), name: n, category: cat, gender: gen, color_primary: col, color_secondary: '#1e40af', active: true }; });
                var r2 = await supabaseClient.from('club_teams').insert(filas);
                if (r2.error) throw r2.error;
                aviso(nuevos.length === 1 ? 'Equipo creado' : nuevos.length + ' equipos creados' + (repetidos.length ? ' (' + repetidos.length + ' ya existían)' : ''));
            }
            cerrar();
            await cargar(); pintar(); sincronizar();
        } catch (err) {
            console.error('[cm-equipos]', err);
            aviso('No se ha podido guardar: ' + (err && err.message ? err.message : 'error'), 'error');
            if (btn) { btn.disabled = false; btn.textContent = e ? 'Guardar' : 'Crear'; }
        } finally { S.ocupado = false; }
    }

    async function cambiarActivo(id, activo) {
        var e = S.equipos.concat(S.inactivos).filter(function (x) { return x.id === id; })[0]; if (!e) return;
        if (!activo) {
            if (S.equipos.length <= 1) { aviso('El club necesita al menos un equipo activo', 'error'); return; }
            if (!confirm('¿Desactivar «' + e.name + '»?\n\nDejará de aparecer en el selector y en las listas, pero NO se borra nada: su plantilla, sesiones y partidos se conservan y puedes reactivarlo cuando quieras.')) return;
        }
        var r = await supabaseClient.from('club_teams').update({ active: activo }).eq('id', id).eq('club_id', club());
        if (r.error) { aviso('No se ha podido cambiar: ' + r.error.message, 'error'); return; }
        aviso(activo ? 'Equipo reactivado' : 'Equipo desactivado');
        await cargar(); pintar(); sincronizar();
    }

    /* ---------- API publica ---------- */
    window.cmEquiposInit = async function (contId) {
        S.cont = document.getElementById(contId); if (!S.cont || !club()) return;
        S.cont.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:30px;">Cargando equipos…</p>';
        try { await cargar(); pintar(); } catch (e) { S.cont.innerHTML = '<p style="color:#f87171;padding:20px;">No se han podido cargar los equipos.</p>'; }
    };
    window.cmEquiposNuevo = function () { abrir(null); };
    window.cmEquiposEditar = function (id) { var e = S.equipos.filter(function (x) { return x.id === id; })[0]; if (e) abrir(e); };
    window.cmEquiposDesactivar = function (id) { cambiarActivo(id, false); };
    window.cmEquiposReactivar = function (id) { cambiarActivo(id, true); };
    window.cmEquiposVerInactivos = function () { S.verInactivos = !S.verInactivos; pintar(); };
})();
