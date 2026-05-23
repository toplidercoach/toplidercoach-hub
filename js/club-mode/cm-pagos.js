// ============================================================
// CM-PAGOS.JS · Módulo Pagos y Cuotas
// TopLiderCoach HUB · Club Mode · Fase P.1.4 (Registrar pago + Recibo PDF)
// Ubicación: js/club-mode/cm-pagos.js
// ============================================================

// ========== ESTADO ==========
var cmPayConfigClub  = null;
var cmPayTabActiva   = 'cobros';
var cmPayConceptos   = [];
var cmPayDescuentos  = [];
var cmPayEquipos     = [];
var cmPayTemporadas  = [];
var cmPayAsignaciones = [];
var cmPayTransacciones = [];
var cmPayJugadoresMap = {};
var cmPayPaidByAsig = {};
var cmPayKpis = { cobrado: 0, pendiente: 0, morosidad: 0, alDia: 0, totalJug: 0 };
var cmPayAsignContador = {};
var cmPayDescUsoContador = {};
var cmPayConceptoEditando  = null;
var cmPayDescuentoEditando = null;
var cmPayMesActivo = '';
var cmPayFiltroType = 'all', cmPayFiltroEquipo = 'all', cmPayFiltroSeason = 'all', cmPayMostrarArch = false;
var cmPayDescFiltroType = 'all', cmPayDescFiltroScope = 'all', cmPayDescMostrarArch = false;
var cmPayCobFiltroEquipo = 'all', cmPayCobFiltroConcept = 'all', cmPayCobFiltroStatus = 'all', cmPayCobBusqueda = '', cmPayCobMostrarArch = false;
var cmPayDescPlayerSel = null, cmPayDescPlayerSearchTimer = null;
var cmPayClubPlayers = [];
var cmPayAsigPlayerSel = null;
var cmPayAsigHermanos = [];
var cmPayAsigTeamPlayers = [];
var cmPayPagoAsigActiva = null;   // asignación que se está cobrando

// Catálogos
var CMPAY_TYPES = [
    { key: 'cuota_mensual', label: 'Cuota mensual', color: '#3b82f6' },
    { key: 'matricula',     label: 'Matrícula',     color: '#8b5cf6' },
    { key: 'licencia',      label: 'Licencia',      color: '#06b6d4' },
    { key: 'material',      label: 'Material',      color: '#f59e0b' },
    { key: 'derrama',       label: 'Derrama',       color: '#ef4444' },
    { key: 'cuota_socio',   label: 'Cuota socio',   color: '#10b981' },
    { key: 'otro',          label: 'Otro',          color: '#64748b' }
];
var CMPAY_FREQS = [
    { key: 'one_time', label: 'Único' },
    { key: 'monthly',  label: 'Mensual' },
    { key: 'annual',   label: 'Anual' }
];
var CMPAY_DTYPES = [
    { key: 'percent', label: 'Porcentaje',     suffix: '%', color: '#3b82f6' },
    { key: 'fixed',   label: 'Importe fijo',   suffix: '€', color: '#f59e0b' },
    { key: 'free',    label: 'Exención total', suffix: '',  color: '#10b981' }
];
var CMPAY_SCOPES = [
    { key: 'player',  label: 'Jugador concreto' },
    { key: 'team',    label: 'Equipo entero' },
    { key: 'sibling', label: 'Hermanos (auto)' }
];
var CMPAY_STATUS = [
    { key: 'active',    label: 'Pendiente',  color: '#3b82f6', bg: '#1e3a5f' },
    { key: 'partial',   label: 'Parcial',    color: '#f59e0b', bg: '#422006' },
    { key: 'paid',      label: 'Pagado',     color: '#22c55e', bg: '#022c22' },
    { key: 'cancelled', label: 'Anulada',    color: '#64748b', bg: '#1f1f23' }
];
var CMPAY_METHODS = [
    { key: 'cash',         label: 'Efectivo',      icon: '💵' },
    { key: 'transfer',     label: 'Transferencia', icon: '🏦' },
    { key: 'bizum_manual', label: 'Bizum',         icon: '📱' },
    { key: 'pos_local',    label: 'TPV físico',    icon: '💳' }
];


