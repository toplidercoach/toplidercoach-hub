// ========== MATCHSTATS.JS - TopLiderCoach HUB ==========
// Partidos, convocatorias, alineaciones, resultados, estadísticas, ficha jugador

// Variables del módulo
let fichaJugadorActual = null;
let escudoRivalUrl = null;
let slotVacioIdx = null;
let slotsTitularesMap = [];
let gpsPartido = {};
let gpsPartidoColapsado = false;

// Registro en navegación
registrarModulo('matchstats', cargarPartidos);
registrarSubTab('matchstats', 'estadisticas', function() {
    cargarSelectorTemporadasStats();
    cargarEstadisticas();
});
// Calendario unificado movido a planificador.js
registrarSubTab('matchstats', 'partidos', cargarPartidos);

async function cargarCalendarioPartidos() {
    const mesActualEl = document.getElementById('mes-actual-partidos');
    const grid = document.getElementById('calendario-partidos');
    const resumenEl = document.getElementById('calendario-resumen-partidos');
    
    if (!mesActualEl || !grid) return;
    
    mesActualEl.textContent = MESES[calendarioMesPartidos] + ' ' + calendarioAnioPartidos;
    
    const ultimoDia = new Date(calendarioAnioPartidos, calendarioMesPartidos + 1, 0);
    const inicioMes = calendarioAnioPartidos + '-' + String(calendarioMesPartidos + 1).padStart(2, '0') + '-01';
    const finMes = calendarioAnioPartidos + '-' + String(calendarioMesPartidos + 1).padStart(2, '0') + '-' + ultimoDia.getDate();
    
    const { data: partidos } = await supabaseClient
        .from('matches')
        .select('*')
        .eq('club_id', clubId)
        .eq('season_id', seasonId)
        .gte('match_date', inicioMes)
        .lte('match_date', finMes)
        .order('match_date');
    
    const partidosPorDia = {};
    (partidos || []).forEach(function(p) {
        const dia = new Date(p.match_date + 'T12:00:00').getDate();
        if (!partidosPorDia[dia]) partidosPorDia[dia] = [];
        partidosPorDia[dia].push(p);
    });
    
    const victorias = partidos ? partidos.filter(function(p) { return p.result === 'win'; }).length : 0;
    const empates = partidos ? partidos.filter(function(p) { return p.result === 'draw'; }).length : 0;
    const derrotas = partidos ? partidos.filter(function(p) { return p.result === 'loss'; }).length : 0;
    const pendientes = partidos ? partidos.filter(function(p) { return !p.result; }).length : 0;
    const golesFavor = partidos ? partidos.reduce(function(sum, p) { return sum + (p.team_goals || 0); }, 0) : 0;
    const golesContra = partidos ? partidos.reduce(function(sum, p) { return sum + (p.opponent_goals || 0); }, 0) : 0;
    
    var html = '';
    var diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    for (var i = 0; i < diasSemana.length; i++) {
        html += '<div class="calendario-dia-header">' + diasSemana[i] + '</div>';
    }
    
    var primerDia = new Date(calendarioAnioPartidos, calendarioMesPartidos, 1);
    var diaInicio = primerDia.getDay();
    diaInicio = diaInicio === 0 ? 7 : diaInicio;
    
    for (var i = 1; i < diaInicio; i++) {
        html += '<div class="calendario-dia otro-mes"></div>';
    }
    
    var hoy = new Date();
    for (var dia = 1; dia <= ultimoDia.getDate(); dia++) {
        var esHoy = dia === hoy.getDate() && calendarioMesPartidos === hoy.getMonth() && calendarioAnioPartidos === hoy.getFullYear();
        var tienePartido = partidosPorDia[dia] && partidosPorDia[dia].length > 0;
        
        var eventosHTML = '';
        if (tienePartido) {
            for (var j = 0; j < partidosPorDia[dia].length; j++) {
                var p = partidosPorDia[dia][j];
                var resultClass = p.result ? (p.result === 'win' ? 'victoria' : (p.result === 'draw' ? 'empate' : 'derrota')) : 'pendiente';
                var esLocal = p.home_away === 'home';
                var resultadoTexto = '';
                if (p.result) {
                    var gF = p.team_goals || 0;
                    var gC = p.opponent_goals || 0;
                    resultadoTexto = esLocal ? (gF + '-' + gC) : (gC + '-' + gF);
                } else {
                    resultadoTexto = p.kick_off_time ? p.kick_off_time.slice(0, 5) : 'Por jugar';
                }
                eventosHTML += '<div class="calendario-evento partido ' + resultClass + '" onclick="verPartido(\'' + p.id + '\')" title="' + p.opponent + '">' +
                    '<span class="rival">' + (esLocal ? 'vs' : '@') + ' ' + p.opponent + '</span>' +
                    '<span class="resultado">' + resultadoTexto + '</span>' +
                '</div>';
            }
        }
        
        html += '<div class="calendario-dia ' + (esHoy ? 'hoy' : '') + ' ' + (tienePartido ? 'tiene-partido' : '') + '">' +
            '<div class="numero">' + dia + '</div>' +
            eventosHTML +
        '</div>';
    }
    
    grid.innerHTML = html;
    
    if (resumenEl) {
        resumenEl.innerHTML = 
            '<div class="resumen-stat victorias"><div class="numero">' + victorias + '</div><div class="label">Victorias</div></div>' +
            '<div class="resumen-stat empates"><div class="numero">' + empates + '</div><div class="label">Empates</div></div>' +
            '<div class="resumen-stat derrotas"><div class="numero">' + derrotas + '</div><div class="label">Derrotas</div></div>' +
            '<div class="resumen-stat pendientes"><div class="numero">' + pendientes + '</div><div class="label">Pendientes</div></div>' +
            '<div class="resumen-stat goles-favor"><div class="numero">' + golesFavor + '</div><div class="label">GF</div></div>' +
            '<div class="resumen-stat goles-contra"><div class="numero">' + golesContra + '</div><div class="label">GC</div></div>';
    }
}

function mesAnteriorPartidos() {
    calendarioMesPartidos--;
    if (calendarioMesPartidos < 0) {
        calendarioMesPartidos = 11;
        calendarioAnioPartidos--;
    }
    cargarCalendarioPartidos();
}

function mesSiguientePartidos() {
    calendarioMesPartidos++;
    if (calendarioMesPartidos > 11) {
        calendarioMesPartidos = 0;
        calendarioAnioPartidos++;
    }
    cargarCalendarioPartidos();
}

