// ============================================================
// CM-UTILLERO.JS · Despacho Utillero · Club Mode Fase 1
// Pestanas: Inventario + Peticiones
// Tablas: cm_util_items, cm_util_movements, cm_util_requests
//         (lectura/gestion de cm_fisio_material_requests)
// ============================================================
var cmUtilVistaActiva = 'inventario';
var cmUtilItems = [];
var cmUtilFiltroCat = 'all';
var cmUtilSoloStockBajo = false;
var cmUtilPeticiones = [];
var cmUtilFiltroPet = 'all';
var cmUtilItemEditId = null;

var CMUTIL_CATS = {
    balones: 'Balones',
    textil_entreno: 'Textil de entrenamiento',
    equipacion_oficial: 'Equipacion oficial',
    porterias_campo: 'Porterias y campo',
    botiquin_campo: 'Botiquin de campo',
    hidratacion: 'Hidratacion',
    tecnologia: 'Tecnologia',
    consumibles: 'Consumibles',
    otros: 'Otros'
};
var CMUTIL_STATUS_LABELS = { pending: 'Pendiente', in_process: 'En proceso', ordered: 'Pedido', delivered: 'Entregado', rejected: 'Rechazado' };
var CMUTIL_STATUS_COLORS = { pending: '#f59e0b', in_process: '#3b82f6', ordered: '#a855f7', delivered: '#22c55e', rejected: '#ef4444' };

// ========== INIT ==========
async function cmUtilInit(cid) {
    var c = document.getElementById(cid);
    if (!c) return;
    cmUtilRenderPanel(c);
    await cmUtilCargarItems();
}

