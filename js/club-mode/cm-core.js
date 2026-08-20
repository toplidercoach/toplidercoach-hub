// ========== CM-CORE.JS — TopLiderCoach Club Mode ==========
// Sistema de permisos, deteccion de Club Mode y selector de equipo
// Depende de: core.js (supabaseClient, clubId, usuario, registrarInit)
// Ubicacion: js/club-mode/cm-core.js

// ========== CATALOGO DE MODULOS DEL CLUB MODE (47 totales) ==========
// Esta constante define TODOS los modulos posibles del Club Mode.
// Sirve como referencia para construir UIs de permisos (club-admin-cargos)
// y como fuente de verdad para validar claves de permiso.
//
// Estructura: { key, label, block }
// - key: identificador unico que se guarda en club_roles.permissions
// - label: texto en castellano para mostrar en UIs
// - block: 'campo_comun' | 'campo_despacho' | 'oficina' | 'compartido'

var CM_MODULOS = [
    // ========== CAMPO - COMUNES (17) ==========
    // Modulos que comparten todos los roles del campo (entrenadores, segundos, ...)
    { key: 'plantilla',            label: 'Plantilla',                  block: 'campo_comun' },
    { key: 'asistencia',           label: 'Asistencia y bienestar',     block: 'campo_comun' },
    { key: 'crear_sesion',         label: 'Crear sesion',               block: 'campo_comun' },
    { key: 'mis_sesiones',         label: 'Mis sesiones',               block: 'campo_comun' },
    { key: 'calendario',           label: 'Calendario de sesiones',     block: 'campo_comun' },
    { key: 'pizarra',              label: 'Pizarra tactica',            block: 'campo_comun' },
    { key: 'periodizacion',        label: 'Periodizacion deportiva',    block: 'campo_comun' },
    { key: 'cargas',               label: 'Cargas (sRPE)',              block: 'campo_comun' },
    { key: 'wellness',             label: 'Enlaces wellness',           block: 'campo_comun' },
    { key: 'modelo_juego',         label: 'Modelo de juego',            block: 'campo_comun' },
    { key: 'partidos',             label: 'Partidos',                   block: 'campo_comun' },
    { key: 'estadisticas',         label: 'Estadisticas',               block: 'campo_comun' },
    { key: 'plan_partido',         label: 'Plan de partido',            block: 'campo_comun' },
    { key: 'rivales',              label: 'Rivales',                    block: 'campo_comun' },
    { key: 'analisis_rivales',     label: 'Analisis de rivales',        block: 'campo_comun' },
    { key: 'analisis_postpartido', label: 'Analisis post-partido',      block: 'campo_comun' },
    { key: 'cuerpo_tecnico_ia',    label: 'Cuerpo tecnico IA',          block: 'campo_comun' },

    // ========== CAMPO - DESPACHOS PRIVADOS (5) ==========
    // Cada despacho es propiedad de UN rol especifico. El entrenador NO los ve.
    { key: 'modulo_medico',                label: 'Despacho medico',         block: 'campo_despacho' },
    { key: 'modulo_fisio',                 label: 'Despacho fisio',          block: 'campo_despacho' },
    { key: 'modulo_preparacion_fisica',    label: 'Preparacion fisica',      block: 'campo_despacho' },
    { key: 'modulo_analista_video',        label: 'Analista de video',       block: 'campo_despacho' },
    { key: 'modulo_utillero',              label: 'Utillero',                block: 'campo_despacho' },

    // ========== OFICINA (18) ==========
    // Modulos de gestion del club (no del equipo concreto)
    { key: 'direccion_deportiva',     label: 'Direccion deportiva',     block: 'oficina' },
    { key: 'scouting',                label: 'Scouting',                block: 'oficina' },
    { key: 'documentos',              label: 'Documentos',              block: 'oficina' },
    { key: 'marketing',               label: 'Marketing',               block: 'oficina' },
    { key: 'economico',               label: 'Economico',               block: 'oficina' },
    { key: 'cumplimiento_rfef',       label: 'Cumplimiento RFEF',       block: 'oficina' },
    { key: 'pagos_cuotas',            label: 'Pagos y cuotas',          block: 'oficina' },
    { key: 'administracion',          label: 'Administracion',          block: 'oficina' },
    { key: 'vista_presidente',        label: 'Vista presidente',        block: 'oficina' },
    { key: 'cantera',                 label: 'Cantera / formacion',     block: 'oficina' },
    { key: 'redes_sociales',          label: 'Redes sociales',          block: 'oficina' },
    { key: 'instalaciones',           label: 'Instalaciones',           block: 'oficina' },
    { key: 'tienda',                  label: 'Tienda',                  block: 'oficina' },
    { key: 'arbitros',                label: 'Arbitros',                block: 'oficina' },
    { key: 'comunicacion_familias',   label: 'Comunicacion familias',   block: 'oficina' },
    { key: 'eventos',                 label: 'Eventos',                 block: 'oficina' },
    { key: 'transporte',              label: 'Transporte',              block: 'oficina' },
    { key: 'patrocinadores',          label: 'Patrocinadores',          block: 'oficina' },
    { key: 'miembros_permisos',       label: 'Miembros y permisos',     block: 'oficina' },

    // ========== COMPARTIDOS (7) ==========
    // Modulos que cruzan roles. Cada uno con sus reglas propias de visibilidad.
    { key: 'panel_disponibilidad',    label: 'Panel de disponibilidad',          block: 'compartido' },
    { key: 'configuracion_club',      label: 'Configuracion del club',           block: 'compartido' },
    { key: 'plantilla_maestra',       label: 'Plantilla maestra (ficha jugador)', block: 'compartido' },
    { key: 'calendario_general',      label: 'Calendario general',               block: 'compartido' },
    { key: 'alimentacion_dietas',     label: 'Alimentacion y dietas',            block: 'compartido' },
    { key: 'registro_federativo',     label: 'Registro federativo',              block: 'compartido' },
    { key: 'historial_educativo',     label: 'Historial educativo del jugador',  block: 'compartido' }
];

