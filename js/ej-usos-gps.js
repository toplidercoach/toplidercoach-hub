// ============================================================
// EJ-USOS-GPS.JS — Datos GPS dentro de "Ejercicios usados en las sesiones"
// Para cada ejercicio con datos GPS (vista cm_pf_ej_gps_resumen) pinta en su fila la MEDIA
// (minutos, distancia, m/min, HSR, sprints, acel/desacel, Vmax) y un botón "📡 Ficha GPS";
// al abrir el ejercicio, cada sesión muestra los datos GPS de ese día (vista cm_pf_ej_gps_detalle,
// media de los jugadores de ese ejercicio en esa sesión). Solo lectura.
// Cargar DESPUÉS de ej-usos.js y ej-gps-ficha.js.
// ============================================================
(function () {
    'use strict';
    var G = { resumen: null, detalle: {}, club: null, pendientes: {} };
    var CSS = ''
        + '.ejug-media{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}'
        + '.ejug-k{font-size:10px;background:#0b2a2a;border:1px solid #115e59;color:#5eead4;border-radius:5px;padding:1px 6px;white-space:nowrap}.ejug-k b{color:#fff;font-weight:700}'
        + '.ejug-btn{font-size:10px;background:#134e4a;border:1px solid #14b8a6;color:#99f6e4;border-radius:5px;padding:1px 8px;cursor:pointer;white-space:nowrap}'
        + '.ejug-row{font-size:10.5px;color:#cbd5e1;white-space:nowrap}.ejug-row b{color:#5eead4}.ejug-row.no{color:#475569;font-style:italic}'
        + '.ejug-cab{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.3px}';
    function css() { if (!document.getElementById('ejug-css')) { var s = document.createElement('style'); s.id = 'ejug-css'; s.textContent = CSS; document.head.appendChild(s); } }
    function n(v) { v = parseFloat(v); return isNaN(v) ? null : v; }
    function f(v, d) { if (v === null || v === undefined || isNaN(v)) return '—'; return Number(v).toLocaleString('es-ES', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
    function esc(t) { return String(t === null || t === undefined ? '' : t).replace(/</g, '&lt;'); }

    async function cargarResumen() {
        if (G.resumen && G.club === clubId) return G.resumen;
        G.resumen = {}; G.club = clubId; G.detalle = {};
        try {
            var r = await supabaseClient.from('cm_pf_ej_gps_resumen').select('*').eq('club_id', clubId);
            (r.data || []).forEach(function (x) { G.resumen[String(x.activity_ref)] = x; });
        } catch (e) {}
        return G.resumen;
    }
    // Detalle de un ejercicio, agregado por sesión GPS (media de los jugadores)
    async function cargarDetalle(id) {
        if (G.detalle[id]) return G.detalle[id];
        if (G.pendientes[id]) return G.pendientes[id];
        G.pendientes[id] = (async function () {
            var out = {};
            try {
                var r = await supabaseClient.from('cm_pf_ej_gps_detalle').select('session_id, session_date, player_id, minutos, td_m, hsr19_m, hsr24_m, sprints, acc30, dec30, vmax_kmh').eq('club_id', clubId).eq('activity_ref', id);
                var por = {};
                (r.data || []).forEach(function (d) {
                    var k = d.session_date; if (!por[k]) por[k] = { n: 0, jug: {}, s: {} };
                    var a = por[k]; a.n++; a.jug[d.player_id] = 1;
                    ['minutos', 'td_m', 'hsr19_m', 'hsr24_m', 'sprints', 'acc30', 'dec30'].forEach(function (c) { var v = n(d[c]); if (v !== null) { a.s[c] = (a.s[c] || 0) + v; a.s[c + '_n'] = (a.s[c + '_n'] || 0) + 1; } });
                    var vm = n(d.vmax_kmh); if (vm !== null) a.s.vmax = Math.max(a.s.vmax || 0, vm);
                });
                Object.keys(por).forEach(function (k) {
                    var a = por[k], m = { fecha: k, jugadores: Object.keys(a.jug).length };
                    ['minutos', 'td_m', 'hsr19_m', 'hsr24_m', 'sprints', 'acc30', 'dec30'].forEach(function (c) { m[c] = a.s[c + '_n'] ? a.s[c] / a.s[c + '_n'] : null; });
                    m.vmax = a.s.vmax || null; m.mmin = (m.minutos && m.td_m) ? m.td_m / m.minutos : null;
                    out[k] = m;
                });
            } catch (e) {}
            G.detalle[id] = out; delete G.pendientes[id]; return out;
        })();
        return G.pendientes[id];
    }
    function chips(x) {
        var mmin = (n(x.min_medios) && n(x.td_m)) ? n(x.td_m) / n(x.min_medios) : n(x.td_min);
        return '<span class="ejug-k" title="Media por jugador en ' + x.n_sesiones + ' sesiones con GPS">📡 <b>' + x.n_sesiones + '</b> ses. GPS</span>'
            + '<span class="ejug-k"><b>' + f(x.min_medios, 1) + '</b> min</span>'
            + '<span class="ejug-k"><b>' + f(x.td_m) + '</b> m</span>'
            + '<span class="ejug-k"><b>' + f(mmin, 1) + '</b> m/min</span>'
            + '<span class="ejug-k">HSR19 <b>' + f(x.hsr19_m) + '</b></span>'
            + '<span class="ejug-k">HSR24 <b>' + f(x.hsr24_m) + '</b></span>'
            + '<span class="ejug-k">Spr <b>' + f(x.sprints, 1) + '</b></span>'
            + '<span class="ejug-k">Ac>3 <b>' + f(x.acc30, 1) + '</b></span>'
            + '<span class="ejug-k">Dec>3 <b>' + f(x.dec30, 1) + '</b></span>'
            + '<span class="ejug-k">Vmax <b>' + f(x.vmax_kmh, 1) + '</b></span>';
    }
    function filaGps(m) {
        if (!m) return '<span class="ejug-row no">sin GPS ese día</span>';
        return '<span class="ejug-row" title="Media de ' + m.jugadores + ' jugadores en este ejercicio"><b>' + f(m.minutos, 1) + '</b> min · <b>' + f(m.td_m) + '</b> m · <b>' + f(m.mmin, 1) + '</b> m/min · HSR19 <b>' + f(m.hsr19_m) + '</b> · HSR24 <b>' + f(m.hsr24_m) + '</b> · Spr <b>' + f(m.sprints, 1) + '</b> · Ac>3 <b>' + f(m.acc30, 1) + '</b> · Dec>3 <b>' + f(m.dec30, 1) + '</b> · Vmax <b>' + f(m.vmax, 1) + '</b> · ' + m.jugadores + ' jug.</span>';
    }
    function idDeClave(clave) { return clave && clave.indexOf('id:') === 0 ? clave.slice(3) : null; }

    // Tras cada render del listado: añadir medias y, en los abiertos, el GPS de cada sesión
    async function decorar() {
        var lista = document.getElementById('ejusos-lista'); if (!lista) return;
        var res = await cargarResumen();
        if (!document.getElementById('ejusos-lista')) return;
        var filas = lista.querySelectorAll('tr[onclick*="ejUsosToggle"]');
        var abiertos = [];
        Array.prototype.forEach.call(filas, function (tr) {
            if (tr.getAttribute('data-ejug')) return;
            tr.setAttribute('data-ejug', '1');
            var m = /ejUsosToggle\('([^']+)'\)/.exec(tr.getAttribute('onclick') || ''); if (!m) return;
            var clave = m[1].replace(/\\'/g, "'"), id = idDeClave(clave); if (!id) return;
            var x = res[id]; if (!x) return;
            var td = tr.firstElementChild;
            td.insertAdjacentHTML('beforeend', '<div class="ejug-media">' + chips(x) + '<button class="ejug-btn" onclick="event.stopPropagation();ejGpsFicha(\'' + esc(id) + '\')" title="Ficha GPS completa: media, sesión a sesión y jugador a jugador">📡 Ficha GPS</button></div>');
            var sig = tr.nextElementSibling;
            if (sig && sig.querySelector('table')) abiertos.push({ id: id, bloque: sig });
        });
        for (var i = 0; i < abiertos.length; i++) {
            var a = abiertos[i], det = await cargarDetalle(a.id);
            if (!a.bloque.isConnected) continue;
            var inner = a.bloque.querySelector('table'); if (!inner) continue;
            var trs = inner.querySelectorAll('tr');
            Array.prototype.forEach.call(trs, function (r) {
                if (r.getAttribute('data-ejug')) return; r.setAttribute('data-ejug', '1');
                var txt = (r.firstElementChild && r.firstElementChild.textContent || '').trim();
                var mf = /(\d{2})\/(\d{2})\/(\d{4})/.exec(txt); if (!mf) return;
                var iso = mf[3] + '-' + mf[2] + '-' + mf[1];
                var c = document.createElement('td'); c.style.cssText = 'padding:4px 6px'; c.innerHTML = filaGps(det[iso]); r.appendChild(c);
            });
            var cab = document.createElement('tr'); cab.innerHTML = '<td colspan="5" class="ejug-cab" style="padding:2px 6px 6px">GPS de cada sesión = media por jugador de este ejercicio ese día (solo cuando la sesión GPS tiene el ejercicio como actividad)</td>';
            inner.insertBefore(cab, inner.firstChild);
        }
    }
    var orig = window.ejUsosRender;
    window.ejUsosRender = function () { css(); orig.apply(this, arguments); setTimeout(decorar, 0); };
})();
