// ========== ANALISTA-RIVALES.JS - TopLiderCoach HUB ==========
// Dossier de analisis de rivales: un dossier por equipo rival con
// scouting, jugadores (plantilla rival compartida), partidos observados,
// fases del juego y ABPs. Con exportacion a PDF para el entrenador.

var AR_LINEAS = [
    { label: 'Porteros',          color: '#22c55e', poss: ['Portero'] },
    { label: 'Linea defensiva',   color: '#3b82f6', poss: ['Lateral Dcho.','Lateral Izdo.','Central','Central Dcho.','Central Izdo.','LT Dcho.','LT Izdo.'] },
    { label: 'Linea medio campo', color: '#f59e0b', poss: ['Mediocentro','MCD','MCO','Mediapunta','Interior'] },
    { label: 'Linea delanteros',  color: '#ef4444', poss: ['Ext Dcho.','Ext Izdo.','Delantero','2º Punta'] }
];

var AR_FASES_DEFAULT = [
    { id: 'fo_saque',      title: 'Fase ofensiva: saque de portero' },
    { id: 'fo_posicional', title: 'Fase ofensiva: ataque posicional' },
    { id: 'tad',           title: 'Transicion ataque - defensa' },
    { id: 'fd_saque',      title: 'Fase defensiva: saque de portero rival' },
    { id: 'fd_posicional', title: 'Fase defensiva: defensa posicional' },
    { id: 'tda',           title: 'Transicion defensa - ataque' }
];

var AR_ABP_ACCIONES = ['Corner','Falta lateral','Falta frontal','Saque de banda','Penalti','Otro'];

var AR_FORMACIONES = ['1-4-3-3','1-4-4-2','1-4-2-3-1','1-4-1-4-1','1-4-5-1','1-4-4-1-1','1-4-3-1-2','1-4-2-2-2','1-4-3-2-1','1-4-2-4','1-3-5-2','1-3-4-3','1-3-4-2-1','1-3-4-1-2','1-3-2-4-1','1-3-1-4-2','1-5-3-2','1-5-4-1'];

var arEquipos = [];
var arEquipoSel = null;
var arDossier = null;
var arJugadores = [];
var arSeccion = 'scouting';
var arPartidoEditIdx = -1;
var arAbpEditIdx = -1;

(function() {
    if (document.getElementById('ar-styles')) return;
    var st = document.createElement('style');
    st.id = 'ar-styles';
    st.textContent = ''
        + '#analisisrival-root { background:#0f172a; border-radius:12px; padding:20px; min-height:400px; }'
        + '.ar-cab { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:14px; }'
        + '.ar-titulo { color:#e2e8f0; font-size:17px; font-weight:700; margin:0; }'
        + '.ar-sel-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }'
        + '.ar-sel-row select { padding:9px 12px; background:#1e293b; border:1px solid #334155; color:#e2e8f0; border-radius:8px; font-size:13px; min-width:220px; }'
        + '.ar-btn { background:#3b82f6; border:none; color:#fff; border-radius:8px; padding:9px 14px; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }'
        + '.ar-btn.morado { background:#7c3aed; }'
        + '.ar-btn.verde { background:#16a34a; }'
        + '.ar-btn.gris { background:#334155; color:#cbd5e1; font-weight:400; }'
        + '.ar-btn.rojo { background:#7f1d1d; color:#fca5a5; }'
        + '.ar-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }'
        + '.ar-tab { background:#1e293b; border:1px solid #334155; color:#94a3b8; border-radius:8px; padding:8px 14px; font-size:13px; cursor:pointer; }'
        + '.ar-tab.activa { background:#1e3a5f; border-color:#3b82f6; color:#e2e8f0; font-weight:600; }'
        + '.ar-panel { background:#1e293b; border:1px solid #334155; border-radius:10px; padding:18px; }'
        + '.ar-panel h4 { margin:0 0 12px; color:#e2e8f0; font-size:14px; }'
        + '.ar-campo { margin-bottom:12px; }'
        + '.ar-campo label { display:block; font-size:11px; color:#9ca3af; margin-bottom:4px; }'
        + '.ar-campo input, .ar-campo textarea, .ar-campo select { width:100%; padding:9px 11px; background:#0f172a; border:1px solid #334155; color:#e2e8f0; border-radius:7px; font-size:13px; font-family:inherit; box-sizing:border-box; }'
        + '.ar-campo textarea { min-height:70px; resize:vertical; }'
        + '.ar-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }'
        + '.ar-vacio { color:#475569; font-size:12px; text-align:center; padding:14px; background:#0f172a; border-radius:8px; }'
        + '.ar-item { background:#0f172a; border:1px solid #1e3a5f; border-radius:8px; padding:10px 14px; margin-bottom:8px; }'
        + '.ar-item-cab { display:flex; justify-content:space-between; align-items:center; gap:8px; }'
        + '.ar-item-tit { color:#e2e8f0; font-size:13px; font-weight:600; }'
        + '.ar-item-meta { color:#64748b; font-size:11px; margin-top:2px; }'
        + '.ar-item-desc { color:#94a3b8; font-size:12px; margin-top:6px; white-space:pre-wrap; }'
        + '.ar-item .acc { display:flex; gap:4px; flex-shrink:0; }'
        + '.ar-item .acc button { background:none; border:none; cursor:pointer; font-size:13px; padding:3px 5px; border-radius:5px; }'
        + '.ar-item .acc button:hover { background:#1e293b; }'
        + '.ar-badge { display:inline-block; font-size:10px; padding:2px 8px; border-radius:5px; font-weight:700; margin-right:6px; }'
        + '.ar-link { color:#60a5fa; font-size:12px; text-decoration:none; }'
        + '.ar-linea-cab { display:flex; align-items:center; gap:8px; margin:14px 0 6px; }'
        + '.ar-linea-cab .barra { width:4px; height:16px; border-radius:2px; }'
        + '.ar-linea-cab .lbl { font-size:12px; font-weight:700; text-transform:uppercase; }'
        + '.ar-jug { display:flex; align-items:center; gap:10px; background:#0f172a; border:1px solid #1e3a5f; border-radius:8px; padding:7px 12px; margin-bottom:5px; }'
        + '.ar-jug .dorsal { width:26px; height:26px; border-radius:50%; background:#334155; color:#facc15; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }'
        + '.ar-jug .nombre { color:#e2e8f0; font-size:13px; font-weight:600; flex:1; }'
        + '.ar-jug .pos { color:#64748b; font-size:11px; }'
        + '.ar-form { background:#0f172a; border:1px solid #3b82f6; border-radius:10px; padding:14px; margin-bottom:14px; }'
        + '.ar-form-btns { display:flex; gap:8px; justify-content:flex-end; margin-top:4px; }'
        + '.ar-guardado { font-size:11px; color:#64748b; }'
        + '.ar-campo-fut { position:relative; width:min(340px,100%); aspect-ratio:2/3; margin:12px auto 0; background:linear-gradient(180deg,#2f7a35,#256b2b); border:2px solid rgba(255,255,255,.55); border-radius:10px; }'
        + '.ar-slot { position:absolute; transform:translate(-50%,-50%); text-align:center; cursor:pointer; }'
        + '.ar-slot-vacio { width:32px; height:32px; background:rgba(255,255,255,0.12); border:2px dashed rgba(255,255,255,0.4); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:17px; font-weight:700; color:rgba(255,255,255,0.5); margin:0 auto; }'
        + '.ar-slot:hover .ar-slot-vacio { border-color:rgba(255,255,255,0.8); background:rgba(255,255,255,0.22); }'
        + '.ar-chip-dorsal { width:30px; height:30px; border-radius:50%; background:#dc2626; border:2px solid #fff; color:#fff; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; margin:0 auto; box-shadow:0 2px 6px rgba(0,0,0,.35); }'
        + '.ar-chip-nombre { font-size:9px; color:#fff; text-shadow:0 1px 2px rgba(0,0,0,.85); font-weight:700; max-width:58px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin:1px auto 3px; }'
        + '@media (max-width: 700px) { .ar-grid-2 { grid-template-columns:1fr; } }';
    document.head.appendChild(st);
})();

