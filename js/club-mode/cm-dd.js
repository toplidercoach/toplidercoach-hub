// ============================================================
// CM-DD.JS - Modulo Director Deportivo
// TopLiderCoach HUB - Club Mode - Oficina
// ============================================================
// Prefijo: cmDd | Tabs: Dashboard, 11 Ideal, Jugadores, Agentes, Gastos, Notas
// Permiso: direccion_deportiva
// Lee: 12 tablas cm_sc_* | Escribe: 4 tablas cm_dd_*
// ============================================================

// ========== ESTADO DEL MODULO ==========
var cmDdContainerId = null;
var cmDdTabActiva = 'dashboard';
var cmDdMiembros = [];
var cmDdSlDatos = [];
var cmDdSlFormacion = '1-4-3-3';
var cmDdJugadores = [];
var cmDdJugFiltroPos = '';
var cmDdJugFiltroPipe = '';
var cmDdJugFiltroBusq = '';
var cmDdJugSightings = [];
var cmDdJugReports = [];
var cmDdAgentes = [];
var cmDdAgentPlayers = [];
var cmDdInteracciones = [];
var cmDdGastos = [];
var cmDdGastoItems = [];
var cmDdGastoFiltro = '';
var cmDdNotas = [];
var cmDdNotaFiltro = '';
var cmDdCobPartidos = [];
var cmDdCobSemana = '';
var cmDdCobFiltroScout = '';
var cmDdFiltroCat = '';
var cmDdCompararIds = [];
var cmDdPlantilla = [];
var cmDdPlantillaEcon = [];
var cmDdPlantillaFormacion = '1-4-3-3';
var cmDdEquipos = [];
var cmDdPlayerSeasons = [];
var cmDdFiltroEquipo = '';


// ========== HELPERS ==========
function cmDdEsc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
}

function cmDdFechaCorta(d) {
    if (!d) return '';
    try { return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return d; }
}

var CMDD_CATEGORIAS = [
    { val: '', label: 'Todas las categorias' },
    { val: 'primer_equipo', label: 'Primer equipo' },
    { val: 'filial', label: 'Filial / B' },
    { val: 'juvenil', label: 'Juvenil' },
    { val: 'cadete', label: 'Cadete' },
    { val: 'infantil', label: 'Infantil' },
    { val: 'alevin', label: 'Alevin' },
    { val: 'otro', label: 'Otro' }
];

function cmDdSelectorCategoria(onChange) {
    var h = '<select onchange="' + onChange + '" style="background:#1e293b;border:1px solid #f59e0b44;color:#f59e0b;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600">';
    CMDD_CATEGORIAS.forEach(function(c) {
        h += '<option value="' + c.val + '"' + (cmDdFiltroCat === c.val ? ' selected' : '') + '>' + c.label + '</option>';
    });
    h += '</select>';
    return h;
}

function cmDdGetMiembroNombre(memberId) {
    if (!memberId) return '\u2014';
    var m = cmDdMiembros.find(function(x) { return x.id === memberId; });
    return m ? m.display_name : '\u2014';
}

function cmDdTienePermisoScouting(miembro) {
    if (!miembro || !miembro.club_roles) return false;
    var perms = miembro.club_roles.permissions;
    if (!perms || !perms.scouting) return false;
    return perms.scouting.ver === true || perms.scouting === true;
}


// ========== INICIALIZACION ==========
function cmDdInit(containerId) {
    var container = document.getElementById(containerId);
    if (!container) { console.error('cmDdInit: contenedor no encontrado:', containerId); return; }
    cmDdContainerId = containerId;
    cmDdRenderPanel(container);
    cmDdCambiarTab('dashboard');
}


// ========== RENDER DEL PANEL PRINCIPAL ==========
function cmDdRenderPanel(container) {
    container.innerHTML =
    '<style>' +
        '.cmdd-wrap{background:#0f172a;min-height:calc(100vh - 120px);padding:24px 20px;box-sizing:border-box}' +
        '.cmdd-panel{max-width:1200px;margin:0 auto}' +
        '.cmdd-header{margin-bottom:18px}' +
        '.cmdd-header h2{margin:0;color:#f1f5f9;font-size:20px;font-weight:700}' +
        '.cmdd-header .cmdd-sub{color:#94a3b8;font-size:12px;margin-top:2px}' +
        '.cmdd-tabs{display:flex;gap:0;border-bottom:1px solid #1e293b;margin-bottom:20px;flex-wrap:wrap}' +
        '.cmdd-tab{padding:10px 20px;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all .2s;font-family:inherit}' +
        '.cmdd-tab:hover{color:#e2e8f0}' +
        '.cmdd-tab.active{color:#f59e0b;border-bottom-color:#f59e0b}' +
        '.cmdd-tab-badge{display:inline-block;margin-left:6px;background:#334155;color:#94a3b8;font-size:10px;padding:1px 6px;border-radius:8px;font-weight:600}' +
        '.cmdd-empty{text-align:center;padding:60px 20px;color:#64748b;grid-column:1/-1}' +
        '.cmdd-empty .icon{font-size:48px;margin-bottom:14px}' +
        '.cmdd-empty h3{color:#e2e8f0;font-size:16px;margin:0 0 6px}' +
        '.cmdd-empty p{font-size:13px;margin:0;line-height:1.6}' +
        '.cmdd-btn{padding:8px 16px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s}' +
        '.cmdd-btn-primary{background:#f59e0b;color:#0f172a}.cmdd-btn-primary:hover{background:#d97706}' +
        '.cmdd-btn-secondary{background:#334155;color:#e2e8f0}.cmdd-btn-secondary:hover{background:#475569}' +
        '.cmdd-btn-success{background:#059669;color:#fff}.cmdd-btn-success:hover{background:#047857}' +
        '.cmdd-btn-danger{background:#dc2626;color:#fff}.cmdd-btn-danger:hover{background:#b91c1c}' +
        '.cmdd-btn-sm{padding:5px 12px;font-size:12px}' +
        '.cmdd-kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:20px}' +
        '.cmdd-kpi{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px;text-align:center;transition:all .2s}' +
        '.cmdd-kpi[style*="cursor"]:hover{border-color:#f59e0b;transform:translateY(-2px)}' +
        '.cmdd-kpi .value{font-size:28px;font-weight:700;color:#f59e0b;margin-bottom:2px}' +
        '.cmdd-kpi .label{font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.5px}' +
        '.cmdd-kpi.alert{border-color:#f59e0b;background:#1c1917}' +
        '.cmdd-kpi.alert .value{color:#ef4444}' +
        '.cmdd-section{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:18px;margin-bottom:16px}' +
        '.cmdd-section h3{margin:0 0 14px;color:#f1f5f9;font-size:15px;font-weight:700}' +
        '.cmdd-section-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}' +
        '.cmdd-list-item{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #0f172a;gap:8px;transition:background .15s}' +
        '.cmdd-list-item[style*="cursor"]:hover{background:#1e293b44;border-radius:6px;padding:8px 6px}' +
        '.cmdd-list-item:last-child{border-bottom:none}' +
        '.cmdd-list-name{color:#e2e8f0;font-size:13px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
        '.cmdd-list-value{color:#f59e0b;font-size:13px;font-weight:700;flex-shrink:0}' +
        '.cmdd-list-sub{color:#64748b;font-size:11px}' +
        '.cmdd-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap}' +
        '.cmdd-badge-sign{background:#052e16;color:#4ade80}' +
        '.cmdd-badge-watch{background:#422006;color:#fbbf24}' +
        '.cmdd-badge-discard{background:#450a0a;color:#fca5a5}' +
        '.cmdd-badge-submitted{background:#172554;color:#60a5fa}' +
        '.cmdd-badge-approved{background:#052e16;color:#4ade80}' +
        '.cmdd-badge-paid{background:#1e293b;color:#94a3b8}' +
        '.cmdd-pipeline-bar{display:flex;gap:4px;margin-top:10px}' +
        '.cmdd-pipe-seg{flex:1;height:8px;border-radius:4px;position:relative}' +
        '.cmdd-pipe-label{position:absolute;top:12px;left:0;font-size:9px;color:#64748b;white-space:nowrap}' +
        '.cmdd-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}' +
        '.cmdd-toolbar select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px;font-family:inherit;cursor:pointer}' +
        '.cmdd-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9500;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}' +
        '.cmdd-modal{background:#0f172a;border:1px solid #334155;border-radius:14px;width:100%;max-width:600px}' +
        '.cmdd-modal-header{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #1e293b}' +
        '.cmdd-modal-header h3{margin:0;color:#f1f5f9;font-size:17px}' +
        '.cmdd-modal-close{background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1}' +
        '.cmdd-modal-close:hover{color:#ef4444}' +
        '.cmdd-modal-body{padding:20px 22px}' +
        '.cmdd-modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid #1e293b;flex-wrap:wrap}' +
        '.cmdd-form-group{margin-bottom:14px}' +
        '.cmdd-form-group label{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}' +
        '.cmdd-form-group input,.cmdd-form-group select,.cmdd-form-group textarea{width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit;box-sizing:border-box}' +
        '.cmdd-form-group textarea{min-height:80px;resize:vertical}' +
        '.cmdd-form-group input:focus,.cmdd-form-group select:focus,.cmdd-form-group textarea:focus{border-color:#f59e0b;outline:none}' +
        '.cmdd-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
        '.cmdd-contador{color:#94a3b8;font-size:12px;margin-bottom:14px}' +
        '.cmdd-contador strong{color:#e2e8f0}' +
        '@media(max-width:640px){.cmdd-tabs{overflow-x:auto;flex-wrap:nowrap}.cmdd-tab{white-space:nowrap}.cmdd-wrap{padding:16px 12px}.cmdd-kpi-grid{grid-template-columns:repeat(2,1fr)}.cmdd-section-row{grid-template-columns:1fr}.cmdd-form-row{grid-template-columns:1fr}}' +
    '</style>' +
    '<div class="cmdd-wrap">' +
        '<div class="cmdd-panel">' +
            '<div class="cmdd-header">' +
                '<h2>&#127942; Direccion Deportiva</h2>' +
                '<div class="cmdd-sub">Panel de control del Director Deportivo</div>' +
            '</div>' +
            '<div class="cmdd-tabs">' +
                '<button class="cmdd-tab active" id="cmdd-tab-dashboard" onclick="cmDdCambiarTab(\'dashboard\',this)">Dashboard</button>' +
                '<button class="cmdd-tab" id="cmdd-tab-plantilla" onclick="cmDdCambiarTab(\'plantilla\',this)">Plantilla</button>' +
                '<button class="cmdd-tab" id="cmdd-tab-ideal" onclick="cmDdCambiarTab(\'ideal\',this)">11 Ideal</button>' +
                '<button class="cmdd-tab" id="cmdd-tab-jugadores" onclick="cmDdCambiarTab(\'jugadores\',this)">Jugadores</button>' +
                '<button class="cmdd-tab" id="cmdd-tab-agentes" onclick="cmDdCambiarTab(\'agentes\',this)">Agentes</button>' +
                '<button class="cmdd-tab" id="cmdd-tab-gastos" onclick="cmDdCambiarTab(\'gastos\',this)">Gastos</button>' +
                '<button class="cmdd-tab" id="cmdd-tab-cobertura" onclick="cmDdCambiarTab(\'cobertura\',this)">Cobertura</button>' +
                '<button class="cmdd-tab" id="cmdd-tab-notas" onclick="cmDdCambiarTab(\'notas\',this)">Notas</button>' +
            '</div>' +
            '<div id="cmdd-tab-content"></div>' +
        '</div>' +
    '</div>';
}


// ========== CAMBIO DE PESTANA ==========
function cmDdCambiarTab(tab, btn) {
    cmDdTabActiva = tab;
    document.querySelectorAll('.cmdd-tab').forEach(function(t) { t.classList.remove('active'); });
    if (btn) { btn.classList.add('active'); }
    else { var el = document.getElementById('cmdd-tab-' + tab); if (el) el.classList.add('active'); }

    var cont = document.getElementById('cmdd-tab-content');
    if (!cont) return;

    if (tab === 'dashboard')  { cmDdTabDashboard(cont); return; }
    if (tab === 'plantilla')  { cmDdTabPlantilla(cont); return; }
    if (tab === 'ideal')      { cmDdTabIdeal(cont); return; }
    if (tab === 'jugadores')  { cmDdTabJugadores(cont); return; }
    if (tab === 'agentes')    { cmDdTabAgentes(cont); return; }
    if (tab === 'gastos')     { cmDdTabGastos(cont); return; }
    if (tab === 'cobertura')  { cmDdTabCobertura(cont); return; }
    if (tab === 'notas')      { cmDdTabNotas(cont); return; }
}


// ============================================================
// TAB 1: DASHBOARD
// ============================================================

async function cmDdTabDashboard(cont) {
    cont.innerHTML = '<div class="cmdd-empty"><div class="icon">&#8987;</div><p>Cargando dashboard...</p></div>';

    // Cargar miembros del club si no estan
    if (cmDdMiembros.length === 0) {
        try {
            var res = await supabaseClient.from('club_members')
                .select('id, display_name, wp_user_id, role_id, club_roles(name, permissions)')
                .eq('club_id', clubId).eq('active', true);
            cmDdMiembros = res.data || [];
        } catch (e) { cmDdMiembros = []; }
    }

    // === Queries en paralelo ===
    var hoy = new Date().toISOString().split('T')[0];

    var [
        resPlayers,
        resMatches,
        resSightings,
        resExpenses,
        resAlerts,
        resAgents,
        resNotes
    ] = await Promise.all([
        // Jugadores por pipeline
        supabaseClient.from('cm_sc_players')
            .select('id, pipeline_status, sign_count, sightings_count, name, contract_until')
            .eq('club_id', clubId).eq('archived', false),
        // Partidos scouted
        supabaseClient.from('cm_sc_matches')
            .select('id, match_date, home_team, away_team, assigned_to, assigned_by, status, competition, venue, kick_off_time')
            .eq('club_id', clubId).eq('archived', false)
            .order('match_date', { ascending: false })
            .limit(200),
        // Avistamientos (para actividad scouts)
        supabaseClient.from('cm_sc_player_sightings')
            .select('scout_id, created_at')
            .eq('club_id', clubId).eq('archived', false),
        // Gastos pendientes
        supabaseClient.from('cm_sc_expense_reports')
            .select('id, scout_id, status, total_amount_cents, title, submitted_at')
            .eq('club_id', clubId).eq('archived', false)
            .in('status', ['submitted', 'approved']),
        // Alertas consenso (jugadores con 3+ sign)
        supabaseClient.from('cm_sc_players')
            .select('id, name, sign_count, sightings_count, current_club, pipeline_status, target_category')
            .eq('club_id', clubId).eq('archived', false)
            .gte('sign_count', 3),
        // Total agentes
        supabaseClient.from('cm_dd_agents')
            .select('id', { count: 'exact', head: true })
            .eq('club_id', clubId).eq('archived', false),
        // Total notas
        supabaseClient.from('cm_dd_notes')
            .select('id', { count: 'exact', head: true })
            .eq('club_id', clubId).eq('archived', false)
    ]);

    var players = resPlayers.data || [];
    var matches = resMatches.data || [];
    var sightings = resSightings.data || [];
    var expenses = resExpenses.data || [];
    var alerts = resAlerts.data || [];
    var totalAgentes = resAgents.count || 0;
    var totalNotas = resNotes.count || 0;

    // === Calcular KPIs ===
    var totalPartidos = matches.length;
    var gastosPendientes = expenses.filter(function(e) { return e.status === 'submitted'; });
    var gastosAprobados = expenses.filter(function(e) { return e.status === 'approved'; });

    // === RENDER ===
    var h = '';

    // Selector de categoria
    h += '<div style="margin-bottom:14px;display:flex;align-items:center;gap:8px">';
    h += '<span style="color:#94a3b8;font-size:12px;font-weight:600">Categoria:</span>';
    h += cmDdSelectorCategoria("cmDdFiltroCat=this.value;cmDdTabDashboard(document.getElementById('cmdd-tab-content'))");
    h += '</div>';

    // Filtrar por categoria si esta seleccionada
    if (cmDdFiltroCat) {
        players = players.filter(function(p) { return p.target_category === cmDdFiltroCat; });
        alerts = alerts.filter(function(a) { return a.target_category === cmDdFiltroCat; });
    }

    var totalJugadores = players.length;

    // Pipeline counts (despues del filtro)
    var pipeStates = ['identified', 'observed', 'tracking', 'contacted', 'signed', 'discarded'];
    var pipeCounts = {};
    pipeStates.forEach(function(s) { pipeCounts[s] = 0; });
    players.forEach(function(p) {
        if (pipeCounts[p.pipeline_status] !== undefined) pipeCounts[p.pipeline_status]++;
    });

    // Contratos que expiran en 6 meses
    var en6meses = new Date();
    en6meses.setMonth(en6meses.getMonth() + 6);
    var contratosCerca = players.filter(function(p) {
        if (!p.contract_until) return false;
        var d = new Date(p.contract_until + 'T12:00:00');
        return d <= en6meses && p.pipeline_status !== 'discarded' && p.pipeline_status !== 'signed';
    });

    // Actividad scouts (ultimos 7 dias)
    var hace7dias = new Date();
    hace7dias.setDate(hace7dias.getDate() - 7);
    var scoutActivos = {};
    sightings.forEach(function(s) {
        if (new Date(s.created_at) >= hace7dias) {
            if (!scoutActivos[s.scout_id]) scoutActivos[s.scout_id] = 0;
            scoutActivos[s.scout_id]++;
        }
    });

    // Scouts que tienen permiso de scouting
    var scoutMembers = cmDdMiembros.filter(cmDdTienePermisoScouting);

    // Proximos partidos (fecha >= hoy)
    var proximosPartidos = matches.filter(function(m) { return m.match_date && m.match_date >= hoy; })
        .sort(function(a, b) { return a.match_date < b.match_date ? -1 : 1; })
        .slice(0, 10);

    // KPIs principales (clicables)
    h += '<div class="cmdd-kpi-grid">';
    h += '<div class="cmdd-kpi" style="cursor:pointer" onclick="cmDdCambiarTab(\'jugadores\')"><div class="value">' + totalJugadores + '</div><div class="label">Jugadores scouted</div></div>';
    h += '<div class="cmdd-kpi" style="cursor:pointer" onclick="cmDdCambiarTab(\'cobertura\')"><div class="value">' + totalPartidos + '</div><div class="label">Partidos observados</div></div>';
    h += '<div class="cmdd-kpi' + (alerts.length > 0 ? ' alert' : '') + '" style="cursor:pointer" onclick="cmDdCambiarTab(\'jugadores\')"><div class="value">' + alerts.length + '</div><div class="label">Alertas consenso</div></div>';
    h += '<div class="cmdd-kpi' + (gastosPendientes.length > 0 ? ' alert' : '') + '" style="cursor:pointer" onclick="cmDdCambiarTab(\'gastos\')"><div class="value">' + gastosPendientes.length + '</div><div class="label">Gastos por aprobar</div></div>';
    h += '<div class="cmdd-kpi" style="cursor:pointer" onclick="cmDdCambiarTab(\'agentes\')"><div class="value">' + totalAgentes + '</div><div class="label">Agentes en CRM</div></div>';
    h += '<div class="cmdd-kpi" style="cursor:pointer" onclick="cmDdCambiarTab(\'cobertura\')"><div class="value">' + Object.keys(scoutActivos).length + '/' + scoutMembers.length + '</div><div class="label">Scouts activos (7d)</div></div>';
    h += '</div>';

    // Pipeline visual
    h += '<div class="cmdd-section">';
    h += '<h3>Pipeline de jugadores</h3>';
    var pipeLabels = { identified: 'Identificado', observed: 'Observado', tracking: 'Seguimiento', contacted: 'Contactado', signed: 'Fichado', discarded: 'Descartado' };
    var pipeColors = { identified: '#64748b', observed: '#3b82f6', tracking: '#f59e0b', contacted: '#a855f7', signed: '#22c55e', discarded: '#ef4444' };
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">';
    pipeStates.forEach(function(s) {
        h += '<div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#0f172a;border-radius:8px;border:1px solid ' + pipeColors[s] + '33;cursor:pointer" onclick="cmDdJugFiltroPipe=\x27' + s + '\x27;cmDdCambiarTab(\x27jugadores\x27)">';
        h += '<span style="color:' + pipeColors[s] + ';font-size:20px;font-weight:700">' + pipeCounts[s] + '</span>';
        h += '<span style="color:#94a3b8;font-size:11px">' + pipeLabels[s] + '</span>';
        h += '</div>';
    });
    h += '</div>';
    // Barra visual
    if (totalJugadores > 0) {
        h += '<div style="display:flex;gap:2px;height:10px;border-radius:5px;overflow:hidden;background:#0f172a">';
        pipeStates.forEach(function(s) {
            var pct = (pipeCounts[s] / totalJugadores) * 100;
            if (pct > 0) {
                h += '<div style="width:' + pct + '%;background:' + pipeColors[s] + ';min-width:2px" title="' + pipeLabels[s] + ': ' + pipeCounts[s] + '"></div>';
            }
        });
        h += '</div>';
    }
    h += '</div>';

    // Dos columnas: Alertas + Actividad scouts
    h += '<div class="cmdd-section-row">';

    // Alertas de consenso
    h += '<div class="cmdd-section">';
    h += '<h3>&#9888;&#65039; Alertas de consenso</h3>';
    if (alerts.length === 0) {
        h += '<div style="color:#64748b;font-size:13px;padding:10px 0;text-align:center">Sin alertas. Aparecen cuando 3+ scouts recomiendan fichar al mismo jugador.</div>';
    } else {
        alerts.forEach(function(a) {
            h += '<div class="cmdd-list-item" style="cursor:pointer" onclick="cmDdJugadores=[];cmDdCambiarTab(\x27jugadores\x27);setTimeout(function(){cmDdAbrirJugador(\x27' + a.id + '\x27)},500)">';
            h += '<div style="flex:1;min-width:0">';
            h += '<div class="cmdd-list-name">' + cmDdEsc(a.name) + '</div>';
            h += '<div class="cmdd-list-sub">' + cmDdEsc(a.current_club || '') + ' \u00B7 ' + (a.sightings_count || 0) + ' avistamientos</div>';
            h += '</div>';
            h += '<div style="text-align:center">';
            h += '<span style="color:#4ade80;font-weight:700;font-size:16px">' + a.sign_count + '</span>';
            h += '<div style="color:#64748b;font-size:9px">fichar</div>';
            h += '</div>';
            h += '</div>';
        });
    }
    h += '</div>';

    // Actividad de scouts
    h += '<div class="cmdd-section">';
    h += '<h3>&#128200; Actividad scouts (7 dias)</h3>';
    if (scoutMembers.length === 0) {
        h += '<div style="color:#64748b;font-size:13px;padding:10px 0;text-align:center">No hay miembros con permiso de scouting.</div>';
    } else {
        scoutMembers.forEach(function(m) {
            var count = scoutActivos[m.id] || 0;
            var color = count > 0 ? '#4ade80' : '#ef4444';
            var statusText = count > 0 ? count + ' avistamientos' : 'Sin actividad';
            h += '<div class="cmdd-list-item">';
            h += '<div class="cmdd-list-name">' + cmDdEsc(m.display_name) + '</div>';
            h += '<div style="display:flex;align-items:center;gap:6px">';
            h += '<div style="width:8px;height:8px;border-radius:50%;background:' + color + '"></div>';
            h += '<span style="color:' + color + ';font-size:12px;font-weight:600">' + statusText + '</span>';
            h += '</div>';
            h += '</div>';
        });
    }
    h += '</div>';

    h += '</div>'; // fin section-row

    // Dos columnas: Gastos pendientes + Proximos partidos
    h += '<div class="cmdd-section-row">';

    // Gastos pendientes
    h += '<div class="cmdd-section">';
    h += '<h3>&#128176; Gastos pendientes</h3>';
    if (gastosPendientes.length === 0 && gastosAprobados.length === 0) {
        h += '<div style="color:#64748b;font-size:13px;padding:10px 0;text-align:center">No hay gastos pendientes de gestion.</div>';
    } else {
        var todosGastos = gastosPendientes.concat(gastosAprobados).slice(0, 6);
        todosGastos.forEach(function(g) {
            var amount = g.total_amount_cents ? (g.total_amount_cents / 100).toFixed(2) + ' \u20AC' : '\u2014';
            var badgeClass = g.status === 'submitted' ? 'cmdd-badge-submitted' : 'cmdd-badge-approved';
            var badgeLabel = g.status === 'submitted' ? 'Pendiente' : 'Aprobado';
            h += '<div class="cmdd-list-item" style="cursor:pointer" onclick="cmDdCambiarTab(\x27gastos\x27)">';
            h += '<div style="flex:1;min-width:0">';
            h += '<div class="cmdd-list-name">' + cmDdEsc(g.title || 'Sin titulo') + '</div>';
            h += '<div class="cmdd-list-sub">' + cmDdGetMiembroNombre(g.scout_id) + '</div>';
            h += '</div>';
            h += '<div style="display:flex;align-items:center;gap:8px">';
            h += '<span style="color:#e2e8f0;font-size:13px;font-weight:600">' + amount + '</span>';
            h += '<span class="cmdd-badge ' + badgeClass + '">' + badgeLabel + '</span>';
            h += '</div>';
            h += '</div>';
        });
        if (gastosPendientes.length > 6) {
            h += '<div style="text-align:center;margin-top:8px"><button class="cmdd-btn cmdd-btn-sm cmdd-btn-secondary" onclick="cmDdCambiarTab(\'gastos\')">Ver todos (' + gastosPendientes.length + ')</button></div>';
        }
    }
    h += '</div>';

    // Proximos partidos con asignacion
    h += '<div class="cmdd-section">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
    h += '<h3 style="margin:0">&#128197; Proximos partidos (' + proximosPartidos.length + ')</h3>';
    h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-primary" onclick="cmDdModalPartido()">+ Agendar partido</button>';
    h += '</div>';
    if (proximosPartidos.length === 0) {
        h += '<div style="color:#64748b;font-size:13px;padding:10px 0;text-align:center">Sin partidos programados. Agenda partidos y asignalos a tus scouts.</div>';
    } else {
        proximosPartidos.forEach(function(m) {
            var sinAsignar = !m.assigned_to;
            h += '<div class="cmdd-list-item" style="' + (sinAsignar ? 'border-left:3px solid #ef4444;padding-left:8px' : '') + '">';
            h += '<div style="flex:1;min-width:0;cursor:pointer" onclick="cmDdCobPartidos=[];cmDdModalPartido(\x27' + m.id + '\x27)">';
            h += '<div class="cmdd-list-name">' + cmDdEsc(m.home_team) + ' vs ' + cmDdEsc(m.away_team) + '</div>';
            h += '<div class="cmdd-list-sub">' + cmDdFechaCorta(m.match_date) +
                (m.kick_off_time ? ' ' + m.kick_off_time.substring(0, 5) : '') +
                (m.competition ? ' \u00B7 ' + cmDdEsc(m.competition) : '') +
                (m.venue ? ' \u00B7 ' + cmDdEsc(m.venue) : '') + '</div>';
            h += '</div>';
            if (sinAsignar) {
                h += '<select onchange="cmDdAsignarScout(\x27' + m.id + '\x27,this.value)" style="background:#1e293b;border:1px solid #ef4444;color:#fca5a5;padding:4px 8px;border-radius:4px;font-size:11px">';
                h += '<option value="">Sin asignar</option>';
                scoutMembers.forEach(function(sm) {
                    h += '<option value="' + sm.id + '">' + cmDdEsc(sm.display_name) + '</option>';
                });
                h += '</select>';
            } else {
                h += '<div style="display:flex;align-items:center;gap:6px">';
                h += '<div style="width:8px;height:8px;border-radius:50%;background:#22c55e"></div>';
                h += '<span style="color:#e2e8f0;font-size:12px">' + cmDdGetMiembroNombre(m.assigned_to) + '</span>';
                h += '</div>';
            }
            h += '</div>';
        });
    }
    // Partidos pasados sin asignar
    var pasadosSinAsignar = matches.filter(function(m) { return m.match_date && m.match_date < hoy && !m.assigned_to; });
    if (pasadosSinAsignar.length > 0) {
        h += '<div style="margin-top:8px;padding:6px 10px;background:#450a0a33;border-radius:6px;color:#fca5a5;font-size:11px">\u26a0 ' + pasadosSinAsignar.length + ' partidos pasados sin scout asignado</div>';
    }
    h += '</div>';

    h += '</div>'; // fin section-row

    // Contratos expirando
    if (contratosCerca.length > 0) {
        h += '<div class="cmdd-section">';
        h += '<h3>&#9200; Contratos expiran en 6 meses (' + contratosCerca.length + ')</h3>';
        contratosCerca.slice(0, 8).forEach(function(p) {
            h += '<div class="cmdd-list-item" style="cursor:pointer" onclick="cmDdJugadores=[];cmDdCambiarTab(\x27jugadores\x27);setTimeout(function(){cmDdAbrirJugador(\x27' + p.id + '\x27)},500)">';
            h += '<div class="cmdd-list-name">' + cmDdEsc(p.name) + '</div>';
            h += '<div class="cmdd-list-value">' + cmDdFechaCorta(p.contract_until) + '</div>';
            h += '</div>';
        });
        h += '</div>';
    }

    cont.innerHTML = h;
}


