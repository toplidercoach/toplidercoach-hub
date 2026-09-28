/* ============================================================
   TopLiderCoach — Modo demo dentro del HUB (demo-tour.js v2)
   Solo se activa si el visitante entro por /demo/ (localStorage.tlc_demo_role).
   Para clientes reales este archivo no hace nada.
   Textos: bloque DEMO_RECORRIDOS al final. Editable sin tocar el motor.
   ============================================================ */
(function () {
    'use strict';
    var ROLE = null;
    try { ROLE = localStorage.getItem('tlc_demo_role'); } catch (e) {}
    if (!ROLE) return;

    var DEMO_URL = 'demo/';
    var OFERTA_URL = 'demo/#oferta';
    var WA_URL = 'https://wa.me/34611126983?text=Hola%2C%20quiero%20reservar%20mi%20plaza%20de%20Club%20Prioritario%20en%20TopLiderCoach';

    var ROLES = [
        { slug:'direccion',          rol:'Dirección',            nombre:'Dirección Rapid Alianza', wp:100000014, username:'demo.direccion' },
        { slug:'entrenador',         rol:'Entrenador',           nombre:'Roberto Cifuentes',       wp:100000017, username:'demo.entrenador' },
        { slug:'director-deportivo', rol:'Dir. Deportivo',       nombre:'Jorge Villanueva',        wp:100000015, username:'demo.dd' },
        { slug:'medico',             rol:'Médico',               nombre:'Irene Salgado',           wp:100000025, username:'demo.medico' },
        { slug:'fisio',              rol:'Fisio',                nombre:'Claudia Reguera',         wp:100000026, username:'demo.fisio' },
        { slug:'preparador-fisico',  rol:'Prep. Físico',         nombre:'Víctor Landa',            wp:100000028, username:'demo.pf' },
        { slug:'analista',           rol:'Analista',             nombre:'Hugo Cerezo',             wp:100000029, username:'demo.analista' },
        { slug:'economico',          rol:'Económico',            nombre:'Montserrat Vidal',        wp:100000031, username:'demo.economico' },
        { slug:'cantera',            rol:'Cantera',              nombre:'Sergio Lastra',           wp:100000016, username:'demo.cantera' },
        { slug:'utillero',           rol:'Utillero',             nombre:'Emilio Roales',           wp:100000030, username:'demo.utillero' }
    ];
    var yo = ROLES.filter(function (r) { return r.slug === ROLE; })[0] || { slug: ROLE, rol: 'Visitante', nombre: 'Visitante' };

    /* ---------- Estilos ---------- */
    var css = ''
    + '#tlc-bar{position:sticky;top:0;z-index:9990;display:flex;align-items:center;gap:10px;padding:6px 14px;background:#3b2a6b;color:#fff;font:500 13px/1.3 system-ui,sans-serif;overflow-x:auto;white-space:nowrap;scrollbar-width:none}'
    + '#tlc-bar::-webkit-scrollbar{display:none}'
    + '#tlc-bar .lbl{opacity:.85;flex-shrink:0}'
    + '#tlc-bar .lbl b{font-weight:700}'
    + '#tlc-bar .vc{opacity:.7;font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-left:6px;flex-shrink:0}'
    + '#tlc-bar .chip{flex-shrink:0;font:600 12.5px system-ui,sans-serif;color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:5px 11px;cursor:pointer}'
    + '#tlc-bar .chip:hover{background:rgba(255,255,255,.22)}'
    + '#tlc-bar .chip.on{background:#f59e0b;color:#1a1200;border-color:#f59e0b}'
    + '#tlc-bar .sp{flex:1;min-width:8px}'
    + '#tlc-bar .act{flex-shrink:0;font:700 13px system-ui,sans-serif;text-decoration:none;color:#fff;background:rgba(255,255,255,.14);border:0;border-radius:999px;padding:6px 13px;cursor:pointer}'
    + '#tlc-bar .act.sub{background:#f59e0b;color:#1a1200}'
    + '#tlc-bar .act.sub:hover{background:#fbbf24}'
    /* panel recorrido */
    + '#tlc-panel{position:fixed;left:18px;bottom:18px;z-index:9989;width:330px;max-width:calc(100vw - 36px);background:#fff;color:#0f172a;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.35);font:14px/1.4 system-ui,sans-serif;overflow:hidden}'
    + '#tlc-panel .hd{display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;cursor:pointer}'
    + '#tlc-panel .ring{width:40px;height:40px;border-radius:50%;background:conic-gradient(#f59e0b var(--p,0%),rgba(255,255,255,.18) 0);display:grid;place-items:center;flex-shrink:0}'
    + '#tlc-panel .ring span{width:32px;height:32px;border-radius:50%;background:#0f172a;display:grid;place-items:center;font-size:11px;font-weight:700}'
    + '#tlc-panel .hd b{display:block;font-size:15px}'
    + '#tlc-panel .hd small{opacity:.8;font-size:12px}'
    + '#tlc-panel .hd .ch{margin-left:auto;opacity:.8;transition:transform .2s}'
    + '#tlc-panel.min .ch{transform:rotate(180deg)}'
    + '#tlc-panel .bd{padding:10px 12px 12px}'
    + '#tlc-panel.min .bd{display:none}'
    + '#tlc-panel .it{display:flex;gap:10px;align-items:flex-start;padding:9px 10px;border-radius:10px;cursor:pointer;border:1px solid transparent}'
    + '#tlc-panel .it:hover{background:#f8fafc}'
    + '#tlc-panel .it.next{border-color:#fde68a;background:#fffbeb}'
    + '#tlc-panel .it .ic{width:30px;height:30px;border-radius:8px;background:#f1f5f9;display:grid;place-items:center;font-size:15px;flex-shrink:0}'
    + '#tlc-panel .it.done .ic{background:#dcfce7}'
    + '#tlc-panel .it b{display:block;font-size:14px}'
    + '#tlc-panel .it small{color:#64748b;font-size:12.5px}'
    + '#tlc-panel .it.done b{text-decoration:line-through;color:#64748b}'
    + '#tlc-panel .btns{display:grid;gap:8px;margin-top:8px}'
    + '#tlc-panel .btn{font:700 15px system-ui,sans-serif;border:0;border-radius:10px;padding:12px 14px;cursor:pointer;text-align:center;text-decoration:none;display:block}'
    + '#tlc-panel .btn.go{background:#0f172a;color:#fff}'
    + '#tlc-panel .btn.of{background:#fff;color:#0f172a;border:1px solid #cbd5e1}'
    + '#tlc-panel .btn.of:hover{background:#f8fafc}'
    + '#tlc-panel .lnk{display:block;text-align:center;color:#64748b;font-size:12.5px;margin-top:8px;cursor:pointer;background:none;border:0;width:100%}'
    + '#tlc-panel .voz{margin-left:auto;background:none;border:0;color:#fff;font-size:16px;cursor:pointer;opacity:.85}'
    /* foco */
    + '#tlc-shade{position:fixed;inset:0;z-index:9995;pointer-events:none}'
    + '#tlc-hl{position:absolute;border-radius:10px;box-shadow:0 0 0 9999px rgba(15,23,42,.72),0 0 0 3px #f59e0b;transition:top .25s,left .25s,width .25s,height .25s;pointer-events:none}'
    + '#tlc-box{position:fixed;z-index:9996;width:min(380px,calc(100vw - 24px));background:#fff;color:#0f172a;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:18px 18px 14px;font:15px/1.5 system-ui,sans-serif}'
    + '#tlc-box .step{font-size:12px;font-weight:700;letter-spacing:.06em;color:#b45309;margin-bottom:6px}'
    + '#tlc-box h4{margin:0 0 6px;font-size:19px;line-height:1.2;font-weight:700}'
    + '#tlc-box p{margin:0;color:#334155}'
    + '#tlc-box .acts{display:flex;align-items:center;gap:8px;margin-top:14px}'
    + '#tlc-box .acts .sp{flex:1}'
    + '#tlc-box button{font:inherit;font-size:14px;font-weight:600;border:0;border-radius:8px;padding:9px 14px;cursor:pointer}'
    + '#tlc-box .next{background:#f59e0b;color:#1a1200}'
    + '#tlc-box .prev{background:#e2e8f0;color:#0f172a}'
    + '#tlc-box .skip{background:none;color:#64748b;padding:9px 6px}'
    + '@media (max-width:640px){#tlc-box{left:12px!important;right:12px!important;bottom:12px!important;top:auto!important;width:auto}#tlc-panel{left:10px;right:10px;bottom:10px;width:auto;max-width:none}#tlc-bar{font-size:12px}}'
    + '@media (prefers-reduced-motion:reduce){#tlc-hl{transition:none}}';
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

    /* ---------- Voz ---------- */
    var mudo = false, vozES = null;
    try { mudo = localStorage.getItem('tlc_demo_mudo') === '1'; } catch (e) {}
    function elegirVoz() {
        if (!('speechSynthesis' in window)) return;
        var vs = speechSynthesis.getVoices().filter(function (v) { return /^es/i.test(v.lang); });
        vozES = vs.filter(function (v) { return /es-ES/i.test(v.lang) && /google|natural|premium|monica|mónica|helena/i.test(v.name); })[0] || vs.filter(function (v) { return /es-ES/i.test(v.lang); })[0] || vs[0] || null;
    }
    if ('speechSynthesis' in window) { elegirVoz(); speechSynthesis.onvoiceschanged = elegirVoz; }
    function hablar(t) {
        if (mudo || !t || !('speechSynthesis' in window)) return;
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(t.replace(/<[^>]+>/g, '')); u.lang = 'es-ES'; if (vozES) u.voice = vozES;
        speechSynthesis.speak(u);
    }
    function callar() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }

    /* ---------- Cambio de despacho en el sitio ---------- */
    function cambiarA(r) {
        callar();
        try {
            localStorage.removeItem('cm_auth'); localStorage.removeItem('hub_supabase_jwt');
            Object.keys(localStorage).forEach(function (k) { if (k.indexOf('sb-') === 0 || k.indexOf('tlc_prog_') === 0) localStorage.removeItem(k); });
            localStorage.setItem('hub_user', JSON.stringify({ id: r.wp, name: r.nombre, display_name: r.nombre, username: r.username, email: r.username + '@toplidercoach.com', demo: true }));
            localStorage.setItem('hub_token', 'demo');
            localStorage.setItem('tlc_demo_role', r.slug);
        } catch (e) {}
        location.href = location.pathname;
    }

    /* ---------- Barra superior ---------- */
    function barra() {
        if ($('#tlc-bar')) return;
        var b = document.createElement('div'); b.id = 'tlc-bar';
        var chips = ROLES.map(function (r) { return '<button type="button" class="chip' + (r.slug === ROLE ? ' on' : '') + '" data-slug="' + r.slug + '">' + r.rol + '</button>'; }).join('');
        b.innerHTML = '<span class="lbl">👁 <b>Modo demo</b> — datos ficticios</span><span class="vc">Ver como</span>' + chips
            + '<span class="sp"></span><button type="button" class="act" id="tlc-bar-rec">Recorrido</button><a class="act sub" href="' + OFERTA_URL + '">🚀 Suscríbete</a>';
        var app = $('#app-container') || document.body;
        app.insertBefore(b, app.firstChild);
        b.querySelectorAll('.chip').forEach(function (c) { c.onclick = function () { var r = ROLES.filter(function (x) { return x.slug === c.dataset.slug; })[0]; if (r && r.slug !== ROLE) cambiarA(r); }; });
        $('#tlc-bar-rec').onclick = function () { var p = $('#tlc-panel'); if (p) { p.classList.remove('min'); p.scrollIntoView(); } };
    }

    /* ---------- Mensajes amables del guardian ---------- */
    function suavizarErrores() {
        if (typeof window.showToast !== 'function' || window.showToast.__tlc) return;
        var orig = window.showToast;
        var f = function (msg, type, dur) {
            if (typeof msg === 'string' && /solo lectura|Modo demo/i.test(msg)) return orig('En la demo puedes mirarlo todo, pero no guardar cambios. En tu club sí podrías.', 'warning', 4500);
            return orig(msg, type, dur);
        };
        f.__tlc = true; window.showToast = f;
    }

    /* ---------- Panel "Recorrido rapido" ---------- */
    var REC = [];
    var hechos = {};
    try { hechos = JSON.parse(localStorage.getItem('tlc_prog_' + ROLE) || '{}'); } catch (e) {}
    function guardarProg() { try { localStorage.setItem('tlc_prog_' + ROLE, JSON.stringify(hechos)); } catch (e) {} }
    function nHechos() { return REC.filter(function (h) { return hechos[h.id]; }).length; }
    function siguienteIdx() { for (var i = 0; i < REC.length; i++) if (!hechos[REC[i].id]) return i; return -1; }

    function panel() {
        var p = $('#tlc-panel');
        if (!p) { p = document.createElement('div'); p.id = 'tlc-panel'; document.body.appendChild(p); if (window.innerWidth <= 640) p.classList.add('min'); }
        var n = nHechos(), next = siguienteIdx();
        p.innerHTML =
            '<div class="hd"><div class="ring" style="--p:' + Math.round(n / REC.length * 100) + '%"><span>' + n + '/' + REC.length + '</span></div>'
            + '<div><b>Recorrido rápido</b><small>' + (n === REC.length ? 'Lo has visto todo' : 'Lo que merece la pena ver') + '</small></div>'
            + '<button type="button" class="voz" title="Voz">' + (mudo ? '🔇' : '🔊') + '</button><span class="ch">▾</span></div>'
            + '<div class="bd">'
            + REC.map(function (h, i) { return '<div class="it' + (hechos[h.id] ? ' done' : '') + (i === next ? ' next' : '') + '" data-i="' + i + '"><span class="ic">' + (hechos[h.id] ? '✅' : h.ico) + '</span><div><b>' + h.title + '</b><small>' + h.sub + '</small></div></div>'; }).join('')
            + '<div class="btns">'
            + (next >= 0 ? '<button type="button" class="btn go" id="tlc-next">➜ Llévame al siguiente</button>' : '<a class="btn go" href="' + WA_URL + '">Quiero esto en mi club →</a>')
            + '<a class="btn of" href="' + OFERTA_URL + '">🎁 Ver la oferta · Club Prioritario</a>'
            + '</div><button type="button" class="lnk" id="tlc-solo">Explorar por mi cuenta</button></div>';
        p.querySelector('.hd').onclick = function (e) { if (e.target.classList.contains('voz')) return; p.classList.toggle('min'); };
        p.querySelector('.voz').onclick = function () { mudo = !mudo; try { localStorage.setItem('tlc_demo_mudo', mudo ? '1' : '0'); } catch (e) {} if (mudo) callar(); panel(); };
        p.querySelectorAll('.it').forEach(function (it) { it.onclick = function () { lanzar(parseInt(it.dataset.i, 10)); }; });
        var nb = $('#tlc-next'); if (nb) nb.onclick = function () { lanzar(next); };
        $('#tlc-solo').onclick = function () { p.classList.add('min'); callar(); };
    }

    /* ---------- Motor de foco ---------- */
    var steps = [], i = 0, hIdx = -1, shade, hl, box, target = null;
    function ui() {
        if (!shade) {
            shade = document.createElement('div'); shade.id = 'tlc-shade';
            hl = document.createElement('div'); hl.id = 'tlc-hl'; shade.appendChild(hl);
            box = document.createElement('div'); box.id = 'tlc-box';
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
        hl.style.top = (r.top - pad) + 'px'; hl.style.left = (r.left - pad) + 'px';
        hl.style.width = (r.width + pad * 2) + 'px'; hl.style.height = (r.height + pad * 2) + 'px';
        hl.style.boxShadow = '0 0 0 9999px rgba(15,23,42,.72),0 0 0 3px #f59e0b';
        if (window.innerWidth <= 640) return;
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
        var s = steps[i], h = REC[hIdx];
        box.innerHTML = '<div class="step">' + h.title.toUpperCase() + ' · ' + (i + 1) + ' / ' + steps.length + '</div><h4>' + s.title + '</h4><p>' + s.text + '</p>'
            + '<div class="acts"><button type="button" class="skip">Cerrar</button><span class="sp"></span>'
            + (i > 0 ? '<button type="button" class="prev">Anterior</button>' : '')
            + '<button type="button" class="next">' + (i === steps.length - 1 ? 'Hecho ✓' : 'Siguiente') + '</button></div>';
        box.querySelector('.skip').onclick = function () { hide(); callar(); };
        var p = box.querySelector('.prev'); if (p) p.onclick = function () { go(i - 1); };
        box.querySelector('.next').onclick = function () { if (i === steps.length - 1) terminar(); else go(i + 1); };
    }
    function go(n) {
        i = n; var s = steps[i]; ui();
        if (s.go) { try { s.go(); } catch (e) {} }
        target = null; render(); place(); hablar(s.voz || s.text);
        if (!s.sel) return;
        waitFor(function () { var el = $(s.sel); return visible(el) ? el : null; }, 8000, function (el) {
            if (i !== n) return;
            target = el; if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(place, 350);
        });
    }
    function lanzar(idx) {
        if (idx < 0 || !REC[idx]) return;
        hIdx = idx; steps = REC[idx].steps; var p = $('#tlc-panel'); if (p && window.innerWidth <= 640) p.classList.add('min');
        go(0);
    }
    function terminar() {
        hechos[REC[hIdx].id] = true; guardarProg(); hide(); callar(); panel();
        var next = siguienteIdx();
        if (next >= 0) setTimeout(function () { lanzar(next); }, 250);
        else hablar('Has visto lo importante. Si quieres esto en tu club, abajo tienes la oferta de Club Prioritario.');
    }

    /* ---------- Arranque ---------- */
    waitFor(function () { var app = $('#app-container'); return (app && visible(app) && window.cmState && window.cmState.activo) ? true : null; }, 15000, function (ok) {
        if (!ok) return;
        REC = (window.DEMO_RECORRIDOS && (window.DEMO_RECORRIDOS[ROLE] || window.DEMO_RECORRIDOS['generico'])) || [];
        if (!REC.length) return;
        barra(); suavizarErrores(); panel();
        waitFor(function () { var h = $('#dash-hero-stats'); return (h && h.textContent.trim().length > 0) ? true : null; }, 6000, function () {
            var next = siguienteIdx();
            if (next === 0 && window.innerWidth > 640) setTimeout(function () { lanzar(0); }, 800);
        });
    });
})();

