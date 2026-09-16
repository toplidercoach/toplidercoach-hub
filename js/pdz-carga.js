// ========== PDZ-CARGA.JS - TopLiderCoach HUB ==========
// Panel de carga del microciclo dentro de Periodizacion.
// Carga INTERNA: sRPE = RPE x minutos (sesiones: asistencia_sesiones; partidos: asistencia_partidos o match_player_stats).
// Carga EXTERNA: GPS de Preparacion Fisica (cm_pf_gps_sessions + cm_pf_gps_player_data). Si no hay GPS, solo se muestra la interna.
// Entrega 1: matriz jugador x dia con la metrica elegida, total del periodo y % respecto al partido del jugador.
// Se pinta en #pdz-carga-periodo (lo crea periodizacion.js) al abrir el detalle de un periodo.

var pdzCg = { periodo: null, datos: null, metrica: 'srpe' };

var PDZ_CG_METRICAS = {
    srpe:   { label: 'sRPE (UA)',        tipo: 'interna', color: '#f59e0b', dec: 0 },
    td:     { label: 'Distancia (m)',    tipo: 'externa', color: '#3b82f6', dec: 0 },
    hsr:    { label: 'HSR (m)',          tipo: 'externa', color: '#06b6d4', dec: 0 },
    sprint: { label: 'Sprint (m)',       tipo: 'externa', color: '#a855f7', dec: 0 },
    accdec: { label: 'Acel + Desacel',   tipo: 'externa', color: '#ec4899', dec: 0 },
    pl:     { label: 'Player Load',      tipo: 'externa', color: '#10b981', dec: 0 }
};

function pdzCgISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function pdzCgDias(desde, hasta) {
    var out = [];
    var d = new Date(desde + 'T12:00:00');
    var fin = new Date(hasta + 'T12:00:00');
    while (d <= fin) { out.push(pdzCgISO(d)); d.setDate(d.getDate() + 1); }
    return out;
}

