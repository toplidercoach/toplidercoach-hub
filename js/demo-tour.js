/* ============================================================
   TopLiderCoach — Guia de la demo (demo-tour.js)
   Solo se activa si el visitante entro por /demo/ (localStorage.tlc_demo_role).
   Para clientes reales este archivo no hace nada.
   Textos de los tours: al final del archivo (DEMO_TOURS). Editables sin tocar el motor.
   ============================================================ */
(function () {
    'use strict';
    var ROLE = null;
    try { ROLE = localStorage.getItem('tlc_demo_role'); } catch (e) {}
    if (!ROLE) return;

    var DEMO_URL = 'demo/';
    var CTA_URL = 'mailto:info@toplidercoach.com?subject=Quiero%20TopLiderCoach%20para%20mi%20club';

    var PERSONAS = {
        'direccion':          { nombre: 'Direccion Rapid Alianza', rol: 'Direccion' },
        'entrenador':         { nombre: 'Roberto Cifuentes',       rol: 'Entrenador · Primer equipo' },
        'director-deportivo': { nombre: 'Jorge Villanueva',        rol: 'Director Deportivo' },
        'medico':             { nombre: 'Dra. Irene Salgado',      rol: 'Medico' },
        'fisio':              { nombre: 'Claudia Reguera',         rol: 'Fisioterapeuta' },
        'preparador-fisico':  { nombre: 'Victor Landa',            rol: 'Preparador Fisico' },
        'analista':           { nombre: 'Hugo Cerezo',             rol: 'Analista' },
        'economico':          { nombre: 'Montserrat Vidal',        rol: 'Gestor Economico' },
        'cantera':            { nombre: 'Sergio Lastra',           rol: 'Coordinador de Cantera' },
        'utillero':           { nombre: 'Emilio Roales',           rol: 'Utillero' }
    };
    var persona = PERSONAS[ROLE] || { nombre: 'Visitante', rol: 'Demo' };

    /* ---------- Estilos ---------- */
    var css = ''
    + '#tlc-demo-bar{position:sticky;top:0;z-index:9990;display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:8px 16px;background:#f59e0b;color:#1a1200;font:500 14px/1.3 system-ui,sans-serif}'
    + '#tlc-demo-bar b{font-weight:700}'
    + '#tlc-demo-bar .sp{flex:1}'
    + '#tlc-demo-bar a,#tlc-demo-bar button{font:inherit;font-weight:600;color:#1a1200;background:rgba(255,255,255,.35);border:0;border-radius:999px;padding:5px 12px;text-decoration:none;cursor:pointer}'
    + '#tlc-demo-bar a:hover,#tlc-demo-bar button:hover{background:rgba(255,255,255,.6)}'
    + '#tlc-demo-bar a.cta{background:#0f172a;color:#fff}'
    + '#tlc-tour-shade{position:fixed;inset:0;z-index:9995;pointer-events:none}'
    + '#tlc-tour-hl{position:absolute;border-radius:10px;box-shadow:0 0 0 9999px rgba(15,23,42,.72),0 0 0 3px #f59e0b;transition:top .25s,left .25s,width .25s,height .25s;pointer-events:none}'
    + '#tlc-tour-box{position:fixed;z-index:9996;width:min(380px,calc(100vw - 24px));background:#fff;color:#0f172a;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:18px 18px 14px;font:15px/1.5 system-ui,sans-serif}'
    + '#tlc-tour-box .step{font-size:12px;font-weight:700;letter-spacing:.06em;color:#b45309;margin-bottom:6px}'
    + '#tlc-tour-box h4{margin:0 0 6px;font-size:19px;line-height:1.2;font-weight:700}'
    + '#tlc-tour-box p{margin:0;color:#334155}'
    + '#tlc-tour-box .acts{display:flex;align-items:center;gap:8px;margin-top:14px}'
    + '#tlc-tour-box .acts .sp{flex:1}'
    + '#tlc-tour-box button{font:inherit;font-size:14px;font-weight:600;border:0;border-radius:8px;padding:9px 14px;cursor:pointer}'
    + '#tlc-tour-box .next{background:#f59e0b;color:#1a1200}'
    + '#tlc-tour-box .prev{background:#e2e8f0;color:#0f172a}'
    + '#tlc-tour-box .skip{background:none;color:#64748b;padding:9px 6px}'
    + '#tlc-tour-box .pulse{position:absolute;right:14px;top:14px;width:10px;height:10px;border-radius:50%;background:#f59e0b;animation:tlcp 1.4s infinite}'
    + '@keyframes tlcp{0%{box-shadow:0 0 0 0 rgba(245,158,11,.6)}100%{box-shadow:0 0 0 14px rgba(245,158,11,0)}}'
    + '#tlc-tour-fab{position:fixed;left:18px;bottom:18px;z-index:9989;background:#0f172a;color:#fff;border:2px solid #f59e0b;border-radius:999px;padding:10px 16px;font:600 14px system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.3)}'
    + '@media (max-width:640px){#tlc-tour-box{left:12px!important;right:12px!important;bottom:12px!important;top:auto!important;width:auto}#tlc-demo-bar{font-size:13px;gap:8px}#tlc-demo-bar .txt{width:100%}}'
    + '@media (prefers-reduced-motion:reduce){#tlc-tour-hl{transition:none}#tlc-tour-box .pulse{animation:none}}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    /* ---------- Utilidades ---------- */
    function $(s) { return document.querySelector(s); }
    function visible(el) { return el && el.offsetParent !== null && el.getBoundingClientRect().width > 0; }
    function waitFor(fn, ms, cb) {
        var t0 = Date.now();
        (function loop() {
            var r = null; try { r = fn(); } catch (e) {}
            if (r) return cb(r);
            if (Date.now() - t0 > ms) return cb(null);
            setTimeout(loop, 150);
        })();
    }
    function tab(mod) { var t = $('.main-tab[onclick*="cambiarModulo(\'' + mod + '\'"]'); if (t && t.dataset.cmLocked !== '1') t.click(); return t; }
    function sub(mod, key) { var s = $('#modulo-' + mod + ' .sub-tab[onclick*="cambiarSubTab(\'' + mod + '\', \'' + key + '\'"]'); if (s && s.dataset.cmLocked !== '1') s.click(); return s; }

    /* ---------- Banner permanente ---------- */
    function banner() {
        if ($('#tlc-demo-bar')) return;
        var b = document.createElement('div');
        b.id = 'tlc-demo-bar';
        b.innerHTML = '<span class="txt">Estas viendo <b>Rapid Alianza</b> como <b>' + persona.nombre + '</b> · ' + persona.rol + ' · solo lectura</span>'
            + '<span class="sp"></span>'
            + '<button type="button" id="tlc-demo-guide">Ver la guia</button>'
            + '<a href="' + DEMO_URL + '">Cambiar de despacho</a>'
            + '<a class="cta" href="' + CTA_URL + '">Quiero esto para mi club</a>';
        var app = $('#app-container') || document.body;
        app.insertBefore(b, app.firstChild);
        $('#tlc-demo-guide').addEventListener('click', function () { start(true); });
    }

    /* ---------- Mensajes amables del guardian ---------- */
    function suavizarErrores() {
        if (typeof window.showToast !== 'function' || window.showToast.__tlc) return;
        var orig = window.showToast;
        var f = function (msg, type, dur) {
            if (typeof msg === 'string' && /solo lectura|Modo demo/i.test(msg)) {
                return orig('En la demo puedes mirarlo todo, pero no guardar cambios. En tu club si podrias.', 'warning', 4500);
            }
            return orig(msg, type, dur);
        };
        f.__tlc = true; window.showToast = f;
    }

    /* ---------- Motor del tour ---------- */
    var steps = [], i = 0, shade, hl, box, fab;
    function ui() {
        if (!shade) {
            shade = document.createElement('div'); shade.id = 'tlc-tour-shade';
            hl = document.createElement('div'); hl.id = 'tlc-tour-hl'; shade.appendChild(hl);
            box = document.createElement('div'); box.id = 'tlc-tour-box';
            document.body.appendChild(shade); document.body.appendChild(box);
            window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
        }
        shade.style.display = 'block'; box.style.display = 'block';
    }
    function hide() { if (shade) { shade.style.display = 'none'; box.style.display = 'none'; } }
    var target = null;
    function place() {
        if (!box || box.style.display === 'none') return;
        if (!target || !visible(target)) { hl.style.width = '0'; hl.style.height = '0'; hl.style.boxShadow = '0 0 0 9999px rgba(15,23,42,.72)'; centerBox(); return; }
        var r = target.getBoundingClientRect(), pad = 8;
        hl.style.top = (r.top - pad) + 'px'; hl.style.left = (r.left - pad) + 'px';
        hl.style.width = (r.width + pad * 2) + 'px'; hl.style.height = (r.height + pad * 2) + 'px';
        hl.style.boxShadow = '0 0 0 9999px rgba(15,23,42,.72),0 0 0 3px #f59e0b';
        if (window.innerWidth <= 640) return; // en movil el globo va abajo (CSS)
        var bw = box.offsetWidth, bh = box.offsetHeight, gap = 14, top, left;
        if (r.bottom + gap + bh < window.innerHeight) top = r.bottom + gap;
        else if (r.top - gap - bh > 0) top = r.top - gap - bh;
        else top = Math.max(12, window.innerHeight - bh - 12);
        left = Math.min(Math.max(12, r.left), window.innerWidth - bw - 12);
        box.style.top = top + 'px'; box.style.left = left + 'px'; box.style.bottom = 'auto';
    }
    function centerBox() {
        if (window.innerWidth <= 640) return;
        box.style.top = Math.max(12, (window.innerHeight - box.offsetHeight) / 2) + 'px';
        box.style.left = Math.max(12, (window.innerWidth - box.offsetWidth) / 2) + 'px';
    }
    function render() {
        var s = steps[i];
        box.innerHTML = '<span class="pulse"></span><div class="step">' + (i + 1) + ' / ' + steps.length + '</div><h4>' + s.title + '</h4><p>' + s.text + '</p>'
            + '<div class="acts"><button type="button" class="skip">Cerrar guia</button><span class="sp"></span>'
            + (i > 0 ? '<button type="button" class="prev">Anterior</button>' : '')
            + '<button type="button" class="next">' + (i === steps.length - 1 ? 'Terminar' : 'Siguiente') + '</button></div>';
        box.querySelector('.skip').onclick = end;
        var p = box.querySelector('.prev'); if (p) p.onclick = function () { go(i - 1); };
        box.querySelector('.next').onclick = function () { i === steps.length - 1 ? end() : go(i + 1); };
    }
    function go(n) {
        i = n; var s = steps[i];
        ui();
        if (s.go) { try { s.go(); } catch (e) {} }
        target = null; render(); place();
        if (!s.sel) return;
        waitFor(function () { var el = $(s.sel); return visible(el) ? el : null; }, 8000, function (el) {
            if (i !== n) return;
            target = el;
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(place, 350);
        });
    }
    function end() {
        hide(); target = null;
        try { localStorage.setItem('tlc_tour_done_' + ROLE, '1'); } catch (e) {}
        if (fab) fab.style.display = 'block';
    }
    function start(force) {
        steps = window.DEMO_TOURS[ROLE] || window.DEMO_TOURS['generico'];
        if (!steps || !steps.length) return;
        var done = false; try { done = localStorage.getItem('tlc_tour_done_' + ROLE) === '1'; } catch (e) {}
        if (done && !force) return;
        if (fab) fab.style.display = 'none';
        go(0);
    }
    function fabBtn() {
        if (fab) return;
        fab = document.createElement('button'); fab.id = 'tlc-tour-fab'; fab.type = 'button'; fab.textContent = 'Guia';
        fab.style.display = 'none'; fab.onclick = function () { start(true); };
        document.body.appendChild(fab);
    }

    /* ---------- Arranque: cuando el HUB este listo ---------- */
    waitFor(function () {
        var app = $('#app-container');
        return (app && visible(app) && window.cmState && window.cmState.activo) ? true : null;
    }, 15000, function (ok) {
        if (!ok) return;
        banner(); suavizarErrores(); fabBtn();
        waitFor(function () { var h = $('#dash-hero-stats'); return (h && h.textContent.trim().length > 0) ? true : null; }, 8000, function () { start(false); });
    });
})();

