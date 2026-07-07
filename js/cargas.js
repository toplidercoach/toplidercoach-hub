// ========== CARGAS.JS - TopLiderCoach HUB ==========
// Panel de control de carga de entrenamiento (metodo sRPE de Foster):
// carga diaria/semanal, ACWR (aguda:cronica), monotonia, strain y wellness.

let cgJugadores = {};
let cgCargas = {};
let cgWellness = {};
let cgRangoDias = 28;
let cgChart1 = null;
let cgChart2 = null;
let cgChartEquipo = null;

let cgContenedorId = 'cargas-contenido';

registrarSubTab('planificador', 'cargas', function() {
    cargarPanelCargas('cargas-contenido');
});

(function() {
    if (document.getElementById('cg-styles')) return;
    const st = document.createElement('style');
    st.id = 'cg-styles';
    st.textContent = `
        .cg-cab { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:6px; }
        .cg-cab h2 { font-size:20px; color:#1f2937; margin:0; }
        .cg-info { font-size:12px; color:#6b7280; margin-bottom:16px; max-width:900px; line-height:1.5; }
        .cg-tabla-wrap { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow-x:auto; margin-bottom:20px; }
        .cg-tabla { width:100%; border-collapse:collapse; font-size:13px; min-width:760px; }
        .cg-tabla th { background:#26215C; color:#fff; padding:9px 10px; font-size:11px; text-align:center; white-space:nowrap; }
        .cg-tabla th:first-child { text-align:left; }
        .cg-tabla td { padding:8px 10px; border-bottom:1px solid #f3f4f6; text-align:center; color:#374151; }
        .cg-tabla td:first-child { text-align:left; }
        .cg-tabla tr:hover td { background:#f9fafb; }
        .cg-jug { display:flex; align-items:center; gap:8px; }
        .cg-foto { width:30px; height:30px; border-radius:50%; object-fit:cover; background:#e5e7eb; }
        .cg-foto-ph { width:30px; height:30px; border-radius:50%; background:#26215C; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }
        .cg-chip { display:inline-block; padding:3px 10px; border-radius:6px; font-size:11px; font-weight:800; }
        .cg-btn-ver { background:#7c3aed; color:#fff; border:none; border-radius:7px; padding:6px 12px; font-size:12px; cursor:pointer; font-weight:600; }
        .cg-panel { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:16px; margin-bottom:20px; }
        .cg-panel h3 { margin:0 0 10px; font-size:14px; color:#1f2937; }
        .cg-vacio { text-align:center; color:#9ca3af; padding:30px; font-size:13px; background:#fff; border:1px solid #e5e7eb; border-radius:12px; }
        .cg-modal-ov { position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:1200; display:flex; align-items:center; justify-content:center; padding:16px; }
        .cg-modal { background:#fff; border-radius:14px; padding:20px; max-width:760px; width:100%; max-height:88vh; overflow-y:auto; }
        .cg-modal h3 { margin:0 0 4px; font-size:16px; color:#1f2937; }
        .cg-modal .sub { font-size:12px; color:#6b7280; margin-bottom:14px; }
        .cg-metricas { display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:8px; margin-bottom:16px; }
        .cg-met { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:10px; text-align:center; }
        .cg-met .num { font-size:19px; font-weight:800; color:#26215C; }
        .cg-met .lbl { font-size:10px; color:#6b7280; margin-top:2px; }
        .cg-cerrar { float:right; background:none; border:none; font-size:20px; color:#9ca3af; cursor:pointer; }
    `;
    document.head.appendChild(st);
})();

// ---------- Utilidades de fechas ----------
function cgISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function cgAddDias(iso, dias) {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + dias);
    return cgISO(d);
}

