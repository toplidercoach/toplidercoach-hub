/* ============================================================
   sesion-jwt.js  —  DEBE cargarse ANTES de core.js
   Problema que resuelve: el carnet (JWT) que WordPress entrega al
   iniciar sesion caduca a las 24 horas, pero la sesion del HUB se
   queda abierta. Pasadas esas 24 h, Supabase rechaza todo con
   "JWT expired" y lo que se intenta guardar se pierde.

   Que hace:
   1) Todas las peticiones a Supabase salen siempre con el carnet
      mas reciente.
   2) Si el carnet esta caducado (o Supabase responde "JWT expired"),
      lo renueva y REPITE la peticion: lo que se estaba guardando
      se guarda.
   3) Para renovar, primero lo intenta en silencio contra WordPress
      (/toplider/v1/renovar-jwt). Si ese servicio no existe o no lo
      concede, pide la contrasena en una ventana encima del HUB,
      sin recargar la pagina y sin perder lo que hay en pantalla.

   Solo afecta a cuentas de WordPress (entrenadores). Los miembros
   de club entran con Supabase Auth, que ya se renueva solo.
   ============================================================ */
(function () {
    'use strict';
    if (window.__tlcSesionJwt) return;
    window.__tlcSesionJwt = true;

    var API = 'https://toplidercoach.com/wp-json/toplider/v1';
    var CLAVE_JWT = 'hub_supabase_jwt';
    var MARGEN = 90;                    // segundos: un carnet al que le queda menos se trata como caducado
    var AVISO_PREVIO = 45 * 60;         // segundos: renovar en silencio cuando le quede menos de esto
    var fetchOriginal = window.fetch.bind(window);

    // ---------- utilidades ----------
    function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function guardar(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }

    function carga(jwt) {
        try {
            var p = String(jwt || '').split('.');
            if (p.length !== 3) return null;
            var b = p[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b.length % 4) b += '=';
            return JSON.parse(atob(b));
        } catch (e) { return null; }
    }
    function esCarnetWP(jwt) { var c = carga(jwt); return !!(c && c.iss === 'toplider'); }
    function segundosRestantes(jwt) {
        var c = carga(jwt);
        if (!c || !c.exp) return -1;
        return c.exp - Math.floor(Date.now() / 1000);
    }
    function esSesionWP() {
        return leer('cm_auth') !== 'supabase' && esCarnetWP(leer(CLAVE_JWT));
    }
    function esSupabase(url) {
        return /^https:\/\/[a-z0-9]+\.supabase\.co\//i.test(String(url || ''));
    }
    function usuarioGuardado() {
        try { return JSON.parse(leer('hub_user') || 'null'); } catch (e) { return null; }
    }

    // ---------- guardar una sesion renovada ----------
    function aplicar(jwt, tokenWP) {
        guardar(CLAVE_JWT, jwt);
        if (tokenWP) {
            guardar('hub_token', tokenWP);
            try { token = tokenWP; } catch (e) { /* core.js aun no ha cargado */ }
        }
        // Tiempo real (chat, presencia): que use tambien el carnet nuevo
        try { if (typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.realtime && supabaseClient.realtime.setAuth) supabaseClient.realtime.setAuth(jwt); } catch (e) {}
    }

    // ---------- 1) renovacion silenciosa contra WordPress ----------
    var silenciosaDisponible = true;    // se desactiva si WordPress responde que el servicio no existe
    async function renovarEnSilencio() {
        if (!silenciosaDisponible) return false;
        var viejo = leer(CLAVE_JWT);
        if (!esCarnetWP(viejo)) return false;
        try {
            var r = await fetchOriginal(API + '/renovar-jwt', {
                method: 'POST', cache: 'no-store',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jwt: viejo })
            });
            if (r.status === 404) { silenciosaDisponible = false; return false; }
            var d = await r.json();
            if (d && d.success && esCarnetWP(d.supabase_jwt) && segundosRestantes(d.supabase_jwt) > MARGEN) {
                aplicar(d.supabase_jwt, null);
                return true;
            }
        } catch (e) { /* sin red o respuesta rara: se pasa a pedir la contrasena */ }
        return false;
    }

    // ---------- 2) ventana para volver a escribir la contrasena ----------
    function pedirContrasena() {
        return new Promise(function (resolver) {
            var u = usuarioGuardado() || {};
            var cuenta = u.email || u.username || '';
            var ov = document.createElement('div');
            ov.id = 'tlc-reauth';
            ov.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,23,.82);display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
            ov.innerHTML =
                '<form style="width:100%;max-width:420px;background:#0f172a;border:1px solid #334155;border-radius:16px;padding:26px;color:#e2e8f0;box-shadow:0 20px 60px rgba(0,0,0,.5)">' +
                '<h2 style="margin:0 0 8px;font-size:19px;color:#fff">Tu sesión ha caducado</h2>' +
                '<p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#cbd5e1">Escribe tu contraseña para seguir. <b style="color:#fff">No pierdes nada de lo que tienes en pantalla</b>: al entrar se guarda lo que estabas haciendo.</p>' +
                '<label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px">Usuario o email</label>' +
                '<input id="tlc-reauth-u" type="text" autocomplete="username" style="width:100%;box-sizing:border-box;padding:11px 12px;margin-bottom:12px;font-size:15px;background:#1e293b;border:1px solid #475569;border-radius:9px;color:#fff">' +
                '<label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px">Contraseña</label>' +
                '<input id="tlc-reauth-p" type="password" autocomplete="current-password" style="width:100%;box-sizing:border-box;padding:11px 12px;font-size:15px;background:#1e293b;border:1px solid #475569;border-radius:9px;color:#fff">' +
                '<a href="https://toplidercoach.com/wp-login.php?action=lostpassword" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;font-size:12px;color:#fbbf24;text-decoration:underline">¿No recuerdas la contraseña? Cámbiala en otra pestaña y vuelve aquí</a>' +
                '<div id="tlc-reauth-e" style="display:none;margin-top:10px;font-size:13px;color:#fca5a5"></div>' +
                '<button id="tlc-reauth-ok" type="submit" style="width:100%;margin-top:16px;padding:12px;font-size:15px;font-weight:700;background:#f59e0b;color:#0f172a;border:0;border-radius:10px;cursor:pointer">Seguir trabajando</button>' +
                '<button id="tlc-reauth-no" type="button" style="width:100%;margin-top:8px;padding:10px;font-size:13px;background:transparent;color:#94a3b8;border:0;cursor:pointer">Ahora no</button>' +
                '</form>';
            document.body.appendChild(ov);
            var iu = ov.querySelector('#tlc-reauth-u'), ip = ov.querySelector('#tlc-reauth-p');
            var err = ov.querySelector('#tlc-reauth-e'), ok = ov.querySelector('#tlc-reauth-ok');
            iu.value = cuenta;
            setTimeout(function () { (cuenta ? ip : iu).focus(); }, 30);

            function cerrar(resultado) { if (ov.parentNode) ov.parentNode.removeChild(ov); resolver(resultado); }
            function fallo(t) { err.textContent = t; err.style.display = 'block'; ok.disabled = false; ok.textContent = 'Seguir trabajando'; }

            ov.querySelector('#tlc-reauth-no').addEventListener('click', function () { cerrar(false); });
            ov.querySelector('form').addEventListener('submit', async function (ev) {
                ev.preventDefault();
                if (!iu.value.trim() || !ip.value) { fallo('Escribe tu usuario y tu contraseña.'); return; }
                ok.disabled = true; ok.textContent = 'Comprobando…'; err.style.display = 'none';
                try {
                    var r = await fetchOriginal(API + '/auth', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: iu.value.trim(), password: ip.value })
                    });
                    var d = await r.json();
                    if (!d || !d.success) { fallo((d && d.message) || 'Usuario o contraseña incorrectos.'); return; }
                    if (u.id && d.user && String(d.user.id) !== String(u.id)) { fallo('Esa cuenta no es la que tiene la sesión abierta. Entra con ' + (cuenta || 'tu cuenta') + '.'); return; }
                    if (!esCarnetWP(d.supabase_jwt)) { fallo('No se ha podido renovar la sesión. Vuelve a intentarlo.'); return; }
                    aplicar(d.supabase_jwt, d.token);
                    cerrar(true);
                } catch (e) { fallo('No hay conexión con el servidor. Comprueba tu internet y vuelve a intentarlo.'); }
            });
        });
    }

    // ---------- renovar (una sola vez aunque lo pidan muchas peticiones a la vez) ----------
    var enCurso = null;
    var rechazadoHasta = 0;             // si pulsa "Ahora no", no se le vuelve a preguntar durante 2 minutos
    // rechazado = carnet que Supabase acaba de rechazar (si lo hay): ese no vale aunque el reloj diga que si
    function renovar(conVentana, rechazado) {
        if (enCurso) return enCurso;
        enCurso = (async function () {
            var actual = leer(CLAVE_JWT);
            // Otra pestana (u otra peticion) ya lo renovo: no hay nada que hacer
            if (rechazado ? (actual !== rechazado && segundosRestantes(actual) > MARGEN) : (segundosRestantes(actual) > AVISO_PREVIO)) return true;
            if (await renovarEnSilencio()) return true;
            if (!conVentana || Date.now() < rechazadoHasta) return false;
            if (!document.body) return false;
            var hecho = await pedirContrasena();
            if (!hecho) rechazadoHasta = Date.now() + 2 * 60 * 1000;
            return hecho;
        })();
        enCurso.then(function () { enCurso = null; }, function () { enCurso = null; });
        return enCurso;
    }

    // ---------- interceptor de las peticiones a Supabase ----------
    function conCarnetActual(input, init) {
        // Devuelve los argumentos para fetch con la cabecera Authorization al dia, o null si no es cosa nuestra
        var esReq = (typeof Request !== 'undefined') && (input instanceof Request);
        var cab = new Headers((init && init.headers) || (esReq ? input.headers : undefined));
        var aut = cab.get('Authorization') || '';
        var llevado = aut.replace(/^Bearer\s+/i, '');
        if (!esCarnetWP(llevado)) return null;
        var actual = leer(CLAVE_JWT);
        if (esCarnetWP(actual)) cab.set('Authorization', 'Bearer ' + actual);
        var nuevoInit = {};
        if (init) for (var k in init) nuevoInit[k] = init[k];
        nuevoInit.headers = cab;
        return [esReq ? input.clone() : input, nuevoInit];
    }

    async function esJwtCaducado(resp) {
        if (resp.status !== 401) return false;
        try {
            var t = await resp.clone().text();
            return /jwt expired|PGRST30[13]|invalid jwt|exp.*claim/i.test(t);
        } catch (e) { return true; }
    }

    window.fetch = async function (input, init) {
        var url = (typeof input === 'string') ? input : (input && input.url) || '';
        if (!esSupabase(url) || !esSesionWP()) return fetchOriginal(input, init);
        if (conCarnetActual(input, init) === null) return fetchOriginal(input, init);

        // Carnet caducado o a punto: renovar ANTES de enviar
        if (segundosRestantes(leer(CLAVE_JWT)) <= MARGEN) await renovar(true);

        var args = conCarnetActual(input, init);
        var resp = await fetchOriginal(args[0], args[1]);
        if (!(await esJwtCaducado(resp))) return resp;

        // Supabase lo ha rechazado por caducado: renovar y repetir una vez
        var antes = leer(CLAVE_JWT);
        var renovado = await renovar(true, antes);
        if (!renovado || leer(CLAVE_JWT) === antes) return resp;
        var args2 = conCarnetActual(input, init);
        return fetchOriginal(args2[0], args2[1]);
    };

    // ---------- renovacion silenciosa por adelantado ----------
    function vigilar() {
        if (!esSesionWP()) return;
        var s = segundosRestantes(leer(CLAVE_JWT));
        if (s <= AVISO_PREVIO) renovar(false);      // sin ventana: solo si WordPress lo concede en silencio
    }
    setInterval(vigilar, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) vigilar(); });
    setTimeout(vigilar, 4000);
})();
