// ============================================================
// CM-PAGOS.JS - Modulo de Pagos y Cuotas
// TopLiderCoach HUB - Club Mode - Fase P.1 MVP
// ============================================================
// Modulo de la Oficina del club. Gestion de cuotas, cobros y
// recibos SIN pasarela de pago online (eso es la Fase P.2).
// Visible para roles con permiso 'pagos_cuotas'.
// Prefijo: cmPay (todas las variables y funciones)
//
// Estado de construccion:
//   - Conceptos    -> Paso 2 (HECHO)
//   - Cobros       -> Paso 3 y 4
//   - Liquidacion  -> Fase P.2 (placeholder permanente)
//   - Configuracion-> Paso 5
//
// Importes: SIEMPRE en centimos (integer) en la base de datos.
// El usuario escribe euros; el codigo convierte con los helpers
// cmPayEurToCents / cmPayCentsToEur.
// ============================================================

// ========== ESTADO DEL MODULO ==========
var cmPayTabActiva       = 'cobros';   // pestana activa por defecto
var cmPayContainerId     = null;       // id del contenedor donde se monta
var cmPayConfig          = null;       // fila de cm_pay_club_config del club
var cmPayConceptos       = [];         // cache de conceptos cargados
var cmPayReady           = false;      // catalogos/config ya cargados?

// Filtros de la pestana Conceptos
var cmPayFiltroCategoria = 'all';
var cmPayFiltroEstado    = 'active';

// Estado de la pestana Cobros
var cmPayAsignaciones    = [];         // asignaciones cargadas (con join de concepto)
var cmPayJugadores       = [];         // jugadores del club (de club_players)
var cmPayEquipos         = [];         // equipos del club

// Filtros de la pestana Cobros
var cmPayFiltroCobEquipo   = 'all';
var cmPayFiltroCobConcepto = 'all';
var cmPayFiltroCobEstado   = 'all';

// Colores de badge por categoria
var CMPAY_CAT_COLORS = {
    cuota_mensual: 'background:#1e3a5f;color:#60a5fa',
    matricula:     'background:#3b1e5f;color:#c084fc',
    licencia:      'background:#1e4f4f;color:#5eead4',
    material:      'background:#4f3a1e;color:#fbbf24',
    derrama:       'background:#4f1e1e;color:#fca5a5',
    cuota_socio:   'background:#1e4f2e;color:#86efac',
    otro:          'background:#334155;color:#cbd5e1'
};


// ========== HELPERS ==========

// Convierte lo que escribe el usuario (euros) a centimos integer.
// Admite coma o punto decimal. Devuelve null si no es valido.
function cmPayEurToCents(str) {
    if (str === null || str === undefined) return null;
    var s = String(str).trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    // Nota: se eliminan los puntos de millar y se usa la coma como decimal.
    if (s === '') return null;
    var n = parseFloat(s);
    if (isNaN(n) || n < 0) return null;
    return Math.round(n * 100);
}