// ---------- Carga de datos ----------
async function cargarPanelCargas(contenedorId) {
    if (contenedorId) cgContenedorId = contenedorId;
    const cont = document.getElementById(cgContenedorId);
    if (!cont) return;
    cont.innerHTML = '<div class="cg-vacio">Calculando cargas de entrenamiento...</div>';
    try {
        const hoy = cgISO(new Date());
        const desde = cgAddDias(hoy, -(cgRangoDias + 28));

        const { data: sesiones } = await supabaseClient
            .from('training_sessions')
            .select('id, session_date, duration_minutes')
            .eq('club_id', clubId)
            .gte('session_date', desde)
            .lte('session_date', hoy);

        const sesMap = {};
        (sesiones || []).forEach(s => { sesMap[s.id] = s; });
        const ids = (sesiones || []).map(s => s.id);

        let asis = [];
        if (ids.length > 0) {
            const { data } = await supabaseClient
                .from('asistencia_sesiones')
                .select('sesion_id, jugador_id, asistio, rpe, duracion_real, sueno, fatiga, estres, estado_muscular')
                .in('sesion_id', ids);
            asis = data || [];
        }

        const jugIds = [...new Set(asis.map(a => a.jugador_id))];
        cgJugadores = {};
        if (jugIds.length > 0) {
            const { data: jugs } = await supabaseClient
                .from('players')
                .select('id, name, photo_url')
                .in('id', jugIds);
            (jugs || []).forEach(j => { cgJugadores[j.id] = j; });
        }

        cgCargas = {};
        cgWellness = {};
        asis.forEach(a => {
            const s = sesMap[a.sesion_id];
            if (!s) return;
            if (!cgCargas[a.jugador_id]) { cgCargas[a.jugador_id] = {}; cgWellness[a.jugador_id] = {}; }
            if (a.asistio && a.rpe !== null && a.rpe !== undefined) {
                const mins = a.duracion_real || s.duration_minutes || 0;
                cgCargas[a.jugador_id][s.session_date] = (cgCargas[a.jugador_id][s.session_date] || 0) + a.rpe * mins;
            }
            const vals = [a.sueno, a.fatiga, a.estres].filter(v => v !== null && v !== undefined);
            if (vals.length > 0 || (a.estado_muscular !== null && a.estado_muscular !== undefined)) {
                cgWellness[a.jugador_id][s.session_date] = {
                    bien: vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length * 10) / 10 : null,
                    dolor: (a.estado_muscular !== null && a.estado_muscular !== undefined) ? a.estado_muscular : null
                };
            }
        });

        cgRender();
    } catch (e) {
        console.error('Error cargando panel de cargas:', e);
        cont.innerHTML = '<div class="cg-vacio">Error al cargar: ' + e.message + '</div>';
    }
}

// ---------- Metricas ----------
function cgCargaDia(jid, fecha) {
    return (cgCargas[jid] || {})[fecha] || 0;
}
function cgValores(jid, hastaISO, dias) {
    const arr = [];
    for (let i = dias - 1; i >= 0; i--) arr.push(cgCargaDia(jid, cgAddDias(hastaISO, -i)));
    return arr;
}
function cgMetricas(jid, refISO) {
    const v7 = cgValores(jid, refISO, 7);
    const v28 = cgValores(jid, refISO, 28);
    const aguda = v7.reduce((a, b) => a + b, 0);
    const total28 = v28.reduce((a, b) => a + b, 0);
    const cronica = total28 / 4;
    const acwr = cronica > 0 ? aguda / cronica : null;
    const media7 = aguda / 7;
    const sd = Math.sqrt(v7.reduce((a, b) => a + Math.pow(b - media7, 2), 0) / 7);
    const monotonia = sd > 0 ? media7 / sd : null;
    const strain = monotonia !== null ? Math.round(aguda * monotonia) : null;
    return { aguda: Math.round(aguda), cronica: Math.round(cronica), acwr: acwr, monotonia: monotonia, strain: strain, tieneDatos: total28 > 0 };
}
function cgSemaforo(acwr) {
    if (acwr === null) return { label: 'Sin datos', bg: '#f3f4f6', fg: '#9ca3af' };
    if (acwr < 0.8) return { label: acwr.toFixed(2) + ' · Infracarga', bg: '#dbeafe', fg: '#1d4ed8' };
    if (acwr <= 1.3) return { label: acwr.toFixed(2) + ' · Óptimo', bg: '#dcfce7', fg: '#15803d' };
    if (acwr <= 1.5) return { label: acwr.toFixed(2) + ' · Atención', bg: '#fef3c7', fg: '#b45309' };
    return { label: acwr.toFixed(2) + ' · Riesgo', bg: '#fee2e2', fg: '#b91c1c' };
}
function cgWellness7(jid, refISO) {
    let suma = 0, n = 0;
    for (let i = 0; i < 7; i++) {
        const w = (cgWellness[jid] || {})[cgAddDias(refISO, -i)];
        if (w && w.bien !== null) { suma += w.bien; n++; }
    }
    return n > 0 ? Math.round(suma / n * 10) / 10 : null;
}

