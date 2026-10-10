// ============================================================
// PRUEBA GRATUITA DE ENTRENADOR (prueba-entrenador.js)
// Si WordPress indica al entrar que la cuenta esta en la prueba de 7 dias
// (usuario.prueba = { hasta: <segundos> }), muestra arriba los dias que quedan
// y el boton de suscribirse. Cuando la prueba termina, cierra el planificador
// con un aviso. Para cuentas de pago y para el Modo Club no hace nada.
// ============================================================
(function () {
    'use strict';
    var ALTA = 'https://toplidercoach.com/registrarse/';
    var t0 = Date.now();

    function fin(u) {
        var h = u && u.prueba && Number(u.prueba.hasta);
        return h && h > 0 ? h * 1000 : 0;
    }

    function salir() {
        try { localStorage.removeItem('hub_user'); localStorage.removeItem('hub_token'); localStorage.removeItem('hub_supabase_jwt'); } catch (e) {}
        location.reload();
    }

    function terminada() {
        if (document.getElementById('pe-fin')) return;
        var o = document.createElement('div'); o.id = 'pe-fin';
        o.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(10,10,15,.94);display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif';
        var c = document.createElement('div');
        c.style.cssText = 'background:#12121a;color:#f5f5f7;border:1px solid rgba(245,166,35,.55);border-radius:20px;padding:32px 28px;max-width:520px;width:100%;text-align:center';
        c.innerHTML = '<div style="font-size:26px;font-weight:800;line-height:1.15;margin-bottom:12px">Tu prueba de 7 días ha terminado</div>'
            + '<p style="margin:0 0 8px;color:rgba(255,255,255,.75);font-size:16px;line-height:1.5">No se ha perdido nada: tus sesiones, tu plantilla y tus partidos siguen guardados y te estarán esperando.</p>'
            + '<p style="margin:0 0 22px;color:rgba(255,255,255,.75);font-size:16px;line-height:1.5">Suscríbete desde 7,08 €/mes para seguir, con los +2500 ejercicios en vídeo abiertos.</p>'
            + '<a href="' + ALTA + '" style="display:block;background:#f5a623;color:#1a1200;font-weight:800;font-size:17px;text-decoration:none;border-radius:14px;padding:15px 20px;margin-bottom:12px">Suscribirme y seguir</a>'
            + '<button type="button" id="pe-fin-salir" style="background:none;border:0;color:rgba(255,255,255,.7);font:inherit;font-size:14.5px;text-decoration:underline;cursor:pointer">Ya me he suscrito: volver a entrar</button>';
        o.appendChild(c); document.body.appendChild(o);
        document.getElementById('pe-fin-salir').onclick = salir;
    }

    function cartel(hasta) {
        if (document.getElementById('pe-bar')) return;
        var app = document.getElementById('app-container'); if (!app) return;
        // Dias de calendario que faltan hasta el ultimo dia (hoy = 0)
        var h0 = new Date(hasta); h0.setHours(0, 0, 0, 0);
        var n0 = new Date(); n0.setHours(0, 0, 0, 0);
        var dias = Math.round((h0.getTime() - n0.getTime()) / 86400000);
        var fecha = new Date(hasta).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        var st = document.createElement('style');
        st.textContent = '#pe-bar{position:sticky;top:0;z-index:940;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 16px;background:#78350f;color:#fff;font:500 14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif}'
            + '#pe-bar.urgente{background:#7f1d1d}#pe-bar b{font-weight:700}#pe-bar .sp{flex:1;min-width:8px}#pe-bar .nota{opacity:.85;font-size:13px}'
            + '#pe-bar a{flex-shrink:0;font-weight:700;text-decoration:none;color:#1a1200;background:#f59e0b;border-radius:999px;padding:6px 16px}#pe-bar a:hover{background:#fbbf24}'
            + '@media (max-width:640px){#pe-bar{font-size:13px;padding:8px 12px;gap:8px}#pe-bar .sp{display:none}#pe-bar .nota{flex-basis:100%;order:3}}';
        document.head.appendChild(st);
        var b = document.createElement('div'); b.id = 'pe-bar'; if (dias <= 1) b.className = 'urgente';
        var t = document.createElement('b'); t.textContent = dias <= 0 ? 'Hoy es el último día de tu prueba gratuita' : (dias === 1 ? 'Te queda 1 día de prueba gratuita' : 'Te quedan ' + dias + ' días de prueba gratuita');
        var n = document.createElement('span'); n.className = 'nota'; n.textContent = 'Planificador completo hasta el ' + fecha + '. Lo que crees se conserva si te suscribes.';
        var sp = document.createElement('span'); sp.className = 'sp';
        var a = document.createElement('a'); a.href = ALTA; a.textContent = 'Suscribirme';
        b.appendChild(t); b.appendChild(n); b.appendChild(sp); b.appendChild(a);
        app.insertBefore(b, app.firstChild);
    }

    function revisar() {
        var u = null;
        try { u = (typeof usuario !== 'undefined') ? usuario : null; } catch (e) {}
        if (!u) return false;                                   // aun sin sesion
        if (window.cmAuthSource === 'supabase' || (window.cmState && cmState.activo)) return true; // Modo Club: no aplica
        var hasta = fin(u); if (!hasta) return true;            // cuenta de pago
        if (Date.now() >= hasta) terminada(); else cartel(hasta);
        return true;
    }

    (function esperar() {
        var app = document.getElementById('app-container');
        var visible = app && app.offsetParent !== null;
        if (visible && revisar()) {
            // Si deja el planificador abierto varios dias, se vuelve a comprobar cada 10 minutos
            setInterval(function () { try { var u = usuario; var h = fin(u); if (h && Date.now() >= h && window.cmAuthSource !== 'supabase') terminada(); } catch (e) {} }, 600000);
            return;
        }
        if (Date.now() - t0 < 600000) setTimeout(esperar, 500);
    })();
})();
