// ========== CM-PREPFISICA-SESION.JS (v4) - Informe de sesion GPS mejorado ==========
// Sobrescribe cmPfRenderSesionCompleta (misma firma, mismos datos). Incluye:
// - Vista TABLA: metricas relativas, %Vmax individual (sesiones anteriores),
//   ordenacion, coloreado por desviacion, chips de destacados y alertas.
// - Vista GRAFICAS (Chart.js): barras por metrica, zonas apiladas, radar.
// - v3: comparacion de cada jugador con SU media de las ultimas 4 semanas
//   (mismo tipo de sesion), interruptor "vs 4 sem" en la tabla, alertas de
//   picos de carga (+30% sobre su media) y filas de media por posicion.
// - v4: exportacion del informe a PDF (jsPDF + autoTable, sin emojis) y a CSV
//   compatible con Excel es-ES (separador ';', decimales con coma, BOM).
// No modifica cm-prepfisica.js. Cargar DESPUES de cm-prepfisica.js.

var cmPfSes2 = {
    ses: null, allData: [], playerMap: {}, segmentos: [],
    segmento: 'TOTAL',
    vista: 'tabla',            // 'tabla' | 'graficas'
    metrica: 'td',
    jugadorRadar: null,
    sortCol: 'td', sortDir: -1,
    vmaxRef: {},               // player_id -> vmax historica (sesiones anteriores)
    refsCargadas: false,
    vsHist: false,             // interruptor comparacion 4 semanas
    hist: {},                  // player_id -> {n, td, mmin, hsr, hsrmin, spr, nspr, vmax, acc, dec}
    histCargado: false,
    charts: []
};

var CMPFSES2_HISTKEYS = ['td', 'mmin', 'hsr', 'hsrmin', 'spr', 'nspr', 'vmax', 'acc', 'dec'];

// ---------- Override del render ----------
(function () {
    var intentos = 0;
    var t = setInterval(function () {
        intentos++;
        if (typeof cmPfRenderSesionCompleta === 'function' || intentos > 40) {
            clearInterval(t);
            if (typeof cmPfRenderSesionCompleta === 'function') {
                cmPfRenderSesionCompleta = function (ses, allData, playerMap, segmentos) {
                    cmPfSes2.ses = ses;
                    cmPfSes2.allData = allData;
                    cmPfSes2.playerMap = playerMap;
                    cmPfSes2.segmentos = segmentos;
                    cmPfSes2.segmento = segmentos.indexOf('TOTAL') !== -1 ? 'TOTAL' : segmentos[0];
                    cmPfSes2.vista = 'tabla';
                    cmPfSes2.metrica = 'td';
                    cmPfSes2.jugadorRadar = null;
                    cmPfSes2.sortCol = 'td';
                    cmPfSes2.sortDir = -1;
                    cmPfSes2.refsCargadas = false;
                    cmPfSes2.vsHist = false;
                    cmPfSes2.hist = {};
                    cmPfSes2.histCargado = false;
                    cmPfSes2Render();
                    cmPfSes2CargarReferencias();
                    cmPfSes2CargarHistorico();
                };
                console.log('[PrepFisica] Informe de sesion mejorado activo (v3 con historico)');
            }
        }
    }, 300);
})();

// ---------- Vmax historica (sesiones anteriores a la actual) ----------
async function cmPfSes2CargarReferencias() {
    try {
        var pids = [];
        cmPfSes2.allData.forEach(function (d) { if (pids.indexOf(d.player_id) === -1) pids.push(d.player_id); });
        var r = await supabaseClient.from('cm_pf_gps_player_data')
            .select('player_id, max_speed_kmh')
            .in('player_id', pids).eq('archived', false).not('max_speed_kmh', 'is', null)
            .neq('session_id', cmPfSes2.ses.id);
        cmPfSes2.vmaxRef = {};
        (r.data || []).forEach(function (d) {
            var v = parseFloat(d.max_speed_kmh);
            if (!isNaN(v) && (!cmPfSes2.vmaxRef[d.player_id] || v > cmPfSes2.vmaxRef[d.player_id])) {
                cmPfSes2.vmaxRef[d.player_id] = v;
            }
        });
        cmPfSes2.refsCargadas = true;
        cmPfSes2Render();
    } catch (e) { /* el informe funciona igual sin referencias */ }
}

