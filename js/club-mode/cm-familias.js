// ============================================================
// CM-FAMILIAS.JS - Modulo de Comunicacion a Familias
// TopLiderCoach HUB - Club Mode - Fase P.3
// ============================================================
// Modulo de la Oficina del club. Gestiona la comunicacion con
// las familias: directorio de contactos y circulares.
// Visible para roles con permiso 'comunicacion_familias'.
// Prefijo: cmFam (todas las variables y funciones)
//
// Estado de construccion:
//   - Directorio    -> Paso 1 (HECHO)
//   - Circulares    -> Paso 2 (pendiente)
//   - Convocatorias -> Paso 3 (pendiente)
//
// NOTA DE DISENO: los datos de las familias NO se duplican en una
// tabla aparte. Viven en club_players (parent1_*, parent2_*). Este
// modulo los lee de ahi. El "canal de entrega" a las familias
// (portal, PWA, WhatsApp...) es trabajo futuro; ahora se construye
// el lado del club (redactar, segmentar, registrar).
// ============================================================

// ========== ESTADO DEL MODULO ==========
var cmFamContainerId  = null;     // id del contenedor donde se monta
var cmFamTabActiva    = 'directorio';
var cmFamJugadores    = [];       // jugadores con sus datos de familia
var cmFamEquipos      = [];       // equipos del club
var cmFamFiltroEquipo = 'all';    // filtro de equipo del directorio
var cmFamCirculares   = [];       // circulares cargadas
var cmFamDetalleCirc       = null; // circular abierta en el detalle
var cmFamDetalleRecipients = [];   // destinatarios de la circular abierta


// ========== HELPERS ==========

// Escapa texto para insertarlo de forma segura en HTML.
function cmFamEsc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Devuelve los jugadores que pasan el filtro de equipo actual.
function cmFamFiltrados() {
    return cmFamJugadores.filter(function(j) {
        if (cmFamFiltroEquipo !== 'all' && j.teamId !== cmFamFiltroEquipo) return false;
        return true;
    });
}

// Timestamp ISO -> 'DD/MM/AAAA'
function cmFamFechaCorta(ts) {
    if (!ts) return '';
    try { return new Date(ts).toLocaleDateString('es-ES'); } catch (e) { return ''; }
}


// ========== INICIALIZACION ==========
// Punto de entrada. Lo llama el HUB al abrir la pestana "Familias".
function cmFamInit(containerId) {
    var container = document.getElementById(containerId);
    if (!container) { console.error('cmFamInit: contenedor no encontrado:', containerId); return; }
    cmFamContainerId = containerId;
    cmFamRenderPanel(container);
    cmFamCambiarTab('directorio');
}


