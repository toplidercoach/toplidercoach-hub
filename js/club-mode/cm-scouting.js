// ============================================================
// CM-SCOUTING.JS - Modulo de Scouting
// TopLiderCoach HUB - Club Mode - Oficina
// ============================================================
// Prefijo: cmSc | Tabs: Partidos, Jugadores, Rivales, Shortlists, Dashboard DD
// ============================================================

// ========== ESTADO DEL MODULO ==========
var cmScContainerId = null;
var cmScTabActiva = 'partidos';
var cmScPartidos = [];
var cmScFiltroEstado = 'all';
var cmScPartidoActual = null;
var cmScHighlights = [];
var cmScMiembros = [];
var cmScEditandoPartido = null;

// --- API-Football ---
var CMSC_API_KEY = '0bc5ef5776a4f9f1d0eb225b901874ed';
var CMSC_API_BASE = 'https://v3.football.api-sports.io';
var CMSC_API_PLAN = 'free'; // 'free' = temporadas 2022-2024, sin parametro last | 'paid' = temporada actual, todos los parametros

var CMSC_FORMACIONES = ['1-4-3-3','1-4-4-2','1-3-5-2','1-4-2-3-1','1-3-4-3','1-4-1-4-1','1-5-3-2','1-4-3-2-1'];
var CMSC_POSICIONES_MAP = {
    '1-4-3-3':   ['POR','LD','DCD','DCI','LI','MC','ID','II','ED','DC','EI'],
    '1-4-4-2':   ['POR','LD','DCD','DCI','LI','MD','MCD','MCI','MI','DC1','DC2'],
    '1-3-5-2':   ['POR','DCD','DCC','DCI','CAD','MCD','MC','MCI','CAI','DC1','DC2'],
    '1-4-2-3-1': ['POR','LD','DCD','DCI','LI','PIV1','PIV2','ED','MP','EI','DC'],
    '1-3-4-3':   ['POR','DCD','DCC','DCI','CAD','MCD','MCI','CAI','ED','DC','EI'],
    '1-4-1-4-1': ['POR','LD','DCD','DCI','LI','PIV','MD','MCD','MCI','MI','DC'],
    '1-5-3-2':   ['POR','CAD','DCD','DCC','DCI','CAI','MCD','MC','MCI','DC1','DC2'],
    '1-4-3-2-1': ['POR','LD','DCD','DCI','LI','MCD','MC','MCI','MP1','MP2','DC']
};
var CMSC_POS_NOMBRES = {
    POR:'Portero', LD:'Lateral Derecho', LI:'Lateral Izquierdo',
    DCD:'Central Derecho', DCI:'Central Izquierdo', DCC:'Central',
    MC:'Mediocentro', MCD:'Mediocentro Derecho', MCI:'Mediocentro Izquierdo',
    ID:'Interior Derecho', II:'Interior Izquierdo',
    MD:'Medio Derecho', MI:'Medio Izquierdo',
    ED:'Extremo Derecho', EI:'Extremo Izquierdo',
    DC:'Delantero Centro', DC1:'Delantero 1', DC2:'Delantero 2',
    MP:'Mediapunta', MP1:'Mediapunta Der.', MP2:'Mediapunta Izq.',
    PIV:'Pivote', PIV1:'Pivote 1', PIV2:'Pivote 2',
    CAD:'Carrilero Derecho', CAI:'Carrilero Izquierdo'
};
var cmScApiEquipos = [];
var cmScApiPartidos = [];


// ========== HELPERS ==========
function cmScEsc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cmScFechaCorta(d) {
    if (!d) return '';
    try { return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return d; }
}

function cmScGetMiembroNombre(memberId) {
    if (!memberId) return '\u2014';
    var m = cmScMiembros.find(function(x) { return x.id === memberId; });
    return m ? m.display_name : '\u2014';
}

function cmScGetMiMiembroId() {
    if (typeof cmState !== 'undefined' && cmState.miembro) return cmState.miembro.id;
    if (typeof usuario !== 'undefined' && usuario) {
        var m = cmScMiembros.find(function(x) { return String(x.wp_user_id) === String(usuario.id); });
        if (m) return m.id;
    }
    return null;
}


// ========== INICIALIZACION ==========
function cmScInit(containerId) {
    var container = document.getElementById(containerId);
    if (!container) { console.error('cmScInit: contenedor no encontrado:', containerId); return; }
    cmScContainerId = containerId;
    cmScRenderPanel(container);
    cmScCambiarTab('partidos');
}


// ========== RENDER DEL PANEL PRINCIPAL ==========
function cmScRenderPanel(container) {
    container.innerHTML =
    '<style>' +
        '.cmsc-wrap{background:#0f172a;min-height:calc(100vh - 120px);padding:24px 20px;box-sizing:border-box}' +
        '.cmsc-panel{max-width:1200px;margin:0 auto}' +
        '.cmsc-header{margin-bottom:18px}' +
        '.cmsc-header h2{margin:0;color:#f1f5f9;font-size:20px;font-weight:700}' +
        '.cmsc-header .cmsc-sub{color:#94a3b8;font-size:12px;margin-top:2px}' +
        '.cmsc-tabs{display:flex;gap:0;border-bottom:1px solid #1e293b;margin-bottom:20px;flex-wrap:wrap}' +
        '.cmsc-tab{padding:10px 20px;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all .2s;font-family:inherit}' +
        '.cmsc-tab:hover{color:#e2e8f0}' +
        '.cmsc-tab.active{color:#3b82f6;border-bottom-color:#3b82f6}' +
        '.cmsc-tab-badge{display:inline-block;margin-left:6px;background:#334155;color:#94a3b8;font-size:10px;padding:1px 6px;border-radius:8px;font-weight:600}' +
        '.cmsc-empty{text-align:center;padding:60px 20px;color:#64748b;grid-column:1/-1}' +
        '.cmsc-empty .icon{font-size:48px;margin-bottom:14px}' +
        '.cmsc-empty h3{color:#e2e8f0;font-size:16px;margin:0 0 6px}' +
        '.cmsc-empty p{font-size:13px;margin:0;line-height:1.6}' +
        '.cmsc-btn{padding:8px 16px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s}' +
        '.cmsc-btn-primary{background:#3b82f6;color:#fff}.cmsc-btn-primary:hover{background:#2563eb}' +
        '.cmsc-btn-secondary{background:#334155;color:#e2e8f0}.cmsc-btn-secondary:hover{background:#475569}' +
        '.cmsc-btn-success{background:#059669;color:#fff}.cmsc-btn-success:hover{background:#047857}' +
        '.cmsc-btn-danger{background:#dc2626;color:#fff}.cmsc-btn-danger:hover{background:#b91c1c}' +
        '.cmsc-btn-sm{padding:5px 12px;font-size:12px}' +
        '.cmsc-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}' +
        '.cmsc-toolbar select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px;font-family:inherit;cursor:pointer}' +
        '.cmsc-contador{color:#94a3b8;font-size:12px;margin-bottom:14px}' +
        '.cmsc-contador strong{color:#e2e8f0}' +
        '.cmsc-match-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}' +
        '.cmsc-match-card{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px;cursor:pointer;transition:all .2s}' +
        '.cmsc-match-card:hover{border-color:#3b82f6;transform:translateY(-1px)}' +
        '.cmsc-match-teams{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}' +
        '.cmsc-match-team{color:#f1f5f9;font-weight:600;font-size:14px;flex:1}' +
        '.cmsc-match-team.away{text-align:right}' +
        '.cmsc-match-score{color:#f59e0b;font-size:18px;font-weight:700;min-width:50px;text-align:center}' +
        '.cmsc-match-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center}' +
        '.cmsc-match-meta span{font-size:11px;color:#94a3b8}' +
        '.cmsc-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap}' +
        '.cmsc-badge-pending{background:#422006;color:#fbbf24}' +
        '.cmsc-badge-in_progress{background:#172554;color:#60a5fa}' +
        '.cmsc-badge-completed{background:#052e16;color:#4ade80}' +
        '.cmsc-badge-sign{background:#052e16;color:#4ade80}' +
        '.cmsc-badge-watch{background:#422006;color:#fbbf24}' +
        '.cmsc-badge-discard{background:#450a0a;color:#fca5a5}' +
        '.cmsc-badge-live{background:#1e3a5f;color:#93c5fd}' +
        '.cmsc-badge-tv{background:#312e81;color:#c4b5fd}' +
        '.cmsc-badge-video{background:#1e293b;color:#94a3b8}' +
        '.cmsc-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9500;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}' +
        '.cmsc-modal{background:#0f172a;border:1px solid #334155;border-radius:14px;width:100%;max-width:600px}' +
        '.cmsc-modal-header{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #1e293b}' +
        '.cmsc-modal-header h3{margin:0;color:#f1f5f9;font-size:17px}' +
        '.cmsc-modal-close{background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1}' +
        '.cmsc-modal-close:hover{color:#ef4444}' +
        '.cmsc-modal-body{padding:20px 22px}' +
        '.cmsc-modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid #1e293b;flex-wrap:wrap}' +
        '.cmsc-form-group{margin-bottom:14px}' +
        '.cmsc-form-group label{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}' +
        '.cmsc-form-group input,.cmsc-form-group select,.cmsc-form-group textarea{width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit;box-sizing:border-box}' +
        '.cmsc-form-group textarea{min-height:80px;resize:vertical}' +
        '.cmsc-form-group input:focus,.cmsc-form-group select:focus,.cmsc-form-group textarea:focus{border-color:#3b82f6;outline:none}' +
        '.cmsc-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
        '.cmsc-form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}' +
        '.cmsc-detail-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px}' +
        '.cmsc-detail-back{background:none;border:none;color:#60a5fa;font-size:13px;cursor:pointer;padding:0;font-family:inherit;font-weight:600}' +
        '.cmsc-detail-back:hover{text-decoration:underline}' +
        '.cmsc-detail-card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:16px}' +
        '.cmsc-detail-card h4{margin:0 0 12px;color:#f1f5f9;font-size:15px}' +
        '.cmsc-hl-list{display:flex;flex-direction:column;gap:8px}' +
        '.cmsc-hl-item{background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px 14px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px}' +
        '.cmsc-hl-info{flex:1;min-width:0}' +
        '.cmsc-hl-name{color:#f1f5f9;font-weight:600;font-size:14px}' +
        '.cmsc-hl-meta{color:#94a3b8;font-size:11px;margin-top:2px}' +
        '.cmsc-hl-notes{color:#cbd5e1;font-size:12px;margin-top:6px;line-height:1.5}' +
        '.cmsc-hl-actions{display:flex;gap:6px;flex-shrink:0}' +
        '@media(max-width:640px){.cmsc-tabs{overflow-x:auto;flex-wrap:nowrap}.cmsc-tab{white-space:nowrap}.cmsc-wrap{padding:16px 12px}.cmsc-form-row,.cmsc-form-row-3{grid-template-columns:1fr}}' +
    '</style>' +
    '<div class="cmsc-wrap">' +
        '<div class="cmsc-panel">' +
            '<div class="cmsc-header">' +
                '<h2>Scouting</h2>' +
                '<div class="cmsc-sub">Departamento de scouting del club</div>' +
            '</div>' +
            '<div class="cmsc-tabs">' +
                '<button class="cmsc-tab active" id="cmsc-tab-partidos" onclick="cmScCambiarTab(\'partidos\',this)">Partidos</button>' +
                '<button class="cmsc-tab" id="cmsc-tab-jugadores" onclick="cmScCambiarTab(\'jugadores\',this)">Jugadores</button>' +
                '<button class="cmsc-tab" id="cmsc-tab-rivales" onclick="cmScCambiarTab(\'rivales\',this)">Rivales</button>' +
                
                '<button class="cmsc-tab" id="cmsc-tab-gastos" onclick="cmScCambiarTab(\'gastos\',this)">Gastos</button>' +
            '</div>' +
            '<div id="cmsc-tab-content"></div>' +
        '</div>' +
    '</div>';
}


// ========== CAMBIO DE PESTANA ==========
function cmScCambiarTab(tab, btn) {
    cmScTabActiva = tab;
    cmScPartidoActual = null;
    document.querySelectorAll('.cmsc-tab').forEach(function(t) { t.classList.remove('active'); });
    if (btn) { btn.classList.add('active'); }
    else { var el = document.getElementById('cmsc-tab-' + tab); if (el) el.classList.add('active'); }

    var cont = document.getElementById('cmsc-tab-content');
    if (!cont) return;

    if (tab === 'partidos')   { cmScTabPartidos(cont); return; }
    if (tab === 'jugadores')  { cmScTabJugadores(cont); return; }
    if (tab === 'rivales')    { cmScTabPlaceholder(cont, 'Rivales', 'Fichas tacticas de equipos rivales, jugadores clave y patrones de juego.'); return; }
    // Shortlists movido al modulo Director Deportivo
    if (tab === 'gastos')     { cmScTabGastos(cont); return; }
}

function cmScTabPlaceholder(cont, titulo, desc) {
    cont.innerHTML =
        '<div class="cmsc-empty">' +
            '<div class="icon">&#9898;</div>' +
            '<h3>' + cmScEsc(titulo) + '</h3>' +
            '<p>' + cmScEsc(desc) + '</p>' +
            '<div style="display:inline-block;margin-top:14px;background:#1e293b;border:1px solid #334155;color:#60a5fa;font-size:12px;padding:6px 14px;border-radius:8px">' +
                'En desarrollo' +
            '</div>' +
        '</div>';
}


// ============================================================
// TAB 1: PARTIDOS (match-centric)
// ============================================================

async function cmScTabPartidos(cont) {
    cont.innerHTML = '<div class="cmsc-empty"><div class="icon">&#8987;</div><p>Cargando partidos...</p></div>';
    await cmScCargarMiembros();
    await cmScCargarPartidos();
}

async function cmScCargarMiembros() {
    try {
        var res = await supabaseClient.from('club_members')
            .select('id, display_name, email, wp_user_id')
            .eq('club_id', clubId)
            .eq('active', true)
            .order('display_name');
        cmScMiembros = res.data || [];
    } catch (e) { console.error('cmScCargarMiembros:', e); }
}

async function cmScCargarPartidos() {
    try {
        var res = await supabaseClient.from('cm_sc_matches')
            .select('*')
            .eq('club_id', clubId)
            .eq('archived', false)
            .order('match_date', { ascending: false });
        if (res.error) throw res.error;
        cmScPartidos = res.data || [];
        cmScRenderPartidos();
    } catch (e) {
        console.error('cmScCargarPartidos:', e);
        var cont = document.getElementById('cmsc-tab-content');
        if (cont) cont.innerHTML = '<div class="cmsc-empty"><div class="icon">&#9888;</div><p>Error al cargar partidos</p></div>';
    }
}

function cmScRenderPartidos() {
    var cont = document.getElementById('cmsc-tab-content');
    if (!cont) return;

    var filtrados = cmScPartidos;
    if (cmScFiltroEstado !== 'all') {
        filtrados = cmScPartidos.filter(function(p) { return p.status === cmScFiltroEstado; });
    }

    var puedeEditar = typeof cmPuedeEditar === 'function' ? cmPuedeEditar('scouting') : true;

    var h = '<div class="cmsc-toolbar">' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
            '<select id="cmsc-filtro-estado" onchange="cmScFiltroEstado=this.value;cmScRenderPartidos()">' +
                '<option value="all"' + (cmScFiltroEstado === 'all' ? ' selected' : '') + '>Todos (' + cmScPartidos.length + ')</option>' +
                '<option value="pending"' + (cmScFiltroEstado === 'pending' ? ' selected' : '') + '>Pendientes</option>' +
                '<option value="in_progress"' + (cmScFiltroEstado === 'in_progress' ? ' selected' : '') + '>En curso</option>' +
                '<option value="completed"' + (cmScFiltroEstado === 'completed' ? ' selected' : '') + '>Completados</option>' +
            '</select>' +
            '<span class="cmsc-contador"><strong>' + filtrados.length + '</strong> partido' + (filtrados.length !== 1 ? 's' : '') + '</span>' +
        '</div>';
    if (puedeEditar) {
        h += '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
            '<button class="cmsc-btn cmsc-btn-primary cmsc-btn-sm" onclick="cmScModalPartido()">+ Nuevo partido</button>' +
            '<button class="cmsc-btn cmsc-btn-secondary cmsc-btn-sm" onclick="cmScApiModal()">Buscar en API-Football</button>' +
        '</div>';
    }
    h += '</div>';

    if (filtrados.length === 0) {
        h += '<div class="cmsc-empty"><div class="icon">&#128270;</div>' +
            '<h3>Sin partidos</h3>' +
            '<p>' + (cmScFiltroEstado !== 'all' ? 'No hay partidos con este filtro.' : 'Anade el primer partido manualmente o busca en API-Football.') + '</p>' +
            '</div>';
    } else {
        h += '<div class="cmsc-match-grid">';
        filtrados.forEach(function(p) {
            var score = (p.score_home !== null && p.score_away !== null)
                ? p.score_home + ' - ' + p.score_away : 'vs';
            var statusLabel = { pending: 'Pendiente', in_progress: 'En curso', completed: 'Completado' }[p.status] || p.status;
            var methodIcons = { live: '&#127967;', tv: '&#128250;', video: '&#127909;' };
            var methodLabel = { live: 'En directo', tv: 'TV', video: 'Video' }[p.viewing_method] || p.viewing_method;
            var scoutName = cmScGetMiembroNombre(p.assigned_to);

            h += '<div class="cmsc-match-card" onclick="cmScAbrirPartido(\'' + p.id + '\')">' +
                '<div class="cmsc-match-teams">' +
                    '<div class="cmsc-match-team">' + cmScEsc(p.home_team) + '</div>' +
                    '<div class="cmsc-match-score">' + score + '</div>' +
                    '<div class="cmsc-match-team away">' + cmScEsc(p.away_team) + '</div>' +
                '</div>' +
                '<div class="cmsc-match-meta">' +
                    '<span>' + cmScFechaCorta(p.match_date) + '</span>' +
                    (p.competition ? '<span>\u00B7 ' + cmScEsc(p.competition) + '</span>' : '') +
                    '<span class="cmsc-badge cmsc-badge-' + p.status + '">' + statusLabel + '</span>' +
                    '<span class="cmsc-badge cmsc-badge-' + p.viewing_method + '">' + (methodIcons[p.viewing_method] || '') + ' ' + methodLabel + '</span>' +
                    (p.assigned_to ? '<span>Scout: ' + cmScEsc(scoutName) + '</span>' : '') +
                    (p.source === 'api' ? '<span class="cmsc-badge" style="background:#1e293b;color:#60a5fa">API</span>' : '') +
                '</div>' +
            '</div>';
        });
        h += '</div>';
    }

    cont.innerHTML = h;
}


