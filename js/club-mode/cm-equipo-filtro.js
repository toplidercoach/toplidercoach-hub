// ============================================================
// CLUB MODE - FILTRO CENTRAL POR EQUIPO (cm-equipo-filtro.js)
// En un club con varios equipos, los partidos y las sesiones son de un equipo
// (matches.team_id / training_sessions.team_id). Este modulo envuelve el cliente
// de datos del HUB para que, sin tocar los modulos:
//   - toda consulta a 'matches' o 'training_sessions' se limite al equipo
//     seleccionado (o a los equipos del miembro si esta en "Todos"),
//     incluyendo los registros antiguos sin equipo (team_id nulo);
//   - toda alta en esas tablas lleve el equipo seleccionado;
//   - al cambiar de equipo, los modulos que no se refrescan solos se recarguen.
// Fuera del Modo Club (un solo equipo) no cambia nada.
// ============================================================
(function () {
    'use strict';
    var TABLAS = { matches: true, training_sessions: true };
    // Modulos que ya escuchan cmTeamChanged y se repintan solos
    var SE_REFRESCAN = { config: true, planificador: true, fisio: true, medico: true, prepfisica: true };

    var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // "Listo" solo cuando el Modo Club esta activo Y ya tiene cargados sus equipos
    function listo() { return window.cmState && cmState.activo && (cmState.equipos || []).length > 0; }
    function activo() { return listo() && (cmState.equipos || []).length > 1; }
    // Recuerdo entre cargas: el club tiene varios equipos y cual estaba seleccionado.
    // Permite filtrar desde la primera consulta, antes de que el Modo Club termine de inicializarse.
    function recordar() {
        try {
            if (!listo()) return;
            localStorage.setItem('cm_multi_equipo', activo() ? '1' : '0');
            if (activo()) localStorage.setItem('cm_equipo_ids_acceso', (cmState.esAdmin || cmState.teamScope === 'all') ? '*' : (cmState.equiposAcceso || []).map(function (e) { return e.id; }).join(','));
        } catch (e) {}
    }
    setInterval(recordar, 500);
    function equipoActual() {
        if (listo()) return activo() && cmState.equipoSeleccionado ? cmState.equipoSeleccionado.id : null;
        try { var t = localStorage.getItem('cm_team_selected'); return (localStorage.getItem('cm_multi_equipo') === '1' && t && UUID.test(t)) ? t : null; } catch (e) { return null; }
    }
    function filtro() {
        if (listo()) {
            if (!activo()) return null;
            if (cmState.equipoSeleccionado) return 'team_id.eq.' + cmState.equipoSeleccionado.id + ',team_id.is.null';
            if (cmState.esAdmin || cmState.teamScope === 'all') return null;
            var ids = (cmState.equiposAcceso || []).map(function (e) { return e.id; });
            return ids.length ? 'team_id.in.(' + ids.join(',') + '),team_id.is.null' : 'team_id.is.null';
        }
        // Aun sin inicializar: usar lo recordado de la ultima sesion en este navegador
        try {
            if (localStorage.getItem('cm_multi_equipo') !== '1') return null;
            var t = localStorage.getItem('cm_team_selected');
            if (t && UUID.test(t)) return 'team_id.eq.' + t + ',team_id.is.null';
            var acc = localStorage.getItem('cm_equipo_ids_acceso');
            if (!acc || acc === '*') return null;
            return 'team_id.in.(' + acc + '),team_id.is.null';
        } catch (e) { return null; }
    }
    window.cmFiltroEquipoTabla = filtro;

    function envolver(cli) {
        if (!cli || cli.__tlcEquipo || typeof cli.from !== 'function') return;
        cli.__tlcEquipo = true;
        var fromOriginal = cli.from.bind(cli);
        cli.from = function (tabla) {
            var q = fromOriginal(tabla);
            if (!TABLAS[tabla] || !q) return q;
            var sel = q.select.bind(q), ins = q.insert.bind(q), ups = q.upsert ? q.upsert.bind(q) : null;
            q.select = function () {
                var b = sel.apply(null, arguments); var f = filtro();
                return f ? b.or(f) : b;
            };
            function conEquipo(rows) {
                var t = equipoActual(); if (!t) return rows;
                var poner = function (r) { return (r && typeof r === 'object' && r.team_id === undefined) ? Object.assign({ team_id: t }, r) : r; };
                return Array.isArray(rows) ? rows.map(poner) : poner(rows);
            }
            q.insert = function (rows, opts) { return ins(conEquipo(rows), opts); };
            if (ups) q.upsert = function (rows, opts) { return ups(conEquipo(rows), opts); };
            return q;
        };
    }

    // Envolver el cliente en cuanto exista y cada vez que el HUB lo recree (login WordPress / Supabase)
    function envolverActual() { try { if (typeof supabaseClient !== 'undefined' && supabaseClient) envolver(supabaseClient); } catch (e) {} }
    envolverActual();
    try {
        if (typeof crearClienteSupabase === 'function' && !crearClienteSupabase.__tlcEquipo) {
            var crearOriginal = crearClienteSupabase;
            crearClienteSupabase = function () { var c = crearOriginal.apply(this, arguments); envolver(c); return c; };
            crearClienteSupabase.__tlcEquipo = true;
        }
    } catch (e) {}
    setInterval(envolverActual, 100);

    // ---------- Selectores de equipo en los formularios de partido y sesion ----------
    function rellenarSelectores() {
        if (!activo()) return;
        ['partido-equipo', 'sesion-equipo'].forEach(function (id) {
            var sel = document.getElementById(id); if (!sel || sel.dataset.tlcListo === '1') return;
            var eqs = (cmState.equiposAcceso || []);
            sel.innerHTML = eqs.map(function (e) { return '<option value="' + e.id + '">' + e.name + (e.category ? ' (' + e.category + ')' : '') + '</option>'; }).join('');
            if (cmState.equipoSeleccionado) sel.value = cmState.equipoSeleccionado.id;
            sel.dataset.tlcListo = '1';
            var wrap = sel.closest('.form-group, .campo-grupo'); if (wrap) wrap.style.display = '';
        });
    }
    setInterval(rellenarSelectores, 800);
    document.addEventListener('cmTeamChanged', function () { ['partido-equipo', 'sesion-equipo'].forEach(function (id) { var sel = document.getElementById(id); if (sel && cmState.equipoSeleccionado) sel.value = cmState.equipoSeleccionado.id; }); });

    // ---------- Cambio de equipo: recargar modulos que no se refrescan solos ----------
    function moduloActivo() {
        var t = document.querySelector('.main-tab.active:not(.cmmenu-btn)'); if (!t) return null;
        var m = (t.getAttribute('onclick') || '').match(/cambiarModulo\('([a-z_]+)'/);
        return m ? m[1] : (t.className.split(' ').filter(function (c) { return c !== 'main-tab' && c !== 'active'; })[0] || null);
    }
    document.addEventListener('cmTeamChanged', function () {
        if (!activo()) return;
        recordar();
        var mod = moduloActivo();
        if (mod && SE_REFRESCAN[mod]) return;
        try { if (mod) localStorage.setItem('hub_modulo_reabrir', mod); } catch (e) {}
        setTimeout(function () { location.reload(); }, 60);
    });
    // Tras la recarga, volver al modulo donde estaba
    (function reabrir() {
        var mod = null; try { mod = localStorage.getItem('hub_modulo_reabrir'); } catch (e) {}
        if (!mod) return;
        var t0 = Date.now();
        (function loop() {
            var app = document.getElementById('app-container');
            if (app && app.offsetParent !== null) {
                try { localStorage.removeItem('hub_modulo_reabrir'); } catch (e) {}
                setTimeout(function () {
                    var tab = Array.prototype.find.call(document.querySelectorAll('.main-tab'), function (b) { return (b.getAttribute('onclick') || '').indexOf("cambiarModulo('" + mod + "'") >= 0 || b.classList.contains(mod); });
                    if (tab) tab.click();
                }, 700);
                return;
            }
            if (Date.now() - t0 < 60000) setTimeout(loop, 200);
        })();
    })();
})();