// ---------- Carga de datos ----------
async function pdzCargaMicro(periodo) {
    var cont = document.getElementById('pdz-carga-periodo');
    if (!cont || !periodo) return;
    pdzCg.periodo = periodo;
    pdzCg.datos = null;

    var dias = pdzCgDias(periodo.date_start, periodo.date_end);
    if (dias.length > 21) {
        cont.innerHTML = '<div style="padding:10px 14px;background:#1e293b;border-radius:8px;font-size:12px;color:#94a3b8">La carga jugador a jugador se muestra en periodos de hasta 21 dias (microciclos). Abre un microciclo para verla.</div>';
        return;
    }

    cont.innerHTML = '<div style="color:#64748b;font-size:12px">Calculando carga del periodo...</div>';

    try {
        // 1. Plantilla de la temporada
        var idTemporada = (typeof seasonId !== 'undefined' && seasonId) ? seasonId : null;
        if (!idTemporada) {
            var { data: temp } = await supabaseClient.from('seasons').select('id').eq('club_id', clubId).eq('is_active', true).single();
            idTemporada = temp ? temp.id : null;
        }
        var { data: plantilla, error: errPl } = await supabaseClient
            .from('season_players')
            .select('player_id, players(id, name)')
            .eq('season_id', idTemporada);
        if (errPl) console.error('Plantilla carga micro:', errPl);
        var jugadores = (plantilla || []).filter(function(sp) { return sp.players; }).map(function(sp) {
            return { id: sp.player_id, nombre: sp.players.name, dorsal: '', pos: '' };
        }).sort(function(a, b) { return (a.nombre || '').localeCompare(b.nombre || '', 'es'); });

        // 2. Sesiones y RPE de jugadores
        var { data: sesiones } = await supabaseClient
            .from('training_sessions')
            .select('id, session_date, duration_minutes, warm_up, main_part, cool_down, pre_field_work, post_field_work')
            .eq('club_id', clubId)
            .gte('session_date', periodo.date_start)
            .lte('session_date', periodo.date_end);
        sesiones = sesiones || [];
        var sesMap = {};
        sesiones.forEach(function(s) { sesMap[s.id] = s; });

        var asisSes = [];
        if (sesiones.length > 0) {
            var { data: a1 } = await supabaseClient
                .from('asistencia_sesiones')
                .select('sesion_id, jugador_id, asistio, rpe, duracion_real')
                .in('sesion_id', sesiones.map(function(s) { return s.id; }));
            asisSes = a1 || [];
        }

        // 3. Partidos y RPE de partido (jugador > staff)
        var { data: partidos } = await supabaseClient
            .from('matches')
            .select('id, match_date, opponent')
            .eq('club_id', clubId)
            .gte('match_date', periodo.date_start)
            .lte('match_date', periodo.date_end);
        partidos = partidos || [];
        var parMap = {};
        partidos.forEach(function(p) { parMap[p.id] = p; });

        var asisPar = [], mps = [];
        if (partidos.length > 0) {
            var idsP = partidos.map(function(p) { return p.id; });
            var { data: a2 } = await supabaseClient
                .from('asistencia_partidos')
                .select('partido_id, jugador_id, rpe, duracion_real')
                .in('partido_id', idsP);
            asisPar = a2 || [];
            var { data: a3 } = await supabaseClient
                .from('match_player_stats')
                .select('match_id, player_id, minutes_played, rpe')
                .in('match_id', idsP);
            mps = a3 || [];
        }

        // 4. GPS (Preparacion Fisica). Si las tablas no existen o no hay datos, hayGps = false
        var gpsSes = [], gpsRows = [];
        try {
            var { data: g1, error: eG1 } = await supabaseClient
                .from('cm_pf_gps_sessions')
                .select('id, session_date, session_type, opponent')
                .eq('club_id', clubId)
                .gte('session_date', periodo.date_start)
                .lte('session_date', periodo.date_end)
                .or('archived.is.null,archived.eq.false');
            if (!eG1 && g1 && g1.length > 0) {
                gpsSes = g1;
                var { data: g2 } = await supabaseClient
                    .from('cm_pf_gps_player_data')
                    .select('session_id, player_id, segment_name, total_distance_m, hsr_distance_m, sprint_distance_m, accel_count, decel_count, player_load')
                    .in('session_id', gpsSes.map(function(s) { return s.id; }))
                    .or('archived.is.null,archived.eq.false');
                gpsRows = g2 || [];
            }
        } catch (eGps) { console.warn('GPS no disponible:', eGps); }

        // Puente club_players (Club Mode) -> players (HUB): por legacy_player_id y, si no, por nombre
        if (gpsRows.length > 0) {
            var { data: cps } = await supabaseClient.from('club_players').select('id, name, legacy_player_id').eq('club_id', clubId);
            var idsPlantilla = {}, porNombre = {};
            jugadores.forEach(function(j) { idsPlantilla[j.id] = true; porNombre[pdzCgNorm(j.nombre)] = j.id; });
            var puente = {};
            (cps || []).forEach(function(cp) {
                if (cp.legacy_player_id && idsPlantilla[cp.legacy_player_id]) puente[cp.id] = cp.legacy_player_id;
                else if (porNombre[pdzCgNorm(cp.name)]) puente[cp.id] = porNombre[pdzCgNorm(cp.name)];
            });
            gpsRows.forEach(function(r) { if (!idsPlantilla[r.player_id] && puente[r.player_id]) r.player_id = puente[r.player_id]; });
        }

        // ---------- Calculo por jugador y dia ----------
        var fechasPartido = {};
        partidos.forEach(function(p) { fechasPartido[p.match_date] = p.opponent || 'Partido'; });
        var gpsSesMap = {};
        gpsSes.forEach(function(s) { gpsSesMap[s.id] = s; });

        // Estructura: datos[jugadorId][fecha] = { srpe, td, hsr, sprint, accdec, pl, gpsReal }
        var datos = {};
        function celda(jid, fecha) {
            if (!datos[jid]) datos[jid] = {};
            if (!datos[jid][fecha]) datos[jid][fecha] = { srpe: 0, td: 0, hsr: 0, sprint: 0, accdec: 0, pl: 0, gpsReal: false, rpe: null };
            return datos[jid][fecha];
        }

        // Interna: sesiones
        asisSes.forEach(function(a) {
            var s = sesMap[a.sesion_id];
            if (!s || a.asistio === false || a.rpe === null || a.rpe === undefined) return;
            var min = a.duracion_real || (typeof pdzDuracionSesion === 'function' ? pdzDuracionSesion(s) : (s.duration_minutes || 0));
            var c = celda(a.jugador_id, s.session_date);
            c.srpe += a.rpe * min;
            c.rpe = a.rpe;
        });

        // Interna: partidos. Minutos: match_player_stats > duracion_real > 90. RPE: jugador > staff
        var mpsMap = {};
        mps.forEach(function(m) { mpsMap[m.match_id + '|' + m.player_id] = m; });
        var vistos = {};
        asisPar.forEach(function(a) {
            var p = parMap[a.partido_id]; if (!p) return;
            var st = mpsMap[a.partido_id + '|' + a.jugador_id] || {};
            var rpe = (a.rpe !== null && a.rpe !== undefined) ? a.rpe : st.rpe;
            if (rpe === null || rpe === undefined) return;
            var min = st.minutes_played || a.duracion_real || 90;
            var c = celda(a.jugador_id, p.match_date);
            c.srpe += rpe * min; c.rpe = rpe;
            vistos[a.partido_id + '|' + a.jugador_id] = true;
        });
        mps.forEach(function(m) {
            var p = parMap[m.match_id]; if (!p || vistos[m.match_id + '|' + m.player_id]) return;
            if (m.rpe === null || m.rpe === undefined) return;
            var min = m.minutes_played || 90;
            var c = celda(m.player_id, p.match_date);
            c.srpe += m.rpe * min; c.rpe = m.rpe;
        });

        // Externa: GPS. Si hay filas con segmento y una fila total (sin segmento), se usa la total.
        var porSesJug = {};
        gpsRows.forEach(function(r) {
            var k = r.session_id + '|' + r.player_id;
            if (!porSesJug[k]) porSesJug[k] = { total: null, segs: [] };
                if (!r.segment_name || String(r.segment_name).trim().toUpperCase() === 'TOTAL') porSesJug[k].total = r; else porSesJug[k].segs.push(r);
        });
        Object.keys(porSesJug).forEach(function(k) {
            var partes = k.split('|');
            var s = gpsSesMap[partes[0]]; if (!s) return;
            var filas = porSesJug[k].total ? [porSesJug[k].total] : porSesJug[k].segs;
            var c = celda(partes[1], s.session_date);
            filas.forEach(function(r) {
                c.td += r.total_distance_m || 0;
                c.hsr += r.hsr_distance_m || 0;
                c.sprint += r.sprint_distance_m || 0;
                c.accdec += (r.accel_count || 0) + (r.decel_count || 0);
                c.pl += parseFloat(r.player_load) || 0;
            });
            c.gpsReal = true;
        });

        pdzCg.datos = { dias: dias, jugadores: jugadores, datos: datos, fechasPartido: fechasPartido, hayGps: gpsRows.length > 0 };
        pdzCgRender();
    } catch (err) {
        console.error('Error carga micro:', err);
        cont.innerHTML = '<div style="color:#ef4444;font-size:12px">Error al calcular la carga: ' + err.message + '</div>';
    }
}

