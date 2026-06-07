// ============================================================
// CM-ECONOMICO.JS - Modulo Economico (contabilidad del club)
// TopLiderCoach HUB - Club Mode - Oficina
// ============================================================
// Gastos (captura por IA), aprobacion y pago, ingresos, presupuesto,
// y control economico de la RFEF. Permiso 'economico'. Prefijo: cmEco
//
// Importes en centimos. Helpers cmEcoEurToCents / cmEcoCentsToEur.
//
// Plan A:
//   A.1 Motor OCR (eco-ocr-receipt) ................ HECHO
//   A.2 Esqueleto + Resumen ........................ HECHO
//   A.3 Pestana Gastos (captura por foto) .......... HECHO
//   A.4.1 Aprobar / rechazar / pagar (buzon) ....... ESTE ARCHIVO
//   A.4.2 Pagado por + IBAN + remesa de reembolsos . siguiente
// ============================================================

// Seguridad gestionada en el servidor (Supabase). Este archivo no contiene claves.

// ========== ESTADO ==========
var cmEcoTabActiva   = 'resumen';
var cmEcoContainerId = null;
var cmEcoSettings    = null;
var cmEcoEjercicio   = null;
var cmEcoReady       = false;

var cmEcoCatGasto    = [];
var cmEcoCentros     = [];
var cmEcoGastos      = [];
var cmEcoArchivo     = null;
var cmEcoFiltroEstado = 'all';      // all | enviada | aprobada | pagada | rechazada
var cmEcoSeleccion    = {};         // { sheet_id: total_cents } para pago en lote
var cmEcoMiembros     = [];         // club_members (id, display_name)
var cmEcoBancos       = {};         // { member_id: {iban, holder_name} }
var cmEcoReembData    = [];         // hojas con paid_by_member (para la pestana Reembolsos)

var CMECO_NIVEL_LABEL = {
    ninguno:'Sin control economico', elemental:'Control Elemental',
    intermedio:'Control Intermedio', avanzado:'Control Avanzado'
};
var CMECO_CATEGORIA_LABEL = {
    base:'Base / territorial', tercera:'Tercera Federacion',
    segunda:'Segunda Federacion', primera:'Primera Federacion'
};
var CMECO_ESTADO = {
    borrador:  ['Borrador',  'background:#334155;color:#94a3b8'],
    enviada:   ['En buzon',  'background:#1e3a5f;color:#60a5fa'],
    aprobada:  ['Aprobada',  'background:#1e4f2e;color:#86efac'],
    rechazada: ['Rechazada', 'background:#4f1e1e;color:#fca5a5'],
    pagada:    ['Pagada',    'background:#1e4f4f;color:#5eead4']
};
var CMECO_METODO = { transferencia:'Transferencia', efectivo:'Efectivo', tarjeta:'Tarjeta', domiciliacion:'Domiciliacion' };


