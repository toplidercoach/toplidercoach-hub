// ========== CM-FISIO-RESUMEN.JS - Dashboard diario del Panel Fisioterapia ==========
// Vista "Resumen": navegacion por dias, KPIs, tira semanal y feed de sesiones.
// No modifica ninguna funcion existente: envuelve cmFisioRenderPanel para
// inyectar su boton (mismo patron que cm-fisio-extras.js).

var cmFisioRes = {
    activo: false,
    dia: null,            // Date del dia seleccionado
    fisioFiltro: 'all',   // 'all' o identidad del fisio
    fisios: [],           // [{wp_user_id, display_name}]
    playersMap: {},       // player_id -> {name, photo_url}
    cargando: false
};

// ---------- Utilidades ----------
function cmFisioResFechaStr(d) {
    // YYYY-MM-DD en hora LOCAL (evita el desfase UTC de toISOString)
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

function cmFisioResTechLabel(code) {
    if (typeof cmFisioTecnicasCatalog !== 'undefined' && cmFisioTecnicasCatalog) {
        for (var i = 0; i < cmFisioTecnicasCatalog.length; i++) {
            if (cmFisioTecnicasCatalog[i].code === code) return cmFisioTecnicasCatalog[i].name_es || code;
        }
    }
    return code;
}

function cmFisioResLunesDe(d) {
    var x = new Date(d);
    var dia = x.getDay(), diff = (dia === 0 ? -6 : 1 - dia);
    x.setDate(x.getDate() + diff);
    x.setHours(0, 0, 0, 0);
    return x;
}

// ---------- Inyeccion del boton en la cabecera ----------
(function () {
    function inyectarBoton() {
        if (document.getElementById('cmfisio-btn-resumen')) return;
        var btnCal = document.getElementById('cmfisio-btn-calendario');
        if (!btnCal || !btnCal.parentElement) return;
        var b = document.createElement('button');
        b.className = 'cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm';
        b.id = 'cmfisio-btn-resumen';
        b.textContent = 'Resumen';
        b.onclick = cmFisioResToggleVista;
        btnCal.parentElement.insertBefore(b, btnCal);
    }

    function envolver() {
        if (typeof cmFisioRenderPanel !== 'function') return false;
        var orig = cmFisioRenderPanel;
        cmFisioRenderPanel = function (container) {
            orig(container);
            cmFisioRes.activo = false;
            inyectarBoton();
        };
        return true;
    }

    // Envolver tambien el toggle del calendario para que Resumen se desactive limpio
    function envolverCalendario() {
        if (typeof cmFisioCalToggleVista !== 'function') return false;
        var origCal = cmFisioCalToggleVista;
        cmFisioCalToggleVista = function () {
            if (cmFisioRes.activo) cmFisioResSalir(false);
            origCal();
        };
        return true;
    }

    var intentos = 0;
    var t = setInterval(function () {
        intentos++;
        var ok1 = envolver();
        var ok2 = envolverCalendario();
        if ((ok1 && ok2) || intentos > 40) {
            clearInterval(t);
            inyectarBoton(); // por si el panel ya estaba renderizado
        }
    }, 250);
})();

// ---------- Toggle de vista ----------
function cmFisioResToggleVista() {
    if (cmFisioRes.activo) {
        cmFisioResSalir(true);
    } else {
        cmFisioResEntrar();
    }
}

function cmFisioResEntrar() {
    // Si el calendario estaba activo, restaurar su boton/estado sin re-render
    if (typeof cmFisioCal !== 'undefined' && cmFisioCal.vistaActiva === 'calendario') {
        cmFisioCal.vistaActiva = 'jugadores';
        var bc = document.getElementById('cmfisio-btn-calendario');
        if (bc) { bc.textContent = 'Calendario'; bc.className = 'cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm'; }
    }
    cmFisioRes.activo = true;
    if (!cmFisioRes.dia) cmFisioRes.dia = new Date();
    var b = document.getElementById('cmfisio-btn-resumen');
    if (b) { b.textContent = 'Jugadores'; b.className = 'cmfisio-btn cmfisio-btn-primary cmfisio-btn-sm'; }
    var sb = document.getElementById('cmfisio-stats-bar');
    var fc = document.getElementById('cmfisio-filter-count');
    if (sb) sb.style.display = 'none';
    if (fc) fc.style.display = 'none';
    var grid = document.getElementById('cmfisio-player-grid');
    if (grid) grid.style.display = 'block';
    cmFisioResCargar();
}

function cmFisioResSalir(recargarJugadores) {
    cmFisioRes.activo = false;
    var b = document.getElementById('cmfisio-btn-resumen');
    if (b) { b.textContent = 'Resumen'; b.className = 'cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm'; }
    if (recargarJugadores) {
        var sb = document.getElementById('cmfisio-stats-bar');
        var fc = document.getElementById('cmfisio-filter-count');
        if (sb) sb.style.display = '';
        if (fc) fc.style.display = '';
        var grid = document.getElementById('cmfisio-player-grid');
        if (grid) grid.style.display = '';
        if (typeof cmFisioCargarJugadores === 'function') cmFisioCargarJugadores();
    }
}

// ---------- Navegacion ----------
function cmFisioResNav(dir) {
    cmFisioRes.dia.setDate(cmFisioRes.dia.getDate() + dir);
    cmFisioResCargar();
}

function cmFisioResHoy() {
    cmFisioRes.dia = new Date();
    cmFisioResCargar();
}

function cmFisioResIrA(fechaStr) {
    cmFisioRes.dia = new Date(fechaStr + 'T12:00:00');
    cmFisioResCargar();
}

function cmFisioResCambiarFisio(val) {
    cmFisioRes.fisioFiltro = val;
    cmFisioResCargar();
}

// ---------- Carga de datos ----------
async function cmFisioResCargar() {
    if (cmFisioRes.cargando) return;
    cmFisioRes.cargando = true;
    var grid = document.getElementById('cmfisio-player-grid');
    if (!grid) { cmFisioRes.cargando = false; return; }
    grid.innerHTML = '<div class="cmfisio-empty"><p>Cargando resumen...</p></div>';

    try {
        var dia = cmFisioRes.dia;
        var diaStr = cmFisioResFechaStr(dia);
        var lunes = cmFisioResLunesDe(dia);
        var domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6);
        var lunesStr = cmFisioResFechaStr(lunes);
        var domingoStr = cmFisioResFechaStr(domingo);

        // 1. Fisios del club (para nombres y selector)
        if (cmFisioRes.fisios.length === 0) {
            var fRes = await supabaseClient.from('club_members')
                .select('wp_user_id, display_name, club_roles(name)')
                .eq('club_id', clubId).eq('active', true);
            cmFisioRes.fisios = (fRes.data || []).filter(function (m) {
                var rn = (m.club_roles && m.club_roles.name ? m.club_roles.name : '').toLowerCase();
                return rn.indexOf('fisio') !== -1;
            });
        }

        // 2. Sesiones de la SEMANA (para la tira de dias)
        var qSem = supabaseClient.from('cm_fisio_sessions')
            .select('id, session_date, performed_by')
            .eq('club_id', clubId).eq('archived', false)
            .gte('session_date', lunesStr).lte('session_date', domingoStr);
        if (cmFisioRes.fisioFiltro !== 'all') qSem = qSem.eq('performed_by', cmFisioRes.fisioFiltro);
        var semRes = await qSem;
        var sesSemana = semRes.data || [];

        // 3. Sesiones del DIA seleccionado (detalle completo)
        var qDia = supabaseClient.from('cm_fisio_sessions')
            .select('*')
            .eq('club_id', clubId).eq('archived', false)
            .eq('session_date', diaStr)
            .order('time_start');
        if (cmFisioRes.fisioFiltro !== 'all') qDia = qDia.eq('performed_by', cmFisioRes.fisioFiltro);
        var diaRes = await qDia;
        var sesiones = diaRes.data || [];

        // 4. Nombres de jugadores de las sesiones del dia
        var pids = [];
        sesiones.forEach(function (s) { if (pids.indexOf(s.player_id) === -1) pids.push(s.player_id); });
        if (pids.length > 0) {
            var pRes = await supabaseClient.from('club_players')
                .select('id, name, photo_url').in('id', pids);
            (pRes.data || []).forEach(function (p) { cmFisioRes.playersMap[p.id] = p; });
        }

        // 5. Citas programadas del dia (KPI)
        var qCit = supabaseClient.from('cm_fisio_appointments')
            .select('id')
            .eq('club_id', clubId).eq('archived', false)
            .eq('appointment_date', diaStr).neq('status', 'cancelled');
        if (cmFisioRes.fisioFiltro !== 'all') qCit = qCit.eq('physio_wp_user_id', cmFisioRes.fisioFiltro);
        var citRes = await qCit;
        var numCitas = (citRes.data || []).length;

        cmFisioResRender(sesiones, sesSemana, numCitas, lunes);
    } catch (e) {
        grid.innerHTML = '<div class="cmfisio-empty"><p>Error cargando resumen: ' + (e.message || e) + '</p></div>';
    }
    cmFisioRes.cargando = false;
}