// ---------- Media 4 semanas por jugador (mismo tipo de sesion) ----------
async function cmPfSes2CargarHistorico() {
    try {
        var ses = cmPfSes2.ses;
        var pids = [];
        cmPfSes2.allData.forEach(function (d) { if (pids.indexOf(d.player_id) === -1) pids.push(d.player_id); });

        var hasta = ses.session_date;                       // exclusivo
        var d0 = new Date(ses.session_date + 'T12:00:00');
        d0.setDate(d0.getDate() - 28);
        var desde = d0.getFullYear() + '-' + ('0' + (d0.getMonth() + 1)).slice(-2) + '-' + ('0' + d0.getDate()).slice(-2);

        // 1) Sesiones del mismo tipo en la ventana (dos consultas simples, sin joins)
        var sr = await supabaseClient.from('cm_pf_gps_sessions')
            .select('id')
            .eq('club_id', clubId).eq('session_type', ses.session_type)
            .gte('session_date', desde).lt('session_date', hasta);
        var sids = (sr.data || []).map(function (s) { return s.id; });
        cmPfSes2.histCargado = true;
        if (sids.length === 0) { cmPfSes2Render(); return; }

        // 2) Datos TOTAL de esas sesiones para los jugadores presentes
        var pr = await supabaseClient.from('cm_pf_gps_player_data')
            .select('player_id, total_distance_m, hsr_distance_m, sprint_distance_m, sprint_count, max_speed_kmh, accel_count, decel_count, duration_min, extra_metrics')
            .in('session_id', sids).in('player_id', pids)
            .eq('segment_name', 'TOTAL').eq('archived', false);

        var acum = {};
        (pr.data || []).forEach(function (d) {
            var min = d.duration_min !== null && d.duration_min !== undefined ? parseFloat(d.duration_min) : null;
            var td = d.total_distance_m !== null ? parseFloat(d.total_distance_m) : null;
            var hsr = d.hsr_distance_m !== null ? parseFloat(d.hsr_distance_m) : null;
            var ex = d.extra_metrics || {};
            var vals = {
                td: td,
                mmin: ex.distance_per_min !== undefined && ex.distance_per_min !== null ? parseFloat(ex.distance_per_min)
                    : (td !== null && min ? td / min : null),
                hsr: hsr,
                hsrmin: (hsr !== null && min) ? hsr / min : null,
                spr: d.sprint_distance_m !== null ? parseFloat(d.sprint_distance_m) : null,
                nspr: d.sprint_count !== null ? parseFloat(d.sprint_count) : null,
                vmax: d.max_speed_kmh !== null ? parseFloat(d.max_speed_kmh) : null,
                acc: d.accel_count !== null ? parseFloat(d.accel_count) : null,
                dec: d.decel_count !== null ? parseFloat(d.decel_count) : null
            };
            if (!acum[d.player_id]) { acum[d.player_id] = { n: 0, sum: {}, cnt: {} }; }
            acum[d.player_id].n++;
            CMPFSES2_HISTKEYS.forEach(function (k) {
                if (vals[k] !== null && !isNaN(vals[k])) {
                    acum[d.player_id].sum[k] = (acum[d.player_id].sum[k] || 0) + vals[k];
                    acum[d.player_id].cnt[k] = (acum[d.player_id].cnt[k] || 0) + 1;
                }
            });
        });

        cmPfSes2.hist = {};
        Object.keys(acum).forEach(function (pid) {
            var a = acum[pid];
            var h = { n: a.n };
            CMPFSES2_HISTKEYS.forEach(function (k) {
                h[k] = a.cnt[k] ? a.sum[k] / a.cnt[k] : null;
            });
            cmPfSes2.hist[pid] = h;
        });
        cmPfSes2Render();
    } catch (e) { cmPfSes2.histCargado = true; }
}

// ---------- Datos ----------
var CMPFSES2_COLS = [
    { k: 'min',    lbl: 'Min',      dec: 0 },
    { k: 'td',     lbl: 'TD(m)',    dec: 0 },
    { k: 'mmin',   lbl: 'm/min',    dec: 1 },
    { k: 'hsr',    lbl: 'HSR(m)',   dec: 0 },
    { k: 'hsrmin', lbl: 'HSR/min',  dec: 1 },
    { k: 'spr',    lbl: 'Spr(m)',   dec: 0 },
    { k: 'nspr',   lbl: 'N.Spr',    dec: 0 },
    { k: 'vmax',   lbl: 'Vmax',     dec: 1 },
    { k: 'pvmax',  lbl: '%VmaxInd', dec: 0 },
    { k: 'acc',    lbl: 'ACC',      dec: 0 },
    { k: 'dec',    lbl: 'DEC',      dec: 0 }
];

function cmPfSes2Filas() {
    var filas = [];
    cmPfSes2.allData.forEach(function (d) {
        if (d.segment_name !== cmPfSes2.segmento) return;
        var p = cmPfSes2.playerMap[d.player_id] || {};
        var ex = d.extra_metrics || {};
        var min = d.duration_min !== null && d.duration_min !== undefined ? parseFloat(d.duration_min) : null;
        var td = d.total_distance_m !== null ? parseFloat(d.total_distance_m) : null;
        var hsr = d.hsr_distance_m !== null ? parseFloat(d.hsr_distance_m) : null;
        var mmin = ex.distance_per_min !== undefined && ex.distance_per_min !== null ? parseFloat(ex.distance_per_min)
                 : (td !== null && min ? Math.round(td / min * 10) / 10 : null);
        var hsrmin = (hsr !== null && min) ? Math.round(hsr / min * 10) / 10 : null;
        var vmax = d.max_speed_kmh !== null ? parseFloat(d.max_speed_kmh) : null;
        var ref = cmPfSes2.vmaxRef[d.player_id] || null;
        var pvmax = (vmax !== null && ref) ? Math.round(vmax / ref * 100) : null;

        filas.push({
            pid: d.player_id,
            nombre: p.name || 'Jugador',
            pos: (p.positions_main && p.positions_main[0]) || '',
            min: min, td: td, mmin: mmin,
            hsr: hsr, hsrmin: hsrmin,
            spr: d.sprint_distance_m !== null ? parseFloat(d.sprint_distance_m) : null,
            nspr: d.sprint_count !== null ? parseFloat(d.sprint_count) : null,
            vmax: vmax, pvmax: pvmax,
            acc: d.accel_count !== null ? parseFloat(d.accel_count) : null,
            dec: d.decel_count !== null ? parseFloat(d.decel_count) : null,
            z: [d.z1_distance_m, d.z2_distance_m, d.z3_distance_m, d.z4_distance_m, d.z5_distance_m]
                .map(function (v) { return v !== null && v !== undefined ? parseFloat(v) : 0; })
        });
    });
    return filas;
}