registrarSubTab('matchstats', 'analisisrival', function() {
    arCargar();
});

function arEsc(t) {
    var d = document.createElement('div');
    d.textContent = t || '';
    return d.innerHTML;
}

// ---------- Carga ----------
async function arCargar() {
    var root = document.getElementById('analisisrival-root');
    if (!root) return;
    root.innerHTML = '<div class="ar-vacio">Cargando análisis de rivales...</div>';
    try {
        var cId = window.clubId || clubId;
        var res = await supabaseClient
            .from('equipos_rivales')
            .select('id, nombre')
            .eq('club_id', cId)
            .order('nombre');
        if (res.error) throw res.error;
        arEquipos = res.data || [];

        if (arEquipoSel && !arEquipos.some(function(e) { return e.id === arEquipoSel; })) arEquipoSel = null;
        if (!arEquipoSel && arEquipos.length > 0) arEquipoSel = arEquipos[0].id;

        if (arEquipoSel) {
            await arCargarDossier();
        } else {
            arDossier = null;
            arJugadores = [];
        }
        arRender();
    } catch (e) {
        console.error('Error cargando analisis rivales:', e);
        root.innerHTML = '<div class="ar-vacio">Error al cargar: ' + e.message + '</div>';
    }
}

async function arCargarDossier() {
    var cId = window.clubId || clubId;
    // Dossier (si no existe, se crea vacio)
    var res = await supabaseClient
        .from('analista_dossiers')
        .select('*')
        .eq('club_id', cId)
        .eq('equipo_rival_id', arEquipoSel)
        .maybeSingle();
    if (res.error) throw res.error;
    if (res.data) {
        arDossier = res.data;
    } else {
        var ins = await supabaseClient
            .from('analista_dossiers')
            .insert({ club_id: cId, equipo_rival_id: arEquipoSel, scouting: {}, fases: [], abps: [], partidos: [] })
            .select('*')
            .single();
        if (ins.error) throw ins.error;
        arDossier = ins.data;
    }
    if (!arDossier.scouting) arDossier.scouting = {};
    if (!arDossier.fases || !arDossier.fases.length) {
        arDossier.fases = AR_FASES_DEFAULT.map(function(f) { return { id: f.id, title: f.title, notes: '', video_url: '' }; });
    }
    if (!arDossier.abps) arDossier.abps = [];
    if (!arDossier.partidos) arDossier.partidos = [];

    // Jugadores de la plantilla rival compartida
    var rj = await supabaseClient
        .from('jugadores_rivales')
        .select('*')
        .eq('equipo_rival_id', arEquipoSel)
        .order('dorsal');
    arJugadores = rj.data || [];
}

async function arSeleccionarEquipo(id) {
    arEquipoSel = id;
    arPartidoEditIdx = -1;
    arAbpEditIdx = -1;
    var root = document.getElementById('analisisrival-root');
    if (root) root.innerHTML = '<div class="ar-vacio">Cargando dossier...</div>';
    try {
        await arCargarDossier();
        arRender();
    } catch (e) {
        if (root) root.innerHTML = '<div class="ar-vacio">Error: ' + e.message + '</div>';
    }
}

async function arGuardarDossier(campos) {
    campos.updated_at = new Date().toISOString();
    var res = await supabaseClient
        .from('analista_dossiers')
        .update(campos)
        .eq('id', arDossier.id);
    if (res.error) { showToast('Error al guardar: ' + res.error.message); return false; }
    Object.keys(campos).forEach(function(k) { arDossier[k] = campos[k]; });
    return true;
}

// ---------- Render principal ----------
function arRender() {
    var root = document.getElementById('analisisrival-root');
    if (!root) return;

    var opciones = '';
    arEquipos.forEach(function(e) {
        opciones += '<option value="' + e.id + '"' + (e.id === arEquipoSel ? ' selected' : '') + '>' + arEsc(e.nombre) + '</option>';
    });

    var cab = '<div class="ar-cab">'
        + '<h3 class="ar-titulo">🔍 Análisis de Rivales</h3>'
        + '<div class="ar-sel-row">'
        + '<select onchange="arSeleccionarEquipo(this.value)">' + (opciones || '<option value="">Sin equipos rivales</option>') + '</select>'
        + '<button class="ar-btn morado" onclick="arDossierPDF()">📄 PDF del dossier</button>'
        + '</div></div>';

    if (arEquipos.length === 0) {
        root.innerHTML = cab + '<div class="ar-vacio" style="padding:30px">Primero crea tus equipos rivales en la pestaña <strong>🛡️ Rivales</strong>. Después vuelve aquí para hacer sus dossiers.</div>';
        return;
    }

    var actualizado = '';
    if (arDossier && arDossier.updated_at) {
        actualizado = '<div class="ar-guardado" style="margin-bottom:12px">Última actualización del dossier: ' + new Date(arDossier.updated_at).toLocaleString('es-ES') + '</div>';
    }

    var tabs = [
        { key: 'scouting',  label: '🔎 Scouting' },
        { key: 'jugadores', label: '👥 Jugadores (' + arJugadores.length + ')' },
        { key: 'partidos',  label: '📅 Partidos observados (' + arDossier.partidos.length + ')' },
        { key: 'fases',     label: '⚙️ Fases del juego' },
        { key: 'abps',      label: '🎯 ABPs (' + arDossier.abps.length + ')' }
    ];
    var tabsHtml = '<div class="ar-tabs">';
    tabs.forEach(function(t) {
        tabsHtml += '<button class="ar-tab' + (arSeccion === t.key ? ' activa' : '') + '" onclick="arIrSeccion(\'' + t.key + '\')">' + t.label + '</button>';
    });
    tabsHtml += '</div>';

    var cuerpo = '';
    if (arSeccion === 'scouting') cuerpo = arRenderScouting();
    else if (arSeccion === 'jugadores') cuerpo = arRenderJugadores();
    else if (arSeccion === 'partidos') cuerpo = arRenderPartidos();
    else if (arSeccion === 'fases') cuerpo = arRenderFases();
    else if (arSeccion === 'abps') cuerpo = arRenderAbps();

    root.innerHTML = cab + actualizado + tabsHtml + cuerpo;
}

