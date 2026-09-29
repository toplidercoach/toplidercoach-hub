/* ============================================================
   TopLiderCoach HUB — Menú lateral (js/sidebar.js)
   Construye una barra lateral a partir de las pestañas principales existentes
   (.main-tab) y de los grupos Club Campo / Club Oficina de cm-menu.
   No mueve ni modifica las pestañas originales: las clona y, al pulsar,
   dispara el click de la original. Permisos, candados y cm-menu siguen mandando.
   Solo actúa en pantallas de más de 900 px (en móvil manda responsive-nav.js).
   ============================================================ */
(function () {
    'use strict';
    var MQ = window.matchMedia('(min-width: 901px)');
    var LOGO = 'https://toplidercoach.com/wp-content/uploads/2025/11/diseno-sin-titulo-11.png';

    /* Icono por clave de módulo (trazos SVG, 24x24) */
    var I = {
        dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
        planificador: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M8 15h3"/>',
        pizarra: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>',
        matchstats: '<circle cx="12" cy="12" r="9"/><path d="M12 3l2.5 4.5L12 12l-2.5-4.5zM3.5 9.5l5 1.5L12 12l-3 5-5.5-1M20.5 9.5l-5 1.5L12 12l3 5 5.5-1"/>',
        analista: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M8 11h6M11 8v6"/>',
        analisis: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M8 11h6M11 8v6"/>',
        staff: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20v-1.5a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5V20M16 4a3.5 3.5 0 0 1 0 7M21.5 20v-1.5a5 5 0 0 0-3-4.6"/>',
        config: '<path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6"/>',
        club: '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4M12 15v2"/>',
        tacticlip: '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
        docs: '<path d="M4 4a2 2 0 0 1 2-2h7l7 7v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M13 2v7h7M8 13h8M8 17h5"/>',
        medico: '<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/><path d="M12 8v6M9 11h6"/>',
        fisio: '<path d="M3 12h3l2-5 4 10 2-5h7"/>',
        prepfisica: '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
        scouting: '<circle cx="8" cy="12" r="3.5"/><circle cx="16" cy="12" r="3.5"/><path d="M11.5 12h1M3 12l2-3M21 12l-2-3"/>',
        utillero: '<path d="M3 9l9-5 9 5v10l-9 5-9-5zM3 9l9 5 9-5M12 14v10"/>',
        misgastos: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4"/>',
        pagos: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h4"/>',
        familias: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
        dd: '<path d="M4 19V5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
        economico: '<path d="M4 20h16M6 16V10M10 16V6M14 16v-4M18 16V8"/>',
        cumplimiento_rfef: '<path d="M3 21h18M4 10h16M6 10V7l6-4 6 4v3M7 14v4M12 14v4M17 14v4"/>',
        patrocinadores: '<path d="M8 12l3 3 5-5"/><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/>',
        _: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/>'
    };
    var GRUPOS = { campo: 'Club Campo', oficina: 'Club Oficina' };

    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function txt(el) { return (el.textContent || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').trim(); }
    function key(tab) {
        var m = (tab.getAttribute('onclick') || '').match(/cambiarModulo\('([a-z_]+)'/);
        if (m) return m[1];
        var c = Array.prototype.find.call(tab.classList, function (x) { return x !== 'main-tab' && x !== 'active' && x !== 'cmmenu-btn' && x !== 'cm-locked'; });
        return c || '_';
    }
    function locked(tab) { return tab.dataset && tab.dataset.cmLocked === '1'; }
    function ocultoExplicito(tab) { return /display\s*:\s*none/.test(tab.getAttribute('style') || ''); }

    var sb, nav, built = false, timer;
    function build() {
        if (built) return; built = true;
        sb = document.createElement('aside'); sb.id = 'tlc-sidebar'; sb.setAttribute('aria-label', 'Menú principal');
        sb.innerHTML = '<div class="brand"><img src="' + LOGO + '" alt=""><div><b>HUB TopLiderCoach</b><small id="tlc-sb-club"></small></div></div><nav></nav>'
            + '<div class="ft"><button type="button" class="fold" id="tlc-sb-fold"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg><span>Plegar menú</span></button></div>';
        document.body.appendChild(sb);
        nav = $('nav', sb);
        document.body.classList.add('tlc-sb');
        try { if (localStorage.getItem('tlc_sb_min') === '1') document.body.classList.add('tlc-sb-min'); } catch (e) {}
        $('#tlc-sb-fold').onclick = function () {
            document.body.classList.toggle('tlc-sb-min');
            try { localStorage.setItem('tlc_sb_min', document.body.classList.contains('tlc-sb-min') ? '1' : '0'); } catch (e) {}
        };
        // Reconstruir cuando cambian las pestañas (módulos que se montan, candados, cm-menu, pestaña activa)
        var mo = new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(render, 120); });
        var tabs = $('.main-tabs'); if (tabs) mo.observe(tabs, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'data-cm-locked'] });
        mo.observe(document.body, { childList: true }); // aparición de los paneles de cm-menu
        $$('.cmmenu-panel').forEach(function (p) { mo.observe(p, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'data-cm-locked'] }); });
        render();
    }

    function item(tab) {
        var k = key(tab), b = document.createElement('button'); b.type = 'button';
        b.className = 'it' + (tab.classList.contains('active') ? ' on' : '') + (locked(tab) ? ' locked' : '');
        var label = txt(tab);
        b.innerHTML = '<svg viewBox="0 0 24 24">' + (I[k] || I._) + '</svg><span class="lb">' + label + '</span><span class="tip">' + label + '</span>';
        b.title = '';
        b.onclick = function () { if (locked(tab)) return; tab.click(); setTimeout(render, 80); };
        return b;
    }

    function render() {
        if (!nav) return;
        var frag = document.createDocumentFragment();
        var clubName = $('#club-nombre-header'); var small = $('#tlc-sb-club'); if (small && clubName) small.textContent = txt(clubName);

        var g = document.createElement('div'); g.className = 'grp'; g.innerHTML = '<span>Mi trabajo</span>'; frag.appendChild(g);
        $$('.main-tabs > .main-tab:not(.cmmenu-btn)').forEach(function (t) { if (!ocultoExplicito(t)) frag.appendChild(item(t)); });

        ['campo', 'oficina'].forEach(function (gk) {
            var panel = $('#cmmenu-panel-' + gk); if (!panel) return;
            var tabs = $$('.main-tab', panel).filter(function (t) { return !ocultoExplicito(t); });
            if (!tabs.length) return;
            var h = document.createElement('div'); h.className = 'grp'; h.innerHTML = '<span>' + GRUPOS[gk] + '</span>'; frag.appendChild(h);
            tabs.forEach(function (t) { frag.appendChild(item(t)); });
        });
        // Grupos que cm-menu pueda tener sin panel (pocos módulos): las pestañas siguen en .main-tabs y ya están arriba
        nav.innerHTML = ''; nav.appendChild(frag);
        // Observar paneles nuevos
        $$('.cmmenu-panel').forEach(function (p) { if (!p.__tlcObs) { p.__tlcObs = true; new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(render, 120); }).observe(p, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'data-cm-locked'] }); } });
    }

    function init() {
        if (!MQ.matches) return;
        var t0 = Date.now();
        (function loop() {
            var app = $('#app-container');
            if (app && app.offsetParent !== null && $('.main-tabs')) { build(); return; }
            if (Date.now() - t0 < 600000) setTimeout(loop, 300);
        })();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    (MQ.addEventListener ? MQ.addEventListener.bind(MQ) : MQ.addListener.bind(MQ))('change', function (e) { if (e.matches) init(); });
    // Si el usuario cierra sesión y vuelve a entrar en la misma pestaña, el contenedor se oculta y vuelve: reconstruir
    setInterval(function () { if (built && MQ.matches) { var app = $('#app-container'); document.body.classList.toggle('tlc-sb', !!(app && app.offsetParent !== null)); } }, 1500);
})();
