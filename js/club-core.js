// ========== CLUB-CORE.JS — TopLiderCoach HUB ==========
// Sistema de permisos, detección de Club Mode y selector de equipo
// Depende de: core.js (supabaseClient, clubId, usuario)
// Depende de: club-utils.js

// ========== ESTADO DEL CLUB MODE ==========
var clubMode = {
    activo: false,             // ¿Tiene Club Mode este club?
    miembro: null,             // Datos del miembro actual (de club_members)
    rol: null,                 // Datos del rol (de club_roles)
    permisos: {},              // Objeto de permisos {modulo: {ver, editar}}
    esAdmin: false,            // ¿Es admin del club?
    teamScope: 'assigned',     // 'all' o 'assigned'
    equipos: [],               // Todos los equipos del club
    equiposAcceso: [],         // Equipos a los que tiene acceso
    equipoSeleccionado: null,  // Equipo actualmente seleccionado
    miembros: [],              // Todos los miembros
    cargos: []                 // Todos los cargos/roles
};

// ========== INICIALIZACIÓN ==========
// Se llama después de que core.js haya inicializado el club
async function clubCoreInit() {
    if (!clubId || !usuario) {
        console.log('Club Mode: sin club o usuario, omitido');
        return;
    }

    try {
        // 1. Comprobar si el usuario es miembro del club (tiene Club Mode)
        var { data: miembro } = await supabaseClient
            .from('club_members')
            .select('*, club_roles(*)')
            .eq('club_id', clubId)
            .eq('wp_user_id', usuario.id)
            .eq('active', true)
            .single();

        if (!miembro) {
            // No es miembro de club → funciona como Coach Mode normal
            console.log('Club Mode: usuario no es miembro, modo Coach');
            clubMode.activo = false;
            return;
        }

        // 2. Activar Club Mode
        clubMode.activo = true;
        clubMode.miembro = miembro;
        clubMode.rol = miembro.club_roles;
        clubMode.permisos = miembro.club_roles ? miembro.club_roles.permissions || {} : {};
        clubMode.esAdmin = miembro.club_roles ? miembro.club_roles.is_admin : false;
        clubMode.teamScope = miembro.club_roles ? miembro.club_roles.team_scope : 'assigned';

        console.log('Club Mode ACTIVO — Rol: ' + (clubMode.rol ? clubMode.rol.name : '?'));

        // 3. Cargar equipos
        await clubCoreCargarEquipos();

        // 4. Determinar equipos accesibles
        if (clubMode.teamScope === 'all' || clubMode.esAdmin) {
            clubMode.equiposAcceso = clubMode.equipos.slice(); // todos
        } else {
            var ids = miembro.team_ids || [];
            clubMode.equiposAcceso = clubMode.equipos.filter(function(e) {
                return ids.includes(e.id);
            });
        }

        // 5. Seleccionar equipo por defecto
        if (clubMode.equiposAcceso.length > 0) {
            // Intentar recuperar el último equipo seleccionado
            var ultimo = localStorage.getItem('club_team_selected');
            var encontrado = null;
            if (ultimo) {
                encontrado = clubMode.equiposAcceso.find(function(e) { return e.id === ultimo; });
            }
            clubMode.equipoSeleccionado = encontrado || clubMode.equiposAcceso[0];
        }

        // 6. Montar el selector de equipo en el header
        clubCoreMontarSelector();

        // 7. Mostrar/ocultar módulos según permisos
        clubCoreAplicarPermisos();

    } catch (e) {
        console.error('Error inicializando Club Mode:', e);
    }
}

// ========== CARGAR EQUIPOS ==========
async function clubCoreCargarEquipos() {
    var { data } = await supabaseClient
        .from('club_teams')
        .select('*')
        .eq('club_id', clubId)
        .eq('active', true)
        .order('category')
        .order('name');
    clubMode.equipos = data || [];
}

// ========== SELECTOR DE EQUIPO ==========
function clubCoreMontarSelector() {
    if (!clubMode.activo || clubMode.equiposAcceso.length === 0) return;

    // Buscar o crear el contenedor del selector
    var container = document.getElementById('club-team-selector');
    if (!container) {
        // Insertar después del nombre del club en el header
        var headerClub = document.getElementById('club-nombre-header');
        if (!headerClub) return;
        container = document.createElement('div');
        container.id = 'club-team-selector';
        container.style.cssText = 'display:inline-flex;align-items:center;gap:8px;margin-left:12px;';
        headerClub.parentNode.insertBefore(container, headerClub.nextSibling);
    }

    var opciones = clubMode.equiposAcceso.map(function(e) {
        var selected = clubMode.equipoSeleccionado && clubMode.equipoSeleccionado.id === e.id ? ' selected' : '';
        var cat = e.category ? ' (' + e.category + ')' : '';
        return '<option value="' + e.id + '"' + selected + '>' + e.name + cat + '</option>';
    }).join('');

    container.innerHTML = '<select id="club-team-select" onchange="clubCoreSeleccionarEquipo(this.value)" ' +
        'style="background:#1a1a2e;border:1px solid rgba(56,130,246,0.3);color:#e2e8f0;padding:5px 10px;' +
        'border-radius:8px;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;outline:none">' +
        opciones + '</select>';
}