/* ============================================================
   RECORRIDOS — 5 destacados por despacho. Cada destacado tiene sus pasos.
   Paso: { title, text, sel (elemento a iluminar), go (navegacion), voz (opcional; si falta se lee text) }
   ============================================================ */
(function () {
    function tab(mod) { return function () { var t = document.querySelector('.main-tab[onclick*="cambiarModulo(\'' + mod + '\'"]'); if (t) t.click(); }; }
    function sub(mod, key) { return function () { tab(mod)(); var s = document.querySelector('#modulo-' + mod + ' .sub-tab[onclick*="\'' + key + '\'"]'); if (s) s.click(); }; }
    function fichaMed(pid, nombre, tabKey, tabTxt) { return function () { if (typeof cmMedAbrirFicha === 'function') cmMedAbrirFicha(pid, nombre, ''); if (tabKey) setTimeout(function () { var b = Array.prototype.filter.call(document.querySelectorAll('.cmmed-tab'), function (x) { return new RegExp(tabTxt).test(x.textContent); })[0]; if (b && typeof cmMedCambiarTab === 'function') cmMedCambiarTab(tabKey, b); }, 500); }; }
    function fichaFis(pid, nombre, tabKey, tabTxt) { return function () { if (typeof cmFisioAbrirFicha === 'function') cmFisioAbrirFicha(pid, nombre, ''); if (tabKey) setTimeout(function () { var b = Array.prototype.filter.call(document.querySelectorAll('.cmfisio-tab'), function (x) { return new RegExp(tabTxt).test(x.textContent); })[0]; if (b && typeof cmFisioCambiarTab === 'function') cmFisioCambiarTab(tabKey, b); }, 500); }; }
    var HERRERA = '00000000-0000-4000-8000-de310000000d', HERRERA_N = 'Nicolas Herrera Vazquez';

    window.DEMO_RECORRIDOS = {
        'entrenador': [
            { id: 'dash', ico: '📊', title: 'Tu temporada de un vistazo', sub: 'Balance, racha, cargas y quién está disponible', steps: [
                { sel: '#dash-hero-stats', title: 'El balance', text: 'Ocho partidos, cinco victorias, siete goles a favor de diferencia. Se calcula solo a partir de los partidos que registras.', go: tab('dashboard') },
                { sel: '#dash-ins-cargas', title: 'Estado de cargas', text: 'Cuántos jugadores están en zona óptima, en atención o en riesgo de lesión. Sale del RPE que registran tras cada sesión. Cinco en atención: conviene mirarlos antes del martes.' },
                { sel: '#dash-squad-status', title: 'Quién está disponible', text: 'Herrera y Gómez Cruz están de baja. Tú ves que no están; el diagnóstico solo lo ve el médico. Así se protegen los datos de salud sin dejarte a ciegas.' }
            ] },
            { id: 'plantilla', ico: '👥', title: 'Tu plantilla', sub: '24 jugadores con su historial completo', steps: [
                { sel: '#lista-jugadores', title: 'La plantilla', text: 'Dorsal, posición y foto. Cada ficha guarda su historial: minutos, goles, asistencia, RPE y tests físicos.', go: sub('config', 'plantilla') }
            ] },
            { id: 'sesiones', ico: '📅', title: 'Sesiones y cargas', sub: 'La semana planificada y el control de carga', steps: [
                { sel: '#planificador-mis-sesiones', title: 'Tus sesiones', text: 'Treinta sesiones esta temporada, con las de esta semana planificadas hasta el partido de Copa. Cada una lleva su microciclo, su día respecto al partido y el RPE medio del grupo.', go: sub('planificador', 'mis-sesiones') },
                { sel: '#planificador-cargas', title: 'Control de cargas', text: 'Carga aguda, crónica, ACWR, monotonía y strain por jugador, calculados solos desde el RPE. Lo que el preparador físico y tú miráis el jueves para decidir quién descansa.', go: sub('planificador', 'cargas') }
            ] },
            { id: 'partidos', ico: '⚽', title: 'El próximo partido', sub: 'Liga y Copa en el mismo calendario', steps: [
                { sel: '#lista-partidos', title: 'Calendario de competición', text: 'El siguiente es el martes contra Sporting Casarejo en casa. Desde aquí preparas la convocatoria y el plan de partido, y luego registras resultado y minutos.', go: sub('matchstats', 'partidos') }
            ] },
            { id: 'rival', ico: '🔍', title: 'El dossier del rival', sub: 'Preparado por el analista, listo en el vestuario', steps: [
                { sel: '#matchstats-analisisrival', title: 'Análisis de Casarejo', text: 'Sistema, puntos fuertes, jugadores clave y balón parado. El analista lo prepara; tú lo abres el martes. Nadie manda nada por WhatsApp.', go: sub('matchstats', 'analisisrival') }
            ] }
        ],
        'medico': [
            { id: 'sem', ico: '🚦', title: 'El semáforo del club', sub: 'Disponibles, precaución, lesionados y alertas', steps: [
                { sel: '#cmmed-stats-bar', title: 'El semáforo', text: 'Lo que marques aquí es lo que verá el entrenador en su plantilla: el color, nunca el motivo.', go: tab('medico') },
                { sel: '#cmmed-cert-alerts', title: 'Certificados médicos', text: 'El sistema te avisa solo: un certificado caducado y otro que vence en dos semanas.' }
            ] },
            { id: 'ficha', ico: '🩺', title: 'Una historia clínica', sub: 'La ficha de Herrera, con su lesión codificada', steps: [
                { sel: '#cmmed-tab-antecedentes', title: 'La ficha médica', text: 'Grupo sanguíneo, alergias, medicación, cirugías previas y las fechas de ECG, prueba de esfuerzo y analítica.', go: fichaMed(HERRERA, HERRERA_N, null) },
                { sel: '#cmmed-lesiones-lista', title: 'La lesión, con código OSIICS', text: 'Rotura fibrilar grado II del isquiotibial derecho, mecanismo sin contacto, 28 días estimados. Desde aquí llevas el protocolo de vuelta al juego.', go: fichaMed(HERRERA, HERRERA_N, 'lesiones', 'Lesiones') }
            ] },
            { id: 'rgpd', ico: '🔒', title: 'RGPD: quién ha firmado', sub: 'Consentimientos de las familias, con fecha', steps: [
                { sel: '#cmmed-tab-consentimientos', title: 'Consentimientos', text: 'Los datos de salud son categoría especial. Aquí está el consentimiento de cada familia. Si un día te lo pide un inspector, está a un clic.', go: fichaMed(HERRERA, HERRERA_N, 'consentimientos', 'RGPD') }
            ] },
            { id: 'cuadro', ico: '📈', title: 'Tu cuadro de mando', sub: 'Lesiones por mes, zona, severidad y mecanismo', steps: [
                { sel: '#cmmed-dashboard', title: 'Cuadro de mando', text: 'Con una temporada de datos sabrás si tu club se lesiona más en pretemporada, más en entrenamientos o más en los isquios.', go: function () { if (typeof cmMedCerrarFicha === 'function') cmMedCerrarFicha(); if (typeof cmMedVistaDashboard === 'function') cmMedVistaDashboard(); } }
            ] },
            { id: 'otra', ico: '🔁', title: 'La otra mitad', sub: 'Mira la misma lesión desde el fisio', steps: [
                { title: 'Ahora, como fisio', text: 'Tú registras la lesión; Claudia la trata. Arriba, en "Ver como", pulsa Fisio: verás la misma lesión de Herrera desde su lado, con el tratamiento y la agenda.' }
            ] }
        ],
        'fisio': [
            { id: 'res', ico: '🚦', title: 'Tu resumen de plantilla', sub: 'Disponibles, precaución y lesionados', steps: [
                { sel: '#cmfisio-stats-bar', title: 'El semáforo compartido', text: 'Tú y la doctora compartís este semáforo: quien cambia el color cambia lo que ve el entrenador.', go: tab('fisio') }
            ] },
            { id: 'trat', ico: '🩹', title: 'Un tratamiento', sub: 'Herrera, en fase aguda de una rotura fibrilar', steps: [
                { sel: '#cmfisio-tab-tratamientos', title: 'El tratamiento', text: 'Objetivo, técnicas previstas, frecuencia semanal y fecha estimada de alta. Ligado a la lesión que registró la doctora: no se escribe dos veces.', go: fichaFis(HERRERA, HERRERA_N, 'tratamientos', 'Tratamientos') },
                { sel: '#cmfisio-tab-sesiones', title: 'Las sesiones', text: 'Qué te cuenta el jugador, qué observas, qué le haces, qué planificas y un nivel de dolor. Herrera ha pasado de 7 a 4 en cinco días.', go: fichaFis(HERRERA, HERRERA_N, 'sesiones', 'Sesiones') },
                { sel: '#cmfisio-tab-evolucion', title: 'La curva del dolor', text: 'La evolución sesión a sesión. Lo que enseñas al jugador para que vea que va bien, y a la doctora para decidir la vuelta al juego.', go: fichaFis(HERRERA, HERRERA_N, 'evolucion', 'Evoluci') }
            ] },
            { id: 'agenda', ico: '📆', title: 'Tu agenda', sub: 'Siete citas la semana que viene', steps: [
                { sel: '#cmfisio-player-grid', title: 'La agenda', text: 'Herrera el lunes, miércoles y viernes; Gómez Cruz el lunes; valoración de vuelta al grupo el jueves. Citas de tratamiento, preventivas, de valoración y de mantenimiento.', go: function () { if (typeof cmFisioCerrarFicha === 'function') cmFisioCerrarFicha(); var b = document.getElementById('cmfisio-btn-calendario'); if (b && /Calendario/.test(b.textContent)) b.click(); } }
            ] },
            { id: 'inf', ico: '📨', title: 'El informe al entrenador', sub: 'Un botón, una notificación, cero WhatsApps', steps: [
                { sel: '#cmfisio-report-overlay', title: 'Informe diario', text: 'Al acabar la tarde pulsas un botón y el entrenador recibe quién está apto, limitado o no disponible, con tu nota.', go: function () { var b = document.getElementById('cmfisio-btn-calendario'); if (b && /Jugadores/.test(b.textContent)) b.click(); if (typeof cmFisioGenerarInformeDiario === 'function') setTimeout(cmFisioGenerarInformeDiario, 300); } }
            ] },
            { id: 'otra', ico: '🔁', title: 'Compruébalo desde el banquillo', sub: 'Entra como entrenador: no verá nada de esto', steps: [
                { title: 'Ahora, como entrenador', text: 'Tres personas, tres despachos, un solo dato. Arriba, en "Ver como", pulsa Entrenador y comprueba que él solo ve el color del semáforo.', go: function () { var o = document.getElementById('cmfisio-report-overlay'); if (o) o.remove(); } }
            ] }
        ],
        'generico': [
            { id: 'bienv', ico: '👋', title: 'Tu despacho', sub: 'Lo que ves es lo que ve tu cargo', steps: [
                { title: 'Bienvenido a tu despacho', text: 'Estás dentro de un club de demostración con el cargo que has elegido. Todo lo que ves son datos de esta temporada. Puedes mirarlo todo; para guardar cambios necesitarías tu propio club.' }
            ] },
            { id: 'cambia', ico: '🔁', title: 'Cambia de sillón', sub: 'Compara lo que ve cada cargo', steps: [
                { title: 'Ver como…', text: 'Arriba tienes "Ver como": prueba a entrar con otro cargo y compara. Esa diferencia es el corazón de la plataforma.' }
            ] }
        ]
    };
})();