function arIrSeccion(s) {
    arSeccion = s;
    arPartidoEditIdx = -1;
    arAbpEditIdx = -1;
    arRender();
}

// ---------- Seccion: Scouting (con campo de alineacion por sistema) ----------
function arRenderScouting() {
    var s = arDossier.scouting || {};
    var opcForm = '<option value="">-- Elegir --</option>';
    AR_FORMACIONES.forEach(function(f) {
        opcForm += '<option value="' + f + '"' + (s.sistema === f ? ' selected' : '') + '>' + f + '</option>';
    });
    var h = '<div class="ar-panel">'
        + '<h4>Informe de scouting del rival</h4>'
        + '<div class="ar-grid-2">'
        + '<div class="ar-campo"><label>Formación habitual</label><select id="ar-sc-sistema" onchange="arCambiarFormacion(this.value)">' + opcForm + '</select></div>'
        + '<div class="ar-campo"><label>Sistema alternativo</label><input type="text" id="ar-sc-sistema2" value="' + arEsc(s.sistema2 || '') + '" placeholder="Ej: 1-4-2-3-1 (si van perdiendo)"></div>'
        + '</div>'
        + '<div class="ar-campo"><label>Estilo de juego</label><textarea id="ar-sc-estilo" placeholder="Cómo juegan: salida de balón, presión, ritmo...">' + arEsc(s.estilo || '') + '</textarea></div>'
        + '<div class="ar-grid-2">'
        + '<div class="ar-campo"><label>Puntos fuertes</label><textarea id="ar-sc-fuertes" placeholder="Dónde hacen daño...">' + arEsc(s.fuertes || '') + '</textarea></div>'
        + '<div class="ar-campo"><label>Puntos débiles</label><textarea id="ar-sc-debiles" placeholder="Dónde podemos hacerles daño...">' + arEsc(s.debiles || '') + '</textarea></div>'
        + '</div>'
        + '<div class="ar-campo"><label>Jugadores clave</label><textarea id="ar-sc-clave" placeholder="Jugadores a vigilar y por qué...">' + arEsc(s.clave || '') + '</textarea></div>'
        + '<div class="ar-form-btns"><button class="ar-btn verde" onclick="arGuardarScouting()">💾 Guardar scouting</button></div>'
        + arRenderCampoAlineacion()
        + '</div>';
    return h;
}

async function arGuardarScouting() {
    var sPrev = arDossier.scouting || {};
    var s = {
        sistema:  document.getElementById('ar-sc-sistema').value,
        sistema2: document.getElementById('ar-sc-sistema2').value.trim(),
        estilo:   document.getElementById('ar-sc-estilo').value.trim(),
        fuertes:  document.getElementById('ar-sc-fuertes').value.trim(),
        debiles:  document.getElementById('ar-sc-debiles').value.trim(),
        clave:    document.getElementById('ar-sc-clave').value.trim(),
        alineacion: sPrev.alineacion || {}
    };
    if (await arGuardarDossier({ scouting: s })) showToast('Scouting guardado');
}

// --- Campo de alineacion ---
function arParseFormacion(f) {
    if (!f) return null;
    var partes = String(f).split('-').map(function(x) { return parseInt(x, 10); });
    if (partes.length < 3 || partes[0] !== 1) return null;
    return partes.slice(1); // lineas sin el portero: defensa primero
}

function arSlotsDe(f) {
    var lineas = arParseFormacion(f);
    if (!lineas) return [];
    var slots = [{ slotId: 'gk', x: 50, y: 90 }];
    var n = lineas.length;
    var yTop = 16, yBottom = 74;
    lineas.forEach(function(cuantos, li) {
        var y = n > 1 ? (yBottom - li * ((yBottom - yTop) / (n - 1))) : 45;
        for (var i = 0; i < cuantos; i++) {
            slots.push({ slotId: 'l' + li + '-' + i, x: Math.round((i + 1) / (cuantos + 1) * 100), y: Math.round(y) });
        }
    });
    return slots;
}

function arRenderCampoAlineacion() {
    var s = arDossier.scouting || {};
    if (!s.sistema) {
        return '<div class="ar-vacio" style="margin-top:14px">Elige la formación habitual para colocar a los jugadores en el campo.</div>';
    }
    var slots = arSlotsDe(s.sistema);
    if (!slots.length) return '';
    var alin = s.alineacion || {};
    var h = '<div style="margin-top:16px"><h4 style="margin:0 0 4px">Alineación rival — ' + arEsc(s.sistema) + '</h4>'
        + '<div class="ar-guardado" style="margin-bottom:4px">Haz clic en una posición para asignar jugadores. Puedes poner varios jugadores por posición. Se guarda solo.</div>'
        + '<div class="ar-campo-fut">'
        // lineas del campo
        + '<div style="position:absolute;left:0;right:0;top:50%;height:0;border-top:1.5px solid rgba(255,255,255,.5)"></div>'
        + '<div style="position:absolute;left:50%;top:50%;width:72px;height:72px;border:1.5px solid rgba(255,255,255,.5);border-radius:50%;transform:translate(-50%,-50%)"></div>'
        + '<div style="position:absolute;left:20%;top:0;width:60%;height:14%;border:1.5px solid rgba(255,255,255,.5);border-top:none"></div>'
        + '<div style="position:absolute;left:35%;top:0;width:30%;height:6%;border:1.5px solid rgba(255,255,255,.5);border-top:none"></div>'
        + '<div style="position:absolute;left:20%;bottom:0;width:60%;height:14%;border:1.5px solid rgba(255,255,255,.5);border-bottom:none"></div>'
        + '<div style="position:absolute;left:35%;bottom:0;width:30%;height:6%;border:1.5px solid rgba(255,255,255,.5);border-bottom:none"></div>';
    slots.forEach(function(sl) {
        var ids = alin[sl.slotId] || [];
        var contenido = '';
        if (ids.length === 0) {
            contenido = '<div class="ar-slot-vacio">+</div>';
        } else {
            ids.forEach(function(id) {
                var j = arJugadores.find(function(x) { return x.id === id; });
                if (!j) return;
                var apellido = (j.nombre || '').trim().split(' ').pop();
                contenido += '<div><div class="ar-chip-dorsal">' + arEsc(j.dorsal || '·') + '</div><div class="ar-chip-nombre">' + arEsc(apellido) + '</div></div>';
            });
            if (!contenido) contenido = '<div class="ar-slot-vacio">+</div>';
        }
        h += '<div class="ar-slot" style="left:' + sl.x + '%;top:' + sl.y + '%" onclick="arAbrirSelectorSlot(\'' + sl.slotId + '\')">' + contenido + '</div>';
    });
    h += '</div></div>';
    return h;
}