function cmPfSes2Stats(filas, campo) {
    var vals = filas.map(function (f) { return f[campo]; }).filter(function (v) { return v !== null && !isNaN(v); });
    if (vals.length === 0) return null;
    var media = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    var sd = Math.sqrt(vals.reduce(function (a, b) { return a + Math.pow(b - media, 2); }, 0) / vals.length);
    return { media: media, sd: sd, max: Math.max.apply(null, vals), min: Math.min.apply(null, vals) };
}

function cmPfSes2Delta(f, k) {
    // % de diferencia del valor de hoy respecto a la media 4 sem del jugador
    var h = cmPfSes2.hist[f.pid];
    if (!h || h.n < 2 || h[k] === null || h[k] === 0 || f[k] === null) return null;
    return Math.round((f[k] / h[k] - 1) * 100);
}

// ---------- Chips de destacados y alertas (texto plano para PDF, html para pantalla) ----------
function cmPfSes2Chips(filas, stats) {
    var chips = [];
    if (filas.length <= 1) return chips;
    var top = function (campo) {
        var mejor = null;
        filas.forEach(function (f) { if (f[campo] !== null && (mejor === null || f[campo] > mejor[campo])) mejor = f; });
        return mejor;
    };
    var add = function (tipo, texto, html) { chips.push({ tipo: tipo, texto: texto, html: html || texto }); };

    var tVmax = top('vmax'), tTd = top('td'), tMmin = top('mmin');
    if (tVmax && tVmax.vmax !== null) {
        var nueva = cmPfSes2.refsCargadas && tVmax.pvmax !== null && tVmax.pvmax >= 100;
        var extra = nueva ? ' (record personal)' : '';
        add('info', 'Vmax del dia: ' + tVmax.nombre + ' ' + tVmax.vmax + extra,
            'Vmax del dia: <b>' + tVmax.nombre + ' ' + tVmax.vmax + '</b>' + extra);
    }
    if (tTd && tTd.td !== null) {
        add('info', 'Mas volumen: ' + tTd.nombre + ' ' + Math.round(tTd.td) + 'm',
            'Mas volumen: <b>' + tTd.nombre + ' ' + Math.round(tTd.td) + 'm</b>');
    }
    if (tMmin && tMmin.mmin !== null) {
        add('info', 'Mayor ritmo: ' + tMmin.nombre + ' ' + tMmin.mmin + ' m/min',
            'Mayor ritmo: <b>' + tMmin.nombre + ' ' + tMmin.mmin + ' m/min</b>');
    }
    var sMmin = stats['mmin'];
    filas.forEach(function (f) {
        if (sMmin && sMmin.sd > 0 && f.mmin !== null && (f.mmin - sMmin.media) / sMmin.sd <= -1.5) {
            add('alerta', f.nombre + ': ritmo muy por debajo del grupo (' + f.mmin + ' m/min)');
        }
        if (f.pvmax !== null && f.pvmax >= 95) {
            add('aviso', f.nombre + ': exposicion a velocidad maxima (' + f.pvmax + '% de su Vmax)');
        }
        var dTd = cmPfSes2Delta(f, 'td');
        if (dTd !== null && dTd >= 30) {
            add('aviso', f.nombre + ': volumen +' + dTd + '% sobre su media de 4 sem.');
        }
    });
    return chips;
}

// ---------- Interaccion ----------
function cmPfSes2Orden(col) {
    if (cmPfSes2.sortCol === col) cmPfSes2.sortDir = -cmPfSes2.sortDir;
    else { cmPfSes2.sortCol = col; cmPfSes2.sortDir = -1; }
    cmPfSes2Render();
}

function cmPfSes2CambiarSeg(s) { cmPfSes2.segmento = s; cmPfSes2Render(); }
function cmPfSes2CambiarVista(v) { cmPfSes2.vista = v; cmPfSes2Render(); }
function cmPfSes2CambiarMetrica(m) { cmPfSes2.metrica = m; cmPfSes2Render(); }
function cmPfSes2CambiarRadar(pid) { cmPfSes2.jugadorRadar = pid; cmPfSes2Render(); }
function cmPfSes2ToggleHist() { cmPfSes2.vsHist = !cmPfSes2.vsHist; cmPfSes2Render(); }

function cmPfSes2Cerrar() {
    cmPfSes2.charts.forEach(function (c) { try { c.destroy(); } catch (e) {} });
    cmPfSes2.charts = [];
    var ov = document.getElementById('cmpfses2-overlay');
    if (ov) ov.remove();
}