// ========== HELPERS PARA CM_MODULOS ==========

// Devuelve los modulos de un bloque concreto
function cmGetModulosPorBloque(bloque) {
    return CM_MODULOS.filter(function(m) { return m.block === bloque; });
}

// Busca un modulo por su clave
function cmGetModuloByKey(key) {
    return CM_MODULOS.find(function(m) { return m.key === key; });
}

// ========== ESTADO DEL CLUB MODE ==========
var cmState = {
    activo: false,             // Tiene Club Mode este club?
    miembro: null,             // Datos del miembro actual (de club_members)
    rol: null,                 // Datos del rol (de club_roles)
    permisos: {},              // Objeto de permisos {modulo: {ver, editar}}
    esAdmin: false,            // Es admin del club?
    teamScope: 'assigned',     // 'all' o 'assigned'
    equipos: [],               // Todos los equipos del club
    equiposAcceso: [],         // Equipos a los que tiene acceso
    equipoSeleccionado: null,  // Equipo actualmente seleccionado
    miembros: [],              // Todos los miembros (carga futura)
    cargos: []                 // Todos los cargos/roles (carga futura)
};

// ========== INICIALIZACION ==========
async function cmInit() {
    if (!clubId || !usuario) {
        console.log('[Club Mode] Sin club o usuario, omitido');
        return;
    }

    try {
        // 1. Comprobar si el usuario es miembro del club
        // .maybeSingle() devuelve null si no hay match (sin lanzar 406)
        var { data: miembro } = await supabaseClient
            .from('club_members')
            .select('*, club_roles(*)')
            .eq('club_id', clubId)
            .eq((window.cmAuthSource === 'supabase' && usuario.authUid) ? 'auth_user_id' : 'wp_user_id', (window.cmAuthSource === 'supabase' && usuario.authUid) ? usuario.authUid : usuario.id)
            .eq('active', true)
            .maybeSingle();

        if (!miembro) {
            // No es miembro de club -> Coach Mode autonomo
            console.log('[Club Mode] Usuario no es miembro, modo Coach autonomo');
            cmState.activo = false;
            return;
        }

        // 2. Activar Club Mode
        cmState.activo = true;
        cmState.miembro = miembro;
        cmState.rol = miembro.club_roles;
        cmState.permisos = miembro.club_roles ? miembro.club_roles.permissions || {} : {};
        cmState.esAdmin = miembro.club_roles ? miembro.club_roles.is_admin : false;
        cmState.teamScope = miembro.club_roles ? miembro.club_roles.team_scope : 'assigned';

        console.log('[Club Mode] ACTIVO -- Rol: ' + (cmState.rol ? cmState.rol.name : '?'));

        // 2b. Sincronizar plantilla del HUB hacia Club Mode (idempotente)
        try {
            await supabaseClient.rpc('sync_club_plantilla', { p_club_id: clubId });
        } catch (e) {
            console.warn('[Club Mode] sync_club_plantilla no disponible:', e.message);
        }

        // 3. Cargar equipos del club
        await cmCargarEquipos();

        // 4. Determinar equipos accesibles segun team_scope
        if (cmState.teamScope === 'all' || cmState.esAdmin) {
            cmState.equiposAcceso = cmState.equipos.slice();
        } else {
            var ids = miembro.team_ids || [];
            cmState.equiposAcceso = cmState.equipos.filter(function(e) {
                return ids.includes(e.id);
            });
        }

        // 5. Seleccionar equipo por defecto (ultimo usado o el primero)
        if (cmState.equiposAcceso.length > 0) {
            var ultimo = localStorage.getItem('cm_team_selected');
            var encontrado = null;
            if (ultimo) {
                encontrado = cmState.equiposAcceso.find(function(e) { return e.id === ultimo; });
            }
            cmState.equipoSeleccionado = encontrado || null;
        }

        // 6. Montar el selector de equipo en el header
        cmMontarSelector();

        // 7. Aplicar permisos a la UI (ocultar tabs sin permiso)
        cmAplicarPermisos();

    } catch (e) {
        console.error('[Club Mode] Error en inicializacion:', e);
    }
}

