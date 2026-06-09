// ============================================================
// CM-PATROCINADORES.JS - Modulo de Patrocinadores
// TopLiderCoach HUB - Club Mode - Oficina - Fase 1 (MVP)
// ============================================================
// Modulo de la Oficina del club. Gestiona el ciclo del patrocinio:
//   - Patrocinadores (CRM): ficha, embudo e historial de gestiones
//   - Contratos: datos del acuerdo por patrocinador
//   - Panel: KPIs basicos y proximas renovaciones
// Visible para roles con permiso 'patrocinadores'.
// Prefijo: cmSpon (todas las variables y funciones)
// Depende de: core.js (supabaseClient, clubId) y cm-core.js
//             (cmState, cmPuedeVer, cmPuedeEditar).
// Ubicacion: js/club-mode/cm-patrocinadores.js
//
// Estado de construccion (4 fases del documento):
//   - Fase 1  Patrocinadores + Contratos + Panel  -> ESTE ARCHIVO
//   - Fase 2  Activos patrocinables               -> pendiente
//   - Fase 3  Cobros + integracion con Economico   -> pendiente
//   - Fase 4  Contraprestaciones + renovaciones     -> pendiente
// Importes guardados en CENTIMOS (bigint), como Pagos y Economico.
// ============================================================


// ========== ESTADO DEL MODULO ==========
var cmSponContainerId = null;       // id del contenedor donde se monta
var cmSponTabActiva   = 'panel';    // panel | patrocinadores | contratos
var cmSponSponsors    = [];         // patrocinadores cargados
var cmSponContracts   = [];         // contratos cargados
var cmSponInteractions = [];        // historial de gestiones cargado
var cmSponCargado     = false;      // ya se han cargado los datos?
var cmSponFiltroEmbudo = 'all';     // filtro del embudo en la pestana Patrocinadores
var cmSponSponsorAbierto = null;    // patrocinador abierto en la ficha
var cmSponAssets      = [];         // catalogo de activos patrocinables (Fase 2)
var cmSponAssignments = [];         // asignaciones activo<->contrato (Fase 2)
var cmSponPayments    = [];         // plazos de cobro (Fase 3)
var cmSponDeliverables = [];        // contraprestaciones (Fase 4)
var cmSponFiltroDeliv  = 'all';     // filtro pestana Contraprestaciones: all | pendiente | entregado
var cmSponFiltroCobro = 'all';      // filtro de la pestana Cobros: all | pendiente | cobrado


// ========== VOCABULARIO (valor en BD -> etiqueta visible) ==========
var CMSPON_STAGE = {
    potencial:   'Potencial',
    negociacion: 'En negociacion',
    activo:      'Activo',
    finalizado:  'Finalizado'
};
var CMSPON_LEVEL = {
    principal:   'Principal',
    tecnico:     'Tecnico',
    secundario:  'Secundario',
    colaborador: 'Colaborador'
};
var CMSPON_TYPE = {
    economico: 'Economico',
    especie:   'En especie',
    naming:    'Naming',
    mixto:     'Mixto'
};
var CMSPON_CSTATUS = {
    borrador:   'Borrador',
    activo:     'Activo',
    finalizado: 'Finalizado',
    rescindido: 'Rescindido'
};
var CMSPON_ITYPE = {
    llamada: 'Llamada',
    email:   'Email',
    reunion: 'Reunion',
    nota:    'Nota'
};
var CMSPON_CATEGORY = {
    equipacion:    'Equipacion',
    instalaciones: 'Instalaciones',
    digital:       'Digital',
    eventos:       'Eventos',
    naming:        'Naming'
};

// Color del badge segun la fase del embudo
function cmSponStageColor(stage) {
    if (stage === 'activo')      return 'background:#14532d;color:#4ade80';
    if (stage === 'negociacion') return 'background:#78350f;color:#fbbf24';
    if (stage === 'finalizado')  return 'background:#1e293b;color:#94a3b8';
    return 'background:#1e3a5f;color:#60a5fa'; // potencial
}


// ========== HELPERS ==========

// Escapa texto para insertarlo de forma segura en HTML.
function cmSponEsc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Centimos (entero) -> texto "12.345,67 EUR"
function cmSponMoney(cents) {
    var n = (Number(cents) || 0) / 100;
    return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20AC';
}

// Texto del input en euros (ej "1.234,56") -> centimos (entero)
function cmSponEurosToCents(v) {
    v = String(v == null ? '' : v).trim();
    if (!v) return 0;
    v = v.replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
    var n = parseFloat(v);
    if (isNaN(n)) return 0;
    return Math.round(n * 100);
}

// Centimos -> valor para precargar un input ("1234,56")
function cmSponCentsToInput(cents) {
    var n = (Number(cents) || 0) / 100;
    return n.toFixed(2).replace('.', ',');
}

// Fecha 'YYYY-MM-DD' -> 'DD/MM/AAAA'. Se ancla a mediodia para evitar
// el salto de dia en zonas horarias negativas (UTC fix).
function cmSponFecha(d) {
    if (!d) return '';
    try { return new Date(d + 'T12:00:00').toLocaleDateString('es-ES'); }
    catch (e) { return d; }
}

// Fecha de hoy en 'YYYY-MM-DD'
function cmSponHoy() {
    return new Date().toISOString().slice(0, 10);
}

// Dias desde hoy hasta una fecha 'YYYY-MM-DD' (negativo = ya paso)
function cmSponDiasHasta(d) {
    if (!d) return null;
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    var f = new Date(d + 'T12:00:00');
    return Math.round((f - hoy) / 86400000);
}

// Id del miembro/usuario actual, como texto (para created_by)
function cmSponQuien() {
    try {
        if (typeof cmState !== 'undefined' && cmState.miembro && cmState.miembro.id) return String(cmState.miembro.id);
        if (typeof usuario !== 'undefined' && usuario && usuario.id) return String(usuario.id);
    } catch (e) {}
    return null;
}

// Devuelve true si el usuario puede editar este modulo
function cmSponEditable() {
    return (typeof cmPuedeEditar !== 'function') || cmPuedeEditar('patrocinadores');
}