// ========== HELPERS ==========
function cmEcoEurToCents(str) {
    if (str === null || str === undefined) return null;
    var s = String(str).trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    if (s === '') return null;
    var n = parseFloat(s);
    if (isNaN(n) || n < 0) return null;
    return Math.round(n * 100);
}
function cmEcoCentsToEur(cents) {
    var n = (cents || 0) / 100;
    return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function cmEcoEsc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function cmEcoFechaCorta(d) {
    if (!d) return '';
    var p = String(d).split('-');
    if (p.length < 3) return d;
    return p[2].substring(0, 2) + '/' + p[1] + '/' + p[0].substring(2);
}
function cmEcoPuedeEditar() {
    return (typeof cmPuedeEditar === 'function') ? cmPuedeEditar('economico') : true;
}
function cmEcoMiembroId() {
    return (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.id : null;
}
function cmEcoFileToBase64(file) {
    return new Promise(function(resolve, reject) {
        var r = new FileReader();
        r.onload = function() { resolve(String(r.result).split(',')[1]); };
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}
async function cmEcoInvoke(fn, body) {
    var r = await supabaseClient.functions.invoke(fn, { body: body });
    if (r.error) throw r.error;
    return r.data;
}


// ========== INIT ==========
async function cmEcoInit(containerId) {
    var container = document.getElementById(containerId);
    if (!container) { console.error('cmEcoInit: contenedor no encontrado:', containerId); return; }
    cmEcoContainerId = containerId;
    cmEcoRenderPanel(container);
    await cmEcoCargarContexto();
    cmEcoRenderContexto();
    cmEcoCambiarTab('resumen');
}
async function cmEcoCargarContexto() {
    try {
        var rs = await supabaseClient.from('cm_eco_settings').select('*').eq('club_id', clubId).maybeSingle();
        cmEcoSettings = rs.data || null;
        var re = await supabaseClient.from('cm_eco_fiscal_years').select('*').eq('club_id', clubId).eq('is_current', true).maybeSingle();
        cmEcoEjercicio = re.data || null;
        cmEcoReady = true;
    } catch (e) { console.error('cmEcoCargarContexto:', e); }
}


// ========== RENDER PANEL ==========
function cmEcoRenderPanel(container) {
    container.innerHTML =
    '<style>' +
        '.cmeco-wrap{background:#0f172a;min-height:calc(100vh - 120px);padding:24px 20px;box-sizing:border-box}' +
        '.cmeco-panel{max-width:1200px;margin:0 auto}' +
        '.cmeco-header h2{margin:0;color:#f1f5f9;font-size:20px;font-weight:700}' +
        '.cmeco-header .cmeco-sub{color:#94a3b8;font-size:12px;margin-top:2px}' +
        '.cmeco-ctx{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 18px}' +
        '.cmeco-chip{display:inline-flex;align-items:center;gap:6px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;font-size:12px;font-weight:600;padding:5px 12px;border-radius:20px}' +
        '.cmeco-chip b{color:#60a5fa;font-weight:700}' +
        '.cmeco-tabs{display:flex;gap:0;border-bottom:1px solid #1e293b;margin-bottom:20px;flex-wrap:wrap}' +
        '.cmeco-tab{padding:10px 18px;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all .2s}' +
        '.cmeco-tab:hover{color:#e2e8f0}.cmeco-tab.active{color:#3b82f6;border-bottom-color:#3b82f6}' +
        '.cmeco-empty{text-align:center;padding:60px 20px;color:#64748b}' +
        '.cmeco-empty .icon{font-size:48px;margin-bottom:14px}' +
        '.cmeco-empty h3{color:#e2e8f0;font-size:16px;margin:0 0 6px}.cmeco-empty p{font-size:13px;margin:0;line-height:1.6}' +
        '.cmeco-soon{display:inline-block;margin-top:14px;background:#1e293b;border:1px solid #334155;color:#60a5fa;font-size:12px;padding:6px 14px;border-radius:8px}' +
        '.cmeco-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}' +
        '.cmeco-kpi{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:18px 16px;text-align:center}' +
        '.cmeco-kpi .kpi-val{font-size:24px;font-weight:700}.cmeco-kpi .kpi-cur{font-size:13px;color:#94a3b8;font-weight:600}' +
        '.cmeco-kpi .kpi-lbl{font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:.5px}' +
        '.cmeco-kpi.ing .kpi-val{color:#22c55e}.cmeco-kpi.gas .kpi-val{color:#f59e0b}' +
        '.cmeco-kpi.res-pos .kpi-val{color:#60a5fa}.cmeco-kpi.res-neg .kpi-val{color:#ef4444}' +
        '.cmeco-btn{padding:8px 16px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s}' +
        '.cmeco-btn-primary{background:#3b82f6;color:#fff}.cmeco-btn-primary:hover{background:#2563eb}' +
        '.cmeco-btn-secondary{background:#334155;color:#e2e8f0}.cmeco-btn-secondary:hover{background:#475569}' +
        '.cmeco-btn-ok{background:#16a34a;color:#fff}.cmeco-btn-ok:hover{background:#15803d}' +
        '.cmeco-btn-danger{background:#dc2626;color:#fff}.cmeco-btn-danger:hover{background:#b91c1c}' +
        '.cmeco-btn-sm{padding:5px 10px;font-size:12px}' +
        '.cmeco-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}' +
        '.cmeco-filtros select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px;font-family:inherit;cursor:pointer}' +
        '.cmeco-selbar{display:none;align-items:center;justify-content:space-between;gap:12px;background:#13243f;border:1px solid #2b4a73;border-radius:8px;padding:10px 14px;margin-bottom:12px;flex-wrap:wrap}' +
        '.cmeco-selbar .info{color:#cbd5e1;font-size:13px;font-weight:600}' +
        '.cmeco-table-wrap{overflow-x:auto;border:1px solid #1e293b;border-radius:10px}' +
        '.cmeco-table{width:100%;border-collapse:collapse;font-size:13px}' +
        '.cmeco-table thead th{background:#1e293b;color:#94a3b8;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left;white-space:nowrap}' +
        '.cmeco-table th.num,.cmeco-table td.num{text-align:right}' +
        '.cmeco-table tbody td{padding:10px 12px;color:#e2e8f0;border-top:1px solid #1e293b}' +
        '.cmeco-table tbody tr:hover{background:#1e293b}' +
        '.cmeco-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap}' +
        '.cmeco-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9500;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}' +
        '.cmeco-modal{background:#0f172a;border:1px solid #334155;border-radius:14px;width:100%;max-width:560px}' +
        '.cmeco-modal-header{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #1e293b}' +
        '.cmeco-modal-header h3{margin:0;color:#f1f5f9;font-size:17px}' +
        '.cmeco-modal-close{background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1}.cmeco-modal-close:hover{color:#ef4444}' +
        '.cmeco-modal-body{padding:20px 22px}.cmeco-modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid #1e293b}' +
        '.cmeco-fg{margin-bottom:14px}.cmeco-fg label{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}' +
        '.cmeco-fg input,.cmeco-fg select,.cmeco-fg textarea{width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit;box-sizing:border-box}' +
        '.cmeco-fg textarea{min-height:50px;resize:vertical}' +
        '.cmeco-fg input:focus,.cmeco-fg select:focus,.cmeco-fg textarea:focus{border-color:#3b82f6;outline:none}' +
        '.cmeco-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cmeco-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}' +
        '.cmeco-drop{border:1px dashed #475569;border-radius:10px;padding:16px;text-align:center;color:#94a3b8;font-size:13px;background:#0b1322;margin-bottom:14px}' +
        '.cmeco-drop input{display:none}.cmeco-drop label{display:inline-block;margin-top:8px;cursor:pointer;background:#3b82f6;color:#fff;padding:7px 14px;border-radius:6px;font-weight:600}' +
        '.cmeco-ocr-status{font-size:12px;margin-top:8px}' +
        '@media(max-width:640px){.cmeco-tabs{overflow-x:auto;flex-wrap:nowrap}.cmeco-tab{white-space:nowrap}.cmeco-wrap{padding:16px 12px}.cmeco-kpis{grid-template-columns:1fr}.cmeco-row,.cmeco-row3{grid-template-columns:1fr}}' +
    '</style>' +
    '<div class="cmeco-wrap"><div class="cmeco-panel">' +
        '<div class="cmeco-header"><h2>Economico</h2>' +
            '<div class="cmeco-sub">Contabilidad, gastos, ingresos y control economico del club</div></div>' +
        '<div class="cmeco-ctx" id="cmeco-ctx"></div>' +
        '<div class="cmeco-tabs">' +
            '<button class="cmeco-tab active" id="cmeco-tab-resumen" onclick="cmEcoCambiarTab(\'resumen\',this)">Resumen</button>' +
            '<button class="cmeco-tab" id="cmeco-tab-gastos" onclick="cmEcoCambiarTab(\'gastos\',this)">Gastos</button>' +
            '<button class="cmeco-tab" id="cmeco-tab-reembolsos" onclick="cmEcoCambiarTab(\'reembolsos\',this)">Reembolsos</button>' +
            '<button class="cmeco-tab" id="cmeco-tab-ingresos" onclick="cmEcoCambiarTab(\'ingresos\',this)">Ingresos</button>' +
            '<button class="cmeco-tab" id="cmeco-tab-presupuesto" onclick="cmEcoCambiarTab(\'presupuesto\',this)">Presupuesto</button>' +
            '<button class="cmeco-tab" id="cmeco-tab-cumplimiento" onclick="cmEcoCambiarTab(\'cumplimiento\',this)">Control RFEF</button>' +
            '<button class="cmeco-tab" id="cmeco-tab-config" onclick="cmEcoCambiarTab(\'config\',this)">Configuracion</button>' +
        '</div>' +
        '<div id="cmeco-tab-content"></div>' +
    '</div></div>';
    cmEcoRenderContexto();
}
function cmEcoRenderContexto() {
    var cont = document.getElementById('cmeco-ctx');
    if (!cont) return;
    var chips = '';
    if (cmEcoSettings) {
        var cat = CMECO_CATEGORIA_LABEL[cmEcoSettings.rfef_category] || cmEcoSettings.rfef_category;
        var niv = CMECO_NIVEL_LABEL[cmEcoSettings.control_level] || cmEcoSettings.control_level;
        var forma = cmEcoSettings.legal_form === 'sad' ? 'S.A.D.' : 'Asociacion';
        chips += '<span class="cmeco-chip">Categoria: <b>' + cmEcoEsc(cat) + '</b></span>';
        chips += '<span class="cmeco-chip">' + cmEcoEsc(niv) + '</span><span class="cmeco-chip">' + forma + '</span>';
    }
    if (cmEcoEjercicio) chips += '<span class="cmeco-chip">Ejercicio: <b>' + cmEcoEsc(cmEcoEjercicio.name) + '</b></span>';
    cont.innerHTML = chips;
}


// ========== CAMBIO DE PESTANA ==========
function cmEcoCambiarTab(tab, btn) {
    cmEcoTabActiva = tab;
    document.querySelectorAll('.cmeco-tab').forEach(function(t) { t.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    else { var el = document.getElementById('cmeco-tab-' + tab); if (el) el.classList.add('active'); }
    var cont = document.getElementById('cmeco-tab-content');
    if (!cont) return;
    if (tab === 'resumen')      cmEcoTabResumen(cont);
    if (tab === 'gastos')       cmEcoTabGastos(cont);
    if (tab === 'reembolsos')   cmEcoTabReembolsos(cont);
    if (tab === 'ingresos')     cmEcoTabIngresos(cont);
    if (tab === 'presupuesto')  cmEcoTabPresupuesto(cont);
    if (tab === 'cumplimiento') cmEcoTabCumplimiento(cont);
    if (tab === 'config')       cmEcoTabConfig(cont);
}


// ============================================================
// RESUMEN
// ============================================================
function cmEcoTabResumen(cont) {
    if (!cmEcoEjercicio) {
        cont.innerHTML = '<div class="cmeco-empty"><div class="icon">&#128197;</div><h3>Sin ejercicio contable activo</h3>' +
            '<p>No hay un ejercicio marcado como actual para este club.</p></div>';
        return;
    }
    cont.innerHTML =
        '<div id="cmeco-resumen-kpis"><div class="cmeco-empty"><div class="icon">&#8987;</div><p>Calculando...</p></div></div>' +
        '<div style="color:#64748b;font-size:12px;margin-top:4px">Periodo: ' +
            cmEcoFechaCorta(cmEcoEjercicio.start_date) + ' &rarr; ' + cmEcoFechaCorta(cmEcoEjercicio.end_date) + '</div>';
    cmEcoCargarResumen();
}
async function cmEcoCargarResumen() {
    var cont = document.getElementById('cmeco-resumen-kpis');
    if (!cont) return;
    try {
        var fy = cmEcoEjercicio.id;
        var ri = await supabaseClient.from('cm_eco_incomes').select('total_cents').eq('club_id', clubId).eq('fiscal_year_id', fy).range(0, 9999);
        var ingresos = (ri.data || []).reduce(function(s, x) { return s + (x.total_cents || 0); }, 0);
        var rg = await supabaseClient.from('cm_eco_expense_sheets').select('total_cents,status').eq('club_id', clubId).eq('fiscal_year_id', fy).range(0, 9999);
        var gastos = (rg.data || []).reduce(function(s, x) { return s + (x.status === 'rechazada' ? 0 : (x.total_cents || 0)); }, 0);
        var resultado = ingresos - gastos;
        var resClase = resultado < 0 ? 'res-neg' : 'res-pos';
        cont.innerHTML =
            '<div class="cmeco-kpis">' +
                '<div class="cmeco-kpi ing"><div class="kpi-val">' + cmEcoCentsToEur(ingresos) + ' <span class="kpi-cur">EUR</span></div><div class="kpi-lbl">Ingresos</div></div>' +
                '<div class="cmeco-kpi gas"><div class="kpi-val">' + cmEcoCentsToEur(gastos) + ' <span class="kpi-cur">EUR</span></div><div class="kpi-lbl">Gastos</div></div>' +
                '<div class="cmeco-kpi ' + resClase + '"><div class="kpi-val">' + cmEcoCentsToEur(resultado) + ' <span class="kpi-cur">EUR</span></div><div class="kpi-lbl">Resultado</div></div>' +
            '</div>';
    } catch (e) {
        console.error('cmEcoCargarResumen:', e);
        cont.innerHTML = '<div class="cmeco-empty"><div class="icon">&#9888;</div><p>Error al calcular el resumen</p></div>';
    }
}


// ============================================================
// GASTOS  (A.3 captura + A.4.1 aprobar/rechazar/pagar)
// ============================================================
function cmEcoTabGastos(cont) {
    if (!cmEcoEjercicio) {
        cont.innerHTML = '<div class="cmeco-empty"><div class="icon">&#128197;</div><h3>Sin ejercicio activo</h3><p>Se necesita un ejercicio contable para registrar gastos.</p></div>';
        return;
    }
    var estados = [['all','Todos'],['enviada','En buzon'],['aprobada','Aprobados'],['pagada','Pagados'],['rechazada','Rechazados']];
    var estOpts = estados.map(function(o){ return '<option value="'+o[0]+'"'+(cmEcoFiltroEstado===o[0]?' selected':'')+'>'+o[1]+'</option>'; }).join('');
    cont.innerHTML =
        '<div class="cmeco-toolbar">' +
            '<div class="cmeco-filtros"><select id="cmeco-f-estado" onchange="cmEcoFiltrarGastos()">' + estOpts + '</select></div>' +
            (cmEcoPuedeEditar() ? '<button class="cmeco-btn cmeco-btn-primary" onclick="cmEcoAbrirModalGasto()">+ Nuevo gasto</button>' : '') +
        '</div>' +
        '<div class="cmeco-selbar" id="cmeco-selbar">' +
            '<span class="info" id="cmeco-selinfo"></span>' +
            '<button class="cmeco-btn cmeco-btn-ok cmeco-btn-sm" onclick="cmEcoPagarSeleccion()">Pagar seleccionados</button>' +
        '</div>' +
        '<div id="cmeco-gastos-tabla"><div class="cmeco-empty"><div class="icon">&#8987;</div><p>Cargando...</p></div></div>';
    cmEcoCargarGastos();
}

async function cmEcoCargarMiembros() {
    if (cmEcoMiembros.length === 0) {
        var rm = await supabaseClient.from('club_members')
            .select('id,display_name').eq('club_id', clubId).eq('active', true).order('display_name');
        cmEcoMiembros = rm.data || [];
    }
    var rb = await supabaseClient.from('cm_eco_member_bank')
        .select('member_id,iban,holder_name').eq('club_id', clubId);
    cmEcoBancos = {};
    (rb.data || []).forEach(function(b) { cmEcoBancos[b.member_id] = b; });
}

async function cmEcoCargarGastos() {
    var cont = document.getElementById('cmeco-gastos-tabla');
    if (!cont) return;
    try {
        if (cmEcoCatGasto.length === 0) {
            var rc = await supabaseClient.from('cm_eco_categories').select('id,name').eq('club_id', clubId).eq('kind', 'gasto').eq('is_active', true).order('name');
            cmEcoCatGasto = rc.data || [];
        }
        if (cmEcoCentros.length === 0) {
            var rcc = await supabaseClient.from('cm_eco_cost_centers').select('id,name').eq('club_id', clubId).eq('is_active', true).order('name');
            cmEcoCentros = rcc.data || [];
        }
        await cmEcoCargarMiembros();
        var rg = await supabaseClient.from('cm_eco_expense_items')
            .select('*, cm_eco_expense_sheets(status,title,fiscal_year_id,paid_at,payment_method,paid_by_member)')
            .eq('club_id', clubId).order('created_at', { ascending: false }).range(0, 9999);
        if (rg.error) throw rg.error;
        cmEcoGastos = (rg.data || []).filter(function(it) {
            var sh = it.cm_eco_expense_sheets;
            return sh && sh.fiscal_year_id === cmEcoEjercicio.id;
        });
        cmEcoRenderGastos();
    } catch (e) {
        console.error('cmEcoCargarGastos:', e);
        cont.innerHTML = '<div class="cmeco-empty"><div class="icon">&#9888;</div><p>Error al cargar los gastos</p></div>';
    }
}

function cmEcoFiltrarGastos() {
    var e = document.getElementById('cmeco-f-estado');
    if (e) cmEcoFiltroEstado = e.value;
    cmEcoSeleccion = {};
    cmEcoRenderGastos();
}

function cmEcoRenderGastos() {
    var cont = document.getElementById('cmeco-gastos-tabla');
    if (!cont) return;
    var editable = cmEcoPuedeEditar();

    var lista = cmEcoGastos.filter(function(g) {
        if (cmEcoFiltroEstado === 'all') return true;
        var sh = g.cm_eco_expense_sheets || {};
        return sh.status === cmEcoFiltroEstado;
    });

    if (lista.length === 0) {
        cont.innerHTML = '<div class="cmeco-empty"><div class="icon">&#128247;</div><h3>Sin gastos</h3>' +
            '<p>Pulsa "+ Nuevo gasto", sube la foto del ticket o la factura<br>y la IA rellenara los datos por ti.</p></div>';
        cmEcoActualizarBarraSel();
        return;
    }

    var catById = {}; cmEcoCatGasto.forEach(function(c) { catById[c.id] = c.name; });
    var cenById = {}; cmEcoCentros.forEach(function(c) { cenById[c.id] = c.name; });
    var memById = {}; cmEcoMiembros.forEach(function(m) { memById[m.id] = m.display_name; });

    var filas = '';
    lista.forEach(function(g) {
        var sh = g.cm_eco_expense_sheets || {};
        var st = sh.status || 'enviada';
        var est = CMECO_ESTADO[st] || CMECO_ESTADO.enviada;
        var sid = g.sheet_id;

        var chk = (editable && st === 'aprobada')
            ? '<input type="checkbox" onchange="cmEcoToggleSel(\'' + sid + '\',' + (g.total_cents || 0) + ',this.checked)"' + (cmEcoSeleccion[sid] ? ' checked' : '') + '>'
            : '';

        var ver = g.receipt_url
            ? '<button class="cmeco-btn cmeco-btn-secondary cmeco-btn-sm" onclick="cmEcoVerJustificante(\'' + cmEcoEsc(g.receipt_url) + '\')">Ver</button>'
            : '';

        var acc = '';
        if (editable) {
            if (st === 'enviada') {
                acc = '<button class="cmeco-btn cmeco-btn-ok cmeco-btn-sm" onclick="cmEcoAprobar(\'' + sid + '\')">Aprobar</button> ' +
                      '<button class="cmeco-btn cmeco-btn-danger cmeco-btn-sm" onclick="cmEcoRechazar(\'' + sid + '\')">Rechazar</button>';
            } else if (st === 'aprobada') {
                acc = '<button class="cmeco-btn cmeco-btn-primary cmeco-btn-sm" onclick="cmEcoAbrirModalPago([\'' + sid + '\'])">Pagar</button>';
            } else if (st === 'pagada') {
                acc = '<span style="color:#5eead4;font-size:12px">' + (sh.paid_at ? cmEcoFechaCorta(sh.paid_at) : '') +
                      (sh.payment_method ? ' &middot; ' + (CMECO_METODO[sh.payment_method] || sh.payment_method) : '') + '</span>';
            } else if (st === 'rechazada') {
                acc = '<button class="cmeco-btn cmeco-btn-secondary cmeco-btn-sm" onclick="cmEcoReabrir(\'' + sid + '\')">Reabrir</button>';
            }
        }
        var accCell = (acc || ver) ? (acc + (acc && ver ? ' ' : '') + ver) : '<span style="color:#64748b">-</span>';

        var pp = sh.paid_by_member;
        var ppTxt = pp ? cmEcoEsc(memById[pp] || 'Miembro') : '<span style="color:#64748b">Club / proveedor</span>';

        filas += '<tr>' +
            '<td>' + chk + '</td>' +
            '<td>' + (g.expense_date ? cmEcoFechaCorta(g.expense_date) : '-') + '</td>' +
            '<td>' + cmEcoEsc(g.supplier_name || g.description || 'Gasto') + '</td>' +
            '<td>' + cmEcoEsc(catById[g.category_id] || '-') + '</td>' +
            '<td>' + cmEcoEsc(cenById[g.cost_center_id] || '-') + '</td>' +
            '<td>' + ppTxt + '</td>' +
            '<td class="num">' + cmEcoCentsToEur(g.total_cents) + '</td>' +
            '<td><span class="cmeco-badge" style="' + est[1] + '">' + est[0] + '</span></td>' +
            '<td style="white-space:nowrap">' + accCell + '</td>' +
        '</tr>';
    });

    var total = lista.reduce(function(s, g) { return s + (g.total_cents || 0); }, 0);
    cont.innerHTML =
        '<div style="color:#64748b;font-size:12px;margin-bottom:8px">' + lista.length + ' gastos &middot; total ' + cmEcoCentsToEur(total) + ' EUR</div>' +
        '<div class="cmeco-table-wrap"><table class="cmeco-table"><thead><tr>' +
            '<th></th><th>Fecha</th><th>Proveedor</th><th>Categoria</th><th>Centro de coste</th>' +
            '<th>Pagado por</th><th class="num">Total</th><th>Estado</th><th>Acciones</th>' +
        '</tr></thead><tbody>' + filas + '</tbody></table></div>';
    cmEcoActualizarBarraSel();
}

// ---- Seleccion para pago en lote ----
function cmEcoToggleSel(sid, totalCents, checked) {
    if (checked) cmEcoSeleccion[sid] = totalCents;
    else delete cmEcoSeleccion[sid];
    cmEcoActualizarBarraSel();
}
function cmEcoActualizarBarraSel() {
    var bar = document.getElementById('cmeco-selbar');
    var info = document.getElementById('cmeco-selinfo');
    if (!bar || !info) return;
    var ids = Object.keys(cmEcoSeleccion);
    if (ids.length === 0) { bar.style.display = 'none'; return; }
    var total = ids.reduce(function(s, k) { return s + (cmEcoSeleccion[k] || 0); }, 0);
    info.textContent = ids.length + ' gastos seleccionados \u00b7 total ' + cmEcoCentsToEur(total) + ' EUR';
    bar.style.display = 'flex';
}
function cmEcoPagarSeleccion() {
    var ids = Object.keys(cmEcoSeleccion);
    if (ids.length === 0) return;
    cmEcoAbrirModalPago(ids);
}

// ---- Aprobar / Rechazar / Reabrir ----
async function cmEcoAprobar(sid) {
    var res = await supabaseClient.from('cm_eco_expense_sheets')
        .update({ status: 'aprobada', approved_by: cmEcoMiembroId(), approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', sid);
    if (res.error) { showToast('Error al aprobar: ' + res.error.message, 'error'); return; }
    showToast('Gasto aprobado');
    cmEcoCargarGastos();
}
async function cmEcoRechazar(sid) {
    var res = await supabaseClient.from('cm_eco_expense_sheets')
        .update({ status: 'rechazada', updated_at: new Date().toISOString() }).eq('id', sid);
    if (res.error) { showToast('Error al rechazar: ' + res.error.message, 'error'); return; }
    showToast('Gasto rechazado');
    cmEcoCargarGastos();
}
async function cmEcoReabrir(sid) {
    var res = await supabaseClient.from('cm_eco_expense_sheets')
        .update({ status: 'enviada', updated_at: new Date().toISOString() }).eq('id', sid);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Gasto devuelto al buzon');
    cmEcoCargarGastos();
}

// ---- Modal de pago (individual o lote) ----
function cmEcoAbrirModalPago(ids) {
    var total = 0;
    ids.forEach(function(id) {
        var g = cmEcoGastos.find(function(x) { return x.sheet_id === id; });
        if (g) total += (g.total_cents || 0);
    });
    var hoy = new Date();
    var hoyStr = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    var metOpts = Object.keys(CMECO_METODO).map(function(k) { return '<option value="' + k + '">' + CMECO_METODO[k] + '</option>'; }).join('');

    var overlay = document.createElement('div');
    overlay.className = 'cmeco-modal-overlay';
    overlay.id = 'cmeco-modal-pago';
    overlay.onclick = function(e) { if (e.target === overlay) cmEcoCerrarModalPago(); };
    overlay.innerHTML =
        '<div class="cmeco-modal">' +
            '<div class="cmeco-modal-header"><h3>Marcar como pagado</h3>' +
                '<button class="cmeco-modal-close" onclick="cmEcoCerrarModalPago()">&times;</button></div>' +
            '<div class="cmeco-modal-body">' +
                '<input type="hidden" id="cmeco-pago-ids" value="' + ids.join(',') + '">' +
                '<div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px 14px;margin-bottom:16px">' +
                    '<div style="color:#f1f5f9;font-weight:600">' + ids.length + (ids.length === 1 ? ' gasto' : ' gastos') + '</div>' +
                    '<div style="color:#5eead4;font-size:14px;margin-top:4px;font-weight:600">Total a pagar: ' + cmEcoCentsToEur(total) + ' EUR</div>' +
                '</div>' +
                '<div class="cmeco-row">' +
                    '<div class="cmeco-fg"><label>Fecha del pago *</label><input type="date" id="cmeco-pago-fecha" value="' + hoyStr + '"></div>' +
                    '<div class="cmeco-fg"><label>Metodo</label><select id="cmeco-pago-metodo">' + metOpts + '</select></div>' +
                '</div>' +
            '</div>' +
            '<div class="cmeco-modal-footer">' +
                '<button class="cmeco-btn cmeco-btn-secondary" onclick="cmEcoCerrarModalPago()">Cancelar</button>' +
                '<button class="cmeco-btn cmeco-btn-ok" id="cmeco-pago-ok" onclick="cmEcoConfirmarPago()">Confirmar pago</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);
}
function cmEcoCerrarModalPago() {
    var o = document.getElementById('cmeco-modal-pago');
    if (o) o.remove();
}
async function cmEcoConfirmarPago() {
    var ids = document.getElementById('cmeco-pago-ids').value.split(',').filter(Boolean);
    var fecha = document.getElementById('cmeco-pago-fecha').value;
    var metodo = document.getElementById('cmeco-pago-metodo').value;
    if (!fecha) { showToast('Indica la fecha del pago', 'error'); return; }
    if (ids.length === 0) return;
    var btn = document.getElementById('cmeco-pago-ok');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
    try {
        var res = await supabaseClient.from('cm_eco_expense_sheets')
            .update({ status: 'pagada', paid_at: fecha, payment_method: metodo, updated_at: new Date().toISOString() })
            .in('id', ids);
        if (res.error) throw res.error;
        showToast(ids.length === 1 ? 'Gasto pagado' : ids.length + ' gastos pagados');
        cmEcoSeleccion = {};
        cmEcoCerrarModalPago();
        cmEcoCargarGastos();
    } catch (e) {
        console.error('cmEcoConfirmarPago:', e);
        showToast('Error al pagar: ' + (e.message || e), 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Confirmar pago'; }
    }
}

// ---- Ver justificante ----
async function cmEcoVerJustificante(path) {
    try {
        var d = await cmEcoInvoke('eco-upload-receipt', { action: 'sign', path: path });
        if (d && d.signed_url) window.open(d.signed_url, '_blank');
        else showToast('No se pudo abrir el justificante', 'error');
    } catch (e) { console.error('cmEcoVerJustificante:', e); showToast('No se pudo abrir el justificante', 'error'); }
}

// ---- Modal nuevo gasto (A.3) ----
function cmEcoAbrirModalGasto() {
    cmEcoArchivo = null;
    var catOpts = '<option value="">(sin categoria)</option>' + cmEcoCatGasto.map(function(c) { return '<option value="' + c.id + '">' + cmEcoEsc(c.name) + '</option>'; }).join('');
    var cenOpts = '<option value="">(sin centro de coste)</option>' + cmEcoCentros.map(function(c) { return '<option value="' + c.id + '">' + cmEcoEsc(c.name) + '</option>'; }).join('');
    var memOpts = '<option value="">El club (pago directo al proveedor)</option>' + cmEcoMiembros.map(function(m) { return '<option value="' + m.id + '">' + cmEcoEsc(m.display_name) + '</option>'; }).join('');
    var overlay = document.createElement('div');
    overlay.className = 'cmeco-modal-overlay';
    overlay.id = 'cmeco-modal-gasto';
    overlay.onclick = function(e) { if (e.target === overlay) cmEcoCerrarModalGasto(); };
    overlay.innerHTML =
        '<div class="cmeco-modal">' +
            '<div class="cmeco-modal-header"><h3>Nuevo gasto</h3><button class="cmeco-modal-close" onclick="cmEcoCerrarModalGasto()">&times;</button></div>' +
            '<div class="cmeco-modal-body">' +
                '<div class="cmeco-drop">Sube la foto del ticket o la factura (PDF) y la IA rellenara los datos.' +
                    '<input type="file" id="cmeco-file" accept="image/*,application/pdf" onchange="cmEcoOcrArchivo(this)">' +
                    '<label for="cmeco-file">Elegir archivo</label>' +
                    '<div class="cmeco-ocr-status" id="cmeco-ocr-status"></div></div>' +
                '<div class="cmeco-row">' +
                    '<div class="cmeco-fg"><label>Proveedor</label><input type="text" id="cmeco-g-prov"></div>' +
                    '<div class="cmeco-fg"><label>NIF / CIF</label><input type="text" id="cmeco-g-nif"></div></div>' +
                '<div class="cmeco-row3">' +
                    '<div class="cmeco-fg"><label>Fecha</label><input type="date" id="cmeco-g-fecha"></div>' +
                    '<div class="cmeco-fg"><label>Base (EUR)</label><input type="text" inputmode="decimal" id="cmeco-g-base" placeholder="0,00"></div>' +
                    '<div class="cmeco-fg"><label>IVA %</label><input type="text" inputmode="decimal" id="cmeco-g-iva" placeholder="21"></div></div>' +
                '<div class="cmeco-row">' +
                    '<div class="cmeco-fg"><label>Total (EUR) *</label><input type="text" inputmode="decimal" id="cmeco-g-total" placeholder="0,00"></div>' +
                    '<div class="cmeco-fg"><label>Categoria</label><select id="cmeco-g-cat">' + catOpts + '</select></div></div>' +
                '<div class="cmeco-fg"><label>Centro de coste</label><select id="cmeco-g-centro">' + cenOpts + '</select></div>' +
                '<div class="cmeco-fg"><label>Pagado por (a quien se reembolsa)</label><select id="cmeco-g-pagadopor">' + memOpts + '</select></div>' +
                '<div class="cmeco-fg"><label>Descripcion (opcional)</label><textarea id="cmeco-g-desc"></textarea></div>' +
            '</div>' +
            '<div class="cmeco-modal-footer">' +
                '<button class="cmeco-btn cmeco-btn-secondary" onclick="cmEcoCerrarModalGasto()">Cancelar</button>' +
                '<button class="cmeco-btn cmeco-btn-primary" id="cmeco-g-guardar" onclick="cmEcoGuardarGasto()">Guardar gasto</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);
}
function cmEcoCerrarModalGasto() {
    var o = document.getElementById('cmeco-modal-gasto');
    if (o) o.remove();
    cmEcoArchivo = null;
}
async function cmEcoOcrArchivo(input) {
    var f = input.files[0];
    if (!f) return;
    var status = document.getElementById('cmeco-ocr-status');
    try {
        var b64 = await cmEcoFileToBase64(f);
        cmEcoArchivo = { base64: b64, mediaType: f.type || 'image/jpeg', name: f.name };
        if (status) status.innerHTML = '<span style="color:#60a5fa">Leyendo con IA...</span>';
        var d = await cmEcoInvoke('eco-ocr-receipt', { image_base64: b64, media_type: cmEcoArchivo.mediaType });
        var set = function(id, val) { var el = document.getElementById(id); if (el && val != null && val !== '') el.value = val; };
        set('cmeco-g-prov', d.supplier_name);
        set('cmeco-g-nif', d.supplier_nif);
        set('cmeco-g-fecha', d.expense_date);
        if (d.base_cents != null)  set('cmeco-g-base', cmEcoCentsToEur(d.base_cents));
        if (d.vat_rate != null)    set('cmeco-g-iva', d.vat_rate);
        if (d.total_cents != null) set('cmeco-g-total', cmEcoCentsToEur(d.total_cents));
        if (d.category_hint) {
            var hint = String(d.category_hint).toLowerCase();
            var match = cmEcoCatGasto.find(function(c) { return hint.indexOf(c.name.toLowerCase()) !== -1 || c.name.toLowerCase().indexOf(hint) !== -1; });
            if (match) { var sel = document.getElementById('cmeco-g-cat'); if (sel) sel.value = match.id; }
        }
        if (status) status.innerHTML = '<span style="color:#22c55e">Datos rellenados &#10003; (' + cmEcoEsc(f.name) + ') &mdash; revisalos antes de guardar</span>';
    } catch (e) {
        console.error('cmEcoOcrArchivo:', e);
        if (status) status.innerHTML = '<span style="color:#f59e0b">No se pudieron leer los datos. Rellenalos a mano (el archivo se guardara igual).</span>';
    }
}
async function cmEcoGuardarGasto() {
    var totalCents = cmEcoEurToCents(document.getElementById('cmeco-g-total').value);
    if (totalCents === null || totalCents <= 0) { showToast('Indica un total valido', 'error'); return; }
    var baseCents = cmEcoEurToCents(document.getElementById('cmeco-g-base').value);
    if (baseCents === null) baseCents = 0;
    var ivaRate = parseFloat(String(document.getElementById('cmeco-g-iva').value).replace(',', '.'));
    if (isNaN(ivaRate)) ivaRate = 0;
    var vatCents = totalCents - baseCents;
    if (vatCents < 0) vatCents = 0;
    var prov  = document.getElementById('cmeco-g-prov').value.trim() || null;
    var nif   = document.getElementById('cmeco-g-nif').value.trim() || null;
    var fecha = document.getElementById('cmeco-g-fecha').value || null;
    var catId = document.getElementById('cmeco-g-cat').value || null;
    var cenId = document.getElementById('cmeco-g-centro').value || null;
    var pagadoPor = document.getElementById('cmeco-g-pagadopor').value || null;
    var desc  = document.getElementById('cmeco-g-desc').value.trim() || null;
    var btn = document.getElementById('cmeco-g-guardar');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
    try {
        var receiptPath = null;
        if (cmEcoArchivo) {
            var up = await cmEcoInvoke('eco-upload-receipt', { action: 'upload', file_base64: cmEcoArchivo.base64, media_type: cmEcoArchivo.mediaType, club_id: clubId });
            receiptPath = up && up.path ? up.path : null;
        }
        var miembro = cmEcoMiembroId();
        var ahora = new Date().toISOString();
        var sheet = {
            club_id: clubId, fiscal_year_id: cmEcoEjercicio.id, title: prov || desc || 'Gasto',
            cost_center_id: cenId, paid_by_member: pagadoPor, status: 'enviada', total_cents: totalCents,
            submitted_by: miembro, created_at: ahora, updated_at: ahora
        };
        var rs = await supabaseClient.from('cm_eco_expense_sheets').insert(sheet).select().single();
        if (rs.error) throw rs.error;
        var item = {
            club_id: clubId, sheet_id: rs.data.id, category_id: catId, cost_center_id: cenId,
            expense_date: fecha, supplier_name: prov, supplier_nif: nif, description: desc,
            base_cents: baseCents, vat_rate: ivaRate, vat_cents: vatCents, total_cents: totalCents,
            receipt_url: receiptPath, created_by: miembro, created_at: ahora
        };
        var ri = await supabaseClient.from('cm_eco_expense_items').insert(item);
        if (ri.error) throw ri.error;
        showToast('Gasto registrado');
        cmEcoCerrarModalGasto();
        cmEcoCargarGastos();
    } catch (e) {
        console.error('cmEcoGuardarGasto:', e);
        showToast('Error al guardar: ' + (e.message || e), 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar gasto'; }
    }
}


// ============================================================
// PESTANAS EN CONSTRUCCION
// ============================================================
// ============================================================
// REEMBOLSOS  (A.4.2)
// Por cada miembro que adelanto dinero: su IBAN y lo pendiente de
// reembolsar (gastos aprobados). Boton para reembolsar en bloque.
// ============================================================
function cmEcoTabReembolsos(cont) {
    if (!cmEcoEjercicio) {
        cont.innerHTML = '<div class="cmeco-empty"><div class="icon">&#128197;</div><h3>Sin ejercicio activo</h3></div>';
        return;
    }
    cont.innerHTML = '<div id="cmeco-reemb"><div class="cmeco-empty"><div class="icon">&#8987;</div><p>Cargando...</p></div></div>';
    cmEcoCargarReembolsos();
}

async function cmEcoCargarReembolsos() {
    var cont = document.getElementById('cmeco-reemb');
    if (!cont) return;
    try {
        await cmEcoCargarMiembros();
        var rs = await supabaseClient.from('cm_eco_expense_sheets')
            .select('id,total_cents,status,paid_by_member')
            .eq('club_id', clubId).eq('fiscal_year_id', cmEcoEjercicio.id)
            .not('paid_by_member', 'is', null).range(0, 9999);
        if (rs.error) throw rs.error;
        cmEcoReembData = rs.data || [];
        cmEcoRenderReembolsos();
    } catch (e) {
        console.error('cmEcoCargarReembolsos:', e);
        cont.innerHTML = '<div class="cmeco-empty"><div class="icon">&#9888;</div><p>Error al cargar los reembolsos</p></div>';
    }
}

function cmEcoRenderReembolsos() {
    var cont = document.getElementById('cmeco-reemb');
    if (!cont) return;
    var editable = cmEcoPuedeEditar();

    // Agrupar por miembro
    var byMember = {};
    cmEcoReembData.forEach(function(s) {
        var m = s.paid_by_member;
        if (!byMember[m]) byMember[m] = { pendiente: 0, reembolsado: 0 };
        if (s.status === 'aprobada')   byMember[m].pendiente += (s.total_cents || 0);
        else if (s.status === 'pagada') byMember[m].reembolsado += (s.total_cents || 0);
    });
    var mids = Object.keys(byMember);

    if (mids.length === 0) {
        cont.innerHTML = '<div class="cmeco-empty"><div class="icon">&#129309;</div><h3>Nada que reembolsar</h3>' +
            '<p>Cuando registres un gasto indicando que lo adelanto un miembro,<br>aparecera aqui para reembolsarle.</p></div>';
        return;
    }

    var memById = {}; cmEcoMiembros.forEach(function(m) { memById[m.id] = m.display_name; });

    var filas = '';
    mids.forEach(function(mid) {
        var d = byMember[mid];
        var nombre = cmEcoEsc(memById[mid] || 'Miembro');
        var banco = cmEcoBancos[mid] || {};
        var iban = banco.iban || '';
        var ibanInput = '<input type="text" id="cmeco-iban-' + mid + '" value="' + cmEcoEsc(iban) + '" placeholder="ES.." style="min-width:220px">';
        var btnIban = editable ? '<button class="cmeco-btn cmeco-btn-secondary cmeco-btn-sm" onclick="cmEcoGuardarIban(\'' + mid + '\')">Guardar</button>' : '';
        var btnReemb = (editable && d.pendiente > 0)
            ? '<button class="cmeco-btn cmeco-btn-ok cmeco-btn-sm" onclick="cmEcoReembolsar(\'' + mid + '\')">Reembolsar ' + cmEcoCentsToEur(d.pendiente) + '</button>'
            : '<span style="color:#64748b">-</span>';
        filas += '<tr>' +
            '<td>' + nombre + '</td>' +
            '<td style="white-space:nowrap">' + (editable ? (ibanInput + ' ' + btnIban) : (cmEcoEsc(iban) || '<span style="color:#64748b">-</span>')) + '</td>' +
            '<td class="num" style="color:#f59e0b;font-weight:600">' + cmEcoCentsToEur(d.pendiente) + '</td>' +
            '<td class="num" style="color:#5eead4">' + cmEcoCentsToEur(d.reembolsado) + '</td>' +
            '<td>' + btnReemb + '</td>' +
        '</tr>';
    });

    var totalPend = mids.reduce(function(s, m) { return s + byMember[m].pendiente; }, 0);
    cont.innerHTML =
        '<div style="color:#94a3b8;font-size:13px;margin-bottom:12px">Personas que han adelantado dinero. El reembolso marca como pagados sus gastos aprobados.</div>' +
        '<div style="color:#64748b;font-size:12px;margin-bottom:8px">Total pendiente de reembolsar: <b style="color:#f59e0b">' + cmEcoCentsToEur(totalPend) + ' EUR</b></div>' +
        '<div class="cmeco-table-wrap"><table class="cmeco-table"><thead><tr>' +
            '<th>Miembro</th><th>IBAN</th><th class="num">Pendiente</th><th class="num">Ya reembolsado</th><th>Accion</th>' +
        '</tr></thead><tbody>' + filas + '</tbody></table></div>';
}

// Guarda / actualiza el IBAN de un miembro.
async function cmEcoGuardarIban(mid) {
    var el = document.getElementById('cmeco-iban-' + mid);
    if (!el) return;
    var iban = el.value.trim().replace(/\s/g, '').toUpperCase() || null;
    var memById = {}; cmEcoMiembros.forEach(function(m) { memById[m.id] = m.display_name; });
    var res = await supabaseClient.from('cm_eco_member_bank')
        .upsert({ club_id: clubId, member_id: mid, iban: iban, holder_name: memById[mid] || null, updated_at: new Date().toISOString() },
                { onConflict: 'member_id' });
    if (res.error) { showToast('Error al guardar el IBAN: ' + res.error.message, 'error'); return; }
    cmEcoBancos[mid] = { iban: iban, holder_name: memById[mid] || null };
    showToast('IBAN guardado');
}

// Reembolsa a un miembro: marca pagados todos sus gastos aprobados.
async function cmEcoReembolsar(mid) {
    var ids = cmEcoReembData.filter(function(s) { return s.paid_by_member === mid && s.status === 'aprobada'; }).map(function(s) { return s.id; });
    if (ids.length === 0) { showToast('No hay nada aprobado pendiente para este miembro', 'error'); return; }
    var hoy = new Date();
    var hoyStr = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    var res = await supabaseClient.from('cm_eco_expense_sheets')
        .update({ status: 'pagada', paid_at: hoyStr, payment_method: 'transferencia', updated_at: new Date().toISOString() })
        .in('id', ids);
    if (res.error) { showToast('Error al reembolsar: ' + res.error.message, 'error'); return; }
    showToast(ids.length === 1 ? 'Reembolso registrado' : ids.length + ' gastos reembolsados');
    cmEcoCargarReembolsos();
}


function cmEcoTabIngresos(cont) {
    cont.innerHTML = '<div class="cmeco-empty"><div class="icon">&#128181;</div><h3>Ingresos</h3>' +
        '<p>Subvenciones, patrocinios, donaciones, eventos y tienda.<br>Las cuotas llegan agregadas desde Pagos.</p>' +
        '<div class="cmeco-soon">Planificado</div></div>';
}
function cmEcoTabPresupuesto(cont) {
    cont.innerHTML = '<div class="cmeco-empty"><div class="icon">&#128202;</div><h3>Presupuesto y tesoreria</h3>' +
        '<p>Presupuesto anual por area, posicion de caja y prevision de flujo de caja.</p>' +
        '<div class="cmeco-soon">Planificado</div></div>';
}
function cmEcoTabCumplimiento(cont) {
    cont.innerHTML = '<div class="cmeco-empty"><div class="icon">&#128737;</div><h3>Control Economico RFEF</h3>' +
        '<p>Panel de cumplimiento por categoria y temporada, certificados, plan de ajuste, formacion y transparencia.</p>' +
        '<div class="cmeco-soon">Planificado</div></div>';
}
function cmEcoTabConfig(cont) {
    cont.innerHTML = '<div class="cmeco-empty"><div class="icon">&#9881;</div><h3>Configuracion</h3>' +
        '<p>Forma juridica, categoria RFEF, nivel de control, ejercicios y plan de cuentas.</p>' +
        '<div class="cmeco-soon">Planificado</div></div>';
}


// ========== AUTO-MONTAJE ==========
(function cmEcoAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 40) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (typeof cmPuedeVer !== 'function' || !cmPuedeVer('economico')) return;
        if (document.getElementById('cm-tab-economico')) { clearInterval(intervalo); return; }
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;
        clearInterval(intervalo);
        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-economico';
        tab.setAttribute('onclick', "cambiarModulo('economico', this)");
        tab.innerHTML = '<span class="tab-icon">&#129518;</span><span>Economico</span>';
        mainTabs.appendChild(tab);
        if (!document.getElementById('modulo-economico')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-economico';
            var ultModulo = document.querySelector('.vista-modulo:last-of-type');
            if (ultModulo && ultModulo.parentElement) { ultModulo.parentElement.insertBefore(vista, ultModulo.nextSibling); }
            else { document.body.appendChild(vista); }
        }
        if (typeof registrarModulo === 'function') { registrarModulo('economico', function() { cmEcoInit('modulo-economico'); }); }
        var pd = document.getElementById('cm-pantalla-desarrollo');
        if (pd) {
            pd.style.display = 'none';
            var mt = document.querySelector('.main-tabs');
            if (mt) mt.style.display = '';
            document.querySelectorAll('.vista-modulo').forEach(function(v) { v.style.display = ''; });
        }
        var tv = Array.from(document.querySelectorAll('.main-tab')).filter(function(t) { return t.style.display !== 'none'; });
        if (tv.length === 1 && tv[0].id === 'cm-tab-economico') { cambiarModulo('economico', tab); }
        console.log('[Modulo Economico] Auto-montado y registrado');
    }, 300);
})();
