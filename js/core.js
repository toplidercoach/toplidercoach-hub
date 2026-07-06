// ========== CORE.JS - TopLiderCoach HUB ==========
// Configuración, estado global, autenticación y navegación

// ========== CONFIGURACIÓN ==========
const API_BASE = 'https://toplidercoach.com/wp-json/toplider/v1';
const SUPABASE_URL = 'https://cqteodxyvavyroxeshoz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdGVvZHh5dmF2eXJveGVzaG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzc2OTksImV4cCI6MjA4MDg1MzY5OX0.8sJC6twae2pnrf8NDVlOV2KnSOhBC1RrqWC0IiuE614';

let supabaseClient = null;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase configurado');
} catch (e) {
    console.error('Error Supabase:', e);
}

// ========== ESTADO GLOBAL ==========
let usuario = null;
let token = null;
let clubId = null;
let seasonId = null;
let clubData = null;

// Planificador
let ejercicioSeleccionado = null;
let paginaEjercicios = 1;
let sesion = { nombre: '', fecha: '', calentamiento: [], principal: [], enfriamiento: [] };
let calendarioMesSesiones = new Date().getMonth();
let calendarioAnioSesiones = new Date().getFullYear();
let calendarioMesPartidos = new Date().getMonth();
let calendarioAnioPartidos = new Date().getFullYear();
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// MatchStats
let filtroPartidos = 'todos';
let convocadosPartido = [];
let titularesPartido = [];
let plantillaPartido = [];

// Config
let jugadorEditando = null;

// Asistencia
let sesionAsistenciaActual = null;
let asistenciaMesActual = new Date().toISOString().slice(0, 7);

// Dashboard
let chartResultados = null;
let chartGoles = null;

// ========== SISTEMA DE MÓDULOS ==========
// Los módulos se registran aquí para desacoplar la navegación
const _moduleHandlers = {
    onModuleChange: {},
    onSubTabChange: {},
    onAppInit: []
};

function registrarModulo(modulo, callback) {
    _moduleHandlers.onModuleChange[modulo] = callback;
}

function registrarSubTab(modulo, subtab, callback) {
    _moduleHandlers.onSubTabChange[modulo + '-' + subtab] = callback;
}

function registrarInit(callback) {
    _moduleHandlers.onAppInit.push(callback);
}

// ========== AUTENTICACIÓN ==========
// Dos caminos independientes:
//   1) WordPress  -> entrenador autonomo (Plan Entrenador). SIN CAMBIOS, va primero.
//   2) Supabase   -> miembro de club (Plan Club). Solo si WordPress no reconoce al usuario.
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    if (!username || !password) {
        errorDiv.textContent = 'Por favor, introduce usuario y contrasena';
        errorDiv.style.display = 'block';
        return;
    }

    // ===== 1) WordPress (entrenador autonomo) — flujo original intacto =====
    let wpMessage = null;
    try {
        const response = await fetch(API_BASE + '/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            usuario = data.user;
            token = data.token;
            window.cmAuthSource = 'wp';
            localStorage.setItem('hub_user', JSON.stringify(usuario));
            localStorage.setItem('hub_token', token);
            localStorage.removeItem('cm_auth');
            mostrarApp();
            return;
        } else {
            wpMessage = data.message || null;
        }
    } catch (error) {
        // Sin conexion con WordPress: seguimos probando el camino de club
    }

    // ===== 2) Supabase Auth (miembro de club) =====
    try {
        const { data: sb, error } = await supabaseClient.auth.signInWithPassword({
            email: username,
            password: password
        });

        if (!error && sb && sb.user) {
            const acc = await cmResolverAcceso(sb.user);
            if (acc.ok) {
                usuario = acc.usuario;
                token = sb.session ? sb.session.access_token : null;
                window.cmAuthSource = 'supabase';
                localStorage.setItem('hub_user', JSON.stringify(usuario));
                localStorage.setItem('cm_auth', 'supabase');
                localStorage.removeItem('hub_token');
                mostrarApp();
                return;
            } else {
                // Credenciales validas pero sin acceso (sin club o licencia inactiva)
                await supabaseClient.auth.signOut();
                errorDiv.textContent = acc.motivo;
                errorDiv.style.display = 'block';
                return;
            }
        }
    } catch (e) {
        // Ignorar: caemos al mensaje final
    }

    // ===== 3) Ninguno reconocio al usuario =====
    errorDiv.textContent = wpMessage || 'Usuario o contrasena incorrectos';
    errorDiv.style.display = 'block';
}

