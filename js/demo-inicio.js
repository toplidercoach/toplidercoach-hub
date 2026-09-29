/* ============================================================
   TopLiderCoach — Pantalla de inicio por despacho (demo-inicio.js)
   Solo en modo demo (pase de visitante). Para clientes reales no hace nada.
   Fotos opcionales: demo/img/inicio/<clave>.jpg (16:9, ~1200x675, <200 KB).
   Si no existe la foto, la tarjeta muestra degradado + icono.
   ============================================================ */
(function () {
    'use strict';
    var ROLE = null, hu = null;
    try { ROLE = localStorage.getItem('tlc_demo_role'); hu = JSON.parse(localStorage.getItem('hub_user') || 'null'); } catch (e) {}
    if (!ROLE || !hu || hu.demo !== true) return;

    var IMG_BASE = 'demo/img/inicio/';
    var OFERTA_URL = 'demo/#oferta';

    /* Ficha de cada modulo: titulo, frase, icono, tono del degradado */
    var MODS = {
        dashboard:          { t: 'Cuadro de mando',        d: 'Balance, racha, cargas y disponibilidad de un vistazo.',      i: '📊', c: '#1d4ed8' },
        planificador:       { t: 'Planificador',           d: 'Sesiones, microciclos, asistencia, RPE y control de cargas.',  i: '📅', c: '#0f766e' },
        pizarra:            { t: 'Pizarra táctica',        d: 'Dibuja ejercicios y jugadas y guárdalos en tus sesiones.',     i: '🎯', c: '#7c2d12' },
        matchstats:         { t: 'Gestión de competición', d: 'Calendario, convocatorias, estadísticas y análisis de rivales.', i: '⚽', c: '#166534' },
        staff:              { t: 'Cuerpo técnico',         d: 'Quién es quién en el equipo y qué hace cada uno.',            i: '🧑‍🏫', c: '#4c1d95' },
        config:             { t: 'Mi club',                d: 'Plantilla, temporadas y datos del club.',                      i: '🏟️', c: '#374151' },
        club:               { t: 'Miembros y permisos',    d: '19 personas de staff, 11 cargos, quién ve qué.',              i: '🗝️', c: '#b45309' },
        medico:             { t: 'Despacho médico',        d: 'Lesiones OSIICS, fichas, certificados y vuelta al juego.',    i: '🩺', c: '#b91c1c' },
        fisio:              { t: 'Fisioterapia',           d: 'Tratamientos, sesiones SOAP, agenda e informe diario.',        i: '🩹', c: '#0e7490' },
        prepfisica:         { t: 'Preparación física',     d: 'GPS, tests, antropometría y ACWR automático.',                 i: '📡', c: '#15803d' },
        scouting:           { t: 'Scouting',               d: 'Partidos observados, informes de jugadores y shortlist.',      i: '🔎', c: '#1e40af' },
        misgastos:          { t: 'Mis gastos',             d: 'Hojas de gastos de desplazamiento, del borrador al pago.',     i: '🧾', c: '#6d28d9' },
        utillero:           { t: 'Utillero',               d: 'Almacén, tallas de 142 jugadores y peticiones del staff.',     i: '📦', c: '#a16207' },
        pagos:              { t: 'Cuotas',                 d: 'Cobros, impagos y recibos de 96 familias.',                    i: '💶', c: '#047857' },
        familias:           { t: 'Familias',               d: 'Directorio de tutores y circulares con confirmación.',         i: '🏠', c: '#9d174d' },
        dd:                 { t: 'Dirección deportiva',    d: 'Plan de temporada, cobertura, agentes y gastos del staff.',   i: '📋', c: '#1e3a8a' },
        economico:          { t: 'Económico',              d: 'Contabilidad por partida doble, presupuesto y reembolsos.',    i: '📒', c: '#065f46' },
        cumplimiento_rfef:  { t: 'Control RFEF',           d: '11 entregas, certificados y ratio de coste de plantilla.',     i: '🏛️', c: '#7f1d1d' },
        patrocinadores:     { t: 'Patrocinadores',         d: 'Contratos, contraprestaciones y calendario de cobros.',        i: '🤝', c: '#3f6212' },
        docs:               { t: 'Documentos',             d: 'Los documentos del club, ordenados y a mano.',                 i: '📁', c: '#334155' }
    };

    var PERSONAS = {
        'direccion':          { nombre: 'Dirección', rol: 'Presidencia y Dirección', frase: 'Siete equipos, 142 jugadores, 19 personas de staff. Todo el club en una pantalla.' },
        'entrenador':         { nombre: 'Roberto',   rol: 'Entrenador · Primer equipo', frase: 'Liga recién empezada, partido esta semana y dos bajas que cambian la convocatoria.' },
        'director-deportivo': { nombre: 'Jorge',     rol: 'Director Deportivo', frase: 'Plan de la próxima temporada abierto y una hoja de gastos pendiente de aprobar.' },
        'medico':             { nombre: 'Irene',     rol: 'Médico', frase: 'Dos lesionados activos, uno en vuelta al juego y un certificado caducado.' },
        'fisio':              { nombre: 'Claudia',   rol: 'Fisioterapeuta', frase: 'Cuatro tratamientos activos y siete citas esta semana.' },
        'preparador-fisico':  { nombre: 'Víctor',    rol: 'Preparador Físico', frase: 'Cinco jugadores en zona de atención antes del partido.' },
        'analista':           { nombre: 'Hugo',      rol: 'Analista', frase: 'El dossier del próximo rival está listo. Falta pasar los gastos de la semana.' },
        'economico':          { nombre: 'Montserrat',rol: 'Gestora Económica', frase: 'La cuota del mes casi cobrada y dos entregas de la RFEF que vencen el día 30.' },
        'cantera':            { nombre: 'Sergio',    rol: 'Coordinador de Cantera', frase: 'Cinco equipos, 96 familias y una circular pendiente de enviar.' },
        'utillero':           { nombre: 'Emilio',    rol: 'Utillero', frase: 'Dos artículos bajo mínimo y una petición urgente de la fisio.' }
    };
    var yo = PERSONAS[ROLE] || { nombre: 'Hola', rol: 'Visitante', frase: '' };
    var saludo = (function () { var h = new Date().getHours(); return h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'; })();

    /* ---------- Estilos ---------- */
    var css = ''
    + '#tlc-inicio{position:fixed;inset:0;z-index:9800;background:#0b1220;color:#e8edf5;overflow-y:auto;font:15px/1.5 system-ui,sans-serif;display:none}'
    + '#tlc-inicio.on{display:block}'
    + '#tlc-inicio .lay{display:grid;grid-template-columns:260px 1fr;min-height:100%}'
    + '#tlc-inicio aside{background:#0f172a;border-right:1px solid #1e293b;padding:22px 14px;position:sticky;top:0;height:100vh;overflow-y:auto}'
    + '#tlc-inicio aside .brand{display:flex;align-items:center;gap:10px;padding:0 6px 18px;border-bottom:1px solid #1e293b;margin-bottom:12px}'
    + '#tlc-inicio aside .brand img{width:34px;height:34px;border-radius:50%}'
    + '#tlc-inicio aside .brand b{font-size:15px;color:#f59e0b}'
    + '#tlc-inicio aside .grp{font:700 11px system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#64748b;padding:14px 8px 6px}'
    + '#tlc-inicio aside .it{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px;border:0;border-radius:10px;background:none;color:#cbd5e1;font:500 14px system-ui,sans-serif;cursor:pointer}'
    + '#tlc-inicio aside .it:hover{background:#1e293b;color:#fff}'
    + '#tlc-inicio aside .it.locked{opacity:.4;cursor:not-allowed}'
    + '#tlc-inicio aside .it.locked::after{content:"🔒";margin-left:auto;font-size:11px}'
    + '#tlc-inicio main{padding:34px 36px 60px;max-width:1240px}'
    + '#tlc-inicio .hello small{display:inline-flex;align-items:center;gap:8px;background:rgba(245,158,11,.14);color:#fcd34d;border:1px solid rgba(245,158,11,.4);border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}'
    + '#tlc-inicio .hello h1{margin:14px 0 4px;font-size:clamp(28px,4vw,44px);line-height:1.05;font-weight:800;letter-spacing:-.01em}'
    + '#tlc-inicio .hello .rol{color:#f59e0b;font-weight:600;font-size:16px}'
    + '#tlc-inicio .hello p{color:#aab6c8;max-width:64ch;margin:10px 0 0;font-size:17px}'
    + '#tlc-inicio .acts{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0 30px}'
    + '#tlc-inicio .btn{font:700 15px system-ui,sans-serif;border:0;border-radius:10px;padding:12px 18px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px}'
    + '#tlc-inicio .btn.a{background:#f59e0b;color:#1a1200}'
    + '#tlc-inicio .btn.g{background:transparent;color:#e8edf5;border:1px solid #334155}'
    + '#tlc-inicio h2{font-size:14px;letter-spacing:.1em;text-transform:uppercase;color:#64748b;margin:0 0 12px;font-weight:700}'
    + '#tlc-inicio .tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;margin-bottom:32px}'
    + '#tlc-inicio .tile{position:relative;aspect-ratio:16/10;border-radius:16px;overflow:hidden;border:0;padding:0;cursor:pointer;text-align:left;color:#fff;background:#1e293b;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:transform .18s,box-shadow .18s}'
    + '#tlc-inicio .tile:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(0,0,0,.5)}'
    + '#tlc-inicio .tile .bg{position:absolute;inset:0;background-size:cover;background-position:center}'
    + '#tlc-inicio .tile .bg.ico{display:grid;place-items:center;font-size:64px;opacity:.9}'
    + '#tlc-inicio .tile::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,6,23,.05) 30%,rgba(2,6,23,.88) 100%)}'
    + '#tlc-inicio .tile .tx{position:absolute;left:16px;right:16px;bottom:14px;z-index:2}'
    + '#tlc-inicio .tile .tx b{display:block;font-size:19px;font-weight:800;text-shadow:0 2px 10px rgba(0,0,0,.5)}'
    + '#tlc-inicio .tile .tx span{display:block;font-size:13px;color:#cbd5e1;margin-top:3px;line-height:1.35}'
    + '#tlc-inicio .tile.locked{opacity:.45;cursor:not-allowed}'
    + '#tlc-inicio .tile.locked .tx b::after{content:" 🔒";font-size:14px}'
    + '#tlc-inicio .offer{display:flex;flex-wrap:wrap;align-items:center;gap:16px;background:#fff;color:#0f172a;border-radius:16px;padding:20px 22px;margin-top:8px}'
    + '#tlc-inicio .offer b{font-size:18px;display:block}'
    + '#tlc-inicio .offer span{color:#475569;font-size:14px}'
    + '#tlc-inicio .offer .sp{flex:1}'
    + '#tlc-inicio .offer .btn.a{white-space:nowrap}'
    + '#tlc-inicio .mob{display:none}'
    + '@media (max-width:900px){#tlc-inicio .lay{grid-template-columns:1fr}#tlc-inicio aside{display:none}#tlc-inicio main{padding:22px 14px 40px}#tlc-inicio .tiles{grid-template-columns:1fr 1fr;gap:10px}#tlc-inicio .tile{aspect-ratio:4/3;border-radius:12px}#tlc-inicio .tile .tx{left:10px;right:10px;bottom:10px}#tlc-inicio .tile .tx b{font-size:15px}#tlc-inicio .tile .tx span{display:none}#tlc-inicio .tile .bg.ico{font-size:40px}}'
    + '@media (prefers-reduced-motion:reduce){#tlc-inicio .tile{transition:none}}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    /* ---------- Utilidades ---------- */
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function key(tab) { var m = (tab.getAttribute('onclick') || '').match(/cambiarModulo\('([a-z_]+)'/); return m ? m[1] : null; }
    function locked(tab) { return tab.dataset && tab.dataset.cmLocked === '1'; }
    function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
    function waitFor(fn, ms, cb) { var t0 = Date.now(); (function loop() { var r = null; try { r = fn(); } catch (e) {} if (r) return cb(r); if (Date.now() - t0 > ms) return cb(null); setTimeout(loop, 200); })(); }

    /* Modulos visibles para este cargo, en el orden del HUB, agrupados */
    function modulos() {
        var out = { principal: [], campo: [], oficina: [] };
        $$('.main-tabs > .main-tab:not(.cmmenu-btn)').forEach(function (t) {
            var k = key(t); if (!k) return;
            if (t.style.display === 'none') return;
            out.principal.push({ k: k, tab: t, lock: locked(t), label: txt(t) });
        });
        ['campo', 'oficina'].forEach(function (g) {
            $$('#cmmenu-panel-' + g + ' .main-tab').forEach(function (t) {
                var k = key(t); if (!k) return;
                out[g].push({ k: k, tab: t, lock: locked(t), label: txt(t) });
            });
        });
        return out;
    }

    function tile(m) {
        var f = MODS[m.k] || { t: m.label, d: '', i: '📁', c: '#334155' };
        var b = document.createElement('button'); b.type = 'button'; b.className = 'tile' + (m.lock ? ' locked' : '');
        var bg = document.createElement('div'); bg.className = 'bg ico'; bg.style.background = 'linear-gradient(135deg,' + f.c + ',#0f172a)'; bg.textContent = f.i;
        b.appendChild(bg);
        // Foto opcional: si carga, sustituye al degradado
        var img = new Image();
        img.onload = function () { bg.className = 'bg'; bg.textContent = ''; bg.style.background = ''; bg.style.backgroundImage = 'url("' + img.src + '")'; };
        img.src = IMG_BASE + m.k + '.jpg';
        b.innerHTML += '<div class="tx"><b>' + f.t + '</b><span>' + f.d + '</span></div>';
        b.onclick = function () { if (m.lock) return; ir(m.tab); };
        return b;
    }

    function ir(tab) { cerrar(); try { tab.click(); } catch (e) {} }

    var root;
    function render() {
        if (!root) { root = document.createElement('div'); root.id = 'tlc-inicio'; document.body.appendChild(root); }
        var ms = modulos();
        var sideItem = function (m) { return '<button type="button" class="it' + (m.lock ? ' locked' : '') + '" data-k="' + m.k + '">' + ((MODS[m.k] || {}).i || '📁') + ' ' + ((MODS[m.k] || {}).t || m.label) + '</button>'; };
        var tilesHtml = function (arr) { return arr.length ? '' : ''; };
        root.innerHTML =
            '<div class="lay"><aside>'
            + '<div class="brand"><img src="https://toplidercoach.com/wp-content/uploads/2025/11/diseno-sin-titulo-11.png" alt=""><b>Modo Club</b></div>'
            + (ms.principal.length ? '<div class="grp">Mi trabajo</div>' + ms.principal.map(sideItem).join('') : '')
            + (ms.campo.length ? '<div class="grp">Club Campo</div>' + ms.campo.map(sideItem).join('') : '')
            + (ms.oficina.length ? '<div class="grp">Club Oficina</div>' + ms.oficina.map(sideItem).join('') : '')
            + '</aside><main>'
            + '<div class="hello"><small>👁 Modo demostración · datos ficticios</small><h1>' + saludo + ', ' + yo.nombre + '.</h1><div class="rol">' + yo.rol + ' · Rapid Alianza</div><p>' + yo.frase + ' Elige por dónde empezar, o deja que el recorrido rápido te lleve.</p></div>'
            + '<div class="acts"><button type="button" class="btn a" id="tlc-ini-rec">➜ Empezar el recorrido rápido</button><a class="btn g" href="' + OFERTA_URL + '">🎁 Ver la oferta · Club Prioritario</a><a class="btn g" href="demo/">Cambiar de despacho</a></div>'
            + (ms.principal.length ? '<h2>Mi trabajo</h2><div class="tiles" id="tlc-t1"></div>' : '')
            + (ms.campo.length ? '<h2>Club Campo</h2><div class="tiles" id="tlc-t2"></div>' : '')
            + (ms.oficina.length ? '<h2>Club Oficina</h2><div class="tiles" id="tlc-t3"></div>' : '')
            + '<div class="offer"><div><b>450 € al año, todo incluido. Sin límite de jugadores ni equipos.</b><span>Los 50 primeros clubs entran como Club Prioritario: 20 % menos el primer año y os montamos el club.</span></div><span class="sp"></span><a class="btn a" href="' + OFERTA_URL + '">Quiero esto en mi club →</a></div>'
            + '</main></div>';
        var fill = function (id, arr) { var c = $('#' + id, root); if (c) arr.forEach(function (m) { c.appendChild(tile(m)); }); };
        fill('tlc-t1', ms.principal); fill('tlc-t2', ms.campo); fill('tlc-t3', ms.oficina);
        $$('aside .it', root).forEach(function (b) {
            b.onclick = function () { if (b.classList.contains('locked')) return; var all = ms.principal.concat(ms.campo, ms.oficina); var m = all.filter(function (x) { return x.k === b.dataset.k; })[0]; if (m) ir(m.tab); };
        });
        $('#tlc-ini-rec', root).onclick = function () { cerrar(); var p = $('#tlc-panel'); if (p) { p.classList.remove('min'); var n = $('#tlc-next'); if (n) n.click(); } };
        root.classList.add('on'); document.body.style.overflow = 'hidden';
    }
    function cerrar() { if (root) root.classList.remove('on'); document.body.style.overflow = ''; }
    function abrir() { render(); }

    /* Boton "Inicio" en la barra de demo */
    function botonBarra() {
        var bar = $('#tlc-bar'); if (!bar || $('#tlc-bar-inicio')) return;
        var b = document.createElement('button'); b.type = 'button'; b.className = 'act'; b.id = 'tlc-bar-inicio'; b.textContent = '⌂ Inicio';
        var rec = $('#tlc-bar-rec'); bar.insertBefore(b, rec || null);
        b.onclick = abrir;
    }

    /* Arranque: cuando el HUB este dentro y cm-menu haya construido los grupos */
    waitFor(function () { var app = $('#app-container'); return (app && app.offsetParent !== null && window.cmState && window.cmState.activo && $('.main-tabs')) ? true : null; }, 15000, function (ok) {
        if (!ok) return;
        waitFor(function () { return $('#tlc-bar') || null; }, 6000, function () { botonBarra(); });
        // Dar tiempo a cm-menu a mover los despachos a sus desplegables
        setTimeout(function () {
            var visto = false; try { visto = sessionStorage.getItem('tlc_inicio_visto_' + ROLE) === '1'; } catch (e) {}
            if (!visto) { abrir(); try { sessionStorage.setItem('tlc_inicio_visto_' + ROLE, '1'); } catch (e) {} }
        }, 900);
    });
    window.tlcAbrirInicio = abrir;
})();
