// ========== CM-PREPFISICA-RAW.JS - Analisis avanzado del JSON crudo del GPS ==========
// Procesa en el navegador el JSON de 10 Hz del dispositivo (velocidad en NUDOS)
// y guarda solo el resultado destilado (~10 KB) en extra_metrics.raw de la fila
// del jugador en cm_pf_gps_player_data. El JSON crudo NO se almacena.
// Calcula: mapa de calor orientado por PCA, curva de intensidad (m/min por
// minuto), MDP (peor pasaje de 1'/3'/5') y listado de sprints con minuto,
// duracion, metros y velocidad pico.
// Se engancha al informe de sesion (cm-prepfisica-sesion.js) con un boton
// "JSON crudo". Cargar DESPUES de cm-prepfisica-sesion.js.

var cmPfRaw = {
    archivos: {},     // player_id -> File pendiente de procesar
    charts: []
};

var CMPFRAW_KNOTS = 1.852;   // nudos -> km/h (verificado contra distancia por coordenadas)
var CMPFRAW_COLS = 42;
var CMPFRAW_ROWS = 27;

// ---------- Hook: boton "JSON crudo" en el informe de sesion ----------
(function () {
    var intentos = 0;
    var t = setInterval(function () {
        intentos++;
        if (typeof cmPfSes2Render === 'function' || intentos > 40) {
            clearInterval(t);
            if (typeof cmPfSes2Render !== 'function') return;
            var orig = cmPfSes2Render;
            cmPfSes2Render = function () {
                orig();
                var barra = document.querySelector('#cmpfses2-overlay .cmpfses2-vistas');
                if (barra && !document.getElementById('cmpfraw-btn')) {
                    var b = document.createElement('button');
                    b.className = 'cmpfses2-vbtn';
                    b.id = 'cmpfraw-btn';
                    b.textContent = 'JSON crudo';
                    b.onclick = cmPfRawAbrirGestor;
                    var grupo = barra.querySelector('div[style*="margin-left:auto"]');
                    if (grupo) grupo.insertBefore(b, grupo.firstChild);
                    else barra.appendChild(b);
                }
            };
            console.log('[PrepFisica] Analisis JSON crudo enganchado al informe de sesion');
        }
    }, 300);
})();

