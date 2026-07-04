// ========== CLUB-ADMIN-MIEMBROS.JS ==========
// Gestión de miembros del staff

function initSecMiembros() {
    document.getElementById('sec-miembros').innerHTML = '<div class="card"><div class="card-head"><h3>Miembros</h3><button class="btn btn-primary" onclick="abrirModalMiembro()">+ Miembro</button></div><div class="card-body"><div id="l-miembros"></div></div></div>';
    renderMiembros();
    insertarModal('m-miembro', '<div class="modal-bg" id="m-miembro"><div class="modal"><div class="modal-head"><h3 id="m-miembro-t">Miembro</h3><button class="modal-close" onclick="cm(\'m-miembro\')">&times;</button></div><div class="modal-body"><input type="hidden" id="mb-id"><input type="hidden" id="mb-purl"><div class="photo-picker"><div class="photo-preview" id="mb-pp" onclick="document.getElementById(\'mb-pi\').click()"><span class="phi">&#128247;</span><span class="phc">Foto</span></div><input type="file" id="mb-pi" accept="image/*" onchange="subirFotoMb(this)" style="display:none"></div><div class="fr"><div class="fg"><label>Nombre *</label><input id="mb-nombre"></div><div class="fg"><label>Email</label><input id="mb-email"></div></div><div class="fr"><div class="fg"><label>Cargo *</label><select id="mb-cargo"></select></div><div class="fg"><label>WP ID</label><input type="number" id="mb-wpid"></div></div><div class="fg"><label>Equipos</label><div id="mb-eqs" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"></div></div></div><div class="modal-foot"><button class="btn btn-secondary" onclick="cm(\'m-miembro\')">Cancelar</button><button class="btn btn-success" onclick="guardarMiembro()">Guardar</button></div></div></div>');
}

async function subirFotoMb(input) {
    var f = input.files[0]; if (!f) return;
    var pp = document.getElementById('mb-pp');
    pp.innerHTML = '<div class="photo-uploading"></div>';
    var url = await subirFoto(f, 'members');
    pp.innerHTML = url ? '<img src="' + url + '"><span class="phc">Cambiar</span>' : '<span class="phi">&#128247;</span><span class="phc">Foto</span>';
    if (url) sv('mb-purl', url);
    input.value = '';
}

async function cargarMiembros() {
    var r = await SB.from('club_members').select('*, club_roles(name, is_admin)').eq('club_id', CI).order('created_at');
    miembros = r.data || [];
    renderMiembros(); stats();
}

function renderMiembros() {
    var el = document.getElementById('l-miembros');
    if (!el) return;
    if (!miembros.length) { el.innerHTML = '<div class="empty"><p>No hay miembros.</p></div>'; return; }
    el.innerHTML = '<table class="tbl"><thead><tr><th>Nombre</th><th>Cargo</th><th>Email</th><th>Equipos</th><th></th></tr></thead><tbody>' +
        miembros.map(function(m) {
            var rn = m.club_roles ? m.club_roles.name : '—';
            var ia = m.club_roles && m.club_roles.is_admin;
            return '<tr><td><div class="member-row">' + avt(m.photo_url, m.display_name, 'avatar-sm') +
                '<span><span class="tn">' + (m.display_name || '—') + '</span> ' + (ia ? '<span class="admin-icon">ADMIN</span>' : '') + '</span></div></td>' +
                '<td><span class="badge badge-blue">' + rn + '</span></td>' +
                '<td style="color:var(--ts2);font-size:12px">' + (m.email || '—') + '</td>' +
                '<td><span class="badge badge-green">' + (m.team_ids ? m.team_ids.length : 0) + '</span></td>' +
                '<td><div class="row-actions"><button class="btn btn-secondary btn-sm" onclick="editarMiembro(\'' + m.id + '\')">Editar</button><button class="btn btn-danger btn-sm" onclick="eliminarMiembro(\'' + m.id + '\')">X</button></div></td></tr>';
        }).join('') + '</tbody></table>';
}

function abrirModalMiembro(d) {
    sv('mb-id', d?.id); sv('mb-nombre', d?.display_name); sv('mb-email', d?.email);
    sv('mb-wpid', d?.wp_user_id); sv('mb-purl', d?.photo_url);
    var pp = document.getElementById('mb-pp');
    pp.innerHTML = d?.photo_url ? '<img src="' + d.photo_url + '"><span class="phc">Cambiar</span>' : '<span class="phi">&#128247;</span><span class="phc">Foto</span>';
    document.getElementById('m-miembro-t').textContent = d ? 'Editar' : 'Nuevo';
    var sel = document.getElementById('mb-cargo');
    sel.innerHTML = '<option value="">—</option>' + cargos.map(function(c) {
        return '<option value="' + c.id + '"' + (d && d.role_id === c.id ? ' selected' : '') + '>' + c.name + '</option>';
    }).join('');
    var w = document.getElementById('mb-eqs');
    var a = d ? (d.team_ids || []) : [];
    w.innerHTML = equipos.length ? equipos.map(function(e) {
        return '<label style="display:flex;align-items:center;gap:5px;background:var(--bg-deep);padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;border:1px solid var(--border);font-weight:500"><input type="checkbox" class="mbc" value="' + e.id + '"' + (a.includes(e.id) ? ' checked' : '') + ' style="accent-color:var(--accent)">' + e.name + '</label>';
    }).join('') : '';
    document.getElementById('m-miembro').classList.add('open');
}

function editarMiembro(id) { var m = miembros.find(function(x) { return x.id === id; }); if (m) abrirModalMiembro(m); }

async function guardarMiembro() {
    var id = gv('mb-id');
    var ti = Array.from(document.querySelectorAll('.mbc:checked')).map(function(c) { return c.value; });
    var obj = { club_id: CI, display_name: gv('mb-nombre'), email: gv('mb-email'),
        wp_user_id: parseInt(gv('mb-wpid')) || 0, role_id: gv('mb-cargo'),
        team_ids: ti, photo_url: gv('mb-purl') };
    if (!obj.display_name || !obj.role_id || !obj.wp_user_id) { toast('Nombre, cargo y WP ID obligatorios'); return; }
    var r;
    if (id) r = await SB.from('club_members').update(obj).eq('id', id);
    else r = await SB.from('club_members').insert(obj);
    if (r.error) { toast(r.error.message); return; }
    cm('m-miembro'); toast('OK'); await cargarMiembros();
}

async function eliminarMiembro(id) {
    if (!confirm('Eliminar?')) return;
    await SB.from('club_members').delete().eq('id', id);
    toast('OK'); await cargarMiembros();
}

console.log('Club Admin Miembros cargado');
