// ============================================================
// CM-FISIO.JS · Panel Fisioterapeuta Deportivo
// TopLiderCoach HUB · Club Mode · Fase F.1 MVP
// ============================================================
// Despacho privado del fisioterapeuta. Solo visible para roles
// con permiso modulo_fisio. Prefijo: cmFisio
// ============================================================

// ========== ESTADO DEL MODULO ==========
var cmFisioJugadorActual = null;
var cmFisioTabActiva = 'lesiones';
var cmFisioTecnicasCatalog = [];
var cmFisioCatalogosReady = false;

// ========== FILTROS ==========
var cmFisioFiltroEquipo = 'all';
var cmFisioFiltroEstado = 'all';
var cmFisioJugadoresData = [];
var cmFisioEquipos = [];
var cmFisioTemporadas = [];

// ========== CATALOGO DE TECNICAS ==========
var CMFISIO_TECNICAS_FALLBACK = [
    {code:'masoterapia',name_es:'Masoterapia',category:'Terapia manual'},
    {code:'movilizacion',name_es:'Movilizacion articular',category:'Terapia manual'},
    {code:'estiramientos',name_es:'Estiramientos',category:'Terapia manual'},
    {code:'liberacion_miofascial',name_es:'Liberacion miofascial',category:'Terapia manual'},
    {code:'puncion_seca',name_es:'Puncion seca',category:'Tecnica invasiva'},
    {code:'electroterapia',name_es:'Electroterapia (TENS/EMS)',category:'Agentes fisicos'},
    {code:'ultrasonido',name_es:'Ultrasonido',category:'Agentes fisicos'},
    {code:'crioterapia',name_es:'Crioterapia',category:'Agentes fisicos'},
    {code:'termoterapia',name_es:'Termoterapia',category:'Agentes fisicos'},
    {code:'ondas_choque',name_es:'Ondas de choque',category:'Agentes fisicos'},
    {code:'presoterapia',name_es:'Presoterapia',category:'Agentes fisicos'},
    {code:'vendaje_funcional',name_es:'Vendaje funcional',category:'Contencion'},
    {code:'ejercicio_terapeutico',name_es:'Ejercicio terapeutico',category:'Terapia activa'},
    {code:'ejercicio_excentrico',name_es:'Ejercicio excentrico',category:'Terapia activa'},
    {code:'propiocepcion',name_es:'Propiocepcion / equilibrio',category:'Terapia activa'},
    {code:'readaptacion_campo',name_es:'Readaptacion en campo',category:'Terapia activa'}
];


// ========== INICIALIZACION ==========
async function cmFisioInit(containerId) {
    var container = document.getElementById(containerId);
    if (!container) { console.error('cmFisioInit: contenedor no encontrado:', containerId); return; }
    if (!cmFisioCatalogosReady) { await cmFisioCargarCatalogos(); }
    cmFisioRenderPanel(container);
    await cmFisioCargarJugadores();
}

async function cmFisioCargarCatalogos() {
    try {
        var res = await supabaseClient.from('cm_fisio_techniques').select('*').eq('active', true).order('sort_order');
        cmFisioTecnicasCatalog = (res.data && res.data.length > 0) ? res.data : CMFISIO_TECNICAS_FALLBACK;
        cmFisioCatalogosReady = true;
    } catch (e) {
        console.error('Error cargando catalogo tecnicas fisio:', e);
        cmFisioTecnicasCatalog = CMFISIO_TECNICAS_FALLBACK;
        cmFisioCatalogosReady = true;
    }
}


