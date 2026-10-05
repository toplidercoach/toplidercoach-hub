// ========== EJ-GPS-FICHA.JS (v1) - Ficha fisica GPS de un ejercicio del banco ==========
// Lee las vistas cm_pf_ej_gps_resumen (media global) y cm_pf_ej_gps_detalle
// (jugador x sesion) y pinta una ventana con tres niveles:
//   1) Media global del ejercicio (total y por minuto)
//   2) Sesion a sesion
//   3) Jugador a jugador
// Tambien muestra el boton "GPS" en las tarjetas del banco que tengan datos
// (botones con atributo data-ejgps, anadidos en ejBancoRender de ejercicios.js).
// No modifica ningun dato. Cargar DESPUES de ejercicios.js.

var ejGps = { mapa: null, mapaClub: null, cargando: false, ultimaCarga: 0 };

function ejGpsEsc(t) {
    return String(t === null || t === undefined ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function ejGpsNum(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
}
function ejGpsFmt(v, dec) {
    var n = ejGpsNum(v);
    if (n === null) return '-';
    var p = Math.pow(10, dec || 0);
    return String(Math.round(n * p) / p).replace('.', ',');
}
function ejGpsFecha(f) {
    var d = new Date(f + 'T12:00:00');
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
}

// ---------- Que ejercicios tienen datos GPS (para mostrar el boton en el banco) ----------
async function ejGpsCargarMapa(forzar) {
    if (typeof clubId === 'undefined' || !clubId || typeof supabaseClient === 'undefined') return;
    if (ejGps.cargando) return;
    var ahora = Date.now();
    if (!forzar && ejGps.mapa && ejGps.mapaClub === clubId && ahora - ejGps.ultimaCarga < 120000) return;
    ejGps.cargando = true;
    try {
        var r = await supabaseClient.from('cm_pf_ej_gps_resumen').select('activity_ref, n_sesiones').eq('club_id', clubId);
        if (!r.error) {
            var m = {};
            (r.data || []).forEach(function (x) { m[x.activity_ref] = x.n_sesiones; });
            ejGps.mapa = m;
            ejGps.mapaClub = clubId;
            ejGps.ultimaCarga = Date.now();
        }
    } catch (e) { /* sin datos GPS el banco funciona igual */ }
    ejGps.cargando = false;
}

function ejGpsMarcarBotones() {
    var btns = document.querySelectorAll('button[data-ejgps]');
    if (!btns.length) return;
    if (!ejGps.mapa || ejGps.mapaClub !== (typeof clubId !== 'undefined' ? clubId : null) || Date.now() - ejGps.ultimaCarga > 120000) {
        ejGpsCargarMapa(false);
    }
    if (!ejGps.mapa) return;
    for (var i = 0; i < btns.length; i++) {
        var n = ejGps.mapa[btns[i].getAttribute('data-ejgps')];
        if (n) {
            btns[i].style.display = '';
            btns[i].textContent = 'GPS ' + n;
            btns[i].title = 'Datos GPS: medido en ' + n + (n === 1 ? ' sesion' : ' sesiones');
        } else {
            btns[i].style.display = 'none';
        }
    }
}
setInterval(ejGpsMarcarBotones, 1500);

// ---------- Calculos ----------
var EJGPS_MET = ['td_m', 'hsr19_m', 'hsr21_m', 'hsr24_m', 'sprints', 'acc25', 'acc30', 'acc40', 'dec25', 'dec30', 'dec40'];

function ejGpsAgrupar(filas) {
    var g = { n: filas.length, min: null, vmax: null, tdMin: null };
    var sumMin = 0, nMin = 0, tdConMin = 0, minConTd = 0;
    EJGPS_MET.forEach(function (k) {
        var s = 0, c = 0;
        filas.forEach(function (f) { var v = ejGpsNum(f[k]); if (v !== null) { s += v; c++; } });
        g[k] = c ? s / c : null;
    });
    filas.forEach(function (f) {
        var m = ejGpsNum(f.minutos), td = ejGpsNum(f.td_m), vm = ejGpsNum(f.vmax_kmh);
        if (m !== null) { sumMin += m; nMin++; }
        if (m && td !== null) { tdConMin += td; minConTd += m; }
        if (vm !== null && (g.vmax === null || vm > g.vmax)) g.vmax = vm;
    });
    g.min = nMin ? sumMin / nMin : null;
    g.tdMin = minConTd ? tdConMin / minConTd : null;
    return g;
}

// ---------- Ventana de la ficha ----------
function ejGpsCerrar() {
    var ov = document.getElementById('ejgps-overlay');
    if (ov) ov.remove();
}

async function ejGpsFicha(id) {
    ejGpsCerrar();
    var ov = document.createElement('div');
    ov.id = 'ejgps-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:10050;display:flex;justify-content:center;align-items:flex-start;padding:22px;overflow-y:auto';
    ov.onclick = function (e) { if (e.target === ov) ejGpsCerrar(); };
    ov.innerHTML = '<div style="background:#0f172a;border:1px solid #14b8a6;border-radius:14px;padding:30px;color:#94a3b8;font-size:13px">Cargando datos GPS del ejercicio...</div>';
    document.body.appendChild(ov);

    try {
        // Ejercicio del banco (de la cache si esta, si no de Supabase)
        var ej = null;
        if (typeof ejBancoCache !== 'undefined' && ejBancoCache) {
            for (var i = 0; i < ejBancoCache.length; i++) { if (ejBancoCache[i].id === id) { ej = ejBancoCache[i]; break; } }
        }
        if (!ej || !ej.thumbnail_svg) {
            var er = await supabaseClient.from('custom_exercises')
                .select('id, name, category, tema, duration_min, players_count, field_width, field_length, thumbnail_svg')
                .eq('id', id).limit(1);
            if (!er.error && er.data && er.data.length) ej = er.data[0];
        }
        ej = ej || { id: id, name: 'Ejercicio' };

        var rr = await supabaseClient.from('cm_pf_ej_gps_resumen').select('*').eq('club_id', clubId).eq('activity_ref', id).limit(1);
        if (rr.error) throw rr.error;
        var res = rr.data && rr.data.length ? rr.data[0] : null;

        var dr = await supabaseClient.from('cm_pf_ej_gps_detalle')
            .select('session_id, session_date, player_id, minutos, td_m, hsr19_m, hsr21_m, hsr24_m, sprints, acc25, acc30, acc40, dec25, dec30, dec40, vmax_kmh')
            .eq('club_id', clubId).eq('activity_ref', id);
        if (dr.error) throw dr.error;
        var det = dr.data || [];

        var nombres = {};
        var pids = [];
        det.forEach(function (d) { if (pids.indexOf(d.player_id) === -1) pids.push(d.player_id); });
        if (pids.length) {
            var pr = await supabaseClient.from('club_players').select('id, name, positions_main').in('id', pids);
            (pr.data || []).forEach(function (p) { nombres[p.id] = { name: p.name, pos: (p.positions_main && p.positions_main[0]) || '' }; });
        }

        if (!document.getElementById('ejgps-overlay')) return;   // cerrado mientras cargaba
        ov.innerHTML = ejGpsHtml(ej, res, det, nombres);
        var t = ej.thumbnail_svg ? String(ej.thumbnail_svg).trim() : '';
        var cont = document.getElementById('ejgps-img');
        if (cont && t) {
            if (t.indexOf('data:') === 0 || /^https?:/i.test(t)) cont.innerHTML = '<img src="' + t + '" alt="" style="display:block;width:100%;height:auto">';
            else if (t.indexOf('<svg') !== -1) cont.innerHTML = t.substring(t.indexOf('<svg'));
        } else if (cont) { cont.style.display = 'none'; }
    } catch (e) {
        console.warn('[EjGps] Ficha GPS:', e);
        ov.innerHTML = '<div style="background:#0f172a;border:1px solid #dc2626;border-radius:14px;padding:30px;color:#fca5a5;font-size:13px">Error cargando los datos GPS: ' + ejGpsEsc(e.message || e) +
            '<br><br><button onclick="ejGpsCerrar()" style="padding:6px 14px;background:#334155;border:none;color:#cbd5e1;border-radius:8px;cursor:pointer">Cerrar</button></div>';
    }
}

function ejGpsHtml(ej, res, det, nombres) {
    var css = '<style>' +
        '.ejgps-modal{background:#0f172a;border:1px solid #14b8a6;border-radius:14px;width:100%;max-width:1100px;padding:20px}' +
        '.ejgps-cab{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}' +
        '.ejgps-img{width:250px;max-width:100%;background:#0f4c2a;border:1px solid #334155;border-radius:8px;overflow:hidden;flex-shrink:0}' +
        '.ejgps-img svg{display:block;width:100%;height:auto}' +
        '.ejgps-nom{color:#f8fafc;font-size:18px;font-weight:700}' +
        '.ejgps-sub{color:#94a3b8;font-size:12px;margin-top:4px}' +
        '.ejgps-kpis{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}' +
        '.ejgps-kpi{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:7px 12px;min-width:84px}' +
        '.ejgps-kpi b{display:block;color:#5eead4;font-size:17px}' +
        '.ejgps-kpi span{color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.3px}' +
        '.ejgps-kpi.min b{color:#fcd34d}' +
        '.ejgps-h{color:#e2e8f0;font-size:13px;font-weight:700;margin:20px 0 6px}' +
        '.ejgps-t{width:100%;border-collapse:collapse;font-size:12px}' +
        '.ejgps-t th{color:#94a3b8;padding:6px 8px;border-bottom:1px solid #334155;font-size:10px;text-transform:uppercase;letter-spacing:.4px;text-align:right;white-space:nowrap}' +
        '.ejgps-t td{color:#e2e8f0;padding:5px 8px;border-bottom:1px solid #1e293b;text-align:right;white-space:nowrap}' +
        '.ejgps-t th:first-child,.ejgps-t td:first-child{text-align:left}' +
        '.ejgps-t tr.media td{color:#4ade80;font-weight:600;border-top:1px solid #334155}' +
        '.ejgps-nota{color:#64748b;font-size:10px;margin-top:10px;line-height:1.5}' +
        '</style>';

    var partes = [];
    if (ej.category) partes.push(ejGpsEsc(ej.category));
    if (ej.tema) partes.push(ejGpsEsc(ej.tema));
    if (ej.players_count) partes.push(ej.players_count + ' jugadores');
    if (ej.field_width && ej.field_length) partes.push(ej.field_width + ' x ' + ej.field_length + ' m');
    if (ej.duration_min) partes.push(ej.duration_min + ' min previstos');

    var cierre = '<button onclick="ejGpsCerrar()" style="background:#334155;border:none;color:#94a3b8;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:15px;flex-shrink:0">x</button>';

    if (!res || !det.length) {
        return css + '<div class="ejgps-modal"><div style="display:flex;justify-content:space-between;gap:12px"><div><div class="ejgps-nom">' + ejGpsEsc(ej.name) + '</div>' +
            '<div class="ejgps-sub">' + partes.join(' &middot; ') + '</div></div>' + cierre + '</div>' +
            '<p style="color:#94a3b8;font-size:13px;margin-top:18px">Este ejercicio todavia no tiene datos GPS. Para que aparezcan, anade una actividad en una sesion GPS (Preparacion Fisica) y vinculala a este ejercicio.</p></div>';
    }

    var kpi = function (v, dec, lbl, cls) {
        if (ejGpsNum(v) === null) return '';
        return '<div class="ejgps-kpi' + (cls ? ' ' + cls : '') + '"><b>' + ejGpsFmt(v, dec) + '</b><span>' + lbl + '</span></div>';
    };
    var total = '<div class="ejgps-kpis">' +
        kpi(res.min_medios, 1, 'Minutos') + kpi(res.td_m, 0, 'Distancia m') +
        kpi(res.hsr19_m, 0, 'HSR &gt;19') + kpi(res.hsr21_m, 0, 'HSR &gt;21') + kpi(res.hsr24_m, 0, 'HSR &gt;24') +
        kpi(res.sprints, 1, 'Sprints') + kpi(res.acc30, 1, 'Acel &gt;3') + kpi(res.dec30, 1, 'Decel &gt;3') +
        kpi(res.vmax_kmh, 1, 'Vmax pico') + '</div>';
    var porMin = '<div class="ejgps-kpis">' +
        kpi(res.td_min, 1, 'm / min', 'min') + kpi(res.hsr19_min, 1, 'HSR&gt;19 / min', 'min') + kpi(res.hsr24_min, 1, 'HSR&gt;24 / min', 'min') +
        kpi(ejGpsNum(res.sprints_min) !== null ? res.sprints_min * 10 : null, 1, 'Sprints / 10 min', 'min') +
        kpi(ejGpsNum(res.acc30_min) !== null ? res.acc30_min * 10 : null, 1, 'Acel / 10 min', 'min') +
        kpi(ejGpsNum(res.dec30_min) !== null ? res.dec30_min * 10 : null, 1, 'Decel / 10 min', 'min') + '</div>';

    var cols = '<th>Min</th><th>TD(m)</th><th>m/min</th><th>HSR&gt;19</th><th>HSR&gt;21</th><th>HSR&gt;24</th><th>Sprints</th><th>Acc&gt;2,5</th><th>Acc&gt;3</th><th>Acc&gt;4</th><th>Dec&gt;2,5</th><th>Dec&gt;3</th><th>Dec&gt;4</th><th>Vmax</th>';
    var celdas = function (g) {
        return '<td>' + ejGpsFmt(g.min, 1) + '</td><td>' + ejGpsFmt(g.td_m, 0) + '</td><td>' + ejGpsFmt(g.tdMin, 1) + '</td>' +
            '<td>' + ejGpsFmt(g.hsr19_m, 0) + '</td><td>' + ejGpsFmt(g.hsr21_m, 0) + '</td><td>' + ejGpsFmt(g.hsr24_m, 0) + '</td>' +
            '<td>' + ejGpsFmt(g.sprints, 1) + '</td><td>' + ejGpsFmt(g.acc25, 1) + '</td><td>' + ejGpsFmt(g.acc30, 1) + '</td><td>' + ejGpsFmt(g.acc40, 1) + '</td>' +
            '<td>' + ejGpsFmt(g.dec25, 1) + '</td><td>' + ejGpsFmt(g.dec30, 1) + '</td><td>' + ejGpsFmt(g.dec40, 1) + '</td><td>' + ejGpsFmt(g.vmax, 1) + '</td>';
    };

    // Sesion a sesion
    var porSes = {};
    det.forEach(function (d) {
        if (!porSes[d.session_id]) porSes[d.session_id] = { fecha: d.session_date, filas: [] };
        porSes[d.session_id].filas.push(d);
    });
    var sesiones = Object.keys(porSes).map(function (k) { return porSes[k]; });
    sesiones.sort(function (a, b) { return a.fecha < b.fecha ? 1 : (a.fecha > b.fecha ? -1 : 0); });
    var tSes = '<table class="ejgps-t"><thead><tr><th>Fecha</th><th>Jug.</th>' + cols + '</tr></thead><tbody>';
    sesiones.forEach(function (s) {
        tSes += '<tr><td>' + ejGpsFecha(s.fecha) + '</td><td>' + s.filas.length + '</td>' + celdas(ejGpsAgrupar(s.filas)) + '</tr>';
    });
    tSes += '<tr class="media"><td>MEDIA GLOBAL</td><td>' + det.length + '</td>' + celdas(ejGpsAgrupar(det)) + '</tr></tbody></table>';

    // Jugador a jugador
    var porJug = {};
    det.forEach(function (d) {
        if (!porJug[d.player_id]) porJug[d.player_id] = [];
        porJug[d.player_id].push(d);
    });
    var jugadores = Object.keys(porJug).map(function (pid) {
        var info = nombres[pid] || { name: 'Jugador', pos: '' };
        return { nombre: info.name, pos: info.pos, n: porJug[pid].length, g: ejGpsAgrupar(porJug[pid]) };
    });
    jugadores.sort(function (a, b) { return (b.g.td_m || 0) - (a.g.td_m || 0); });
    var tJug = '<table class="ejgps-t"><thead><tr><th>Jugador</th><th>Veces</th>' + cols + '</tr></thead><tbody>';
    jugadores.forEach(function (j) {
        tJug += '<tr><td><b>' + ejGpsEsc(j.nombre) + '</b> <span style="color:#64748b;font-size:10px">' + ejGpsEsc(j.pos) + '</span></td><td>' + j.n + '</td>' + celdas(j.g) + '</tr>';
    });
    tJug += '</tbody></table>';

    var nSes = res.n_sesiones, nJug = res.n_jugadores;
    var fiab = nSes >= 3 ? '<span style="color:#4ade80">dato solido</span>' : '<span style="color:#fcd34d">dato provisional (' + nSes + (nSes === 1 ? ' sesion' : ' sesiones') + ', se afina al repetirlo)</span>';

    return css + '<div class="ejgps-modal">' +
        '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">' +
            '<div class="ejgps-cab"><div class="ejgps-img" id="ejgps-img"></div>' +
            '<div style="flex:1;min-width:280px"><div class="ejgps-nom">' + ejGpsEsc(ej.name) + '</div>' +
                '<div class="ejgps-sub">' + partes.join(' &middot; ') + '</div>' +
                '<div class="ejgps-sub">Medido en <b style="color:#e2e8f0">' + nSes + (nSes === 1 ? ' sesion' : ' sesiones') + '</b> &middot; ' + nJug + ' jugadores distintos &middot; ultima vez ' + ejGpsFecha(res.ultima_fecha) + ' &middot; ' + fiab + '</div>' +
                '<div class="ejgps-sub" style="margin-top:12px;color:#e2e8f0;font-weight:600">Media por jugador cada vez que se hace</div>' + total +
                '<div class="ejgps-sub" style="margin-top:12px;color:#e2e8f0;font-weight:600">Ritmo del ejercicio (para planificar con otra duracion)</div>' + porMin +
            '</div></div>' + cierre +
        '</div>' +
        '<div class="ejgps-h">Sesion a sesion</div><div style="overflow-x:auto">' + tSes + '</div>' +
        '<div class="ejgps-h">Jugador a jugador (media de las veces que lo ha hecho)</div><div style="overflow-x:auto">' + tJug + '</div>' +
        '<div class="ejgps-nota">HSR&gt;19 / &gt;21 / &gt;24: metros por encima de esa velocidad (km/h) &middot; Acc y Dec: numero de acciones por encima de 2,5 / 3 / 4 m/s&sup2; &middot; m/min: metros totales entre minutos totales &middot; Solo cuentan las actividades GPS vinculadas a este ejercicio del banco.</div>' +
    '</div>';
}

console.log('[EjGps] ej-gps-ficha.js v1 cargado');
