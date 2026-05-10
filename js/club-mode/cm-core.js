// ========== CM-CORE.JS — TopLiderCoach Club Mode ==========
// Sistema de permisos, deteccion de Club Mode y selector de equipo
// Depende de: core.js (supabaseClient, clubId, usuario, registrarInit)
// Ubicacion: js/club-mode/cm-core.js

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
        var { data: miembro } = await supabaseClient
            .from('club_members')
            .select('*, club_roles(*)')
            .eq('club_id', clubId)
            .eq('wp_user_id', usuario.id)
            .eq('active', true)
            .single();

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
            cmState.equipoSeleccionado = encontrado || cmState.equiposAcceso[0];
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

    // Buscar contenedor en el header del HUB
    // TODO: ajustar el id del elemento del HUB cuando se decida la posicion exacta
    var headerClub = document.getElementById('club-badge');
    if (!headerClub) {
        console.log('[Club Mode] Selector de equipo: contenedor no encontrado, se omite');
        return;
    }

    // Crear el contenedor del selector si no existe
    var container = document.getElementById('cm-team-selector');
    if (!container) {
        container = document.createElement('div');
        container.id = 'cm-team-selector';
        container.style.cssText = 'display:inline-flex;align-items:center;gap:8px;margin-left:12px;';
        headerClub.parentNode.insertBefore(container, headerClub.nextSibling);
    }

    // Generar opciones del selector
    var opciones = cmState.equiposAcceso.map(function(e) {
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
    var equipo = cmState.equiposAcceso.find(function(e) { return e.id === teamId; });
    if (!equipo) return;

    cmState.equipoSeleccionado = equipo;
    localStorage.setItem('cm_team_selected', teamId);

    console.log('[Club Mode] Equipo seleccionado: ' + equipo.name);

    // Notificar a los modulos del HUB que el equipo ha cambiado
    if (typeof window.onClubTeamChange === 'function') {
        window.onClubTeamChange(equipo);
    }

    // Disparar evento personalizado
    document.dispatchEvent(new CustomEvent('cmTeamChanged', { detail: equipo }));
}

// ========== SISTEMA DE PERMISOS ==========

// Comprueba si el usuario puede VER un modulo
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

// ========== APLICAR PERMISOS A LA UI DEL HUB ==========
function cmAplicarPermisos() {
    if (!cmState.activo) return;

    // Mapeo de modulos del HUB a claves de permisos en club_roles.permissions
    // TODO 0.3: Extender este mapeo con los 38 modulos del Club Mode completo
    var mapeo = {
        'planificador': 'planificador',
        'pizarra': 'pizarra',
        'matchstats': 'matchstats',
        'asistencia': 'asistencia',
        'miclub': 'mi_club',
        'periodizacion': 'periodizacion',
        'analisis': 'analisis',
        'plan_partido': 'plan_partido',
        'staff': 'staff_ia',
        'dashboard': 'dashboard'
    };

    // Ocultar tabs de modulos sin permiso de ver
    var tabs = document.querySelectorAll('.main-tab');
    tabs.forEach(function(tab) {
        var onclick = tab.getAttribute('onclick') || '';
        var match = onclick.match(/cambiarModulo\('(\w+)'/);
        if (match) {
            var moduloHUB = match[1];
            var moduloPerm = mapeo[moduloHUB];
            if (moduloPerm && !cmPuedeVer(moduloPerm)) {
                tab.style.display = 'none';
            }
        }
    });

    // Los botones de edicion los gestionara cada modulo individualmente
    // consultando cmPuedeEditar() cuando renderice
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

console.log('[Club Mode] cm-core.js cargado');