// ========== PANEL ==========
function cmUtilRenderPanel(container) {
    container.innerHTML =
    '<style>' +
    '.cmutil-wrap{background:#0f172a;min-height:100vh;padding:0 0 40px 0;margin:-20px -20px 0 -20px}.cmutil-panel{padding:20px;max-width:1200px;margin:0 auto}' +
    '.cmutil-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px}.cmutil-header h2{margin:0;color:#e2e8f0;font-size:20px}' +
    '.cmutil-vista-toggle{display:flex;gap:0;margin-bottom:20px;background:#1e293b;border-radius:8px;overflow:hidden;border:1px solid #334155}.cmutil-vista-btn{flex:1;padding:10px 20px;background:none;border:none;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}.cmutil-vista-btn:hover{color:#e2e8f0}.cmutil-vista-btn.active{background:#f59e0b;color:#0f172a}' +
    '.cmutil-stats-bar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}.cmutil-stat{background:#1e293b;border-radius:10px;padding:14px 18px;flex:1;min-width:110px;text-align:center;border:2px solid #334155;cursor:default}.cmutil-stat .num{font-size:28px;font-weight:700;color:#f59e0b}.cmutil-stat .label{font-size:12px;color:#94a3b8;margin-top:2px}' +
    '.cmutil-stat.clickable{cursor:pointer;transition:all .2s}.cmutil-stat.clickable:hover{border-color:#f59e0b}.cmutil-stat.activefilter{border-color:#ef4444}' +
    '.cmutil-filtro-bar{display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap}.cmutil-filtro-bar label{color:#94a3b8;font-size:12px;font-weight:600}.cmutil-filtro-bar select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px;cursor:pointer}' +
    '.cmutil-table{width:100%;border-collapse:collapse;font-size:13px}.cmutil-table th{text-align:left;padding:8px 10px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #334155}.cmutil-table td{padding:8px 10px;color:#e2e8f0;border-bottom:1px solid #1e293b}.cmutil-table tr:hover td{background:#1e293b}' +
    '.cmutil-btn{padding:8px 18px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s}.cmutil-btn-primary{background:#f59e0b;color:#0f172a}.cmutil-btn-primary:hover{background:#d97706}.cmutil-btn-secondary{background:#334155;color:#e2e8f0}.cmutil-btn-secondary:hover{background:#475569}.cmutil-btn-danger{background:#dc2626;color:#fff}.cmutil-btn-sm{padding:5px 12px;font-size:12px}' +
    '.cmutil-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700}.cmutil-badge-rojo{background:#450a0a;color:#ef4444}.cmutil-badge-ok{background:#052e16;color:#22c55e}.cmutil-badge-cat{background:#1e3a5f;color:#60a5fa}.cmutil-badge-urgente{background:#ef4444;color:#fff}.cmutil-badge-src{background:#334155;color:#94a3b8}' +
    '.cmutil-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:9000;display:flex;justify-content:center;align-items:flex-start;padding:30px;overflow-y:auto}' +
    '.cmutil-modal{background:#0f172a;border-radius:14px;width:100%;max-width:560px;border:1px solid #334155;padding:22px}' +
    '.cmutil-modal h3{margin:0 0 16px;color:#e2e8f0;font-size:17px;display:flex;justify-content:space-between;align-items:center}.cmutil-modal-close{background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer}.cmutil-modal-close:hover{color:#ef4444}' +
    '.cmutil-form-group{margin-bottom:14px}.cmutil-form-group label{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}' +
    '.cmutil-form-group input,.cmutil-form-group select,.cmutil-form-group textarea{width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit;box-sizing:border-box}.cmutil-form-group input:focus,.cmutil-form-group select:focus{border-color:#f59e0b;outline:none}' +
    '.cmutil-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cmutil-form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}' +
    '.cmutil-pet-card{background:#1e293b;border-radius:10px;padding:14px;margin-bottom:10px;border-left:4px solid #f59e0b}.cmutil-pet-card.urgente{border-left-color:#ef4444}' +
    '.cmutil-pet-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px}.cmutil-pet-title{color:#e2e8f0;font-weight:600;font-size:14px}.cmutil-pet-meta{color:#94a3b8;font-size:11px;margin-bottom:8px}' +
    '.cmutil-pet-items{color:#cbd5e1;font-size:13px;margin-bottom:10px}.cmutil-pet-actions{display:flex;gap:6px;flex-wrap:wrap}' +
    '.cmutil-empty{text-align:center;padding:40px 20px;color:#64748b}.cmutil-empty .icon{font-size:40px;margin-bottom:10px}.cmutil-empty p{font-size:14px}' +
    '.cmutil-seg{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}.cmutil-seg-btn{padding:4px 12px;border-radius:4px;border:1px solid #334155;background:#0f172a;color:#94a3b8;font-size:11px;cursor:pointer}.cmutil-seg-btn:hover{border-color:#f59e0b}.cmutil-seg-btn.active{background:#f59e0b;color:#0f172a;border-color:#f59e0b}' +
    '@media(max-width:640px){.cmutil-form-row,.cmutil-form-row-3{grid-template-columns:1fr}.cmutil-overlay{padding:10px}.cmutil-stats-bar{gap:8px}.cmutil-stat{min-width:70px;padding:10px 8px}.cmutil-stat .num{font-size:22px}.cmutil-table{font-size:12px}}' +
    '</style>' +
    '<div class="cmutil-wrap"><div class="cmutil-panel">' +
    '<div class="cmutil-header"><h2>Utillero</h2></div>' +
    '<div class="cmutil-vista-toggle">' +
    '<button class="cmutil-vista-btn active" data-vista="inventario" onclick="cmUtilCambiarVista(\'inventario\')">Inventario</button>' +
    '<button class="cmutil-vista-btn" data-vista="peticiones" onclick="cmUtilCambiarVista(\'peticiones\')">Peticiones</button>' +
    '</div>' +
    '<div id="cmutil-vista-inventario">' +
    '<div class="cmutil-stats-bar">' +
    '<div class="cmutil-stat"><div class="num" id="cmutil-stat-items">-</div><div class="label">Articulos</div></div>' +
    '<div class="cmutil-stat clickable" id="cmutil-stat-bajo-card" onclick="cmUtilToggleStockBajo()"><div class="num" id="cmutil-stat-bajo" style="color:#ef4444">-</div><div class="label">Stock bajo</div></div>' +
    '<div class="cmutil-stat"><div class="num" id="cmutil-stat-unidades" style="color:#60a5fa">-</div><div class="label">Unidades disp.</div></div>' +
    '</div>' +
    '<div class="cmutil-filtro-bar">' +
    '<label>Categoria:</label><select id="cmutil-filtro-cat" onchange="cmUtilFiltrarCat(this.value)"><option value="all">Todas</option></select>' +
    '<div style="flex:1"></div>' +
    '<button class="cmutil-btn cmutil-btn-primary" onclick="cmUtilAbrirItemForm(null)">+ Nuevo articulo</button>' +
    '</div>' +
    '<div id="cmutil-items-list"><div class="cmutil-empty"><p>Cargando...</p></div></div>' +
    '</div>' +
    '<div id="cmutil-vista-peticiones" style="display:none">' +
    '<div class="cmutil-seg">' +
    '<button class="cmutil-seg-btn active" data-pet="all" onclick="cmUtilFiltrarPet(\'all\')">Todas</button>' +
    '<button class="cmutil-seg-btn" data-pet="pendientes" onclick="cmUtilFiltrarPet(\'pendientes\')">Pendientes</button>' +
    '<button class="cmutil-seg-btn" data-pet="fisio" onclick="cmUtilFiltrarPet(\'fisio\')">Fisio</button>' +
    '<button class="cmutil-seg-btn" data-pet="manual" onclick="cmUtilFiltrarPet(\'manual\')">Manuales</button>' +
    '<button class="cmutil-seg-btn" data-pet="sesion" onclick="cmUtilFiltrarPet(\'sesion\')">Sesiones</button>' +
    '<div style="flex:1"></div>' +
    '<button class="cmutil-btn cmutil-btn-primary cmutil-btn-sm" onclick="cmUtilAbrirPeticionForm()">+ Nueva peticion</button>' +
    '</div>' +
    '<div id="cmutil-pet-list"><div class="cmutil-empty"><p>Cargando...</p></div></div>' +
    '</div>' +
    '</div></div>';

    // Rellenar selector de categorias
    var sel = document.getElementById('cmutil-filtro-cat');
    if (sel) {
        var o = '<option value="all">Todas</option>';
        Object.keys(CMUTIL_CATS).forEach(function(k) { o += '<option value="' + k + '">' + CMUTIL_CATS[k] + '</option>'; });
        sel.innerHTML = o;
    }
}