function limpiarFiltroPartidos() {
    document.getElementById('filtro-partido-desde').value = '';
    document.getElementById('filtro-partido-hasta').value = '';
    cargarPartidos();
}

        function filtrarPartidos(filtro, btn) {
            document.querySelectorAll('.filtros-bar .filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroPartidos = filtro;
            cargarPartidos();
        }
        
        async function cargarPartidos() {
            const lista = document.getElementById('lista-partidos');
            impCalInyectarBoton();
            lista.innerHTML = '<div class="loading">Cargando partidos...</div>';
            
            try {
                let query = supabaseClient
                    .from('matches')
                    .select('*')
                    .eq('club_id', clubId)
                    .eq('season_id', seasonId)
                    .order('match_date', { ascending: false });
                
                const ahora = new Date();
const hoy = ahora.getFullYear() + '-' + String(ahora.getMonth() + 1).padStart(2, '0') + '-' + String(ahora.getDate()).padStart(2, '0');
                // Filtros de fecha del calendario
const desde = document.getElementById('filtro-partido-desde')?.value;
const hasta = document.getElementById('filtro-partido-hasta')?.value;

if (desde) {
    query = query.gte('match_date', desde);
}
if (hasta) {
    query = query.lte('match_date', hasta);
}
                if (filtroPartidos === 'proximos') {
                    query = query.gte('match_date', hoy).is('result', null);
                } else if (filtroPartidos === 'jugados') {
                    query = query.not('result', 'is', null);
                }
                
                const { data, error } = await query;
                
                if (error) throw error;
                
                if (!data || data.length === 0) {
                    lista.innerHTML = '<div class="empty-state"><h3>No hay partidos</h3><p>Crea tu primer partido</p></div>';
                    return;
                }
                
                lista.innerHTML = data.map(p => {
                    const fechaObj = new Date(p.match_date + 'T12:00:00');
                    const diaSemana = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][fechaObj.getDay()];
                    const diaNum = fechaObj.getDate();
                    const mesCorto = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'][fechaObj.getMonth()];
                    const anio = fechaObj.getFullYear();
                    const hora = p.kick_off_time ? p.kick_off_time.slice(0, 5) : '';
                    const esLocal = p.home_away === 'home';
                    
                    const miNombre = clubData?.name || 'Mi Equipo';
                    const miEscudo = clubData?.logo_url ? `<img src="${clubData.logo_url}" class="mc-escudo">` : '<div class="mc-escudo-placeholder">🏠</div>';
                    const rivalEscudo = p.opponent_logo ? `<img src="${p.opponent_logo}" class="mc-escudo">` : '<div class="mc-escudo-placeholder">🏟️</div>';
                    
                    const equipoLocal = esLocal ? miNombre : p.opponent;
                    const equipoVisitante = esLocal ? p.opponent : miNombre;
                    const escudoLocal = esLocal ? miEscudo : rivalEscudo;
                    const escudoVisitante = esLocal ? rivalEscudo : miEscudo;
                    
                    let resultClass = 'pendiente';
                    let marcadorHTML = '';
                    let badgeText = '';
                    
                    if (p.result) {
                        const gF = p.team_goals || 0;
                        const gC = p.opponent_goals || 0;
                        const gLocal = esLocal ? gF : gC;
                        const gVisitante = esLocal ? gC : gF;
                        resultClass = p.result === 'win' ? 'victoria' : p.result === 'draw' ? 'empate' : 'derrota';
                        badgeText = p.result === 'win' ? 'VICTORIA' : p.result === 'draw' ? 'EMPATE' : 'DERROTA';
                        marcadorHTML = `<div class="mc-score"><span class="mc-score-num">${gLocal}</span><span class="mc-score-sep">-</span><span class="mc-score-num">${gVisitante}</span></div>`;
                    } else {
                        badgeText = hora || 'POR JUGAR';
                        marcadorHTML = `<div class="mc-score mc-score-pending"><span class="mc-score-time">${hora || 'TBD'}</span></div>`;
                    }
                    
                    const competicion = p.competition || '';
                    const jornada = p.round || '';
                    const estadio = p.stadium || '';
                    
                    let metaHTML = '';
                    if (jornada) metaHTML += `<span class="mc-meta-item">📋 ${jornada}</span>`;
                    if (estadio) metaHTML += `<span class="mc-meta-item">🏟 ${estadio}</span>`;
                    
                    return `
                        <div class="mc-card ${resultClass}">
                            <div class="mc-result-strip"></div>
                            <div class="mc-content">
                                <div class="mc-header">
                                    <div class="mc-date-info">
                                        <span class="mc-date">${diaSemana} ${diaNum} ${mesCorto} ${anio}</span>
                                        ${hora && p.result ? `<span class="mc-time">${hora}h</span>` : ''}
                                    </div>
                                    <div class="mc-badges">
                                        ${competicion ? `<span class="mc-comp-badge">${competicion}</span>` : ''}
                                        <span class="mc-result-badge mc-badge-${resultClass}">${badgeText}</span>
                                    </div>
                                </div>
                                <div class="mc-matchup">
                                    <div class="mc-team">
                                        ${escudoLocal}
                                        <span class="mc-team-name">${equipoLocal}</span>
                                        <span class="mc-team-side">Local</span>
                                    </div>
                                    ${marcadorHTML}
                                    <div class="mc-team">
                                        ${escudoVisitante}
                                        <span class="mc-team-name">${equipoVisitante}</span>
                                        <span class="mc-team-side">Visitante</span>
                                    </div>
                                </div>
                                ${metaHTML ? `<div class="mc-meta">${metaHTML}</div>` : ''}
                                <div class="mc-actions">
                                    <button class="mc-btn mc-btn-ver" onclick="verPartido('${p.id}')">👁️ Ver</button>
                                    <button class="mc-btn mc-btn-editar" onclick="editarPartido('${p.id}')">✏️ Editar</button>
                                    <button class="mc-btn mc-btn-stats" onclick="abrirModalResultado('${p.id}')">📊 Stats</button>
                                    <button class="mc-btn mc-btn-eliminar" onclick="eliminarPartido('${p.id}')">🗑️</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                
            } catch (error) {
                lista.innerHTML = '<p style="color:red;">Error al cargar partidos</p>';
            }
        }
        
     async function abrirModalPartido(partidoId = null) {
            document.getElementById('modal-partido-titulo').textContent = partidoId ? 'Editar Partido' : 'Nuevo Partido';
            
            // Limpiar todo
            document.getElementById('partido-id').value = '';
            document.getElementById('partido-rival').value = '';
            document.getElementById('partido-competicion').value = '';
            const hoyFecha = new Date();
document.getElementById('partido-fecha').value = hoyFecha.getFullYear() + '-' + String(hoyFecha.getMonth() + 1).padStart(2, '0') + '-' + String(hoyFecha.getDate()).padStart(2, '0');
            document.getElementById('partido-hora').value = '';
            document.getElementById('partido-localidad').value = 'home';
            document.getElementById('partido-estadio').value = '';
            document.getElementById('partido-jornada').value = '';
            document.getElementById('partido-formato').value = '11';
            document.getElementById('partido-formacion').value = '4-3-3';
            document.getElementById('partido-lugar-encuentro').value = '';
            document.getElementById('partido-hora-salida').value = '';
            document.getElementById('partido-fecha-salida').value = '';
            document.getElementById('partido-notas-convocatoria').value = '';
            document.getElementById('partido-video-url').value = '';
document.getElementById('video-preview-container').style.display = 'none';
            
            convocadosPartido = [];
            titularesPartido = [];
            slotsTitularesMap = [];
            slotVacioIdx = null;
            gpsPartido = {};
            
            await cargarConvocatoria();
            
            if (partidoId) {
                const { data: p } = await supabaseClient.from('matches').select('*').eq('id', partidoId).single();
                if (p) {
                    document.getElementById('partido-id').value = p.id;
                    document.getElementById('partido-rival').value = p.opponent || '';
                    document.getElementById('partido-competicion').value = p.competition || '';
                    document.getElementById('partido-fecha').value = p.match_date || '';
                    document.getElementById('partido-hora').value = p.kick_off_time || '';
                    document.getElementById('partido-localidad').value = p.home_away || 'home';
                    document.getElementById('partido-estadio').value = p.stadium || '';
                    document.getElementById('partido-jornada').value = p.round || '';
                    document.getElementById('partido-formato').value = p.formato_juego || '11';
                    document.getElementById('partido-formacion').value = p.formacion || '4-3-3';
                    document.getElementById('partido-lugar-encuentro').value = p.lugar_encuentro || '';
                    document.getElementById('partido-hora-salida').value = p.hora_salida || '';
                    document.getElementById('partido-fecha-salida').value = p.fecha_salida || '';
                    document.getElementById('partido-notas-convocatoria').value = p.notas_convocatoria || '';
                    // Cargar video
if (p.video_url) {
    document.getElementById('partido-video-url').value = p.video_url;
    actualizarPreviewVideo();
}
                    
                    // Cargar escudo rival
                    if (p.opponent_logo) {
                        cargarEscudoRival(p.opponent_logo);
                    }

                    // Cargar convocados
if (p.convocados && Array.isArray(p.convocados)) {
    convocadosPartido = p.convocados.map(c => String(c.id));
}

// Cargar titulares
if (p.titulares && Array.isArray(p.titulares)) {
    titularesPartido = p.titulares.map(t => String(t.id));
}

// Cargar asignacion de GPS
gpsPartido = (p.gps && typeof p.gps === 'object' && !Array.isArray(p.gps)) ? p.gps : {};
                    
                    // Restaurar mapa de slots guardado o forzar reconstrucción
                    if (p.alineacion_slots && Array.isArray(p.alineacion_slots) && p.alineacion_slots.length > 0) {
                        slotsTitularesMap = p.alineacion_slots.map(s => s ? String(s) : null);
                    } else {
                        slotsTitularesMap = [];
                    }
                    slotVacioIdx = null;
                    renderizarConvocatoria();
                }
            }
            
            document.getElementById('modal-partido').style.display = 'flex';
        }
        async function verPartido(partidoId) {
    const { data: p } = await supabaseClient.from('matches').select('*').eq('id', partidoId).single();
    if (!p) {
        showToast('Partido no encontrado');
        return;
    }
    
    const { data: club } = await supabaseClient.from('clubs').select('name, logo_url').eq('id', clubId).single();
    
    const fecha = new Date(p.match_date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const hora = p.kick_off_time ? p.kick_off_time.slice(0, 5) : '';
    const esLocal = p.home_away === 'home';
    
    // Resultado
    let resultadoHTML = '';
    if (p.result) {
        const gF = p.team_goals || 0;
        const gC = p.opponent_goals || 0;
        const marcador = esLocal ? `${gF} - ${gC}` : `${gC} - ${gF}`;
        const resultText = p.result === 'win' ? 'Victoria' : p.result === 'draw' ? 'Empate' : 'Derrota';
        resultadoHTML = `
            <div style="text-align:center;margin:20px 0;">
                <div style="font-size:48px;font-weight:700;">${marcador}</div>
                <div style="color:#059669;font-weight:600;">${resultText}</div>
            </div>
        `;
    } else {
        resultadoHTML = `<div style="text-align:center;margin:20px 0;color:#9ca3af;">Partido pendiente</div>`;
    }
    
    // Convocados
    const convocados = p.convocados || [];
    const titulares = p.titulares || [];
    const suplentes = p.suplentes || [];
    
    let convocadosHTML = '<p style="color:#9ca3af;">No hay convocados</p>';
    if (convocados.length > 0) {
        convocadosHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
                ${convocados.sort((a,b) => (a.shirt_number || 99) - (b.shirt_number || 99)).map(j => `
                    <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#f0fdf4;border-radius:8px;">
                        <span style="background:#059669;color:white;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${j.shirt_number || '-'}</span>
                        <span style="font-size:12px;">${j.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    let titularesHTML = '<p style="color:#9ca3af;">No hay titulares</p>';
    if (titulares.length > 0) {
        titularesHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
                ${titulares.sort((a,b) => (a.shirt_number || 99) - (b.shirt_number || 99)).map(j => `
                    <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#dbeafe;border-radius:8px;">
                        <span style="background:#3b82f6;color:white;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${j.shirt_number || '-'}</span>
                        <span style="font-size:12px;">${j.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    let suplentesHTML = '';
    if (suplentes.length > 0) {
        suplentesHTML = `
            <div style="margin-top:15px;">
                <h4 style="font-size:13px;color:#6b7280;margin-bottom:10px;">Suplentes (${suplentes.length})</h4>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
                    ${suplentes.sort((a,b) => (a.shirt_number || 99) - (b.shirt_number || 99)).map(j => `
                        <div style="display:flex;align-items:center;gap:8px;padding:8px;background:#f3f4f6;border-radius:8px;">
                            <span style="background:#6b7280;color:white;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${j.shirt_number || '-'}</span>
                            <span style="font-size:12px;">${j.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Crear modal dinámico
    const modalHTML = `
        <div id="modal-ver-partido" class="modal-overlay" onclick="cerrarModalVerPartido(event)">
            <div class="modal-content" style="max-width:700px;" onclick="event.stopPropagation()">
                <div class="modal-header" style="background:linear-gradient(135deg,#059669,#047857);color:white;">
                    <div>
                        <h3 style="margin:0;">${esLocal ? (club?.name || 'Mi Equipo') : p.opponent} vs ${esLocal ? p.opponent : (club?.name || 'Mi Equipo')}</h3>
                        <p style="margin:5px 0 0;font-size:13px;opacity:0.9;">${p.competition || 'Partido'} • ${fecha} ${hora ? '• ' + hora : ''}</p>
                    </div>
                    <button class="modal-close" onclick="cerrarModalVerPartido()" style="color:white;">&times;</button>
                </div>
                <div class="modal-body">
                    ${resultadoHTML}
                    
${p.video_url ? generarVideoParaVerPartido(p.video_url) : ''}
                    
                    
                    <div style="margin-bottom:20px;">
                        <h4 style="font-size:14px;color:#374151;margin-bottom:10px;">📍 Información</h4>
                        <div style="background:#f8fafc;padding:15px;border-radius:10px;font-size:13px;">
                            ${p.stadium ? `<p style="margin:0 0 5px;"><strong>Estadio:</strong> ${p.stadium}</p>` : ''}
                            ${p.round ? `<p style="margin:0 0 5px;"><strong>Jornada:</strong> ${p.round}</p>` : ''}
                            ${p.lugar_encuentro ? `<p style="margin:0 0 5px;"><strong>Citación:</strong> ${p.lugar_encuentro} ${p.hora_salida ? 'a las ' + p.hora_salida : ''}</p>` : ''}
                            ${p.notas_convocatoria ? `<p style="margin:0;"><strong>Notas:</strong> ${p.notas_convocatoria}</p>` : ''}
                        </div>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <h4 style="font-size:14px;color:#374151;margin-bottom:10px;">⚽ Titulares (${titulares.length})</h4>
                        ${titularesHTML}
                        ${suplentesHTML}
                    </div>
                    
                    <div>
                        <h4 style="font-size:14px;color:#374151;margin-bottom:10px;">📋 Convocados (${convocados.length})</h4>
                        ${convocadosHTML}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="generarPDFConvocatoriaDesdeVer('${partidoId}')">📋 PDF Convocatoria</button>
                    <button class="btn-secondary" onclick="exportarPartidoPDF('${partidoId}')">📄 PDF Partido</button>
                    <button class="btn-primary green" onclick="cerrarModalVerPartido(); editarPartido('${partidoId}');">Editar</button>
                </div>
            </div>
        </div>
    `;
    
    // Insertar modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function cerrarModalVerPartido(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('modal-ver-partido');
    if (modal) modal.remove();
}

async function generarPDFConvocatoriaDesdeVer(partidoId) {
    // Cargar datos del partido y generar PDF
    const { data: p } = await supabaseClient.from('matches').select('*').eq('id', partidoId).single();
    if (!p) return;
    
    // Cargar en el formulario temporalmente para usar la función existente
    document.getElementById('partido-id').value = p.id;
    document.getElementById('partido-rival').value = p.opponent || '';
    document.getElementById('partido-competicion').value = p.competition || '';
    document.getElementById('partido-fecha').value = p.match_date || '';
    document.getElementById('partido-hora').value = p.kick_off_time || '';
    document.getElementById('partido-localidad').value = p.home_away || 'home';
    document.getElementById('partido-estadio').value = p.stadium || '';
    document.getElementById('partido-lugar-encuentro').value = p.lugar_encuentro || '';
    document.getElementById('partido-hora-salida').value = p.hora_salida || '';
    document.getElementById('partido-fecha-salida').value = p.fecha_salida || '';
    document.getElementById('partido-notas-convocatoria').value = p.notas_convocatoria || '';
    
    // Cargar convocados y titulares
    plantillaPartido = await cargarPlantillaParaPDF();
    convocadosPartido = (p.convocados || []).map(c => String(c.id));
    titularesPartido = (p.titulares || []).map(t => String(t.id));
    
    await generarPDFConvocatoria();
}

async function cargarPlantillaParaPDF() {
    const { data } = await supabaseClient
        .from('season_players')
        .select('id, player_id, shirt_number, players(id, name, position, photo_url)')
        .eq('season_id', seasonId)
        .order('shirt_number');
    return data || [];
}
        function editarPartido(id) {
            abrirModalPartido(id);
        }
        
     
        
       async function cargarConvocatoria() {
    const grid = document.getElementById('convocatoria-grid');
    
    if (!seasonId) {
        grid.innerHTML = '<p style="color:#9ca3af;">No hay temporada activa seleccionada</p>';
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('season_players')
            .select('id, player_id, shirt_number, players(id, name, position, photo_url)')
            .eq('season_id', seasonId)
            .order('shirt_number');
        
        if (error) {
            console.error('Error cargando convocatoria:', error);
            grid.innerHTML = '<p style="color:#dc2626;">Error al cargar jugadores</p>';
            return;
        }
        
        plantillaPartido = data || [];
        
        if (plantillaPartido.length === 0) {
            grid.innerHTML = '<p style="color:#9ca3af;">No hay jugadores en la plantilla de esta temporada</p>';
            return;
        }
        
        renderizarConvocatoria();
        
    } catch (err) {
        console.error('Error:', err);
        grid.innerHTML = '<p style="color:#dc2626;">Error de conexión</p>';
    }
}

function renderizarConvocatoria() {
            const grid = document.getElementById('convocatoria-grid');
            
            grid.innerHTML = plantillaPartido.map(sp => {
                const j = sp.players;
                if (!j) return '';
                const seleccionado = convocadosPartido.includes(String(sp.id));
                const foto = j.photo_url;
                const inicial = j.name ? j.name.charAt(0).toUpperCase() : '?';
                return `
                    <div class="jugador-check ${seleccionado ? 'selected' : ''}" data-sp-id="${sp.id}" onclick="toggleConvocado('${sp.id}')">
                        <div class="jugador-foto-mini">
                            ${foto ? `<img src="${foto}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">` 
                                   : `<span class="jugador-inicial" style="width:36px;height:36px;border-radius:50%;background:#6b21a8;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;">${inicial}</span>`}
                        </div>
                        <div class="jugador-check-info">
                            <div class="nombre">${j.name}</div>
                            <div class="posicion">${j.position || ''}</div>
                        </div>
                        <div class="dorsal">${sp.shirt_number || '-'}</div>
                    </div>
                `;
            }).join('');
            
            actualizarContadorConvocados();
            renderizarAlineacion();
            renderizarGpsPartido();
        }
        
     function toggleConvocado(spId) {
    spId = String(spId);
    const idx = convocadosPartido.indexOf(spId);
    if (idx > -1) {
        convocadosPartido.splice(idx, 1);
        const idxTit = titularesPartido.indexOf(spId);
        if (idxTit > -1) titularesPartido.splice(idxTit, 1);
        // Limpiar solo el slot de ESTE jugador, conservar el resto de la alineacion
        const slotIdxC = slotsTitularesMap.indexOf(spId);
        if (slotIdxC > -1) slotsTitularesMap[slotIdxC] = null;
    } else {
        convocadosPartido.push(spId);
    }
    slotVacioIdx = null;
    renderizarConvocatoria();
}
        
        function actualizarContadorConvocados() {
            document.getElementById('contador-convocados').textContent = `${convocadosPartido.length} convocados`;
        }
        
       // Mapa de formaciones: posiciones [x%, y%] en el campo (0,0 = arriba-izq, 100,100 = abajo-der)
        const FORMACIONES_MAPA = {
            '4-3-3': [
                {x:50,y:90,tipo:'POR'},{x:15,y:72,tipo:'DEF'},{x:38,y:72,tipo:'DEF'},{x:62,y:72,tipo:'DEF'},{x:85,y:72,tipo:'DEF'},
                {x:25,y:48,tipo:'MED'},{x:50,y:48,tipo:'MED'},{x:75,y:48,tipo:'MED'},
                {x:15,y:22,tipo:'DEL'},{x:50,y:15,tipo:'DEL'},{x:85,y:22,tipo:'DEL'}
            ],
            '4-4-2': [
                {x:50,y:90,tipo:'POR'},{x:15,y:72,tipo:'DEF'},{x:38,y:72,tipo:'DEF'},{x:62,y:72,tipo:'DEF'},{x:85,y:72,tipo:'DEF'},
                {x:15,y:48,tipo:'MED'},{x:38,y:48,tipo:'MED'},{x:62,y:48,tipo:'MED'},{x:85,y:48,tipo:'MED'},
                {x:35,y:20,tipo:'DEL'},{x:65,y:20,tipo:'DEL'}
            ],
            '4-2-3-1': [
                {x:50,y:90,tipo:'POR'},{x:15,y:72,tipo:'DEF'},{x:38,y:72,tipo:'DEF'},{x:62,y:72,tipo:'DEF'},{x:85,y:72,tipo:'DEF'},
                {x:35,y:55,tipo:'MED'},{x:65,y:55,tipo:'MED'},
                {x:15,y:35,tipo:'MED'},{x:50,y:35,tipo:'MED'},{x:85,y:35,tipo:'MED'},
                {x:50,y:15,tipo:'DEL'}
            ],
            '4-1-4-1': [
                {x:50,y:90,tipo:'POR'},{x:15,y:72,tipo:'DEF'},{x:38,y:72,tipo:'DEF'},{x:62,y:72,tipo:'DEF'},{x:85,y:72,tipo:'DEF'},
                {x:50,y:58,tipo:'MED'},
                {x:15,y:40,tipo:'MED'},{x:38,y:40,tipo:'MED'},{x:62,y:40,tipo:'MED'},{x:85,y:40,tipo:'MED'},
                {x:50,y:15,tipo:'DEL'}
            ],
            '3-5-2': [
                {x:50,y:90,tipo:'POR'},{x:25,y:72,tipo:'DEF'},{x:50,y:72,tipo:'DEF'},{x:75,y:72,tipo:'DEF'},
                {x:10,y:48,tipo:'MED'},{x:30,y:52,tipo:'MED'},{x:50,y:45,tipo:'MED'},{x:70,y:52,tipo:'MED'},{x:90,y:48,tipo:'MED'},
                {x:35,y:20,tipo:'DEL'},{x:65,y:20,tipo:'DEL'}
            ],
            '3-4-3': [
                {x:50,y:90,tipo:'POR'},{x:25,y:72,tipo:'DEF'},{x:50,y:72,tipo:'DEF'},{x:75,y:72,tipo:'DEF'},
                {x:15,y:48,tipo:'MED'},{x:38,y:48,tipo:'MED'},{x:62,y:48,tipo:'MED'},{x:85,y:48,tipo:'MED'},
                {x:20,y:22,tipo:'DEL'},{x:50,y:15,tipo:'DEL'},{x:80,y:22,tipo:'DEL'}
            ],
            '5-3-2': [
                {x:50,y:90,tipo:'POR'},{x:10,y:70,tipo:'DEF'},{x:30,y:74,tipo:'DEF'},{x:50,y:74,tipo:'DEF'},{x:70,y:74,tipo:'DEF'},{x:90,y:70,tipo:'DEF'},
                {x:25,y:48,tipo:'MED'},{x:50,y:45,tipo:'MED'},{x:75,y:48,tipo:'MED'},
                {x:35,y:20,tipo:'DEL'},{x:65,y:20,tipo:'DEL'}
            ],
            '5-4-1': [
                {x:50,y:90,tipo:'POR'},{x:10,y:70,tipo:'DEF'},{x:30,y:74,tipo:'DEF'},{x:50,y:74,tipo:'DEF'},{x:70,y:74,tipo:'DEF'},{x:90,y:70,tipo:'DEF'},
                {x:15,y:45,tipo:'MED'},{x:38,y:45,tipo:'MED'},{x:62,y:45,tipo:'MED'},{x:85,y:45,tipo:'MED'},
                {x:50,y:18,tipo:'DEL'}
            ]
        };

        function categoriaPosicion(pos) {
            if (!pos) return 'MED';
            const p = pos.toLowerCase();
            if (p.includes('portero')) return 'POR';
            if (p.includes('defensa') || p.includes('lateral')) return 'DEF';
            if (p.includes('delantero') || p.includes('extremo')) return 'DEL';
            return 'MED';
        }

        function posicionAbrev(pos) {
            if (!pos) return '?';
            const mapa = {
                'Portero': 'POR', 'Defensa Central': 'DC', 'Lateral Derecho': 'LD', 'Lateral Izquierdo': 'LI',
                'Mediocentro Defensivo': 'MCD', 'Mediocentro': 'MC', 'Mediapunta': 'MP',
                'Extremo Derecho': 'ED', 'Extremo Izquierdo': 'EI', 'Delantero Centro': 'DC9'
            };
            return mapa[pos] || pos.substring(0, 3).toUpperCase();
        }

        function colorPosicion(pos) {
            const cat = categoriaPosicion(pos);
            if (cat === 'POR') return '#f59e0b';
            if (cat === 'DEF') return '#3b82f6';
            if (cat === 'MED') return '#22c55e';
            if (cat === 'DEL') return '#ef4444';
            return '#6b7280';
        }

        function renderizarAlineacion() {
    const pitch = document.getElementById('pitch-visual');
    const suplentesGrid = document.getElementById('suplentes-grid');
    const noConvGrid = document.getElementById('no-convocados-grid');
    const noConvSection = document.getElementById('no-convocados-section');
    const contadorTitulares = document.getElementById('contador-titulares');
    const formacionLabel = document.getElementById('pitch-formation-label');
    const formatoEl = document.getElementById('partido-formato');
    const formacionEl = document.getElementById('partido-formacion');
    
    if (!pitch) return;
    
    const formato = formatoEl ? (parseInt(formatoEl.value) || 11) : 11;
    const formacion = formacionEl ? formacionEl.value : '4-3-3';
    const posiciones = FORMACIONES_MAPA[formacion] || FORMACIONES_MAPA['4-3-3'];
    
    if (formacionLabel) formacionLabel.textContent = formacion;
    if (contadorTitulares) contadorTitulares.textContent = `${titularesPartido.length}/${formato} titulares`;
    
    // Limpiar jugadores del pitch (mantener marcas del campo)
    pitch.querySelectorAll('.jugador-posicion').forEach(el => el.remove());
    
    const convocados = plantillaPartido.filter(sp => convocadosPartido.includes(String(sp.id)));
    const titulares = convocados.filter(sp => titularesPartido.includes(String(sp.id)));
    const suplentes = convocados.filter(sp => !titularesPartido.includes(String(sp.id)));
    
    // Inicializar slotsTitularesMap si está vacío o formación cambió
    if (slotsTitularesMap.length !== posiciones.length) {
        slotsTitularesMap = new Array(posiciones.length).fill(null);
        
        // Asignar titulares a posiciones
        const titOrdenados = [...titulares];
        
        // Primero portero
        const portero = titOrdenados.find(sp => categoriaPosicion(sp.players?.position) === 'POR');
        if (portero) {
            const idxPor = posiciones.findIndex(p => p.tipo === 'POR');
            if (idxPor >= 0) {
                slotsTitularesMap[idxPor] = String(portero.id);
                titOrdenados.splice(titOrdenados.indexOf(portero), 1);
            }
        }
        
        // Detecta lado del jugador por su posicion (Lateral Izquierdo, Extremo Derecho, etc.)
        const ladoJugador = (sp) => {
            const p = ((sp.players?.position) || '').toLowerCase();
            if (p.includes('izquierd')) return 'IZQ';
            if (p.includes('derech')) return 'DER';
            return 'CEN';
        };
        // Detecta lado del slot por su coordenada x en el campo
        const ladoSlot = (s) => s.x < 35 ? 'IZQ' : (s.x > 65 ? 'DER' : 'CEN');
        
        ['DEF', 'MED', 'DEL'].forEach(cat => {
            const jugadoresCat = titOrdenados.filter(sp => categoriaPosicion(sp.players?.position) === cat);
            let slotsLibres = posiciones.map((p, i) => ({...p, idx: i})).filter(p => p.tipo === cat && !slotsTitularesMap[p.idx]);
            
            // 1a pasada: emparejar laterales/extremos a sus slots laterales correctos
            ['IZQ', 'DER', 'CEN'].forEach(lado => {
                const jugs = jugadoresCat.filter(sp => ladoJugador(sp) === lado && titOrdenados.indexOf(sp) >= 0);
                const slotsLado = slotsLibres.filter(s => ladoSlot(s) === lado);
                jugs.forEach(sp => {
                    const slot = slotsLado.shift();
                    if (slot) {
                        slotsTitularesMap[slot.idx] = String(sp.id);
                        titOrdenados.splice(titOrdenados.indexOf(sp), 1);
                        slotsLibres = slotsLibres.filter(s => s.idx !== slot.idx);
                    }
                });
            });
            
            // 2a pasada: jugadores sin lado emparejado (mismatches) van al primer slot libre
            jugadoresCat.forEach(sp => {
                if (titOrdenados.indexOf(sp) < 0) return;
                const slot = slotsLibres.shift();
                if (slot) {
                    slotsTitularesMap[slot.idx] = String(sp.id);
                    titOrdenados.splice(titOrdenados.indexOf(sp), 1);
                }
            });
        });
        
        // Resto en slots libres
        titOrdenados.forEach(sp => {
            const idxLibre = slotsTitularesMap.findIndex(s => s === null);
            if (idxLibre >= 0) slotsTitularesMap[idxLibre] = String(sp.id);
        });
    }
    
    // Renderizar jugadores en el campo
    posiciones.forEach((pos, idx) => {
        const spId = slotsTitularesMap[idx];
        const sp = spId ? plantillaPartido.find(s => String(s.id) === spId) : null;
        const isVacio = slotVacioIdx === idx;
        
        const playerEl = document.createElement('div');
        playerEl.className = 'jugador-posicion' + (isVacio ? ' slot-vacio-activo' : '');
        playerEl.style.left = pos.x + '%';
        playerEl.style.top = pos.y + '%';
        
        if (sp && sp.players) {
            const j = sp.players;
            const foto = j.photo_url;
            const dorsal = sp.shirt_number || '';
            const nombre = j.name ? j.name.split(' ').pop() : '?';
            
            playerEl.onclick = function() { quitarTitularDeSlot(idx); };
            playerEl.innerHTML = `
                <div class="jugador-posicion-circulo">
                    ${foto ? `<img src="${foto}">` : `<span style="font-size:14px;font-weight:800;">${dorsal || '?'}</span>`}
                    ${dorsal ? `<span class="jugador-posicion-dorsal">${dorsal}</span>` : ''}
                </div>
                <div class="jugador-posicion-nombre">${nombre}</div>
            `;
        } else {
            // Slot vacío
            playerEl.onclick = function() { 
                slotVacioIdx = (slotVacioIdx === idx) ? null : idx;
                renderizarAlineacion();
            };
            playerEl.innerHTML = `
                <div class="jugador-posicion-circulo vacio${isVacio ? ' vacio-seleccionado' : ''}">
                    ${isVacio ? '⬇️' : '+'}
                </div>
                <div class="jugador-posicion-nombre" style="opacity:0.5;">${pos.tipo}</div>
            `;
        }
        
        pitch.appendChild(playerEl);
    });
    
    // Renderizar suplentes
    if (suplentesGrid) {
        if (suplentes.length === 0 && convocados.length === 0) {
            suplentesGrid.innerHTML = '<p style="color:#9ca3af;font-size:12px;">Selecciona convocados primero</p>';
        } else if (suplentes.length === 0) {
            suplentesGrid.innerHTML = '<p style="color:#9ca3af;font-size:12px;">Todos son titulares</p>';
        } else {
            suplentesGrid.innerHTML = suplentes.sort((a,b) => (a.shirt_number || 99) - (b.shirt_number || 99)).map(sp => {
                const j = sp.players;
                if (!j) return '';
                const foto = j.photo_url;
                const inicial = j.name ? j.name.charAt(0).toUpperCase() : '?';
                const posAbrev = posicionAbrev(j.position);
                const posCol = colorPosicion(j.position);
                const destacado = slotVacioIdx !== null ? ' sup-destacado' : '';
                return `
                    <div class="sup-jugador${destacado}" onclick="ponerSuplenteEnSlot('${sp.id}')">
                        <div class="sup-foto">
                            ${foto ? `<img src="${foto}">` : `<span class="sup-inicial">${inicial}</span>`}
                        </div>
                        <span class="sup-pos-badge" style="background:${posCol};">${posAbrev}</span>
                        <span class="sup-nombre">${j.name}${sp.shirt_number ? ' #' + sp.shirt_number : ''}</span>
                    </div>
                `;
            }).join('');
        }
    }
    
    // No convocados
    if (noConvGrid && noConvSection) {
        const noConvocados = plantillaPartido.filter(sp => !convocadosPartido.includes(String(sp.id)));
        if (noConvocados.length > 0) {
            noConvSection.style.display = 'block';
            noConvGrid.innerHTML = noConvocados.slice(0, 8).map(sp => {
                const j = sp.players;
                if (!j) return '';
                const posAbrev = posicionAbrev(j.position);
                const posCol = colorPosicion(j.position);
                return `
                    <div class="sup-jugador nc">
                        <div class="sup-foto"><span class="sup-inicial" style="opacity:0.4;">${j.name ? j.name.charAt(0) : '?'}</span></div>
                        <span class="sup-pos-badge" style="background:${posCol};opacity:0.4;">${posAbrev}</span>
                        <span class="sup-nombre" style="opacity:0.4;">${j.name}</span>
                    </div>
                `;
            }).join('');
        } else {
            noConvSection.style.display = 'none';
        }
    }
}

        // Quitar titular de un slot → pasa a suplentes
        function quitarTitularDeSlot(slotIdx) {
            const spId = slotsTitularesMap[slotIdx];
            if (!spId) return;
            
            // Quitar del slot y de titulares
            slotsTitularesMap[slotIdx] = null;
            const idx = titularesPartido.indexOf(spId);
            if (idx > -1) titularesPartido.splice(idx, 1);
            
            // Marcar ese slot como vacío activo
            slotVacioIdx = slotIdx;
            renderizarAlineacion();
        }
        
        // Poner suplente en el slot vacío
        function ponerSuplenteEnSlot(spId) {
            spId = String(spId);
            
            if (slotVacioIdx === null) {
                // Si no hay slot vacío, buscar el primer slot libre
                const idxLibre = slotsTitularesMap.findIndex(s => s === null);
                if (idxLibre === -1) {
                    showToast('No hay posiciones vacías. Primero quita un titular del campo.');
                    return;
                }
                slotVacioIdx = idxLibre;
            }
            
            const formato = parseInt(document.getElementById('partido-formato').value) || 11;
            if (titularesPartido.length >= formato && slotsTitularesMap[slotVacioIdx] !== null) {
                showToast(`Máximo ${formato} titulares para este formato`);
                return;
            }
            
            // Colocar suplente en el slot vacío
            slotsTitularesMap[slotVacioIdx] = spId;
            if (!titularesPartido.includes(spId)) {
                titularesPartido.push(spId);
            }
            
            slotVacioIdx = null;
            renderizarAlineacion();
        }

      function toggleTitular(spId) {
    spId = String(spId);
    const formato = parseInt(document.getElementById('partido-formato').value) || 11;
    const idx = titularesPartido.indexOf(spId);
    
    if (idx > -1) {
        titularesPartido.splice(idx, 1);
        // Quitar del slotMap
        const slotIdx = slotsTitularesMap.indexOf(spId);
        if (slotIdx > -1) slotsTitularesMap[slotIdx] = null;
    } else {
        if (titularesPartido.length >= formato) {
            showToast(`Máximo ${formato} titulares para este formato`);
            return;
        }
        titularesPartido.push(spId);
        // Forzar rebuild del slotMap
        slotsTitularesMap = new Array(0);
    }
    slotVacioIdx = null;
    renderizarAlineacion();
}
        function actualizarContadorTitulares() {
            const formato = parseInt(document.getElementById('partido-formato').value) || 11;
            document.getElementById('contador-titulares').textContent = `${titularesPartido.length}/${formato} titulares`;
        }
        // Evento para actualizar al cambiar formato
        document.addEventListener('DOMContentLoaded', function() {
            const formatoSelect = document.getElementById('partido-formato');
            if (formatoSelect) {
                formatoSelect.addEventListener('change', function() {
                    const nuevoFormato = parseInt(this.value);
                    if (titularesPartido.length > nuevoFormato) {
                        titularesPartido = titularesPartido.slice(0, nuevoFormato);
                    }
                    slotsTitularesMap = new Array(0);
                    slotVacioIdx = null;
                    renderizarAlineacion();
                });
            }
        });

        function cerrarModalPartido(event) {
            if (event && event.target !== event.currentTarget) return;
            document.getElementById('modal-partido').style.display = 'none';
        }
        
     async function guardarPartido() {
            const rival = document.getElementById('partido-rival').value.trim();
            const fecha = document.getElementById('partido-fecha').value;
            
            if (!rival || !fecha) {
                showToast('Rival y fecha son obligatorios');
                return;
            }
            
            // Obtener datos de convocados para guardar
     const convocadosData = plantillaPartido
    .filter(sp => convocadosPartido.includes(String(sp.id)))
                .map(sp => ({
                    id: sp.id,
                    player_id: sp.player_id,
                    name: sp.players?.name || '',
                    shirt_number: sp.shirt_number,
                    position: sp.position
                }));
            
            const titularesData = plantillaPartido
    .filter(sp => titularesPartido.includes(String(sp.id)))
                .map(sp => ({
                    id: sp.id,
                    player_id: sp.player_id,
                    name: sp.players?.name || '',
                    shirt_number: sp.shirt_number,
                    position: sp.position
                }));
            
            const suplentesData = convocadosData.filter(c => !titularesPartido.includes(String(c.id)));
            
            // Subir escudo rival si se seleccionó uno nuevo
            let opponentLogoUrl = escudoRivalUrl;
            const escudoInput = document.getElementById('partido-rival-escudo-input');
            if (escudoInput && escudoInput.files.length > 0) {
                const uploadedUrl = await subirEscudoRivalPartido();
                if (uploadedUrl) opponentLogoUrl = uploadedUrl;
            }

            const partidoData = {
                club_id: clubId,
                season_id: seasonId,
                opponent: rival,
                match_date: fecha,
                kick_off_time: document.getElementById('partido-hora').value || null,
                home_away: document.getElementById('partido-localidad').value,
                stadium: document.getElementById('partido-estadio').value || null,
                competition: document.getElementById('partido-competicion').value || null,
                round: document.getElementById('partido-jornada').value || null,
                formato_juego: parseInt(document.getElementById('partido-formato').value) || 11,
                formacion: document.getElementById('partido-formacion').value || '4-3-3',
                lugar_encuentro: document.getElementById('partido-lugar-encuentro').value || null,
                hora_salida: document.getElementById('partido-hora-salida').value || null,
                fecha_salida: document.getElementById('partido-fecha-salida').value || null,
                notas_convocatoria: document.getElementById('partido-notas-convocatoria').value || null,
                video_url: document.getElementById('partido-video-url').value.trim() || null,
                opponent_logo: opponentLogoUrl || null,
                convocados: convocadosData,
                titulares: titularesData,
                suplentes: suplentesData,
                alineacion_slots: slotsTitularesMap || [],
                gps: gpsPartidoParaGuardar()
            };
            console.log('Datos a guardar:', JSON.stringify(partidoData, null, 2));
            const partidoId = document.getElementById('partido-id').value;
            
           try {
    let resultado;
    if (partidoId) {
        resultado = await supabaseClient.from('matches').update(partidoData).eq('id', partidoId);
    } else {
        resultado = await supabaseClient.from('matches').insert(partidoData);
    }
    
    if (resultado.error) {
        console.error('Error Supabase:', resultado.error);
        showToast('Error: ' + resultado.error.message);
        return;
    }
                
                cerrarModalPartido();
                cargarPartidos();
            } catch (error) {
                showToast('Error al guardar: ' + error.message);
            }
        }
        
        async function eliminarPartido(id) {
            if (!await showConfirm('¿Eliminar este partido?')) return;
            await supabaseClient.from('match_player_stats').delete().eq('match_id', id);
            await supabaseClient.from('matches').delete().eq('id', id);
            cargarPartidos();
        }
        
        // ========== MATCHSTATS: RESULTADO ==========
      async function abrirModalResultado(partidoId) {
    document.getElementById('resultado-partido-id').value = partidoId;
    
    const { data: p } = await supabaseClient.from('matches').select('*').eq('id', partidoId).single();
    
    if (!p) {
        showToast('Partido no encontrado');
        return;
    }
    
    document.getElementById('resultado-favor').value = p.team_goals || 0;
    document.getElementById('resultado-contra').value = p.opponent_goals || 0;
    
    // Usar los convocados guardados en el partido (ahora son objetos JSON)
    const convocados = p.convocados || [];
    const grid = document.getElementById('stats-jugadores-grid');
    
    if (convocados.length === 0) {
        grid.innerHTML = '<p style="color:#9ca3af;text-align:center;padding:20px;">No hay jugadores convocados en este partido.<br>Edita el partido primero para añadir convocados.</p>';
    } else {
        // Cargar estadísticas existentes
        const { data: statsExist } = await supabaseClient
            .from('match_player_stats')
            .select('*')
            .eq('match_id', partidoId);
        
        const statsMap = {};
        (statsExist || []).forEach(s => statsMap[s.player_id] = s);
        
        // Ordenar por dorsal
        const convocadosOrdenados = convocados.sort((a, b) => (a.shirt_number || 99) - (b.shirt_number || 99));
        
        grid.innerHTML = convocadosOrdenados.map(j => {
            const s = statsMap[j.player_id] || {};
            const esTitular = (p.titulares || []).some(t => t.player_id === j.player_id);
            
            return `
                <div class="jugador-stats-row" data-player-id="${j.player_id}">
                    <div class="nombre">
                        <span style="display:inline-block;background:${esTitular ? '#3b82f6' : '#6b7280'};color:white;width:22px;height:22px;border-radius:6px;text-align:center;line-height:22px;font-size:11px;margin-right:8px;">${j.shirt_number || '-'}</span>
                        ${j.name}
                        ${esTitular ? '<span style="font-size:10px;color:#3b82f6;margin-left:5px;">TIT</span>' : '<span style="font-size:10px;color:#9ca3af;margin-left:5px;">SUP</span>'}
                    </div>
                    <input type="number" class="stat-min" value="${s.minutes_played || 0}" min="0" max="120" placeholder="Min">
                    <input type="number" class="stat-goles" value="${s.goals || 0}" min="0" placeholder="Gol">
                    <input type="number" class="stat-asist" value="${s.assists || 0}" min="0" placeholder="Asi">
                    <input type="number" class="stat-amarillas" value="${s.yellow_cards || 0}" min="0" max="2" placeholder="TA">
                    <input type="number" class="stat-rojas" value="${s.red_cards || 0}" min="0" max="1" placeholder="TR">
                </div>
            `;
        }).join('');
    }
    
    document.getElementById('modal-resultado').style.display = 'flex';
}
        
        function cerrarModalResultado(event) {
            if (event && event.target !== event.currentTarget) return;
            document.getElementById('modal-resultado').style.display = 'none';
        }
        
     async function guardarResultado() {
    const partidoId = document.getElementById('resultado-partido-id').value;
    const gF = parseInt(document.getElementById('resultado-favor').value) || 0;
    const gC = parseInt(document.getElementById('resultado-contra').value) || 0;
    
    let resultado = 'draw';
    if (gF > gC) resultado = 'win';
    else if (gF < gC) resultado = 'loss';
    
    // Actualizar resultado del partido
    const { error: errorPartido } = await supabaseClient.from('matches').update({
        team_goals: gF,
        opponent_goals: gC,
        result: resultado
    }).eq('id', partidoId);
    
    if (errorPartido) {
        showToast('Error al guardar resultado: ' + errorPartido.message);
        return;
    }
    
    // Guardar estadísticas de cada jugador
    const rows = document.querySelectorAll('.jugador-stats-row');
    let errores = [];
    
    for (const row of rows) {
        const playerId = row.dataset.playerId;
        const minutos = parseInt(row.querySelector('.stat-min').value) || 0;
        const goles = parseInt(row.querySelector('.stat-goles').value) || 0;
        const asistencias = parseInt(row.querySelector('.stat-asist').value) || 0;
        const amarillas = parseInt(row.querySelector('.stat-amarillas').value) || 0;
        const rojas = parseInt(row.querySelector('.stat-rojas').value) || 0;
        
        // Verificar si ya existe un registro para este jugador en este partido
        const { data: existente } = await supabaseClient
            .from('match_player_stats')
            .select('id')
            .eq('match_id', partidoId)
            .eq('player_id', playerId)
            .single();
        
        if (existente) {
            // Actualizar registro existente
            const { error } = await supabaseClient
                .from('match_player_stats')
                .update({
                    minutes_played: minutos,
                    goals: goles,
                    assists: asistencias,
                    yellow_cards: amarillas,
                    red_cards: rojas
                })
                .eq('id', existente.id);
            
            if (error) errores.push(error.message);
        } else {
            // Crear nuevo registro
            const { error } = await supabaseClient
                .from('match_player_stats')
                .insert({
                    match_id: partidoId,
                    player_id: playerId,
                    minutes_played: minutos,
                    goals: goles,
                    assists: asistencias,
                    yellow_cards: amarillas,
                    red_cards: rojas
                });
            
            if (error) errores.push(error.message);
        }
    }
    
    if (errores.length > 0) {
        console.error('Errores al guardar stats:', errores);
        showToast('Algunos datos no se guardaron correctamente');
    } else {
        showToast('Resultado y estadísticas guardados correctamente');
    }
    
    cerrarModalResultado();
    cargarPartidos();
}
        
        // ========== MATCHSTATS: ESTADÍSTICAS ==========
        async function cargarSelectorTemporadasStats() {
            const select = document.getElementById('stats-temporada');
            const { data } = await supabaseClient.from('seasons').select('*').eq('club_id', clubId).order('start_date', { ascending: false });
            
            select.innerHTML = (data || []).map(t => {
                const selected = t.id === seasonId ? 'selected' : '';
                return `<option value="${t.id}" ${selected}>${t.name}</option>`;
            }).join('');
        }
        
        async function cargarEstadisticas() {
            const tempId = document.getElementById('stats-temporada').value || seasonId;
            const resumenDiv = document.getElementById('stats-resumen');
            const tablaBody = document.getElementById('stats-tabla-body');
            
            // Resumen partidos
            const { data: partidos } = await supabaseClient.from('matches').select('*').eq('season_id', tempId).not('result', 'is', null);
            
            const victorias = partidos?.filter(p => p.result === 'win').length || 0;
            const empates = partidos?.filter(p => p.result === 'draw').length || 0;
            const derrotas = partidos?.filter(p => p.result === 'loss').length || 0;
            const gF = partidos?.reduce((sum, p) => sum + (p.team_goals || 0), 0) || 0;
            const gC = partidos?.reduce((sum, p) => sum + (p.opponent_goals || 0), 0) || 0;
            
            resumenDiv.innerHTML = `
                <div class="stat-card victoria"><div class="valor">${victorias}</div><div class="label">Victorias</div></div>
                <div class="stat-card empate"><div class="valor">${empates}</div><div class="label">Empates</div></div>
                <div class="stat-card derrota"><div class="valor">${derrotas}</div><div class="label">Derrotas</div></div>
                <div class="stat-card"><div class="valor">${gF}</div><div class="label">Goles a favor</div></div>
                <div class="stat-card"><div class="valor">${gC}</div><div class="label">Goles en contra</div></div>
            `;
            
            // Stats por jugador
            const { data: stats } = await supabaseClient
                .from('match_player_stats')
                .select('*, players(id, name, position, photo_url), matches!inner(season_id)')
                .eq('matches.season_id', tempId);
            
            const jugadorStats = {};
            (stats || []).forEach(s => {
                const pid = s.player_id;
                if (!jugadorStats[pid]) {
                    jugadorStats[pid] = { player: s.players, pj: 0, min: 0, goles: 0, asist: 0, ta: 0, tr: 0 };
                }
                if (s.minutes_played > 0) jugadorStats[pid].pj++;
                jugadorStats[pid].min += s.minutes_played || 0;
                jugadorStats[pid].goles += s.goals || 0;
                jugadorStats[pid].asist += s.assists || 0;
                jugadorStats[pid].ta += s.yellow_cards || 0;
                jugadorStats[pid].tr += s.red_cards || 0;
            });
            
            const ordenados = Object.values(jugadorStats).sort((a, b) => b.goles - a.goles);
            
            if (ordenados.length === 0) {
                tablaBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;">No hay estadisticas</td></tr>';
            } else {
               tablaBody.innerHTML = ordenados.map(j => {
    const inicial = j.player?.name?.charAt(0) || '?';
    const playerId = j.player?.id;
    return `
        <tr onclick="abrirFichaJugador('${playerId}')" style="cursor: pointer;" title="Ver ficha completa">
            <td>
                <div class="jugador-cell">
                    <div class="jugador-mini-foto">
                        ${j.player?.photo_url ? `<img src="${j.player.photo_url}">` : inicial}
                    </div>
                    <div>
                        <strong>${j.player?.name || 'Sin nombre'}</strong>
                        <div style="font-size:12px;color:#6b7280;">${j.player?.position || ''}</div>
                    </div>
                </div>
            </td>
            <td>${j.pj}</td>
            <td>${j.min}</td>
            <td><strong>${j.goles}</strong></td>
            <td>${j.asist}</td>
            <td>${j.ta}</td>
            <td>${j.tr}</td>
        </tr>
    `;
}).join('');
            }
        }
        // ========== FICHA JUGADOR ==========


async function abrirFichaJugador(playerId) {
    if (!playerId) return;
    
    fichaJugadorActual = playerId;
    const tempId = document.getElementById('stats-temporada').value || seasonId;
    
    // Cargar datos del jugador
    const { data: jugador } = await supabaseClient
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();
    
    if (!jugador) {
        showToast('Jugador no encontrado');
        return;
    }
    
    // Actualizar header del modal
    const fotoDiv = document.getElementById('ficha-foto');
    if (jugador.photo_url) {
        fotoDiv.innerHTML = `<img src="${jugador.photo_url}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
        fotoDiv.innerHTML = jugador.name?.charAt(0) || '?';
    }
    document.getElementById('ficha-nombre').textContent = jugador.name || 'Sin nombre';
    document.getElementById('ficha-posicion').textContent = jugador.position || 'Sin posición';
    
    // Datos personales
    const datosDiv = document.getElementById('ficha-datos-personales');
    const edad = jugador.birth_date ? calcularEdad(jugador.birth_date) : null;
    datosDiv.innerHTML = `
        ${jugador.birth_date ? `<div><strong>Edad:</strong> ${edad} años</div>` : ''}
        ${jugador.height_cm ? `<div><strong>Altura:</strong> ${jugador.height_cm} cm</div>` : ''}
        ${jugador.weight_kg ? `<div><strong>Peso:</strong> ${jugador.weight_kg} kg</div>` : ''}
        ${jugador.dominant_foot ? `<div><strong>Pie:</strong> ${jugador.dominant_foot}</div>` : ''}
        ${jugador.phone ? `<div><strong>Tel:</strong> ${jugador.phone}</div>` : ''}
        ${jugador.email ? `<div><strong>Email:</strong> ${jugador.email}</div>` : ''}
    `;
    
    // Cargar estadísticas del jugador en la temporada
    const { data: stats } = await supabaseClient
        .from('match_player_stats')
        .select('*, matches!inner(id, opponent, match_date, home_away, team_goals, opponent_goals, result, season_id)')
        .eq('player_id', playerId)
        .eq('matches.season_id', tempId)
        .order('matches(match_date)', { ascending: false });
    
    // Calcular resumen
    let totalPJ = 0, totalMin = 0, totalGoles = 0, totalAsist = 0, totalTA = 0, totalTR = 0;
    (stats || []).forEach(s => {
        if (s.minutes_played > 0) totalPJ++;
        totalMin += s.minutes_played || 0;
        totalGoles += s.goals || 0;
        totalAsist += s.assists || 0;
        totalTA += s.yellow_cards || 0;
        totalTR += s.red_cards || 0;
    });
    
    // Mostrar resumen
    document.getElementById('ficha-stats-resumen').innerHTML = `
        <div style="text-align:center;padding:15px;background:#ecfdf5;border-radius:10px;">
            <div style="font-size:28px;font-weight:700;color:#059669;">${totalPJ}</div>
            <div style="font-size:12px;color:#6b7280;">Partidos</div>
        </div>
        <div style="text-align:center;padding:15px;background:#eff6ff;border-radius:10px;">
            <div style="font-size:28px;font-weight:700;color:#3b82f6;">${totalMin}</div>
            <div style="font-size:12px;color:#6b7280;">Minutos</div>
        </div>
        <div style="text-align:center;padding:15px;background:#fef3c7;border-radius:10px;">
            <div style="font-size:28px;font-weight:700;color:#d97706;">${totalGoles}</div>
            <div style="font-size:12px;color:#6b7280;">Goles</div>
        </div>
        <div style="text-align:center;padding:15px;background:#f3e8ff;border-radius:10px;">
            <div style="font-size:28px;font-weight:700;color:#9333ea;">${totalAsist}</div>
            <div style="font-size:12px;color:#6b7280;">Asistencias</div>
        </div>
        <div style="text-align:center;padding:15px;background:#fef2f2;border-radius:10px;">
            <div style="font-size:28px;font-weight:700;color:#ef4444;">${totalTA}</div>
            <div style="font-size:12px;color:#6b7280;">Amarillas</div>
        </div>
        <div style="text-align:center;padding:15px;background:#fee2e2;border-radius:10px;">
            <div style="font-size:28px;font-weight:700;color:#dc2626;">${totalTR}</div>
            <div style="font-size:12px;color:#6b7280;">Rojas</div>
        </div>
    `;
    
    // Mostrar detalle partido a partido
    const tbody = document.getElementById('ficha-partidos-body');
    if (!stats || stats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:20px;">No hay partidos registrados</td></tr>';
    } else {
        tbody.innerHTML = stats.map(s => {
            const m = s.matches;
            const fecha = new Date(m.match_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            const esLocal = m.home_away === 'home';
            const marcador = esLocal ? `${m.team_goals || 0}-${m.opponent_goals || 0}` : `${m.opponent_goals || 0}-${m.team_goals || 0}`;
            
            let resultadoClass = '';
            let resultadoTexto = marcador;
            if (m.result === 'win') resultadoClass = 'color:#059669;font-weight:600;';
            else if (m.result === 'loss') resultadoClass = 'color:#dc2626;font-weight:600;';
            else if (m.result === 'draw') resultadoClass = 'color:#d97706;';
            
            return `
                <tr>
                    <td>${fecha}</td>
                    <td>${esLocal ? 'vs ' : '@ '}${m.opponent}</td>
                    <td style="${resultadoClass}">${resultadoTexto}</td>
                    <td>${s.minutes_played || 0}'</td>
                    <td><strong>${s.goals || 0}</strong></td>
                    <td>${s.assists || 0}</td>
                    <td>${s.yellow_cards || 0}</td>
                    <td>${s.red_cards || 0}</td>
                </tr>
            `;
        }).join('');
    }
    
    cargarRadares(playerId);
    document.getElementById('modal-ficha-jugador').style.display = 'flex';
}

function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

function cerrarModalFichaJugador(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('modal-ficha-jugador').style.display = 'none';
}

function previsualizarEscudoRival(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        escudoRivalUrl = e.target.result; // Guardar el base64
        const container = document.getElementById('partido-rival-escudo');
        container.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
        container.style.border = 'none';
    };
    reader.readAsDataURL(file);
}

async function subirEscudoRivalPartido() {
    const input = document.getElementById('partido-rival-escudo-input');
    if (!input.files.length) return null;
    
    const file = input.files[0];
    const fileName = `rival_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { data, error } = await supabaseClient.storage
        .from('logos')
        .upload(fileName, file);
    
    if (error) {
        console.error('Error subiendo escudo rival:', error);
        return null;
    }
    
    const { data: urlData } = supabaseClient.storage
        .from('logos')
        .getPublicUrl(fileName);
    
    return urlData.publicUrl;
}

function resetearEscudoRival() {
    escudoRivalUrl = null;
    const container = document.getElementById('partido-rival-escudo');
    container.innerHTML = '<span style="font-size: 20px;">🛡️</span>';
    container.style.border = '2px dashed #d1d5db';
    document.getElementById('partido-rival-escudo-input').value = '';
}

function cargarEscudoRival(url) {
    if (url) {
        escudoRivalUrl = url;
        const container = document.getElementById('partido-rival-escudo');
        container.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">`;
        container.style.border = 'none';
    } else {
        resetearEscudoRival();
    }
}

// Init: formato de partido listener
document.addEventListener('DOMContentLoaded', function() {
    var formatoSelect = document.getElementById('partido-formato');
    if (formatoSelect) {
        formatoSelect.addEventListener('change', function() {
            var nuevoFormato = parseInt(this.value);
            if (titularesPartido.length > nuevoFormato) {
                titularesPartido = titularesPartido.slice(0, nuevoFormato);
            }
            renderizarAlineacion();
        });
    }
});
// ========== SISTEMA DE RADARES — VALORACIONES JUGADOR ==========
// Pegar en matchstats.js ANTES de la ultima linea (registrarSubTab o similar)

var _radarCharts = {};
var _radarCategorias = null;
var _radarRatings = {};
var _radarPlayerId = null;

async function cargarRadares(playerId) {
    _radarPlayerId = playerId;
    var container = document.getElementById('ficha-radares');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af">Cargando valoraciones...</div>';

    // Destruir charts anteriores
    Object.keys(_radarCharts).forEach(function(k) {
        if (_radarCharts[k]) { _radarCharts[k].destroy(); delete _radarCharts[k]; }
    });

    try {
        // Cargar categorias del club
        var { data: club } = await supabaseClient.from('clubs').select('rating_categories').eq('id', clubId).single();
        _radarCategorias = (club && club.rating_categories) ? club.rating_categories : { groups: [], categories: [] };
        if (!_radarCategorias.groups) _radarCategorias.groups = [];
        if (!_radarCategorias.categories) _radarCategorias.categories = [];

        // Cargar ratings del jugador
        var { data: jugador } = await supabaseClient.from('players').select('ratings').eq('id', playerId).single();
        _radarRatings = (jugador && jugador.ratings) ? jugador.ratings : {};

        renderRadares();
    } catch (e) {
        container.innerHTML = '<div style="color:#ef4444;padding:20px">Error: ' + e.message + '</div>';
    }
}

function renderRadares() {
    var container = document.getElementById('ficha-radares');
    if (!container) return;

    var groups = _radarCategorias.groups || [];
    var cats = _radarCategorias.categories || [];

    if (!groups.length) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af">Sin categorias configuradas. <a href="#" onclick="abrirGestionCategorias();return false" style="color:#7c3aed">Configurar</a></div>';
        return;
    }

    var h = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">';
    h += '<h4 style="font-size:14px;color:#374151;margin:0">Valoraciones del Jugador</h4>';
    h += '<button onclick="abrirGestionCategorias()" style="padding:4px 12px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;font-size:12px;color:#6b7280">Gestionar categorias</button>';
    h += '</div>';

    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;margin-top:12px">';

    groups.forEach(function(g) {
        var groupCats = cats.filter(function(c) { return c.group === g.id; });
        if (!groupCats.length) return;

        h += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px">';
        h += '<h5 style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-align:center;text-transform:uppercase;letter-spacing:0.5px">' + escHTML(g.label) + '</h5>';
        h += '<div style="max-width:280px;margin:0 auto"><canvas id="radar-chart-' + g.id + '" width="280" height="280"></canvas></div>';

        // Sliders
        h += '<div style="margin-top:14px">';
        groupCats.forEach(function(c) {
            var val = _radarRatings[c.name] || 0;
            h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
            h += '<span style="font-size:11px;color:#6b7280;min-width:90px;text-align:right">' + escHTML(c.name) + '</span>';
            h += '<input type="range" min="0" max="100" value="' + val + '" data-cat="' + escHTML(c.name) + '" data-group="' + g.id + '" oninput="actualizarSliderRadar(this)" style="flex:1;accent-color:' + (g.color || '#7c3aed').replace(/[\d.]+\)$/, '1)') + '">';
            h += '<span id="radar-val-' + slugify(c.name) + '" style="font-size:12px;font-weight:700;color:#374151;min-width:28px;text-align:center">' + val + '</span>';
            h += '</div>';
        });
        h += '</div></div>';
    });

    h += '</div>';

    // Boton comparativa
    h += '<div style="text-align:center;margin-top:16px"><button onclick="guardarValoraciones()" style="padding:8px 20px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;margin-right:10px">Guardar valoraciones</button><button onclick="abrirComparativaJugadores()" style="padding:6px 16px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;cursor:pointer;font-size:12px;color:#6b7280">Comparar con otro jugador</button></div>';

    container.innerHTML = h;

    // Renderizar charts
    setTimeout(function() {
        groups.forEach(function(g) {
            var groupCats = cats.filter(function(c) { return c.group === g.id; });
            if (!groupCats.length) return;
            renderRadarChart(g, groupCats);
        });
    }, 100);
}

function renderRadarChart(group, groupCats) {
    var canvas = document.getElementById('radar-chart-' + group.id);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var labels = groupCats.map(function(c) { return c.name; });
    var values = groupCats.map(function(c) { return _radarRatings[c.name] || 0; });
    var color = group.color || 'rgba(168,85,247,0.5)';
    var borderColor = color.replace(/[\d.]+\)$/, '1)');
    var bgColor = color.replace(/[\d.]+\)$/, '0.25)');

    if (_radarCharts[group.id]) _radarCharts[group.id].destroy();

    _radarCharts[group.id] = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: group.label,
                data: values,
                backgroundColor: bgColor,
                borderColor: borderColor,
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: borderColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20, font: { size: 9 }, backdropColor: 'transparent', color: '#9ca3af' },
                    grid: { color: 'rgba(0,0,0,0.08)' },
                    angleLines: { color: 'rgba(0,0,0,0.08)' },
                    pointLabels: { font: { size: 11, weight: '600' }, color: '#374151' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(ctx) { return ctx.label + ': ' + ctx.raw; }
                    }
                }
            }
        }
    });
}

