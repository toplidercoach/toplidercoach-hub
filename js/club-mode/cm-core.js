// ========== CM-CORE.JS — TopLiderCoach Club Mode ==========
// Sistema de permisos, deteccion de Club Mode y selector de equipo
// Depende de: core.js (supabaseClient, clubId, usuario, registrarInit)
// Ubicacion: js/club-mode/cm-core.js

// ========== CATALOGO DE MODULOS DEL CLUB MODE (41 totales) ==========
// Esta constante define TODOS los modulos posibles del Club Mode.
// Sirve como referencia para construir UIs de permisos (club-admin-cargos)
// y como fuente de verdad para validar claves de permiso.
//
// Estructura: { key, label, block }
// - key: identificador unico que se guarda en club_roles.permissions
// - label: texto en castellano para mostrar en UIs
// - block: 'campo_comun' | 'campo_despacho' | 'oficina' | 'compartido'

var CM_MODULOS = [
    // ========== CAMPO - COMUNES (11) ==========
    // Modulos que comparten todos los roles del campo (entrenadores, segundos, ...)
    { key: 'plantilla',            label: 'Plantilla',                  block: 'campo_comun' },
    { key: 'asistencia',           label: 'Asistencia y bienestar',     block: 'campo_comun' },
    { key: 'entrenamientos',       label: 'Entrenamientos',             block: 'campo_comun' },
    { key: 'pizarra',              label: 'Pizarra tactica',            block: 'campo_comun' },
    { key: 'periodizacion',        label: 'Periodizacion deportiva',    block: 'campo_comun' },
    { key: 'cargas',               label: 'Cargas (sRPE)',              block: 'campo_comun' },
    { key: 'wellness',             label: 'Enlaces wellness',           block: 'campo_comun' },
    { key: 'modelo_juego',         label: 'Modelo de juego',            block: 'campo_comun' },
    { key: 'matchstats',           label: 'MatchStats / Competicion',   block: 'campo_comun' },
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
function cmAplicarPermisos() {
    if (!cmState.activo) return;

    // Mapeo de tabs del HUB actual a claves de permisos del Club Mode.
    // null = el tab NO se controla por permisos (lo ven todos los miembros del club).
    // TODO: cuando se integren los modulos nuevos del Club Mode al HUB, anadirlos aqui.
    var MAPEO_HUB_PERMISOS = {
        'planificador':  'entrenamientos',        // Planificador HUB -> Entrenamientos
        'pizarra':       'pizarra',
        'matchstats':    'matchstats',
        'asistencia':    'asistencia',
        'config':        'configuracion_club',    // Mi Club HUB -> Configuracion del club
        'periodizacion': 'periodizacion',
        'analisis':      'analisis_postpartido',
        'plan_partido':  'matchstats',            // Plan partido es parte del flujo MatchStats
        'staff':         'cuerpo_tecnico_ia',
        'dashboard':     null,                     // Dashboard general: lo ven todos
        'medico':        'modulo_medico',          // Panel medico -> Despacho medico
        'pagos':         'pagos_cuotas',           // Pagos y cuotas -> Oficina
        'fisio':         'modulo_fisio',           // Panel fisio -> Despacho fisio
        'familias':      'comunicacion_familias',  // Comunicacion a familias -> Oficina
        'prepfisica':    'modulo_preparacion_fisica', // Preparacion fisica -> Campo compartido
        'scouting':      'scouting'                   // Scouting -> Oficina
    };

    // Ocultar tabs de modulos sin permiso de ver
    // Ocultar Dashboard y TactiClip a roles que no son de campo
    if (!cmState.esAdmin) {
        var CM_CAMPO_KEYS = ['entrenamientos','pizarra','asistencia','matchstats','periodizacion','analisis_postpartido','cuerpo_tecnico_ia'];
        var cmEsRolCampo = CM_CAMPO_KEYS.some(function(k) { return cmPuedeVer(k); });
        if (!cmEsRolCampo) {
            document.querySelectorAll('.main-tab').forEach(function(td) {
                var ocd = td.getAttribute('onclick') || '';
                if (/cambiarModulo\('dashboard'/.test(ocd) || /abrirPromoTactiClip/.test(ocd)) {
                    td.style.setProperty('display', 'none', 'important');
                }
            });
        }
    }

    var tabs = document.querySelectorAll('.main-tab');
    tabs.forEach(function(tab) {
        var onclick = tab.getAttribute('onclick') || '';
        var match = onclick.match(/cambiarModulo\('(\w+)'/);
        if (match) {
            var moduloHUB = match[1];
            var moduloPerm = MAPEO_HUB_PERMISOS[moduloHUB];
            // Si la clave es null (no controlado) o el usuario tiene permiso, dejar visible
            if (moduloPerm && !cmPuedeVer(moduloPerm)) {
                tab.style.setProperty('display', 'none', 'important');
            }
        }
    });

    // ===== Subpestanas del Planificador: control granular por permiso =====
    // Cada subpestana se gobierna por su propia clave. La pestana Planificador
    // se muestra si el rol puede ver CUALQUIERA de sus subpestanas.
    var CM_PLAN_SUBTABS = {
        'crear':            'entrenamientos',
        'mis-sesiones':     'entrenamientos',
        'calendario':       'entrenamientos',
        'asistencia':       'asistencia',
        'cargas':           'cargas',
        'enlaces-wellness': 'wellness',
        'periodizacion':    'periodizacion',
        'modelo-juego':     'modelo_juego'
    };
    var cmPlanAlguna = false;
    var cmPlanPrimera = null;
    var cmPlanCrearVisible = false;
    document.querySelectorAll('.planificador-subtabs .sub-tab').forEach(function(st) {
        var ocSt = st.getAttribute('onclick') || '';
        var mSt = ocSt.match(/cambiarSubTab\('planificador',\s*'([\w-]+)'/);
        if (!mSt) return;
        var permSt = CM_PLAN_SUBTABS[mSt[1]];
        if (permSt && !cmPuedeVer(permSt)) {
            st.style.setProperty('display', 'none', 'important');
        } else {
            cmPlanAlguna = true;
            if (!cmPlanPrimera) cmPlanPrimera = st;
            if (mSt[1] === 'crear') cmPlanCrearVisible = true;
        }
    });
    var cmTabPlan = null;
    tabs.forEach(function(td) {
        var ocTd = td.getAttribute('onclick') || '';
        if (/cambiarModulo\('planificador'/.test(ocTd)) cmTabPlan = td;
    });
    if (cmTabPlan) {
        if (cmPlanAlguna) {
            cmTabPlan.style.removeProperty('display');
        } else {
            cmTabPlan.style.setProperty('display', 'none', 'important');
        }
    }
    // Si no ve "Crear Sesion" (subpestana por defecto), activar la primera visible
    if (cmPlanAlguna && !cmPlanCrearVisible && cmPlanPrimera) {
        try { cmPlanPrimera.click(); } catch (e) {}
    }

    // ===== Pestaña Analista (usa irAAnalista, no cambiarModulo) =====
    var tabAnalista = document.querySelector('.main-tab.analista');
    var cmEsAnalistaVideo = cmPuedeVer('modulo_analista_video');
    var cmVeMatchstats = cmState.esAdmin || cmPuedeVer('matchstats');
    if (tabAnalista && !cmVeMatchstats && !cmEsAnalistaVideo) {
        tabAnalista.style.setProperty('display', 'none', 'important');
    }
    // Analista puro: dentro de Gestion de Competicion solo ve Rivales y Analisis de Rivales
    if (cmEsAnalistaVideo && !cmVeMatchstats) {
        document.querySelectorAll('#modulo-matchstats .sub-tab').forEach(function(st) {
            var ocSub = st.getAttribute('onclick') || '';
            if (!(ocSub.indexOf("'rivales'") > -1 || ocSub.indexOf("'analisisrival'") > -1)) {
                st.style.setProperty('display', 'none', 'important');
            }
        });
    }

    // Mostrar la pestaña "Club" si el usuario es admin del club
    if (cmState.esAdmin) {
        var tabClub = document.getElementById('cm-tab-club');
        if (tabClub) {
            tabClub.style.setProperty('display', 'flex', 'important');
        }
    }

    // ===== PANTALLA "EN DESARROLLO" para roles sin pestañas visibles =====
    // Si el usuario no es admin y no tiene ninguna pestaña funcional visible,
    // su rol no tiene aún panel construido. Mostramos un mensaje claro.
    if (!cmState.esAdmin) {
        var pestanasFuncionales = Array.from(document.querySelectorAll('.main-tab')).filter(function(tab) {
            var oc = tab.getAttribute('onclick') || '';
            var m = oc.match(/cambiarModulo\('(\w+)'/);
            if (!m) return false;
            // Ignorar tacticlip (link externo) y club (manejado aparte)
            return m[1] !== 'tacticlip' && m[1] !== 'club';
        });
        var visibles = pestanasFuncionales.filter(function(tab) {
            return tab.style.display !== 'none';
        });
        var cmTabAnalistaVisible = tabAnalista && tabAnalista.style.display !== 'none';
        if (visibles.length === 0 && !cmTabAnalistaVisible) {
            cmMostrarPantallaDesarrollo();
        }
    }

    // Los botones de edicion los gestionara cada modulo individualmente
    // consultando cmPuedeEditar() cuando renderice
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