function cmUtilCambiarVista(v) {
    cmUtilVistaActiva = v;
    document.querySelectorAll('.cmutil-vista-btn').forEach(function(b) { b.classList.toggle('active', b.getAttribute('data-vista') === v); });
    document.getElementById('cmutil-vista-inventario').style.display = (v === 'inventario') ? 'block' : 'none';
    document.getElementById('cmutil-vista-peticiones').style.display = (v === 'peticiones') ? 'block' : 'none';
    if (v === 'peticiones') cmUtilCargarPeticiones();
    else cmUtilCargarItems();
}

// ============================================================
// INVENTARIO
// ============================================================
async function cmUtilCargarItems() {
    var list = document.getElementById('cmutil-items-list');
    if (!list) return;
    try {
        var r = await supabaseClient.from('cm_util_items').select('*').eq('club_id', clubId).eq('archived', false).order('category').order('name');
        cmUtilItems = r.data || [];
        cmUtilRenderItems();
    } catch (e) {
        console.error('Error cargando inventario:', e);
        list.innerHTML = '<div class="cmutil-empty"><p>Error cargando el inventario</p></div>';
    }
}

function cmUtilToggleStockBajo() {
    cmUtilSoloStockBajo = !cmUtilSoloStockBajo;
    var card = document.getElementById('cmutil-stat-bajo-card');
    if (card) card.classList.toggle('activefilter', cmUtilSoloStockBajo);
    cmUtilRenderItems();
}

function cmUtilFiltrarCat(v) { cmUtilFiltroCat = v; cmUtilRenderItems(); }