async function arCambiarFormacion(v) {
    var s = arDossier.scouting || {};
    s.sistema = v;
    s.alineacion = {};
    if (await arGuardarDossier({ scouting: s })) arRender();
}

function arAbrirSelectorSlot(slotId) {
    var s = arDossier.scouting || {};
    var alin = s.alineacion || {};
    var asignados = alin[slotId] || [];

    var prev = document.getElementById('ar-slot-ov');
    if (prev) prev.remove();
    var ov = document.createElement('div');
    ov.id = 'ar-slot-ov';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px;';
    ov.onclick = function(e) { if (e.target === ov) ov.remove(); };

    var hAsig = '';
    asignados.forEach(function(id) {
        var j = arJugadores.find(function(x) { return x.id === id; });
        if (!j) return;
        hAsig += '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:#1e3a5f;border:1px solid #3b82f6;border-radius:7px;padding:7px 10px;margin-bottom:5px">'
            + '<span style="color:#e2e8f0;font-size:13px;font-weight:600">' + arEsc((j.dorsal ? j.dorsal + '. ' : '') + j.nombre) + '</span>'
            + '<button onclick="arQuitarDeSlot(\'' + slotId + '\',\'' + id + '\')" style="background:none;border:none;color:#f87171;cursor:pointer;font-size:14px">✕</button>'
            + '</div>';
    });

    var hLista = '';
    var disponibles = arJugadores.filter(function(j) { return asignados.indexOf(j.id) === -1; });
    if (disponibles.length === 0) {
        hLista = '<div style="color:#64748b;font-size:12px;text-align:center;padding:8px">No quedan jugadores por asignar en esta posición.</div>';
    } else {
        disponibles.forEach(function(j) {
            hLista += '<button onclick="arAsignarSlot(\'' + slotId + '\',\'' + j.id + '\')" style="display:block;width:100%;text-align:left;padding:8px 12px;margin-bottom:5px;background:#1e293b;border:1px solid #334155;color:#e2e8f0;border-radius:7px;cursor:pointer;font-size:13px">'
                + arEsc((j.dorsal ? j.dorsal + '. ' : '') + j.nombre) + (j.posicion ? ' <span style="color:#64748b;font-size:11px">(' + arEsc(j.posicion) + ')</span>' : '')
                + '</button>';
        });
    }

    ov.innerHTML = '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;max-width:380px;width:100%;max-height:80vh;overflow-y:auto;padding:20px">'
        + '<div style="color:#e2e8f0;font-size:15px;font-weight:700;margin-bottom:12px">Asignar jugadores a la posición</div>'
        + (hAsig ? '<div style="margin-bottom:10px"><div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:5px">En esta posición</div>' + hAsig + '</div>' : '')
        + '<div style="font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:5px">Añadir jugador</div>'
        + hLista
        + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">'
        + (asignados.length ? '<button class="ar-btn rojo" onclick="arVaciarSlot(\'' + slotId + '\')">Vaciar posición</button>' : '')
        + '<button class="ar-btn gris" onclick="document.getElementById(\'ar-slot-ov\').remove()">Cerrar</button>'
        + '</div></div>';
    document.body.appendChild(ov);
}

async function arGuardarAlineacion() {
    var s = arDossier.scouting || {};
    var ok = await arGuardarDossier({ scouting: s });
    if (ok) {
        var ov = document.getElementById('ar-slot-ov');
        if (ov) ov.remove();
        arRender();
    }
}

function arAsignarSlot(slotId, jugadorId) {
    var s = arDossier.scouting || {};
    if (!s.alineacion) s.alineacion = {};
    if (!s.alineacion[slotId]) s.alineacion[slotId] = [];
    if (s.alineacion[slotId].indexOf(jugadorId) === -1) s.alineacion[slotId].push(jugadorId);
    arGuardarAlineacion();
}

function arQuitarDeSlot(slotId, jugadorId) {
    var s = arDossier.scouting || {};
    if (!s.alineacion || !s.alineacion[slotId]) return;
    s.alineacion[slotId] = s.alineacion[slotId].filter(function(x) { return x !== jugadorId; });
    arGuardarAlineacion();
}

function arVaciarSlot(slotId) {
    var s = arDossier.scouting || {};
    if (s.alineacion) s.alineacion[slotId] = [];
    arGuardarAlineacion();
}

// ---------- Seccion: Jugadores (plantilla rival compartida, fichas completas) ----------
function arRenderJugadores() {
    var h = '<div class="ar-panel">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">'
        + '<h4 style="margin:0">Plantilla del rival</h4>'
        + '<button class="ar-btn" onclick="arNuevoJugador()">+ Añadir jugador</button>'
        + '</div>'
        + '<div class="ar-guardado" style="margin-bottom:10px">Fichas compartidas con la pestaña Rivales: lo que edites aquí sirve también en la pizarra y el plan de partido.</div>';

    if (arJugadores.length === 0) {
        h += '<div class="ar-vacio">Este rival no tiene jugadores todavía. Pulsa "+ Añadir jugador".</div>';
    } else {
        var usados = {};
        AR_LINEAS.forEach(function(lin) {
            var jl = arJugadores.filter(function(j) { return j.posicion && lin.poss.indexOf(j.posicion) > -1; });
            jl.forEach(function(j) { usados[j.id] = true; });
            if (jl.length === 0) return;
            h += '<div class="ar-linea-cab"><div class="barra" style="background:' + lin.color + '"></div><span class="lbl" style="color:' + lin.color + '">' + lin.label + ' (' + jl.length + ')</span></div>';
            jl.forEach(function(j) { h += arJugadorCard(j); });
        });
        var sinPos = arJugadores.filter(function(j) { return !usados[j.id]; });
        if (sinPos.length > 0) {
            h += '<div class="ar-linea-cab"><div class="barra" style="background:#64748b"></div><span class="lbl" style="color:#94a3b8">Sin posición (' + sinPos.length + ')</span></div>';
            sinPos.forEach(function(j) { h += arJugadorCard(j); });
        }
    }
    return h + '</div>';
}