// ---------- Render principal ----------
function cmPfSes2Render() {
    cmPfSes2Cerrar();
    var ses = cmPfSes2.ses;
    var filas = cmPfSes2Filas();

    var col = cmPfSes2.sortCol, dir = cmPfSes2.sortDir;
    filas.sort(function (a, b) {
        var va = a[col], vb = b[col];
        if (va === null || va === undefined || (typeof va === 'number' && isNaN(va))) return 1;
        if (vb === null || vb === undefined || (typeof vb === 'number' && isNaN(vb))) return -1;
        if (typeof va === 'string') return va.localeCompare(vb) * dir;
        return (va - vb) * dir;
    });

    var stats = {};
    CMPFSES2_COLS.forEach(function (c) { stats[c.k] = cmPfSes2Stats(filas, c.k); });

    // Destacados y alertas
    var chips = cmPfSes2Chips(filas, stats);
    var destacados = '';
    if (chips.length) {
        destacados = '<div class="cmpfses2-chips">' + chips.map(function (c) {
            var cls = c.tipo === 'info' ? '' : ' ' + c.tipo;
            return '<span class="cmpfses2-chip' + cls + '">' + c.html + '</span>';
        }).join('') + '</div>';
    }

    var segSel = '';
    if (cmPfSes2.segmentos.length > 1) {
        segSel = '<select onchange="cmPfSes2CambiarSeg(this.value)" class="cmpfses2-sel">';
        cmPfSes2.segmentos.forEach(function (s) {
            segSel += '<option value="' + s + '"' + (s === cmPfSes2.segmento ? ' selected' : '') + '>' + s + '</option>';
        });
        segSel += '</select>';
    }

    var tipo = ses.session_type === 'match' ? 'Partido' : 'Entrenamiento';
    var tit = ses.title || (ses.opponent ? 'vs ' + ses.opponent : 'Sesion');
    var fechaFmt = typeof cmPfFormatFecha === 'function' ? cmPfFormatFecha(ses.session_date) : ses.session_date;

    var cuerpo = cmPfSes2.vista === 'tabla'
        ? cmPfSes2HtmlTabla(filas, stats)
        : cmPfSes2HtmlGraficas(filas);

    var ov = document.createElement('div');
    ov.id = 'cmpfses2-overlay';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.75);z-index:9400;display:flex;justify-content:center;align-items:flex-start;padding:25px;overflow-y:auto';
    ov.onclick = function (e) { if (e.target === ov) cmPfSes2Cerrar(); };
    ov.innerHTML =
    '<style>' +
        '.cmpfses2-modal{background:#0f172a;border-radius:14px;width:100%;max-width:1200px;max-height:92vh;overflow:auto;border:1px solid #fbbf24;padding:20px}' +
        '.cmpfses2-modal h3{color:#e2e8f0;font-size:17px;margin:0}' +
        '.cmpfses2-sel{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:5px 8px;border-radius:6px;font-size:12px}' +
        '.cmpfses2-vistas{display:flex;gap:6px;margin-top:12px;align-items:center;flex-wrap:wrap}' +
        '.cmpfses2-vbtn{background:#1e293b;border:1px solid #334155;color:#94a3b8;padding:6px 16px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600}' +
        '.cmpfses2-vbtn.act{background:#0f3d3e;border-color:#14b8a6;color:#14b8a6}' +
        '.cmpfses2-hbtn{background:#1e293b;border:1px solid #334155;color:#94a3b8;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:11px}' +
        '.cmpfses2-hbtn.act{background:#172554;border-color:#3b82f6;color:#93c5fd}' +
        '.cmpfses2-chips{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 0}' +
        '.cmpfses2-chip{background:#1e293b;color:#cbd5e1;padding:5px 12px;border-radius:14px;font-size:11px}' +
        '.cmpfses2-chip b{color:#4ade80}' +
        '.cmpfses2-chip.alerta{background:#450a0a;color:#fca5a5}' +
        '.cmpfses2-chip.aviso{background:#451a03;color:#fcd34d}' +
        '.cmpfses2-tabla{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}' +
        '.cmpfses2-tabla th{color:#94a3b8;padding:7px 8px;border-bottom:1px solid #334155;font-size:10px;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap;user-select:none}' +
        '.cmpfses2-tabla td{color:#e2e8f0;padding:6px 8px;border-bottom:1px solid #1e293b;text-align:right;white-space:nowrap;vertical-align:top}' +
        '.cmpfses2-tabla td:first-child,.cmpfses2-tabla th:first-child{text-align:left}' +
        '.cmpfses2-tabla td:nth-child(2){text-align:left}' +
        '.cmpfses2-tabla tbody tr:hover{background:#16213a}' +
        '.cmpfses2-resumen td{border-bottom:none;font-size:11px;padding:4px 8px}' +
        '.cmpfses2-delta{display:block;font-size:9px;margin-top:1px}' +
        '.cmpfses2-delta.up{color:#5eead4}' +
        '.cmpfses2-delta.down{color:#fdba74}' +
        '.cmpfses2-delta.pico{color:#facc15;font-weight:700}' +
        '.cmpfses2-leyenda{color:#64748b;font-size:10px;margin-top:10px}' +
        '.cmpfses2-gbox{background:#1e293b;border-radius:10px;padding:14px;margin-top:14px}' +
        '.cmpfses2-gbox h4{color:#e2e8f0;font-size:13px;margin:0 0 10px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}' +
        '.cmpfses2-gwrap{position:relative;width:100%}' +
    '</style>' +
    '<div class="cmpfses2-modal">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">' +
            '<h3>' + fechaFmt + ' &middot; ' + tipo + ' &middot; ' + tit + '</h3>' +
            '<div style="display:flex;gap:8px;align-items:center">' + segSel +
                '<button style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer" onclick="cmPfSes2Cerrar()">x</button>' +
            '</div>' +
        '</div>' +
        (ses.duration_min ? '<div style="color:#94a3b8;font-size:12px;margin-top:2px">' + ses.duration_min + ' min</div>' : '') +
        '<div class="cmpfses2-vistas">' +
            '<button class="cmpfses2-vbtn' + (cmPfSes2.vista === 'tabla' ? ' act' : '') + '" onclick="cmPfSes2CambiarVista(\'tabla\')">Tabla</button>' +
            '<button class="cmpfses2-vbtn' + (cmPfSes2.vista === 'graficas' ? ' act' : '') + '" onclick="cmPfSes2CambiarVista(\'graficas\')">Graficas</button>' +
            (cmPfSes2.vista === 'tabla' ? '<button class="cmpfses2-hbtn' + (cmPfSes2.vsHist ? ' act' : '') + '" onclick="cmPfSes2ToggleHist()" title="Mostrar bajo cada valor la diferencia con la media del jugador en las ultimas 4 semanas (mismo tipo de sesion)">vs 4 sem: ' + (cmPfSes2.vsHist ? 'ON' : 'OFF') + '</button>' : '') +
            '<div style="display:flex;gap:6px;margin-left:auto">' +
                '<button class="cmpfses2-vbtn" onclick="cmPfSes2ExportPdf()">PDF</button>' +
                '<button class="cmpfses2-vbtn" onclick="cmPfSes2ExportCsv()">CSV</button>' +
            '</div>' +
        '</div>' +
        destacados +
        cuerpo +
    '</div>';
    document.body.appendChild(ov);

    if (cmPfSes2.vista === 'graficas') cmPfSes2PintarGraficas(filas);
}