// ============================================================
// MODAL: CREAR / EDITAR PARTIDO (MANUAL)
// ============================================================

function cmScModalPartido(matchId) {
    var p = null;
    cmScEditandoPartido = matchId || null;
    if (matchId) {
        p = cmScPartidos.find(function(x) { return x.id === matchId; });
        if (!p) return;
    }

    var titulo = p ? 'Editar partido' : 'Nuevo partido';

    var scoutOpts = '<option value="">\u2014 Sin asignar \u2014</option>';
    cmScMiembros.forEach(function(m) {
        var sel = (p && p.assigned_to === m.id) ? ' selected' : '';
        scoutOpts += '<option value="' + m.id + '"' + sel + '>' + cmScEsc(m.display_name || m.email) + '</option>';
    });

    var asignadoPorOpts = '<option value="">\u2014</option>';
    cmScMiembros.forEach(function(m) {
        var sel = (p && p.assigned_by === m.id) ? ' selected' : '';
        asignadoPorOpts += '<option value="' + m.id + '"' + sel + '>' + cmScEsc(m.display_name || m.email) + '</option>';
    });

    var overlay = document.createElement('div');
    overlay.className = 'cmsc-modal-overlay';
    overlay.id = 'cmsc-modal-partido';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML =
    '<div class="cmsc-modal">' +
        '<div class="cmsc-modal-header">' +
            '<h3>' + titulo + '</h3>' +
            '<button class="cmsc-modal-close" onclick="document.getElementById(\'cmsc-modal-partido\').remove()">\u2715</button>' +
        '</div>' +
        '<div class="cmsc-modal-body">' +
            '<div class="cmsc-form-row">' +
                '<div class="cmsc-form-group"><label>Equipo local *</label>' +
                    '<input id="cmsc-mp-home" value="' + cmScEsc(p ? p.home_team : '') + '" placeholder="Ej: CD Mirandes">' +
                '</div>' +
                '<div class="cmsc-form-group"><label>Equipo visitante *</label>' +
                    '<input id="cmsc-mp-away" value="' + cmScEsc(p ? p.away_team : '') + '" placeholder="Ej: Real Sociedad B">' +
                '</div>' +
            '</div>' +
            '<div class="cmsc-form-row-3">' +
                '<div class="cmsc-form-group"><label>Fecha *</label>' +
                    '<input type="date" id="cmsc-mp-date" value="' + (p ? p.match_date : '') + '">' +
                '</div>' +
                '<div class="cmsc-form-group"><label>Hora</label>' +
                    '<input type="time" id="cmsc-mp-time" value="' + (p && p.kick_off_time ? p.kick_off_time : '') + '">' +
                '</div>' +
                '<div class="cmsc-form-group"><label>Metodo *</label>' +
                    '<select id="cmsc-mp-method">' +
                        '<option value="live"' + (p && p.viewing_method === 'live' ? ' selected' : '') + '>En directo</option>' +
                        '<option value="tv"' + (p && p.viewing_method === 'tv' ? ' selected' : '') + '>TV</option>' +
                        '<option value="video"' + (p && p.viewing_method === 'video' ? ' selected' : '') + '>Video</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            '<div class="cmsc-form-row-3">' +
                '<div class="cmsc-form-group"><label>Goles local</label>' +
                    '<input type="number" id="cmsc-mp-score-h" min="0" value="' + (p && p.score_home !== null ? p.score_home : '') + '" placeholder="\u2014">' +
                '</div>' +
                '<div class="cmsc-form-group"><label>Goles visitante</label>' +
                    '<input type="number" id="cmsc-mp-score-a" min="0" value="' + (p && p.score_away !== null ? p.score_away : '') + '" placeholder="\u2014">' +
                '</div>' +
                '<div class="cmsc-form-group"><label>Estado</label>' +
                    '<select id="cmsc-mp-status">' +
                        '<option value="pending"' + (p && p.status === 'pending' ? ' selected' : '') + '>Pendiente</option>' +
                        '<option value="in_progress"' + (p && p.status === 'in_progress' ? ' selected' : '') + '>En curso</option>' +
                        '<option value="completed"' + (p && p.status === 'completed' ? ' selected' : '') + '>Completado</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            '<div class="cmsc-form-row">' +
                '<div class="cmsc-form-group"><label>Competicion</label>' +
                    '<input id="cmsc-mp-comp" value="' + cmScEsc(p ? p.competition : '') + '" placeholder="Ej: 2a RFEF Grupo 1">' +
                '</div>' +
                '<div class="cmsc-form-group"><label>Jornada</label>' +
                    '<input id="cmsc-mp-round" value="' + cmScEsc(p ? p.round : '') + '" placeholder="Ej: Jornada 28">' +
                '</div>' +
            '</div>' +
            '<div class="cmsc-form-group"><label>Estadio</label>' +
                '<input id="cmsc-mp-venue" value="' + cmScEsc(p ? p.venue : '') + '" placeholder="Ej: Estadio Municipal de Anduva">' +
            '</div>' +
            '<div class="cmsc-form-row">' +
                '<div class="cmsc-form-group"><label>Scout asignado</label>' +
                    '<select id="cmsc-mp-scout">' + scoutOpts + '</select>' +
                '</div>' +
                '<div class="cmsc-form-group"><label>Asignado por (DD)</label>' +
                    '<select id="cmsc-mp-assigner">' + asignadoPorOpts + '</select>' +
                '</div>' +
            '</div>' +
            '<div class="cmsc-form-group"><label>Notas / observaciones tacticas</label>' +
                '<textarea id="cmsc-mp-notes" placeholder="Observaciones generales del partido...">' + cmScEsc(p ? p.notes : '') + '</textarea>' +
            '</div>' +
        '</div>' +
        '<div class="cmsc-modal-footer">' +
            '<button class="cmsc-btn cmsc-btn-secondary" onclick="document.getElementById(\'cmsc-modal-partido\').remove()">Cancelar</button>' +
            '<button class="cmsc-btn cmsc-btn-primary" onclick="cmScGuardarPartido()">Guardar</button>' +
        '</div>' +
    '</div>';

    document.body.appendChild(overlay);
}

async function cmScGuardarPartido() {
    var homeTeam = (document.getElementById('cmsc-mp-home').value || '').trim();
    var awayTeam = (document.getElementById('cmsc-mp-away').value || '').trim();
    var matchDate = document.getElementById('cmsc-mp-date').value;

    if (!homeTeam || !awayTeam || !matchDate) {
        showToast('Completa equipo local, visitante y fecha');
        return;
    }

    var scoreH = document.getElementById('cmsc-mp-score-h').value;
    var scoreA = document.getElementById('cmsc-mp-score-a').value;

    var datos = {
        club_id: clubId,
        home_team: homeTeam,
        away_team: awayTeam,
        match_date: matchDate,
        kick_off_time: document.getElementById('cmsc-mp-time').value || null,
        viewing_method: document.getElementById('cmsc-mp-method').value,
        score_home: scoreH !== '' ? parseInt(scoreH) : null,
        score_away: scoreA !== '' ? parseInt(scoreA) : null,
        status: document.getElementById('cmsc-mp-status').value,
        competition: document.getElementById('cmsc-mp-comp').value || null,
        round: document.getElementById('cmsc-mp-round').value || null,
        venue: document.getElementById('cmsc-mp-venue').value || null,
        assigned_to: document.getElementById('cmsc-mp-scout').value || null,
        assigned_by: document.getElementById('cmsc-mp-assigner').value || null,
        notes: document.getElementById('cmsc-mp-notes').value || null,
        updated_at: new Date().toISOString()
    };

    try {
        if (cmScEditandoPartido) {
            var res = await supabaseClient.from('cm_sc_matches')
                .update(datos).eq('id', cmScEditandoPartido);
            if (res.error) throw res.error;
            showToast('Partido actualizado');
        } else {
            datos.created_by = cmScGetMiMiembroId();
            var res = await supabaseClient.from('cm_sc_matches')
                .insert(datos).select().single();
            if (res.error) throw res.error;
            showToast('Partido creado');
        }

        var modal = document.getElementById('cmsc-modal-partido');
        if (modal) modal.remove();
        await cmScCargarPartidos();
    } catch (e) {
        console.error('cmScGuardarPartido:', e);
        showToast('Error: ' + (e.message || e));
    }
}

async function cmScArchivarPartido(matchId) {
    if (!confirm('Archivar este partido? No se eliminara, pero dejara de verse en la lista.')) return;
    try {
        var res = await supabaseClient.from('cm_sc_matches')
            .update({ archived: true, archived_at: new Date().toISOString() })
            .eq('id', matchId);
        if (res.error) throw res.error;
        showToast('Partido archivado');
        cmScPartidoActual = null;
        await cmScCargarPartidos();
    } catch (e) {
        showToast('Error: ' + (e.message || e));
    }
}


// ============================================================
// DETALLE DE PARTIDO + HIGHLIGHTS
// ============================================================

async function cmScAbrirPartido(matchId) {
    cmScPartidoActual = cmScPartidos.find(function(p) { return p.id === matchId; });
    if (!cmScPartidoActual) return;

    var cont = document.getElementById('cmsc-tab-content');
    if (!cont) return;
    cont.innerHTML = '<div class="cmsc-empty"><div class="icon">&#8987;</div><p>Cargando detalle...</p></div>';

    try {
        var res = await supabaseClient.from('cm_sc_match_highlights')
            .select('*')
            .eq('match_id', matchId)
            .eq('archived', false)
            .order('created_at', { ascending: true });
        cmScHighlights = res.data || [];
    } catch (e) {
        console.error('cmScAbrirPartido highlights:', e);
        cmScHighlights = [];
    }

    cmScRenderDetalle();
}

function cmScRenderDetalle() {
    var cont = document.getElementById('cmsc-tab-content');
    if (!cont || !cmScPartidoActual) return;
    var p = cmScPartidoActual;
    var puedeEditar = typeof cmPuedeEditar === 'function' ? cmPuedeEditar('scouting') : true;

    var score = (p.score_home !== null && p.score_away !== null)
        ? p.score_home + ' - ' + p.score_away : 'Sin resultado';
    var statusLabel = { pending: 'Pendiente', in_progress: 'En curso', completed: 'Completado' }[p.status] || p.status;
    var methodLabel = { live: 'En directo', tv: 'TV', video: 'Video' }[p.viewing_method] || '';

    var h = '<div class="cmsc-detail-header">' +
        '<button class="cmsc-detail-back" onclick="cmScPartidoActual=null;cmScRenderPartidos()">\u2190 Volver a partidos</button>' +
        '<div style="display:flex;gap:8px">';
    if (puedeEditar) {
        h += '<button class="cmsc-btn cmsc-btn-secondary cmsc-btn-sm" onclick="cmScModalPartido(\'' + p.id + '\')">Editar</button>' +
             '<button class="cmsc-btn cmsc-btn-danger cmsc-btn-sm" onclick="cmScArchivarPartido(\'' + p.id + '\')">Archivar</button>';
    }
    h += '</div></div>';

    h += '<div class="cmsc-detail-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
            '<div>' +
                '<div style="font-size:18px;font-weight:700;color:#f1f5f9">' + cmScEsc(p.home_team) + ' <span style="color:#f59e0b">' + score + '</span> ' + cmScEsc(p.away_team) + '</div>' +
                '<div style="color:#94a3b8;font-size:12px;margin-top:4px">' +
                    cmScFechaCorta(p.match_date) +
                    (p.kick_off_time ? ' \u00B7 ' + p.kick_off_time.substring(0, 5) : '') +
                    (p.competition ? ' \u00B7 ' + cmScEsc(p.competition) : '') +
                    (p.round ? ' \u00B7 ' + cmScEsc(p.round) : '') +
                    (p.venue ? ' \u00B7 ' + cmScEsc(p.venue) : '') +
                '</div>' +
            '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
                '<span class="cmsc-badge cmsc-badge-' + p.status + '">' + statusLabel + '</span>' +
                '<span class="cmsc-badge cmsc-badge-' + p.viewing_method + '">' + methodLabel + '</span>' +
                (p.source === 'api' ? '<span class="cmsc-badge" style="background:#1e293b;color:#60a5fa">API</span>' : '') +
            '</div>' +
        '</div>' +
        (p.assigned_to ? '<div style="color:#94a3b8;font-size:12px;margin-top:8px">Scout: <strong style="color:#e2e8f0">' + cmScEsc(cmScGetMiembroNombre(p.assigned_to)) + '</strong>' +
            (p.assigned_by ? ' \u00B7 Asignado por: ' + cmScEsc(cmScGetMiembroNombre(p.assigned_by)) : '') + '</div>' : '') +
        (p.notes ? '<div style="color:#cbd5e1;font-size:13px;margin-top:10px;padding-top:10px;border-top:1px solid #334155;line-height:1.6">' + cmScEsc(p.notes).replace(/\n/g, '<br>') + '</div>' : '') +
    '</div>';

    h += '<div class="cmsc-detail-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
            '<h4 style="margin:0;color:#f1f5f9;font-size:15px">Jugadores destacados <span class="cmsc-tab-badge">' + cmScHighlights.length + '</span></h4>';
    if (puedeEditar) {
        h += '<button class="cmsc-btn cmsc-btn-success cmsc-btn-sm" onclick="cmScModalHighlight()">+ Destacar jugador</button>';
    }
    h += '</div>';

    if (cmScHighlights.length === 0) {
        h += '<div style="text-align:center;color:#64748b;padding:30px 0;font-size:13px">Sin jugadores destacados. Anade el primero.</div>';
    } else {
        h += '<div class="cmsc-hl-list">';
        cmScHighlights.forEach(function(hl) {
            var tagLabel = { sign: 'Fichar seguro', watch: 'Seguir viendo', discard: 'Descartar' }[hl.tag] || hl.tag;

            h += '<div class="cmsc-hl-item">' +
                '<div class="cmsc-hl-info">' +
                    '<div class="cmsc-hl-name">' +
                        cmScEsc(hl.player_name) +
                        (hl.shirt_number ? ' <span style="color:#64748b">#' + hl.shirt_number + '</span>' : '') +
                        ' <span class="cmsc-badge cmsc-badge-' + hl.tag + '">' + tagLabel + '</span>' +
                    '</div>' +
                    '<div class="cmsc-hl-meta">' +
                        (hl.player_position ? cmScEsc(hl.player_position) + ' \u00B7 ' : '') +
                        (hl.player_club ? cmScEsc(hl.player_club) + ' \u00B7 ' : '') +
                        (hl.rating_quick ? 'Nota: ' + hl.rating_quick + '/10 \u00B7 ' : '') +
                        'Scout: ' + cmScEsc(cmScGetMiembroNombre(hl.scout_id)) +
                    '</div>' +
                    (hl.performance_notes ? '<div class="cmsc-hl-notes">' + cmScEsc(hl.performance_notes).replace(/\n/g, '<br>') + '</div>' : '') +
                '</div>';
            if (puedeEditar) {
                h += '<div class="cmsc-hl-actions">' +
                    '<button class="cmsc-btn cmsc-btn-secondary cmsc-btn-sm" onclick="cmScModalHighlight(\'' + hl.id + '\')">Editar</button>' +
                    '<button class="cmsc-btn cmsc-btn-danger cmsc-btn-sm" onclick="cmScArchivarHighlight(\'' + hl.id + '\')">\u2715</button>' +
                '</div>';
            }
            h += '</div>';
        });
        h += '</div>';
    }
    h += '</div>';

    // --- DATOS DE LA API (si el partido viene de API-Football) ---
    if (p.source === 'api' && p.api_data) {
        var apiData = p.api_data;

        // EVENTOS (goles, tarjetas, sustituciones)
        var events = apiData.events || [];
        if (events.length > 0) {
            h += '<div class="cmsc-detail-card">';
            h += '<h4 style="margin:0 0 12px;color:#f1f5f9;font-size:15px">Eventos del partido <span class="cmsc-tab-badge">' + events.length + '</span></h4>';
            h += '<div style="display:flex;flex-direction:column;gap:4px">';
            events.forEach(function(ev) {
                var iconMap = { Goal: '\u26BD', Card: (ev.detail === 'Red Card' ? '\u{1F7E5}' : '\u{1F7E8}'), subst: '\u{1F504}', Var: 'VAR' };
                var icon = iconMap[ev.type] || '\u25CF';
                var timeStr = ev.time ? ev.time.elapsed + "'" + (ev.time.extra ? '+' + ev.time.extra + "'" : '') : '';
                var teamColor = '#94a3b8';
                h += '<div style="display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:6px;background:#0f172a">' +
                    '<span style="color:#f59e0b;font-weight:600;min-width:40px;font-size:12px">' + timeStr + '</span>' +
                    '<span style="font-size:14px">' + icon + '</span>' +
                    '<div style="flex:1">' +
                        '<span style="color:#f1f5f9;font-size:13px;font-weight:600">' + cmScEsc(ev.player ? ev.player.name : '') + '</span>' +
                        (ev.assist && ev.assist.name ? '<span style="color:#64748b;font-size:11px;margin-left:6px">(asist: ' + cmScEsc(ev.assist.name) + ')</span>' : '') +
                        '<span style="color:#64748b;font-size:11px;margin-left:6px">' + cmScEsc(ev.team ? ev.team.name : '') + '</span>' +
                        (ev.detail ? '<span style="color:#94a3b8;font-size:11px;margin-left:6px">' + cmScEsc(ev.detail) + '</span>' : '') +
                    '</div>' +
                '</div>';
            });
            h += '</div></div>';
        }

        // ALINEACIONES
        var lineups = apiData.lineups || [];
        if (lineups.length > 0) {
            h += '<div class="cmsc-detail-card">';
            h += '<h4 style="margin:0 0 12px;color:#f1f5f9;font-size:15px">Alineaciones</h4>';
            h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
            lineups.forEach(function(lineup) {
                h += '<div>';
                h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
                    (lineup.team && lineup.team.logo ? '<img src="' + lineup.team.logo + '" style="width:22px;height:22px;object-fit:contain">' : '') +
                    '<span style="color:#f1f5f9;font-weight:700;font-size:14px">' + cmScEsc(lineup.team ? lineup.team.name : '') + '</span>' +
                    (lineup.formation ? '<span style="color:#60a5fa;font-size:12px;font-weight:600">' + cmScEsc(lineup.formation) + '</span>' : '') +
                '</div>';
                // Titulares
                h += '<div style="font-size:11px;color:#64748b;font-weight:600;margin-bottom:4px">TITULARES</div>';
                var starters = lineup.startXI || [];
                starters.forEach(function(item) {
                    var pl = item.player || {};
                    h += '<div style="display:flex;align-items:center;gap:6px;padding:3px 0">' +
                        '<span style="color:#f59e0b;font-size:12px;font-weight:600;min-width:22px">' + (pl.number || '') + '</span>' +
                        '<span style="color:#e2e8f0;font-size:12px">' + cmScEsc(pl.name || '') + '</span>' +
                        '<span style="color:#64748b;font-size:10px">' + cmScEsc(pl.pos || '') + '</span>' +
                    '</div>';
                });
                // Suplentes
                var subs = lineup.substitutes || [];
                if (subs.length > 0) {
                    h += '<div style="font-size:11px;color:#64748b;font-weight:600;margin:8px 0 4px">SUPLENTES</div>';
                    subs.forEach(function(item) {
                        var pl = item.player || {};
                        h += '<div style="display:flex;align-items:center;gap:6px;padding:3px 0">' +
                            '<span style="color:#94a3b8;font-size:12px;min-width:22px">' + (pl.number || '') + '</span>' +
                            '<span style="color:#94a3b8;font-size:12px">' + cmScEsc(pl.name || '') + '</span>' +
                            '<span style="color:#475569;font-size:10px">' + cmScEsc(pl.pos || '') + '</span>' +
                        '</div>';
                    });
                }
                // Entrenador
                if (lineup.coach) {
                    h += '<div style="margin-top:8px;padding-top:6px;border-top:1px solid #334155">' +
                        '<span style="color:#64748b;font-size:11px">Entrenador: </span>' +
                        '<span style="color:#e2e8f0;font-size:12px;font-weight:600">' + cmScEsc(lineup.coach.name || '') + '</span>' +
                    '</div>';
                }
                h += '</div>';
            });
            h += '</div></div>';
        }

        // ESTADISTICAS
        var stats = apiData.statistics || [];
        if (stats.length >= 2) {
            h += '<div class="cmsc-detail-card">';
            h += '<h4 style="margin:0 0 12px;color:#f1f5f9;font-size:15px">Estadisticas del partido</h4>';
            var homeStats = stats[0].statistics || [];
            var awayStats = stats[1].statistics || [];
            var homeName = stats[0].team ? stats[0].team.name : 'Local';
            var awayName = stats[1].team ? stats[1].team.name : 'Visitante';
            h += '<div style="display:grid;grid-template-columns:60px 1fr 100px 1fr 60px;gap:4px;align-items:center">';
            homeStats.forEach(function(hs, idx) {
                var as = awayStats[idx] || {};
                var hVal = hs.value != null ? hs.value : 0;
                var aVal = as.value != null ? as.value : 0;
                var hNum = parseFloat(String(hVal).replace('%', '')) || 0;
                var aNum = parseFloat(String(aVal).replace('%', '')) || 0;
                var total = hNum + aNum || 1;
                var hPct = Math.round((hNum / total) * 100);
                var aPct = 100 - hPct;
                var statName = hs.type || '';
                var statNameEs = {
                    'Ball Possession': 'Posesion', 'Total Shots': 'Tiros totales', 'Shots on Goal': 'Tiros a puerta',
                    'Shots off Goal': 'Tiros fuera', 'Corner Kicks': 'Corners', 'Offsides': 'Fueras de juego',
                    'Fouls': 'Faltas', 'Yellow Cards': 'Amarillas', 'Red Cards': 'Rojas',
                    'Goalkeeper Saves': 'Paradas', 'Total passes': 'Pases totales', 'Passes accurate': 'Pases completados',
                    'Passes %': '% Pases', 'Blocked Shots': 'Tiros bloqueados', 'Shots insidebox': 'Tiros dentro area',
                    'Shots outsidebox': 'Tiros fuera area', 'expected_goals': 'xG'
                }[statName] || statName;

                h += '<span style="text-align:right;color:#f1f5f9;font-size:12px;font-weight:600">' + hVal + '</span>';
                h += '<div style="height:6px;background:#334155;border-radius:3px;overflow:hidden;direction:rtl"><div style="height:100%;width:' + hPct + '%;background:#3b82f6;border-radius:3px"></div></div>';
                h += '<span style="text-align:center;color:#94a3b8;font-size:11px;font-weight:600">' + cmScEsc(statNameEs) + '</span>';
                h += '<div style="height:6px;background:#334155;border-radius:3px;overflow:hidden"><div style="height:100%;width:' + aPct + '%;background:#ef4444;border-radius:3px"></div></div>';
                h += '<span style="color:#f1f5f9;font-size:12px;font-weight:600">' + aVal + '</span>';
            });
            h += '</div></div>';
        }
    }

    cont.innerHTML = h;
}