function cmUtilRenderItems() {
    var list = document.getElementById('cmutil-items-list');
    if (!list) return;
    var items = cmUtilItems;

    // Stats globales (sin filtros)
    var el = function(i, v) { var e = document.getElementById(i); if (e) e.textContent = v; };
    var bajos = cmUtilItems.filter(function(it) { return it.qty_available < it.min_stock; });
    el('cmutil-stat-items', cmUtilItems.length);
    el('cmutil-stat-bajo', bajos.length);
    el('cmutil-stat-unidades', cmUtilItems.reduce(function(a, it) { return a + (it.qty_available || 0); }, 0));

    if (cmUtilFiltroCat !== 'all') items = items.filter(function(it) { return it.category === cmUtilFiltroCat; });
    if (cmUtilSoloStockBajo) items = items.filter(function(it) { return it.qty_available < it.min_stock; });

    if (!items.length) {
        list.innerHTML = '<div class="cmutil-empty"><div class="icon">&#128230;</div><p>' + (cmUtilItems.length ? 'Sin articulos con este filtro' : 'Aun no hay articulos. Crea el primero con "+ Nuevo articulo".') + '</p></div>';
        return;
    }

    var h = '<table class="cmutil-table"><thead><tr><th>Articulo</th><th>Categoria</th><th>Disp. / Total</th><th>Min.</th><th>Stock</th><th>Ubicacion</th><th></th></tr></thead><tbody>';
    items.forEach(function(it) {
        var bajo = it.qty_available < it.min_stock;
        h += '<tr>' +
            '<td><strong>' + cmUtilEsc(it.name) + '</strong>' + (it.is_serialized ? ' <span class="cmutil-badge cmutil-badge-cat">Serializado</span>' : '') + '</td>' +
            '<td><span class="cmutil-badge cmutil-badge-cat">' + (CMUTIL_CATS[it.category] || it.category) + '</span></td>' +
            '<td>' + it.qty_available + ' / ' + it.qty_total + '</td>' +
            '<td>' + it.min_stock + '</td>' +
            '<td>' + (bajo ? '<span class="cmutil-badge cmutil-badge-rojo">BAJO</span>' : '<span class="cmutil-badge cmutil-badge-ok">OK</span>') + '</td>' +
            '<td style="color:#94a3b8">' + cmUtilEsc(it.location || '-') + '</td>' +
            '<td style="white-space:nowrap;text-align:right">' +
            '<button class="cmutil-btn cmutil-btn-secondary cmutil-btn-sm" onclick="cmUtilAbrirMovimiento(\'' + it.id + '\')">Movimiento</button> ' +
            '<button class="cmutil-btn cmutil-btn-secondary cmutil-btn-sm" onclick="cmUtilAbrirItemForm(\'' + it.id + '\')">Editar</button>' +
            '</td></tr>';
    });
    h += '</tbody></table>';
    list.innerHTML = h;
}

// ---------- Formulario articulo ----------
function cmUtilAbrirItemForm(id) {
    cmUtilItemEditId = id;
    var it = id ? cmUtilItems.find(function(x) { return x.id === id; }) : null;
    var catOpts = '';
    Object.keys(CMUTIL_CATS).forEach(function(k) {
        catOpts += '<option value="' + k + '"' + (it && it.category === k ? ' selected' : '') + '>' + CMUTIL_CATS[k] + '</option>';
    });
    var ov = document.createElement('div');
    ov.className = 'cmutil-overlay';
    ov.id = 'cmutil-item-overlay';
    ov.innerHTML =
        '<div class="cmutil-modal">' +
        '<h3>' + (it ? 'Editar articulo' : 'Nuevo articulo') + '<button class="cmutil-modal-close" onclick="cmUtilCerrarOverlay(\'cmutil-item-overlay\')">&times;</button></h3>' +
        '<div class="cmutil-form-group"><label>Nombre *</label><input id="cmutil-f-name" value="' + (it ? cmUtilEscAttr(it.name) : '') + '" placeholder="Ej: Balon T5 entrenamiento"></div>' +
        '<div class="cmutil-form-row">' +
        '<div class="cmutil-form-group"><label>Categoria</label><select id="cmutil-f-cat">' + catOpts + '</select></div>' +
        '<div class="cmutil-form-group"><label>Ubicacion</label><input id="cmutil-f-loc" value="' + (it ? cmUtilEscAttr(it.location || '') : '') + '" placeholder="Ej: Almacen, estanteria 2"></div>' +
        '</div>' +
        '<div class="cmutil-form-row-3">' +
        '<div class="cmutil-form-group"><label>Cantidad total</label><input id="cmutil-f-total" type="number" min="0" value="' + (it ? it.qty_total : 0) + '"></div>' +
        '<div class="cmutil-form-group"><label>Disponible</label><input id="cmutil-f-disp" type="number" min="0" value="' + (it ? it.qty_available : 0) + '"></div>' +
        '<div class="cmutil-form-group"><label>Stock minimo</label><input id="cmutil-f-min" type="number" min="0" value="' + (it ? it.min_stock : 0) + '"></div>' +
        '</div>' +
        '<div class="cmutil-form-row">' +
        '<div class="cmutil-form-group"><label>Estado general</label><select id="cmutil-f-cond">' +
        '<option value="nuevo"' + (it && it.condition === 'nuevo' ? ' selected' : '') + '>Nuevo</option>' +
        '<option value="usado"' + (it && it.condition === 'usado' ? ' selected' : '') + '>Usado</option>' +
        '<option value="deteriorado"' + (it && it.condition === 'deteriorado' ? ' selected' : '') + '>Deteriorado</option>' +
        '</select></div>' +
        '<div class="cmutil-form-group"><label>Trazabilidad individual</label><select id="cmutil-f-ser">' +
        '<option value="false"' + (!it || !it.is_serialized ? ' selected' : '') + '>No</option>' +
        '<option value="true"' + (it && it.is_serialized ? ' selected' : '') + '>Si (unidades numeradas)</option>' +
        '</select></div>' +
        '</div>' +
        '<div class="cmutil-form-group"><label>Notas</label><textarea id="cmutil-f-notes" style="min-height:50px">' + (it ? cmUtilEsc(it.notes || '') : '') + '</textarea></div>' +
        '<div style="display:flex;justify-content:space-between;gap:8px">' +
        (it ? '<button class="cmutil-btn cmutil-btn-danger cmutil-btn-sm" onclick="cmUtilArchivarItem()">Archivar</button>' : '<span></span>') +
        '<button class="cmutil-btn cmutil-btn-primary" onclick="cmUtilGuardarItem()">Guardar</button>' +
        '</div></div>';
    document.body.appendChild(ov);
}