// ---------- Gestor: asignar archivos a jugadores ----------
function cmPfRawAbrirGestor() {
    cmPfRawCerrarGestor();
    cmPfRaw.archivos = {};

    var filas = cmPfSes2.allData.filter(function (d) { return d.segment_name === cmPfSes2.segmento; });

    var ov = document.createElement('div');
    ov.id = 'cmpfraw-gestor';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.75);z-index:9600;display:flex;justify-content:center;align-items:flex-start;padding:30px;overflow-y:auto';
    ov.onclick = function (e) { if (e.target === ov) cmPfRawCerrarGestor(); };

    var lista = '';
    filas.forEach(function (d) {
        var p = cmPfSes2.playerMap[d.player_id] || {};
        var tiene = d.extra_metrics && d.extra_metrics.raw;
        lista += '<div class="cmpfraw-fila" id="cmpfraw-fila-' + d.id + '">' +
            '<div style="flex:1;min-width:140px"><b>' + (p.name || 'Jugador') + '</b>' +
                '<span class="cmpfraw-estado" id="cmpfraw-estado-' + d.id + '">' +
                (tiene ? '<span style="color:#4ade80">con analisis</span>' : '<span style="color:#64748b">sin analisis</span>') +
                '</span></div>' +
            '<input type="file" accept=".json" style="color:#94a3b8;font-size:11px;max-width:220px" onchange="cmPfRawAsignar(\'' + d.id + '\', this)">' +
            (tiene ? '<button class="cmpfses2-vbtn" onclick="cmPfRawVer(\'' + d.id + '\')">Ver</button>' : '') +
        '</div>';
    });

    ov.innerHTML =
    '<style>' +
        '.cmpfraw-modal{background:#0f172a;border-radius:14px;width:100%;max-width:640px;max-height:90vh;overflow-y:auto;border:1px solid #14b8a6;padding:22px}' +
        '.cmpfraw-modal h3{color:#e2e8f0;font-size:17px;margin:0}' +
        '.cmpfraw-fila{display:flex;align-items:center;gap:10px;background:#1e293b;border-radius:8px;padding:10px 12px;margin-top:8px;flex-wrap:wrap;color:#e2e8f0;font-size:13px}' +
        '.cmpfraw-estado{margin-left:8px;font-size:11px}' +
    '</style>' +
    '<div class="cmpfraw-modal">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<h3>Analisis avanzado (JSON del dispositivo)</h3>' +
            '<button style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer" onclick="cmPfRawCerrarGestor()">x</button>' +
        '</div>' +
        '<p style="color:#94a3b8;font-size:12px;margin:6px 0 10px">Asigna a cada jugador su archivo JSON crudo (uno por dispositivo). Se procesa en tu navegador y solo se guarda el resultado; el archivo de 8 MB no se sube. Con analisis guardado, pulsa "Ver" para el mapa de calor, la curva de intensidad, el MDP y los sprints.</p>' +
        lista +
        '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">' +
            '<button class="cmpfses2-vbtn" onclick="cmPfRawCerrarGestor()">Cerrar</button>' +
            '<button class="cmpfses2-vbtn act" id="cmpfraw-procesar" onclick="cmPfRawProcesarTodos()">Procesar y guardar</button>' +
        '</div>' +
    '</div>';
    document.body.appendChild(ov);
}

function cmPfRawCerrarGestor() {
    var ov = document.getElementById('cmpfraw-gestor');
    if (ov) ov.remove();
}

function cmPfRawAsignar(rowId, input) {
    if (input.files && input.files[0]) {
        cmPfRaw.archivos[rowId] = input.files[0];
        var e = document.getElementById('cmpfraw-estado-' + rowId);
        if (e) e.innerHTML = '<span style="color:#fbbf24">pendiente de procesar</span>';
    }
}

async function cmPfRawProcesarTodos() {
    var ids = Object.keys(cmPfRaw.archivos);
    if (ids.length === 0) { if (typeof showToast === 'function') showToast('No has asignado ningun archivo'); return; }
    var btn = document.getElementById('cmpfraw-procesar');
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

    var ok = 0, fallos = 0;
    for (var i = 0; i < ids.length; i++) {
        var rowId = ids[i];
        var est = document.getElementById('cmpfraw-estado-' + rowId);
        try {
            if (est) est.innerHTML = '<span style="color:#fbbf24">procesando...</span>';
            var texto = await cmPfRawLeer(cmPfRaw.archivos[rowId]);
            var datos = JSON.parse(texto);
            var analisis = cmPfRawProcesar(datos);

            // Merge en extra_metrics de la fila (sin pisar lo del importador CSV)
            var fila = null;
            cmPfSes2.allData.forEach(function (d) { if (d.id === rowId) fila = d; });
            var extra = (fila && fila.extra_metrics) ? JSON.parse(JSON.stringify(fila.extra_metrics)) : {};
            extra.raw = analisis;

            var r = await supabaseClient.from('cm_pf_gps_player_data')
                .update({ extra_metrics: extra }).eq('id', rowId);
            if (r.error) throw r.error;

            if (fila) fila.extra_metrics = extra;  // refrescar en memoria
            if (est) est.innerHTML = '<span style="color:#4ade80">con analisis</span>';
            ok++;
        } catch (e) {
            if (est) est.innerHTML = '<span style="color:#f87171">error: ' + (e.message || e) + '</span>';
            fallos++;
        }
    }
    if (btn) { btn.disabled = false; btn.textContent = 'Procesar y guardar'; }
    if (typeof showToast === 'function') showToast(ok + ' analisis guardados' + (fallos ? ' (' + fallos + ' con error)' : ''));
    if (ok > 0) cmPfRawAbrirGestor(); // re-render con botones "Ver"
}