function actualizarSliderRadar(el) {
    var cat = el.getAttribute('data-cat');
    var groupId = el.getAttribute('data-group');
    var val = parseInt(el.value);

    // Actualizar label
    var label = document.getElementById('radar-val-' + slugify(cat));
    if (label) label.textContent = val;

    // Actualizar datos internos
    _radarRatings[cat] = val;

    // Actualizar chart
    var chart = _radarCharts[groupId];
    if (chart) {
        var cats = (_radarCategorias.categories || []).filter(function(c) { return c.group === groupId; });
        var idx = -1;
        for (var i = 0; i < cats.length; i++) { if (cats[i].name === cat) { idx = i; break; } }
        if (idx >= 0 && chart.data.datasets[0]) {
            chart.data.datasets[0].data[idx] = val;
            chart.update('none');
        }
    }
}

async function guardarValoraciones() {
    if (!_radarPlayerId) { showToast('Sin jugador seleccionado'); return; }
    try {
        var { error } = await supabaseClient.from('players').update({ ratings: _radarRatings }).eq('id', _radarPlayerId);
        if (error) throw error;
        showToast('Valoraciones guardadas');
    } catch (e) {
        showToast('Error: ' + e.message);
    }
}

// ========== GESTION DE CATEGORIAS ==========

function abrirGestionCategorias() {
    var prev = document.getElementById('modal-gestion-cats');
    if (prev) prev.remove();

    var ov = document.createElement('div');
    ov.id = 'modal-gestion-cats';
    ov.className = 'modal-overlay';
    ov.style.display = 'flex';
    ov.style.zIndex = '10001';
    ov.onclick = function(e) { if (e.target === ov) ov.remove(); };

    renderGestionCategorias(ov);
    document.body.appendChild(ov);
}