// ========== RENDER DEL PANEL PRINCIPAL ==========
// El panel lleva su PROPIO fondo oscuro (.cmfam-wrap) para garantizar
// el contraste de los textos, sin depender del contenedor del HUB.
function cmFamRenderPanel(container) {
    container.innerHTML =
    '<style>' +
        '.cmfam-wrap{background:#0f172a;min-height:calc(100vh - 120px);padding:24px 20px;box-sizing:border-box}' +
        '.cmfam-panel{max-width:1200px;margin:0 auto}' +
        '.cmfam-header{margin-bottom:18px}' +
        '.cmfam-header h2{margin:0;color:#f1f5f9;font-size:20px;font-weight:700}' +
        '.cmfam-header .cmfam-sub{color:#94a3b8;font-size:12px;margin-top:2px}' +
        '.cmfam-tabs{display:flex;gap:0;border-bottom:1px solid #1e293b;margin-bottom:20px;flex-wrap:wrap}' +
        '.cmfam-tab{padding:10px 20px;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all .2s}' +
        '.cmfam-tab:hover{color:#e2e8f0}' +
        '.cmfam-tab.active{color:#3b82f6;border-bottom-color:#3b82f6}' +
        '.cmfam-tab-badge{display:inline-block;margin-left:6px;background:#334155;color:#94a3b8;font-size:10px;padding:1px 6px;border-radius:8px;font-weight:600}' +
        '.cmfam-empty{text-align:center;padding:60px 20px;color:#64748b;grid-column:1/-1}' +
        '.cmfam-empty .icon{font-size:48px;margin-bottom:14px}' +
        '.cmfam-empty h3{color:#e2e8f0;font-size:16px;margin:0 0 6px}' +
        '.cmfam-empty p{font-size:13px;margin:0;line-height:1.6}' +
        '.cmfam-soon{display:inline-block;margin-top:14px;background:#1e293b;border:1px solid #334155;color:#60a5fa;font-size:12px;padding:6px 14px;border-radius:8px}' +
        // botones
        '.cmfam-btn{padding:8px 16px;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s}' +
        '.cmfam-btn-primary{background:#3b82f6;color:#fff}.cmfam-btn-primary:hover{background:#2563eb}' +
        '.cmfam-btn-secondary{background:#334155;color:#e2e8f0}.cmfam-btn-secondary:hover{background:#475569}' +
        // toolbar
        '.cmfam-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}' +
        '.cmfam-toolbar select{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 12px;border-radius:6px;font-size:13px;font-family:inherit;cursor:pointer}' +
        '.cmfam-contador{color:#94a3b8;font-size:12px;margin-bottom:14px}' +
        '.cmfam-contador strong{color:#e2e8f0}' +
        // grid de familias
        '.cmfam-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}' +
        '.cmfam-card{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px 16px}' +
        '.cmfam-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding-bottom:8px;border-bottom:1px solid #334155;margin-bottom:10px}' +
        '.cmfam-jug-name{color:#f1f5f9;font-weight:600;font-size:14px}' +
        '.cmfam-team-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap;background:#1e3a5f;color:#60a5fa;flex-shrink:0}' +
        '.cmfam-tutor{margin-bottom:10px}' +
        '.cmfam-tutor:last-child{margin-bottom:0}' +
        '.cmfam-tutor-name{color:#e2e8f0;font-size:13px;font-weight:600}' +
        '.cmfam-tutor-rel{color:#94a3b8;font-size:11px;font-weight:400}' +
        '.cmfam-tutor-contacto{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:3px}' +
        '.cmfam-tutor-contacto a{color:#60a5fa;font-size:12px;text-decoration:none}' +
        '.cmfam-tutor-contacto a:hover{text-decoration:underline}' +
        '.cmfam-tutor-contacto span{color:#64748b;font-size:12px}' +
        '.cmfam-sin-datos{color:#64748b;font-size:12px;font-style:italic}' +
        '.cmfam-btn-sm{padding:5px 12px;font-size:12px}' +
        // tabla
        '.cmfam-table-wrap{overflow-x:auto;border:1px solid #1e293b;border-radius:10px}' +
        '.cmfam-table{width:100%;border-collapse:collapse;font-size:13px}' +
        '.cmfam-table thead th{background:#1e293b;color:#94a3b8;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left;white-space:nowrap}' +
        '.cmfam-table tbody td{padding:10px 12px;color:#e2e8f0;border-top:1px solid #1e293b}' +
        '.cmfam-table tbody tr:hover{background:#1e293b}' +
        '.cmfam-estado-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap}' +
        // modal
        '.cmfam-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9500;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}' +
        '.cmfam-modal{background:#0f172a;border:1px solid #334155;border-radius:14px;width:100%;max-width:560px}' +
        '.cmfam-modal-header{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #1e293b}' +
        '.cmfam-modal-header h3{margin:0;color:#f1f5f9;font-size:17px}' +
        '.cmfam-modal-close{background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1}' +
        '.cmfam-modal-close:hover{color:#ef4444}' +
        '.cmfam-modal-body{padding:20px 22px}' +
        '.cmfam-modal-footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid #1e293b;flex-wrap:wrap}' +
        '.cmfam-form-group{margin-bottom:14px}' +
        '.cmfam-form-group label{display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;font-weight:600}' +
        '.cmfam-form-group input,.cmfam-form-group select,.cmfam-form-group textarea{width:100%;padding:8px 12px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit;box-sizing:border-box}' +
        '.cmfam-form-group textarea{min-height:120px;resize:vertical}' +
        '.cmfam-form-group input:focus,.cmfam-form-group select:focus,.cmfam-form-group textarea:focus{border-color:#3b82f6;outline:none}' +
        '@media(max-width:640px){.cmfam-tabs{overflow-x:auto;flex-wrap:nowrap}.cmfam-tab{white-space:nowrap}.cmfam-wrap{padding:16px 12px}}' +
    '</style>' +
    '<div class="cmfam-wrap">' +
        '<div class="cmfam-panel">' +
            '<div class="cmfam-header">' +
                '<h2>Comunicacion a Familias</h2>' +
                '<div class="cmfam-sub">Directorio de contactos y circulares del club</div>' +
            '</div>' +
            '<div class="cmfam-tabs">' +
                '<button class="cmfam-tab active" id="cmfam-tab-directorio" onclick="cmFamCambiarTab(\'directorio\',this)">Directorio</button>' +
                '<button class="cmfam-tab" id="cmfam-tab-circulares" onclick="cmFamCambiarTab(\'circulares\',this)">Circulares</button>' +
            '</div>' +
            '<div id="cmfam-tab-content"></div>' +
        '</div>' +
    '</div>';
}


// ========== CAMBIO DE PESTANA ==========
function cmFamCambiarTab(tab, btn) {
    cmFamTabActiva = tab;
    document.querySelectorAll('.cmfam-tab').forEach(function(t) { t.classList.remove('active'); });
    if (btn) {
        btn.classList.add('active');
    } else {
        var el = document.getElementById('cmfam-tab-' + tab);
        if (el) el.classList.add('active');
    }
    var cont = document.getElementById('cmfam-tab-content');
    if (!cont) return;
    if (tab === 'directorio')    cmFamTabDirectorio(cont);
    if (tab === 'circulares')    cmFamTabCirculares(cont);
}


// ============================================================
// PESTANA: DIRECTORIO  (Paso 1)
// Contactos de las familias (parent1/parent2 de club_players).
// ============================================================

function cmFamTabDirectorio(cont) {
    cont.innerHTML =
        '<div id="cmfam-dir-contenido">' +
            '<div class="cmfam-empty"><div class="icon">⏳</div><p>Cargando directorio...</p></div>' +
        '</div>';
    cmFamCargarDirectorio();
}