// Convierte centimos a texto en euros con formato espanol (40,00).
function cmPayCentsToEur(cents) {
    var n = (cents || 0) / 100;
    return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Escapa texto para insertarlo de forma segura en HTML.
function cmPayEsc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Etiqueta legible de una categoria.
function cmPayCategoriaLabel(cat) {
    var l = { cuota_mensual: 'Cuota mensual', matricula: 'Matricula', licencia: 'Licencia',
              material: 'Material', derrama: 'Derrama', cuota_socio: 'Cuota socio', otro: 'Otro' };
    return l[cat] || cat;
}

// Etiqueta legible de una recurrencia.
function cmPayRecurrenciaLabel(rec) {
    var l = { one_time: 'Pago unico', monthly: 'Mensual', annual: 'Anual' };
    return l[rec] || rec;
}

// Fecha 'YYYY-MM-DD' -> 'DD/MM/AA'
function cmPayFechaCorta(d) {
    if (!d) return '';
    var p = String(d).split('-');
    if (p.length < 3) return d;
    return p[2].substring(0, 2) + '/' + p[1] + '/' + p[0].substring(2);
}

// Permiso de edicion del modulo de Pagos. Si es false, el usuario
// es de solo lectura: ve los datos pero no los botones de accion.
function cmPayPuedeEditar() {
    return (typeof cmPuedeEditar === 'function') ? cmPuedeEditar('pagos_cuotas') : true;
}


// ========== INICIALIZACION ==========
// Punto de entrada. Lo llama el HUB al abrir la pestana "Pagos".
async function cmPayInit(containerId) {
    var container = document.getElementById(containerId);
    if (!container) { console.error('cmPayInit: contenedor no encontrado:', containerId); return; }
    cmPayContainerId = containerId;

    cmPayRenderPanel(container);
    cmPayCambiarTab('cobros');
}


// ========== RENDER DEL PANEL PRINCIPAL ==========
// El panel lleva su PROPIO fondo oscuro (.cmpay-wrap) para garantizar
// contraste de los textos, sin depender del color del contenedor del HUB.
function cmPayRenderPanel(container) {
    container.innerHTML =
    '<style>' +
        '.cmpay-wrap{background:#0f172a;min-height:calc(100vh - 120px);padding:24px 20px;box-sizing:border-box}' +
        '.cmpay-panel{max-width:1200px;margin:0 auto}' +
        '.cmpay-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px}' +
        '.cmpay-header h2{margin:0;color:#f1f5f9;font-size:20px;font-weight:700}' +
        '.cmpay-header .cmpay-sub{color:#94a3b8;font-size:12px;margin-top:2px}' +
        '.cmpay-tabs{display:flex;gap:0;border-bottom:1px solid #1e293b;margin-bottom:20px;flex-wrap:wrap}' +
        '.cmpay-tab{padding:10px 20px;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all .2s}' +
        '.cmpay-tab:hover{color:#e2e8f0}' +
        '.cmpay-tab.active{color:#3b82f6;border-bottom-color:#3b82f6}' +
        '.cmpay-tab-badge{display:inline-block;margin-left:6px;background:#334155;color:#94a3b8;font-size:10px;padding:1px 6px;border-radius:8px;font-weight:600}' +
        '.cmpay-empty{text-align:center;padding:60px 20px;color:#64748b;grid-column:1/-1}' +
        '.cmpay-empty .icon{font-size:48px;margin-bottom:14px}' +
        '.cmpay-empty h3{color:#e2e8f0;font-size:16px;margin:0 0 6px}' +
        '.cmpay-empty p{font-size:13px;margin:0;line-height:1.6}' +
        '.cmpay-soon{display:inline-block;margin-top:14px;background:#1e293b;border:1px solid #334155;color:#60a5fa;font-size:12px;padding:6px 14px;border-radius:8px}' +
        // --- botones ---
        '.cmpay-btn{padding:8px 16px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s;font-family:inherit}' +
        '.cmpay-btn-primary{background:#3b82f6;color:#fff}.cmpay-btn-primary:hover{background:#2563eb}' +
        '.cmpay-btn-secondary{background:#334155;color:#e2e8f0}.cmpay-btn-secondary:hover{background:#475569}' +
        '.cmpay-btn-danger{background:#dc2626;color:#fff}.cmpay-btn-danger:hover{background:#b91c1c}' +
        '.cmpay-btn-sm{padding:5px 12px;font-size:12px}' +
        // --- toolbar y filtros ---
        '.cmpay-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}' +
        '.cmpay-filtros{display:flex;gap:8px;flex-wrap:wrap}' +
        '.cmpay-filtros select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px;font-family:inherit;cursor:pointer}' +
        // --- tarjetas de concepto ---
        '.cmpay-concept-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}' +
        '.cmpay-concept-card{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px 16px;transition:all .2s}' +
        '.cmpay-concept-card:hover{border-color:#3b82f6}' +
        '.cmpay-concept-card.archived{opacity:.55}' +
        '.cmpay-concept-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px}' +
        '.cmpay-concept-name{color:#f1f5f9;font-weight:600;font-size:14px;line-height:1.3}' +
        '.cmpay-cat-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap;flex-shrink:0}' +
        '.cmpay-concept-amount{font-size:22px;font-weight:700;color:#3b82f6}' +
        '.cmpay-concept-amount .cur{font-size:13px;color:#94a3b8;font-weight:600}' +
        '.cmpay-concept-meta{color:#94a3b8;font-size:12px;margin-top:2px}' +
        '.cmpay-concept-desc{color:#cbd5e1;font-size:12px;margin-top:8px}' +
        '.cmpay-concept-actions{display:flex;gap:6px;margin-top:12px}' +
        // --- modal ---
        '.cmpay-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9500;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}' +
        '.cmpay-modal{background:#0f172a;border:1px solid #334155;border-radius:14px;width:100%;max-width:540px}' +
        '.cmpay-modal-header{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #1e293b}' +
        '.cmpay-modal-header h3{margin:0;color:#f1f5f9;font-size:17px}' +
        '.cmpay-modal-close{background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1}' +
        '.cmpay-modal-close:hover{color:#ef4444}' +
        '.cmpay-modal-body{padding:20px 22px}' +
        '.cmpay-modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid #1e293b}' +
        '.cmpay-form-group{margin-bottom:14px}' +
        '.cmpay-form-group label{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}' +
        '.cmpay-form-group input,.cmpay-form-group select,.cmpay-form-group textarea{width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit;box-sizing:border-box}' +
        '.cmpay-form-group textarea{min-height:54px;resize:vertical}' +
        '.cmpay-form-group input:focus,.cmpay-form-group select:focus,.cmpay-form-group textarea:focus{border-color:#3b82f6;outline:none}' +
        '.cmpay-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
        // --- tabla de cobros ---
        '.cmpay-table-wrap{overflow-x:auto;border:1px solid #1e293b;border-radius:10px}' +
        '.cmpay-table{width:100%;border-collapse:collapse;font-size:13px}' +
        '.cmpay-table thead th{background:#1e293b;color:#94a3b8;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left;white-space:nowrap}' +
        '.cmpay-table th.num,.cmpay-table td.num{text-align:right}' +
        '.cmpay-table tbody td{padding:10px 12px;color:#e2e8f0;border-top:1px solid #1e293b}' +
        '.cmpay-table tbody tr:hover{background:#1e293b}' +
        '.cmpay-estado-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap}' +
        // --- KPIs ---
        '.cmpay-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}' +
        '.cmpay-kpi{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px 16px;text-align:center}' +
        '.cmpay-kpi .kpi-val{font-size:22px;font-weight:700}' +
        '.cmpay-kpi .kpi-lbl{font-size:11px;color:#94a3b8;margin-top:2px}' +
        '.cmpay-kpi.cobrado .kpi-val{color:#22c55e}' +
        '.cmpay-kpi.pendiente .kpi-val{color:#f59e0b}' +
        '.cmpay-kpi.morosidad .kpi-val{color:#ef4444}' +
        '.cmpay-kpi.aldia .kpi-val{color:#60a5fa}' +
        // --- configuracion ---
        '.cmpay-config-section{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px 18px;margin-bottom:16px}' +
        '.cmpay-config-title{color:#f1f5f9;font-size:15px;margin:0 0 4px}' +
        '.cmpay-config-hint{color:#94a3b8;font-size:12px;margin:0 0 14px;line-height:1.5}' +
        '@media(max-width:640px){.cmpay-tabs{overflow-x:auto;flex-wrap:nowrap}.cmpay-tab{white-space:nowrap}.cmpay-wrap{padding:16px 12px}.cmpay-form-row{grid-template-columns:1fr}.cmpay-kpis{grid-template-columns:1fr 1fr}}' +
    '</style>' +
    '<div class="cmpay-wrap">' +
        '<div class="cmpay-panel">' +
            '<div class="cmpay-header">' +
                '<div>' +
                    '<h2>Pagos y Cuotas</h2>' +
                    '<div class="cmpay-sub">Gestion de cuotas, cobros y recibos del club</div>' +
                '</div>' +
            '</div>' +
            '<div class="cmpay-tabs">' +
                '<button class="cmpay-tab" id="cmpay-tab-conceptos" onclick="cmPayCambiarTab(\'conceptos\',this)">Conceptos</button>' +
                '<button class="cmpay-tab active" id="cmpay-tab-cobros" onclick="cmPayCambiarTab(\'cobros\',this)">Cobros</button>' +
                '<button class="cmpay-tab" id="cmpay-tab-liquidacion" onclick="cmPayCambiarTab(\'liquidacion\',this)">Liquidacion<span class="cmpay-tab-badge">P.2</span></button>' +
                '<button class="cmpay-tab" id="cmpay-tab-config" onclick="cmPayCambiarTab(\'config\',this)">Configuracion</button>' +
            '</div>' +
            '<div id="cmpay-tab-content"></div>' +
        '</div>' +
    '</div>';
}


// ========== CAMBIO DE PESTANA ==========
function cmPayCambiarTab(tab, btn) {
    cmPayTabActiva = tab;

    document.querySelectorAll('.cmpay-tab').forEach(function(t) { t.classList.remove('active'); });
    if (btn) {
        btn.classList.add('active');
    } else {
        var el = document.getElementById('cmpay-tab-' + tab);
        if (el) el.classList.add('active');
    }

    var cont = document.getElementById('cmpay-tab-content');
    if (!cont) return;

    if (tab === 'conceptos')   cmPayTabConceptos(cont);
    if (tab === 'cobros')      cmPayTabCobros(cont);
    if (tab === 'liquidacion') cmPayTabLiquidacion(cont);
    if (tab === 'config')      cmPayTabConfig(cont);
}


// ============================================================
// PESTANA: CONCEPTOS  (Paso 2)
// CRUD de conceptos de cobro: cuota mensual, matricula, etc.
// ============================================================

function cmPayTabConceptos(cont) {
    var cats = [
        ['all', 'Todas las categorias'],
        ['cuota_mensual', 'Cuota mensual'], ['matricula', 'Matricula'],
        ['licencia', 'Licencia'], ['material', 'Material'],
        ['derrama', 'Derrama'], ['cuota_socio', 'Cuota socio'], ['otro', 'Otro']
    ];
    var catOpts = cats.map(function(o) {
        return '<option value="' + o[0] + '"' + (cmPayFiltroCategoria === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');

    var estados = [['active', 'Activos'], ['archived', 'Archivados'], ['all', 'Todos']];
    var estOpts = estados.map(function(o) {
        return '<option value="' + o[0] + '"' + (cmPayFiltroEstado === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');

    cont.innerHTML =
        '<div class="cmpay-toolbar">' +
            '<div class="cmpay-filtros">' +
                '<select id="cmpay-filtro-categoria" onchange="cmPayFiltrarConceptos()">' + catOpts + '</select>' +
                '<select id="cmpay-filtro-estado" onchange="cmPayFiltrarConceptos()">' + estOpts + '</select>' +
            '</div>' +
            (cmPayPuedeEditar()
                ? '<button class="cmpay-btn cmpay-btn-primary" onclick="cmPayAbrirModalConcepto()">+ Nuevo concepto</button>'
                : '') +
        '</div>' +
        '<div class="cmpay-concept-grid" id="cmpay-concept-grid">' +
            '<div class="cmpay-empty"><div class="icon">⏳</div><p>Cargando conceptos...</p></div>' +
        '</div>';

    cmPayCargarConceptos();
}

// Carga los conceptos del club desde cm_pay_concepts.
async function cmPayCargarConceptos() {
    var grid = document.getElementById('cmpay-concept-grid');
    if (!grid) return;
    try {
        var res = await supabaseClient.from('cm_pay_concepts')
            .select('*').eq('club_id', clubId)
            .order('category').order('name');
        if (res.error) throw res.error;
        cmPayConceptos = res.data || [];
        cmPayRenderConceptos();
    } catch (e) {
        console.error('cmPayCargarConceptos:', e);
        grid.innerHTML = '<div class="cmpay-empty"><div class="icon">⚠️</div><p>Error al cargar conceptos</p></div>';
    }
}

// Pinta las tarjetas de concepto aplicando los filtros activos.
function cmPayRenderConceptos() {
    var grid = document.getElementById('cmpay-concept-grid');
    if (!grid) return;
    var editable = cmPayPuedeEditar();

    var lista = cmPayConceptos.filter(function(c) {
        if (cmPayFiltroEstado === 'active' && c.archived) return false;
        if (cmPayFiltroEstado === 'archived' && !c.archived) return false;
        if (cmPayFiltroCategoria !== 'all' && c.category !== cmPayFiltroCategoria) return false;
        return true;
    });

    if (lista.length === 0) {
        grid.innerHTML = '<div class="cmpay-empty"><div class="icon">📋</div>' +
            '<h3>Sin conceptos</h3><p>Crea el primer concepto de cobro con el boton "+ Nuevo concepto".</p></div>';
        return;
    }

    var html = '';
    lista.forEach(function(c) {
        var catStyle = CMPAY_CAT_COLORS[c.category] || CMPAY_CAT_COLORS.otro;
        var vigencia = '';
        if (c.active_from || c.active_until) {
            vigencia = ' · Vigencia: ' + (c.active_from ? cmPayFechaCorta(c.active_from) : '...') +
                       ' → ' + (c.active_until ? cmPayFechaCorta(c.active_until) : '...');
        }
        html += '<div class="cmpay-concept-card' + (c.archived ? ' archived' : '') + '">' +
            '<div class="cmpay-concept-top">' +
                '<div class="cmpay-concept-name">' + cmPayEsc(c.name) + '</div>' +
                '<span class="cmpay-cat-badge" style="' + catStyle + '">' + cmPayCategoriaLabel(c.category) + '</span>' +
            '</div>' +
            '<div class="cmpay-concept-amount">' + cmPayCentsToEur(c.amount_cents) + ' <span class="cur">EUR</span></div>' +
            '<div class="cmpay-concept-meta">' + cmPayRecurrenciaLabel(c.recurrence) + vigencia + '</div>' +
            (c.description ? '<div class="cmpay-concept-desc">' + cmPayEsc(c.description) + '</div>' : '') +
            (editable
                ? '<div class="cmpay-concept-actions">' +
                    '<button class="cmpay-btn cmpay-btn-secondary cmpay-btn-sm" onclick="cmPayAbrirModalConcepto(\'' + c.id + '\')">Editar</button>' +
                    (c.archived
                        ? '<button class="cmpay-btn cmpay-btn-secondary cmpay-btn-sm" onclick="cmPayArchivarConcepto(\'' + c.id + '\',false)">Restaurar</button>'
                        : '<button class="cmpay-btn cmpay-btn-danger cmpay-btn-sm" onclick="cmPayArchivarConcepto(\'' + c.id + '\',true)">Archivar</button>') +
                  '</div>'
                : '') +
        '</div>';
    });
    grid.innerHTML = html;
}

// Relee los filtros y vuelve a pintar.
function cmPayFiltrarConceptos() {
    var c = document.getElementById('cmpay-filtro-categoria');
    var e = document.getElementById('cmpay-filtro-estado');
    if (c) cmPayFiltroCategoria = c.value;
    if (e) cmPayFiltroEstado = e.value;
    cmPayRenderConceptos();
}

// Abre el modal de crear (sin id) o editar (con id) un concepto.
function cmPayAbrirModalConcepto(id) {
    var c = id ? cmPayConceptos.find(function(x) { return x.id === id; }) : null;

    var cats = [['cuota_mensual', 'Cuota mensual'], ['matricula', 'Matricula'], ['licencia', 'Licencia'],
                ['material', 'Material'], ['derrama', 'Derrama'], ['cuota_socio', 'Cuota socio'], ['otro', 'Otro']];
    var catOpts = cats.map(function(o) {
        var sel = (c && c.category === o[0]) || (!c && o[0] === 'cuota_mensual');
        return '<option value="' + o[0] + '"' + (sel ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');

    var recs = [['one_time', 'Pago unico'], ['monthly', 'Mensual'], ['annual', 'Anual']];
    var recOpts = recs.map(function(o) {
        var sel = (c && c.recurrence === o[0]) || (!c && o[0] === 'monthly');
        return '<option value="' + o[0] + '"' + (sel ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');

    var importe = c ? cmPayCentsToEur(c.amount_cents) : '';

    var overlay = document.createElement('div');
    overlay.className = 'cmpay-modal-overlay';
    overlay.id = 'cmpay-modal-concepto';
    overlay.onclick = function(e) { if (e.target === overlay) cmPayCerrarModalConcepto(); };
    overlay.innerHTML =
        '<div class="cmpay-modal">' +
            '<div class="cmpay-modal-header">' +
                '<h3>' + (c ? 'Editar concepto' : 'Nuevo concepto') + '</h3>' +
                '<button class="cmpay-modal-close" onclick="cmPayCerrarModalConcepto()">✕</button>' +
            '</div>' +
            '<div class="cmpay-modal-body">' +
                '<input type="hidden" id="cmpay-concept-id" value="' + (c ? c.id : '') + '">' +
                '<div class="cmpay-form-group"><label>Nombre del concepto *</label>' +
                    '<input type="text" id="cmpay-concept-name" value="' + (c ? cmPayEsc(c.name) : '') + '" placeholder="Ej: Cuota mensual Alevin"></div>' +
                '<div class="cmpay-form-row">' +
                    '<div class="cmpay-form-group"><label>Categoria</label>' +
                        '<select id="cmpay-concept-category">' + catOpts + '</select></div>' +
                    '<div class="cmpay-form-group"><label>Importe (EUR) *</label>' +
                        '<input type="text" inputmode="decimal" id="cmpay-concept-amount" value="' + importe + '" placeholder="Ej: 40,00"></div>' +
                '</div>' +
                '<div class="cmpay-form-group"><label>Recurrencia</label>' +
                    '<select id="cmpay-concept-recurrence">' + recOpts + '</select></div>' +
                '<div class="cmpay-form-group"><label>Descripcion (opcional)</label>' +
                    '<textarea id="cmpay-concept-desc" placeholder="Detalles del concepto...">' + (c && c.description ? cmPayEsc(c.description) : '') + '</textarea></div>' +
                '<div class="cmpay-form-row">' +
                    '<div class="cmpay-form-group"><label>Vigencia desde (opcional)</label>' +
                        '<input type="date" id="cmpay-concept-from" value="' + (c && c.active_from ? c.active_from : '') + '"></div>' +
                    '<div class="cmpay-form-group"><label>Vigencia hasta (opcional)</label>' +
                        '<input type="date" id="cmpay-concept-until" value="' + (c && c.active_until ? c.active_until : '') + '"></div>' +
                '</div>' +
            '</div>' +
            '<div class="cmpay-modal-footer">' +
                '<button class="cmpay-btn cmpay-btn-secondary" onclick="cmPayCerrarModalConcepto()">Cancelar</button>' +
                '<button class="cmpay-btn cmpay-btn-primary" onclick="cmPayGuardarConcepto()">' +
                    (c ? 'Guardar cambios' : 'Crear concepto') + '</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);
}

function cmPayCerrarModalConcepto() {
    var o = document.getElementById('cmpay-modal-concepto');
    if (o) o.remove();
}

// Guarda el concepto (INSERT si es nuevo, UPDATE si tiene id).
async function cmPayGuardarConcepto() {
    var id        = document.getElementById('cmpay-concept-id').value;
    var name      = document.getElementById('cmpay-concept-name').value.trim();
    var amountStr = document.getElementById('cmpay-concept-amount').value;

    if (!name) { showToast('El nombre es obligatorio', 'error'); return; }

    var cents = cmPayEurToCents(amountStr);
    if (cents === null) { showToast('El importe no es valido', 'error'); return; }

    var concepto = {
        club_id:      clubId,
        name:         name,
        description:  document.getElementById('cmpay-concept-desc').value.trim() || null,
        category:     document.getElementById('cmpay-concept-category').value,
        amount_cents: cents,
        recurrence:   document.getElementById('cmpay-concept-recurrence').value,
        active_from:  document.getElementById('cmpay-concept-from').value || null,
        active_until: document.getElementById('cmpay-concept-until').value || null,
        updated_at:   new Date().toISOString()
    };

    var res;
    if (id) {
        res = await supabaseClient.from('cm_pay_concepts').update(concepto).eq('id', id);
    } else {
        // created_by referencia club_members(id): usamos el miembro actual del Club Mode.
        concepto.created_by = (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.id : null;
        res = await supabaseClient.from('cm_pay_concepts').insert(concepto);
    }

    if (res.error) { showToast('Error al guardar: ' + res.error.message, 'error'); return; }

    showToast(id ? 'Concepto actualizado' : 'Concepto creado');
    cmPayCerrarModalConcepto();
    cmPayCargarConceptos();
}

// Archiva (archivar=true) o restaura (archivar=false) un concepto.
// Archivar es reversible, por eso no pide confirmacion modal.
async function cmPayArchivarConcepto(id, archivar) {
    var upd = archivar
        ? { archived: true,  archived_at: new Date().toISOString() }
        : { archived: false, archived_at: null };

    var res = await supabaseClient.from('cm_pay_concepts').update(upd).eq('id', id);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }

    showToast(archivar ? 'Concepto archivado' : 'Concepto restaurado');
    cmPayCargarConceptos();
}


// ============================================================
// PESTANA: COBROS  (Paso 3A)
// Asignar conceptos a jugadores y ver la tabla de asignaciones.
// (KPIs y filtros llegan en el Paso 3B.)
// ============================================================

function cmPayTabCobros(cont) {
    cont.innerHTML =
        '<div id="cmpay-cobros-kpis"></div>' +
        '<div class="cmpay-toolbar">' +
            '<div class="cmpay-filtros" id="cmpay-cobros-filtros"></div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
                '<button class="cmpay-btn cmpay-btn-secondary" onclick="cmPayExportarCSV()">Exportar CSV</button>' +
                (cmPayPuedeEditar()
                    ? '<button class="cmpay-btn cmpay-btn-primary" onclick="cmPayAbrirModalAsignar()">+ Asignar concepto</button>'
                    : '') +
            '</div>' +
        '</div>' +
        '<div id="cmpay-cobros-tabla">' +
            '<div class="cmpay-empty"><div class="icon">⏳</div><p>Cargando cobros...</p></div>' +
        '</div>';
    cmPayCargarCobros();
}

// Carga jugadores, equipos, conceptos y asignaciones del club.
async function cmPayCargarCobros() {
    var cont = document.getElementById('cmpay-cobros-tabla');
    if (!cont) return;
    try {
        // 1. Conceptos (si no estan ya en cache)
        if (cmPayConceptos.length === 0) {
            var rc = await supabaseClient.from('cm_pay_concepts').select('*').eq('club_id', clubId);
            cmPayConceptos = rc.data || [];
        }

        // 2. Equipos del club
        var rt = await supabaseClient.from('club_teams')
            .select('id, name, category').eq('club_id', clubId).eq('active', true)
            .order('category').order('name');
        cmPayEquipos = rt.data || [];
        var teamNames = {};
        cmPayEquipos.forEach(function(t) { teamNames[t.id] = t.name; });

        // 3. Jugadores del club (club_players, la tabla canonica)
        var rp = await supabaseClient.from('club_players')
            .select('id, name, first_name, last_name, photo_url')
            .eq('club_id', clubId).eq('active', true);
        var players = rp.data || [];

        // 4. Equipo/dorsal de cada jugador (club_player_seasons)
        var rs = await supabaseClient.from('club_player_seasons')
            .select('player_id, team_id, shirt_number')
            .eq('club_id', clubId).eq('active', true);
        var seasonMap = {};
        (rs.data || []).forEach(function(s) {
            if (!seasonMap[s.player_id]) seasonMap[s.player_id] = { team_id: s.team_id, dorsal: s.shirt_number };
        });

        cmPayJugadores = players.map(function(p) {
            var nombre = p.name || ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || 'Jugador';
            var sm = seasonMap[p.id] || {};
            return {
                id: p.id, name: nombre, photoUrl: p.photo_url || '',
                teamId: sm.team_id || null,
                teamName: sm.team_id ? (teamNames[sm.team_id] || 'Sin equipo') : 'Sin equipo',
                dorsal: sm.dorsal || ''
            };
        });
        cmPayJugadores.sort(function(a, b) { return a.name.localeCompare(b.name); });

        // 5. Asignaciones (con el concepto embebido via FK)
        var ra = await supabaseClient.from('cm_pay_assignments')
            .select('*, cm_pay_concepts(name, category, recurrence)')
            .eq('club_id', clubId).eq('archived', false)
            .order('created_at', { ascending: false });
        if (ra.error) throw ra.error;
        cmPayAsignaciones = ra.data || [];

        cmPayRenderCobros();
    } catch (e) {
        console.error('cmPayCargarCobros:', e);
        cont.innerHTML = '<div class="cmpay-empty"><div class="icon">⚠️</div><p>Error al cargar cobros</p></div>';
    }
}

// Pinta KPIs, filtros y la tabla de asignaciones.
function cmPayRenderCobros() {
    cmPayRenderCobrosKPIs();
    cmPayRenderCobrosFiltros();
    cmPayRenderCobrosTabla();
}

// --- KPIs (se calculan sobre TODAS las asignaciones, sin filtrar) ---
function cmPayRenderCobrosKPIs() {
    var cont = document.getElementById('cmpay-cobros-kpis');
    if (!cont) return;

    var totalFacturado = 0, totalCobrado = 0;
    var pendientePorJugador = {};
    cmPayAsignaciones.forEach(function(a) {
        var fin = a.final_amount_cents || 0;
        var pag = a.paid_amount_cents || 0;
        totalFacturado += fin;
        totalCobrado += pag;
        if (fin - pag > 0) pendientePorJugador[a.player_id] = true;
    });
    var totalPendiente = totalFacturado - totalCobrado;
    var morosidad = totalFacturado > 0 ? Math.round((totalPendiente / totalFacturado) * 100) : 0;

    // Jugadores al dia = jugadores con asignaciones pero ninguna pendiente
    var jugadoresConCobros = {};
    cmPayAsignaciones.forEach(function(a) { jugadoresConCobros[a.player_id] = true; });
    var totalConCobros = Object.keys(jugadoresConCobros).length;
    var conPendiente = Object.keys(pendientePorJugador).length;
    var alDia = totalConCobros - conPendiente;

    cont.innerHTML =
        '<div class="cmpay-kpis">' +
            '<div class="cmpay-kpi cobrado"><div class="kpi-val">' + cmPayCentsToEur(totalCobrado) + '</div><div class="kpi-lbl">Cobrado (EUR)</div></div>' +
            '<div class="cmpay-kpi pendiente"><div class="kpi-val">' + cmPayCentsToEur(totalPendiente) + '</div><div class="kpi-lbl">Pendiente (EUR)</div></div>' +
            '<div class="cmpay-kpi morosidad"><div class="kpi-val">' + morosidad + '%</div><div class="kpi-lbl">Morosidad</div></div>' +
            '<div class="cmpay-kpi aldia"><div class="kpi-val">' + alDia + '/' + totalConCobros + '</div><div class="kpi-lbl">Jugadores al dia</div></div>' +
        '</div>';
}

// --- Filtros (equipo, concepto, estado) ---
function cmPayRenderCobrosFiltros() {
    var cont = document.getElementById('cmpay-cobros-filtros');
    if (!cont) return;

    var optsEquipo = '<option value="all">Todos los equipos</option>' +
        cmPayEquipos.map(function(t) {
            return '<option value="' + t.id + '"' + (cmPayFiltroCobEquipo === t.id ? ' selected' : '') + '>' + cmPayEsc(t.name) + '</option>';
        }).join('');

    var optsConcepto = '<option value="all">Todos los conceptos</option>' +
        cmPayConceptos.map(function(c) {
            return '<option value="' + c.id + '"' + (cmPayFiltroCobConcepto === c.id ? ' selected' : '') + '>' + cmPayEsc(c.name) + '</option>';
        }).join('');

    var estados = [['all', 'Todos los estados'], ['pending', 'Pendiente'], ['partial', 'Parcial'], ['paid', 'Pagado']];
    var optsEstado = estados.map(function(o) {
        return '<option value="' + o[0] + '"' + (cmPayFiltroCobEstado === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');

    cont.innerHTML =
        '<select id="cmpay-fcob-equipo" onchange="cmPayFiltrarCobros()">' + optsEquipo + '</select>' +
        '<select id="cmpay-fcob-concepto" onchange="cmPayFiltrarCobros()">' + optsConcepto + '</select>' +
        '<select id="cmpay-fcob-estado" onchange="cmPayFiltrarCobros()">' + optsEstado + '</select>';
}

// Relee los filtros y vuelve a pintar la tabla.
function cmPayFiltrarCobros() {
    var e = document.getElementById('cmpay-fcob-equipo');
    var c = document.getElementById('cmpay-fcob-concepto');
    var s = document.getElementById('cmpay-fcob-estado');
    if (e) cmPayFiltroCobEquipo = e.value;
    if (c) cmPayFiltroCobConcepto = c.value;
    if (s) cmPayFiltroCobEstado = s.value;
    cmPayRenderCobrosTabla();
}

// --- Tabla de asignaciones (aplica los filtros) ---
function cmPayRenderCobrosTabla() {
    var cont = document.getElementById('cmpay-cobros-tabla');
    if (!cont) return;
    var editable = cmPayPuedeEditar();

    if (cmPayAsignaciones.length === 0) {
        cont.innerHTML = '<div class="cmpay-empty"><div class="icon">💶</div>' +
            '<h3>Sin cobros</h3><p>Asigna un concepto a tus jugadores con el boton "+ Asignar concepto".</p></div>';
        return;
    }

    var jugById = {};
    cmPayJugadores.forEach(function(j) { jugById[j.id] = j; });

    var lista = cmPayAsignaciones.filter(function(a) {
        var j = jugById[a.player_id];
        if (cmPayFiltroCobEquipo !== 'all' && (!j || j.teamId !== cmPayFiltroCobEquipo)) return false;
        if (cmPayFiltroCobConcepto !== 'all' && a.concept_id !== cmPayFiltroCobConcepto) return false;
        if (cmPayFiltroCobEstado !== 'all' && a.status !== cmPayFiltroCobEstado) return false;
        return true;
    });

    if (lista.length === 0) {
        cont.innerHTML = '<div class="cmpay-empty"><div class="icon">🔍</div><p>No hay cobros con estos filtros.</p></div>';
        return;
    }

    var filas = '';
    lista.forEach(function(a) {
        var j = jugById[a.player_id] || { name: 'Jugador', teamName: '-' };
        var concepto = a.cm_pay_concepts ? a.cm_pay_concepts.name : 'Concepto';
        var pendiente = (a.final_amount_cents || 0) - (a.paid_amount_cents || 0);
        var periodo = cmPayFechaCorta(a.period_start) + (a.period_end ? ' → ' + cmPayFechaCorta(a.period_end) : '');
        var btnPago = (editable && pendiente > 0)
            ? '<button class="cmpay-btn cmpay-btn-primary cmpay-btn-sm" onclick="cmPayAbrirModalPago(\'' + a.id + '\')">Registrar pago</button> '
            : '';
        var btnAnular = editable
            ? '<button class="cmpay-btn cmpay-btn-secondary cmpay-btn-sm" onclick="cmPayArchivarAsignacion(\'' + a.id + '\')">Anular</button>'
            : '';
        var celdaAcciones = (btnPago || btnAnular) ? (btnPago + btnAnular) : '<span style="color:#64748b">-</span>';
        filas += '<tr>' +
            '<td>' + cmPayEsc(j.name) + '</td>' +
            '<td>' + cmPayEsc(j.teamName) + '</td>' +
            '<td>' + cmPayEsc(concepto) + '</td>' +
            '<td>' + periodo + '</td>' +
            '<td class="num">' + cmPayCentsToEur(a.final_amount_cents) + '</td>' +
            '<td class="num">' + cmPayCentsToEur(a.paid_amount_cents) + '</td>' +
            '<td class="num">' + cmPayCentsToEur(pendiente) + '</td>' +
            '<td>' + cmPayEstadoBadge(a.status) + '</td>' +
            '<td style="white-space:nowrap">' + celdaAcciones + '</td>' +
        '</tr>';
    });

    cont.innerHTML =
        '<div style="color:#64748b;font-size:12px;margin-bottom:8px">' + lista.length + ' de ' + cmPayAsignaciones.length + ' cobros</div>' +
        '<div class="cmpay-table-wrap"><table class="cmpay-table">' +
            '<thead><tr>' +
                '<th>Jugador</th><th>Equipo</th><th>Concepto</th><th>Periodo</th>' +
                '<th class="num">Importe</th><th class="num">Pagado</th><th class="num">Pendiente</th>' +
                '<th>Estado</th><th></th>' +
            '</tr></thead>' +
            '<tbody>' + filas + '</tbody>' +
        '</table></div>';
}

// Badge de color segun el estado de pago.
function cmPayEstadoBadge(status) {
    var m = {
        pending:   ['Pendiente', 'background:#4f1e1e;color:#fca5a5'],
        partial:   ['Parcial',   'background:#4f3a1e;color:#fbbf24'],
        paid:      ['Pagado',    'background:#1e4f2e;color:#86efac'],
        cancelled: ['Anulado',   'background:#334155;color:#94a3b8']
    };
    var x = m[status] || m.pending;
    return '<span class="cmpay-estado-badge" style="' + x[1] + '">' + x[0] + '</span>';
}

// ---------- MODAL: ASIGNAR CONCEPTO ----------
function cmPayAbrirModalAsignar() {
    var conceptosActivos = cmPayConceptos.filter(function(c) { return !c.archived; });
    if (conceptosActivos.length === 0) {
        showToast('Primero crea al menos un concepto en la pestana Conceptos', 'error');
        return;
    }

    var concOpts = conceptosActivos.map(function(c) {
        return '<option value="' + c.id + '">' + cmPayEsc(c.name) + ' (' + cmPayCentsToEur(c.amount_cents) + ' EUR)</option>';
    }).join('');

    // Periodo por defecto: primer dia del mes actual
    var hoy = new Date();
    var primerDia = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-01';

    var overlay = document.createElement('div');
    overlay.className = 'cmpay-modal-overlay';
    overlay.id = 'cmpay-modal-asignar';
    overlay.onclick = function(e) { if (e.target === overlay) cmPayCerrarModalAsignar(); };
    overlay.innerHTML =
        '<div class="cmpay-modal">' +
            '<div class="cmpay-modal-header">' +
                '<h3>Asignar concepto</h3>' +
                '<button class="cmpay-modal-close" onclick="cmPayCerrarModalAsignar()">✕</button>' +
            '</div>' +
            '<div class="cmpay-modal-body">' +
                '<div class="cmpay-form-group"><label>Concepto a cobrar *</label>' +
                    '<select id="cmpay-asig-concepto">' + concOpts + '</select></div>' +
                '<div class="cmpay-form-group"><label>Aplicar a</label>' +
                    '<select id="cmpay-asig-tipo" onchange="cmPayModalAsignarCambioTipo()">' +
                        '<option value="jugador">Un jugador</option>' +
                        '<option value="equipo">Un equipo entero</option>' +
                        '<option value="categoria">Una categoria entera</option>' +
                    '</select></div>' +
                '<div class="cmpay-form-group" id="cmpay-asig-destinatario"></div>' +
                '<div class="cmpay-form-row">' +
                    '<div class="cmpay-form-group"><label>Periodo desde *</label>' +
                        '<input type="date" id="cmpay-asig-period-start" value="' + primerDia + '"></div>' +
                    '<div class="cmpay-form-group"><label>Periodo hasta (opcional)</label>' +
                        '<input type="date" id="cmpay-asig-period-end" value=""></div>' +
                '</div>' +
                '<div class="cmpay-form-row">' +
                    '<div class="cmpay-form-group"><label>Descuento % (opcional)</label>' +
                        '<input type="text" inputmode="decimal" id="cmpay-asig-descuento" value="0" placeholder="0"></div>' +
                    '<div class="cmpay-form-group"><label>Motivo del descuento</label>' +
                        '<input type="text" id="cmpay-asig-motivo" placeholder="Ej: Hermanos"></div>' +
                '</div>' +
            '</div>' +
            '<div class="cmpay-modal-footer">' +
                '<button class="cmpay-btn cmpay-btn-secondary" onclick="cmPayCerrarModalAsignar()">Cancelar</button>' +
                '<button class="cmpay-btn cmpay-btn-primary" onclick="cmPayGuardarAsignacion()">Asignar</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);

    // Rellenar el destinatario inicial (tipo "jugador")
    cmPayModalAsignarCambioTipo();
}

function cmPayCerrarModalAsignar() {
    var o = document.getElementById('cmpay-modal-asignar');
    if (o) o.remove();
}

// Cambia el selector de destinatario segun el tipo elegido.
function cmPayModalAsignarCambioTipo() {
    var tipoEl = document.getElementById('cmpay-asig-tipo');
    var cont = document.getElementById('cmpay-asig-destinatario');
    if (!tipoEl || !cont) return;
    var tipo = tipoEl.value;
    var html = '';

    if (tipo === 'jugador') {
        var optsJ = cmPayJugadores.map(function(j) {
            return '<option value="' + j.id + '">' + cmPayEsc(j.name) + ' (' + cmPayEsc(j.teamName) + ')</option>';
        }).join('');
        html = '<label>Jugador</label><select id="cmpay-asig-target">' +
               (optsJ || '<option value="">Sin jugadores</option>') + '</select>';
    } else if (tipo === 'equipo') {
        var optsE = cmPayEquipos.map(function(t) {
            var cat = t.category ? ' (' + t.category + ')' : '';
            return '<option value="' + t.id + '">' + cmPayEsc(t.name) + cat + '</option>';
        }).join('');
        html = '<label>Equipo</label><select id="cmpay-asig-target">' +
               (optsE || '<option value="">Sin equipos</option>') + '</select>';
    } else if (tipo === 'categoria') {
        var cats = {};
        cmPayEquipos.forEach(function(t) { if (t.category) cats[t.category] = true; });
        var optsC = Object.keys(cats).map(function(c) {
            return '<option value="' + cmPayEsc(c) + '">' + cmPayEsc(c) + '</option>';
        }).join('');
        html = '<label>Categoria</label><select id="cmpay-asig-target">' +
               (optsC || '<option value="">Sin categorias</option>') + '</select>';
    }
    cont.innerHTML = html;
}

// Crea las asignaciones (una fila por jugador destinatario).
async function cmPayGuardarAsignacion() {
    var conceptId   = document.getElementById('cmpay-asig-concepto').value;
    var tipo        = document.getElementById('cmpay-asig-tipo').value;
    var targetEl    = document.getElementById('cmpay-asig-target');
    var target      = targetEl ? targetEl.value : '';
    var periodStart = document.getElementById('cmpay-asig-period-start').value;
    var periodEnd   = document.getElementById('cmpay-asig-period-end').value || null;
    var pct         = parseFloat(String(document.getElementById('cmpay-asig-descuento').value).replace(',', '.')) || 0;
    var motivo      = document.getElementById('cmpay-asig-motivo').value.trim() || null;

    var concepto = cmPayConceptos.find(function(c) { return c.id === conceptId; });
    if (!concepto) { showToast('Selecciona un concepto', 'error'); return; }
    if (!periodStart) { showToast('Indica la fecha de inicio del periodo', 'error'); return; }
    if (!target) { showToast('Selecciona el destinatario', 'error'); return; }
    if (pct < 0 || pct > 100) { showToast('El descuento debe estar entre 0 y 100', 'error'); return; }

    // Lista de jugadores destinatarios
    var playerIds = [];
    if (tipo === 'jugador') {
        playerIds = [target];
    } else if (tipo === 'equipo') {
        playerIds = cmPayJugadores.filter(function(j) { return j.teamId === target; }).map(function(j) { return j.id; });
    } else if (tipo === 'categoria') {
        var equiposCat = cmPayEquipos.filter(function(t) { return t.category === target; }).map(function(t) { return t.id; });
        playerIds = cmPayJugadores.filter(function(j) { return equiposCat.indexOf(j.teamId) !== -1; }).map(function(j) { return j.id; });
    }
    if (playerIds.length === 0) { showToast('No hay jugadores para ese destinatario', 'error'); return; }

    var base      = concepto.amount_cents;
    var descCents = Math.round(base * pct / 100);
    var final     = base - descCents;
    var miembroId = (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.id : null;
    var ahora     = new Date().toISOString();

    var filas = playerIds.map(function(pid) {
        return {
            club_id: clubId, concept_id: conceptId, player_id: pid,
            base_amount_cents: base,
            discount_percent: pct,
            discount_amount_cents: descCents,
            discount_reason: motivo,
            final_amount_cents: final,
            period_start: periodStart, period_end: periodEnd,
            status: 'pending', paid_amount_cents: 0,
            created_by: miembroId, created_at: ahora, updated_at: ahora
        };
    });

    var res = await supabaseClient.from('cm_pay_assignments').insert(filas);
    if (res.error) { showToast('Error al asignar: ' + res.error.message, 'error'); return; }

    showToast(filas.length === 1 ? 'Concepto asignado' : filas.length + ' asignaciones creadas');
    cmPayCerrarModalAsignar();
    cmPayCargarCobros();
}

// Anula una asignacion (la archiva: los datos se conservan en la BD).
async function cmPayArchivarAsignacion(id) {
    var res = await supabaseClient.from('cm_pay_assignments')
        .update({ archived: true, archived_at: new Date().toISOString(), status: 'cancelled' })
        .eq('id', id);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Asignacion anulada');
    cmPayCargarCobros();
}

// Exporta a CSV los cobros visibles con los filtros actuales.
function cmPayExportarCSV() {
    if (cmPayAsignaciones.length === 0) {
        showToast('No hay cobros para exportar', 'error');
        return;
    }

    var jugById = {};
    cmPayJugadores.forEach(function(j) { jugById[j.id] = j; });

    // Mismo filtrado que la tabla
    var lista = cmPayAsignaciones.filter(function(a) {
        var j = jugById[a.player_id];
        if (cmPayFiltroCobEquipo !== 'all' && (!j || j.teamId !== cmPayFiltroCobEquipo)) return false;
        if (cmPayFiltroCobConcepto !== 'all' && a.concept_id !== cmPayFiltroCobConcepto) return false;
        if (cmPayFiltroCobEstado !== 'all' && a.status !== cmPayFiltroCobEstado) return false;
        return true;
    });
    if (lista.length === 0) {
        showToast('No hay cobros con los filtros actuales', 'error');
        return;
    }

    var estadoTxt = { pending: 'Pendiente', partial: 'Parcial', paid: 'Pagado', cancelled: 'Anulado' };
    var filas = [['Jugador', 'Equipo', 'Concepto', 'Periodo desde', 'Periodo hasta',
                  'Importe EUR', 'Pagado EUR', 'Pendiente EUR', 'Estado']];
    lista.forEach(function(a) {
        var j = jugById[a.player_id] || { name: 'Jugador', teamName: '-' };
        var concepto = a.cm_pay_concepts ? a.cm_pay_concepts.name : 'Concepto';
        var pendiente = (a.final_amount_cents || 0) - (a.paid_amount_cents || 0);
        filas.push([
            j.name, j.teamName, concepto,
            a.period_start || '', a.period_end || '',
            cmPayCentsToEur(a.final_amount_cents),
            cmPayCentsToEur(a.paid_amount_cents),
            cmPayCentsToEur(pendiente),
            estadoTxt[a.status] || a.status
        ]);
    });

    // Construir el CSV (separador ; para que Excel en espanol lo abra bien)
    var csv = filas.map(function(fila) {
        return fila.map(function(celda) {
            var s = String(celda == null ? '' : celda);
            if (s.indexOf('"') !== -1) s = s.replace(/"/g, '""');
            if (s.indexOf(';') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) s = '"' + s + '"';
            return s;
        }).join(';');
    }).join('\r\n');

    // BOM \ufeff para que Excel reconozca el UTF-8 (acentos correctos)
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var hoy = new Date();
    var fechaStr = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    var a = document.createElement('a');
    a.href = url;
    a.download = 'cobros_' + fechaStr + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(lista.length + ' cobros exportados');
}


// ============================================================
// REGISTRAR PAGO  (Paso 4A)
// Inserta una transaccion y recalcula el estado de la asignacion.
// ============================================================

// Abre el modal para registrar un pago sobre una asignacion.
function cmPayAbrirModalPago(asignacionId) {
    var a = cmPayAsignaciones.find(function(x) { return x.id === asignacionId; });
    if (!a) { showToast('Asignacion no encontrada', 'error'); return; }

    var jug = cmPayJugadores.find(function(j) { return j.id === a.player_id; });
    var nombreJug = jug ? jug.name : 'Jugador';
    var concepto = a.cm_pay_concepts ? a.cm_pay_concepts.name : 'Concepto';
    var pendiente = (a.final_amount_cents || 0) - (a.paid_amount_cents || 0);

    var hoy = new Date();
    var hoyStr = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

    var overlay = document.createElement('div');
    overlay.className = 'cmpay-modal-overlay';
    overlay.id = 'cmpay-modal-pago';
    overlay.onclick = function(e) { if (e.target === overlay) cmPayCerrarModalPago(); };
    overlay.innerHTML =
        '<div class="cmpay-modal">' +
            '<div class="cmpay-modal-header">' +
                '<h3>Registrar pago</h3>' +
                '<button class="cmpay-modal-close" onclick="cmPayCerrarModalPago()">✕</button>' +
            '</div>' +
            '<div class="cmpay-modal-body">' +
                '<input type="hidden" id="cmpay-pago-asig-id" value="' + a.id + '">' +
                '<div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px 14px;margin-bottom:16px">' +
                    '<div style="color:#f1f5f9;font-weight:600;font-size:14px">' + cmPayEsc(nombreJug) + '</div>' +
                    '<div style="color:#94a3b8;font-size:12px;margin-top:2px">' + cmPayEsc(concepto) + '</div>' +
                    '<div style="color:#f59e0b;font-size:13px;margin-top:6px;font-weight:600">Pendiente: ' + cmPayCentsToEur(pendiente) + ' EUR</div>' +
                '</div>' +
                '<div class="cmpay-form-row">' +
                    '<div class="cmpay-form-group"><label>Importe del pago (EUR) *</label>' +
                        '<input type="text" inputmode="decimal" id="cmpay-pago-importe" value="' + cmPayCentsToEur(pendiente) + '" placeholder="Ej: 40,00"></div>' +
                    '<div class="cmpay-form-group"><label>Fecha del pago *</label>' +
                        '<input type="date" id="cmpay-pago-fecha" value="' + hoyStr + '"></div>' +
                '</div>' +
                '<div class="cmpay-form-group"><label>Metodo de pago</label>' +
                    '<select id="cmpay-pago-metodo">' +
                        '<option value="cash">Efectivo</option>' +
                        '<option value="transfer">Transferencia</option>' +
                        '<option value="bizum_manual">Bizum</option>' +
                        '<option value="pos_local">Datafono / TPV</option>' +
                    '</select></div>' +
                '<div class="cmpay-form-group"><label>Referencia (opcional)</label>' +
                    '<input type="text" id="cmpay-pago-ref" placeholder="Nº de transferencia, recibo..."></div>' +
                '<div class="cmpay-form-group"><label>Notas (opcional)</label>' +
                    '<textarea id="cmpay-pago-notas" placeholder="Observaciones del pago..."></textarea></div>' +
            '</div>' +
            '<div class="cmpay-modal-footer">' +
                '<button class="cmpay-btn cmpay-btn-secondary" onclick="cmPayCerrarModalPago()">Cancelar</button>' +
                '<button class="cmpay-btn cmpay-btn-primary" onclick="cmPayGuardarPago()">Registrar pago</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);
}

function cmPayCerrarModalPago() {
    var o = document.getElementById('cmpay-modal-pago');
    if (o) o.remove();
}

// Registra el pago: inserta la transaccion y recalcula el estado.
async function cmPayGuardarPago() {
    var asigId    = document.getElementById('cmpay-pago-asig-id').value;
    var importe   = cmPayEurToCents(document.getElementById('cmpay-pago-importe').value);
    var fecha     = document.getElementById('cmpay-pago-fecha').value;
    var metodo    = document.getElementById('cmpay-pago-metodo').value;
    var referencia = document.getElementById('cmpay-pago-ref').value.trim() || null;
    var notas     = document.getElementById('cmpay-pago-notas').value.trim() || null;

    var a = cmPayAsignaciones.find(function(x) { return x.id === asigId; });
    if (!a) { showToast('Asignacion no encontrada', 'error'); return; }

    if (importe === null || importe <= 0) { showToast('El importe del pago no es valido', 'error'); return; }
    if (!fecha) { showToast('Indica la fecha del pago', 'error'); return; }

    var pendiente = (a.final_amount_cents || 0) - (a.paid_amount_cents || 0);
    if (importe > pendiente) {
        showToast('El importe supera lo pendiente (' + cmPayCentsToEur(pendiente) + ' EUR)', 'error');
        return;
    }

    var miembroId = (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.id : null;

    // 1. Insertar la transaccion
    var tx = {
        club_id: clubId,
        assignment_id: asigId,
        transaction_type: 'payment',
        amount_cents: importe,
        method: metodo,
        reference: referencia,
        status: 'completed',
        paid_at: fecha + 'T12:00:00',
        registered_by: miembroId,
        notes: notas
    };
    var resTx = await supabaseClient.from('cm_pay_transactions').insert(tx).select().single();
    if (resTx.error) { showToast('Error al registrar el pago: ' + resTx.error.message, 'error'); return; }
    var txId = resTx.data.id;

    // 2. Recalcular el total pagado sumando TODAS las transacciones completadas
    var resSum = await supabaseClient.from('cm_pay_transactions')
        .select('amount_cents, transaction_type')
        .eq('assignment_id', asigId).eq('status', 'completed').eq('archived', false);
    if (resSum.error) { showToast('Error al recalcular: ' + resSum.error.message, 'error'); return; }

    var totalPagado = 0;
    (resSum.data || []).forEach(function(t) {
        // Los reembolsos (refund) restan; los pagos suman.
        totalPagado += (t.transaction_type === 'refund' ? -1 : 1) * (t.amount_cents || 0);
    });

    // 3. Determinar el nuevo estado
    var totalFinal = a.final_amount_cents || 0;
    var nuevoEstado = 'pending';
    if (totalPagado >= totalFinal && totalFinal > 0) nuevoEstado = 'paid';
    else if (totalPagado > 0) nuevoEstado = 'partial';

    // 4. Actualizar la asignacion
    var resUpd = await supabaseClient.from('cm_pay_assignments')
        .update({ paid_amount_cents: totalPagado, status: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', asigId);
    if (resUpd.error) { showToast('Error al actualizar el estado: ' + resUpd.error.message, 'error'); return; }

    showToast(nuevoEstado === 'paid' ? 'Pago registrado - Cobro completado' : 'Pago parcial registrado');
    cmPayCargarCobros();
    cmPayPagoExito(txId, importe);
}


// ============================================================
// RECIBO PDF  (Paso 4B)
// Numeracion correlativa (serie + numero + ano) y generacion PDF.
// ============================================================

// Tras registrar el pago, transforma el modal en pantalla de exito
// con la opcion de descargar el recibo.
function cmPayPagoExito(txId, importeCents) {
    var modal = document.querySelector('#cmpay-modal-pago .cmpay-modal');
    if (!modal) return;
    modal.innerHTML =
        '<div class="cmpay-modal-header">' +
            '<h3>Pago registrado</h3>' +
            '<button class="cmpay-modal-close" onclick="cmPayCerrarModalPago()">✕</button>' +
        '</div>' +
        '<div class="cmpay-modal-body" style="text-align:center">' +
            '<div style="font-size:46px;margin-bottom:8px">✅</div>' +
            '<div style="color:#f1f5f9;font-size:16px;font-weight:600">Pago de ' + cmPayCentsToEur(importeCents) + ' EUR registrado</div>' +
            '<div style="color:#94a3b8;font-size:13px;margin-top:6px">Puedes generar el recibo en PDF para entregarlo a la familia.</div>' +
        '</div>' +
        '<div class="cmpay-modal-footer">' +
            '<button class="cmpay-btn cmpay-btn-secondary" onclick="cmPayCerrarModalPago()">Cerrar</button>' +
            '<button class="cmpay-btn cmpay-btn-primary" onclick="cmPayGenerarRecibo(\'' + txId + '\')">Descargar recibo PDF</button>' +
        '</div>';
}

// Obtiene el siguiente numero de recibo del club (correlativo, con
// reinicio anual). Crea la configuracion del club si aun no existe.
async function cmPayObtenerNumeroRecibo() {
    var anioActual = new Date().getFullYear();

    var res = await supabaseClient.from('cm_pay_club_config').select('*').eq('club_id', clubId).maybeSingle();
    var config = res.data;

    if (!config) {
        var nueva = {
            club_id: clubId, receipt_prefix: 'R', receipt_next_number: 1,
            receipt_year: anioActual, default_currency: 'EUR'
        };
        var resC = await supabaseClient.from('cm_pay_club_config').insert(nueva).select().single();
        if (resC.error) throw resC.error;
        config = resC.data;
    }

    var prefix = config.receipt_prefix || 'R';
    var year   = config.receipt_year || anioActual;
    var next   = config.receipt_next_number || 1;

    // Reinicio anual de la numeracion
    if (year !== anioActual) { year = anioActual; next = 1; }

    // Incrementar el contador en la base de datos
    var resU = await supabaseClient.from('cm_pay_club_config')
        .update({ receipt_next_number: next + 1, receipt_year: year, updated_at: new Date().toISOString() })
        .eq('club_id', clubId);
    if (resU.error) throw resU.error;

    return { prefix: prefix, number: next, year: year };
}

// Genera (o regenera) el recibo PDF de una transaccion de pago.
async function cmPayGenerarRecibo(txId) {
    showToast('Generando recibo...');
    try {
        // 1. Transaccion + asignacion + concepto + jugador
        var resTx = await supabaseClient.from('cm_pay_transactions')
            .select('*, cm_pay_assignments(*, cm_pay_concepts(name), club_players(name,first_name,last_name))')
            .eq('id', txId).single();
        if (resTx.error) throw resTx.error;
        var tx = resTx.data;
        var asig = tx.cm_pay_assignments || {};
        var concepto = asig.cm_pay_concepts ? asig.cm_pay_concepts.name : 'Concepto';
        var jp = asig.club_players || {};
        var nombreJug = jp.name || ((jp.first_name || '') + ' ' + (jp.last_name || '')).trim() || 'Jugador';

        // 2. Nombre del club
        var resClub = await supabaseClient.from('clubs').select('name').eq('id', clubId).single();
        var clubName = resClub.data ? resClub.data.name : 'Club';

        // 3. Numero de recibo: si la transaccion ya tiene recibo, se reutiliza
        var invoice;
        if (tx.invoice_id) {
            var resInv = await supabaseClient.from('cm_pay_invoices').select('*').eq('id', tx.invoice_id).single();
            if (resInv.error) throw resInv.error;
            invoice = resInv.data;
        } else {
            var num = await cmPayObtenerNumeroRecibo();
            var fullRef = num.prefix + '-' + num.year + '-' + String(num.number).padStart(5, '0');
            var nuevaInv = {
                club_id: clubId, series: num.prefix, number: num.number, fiscal_year: num.year,
                full_reference: fullRef, player_id: asig.player_id || null,
                recipient_name: nombreJug, total_cents: tx.amount_cents, concept_summary: concepto,
                issued_by: (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.id : null,
                issued_at: new Date().toISOString()
            };
            var resInsInv = await supabaseClient.from('cm_pay_invoices').insert(nuevaInv).select().single();
            if (resInsInv.error) throw resInsInv.error;
            invoice = resInsInv.data;
            await supabaseClient.from('cm_pay_transactions').update({ invoice_id: invoice.id }).eq('id', txId);
        }

        // 4. Configuracion (datos fiscales del club)
        var resCfg = await supabaseClient.from('cm_pay_club_config').select('*').eq('club_id', clubId).maybeSingle();
        var cfg = resCfg.data || {};

        // 5. Construir el PDF
        cmPayConstruirPDFRecibo({
            invoice: invoice, tx: tx, asig: asig, concepto: concepto,
            nombreJug: nombreJug, clubName: clubName, cfg: cfg
        });
        showToast('Recibo ' + invoice.full_reference + ' generado');
    } catch (e) {
        console.error('cmPayGenerarRecibo:', e);
        showToast('Error al generar el recibo: ' + (e.message || e), 'error');
    }
}

// Dibuja el PDF del recibo con jsPDF. Sin emojis (jsPDF no los soporta).
function cmPayConstruirPDFRecibo(d) {
    var doc = new jspdf.jsPDF('p', 'mm', 'a4');
    var margen = 20, ancho = 170, y = 22;
    var cfg = d.cfg || {};
    var nombreClub = cfg.legal_name || d.clubName || 'Club';

    // Cabecera del club
    doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.setTextColor(30);
    doc.text(nombreClub, margen, y); y += 7;
    doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(110);
    if (cfg.tax_id) { doc.text('NIF/CIF: ' + cfg.tax_id, margen, y); y += 4; }
    if (cfg.fiscal_address) { doc.text(String(cfg.fiscal_address), margen, y); y += 4; }
    y += 5;

    // Titulo RECIBO + numero
    doc.setDrawColor(59, 130, 246); doc.setLineWidth(0.5);
    doc.line(margen, y, margen + ancho, y); y += 9;
    doc.setFontSize(18); doc.setFont(undefined, 'bold'); doc.setTextColor(30);
    doc.text('RECIBO', margen, y);
    doc.setFontSize(12); doc.setTextColor(59, 130, 246);
    doc.text(d.invoice.full_reference, margen + ancho, y, { align: 'right' });
    y += 7;
    doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(110);
    var fechaEmision = d.invoice.issued_at ? new Date(d.invoice.issued_at).toLocaleDateString('es-ES') : '';
    doc.text('Fecha de emision: ' + fechaEmision, margen, y); y += 9;

    // Pagador
    doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(60);
    doc.text('Recibi de:', margen, y); y += 5;
    doc.setFont(undefined, 'normal'); doc.setTextColor(40);
    doc.text(d.nombreJug, margen, y); y += 9;

    // Cabecera de la tabla de detalle
    doc.setFillColor(241, 245, 249);
    doc.rect(margen, y, ancho, 8, 'F');
    doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(100);
    doc.text('CONCEPTO', margen + 3, y + 5);
    doc.text('PERIODO', margen + 95, y + 5);
    doc.text('IMPORTE', margen + ancho - 3, y + 5, { align: 'right' });
    y += 8;

    // Linea de detalle
    doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.setTextColor(40);
    var periodo = cmPayFechaCorta(d.asig.period_start) +
                  (d.asig.period_end ? ' a ' + cmPayFechaCorta(d.asig.period_end) : '');
    doc.text(String(d.concepto), margen + 3, y + 6);
    doc.text(periodo, margen + 95, y + 6);
    doc.text(cmPayCentsToEur(d.tx.amount_cents) + ' EUR', margen + ancho - 3, y + 6, { align: 'right' });
    y += 11;
    doc.setDrawColor(220); doc.line(margen, y, margen + ancho, y); y += 9;

    // Total
    doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.setTextColor(30);
    doc.text('TOTAL PAGADO:', margen + 95, y);
    doc.setTextColor(59, 130, 246);
    doc.text(cmPayCentsToEur(d.tx.amount_cents) + ' EUR', margen + ancho - 3, y, { align: 'right' });
    y += 13;

    // Metodo y fecha de pago
    var metodos = { cash: 'Efectivo', transfer: 'Transferencia', bizum_manual: 'Bizum', pos_local: 'Datafono / TPV' };
    doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(80);
    doc.text('Metodo de pago: ' + (metodos[d.tx.method] || d.tx.method || '-'), margen, y); y += 5;
    var fechaPago = d.tx.paid_at ? new Date(d.tx.paid_at).toLocaleDateString('es-ES') : '';
    doc.text('Fecha del pago: ' + fechaPago, margen, y); y += 5;
    if (d.tx.reference) { doc.text('Referencia: ' + d.tx.reference, margen, y); y += 5; }
    y += 8;

    // Texto legal opcional
    if (cfg.receipt_legal_text) {
        doc.setFontSize(8); doc.setTextColor(130);
        var lt = doc.splitTextToSize(String(cfg.receipt_legal_text), ancho);
        doc.text(lt, margen, y); y += lt.length * 4 + 4;
    }

    // Pie
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text('Documento generado con TopLiderCoach - ' + nombreClub, margen, 285);

    doc.save('Recibo_' + d.invoice.full_reference + '.pdf');
}


// ========== PESTANA: LIQUIDACION ==========
// Placeholder permanente en P.1. Se activa en la Fase P.2.
function cmPayTabLiquidacion(cont) {
    cont.innerHTML =
        '<div class="cmpay-empty">' +
            '<div class="icon">🏦</div>' +
            '<h3>Liquidacion</h3>' +
            '<p>El detalle de liquidaciones estara disponible cuando se active<br>la pasarela de pago online.</p>' +
            '<div class="cmpay-soon">Disponible en la Fase P.2</div>' +
        '</div>';
}


// ============================================================
// PESTANA: CONFIGURACION  (Paso 5A)
// Datos fiscales del club y numeracion de recibos.
// ============================================================

function cmPayTabConfig(cont) {
    cont.innerHTML = '<div class="cmpay-empty"><div class="icon">⏳</div><p>Cargando configuracion...</p></div>';
    cmPayCargarConfig(cont);
}

// Carga la configuracion del club (la crea con valores por defecto si no existe).
async function cmPayCargarConfig(cont) {
    try {
        var res = await supabaseClient.from('cm_pay_club_config').select('*').eq('club_id', clubId).maybeSingle();
        var cfg = res.data;
        if (!cfg) {
            var nueva = {
                club_id: clubId, receipt_prefix: 'R', receipt_next_number: 1,
                receipt_year: new Date().getFullYear(), default_currency: 'EUR'
            };
            var resC = await supabaseClient.from('cm_pay_club_config').insert(nueva).select().single();
            if (resC.error) throw resC.error;
            cfg = resC.data;
        }
        cmPayConfig = cfg;
        cmPayRenderConfig(cont, cfg);
    } catch (e) {
        console.error('cmPayCargarConfig:', e);
        cont.innerHTML = '<div class="cmpay-empty"><div class="icon">⚠️</div><p>Error al cargar la configuracion</p></div>';
    }
}

// Pinta el formulario de configuracion.
function cmPayRenderConfig(cont, cfg) {
    var v = function(x) { return x == null ? '' : cmPayEsc(x); };
    var editable = cmPayPuedeEditar();
    cont.innerHTML =
        '<div style="max-width:620px">' +
            '<div class="cmpay-config-section">' +
                '<h3 class="cmpay-config-title">Datos fiscales del club</h3>' +
                '<p class="cmpay-config-hint">Estos datos apareceran en los recibos PDF que entregas a las familias.</p>' +
                '<div class="cmpay-form-group"><label>Nombre legal del club</label>' +
                    '<input type="text" id="cmpay-cfg-legal" value="' + v(cfg.legal_name) + '" placeholder="Ej: Club Deportivo Ejemplo"></div>' +
                '<div class="cmpay-form-row">' +
                    '<div class="cmpay-form-group"><label>NIF / CIF</label>' +
                        '<input type="text" id="cmpay-cfg-taxid" value="' + v(cfg.tax_id) + '" placeholder="Ej: G12345678"></div>' +
                    '<div class="cmpay-form-group"><label>Moneda</label>' +
                        '<input type="text" id="cmpay-cfg-currency" value="' + (v(cfg.default_currency) || 'EUR') + '"></div>' +
                '</div>' +
                '<div class="cmpay-form-group"><label>Direccion fiscal</label>' +
                    '<input type="text" id="cmpay-cfg-address" value="' + v(cfg.fiscal_address) + '" placeholder="Calle, numero, codigo postal, localidad"></div>' +
            '</div>' +
            '<div class="cmpay-config-section">' +
                '<h3 class="cmpay-config-title">Recibos</h3>' +
                '<p class="cmpay-config-hint">El numero de recibo se forma con el prefijo, el ano y un numero correlativo (ej: R-' + new Date().getFullYear() + '-00001).</p>' +
                '<div class="cmpay-form-row">' +
                    '<div class="cmpay-form-group"><label>Prefijo de serie</label>' +
                        '<input type="text" id="cmpay-cfg-prefix" value="' + (v(cfg.receipt_prefix) || 'R') + '"></div>' +
                    '<div class="cmpay-form-group"><label>Proximo numero</label>' +
                        '<input type="number" min="1" id="cmpay-cfg-next" value="' + (cfg.receipt_next_number || 1) + '"></div>' +
                '</div>' +
                '<div class="cmpay-form-group"><label>Texto legal del recibo (opcional)</label>' +
                    '<textarea id="cmpay-cfg-legaltext" placeholder="Ej: Este recibo justifica el pago de la cuota indicada...">' + v(cfg.receipt_legal_text) + '</textarea></div>' +
            '</div>' +
            '<button class="cmpay-btn cmpay-btn-primary" onclick="cmPayGuardarConfig()">Guardar configuracion</button>' +
        '</div>';

    if (!editable) {
        var aviso = document.querySelector('#cmpay-tab-content [onclick="cmPayGuardarConfig()"]');
        if (aviso) {
            aviso.outerHTML = '<div class="cmpay-config-hint" style="margin:0">Solo lectura: no tienes permiso para modificar esta configuracion.</div>';
        }
        cont.querySelectorAll('input, textarea').forEach(function(el) { el.disabled = true; });
    }
}

// Guarda los cambios de configuracion.
async function cmPayGuardarConfig() {
    var nextRaw = parseInt(document.getElementById('cmpay-cfg-next').value, 10);
    var upd = {
        legal_name:          document.getElementById('cmpay-cfg-legal').value.trim() || null,
        tax_id:              document.getElementById('cmpay-cfg-taxid').value.trim() || null,
        fiscal_address:      document.getElementById('cmpay-cfg-address').value.trim() || null,
        default_currency:    document.getElementById('cmpay-cfg-currency').value.trim() || 'EUR',
        receipt_prefix:      document.getElementById('cmpay-cfg-prefix').value.trim() || 'R',
        receipt_next_number: (isNaN(nextRaw) || nextRaw < 1) ? 1 : nextRaw,
        receipt_legal_text:  document.getElementById('cmpay-cfg-legaltext').value.trim() || null,
        updated_at:          new Date().toISOString()
    };
    var res = await supabaseClient.from('cm_pay_club_config').update(upd).eq('club_id', clubId);
    if (res.error) { showToast('Error al guardar: ' + res.error.message, 'error'); return; }
    if (cmPayConfig) { Object.keys(upd).forEach(function(k) { cmPayConfig[k] = upd[k]; }); }
    showToast('Configuracion guardada');
}


// ========== AUTO-MONTAJE ==========
(function cmPayAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 40) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (typeof cmPuedeVer !== 'function' || !cmPuedeVer('pagos_cuotas')) return;
        if (document.getElementById('cm-tab-pagos')) { clearInterval(intervalo); return; }
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;

        clearInterval(intervalo);

        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-pagos';
        tab.setAttribute('onclick', "cambiarModulo('pagos', this)");
        tab.innerHTML = '<span class="tab-icon">💶</span><span>Pagos</span>';
        mainTabs.appendChild(tab);

        if (!document.getElementById('modulo-pagos')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-pagos';
            var ultModulo = document.querySelector('.vista-modulo:last-of-type');
            if (ultModulo && ultModulo.parentElement) { ultModulo.parentElement.insertBefore(vista, ultModulo.nextSibling); }
            else { document.body.appendChild(vista); }
        }

        if (typeof registrarModulo === 'function') {
            registrarModulo('pagos', function() { cmPayInit('modulo-pagos'); });
        }

        var pd = document.getElementById('cm-pantalla-desarrollo');
        if (pd) {
            pd.style.display = 'none';
            var mt = document.querySelector('.main-tabs');
            if (mt) mt.style.display = '';
            document.querySelectorAll('.vista-modulo').forEach(function(v) { v.style.display = ''; });
        }

        var tv = Array.from(document.querySelectorAll('.main-tab')).filter(function(t) { return t.style.display !== 'none'; });
        if (tv.length === 1 && tv[0].id === 'cm-tab-pagos') { cambiarModulo('pagos', tab); }

        console.log('[Modulo Pagos] Auto-montado y registrado');
    }, 300);
})();