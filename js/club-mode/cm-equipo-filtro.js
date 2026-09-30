// ============================================================
// CLUB MODE - FILTRO CENTRAL POR EQUIPO (cm-equipo-filtro.js)  v5
// En un club con varios equipos, cada dato es de un equipo:
//   - partidos y sesiones          -> matches.team_id / training_sessions.team_id
//   - todo lo que cuelga de ellos  -> estadisticas por jugador, asistencia,
//     analisis, planes de partido, conceptos y montajes de sesion. La base de
//     datos copia sola el equipo del partido/sesion (trigger tlc_heredar_equipo).
//   - ciclos de periodizacion y competiciones -> training_periods.team_id / competitions.team_id
// Este modulo envuelve el cliente de datos del HUB para que, sin tocar los modulos:
//   - toda lectura de esas tablas se limite al equipo seleccionado (o a los
//     equipos del miembro si esta en "Todos"), mas los registros antiguos sin equipo;
//   - toda alta lleve el equipo seleccionado;
//   - al cambiar de equipo, la pantalla se actualice y vuelva al mismo sitio.
// Fuera del Modo Club (o en clubs de un solo equipo) no cambia nada.
// ============================================================
(function () {
    'use strict';
    var TABLAS = {
        matches: true, training_sessions: true,
        match_player_stats: true, match_analysis: true, match_plans: true, asistencia_partidos: true,
        asistencia_sesiones: true, sesion_conceptos: true, sesion_montajes: true,
        training_periods: true, competitions: true
    };
    // Modulos que ya escuchan cmTeamChanged y se repintan solos
    var SE_REFRESCAN = { config: true, fisio: true, medico: true, prepfisica: true };

    var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // "Listo" solo cuando el Modo Club esta activo Y ya tiene cargados sus equipos
    function listo() { return window.cmState && cmState.activo && (cmState.equipos || []).length > 0; }
    function activo() { return listo() && (cmState.equipos || []).length > 1; }

    // Recuerdo entre cargas (red de seguridad por si algo consulta antes de que el Modo Club este listo)
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
        // Acceso sin filtro, para los pocos casos que necesitan ver todo el club
        cli.__fromSinFiltro = fromOriginal;
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

    // ---------- Cambio de equipo: recargar y volver a la misma pantalla ----------
    function moduloActivo() {
        var t = document.querySelector('.main-tab.active:not(.cmmenu-btn)'); if (!t) return null;
        var m = (t.getAttribute('onclick') || '').match(/cambiarModulo\('([a-z_]+)'/);
        return m ? m[1] : (t.className.split(' ').filter(function (c) { return c !== 'main-tab' && c !== 'active'; })[0] || null);
    }
    // Subpestana abierta dentro del modulo (p. ej. "estadisticas" en Gestion de Competicion)
    function subpestanaActiva() {
        var vista = document.querySelector('.vista-modulo.active'); if (!vista) return null;
        var st = vista.querySelector('.sub-tab.active'); if (!st) return null;
        var m = (st.getAttribute('onclick') || '').match(/cambiarSubTab\('([\w-]+)',\s*'([\w-]+)'/);
        return m ? m[1] + '|' + m[2] : null;
    }
    document.addEventListener('cmTeamChanged', function () {
        if (!activo()) return;
        recordar();
        var mod = moduloActivo();
        if (mod && SE_REFRESCAN[mod]) return;
        var sub = subpestanaActiva();
        // Creando una sesion: no recargar (se perderia el borrador); el planificador ya actualiza sus jugadores
        if (mod === 'planificador' && (!sub || sub === 'planificador|crear')) return;
        try {
            if (mod) localStorage.setItem('hub_modulo_reabrir', mod);
            if (sub) localStorage.setItem('hub_subtab_reabrir', sub); else localStorage.removeItem('hub_subtab_reabrir');
        } catch (e) {}
        setTimeout(function () { location.reload(); }, 60);
    });
    // Tras la recarga, volver al modulo y a la subpestana donde estaba
    (function reabrir() {
        var mod = null, sub = null;
        try { mod = localStorage.getItem('hub_modulo_reabrir'); sub = localStorage.getItem('hub_subtab_reabrir'); } catch (e) {}
        if (!mod) return;
        var t0 = Date.now(), visibleDesde = 0;
        function abrir() {
            try { localStorage.removeItem('hub_modulo_reabrir'); localStorage.removeItem('hub_subtab_reabrir'); } catch (e) {}
            var tab = Array.prototype.find.call(document.querySelectorAll('.main-tab'), function (b) { return (b.getAttribute('onclick') || '').indexOf("cambiarModulo('" + mod + "'") >= 0 || b.classList.contains(mod); });
            if (tab && !tab.classList.contains('active')) tab.click();
            if (!sub) return;
            var p = sub.split('|');
            setTimeout(function () {
                var st = Array.prototype.find.call(document.querySelectorAll('.sub-tab'), function (b) {
                    var m = (b.getAttribute('onclick') || '').match(/cambiarSubTab\('([\w-]+)',\s*'([\w-]+)'/);
                    return m && m[1] === p[0] && m[2] === p[1];
                });
                if (st && !st.classList.contains('active')) st.click();
            }, 250);
        }
        (function loop() {
            var app = document.getElementById('app-container');
            if (app && app.offsetParent !== null) {
                if (!visibleDesde) visibleDesde = Date.now();
                // Esperar a que el HUB avise de que esta listo (o 5 s si el core.js fuera antiguo)
                if (window.__hubListo || Date.now() - visibleDesde > 5000) { setTimeout(abrir, 300); return; }
            }
            if (Date.now() - t0 < 60000) setTimeout(loop, 200);
        })();
    })();
})();