async function cmUtilGuardarItem() {
    var name = document.getElementById('cmutil-f-name').value.trim();
    if (!name) { showToast('El nombre es obligatorio', 'error'); return; }
    var datos = {
        club_id: clubId,
        name: name,
        category: document.getElementById('cmutil-f-cat').value,
        location: document.getElementById('cmutil-f-loc').value.trim() || null,
        qty_total: parseInt(document.getElementById('cmutil-f-total').value) || 0,
        qty_available: parseInt(document.getElementById('cmutil-f-disp').value) || 0,
        min_stock: parseInt(document.getElementById('cmutil-f-min').value) || 0,
        condition: document.getElementById('cmutil-f-cond').value,
        is_serialized: document.getElementById('cmutil-f-ser').value === 'true',
        notes: document.getElementById('cmutil-f-notes').value.trim() || null,
        updated_at: new Date().toISOString()
    };
    var res;
    if (cmUtilItemEditId) {
        res = await supabaseClient.from('cm_util_items').update(datos).eq('id', cmUtilItemEditId);
    } else {
        res = await supabaseClient.from('cm_util_items').insert(datos);
    }
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast(cmUtilItemEditId ? 'Articulo actualizado' : 'Articulo creado', 'success');
    cmUtilCerrarOverlay('cmutil-item-overlay');
    await cmUtilCargarItems();
}

async function cmUtilArchivarItem() {
    if (!cmUtilItemEditId) return;
    if (!confirm('Archivar este articulo? Dejara de verse en el inventario pero su historial se conserva.')) return;
    var res = await supabaseClient.from('cm_util_items').update({ archived: true, archived_at: new Date().toISOString() }).eq('id', cmUtilItemEditId);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Articulo archivado', 'success');
    cmUtilCerrarOverlay('cmutil-item-overlay');
    await cmUtilCargarItems();
}

