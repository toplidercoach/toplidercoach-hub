// ========== CM-INFORMES-FISIO.JS (v2) - Historial de informes diarios del fisio ==========
// Se abre desde un boton "Informes" en la cabecera del Panel Fisioterapia
// (junto a Resumen / Calendario / Informe diario), como ventana superpuesta.
// Sin pestana principal propia. Solo LECTURA de cm_fisio_daily_reports:
// no accede a tablas clinicas. Los nombres de jugador se resuelven en vivo
// desde club_players (con el nombre guardado en el informe como respaldo).

var cmIF = {
    reports: [],
    fisiosMap: {},      // wp_user_id -> display_name
    playerNames: {},    // player_id -> name (resuelto en vivo)
    abiertos: {},       // report_id -> true
    pagina: 0,
    porPagina: 20,
    hayMas: false,
    fisiosCargados: false
};

// ---------- Inyeccion del boton en la cabecera del Panel Fisio ----------
(function () {
    function inyectarBoton() {
        if (document.getElementById('cmfisio-btn-informes')) return;
        var btnCal = document.getElementById('cmfisio-btn-calendario');
        if (!btnCal || !btnCal.parentElement) return;
        var b = document.createElement('button');
        b.className = 'cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm';
        b.id = 'cmfisio-btn-informes';
        b.textContent = 'Informes';
        b.onclick = cmIFAbrir;
        // Delante de Resumen si existe; si no, delante de Calendario
        var ref = document.getElementById('cmfisio-btn-resumen') || btnCal;
        ref.parentElement.insertBefore(b, ref);
    }

    function envolver() {
        if (typeof cmFisioRenderPanel !== 'function') return false;
        var orig = cmFisioRenderPanel;
        cmFisioRenderPanel = function (container) {
            orig(container);
            inyectarBoton();
        };
        return true;
    }

    var intentos = 0;
    var t = setInterval(function () {
        intentos++;
        if (envolver() || intentos > 40) {
            clearInterval(t);
            inyectarBoton(); // por si el panel ya estaba renderizado
        }
    }, 300);
})();

// ---------- Abrir / cerrar overlay ----------
function cmIFAbrir() {
    cmIFCerrar();
    var ov = document.createElement('div');
    ov.id = 'cmif-overlay';
    ov.onclick = function (e) { if (e.target === ov) cmIFCerrar(); };
    ov.innerHTML =
    '<style>' +
        '#cmif-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.7);z-index:9500;display:flex;justify-content:center;align-items:flex-start;padding:30px;overflow-y:auto}' +
        '.cmif-modal{background:#0f172a;border-radius:14px;width:100%;max-width:760px;max-height:90vh;overflow-y:auto;border:1px solid #14b8a6;padding:22px}' +
        '.cmif-modal h3{color:#e2e8f0;font-size:18px;margin:0}' +
        '.cmif-sub{color:#94a3b8;font-size:13px;margin:4px 0 16px}' +
        '.cmif-close{background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer}' +
        '.cmif-report{background:#1e293b;border-radius:10px;margin-bottom:10px;overflow:hidden;border-left:4px solid #14b8a6}' +
        '.cmif-rhead{display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;flex-wrap:wrap}' +
        '.cmif-rhead:hover{background:#233044}' +
        '.cmif-rdate{color:#e2e8f0;font-weight:700;font-size:14px;text-transform:capitalize}' +
        '.cmif-rmeta{color:#94a3b8;font-size:12px}' +
        '.cmif-badges{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap;align-items:center}' +
        '.cmif-mini{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:22px;padding:0 6px;border-radius:6px;font-size:11px;font-weight:700}' +
        '.cmif-mini.g{background:#052e16;color:#86efac}' +
        '.cmif-mini.a{background:#451a03;color:#fcd34d}' +
        '.cmif-mini.r{background:#450a0a;color:#fca5a5}' +
        '.cmif-chev{color:#64748b;font-size:12px;margin-left:6px}' +
        '.cmif-rbody{padding:0 16px 14px;border-top:1px solid #0f172a}' +
        '.cmif-player{background:#0f172a;border-radius:8px;padding:12px;margin-top:10px}' +
        '.cmif-player .top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
        '.cmif-player .pname{color:#e2e8f0;font-weight:700;font-size:14px;flex:1;min-width:120px}' +
        '.cmif-rec{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600}' +
        '.cmif-rec.apto{background:#052e16;color:#86efac}' +
        '.cmif-rec.limitado{background:#451a03;color:#fcd34d}' +
        '.cmif-rec.no_disponible{background:#450a0a;color:#fca5a5}' +
        '.cmif-pmeta{color:#94a3b8;font-size:12px;margin-top:4px}' +
        '.cmif-pnote{color:#cbd5e1;font-size:12px;margin-top:8px;background:#1e293b;border-radius:6px;padding:8px}' +
        '.cmif-pnote b{color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:2px}' +
        '.cmif-general{color:#cbd5e1;font-size:13px;margin-top:12px;background:#0f172a;border-radius:8px;padding:12px;border-left:3px solid #14b8a6}' +
        '.cmif-general b{color:#14b8a6;font-size:11px;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px}' +
        '.cmif-empty{text-align:center;padding:40px 20px;color:#64748b;font-size:14px}' +
        '.cmif-mas{display:block;margin:16px auto 0;background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:9px 22px;border-radius:8px;cursor:pointer;font-size:13px}' +
        '.cmif-mas:hover{background:#334155}' +
        '@media(max-width:640px){#cmif-overlay{padding:10px}.cmif-badges{margin-left:0;width:100%}}' +
    '</style>' +
    '<div class="cmif-modal">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<h3>Informes de Fisioterapia</h3>' +
            '<button class="cmif-close" onclick="cmIFCerrar()">x</button>' +
        '</div>' +
        '<p class="cmif-sub">Partes diarios enviados al entrenador. Solo lectura.</p>' +
        '<div id="cmif-lista"><div class="cmif-empty">Cargando informes...</div></div>' +
    '</div>';
    document.body.appendChild(ov);

    cmIF.pagina = 0;
    cmIF.reports = [];
    cmIF.abiertos = {};
    cmIFCargarFisios().then(function () { cmIFCargarPagina(); });
}