function renderGestionCategorias(ov) {
    if (!ov) ov = document.getElementById('modal-gestion-cats');
    if (!ov) return;

    var groups = _radarCategorias.groups || [];
    var cats = _radarCategorias.categories || [];

    var h = '<div class="modal-content" style="max-width:600px;max-height:85vh;overflow-y:auto" onclick="event.stopPropagation()">';
    h += '<div class="modal-header"><h3>Gestionar categorias de valoracion</h3><button class="modal-close" onclick="document.getElementById(\'modal-gestion-cats\').remove()">&times;</button></div>';
    h += '<div class="modal-body">';

    // Info limites
    h += '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#0369a1">Max 5 grupos, max 10 categorias por grupo. Escala 0-100.</div>';

    // Grupos
    groups.forEach(function(g, gi) {
        var gCats = cats.filter(function(c) { return c.group === g.id; });
        h += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px">';
        h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">';
        h += '<input type="text" value="' + escHTML(g.label) + '" onchange="catCambiarGrupoLabel(' + gi + ',this.value)" style="flex:1;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;font-weight:700">';
        h += '<input type="color" value="' + rgbaToHex(g.color || 'rgba(168,85,247,0.5)') + '" onchange="catCambiarGrupoColor(' + gi + ',this.value)" style="width:32px;height:32px;border:none;cursor:pointer;border-radius:4px">';
        h += '<button onclick="catEliminarGrupo(' + gi + ')" style="padding:4px 8px;background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:4px;cursor:pointer;font-size:11px">Eliminar</button>';
        h += '</div>';

        // Categorias del grupo
        gCats.forEach(function(c, ci) {
            var catIdx = cats.indexOf(c);
            h += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;padding:4px 8px;background:#fff;border:1px solid #e2e8f0;border-radius:6px">';
            h += '<span style="font-size:12px;color:#374151;flex:1">' + escHTML(c.name) + '</span>';
            h += '<button onclick="catEliminarCategoria(' + catIdx + ')" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:14px">x</button>';
            h += '</div>';
        });

        // Anadir categoria
        if (gCats.length < 10) {
            h += '<div style="display:flex;gap:6px;margin-top:8px">';
            h += '<input type="text" id="cat-nueva-' + g.id + '" placeholder="Nueva categoria..." style="flex:1;padding:5px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px">';
            h += '<button onclick="catAgregarCategoria(\'' + g.id + '\')" style="padding:5px 12px;background:#7c3aed;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:12px">+ Anadir</button>';
            h += '</div>';
        } else {
            h += '<div style="font-size:11px;color:#9ca3af;margin-top:4px">Limite alcanzado (10)</div>';
        }

        h += '</div>';
    });

    // Boton anadir grupo
    if (groups.length < 5) {
        h += '<div style="display:flex;gap:6px;margin-bottom:16px">';
        h += '<input type="text" id="cat-nuevo-grupo" placeholder="Nombre del nuevo grupo..." style="flex:1;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px">';
        h += '<button onclick="catAgregarGrupo()" style="padding:8px 16px;background:#374151;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">+ Grupo</button>';
        h += '</div>';
    } else {
        h += '<div style="font-size:12px;color:#9ca3af;margin-bottom:16px">Limite de grupos alcanzado (5)</div>';
    }

    h += '<div style="display:flex;justify-content:flex-end"><button onclick="catGuardar()" style="padding:8px 20px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">Guardar cambios</button></div>';
    h += '</div></div>';

    ov.innerHTML = h;
}

