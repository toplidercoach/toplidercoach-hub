/* ============================================================
   TopLiderCoach HUB — Menu movil (hamburguesa + cajon lateral)
   Solo actua en pantallas de hasta 900 px. No mueve las pestañas originales:
   las clona en un cajon y, al pulsar, dispara el click de la original,
   asi que candados, permisos y cm-menu siguen mandando.
   ============================================================ */
(function () {
    'use strict';
    var MQ = window.matchMedia('(max-width: 900px)');
    var built = false, current, drawer, veil, btn;

    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
    function locked(el) { return el.dataset && el.dataset.cmLocked === '1'; }

    function build() {
        if (built) return; built = true;
        var tabs = $('.main-tabs'); if (!tabs) return;

        current = document.createElement('div'); current.id = 'tlc-current';
        btn = document.createElement('button'); btn.id = 'tlc-nav-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Menú');
        btn.innerHTML = '<i></i>';
        var lbl = document.createElement('div'); lbl.className = 'lbl';
        current.appendChild(btn); current.appendChild(lbl);
        tabs.parentNode.insertBefore(current, tabs);

        veil = document.createElement('div'); veil.id = 'tlc-drawer-veil';
        drawer = document.createElement('nav'); drawer.id = 'tlc-drawer'; drawer.setAttribute('aria-label', 'Menú principal');
        document.body.appendChild(veil); document.body.appendChild(drawer);

        btn.onclick = open; veil.onclick = close;
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
        // Cuando cambia la pestaña activa, actualizamos la barra "estas en"
        var mo = new MutationObserver(function () { refreshLabel(); });
        mo.observe(tabs, { attributes: true, subtree: true, attributeFilter: ['class', 'data-cm-locked'] });
        $$('.cmmenu-panel').forEach(function (p) { mo.observe(p, { attributes: true, subtree: true, attributeFilter: ['class'] }); });
        refreshLabel();
    }

    function refreshLabel() {
        if (!current) return;
        var act = $('.main-tab.active:not(.cmmenu-btn)');
        var lbl = current.querySelector('.lbl');
        var sub = $('.vista-modulo.active .sub-tab.active');
        lbl.innerHTML = (act ? txt(act) : 'HUB TopLiderCoach') + (sub ? '<small>' + txt(sub) + '</small>' : '');
    }

    function item(tab) {
        var b = document.createElement('button'); b.type = 'button';
        b.className = 'it' + (tab.classList.contains('active') ? ' on' : '') + (locked(tab) ? ' locked' : '');
        b.textContent = txt(tab);
        b.onclick = function () { if (locked(tab)) return; tab.click(); close(); setTimeout(refreshLabel, 50); };
        return b;
    }

    function render() {
        drawer.innerHTML = '';
        var hd = document.createElement('div'); hd.className = 'hd';
        hd.innerHTML = '<b>HUB TopLiderCoach</b><button type="button" aria-label="Cerrar">×</button>';
        hd.querySelector('button').onclick = close; drawer.appendChild(hd);

        // Pestañas principales (las que no son grupos de despachos)
        $$('.main-tabs > .main-tab:not(.cmmenu-btn)').forEach(function (t) { if (t.offsetParent !== null || t.style.display !== 'none') drawer.appendChild(item(t)); });

        // Grupos de despachos (Club Campo / Club Oficina) que cm-menu haya construido
        $$('.main-tabs .cmmenu-btn').forEach(function (g) {
            var id = g.id.replace('cmmenu-btn-', '');
            var panel = $('#cmmenu-panel-' + id) || (g.nextElementSibling && g.nextElementSibling.classList.contains('cmmenu-panel') ? g.nextElementSibling : null);
            var tabs = panel ? $$('.main-tab', panel) : [];
            if (!tabs.length) return;
            var h = document.createElement('div'); h.className = 'grp'; h.textContent = txt(g).replace(/[▾▼]/g, '').trim();
            drawer.appendChild(h);
            tabs.forEach(function (t) { drawer.appendChild(item(t)); });
        });
    }

    function open() { render(); document.body.classList.add('tlc-drawer-open'); }
    function close() { document.body.classList.remove('tlc-drawer-open'); }

    function init() {
        if (!MQ.matches) return;
        // Esperar a que el HUB este dentro (app visible) y cm-menu haya construido los grupos
        var t0 = Date.now();
        (function loop() {
            var app = $('#app-container');
            if (app && app.offsetParent !== null && $('.main-tabs')) { build(); return; }
            if (Date.now() - t0 < 20000) setTimeout(loop, 250);
        })();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    MQ.addEventListener ? MQ.addEventListener('change', function (e) { if (e.matches) init(); else close(); }) : MQ.addListener(function (e) { if (e.matches) init(); else close(); });
})();