// ============================================================
// MODAL: DESTACAR JUGADOR (HIGHLIGHT)
// Flujo: buscar jugador existente O crear nuevo -> siempre vinculado
// ============================================================

var cmScHlJugadorSeleccionado = null; // player_id seleccionado para el highlight

async function cmScEnsureJugadoresCargados() {
    if (cmScJugadores.length === 0) {
        try {
            var res = await supabaseClient.from('cm_sc_players')
                .select('id, name, current_club, position_primary, nationality')
                .eq('club_id', clubId).eq('archived', false)
                .order('name');
            cmScJugadores = res.data || [];
        } catch (e) { console.error('cargar jugadores:', e); }
    }
}

function cmScModalHighlight(hlId) {
    var hl = null;
    if (hlId) {
        hl = cmScHighlights.find(function(x) { return x.id === hlId; });
        if (!hl) return;
    }

    cmScHlJugadorSeleccionado = hl ? hl.player_id : null;

    // Asegurar que tenemos jugadores cargados
    cmScEnsureJugadoresCargados().then(function() {
        cmScRenderModalHighlight(hl);
    });
}

function cmScRenderModalHighlight(hl) {
    var titulo = hl ? 'Editar jugador destacado' : 'Destacar jugador';
    var esEdicion = !!hl;

    // Construir lista de jugadores existentes para buscar
    var jugadoresHtml = '';
    if (!esEdicion) {
        jugadoresHtml = '<div class="cmsc-form-group">' +
            '<label>Buscar jugador existente</label>' +
            '<input id="cmsc-hl-search" placeholder="Escribe nombre para buscar..." oninput="cmScHlFiltrarJugadores()" style="margin-bottom:8px">' +
            '<div id="cmsc-hl-search-results" style="max-height:150px;overflow-y:auto"></div>' +
        '</div>';

        // Jugadores de la alineacion API (si hay)
        if (cmScPartidoActual && cmScPartidoActual.source === 'api' && cmScPartidoActual.api_data && cmScPartidoActual.api_data.lineups) {
            var lineups = cmScPartidoActual.api_data.lineups;
            if (lineups.length > 0) {
                jugadoresHtml += '<div class="cmsc-form-group">' +
                    '<label>O seleccionar de la alineacion</label>' +
                    '<select id="cmsc-hl-lineup-select" onchange="cmScHlSeleccionarDeAlineacion()" style="font-size:13px">' +
                    '<option value="">-- Elegir de alineacion --</option>';
                lineups.forEach(function(lineup) {
                    var teamName = lineup.team ? lineup.team.name : '';
                    jugadoresHtml += '<optgroup label="' + cmScEsc(teamName) + '">';
                    var allPlayers = (lineup.startXI || []).concat(lineup.substitutes || []);
                    allPlayers.forEach(function(item) {
                        var pl = item.player || {};
                        var val = JSON.stringify({ name: pl.name || '', club: teamName, pos: pl.pos || '', number: pl.number || '' }).replace(/"/g, '&quot;');
                        jugadoresHtml += '<option value="' + val + '">' + (pl.number ? '#' + pl.number + ' ' : '') + cmScEsc(pl.name || '') + '</option>';
                    });
                    jugadoresHtml += '</optgroup>';
                });
                jugadoresHtml += '</select></div>';
            }
        }

        jugadoresHtml += '<div style="border-top:1px solid #334155;padding-top:10px;margin-top:6px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">' +
            '<div id="cmsc-hl-selected-info" style="color:#4ade80;font-size:13px;font-weight:600;min-height:20px">' +
                (cmScHlJugadorSeleccionado ? 'Jugador vinculado' : 'Ningun jugador seleccionado') +
            '</div>' +
            '<button class="cmsc-btn cmsc-btn-primary cmsc-btn-sm" id="cmsc-hl-btn-crear" onclick="cmScHlCrearFichaCompleta()"' +
                (cmScHlJugadorSeleccionado ? ' style="display:none"' : '') +
            '>Crear ficha completa</button>' +
        '</div>';
    }

    var overlay = document.createElement('div');
    overlay.className = 'cmsc-modal-overlay';
    overlay.id = 'cmsc-modal-hl';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML =
    '<div class="cmsc-modal" style="max-width:580px">' +
        '<div class="cmsc-modal-header">' +
            '<h3>' + titulo + '</h3>' +
            '<button class="cmsc-modal-close" onclick="document.getElementById(\x27cmsc-modal-hl\x27).remove()">\u2715</button>' +
        '</div>' +
        '<div class="cmsc-modal-body">' +
            jugadoresHtml +
            '<div class="cmsc-form-row">' +
                '<div class="cmsc-form-group"><label>Nombre del jugador *</label>' +
                    '<input id="cmsc-hl-name" value="' + cmScEsc(hl ? hl.player_name : '') + '" placeholder="Nombre completo">' +
                '</div>' +
                '<div class="cmsc-form-group"><label>Club actual *</label>' +
                    '<input id="cmsc-hl-club" value="' + cmScEsc(hl ? hl.player_club : '') + '" placeholder="Club actual">' +
                '</div>' +
            '</div>' +
            '<div class="cmsc-form-row">' +
                '<div class="cmsc-form-group"><label>Dorsal</label>' +
                    '<input type="number" id="cmsc-hl-number" min="1" max="99" value="' + (hl && hl.shirt_number ? hl.shirt_number : '') + '">' +
                '</div>' +
                '<div class="cmsc-form-group"><label>Nota rapida (1-10) *</label>' +
                    '<input type="number" id="cmsc-hl-rating" min="1" max="10" step="0.5" value="' + (hl && hl.rating_quick ? hl.rating_quick : '') + '">' +
                '</div>' +
            '</div>' +
            '<div class="cmsc-form-row">' +
                '<div class="cmsc-form-group"><label>Formacion del equipo *</label>' +
                    '<select id="cmsc-hl-formation" onchange="cmScHlFormacionCambiada()">' +
                        '<option value="">-- Seleccionar --</option>' +
                        '<option value="1-4-3-3">1-4-3-3</option><option value="1-4-4-2">1-4-4-2</option>' +
                        '<option value="1-3-5-2">1-3-5-2</option><option value="1-4-2-3-1">1-4-2-3-1</option>' +
                        '<option value="1-3-4-3">1-3-4-3</option><option value="1-4-1-4-1">1-4-1-4-1</option>' +
                        '<option value="1-5-3-2">1-5-3-2</option><option value="1-4-3-2-1">1-4-3-2-1</option>' +
                    '</select>' +
                '</div>' +
                '<div class="cmsc-form-group"><label>Posicion en el sistema *</label>' +
                    '<select id="cmsc-hl-obs-position"><option value="">-- Seleccionar formacion --</option></select>' +
                '</div>' +
            '</div>' +
            '<div class="cmsc-form-group"><label>Etiqueta *</label>' +
                '<select id="cmsc-hl-tag">' +
                    '<option value="watch"' + (hl && hl.tag === 'watch' ? ' selected' : '') + '>Seguir viendo</option>' +
                    '<option value="sign"' + (hl && hl.tag === 'sign' ? ' selected' : '') + '>Fichar seguro</option>' +
                    '<option value="discard"' + (hl && hl.tag === 'discard' ? ' selected' : '') + '>Descartar seguro</option>' +
                '</select>' +
            '</div>' +
            '<div class="cmsc-form-group"><label>Notas sobre su actuacion</label>' +
                '<textarea id="cmsc-hl-notes" placeholder="Descripcion de lo observado...">' + cmScEsc(hl ? hl.performance_notes : '') + '</textarea>' +
            '</div>' +
        '</div>' +
        '<div class="cmsc-modal-footer">' +
            '<button class="cmsc-btn cmsc-btn-secondary" onclick="document.getElementById(\x27cmsc-modal-hl\x27).remove()">Cancelar</button>' +
            '<button class="cmsc-btn cmsc-btn-success" onclick="cmScGuardarHighlight(\x27' + (hl ? hl.id : '') + '\x27)">Guardar</button>' +
        '</div>' +
    '</div>';
    document.body.appendChild(overlay);

    // Bind formation change event properly
    setTimeout(function() {
        var formSel = document.getElementById('cmsc-hl-formation');
        if (formSel) {
            formSel.addEventListener('change', cmScHlFormacionCambiada);
            // If formation already has a value, populate positions
            if (formSel.value) cmScHlFormacionCambiada();
        }
    }, 50);
}

// Abrir la ficha completa de jugador (misma que Tab Jugadores) desde el highlight
var cmScHlCallbackPendiente = false;

function cmScHlCrearFichaCompleta() {
    // Recoger nombre y club del highlight para pre-rellenar
    var name = document.getElementById('cmsc-hl-name') ? document.getElementById('cmsc-hl-name').value : '';
    var club = document.getElementById('cmsc-hl-club') ? document.getElementById('cmsc-hl-club').value : '';

    cmScHlCallbackPendiente = true;
    cmScModalJugador(); // Abre la ficha estandar

    // Pre-rellenar nombre y club si los tenemos
    setTimeout(function() {
        if (name && document.getElementById('cmsc-jg-name')) document.getElementById('cmsc-jg-name').value = name;
        if (club && document.getElementById('cmsc-jg-club')) document.getElementById('cmsc-jg-club').value = club;
    }, 100);
}

// Buscar jugador existente mientras se escribe
function cmScHlFiltrarJugadores() {
    var q = (document.getElementById('cmsc-hl-search').value || '').trim().toLowerCase();
    var cont = document.getElementById('cmsc-hl-search-results');
    if (!cont) return;
    if (q.length < 2) { cont.innerHTML = ''; return; }

    var resultados = cmScJugadores.filter(function(j) {
        return j.name.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 8);

    if (resultados.length === 0) {
        cont.innerHTML = '<div style="color:#64748b;font-size:12px;padding:6px 0">No encontrado \u2014 se creara ficha nueva al guardar</div>';
        return;
    }

    var h = '';
    resultados.forEach(function(j) {
        h += '<div onclick="cmScHlSeleccionarJugador(\x27' + j.id + '\x27)" ' +
            'style="padding:6px 10px;cursor:pointer;border-radius:6px;font-size:13px;color:#e2e8f0;display:flex;justify-content:space-between;align-items:center" ' +
            'onmouseover="this.style.background=\x27#334155\x27" onmouseout="this.style.background=\x27none\x27">' +
            '<span><strong>' + cmScEsc(j.name) + '</strong>' +
                (j.position_primary ? ' <span style="color:#64748b">(' + cmScEsc(j.position_primary) + ')</span>' : '') +
            '</span>' +
            (j.current_club ? '<span style="color:#94a3b8;font-size:11px">' + cmScEsc(j.current_club) + '</span>' : '') +
        '</div>';
    });
    cont.innerHTML = h;
}

// Seleccionar jugador existente de la busqueda
function cmScHlSeleccionarJugador(playerId) {
    var j = cmScJugadores.find(function(x) { return x.id === playerId; });
    if (!j) return;
    cmScHlJugadorSeleccionado = playerId;

    document.getElementById('cmsc-hl-name').value = j.name;
    document.getElementById('cmsc-hl-club').value = j.current_club || '';
    // position se selecciona via formacion
    document.getElementById('cmsc-hl-search').value = '';
    document.getElementById('cmsc-hl-search-results').innerHTML = '';

    var info = document.getElementById('cmsc-hl-selected-info');
    if (info) info.innerHTML = '\u2705 Vinculado a: <strong>' + cmScEsc(j.name) + '</strong> (ficha existente)';
    // Ocultar boton crear cuando se selecciona jugador existente
    var btnCrear = document.getElementById('cmsc-hl-btn-crear');
    if (btnCrear) btnCrear.style.display = 'none';
}

// Seleccionar jugador de la alineacion API
function cmScHlSeleccionarDeAlineacion() {
    var sel = document.getElementById('cmsc-hl-lineup-select');
    if (!sel || !sel.value) return;
    try {
        var data = JSON.parse(sel.value);
        document.getElementById('cmsc-hl-name').value = data.name || '';
        document.getElementById('cmsc-hl-club').value = data.club || '';
        // position se selecciona via formacion
        document.getElementById('cmsc-hl-number').value = data.number || '';

        // Buscar si ya tiene ficha
        var existente = cmScJugadores.find(function(j) { return j.name.toLowerCase() === (data.name || '').toLowerCase(); });
        if (existente) {
            cmScHlJugadorSeleccionado = existente.id;
            var info = document.getElementById('cmsc-hl-selected-info');
            if (info) info.innerHTML = '\u2705 Vinculado a ficha existente: <strong>' + cmScEsc(existente.name) + '</strong>';
        } else {
            cmScHlJugadorSeleccionado = null;
            var info = document.getElementById('cmsc-hl-selected-info');
            if (info) info.innerHTML = 'Jugador nuevo \u2014 se creara ficha al guardar';
        }
    } catch (e) { console.warn('cmScHlSeleccionarDeAlineacion:', e); }
}

// Cambiar posiciones segun formacion seleccionada
function cmScHlFormacionCambiada() {
    var formEl = document.getElementById('cmsc-hl-formation');
    var sel = document.getElementById('cmsc-hl-obs-position');
    if (!formEl || !sel) { console.warn('cmScHlFormacionCambiada: elementos no encontrados'); return; }
    var form = formEl.value;
    if (!form || !CMSC_POSICIONES_MAP[form]) {
        sel.innerHTML = '<option value="">-- Seleccionar formacion --</option>';
        return;
    }
    var posMap = CMSC_POSICIONES_MAP[form];
    var opts = '<option value="">-- Seleccionar posicion --</option>';
    for (var i = 0; i < posMap.length; i++) {
        var p = posMap[i];
        var label = CMSC_POS_NOMBRES[p] || p;
        opts += '<option value="' + p + '">' + p + ' - ' + label + '</option>';
    }
    sel.innerHTML = opts;
}

// Guardar highlight — siempre vinculado a cm_sc_players
async function cmScGuardarHighlight(hlId) {
    var playerName = (document.getElementById('cmsc-hl-name').value || '').trim();
    if (!playerName) { showToast('El nombre del jugador es obligatorio'); return; }

    var ratingVal = document.getElementById('cmsc-hl-rating').value;
    var shirtVal = document.getElementById('cmsc-hl-number').value;
    var scoutId = cmScGetMiMiembroId();
    if (!scoutId) { showToast('No se pudo identificar tu perfil de scout'); return; }

    // Validar formacion y posicion obligatorias
    if (!hlId) {
        var obsF = document.getElementById('cmsc-hl-formation') ? document.getElementById('cmsc-hl-formation').value : '';
        var obsP = document.getElementById('cmsc-hl-obs-position') ? document.getElementById('cmsc-hl-obs-position').value : '';
        if (!obsF || !obsP) {
            showToast('La formacion y la posicion son obligatorias');
            return;
        }
    }

    var playerId = cmScHlJugadorSeleccionado;

    // Si no hay jugador seleccionado, debe crear ficha primero
    if (!playerId && !hlId) {
        showToast('Primero crea la ficha del jugador con el boton "Crear ficha completa"');
        return;
    }

    var obsFormation = document.getElementById('cmsc-hl-formation') ? document.getElementById('cmsc-hl-formation').value || null : null;
    var obsPosition = document.getElementById('cmsc-hl-obs-position') ? document.getElementById('cmsc-hl-obs-position').value || null : null;

    var datos = {
        club_id: clubId,
        match_id: cmScPartidoActual.id,
        player_id: playerId,
        player_name: playerName,
        player_club: document.getElementById('cmsc-hl-club').value || null,
        player_position: obsPosition || null,
        shirt_number: shirtVal ? parseInt(shirtVal) : null,
        rating_quick: ratingVal ? parseFloat(ratingVal) : null,
        tag: document.getElementById('cmsc-hl-tag').value,
        performance_notes: document.getElementById('cmsc-hl-notes').value || null,
        scout_id: scoutId,
        observed_position: obsPosition,
        observed_formation: obsFormation
    };

    try {
        if (hlId) {
            var res = await supabaseClient.from('cm_sc_match_highlights').update(datos).eq('id', hlId);
            if (res.error) throw res.error;
            showToast('Jugador actualizado');
        } else {
            var res = await supabaseClient.from('cm_sc_match_highlights').insert(datos).select().single();
            if (res.error) throw res.error;

            // Crear avistamiento (sighting) automaticamente
            if (playerId) {
                try {
                    await supabaseClient.from('cm_sc_player_sightings').upsert({
                        club_id: clubId,
                        player_id: playerId,
                        match_id: cmScPartidoActual.id,
                        scout_id: scoutId,
                        sighting_date: cmScPartidoActual.match_date || new Date().toISOString().split('T')[0],
                        tag: datos.tag,
                        rating_quick: datos.rating_quick,
                        notes: datos.performance_notes,
                        observed_position: obsPosition,
                        observed_formation: obsFormation
                    }, { onConflict: 'player_id,match_id,scout_id' });

                    // Actualizar contadores del jugador
                    await cmScActualizarContadoresJugador(playerId);
                } catch (e) { console.warn('Sighting:', e); }
            }

            showToast('Jugador destacado y vinculado a ficha');
        }

        var modal = document.getElementById('cmsc-modal-hl');
        if (modal) modal.remove();
        cmScHlJugadorSeleccionado = null;
        await cmScAbrirPartido(cmScPartidoActual.id);
    } catch (e) {
        console.error('cmScGuardarHighlight:', e);
        showToast('Error: ' + (e.message || e));
    }
}

// Actualizar contadores de avistamientos del jugador
async function cmScActualizarContadoresJugador(playerId) {
    try {
        var res = await supabaseClient.from('cm_sc_player_sightings')
            .select('scout_id, tag').eq('player_id', playerId).eq('archived', false);
        var sightings = res.data || [];
        var scoutIds = [];
        var signCount = 0;
        sightings.forEach(function(s) {
            if (scoutIds.indexOf(s.scout_id) === -1) scoutIds.push(s.scout_id);
            if (s.tag === 'sign') signCount++;
        });
        await supabaseClient.from('cm_sc_players').update({
            sightings_count: sightings.length,
            scouts_count: scoutIds.length,
            sign_count: signCount,
            updated_at: new Date().toISOString()
        }).eq('id', playerId);
    } catch (e) { console.error('contadores:', e); }
}

async function cmScArchivarHighlight(hlId) {
    if (!confirm('Quitar este jugador de los destacados?')) return;
    try {
        var res = await supabaseClient.from('cm_sc_match_highlights')
            .update({ archived: true, archived_at: new Date().toISOString() })
            .eq('id', hlId);
        if (res.error) throw res.error;
        showToast('Jugador quitado');
        await cmScAbrirPartido(cmScPartidoActual.id);
    } catch (e) {
        showToast('Error: ' + (e.message || e));
    }
}


// ============================================================
// TAB 2: JUGADORES (base de datos de jugadores scouted)
// ============================================================

var cmScJugadores = [];
var cmScJugadorActual = null;
var cmScJugadorSightings = [];
var cmScFiltroJugPipeline = 'all';
var cmScFiltroJugPosition = 'all';

async function cmScTabJugadores(cont) {
    cont.innerHTML = '<div class="cmsc-empty"><div class="icon">&#8987;</div><p>Cargando jugadores...</p></div>';
    await cmScCargarMiembros();
    await cmScCargarJugadores();
}

async function cmScCargarJugadores() {
    try {
        var res = await supabaseClient.from('cm_sc_players')
            .select('*').eq('club_id', clubId).eq('archived', false)
            .order('updated_at', { ascending: false });
        if (res.error) throw res.error;
        cmScJugadores = res.data || [];
        cmScRenderJugadores();
    } catch (e) {
        console.error('cmScCargarJugadores:', e);
    }
}

function cmScRenderJugadores() {
    var cont = document.getElementById('cmsc-tab-content');
    if (!cont) return;
    var puedeEditar = typeof cmPuedeEditar === 'function' ? cmPuedeEditar('scouting') : true;

    var pipeLabels = { identified:'Identificado', observed:'Observado', tracking:'En seguimiento', contacted:'Contactado', signed:'Fichado', discarded:'Descartado' };
    var pipeBadges = { identified:'cmsc-badge-video', observed:'cmsc-badge-pending', tracking:'cmsc-badge-in_progress', contacted:'cmsc-badge-tv', signed:'cmsc-badge-completed', discarded:'cmsc-badge-discard' };
    var levelLabels = { differential:'Diferencial', good:'Buen nivel', developing:'En desarrollo' };
    var levelColors = { differential:'#4ade80', good:'#f59e0b', developing:'#94a3b8' };

    // Filtrar
    var filtrados = cmScJugadores;
    if (cmScFiltroJugPipeline !== 'all') {
        filtrados = filtrados.filter(function(j) { return j.pipeline_status === cmScFiltroJugPipeline; });
    }
    if (cmScFiltroJugPosition !== 'all') {
        filtrados = filtrados.filter(function(j) { return j.position_primary === cmScFiltroJugPosition; });
    }

    // Posiciones unicas para el filtro
    var posiciones = [];
    cmScJugadores.forEach(function(j) { if (j.position_primary && posiciones.indexOf(j.position_primary) === -1) posiciones.push(j.position_primary); });
    posiciones.sort();

    var h = '<div class="cmsc-toolbar">' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            '<select onchange="cmScFiltroJugPipeline=this.value;cmScRenderJugadores()">' +
                '<option value="all"' + (cmScFiltroJugPipeline === 'all' ? ' selected' : '') + '>Todos (' + cmScJugadores.length + ')</option>';
    Object.keys(pipeLabels).forEach(function(k) {
        var cnt = cmScJugadores.filter(function(j) { return j.pipeline_status === k; }).length;
        h += '<option value="' + k + '"' + (cmScFiltroJugPipeline === k ? ' selected' : '') + '>' + pipeLabels[k] + ' (' + cnt + ')</option>';
    });
    h += '</select>';
    if (posiciones.length > 0) {
        h += '<select onchange="cmScFiltroJugPosition=this.value;cmScRenderJugadores()">' +
            '<option value="all">Todas las posiciones</option>';
        posiciones.forEach(function(p) {
            h += '<option value="' + cmScEsc(p) + '"' + (cmScFiltroJugPosition === p ? ' selected' : '') + '>' + cmScEsc(p) + '</option>';
        });
        h += '</select>';
    }
    h += '<span class="cmsc-contador"><strong>' + filtrados.length + '</strong> jugador' + (filtrados.length !== 1 ? 'es' : '') + '</span>';
    h += '</div>';
    if (puedeEditar) {
        h += '<button class="cmsc-btn cmsc-btn-primary cmsc-btn-sm" onclick="cmScModalJugador()">+ Nuevo jugador</button>';
    }
    h += '</div>';

    if (filtrados.length === 0) {
        h += '<div class="cmsc-empty"><div class="icon">&#128100;</div>' +
            '<h3>Sin jugadores</h3><p>Anade jugadores desde los destacados de un partido o crea uno manualmente.</p></div>';
    } else {
        h += '<div class="cmsc-match-grid">';
        filtrados.forEach(function(j) {
            var levelColor = levelColors[j.level_auto] || '#64748b';
            h += '<div class="cmsc-match-card" onclick="cmScAbrirJugador(\x27' + j.id + '\x27)">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">' +
                    '<div style="flex:1">' +
                        '<div style="color:#f1f5f9;font-weight:700;font-size:15px">' + cmScEsc(j.name) + '</div>' +
                        '<div style="color:#94a3b8;font-size:12px;margin-top:2px">' +
                            (j.position_primary || '') +
                            (j.current_club ? ' \u00B7 ' + cmScEsc(j.current_club) : '') +
                            (j.nationality ? ' \u00B7 ' + cmScEsc(j.nationality) : '') +
                        '</div>' +
                    '</div>' +
                    '<div style="text-align:right">' +
                        (j.rating_overall ? '<div style="color:' + levelColor + ';font-weight:700;font-size:20px">' + j.rating_overall + '</div>' : '') +
                        '<span class="cmsc-badge ' + (pipeBadges[j.pipeline_status] || '') + '">' + (pipeLabels[j.pipeline_status] || j.pipeline_status) + '</span>' +
                    '</div>' +
                '</div>' +
                '<div style="color:#64748b;font-size:11px;margin-top:8px;display:flex;gap:12px">' +
                    (j.sightings_count ? '<span>' + j.sightings_count + ' avistamiento' + (j.sightings_count !== 1 ? 's' : '') + '</span>' : '') +
                    (j.scouts_count ? '<span>' + j.scouts_count + ' scout' + (j.scouts_count !== 1 ? 's' : '') + '</span>' : '') +
                    (j.sign_count ? '<span style="color:#4ade80">' + j.sign_count + ' "fichar"</span>' : '') +
                    (j.birth_date ? '<span>' + cmScCalcEdad(j.birth_date) + ' anos</span>' : '') +
                    (j.estimated_cost ? '<span>' + cmScEsc(j.estimated_cost) + '</span>' : '') +
                '</div>' +
            '</div>';
        });
        h += '</div>';
    }
    cont.innerHTML = h;
}

function cmScCalcEdad(birthDate) {
    if (!birthDate) return '';
    var hoy = new Date();
    var nac = new Date(birthDate + 'T12:00:00');
    var edad = hoy.getFullYear() - nac.getFullYear();
    var m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
}

// --- Modal crear/editar jugador ---
function cmScModalJugador(jugadorId) {
    var j = null;
    if (jugadorId) { j = cmScJugadores.find(function(x) { return x.id === jugadorId; }); if (!j) return; }
    var titulo = j ? 'Editar jugador' : 'Nuevo jugador scouted';

    var overlay = document.createElement('div');
    overlay.className = 'cmsc-modal-overlay';
    overlay.id = 'cmsc-modal-jugador';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML =
    '<div class="cmsc-modal" style="max-width:640px">' +
        '<div class="cmsc-modal-header">' +
            '<h3>' + titulo + '</h3>' +
            '<button class="cmsc-modal-close" onclick="document.getElementById(\x27cmsc-modal-jugador\x27).remove()">\u2715</button>' +
        '</div>' +
        '<div class="cmsc-modal-body">' +
            '<div class="cmsc-form-row">' +
                '<div class="cmsc-form-group"><label>Nombre completo *</label><input id="cmsc-jg-name" value="' + cmScEsc(j ? j.name : '') + '" oninput="cmScJgBuscarDuplicado()"></div>' +
                '<div id="cmsc-jg-dup-warning" style="margin-top:-10px;margin-bottom:10px"></div>' +
                '<div class="cmsc-form-group"><label>Nacionalidad *</label><input id="cmsc-jg-nat" value="' + cmScEsc(j ? j.nationality : '') + '"></div>' +
            '</div>' +
            '<div class="cmsc-form-row-3">' +
                '<div class="cmsc-form-group"><label>Posicion principal *</label><select id="cmsc-jg-pos">' +
                    '<option value="">-- Seleccionar --</option>' +
                    Object.keys(CMSC_POS_NOMBRES).map(function(k) { return '<option value="' + k + '"' + (j && j.position_primary === k ? ' selected' : '') + '>' + k + ' - ' + CMSC_POS_NOMBRES[k] + '</option>'; }).join('') +
                '</select></div>' +
                '<div class="cmsc-form-group"><label>Posicion secundaria</label><select id="cmsc-jg-pos2">' +
                    '<option value="">-- Ninguna --</option>' +
                    Object.keys(CMSC_POS_NOMBRES).map(function(k) { return '<option value="' + k + '"' + (j && j.position_secondary === k ? ' selected' : '') + '>' + k + ' - ' + CMSC_POS_NOMBRES[k] + '</option>'; }).join('') +
                '</select></div>' +
                '<div class="cmsc-form-group"><label>Pie dominante</label>' +
                    '<select id="cmsc-jg-foot">' +
                        '<option value="">--</option>' +
                        '<option value="right"' + (j && j.dominant_foot === 'right' ? ' selected' : '') + '>Derecho</option>' +
                        '<option value="left"' + (j && j.dominant_foot === 'left' ? ' selected' : '') + '>Izquierdo</option>' +
                        '<option value="both"' + (j && j.dominant_foot === 'both' ? ' selected' : '') + '>Ambidiestro</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            '<div class="cmsc-form-row-3">' +
                '<div class="cmsc-form-group"><label>Fecha nacimiento *</label><input type="date" id="cmsc-jg-birth" value="' + (j ? j.birth_date || '' : '') + '"></div>' +
                '<div class="cmsc-form-group"><label>Altura (cm)</label><input type="number" id="cmsc-jg-height" value="' + (j && j.height_cm ? j.height_cm : '') + '"></div>' +
                '<div class="cmsc-form-group"><label>Peso (kg)</label><input type="number" id="cmsc-jg-weight" value="' + (j && j.weight_kg ? j.weight_kg : '') + '"></div>' +
            '</div>' +
            '<div class="cmsc-form-row">' +
                '<div class="cmsc-form-group"><label>Club actual *</label><input id="cmsc-jg-club" value="' + cmScEsc(j ? j.current_club : '') + '"></div>' +
                '<div class="cmsc-form-group"><label>Liga actual *</label><input id="cmsc-jg-league" value="' + cmScEsc(j ? j.current_league : '') + '"></div>' +
            '</div>' +
            '<div class="cmsc-form-row-3">' +
                '<div class="cmsc-form-group"><label>Fin contrato</label><input type="date" id="cmsc-jg-contract" value="' + (j ? j.contract_until || '' : '') + '"></div>' +
                '<div class="cmsc-form-group"><label>Coste estimado</label><input id="cmsc-jg-cost" value="' + cmScEsc(j ? j.estimated_cost : '') + '" placeholder="Ej: 200k, libre"></div>' +
                '<div class="cmsc-form-group"><label>Potencial</label>' +
                    '<select id="cmsc-jg-potential">' +
                        '<option value="medium"' + (j && j.potential === 'medium' ? ' selected' : '') + '>Medio</option>' +
                        '<option value="high"' + (j && j.potential === 'high' ? ' selected' : '') + '>Alto</option>' +
                        '<option value="low"' + (j && j.potential === 'low' ? ' selected' : '') + '>Bajo</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            '<div class="cmsc-form-row">' +
                '<div class="cmsc-form-group"><label>Agente / Representante</label><input id="cmsc-jg-agent" value="' + cmScEsc(j ? j.agent_name : '') + '"></div>' +
                '<div class="cmsc-form-group"><label>Contacto agente</label><input id="cmsc-jg-agentc" value="' + cmScEsc(j ? j.agent_contact : '') + '"></div>' +
            '</div>' +
            '<div class="cmsc-form-row">' +
                '<div class="cmsc-form-group"><label>Foto (URL)</label><input id="cmsc-jg-photo" value="' + cmScEsc(j ? j.photo_url : '') + '" placeholder="https://..."></div>' +
                '<div class="cmsc-form-group"><label>Categoria objetivo</label><select id="cmsc-jg-category">' +
                    '<option value="primer_equipo"' + (j && j.target_category === 'primer_equipo' ? ' selected' : '') + '>Primer equipo</option>' +
                    '<option value="filial"' + (j && j.target_category === 'filial' ? ' selected' : '') + '>Filial</option>' +
                    '<option value="juvenil"' + (j && j.target_category === 'juvenil' ? ' selected' : '') + '>Juvenil</option>' +
                    '<option value="cadete"' + (j && j.target_category === 'cadete' ? ' selected' : '') + '>Cadete</option>' +
                    '<option value="infantil"' + (j && j.target_category === 'infantil' ? ' selected' : '') + '>Infantil</option>' +
                    '<option value="alevin"' + (j && j.target_category === 'alevin' ? ' selected' : '') + '>Alevin</option>' +
                '</select></div>' +
            '</div>' +
            '<div class="cmsc-form-group"><label>Notas</label><textarea id="cmsc-jg-notes" placeholder="Observaciones generales...">' + cmScEsc(j ? j.notes : '') + '</textarea></div>' +
        '</div>' +
        '<div class="cmsc-modal-footer">' +
            '<button class="cmsc-btn cmsc-btn-secondary" onclick="document.getElementById(\x27cmsc-modal-jugador\x27).remove()">Cancelar</button>' +
            '<button class="cmsc-btn cmsc-btn-primary" onclick="cmScGuardarJugador(\x27' + (jugadorId || '') + '\x27)">Guardar</button>' +
        '</div>' +
    '</div>';
    document.body.appendChild(overlay);
}

function cmScJgBuscarDuplicado() {
    var q = (document.getElementById('cmsc-jg-name').value || '').trim().toLowerCase();
    var cont = document.getElementById('cmsc-jg-dup-warning');
    if (!cont || q.length < 3) { if (cont) cont.innerHTML = ''; return; }

    var coincidencias = cmScJugadores.filter(function(j) {
        return j.name.toLowerCase().indexOf(q) !== -1 || q.indexOf(j.name.toLowerCase()) !== -1;
    });

    if (coincidencias.length === 0) { cont.innerHTML = ''; return; }

    var h = '<div style="background:#422006;border:1px solid #92400e;border-radius:8px;padding:8px 12px;font-size:12px">' +
        '<div style="color:#fbbf24;font-weight:600;margin-bottom:4px">Posibles duplicados encontrados:</div>';
    coincidencias.forEach(function(j) {
        h += '<div style="color:#e2e8f0;padding:2px 0">' + cmScEsc(j.name) +
            (j.current_club ? ' <span style="color:#94a3b8">(' + cmScEsc(j.current_club) + ')</span>' : '') +
            ' <a href="#" onclick="event.preventDefault();document.getElementById(\x27cmsc-modal-jugador\x27).remove();cmScAbrirJugador(\x27' + j.id + '\x27)" style="color:#60a5fa;margin-left:8px">Ver ficha</a>' +
        '</div>';
    });
    h += '</div>';
    cont.innerHTML = h;
}

async function cmScGuardarJugador(jugadorId) {
    var name = (document.getElementById('cmsc-jg-name').value || '').trim();
    var nat = (document.getElementById('cmsc-jg-nat').value || '').trim();
    var pos = (document.getElementById('cmsc-jg-pos').value || '').trim();
    var birth = document.getElementById('cmsc-jg-birth').value;
    var club = (document.getElementById('cmsc-jg-club').value || '').trim();
    var league = (document.getElementById('cmsc-jg-league').value || '').trim();

    if (!name) { showToast('El nombre es obligatorio'); return; }
    if (!nat) { showToast('La nacionalidad es obligatoria'); return; }
    if (!pos) { showToast('La posicion principal es obligatoria'); return; }
    if (!birth) { showToast('La fecha de nacimiento es obligatoria'); return; }
    if (!club) { showToast('El club actual es obligatorio'); return; }
    if (!league) { showToast('La liga actual es obligatoria'); return; }

    var datos = {
        club_id: clubId,
        name: name,
        nationality: document.getElementById('cmsc-jg-nat').value || null,
        position_primary: document.getElementById('cmsc-jg-pos').value || null,
        position_secondary: document.getElementById('cmsc-jg-pos2').value || null,
        dominant_foot: document.getElementById('cmsc-jg-foot').value || null,
        birth_date: document.getElementById('cmsc-jg-birth').value || null,
        height_cm: document.getElementById('cmsc-jg-height').value ? parseInt(document.getElementById('cmsc-jg-height').value) : null,
        weight_kg: document.getElementById('cmsc-jg-weight').value ? parseInt(document.getElementById('cmsc-jg-weight').value) : null,
        current_club: document.getElementById('cmsc-jg-club').value || null,
        current_league: document.getElementById('cmsc-jg-league').value || null,
        contract_until: document.getElementById('cmsc-jg-contract').value || null,
        estimated_cost: document.getElementById('cmsc-jg-cost').value || null,
        potential: document.getElementById('cmsc-jg-potential').value || 'medium',
        agent_name: document.getElementById('cmsc-jg-agent').value || null,
        agent_contact: document.getElementById('cmsc-jg-agentc').value || null,
        photo_url: document.getElementById('cmsc-jg-photo').value || null,
        target_category: document.getElementById('cmsc-jg-category').value || 'primer_equipo',
        notes: document.getElementById('cmsc-jg-notes').value || null,
        updated_at: new Date().toISOString()
    };

    try {
        if (jugadorId) {
            var res = await supabaseClient.from('cm_sc_players').update(datos).eq('id', jugadorId);
            if (res.error) throw res.error;
            showToast('Jugador actualizado');
        } else {
            datos.created_by = cmScGetMiMiembroId();
            var res = await supabaseClient.from('cm_sc_players').insert(datos).select().single();
            if (res.error) throw res.error;
            showToast('Jugador creado');
            // Si venimos del highlight, vincular automaticamente
            if (cmScHlCallbackPendiente && res.data) {
                cmScHlCallbackPendiente = false;
                cmScHlJugadorSeleccionado = res.data.id;
                cmScJugadores.push(res.data);
                var info = document.getElementById('cmsc-hl-selected-info');
                if (info) info.innerHTML = '\u2705 Ficha creada y vinculada: <strong>' + cmScEsc(res.data.name) + '</strong>';
                var btnCrear = document.getElementById('cmsc-hl-btn-crear');
                if (btnCrear) btnCrear.style.display = 'none';
                var hlName = document.getElementById('cmsc-hl-name');
                if (hlName) hlName.value = res.data.name;
                var hlClub = document.getElementById('cmsc-hl-club');
                if (hlClub) hlClub.value = res.data.current_club || '';
            }
        }
        var modal = document.getElementById('cmsc-modal-jugador');
        if (modal) modal.remove();
        if (!cmScHlCallbackPendiente) await cmScCargarJugadores();
    } catch (e) {
        console.error('cmScGuardarJugador:', e);
        showToast('Error: ' + (e.message || e));
    }
}

// --- Detalle del jugador ---
async function cmScAbrirJugador(jugadorId) {
    cmScJugadorActual = cmScJugadores.find(function(j) { return j.id === jugadorId; });
    if (!cmScJugadorActual) return;
    var cont = document.getElementById('cmsc-tab-content');
    if (!cont) return;
    cont.innerHTML = '<div class="cmsc-empty"><div class="icon">&#8987;</div><p>Cargando...</p></div>';

    // Cargar avistamientos (sightings)
    try {
        var miId = cmScGetMiMiembroId();
        var esDD = typeof cmPuedeVer === 'function' && cmPuedeVer('director_deportivo');
        var query = supabaseClient.from('cm_sc_player_sightings')
            .select('*, cm_sc_matches(home_team, away_team, match_date, competition)')
            .eq('player_id', jugadorId).eq('archived', false)
            .order('sighting_date', { ascending: false });
        // Scout solo ve sus propios avistamientos, DD ve todos
        if (!esDD && miId) query = query.eq('scout_id', miId);
        var res = await query;
        cmScJugadorSightings = res.data || [];
    } catch (e) { cmScJugadorSightings = []; console.error('sightings:', e); }

    cmScRenderJugadorDetalle();
}

function cmScRenderJugadorDetalle() {
    var cont = document.getElementById('cmsc-tab-content');
    if (!cont || !cmScJugadorActual) return;
    var j = cmScJugadorActual;
    var puedeEditar = typeof cmPuedeEditar === 'function' ? cmPuedeEditar('scouting') : true;

    var pipeLabels = { identified:'Identificado', observed:'Observado', tracking:'En seguimiento', contacted:'Contactado', signed:'Fichado', discarded:'Descartado' };
    var pipeBadges = { identified:'cmsc-badge-video', observed:'cmsc-badge-pending', tracking:'cmsc-badge-in_progress', contacted:'cmsc-badge-tv', signed:'cmsc-badge-completed', discarded:'cmsc-badge-discard' };
    var levelLabels = { differential:'Diferencial', good:'Buen nivel', developing:'En desarrollo' };
    var levelColors = { differential:'#4ade80', good:'#f59e0b', developing:'#94a3b8' };
    var footLabels = { right:'Derecho', left:'Izquierdo', both:'Ambidiestro' };

    var h = '<div class="cmsc-detail-header">' +
        '<button class="cmsc-detail-back" onclick="cmScJugadorActual=null;cmScRenderJugadores()">\u2190 Volver</button>' +
        '<div style="display:flex;gap:8px">';
    if (puedeEditar) {
        h += '<button class="cmsc-btn cmsc-btn-secondary cmsc-btn-sm" onclick="cmScModalJugador(\x27' + j.id + '\x27)">Editar</button>';
    }
    h += '</div></div>';

    // Cabecera del jugador
    h += '<div class="cmsc-detail-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">' +
            '<div>' +
                '<div style="font-size:22px;font-weight:700;color:#f1f5f9">' + cmScEsc(j.name) + '</div>' +
                '<div style="color:#94a3b8;font-size:13px;margin-top:4px">' +
                    (j.position_primary || '') +
                    (j.position_secondary ? ' / ' + j.position_secondary : '') +
                    (j.nationality ? ' \u00B7 ' + cmScEsc(j.nationality) : '') +
                    (j.birth_date ? ' \u00B7 ' + cmScCalcEdad(j.birth_date) + ' anos (' + cmScFechaCorta(j.birth_date) + ')' : '') +
                '</div>' +
            '</div>' +
        '</div>' +
        // Datos detallados del jugador
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-top:14px;padding-top:14px;border-top:1px solid #334155">' +
            (j.current_club ? '<div><div style="color:#64748b;font-size:10px;font-weight:600">CLUB</div><div style="color:#e2e8f0;font-size:13px">' + cmScEsc(j.current_club) + '</div></div>' : '') +
            (j.current_league ? '<div><div style="color:#64748b;font-size:10px;font-weight:600">LIGA</div><div style="color:#e2e8f0;font-size:13px">' + cmScEsc(j.current_league) + '</div></div>' : '') +
            (j.dominant_foot ? '<div><div style="color:#64748b;font-size:10px;font-weight:600">PIE</div><div style="color:#e2e8f0;font-size:13px">' + (footLabels[j.dominant_foot] || j.dominant_foot) + '</div></div>' : '') +
            (j.height_cm ? '<div><div style="color:#64748b;font-size:10px;font-weight:600">ALTURA</div><div style="color:#e2e8f0;font-size:13px">' + j.height_cm + ' cm</div></div>' : '') +
            (j.weight_kg ? '<div><div style="color:#64748b;font-size:10px;font-weight:600">PESO</div><div style="color:#e2e8f0;font-size:13px">' + j.weight_kg + ' kg</div></div>' : '') +
            (j.contract_until ? '<div><div style="color:#64748b;font-size:10px;font-weight:600">FIN CONTRATO</div><div style="color:#e2e8f0;font-size:13px">' + cmScFechaCorta(j.contract_until) + '</div></div>' : '') +
            (j.estimated_cost ? '<div><div style="color:#64748b;font-size:10px;font-weight:600">COSTE ESTIMADO</div><div style="color:#f59e0b;font-size:13px;font-weight:600">' + cmScEsc(j.estimated_cost) + '</div></div>' : '') +
            (j.potential ? '<div><div style="color:#64748b;font-size:10px;font-weight:600">POTENCIAL</div><div style="color:#e2e8f0;font-size:13px">' + ({ high:'Alto', medium:'Medio', low:'Bajo' }[j.potential] || j.potential) + '</div></div>' : '') +
            (j.agent_name ? '<div><div style="color:#64748b;font-size:10px;font-weight:600">AGENTE</div><div style="color:#e2e8f0;font-size:13px">' + cmScEsc(j.agent_name) + (j.agent_contact ? '<br><span style="color:#94a3b8;font-size:11px">' + cmScEsc(j.agent_contact) + '</span>' : '') + '</div></div>' : '') +
        '</div>' +
            '</div>' +
            '<div style="text-align:center">' +
                (j.rating_overall ? '<div style="color:' + (levelColors[j.level_auto] || '#94a3b8') + ';font-weight:700;font-size:32px">' + j.rating_overall + '</div>' +
                    '<div style="color:' + (levelColors[j.level_auto] || '#94a3b8') + ';font-size:11px">' + (levelLabels[j.level_auto] || '') + '</div>' : '') +
                '<div style="margin-top:6px"><span class="cmsc-badge ' + (pipeBadges[j.pipeline_status] || '') + '" style="font-size:12px;padding:4px 12px">' + (pipeLabels[j.pipeline_status] || j.pipeline_status) + '</span></div>' +
                (j.potential ? '<div style="color:#64748b;font-size:11px;margin-top:4px">Potencial: ' + ({ high:'Alto', medium:'Medio', low:'Bajo' }[j.potential] || j.potential) + '</div>' : '') +
            '</div>' +
        '</div>' +
        (j.notes ? '<div style="color:#cbd5e1;font-size:13px;margin-top:12px;padding-top:10px;border-top:1px solid #334155">' + cmScEsc(j.notes).replace(/\n/g, '<br>') + '</div>' : '') +
    '</div>';

    // Pipeline - cambiar estado
    if (puedeEditar) {
        h += '<div class="cmsc-detail-card">' +
            '<h4 style="margin:0 0 10px;color:#f1f5f9;font-size:14px">Pipeline</h4>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap">';
        Object.keys(pipeLabels).forEach(function(k) {
            var isActive = j.pipeline_status === k;
            h += '<button class="cmsc-btn cmsc-btn-sm" onclick="cmScCambiarPipeline(\x27' + j.id + '\x27,\x27' + k + '\x27)" ' +
                'style="' + (isActive ? 'background:#3b82f6;color:#fff' : 'background:#1e293b;color:#94a3b8;border:1px solid #334155') + '">' +
                pipeLabels[k] + '</button>';
        });
        h += '</div></div>';
    }

    // Avistamientos
    h += '<div class="cmsc-detail-card">' +
        '<h4 style="margin:0 0 12px;color:#f1f5f9;font-size:14px">Avistamientos <span class="cmsc-tab-badge">' + cmScJugadorSightings.length + '</span></h4>';
    if (cmScJugadorSightings.length === 0) {
        h += '<div style="color:#64748b;font-size:13px;padding:16px 0;text-align:center">Sin avistamientos registrados.</div>';
    } else {
        var tagLabels = { sign:'Fichar', watch:'Seguir', discard:'Descartar' };
        h += '<div class="cmsc-hl-list">';
        cmScJugadorSightings.forEach(function(s) {
            var match = s.cm_sc_matches;
            var matchLabel = match ? cmScEsc(match.home_team) + ' vs ' + cmScEsc(match.away_team) : 'Partido';
            h += '<div class="cmsc-hl-item">' +
                '<div class="cmsc-hl-info">' +
                    '<div class="cmsc-hl-name">' + matchLabel + ' <span class="cmsc-badge cmsc-badge-' + s.tag + '">' + (tagLabels[s.tag] || s.tag) + '</span></div>' +
                    '<div class="cmsc-hl-meta">' +
                        cmScFechaCorta(s.sighting_date) +
                        (match && match.competition ? ' \u00B7 ' + cmScEsc(match.competition) : '') +
                        ' \u00B7 Scout: ' + cmScEsc(cmScGetMiembroNombre(s.scout_id)) +
                        (s.rating_quick ? ' \u00B7 Nota: ' + s.rating_quick + '/10' : '') +
                    '</div>' +
                    (s.notes ? '<div class="cmsc-hl-notes">' + cmScEsc(s.notes).replace(/\n/g, '<br>') + '</div>' : '') +
                '</div>' +
            '</div>';
        });
        h += '</div>';
    }
    h += '</div>';

    // Consenso rapido - solo visible para Director Deportivo
    var esDD = typeof cmPuedeVer === 'function' && cmPuedeVer('director_deportivo');
    if (esDD && j.sightings_count > 0) {
        h += '<div class="cmsc-detail-card">' +
            '<h4 style="margin:0 0 10px;color:#f1f5f9;font-size:14px">Consenso</h4>' +
            '<div style="display:flex;gap:20px;flex-wrap:wrap">' +
                '<div style="text-align:center"><div style="color:#4ade80;font-weight:700;font-size:24px">' + (j.sign_count || 0) + '</div><div style="color:#64748b;font-size:11px">Fichar</div></div>' +
                '<div style="text-align:center"><div style="color:#f59e0b;font-weight:700;font-size:24px">' + ((j.sightings_count || 0) - (j.sign_count || 0) - 0) + '</div><div style="color:#64748b;font-size:11px">Seguir</div></div>' +
                '<div style="text-align:center"><div style="color:#94a3b8;font-weight:700;font-size:24px">' + (j.scouts_count || 0) + '</div><div style="color:#64748b;font-size:11px">Scouts distintos</div></div>' +
                '<div style="text-align:center"><div style="color:#e2e8f0;font-weight:700;font-size:24px">' + (j.sightings_count || 0) + '</div><div style="color:#64748b;font-size:11px">Veces visto</div></div>' +
            '</div>' +
            (j.sign_count >= 3 ? '<div style="margin-top:10px;background:#052e16;border:1px solid #166534;border-radius:8px;padding:8px 14px;color:#4ade80;font-size:13px;font-weight:600">&#9888; 3+ scouts recomiendan fichar \u2014 alerta para el Director Deportivo</div>' : '') +
        '</div>';
    }

    cont.innerHTML = h;
}

async function cmScCambiarPipeline(jugadorId, nuevoEstado) {
    try {
        var res = await supabaseClient.from('cm_sc_players')
            .update({ pipeline_status: nuevoEstado, updated_at: new Date().toISOString() })
            .eq('id', jugadorId);
        if (res.error) throw res.error;
        // Actualizar en memoria
        var j = cmScJugadores.find(function(x) { return x.id === jugadorId; });
        if (j) j.pipeline_status = nuevoEstado;
        if (cmScJugadorActual && cmScJugadorActual.id === jugadorId) cmScJugadorActual.pipeline_status = nuevoEstado;
        cmScRenderJugadorDetalle();
        showToast('Pipeline actualizado');
    } catch (e) { showToast('Error: ' + (e.message || e)); }
}

// --- Crear ficha de jugador desde un highlight (llamado desde Tab Partidos) ---
async function cmScCrearJugadorDesdeHighlight(hlId) {
    var hl = cmScHighlights.find(function(x) { return x.id === hlId; });
    if (!hl) return;

    // Verificar si ya existe un jugador con ese nombre
    var existe = cmScJugadores.find(function(j) { return j.name.toLowerCase() === hl.player_name.toLowerCase(); });
    if (existe) {
        // Vincular el highlight al jugador existente
        await supabaseClient.from('cm_sc_match_highlights').update({ player_id: existe.id }).eq('id', hlId);
        showToast('Vinculado al jugador existente: ' + existe.name);
        return;
    }

    var datos = {
        club_id: clubId,
        name: hl.player_name,
        current_club: hl.player_club || null,
        position_primary: hl.player_position || null,
        pipeline_status: 'identified',
        created_by: cmScGetMiMiembroId()
    };

    try {
        var res = await supabaseClient.from('cm_sc_players').insert(datos).select().single();
        if (res.error) throw res.error;
        // Vincular el highlight
        await supabaseClient.from('cm_sc_match_highlights').update({ player_id: res.data.id }).eq('id', hlId);
        showToast('Ficha creada: ' + hl.player_name);
    } catch (e) {
        showToast('Error: ' + (e.message || e));
    }
}


// ============================================================
// TAB 4: SHORTLISTS — Recomendador automatico por formacion
// Selecciona formacion -> muestra top jugadores por posicion
// ============================================================

var cmScSlFormacion = '1-4-3-3';
var cmScSlDatos = []; // sightings con posicion/formacion

// Usar CMSC_POS_NOMBRES (definido arriba) como labels

// Coordenadas Y (fila 0=portero, 4=delantera) y X (0-100 distribuido)
var CMSC_POS_COORDS = {
    '1-4-3-3':   {POR:[50,5], LD:[85,22], DCD:[62,22], DCI:[38,22], LI:[15,22], MC:[50,45], ID:[70,45], II:[30,45], ED:[85,75], DC:[50,78], EI:[15,75]},
    '1-4-4-2':   {POR:[50,5], LD:[85,22], DCD:[62,22], DCI:[38,22], LI:[15,22], MD:[85,48], MCD:[62,48], MCI:[38,48], MI:[15,48], DC1:[62,78], DC2:[38,78]},
    '1-3-5-2':   {POR:[50,5], DCD:[65,22], DCC:[50,22], DCI:[35,22], CAD:[88,40], MCD:[65,48], MC:[50,48], MCI:[35,48], CAI:[12,40], DC1:[62,78], DC2:[38,78]},
    '1-4-2-3-1': {POR:[50,5], LD:[85,22], DCD:[62,22], DCI:[38,22], LI:[15,22], PIV1:[60,38], PIV2:[40,38], ED:[85,62], MP:[50,62], EI:[15,62], DC:[50,82]},
    '1-3-4-3':   {POR:[50,5], DCD:[65,22], DCC:[50,22], DCI:[35,22], CAD:[88,42], MCD:[62,48], MCI:[38,48], CAI:[12,42], ED:[82,78], DC:[50,78], EI:[18,78]},
    '1-4-1-4-1': {POR:[50,5], LD:[85,22], DCD:[62,22], DCI:[38,22], LI:[15,22], PIV:[50,36], MD:[85,52], MCD:[62,52], MCI:[38,52], MI:[15,52], DC:[50,82]},
    '1-5-3-2':   {POR:[50,5], CAD:[88,25], DCD:[65,22], DCC:[50,22], DCI:[35,22], CAI:[12,25], MCD:[65,52], MC:[50,52], MCI:[35,52], DC1:[62,78], DC2:[38,78]},
    '1-4-3-2-1': {POR:[50,5], LD:[85,22], DCD:[62,22], DCI:[38,22], LI:[15,22], MCD:[65,42], MC:[50,42], MCI:[35,42], MP1:[62,62], MP2:[38,62], DC:[50,82]}
};

async function cmScTabShortlists(cont) {
    cont.innerHTML = '<div class="cmsc-empty"><div class="icon">&#8987;</div><p>Cargando datos de scouting...</p></div>';
    await cmScEnsureJugadoresCargados();
    await cmScCargarDatosShortlist();
}

async function cmScCargarDatosShortlist() {
    try {
        var res = await supabaseClient.from('cm_sc_player_sightings')
            .select('player_id, observed_position, observed_formation, rating_quick, tag, scout_id')
            .eq('club_id', clubId).eq('archived', false)
            .not('observed_position', 'is', null);
        cmScSlDatos = res.data || [];
    } catch (e) { cmScSlDatos = []; console.error('shortlist data:', e); }
    cmScRenderShortlistFormacion();
}

function cmScRenderShortlistFormacion() {
    var cont = document.getElementById('cmsc-tab-content');
    if (!cont) return;

    // Selector de formacion
    var h = '<div class="cmsc-toolbar">' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
            '<span style="color:#94a3b8;font-size:13px;font-weight:600">Formacion:</span>';
    CMSC_FORMACIONES.forEach(function(f) {
        var isActive = cmScSlFormacion === f;
        h += '<button class="cmsc-btn cmsc-btn-sm" onclick="cmScSlFormacion=\x27' + f + '\x27;cmScRenderShortlistFormacion()" ' +
            'style="' + (isActive ? 'background:#3b82f6;color:#fff' : 'background:#1e293b;color:#94a3b8;border:1px solid #334155') + '">' + f + '</button>';
    });
    h += '</div>';

    // Contador de datos
    var datosFormacion = cmScSlDatos.filter(function(d) { return d.observed_formation === cmScSlFormacion; });
    h += '<span class="cmsc-contador"><strong>' + datosFormacion.length + '</strong> observaciones en ' + cmScSlFormacion + '</span>';
    h += '</div>';

    // Calcular top jugadores por posicion
    var positions = CMSC_POSICIONES_MAP[cmScSlFormacion] || [];
    var coords = CMSC_POS_COORDS[cmScSlFormacion] || {};
    var topPorPosicion = {};

    positions.forEach(function(pos) {
        var sightingsPos = cmScSlDatos.filter(function(d) {
            return d.observed_formation === cmScSlFormacion && d.observed_position === pos;
        });

        // Agrupar por jugador y calcular media
        var playerMap = {};
        sightingsPos.forEach(function(s) {
            if (!playerMap[s.player_id]) playerMap[s.player_id] = { ratings: [], tags: [], scouts: [] };
            if (s.rating_quick) playerMap[s.player_id].ratings.push(s.rating_quick);
            playerMap[s.player_id].tags.push(s.tag);
            if (playerMap[s.player_id].scouts.indexOf(s.scout_id) === -1) playerMap[s.player_id].scouts.push(s.scout_id);
        });

        var ranked = Object.keys(playerMap).map(function(pid) {
            var data = playerMap[pid];
            var avgRating = data.ratings.length > 0 ? data.ratings.reduce(function(a, b) { return a + b; }, 0) / data.ratings.length : 0;
            var player = cmScJugadores.find(function(j) { return j.id === pid; }) || {};
            return {
                id: pid, name: player.name || '?', club: player.current_club || '',
                rating: Math.round(avgRating * 10) / 10,
                sightings: data.ratings.length, scouts: data.scouts.length,
                signCount: data.tags.filter(function(t) { return t === 'sign'; }).length
            };
        });
        ranked.sort(function(a, b) { return b.rating - a.rating; });
        topPorPosicion[pos] = ranked.slice(0, 5);
    });

    // Campo de futbol visual
    h += '<div style="position:relative;background:linear-gradient(to bottom,#0c4a1e,#166534,#0c4a1e);border-radius:12px;border:2px solid #22c55e;width:100%;max-width:700px;margin:20px auto;aspect-ratio:68/100;overflow:hidden">';

    // Lineas del campo
    h += '<div style="position:absolute;top:50%;left:5%;right:5%;height:1px;background:rgba(255,255,255,.2)"></div>';
    h += '<div style="position:absolute;top:50%;left:50%;width:60px;height:60px;border:1px solid rgba(255,255,255,.2);border-radius:50%;transform:translate(-50%,-50%)"></div>';
    h += '<div style="position:absolute;top:0;left:25%;right:25%;height:12%;border:1px solid rgba(255,255,255,.15);border-top:none"></div>';
    h += '<div style="position:absolute;bottom:0;left:25%;right:25%;height:12%;border:1px solid rgba(255,255,255,.15);border-bottom:none"></div>';

    // Posiciones con jugadores
    positions.forEach(function(pos) {
        var coord = coords[pos];
        if (!coord) return;
        var x = coord[0]; var y = 100 - coord[1]; // invertir Y (portero abajo)
        var top5 = topPorPosicion[pos] || [];
        var best = top5[0];

        var bgColor = best ? '#3b82f6' : '#334155';
        var nameStr = best ? best.name.split(' ').pop() : '-';
        var ratingStr = best ? best.rating.toFixed(1) : '';

        h += '<div style="position:absolute;left:' + x + '%;top:' + y + '%;transform:translate(-50%,-50%);text-align:center;cursor:pointer;z-index:2" ' +
            'onclick="cmScSlMostrarPosicion(\x27' + pos + '\x27)">' +
            '<div style="width:44px;height:44px;border-radius:50%;background:' + bgColor + ';margin:0 auto;display:flex;align-items:center;justify-content:center;' +
                'border:2px solid rgba(255,255,255,.3);box-shadow:0 2px 8px rgba(0,0,0,.4)">' +
                '<span style="color:#fff;font-size:10px;font-weight:700">' + (ratingStr || pos) + '</span>' +
            '</div>' +
            '<div style="color:#fff;font-size:9px;font-weight:600;margin-top:2px;text-shadow:0 1px 3px rgba(0,0,0,.8)">' + cmScEsc(nameStr) + '</div>' +
            '<div style="color:rgba(255,255,255,.6);font-size:8px">' + (CMSC_POS_NOMBRES[pos] || pos) + '</div>' +
        '</div>';
    });
    h += '</div>';

    // Panel de detalle (se muestra al hacer clic en una posicion)
    h += '<div id="cmsc-sl-pos-detail"></div>';

    // Info si no hay datos
    if (datosFormacion.length === 0) {
        h += '<div style="text-align:center;margin-top:16px;padding:20px;background:#1e293b;border-radius:10px;color:#94a3b8;font-size:13px">' +
            'Sin datos para ' + cmScSlFormacion + '. Los jugadores apareceran aqui cuando los scouts registren posicion y formacion al destacar jugadores en los partidos.' +
        '</div>';
    }

    cont.innerHTML = h;
}

// Mostrar detalle de una posicion (top 5 jugadores)
function cmScSlMostrarPosicion(pos) {
    var cont = document.getElementById('cmsc-sl-pos-detail');
    if (!cont) return;

    var sightingsPos = cmScSlDatos.filter(function(d) {
        return d.observed_formation === cmScSlFormacion && d.observed_position === pos;
    });

    var playerMap = {};
    sightingsPos.forEach(function(s) {
        if (!playerMap[s.player_id]) playerMap[s.player_id] = { ratings: [], tags: [], scouts: [] };
        if (s.rating_quick) playerMap[s.player_id].ratings.push(s.rating_quick);
        playerMap[s.player_id].tags.push(s.tag);
        if (playerMap[s.player_id].scouts.indexOf(s.scout_id) === -1) playerMap[s.player_id].scouts.push(s.scout_id);
    });

    var ranked = Object.keys(playerMap).map(function(pid) {
        var data = playerMap[pid];
        var avgRating = data.ratings.length > 0 ? data.ratings.reduce(function(a, b) { return a + b; }, 0) / data.ratings.length : 0;
        var player = cmScJugadores.find(function(j) { return j.id === pid; }) || {};
        return {
            id: pid, name: player.name || '?', club: player.current_club || '', nationality: player.nationality || '',
            rating: Math.round(avgRating * 10) / 10, estimated_cost: player.estimated_cost || '',
            sightings: data.ratings.length, scouts: data.scouts.length,
            signCount: data.tags.filter(function(t) { return t === 'sign'; }).length,
            pipeline: player.pipeline_status || 'identified'
        };
    });
    ranked.sort(function(a, b) { return b.rating - a.rating; });
    var top5 = ranked.slice(0, 5);

    var posLabel = (CMSC_POS_NOMBRES[pos] || pos);
    var h = '<div class="cmsc-detail-card" style="margin-top:16px">' +
        '<h4 style="margin:0 0 12px;color:#f1f5f9;font-size:15px">' + pos + ' \u2014 ' + posLabel + ' <span class="cmsc-tab-badge">' + ranked.length + ' jugadores</span></h4>';

    if (top5.length === 0) {
        h += '<div style="color:#64748b;font-size:13px;padding:16px 0;text-align:center">Sin jugadores observados en esta posicion para ' + cmScSlFormacion + '</div>';
    } else {
        var pipeLabels = { identified:'Identificado', observed:'Observado', tracking:'Seguimiento', contacted:'Contactado', signed:'Fichado', discarded:'Descartado' };
        h += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
            '<thead><tr style="border-bottom:1px solid #334155">' +
                '<th style="text-align:center;padding:6px;color:#94a3b8;width:30px">#</th>' +
                '<th style="text-align:left;padding:6px;color:#94a3b8">Jugador</th>' +
                '<th style="text-align:left;padding:6px;color:#94a3b8">Club</th>' +
                '<th style="text-align:center;padding:6px;color:#94a3b8">Nota</th>' +
                '<th style="text-align:center;padding:6px;color:#94a3b8">Visto</th>' +
                '<th style="text-align:center;padding:6px;color:#94a3b8">Scouts</th>' +
                '<th style="text-align:center;padding:6px;color:#94a3b8">Fichar</th>' +
                '<th style="text-align:left;padding:6px;color:#94a3b8">Coste</th>' +
                '<th style="text-align:left;padding:6px;color:#94a3b8">Estado</th>' +
            '</tr></thead><tbody>';
        top5.forEach(function(p, idx) {
            var ratingColor = p.rating >= 8 ? '#4ade80' : (p.rating >= 6 ? '#f59e0b' : '#94a3b8');
            h += '<tr style="border-bottom:1px solid #1e293b">' +
                '<td style="padding:8px;text-align:center;color:#f59e0b;font-weight:700">' + (idx + 1) + '</td>' +
                '<td style="padding:8px;color:#f1f5f9;font-weight:600;cursor:pointer" onclick="cmScCambiarTab(\x27jugadores\x27);setTimeout(function(){cmScAbrirJugador(\x27' + p.id + '\x27)},300)">' + cmScEsc(p.name) + '</td>' +
                '<td style="padding:8px;color:#94a3b8">' + cmScEsc(p.club) + '</td>' +
                '<td style="padding:8px;text-align:center;color:' + ratingColor + ';font-weight:700;font-size:15px">' + p.rating.toFixed(1) + '</td>' +
                '<td style="padding:8px;text-align:center;color:#e2e8f0">' + p.sightings + 'x</td>' +
                '<td style="padding:8px;text-align:center;color:#e2e8f0">' + p.scouts + '</td>' +
                '<td style="padding:8px;text-align:center;color:#4ade80;font-weight:600">' + (p.signCount > 0 ? p.signCount : '-') + '</td>' +
                '<td style="padding:8px;color:#94a3b8;font-size:12px">' + cmScEsc(p.estimated_cost) + '</td>' +
                '<td style="padding:8px"><span class="cmsc-badge cmsc-badge-pending" style="font-size:10px">' + (pipeLabels[p.pipeline] || p.pipeline) + '</span></td>' +
            '</tr>';
        });
        h += '</tbody></table></div>';
    }
    h += '</div>';
    cont.innerHTML = h;
}


// ============================================================
// TAB 5: GASTOS// ============================================================
// TAB 5: GASTOS (notas de gastos del scout)
// Flujo: seleccionar partido + fechas -> anadir gastos por categoria -> enviar
// ============================================================

var cmScGastos = [];
var cmScGastoActual = null;
var cmScGastoItems = [];

var CMSC_CONCEPTOS = [
    { key: 'mileage',   label: 'Gasolina / Km', icon: '&#9981;' },
    { key: 'hotel',     label: 'Hotel',          icon: '&#127976;' },
    { key: 'meals',     label: 'Comidas',        icon: '&#127860;' },
    { key: 'transport', label: 'Transporte',     icon: '&#128652;' },
    { key: 'tickets',   label: 'Entradas',       icon: '&#127915;' },
    { key: 'taxi',      label: 'Taxi',           icon: '&#128661;' },
    { key: 'parking',   label: 'Parking',        icon: '&#127359;' },
    { key: 'tolls',     label: 'Peajes',         icon: '&#128176;' },
    { key: 'other',     label: 'Otros',          icon: '&#128221;' }
];

async function cmScTabGastos(cont) {
    cont.innerHTML = '<div class="cmsc-empty"><div class="icon">&#8987;</div><p>Cargando gastos...</p></div>';
    if (cmScPartidos.length === 0) await cmScCargarPartidos();
    await cmScCargarMiembros();
    await cmScCargarGastos();
}

async function cmScCargarGastos() {
    try {
        var res = await supabaseClient.from('cm_sc_expense_reports')
            .select('*')
            .eq('club_id', clubId)
            .eq('archived', false)
            .order('created_at', { ascending: false });
        if (res.error) throw res.error;
        cmScGastos = res.data || [];
        if (cmScGastoActual) {
            cmScGastoActual = cmScGastos.find(function(g) { return g.id === cmScGastoActual.id; });
        }
        cmScRenderGastos();
    } catch (e) {
        console.error('cmScCargarGastos:', e);
    }
}

function cmScRenderGastos() {
    var cont = document.getElementById('cmsc-tab-content');
    if (!cont) return;
    var puedeEditar = typeof cmPuedeEditar === 'function' ? cmPuedeEditar('scouting') : true;
    var statusLabels = { draft: 'Borrador', submitted: 'Pendiente', approved: 'Aprobado', paid: 'Pagado' };
    var statusBadges = { draft: 'cmsc-badge-pending', submitted: 'cmsc-badge-in_progress', approved: 'cmsc-badge-sign', paid: 'cmsc-badge-completed' };

    var h = '<div class="cmsc-toolbar">' +
        '<span class="cmsc-contador"><strong>' + cmScGastos.length + '</strong> hoja' + (cmScGastos.length !== 1 ? 's' : '') + ' de gastos</span>';
    if (puedeEditar) {
        h += '<button class="cmsc-btn cmsc-btn-primary cmsc-btn-sm" onclick="cmScNuevoGasto()">+ Nuevo gasto de viaje</button>';
    }
    h += '</div>';

    if (cmScGastos.length === 0) {
        h += '<div class="cmsc-empty"><div class="icon">&#128179;</div>' +
            '<h3>Sin gastos registrados</h3>' +
            '<p>Despues de asistir a un partido, registra aqui tus gastos de viaje (gasolina, comida, hotel...) para que contabilidad te los reembolse.</p></div>';
    } else {
        h += '<div class="cmsc-match-grid">';
        cmScGastos.forEach(function(g) {
            var total = (g.total_amount_cents / 100).toFixed(2);
            var partido = cmScPartidos.find(function(p) { return p.id === g.notes; });
            var partidoLabel = partido ? cmScEsc(partido.home_team) + ' vs ' + cmScEsc(partido.away_team) : cmScEsc(g.title);
            h += '<div class="cmsc-match-card" onclick="cmScAbrirGasto(\x27' + g.id + '\x27)">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">' +
                    '<div style="flex:1">' +
                        '<div style="color:#f1f5f9;font-weight:600;font-size:14px">' + partidoLabel + '</div>' +
                        '<div style="color:#94a3b8;font-size:11px;margin-top:4px">' +
                            cmScEsc(cmScGetMiembroNombre(g.scout_id)) +
                            (g.period_from ? ' \u00B7 ' + cmScFechaCorta(g.period_from) + (g.period_to && g.period_to !== g.period_from ? ' a ' + cmScFechaCorta(g.period_to) : '') : '') +
                        '</div>' +
                    '</div>' +
                    '<div style="text-align:right">' +
                        '<div style="color:#f59e0b;font-weight:700;font-size:16px">' + total + ' \u20AC</div>' +
                        '<div style="margin-top:4px"><span class="cmsc-badge ' + (statusBadges[g.status] || '') + '">' + (statusLabels[g.status] || g.status) + '</span></div>' +
                    '</div>' +
                '</div>' +
                '<div style="color:#64748b;font-size:11px;margin-top:8px">' +
                    g.items_count + ' concepto' + (g.items_count !== 1 ? 's' : '') +
                    (g.total_km > 0 ? ' \u00B7 ' + g.total_km + ' km' : '') +
                '</div>' +
            '</div>';
        });
        h += '</div>';
    }
    cont.innerHTML = h;
}

// --- Crear nuevo gasto: seleccionar partido + fechas -> ir directo al detalle ---
function cmScNuevoGasto() {
    var matchOpts = '<option value="">-- Seleccionar partido --</option>';
    cmScPartidos.forEach(function(p) {
        matchOpts += '<option value="' + p.id + '">' + cmScEsc(p.home_team) + ' vs ' + cmScEsc(p.away_team) + ' (' + cmScFechaCorta(p.match_date) + ')</option>';
    });

    var overlay = document.createElement('div');
    overlay.className = 'cmsc-modal-overlay';
    overlay.id = 'cmsc-modal-gasto-nuevo';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML =
    '<div class="cmsc-modal" style="max-width:480px">' +
        '<div class="cmsc-modal-header">' +
            '<h3>Nuevo gasto de viaje</h3>' +
            '<button class="cmsc-modal-close" onclick="document.getElementById(\x27cmsc-modal-gasto-nuevo\x27).remove()">\u2715</button>' +
        '</div>' +
        '<div class="cmsc-modal-body">' +
            '<div class="cmsc-form-group"><label>Partido *</label>' +
                '<select id="cmsc-ng-match" onchange="cmScNuevoGastoMatchChanged()">' + matchOpts + '</select>' +
            '</div>' +
            '<div class="cmsc-form-row">' +
                '<div class="cmsc-form-group"><label>Fecha inicio viaje *</label>' +
                    '<input type="date" id="cmsc-ng-from">' +
                '</div>' +
                '<div class="cmsc-form-group"><label>Fecha fin viaje *</label>' +
                    '<input type="date" id="cmsc-ng-to">' +
                '</div>' +
            '</div>' +
            '<div class="cmsc-form-group"><label>Tarifa km (\u20AC)</label>' +
                '<input type="number" id="cmsc-ng-kmrate" value="0.19" step="0.01" min="0">' +
                '<div style="color:#64748b;font-size:11px;margin-top:2px">Estandar Espana: 0.19 \u20AC/km</div>' +
            '</div>' +
        '</div>' +
        '<div class="cmsc-modal-footer">' +
            '<button class="cmsc-btn cmsc-btn-secondary" onclick="document.getElementById(\x27cmsc-modal-gasto-nuevo\x27).remove()">Cancelar</button>' +
            '<button class="cmsc-btn cmsc-btn-primary" onclick="cmScCrearGastoYAbrir()">Crear y anadir gastos</button>' +
        '</div>' +
    '</div>';
    document.body.appendChild(overlay);
}

function cmScNuevoGastoMatchChanged() {
    var matchId = document.getElementById('cmsc-ng-match').value;
    if (!matchId) return;
    var p = cmScPartidos.find(function(x) { return x.id === matchId; });
    if (p && p.match_date) {
        document.getElementById('cmsc-ng-from').value = p.match_date;
        document.getElementById('cmsc-ng-to').value = p.match_date;
    }
}

async function cmScCrearGastoYAbrir() {
    var matchId = document.getElementById('cmsc-ng-match').value;
    var dateFrom = document.getElementById('cmsc-ng-from').value;
    var dateTo = document.getElementById('cmsc-ng-to').value;
    if (!matchId || !dateFrom || !dateTo) { showToast('Selecciona partido y fechas'); return; }

    var p = cmScPartidos.find(function(x) { return x.id === matchId; });
    var title = p ? (p.home_team + ' vs ' + p.away_team + ' - ' + cmScFechaCorta(p.match_date)) : 'Viaje scouting';
    var kmRateEur = parseFloat(document.getElementById('cmsc-ng-kmrate').value) || 0.19;

    var datos = {
        club_id: clubId,
        scout_id: cmScGetMiMiembroId(),
        title: title,
        period_from: dateFrom,
        period_to: dateTo,
        km_rate_cents: Math.round(kmRateEur * 100),
        notes: matchId
    };

    if (!datos.scout_id) { showToast('No se pudo identificar tu perfil'); return; }

    try {
        var res = await supabaseClient.from('cm_sc_expense_reports').insert(datos).select().single();
        if (res.error) throw res.error;
        var modal = document.getElementById('cmsc-modal-gasto-nuevo');
        if (modal) modal.remove();
        cmScGastos.unshift(res.data);
        await cmScAbrirGasto(res.data.id);
    } catch (e) {
        console.error('cmScCrearGastoYAbrir:', e);
        showToast('Error: ' + (e.message || e));
    }
}

// --- Detalle: vista de gastos con botones de categoria ---
async function cmScAbrirGasto(gastoId) {
    cmScGastoActual = cmScGastos.find(function(g) { return g.id === gastoId; });
    if (!cmScGastoActual) { await cmScCargarGastos(); cmScGastoActual = cmScGastos.find(function(g) { return g.id === gastoId; }); }
    if (!cmScGastoActual) return;

    var cont = document.getElementById('cmsc-tab-content');
    if (!cont) return;
    cont.innerHTML = '<div class="cmsc-empty"><div class="icon">&#8987;</div><p>Cargando...</p></div>';

    try {
        var res = await supabaseClient.from('cm_sc_expense_items')
            .select('*').eq('report_id', gastoId).eq('archived', false)
            .order('expense_date', { ascending: true });
        cmScGastoItems = res.data || [];
    } catch (e) { cmScGastoItems = []; }

    cmScRenderGastoDetalle();
}

function cmScRenderGastoDetalle() {
    var cont = document.getElementById('cmsc-tab-content');
    if (!cont || !cmScGastoActual) return;
    var g = cmScGastoActual;
    var esBorrador = g.status === 'draft';
    var statusLabels = { draft: 'Borrador', submitted: 'Pendiente', approved: 'Aprobado', paid: 'Pagado' };
    var statusBadges = { draft: 'cmsc-badge-pending', submitted: 'cmsc-badge-in_progress', approved: 'cmsc-badge-sign', paid: 'cmsc-badge-completed' };
    var conceptLabels = {};
    CMSC_CONCEPTOS.forEach(function(c) { conceptLabels[c.key] = c.label; });

    // Calcular total
    var totalCents = 0;
    var totalKm = 0;
    cmScGastoItems.forEach(function(it) { totalCents += it.amount_cents || 0; if (it.concept === 'mileage') totalKm += parseFloat(it.quantity) || 0; });

    var h = '<div class="cmsc-detail-header">' +
        '<button class="cmsc-detail-back" onclick="cmScGastoActual=null;cmScCargarGastos()">\u2190 Volver</button>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">';
    if (esBorrador) {
        h += '<button class="cmsc-btn cmsc-btn-primary cmsc-btn-sm" onclick="cmScCambiarEstadoGasto(\x27' + g.id + '\x27,\x27submitted\x27)">Enviar a contabilidad</button>';
        h += '<button class="cmsc-btn cmsc-btn-danger cmsc-btn-sm" onclick="cmScArchivarGasto(\x27' + g.id + '\x27)">Eliminar</button>';
    }
    h += '</div></div>';

    // Cabecera con total grande
    h += '<div class="cmsc-detail-card" style="text-align:center">' +
        '<div style="color:#f59e0b;font-weight:700;font-size:32px">' + (totalCents / 100).toFixed(2) + ' \u20AC</div>' +
        '<div style="color:#94a3b8;font-size:13px;margin-top:4px">' + cmScEsc(g.title) + '</div>' +
        '<div style="color:#64748b;font-size:12px;margin-top:2px">' +
            cmScFechaCorta(g.period_from) + (g.period_to && g.period_to !== g.period_from ? ' \u2192 ' + cmScFechaCorta(g.period_to) : '') +
            ' \u00B7 ' + cmScGastoItems.length + ' concepto' + (cmScGastoItems.length !== 1 ? 's' : '') +
            (totalKm > 0 ? ' \u00B7 ' + totalKm + ' km' : '') +
        '</div>' +
        '<div style="margin-top:8px"><span class="cmsc-badge ' + (statusBadges[g.status] || '') + '" style="font-size:12px;padding:4px 12px">' + (statusLabels[g.status] || g.status) + '</span></div>' +
        (g.status === 'paid' ? '<div style="color:#4ade80;font-size:12px;margin-top:6px">Pagado ' + (g.paid_at ? cmScFechaCorta(g.paid_at.split('T')[0]) : '') + '</div>' : '') +
    '</div>';

    // Botones de categoria (solo en borrador)
    if (esBorrador) {
        h += '<div class="cmsc-detail-card">' +
            '<h4 style="margin:0 0 12px;color:#f1f5f9;font-size:14px">Anadir gasto:</h4>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px">';
        CMSC_CONCEPTOS.forEach(function(c) {
            h += '<button class="cmsc-btn cmsc-btn-secondary" onclick="cmScModalItem(\x27' + c.key + '\x27)" ' +
                'style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;font-size:12px">' +
                '<span style="font-size:22px">' + c.icon + '</span>' +
                c.label +
            '</button>';
        });
        h += '</div></div>';
    }

    // Lista de gastos anadidos
    if (cmScGastoItems.length > 0) {
        h += '<div class="cmsc-detail-card">' +
            '<h4 style="margin:0 0 12px;color:#f1f5f9;font-size:14px">Gastos registrados</h4>' +
            '<div class="cmsc-hl-list">';
        cmScGastoItems.forEach(function(it) {
            var label = conceptLabels[it.concept] || it.concept;
            h += '<div class="cmsc-hl-item">' +
                '<div class="cmsc-hl-info">' +
                    '<div class="cmsc-hl-name">' + label +
                        ' <span style="color:#f59e0b;font-weight:700;margin-left:8px">' + (it.amount_cents / 100).toFixed(2) + ' \u20AC</span>' +
                    '</div>' +
                    '<div class="cmsc-hl-meta">' +
                        cmScFechaCorta(it.expense_date) +
                        (it.concept === 'mileage' && it.quantity ? ' \u00B7 ' + it.quantity + ' km' : '') +
                        (it.description ? ' \u00B7 ' + cmScEsc(it.description) : '') +
                    '</div>' +
                '</div>' +
                '<div class="cmsc-hl-actions">' +
                    (it.receipt_url ? '<a href="' + it.receipt_url + '" target="_blank" class="cmsc-btn cmsc-btn-secondary cmsc-btn-sm" style="text-decoration:none">Ver ticket</a>' : '') +
                    (esBorrador ? '<button class="cmsc-btn cmsc-btn-danger cmsc-btn-sm" onclick="cmScArchivarItem(\x27' + it.id + '\x27)">\u2715</button>' : '') +
                '</div>' +
            '</div>';
        });
        h += '</div></div>';
    }

    cont.innerHTML = h;
}

// --- Modal anadir gasto por categoria ---
function cmScModalItem(conceptKey) {
    if (!cmScGastoActual) return;
    var conceptLabel = '';
    CMSC_CONCEPTOS.forEach(function(c) { if (c.key === conceptKey) conceptLabel = c.label; });
    var esKm = conceptKey === 'mileage';
    var kmRate = (cmScGastoActual.km_rate_cents || 19) / 100;

    var overlay = document.createElement('div');
    overlay.className = 'cmsc-modal-overlay';
    overlay.id = 'cmsc-modal-item';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML =
    '<div class="cmsc-modal" style="max-width:460px">' +
        '<div class="cmsc-modal-header">' +
            '<h3>' + conceptLabel + '</h3>' +
            '<button class="cmsc-modal-close" onclick="document.getElementById(\x27cmsc-modal-item\x27).remove()">\u2715</button>' +
        '</div>' +
        '<div class="cmsc-modal-body">' +
            (esKm ?
                '<div class="cmsc-form-group"><label>Kilometros *</label>' +
                    '<input type="number" id="cmsc-it-km" min="0" step="0.1" placeholder="Ej: 120" oninput="cmScItemCalcKm()">' +
                    '<div style="color:#64748b;font-size:11px;margin-top:2px">Tarifa: ' + kmRate.toFixed(2) + ' \u20AC/km</div>' +
                '</div>' +
                '<div class="cmsc-form-group"><label>Importe calculado</label>' +
                    '<input type="text" id="cmsc-it-amount-auto" readonly style="color:#f59e0b;font-weight:700;font-size:16px">' +
                '</div>'
            :
                '<div class="cmsc-form-group"><label>Importe (\u20AC) *</label>' +
                    '<input type="number" id="cmsc-it-amount" min="0" step="0.01" placeholder="0.00" style="font-size:16px;font-weight:600">' +
                '</div>'
            ) +
            '<div class="cmsc-form-group"><label>Fecha *</label>' +
                '<input type="date" id="cmsc-it-date" value="' + (cmScGastoActual.period_from || new Date().toISOString().split('T')[0]) + '">' +
            '</div>' +
            '<div class="cmsc-form-group"><label>Descripcion</label>' +
                '<input id="cmsc-it-desc" placeholder="Ej: Gasolinera Repsol AP-6, Menu del dia restaurante...">' +
            '</div>' +
            '<div class="cmsc-form-group"><label>Justificante (foto/PDF del ticket)</label>' +
                '<input type="file" id="cmsc-it-file" accept="image/*,.pdf" capture="environment" style="padding:8px">' +
                '<div style="color:#64748b;font-size:11px;margin-top:2px">Haz foto al ticket o selecciona archivo</div>' +
            '</div>' +
        '</div>' +
        '<div class="cmsc-modal-footer">' +
            '<button class="cmsc-btn cmsc-btn-secondary" onclick="document.getElementById(\x27cmsc-modal-item\x27).remove()">Cancelar</button>' +
            '<button class="cmsc-btn cmsc-btn-success" onclick="cmScGuardarItem(\x27' + conceptKey + '\x27)">Guardar gasto</button>' +
        '</div>' +
    '</div>';
    document.body.appendChild(overlay);
}

function cmScItemCalcKm() {
    var km = parseFloat(document.getElementById('cmsc-it-km').value) || 0;
    var rate = (cmScGastoActual ? cmScGastoActual.km_rate_cents : 19) / 100;
    var total = (km * rate).toFixed(2);
    var el = document.getElementById('cmsc-it-amount-auto');
    if (el) el.value = total + ' \u20AC';
}

async function cmScGuardarItem(conceptKey) {
    var esKm = conceptKey === 'mileage';
    var date = document.getElementById('cmsc-it-date').value;
    if (!date) { showToast('La fecha es obligatoria'); return; }

    var amountCents = 0;
    var quantity = 1;
    var unitRate = null;

    if (esKm) {
        var km = parseFloat(document.getElementById('cmsc-it-km').value) || 0;
        if (km <= 0) { showToast('Indica los kilometros'); return; }
        var rate = cmScGastoActual ? cmScGastoActual.km_rate_cents : 19;
        amountCents = Math.round(km * rate);
        quantity = km;
        unitRate = rate;
    } else {
        var amt = parseFloat(document.getElementById('cmsc-it-amount').value) || 0;
        if (amt <= 0) { showToast('Indica el importe'); return; }
        amountCents = Math.round(amt * 100);
    }

    // Subir justificante si hay archivo
    var receiptUrl = null;
    var receiptName = null;
    var fileInput = document.getElementById('cmsc-it-file');
    if (fileInput && fileInput.files && fileInput.files[0]) {
        var file = fileInput.files[0];
        receiptName = file.name;
        // Convertir a base64 y guardar en receipt_url (MVP — R2 upload en proxima version)
        try {
            var base64 = await cmScFileToBase64(file);
            receiptUrl = base64;
        } catch (e) { console.warn('Error leyendo archivo:', e); }
    }

    var datos = {
        club_id: clubId,
        report_id: cmScGastoActual.id,
        concept: conceptKey,
        description: document.getElementById('cmsc-it-desc').value || null,
        amount_cents: amountCents,
        quantity: quantity,
        unit_rate_cents: unitRate,
        expense_date: date,
        receipt_url: receiptUrl,
        receipt_filename: receiptName
    };

    try {
        var res = await supabaseClient.from('cm_sc_expense_items').insert(datos).select().single();
        if (res.error) throw res.error;
        await cmScRecalcularTotalesGasto(cmScGastoActual.id);
        showToast('Gasto anadido');
        var modal = document.getElementById('cmsc-modal-item');
        if (modal) modal.remove();
        await cmScAbrirGasto(cmScGastoActual.id);
    } catch (e) {
        console.error('cmScGuardarItem:', e);
        showToast('Error: ' + (e.message || e));
    }
}

function cmScFileToBase64(file) {
    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = function() { reject(reader.error); };
        reader.readAsDataURL(file);
    });
}

