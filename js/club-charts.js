// ========== CLUB-CHARTS.JS — TopLiderCoach HUB ==========
// Gráficos para el perfil del jugador
// Depende de: Chart.js (CDN)

// ===== COLORES =====
const CHART_COLORS = {
    blue: 'rgba(56, 130, 246, 1)',
    blueBg: 'rgba(56, 130, 246, 0.15)',
    green: 'rgba(6, 214, 160, 1)',
    greenBg: 'rgba(6, 214, 160, 0.15)',
    amber: 'rgba(245, 158, 11, 1)',
    amberBg: 'rgba(245, 158, 11, 0.15)',
    red: 'rgba(239, 68, 68, 1)',
    redBg: 'rgba(239, 68, 68, 0.15)',
    purple: 'rgba(139, 92, 246, 1)',
    purpleBg: 'rgba(139, 92, 246, 0.15)',
    gray: 'rgba(148, 163, 184, 1)',
    grayBg: 'rgba(148, 163, 184, 0.1)',
    grid: 'rgba(56, 130, 246, 0.08)',
    text: '#7b8fad'
};

const SEASON_COLORS = [
    { border: CHART_COLORS.blue, bg: CHART_COLORS.blueBg },
    { border: CHART_COLORS.green, bg: CHART_COLORS.greenBg },
    { border: CHART_COLORS.amber, bg: CHART_COLORS.amberBg },
    { border: CHART_COLORS.red, bg: CHART_COLORS.redBg },
    { border: CHART_COLORS.purple, bg: CHART_COLORS.purpleBg },
];

// Chart.js defaults
Chart.defaults.color = CHART_COLORS.text;
Chart.defaults.borderColor = CHART_COLORS.grid;
Chart.defaults.font.family = "'Outfit', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.padding = 12;

// Store chart instances for cleanup
let _charts = {};

function destroyCharts() {
    Object.values(_charts).forEach(c => { if (c) c.destroy(); });
    _charts = {};
}

// ===== RADAR: VALORACIONES =====
// Muestra la última evaluación como radar, o varias superpuestas
function renderRadarEvaluaciones(canvasId, evaluaciones) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !evaluaciones || !evaluaciones.length) return;

    const labels = ['Tecnica', 'Tactica', 'Fisica', 'Mental', 'Actitud'];
    const datasets = evaluaciones.slice(0, 5).map((ev, i) => {
        const col = SEASON_COLORS[i % SEASON_COLORS.length];
        return {
            label: (ev.season_name || ev.date || 'Eval ' + (i + 1)) + (ev.evaluator_role ? ' (' + ev.evaluator_role + ')' : ''),
            data: [
                ev.rating_technical || 0,
                ev.rating_tactical || 0,
                ev.rating_physical || 0,
                ev.rating_mental || 0,
                ev.rating_attitude || 0
            ],
            borderColor: col.border,
            backgroundColor: col.bg,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: col.border,
            pointBorderColor: '#0b1120',
            pointBorderWidth: 2
        };
    });

    if (_charts[canvasId]) _charts[canvasId].destroy();
    _charts[canvasId] = new Chart(canvas, {
        type: 'radar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', display: datasets.length > 1 }
            },
            scales: {
                r: {
                    min: 0, max: 10,
                    ticks: { stepSize: 2, backdropColor: 'transparent', font: { size: 10 } },
                    grid: { color: CHART_COLORS.grid },
                    angleLines: { color: CHART_COLORS.grid },
                    pointLabels: { font: { size: 11, weight: '600' }, color: CHART_COLORS.text }
                }
            }
        }
    });
}

// ===== BARRAS: ESTADÍSTICAS POR TEMPORADA =====
// Compara estadísticas de las temporadas seleccionadas
function renderBarrasTemporadas(canvasId, temporadas, campos) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !temporadas || !temporadas.length) return;

    campos = campos || [
        { key: 'matches_played', label: 'Partidos', color: CHART_COLORS.blue },
        { key: 'goals', label: 'Goles', color: CHART_COLORS.green },
        { key: 'assists', label: 'Asist.', color: CHART_COLORS.amber },
        { key: 'yellow_cards', label: 'TA', color: CHART_COLORS.purple },
        { key: 'red_cards', label: 'TR', color: CHART_COLORS.red }
    ];

    const labels = temporadas.map(t => t.season_name || '?');
    const datasets = campos.map(c => ({
        label: c.label,
        data: temporadas.map(t => t[c.key] || 0),
        backgroundColor: c.color.replace('1)', '0.7)'),
        borderColor: c.color,
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 28
    }));

    if (_charts[canvasId]) _charts[canvasId].destroy();
    _charts[canvasId] = new Chart(canvas, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: CHART_COLORS.grid } }
            }
        }
    });
}