// ========== RENDER PRINCIPAL ==========
function cmFisioRenderPanel(container) {
    container.innerHTML =
    '<style>' +
        '.cmfisio-panel{padding:20px;max-width:1200px;margin:0 auto}' +
        '.cmfisio-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px}' +
        '.cmfisio-header h2{margin:0;color:#1f2937;font-size:20px}' +
        '.cmfisio-filtro-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}' +
        '.cmfisio-filtro-bar label{color:#94a3b8;font-size:12px;font-weight:600}' +
        '.cmfisio-filtro-bar select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px;font-family:inherit;cursor:pointer}' +
        '.cmfisio-stats-bar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}' +
        '.cmfisio-stat{background:#1e293b;border-radius:10px;padding:14px 18px;flex:1;min-width:110px;text-align:center;border:2px solid #334155;cursor:pointer;transition:all .2s}' +
        '.cmfisio-stat:hover{transform:translateY(-2px)}' +
        '.cmfisio-stat.active-filter{border-color:#14b8a6;box-shadow:0 0 12px rgba(20,184,166,.3)}' +
        '.cmfisio-stat .num{font-size:28px;font-weight:700}' +
        '.cmfisio-stat .label{font-size:12px;color:#94a3b8;margin-top:2px}' +
        '.cmfisio-stat.green .num{color:#22c55e}.cmfisio-stat.amber .num{color:#f59e0b}.cmfisio-stat.red .num{color:#ef4444}.cmfisio-stat.total .num{color:#14b8a6}' +
        '.cmfisio-player-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}' +
        '.cmfisio-player-card{background:#1e293b;border-radius:10px;padding:12px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;border:1px solid #334155;transition:all .2s}' +
        '.cmfisio-player-card:hover{border-color:#14b8a6;transform:translateY(-1px)}' +
        '.cmfisio-player-avatar{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#e2e8f0;background:#334155;overflow:hidden}' +
        '.cmfisio-player-avatar img{width:100%;height:100%;object-fit:cover}' +
        '.cmfisio-semaforo{width:12px;height:12px;border-radius:50%;flex-shrink:0}' +
        '.cmfisio-semaforo.green{background:#22c55e;box-shadow:0 0 6px #22c55e55}' +
        '.cmfisio-semaforo.amber{background:#f59e0b;box-shadow:0 0 6px #f59e0b55}' +
        '.cmfisio-semaforo.red{background:#ef4444;box-shadow:0 0 6px #ef444455}' +
        '.cmfisio-semaforo.unknown{background:#475569}' +
        '.cmfisio-player-info{flex:1;min-width:0}' +
        '.cmfisio-player-name{color:#e2e8f0;font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
        '.cmfisio-player-meta{color:#94a3b8;font-size:11px;margin-top:1px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}' +
        '.cmfisio-player-team-tag{background:#0f3d3e;color:#14b8a6;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600;white-space:nowrap}' +
        '.cmfisio-player-injury-tag{font-size:10px;color:#fbbf24;background:#422006;padding:1px 6px;border-radius:3px;white-space:nowrap}' +
        '.cmfisio-player-sessions-tag{font-size:10px;color:#a78bfa;background:#2e1065;padding:1px 6px;border-radius:3px;white-space:nowrap}' +
        '.cmfisio-player-dorsal{color:#64748b;font-size:13px;font-weight:600;min-width:24px;text-align:center}' +
        // Ficha overlay
        '.cmfisio-ficha-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:9000;display:flex;justify-content:center;align-items:flex-start;padding:30px;overflow-y:auto}' +
        '.cmfisio-ficha{background:#0f172a;border-radius:14px;width:100%;max-width:900px;max-height:90vh;overflow-y:auto;border:1px solid #334155}' +
        '.cmfisio-ficha-header{display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid #1e293b;position:sticky;top:0;background:#0f172a;z-index:10;border-radius:14px 14px 0 0}' +
        '.cmfisio-ficha-header h3{margin:0;color:#e2e8f0;font-size:18px;display:flex;align-items:center;gap:10px}' +
        '.cmfisio-ficha-close{background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;padding:4px 8px}' +
        '.cmfisio-ficha-close:hover{color:#ef4444}' +
        '.cmfisio-tabs{display:flex;gap:0;border-bottom:1px solid #1e293b;padding:0 24px;background:#0f172a;position:sticky;top:60px;z-index:9}' +
        '.cmfisio-tab{padding:10px 18px;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;background:none;border-top:none;border-left:none;border-right:none}' +
        '.cmfisio-tab:hover{color:#e2e8f0}.cmfisio-tab.active{color:#14b8a6;border-bottom-color:#14b8a6}' +
        '.cmfisio-tab-content{padding:20px 24px;display:none}.cmfisio-tab-content.active{display:block}' +
        // Forms
        '.cmfisio-form-group{margin-bottom:14px}' +
        '.cmfisio-form-group label{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}' +
        '.cmfisio-form-group input,.cmfisio-form-group select,.cmfisio-form-group textarea{width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit;box-sizing:border-box}' +
        '.cmfisio-form-group textarea{min-height:60px;resize:vertical}' +
        '.cmfisio-form-group input:focus,.cmfisio-form-group select:focus,.cmfisio-form-group textarea:focus{border-color:#14b8a6;outline:none}' +
        '.cmfisio-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
        '.cmfisio-form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}' +
        // Buttons
        '.cmfisio-btn{padding:8px 18px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s}' +
        '.cmfisio-btn-primary{background:#14b8a6;color:#fff}.cmfisio-btn-primary:hover{background:#0d9488}' +
        '.cmfisio-btn-success{background:#059669;color:#fff}.cmfisio-btn-success:hover{background:#047857}' +
        '.cmfisio-btn-danger{background:#dc2626;color:#fff}.cmfisio-btn-danger:hover{background:#b91c1c}' +
        '.cmfisio-btn-secondary{background:#334155;color:#e2e8f0}.cmfisio-btn-secondary:hover{background:#475569}' +
        '.cmfisio-btn-sm{padding:5px 12px;font-size:12px}' +
        // Cards
        '.cmfisio-treatment-card{background:#1e293b;border-radius:8px;padding:14px;margin-bottom:10px;border-left:4px solid #475569;cursor:pointer;transition:all .2s}' +
        '.cmfisio-treatment-card:hover{border-left-color:#14b8a6}' +
        '.cmfisio-treatment-card.active{border-left-color:#14b8a6}' +
        '.cmfisio-treatment-card.paused{border-left-color:#f59e0b;opacity:.8}' +
        '.cmfisio-treatment-card.completed{border-left-color:#22c55e;opacity:.7}' +
        '.cmfisio-session-card{background:#1e293b;border-radius:8px;padding:14px;margin-bottom:10px}' +
        '.cmfisio-session-date{color:#14b8a6;font-weight:600;font-size:13px;margin-bottom:8px}' +
        '.cmfisio-soap-section{margin-bottom:6px}' +
        '.cmfisio-soap-section strong{color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.5px}' +
        '.cmfisio-soap-section p{color:#e2e8f0;font-size:13px;margin:2px 0 0 0}' +
        '.cmfisio-technique-tag{display:inline-block;padding:2px 8px;background:#0f3d3e;color:#14b8a6;border-radius:4px;font-size:11px;margin:2px 4px 2px 0}' +
        '.cmfisio-recommendation{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600}' +
        '.cmfisio-recommendation.apto{background:#052e16;color:#86efac}' +
        '.cmfisio-recommendation.limitado{background:#451a03;color:#fcd34d}' +
        '.cmfisio-recommendation.no_disponible{background:#450a0a;color:#fca5a5}' +
        // Semaforo selector
        '.cmfisio-semaforo-selector{display:flex;gap:8px;margin:12px 0}' +
        '.cmfisio-semaforo-btn{padding:8px 16px;border-radius:6px;border:2px solid transparent;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s}' +
        '.cmfisio-semaforo-btn.btn-green{background:#052e16;color:#22c55e;border-color:#166534}' +
        '.cmfisio-semaforo-btn.btn-green.selected{background:#22c55e;color:#052e16}' +
        '.cmfisio-semaforo-btn.btn-amber{background:#451a03;color:#f59e0b;border-color:#92400e}' +
        '.cmfisio-semaforo-btn.btn-amber.selected{background:#f59e0b;color:#451a03}' +
        '.cmfisio-semaforo-btn.btn-red{background:#450a0a;color:#ef4444;border-color:#991b1b}' +
        '.cmfisio-semaforo-btn.btn-red.selected{background:#ef4444;color:#450a0a}' +
        // Checkboxes tecnicas
        '.cmfisio-tech-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}' +
        '.cmfisio-tech-check{display:flex;align-items:center;gap:6px;padding:4px 8px;background:#0f172a;border-radius:4px;cursor:pointer;font-size:12px;color:#e2e8f0;transition:background .2s}' +
        '.cmfisio-tech-check:hover{background:#1e293b}' +
        '.cmfisio-tech-check input{accent-color:#14b8a6}' +
        // Informe diario
        '.cmfisio-report-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:9500;display:flex;justify-content:center;align-items:flex-start;padding:30px;overflow-y:auto}' +
        '.cmfisio-report-modal{background:#0f172a;border-radius:14px;width:100%;max-width:700px;max-height:90vh;overflow-y:auto;border:1px solid #14b8a6;padding:24px}' +
        '.cmfisio-report-player{background:#1e293b;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:10px}' +
        '.cmfisio-report-player .name{color:#e2e8f0;font-weight:600;font-size:14px;flex:1}' +
        // Empty state
        '.cmfisio-empty{text-align:center;padding:40px 20px;color:#64748b}' +
        '.cmfisio-empty .icon{font-size:40px;margin-bottom:10px}.cmfisio-empty p{font-size:14px}' +
        '.cmfisio-filter-count{color:#64748b;font-size:12px;margin-bottom:10px}' +
        // Injury read-only card
        '.cmfisio-injury-ro{background:#1e293b;border-radius:8px;padding:14px;margin-bottom:10px;border-left:4px solid #ef4444;opacity:.85}' +
        '.cmfisio-injury-ro .title{color:#e2e8f0;font-weight:600;font-size:14px}' +
        '.cmfisio-injury-ro .meta{color:#94a3b8;font-size:12px;margin-top:4px}' +
        '.cmfisio-injury-ro .ro-badge{display:inline-block;padding:2px 8px;background:#1e3a5f;color:#60a5fa;border-radius:4px;font-size:10px;font-weight:600;margin-left:6px}' +
        // Responsive
        '@media(max-width:640px){.cmfisio-form-row,.cmfisio-form-row-3{grid-template-columns:1fr}.cmfisio-player-grid{grid-template-columns:1fr}.cmfisio-tabs{overflow-x:auto}.cmfisio-ficha-overlay{padding:10px}.cmfisio-stats-bar{gap:8px}.cmfisio-stat{min-width:70px;padding:10px 8px}.cmfisio-stat .num{font-size:22px}.cmfisio-tech-grid{grid-template-columns:1fr}}' +
    '</style>' +
    '<div class="cmfisio-panel">' +
        '<div class="cmfisio-header">' +
            '<h2>Panel Fisioterapia</h2>' +
            '<div style="display:flex;gap:8px">' +
                '<button class="cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm" id="cmfisio-btn-calendario" onclick="if(typeof cmFisioCalToggleVista===\'function\')cmFisioCalToggleVista()">Calendario</button>' +
                '<button class="cmfisio-btn cmfisio-btn-primary cmfisio-btn-sm" onclick="cmFisioGenerarInformeDiario()">Informe diario</button>' +
            '</div>' +
            '<div class="cmfisio-filtro-bar">' +
                '<label>Equipo:</label>' +
                '<select id="cmfisio-filtro-equipo" onchange="cmFisioFiltrarEquipo(this.value)"><option value="all">Todos los equipos</option></select>' +
            '</div>' +
        '</div>' +
        '<div class="cmfisio-stats-bar" id="cmfisio-stats-bar">' +
            '<div class="cmfisio-stat total active-filter" onclick="cmFisioFiltrarEstado(\'all\',this)"><div class="num" id="cmfisio-stat-total">-</div><div class="label">Plantilla</div></div>' +
            '<div class="cmfisio-stat green" onclick="cmFisioFiltrarEstado(\'green\',this)"><div class="num" id="cmfisio-stat-green">-</div><div class="label">Disponibles</div></div>' +
            '<div class="cmfisio-stat amber" onclick="cmFisioFiltrarEstado(\'amber\',this)"><div class="num" id="cmfisio-stat-amber">-</div><div class="label">Precaucion</div></div>' +
            '<div class="cmfisio-stat red" onclick="cmFisioFiltrarEstado(\'red\',this)"><div class="num" id="cmfisio-stat-red">-</div><div class="label">Lesionados</div></div>' +
        '</div>' +
        '<div class="cmfisio-filter-count" id="cmfisio-filter-count"></div>' +
        '<div class="cmfisio-player-grid" id="cmfisio-player-grid"><div class="cmfisio-empty"><div class="icon">...</div><p>Cargando jugadores...</p></div></div>' +
    '</div>' +
    '<div class="cmfisio-ficha-overlay" id="cmfisio-ficha-overlay" style="display:none;" onclick="if(event.target===this)cmFisioCerrarFicha()">' +
        '<div class="cmfisio-ficha" id="cmfisio-ficha"></div>' +
    '</div>';
}