async function cmScArchivarItem(itemId) {
    if (!confirm('Eliminar este gasto?')) return;
    try {
        await supabaseClient.from('cm_sc_expense_items')
            .update({ archived: true, archived_at: new Date().toISOString() }).eq('id', itemId);
        await cmScRecalcularTotalesGasto(cmScGastoActual.id);
        showToast('Gasto eliminado');
        await cmScAbrirGasto(cmScGastoActual.id);
    } catch (e) { showToast('Error: ' + (e.message || e)); }
}

async function cmScArchivarGasto(reportId) {
    if (!confirm('Eliminar esta hoja de gastos y todos sus conceptos?')) return;
    try {
        await supabaseClient.from('cm_sc_expense_reports')
            .update({ archived: true, archived_at: new Date().toISOString() }).eq('id', reportId);
        showToast('Hoja eliminada');
        cmScGastoActual = null;
        await cmScCargarGastos();
    } catch (e) { showToast('Error: ' + (e.message || e)); }
}

async function cmScRecalcularTotalesGasto(reportId) {
    try {
        var res = await supabaseClient.from('cm_sc_expense_items')
            .select('amount_cents, quantity, concept').eq('report_id', reportId).eq('archived', false);
        var items = res.data || [];
        var totalCents = 0; var totalKm = 0;
        items.forEach(function(it) { totalCents += it.amount_cents || 0; if (it.concept === 'mileage') totalKm += parseFloat(it.quantity) || 0; });
        await supabaseClient.from('cm_sc_expense_reports')
            .update({ total_amount_cents: totalCents, total_km: totalKm, items_count: items.length, updated_at: new Date().toISOString() })
            .eq('id', reportId);
        if (cmScGastoActual && cmScGastoActual.id === reportId) {
            cmScGastoActual.total_amount_cents = totalCents;
            cmScGastoActual.total_km = totalKm;
            cmScGastoActual.items_count = items.length;
        }
        var idx = cmScGastos.findIndex(function(g) { return g.id === reportId; });
        if (idx >= 0) { cmScGastos[idx].total_amount_cents = totalCents; cmScGastos[idx].total_km = totalKm; cmScGastos[idx].items_count = items.length; }
    } catch (e) { console.error('cmScRecalcularTotalesGasto:', e); }
}