// ===== LÍNEAS: EVOLUCIÓN FÍSICA =====
// Muestra la curva de crecimiento (altura, peso) a lo largo de temporadas
function renderEvolucionFisica(canvasId, temporadas) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !temporadas || !temporadas.length) return;

    // Solo temporadas con datos físicos
    const conDatos = temporadas.filter(t => t.height_cm || t.weight_kg).reverse(); // más antigua primero
    if (!conDatos.length) return;

    const labels = conDatos.map(t => t.season_name || '?');

    const datasets = [];
    if (conDatos.some(t => t.height_cm)) {
        datasets.push({
            label: 'Altura (cm)',
            data: conDatos.map(t => t.height_cm || null),
            borderColor: CHART_COLORS.blue,
            backgroundColor: CHART_COLORS.blueBg,
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: CHART_COLORS.blue,
            pointBorderColor: '#0b1120',
            pointBorderWidth: 2,
            yAxisID: 'y'
        });
    }
    if (conDatos.some(t => t.weight_kg)) {
        datasets.push({
            label: 'Peso (kg)',
            data: conDatos.map(t => t.weight_kg ? parseFloat(t.weight_kg) : null),
            borderColor: CHART_COLORS.green,
            backgroundColor: CHART_COLORS.greenBg,
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: CHART_COLORS.green,
            pointBorderColor: '#0b1120',
            pointBorderWidth: 2,
            yAxisID: 'y1'
        });
    }

    if (_charts[canvasId]) _charts[canvasId].destroy();
    _charts[canvasId] = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom' } },
            scales: {
                x: { grid: { display: false } },
                y: {
                    type: 'linear', position: 'left',
                    title: { display: true, text: 'Altura (cm)', color: CHART_COLORS.blue, font: { size: 10 } },
                    grid: { color: CHART_COLORS.grid }
                },
                y1: {
                    type: 'linear', position: 'right',
                    title: { display: true, text: 'Peso (kg)', color: CHART_COLORS.green, font: { size: 10 } },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

// ===== DONUT: RESUMEN MINUTOS =====
// Titular vs suplente vs no convocado (para la temporada actual)
function renderDonutMinutos(canvasId, season) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !season) return;

    const titular = season.matches_started || 0;
    const suplente = (season.matches_played || 0) - titular;
    const noConv = Math.max(0, (season.total_matches || 0) - (season.matches_played || 0));

    if (titular + suplente + noConv === 0) return;

    if (_charts[canvasId]) _charts[canvasId].destroy();
    _charts[canvasId] = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Titular', 'Suplente', 'No conv.'],
            datasets: [{
                data: [titular, suplente, noConv],
                backgroundColor: [CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.grayBg],
                borderColor: ['#0b1120', '#0b1120', '#0b1120'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 10 } } }
            }
        }
    });
}

// ===== BARRAS HORIZONTALES: COMPARATIVA ENTRE JUGADORES =====
function renderComparativaJugadores(canvasId, jugadores, campo, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !jugadores || !jugadores.length) return;

    const labels = jugadores.map(j => j.name);
    const data = jugadores.map(j => j[campo] || 0);

    if (_charts[canvasId]) _charts[canvasId].destroy();
    _charts[canvasId] = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: label || campo,
                data,
                backgroundColor: jugadores.map((_, i) => SEASON_COLORS[i % SEASON_COLORS.length].border.replace('1)', '0.7)')),
                borderColor: jugadores.map((_, i) => SEASON_COLORS[i % SEASON_COLORS.length].border),
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 36
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: CHART_COLORS.grid } },
                y: { grid: { display: false } }
            }
        }
    });
}

