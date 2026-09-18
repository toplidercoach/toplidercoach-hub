// ========== CM-FISIO-EVOLUCION.JS - TopLiderCoach HUB (Club Mode) ==========
// Informe de evolucion de la semana de partido: de lunes hasta el dia del partido.
// Lee cm_fisio_sessions, cm_fisio_treatments, club_player_availability y matches.
// Se abre con cmFisioInformeSemana(); navega entre partidos con cmFisioInformeSemanaNav(+1/-1).

var cmFisioEvo = { partidos: [], idx: -1, filas: [], ventana: null, partido: null };

function cmFisioEvoISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function cmFisioEvoFmt(iso) {
    if (!iso) return '';
    var p = iso.split('-'); return p[2] + '/' + p[1];
}
// Lunes de la semana de una fecha (semana lunes-domingo)
function cmFisioEvoLunes(iso) {
    var d = new Date(iso + 'T12:00:00');
    var dow = (d.getDay() + 6) % 7; // 0 = lunes
    d.setDate(d.getDate() - dow);
    return cmFisioEvoISO(d);
}

async function cmFisioInformeSemana(idx) {
    try {
        var hoy = cmFisioEvoISO(new Date());
        if (!cmFisioEvo.partidos.length) {
            var r = await supabaseClient.from('matches').select('id, match_date, opponent, home_away, competition, kick_off_time')
                .eq('club_id', clubId).order('match_date', { ascending: true });
            if (r.error) throw r.error;
            cmFisioEvo.partidos = r.data || [];
        }
        var P = cmFisioEvo.partidos;
        if (idx === undefined || idx === null) {
            // Proximo partido (hoy o posterior); si no hay, el ultimo jugado
            idx = -1;
            for (var i = 0; i < P.length; i++) { if (P[i].match_date >= hoy) { idx = i; break; } }
            if (idx === -1) idx = P.length - 1;
        }
        cmFisioEvo.idx = idx;

        var desde, hasta, partido = null;
        if (idx >= 0 && P[idx]) {
            partido = P[idx];
            hasta = partido.match_date;
            desde = cmFisioEvoLunes(hasta);
        } else {
            desde = cmFisioEvoLunes(hoy);
            var dd = new Date(desde + 'T12:00:00'); dd.setDate(dd.getDate() + 6); hasta = cmFisioEvoISO(dd);
        }
        cmFisioEvo.partido = partido;
        cmFisioEvo.ventana = { desde: desde, hasta: hasta };

        cmFisioEvo.filas = await cmFisioEvoCalcular(desde, hasta);
        cmFisioEvoRender();
    } catch (e) {
        console.error('Informe semana fisio:', e);
        showToast('Error al generar el informe: ' + e.message, 'error');
    }
}