function cmIFCerrar() {
    var ov = document.getElementById('cmif-overlay');
    if (ov) ov.remove();
}

// ---------- Carga de datos ----------
async function cmIFCargarFisios() {
    if (cmIF.fisiosCargados) return;
    try {
        var r = await supabaseClient.from('club_members')
            .select('wp_user_id, display_name')
            .eq('club_id', clubId);
        (r.data || []).forEach(function (m) {
            cmIF.fisiosMap[m.wp_user_id] = m.display_name || 'Fisio';
        });
        cmIF.fisiosCargados = true;
    } catch (e) { /* nombres opcionales */ }
}

async function cmIFCargarPagina() {
    var lista = document.getElementById('cmif-lista');
    if (!lista) return;
    if (cmIF.pagina === 0) lista.innerHTML = '<div class="cmif-empty">Cargando informes...</div>';

    try {
        var desde = cmIF.pagina * cmIF.porPagina;
        var hasta = desde + cmIF.porPagina; // pedimos 1 extra para saber si hay mas
        var r = await supabaseClient.from('cm_fisio_daily_reports')
            .select('id, report_date, physio_wp_user_id, players_summary, general_notes, sent_at')
            .eq('club_id', clubId)
            .order('report_date', { ascending: false })
            .order('sent_at', { ascending: false })
            .range(desde, hasta);
        if (r.error) throw r.error;

        var filas = r.data || [];
        cmIF.hayMas = filas.length > cmIF.porPagina;
        if (cmIF.hayMas) filas = filas.slice(0, cmIF.porPagina);
        cmIF.reports = cmIF.reports.concat(filas);
        await cmIFResolverNombres(filas);
        cmIFRenderLista();
    } catch (e) {
        lista.innerHTML = '<div class="cmif-empty">Error cargando informes: ' + (e.message || e) + '</div>';
    }
}

async function cmIFResolverNombres(reports) {
    var ids = [];
    reports.forEach(function (rep) {
        (rep.players_summary || []).forEach(function (p) {
            if (p.player_id && !cmIF.playerNames[p.player_id] && ids.indexOf(p.player_id) === -1) ids.push(p.player_id);
        });
    });
    if (ids.length === 0) return;
    try {
        var r = await supabaseClient.from('club_players').select('id, name').in('id', ids);
        (r.data || []).forEach(function (p) { cmIF.playerNames[p.id] = p.name; });
    } catch (e) { /* si falla, se usan los nombres guardados en el informe */ }
}

