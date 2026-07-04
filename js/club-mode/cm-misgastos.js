// ============================================================
// CM-MISGASTOS.JS - "Mis gastos" (buzon descentralizado)
// TopLiderCoach HUB - Club Mode
// ============================================================
// Permite que CUALQUIER miembro del club (medico, fisio, scout,
// utillero, entrenador...) suba los gastos que ha adelantado.
// El gasto cae en el buzon del financiero (modulo Economico),
// que lo aprueba y lo reembolsa con el circuito ya existente.
//
// El miembro solo ve SUS gastos y su estado (revision/aprobado/
// reembolsado). No ve los de los demas ni el modulo Economico.
//
// Reutiliza las mismas tablas y funciones que el Economico:
//   - cm_eco_expense_sheets / cm_eco_expense_items
//   - cm_eco_categories (gasto) / cm_eco_cost_centers
//   - cm_eco_fiscal_years (ejercicio actual)
//   - Edge Functions eco-ocr-receipt / eco-upload-receipt
// Prefijo: cmMG
// ============================================================

var cmMGEjercicio = null;
var cmMGCat       = [];
var cmMGCentros   = [];
var cmMGGastos    = [];
var cmMGArchivo   = null;

var CMMG_ESTADO = {
    borrador:  ['Borrador',   'background:#334155;color:#94a3b8'],
    enviada:   ['En revision','background:#1e3a5f;color:#60a5fa'],
    aprobada:  ['Aprobado',   'background:#1e4f2e;color:#86efac'],
    rechazada: ['Rechazado',  'background:#4f1e1e;color:#fca5a5'],
    pagada:    ['Reembolsado','background:#1e4f4f;color:#5eead4']
};