function cmPfRawLeer(file) {
    return new Promise(function (res, rej) {
        var r = new FileReader();
        r.onload = function (e) { res(e.target.result); };
        r.onerror = function () { rej(new Error('No se pudo leer el archivo')); };
        r.readAsText(file, 'UTF-8');
    });
}

// ---------- Procesado del JSON crudo (validado contra datos reales) ----------
function cmPfRawProcesar(data) {
    if (!Array.isArray(data) || data.length < 100) throw new Error('JSON sin datos GPS suficientes');

    // 1) Extraer puntos validos
    var pts = [];
    for (var i = 0; i < data.length; i++) {
        var g = data[i] && data[i].gnss;
        if (!g || g.latitude === '' || g.longitude === '' || g.latitude === undefined) continue;
        pts.push({
            la: parseFloat(g.latitude), lo: parseFloat(g.longitude),
            v: parseFloat(g.speed || 0), t: parseFloat(g.timestamp)
        });
    }
    if (pts.length < 100) throw new Error('JSON sin coordenadas validas');

    // 2) Coordenadas locales en metros
    var lat0 = 0, lon0 = 0;
    pts.forEach(function (p) { lat0 += p.la; lon0 += p.lo; });
    lat0 /= pts.length; lon0 /= pts.length;
    var mx = 111320 * Math.cos(lat0 * Math.PI / 180), my = 110540;
    pts.forEach(function (p) { p.x = (p.lo - lon0) * mx; p.y = (p.la - lat0) * my; });

    // 3) Orientar el campo con PCA
    var sxx = 0, syy = 0, sxy = 0;
    pts.forEach(function (p) { sxx += p.x * p.x; syy += p.y * p.y; sxy += p.x * p.y; });
    sxx /= pts.length; syy /= pts.length; sxy /= pts.length;
    var ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    var ca = Math.cos(-ang), sa = Math.sin(-ang);
    pts.forEach(function (p) {
        var rx = p.x * ca - p.y * sa, ry = p.x * sa + p.y * ca;
        p.x = rx; p.y = ry;
    });

    // 4) Limites por percentiles (2-98) para ignorar valores atipicos
    var xs = pts.map(function (p) { return p.x; }).sort(function (a, b) { return a - b; });
    var ys = pts.map(function (p) { return p.y; }).sort(function (a, b) { return a - b; });
    var pct = function (arr, q) { return arr[Math.floor(q * (arr.length - 1))]; };
    var x1 = pct(xs, 0.02), x2 = pct(xs, 0.98), y1 = pct(ys, 0.02), y2 = pct(ys, 0.98);
    if (x2 - x1 < 5 || y2 - y1 < 5) throw new Error('Area de movimiento demasiado pequena');

    // 5) Mapa de calor (decimas de segundo por celda)
    var grid = new Array(CMPFRAW_COLS * CMPFRAW_ROWS);
    for (var gi = 0; gi < grid.length; gi++) grid[gi] = 0;
    pts.forEach(function (p) {
        var cx = Math.floor((p.x - x1) / (x2 - x1) * CMPFRAW_COLS);
        var cy = Math.floor((p.y - y1) / (y2 - y1) * CMPFRAW_ROWS);
        if (cx >= 0 && cx < CMPFRAW_COLS && cy >= 0 && cy < CMPFRAW_ROWS) grid[cy * CMPFRAW_COLS + cx]++;
    });

    // 6) Curva de intensidad: metros por minuto de sesion
    var t0 = pts[0].t;
    var serie = [];
    pts.forEach(function (p) {
        var m = Math.floor((p.t - t0) / 60);
        if (m >= 0 && m < 200) serie[m] = (serie[m] || 0) + (p.v * CMPFRAW_KNOTS / 3.6) * 0.1;
    });
    for (var si = 0; si < serie.length; si++) serie[si] = Math.round(serie[si] || 0);

    // 7) MDP: peor pasaje de 1' / 3' / 5' (acumulado por segundos)
    var distSeg = [];
    pts.forEach(function (p) {
        var s = Math.floor(p.t - t0);
        if (s >= 0) distSeg[s] = (distSeg[s] || 0) + (p.v * CMPFRAW_KNOTS / 3.6) * 0.1;
    });
    var acum = [0];
    for (var ai = 0; ai < distSeg.length; ai++) acum.push(acum[acum.length - 1] + (distSeg[ai] || 0));
    var mdp = {};
    [60, 180, 300].forEach(function (W) {
        var best = 0, bi = 0;
        for (var wi = 0; wi + W < acum.length; wi++) {
            var dd = acum[wi + W] - acum[wi];
            if (dd > best) { best = dd; bi = wi; }
        }
        mdp['m' + (W / 60)] = { m: Math.round(best), mmin: Math.round(best / (W / 60)), min: Math.floor(bi / 60) };
    });

    // 8) Sprints (umbral de la config del club, salida con histeresis de 2 km/h)
    var TH = (typeof cmPfGpsConfig !== 'undefined' && cmPfGpsConfig && cmPfGpsConfig.sprint_threshold_kmh) || 24;
    var sprints = [];
    var en = false, ini = 0, dist = 0, vmax = 0, low = 0;
    pts.forEach(function (p) {
        var v = p.v * CMPFRAW_KNOTS;
        if (!en) {
            if (v >= TH) { en = true; ini = p.t; dist = 0; vmax = v; low = 0; }
        } else {
            dist += (v / 3.6) * 0.1;
            if (v > vmax) vmax = v;
            if (v < TH - 2) low++; else low = 0;
            if (low >= 5) {
                var dur = p.t - ini - 0.5;
                if (dur >= 1.0 && sprints.length < 100) {
                    sprints.push({
                        t: Math.round(ini - t0),
                        dur: Math.round(dur * 10) / 10,
                        dist: Math.round(dist),
                        vmax: Math.round(vmax * 10) / 10
                    });
                }
                en = false;
            }
        }
    });

    return {
        version: 1,
        muestras: pts.length,
        duracion_min: Math.round((pts[pts.length - 1].t - t0) / 60 * 10) / 10,
        campo: { largo: Math.round(x2 - x1), ancho: Math.round(y2 - y1) },
        heatmap: { cols: CMPFRAW_COLS, rows: CMPFRAW_ROWS, cells: grid },
        serie_mmin: serie,
        mdp: mdp,
        sprint_umbral_kmh: TH,
        sprints: sprints
    };
}

