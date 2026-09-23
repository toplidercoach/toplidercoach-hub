// ========== CM-PREPFISICA-IE.JS - Evolucion carga interna/externa por jugador ==========
// Pinta en la pestana GPS de la ficha del jugador (div #cmpf-ie-evolucion) la evolucion
// de su UA/km (sRPE / km) en entrenamientos de las ultimas 12 semanas, con media movil
// de las 5 sesiones anteriores, estado por sesion (fatiga / sobrado / concuerdan) y
// barras de sRPE. Cargar DESPUES de cm-prepfisica.js. Requiere Chart.js.
// Fuentes: cm_pf_gps_sessions + cm_pf_gps_player_data (TOTAL) por fecha contra
// training_sessions + asistencia_sesiones (rpe, duracion_real). Puente club_players -> players.

var CMPF_IE_SEMANAS = 12;     // ventana de la grafica
var CMPF_IE_VENTANA = 5;      // sesiones previas para la media movil
var CMPF_IE_MIN_BASE = 3;     // minimo de sesiones previas para dar estado

function cmPfIeNorm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}
function cmPfIeISO(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

async function cmPfIeCargar() {
    var c = document.getElementById('cmpf-ie-evolucion');
    if (!c || typeof cmPfJugadorActual === 'undefined' || !cmPfJugadorActual) return;
    var j = cmPfJugadorActual;
    c.innerHTML = '<div style="color:#64748b;font-size:12px;margin-bottom:16px">Calculando carga interna/externa...</div>';
    try {
        // 1) Puente club_players -> players
        var cp = await supabaseClient.from('club_players').select('id, name, legacy_player_id').eq('id', j.id).single();
        var pj = cp.data ? cp.data.legacy_player_id : null;
        if (!pj) {
            var pr = await supabaseClient.from('players').select('id, name').ilike('name', (cp.data && cp.data.name) || j.name || '');
            var cand = (pr.data || []).filter(function (p) { return cmPfIeNorm(p.name) === cmPfIeNorm((cp.data && cp.data.name) || j.name); });
            if (cand.length) pj = cand[0].id;
        }
        if (!pj) { c.innerHTML = ''; return; }

        // 2) Ventana temporal
        var hoy = new Date();
        var d0 = new Date(); d0.setDate(d0.getDate() - CMPF_IE_SEMANAS * 7);
        var desde = cmPfIeISO(d0), hasta = cmPfIeISO(hoy);

        // 3) GPS de entrenamientos del jugador
        var gs = await supabaseClient.from('cm_pf_gps_sessions').select('id, session_date, title')
            .eq('club_id', clubId).eq('session_type', 'training').eq('archived', false)
            .gte('session_date', desde).lte('session_date', hasta);
        var sesGps = {};
        (gs.data || []).forEach(function (s) { sesGps[s.id] = s; });
        var sids = Object.keys(sesGps);
        if (!sids.length) { c.innerHTML = ''; return; }
        var gd = await supabaseClient.from('cm_pf_gps_player_data').select('session_id, total_distance_m, hsr_distance_m, duration_min')
            .in('session_id', sids).eq('player_id', j.id).eq('segment_name', 'TOTAL').eq('archived', false);
        var gpsRows = gd.data || [];
        if (!gpsRows.length) { c.innerHTML = ''; return; }

        // 4) RPE del jugador en las sesiones del planificador de esas fechas
        var ts = await supabaseClient.from('training_sessions').select('id, session_date, duration_minutes')
            .eq('club_id', clubId).gte('session_date', desde).lte('session_date', hasta);
        var tsInfo = {};
        (ts.data || []).forEach(function (t) { tsInfo[t.id] = t; });
        var tids = Object.keys(tsInfo);
        var rpePorFecha = {};
        if (tids.length) {
            var as = await supabaseClient.from('asistencia_sesiones').select('sesion_id, asistio, rpe, duracion_real')
                .in('sesion_id', tids).eq('jugador_id', pj);
            (as.data || []).forEach(function (a) {
                if (!a.asistio || a.rpe === null || a.rpe === undefined) return;
                var t = tsInfo[a.sesion_id];
                if (t) rpePorFecha[t.session_date] = { rpe: parseFloat(a.rpe), durReal: a.duracion_real || null, durSes: t.duration_minutes || null };
            });
        }

        // 5) Serie por sesion
        var serie = [], sinRpe = 0;
        gpsRows.forEach(function (g) {
            var s = sesGps[g.session_id];
            var td = g.total_distance_m !== null ? parseFloat(g.total_distance_m) : null;
            if (!s || !td) return;
            var r = rpePorFecha[s.session_date];
            if (!r) { sinRpe++; return; }
            var min = r.durReal || (g.duration_min ? parseFloat(g.duration_min) : null) || r.durSes;
            if (!min) return;
            var srpe = Math.round(r.rpe * min);
            serie.push({ fecha: s.session_date, titulo: s.title || '', rpe: r.rpe, min: min, td: td, srpe: srpe, uakm: Math.round(srpe / (td / 1000) * 10) / 10 });
        });
        serie.sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });

        // 6) Media movil y estado de cada sesion contra las CMPF_IE_VENTANA anteriores
        serie.forEach(function (p, i) {
            var prev = serie.slice(Math.max(0, i - CMPF_IE_VENTANA), i).map(function (x) { return x.uakm; });
            p.base = null; p.estado = null; p.pct = null;
            if (prev.length >= CMPF_IE_MIN_BASE) {
                var media = prev.reduce(function (a, b) { return a + b; }, 0) / prev.length;
                var sd = Math.sqrt(prev.reduce(function (a, b) { return a + Math.pow(b - media, 2); }, 0) / prev.length);
                sd = Math.max(sd, media * 0.08);
                var z = (p.uakm - media) / sd;
                p.base = Math.round(media * 10) / 10;
                p.pct = Math.round((p.uakm / media - 1) * 100);
                p.estado = z >= 1 ? 'fatiga' : (z <= -1 ? 'sobrado' : 'ok');
            }
        });

        cmPfIeRender(c, serie, sinRpe);
    } catch (e) {
        console.warn('[PrepFisica] Evolucion I/E:', e);
        c.innerHTML = '';
    }
}

