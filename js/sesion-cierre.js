// ========== SESION-CIERRE.JS (v1) - Ventana de cierre de la sesion: PDF, enlace para compartir y siguientes pasos ==========
// Se abre sola al guardar una sesion NUEVA, y con el boton de PDF (barra de "Crear sesion" y tarjetas de "Mis Sesiones").
// El enlace: training_sessions.share_token (lo pone y lo quita esta ventana) + pagina publica sesion.html, que lee la
// sesion con la funcion de Supabase fn_sesion_compartida(token). El enlace ensena siempre la sesion tal como esta guardada.
var sesCierre = { id: null, ses: null, formato: 'titulos', recien: false };
var SESCIERRE_BLOQUES = [['pre_field_work', 'Previo'], ['warm_up', 'Calentamiento'], ['main_part', 'Principal'], ['cool_down', 'Vuelta a la calma'], ['post_field_work', 'Post campo'], ['gk_work', 'Porteros']];

function sesCierreEsc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function sesCierreToken() {
    var b = new Uint8Array(18), abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', t = '';
    (window.crypto || window.msCrypto).getRandomValues(b);
    for (var i = 0; i < b.length; i++) t += abc[b[i] % abc.length];
    return t;
}
function sesCierreUrl(token) { return new URL('sesion.html', window.location.href).href + '?s=' + token; }
function sesCierreFecha(s) {
    if (!s || !s.session_date) return '';
    var d = new Date(s.session_date + 'T12:00:00');
    var t = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).replace(',', '');
    return t + (s.session_time ? ' · ' + String(s.session_time).substring(0, 5) : '');
}

function sesCierreCss() {
    if (document.getElementById('ses-cierre-css')) return;
    var st = document.createElement('style');
    st.id = 'ses-cierre-css';
    st.textContent =
        '#ses-cierre{position:fixed;inset:0;background:rgba(15,23,42,.62);z-index:10040;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:5vh 16px}' +
        '#ses-cierre *{box-sizing:border-box}' +
        '.sc8{width:min(1040px,100%);background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.4);color:#0f172a;font-size:14px}' +
        '.sc8-cab{display:flex;align-items:center;gap:16px;padding:20px 26px;border-bottom:1px solid #e2e8f0}' +
        '.sc8-ok{flex:none;width:44px;height:44px;border-radius:50%;background:#dcfce7;color:#16a34a;display:flex;align-items:center;justify-content:center;font-size:23px;font-weight:700}' +
        '.sc8-cab h2{margin:0;font-size:20px;color:#0f172a}.sc8-cab p{margin:3px 0 0;color:#64748b;font-size:13.5px}' +
        '.sc8-x{margin-left:auto;border:0;background:none;font-size:26px;line-height:1;color:#94a3b8;cursor:pointer;padding:4px 8px}' +
        '.sc8-chips{display:flex;gap:8px;padding:13px 26px;background:#f8fafc;border-bottom:1px solid #e2e8f0;flex-wrap:wrap}' +
        '.sc8-chips span{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:6px 11px;font-size:12.5px;color:#334155}.sc8-chips b{color:#0f172a}' +
        '.sc8-chips span.gps{background:#f0fdfa;border-color:#99f6e4;color:#0f766e}' +
        '.sc8-cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}' +
        '.sc8-col{padding:20px 26px}.sc8-col+.sc8-col{border-left:1px solid #e2e8f0}' +
        '.sc8-rot{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b;margin-bottom:4px}' +
        '.sc8-col h3{margin:0 0 3px;font-size:16px;color:#0f172a}.sc8-sub{color:#64748b;font-size:13px;margin:0 0 14px}' +
        '.sc8-fs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}' +
        '.sc8-f{border:1px solid #e2e8f0;border-radius:10px;padding:10px;text-align:center;font-size:12.5px;font-weight:600;color:#334155;background:#fff;cursor:pointer}' +
        '.sc8-f.on{border-color:#7c3aed;box-shadow:inset 0 0 0 1px #7c3aed;color:#6d28d9}' +
        '.sc8-hoja{height:62px;border-radius:6px;background:#f1f5f9;margin-bottom:8px;padding:7px;display:grid;gap:4px}.sc8-hoja i{display:block;background:#cbd5e1;border-radius:2px}.sc8-f.on .sc8-hoja i{background:#c4b5fd}' +
        '.sc8-op{display:flex;align-items:center;gap:8px;font-size:13px;color:#334155;margin:13px 0 0;cursor:pointer}' +
        '.sc8-btn{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;border-radius:9px;padding:9px 15px;font-size:13.5px;font-weight:700;border:1px solid #c4b5fd;color:#6d28d9;background:#fff;cursor:pointer}' +
        '.sc8-btn.p{background:#7c3aed;border-color:#7c3aed;color:#fff}.sc8-btn.w{background:#16a34a;border-color:#16a34a;color:#fff}.sc8-btn:disabled{opacity:.6;cursor:default}' +
        '.sc8-enl{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px}.sc8-enl.sin{background:#f8fafc;border-color:#e2e8f0}' +
        '.sc8-url{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.sc8-url input{flex:1;min-width:150px;background:#fff;border:1px solid #d1d5db;border-radius:8px;padding:9px 11px;font-size:12.5px;color:#334155}' +
        '.sc8-inc{font-size:12.5px;color:#475569;margin:12px 0 0;line-height:1.5}.sc8-inc b{color:#0f172a}' +
        '.sc8-rev{border:0;background:none;padding:0;font-size:12.5px;color:#b91c1c;margin-top:10px;font-weight:600;cursor:pointer}' +
        '.sc8-pie{display:flex;gap:8px;align-items:center;padding:15px 26px;border-top:1px solid #e2e8f0;background:#f8fafc;flex-wrap:wrap}.sc8-pie .sc8-rot{margin:0 6px 0 0}.sc8-sp{margin-left:auto;display:flex;gap:8px}' +
        '@media (max-width:820px){.sc8-cols{grid-template-columns:minmax(0,1fr)}.sc8-col+.sc8-col{border-left:0;border-top:1px solid #e2e8f0}.sc8-sp{margin-left:0}}';
    document.head.appendChild(st);
}