function catCambiarGrupoLabel(gi, val) {
    if (_radarCategorias.groups[gi]) _radarCategorias.groups[gi].label = val.trim();
}

function catCambiarGrupoColor(gi, hex) {
    if (_radarCategorias.groups[gi]) {
        var r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
        _radarCategorias.groups[gi].color = 'rgba(' + r + ',' + g + ',' + b + ',0.5)';
    }
}

function catEliminarGrupo(gi) {
    var g = _radarCategorias.groups[gi];
    if (!g) return;
    _radarCategorias.categories = _radarCategorias.categories.filter(function(c) { return c.group !== g.id; });
    _radarCategorias.groups.splice(gi, 1);
    renderGestionCategorias();
}

function catEliminarCategoria(idx) {
    _radarCategorias.categories.splice(idx, 1);
    renderGestionCategorias();
}

function catAgregarCategoria(groupId) {
    var input = document.getElementById('cat-nueva-' + groupId);
    if (!input) return;
    var name = input.value.trim();
    if (!name) { showToast('Escribe un nombre'); return; }

    var exists = _radarCategorias.categories.some(function(c) { return c.name.toLowerCase() === name.toLowerCase() && c.group === groupId; });
    if (exists) { showToast('Ya existe'); return; }

    _radarCategorias.categories.push({ name: name, group: groupId });
    renderGestionCategorias();
}