// --- Almacenamiento privado (Fase 4) ---
// Reutiliza la Edge Function eco-upload-receipt del modulo Economico:
//   action 'upload' -> sube un archivo base64 y devuelve { path }
//   action 'sign'   -> firma una ruta y devuelve { signed_url } temporal
function cmSponFileToBase64(file) {
    return new Promise(function(resolve, reject) {
        var r = new FileReader();
        r.onload = function() { resolve(String(r.result).split(',')[1]); };
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}
async function cmSponInvoke(fn, body) {
    var r = await supabaseClient.functions.invoke(fn, { body: body });
    if (r.error) throw r.error;
    return r.data;
}
// Abre el contrato firmado en una pestana nueva (URL firmada temporal).
async function cmSponVerContrato(path) {
    try {
        var d = await cmSponInvoke('eco-upload-receipt', { action: 'sign', path: path });
        if (d && d.signed_url) window.open(d.signed_url, '_blank');
        else alert('No se pudo abrir el contrato.');
    } catch (e) {
        console.error('[Patrocinadores] Error abriendo contrato:', e);
        alert('No se pudo abrir el contrato: ' + (e.message || e));
    }
}

// Patrocinadores que pasan el filtro de embudo actual
function cmSponFiltrados() {
    return cmSponSponsors.filter(function(s) {
        if (cmSponFiltroEmbudo !== 'all' && s.stage !== cmSponFiltroEmbudo) return false;
        return true;
    });
}

// Contratos de un patrocinador concreto
function cmSponContratosDe(sponsorId) {
    return cmSponContracts.filter(function(c) { return c.sponsor_id === sponsorId; });
}

// Gestiones de un patrocinador concreto (mas reciente primero)
function cmSponGestionesDe(sponsorId) {
    return cmSponInteractions
        .filter(function(i) { return i.sponsor_id === sponsorId; })
        .sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
}

// Nombre de un patrocinador por id
function cmSponNombreDe(sponsorId) {
    var s = cmSponSponsors.find(function(x) { return x.id === sponsorId; });
    return s ? s.name : '(sin patrocinador)';
}

// Contrato por id
function cmSponContratoDe(contractId) {
    return cmSponContracts.find(function(c) { return c.id === contractId; }) || null;
}

// --- Activos (Fase 2) ---
// Devuelve el contrato ACTIVO que ocupa un activo (o null si esta libre).
// La ocupacion se deriva de las asignaciones; nunca se guarda como campo.
function cmSponAssetOcupadoPor(assetId) {
    var asign = cmSponAssignments.find(function(a) {
        if (a.asset_id !== assetId) return false;
        var c = cmSponContratoDe(a.contract_id);
        return c && c.status === 'activo';
    });
    return asign ? cmSponContratoDe(asign.contract_id) : null;
}

// Asignaciones de un contrato concreto
function cmSponAsignacionesDe(contractId) {
    return cmSponAssignments.filter(function(a) { return a.contract_id === contractId; });
}

// Activos cubiertos por un contrato (objetos asset)
function cmSponActivosDe(contractId) {
    var ids = cmSponAsignacionesDe(contractId).map(function(a) { return a.asset_id; });
    return cmSponAssets.filter(function(a) { return ids.indexOf(a.id) !== -1; });
}

// --- Cobros (Fase 3) ---
// Plazos de un contrato concreto, ordenados por fecha prevista.
function cmSponPlazosDe(contractId) {
    return cmSponPayments
        .filter(function(p) { return p.contract_id === contractId; })
        .sort(function(a, b) { return (a.due_date || '').localeCompare(b.due_date || ''); });
}

// Suma de importes de una lista de plazos
function cmSponSumaPlazos(plazos) {
    return plazos.reduce(function(acc, p) { return acc + (Number(p.amount_cents) || 0); }, 0);
}

// Importe ya cobrado de un contrato (plazos con status 'cobrado')
function cmSponCobradoDe(contractId) {
    return cmSponSumaPlazos(cmSponPlazosDe(contractId).filter(function(p) { return p.status === 'cobrado'; }));
}

// --- Contraprestaciones (Fase 4) ---
// Contraprestaciones de un contrato concreto, ordenadas por fecha objetivo.
function cmSponContrapDe(contractId) {
    return cmSponDeliverables
        .filter(function(d) { return d.contract_id === contractId; })
        .sort(function(a, b) { return (a.due_date || '9999').localeCompare(b.due_date || '9999'); });
}


// ========== INICIALIZACION ==========
// Punto de entrada. Lo llama el HUB al abrir la pestana "Patrocinadores".
function cmSponInit(containerId) {
    var container = document.getElementById(containerId);
    if (!container) { console.error('cmSponInit: contenedor no encontrado:', containerId); return; }
    cmSponContainerId = containerId;
    cmSponRenderPanel(container);
    cmSponCambiarTab('panel');
}


// ========== RENDER DEL PANEL PRINCIPAL ==========
// El panel lleva su PROPIO fondo oscuro (.cmspon-wrap) para garantizar
// el contraste de los textos, sin depender del contenedor del HUB.
function cmSponRenderPanel(container) {
    container.innerHTML =
    '<style>' +
        '.cmspon-wrap{background:#0f172a;min-height:calc(100vh - 120px);padding:24px 20px;box-sizing:border-box}' +
        '.cmspon-panel{max-width:1200px;margin:0 auto}' +
        '.cmspon-header{margin-bottom:18px}' +
        '.cmspon-header h2{margin:0;color:#f1f5f9;font-size:20px;font-weight:700}' +
        '.cmspon-header .cmspon-sub{color:#94a3b8;font-size:12px;margin-top:2px}' +
        '.cmspon-tabs{display:flex;gap:0;border-bottom:1px solid #1e293b;margin-bottom:20px;flex-wrap:wrap}' +
        '.cmspon-tab{padding:10px 20px;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all .2s}' +
        '.cmspon-tab:hover{color:#e2e8f0}' +
        '.cmspon-tab.active{color:#3b82f6;border-bottom-color:#3b82f6}' +
        '.cmspon-tab-badge{display:inline-block;margin-left:6px;background:#334155;color:#94a3b8;font-size:10px;padding:1px 6px;border-radius:8px;font-weight:600}' +
        // vacios
        '.cmspon-empty{text-align:center;padding:60px 20px;color:#64748b}' +
        '.cmspon-empty .icon{font-size:48px;margin-bottom:14px}' +
        '.cmspon-empty h3{color:#e2e8f0;font-size:16px;margin:0 0 6px}' +
        '.cmspon-empty p{font-size:13px;margin:0;line-height:1.6}' +
        // botones
        '.cmspon-btn{padding:8px 16px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s}' +
        '.cmspon-btn-primary{background:#3b82f6;color:#fff}.cmspon-btn-primary:hover{background:#2563eb}' +
        '.cmspon-btn-secondary{background:#334155;color:#e2e8f0}.cmspon-btn-secondary:hover{background:#475569}' +
        '.cmspon-btn-danger{background:#7f1d1d;color:#fecaca}.cmspon-btn-danger:hover{background:#991b1b}' +
        '.cmspon-btn-sm{padding:5px 12px;font-size:12px}' +
        // KPIs
        '.cmspon-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:22px}' +
        '.cmspon-kpi{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px 18px}' +
        '.cmspon-kpi .v{color:#f1f5f9;font-size:26px;font-weight:700;line-height:1.1}' +
        '.cmspon-kpi .l{color:#94a3b8;font-size:12px;margin-top:6px}' +
        '.cmspon-kpi.accent .v{color:#60a5fa}' +
        '.cmspon-kpi.warn .v{color:#fbbf24}' +
        // bloques del panel
        '.cmspon-block{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px 18px;margin-bottom:16px}' +
        '.cmspon-block h3{margin:0 0 12px;color:#e2e8f0;font-size:14px;font-weight:700}' +
        '.cmspon-reno-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #334155}' +
        '.cmspon-reno-row:first-of-type{border-top:none}' +
        '.cmspon-reno-name{color:#e2e8f0;font-size:13px;font-weight:600}' +
        '.cmspon-reno-meta{color:#94a3b8;font-size:11px}' +
        '.cmspon-reno-dias{font-size:11px;font-weight:700;padding:2px 10px;border-radius:10px;white-space:nowrap}' +
        // toolbar
        '.cmspon-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}' +
        '.cmspon-toolbar select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px;font-family:inherit;cursor:pointer}' +
        '.cmspon-contador{color:#94a3b8;font-size:12px;margin-bottom:14px}' +
        '.cmspon-contador strong{color:#e2e8f0}' +
        // grid de tarjetas (patrocinadores)
        '.cmspon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}' +
        '.cmspon-card{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px 16px;cursor:pointer;transition:border-color .2s}' +
        '.cmspon-card:hover{border-color:#3b82f6}' +
        '.cmspon-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding-bottom:8px;border-bottom:1px solid #334155;margin-bottom:10px}' +
        '.cmspon-name{color:#f1f5f9;font-weight:600;font-size:14px}' +
        '.cmspon-sector{color:#94a3b8;font-size:11px;margin-top:2px}' +
        '.cmspon-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap;flex-shrink:0}' +
        '.cmspon-level{display:inline-block;font-size:10px;font-weight:600;padding:1px 8px;border-radius:8px;background:#334155;color:#cbd5e1}' +
        '.cmspon-card-meta{color:#94a3b8;font-size:12px;margin-top:8px;display:flex;flex-wrap:wrap;gap:4px 14px}' +
        '.cmspon-card-meta strong{color:#e2e8f0}' +
        // tabla
        '.cmspon-table-wrap{overflow-x:auto;border:1px solid #1e293b;border-radius:10px}' +
        '.cmspon-table{width:100%;border-collapse:collapse;font-size:13px}' +
        '.cmspon-table thead th{background:#1e293b;color:#94a3b8;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left;white-space:nowrap}' +
        '.cmspon-table tbody td{padding:10px 12px;color:#e2e8f0;border-top:1px solid #1e293b}' +
        '.cmspon-table tbody tr:hover{background:#1e293b}' +
        '.cmspon-table .right{text-align:right}' +
        // modal
        '.cmspon-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9500;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}' +
        '.cmspon-modal{background:#0f172a;border:1px solid #334155;border-radius:14px;width:100%;max-width:600px}' +
        '.cmspon-modal.wide{max-width:760px}' +
        '.cmspon-modal-header{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #1e293b}' +
        '.cmspon-modal-header h3{margin:0;color:#f1f5f9;font-size:17px}' +
        '.cmspon-modal-close{background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1}' +
        '.cmspon-modal-close:hover{color:#ef4444}' +
        '.cmspon-modal-body{padding:20px 22px}' +
        '.cmspon-modal-footer{display:flex;justify-content:space-between;gap:10px;padding:16px 22px;border-top:1px solid #1e293b;flex-wrap:wrap}' +
        '.cmspon-modal-footer .right-group{display:flex;gap:10px;flex-wrap:wrap;margin-left:auto}' +
        // formularios
        '.cmspon-form-group{margin-bottom:14px}' +
        '.cmspon-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
        '.cmspon-form-group label{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}' +
        '.cmspon-form-group input,.cmspon-form-group select,.cmspon-form-group textarea{width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit;box-sizing:border-box}' +
        '.cmspon-form-group textarea{min-height:80px;resize:vertical}' +
        '.cmspon-form-group input:focus,.cmspon-form-group select:focus,.cmspon-form-group textarea:focus{border-color:#3b82f6;outline:none}' +
        '.cmspon-check{display:flex;align-items:center;gap:8px}' +
        '.cmspon-check input{width:auto}' +
        // ficha
        '.cmspon-ficha-sec{margin-bottom:18px}' +
        '.cmspon-ficha-sec h4{margin:0 0 8px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.5px;font-weight:700}' +
        '.cmspon-ficha-line{color:#e2e8f0;font-size:13px;margin-bottom:4px}' +
        '.cmspon-ficha-line span{color:#94a3b8}' +
        '.cmspon-ficha-line a{color:#60a5fa;text-decoration:none}.cmspon-ficha-line a:hover{text-decoration:underline}' +
        '.cmspon-gestion{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 12px;margin-bottom:8px}' +
        '.cmspon-gestion-top{display:flex;justify-content:space-between;gap:8px;margin-bottom:4px}' +
        '.cmspon-gestion-tipo{font-size:10px;font-weight:600;padding:1px 8px;border-radius:8px;background:#334155;color:#cbd5e1}' +
        '.cmspon-gestion-fecha{color:#94a3b8;font-size:11px}' +
        '.cmspon-gestion-txt{color:#e2e8f0;font-size:13px;line-height:1.5}' +
        '.cmspon-mini{font-size:12px;color:#94a3b8}' +
        '@media(max-width:640px){.cmspon-tabs{overflow-x:auto;flex-wrap:nowrap}.cmspon-tab{white-space:nowrap}.cmspon-wrap{padding:16px 12px}.cmspon-form-row{grid-template-columns:1fr}}' +
    '</style>' +
    '<div class="cmspon-wrap">' +
        '<div class="cmspon-panel">' +
            '<div class="cmspon-header">' +
                '<h2>Patrocinadores</h2>' +
                '<div class="cmspon-sub">Captacion, contratos y control del patrocinio del club</div>' +
            '</div>' +
            '<div class="cmspon-tabs">' +
                '<button class="cmspon-tab active" id="cmspon-tab-panel" onclick="cmSponCambiarTab(\'panel\',this)">Panel</button>' +
                '<button class="cmspon-tab" id="cmspon-tab-patrocinadores" onclick="cmSponCambiarTab(\'patrocinadores\',this)">Patrocinadores</button>' +
                '<button class="cmspon-tab" id="cmspon-tab-contratos" onclick="cmSponCambiarTab(\'contratos\',this)">Contratos</button>' +
                '<button class="cmspon-tab" id="cmspon-tab-activos" onclick="cmSponCambiarTab(\'activos\',this)">Activos</button>' +
                '<button class="cmspon-tab" id="cmspon-tab-cobros" onclick="cmSponCambiarTab(\'cobros\',this)">Cobros</button>' +
                '<button class="cmspon-tab" id="cmspon-tab-contrap" onclick="cmSponCambiarTab(\'contrap\',this)">Contraprestaciones</button>' +
            '</div>' +
            '<div id="cmspon-tab-content"></div>' +
        '</div>' +
    '</div>';
}


// ========== CAMBIO DE PESTANA ==========
function cmSponCambiarTab(tab, btn) {
    cmSponTabActiva = tab;
    document.querySelectorAll('.cmspon-tab').forEach(function(t) { t.classList.remove('active'); });
    if (btn) { btn.classList.add('active'); }
    else { var el = document.getElementById('cmspon-tab-' + tab); if (el) el.classList.add('active'); }

    var cont = document.getElementById('cmspon-tab-content');
    if (!cont) return;
    cont.innerHTML = '<div class="cmspon-empty"><div class="icon">\u23F3</div><p>Cargando...</p></div>';

    // Aseguramos los datos cargados una sola vez; luego renderizamos la pestana.
    cmSponAsegurarDatos().then(function() {
        if (cmSponTabActiva !== tab) return; // el usuario cambio de pestana mientras cargaba
        if (tab === 'panel')           cmSponRenderTabPanel(cont);
        if (tab === 'patrocinadores')  cmSponRenderTabPatrocinadores(cont);
        if (tab === 'contratos')       cmSponRenderTabContratos(cont);
        if (tab === 'activos')         cmSponRenderTabActivos(cont);
        if (tab === 'cobros')          cmSponRenderTabCobros(cont);
        if (tab === 'contrap')         cmSponRenderTabContrap(cont);
    });
}


// ========== CARGA DE DATOS ==========
// Carga patrocinadores, contratos y gestiones del club una sola vez.
async function cmSponAsegurarDatos(forzar) {
    if (cmSponCargado && !forzar) return;
    try {
        var rs = await supabaseClient.from('cm_spon_sponsors')
            .select('*').eq('club_id', clubId)
            .order('name').range(0, 9999);
        cmSponSponsors = rs.data || [];

        var rc = await supabaseClient.from('cm_spon_contracts')
            .select('*').eq('club_id', clubId)
            .order('end_date', { ascending: true }).range(0, 9999);
        cmSponContracts = rc.data || [];

        var ri = await supabaseClient.from('cm_spon_interactions')
            .select('*').eq('club_id', clubId)
            .order('date', { ascending: false }).range(0, 9999);
        cmSponInteractions = ri.data || [];

        var ra = await supabaseClient.from('cm_spon_assets')
            .select('*').eq('club_id', clubId)
            .order('category').order('name').range(0, 9999);
        cmSponAssets = ra.data || [];

        var rg = await supabaseClient.from('cm_spon_asset_assignments')
            .select('*').eq('club_id', clubId).range(0, 9999);
        cmSponAssignments = rg.data || [];

        var rp = await supabaseClient.from('cm_spon_payments')
            .select('*').eq('club_id', clubId)
            .order('due_date', { ascending: true }).range(0, 9999);
        cmSponPayments = rp.data || [];

        var rd = await supabaseClient.from('cm_spon_deliverables')
            .select('*').eq('club_id', clubId)
            .order('due_date', { ascending: true }).range(0, 9999);
        cmSponDeliverables = rd.data || [];

        cmSponCargado = true;
    } catch (e) {
        console.error('[Patrocinadores] Error cargando datos:', e);
        cmSponSponsors = cmSponSponsors || [];
        cmSponContracts = cmSponContracts || [];
        cmSponInteractions = cmSponInteractions || [];
        cmSponAssets = cmSponAssets || [];
        cmSponAssignments = cmSponAssignments || [];
        cmSponPayments = cmSponPayments || [];
        cmSponDeliverables = cmSponDeliverables || [];
    }
}

// Recarga y vuelve a pintar la pestana activa.
async function cmSponRecargar() {
    await cmSponAsegurarDatos(true);
    cmSponCambiarTab(cmSponTabActiva);
}


// ============================================================
// PESTANA: PANEL  (KPIs + proximas renovaciones)
// ============================================================
function cmSponRenderTabPanel(cont) {
    var activos = cmSponSponsors.filter(function(s) { return s.stage === 'activo'; }).length;
    var negociando = cmSponSponsors.filter(function(s) { return s.stage === 'negociacion'; }).length;

    // Importe contratado: suma de contratos en estado 'activo'
    var totalCents = cmSponContracts
        .filter(function(c) { return c.status === 'activo'; })
        .reduce(function(acc, c) { return acc + (Number(c.amount_cents) || 0); }, 0);

    // Proximas renovaciones: contratos activos que terminan en <= 60 dias (incl. vencidos recientes)
    var renovaciones = cmSponContracts
        .filter(function(c) {
            if (c.status !== 'activo' || !c.end_date) return false;
            var d = cmSponDiasHasta(c.end_date);
            return d !== null && d <= 60;
        })
        .sort(function(a, b) { return (a.end_date || '').localeCompare(b.end_date || ''); });

    // Cobros (Fase 3): total previsto en plazos vs total cobrado
    var previstoCents = cmSponSumaPlazos(cmSponPayments);
    var cobradoCents = cmSponSumaPlazos(cmSponPayments.filter(function(p) { return p.status === 'cobrado'; }));
    var pctCobrado = previstoCents > 0 ? Math.round((cobradoCents / previstoCents) * 100) : 0;

    // Contraprestaciones pendientes (Fase 4)
    var contrapPend = cmSponDeliverables.filter(function(d) { return d.status !== 'entregado'; }).length;

    var html = '';

    // --- KPIs ---
    html += '<div class="cmspon-kpis">' +
        '<div class="cmspon-kpi accent"><div class="v">' + activos + '</div><div class="l">Patrocinadores activos</div></div>' +
        '<div class="cmspon-kpi"><div class="v" style="font-size:20px">' + cmSponMoney(totalCents) + '</div><div class="l">Importe contratado (activos)</div></div>' +
        '<div class="cmspon-kpi"><div class="v" style="font-size:20px">' + cmSponMoney(cobradoCents) + '</div><div class="l">Cobrado</div></div>' +
        '<div class="cmspon-kpi accent"><div class="v">' + pctCobrado + '%</div><div class="l">% cobrado</div></div>' +
        '<div class="cmspon-kpi warn"><div class="v">' + renovaciones.length + '</div><div class="l">Renovaciones &le; 60 dias</div></div>' +
        '<div class="cmspon-kpi warn"><div class="v">' + contrapPend + '</div><div class="l">Contraprestaciones pendientes</div></div>' +
    '</div>';

    // --- Proximas renovaciones ---
    html += '<div class="cmspon-block">' +
        '<h3>Proximas renovaciones</h3>';
    if (renovaciones.length === 0) {
        html += '<p class="cmspon-mini">No hay contratos activos que venzan en los proximos 60 dias.</p>';
    } else {
        renovaciones.forEach(function(c) {
            var d = cmSponDiasHasta(c.end_date);
            var color = d < 0 ? 'background:#7f1d1d;color:#fecaca'
                      : (d <= 15 ? 'background:#78350f;color:#fbbf24' : 'background:#1e3a5f;color:#60a5fa');
            var texto = d < 0 ? 'Vencido' : ('en ' + d + ' dias');
            html += '<div class="cmspon-reno-row">' +
                '<div>' +
                    '<div class="cmspon-reno-name">' + cmSponEsc(cmSponNombreDe(c.sponsor_id)) + '</div>' +
                    '<div class="cmspon-reno-meta">' + cmSponEsc(c.title || CMSPON_TYPE[c.type] || 'Contrato') +
                        ' \u00B7 vence ' + cmSponFecha(c.end_date) + ' \u00B7 ' + cmSponMoney(c.amount_cents) + '</div>' +
                '</div>' +
                '<span class="cmspon-reno-dias" style="' + color + '">' + texto + '</span>' +
            '</div>';
        });
    }
    html += '</div>';

    // --- Embudo (resumen) ---
    var conteoEmbudo = { potencial: 0, negociacion: 0, activo: 0, finalizado: 0 };
    cmSponSponsors.forEach(function(s) {
        if (conteoEmbudo[s.stage] !== undefined) conteoEmbudo[s.stage]++;
    });
    html += '<div class="cmspon-block">' +
        '<h3>Embudo de captacion</h3>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">';
    ['potencial', 'negociacion', 'activo', 'finalizado'].forEach(function(k) {
        html += '<div style="flex:1;min-width:120px;text-align:center;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px">' +
            '<div style="color:#f1f5f9;font-size:22px;font-weight:700">' + conteoEmbudo[k] + '</div>' +
            '<div style="color:#94a3b8;font-size:11px;margin-top:4px">' + CMSPON_STAGE[k] + '</div>' +
        '</div>';
    });
    html += '</div></div>';

    if (cmSponSponsors.length === 0) {
        html += '<p class="cmspon-mini" style="margin-top:8px">Aun no hay patrocinadores. Anade el primero desde la pestana <strong>Patrocinadores</strong>.</p>';
    }

    cont.innerHTML = html;
}


// ============================================================
// PESTANA: PATROCINADORES  (CRM + embudo)
// ============================================================
function cmSponRenderTabPatrocinadores(cont) {
    var lista = cmSponFiltrados();

    var html = '<div class="cmspon-toolbar">' +
        '<div>' +
            '<label class="cmspon-mini" style="margin-right:6px">Embudo:</label>' +
            '<select onchange="cmSponSetFiltroEmbudo(this.value)">' +
                '<option value="all"' + (cmSponFiltroEmbudo === 'all' ? ' selected' : '') + '>Todos</option>' +
                Object.keys(CMSPON_STAGE).map(function(k) {
                    return '<option value="' + k + '"' + (cmSponFiltroEmbudo === k ? ' selected' : '') + '>' + CMSPON_STAGE[k] + '</option>';
                }).join('') +
            '</select>' +
        '</div>';
    if (cmSponEditable()) {
        html += '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponFormSponsor()">+ Nuevo patrocinador</button>';
    }
    html += '</div>';

    html += '<div class="cmspon-contador">Mostrando <strong>' + lista.length + '</strong> de ' + cmSponSponsors.length + ' patrocinadores</div>';

    if (lista.length === 0) {
        html += '<div class="cmspon-empty"><div class="icon">\uD83E\uDD1D</div>' +
            '<h3>Sin patrocinadores</h3>' +
            '<p>' + (cmSponSponsors.length === 0
                ? 'Anade tu primer patrocinador para empezar a construir el embudo.'
                : 'Ningun patrocinador en esta fase del embudo.') + '</p></div>';
    } else {
        html += '<div class="cmspon-grid">';
        lista.forEach(function(s) {
            var nContratos = cmSponContratosDe(s.id).length;
            html += '<div class="cmspon-card" onclick="cmSponAbrirFicha(\'' + s.id + '\')">' +
                '<div class="cmspon-card-top">' +
                    '<div>' +
                        '<div class="cmspon-name">' + cmSponEsc(s.name) + '</div>' +
                        (s.sector ? '<div class="cmspon-sector">' + cmSponEsc(s.sector) + '</div>' : '') +
                    '</div>' +
                    '<span class="cmspon-badge" style="' + cmSponStageColor(s.stage) + '">' + (CMSPON_STAGE[s.stage] || s.stage) + '</span>' +
                '</div>' +
                '<div><span class="cmspon-level">' + (CMSPON_LEVEL[s.level] || s.level || '-') + '</span></div>' +
                '<div class="cmspon-card-meta">' +
                    (s.contact_name ? '<span>\uD83D\uDC64 ' + cmSponEsc(s.contact_name) + '</span>' : '') +
                    '<span>\uD83D\uDCC4 <strong>' + nContratos + '</strong> contrato' + (nContratos === 1 ? '' : 's') + '</span>' +
                '</div>' +
            '</div>';
        });
        html += '</div>';
    }

    cont.innerHTML = html;
}

function cmSponSetFiltroEmbudo(v) {
    cmSponFiltroEmbudo = v;
    var cont = document.getElementById('cmspon-tab-content');
    if (cont) cmSponRenderTabPatrocinadores(cont);
}


// ============================================================
// PESTANA: CONTRATOS
// ============================================================
function cmSponRenderTabContratos(cont) {
    var html = '<div class="cmspon-toolbar"><div></div>';
    if (cmSponEditable()) {
        var disabled = cmSponSponsors.length === 0;
        html += '<button class="cmspon-btn cmspon-btn-primary" ' + (disabled ? 'disabled style="opacity:.5;cursor:not-allowed"' : 'onclick="cmSponFormContrato()"') + '>+ Nuevo contrato</button>';
    }
    html += '</div>';

    if (cmSponSponsors.length === 0) {
        cont.innerHTML = html + '<div class="cmspon-empty"><div class="icon">\uD83D\uDCC4</div>' +
            '<h3>Crea antes un patrocinador</h3>' +
            '<p>Los contratos se asocian a un patrocinador. Anade uno en la pestana <strong>Patrocinadores</strong>.</p></div>';
        return;
    }

    if (cmSponContracts.length === 0) {
        cont.innerHTML = html + '<div class="cmspon-empty"><div class="icon">\uD83D\uDCC4</div>' +
            '<h3>Sin contratos</h3><p>Registra el primer acuerdo de patrocinio.</p></div>';
        return;
    }

    html += '<div class="cmspon-table-wrap"><table class="cmspon-table"><thead><tr>' +
        '<th>Patrocinador</th><th>Acuerdo</th><th>Tipo</th><th class="right">Importe</th>' +
        '<th>Vigencia</th><th>Estado</th><th></th>' +
        '</tr></thead><tbody>';

    cmSponContracts.forEach(function(c) {
        var vig = (c.start_date ? cmSponFecha(c.start_date) : '?') + ' \u2013 ' + (c.end_date ? cmSponFecha(c.end_date) : '?');
        var estadoColor = c.status === 'activo' ? 'background:#14532d;color:#4ade80'
                        : (c.status === 'rescindido' ? 'background:#7f1d1d;color:#fecaca'
                        : 'background:#1e293b;color:#94a3b8');
        html += '<tr>' +
            '<td>' + cmSponEsc(cmSponNombreDe(c.sponsor_id)) + '</td>' +
            '<td>' + cmSponEsc(c.title || '-') + (c.exclusivity ? ' <span class="cmspon-badge" style="background:#581c87;color:#e9d5ff">Exclusiva</span>' : '') + (c.document_url ? ' <a href="#" onclick="cmSponVerContrato(\'' + cmSponEsc(c.document_url) + '\');return false;" style="color:#60a5fa;font-size:11px">PDF</a>' : '') + '</td>' +
            '<td>' + (CMSPON_TYPE[c.type] || c.type || '-') + '</td>' +
            '<td class="right">' + cmSponMoney(c.amount_cents) + '</td>' +
            '<td class="cmspon-mini">' + vig + '</td>' +
            '<td><span class="cmspon-badge" style="' + estadoColor + '">' + (CMSPON_CSTATUS[c.status] || c.status) + '</span></td>' +
            '<td class="right">' + (cmSponEditable()
                ? '<button class="cmspon-btn cmspon-btn-secondary cmspon-btn-sm" onclick="cmSponFormContrato(\'' + c.id + '\')">Editar</button>'
                : '') + '</td>' +
        '</tr>';
    });

    html += '</tbody></table></div>';
    cont.innerHTML = html;
}


// ============================================================
// PESTANA: ACTIVOS  (catalogo de activos patrocinables)
// El estado libre/ocupado se deriva de las asignaciones a contratos activos.
// ============================================================
function cmSponRenderTabActivos(cont) {
    var totalValor = cmSponAssets
        .filter(function(a) { return a.active !== false; })
        .reduce(function(acc, a) { return acc + (Number(a.value_cents) || 0); }, 0);
    var ocupados = cmSponAssets.filter(function(a) { return cmSponAssetOcupadoPor(a.id); }).length;
    var enCatalogo = cmSponAssets.filter(function(a) { return a.active !== false; }).length;
    var libres = enCatalogo - cmSponAssets.filter(function(a) { return a.active !== false && cmSponAssetOcupadoPor(a.id); }).length;

    var html = '<div class="cmspon-kpis">' +
        '<div class="cmspon-kpi accent"><div class="v">' + enCatalogo + '</div><div class="l">Activos en catalogo</div></div>' +
        '<div class="cmspon-kpi"><div class="v">' + libres + '</div><div class="l">Libres</div></div>' +
        '<div class="cmspon-kpi warn"><div class="v">' + ocupados + '</div><div class="l">Ocupados</div></div>' +
        '<div class="cmspon-kpi"><div class="v" style="font-size:20px">' + cmSponMoney(totalValor) + '</div><div class="l">Valor del catalogo</div></div>' +
    '</div>';

    html += '<div class="cmspon-toolbar"><div></div>';
    if (cmSponEditable()) {
        html += '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponFormActivo()">+ Nuevo activo</button>';
    }
    html += '</div>';

    if (cmSponAssets.length === 0) {
        html += '<div class="cmspon-empty"><div class="icon">\uD83C\uDFDF\uFE0F</div>' +
            '<h3>Sin activos</h3>' +
            '<p>Crea los espacios patrocinables del club (frontal de camiseta, vallas, redes...) con su valoracion.</p></div>';
        cont.innerHTML = html;
        return;
    }

    html += '<div class="cmspon-table-wrap"><table class="cmspon-table"><thead><tr>' +
        '<th>Activo</th><th>Categoria</th><th class="right">Valoracion</th><th>Estado</th><th></th>' +
        '</tr></thead><tbody>';

    cmSponAssets.forEach(function(a) {
        var ocupadoPor = cmSponAssetOcupadoPor(a.id);
        var estadoHtml;
        if (a.active === false) {
            estadoHtml = '<span class="cmspon-badge" style="background:#1e293b;color:#94a3b8">Retirado</span>';
        } else if (ocupadoPor) {
            estadoHtml = '<span class="cmspon-badge" style="background:#7f1d1d;color:#fecaca">Ocupado</span>' +
                ' <span class="cmspon-mini">' + cmSponEsc(cmSponNombreDe(ocupadoPor.sponsor_id)) + '</span>';
        } else {
            estadoHtml = '<span class="cmspon-badge" style="background:#14532d;color:#4ade80">Libre</span>';
        }
        html += '<tr>' +
            '<td>' + cmSponEsc(a.name) + '</td>' +
            '<td>' + (CMSPON_CATEGORY[a.category] || a.category || '-') + '</td>' +
            '<td class="right">' + cmSponMoney(a.value_cents) + '</td>' +
            '<td>' + estadoHtml + '</td>' +
            '<td class="right">' + (cmSponEditable()
                ? '<button class="cmspon-btn cmspon-btn-secondary cmspon-btn-sm" onclick="cmSponFormActivo(\'' + a.id + '\')">Editar</button>'
                : '') + '</td>' +
        '</tr>';
    });

    html += '</tbody></table></div>';
    html += '<p class="cmspon-mini" style="margin-top:10px">El estado <strong>Libre / Ocupado</strong> se calcula segun las asignaciones a contratos activos. Los activos se vinculan a un contrato desde la pestana <strong>Contratos</strong>.</p>';
    cont.innerHTML = html;
}

// --- Formulario de activo (nuevo o editar) ---
function cmSponFormActivo(id) {
    if (!cmSponEditable()) return;
    var a = id ? cmSponAssets.find(function(x) { return x.id === id; }) : null;
    var titulo = a ? 'Editar activo' : 'Nuevo activo';

    function opts(map, sel) {
        return Object.keys(map).map(function(k) {
            return '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + map[k] + '</option>';
        }).join('');
    }

    var body =
        '<input type="hidden" id="cmspon-a-id" value="' + (a ? a.id : '') + '">' +
        '<div class="cmspon-form-group"><label>Nombre del activo *</label>' +
            '<input id="cmspon-a-name" value="' + cmSponEsc(a ? a.name : '') + '" placeholder="Ej: Frontal de camiseta primer equipo"></div>' +
        '<div class="cmspon-form-row">' +
            '<div class="cmspon-form-group"><label>Categoria</label>' +
                '<select id="cmspon-a-cat">' + opts(CMSPON_CATEGORY, a ? a.category : 'equipacion') + '</select></div>' +
            '<div class="cmspon-form-group"><label>Valoracion (EUR)</label>' +
                '<input id="cmspon-a-value" value="' + (a ? cmSponCentsToInput(a.value_cents) : '') + '" placeholder="0,00"></div>' +
        '</div>' +
        '<div class="cmspon-form-group cmspon-check">' +
            '<input type="checkbox" id="cmspon-a-active"' + (!a || a.active !== false ? ' checked' : '') + '>' +
            '<label style="margin:0">En catalogo (disponible para patrocinio)</label></div>' +
        '<div class="cmspon-form-group"><label>Notas</label>' +
            '<textarea id="cmspon-a-notes" style="min-height:60px">' + cmSponEsc(a ? (a.notes || '') : '') + '</textarea></div>';

    var footer = '';
    if (a) {
        footer += '<button class="cmspon-btn cmspon-btn-danger cmspon-btn-sm" onclick="cmSponBorrarActivo(\'' + a.id + '\')">Eliminar</button>';
    } else { footer += '<div></div>'; }
    footer += '<div class="right-group">' +
        '<button class="cmspon-btn cmspon-btn-secondary" onclick="cmSponCerrarModal()">Cancelar</button>' +
        '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponGuardarActivo()">Guardar</button>' +
    '</div>';

    cmSponMostrarModal(titulo, body, footer, false);
}

async function cmSponGuardarActivo() {
    if (!cmSponEditable()) return;
    var id = document.getElementById('cmspon-a-id').value;
    var name = document.getElementById('cmspon-a-name').value.trim();
    if (!name) { alert('El nombre del activo es obligatorio.'); return; }

    var payload = {
        club_id:     clubId,
        name:        name,
        category:    document.getElementById('cmspon-a-cat').value,
        value_cents: cmSponEurosToCents(document.getElementById('cmspon-a-value').value),
        active:      document.getElementById('cmspon-a-active').checked,
        notes:       document.getElementById('cmspon-a-notes').value.trim() || null,
        updated_at:  new Date().toISOString()
    };

    try {
        if (id) {
            var ru = await supabaseClient.from('cm_spon_assets').update(payload).eq('id', id);
            if (ru.error) throw ru.error;
        } else {
            payload.created_by = cmSponQuien();
            var ri = await supabaseClient.from('cm_spon_assets').insert(payload);
            if (ri.error) throw ri.error;
        }
        cmSponCerrarModal();
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error guardando activo:', e);
        alert('No se pudo guardar: ' + (e.message || e));
    }
}

async function cmSponBorrarActivo(id) {
    if (!cmSponEditable()) return;
    var ocupadoPor = cmSponAssetOcupadoPor(id);
    var msg = ocupadoPor
        ? 'Este activo esta asignado al contrato de ' + cmSponNombreDe(ocupadoPor.sponsor_id) + '. Al eliminarlo se quitara de ese contrato. Continuar?'
        : 'Eliminar este activo del catalogo?';
    if (!confirm(msg)) return;
    try {
        // ON DELETE CASCADE elimina tambien sus asignaciones.
        var r = await supabaseClient.from('cm_spon_assets').delete().eq('id', id);
        if (r.error) throw r.error;
        cmSponCerrarModal();
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error eliminando activo:', e);
        alert('No se pudo eliminar: ' + (e.message || e));
    }
}


// ============================================================
// PESTANA: COBROS  (calendario de plazos de cada contrato)
// El cobro se marca aqui (status 'cobrado' + paid_at). El Economico
// leera estos plazos cobrados como ingreso (Bridge, pendiente).
// ============================================================
function cmSponRenderTabCobros(cont) {
    // Solo tienen sentido los plazos de contratos existentes
    if (cmSponContracts.length === 0) {
        cont.innerHTML = '<div class="cmspon-empty"><div class="icon">\uD83D\uDCB6</div>' +
            '<h3>Sin contratos</h3>' +
            '<p>Los cobros son los plazos de un contrato. Crea antes un contrato en la pestana <strong>Contratos</strong>.</p></div>';
        return;
    }

    var previsto = cmSponSumaPlazos(cmSponPayments);
    var cobrado = cmSponSumaPlazos(cmSponPayments.filter(function(p) { return p.status === 'cobrado'; }));
    var pendiente = previsto - cobrado;
    var pct = previsto > 0 ? Math.round((cobrado / previsto) * 100) : 0;

    var html = '<div class="cmspon-kpis">' +
        '<div class="cmspon-kpi"><div class="v" style="font-size:20px">' + cmSponMoney(previsto) + '</div><div class="l">Previsto (plazos)</div></div>' +
        '<div class="cmspon-kpi accent"><div class="v" style="font-size:20px">' + cmSponMoney(cobrado) + '</div><div class="l">Cobrado</div></div>' +
        '<div class="cmspon-kpi warn"><div class="v" style="font-size:20px">' + cmSponMoney(pendiente) + '</div><div class="l">Pendiente</div></div>' +
        '<div class="cmspon-kpi accent"><div class="v">' + pct + '%</div><div class="l">% cobrado</div></div>' +
    '</div>';

    // Toolbar: filtro de estado + generar/añadir
    html += '<div class="cmspon-toolbar">' +
        '<div>' +
            '<label class="cmspon-mini" style="margin-right:6px">Estado:</label>' +
            '<select onchange="cmSponSetFiltroCobro(this.value)">' +
                '<option value="all"' + (cmSponFiltroCobro === 'all' ? ' selected' : '') + '>Todos</option>' +
                '<option value="pendiente"' + (cmSponFiltroCobro === 'pendiente' ? ' selected' : '') + '>Pendientes</option>' +
                '<option value="cobrado"' + (cmSponFiltroCobro === 'cobrado' ? ' selected' : '') + '>Cobrados</option>' +
            '</select>' +
        '</div>';
    if (cmSponEditable()) {
        html += '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="cmspon-btn cmspon-btn-secondary" onclick="cmSponGenerarPlazos()">Generar calendario</button>' +
            '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponFormPlazo()">+ Plazo manual</button>' +
        '</div>';
    }
    html += '</div>';

    // Lista de plazos filtrada
    var plazos = cmSponPayments.filter(function(p) {
        if (cmSponFiltroCobro !== 'all' && p.status !== cmSponFiltroCobro) return false;
        return true;
    }).sort(function(a, b) {
        return (a.due_date || '').localeCompare(b.due_date || '');
    });

    if (plazos.length === 0) {
        html += '<div class="cmspon-empty"><div class="icon">\uD83D\uDCC5</div>' +
            '<h3>Sin plazos</h3>' +
            '<p>Genera el calendario de cobros de un contrato o anade un plazo manual.</p></div>';
        cont.innerHTML = html;
        return;
    }

    html += '<div class="cmspon-table-wrap"><table class="cmspon-table"><thead><tr>' +
        '<th>Vencimiento</th><th>Patrocinador</th><th>Contrato</th><th class="right">Importe</th>' +
        '<th>Estado</th><th>Cobrado</th><th></th>' +
        '</tr></thead><tbody>';

    plazos.forEach(function(p) {
        var c = cmSponContratoDe(p.contract_id);
        var sponsorName = c ? cmSponNombreDe(c.sponsor_id) : '-';
        var contratoName = c ? (c.title || CMSPON_TYPE[c.type] || 'Contrato') : '-';

        var cobradoYa = p.status === 'cobrado';
        var dias = cmSponDiasHasta(p.due_date);
        var vencido = !cobradoYa && dias !== null && dias < 0;

        var estadoHtml = cobradoYa
            ? '<span class="cmspon-badge" style="background:#14532d;color:#4ade80">Cobrado</span>'
            : (vencido
                ? '<span class="cmspon-badge" style="background:#7f1d1d;color:#fecaca">Vencido</span>'
                : '<span class="cmspon-badge" style="background:#1e3a5f;color:#60a5fa">Pendiente</span>');

        var accion = '';
        if (cmSponEditable()) {
            if (!cobradoYa) {
                accion = '<button class="cmspon-btn cmspon-btn-primary cmspon-btn-sm" onclick="cmSponMarcarCobrado(\'' + p.id + '\')">Cobrar</button> ';
            }
            accion += '<button class="cmspon-btn cmspon-btn-secondary cmspon-btn-sm" onclick="cmSponFormPlazo(\'' + p.id + '\')">Editar</button>';
        }

        html += '<tr>' +
            '<td>' + cmSponFecha(p.due_date) + '</td>' +
            '<td>' + cmSponEsc(sponsorName) + '</td>' +
            '<td class="cmspon-mini">' + cmSponEsc(contratoName) + '</td>' +
            '<td class="right">' + cmSponMoney(p.amount_cents) + '</td>' +
            '<td>' + estadoHtml + '</td>' +
            '<td class="cmspon-mini">' + (cobradoYa ? cmSponFecha(p.paid_at) + (p.method ? ' \u00B7 ' + cmSponEsc(p.method) : '') : '-') + '</td>' +
            '<td class="right">' + accion + '</td>' +
        '</tr>';
    });

    html += '</tbody></table></div>';
    cont.innerHTML = html;
}

function cmSponSetFiltroCobro(v) {
    cmSponFiltroCobro = v;
    var cont = document.getElementById('cmspon-tab-content');
    if (cont) cmSponRenderTabCobros(cont);
}

// --- Generador de calendario de plazos ---
// Reparte el importe de un contrato en N plazos con una periodicidad.
function cmSponGenerarPlazos() {
    if (!cmSponEditable()) return;
    if (cmSponContracts.length === 0) { alert('Crea antes un contrato.'); return; }

    var contratoOpts = cmSponContracts.map(function(c) {
        return '<option value="' + c.id + '">' + cmSponEsc(cmSponNombreDe(c.sponsor_id)) +
            ' \u2014 ' + cmSponEsc(c.title || CMSPON_TYPE[c.type] || 'Contrato') +
            ' (' + cmSponMoney(c.amount_cents) + ')</option>';
    }).join('');

    var body =
        '<div class="cmspon-form-group"><label>Contrato</label>' +
            '<select id="cmspon-gen-contract" onchange="cmSponGenPreset()">' + contratoOpts + '</select></div>' +
        '<div class="cmspon-form-row">' +
            '<div class="cmspon-form-group"><label>Numero de plazos</label>' +
                '<input type="number" id="cmspon-gen-n" value="1" min="1" max="60"></div>' +
            '<div class="cmspon-form-group"><label>Periodicidad</label>' +
                '<select id="cmspon-gen-freq">' +
                    '<option value="unico">Pago unico</option>' +
                    '<option value="mensual" selected>Mensual</option>' +
                    '<option value="trimestral">Trimestral</option>' +
                    '<option value="semestral">Semestral</option>' +
                    '<option value="anual">Anual</option>' +
                '</select></div>' +
        '</div>' +
        '<div class="cmspon-form-row">' +
            '<div class="cmspon-form-group"><label>Importe total (EUR)</label>' +
                '<input id="cmspon-gen-total" placeholder="0,00"></div>' +
            '<div class="cmspon-form-group"><label>Primera fecha</label>' +
                '<input type="date" id="cmspon-gen-first" value="' + cmSponHoy() + '"></div>' +
        '</div>' +
        '<p class="cmspon-mini">El importe se repartira a partes iguales entre los plazos (el ultimo ajusta el redondeo). Los plazos se crean como <strong>pendientes</strong>.</p>';

    var footer = '<div></div><div class="right-group">' +
        '<button class="cmspon-btn cmspon-btn-secondary" onclick="cmSponCerrarModal()">Cancelar</button>' +
        '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponGuardarGenerados()">Generar</button>' +
    '</div>';

    cmSponMostrarModal('Generar calendario de cobros', body, footer, false);
    cmSponGenPreset(); // precarga importe y fecha del contrato elegido
}

// Precarga importe total y primera fecha segun el contrato seleccionado.
function cmSponGenPreset() {
    var sel = document.getElementById('cmspon-gen-contract');
    if (!sel) return;
    var c = cmSponContratoDe(sel.value);
    if (!c) return;
    var totalInput = document.getElementById('cmspon-gen-total');
    var firstInput = document.getElementById('cmspon-gen-first');
    if (totalInput) totalInput.value = cmSponCentsToInput(c.amount_cents);
    if (firstInput && c.start_date) firstInput.value = c.start_date;
}

// Suma meses a una fecha 'YYYY-MM-DD' y devuelve 'YYYY-MM-DD'
function cmSponSumarMeses(fecha, meses) {
    var d = new Date(fecha + 'T12:00:00');
    d.setMonth(d.getMonth() + meses);
    return d.toISOString().slice(0, 10);
}

async function cmSponGuardarGenerados() {
    if (!cmSponEditable()) return;
    var contractId = document.getElementById('cmspon-gen-contract').value;
    var n = parseInt(document.getElementById('cmspon-gen-n').value, 10) || 1;
    var freq = document.getElementById('cmspon-gen-freq').value;
    var totalCents = cmSponEurosToCents(document.getElementById('cmspon-gen-total').value);
    var first = document.getElementById('cmspon-gen-first').value || cmSponHoy();
    if (n < 1) n = 1;
    if (freq === 'unico') n = 1;

    var pasoMeses = { mensual: 1, trimestral: 3, semestral: 6, anual: 12, unico: 0 }[freq] || 0;

    // Reparto a partes iguales; el ultimo plazo absorbe el redondeo.
    var base = Math.floor(totalCents / n);
    var rows = [];
    var acumulado = 0;
    for (var i = 0; i < n; i++) {
        var importe = (i === n - 1) ? (totalCents - acumulado) : base;
        acumulado += importe;
        rows.push({
            club_id:      clubId,
            contract_id:  contractId,
            due_date:     cmSponSumarMeses(first, pasoMeses * i),
            amount_cents: importe,
            status:       'pendiente',
            created_by:   cmSponQuien()
        });
    }

    try {
        var r = await supabaseClient.from('cm_spon_payments').insert(rows);
        if (r.error) throw r.error;
        cmSponCerrarModal();
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error generando plazos:', e);
        alert('No se pudieron generar los plazos: ' + (e.message || e));
    }
}

// --- Plazo manual (nuevo o editar) ---
function cmSponFormPlazo(id) {
    if (!cmSponEditable()) return;
    if (cmSponContracts.length === 0) { alert('Crea antes un contrato.'); return; }
    var p = id ? cmSponPayments.find(function(x) { return x.id === id; }) : null;
    var titulo = p ? 'Editar plazo' : 'Nuevo plazo';

    var contratoOpts = cmSponContracts.map(function(c) {
        var sel = p && p.contract_id === c.id ? ' selected' : '';
        return '<option value="' + c.id + '"' + sel + '>' + cmSponEsc(cmSponNombreDe(c.sponsor_id)) +
            ' \u2014 ' + cmSponEsc(c.title || CMSPON_TYPE[c.type] || 'Contrato') + '</option>';
    }).join('');

    var cobrado = p && p.status === 'cobrado';

    var body =
        '<input type="hidden" id="cmspon-p-id" value="' + (p ? p.id : '') + '">' +
        '<div class="cmspon-form-group"><label>Contrato</label>' +
            '<select id="cmspon-p-contract">' + contratoOpts + '</select></div>' +
        '<div class="cmspon-form-row">' +
            '<div class="cmspon-form-group"><label>Vencimiento</label>' +
                '<input type="date" id="cmspon-p-due" value="' + (p && p.due_date ? p.due_date : cmSponHoy()) + '"></div>' +
            '<div class="cmspon-form-group"><label>Importe (EUR)</label>' +
                '<input id="cmspon-p-amount" value="' + (p ? cmSponCentsToInput(p.amount_cents) : '') + '" placeholder="0,00"></div>' +
        '</div>' +
        '<div class="cmspon-form-group cmspon-check">' +
            '<input type="checkbox" id="cmspon-p-cobrado"' + (cobrado ? ' checked' : '') + ' onchange="cmSponTogglePagoCampos()">' +
            '<label style="margin:0">Cobrado</label></div>' +
        '<div id="cmspon-p-cobro-campos" style="' + (cobrado ? '' : 'display:none') + '">' +
            '<div class="cmspon-form-row">' +
                '<div class="cmspon-form-group"><label>Fecha de cobro</label>' +
                    '<input type="date" id="cmspon-p-paid" value="' + (p && p.paid_at ? p.paid_at : cmSponHoy()) + '"></div>' +
                '<div class="cmspon-form-group"><label>Forma de cobro</label>' +
                    '<input id="cmspon-p-method" value="' + cmSponEsc(p ? (p.method || '') : '') + '" placeholder="Transferencia, efectivo..."></div>' +
            '</div>' +
        '</div>' +
        '<div class="cmspon-form-group"><label>Notas</label>' +
            '<textarea id="cmspon-p-notes" style="min-height:50px">' + cmSponEsc(p ? (p.notes || '') : '') + '</textarea></div>';

    var footer = '';
    if (p) {
        footer += '<button class="cmspon-btn cmspon-btn-danger cmspon-btn-sm" onclick="cmSponBorrarPlazo(\'' + p.id + '\')">Eliminar</button>';
    } else { footer += '<div></div>'; }
    footer += '<div class="right-group">' +
        '<button class="cmspon-btn cmspon-btn-secondary" onclick="cmSponCerrarModal()">Cancelar</button>' +
        '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponGuardarPlazo()">Guardar</button>' +
    '</div>';

    cmSponMostrarModal(titulo, body, footer, false);
}

function cmSponTogglePagoCampos() {
    var ch = document.getElementById('cmspon-p-cobrado');
    var campos = document.getElementById('cmspon-p-cobro-campos');
    if (ch && campos) campos.style.display = ch.checked ? '' : 'none';
}

async function cmSponGuardarPlazo() {
    if (!cmSponEditable()) return;
    var id = document.getElementById('cmspon-p-id').value;
    var cobrado = document.getElementById('cmspon-p-cobrado').checked;

    var payload = {
        club_id:      clubId,
        contract_id:  document.getElementById('cmspon-p-contract').value,
        due_date:     document.getElementById('cmspon-p-due').value || null,
        amount_cents: cmSponEurosToCents(document.getElementById('cmspon-p-amount').value),
        status:       cobrado ? 'cobrado' : 'pendiente',
        paid_at:      cobrado ? (document.getElementById('cmspon-p-paid').value || cmSponHoy()) : null,
        method:       cobrado ? (document.getElementById('cmspon-p-method').value.trim() || null) : null,
        notes:        document.getElementById('cmspon-p-notes').value.trim() || null,
        updated_at:   new Date().toISOString()
    };

    try {
        if (id) {
            var ru = await supabaseClient.from('cm_spon_payments').update(payload).eq('id', id);
            if (ru.error) throw ru.error;
        } else {
            payload.created_by = cmSponQuien();
            var ri = await supabaseClient.from('cm_spon_payments').insert(payload);
            if (ri.error) throw ri.error;
        }
        cmSponCerrarModal();
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error guardando plazo:', e);
        alert('No se pudo guardar: ' + (e.message || e));
    }
}

async function cmSponBorrarPlazo(id) {
    if (!cmSponEditable()) return;
    if (!confirm('Eliminar este plazo de cobro?')) return;
    try {
        var r = await supabaseClient.from('cm_spon_payments').delete().eq('id', id);
        if (r.error) throw r.error;
        cmSponCerrarModal();
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error eliminando plazo:', e);
        alert('No se pudo eliminar: ' + (e.message || e));
    }
}

// Marca un plazo como cobrado con un pequeño modal (fecha + forma de cobro).
function cmSponMarcarCobrado(id) {
    if (!cmSponEditable()) return;
    var p = cmSponPayments.find(function(x) { return x.id === id; });
    if (!p) return;
    var c = cmSponContratoDe(p.contract_id);

    var body =
        '<input type="hidden" id="cmspon-mc-id" value="' + id + '">' +
        '<p class="cmspon-mini" style="margin-top:0">' + cmSponEsc(c ? cmSponNombreDe(c.sponsor_id) : '') +
            ' \u00B7 ' + cmSponMoney(p.amount_cents) + ' \u00B7 vence ' + cmSponFecha(p.due_date) + '</p>' +
        '<div class="cmspon-form-row">' +
            '<div class="cmspon-form-group"><label>Fecha de cobro</label>' +
                '<input type="date" id="cmspon-mc-paid" value="' + cmSponHoy() + '"></div>' +
            '<div class="cmspon-form-group"><label>Forma de cobro</label>' +
                '<input id="cmspon-mc-method" placeholder="Transferencia, efectivo..."></div>' +
        '</div>';

    var footer = '<div></div><div class="right-group">' +
        '<button class="cmspon-btn cmspon-btn-secondary" onclick="cmSponCerrarModal()">Cancelar</button>' +
        '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponConfirmarCobrado()">Confirmar cobro</button>' +
    '</div>';

    cmSponMostrarModal('Registrar cobro', body, footer, false);
}

async function cmSponConfirmarCobrado() {
    if (!cmSponEditable()) return;
    var id = document.getElementById('cmspon-mc-id').value;
    var payload = {
        status:     'cobrado',
        paid_at:    document.getElementById('cmspon-mc-paid').value || cmSponHoy(),
        method:     document.getElementById('cmspon-mc-method').value.trim() || null,
        updated_at: new Date().toISOString()
    };
    try {
        var r = await supabaseClient.from('cm_spon_payments').update(payload).eq('id', id);
        if (r.error) throw r.error;
        cmSponCerrarModal();
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error registrando cobro:', e);
        alert('No se pudo registrar el cobro: ' + (e.message || e));
    }
}


// ============================================================
// PESTANA: CONTRAPRESTACIONES  (checklist de lo que entrega el club)
// ============================================================
function cmSponRenderTabContrap(cont) {
    if (cmSponContracts.length === 0) {
        cont.innerHTML = '<div class="cmspon-empty"><div class="icon">\uD83D\uDCCB</div>' +
            '<h3>Sin contratos</h3>' +
            '<p>Las contraprestaciones son lo que el club entrega por cada contrato. Crea antes un contrato en la pestana <strong>Contratos</strong>.</p></div>';
        return;
    }

    var total = cmSponDeliverables.length;
    var entregadas = cmSponDeliverables.filter(function(d) { return d.status === 'entregado'; }).length;
    var pendientes = total - entregadas;
    var pct = total > 0 ? Math.round((entregadas / total) * 100) : 0;

    var html = '<div class="cmspon-kpis">' +
        '<div class="cmspon-kpi accent"><div class="v">' + total + '</div><div class="l">Contraprestaciones</div></div>' +
        '<div class="cmspon-kpi warn"><div class="v">' + pendientes + '</div><div class="l">Pendientes</div></div>' +
        '<div class="cmspon-kpi"><div class="v">' + entregadas + '</div><div class="l">Entregadas</div></div>' +
        '<div class="cmspon-kpi accent"><div class="v">' + pct + '%</div><div class="l">% cumplido</div></div>' +
    '</div>';

    html += '<div class="cmspon-toolbar">' +
        '<div>' +
            '<label class="cmspon-mini" style="margin-right:6px">Estado:</label>' +
            '<select onchange="cmSponSetFiltroDeliv(this.value)">' +
                '<option value="all"' + (cmSponFiltroDeliv === 'all' ? ' selected' : '') + '>Todas</option>' +
                '<option value="pendiente"' + (cmSponFiltroDeliv === 'pendiente' ? ' selected' : '') + '>Pendientes</option>' +
                '<option value="entregado"' + (cmSponFiltroDeliv === 'entregado' ? ' selected' : '') + '>Entregadas</option>' +
            '</select>' +
        '</div>';
    if (cmSponEditable()) {
        html += '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponFormContrap()">+ Nueva contraprestacion</button>';
    }
    html += '</div>';

    var lista = cmSponDeliverables.filter(function(d) {
        if (cmSponFiltroDeliv !== 'all' && d.status !== cmSponFiltroDeliv && !(cmSponFiltroDeliv === 'pendiente' && d.status !== 'entregado')) return false;
        return true;
    });

    if (lista.length === 0) {
        html += '<div class="cmspon-empty"><div class="icon">\uD83E\uDD1D</div>' +
            '<h3>Sin contraprestaciones</h3>' +
            '<p>Anade lo que el club se compromete a entregar a cada patrocinador (logo, vallas, posts en redes...).</p></div>';
        cont.innerHTML = html;
        return;
    }

    html += '<div class="cmspon-table-wrap"><table class="cmspon-table"><thead><tr>' +
        '<th>Patrocinador</th><th>Contrato</th><th>Contraprestacion</th><th>Fecha objetivo</th>' +
        '<th>Estado</th><th></th>' +
        '</tr></thead><tbody>';

    lista.forEach(function(d) {
        var c = cmSponContratoDe(d.contract_id);
        var sponsorName = c ? cmSponNombreDe(c.sponsor_id) : '-';
        var contratoName = c ? (c.title || CMSPON_TYPE[c.type] || 'Contrato') : '-';

        var entregada = d.status === 'entregado';
        var dias = cmSponDiasHasta(d.due_date);
        var vencida = !entregada && dias !== null && dias < 0;

        var estadoHtml = entregada
            ? '<span class="cmspon-badge" style="background:#14532d;color:#4ade80">Entregada</span>' +
                (d.delivered_at ? ' <span class="cmspon-mini">' + cmSponFecha(d.delivered_at) + '</span>' : '')
            : (vencida
                ? '<span class="cmspon-badge" style="background:#7f1d1d;color:#fecaca">Vencida</span>'
                : '<span class="cmspon-badge" style="background:#1e3a5f;color:#60a5fa">Pendiente</span>');

        var accion = '';
        if (cmSponEditable()) {
            accion = entregada
                ? '<button class="cmspon-btn cmspon-btn-secondary cmspon-btn-sm" onclick="cmSponToggleContrap(\'' + d.id + '\',false)">Reabrir</button> '
                : '<button class="cmspon-btn cmspon-btn-primary cmspon-btn-sm" onclick="cmSponToggleContrap(\'' + d.id + '\',true)">Marcar entregada</button> ';
            accion += '<button class="cmspon-btn cmspon-btn-secondary cmspon-btn-sm" onclick="cmSponFormContrap(\'' + d.id + '\')">Editar</button>';
        }

        html += '<tr>' +
            '<td>' + cmSponEsc(sponsorName) + '</td>' +
            '<td class="cmspon-mini">' + cmSponEsc(contratoName) + '</td>' +
            '<td>' + cmSponEsc(d.description) + '</td>' +
            '<td class="cmspon-mini">' + (d.due_date ? cmSponFecha(d.due_date) : '-') + '</td>' +
            '<td>' + estadoHtml + '</td>' +
            '<td class="right" style="white-space:nowrap">' + accion + '</td>' +
        '</tr>';
    });

    html += '</tbody></table></div>';
    cont.innerHTML = html;
}

function cmSponSetFiltroDeliv(v) {
    cmSponFiltroDeliv = v;
    var cont = document.getElementById('cmspon-tab-content');
    if (cont) cmSponRenderTabContrap(cont);
}

// Marca entregada / reabre una contraprestacion.
async function cmSponToggleContrap(id, entregar) {
    if (!cmSponEditable()) return;
    var payload = {
        status:       entregar ? 'entregado' : 'pendiente',
        delivered_at: entregar ? cmSponHoy() : null,
        updated_at:   new Date().toISOString()
    };
    try {
        var r = await supabaseClient.from('cm_spon_deliverables').update(payload).eq('id', id);
        if (r.error) throw r.error;
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error actualizando contraprestacion:', e);
        alert('No se pudo actualizar: ' + (e.message || e));
    }
}

// --- Formulario de contraprestacion (nueva o editar) ---
function cmSponFormContrap(id) {
    if (!cmSponEditable()) return;
    if (cmSponContracts.length === 0) { alert('Crea antes un contrato.'); return; }
    var d = id ? cmSponDeliverables.find(function(x) { return x.id === id; }) : null;
    var titulo = d ? 'Editar contraprestacion' : 'Nueva contraprestacion';

    var contratoOpts = cmSponContracts.map(function(c) {
        var sel = d && d.contract_id === c.id ? ' selected' : '';
        return '<option value="' + c.id + '"' + sel + '>' + cmSponEsc(cmSponNombreDe(c.sponsor_id)) +
            ' \u2014 ' + cmSponEsc(c.title || CMSPON_TYPE[c.type] || 'Contrato') + '</option>';
    }).join('');

    var entregada = d && d.status === 'entregado';

    var body =
        '<input type="hidden" id="cmspon-d-id" value="' + (d ? d.id : '') + '">' +
        '<div class="cmspon-form-group"><label>Contrato</label>' +
            '<select id="cmspon-d-contract">' + contratoOpts + '</select></div>' +
        '<div class="cmspon-form-group"><label>Contraprestacion *</label>' +
            '<input id="cmspon-d-desc" value="' + cmSponEsc(d ? d.description : '') + '" placeholder="Ej: Logo en frontal de camiseta"></div>' +
        '<div class="cmspon-form-group"><label>Fecha objetivo (opcional)</label>' +
            '<input type="date" id="cmspon-d-due" value="' + (d && d.due_date ? d.due_date : '') + '"></div>' +
        '<div class="cmspon-form-group cmspon-check">' +
            '<input type="checkbox" id="cmspon-d-entregada"' + (entregada ? ' checked' : '') + ' onchange="cmSponToggleDelivCampo()">' +
            '<label style="margin:0">Entregada</label></div>' +
        '<div id="cmspon-d-deliv-campo" style="' + (entregada ? '' : 'display:none') + '">' +
            '<div class="cmspon-form-group"><label>Fecha de entrega</label>' +
                '<input type="date" id="cmspon-d-delivered" value="' + (d && d.delivered_at ? d.delivered_at : cmSponHoy()) + '"></div>' +
        '</div>' +
        '<div class="cmspon-form-group"><label>Notas</label>' +
            '<textarea id="cmspon-d-notes" style="min-height:50px">' + cmSponEsc(d ? (d.notes || '') : '') + '</textarea></div>';

    var footer = '';
    if (d) {
        footer += '<button class="cmspon-btn cmspon-btn-danger cmspon-btn-sm" onclick="cmSponBorrarContrap(\'' + d.id + '\')">Eliminar</button>';
    } else { footer += '<div></div>'; }
    footer += '<div class="right-group">' +
        '<button class="cmspon-btn cmspon-btn-secondary" onclick="cmSponCerrarModal()">Cancelar</button>' +
        '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponGuardarContrap()">Guardar</button>' +
    '</div>';

    cmSponMostrarModal(titulo, body, footer, false);
}

function cmSponToggleDelivCampo() {
    var ch = document.getElementById('cmspon-d-entregada');
    var campo = document.getElementById('cmspon-d-deliv-campo');
    if (ch && campo) campo.style.display = ch.checked ? '' : 'none';
}

async function cmSponGuardarContrap() {
    if (!cmSponEditable()) return;
    var id = document.getElementById('cmspon-d-id').value;
    var desc = document.getElementById('cmspon-d-desc').value.trim();
    if (!desc) { alert('Describe la contraprestacion.'); return; }
    var entregada = document.getElementById('cmspon-d-entregada').checked;

    var payload = {
        club_id:      clubId,
        contract_id:  document.getElementById('cmspon-d-contract').value,
        description:  desc,
        due_date:     document.getElementById('cmspon-d-due').value || null,
        status:       entregada ? 'entregado' : 'pendiente',
        delivered_at: entregada ? (document.getElementById('cmspon-d-delivered').value || cmSponHoy()) : null,
        notes:        document.getElementById('cmspon-d-notes').value.trim() || null,
        updated_at:   new Date().toISOString()
    };

    try {
        if (id) {
            var ru = await supabaseClient.from('cm_spon_deliverables').update(payload).eq('id', id);
            if (ru.error) throw ru.error;
        } else {
            payload.created_by = cmSponQuien();
            var ri = await supabaseClient.from('cm_spon_deliverables').insert(payload);
            if (ri.error) throw ri.error;
        }
        cmSponCerrarModal();
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error guardando contraprestacion:', e);
        alert('No se pudo guardar: ' + (e.message || e));
    }
}

async function cmSponBorrarContrap(id) {
    if (!cmSponEditable()) return;
    if (!confirm('Eliminar esta contraprestacion?')) return;
    try {
        var r = await supabaseClient.from('cm_spon_deliverables').delete().eq('id', id);
        if (r.error) throw r.error;
        cmSponCerrarModal();
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error eliminando contraprestacion:', e);
        alert('No se pudo eliminar: ' + (e.message || e));
    }
}

// --- Renovar un contrato (Fase 4) ---
// Crea un contrato nuevo continuando del anterior (+1 ano) y marca el viejo
// como finalizado. Copia tipo, importe, exclusividad y contraprestaciones.
async function cmSponRenovarContrato(id) {
    if (!cmSponEditable()) return;
    var c = cmSponContratoDe(id);
    if (!c) return;
    if (!confirm('Renovar este contrato? Se creara uno nuevo por 1 ano a partir de su fecha de fin, y el actual pasara a Finalizado.')) return;

    // Fechas del nuevo contrato: arranca al dia siguiente del fin (o hoy) y dura 1 ano.
    var inicio = c.end_date ? cmSponSumarMeses(c.end_date, 0) : cmSponHoy();
    if (c.end_date) {
        var dIni = new Date(c.end_date + 'T12:00:00'); dIni.setDate(dIni.getDate() + 1);
        inicio = dIni.toISOString().slice(0, 10);
    }
    var fin = cmSponSumarMeses(inicio, 12);

    var nuevo = {
        club_id:            clubId,
        sponsor_id:         c.sponsor_id,
        title:              (c.title || 'Contrato') + ' (renovacion)',
        type:               c.type,
        amount_cents:       c.amount_cents,
        in_kind_desc:       c.in_kind_desc,
        start_date:         inicio,
        end_date:           fin,
        exclusivity:        c.exclusivity,
        exclusivity_sector: c.exclusivity_sector,
        status:             'activo',
        payment_terms:      c.payment_terms,
        counterparties:     c.counterparties,
        notes:              c.notes,
        created_by:         cmSponQuien()
    };

    try {
        var ri = await supabaseClient.from('cm_spon_contracts').insert(nuevo).select().single();
        if (ri.error) throw ri.error;
        // Marca el contrato anterior como finalizado
        var ru = await supabaseClient.from('cm_spon_contracts')
            .update({ status: 'finalizado', updated_at: new Date().toISOString() }).eq('id', id);
        if (ru.error) throw ru.error;
        cmSponCerrarModal();
        await cmSponRecargar();
        cmSponFormContrato(ri.data.id); // abre el nuevo para que ajustes lo que quieras
    } catch (e) {
        console.error('[Patrocinadores] Error renovando contrato:', e);
        alert('No se pudo renovar: ' + (e.message || e));
    }
}


// ============================================================
// FICHA DE PATROCINADOR (modal)
// Datos + historial de gestiones + contratos + acciones
// ============================================================
function cmSponAbrirFicha(id) {
    var s = cmSponSponsors.find(function(x) { return x.id === id; });
    if (!s) return;
    cmSponSponsorAbierto = id;

    var gestiones = cmSponGestionesDe(id);
    var contratos = cmSponContratosDe(id);
    var editable = cmSponEditable();

    var body = '';

    // --- Datos ---
    body += '<div class="cmspon-ficha-sec">' +
        '<h4>Datos</h4>' +
        '<div class="cmspon-ficha-line"><span>Sector:</span> ' + cmSponEsc(s.sector || '-') + '</div>' +
        '<div class="cmspon-ficha-line"><span>Nivel:</span> ' + (CMSPON_LEVEL[s.level] || s.level || '-') + '</div>' +
        '<div class="cmspon-ficha-line"><span>Fase:</span> ' + (CMSPON_STAGE[s.stage] || s.stage) + '</div>' +
        (s.website ? '<div class="cmspon-ficha-line"><span>Web:</span> <a href="' + cmSponEsc(s.website) + '" target="_blank" rel="noopener">' + cmSponEsc(s.website) + '</a></div>' : '') +
    '</div>';

    // --- Contacto ---
    body += '<div class="cmspon-ficha-sec"><h4>Contacto</h4>' +
        '<div class="cmspon-ficha-line"><span>Persona:</span> ' + cmSponEsc(s.contact_name || '-') + '</div>' +
        (s.contact_email ? '<div class="cmspon-ficha-line"><span>Email:</span> <a href="mailto:' + cmSponEsc(s.contact_email) + '">' + cmSponEsc(s.contact_email) + '</a></div>' : '') +
        (s.contact_phone ? '<div class="cmspon-ficha-line"><span>Telefono:</span> <a href="tel:' + cmSponEsc(s.contact_phone) + '">' + cmSponEsc(s.contact_phone) + '</a></div>' : '') +
    '</div>';

    if (s.notes) {
        body += '<div class="cmspon-ficha-sec"><h4>Notas</h4>' +
            '<div class="cmspon-ficha-line">' + cmSponEsc(s.notes).replace(/\n/g, '<br>') + '</div></div>';
    }

    // --- Contratos del patrocinador ---
    body += '<div class="cmspon-ficha-sec"><h4>Contratos (' + contratos.length + ')</h4>';
    if (contratos.length === 0) {
        body += '<p class="cmspon-mini">Sin contratos. Crealos desde la pestana Contratos.</p>';
    } else {
        contratos.forEach(function(c) {
            var activos = cmSponActivosDe(c.id);
            var cobradoC = cmSponCobradoDe(c.id);
            body += '<div class="cmspon-ficha-line">\u2022 ' + cmSponEsc(c.title || CMSPON_TYPE[c.type] || 'Contrato') +
                ' \u00B7 ' + cmSponMoney(c.amount_cents) +
                ' \u00B7 ' + (CMSPON_CSTATUS[c.status] || c.status) +
                (c.end_date ? ' \u00B7 vence ' + cmSponFecha(c.end_date) : '') +
                (cobradoC > 0 ? ' \u00B7 cobrado ' + cmSponMoney(cobradoC) : '') +
                (activos.length ? '<br><span class="cmspon-mini" style="margin-left:14px">Activos: ' +
                    activos.map(function(a) { return cmSponEsc(a.name); }).join(', ') + '</span>' : '') +
                '</div>';
        });
    }
    body += '</div>';

    // --- Historial de gestiones ---
    body += '<div class="cmspon-ficha-sec"><h4>Historial de gestiones (' + gestiones.length + ')</h4>';
    if (editable) {
        body += '<button class="cmspon-btn cmspon-btn-secondary cmspon-btn-sm" style="margin-bottom:10px" onclick="cmSponFormGestion(\'' + id + '\')">+ Anadir gestion</button>';
    }
    if (gestiones.length === 0) {
        body += '<p class="cmspon-mini">Aun no hay gestiones registradas.</p>';
    } else {
        gestiones.forEach(function(g) {
            body += '<div class="cmspon-gestion">' +
                '<div class="cmspon-gestion-top">' +
                    '<span class="cmspon-gestion-tipo">' + (CMSPON_ITYPE[g.type] || g.type) + '</span>' +
                    '<span class="cmspon-gestion-fecha">' + cmSponFecha(g.date) + '</span>' +
                '</div>' +
                '<div class="cmspon-gestion-txt">' + cmSponEsc(g.summary).replace(/\n/g, '<br>') + '</div>' +
            '</div>';
        });
    }
    body += '</div>';

    var footer = '';
    if (editable) {
        footer += '<button class="cmspon-btn cmspon-btn-danger cmspon-btn-sm" onclick="cmSponBorrarSponsor(\'' + id + '\')">Eliminar</button>';
        footer += '<div class="right-group">' +
            '<button class="cmspon-btn cmspon-btn-secondary" onclick="cmSponCerrarModal()">Cerrar</button>' +
            '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponFormSponsor(\'' + id + '\')">Editar datos</button>' +
        '</div>';
    } else {
        footer += '<div class="right-group"><button class="cmspon-btn cmspon-btn-secondary" onclick="cmSponCerrarModal()">Cerrar</button></div>';
    }

    cmSponMostrarModal(cmSponEsc(s.name), body, footer, true);
}


// ============================================================
// FORMULARIOS (modales)
// ============================================================

// --- Formulario de patrocinador (nuevo o editar) ---
function cmSponFormSponsor(id) {
    if (!cmSponEditable()) return;
    var s = id ? cmSponSponsors.find(function(x) { return x.id === id; }) : null;
    var titulo = s ? 'Editar patrocinador' : 'Nuevo patrocinador';

    function opts(map, sel) {
        return Object.keys(map).map(function(k) {
            return '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + map[k] + '</option>';
        }).join('');
    }

    var body =
        '<input type="hidden" id="cmspon-f-id" value="' + (s ? s.id : '') + '">' +
        '<div class="cmspon-form-group"><label>Nombre / empresa *</label>' +
            '<input id="cmspon-f-name" value="' + cmSponEsc(s ? s.name : '') + '" placeholder="Ej: Construcciones Garcia SL"></div>' +
        '<div class="cmspon-form-row">' +
            '<div class="cmspon-form-group"><label>Sector</label>' +
                '<input id="cmspon-f-sector" value="' + cmSponEsc(s ? (s.sector || '') : '') + '" placeholder="Ej: Construccion"></div>' +
            '<div class="cmspon-form-group"><label>Nivel</label>' +
                '<select id="cmspon-f-level">' + opts(CMSPON_LEVEL, s ? s.level : 'colaborador') + '</select></div>' +
        '</div>' +
        '<div class="cmspon-form-group"><label>Fase del embudo</label>' +
            '<select id="cmspon-f-stage">' + opts(CMSPON_STAGE, s ? s.stage : 'potencial') + '</select></div>' +
        '<div class="cmspon-form-row">' +
            '<div class="cmspon-form-group"><label>Persona de contacto</label>' +
                '<input id="cmspon-f-contact" value="' + cmSponEsc(s ? (s.contact_name || '') : '') + '"></div>' +
            '<div class="cmspon-form-group"><label>Telefono</label>' +
                '<input id="cmspon-f-phone" value="' + cmSponEsc(s ? (s.contact_phone || '') : '') + '"></div>' +
        '</div>' +
        '<div class="cmspon-form-row">' +
            '<div class="cmspon-form-group"><label>Email</label>' +
                '<input id="cmspon-f-email" value="' + cmSponEsc(s ? (s.contact_email || '') : '') + '"></div>' +
            '<div class="cmspon-form-group"><label>Web</label>' +
                '<input id="cmspon-f-web" value="' + cmSponEsc(s ? (s.website || '') : '') + '" placeholder="https://"></div>' +
        '</div>' +
        '<div class="cmspon-form-group"><label>Notas</label>' +
            '<textarea id="cmspon-f-notes">' + cmSponEsc(s ? (s.notes || '') : '') + '</textarea></div>';

    var footer = '<div></div><div class="right-group">' +
        '<button class="cmspon-btn cmspon-btn-secondary" onclick="cmSponCerrarModal()">Cancelar</button>' +
        '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponGuardarSponsor()">Guardar</button>' +
    '</div>';

    cmSponMostrarModal(titulo, body, footer, false);
}

async function cmSponGuardarSponsor() {
    if (!cmSponEditable()) return;
    var id = document.getElementById('cmspon-f-id').value;
    var name = document.getElementById('cmspon-f-name').value.trim();
    if (!name) { alert('El nombre es obligatorio.'); return; }

    var payload = {
        club_id:       clubId,
        name:          name,
        sector:        document.getElementById('cmspon-f-sector').value.trim() || null,
        level:         document.getElementById('cmspon-f-level').value,
        stage:         document.getElementById('cmspon-f-stage').value,
        contact_name:  document.getElementById('cmspon-f-contact').value.trim() || null,
        contact_phone: document.getElementById('cmspon-f-phone').value.trim() || null,
        contact_email: document.getElementById('cmspon-f-email').value.trim() || null,
        website:       document.getElementById('cmspon-f-web').value.trim() || null,
        notes:         document.getElementById('cmspon-f-notes').value.trim() || null,
        updated_at:    new Date().toISOString()
    };

    try {
        if (id) {
            var ru = await supabaseClient.from('cm_spon_sponsors').update(payload).eq('id', id);
            if (ru.error) throw ru.error;
        } else {
            payload.created_by = cmSponQuien();
            var ri = await supabaseClient.from('cm_spon_sponsors').insert(payload);
            if (ri.error) throw ri.error;
        }
        cmSponCerrarModal();
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error guardando patrocinador:', e);
        alert('No se pudo guardar: ' + (e.message || e));
    }
}

async function cmSponBorrarSponsor(id) {
    if (!cmSponEditable()) return;
    var nContratos = cmSponContratosDe(id).length;
    var msg = nContratos > 0
        ? 'Este patrocinador tiene ' + nContratos + ' contrato(s). Al eliminarlo se borraran tambien sus contratos y gestiones. Continuar?'
        : 'Eliminar este patrocinador y sus gestiones?';
    if (!confirm(msg)) return;
    try {
        // Las FK con ON DELETE CASCADE borran contratos y gestiones asociadas.
        var r = await supabaseClient.from('cm_spon_sponsors').delete().eq('id', id);
        if (r.error) throw r.error;
        cmSponCerrarModal();
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error eliminando patrocinador:', e);
        alert('No se pudo eliminar: ' + (e.message || e));
    }
}


// --- Formulario de contrato (nuevo o editar) ---
function cmSponFormContrato(id) {
    if (!cmSponEditable()) return;
    if (cmSponSponsors.length === 0) { alert('Crea antes un patrocinador.'); return; }
    var c = id ? cmSponContracts.find(function(x) { return x.id === id; }) : null;
    var titulo = c ? 'Editar contrato' : 'Nuevo contrato';

    var sponsorOpts = cmSponSponsors.map(function(s) {
        var sel = c && c.sponsor_id === s.id ? ' selected' : '';
        return '<option value="' + s.id + '"' + sel + '>' + cmSponEsc(s.name) + '</option>';
    }).join('');

    function opts(map, sel) {
        return Object.keys(map).map(function(k) {
            return '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + map[k] + '</option>';
        }).join('');
    }

    var body =
        '<input type="hidden" id="cmspon-c-id" value="' + (c ? c.id : '') + '">' +
        '<div class="cmspon-form-group"><label>Patrocinador *</label>' +
            '<select id="cmspon-c-sponsor">' + sponsorOpts + '</select></div>' +
        '<div class="cmspon-form-group"><label>Objeto del acuerdo</label>' +
            '<input id="cmspon-c-title" value="' + cmSponEsc(c ? (c.title || '') : '') + '" placeholder="Ej: Frontal de camiseta temporada 25/26"></div>' +
        '<div class="cmspon-form-row">' +
            '<div class="cmspon-form-group"><label>Tipo</label>' +
                '<select id="cmspon-c-type">' + opts(CMSPON_TYPE, c ? c.type : 'economico') + '</select></div>' +
            '<div class="cmspon-form-group"><label>Importe economico (EUR)</label>' +
                '<input id="cmspon-c-amount" value="' + (c ? cmSponCentsToInput(c.amount_cents) : '') + '" placeholder="0,00"></div>' +
        '</div>' +
        '<div class="cmspon-form-group"><label>Aportacion en especie (si aplica)</label>' +
            '<input id="cmspon-c-kind" value="' + cmSponEsc(c ? (c.in_kind_desc || '') : '') + '" placeholder="Ej: equipaciones, material..."></div>' +
        '<div class="cmspon-form-row">' +
            '<div class="cmspon-form-group"><label>Fecha inicio</label>' +
                '<input type="date" id="cmspon-c-start" value="' + (c && c.start_date ? c.start_date : '') + '"></div>' +
            '<div class="cmspon-form-group"><label>Fecha fin</label>' +
                '<input type="date" id="cmspon-c-end" value="' + (c && c.end_date ? c.end_date : '') + '"></div>' +
        '</div>' +
        '<div class="cmspon-form-group cmspon-check">' +
            '<input type="checkbox" id="cmspon-c-excl"' + (c && c.exclusivity ? ' checked' : '') + '>' +
            '<label style="margin:0">Exclusividad de sector</label></div>' +
        '<div class="cmspon-form-group"><label>Sector en exclusiva (si aplica)</label>' +
            '<input id="cmspon-c-excl-sector" value="' + cmSponEsc(c ? (c.exclusivity_sector || '') : '') + '"></div>' +
        '<div class="cmspon-form-group"><label>Estado</label>' +
            '<select id="cmspon-c-status">' + opts(CMSPON_CSTATUS, c ? c.status : 'activo') + '</select></div>' +
        '<div class="cmspon-form-group"><label>Forma de pago / plazos</label>' +
            '<textarea id="cmspon-c-payment" style="min-height:60px">' + cmSponEsc(c ? (c.payment_terms || '') : '') + '</textarea></div>' +
        '<div class="cmspon-form-group"><label>Contraprestaciones (que entrega el club)</label>' +
            '<textarea id="cmspon-c-counter" style="min-height:60px" placeholder="Ej: logo en camiseta, 4 vallas, posts en redes...">' + cmSponEsc(c ? (c.counterparties || '') : '') + '</textarea></div>' +
        cmSponContratoActivosHtml(c ? c.id : null) +
        '<div class="cmspon-form-group"><label>Contrato firmado (PDF)</label>' +
            (c && c.document_url
                ? '<div class="cmspon-mini" style="margin-bottom:6px">Documento subido. <a href="#" onclick="cmSponVerContrato(\'' + cmSponEsc(c.document_url) + '\');return false;" style="color:#60a5fa">Ver contrato</a></div>'
                : '') +
            '<input type="file" id="cmspon-c-file" accept="application/pdf,image/*">' +
            '<div class="cmspon-mini" style="margin-top:4px">' + (c && c.document_url ? 'Elige un archivo solo si quieres reemplazar el actual.' : 'Opcional. Se guarda en almacenamiento privado.') + '</div>' +
        '</div>' +
        '<div class="cmspon-form-group"><label>Notas</label>' +
            '<textarea id="cmspon-c-notes" style="min-height:60px">' + cmSponEsc(c ? (c.notes || '') : '') + '</textarea></div>';

    var footer = '';
    if (c) {
        footer += '<button class="cmspon-btn cmspon-btn-danger cmspon-btn-sm" onclick="cmSponBorrarContrato(\'' + c.id + '\')">Eliminar</button>';
        footer += ' <button class="cmspon-btn cmspon-btn-secondary cmspon-btn-sm" onclick="cmSponRenovarContrato(\'' + c.id + '\')">Renovar</button>';
    } else { footer += '<div></div>'; }
    footer += '<div class="right-group">' +
        '<button class="cmspon-btn cmspon-btn-secondary" onclick="cmSponCerrarModal()">Cancelar</button>' +
        '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponGuardarContrato()">Guardar</button>' +
    '</div>';

    cmSponMostrarModal(titulo, body, footer, false);
}

async function cmSponGuardarContrato() {
    if (!cmSponEditable()) return;
    var id = document.getElementById('cmspon-c-id').value;
    var sponsorId = document.getElementById('cmspon-c-sponsor').value;
    if (!sponsorId) { alert('Selecciona un patrocinador.'); return; }

    var payload = {
        club_id:            clubId,
        sponsor_id:         sponsorId,
        title:              document.getElementById('cmspon-c-title').value.trim() || null,
        type:               document.getElementById('cmspon-c-type').value,
        amount_cents:       cmSponEurosToCents(document.getElementById('cmspon-c-amount').value),
        in_kind_desc:       document.getElementById('cmspon-c-kind').value.trim() || null,
        start_date:         document.getElementById('cmspon-c-start').value || null,
        end_date:           document.getElementById('cmspon-c-end').value || null,
        exclusivity:        document.getElementById('cmspon-c-excl').checked,
        exclusivity_sector: document.getElementById('cmspon-c-excl-sector').value.trim() || null,
        status:             document.getElementById('cmspon-c-status').value,
        payment_terms:      document.getElementById('cmspon-c-payment').value.trim() || null,
        counterparties:     document.getElementById('cmspon-c-counter').value.trim() || null,
        notes:              document.getElementById('cmspon-c-notes').value.trim() || null,
        updated_at:         new Date().toISOString()
    };

    // Activos marcados en el formulario (checkboxes habilitados)
    var activosMarcados = Array.prototype.slice
        .call(document.querySelectorAll('.cmspon-c-asset:checked'))
        .map(function(ch) { return ch.value; });

    // Archivo de contrato firmado, si se ha elegido uno nuevo
    var fileEl = document.getElementById('cmspon-c-file');
    var nuevoArchivo = (fileEl && fileEl.files && fileEl.files[0]) ? fileEl.files[0] : null;

    try {
        // Si hay PDF nuevo, lo subimos primero y guardamos su ruta
        if (nuevoArchivo) {
            var b64 = await cmSponFileToBase64(nuevoArchivo);
            var up = await cmSponInvoke('eco-upload-receipt', {
                action: 'upload', file_base64: b64,
                media_type: nuevoArchivo.type || 'application/pdf', club_id: clubId
            });
            if (up && up.path) payload.document_url = up.path;
        }

        var contractId = id;
        if (id) {
            var ru = await supabaseClient.from('cm_spon_contracts').update(payload).eq('id', id);
            if (ru.error) throw ru.error;
        } else {
            payload.created_by = cmSponQuien();
            var ri = await supabaseClient.from('cm_spon_contracts').insert(payload).select().single();
            if (ri.error) throw ri.error;
            contractId = ri.data.id;
        }
        await cmSponSyncAsignaciones(contractId, activosMarcados);
        cmSponCerrarModal();
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error guardando contrato:', e);
        alert('No se pudo guardar: ' + (e.message || e));
    }
}

// Construye la seccion de activos patrocinables del formulario de contrato.
// Marca los ya asignados a ESTE contrato y deshabilita los ocupados por OTRO
// contrato activo (regla "no vender dos veces").
function cmSponContratoActivosHtml(contractId) {
    var enCatalogo = cmSponAssets.filter(function(a) { return a.active !== false; });
    if (enCatalogo.length === 0) {
        return '<div class="cmspon-form-group"><label>Activos patrocinables cubiertos</label>' +
            '<p class="cmspon-mini">Aun no hay activos en el catalogo. Crealos en la pestana <strong>Activos</strong>.</p></div>';
    }
    var asignadosAqui = contractId
        ? cmSponAsignacionesDe(contractId).map(function(a) { return a.asset_id; })
        : [];

    var filas = enCatalogo.map(function(a) {
        var marcado = asignadosAqui.indexOf(a.id) !== -1;
        var ocupadoPor = cmSponAssetOcupadoPor(a.id);
        // Ocupado por OTRO contrato activo distinto del que editamos -> bloqueado
        var bloqueado = ocupadoPor && ocupadoPor.id !== contractId;
        var nota = bloqueado
            ? ' <span class="cmspon-badge" style="background:#7f1d1d;color:#fecaca">Ocupado: ' + cmSponEsc(cmSponNombreDe(ocupadoPor.sponsor_id)) + '</span>'
            : '';
        return '<label class="cmspon-check" style="margin-bottom:6px;' + (bloqueado ? 'opacity:.6' : '') + '">' +
            '<input type="checkbox" class="cmspon-c-asset" value="' + a.id + '"' +
                (marcado ? ' checked' : '') + (bloqueado ? ' disabled' : '') + '>' +
            '<span>' + cmSponEsc(a.name) + ' <span class="cmspon-mini">(' + (CMSPON_CATEGORY[a.category] || a.category) +
                ' \u00B7 ' + cmSponMoney(a.value_cents) + ')</span>' + nota + '</span>' +
        '</label>';
    }).join('');

    return '<div class="cmspon-form-group"><label>Activos patrocinables cubiertos</label>' +
        '<div style="background:#1e293b;border:1px solid #334155;border-radius:6px;padding:10px 12px;max-height:200px;overflow-y:auto">' +
            filas +
        '</div></div>';
}

// Sincroniza las asignaciones de un contrato con la lista de activos marcados:
// inserta los nuevos y borra los que se han desmarcado.
async function cmSponSyncAsignaciones(contractId, assetIds) {
    if (!contractId) return;
    var actuales = cmSponAsignacionesDe(contractId);
    var actualesIds = actuales.map(function(a) { return a.asset_id; });

    // Borrar los desmarcados
    var paraBorrar = actuales.filter(function(a) { return assetIds.indexOf(a.asset_id) === -1; });
    for (var i = 0; i < paraBorrar.length; i++) {
        var rd = await supabaseClient.from('cm_spon_asset_assignments').delete().eq('id', paraBorrar[i].id);
        if (rd.error) throw rd.error;
    }

    // Insertar los nuevos
    var paraInsertar = assetIds.filter(function(aid) { return actualesIds.indexOf(aid) === -1; });
    if (paraInsertar.length > 0) {
        var rows = paraInsertar.map(function(aid) {
            return { club_id: clubId, asset_id: aid, contract_id: contractId, created_by: cmSponQuien() };
        });
        var rin = await supabaseClient.from('cm_spon_asset_assignments').insert(rows);
        if (rin.error) throw rin.error;
    }
}

async function cmSponBorrarContrato(id) {
    if (!cmSponEditable()) return;
    if (!confirm('Eliminar este contrato?')) return;
    try {
        var r = await supabaseClient.from('cm_spon_contracts').delete().eq('id', id);
        if (r.error) throw r.error;
        cmSponCerrarModal();
        await cmSponRecargar();
    } catch (e) {
        console.error('[Patrocinadores] Error eliminando contrato:', e);
        alert('No se pudo eliminar: ' + (e.message || e));
    }
}


// --- Formulario de gestion (historial CRM) ---
function cmSponFormGestion(sponsorId) {
    if (!cmSponEditable()) return;
    function opts(map, sel) {
        return Object.keys(map).map(function(k) {
            return '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + map[k] + '</option>';
        }).join('');
    }
    var body =
        '<input type="hidden" id="cmspon-g-sponsor" value="' + sponsorId + '">' +
        '<div class="cmspon-form-row">' +
            '<div class="cmspon-form-group"><label>Tipo</label>' +
                '<select id="cmspon-g-type">' + opts(CMSPON_ITYPE, 'llamada') + '</select></div>' +
            '<div class="cmspon-form-group"><label>Fecha</label>' +
                '<input type="date" id="cmspon-g-date" value="' + cmSponHoy() + '"></div>' +
        '</div>' +
        '<div class="cmspon-form-group"><label>Resumen *</label>' +
            '<textarea id="cmspon-g-summary" placeholder="Que se hablo, acuerdos, proximos pasos..."></textarea></div>';

    var footer = '<div></div><div class="right-group">' +
        '<button class="cmspon-btn cmspon-btn-secondary" onclick="cmSponAbrirFicha(\'' + sponsorId + '\')">Cancelar</button>' +
        '<button class="cmspon-btn cmspon-btn-primary" onclick="cmSponGuardarGestion()">Guardar gestion</button>' +
    '</div>';

    cmSponMostrarModal('Nueva gestion', body, footer, false);
}

async function cmSponGuardarGestion() {
    if (!cmSponEditable()) return;
    var sponsorId = document.getElementById('cmspon-g-sponsor').value;
    var summary = document.getElementById('cmspon-g-summary').value.trim();
    if (!summary) { alert('Escribe un resumen de la gestion.'); return; }

    var payload = {
        club_id:    clubId,
        sponsor_id: sponsorId,
        date:       document.getElementById('cmspon-g-date').value || cmSponHoy(),
        type:       document.getElementById('cmspon-g-type').value,
        summary:    summary,
        created_by: cmSponQuien()
    };

    try {
        var r = await supabaseClient.from('cm_spon_interactions').insert(payload);
        if (r.error) throw r.error;
        await cmSponAsegurarDatos(true);
        cmSponAbrirFicha(sponsorId); // vuelve a la ficha, ya con la gestion nueva
    } catch (e) {
        console.error('[Patrocinadores] Error guardando gestion:', e);
        alert('No se pudo guardar: ' + (e.message || e));
    }
}


// ============================================================
// UTILIDAD DE MODAL
// ============================================================
function cmSponMostrarModal(titulo, bodyHtml, footerHtml, wide) {
    cmSponCerrarModal();
    var overlay = document.createElement('div');
    overlay.className = 'cmspon-modal-overlay';
    overlay.id = 'cmspon-modal';
    overlay.onclick = function(e) { if (e.target === overlay) cmSponCerrarModal(); };
    overlay.innerHTML =
        '<div class="cmspon-modal' + (wide ? ' wide' : '') + '">' +
            '<div class="cmspon-modal-header">' +
                '<h3>' + titulo + '</h3>' +
                '<button class="cmspon-modal-close" onclick="cmSponCerrarModal()">&times;</button>' +
            '</div>' +
            '<div class="cmspon-modal-body">' + bodyHtml + '</div>' +
            '<div class="cmspon-modal-footer">' + (footerHtml || '') + '</div>' +
        '</div>';
    document.body.appendChild(overlay);
}

function cmSponCerrarModal() {
    var o = document.getElementById('cmspon-modal');
    if (o) o.remove();
}


// ============================================================
// AUTO-MONTAJE
// Crea la pestana "Patrocinadores" en la barra del HUB y registra el
// modulo. Mismo patron que cm-familias.js / cm-pagos.js. Comprueba el
// permiso 'patrocinadores' antes de montar.
// ============================================================
(function cmSponAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 20) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (typeof cmPuedeVer !== 'function' || !cmPuedeVer('patrocinadores')) {
            clearInterval(intervalo); return;
        }
        clearInterval(intervalo);

        if (document.getElementById('cm-tab-patrocinadores')) return;
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;

        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-patrocinadores';
        tab.setAttribute('onclick', "cambiarModulo('patrocinadores', this)");
        tab.innerHTML = '<span class="tab-icon">\uD83E\uDD1D</span><span>Patrocinadores</span>';
        mainTabs.appendChild(tab);

        if (!document.getElementById('modulo-patrocinadores')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-patrocinadores';
            var ultModulo = document.querySelector('.vista-modulo:last-of-type');
            if (ultModulo && ultModulo.parentElement) {
                ultModulo.parentElement.insertBefore(vista, ultModulo.nextSibling);
            } else {
                document.body.appendChild(vista);
            }
        }

        if (typeof registrarModulo === 'function') {
            registrarModulo('patrocinadores', function() { cmSponInit('modulo-patrocinadores'); });
        }

        // Si este rol no tenia ninguna pestana visible, ocultamos la pantalla
        // "en desarrollo" y restauramos el HUB.
        var pd = document.getElementById('cm-pantalla-desarrollo');
        if (pd) {
            pd.style.display = 'none';
            var mt = document.querySelector('.main-tabs');
            if (mt) mt.style.display = '';
            document.querySelectorAll('.vista-modulo').forEach(function(v) { v.style.display = ''; });
        }

        var tv = Array.from(document.querySelectorAll('.main-tab')).filter(function(t) { return t.style.display !== 'none'; });
        if (tv.length === 1 && tv[0].id === 'cm-tab-patrocinadores') { cambiarModulo('patrocinadores', tab); }

        console.log('[Modulo Patrocinadores] Auto-montado y registrado');
    }, 500);
})();