function cmPfIeRender(c, serie, sinRpe) {
    if (!serie.length) {
        c.innerHTML = '<div class="cmpf-derived-panel" style="margin-bottom:20px;border-color:#a78bfa"><div style="color:#a78bfa;font-size:12px;font-weight:700;margin-bottom:6px;text-transform:uppercase">Carga interna / externa</div><div style="color:#94a3b8;font-size:12px">A&uacute;n no hay entrenos con GPS y RPE a la vez en las &uacute;ltimas ' + CMPF_IE_SEMANAS + ' semanas' + (sinRpe ? ' (' + sinRpe + ' con GPS pero sin RPE)' : '') + '.</div></div>';
        return;
    }
    var col = { fatiga: '#f87171', sobrado: '#60a5fa', ok: '#4ade80' };
    var ico = { fatiga: '&#9888;', sobrado: '&#9889;', ok: '&#10003;' };
    var lbl = { fatiga: 'posible fatiga', sobrado: 'va sobrado', ok: 'concuerdan' };
    var ult = serie[serie.length - 1];
    var mediaTotal = Math.round(serie.reduce(function (a, p) { return a + p.uakm; }, 0) / serie.length * 10) / 10;
    var ult4 = serie.slice(-4);
    var nFatiga = ult4.filter(function (p) { return p.estado === 'fatiga'; }).length;

    var h = '<div class="cmpf-derived-panel" style="margin-bottom:20px;border-color:#a78bfa">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">';
    h += '<div style="color:#a78bfa;font-size:12px;font-weight:700;text-transform:uppercase">Carga interna / externa &middot; UA/km (sRPE por km)</div>';
    h += '<div style="color:#94a3b8;font-size:12px">' + serie.length + ' entrenos con GPS+RPE &middot; media ' + mediaTotal + ' UA/km' + (sinRpe ? ' &middot; <span style="color:#f59e0b">' + sinRpe + ' con GPS sin RPE</span>' : '') + '</div></div>';

    // Chips de estado
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">';
    if (ult.estado) {
        h += '<span style="background:#1e293b;border-radius:14px;padding:5px 12px;font-size:12px;color:' + col[ult.estado] + '">' + ico[ult.estado] + ' &Uacute;ltima sesi&oacute;n (' + cmPfFormatFecha(ult.fecha) + '): ' + lbl[ult.estado] + ' &middot; ' + ult.uakm + ' vs media ' + ult.base + ' (' + (ult.pct >= 0 ? '+' : '') + ult.pct + '%)</span>';
    } else {
        h += '<span style="background:#1e293b;border-radius:14px;padding:5px 12px;font-size:12px;color:#94a3b8">&Uacute;ltima sesi&oacute;n (' + cmPfFormatFecha(ult.fecha) + '): ' + ult.uakm + ' UA/km &middot; a&uacute;n sin l&iacute;nea base (m&iacute;nimo ' + CMPF_IE_MIN_BASE + ' sesiones previas)</span>';
    }
    if (nFatiga >= 2) {
        h += '<span style="background:rgba(248,113,113,.15);border:1px solid #f87171;border-radius:14px;padding:5px 12px;font-size:12px;color:#f87171;font-weight:600">&#9888; Fatiga acumulada: ' + nFatiga + ' de las &uacute;ltimas 4 sesiones por encima de su coste habitual</span>';
    }
    h += '</div>';

    h += '<div style="position:relative;height:230px"><canvas id="cmpf-ie-canvas"></canvas></div>';

    // Ultimas sesiones en texto (para lectura rapida y para moviles sin Chart.js)
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">';
    serie.slice(-8).reverse().forEach(function (p) {
        var cc = p.estado ? col[p.estado] : '#64748b';
        var ii = p.estado ? ico[p.estado] : '&middot;';
        h += '<span title="' + (p.titulo || 'Entreno') + ' &middot; RPE ' + p.rpe + ' &times; ' + Math.round(p.min) + ' min = ' + p.srpe + ' UA &middot; ' + Math.round(p.td) + ' m' + (p.base ? ' &middot; media previa ' + p.base : '') + '" style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:4px 8px;font-size:11px;color:#cbd5e1;cursor:help"><span style="color:' + cc + '">' + ii + '</span> ' + cmPfFormatFecha(p.fecha).slice(0, 5) + ' <b style="color:' + cc + '">' + p.uakm + '</b></span>';
    });
    h += '</div>';
    h += '<div style="color:#64748b;font-size:11px;margin-top:8px">Cada punto compara la sesi&oacute;n con la media de sus ' + CMPF_IE_VENTANA + ' sesiones anteriores: &#9888; &ge; +1 desv. (le cost&oacute; m&aacute;s de lo normal para lo que corri&oacute;), &#9889; &le; -1 desv. (lo percibi&oacute; f&aacute;cil), &#10003; dentro de lo normal. Barras: sRPE de la sesi&oacute;n.</div>';
    h += '</div>';
    c.innerHTML = h;

    if (typeof Chart === 'undefined') return;
    var ctx = document.getElementById('cmpf-ie-canvas');
    if (!ctx) return;
    if (window.cmPfChartIE) { try { window.cmPfChartIE.destroy(); } catch (e) {} }
    var labels = serie.map(function (p) { return cmPfFormatFecha(p.fecha).slice(0, 5); });
    window.cmPfChartIE = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line', label: 'UA/km', yAxisID: 'y', order: 1,
                    data: serie.map(function (p) { return p.uakm; }),
                    borderColor: '#a78bfa', backgroundColor: '#a78bfa', tension: .3, borderWidth: 2,
                    pointRadius: 6, pointHoverRadius: 8,
                    pointBackgroundColor: serie.map(function (p) { return p.estado ? col[p.estado] : '#64748b'; }),
                    pointBorderColor: '#0f172a', pointBorderWidth: 1
                },
                {
                    type: 'line', label: 'Media m\u00f3vil (' + CMPF_IE_VENTANA + ' ses. previas)', yAxisID: 'y', order: 2,
                    data: serie.map(function (p) { return p.base; }),
                    borderColor: '#94a3b8', borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, tension: .2, spanGaps: true
                },
                {
                    type: 'bar', label: 'sRPE (UA)', yAxisID: 'y1', order: 3,
                    data: serie.map(function (p) { return p.srpe; }),
                    backgroundColor: 'rgba(148,163,184,0.18)', borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } },
                tooltip: {
                    callbacks: {
                        afterBody: function (items) {
                            var p = serie[items[0].dataIndex];
                            var t = ['RPE ' + p.rpe + ' \u00d7 ' + Math.round(p.min) + ' min = ' + p.srpe + ' UA', Math.round(p.td) + ' m'];
                            if (p.estado) t.push((p.estado === 'fatiga' ? 'Posible fatiga' : p.estado === 'sobrado' ? 'Va sobrado' : 'Concuerdan') + ' (' + (p.pct >= 0 ? '+' : '') + p.pct + '% vs media ' + p.base + ')');
                            if (p.titulo) t.push(p.titulo);
                            return t;
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: '#1e293b' } },
                y: { position: 'left', title: { display: true, text: 'UA/km', color: '#a78bfa' }, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                y1: { position: 'right', title: { display: true, text: 'sRPE', color: '#64748b' }, ticks: { color: '#64748b' }, grid: { drawOnChartArea: false }, beginAtZero: true }
            }
        }
    });
}

console.log('[PrepFisica] cm-prepfisica-ie.js cargado (evolucion carga interna/externa)');