function catAgregarGrupo() {
    var input = document.getElementById('cat-nuevo-grupo');
    if (!input) return;
    var label = input.value.trim();
    if (!label) { showToast('Escribe un nombre'); return; }

    var id = label.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
    var exists = _radarCategorias.groups.some(function(g) { return g.id === id; });
    if (exists) id = id + '_' + Date.now();

    var colors = ['rgba(168,85,247,0.5)', 'rgba(59,130,246,0.5)', 'rgba(34,197,94,0.5)', 'rgba(245,158,11,0.5)', 'rgba(239,68,68,0.5)'];
    var color = colors[_radarCategorias.groups.length % colors.length];

    _radarCategorias.groups.push({ id: id, label: label, color: color });
    renderGestionCategorias();
}

async function catGuardar() {
    try {
        var { error } = await supabaseClient.from('clubs').update({ rating_categories: _radarCategorias }).eq('id', clubId);
        if (error) throw error;
        showToast('Categorias guardadas');
        var ov = document.getElementById('modal-gestion-cats');
        if (ov) ov.remove();
        renderRadares();
    } catch (e) {
        showToast('Error: ' + e.message);
    }
}

// ========== COMPARATIVA JUGADORES ==========

async function abrirComparativaJugadores() {
    if (!_radarPlayerId || !_radarCategorias) { showToast('Abre la ficha de un jugador primero'); return; }

    // Cargar plantilla
    var jugadores = [];
    try {
        var { data } = await supabaseClient.from('season_players').select('id,shirt_number,players(id,name,position,ratings,photo_url)').eq('season_id', seasonId).order('shirt_number', { ascending: true });
        jugadores = (data || []).filter(function(sp) { return sp.players && sp.players.id !== _radarPlayerId; });
    } catch (e) { showToast('Error cargando jugadores'); return; }

    var prev = document.getElementById('modal-comparar');
    if (prev) prev.remove();

    var ov = document.createElement('div');
    ov.id = 'modal-comparar';
    ov.className = 'modal-overlay';
    ov.style.display = 'flex';
    ov.style.zIndex = '10001';
    ov.onclick = function(e) { if (e.target === ov) ov.remove(); };

    var h = '<div class="modal-content" style="max-width:800px;max-height:90vh;overflow-y:auto" onclick="event.stopPropagation()">';
    h += '<div class="modal-header"><h3>Comparar jugadores</h3><button class="modal-close" onclick="document.getElementById(\'modal-comparar\').remove()">&times;</button></div>';
    h += '<div class="modal-body">';
    h += '<div style="margin-bottom:16px"><label style="font-size:13px;color:#6b7280;display:block;margin-bottom:6px">Selecciona jugador para comparar:</label>';
    h += '<select id="comparar-select" onchange="ejecutarComparativa()" style="width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px">';
    h += '<option value="">-- Elige jugador --</option>';
    jugadores.forEach(function(sp) {
        h += '<option value="' + sp.players.id + '">' + (sp.shirt_number ? '#' + sp.shirt_number + ' ' : '') + escHTML(sp.players.name) + ' (' + (sp.players.position || '?') + ')</option>';
    });
    h += '</select></div>';
    h += '<div id="comparar-radares"></div>';
    h += '</div></div>';

    ov.innerHTML = h;
    document.body.appendChild(ov);

    // Guardar datos de los jugadores en window para acceso rapido
    window._compJugadores = jugadores;
}

async function ejecutarComparativa() {
    var select = document.getElementById('comparar-select');
    var container = document.getElementById('comparar-radares');
    if (!select || !container) return;

    var otroId = select.value;
    if (!otroId) { container.innerHTML = ''; return; }

    // Destruir charts de comparativa anteriores
    Object.keys(_radarCharts).forEach(function(k) {
        if (k.indexOf('comp_') === 0 && _radarCharts[k]) { _radarCharts[k].destroy(); delete _radarCharts[k]; }
    });

    // Cargar ratings del otro jugador
    var otroRatings = {};
    var otroNombre = '';
    try {
        var { data: otro } = await supabaseClient.from('players').select('name,ratings').eq('id', otroId).single();
        if (otro) { otroRatings = otro.ratings || {}; otroNombre = otro.name; }
    } catch (e) { return; }

    // Nombre del jugador actual
    var miNombre = document.getElementById('ficha-nombre')?.textContent || 'Jugador 1';

    var groups = _radarCategorias.groups || [];
    var cats = _radarCategorias.categories || [];

    var h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;margin-top:16px">';

    groups.forEach(function(g) {
        var groupCats = cats.filter(function(c) { return c.group === g.id; });
        if (!groupCats.length) return;

        h += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px">';
        h += '<h5 style="margin:0 0 8px;font-size:13px;font-weight:700;color:#374151;text-align:center;text-transform:uppercase">' + escHTML(g.label) + '</h5>';
        h += '<div style="display:flex;justify-content:center;gap:16px;margin-bottom:8px;font-size:11px">';
        h += '<span style="color:' + (g.color || 'rgba(168,85,247,0.5)').replace(/[\d.]+\)$/, '1)') + ';font-weight:700">' + escHTML(miNombre) + '</span>';
        h += '<span style="color:rgba(239,68,68,1);font-weight:700">' + escHTML(otroNombre) + '</span>';
        h += '</div>';
        h += '<div style="max-width:300px;margin:0 auto"><canvas id="radar-comp-' + g.id + '" width="300" height="300"></canvas></div>';
        h += '</div>';
    });

    h += '</div>';
    container.innerHTML = h;

    // Renderizar charts comparativos
    setTimeout(function() {
        groups.forEach(function(g) {
            var groupCats = cats.filter(function(c) { return c.group === g.id; });
            if (!groupCats.length) return;

            var canvas = document.getElementById('radar-comp-' + g.id);
            if (!canvas) return;

            var labels = groupCats.map(function(c) { return c.name; });
            var val1 = groupCats.map(function(c) { return _radarRatings[c.name] || 0; });
            var val2 = groupCats.map(function(c) { return otroRatings[c.name] || 0; });

            var color1 = g.color || 'rgba(168,85,247,0.5)';
            var border1 = color1.replace(/[\d.]+\)$/, '1)');
            var bg1 = color1.replace(/[\d.]+\)$/, '0.2)');

            var color2 = 'rgba(239,68,68,0.5)';
            var border2 = 'rgba(239,68,68,1)';
            var bg2 = 'rgba(239,68,68,0.15)';

            _radarCharts['comp_' + g.id] = new Chart(canvas.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: miNombre,
                            data: val1,
                            backgroundColor: bg1,
                            borderColor: border1,
                            borderWidth: 2,
                            pointRadius: 4,
                            pointBackgroundColor: border1,
                            pointBorderColor: '#fff',
                            pointBorderWidth: 1
                        },
                        {
                            label: otroNombre,
                            data: val2,
                            backgroundColor: bg2,
                            borderColor: border2,
                            borderWidth: 2,
                            pointRadius: 4,
                            pointBackgroundColor: border2,
                            pointBorderColor: '#fff',
                            pointBorderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        r: {
                            min: 0, max: 100,
                            ticks: { stepSize: 20, font: { size: 9 }, backdropColor: 'transparent', color: '#9ca3af' },
                            grid: { color: 'rgba(0,0,0,0.08)' },
                            angleLines: { color: 'rgba(0,0,0,0.08)' },
                            pointLabels: { font: { size: 10, weight: '600' }, color: '#374151' }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        });
    }, 100);
}

// ========== UTILIDADES RADAR ==========

function escHTML(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

function slugify(s) { return s ? s.toLowerCase().replace(/[^a-z0-9]/g, '_') : ''; }

function rgbaToHex(rgba) {
    var m = rgba.match(/[\d.]+/g);
    if (!m || m.length < 3) return '#7c3aed';
    var r = parseInt(m[0]).toString(16).padStart(2, '0');
    var g = parseInt(m[1]).toString(16).padStart(2, '0');
    var b = parseInt(m[2]).toString(16).padStart(2, '0');
    return '#' + r + g + b;
}

// ========== ASIGNACION DE GPS DEL PARTIDO (vestuario) ==========
function gpsPartidoEnsureSeccion() {
    var grid = document.getElementById('convocatoria-grid');
    if (!grid) return null;
    var sec = document.getElementById('gpsp-seccion');
    if (!sec) {
        sec = document.createElement('div');
        sec.id = 'gpsp-seccion';
        sec.style.cssText = 'margin-top:12px;border:1.5px solid #e5e7eb;border-radius:12px;background:#fff;overflow:hidden;';
        grid.insertAdjacentElement('afterend', sec);
    }
    return sec;
}

function gpsPartidoSeleccionados() {
    return plantillaPartido.filter(function(sp) {
        return convocadosPartido.includes(String(sp.id));
    }).sort(function(a, b) {
        return (parseInt(a.shirt_number) || 999) - (parseInt(b.shirt_number) || 999);
    });
}

function gpsPartidoParaGuardar() {
    var out = {};
    gpsPartidoSeleccionados().forEach(function(sp) {
        var v = (gpsPartido[String(sp.id)] || '').trim();
        if (v) out[String(sp.id)] = v;
    });
    return out;
}

function renderizarGpsPartido() {
    var sec = gpsPartidoEnsureSeccion();
    if (!sec) return;
    var lista = gpsPartidoSeleccionados();
    if (lista.length === 0) { sec.style.display = 'none'; sec.innerHTML = ''; return; }
    sec.style.display = 'block';

    var filas = lista.map(function(sp) {
        var j = sp.players || {};
        var val = gpsPartido[String(sp.id)] || '';
        return '<div style="display:flex;align-items:center;gap:8px;padding:5px 10px;border-bottom:1px solid #f3f4f6;">' +
            '<span style="flex-shrink:0;font-size:11px;font-weight:800;color:#26215C;min-width:22px;text-align:center;">' + (sp.shirt_number || '?') + '</span>' +
            '<span style="flex:1;min-width:0;font-size:12px;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (j.name || 'Sin nombre') + '</span>' +
            '<input type="text" class="gpsp-input" data-spid="' + sp.id + '" value="' + String(val).replace(/"/g, '&quot;') + '" placeholder="GPS" maxlength="12" ' +
            'style="flex-shrink:0;width:70px;padding:4px 6px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:12px;font-weight:700;text-align:center;color:#26215C;">' +
            '</div>';
    }).join('');

    sec.innerHTML =
        '<div id="gpsp-header" style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:#f5f3ff;cursor:pointer;flex-wrap:wrap;">' +
            '<span style="font-size:12px;font-weight:800;color:#7c3aed;letter-spacing:0.04em;">ASIGNACI\u00d3N DE GPS</span>' +
            '<span id="gpsp-contador" style="font-size:11px;color:#6b7280;"></span>' +
            '<span style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;">' +
                '<button type="button" id="gpsp-btn-auto" style="font-size:11px;padding:4px 9px;border:1px solid #ddd6fe;background:#fff;border-radius:8px;cursor:pointer;color:#6b21a8;font-weight:600;">Auto 1,2,3...</button>' +
                '<button type="button" id="gpsp-btn-ultima" style="font-size:11px;padding:4px 9px;border:1px solid #ddd6fe;background:#fff;border-radius:8px;cursor:pointer;color:#6b21a8;font-weight:600;">Copiar \u00faltima sesi\u00f3n</button>' +
                '<button type="button" id="gpsp-btn-limpiar" style="font-size:11px;padding:4px 9px;border:1px solid #e5e7eb;background:#fff;border-radius:8px;cursor:pointer;color:#6b7280;">Limpiar</button>' +
                '<button type="button" id="gpsp-btn-pdf" style="font-size:11px;padding:4px 9px;border:none;background:#7c3aed;border-radius:8px;cursor:pointer;color:#fff;font-weight:700;">PDF vestuario</button>' +
            '</span>' +
        '</div>' +
        '<div id="gpsp-body" style="display:' + (gpsPartidoColapsado ? 'none' : 'block') + ';max-height:260px;overflow-y:auto;">' + filas + '</div>';

    sec.querySelector('#gpsp-header').addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON') return;
        gpsPartidoColapsado = !gpsPartidoColapsado;
        document.getElementById('gpsp-body').style.display = gpsPartidoColapsado ? 'none' : 'block';
    });
    sec.querySelectorAll('.gpsp-input').forEach(function(inp) {
        inp.addEventListener('input', function() {
            var v = this.value.trim();
            if (v) { gpsPartido[this.dataset.spid] = v; } else { delete gpsPartido[this.dataset.spid]; }
            gpsPartidoRefrescar();
        });
        inp.addEventListener('click', function(e) { e.stopPropagation(); });
    });
    sec.querySelector('#gpsp-btn-auto').addEventListener('click', function() {
        var n = 1;
        gpsPartidoSeleccionados().forEach(function(sp) { gpsPartido[String(sp.id)] = String(n++); });
        renderizarGpsPartido();
    });
    sec.querySelector('#gpsp-btn-ultima').addEventListener('click', gpsPartidoCopiarUltimaSesion);
    sec.querySelector('#gpsp-btn-limpiar').addEventListener('click', function() {
        gpsPartido = {};
        renderizarGpsPartido();
    });
    sec.querySelector('#gpsp-btn-pdf').addEventListener('click', gpsPartidoGenerarPDF);

    gpsPartidoRefrescar();
}