// ---------- Visor del analisis ----------
function cmPfRawVer(rowId) {
    var fila = null;
    cmPfSes2.allData.forEach(function (d) { if (d.id === rowId) fila = d; });
    if (!fila || !fila.extra_metrics || !fila.extra_metrics.raw) {
        if (typeof showToast === 'function') showToast('Sin analisis guardado');
        return;
    }
    var raw = fila.extra_metrics.raw;
    var p = cmPfSes2.playerMap[fila.player_id] || {};
    var nombre = p.name || 'Jugador';

    cmPfRawCerrarVisor();
    var ov = document.createElement('div');
    ov.id = 'cmpfraw-visor';
    ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.8);z-index:9700;display:flex;justify-content:center;align-items:flex-start;padding:25px;overflow-y:auto';
    ov.onclick = function (e) { if (e.target === ov) cmPfRawCerrarVisor(); };

    var mdpHtml = '';
    ['m1', 'm3', 'm5'].forEach(function (k, i) {
        var m = raw.mdp && raw.mdp[k];
        if (!m) return;
        mdpHtml += '<div class="cmpfraw-kpi"><div class="num">' + m.mmin + '</div><div class="lbl">MDP ' + (i === 0 ? "1'" : i === 1 ? "3'" : "5'") + ' (m/min)<br><span style="color:#64748b">min ' + m.min + ' &middot; ' + m.m + ' m</span></div></div>';
    });

    var sprintsHtml = '';
    if (raw.sprints && raw.sprints.length) {
        sprintsHtml = '<h4>Sprints (&ge;' + raw.sprint_umbral_kmh + ' km/h)</h4><table class="cmpfraw-tabla"><thead><tr><th>#</th><th>Minuto</th><th>Duracion</th><th>Metros</th><th>Vel. pico</th></tr></thead><tbody>';
        raw.sprints.forEach(function (s, i) {
            var mm = Math.floor(s.t / 60), ss = ('0' + (s.t % 60)).slice(-2);
            sprintsHtml += '<tr><td>' + (i + 1) + '</td><td>' + mm + ':' + ss + '</td><td>' + s.dur + ' s</td><td>' + s.dist + ' m</td><td>' + s.vmax + ' km/h</td></tr>';
        });
        sprintsHtml += '</tbody></table>';
    } else {
        sprintsHtml = '<h4>Sprints (&ge;' + (raw.sprint_umbral_kmh || 24) + ' km/h)</h4><p style="color:#64748b;font-size:12px">Ningun sprint detectado en esta sesion.</p>';
    }

    ov.innerHTML =
    '<style>' +
        '.cmpfraw-vmodal{background:#0f172a;border-radius:14px;width:100%;max-width:760px;max-height:92vh;overflow-y:auto;border:1px solid #14b8a6;padding:22px}' +
        '.cmpfraw-vmodal h3{color:#e2e8f0;font-size:17px;margin:0}' +
        '.cmpfraw-vmodal h4{color:#e2e8f0;font-size:13px;margin:18px 0 8px}' +
        '.cmpfraw-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:14px}' +
        '.cmpfraw-kpi{background:#1e293b;border-radius:10px;padding:12px;text-align:center}' +
        '.cmpfraw-kpi .num{font-size:22px;font-weight:800;color:#14b8a6}' +
        '.cmpfraw-kpi .lbl{font-size:10px;color:#94a3b8;margin-top:2px;line-height:1.5}' +
        '.cmpfraw-tabla{width:100%;border-collapse:collapse;font-size:12px}' +
        '.cmpfraw-tabla th{color:#94a3b8;text-align:right;padding:5px 8px;border-bottom:1px solid #334155;font-size:10px;text-transform:uppercase}' +
        '.cmpfraw-tabla td{color:#e2e8f0;text-align:right;padding:5px 8px;border-bottom:1px solid #1e293b}' +
        '.cmpfraw-canvas{width:100%;border-radius:10px;display:block}' +
    '</style>' +
    '<div class="cmpfraw-vmodal">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<h3>' + nombre + ' &middot; analisis avanzado</h3>' +
            '<button style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer" onclick="cmPfRawCerrarVisor()">x</button>' +
        '</div>' +
        '<div style="color:#94a3b8;font-size:11px;margin-top:2px">' + raw.duracion_min + ' min de registro &middot; area de juego ' + raw.campo.largo + ' x ' + raw.campo.ancho + ' m &middot; ' + raw.muestras.toLocaleString('es-ES') + ' muestras a 10 Hz</div>' +
        '<h4>Mapa de calor</h4>' +
        '<canvas id="cmpfraw-heat" class="cmpfraw-canvas" width="672" height="432"></canvas>' +
        '<h4>Curva de intensidad (m/min por minuto de sesion)</h4>' +
        '<div style="position:relative;height:200px"><canvas id="cmpfraw-serie"></canvas></div>' +
        '<div class="cmpfraw-kpis">' + mdpHtml + '</div>' +
        sprintsHtml +
        '<div style="color:#64748b;font-size:10px;margin-top:12px">MDP: pasaje mas exigente de la sesion en ventanas de 1, 3 y 5 minutos. Util para disenar tareas que repliquen la maxima exigencia real.</div>' +
    '</div>';
    document.body.appendChild(ov);

    cmPfRawPintarHeatmap(raw);
    cmPfRawPintarSerie(raw);
}