function sesCierreCerrar() { var ov = document.getElementById('ses-cierre'); if (ov) ov.remove(); }

// id de la sesion; recien = true cuando se acaba de guardar una sesion nueva
async function sesCierreAbrir(id, recien) {
    if (!id || typeof supabaseClient === 'undefined') return;
    sesCierreCss();
    sesCierreCerrar();
    sesCierre.id = id; sesCierre.recien = !!recien; sesCierre.ses = null; sesCierre.formato = 'titulos';
    var ov = document.createElement('div');
    ov.id = 'ses-cierre';
    ov.onclick = function (e) { if (e.target === ov) sesCierreCerrar(); };
    ov.innerHTML = '<div class="sc8"><div class="sc8-cab"><div><h2>Cargando la sesión...</h2></div><button class="sc8-x" onclick="sesCierreCerrar()" title="Cerrar">&times;</button></div></div>';
    document.body.appendChild(ov);
    try {
        var r = await supabaseClient.from('training_sessions')
            .select('id, name, session_date, session_time, match_day, share_token, pre_field_work, warm_up, main_part, cool_down, post_field_work, gk_work')
            .eq('id', id).single();
        if (r.error || !r.data) throw (r.error || new Error('sin datos'));
        if (sesCierre.id !== id || !document.getElementById('ses-cierre')) return;
        sesCierre.ses = r.data;
        sesCierrePintar();
    } catch (e) {
        console.error('[SesCierre] abrir:', e);
        sesCierreCerrar();
        if (typeof showToast === 'function') showToast('No se pudo abrir la sesión', 'error');
    }
}