// ===== CLUB MODE: resolver acceso de un miembro autenticado por Supabase Auth =====
// Comprueba que es miembro ACTIVO de un club con LICENCIA ACTIVA.
// Devuelve { ok:true, usuario } o { ok:false, motivo }.
async function cmResolverAcceso(authUser) {
    try {
        const { data: m } = await supabaseClient
            .from('club_members')
            .select('*')
            .eq('auth_user_id', authUser.id)
            .eq('active', true)
            .limit(1)
            .maybeSingle();

        if (!m) {
            return { ok: false, motivo: 'Tu cuenta no pertenece a ningun club activo.' };
        }

        const { data: c } = await supabaseClient
            .from('clubs')
            .select('*')
            .eq('id', m.club_id)
            .maybeSingle();

        if (!c) {
            return { ok: false, motivo: 'No se encontro el club asociado a tu cuenta.' };
        }

        const licenciaActiva = c.license_status === 'active' &&
            (!c.license_valid_until || new Date(c.license_valid_until) > new Date());

        if (!licenciaActiva) {
            return { ok: false, motivo: 'Tu club no tiene una licencia activa. Contacta con el administrador del club.' };
        }

        // Dejar preparado el club y la ficha de miembro para inicializarClub() y cm-core.js
        window.__cm_club = c;
        window.__cm_membership = m;

        const usuarioObj = {
            id: m.id,                                 // id de la fila club_members
            name: m.display_name || authUser.email,
            display_name: m.display_name || authUser.email,
            email: m.email || authUser.email,
            tipo: 'club_supabase',
            authUid: authUser.id
        };
        return { ok: true, usuario: usuarioObj };
    } catch (e) {
        console.error('[Club Mode] Error resolviendo acceso:', e);
        return { ok: false, motivo: 'Error comprobando el acceso. Intentalo de nuevo.' };
    }
}

function logout() {
    localStorage.removeItem('hub_user');
    localStorage.removeItem('hub_token');
    localStorage.removeItem('cm_auth');
    try { if (supabaseClient && supabaseClient.auth) supabaseClient.auth.signOut(); } catch (e) {}
    location.reload();
}

async function mostrarApp() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('user-name').textContent = usuario.name;
    
    await inicializarClub();
    
    // Inicializar fecha de sesion
    const fechaInput = document.getElementById('sesion-fecha');
    if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
    
    // Ejecutar todas las funciones init registradas por los módulos
    for (let i = 0; i < _moduleHandlers.onAppInit.length; i++) {
        try {
            _moduleHandlers.onAppInit[i]();
        } catch(e) {
            console.error('Error en init de módulo:', e);
        }
    }
}