// ========== CARGAR JUGADORES ==========
async function cmFisioCargarJugadores() {
    var grid = document.getElementById('cmfisio-player-grid');
    if (!grid) return;

    try {
        var teamsRes = await supabaseClient.from('club_teams').select('id, name, category').eq('club_id', clubId).eq('active', true).order('category').order('name');
        cmFisioEquipos = teamsRes.data || [];

        var seasonsRes = await supabaseClient.from('seasons').select('id, name').eq('club_id', clubId).eq('is_active', true);
        cmFisioTemporadas = seasonsRes.data || [];

        if (cmFisioTemporadas.length === 0) {
            grid.innerHTML = '<div class="cmfisio-empty"><div class="icon">--</div><p>No hay temporadas activas</p></div>';
            return;
        }

        // Poblar filtro equipos
        var selectEquipo = document.getElementById('cmfisio-filtro-equipo');
        if (selectEquipo) {
            var optsHtml = '<option value="all">Todos los equipos (' + cmFisioEquipos.length + ')</option>';
            cmFisioEquipos.forEach(function(t) {
                var cat = t.category ? ' (' + t.category + ')' : '';
                optsHtml += '<option value="' + t.id + '">' + t.name + cat + '</option>';
            });
            selectEquipo.innerHTML = optsHtml;
            if (cmFisioFiltroEquipo !== 'all') selectEquipo.value = cmFisioFiltroEquipo;
        }

        // Cargar jugadores
        var seasonIds = cmFisioTemporadas.map(function(s) { return s.id; });
        var spRes = await supabaseClient.from('season_players').select('shirt_number, player_id, season_id, team_id, players(id, name, position, photo_url)').in('season_id', seasonIds).order('shirt_number');
        var spData = spRes.data || [];

        if (spData.length === 0) {
            grid.innerHTML = '<div class="cmfisio-empty"><div class="icon">--</div><p>No hay jugadores en las temporadas activas</p></div>';
            return;
        }

        var teamNames = {};
        cmFisioEquipos.forEach(function(t) { teamNames[t.id] = t.name; });

        // Disponibilidad
        var availRes = await supabaseClient.from('club_player_availability').select('player_id, status').eq('club_id', clubId);
        var availMap = {};
        (availRes.data || []).forEach(function(a) { availMap[a.player_id] = a.status; });

        // Lesiones activas (del medico)
        var injRes = await supabaseClient.from('cm_med_injuries').select('player_id, body_zone, status, cm_med_body_zones(zone_name_es)').eq('club_id', clubId).in('status', ['active', 'recovering']).eq('archived', false);
        var injMap = {};
        (injRes.data || []).forEach(function(inj) {
            if (!injMap[inj.player_id]) injMap[inj.player_id] = [];
            injMap[inj.player_id].push(inj);
        });

        // Sesiones de fisio hoy (para badge)
        var hoy = new Date().toISOString().split('T')[0];
        var sesRes = await supabaseClient.from('cm_fisio_sessions').select('player_id').eq('club_id', clubId).eq('session_date', hoy).eq('archived', false);
        var sesHoySet = {};
        (sesRes.data || []).forEach(function(s) { sesHoySet[s.player_id] = true; });

        // Deduplicar
        var vistos = {};
        cmFisioJugadoresData = [];

        spData.forEach(function(sp) {
            var p = sp.players;
            if (!p) return;
            if (vistos[p.id]) {
                var existing = cmFisioJugadoresData.find(function(j) { return j.playerId === p.id; });
                if (existing && sp.team_id && existing.teamIds.indexOf(sp.team_id) === -1) {
                    existing.teamIds.push(sp.team_id);
                    if (teamNames[sp.team_id]) existing.teamNames.push(teamNames[sp.team_id]);
                }
                return;
            }
            vistos[p.id] = true;

            var avail = availMap[p.id] || 'unknown';
            if (avail === 'unknown') avail = 'green'; // default

            var activeInjuries = injMap[p.id] || [];
            var injZone = '';
            if (activeInjuries.length > 0 && activeInjuries[0].cm_med_body_zones) {
                injZone = activeInjuries[0].cm_med_body_zones.zone_name_es;
            }

            cmFisioJugadoresData.push({
                playerId: p.id,
                name: p.name || 'Sin nombre',
                position: p.position || '-',
                photoUrl: p.photo_url || '',
                dorsal: sp.shirt_number || '-',
                avail: avail,
                teamIds: sp.team_id ? [sp.team_id] : [],
                teamNames: sp.team_id && teamNames[sp.team_id] ? [teamNames[sp.team_id]] : [],
                activeInjuryZone: injZone,
                activeInjuries: activeInjuries.length,
                sesionHoy: sesHoySet[p.id] || false
            });
        });

        cmFisioRenderJugadores();
    } catch (e) {
        console.error('cmFisioCargarJugadores:', e);
        grid.innerHTML = '<div class="cmfisio-empty"><div class="icon">!!</div><p>Error al cargar jugadores</p></div>';
    }
}