function cmIFMas() {
    cmIF.pagina++;
    cmIFCargarPagina();
}

function cmIFToggle(id) {
    cmIF.abiertos[id] = !cmIF.abiertos[id];
    cmIFRenderLista();
}

// ---------- Render ----------
function cmIFRenderLista() {
    var lista = document.getElementById('cmif-lista');
    if (!lista) return;

    if (cmIF.reports.length === 0) {
        lista.innerHTML = '<div class="cmif-empty">Todavia no hay informes enviados.<br>Cuando el fisio pulse "Enviar al entrenador", apareceran aqui.</div>';
        return;
    }

    var recLabels = { apto: 'Apto', limitado: 'Limitado', no_disponible: 'No disponible' };
    var html = '';

    cmIF.reports.forEach(function (rep) {
        var resumen = rep.players_summary || [];
        var fecha = new Date(rep.report_date + 'T12:00:00')
            .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        var fisioName = cmIF.fisiosMap[rep.physio_wp_user_id] || 'Fisio';
        var abierto = !!cmIF.abiertos[rep.id];

        // Contadores por recomendacion para la cabecera
        var nA = 0, nL = 0, nN = 0;
        resumen.forEach(function (p) {
            if (p.recommendation === 'limitado') nL++;
            else if (p.recommendation === 'no_disponible') nN++;
            else nA++;
        });

        html += '<div class="cmif-report">' +
            '<div class="cmif-rhead" onclick="cmIFToggle(\'' + rep.id + '\')">' +
                '<div>' +
                    '<div class="cmif-rdate">' + fecha + '</div>' +
                    '<div class="cmif-rmeta">' + fisioName + ' | ' + resumen.length + ' jugador' + (resumen.length !== 1 ? 'es' : '') + ' tratado' + (resumen.length !== 1 ? 's' : '') + '</div>' +
                '</div>' +
                '<div class="cmif-badges">' +
                    (nA > 0 ? '<span class="cmif-mini g">' + nA + ' OK</span>' : '') +
                    (nL > 0 ? '<span class="cmif-mini a">' + nL + ' !</span>' : '') +
                    (nN > 0 ? '<span class="cmif-mini r">' + nN + ' NO</span>' : '') +
                    '<span class="cmif-chev">' + (abierto ? '&#9650;' : '&#9660;') + '</span>' +
                '</div>' +
            '</div>';

        if (abierto) {
            html += '<div class="cmif-rbody">';
            resumen.forEach(function (p) {
                html += '<div class="cmif-player">' +
                    '<div class="top">' +
                        '<div class="pname">' + (cmIF.playerNames[p.player_id] || p.name || 'Jugador') + '</div>' +
                        (p.recommendation ? '<span class="cmif-rec ' + p.recommendation + '">' + (recLabels[p.recommendation] || p.recommendation) + '</span>' : '') +
                    '</div>' +
                    '<div class="cmif-pmeta">' +
                        (p.team && p.team !== '-' ? p.team + ' | ' : '') +
                        (p.pain !== null && p.pain !== undefined ? 'Dolor: ' + p.pain + '/10' : '') +
                        (p.techniques ? ((p.pain !== null && p.pain !== undefined ? ' | ' : '') + p.techniques) : '') +
                    '</div>' +
                    (p.note ? '<div class="cmif-pnote"><b>Nota del fisio</b>' + p.note + '</div>' : '') +
                    (p.coach_note ? '<div class="cmif-pnote"><b>Nota del fisio</b>' + p.coach_note + '</div>' : '') +
                '</div>';
            });
            if (rep.general_notes) {
                html += '<div class="cmif-general"><b>Observaciones generales</b>' + rep.general_notes + '</div>';
            }
            html += '</div>';
        }

        html += '</div>';
    });

    if (cmIF.hayMas) {
        html += '<button class="cmif-mas" onclick="cmIFMas()">Cargar informes anteriores</button>';
    }

    lista.innerHTML = html;
}

console.log('[Informes Fisio] cm-informes-fisio.js v2 cargado (boton en Panel Fisio + overlay)');