// ===== HTML HELPERS =====
// Genera el HTML del panel de gráficos del perfil
function renderChartPanel(seasons, evaluaciones) {
    const ss = seasons || [];
    const ev = evaluaciones || [];
    const hasSeasons = ss.length > 0;
    const hasEvals = ev.length > 0;

    if (!hasSeasons && !hasEvals) {
        return '<div class="empty"><p>Sin datos suficientes para graficos</p></div>';
    }

    // Multiselect de temporadas
    let seasonFilter = '';
    if (ss.length > 1) {
        seasonFilter = '<div style="margin-bottom:16px"><label style="font-size:11px;color:var(--tm);font-weight:600;text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:6px">Temporadas a comparar</label><div style="display:flex;flex-wrap:wrap;gap:6px">' +
            ss.map((s, i) => '<label style="display:flex;align-items:center;gap:5px;background:var(--bg-deep);padding:5px 10px;border-radius:8px;cursor:pointer;font-size:12px;border:1px solid var(--border);font-weight:500;transition:all .2s"><input type="checkbox" class="season-filter-chk" value="' + i + '" checked onchange="actualizarGraficos()" style="accent-color:var(--accent)">' + (s.season_name || '?') + '</label>').join('') +
            '</div></div>';
    }

    let html = seasonFilter;

    // Grid de gráficos
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">';

    // Radar de evaluaciones
    if (hasEvals) {
        html += '<div style="background:var(--bg-el);border:1px solid var(--border);border-radius:12px;padding:16px"><div style="font-size:12px;font-weight:700;color:var(--tp);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px">Valoracion</div><div style="height:240px"><canvas id="chart-radar"></canvas></div></div>';
    }

    // Estadísticas por temporada
    if (hasSeasons) {
        html += '<div style="background:var(--bg-el);border:1px solid var(--border);border-radius:12px;padding:16px"><div style="font-size:12px;font-weight:700;color:var(--tp);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px">Estadisticas por temporada</div><div style="height:240px"><canvas id="chart-stats"></canvas></div></div>';
    }

    html += '</div>';

    // Segunda fila
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';

    // Evolución física
    if (hasSeasons && ss.some(s => s.height_cm || s.weight_kg)) {
        html += '<div style="background:var(--bg-el);border:1px solid var(--border);border-radius:12px;padding:16px"><div style="font-size:12px;font-weight:700;color:var(--tp);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px">Evolucion fisica</div><div style="height:200px"><canvas id="chart-growth"></canvas></div></div>';
    }

    // Tabla resumen de la temporada actual
    if (hasSeasons) {
        const curr = ss[0];
        html += '<div style="background:var(--bg-el);border:1px solid var(--border);border-radius:12px;padding:16px"><div style="font-size:12px;font-weight:700;color:var(--tp);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px">Temporada actual: ' + (curr.season_name || '') + '</div>' +
            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' +
            _statBox('Partidos', curr.matches_played || 0, 'var(--accent)') +
            _statBox('Goles', curr.goals || 0, 'var(--a2)') +
            _statBox('Asist.', curr.assists || 0, 'var(--warn)') +
            _statBox('Minutos', curr.minutes_played || 0, 'var(--accent)') +
            _statBox('T.Amarillas', curr.yellow_cards || 0, '#fbbf24') +
            _statBox('T.Rojas', curr.red_cards || 0, 'var(--danger)') +
            '</div>' +
            (curr.rating ? '<div style="margin-top:12px;text-align:center"><span style="font-size:28px;font-weight:800;color:var(--a2)">' + curr.rating + '</span><span style="font-size:12px;color:var(--tm);margin-left:4px">/10</span></div>' : '') +
            '</div>';
    }

    html += '</div>';

    return html;
}

function _statBox(label, value, color) {
    return '<div style="text-align:center;padding:8px;background:var(--bg-deep);border-radius:8px"><div style="font-size:20px;font-weight:800;color:' + color + '">' + value + '</div><div style="font-size:10px;color:var(--tm);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:2px">' + label + '</div></div>';
}

// ===== INICIALIZAR GRÁFICOS DESPUÉS DE RENDER =====
function initProfileCharts(seasons, evaluaciones) {
    // Pequeño delay para asegurar que el DOM está listo
    setTimeout(function () {
        const ss = getFilteredSeasons(seasons);
        if (document.getElementById('chart-radar') && evaluaciones && evaluaciones.length) {
            renderRadarEvaluaciones('chart-radar', evaluaciones);
        }
        if (document.getElementById('chart-stats') && ss.length) {
            renderBarrasTemporadas('chart-stats', ss);
        }
        if (document.getElementById('chart-growth') && ss.length) {
            renderEvolucionFisica('chart-growth', ss);
        }
    }, 100);
}

// ===== FILTRO DE TEMPORADAS =====
function getFilteredSeasons(allSeasons) {
    const checks = document.querySelectorAll('.season-filter-chk');
    if (!checks.length) return allSeasons || [];
    const selected = [];
    checks.forEach(function (chk) {
        if (chk.checked) selected.push(parseInt(chk.value));
    });
    return (allSeasons || []).filter(function (_, i) { return selected.includes(i); });
}

// Se llama cuando cambia el multiselect
// Las variables _allSeasons y _allEvals se establecen en renderPerfil
var _allSeasons = [];
var _allEvals = [];

function actualizarGraficos() {
    const ss = getFilteredSeasons(_allSeasons);
    destroyCharts();
    if (document.getElementById('chart-radar') && _allEvals.length) {
        renderRadarEvaluaciones('chart-radar', _allEvals);
    }
    if (document.getElementById('chart-stats') && ss.length) {
        renderBarrasTemporadas('chart-stats', ss);
    }
    if (document.getElementById('chart-growth') && ss.length) {
        renderEvolucionFisica('chart-growth', ss);
    }
}

console.log('Club Charts cargado');