// ---------- Render principal ----------
function cgRender() {
    const cont = document.getElementById(cgContenedorId);
    const hoy = cgISO(new Date());
    const jugIds = Object.keys(cgJugadores);

    let html = `
        <div class="cg-cab"><h2>📊 Control de carga (sRPE)</h2></div>
        <div class="cg-info">Carga de cada sesión = RPE × minutos. <strong>Aguda</strong> = últimos 7 días · <strong>Crónica</strong> = media semanal de los últimos 28 días · <strong>ACWR</strong> = aguda ÷ crónica (zona óptima 0,80–1,30; por encima de 1,50 el riesgo de lesión aumenta) · <strong>Monotonía</strong> alta (&gt;2) = semanas planas · <strong>Strain</strong> = carga × monotonía. Los días sin sesión cuentan como 0.</div>
    `;

    if (jugIds.length === 0) {
        html += '<div class="cg-vacio">Todavía no hay registros de RPE.<br>Regístralos desde la asistencia de cada sesión o con los enlaces RPE de los jugadores.</div>';
        cont.innerHTML = html;
        return;
    }

    const filas = jugIds.map(jid => ({ jid: jid, m: cgMetricas(jid, hoy), w: cgWellness7(jid, hoy) }))
        .sort((a, b) => (b.m.acwr || -1) - (a.m.acwr || -1));

    html += '<div class="cg-tabla-wrap"><table class="cg-tabla"><thead><tr><th>Jugador</th><th>Carga 7d (UA)</th><th>Crónica (media sem.)</th><th>ACWR</th><th>Monotonía</th><th>Strain</th><th>Bienestar 7d</th><th></th></tr></thead><tbody>';
    filas.forEach(f => {
        const j = cgJugadores[f.jid];
        const sem = cgSemaforo(f.m.tieneDatos ? f.m.acwr : null);
        const foto = j.photo_url ? `<img src="${j.photo_url}" class="cg-foto">` : `<div class="cg-foto-ph">${(j.name || '?').charAt(0)}</div>`;
        html += `<tr>
            <td><div class="cg-jug">${foto}<strong>${j.name}</strong></div></td>
            <td><strong>${f.m.aguda}</strong></td>
            <td>${f.m.cronica}</td>
            <td><span class="cg-chip" style="background:${sem.bg};color:${sem.fg}">${sem.label}</span></td>
            <td>${f.m.monotonia !== null ? f.m.monotonia.toFixed(2) : '-'}</td>
            <td>${f.m.strain !== null ? f.m.strain : '-'}</td>
            <td>${f.w !== null ? f.w + '/10' : '-'}</td>
            <td><button class="cg-btn-ver" onclick="cgVerJugador('${f.jid}')">📈 Ver</button></td>
        </tr>`;
    });
    html += '</tbody></table></div>';

    html += '<div class="cg-panel"><h3>Carga media diaria del equipo (últimos 28 días)</h3><canvas id="cg-chart-equipo" height="80"></canvas></div>';

    cont.innerHTML = html;
    cgDibujarEquipo(hoy, jugIds);
}

