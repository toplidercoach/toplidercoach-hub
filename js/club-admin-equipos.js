// ========== CLUB-ADMIN-EQUIPOS.JS ==========
// Gestión de equipos: lista, detalle, plantilla

// ===== INIT =====
function initSecEquipos() {
    document.getElementById('sec-equipos').innerHTML = '<div class="card"><div class="card-head"><h3>Equipos</h3><button class="btn btn-primary" onclick="abrirModalEquipo()">+ Nuevo equipo</button></div><div class="card-body"><div id="l-equipos"></div></div></div>';
    document.getElementById('sec-team-detail').innerHTML = '<button class="btn-back" onclick="volverAEquipos()">&#8592; Volver</button><div id="team-hdr"></div><div class="card"><div class="card-head"><h3>Plantilla <span class="tc" id="tc-pl">0</span></h3><div style="display:flex;gap:8px"><button class="btn btn-ghost" onclick="editarInfoEquipo()">Editar equipo</button><button class="btn btn-primary" onclick="abrirModalJugador()">+ Jugador</button></div></div><div class="card-body"><div id="l-plantilla"></div></div></div>';
    renderEquipos();
    // Insertar modal equipo
    insertarModal('m-equipo', modalEquipoHTML());
}

// ===== MODAL HTML =====
function modalEquipoHTML() {
    return '<div class="modal-bg" id="m-equipo"><div class="modal"><div class="modal-head"><h3 id="m-equipo-t">Nuevo equipo</h3><button class="modal-close" onclick="cm(\'m-equipo\')">&times;</button></div><div class="modal-body">' +
        '<input type="hidden" id="eq-id">' +
        '<div class="fr"><div class="fg"><label>Nombre *</label><input id="eq-nombre"></div><div class="fg"><label>Categoria</label><select id="eq-cat"><option value="">—</option><option value="prebenjamin">Prebenjamin</option><option value="benjamin">Benjamin</option><option value="alevin">Alevin</option><option value="infantil">Infantil</option><option value="cadete">Cadete</option><option value="juvenil">Juvenil</option><option value="senior">Senior</option></select></div></div>' +
        '<div class="fr"><div class="fg"><label>Color 1</label><input type="color" id="eq-c1" value="#3b82f6"></div><div class="fg"><label>Color 2</label><input type="color" id="eq-c2" value="#1e40af"></div></div>' +
        '<div class="fsec">Staff</div>' +
        '<div class="fr"><div class="fg"><label>Entrenador</label><input id="eq-coach"></div><div class="fg"><label>Delegado</label><input id="eq-del"></div></div>' +
        '<div class="fr"><div class="fg"><label>Tel.</label><input id="eq-cph"></div><div class="fg"><label>Email</label><input id="eq-cem"></div></div>' +
        '<div class="fsec">Entrenamientos</div>' +
        '<div class="fr"><div class="fg"><label>Horario</label><input id="eq-sch"></div><div class="fg"><label>Instalacion</label><input id="eq-loc"></div></div>' +
        '<div class="fg"><label>Notas</label><textarea id="eq-notes"></textarea></div>' +
        '</div><div class="modal-foot"><button class="btn btn-secondary" onclick="cm(\'m-equipo\')">Cancelar</button><button class="btn btn-success" onclick="guardarEquipo()">Guardar</button></div></div></div>';
}

// ===== CARGAR =====
async function cargarEquipos() {
    var r = await SB.from('club_teams').select('*').eq('club_id', CI).order('category').order('name');
    equipos = r.data || [];
    renderEquipos();
    stats();
}

// ===== RENDER LISTA =====
function renderEquipos() {
    var el = document.getElementById('l-equipos');
    if (!el) return;
    if (!equipos.length) {
        el.innerHTML = '<div class="empty"><div class="icon">&#9917;</div><p>No hay equipos.</p></div>';
        return;
    }
    el.innerHTML = '<table class="tbl"><thead><tr><th>Equipo</th><th>Categoria</th><th>Entrenador</th><th>Colores</th><th></th></tr></thead><tbody>' +
        equipos.map(function(e) {
            return '<tr><td><span class="tnl" onclick="verEquipo(\'' + e.id + '\')">' + e.name + '</span></td>' +
                '<td>' + (e.category ? '<span class="cat-badge cat-' + e.category + '">' + e.category + '</span>' : '—') + '</td>' +
                '<td style="font-size:12px;color:var(--ts2)">' + (e.coach_name || '—') + '</td>' +
                '<td><div class="color-pair"><span class="color-swatch" style="background:' + e.color_primary + '"></span><span class="color-swatch" style="background:' + e.color_secondary + '"></span></div></td>' +
                '<td><div class="row-actions"><button class="btn btn-secondary btn-sm" onclick="verEquipo(\'' + e.id + '\')">Ver</button><button class="btn btn-danger btn-sm" onclick="eliminarEquipo(\'' + e.id + '\',\'' + e.name + '\')">X</button></div></td></tr>';
        }).join('') + '</tbody></table>';
}

