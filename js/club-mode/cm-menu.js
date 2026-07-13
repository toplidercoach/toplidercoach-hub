// ============================================================
// CM-MENU.JS · Menu desplegable de Club Mode (v2)
// Agrupa las pestanas de los despachos/modulos del club en dos
// desplegables: "Club Campo" y "Club Oficina".
// v2: los paneles cuelgan del body con posicion fija para no
// quedar recortados por el scroll de la barra de pestanas.
// ============================================================
(function() {
    var CMMENU_GRUPOS = {
        // Campo
        medico: 'campo',
        fisio: 'campo',
        prepfisica: 'campo',
        utillero: 'campo',
        scouting: 'campo',
        analista: 'campo',
        // Oficina
        pagos: 'oficina',
        familias: 'oficina',
        economico: 'oficina',
        misgastos: 'oficina',
        rfef: 'oficina',
        cumplimiento_rfef: 'oficina',
        patrocinadores: 'oficina',
        dd: 'oficina',
        dirdeportiva: 'oficina',
        dir_deportiva: 'oficina'
    };
    var CMMENU_LABELS = {
        campo: { icon: '&#127967;', text: 'Club Campo' },
        oficina: { icon: '&#127970;', text: 'Club Oficina' }
    };
    var construido = false;
    var drops = {}; // grupo -> { btn, panel }

    function inyectarEstilos() {
        if (document.getElementById('cmmenu-styles')) return;
        var st = document.createElement('style');
        st.id = 'cmmenu-styles';
        st.textContent =
            '.cmmenu-panel{display:none;position:fixed;min-width:230px;background:#1e293b;border:1px solid #334155;border-radius:0 0 10px 10px;box-shadow:0 10px 25px rgba(0,0,0,.45);z-index:9500;padding:6px;flex-direction:column}' +
            '.cmmenu-panel.open{display:flex}' +
            '.cmmenu-panel .main-tab{display:flex!important;width:100%;justify-content:flex-start;text-align:left;border-radius:6px;margin:1px 0;box-sizing:border-box}' +
            '.cmmenu-caret{font-size:9px;margin-left:5px;opacity:.7}' +
            '.cmmenu-btn.cmmenu-activo{color:#f97316}' +
            '@media(max-width:768px){.cmmenu-panel{min-width:200px}}';
        document.head.appendChild(st);
    }

    function moduloDeTab(tab) {
        var oc = tab.getAttribute('onclick') || '';
        var m = oc.match(/cambiarModulo\('(\w+)'/);
        return m ? m[1] : null;
    }

    function tabsAgrupables() {
        var res = { campo: [], oficina: [] };
        document.querySelectorAll('.main-tabs > .main-tab').forEach(function(tab) {
            var mod = moduloDeTab(tab);
            if (!mod || !CMMENU_GRUPOS[mod]) return;
            if (tab.style.display === 'none') return; // respeta permisos ya aplicados
            res[CMMENU_GRUPOS[mod]].push(tab);
        });
        return res;
    }

    function posicionarPanel(grupo) {
        var d = drops[grupo];
        if (!d) return;
        var r = d.btn.getBoundingClientRect();
        d.panel.style.top = r.bottom + 'px';
        var left = r.left;
        var ancho = Math.max(230, d.panel.offsetWidth || 230);
        if (left + ancho > window.innerWidth - 8) left = window.innerWidth - ancho - 8;
        d.panel.style.left = Math.max(8, left) + 'px';
    }

    function cerrarTodos() {
        Object.keys(drops).forEach(function(g) { drops[g].panel.classList.remove('open'); });
    }

    function crearDrop(grupo, mainTabs) {
        var btn = document.createElement('button');
        btn.className = 'main-tab cmmenu-btn';
        btn.type = 'button';
        btn.id = 'cmmenu-btn-' + grupo;
        btn.innerHTML = '<span class="tab-icon">' + CMMENU_LABELS[grupo].icon + '</span><span>' + CMMENU_LABELS[grupo].text + '</span><span class="cmmenu-caret">&#9660;</span>';
        var panel = document.createElement('div');
        panel.className = 'cmmenu-panel';
        panel.id = 'cmmenu-panel-' + grupo;
        panel.addEventListener('click', function(e) { e.stopPropagation(); });
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var estaba = panel.classList.contains('open');
            cerrarTodos();
            if (!estaba) {
                panel.classList.add('open');
                posicionarPanel(grupo);
            }
        });
        mainTabs.appendChild(btn);
        document.body.appendChild(panel);
        drops[grupo] = { btn: btn, panel: panel };
        return drops[grupo];
    }

    function refrescarActivos() {
        Object.keys(drops).forEach(function(g) {
            var hayActivo = !!drops[g].panel.querySelector('.main-tab.active');
            drops[g].btn.classList.toggle('cmmenu-activo', hayActivo);
        });
    }

    function pasada() {
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;
        var grupos = tabsAgrupables();
        var total = grupos.campo.length + grupos.oficina.length;

        // Regla de los pocos modulos: sin desplegables si ve menos de 3
        if (!construido && total < 3) return;

        if (!construido) {
            inyectarEstilos();
            document.addEventListener('click', cerrarTodos);
            window.addEventListener('resize', cerrarTodos);
            window.addEventListener('scroll', cerrarTodos, true);
            construido = true;
        }

        ['campo', 'oficina'].forEach(function(g) {
            if (!grupos[g].length) return;
            if (!drops[g]) crearDrop(g, mainTabs);
            grupos[g].forEach(function(tab) {
                tab.addEventListener('click', function() {
                    cerrarTodos();
                    setTimeout(refrescarActivos, 100);
                });
                drops[g].panel.appendChild(tab);
            });
        });
        refrescarActivos();
    }

    var n = 0;
    var iv = setInterval(function() {
        n++;
        if (n > 40) { clearInterval(iv); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        pasada();
    }, 500);

    setInterval(function() {
        if (construido) refrescarActivos();
    }, 1500);

    console.log('[Club Menu] cm-menu.js v2 cargado');
})();
