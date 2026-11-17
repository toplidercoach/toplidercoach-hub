/* ============================================================
   sesiones-vista.js
   "Mis Sesiones Guardadas": alternar entre tarjetas y lista.
   No toca planificador.js: solo anade el conmutador a la cabecera
   y una clase (sv-lista) al contenedor de las sesiones.
   La preferencia se recuerda en este navegador.
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
        var cabecera = document.querySelector('#planificador-mis-sesiones .section-header');
        if (!cabecera || cabecera.querySelector('.sv-conmutador')) return;

        var estilo = document.createElement('style');
        estilo.id = 'sv-estilos';
        estilo.textContent = CSS;
        document.head.appendChild(estilo);

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
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
    else montar();
})();
