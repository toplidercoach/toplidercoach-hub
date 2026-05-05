// ========== CLUB-ADMIN-CARGOS.JS ==========
// Gestión de cargos/roles y permisos

function initSecCargos() {
    document.getElementById('sec-cargos').innerHTML = '<div class="card"><div class="card-head"><h3>Cargos</h3><div style="display:flex;gap:8px"><button class="btn btn-ghost" onclick="crearCargosDefecto()">Plantilla</button><button class="btn btn-primary" onclick="abrirModalCargo()">+ Cargo</button></div></div><div class="card-body"><div id="l-cargos"></div></div></div>';
    renderCargos();
    insertarModal('m-cargo', '<div class="modal-bg" id="m-cargo"><div class="modal"><div class="modal-head"><h3 id="m-cargo-t">Cargo</h3><button class="modal-close" onclick="cm(\'m-cargo\')">&times;</button></div><div class="modal-body"><input type="hidden" id="cg-id"><div class="fr"><div class="fg"><label>Nombre *</label><input id="cg-nombre"></div><div class="fg"><label>Alcance</label><select id="cg-scope"><option value="all">Todos</option><option value="assigned">Asignados</option></select></div></div><div class="fg"><label>Descripcion</label><input id="cg-desc"></div><div class="fg"><label>Permisos</label><div class="perms-grid" id="perms-grid"><div class="ph">Modulo</div><div class="ph" style="text-align:center">Ver</div><div class="ph" style="text-align:center">Editar</div></div></div></div><div class="modal-foot"><button class="btn btn-secondary" onclick="cm(\'m-cargo\')">Cancelar</button><button class="btn btn-success" onclick="guardarCargo()">Guardar</button></div></div></div>');
}

async function cargarCargos() {
    var r = await SB.from('club_roles').select('*').eq('club_id', CI).order('sort_order');
    cargos = r.data || [];
    renderCargos(); stats();
}

function renderCargos() {
    var el = document.getElementById('l-cargos');
    if (!el) return;
    if (!cargos.length) { el.innerHTML = '<div class="empty"><p>No hay cargos.</p></div>'; return; }
    el.innerHTML = '<table class="tbl"><thead><tr><th>Cargo</th><th>Desc</th><th>Equipos</th><th>Modulos</th><th></th></tr></thead><tbody>' +
        cargos.map(function(c) {
            var p = c.permissions || {};
            var n = Object.keys(p).filter(function(k) { return p[k] && p[k].ver; }).length;
            return '<tr><td><span class="tn">' + c.name + '</span> ' + (c.is_admin ? '<span class="admin-icon">ADMIN</span>' : '') + '</td>' +
                '<td style="color:var(--ts2);font-size:12px">' + (c.description || '—') + '</td>' +
                '<td><span class="badge ' + (c.team_scope === 'all' ? 'badge-blue' : 'badge-amber') + '">' + (c.team_scope === 'all' ? 'Todos' : 'Asign.') + '</span></td>' +
                '<td><span class="badge badge-purple">' + n + '</span></td>' +
                '<td><div class="row-actions"><button class="btn btn-secondary btn-sm" onclick="editarCargo(\'' + c.id + '\')">Editar</button>' + (!c.is_admin ? '<button class="btn btn-danger btn-sm" onclick="eliminarCargo(\'' + c.id + '\')">X</button>' : '') + '</div></td></tr>';
        }).join('') + '</tbody></table>';
}

function renderPG(p) {
    var g = document.getElementById('perms-grid');
    g.innerHTML = '<div class="ph">Modulo</div><div class="ph" style="text-align:center">Ver</div><div class="ph" style="text-align:center">Editar</div>';
    MODULOS.forEach(function(m) {
        var x = (p && p[m.key]) || {};
        g.innerHTML += '<div class="pm">' + m.label + '</div><div class="pc"><input type="checkbox" data-mod="' + m.key + '" data-perm="ver" ' + (x.ver ? 'checked' : '') + '></div><div class="pc"><input type="checkbox" data-mod="' + m.key + '" data-perm="editar" ' + (x.editar ? 'checked' : '') + '></div>';
    });
}