// ========== HELPERS ==========
function cmMGEurToCents(str) {
    if (str === null || str === undefined) return null;
    var s = String(str).trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    if (s === '') return null;
    var n = parseFloat(s);
    if (isNaN(n) || n < 0) return null;
    return Math.round(n * 100);
}
function cmMGCentsToEur(cents) {
    var n = (cents || 0) / 100;
    return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function cmMGEsc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function cmMGFechaCorta(d) {
    if (!d) return '';
    var p = String(d).split('-');
    if (p.length < 3) return d;
    return p[2].substring(0, 2) + '/' + p[1] + '/' + p[0].substring(2);
}
function cmMGMiembroId() {
    return (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.id : null;
}
function cmMGFileToBase64(file) {
    return new Promise(function(resolve, reject) {
        var r = new FileReader();
        r.onload = function() { resolve(String(r.result).split(',')[1]); };
        r.onerror = reject;
        r.readAsDataURL(file);
    });
}
async function cmMGInvoke(fn, body) {
    var r = await supabaseClient.functions.invoke(fn, { body: body });
    if (r.error) throw r.error;
    return r.data;
}


// ========== INIT ==========
async function cmMGInit(containerId) {
    var container = document.getElementById(containerId);
    if (!container) { console.error('cmMGInit: contenedor no encontrado:', containerId); return; }
    cmMGRenderPanel(container);
    await cmMGCargarContexto();
    cmMGCargarGastos();
}

async function cmMGCargarContexto() {
    try {
        var re = await supabaseClient.from('cm_eco_fiscal_years').select('*').eq('club_id', clubId).eq('is_current', true).maybeSingle();
        cmMGEjercicio = re.data || null;
        if (cmMGCat.length === 0) {
            var rc = await supabaseClient.from('cm_eco_categories').select('id,name').eq('club_id', clubId).eq('kind', 'gasto').eq('is_active', true).order('name');
            cmMGCat = rc.data || [];
        }
        if (cmMGCentros.length === 0) {
            var rcc = await supabaseClient.from('cm_eco_cost_centers').select('id,name').eq('club_id', clubId).eq('is_active', true).order('name');
            cmMGCentros = rcc.data || [];
        }
    } catch (e) { console.error('cmMGCargarContexto:', e); }
}


// ========== RENDER PANEL ==========
function cmMGRenderPanel(container) {
    container.innerHTML =
    '<style>' +
        '.cmmg-wrap{background:#0f172a;min-height:calc(100vh - 120px);padding:24px 20px;box-sizing:border-box}' +
        '.cmmg-panel{max-width:1000px;margin:0 auto}' +
        '.cmmg-header h2{margin:0;color:#f1f5f9;font-size:20px;font-weight:700}' +
        '.cmmg-header .cmmg-sub{color:#94a3b8;font-size:12px;margin-top:2px}' +
        '.cmmg-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:18px 0 16px;flex-wrap:wrap}' +
        '.cmmg-btn{padding:8px 16px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s}' +
        '.cmmg-btn-primary{background:#3b82f6;color:#fff}.cmmg-btn-primary:hover{background:#2563eb}' +
        '.cmmg-btn-secondary{background:#334155;color:#e2e8f0}.cmmg-btn-secondary:hover{background:#475569}' +
        '.cmmg-btn-sm{padding:5px 10px;font-size:12px}' +
        '.cmmg-empty{text-align:center;padding:60px 20px;color:#64748b}' +
        '.cmmg-empty .icon{font-size:48px;margin-bottom:14px}' +
        '.cmmg-empty h3{color:#e2e8f0;font-size:16px;margin:0 0 6px}.cmmg-empty p{font-size:13px;margin:0;line-height:1.6}' +
        '.cmmg-table-wrap{overflow-x:auto;border:1px solid #1e293b;border-radius:10px}' +
        '.cmmg-table{width:100%;border-collapse:collapse;font-size:13px}' +
        '.cmmg-table thead th{background:#1e293b;color:#94a3b8;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left;white-space:nowrap}' +
        '.cmmg-table th.num,.cmmg-table td.num{text-align:right}' +
        '.cmmg-table tbody td{padding:10px 12px;color:#e2e8f0;border-top:1px solid #1e293b}' +
        '.cmmg-table tbody tr:hover{background:#1e293b}' +
        '.cmmg-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap}' +
        '.cmmg-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9500;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}' +
        '.cmmg-modal{background:#0f172a;border:1px solid #334155;border-radius:14px;width:100%;max-width:560px}' +
        '.cmmg-modal-header{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #1e293b}' +
        '.cmmg-modal-header h3{margin:0;color:#f1f5f9;font-size:17px}' +
        '.cmmg-modal-close{background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1}.cmmg-modal-close:hover{color:#ef4444}' +
        '.cmmg-modal-body{padding:20px 22px}.cmmg-modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid #1e293b}' +
        '.cmmg-fg{margin-bottom:14px}.cmmg-fg label{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}' +
        '.cmmg-fg input,.cmmg-fg select,.cmmg-fg textarea{width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit;box-sizing:border-box}' +
        '.cmmg-fg textarea{min-height:50px;resize:vertical}' +
        '.cmmg-fg input:focus,.cmmg-fg select:focus,.cmmg-fg textarea:focus{border-color:#3b82f6;outline:none}' +
        '.cmmg-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cmmg-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}' +
        '.cmmg-drop{border:1px dashed #475569;border-radius:10px;padding:16px;text-align:center;color:#94a3b8;font-size:13px;background:#0b1322;margin-bottom:14px}' +
        '.cmmg-drop input{display:none}.cmmg-drop label{display:inline-block;margin-top:8px;cursor:pointer;background:#3b82f6;color:#fff;padding:7px 14px;border-radius:6px;font-weight:600}' +
        '.cmmg-ocr-status{font-size:12px;margin-top:8px}' +
        '@media(max-width:640px){.cmmg-wrap{padding:16px 12px}.cmmg-row,.cmmg-row3{grid-template-columns:1fr}}' +
    '</style>' +
    '<div class="cmmg-wrap"><div class="cmmg-panel">' +
        '<div class="cmmg-header"><h2>Mis gastos</h2>' +
            '<div class="cmmg-sub">Sube los gastos que has adelantado. El club los revisara y te los reembolsara.</div></div>' +
        '<div class="cmmg-toolbar">' +
            '<div id="cmmg-info" style="color:#94a3b8;font-size:13px"></div>' +
            '<button class="cmmg-btn cmmg-btn-primary" onclick="cmMGAbrirModal()">+ Enviar un gasto</button>' +
        '</div>' +
        '<div id="cmmg-tabla"><div class="cmmg-empty"><div class="icon">&#8987;</div><p>Cargando...</p></div></div>' +
    '</div></div>';
}


// ========== CARGAR MIS GASTOS ==========
async function cmMGCargarGastos() {
    var cont = document.getElementById('cmmg-tabla');
    if (!cont) return;
    var mid = cmMGMiembroId();
    if (!mid) { cont.innerHTML = '<div class="cmmg-empty"><div class="icon">&#9888;</div><p>No se ha identificado tu cuenta de miembro.</p></div>'; return; }
    try {
        // Hojas enviadas por mi
        var rs = await supabaseClient.from('cm_eco_expense_sheets')
            .select('id,status,total_cents,paid_at').eq('club_id', clubId).eq('submitted_by', mid)
            .order('created_at', { ascending: false }).range(0, 9999);
        if (rs.error) throw rs.error;
        var sheets = rs.data || [];
        if (sheets.length === 0) { cmMGGastos = []; cmMGRender([]); return; }
        var sheetIds = sheets.map(function(s) { return s.id; });
        // Lineas de esas hojas (datos del gasto)
        var ri = await supabaseClient.from('cm_eco_expense_items')
            .select('sheet_id,expense_date,supplier_name,category_id,total_cents,receipt_url')
            .in('sheet_id', sheetIds).range(0, 9999);
        var itemBySheet = {};
        (ri.data || []).forEach(function(it) { if (!itemBySheet[it.sheet_id]) itemBySheet[it.sheet_id] = it; });
        cmMGGastos = sheets.map(function(s) {
            var it = itemBySheet[s.id] || {};
            return { sheet: s, item: it };
        });
        cmMGRender(cmMGGastos);
    } catch (e) {
        console.error('cmMGCargarGastos:', e);
        cont.innerHTML = '<div class="cmmg-empty"><div class="icon">&#9888;</div><p>Error al cargar tus gastos</p></div>';
    }
}

function cmMGRender(lista) {
    var cont = document.getElementById('cmmg-tabla');
    if (!cont) return;
    var info = document.getElementById('cmmg-info');

    if (lista.length === 0) {
        if (info) info.textContent = '';
        cont.innerHTML = '<div class="cmmg-empty"><div class="icon">&#129534;</div><h3>Aun no has enviado gastos</h3>' +
            '<p>Pulsa "+ Enviar un gasto", sube la foto del ticket o la factura<br>y el club te lo reembolsara cuando lo apruebe.</p></div>';
        return;
    }

    var catById = {}; cmMGCat.forEach(function(c) { catById[c.id] = c.name; });
    var pendiente = 0, reembolsado = 0;
    var filas = '';
    lista.forEach(function(g) {
        var s = g.sheet, it = g.item;
        var est = CMMG_ESTADO[s.status] || CMMG_ESTADO.enviada;
        if (s.status === 'pagada') reembolsado += (s.total_cents || 0);
        else if (s.status !== 'rechazada') pendiente += (s.total_cents || 0);
        var ver = it.receipt_url
            ? '<button class="cmmg-btn cmmg-btn-secondary cmmg-btn-sm" onclick="cmMGVer(\'' + cmMGEsc(it.receipt_url) + '\')">Ver</button>'
            : '<span style="color:#64748b">-</span>';
        filas += '<tr>' +
            '<td>' + (it.expense_date ? cmMGFechaCorta(it.expense_date) : '-') + '</td>' +
            '<td>' + cmMGEsc(it.supplier_name || 'Gasto') + '</td>' +
            '<td>' + cmMGEsc(catById[it.category_id] || '-') + '</td>' +
            '<td class="num">' + cmMGCentsToEur(s.total_cents) + '</td>' +
            '<td><span class="cmmg-badge" style="' + est[1] + '">' + est[0] + '</span></td>' +
            '<td>' + ver + '</td>' +
        '</tr>';
    });
    if (info) info.innerHTML = 'Pendiente de cobro: <b style="color:#f59e0b">' + cmMGCentsToEur(pendiente) + ' EUR</b> &middot; Reembolsado: <b style="color:#5eead4">' + cmMGCentsToEur(reembolsado) + ' EUR</b>';
    cont.innerHTML =
        '<div class="cmmg-table-wrap"><table class="cmmg-table"><thead><tr>' +
            '<th>Fecha</th><th>Proveedor</th><th>Categoria</th><th class="num">Total</th><th>Estado</th><th>Justif.</th>' +
        '</tr></thead><tbody>' + filas + '</tbody></table></div>';
}

async function cmMGVer(path) {
    try {
        var d = await cmMGInvoke('eco-upload-receipt', { action: 'sign', path: path });
        if (d && d.signed_url) window.open(d.signed_url, '_blank');
        else showToast('No se pudo abrir el justificante', 'error');
    } catch (e) { console.error('cmMGVer:', e); showToast('No se pudo abrir el justificante', 'error'); }
}


// ========== MODAL ENVIAR GASTO ==========
function cmMGAbrirModal() {
    if (!cmMGEjercicio) { showToast('El club aun no tiene un ejercicio contable abierto', 'error'); return; }
    cmMGArchivo = null;
    var catOpts = '<option value="">(sin categoria)</option>' + cmMGCat.map(function(c) { return '<option value="' + c.id + '">' + cmMGEsc(c.name) + '</option>'; }).join('');
    var cenOpts = '<option value="">(sin area)</option>' + cmMGCentros.map(function(c) { return '<option value="' + c.id + '">' + cmMGEsc(c.name) + '</option>'; }).join('');
    var overlay = document.createElement('div');
    overlay.className = 'cmmg-modal-overlay';
    overlay.id = 'cmmg-modal';
    overlay.onclick = function(e) { if (e.target === overlay) cmMGCerrar(); };
    overlay.innerHTML =
        '<div class="cmmg-modal">' +
            '<div class="cmmg-modal-header"><h3>Enviar un gasto</h3><button class="cmmg-modal-close" onclick="cmMGCerrar()">&times;</button></div>' +
            '<div class="cmmg-modal-body">' +
                '<div class="cmmg-drop">Sube la foto del ticket o la factura (PDF) y la IA rellenara los datos.' +
                    '<input type="file" id="cmmg-file" accept="image/*,application/pdf" onchange="cmMGOcr(this)">' +
                    '<label for="cmmg-file">Elegir archivo</label>' +
                    '<div class="cmmg-ocr-status" id="cmmg-ocr-status"></div></div>' +
                '<div class="cmmg-row">' +
                    '<div class="cmmg-fg"><label>Proveedor</label><input type="text" id="cmmg-prov"></div>' +
                    '<div class="cmmg-fg"><label>NIF / CIF</label><input type="text" id="cmmg-nif"></div></div>' +
                '<div class="cmmg-row3">' +
                    '<div class="cmmg-fg"><label>Fecha</label><input type="date" id="cmmg-fecha"></div>' +
                    '<div class="cmmg-fg"><label>Base (EUR)</label><input type="text" inputmode="decimal" id="cmmg-base" placeholder="0,00"></div>' +
                    '<div class="cmmg-fg"><label>IVA %</label><input type="text" inputmode="decimal" id="cmmg-iva" placeholder="21"></div></div>' +
                '<div class="cmmg-row">' +
                    '<div class="cmmg-fg"><label>Total (EUR) *</label><input type="text" inputmode="decimal" id="cmmg-total" placeholder="0,00"></div>' +
                    '<div class="cmmg-fg"><label>Categoria</label><select id="cmmg-cat">' + catOpts + '</select></div></div>' +
                '<div class="cmmg-fg"><label>Area / departamento</label><select id="cmmg-centro">' + cenOpts + '</select></div>' +
                '<div class="cmmg-fg"><label>Descripcion (opcional)</label><textarea id="cmmg-desc" placeholder="Para que era este gasto..."></textarea></div>' +
            '</div>' +
            '<div class="cmmg-modal-footer">' +
                '<button class="cmmg-btn cmmg-btn-secondary" onclick="cmMGCerrar()">Cancelar</button>' +
                '<button class="cmmg-btn cmmg-btn-primary" id="cmmg-guardar" onclick="cmMGGuardar()">Enviar gasto</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);
}
function cmMGCerrar() {
    var o = document.getElementById('cmmg-modal');
    if (o) o.remove();
    cmMGArchivo = null;
}
async function cmMGOcr(input) {
    var f = input.files[0];
    if (!f) return;
    var status = document.getElementById('cmmg-ocr-status');
    try {
        var b64 = await cmMGFileToBase64(f);
        cmMGArchivo = { base64: b64, mediaType: f.type || 'image/jpeg', name: f.name };
        if (status) status.innerHTML = '<span style="color:#60a5fa">Leyendo con IA...</span>';
        var d = await cmMGInvoke('eco-ocr-receipt', { image_base64: b64, media_type: cmMGArchivo.mediaType });
        var set = function(id, val) { var el = document.getElementById(id); if (el && val != null && val !== '') el.value = val; };
        set('cmmg-prov', d.supplier_name);
        set('cmmg-nif', d.supplier_nif);
        set('cmmg-fecha', d.expense_date);
        if (d.base_cents != null)  set('cmmg-base', cmMGCentsToEur(d.base_cents));
        if (d.vat_rate != null)    set('cmmg-iva', d.vat_rate);
        if (d.total_cents != null) set('cmmg-total', cmMGCentsToEur(d.total_cents));
        if (d.category_hint) {
            var hint = String(d.category_hint).toLowerCase();
            var match = cmMGCat.find(function(c) { return hint.indexOf(c.name.toLowerCase()) !== -1 || c.name.toLowerCase().indexOf(hint) !== -1; });
            if (match) { var sel = document.getElementById('cmmg-cat'); if (sel) sel.value = match.id; }
        }
        if (status) status.innerHTML = '<span style="color:#22c55e">Datos rellenados &#10003; (' + cmMGEsc(f.name) + ') &mdash; revisalos antes de enviar</span>';
    } catch (e) {
        console.error('cmMGOcr:', e);
        if (status) status.innerHTML = '<span style="color:#f59e0b">No se pudieron leer los datos. Rellenalos a mano (el archivo se guardara igual).</span>';
    }
}
async function cmMGGuardar() {
    var totalCents = cmMGEurToCents(document.getElementById('cmmg-total').value);
    if (totalCents === null || totalCents <= 0) { showToast('Indica un total valido', 'error'); return; }
    var baseCents = cmMGEurToCents(document.getElementById('cmmg-base').value);
    if (baseCents === null) baseCents = 0;
    var ivaRate = parseFloat(String(document.getElementById('cmmg-iva').value).replace(',', '.'));
    if (isNaN(ivaRate)) ivaRate = 0;
    var vatCents = totalCents - baseCents;
    if (vatCents < 0) vatCents = 0;
    var prov  = document.getElementById('cmmg-prov').value.trim() || null;
    var nif   = document.getElementById('cmmg-nif').value.trim() || null;
    var fecha = document.getElementById('cmmg-fecha').value || null;
    var catId = document.getElementById('cmmg-cat').value || null;
    var cenId = document.getElementById('cmmg-centro').value || null;
    var desc  = document.getElementById('cmmg-desc').value.trim() || null;
    var mid = cmMGMiembroId();
    var btn = document.getElementById('cmmg-guardar');
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
    try {
        var receiptPath = null;
        if (cmMGArchivo) {
            var up = await cmMGInvoke('eco-upload-receipt', { action: 'upload', file_base64: cmMGArchivo.base64, media_type: cmMGArchivo.mediaType, club_id: clubId });
            receiptPath = up && up.path ? up.path : null;
        }
        var ahora = new Date().toISOString();
        // El gasto entra en el buzon del financiero, marcado como adelantado por mi.
        var sheet = {
            club_id: clubId, fiscal_year_id: cmMGEjercicio.id, title: prov || desc || 'Gasto',
            cost_center_id: cenId, paid_by_member: mid, status: 'enviada', total_cents: totalCents,
            submitted_by: mid, created_at: ahora, updated_at: ahora
        };
        var rs = await supabaseClient.from('cm_eco_expense_sheets').insert(sheet).select().single();
        if (rs.error) throw rs.error;
        var item = {
            club_id: clubId, sheet_id: rs.data.id, category_id: catId, cost_center_id: cenId,
            expense_date: fecha, supplier_name: prov, supplier_nif: nif, description: desc,
            base_cents: baseCents, vat_rate: ivaRate, vat_cents: vatCents, total_cents: totalCents,
            receipt_url: receiptPath, created_by: mid, created_at: ahora
        };
        var ri = await supabaseClient.from('cm_eco_expense_items').insert(item);
        if (ri.error) throw ri.error;
        showToast('Gasto enviado. El club lo revisara.');
        cmMGCerrar();
        cmMGCargarGastos();
    } catch (e) {
        console.error('cmMGGuardar:', e);
        showToast('Error al enviar: ' + (e.message || e), 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Enviar gasto'; }
    }
}


// ========== AUTO-MONTAJE (visible para TODO miembro del club) ==========
(function cmMGAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 40) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (document.getElementById('cm-tab-misgastos')) { clearInterval(intervalo); return; }
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;

        clearInterval(intervalo);

        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-misgastos';
        tab.setAttribute('onclick', "cambiarModulo('misgastos', this)");
        tab.innerHTML = '<span class="tab-icon">&#129534;</span><span>Mis gastos</span>';
        mainTabs.appendChild(tab);

        if (!document.getElementById('modulo-misgastos')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-misgastos';
            var ult = document.querySelector('.vista-modulo:last-of-type');
            if (ult && ult.parentElement) { ult.parentElement.insertBefore(vista, ult.nextSibling); }
            else { document.body.appendChild(vista); }
        }

        if (typeof registrarModulo === 'function') {
            registrarModulo('misgastos', function() { cmMGInit('modulo-misgastos'); });
        }

        var pd = document.getElementById('cm-pantalla-desarrollo');
        if (pd) {
            pd.style.display = 'none';
            var mt = document.querySelector('.main-tabs');
            if (mt) mt.style.display = '';
            document.querySelectorAll('.vista-modulo').forEach(function(v) { v.style.display = ''; });
        }

        var tv = Array.from(document.querySelectorAll('.main-tab')).filter(function(t) { return t.style.display !== 'none'; });
        if (tv.length === 1 && tv[0].id === 'cm-tab-misgastos') { cambiarModulo('misgastos', tab); }

        console.log('[Mis gastos] Auto-montado y registrado');
    }, 300);
})();