// ---------- Vista TABLA ----------
function cmPfSes2HtmlTabla(filas, stats) {
    var celda = function (f, c) {
        var v = f[c.k];
        if (v === null || v === undefined || isNaN(v)) return '<td style="color:#475569">-</td>';
        var s = stats[c.k];
        var estilo = '';
        if (s && s.sd > 0 && c.k !== 'min') {
            var z = (v - s.media) / s.sd;
            if (z >= 0.75) estilo = 'color:#4ade80;font-weight:600';
            else if (z <= -0.75) estilo = 'color:#f87171';
        }
        if (c.k === 'pvmax') {
            if (v >= 95) estilo = 'color:#facc15;font-weight:700';
            else if (v >= 90) estilo = 'color:#4ade80;font-weight:600';
            else estilo = '';
        }
        var txt = c.dec === 0 ? Math.round(v) : (Math.round(v * 10) / 10);
        if (c.k === 'pvmax') txt += '%';

        // Delta vs media 4 semanas del propio jugador
        var deltaHtml = '';
        if (cmPfSes2.vsHist && CMPFSES2_HISTKEYS.indexOf(c.k) !== -1) {
            var d = cmPfSes2Delta(f, c.k);
            if (d === null) deltaHtml = '<span class="cmpfses2-delta" style="color:#475569">&middot;</span>';
            else {
                var cls = Math.abs(d) >= 30 ? 'pico' : (d >= 0 ? 'up' : 'down');
                deltaHtml = '<span class="cmpfses2-delta ' + cls + '">' + (d >= 0 ? '+' : '') + d + '%</span>';
            }
        }
        return '<td style="' + estilo + '">' + txt + deltaHtml + '</td>';
    };

    var zcolors = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444'];
    var zn = (typeof cmPfGpsConfig !== 'undefined' && cmPfGpsConfig && cmPfGpsConfig.zone_names) || ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];
    var barraZonas = function (z) {
        var tot = z.reduce(function (a, b) { return a + b; }, 0);
        if (tot <= 0) return '<td>-</td>';
        var h = '<td><div style="display:flex;width:110px;height:10px;border-radius:5px;overflow:hidden" title="';
        z.forEach(function (v, i) { h += zn[i] + ': ' + Math.round(v) + 'm  '; });
        h += '">';
        z.forEach(function (v, i) {
            var pct = v / tot * 100;
            if (pct > 0) h += '<div style="width:' + pct + '%;background:' + zcolors[i] + '"></div>';
        });
        return h + '</div></td>';
    };

    var flecha = function (k) { return cmPfSes2.sortCol === k ? (cmPfSes2.sortDir === -1 ? ' &#9660;' : ' &#9650;') : ''; };
    var thead = '<tr><th onclick="cmPfSes2Orden(\'nombre\')" style="cursor:pointer">Jugador' + flecha('nombre') + '</th><th>Pos</th>';
    CMPFSES2_COLS.forEach(function (c) {
        thead += '<th onclick="cmPfSes2Orden(\'' + c.k + '\')" style="cursor:pointer;text-align:right">' + c.lbl + flecha(c.k) + '</th>';
    });
    thead += '<th>Zonas</th></tr>';

    var tbody = '';
    filas.forEach(function (f) {
        tbody += '<tr><td style="font-weight:600">' + f.nombre + '</td><td style="color:#94a3b8;font-size:11px">' + f.pos + '</td>';
        CMPFSES2_COLS.forEach(function (c) { tbody += celda(f, c); });
        tbody += barraZonas(f.z) + '</tr>';
    });

    // Medias por posicion (si hay mas de una posicion con datos)
    var posiciones = {};
    filas.forEach(function (f) {
        var p = f.pos || 'sin posicion';
        if (!posiciones[p]) posiciones[p] = [];
        posiciones[p].push(f);
    });
    var posKeys = Object.keys(posiciones);
    var filasPos = '';
    if (posKeys.length > 1) {
        posKeys.sort();
        posKeys.forEach(function (p) {
            var grupo = posiciones[p];
            filasPos += '<tr class="cmpfses2-resumen" style="color:#38bdf8"><td>MEDIA ' + p.toUpperCase() + '</td><td>(' + grupo.length + ')</td>';
            CMPFSES2_COLS.forEach(function (c) {
                var st = cmPfSes2Stats(grupo, c.k);
                filasPos += '<td style="text-align:right">' + (st ? (Math.round(st.media * 10) / 10) : '-') + '</td>';
            });
            filasPos += '<td></td></tr>';
        });
    }

    var resumen = '';
    ['media', 'sd', 'max', 'min'].forEach(function (tipo) {
        var lbl = { media: 'MEDIA', sd: 'DESV.TIP', max: 'MAX', min: 'MIN' }[tipo];
        var color = { media: '#4ade80', sd: '#64748b', max: '#4ade80', min: '#f87171' }[tipo];
        resumen += '<tr class="cmpfses2-resumen" style="color:' + color + '"><td>' + lbl + '</td><td></td>';
        CMPFSES2_COLS.forEach(function (c) {
            var s = stats[c.k];
            var v = s ? (tipo === 'sd' ? s.sd : s[tipo === 'media' ? 'media' : tipo]) : null;
            resumen += '<td style="text-align:right">' + (v !== null ? (Math.round(v * 10) / 10) : '-') + '</td>';
        });
        resumen += '<td></td></tr>';
    });

    var notaHist = '';
    if (cmPfSes2.vsHist) {
        notaHist = cmPfSes2.histCargado
            ? ' &middot; vs 4 sem: diferencia con la media del jugador en sesiones de este tipo en los 28 dias previos (amarillo: &plusmn;30% o mas; "&middot;": sin historial suficiente, minimo 2 sesiones)'
            : ' &middot; cargando historico...';
    }

    return '<div style="overflow-x:auto"><table class="cmpfses2-tabla"><thead>' + thead + '</thead><tbody>' + tbody + resumen + filasPos + '</tbody></table></div>' +
        '<div class="cmpfses2-leyenda">Verde/rojo: por encima/debajo de la media del grupo (&plusmn;0,75 desv.tip.) &middot; %VmaxInd: velocidad del dia respecto a la maxima historica del jugador en sesiones anteriores (amarillo &ge;95%; "-" si aun no hay historial previo) &middot; Clic en una cabecera para ordenar' + notaHist + ' &middot; ' + filas.length + ' jugadores en segmento ' + cmPfSes2.segmento + '</div>';
}