function cmPfRawCerrarVisor() {
    cmPfRaw.charts.forEach(function (c) { try { c.destroy(); } catch (e) {} });
    cmPfRaw.charts = [];
    var ov = document.getElementById('cmpfraw-visor');
    if (ov) ov.remove();
}

function cmPfRawPintarHeatmap(raw) {
    var cv = document.getElementById('cmpfraw-heat');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var W = cv.width, H = cv.height;
    var cols = raw.heatmap.cols, rows = raw.heatmap.rows, cells = raw.heatmap.cells;

    // Campo
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, 0, W, H);
    var mg = 14;
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(mg, mg, W - 2 * mg, H - 2 * mg);
    ctx.beginPath(); ctx.moveTo(W / 2, mg); ctx.lineTo(W / 2, H - mg); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 44, 0, Math.PI * 2); ctx.stroke();
    var ah = (H - 2 * mg) * 0.55, aw = (W - 2 * mg) * 0.16;
    ctx.strokeRect(mg, (H - ah) / 2, aw, ah);
    ctx.strokeRect(W - mg - aw, (H - ah) / 2, aw, ah);

    // Celdas (escala logaritmica para que las pausas largas no aplasten el resto)
    var maxc = 0;
    cells.forEach(function (c) { if (c > maxc) maxc = c; });
    if (maxc <= 0) return;
    var cw = (W - 2 * mg) / cols, ch = (H - 2 * mg) / rows;
    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
            var c = cells[y * cols + x];
            if (c <= 0) continue;
            var f = Math.log(1 + c) / Math.log(1 + maxc);   // 0..1
            var r, g, b;
            if (f < 0.33) { r = 0; g = Math.round(150 + f * 3 * 105); b = 255; }
            else if (f < 0.66) { var f2 = (f - 0.33) * 3; r = Math.round(f2 * 255); g = 255; b = Math.round(255 - f2 * 255); }
            else { var f3 = (f - 0.66) * 3; r = 255; g = Math.round(255 - f3 * 210); b = 0; }
            ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.15 + f * 0.6) + ')';
            ctx.fillRect(mg + x * cw, mg + y * ch, cw + 0.5, ch + 0.5);
        }
    }
}

function cmPfRawPintarSerie(raw) {
    var cv = document.getElementById('cmpfraw-serie');
    if (!cv || typeof Chart === 'undefined' || !raw.serie_mmin) return;
    var serie = raw.serie_mmin;
    var media = serie.length ? Math.round(serie.reduce(function (a, b) { return a + b; }, 0) / serie.length) : 0;
    cmPfRaw.charts.push(new Chart(cv, {
        type: 'line',
        data: {
            labels: serie.map(function (v, i) { return i; }),
            datasets: [
                { label: 'm/min', data: serie, borderColor: '#14b8a6', backgroundColor: 'rgba(20,184,166,.15)', fill: true, pointRadius: 0, tension: 0.3 },
                { label: 'media (' + media + ')', data: serie.map(function () { return media; }), borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, fill: false }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 12, font: { size: 10 } } } },
            scales: {
                x: { ticks: { color: '#94a3b8', maxTicksLimit: 14 }, grid: { color: '#1e293b' }, title: { display: true, text: 'minuto', color: '#64748b', font: { size: 10 } } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
            }
        }
    }));
}

console.log('[PrepFisica] cm-prepfisica-raw.js cargado (heatmap + intensidad + MDP + sprints)');