function gpsPartidoRefrescar() {
    var sec = document.getElementById('gpsp-seccion');
    if (!sec) return;
    var inputs = sec.querySelectorAll('.gpsp-input');
    var conteo = {};
    inputs.forEach(function(inp) {
        var v = inp.value.trim().toUpperCase();
        if (v) conteo[v] = (conteo[v] || 0) + 1;
    });
    var asignados = 0;
    inputs.forEach(function(inp) {
        var v = inp.value.trim().toUpperCase();
        if (v) asignados++;
        var dup = v && conteo[v] > 1;
        inp.style.borderColor = dup ? '#dc2626' : '#e5e7eb';
        inp.style.background = dup ? '#fef2f2' : '#fff';
    });
    var cont = document.getElementById('gpsp-contador');
    if (cont) cont.textContent = asignados + '/' + inputs.length + ' con GPS';
}

function gpsPartidoHayDuplicados() {
    var vals = [];
    gpsPartidoSeleccionados().forEach(function(sp) {
        var v = (gpsPartido[String(sp.id)] || '').trim().toUpperCase();
        if (v) vals.push(v);
    });
    return vals.length !== new Set(vals).size;
}

async function gpsPartidoCopiarUltimaSesion() {
    try {
        var res = await supabaseClient
            .from('training_sessions')
            .select('id, session_date, players')
            .eq('club_id', clubId)
            .order('session_date', { ascending: false })
            .limit(15);
        if (res.error) throw res.error;
        var origen = null;
        var sesiones = res.data || [];
        for (var i = 0; i < sesiones.length; i++) {
            var ps = sesiones[i].players;
            if (Array.isArray(ps) && ps.some(function(j) { return j && j.gps; })) { origen = sesiones[i]; break; }
        }
        if (!origen) { showToast('No hay ninguna sesi\u00f3n con GPS asignados'); return; }
        var mapa = {};
        origen.players.forEach(function(j) { if (j && j.player_id && j.gps) mapa[j.player_id] = j.gps; });
        var aplicados = 0;
        gpsPartidoSeleccionados().forEach(function(sp) {
            if (mapa[sp.player_id]) { gpsPartido[String(sp.id)] = mapa[sp.player_id]; aplicados++; }
        });
        renderizarGpsPartido();
        showToast('Copiados ' + aplicados + ' GPS de la sesi\u00f3n del ' + (origen.session_date || ''));
    } catch (e) {
        console.error('Error copiando GPS:', e);
        showToast('Error al copiar la \u00faltima asignaci\u00f3n');
    }
}