// ---------- Vista GRAFICAS ----------
function cmPfSes2HtmlGraficas(filas) {
    if (typeof Chart === 'undefined') {
        return '<div style="color:#fca5a5;padding:30px;text-align:center">Chart.js no esta disponible</div>';
    }
    var metricaOpts = '';
    CMPFSES2_COLS.forEach(function (c) {
        if (c.k === 'min') return;
        metricaOpts += '<option value="' + c.k + '"' + (cmPfSes2.metrica === c.k ? ' selected' : '') + '>' + c.lbl + '</option>';
    });

    if (!cmPfSes2.jugadorRadar && filas.length) cmPfSes2.jugadorRadar = filas[0].pid;
    var radarOpts = '';
    filas.forEach(function (f) {
        radarOpts += '<option value="' + f.pid + '"' + (cmPfSes2.jugadorRadar === f.pid ? ' selected' : '') + '>' + f.nombre + '</option>';
    });

    var altura = Math.max(220, filas.length * 26 + 60);

    return '<div class="cmpfses2-gbox">' +
            '<h4>Comparativa por metrica' +
                '<select class="cmpfses2-sel" onchange="cmPfSes2CambiarMetrica(this.value)">' + metricaOpts + '</select>' +
            '</h4>' +
            '<div class="cmpfses2-gwrap" style="height:' + altura + 'px"><canvas id="cmpfses2-cbar"></canvas></div>' +
        '</div>' +
        '<div class="cmpfses2-gbox">' +
            '<h4>Distancia por zonas de velocidad</h4>' +
            '<div class="cmpfses2-gwrap" style="height:' + altura + 'px"><canvas id="cmpfses2-czonas"></canvas></div>' +
        '</div>' +
        '<div class="cmpfses2-gbox">' +
            '<h4>Perfil del jugador vs media del equipo' +
                '<select class="cmpfses2-sel" onchange="cmPfSes2CambiarRadar(this.value)">' + radarOpts + '</select>' +
            '</h4>' +
            '<div class="cmpfses2-gwrap" style="height:340px;max-width:520px;margin:0 auto"><canvas id="cmpfses2-cradar"></canvas></div>' +
            '<div class="cmpfses2-leyenda" style="text-align:center">Cada eje se expresa como % del maximo del grupo en esta sesion</div>' +
        '</div>';
}