// ========== RENDERIZAR CON FILTROS ==========
function cmFisioRenderJugadores() {
    var grid = document.getElementById('cmfisio-player-grid');
    if (!grid) return;

    var filtrados = cmFisioJugadoresData.filter(function(j) {
        if (cmFisioFiltroEquipo !== 'all' && j.teamIds.indexOf(cmFisioFiltroEquipo) === -1) return false;
        if (cmFisioFiltroEstado !== 'all' && j.avail !== cmFisioFiltroEstado) return false;
        return true;
    });

    var datosEquipo = cmFisioJugadoresData.filter(function(j) {
        if (cmFisioFiltroEquipo !== 'all' && j.teamIds.indexOf(cmFisioFiltroEquipo) === -1) return false;
        return true;
    });

    var stats = { total: datosEquipo.length, green: 0, amber: 0, red: 0 };
    datosEquipo.forEach(function(j) {
        if (j.avail === 'green') stats.green++;
        else if (j.avail === 'amber') stats.amber++;
        else if (j.avail === 'red') stats.red++;
    });

    document.getElementById('cmfisio-stat-total').textContent = stats.total;
    document.getElementById('cmfisio-stat-green').textContent = stats.green;
    document.getElementById('cmfisio-stat-amber').textContent = stats.amber;
    document.getElementById('cmfisio-stat-red').textContent = stats.red;

    var countEl = document.getElementById('cmfisio-filter-count');
    if (cmFisioFiltroEstado !== 'all') {
        var labels = { green: 'disponibles', amber: 'en precaucion', red: 'lesionados' };
        countEl.textContent = 'Mostrando ' + filtrados.length + ' jugadores ' + (labels[cmFisioFiltroEstado] || '');
    } else { countEl.textContent = ''; }

    if (filtrados.length === 0) {
        grid.innerHTML = '<div class="cmfisio-empty"><div class="icon">--</div><p>No hay jugadores con este filtro</p></div>';
        return;
    }

    var html = '';
    filtrados.forEach(function(j) {
        var avatarContent = '';
        if (j.photoUrl) {
            avatarContent = '<img src="' + j.photoUrl + '" alt="' + j.name + '">';
        } else {
            var parts = j.name.split(' ');
            var initials = parts[0] ? parts[0][0] : '';
            if (parts.length > 1) initials += parts[parts.length - 1][0];
            avatarContent = initials.toUpperCase();
        }

        var teamTag = j.teamNames.map(function(t) { return '<span class="cmfisio-player-team-tag">' + t + '</span>'; }).join(' ');
        var injuryTag = j.activeInjuryZone ? '<span class="cmfisio-player-injury-tag">' + j.activeInjuryZone + '</span>' : '';
        var sesionTag = j.sesionHoy ? '<span class="cmfisio-player-sessions-tag">Tratado hoy</span>' : '';

        html += '<div class="cmfisio-player-card" onclick="cmFisioAbrirFicha(\'' + j.playerId + '\',\'' + j.name.replace(/'/g, "\\'") + '\',\'' + (j.photoUrl || '').replace(/'/g, "\\'") + '\')">' +
            '<div class="cmfisio-player-dorsal">' + j.dorsal + '</div>' +
            '<div class="cmfisio-player-avatar">' + avatarContent + '</div>' +
            '<div class="cmfisio-semaforo ' + j.avail + '"></div>' +
            '<div class="cmfisio-player-info">' +
                '<div class="cmfisio-player-name">' + j.name + '</div>' +
                '<div class="cmfisio-player-meta"><span>' + j.position + '</span>' + teamTag + injuryTag + sesionTag + '</div>' +
            '</div></div>';
    });
    grid.innerHTML = html;
}


// ========== FILTROS ==========
function cmFisioFiltrarEquipo(val) { cmFisioFiltroEquipo = val; cmFisioRenderJugadores(); }
function cmFisioFiltrarEstado(estado, btn) {
    cmFisioFiltroEstado = estado;
    document.querySelectorAll('.cmfisio-stat').forEach(function(s) { s.classList.remove('active-filter'); });
    if (btn) btn.classList.add('active-filter');
    cmFisioRenderJugadores();
}


// ========== ABRIR FICHA ==========
async function cmFisioAbrirFicha(playerId, playerName, photoUrl) {
    cmFisioJugadorActual = playerId;
    cmFisioTabActiva = 'lesiones';

    var ficha = document.getElementById('cmfisio-ficha');
    var overlay = document.getElementById('cmfisio-ficha-overlay');

    var avatarHtml = '';
    if (photoUrl) { avatarHtml = '<div class="cmfisio-player-avatar" style="width:36px;height:36px;"><img src="' + photoUrl + '"></div>'; }

    ficha.innerHTML =
        '<div class="cmfisio-ficha-header"><h3>' + avatarHtml + playerName + '</h3><button class="cmfisio-ficha-close" onclick="cmFisioCerrarFicha()">x</button></div>' +
        '<div class="cmfisio-tabs">' +
            '<button class="cmfisio-tab active" onclick="cmFisioCambiarTab(\'lesiones\',this)">Lesiones</button>' +
            '<button class="cmfisio-tab" onclick="cmFisioCambiarTab(\'tratamientos\',this)">Tratamientos</button>' +
            '<button class="cmfisio-tab" onclick="cmFisioCambiarTab(\'sesiones\',this)">Sesiones</button>' +
            '<button class="cmfisio-tab" onclick="cmFisioCambiarTab(\'evolucion\',this)">Evolucion</button>' +
        '</div>' +
        '<div class="cmfisio-tab-content active" id="cmfisio-tab-lesiones"><div class="cmfisio-empty"><div class="icon">...</div><p>Cargando...</p></div></div>' +
        '<div class="cmfisio-tab-content" id="cmfisio-tab-tratamientos"></div>' +
        '<div class="cmfisio-tab-content" id="cmfisio-tab-sesiones"></div>' +
        '<div class="cmfisio-tab-content" id="cmfisio-tab-evolucion"></div>';

    overlay.style.display = 'flex';
    await cmFisioCargarLesiones(playerId);
}

function cmFisioCerrarFicha() {
    document.getElementById('cmfisio-ficha-overlay').style.display = 'none';
    cmFisioJugadorActual = null;
    cmFisioCargarJugadores();
}

function cmFisioCambiarTab(tab, btn) {
    cmFisioTabActiva = tab;
    document.querySelectorAll('.cmfisio-tab').forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');
    document.querySelectorAll('.cmfisio-tab-content').forEach(function(c) { c.classList.remove('active'); });
    document.getElementById('cmfisio-tab-' + tab).classList.add('active');
    var pid = cmFisioJugadorActual;
    if (tab === 'lesiones') cmFisioCargarLesiones(pid);
    if (tab === 'tratamientos') cmFisioCargarTratamientos(pid);
    if (tab === 'sesiones') cmFisioCargarSesiones(pid);
    if (tab === 'evolucion') cmFisioCargarEvolucion(pid);
}


// ========== TAB 1: LESIONES (SOLO LECTURA DEL MEDICO) ==========
async function cmFisioCargarLesiones(playerId) {
    var container = document.getElementById('cmfisio-tab-lesiones');

    // Semaforo actual
    var availRes = await supabaseClient.from('club_player_availability').select('status, notes').eq('club_id', clubId).eq('player_id', playerId).maybeSingle();
    var currentStatus = availRes.data ? availRes.data.status : 'unknown';

    // Lesiones del medico (solo lectura)
    var injRes = await supabaseClient.from('cm_med_injuries').select('*, cm_med_osiics_codes(description_es), cm_med_body_zones(zone_name_es)').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('injury_date', { ascending: false });
    var injuries = injRes.data || [];

    var statusLabels = { active: 'Activa', recovering: 'En recuperacion', rtp: 'Return-to-Play', discharged: 'Alta medica' };
    var lesionesHtml = '';
    if (injuries.length === 0) {
        lesionesHtml = '<div class="cmfisio-empty"><div class="icon">OK</div><p>Sin lesiones registradas por el medico</p></div>';
    } else {
        injuries.forEach(function(inj) {
            var fecha = new Date(inj.injury_date + 'T12:00:00').toLocaleDateString('es-ES');
            lesionesHtml += '<div class="cmfisio-injury-ro">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
                    '<div><div class="title">' + (inj.cm_med_body_zones ? inj.cm_med_body_zones.zone_name_es : 'Zona no especificada') + '<span class="ro-badge">Solo lectura</span></div>' +
                    '<div class="meta">' + fecha + ' | ' + (inj.cm_med_osiics_codes ? inj.cm_med_osiics_codes.description_es : inj.description || 'Sin diagnostico') + '</div></div>' +
                    '<span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:#1e293b;color:#94a3b8">' + (statusLabels[inj.status] || inj.status) + '</span>' +
                '</div>' +
                (inj.severity ? '<div class="meta" style="margin-top:4px">Severidad: ' + inj.severity + (inj.estimated_days ? ' | Est: ' + inj.estimated_days + ' dias' : '') + '</div>' : '') +
            '</div>';
        });
    }

    container.innerHTML =
        '<div style="margin-bottom:20px;padding:14px;background:#1e293b;border-radius:10px"><label style="color:#94a3b8;font-size:12px;font-weight:600;display:block;margin-bottom:8px">Disponibilidad actual</label><div class="cmfisio-semaforo-selector">' +
        '<button class="cmfisio-semaforo-btn btn-green' + (currentStatus==='green'?' selected':'') + '" onclick="cmFisioCambiarDisponibilidad(\'' + playerId + '\',\'green\',this)">Disponible</button>' +
        '<button class="cmfisio-semaforo-btn btn-amber' + (currentStatus==='amber'?' selected':'') + '" onclick="cmFisioCambiarDisponibilidad(\'' + playerId + '\',\'amber\',this)">Precaucion</button>' +
        '<button class="cmfisio-semaforo-btn btn-red' + (currentStatus==='red'?' selected':'') + '" onclick="cmFisioCambiarDisponibilidad(\'' + playerId + '\',\'red\',this)">Lesionado</button>' +
        '</div></div>' +
        '<h4 style="margin:0 0 12px;color:#e2e8f0;font-size:15px">Lesiones registradas por el medico</h4>' +
        '<p style="color:#64748b;font-size:12px;margin:0 0 12px">Esta informacion es de solo lectura. Las lesiones las registra el departamento medico.</p>' +
        lesionesHtml;
}

async function cmFisioCambiarDisponibilidad(playerId, nuevoEstado, btn) {
    var res = await supabaseClient.from('club_player_availability').upsert({
        club_id: clubId, player_id: playerId, status: nuevoEstado,
        set_by_wp_user_id: usuario ? usuario.id : null, updated_at: new Date().toISOString()
    }, { onConflict: 'club_id,player_id' });

    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    document.querySelectorAll('.cmfisio-semaforo-btn').forEach(function(b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
    showToast('Disponibilidad actualizada');
}


// ========== TAB 2: TRATAMIENTOS ==========
async function cmFisioCargarTratamientos(playerId) {
    var container = document.getElementById('cmfisio-tab-tratamientos');
    var res = await supabaseClient.from('cm_fisio_treatments').select('*').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('created_at', { ascending: false });
    var treatments = res.data || [];

    var statusLabels = { active: 'Activo', paused: 'Pausado', completed: 'Completado', cancelled: 'Cancelado' };
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h4 style="margin:0;color:#e2e8f0">Planes de tratamiento</h4><button class="cmfisio-btn cmfisio-btn-primary cmfisio-btn-sm" onclick="cmFisioMostrarFormTratamiento()">+ Nuevo tratamiento</button></div>';
    html += '<div id="cmfisio-form-treatment-container"></div>';

    if (treatments.length === 0) {
        html += '<div class="cmfisio-empty"><div class="icon">--</div><p>Sin tratamientos. Crea uno para empezar a registrar sesiones.</p></div>';
    } else {
        treatments.forEach(function(t) {
            var fechaInicio = new Date(t.start_date + 'T12:00:00').toLocaleDateString('es-ES');
            var techs = (t.techniques_planned || []).map(function(tc) {
                var found = cmFisioTecnicasCatalog.find(function(cat) { return cat.code === tc; });
                return found ? found.name_es : tc;
            }).join(', ');
            html += '<div class="cmfisio-treatment-card ' + t.status + '">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
                    '<div><div style="color:#e2e8f0;font-weight:600;font-size:14px">' + t.title + '</div>' +
                    '<div style="color:#94a3b8;font-size:12px;margin-top:4px">Desde ' + fechaInicio + (t.frequency_per_week ? ' | ' + t.frequency_per_week + 'x/semana' : '') + '</div>' +
                    (t.objective ? '<div style="color:#94a3b8;font-size:12px;margin-top:2px">Objetivo: ' + t.objective + '</div>' : '') +
                    (techs ? '<div style="margin-top:6px">' + (t.techniques_planned || []).map(function(tc) { return '<span class="cmfisio-technique-tag">' + tc + '</span>'; }).join('') + '</div>' : '') +
                    '</div>' +
                    '<span style="padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:#1e293b;color:#94a3b8">' + (statusLabels[t.status] || t.status) + '</span>' +
                '</div>' +
                (t.status === 'active' ? '<div style="margin-top:10px;display:flex;gap:6px"><button class="cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm" onclick="event.stopPropagation();cmFisioCambiarEstadoTratamiento(\'' + t.id + '\',\'completed\')">Marcar completado</button><button class="cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm" onclick="event.stopPropagation();cmFisioCambiarEstadoTratamiento(\'' + t.id + '\',\'paused\')">Pausar</button></div>' : '') +
            '</div>';
        });
    }

    container.innerHTML = html;
}

function cmFisioMostrarFormTratamiento() {
    var container = document.getElementById('cmfisio-form-treatment-container');
    var techCheckboxes = '';
    var cats = {};
    cmFisioTecnicasCatalog.forEach(function(t) {
        if (!cats[t.category]) cats[t.category] = [];
        cats[t.category].push(t);
    });
    Object.keys(cats).forEach(function(cat) {
        techCheckboxes += '<div style="margin-bottom:8px"><div style="color:#64748b;font-size:11px;font-weight:600;margin-bottom:4px">' + cat + '</div><div class="cmfisio-tech-grid">';
        cats[cat].forEach(function(t) {
            techCheckboxes += '<label class="cmfisio-tech-check"><input type="checkbox" value="' + t.code + '"> ' + t.name_es + '</label>';
        });
        techCheckboxes += '</div></div>';
    });

    container.innerHTML =
        '<div style="background:#0f172a;border:1px solid #14b8a6;border-radius:10px;padding:16px;margin-bottom:14px">' +
        '<h4 style="margin:0 0 12px;color:#14b8a6;font-size:14px">Nuevo plan de tratamiento</h4>' +
        '<div class="cmfisio-form-group"><label>Titulo *</label><input type="text" id="cmfisio-treat-title" placeholder="Ej: Rehabilitacion rotura fibrilar isquio derecho"></div>' +
        '<div class="cmfisio-form-group"><label>Objetivo</label><textarea id="cmfisio-treat-objective" placeholder="Ej: Recuperar ROM completo y fuerza para vuelta a entrenamientos"></textarea></div>' +
        '<div class="cmfisio-form-row"><div class="cmfisio-form-group"><label>Fecha inicio *</label><input type="date" id="cmfisio-treat-start" value="' + new Date().toISOString().split('T')[0] + '"></div><div class="cmfisio-form-group"><label>Frecuencia (sesiones/semana)</label><input type="number" id="cmfisio-treat-freq" min="1" max="7" value="3"></div></div>' +
        '<div class="cmfisio-form-group"><label>Tecnicas planificadas</label>' + techCheckboxes + '</div>' +
        '<div class="cmfisio-form-group"><label>Notas</label><textarea id="cmfisio-treat-notes" placeholder="Observaciones adicionales..."></textarea></div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end"><button class="cmfisio-btn cmfisio-btn-secondary" onclick="document.getElementById(\'cmfisio-form-treatment-container\').innerHTML=\'\'">Cancelar</button><button class="cmfisio-btn cmfisio-btn-primary" onclick="cmFisioGuardarTratamiento()">Guardar tratamiento</button></div></div>';
}

async function cmFisioGuardarTratamiento() {
    var titulo = document.getElementById('cmfisio-treat-title').value.trim();
    var fechaInicio = document.getElementById('cmfisio-treat-start').value;
    if (!titulo) { showToast('El titulo es obligatorio', 'error'); return; }
    if (!fechaInicio) { showToast('La fecha de inicio es obligatoria', 'error'); return; }

    var tecnicas = [];
    document.querySelectorAll('#cmfisio-form-treatment-container .cmfisio-tech-check input:checked').forEach(function(cb) { tecnicas.push(cb.value); });

    var treatment = {
        club_id: clubId,
        player_id: cmFisioJugadorActual,
        title: titulo,
        objective: document.getElementById('cmfisio-treat-objective').value.trim() || null,
        start_date: fechaInicio,
        frequency_per_week: parseInt(document.getElementById('cmfisio-treat-freq').value) || null,
        techniques_planned: tecnicas.length > 0 ? tecnicas : null,
        notes: document.getElementById('cmfisio-treat-notes').value.trim() || null,
        status: 'active',
        created_by: usuario ? usuario.id : 0
    };

    var res = await supabaseClient.from('cm_fisio_treatments').insert(treatment);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Tratamiento creado');
    cmFisioCargarTratamientos(cmFisioJugadorActual);
}

async function cmFisioCambiarEstadoTratamiento(treatmentId, nuevoEstado) {
    var updateData = { status: nuevoEstado, updated_at: new Date().toISOString() };
    if (nuevoEstado === 'completed') updateData.actual_end_date = new Date().toISOString().split('T')[0];

    var res = await supabaseClient.from('cm_fisio_treatments').update(updateData).eq('id', treatmentId);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Estado actualizado');
    cmFisioCargarTratamientos(cmFisioJugadorActual);
}


// ========== TAB 3: SESIONES SOAP ==========
async function cmFisioCargarSesiones(playerId) {
    var container = document.getElementById('cmfisio-tab-sesiones');

    // Cargar tratamientos activos para el selector
    var treatRes = await supabaseClient.from('cm_fisio_treatments').select('id, title').eq('club_id', clubId).eq('player_id', playerId).eq('status', 'active').eq('archived', false);
    var treatments = treatRes.data || [];

    var sesRes = await supabaseClient.from('cm_fisio_sessions').select('*').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('session_date', { ascending: false }).order('time_start', { ascending: false }).limit(30);
    var sessions = sesRes.data || [];

    var recLabels = { apto: 'Apto', limitado: 'Limitado', no_disponible: 'No disponible' };
    var sessionHtml = '';
    if (sessions.length === 0) {
        sessionHtml = '<div class="cmfisio-empty"><div class="icon">--</div><p>Sin sesiones registradas</p></div>';
    } else {
        sessions.forEach(function(s) {
            var fecha = new Date(s.session_date + 'T12:00:00').toLocaleDateString('es-ES');
            var hora = '';
            if (s.time_start) hora = ' | ' + s.time_start.substring(0,5);
            if (s.time_end) hora += '-' + s.time_end.substring(0,5);
            var techs = (s.techniques_applied || []).map(function(tc) { return '<span class="cmfisio-technique-tag">' + tc + '</span>'; }).join('');
            var rec = s.coach_recommendation ? '<span class="cmfisio-recommendation ' + s.coach_recommendation + '">' + (recLabels[s.coach_recommendation] || s.coach_recommendation) + '</span>' : '';

            sessionHtml += '<div class="cmfisio-session-card">' +
                '<div class="cmfisio-session-date">' + fecha + hora + (s.pain_level !== null && s.pain_level !== undefined ? ' | Dolor: ' + s.pain_level + '/10' : '') + ' ' + rec + '</div>' +
                (s.soap_subjective ? '<div class="cmfisio-soap-section"><strong>S - Subjetivo</strong><p>' + s.soap_subjective + '</p></div>' : '') +
                (s.soap_objective ? '<div class="cmfisio-soap-section"><strong>O - Objetivo</strong><p>' + s.soap_objective + '</p></div>' : '') +
                (techs ? '<div class="cmfisio-soap-section"><strong>A - Tecnicas aplicadas</strong><div style="margin-top:4px">' + techs + '</div>' + (s.soap_action ? '<p>' + s.soap_action + '</p>' : '') + '</div>' : '') +
                (s.soap_plan ? '<div class="cmfisio-soap-section"><strong>P - Plan</strong><p>' + s.soap_plan + '</p></div>' : '') +
                (s.coach_note ? '<div class="cmfisio-soap-section"><strong>Nota para el entrenador</strong><p>' + s.coach_note + '</p></div>' : '') +
            '</div>';
        });
    }

    // Selector de tratamiento
    var treatOpts = '<option value="">Sin tratamiento asociado</option>';
    treatments.forEach(function(t) { treatOpts += '<option value="' + t.id + '">' + t.title + '</option>'; });

    // Checkboxes tecnicas
    var techChecks = '';
    var cats = {};
    cmFisioTecnicasCatalog.forEach(function(t) {
        if (!cats[t.category]) cats[t.category] = [];
        cats[t.category].push(t);
    });
    Object.keys(cats).forEach(function(cat) {
        techChecks += '<div style="margin-bottom:6px"><div style="color:#64748b;font-size:11px;font-weight:600;margin-bottom:3px">' + cat + '</div><div class="cmfisio-tech-grid">';
        cats[cat].forEach(function(t) {
            techChecks += '<label class="cmfisio-tech-check"><input type="checkbox" value="' + t.code + '"> ' + t.name_es + '</label>';
        });
        techChecks += '</div></div>';
    });

    container.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h4 style="margin:0;color:#e2e8f0">Sesiones de fisioterapia</h4><button class="cmfisio-btn cmfisio-btn-primary cmfisio-btn-sm" id="cmfisio-btn-new-session" onclick="document.getElementById(\'cmfisio-form-session\').style.display=document.getElementById(\'cmfisio-form-session\').style.display===\'none\'?\'block\':\'none\'">+ Nueva sesion</button></div>' +
        '<div id="cmfisio-form-session" style="display:none;background:#0f172a;border:1px solid #14b8a6;border-radius:10px;padding:16px;margin-bottom:14px">' +
            '<h4 style="margin:0 0 12px;color:#14b8a6;font-size:14px">Registrar sesion</h4>' +
            '<div class="cmfisio-form-row-3">' +
                '<div class="cmfisio-form-group"><label>Fecha *</label><input type="date" id="cmfisio-ses-date" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
                '<div class="cmfisio-form-group"><label>Hora inicio</label><input type="time" id="cmfisio-ses-start"></div>' +
                '<div class="cmfisio-form-group"><label>Hora fin</label><input type="time" id="cmfisio-ses-end"></div>' +
            '</div>' +
            '<div class="cmfisio-form-group"><label>Tratamiento asociado</label><select id="cmfisio-ses-treatment">' + treatOpts + '</select></div>' +
            '<div class="cmfisio-form-row">' +
                '<div class="cmfisio-form-group"><label>S - Subjetivo (lo que dice el jugador)</label><textarea id="cmfisio-ses-subj" placeholder="Dolor, sensaciones, molestias..."></textarea></div>' +
                '<div class="cmfisio-form-group"><label>Nivel de dolor (0-10)</label><input type="range" id="cmfisio-ses-pain" min="0" max="10" value="0" oninput="document.getElementById(\'cmfisio-pain-val\').textContent=this.value" style="width:100%"><div style="text-align:center;color:#14b8a6;font-weight:700;font-size:18px" id="cmfisio-pain-val">0</div></div>' +
            '</div>' +
            '<div class="cmfisio-form-group"><label>O - Objetivo (lo que observas)</label><textarea id="cmfisio-ses-obj" placeholder="ROM, fuerza, inflamacion, test funcional..."></textarea></div>' +
            '<div class="cmfisio-form-group"><label>A - Tecnicas aplicadas</label>' + techChecks + '</div>' +
            '<div class="cmfisio-form-group"><label>Detalle de la actuacion</label><textarea id="cmfisio-ses-action" placeholder="Descripcion detallada de lo realizado..."></textarea></div>' +
            '<div class="cmfisio-form-group"><label>P - Plan para la proxima sesion</label><textarea id="cmfisio-ses-plan" placeholder="Progresion, ejercicios para casa, objetivo proxima sesion..."></textarea></div>' +
            '<div class="cmfisio-form-row">' +
                '<div class="cmfisio-form-group"><label>Recomendacion para el entrenador</label><select id="cmfisio-ses-rec"><option value="">-- Sin recomendacion --</option><option value="apto">Apto para entrenar</option><option value="limitado">Limitado (sin contacto, sin impacto...)</option><option value="no_disponible">No disponible</option></select></div>' +
                '<div class="cmfisio-form-group"><label>Nota para el entrenador</label><input type="text" id="cmfisio-ses-coach-note" placeholder="Breve nota para el parte diario..."></div>' +
            '</div>' +
            '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px"><button class="cmfisio-btn cmfisio-btn-secondary" onclick="document.getElementById(\'cmfisio-form-session\').style.display=\'none\'">Cancelar</button><button class="cmfisio-btn cmfisio-btn-primary" onclick="cmFisioGuardarSesion()">Guardar sesion</button></div>' +
        '</div>' +
        '<div id="cmfisio-sessions-list">' + sessionHtml + '</div>';
}

async function cmFisioGuardarSesion() {
    var fecha = document.getElementById('cmfisio-ses-date').value;
    if (!fecha) { showToast('La fecha es obligatoria', 'error'); return; }

    var tecnicas = [];
    document.querySelectorAll('#cmfisio-form-session .cmfisio-tech-check input:checked').forEach(function(cb) { tecnicas.push(cb.value); });

    var session = {
        club_id: clubId,
        player_id: cmFisioJugadorActual,
        treatment_id: document.getElementById('cmfisio-ses-treatment').value || null,
        session_date: fecha,
        time_start: document.getElementById('cmfisio-ses-start').value || null,
        time_end: document.getElementById('cmfisio-ses-end').value || null,
        soap_subjective: document.getElementById('cmfisio-ses-subj').value.trim() || null,
        pain_level: parseInt(document.getElementById('cmfisio-ses-pain').value),
        soap_objective: document.getElementById('cmfisio-ses-obj').value.trim() || null,
        soap_action: document.getElementById('cmfisio-ses-action').value.trim() || null,
        techniques_applied: tecnicas.length > 0 ? tecnicas : null,
        soap_plan: document.getElementById('cmfisio-ses-plan').value.trim() || null,
        performed_by: usuario ? usuario.id : 0,
        coach_recommendation: document.getElementById('cmfisio-ses-rec').value || null,
        coach_note: document.getElementById('cmfisio-ses-coach-note').value.trim() || null
    };

    var res = await supabaseClient.from('cm_fisio_sessions').insert(session);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Sesion registrada');
    document.getElementById('cmfisio-form-session').style.display = 'none';
    cmFisioCargarSesiones(cmFisioJugadorActual);
}


// ========== TAB 4: EVOLUCION ==========
async function cmFisioCargarEvolucion(playerId) {
    var container = document.getElementById('cmfisio-tab-evolucion');

    var sesRes = await supabaseClient.from('cm_fisio_sessions').select('session_date, pain_level, techniques_applied, coach_recommendation').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('session_date').order('time_start');
    var sessions = sesRes.data || [];

    var treatRes = await supabaseClient.from('cm_fisio_treatments').select('title, status, start_date, actual_end_date, frequency_per_week').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('start_date', { ascending: false });
    var treatments = treatRes.data || [];

    if (sessions.length === 0) {
        container.innerHTML = '<div class="cmfisio-empty"><div class="icon">--</div><p>Sin sesiones registradas aun. Registra sesiones para ver la evolucion.</p></div>';
        return;
    }

    // Metricas
    var totalSesiones = sessions.length;
    var diasTratamiento = 0;
    if (sessions.length > 1) {
        var d1 = new Date(sessions[0].session_date + 'T12:00:00');
        var d2 = new Date(sessions[sessions.length - 1].session_date + 'T12:00:00');
        diasTratamiento = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    }
    var ultimoPain = sessions[sessions.length - 1].pain_level;
    var primerPain = sessions[0].pain_level;

    // Tratamientos resumen
    var treatHtml = '';
    treatments.forEach(function(t) {
        var statusColors = { active: '#14b8a6', paused: '#f59e0b', completed: '#22c55e', cancelled: '#64748b' };
        treatHtml += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
            '<div style="width:10px;height:10px;border-radius:50%;background:' + (statusColors[t.status] || '#475569') + '"></div>' +
            '<span style="color:#e2e8f0;font-size:13px">' + t.title + '</span>' +
            '<span style="color:#64748b;font-size:11px">(' + t.status + ')</span></div>';
    });

    container.innerHTML =
        '<h4 style="margin:0 0 16px;color:#e2e8f0">Evolucion del jugador</h4>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px">' +
            '<div style="background:#1e293b;border-radius:8px;padding:12px;text-align:center"><div style="font-size:24px;font-weight:700;color:#14b8a6">' + totalSesiones + '</div><div style="font-size:11px;color:#94a3b8">Sesiones totales</div></div>' +
            '<div style="background:#1e293b;border-radius:8px;padding:12px;text-align:center"><div style="font-size:24px;font-weight:700;color:#60a5fa">' + diasTratamiento + '</div><div style="font-size:11px;color:#94a3b8">Dias de tratamiento</div></div>' +
            '<div style="background:#1e293b;border-radius:8px;padding:12px;text-align:center"><div style="font-size:24px;font-weight:700;color:' + (ultimoPain <= 3 ? '#22c55e' : ultimoPain <= 6 ? '#f59e0b' : '#ef4444') + '">' + (ultimoPain !== null && ultimoPain !== undefined ? ultimoPain + '/10' : '-') + '</div><div style="font-size:11px;color:#94a3b8">Dolor actual</div></div>' +
            '<div style="background:#1e293b;border-radius:8px;padding:12px;text-align:center"><div style="font-size:24px;font-weight:700;color:' + (primerPain > ultimoPain ? '#22c55e' : '#f59e0b') + '">' + (primerPain !== null && primerPain !== undefined && ultimoPain !== null && ultimoPain !== undefined ? (primerPain > ultimoPain ? '-' : '+') + Math.abs(primerPain - ultimoPain) : '-') + '</div><div style="font-size:11px;color:#94a3b8">Variacion dolor</div></div>' +
        '</div>' +
        (treatHtml ? '<div style="background:#1e293b;border-radius:8px;padding:14px;margin-bottom:16px"><h4 style="margin:0 0 10px;color:#e2e8f0;font-size:14px">Tratamientos</h4>' + treatHtml + '</div>' : '') +
        '<div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:16px"><h4 style="margin:0 0 12px;color:#e2e8f0;font-size:14px">Evolucion del dolor</h4><canvas id="cmfisio-chart-pain"></canvas></div>';

    // Dibujar chart
    setTimeout(function() {
        var painCanvas = document.getElementById('cmfisio-chart-pain');
        if (!painCanvas || typeof Chart === 'undefined') return;
        var labels = sessions.map(function(s) { return new Date(s.session_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }); });
        var painData = sessions.map(function(s) { return s.pain_level !== null && s.pain_level !== undefined ? s.pain_level : null; });
        new Chart(painCanvas, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'Dolor', data: painData, borderColor: '#14b8a6', backgroundColor: 'rgba(20,184,166,0.1)', tension: 0.3, fill: true, pointRadius: 5, pointBackgroundColor: '#14b8a6' }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: '#1e293b' } }, y: { min: 0, max: 10, ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: '#334155' } } } }
        });
    }, 100);
}