// ========== CARGAR EQUIPOS ==========
async function cmCargarEquipos() {
    var { data } = await supabaseClient
        .from('club_teams')
        .select('*')
        .eq('club_id', clubId)
        .eq('active', true)
        .order('category')
        .order('name');
    cmState.equipos = data || [];
}

// ========== SELECTOR DE EQUIPO EN EL HEADER ==========
function cmMontarSelector() {
    if (!cmState.activo || cmState.equiposAcceso.length === 0) return;

    var headerClub = document.getElementById('club-badge');
    if (!headerClub) {
        console.log('[Club Mode] Selector de equipo: contenedor no encontrado, se omite');
        return;
    }

    var container = document.getElementById('cm-team-selector');
    if (!container) {
        container = document.createElement('div');
        container.id = 'cm-team-selector';
        container.style.cssText = 'display:inline-flex;align-items:center;gap:8px;margin-left:12px;';
        headerClub.parentNode.insertBefore(container, headerClub.nextSibling);
    }

    var sinSel = cmState.equipoSeleccionado ? '' : ' selected';
    var opciones = '<option value="__all__"' + sinSel + '>Todos mis equipos (' + cmState.equiposAcceso.length + ')</option>';
    opciones += cmState.equiposAcceso.map(function(e) {
        var selected = cmState.equipoSeleccionado && cmState.equipoSeleccionado.id === e.id ? ' selected' : '';
        var cat = e.category ? ' (' + e.category + ')' : '';
        return '<option value="' + e.id + '"' + selected + '>' + e.name + cat + '</option>';
    }).join('');

    container.innerHTML = '<select id="cm-team-select" onchange="cmSeleccionarEquipo(this.value)" ' +
        'style="background:#1a1a2e;border:1px solid rgba(56,130,246,0.3);color:#e2e8f0;padding:5px 10px;' +
        'border-radius:8px;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;outline:none">' +
        opciones + '</select>';
}

// ========== CAMBIAR EQUIPO SELECCIONADO ==========
function cmSeleccionarEquipo(teamId) {
    if (teamId === '__all__') {
        cmState.equipoSeleccionado = null;
        localStorage.setItem('cm_team_selected', '__all__');
        document.dispatchEvent(new CustomEvent('cmTeamChanged', { detail: null }));
        return;
    }
    var equipo = cmState.equiposAcceso.find(function(e) { return e.id === teamId; });
    if (!equipo) return;
    cmState.equipoSeleccionado = equipo;
    localStorage.setItem('cm_team_selected', teamId);
    console.log('[Club Mode] Equipo seleccionado: ' + equipo.name);
    if (typeof window.onClubTeamChange === 'function') window.onClubTeamChange(equipo);
    document.dispatchEvent(new CustomEvent('cmTeamChanged', { detail: equipo }));
}
// ========== SISTEMA DE PERMISOS ==========

