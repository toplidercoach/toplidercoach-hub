// ============================================================
// SESION-REVALIDAR.JS — Vuelve a preguntar a WordPress si la cuenta sigue activa
// Problema que resuelve: quien inicia sesión y no la cierra nunca vuelve a pasar por /auth,
// así que una prueba de 7 días caducada (o una suscripción vencida) seguía entrando al HUB.
// Al abrir el HUB con sesión guardada, y cada 6 horas, llama a /toplider/v1/prueba-estado
// (plugin TopLider Prueba Entrenador 1.0.8). Si WordPress dice que ya no está activa, cierra
// la sesión con un aviso. Si no hay respuesta (sin red, plugin antiguo), no hace nada.
// Solo afecta a cuentas de WordPress (entrenadores); el Modo Club no pasa por aquí.
// ============================================================
(function () {
    'use strict';
    var CADA = 6 * 60 * 60 * 1000, ALTA = 'https://toplidercoach.com/registrarse/';
    function salir(msg) {
        try { localStorage.removeItem('hub_user'); localStorage.removeItem('hub_token'); localStorage.removeItem('hub_supabase_jwt'); } catch (e) {}
        var ov = document.createElement('div');
        ov.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(2,6,23,.96);display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,sans-serif';
        ov.innerHTML = '<div style="max-width:460px;background:#0f172a;border:1px solid #334155;border-radius:16px;padding:28px;text-align:center;color:#e2e8f0"><div style="font-size:40px">⏳</div><h2 style="margin:10px 0 8px;color:#fff;font-size:20px">' + (msg || 'Tu sesión ya no está activa') + '</h2><p style="color:#94a3b8;font-size:14px;line-height:1.5;margin:0 0 18px">Tus datos siguen guardados: en cuanto te suscribas vuelves a entrar con el mismo usuario y lo tienes todo igual.</p><a href="' + ALTA + '" style="display:inline-block;padding:12px 22px;background:#f59e0b;color:#1a1200;font-weight:800;border-radius:10px;text-decoration:none;font-size:15px">Suscribirme ahora</a><div style="margin-top:12px"><a href="#" onclick="location.reload();return false" style="color:#64748b;font-size:12px">Volver a la pantalla de entrada</a></div></div>';
        document.body.appendChild(ov);
    }
    async function comprobar() {
        try {
            if (window.cmAuthSource === 'supabase' || localStorage.getItem('cm_auth') === 'supabase') return;
            var u = JSON.parse(localStorage.getItem('hub_user') || 'null'), t = localStorage.getItem('hub_token');
            if (!u || !u.id || !t || typeof API_BASE === 'undefined') return;
            var r = await fetch(API_BASE + '/prueba-estado?user=' + encodeURIComponent(u.id) + '&token=' + encodeURIComponent(t), { cache: 'no-store' });
            if (!r.ok) return;
            var d = await r.json();
            if (!d || !d.success || !d.verificado) return;   // token de otro dispositivo o plugin antiguo: no decidimos
            if (d.activo === false) { salir(d.message && /prueba/i.test(d.message) ? 'Tu prueba gratuita de 7 días ha terminado' : 'Tu suscripción ya no está activa'); return; }
            // Refrescar la fecha de fin de la prueba que usa la barra de "te quedan X días"
            if (d.prueba && d.prueba.hasta) {
                var tenia = !!(u.prueba && u.prueba.hasta);
                u.prueba = d.prueba; localStorage.setItem('hub_user', JSON.stringify(u));
                try { if (typeof usuario !== 'undefined' && usuario && usuario.id === u.id) usuario.prueba = d.prueba; } catch (e) {}
                // La sesión guardada no sabía que era una prueba: recargar una vez para que salga la barra de días
                if (!tenia && !sessionStorage.getItem('tlc_rev_reload')) { sessionStorage.setItem('tlc_rev_reload', '1'); location.reload(); }
            } else if (u.prueba) { delete u.prueba; localStorage.setItem('hub_user', JSON.stringify(u)); try { if (typeof usuario !== 'undefined' && usuario) delete usuario.prueba; } catch (e) {} }
        } catch (e) { /* sin red: no hacemos nada */ }
    }
    function arrancar() { setTimeout(comprobar, 1500); setInterval(comprobar, CADA); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