// ========== INFORME DIARIO ==========
async function cmFisioGenerarInformeDiario() {
    var hoy = new Date().toISOString().split('T')[0];

    // Cargar sesiones de hoy
    var sesRes = await supabaseClient.from('cm_fisio_sessions').select('player_id, soap_action, techniques_applied, coach_recommendation, coach_note, pain_level').eq('club_id', clubId).eq('session_date', hoy).eq('performed_by', usuario ? usuario.id : 0).eq('archived', false);
    var sesiones = sesRes.data || [];

    if (sesiones.length === 0) {
        showToast('No tienes sesiones registradas hoy. Registra sesiones primero.', 'error');
        return;
    }

    // Obtener nombres de jugadores
    var playerIds = sesiones.map(function(s) { return s.player_id; });
    var playerRes = await supabaseClient.from('season_players').select('player_id, team_id, players(id, name)').in('player_id', playerIds);
    var playerMap = {};
    (playerRes.data || []).forEach(function(sp) {
        if (sp.players) playerMap[sp.players.id] = sp.players.name;
    });

    var teamMap = {};
    cmFisioEquipos.forEach(function(t) { teamMap[t.id] = t.name; });

    // Construir modal
    var playersHtml = '';
    sesiones.forEach(function(s, idx) {
        var nombre = playerMap[s.player_id] || 'Jugador';
        var techs = (s.techniques_applied || []).join(', ');
        var recLabels = { apto: 'Apto', limitado: 'Limitado', no_disponible: 'No disponible' };
        playersHtml += '<div class="cmfisio-report-player">' +
            '<div class="name">' + nombre + '</div>' +
            '<div style="display:flex;gap:6px;align-items:center">' +
                (s.pain_level !== null ? '<span style="color:#94a3b8;font-size:11px">Dolor: ' + s.pain_level + '/10</span>' : '') +
                (s.coach_recommendation ? '<span class="cmfisio-recommendation ' + s.coach_recommendation + '">' + (recLabels[s.coach_recommendation] || '') + '</span>' : '<select id="cmfisio-rep-rec-' + idx + '" style="background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:4px 8px;border-radius:4px;font-size:11px"><option value="apto">Apto</option><option value="limitado">Limitado</option><option value="no_disponible">No disponible</option></select>') +
            '</div>' +
        '</div>';
    });

    // Crear overlay
    var overlay = document.createElement('div');
    overlay.className = 'cmfisio-report-overlay';
    overlay.id = 'cmfisio-report-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML =
        '<div class="cmfisio-report-modal">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="margin:0;color:#e2e8f0;font-size:18px">Informe diario - ' + new Date().toLocaleDateString('es-ES') + '</h3><button style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer" onclick="document.getElementById(\'cmfisio-report-overlay\').remove()">x</button></div>' +
            '<p style="color:#94a3b8;font-size:13px;margin:0 0 16px">Jugadores tratados hoy (' + sesiones.length + '):</p>' +
            playersHtml +
            '<div class="cmfisio-form-group" style="margin-top:16px"><label>Observaciones generales</label><textarea id="cmfisio-report-notes" placeholder="Comentarios generales sobre la jornada, estado del vestuario, material necesario..."></textarea></div>' +
            '<div style="display:flex;gap:10px;justify-content:flex-end"><button class="cmfisio-btn cmfisio-btn-secondary" onclick="document.getElementById(\'cmfisio-report-overlay\').remove()">Cancelar</button><button class="cmfisio-btn cmfisio-btn-primary" onclick="cmFisioEnviarInforme()">Enviar al entrenador</button></div>' +
        '</div>';
    document.body.appendChild(overlay);
}