// Comprueba si el usuario puede VER un modulo
// ========== IDENTIDAD UNIFICADA ==========
// Devuelve el numero unico de persona (bigint), el mismo que fn_identidad_wp() en la base:
// - Miembro de club (Supabase Auth): su wp_user_id de club_members (rango 100.000.001+)
// - Usuario WordPress: su id numerico de siempre
function cmIdentidad() {
    if (typeof cmState !== 'undefined' && cmState.miembro && cmState.miembro.wp_user_id != null) {
        return Number(cmState.miembro.wp_user_id);
    }
    if (typeof usuario !== 'undefined' && usuario && usuario.id != null && !isNaN(Number(usuario.id))) {
        return Number(usuario.id);
    }
    return null;
}
window.cmIdentidad = cmIdentidad;
// Exponer el estado del Club Mode a los modulos del HUB (planificador, miclub, ...)
// cm-core se carga en ambito aislado: sin esta linea, cmState no es visible fuera.
window.cmState = cmState;

function cmPuedeVer(modulo) {
    if (!cmState.activo) return true; // Coach autonomo -> ve todo lo suyo
    if (cmState.esAdmin) return true; // Admin del club ve todo
    var perm = cmState.permisos[modulo];
    return perm && perm.ver === true;
}

// Comprueba si el usuario puede EDITAR en un modulo
function cmPuedeEditar(modulo) {
    if (!cmState.activo) return true;
    if (cmState.esAdmin) return true;
    var perm = cmState.permisos[modulo];
    return perm && perm.editar === true;
}

// Comprueba si el usuario puede ver un equipo especifico
function cmPuedeVerEquipo(teamId) {
    if (!cmState.activo) return true;
    if (cmState.esAdmin || cmState.teamScope === 'all') return true;
    return cmState.equiposAcceso.some(function(e) { return e.id === teamId; });
}
// ===== EQUIPOS / JUGADORES VISIBLES (compartido por todos los modulos) =====
// Equipos que el miembro puede ver (respeta su alcance: 'all' o asignados).
function cmEquiposVisibles() {
    return cmState.activo ? cmState.equiposAcceso.slice() : [];
}
// True si un jugador (por sus team ids) es visible para el miembro actual.
function cmJugadorVisible(teamIds) {
    if (!cmState.activo) return true;
    if (cmState.esAdmin || cmState.teamScope === 'all') return true;
    if (!teamIds || teamIds.length === 0) return false;
    return teamIds.some(function(id) {
        return cmState.equiposAcceso.some(function(e) { return e.id === id; });
    });
}

// ========== APLICAR PERMISOS A LA UI DEL HUB ==========

// True si el rol puede ver alguna de las claves indicadas (incluye claves legacy)
function cmVerAlguna(claves) {
    for (var i = 0; i < claves.length; i++) {
        if (cmPuedeVer(claves[i])) return true;
    }
    return false;
}

// Modal "sin acceso": se muestra al pulsar un elemento bloqueado
function cmModalSinAcceso() {
    var overlay = document.getElementById('cm-modal-sin-acceso');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'cm-modal-sin-acceso';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:99999;';
        overlay.innerHTML =
            '<div style="background:#1e293b;border-radius:12px;padding:28px;max-width:420px;width:90%;color:#fff;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,0.4);">' +
            '<div style="font-size:34px;margin-bottom:10px;">\uD83D\uDD12</div>' +
            '<p style="margin:0 0 8px;font-size:16px;font-weight:600;">No tienes acceso a este m\u00f3dulo</p>' +
            '<p style="margin:0 0 20px;font-size:14px;color:#cbd5e1;">Si necesitas usarlo, p\u00eddele permiso al administrador de tu club.</p>' +
            '<button onclick="document.getElementById(\'cm-modal-sin-acceso\').style.display=\'none\'" style="padding:9px 26px;border-radius:8px;border:none;background:#3b82f6;color:#fff;font-weight:600;cursor:pointer;">Entendido</button>' +
            '</div>';
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.style.display = 'none'; });
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

// Marca un tab o subtab como bloqueado: candado, atenuado y modal al pulsar
function cmBloquear(el) {
    if (!el || el.dataset.cmLocked === '1') return;
    el.dataset.cmLocked = '1';
    el.setAttribute('onclick', 'cmModalSinAcceso(); return false;');
    el.style.opacity = '0.45';
    el.style.cursor = 'not-allowed';
    if ((el.textContent || '').indexOf('\uD83D\uDD12') === -1) {
        el.insertAdjacentText('afterbegin', '\uD83D\uDD12 ');
    }
}