// Calcula las filas del informe para una ventana de fechas. Reutilizable (dossier del plan de partido).
async function cmFisioEvoCalcular(desde, hasta) {
        var sRes = await supabaseClient.from('cm_fisio_sessions')
            .select('id, player_id, treatment_id, session_date, time_start, pain_level, techniques_applied, coach_recommendation, coach_note, soap_action')
            .eq('club_id', clubId).eq('archived', false).gte('session_date', desde).lte('session_date', hasta)
            .order('session_date', { ascending: true }).order('time_start', { ascending: true });
        if (sRes.error) throw sRes.error;
        var sesiones = sRes.data || [];

        var filas = [];
        if (sesiones.length) {
            var ids = [...new Set(sesiones.map(function(s) { return s.player_id; }))];
            var pRes = await supabaseClient.from('club_players').select('id, name, photo_url, positions_main, position_detail').in('id', ids);
            var tRes = await supabaseClient.from('cm_fisio_treatments').select('id, player_id, title, status, start_date, estimated_end_date, actual_end_date')
                .eq('club_id', clubId).eq('archived', false).in('player_id', ids);
            var aRes = await supabaseClient.from('club_player_availability').select('player_id, status').eq('club_id', clubId).in('player_id', ids);
            var pMap = {}; (pRes.data || []).forEach(function(p) { pMap[p.id] = p; });
            var tMap = {}; (tRes.data || []).forEach(function(t) { if (!tMap[t.player_id]) tMap[t.player_id] = []; tMap[t.player_id].push(t); });
            var aMap = {}; (aRes.data || []).forEach(function(a) { aMap[a.player_id] = a.status; });

            ids.forEach(function(pid) {
                var ss = sesiones.filter(function(s) { return s.player_id === pid; });
                var conDolor = ss.filter(function(s) { return s.pain_level !== null && s.pain_level !== undefined; });
                var primero = conDolor.length ? conDolor[0].pain_level : null;
                var ultimo = conDolor.length ? conDolor[conDolor.length - 1].pain_level : null;
                var tec = {};
                ss.forEach(function(s) { (s.techniques_applied || []).forEach(function(t) { tec[t] = (tec[t] || 0) + 1; }); });
                var tecTop = Object.keys(tec).sort(function(a, b) { return tec[b] - tec[a]; }).slice(0, 3);
                var ultimaRec = null, ultimaNota = '';
                for (var k = ss.length - 1; k >= 0; k--) { if (ss[k].coach_recommendation) { ultimaRec = ss[k].coach_recommendation; ultimaNota = ss[k].coach_note || ''; break; } }
                if (!ultimaNota) { for (var k2 = ss.length - 1; k2 >= 0; k2--) { if (ss[k2].coach_note) { ultimaNota = ss[k2].coach_note; break; } } }
                var trats = (tMap[pid] || []);
                var tratActivo = trats.find(function(t) { return t.status === 'active'; }) || trats.find(function(t) { return t.status === 'paused'; }) || trats[0] || null;
                var p = pMap[pid] || {};
                filas.push({
                    playerId: pid, name: p.name || 'Jugador', photo: p.photo_url || '', pos: p.position_detail || (Array.isArray(p.positions_main) ? p.positions_main[0] : '') || '',
                    sesiones: ss, n: ss.length, primero: primero, ultimo: ultimo,
                    dolores: conDolor.map(function(s) { return s.pain_level; }),
                    tendencia: (primero === null || ultimo === null || conDolor.length < 2) ? 'na' : (ultimo < primero ? 'mejora' : ultimo > primero ? 'empeora' : 'estable'),
                    tecnicas: tecTop, rec: ultimaRec, nota: ultimaNota, ultimaFecha: ss[ss.length - 1].session_date,
                    tratamiento: tratActivo, disponibilidad: aMap[pid] || null
                });
            });
            var ordDisp = { red: 0, amber: 1, green: 2 };
            filas.sort(function(a, b) {
                var da = ordDisp[a.disponibilidad] !== undefined ? ordDisp[a.disponibilidad] : 1.5, db = ordDisp[b.disponibilidad] !== undefined ? ordDisp[b.disponibilidad] : 1.5;
                if (da !== db) return da - db;
                return (b.ultimo || 0) - (a.ultimo || 0);
            });
        }
        return filas;
}

function cmFisioInformeSemanaNav(delta) {
    var n = cmFisioEvo.idx + delta;
    if (n < 0 || n >= cmFisioEvo.partidos.length) return;
    cmFisioInformeSemana(n);
}

// Mini grafico de dolor (SVG inline)
function cmFisioEvoSpark(vals) {
    if (!vals || vals.length < 2) return '<span style="color:#475569;font-size:11px">' + (vals && vals.length === 1 ? vals[0] + '/10' : '—') + '</span>';
    var w = 90, h = 26, pad = 3;
    var pts = vals.map(function(v, i) {
        var x = pad + (w - pad * 2) * i / (vals.length - 1);
        var y = h - pad - (h - pad * 2) * (v / 10);
        return x.toFixed(1) + ',' + y.toFixed(1);
    });
    var color = vals[vals.length - 1] < vals[0] ? '#22c55e' : vals[vals.length - 1] > vals[0] ? '#ef4444' : '#f59e0b';
    var ult = pts[pts.length - 1].split(',');
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="vertical-align:middle"><polyline fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="' + pts.join(' ') + '"/><circle cx="' + ult[0] + '" cy="' + ult[1] + '" r="2.5" fill="' + color + '"/></svg>';
}