async function cmFisioEnviarInforme() {
    var hoy = new Date().toISOString().split('T')[0];

    // Recoger sesiones de hoy para el summary
    var sesRes = await supabaseClient.from('cm_fisio_sessions').select('player_id, techniques_applied, coach_recommendation, coach_note, pain_level').eq('club_id', clubId).eq('session_date', hoy).eq('performed_by', usuario ? usuario.id : 0).eq('archived', false);
    var sesiones = sesRes.data || [];

    var playerIds = sesiones.map(function(s) { return s.player_id; });
    var playerRes = await supabaseClient.from('season_players').select('player_id, team_id, players(id, name)').in('player_id', playerIds);
    var playerMap = {};
    (playerRes.data || []).forEach(function(sp) {
        if (sp.players) playerMap[sp.players.id] = sp.players.name;
    });

    var teamMap = {};
    cmFisioEquipos.forEach(function(t) { teamMap[t.id] = t.name; });

    var summary = sesiones.map(function(s) {
        return {
            player_id: s.player_id,
            name: playerMap[s.player_id] || 'Jugador',
            techniques: (s.techniques_applied || []).join(', '),
            recommendation: s.coach_recommendation || 'apto',
            note: s.coach_note || '',
            pain: s.pain_level
        };
    });

    var notesEl = document.getElementById('cmfisio-report-notes');
    var generalNotes = notesEl ? notesEl.value.trim() : '';
    var ahora = new Date().toISOString();

    // Guardar informe
    var reportRes = await supabaseClient.from('cm_fisio_daily_reports').upsert({
        club_id: clubId,
        report_date: hoy,
        physio_wp_user_id: usuario ? usuario.id : 0,
        players_summary: summary,
        general_notes: generalNotes || null,
        sent_at: ahora
    }, { onConflict: 'club_id,report_date,physio_wp_user_id' }).select().single();

    if (reportRes.error) { showToast('Error guardando informe: ' + reportRes.error.message, 'error'); return; }

    // Crear notificacion para el entrenador
    var fisioName = usuario ? (usuario.display_name || usuario.name || 'Fisio') : 'Fisio';
    var resumenTexto = summary.map(function(s) {
        var recIcon = s.recommendation === 'apto' ? 'OK' : s.recommendation === 'limitado' ? '!!' : 'NO';
        return recIcon + ' ' + s.name + (s.note ? ': ' + s.note : '');
    }).join(' | ');

    try {
        var notifRes = await supabaseClient.from('cm_notifications').insert({
            club_id: clubId,
            type: 'physio_report',
            title: 'Informe fisio - ' + fisioName,
            message: resumenTexto,
            icon: 'physio',
            related_type: 'cm_fisio_daily_reports',
            related_id: reportRes.data ? reportRes.data.id : null,
            target_permission: 'entrenamientos',
            created_by: usuario ? usuario.id : null
        });

        // Actualizar informe con el ID de notificacion
        if (notifRes.data && notifRes.data[0]) {
            await supabaseClient.from('cm_fisio_daily_reports').update({ notification_id: notifRes.data[0].id }).eq('id', reportRes.data.id);
        }
    } catch (e) { console.error('Error creando notificacion:', e); }

    showToast('Informe enviado al entrenador');
    var overlay = document.getElementById('cmfisio-report-overlay');
    if (overlay) overlay.remove();
}