function cmPfSes2PintarGraficas(filas) {
    if (typeof Chart === 'undefined' || !filas.length) return;
    var gris = '#94a3b8', reja = '#1e293b';

    var mk = cmPfSes2.metrica;
    var mcol = null;
    CMPFSES2_COLS.forEach(function (c) { if (c.k === mk) mcol = c; });
    var ordenadas = filas.slice().sort(function (a, b) {
        var va = a[mk] === null ? -Infinity : a[mk], vb = b[mk] === null ? -Infinity : b[mk];
        return vb - va;
    });
    var s = cmPfSes2Stats(filas, mk);
    var colores = ordenadas.map(function (f) {
        if (f[mk] === null || !s || s.sd === 0) return '#3b82f6';
        var z = (f[mk] - s.media) / s.sd;
        return z >= 0.75 ? '#4ade80' : (z <= -0.75 ? '#f87171' : '#3b82f6');
    });
    var elBar = document.getElementById('cmpfses2-cbar');
    if (elBar) {
        cmPfSes2.charts.push(new Chart(elBar, {
            type: 'bar',
            data: {
                labels: ordenadas.map(function (f) { return f.nombre; }),
                datasets: [{ label: mcol ? mcol.lbl : mk, data: ordenadas.map(function (f) { return f[mk]; }), backgroundColor: colores, borderRadius: 4 }]
            },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (ctx) { return (mcol ? mcol.lbl : mk) + ': ' + ctx.raw + (s ? '  (media ' + (Math.round(s.media * 10) / 10) + ')' : ''); } } } },
                scales: {
                    x: { ticks: { color: gris }, grid: { color: reja } },
                    y: { ticks: { color: '#e2e8f0', font: { size: 11 } }, grid: { display: false } }
                }
            }
        }));
    }

    var zn = (typeof cmPfGpsConfig !== 'undefined' && cmPfGpsConfig && cmPfGpsConfig.zone_names) || ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];
    var zcolors = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444'];
    var porTd = filas.slice().sort(function (a, b) { return (b.td || 0) - (a.td || 0); });
    var dsZonas = [];
    for (var zi = 0; zi < 5; zi++) {
        dsZonas.push({
            label: zn[zi] || ('Z' + (zi + 1)),
            data: porTd.map(function (f) { return Math.round(f.z[zi] || 0); }),
            backgroundColor: zcolors[zi], borderRadius: 2
        });
    }
    var elZ = document.getElementById('cmpfses2-czonas');
    if (elZ) {
        cmPfSes2.charts.push(new Chart(elZ, {
            type: 'bar',
            data: { labels: porTd.map(function (f) { return f.nombre; }), datasets: dsZonas },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: gris, boxWidth: 12, font: { size: 10 } } } },
                scales: {
                    x: { stacked: true, ticks: { color: gris }, grid: { color: reja }, title: { display: true, text: 'metros', color: gris, font: { size: 10 } } },
                    y: { stacked: true, ticks: { color: '#e2e8f0', font: { size: 11 } }, grid: { display: false } }
                }
            }
        }));
    }

    var ejes = [
        { k: 'mmin',   lbl: 'm/min' },
        { k: 'hsrmin', lbl: 'HSR/min' },
        { k: 'spr',    lbl: 'Sprint(m)' },
        { k: 'nspr',   lbl: 'N.Sprints' },
        { k: 'vmax',   lbl: 'Vmax' },
        { k: 'acc',    lbl: 'ACC' },
        { k: 'dec',    lbl: 'DEC' }
    ];
    var jug = null;
    filas.forEach(function (f) { if (f.pid === cmPfSes2.jugadorRadar) jug = f; });
    if (!jug) jug = filas[0];
    var norm = function (v, k) {
        var st = cmPfSes2Stats(filas, k);
        if (v === null || !st || st.max <= 0) return 0;
        return Math.round(v / st.max * 100);
    };
    var dJug = ejes.map(function (e) { return norm(jug[e.k], e.k); });
    var dMed = ejes.map(function (e) {
        var st = cmPfSes2Stats(filas, e.k);
        return st && st.max > 0 ? Math.round(st.media / st.max * 100) : 0;
    });
    var elR = document.getElementById('cmpfses2-cradar');
    if (elR) {
        cmPfSes2.charts.push(new Chart(elR, {
            type: 'radar',
            data: {
                labels: ejes.map(function (e) { return e.lbl; }),
                datasets: [
                    { label: jug.nombre, data: dJug, borderColor: '#14b8a6', backgroundColor: 'rgba(20,184,166,.25)', pointBackgroundColor: '#14b8a6' },
                    { label: 'Media equipo', data: dMed, borderColor: '#94a3b8', backgroundColor: 'rgba(148,163,184,.12)', pointBackgroundColor: '#94a3b8', borderDash: [5, 4] }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: gris, boxWidth: 12, font: { size: 11 } } } },
                scales: { r: {
                    min: 0, max: 100,
                    ticks: { display: false },
                    grid: { color: reja }, angleLines: { color: reja },
                    pointLabels: { color: '#e2e8f0', font: { size: 11 } }
                } }
            }
        }));
    }
}

// ---------- Exportacion ----------
function cmPfSes2NombreArchivo(ext) {
    var ses = cmPfSes2.ses;
    var tit = (ses.title || (ses.opponent ? 'vs ' + ses.opponent : 'sesion'))
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
    return 'gps_' + ses.session_date + '_' + (tit || 'sesion') + '.' + ext;
}