// ========== CLUB & TEMPORADA ==========
async function inicializarClub() {
    try {
        let club = null;

        // ===== Club Mode por Supabase Auth: el club ya se resolvio en el login =====
        if (window.cmAuthSource === 'supabase' && window.__cm_club) {
            club = window.__cm_club;
            clubId = club.id;
            clubData = club;

            document.getElementById('club-nombre-header').textContent = club.name;
            const iniSb = club.name ? club.name.charAt(0).toUpperCase() : '?';
            document.getElementById('club-initial').textContent = iniSb;
            if (club.logo_url) {
                document.getElementById('club-badge').innerHTML =
                    '<img src="' + club.logo_url + '" alt="">' +
                    '<span>' + club.name + '</span>';
            }

            // Hook accepted_at: primer login del miembro
            if (window.__cm_membership && window.__cm_membership.accepted_at === null) {
                await supabaseClient
                    .from('club_members')
                    .update({ accepted_at: new Date().toISOString() })
                    .eq('id', window.__cm_membership.id);
                console.log('[Club Mode] Primer login del miembro registrado (accepted_at)');
            }

            await cargarTemporadaActiva();
            return;
        }

        // 0.7.A — PRIORIDAD CLUB MODE: ¿es miembro activo de algún club? (camino WordPress)
        const { data: memberRow } = await supabaseClient
            .from('club_members')
            .select('id, accepted_at, club_id, role_id, team_ids, club_roles(name, is_admin, permissions, team_scope)')
            .eq('wp_user_id', usuario.id)
            .eq('active', true)
            .limit(1)
            .maybeSingle();

        if (memberRow && memberRow.club_id) {
            const { data: clubMembership } = await supabaseClient
                .from('clubs')
                .select('*')
                .eq('id', memberRow.club_id)
                .maybeSingle();
            if (clubMembership) {
                club = clubMembership;
                window.__cm_membership = memberRow; // para cm-core.js

                // 0.8.A — Hook accepted_at: primera vez que entra el miembro
                if (memberRow.accepted_at === null) {
                    await supabaseClient
                        .from('club_members')
                        .update({ accepted_at: new Date().toISOString() })
                        .eq('id', memberRow.id);
                    console.log('[Club Mode] Primer login del miembro registrado (accepted_at)');
                }
            }
        }

        // Si no es miembro, buscar como dueño (lógica original)
        if (!club) {
            const { data: clubPropio } = await supabaseClient
                .from('clubs')
                .select('*')
                .eq('wp_user_id', usuario.id)
                .maybeSingle();
            if (clubPropio) {
                club = clubPropio;
            } else {
                const { data: nuevoClub } = await supabaseClient
                    .from('clubs')
                    .insert({
                        wp_user_id: usuario.id,
                        name: usuario.name || 'Mi Club',
                        team_format: '11',
                        max_players: 30
                    })
                    .select()
                    .single();
                club = nuevoClub;
            }
        }
        
        clubId = club.id;
        clubData = club;
        
        // Actualizar header
        document.getElementById('club-nombre-header').textContent = club.name;
        const inicial = club.name ? club.name.charAt(0).toUpperCase() : '?';
        document.getElementById('club-initial').textContent = inicial;
        
        if (club.logo_url) {
            document.getElementById('club-badge').innerHTML =
                '<img src="' + club.logo_url + '" alt="">' +
                '<span>' + club.name + '</span>';
        }
        
        await cargarTemporadaActiva();
        
    } catch (error) {
        console.error('Error inicializando club:', error);
    }
}

async function cargarTemporadaActiva() {
    try {
        const { data: temporada, error } = await supabaseClient
            .from('seasons')
            .select('*')
            .eq('club_id', clubId)
            .eq('is_active', true)
            .single();
        
        if (error && error.code === 'PGRST116') {
            await crearTemporadaPorDefecto();
        } else if (!error) {
            seasonId = temporada.id;
        }
    } catch (error) {
        console.error('Error cargando temporada:', error);
    }
}

async function crearTemporadaPorDefecto() {
    const hoy = new Date();
    const mes = hoy.getMonth();
    const anio = hoy.getFullYear();
    
    let nombreTemp = mes >= 7 ? anio + '/' + (anio + 1) : (anio - 1) + '/' + anio;
    let inicioTemp = mes >= 7 ? anio + '-08-01' : (anio - 1) + '-08-01';
    let finTemp = mes >= 7 ? (anio + 1) + '-06-30' : anio + '-06-30';
    
    const { data: nuevaTemp } = await supabaseClient
        .from('seasons')
        .insert({
            club_id: clubId,
            name: nombreTemp,
            start_date: inicioTemp,
            end_date: finTemp,
            is_active: true
        })
        .select()
        .single();
    
    seasonId = nuevaTemp.id;
}

// ========== NAVEGACIÓN ==========
function cambiarModulo(modulo, tab) {
    document.querySelectorAll('.main-tab').forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    
    document.querySelectorAll('.vista-modulo').forEach(function(v) { v.classList.remove('active'); });
    document.getElementById('modulo-' + modulo).classList.add('active');
    
    // Ejecutar handler registrado por el módulo
    if (_moduleHandlers.onModuleChange[modulo]) {
        try {
            _moduleHandlers.onModuleChange[modulo]();
        } catch(e) {
            console.error('Error al cambiar a módulo ' + modulo + ':', e);
        }
    }
}