// ---------- Movimientos ----------
function cmUtilAbrirMovimiento(itemId) {
    var it = cmUtilItems.find(function(x) { return x.id === itemId; });
    if (!it) return;
    var ov = document.createElement('div');
    ov.className = 'cmutil-overlay';
    ov.id = 'cmutil-mov-overlay';
    ov.innerHTML =
        '<div class="cmutil-modal">' +
        '<h3>Movimiento: ' + cmUtilEsc(it.name) + '<button class="cmutil-modal-close" onclick="cmUtilCerrarOverlay(\'cmutil-mov-overlay\')">&times;</button></h3>' +
        '<p style="color:#94a3b8;font-size:12px;margin:0 0 14px">Disponible: <strong style="color:#e2e8f0">' + it.qty_available + '</strong> · Total: <strong style="color:#e2e8f0">' + it.qty_total + '</strong></p>' +
        '<div class="cmutil-form-row">' +
        '<div class="cmutil-form-group"><label>Tipo</label><select id="cmutil-m-tipo">' +
        '<option value="in">Entrada (compra, devolucion, patrocinio)</option>' +
        '<option value="out">Salida (entrega, en uso)</option>' +
        '<option value="loss">Perdida</option>' +
        '<option value="writeoff">Baja (rotura, fin de vida)</option>' +
        '</select></div>' +
        '<div class="cmutil-form-group"><label>Cantidad</label><input id="cmutil-m-qty" type="number" min="1" value="1"></div>' +
        '</div>' +
        '<div class="cmutil-form-group"><label>Motivo</label><input id="cmutil-m-reason" placeholder="Ej: compra temporada, entrega juvenil A, rotura..."></div>' +
        '<div style="display:flex;justify-content:flex-end"><button class="cmutil-btn cmutil-btn-primary" onclick="cmUtilGuardarMovimiento(\'' + itemId + '\')">Registrar</button></div>' +
        '</div>';
    document.body.appendChild(ov);
}

async function cmUtilGuardarMovimiento(itemId) {
    var it = cmUtilItems.find(function(x) { return x.id === itemId; });
    if (!it) return;
    var tipo = document.getElementById('cmutil-m-tipo').value;
    var qty = parseInt(document.getElementById('cmutil-m-qty').value) || 0;
    if (qty <= 0) { showToast('La cantidad debe ser mayor que 0', 'error'); return; }

    // Calcular nuevo stock
    // in: sube disponible (y total si lo supera) · out: baja disponible · loss/writeoff: bajan ambos
    var disp = it.qty_available, total = it.qty_total;
    if (tipo === 'in') { disp += qty; if (disp > total) total = disp; }
    else if (tipo === 'out') { disp -= qty; }
    else { disp -= qty; total -= qty; }
    disp = Math.max(0, disp); total = Math.max(0, total);

    var resMov = await supabaseClient.from('cm_util_movements').insert({
        club_id: clubId,
        item_id: itemId,
        type: tipo,
        qty: qty,
        reason: document.getElementById('cmutil-m-reason').value.trim() || null,
        created_by: usuario ? usuario.id : 0
    });
    if (resMov.error) { showToast('Error: ' + resMov.error.message, 'error'); return; }

    var resItem = await supabaseClient.from('cm_util_items').update({ qty_available: disp, qty_total: total, updated_at: new Date().toISOString() }).eq('id', itemId);
    if (resItem.error) { showToast('Error actualizando stock: ' + resItem.error.message, 'error'); return; }

    showToast('Movimiento registrado', 'success');
    cmUtilCerrarOverlay('cmutil-mov-overlay');
    await cmUtilCargarItems();
}

// ============================================================
// PETICIONES (fisio + genericas)
// ============================================================
async function cmUtilCargarPeticiones() {
    var list = document.getElementById('cmutil-pet-list');
    if (!list) return;
    try {
        var rf = await supabaseClient.from('cm_fisio_material_requests').select('*').eq('club_id', clubId).eq('archived', false).order('created_at', { ascending: false }).limit(50);
        var ru = await supabaseClient.from('cm_util_requests').select('*').eq('club_id', clubId).eq('archived', false).order('created_at', { ascending: false }).limit(50);

        var pets = [];
        (rf.data || []).forEach(function(p) { p._src = 'fisio'; pets.push(p); });
        (ru.data || []).forEach(function(p) { p._src = (p.source === 'sesion') ? 'sesion' : 'manual'; pets.push(p); });

        // Orden: urgentes pendientes primero, luego por fecha (sesiones por fecha de sesion)
        pets.sort(function(a, b) {
            var aAct = (a.status === 'pending' || a.status === 'in_process') ? 0 : 1;
            var bAct = (b.status === 'pending' || b.status === 'in_process') ? 0 : 1;
            if (aAct !== bAct) return aAct - bAct;
            var aU = a.urgency === 'urgente' ? 0 : 1, bU = b.urgency === 'urgente' ? 0 : 1;
            if (aU !== bU) return aU - bU;
            var aD = a.session_date || a.created_at, bD = b.session_date || b.created_at;
            return aD < bD ? 1 : -1;
        });
        cmUtilPeticiones = pets;
        cmUtilRenderPeticiones();
    } catch (e) {
        console.error('Error cargando peticiones:', e);
        list.innerHTML = '<div class="cmutil-empty"><p>Error cargando las peticiones</p></div>';
    }
}

