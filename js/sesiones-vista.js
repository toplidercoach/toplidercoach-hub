/* ============================================================
   sesiones-vista.js
   "Mis Sesiones Guardadas": alternar entre tarjetas y lista.
   No toca planificador.js: solo anade el conmutador a la cabecera
   y una clase (sv-lista) al contenedor de las sesiones.
   La preferencia se recuerda en este navegador.
   Ademas sustituye los emojis de cada sesion por iconos de linea
   (botones de accion, ejercicios/jugadores, hora y porteros),
   en las dos vistas, y los de los botones rapidos de la cabecera
   de "Crear Nueva Sesion".
   ============================================================ */
(function () {
    'use strict';
    var CLAVE = 'tlc_sesiones_vista';

    var CSS = ''
        + '.sv-derecha{display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
        + '.sv-conmutador{display:inline-flex;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff}'
        + '.sv-conmutador button{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#64748b;font:inherit;font-size:13px;font-weight:600;padding:8px 12px;cursor:pointer}'
        + '.sv-conmutador button + button{border-left:1px solid #e5e7eb}'
        + '.sv-conmutador button:hover{background:#f1f5f9;color:#1e293b}'
        + '.sv-conmutador button.activo{background:#1e293b;color:#fff}'
        + '.sv-conmutador svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'
        /* ----- iconos sobrios en lugar de emojis (las dos vistas) ----- */
        + '#lista-mis-sesiones .sc-btn.sv-ico{background:#fff !important;border:1px solid #e2e8f0;color:#475569}'
        + '#lista-mis-sesiones .sc-btn.sv-ico:hover{background:#f1f5f9 !important;border-color:#cbd5e1;color:#0f172a;transform:none}'
        + '#lista-mis-sesiones .sc-btn.sv-ico.sv-borrar:hover{background:#fef2f2 !important;border-color:#fecaca;color:#dc2626}'
        + '#lista-mis-sesiones .sc-btn.sv-ico svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}'
        + '#lista-mis-sesiones .sc-stat + .sc-stat{padding-left:12px;border-left:1px solid #e2e8f0}'
        + '#lista-mis-sesiones .sc-stat{white-space:nowrap}'
        + '#lista-mis-sesiones:not(.sv-lista) .sc-footer{flex-wrap:wrap;gap:8px 12px}'
        + '#lista-mis-sesiones:not(.sv-lista) .sc-actions{margin-left:auto}'
        /* ----- botones rapidos de "Crear Nueva Sesion" ----- */
        + 'button.sv-rapida{display:inline-flex;align-items:center;justify-content:center;background:#fff !important;border:1px solid #e2e8f0 !important;color:#475569;transition:background .15s,border-color .15s,color .15s}'
        + 'button.sv-rapida:hover{background:#f1f5f9 !important;border-color:#cbd5e1 !important;color:#0f172a}'
        + 'button.sv-rapida svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}'
        /* ----- modo lista ----- */
        + '#lista-mis-sesiones.sv-lista{display:flex;flex-direction:column;gap:8px}'
        + '.sv-lista .sc-card{border-radius:10px;box-shadow:none}'
        + '.sv-lista .sc-card:hover{transform:none;box-shadow:0 2px 10px rgba(0,0,0,.08)}'
        + '.sv-lista .sc-date-strip{width:178px;min-width:178px;flex-direction:row;justify-content:flex-start;padding:8px 12px;gap:6px;background:#1e293b}'
        + '.sv-lista .sc-date-day{font-size:10px;letter-spacing:1px}'
        + '.sv-lista .sc-date-num{font-size:17px}'
        + '.sv-lista .sc-date-month{font-size:10px;white-space:nowrap}'
        + '.sv-lista .sc-date-time{margin:0 0 0 auto;font-size:10px;padding:2px 6px;white-space:nowrap}'
        + '.sv-lista .sc-body{flex-direction:row;align-items:center;gap:14px;padding:8px 12px}'
        + '.sv-lista .sc-top-row{flex:1 1 160px;min-width:0;align-items:center}'
        + '.sv-lista .sc-title{font-size:14px}'
        + '.sv-lista .sc-tags{flex:0 0 250px;flex-wrap:nowrap;overflow:hidden}'
        + '.sv-lista .sc-tag{white-space:nowrap}'
        + '.sv-lista .sc-body:not(:has(.sc-tags)) .sc-top-row{margin-right:264px}'
        + '.sv-lista .sc-objetivo,.sv-lista .sc-phases{display:none}'
        + '.sv-lista .sc-footer{flex:0 0 auto;gap:14px;padding:0;border:0;margin:0}'
        + '.sv-lista .sc-stats{flex:0 0 190px;white-space:nowrap}'
        + '.sv-lista .sc-actions{flex-wrap:nowrap;width:249px}'
        + '.sv-lista .sc-btn{width:31px;height:31px}'
        + '@media (max-width:1100px){'
        +   '.sv-lista .sc-body{flex-wrap:wrap;gap:8px 14px}'
        +   '.sv-lista .sc-top-row{flex:1 1 100%;margin-right:0 !important}'
        +   '.sv-lista .sc-tags{flex:0 1 auto;flex-wrap:wrap}'
        +   '.sv-lista .sc-footer{flex:1 1 auto;justify-content:space-between;flex-wrap:wrap;gap:8px 14px}'
        +   '.sv-lista .sc-stats{flex:0 1 auto}'
        +   '.sv-lista .sc-actions{width:auto;flex-wrap:wrap}'
        + '}'
        + '@media (max-width:768px){'
        +   '.sv-lista .sc-date-strip{width:100%;min-width:0}'
        +   '.sv-conmutador button span{display:none}'
        + '}';

    var ICONO_TARJETAS = '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
    var ICONO_LISTA = '<svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';

    // Iconos de los botones de cada sesion, segun la funcion que llaman
    var ICONOS = [
        ['abrirModoVestuario', '', '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/></svg>'],
        ['abrirMontajesSesion', '', '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M12 5v14"/><circle cx="12" cy="12" r="2.5"/><path d="M3 9.5h2.5v5H3M21 9.5h-2.5v5H21"/></svg>'],
        ['cargarSesionEnEditor', '', '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>'],
        ['abrirModalAsistenciaSesion', '', '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20v-1a6.5 6.5 0 0 1 11.5-4"/><path d="M15.5 17.5l2.2 2.2 4-4.2"/></svg>'],
        ['abrirModalPDFSesion', '', '<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v6M9.5 14.5L12 17l2.5-2.5"/></svg>'],
        ['exportarSesionPDF', '', '<svg viewBox="0 0 24 24"><path d="M3 19V6h18v13"/><path d="M3 10.5h18M3 15h18M9 6v13M15 6v13"/></svg>'],
        ['eliminarSesion', 'sv-borrar', '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 12.5h9l1-12.5"/><path d="M10 11v5M14 11v5"/></svg>']
    ];
    var SOLO_TEXTO = /^[^\p{L}\p{N}]+/u;   // emojis y espacios al principio de un texto

    function limpiarTexto(el) {
        var n = el.firstChild;
        if (n && n.nodeType === 3) { var t = n.nodeValue.replace(SOLO_TEXTO, ''); if (t !== n.nodeValue) n.nodeValue = t; }
    }

    function pulir() {
        var lista = document.getElementById('lista-mis-sesiones');
        if (!lista) return;
        var botones = lista.querySelectorAll('.sc-btn:not(.sv-ico)');
        for (var i = 0; i < botones.length; i++) {
            var accion = botones[i].getAttribute('onclick') || '';
            for (var j = 0; j < ICONOS.length; j++) {
                if (accion.indexOf(ICONOS[j][0] + '(') === 0) {
                    botones[i].innerHTML = ICONOS[j][2];
                    botones[i].classList.add('sv-ico');
                    if (ICONOS[j][1]) botones[i].classList.add(ICONOS[j][1]);
                    botones[i].setAttribute('aria-label', botones[i].getAttribute('title') || '');
                    break;
                }
            }
        }
        var textos = lista.querySelectorAll('.sc-stat, .sc-date-time, .sc-phase-name');
        for (var k = 0; k < textos.length; k++) limpiarTexto(textos[k]);
    }

    // Botones rapidos de la cabecera de "Crear Nueva Sesion" (estan fijos en index.html)
    var RAPIDAS = { vestuario: 'abrirModoVestuario', asistencia: 'abrirModalAsistenciaSesion', pdf: 'abrirModalPDFSesion', porteros: 'exportarSesionPDF' };
    function iconoDe(funcion) {
        for (var j = 0; j < ICONOS.length; j++) if (ICONOS[j][0] === funcion) return ICONOS[j][2];
        return '';
    }
    function pulirRapidas() {
        var botones = document.querySelectorAll('button[onclick^="accionRapidaSesion("]:not(.sv-rapida)');
        for (var i = 0; i < botones.length; i++) {
            var m = /accionRapidaSesion\('([a-z]+)'\)/.exec(botones[i].getAttribute('onclick') || '');
            var svg = m && RAPIDAS[m[1]] ? iconoDe(RAPIDAS[m[1]]) : '';
            if (!svg) continue;
            botones[i].innerHTML = svg;
            botones[i].classList.add('sv-rapida');
            botones[i].setAttribute('aria-label', botones[i].getAttribute('title') || '');
        }
    }

    function leer() {
        try { return localStorage.getItem(CLAVE) === 'lista' ? 'lista' : 'tarjetas'; } catch (e) { return 'tarjetas'; }
    }
    function guardar(v) {
        try { localStorage.setItem(CLAVE, v); } catch (e) { /* sin almacenamiento: no se recuerda */ }
    }

    function aplicar(vista) {
        var lista = document.getElementById('lista-mis-sesiones');
        if (lista) lista.classList.toggle('sv-lista', vista === 'lista');
        var botones = document.querySelectorAll('.sv-conmutador button');
        for (var i = 0; i < botones.length; i++) {
            var activo = botones[i].getAttribute('data-vista') === vista;
            botones[i].classList.toggle('activo', activo);
            botones[i].setAttribute('aria-pressed', activo ? 'true' : 'false');
        }
    }

    function montar() {
        if (!document.getElementById('sv-estilos')) {
            var estilo = document.createElement('style');
            estilo.id = 'sv-estilos';
            estilo.textContent = CSS;
            document.head.appendChild(estilo);
        }
        pulirRapidas();

        var cabecera = document.querySelector('#planificador-mis-sesiones .section-header');
        if (!cabecera || cabecera.querySelector('.sv-conmutador')) return;

        var derecha = document.createElement('div');
        derecha.className = 'sv-derecha';
        var conmutador = document.createElement('div');
        conmutador.className = 'sv-conmutador';
        conmutador.setAttribute('role', 'group');
        conmutador.setAttribute('aria-label', 'Vista de las sesiones');
        conmutador.innerHTML =
            '<button type="button" data-vista="tarjetas" title="Ver en tarjetas">' + ICONO_TARJETAS + '<span>Tarjetas</span></button>' +
            '<button type="button" data-vista="lista" title="Ver en lista">' + ICONO_LISTA + '<span>Lista</span></button>';
        derecha.appendChild(conmutador);

        // El boton "Actualizar" que ya existe pasa a la derecha, junto al conmutador
        var actualizar = cabecera.querySelector('button');
        if (actualizar) derecha.appendChild(actualizar);
        cabecera.appendChild(derecha);

        conmutador.addEventListener('click', function (e) {
            var b = e.target.closest ? e.target.closest('button[data-vista]') : null;
            if (!b) return;
            var v = b.getAttribute('data-vista');
            guardar(v);
            aplicar(v);
        });

        aplicar(leer());

        // Cada vez que planificador.js vuelve a pintar las sesiones, se repasan los iconos
        var lista = document.getElementById('lista-mis-sesiones');
        if (lista && window.MutationObserver) {
            new MutationObserver(pulir).observe(lista, { childList: true });
        }
        pulir();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
    else montar();
})();