async function cmScCambiarEstadoGasto(reportId, nuevoEstado) {
    var msgs = { submitted: 'Enviar esta hoja a contabilidad? Una vez enviada no podras modificarla.', approved: 'Aprobar esta hoja?', paid: 'Marcar como pagada?' };
    if (!confirm(msgs[nuevoEstado] || 'Cambiar estado?')) return;
    var update = { status: nuevoEstado, updated_at: new Date().toISOString() };
    if (nuevoEstado === 'submitted') update.submitted_at = new Date().toISOString();
    if (nuevoEstado === 'approved') { update.approved_at = new Date().toISOString(); update.approved_by = cmScGetMiMiembroId(); }
    if (nuevoEstado === 'paid') { update.paid_at = new Date().toISOString(); update.paid_by = cmScGetMiMiembroId(); }
    try {
        var res = await supabaseClient.from('cm_sc_expense_reports').update(update).eq('id', reportId);
        if (res.error) throw res.error;
        showToast(nuevoEstado === 'submitted' ? 'Hoja enviada a contabilidad' : 'Estado actualizado');
        await cmScCargarGastos();
        if (cmScGastoActual && cmScGastoActual.id === reportId) {
            cmScGastoActual = cmScGastos.find(function(g) { return g.id === reportId; });
            cmScRenderGastoDetalle();
        }
    } catch (e) { showToast('Error: ' + (e.message || e)); }
}