function sesCierrePintar() {
    var ov = document.getElementById('ses-cierre'), s = sesCierre.ses;
    if (!ov || !s) return;
    var id = s.id, total = 0, nTareas = 0, reparto = [];
    SESCIERRE_BLOQUES.forEach(function (b) {
        var arr = Array.isArray(s[b[0]]) ? s[b[0]] : [], min = 0;
        arr.forEach(function (t) { min += Math.max(0, Math.round(parseFloat(t.duracion) || 0)); });
        if (arr.length) { nTareas += arr.length; total += min; reparto.push(b[1] + ' <b>' + min + "'</b>"); }
    });
    var hayPorteros = Array.isArray(s.gk_work) && s.gk_work.length > 0;
    var chips = '';
    if (s.match_day) chips += '<span><b>' + sesCierreEsc(s.match_day) + '</b></span>';
    chips += '<span><b>' + total + ' min</b> en total</span><span><b>' + nTareas + '</b> ' + (nTareas === 1 ? 'tarea' : 'tareas') + '</span>';
    if (reparto.length > 1) chips += '<span>' + reparto.join(' · ') + '</span>';
    // carga prevista: solo si es la sesion que esta abierta en el editor (es la que tiene el calculo hecho)
    try {
        if (typeof sesionEditandoId !== 'undefined' && sesionEditandoId === id && typeof planGpsResumen === 'function') {
            var g = planGpsResumen();
            if (g && g[0]) chips += '<span class="gps" title="' + sesCierreEsc(g[0].ayuda) + '">Distancia prevista <b>' + sesCierreEsc(g[0].valor) + '</b> · ' + sesCierreEsc(g[0].nota) + '</span>';
        }
    } catch (e) { /* sin dato GPS */ }

    var f = sesCierre.formato;
    var hoja = function (k, cols, filas, n, txt) {
        var celdas = ''; for (var i = 0; i < n; i++) celdas += '<i></i>';
        return '<button type="button" class="sc8-f' + (f === k ? ' on' : '') + '" onclick="sesCierreFormato(\'' + k + '\')"><div class="sc8-hoja" style="grid-template-columns:repeat(' + cols + ',1fr);grid-template-rows:repeat(' + filas + ',1fr)">' + celdas + '</div>' + txt + '</button>';
    };
    var compartir;
    if (s.share_token) {
        compartir = '<div class="sc8-enl"><div class="sc8-url"><input type="text" id="sc8-url" readonly value="' + sesCierreEsc(sesCierreUrl(s.share_token)) + '" onclick="this.select()">' +
            '<button type="button" class="sc8-btn" onclick="sesCierreCopiar()">Copiar</button><button type="button" class="sc8-btn w" onclick="sesCierreWhatsApp()">WhatsApp</button></div>' +
            '<div class="sc8-inc"><b>Se ve:</b> tareas, dibujos, tiempos y explicación. Si cambias la sesión, el enlace enseña la versión nueva.<br><b>No se ve:</b> asistencia, jugadores ni equipos.</div>' +
            '<button type="button" class="sc8-rev" onclick="sesCierreDejarDeCompartir()">Dejar de compartir este enlace</button></div>';
    } else {
        compartir = '<div class="sc8-enl sin"><div class="sc8-inc" style="margin:0 0 12px"><b>Se verá:</b> tareas, dibujos, tiempos y explicación.<br><b>No se verá:</b> asistencia, jugadores ni equipos.<br>Puedes anular el enlace cuando quieras.</div>' +
            '<button type="button" class="sc8-btn p" id="sc8-crear" onclick="sesCierreCrearEnlace()">Crear enlace para compartir</button></div>';
    }
    var a = "'" + sesCierreEsc(id) + "'";
    ov.innerHTML = '<div class="sc8">' +
        '<div class="sc8-cab">' + (sesCierre.recien ? '<div class="sc8-ok">✓</div>' : '') + '<div><h2>' + (sesCierre.recien ? 'Sesión guardada' : 'Descargar y compartir') + '</h2><p>' + sesCierreEsc(s.name || 'Sesión') + (s.session_date ? ' — ' + sesCierreEsc(sesCierreFecha(s)) : '') + '</p></div>' +
        '<button class="sc8-x" onclick="sesCierreCerrar()" title="Cerrar">&times;</button></div>' +
        '<div class="sc8-chips">' + chips + '</div>' +
        '<div class="sc8-cols">' +
        '<div class="sc8-col"><div class="sc8-rot">1 · Descargar</div><h3>PDF de la sesión</h3><p class="sc8-sub">Elige el formato.</p>' +
        '<div class="sc8-fs">' + hoja('titulos', 2, 1, 2, 'Con títulos') + hoja('limpio', 1, 3, 3, 'Sin títulos') + hoja('resumen', 3, 2, 6, 'Resumen en 1 hoja') + '</div>' +
        '<label class="sc8-op"' + (f === 'resumen' ? ' style="opacity:.45"' : '') + '><input type="checkbox" id="sc8-hoja-ej"' + (f === 'resumen' ? ' disabled' : '') + '> Una hoja por ejercicio (más espacio para equipos)</label>' +
        '<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="sc8-btn p" onclick="sesCierrePdf()">Descargar PDF</button>' +
        (hayPorteros ? '<button type="button" class="sc8-btn" onclick="sesCierrePdf(true)">PDF de porteros</button>' : '') + '</div></div>' +
        '<div class="sc8-col"><div class="sc8-rot">2 · Compartir</div><h3>Enlace de la sesión</h3><p class="sc8-sub">Quien lo abra ve la sesión en el móvil, sin entrar en TopLiderCoach.</p>' + compartir + '</div>' +
        '</div>' +
        '<div class="sc8-pie"><span class="sc8-rot">Y ahora</span>' +
        '<button type="button" class="sc8-btn" onclick="sesCierreIr(\'vestuario\')">Modo vestuario</button>' +
        '<button type="button" class="sc8-btn" onclick="sesCierreIr(\'asistencia\')">Asistencia</button>' +
        '<button type="button" class="sc8-btn" onclick="sesCierreIr(\'montajes\')">Montajes de campo</button>' +
        '<div class="sc8-sp">' + (sesCierre.recien
            ? '<button type="button" class="sc8-btn" onclick="sesCierreCerrar()">Seguir editando</button><button type="button" class="sc8-btn p" onclick="sesCierreNueva()">+ Nueva sesión</button>'
            : '<button type="button" class="sc8-btn" onclick="sesCierreCerrar()">Cerrar</button>') + '</div></div>' +
        '</div>';
}