function pdzCgCambiarMetrica(m) { pdzCg.metrica = m; pdzCgRender(); }

// ---------- Render ----------
function pdzCgRender() {
    var cont = document.getElementById('pdz-carga-periodo');
    var D = pdzCg.datos;
    if (!cont || !D) return;

    if (!D.hayGps && PDZ_CG_METRICAS[pdzCg.metrica].tipo === 'externa') pdzCg.metrica = 'srpe';
    var m = pdzCg.metrica;
    var conf = PDZ_CG_METRICAS[m];

    // Referencia de partido por jugador (para el %): valor de la metrica en el/los dia(s) de partido
    var refPartido = {};
    D.jugadores.forEach(function(j) {
        var vals = [];
        D.dias.forEach(function(f) {
            if (!D.fechasPartido[f]) return;
            var c = (D.datos[j.id] || {})[f];
            if (c && c[m] > 0) vals.push(c[m]);
        });
        if (vals.length > 0) refPartido[j.id] = vals.reduce(function(a, b) { return a + b; }, 0) / vals.length;
    });

    // Selector de metrica
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">';
    html += '<div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Carga por jugador y dia</div>';
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap">';
    Object.keys(PDZ_CG_METRICAS).forEach(function(k) {
        var c = PDZ_CG_METRICAS[k];
        if (c.tipo === 'externa' && !D.hayGps) return;
        var activo = (k === m);
        html += '<button onclick="pdzCgCambiarMetrica(\'' + k + '\')" style="padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;border:1px solid ' + (activo ? c.color : '#334155') + ';background:' + (activo ? c.color : '#1e293b') + ';color:' + (activo ? '#0f172a' : '#94a3b8') + ';font-weight:' + (activo ? '700' : '400') + '">' + c.label + '</button>';
    });
    html += '</div></div>';

    if (!D.hayGps) {
        html += '<div style="padding:8px 12px;background:#1e293b;border-radius:8px;margin-bottom:10px;font-size:11px;color:#94a3b8;border-left:3px solid #475569">Sin datos GPS en este periodo: se muestra solo la carga interna (RPE x minutos). Los datos GPS se cargan en Preparacion Fisica.</div>';
    }

    // Tabla
    var maxVal = 0;
    D.jugadores.forEach(function(j) {
        D.dias.forEach(function(f) { var c = (D.datos[j.id] || {})[f]; if (c && c[m] > maxVal) maxVal = c[m]; });
    });
    if (maxVal === 0) maxVal = 1;

    html += '<div style="overflow-x:auto;border:1px solid #1e3a5f;border-radius:8px"><table style="border-collapse:collapse;width:100%;min-width:' + (220 + D.dias.length * 62) + 'px;font-size:12px">';
    html += '<thead><tr style="background:#1e293b">';
    html += '<th style="text-align:left;padding:8px 10px;color:#94a3b8;font-weight:600;position:sticky;left:0;background:#1e293b">Jugador</th>';
    D.dias.forEach(function(f) {
        var d = new Date(f + 'T12:00:00');
        var diaSem = ['DOM','LUN','MAR','MIE','JUE','VIE','SAB'][d.getDay()];
        var esPartido = !!D.fechasPartido[f];
        html += '<th style="padding:6px 4px;text-align:center;color:' + (esPartido ? '#fbbf24' : '#94a3b8') + ';font-weight:600" title="' + (esPartido ? 'Partido vs ' + D.fechasPartido[f] : '') + '">' + (esPartido ? '⚽ ' : '') + diaSem + '<div style="font-size:10px;color:#64748b;font-weight:400">' + d.getDate() + '/' + (d.getMonth() + 1) + '</div></th>';
    });
    html += '<th style="padding:6px 8px;text-align:center;color:#e2e8f0;font-weight:700">Total</th>';
    html += '</tr></thead><tbody>';

    var totalesDia = {}, cuentaDia = {};
    D.jugadores.forEach(function(j) {
        var fila = D.datos[j.id] || {};
        var total = 0, diasConDato = 0;
        html += '<tr style="border-top:1px solid #1e293b">';
        html += '<td style="padding:6px 10px;color:#e2e8f0;white-space:nowrap;position:sticky;left:0;background:#0f172a"><span style="color:#64748b;font-size:11px;min-width:22px;display:inline-block">' + (j.dorsal || '') + '</span>' + j.nombre + '</td>';
        D.dias.forEach(function(f) {
            var c = fila[f];
            var v = c ? c[m] : 0;
            if (v > 0) {
                total += v; diasConDato++;
                totalesDia[f] = (totalesDia[f] || 0) + v; cuentaDia[f] = (cuentaDia[f] || 0) + 1;
            }
            var intensidad = v > 0 ? Math.max(0.12, v / maxVal) : 0;
            var pct = '';
            if (v > 0 && refPartido[j.id] && !D.fechasPartido[f]) pct = '<div style="font-size:9px;color:#94a3b8">' + Math.round(v / refPartido[j.id] * 100) + '%</div>';
            var titulo = c && conf.tipo === 'interna' && c.rpe !== null ? 'RPE ' + c.rpe : '';
            html += '<td style="padding:5px 4px;text-align:center;color:' + (v > 0 ? '#e2e8f0' : '#334155') + ';background:' + (v > 0 ? pdzCgHex(conf.color, intensidad) : 'transparent') + '" title="' + titulo + '">' + (v > 0 ? pdzCgFmt(v, conf.dec) : '—') + pct + '</td>';
        });
        html += '<td style="padding:5px 8px;text-align:center;color:#e2e8f0;font-weight:700">' + (total > 0 ? pdzCgFmt(total, conf.dec) : '—') + (diasConDato > 0 ? '<div style="font-size:9px;color:#64748b;font-weight:400">' + diasConDato + ' d</div>' : '') + '</td>';
        html += '</tr>';
    });

    // Media del equipo
    html += '<tr style="border-top:2px solid #334155;background:#1e293b">';
    html += '<td style="padding:6px 10px;color:#94a3b8;font-weight:600;position:sticky;left:0;background:#1e293b">Media equipo</td>';
    var totalMedia = 0;
    D.dias.forEach(function(f) {
        var media = cuentaDia[f] ? totalesDia[f] / cuentaDia[f] : 0;
        totalMedia += media;
        html += '<td style="padding:5px 4px;text-align:center;color:' + (media > 0 ? '#e2e8f0' : '#334155') + ';font-weight:600">' + (media > 0 ? pdzCgFmt(media, conf.dec) : '—') + (cuentaDia[f] ? '<div style="font-size:9px;color:#64748b;font-weight:400">' + cuentaDia[f] + ' jug</div>' : '') + '</td>';
    });
    html += '<td style="padding:5px 8px;text-align:center;color:#e2e8f0;font-weight:700">' + (totalMedia > 0 ? pdzCgFmt(totalMedia, conf.dec) : '—') + '</td>';
    html += '</tr></tbody></table></div>';

    html += '<div style="font-size:10px;color:#64748b;margin-top:6px">' + (conf.tipo === 'interna'
        ? 'sRPE = RPE del jugador x minutos (sesion: duracion real; partido: minutos jugados). Pasa el raton por una celda para ver el RPE.'
        : 'Datos GPS de Preparacion Fisica. Solo aparecen los jugadores que llevaron dispositivo.')
        + ' El % es respecto a la media del partido del propio jugador en este periodo.</div>';

    cont.innerHTML = html;
}

function pdzCgNorm(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function pdzCgFmt(v, dec) {
    var n = Number(v).toFixed(dec);
    return n.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Color hex + intensidad (0-1) -> rgba
function pdzCgHex(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha * 0.55).toFixed(2) + ')';
}