async function gpsPartidoGenerarPDF() {
    var lista = gpsPartidoSeleccionados().filter(function(sp) { return gpsPartido[String(sp.id)]; });
    if (lista.length === 0) { showToast('Asigna al menos un GPS antes de generar el PDF'); return; }
    if (gpsPartidoHayDuplicados()) { showToast('Hay n\u00fameros de GPS duplicados, rev\u00edsalos antes del PDF'); return; }

    lista.sort(function(a, b) {
        var va = String(gpsPartido[String(a.id)]), vb = String(gpsPartido[String(b.id)]);
        var na = parseInt(va, 10), nb = parseInt(vb, 10);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return va.localeCompare(vb, 'es', { numeric: true });
    });

    var clubNombre = '';
    try {
        var rc = await supabaseClient.from('clubs').select('name').eq('id', clubId).single();
        clubNombre = (rc.data && rc.data.name) || '';
    } catch (e) {}

    var rival = (document.getElementById('partido-rival').value || '').trim();
    var fechaVal = document.getElementById('partido-fecha').value;
    var horaVal = (document.getElementById('partido-hora').value || '').slice(0, 5);
    var fechaTxt = '';
    if (fechaVal) {
        var d = new Date(fechaVal + 'T12:00:00');
        fechaTxt = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    var doc = new window.jspdf.jsPDF('p', 'mm', 'a4');
    var W = 210, margen = 15;

    function cabecera() {
        doc.setFillColor(38, 33, 92);
        doc.rect(0, 0, W, 26, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(17);
        doc.setFont(undefined, 'bold');
        doc.text('ASIGNACI\u00d3N DE GPS \u00b7 PARTIDO', margen, 12);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        var sub = [clubNombre, rival ? 'vs ' + rival : '', fechaTxt, horaVal].filter(Boolean).join('  |  ');
        doc.text(sub || ' ', margen, 20);
        doc.setTextColor(0, 0, 0);
    }

    var altoFila = 11;
    var y;
    function cabeceraTabla() {
        doc.setFillColor(124, 58, 237);
        doc.rect(margen, y, W - margen * 2, 9, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('GPS', margen + 6, y + 6.3);
        doc.text('DORSAL', margen + 32, y + 6.3);
        doc.text('JUGADOR', margen + 60, y + 6.3);
        doc.text('POS', W - margen - 24, y + 6.3);
        doc.setTextColor(0, 0, 0);
        y += 9;
    }

    cabecera();
    y = 34;
    cabeceraTabla();

    lista.forEach(function(sp, i) {
        if (y + altoFila > 285) {
            doc.addPage();
            cabecera();
            y = 34;
            cabeceraTabla();
        }
        if (i % 2 === 0) {
            doc.setFillColor(245, 243, 255);
            doc.rect(margen, y, W - margen * 2, altoFila, 'F');
        }
        var j = sp.players || {};
        doc.setFontSize(15);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(124, 58, 237);
        doc.text(String(gpsPartido[String(sp.id)]), margen + 6, y + 7.6);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(String(sp.shirt_number || '-'), margen + 36, y + 7.4);
        doc.setFont(undefined, 'normal');
        doc.text(String(j.name || 'Sin nombre').substring(0, 30), margen + 60, y + 7.4);
        doc.setFontSize(9);
        doc.text(String(j.position || '').substring(0, 16), W - margen - 24, y + 7.2);
        y += altoFila;
    });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('TopLiderCoach', margen, 292);

    doc.save('GPS_partido_' + (fechaVal || 'fecha') + '.pdf');
}


// ========== IMPORTADOR DE CALENDARIO DE COMPETICION ==========
var impCal = { fixtures: [], equipos: [], compName: '', fechasExistentes: [] };

function impCalInyectarBoton() {
    if (document.getElementById('btn-importar-cal')) return;
    var lista = document.getElementById('lista-partidos');
    if (!lista || !lista.parentNode) return;
    var bar = document.createElement('div');
    bar.id = 'btn-importar-cal';
    bar.style.cssText = 'margin:0 0 10px;text-align:right';
    bar.innerHTML = '<button onclick="clasifAbrir()" style="padding:8px 14px;background:#fef3c7;color:#b45309;border:1px solid #fcd34d;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;margin-right:8px">\ud83c\udfc6 Clasificaci\u00f3n</button><button onclick="impCalAbrir()" style="padding:8px 14px;background:#ede9fe;color:#6d28d9;border:1px solid #c4b5fd;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600">\ud83d\udce5 Importar calendario</button>';
    lista.parentNode.insertBefore(bar, lista);
}

function impCalAbrir() {
    if (!seasonId) { showToast('Configura una temporada activa en Mi Club antes de importar', 'warning'); return; }
    var prev = document.getElementById('impcal-modal');
    if (prev) prev.remove();
    var ov = document.createElement('div');
    ov.id = 'impcal-modal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
    ov.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:760px;width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid #e5e7eb"><div style="font-size:17px;font-weight:700;color:#111827">\ud83d\udce5 Importar calendario de competici\u00f3n</div><button onclick="document.getElementById(\'impcal-modal\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#6b7280">\u2715</button></div>' +
        '<div id="impcal-body" style="padding:20px 22px;overflow-y:auto">' +
            '<p style="margin:0 0 12px;color:#374151;font-size:14px">Sube el calendario oficial de tu federaci\u00f3n (archivo Word/HTML descargado de la web federativa). Se detectar\u00e1n los equipos y las jornadas, y podr\u00e1s revisar todo antes de crear nada.</p>' +
            '<input type="file" id="impcal-file" accept=".doc,.html,.htm" onchange="impCalLeerArchivo(this)" style="font-size:14px">' +
            '<div id="impcal-resultado" style="margin-top:16px"></div>' +
        '</div>' +
    '</div>';
    document.body.appendChild(ov);
}

function impCalLeerArchivo(input) {
    if (!input.files || !input.files.length) return;
    var f = input.files[0];
    var reader = new FileReader();
    reader.onload = function(ev) {
        try {
            var buf = ev.target.result;
            var head = new TextDecoder('latin1').decode(buf.slice(0, 4096)).toLowerCase();
            var charset = 'utf-8';
            var m = head.match(/charset\s*=\s*["']?([\w-]+)/);
            if (m) charset = m[1];
            var html = '';
            try { html = new TextDecoder(charset).decode(buf); }
            catch (e) { html = new TextDecoder('utf-8').decode(buf); }
            impCalParsear(html);
        } catch (err) {
            console.error('impCalLeerArchivo:', err);
            document.getElementById('impcal-resultado').innerHTML = '<p style="color:#dc2626;font-size:14px">No se pudo leer el archivo: ' + err.message + '</p>';
        }
    };
    reader.readAsArrayBuffer(f);
}

async function impCalParsear(html) {
    var res = document.getElementById('impcal-resultado');
    res.innerHTML = '<p style="color:#6b7280;font-size:14px">Analizando calendario...</p>';
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var texto = doc.body ? doc.body.textContent : '';

    // Equipos participantes: "1.-Nombre (codigo)"
    impCal.equipos = [];
    var reEq = /\d+\s*\.\-\s*(.+?)\s*\(\d+\)/g, mEq;
    while ((mEq = reEq.exec(texto)) !== null) {
        var nom = mEq[1].replace(/\s+/g, ' ').trim();
        if (nom && impCal.equipos.indexOf(nom) === -1) impCal.equipos.push(nom);
    }

    // Nombre de la competicion: linea que contiene GRUPO
    impCal.compName = 'Liga';
    var mComp = texto.match(/([^\n\r|]{5,80}GRUPO\s*[\w]+)/i);
    if (mComp) impCal.compName = mComp[1].replace(/\s+/g, ' ').trim();

    // Jornadas y enfrentamientos recorriendo las filas en orden
    impCal.fixtures = [];
    var vistos = {};
    var jornadaActual = null, fechaActual = null;
    var reJ = /Jornada\s+(\d+)\s*\((\d{2})-(\d{2})-(\d{4})\)/;
    var filas = doc.querySelectorAll('tr');
    filas.forEach(function(tr) {
        var t = (tr.textContent || '').replace(/\s+/g, ' ').trim();
        var mJ = t.match(reJ);
        if (mJ) {
            jornadaActual = parseInt(mJ[1]);
            fechaActual = mJ[4] + '-' + mJ[3] + '-' + mJ[2];
            return;
        }
        if (!jornadaActual) return;
        var celdas = Array.prototype.slice.call(tr.querySelectorAll('td')).map(function(td) {
            return (td.textContent || '').replace(/\s+/g, ' ').trim();
        }).filter(function(x) { return x !== ''; });
        var i = celdas.indexOf('-');
        if (i > 0 && i < celdas.length - 1) {
            var local = celdas[i - 1], visitante = celdas[i + 1];
            if (local.length < 3 || visitante.length < 3) return;
            if (impCal.equipos.indexOf(local) === -1 || impCal.equipos.indexOf(visitante) === -1) return;
            var key = jornadaActual + '|' + local + '|' + visitante;
            if (vistos[key]) return;
            vistos[key] = true;
            impCal.fixtures.push({ jornada: jornadaActual, fecha: fechaActual, local: local, visitante: visitante });
        }
    });

    if (!impCal.fixtures.length || !impCal.equipos.length) {
        res.innerHTML = '<p style="color:#dc2626;font-size:14px">No se ha reconocido el formato del calendario. Comprueba que es el archivo oficial de la federaci\u00f3n (Word/HTML con jornadas tipo "Jornada 1 (06-09-2026)").</p>';
        return;
    }

    // Fechas con partido ya creado en esta temporada (para omitir duplicados)
    impCal.fechasExistentes = [];
    try {
        var ex = await supabaseClient.from('matches').select('match_date').eq('club_id', clubId).eq('season_id', seasonId);
        impCal.fechasExistentes = (ex.data || []).map(function(p) { return p.match_date; });
    } catch (e) {}

    var jornadas = impCal.fixtures.reduce(function(mx, f) { return Math.max(mx, f.jornada); }, 0);
    res.innerHTML = '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;font-size:14px;color:#166534;margin-bottom:14px">\u2714 Detectado: <b>' + impCalEsc(impCal.compName) + '</b> \u00b7 ' + impCal.equipos.length + ' equipos \u00b7 ' + jornadas + ' jornadas \u00b7 ' + impCal.fixtures.length + ' partidos</div>' +
        '<label style="font-size:13px;font-weight:600;color:#374151">\u00bfCu\u00e1l es tu equipo?</label><br>' +
        '<select id="impcal-equipo" onchange="impCalRenderPreview()" style="margin-top:6px;padding:8px 10px;font-size:14px;border:1px solid #d1d5db;border-radius:8px;max-width:100%"><option value="">-- Selecciona --</option>' +
        impCal.equipos.map(function(e) { return '<option>' + impCalEsc(e) + '</option>'; }).join('') +
        '</select>' +
        '<div id="impcal-preview" style="margin-top:14px"></div>';
}

function impCalEsc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function impCalRenderPreview() {
    var equipo = document.getElementById('impcal-equipo').value;
    var prev = document.getElementById('impcal-preview');
    if (!equipo) { prev.innerHTML = ''; return; }
    var mios = impCal.fixtures.filter(function(f) { return f.local === equipo || f.visitante === equipo; });
    if (!mios.length) { prev.innerHTML = '<p style="color:#dc2626;font-size:14px">No hay partidos de ese equipo en el calendario.</p>'; return; }
    var nuevos = 0;
    var filas = mios.map(function(f, i) {
        var esLocal = f.local === equipo;
        var rival = esLocal ? f.visitante : f.local;
        var existe = impCal.fechasExistentes.indexOf(f.fecha) !== -1;
        if (!existe) nuevos++;
        var fFmt = new Date(f.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
        return '<tr style="border-bottom:1px solid #f3f4f6' + (existe ? ';opacity:.45' : '') + '">' +
            '<td style="padding:6px 8px;font-size:13px;color:#6b7280">J' + f.jornada + '</td>' +
            '<td style="padding:6px 8px;font-size:13px">' + fFmt + '</td>' +
            '<td style="padding:6px 8px;font-size:13px;font-weight:600;color:#111827">' + impCalEsc(rival) + '</td>' +
            '<td style="padding:6px 8px;font-size:12px;color:' + (esLocal ? '#166534' : '#92400e') + '">' + (esLocal ? 'Local' : 'Visitante') + '</td>' +
            '<td style="padding:6px 8px;font-size:12px;color:#9ca3af">' + (existe ? 'Ya existe \u00b7 se omite' : '') + '</td>' +
        '</tr>';
    }).join('');
    prev.innerHTML = '<div style="max-height:320px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f9fafb;position:sticky;top:0"><th style="text-align:left;padding:8px;font-size:12px;color:#6b7280">Jor</th><th style="text-align:left;padding:8px;font-size:12px;color:#6b7280">Fecha</th><th style="text-align:left;padding:8px;font-size:12px;color:#6b7280">Rival</th><th style="text-align:left;padding:8px;font-size:12px;color:#6b7280">Campo</th><th></th></tr></thead><tbody>' + filas + '</tbody></table></div>' +
        '<label style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;color:#374151;cursor:pointer"><input type="checkbox" id="impcal-guardar-grupo" checked> Guardar el calendario completo del grupo para la Clasificaci\u00f3n</label>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px"><span style="font-size:13px;color:#6b7280">' + nuevos + ' partidos nuevos \u00b7 ' + (mios.length - nuevos) + ' ya existen</span>' +
        '<button onclick="impCalImportar()" style="padding:10px 18px;background:#16a34a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700">Importar</button></div>';
}

async function impCalImportar() {
    var equipo = document.getElementById('impcal-equipo').value;
    if (!equipo) return;
    var chkGrupo = document.getElementById('impcal-guardar-grupo');
    var guardarGrupo = !!(chkGrupo && chkGrupo.checked);
    var mios = impCal.fixtures.filter(function(f) {
        return (f.local === equipo || f.visitante === equipo) && impCal.fechasExistentes.indexOf(f.fecha) === -1;
    });
    try {
        var creados = 0;
        if (mios.length) {
            var inserts = mios.map(function(f) {
                var esLocal = f.local === equipo;
                return {
                    club_id: clubId,
                    season_id: seasonId,
                    opponent: esLocal ? f.visitante : f.local,
                    match_date: f.fecha,
                    home_away: esLocal ? 'home' : 'away',
                    competition: impCal.compName,
                    round: 'Jornada ' + f.jornada,
                    formato_juego: 11,
                    formacion: '4-3-3'
                };
            });
            var r = await supabaseClient.from('matches').insert(inserts);
            if (r.error) { showToast('Error: ' + r.error.message, 'error'); return; }
            creados = inserts.length;
        }
        var msgGrupo = '';
        if (guardarGrupo) msgGrupo = await impCalGuardarGrupo(equipo);
        showToast((creados ? creados + ' partidos creados' : 'Sin partidos nuevos') + (msgGrupo ? ' \u00b7 ' + msgGrupo : ''), 'success');
        var mo = document.getElementById('impcal-modal');
        if (mo) mo.remove();
        cargarPartidos();
    } catch (e) {
        showToast('Error al importar: ' + e.message, 'error');
    }
}

async function impCalGuardarGrupo(equipo) {
    var ex = await supabaseClient.from('competitions').select('id')
        .eq('club_id', clubId).eq('season_id', seasonId).eq('name', impCal.compName).limit(1);
    if (ex.error) throw ex.error;
    if (ex.data && ex.data.length) return 'la clasificaci\u00f3n ya exist\u00eda (resultados conservados)';
    var rc = await supabaseClient.from('competitions')
        .insert({ club_id: clubId, season_id: seasonId, name: impCal.compName, my_team: equipo, teams: impCal.equipos })
        .select('id').single();
    if (rc.error) throw rc.error;
    var cid = rc.data.id;
    var rows = impCal.fixtures.map(function(f) {
        return { competition_id: cid, jornada: f.jornada, match_date: f.fecha, home_team: f.local, away_team: f.visitante };
    });
    for (var i = 0; i < rows.length; i += 100) {
        var r = await supabaseClient.from('competition_fixtures').insert(rows.slice(i, i + 100));
        if (r.error) throw r.error;
    }
    return 'clasificaci\u00f3n guardada (' + rows.length + ' partidos del grupo)';
}

// ========== CLASIFICACION DE LA COMPETICION ==========
var clasif = { comp: null, fixtures: [], jornada: 1 };

async function clasifAbrir() {
    if (!seasonId) { showToast('Configura una temporada activa en Mi Club', 'warning'); return; }
    var rc = await supabaseClient.from('competitions').select('*')
        .eq('club_id', clubId).eq('season_id', seasonId)
        .order('created_at', { ascending: false }).limit(1);
    if (rc.error) { showToast('Error: ' + rc.error.message, 'error'); return; }
    if (!rc.data || !rc.data.length) { showToast('Primero importa un calendario con la opci\u00f3n de clasificaci\u00f3n marcada', 'warning'); return; }
    clasif.comp = rc.data[0];
    var rf = await supabaseClient.from('competition_fixtures').select('*')
        .eq('competition_id', clasif.comp.id).order('jornada').order('id');
    if (rf.error) { showToast('Error: ' + rf.error.message, 'error'); return; }
    clasif.fixtures = rf.data || [];
    var maxJ = clasif.fixtures.reduce(function(m, f) { return Math.max(m, f.jornada); }, 1);
    var j = maxJ;
    for (var k = 1; k <= maxJ; k++) {
        var fs = clasif.fixtures.filter(function(f) { return f.jornada === k; });
        if (fs.some(function(f) { return f.home_goals === null || f.away_goals === null; })) { j = k; break; }
    }
    clasif.jornada = j;
    var prev = document.getElementById('clasif-modal');
    if (prev) prev.remove();
    var ov = document.createElement('div');
    ov.id = 'clasif-modal';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px';
    ov.innerHTML = '<div style="background:#fff;border-radius:14px;max-width:1150px;width:100%;max-height:92vh;display:flex;flex-direction:column;overflow:hidden">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 22px;border-bottom:1px solid #e5e7eb;gap:10px"><div style="font-size:16px;font-weight:700;color:#111827;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">\ud83c\udfc6 ' + impCalEsc(clasif.comp.name) + '</div><button onclick="document.getElementById(\'clasif-modal\').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#6b7280;flex-shrink:0">\u2715</button></div>' +
        '<div id="clasif-body" style="padding:18px 22px;overflow-y:auto;display:flex;gap:22px;flex-wrap:wrap;align-items:flex-start"></div>' +
    '</div>';
    document.body.appendChild(ov);
    clasifRender();
}

function clasifRender() {
    var body = document.getElementById('clasif-body');
    if (!body) return;
    var maxJ = clasif.fixtures.reduce(function(m, f) { return Math.max(m, f.jornada); }, 1);
    var opts = '';
    for (var k = 1; k <= maxJ; k++) opts += '<option value="' + k + '"' + (k === clasif.jornada ? ' selected' : '') + '>Jornada ' + k + '</option>';
    var fj = clasif.fixtures.filter(function(f) { return f.jornada === clasif.jornada; });
    var fecha = fj.length && fj[0].match_date ? new Date(fj[0].match_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
    var inSt = 'width:44px;padding:6px 4px;text-align:center;font-size:14px;border:1px solid #d1d5db;border-radius:6px';
    var filas = fj.map(function(f) {
        var esMio = f.home_team === clasif.comp.my_team || f.away_team === clasif.comp.my_team;
        return '<div style="display:flex;align-items:center;gap:6px;padding:7px 8px;border-radius:8px' + (esMio ? ';background:#fef3c7' : '') + '">' +
            '<div style="flex:1;text-align:right;font-size:13px;color:#111827;' + (f.home_team === clasif.comp.my_team ? 'font-weight:700' : '') + '">' + impCalEsc(f.home_team) + '</div>' +
            '<input type="number" min="0" id="cg-h-' + f.id + '" value="' + (f.home_goals === null ? '' : f.home_goals) + '" style="' + inSt + '">' +
            '<span style="color:#9ca3af">-</span>' +
            '<input type="number" min="0" id="cg-a-' + f.id + '" value="' + (f.away_goals === null ? '' : f.away_goals) + '" style="' + inSt + '">' +
            '<div style="flex:1;font-size:13px;color:#111827;' + (f.away_team === clasif.comp.my_team ? 'font-weight:700' : '') + '">' + impCalEsc(f.away_team) + '</div>' +
        '</div>';
    }).join('');
    body.innerHTML =
        '<div style="flex:1;min-width:380px;max-width:520px">' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' +
                '<select onchange="clasifCambiarJornada(this.value)" style="padding:8px 10px;font-size:14px;border:1px solid #d1d5db;border-radius:8px;font-weight:600">' + opts + '</select>' +
                '<span style="font-size:13px;color:#6b7280">' + fecha + '</span>' +
            '</div>' +
            '<div style="border:1px solid #e5e7eb;border-radius:10px;padding:6px">' + filas + '</div>' +
            '<button onclick="clasifGuardarJornada()" style="margin-top:12px;width:100%;padding:11px;background:#16a34a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700">Guardar resultados de la jornada</button>' +
        '</div>' +
        '<div style="flex:1.4;min-width:420px">' + clasifTablaHtml() + '</div>';
}

function clasifCambiarJornada(v) {
    clasif.jornada = parseInt(v);
    clasifRender();
}

async function clasifGuardarJornada() {
    var fj = clasif.fixtures.filter(function(f) { return f.jornada === clasif.jornada; });
    var cambios = [];
    for (var i = 0; i < fj.length; i++) {
        var f = fj[i];
        var hEl = document.getElementById('cg-h-' + f.id);
        var aEl = document.getElementById('cg-a-' + f.id);
        if (!hEl || !aEl) continue;
        var h = hEl.value === '' ? null : parseInt(hEl.value);
        var a = aEl.value === '' ? null : parseInt(aEl.value);
        if ((h === null) !== (a === null)) { showToast('Hay un marcador a medias en ' + f.home_team + ' - ' + f.away_team, 'warning'); return; }
        if (h !== f.home_goals || a !== f.away_goals) cambios.push({ f: f, h: h, a: a });
    }
    if (!cambios.length) { showToast('No hay cambios que guardar'); return; }
    try {
        for (var c = 0; c < cambios.length; c++) {
            var r = await supabaseClient.from('competition_fixtures')
                .update({ home_goals: cambios[c].h, away_goals: cambios[c].a })
                .eq('id', cambios[c].f.id);
            if (r.error) throw r.error;
            cambios[c].f.home_goals = cambios[c].h;
            cambios[c].f.away_goals = cambios[c].a;
        }
        showToast('Resultados guardados', 'success');
        clasifRender();
    } catch (e) {
        showToast('Error al guardar: ' + e.message, 'error');
    }
}

function clasifTablaHtml() {
    var equipos = clasif.comp.teams || [];
    var st = {};
    equipos.forEach(function(e) { st[e] = { eq: e, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 }; });
    clasif.fixtures.forEach(function(f) {
        if (f.home_goals === null || f.away_goals === null) return;
        var h = st[f.home_team], a = st[f.away_team];
        if (!h || !a) return;
        h.pj++; a.pj++;
        h.gf += f.home_goals; h.gc += f.away_goals;
        a.gf += f.away_goals; a.gc += f.home_goals;
        if (f.home_goals > f.away_goals) { h.pg++; a.pp++; }
        else if (f.home_goals < f.away_goals) { a.pg++; h.pp++; }
        else { h.pe++; a.pe++; }
    });
    var tabla = equipos.map(function(e) {
        var s = st[e];
        s.dg = s.gf - s.gc;
        s.pts = s.pg * 3 + s.pe;
        return s;
    }).sort(function(x, y) {
        return (y.pts - x.pts) || (y.dg - x.dg) || (y.gf - x.gf) || x.eq.localeCompare(y.eq);
    });
    var filas = tabla.map(function(s, i) {
        var esMio = s.eq === clasif.comp.my_team;
        return '<tr style="border-bottom:1px solid #f3f4f6' + (esMio ? ';background:#fef3c7;font-weight:700' : '') + '">' +
            '<td style="padding:6px 8px;font-size:13px;color:#6b7280;text-align:center">' + (i + 1) + '</td>' +
            '<td style="padding:6px 8px;font-size:13px;color:#111827">' + impCalEsc(s.eq) + '</td>' +
            '<td style="padding:6px 4px;font-size:13px;text-align:center">' + s.pj + '</td>' +
            '<td style="padding:6px 4px;font-size:13px;text-align:center;color:#166534">' + s.pg + '</td>' +
            '<td style="padding:6px 4px;font-size:13px;text-align:center;color:#92400e">' + s.pe + '</td>' +
            '<td style="padding:6px 4px;font-size:13px;text-align:center;color:#991b1b">' + s.pp + '</td>' +
            '<td style="padding:6px 4px;font-size:13px;text-align:center">' + s.gf + '</td>' +
            '<td style="padding:6px 4px;font-size:13px;text-align:center">' + s.gc + '</td>' +
            '<td style="padding:6px 4px;font-size:13px;text-align:center">' + (s.dg > 0 ? '+' : '') + s.dg + '</td>' +
            '<td style="padding:6px 8px;font-size:14px;text-align:center;font-weight:800;color:#111827">' + s.pts + '</td>' +
        '</tr>';
    }).join('');
    var th = 'padding:8px 4px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;text-align:center';
    return '<div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f9fafb">' +
        '<th style="' + th + '">#</th><th style="' + th + ';text-align:left">Equipo</th><th style="' + th + '">PJ</th><th style="' + th + '">PG</th><th style="' + th + '">PE</th><th style="' + th + '">PP</th><th style="' + th + '">GF</th><th style="' + th + '">GC</th><th style="' + th + '">DG</th><th style="' + th + '">PTS</th>' +
        '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
        '<div style="font-size:12px;color:#9ca3af;margin-top:8px">Criterios de orden: puntos, diferencia de goles, goles a favor. (El desempate oficial por enfrentamiento directo no se aplica.)</div>';
}