// ========== CAMBIAR EQUIPO SELECCIONADO ==========
function clubCoreSeleccionarEquipo(teamId) {
    var equipo = clubMode.equiposAcceso.find(function(e) { return e.id === teamId; });
    if (!equipo) return;

    clubMode.equipoSeleccionado = equipo;
    localStorage.setItem('club_team_selected', teamId);

    console.log('Equipo seleccionado: ' + equipo.name);

    // Notificar a los módulos que el equipo ha cambiado
    // Los módulos pueden escuchar esto para recargar sus datos
    if (typeof window.onClubTeamChange === 'function') {
        window.onClubTeamChange(equipo);
    }

    // Disparar evento personalizado
    document.dispatchEvent(new CustomEvent('clubTeamChanged', { detail: equipo }));
}

// ========== SISTEMA DE PERMISOS ==========

// Comprueba si el usuario puede VER un módulo
function clubPuedeVer(modulo) {
    if (!clubMode.activo) return true; // Coach Mode normal → ve todo lo suyo
    if (clubMode.esAdmin) return true; // Admin ve todo
    var perm = clubMode.permisos[modulo];
    return perm && perm.ver === true;
}

// Comprueba si el usuario puede EDITAR en un módulo
function clubPuedeEditar(modulo) {
    if (!clubMode.activo) return true;
    if (clubMode.esAdmin) return true;
    var perm = clubMode.permisos[modulo];
    return perm && perm.editar === true;
}

// Comprueba si el usuario puede ver un equipo específico
function clubPuedeVerEquipo(teamId) {
    if (!clubMode.activo) return true;
    if (clubMode.esAdmin || clubMode.teamScope === 'all') return true;
    return clubMode.equiposAcceso.some(function(e) { return e.id === teamId; });
}

// ========== APLICAR PERMISOS A LA UI ==========
function clubCoreAplicarPermisos() {
    if (!clubMode.activo) return;

    // Mapeo de módulos del HUB a claves de permisos
    var mapeo = {
        'planificador': 'planificador',
        'ejercicios': 'pizarra',
        'matchstats': 'matchstats',
        'asistencia': 'asistencia',
        'config': 'mi_club',
        'analisis': 'periodizacion'
        // Los módulos nuevos (direccion_deportiva, scouting, economia, personal)
        // se gestionarán cuando se integren en el HUB
    };

    // Ocultar tabs de módulos sin permiso
    var tabs = document.querySelectorAll('.main-tab');
    tabs.forEach(function(tab) {
        var onclick = tab.getAttribute('onclick') || '';
        var match = onclick.match(/cambiarModulo\('(\w+)'/);
        if (match) {
            var moduloHUB = match[1];
            var moduloPerm = mapeo[moduloHUB];
            if (moduloPerm && !clubPuedeVer(moduloPerm)) {
                tab.style.display = 'none';
            }
        }
    });

    // Ocultar botones de edición si no tiene permiso de editar
    // Esto lo gestionará cada módulo individualmente consultando clubPuedeEditar()
}

// ========== HELPERS PARA MÓDULOS ==========

// Devuelve el equipo actualmente seleccionado
function clubGetEquipoActual() {
    return clubMode.equipoSeleccionado;
}

// Devuelve el ID del equipo seleccionado
function clubGetTeamId() {
    if (clubMode.activo && clubMode.equipoSeleccionado) {
        return clubMode.equipoSeleccionado.id;
    }
    return null;
}

// Devuelve el nombre del rol del usuario actual
function clubGetRolNombre() {
    return clubMode.rol ? clubMode.rol.name : 'Coach';
}

// Devuelve true si el Club Mode está activo
function clubEsClubMode() {
    return clubMode.activo;
}

// ========== REGISTRO EN EL SISTEMA DE MÓDULOS ==========
// Se ejecuta al cargar el DOM, después de que core.js haya corrido
registrarInit(function() {
    // Esperar un poco para que inicializarClub() termine
    setTimeout(function() {
        clubCoreInit();
    }, 500);
});

console.log('Club Core registrado');