// ===== MODAL =====
function abrirModalEquipo(d) {
    sv('eq-id', d?.id); sv('eq-nombre', d?.name); sv('eq-cat', d?.category);
    sv('eq-c1', d?.color_primary || '#3b82f6'); sv('eq-c2', d?.color_secondary || '#1e40af');
    sv('eq-coach', d?.coach_name); sv('eq-del', d?.delegate_name);
    sv('eq-cph', d?.coach_phone); sv('eq-cem', d?.coach_email);
    sv('eq-sch', d?.training_schedule); sv('eq-loc', d?.training_location);
    sv('eq-notes', d?.notes);
    document.getElementById('m-equipo-t').textContent = d ? 'Editar equipo' : 'Nuevo equipo';
    document.getElementById('m-equipo').classList.add('open');
}

function editarInfoEquipo() { if (equipoActual) abrirModalEquipo(equipoActual); }

// ===== GUARDAR =====
async function guardarEquipo() {
    var id = gv('eq-id');
    var obj = { club_id:CI, name:gv('eq-nombre'), category:gv('eq-cat'),
        color_primary:gv('eq-c1'), color_secondary:gv('eq-c2'),
        coach_name:gv('eq-coach'), delegate_name:gv('eq-del'),
        coach_phone:gv('eq-cph'), coach_email:gv('eq-cem'),
        training_schedule:gv('eq-sch'), training_location:gv('eq-loc'), notes:gv('eq-notes') };
    if (!obj.name) { toast('Nombre obligatorio'); return; }
    var err;
    if (id) { var r = await SB.from('club_teams').update(obj).eq('id', id); err = r.error; }
    else { var r = await SB.from('club_teams').insert(obj); err = r.error; }
    if (err) { toast('Error: ' + err.message); return; }
    cm('m-equipo'); toast(id ? 'Actualizado' : 'Creado');
    await cargarEquipos();
    if (id && equipoActual && equipoActual.id === id) { equipoActual = Object.assign({}, equipoActual, obj); renderTeamHdr(); }
}

async function eliminarEquipo(id, n) {
    if (!confirm('Eliminar "' + n + '"?')) return;
    await SB.from('club_teams').delete().eq('id', id);
    toast('Eliminado'); await cargarEquipos();
}

// ===== DETALLE EQUIPO =====
async function verEquipo(id) {
    equipoActual = equipos.find(function(e) { return e.id === id; });
    if (!equipoActual) return;
    mostrarSeccion('sec-team-detail');
    renderTeamHdr();
    await cargarPlantilla();
}

function volverAEquipos() {
    equipoActual = null;
    nav('equipos', document.querySelectorAll('.tab')[0]);
}

function renderTeamHdr() {
    var e = equipoActual;
    document.getElementById('team-hdr').innerHTML = '<div class="team-header"><div class="team-crest" style="background:linear-gradient(135deg,' + e.color_primary + ',' + e.color_secondary + ')">' + e.name.charAt(0) + '</div><div class="team-header-info"><h2>' + e.name + '</h2><div class="team-header-meta">' +
        (e.category ? '<span class="tmi"><span class="cat-badge cat-' + e.category + '">' + e.category + '</span></span>' : '') +
        (e.coach_name ? '<span class="tmi">Entrenador: <strong>' + e.coach_name + '</strong></span>' : '') +
        (e.training_schedule ? '<span class="tmi">&#128339; ' + e.training_schedule + '</span>' : '') +
        '</div></div></div>';
}

// ===== PLANTILLA =====
async function cargarPlantilla() {
    if (!equipoActual) return;
    var t = tempActual();
    var r = await SB.from('club_player_seasons').select('*, club_players(*)').eq('team_id', equipoActual.id).eq('season_name', t).eq('active', true).order('shirt_number');
    plantilla = r.data || [];
    renderPlantilla();
    document.getElementById('tc-pl').textContent = plantilla.length;
}

function renderPlantilla() {
    var el = document.getElementById('l-plantilla');
    if (!el) return;
    if (!plantilla.length) {
        el.innerHTML = '<div class="empty"><div class="icon">&#128085;</div><p>Sin jugadores.</p></div>';
        return;
    }
    el.innerHTML = '<div class="players-grid">' + plantilla.map(function(ps) {
        var j = ps.club_players || {};
        var pc = PC[ps.position] || 'var(--tm)';
        var ed = edad(j.birth_date);
        return '<div class="pc2" onclick="verJugador(\'' + j.id + '\',\'team\')">' +
            '<div class="pc2-badge"><span class="badge ' + (SB2[j.status] || 'badge-gray') + '">' + (SL[j.status] || j.status) + '</span></div>' +
            '<div class="pc2-top">' +
            (j.photo_url ? '<img src="' + j.photo_url + '" class="avatar-lg" style="border-color:' + pc + '">' : '<div class="pc2-num" style="background:' + pc + '">' + (ps.shirt_number || '—') + '</div>') +
            '<div><div class="pc2-name">' + j.name + '</div><div class="pc2-pos">' + (ps.position_detail || ps.position || '') + '</div></div></div>' +
            '<div class="pc2-details">' +
            (ps.shirt_number && j.photo_url ? '<span class="pc2-det">#' + ps.shirt_number + '</span>' : '') +
            (ed ? '<span class="pc2-det">' + ed + ' anos</span>' : '') +
            (j.dominant_foot ? '<span class="pc2-det">Pie ' + j.dominant_foot + '</span>' : '') +
            (ps.height_cm ? '<span class="pc2-det">' + ps.height_cm + 'cm</span>' : '') +
            '</div></div>';
    }).join('') + '</div>';
}

console.log('Club Admin Equipos cargado');