// Carga equipos + jugadores (con datos de familia) en el estado del modulo.
// La usan tanto el Directorio como las Circulares.
async function cmFamCargarBase() {
    // Equipos
    var rt = await supabaseClient.from('club_teams')
        .select('id, name, category').eq('club_id', clubId).eq('active', true)
        .order('category').order('name');
    cmFamEquipos = rt.data || [];
    var teamNames = {};
    cmFamEquipos.forEach(function(t) { teamNames[t.id] = t.name; });

    // Jugadores con datos de los tutores
    var rp = await supabaseClient.from('club_players')
        .select('id, name, first_name, last_name, ' +
                'parent1_name, parent1_relationship, parent1_phone, parent1_email, ' +
                'parent2_name, parent2_relationship, parent2_phone, parent2_email')
        .eq('club_id', clubId).eq('active', true);
    var players = rp.data || [];

    // Equipo de cada jugador
    var rs = await supabaseClient.from('club_player_seasons')
        .select('player_id, team_id').eq('club_id', clubId).eq('active', true);
    var seasonMap = {};
    (rs.data || []).forEach(function(s) {
        if (!seasonMap[s.player_id]) seasonMap[s.player_id] = s.team_id;
    });

    cmFamJugadores = players.map(function(p) {
        var nombre = p.name || ((p.first_name || '') + ' ' + (p.last_name || '')).trim() || 'Jugador';
        var tid = seasonMap[p.id] || null;
        var tutores = [];
        if (p.parent1_name) tutores.push({
            nombre: p.parent1_name, rel: p.parent1_relationship,
            tel: p.parent1_phone, email: p.parent1_email
        });
        if (p.parent2_name) tutores.push({
            nombre: p.parent2_name, rel: p.parent2_relationship,
            tel: p.parent2_phone, email: p.parent2_email
        });
        return {
            id: p.id, name: nombre, teamId: tid,
            teamName: tid ? (teamNames[tid] || 'Sin equipo') : 'Sin equipo',
            tutores: tutores
        };
    });
    cmFamJugadores.sort(function(a, b) { return a.name.localeCompare(b.name); });
}

// Carga el directorio (usa cmFamCargarBase) y lo pinta.
async function cmFamCargarDirectorio() {
    var cont = document.getElementById('cmfam-dir-contenido');
    if (!cont) return;
    try {
        await cmFamCargarBase();
        cmFamRenderDirectorio();
    } catch (e) {
        console.error('cmFamCargarDirectorio:', e);
        cont.innerHTML = '<div class="cmfam-empty"><div class="icon">⚠️</div><p>Error al cargar el directorio</p></div>';
    }
}

// Pinta el directorio: toolbar, contador y tarjetas de familia.
function cmFamRenderDirectorio() {
    var cont = document.getElementById('cmfam-dir-contenido');
    if (!cont) return;

    if (cmFamJugadores.length === 0) {
        cont.innerHTML = '<div class="cmfam-empty"><div class="icon">📇</div>' +
            '<h3>Sin jugadores</h3><p>No hay jugadores activos en el club.</p></div>';
        return;
    }

    // Toolbar: filtro de equipo + boton copiar emails
    var optsEquipo = '<option value="all">Todos los equipos</option>' +
        cmFamEquipos.map(function(t) {
            return '<option value="' + t.id + '"' + (cmFamFiltroEquipo === t.id ? ' selected' : '') + '>' + cmFamEsc(t.name) + '</option>';
        }).join('');

    var lista = cmFamFiltrados();

    // Contador de fichas con / sin datos de familia
    var conDatos = lista.filter(function(j) { return j.tutores.length > 0; }).length;
    var sinDatos = lista.length - conDatos;

    var html =
        '<div class="cmfam-toolbar">' +
            '<select id="cmfam-filtro-equipo" onchange="cmFamFiltrarDirectorio()">' + optsEquipo + '</select>' +
            '<button class="cmfam-btn cmfam-btn-secondary" onclick="cmFamCopiarEmails()">Copiar emails</button>' +
        '</div>' +
        '<div class="cmfam-contador">' +
            '<strong>' + conDatos + '</strong> con datos de familia' +
            (sinDatos > 0 ? ' &middot; <strong>' + sinDatos + '</strong> sin datos (ficha por completar)' : '') +
        '</div>';

    if (lista.length === 0) {
        html += '<div class="cmfam-empty"><div class="icon">🔍</div><p>No hay jugadores en este equipo.</p></div>';
        cont.innerHTML = html;
        return;
    }

    html += '<div class="cmfam-grid">';
    lista.forEach(function(j) {
        html += '<div class="cmfam-card">' +
            '<div class="cmfam-card-top">' +
                '<div class="cmfam-jug-name">' + cmFamEsc(j.name) + '</div>' +
                '<span class="cmfam-team-badge">' + cmFamEsc(j.teamName) + '</span>' +
            '</div>';
        if (j.tutores.length === 0) {
            html += '<div class="cmfam-sin-datos">Sin datos de familia registrados</div>';
        } else {
            j.tutores.forEach(function(t) {
                var contacto = '';
                if (t.tel)   contacto += '<a href="tel:' + cmFamEsc(t.tel) + '">📞 ' + cmFamEsc(t.tel) + '</a>';
                if (t.email) contacto += '<a href="mailto:' + cmFamEsc(t.email) + '">✉ ' + cmFamEsc(t.email) + '</a>';
                if (!contacto) contacto = '<span>Sin telefono ni email</span>';
                html += '<div class="cmfam-tutor">' +
                    '<div class="cmfam-tutor-name">' + cmFamEsc(t.nombre) +
                        (t.rel ? ' <span class="cmfam-tutor-rel">(' + cmFamEsc(t.rel) + ')</span>' : '') +
                    '</div>' +
                    '<div class="cmfam-tutor-contacto">' + contacto + '</div>' +
                '</div>';
            });
        }
        html += '</div>';
    });
    html += '</div>';

    cont.innerHTML = html;
}