function cgDibujarEquipo(hoy, jugIds) {
    const contPanel = document.getElementById(cgContenedorId);
    const ctx = contPanel ? contPanel.querySelector('#cg-chart-equipo') : document.getElementById('cg-chart-equipo');
    if (!ctx || typeof Chart === 'undefined') return;
    const labels = [], datos = [];
    for (let i = cgRangoDias - 1; i >= 0; i--) {
        const f = cgAddDias(hoy, -i);
        labels.push(f.slice(8, 10) + '/' + f.slice(5, 7));
        let suma = 0;
        jugIds.forEach(jid => { suma += cgCargaDia(jid, f); });
        datos.push(jugIds.length ? Math.round(suma / jugIds.length) : 0);
    }
    if (cgChartEquipo) cgChartEquipo.destroy();
    cgChartEquipo = new Chart(ctx, {
        type: 'bar',
        data: { labels: labels, datasets: [{ label: 'Carga media (UA)', data: datos, backgroundColor: '#534AB7' }] },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

// ---------- Detalle de jugador ----------
function cgVerJugador(jid) {
    const j = cgJugadores[jid];
    if (!j) return;
    const hoy = cgISO(new Date());
    const m = cgMetricas(jid, hoy);
    const sem = cgSemaforo(m.tieneDatos ? m.acwr : null);

    const prev = document.getElementById('cg-modal-ov');
    if (prev) prev.remove();
    const ov = document.createElement('div');
    ov.className = 'cg-modal-ov';
    ov.id = 'cg-modal-ov';
    ov.onclick = function(e) { if (e.target === ov) cgCerrarModal(); };
    ov.innerHTML = `
        <div class="cg-modal">
            <button class="cg-cerrar" onclick="cgCerrarModal()">&times;</button>
            <h3>📈 ${j.name}</h3>
            <div class="sub">Evolución de los últimos ${cgRangoDias} días</div>
            <div class="cg-metricas">
                <div class="cg-met"><div class="num">${m.aguda}</div><div class="lbl">Carga 7d (UA)</div></div>
                <div class="cg-met"><div class="num">${m.cronica}</div><div class="lbl">Crónica</div></div>
                <div class="cg-met"><div class="num" style="color:${sem.fg}">${m.tieneDatos && m.acwr !== null ? m.acwr.toFixed(2) : '-'}</div><div class="lbl">ACWR</div></div>
                <div class="cg-met"><div class="num">${m.monotonia !== null ? m.monotonia.toFixed(2) : '-'}</div><div class="lbl">Monotonía</div></div>
                <div class="cg-met"><div class="num">${m.strain !== null ? m.strain : '-'}</div><div class="lbl">Strain</div></div>
            </div>
            <div class="cg-panel" style="margin-bottom:12px"><h3>Carga diaria y ACWR</h3><canvas id="cg-chart-1" height="110"></canvas></div>
            <div class="cg-panel" style="margin-bottom:0"><h3>Wellness (bienestar y daño muscular)</h3><canvas id="cg-chart-2" height="90"></canvas></div>
        </div>
    `;
    document.body.appendChild(ov);

    const labels = [], cargas = [], acwrs = [], biens = [], dolores = [];
    for (let i = cgRangoDias - 1; i >= 0; i--) {
        const f = cgAddDias(hoy, -i);
        labels.push(f.slice(8, 10) + '/' + f.slice(5, 7));
        cargas.push(cgCargaDia(jid, f));
        const mi = cgMetricas(jid, f);
        acwrs.push(mi.acwr !== null && mi.tieneDatos ? Math.round(mi.acwr * 100) / 100 : null);
        const w = (cgWellness[jid] || {})[f];
        biens.push(w && w.bien !== null ? w.bien : null);
        dolores.push(w && w.dolor !== null ? w.dolor : null);
    }

    if (typeof Chart === 'undefined') return;
    if (cgChart1) cgChart1.destroy();
    cgChart1 = new Chart(document.getElementById('cg-chart-1'), {
        data: {
            labels: labels,
            datasets: [
                { type: 'bar', label: 'Carga (UA)', data: cargas, backgroundColor: '#534AB7', yAxisID: 'y' },
                { type: 'line', label: 'ACWR', data: acwrs, borderColor: '#dc2626', backgroundColor: '#dc2626', spanGaps: true, tension: 0.3, pointRadius: 2, yAxisID: 'y1' }
            ]
        },
        options: {
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'UA' } },
                y1: { position: 'right', min: 0, suggestedMax: 2, grid: { drawOnChartArea: false }, title: { display: true, text: 'ACWR' } }
            }
        }
    });
    if (cgChart2) cgChart2.destroy();
    cgChart2 = new Chart(document.getElementById('cg-chart-2'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Bienestar (1-10)', data: biens, borderColor: '#16a34a', backgroundColor: '#16a34a', spanGaps: true, tension: 0.3, pointRadius: 2 },
                { label: 'Daño muscular (0-10)', data: dolores, borderColor: '#f59e0b', backgroundColor: '#f59e0b', spanGaps: true, tension: 0.3, pointRadius: 2 }
            ]
        },
        options: { scales: { y: { min: 0, max: 10 } } }
    });
}

function cgCerrarModal() {
    if (cgChart1) { cgChart1.destroy(); cgChart1 = null; }
    if (cgChart2) { cgChart2.destroy(); cgChart2 = null; }
    const ov = document.getElementById('cg-modal-ov');
    if (ov) ov.remove();
}