// ============================================================
// API-FOOTBALL - Busqueda e importacion de partidos
// Plan gratuito: temporadas 2022-2024, 100 req/dia
// ============================================================

async function cmScApiFetch(endpoint) {
    var res = await fetch(CMSC_API_BASE + endpoint, {
        method: 'GET',
        headers: { 'x-apisports-key': CMSC_API_KEY }
    });
    if (!res.ok) throw new Error('API-Football error: ' + res.status);
    var data = await res.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
        throw new Error(Object.values(data.errors).join(', '));
    }
    return data.response || [];
}

function cmScApiModal() {
    var overlay = document.createElement('div');
    overlay.className = 'cmsc-modal-overlay';
    overlay.id = 'cmsc-modal-api';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML =
    '<div class="cmsc-modal" style="max-width:700px">' +
        '<div class="cmsc-modal-header">' +
            '<h3>Buscar partido en API-Football</h3>' +
            '<button class="cmsc-modal-close" onclick="document.getElementById(\'cmsc-modal-api\').remove()">\u2715</button>' +
        '</div>' +
        '<div class="cmsc-modal-body">' +
            '<div style="background:#172554;border:1px solid #1e3a5f;border-radius:8px;padding:10px 14px;margin-bottom:14px;color:#93c5fd;font-size:12px">' +
                (CMSC_API_PLAN === 'paid' ? 'Plan de pago: todas las temporadas y parametros disponibles' : 'Plan gratuito: temporadas 2022-2024, 100 consultas/dia') +
            '</div>' +
            '<div class="cmsc-form-group">' +
                '<label>Buscar equipo por nombre</label>' +
                '<div style="display:flex;gap:8px">' +
                    '<input id="cmsc-api-team-search" placeholder="Ej: Barcelona, Mirandes, Ponferradina..." style="flex:1">' +
                    '<button class="cmsc-btn cmsc-btn-primary cmsc-btn-sm" onclick="cmScApiBuscarEquipo()">Buscar</button>' +
                '</div>' +
            '</div>' +
            '<div id="cmsc-api-equipos" style="margin-bottom:16px"></div>' +
            '<div id="cmsc-api-partidos"></div>' +
        '</div>' +
    '</div>';
    document.body.appendChild(overlay);
    setTimeout(function() {
        var inp = document.getElementById('cmsc-api-team-search');
        if (inp) {
            inp.focus();
            inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') cmScApiBuscarEquipo(); });
        }
    }, 100);
}