// Relee el filtro de equipo y vuelve a pintar.
function cmFamFiltrarDirectorio() {
    var e = document.getElementById('cmfam-filtro-equipo');
    if (e) cmFamFiltroEquipo = e.value;
    cmFamRenderDirectorio();
}

// Copia al portapapeles los emails de las familias del listado actual.
function cmFamCopiarEmails() {
    var lista = cmFamFiltrados();
    var emails = [];
    lista.forEach(function(j) {
        j.tutores.forEach(function(t) {
            if (t.email && emails.indexOf(t.email) === -1) emails.push(t.email);
        });
    });
    if (emails.length === 0) { showToast('No hay emails en este listado', 'error'); return; }

    var texto = emails.join('; ');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(
            function() { showToast(emails.length + ' emails copiados al portapapeles'); },
            function() { showToast('No se pudo copiar al portapapeles', 'error'); }
        );
    } else {
        showToast('Tu navegador no permite copiar automaticamente', 'error');
    }
}


// ============================================================
// PESTANA: CIRCULARES  (Paso 2A)
// Redactar comunicados a las familias y registrar su envio.
// ============================================================

function cmFamTabCirculares(cont) {
    cont.innerHTML =
        '<div class="cmfam-toolbar">' +
            '<div></div>' +
            '<button class="cmfam-btn cmfam-btn-primary" onclick="cmFamAbrirModalCircular()">+ Nueva circular</button>' +
        '</div>' +
        '<div id="cmfam-circ-lista">' +
            '<div class="cmfam-empty"><div class="icon">⏳</div><p>Cargando circulares...</p></div>' +
        '</div>';
    cmFamCargarCirculares();
}

// Carga las circulares del club (y la base de equipos/jugadores si hace falta).
async function cmFamCargarCirculares() {
    var cont = document.getElementById('cmfam-circ-lista');
    if (!cont) return;
    try {
        if (cmFamEquipos.length === 0 || cmFamJugadores.length === 0) {
            await cmFamCargarBase();
        }
        var res = await supabaseClient.from('cm_comm_messages')
            .select('*, cm_comm_recipients(count)')
            .eq('club_id', clubId).eq('archived', false)
            .order('created_at', { ascending: false });
        if (res.error) throw res.error;
        cmFamCirculares = res.data || [];
        cmFamRenderCirculares();
    } catch (e) {
        console.error('cmFamCargarCirculares:', e);
        cont.innerHTML = '<div class="cmfam-empty"><div class="icon">⚠️</div><p>Error al cargar las circulares</p></div>';
    }
}

// Pinta la tabla de circulares.
function cmFamRenderCirculares() {
    var cont = document.getElementById('cmfam-circ-lista');
    if (!cont) return;

    if (cmFamCirculares.length === 0) {
        cont.innerHTML = '<div class="cmfam-empty"><div class="icon">📣</div>' +
            '<h3>Sin circulares</h3><p>Crea tu primer comunicado con el boton "+ Nueva circular".</p></div>';
        return;
    }

    var teamNames = {};
    cmFamEquipos.forEach(function(t) { teamNames[t.id] = t.name; });

    var filas = '';
    cmFamCirculares.forEach(function(c) {
        var destino = (c.audience_type === 'team')
            ? (teamNames[c.audience_team_id] || 'Equipo')
            : 'Todo el club';
        var numDest = (c.cm_comm_recipients && c.cm_comm_recipients[0]) ? c.cm_comm_recipients[0].count : 0;
        var fecha = cmFamFechaCorta(c.sent_at || c.created_at);
        var acciones = '';
        if (c.status === 'draft') {
            acciones += '<button class="cmfam-btn cmfam-btn-secondary cmfam-btn-sm" onclick="cmFamAbrirModalCircular(\'' + c.id + '\')">Editar</button> ';
            acciones += '<button class="cmfam-btn cmfam-btn-primary cmfam-btn-sm" onclick="cmFamEnviarBorrador(\'' + c.id + '\')">Enviar</button> ';
        } else if (c.status === 'sent') {
            acciones += '<button class="cmfam-btn cmfam-btn-secondary cmfam-btn-sm" onclick="cmFamVerCircular(\'' + c.id + '\')">Ver</button> ';
            if (c.channel === 'email' || c.channel === 'whatsapp') {
                acciones += '<button class="cmfam-btn cmfam-btn-primary cmfam-btn-sm" onclick="cmFamPrepararEnvio(\'' + c.id + '\')">Preparar envio</button> ';
            }
        }
        acciones += '<button class="cmfam-btn cmfam-btn-secondary cmfam-btn-sm" onclick="cmFamArchivarCircular(\'' + c.id + '\')">Anular</button>';
        filas += '<tr>' +
            '<td>' + cmFamEsc(c.title) + '</td>' +
            '<td>' + cmFamEsc(destino) + '</td>' +
            '<td>' + cmFamCanalLabel(c.channel) + '</td>' +
            '<td>' + cmFamEstadoCircularBadge(c.status) + '</td>' +
            '<td>' + (c.status === 'sent' ? numDest : '-') + '</td>' +
            '<td>' + fecha + '</td>' +
            '<td style="white-space:nowrap">' + acciones + '</td>' +
        '</tr>';
    });

    cont.innerHTML =
        '<div class="cmfam-table-wrap"><table class="cmfam-table">' +
            '<thead><tr><th>Titulo</th><th>Destinatario</th><th>Canal</th><th>Estado</th><th>Familias</th><th>Fecha</th><th></th></tr></thead>' +
            '<tbody>' + filas + '</tbody>' +
        '</table></div>';
}