function cmAplicarPermisos() {
    if (!cmState.activo) return;

    // El admin del club ve y usa todo; solo mostrar la pestana Club
    if (cmState.esAdmin) {
        var tabClubAdm = document.getElementById('cm-tab-club');
        if (tabClubAdm) tabClubAdm.style.setProperty('display', 'flex', 'important');
        return;
    }

    // ===== Subpestanas del Planificador (clave propia + legacy 'entrenamientos') =====
    var CM_PLAN_SUBTABS = {
        'crear':            ['crear_sesion', 'entrenamientos'],
        'mis-sesiones':     ['mis_sesiones', 'entrenamientos'],
        'calendario':       ['calendario', 'entrenamientos'],
        'asistencia':       ['asistencia'],
        'cargas':           ['cargas'],
        'enlaces-wellness': ['wellness'],
        'periodizacion':    ['periodizacion'],
        'modelo-juego':     ['modelo_juego']
    };

    // ===== Subpestanas de Gestion de Competicion (clave propia + legacy 'matchstats') =====
    // Nota: 'modulo_analista_video' da acceso a Rivales y Analisis de rivales (analista puro)
    var CM_GC_SUBTABS = {
        'partidos':      ['partidos', 'matchstats'],
        'estadisticas':  ['estadisticas', 'matchstats'],
        'analisis':      ['analisis_postpartido', 'matchstats'],
        'planpartido':   ['plan_partido', 'matchstats'],
        'rivales':       ['rivales', 'matchstats', 'modulo_analista_video'],
        'analisisrival': ['analisis_rivales', 'matchstats', 'modulo_analista_video']
    };

    function cmGestionarSubtabs(selector, modulo, mapa) {
        var alguna = false, primera = null, defaultOk = false, defaultKey = null;
        document.querySelectorAll(selector).forEach(function(st) {
            var oc = st.getAttribute('onclick') || '';
            var m = oc.match(new RegExp("cambiarSubTab\\('" + modulo + "',\\s*'([\\w-]+)'"));
            if (!m) return;
            if (defaultKey === null) defaultKey = m[1];
            var claves = mapa[m[1]];
            if (claves && !cmVerAlguna(claves)) {
                cmBloquear(st);
            } else {
                alguna = true;
                if (!primera) primera = st;
                if (m[1] === defaultKey) defaultOk = true;
            }
        });
        return { alguna: alguna, primera: primera, defaultOk: defaultOk };
    }

    var plan = cmGestionarSubtabs('.planificador-subtabs .sub-tab', 'planificador', CM_PLAN_SUBTABS);
    var gc   = cmGestionarSubtabs('#modulo-matchstats .sub-tab', 'matchstats', CM_GC_SUBTABS);

    // ===== Pestanas principales: candado en vez de ocultar =====
    var MAPEO_HUB_PERMISOS = {
        'pizarra':    ['pizarra'],
        'config':     ['configuracion_club'],
        'staff':      ['cuerpo_tecnico_ia'],
        'medico':     ['modulo_medico'],
        'pagos':      ['pagos_cuotas'],
        'fisio':      ['modulo_fisio'],
        'familias':   ['comunicacion_familias'],
        'prepfisica': ['modulo_preparacion_fisica'],
        'scouting':   ['scouting'],
        'docs':       ['documentos']
    };
    var tabs = document.querySelectorAll('.main-tab');
    tabs.forEach(function(tab) {
        var onclick = tab.getAttribute('onclick') || '';
        var match = onclick.match(/cambiarModulo\('(\w+)'/);
        if (!match) return;
        var mod = match[1];
        if (mod === 'planificador') {
            if (!plan.alguna) cmBloquear(tab);
            return;
        }
        if (mod === 'matchstats') {
            if (!gc.alguna) cmBloquear(tab);
            return;
        }
        var claves = MAPEO_HUB_PERMISOS[mod];
        if (claves && !cmVerAlguna(claves)) cmBloquear(tab);
    });

    // Pestana Analista: accesible si ve algo de competicion o es analista de video
    var tabAnalista = document.querySelector('.main-tab.analista');
    if (tabAnalista && !gc.alguna && !cmPuedeVer('modulo_analista_video')) {
        cmBloquear(tabAnalista);
    }

    // TactiClip: candado si el rol no tiene ningun permiso de campo
    var CM_CAMPO_KEYS = ['crear_sesion','mis_sesiones','calendario','entrenamientos','pizarra',
        'asistencia','cargas','wellness','modelo_juego','periodizacion','partidos','estadisticas',
        'plan_partido','rivales','analisis_rivales','matchstats','analisis_postpartido',
        'cuerpo_tecnico_ia','modulo_analista_video'];
    if (!cmVerAlguna(CM_CAMPO_KEYS)) {
        tabs.forEach(function(td) {
            if (/abrirPromoTactiClip/.test(td.getAttribute('onclick') || '')) cmBloquear(td);
        });
    }

    // Si la subpestana por defecto esta bloqueada, activar la primera permitida
    if (plan.alguna && !plan.defaultOk && plan.primera) { try { plan.primera.click(); } catch (e) {} }
    if (gc.alguna && !gc.defaultOk && gc.primera)       { try { gc.primera.click(); } catch (e) {} }
}

// ========== PANTALLA "EN DESARROLLO" ==========
// Se muestra a roles cuyo panel privado aún no se ha construido (Médico, Fisio, etc.)
function cmMostrarPantallaDesarrollo() {
    var pantalla = document.getElementById('cm-pantalla-desarrollo');
    if (!pantalla) {
        pantalla = document.createElement('div');
        pantalla.id = 'cm-pantalla-desarrollo';
        document.body.appendChild(pantalla);
    }

    var rolNombre = (cmState.rol && cmState.rol.name) ? cmState.rol.name : 'tu rol';
    var nombreUsuario = 'usuario';
    if (typeof usuario !== 'undefined' && usuario) {
        nombreUsuario = usuario.display_name || usuario.name || usuario.username || 'usuario';
    }

    pantalla.innerHTML =
        '<div class="cm-dev-card">' +
            '<div class="cm-dev-icon">🛠️</div>' +
            '<h2>Bienvenido, ' + nombreUsuario + '</h2>' +
            '<p class="cm-dev-rol">Tu rol: <strong>' + rolNombre + '</strong></p>' +
            '<p class="cm-dev-msg">Tu panel privado está en construcción.</p>' +
            '<p class="cm-dev-msg-sub">Te avisaremos cuando esté listo.</p>' +
            '<button class="cm-dev-btn" onclick="logout()">Cerrar sesión</button>' +
        '</div>';

    pantalla.style.display = 'flex';

    // Ocultar el contenido normal del HUB
    var mainTabs = document.querySelector('.main-tabs');
    if (mainTabs) mainTabs.style.display = 'none';

    document.querySelectorAll('.vista-modulo').forEach(function(v) {
        v.style.display = 'none';
    });

    console.log('[Club Mode] Pantalla "En desarrollo" activada para rol:', rolNombre);
}

// ========== HELPERS PUBLICOS PARA MODULOS ==========

// Devuelve el equipo actualmente seleccionado
function cmGetEquipoActual() {
    return cmState.equipoSeleccionado;
}

// Devuelve el ID del equipo seleccionado
function cmGetTeamId() {
    if (cmState.activo && cmState.equipoSeleccionado) {
        return cmState.equipoSeleccionado.id;
    }
    return null;
}

// Devuelve el nombre del rol del usuario actual
function cmGetRolNombre() {
    return cmState.rol ? cmState.rol.name : 'Coach autonomo';
}

// Devuelve true si el Club Mode esta activo
function cmEsClubMode() {
    return cmState.activo;
}

// ========== REGISTRO EN EL SISTEMA DEL HUB ==========
// Se ejecuta al cargar el DOM, despues de que core.js haya inicializado
// TODO: sustituir el setTimeout por un evento "hubReady" cuando exista
registrarInit(function() {
    setTimeout(function() {
        cmInit();
    }, 500);
});

// ========== REGISTRO DEL MODULO 'club' EN EL HUB ==========
// Cuando el usuario hace clic en la pestaña "Club", se ejecuta este handler.
// Por ahora solo hay una subpestaña (Miembros), pero en el futuro se ampliara.
if (typeof registrarModulo === 'function') {
    registrarModulo('club', function() {
        if (typeof cmInitMiembros === 'function') {
            cmInitMiembros('club-miembros');
        }
    });
}

// ========== REGISTRO DE MODULOS PRIVADOS (medico, fisio, pagos, familias) ==========
// Estos modulos NO se registran aqui: cada uno se auto-registra desde su propio
// archivo (cm-medico.js, cm-fisio.js, cm-pagos.js, cm-familias.js) en su bloque
// de auto-montaje, que crea la pestana, crea el contenedor correcto y llama a
// registrarModulo con ese contenedor. Registrarlos tambien aqui causaba un doble
// registro hacia contenedores que no existian. Se elimino para dejar un unico
// punto de registro por modulo.

console.log('[Club Mode] cm-core.js cargado (' + CM_MODULOS.length + ' modulos catalogados)');