// ============================================================
// TAB 2: 11 IDEAL (Shadow Team)
// ============================================================

async function cmDdEnsureJugadoresCargados() {
    if (cmDdJugadores.length > 0) return;
    try {
        var res = await supabaseClient.from('cm_sc_players')
            .select('id, name, first_name, last_name, current_club, current_league, nationality, position_primary, position_secondary, dominant_foot, height_cm, weight_kg, birth_date, estimated_cost, pipeline_status, priority, contract_until, rating_overall, sightings_count, scouts_count, sign_count, agent_name, agent_contact, photo_url, notes, target_category')
            .eq('club_id', clubId).eq('archived', false);
        cmDdJugadores = res.data || [];
    } catch (e) { cmDdJugadores = []; }
}

async function cmDdTabIdeal(cont) {
    cont.innerHTML = '<div class="cmdd-empty"><div class="icon">&#8987;</div><p>Cargando 11 ideal...</p></div>';
    await cmDdEnsureJugadoresCargados();

    // Cargar avistamientos con posicion/formacion
    try {
        var res = await supabaseClient.from('cm_sc_player_sightings')
            .select('player_id, observed_position, observed_formation, rating_quick, tag, scout_id')
            .eq('club_id', clubId).eq('archived', false)
            .not('observed_position', 'is', null);
        cmDdSlDatos = res.data || [];
    } catch (e) { cmDdSlDatos = []; }

    cmDdRenderIdeal();
}