function cmPfSes2ExportCsv() {
    var filas = cmPfSes2Filas();
    var col = cmPfSes2.sortCol, dir = cmPfSes2.sortDir;
    filas.sort(function (a, b) {
        var va = a[col], vb = b[col];
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        if (typeof va === 'string') return va.localeCompare(vb) * dir;
        return (va - vb) * dir;
    });

    var conHist = cmPfSes2.histCargado && Object.keys(cmPfSes2.hist).length > 0;
    var zn = (typeof cmPfGpsConfig !== 'undefined' && cmPfGpsConfig && cmPfGpsConfig.zone_names) || ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];

    // Numero con coma decimal para Excel es-ES
    var num = function (v, dec) {
        if (v === null || v === undefined || isNaN(v)) return '';
        var n = dec === 0 ? Math.round(v) : Math.round(v * 10) / 10;
        return String(n).replace('.', ',');
    };

    var cab = ['Jugador', 'Posicion'];
    CMPFSES2_COLS.forEach(function (c) { cab.push(c.lbl); });
    zn.forEach(function (z, i) { cab.push((z || ('Z' + (i + 1))) + ' (m)'); });
    if (conHist) CMPFSES2_HISTKEYS.forEach(function (k) { cab.push('vs4sem ' + k + ' (%)'); });

    var lineas = [cab.join(';')];
    filas.forEach(function (f) {
        var l = ['"' + f.nombre.replace(/"/g, '""') + '"', '"' + (f.pos || '') + '"'];
        CMPFSES2_COLS.forEach(function (c) { l.push(num(f[c.k], c.dec)); });
        f.z.forEach(function (v) { l.push(num(v, 1)); });
        if (conHist) CMPFSES2_HISTKEYS.forEach(function (k) {
            var d = cmPfSes2Delta(f, k);
            l.push(d === null ? '' : String(d));
        });
        lineas.push(l.join(';'));
    });

    // BOM para que Excel abra el CSV con la codificacion correcta
    var blob = new Blob(['\uFEFF' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = cmPfSes2NombreArchivo('csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    if (typeof showToast === 'function') showToast('CSV descargado');
}

function cmPfSes2ExportPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        if (typeof showToast === 'function') showToast('jsPDF no esta disponible', 'error');
        return;
    }
    var ses = cmPfSes2.ses;
    var filas = cmPfSes2Filas();
    var col = cmPfSes2.sortCol, dir = cmPfSes2.sortDir;
    filas.sort(function (a, b) {
        var va = a[col], vb = b[col];
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        if (typeof va === 'string') return va.localeCompare(vb) * dir;
        return (va - vb) * dir;
    });
    var stats = {};
    CMPFSES2_COLS.forEach(function (c) { stats[c.k] = cmPfSes2Stats(filas, c.k); });

    var doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    var tipo = ses.session_type === 'match' ? 'Partido' : 'Entrenamiento';
    var tit = ses.title || (ses.opponent ? 'vs ' + ses.opponent : 'Sesion');
    var fechaFmt = typeof cmPfFormatFecha === 'function' ? cmPfFormatFecha(ses.session_date) : ses.session_date;

    // Cabecera
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Informe GPS - ' + tipo, 12, 9);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(fechaFmt + '  |  ' + tit + (ses.duration_min ? '  |  ' + ses.duration_min + ' min' : '') + '  |  Segmento ' + cmPfSes2.segmento, 12, 16);

    // Chips de destacados como lineas de texto
    var chips = cmPfSes2Chips(filas, stats);
    var y = 28;
    doc.setFontSize(8);
    chips.forEach(function (c) {
        if (y > 45) return; // limitar espacio de cabecera
        if (c.tipo === 'alerta') doc.setTextColor(180, 30, 30);
        else if (c.tipo === 'aviso') doc.setTextColor(180, 120, 0);
        else doc.setTextColor(60, 60, 60);
        doc.text('- ' + c.texto, 12, y);
        y += 4;
    });
    doc.setTextColor(0, 0, 0);

    // Tabla principal
    var zn = (typeof cmPfGpsConfig !== 'undefined' && cmPfGpsConfig && cmPfGpsConfig.zone_names) || ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'];
    var head = ['Jugador', 'Pos'];
    CMPFSES2_COLS.forEach(function (c) { head.push(c.lbl); });
    head.push('Zonas ' + zn.map(function (z, i) { return z || ('Z' + (i + 1)); }).join('/') + ' (m)');

    var fmt = function (v, dec) {
        if (v === null || v === undefined || isNaN(v)) return '-';
        return String(dec === 0 ? Math.round(v) : Math.round(v * 10) / 10);
    };
    var body = filas.map(function (f) {
        var l = [f.nombre, f.pos || ''];
        CMPFSES2_COLS.forEach(function (c) {
            var t = fmt(f[c.k], c.dec);
            if (c.k === 'pvmax' && t !== '-') t += '%';
            l.push(t);
        });
        l.push(f.z.map(function (v) { return Math.round(v); }).join('/'));
        return l;
    });

    // Filas de resumen
    var foot = [];
    ['media', 'sd', 'max', 'min'].forEach(function (tipoR) {
        var lbl = { media: 'MEDIA', sd: 'DESV.TIP', max: 'MAX', min: 'MIN' }[tipoR];
        var l = [lbl, ''];
        CMPFSES2_COLS.forEach(function (c) {
            var s = stats[c.k];
            var v = s ? (tipoR === 'sd' ? s.sd : s[tipoR === 'media' ? 'media' : tipoR]) : null;
            l.push(v !== null ? String(Math.round(v * 10) / 10) : '-');
        });
        l.push('');
        foot.push(l);
    });
    // Medias por posicion
    var posiciones = {};
    filas.forEach(function (f) {
        var p = f.pos || 'sin posicion';
        if (!posiciones[p]) posiciones[p] = [];
        posiciones[p].push(f);
    });
    var posKeys = Object.keys(posiciones);
    if (posKeys.length > 1) {
        posKeys.sort();
        posKeys.forEach(function (p) {
            var l = ['MEDIA ' + p.toUpperCase(), '(' + posiciones[p].length + ')'];
            CMPFSES2_COLS.forEach(function (c) {
                var st = cmPfSes2Stats(posiciones[p], c.k);
                l.push(st ? String(Math.round(st.media * 10) / 10) : '-');
            });
            l.push('');
            foot.push(l);
        });
    }

    doc.autoTable({
        startY: Math.max(y + 2, 32),
        head: [head],
        body: body,
        foot: foot,
        styles: { fontSize: 7, cellPadding: 1.5, halign: 'right' },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold' }, 1: { halign: 'left' } },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 6.5, halign: 'right' },
        footStyles: { fillColor: [240, 240, 240], textColor: [60, 60, 60], fontSize: 6.5, halign: 'right' },
        theme: 'grid'
    });

    // Pie
    var yFin = doc.lastAutoTable.finalY + 6;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('%VmaxInd: velocidad del dia respecto a la maxima historica del jugador en sesiones anteriores. Zonas: ' +
        zn.join(' / ') + ' km/h segun configuracion del club.', 12, Math.min(yFin, 200));
    doc.text('Generado con TopLiderCoach el ' + new Date().toLocaleDateString('es-ES') + ' a las ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }), 12, Math.min(yFin + 4, 204));

    doc.save(cmPfSes2NombreArchivo('pdf'));
    if (typeof showToast === 'function') showToast('PDF descargado');
}

console.log('[PrepFisica] cm-prepfisica-sesion.js v4 cargado (tabla + graficas + historico + PDF/CSV)');