// ========== AUTO-MONTAJE ==========
(function cmFisioAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 20) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (!cmPuedeVer('modulo_fisio')) { clearInterval(intervalo); return; }
        clearInterval(intervalo);

        if (document.getElementById('cm-tab-fisio')) return;
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;

        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-fisio';
        tab.setAttribute('onclick', "cambiarModulo('fisio', this)");
        tab.innerHTML = '<span class="tab-icon">💆</span><span>Fisio</span>';
        mainTabs.appendChild(tab);

        if (!document.getElementById('modulo-fisio')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-fisio';
            var ultModulo = document.querySelector('.vista-modulo:last-of-type');
            if (ultModulo && ultModulo.parentElement) { ultModulo.parentElement.insertBefore(vista, ultModulo.nextSibling); }
            else { document.body.appendChild(vista); }
        }

        if (typeof registrarModulo === 'function') { registrarModulo('fisio', function() { cmFisioInit('modulo-fisio'); }); }

        // Si habia pantalla "en desarrollo", ocultarla
        var pd = document.getElementById('cm-pantalla-desarrollo');
        if (pd) {
            pd.style.display = 'none';
            var mt = document.querySelector('.main-tabs');
            if (mt) mt.style.display = '';
            document.querySelectorAll('.vista-modulo').forEach(function(v) { v.style.display = ''; });
        }

        // Si es la unica pestana visible, activarla
        var tv = Array.from(document.querySelectorAll('.main-tab')).filter(function(t) { return t.style.display !== 'none'; });
        if (tv.length === 1 && tv[0].id === 'cm-tab-fisio') { cambiarModulo('fisio', tab); }

        console.log('[Panel Fisio] Auto-montado y registrado');
    }, 500);
})();