function cmUtilFiltrarPet(v) {
    cmUtilFiltroPet = v;
    document.querySelectorAll('.cmutil-seg-btn[data-pet]').forEach(function(b) { b.classList.toggle('active', b.getAttribute('data-pet') === v); });
    cmUtilRenderPeticiones();
}

function cmUtilRenderPeticiones() {
    var list = document.getElementById('cmutil-pet-list');
    if (!list) return;
    var pets = cmUtilPeticiones;
    if (cmUtilFiltroPet === 'pendientes') pets = pets.filter(function(p) { return p.status === 'pending' || p.status === 'in_process'; });
    else if (cmUtilFiltroPet !== 'all') pets = pets.filter(function(p) { return p._src === cmUtilFiltroPet; });

    if (!pets.length) {
        list.innerHTML = '<div class="cmutil-empty"><div class="icon">&#128235;</div><p>No hay peticiones' + (cmUtilFiltroPet !== 'all' ? ' con este filtro' : '') + '</p></div>';
        return;
    }

    var srcLabels = { fisio: 'Fisio', manual: 'Manual', sesion: 'Sesion' };
    var h = '';
    pets.forEach(function(p) {
        var items = (p.items || []).map(function(it) { return it.quantity + ' ' + cmUtilEsc(it.name) + (it.unit ? ' (' + cmUtilEsc(it.unit) + ')' : ''); }).join(', ');
        var stColor = CMUTIL_STATUS_COLORS[p.status] || '#64748b';
        var fecha = p.session_date ? cmUtilFecha(p.session_date) : cmUtilFecha(p.created_at);
        var quien = p._src === 'fisio' ? 'Fisio' : cmUtilEsc(p.requester_name || p.requester_role || 'Sin nombre');
        h += '<div class="cmutil-pet-card' + (p.urgency === 'urgente' ? ' urgente' : '') + '">' +
            '<div class="cmutil-pet-head">' +
            '<span class="cmutil-pet-title">' + quien +
            (p.urgency === 'urgente' ? ' <span class="cmutil-badge cmutil-badge-urgente">URGENTE</span>' : '') +
            ' <span class="cmutil-badge cmutil-badge-src">' + (srcLabels[p._src] || p._src) + '</span></span>' +
            '<span style="color:' + stColor + ';font-size:12px;font-weight:700">' + (CMUTIL_STATUS_LABELS[p.status] || p.status) + '</span>' +
            '</div>' +
            '<div class="cmutil-pet-meta">' + (p._src === 'sesion' ? 'Sesion del ' : '') + fecha + (p.notes ? ' · ' + cmUtilEsc(p.notes) : '') + '</div>' +
            '<div class="cmutil-pet-items">' + items + '</div>' +
            '<div class="cmutil-pet-actions">' + cmUtilBotonesEstado(p) + '</div>' +
            '</div>';
    });
    list.innerHTML = h;
}

function cmUtilBotonesEstado(p) {
    if (p.status === 'delivered' || p.status === 'rejected') return '';
    var btn = function(st, label) {
        return '<button class="cmutil-btn cmutil-btn-secondary cmutil-btn-sm" onclick="cmUtilCambiarEstado(\'' + p._src + '\',\'' + p.id + '\',\'' + st + '\')">' + label + '</button>';
    };
    var h = '';
    if (p.status === 'pending') h += btn('in_process', 'En proceso') + btn('ordered', 'Pedido');
    if (p.status === 'in_process') h += btn('ordered', 'Pedido');
    h += btn('delivered', 'Entregado') + btn('rejected', 'Rechazar');
    return h;
}

async function cmUtilCambiarEstado(src, id, nuevo) {
    var tabla = (src === 'fisio') ? 'cm_fisio_material_requests' : 'cm_util_requests';
    var datos = { status: nuevo };
    if (tabla === 'cm_util_requests') datos.updated_at = new Date().toISOString();
    var res = await supabaseClient.from(tabla).update(datos).eq('id', id);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Estado actualizado: ' + (CMUTIL_STATUS_LABELS[nuevo] || nuevo), 'success');
    await cmUtilCargarPeticiones();
}