function arJugadorCard(j) {
    var avatar = j.foto_url
        ? '<div style="width:42px;height:42px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#334155"><img src="' + arEsc(j.foto_url) + '" style="width:100%;height:100%;object-fit:cover"></div>'
        : '<div style="width:42px;height:42px;border-radius:50%;background:#334155;color:#facc15;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">' + arEsc(j.dorsal || '–') + '</div>';
    var meta = [];
    if (j.dorsal && j.foto_url) meta.push('Nº ' + j.dorsal);
    if (j.posicion) meta.push(j.posicion);
    if (j.pie) meta.push(j.pie);
    if (j.anio) meta.push(j.anio);
    if (j.procede) meta.push('Procede: ' + j.procede);
    var stats = [];
    if (j.pj != null) stats.push('PJ ' + j.pj);
    if (j.minutos != null) stats.push('Min ' + j.minutos);
    if (j.goles != null) stats.push('Goles ' + j.goles);
    var statsHtml = '';
    stats.forEach(function(s) {
        statsHtml += '<span style="display:inline-block;background:#1e3a5f;color:#93c5fd;font-size:10px;font-weight:700;border-radius:5px;padding:2px 8px;margin-right:5px">' + s + '</span>';
    });
    var archivosHtml = '';
    (j.archivos || []).forEach(function(a) {
        archivosHtml += '<a class="ar-link" href="' + arEsc(a.url) + '" target="_blank" style="margin-right:10px">🎬 ' + arEsc(a.titulo || 'Vídeo') + '</a>';
    });
    return '<div class="ar-item" style="padding:12px 14px">'
        + '<div class="ar-item-cab"><div style="display:flex;align-items:center;gap:10px;min-width:0">'
        + avatar
        + '<div style="min-width:0"><div class="ar-item-tit">' + arEsc(j.nombre) + '</div>'
        + (meta.length ? '<div class="ar-item-meta">' + arEsc(meta.join(' · ')) + '</div>' : '')
        + '</div></div>'
        + '<span class="acc">'
        + '<button onclick="arEditarJugador(\'' + j.id + '\')" title="Editar ficha">✏️</button>'
        + '<button onclick="arBorrarJugadorRival(\'' + j.id + '\')" title="Borrar">🗑️</button>'
        + '</span></div>'
        + (statsHtml ? '<div style="margin-top:7px">' + statsHtml + '</div>' : '')
        + (j.analisis ? '<div class="ar-item-desc">' + arEsc(j.analisis) + '</div>' : '')
        + (archivosHtml ? '<div style="margin-top:6px">' + archivosHtml + '</div>' : '')
        + '</div>';
}

async function arRefrescarJugadores() {
    var rj = await supabaseClient
        .from('jugadores_rivales')
        .select('*')
        .eq('equipo_rival_id', arEquipoSel)
        .order('dorsal');
    arJugadores = rj.data || [];
    arRender();
}

function arNuevoJugador() {
    rvAbrirFichaJugador(arEquipoSel, null, arRefrescarJugadores);
}

function arEditarJugador(id) {
    var j = arJugadores.find(function(x) { return x.id === id; });
    if (!j) return;
    rvAbrirFichaJugador(arEquipoSel, j, arRefrescarJugadores);
}

function arBorrarJugadorRival(id) {
    var j = arJugadores.find(function(x) { return x.id === id; });
    if (!j) return;
    if (!confirm('¿Borrar a "' + (j.nombre || '') + '" de la plantilla rival?')) return;
    supabaseClient.from('jugadores_rivales').delete().eq('id', id).then(function(res) {
        if (res.error) { showToast('Error: ' + res.error.message); return; }
        showToast('Jugador borrado');
        arRefrescarJugadores();
    });
}