async function cmScApiBuscarEquipo() {
    var input = document.getElementById('cmsc-api-team-search');
    var q = (input.value || '').trim();
    if (q.length < 3) { showToast('Escribe al menos 3 letras'); return; }

    var cont = document.getElementById('cmsc-api-equipos');
    cont.innerHTML = '<div style="color:#94a3b8;font-size:13px;padding:10px 0">Buscando equipos...</div>';
    document.getElementById('cmsc-api-partidos').innerHTML = '';

    try {
        cmScApiEquipos = await cmScApiFetch('/teams?search=' + encodeURIComponent(q));
        if (cmScApiEquipos.length === 0) {
            cont.innerHTML = '<div style="color:#f59e0b;font-size:13px;padding:10px 0">Sin resultados para "' + cmScEsc(q) + '"</div>';
            return;
        }
        var h = '<div style="font-size:12px;color:#94a3b8;margin-bottom:6px">' + cmScApiEquipos.length + ' equipos encontrados:</div>';
        h += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
        cmScApiEquipos.forEach(function(item) {
            var t = item.team;
            h += '<button class="cmsc-btn cmsc-btn-secondary cmsc-btn-sm" onclick="cmScApiCargarPartidos(' + t.id + ',\'' + cmScEsc(t.name).replace(/'/g, "\\'") + '\')" style="display:flex;align-items:center;gap:6px">' +
                (t.logo ? '<img src="' + t.logo + '" style="width:18px;height:18px;object-fit:contain">' : '') +
                cmScEsc(t.name) +
                '<span style="color:#64748b;font-size:10px">' + cmScEsc(t.country || '') + '</span>' +
            '</button>';
        });
        h += '</div>';
        cont.innerHTML = h;
    } catch (e) {
        console.error('cmScApiBuscarEquipo:', e);
        cont.innerHTML = '<div style="color:#ef4444;font-size:13px;padding:10px 0">Error: ' + cmScEsc(e.message) + '</div>';
    }
}

async function cmScApiCargarPartidos(teamId, teamName) {
    var cont = document.getElementById('cmsc-api-partidos');
    cont.innerHTML = '<div style="color:#94a3b8;font-size:13px;padding:10px 0">Cargando partidos de ' + cmScEsc(teamName) + '...</div>';

    try {
        if (CMSC_API_PLAN === 'paid') {
            // Plan de pago: temporada actual + parametro last
            var season = new Date().getFullYear();
            cmScApiPartidos = await cmScApiFetch('/fixtures?team=' + teamId + '&season=' + season + '&last=30');
            if (cmScApiPartidos.length === 0) {
                cmScApiPartidos = await cmScApiFetch('/fixtures?team=' + teamId + '&season=' + (season - 1) + '&last=30');
            }
        } else {
            // Plan gratuito: temporadas 2022-2024, sin parametro last
            cmScApiPartidos = await cmScApiFetch('/fixtures?team=' + teamId + '&season=2024');
            if (cmScApiPartidos.length === 0) {
                cmScApiPartidos = await cmScApiFetch('/fixtures?team=' + teamId + '&season=2023');
            }
            // Ordenar por fecha descendente y mostrar los 30 mas recientes
            cmScApiPartidos.sort(function(a, b) {
                return new Date(b.fixture.date) - new Date(a.fixture.date);
            });
            cmScApiPartidos = cmScApiPartidos.slice(0, 30);
        }

        if (cmScApiPartidos.length === 0) {
            cont.innerHTML = '<div style="color:#f59e0b;font-size:13px;padding:10px 0">Sin partidos recientes para ' + cmScEsc(teamName) + '</div>';
            return;
        }

        var h = '<div style="font-size:12px;color:#94a3b8;margin-bottom:8px">Ultimos ' + cmScApiPartidos.length + ' partidos \u2014 clic para importar:</div>';
        cmScApiPartidos.forEach(function(fix) {
            var f = fix.fixture;
            var t = fix.teams;
            var g = fix.goals;
            var l = fix.league;
            var fecha = f.date ? new Date(f.date) : null;
            var fechaStr = fecha ? fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            var hora = fecha ? fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
            var score = (g.home !== null && g.away !== null) ? g.home + ' - ' + g.away : 'vs';
            var scoreColor = (g.home !== null && g.away !== null) ? '#f59e0b' : '#64748b';

            h += '<div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px 14px;margin-bottom:6px;cursor:pointer;transition:border-color .2s" ' +
                'onmouseover="this.style.borderColor=\'#3b82f6\'" onmouseout="this.style.borderColor=\'#334155\'" ' +
                'onclick="cmScApiImportar(' + f.id + ')">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">' +
                    '<div style="display:flex;align-items:center;gap:8px;flex:1">' +
                        (t.home.logo ? '<img src="' + t.home.logo + '" style="width:20px;height:20px;object-fit:contain">' : '') +
                        '<span style="color:#f1f5f9;font-weight:600;font-size:13px">' + cmScEsc(t.home.name) + '</span>' +
                        '<span style="color:' + scoreColor + ';font-weight:700;font-size:15px;min-width:40px;text-align:center">' + score + '</span>' +
                        '<span style="color:#f1f5f9;font-weight:600;font-size:13px">' + cmScEsc(t.away.name) + '</span>' +
                        (t.away.logo ? '<img src="' + t.away.logo + '" style="width:20px;height:20px;object-fit:contain">' : '') +
                    '</div>' +
                    '<div style="display:flex;gap:6px;align-items:center;flex-shrink:0">' +
                        '<span style="font-size:11px;color:#94a3b8">' + fechaStr + ' ' + hora + '</span>' +
                        (l.name ? '<span class="cmsc-badge" style="background:#1e293b;color:#60a5fa;font-size:10px">' + cmScEsc(l.name) + (l.round ? ' \u00B7 ' + cmScEsc(l.round) : '') + '</span>' : '') +
                    '</div>' +
                '</div>' +
            '</div>';
        });
        cont.innerHTML = h;
    } catch (e) {
        console.error('cmScApiCargarPartidos:', e);
        cont.innerHTML = '<div style="color:#ef4444;font-size:13px;padding:10px 0">Error: ' + cmScEsc(e.message) + '</div>';
    }
}

async function cmScApiImportar(fixtureId) {
    var fix = cmScApiPartidos.find(function(f) { return f.fixture.id === fixtureId; });
    if (!fix) { showToast('Partido no encontrado'); return; }

    var existe = cmScPartidos.find(function(p) { return p.api_match_id === fixtureId; });
    if (existe) { showToast('Este partido ya esta importado'); return; }

    var f = fix.fixture;
    var t = fix.teams;
    var g = fix.goals;
    var l = fix.league;
    var fecha = f.date ? new Date(f.date) : null;

    // Obtener datos completos: eventos, alineaciones, estadisticas (3 llamadas extra)
    showToast('Importando datos del partido...');
    var apiEvents = [];
    var apiLineups = [];
    var apiStats = [];
    try { apiEvents = await cmScApiFetch('/fixtures/events?fixture=' + fixtureId); } catch(e) { console.warn('API events:', e.message); }
    try { apiLineups = await cmScApiFetch('/fixtures/lineups?fixture=' + fixtureId); } catch(e) { console.warn('API lineups:', e.message); }
    try { apiStats = await cmScApiFetch('/fixtures/statistics?fixture=' + fixtureId); } catch(e) { console.warn('API stats:', e.message); }

    var fullApiData = {
        fixture: fix,
        events: apiEvents,
        lineups: apiLineups,
        statistics: apiStats
    };

    var datos = {
        club_id: clubId,
        home_team: t.home.name,
        away_team: t.away.name,
        match_date: fecha ? fecha.toISOString().split('T')[0] : null,
        kick_off_time: fecha ? fecha.toTimeString().substring(0, 5) : null,
        score_home: g.home,
        score_away: g.away,
        competition: l.name || null,
        round: l.round || null,
        venue: f.venue ? f.venue.name : null,
        viewing_method: 'video',
        status: (g.home !== null) ? 'completed' : 'pending',
        source: 'api',
        api_match_id: fixtureId,
        api_data: fullApiData,
        created_by: cmScGetMiMiembroId(),
        notes: null
    };

    try {
        var res = await supabaseClient.from('cm_sc_matches')
            .insert(datos).select().single();
        if (res.error) throw res.error;
        showToast('Partido importado con todos los datos: ' + t.home.name + ' vs ' + t.away.name);

        var modal = document.getElementById('cmsc-modal-api');
        if (modal) modal.remove();
        await cmScCargarPartidos();
    } catch (e) {
        console.error('cmScApiImportar:', e);
        showToast('Error: ' + (e.message || e));
    }
}


// ============================================================
// AUTO-MONTAJE DEL MODULO
// ============================================================
(function cmScAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 20) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (!cmPuedeVer('scouting')) { clearInterval(intervalo); return; }
        clearInterval(intervalo);

        if (document.getElementById('cm-tab-scouting')) return;

        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;

        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-scouting';
        tab.setAttribute('onclick', "cambiarModulo('scouting', this)");
        tab.innerHTML = '<span class="tab-icon">&#128269;</span><span>Scouting</span>';
        mainTabs.appendChild(tab);

        if (!document.getElementById('modulo-scouting')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-scouting';
            var ultModulo = document.querySelector('.vista-modulo:last-of-type');
            if (ultModulo && ultModulo.parentElement) {
                ultModulo.parentElement.insertBefore(vista, ultModulo.nextSibling);
            } else {
                document.body.appendChild(vista);
            }
        }

        if (typeof registrarModulo === 'function') {
            registrarModulo('scouting', function() { cmScInit('modulo-scouting'); });
        }

        var pd = document.getElementById('cm-pantalla-desarrollo');
        if (pd) {
            pd.style.display = 'none';
            var mt = document.querySelector('.main-tabs');
            if (mt) mt.style.display = '';
            document.querySelectorAll('.vista-modulo').forEach(function(v) { v.style.display = ''; });
        }

        var tv = Array.from(document.querySelectorAll('.main-tab')).filter(function(t) {
            return t.style.display !== 'none';
        });
        if (tv.length === 1 && tv[0].id === 'cm-tab-scouting') {
            cambiarModulo('scouting', tab);
        }

        console.log('[Scouting] Auto-montado y registrado');
    }, 500);
})();