function cmFisioEvoRender() {
    var prev = document.getElementById('cmfisio-evo-overlay'); if (prev) prev.remove();
    var V = cmFisioEvo.ventana, par = cmFisioEvo.partido, filas = cmFisioEvo.filas;
    var titulo = par ? ('Semana del partido vs ' + (par.opponent || '') + ' · ' + (par.home_away === 'home' ? 'Local' : 'Visitante')) : 'Semana actual';
    var rango = 'Lunes ' + cmFisioEvoFmt(V.desde) + ' → ' + (par ? 'partido ' : '') + cmFisioEvoFmt(V.hasta);
    var recLab = { apto: ['Apto', '#22c55e'], limitado: ['Limitado', '#f59e0b'], no_disponible: ['No disponible', '#ef4444'] };
    var dispLab = { green: ['Disponible', '#22c55e'], amber: ['Duda', '#f59e0b'], red: ['Baja', '#ef4444'] };
    var tendLab = { mejora: ['▼ mejora', '#22c55e'], empeora: ['▲ empeora', '#ef4444'], estable: ['= estable', '#f59e0b'], na: ['—', '#64748b'] };

    // Resumen
    var totalSes = filas.reduce(function(a, f) { return a + f.n; }, 0);
    var mejoran = filas.filter(function(f) { return f.tendencia === 'mejora'; }).length;
    var empeoran = filas.filter(function(f) { return f.tendencia === 'empeora'; }).length;
    var noDisp = filas.filter(function(f) { return f.rec === 'no_disponible' || f.disponibilidad === 'red'; }).length;

    var stat = function(n, l, c) { return '<div style="flex:1;background:#1e293b;border-radius:10px;padding:10px 12px;text-align:center"><div style="font-size:22px;font-weight:800;color:' + (c || '#14b8a6') + '">' + n + '</div><div style="font-size:11px;color:#94a3b8">' + l + '</div></div>'; };

    var filasHtml = '';
    if (!filas.length) {
        filasHtml = '<div class="cmfisio-empty" style="padding:30px"><p>Sin sesiones de fisioterapia entre el ' + cmFisioEvoFmt(V.desde) + ' y el ' + cmFisioEvoFmt(V.hasta) + '.</p></div>';
    } else {
        filas.forEach(function(f) {
            var disp = dispLab[f.disponibilidad], rec = recLab[f.rec], ten = tendLab[f.tendencia];
            var borde = f.disponibilidad === 'red' ? '#ef4444' : f.disponibilidad === 'amber' ? '#f59e0b' : '#22c55e';
            var avatar = f.photo ? '<img src="' + f.photo + '" style="width:34px;height:34px;border-radius:50%;object-fit:cover">' : '<div style="width:34px;height:34px;border-radius:50%;background:#334155;color:#e2e8f0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px">' + (f.name || '?').charAt(0) + '</div>';
            var dias = f.sesiones.map(function(s) { return cmFisioEvoFmt(s.session_date).slice(0, 2); });
            filasHtml += '<div style="background:#0f172a;border-left:4px solid ' + borde + ';border-radius:0 10px 10px 0;padding:10px 14px;margin-bottom:8px;cursor:pointer" onclick="document.getElementById(\'cmfisio-evo-overlay\').remove();cmFisioAbrirFicha(\'' + f.playerId + '\',\'' + (f.name || '').replace(/'/g, "\\'") + '\',\'' + (f.photo || '') + '\')" title="Abrir ficha">'
                + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
                + avatar
                + '<div style="min-width:150px;flex:1"><div style="color:#e2e8f0;font-weight:700;font-size:14px">' + f.name + (f.pos ? ' <span style="color:#64748b;font-size:11px;font-weight:400">' + f.pos + '</span>' : '') + '</div>'
                + '<div style="color:#94a3b8;font-size:11px">' + (f.tratamiento ? f.tratamiento.title + ' · ' : '') + f.n + ' ses. (' + dias.join(', ') + ')</div></div>'
                + '<div style="display:flex;align-items:center;gap:8px;min-width:190px"><span style="color:#e2e8f0;font-size:13px;font-weight:700">' + (f.primero !== null ? f.primero : '–') + ' → ' + (f.ultimo !== null ? f.ultimo : '–') + '</span>' + cmFisioEvoSpark(f.dolores) + '<span style="font-size:11px;font-weight:700;color:' + ten[1] + '">' + ten[0] + '</span></div>'
                + '<div style="display:flex;gap:6px;align-items:center">'
                + (disp ? '<span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;background:' + disp[1] + '22;color:' + disp[1] + ';border:1px solid ' + disp[1] + '55">' + disp[0] + '</span>' : '')
                + (rec ? '<span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;background:' + rec[1] + '22;color:' + rec[1] + ';border:1px solid ' + rec[1] + '55" title="Ultima recomendacion al entrenador">Fisio: ' + rec[0] + '</span>' : '')
                + '</div></div>'
                + (f.tecnicas.length ? '<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">' + f.tecnicas.map(function(t) { return '<span style="font-size:10px;padding:2px 7px;border-radius:4px;background:#134e4a;color:#5eead4">' + t + '</span>'; }).join('') + '</div>' : '')
                + (f.nota ? '<div style="margin-top:6px;font-size:12px;color:#cbd5e1;background:#1e293b;border-radius:6px;padding:6px 10px"><span style="color:#64748b;font-size:10px;font-weight:700;letter-spacing:.5px">NOTA PARA EL ENTRENADOR</span><br>' + f.nota + '</div>' : '')
                + '</div>';
        });
    }

    var ov = document.createElement('div');
    ov.className = 'cmfisio-report-overlay'; ov.id = 'cmfisio-evo-overlay';
    ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
    ov.innerHTML = '<div class="cmfisio-report-modal" style="max-width:860px;width:100%;max-height:90vh;overflow-y:auto">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">'
        + '<div><h3 style="margin:0;color:#e2e8f0;font-size:17px">📈 Evolución de la semana</h3><div style="color:#94a3b8;font-size:12px">' + titulo + ' · ' + rango + '</div></div>'
        + '<div style="display:flex;gap:6px;align-items:center">'
        + '<button class="cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm" onclick="cmFisioInformeSemanaNav(-1)" title="Partido anterior">←</button>'
        + '<button class="cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm" onclick="cmFisioInformeSemanaNav(1)" title="Partido siguiente">→</button>'
        + '<button class="cmfisio-btn cmfisio-btn-primary cmfisio-btn-sm" onclick="cmFisioEvoPDF()">📄 PDF</button>'
        + '<button class="cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm" onclick="document.getElementById(\'cmfisio-evo-overlay\').remove()">✕</button>'
        + '</div></div>'
        + '<div style="display:flex;gap:8px;margin:12px 0 14px">' + stat(filas.length, 'Jugadores tratados') + stat(totalSes, 'Sesiones') + stat(mejoran, 'Mejoran', '#22c55e') + stat(empeoran, 'Empeoran', '#ef4444') + stat(noDisp, 'No disponibles', '#ef4444') + '</div>'
        + filasHtml
        + '<div style="font-size:10px;color:#64748b;margin-top:8px">Dolor: primera → última sesión de la semana (0–10). Clic en un jugador para abrir su ficha completa.</div>'
        + '</div>';
    document.body.appendChild(ov);
}

// ---------- PDF ----------
function cmFisioEvoPDF() {
    var V = cmFisioEvo.ventana, par = cmFisioEvo.partido, filas = cmFisioEvo.filas;
    if (!V) return;
    var doc = new jspdf.jsPDF('p', 'mm', 'a4');
    var W = 210, MG = 14, CW = W - MG * 2, y = 0;
    var club = (typeof clubData !== 'undefined' && clubData && clubData.name) || 'Club';
    var recLab = { apto: 'Apto', limitado: 'Limitado', no_disponible: 'No disponible' };
    var dispLab = { green: 'Disponible', amber: 'Duda', red: 'Baja' };
    var tendLab = { mejora: 'Mejora', empeora: 'Empeora', estable: 'Estable', na: '-' };
    var col = { dark: [15, 23, 42], teal: [20, 184, 166], gray: [100, 116, 139], ink: [30, 41, 59], green: [34, 197, 94], amber: [245, 158, 11], red: [239, 68, 68], light: [241, 245, 249] };
    function F(c) { doc.setFillColor(c[0], c[1], c[2]); } function T(c) { doc.setTextColor(c[0], c[1], c[2]); }
    function header() {
        F(col.dark); doc.rect(0, 0, W, 16, 'F'); F(col.teal); doc.rect(0, 16, W, 1, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); T([255, 255, 255]); doc.text(club.toUpperCase() + ' · FISIOTERAPIA', MG, 10);
        doc.setFontSize(8); T(col.teal); doc.text('EVOLUCIÓN DE LA SEMANA', W - MG, 10, { align: 'right' });
        y = 26;
    }
    function checkSpace(n) { if (y + n > 282) { doc.addPage(); header(); } }
    header();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); T(col.dark);
    doc.text(par ? 'Semana del partido vs ' + (par.opponent || '') : 'Semana actual', MG, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); T(col.gray);
    doc.text('Del lunes ' + cmFisioEvoFmt(V.desde) + ' al ' + (par ? 'partido del ' : '') + cmFisioEvoFmt(V.hasta) + (par && par.home_away ? ' · ' + (par.home_away === 'home' ? 'Local' : 'Visitante') : '') + ' · Generado el ' + new Date().toLocaleDateString('es-ES'), MG, y); y += 8;

    var totalSes = filas.reduce(function(a, f) { return a + f.n; }, 0);
    var noDisp = filas.filter(function(f) { return f.rec === 'no_disponible' || f.disponibilidad === 'red'; }).length;
    var stats = [[String(filas.length), 'Jugadores tratados'], [String(totalSes), 'Sesiones'], [String(filas.filter(function(f) { return f.tendencia === 'mejora'; }).length), 'Mejoran'], [String(noDisp), 'No disponibles']];
    var sw = (CW - 9) / 4;
    stats.forEach(function(s, i) { var x = MG + i * (sw + 3); F(col.light); doc.roundedRect(x, y, sw, 16, 2, 2, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); T(col.teal); doc.text(s[0], x + sw / 2, y + 8, { align: 'center' }); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); T(col.gray); doc.text(s[1], x + sw / 2, y + 13, { align: 'center' }); });
    y += 22;

    if (!filas.length) { doc.setFontSize(10); T(col.gray); doc.text('Sin sesiones registradas en esta semana.', MG, y); }
    filas.forEach(function(f) {
        var notaLines = f.nota ? doc.splitTextToSize(f.nota, CW - 8) : [];
        var alto = 16 + (f.tecnicas.length ? 5 : 0) + (notaLines.length ? notaLines.length * 4 + 5 : 0);
        checkSpace(alto + 4);
        var c = f.disponibilidad === 'red' ? col.red : f.disponibilidad === 'amber' ? col.amber : col.green;
        F(col.light); doc.roundedRect(MG, y, CW, alto, 2, 2, 'F'); F(c); doc.rect(MG, y, 2, alto, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); T(col.dark); doc.text(f.name + (f.pos ? '  ·  ' + f.pos : ''), MG + 5, y + 6);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); T(col.gray);
        doc.text((f.tratamiento ? f.tratamiento.title + '  ·  ' : '') + f.n + ' sesiones (' + f.sesiones.map(function(s) { return cmFisioEvoFmt(s.session_date); }).join(', ') + ')', MG + 5, y + 11);
        // Dolor y estado a la derecha
        var tc = f.tendencia === 'mejora' ? col.green : f.tendencia === 'empeora' ? col.red : col.amber;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); T(col.ink);
        doc.text('Dolor ' + (f.primero !== null ? f.primero : '-') + ' → ' + (f.ultimo !== null ? f.ultimo : '-'), MG + CW - 4, y + 6, { align: 'right' });
        doc.setFontSize(8); T(tc); doc.text(tendLab[f.tendencia] + (f.disponibilidad ? '  ·  ' + dispLab[f.disponibilidad] : '') + (f.rec ? '  ·  Fisio: ' + recLab[f.rec] : ''), MG + CW - 4, y + 11, { align: 'right' });
        var yy = y + 16;
        if (f.tecnicas.length) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); T(col.teal); doc.text('Técnicas: ' + f.tecnicas.join(', '), MG + 5, yy); yy += 5; }
        if (notaLines.length) { doc.setFont('helvetica', 'bold'); doc.setFontSize(7); T(col.gray); doc.text('NOTA PARA EL ENTRENADOR', MG + 5, yy); yy += 4; doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); T(col.ink); notaLines.forEach(function(l) { doc.text(l, MG + 5, yy); yy += 4; }); }
        y += alto + 4;
    });
    var nom = 'Fisio_semana_' + (par ? (par.opponent || 'partido').replace(/[^a-z0-9]/gi, '_') : V.desde) + '.pdf';
    doc.save(nom);
}