function cmDdRenderIdeal() {
    var cont = document.getElementById('cmdd-tab-content');
    if (!cont) return;

    // Selector de formacion + categoria
    var h = '<div class="cmdd-toolbar">' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
            cmDdSelectorCategoria("cmDdFiltroCat=this.value;cmDdRenderIdeal()") +
            '<span style="color:#94a3b8;font-size:13px;font-weight:600">Formacion:</span>';
    CMSC_FORMACIONES.forEach(function(f) {
        var isActive = cmDdSlFormacion === f;
        h += '<button class="cmdd-btn cmdd-btn-sm" onclick="cmDdSlFormacion=\x27' + f + '\x27;cmDdRenderIdeal()" ' +
            'style="' + (isActive ? 'background:#f59e0b;color:#0f172a' : 'background:#1e293b;color:#94a3b8;border:1px solid #334155') + '">' + f + '</button>';
    });
    h += '</div>';

    // Filtrar jugadores por categoria, luego filtrar datos por esos jugadores
    var jugadoresFiltrados = cmDdJugadores;
    if (cmDdFiltroCat) {
        jugadoresFiltrados = cmDdJugadores.filter(function(j) { return j.target_category === cmDdFiltroCat; });
    }
    var idsValidos = jugadoresFiltrados.map(function(j) { return j.id; });
    var datosFormacion = cmDdSlDatos.filter(function(d) {
        return d.observed_formation === cmDdSlFormacion && (!cmDdFiltroCat || idsValidos.indexOf(d.player_id) >= 0);
    });
    h += '<span class="cmdd-contador"><strong>' + datosFormacion.length + '</strong> observaciones en ' + cmDdSlFormacion + (cmDdFiltroCat ? ' (' + cmDdFiltroCat.replace('_', ' ') + ')' : '') + '</span>';
    h += '</div>';

    // Calcular top jugadores por posicion (usando datos filtrados)
    var positions = CMSC_POSICIONES_MAP[cmDdSlFormacion] || [];
    var coords = CMSC_POS_COORDS[cmDdSlFormacion] || {};
    var topPorPosicion = {};

    positions.forEach(function(pos) {
        var sightingsPos = datosFormacion.filter(function(d) {
            return d.observed_position === pos;
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
            var player = cmDdJugadores.find(function(j) { return j.id === pid; }) || {};
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

    // === Campo de futbol visual ===
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
        var x = coord[0]; var y = 100 - coord[1];
        var top5 = topPorPosicion[pos] || [];
        var best = top5[0];

        var bgColor = best ? '#f59e0b' : '#334155';
        var nameStr = best ? best.name.split(' ').pop() : '-';
        var ratingStr = best ? best.rating.toFixed(1) : '';
        var textColor = best ? '#0f172a' : '#fff';

        h += '<div style="position:absolute;left:' + x + '%;top:' + y + '%;transform:translate(-50%,-50%);text-align:center;cursor:pointer;z-index:2" ' +
            'onclick="cmDdSlMostrarPosicion(\x27' + pos + '\x27)">' +
            '<div style="width:46px;height:46px;border-radius:50%;background:' + bgColor + ';margin:0 auto;display:flex;align-items:center;justify-content:center;' +
                'border:2px solid rgba(255,255,255,.3);box-shadow:0 2px 8px rgba(0,0,0,.4)">' +
                '<span style="color:' + textColor + ';font-size:11px;font-weight:700">' + (ratingStr || pos) + '</span>' +
            '</div>' +
            '<div style="color:#fff;font-size:9px;font-weight:600;margin-top:2px;text-shadow:0 1px 3px rgba(0,0,0,.8)">' + cmDdEsc(nameStr) + '</div>' +
            '<div style="color:rgba(255,255,255,.6);font-size:8px">' + (CMSC_POS_NOMBRES[pos] || pos) + '</div>' +
        '</div>';
    });
    h += '</div>';

    // Panel de detalle de posicion
    h += '<div id="cmdd-sl-pos-detail"></div>';

    // Info si no hay datos
    if (datosFormacion.length === 0) {
        h += '<div style="text-align:center;margin-top:16px;padding:20px;background:#1e293b;border-radius:10px;color:#94a3b8;font-size:13px">' +
            'Sin datos para ' + cmDdSlFormacion + '. Los jugadores apareceran cuando los scouts registren posicion y formacion en los avistamientos.' +
        '</div>';
    }

    cont.innerHTML = h;
}


// Detalle de posicion: top 5 jugadores
function cmDdSlMostrarPosicion(pos) {
    var cont = document.getElementById('cmdd-sl-pos-detail');
    if (!cont) return;

    var sightingsPos = cmDdSlDatos.filter(function(d) {
        return d.observed_formation === cmDdSlFormacion && d.observed_position === pos;
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
        var player = cmDdJugadores.find(function(j) { return j.id === pid; }) || {};
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
    var pipeLabels = { identified:'Identificado', observed:'Observado', tracking:'Seguimiento', contacted:'Contactado', signed:'Fichado', discarded:'Descartado' };

    var h = '<div class="cmdd-section" style="margin-top:16px">' +
        '<h3>' + pos + ' \u2014 ' + posLabel + ' <span class="cmdd-tab-badge">' + ranked.length + ' jugadores</span></h3>';

    if (top5.length === 0) {
        h += '<div style="color:#64748b;font-size:13px;padding:16px 0;text-align:center">Sin jugadores observados en esta posicion para ' + cmDdSlFormacion + '</div>';
    } else {
        h += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
            '<thead><tr style="border-bottom:1px solid #334155">' +
                '<th style="text-align:center;padding:6px;color:#94a3b8;width:30px">#</th>' +
                '<th style="text-align:left;padding:6px;color:#94a3b8">Jugador</th>' +
                '<th style="text-align:left;padding:6px;color:#94a3b8">Club</th>' +
                '<th style="text-align:center;padding:6px;color:#94a3b8">Nota</th>' +
                '<th style="text-align:center;padding:6px;color:#94a3b8">Visto</th>' +
                '<th style="text-align:center;padding:6px;color:#94a3b8">Scouts</th>' +
                '<th style="text-align:center;padding:6px;color:#94a3b8">Fichar</th>' +
                '<th style="text-align:left;padding:6px;color:#94a3b8">Coste est.</th>' +
                '<th style="text-align:left;padding:6px;color:#94a3b8">Pipeline</th>' +
            '</tr></thead><tbody>';
        top5.forEach(function(p, idx) {
            var ratingColor = p.rating >= 8 ? '#4ade80' : (p.rating >= 6 ? '#f59e0b' : '#94a3b8');
            h += '<tr style="border-bottom:1px solid #1e293b">' +
                '<td style="padding:8px;text-align:center;color:#f59e0b;font-weight:700">' + (idx + 1) + '</td>' +
                '<td style="padding:8px;color:#f1f5f9;font-weight:600">' + cmDdEsc(p.name) + '</td>' +
                '<td style="padding:8px;color:#94a3b8">' + cmDdEsc(p.club) + '</td>' +
                '<td style="padding:8px;text-align:center;color:' + ratingColor + ';font-weight:700;font-size:15px">' + p.rating.toFixed(1) + '</td>' +
                '<td style="padding:8px;text-align:center;color:#e2e8f0">' + p.sightings + 'x</td>' +
                '<td style="padding:8px;text-align:center;color:#e2e8f0">' + p.scouts + '</td>' +
                '<td style="padding:8px;text-align:center;color:#4ade80;font-weight:600">' + (p.signCount > 0 ? p.signCount : '-') + '</td>' +
                '<td style="padding:8px;color:#94a3b8;font-size:12px">' + cmDdEsc(p.estimated_cost) + '</td>' +
                '<td style="padding:8px"><span class="cmdd-badge" style="background:#1e293b;color:#94a3b8">' + (pipeLabels[p.pipeline] || p.pipeline) + '</span></td>' +
            '</tr>';
        });
        h += '</tbody></table></div>';
    }
    h += '</div>';
    cont.innerHTML = h;
}


// ============================================================
// TAB 3: JUGADORES (vista global DD)
// ============================================================

var CMDD_SUB_ASPECTS = {
    tecnica: [
        { key: 'rating_tec_control',       label: 'Control' },
        { key: 'rating_tec_pase_corto',    label: 'Pase corto' },
        { key: 'rating_tec_pase_largo',    label: 'Pase largo' },
        { key: 'rating_tec_conduccion',    label: 'Conduccion' },
        { key: 'rating_tec_regate',        label: 'Regate' },
        { key: 'rating_tec_finalizacion',  label: 'Finalizacion' },
        { key: 'rating_tec_juego_aereo',   label: 'Juego aereo' },
        { key: 'rating_tec_primer_toque',  label: 'Primer toque' }
    ],
    tactica: [
        { key: 'rating_tac_posicionamiento', label: 'Posicionamiento' },
        { key: 'rating_tac_lectura',         label: 'Lectura' },
        { key: 'rating_tac_decisiones',      label: 'Decisiones' },
        { key: 'rating_tac_comprension',     label: 'Comprension' },
        { key: 'rating_tac_transiciones',    label: 'Transiciones' },
        { key: 'rating_tac_espacios',        label: 'Espacios' }
    ],
    fisica: [
        { key: 'rating_fis_velocidad',    label: 'Velocidad' },
        { key: 'rating_fis_aceleracion',  label: 'Aceleracion' },
        { key: 'rating_fis_resistencia',  label: 'Resistencia' },
        { key: 'rating_fis_fuerza',       label: 'Fuerza' },
        { key: 'rating_fis_agilidad',     label: 'Agilidad' },
        { key: 'rating_fis_potencia',     label: 'Potencia' }
    ],
    mental: [
        { key: 'rating_men_actitud',        label: 'Actitud' },
        { key: 'rating_men_liderazgo',      label: 'Liderazgo' },
        { key: 'rating_men_concentracion',  label: 'Concentracion' },
        { key: 'rating_men_competitividad', label: 'Competitividad' },
        { key: 'rating_men_disciplina',     label: 'Disciplina' },
        { key: 'rating_men_trabajo_equipo', label: 'Trabajo equipo' }
    ]
};

async function cmDdTabJugadores(cont) {
    cont.innerHTML = '<div class="cmdd-empty"><div class="icon">&#8987;</div><p>Cargando jugadores...</p></div>';
    await cmDdEnsureJugadoresCargados();

    // Cargar avistamientos y reports en paralelo
    var [resSight, resRep] = await Promise.all([
        supabaseClient.from('cm_sc_player_sightings')
            .select('player_id, scout_id, rating_quick, tag, observed_position, sighting_date, notes')
            .eq('club_id', clubId).eq('archived', false),
        supabaseClient.from('cm_sc_player_reports')
            .select('*')
            .eq('club_id', clubId).eq('archived', false)
    ]);
    cmDdJugSightings = resSight.data || [];
    cmDdJugReports = resRep.data || [];

    cmDdRenderJugadores();
}

function cmDdRenderJugadores() {
    var cont = document.getElementById('cmdd-tab-content');
    if (!cont) return;

    var pipeLabels = { identified:'Identificado', observed:'Observado', tracking:'Seguimiento', contacted:'Contactado', signed:'Fichado', discarded:'Descartado' };
    var pipeColors = { identified:'#64748b', observed:'#3b82f6', tracking:'#f59e0b', contacted:'#a855f7', signed:'#22c55e', discarded:'#ef4444' };

    // Filtrar jugadores
    var filtered = cmDdJugadores.filter(function(p) {
        if (cmDdFiltroCat && p.target_category !== cmDdFiltroCat) return false;
        if (cmDdJugFiltroPos && p.position_primary !== cmDdJugFiltroPos) return false;
        if (cmDdJugFiltroPipe && p.pipeline_status !== cmDdJugFiltroPipe) return false;
        if (cmDdJugFiltroBusq) {
            var q = cmDdJugFiltroBusq.toLowerCase();
            var nameMatch = (p.name || '').toLowerCase().indexOf(q) >= 0;
            var clubMatch = (p.current_club || '').toLowerCase().indexOf(q) >= 0;
            if (!nameMatch && !clubMatch) return false;
        }
        return true;
    });

    // Ordenar por sign_count desc, luego rating calculado desc
    filtered.sort(function(a, b) {
        if ((b.sign_count || 0) !== (a.sign_count || 0)) return (b.sign_count || 0) - (a.sign_count || 0);
        var aS = cmDdJugSightings.filter(function(s) { return s.player_id === a.id && s.rating_quick != null; });
        var bS = cmDdJugSightings.filter(function(s) { return s.player_id === b.id && s.rating_quick != null; });
        var aAvg = aS.length > 0 ? aS.reduce(function(x, s) { return x + Number(s.rating_quick); }, 0) / aS.length : 0;
        var bAvg = bS.length > 0 ? bS.reduce(function(x, s) { return x + Number(s.rating_quick); }, 0) / bS.length : 0;
        return bAvg - aAvg;
    });

    // Posiciones unicas para filtro
    var posiciones = [];
    cmDdJugadores.forEach(function(p) {
        if (p.position_primary && posiciones.indexOf(p.position_primary) === -1) posiciones.push(p.position_primary);
    });
    posiciones.sort();

    var h = '';

    // Toolbar
    h += '<div class="cmdd-toolbar">';
    h += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
    h += cmDdSelectorCategoria("cmDdFiltroCat=this.value;cmDdRenderJugadores()");
    h += '<input type="text" placeholder="Buscar jugador o club..." value="' + cmDdEsc(cmDdJugFiltroBusq) + '" oninput="cmDdJugFiltroBusq=this.value;cmDdRenderJugadores()" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px;width:200px">';
    h += '<select onchange="cmDdJugFiltroPos=this.value;cmDdRenderJugadores()" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px">';
    h += '<option value="">Todas las posiciones</option>';
    posiciones.forEach(function(pos) {
        h += '<option value="' + pos + '"' + (cmDdJugFiltroPos === pos ? ' selected' : '') + '>' + (CMSC_POS_NOMBRES[pos] || pos) + '</option>';
    });
    h += '</select>';
    h += '<select onchange="cmDdJugFiltroPipe=this.value;cmDdRenderJugadores()" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px">';
    h += '<option value="">Todos los estados</option>';
    Object.keys(pipeLabels).forEach(function(k) {
        h += '<option value="' + k + '"' + (cmDdJugFiltroPipe === k ? ' selected' : '') + '>' + pipeLabels[k] + '</option>';
    });
    h += '</select>';
    h += '</div>';
    h += '<div style="display:flex;align-items:center;gap:8px">';
    if (cmDdCompararIds.length >= 2) {
        h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-primary" onclick="cmDdCompararJugadores()">Comparar (' + cmDdCompararIds.length + ')</button>';
    }
    if (cmDdCompararIds.length > 0) {
        h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-secondary" onclick="cmDdCompararIds=[];cmDdRenderJugadores()">Limpiar</button>';
    }
    h += '<span class="cmdd-contador"><strong>' + filtered.length + '</strong> de ' + cmDdJugadores.length + ' jugadores</span>';
    h += '</div>';
    h += '</div>';

    // Tabla
    if (filtered.length === 0) {
        h += '<div class="cmdd-empty"><div class="icon">&#128100;</div><h3>Sin jugadores</h3><p>No hay jugadores que coincidan con los filtros seleccionados.</p></div>';
    } else {
        h += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">';
        h += '<thead><tr style="border-bottom:1px solid #334155">';
        h += '<th style="width:32px;padding:8px"></th>';
        h += '<th style="text-align:left;padding:8px;color:#94a3b8">Jugador</th>';
        h += '<th style="text-align:left;padding:8px;color:#94a3b8">Pos</th>';
        h += '<th style="text-align:left;padding:8px;color:#94a3b8">Club</th>';
        h += '<th style="text-align:center;padding:8px;color:#94a3b8">Nota</th>';
        h += '<th style="text-align:center;padding:8px;color:#94a3b8">Visto</th>';
        h += '<th style="text-align:center;padding:8px;color:#94a3b8">Scouts</th>';
        h += '<th style="text-align:center;padding:8px;color:#94a3b8" title="Recomendaciones de fichar">&#9989;</th>';
        h += '<th style="text-align:left;padding:8px;color:#94a3b8">Pipeline</th>';
        h += '<th style="text-align:left;padding:8px;color:#94a3b8">Informe</th>';
        h += '</tr></thead><tbody>';

        filtered.forEach(function(p) {
            // Calcular nota media desde avistamientos
            var pSights = cmDdJugSightings.filter(function(s) { return s.player_id === p.id && s.rating_quick != null; });
            var avgRating = pSights.length > 0 ? pSights.reduce(function(a, s) { return a + Number(s.rating_quick); }, 0) / pSights.length : 0;
            var ratingColor = avgRating >= 8 ? '#4ade80' : (avgRating >= 6 ? '#f59e0b' : '#94a3b8');
            var pipeColor = pipeColors[p.pipeline_status] || '#64748b';
            var hasReport = cmDdJugReports.some(function(r) { return r.player_id === p.id; });
            var isChecked = cmDdCompararIds.indexOf(p.id) >= 0;

            h += '<tr style="border-bottom:1px solid #1e293b;' + (isChecked ? 'background:#f59e0b11' : '') + '">';
            h += '<td style="padding:8px;text-align:center" onclick="event.stopPropagation()"><input type="checkbox" ' + (isChecked ? 'checked' : '') + ' onchange="cmDdToggleComparar(\x27' + p.id + '\x27)" style="cursor:pointer;accent-color:#f59e0b"></td>';
            h += '<td style="padding:8px;color:#f1f5f9;font-weight:600;cursor:pointer" onclick="cmDdAbrirJugador(\x27' + p.id + '\x27)">' + cmDdEsc(p.name) + '</td>';
            h += '<td style="padding:8px;color:#94a3b8;font-size:12px">' + cmDdEsc(p.position_primary || '') + '</td>';
            h += '<td style="padding:8px;color:#94a3b8">' + cmDdEsc(p.current_club || '') + '</td>';
            h += '<td style="padding:8px;text-align:center;color:' + ratingColor + ';font-weight:700">' + (avgRating > 0 ? avgRating.toFixed(1) : '-') + '</td>';
            h += '<td style="padding:8px;text-align:center;color:#e2e8f0">' + (p.sightings_count || 0) + '</td>';
            h += '<td style="padding:8px;text-align:center;color:#e2e8f0">' + (p.scouts_count || 0) + '</td>';
            h += '<td style="padding:8px;text-align:center;color:' + ((p.sign_count || 0) >= 3 ? '#4ade80' : '#94a3b8') + ';font-weight:600">' + (p.sign_count || 0) + '</td>';
            h += '<td style="padding:8px"><span class="cmdd-badge" style="background:' + pipeColor + '22;color:' + pipeColor + '">' + (pipeLabels[p.pipeline_status] || '-') + '</span></td>';
            h += '<td style="padding:8px;text-align:center">' + (hasReport ? '<span style="color:#f59e0b" title="Tiene informe detallado">&#128196;</span>' : '<span style="color:#334155">\u2014</span>') + '</td>';
            h += '</tr>';
        });
        h += '</tbody></table></div>';
    }

    cont.innerHTML = h;
}


// === Detalle de jugador (modal) ===
async function cmDdAbrirJugador(playerId) {
    var player = cmDdJugadores.find(function(p) { return p.id === playerId; });
    if (!player) return;

    var cont = document.getElementById('cmdd-tab-content');
    if (!cont) return;
    cont.innerHTML = '<div class="cmdd-empty"><div class="icon">&#8987;</div><p>Cargando ficha...</p></div>';

    // Cargar avistamientos con datos de partido + reports
    var [resSight, resRep] = await Promise.all([
        supabaseClient.from('cm_sc_player_sightings')
            .select('*, cm_sc_matches(home_team, away_team, match_date, competition)')
            .eq('player_id', playerId).eq('archived', false)
            .order('sighting_date', { ascending: false }),
        supabaseClient.from('cm_sc_player_reports')
            .select('*').eq('player_id', playerId).eq('archived', false)
            .order('created_at', { ascending: false })
    ]);
    var sights = resSight.data || [];
    var reports = resRep.data || [];

    // Consenso por scout
    var scoutMap = {};
    sights.forEach(function(s) {
        if (!scoutMap[s.scout_id]) scoutMap[s.scout_id] = { ratings: [], tags: [], dates: [] };
        if (s.rating_quick) scoutMap[s.scout_id].ratings.push(s.rating_quick);
        scoutMap[s.scout_id].tags.push(s.tag);
        if (s.sighting_date) scoutMap[s.scout_id].dates.push(s.sighting_date);
    });
    var allRatings = sights.filter(function(s) { return s.rating_quick; }).map(function(s) { return s.rating_quick; });
    var mediaTotal = allRatings.length > 0 ? (allRatings.reduce(function(a, b) { return a + b; }, 0) / allRatings.length) : 0;
    var totalSign = sights.filter(function(s) { return s.tag === 'sign'; }).length;
    var totalWatch = sights.filter(function(s) { return s.tag === 'watch'; }).length;
    var totalDiscard = sights.filter(function(s) { return s.tag === 'discard'; }).length;

    var pipeLabels = { identified:'Identificado', observed:'Observado', tracking:'En seguimiento', contacted:'Contactado', signed:'Fichado', discarded:'Descartado' };
    var catLabelsMap = { primer_equipo:'Primer equipo', filial:'Filial', juvenil:'Juvenil', cadete:'Cadete', infantil:'Infantil', alevin:'Alevin', otro:'Otro' };
    var footLabels = { right:'Derecho', left:'Izquierdo', both:'Ambidiestro' };
    var tagLabels = { sign:'Fichar', watch:'Seguir', discard:'Descartar' };

    // Calcular edad
    var edad = '';
    if (player.birth_date) {
        var bd = new Date(player.birth_date + 'T12:00:00');
        var hoy = new Date();
        edad = Math.floor((hoy - bd) / (365.25 * 24 * 60 * 60 * 1000));
    }

    var h = '';

    // Boton volver
    h += '<div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">';
    h += '<button class="cmdd-btn cmdd-btn-secondary cmdd-btn-sm" onclick="cmDdRenderJugadores()">\u2190 Volver a jugadores</button>';
    h += '<div style="display:flex;gap:6px">';
    h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-secondary" onclick="cmDdExportarPDF(\x27' + playerId + '\x27,\'resumen\')">PDF Resumen</button>';
    h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-primary" onclick="cmDdExportarPDF(\x27' + playerId + '\x27,\'completo\')">PDF Completo</button>';
    h += '</div></div>';

    // === CABECERA: foto + nombre + datos rapidos + resumen consenso ===
    h += '<div class="cmdd-section" style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start">';

    // Foto + nombre
    h += '<div style="display:flex;gap:14px;align-items:center;flex:1;min-width:250px">';
    if (player.photo_url) {
        h += '<img src="' + cmDdEsc(player.photo_url) + '" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #334155;flex-shrink:0" onerror="this.style.display=\'none\'">';
    } else {
        h += '<div style="width:72px;height:72px;border-radius:50%;background:#1e293b;border:3px solid #334155;display:flex;align-items:center;justify-content:center;color:#475569;font-size:28px;flex-shrink:0">\ud83d\udc64</div>';
    }
    h += '<div>';
    h += '<div style="font-size:22px;font-weight:700;color:#f1f5f9">' + cmDdEsc(player.name) + '</div>';
    h += '<div style="color:#94a3b8;font-size:13px;margin-top:2px">';
    h += (player.position_primary || '') + (player.position_secondary ? ' / ' + player.position_secondary : '');
    h += (player.nationality ? ' \u00B7 ' + cmDdEsc(player.nationality) : '');
    h += (edad ? ' \u00B7 ' + edad + ' anos' : '');
    h += '</div>';
    var badges = [];
    if (player.target_category) badges.push('<span class="cmdd-badge" style="background:#f59e0b22;color:#f59e0b">' + (catLabelsMap[player.target_category] || player.target_category) + '</span>');
    if (player.pipeline_status) badges.push('<span class="cmdd-badge" style="background:#3b82f622;color:#3b82f6">' + (pipeLabels[player.pipeline_status] || player.pipeline_status) + '</span>');
    if (badges.length) h += '<div style="margin-top:4px;display:flex;gap:4px">' + badges.join('') + '</div>';
    h += '</div></div>';

    // Resumen consenso (lado derecho)
    var mtColor = mediaTotal >= 8 ? '#4ade80' : (mediaTotal >= 6 ? '#f59e0b' : '#94a3b8');
    h += '<div style="display:flex;gap:10px;flex-wrap:wrap">';
    h += '<div style="padding:10px 16px;background:#0f172a;border-radius:10px;text-align:center;border:2px solid ' + mtColor + '">';
    h += '<div style="color:' + mtColor + ';font-size:28px;font-weight:700">' + (mediaTotal > 0 ? mediaTotal.toFixed(1) : '-') + '</div>';
    h += '<div style="color:#94a3b8;font-size:9px;font-weight:600">MEDIA TOTAL</div></div>';
    h += '<div style="padding:10px 16px;background:#0f172a;border-radius:10px;text-align:center">';
    h += '<div style="color:#e2e8f0;font-size:28px;font-weight:700">' + Object.keys(scoutMap).length + '</div>';
    h += '<div style="color:#94a3b8;font-size:9px;font-weight:600">SCOUTS</div></div>';
    h += '<div style="padding:10px 16px;background:#0f172a;border-radius:10px;text-align:center">';
    h += '<div style="color:#e2e8f0;font-size:28px;font-weight:700">' + sights.length + '</div>';
    h += '<div style="color:#94a3b8;font-size:9px;font-weight:600">VISTO</div></div>';
    if (totalSign > 0) { h += '<div style="padding:10px 14px;background:#052e16;border-radius:10px;text-align:center"><div style="color:#4ade80;font-size:24px;font-weight:700">' + totalSign + '</div><div style="color:#4ade80;font-size:9px">FICHAR</div></div>'; }
    if (totalWatch > 0) { h += '<div style="padding:10px 14px;background:#422006;border-radius:10px;text-align:center"><div style="color:#fbbf24;font-size:24px;font-weight:700">' + totalWatch + '</div><div style="color:#fbbf24;font-size:9px">SEGUIR</div></div>'; }
    if (totalDiscard > 0) { h += '<div style="padding:10px 14px;background:#450a0a;border-radius:10px;text-align:center"><div style="color:#fca5a5;font-size:24px;font-weight:700">' + totalDiscard + '</div><div style="color:#fca5a5;font-size:9px">DESCARTAR</div></div>'; }
    h += '</div>';
    h += '</div>'; // fin cabecera

    // === DATOS DETALLADOS ===
    h += '<div class="cmdd-section">';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;font-size:13px">';
    var fields = [
        { l:'Club', v: player.current_club },
        { l:'Liga', v: player.current_league },
        { l:'Pie', v: player.dominant_foot ? (footLabels[player.dominant_foot] || player.dominant_foot) : null },
        { l:'Altura', v: player.height_cm ? player.height_cm + ' cm' : null },
        { l:'Peso', v: player.weight_kg ? player.weight_kg + ' kg' : null },
        { l:'Nacimiento', v: player.birth_date ? cmDdFechaCorta(player.birth_date) : null },
        { l:'Fin contrato', v: player.contract_until ? cmDdFechaCorta(player.contract_until) : null },
        { l:'Coste estimado', v: player.estimated_cost, color: '#f59e0b' },
        { l:'Agente', v: player.agent_name },
        { l:'Contacto agente', v: player.agent_contact }
    ];
    fields.forEach(function(f) {
        if (!f.v) return;
        h += '<div><div style="color:#64748b;font-size:10px;font-weight:600;text-transform:uppercase">' + f.l + '</div>';
        h += '<div style="color:' + (f.color || '#e2e8f0') + ';font-size:13px;font-weight:' + (f.color ? '600' : '400') + '">' + cmDdEsc(f.v) + '</div></div>';
    });
    h += '</div>';
    if (player.notes) {
        h += '<div style="margin-top:12px;padding-top:10px;border-top:1px solid #334155;color:#cbd5e1;font-size:13px;line-height:1.5">' + cmDdEsc(player.notes).replace(/\n/g, '<br>') + '</div>';
    }
    h += '</div>';

    // === DESGLOSE POR SCOUT ===
    h += '<div class="cmdd-section-row">';

    h += '<div class="cmdd-section">';
    h += '<h3>Valoracion por scout (' + Object.keys(scoutMap).length + ')</h3>';
    if (Object.keys(scoutMap).length > 0) {
        var scoutList = Object.keys(scoutMap).map(function(sid) {
            var d = scoutMap[sid];
            var avg = d.ratings.length > 0 ? d.ratings.reduce(function(a, b) { return a + b; }, 0) / d.ratings.length : 0;
            return { id: sid, avg: avg, count: d.ratings.length, tags: d.tags, dates: d.dates };
        });
        scoutList.sort(function(a, b) { return b.avg - a.avg; });
        scoutList.forEach(function(sc) {
            var avgC = sc.avg >= 8 ? '#4ade80' : (sc.avg >= 6 ? '#f59e0b' : '#94a3b8');
            var signC = sc.tags.filter(function(t) { return t === 'sign'; }).length;
            var watchC = sc.tags.filter(function(t) { return t === 'watch'; }).length;
            var discC = sc.tags.filter(function(t) { return t === 'discard'; }).length;
            h += '<div style="padding:8px 0;border-bottom:1px solid #0f172a">';
            h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">';
            h += '<span style="color:#e2e8f0;font-size:13px;font-weight:600">' + cmDdGetMiembroNombre(sc.id) + ' <span style="color:#64748b;font-size:11px">(' + sc.count + 'x)</span></span>';
            h += '<span style="color:' + avgC + ';font-size:18px;font-weight:700">' + sc.avg.toFixed(1) + '</span>';
            h += '</div>';
            h += '<div style="height:5px;background:#0f172a;border-radius:3px;margin:4px 0"><div style="width:' + (sc.avg * 10) + '%;height:100%;background:' + avgC + ';border-radius:3px"></div></div>';
            h += '<div style="display:flex;gap:4px">';
            if (signC > 0) h += '<span class="cmdd-badge cmdd-badge-sign">Fichar x' + signC + '</span>';
            if (watchC > 0) h += '<span class="cmdd-badge cmdd-badge-watch">Seguir x' + watchC + '</span>';
            if (discC > 0) h += '<span class="cmdd-badge cmdd-badge-discard">Descartar x' + discC + '</span>';
            h += '</div></div>';
        });
        h += '<div style="padding:8px 0;display:flex;justify-content:space-between"><span style="color:#f59e0b;font-weight:700;font-size:13px">MEDIA TOTAL</span><span style="color:' + mtColor + ';font-size:20px;font-weight:700">' + mediaTotal.toFixed(1) + '</span></div>';
    } else {
        h += '<div style="color:#64748b;font-size:13px;text-align:center;padding:12px">Sin avistamientos.</div>';
    }
    h += '</div>';

    // Radar 26 sub-aspectos (si hay reports)
    if (reports.length > 0) {
        var canvasId = 'cmdd-radar-' + playerId.substring(0, 8);
        h += '<div class="cmdd-section">';
        h += '<h3>Evaluacion detallada (' + reports.length + ' informe' + (reports.length > 1 ? 's' : '') + ')</h3>';
        var avgCats = { tecnica: 0, tactica: 0, fisica: 0, mental: 0, overall: 0 };
        var countCats = 0;
        reports.forEach(function(r) {
            if (r.avg_tecnica) avgCats.tecnica += Number(r.avg_tecnica);
            if (r.avg_tactica) avgCats.tactica += Number(r.avg_tactica);
            if (r.avg_fisica) avgCats.fisica += Number(r.avg_fisica);
            if (r.avg_mental) avgCats.mental += Number(r.avg_mental);
            if (r.rating_overall) avgCats.overall += Number(r.rating_overall);
            countCats++;
        });
        if (countCats > 0) { Object.keys(avgCats).forEach(function(k) { avgCats[k] = (avgCats[k] / countCats).toFixed(1); }); }
        var catColors = { tecnica:'#3b82f6', tactica:'#f59e0b', fisica:'#22c55e', mental:'#a855f7', overall:'#ef4444' };
        var catNombres = { tecnica:'TEC', tactica:'TAC', fisica:'FIS', mental:'MEN', overall:'TOTAL' };
        h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">';
        Object.keys(avgCats).forEach(function(k) {
            h += '<div style="padding:6px 12px;background:#0f172a;border-radius:8px;border-left:3px solid ' + catColors[k] + ';text-align:center">';
            h += '<div style="color:' + catColors[k] + ';font-size:18px;font-weight:700">' + avgCats[k] + '</div>';
            h += '<div style="color:#64748b;font-size:9px;font-weight:600">' + catNombres[k] + '</div></div>';
        });
        h += '</div>';
        h += '<div style="max-width:400px;margin:0 auto"><canvas id="' + canvasId + '" width="400" height="320"></canvas></div>';
        var lastReport = reports[0];
        if (lastReport.strengths || lastReport.weaknesses) {
            h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">';
            if (lastReport.strengths) { h += '<div style="padding:8px;background:#052e16;border-radius:6px;border:1px solid #16a34a33"><div style="color:#4ade80;font-size:10px;font-weight:700">FORTALEZAS</div><div style="color:#e2e8f0;font-size:12px;margin-top:2px">' + cmDdEsc(lastReport.strengths) + '</div></div>'; }
            if (lastReport.weaknesses) { h += '<div style="padding:8px;background:#450a0a;border-radius:6px;border:1px solid #dc262633"><div style="color:#fca5a5;font-size:10px;font-weight:700">DEBILIDADES</div><div style="color:#e2e8f0;font-size:12px;margin-top:2px">' + cmDdEsc(lastReport.weaknesses) + '</div></div>'; }
            h += '</div>';
        }
        if (lastReport.summary) { h += '<div style="margin-top:8px;padding:8px;background:#0f172a;border-radius:6px"><div style="color:#94a3b8;font-size:10px;font-weight:700">RESUMEN</div><div style="color:#e2e8f0;font-size:12px;margin-top:2px">' + cmDdEsc(lastReport.summary) + '</div></div>'; }
        h += '</div>';
        setTimeout(function() { cmDdPintarRadar(canvasId, reports); }, 150);
    } else {
        h += '<div class="cmdd-section"><h3>Evaluacion detallada</h3><div style="color:#64748b;font-size:13px;text-align:center;padding:12px">Sin informes detallados. Los scouts pueden crear evaluaciones con 26 sub-aspectos desde el modulo Scouting.</div></div>';
    }

    h += '</div>'; // fin section-row

    // === AVISTAMIENTOS (todos los scouts) ===
    h += '<div class="cmdd-section">';
    h += '<h3>Avistamientos <span class="cmdd-tab-badge">' + sights.length + '</span></h3>';
    if (sights.length === 0) {
        h += '<div style="color:#64748b;font-size:13px;text-align:center;padding:12px">Sin avistamientos registrados.</div>';
    } else {
        sights.forEach(function(s) {
            var match = s.cm_sc_matches;
            var matchLabel = match ? cmDdEsc(match.home_team) + ' vs ' + cmDdEsc(match.away_team) : 'Partido';
            var tagColor = s.tag === 'sign' ? '#4ade80' : (s.tag === 'watch' ? '#fbbf24' : '#fca5a5');
            h += '<div class="cmdd-list-item" style="flex-direction:column;align-items:flex-start;gap:4px">';
            h += '<div style="display:flex;justify-content:space-between;width:100%;align-items:center">';
            h += '<div style="display:flex;align-items:center;gap:8px">';
            h += '<span style="color:#e2e8f0;font-size:13px;font-weight:600">' + matchLabel + '</span>';
            h += '<span class="cmdd-badge" style="background:' + tagColor + '22;color:' + tagColor + '">' + (tagLabels[s.tag] || s.tag) + '</span>';
            if (s.rating_quick) h += '<span style="color:#f59e0b;font-weight:700">' + s.rating_quick + '/10</span>';
            h += '</div>';
            h += '<span style="color:#64748b;font-size:11px">' + cmDdFechaCorta(s.sighting_date) + '</span>';
            h += '</div>';
            h += '<div style="color:#94a3b8;font-size:12px">';
            h += 'Scout: ' + cmDdGetMiembroNombre(s.scout_id);
            h += (s.observed_position ? ' \u00B7 Pos: ' + s.observed_position : '');
            h += (match && match.competition ? ' \u00B7 ' + cmDdEsc(match.competition) : '');
            h += '</div>';
            if (s.notes) h += '<div style="color:#64748b;font-size:12px;line-height:1.4">' + cmDdEsc(s.notes) + '</div>';
            h += '</div>';
        });
    }
    h += '</div>';

    cont.innerHTML = h;
}


// Radar Chart.js con 26 sub-aspectos
function cmDdPintarRadar(canvasId, reports) {
    var canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    // Calcular medias de todos los reports
    var allAspects = [];
    var labels = [];
    var values = [];
    var bgColors = [];

    var catList = ['tecnica', 'tactica', 'fisica', 'mental'];
    var catColorMap = { tecnica: 'rgba(59,130,246,', tactica: 'rgba(245,158,11,', fisica: 'rgba(34,197,94,', mental: 'rgba(168,85,247,' };

    catList.forEach(function(cat) {
        CMDD_SUB_ASPECTS[cat].forEach(function(asp) {
            labels.push(asp.label);
            var sum = 0, count = 0;
            reports.forEach(function(r) {
                var v = r[asp.key];
                if (v != null) { sum += Number(v); count++; }
            });
            values.push(count > 0 ? Math.round((sum / count) * 10) / 10 : 0);
            bgColors.push(catColorMap[cat] + '0.3)');
        });
    });

    new Chart(canvas, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Media scouts',
                data: values,
                backgroundColor: 'rgba(245,158,11,0.15)',
                borderColor: '#f59e0b',
                borderWidth: 2,
                pointBackgroundColor: '#f59e0b',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    min: 0, max: 10,
                    ticks: { stepSize: 2, color: '#64748b', backdropColor: 'transparent', font: { size: 9 } },
                    grid: { color: '#334155' },
                    angleLines: { color: '#334155' },
                    pointLabels: { color: '#94a3b8', font: { size: 9 } }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}


// ============================================================
// TAB 4: AGENTES (CRM)
// ============================================================

async function cmDdTabAgentes(cont) {
    cont.innerHTML = '<div class="cmdd-empty"><div class="icon">&#8987;</div><p>Cargando agentes...</p></div>';
    await cmDdEnsureJugadoresCargados();

    var [resAg, resAP, resInt] = await Promise.all([
        supabaseClient.from('cm_dd_agents').select('*').eq('club_id', clubId).eq('archived', false).order('name'),
        supabaseClient.from('cm_dd_agent_players').select('*').eq('club_id', clubId),
        supabaseClient.from('cm_dd_interactions').select('*').eq('club_id', clubId).eq('archived', false).order('interaction_date', { ascending: false })
    ]);
    cmDdAgentes = resAg.data || [];
    cmDdAgentPlayers = resAP.data || [];
    cmDdInteracciones = resInt.data || [];

    cmDdRenderAgentes();
}

function cmDdRenderAgentes() {
    var cont = document.getElementById('cmdd-tab-content');
    if (!cont) return;

    var h = '<div class="cmdd-toolbar">';
    h += '<div style="display:flex;gap:8px;align-items:center">';
    h += '<button class="cmdd-btn cmdd-btn-primary" onclick="cmDdModalAgente()">+ Nuevo agente</button>';
    h += '</div>';
    h += '<span class="cmdd-contador"><strong>' + cmDdAgentes.length + '</strong> agentes</span>';
    h += '</div>';

    if (cmDdAgentes.length === 0) {
        h += '<div class="cmdd-empty"><div class="icon">&#128222;</div><h3>Sin agentes</h3><p>Anade agentes y representantes para llevar el control de tus contactos.</p></div>';
    } else {
        h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px">';
        cmDdAgentes.forEach(function(ag) {
            var jugVinc = cmDdAgentPlayers.filter(function(ap) { return ap.agent_id === ag.id; });
            var ints = cmDdInteracciones.filter(function(i) { return i.agent_id === ag.id; });
            var stars = '';
            if (ag.reliability_rating) {
                for (var i = 0; i < 5; i++) stars += i < ag.reliability_rating ? '\u2605' : '\u2606';
            }

            h += '<div class="cmdd-section" style="cursor:pointer" onclick="cmDdVerAgente(\x27' + ag.id + '\x27)">';
            h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">';
            h += '<div><div style="color:#f1f5f9;font-size:14px;font-weight:700">' + cmDdEsc(ag.name) + '</div>';
            if (ag.agency) h += '<div style="color:#94a3b8;font-size:12px">' + cmDdEsc(ag.agency) + '</div>';
            h += '</div>';
            if (stars) h += '<div style="color:#f59e0b;font-size:14px">' + stars + '</div>';
            h += '</div>';

            h += '<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:#94a3b8">';
            if (ag.country) h += '<span>\ud83c\udf0d ' + cmDdEsc(ag.country) + '</span>';
            if (ag.phone) h += '<span>\ud83d\udcde ' + cmDdEsc(ag.phone) + '</span>';
            h += '<span>\ud83c\udfbd ' + jugVinc.length + ' jugadores</span>';
            h += '<span>\ud83d\udcac ' + ints.length + ' contactos</span>';
            h += '</div>';

            if (ag.specialization) {
                h += '<div style="margin-top:6px;color:#64748b;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + cmDdEsc(ag.specialization) + '</div>';
            }
            h += '</div>';
        });
        h += '</div>';
    }

    cont.innerHTML = h;
}


// Modal crear/editar agente
function cmDdModalAgente(agentId) {
    var ag = agentId ? cmDdAgentes.find(function(a) { return a.id === agentId; }) : null;
    var titulo = ag ? 'Editar agente' : 'Nuevo agente';

    var h = '<div class="cmdd-modal-overlay" id="cmdd-modal-agente" onclick="if(event.target===this)this.remove()">';
    h += '<div class="cmdd-modal">';
    h += '<div class="cmdd-modal-header"><h3>' + titulo + '</h3><button class="cmdd-modal-close" onclick="document.getElementById(\'cmdd-modal-agente\').remove()">&times;</button></div>';
    h += '<div class="cmdd-modal-body">';

    h += '<div class="cmdd-form-group"><label>Nombre *</label><input id="cmdd-ag-name" value="' + cmDdEsc(ag ? ag.name : '') + '"></div>';
    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Agencia</label><input id="cmdd-ag-agency" value="' + cmDdEsc(ag ? ag.agency : '') + '"></div>';
    h += '<div class="cmdd-form-group"><label>Pais</label><input id="cmdd-ag-country" value="' + cmDdEsc(ag ? ag.country : '') + '"></div>';
    h += '</div>';
    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Telefono</label><input id="cmdd-ag-phone" value="' + cmDdEsc(ag ? ag.phone : '') + '"></div>';
    h += '<div class="cmdd-form-group"><label>Email</label><input id="cmdd-ag-email" value="' + cmDdEsc(ag ? ag.email : '') + '"></div>';
    h += '</div>';
    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Especializacion</label><input id="cmdd-ag-spec" placeholder="Laterales, sub-23, Sudamerica..." value="' + cmDdEsc(ag ? ag.specialization : '') + '"></div>';
    h += '<div class="cmdd-form-group"><label>Rango de precios</label><input id="cmdd-ag-price" placeholder="50K - 500K" value="' + cmDdEsc(ag ? ag.price_range : '') + '"></div>';
    h += '</div>';
    h += '<div class="cmdd-form-group"><label>Fiabilidad (1-5)</label><select id="cmdd-ag-rating">';
    h += '<option value="">Sin valorar</option>';
    for (var i = 1; i <= 5; i++) h += '<option value="' + i + '"' + (ag && ag.reliability_rating === i ? ' selected' : '') + '>' + i + ' \u2605</option>';
    h += '</select></div>';
    h += '<div class="cmdd-form-group"><label>Notas</label><textarea id="cmdd-ag-notes">' + cmDdEsc(ag ? ag.notes : '') + '</textarea></div>';

    h += '</div>';
    h += '<div class="cmdd-modal-footer">';
    if (ag) h += '<button class="cmdd-btn cmdd-btn-danger cmdd-btn-sm" onclick="cmDdArchivarAgente(\x27' + ag.id + '\x27)">Archivar</button>';
    h += '<button class="cmdd-btn cmdd-btn-secondary" onclick="document.getElementById(\'cmdd-modal-agente\').remove()">Cancelar</button>';
    h += '<button class="cmdd-btn cmdd-btn-primary" onclick="cmDdGuardarAgente(\x27' + (ag ? ag.id : '') + '\x27)">Guardar</button>';
    h += '</div></div></div>';

    var div = document.createElement('div'); div.innerHTML = h;
    document.body.appendChild(div.firstElementChild);
}

async function cmDdGuardarAgente(agentId) {
    var name = (document.getElementById('cmdd-ag-name').value || '').trim();
    if (!name) { alert('El nombre es obligatorio'); return; }

    var memberId = null;
    if (typeof cmState !== 'undefined' && cmState.miembro) memberId = cmState.miembro.id;

    var data = {
        club_id: clubId, name: name,
        agency: document.getElementById('cmdd-ag-agency').value.trim() || null,
        country: document.getElementById('cmdd-ag-country').value.trim() || null,
        phone: document.getElementById('cmdd-ag-phone').value.trim() || null,
        email: document.getElementById('cmdd-ag-email').value.trim() || null,
        specialization: document.getElementById('cmdd-ag-spec').value.trim() || null,
        price_range: document.getElementById('cmdd-ag-price').value.trim() || null,
        reliability_rating: document.getElementById('cmdd-ag-rating').value ? Number(document.getElementById('cmdd-ag-rating').value) : null,
        notes: document.getElementById('cmdd-ag-notes').value.trim() || null,
        updated_at: new Date().toISOString()
    };

    try {
        if (agentId) {
            await supabaseClient.from('cm_dd_agents').update(data).eq('id', agentId);
        } else {
            data.created_by = memberId;
            await supabaseClient.from('cm_dd_agents').insert(data);
        }
        var el = document.getElementById('cmdd-modal-agente');
        if (el) el.remove();
        cmDdAgentes = [];
        cmDdTabAgentes(document.getElementById('cmdd-tab-content'));
    } catch (e) { alert('Error al guardar: ' + e.message); }
}

async function cmDdArchivarAgente(agentId) {
    if (!confirm('Archivar este agente?')) return;
    await supabaseClient.from('cm_dd_agents').update({ archived: true, archived_at: new Date().toISOString() }).eq('id', agentId);
    var el = document.getElementById('cmdd-modal-agente');
    if (el) el.remove();
    var overlay = document.querySelector('.cmdd-modal-overlay');
    if (overlay) overlay.remove();
    cmDdAgentes = [];
    cmDdTabAgentes(document.getElementById('cmdd-tab-content'));
}


// === Vista detalle de un agente ===
function cmDdVerAgente(agentId) {
    var ag = cmDdAgentes.find(function(a) { return a.id === agentId; });
    if (!ag) return;

    var jugVinc = cmDdAgentPlayers.filter(function(ap) { return ap.agent_id === agentId; });
    var ints = cmDdInteracciones.filter(function(i) { return i.agent_id === agentId; });
    var stars = '';
    if (ag.reliability_rating) {
        for (var i = 0; i < 5; i++) stars += i < ag.reliability_rating ? '\u2605' : '\u2606';
    }

    var h = '<div class="cmdd-modal-overlay" onclick="if(event.target===this)this.remove()">';
    h += '<div class="cmdd-modal" style="max-width:700px">';
    h += '<div class="cmdd-modal-header">';
    h += '<h3>' + cmDdEsc(ag.name) + (ag.agency ? ' <span style="color:#94a3b8;font-size:13px;font-weight:400">' + cmDdEsc(ag.agency) + '</span>' : '') + '</h3>';
    h += '<div style="display:flex;gap:8px;align-items:center">';
    h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-secondary" onclick="event.stopPropagation();this.closest(\'.cmdd-modal-overlay\').remove();cmDdModalAgente(\x27' + ag.id + '\x27)">Editar</button>';
    h += '<button class="cmdd-modal-close" onclick="this.closest(\'.cmdd-modal-overlay\').remove()">&times;</button>';
    h += '</div></div>';

    h += '<div class="cmdd-modal-body" style="max-height:75vh;overflow-y:auto">';

    // Info
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;margin-bottom:14px">';
    if (ag.phone) h += '<div><span style="color:#64748b">Tel:</span> <span style="color:#e2e8f0">' + cmDdEsc(ag.phone) + '</span></div>';
    if (ag.email) h += '<div><span style="color:#64748b">Email:</span> <span style="color:#e2e8f0">' + cmDdEsc(ag.email) + '</span></div>';
    if (ag.country) h += '<div><span style="color:#64748b">Pais:</span> <span style="color:#e2e8f0">' + cmDdEsc(ag.country) + '</span></div>';
    if (ag.price_range) h += '<div><span style="color:#64748b">Precios:</span> <span style="color:#e2e8f0">' + cmDdEsc(ag.price_range) + '</span></div>';
    if (ag.specialization) h += '<div style="grid-column:1/-1"><span style="color:#64748b">Esp.:</span> <span style="color:#e2e8f0">' + cmDdEsc(ag.specialization) + '</span></div>';
    if (stars) h += '<div><span style="color:#64748b">Fiabilidad:</span> <span style="color:#f59e0b">' + stars + '</span></div>';
    h += '</div>';
    if (ag.notes) {
        h += '<div style="padding:8px 12px;background:#1e293b;border-radius:6px;color:#94a3b8;font-size:12px;margin-bottom:14px;line-height:1.5">' + cmDdEsc(ag.notes) + '</div>';
    }

    // Jugadores vinculados
    h += '<div class="cmdd-section" style="background:#0f172a">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
    h += '<h3 style="margin:0">\ud83c\udfbd Jugadores vinculados (' + jugVinc.length + ')</h3>';
    h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-secondary" onclick="cmDdModalVincularJugador(\x27' + ag.id + '\x27)">+ Vincular</button>';
    h += '</div>';
    if (jugVinc.length === 0) {
        h += '<div style="color:#64748b;font-size:13px;text-align:center;padding:8px">Sin jugadores vinculados a este agente.</div>';
    } else {
        jugVinc.forEach(function(ap) {
            var player = cmDdJugadores.find(function(j) { return j.id === ap.player_id; });
            h += '<div class="cmdd-list-item">';
            h += '<div class="cmdd-list-name">' + cmDdEsc(player ? player.name : '?') + '</div>';
            h += '<div style="color:#94a3b8;font-size:12px">' + cmDdEsc(player ? player.current_club : '') + '</div>';
            h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-danger" style="padding:2px 8px;font-size:10px" onclick="event.stopPropagation();cmDdDesvincularJugador(\x27' + ap.id + '\x27,\x27' + ag.id + '\x27)">&times;</button>';
            h += '</div>';
        });
    }
    h += '</div>';

    // Historial de contactos
    h += '<div class="cmdd-section" style="background:#0f172a">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
    h += '<h3 style="margin:0">\ud83d\udcac Historial de contactos (' + ints.length + ')</h3>';
    h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-secondary" onclick="cmDdModalInteraccion(\x27' + ag.id + '\x27)">+ Contacto</button>';
    h += '</div>';
    if (ints.length === 0) {
        h += '<div style="color:#64748b;font-size:13px;text-align:center;padding:8px">Sin contactos registrados.</div>';
    } else {
        var typeIcons = { llamada:'\ud83d\udcde', reunion:'\ud83e\udd1d', email:'\ud83d\udce7', whatsapp:'\ud83d\udcf1', evento:'\ud83c\udf1f', otro:'\ud83d\udcac' };
        var outcomeColors = { positivo:'#4ade80', neutro:'#94a3b8', negativo:'#ef4444', pendiente:'#f59e0b' };
        ints.slice(0, 10).forEach(function(int) {
            h += '<div class="cmdd-list-item" style="flex-direction:column;align-items:flex-start;gap:4px">';
            h += '<div style="display:flex;justify-content:space-between;width:100%;align-items:center">';
            h += '<div style="display:flex;align-items:center;gap:6px">';
            h += '<span>' + (typeIcons[int.interaction_type] || '\ud83d\udcac') + '</span>';
            h += '<span style="color:#e2e8f0;font-size:13px;font-weight:600">' + cmDdFechaCorta(int.interaction_date) + '</span>';
            h += '<span class="cmdd-badge" style="background:#1e293b;color:#94a3b8">' + cmDdEsc(int.interaction_type) + '</span>';
            h += '</div>';
            if (int.outcome) h += '<span style="color:' + (outcomeColors[int.outcome] || '#94a3b8') + ';font-size:11px;font-weight:600">' + cmDdEsc(int.outcome) + '</span>';
            h += '</div>';
            if (int.summary) h += '<div style="color:#94a3b8;font-size:12px;line-height:1.4">' + cmDdEsc(int.summary) + '</div>';
            if (int.follow_up_date) h += '<div style="color:#f59e0b;font-size:11px">\u23f0 Seguimiento: ' + cmDdFechaCorta(int.follow_up_date) + '</div>';
            h += '</div>';
        });
    }
    h += '</div>';

    h += '</div>'; // body
    h += '</div></div>'; // modal, overlay

    var div = document.createElement('div'); div.innerHTML = h;
    document.body.appendChild(div.firstElementChild);
}


// Modal vincular jugador a agente
function cmDdModalVincularJugador(agentId) {
    var yaVinc = cmDdAgentPlayers.filter(function(ap) { return ap.agent_id === agentId; }).map(function(ap) { return ap.player_id; });
    var disponibles = cmDdJugadores.filter(function(j) { return yaVinc.indexOf(j.id) === -1; });

    var h = '<div class="cmdd-modal-overlay" id="cmdd-modal-vincular" onclick="if(event.target===this)this.remove()">';
    h += '<div class="cmdd-modal" style="max-width:500px">';
    h += '<div class="cmdd-modal-header"><h3>Vincular jugador</h3><button class="cmdd-modal-close" onclick="document.getElementById(\'cmdd-modal-vincular\').remove()">&times;</button></div>';
    h += '<div class="cmdd-modal-body">';
    if (disponibles.length === 0) {
        h += '<div style="color:#64748b;font-size:13px;text-align:center;padding:16px">Todos los jugadores ya estan vinculados a este agente.</div>';
    } else {
        h += '<div class="cmdd-form-group"><label>Selecciona jugador</label><select id="cmdd-vinc-player">';
        disponibles.sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
        disponibles.forEach(function(p) {
            h += '<option value="' + p.id + '">' + cmDdEsc(p.name) + ' (' + cmDdEsc(p.current_club || '-') + ')</option>';
        });
        h += '</select></div>';
        h += '<div class="cmdd-form-group"><label>Notas (opcional)</label><textarea id="cmdd-vinc-notes" rows="2"></textarea></div>';
    }
    h += '</div>';
    h += '<div class="cmdd-modal-footer">';
    h += '<button class="cmdd-btn cmdd-btn-secondary" onclick="document.getElementById(\'cmdd-modal-vincular\').remove()">Cancelar</button>';
    if (disponibles.length > 0) h += '<button class="cmdd-btn cmdd-btn-primary" onclick="cmDdGuardarVinculo(\x27' + agentId + '\x27)">Vincular</button>';
    h += '</div></div></div>';

    var div = document.createElement('div'); div.innerHTML = h;
    document.body.appendChild(div.firstElementChild);
}

async function cmDdGuardarVinculo(agentId) {
    var playerId = document.getElementById('cmdd-vinc-player').value;
    var notes = (document.getElementById('cmdd-vinc-notes').value || '').trim() || null;
    try {
        await supabaseClient.from('cm_dd_agent_players').insert({ club_id: clubId, agent_id: agentId, player_id: playerId, notes: notes });
        document.getElementById('cmdd-modal-vincular').remove();
        document.querySelector('.cmdd-modal-overlay').remove();
        cmDdAgentes = [];
        cmDdTabAgentes(document.getElementById('cmdd-tab-content'));
    } catch (e) { alert('Error: ' + e.message); }
}

async function cmDdDesvincularJugador(apId, agentId) {
    if (!confirm('Desvincular este jugador del agente?')) return;
    await supabaseClient.from('cm_dd_agent_players').delete().eq('id', apId);
    document.querySelector('.cmdd-modal-overlay').remove();
    cmDdAgentes = [];
    cmDdTabAgentes(document.getElementById('cmdd-tab-content'));
}


// Modal nueva interaccion
function cmDdModalInteraccion(agentId, playerId) {
    var h = '<div class="cmdd-modal-overlay" id="cmdd-modal-interaccion" onclick="if(event.target===this)this.remove()">';
    h += '<div class="cmdd-modal" style="max-width:500px">';
    h += '<div class="cmdd-modal-header"><h3>Nuevo contacto</h3><button class="cmdd-modal-close" onclick="document.getElementById(\'cmdd-modal-interaccion\').remove()">&times;</button></div>';
    h += '<div class="cmdd-modal-body">';

    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Tipo *</label><select id="cmdd-int-type">';
    ['llamada','reunion','email','whatsapp','evento','otro'].forEach(function(t) {
        h += '<option value="' + t + '">' + t.charAt(0).toUpperCase() + t.slice(1) + '</option>';
    });
    h += '</select></div>';
    h += '<div class="cmdd-form-group"><label>Fecha *</label><input type="date" id="cmdd-int-date" value="' + new Date().toISOString().split('T')[0] + '"></div>';
    h += '</div>';

    if (!playerId) {
        h += '<div class="cmdd-form-group"><label>Jugador relacionado (opcional)</label><select id="cmdd-int-player"><option value="">Ninguno</option>';
        cmDdJugadores.sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
        cmDdJugadores.forEach(function(p) { h += '<option value="' + p.id + '">' + cmDdEsc(p.name) + '</option>'; });
        h += '</select></div>';
    }

    h += '<div class="cmdd-form-group"><label>Resumen</label><textarea id="cmdd-int-summary" placeholder="Que se hablo, que se acordo..."></textarea></div>';
    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Resultado</label><select id="cmdd-int-outcome"><option value="">Sin definir</option>';
    ['positivo','neutro','negativo','pendiente'].forEach(function(o) {
        h += '<option value="' + o + '">' + o.charAt(0).toUpperCase() + o.slice(1) + '</option>';
    });
    h += '</select></div>';
    h += '<div class="cmdd-form-group"><label>Seguimiento</label><input type="date" id="cmdd-int-followup"></div>';
    h += '</div>';

    h += '</div>';
    h += '<div class="cmdd-modal-footer">';
    h += '<button class="cmdd-btn cmdd-btn-secondary" onclick="document.getElementById(\'cmdd-modal-interaccion\').remove()">Cancelar</button>';
    h += '<button class="cmdd-btn cmdd-btn-primary" onclick="cmDdGuardarInteraccion(\x27' + (agentId || '') + '\x27,\x27' + (playerId || '') + '\x27)">Guardar</button>';
    h += '</div></div></div>';

    var div = document.createElement('div'); div.innerHTML = h;
    document.body.appendChild(div.firstElementChild);
}

async function cmDdGuardarInteraccion(agentId, fixedPlayerId) {
    var tipo = document.getElementById('cmdd-int-type').value;
    var fecha = document.getElementById('cmdd-int-date').value;
    if (!tipo || !fecha) { alert('Tipo y fecha son obligatorios'); return; }

    var memberId = null;
    if (typeof cmState !== 'undefined' && cmState.miembro) memberId = cmState.miembro.id;

    var playerEl = document.getElementById('cmdd-int-player');
    var playerId = fixedPlayerId || (playerEl ? playerEl.value : '') || null;

    var data = {
        club_id: clubId,
        agent_id: agentId || null,
        player_id: playerId,
        interaction_type: tipo,
        interaction_date: fecha,
        summary: (document.getElementById('cmdd-int-summary').value || '').trim() || null,
        outcome: document.getElementById('cmdd-int-outcome').value || null,
        follow_up_date: document.getElementById('cmdd-int-followup').value || null,
        created_by: memberId
    };

    try {
        await supabaseClient.from('cm_dd_interactions').insert(data);
        document.getElementById('cmdd-modal-interaccion').remove();
        document.querySelector('.cmdd-modal-overlay').remove();
        cmDdAgentes = [];
        cmDdTabAgentes(document.getElementById('cmdd-tab-content'));
    } catch (e) { alert('Error: ' + e.message); }
}


// ============================================================
// FUNCIONES DE ASIGNACION DE PARTIDOS
// ============================================================

async function cmDdAsignarScout(matchId, scoutId) {
    var memberId = null;
    if (typeof cmState !== 'undefined' && cmState.miembro) memberId = cmState.miembro.id;

    await supabaseClient.from('cm_sc_matches').update({
        assigned_to: scoutId || null,
        assigned_by: scoutId ? memberId : null,
        updated_at: new Date().toISOString()
    }).eq('id', matchId);

    cmDdTabDashboard(document.getElementById('cmdd-tab-content'));
}

function cmDdModalPartido(editId) {
    var existing = editId ? cmDdCobPartidos.find(function(m) { return m.id === editId; }) : null;

    var scoutMembers = cmDdMiembros.filter(cmDdTienePermisoScouting);

    var titulo = existing ? 'Editar partido' : 'Agendar partido';
    var h = '<div class="cmdd-modal-overlay" id="cmdd-modal-partido" onclick="if(event.target===this)this.remove()">';
    h += '<div class="cmdd-modal" style="max-width:580px">';
    h += '<div class="cmdd-modal-header"><h3>' + titulo + '</h3><button class="cmdd-modal-close" onclick="document.getElementById(\'cmdd-modal-partido\').remove()">&times;</button></div>';
    h += '<div class="cmdd-modal-body">';

    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Equipo local *</label><input id="cmdd-mp-home" placeholder="ej: Ponferradina" value="' + cmDdEsc(existing ? existing.home_team : '') + '"></div>';
    h += '<div class="cmdd-form-group"><label>Equipo visitante *</label><input id="cmdd-mp-away" placeholder="ej: Cultural Leonesa" value="' + cmDdEsc(existing ? existing.away_team : '') + '"></div>';
    h += '</div>';
    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Fecha *</label><input type="date" id="cmdd-mp-date" value="' + (existing ? existing.match_date || '' : '') + '"></div>';
    h += '<div class="cmdd-form-group"><label>Hora</label><input type="time" id="cmdd-mp-time" value="' + (existing && existing.kick_off_time ? existing.kick_off_time.substring(0, 5) : '') + '"></div>';
    h += '</div>';
    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Competicion</label><input id="cmdd-mp-comp" placeholder="ej: 1 RFEF, LaLiga2" value="' + cmDdEsc(existing ? existing.competition : '') + '"></div>';
    h += '<div class="cmdd-form-group"><label>Estadio</label><input id="cmdd-mp-venue" placeholder="ej: El Toralin" value="' + cmDdEsc(existing ? existing.venue : '') + '"></div>';
    h += '</div>';

    // Metodo de visionado
    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Visionado *</label><select id="cmdd-mp-method">';
    var methods = [
        { val: 'live', label: '\ud83c\udfdf\ufe0f En directo (presencial)' },
        { val: 'tv', label: '\ud83d\udcfa Television' },
        { val: 'video', label: '\ud83d\udcbb Plataforma video (Wyscout/Hudl)' }
    ];
    methods.forEach(function(m) {
        h += '<option value="' + m.val + '"' + (existing && existing.viewing_method === m.val ? ' selected' : '') + '>' + m.label + '</option>';
    });
    h += '</select></div>';

    h += '<div class="cmdd-form-group"><label>Asignar a scout</label><select id="cmdd-mp-scout">';
    h += '<option value="">Sin asignar</option>';
    scoutMembers.forEach(function(sm) {
        h += '<option value="' + sm.id + '"' + (existing && existing.assigned_to === sm.id ? ' selected' : '') + '>' + cmDdEsc(sm.display_name) + '</option>';
    });
    h += '</select></div>';
    h += '</div>';

    // Jugadores objetivo
    h += '<div class="cmdd-form-group"><label>Jugadores objetivo (que observar en este partido)</label>';
    h += '<textarea id="cmdd-mp-notes" rows="3" placeholder="ej: Lateral derecho #3 del local, mediapunta #10 del visitante, observar pressing alto...">' + cmDdEsc(existing ? existing.notes : '') + '</textarea></div>';

    h += '</div>';
    h += '<div class="cmdd-modal-footer">';
    if (existing) h += '<button class="cmdd-btn cmdd-btn-danger cmdd-btn-sm" onclick="cmDdArchivarPartido(\x27' + existing.id + '\x27)">Eliminar</button>';
    h += '<button class="cmdd-btn cmdd-btn-secondary" onclick="document.getElementById(\'cmdd-modal-partido\').remove()">Cancelar</button>';
    h += '<button class="cmdd-btn cmdd-btn-primary" onclick="cmDdGuardarPartido(\x27' + (existing ? existing.id : '') + '\x27)">' + (existing ? 'Guardar' : 'Agendar') + '</button>';
    h += '</div></div></div>';

    var div = document.createElement('div'); div.innerHTML = h;
    document.body.appendChild(div.firstElementChild);
}

async function cmDdGuardarPartido(editId) {
    var home = (document.getElementById('cmdd-mp-home').value || '').trim();
    var away = (document.getElementById('cmdd-mp-away').value || '').trim();
    var date = document.getElementById('cmdd-mp-date').value;
    if (!home || !away || !date) { alert('Equipos y fecha son obligatorios'); return; }

    var memberId = null;
    if (typeof cmState !== 'undefined' && cmState.miembro) memberId = cmState.miembro.id;

    var scoutId = document.getElementById('cmdd-mp-scout').value || null;

    var data = {
        club_id: clubId,
        home_team: home,
        away_team: away,
        match_date: date,
        kick_off_time: document.getElementById('cmdd-mp-time').value || null,
        competition: document.getElementById('cmdd-mp-comp').value.trim() || null,
        venue: document.getElementById('cmdd-mp-venue').value.trim() || null,
        viewing_method: document.getElementById('cmdd-mp-method').value || 'live',
        assigned_to: scoutId,
        assigned_by: scoutId ? memberId : null,
        notes: document.getElementById('cmdd-mp-notes').value.trim() || null,
        updated_at: new Date().toISOString()
    };

    try {
        if (editId) {
            await supabaseClient.from('cm_sc_matches').update(data).eq('id', editId);
        } else {
            data.status = 'pending';
            data.source = 'dd_manual';
            data.created_by = memberId;
            await supabaseClient.from('cm_sc_matches').insert(data);
        }
        document.getElementById('cmdd-modal-partido').remove();
        // Recargar la tab activa
        var cont = document.getElementById('cmdd-tab-content');
        if (cmDdTabActiva === 'cobertura') { cmDdCobPartidos = []; cmDdTabCobertura(cont); }
        else { cmDdTabDashboard(cont); }
    } catch (e) { alert('Error: ' + e.message); }
}

async function cmDdArchivarPartido(matchId) {
    if (!confirm('Eliminar este partido?')) return;
    await supabaseClient.from('cm_sc_matches').update({ archived: true, archived_at: new Date().toISOString() }).eq('id', matchId);
    document.getElementById('cmdd-modal-partido').remove();
    var cont = document.getElementById('cmdd-tab-content');
    if (cmDdTabActiva === 'cobertura') { cmDdCobPartidos = []; cmDdTabCobertura(cont); }
    else { cmDdTabDashboard(cont); }
}


// ============================================================
// TAB 5: GASTOS (aprobar scouts + gastos propios DD)
// ============================================================

async function cmDdTabGastos(cont) {
    cont.innerHTML = '<div class="cmdd-empty"><div class="icon">&#8987;</div><p>Cargando gastos...</p></div>';

    if (cmDdMiembros.length === 0) {
        try {
            var res = await supabaseClient.from('club_members').select('id, display_name, wp_user_id, role_id, club_roles(name, permissions)')
                .eq('club_id', clubId).eq('active', true);
            cmDdMiembros = res.data || [];
        } catch (e) { cmDdMiembros = []; }
    }

    var miId = null;
    if (typeof cmState !== 'undefined' && cmState.miembro) miId = cmState.miembro.id;

    var [resG, resI] = await Promise.all([
        supabaseClient.from('cm_sc_expense_reports').select('*').eq('club_id', clubId).eq('archived', false)
            .order('submitted_at', { ascending: false }),
        supabaseClient.from('cm_sc_expense_items').select('*').eq('club_id', clubId).eq('archived', false)
    ]);
    cmDdGastos = resG.data || [];
    cmDdGastoItems = resI.data || [];

    cmDdRenderGastos(miId);
}

function cmDdRenderGastos(miId) {
    var cont = document.getElementById('cmdd-tab-content');
    if (!cont) return;

    var statusLabels = { draft:'Borrador', submitted:'Pendiente DD', approved:'Aprobado \u2192 Financiero', rejected:'Rechazado', paid:'Pagado' };
    var statusColors = { draft:'#64748b', submitted:'#3b82f6', approved:'#22c55e', rejected:'#ef4444', paid:'#94a3b8' };

    // Separar gastos de scouts vs gastos propios DD
    var gastosScouts = cmDdGastos.filter(function(g) { return g.scout_id !== miId; });
    var gastosPropios = cmDdGastos.filter(function(g) { return g.scout_id === miId; });

    var filtered = cmDdGastoFiltro ? gastosScouts.filter(function(g) { return g.status === cmDdGastoFiltro; }) : gastosScouts;

    // KPIs
    var totalPendientes = gastosScouts.filter(function(g) { return g.status === 'submitted'; });
    var totalAprobados = gastosScouts.filter(function(g) { return g.status === 'approved'; });
    var sumPend = totalPendientes.reduce(function(s, g) { return s + (g.total_amount_cents || 0); }, 0);
    var sumAprob = totalAprobados.reduce(function(s, g) { return s + (g.total_amount_cents || 0); }, 0);
    var sumPropios = gastosPropios.reduce(function(s, g) { return s + (g.total_amount_cents || 0); }, 0);

    var h = '';

    // === SECCION 1: Mis gastos (DD) ===
    h += '<div class="cmdd-section" style="border-left:3px solid #f59e0b">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
    h += '<h3 style="margin:0">\ud83d\udcbc Mis gastos (Director Deportivo)</h3>';
    h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-primary" onclick="cmDdModalGastoPropio()">+ Nuevo gasto</button>';
    h += '</div>';
    if (gastosPropios.length === 0) {
        h += '<div style="color:#64748b;font-size:13px;text-align:center;padding:8px">Sin gastos propios registrados. Registra viajes, comidas, eventos, etc.</div>';
    } else {
        gastosPropios.forEach(function(g) {
            var amount = (g.total_amount_cents || 0) / 100;
            var sc = statusColors[g.status] || '#64748b';
            h += '<div class="cmdd-list-item">';
            h += '<div style="flex:1;min-width:0">';
            h += '<div class="cmdd-list-name">' + cmDdEsc(g.title || 'Sin titulo') + '</div>';
            h += '<div class="cmdd-list-sub">' + cmDdFechaCorta(g.period_from) + ' a ' + cmDdFechaCorta(g.period_to) + '</div>';
            h += '</div>';
            h += '<div style="display:flex;align-items:center;gap:8px">';
            h += '<span style="color:#e2e8f0;font-size:13px;font-weight:600">' + amount.toFixed(2) + ' \u20AC</span>';
            h += '<span class="cmdd-badge" style="background:' + sc + '22;color:' + sc + '">' + (statusLabels[g.status] || g.status) + '</span>';
            h += '</div>';
            h += '</div>';
        });
        h += '<div style="text-align:right;margin-top:6px;color:#94a3b8;font-size:12px">Total propio: <strong style="color:#f59e0b">' + (sumPropios / 100).toFixed(2) + ' \u20AC</strong></div>';
    }
    h += '</div>';

    // === SECCION 2: Gastos de scouts ===
    h += '<div style="margin-top:20px">';
    h += '<div class="cmdd-kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">';
    h += '<div class="cmdd-kpi' + (totalPendientes.length > 0 ? ' alert' : '') + '"><div class="value">' + totalPendientes.length + '</div><div class="label">Por aprobar (' + (sumPend / 100).toFixed(2) + ' \u20AC)</div></div>';
    h += '<div class="cmdd-kpi"><div class="value">' + totalAprobados.length + '</div><div class="label">Enviados a Financiero (' + (sumAprob / 100).toFixed(2) + ' \u20AC)</div></div>';
    h += '<div class="cmdd-kpi"><div class="value">' + gastosScouts.filter(function(g) { return g.status === 'paid'; }).length + '</div><div class="label">Pagados</div></div>';
    h += '</div>';

    // Toolbar
    h += '<div class="cmdd-toolbar">';
    h += '<select onchange="cmDdGastoFiltro=this.value;cmDdRenderGastos(\x27' + (miId || '') + '\x27)">';
    h += '<option value="">Todos los estados</option>';
    Object.keys(statusLabels).forEach(function(k) {
        h += '<option value="' + k + '"' + (cmDdGastoFiltro === k ? ' selected' : '') + '>' + statusLabels[k] + '</option>';
    });
    h += '</select>';
    h += '<span class="cmdd-contador">Gastos de scouts: <strong>' + filtered.length + '</strong></span>';
    h += '</div>';

    if (filtered.length === 0) {
        h += '<div class="cmdd-empty"><div class="icon">&#128176;</div><h3>Sin gastos de scouts</h3><p>No hay hojas de gastos con el filtro seleccionado.</p></div>';
    } else {
        filtered.forEach(function(g) {
            var items = cmDdGastoItems.filter(function(i) { return i.report_id === g.id; });
            var amount = (g.total_amount_cents || 0) / 100;
            var sc = statusColors[g.status] || '#64748b';

            h += '<div class="cmdd-section">';
            h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">';
            h += '<div>';
            h += '<div style="color:#f1f5f9;font-size:14px;font-weight:700">' + cmDdEsc(g.title || 'Sin titulo') + '</div>';
            h += '<div style="color:#94a3b8;font-size:12px">Scout: ' + cmDdGetMiembroNombre(g.scout_id) + ' \u00B7 ' + cmDdFechaCorta(g.period_from) + ' a ' + cmDdFechaCorta(g.period_to) + '</div>';
            h += '</div>';
            h += '<div style="text-align:right">';
            h += '<div style="color:#f59e0b;font-size:20px;font-weight:700">' + amount.toFixed(2) + ' \u20AC</div>';
            h += '<span class="cmdd-badge" style="background:' + sc + '22;color:' + sc + '">' + (statusLabels[g.status] || g.status) + '</span>';
            h += '</div></div>';

            // Items resumen
            if (items.length > 0) {
                h += '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
                items.forEach(function(it) {
                    h += '<span style="font-size:11px;color:#94a3b8;background:#0f172a;padding:3px 8px;border-radius:4px">' +
                        cmDdEsc(it.concept) + ': ' + ((it.amount_cents || 0) / 100).toFixed(2) + ' \u20AC</span>';
                });
                h += '</div>';
            }
            if (g.notes) {
                h += '<div style="margin-top:6px;color:#64748b;font-size:12px">' + cmDdEsc(g.notes) + '</div>';
            }

            // Acciones DD: aprobar o rechazar (NO pagar, eso es del financiero)
            if (g.status === 'submitted') {
                h += '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">';
                h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-success" onclick="cmDdAccionGasto(\x27' + g.id + '\x27,\'approve\')">&#10003; Aprobar y enviar a Financiero</button>';
                h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-danger" onclick="cmDdRechazarGasto(\x27' + g.id + '\x27)">&#10007; Rechazar</button>';
                h += '</div>';
            }
            if (g.status === 'approved') {
                h += '<div style="margin-top:8px;padding:6px 10px;background:#052e1633;border-radius:6px;color:#4ade80;font-size:11px">\u2705 Aprobado por DD \u2192 Pendiente de pago por Financiero</div>';
            }
            if (g.rejection_reason) {
                h += '<div style="margin-top:8px;padding:8px 10px;background:#450a0a33;border-radius:6px;border-left:3px solid #ef4444">';
                h += '<div style="color:#fca5a5;font-size:11px;font-weight:700">RECHAZADO \u2192 Devuelto al scout</div>';
                h += '<div style="color:#fca5a5;font-size:12px;margin-top:2px">' + cmDdEsc(g.rejection_reason) + '</div>';
                h += '</div>';
            }

            h += '</div>';
        });
    }
    h += '</div>'; // fin seccion gastos scouts

    cont.innerHTML = h;
}

async function cmDdAccionGasto(reportId, accion) {
    var memberId = null;
    if (typeof cmState !== 'undefined' && cmState.miembro) memberId = cmState.miembro.id;

    if (accion === 'approve') {
        if (!confirm('Aprobar este gasto y enviarlo a Financiero para pago?')) return;
        await supabaseClient.from('cm_sc_expense_reports').update({
            status: 'approved', approved_at: new Date().toISOString(), approved_by: memberId
        }).eq('id', reportId);
    }
    cmDdGastos = [];
    cmDdTabGastos(document.getElementById('cmdd-tab-content'));
}

function cmDdRechazarGasto(reportId) {
    var motivos = [
        'Documentacion incompleta (faltan tickets/facturas)',
        'Gasto no autorizado previamente',
        'Importe incorrecto o no coincide con tickets',
        'Concepto no aprobable por politica del club',
        'Periodo incorrecto',
        'Otro (especificar)'
    ];

    var h = '<div class="cmdd-modal-overlay" id="cmdd-modal-rechazo" onclick="if(event.target===this)this.remove()">';
    h += '<div class="cmdd-modal" style="max-width:450px">';
    h += '<div class="cmdd-modal-header"><h3>Rechazar gasto</h3><button class="cmdd-modal-close" onclick="document.getElementById(\'cmdd-modal-rechazo\').remove()">&times;</button></div>';
    h += '<div class="cmdd-modal-body">';
    h += '<div class="cmdd-form-group"><label>Motivo del rechazo *</label><select id="cmdd-rech-motivo" onchange="var o=document.getElementById(\'cmdd-rech-otro\');o.style.display=this.value===\'otro\'?\'block\':\'none\'">';
    motivos.forEach(function(m, i) {
        var val = i < motivos.length - 1 ? m : 'otro';
        h += '<option value="' + cmDdEsc(val) + '">' + cmDdEsc(m) + '</option>';
    });
    h += '</select></div>';
    h += '<div class="cmdd-form-group" id="cmdd-rech-otro" style="display:none"><label>Especifica el motivo</label><textarea id="cmdd-rech-texto"></textarea></div>';
    h += '</div>';
    h += '<div class="cmdd-modal-footer">';
    h += '<button class="cmdd-btn cmdd-btn-secondary" onclick="document.getElementById(\'cmdd-modal-rechazo\').remove()">Cancelar</button>';
    h += '<button class="cmdd-btn cmdd-btn-danger" onclick="cmDdConfirmarRechazo(\x27' + reportId + '\x27)">Rechazar y devolver al scout</button>';
    h += '</div></div></div>';

    var div = document.createElement('div'); div.innerHTML = h;
    document.body.appendChild(div.firstElementChild);
}

async function cmDdConfirmarRechazo(reportId) {
    var motivo = document.getElementById('cmdd-rech-motivo').value;
    if (motivo === 'otro') {
        motivo = (document.getElementById('cmdd-rech-texto').value || '').trim();
        if (!motivo) { alert('Escribe el motivo del rechazo'); return; }
    }

    await supabaseClient.from('cm_sc_expense_reports').update({
        status: 'rejected', rejection_reason: motivo
    }).eq('id', reportId);

    document.getElementById('cmdd-modal-rechazo').remove();
    cmDdGastos = [];
    cmDdTabGastos(document.getElementById('cmdd-tab-content'));
}


// Modal gasto propio del DD
function cmDdModalGastoPropio() {
    var h = '<div class="cmdd-modal-overlay" id="cmdd-modal-gasto-dd" onclick="if(event.target===this)this.remove()">';
    h += '<div class="cmdd-modal" style="max-width:500px">';
    h += '<div class="cmdd-modal-header"><h3>Nuevo gasto propio</h3><button class="cmdd-modal-close" onclick="document.getElementById(\'cmdd-modal-gasto-dd\').remove()">&times;</button></div>';
    h += '<div class="cmdd-modal-body">';

    h += '<div class="cmdd-form-group"><label>Titulo *</label><input id="cmdd-gp-title" placeholder="ej: Viaje scouting Oporto enero 2026"></div>';
    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Periodo desde *</label><input type="date" id="cmdd-gp-from"></div>';
    h += '<div class="cmdd-form-group"><label>Periodo hasta *</label><input type="date" id="cmdd-gp-to"></div>';
    h += '</div>';
    h += '<div class="cmdd-form-group"><label>Importe total (EUR) *</label><input type="number" step="0.01" id="cmdd-gp-amount" placeholder="125.50"></div>';
    h += '<div class="cmdd-form-group"><label>Notas / conceptos</label><textarea id="cmdd-gp-notes" placeholder="Hotel 2 noches, gasolina ida/vuelta, comida con agente..."></textarea></div>';

    h += '</div>';
    h += '<div class="cmdd-modal-footer">';
    h += '<button class="cmdd-btn cmdd-btn-secondary" onclick="document.getElementById(\'cmdd-modal-gasto-dd\').remove()">Cancelar</button>';
    h += '<button class="cmdd-btn cmdd-btn-primary" onclick="cmDdGuardarGastoPropio()">Enviar a Financiero</button>';
    h += '</div></div></div>';

    var div = document.createElement('div'); div.innerHTML = h;
    document.body.appendChild(div.firstElementChild);
}

async function cmDdGuardarGastoPropio() {
    var title = (document.getElementById('cmdd-gp-title').value || '').trim();
    var from = document.getElementById('cmdd-gp-from').value;
    var to = document.getElementById('cmdd-gp-to').value;
    var amount = parseFloat(document.getElementById('cmdd-gp-amount').value);
    if (!title || !from || !to || isNaN(amount)) { alert('Titulo, periodo e importe son obligatorios'); return; }

    var memberId = null;
    if (typeof cmState !== 'undefined' && cmState.miembro) memberId = cmState.miembro.id;

    var data = {
        club_id: clubId,
        scout_id: memberId,
        title: title,
        period_from: from,
        period_to: to,
        total_amount_cents: Math.round(amount * 100),
        notes: (document.getElementById('cmdd-gp-notes').value || '').trim() || null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        created_by: memberId
    };

    try {
        await supabaseClient.from('cm_sc_expense_reports').insert(data);
        document.getElementById('cmdd-modal-gasto-dd').remove();
        cmDdGastos = [];
        cmDdTabGastos(document.getElementById('cmdd-tab-content'));
    } catch (e) { alert('Error: ' + e.message); }
}


// ============================================================
// TAB 6: NOTAS Y DECISIONES
// ============================================================

async function cmDdTabNotas(cont) {
    cont.innerHTML = '<div class="cmdd-empty"><div class="icon">&#8987;</div><p>Cargando notas...</p></div>';
    await cmDdEnsureJugadoresCargados();

    var res = await supabaseClient.from('cm_dd_notes').select('*')
        .eq('club_id', clubId).eq('archived', false)
        .order('created_at', { ascending: false });
    cmDdNotas = res.data || [];

    cmDdRenderNotas();
}

function cmDdRenderNotas() {
    var cont = document.getElementById('cmdd-tab-content');
    if (!cont) return;

    var typeLabels = { decision:'Decision', reunion_scouting:'Reunion scouting', estrategia:'Estrategia', evaluacion:'Evaluacion', otro:'Otro' };
    var typeColors = { decision:'#f59e0b', reunion_scouting:'#3b82f6', estrategia:'#a855f7', evaluacion:'#22c55e', otro:'#94a3b8' };

    var filtered = cmDdNotas;
    if (cmDdNotaFiltro) {
        filtered = filtered.filter(function(n) { return n.note_type === cmDdNotaFiltro; });
    }

    var h = '<div class="cmdd-toolbar">';
    h += '<div style="display:flex;gap:8px;align-items:center">';
    h += '<button class="cmdd-btn cmdd-btn-primary" onclick="cmDdModalNota()">+ Nueva nota</button>';
    h += '<select onchange="cmDdNotaFiltro=this.value;cmDdRenderNotas()">';
    h += '<option value="">Todos los tipos</option>';
    Object.keys(typeLabels).forEach(function(k) {
        h += '<option value="' + k + '"' + (cmDdNotaFiltro === k ? ' selected' : '') + '>' + typeLabels[k] + '</option>';
    });
    h += '</select>';
    h += '</div>';
    h += '<span class="cmdd-contador"><strong>' + filtered.length + '</strong> notas</span>';
    h += '</div>';

    if (filtered.length === 0) {
        h += '<div class="cmdd-empty"><div class="icon">&#128221;</div><h3>Sin notas</h3><p>Registra decisiones, actas de reuniones y notas estrategicas.</p></div>';
    } else {
        filtered.forEach(function(n) {
            var tc = typeColors[n.note_type] || '#94a3b8';
            var linkedPlayer = n.linked_player_id ? cmDdJugadores.find(function(j) { return j.id === n.linked_player_id; }) : null;

            h += '<div class="cmdd-section" style="border-left:3px solid ' + tc + '">';
            h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">';
            h += '<div style="flex:1">';
            h += '<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">';
            h += '<span class="cmdd-badge" style="background:' + tc + '22;color:' + tc + '">' + (typeLabels[n.note_type] || n.note_type) + '</span>';
            h += '<span style="color:#64748b;font-size:11px">' + cmDdFechaCorta(n.created_at ? n.created_at.split('T')[0] : '') + '</span>';
            h += '</div>';
            h += '<div style="color:#f1f5f9;font-size:14px;font-weight:700;margin-bottom:4px">' + cmDdEsc(n.title) + '</div>';
            if (n.content) h += '<div style="color:#94a3b8;font-size:13px;line-height:1.5;white-space:pre-wrap">' + cmDdEsc(n.content) + '</div>';

            // Links
            var links = [];
            if (linkedPlayer) links.push('\ud83c\udfbd ' + cmDdEsc(linkedPlayer.name));
            if (n.linked_position) links.push('\ud83d\udccd ' + (CMSC_POS_NOMBRES[n.linked_position] || n.linked_position));
            if (links.length > 0) {
                h += '<div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">';
                links.forEach(function(l) { h += '<span style="font-size:11px;color:#64748b;background:#0f172a;padding:2px 8px;border-radius:4px">' + l + '</span>'; });
                h += '</div>';
            }
            h += '</div>';

            h += '<div style="display:flex;gap:6px;flex-shrink:0">';
            h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-secondary" onclick="cmDdModalNota(\x27' + n.id + '\x27)">Editar</button>';
            h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-danger" style="padding:4px 8px" onclick="cmDdArchivarNota(\x27' + n.id + '\x27)">&times;</button>';
            h += '</div>';
            h += '</div></div>';
        });
    }

    cont.innerHTML = h;
}


// Modal crear/editar nota
function cmDdModalNota(notaId) {
    var nota = notaId ? cmDdNotas.find(function(n) { return n.id === notaId; }) : null;
    var titulo = nota ? 'Editar nota' : 'Nueva nota';

    var h = '<div class="cmdd-modal-overlay" id="cmdd-modal-nota" onclick="if(event.target===this)this.remove()">';
    h += '<div class="cmdd-modal">';
    h += '<div class="cmdd-modal-header"><h3>' + titulo + '</h3><button class="cmdd-modal-close" onclick="document.getElementById(\'cmdd-modal-nota\').remove()">&times;</button></div>';
    h += '<div class="cmdd-modal-body">';

    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Tipo *</label><select id="cmdd-nota-type">';
    var typeLabels = { decision:'Decision', reunion_scouting:'Reunion scouting', estrategia:'Estrategia', evaluacion:'Evaluacion', otro:'Otro' };
    Object.keys(typeLabels).forEach(function(k) {
        h += '<option value="' + k + '"' + (nota && nota.note_type === k ? ' selected' : '') + '>' + typeLabels[k] + '</option>';
    });
    h += '</select></div>';
    h += '<div class="cmdd-form-group"><label>Posicion vinculada</label><select id="cmdd-nota-pos"><option value="">Ninguna</option>';
    Object.keys(CMSC_POS_NOMBRES).forEach(function(k) {
        h += '<option value="' + k + '"' + (nota && nota.linked_position === k ? ' selected' : '') + '>' + k + ' - ' + CMSC_POS_NOMBRES[k] + '</option>';
    });
    h += '</select></div>';
    h += '</div>';

    h += '<div class="cmdd-form-group"><label>Titulo *</label><input id="cmdd-nota-title" value="' + cmDdEsc(nota ? nota.title : '') + '"></div>';
    h += '<div class="cmdd-form-group"><label>Contenido</label><textarea id="cmdd-nota-content" style="min-height:120px">' + cmDdEsc(nota ? nota.content : '') + '</textarea></div>';

    h += '<div class="cmdd-form-group"><label>Jugador vinculado (opcional)</label><select id="cmdd-nota-player"><option value="">Ninguno</option>';
    var sortedPlayers = cmDdJugadores.slice().sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
    sortedPlayers.forEach(function(p) {
        h += '<option value="' + p.id + '"' + (nota && nota.linked_player_id === p.id ? ' selected' : '') + '>' + cmDdEsc(p.name) + '</option>';
    });
    h += '</select></div>';

    h += '</div>';
    h += '<div class="cmdd-modal-footer">';
    h += '<button class="cmdd-btn cmdd-btn-secondary" onclick="document.getElementById(\'cmdd-modal-nota\').remove()">Cancelar</button>';
    h += '<button class="cmdd-btn cmdd-btn-primary" onclick="cmDdGuardarNota(\x27' + (nota ? nota.id : '') + '\x27)">Guardar</button>';
    h += '</div></div></div>';

    var div = document.createElement('div'); div.innerHTML = h;
    document.body.appendChild(div.firstElementChild);
}

async function cmDdGuardarNota(notaId) {
    var title = (document.getElementById('cmdd-nota-title').value || '').trim();
    if (!title) { alert('El titulo es obligatorio'); return; }

    var memberId = null;
    if (typeof cmState !== 'undefined' && cmState.miembro) memberId = cmState.miembro.id;

    var data = {
        club_id: clubId,
        note_type: document.getElementById('cmdd-nota-type').value,
        title: title,
        content: (document.getElementById('cmdd-nota-content').value || '').trim() || null,
        linked_player_id: document.getElementById('cmdd-nota-player').value || null,
        linked_position: document.getElementById('cmdd-nota-pos').value || null,
        updated_at: new Date().toISOString()
    };

    try {
        if (notaId) {
            await supabaseClient.from('cm_dd_notes').update(data).eq('id', notaId);
        } else {
            data.created_by = memberId;
            await supabaseClient.from('cm_dd_notes').insert(data);
        }
        document.getElementById('cmdd-modal-nota').remove();
        cmDdNotas = [];
        cmDdTabNotas(document.getElementById('cmdd-tab-content'));
    } catch (e) { alert('Error: ' + e.message); }
}

async function cmDdArchivarNota(notaId) {
    if (!confirm('Archivar esta nota?')) return;
    await supabaseClient.from('cm_dd_notes').update({ archived: true, archived_at: new Date().toISOString() }).eq('id', notaId);
    cmDdNotas = [];
    cmDdTabNotas(document.getElementById('cmdd-tab-content'));
}


// ============================================================
// TAB: PLANTILLA ECONOMICA
// ============================================================

// Mapeo posiciones Planificador → DD
var CMDD_POS_MAP = {
    portero:'POR', central:'DCC', central_derecho:'DCD', central_izquierdo:'DCI',
    lateral_derecho:'LD', lateral_izquierdo:'LI', carrilero_derecho:'CAD', carrilero_izquierdo:'CAI',
    pivote:'PIV', medio_centro:'MC', mediocentro:'MC', mediocentro_defensivo:'MCD',
    interior_derecho:'ID', interior_izquierdo:'II', medio_derecho:'MD', medio_izquierdo:'MI',
    mediapunta:'MP', extremo_derecho:'ED', extremo_izquierdo:'EI',
    punta:'DC', delantero_centro:'DC', delantero:'DC', segunda_punta:'MP'
};

function cmDdMapPos(posArr) {
    if (!posArr || !posArr.length) return '';
    return CMDD_POS_MAP[posArr[0]] || posArr[0];
}

function cmDdFormatEuros(cents) {
    if (!cents || cents === 0) return '-';
    if (cents >= 100000000) return (cents / 100000000).toFixed(1) + ' M\u20AC';
    if (cents >= 100000) return (cents / 100000).toFixed(0) + 'K \u20AC';
    return (cents / 100).toFixed(0) + ' \u20AC';
}

async function cmDdTabPlantilla(cont) {
    cont.innerHTML = '<div class="cmdd-empty"><div class="icon">&#8987;</div><p>Cargando plantilla...</p></div>';

    var [resP, resE, resT, resPS] = await Promise.all([
        supabaseClient.from('club_players')
            .select('id, name, first_name, last_name, nickname, photo_url, birth_date, nationality, positions_main, positions_alt, dominant_foot, height_cm, weight_kg, status, active, end_rights_date, continues_next_season, agent_name')
            .eq('club_id', clubId).eq('active', true)
            .order('name'),
        supabaseClient.from('cm_dd_player_economics')
            .select('*').eq('club_id', clubId),
        supabaseClient.from('club_teams')
            .select('id, name, category')
            .eq('club_id', clubId)
            .order('name'),
        supabaseClient.from('club_player_seasons')
            .select('player_id, team_id, shirt_number, position, active')
            .eq('club_id', clubId).eq('active', true)
    ]);
    cmDdPlantilla = resP.data || [];
    cmDdPlantillaEcon = resE.data || [];
    cmDdEquipos = resT.data || [];
    cmDdPlayerSeasons = resPS.data || [];

    cmDdRenderPlantilla();
}

function cmDdRenderPlantilla() {
    var cont = document.getElementById('cmdd-tab-content');
    if (!cont) return;

    // Filtrar jugadores por equipo
    var jugadoresFiltrados;
    if (cmDdFiltroEquipo) {
        var playerIdsEquipo = cmDdPlayerSeasons.filter(function(ps) { return ps.team_id === cmDdFiltroEquipo; }).map(function(ps) { return ps.player_id; });
        jugadoresFiltrados = cmDdPlantilla.filter(function(p) { return playerIdsEquipo.indexOf(p.id) >= 0; });
    } else {
        jugadoresFiltrados = cmDdPlantilla;
    }

    // Merge economics + calculos
    var jugadores = jugadoresFiltrados.map(function(p) {
        var econ = cmDdPlantillaEcon.find(function(e) { return e.player_id === p.id; }) || {};
        var ps = cmDdPlayerSeasons.find(function(s) { return s.player_id === p.id; }) || {};
        var edad = '';
        if (p.birth_date) {
            var bd = new Date(p.birth_date + 'T12:00:00');
            edad = Math.floor((new Date() - bd) / (365.25 * 24 * 60 * 60 * 1000));
        }
        return Object.assign({}, p, {
            econ: econ, edad: edad, posDD: cmDdMapPos(p.positions_main),
            dorsal: ps.shirt_number || '',
            salary: econ.salary_annual_cents || 0,
            marketVal: econ.market_value_cents || 0,
            contractEnd: econ.contract_end || p.end_rights_date || null,
            isLoan: econ.is_loan || false
        });
    });

    // KPIs economicos
    var totalSalarios = jugadores.reduce(function(s, j) { return s + j.salary; }, 0);
    var totalValor = jugadores.reduce(function(s, j) { return s + j.marketVal; }, 0);
    var totalCosteTrasp = jugadores.reduce(function(s, j) { return s + (j.econ.transfer_cost_cents || 0); }, 0);
    var cedidos = jugadores.filter(function(j) { return j.isLoan; }).length;
    var sinContrato = jugadores.filter(function(j) {
        if (!j.contractEnd) return false;
        var fin = new Date(j.contractEnd + 'T12:00:00');
        var en6m = new Date(); en6m.setMonth(en6m.getMonth() + 6);
        return fin <= en6m;
    }).length;

    var h = '';

    // KPIs
    h += '<div class="cmdd-kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">';
    h += '<div class="cmdd-kpi"><div class="value">' + jugadores.length + '</div><div class="label">Jugadores</div></div>';
    h += '<div class="cmdd-kpi"><div class="value">' + cmDdFormatEuros(totalSalarios) + '</div><div class="label">Masa salarial anual</div></div>';
    h += '<div class="cmdd-kpi"><div class="value">' + cmDdFormatEuros(totalValor) + '</div><div class="label">Valor plantilla</div></div>';
    h += '<div class="cmdd-kpi"><div class="value">' + cmDdFormatEuros(totalCosteTrasp) + '</div><div class="label">Coste traspasos</div></div>';
    h += '<div class="cmdd-kpi"><div class="value">' + cedidos + '</div><div class="label">Cedidos</div></div>';
    h += '<div class="cmdd-kpi' + (sinContrato > 0 ? ' alert' : '') + '"><div class="value">' + sinContrato + '</div><div class="label">Fin contrato 6m</div></div>';
    h += '</div>';

    // Toolbar con selector de equipo
    h += '<div class="cmdd-toolbar">';
    h += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
    h += '<select onchange="cmDdFiltroEquipo=this.value;cmDdRenderPlantilla()" style="background:#1e293b;border:1px solid #f59e0b44;color:#f59e0b;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:600">';
    h += '<option value=""' + (!cmDdFiltroEquipo ? ' selected' : '') + '>Todos los equipos (' + cmDdPlantilla.length + ')</option>';
    cmDdEquipos.forEach(function(t) {
        var cnt = cmDdPlayerSeasons.filter(function(ps) { return ps.team_id === t.id; }).length;
        h += '<option value="' + t.id + '"' + (cmDdFiltroEquipo === t.id ? ' selected' : '') + '>' + cmDdEsc(t.name) + ' (' + cnt + ')</option>';
    });
    h += '</select>';
    h += '<span style="color:#94a3b8;font-size:12px">Haz clic en un jugador para editar datos economicos</span>';
    h += '</div>';
    h += '<span class="cmdd-contador"><strong>' + jugadores.length + '</strong> jugadores</span>';
    h += '</div>';

    // Tabla de plantilla
    h += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
    h += '<thead><tr style="border-bottom:1px solid #334155">';
    h += '<th style="text-align:left;padding:8px;color:#94a3b8">Jugador</th>';
    h += '<th style="text-align:center;padding:8px;color:#94a3b8">#</th>';
    h += '<th style="text-align:center;padding:8px;color:#94a3b8">Pos</th>';
    h += '<th style="text-align:center;padding:8px;color:#94a3b8">Edad</th>';
    h += '<th style="text-align:right;padding:8px;color:#94a3b8">Salario</th>';
    h += '<th style="text-align:right;padding:8px;color:#94a3b8">V. Mercado</th>';
    h += '<th style="text-align:right;padding:8px;color:#94a3b8">Coste</th>';
    h += '<th style="text-align:center;padding:8px;color:#94a3b8">Propiedad</th>';
    h += '<th style="text-align:center;padding:8px;color:#94a3b8">Contrato</th>';
    h += '<th style="text-align:center;padding:8px;color:#94a3b8">Estado</th>';
    h += '</tr></thead><tbody>';

    jugadores.forEach(function(j) {
        var hasEcon = j.salary > 0 || j.marketVal > 0;
        var statusColor = j.status === 'lesionado' ? '#ef4444' : (j.isLoan ? '#a855f7' : '#4ade80');
        var statusLabel = j.status === 'lesionado' ? 'Lesionado' : (j.isLoan ? 'Cedido' : 'Activo');
        var contractColor = '#94a3b8';
        if (j.contractEnd) {
            var fin = new Date(j.contractEnd + 'T12:00:00');
            var en6m = new Date(); en6m.setMonth(en6m.getMonth() + 6);
            if (fin <= en6m) contractColor = '#ef4444';
            else if (fin <= new Date(new Date().setFullYear(new Date().getFullYear() + 1))) contractColor = '#f59e0b';
        }

        h += '<tr style="border-bottom:1px solid #1e293b;cursor:pointer' + (!hasEcon ? ';opacity:0.7' : '') + '" onclick="cmDdModalEconomia(\x27' + j.id + '\x27)">';
        h += '<td style="padding:8px">';
        if (j.photo_url) h += '<img src="' + cmDdEsc(j.photo_url) + '" style="width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:6px;object-fit:cover" onerror="this.style.display=\'none\'">';
        h += '<span style="color:#f1f5f9;font-weight:600">' + cmDdEsc(j.name) + '</span></td>';
        h += '<td style="padding:8px;text-align:center;color:#f59e0b;font-weight:700">' + (j.dorsal || '-') + '</td>';
        h += '<td style="padding:8px;text-align:center;color:#94a3b8">' + cmDdEsc(j.posDD || '-') + '</td>';
        h += '<td style="padding:8px;text-align:center;color:#e2e8f0">' + (j.edad || '-') + '</td>';
        h += '<td style="padding:8px;text-align:right;color:#f59e0b;font-weight:600">' + cmDdFormatEuros(j.salary) + '</td>';
        h += '<td style="padding:8px;text-align:right;color:#e2e8f0">' + cmDdFormatEuros(j.marketVal) + '</td>';
        h += '<td style="padding:8px;text-align:right;color:#94a3b8">' + cmDdFormatEuros(j.econ.transfer_cost_cents) + '</td>';
        h += '<td style="padding:8px;text-align:center;color:#e2e8f0">' + (j.econ.ownership_pct != null ? j.econ.ownership_pct + '%' : '-') + '</td>';
        h += '<td style="padding:8px;text-align:center;color:' + contractColor + ';font-weight:600">' + (j.contractEnd ? cmDdFechaCorta(j.contractEnd) : '-') + '</td>';
        h += '<td style="padding:8px;text-align:center"><span class="cmdd-badge" style="background:' + statusColor + '22;color:' + statusColor + '">' + statusLabel + '</span></td>';
        h += '</tr>';
    });

    h += '</tbody></table></div>';

    // 11 IDEAL de la plantilla actual
    h += '<div style="margin-top:20px">';
    h += '<div class="cmdd-section">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
    var equipoNombre = cmDdFiltroEquipo ? (cmDdEquipos.find(function(t) { return t.id === cmDdFiltroEquipo; }) || {}).name || '' : 'Todos';
    h += '<h3 style="margin:0">11 Ideal - ' + cmDdEsc(equipoNombre) + '</h3>';
    h += '<div style="display:flex;gap:4px">';
    CMSC_FORMACIONES.forEach(function(f) {
        var isActive = cmDdPlantillaFormacion === f;
        h += '<button class="cmdd-btn cmdd-btn-sm" onclick="cmDdPlantillaFormacion=\x27' + f + '\x27;cmDdRenderPlantilla()" style="' +
            (isActive ? 'background:#f59e0b;color:#0f172a' : 'background:#0f172a;color:#64748b;border:1px solid #334155') + ';font-size:10px;padding:3px 8px">' + f + '</button>';
    });
    h += '</div></div>';

    // Campo de futbol
    var positions = CMSC_POSICIONES_MAP[cmDdPlantillaFormacion] || [];
    var coords = CMSC_POS_COORDS[cmDdPlantillaFormacion] || {};

    h += '<div style="position:relative;background:linear-gradient(to bottom,#0c4a1e,#166534,#0c4a1e);border-radius:12px;border:2px solid #22c55e;width:100%;max-width:700px;margin:0 auto;aspect-ratio:68/100;overflow:hidden">';
    h += '<div style="position:absolute;top:50%;left:5%;right:5%;height:1px;background:rgba(255,255,255,.2)"></div>';
    h += '<div style="position:absolute;top:50%;left:50%;width:60px;height:60px;border:1px solid rgba(255,255,255,.2);border-radius:50%;transform:translate(-50%,-50%)"></div>';
    h += '<div style="position:absolute;top:0;left:25%;right:25%;height:12%;border:1px solid rgba(255,255,255,.15);border-top:none"></div>';
    h += '<div style="position:absolute;bottom:0;left:25%;right:25%;height:12%;border:1px solid rgba(255,255,255,.15);border-bottom:none"></div>';

    positions.forEach(function(pos) {
        var coord = coords[pos];
        if (!coord) return;
        var x = coord[0], yy = 100 - coord[1];

        // Buscar jugador para esta posicion
        var match = jugadores.find(function(j) { return j.posDD === pos; });
        var bgColor = match ? '#22c55e' : '#334155';
        var nameStr = match ? (match.nickname || match.name.split(' ')[0]) : '-';
        var salarioStr = match && match.salary > 0 ? cmDdFormatEuros(match.salary) : '';

        h += '<div style="position:absolute;left:' + x + '%;top:' + yy + '%;transform:translate(-50%,-50%);text-align:center;z-index:2">';
        h += '<div style="width:42px;height:42px;border-radius:50%;background:' + bgColor + ';margin:0 auto;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.3);box-shadow:0 2px 8px rgba(0,0,0,.4)">';
        h += '<span style="color:#fff;font-size:9px;font-weight:700">' + pos + '</span>';
        h += '</div>';
        h += '<div style="color:#fff;font-size:8px;font-weight:600;margin-top:2px;text-shadow:0 1px 3px rgba(0,0,0,.8);max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + cmDdEsc(nameStr) + '</div>';
        if (salarioStr) h += '<div style="color:#f59e0b;font-size:7px;font-weight:600">' + salarioStr + '</div>';
        h += '</div>';
    });
    h += '</div>';
    h += '</div></div>';

    cont.innerHTML = h;
}


// Modal editar economia de jugador
function cmDdModalEconomia(playerId) {
    var player = cmDdPlantilla.find(function(p) { return p.id === playerId; });
    if (!player) return;
    var econ = cmDdPlantillaEcon.find(function(e) { return e.player_id === playerId; }) || {};

    function centsToEur(c) { return c ? (c / 100).toFixed(2) : ''; }

    var h = '<div class="cmdd-modal-overlay" id="cmdd-modal-econ" onclick="if(event.target===this)this.remove()">';
    h += '<div class="cmdd-modal" style="max-width:600px">';
    h += '<div class="cmdd-modal-header"><h3>Datos economicos: ' + cmDdEsc(player.name) + '</h3><button class="cmdd-modal-close" onclick="document.getElementById(\'cmdd-modal-econ\').remove()">&times;</button></div>';
    h += '<div class="cmdd-modal-body">';

    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Salario anual (EUR)</label><input type="number" step="0.01" id="cmdd-ec-salary" value="' + centsToEur(econ.salary_annual_cents) + '" placeholder="24000"></div>';
    h += '<div class="cmdd-form-group"><label>Valor de mercado (EUR)</label><input type="number" step="0.01" id="cmdd-ec-market" value="' + centsToEur(econ.market_value_cents) + '" placeholder="150000"></div>';
    h += '</div>';

    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Coste traspaso (EUR)</label><input type="number" step="0.01" id="cmdd-ec-transfer" value="' + centsToEur(econ.transfer_cost_cents) + '" placeholder="50000"></div>';
    h += '<div class="cmdd-form-group"><label>Clausula rescision (EUR)</label><input type="number" step="0.01" id="cmdd-ec-clause" value="' + centsToEur(econ.release_clause_cents) + '"></div>';
    h += '</div>';

    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Propiedad %</label><input type="number" step="0.01" id="cmdd-ec-ownership" value="' + (econ.ownership_pct != null ? econ.ownership_pct : '100') + '" placeholder="100"></div>';
    h += '<div class="cmdd-form-group"><label>Cedido</label><select id="cmdd-ec-loan"><option value="false"' + (!econ.is_loan ? ' selected' : '') + '>No</option><option value="true"' + (econ.is_loan ? ' selected' : '') + '>Si (cedido)</option></select></div>';
    h += '</div>';

    h += '<div class="cmdd-form-row" id="cmdd-ec-loan-fields" style="' + (econ.is_loan ? '' : 'display:none') + '">';
    h += '<div class="cmdd-form-group"><label>Cedido desde</label><input id="cmdd-ec-loan-from" value="' + cmDdEsc(econ.loan_from_club || '') + '" placeholder="Club que cede"></div>';
    h += '<div class="cmdd-form-group"><label>Cesion hasta</label><input type="date" id="cmdd-ec-loan-until" value="' + (econ.loan_until || '') + '"></div>';
    h += '</div>';

    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Opcion compra (EUR)</label><input type="number" step="0.01" id="cmdd-ec-buyopt" value="' + centsToEur(econ.buy_option_cents) + '"></div>';
    h += '<div class="cmdd-form-group"><label>Cuota cesion (EUR)</label><input type="number" step="0.01" id="cmdd-ec-loanfee" value="' + centsToEur(econ.loan_fee_cents) + '"></div>';
    h += '</div>';

    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Inicio contrato</label><input type="date" id="cmdd-ec-cstart" value="' + (econ.contract_start || '') + '"></div>';
    h += '<div class="cmdd-form-group"><label>Fin contrato</label><input type="date" id="cmdd-ec-cend" value="' + (econ.contract_end || player.end_rights_date || '') + '"></div>';
    h += '</div>';

    h += '<div style="margin-top:6px;padding-top:8px;border-top:1px solid #334155">';
    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Prima goles (EUR)</label><input type="number" step="0.01" id="cmdd-ec-bgoals" value="' + centsToEur(econ.bonus_goals_cents) + '"></div>';
    h += '<div class="cmdd-form-group"><label>Prima asistencias (EUR)</label><input type="number" step="0.01" id="cmdd-ec-bassists" value="' + centsToEur(econ.bonus_assists_cents) + '"></div>';
    h += '</div>';
    h += '<div class="cmdd-form-row">';
    h += '<div class="cmdd-form-group"><label>Otras primas (EUR)</label><input type="number" step="0.01" id="cmdd-ec-bother" value="' + centsToEur(econ.bonus_other_cents) + '"></div>';
    h += '<div class="cmdd-form-group"><label>Detalle primas</label><input id="cmdd-ec-bnotes" value="' + cmDdEsc(econ.bonus_notes || '') + '" placeholder="Ej: 500 por victoria"></div>';
    h += '</div></div>';

    h += '<div class="cmdd-form-group"><label>Notas economicas</label><textarea id="cmdd-ec-notes" rows="2">' + cmDdEsc(econ.notes || '') + '</textarea></div>';

    h += '</div>';
    h += '<div class="cmdd-modal-footer">';
    h += '<button class="cmdd-btn cmdd-btn-secondary" onclick="document.getElementById(\'cmdd-modal-econ\').remove()">Cancelar</button>';
    h += '<button class="cmdd-btn cmdd-btn-primary" onclick="cmDdGuardarEconomia(\x27' + playerId + '\x27,\x27' + (econ.id || '') + '\x27)">Guardar</button>';
    h += '</div></div></div>';

    var div = document.createElement('div'); div.innerHTML = h;
    document.body.appendChild(div.firstElementChild);

    // Toggle campos cesion
    document.getElementById('cmdd-ec-loan').addEventListener('change', function() {
        document.getElementById('cmdd-ec-loan-fields').style.display = this.value === 'true' ? '' : 'none';
    });
}

function cmDdEurToCents(id) {
    var v = parseFloat(document.getElementById(id).value);
    return isNaN(v) ? 0 : Math.round(v * 100);
}

async function cmDdGuardarEconomia(playerId, econId) {
    var memberId = null;
    if (typeof cmState !== 'undefined' && cmState.miembro) memberId = cmState.miembro.id;

    var data = {
        club_id: clubId,
        player_id: playerId,
        salary_annual_cents: cmDdEurToCents('cmdd-ec-salary'),
        market_value_cents: cmDdEurToCents('cmdd-ec-market'),
        transfer_cost_cents: cmDdEurToCents('cmdd-ec-transfer'),
        release_clause_cents: cmDdEurToCents('cmdd-ec-clause'),
        ownership_pct: parseFloat(document.getElementById('cmdd-ec-ownership').value) || 100,
        is_loan: document.getElementById('cmdd-ec-loan').value === 'true',
        loan_from_club: document.getElementById('cmdd-ec-loan-from') ? document.getElementById('cmdd-ec-loan-from').value.trim() || null : null,
        loan_until: document.getElementById('cmdd-ec-loan-until') ? document.getElementById('cmdd-ec-loan-until').value || null : null,
        buy_option_cents: cmDdEurToCents('cmdd-ec-buyopt'),
        loan_fee_cents: cmDdEurToCents('cmdd-ec-loanfee'),
        contract_start: document.getElementById('cmdd-ec-cstart').value || null,
        contract_end: document.getElementById('cmdd-ec-cend').value || null,
        bonus_goals_cents: cmDdEurToCents('cmdd-ec-bgoals'),
        bonus_assists_cents: cmDdEurToCents('cmdd-ec-bassists'),
        bonus_other_cents: cmDdEurToCents('cmdd-ec-bother'),
        bonus_notes: document.getElementById('cmdd-ec-bnotes').value.trim() || null,
        notes: document.getElementById('cmdd-ec-notes').value.trim() || null,
        updated_by: memberId,
        updated_at: new Date().toISOString()
    };

    try {
        if (econId) {
            await supabaseClient.from('cm_dd_player_economics').update(data).eq('id', econId);
        } else {
            await supabaseClient.from('cm_dd_player_economics').upsert(data, { onConflict: 'club_id,player_id' });
        }
        document.getElementById('cmdd-modal-econ').remove();
        cmDdPlantillaEcon = [];
        cmDdTabPlantilla(document.getElementById('cmdd-tab-content'));
    } catch (e) { alert('Error: ' + e.message); }
}


// ============================================================
// TAB 7: COBERTURA (Planificacion de partidos para scouts)
// ============================================================

function cmDdGetLunesDeSemana(fecha) {
    var d = new Date(fecha + 'T12:00:00');
    var day = d.getDay(); var diff = d.getDate() - day + (day === 0 ? -6 : 1);
    var lunes = new Date(d.setDate(diff));
    return lunes.toISOString().split('T')[0];
}

function cmDdGetDomingoDeSemana(lunes) {
    var d = new Date(lunes + 'T12:00:00');
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
}

function cmDdSemanaLabel(lunes) {
    var dom = cmDdGetDomingoDeSemana(lunes);
    return cmDdFechaCorta(lunes) + ' \u2014 ' + cmDdFechaCorta(dom);
}

async function cmDdTabCobertura(cont) {
    cont.innerHTML = '<div class="cmdd-empty"><div class="icon">&#8987;</div><p>Cargando cobertura...</p></div>';

    if (cmDdMiembros.length === 0) {
        try {
            var res = await supabaseClient.from('club_members').select('id, display_name, wp_user_id, role_id, club_roles(name, permissions)')
                .eq('club_id', clubId).eq('active', true);
            cmDdMiembros = res.data || [];
        } catch (e) { cmDdMiembros = []; }
    }

    var res = await supabaseClient.from('cm_sc_matches')
        .select('id, match_date, kick_off_time, home_team, away_team, competition, venue, viewing_method, assigned_to, assigned_by, status, notes')
        .eq('club_id', clubId).eq('archived', false)
        .order('match_date', { ascending: true });
    cmDdCobPartidos = res.data || [];

    // Default: semana actual
    if (!cmDdCobSemana) {
        cmDdCobSemana = cmDdGetLunesDeSemana(new Date().toISOString().split('T')[0]);
    }

    cmDdRenderCobertura();
}

function cmDdRenderCobertura() {
    var cont = document.getElementById('cmdd-tab-content');
    if (!cont) return;

    var methodIcons = { live: '\ud83c\udfdf\ufe0f', tv: '\ud83d\udcfa', video: '\ud83d\udcbb' };
    var methodLabels = { live: 'Directo', tv: 'TV', video: 'Video' };
    var diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

    var scoutMembers = cmDdMiembros.filter(cmDdTienePermisoScouting);

    var lunes = cmDdCobSemana;
    var domingo = cmDdGetDomingoDeSemana(lunes);

    // Partidos de esta semana
    var partidosSemana = cmDdCobPartidos.filter(function(p) {
        return p.match_date >= lunes && p.match_date <= domingo;
    });

    // Filtro por scout
    if (cmDdCobFiltroScout) {
        partidosSemana = partidosSemana.filter(function(p) { return p.assigned_to === cmDdCobFiltroScout; });
    }

    // Semanas disponibles (unicas)
    var semanasSet = {};
    cmDdCobPartidos.forEach(function(p) {
        if (p.match_date) semanasSet[cmDdGetLunesDeSemana(p.match_date)] = true;
    });
    // Siempre incluir semana actual y siguiente
    var hoyLunes = cmDdGetLunesDeSemana(new Date().toISOString().split('T')[0]);
    semanasSet[hoyLunes] = true;
    var sigLunes = new Date(hoyLunes + 'T12:00:00'); sigLunes.setDate(sigLunes.getDate() + 7);
    semanasSet[sigLunes.toISOString().split('T')[0]] = true;
    var semanas = Object.keys(semanasSet).sort();

    var h = '';

    // Toolbar
    h += '<div class="cmdd-toolbar">';
    h += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
    h += '<button class="cmdd-btn cmdd-btn-primary" onclick="cmDdModalPartido()">+ Agendar partido</button>';

    // Navegacion semana
    h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-secondary" onclick="cmDdCobNavSemana(-1)">&laquo; Anterior</button>';
    h += '<select onchange="cmDdCobSemana=this.value;cmDdRenderCobertura()" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px">';
    semanas.forEach(function(s) {
        h += '<option value="' + s + '"' + (cmDdCobSemana === s ? ' selected' : '') + '>' + cmDdSemanaLabel(s) + '</option>';
    });
    h += '</select>';
    h += '<button class="cmdd-btn cmdd-btn-sm cmdd-btn-secondary" onclick="cmDdCobNavSemana(1)">Siguiente &raquo;</button>';

    // Filtro scout
    h += '<select onchange="cmDdCobFiltroScout=this.value;cmDdRenderCobertura()" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:12px">';
    h += '<option value="">Todos los scouts</option>';
    scoutMembers.forEach(function(sm) {
        h += '<option value="' + sm.id + '"' + (cmDdCobFiltroScout === sm.id ? ' selected' : '') + '>' + cmDdEsc(sm.display_name) + '</option>';
    });
    h += '</select>';
    h += '</div>';
    h += '<span class="cmdd-contador"><strong>' + partidosSemana.length + '</strong> partidos esta semana</span>';
    h += '</div>';

    // Resumen scouts esta semana (mini KPIs)
    if (scoutMembers.length > 0 && !cmDdCobFiltroScout) {
        h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">';
        scoutMembers.forEach(function(sm) {
            var count = cmDdCobPartidos.filter(function(p) {
                return p.match_date >= lunes && p.match_date <= domingo && p.assigned_to === sm.id;
            }).length;
            var live = cmDdCobPartidos.filter(function(p) {
                return p.match_date >= lunes && p.match_date <= domingo && p.assigned_to === sm.id && p.viewing_method === 'live';
            }).length;
            var bgColor = count === 0 ? '#1e293b' : '#1c1917';
            var borderColor = count === 0 ? '#334155' : '#f59e0b';
            h += '<div style="padding:8px 14px;background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:8px;text-align:center;min-width:100px">';
            h += '<div style="color:#e2e8f0;font-size:12px;font-weight:600">' + cmDdEsc(sm.display_name) + '</div>';
            h += '<div style="color:#f59e0b;font-size:18px;font-weight:700">' + count + ' <span style="font-size:11px;color:#94a3b8">partidos</span></div>';
            if (live > 0) h += '<div style="color:#4ade80;font-size:10px">\ud83c\udfdf\ufe0f ' + live + ' directo</div>';
            h += '</div>';
        });
        // Sin asignar
        var sinAsignar = cmDdCobPartidos.filter(function(p) {
            return p.match_date >= lunes && p.match_date <= domingo && !p.assigned_to;
        }).length;
        if (sinAsignar > 0) {
            h += '<div style="padding:8px 14px;background:#450a0a33;border:1px solid #ef4444;border-radius:8px;text-align:center;min-width:100px">';
            h += '<div style="color:#fca5a5;font-size:12px;font-weight:600">Sin asignar</div>';
            h += '<div style="color:#ef4444;font-size:18px;font-weight:700">' + sinAsignar + '</div>';
            h += '</div>';
        }
        h += '</div>';
    }

    // Vista por dias de la semana
    h += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:16px">';
    for (var d = 0; d < 7; d++) {
        var diaDate = new Date(lunes + 'T12:00:00');
        diaDate.setDate(diaDate.getDate() + d);
        var diaStr = diaDate.toISOString().split('T')[0];
        var hoy = new Date().toISOString().split('T')[0];
        var esDiaActual = diaStr === hoy;

        var partidosDia = partidosSemana.filter(function(p) { return p.match_date === diaStr; });

        h += '<div style="background:' + (esDiaActual ? '#1c1917' : '#1e293b') + ';border:1px solid ' + (esDiaActual ? '#f59e0b' : '#334155') + ';border-radius:8px;padding:8px;min-height:100px">';
        h += '<div style="text-align:center;margin-bottom:6px">';
        h += '<div style="color:' + (esDiaActual ? '#f59e0b' : '#94a3b8') + ';font-size:10px;font-weight:700;text-transform:uppercase">' + diasSemana[d] + '</div>';
        h += '<div style="color:#e2e8f0;font-size:13px;font-weight:600">' + diaDate.getDate() + '</div>';
        h += '</div>';

        if (partidosDia.length === 0) {
            h += '<div style="color:#334155;font-size:10px;text-align:center;padding:8px 0">-</div>';
        } else {
            partidosDia.forEach(function(p) {
                var icon = methodIcons[p.viewing_method] || '\u26bd';
                var borderC = p.assigned_to ? '#334155' : '#ef4444';
                h += '<div style="background:#0f172a;border:1px solid ' + borderC + ';border-radius:6px;padding:5px;margin-bottom:4px;cursor:pointer;font-size:10px" onclick="cmDdModalPartido(\x27' + p.id + '\x27)">';
                h += '<div style="color:#e2e8f0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + icon + ' ' + cmDdEsc(p.home_team) + '</div>';
                h += '<div style="color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">vs ' + cmDdEsc(p.away_team) + '</div>';
                if (p.kick_off_time) h += '<div style="color:#64748b">' + p.kick_off_time.substring(0, 5) + '</div>';
                if (p.assigned_to) {
                    h += '<div style="color:#4ade80;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">\ud83d\udc64 ' + cmDdGetMiembroNombre(p.assigned_to) + '</div>';
                } else {
                    h += '<div style="color:#ef4444;margin-top:2px">\u26a0 Sin scout</div>';
                }
                h += '</div>';
            });
        }
        h += '</div>';
    }
    h += '</div>';

    // Lista detallada bajo el calendario
    if (partidosSemana.length > 0) {
        h += '<div class="cmdd-section">';
        h += '<h3>Detalle de partidos (' + partidosSemana.length + ')</h3>';
        partidosSemana.forEach(function(p) {
            var icon = methodIcons[p.viewing_method] || '\u26bd';
            var mLabel = methodLabels[p.viewing_method] || 'Sin definir';

            h += '<div class="cmdd-list-item" style="cursor:pointer;flex-wrap:wrap;gap:6px" onclick="cmDdModalPartido(\x27' + p.id + '\x27)">';
            h += '<div style="flex:1;min-width:180px">';
            h += '<div class="cmdd-list-name">' + cmDdEsc(p.home_team) + ' vs ' + cmDdEsc(p.away_team) + '</div>';
            h += '<div class="cmdd-list-sub">' + cmDdFechaCorta(p.match_date) +
                (p.kick_off_time ? ' ' + p.kick_off_time.substring(0, 5) : '') +
                (p.competition ? ' \u00B7 ' + cmDdEsc(p.competition) : '') +
                (p.venue ? ' \u00B7 ' + cmDdEsc(p.venue) : '') + '</div>';
            h += '</div>';
            h += '<span class="cmdd-badge" style="background:#1e293b;color:#94a3b8">' + icon + ' ' + mLabel + '</span>';
            h += '<div style="text-align:right;min-width:100px">';
            if (p.assigned_to) {
                h += '<div style="color:#e2e8f0;font-size:12px;font-weight:600">' + cmDdGetMiembroNombre(p.assigned_to) + '</div>';
            } else {
                h += '<div style="color:#ef4444;font-size:12px;font-weight:600">Sin asignar</div>';
            }
            h += '</div>';
            h += '</div>';
        });
        h += '</div>';
    }

    cont.innerHTML = h;
}

function cmDdCobNavSemana(dir) {
    var d = new Date(cmDdCobSemana + 'T12:00:00');
    d.setDate(d.getDate() + (dir * 7));
    cmDdCobSemana = d.toISOString().split('T')[0];
    cmDdRenderCobertura();
}


// ============================================================
// COMPARATIVA DE JUGADORES
// ============================================================

function cmDdToggleComparar(playerId) {
    var idx = cmDdCompararIds.indexOf(playerId);
    if (idx >= 0) { cmDdCompararIds.splice(idx, 1); }
    else if (cmDdCompararIds.length < 4) { cmDdCompararIds.push(playerId); }
    else { alert('Maximo 4 jugadores para comparar'); return; }
    cmDdRenderJugadores();
}

async function cmDdCompararJugadores() {
    if (cmDdCompararIds.length < 2) return;

    var cont = document.getElementById('cmdd-tab-content');
    if (!cont) return;
    cont.innerHTML = '<div class="cmdd-empty"><div class="icon">&#8987;</div><p>Preparando comparativa...</p></div>';

    // Cargar reports de todos los seleccionados
    var res = await supabaseClient.from('cm_sc_player_reports')
        .select('*').in('player_id', cmDdCompararIds).eq('archived', false);
    var allReports = res.data || [];

    var jugadores = cmDdCompararIds.map(function(id) { return cmDdJugadores.find(function(j) { return j.id === id; }); }).filter(Boolean);
    var colores = ['#f59e0b', '#3b82f6', '#22c55e', '#a855f7'];
    var coloresRGB = ['245,158,11', '59,130,246', '34,197,94', '168,85,247'];

    var h = '';
    h += '<div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">';
    h += '<button class="cmdd-btn cmdd-btn-secondary cmdd-btn-sm" onclick="cmDdRenderJugadores()">\u2190 Volver a jugadores</button>';
    h += '<span style="color:#f59e0b;font-size:14px;font-weight:700">Comparativa de ' + jugadores.length + ' jugadores</span>';
    h += '</div>';

    // Tarjetas lado a lado
    h += '<div style="display:grid;grid-template-columns:repeat(' + jugadores.length + ',1fr);gap:10px;margin-bottom:16px">';
    jugadores.forEach(function(p, i) {
        h += '<div class="cmdd-section" style="border-top:3px solid ' + colores[i] + ';text-align:center">';
        if (p.photo_url) {
            h += '<img src="' + cmDdEsc(p.photo_url) + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;margin:0 auto 6px;display:block;border:2px solid ' + colores[i] + '" onerror="this.style.display=\'none\'">';
        }
        h += '<div style="color:#f1f5f9;font-size:14px;font-weight:700">' + cmDdEsc(p.name) + '</div>';
        h += '<div style="color:#94a3b8;font-size:11px">' + cmDdEsc(p.position_primary || '') + ' | ' + cmDdEsc(p.current_club || '') + '</div>';
        h += '<div style="margin-top:6px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap">';
        h += '<span style="color:' + colores[i] + ';font-size:20px;font-weight:700">' + (p.rating_overall ? Number(p.rating_overall).toFixed(1) : '-') + '</span>';
        h += '<span style="color:#64748b;font-size:11px;align-self:flex-end">' + (p.sightings_count || 0) + 'x visto | ' + (p.sign_count || 0) + ' fichar</span>';
        h += '</div></div>';
    });
    h += '</div>';

    // Barras comparativas de metricas clave
    h += '<div class="cmdd-section">';
    h += '<h3>Metricas comparadas</h3>';
    var metricas = [
        { key: 'rating_overall', label: 'Nota media', max: 10 },
        { key: 'sightings_count', label: 'Veces visto', max: null },
        { key: 'scouts_count', label: 'Scouts distintos', max: null },
        { key: 'sign_count', label: 'Votos fichar', max: null }
    ];
    metricas.forEach(function(met) {
        var maxVal = met.max || Math.max.apply(null, jugadores.map(function(p) { return Number(p[met.key]) || 0; })) || 1;
        h += '<div style="margin-bottom:12px">';
        h += '<div style="color:#94a3b8;font-size:11px;font-weight:600;margin-bottom:4px">' + met.label + '</div>';
        jugadores.forEach(function(p, i) {
            var val = Number(p[met.key]) || 0;
            var pct = (val / maxVal) * 100;
            h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">';
            h += '<span style="color:#94a3b8;font-size:10px;width:80px;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + cmDdEsc(p.name.split(' ').pop()) + '</span>';
            h += '<div style="flex:1;height:8px;background:#0f172a;border-radius:4px;overflow:hidden">';
            h += '<div style="width:' + pct + '%;height:100%;background:' + colores[i] + ';border-radius:4px"></div>';
            h += '</div>';
            h += '<span style="color:' + colores[i] + ';font-size:12px;font-weight:700;width:35px">' + (met.key === 'rating_overall' ? val.toFixed(1) : val) + '</span>';
            h += '</div>';
        });
        h += '</div>';
    });
    h += '</div>';

    // Radar superpuesto (si hay reports para al menos 1 jugador)
    var jugConReports = jugadores.filter(function(p) {
        return allReports.some(function(r) { return r.player_id === p.id; });
    });

    if (jugConReports.length > 0) {
        var canvasId = 'cmdd-radar-comp';
        h += '<div class="cmdd-section">';
        h += '<h3>Radar 26 sub-aspectos superpuesto</h3>';

        // Leyenda
        h += '<div style="display:flex;gap:12px;margin-bottom:10px;flex-wrap:wrap">';
        jugadores.forEach(function(p, i) {
            h += '<div style="display:flex;align-items:center;gap:4px">';
            h += '<div style="width:12px;height:3px;background:' + colores[i] + ';border-radius:2px"></div>';
            h += '<span style="color:#94a3b8;font-size:11px">' + cmDdEsc(p.name) + '</span>';
            h += '</div>';
        });
        h += '</div>';

        h += '<div style="max-width:550px;margin:0 auto"><canvas id="' + canvasId + '" width="550" height="420"></canvas></div>';
        h += '</div>';

        // Pintar radar despues de insertar
        setTimeout(function() {
            var canvas = document.getElementById(canvasId);
            if (!canvas || typeof Chart === 'undefined') return;

            var catList = ['tecnica', 'tactica', 'fisica', 'mental'];
            var labels = [];
            catList.forEach(function(cat) {
                CMDD_SUB_ASPECTS[cat].forEach(function(asp) { labels.push(asp.label); });
            });

            var datasets = [];
            jugadores.forEach(function(p, i) {
                var pReports = allReports.filter(function(r) { return r.player_id === p.id; });
                var values = [];
                catList.forEach(function(cat) {
                    CMDD_SUB_ASPECTS[cat].forEach(function(asp) {
                        var sum = 0, count = 0;
                        pReports.forEach(function(r) { var v = r[asp.key]; if (v != null) { sum += Number(v); count++; } });
                        values.push(count > 0 ? Math.round((sum / count) * 10) / 10 : 0);
                    });
                });
                datasets.push({
                    label: p.name,
                    data: values,
                    backgroundColor: 'rgba(' + coloresRGB[i] + ',0.08)',
                    borderColor: colores[i],
                    borderWidth: 2,
                    pointBackgroundColor: colores[i],
                    pointRadius: 2
                });
            });

            new Chart(canvas, {
                type: 'radar',
                data: { labels: labels, datasets: datasets },
                options: {
                    responsive: true,
                    scales: { r: { min: 0, max: 10, ticks: { stepSize: 2, color: '#64748b', backdropColor: 'transparent', font: { size: 9 } }, grid: { color: '#334155' }, angleLines: { color: '#334155' }, pointLabels: { color: '#94a3b8', font: { size: 9 } } } },
                    plugins: { legend: { display: false } }
                }
            });
        }, 200);
    }

    // Tabla comparativa de categorias
    if (jugConReports.length > 0) {
        h += '<div class="cmdd-section">';
        h += '<h3>Medias por categoria</h3>';
        h += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">';
        h += '<thead><tr style="border-bottom:1px solid #334155">';
        h += '<th style="text-align:left;padding:6px;color:#94a3b8">Categoria</th>';
        jugadores.forEach(function(p, i) {
            h += '<th style="text-align:center;padding:6px;color:' + colores[i] + '">' + cmDdEsc(p.name.split(' ').pop()) + '</th>';
        });
        h += '</tr></thead><tbody>';

        var catKeys = ['avg_tecnica', 'avg_tactica', 'avg_fisica', 'avg_mental', 'rating_overall'];
        var catLabels2 = { avg_tecnica: 'Tecnica', avg_tactica: 'Tactica', avg_fisica: 'Fisica', avg_mental: 'Mental', rating_overall: 'OVERALL' };
        catKeys.forEach(function(ck) {
            h += '<tr style="border-bottom:1px solid #1e293b">';
            h += '<td style="padding:6px;color:#e2e8f0;font-weight:' + (ck === 'rating_overall' ? '700' : '400') + '">' + catLabels2[ck] + '</td>';
            var rowVals = [];
            jugadores.forEach(function(p) {
                var pReports = allReports.filter(function(r) { return r.player_id === p.id; });
                var sum = 0, cnt = 0;
                pReports.forEach(function(r) { if (r[ck] != null) { sum += Number(r[ck]); cnt++; } });
                rowVals.push(cnt > 0 ? sum / cnt : 0);
            });
            var maxRow = Math.max.apply(null, rowVals);
            jugadores.forEach(function(p, i) {
                var isBest = rowVals[i] === maxRow && rowVals[i] > 0;
                h += '<td style="padding:6px;text-align:center;color:' + (isBest ? colores[i] : '#94a3b8') + ';font-weight:' + (isBest ? '700' : '400') + ';font-size:' + (ck === 'rating_overall' ? '15px' : '13px') + '">' + (rowVals[i] > 0 ? rowVals[i].toFixed(1) : '-') + '</td>';
            });
            h += '</tr>';
        });
        h += '</tbody></table></div>';
        h += '</div>';
    }

    cont.innerHTML = h;
}


// ============================================================
// EXPORTAR PDF DE JUGADOR
// ============================================================

async function cmDdExportarPDF(playerId, tipo) {
    if (typeof jspdf === 'undefined') { alert('jsPDF no disponible'); return; }

    var player = cmDdJugadores.find(function(p) { return p.id === playerId; });
    if (!player) return;

    // Cargar datos frescos
    var [resSight, resRep] = await Promise.all([
        supabaseClient.from('cm_sc_player_sightings')
            .select('*, cm_sc_matches(home_team, away_team, match_date, competition)')
            .eq('player_id', playerId).eq('archived', false)
            .order('sighting_date', { ascending: false }),
        supabaseClient.from('cm_sc_player_reports')
            .select('*').eq('player_id', playerId).eq('archived', false)
            .order('created_at', { ascending: false })
    ]);
    var sights = resSight.data || [];
    var reports = resRep.data || [];

    // Calculos
    var scoutMap = {};
    sights.forEach(function(s) {
        if (!scoutMap[s.scout_id]) scoutMap[s.scout_id] = { ratings: [], tags: [] };
        if (s.rating_quick) scoutMap[s.scout_id].ratings.push(s.rating_quick);
        scoutMap[s.scout_id].tags.push(s.tag);
    });
    var allRatings = sights.filter(function(s) { return s.rating_quick; }).map(function(s) { return s.rating_quick; });
    var mediaTotal = allRatings.length > 0 ? (allRatings.reduce(function(a, b) { return a + b; }, 0) / allRatings.length) : 0;
    var totalSign = sights.filter(function(s) { return s.tag === 'sign'; }).length;
    var totalWatch = sights.filter(function(s) { return s.tag === 'watch'; }).length;
    var totalDiscard = sights.filter(function(s) { return s.tag === 'discard'; }).length;

    var catLabelsMap = { primer_equipo:'Primer equipo', filial:'Filial', juvenil:'Juvenil', cadete:'Cadete', infantil:'Infantil', alevin:'Alevin' };
    var pipeLabels = { identified:'Identificado', observed:'Observado', tracking:'En seguimiento', contacted:'Contactado', signed:'Fichado', discarded:'Descartado' };
    var footLabels = { right:'Derecho', left:'Izquierdo', both:'Ambidiestro' };

    var edad = '';
    if (player.birth_date) {
        var bd = new Date(player.birth_date + 'T12:00:00');
        edad = Math.floor((new Date() - bd) / (365.25 * 24 * 60 * 60 * 1000)) + ' anos';
    }

    var doc = new jspdf.jsPDF('p', 'mm', 'a4');
    var W = 210, H = 297, M = 15;
    var y = M;

    // ===== FUNCIONES AUXILIARES PDF =====
    function pdfHeader() {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, W, 32, 'F');
        doc.setFontSize(16); doc.setTextColor(245, 158, 11); doc.setFont('helvetica', 'bold');
        doc.text('TopLiderCoach', M, 14);
        doc.setFontSize(9); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal');
        doc.text('Direccion Deportiva - Informe de jugador', M, 21);
        doc.text(new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), W - M, 14, { align: 'right' });
        doc.text(tipo === 'resumen' ? 'RESUMEN' : 'INFORME COMPLETO', W - M, 21, { align: 'right' });
        y = 38;
    }

    function pdfLinea() {
        doc.setDrawColor(200, 200, 200);
        doc.line(M, y, W - M, y);
        y += 4;
    }

    function pdfLabel(label, value, x, w) {
        doc.setFontSize(7); doc.setTextColor(130, 130, 130); doc.setFont('helvetica', 'normal');
        doc.text(label, x, y);
        doc.setFontSize(10); doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal');
        doc.text(String(value || '-'), x, y + 4.5);
    }

    function pdfCheckPage(need) {
        if (y + need > H - 15) { doc.addPage(); y = M; pdfHeader(); }
    }

    // ===== PAGINA 1: DATOS + CONSENSO =====
    pdfHeader();

    // Nombre grande + categoria
    doc.setFontSize(22); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold');
    doc.text(player.name || '?', M, y);
    if (player.target_category) {
        var catText = catLabelsMap[player.target_category] || player.target_category;
        doc.setFontSize(8); doc.setTextColor(245, 158, 11);
        doc.text(catText.toUpperCase(), M + doc.getTextWidth(player.name || '?') + 4, y);
    }
    y += 4;
    doc.setFontSize(11); doc.setTextColor(80, 80, 80); doc.setFont('helvetica', 'normal');
    var subLine = (player.position_primary || '') + (player.nationality ? ' | ' + player.nationality : '') + (edad ? ' | ' + edad : '') + (player.current_club ? ' | ' + player.current_club : '');
    doc.text(subLine, M, y);
    y += 8;

    // Caja de nota media
    var boxW = 30, boxH = 22;
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(M, y, boxW, boxH, 3, 3, 'F');
    doc.setFontSize(22); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text(mediaTotal > 0 ? mediaTotal.toFixed(1) : '-', M + boxW / 2, y + 13, { align: 'center' });
    doc.setFontSize(7); doc.text('MEDIA', M + boxW / 2, y + 18, { align: 'center' });

    // Cajas consenso al lado
    var cx = M + boxW + 6;
    var consensoItems = [
        { label: 'SCOUTS', value: Object.keys(scoutMap).length },
        { label: 'VISTO', value: sights.length },
        { label: 'FICHAR', value: totalSign, color: [34, 197, 94] },
        { label: 'SEGUIR', value: totalWatch, color: [251, 191, 36] },
        { label: 'DESCARTAR', value: totalDiscard, color: [239, 68, 68] }
    ];
    consensoItems.forEach(function(ci) {
        if (ci.value > 0 || !ci.color) {
            doc.setFillColor(240, 240, 245);
            doc.roundedRect(cx, y, 22, boxH, 2, 2, 'F');
            doc.setFontSize(14); doc.setFont('helvetica', 'bold');
            if (ci.color) { doc.setTextColor(ci.color[0], ci.color[1], ci.color[2]); }
            else { doc.setTextColor(30, 30, 30); }
            doc.text(String(ci.value), cx + 11, y + 11, { align: 'center' });
            doc.setFontSize(5); doc.setTextColor(120, 120, 120); doc.setFont('helvetica', 'normal');
            doc.text(ci.label, cx + 11, y + 17, { align: 'center' });
            cx += 24;
        }
    });
    y += boxH + 8;

    pdfLinea();

    // Datos del jugador en grid
    var campos = [
        ['Posicion', player.position_primary || '-'],
        ['Pos. secundaria', player.position_secondary || '-'],
        ['Pie', footLabels[player.dominant_foot] || player.dominant_foot || '-'],
        ['Club', player.current_club || '-'],
        ['Liga', player.current_league || '-'],
        ['Nacionalidad', player.nationality || '-'],
        ['Nacimiento', player.birth_date ? cmDdFechaCorta(player.birth_date) : '-'],
        ['Fin contrato', player.contract_until ? cmDdFechaCorta(player.contract_until) : '-'],
        ['Coste estimado', player.estimated_cost || '-'],
        ['Pipeline', pipeLabels[player.pipeline_status] || '-'],
        ['Agente', player.agent_name || '-'],
        ['Contacto agente', player.agent_contact || '-']
    ];
    var col = 0;
    for (var ci = 0; ci < campos.length; ci++) {
        var cx2 = M + (col * 45);
        pdfLabel(campos[ci][0], campos[ci][1], cx2);
        col++;
        if (col >= 4) { col = 0; y += 11; }
    }
    if (col > 0) y += 11;
    y += 4;

    // Medias por categoria (si hay reports)
    if (reports.length > 0) {
        pdfLinea();
        doc.setFontSize(10); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold');
        doc.text('Evaluacion por categorias (' + reports.length + ' informe' + (reports.length > 1 ? 's' : '') + ')', M, y); y += 6;

        var avgCats = { tecnica: 0, tactica: 0, fisica: 0, mental: 0, overall: 0 };
        var countR = 0;
        reports.forEach(function(r) {
            if (r.avg_tecnica) avgCats.tecnica += Number(r.avg_tecnica);
            if (r.avg_tactica) avgCats.tactica += Number(r.avg_tactica);
            if (r.avg_fisica) avgCats.fisica += Number(r.avg_fisica);
            if (r.avg_mental) avgCats.mental += Number(r.avg_mental);
            if (r.rating_overall) avgCats.overall += Number(r.rating_overall);
            countR++;
        });
        if (countR > 0) { Object.keys(avgCats).forEach(function(k) { avgCats[k] = (avgCats[k] / countR).toFixed(1); }); }

        var catColors = { tecnica:[59,130,246], tactica:[245,158,11], fisica:[34,197,94], mental:[168,85,247], overall:[239,68,68] };
        var catNames = { tecnica:'TEC', tactica:'TAC', fisica:'FIS', mental:'MEN', overall:'TOTAL' };
        var bx = M;
        Object.keys(avgCats).forEach(function(k) {
            doc.setFillColor(catColors[k][0], catColors[k][1], catColors[k][2]);
            doc.roundedRect(bx, y, 28, 16, 2, 2, 'F');
            doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
            doc.text(avgCats[k], bx + 14, y + 9, { align: 'center' });
            doc.setFontSize(6);
            doc.text(catNames[k], bx + 14, y + 14, { align: 'center' });
            bx += 31;
        });
        y += 22;

        // Fortalezas / debilidades
        var lastR = reports[0];
        if (lastR.strengths) {
            pdfCheckPage(20);
            doc.setFontSize(8); doc.setTextColor(34, 197, 94); doc.setFont('helvetica', 'bold');
            doc.text('FORTALEZAS', M, y); y += 4;
            doc.setFontSize(9); doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'normal');
            var stLines = doc.splitTextToSize(lastR.strengths, W - 2 * M);
            doc.text(stLines, M, y); y += stLines.length * 4 + 3;
        }
        if (lastR.weaknesses) {
            pdfCheckPage(20);
            doc.setFontSize(8); doc.setTextColor(239, 68, 68); doc.setFont('helvetica', 'bold');
            doc.text('DEBILIDADES', M, y); y += 4;
            doc.setFontSize(9); doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'normal');
            var wkLines = doc.splitTextToSize(lastR.weaknesses, W - 2 * M);
            doc.text(wkLines, M, y); y += wkLines.length * 4 + 3;
        }
        if (lastR.summary) {
            pdfCheckPage(20);
            doc.setFontSize(8); doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'bold');
            doc.text('RESUMEN', M, y); y += 4;
            doc.setFontSize(9); doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'normal');
            var smLines = doc.splitTextToSize(lastR.summary, W - 2 * M);
            doc.text(smLines, M, y); y += smLines.length * 4 + 3;
        }
    }

    if (tipo === 'resumen') {
        // Footer
        doc.setFontSize(7); doc.setTextColor(180, 180, 180);
        doc.text('Generado por TopLiderCoach HUB - Confidencial', W / 2, H - 8, { align: 'center' });
        doc.save('Informe_Resumen_' + (player.name || 'jugador').replace(/\s+/g, '_') + '.pdf');
        return;
    }

    // ===== PAGINA 2: DESGLOSE POR SCOUT (solo en completo) =====
    doc.addPage(); y = M; pdfHeader();

    doc.setFontSize(12); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold');
    doc.text('Desglose por scout', M, y); y += 7;

    // Tabla de scouts
    if (Object.keys(scoutMap).length > 0) {
        // Header tabla
        doc.setFillColor(30, 41, 59);
        doc.rect(M, y, W - 2 * M, 7, 'F');
        doc.setFontSize(7); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
        doc.text('Scout', M + 2, y + 5);
        doc.text('Visto', M + 70, y + 5);
        doc.text('Media', M + 90, y + 5);
        doc.text('Fichar', M + 110, y + 5);
        doc.text('Seguir', M + 128, y + 5);
        doc.text('Descartar', M + 146, y + 5);
        y += 8;

        Object.keys(scoutMap).forEach(function(sid) {
            pdfCheckPage(8);
            var d = scoutMap[sid];
            var avg = d.ratings.length > 0 ? (d.ratings.reduce(function(a, b) { return a + b; }, 0) / d.ratings.length).toFixed(1) : '-';
            var sC = d.tags.filter(function(t) { return t === 'sign'; }).length;
            var wC = d.tags.filter(function(t) { return t === 'watch'; }).length;
            var dC = d.tags.filter(function(t) { return t === 'discard'; }).length;

            doc.setFontSize(9); doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'normal');
            doc.text(cmDdGetMiembroNombre(sid), M + 2, y + 4);
            doc.text(String(d.ratings.length), M + 72, y + 4);
            doc.setFont('helvetica', 'bold'); doc.setTextColor(245, 158, 11);
            doc.text(avg, M + 92, y + 4);
            doc.setTextColor(34, 197, 94); doc.text(String(sC), M + 114, y + 4);
            doc.setTextColor(251, 191, 36); doc.text(String(wC), M + 132, y + 4);
            doc.setTextColor(239, 68, 68); doc.text(String(dC), M + 152, y + 4);

            doc.setDrawColor(230, 230, 230); doc.line(M, y + 6, W - M, y + 6);
            y += 8;
        });

        // Total
        doc.setFillColor(245, 245, 250);
        doc.rect(M, y, W - 2 * M, 7, 'F');
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(245, 158, 11);
        doc.text('MEDIA TOTAL', M + 2, y + 5);
        doc.text(mediaTotal.toFixed(1), M + 92, y + 5);
        doc.setTextColor(30, 30, 30);
        doc.text(allRatings.length + ' valoraciones, ' + Object.keys(scoutMap).length + ' scouts', M + 110, y + 5);
        y += 14;
    }

    // Radar chart (capturar del canvas si existe)
    var canvas = document.querySelector('[id^="cmdd-radar-"]');
    if (canvas) {
        pdfCheckPage(90);
        doc.setFontSize(10); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold');
        doc.text('Radar 26 sub-aspectos', M, y); y += 4;
        try {
            var imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', M + 15, y, 120, 80);
            y += 86;
        } catch (e) { y += 4; }
    }

    // ===== PAGINA 3: HISTORIAL AVISTAMIENTOS =====
    doc.addPage(); y = M; pdfHeader();

    doc.setFontSize(12); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold');
    doc.text('Historial de avistamientos (' + sights.length + ')', M, y); y += 7;

    sights.forEach(function(s) {
        pdfCheckPage(18);
        var match = s.cm_sc_matches;
        var matchLabel = match ? (match.home_team + ' vs ' + match.away_team) : 'Video / plataforma';
        var tagLabels = { sign: 'FICHAR', watch: 'SEGUIR', discard: 'DESCARTAR' };
        var tagColors = { sign: [34,197,94], watch: [251,191,36], discard: [239,68,68] };
        var tc = tagColors[s.tag] || [100,100,100];

        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
        doc.text(matchLabel, M, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(tc[0], tc[1], tc[2]);
        doc.text(tagLabels[s.tag] || s.tag, M + 100, y);
        if (s.rating_quick) {
            doc.setTextColor(245, 158, 11); doc.setFont('helvetica', 'bold');
            doc.text(s.rating_quick + '/10', W - M, y, { align: 'right' });
        }
        y += 4;
        doc.setFontSize(7); doc.setTextColor(120, 120, 120); doc.setFont('helvetica', 'normal');
        var meta = cmDdFechaCorta(s.sighting_date) + ' | Scout: ' + cmDdGetMiembroNombre(s.scout_id);
        if (s.observed_position) meta += ' | Pos: ' + s.observed_position;
        if (match && match.competition) meta += ' | ' + match.competition;
        doc.text(meta, M, y); y += 3;
        if (s.notes) {
            doc.setFontSize(8); doc.setTextColor(80, 80, 80);
            var nLines = doc.splitTextToSize(s.notes, W - 2 * M);
            doc.text(nLines, M, y); y += nLines.length * 3.5;
        }
        y += 3;
    });

    // Footer
    doc.setFontSize(7); doc.setTextColor(180, 180, 180);
    doc.text('Generado por TopLiderCoach HUB - Confidencial', W / 2, H - 8, { align: 'center' });

    doc.save('Informe_Completo_' + (player.name || 'jugador').replace(/\s+/g, '_') + '.pdf');
}


// ============================================================
// AUTO-MONTAJE DEL MODULO
// ============================================================
(function cmDdAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 40) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (typeof cmPuedeVer !== 'function' || !cmPuedeVer('direccion_deportiva')) return;
        if (document.getElementById('cm-tab-dd')) { clearInterval(intervalo); return; }
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;

        clearInterval(intervalo);

        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-dd';
        tab.setAttribute('onclick', "cambiarModulo('dd', this)");
        tab.innerHTML = '<span class="tab-icon">&#127942;</span><span>Dir. Deportiva</span>';
        mainTabs.appendChild(tab);

        if (!document.getElementById('modulo-dd')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-dd';
            var ultModulo = document.querySelector('.vista-modulo:last-of-type');
            if (ultModulo && ultModulo.parentElement) {
                ultModulo.parentElement.insertBefore(vista, ultModulo.nextSibling);
            } else {
                document.body.appendChild(vista);
            }
        }

        if (typeof registrarModulo === 'function') {
            registrarModulo('dd', function() { cmDdInit('modulo-dd'); });
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
        if (tv.length === 1 && tv[0].id === 'cm-tab-dd') {
            cambiarModulo('dd', tab);
        }

        console.log('[Dir.Deportiva] Auto-montado y registrado');
    }, 300);
})();