// ========== INIT ==========
async function cmPayInit(containerId) {
    var container = document.getElementById(containerId);
    if (!container) { console.error('cmPayInit: contenedor no encontrado'); return; }
    if (!cmPayMesActivo) { var d = new Date(); cmPayMesActivo = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
    await cmPayCargarOCrearConfig();
    cmPayRenderShell(container);
}

async function cmPayCargarOCrearConfig() {
    try {
        var r = await supabaseClient.from('cm_pay_club_config').select('*').eq('club_id', clubId).maybeSingle();
        if (r.data) { cmPayConfigClub = r.data; return; }
        var ins = await supabaseClient.from('cm_pay_club_config').insert({ club_id: clubId }).select().single();
        if (ins.error) { console.error('[Pagos] Error creando config:', ins.error); return; }
        cmPayConfigClub = ins.data;
    } catch (e) { console.error('[Pagos] cmPayCargarOCrearConfig:', e); }
}


// ========== SHELL ==========
function cmPayRenderShell(container) {
    container.innerHTML =
    '<style>' +
        '.cmpay-panel{padding:20px;max-width:1400px;margin:0 auto}' +
        '.cmpay-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px}' +
        '.cmpay-header h2{margin:0;color:#e2e8f0;font-size:20px;display:flex;align-items:center;gap:10px}' +
        '.cmpay-badge{font-size:11px;background:#1e3a5f;color:#60a5fa;padding:3px 8px;border-radius:4px;font-weight:600}' +
        '.cmpay-tabs{display:flex;gap:0;border-bottom:1px solid #1e293b;margin-bottom:20px;flex-wrap:wrap}' +
        '.cmpay-tab{padding:10px 18px;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;border:none;border-bottom:2px solid transparent;transition:all .2s;background:none}' +
        '.cmpay-tab:hover{color:#e2e8f0}' +
        '.cmpay-tab.active{color:#3b82f6;border-bottom-color:#3b82f6}' +
        '.cmpay-tab .tab-icon{margin-right:6px;font-size:14px}' +
        '.cmpay-content{min-height:300px}' +
        '.cmpay-placeholder{background:#1e293b;border:1px dashed #334155;border-radius:12px;padding:48px 24px;text-align:center;color:#94a3b8}' +
        '.cmpay-placeholder .cmpay-ph-icon{font-size:42px;margin-bottom:14px;opacity:.7}' +
        '.cmpay-placeholder h3{margin:0 0 8px;color:#e2e8f0;font-size:18px}' +
        '.cmpay-placeholder p{margin:6px 0;font-size:13px;max-width:520px;margin-left:auto;margin-right:auto;line-height:1.5}' +
        '.cmpay-placeholder .cmpay-fase{margin-top:14px;display:inline-block;background:#0f172a;color:#60a5fa;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;border:1px solid #1e3a5f}' +
        '.cmpay-placeholder ul{text-align:left;display:inline-block;margin:14px auto 0;padding-left:20px;color:#94a3b8;font-size:12px;line-height:1.7}' +
        '.cmpay-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap}' +
        '.cmpay-toolbar-left{display:flex;gap:10px;align-items:center;flex-wrap:wrap}' +
        '.cmpay-toolbar select,.cmpay-toolbar input[type=text]{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px;cursor:pointer}' +
        '.cmpay-toolbar input[type=text]{cursor:text;min-width:180px}' +
        '.cmpay-toolbar label{color:#94a3b8;font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer}' +
        '.cmpay-table-wrap{background:#1e293b;border:1px solid #334155;border-radius:12px;overflow:hidden}' +
        '.cmpay-table{width:100%;border-collapse:collapse;font-size:13px}' +
        '.cmpay-table thead th{background:#0f172a;color:#94a3b8;text-align:left;padding:10px 14px;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.3px;border-bottom:1px solid #334155}' +
        '.cmpay-table tbody td{padding:12px 14px;border-bottom:1px solid #0f172a;color:#e2e8f0;vertical-align:middle}' +
        '.cmpay-table tbody tr:last-child td{border-bottom:none}' +
        '.cmpay-table tbody tr:hover{background:#172033}' +
        '.cmpay-table .num{font-family:Consolas,monospace;font-variant-numeric:tabular-nums;text-align:right}' +
        '.cmpay-table .muted{color:#64748b}' +
        '.cmpay-empty{padding:48px 24px;text-align:center;color:#94a3b8;font-size:14px}' +
        '.cmpay-type-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:#fff}' +
        '.cmpay-status-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}' +
        '.cmpay-status-active{background:#022c22;color:#22c55e;border:1px solid #14532d}' +
        '.cmpay-status-archived{background:#1f1f23;color:#64748b;border:1px solid #334155}' +
        '.cmpay-btn{padding:7px 16px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;display:inline-flex;align-items:center;gap:6px}' +
        '.cmpay-btn-primary{background:#3b82f6;color:#fff}.cmpay-btn-primary:hover{background:#2563eb}' +
        '.cmpay-btn-secondary{background:#334155;color:#e2e8f0}.cmpay-btn-secondary:hover{background:#475569}' +
        '.cmpay-btn-success{background:#065f46;color:#d1fae5}.cmpay-btn-success:hover{background:#047857;color:#fff}' +
        '.cmpay-btn-ghost{background:transparent;color:#94a3b8;padding:4px 10px;font-size:12px}.cmpay-btn-ghost:hover{color:#e2e8f0;background:#0f172a}' +
        '.cmpay-row-actions{display:flex;gap:4px;justify-content:flex-end}' +
        '.cmpay-modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:9000;display:flex;justify-content:center;align-items:center;padding:30px}' +
        '.cmpay-modal{background:#0f172a;border-radius:14px;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;border:1px solid #334155}' +
        '.cmpay-modal-header{display:flex;justify-content:space-between;align-items:center;padding:18px 24px;border-bottom:1px solid #1e293b}' +
        '.cmpay-modal-header h3{margin:0;color:#e2e8f0;font-size:17px}' +
        '.cmpay-modal-close{background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;padding:4px 8px}' +
        '.cmpay-modal-close:hover{color:#ef4444}' +
        '.cmpay-modal-body{padding:20px 24px}' +
        '.cmpay-modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:14px 24px;border-top:1px solid #1e293b}' +
        '.cmpay-form-group{margin-bottom:14px}' +
        '.cmpay-form-group label{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}' +
        '.cmpay-form-group input,.cmpay-form-group select,.cmpay-form-group textarea{width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit;box-sizing:border-box}' +
        '.cmpay-form-group input:focus,.cmpay-form-group select:focus,.cmpay-form-group textarea:focus{border-color:#3b82f6;outline:none}' +
        '.cmpay-form-group textarea{min-height:60px;resize:vertical}' +
        '.cmpay-form-group .hint{font-size:11px;color:#64748b;margin-top:3px}' +
        '.cmpay-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
        '.cmpay-form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}' +
        '.cmpay-ac{position:relative}' +
        '.cmpay-ac-results{position:absolute;top:100%;left:0;right:0;background:#1e293b;border:1px solid #334155;border-radius:6px;max-height:220px;overflow-y:auto;z-index:10001;display:none;margin-top:2px}' +
        '.cmpay-ac-results.show{display:block}' +
        '.cmpay-ac-item{padding:8px 12px;cursor:pointer;font-size:13px;color:#e2e8f0;border-bottom:1px solid #0f172a}' +
        '.cmpay-ac-item:hover{background:#172033}' +
        '.cmpay-ac-item:last-child{border-bottom:none}' +
        '.cmpay-ac-empty{padding:10px 12px;color:#64748b;font-size:12px;font-style:italic}' +
        '.cmpay-ac-selected{margin-top:6px;font-size:12px;color:#22c55e;display:flex;align-items:center;gap:8px;background:#022c22;padding:6px 10px;border-radius:6px;border:1px solid #14532d}' +
        '.cmpay-ac-clear{background:none;border:none;color:#fca5a5;cursor:pointer;font-size:14px;padding:0;margin-left:auto}' +
        '.cmpay-radio-group{display:flex;gap:8px;flex-wrap:wrap}' +
        '.cmpay-radio-group label{flex:1;min-width:120px;background:#1e293b;border:1px solid #334155;border-radius:6px;padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;color:#94a3b8;font-size:13px;font-weight:500;transition:all .2s}' +
        '.cmpay-radio-group label.active{background:#1e3a5f;border-color:#3b82f6;color:#60a5fa}' +
        '.cmpay-radio-group label input{display:none}' +
        '.cmpay-hermanos-banner{background:#422006;border:1px solid #f59e0b;border-radius:8px;padding:12px 14px;margin-top:8px}' +
        '.cmpay-hermanos-banner .tit{color:#f59e0b;font-weight:600;font-size:13px;margin-bottom:6px}' +
        '.cmpay-hermanos-banner .desc{color:#fbbf24;font-size:12px;margin-bottom:10px;line-height:1.4}' +
        '.cmpay-hermanos-banner select{margin-bottom:6px}' +
        '.cmpay-preview{background:#0a1830;border:1px solid #1e3a5f;border-radius:8px;padding:14px;margin-top:8px}' +
        '.cmpay-preview .lbl{font-size:11px;color:#60a5fa;text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:6px}' +
        '.cmpay-preview .row{display:flex;justify-content:space-between;font-size:13px;color:#e2e8f0;padding:4px 0}' +
        '.cmpay-preview .row .v{font-family:Consolas,monospace;font-weight:600}' +
        '.cmpay-preview .total{border-top:1px solid #1e3a5f;margin-top:6px;padding-top:8px;font-size:14px}' +
        '.cmpay-preview .total .v{color:#22c55e;font-size:16px}' +
        // Pago modal específico
        '.cmpay-pago-info{background:#172033;border:1px solid #334155;border-radius:8px;padding:14px;margin-bottom:16px}' +
        '.cmpay-pago-info .row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}' +
        '.cmpay-pago-info .row .k{color:#94a3b8}' +
        '.cmpay-pago-info .row .v{color:#e2e8f0;font-weight:600}' +
        '.cmpay-pago-info .row .pendiente{color:#f59e0b;font-family:Consolas,monospace;font-size:15px}' +
        '.cmpay-pago-section{border-top:1px solid #1e293b;padding-top:14px;margin-top:14px}' +
        '.cmpay-pago-section .sec-title{font-size:12px;color:#60a5fa;text-transform:uppercase;letter-spacing:.5px;font-weight:600;margin-bottom:10px}' +
        // Config / KPI
        '.cmpay-config-card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:18px;margin-bottom:14px}' +
        '.cmpay-config-card h4{margin:0 0 10px;color:#e2e8f0;font-size:14px}' +
        '.cmpay-config-card .kv{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #0f172a;font-size:13px}' +
        '.cmpay-config-card .kv:last-child{border-bottom:none}' +
        '.cmpay-config-card .kv .k{color:#94a3b8}' +
        '.cmpay-config-card .kv .v{color:#e2e8f0;font-weight:500;font-family:Consolas,monospace}' +
        '.cmpay-kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}' +
        '.cmpay-kpi{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:14px 18px}' +
        '.cmpay-kpi .lbl{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;font-weight:600}' +
        '.cmpay-kpi .val{font-size:22px;color:#e2e8f0;font-weight:600;font-family:Consolas,monospace}' +
        '.cmpay-kpi.success .val{color:#22c55e}' +
        '.cmpay-kpi.warn .val{color:#f59e0b}' +
        '.cmpay-kpi.danger .val{color:#ef4444}' +
        '.cmpay-mes-nav{display:flex;align-items:center;gap:8px;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:4px 6px}' +
        '.cmpay-mes-nav button{background:transparent;border:none;color:#94a3b8;cursor:pointer;padding:4px 8px;border-radius:4px;font-size:14px}' +
        '.cmpay-mes-nav button:hover{background:#0f172a;color:#e2e8f0}' +
        '.cmpay-mes-nav .mes-txt{color:#e2e8f0;font-weight:600;font-size:13px;min-width:130px;text-align:center}' +
        '.cmpay-player-cell{display:flex;align-items:center;gap:10px}' +
        '.cmpay-player-photo{width:32px;height:32px;border-radius:50%;background:#334155;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:12px;font-weight:600;overflow:hidden;flex-shrink:0}' +
        '.cmpay-player-photo img{width:100%;height:100%;object-fit:cover}' +
        '.cmpay-player-info .nm{color:#e2e8f0;font-weight:600;font-size:13px}' +
        '.cmpay-player-info .tm{color:#64748b;font-size:11px}' +
    '</style>' +
    '<div class="cmpay-panel">' +
        '<div class="cmpay-header"><h2>💰 Pagos y cuotas <span class="cmpay-badge">P.1.4 registrar pago</span></h2></div>' +
        '<div class="cmpay-tabs" id="cmpay-tabs">' +
            '<button class="cmpay-tab" data-tab="conceptos"   onclick="cmPayCambiarTab(\'conceptos\')"  ><span class="tab-icon">📋</span>Conceptos</button>' +
            '<button class="cmpay-tab" data-tab="descuentos"  onclick="cmPayCambiarTab(\'descuentos\')" ><span class="tab-icon">🏷️</span>Descuentos</button>' +
            '<button class="cmpay-tab active" data-tab="cobros" onclick="cmPayCambiarTab(\'cobros\')"   ><span class="tab-icon">💵</span>Cobros</button>' +
            '<button class="cmpay-tab" data-tab="liquidacion" onclick="cmPayCambiarTab(\'liquidacion\')"><span class="tab-icon">🏦</span>Liquidación</button>' +
            '<button class="cmpay-tab" data-tab="config"      onclick="cmPayCambiarTab(\'config\')"     ><span class="tab-icon">⚙️</span>Configuración</button>' +
        '</div>' +
        '<div class="cmpay-content" id="cmpay-content"></div>' +
    '</div>';
    cmPayRenderTab(cmPayTabActiva);
}

function cmPayCambiarTab(tab) {
    cmPayTabActiva = tab;
    document.querySelectorAll('#cmpay-tabs .cmpay-tab').forEach(function(b) { b.classList.toggle('active', b.dataset.tab === tab); });
    cmPayRenderTab(tab);
}

function cmPayRenderTab(tab) {
    var c = document.getElementById('cmpay-content');
    if (!c) return;
    if      (tab === 'conceptos')   cmPayRenderConceptos(c);
    else if (tab === 'descuentos')  cmPayRenderDescuentos(c);
    else if (tab === 'cobros')      cmPayRenderCobros(c);
    else if (tab === 'liquidacion') cmPayRenderLiquidacion(c);
    else if (tab === 'config')      cmPayRenderConfig(c);
}


// ============================================================
// PESTAÑA CONCEPTOS
// ============================================================
async function cmPayRenderConceptos(container) {
    container.innerHTML = '<div class="cmpay-empty">Cargando conceptos...</div>';
    await cmPayCargarConceptosData();
    cmPayPintarConceptos(container);
}

async function cmPayCargarConceptosData() {
    try {
        var r = await Promise.all([
            supabaseClient.from('cm_pay_concepts').select('*').eq('club_id', clubId).order('created_at', { ascending: false }),
            supabaseClient.from('club_teams').select('id, name, category').eq('club_id', clubId).eq('active', true).order('name'),
            supabaseClient.from('seasons').select('id, name, start_date, end_date').eq('club_id', clubId).order('start_date', { ascending: false }),
            supabaseClient.from('cm_pay_assignments').select('concept_id').eq('club_id', clubId).eq('archived', false).neq('status', 'cancelled')
        ]);
        cmPayConceptos = r[0].data || [];
        cmPayEquipos = r[1].data || [];
        cmPayTemporadas = r[2].data || [];
        var asigs = r[3].data || [];
        cmPayAsignContador = {};
        asigs.forEach(function(a) { cmPayAsignContador[a.concept_id] = (cmPayAsignContador[a.concept_id] || 0) + 1; });
    } catch (e) { console.error('[Pagos]', e); }
}

function cmPayPintarConceptos(container) {
    var lista = cmPayConceptos.filter(function(c) {
        if (!cmPayMostrarArch && c.archived) return false;
        if (cmPayFiltroType !== 'all' && c.type !== cmPayFiltroType) return false;
        if (cmPayFiltroEquipo !== 'all' && c.team_id !== cmPayFiltroEquipo) return false;
        if (cmPayFiltroSeason !== 'all' && c.season_id !== cmPayFiltroSeason) return false;
        return true;
    });
    var optsType = '<option value="all">Todos los tipos</option>' + CMPAY_TYPES.map(function(t) { return '<option value="' + t.key + '"' + (cmPayFiltroType === t.key ? ' selected' : '') + '>' + t.label + '</option>'; }).join('');
    var optsEquipo = '<option value="all">Todos los equipos</option>' + cmPayEquipos.map(function(e) { return '<option value="' + e.id + '"' + (cmPayFiltroEquipo === e.id ? ' selected' : '') + '>' + cmPayEscape(e.name) + '</option>'; }).join('');
    var optsSeason = '<option value="all">Todas las temporadas</option>' + cmPayTemporadas.map(function(s) { return '<option value="' + s.id + '"' + (cmPayFiltroSeason === s.id ? ' selected' : '') + '>' + cmPayEscape(s.name) + '</option>'; }).join('');
    var html = '<div class="cmpay-toolbar"><div class="cmpay-toolbar-left">' +
        '<select onchange="cmPayFiltroType=this.value;cmPayRenderTab(\'conceptos\')">' + optsType + '</select>' +
        '<select onchange="cmPayFiltroEquipo=this.value;cmPayRenderTab(\'conceptos\')">' + optsEquipo + '</select>' +
        '<select onchange="cmPayFiltroSeason=this.value;cmPayRenderTab(\'conceptos\')">' + optsSeason + '</select>' +
        '<label><input type="checkbox" ' + (cmPayMostrarArch ? 'checked' : '') + ' onchange="cmPayMostrarArch=this.checked;cmPayRenderTab(\'conceptos\')"> Mostrar archivados</label>' +
        '</div><button class="cmpay-btn cmpay-btn-primary" onclick="cmPayAbrirModalConcepto()">+ Nuevo concepto</button></div>';
    if (lista.length === 0) { html += '<div class="cmpay-table-wrap"><div class="cmpay-empty">No hay conceptos con estos filtros.</div></div>'; container.innerHTML = html; return; }
    html += '<div class="cmpay-table-wrap"><table class="cmpay-table"><thead><tr><th>Nombre</th><th>Tipo</th><th>Importe</th><th>Frecuencia</th><th>Equipo</th><th>Temporada</th><th>Asign.</th><th>Estado</th><th></th></tr></thead><tbody>';
    lista.forEach(function(c) {
        var tInfo = CMPAY_TYPES.find(function(t) { return t.key === c.type; }) || CMPAY_TYPES[6];
        var fInfo = CMPAY_FREQS.find(function(f) { return f.key === c.frequency; });
        var freqLabel = fInfo ? fInfo.label : (c.frequency || '—');
        if (c.frequency === 'monthly' && c.billing_day) freqLabel += ' (día ' + c.billing_day + ')';
        var equipo = cmPayEquipos.find(function(e) { return e.id === c.team_id; });
        var temp = cmPayTemporadas.find(function(s) { return s.id === c.season_id; });
        var nAsig = cmPayAsignContador[c.id] || 0;
        html += '<tr><td><strong>' + cmPayEscape(c.name) + '</strong>' + (c.description ? '<br><span class="muted" style="font-size:11px">' + cmPayEscape(c.description) + '</span>' : '') + '</td>' +
            '<td><span class="cmpay-type-badge" style="background:' + tInfo.color + '">' + tInfo.label + '</span></td>' +
            '<td class="num">' + cmPayFormatoEuro(c.amount) + '</td><td>' + freqLabel + '</td>' +
            '<td>' + (equipo ? cmPayEscape(equipo.name) : '<span class="muted">Todos</span>') + '</td>' +
            '<td>' + (temp ? cmPayEscape(temp.name) : '<span class="muted">—</span>') + '</td>' +
            '<td class="num">' + nAsig + '</td>' +
            '<td>' + (c.archived ? '<span class="cmpay-status-badge cmpay-status-archived">Archivado</span>' : '<span class="cmpay-status-badge cmpay-status-active">' + (c.active ? 'Activo' : 'Inactivo') + '</span>') + '</td>' +
            '<td><div class="cmpay-row-actions">' +
                (c.archived ? '<button class="cmpay-btn cmpay-btn-ghost" onclick="cmPayDesarchivarConcepto(\'' + c.id + '\')">Restaurar</button>' : '<button class="cmpay-btn cmpay-btn-ghost" onclick="cmPayAbrirModalConcepto(\'' + c.id + '\')">Editar</button><button class="cmpay-btn cmpay-btn-ghost" onclick="cmPayArchivarConcepto(\'' + c.id + '\')">Archivar</button>') +
            '</div></td></tr>';
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function cmPayAbrirModalConcepto(id) {
    cmPayConceptoEditando = id ? cmPayConceptos.find(function(c) { return c.id === id; }) : null;
    var c = cmPayConceptoEditando || { type: 'cuota_mensual', frequency: 'monthly', billing_day: 1, currency: 'EUR', active: true };
    var optsType = CMPAY_TYPES.map(function(t) { return '<option value="' + t.key + '"' + (c.type === t.key ? ' selected' : '') + '>' + t.label + '</option>'; }).join('');
    var optsFreq = CMPAY_FREQS.map(function(f) { return '<option value="' + f.key + '"' + (c.frequency === f.key ? ' selected' : '') + '>' + f.label + '</option>'; }).join('');
    var optsEquipo = '<option value="">— Sin equipo concreto —</option>' + cmPayEquipos.map(function(e) { return '<option value="' + e.id + '"' + (c.team_id === e.id ? ' selected' : '') + '>' + cmPayEscape(e.name) + '</option>'; }).join('');
    var optsSeason = '<option value="">— Sin temporada concreta —</option>' + cmPayTemporadas.map(function(s) { return '<option value="' + s.id + '"' + (c.season_id === s.id ? ' selected' : '') + '>' + cmPayEscape(s.name) + '</option>'; }).join('');
    var html = '<div class="cmpay-modal-overlay" id="cmpay-modal-concepto" onclick="if(event.target===this)cmPayCerrarModal()"><div class="cmpay-modal">' +
        '<div class="cmpay-modal-header"><h3>' + (cmPayConceptoEditando ? 'Editar concepto' : 'Nuevo concepto') + '</h3><button class="cmpay-modal-close" onclick="cmPayCerrarModal()">×</button></div>' +
        '<div class="cmpay-modal-body">' +
            '<div class="cmpay-form-group"><label>Nombre *</label><input type="text" id="cmpay-c-name" value="' + cmPayEscape(c.name || '') + '" placeholder="Ej: Cuota mensual Alevín A"></div>' +
            '<div class="cmpay-form-group"><label>Tipo *</label><select id="cmpay-c-type">' + optsType + '</select></div>' +
            '<div class="cmpay-form-group"><label>Descripción</label><textarea id="cmpay-c-desc">' + cmPayEscape(c.description || '') + '</textarea></div>' +
            '<div class="cmpay-form-row-3">' +
                '<div class="cmpay-form-group"><label>Importe (€) *</label><input type="number" id="cmpay-c-amount" step="0.01" min="0" value="' + (c.amount || '') + '"></div>' +
                '<div class="cmpay-form-group"><label>Frecuencia *</label><select id="cmpay-c-freq" onchange="cmPayToggleBillingDay()">' + optsFreq + '</select></div>' +
                '<div class="cmpay-form-group" id="cmpay-c-bd-group" style="' + (c.frequency === 'monthly' ? '' : 'display:none') + '"><label>Día de cobro</label><input type="number" id="cmpay-c-bd" min="1" max="28" value="' + (c.billing_day || 1) + '"><div class="hint">1–28</div></div>' +
            '</div>' +
            '<div class="cmpay-form-row">' +
                '<div class="cmpay-form-group"><label>Equipo</label><select id="cmpay-c-team">' + optsEquipo + '</select><div class="hint">Opcional</div></div>' +
                '<div class="cmpay-form-group"><label>Temporada</label><select id="cmpay-c-season">' + optsSeason + '</select><div class="hint">Opcional</div></div>' +
            '</div>' +
            (cmPayConceptoEditando ? '<div class="cmpay-form-group"><label style="display:inline-flex;align-items:center;gap:8px"><input type="checkbox" id="cmpay-c-active" ' + (c.active ? 'checked' : '') + '> Concepto activo</label></div>' : '') +
        '</div>' +
        '<div class="cmpay-modal-footer"><button class="cmpay-btn cmpay-btn-secondary" onclick="cmPayCerrarModal()">Cancelar</button><button class="cmpay-btn cmpay-btn-primary" onclick="cmPayGuardarConcepto()">' + (cmPayConceptoEditando ? 'Guardar cambios' : 'Crear concepto') + '</button></div>' +
    '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(function() { var el = document.getElementById('cmpay-c-name'); if (el) el.focus(); }, 50);
}

function cmPayToggleBillingDay() { var freq = document.getElementById('cmpay-c-freq').value; var grp = document.getElementById('cmpay-c-bd-group'); if (grp) grp.style.display = (freq === 'monthly') ? '' : 'none'; }
function cmPayCerrarModal() { var m = document.getElementById('cmpay-modal-concepto'); if (m) m.remove(); cmPayConceptoEditando = null; }

async function cmPayGuardarConcepto() {
    var name = document.getElementById('cmpay-c-name').value.trim();
    var type = document.getElementById('cmpay-c-type').value;
    var desc = document.getElementById('cmpay-c-desc').value.trim();
    var amount = parseFloat(document.getElementById('cmpay-c-amount').value);
    var freq = document.getElementById('cmpay-c-freq').value;
    var bd = parseInt(document.getElementById('cmpay-c-bd').value, 10);
    var team = document.getElementById('cmpay-c-team').value || null;
    var season = document.getElementById('cmpay-c-season').value || null;
    var activeEl = document.getElementById('cmpay-c-active');
    if (!name) { cmPayToast('El nombre es obligatorio', 'error'); return; }
    if (isNaN(amount) || amount < 0) { cmPayToast('Importe no válido', 'error'); return; }
    var payload = { club_id: clubId, name: name, type: type, description: desc || null, amount: amount, currency: 'EUR', frequency: freq, billing_day: (freq === 'monthly') ? (bd || 1) : null, team_id: team, season_id: season };
    try {
        if (cmPayConceptoEditando) {
            payload.active = activeEl ? activeEl.checked : true;
            var u = await supabaseClient.from('cm_pay_concepts').update(payload).eq('id', cmPayConceptoEditando.id);
            if (u.error) throw u.error;
            cmPayToast('Concepto actualizado', 'success');
        } else {
            payload.created_by = (cmState && cmState.miembro) ? cmState.miembro.id : null;
            var i = await supabaseClient.from('cm_pay_concepts').insert(payload);
            if (i.error) throw i.error;
            cmPayToast('Concepto creado', 'success');
        }
        cmPayCerrarModal(); cmPayRenderTab('conceptos');
    } catch (e) { console.error(e); cmPayToast('Error: ' + (e.message || ''), 'error'); }
}

async function cmPayArchivarConcepto(id) {
    var c = cmPayConceptos.find(function(x) { return x.id === id; });
    if (!c) return;
    if (!confirm('¿Archivar el concepto "' + c.name + '"?')) return;
    try { var u = await supabaseClient.from('cm_pay_concepts').update({ archived: true, archived_at: new Date().toISOString() }).eq('id', id); if (u.error) throw u.error; cmPayToast('Concepto archivado', 'success'); cmPayRenderTab('conceptos'); }
    catch (e) { console.error(e); cmPayToast('Error', 'error'); }
}

async function cmPayDesarchivarConcepto(id) {
    try { var u = await supabaseClient.from('cm_pay_concepts').update({ archived: false, archived_at: null }).eq('id', id); if (u.error) throw u.error; cmPayToast('Concepto restaurado', 'success'); cmPayRenderTab('conceptos'); }
    catch (e) { console.error(e); cmPayToast('Error', 'error'); }
}


// ============================================================
// PESTAÑA DESCUENTOS
// ============================================================
async function cmPayRenderDescuentos(container) {
    container.innerHTML = '<div class="cmpay-empty">Cargando descuentos...</div>';
    await cmPayCargarDescuentosData();
    cmPayPintarDescuentos(container);
}

async function cmPayCargarDescuentosData() {
    try {
        var r = await Promise.all([
            supabaseClient.from('cm_pay_discounts').select('*').eq('club_id', clubId).order('created_at', { ascending: false }),
            supabaseClient.from('cm_pay_concepts').select('id, name, type').eq('club_id', clubId).eq('archived', false),
            supabaseClient.from('club_teams').select('id, name').eq('club_id', clubId).eq('active', true).order('name'),
            supabaseClient.from('cm_pay_assignments').select('discount_id').eq('club_id', clubId).eq('archived', false).neq('status', 'cancelled').not('discount_id', 'is', null)
        ]);
        cmPayDescuentos = r[0].data || [];
        cmPayConceptos = r[1].data || cmPayConceptos;
        cmPayEquipos = r[2].data || cmPayEquipos;
        var asigs = r[3].data || [];
        cmPayDescUsoContador = {};
        asigs.forEach(function(a) { cmPayDescUsoContador[a.discount_id] = (cmPayDescUsoContador[a.discount_id] || 0) + 1; });
        var pIds = cmPayDescuentos.filter(function(d) { return d.scope === 'player' && d.scope_id; }).map(function(d) { return d.scope_id; });
        if (pIds.length > 0) {
            var pp = await supabaseClient.from('players').select('id, name').in('id', pIds);
            var byId = {};
            (pp.data || []).forEach(function(p) { byId[p.id] = p.name; });
            cmPayDescuentos.forEach(function(d) { if (d.scope === 'player' && d.scope_id) d._player_name = byId[d.scope_id] || '(jugador no encontrado)'; });
        }
    } catch (e) { console.error('[Pagos] descuentos:', e); }
}

function cmPayPintarDescuentos(container) {
    var lista = cmPayDescuentos.filter(function(d) {
        if (!cmPayDescMostrarArch && d.archived) return false;
        if (cmPayDescFiltroType !== 'all' && d.discount_type !== cmPayDescFiltroType) return false;
        if (cmPayDescFiltroScope !== 'all' && d.scope !== cmPayDescFiltroScope) return false;
        return true;
    });
    var optsType = '<option value="all">Todos los tipos</option>' + CMPAY_DTYPES.map(function(t) { return '<option value="' + t.key + '"' + (cmPayDescFiltroType === t.key ? ' selected' : '') + '>' + t.label + '</option>'; }).join('');
    var optsScope = '<option value="all">Todos los alcances</option>' + CMPAY_SCOPES.map(function(s) { return '<option value="' + s.key + '"' + (cmPayDescFiltroScope === s.key ? ' selected' : '') + '>' + s.label + '</option>'; }).join('');
    var html = '<div class="cmpay-toolbar"><div class="cmpay-toolbar-left">' +
        '<select onchange="cmPayDescFiltroType=this.value;cmPayRenderTab(\'descuentos\')">' + optsType + '</select>' +
        '<select onchange="cmPayDescFiltroScope=this.value;cmPayRenderTab(\'descuentos\')">' + optsScope + '</select>' +
        '<label><input type="checkbox" ' + (cmPayDescMostrarArch ? 'checked' : '') + ' onchange="cmPayDescMostrarArch=this.checked;cmPayRenderTab(\'descuentos\')"> Mostrar archivados</label>' +
        '</div><button class="cmpay-btn cmpay-btn-primary" onclick="cmPayAbrirModalDescuento()">+ Nuevo descuento</button></div>';
    if (lista.length === 0) { html += '<div class="cmpay-table-wrap"><div class="cmpay-empty">No hay descuentos con estos filtros.</div></div>'; container.innerHTML = html; return; }
    html += '<div class="cmpay-table-wrap"><table class="cmpay-table"><thead><tr><th>Nombre</th><th>Tipo</th><th>Concepto</th><th>Alcance</th><th>Vigencia</th><th>Uso</th><th>Estado</th><th></th></tr></thead><tbody>';
    lista.forEach(function(d) {
        var dt = CMPAY_DTYPES.find(function(t) { return t.key === d.discount_type; }) || CMPAY_DTYPES[0];
        var valorTxt = (d.discount_type === 'free') ? 'Exención' : (cmPayFormatoNumero(d.value) + ' ' + dt.suffix);
        var concepto = d.concept_id ? cmPayConceptos.find(function(c) { return c.id === d.concept_id; }) : null;
        var nUso = cmPayDescUsoContador[d.id] || 0;
        html += '<tr><td><strong>' + cmPayEscape(d.name) + '</strong></td>' +
            '<td><span class="cmpay-type-badge" style="background:' + dt.color + '">' + valorTxt + '</span></td>' +
            '<td>' + (concepto ? cmPayEscape(concepto.name) : '<span class="muted">Cualquiera</span>') + '</td>' +
            '<td>' + cmPayDescScopeLabel(d) + '</td>' +
            '<td><span class="muted" style="font-size:12px">' + cmPayVigenciaTxt(d.valid_from, d.valid_until) + '</span></td>' +
            '<td class="num">' + nUso + '</td>' +
            '<td>' + (d.archived ? '<span class="cmpay-status-badge cmpay-status-archived">Archivado</span>' : '<span class="cmpay-status-badge cmpay-status-active">' + (d.active ? 'Activo' : 'Inactivo') + '</span>') + '</td>' +
            '<td><div class="cmpay-row-actions">' +
                (d.archived ? '<button class="cmpay-btn cmpay-btn-ghost" onclick="cmPayDesarchivarDescuento(\'' + d.id + '\')">Restaurar</button>' : '<button class="cmpay-btn cmpay-btn-ghost" onclick="cmPayAbrirModalDescuento(\'' + d.id + '\')">Editar</button><button class="cmpay-btn cmpay-btn-ghost" onclick="cmPayArchivarDescuento(\'' + d.id + '\')">Archivar</button>') +
            '</div></td></tr>';
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function cmPayDescScopeLabel(d) {
    if (d.scope === 'team') { var t = cmPayEquipos.find(function(e) { return e.id === d.scope_id; }); return '<span style="font-size:12px">Equipo: <strong>' + (t ? cmPayEscape(t.name) : '?') + '</strong></span>'; }
    if (d.scope === 'player') return '<span style="font-size:12px">Jugador: <strong>' + cmPayEscape(d._player_name || '?') + '</strong></span>';
    if (d.scope === 'sibling') return '<span style="font-size:12px">Hermano nº <strong>' + (d.sibling_order || '?') + '</strong> (auto)</span>';
    return '<span class="muted">—</span>';
}

function cmPayVigenciaTxt(from, until) { if (!from && !until) return 'Siempre'; return (from ? cmPayFormatoFecha(from) : '∞') + ' → ' + (until ? cmPayFormatoFecha(until) : '∞'); }

function cmPayAbrirModalDescuento(id) {
    cmPayDescuentoEditando = id ? cmPayDescuentos.find(function(d) { return d.id === id; }) : null;
    var d = cmPayDescuentoEditando || { discount_type: 'percent', scope: 'player', sibling_order: 2, active: true };
    cmPayDescPlayerSel = null;
    if (d.scope === 'player' && d.scope_id && d._player_name) cmPayDescPlayerSel = { id: d.scope_id, name: d._player_name };
    var optsConcept = '<option value="">— Cualquier concepto —</option>' + cmPayConceptos.filter(function(c) { return !c.archived; }).map(function(c) { return '<option value="' + c.id + '"' + (d.concept_id === c.id ? ' selected' : '') + '>' + cmPayEscape(c.name) + '</option>'; }).join('');
    var optsDType = CMPAY_DTYPES.map(function(t) { return '<option value="' + t.key + '"' + (d.discount_type === t.key ? ' selected' : '') + '>' + t.label + '</option>'; }).join('');
    var optsScope = CMPAY_SCOPES.map(function(s) { return '<option value="' + s.key + '"' + (d.scope === s.key ? ' selected' : '') + '>' + s.label + '</option>'; }).join('');
    var optsTeam = '<option value="">— Selecciona equipo —</option>' + cmPayEquipos.map(function(e) { return '<option value="' + e.id + '"' + (d.scope_id === e.id ? ' selected' : '') + '>' + cmPayEscape(e.name) + '</option>'; }).join('');
    var dt = CMPAY_DTYPES.find(function(t) { return t.key === d.discount_type; }) || CMPAY_DTYPES[0];
    var html = '<div class="cmpay-modal-overlay" id="cmpay-modal-descuento" onclick="if(event.target===this)cmPayCerrarModalDesc()"><div class="cmpay-modal">' +
        '<div class="cmpay-modal-header"><h3>' + (cmPayDescuentoEditando ? 'Editar descuento' : 'Nuevo descuento') + '</h3><button class="cmpay-modal-close" onclick="cmPayCerrarModalDesc()">×</button></div>' +
        '<div class="cmpay-modal-body">' +
            '<div class="cmpay-form-group"><label>Nombre *</label><input type="text" id="cmpay-d-name" value="' + cmPayEscape(d.name || '') + '" placeholder="Ej: Beca social Mateo Gómez, Hermano 2º..."></div>' +
            '<div class="cmpay-form-group"><label>Aplicable al concepto</label><select id="cmpay-d-concept">' + optsConcept + '</select><div class="hint">Vacío = aplica a cualquier concepto</div></div>' +
            '<div class="cmpay-form-row">' +
                '<div class="cmpay-form-group"><label>Tipo de descuento *</label><select id="cmpay-d-type" onchange="cmPayDescTipoChange()">' + optsDType + '</select></div>' +
                '<div class="cmpay-form-group" id="cmpay-d-value-group" style="' + (d.discount_type === 'free' ? 'display:none' : '') + '"><label>Valor * <span id="cmpay-d-value-suffix">' + dt.suffix + '</span></label><input type="number" id="cmpay-d-value" step="0.01" min="0" value="' + (d.value || '') + '"><div class="hint" id="cmpay-d-value-hint">' + (d.discount_type === 'percent' ? 'Entre 0 y 100' : 'En euros') + '</div></div>' +
            '</div>' +
            '<div class="cmpay-form-group"><label>Alcance *</label><select id="cmpay-d-scope" onchange="cmPayDescScopeChange()">' + optsScope + '</select></div>' +
            '<div class="cmpay-form-group cmpay-ac" id="cmpay-d-scope-player" style="' + (d.scope === 'player' ? '' : 'display:none') + '"><label>Jugador *</label><input type="text" id="cmpay-d-player-search" placeholder="Escribe el nombre del jugador..." oninput="cmPayBuscarJugador()" autocomplete="off"><div class="cmpay-ac-results" id="cmpay-d-ac-results"></div><div id="cmpay-d-player-sel-wrap">' + (cmPayDescPlayerSel ? '<div class="cmpay-ac-selected">✓ Seleccionado: <strong>' + cmPayEscape(cmPayDescPlayerSel.name) + '</strong><button type="button" class="cmpay-ac-clear" onclick="cmPayLimpiarJugador()">Quitar</button></div>' : '') + '</div></div>' +
            '<div class="cmpay-form-group" id="cmpay-d-scope-team" style="' + (d.scope === 'team' ? '' : 'display:none') + '"><label>Equipo *</label><select id="cmpay-d-team">' + optsTeam + '</select></div>' +
            '<div class="cmpay-form-group" id="cmpay-d-scope-sibling" style="' + (d.scope === 'sibling' ? '' : 'display:none') + '"><label>Orden de hermano *</label><input type="number" id="cmpay-d-sibling" min="2" max="9" value="' + (d.sibling_order || 2) + '"><div class="hint">2 = segundo hermano, 3 = tercero, etc.</div></div>' +
            '<div class="cmpay-form-row">' +
                '<div class="cmpay-form-group"><label>Válido desde</label><input type="date" id="cmpay-d-from" value="' + (d.valid_from || '') + '"></div>' +
                '<div class="cmpay-form-group"><label>Válido hasta</label><input type="date" id="cmpay-d-until" value="' + (d.valid_until || '') + '"></div>' +
            '</div>' +
            (cmPayDescuentoEditando ? '<div class="cmpay-form-group"><label style="display:inline-flex;align-items:center;gap:8px"><input type="checkbox" id="cmpay-d-active" ' + (d.active ? 'checked' : '') + '> Descuento activo</label></div>' : '') +
        '</div>' +
        '<div class="cmpay-modal-footer"><button class="cmpay-btn cmpay-btn-secondary" onclick="cmPayCerrarModalDesc()">Cancelar</button><button class="cmpay-btn cmpay-btn-primary" onclick="cmPayGuardarDescuento()">' + (cmPayDescuentoEditando ? 'Guardar cambios' : 'Crear descuento') + '</button></div>' +
    '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(function() { var el = document.getElementById('cmpay-d-name'); if (el) el.focus(); }, 50);
}

function cmPayCerrarModalDesc() { var m = document.getElementById('cmpay-modal-descuento'); if (m) m.remove(); cmPayDescuentoEditando = null; cmPayDescPlayerSel = null; }

function cmPayDescTipoChange() {
    var t = document.getElementById('cmpay-d-type').value;
    var info = CMPAY_DTYPES.find(function(x) { return x.key === t; }) || CMPAY_DTYPES[0];
    document.getElementById('cmpay-d-value-suffix').textContent = info.suffix;
    document.getElementById('cmpay-d-value-hint').textContent = (t === 'percent') ? 'Entre 0 y 100' : (t === 'fixed' ? 'En euros' : '');
    document.getElementById('cmpay-d-value-group').style.display = (t === 'free') ? 'none' : '';
}

function cmPayDescScopeChange() {
    var s = document.getElementById('cmpay-d-scope').value;
    document.getElementById('cmpay-d-scope-player').style.display = (s === 'player') ? '' : 'none';
    document.getElementById('cmpay-d-scope-team').style.display = (s === 'team') ? '' : 'none';
    document.getElementById('cmpay-d-scope-sibling').style.display = (s === 'sibling') ? '' : 'none';
}

function cmPayBuscarJugador() {
    var input = document.getElementById('cmpay-d-player-search');
    var resBox = document.getElementById('cmpay-d-ac-results');
    if (!input || !resBox) return;
    var term = input.value.trim();
    if (cmPayDescPlayerSearchTimer) clearTimeout(cmPayDescPlayerSearchTimer);
    if (term.length < 2) { resBox.classList.remove('show'); resBox.innerHTML = ''; return; }
    cmPayDescPlayerSearchTimer = setTimeout(async function() {
        try {
            var r = await supabaseClient.from('players').select('id, name, position').ilike('name', '%' + term + '%').order('name').limit(20);
            var rows = r.data || [];
            if (rows.length === 0) resBox.innerHTML = '<div class="cmpay-ac-empty">Sin resultados</div>';
            else resBox.innerHTML = rows.map(function(p) { return '<div class="cmpay-ac-item" onclick=\'cmPaySeleccionarJugador(' + JSON.stringify(p) + ')\'><strong>' + cmPayEscape(p.name) + '</strong>' + (p.position ? ' <span class="muted" style="font-size:11px">· ' + cmPayEscape(p.position) + '</span>' : '') + '</div>'; }).join('');
            resBox.classList.add('show');
        } catch (e) { console.error(e); resBox.innerHTML = '<div class="cmpay-ac-empty">Error</div>'; resBox.classList.add('show'); }
    }, 250);
}

function cmPaySeleccionarJugador(p) {
    cmPayDescPlayerSel = { id: p.id, name: p.name };
    var input = document.getElementById('cmpay-d-player-search');
    var resBox = document.getElementById('cmpay-d-ac-results');
    var selWrap = document.getElementById('cmpay-d-player-sel-wrap');
    if (input) input.value = '';
    if (resBox) { resBox.classList.remove('show'); resBox.innerHTML = ''; }
    if (selWrap) selWrap.innerHTML = '<div class="cmpay-ac-selected">✓ Seleccionado: <strong>' + cmPayEscape(p.name) + '</strong><button type="button" class="cmpay-ac-clear" onclick="cmPayLimpiarJugador()">Quitar</button></div>';
}

function cmPayLimpiarJugador() { cmPayDescPlayerSel = null; var selWrap = document.getElementById('cmpay-d-player-sel-wrap'); if (selWrap) selWrap.innerHTML = ''; }

async function cmPayGuardarDescuento() {
    var name = document.getElementById('cmpay-d-name').value.trim();
    var concept = document.getElementById('cmpay-d-concept').value || null;
    var dtype = document.getElementById('cmpay-d-type').value;
    var value = parseFloat(document.getElementById('cmpay-d-value').value);
    var scope = document.getElementById('cmpay-d-scope').value;
    var team = document.getElementById('cmpay-d-team').value || null;
    var sibling = parseInt(document.getElementById('cmpay-d-sibling').value, 10);
    var vfrom = document.getElementById('cmpay-d-from').value || null;
    var vuntil = document.getElementById('cmpay-d-until').value || null;
    var activeEl = document.getElementById('cmpay-d-active');
    if (!name) { cmPayToast('El nombre es obligatorio', 'error'); return; }
    if (dtype !== 'free') {
        if (isNaN(value) || value < 0) { cmPayToast('Valor no válido', 'error'); return; }
        if (dtype === 'percent' && value > 100) { cmPayToast('Porcentaje no puede superar 100', 'error'); return; }
    }
    var scope_id = null, sibling_order = null;
    if (scope === 'player') { if (!cmPayDescPlayerSel) { cmPayToast('Selecciona un jugador', 'error'); return; } scope_id = cmPayDescPlayerSel.id; }
    else if (scope === 'team') { if (!team) { cmPayToast('Selecciona un equipo', 'error'); return; } scope_id = team; }
    else if (scope === 'sibling') { if (isNaN(sibling) || sibling < 2) { cmPayToast('Orden de hermano debe ser 2 o más', 'error'); return; } sibling_order = sibling; }
    if (vfrom && vuntil && vfrom > vuntil) { cmPayToast('La fecha "desde" no puede ser posterior a "hasta"', 'error'); return; }
    var payload = { club_id: clubId, concept_id: concept, name: name, discount_type: dtype, value: (dtype === 'free') ? 0 : value, scope: scope, scope_id: scope_id, sibling_order: sibling_order, valid_from: vfrom, valid_until: vuntil };
    try {
        if (cmPayDescuentoEditando) {
            payload.active = activeEl ? activeEl.checked : true;
            var u = await supabaseClient.from('cm_pay_discounts').update(payload).eq('id', cmPayDescuentoEditando.id);
            if (u.error) throw u.error;
            cmPayToast('Descuento actualizado', 'success');
        } else {
            payload.created_by = (cmState && cmState.miembro) ? cmState.miembro.id : null;
            var i = await supabaseClient.from('cm_pay_discounts').insert(payload);
            if (i.error) throw i.error;
            cmPayToast('Descuento creado', 'success');
        }
        cmPayCerrarModalDesc(); cmPayRenderTab('descuentos');
    } catch (e) { console.error(e); cmPayToast('Error: ' + (e.message || ''), 'error'); }
}

async function cmPayArchivarDescuento(id) {
    var d = cmPayDescuentos.find(function(x) { return x.id === id; });
    if (!d) return;
    if (!confirm('¿Archivar el descuento "' + d.name + '"?')) return;
    try { var u = await supabaseClient.from('cm_pay_discounts').update({ archived: true, archived_at: new Date().toISOString() }).eq('id', id); if (u.error) throw u.error; cmPayToast('Descuento archivado', 'success'); cmPayRenderTab('descuentos'); }
    catch (e) { console.error(e); cmPayToast('Error', 'error'); }
}

async function cmPayDesarchivarDescuento(id) {
    try { var u = await supabaseClient.from('cm_pay_discounts').update({ archived: false, archived_at: null }).eq('id', id); if (u.error) throw u.error; cmPayToast('Descuento restaurado', 'success'); cmPayRenderTab('descuentos'); }
    catch (e) { console.error(e); cmPayToast('Error', 'error'); }
}


// ============================================================
// PESTAÑA COBROS
// ============================================================
async function cmPayRenderCobros(container) {
    container.innerHTML = '<div class="cmpay-empty">Cargando cobros...</div>';
    await cmPayCargarCobrosData();
    cmPayPintarCobros(container);
}

async function cmPayCargarCobrosData() {
    try {
        var r = await Promise.all([
            supabaseClient.from('cm_pay_assignments').select('*').eq('club_id', clubId).order('created_at', { ascending: false }),
            supabaseClient.from('cm_pay_transactions').select('id, assignment_id, amount, paid_at, status').eq('club_id', clubId).eq('archived', false).eq('status', 'paid'),
            supabaseClient.from('cm_pay_concepts').select('id, name, type, amount, frequency').eq('club_id', clubId),
            supabaseClient.from('cm_pay_discounts').select('id, name, discount_type, value, scope, scope_id, sibling_order, concept_id, active, archived').eq('club_id', clubId),
            supabaseClient.from('club_teams').select('id, name, category').eq('club_id', clubId).eq('active', true).order('name'),
            supabaseClient.from('seasons').select('id, name, start_date, end_date').eq('club_id', clubId).eq('is_active', true)
        ]);
        cmPayAsignaciones = r[0].data || [];
        cmPayTransacciones = r[1].data || [];
        cmPayConceptos = r[2].data || cmPayConceptos;
        cmPayDescuentos = r[3].data || cmPayDescuentos;
        cmPayEquipos = r[4].data || cmPayEquipos;
        var seasons = r[5].data || [];
        var seasonIds = seasons.map(function(s) { return s.id; });
        var playerIds = [], seen = {};
        cmPayAsignaciones.forEach(function(a) { if (a.player_id && !seen[a.player_id]) { playerIds.push(a.player_id); seen[a.player_id] = 1; } });
        cmPayJugadoresMap = {};
        if (playerIds.length > 0) {
            if (seasonIds.length > 0) {
                var sps = await supabaseClient.from('season_players').select('player_id, team_id, players(id, name, position, photo_url), club_teams(id, name)').in('player_id', playerIds).in('season_id', seasonIds);
                (sps.data || []).forEach(function(sp) {
                    if (sp.players && !cmPayJugadoresMap[sp.player_id]) cmPayJugadoresMap[sp.player_id] = { id: sp.player_id, name: sp.players.name, photo_url: sp.players.photo_url, position: sp.players.position, team_id: sp.team_id, team_name: sp.club_teams ? sp.club_teams.name : null };
                });
            }
            var missing = playerIds.filter(function(id) { return !cmPayJugadoresMap[id]; });
            if (missing.length > 0) {
                var pp = await supabaseClient.from('players').select('id, name, position, photo_url').in('id', missing);
                (pp.data || []).forEach(function(p) { cmPayJugadoresMap[p.id] = { id: p.id, name: p.name, position: p.position, photo_url: p.photo_url, team_name: null }; });
            }
        }
        cmPayCalcularKpis();
    } catch (e) { console.error('[Pagos] cobros:', e); }
}

function cmPayCalcularKpis() {
    var hoy = new Date();
    var p = cmPayMesActivo.split('-').map(Number);
    var iniMes = new Date(p[0], p[1] - 1, 1).getTime();
    var finMes = new Date(p[0], p[1], 1).getTime();
    cmPayPaidByAsig = {};
    var cobradoMes = 0;
    cmPayTransacciones.forEach(function(t) {
        var amount = Number(t.amount) || 0;
        cmPayPaidByAsig[t.assignment_id] = (cmPayPaidByAsig[t.assignment_id] || 0) + amount;
        if (t.paid_at) { var ms = new Date(t.paid_at).getTime(); if (ms >= iniMes && ms < finMes) cobradoMes += amount; }
    });
    var pendiente = 0, morosidad = 0, jEnAsig = {}, jMoroso = {};
    cmPayAsignaciones.forEach(function(a) {
        if (a.archived || a.status === 'cancelled') return;
        jEnAsig[a.player_id] = 1;
        if (a.status === 'paid') return;
        var pagado = cmPayPaidByAsig[a.id] || 0;
        var rest = Math.max(0, Number(a.final_amount) - pagado);
        if (rest > 0) {
            pendiente += rest;
            if (a.period_end) {
                var endMs = new Date(a.period_end + 'T23:59:59').getTime();
                var dias = (hoy.getTime() - endMs) / (1000 * 60 * 60 * 24);
                if (dias > 30) { morosidad += rest; jMoroso[a.player_id] = 1; }
            }
        }
    });
    var totalJug = Object.keys(jEnAsig).length;
    cmPayKpis = { cobrado: cobradoMes, pendiente: pendiente, morosidad: morosidad, alDia: totalJug - Object.keys(jMoroso).length, totalJug: totalJug };
}

function cmPayMesLabel(mes) { var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']; var p = mes.split('-').map(Number); return meses[p[1] - 1] + ' ' + p[0]; }

function cmPayCambiarMes(delta) {
    var p = cmPayMesActivo.split('-').map(Number);
    var d = new Date(p[0], p[1] - 1 + delta, 1);
    cmPayMesActivo = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    cmPayRenderTab('cobros');
}

function cmPayPintarCobros(container) {
    var optsEquipo = '<option value="all">Todos los equipos</option>' + cmPayEquipos.map(function(e) { return '<option value="' + e.id + '"' + (cmPayCobFiltroEquipo === e.id ? ' selected' : '') + '>' + cmPayEscape(e.name) + '</option>'; }).join('') + '<option value="sin_equipo"' + (cmPayCobFiltroEquipo === 'sin_equipo' ? ' selected' : '') + '>Sin equipo asignado</option>';
    var optsConc = '<option value="all">Todos los conceptos</option>' + cmPayConceptos.filter(function(c) { return !c.archived; }).map(function(c) { return '<option value="' + c.id + '"' + (cmPayCobFiltroConcept === c.id ? ' selected' : '') + '>' + cmPayEscape(c.name) + '</option>'; }).join('');
    var optsStatus = '<option value="all">Todos los estados</option>' + CMPAY_STATUS.map(function(s) { return '<option value="' + s.key + '"' + (cmPayCobFiltroStatus === s.key ? ' selected' : '') + '>' + s.label + '</option>'; }).join('');

    var html = '<div class="cmpay-kpi-row">' +
        '<div class="cmpay-kpi success"><div class="lbl">Cobrado ' + cmPayMesLabel(cmPayMesActivo) + '</div><div class="val">' + cmPayFormatoEuro(cmPayKpis.cobrado) + '</div></div>' +
        '<div class="cmpay-kpi"><div class="lbl">Pendiente total</div><div class="val">' + cmPayFormatoEuro(cmPayKpis.pendiente) + '</div></div>' +
        '<div class="cmpay-kpi danger"><div class="lbl">Morosidad &gt;30 días</div><div class="val">' + cmPayFormatoEuro(cmPayKpis.morosidad) + '</div></div>' +
        '<div class="cmpay-kpi"><div class="lbl">Jugadores al día</div><div class="val">' + cmPayKpis.alDia + '<span style="font-size:12px;color:#64748b;font-weight:normal"> / ' + cmPayKpis.totalJug + '</span></div></div>' +
        '</div>' +
        '<div class="cmpay-toolbar"><div class="cmpay-toolbar-left">' +
            '<div class="cmpay-mes-nav"><button onclick="cmPayCambiarMes(-1)" title="Mes anterior">◀</button><span class="mes-txt">' + cmPayMesLabel(cmPayMesActivo) + '</span><button onclick="cmPayCambiarMes(1)" title="Mes siguiente">▶</button></div>' +
            '<select onchange="cmPayCobFiltroEquipo=this.value;cmPayRenderTab(\'cobros\')">' + optsEquipo + '</select>' +
            '<select onchange="cmPayCobFiltroConcept=this.value;cmPayRenderTab(\'cobros\')">' + optsConc + '</select>' +
            '<select onchange="cmPayCobFiltroStatus=this.value;cmPayRenderTab(\'cobros\')">' + optsStatus + '</select>' +
            '<input type="text" placeholder="Buscar jugador..." value="' + cmPayEscape(cmPayCobBusqueda) + '" oninput="cmPayCobBusqueda=this.value;cmPayRenderTab(\'cobros\')">' +
            '<label><input type="checkbox" ' + (cmPayCobMostrarArch ? 'checked' : '') + ' onchange="cmPayCobMostrarArch=this.checked;cmPayRenderTab(\'cobros\')"> Mostrar archivadas</label>' +
        '</div><div style="display:flex;gap:8px"><button class="cmpay-btn cmpay-btn-secondary" onclick="cmPayExportarCSV()">📊 Exportar CSV</button><button class="cmpay-btn cmpay-btn-primary" onclick="cmPayAbrirModalAsignar()">+ Asignar concepto</button></div></div>';

    var lista = cmPayAsignaciones.filter(function(a) {
        if (!cmPayCobMostrarArch && a.archived) return false;
        if (cmPayCobFiltroStatus !== 'all' && a.status !== cmPayCobFiltroStatus) return false;
        if (cmPayCobFiltroConcept !== 'all' && a.concept_id !== cmPayCobFiltroConcept) return false;
        if (cmPayCobFiltroEquipo !== 'all') {
            var j = cmPayJugadoresMap[a.player_id];
            if (cmPayCobFiltroEquipo === 'sin_equipo') { if (!j || j.team_id) return false; }
            else { if (!j || j.team_id !== cmPayCobFiltroEquipo) return false; }
        }
        if (cmPayCobBusqueda) { var j2 = cmPayJugadoresMap[a.player_id]; var nm = j2 ? (j2.name || '').toLowerCase() : ''; if (nm.indexOf(cmPayCobBusqueda.toLowerCase()) === -1) return false; }
        return true;
    });

    if (lista.length === 0) {
        if (cmPayAsignaciones.length === 0) html += '<div class="cmpay-table-wrap"><div class="cmpay-empty"><div style="font-size:36px;margin-bottom:10px;opacity:.5">💵</div>Aún no hay asignaciones. Usa el botón "+ Asignar concepto" para empezar.</div></div>';
        else html += '<div class="cmpay-table-wrap"><div class="cmpay-empty">No hay asignaciones con estos filtros.</div></div>';
        container.innerHTML = html; return;
    }
    html += '<div class="cmpay-table-wrap"><table class="cmpay-table"><thead><tr><th>Jugador</th><th>Concepto</th><th>Periodo</th><th class="num">Importe</th><th class="num">Pagado</th><th class="num">Pendiente</th><th>Estado</th><th></th></tr></thead><tbody>';
    lista.forEach(function(a) {
        var j = cmPayJugadoresMap[a.player_id] || { name: '(jugador no encontrado)' };
        var c = cmPayConceptos.find(function(x) { return x.id === a.concept_id; });
        var d = a.discount_id ? cmPayDescuentos.find(function(x) { return x.id === a.discount_id; }) : null;
        var pagado = cmPayPaidByAsig[a.id] || 0;
        var rest = Math.max(0, Number(a.final_amount) - pagado);
        var st = CMPAY_STATUS.find(function(s) { return s.key === a.status; }) || CMPAY_STATUS[0];
        var iniciales = (j.name || '?').split(' ').map(function(p) { return p[0]; }).join('').substring(0, 2).toUpperCase();
        var fotoHtml = j.photo_url ? '<img src="' + cmPayEscape(j.photo_url) + '" alt="">' : iniciales;
        html += '<tr><td><div class="cmpay-player-cell" style="cursor:pointer" onclick="cmPayAbrirFichaJugadorEco(\'' + a.player_id + '\')" title="Ver ficha económica"><div class="cmpay-player-photo">' + fotoHtml + '</div><div class="cmpay-player-info"><div class="nm" style="color:#60a5fa;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#1e3a5f">' + cmPayEscape(j.name) + '</div><div class="tm">' + (j.team_name ? cmPayEscape(j.team_name) : (j.position ? cmPayEscape(j.position) : '')) + '</div></div></div></td>' +
            '<td>' + (c ? cmPayEscape(c.name) : '<span class="muted">?</span>') + (d ? '<br><span class="muted" style="font-size:11px">Descuento: ' + cmPayEscape(d.name) + '</span>' : '') + '</td>' +
            '<td><span style="font-size:12px">' + (a.period_start ? cmPayFormatoFecha(a.period_start) : '?') + (a.period_end ? '<br>→ ' + cmPayFormatoFecha(a.period_end) : '<br><span class="muted">→ ∞</span>') + '</span></td>' +
            '<td class="num">' + cmPayFormatoEuro(a.final_amount) + '</td>' +
            '<td class="num">' + cmPayFormatoEuro(pagado) + '</td>' +
            '<td class="num"' + (rest > 0 ? ' style="color:#f59e0b;font-weight:600"' : '') + '>' + cmPayFormatoEuro(rest) + '</td>' +
            '<td><span class="cmpay-status-badge" style="background:' + st.bg + ';color:' + st.color + ';border:1px solid ' + st.color + '40">' + st.label + '</span></td>' +
            '<td><div class="cmpay-row-actions">' +
                (a.status !== 'paid' && a.status !== 'cancelled' ? '<button class="cmpay-btn cmpay-btn-ghost" style="color:#22c55e" onclick="cmPayAbrirModalPago(\'' + a.id + '\')">Registrar pago</button>' : '') +
                '<button class="cmpay-btn cmpay-btn-ghost" onclick="cmPayToast(\'Editar asignación — próximamente\', \'info\')">Editar</button>' +
            '</div></td></tr>';
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
}


// ============================================================
// MODAL ASIGNAR CONCEPTO
// ============================================================
async function cmPayAbrirModalAsignar() {
    cmPayAsigPlayerSel = null; cmPayAsigHermanos = []; cmPayAsigTeamPlayers = [];
    if (cmPayConceptos.length === 0 || cmPayDescuentos.length === 0) await cmPayCargarCobrosData();
    var conceptosActivos = cmPayConceptos.filter(function(c) { return !c.archived && c.active !== false; });
    if (conceptosActivos.length === 0) { cmPayToast('Primero crea al menos un concepto activo en la pestaña Conceptos.', 'error'); return; }
    if (cmPayClubPlayers.length === 0) await cmPayCargarClubPlayers();
    var optsConcept = '<option value="">— Selecciona un concepto —</option>' + conceptosActivos.map(function(c) { var fInfo = CMPAY_FREQS.find(function(f) { return f.key === c.frequency; }); return '<option value="' + c.id + '">' + cmPayEscape(c.name) + ' (' + cmPayFormatoEuro(c.amount) + ' · ' + (fInfo ? fInfo.label : c.frequency) + ')</option>'; }).join('');
    var optsTeam = '<option value="">— Selecciona equipo —</option>' + cmPayEquipos.map(function(e) { return '<option value="' + e.id + '">' + cmPayEscape(e.name) + (e.category ? ' (' + cmPayEscape(e.category) + ')' : '') + '</option>'; }).join('') + '<option value="sin_equipo">Sin equipo asignado</option>';
    var html = '<div class="cmpay-modal-overlay" id="cmpay-modal-asignar" onclick="if(event.target===this)cmPayCerrarModalAsignar()"><div class="cmpay-modal">' +
        '<div class="cmpay-modal-header"><h3>Asignar concepto</h3><button class="cmpay-modal-close" onclick="cmPayCerrarModalAsignar()">×</button></div>' +
        '<div class="cmpay-modal-body">' +
            '<div class="cmpay-form-group"><label>Concepto *</label><select id="cmpay-asig-concept" onchange="cmPayAsigOnConceptoChange()">' + optsConcept + '</select></div>' +
            '<div class="cmpay-form-group"><label>Destinatarios *</label><div class="cmpay-radio-group"><label class="active" id="cmpay-asig-rad-player" onclick="cmPayAsigOnDestChange(\'player\')"><input type="radio" name="cmpay-asig-dest" value="player" checked>👤 Jugador individual</label><label id="cmpay-asig-rad-team" onclick="cmPayAsigOnDestChange(\'team\')"><input type="radio" name="cmpay-asig-dest" value="team">👥 Equipo entero</label></div></div>' +
            '<div class="cmpay-form-group cmpay-ac" id="cmpay-asig-block-player"><label>Jugador *</label><input type="text" id="cmpay-asig-player-search" placeholder="Escribe el nombre del jugador..." oninput="cmPayAsigBuscarJugador()" autocomplete="off"><div class="cmpay-ac-results" id="cmpay-asig-ac-results"></div><div id="cmpay-asig-player-sel-wrap"></div><div id="cmpay-asig-hermanos-wrap"></div></div>' +
            '<div class="cmpay-form-group" id="cmpay-asig-block-team" style="display:none"><label>Equipo *</label><select id="cmpay-asig-team" onchange="cmPayAsigOnTeamChange()">' + optsTeam + '</select><div class="hint" id="cmpay-asig-team-info">Selecciona un equipo para ver cuántos jugadores recibirán la asignación.</div></div>' +
            '<div class="cmpay-form-row"><div class="cmpay-form-group"><label>Periodo desde *</label><input type="date" id="cmpay-asig-from" value=""></div><div class="cmpay-form-group"><label>Periodo hasta</label><input type="date" id="cmpay-asig-until" value=""><div class="hint">Vacío = indefinido</div></div></div>' +
            '<div class="cmpay-form-group"><label>Descuento (opcional)</label><select id="cmpay-asig-discount" onchange="cmPayAsigActualizarPreview()"><option value="">— Sin descuento —</option></select><div class="hint">Se filtra según el concepto seleccionado.</div></div>' +
            '<div class="cmpay-form-group"><label>Notas (opcional)</label><textarea id="cmpay-asig-notes" placeholder="Ej: matrícula fraccionada en 3 plazos"></textarea></div>' +
            '<div class="cmpay-preview" id="cmpay-asig-preview" style="display:none"><div class="lbl">Vista previa</div><div id="cmpay-asig-preview-body"></div></div>' +
        '</div>' +
        '<div class="cmpay-modal-footer"><button class="cmpay-btn cmpay-btn-secondary" onclick="cmPayCerrarModalAsignar()">Cancelar</button><button class="cmpay-btn cmpay-btn-primary" onclick="cmPayConfirmarAsignacion()">Crear asignaciones</button></div>' +
    '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(function() { var el = document.getElementById('cmpay-asig-concept'); if (el) el.focus(); }, 50);
}

function cmPayCerrarModalAsignar() { var m = document.getElementById('cmpay-modal-asignar'); if (m) m.remove(); cmPayAsigPlayerSel = null; cmPayAsigHermanos = []; cmPayAsigTeamPlayers = []; }

async function cmPayCargarClubPlayers() {
    try {
        var sRes = await supabaseClient.from('seasons').select('id').eq('club_id', clubId).eq('is_active', true);
        var seasonIds = (sRes.data || []).map(function(s) { return s.id; });
        if (seasonIds.length === 0) { cmPayClubPlayers = []; return; }
        var r = await supabaseClient.from('season_players').select('player_id, team_id, players(id, name, position), club_teams(id, name)').in('season_id', seasonIds);
        var seen = {};
        cmPayClubPlayers = [];
        (r.data || []).forEach(function(sp) {
            if (sp.players && !seen[sp.player_id]) {
                seen[sp.player_id] = 1;
                cmPayClubPlayers.push({ id: sp.player_id, name: sp.players.name, position: sp.players.position, team_id: sp.team_id, team_name: sp.club_teams ? sp.club_teams.name : null });
            }
        });
        console.log('[Pagos] Jugadores del club:', cmPayClubPlayers.length);
    } catch (e) { console.error('[Pagos] cargar club players:', e); }
}

function cmPayAsigOnConceptoChange() {
    var conceptId = document.getElementById('cmpay-asig-concept').value;
    var c = cmPayConceptos.find(function(x) { return x.id === conceptId; });
    if (!c) { cmPayAsigActualizarPreview(); return; }
    var iniInput = document.getElementById('cmpay-asig-from');
    var endInput = document.getElementById('cmpay-asig-until');
    var hoy = new Date();
    if (c.frequency === 'monthly') {
        var p = cmPayMesActivo.split('-').map(Number);
        iniInput.value = cmPayDateToStr(new Date(p[0], p[1] - 1, 1));
        endInput.value = cmPayDateToStr(new Date(p[0], p[1], 0));
    } else if (c.frequency === 'annual') {
        iniInput.value = cmPayDateToStr(new Date(hoy.getFullYear(), 8, 1));
        endInput.value = cmPayDateToStr(new Date(hoy.getFullYear() + 1, 5, 30));
    } else { iniInput.value = cmPayDateToStr(hoy); endInput.value = ''; }
    cmPayAsigActualizarDescuentos(c);
    cmPayAsigActualizarPreview();
}

function cmPayAsigActualizarDescuentos(concepto) {
    var sel = document.getElementById('cmpay-asig-discount');
    if (!sel) return;
    var compatibles = cmPayDescuentos.filter(function(d) { if (d.archived || d.active === false) return false; if (d.concept_id && d.concept_id !== concepto.id) return false; return true; });
    sel.innerHTML = '<option value="">— Sin descuento —</option>' + compatibles.map(function(d) {
        var dt = CMPAY_DTYPES.find(function(t) { return t.key === d.discount_type; }) || CMPAY_DTYPES[0];
        var valorTxt = (d.discount_type === 'free') ? 'Exención' : (cmPayFormatoNumero(d.value) + ' ' + dt.suffix);
        return '<option value="' + d.id + '">' + cmPayEscape(d.name) + ' (' + valorTxt + ')</option>';
    }).join('');
}

function cmPayAsigOnDestChange(tipo) {
    document.getElementById('cmpay-asig-rad-player').classList.toggle('active', tipo === 'player');
    document.getElementById('cmpay-asig-rad-team').classList.toggle('active', tipo === 'team');
    document.getElementById('cmpay-asig-block-player').style.display = (tipo === 'player') ? '' : 'none';
    document.getElementById('cmpay-asig-block-team').style.display = (tipo === 'team') ? '' : 'none';
    cmPayAsigActualizarPreview();
}

function cmPayAsigBuscarJugador() {
    var input = document.getElementById('cmpay-asig-player-search');
    var resBox = document.getElementById('cmpay-asig-ac-results');
    if (!input || !resBox) return;
    var term = input.value.trim().toLowerCase();
    if (term.length < 2) { resBox.classList.remove('show'); return; }
    var results = cmPayClubPlayers.filter(function(p) { return (p.name || '').toLowerCase().indexOf(term) !== -1; }).slice(0, 20);
    if (results.length === 0) resBox.innerHTML = '<div class="cmpay-ac-empty">Sin resultados</div>';
    else resBox.innerHTML = results.map(function(p) { return '<div class="cmpay-ac-item" onclick=\'cmPayAsigSelectJugador(' + JSON.stringify(p) + ')\'><strong>' + cmPayEscape(p.name) + '</strong>' + (p.team_name ? ' <span class="muted" style="font-size:11px">· ' + cmPayEscape(p.team_name) + '</span>' : '') + '</div>'; }).join('');
    resBox.classList.add('show');
}

function cmPayAsigSelectJugador(p) {
    cmPayAsigPlayerSel = { id: p.id, name: p.name };
    var input = document.getElementById('cmpay-asig-player-search');
    var resBox = document.getElementById('cmpay-asig-ac-results');
    var selWrap = document.getElementById('cmpay-asig-player-sel-wrap');
    if (input) input.value = '';
    if (resBox) { resBox.classList.remove('show'); resBox.innerHTML = ''; }
    if (selWrap) selWrap.innerHTML = '<div class="cmpay-ac-selected">✓ Seleccionado: <strong>' + cmPayEscape(p.name) + '</strong>' + (p.team_name ? ' <span style="color:#94a3b8">· ' + cmPayEscape(p.team_name) + '</span>' : '') + '<button type="button" class="cmpay-ac-clear" onclick="cmPayAsigQuitarJugador()">Quitar</button></div>';
    cmPayAsigHermanos = cmPayDetectarHermanos(p.name, p.id);
    cmPayAsigPintarHermanos();
    cmPayAsigActualizarPreview();
}

function cmPayAsigQuitarJugador() {
    cmPayAsigPlayerSel = null; cmPayAsigHermanos = [];
    var selWrap = document.getElementById('cmpay-asig-player-sel-wrap');
    var hWrap = document.getElementById('cmpay-asig-hermanos-wrap');
    if (selWrap) selWrap.innerHTML = '';
    if (hWrap) hWrap.innerHTML = '';
    cmPayAsigActualizarPreview();
}

function cmPayDetectarHermanos(playerName, playerId) {
    if (!playerName || cmPayClubPlayers.length === 0) return [];
    var words = playerName.trim().split(/\s+/);
    if (words.length < 2) return [];
    var apellidos = words.slice(-2).map(function(w) { return w.toLowerCase(); }).filter(function(w) { return w.length > 2; });
    if (apellidos.length === 0) return [];
    return cmPayClubPlayers.filter(function(p) {
        if (p.id === playerId) return false;
        var pWords = (p.name || '').trim().split(/\s+/).map(function(w) { return w.toLowerCase(); });
        return apellidos.some(function(a) { return pWords.indexOf(a) !== -1; });
    });
}

function cmPayAsigPintarHermanos() {
    var wrap = document.getElementById('cmpay-asig-hermanos-wrap');
    if (!wrap) return;
    if (cmPayAsigHermanos.length === 0) { wrap.innerHTML = ''; return; }
    var siblings = cmPayDescuentos.filter(function(d) { return !d.archived && d.active !== false && d.scope === 'sibling'; }).sort(function(a, b) { return (a.sibling_order || 0) - (b.sibling_order || 0); });
    var nombres = cmPayAsigHermanos.map(function(h) { return cmPayEscape(h.name); }).join(', ');
    var optsSibling = siblings.map(function(d) {
        var dt = CMPAY_DTYPES.find(function(t) { return t.key === d.discount_type; }) || CMPAY_DTYPES[0];
        var valorTxt = (d.discount_type === 'free') ? 'Exención' : (cmPayFormatoNumero(d.value) + ' ' + dt.suffix);
        return '<option value="' + d.id + '">' + cmPayEscape(d.name) + ' · hermano nº ' + (d.sibling_order || '?') + ' · ' + valorTxt + '</option>';
    }).join('');
    wrap.innerHTML = '<div class="cmpay-hermanos-banner"><div class="tit">⚠️ Posibles hermanos detectados</div><div class="desc">Coincidencia de apellidos con: <strong>' + nombres + '</strong>. Si es hermano, aplica un descuento:</div>' +
        (siblings.length > 0 ? '<select id="cmpay-asig-hermano-sel"><option value="">— Elige descuento de hermano —</option>' + optsSibling + '</select><button type="button" class="cmpay-btn cmpay-btn-success" style="margin-top:6px" onclick="cmPayAsigAplicarHermano()">Aplicar descuento de hermano</button>' : '<div class="desc" style="margin-top:8px"><em>No tienes descuentos de hermanos creados.</em></div>') + '</div>';
}

function cmPayAsigAplicarHermano() {
    var sel = document.getElementById('cmpay-asig-hermano-sel');
    if (!sel || !sel.value) { cmPayToast('Elige primero un descuento de hermano', 'error'); return; }
    var discountSel = document.getElementById('cmpay-asig-discount');
    if (discountSel) { discountSel.value = sel.value; cmPayAsigActualizarPreview(); cmPayToast('Descuento de hermano aplicado', 'success'); }
}

async function cmPayAsigOnTeamChange() {
    var teamId = document.getElementById('cmpay-asig-team').value;
    var info = document.getElementById('cmpay-asig-team-info');
    cmPayAsigTeamPlayers = [];
    if (!teamId) { if (info) info.textContent = 'Selecciona un equipo para ver cuántos jugadores recibirán la asignación.'; cmPayAsigActualizarPreview(); return; }
    if (info) info.textContent = 'Cargando jugadores...';
    try {
        var sRes = await supabaseClient.from('seasons').select('id').eq('club_id', clubId).eq('is_active', true);
        var seasonIds = (sRes.data || []).map(function(s) { return s.id; });
        if (seasonIds.length === 0) { if (info) info.textContent = 'No hay temporadas activas en este club.'; cmPayAsigActualizarPreview(); return; }
        var q = supabaseClient.from('season_players').select('player_id, players(id, name)').in('season_id', seasonIds);
        if (teamId === 'sin_equipo') q = q.is('team_id', null);
        else q = q.eq('team_id', teamId);
        var r = await q;
        var seen = {};
        (r.data || []).forEach(function(sp) { if (sp.players && !seen[sp.player_id]) { seen[sp.player_id] = 1; cmPayAsigTeamPlayers.push({ id: sp.player_id, name: sp.players.name }); } });
        if (info) info.textContent = cmPayAsigTeamPlayers.length + ' jugadores recibirán la asignación.';
    } catch (e) { console.error(e); if (info) info.textContent = 'Error al cargar jugadores'; }
    cmPayAsigActualizarPreview();
}

function cmPayCalcFinalAmount(original, discountId) {
    var orig = Number(original) || 0;
    if (!discountId) return orig;
    var d = cmPayDescuentos.find(function(x) { return x.id === discountId; });
    if (!d) return orig;
    if (d.discount_type === 'free') return 0;
    if (d.discount_type === 'fixed') return Math.max(0, orig - (Number(d.value) || 0));
    if (d.discount_type === 'percent') return Math.round(orig * (100 - (Number(d.value) || 0)) / 100 * 100) / 100;
    return orig;
}

function cmPayAsigActualizarPreview() {
    var prev = document.getElementById('cmpay-asig-preview');
    var body = document.getElementById('cmpay-asig-preview-body');
    if (!prev || !body) return;
    var conceptId = document.getElementById('cmpay-asig-concept').value;
    var c = cmPayConceptos.find(function(x) { return x.id === conceptId; });
    if (!c) { prev.style.display = 'none'; return; }
    var destType = document.querySelector('input[name=cmpay-asig-dest]:checked').value;
    var discountId = document.getElementById('cmpay-asig-discount').value;
    var nDest = (destType === 'player') ? (cmPayAsigPlayerSel ? 1 : 0) : cmPayAsigTeamPlayers.length;
    if (nDest === 0) { prev.style.display = 'none'; return; }
    var unit = cmPayCalcFinalAmount(c.amount, discountId);
    var total = unit * nDest;
    body.innerHTML =
        '<div class="row"><span>Concepto</span><span class="v">' + cmPayEscape(c.name) + '</span></div>' +
        '<div class="row"><span>Importe base</span><span class="v">' + cmPayFormatoEuro(c.amount) + '</span></div>' +
        (discountId ? '<div class="row"><span>Descuento aplicado</span><span class="v" style="color:#22c55e">' + cmPayEscape((cmPayDescuentos.find(function(x) { return x.id === discountId; }) || {}).name || '') + '</span></div>' : '') +
        '<div class="row"><span>Importe por asignación</span><span class="v">' + cmPayFormatoEuro(unit) + '</span></div>' +
        '<div class="row"><span>Asignaciones a crear</span><span class="v">' + nDest + '</span></div>' +
        '<div class="row total"><span>Total a cobrar</span><span class="v">' + cmPayFormatoEuro(total) + '</span></div>';
    prev.style.display = 'block';
}

async function cmPayConfirmarAsignacion() {
    var conceptId = document.getElementById('cmpay-asig-concept').value;
    var c = cmPayConceptos.find(function(x) { return x.id === conceptId; });
    if (!c) { cmPayToast('Selecciona un concepto', 'error'); return; }
    var destType = document.querySelector('input[name=cmpay-asig-dest]:checked').value;
    var discountId = document.getElementById('cmpay-asig-discount').value || null;
    var from = document.getElementById('cmpay-asig-from').value;
    var until = document.getElementById('cmpay-asig-until').value || null;
    var notes = document.getElementById('cmpay-asig-notes').value.trim() || null;
    if (!from) { cmPayToast('Fecha de inicio obligatoria', 'error'); return; }
    if (until && until < from) { cmPayToast('Fecha "hasta" no puede ser anterior a "desde"', 'error'); return; }
    var playerIds = [];
    if (destType === 'player') {
        if (!cmPayAsigPlayerSel) { cmPayToast('Selecciona un jugador', 'error'); return; }
        playerIds = [cmPayAsigPlayerSel.id];
    } else {
        if (cmPayAsigTeamPlayers.length === 0) { cmPayToast('El equipo seleccionado no tiene jugadores', 'error'); return; }
        playerIds = cmPayAsigTeamPlayers.map(function(p) { return p.id; });
    }
    var assignedBy = (cmState && cmState.miembro) ? cmState.miembro.id : null;
    var rows = playerIds.map(function(pid) { return { club_id: clubId, concept_id: conceptId, player_id: pid, discount_id: discountId, original_amount: c.amount, status: 'active', period_start: from, period_end: until, notes: notes, assigned_by: assignedBy }; });
    try {
        var ins = await supabaseClient.from('cm_pay_assignments').insert(rows);
        if (ins.error) throw ins.error;
        cmPayToast(rows.length + ' asignación' + (rows.length > 1 ? 'es creadas' : ' creada'), 'success');
        cmPayCerrarModalAsignar();
        cmPayRenderTab('cobros');
    } catch (e) { console.error('[Pagos]', e); cmPayToast('Error al crear: ' + (e.message || ''), 'error'); }
}


// ============================================================
// MODAL: REGISTRAR PAGO (P.1.4)
// ============================================================
function cmPayAbrirModalPago(assignmentId) {
    var a = cmPayAsignaciones.find(function(x) { return x.id === assignmentId; });
    if (!a) { cmPayToast('Asignación no encontrada', 'error'); return; }
    cmPayPagoAsigActiva = a;
    var c = cmPayConceptos.find(function(x) { return x.id === a.concept_id; });
    var j = cmPayJugadoresMap[a.player_id] || { name: '(jugador no encontrado)' };
    var pagado = cmPayPaidByAsig[a.id] || 0;
    var pendiente = Math.max(0, Number(a.final_amount) - pagado);
    var hoy = cmPayDateToStr(new Date());

    var methodsHtml = CMPAY_METHODS.map(function(m, i) {
        return '<label class="' + (i === 0 ? 'active' : '') + '" id="cmpay-pago-met-' + m.key + '" onclick="cmPayPagoSetMethod(\'' + m.key + '\')"><input type="radio" name="cmpay-pago-method" value="' + m.key + '"' + (i === 0 ? ' checked' : '') + '>' + m.icon + ' ' + m.label + '</label>';
    }).join('');

    var html = '<div class="cmpay-modal-overlay" id="cmpay-modal-pago" onclick="if(event.target===this)cmPayCerrarModalPago()"><div class="cmpay-modal">' +
        '<div class="cmpay-modal-header"><h3>Registrar pago</h3><button class="cmpay-modal-close" onclick="cmPayCerrarModalPago()">×</button></div>' +
        '<div class="cmpay-modal-body">' +
            // Info box
            '<div class="cmpay-pago-info">' +
                '<div class="row"><span class="k">Jugador</span><span class="v">' + cmPayEscape(j.name) + '</span></div>' +
                '<div class="row"><span class="k">Concepto</span><span class="v">' + (c ? cmPayEscape(c.name) : '?') + '</span></div>' +
                '<div class="row"><span class="k">Importe total</span><span class="v">' + cmPayFormatoEuro(a.final_amount) + '</span></div>' +
                '<div class="row"><span class="k">Ya pagado</span><span class="v">' + cmPayFormatoEuro(pagado) + '</span></div>' +
                '<div class="row"><span class="k">Pendiente</span><span class="v pendiente">' + cmPayFormatoEuro(pendiente) + '</span></div>' +
            '</div>' +

            // Datos del pago
            '<div class="cmpay-form-group"><label>Importe del pago * (€)</label><input type="number" id="cmpay-pago-amount" step="0.01" min="0.01" max="' + pendiente + '" value="' + pendiente.toFixed(2) + '"><div class="hint">Si es parcial, edita el importe</div></div>' +
            '<div class="cmpay-form-group"><label>Método de pago *</label><div class="cmpay-radio-group">' + methodsHtml + '</div></div>' +
            '<div class="cmpay-form-row">' +
                '<div class="cmpay-form-group"><label>Fecha del pago *</label><input type="date" id="cmpay-pago-fecha" value="' + hoy + '"></div>' +
                '<div class="cmpay-form-group"><label>Referencia (opcional)</label><input type="text" id="cmpay-pago-ref" placeholder="Nº op, ID Bizum..."></div>' +
            '</div>' +
            '<div class="cmpay-form-row">' +
                '<div class="cmpay-form-group"><label>Periodo cobrado desde</label><input type="date" id="cmpay-pago-pini" value="' + (a.period_start || '') + '"></div>' +
                '<div class="cmpay-form-group"><label>Periodo cobrado hasta</label><input type="date" id="cmpay-pago-pfin" value="' + (a.period_end || '') + '"></div>' +
            '</div>' +
            '<div class="cmpay-form-group"><label>Notas (opcional)</label><textarea id="cmpay-pago-notes" placeholder="Observaciones..."></textarea></div>' +

            // Sección recibo
            '<div class="cmpay-pago-section">' +
                '<div class="sec-title">📄 Recibo</div>' +
                '<div class="cmpay-form-group"><label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="cmpay-pago-recibo" checked onchange="cmPayPagoToggleRecibo()"> Generar recibo PDF al guardar</label></div>' +
                '<div id="cmpay-pago-recibo-fields">' +
                    '<div class="cmpay-form-row">' +
                        '<div class="cmpay-form-group"><label>Recibo a nombre de *</label><input type="text" id="cmpay-pago-payer" value="' + cmPayEscape(j.name) + '"><div class="hint">Edita si emites a nombre del tutor</div></div>' +
                        '<div class="cmpay-form-group"><label>DNI / Documento (opcional)</label><input type="text" id="cmpay-pago-doc" placeholder=""></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="cmpay-modal-footer"><button class="cmpay-btn cmpay-btn-secondary" onclick="cmPayCerrarModalPago()">Cancelar</button><button class="cmpay-btn cmpay-btn-success" onclick="cmPayGuardarPago()">💵 Registrar pago</button></div>' +
    '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(function() { var el = document.getElementById('cmpay-pago-amount'); if (el) { el.focus(); el.select(); } }, 50);
}

function cmPayCerrarModalPago() { var m = document.getElementById('cmpay-modal-pago'); if (m) m.remove(); cmPayPagoAsigActiva = null; }

function cmPayPagoSetMethod(key) {
    CMPAY_METHODS.forEach(function(m) { var el = document.getElementById('cmpay-pago-met-' + m.key); if (el) el.classList.toggle('active', m.key === key); });
    var rad = document.querySelector('input[name=cmpay-pago-method][value="' + key + '"]'); if (rad) rad.checked = true;
}

function cmPayPagoToggleRecibo() {
    var cb = document.getElementById('cmpay-pago-recibo');
    var fields = document.getElementById('cmpay-pago-recibo-fields');
    if (fields) fields.style.display = cb.checked ? '' : 'none';
}

async function cmPayGuardarPago() {
    if (!cmPayPagoAsigActiva) { cmPayToast('Asignación no encontrada', 'error'); return; }
    var a = cmPayPagoAsigActiva;
    var amount = parseFloat(document.getElementById('cmpay-pago-amount').value);
    var method = document.querySelector('input[name=cmpay-pago-method]:checked').value;
    var fecha = document.getElementById('cmpay-pago-fecha').value;
    var ref = document.getElementById('cmpay-pago-ref').value.trim() || null;
    var pini = document.getElementById('cmpay-pago-pini').value || null;
    var pfin = document.getElementById('cmpay-pago-pfin').value || null;
    var notes = document.getElementById('cmpay-pago-notes').value.trim() || null;
    var genRecibo = document.getElementById('cmpay-pago-recibo').checked;
    var payerName = document.getElementById('cmpay-pago-payer').value.trim();
    var payerDoc = document.getElementById('cmpay-pago-doc').value.trim() || null;

    if (isNaN(amount) || amount <= 0) { cmPayToast('Importe no válido', 'error'); return; }
    if (!fecha) { cmPayToast('Fecha del pago obligatoria', 'error'); return; }
    if (genRecibo && !payerName) { cmPayToast('Indica el nombre del pagador para el recibo', 'error'); return; }

    // Construir paid_at como timestamptz en hora local (mediodía para evitar timezone shifts)
    var paidAt = new Date(fecha + 'T12:00:00').toISOString();

    var txPayload = {
        club_id: clubId,
        assignment_id: a.id,
        player_id: a.player_id,
        amount: amount,
        currency: 'EUR',
        method: method,
        status: 'paid',
        manual_reference: ref,
        registered_by: (cmState && cmState.miembro) ? cmState.miembro.id : null,
        billing_period_start: pini,
        billing_period_end: pfin,
        paid_at: paidAt
    };

    try {
        // 1. INSERT transaction (trigger recalcula assignment.status)
        var txIns = await supabaseClient.from('cm_pay_transactions').insert(txPayload).select().single();
        if (txIns.error) throw txIns.error;
        var transactionId = txIns.data.id;

        // 2. Si se pidió recibo, generarlo
        var invoiceNumber = null;
        if (genRecibo) {
            try {
                var rpc = await supabaseClient.rpc('cm_pay_next_invoice_number', { p_club_id: clubId });
                if (rpc.error) throw rpc.error;
                invoiceNumber = rpc.data;
                var c = cmPayConceptos.find(function(x) { return x.id === a.concept_id; });
                var concepto_desc = (c ? c.name : 'Concepto');
                if (pini || pfin) concepto_desc += ' (' + (pini ? cmPayFormatoFecha(pini) : '') + (pfin ? ' a ' + cmPayFormatoFecha(pfin) : '') + ')';
                var invPayload = {
                    club_id: clubId,
                    assignment_id: a.id,
                    transaction_id: transactionId,
                    player_id: a.player_id,
                    invoice_number: invoiceNumber,
                    invoice_date: fecha,
                    club_name: cmPayConfigClub ? (cmPayConfigClub.legal_name || '') : '',
                    club_cif:  cmPayConfigClub ? (cmPayConfigClub.tax_id || '') : '',
                    club_address: cmPayConfigClub ? (cmPayConfigClub.fiscal_address || '') : '',
                    payer_name: payerName,
                    payer_document: payerDoc,
                    amount: amount,
                    description: concepto_desc
                };
                var invIns = await supabaseClient.from('cm_pay_invoices').insert(invPayload).select().single();
                if (invIns.error) throw invIns.error;

                // Refrescar config local (next_number ha subido)
                var cfgRes = await supabaseClient.from('cm_pay_club_config').select('*').eq('club_id', clubId).single();
                if (cfgRes.data) cmPayConfigClub = cfgRes.data;

                // Generar PDF
                cmPayGenerarReciboPDF({
                    invoice_number: invoiceNumber,
                    invoice_date: fecha,
                    club: cmPayConfigClub || {},
                    payer_name: payerName,
                    payer_document: payerDoc,
                    concept_name: c ? c.name : 'Concepto',
                    period_str: (pini || pfin) ? ('Periodo: ' + (pini ? cmPayFormatoFecha(pini) : '') + (pfin ? ' a ' + cmPayFormatoFecha(pfin) : '')) : '',
                    amount: amount,
                    method: method,
                    reference: ref,
                    paid_at: fecha,
                    legal_text: cmPayConfigClub ? (cmPayConfigClub.receipt_legal_text || '') : ''
                });

                cmPayToast('Pago registrado. Recibo ' + invoiceNumber + ' generado.', 'success');
            } catch (eRec) {
                console.error('[Pagos] Error generando recibo:', eRec);
                cmPayToast('Pago registrado, pero error al generar recibo: ' + (eRec.message || ''), 'error');
            }
        } else {
            cmPayToast('Pago registrado', 'success');
        }

        cmPayCerrarModalPago();
        cmPayRenderTab('cobros');
    } catch (e) {
        console.error('[Pagos] guardar pago:', e);
        cmPayToast('Error al registrar pago: ' + (e.message || ''), 'error');
    }
}


// ============================================================
// GENERAR RECIBO PDF (jsPDF, sin emoji)
// ============================================================
function cmPayGenerarReciboPDF(d) {
    if (!window.jspdf || !window.jspdf.jsPDF) { cmPayToast('jsPDF no está cargado en la página', 'error'); return; }
    var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    var W = 210, H = 297, M = 20;
    var y = M;

    // Header club (izquierda)
    pdf.setFontSize(18); pdf.setFont(undefined, 'bold'); pdf.setTextColor(30, 41, 59);
    pdf.text(d.club.legal_name || 'Club', M, y);
    y += 7;
    pdf.setFontSize(10); pdf.setFont(undefined, 'normal'); pdf.setTextColor(80, 80, 80);
    if (d.club.tax_id) { pdf.text('CIF/NIF: ' + d.club.tax_id, M, y); y += 5; }
    if (d.club.fiscal_address) {
        var addrLines = pdf.splitTextToSize(d.club.fiscal_address, 90);
        pdf.text(addrLines, M, y); y += 5 * addrLines.length;
    }

    // Recibo nº (derecha)
    pdf.setFontSize(14); pdf.setFont(undefined, 'bold'); pdf.setTextColor(30, 41, 59);
    pdf.text('RECIBO ' + d.invoice_number, W - M, M + 7, { align: 'right' });
    pdf.setFontSize(10); pdf.setFont(undefined, 'normal'); pdf.setTextColor(80, 80, 80);
    pdf.text('Fecha: ' + cmPayFormatoFecha(d.invoice_date), W - M, M + 14, { align: 'right' });

    y = Math.max(y + 8, M + 35);
    pdf.setDrawColor(220, 220, 220); pdf.line(M, y, W - M, y);
    y += 10;

    // Destinatario
    pdf.setFontSize(9); pdf.setTextColor(120, 120, 120);
    pdf.text('A NOMBRE DE', M, y); y += 6;
    pdf.setFontSize(12); pdf.setFont(undefined, 'bold'); pdf.setTextColor(30, 41, 59);
    pdf.text(d.payer_name, M, y); y += 6;
    if (d.payer_document) {
        pdf.setFontSize(10); pdf.setFont(undefined, 'normal'); pdf.setTextColor(80, 80, 80);
        pdf.text('Doc: ' + d.payer_document, M, y); y += 6;
    }
    y += 6;

    // Tabla concepto + importe
    pdf.setFillColor(240, 240, 245); pdf.rect(M, y, W - 2 * M, 9, 'F');
    pdf.setFontSize(10); pdf.setFont(undefined, 'bold'); pdf.setTextColor(80, 80, 80);
    pdf.text('CONCEPTO', M + 3, y + 6);
    pdf.text('IMPORTE', W - M - 3, y + 6, { align: 'right' });
    y += 9;

    pdf.setFontSize(11); pdf.setFont(undefined, 'normal'); pdf.setTextColor(30, 41, 59);
    pdf.text(d.concept_name, M + 3, y + 6);
    pdf.text(cmPayFormatoEuro(d.amount), W - M - 3, y + 6, { align: 'right' });
    y += 8;
    if (d.period_str) {
        pdf.setFontSize(9); pdf.setTextColor(120, 120, 120);
        pdf.text(d.period_str, M + 3, y + 3);
        y += 5;
    }
    y += 3;
    pdf.setDrawColor(220, 220, 220); pdf.line(M, y, W - M, y);
    y += 8;

    // Total
    pdf.setFontSize(13); pdf.setFont(undefined, 'bold'); pdf.setTextColor(30, 41, 59);
    pdf.text('TOTAL', M, y);
    pdf.text(cmPayFormatoEuro(d.amount), W - M - 3, y, { align: 'right' });
    y += 14;

    // Método y referencia
    pdf.setFontSize(10); pdf.setFont(undefined, 'normal'); pdf.setTextColor(80, 80, 80);
    var methodInfo = CMPAY_METHODS.find(function(m) { return m.key === d.method; });
    pdf.text('Método de pago: ' + (methodInfo ? methodInfo.label : d.method), M, y); y += 5;
    if (d.reference) { pdf.text('Referencia: ' + d.reference, M, y); y += 5; }
    pdf.text('Fecha del pago: ' + cmPayFormatoFecha(d.paid_at), M, y); y += 8;

    // Footer legal
    var footerY = H - 30;
    pdf.setDrawColor(220, 220, 220); pdf.line(M, footerY, W - M, footerY);
    pdf.setFontSize(9); pdf.setTextColor(120, 120, 120); pdf.setFont(undefined, 'italic');
    var legalLines = pdf.splitTextToSize(d.legal_text || 'Documento sin validez fiscal. Justificante de pago.', W - 2 * M);
    pdf.text(legalLines, M, footerY + 6);

    pdf.save(d.invoice_number + '.pdf');
}


// ============================================================
// RESTO PESTAÑAS
// ============================================================
function cmPayRenderLiquidacion(container) {
    container.innerHTML = cmPayPlaceholder({ icon: '🏦', titulo: 'Liquidación', descripcion: 'Stripe Connect.', contenido: ['Importe a liquidar', 'Desglose comisiones', 'Próximo ingreso', 'Histórico'], fase: 'P.2.4' });
}

function cmPayRenderConfig(container) {
    if (!cmPayConfigClub) { container.innerHTML = '<div class="cmpay-placeholder"><h3>Configuración no disponible</h3></div>'; return; }
    var cfg = cmPayConfigClub;
    container.innerHTML =
        '<div class="cmpay-toolbar"><div class="cmpay-toolbar-left"></div><button class="cmpay-btn cmpay-btn-primary" onclick="cmPayAbrirModalConfig()">✏️ Editar configuración</button></div>' +
        '<div class="cmpay-config-card"><h4>Datos fiscales</h4>' +
            '<div class="kv"><span class="k">Razón social</span><span class="v">' + cmPayEscape(cfg.legal_name || '— por definir —') + '</span></div>' +
            '<div class="kv"><span class="k">CIF / NIF</span><span class="v">' + cmPayEscape(cfg.tax_id || '— por definir —') + '</span></div>' +
            '<div class="kv"><span class="k">Dirección fiscal</span><span class="v">' + cmPayEscape(cfg.fiscal_address || '— por definir —') + '</span></div>' +
        '</div>' +
        '<div class="cmpay-config-card"><h4>Numeración y año fiscal</h4>' +
            '<div class="kv"><span class="k">Próximo recibo</span><span class="v">' + cfg.receipt_prefix + '-' + cfg.receipt_year + '-' + String(cfg.receipt_next_number).padStart(5, '0') + '</span></div>' +
            '<div class="kv"><span class="k">Inicio año fiscal</span><span class="v">' + cfg.fiscal_year_start + '</span></div>' +
            '<div class="kv"><span class="k">Moneda</span><span class="v">' + cfg.default_currency + '</span></div>' +
        '</div>' +
        '<div class="cmpay-config-card"><h4>Texto legal del recibo</h4>' +
            '<div style="color:#94a3b8;font-size:13px;font-style:italic;padding:6px 0">"' + cmPayEscape(cfg.receipt_legal_text || '') + '"</div>' +
        '</div>';
}


// ============================================================
// MODAL: EDITAR CONFIGURACIÓN (P.1.5)
// ============================================================
function cmPayAbrirModalConfig() {
    var cfg = cmPayConfigClub || {};
    var fyParts = (cfg.fiscal_year_start || '09-01').split('-');
    var fyMonth = parseInt(fyParts[0], 10) || 9;
    var fyDay = parseInt(fyParts[1], 10) || 1;
    var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    var optsMes = meses.map(function(name, i) { return '<option value="' + (i + 1) + '"' + (fyMonth === i + 1 ? ' selected' : '') + '>' + name + '</option>'; }).join('');
    var optsDia = '';
    for (var d = 1; d <= 31; d++) optsDia += '<option value="' + d + '"' + (fyDay === d ? ' selected' : '') + '>' + d + '</option>';

    var html = '<div class="cmpay-modal-overlay" id="cmpay-modal-config" onclick="if(event.target===this)cmPayCerrarModalConfig()"><div class="cmpay-modal">' +
        '<div class="cmpay-modal-header"><h3>Editar configuración del módulo</h3><button class="cmpay-modal-close" onclick="cmPayCerrarModalConfig()">×</button></div>' +
        '<div class="cmpay-modal-body">' +
            '<div class="cmpay-form-group"><label>Razón social del club</label><input type="text" id="cmpay-cfg-name" value="' + cmPayEscape(cfg.legal_name || '') + '" placeholder="Ej: Club Deportivo Astorga"></div>' +
            '<div class="cmpay-form-group"><label>CIF / NIF</label><input type="text" id="cmpay-cfg-tax" value="' + cmPayEscape(cfg.tax_id || '') + '" placeholder="Ej: G24XXXXXX"></div>' +
            '<div class="cmpay-form-group"><label>Dirección fiscal</label><textarea id="cmpay-cfg-addr" placeholder="Calle, número, CP, ciudad, provincia">' + cmPayEscape(cfg.fiscal_address || '') + '</textarea></div>' +
            '<div class="cmpay-form-row"><div class="cmpay-form-group"><label>Inicio año fiscal — Mes</label><select id="cmpay-cfg-fym">' + optsMes + '</select></div><div class="cmpay-form-group"><label>Día</label><select id="cmpay-cfg-fyd">' + optsDia + '</select></div></div>' +
            '<div class="cmpay-form-group"><label>Prefijo de los recibos</label><input type="text" id="cmpay-cfg-prefix" maxlength="5" value="' + cmPayEscape(cfg.receipt_prefix || 'R') + '"><div class="hint">Ej: R, REC, FAC. Los recibos serán "X-2026-00001"</div></div>' +
            '<div class="cmpay-form-group"><label>Texto legal del recibo</label><textarea id="cmpay-cfg-legal" rows="3">' + cmPayEscape(cfg.receipt_legal_text || 'Documento sin validez fiscal. Justificante de pago.') + '</textarea><div class="hint">Aparecerá al pie de cada recibo PDF</div></div>' +
        '</div>' +
        '<div class="cmpay-modal-footer"><button class="cmpay-btn cmpay-btn-secondary" onclick="cmPayCerrarModalConfig()">Cancelar</button><button class="cmpay-btn cmpay-btn-primary" onclick="cmPayGuardarConfig()">Guardar configuración</button></div>' +
    '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    setTimeout(function() { var el = document.getElementById('cmpay-cfg-name'); if (el) el.focus(); }, 50);
}

function cmPayCerrarModalConfig() { var m = document.getElementById('cmpay-modal-config'); if (m) m.remove(); }

async function cmPayGuardarConfig() {
    if (!cmPayConfigClub) return;
    var legalName = document.getElementById('cmpay-cfg-name').value.trim() || null;
    var taxId = document.getElementById('cmpay-cfg-tax').value.trim() || null;
    var addr = document.getElementById('cmpay-cfg-addr').value.trim() || null;
    var fyMonth = parseInt(document.getElementById('cmpay-cfg-fym').value, 10);
    var fyDay = parseInt(document.getElementById('cmpay-cfg-fyd').value, 10);
    var prefix = (document.getElementById('cmpay-cfg-prefix').value.trim() || 'R').toUpperCase();
    var legalText = document.getElementById('cmpay-cfg-legal').value.trim() || 'Documento sin validez fiscal. Justificante de pago.';
    var fyStart = String(fyMonth).padStart(2, '0') + '-' + String(fyDay).padStart(2, '0');
    var payload = { legal_name: legalName, tax_id: taxId, fiscal_address: addr, fiscal_year_start: fyStart, receipt_prefix: prefix, receipt_legal_text: legalText };
    try {
        var u = await supabaseClient.from('cm_pay_club_config').update(payload).eq('id', cmPayConfigClub.id);
        if (u.error) throw u.error;
        var r = await supabaseClient.from('cm_pay_club_config').select('*').eq('id', cmPayConfigClub.id).single();
        if (r.data) cmPayConfigClub = r.data;
        cmPayCerrarModalConfig();
        cmPayRenderTab('config');
        cmPayToast('Configuración guardada', 'success');
    } catch (e) { console.error('[Pagos] guardar config:', e); cmPayToast('Error al guardar: ' + (e.message || ''), 'error'); }
}


// ============================================================
// EXPORTAR CSV (P.1.5)
// ============================================================
async function cmPayExportarCSV() {
    try {
        var r = await Promise.all([
            supabaseClient.from('cm_pay_transactions').select('*').eq('club_id', clubId).eq('archived', false).eq('status', 'paid').order('paid_at', { ascending: true }),
            supabaseClient.from('cm_pay_invoices').select('transaction_id, invoice_number').eq('club_id', clubId).eq('archived', false),
            supabaseClient.from('cm_pay_assignments').select('id, concept_id, notes').eq('club_id', clubId)
        ]);
        var transactions = r[0].data || [];
        var invoices = r[1].data || [];
        var assignments = r[2].data || [];
        if (transactions.length === 0) { cmPayToast('No hay transacciones para exportar', 'info'); return; }

        var invByTx = {};
        invoices.forEach(function(i) { if (i.transaction_id) invByTx[i.transaction_id] = i.invoice_number; });
        var asigById = {};
        assignments.forEach(function(a) { asigById[a.id] = a; });

        // Asegurar mapa de jugadores
        var missingPlayerIds = [];
        transactions.forEach(function(t) { if (t.player_id && !cmPayJugadoresMap[t.player_id]) missingPlayerIds.push(t.player_id); });
        if (missingPlayerIds.length > 0) {
            var pp = await supabaseClient.from('players').select('id, name, position').in('id', missingPlayerIds);
            (pp.data || []).forEach(function(p) { cmPayJugadoresMap[p.id] = { id: p.id, name: p.name, position: p.position, team_name: null }; });
        }

        var methodLabels = { cash: 'Efectivo', transfer: 'Transferencia', bizum_manual: 'Bizum', pos_local: 'TPV físico', stripe: 'Stripe' };
        var rows = [['Fecha pago', 'Jugador', 'Equipo', 'Concepto', 'Periodo desde', 'Periodo hasta', 'Importe (€)', 'Método', 'Referencia', 'Recibo nº', 'Notas asignación']];

        transactions.forEach(function(t) {
            var j = cmPayJugadoresMap[t.player_id] || { name: '' };
            var asig = asigById[t.assignment_id];
            var concept = asig ? cmPayConceptos.find(function(c) { return c.id === asig.concept_id; }) : null;
            rows.push([
                t.paid_at ? new Date(t.paid_at).toLocaleDateString('es-ES') : '',
                j.name || '',
                j.team_name || '',
                concept ? concept.name : '',
                t.billing_period_start ? cmPayFormatoFecha(t.billing_period_start) : '',
                t.billing_period_end ? cmPayFormatoFecha(t.billing_period_end) : '',
                Number(t.amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false }),
                methodLabels[t.method] || t.method || '',
                t.manual_reference || '',
                invByTx[t.id] || '',
                asig && asig.notes ? asig.notes : ''
            ]);
        });

        var csv = '\ufeff' + rows.map(function(row) {
            return row.map(function(cell) {
                var str = String(cell == null ? '' : cell);
                if (str.indexOf(';') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) str = '"' + str.replace(/"/g, '""') + '"';
                return str;
            }).join(';');
        }).join('\r\n');

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Pagos-' + cmPayDateToStr(new Date()) + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        cmPayToast(transactions.length + ' movimientos exportados', 'success');
    } catch (e) { console.error('[Pagos] CSV:', e); cmPayToast('Error al exportar: ' + (e.message || ''), 'error'); }
}


// ========== HELPERS ==========
function cmPayPlaceholder(opts) {
    var lis = (opts.contenido || []).map(function(t) { return '<li>' + t + '</li>'; }).join('');
    return '<div class="cmpay-placeholder"><div class="cmpay-ph-icon">' + (opts.icon || '🛠️') + '</div><h3>' + opts.titulo + '</h3><p>' + opts.descripcion + '</p>' + (lis ? '<ul>' + lis + '</ul>' : '') + '<span class="cmpay-fase">Se construye en: ' + opts.fase + '</span></div>';
}

function cmPayEscape(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cmPayFormatoEuro(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function cmPayFormatoNumero(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    var v = Number(n);
    return (v % 1 === 0) ? v.toString() : v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function cmPayFormatoFecha(d) {
    if (!d) return '';
    var dt = new Date(d + 'T12:00:00');
    if (isNaN(dt)) {
        dt = new Date(d);
        if (isNaN(dt)) return d;
    }
    return dt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function cmPayDateToStr(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function cmPayToast(msg, tipo) {
    if (typeof showToast === 'function') { showToast(msg, tipo || 'info'); return; }
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:20px;right:20px;background:' + (tipo === 'error' ? '#7f1d1d' : tipo === 'success' ? '#065f46' : '#1e3a5f') + ';color:#fff;padding:12px 20px;border-radius:8px;z-index:10000;font-size:14px';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.remove(); }, 3000);
}


// ============================================================
// FICHA ECONÓMICA DEL JUGADOR (P.1.5 final)
// Se monta dentro del modal #modal-ficha-jugador
// ============================================================

var cmPayFichaPlayerId = null;

function cmPayMontarFichaEconomica(playerId) {
    if (typeof cmPuedeVer === 'function' && !cmPuedeVer('pagos_cuotas')) return;
    var modal = document.getElementById('modal-ficha-jugador');
    if (!modal) return;
    var modalBody = modal.querySelector('.modal-body');
    if (!modalBody) return;

    cmPayFichaPlayerId = playerId;

    // Si ya está montado, resetear a Rendimiento y marcar pane económico para recarga
    if (modalBody.querySelector('.cmpay-ficha-tabs')) {
        cmPayFichaCambiarTab('rendimiento');
        var ep = document.getElementById('cmpay-ficha-pane-economico');
        if (ep) ep.dataset.loaded = '';
        return;
    }

    // Inyectar CSS una sola vez
    if (!document.getElementById('cmpay-eco-styles')) {
        var styleEl = document.createElement('style');
        styleEl.id = 'cmpay-eco-styles';
        styleEl.textContent =
            '.cmpay-ficha-tabs{display:flex;border-bottom:2px solid #e5e7eb;margin-bottom:20px}' +
            '.cmpay-ficha-tab{padding:10px 20px;background:none;border:none;border-bottom:3px solid transparent;color:#6b7280;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:-2px}' +
            '.cmpay-ficha-tab.active{color:#3b82f6;border-bottom-color:#3b82f6}' +
            '.cmpay-eco-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}' +
            '.cmpay-eco-kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center}' +
            '.cmpay-eco-kpi.success{background:#ecfdf5;border-color:#a7f3d0}' +
            '.cmpay-eco-kpi.warn{background:#fef3c7;border-color:#fde68a}' +
            '.cmpay-eco-kpi .lbl{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.3px;font-weight:600}' +
            '.cmpay-eco-kpi .val{font-size:22px;font-weight:700;color:#1f2937;margin-top:6px;font-family:Consolas,monospace}' +
            '.cmpay-eco-kpi.success .val{color:#059669}' +
            '.cmpay-eco-kpi.warn .val{color:#d97706}' +
            '.cmpay-eco-section{margin-bottom:22px}' +
            '.cmpay-eco-section h4{font-size:14px;color:#374151;margin:0 0 10px}' +
            '.cmpay-eco-table{width:100%;border-collapse:collapse;font-size:13px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}' +
            '.cmpay-eco-table th{background:#f9fafb;padding:10px 12px;text-align:left;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.3px;border-bottom:1px solid #e5e7eb}' +
            '.cmpay-eco-table td{padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#1f2937;vertical-align:middle}' +
            '.cmpay-eco-table tr:last-child td{border-bottom:none}' +
            '.cmpay-eco-table .num{font-family:Consolas,monospace;text-align:right}' +
            '.cmpay-eco-empty{padding:24px;text-align:center;color:#9ca3af;font-size:13px;background:#f9fafb;border:1px dashed #d1d5db;border-radius:8px}' +
            '.cmpay-eco-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}' +
            '.cmpay-eco-badge.active{background:#dbeafe;color:#1d4ed8}' +
            '.cmpay-eco-badge.partial{background:#fef3c7;color:#b45309}' +
            '.cmpay-eco-badge.paid{background:#d1fae5;color:#065f46}' +
            '.cmpay-eco-badge.cancelled{background:#f3f4f6;color:#6b7280}' +
            '.cmpay-eco-btn{background:#7c3aed;color:#fff;border:none;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer}' +
            '.cmpay-eco-btn:hover{background:#6d28d9}';
        document.head.appendChild(styleEl);
    }

    // Asegurar que #ficha-radares está dentro de modal-body (en tu HTML está fuera)
    var radares = document.getElementById('ficha-radares');
    if (radares && radares.parentElement !== modalBody) modalBody.appendChild(radares);

    // Crear barra de pestañas
    var tabBar = document.createElement('div');
    tabBar.className = 'cmpay-ficha-tabs';
    tabBar.innerHTML =
        '<button class="cmpay-ficha-tab active" id="cmpay-ficha-tab-rendimiento" onclick="cmPayFichaCambiarTab(\'rendimiento\')">📊 Rendimiento</button>' +
        '<button class="cmpay-ficha-tab" id="cmpay-ficha-tab-economico" onclick="cmPayFichaCambiarTab(\'economico\')">💰 Económico</button>';

    // Envolver contenido actual en pane Rendimiento
    var rendimientoDiv = document.createElement('div');
    rendimientoDiv.id = 'cmpay-ficha-pane-rendimiento';
    while (modalBody.firstChild) rendimientoDiv.appendChild(modalBody.firstChild);

    var economicoDiv = document.createElement('div');
    economicoDiv.id = 'cmpay-ficha-pane-economico';
    economicoDiv.style.display = 'none';

    modalBody.appendChild(tabBar);
    modalBody.appendChild(rendimientoDiv);
    modalBody.appendChild(economicoDiv);
}

function cmPayFichaCambiarTab(tabId) {
    var rTab = document.getElementById('cmpay-ficha-tab-rendimiento');
    var eTab = document.getElementById('cmpay-ficha-tab-economico');
    var rPane = document.getElementById('cmpay-ficha-pane-rendimiento');
    var ePane = document.getElementById('cmpay-ficha-pane-economico');
    if (!rTab || !eTab || !rPane || !ePane) return;
    if (tabId === 'rendimiento') {
        rTab.classList.add('active'); eTab.classList.remove('active');
        rPane.style.display = ''; ePane.style.display = 'none';
    } else {
        eTab.classList.add('active'); rTab.classList.remove('active');
        rPane.style.display = 'none'; ePane.style.display = '';
        if (!ePane.dataset.loaded) cmPayCargarFichaEconomica(cmPayFichaPlayerId);
    }
}

async function cmPayCargarFichaEconomica(playerId) {
    var pane = document.getElementById('cmpay-ficha-pane-economico');
    if (!pane) return;
    pane.innerHTML = '<div class="cmpay-eco-empty">Cargando ficha económica...</div>';
    try {
        if (!cmPayConfigClub) await cmPayCargarOCrearConfig();
        var r = await Promise.all([
            supabaseClient.from('cm_pay_assignments').select('*').eq('club_id', clubId).eq('player_id', playerId).order('created_at', { ascending: false }),
            supabaseClient.from('cm_pay_concepts').select('id, name, type, frequency').eq('club_id', clubId),
            supabaseClient.from('cm_pay_discounts').select('id, name, discount_type, value').eq('club_id', clubId),
            supabaseClient.from('cm_pay_transactions').select('*').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('paid_at', { ascending: false }),
            supabaseClient.from('cm_pay_invoices').select('*').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('invoice_date', { ascending: false })
        ]);
        cmPayPintarFichaEconomica(pane, r[0].data || [], r[1].data || [], r[2].data || [], r[3].data || [], r[4].data || []);
        pane.dataset.loaded = '1';
    } catch (e) {
        console.error('[Pagos] ficha económica:', e);
        pane.innerHTML = '<div class="cmpay-eco-empty" style="color:#dc2626">Error: ' + (e.message || '') + '</div>';
    }
}

function cmPayPintarFichaEconomica(pane, asignaciones, conceptos, descuentos, transacciones, recibos) {
    var paidByAsig = {};
    transacciones.filter(function(t) { return t.status === 'paid'; }).forEach(function(t) {
        paidByAsig[t.assignment_id] = (paidByAsig[t.assignment_id] || 0) + Number(t.amount);
    });
    var totalFact = 0, totalPag = 0, deuda = 0;
    asignaciones.forEach(function(a) {
        if (a.archived || a.status === 'cancelled') return;
        totalFact += Number(a.final_amount);
        var p = paidByAsig[a.id] || 0;
        totalPag += p;
        deuda += Math.max(0, Number(a.final_amount) - p);
    });

    var html = '<div class="cmpay-eco-kpis">' +
        '<div class="cmpay-eco-kpi"><div class="lbl">Total facturado</div><div class="val">' + cmPayFormatoEuro(totalFact) + '</div></div>' +
        '<div class="cmpay-eco-kpi success"><div class="lbl">Pagado</div><div class="val">' + cmPayFormatoEuro(totalPag) + '</div></div>' +
        '<div class="cmpay-eco-kpi warn"><div class="lbl">Deuda actual</div><div class="val">' + cmPayFormatoEuro(deuda) + '</div></div>' +
    '</div>';

    // Asignaciones
    html += '<div class="cmpay-eco-section"><h4>📋 Asignaciones</h4>';
    if (asignaciones.length === 0) {
        html += '<div class="cmpay-eco-empty">Este jugador no tiene asignaciones económicas.</div>';
    } else {
        html += '<table class="cmpay-eco-table"><thead><tr><th>Concepto</th><th>Periodo</th><th class="num">Importe</th><th class="num">Pagado</th><th class="num">Pendiente</th><th>Estado</th></tr></thead><tbody>';
        asignaciones.forEach(function(a) {
            var c = conceptos.find(function(x) { return x.id === a.concept_id; });
            var d = a.discount_id ? descuentos.find(function(x) { return x.id === a.discount_id; }) : null;
            var p = paidByAsig[a.id] || 0;
            var rest = Math.max(0, Number(a.final_amount) - p);
            var stCls = a.archived ? 'cancelled' : a.status;
            var stLbl = a.archived ? 'Archivada' : (a.status === 'active' ? 'Pendiente' : a.status === 'partial' ? 'Parcial' : a.status === 'paid' ? 'Pagado' : 'Anulada');
            html += '<tr><td><strong>' + cmPayEscape(c ? c.name : '?') + '</strong>' + (d ? '<br><span style="font-size:11px;color:#6b7280">↳ ' + cmPayEscape(d.name) + '</span>' : '') + '</td>' +
                '<td style="font-size:12px;color:#6b7280">' + (a.period_start ? cmPayFormatoFecha(a.period_start) : '?') + (a.period_end ? '<br>→ ' + cmPayFormatoFecha(a.period_end) : '') + '</td>' +
                '<td class="num">' + cmPayFormatoEuro(a.final_amount) + '</td>' +
                '<td class="num" style="color:#059669">' + cmPayFormatoEuro(p) + '</td>' +
                '<td class="num"' + (rest > 0 ? ' style="color:#d97706;font-weight:600"' : '') + '>' + cmPayFormatoEuro(rest) + '</td>' +
                '<td><span class="cmpay-eco-badge ' + stCls + '">' + stLbl + '</span></td></tr>';
        });
        html += '</tbody></table>';
    }
    html += '</div>';

    // Histórico pagos
    html += '<div class="cmpay-eco-section"><h4>💳 Histórico de pagos</h4>';
    var pagados = transacciones.filter(function(t) { return t.status === 'paid'; });
    if (pagados.length === 0) {
        html += '<div class="cmpay-eco-empty">No hay pagos registrados.</div>';
    } else {
        var methodLabels = { cash: 'Efectivo', transfer: 'Transferencia', bizum_manual: 'Bizum', pos_local: 'TPV físico', stripe: 'Stripe' };
        var invByTx = {};
        recibos.forEach(function(i) { if (i.transaction_id) invByTx[i.transaction_id] = i.invoice_number; });
        var asigById = {};
        asignaciones.forEach(function(a) { asigById[a.id] = a; });
        html += '<table class="cmpay-eco-table"><thead><tr><th>Fecha</th><th>Concepto</th><th class="num">Importe</th><th>Método</th><th>Referencia</th><th>Recibo</th></tr></thead><tbody>';
        pagados.forEach(function(t) {
            var a = asigById[t.assignment_id];
            var c = a ? conceptos.find(function(x) { return x.id === a.concept_id; }) : null;
            html += '<tr><td style="font-size:12px">' + (t.paid_at ? new Date(t.paid_at).toLocaleDateString('es-ES') : '—') + '</td>' +
                '<td>' + (c ? cmPayEscape(c.name) : '—') + '</td>' +
                '<td class="num">' + cmPayFormatoEuro(t.amount) + '</td>' +
                '<td style="font-size:12px">' + (methodLabels[t.method] || t.method || '—') + '</td>' +
                '<td style="font-size:12px;color:#6b7280">' + cmPayEscape(t.manual_reference || '—') + '</td>' +
                '<td style="font-size:12px;color:#6b7280">' + (invByTx[t.id] || '—') + '</td></tr>';
        });
        html += '</tbody></table>';
    }
    html += '</div>';

    // Recibos
    html += '<div class="cmpay-eco-section"><h4>📄 Recibos emitidos</h4>';
    if (recibos.length === 0) {
        html += '<div class="cmpay-eco-empty">No hay recibos emitidos para este jugador.</div>';
    } else {
        html += '<table class="cmpay-eco-table"><thead><tr><th>Nº recibo</th><th>Fecha</th><th>A nombre de</th><th class="num">Importe</th><th></th></tr></thead><tbody>';
        recibos.forEach(function(i) {
            html += '<tr><td><strong>' + cmPayEscape(i.invoice_number) + '</strong></td>' +
                '<td style="font-size:12px">' + cmPayFormatoFecha(i.invoice_date) + '</td>' +
                '<td>' + cmPayEscape(i.payer_name || '—') + '</td>' +
                '<td class="num">' + cmPayFormatoEuro(i.amount) + '</td>' +
                '<td><button class="cmpay-eco-btn" onclick="cmPayRegenerarRecibo(\'' + i.id + '\')">📄 Regenerar PDF</button></td></tr>';
        });
        html += '</tbody></table>';
    }
    html += '</div>';

    pane.innerHTML = html;
}

async function cmPayRegenerarRecibo(invoiceId) {
    try {
        var inv = await supabaseClient.from('cm_pay_invoices').select('*').eq('id', invoiceId).single();
        if (inv.error || !inv.data) throw inv.error || new Error('Recibo no encontrado');
        var invoice = inv.data;
        var tx = invoice.transaction_id ? await supabaseClient.from('cm_pay_transactions').select('*').eq('id', invoice.transaction_id).single() : { data: {} };
        var transaction = (tx && tx.data) ? tx.data : {};
        cmPayGenerarReciboPDF({
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            club: { legal_name: invoice.club_name, tax_id: invoice.club_cif, fiscal_address: invoice.club_address },
            payer_name: invoice.payer_name,
            payer_document: invoice.payer_document,
            concept_name: invoice.description || 'Concepto',
            period_str: '',
            amount: invoice.amount,
            method: transaction.method,
            reference: transaction.manual_reference,
            paid_at: transaction.paid_at ? transaction.paid_at.substring(0, 10) : invoice.invoice_date,
            legal_text: cmPayConfigClub ? (cmPayConfigClub.receipt_legal_text || '') : ''
        });
        cmPayToast('Recibo regenerado', 'success');
    } catch (e) { console.error(e); cmPayToast('Error: ' + (e.message || ''), 'error'); }
}


// ============================================================
// MODAL: FICHA ECONÓMICA DEL JUGADOR
// (Se abre al hacer clic en el nombre del jugador en Cobros)
// ============================================================
async function cmPayAbrirFichaJugadorEco(playerId) {
    var html = '<div class="cmpay-modal-overlay" id="cmpay-modal-ficha-eco" onclick="if(event.target===this)cmPayCerrarFichaJugadorEco()">' +
        '<div class="cmpay-modal" style="max-width:900px">' +
            '<div class="cmpay-modal-header"><h3 id="cmpay-ficha-eco-title">💰 Ficha económica</h3><button class="cmpay-modal-close" onclick="cmPayCerrarFichaJugadorEco()">×</button></div>' +
            '<div class="cmpay-modal-body" id="cmpay-ficha-eco-body"><div class="cmpay-empty">Cargando...</div></div>' +
        '</div>' +
    '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    try {
        var pRes = await supabaseClient.from('players').select('id, name, position, photo_url').eq('id', playerId).single();
        var player = pRes.data || { name: 'Jugador' };
        var titleEl = document.getElementById('cmpay-ficha-eco-title');
        if (titleEl) titleEl.innerHTML = '💰 Ficha económica · <span style="color:#60a5fa">' + cmPayEscape(player.name) + '</span>' + (player.position ? '<span style="color:#64748b;font-weight:normal;font-size:13px"> · ' + cmPayEscape(player.position) + '</span>' : '');
        if (!cmPayConfigClub) await cmPayCargarOCrearConfig();
        var r = await Promise.all([
            supabaseClient.from('cm_pay_assignments').select('*').eq('club_id', clubId).eq('player_id', playerId).order('created_at', { ascending: false }),
            supabaseClient.from('cm_pay_concepts').select('id, name, type, frequency').eq('club_id', clubId),
            supabaseClient.from('cm_pay_discounts').select('id, name, discount_type, value').eq('club_id', clubId),
            supabaseClient.from('cm_pay_transactions').select('*').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('paid_at', { ascending: false }),
            supabaseClient.from('cm_pay_invoices').select('*').eq('club_id', clubId).eq('player_id', playerId).eq('archived', false).order('invoice_date', { ascending: false })
        ]);
        cmPayPintarFichaJugadorEco(r[0].data || [], r[1].data || [], r[2].data || [], r[3].data || [], r[4].data || []);
    } catch (e) {
        console.error('[Pagos] ficha eco:', e);
        var body = document.getElementById('cmpay-ficha-eco-body');
        if (body) body.innerHTML = '<div class="cmpay-empty" style="color:#ef4444">Error: ' + (e.message || '') + '</div>';
    }
}

function cmPayCerrarFichaJugadorEco() { var m = document.getElementById('cmpay-modal-ficha-eco'); if (m) m.remove(); }

function cmPayPintarFichaJugadorEco(asignaciones, conceptos, descuentos, transacciones, recibos) {
    var body = document.getElementById('cmpay-ficha-eco-body');
    if (!body) return;
    var paidByAsig = {};
    transacciones.filter(function(t) { return t.status === 'paid'; }).forEach(function(t) {
        paidByAsig[t.assignment_id] = (paidByAsig[t.assignment_id] || 0) + Number(t.amount);
    });
    var totalFact = 0, totalPag = 0, deuda = 0;
    asignaciones.forEach(function(a) {
        if (a.archived || a.status === 'cancelled') return;
        totalFact += Number(a.final_amount);
        var p = paidByAsig[a.id] || 0;
        totalPag += p;
        deuda += Math.max(0, Number(a.final_amount) - p);
    });

    var html = '<div class="cmpay-kpi-row" style="grid-template-columns:repeat(3,1fr)">' +
        '<div class="cmpay-kpi"><div class="lbl">Total facturado</div><div class="val">' + cmPayFormatoEuro(totalFact) + '</div></div>' +
        '<div class="cmpay-kpi success"><div class="lbl">Pagado</div><div class="val">' + cmPayFormatoEuro(totalPag) + '</div></div>' +
        '<div class="cmpay-kpi warn"><div class="lbl">Deuda actual</div><div class="val">' + cmPayFormatoEuro(deuda) + '</div></div>' +
    '</div>';

    html += '<h4 style="font-size:13px;color:#e2e8f0;margin:20px 0 10px;text-transform:uppercase;letter-spacing:.5px">📋 Asignaciones</h4>';
    if (asignaciones.length === 0) html += '<div class="cmpay-empty" style="background:#1e293b;border:1px dashed #334155;border-radius:8px">Sin asignaciones económicas.</div>';
    else {
        html += '<div class="cmpay-table-wrap"><table class="cmpay-table"><thead><tr><th>Concepto</th><th>Periodo</th><th class="num">Importe</th><th class="num">Pagado</th><th class="num">Pendiente</th><th>Estado</th></tr></thead><tbody>';
        asignaciones.forEach(function(a) {
            var c = conceptos.find(function(x) { return x.id === a.concept_id; });
            var d = a.discount_id ? descuentos.find(function(x) { return x.id === a.discount_id; }) : null;
            var p = paidByAsig[a.id] || 0;
            var rest = Math.max(0, Number(a.final_amount) - p);
            var st = CMPAY_STATUS.find(function(s) { return s.key === a.status; }) || CMPAY_STATUS[0];
            html += '<tr><td><strong>' + cmPayEscape(c ? c.name : '?') + '</strong>' + (d ? '<br><span class="muted" style="font-size:11px">↳ ' + cmPayEscape(d.name) + '</span>' : '') + '</td>' +
                '<td><span style="font-size:12px">' + (a.period_start ? cmPayFormatoFecha(a.period_start) : '?') + (a.period_end ? '<br>→ ' + cmPayFormatoFecha(a.period_end) : '') + '</span></td>' +
                '<td class="num">' + cmPayFormatoEuro(a.final_amount) + '</td>' +
                '<td class="num" style="color:#22c55e">' + cmPayFormatoEuro(p) + '</td>' +
                '<td class="num"' + (rest > 0 ? ' style="color:#f59e0b;font-weight:600"' : '') + '>' + cmPayFormatoEuro(rest) + '</td>' +
                '<td><span class="cmpay-status-badge" style="background:' + st.bg + ';color:' + st.color + ';border:1px solid ' + st.color + '40">' + (a.archived ? 'Archivada' : st.label) + '</span></td></tr>';
        });
        html += '</tbody></table></div>';
    }

    html += '<h4 style="font-size:13px;color:#e2e8f0;margin:20px 0 10px;text-transform:uppercase;letter-spacing:.5px">💳 Histórico de pagos</h4>';
    var pagados = transacciones.filter(function(t) { return t.status === 'paid'; });
    if (pagados.length === 0) html += '<div class="cmpay-empty" style="background:#1e293b;border:1px dashed #334155;border-radius:8px">Sin pagos registrados.</div>';
    else {
        var methodLabels = { cash: 'Efectivo', transfer: 'Transferencia', bizum_manual: 'Bizum', pos_local: 'TPV físico', stripe: 'Stripe' };
        var invByTx = {};
        recibos.forEach(function(i) { if (i.transaction_id) invByTx[i.transaction_id] = i.invoice_number; });
        var asigById = {};
        asignaciones.forEach(function(a) { asigById[a.id] = a; });
        html += '<div class="cmpay-table-wrap"><table class="cmpay-table"><thead><tr><th>Fecha</th><th>Concepto</th><th class="num">Importe</th><th>Método</th><th>Referencia</th><th>Recibo</th></tr></thead><tbody>';
        pagados.forEach(function(t) {
            var a = asigById[t.assignment_id];
            var c = a ? conceptos.find(function(x) { return x.id === a.concept_id; }) : null;
            html += '<tr><td><span style="font-size:12px">' + (t.paid_at ? new Date(t.paid_at).toLocaleDateString('es-ES') : '—') + '</span></td>' +
                '<td>' + (c ? cmPayEscape(c.name) : '—') + '</td>' +
                '<td class="num">' + cmPayFormatoEuro(t.amount) + '</td>' +
                '<td><span style="font-size:12px">' + (methodLabels[t.method] || t.method || '—') + '</span></td>' +
                '<td><span class="muted" style="font-size:11px">' + cmPayEscape(t.manual_reference || '—') + '</span></td>' +
                '<td><span class="muted" style="font-size:11px">' + (invByTx[t.id] || '—') + '</span></td></tr>';
        });
        html += '</tbody></table></div>';
    }

    html += '<h4 style="font-size:13px;color:#e2e8f0;margin:20px 0 10px;text-transform:uppercase;letter-spacing:.5px">📄 Recibos emitidos</h4>';
    if (recibos.length === 0) html += '<div class="cmpay-empty" style="background:#1e293b;border:1px dashed #334155;border-radius:8px">Sin recibos emitidos.</div>';
    else {
        html += '<div class="cmpay-table-wrap"><table class="cmpay-table"><thead><tr><th>Nº recibo</th><th>Fecha</th><th>A nombre de</th><th class="num">Importe</th><th></th></tr></thead><tbody>';
        recibos.forEach(function(i) {
            html += '<tr><td><strong>' + cmPayEscape(i.invoice_number) + '</strong></td>' +
                '<td><span style="font-size:12px">' + cmPayFormatoFecha(i.invoice_date) + '</span></td>' +
                '<td>' + cmPayEscape(i.payer_name || '—') + '</td>' +
                '<td class="num">' + cmPayFormatoEuro(i.amount) + '</td>' +
                '<td><button class="cmpay-btn cmpay-btn-secondary" style="font-size:11px;padding:4px 10px" onclick="cmPayRegenerarRecibo(\'' + i.id + '\')">📄 Regenerar</button></td></tr>';
        });
        html += '</tbody></table></div>';
    }
    body.innerHTML = html;
}

async function cmPayRegenerarRecibo(invoiceId) {
    try {
        var inv = await supabaseClient.from('cm_pay_invoices').select('*').eq('id', invoiceId).single();
        if (inv.error || !inv.data) throw inv.error || new Error('Recibo no encontrado');
        var invoice = inv.data;
        var tx = invoice.transaction_id ? await supabaseClient.from('cm_pay_transactions').select('*').eq('id', invoice.transaction_id).single() : { data: {} };
        var transaction = (tx && tx.data) ? tx.data : {};
        cmPayGenerarReciboPDF({
            invoice_number: invoice.invoice_number,
            invoice_date: invoice.invoice_date,
            club: { legal_name: invoice.club_name, tax_id: invoice.club_cif, fiscal_address: invoice.club_address },
            payer_name: invoice.payer_name,
            payer_document: invoice.payer_document,
            concept_name: invoice.description || 'Concepto',
            period_str: '',
            amount: invoice.amount,
            method: transaction.method,
            reference: transaction.manual_reference,
            paid_at: transaction.paid_at ? transaction.paid_at.substring(0, 10) : invoice.invoice_date,
            legal_text: cmPayConfigClub ? (cmPayConfigClub.receipt_legal_text || '') : ''
        });
        cmPayToast('Recibo regenerado', 'success');
    } catch (e) { console.error(e); cmPayToast('Error: ' + (e.message || ''), 'error'); }
}


// ========== AUTO-MONTAJE ==========
(function cmPayAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 20) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (!cmPuedeVer('pagos_cuotas')) { clearInterval(intervalo); return; }
        clearInterval(intervalo);
        if (document.getElementById('cm-tab-pagos')) return;
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;
        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-pagos';
        tab.setAttribute('onclick', "cambiarModulo('pagos', this)");
        tab.innerHTML = '<span class="tab-icon">💰</span><span>Pagos</span>';
        mainTabs.appendChild(tab);
        if (!document.getElementById('modulo-pagos')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-pagos';
            var ultModulo = document.querySelector('.vista-modulo:last-of-type');
            if (ultModulo && ultModulo.parentElement) ultModulo.parentElement.insertBefore(vista, ultModulo.nextSibling);
            else document.body.appendChild(vista);
        }
        if (typeof registrarModulo === 'function') registrarModulo('pagos', function() { cmPayInit('modulo-pagos'); });
        console.log('[Pagos] Auto-montado');
    }, 500);
})();