// ---------- Nueva peticion manual (el utillero anota lo que le piden de palabra) ----------
function cmUtilAbrirPeticionForm() {
    var ov = document.createElement('div');
    ov.className = 'cmutil-overlay';
    ov.id = 'cmutil-pet-overlay';
    ov.innerHTML =
        '<div class="cmutil-modal">' +
        '<h3>Nueva peticion<button class="cmutil-modal-close" onclick="cmUtilCerrarOverlay(\'cmutil-pet-overlay\')">&times;</button></h3>' +
        '<div class="cmutil-form-row">' +
        '<div class="cmutil-form-group"><label>Quien lo pide</label><input id="cmutil-p-quien" placeholder="Ej: Entrenador Juvenil A"></div>' +
        '<div class="cmutil-form-group"><label>Urgencia</label><select id="cmutil-p-urg"><option value="normal">Normal</option><option value="urgente">Urgente</option></select></div>' +
        '</div>' +
        '<div class="cmutil-form-group"><label>Material (un articulo por linea: cantidad y nombre)</label><textarea id="cmutil-p-items" style="min-height:80px" placeholder="20 conos&#10;15 petos&#10;10 balones T5"></textarea></div>' +
        '<div class="cmutil-form-group"><label>Notas</label><input id="cmutil-p-notes" placeholder="Observaciones..."></div>' +
        '<div style="display:flex;justify-content:flex-end"><button class="cmutil-btn cmutil-btn-primary" onclick="cmUtilGuardarPeticion()">Guardar</button></div>' +
        '</div>';
    document.body.appendChild(ov);
}

async function cmUtilGuardarPeticion() {
    var lineas = document.getElementById('cmutil-p-items').value.split('\n');
    var items = [];
    lineas.forEach(function(l) {
        l = l.trim();
        if (!l) return;
        var m = l.match(/^(\d+)\s+(.+)$/);
        if (m) items.push({ quantity: parseInt(m[1]), name: m[2] });
        else items.push({ quantity: 1, name: l });
    });
    if (!items.length) { showToast('Anade al menos un articulo', 'error'); return; }

    var res = await supabaseClient.from('cm_util_requests').insert({
        club_id: clubId,
        requested_by: usuario ? usuario.id : 0,
        requester_name: document.getElementById('cmutil-p-quien').value.trim() || null,
        requester_role: 'utillero',
        items: items,
        urgency: document.getElementById('cmutil-p-urg').value,
        notes: document.getElementById('cmutil-p-notes').value.trim() || null,
        status: 'pending',
        source: 'manual'
    });
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Peticion guardada', 'success');
    cmUtilCerrarOverlay('cmutil-pet-overlay');
    await cmUtilCargarPeticiones();
}

// ============================================================
// UTILIDADES
// ============================================================
function cmUtilCerrarOverlay(id) {
    var ov = document.getElementById(id);
    if (ov) ov.remove();
}
function cmUtilEsc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function cmUtilEscAttr(s) {
    return cmUtilEsc(s).replace(/"/g, '&quot;');
}
function cmUtilFecha(d) {
    if (!d) return '';
    try {
        var f = (d.length === 10) ? new Date(d + 'T12:00:00') : new Date(d);
        return f.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return d; }
}
// ========== AUTO-MONTAJE ==========
(function cmUtilAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 20) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (!cmPuedeVer('modulo_utillero')) { clearInterval(intervalo); return; }
        clearInterval(intervalo);

        if (document.getElementById('cm-tab-utillero')) return;
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;

        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-utillero';
        tab.setAttribute('onclick', "cambiarModulo('utillero', this)");
        tab.innerHTML = '<span class="tab-icon">📦</span><span>Utillero</span>';
        mainTabs.appendChild(tab);

        if (!document.getElementById('modulo-utillero')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-utillero';
            var ultModulo = document.querySelector('.vista-modulo:last-of-type');
            if (ultModulo && ultModulo.parentElement) { ultModulo.parentElement.insertBefore(vista, ultModulo.nextSibling); }
            else { document.body.appendChild(vista); }
        }

        if (typeof registrarModulo === 'function') { registrarModulo('utillero', function() { cmUtilInit('modulo-utillero'); }); }

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
        if (tv.length === 1 && tv[0].id === 'cm-tab-utillero') { cambiarModulo('utillero', tab); }

        console.log('[Utillero] Auto-montado y registrado');
    }, 500);
})();