// ---------- Render ----------
function cmFisioResRender(sesiones, sesSemana, numCitas, lunes) {
    var grid = document.getElementById('cmfisio-player-grid');
    if (!grid) return;

    var dia = cmFisioRes.dia;
    var diaStr = cmFisioResFechaStr(dia);
    var hoyStr = cmFisioResFechaStr(new Date());

    // Estilos propios (una sola vez)
    var css = '';
    if (!document.getElementById('cmfres-styles')) {
        css = '<style id="cmfres-styles">' +
            '.cmfres-nav{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}' +
            '.cmfres-nav h3{margin:0;color:#e2e8f0;font-size:16px;text-transform:capitalize;flex:1;min-width:200px}' +
            '.cmfres-navbtn{background:#1e293b;border:1px solid #334155;color:#e2e8f0;width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:15px}' +
            '.cmfres-navbtn:hover{background:#334155}' +
            '.cmfres-hoy{background:#0f3d3e;border:1px solid #14b8a6;color:#14b8a6;padding:7px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600}' +
            '.cmfres-sel{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:7px 10px;border-radius:8px;font-size:12px}' +
            '.cmfres-week{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:14px}' +
            '.cmfres-day{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:8px 4px;text-align:center;cursor:pointer;transition:all .15s}' +
            '.cmfres-day:hover{border-color:#14b8a6}' +
            '.cmfres-day.sel{border-color:#14b8a6;background:#0f3d3e}' +
            '.cmfres-day.hoy .d{color:#14b8a6}' +
            '.cmfres-day .d{color:#94a3b8;font-size:11px;font-weight:600}' +
            '.cmfres-day .n{color:#e2e8f0;font-size:15px;font-weight:700;margin:2px 0}' +
            '.cmfres-day .c{font-size:10px;color:#64748b}' +
            '.cmfres-day .c.has{color:#14b8a6;font-weight:700}' +
            '.cmfres-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px}' +
            '.cmfres-kpi{background:#1e293b;border-radius:10px;padding:12px;text-align:center}' +
            '.cmfres-kpi .num{font-size:24px;font-weight:800;color:#14b8a6}' +
            '.cmfres-kpi .lbl{font-size:11px;color:#94a3b8;margin-top:2px}' +
            '.cmfres-card{background:#1e293b;border-radius:10px;padding:14px;margin-bottom:10px;cursor:pointer;border-left:4px solid #334155;transition:border-color .15s}' +
            '.cmfres-card:hover{border-left-color:#14b8a6}' +
            '.cmfres-card.rec-apto{border-left-color:#22c55e}' +
            '.cmfres-card.rec-limitado{border-left-color:#f59e0b}' +
            '.cmfres-card.rec-no_disponible{border-left-color:#ef4444}' +
            '.cmfres-card .top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
            '.cmfres-card .avatar{width:34px;height:34px;border-radius:50%;background:#334155;display:flex;align-items:center;justify-content:center;color:#e2e8f0;font-weight:700;font-size:13px;overflow:hidden;flex-shrink:0}' +
            '.cmfres-card .avatar img{width:100%;height:100%;object-fit:cover}' +
            '.cmfres-card .pname{color:#e2e8f0;font-weight:700;font-size:14px}' +
            '.cmfres-card .meta{color:#94a3b8;font-size:11px}' +
            '.cmfres-card .note{color:#cbd5e1;font-size:12px;margin-top:8px;background:#0f172a;border-radius:6px;padding:8px}' +
            '.cmfres-card .note b{color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:2px}' +
            '@media(max-width:640px){.cmfres-week{gap:3px}.cmfres-day{padding:6px 2px}.cmfres-nav h3{min-width:100%}}' +
            '</style>';
    }

    // Titulo del dia
    var titulo = dia.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);

    // Selector de fisio (solo si hay mas de uno)
    var selFisio = '';
    if (cmFisioRes.fisios.length > 1) {
        var opts = '<option value="all"' + (cmFisioRes.fisioFiltro === 'all' ? ' selected' : '') + '>Todos los fisios</option>';
        cmFisioRes.fisios.forEach(function (f) {
            opts += '<option value="' + f.wp_user_id + '"' + (String(cmFisioRes.fisioFiltro) === String(f.wp_user_id) ? ' selected' : '') + '>' + (f.display_name || 'Fisio') + '</option>';
        });
        selFisio = '<select class="cmfres-sel" onchange="cmFisioResCambiarFisio(this.value===\'all\'?\'all\':parseInt(this.value))">' + opts + '</select>';
    }

    // Tira semanal
    var diasLbl = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    var conteo = {};
    sesSemana.forEach(function (s) { conteo[s.session_date] = (conteo[s.session_date] || 0) + 1; });
    var weekHtml = '';
    for (var i = 0; i < 7; i++) {
        var f = new Date(lunes); f.setDate(lunes.getDate() + i);
        var fs = cmFisioResFechaStr(f);
        var n = conteo[fs] || 0;
        weekHtml += '<div class="cmfres-day' + (fs === diaStr ? ' sel' : '') + (fs === hoyStr ? ' hoy' : '') + '" onclick="cmFisioResIrA(\'' + fs + '\')">' +
            '<div class="d">' + diasLbl[i] + '</div>' +
            '<div class="n">' + f.getDate() + '</div>' +
            '<div class="c' + (n > 0 ? ' has' : '') + '">' + (n > 0 ? n + ' ses.' : '-') + '</div>' +
        '</div>';
    }

    // KPIs
    var jugadoresSet = {};
    var sumaDolor = 0, numDolor = 0;
    sesiones.forEach(function (s) {
        jugadoresSet[s.player_id] = true;
        if (s.pain_level !== null && s.pain_level !== undefined) { sumaDolor += s.pain_level; numDolor++; }
    });
    var numJug = Object.keys(jugadoresSet).length;
    var dolorMedio = numDolor > 0 ? (sumaDolor / numDolor).toFixed(1) : '-';

    var kpisHtml =
        '<div class="cmfres-kpis">' +
            '<div class="cmfres-kpi"><div class="num">' + sesiones.length + '</div><div class="lbl">Sesiones</div></div>' +
            '<div class="cmfres-kpi"><div class="num">' + numJug + '</div><div class="lbl">Jugadores tratados</div></div>' +
            '<div class="cmfres-kpi"><div class="num">' + dolorMedio + '</div><div class="lbl">Dolor medio</div></div>' +
            '<div class="cmfres-kpi"><div class="num">' + numCitas + '</div><div class="lbl">Citas programadas</div></div>' +
        '</div>';

    // Feed de sesiones
    var recLabels = { apto: 'Apto', limitado: 'Limitado', no_disponible: 'No disponible' };
    var fisioMap = {};
    cmFisioRes.fisios.forEach(function (f) { fisioMap[f.wp_user_id] = f.display_name || 'Fisio'; });

    var feedHtml = '';
    if (sesiones.length === 0) {
        feedHtml = '<div class="cmfisio-empty"><div class="icon">--</div><p>No hay sesiones registradas este dia</p></div>';
    } else {
        sesiones.forEach(function (s) {
            var p = cmFisioRes.playersMap[s.player_id] || {};
            var nombre = p.name || 'Jugador';
            var avatar = p.photo_url ? '<img src="' + p.photo_url + '">' : nombre.charAt(0);
            var hora = s.time_start ? s.time_start.substring(0, 5) : '';
            var techs = (s.techniques_applied || []).map(function (tc) {
                return '<span class="cmfisio-technique-tag">' + cmFisioResTechLabel(tc) + '</span>';
            }).join('');
            var recClass = s.coach_recommendation ? ' rec-' + s.coach_recommendation : '';
            var recBadge = s.coach_recommendation ? '<span class="cmfisio-recommendation ' + s.coach_recommendation + '">' + (recLabels[s.coach_recommendation] || '') + '</span>' : '';
            var fisioName = fisioMap[s.performed_by] || '';

            feedHtml += '<div class="cmfres-card' + recClass + '" onclick="if(typeof cmFisioAbrirFicha===\'function\')cmFisioAbrirFicha(\'' + s.player_id + '\',\'' + nombre.replace(/'/g, "\\'") + '\',\'' + (p.photo_url || '') + '\')">' +
                '<div class="top">' +
                    '<div class="avatar">' + avatar + '</div>' +
                    '<div style="flex:1;min-width:120px">' +
                        '<div class="pname">' + nombre + '</div>' +
                        '<div class="meta">' + (hora ? hora + ' h' : '') +
                            (s.pain_level !== null && s.pain_level !== undefined ? ' | Dolor: ' + s.pain_level + '/10' : '') +
                            (fisioName ? ' | ' + fisioName : '') + '</div>' +
                    '</div>' +
                    recBadge +
                '</div>' +
                (techs ? '<div style="margin-top:8px">' + techs + '</div>' : '') +
                (s.coach_note ? '<div class="note"><b>Nota para el entrenador</b>' + s.coach_note + '</div>' : '') +
                (s.soap_plan ? '<div class="note"><b>Plan</b>' + s.soap_plan + '</div>' : '') +
            '</div>';
        });
    }

    grid.innerHTML = css +
        '<div class="cmfres-nav">' +
            '<button class="cmfres-navbtn" onclick="cmFisioResNav(-1)">&#8592;</button>' +
            '<h3>' + titulo + '</h3>' +
            '<button class="cmfres-navbtn" onclick="cmFisioResNav(1)">&#8594;</button>' +
            '<button class="cmfres-hoy" onclick="cmFisioResHoy()">Hoy</button>' +
            selFisio +
        '</div>' +
        '<div class="cmfres-week">' + weekHtml + '</div>' +
        kpisHtml +
        '<h4 style="color:#e2e8f0;font-size:14px;margin:0 0 10px">Sesiones del dia</h4>' +
        feedHtml;
}

console.log('[Panel Fisio] cm-fisio-resumen.js cargado (dashboard diario)');
