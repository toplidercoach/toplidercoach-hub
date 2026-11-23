/* ============================================================
   partidos-vista.js
   Gestion de Competicion > Partidos: alternar entre tarjetas y lista.
   No toca matchstats.js: anade el conmutador a la cabecera y una
   clase (pv-lista) al contenedor de los partidos.
   La preferencia se recuerda en este navegador.
   Ademas sustituye los emojis de cada partido por iconos de linea
   (botones, jornada/estadio y escudo que falta), en las dos vistas.
   ============================================================ */
(function () {
    'use strict';
    var CLAVE = 'tlc_partidos_vista';
    var ID_LISTA = 'lista-partidos';

    var CSS = ''
        + '.pv-derecha{display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
        + '.pv-conmutador{display:inline-flex;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff}'
        + '.pv-conmutador button{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#64748b;font:inherit;font-size:13px;font-weight:600;padding:8px 12px;cursor:pointer}'
        + '.pv-conmutador button + button{border-left:1px solid #e5e7eb}'
        + '.pv-conmutador button:hover{background:#f1f5f9;color:#1e293b}'
        + '.pv-conmutador button.activo{background:#1e293b;color:#fff}'
        + '.pv-conmutador svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
        /* ----- iconos sobrios en lugar de emojis (las dos vistas) ----- */
        + '#lista-partidos .mc-btn.pv-ico{background:#fff;border:1px solid #e2e8f0;color:#475569}'
        + '#lista-partidos .mc-btn.pv-ico:hover{background:#f1f5f9;border-color:#cbd5e1;color:#0f172a;transform:none;opacity:1}'
        + '#lista-partidos .mc-btn.pv-ico.pv-borrar:hover{background:#fef2f2;border-color:#fecaca;color:#dc2626}'
        + '#lista-partidos .mc-btn.pv-ico svg{width:15px;height:15px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}'
        + '#lista-partidos .mc-content{min-width:0}'
        + '#lista-partidos .mc-btn.pv-ico{min-width:0}'
        + '#lista-partidos .mc-btn .pv-txt{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
        + '#lista-partidos .mc-escudo-placeholder.pv-sin-escudo{color:#cbd5e1}'
        + '#lista-partidos .mc-escudo-placeholder.pv-sin-escudo svg{width:34px;height:34px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linejoin:round}'
        /* ----- modo lista ----- */
        + '#lista-partidos.pv-lista{display:flex;flex-direction:column;gap:8px}'
        + '.pv-lista .mc-card{border-radius:10px;box-shadow:none}'
        + '.pv-lista .mc-card:hover{transform:none;box-shadow:0 2px 10px rgba(0,0,0,.08)}'
        + '.pv-lista .mc-content{flex-direction:row;align-items:center;gap:14px;padding:8px 14px;min-width:0}'
        + '.pv-lista .mc-header{display:contents}'
        + '.pv-lista .mc-date-info{order:1;flex:0 0 150px;flex-wrap:wrap;gap:2px 8px}'
        + '.pv-lista .mc-date{white-space:nowrap}'
        + '.pv-lista .mc-matchup{order:2;flex:1 1 300px;min-width:0;padding:0;gap:10px}'
        + '.pv-lista .mc-team{flex-direction:row;gap:8px;align-items:center}'
        + '.pv-lista .mc-matchup .mc-team:first-child{flex-direction:row-reverse}'
        + '.pv-lista .mc-team-name{font-size:13px;min-width:0}'
        + '.pv-lista .mc-team-side{display:none}'
        + '.pv-lista .mc-escudo{width:26px;height:26px;flex:none}'
        + '.pv-lista .mc-escudo-placeholder{width:26px;height:26px;flex:none;font-size:18px}'
        + '.pv-lista .mc-escudo-placeholder.pv-sin-escudo svg{width:22px;height:22px}'
        + '.pv-lista .mc-score{flex:0 0 74px;justify-content:center;padding:0}'
        + '.pv-lista .mc-score-num{font-size:19px;min-width:18px}'
        + '.pv-lista .mc-score-sep{font-size:15px}'
        + '.pv-lista .mc-score-pending{padding:4px 0;border-radius:8px}'
        + '.pv-lista .mc-score-time{font-size:13px}'
        + '.pv-lista .mc-badges{order:3;flex:0 0 250px;flex-wrap:nowrap;min-width:0;justify-content:flex-start}'
        + '.pv-lista .mc-comp-badge{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
        + '.pv-lista .mc-result-badge{flex:none;white-space:nowrap}'
        + '.pv-lista .mc-meta{order:4;flex:0 0 88px;gap:2px 10px}'
        + '.pv-lista .mc-meta-item{white-space:nowrap}'
        + '.pv-lista .mc-content:not(:has(.mc-meta)) .mc-badges{margin-right:102px}'
        + '.pv-lista .mc-actions{order:5;flex:0 0 auto;gap:5px;padding:0;border:0}'
        + '.pv-lista .mc-btn{flex:none;width:32px;height:32px;padding:0;max-width:none}'
        + '.pv-lista .mc-btn .pv-txt{display:none}'
        + '@media (max-width:1250px){'
        +   '.pv-lista .mc-content{flex-wrap:wrap;gap:8px 14px}'
        +   '.pv-lista .mc-date-info{flex:0 0 auto}'
        +   '.pv-lista .mc-matchup{order:3;flex:1 1 100%}'
        +   '.pv-lista .mc-badges{order:2;flex:1 1 200px;justify-content:flex-end;margin-right:0 !important}'
        +   '.pv-lista .mc-meta{order:4;flex:1 1 auto}'
        +   '.pv-lista .mc-actions{order:5;margin-left:auto}'
        + '}'
        + '@media (max-width:768px){'
        +   '.pv-conmutador button span{display:none}'
        + '}';

    var ICONO_TARJETAS = '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
    var ICONO_LISTA = '<svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
    var ESCUDO = '<svg viewBox="0 0 24 24"><path d="M12 3l7.5 2.5v6c0 4.6-3.1 7.9-7.5 9.5-4.4-1.6-7.5-4.9-7.5-9.5v-6z"/></svg>';

    // Iconos de los botones de cada partido, segun la funcion que llaman: [funcion, clase extra, nombre, svg]
    var ICONOS = [
        ['verPartido', '', 'Ver', '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg>'],
        ['editarPartido', '', 'Editar', '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>'],
        ['abrirModalAsistenciaSesion', '', 'Wellness', '<svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/></svg>'],
        ['abrirModalResultado', '', 'Stats', '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>'],
        ['eliminarPartido', 'pv-borrar', 'Eliminar', '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/><path d="M10 11v5M14 11v5"/></svg>']
    ];
    var SOLO_TEXTO = /^[^\p{L}\p{N}]+/u;   // emojis y espacios al principio de un texto

    function pulir() {
        var lista = document.getElementById(ID_LISTA);
        if (!lista) return;
        var botones = lista.querySelectorAll('.mc-btn:not(.pv-ico)');
        for (var i = 0; i < botones.length; i++) {
            var accion = botones[i].getAttribute('onclick') || '';
            for (var j = 0; j < ICONOS.length; j++) {
                if (accion.indexOf(ICONOS[j][0] + '(') !== 0) continue;
                var texto = botones[i].textContent.replace(SOLO_TEXTO, '').trim();
                botones[i].innerHTML = ICONOS[j][3] + (texto ? '<span class="pv-txt"></span>' : '');
                if (texto) botones[i].lastChild.textContent = texto;
                botones[i].classList.add('pv-ico');
                if (ICONOS[j][1]) botones[i].classList.add(ICONOS[j][1]);
                botones[i].setAttribute('title', ICONOS[j][2]);
                botones[i].setAttribute('aria-label', ICONOS[j][2]);
                break;
            }
        }
        // Jornada y estadio: fuera el emoji, queda el texto
        var metas = lista.querySelectorAll('.mc-meta-item');
        for (var k = 0; k < metas.length; k++) {
            var n = metas[k].firstChild;
            if (n && n.nodeType === 3) { var t = n.nodeValue.replace(SOLO_TEXTO, ''); if (t !== n.nodeValue) n.nodeValue = t; }
        }
        // Equipo sin escudo: un escudo en gris en vez del emoji
        var huecos = lista.querySelectorAll('.mc-escudo-placeholder:not(.pv-sin-escudo)');
        for (var m = 0; m < huecos.length; m++) {
            huecos[m].innerHTML = ESCUDO;
            huecos[m].classList.add('pv-sin-escudo');
        }
    }

    function leer() {
        try { return localStorage.getItem(CLAVE) === 'lista' ? 'lista' : 'tarjetas'; } catch (e) { return 'tarjetas'; }
    }
    function guardar(v) {
        try { localStorage.setItem(CLAVE, v); } catch (e) { /* sin almacenamiento: no se recuerda */ }
    }

    function aplicar(vista) {
        var lista = document.getElementById(ID_LISTA);
        if (lista) lista.classList.toggle('pv-lista', vista === 'lista');
        var botones = document.querySelectorAll('.pv-conmutador button');
        for (var i = 0; i < botones.length; i++) {
            var activo = botones[i].getAttribute('data-vista') === vista;
            botones[i].classList.toggle('activo', activo);
            botones[i].setAttribute('aria-pressed', activo ? 'true' : 'false');
        }
    }

    function montar() {
        var cabecera = document.querySelector('#matchstats-partidos .section-header');
        if (!cabecera || cabecera.querySelector('.pv-conmutador')) return;

        if (!document.getElementById('pv-estilos')) {
            var estilo = document.createElement('style');
            estilo.id = 'pv-estilos';
            estilo.textContent = CSS;
            document.head.appendChild(estilo);
        }

        var derecha = document.createElement('div');
        derecha.className = 'pv-derecha';
        var conmutador = document.createElement('div');
        conmutador.className = 'pv-conmutador';
        conmutador.setAttribute('role', 'group');
        conmutador.setAttribute('aria-label', 'Vista de los partidos');
        conmutador.innerHTML =
            '<button type="button" data-vista="tarjetas" title="Ver en tarjetas">' + ICONO_TARJETAS + '<span>Tarjetas</span></button>' +
            '<button type="button" data-vista="lista" title="Ver en lista">' + ICONO_LISTA + '<span>Lista</span></button>';
        derecha.appendChild(conmutador);

        // El boton "+ Nuevo Partido" que ya existe pasa a la derecha, junto al conmutador
        var nuevo = cabecera.querySelector('button');
        if (nuevo) derecha.appendChild(nuevo);
        cabecera.appendChild(derecha);

        conmutador.addEventListener('click', function (e) {
            var b = e.target.closest ? e.target.closest('button[data-vista]') : null;
            if (!b) return;
            var v = b.getAttribute('data-vista');
            guardar(v);
            aplicar(v);
        });

        aplicar(leer());

        // Cada vez que matchstats.js vuelve a pintar los partidos, se repasan los iconos
        var lista = document.getElementById(ID_LISTA);
        if (lista && window.MutationObserver) {
            new MutationObserver(pulir).observe(lista, { childList: true });
        }
        pulir();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
    else montar();
})();
