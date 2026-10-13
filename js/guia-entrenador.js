// ============================================================
// GUIA DEL ENTRENADOR (guia-entrenador.js)
// Guia de primeros pasos para el entrenador autonomo (Plan Entrenador):
//   - 5 retos "imprescindibles" que se marcan SOLOS cuando los hace de verdad
//   - 7 visitas guiadas de 1 minuto (foco en pantalla + voz) por el resto de secciones
//   - Equipo de ejemplo: se carga y se borra con un boton (solo borra lo que el creo)
// Pensada para NO estorbar:
//   - La bienvenida sale una sola vez, y solo a cuentas nuevas o en prueba, sin datos propios
//   - Nada arranca solo: los recorridos empiezan unicamente al pulsar
//   - El boton flotante desaparece al completar los retos, a los 30 dias, o al pulsar "Ocultar"
//   - Queda siempre un enlace discreto "Guia" en la cabecera
// No actua en Modo Club ni en la demo. Datos: tablas guia_entrenador / guia_ejemplo_filas (RPC tlc_guia_* y tlc_ejemplo_*).
// ============================================================
(function () {
    'use strict';
    var DIAS_NUEVO = 30;                       // dias en los que una cuenta se considera "nueva"
    var E = null;                              // estado devuelto por tlc_guia_estado
    var ultimaLectura = 0, leyendo = false;
    var avisados = {};                         // retos ya felicitados en esta visita

    /* ---------- Utilidades ---------- */
    function $(s, r) { return (r || document).querySelector(s); }
    function visible(el) { return el && el.offsetParent !== null && el.getBoundingClientRect().width > 0; }
    function esc(t) { return String(t === null || t === undefined ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function waitFor(fn, ms, cb) {
        var t0 = Date.now();
        (function loop() {
            var r = null; try { r = fn(); } catch (e) {}
            if (r) return cb(r);
            if (Date.now() - t0 > ms) return cb(null);
            setTimeout(loop, 150);
        })();
    }
    function aviso(msg, tipo) { try { if (typeof showToast === 'function') showToast(msg, tipo || 'success', 3500); } catch (e) {} }
    function club() { try { return (typeof clubId !== 'undefined') ? clubId : null; } catch (e) { return null; } }
    function user() { try { return (typeof usuario !== 'undefined') ? usuario : null; } catch (e) { return null; } }
    function enPrueba() { var u = user(); return !!(u && u.prueba && Number(u.prueba.hasta) > 0); }
    function diasClub() {
        try {
            var c = (typeof clubData !== 'undefined') ? clubData : null;
            if (!c || !c.created_at) return 9999;
            return (Date.now() - new Date(c.created_at).getTime()) / 86400000;
        } catch (e) { return 9999; }
    }
    function elegible() {
        if (window.cmAuthSource !== 'wp') return false;                       // solo entrenador autonomo
        if (window.cmState && window.cmState.activo) return false;            // nunca en Modo Club
        try { if (localStorage.getItem('hub_token') === 'demo') return false; } catch (e) {}
        return !!club() && typeof supabaseClient !== 'undefined' && !!supabaseClient;
    }
    function rpc(fn, args) {
        return supabaseClient.rpc(fn, args).then(function (r) { return (r && !r.error) ? r.data : null; }).catch(function () { return null; });
    }

    /* ---------- Navegacion ---------- */
    function mod(m) { return function () { var t = $('.main-tab.' + m); if (t && typeof cambiarModulo === 'function') cambiarModulo(m, t); }; }
    function sub(m, s) {
        return function () {
            mod(m)();
            var b = $('#modulo-' + m + ' .sub-tab[onclick*="\'' + s + '\'"]');
            if (b && typeof cambiarSubTab === 'function') cambiarSubTab(m, s, b);
        };
    }

    /* ---------- Contenido: retos y visitas ---------- */
    var RETOS = [
        { id: 'jugadores', ico: '👥', title: 'Añade a tus jugadores', sub: 'Tu plantilla, con dorsal y posición',
          hecho: function () { return E.reales.jugadores > 0; }, steps: [
            { go: sub('config', 'plantilla'), sel: '#lista-jugadores .add-jugador-card', title: 'Tu plantilla', text: 'Aquí vive tu equipo. Pulsa <b>Añadir jugador</b> y rellena nombre, dorsal y posición. Con eso ya puedes pasar lista, hacer convocatorias y llevar las estadísticas de cada uno.' },
            { sel: '#plantilla-contador', title: 'Hasta 40 jugadores', text: 'No hace falta meterlos todos hoy: con cuatro o cinco ya puedes probar el resto del planificador.' }
        ] },
        { id: 'sesiones', ico: '📋', title: 'Crea tu primera sesión', sub: 'Con ejercicios de la biblioteca',
          hecho: function () { return E.reales.sesiones > 0; }, steps: [
            { go: sub('planificador', 'crear'), sel: '#sesion-nombre', title: 'Ponle nombre y fecha', text: 'Empieza por el nombre de la sesión y el día. Lo demás es opcional.' },
            { sel: '#lista-ejercicios', title: 'La biblioteca de ejercicios', text: 'Más de 2.500 ejercicios de los mejores entrenadores. Filtra por tema o por entrenador y arrastra el que te guste a la parte de la sesión que quieras.' },
            { sel: '#lista-principal', title: 'Tu sesión', text: 'Aquí se va montando: calentamiento, parte principal y vuelta a la calma. Puedes cambiar los minutos, reordenar y añadir bloques libres con tus propios ejercicios.' },
            { sel: 'button[onclick="guardarSesion()"]', title: 'Guárdala', text: 'Pulsa <b>Guardar sesión</b> y quedará en Mis Sesiones y en el calendario.' }
        ] },
        { id: 'pdf', ico: '📄', title: 'Descárgala en PDF', sub: 'Lista para llevar al campo',
          hecho: function () { return !!E.hechos.pdf; }, steps: [
            { go: sub('planificador', 'crear'), sel: 'button[onclick="accionRapidaSesion(\'pdf\')"]', title: 'Tu sesión en PDF', text: 'Con una sesión abierta, este botón la guarda y genera el PDF con los gráficos, los tiempos y los objetivos. Es lo que imprimes o mandas al cuerpo técnico.' },
            { go: sub('planificador', 'mis-sesiones'), sel: '#planificador-mis-sesiones', title: 'También desde Mis Sesiones', text: 'Cada sesión guardada tiene su botón de PDF. Ábrelo una vez y el reto se marca solo.' }
        ] },
        { id: 'partidos', ico: '⚽', title: 'Registra un partido', sub: 'Convocatoria, resultado y minutos',
          hecho: function () { return E.reales.partidos > 0; }, steps: [
            { go: sub('matchstats', 'partidos'), sel: 'button[onclick="abrirModalPartido()"]', title: 'Nuevo partido', text: 'Pulsa <b>Nuevo partido</b>: rival, fecha y si juegas en casa o fuera. Puedes crear tanto los jugados como los que vienen.' },
            { sel: '#lista-partidos', title: 'Todo sobre cada partido', text: 'Al abrir un partido preparas la convocatoria y la alineación, y después apuntas el resultado, los goles y los minutos. Las estadísticas de la temporada se calculan solas.' }
        ] },
        { id: 'asistencia', ico: '✅', title: 'Pasa lista y apunta el RPE', sub: 'El control de cargas sale solo',
          hecho: function () { return E.reales.asistencia > 0; }, steps: [
            { go: sub('planificador', 'crear'), sel: 'button[onclick="accionRapidaSesion(\'asistencia\')"]', title: 'Pasar lista', text: 'Con una sesión abierta, este botón abre la asistencia: quién ha venido, quién falta y por qué, y el esfuerzo percibido de cada jugador.' },
            { go: sub('planificador', 'asistencia'), sel: '#asistencia-resumen', title: 'El resumen de asistencia', text: 'Porcentaje de cada jugador en el periodo que elijas, con su PDF.' },
            { go: sub('planificador', 'cargas'), sel: '#planificador-cargas', title: 'Control de cargas', text: 'Con el RPE y los minutos, el planificador calcula la carga de cada jugador y te avisa de quién va pasado o corto. Sin hojas de cálculo.' }
        ] }
    ];
    var VISITAS = [
        { id: 'calendario', ico: '🗓️', title: 'Calendario', sub: 'La temporada de un vistazo', steps: [
            { go: sub('planificador', 'calendario'), sel: '#planificador-calendario', title: 'Tu calendario', text: 'Sesiones y partidos en el mismo mes. Pulsa un día para abrir lo que hay, o descárgalo en PDF para colgarlo en el vestuario.' }
        ] },
        { id: 'periodizacion', ico: '📅', title: 'Periodización', sub: 'Macro, meso y microciclos', steps: [
            { go: sub('planificador', 'periodizacion'), sel: '#planificador-periodizacion', title: 'Planifica la temporada', text: 'Divide el año en macrociclos, mesociclos y microciclos. Cada bloque tiene su objetivo y sus fechas.' },
            { sel: '#planificador-periodizacion', title: 'Abre un microciclo', text: 'Al pulsar una semana ves sus sesiones, los minutos, el RPE medio, la asistencia y la carga de cada jugador día a día.' }
        ] },
        { id: 'wellness', ico: '🔗', title: 'Enlace wellness', sub: 'Tus jugadores responden desde el móvil', steps: [
            { go: sub('planificador', 'enlaces-wellness'), sel: '#planificador-enlaces-wellness', title: 'Un enlace por jugador', text: 'Cada jugador tiene su enlace personal. Antes de entrenar dice cómo ha dormido y cómo se encuentra; después, el esfuerzo de la sesión. Tarda diez segundos y no necesita cuenta.' },
            { sel: '#planificador-enlaces-wellness', title: 'Mándalo por WhatsApp', text: 'Copia el enlace o envíalo directamente. Las respuestas aparecen solas en la asistencia y en el control de cargas.' }
        ] },
        { id: 'modelo', ico: '🧠', title: 'Modelo de juego', sub: 'Tus principios, por momentos', steps: [
            { go: sub('planificador', 'modelo-juego'), sel: '#planificador-modelo-juego', title: 'Cómo quieres jugar', text: 'Escribe tus principios de ataque, defensa, transiciones y balón parado, con sus subprincipios. Luego marcas en cada sesión qué has trabajado y ves qué tienes olvidado.' }
        ] },
        { id: 'planpartido', ico: '🎯', title: 'Plan de partido', sub: 'La semana enfocada al rival', steps: [
            { go: sub('matchstats', 'planpartido'), sel: '#matchstats-planpartido', title: 'Prepara el domingo', text: 'Elige un partido y monta el plan: cómo juega el rival, tus objetivos, la alineación, el balón parado y el reparto de la semana. Sale en un PDF para la charla.' }
        ] },
        { id: 'pizarra', ico: '✏️', title: 'Pizarra táctica', sub: 'Dibuja y anima jugadas', steps: [
            { go: mod('pizarra'), sel: '#modulo-pizarra', title: 'Tu pizarra', text: 'Coloca jugadores, dibuja movimientos y anima la jugada. Lo que dibujes lo puedes guardar como ejercicio propio o llevarlo al plan de partido.' }
        ] },
        { id: 'asistentes', ico: '🤖', title: 'Tu cuerpo técnico', sub: 'Tres asistentes con IA', steps: [
            { go: mod('staff'), sel: '#modulo-staff', title: 'Pregunta a tus asistentes', text: 'Un segundo entrenador, un preparador físico y un analista. Pídeles una sesión para un objetivo concreto, ideas para un rival o una vuelta de tuerca a tu semana.' }
        ] }
    ];

    /* ---------- Voz ---------- */
    var mudo = false, vozES = null;
    try { mudo = localStorage.getItem('tlc_guia_mudo') === '1'; } catch (e) {}
    function elegirVoz() {
        if (!('speechSynthesis' in window)) return;
        var vs = speechSynthesis.getVoices().filter(function (v) { return /^es/i.test(v.lang); });
        vozES = vs.filter(function (v) { return /es-ES/i.test(v.lang) && /google|natural|premium|monica|mónica|helena/i.test(v.name); })[0] || vs.filter(function (v) { return /es-ES/i.test(v.lang); })[0] || vs[0] || null;
    }
    if ('speechSynthesis' in window) { elegirVoz(); try { speechSynthesis.addEventListener('voiceschanged', elegirVoz); } catch (e) {} }
    function hablar(t) {
        if (mudo || !t || !('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        var texto = t.replace(/<[^>]+>/g, '');
        clearTimeout(hablar._t);
        hablar._t = setTimeout(function () {
            var u = new SpeechSynthesisUtterance(texto); u.lang = 'es-ES'; if (vozES) u.voice = vozES;
            speechSynthesis.speak(u);
        }, 260);
    }
    function callar() { clearTimeout(hablar._t); if ('speechSynthesis' in window) speechSynthesis.cancel(); }

    /* ---------- Estilos ---------- */
    var css = ''
    + '#tg-link{font:600 13px system-ui,sans-serif;color:inherit;background:rgba(148,163,184,.16);border:1px solid rgba(148,163,184,.35);border-radius:999px;padding:5px 12px;margin-right:8px;cursor:pointer;white-space:nowrap}'
    + '#tg-link:hover{background:rgba(148,163,184,.28)}'
    + '#tg-link.ej{border-color:#f59e0b;color:#b45309;background:#fffbeb}'
    + '#tg-pill{position:fixed;right:18px;bottom:18px;z-index:9000;display:flex;align-items:center;gap:8px;background:#0f172a;color:#fff;border:1px solid rgba(245,158,11,.6);border-radius:999px;padding:9px 8px 9px 14px;font:600 14px system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3);cursor:pointer}'
    + '#tg-pill .n{background:#f59e0b;color:#1a1200;border-radius:999px;padding:2px 9px;font-size:12.5px;font-weight:700}'
    + '#tg-pill .x{background:none;border:0;color:rgba(255,255,255,.6);font-size:17px;line-height:1;cursor:pointer;padding:2px 6px}'
    + '#tg-pill .x:hover{color:#fff}'
    + '#tg-panel{position:fixed;right:18px;bottom:18px;z-index:9001;width:370px;max-width:calc(100vw - 24px);max-height:calc(100vh - 36px);display:flex;flex-direction:column;background:#fff;color:#0f172a;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.4);font:14px/1.4 system-ui,sans-serif;overflow:hidden}'
    + '#tg-panel .hd{display:flex;align-items:center;gap:10px;padding:14px 14px 14px 16px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff}'
    + '#tg-panel .hd b{font-size:16px;flex:1}'
    + '#tg-panel .hd button{background:none;border:0;color:#fff;font-size:17px;cursor:pointer;opacity:.85;padding:2px 6px}'
    + '#tg-panel .bd{padding:6px 12px 12px;overflow-y:auto}'
    + '#tg-panel h5{margin:12px 4px 4px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#64748b;display:flex;justify-content:space-between}'
    + '#tg-panel h5 span{color:#b45309;font-weight:700}'
    + '#tg-panel .bar{height:5px;border-radius:9px;background:#e2e8f0;margin:0 4px 6px;overflow:hidden}'
    + '#tg-panel .bar i{display:block;height:100%;background:#f59e0b;border-radius:9px}'
    + '#tg-panel .it{display:flex;gap:10px;align-items:center;padding:8px;border-radius:10px}'
    + '#tg-panel .it:hover{background:#f8fafc}'
    + '#tg-panel .it .ic{width:32px;height:32px;border-radius:8px;background:#f1f5f9;display:grid;place-items:center;font-size:16px;flex-shrink:0}'
    + '#tg-panel .it.done .ic{background:#dcfce7}'
    + '#tg-panel .it .tx{flex:1;min-width:0}'
    + '#tg-panel .it b{display:block;font-size:14px}'
    + '#tg-panel .it small{color:#64748b;font-size:12.5px}'
    + '#tg-panel .it.done b{color:#64748b}'
    + '#tg-panel .it button{flex-shrink:0;font:600 12.5px system-ui,sans-serif;border:1px solid #cbd5e1;background:#fff;color:#0f172a;border-radius:8px;padding:6px 10px;cursor:pointer}'
    + '#tg-panel .it button:hover{background:#f1f5f9}'
    + '#tg-panel .ej{margin:12px 4px 4px;padding:12px;border-radius:12px;background:#fffbeb;border:1px solid #fde68a;font-size:13px;color:#78350f}'
    + '#tg-panel .ej b{display:block;font-size:14px;color:#0f172a;margin-bottom:2px}'
    + '#tg-panel .ej button{margin-top:8px;font:700 13px system-ui,sans-serif;border:0;border-radius:8px;padding:8px 12px;cursor:pointer;background:#0f172a;color:#fff}'
    + '#tg-panel .ej button.del{background:#fff;color:#b91c1c;border:1px solid #fca5a5}'
    + '#tg-panel .ft{display:flex;justify-content:space-between;gap:8px;padding:8px 14px 12px;border-top:1px solid #f1f5f9}'
    + '#tg-panel .ft button{background:none;border:0;color:#64748b;font:500 12.5px system-ui,sans-serif;cursor:pointer;padding:4px}'
    + '#tg-panel .ft button:hover{color:#0f172a;text-decoration:underline}'
    + '#tg-shade{position:fixed;inset:0;z-index:9995;pointer-events:none}'
    + '#tg-hl{position:absolute;border-radius:10px;box-shadow:0 0 0 9999px rgba(15,23,42,.72),0 0 0 3px #f59e0b;transition:top .25s,left .25s,width .25s,height .25s;pointer-events:none}'
    + '#tg-box{position:fixed;z-index:9996;width:min(380px,calc(100vw - 24px));background:#fff;color:#0f172a;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:18px 18px 14px;font:15px/1.5 system-ui,sans-serif}'
    + '#tg-box .step{font-size:12px;font-weight:700;letter-spacing:.06em;color:#b45309;margin-bottom:6px}'
    + '#tg-box h4{margin:0 0 6px;font-size:19px;line-height:1.2;font-weight:700}'
    + '#tg-box p{margin:0;color:#334155}'
    + '#tg-box .acts{display:flex;align-items:center;gap:8px;margin-top:14px}'
    + '#tg-box .acts .sp{flex:1}'
    + '#tg-box button{font:inherit;font-size:14px;font-weight:600;border:0;border-radius:8px;padding:9px 14px;cursor:pointer}'
    + '#tg-box .next{background:#f59e0b;color:#1a1200}'
    + '#tg-box .prev{background:#e2e8f0;color:#0f172a}'
    + '#tg-box .skip{background:none;color:#64748b;padding:9px 6px}'
    + '#tg-box .vz{background:none;color:#64748b;padding:9px 4px;font-size:16px}'
    + '#tg-modal{position:fixed;inset:0;z-index:9997;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;padding:18px;font:15px/1.5 system-ui,sans-serif}'
    + '#tg-modal .c{background:#fff;color:#0f172a;border-radius:18px;max-width:480px;width:100%;padding:26px 24px 20px;box-shadow:0 24px 60px rgba(0,0,0,.4)}'
    + '#tg-modal h3{margin:0 0 8px;font-size:23px;line-height:1.2;font-weight:800}'
    + '#tg-modal p{margin:0 0 14px;color:#334155}'
    + '#tg-modal .b{display:block;width:100%;font:700 15.5px system-ui,sans-serif;border-radius:12px;padding:13px 16px;margin-top:8px;cursor:pointer;border:0;text-align:center}'
    + '#tg-modal .b.go{background:#f59e0b;color:#1a1200}'
    + '#tg-modal .b.of{background:#fff;color:#0f172a;border:1px solid #cbd5e1}'
    + '#tg-modal .b small{display:block;font-weight:500;font-size:12.5px;opacity:.8}'
    + '#tg-modal .l{display:flex;justify-content:space-between;margin-top:12px}'
    + '#tg-modal .l button{background:none;border:0;color:#64748b;font:500 13px system-ui,sans-serif;cursor:pointer;padding:4px}'
    + '#tg-modal .l button:hover{text-decoration:underline;color:#0f172a}'
    + '#tg-rec{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:8999;display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 24px);background:#fffbeb;color:#78350f;border:1px solid #fcd34d;border-radius:12px;padding:10px 14px;font:500 14px system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.18)}'
    + '#tg-rec button{font:700 13px system-ui,sans-serif;border-radius:8px;padding:7px 12px;cursor:pointer;border:0;background:#0f172a;color:#fff}'
    + '#tg-rec button.m{background:none;color:#78350f;text-decoration:underline;font-weight:500}'
    + '@media (max-width:640px){#tg-box{left:12px!important;right:12px!important;bottom:12px!important;top:auto!important;width:auto}#tg-panel{right:10px;left:10px;bottom:10px;width:auto;max-width:none}#tg-pill{right:12px;bottom:12px}#tg-link{padding:4px 9px;font-size:12px}}'
    + '@media (prefers-reduced-motion:reduce){#tg-hl{transition:none}}';

    /* ---------- Progreso ---------- */
    function retosHechos() { return RETOS.filter(function (r) { return r.hecho(); }).length; }
    function visitasHechas() { return VISITAS.filter(function (v) { return !!E.hechos['v_' + v.id]; }).length; }
    function todoImprescindible() { return retosHechos() === RETOS.length; }
    function nuevo() { return enPrueba() || diasClub() <= DIAS_NUEVO; }
    // El boton flotante solo mientras la guia tiene sentido
    function flotanteActivo() { return !!E && !E.oculta && nuevo() && !todoImprescindible(); }

    function leer(cb, forzar) {
        if (leyendo) return;
        if (!forzar && Date.now() - ultimaLectura < 12000) { if (cb) cb(); return; }
        leyendo = true;
        rpc('tlc_guia_estado', { p_club: club() }).then(function (d) {
            leyendo = false; ultimaLectura = Date.now();
            if (!d || !d.ok) { if (!E) return; if (cb) cb(); return; }
            d.hechos = d.hechos || {}; d.reales = d.reales || { jugadores: 0, sesiones: 0, partidos: 0, asistencia: 0 };
            var antes = E; E = d;
            // Retos recien conseguidos: se apuntan (para medir) y se felicita una sola vez
            RETOS.forEach(function (r) {
                if (r.id === 'pdf') return;
                if (r.hecho() && !E.hechos['r_' + r.id]) {
                    E.hechos['r_' + r.id] = 'hoy';
                    rpc('tlc_guia_marcar', { p_club: club(), p_clave: 'r_' + r.id });
                    if (antes && !avisados[r.id]) { avisados[r.id] = 1; aviso('✓ Reto conseguido: ' + r.title); }
                }
            });
            if (todoImprescindible() && !E.hechos.fin) {
                E.hechos.fin = 'hoy'; rpc('tlc_guia_marcar', { p_club: club(), p_clave: 'fin' });
                if (antes) setTimeout(felicitar, 600);
            }
            pintar();
            if (cb) cb();
        });
    }

    /* ---------- Enlace discreto + boton flotante ---------- */
    function pintar() {
        if (!E) return;
        var info = $('.user-info');
        var l = $('#tg-link');
        if (!l && info) {
            l = document.createElement('button'); l.type = 'button'; l.id = 'tg-link';
            l.onclick = function () { abrirPanel(); };
            info.insertBefore(l, info.firstChild);
        }
        if (l) {
            l.textContent = E.ejemplo ? '❓ Guía · datos de ejemplo' : '❓ Guía';
            l.title = E.ejemplo ? 'Tienes cargado el equipo de ejemplo. Desde aquí puedes borrarlo.' : 'Guía de primeros pasos';
            l.classList.toggle('ej', !!E.ejemplo);
        }
        var p = $('#tg-pill');
        if (flotanteActivo() && !$('#tg-panel')) {
            if (!p) {
                p = document.createElement('div'); p.id = 'tg-pill';
                p.innerHTML = '<span class="t"></span><span class="n"></span><button type="button" class="x" title="Ocultar este botón">×</button>';
                p.onclick = function (e) { if (e.target.classList.contains('x')) return; abrirPanel(); };
                p.querySelector('.x').onclick = function () { ocultarFlotante(); };
                document.body.appendChild(p);
            }
            p.querySelector('.t').textContent = enPrueba() ? 'Guía de tu prueba' : 'Primeros pasos';
            p.querySelector('.n').textContent = retosHechos() + ' de ' + RETOS.length;
        } else if (p) { p.remove(); }
        if ($('#tg-panel')) pintarPanel();
    }
    function ocultarFlotante() {
        E.oculta = true; rpc('tlc_guia_marcar', { p_club: club(), p_clave: 'oculta', p_valor: true });
        cerrarPanel(); pintar();
        aviso('Guía ocultada. La tienes siempre en «❓ Guía», arriba a la derecha.');
    }

    /* ---------- Panel ---------- */
    function fila(o, hecho, etiqueta, tipo, i) {
        return '<div class="it' + (hecho ? ' done' : '') + '"><div class="ic">' + (hecho ? '✓' : o.ico) + '</div><div class="tx"><b>' + esc(o.title) + '</b><small>' + esc(o.sub) + '</small></div>'
            + '<button type="button" data-t="' + tipo + '" data-i="' + i + '">' + etiqueta + '</button></div>';
    }
    function pintarPanel() {
        var p = $('#tg-panel'); if (!p || !E) return;
        var nr = retosHechos(), nv = visitasHechas();
        var h = '<div class="hd"><b>' + (enPrueba() ? 'Guía de tu prueba' : 'Guía de primeros pasos') + '</b>'
            + '<button type="button" class="vz" title="Voz">' + (mudo ? '🔇' : '🔊') + '</button><button type="button" class="cl" title="Cerrar">✕</button></div><div class="bd">';
        var ej;
        if (E.ejemplo) {
            ej = '<div class="ej"><b>Equipo de ejemplo cargado</b>16 jugadores, sesiones, partidos y periodización ficticios para que veas el planificador con datos. Se reconocen por la palabra «ejemplo». Cuando ya no los necesites, bórralos: tus datos no se tocan.'
               + '<br><button type="button" class="del" id="tg-ej-del">Borrar el equipo de ejemplo</button></div>';
        } else {
            ej = '<div class="ej"><b>¿Quieres verlo con datos?</b>Carga un equipo de ejemplo (jugadores, sesiones, partidos y cargas ficticios) y explora sin teclear nada. Se borra con un botón cuando quieras.'
               + '<br><button type="button" id="tg-ej-add">Cargar el equipo de ejemplo</button></div>';
        }
        var ejArriba = E.ejemplo || (E.reales.jugadores + E.reales.sesiones + E.reales.partidos) === 0;
        if (ejArriba) h += ej;
        h += '<h5>Lo imprescindible <span>' + nr + ' de ' + RETOS.length + '</span></h5><div class="bar"><i style="width:' + Math.round(nr / RETOS.length * 100) + '%"></i></div>';
        RETOS.forEach(function (r, i) { h += fila(r, r.hecho(), 'Enséñame', 'r', i); });
        h += '<h5>Descubre el resto <span>' + nv + ' de ' + VISITAS.length + '</span></h5><div class="bar"><i style="width:' + Math.round(nv / VISITAS.length * 100) + '%"></i></div>';
        VISITAS.forEach(function (v, i) { h += fila(v, !!E.hechos['v_' + v.id], 'Ver', 'v', i); });
        if (!ejArriba) h += ej;
        h += '</div><div class="ft"><button type="button" id="tg-ocultar">' + (E.oculta ? 'Volver a mostrar el botón flotante' : 'No mostrar el botón flotante') + '</button></div>';
        p.innerHTML = h;
        p.querySelector('.cl').onclick = cerrarPanel;
        p.querySelector('.vz').onclick = function () { mudo = !mudo; try { localStorage.setItem('tlc_guia_mudo', mudo ? '1' : '0'); } catch (e) {} if (mudo) callar(); pintarPanel(); };
        Array.prototype.forEach.call(p.querySelectorAll('.it button'), function (b) {
            b.onclick = function () { lanzar(b.dataset.t === 'r' ? RETOS[+b.dataset.i] : VISITAS[+b.dataset.i], b.dataset.t); };
        });
        var a = $('#tg-ej-add'); if (a) a.onclick = cargarEjemplo;
        var d = $('#tg-ej-del'); if (d) d.onclick = borrarEjemplo;
        $('#tg-ocultar').onclick = function () {
            if (E.oculta) { E.oculta = false; rpc('tlc_guia_marcar', { p_club: club(), p_clave: 'oculta', p_valor: false }); pintarPanel(); }
            else ocultarFlotante();
        };
    }
    function abrirPanel() {
        cerrarModal();
        if (!$('#tg-panel')) { var p = document.createElement('div'); p.id = 'tg-panel'; document.body.appendChild(p); }
        var pill = $('#tg-pill'); if (pill) pill.remove();
        pintarPanel();
        leer(null, true);
    }
    function cerrarPanel() { var p = $('#tg-panel'); if (p) p.remove(); pintar(); }

    /* ---------- Equipo de ejemplo ---------- */
    function cargarEjemplo() {
        if (!confirm('Se va a cargar un equipo de ejemplo con jugadores, sesiones y partidos FICTICIOS, mezclado con lo que ya tengas.\n\nLo reconocerás por la palabra «ejemplo» y lo podrás borrar con un botón desde «❓ Guía».\n\n¿Cargarlo?')) return;
        var b = $('#tg-ej-add') || $('#tg-m-ej'); if (b) { b.disabled = true; b.textContent = 'Cargando…'; }
        rpc('tlc_ejemplo_cargar', { p_club: club() }).then(function (d) {
            if (d && d.ok) { rpc('tlc_guia_marcar', { p_club: club(), p_clave: 'bienvenida', p_valor: true }); aviso('Equipo de ejemplo cargado'); setTimeout(function () { location.reload(); }, 700); return; }
            var m = d && d.motivo;
            alert(m === 'plantilla_llena' ? 'Tu plantilla ya está casi completa, así que no hace falta el equipo de ejemplo.'
                : m === 'sin_temporada' ? 'Antes necesitas tener una temporada activa (Mi Club › Temporadas).'
                : 'No se ha podido cargar el equipo de ejemplo. Inténtalo de nuevo en un momento.');
            if (b) { b.disabled = false; b.textContent = 'Cargar el equipo de ejemplo'; }
        });
    }
    function borrarEjemplo() {
        if (!confirm('Se van a borrar SOLO los datos del equipo de ejemplo (jugadores, sesiones, partidos, periodización y modelo de juego ficticios).\n\nLo que has creado tú no se toca.\n\n¿Borrarlos?')) return;
        var b = $('#tg-ej-del') || $('#tg-rec-del'); if (b) { b.disabled = true; b.textContent = 'Borrando…'; }
        rpc('tlc_ejemplo_borrar', { p_club: club() }).then(function (d) {
            if (d && d.ok) { aviso('Equipo de ejemplo borrado'); setTimeout(function () { location.reload(); }, 700); return; }
            alert('No se ha podido borrar el equipo de ejemplo. Inténtalo de nuevo en un momento.');
            if (b) { b.disabled = false; b.textContent = 'Borrar el equipo de ejemplo'; }
        });
    }
    // Recordatorio suave (como mucho una vez al dia): ya tiene jugadores propios y sigue el ejemplo cargado
    function recordarEjemplo() {
        if (!E || !E.ejemplo || E.reales.jugadores < 5 || $('#tg-rec')) return;
        var hoy = new Date().toISOString().slice(0, 10);
        try { if (localStorage.getItem('tlc_guia_rec') === hoy) return; localStorage.setItem('tlc_guia_rec', hoy); } catch (e) {}
        var r = document.createElement('div'); r.id = 'tg-rec';
        r.innerHTML = '<span>Ya tienes tus propios jugadores. ¿Borramos el equipo de ejemplo?</span><button type="button" id="tg-rec-del">Borrarlo</button><button type="button" class="m">Más tarde</button>';
        document.body.appendChild(r);
        $('#tg-rec-del').onclick = borrarEjemplo;
        r.querySelector('.m').onclick = function () { r.remove(); };
        setTimeout(function () { if (r.parentNode) r.remove(); }, 25000);
    }

    /* ---------- Bienvenida (una sola vez) y felicitacion ---------- */
    function cerrarModal() { var m = $('#tg-modal'); if (m) m.remove(); }
    function bienvenida() {
        var m = document.createElement('div'); m.id = 'tg-modal';
        m.innerHTML = '<div class="c"><h3>' + (enPrueba() ? 'Bienvenido a tu prueba de 7 días' : 'Bienvenido al planificador') + '</h3>'
            + '<p>Para sacarle partido desde hoy, te propongo <b>5 pasos</b> que se hacen en un cuarto de hora y un paseo rápido por el resto de secciones. Tú marcas el ritmo: nada se abre solo.</p>'
            + '<button type="button" class="b go" id="tg-m-go">Ver la guía<small>5 imprescindibles + 7 secciones por descubrir</small></button>'
            + '<button type="button" class="b of" id="tg-m-ej">Cargar un equipo de ejemplo<small>Mira el planificador con datos; se borra con un botón</small></button>'
            + '<div class="l"><button type="button" id="tg-m-no">Ahora no</button><button type="button" id="tg-m-nunca">No me hace falta la guía</button></div></div>';
        document.body.appendChild(m);
        var visto = function () { E.bienvenida_vista = true; rpc('tlc_guia_marcar', { p_club: club(), p_clave: 'bienvenida', p_valor: true }); };
        $('#tg-m-go').onclick = function () { visto(); cerrarModal(); abrirPanel(); };
        $('#tg-m-ej').onclick = function () { visto(); cargarEjemplo(); };
        $('#tg-m-no').onclick = function () { visto(); cerrarModal(); };
        $('#tg-m-nunca').onclick = function () { visto(); cerrarModal(); ocultarFlotante(); };
    }
    function felicitar() {
        if ($('#tg-modal')) return;
        cerrarPanel();
        var m = document.createElement('div'); m.id = 'tg-modal';
        m.innerHTML = '<div class="c"><h3>Ya lo manejas 👏</h3>'
            + '<p>Has completado los cinco imprescindibles: plantilla, sesión, PDF, partido y asistencia. A partir de aquí la guía se quita de en medio; la tendrás siempre en <b>«❓ Guía»</b>, arriba a la derecha, por si quieres ver alguna sección más.</p>'
            + (E.ejemplo ? '<p>Sigues teniendo cargado el <b>equipo de ejemplo</b>. Si ya no lo necesitas, puedes borrarlo ahora.</p><button type="button" class="b of" id="tg-f-del">Borrar el equipo de ejemplo</button>' : '')
            + (enPrueba() ? '<a class="b go" style="text-decoration:none" href="https://toplidercoach.com/registrarse/">Suscribirme y seguir<small>Lo que has creado se conserva</small></a>' : '')
            + '<button type="button" class="b ' + (enPrueba() ? 'of' : 'go') + '" id="tg-f-ok">Seguir trabajando</button></div>';
        document.body.appendChild(m);
        $('#tg-f-ok').onclick = cerrarModal;
        var d = $('#tg-f-del'); if (d) d.onclick = function () { cerrarModal(); borrarEjemplo(); };
    }

    /* ---------- Recorrido con foco ---------- */
    var shade, hl, box, steps = [], i = 0, target = null, actual = null, tipoActual = '';
    function ui() {
        if (!shade) {
            shade = document.createElement('div'); shade.id = 'tg-shade';
            hl = document.createElement('div'); hl.id = 'tg-hl'; shade.appendChild(hl);
            box = document.createElement('div'); box.id = 'tg-box';
            document.body.appendChild(shade); document.body.appendChild(box);
            window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
        }
        shade.style.display = 'block'; box.style.display = 'block';
    }
    function hide() { if (shade) { shade.style.display = 'none'; box.style.display = 'none'; } target = null; }
    function place() {
        if (!box || box.style.display === 'none') return;
        if (!target || !visible(target)) { hl.style.width = '0'; hl.style.height = '0'; hl.style.boxShadow = '0 0 0 9999px rgba(15,23,42,.72)'; centerBox(); return; }
        var r = target.getBoundingClientRect(), pad = 8;
        var alto = Math.min(r.height, window.innerHeight - 40);
        hl.style.top = (Math.max(8, r.top) - pad) + 'px'; hl.style.left = (r.left - pad) + 'px';
        hl.style.width = (r.width + pad * 2) + 'px'; hl.style.height = (alto + pad * 2) + 'px';
        hl.style.boxShadow = '0 0 0 9999px rgba(15,23,42,.72),0 0 0 3px #f59e0b';
        if (window.innerWidth <= 640) return;
        var bw = box.offsetWidth, bh = box.offsetHeight, gap = 14, top, left;
        if (r.height > window.innerHeight * 0.6) { top = Math.max(12, window.innerHeight - bh - 24); left = Math.max(12, window.innerWidth - bw - 24); }
        else {
            if (r.bottom + gap + bh < window.innerHeight) top = r.bottom + gap;
            else if (r.top - gap - bh > 0) top = r.top - gap - bh;
            else top = Math.max(12, window.innerHeight - bh - 12);
            left = Math.min(Math.max(12, r.left), window.innerWidth - bw - 12);
        }
        box.style.top = top + 'px'; box.style.left = left + 'px'; box.style.bottom = 'auto';
    }
    function centerBox() {
        if (window.innerWidth <= 640) return;
        box.style.top = Math.max(12, (window.innerHeight - box.offsetHeight) / 2) + 'px';
        box.style.left = Math.max(12, (window.innerWidth - box.offsetWidth) / 2) + 'px';
    }
    function render() {
        var s = steps[i];
        box.innerHTML = '<div class="step">' + esc(actual.title).toUpperCase() + ' · ' + (i + 1) + ' / ' + steps.length + '</div><h4>' + esc(s.title) + '</h4><p>' + s.text + '</p>'
            + '<div class="acts"><button type="button" class="skip">Cerrar</button><button type="button" class="vz" title="Voz">' + (mudo ? '🔇' : '🔊') + '</button><span class="sp"></span>'
            + (i > 0 ? '<button type="button" class="prev">Anterior</button>' : '')
            + '<button type="button" class="next">' + (i === steps.length - 1 ? 'Entendido ✓' : 'Siguiente') + '</button></div>';
        box.querySelector('.skip').onclick = function () { hide(); callar(); pintar(); };
        box.querySelector('.vz').onclick = function () { mudo = !mudo; try { localStorage.setItem('tlc_guia_mudo', mudo ? '1' : '0'); } catch (e) {} if (mudo) callar(); else hablar(s.text); render(); place(); };
        var p = box.querySelector('.prev'); if (p) p.onclick = function () { go(i - 1); };
        box.querySelector('.next').onclick = function () { if (i === steps.length - 1) terminar(); else go(i + 1); };
    }
    function go(n) {
        i = n; var s = steps[i]; ui();
        if (s.go) { try { s.go(); } catch (e) {} }
        target = null; render(); place(); hablar(s.text);
        if (!s.sel) return;
        waitFor(function () { var el = $(s.sel); return visible(el) ? el : null; }, 5000, function (el) {
            if (i !== n || !box || box.style.display === 'none') return;
            target = el; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(place, 350);
        });
    }
    function lanzar(o, tipo) {
        if (!o) return;
        actual = o; tipoActual = tipo; steps = o.steps;
        var p = $('#tg-panel'); if (p) p.remove();
        go(0);
    }
    function terminar() {
        hide(); callar();
        if (tipoActual === 'v' && actual && !E.hechos['v_' + actual.id]) {
            E.hechos['v_' + actual.id] = 'hoy';
            rpc('tlc_guia_marcar', { p_club: club(), p_clave: 'v_' + actual.id });
        }
        pintar();
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box && box.style.display !== 'none') { hide(); callar(); pintar(); } });

    /* ---------- Reto del PDF: se marca al generar el PDF de una sesion ---------- */
    function engancharPDF() {
        try {
            if (typeof window.exportarSesionPDF !== 'function' || window.exportarSesionPDF.__tg) return;
            var orig = window.exportarSesionPDF;
            var f = function () {
                try { if (E && !E.hechos.pdf) { E.hechos.pdf = 'hoy'; rpc('tlc_guia_marcar', { p_club: club(), p_clave: 'pdf' }); aviso('✓ Reto conseguido: Descárgala en PDF'); setTimeout(function () { leer(null, true); }, 1500); } } catch (e) {}
                return orig.apply(this, arguments);
            };
            f.__tg = true; window.exportarSesionPDF = f;
        } catch (e) {}
    }
    // Releer el progreso (sin molestar) cuando el entrenador cambia de seccion
    function engancharNavegacion() {
        ['cambiarModulo', 'cambiarSubTab'].forEach(function (n) {
            try {
                var orig = window[n]; if (typeof orig !== 'function' || orig.__tg) return;
                var f = function () { var r = orig.apply(this, arguments); clearTimeout(f._t); f._t = setTimeout(function () { if (E && (flotanteActivo() || $('#tg-panel'))) leer(); }, 1800); return r; };
                f.__tg = true; window[n] = f;
            } catch (e) {}
        });
    }

    /* ---------- Arranque ---------- */
    var iniciadoPara = null;
    function iniciar() {
        if (!elegible()) return;
        if (iniciadoPara === club()) return;
        var primera = iniciadoPara === null; iniciadoPara = club(); E = null;
        if (primera) { var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }
        engancharPDF(); engancharNavegacion();
        leer(function () {
            if (!E) return;
            var sinDatos = (E.reales.jugadores + E.reales.sesiones + E.reales.partidos) === 0;
            if (!E.bienvenida_vista && !E.oculta && nuevo() && sinDatos && !E.ejemplo) setTimeout(bienvenida, 900);
            else setTimeout(recordarEjemplo, 2500);
        }, true);
    }
    window.tlcGuiaAbrir = function () { if (E) abrirPanel(); };

    if (window.__hubListo) setTimeout(iniciar, 400);
    else document.addEventListener('hubReady', function () { setTimeout(iniciar, 400); });
})();