// Etiqueta legible del canal de comunicacion.
function cmFamCanalLabel(ch) {
    var l = { in_app: 'In-app', email: 'Email', whatsapp: 'WhatsApp', manual: 'En mano' };
    return l[ch] || ch || '-';
}

// Badge de color segun el estado de la circular.
function cmFamEstadoCircularBadge(status) {
    if (status === 'sent') {
        return '<span class="cmfam-estado-badge" style="background:#1e4f2e;color:#86efac">Enviada</span>';
    }
    return '<span class="cmfam-estado-badge" style="background:#4f3a1e;color:#fbbf24">Borrador</span>';
}

// ---------- MODAL: NUEVA / EDITAR CIRCULAR ----------
// Sin id -> nueva. Con id -> edita un borrador existente.
function cmFamAbrirModalCircular(id) {
    var c = id ? cmFamCirculares.find(function(x) { return x.id === id; }) : null;

    var audSel = c ? (c.audience_type === 'team' ? c.audience_team_id : 'club') : 'club';
    var optsEquipo = '<option value="club"' + (audSel === 'club' ? ' selected' : '') + '>Todo el club</option>' +
        cmFamEquipos.map(function(t) {
            return '<option value="' + t.id + '"' + (audSel === t.id ? ' selected' : '') + '>' + cmFamEsc(t.name) + '</option>';
        }).join('');

    var canales = [['in_app', 'Notificacion in-app'], ['email', 'Email'], ['whatsapp', 'WhatsApp'], ['manual', 'Entrega en mano']];
    var canalActual = c ? c.channel : 'email';
    var optsCanal = canales.map(function(o) {
        return '<option value="' + o[0] + '"' + (canalActual === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.className = 'cmfam-modal-overlay';
    overlay.id = 'cmfam-modal-circular';
    overlay.onclick = function(e) { if (e.target === overlay) cmFamCerrarModalCircular(); };
    overlay.innerHTML =
        '<div class="cmfam-modal">' +
            '<div class="cmfam-modal-header">' +
                '<h3>' + (c ? 'Editar circular' : 'Nueva circular') + '</h3>' +
                '<button class="cmfam-modal-close" onclick="cmFamCerrarModalCircular()">✕</button>' +
            '</div>' +
            '<div class="cmfam-modal-body">' +
                '<input type="hidden" id="cmfam-circ-id" value="' + (c ? c.id : '') + '">' +
                '<div class="cmfam-form-group"><label>Titulo de la circular *</label>' +
                    '<input type="text" id="cmfam-circ-title" value="' + (c ? cmFamEsc(c.title) : '') + '" placeholder="Ej: Horario de entrenamientos de junio"></div>' +
                '<div class="cmfam-form-row">' +
                    '<div class="cmfam-form-group"><label>Destinatarios</label>' +
                        '<select id="cmfam-circ-audience">' + optsEquipo + '</select></div>' +
                    '<div class="cmfam-form-group"><label>Como se comunica</label>' +
                        '<select id="cmfam-circ-channel">' + optsCanal + '</select></div>' +
                '</div>' +
                '<div class="cmfam-form-group"><label>Mensaje</label>' +
                    '<textarea id="cmfam-circ-body" placeholder="Escribe aqui el comunicado para las familias...">' + (c && c.body ? cmFamEsc(c.body) : '') + '</textarea></div>' +
            '</div>' +
            '<div class="cmfam-modal-footer">' +
                '<button class="cmfam-btn cmfam-btn-secondary" onclick="cmFamCerrarModalCircular()">Cancelar</button>' +
                '<button class="cmfam-btn cmfam-btn-secondary" onclick="cmFamGuardarCircular(false)">Guardar borrador</button>' +
                '<button class="cmfam-btn cmfam-btn-primary" onclick="cmFamGuardarCircular(true)">Registrar envio</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);
}

function cmFamCerrarModalCircular() {
    var o = document.getElementById('cmfam-modal-circular');
    if (o) o.remove();
}

// Devuelve la lista de destinatarios (una familia por jugador del publico).
// Usa el contacto principal: primer tutor con email, o el primer tutor.
function cmFamDestinatariosDe(audienceType, teamId) {
    var jugadores = cmFamJugadores.filter(function(j) {
        if (audienceType === 'team') return j.teamId === teamId;
        return true;
    });
    return jugadores.map(function(j) {
        var tutorConEmail = j.tutores.find(function(t) { return t.email; });
        var tutor = tutorConEmail || j.tutores[0] || null;
        return {
            playerId: j.id,
            name: tutor ? tutor.nombre : ('Familia de ' + j.name),
            email: tutor ? (tutor.email || null) : null
        };
    });
}

// Guarda la circular. Sin id -> crea; con id -> actualiza un borrador.
// enviar=false -> borrador; enviar=true -> registra el envio.
async function cmFamGuardarCircular(enviar) {
    var id      = document.getElementById('cmfam-circ-id').value;
    var title   = document.getElementById('cmfam-circ-title').value.trim();
    var body    = document.getElementById('cmfam-circ-body').value.trim();
    var aud     = document.getElementById('cmfam-circ-audience').value;
    var channel = document.getElementById('cmfam-circ-channel').value;

    if (!title) { showToast('El titulo es obligatorio', 'error'); return; }

    var audienceType   = (aud === 'club') ? 'club' : 'team';
    var audienceTeamId = (aud === 'club') ? null : aud;
    var ahora = new Date().toISOString();

    var datos = {
        title: title, body: body || null,
        audience_type: audienceType, audience_team_id: audienceTeamId,
        channel: channel,
        status: enviar ? 'sent' : 'draft',
        sent_at: enviar ? ahora : null,
        updated_at: ahora
    };

    var messageId;
    if (id) {
        // Edicion de un borrador existente
        var resU = await supabaseClient.from('cm_comm_messages').update(datos).eq('id', id);
        if (resU.error) { showToast('Error al guardar: ' + resU.error.message, 'error'); return; }
        messageId = id;
    } else {
        // Nueva circular
        datos.club_id = clubId;
        datos.message_type = 'circular';
        datos.created_by = (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.id : null;
        var resI = await supabaseClient.from('cm_comm_messages').insert(datos).select().single();
        if (resI.error) { showToast('Error al guardar: ' + resI.error.message, 'error'); return; }
        messageId = resI.data.id;
    }

    if (enviar) {
        var dest = cmFamDestinatariosDe(audienceType, audienceTeamId);
        if (dest.length > 0) {
            var filas = dest.map(function(d) {
                return {
                    club_id: clubId, message_id: messageId, player_id: d.playerId,
                    recipient_name: d.name, recipient_email: d.email,
                    channel: channel, delivery_status: 'pending'
                };
            });
            var resR = await supabaseClient.from('cm_comm_recipients').insert(filas);
            if (resR.error) { showToast('Circular creada, pero error al generar destinatarios: ' + resR.error.message, 'error'); }
        }
        showToast('Circular registrada (' + dest.length + ' familias)');
    } else {
        showToast('Borrador guardado');
    }

    cmFamCerrarModalCircular();
    cmFamCargarCirculares();
}

// Envia una circular que estaba en estado borrador.
async function cmFamEnviarBorrador(id) {
    var c = cmFamCirculares.find(function(x) { return x.id === id; });
    if (!c) { showToast('Circular no encontrada', 'error'); return; }

    var dest = cmFamDestinatariosDe(c.audience_type, c.audience_team_id);
    if (dest.length > 0) {
        var filas = dest.map(function(d) {
            return {
                club_id: clubId, message_id: c.id, player_id: d.playerId,
                recipient_name: d.name, recipient_email: d.email,
                channel: c.channel, delivery_status: 'pending'
            };
        });
        var resR = await supabaseClient.from('cm_comm_recipients').insert(filas);
        if (resR.error) { showToast('Error al generar destinatarios: ' + resR.error.message, 'error'); return; }
    }

    var ahora = new Date().toISOString();
    var resU = await supabaseClient.from('cm_comm_messages')
        .update({ status: 'sent', sent_at: ahora, updated_at: ahora }).eq('id', id);
    if (resU.error) { showToast('Error al enviar: ' + resU.error.message, 'error'); return; }

    showToast('Circular enviada (' + dest.length + ' familias)');
    cmFamCargarCirculares();
}

// Envio asistido: WhatsApp copia el texto; Email abre un modal con los
// datos listos para copiar (funciona con cualquier correo: Gmail, Outlook...).
async function cmFamPrepararEnvio(id) {
    var c = cmFamCirculares.find(function(x) { return x.id === id; });
    if (!c) { showToast('Circular no encontrada', 'error'); return; }

    if (c.channel === 'whatsapp') {
        var texto = c.title + '\n\n' + (c.body || '');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(
                function() { showToast('Mensaje copiado - pegalo en tu difusion de WhatsApp'); },
                function() { showToast('No se pudo copiar al portapapeles', 'error'); }
            );
        } else {
            showToast('Tu navegador no permite copiar automaticamente', 'error');
        }
        return;
    }

    if (c.channel === 'email') {
        var res = await supabaseClient.from('cm_comm_recipients')
            .select('recipient_email').eq('message_id', id);
        if (res.error) { showToast('Error al cargar destinatarios: ' + res.error.message, 'error'); return; }
        var emails = [];
        (res.data || []).forEach(function(r) {
            if (r.recipient_email && emails.indexOf(r.recipient_email) === -1) emails.push(r.recipient_email);
        });
        if (emails.length === 0) { showToast('No hay emails entre los destinatarios', 'error'); return; }
        cmFamModalEnvioEmail(c, emails);
        return;
    }

    showToast('Esta circular no tiene envio asistido (canal in-app o entrega en mano)', 'error');
}

// Modal con los datos del envio por email listos para copiar.
function cmFamModalEnvioEmail(c, emails) {
    var overlay = document.createElement('div');
    overlay.className = 'cmfam-modal-overlay';
    overlay.id = 'cmfam-modal-envio';
    overlay.onclick = function(e) { if (e.target === overlay) cmFamCerrarModalEnvio(); };
    overlay.innerHTML =
        '<div class="cmfam-modal">' +
            '<div class="cmfam-modal-header">' +
                '<h3>Preparar envio por email</h3>' +
                '<button class="cmfam-modal-close" onclick="cmFamCerrarModalEnvio()">✕</button>' +
            '</div>' +
            '<div class="cmfam-modal-body">' +
                '<p style="color:#94a3b8;font-size:12px;margin:0 0 16px;line-height:1.5">' +
                    'Copia cada parte y pegala en tu correo (Gmail, Outlook...). ' +
                    'Pon los destinatarios en el campo <strong>CCO</strong> para que las familias no vean las direcciones de las demas.</p>' +
                '<div class="cmfam-form-group">' +
                    '<label>Destinatarios - para el campo CCO (' + emails.length + ')</label>' +
                    '<textarea id="cmfam-envio-emails" readonly style="min-height:60px">' + cmFamEsc(emails.join('; ')) + '</textarea>' +
                    '<button class="cmfam-btn cmfam-btn-secondary cmfam-btn-sm" style="margin-top:6px" onclick="cmFamCopiarCampo(\'cmfam-envio-emails\',\'Emails\')">Copiar emails</button>' +
                '</div>' +
                '<div class="cmfam-form-group">' +
                    '<label>Asunto</label>' +
                    '<input type="text" id="cmfam-envio-subject" readonly value="' + cmFamEsc(c.title) + '">' +
                    '<button class="cmfam-btn cmfam-btn-secondary cmfam-btn-sm" style="margin-top:6px" onclick="cmFamCopiarCampo(\'cmfam-envio-subject\',\'Asunto\')">Copiar asunto</button>' +
                '</div>' +
                '<div class="cmfam-form-group">' +
                    '<label>Mensaje</label>' +
                    '<textarea id="cmfam-envio-body" readonly>' + cmFamEsc(c.body || '') + '</textarea>' +
                    '<button class="cmfam-btn cmfam-btn-secondary cmfam-btn-sm" style="margin-top:6px" onclick="cmFamCopiarCampo(\'cmfam-envio-body\',\'Mensaje\')">Copiar mensaje</button>' +
                '</div>' +
            '</div>' +
            '<div class="cmfam-modal-footer">' +
                '<button class="cmfam-btn cmfam-btn-primary" onclick="cmFamCerrarModalEnvio()">Cerrar</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);
}

function cmFamCerrarModalEnvio() {
    var o = document.getElementById('cmfam-modal-envio');
    if (o) o.remove();
}

// Copia al portapapeles el contenido de un campo del modal de envio.
function cmFamCopiarCampo(elId, etiqueta) {
    var el = document.getElementById(elId);
    if (!el) return;
    var texto = (el.value !== undefined && el.value !== null) ? el.value : el.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(
            function() { showToast((etiqueta || 'Texto') + ' copiado al portapapeles'); },
            function() { showToast('No se pudo copiar', 'error'); }
        );
    } else {
        showToast('Tu navegador no permite copiar automaticamente', 'error');
    }
}

// Anula una circular (la archiva: los datos se conservan en la BD).
async function cmFamArchivarCircular(id) {
    var res = await supabaseClient.from('cm_comm_messages')
        .update({ archived: true, archived_at: new Date().toISOString() }).eq('id', id);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
    showToast('Circular anulada');
    cmFamCargarCirculares();
}


// ---------- DETALLE DE CIRCULAR + ACUSE MANUAL ----------
// Abre el detalle de una circular enviada con su lista de destinatarios.
async function cmFamVerCircular(id) {
    var c = cmFamCirculares.find(function(x) { return x.id === id; });
    if (!c) { showToast('Circular no encontrada', 'error'); return; }

    var res = await supabaseClient.from('cm_comm_recipients')
        .select('*').eq('message_id', id).order('recipient_name');
    if (res.error) { showToast('Error al cargar destinatarios: ' + res.error.message, 'error'); return; }

    cmFamDetalleCirc = c;
    cmFamDetalleRecipients = res.data || [];
    cmFamAbrirDetalleCircular();
}

// Construye el modal de detalle de la circular.
function cmFamAbrirDetalleCircular() {
    var c = cmFamDetalleCirc;
    if (!c) return;

    var teamNames = {};
    cmFamEquipos.forEach(function(t) { teamNames[t.id] = t.name; });
    var destino = (c.audience_type === 'team') ? (teamNames[c.audience_team_id] || 'Equipo') : 'Todo el club';

    var overlay = document.createElement('div');
    overlay.className = 'cmfam-modal-overlay';
    overlay.id = 'cmfam-modal-detalle';
    overlay.onclick = function(e) { if (e.target === overlay) cmFamCerrarDetalleCircular(); };
    overlay.innerHTML =
        '<div class="cmfam-modal" style="max-width:620px">' +
            '<div class="cmfam-modal-header">' +
                '<h3>' + cmFamEsc(c.title) + '</h3>' +
                '<button class="cmfam-modal-close" onclick="cmFamCerrarDetalleCircular()">✕</button>' +
            '</div>' +
            '<div class="cmfam-modal-body">' +
                '<div style="color:#94a3b8;font-size:12px;margin-bottom:10px">' +
                    cmFamCanalLabel(c.channel) + ' &middot; ' + cmFamEsc(destino) +
                    ' &middot; ' + cmFamFechaCorta(c.sent_at || c.created_at) +
                '</div>' +
                (c.body
                    ? '<div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px;' +
                      'color:#e2e8f0;font-size:13px;white-space:pre-wrap;margin-bottom:16px">' + cmFamEsc(c.body) + '</div>'
                    : '') +
                '<div id="cmfam-detalle-lista"></div>' +
            '</div>' +
            '<div class="cmfam-modal-footer">' +
                '<button class="cmfam-btn cmfam-btn-primary" onclick="cmFamCerrarDetalleCircular()">Cerrar</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(overlay);
    cmFamRenderDetalleLista();
}

// Pinta la lista de destinatarios con su acuse (se re-pinta al marcar/desmarcar).
function cmFamRenderDetalleLista() {
    var cont = document.getElementById('cmfam-detalle-lista');
    if (!cont) return;

    var recs = cmFamDetalleRecipients;
    var jugById = {};
    cmFamJugadores.forEach(function(j) { jugById[j.id] = j; });

    var confirmadas = recs.filter(function(r) { return r.delivery_status === 'confirmed'; }).length;

    var html = '<div style="color:#e2e8f0;font-size:13px;font-weight:600;margin-bottom:10px">' +
        'Acuse: <span style="color:#22c55e">' + confirmadas + '</span> de ' + recs.length + ' familias confirmadas</div>';

    if (recs.length === 0) {
        html += '<div class="cmfam-sin-datos">Esta circular no tiene destinatarios.</div>';
        cont.innerHTML = html;
        return;
    }

    html += '<div class="cmfam-table-wrap"><table class="cmfam-table">' +
        '<thead><tr><th>Familia</th><th>Jugador</th><th>Acuse</th><th></th></tr></thead><tbody>';
    recs.forEach(function(r) {
        var jug = jugById[r.player_id];
        var jugName = jug ? jug.name : '-';
        var confirmada = (r.delivery_status === 'confirmed');
        var estado = confirmada
            ? '<span class="cmfam-estado-badge" style="background:#1e4f2e;color:#86efac">Confirmada</span>'
            : '<span class="cmfam-estado-badge" style="background:#334155;color:#94a3b8">Pendiente</span>';
        var btn = confirmada
            ? '<button class="cmfam-btn cmfam-btn-secondary cmfam-btn-sm" onclick="cmFamToggleAcuse(\'' + r.id + '\',false)">Desmarcar</button>'
            : '<button class="cmfam-btn cmfam-btn-primary cmfam-btn-sm" onclick="cmFamToggleAcuse(\'' + r.id + '\',true)">Marcar confirmada</button>';
        html += '<tr>' +
            '<td>' + cmFamEsc(r.recipient_name || '-') + '</td>' +
            '<td>' + cmFamEsc(jugName) + '</td>' +
            '<td>' + estado + '</td>' +
            '<td>' + btn + '</td>' +
        '</tr>';
    });
    html += '</tbody></table></div>';
    cont.innerHTML = html;
}

// Marca (confirmar=true) o desmarca el acuse de un destinatario.
async function cmFamToggleAcuse(recipientId, confirmar) {
    var upd = confirmar
        ? { delivery_status: 'confirmed', confirmed_at: new Date().toISOString() }
        : { delivery_status: 'pending', confirmed_at: null };

    var res = await supabaseClient.from('cm_comm_recipients').update(upd).eq('id', recipientId);
    if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }

    var r = cmFamDetalleRecipients.find(function(x) { return x.id === recipientId; });
    if (r) { r.delivery_status = upd.delivery_status; r.confirmed_at = upd.confirmed_at; }
    cmFamRenderDetalleLista();
}

function cmFamCerrarDetalleCircular() {
    var o = document.getElementById('cmfam-modal-detalle');
    if (o) o.remove();
}


// ========== AUTO-MONTAJE ==========
(function cmFamAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 40) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (typeof cmPuedeVer !== 'function' || !cmPuedeVer('comunicacion_familias')) return;
        if (document.getElementById('cm-tab-familias')) { clearInterval(intervalo); return; }
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;

        clearInterval(intervalo);

        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-familias';
        tab.setAttribute('onclick', "cambiarModulo('familias', this)");
        tab.innerHTML = '<span class="tab-icon">📣</span><span>Familias</span>';
        mainTabs.appendChild(tab);

        if (!document.getElementById('modulo-familias')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-familias';
            var ultModulo = document.querySelector('.vista-modulo:last-of-type');
            if (ultModulo && ultModulo.parentElement) {
                ultModulo.parentElement.insertBefore(vista, ultModulo.nextSibling);
            } else {
                document.body.appendChild(vista);
            }
        }

        if (typeof registrarModulo === 'function') {
            registrarModulo('familias', function() { cmFamInit('modulo-familias'); });
        }

        var pd = document.getElementById('cm-pantalla-desarrollo');
        if (pd) {
            pd.style.display = 'none';
            var mt = document.querySelector('.main-tabs');
            if (mt) mt.style.display = '';
            document.querySelectorAll('.vista-modulo').forEach(function(v) { v.style.display = ''; });
        }

        var tv = Array.from(document.querySelectorAll('.main-tab')).filter(function(t) { return t.style.display !== 'none'; });
        if (tv.length === 1 && tv[0].id === 'cm-tab-familias') { cambiarModulo('familias', tab); }

        console.log('[Modulo Familias] Auto-montado y registrado');
    }, 300);
})();