/* ============================================================
   TEXTOS DE LOS TOURS — un tour por despacho.
   Cada paso: { title, text, sel (elemento a iluminar, opcional), go (funcion que navega, opcional) }
   ============================================================ */
window.DEMO_TOURS = {
    'entrenador': [
        { title: 'Hola, Roberto',
          text: 'Eres el entrenador del primer equipo de Rapid Alianza. La Liga acaba de empezar, el martes juegas en casa contra Sporting Casarejo y tienes dos bajas. En un par de minutos te enseño donde esta cada cosa.' },
        { sel: '#dash-hero-stats', title: 'Tu temporada de un vistazo',
          text: 'Ocho partidos, cinco victorias, siete goles a favor de diferencia. Se calcula solo a partir de los partidos que registras: no hay nada que rellenar a mano.' },
        { sel: '#dash-ins-racha', title: 'La racha',
          text: 'Los ultimos cinco resultados. Una derrota en pretemporada y cuatro partidos sin perder desde entonces.' },
        { sel: '#dash-ins-cargas', title: 'Estado de cargas (ACWR)',
          text: 'Cuantos jugadores estan en zona optima de carga, cuantos en atencion y cuantos en riesgo de lesion. Sale del RPE que los jugadores registran tras cada sesion. Cinco en atencion: conviene mirarlos antes del martes.' },
        { sel: '#dash-squad-status', title: 'Quien esta disponible',
          text: 'Herrera y Gomez Cruz estan de baja. Tu ves que no estan; el diagnostico solo lo ve el medico. Asi protegemos los datos de salud sin dejarte a ciegas.' },
        { sel: '#dash-ultimos-partidos', title: 'Ultimos partidos',
          text: 'Resultados, competicion y fecha. Pulsando cualquiera vas a sus estadisticas y al analisis post-partido.' },
        { sel: '#lista-jugadores', title: 'Tu plantilla',
          text: 'Los 24 jugadores del primer equipo con dorsal, posicion y foto. Cada ficha guarda su historial: minutos, goles, asistencia a entrenamientos, RPE y tests fisicos.',
          go: function () { var t = document.querySelector('.main-tab[onclick*="cambiarModulo(\'config\'"]'); if (t) t.click(); var s = document.querySelector('#modulo-config .sub-tab[onclick*="\'plantilla\'"]'); if (s) s.click(); } },
        { sel: '#planificador-mis-sesiones', title: 'Tus sesiones de entrenamiento',
          text: 'Treinta sesiones esta temporada, con las de esta semana ya planificadas hasta el partido de Copa del 14 de octubre. Cada una lleva su microciclo, su dia respecto al partido (MD-3, MD-1...) y el RPE medio del grupo.',
          go: function () { var t = document.querySelector('.main-tab[onclick*="cambiarModulo(\'planificador\'"]'); if (t) t.click(); var s = document.querySelector('#modulo-planificador .sub-tab[onclick*="\'mis-sesiones\'"]'); if (s) s.click(); } },
        { sel: '#planificador-cargas', title: 'Control de cargas',
          text: 'Carga aguda, cronica, ACWR, monotonia y strain por jugador, calculados solos desde el RPE. Es lo que el preparador fisico y tu mirais juntos el jueves para decidir quien descansa.',
          go: function () { var s = document.querySelector('#modulo-planificador .sub-tab[onclick*="\'cargas\'"]'); if (s) s.click(); } },
        { sel: '#lista-partidos', title: 'El calendario de competicion',
          text: 'Liga y Copa en la misma lista. El siguiente es el martes contra Sporting Casarejo en La Alameda. Desde aqui preparas la convocatoria, el plan de partido y luego registras el resultado y los minutos.',
          go: function () { var t = document.querySelector('.main-tab[onclick*="cambiarModulo(\'matchstats\'"]'); if (t) t.click(); var s = document.querySelector('#modulo-matchstats .sub-tab[onclick*="\'partidos\'"]'); if (s) s.click(); } },
        { sel: '#matchstats-analisisrival', title: 'El dossier del rival',
          text: 'Hugo, el analista, ya ha preparado a Casarejo: sistema, puntos fuertes, jugadores clave y balon parado. Tu lo abres el martes en el vestuario; el no tiene que mandarte nada por WhatsApp.',
          go: function () { var s = document.querySelector('#modulo-matchstats .sub-tab[onclick*="\'analisisrival\'"]'); if (s) s.click(); } },
        { title: 'Ahora te toca a ti',
          text: 'Recorre lo que quieras: todo lo que ves son datos reales de la temporada. Si quieres ver el club desde otro sillon, arriba tienes "Cambiar de despacho". Y si quieres esto para tu club, cuentanoslo.' }
    ],
    'medico': [
        { title: 'Hola, doctora Salgado',
          text: 'Eres la medico de Rapid Alianza y la unica persona del club que ve un diagnostico. Ahora mismo tienes dos lesionados activos, uno en vuelta al juego y un certificado medico caducado. Te enseño tu despacho en 8 pasos.',
          go: function () { var t = document.querySelector('.main-tab[onclick*="cambiarModulo(\'medico\'"]'); if (t) t.click(); } },
        { sel: '#cmmed-stats-bar', title: 'El semaforo del club',
          text: 'Cuantos jugadores estan disponibles, en precaucion o lesionados. Lo que marques aqui es lo que vera el entrenador en su plantilla: el color, nunca el motivo.' },
        { sel: '#cmmed-cert-alerts', title: 'Certificados medicos',
          text: 'El sistema te avisa solo: un certificado caducado y otro que vence en dos semanas. Nadie tiene que acordarse de revisar fechas.' },
        { sel: '#cmmed-player-grid', title: 'Toda la plantilla del club',
          text: 'Los 142 jugadores de los siete equipos, cada uno con su punto de color. Pulsa cualquiera y se abre su historia clinica. Vamos a abrir la de Nicolas Herrera, que se rompio el isquio hace una semana.' },
        { sel: '#cmmed-tab-antecedentes', title: 'La ficha medica',
          text: 'Grupo sanguineo, lateralidad, alergias, medicacion, cirugias previas y las fechas de ECG, prueba de esfuerzo y analitica. Todo lo que necesitas antes de tomar una decision con un jugador.',
          go: function () { if (typeof cmMedAbrirFicha === 'function') cmMedAbrirFicha('00000000-0000-4000-8000-de310000000d', 'Nicolas Herrera Vazquez', ''); } },
        { sel: '#cmmed-lesiones-lista', title: 'La lesion, con codigo OSIICS',
          text: 'Rotura fibrilar grado II del isquiotibial derecho, codigo HSM, mecanismo sin contacto, 28 dias estimados. Desde aqui llevas el protocolo de vuelta al juego en seis fases y las evaluaciones OSTRC.',
          go: function () { var b = Array.prototype.find.call(document.querySelectorAll('.cmmed-tab'), function (x) { return /Lesiones/.test(x.textContent); }); if (b && typeof cmMedCambiarTab === 'function') cmMedCambiarTab('lesiones', b); } },
        { sel: '#cmmed-tab-consentimientos', title: 'RGPD: quien ha firmado que',
          text: 'Los datos de salud son categoria especial. Aqui tienes el consentimiento firmado por cada familia, con fecha. Si un dia te lo pide un inspector, esta a un clic.',
          go: function () { var b = Array.prototype.find.call(document.querySelectorAll('.cmmed-tab'), function (x) { return /RGPD/.test(x.textContent); }); if (b && typeof cmMedCambiarTab === 'function') cmMedCambiarTab('consentimientos', b); } },
        { sel: '#cmmed-dashboard', title: 'Tu cuadro de mando',
          text: 'Lesiones por mes, por zona, por severidad y por mecanismo. Con una temporada de datos sabras si tu club se lesiona mas en pretemporada, mas en entrenamientos o mas en los isquios.',
          go: function () { if (typeof cmMedCerrarFicha === 'function') cmMedCerrarFicha(); if (typeof cmMedVistaDashboard === 'function') cmMedVistaDashboard(); } },
        { title: 'Ahora, la otra mitad',
          text: 'Tu registras la lesion; Claudia, la fisio, la trata. Sal por "Cambiar de despacho" y entra como fisioterapeuta: veras la misma lesion de Herrera desde su lado, con el tratamiento y la agenda de la semana.' }
    ],
    'fisio': [
        { title: 'Hola, Claudia',
          text: 'Eres la fisioterapeuta del primer equipo y el filial. Tienes cuatro tratamientos activos, siete citas esta semana y cada tarde le cuentas al entrenador quien esta y quien no. Te lo enseño en 8 pasos.',
          go: function () { var t = document.querySelector('.main-tab[onclick*="cambiarModulo(\'fisio\'"]'); if (t) t.click(); } },
        { sel: '#cmfisio-stats-bar', title: 'Tu resumen de plantilla',
          text: 'Disponibles, en precaucion y lesionados. Pulsa un color y filtras la lista. Tu y la doctora compartis este semaforo: quien cambia el color, cambia lo que ve el entrenador.' },
        { sel: '#cmfisio-player-grid', title: 'Tus jugadores',
          text: 'Cada tarjeta lleva el punto de color y, si esta en tratamiento, cuantas sesiones lleva. Vamos a abrir a Herrera, que esta en fase aguda de una rotura fibrilar.' },
        { sel: '#cmfisio-tab-tratamientos', title: 'El tratamiento',
          text: 'Objetivo, tecnicas previstas, frecuencia semanal y fecha estimada de alta. Ligado a la lesion que registro la doctora: no la escribes dos veces.',
          go: function () { if (typeof cmFisioAbrirFicha === 'function') cmFisioAbrirFicha('00000000-0000-4000-8000-de310000000d', 'Nicolas Herrera Vazquez', ''); var b = Array.prototype.find.call(document.querySelectorAll('.cmfisio-tab'), function (x) { return /Tratamientos/.test(x.textContent); }); if (b && typeof cmFisioCambiarTab === 'function') setTimeout(function(){ cmFisioCambiarTab('tratamientos', b); }, 400); } },
        { sel: '#cmfisio-tab-sesiones', title: 'Las sesiones SOAP',
          text: 'Cada sesion: que te cuenta el jugador, que observas, que le haces (tecnicas), que planificas y un nivel de dolor. Herrera ha pasado de 7 a 4 en cinco dias.',
          go: function () { var b = Array.prototype.find.call(document.querySelectorAll('.cmfisio-tab'), function (x) { return /Sesiones/.test(x.textContent); }); if (b && typeof cmFisioCambiarTab === 'function') cmFisioCambiarTab('sesiones', b); } },
        { sel: '#cmfisio-tab-evolucion', title: 'La curva del dolor',
          text: 'La evolucion del dolor sesion a sesion. Es lo que enseñas al jugador para que vea que va bien, y a la doctora para decidir cuando empieza la vuelta al juego.',
          go: function () { var b = Array.prototype.find.call(document.querySelectorAll('.cmfisio-tab'), function (x) { return /Evoluci/.test(x.textContent); }); if (b && typeof cmFisioCambiarTab === 'function') cmFisioCambiarTab('evolucion', b); } },
        { sel: '#cmfisio-player-grid', title: 'Tu agenda',
          text: 'La semana que viene: Herrera el lunes, miercoles y viernes; Gomez Cruz el lunes; valoracion de vuelta al grupo el jueves. Citas de tratamiento, preventivas, de valoracion y de mantenimiento.',
          go: function () { if (typeof cmFisioCerrarFicha === 'function') cmFisioCerrarFicha(); var b = document.getElementById('cmfisio-btn-calendario'); if (b && /Calendario/.test(b.textContent)) b.click(); } },
        { sel: '#cmfisio-report-overlay', title: 'El informe diario al entrenador',
          text: 'Al acabar la tarde pulsas un boton y el entrenador recibe una notificacion: quien esta apto, quien limitado y quien no, con tu nota. Nada de WhatsApps a las once de la noche.',
          go: function () { var b = document.getElementById('cmfisio-btn-calendario'); if (b && /Jugadores/.test(b.textContent)) b.click(); if (typeof cmFisioGenerarInformeDiario === 'function') setTimeout(cmFisioGenerarInformeDiario, 300); } },
        { title: 'Lo que acabas de ver',
          text: 'La doctora registro la lesion, tu la tratas, el entrenador solo ve el color. Tres personas, tres despachos, un solo dato. Si quieres, entra ahora como entrenador y comprueba que de todo esto el no ve nada.',
          go: function () { var o = document.getElementById('cmfisio-report-overlay'); if (o) o.remove(); } }
    ],
    'generico': [
        { title: 'Bienvenido a Rapid Alianza',
          text: 'Estas dentro de un club real de Primera Federacion, con el cargo que has elegido. Todo lo que ves son datos de esta temporada. Puedes mirarlo todo; para guardar cambios necesitarias tu propio club.' },
        { title: 'Cambiar de sillon',
          text: 'Arriba tienes "Cambiar de despacho": prueba a entrar con otro cargo y compara lo que ve cada uno. Esa diferencia es el corazon de la plataforma.' }
    ]
};