function readPG() {
    var p = {};
    MODULOS.forEach(function(m) {
        var v = document.querySelector('[data-mod="' + m.key + '"][data-perm="ver"]');
        var e = document.querySelector('[data-mod="' + m.key + '"][data-perm="editar"]');
        p[m.key] = { ver: v ? v.checked : false, editar: e ? e.checked : false };
    });
    return p;
}

function abrirModalCargo(d) {
    sv('cg-id', d?.id); sv('cg-nombre', d?.name); sv('cg-desc', d?.description);
    sv('cg-scope', d?.team_scope || 'assigned');
    document.getElementById('m-cargo-t').textContent = d ? 'Editar' : 'Nuevo';
    renderPG(d ? d.permissions : {});
    document.getElementById('m-cargo').classList.add('open');
}

function editarCargo(id) { var c = cargos.find(function(x) { return x.id === id; }); if (c) abrirModalCargo(c); }

async function guardarCargo() {
    var id = gv('cg-id'), obj = { club_id: CI, name: gv('cg-nombre'), description: gv('cg-desc'), team_scope: gv('cg-scope'), permissions: readPG() };
    if (!obj.name) { toast('Nombre obligatorio'); return; }
    var r;
    if (id) r = await SB.from('club_roles').update(obj).eq('id', id);
    else r = await SB.from('club_roles').insert(obj);
    if (r.error) { toast(r.error.message); return; }
    cm('m-cargo'); toast('OK'); await cargarCargos();
}

async function eliminarCargo(id) {
    if (!confirm('Eliminar?')) return;
    await SB.from('club_roles').delete().eq('id', id);
    toast('OK'); await cargarCargos();
}

async function crearCargosDefecto() {
    if (cargos.length > 0 && !confirm('Añadir plantilla?')) return;
    var ex = cargos.map(function(c) { return c.name.toLowerCase(); });
    var tv = {}; MODULOS.forEach(function(m) { tv[m.key] = {ver:true,editar:true}; });
    var sd = {}; MODULOS.forEach(function(m) { var es=['dashboard','planificador','pizarra','matchstats','asistencia','periodizacion','mi_club','staff_ia','direccion_deportiva','scouting','plan_partido'].includes(m.key);sd[m.key]={ver:es,editar:es}; });
    var se = {}; MODULOS.forEach(function(m) { var es=['dashboard','planificador','pizarra','matchstats','asistencia','periodizacion','mi_club','staff_ia','plan_partido'].includes(m.key);se[m.key]={ver:es,editar:es}; });
    var so = {}; MODULOS.forEach(function(m) { so[m.key]={ver:m.key==='economia'||m.key==='dashboard',editar:m.key==='economia'}; });
    var pl = [
        {name:'Administrador',description:'Control total',permissions:tv,team_scope:'all',is_admin:true,sort_order:0},
        {name:'Director Deportivo',description:'Deportivo',permissions:sd,team_scope:'all',is_admin:false,sort_order:1},
        {name:'Coordinador',description:'Categorias',permissions:Object.assign({},se,{direccion_deportiva:{ver:true,editar:false}}),team_scope:'assigned',is_admin:false,sort_order:2},
        {name:'Entrenador',description:'Su equipo',permissions:se,team_scope:'assigned',is_admin:false,sort_order:3},
        {name:'Gestor Economico',description:'Finanzas',permissions:so,team_scope:'all',is_admin:false,sort_order:4}
    ];
    var nv = pl.filter(function(p) { return !ex.includes(p.name.toLowerCase()); }).map(function(p) { p.club_id = CI; return p; });
    if (!nv.length) { toast('Ya existen'); return; }
    await SB.from('club_roles').insert(nv);
    toast(nv.length + ' creados'); await cargarCargos();
}

console.log('Club Admin Cargos cargado');