function sesCierreFormato(k) {
    var marcado = document.getElementById('sc8-hoja-ej') && document.getElementById('sc8-hoja-ej').checked;
    sesCierre.formato = k;
    sesCierrePintar();
    var c = document.getElementById('sc8-hoja-ej');
    if (c && !c.disabled) c.checked = !!marcado;
}

// Usa los generadores de PDF que ya existian en planificador.js
function sesCierrePdf(porteros) {
    var id = sesCierre.id, c = document.getElementById('sc8-hoja-ej');
    var hojaPorEj = !!(c && c.checked && !c.disabled);
    if (porteros) return exportarSesionPDF(id, true, false, true);
    if (sesCierre.formato === 'resumen') return exportarSesionPDFResumida(id);
    return exportarSesionPDF(id, sesCierre.formato === 'titulos', hojaPorEj);
}

async function sesCierreGuardarToken(token) {
    var r = await supabaseClient.from('training_sessions').update({ share_token: token }).eq('id', sesCierre.id);
    if (r.error) throw r.error;
    if (sesCierre.ses) sesCierre.ses.share_token = token;
}
async function sesCierreCrearEnlace() {
    var b = document.getElementById('sc8-crear');
    if (b) { b.disabled = true; b.textContent = 'Creando...'; }
    try {
        await sesCierreGuardarToken(sesCierreToken());
        sesCierrePintar();
    } catch (e) {
        console.error('[SesCierre] crear enlace:', e);
        if (b) { b.disabled = false; b.textContent = 'Crear enlace para compartir'; }
        if (typeof showToast === 'function') showToast('No se pudo crear el enlace', 'error');
    }
}
async function sesCierreDejarDeCompartir() {
    var ok = (typeof showConfirm === 'function') ? await showConfirm('¿Dejar de compartir esta sesión? El enlace que hayas enviado dejará de funcionar.') : true;
    if (!ok) return;
    try {
        await sesCierreGuardarToken(null);
        sesCierrePintar();
        if (typeof showToast === 'function') showToast('Enlace anulado', 'success');
    } catch (e) {
        console.error('[SesCierre] anular enlace:', e);
        if (typeof showToast === 'function') showToast('No se pudo anular el enlace', 'error');
    }
}
async function sesCierreCopiar() {
    var inp = document.getElementById('sc8-url');
    if (!inp) return;
    var ok = false;
    try { await navigator.clipboard.writeText(inp.value); ok = true; }
    catch (e) { try { inp.select(); ok = document.execCommand('copy'); } catch (e2) { ok = false; } }
    if (typeof showToast === 'function') showToast(ok ? 'Enlace copiado' : 'No se pudo copiar: selecciona el enlace y cópialo a mano', ok ? 'success' : 'warning');
}
function sesCierreWhatsApp() {
    var s = sesCierre.ses;
    if (!s || !s.share_token) return;
    var txt = (s.name || 'Sesión') + (s.session_date ? ' · ' + sesCierreFecha(s) : '') + '\n' + sesCierreUrl(s.share_token);
    window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
}
function sesCierreIr(cual) {
    var id = sesCierre.id;
    sesCierreCerrar();
    if (cual === 'vestuario' && typeof abrirModoVestuario === 'function') abrirModoVestuario(id);
    else if (cual === 'asistencia' && typeof abrirModalAsistenciaSesion === 'function') abrirModalAsistenciaSesion(id);
    else if (cual === 'montajes' && typeof abrirMontajesSesion === 'function') abrirMontajesSesion(id);
}
function sesCierreNueva() {
    sesCierreCerrar();
    if (typeof limpiarSesion === 'function') limpiarSesion();
    window.scrollTo(0, 0);
}

console.log('[SesCierre] sesion-cierre.js v1 cargado');