function irAAnalista(tab) {
    var btnMatchstats = document.querySelector('.main-tab.matchstats');
    cambiarModulo('matchstats', btnMatchstats);
    document.querySelectorAll('.main-tab').forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    var btnPlan = document.querySelector('#modulo-matchstats .sub-tab[onclick*="analisisrival"]');
    if (btnPlan) cambiarSubTab('matchstats', 'analisisrival', btnPlan);
}

function cambiarSubTab(modulo, subtab, btn) {
    var container = document.getElementById('modulo-' + modulo);
    container.querySelectorAll('.sub-tab').forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');
    
    container.querySelectorAll('.vista-contenido').forEach(function(v) { v.classList.remove('active'); });
    document.getElementById(modulo + '-' + subtab).classList.add('active');
    
    // Ejecutar handler registrado por el módulo
    var key = modulo + '-' + subtab;
    if (_moduleHandlers.onSubTabChange[key]) {
        try {
            _moduleHandlers.onSubTabChange[key]();
        } catch(e) {
            console.error('Error al cambiar a subtab ' + key + ':', e);
        }
    }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async function() {
    // Restaurar sesion de miembro de club (Supabase Auth) si la hay
    if (localStorage.getItem('cm_auth') === 'supabase') {
        try {
            const { data: s } = await supabaseClient.auth.getSession();
            if (s && s.session && s.session.user) {
                const acc = await cmResolverAcceso(s.session.user);
                if (acc.ok) {
                    usuario = acc.usuario;
                    token = s.session.access_token;
                    window.cmAuthSource = 'supabase';
                    mostrarApp();
                    return;
                }
            }
            // Sesion invalida o sin acceso: limpiar
            await supabaseClient.auth.signOut();
            localStorage.removeItem('cm_auth');
        } catch (e) {
            localStorage.removeItem('cm_auth');
        }
    }

    // Sesion WordPress (entrenador autonomo) — igual que hoy
    var savedUser = localStorage.getItem('hub_user');
    var savedToken = localStorage.getItem('hub_token');

    if (savedUser && savedToken) {
        usuario = JSON.parse(savedUser);
        token = savedToken;
        window.cmAuthSource = 'wp';
        mostrarApp();
    }

    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
});
// ---- Toast universal (reemplazo de alert) ----
function showToast(msg, type = 'success', duration = 3000) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
        position:'fixed', bottom:'30px', left:'50%', transform:'translateX(-50%)',
        padding:'12px 24px', borderRadius:'8px', color:'#fff', fontSize:'14px',
        fontWeight:'500', zIndex:'99999', opacity:'0', transition:'opacity 0.3s',
        background: type==='error' ? '#ef4444' : type==='warning' ? '#f59e0b' : '#22c55e',
        boxShadow:'0 4px 12px rgba(0,0,0,0.3)'
    });
    document.body.appendChild(t);
    requestAnimationFrame(() => t.style.opacity = '1');
    setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 300); }, duration);
}
// ---- Confirm personalizado (reemplazo de confirm) ----
function showConfirm(msg) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position:'fixed', top:'0', left:'0', width:'100%', height:'100%',
            background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center',
            justifyContent:'center', zIndex:'99999'
        });
        const box = document.createElement('div');
        Object.assign(box.style, {
            background:'#1e293b', borderRadius:'12px', padding:'24px',
            maxWidth:'400px', width:'90%', color:'#fff', textAlign:'center',
            boxShadow:'0 8px 24px rgba(0,0,0,0.4)'
        });
        box.innerHTML = '<p style="margin:0 0 20px;font-size:15px;">' + msg + '</p>' +
            '<div style="display:flex;gap:12px;justify-content:center">' +
            '<button id="cf-cancel" style="padding:8px 24px;border-radius:6px;border:1px solid #475569;background:transparent;color:#fff;cursor:pointer">Cancelar</button>' +
            '<button id="cf-ok" style="padding:8px 24px;border-radius:6px;border:none;background:#3b82f6;color:#fff;cursor:pointer;font-weight:600">Aceptar</button>' +
            '</div>';
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        box.querySelector('#cf-ok').onclick = () => { overlay.remove(); resolve(true); };
        box.querySelector('#cf-cancel').onclick = () => { overlay.remove(); resolve(false); };
        overlay.onclick = (e) => { if(e.target === overlay) { overlay.remove(); resolve(false); } };
    });
}