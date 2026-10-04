// ============================================================
// CLUB MODE - PRUEBA GRATUITA (cm-prueba.js)
// Si el club esta en prueba gratuita (clubs.license_plan = 'trial'), muestra arriba
// un cartel con los dias que quedan y, al administrador, el boton de contratar.
// El pago lleva la referencia del club, para que se reactive ESTE club con sus datos.
// Para cualquier otro club este archivo no hace nada.
// ============================================================
(function () {
    'use strict';
    var PAGO = 'https://buy.stripe.com/3cIaEYaZW10S78KfUzcAo0C';
    var t0 = Date.now();

    function enlacePago(club) {
        var email = '';
        try { email = (typeof usuario !== 'undefined' && usuario && usuario.email) || ''; } catch (e) {}
        return PAGO + '?prefilled_promo_code=PRIORITARIO&client_reference_id=' + encodeURIComponent(club.id)
            + (email ? '&prefilled_email=' + encodeURIComponent(email) : '');
    }

    function pintar(club) {
        if (document.getElementById('cm-prueba-bar')) return;
        var app = document.getElementById('app-container'); if (!app) return;
        var fin = new Date(club.license_valid_until);
        var dias = Math.ceil((fin.getTime() - Date.now()) / 86400000);
        var fecha = fin.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        var texto = dias <= 1 ? 'Hoy es el último día de tu prueba gratuita' : 'Te quedan ' + dias + ' días de prueba gratuita';
        var esAdmin = !!(window.cmState && cmState.esAdmin);

        var st = document.createElement('style');
        st.textContent = '#cm-prueba-bar{position:sticky;top:0;z-index:940;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 16px;'
            + 'background:#78350f;color:#fff;font:500 14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif}'
            + '#cm-prueba-bar.urgente{background:#7f1d1d}'
            + '#cm-prueba-bar b{font-weight:700}'
            + '#cm-prueba-bar .sp{flex:1;min-width:8px}'
            + '#cm-prueba-bar .nota{opacity:.85;font-size:13px}'
            + '#cm-prueba-bar a{flex-shrink:0;font-weight:700;text-decoration:none;color:#1a1200;background:#f59e0b;border-radius:999px;padding:6px 16px}'
            + '#cm-prueba-bar a:hover{background:#fbbf24}'
            + '@media (max-width:640px){#cm-prueba-bar{font-size:13px;padding:8px 12px;gap:8px}#cm-prueba-bar .sp{display:none}#cm-prueba-bar .nota{flex-basis:100%;order:3}}';
        document.head.appendChild(st);

        var b = document.createElement('div');
        b.id = 'cm-prueba-bar';
        if (dias <= 2) b.className = 'urgente';
        var t = document.createElement('span'); t.innerHTML = '<b></b>'; t.firstChild.textContent = texto;
        var n = document.createElement('span'); n.className = 'nota'; n.textContent = 'Acceso completo hasta el ' + fecha + '. Lo que cargues se conserva si contratas.';
        var sp = document.createElement('span'); sp.className = 'sp';
        b.appendChild(t); b.appendChild(n); b.appendChild(sp);
        if (esAdmin) {
            var a = document.createElement('a'); a.href = enlacePago(club); a.textContent = 'Contratar';
            b.appendChild(a);
        } else {
            var m = document.createElement('span'); m.className = 'nota'; m.textContent = 'Para contratar, habla con el administrador de tu club.';
            b.appendChild(m);
        }
        app.insertBefore(b, app.firstChild);
    }

    (function esperar() {
        var club = window.__cm_club;
        var listo = club && window.cmState && cmState.activo;
        if (listo) {
            if (club.license_plan === 'trial' && club.license_valid_until) pintar(club);
            return;
        }
        if (Date.now() - t0 < 120000) setTimeout(esperar, 400);
    })();
})();