// ---------- Seccion: Partidos observados ----------
function arRenderPartidos() {
    var h = '<div class="ar-panel">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">'
        + '<h4 style="margin:0">Partidos observados del rival</h4>'
        + '<button class="ar-btn" onclick="arAbrirFormPartido(-1)">+ Añadir partido</button>'
        + '</div>'
        + '<div class="ar-guardado" style="margin-bottom:10px">Partidos del rival contra otros equipos que has visto o analizado. No aparecen en tu sección de Partidos.</div>'
        + '<div id="ar-partido-form-area">' + (arPartidoEditIdx > -2 && arPartidoEditIdx !== -1 ? '' : '') + '</div>';

    var lista = (arDossier.partidos || []).slice().sort(function(a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
    if (lista.length === 0) {
        h += '<div class="ar-vacio">Sin partidos observados todavía.</div>';
    } else {
        lista.forEach(function(p) {
            var idxReal = arDossier.partidos.indexOf(p);
            var fFmt = p.fecha ? new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-ES') : 'Sin fecha';
            var cond = p.condicion === 'visitante' ? 'Visitante' : 'Local';
            h += '<div class="ar-item"><div class="ar-item-cab"><div>'
                + '<div class="ar-item-tit">' + (p.resultado ? '<span style="color:#facc15">' + arEsc(p.resultado) + '</span> · ' : '') + 'vs ' + arEsc(p.contra || '?') + ' <span style="color:#64748b;font-weight:400">(' + cond + ')</span></div>'
                + '<div class="ar-item-meta">' + fFmt + (p.competicion ? ' · ' + arEsc(p.competicion) : '') + '</div>'
                + '</div><span class="acc">'
                + (p.video_url ? '<a class="ar-link" href="' + arEsc(p.video_url) + '" target="_blank" title="Ver vídeo">🎬</a>' : '')
                + '<button onclick="arAbrirFormPartido(' + idxReal + ')" title="Editar">✏️</button>'
                + '<button onclick="arBorrarPartido(' + idxReal + ')" title="Borrar">🗑️</button>'
                + '</span></div>'
                + (p.notas ? '<div class="ar-item-desc">' + arEsc(p.notas) + '</div>' : '')
                + '</div>';
        });
    }
    return h + '</div>';
}

function arAbrirFormPartido(idx) {
    arPartidoEditIdx = idx;
    var p = idx >= 0 ? arDossier.partidos[idx] : { fecha: '', contra: '', condicion: 'local', resultado: '', competicion: '', video_url: '', notas: '' };
    var area = document.getElementById('ar-partido-form-area');
    if (!area) return;
    area.innerHTML = '<div class="ar-form">'
        + '<div class="ar-grid-2">'
        + '<div class="ar-campo"><label>Fecha</label><input type="date" id="ar-pt-fecha" value="' + arEsc(p.fecha || '') + '"></div>'
        + '<div class="ar-campo"><label>Contra (equipo contrario)</label><input type="text" id="ar-pt-contra" value="' + arEsc(p.contra || '') + '" placeholder="Ej: Zamora CF"></div>'
        + '<div class="ar-campo"><label>El rival jugó como</label><select id="ar-pt-cond"><option value="local"' + (p.condicion !== 'visitante' ? ' selected' : '') + '>Local</option><option value="visitante"' + (p.condicion === 'visitante' ? ' selected' : '') + '>Visitante</option></select></div>'
        + '<div class="ar-campo"><label>Resultado</label><input type="text" id="ar-pt-resultado" value="' + arEsc(p.resultado || '') + '" placeholder="Ej: 2-1"></div>'
        + '<div class="ar-campo"><label>Competición</label><input type="text" id="ar-pt-comp" value="' + arEsc(p.competicion || '') + '" placeholder="Ej: Liga J.3, Copa..."></div>'
        + '<div class="ar-campo"><label>Enlace al vídeo (opcional)</label><input type="text" id="ar-pt-video" value="' + arEsc(p.video_url || '') + '" placeholder="YouTube, Veo..."></div>'
        + '</div>'
        + '<div class="ar-campo"><label>Notas del partido</label><textarea id="ar-pt-notas" placeholder="Qué viste: sistema usado, comportamientos, cambios...">' + arEsc(p.notas || '') + '</textarea></div>'
        + '<div class="ar-form-btns">'
        + '<button class="ar-btn gris" onclick="arPartidoEditIdx=-1;arRender()">Cancelar</button>'
        + '<button class="ar-btn verde" onclick="arGuardarPartido()">' + (idx >= 0 ? 'Guardar cambios' : 'Añadir partido') + '</button>'
        + '</div></div>';
    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function arGuardarPartido() {
    var p = {
        fecha:       document.getElementById('ar-pt-fecha').value,
        contra:      document.getElementById('ar-pt-contra').value.trim(),
        condicion:   document.getElementById('ar-pt-cond').value,
        resultado:   document.getElementById('ar-pt-resultado').value.trim(),
        competicion: document.getElementById('ar-pt-comp').value.trim(),
        video_url:   document.getElementById('ar-pt-video').value.trim(),
        notas:       document.getElementById('ar-pt-notas').value.trim()
    };
    if (!p.contra && !p.fecha) { showToast('Pon al menos la fecha o el equipo contrario'); return; }
    var arr = arDossier.partidos.slice();
    if (arPartidoEditIdx >= 0) arr[arPartidoEditIdx] = p;
    else arr.push(p);
    if (await arGuardarDossier({ partidos: arr })) {
        arPartidoEditIdx = -1;
        showToast('Partido guardado');
        arRender();
    }
}

async function arBorrarPartido(idx) {
    if (!confirm('¿Borrar este partido observado?')) return;
    var arr = arDossier.partidos.slice();
    arr.splice(idx, 1);
    if (await arGuardarDossier({ partidos: arr })) { showToast('Partido borrado'); arRender(); }
}

// ---------- Seccion: Fases del juego ----------
function arRenderFases() {
    var h = '<div class="ar-panel"><h4>Fases del juego del rival</h4>'
        + '<div class="ar-guardado" style="margin-bottom:12px">Describe cómo se comporta el rival en cada fase. Puedes añadir un enlace de vídeo por fase.</div>';
    arDossier.fases.forEach(function(f, i) {
        h += '<div class="ar-item" style="padding:14px">'
            + '<div class="ar-item-tit" style="margin-bottom:8px">' + arEsc(f.title) + '</div>'
            + '<div class="ar-campo" style="margin-bottom:8px"><textarea id="ar-fase-notas-' + i + '" placeholder="Notas de esta fase...">' + arEsc(f.notes || '') + '</textarea></div>'
            + '<div class="ar-campo" style="margin-bottom:0"><label>Enlace de vídeo (opcional)</label><input type="text" id="ar-fase-video-' + i + '" value="' + arEsc(f.video_url || '') + '" placeholder="YouTube, Veo..."></div>'
            + '</div>';
    });
    h += '<div class="ar-form-btns"><button class="ar-btn verde" onclick="arGuardarFases()">💾 Guardar fases</button></div></div>';
    return h;
}

async function arGuardarFases() {
    var arr = arDossier.fases.map(function(f, i) {
        return {
            id: f.id,
            title: f.title,
            notes: document.getElementById('ar-fase-notas-' + i).value.trim(),
            video_url: document.getElementById('ar-fase-video-' + i).value.trim()
        };
    });
    if (await arGuardarDossier({ fases: arr })) showToast('Fases guardadas');
}

// ---------- Seccion: ABPs ----------
function arRenderAbps() {
    var h = '<div class="ar-panel">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">'
        + '<h4 style="margin:0">Acciones a balón parado del rival</h4>'
        + '<button class="ar-btn" onclick="arAbrirFormAbp(-1)">+ Añadir ABP</button>'
        + '</div>'
        + '<div id="ar-abp-form-area"></div>';

    if (arDossier.abps.length === 0) {
        h += '<div class="ar-vacio">Sin ABPs registradas todavía.</div>';
    } else {
        arDossier.abps.forEach(function(a, i) {
            var esOf = a.tipo !== 'defensiva';
            h += '<div class="ar-item"><div class="ar-item-cab"><div>'
                + '<span class="ar-badge" style="background:' + (esOf ? '#14532d' : '#1e3a5f') + ';color:' + (esOf ? '#86efac' : '#93c5fd') + '">' + (esOf ? 'OFENSIVA' : 'DEFENSIVA') + '</span>'
                + '<span class="ar-item-tit">' + arEsc(a.accion || 'ABP') + (a.titulo ? ' · ' + arEsc(a.titulo) : '') + '</span>'
                + '</div><span class="acc">'
                + (a.video_url ? '<a class="ar-link" href="' + arEsc(a.video_url) + '" target="_blank" title="Ver vídeo">🎬</a>' : '')
                + '<button onclick="arAbrirFormAbp(' + i + ')" title="Editar">✏️</button>'
                + '<button onclick="arBorrarAbp(' + i + ')" title="Borrar">🗑️</button>'
                + '</span></div>'
                + (a.descripcion ? '<div class="ar-item-desc">' + arEsc(a.descripcion) + '</div>' : '')
                + '</div>';
        });
    }
    return h + '</div>';
}

function arAbrirFormAbp(idx) {
    arAbpEditIdx = idx;
    var a = idx >= 0 ? arDossier.abps[idx] : { tipo: 'ofensiva', accion: 'Corner', titulo: '', descripcion: '', video_url: '' };
    var area = document.getElementById('ar-abp-form-area');
    if (!area) return;
    var opciones = '';
    AR_ABP_ACCIONES.forEach(function(x) {
        opciones += '<option value="' + x + '"' + (a.accion === x ? ' selected' : '') + '>' + x + '</option>';
    });
    area.innerHTML = '<div class="ar-form">'
        + '<div class="ar-grid-2">'
        + '<div class="ar-campo"><label>Tipo</label><select id="ar-abp-tipo"><option value="ofensiva"' + (a.tipo !== 'defensiva' ? ' selected' : '') + '>Ofensiva (del rival)</option><option value="defensiva"' + (a.tipo === 'defensiva' ? ' selected' : '') + '>Defensiva (del rival)</option></select></div>'
        + '<div class="ar-campo"><label>Acción</label><select id="ar-abp-accion">' + opciones + '</select></div>'
        + '<div class="ar-campo"><label>Título corto (opcional)</label><input type="text" id="ar-abp-titulo" value="' + arEsc(a.titulo || '') + '" placeholder="Ej: Corner cerrado al primer palo"></div>'
        + '<div class="ar-campo"><label>Enlace de vídeo (opcional)</label><input type="text" id="ar-abp-video" value="' + arEsc(a.video_url || '') + '"></div>'
        + '</div>'
        + '<div class="ar-campo"><label>Descripción</label><textarea id="ar-abp-desc" placeholder="Cómo la ejecutan, quién lanza, movimientos, riesgos...">' + arEsc(a.descripcion || '') + '</textarea></div>'
        + '<div class="ar-form-btns">'
        + '<button class="ar-btn gris" onclick="arAbpEditIdx=-1;arRender()">Cancelar</button>'
        + '<button class="ar-btn verde" onclick="arGuardarAbp()">' + (idx >= 0 ? 'Guardar cambios' : 'Añadir ABP') + '</button>'
        + '</div></div>';
    area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function arGuardarAbp() {
    var a = {
        tipo:        document.getElementById('ar-abp-tipo').value,
        accion:      document.getElementById('ar-abp-accion').value,
        titulo:      document.getElementById('ar-abp-titulo').value.trim(),
        descripcion: document.getElementById('ar-abp-desc').value.trim(),
        video_url:   document.getElementById('ar-abp-video').value.trim()
    };
    var arr = arDossier.abps.slice();
    if (arAbpEditIdx >= 0) arr[arAbpEditIdx] = a;
    else arr.push(a);
    if (await arGuardarDossier({ abps: arr })) {
        arAbpEditIdx = -1;
        showToast('ABP guardada');
        arRender();
    }
}

async function arBorrarAbp(idx) {
    if (!confirm('¿Borrar esta ABP?')) return;
    var arr = arDossier.abps.slice();
    arr.splice(idx, 1);
    if (await arGuardarDossier({ abps: arr })) { showToast('ABP borrada'); arRender(); }
}

// ---------- PDF del dossier ----------
function arDossierPDF() {
    if (!arDossier) { showToast('No hay dossier cargado'); return; }
    var eq = arEquipos.find(function(e) { return e.id === arEquipoSel; });
    var nombreRival = eq ? eq.nombre : 'Rival';
    var nombreClub = (typeof clubData !== 'undefined' && clubData && clubData.name) ? clubData.name : 'Club';
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF();
    var W = doc.internal.pageSize.getWidth();
    var H = doc.internal.pageSize.getHeight();
    var MG = 14;
    var y = 0;

    var cDark = [15, 23, 42], cBlue = [59, 130, 246], cGreen = [22, 163, 74], cRed = [220, 38, 38], cAmber = [245, 158, 11], cGray = [100, 116, 139], cPurple = [124, 58, 237];

    function checkSpace(n) { if (y + n > H - 12) { doc.addPage(); y = 14; } }
    function sectionHeader(txt, color) {
        checkSpace(12);
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(MG, y, W - MG * 2, 7, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(txt, MG + 3, y + 4.8);
        y += 11;
    }
    function arJugadorPdf(d, j) {
        checkSpace(6);
        d.setFontSize(8); d.setFont('helvetica', 'bold'); d.setTextColor(cDark[0], cDark[1], cDark[2]);
        d.text((j.dorsal ? j.dorsal + '. ' : '') + j.nombre + (j.posicion ? '  (' + j.posicion + ')' : ''), MG + 3, y);
        y += 3.8;
        var meta = [];
        if (j.pie) meta.push(j.pie);
        if (j.anio) meta.push(j.anio);
        if (j.procede) meta.push('Procede: ' + j.procede);
        if (j.pj != null) meta.push('PJ: ' + j.pj);
        if (j.minutos != null) meta.push('Min: ' + j.minutos);
        if (j.goles != null) meta.push('Goles: ' + j.goles);
        if (meta.length) {
            checkSpace(4);
            d.setFont('helvetica', 'normal'); d.setFontSize(7.5); d.setTextColor(cGray[0], cGray[1], cGray[2]);
            d.text(meta.join('  |  '), MG + 6, y);
            y += 3.6;
        }
        if (j.analisis) {
            d.setFont('helvetica', 'normal'); d.setFontSize(7.5); d.setTextColor(80, 80, 80);
            d.splitTextToSize(j.analisis, W - MG * 2 - 8).forEach(function(ln) {
                checkSpace(3.8);
                d.text(ln, MG + 6, y);
                y += 3.4;
            });
        }
        y += 1.6;
    }

    function parrafo(label, texto) {
        if (!texto) return;
        checkSpace(10);
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(cDark[0], cDark[1], cDark[2]);
        doc.text(label, MG, y); y += 4;
        doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
        doc.splitTextToSize(texto, W - MG * 2).forEach(function(ln) {
            checkSpace(4.2);
            doc.text(ln, MG, y); y += 3.8;
        });
        y += 2.5;
    }

    // Portada / cabecera
    doc.setFillColor(cDark[0], cDark[1], cDark[2]);
    doc.rect(0, 0, W, 34, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('INFORME DE RIVAL: ' + nombreRival.toUpperCase(), W / 2, 15, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 200, 210);
    doc.text(nombreClub + ' - Departamento de analisis - ' + new Date().toLocaleDateString('es-ES'), W / 2, 24, { align: 'center' });
    y = 42;

    // Scouting
    var s = arDossier.scouting || {};
    if (s.sistema || s.sistema2 || s.estilo || s.fuertes || s.debiles || s.clave) {
        sectionHeader('SCOUTING', cPurple);
        if (s.sistema || s.sistema2) {
            parrafo('Sistema habitual' + (s.sistema2 ? ' / alternativo' : ''), (s.sistema || '-') + (s.sistema2 ? '  |  ' + s.sistema2 : ''));
        }
        parrafo('Estilo de juego', s.estilo);
        parrafo('Puntos fuertes', s.fuertes);
        parrafo('Puntos debiles', s.debiles);
        parrafo('Jugadores clave', s.clave);

        // Campo con alineacion
        var alinPdf = s.alineacion || {};
        var hayAlin = s.sistema && Object.keys(alinPdf).some(function(k) { return (alinPdf[k] || []).length > 0; });
        if (hayAlin) {
            var cAncho = 84, cAlto = 116;
            checkSpace(cAlto + 14);
            var cX = (W - cAncho) / 2;
            var cY = y + 4;
            doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(cDark[0], cDark[1], cDark[2]);
            doc.text('Alineacion rival - ' + s.sistema, W / 2, cY - 1, { align: 'center' });
            doc.setFillColor(45, 90, 39);
            doc.roundedRect(cX, cY, cAncho, cAlto, 2, 2, 'F');
            doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.3);
            doc.line(cX, cY + cAlto / 2, cX + cAncho, cY + cAlto / 2);
            doc.circle(cX + cAncho / 2, cY + cAlto / 2, 9, 'S');
            doc.rect(cX + cAncho * 0.2, cY, cAncho * 0.6, cAlto * 0.14, 'S');
            doc.rect(cX + cAncho * 0.35, cY, cAncho * 0.3, cAlto * 0.06, 'S');
            doc.rect(cX + cAncho * 0.2, cY + cAlto * 0.86, cAncho * 0.6, cAlto * 0.14, 'S');
            doc.rect(cX + cAncho * 0.35, cY + cAlto * 0.94, cAncho * 0.3, cAlto * 0.06, 'S');
            arSlotsDe(s.sistema).forEach(function(sl) {
                var ids = alinPdf[sl.slotId] || [];
                ids.forEach(function(id, k) {
                    var j = arJugadores.find(function(x) { return x.id === id; });
                    if (!j) return;
                    var px = cX + sl.x / 100 * cAncho;
                    var py = cY + sl.y / 100 * cAlto + k * 10;
                    if (py > cY + cAlto - 3) return;
                    doc.setFillColor(220, 38, 38);
                    doc.circle(px, py, 3.2, 'F');
                    doc.setTextColor(255, 255, 255); doc.setFontSize(6); doc.setFont('helvetica', 'bold');
                    doc.text(String(j.dorsal || ''), px, py + 0.9, { align: 'center' });
                    doc.setFontSize(5.5);
                    var apellido = (j.nombre || '').trim().split(' ').pop().substring(0, 12);
                    doc.text(apellido, px, py + 6, { align: 'center' });
                });
            });
            y = cY + cAlto + 8;
        }
    }

    // Jugadores
    if (arJugadores.length > 0) {
        sectionHeader('PLANTILLA DEL RIVAL (' + arJugadores.length + ')', cDark);
        var usados = {};
        AR_LINEAS.forEach(function(lin) {
            var jl = arJugadores.filter(function(j) { return j.posicion && lin.poss.indexOf(j.posicion) > -1; });
            jl.forEach(function(j) { usados[j.id] = true; });
            if (jl.length === 0) return;
            checkSpace(9);
            doc.setFontSize(8); doc.setFont('helvetica', 'bold');
            var colLin = lin.color === '#22c55e' ? cGreen : lin.color === '#3b82f6' ? cBlue : lin.color === '#f59e0b' ? cAmber : cRed;
            doc.setTextColor(colLin[0], colLin[1], colLin[2]);
            doc.text(lin.label.toUpperCase(), MG, y); y += 4.5;
            jl.forEach(function(j) { arJugadorPdf(doc, j); });
            y += 2;
        });
        var sinPos = arJugadores.filter(function(j) { return !usados[j.id]; });
        if (sinPos.length > 0) {
            checkSpace(9);
            doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(cGray[0], cGray[1], cGray[2]);
            doc.text('SIN POSICION', MG, y); y += 4.5;
            sinPos.forEach(function(j) { arJugadorPdf(doc, j); });
            y += 2;
        }
    }

    function noop() {}

    // Partidos observados
    var pts = (arDossier.partidos || []).slice().sort(function(a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); });
    if (pts.length > 0) {
        sectionHeader('PARTIDOS OBSERVADOS (' + pts.length + ')', cBlue);
        pts.forEach(function(p) {
            checkSpace(9);
            doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(cDark[0], cDark[1], cDark[2]);
            var fFmt = p.fecha ? new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-ES') : 'Sin fecha';
            var linea = fFmt + '  -  ' + (p.resultado ? p.resultado + ' ' : '') + 'vs ' + (p.contra || '?') + ' (' + (p.condicion === 'visitante' ? 'Visitante' : 'Local') + ')' + (p.competicion ? ' - ' + p.competicion : '');
            doc.text(linea, MG, y); y += 4.2;
            if (p.notas) {
                doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80); doc.setFontSize(8);
                doc.splitTextToSize(p.notas, W - MG * 2 - 3).forEach(function(ln) {
                    checkSpace(4);
                    doc.text(ln, MG + 3, y); y += 3.6;
                });
            }
            y += 2.5;
        });
    }

    // Fases
    var fasesConNotas = (arDossier.fases || []).filter(function(f) { return f.notes; });
    if (fasesConNotas.length > 0) {
        sectionHeader('FASES DEL JUEGO DEL RIVAL', cAmber);
        fasesConNotas.forEach(function(f) { parrafo(f.title, f.notes); });
    }

    // ABPs
    if ((arDossier.abps || []).length > 0) {
        sectionHeader('ACCIONES A BALON PARADO (' + arDossier.abps.length + ')', cRed);
        arDossier.abps.forEach(function(a) {
            var cab = (a.tipo === 'defensiva' ? '[DEFENSIVA] ' : '[OFENSIVA] ') + (a.accion || 'ABP') + (a.titulo ? ' - ' + a.titulo : '');
            parrafo(cab, a.descripcion || '-');
        });
    }

    doc.save('Informe_Rival_' + nombreRival.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf');
    showToast('PDF del dossier generado');
}
