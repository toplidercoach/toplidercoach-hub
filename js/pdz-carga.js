// ========== PDZ-CARGA.JS - TopLiderCoach HUB ==========
// Panel de carga del microciclo dentro de Periodizacion.
// Carga INTERNA: sRPE = RPE x minutos (sesiones: asistencia_sesiones; partidos: asistencia_partidos o match_player_stats).
// Carga EXTERNA: GPS de Preparacion Fisica (cm_pf_gps_sessions + cm_pf_gps_player_data). Si no hay GPS, solo se muestra la interna.
// Entrega 1: matriz jugador x dia con la metrica elegida, total del periodo y % respecto al partido del jugador.
// Entrega 2: referencia de equipo para el % (partido completo >= 60 min) y perfiles gemelos (tabla pdz_gemelos).
// Entrega 3: % contra el perfil de partido a 90' (vista cm_pf_perfil_partido), etiqueta MD por dia, bandas por dia
//            (cm_pf_gps_config.md_bands) con semaforo por celda / equipo y acumulado SEMANA (MD-4..MD-1).
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
        var cps = [];
        var puente = {};
        var idsPlantilla = {}, porNombre = {};
        jugadores.forEach(function(j) { idsPlantilla[j.id] = true; porNombre[pdzCgNorm(j.nombre)] = j.id; });
        try {
            var { data: cpsData } = await supabaseClient.from('club_players').select('id, name, legacy_player_id, positions_main, position_detail').eq('club_id', clubId);
            cps = cpsData || [];
            cps.forEach(function(cp) {
                var hubId = null;
                if (cp.legacy_player_id && idsPlantilla[cp.legacy_player_id]) hubId = cp.legacy_player_id;
                else if (porNombre[pdzCgNorm(cp.name)]) hubId = porNombre[pdzCgNorm(cp.name)];
                if (hubId) {
                    puente[cp.id] = hubId;
                    var j = jugadores.find(function(x) { return x.id === hubId; });
                    if (j) j.pos = cp.position_detail || (Array.isArray(cp.positions_main) ? cp.positions_main[0] : '') || '';
                }
            });
        } catch (eCp) { console.warn('club_players no disponible:', eCp); }
        if (gpsRows.length > 0) {
            gpsRows.forEach(function(r) { if (!idsPlantilla[r.player_id] && puente[r.player_id]) r.player_id = puente[r.player_id]; });
        }

        // Entrega 3: perfil de rendimiento en partido (proyectado a 90') y bandas MD de la config
        var perfil = {}, perfilEquipo = null, bandas = null, tolerancia = 10, minRec = 45;
        try {
            var { data: pf } = await supabaseClient.from('cm_pf_perfil_partido').select('player_id, n_partidos, n_reales, pct_real, total_distance_90, hsr_90, sprint_90, accel_90, decel_90, player_load_90').eq('club_id', clubId);
            var acc = { td: [], hsr: [], sprint: [], accdec: [], pl: [] };
            (pf || []).forEach(function(p) {
                var hubId = idsPlantilla[p.player_id] ? p.player_id : puente[p.player_id];
                if (!hubId) return;
                var fila = {
                    td: parseFloat(p.total_distance_90) || 0,
                    hsr: parseFloat(p.hsr_90) || 0,
                    sprint: parseFloat(p.sprint_90) || 0,
                    accdec: (parseFloat(p.accel_90) || 0) + (parseFloat(p.decel_90) || 0),
                    pl: parseFloat(p.player_load_90) || 0,
                    n: p.n_partidos, nReales: p.n_reales, pctReal: parseFloat(p.pct_real) || 0
                };
                perfil[hubId] = fila;
                Object.keys(acc).forEach(function(k) { if (fila[k] > 0) acc[k].push(fila[k]); });
            });
            perfilEquipo = {};
            Object.keys(acc).forEach(function(k) { perfilEquipo[k] = acc[k].length ? acc[k].reduce(function(a, b) { return a + b; }, 0) / acc[k].length : 0; });
        } catch (ePf) { console.warn('Perfil de partido no disponible:', ePf); }
        try {
            var { data: cfg } = await supabaseClient.from('cm_pf_gps_config').select('md_bands, md_tolerancia, md_min_recuperacion').eq('club_id', clubId).maybeSingle();
            if (cfg && cfg.md_bands) { bandas = cfg.md_bands; tolerancia = cfg.md_tolerancia || 10; minRec = cfg.md_min_recuperacion || 45; }
        } catch (eCfg) { console.warn('Config GPS no disponible:', eCfg); }

        // Etiqueta MD de cada dia: MD (partido), MD+1 (dia despues), MD-n (dias antes del siguiente partido)
        var fechasMatch = partidos.map(function(p) { return p.match_date; });
        var fechaPrevia = null;
        var minPartido = {};
        try {
            var { data: ant } = await supabaseClient.from('matches').select('id, match_date').eq('club_id', clubId).lt('match_date', periodo.date_start).order('match_date', { ascending: false }).limit(1);
            if (ant && ant.length) {
                fechaPrevia = ant[0].match_date;
                fechasMatch.push(fechaPrevia);
                var { data: mpsAnt } = await supabaseClient.from('match_player_stats').select('player_id, minutes_played').eq('match_id', ant[0].id);
                (mpsAnt || []).forEach(function(x) { if (x.minutes_played !== null && x.minutes_played !== undefined) { if (!minPartido[x.player_id]) minPartido[x.player_id] = {}; minPartido[x.player_id][fechaPrevia] = x.minutes_played; } });
            }
        } catch (eAnt) {}
        try {
            var { data: sig } = await supabaseClient.from('matches').select('match_date').eq('club_id', clubId).gt('match_date', periodo.date_end).order('match_date', { ascending: true }).limit(1);
            if (sig && sig.length) fechasMatch.push(sig[0].match_date);
        } catch (eSig) {}
        fechasMatch.sort();
        var mdLabel = {};
        dias.forEach(function(f) {
            var t = new Date(f + 'T12:00:00').getTime();
            var prev = null, next = null;
            fechasMatch.forEach(function(fm) {
                var tm = new Date(fm + 'T12:00:00').getTime();
                if (tm === t) { prev = 0; next = 0; }
                else if (tm < t && (prev === null || t - tm < prev)) prev = t - tm;
                else if (tm > t && (next === null || tm - t < next)) next = tm - t;
            });
            var dPrev = prev === null ? null : Math.round(prev / 864e5);
            var dNext = next === null ? null : Math.round(next / 864e5);
            if (dPrev === 0) mdLabel[f] = 'MD';
            else if (dPrev === 1) mdLabel[f] = 'MD+1';
            else if (dPrev === 2) mdLabel[f] = 'MD+2';
            else if (dNext !== null && dNext <= 6) mdLabel[f] = 'MD-' + dNext;
            else if (dPrev !== null && dPrev <= 3) mdLabel[f] = 'MD+' + dPrev;
            else mdLabel[f] = '';
        });

        // Gemelos configurados (jugador sin GPS -> jugador con GPS del que estimar)
        var gemelos = {};
        try {
            var { data: gm } = await supabaseClient.from('pdz_gemelos').select('player_id, gemelo_id').eq('club_id', clubId);
            (gm || []).forEach(function(g) { gemelos[g.player_id] = g.gemelo_id; });
        } catch (eGm) { console.warn('pdz_gemelos no disponible:', eGm); }

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
        mps.forEach(function(m) {
            mpsMap[m.match_id + '|' + m.player_id] = m;
            var p = parMap[m.match_id];
            if (p && m.minutes_played) { if (!minPartido[m.player_id]) minPartido[m.player_id] = {}; minPartido[m.player_id][p.match_date] = m.minutes_played; }
        });
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

        pdzCg.datos = { dias: dias, jugadores: jugadores, datos: datos, fechasPartido: fechasPartido, hayGps: gpsRows.length > 0, minPartido: minPartido, gemelos: gemelos, perfil: perfil, perfilEquipo: perfilEquipo, bandas: bandas, tolerancia: tolerancia, minRec: minRec, mdLabel: mdLabel, fechaPrevia: fechaPrevia };
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
    var esExterna = conf.tipo === 'externa';
    var MIN_PARTIDO_COMPLETO = 60;
    var hayPerfil = esExterna && D.perfilEquipo && D.perfilEquipo[m] > 0;
    var bandas = D.bandas || null;
    var tol = D.tolerancia || 10;

    // ---- Valor de una celda, con estimacion por gemelo si el jugador no tiene GPS ese dia ----
    function valor(jid, f) {
        var c = (D.datos[jid] || {})[f];
        if (c && c[m] > 0) return { v: c[m], est: false, rpe: c.rpe };
        if (esExterna && D.gemelos[jid]) {
            var g = (D.datos[D.gemelos[jid]] || {})[f];
            if (g && g[m] > 0) return { v: g[m], est: true, rpe: null };
        }
        return { v: 0, est: false, rpe: null };
    }

    // ---- Referencia de partido ----
    // Externa: perfil de rendimiento en partido proyectado a 90' (Preparacion Fisica > Perfil partido).
    //          Si el jugador no tiene perfil, media del equipo (en morado con ≈).
    // Interna (sRPE): media de sus partidos con >= 60 min; si no, media del equipo.
    var refPropia = {}, refEquipo = 0, refPerfilSolido = {};
    if (hayPerfil) {
        D.jugadores.forEach(function(j) {
            var p = D.perfil[j.id];
            if (p && p[m] > 0) { refPropia[j.id] = p[m]; refPerfilSolido[j.id] = (p.nReales >= 2 || p.pctReal >= 60); }
        });
        refEquipo = D.perfilEquipo[m];
    } else {
        var refEquipoVals = [];
        D.jugadores.forEach(function(j) {
            var vals = [];
            D.dias.forEach(function(f) {
                if (!D.fechasPartido[f]) return;
                var c = (D.datos[j.id] || {})[f];
                if (!c || !(c[m] > 0)) return;
                var min = (D.minPartido[j.id] || {})[f];
                var completo = (min === undefined) ? true : min >= MIN_PARTIDO_COMPLETO;
                if (completo) { vals.push(c[m]); refEquipoVals.push(c[m]); }
            });
            if (vals.length > 0) refPropia[j.id] = vals.reduce(function(a, b) { return a + b; }, 0) / vals.length;
        });
        refEquipo = refEquipoVals.length > 0 ? refEquipoVals.reduce(function(a, b) { return a + b; }, 0) / refEquipoVals.length : 0;
    }

    // ---- Banda y semaforo ----
    // Devuelve la banda [min,max] para un dia y jugador (MD+1: recuperacion si jugo >= 60', compensatorio si no)
    function bandaDe(f, jid) {
        if (!bandas || !esExterna) return null;
        var lab = D.mdLabel[f] || '';
        if (!lab || lab === 'MD') return null;
        if (f === diaPost) {
            if (!jid) return null;
            var gp = grupoPost(jid, f);
            if (gp === 'R') return bandas['MD+1'] ? (bandas['MD+1'][m] || null) : null;
            if (gp === 'C') return bandas['MD+1C'] ? (bandas['MD+1C'][m] || null) : null;
            return null;
        }
        if (lab === 'MD+1' || lab === 'MD+2') return null;
        var b = bandas[lab];
        return b ? (b[m] || null) : null;
    }
    // 'ok' | 'ambar' | 'rojo' | null
    function semaforo(pct, banda) {
        if (!banda || pct === null) return null;
        if (pct >= banda[0] && pct <= banda[1]) return 'ok';
        if (pct >= banda[0] - tol && pct <= banda[1] + tol) return 'ambar';
        return 'rojo';
    }
    var SEM_COLOR = { ok: '#22c55e', ambar: '#f59e0b', rojo: '#ef4444' };
    // Dia post-partido: primera fecha con etiqueta MD+1/MD+2 y algun dato real de la metrica
    var diaPost = null;
    D.dias.forEach(function(f) {
        if (diaPost) return;
        var lab = D.mdLabel[f] || '';
        if (lab !== 'MD+1' && lab !== 'MD+2') return;
        var hay = D.jugadores.some(function(j) { var c = (D.datos[j.id] || {})[f]; return c && c[m] > 0; });
        if (hay) diaPost = f;
    });
    function fechaPartidoPrevio(f) {
        var fp = D.fechaPrevia || null;
        D.dias.forEach(function(x) { if (D.fechasPartido[x] && x < f) fp = x; });
        return fp;
    }
    // 'R' (recuperacion), 'C' (compensatorio) o null si no hay minutos registrados
    function grupoPost(jid, f) {
        var fp = fechaPartidoPrevio(f);
        if (!fp) return null;
        var min = (D.minPartido[jid] || {})[fp];
        if (min === undefined || min === null) return null;
        return min >= (D.minRec || 45) ? 'R' : 'C';
    }
    // Objetivo en unidades reales: [min,max] = banda% x referencia. Delta = 0 dentro de banda, negativo si falta, positivo si sobra.
    function objetivo(banda, ref) { return (banda && ref > 0) ? [banda[0] / 100 * ref, banda[1] / 100 * ref] : null; }
    function delta(v, obj) { if (!obj) return null; if (v < obj[0]) return v - obj[0]; if (v > obj[1]) return v - obj[1]; return 0; }
    function fmtDelta(d) { return (d > 0 ? '+' : (d < 0 ? '−' : '')) + pdzCgFmt(Math.abs(d), conf.dec); }
    function pctHtml(pct, sem, esEquipo, banda, v, ref) {
        var col = sem ? SEM_COLOR[sem] : (esEquipo ? '#a78bfa' : '#94a3b8');
        var obj = objetivo(banda, ref);
        var d = obj ? delta(v, obj) : null;
        var tit = obj ? 'Objetivo: ' + pdzCgFmt(obj[0], conf.dec) + ' - ' + pdzCgFmt(obj[1], conf.dec) + ' (' + banda[0] + '-' + banda[1] + '% de ' + pdzCgFmt(ref, conf.dec) + ')' : '';
        var h = '<div style="font-size:9px;color:' + col + ';font-weight:' + (sem === 'rojo' ? '700' : '400') + '" title="' + tit + '">' + (esEquipo ? '≈' : '') + Math.round(pct) + '%' + (sem ? ' ●' : '') + '</div>';
        if (d !== null) h += '<div style="font-size:9px;color:' + (d === 0 ? '#22c55e' : (d < 0 ? '#f87171' : '#fbbf24')) + '" title="' + tit + '">' + (d === 0 ? 'ok' : fmtDelta(d)) + '</div>';
        return h;
    }
    function diaSemana(f) { return !D.fechasPartido[f]; }

    // ---- Cabecera: metricas + boton gemelos ----
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">';
    html += '<div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">Carga por jugador y dia</div>';
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">';
    Object.keys(PDZ_CG_METRICAS).forEach(function(k) {
        var c = PDZ_CG_METRICAS[k];
        if (c.tipo === 'externa' && !D.hayGps) return;
        var activo = (k === m);
        html += '<button onclick="pdzCgCambiarMetrica(\'' + k + '\')" style="padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;border:1px solid ' + (activo ? c.color : '#334155') + ';background:' + (activo ? c.color : '#1e293b') + ';color:' + (activo ? '#0f172a' : '#94a3b8') + ';font-weight:' + (activo ? '700' : '400') + '">' + c.label + '</button>';
    });
    if (D.hayGps) {
        var nGem = Object.keys(D.gemelos).length;
        html += '<button onclick="pdzCgAbrirGemelos()" style="margin-left:6px;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;border:1px solid #475569;background:#0f172a;color:#cbd5e1">👥 Gemelos' + (nGem ? ' (' + nGem + ')' : '') + '</button>';
    }
    html += '</div></div>';

    if (!D.hayGps) {
        html += '<div style="padding:8px 12px;background:#1e293b;border-radius:8px;margin-bottom:10px;font-size:11px;color:#94a3b8;border-left:3px solid #475569">Sin datos GPS en este periodo: se muestra solo la carga interna (RPE x minutos). Los datos GPS se cargan en Preparacion Fisica.</div>';
    }

    // ---- Tabla ----
    var maxVal = 0;
    D.jugadores.forEach(function(j) { D.dias.forEach(function(f) { var r = valor(j.id, f); if (r.v > maxVal) maxVal = r.v; }); });
    if (maxVal === 0) maxVal = 1;
    var conSemana = esExterna && bandas && bandas.SEMANA && refEquipo > 0;

    html += '<div style="overflow-x:auto;border:1px solid #1e3a5f;border-radius:8px"><table style="border-collapse:collapse;width:100%;min-width:' + (220 + D.dias.length * 62) + 'px;font-size:12px">';
    html += '<thead><tr style="background:#1e293b">';
    html += '<th style="text-align:left;padding:8px 10px;color:#94a3b8;font-weight:600;position:sticky;left:0;background:#1e293b">Jugador</th>';
    D.dias.forEach(function(f) {
        var d = new Date(f + 'T12:00:00');
        var diaSem = ['DOM','LUN','MAR','MIE','JUE','VIE','SAB'][d.getDay()];
        var esPartido = !!D.fechasPartido[f];
        var lab = D.mdLabel[f] || '';
        html += '<th style="padding:6px 4px;text-align:center;color:' + (esPartido ? '#fbbf24' : '#94a3b8') + ';font-weight:600" title="' + (esPartido ? 'Partido vs ' + D.fechasPartido[f] : '') + '">' + (esPartido ? '⚽ ' : '') + diaSem
            + '<div style="font-size:10px;color:#64748b;font-weight:400">' + d.getDate() + '/' + (d.getMonth() + 1) + '</div>'
            + (lab && !esPartido ? '<div style="font-size:9px;color:#38bdf8;font-weight:700;margin-top:1px">' + lab + '</div>' : '') + '</th>';
    });
    html += '<th style="padding:6px 8px;text-align:center;color:#e2e8f0;font-weight:700">Total' + (conSemana ? '<div style="font-size:9px;color:#38bdf8;font-weight:700">SEMANA</div>' : '') + '</th>';
    html += '</tr></thead><tbody>';

    // Fila de objetivo del equipo (banda del dia x referencia de equipo)
    if (esExterna && bandas && refEquipo > 0) {
        html += '<tr style="background:#0b2a3a;border-top:1px solid #1e3a5f">';
        html += '<td style="padding:5px 10px;color:#38bdf8;font-size:10px;font-weight:600;position:sticky;left:0;background:#0b2a3a">Objetivo equipo</td>';
        D.dias.forEach(function(f) {
            var cel = '';
            if (f === diaPost) {
                var oR = bandas['MD+1'] && bandas['MD+1'][m] ? objetivo(bandas['MD+1'][m], refEquipo) : null;
                var oC = bandas['MD+1C'] && bandas['MD+1C'][m] ? objetivo(bandas['MD+1C'][m], refEquipo) : null;
                if (oR) cel += '<span title="Recuperacion (jugaron >= ' + (D.minRec || 45) + ' min)">R ' + pdzCgFmt(oR[0], conf.dec) + '-' + pdzCgFmt(oR[1], conf.dec) + '</span><br>';
                if (oC) cel += '<span style="color:#fbbf24" title="Compensatorio (jugaron < ' + (D.minRec || 45) + ' min)">C ' + pdzCgFmt(oC[0], conf.dec) + '-' + pdzCgFmt(oC[1], conf.dec) + '</span>';
            } else {
                var obj = objetivo(bandaDe(f, null), refEquipo);
                if (obj) cel = pdzCgFmt(obj[0], conf.dec) + '<br>' + pdzCgFmt(obj[1], conf.dec);
            }
            html += '<td style="padding:4px 4px;text-align:center;font-size:9px;color:#38bdf8;white-space:nowrap">' + cel + '</td>';
        });
        var objSem = bandas.SEMANA && bandas.SEMANA[m] ? objetivo(bandas.SEMANA[m], refEquipo) : null;
        html += '<td style="padding:4px 8px;text-align:center;font-size:9px;color:#38bdf8">' + (objSem ? pdzCgFmt(objSem[0], conf.dec) + '<br>' + pdzCgFmt(objSem[1], conf.dec) : '') + '</td>';
        html += '</tr>';
    }

    var totalesDia = {}, cuentaDia = {}, semanaEquipoPct = [];
    D.jugadores.forEach(function(j) {
        var total = 0, diasConDato = 0, algunEst = false, semanaPct = 0, semanaDias = 0, semanaVal = 0;
        var gemelo = D.gemelos[j.id] ? D.jugadores.find(function(x) { return x.id === D.gemelos[j.id]; }) : null;
        var ref = refPropia[j.id] || 0;
        var refEs = ref > 0 ? 'propia' : (refEquipo > 0 ? 'equipo' : '');
        if (!ref) ref = refEquipo;
        var perfilNota = '';
        if (hayPerfil) {
            var p = D.perfil[j.id];
            if (!p) perfilNota = '<div style="font-size:9px;color:#a78bfa">≈ sin perfil (ref. equipo)</div>';
            else if (!refPerfilSolido[j.id]) perfilNota = '<div style="font-size:9px;color:#f59e0b" title="Perfil con ' + p.nReales + ' partido(s) completo(s), ' + Math.round(p.pctReal) + '% min reales">perfil ≈ (' + p.n + ' PJ)</div>';
        }

        html += '<tr style="border-top:1px solid #1e293b">';
        html += '<td style="padding:6px 10px;color:#e2e8f0;white-space:nowrap;position:sticky;left:0;background:#0f172a">' + j.nombre
            + (j.pos ? '<span style="color:#64748b;font-size:10px;margin-left:6px">' + j.pos + '</span>' : '')
            + (esExterna && gemelo ? '<div style="font-size:9px;color:#a78bfa">≈ ' + gemelo.nombre + '</div>' : '')
            + perfilNota
            + '</td>';
        D.dias.forEach(function(f) {
            var r = valor(j.id, f);
            var v = r.v;
            if (v > 0) {
                total += v; diasConDato++;
                if (r.est) algunEst = true;
                else { totalesDia[f] = (totalesDia[f] || 0) + v; cuentaDia[f] = (cuentaDia[f] || 0) + 1; }
            }
            var intensidad = v > 0 ? Math.max(0.12, v / maxVal) : 0;
            var pct = '';
            var sem = null;
            if (v > 0 && ref > 0 && !D.fechasPartido[f]) {
                var pctV = v / ref * 100;
                var banda = bandaDe(f, j.id);
                sem = semaforo(pctV, banda);
                pct = pctHtml(pctV, sem, refEs !== 'propia', banda, v, ref);
                if (f === diaPost) { var gp = grupoPost(j.id, f); pct = '<div style="font-size:8px;color:' + (gp === 'C' ? '#fbbf24' : (gp === 'R' ? '#38bdf8' : '#64748b')) + '">' + (gp === 'C' ? 'COMP.' : (gp === 'R' ? 'RECUP.' : 'sin min.')) + '</div>' + pct; }
                if (diaSemana(f) && !r.est) { semanaPct += pctV; semanaDias++; semanaVal += v; }
            }
            var titulo = r.est ? 'Estimado por gemelo (' + (gemelo ? gemelo.nombre : '') + ')' : (!esExterna && r.rpe !== null ? 'RPE ' + r.rpe : '');
            var estiloEst = r.est ? 'opacity:0.65;font-style:italic;outline:1px dashed #7c3aed;outline-offset:-2px;' : '';
            var borde = sem === 'rojo' ? 'box-shadow:inset 0 0 0 2px ' + SEM_COLOR.rojo + ';' : (sem === 'ambar' ? 'box-shadow:inset 0 0 0 1px ' + SEM_COLOR.ambar + ';' : '');
            html += '<td style="padding:5px 4px;text-align:center;' + estiloEst + borde + 'color:' + (v > 0 ? '#e2e8f0' : '#334155') + ';background:' + (v > 0 ? pdzCgHex(conf.color, intensidad) : 'transparent') + '" title="' + titulo + '">' + (v > 0 ? (r.est ? '≈' : '') + pdzCgFmt(v, conf.dec) : '—') + pct + '</td>';
        });
        var semanaHtml = '';
        if (conSemana && semanaDias > 0) {
            var semSemana = semaforo(semanaPct, bandas.SEMANA[m]);
            if (refEs === 'propia') semanaEquipoPct.push(semanaPct);
            var objS = objetivo(bandas.SEMANA[m], ref);
            var dS = delta(semanaVal, objS);
            semanaHtml = '<div style="font-size:9px;color:' + (semSemana ? SEM_COLOR[semSemana] : '#94a3b8') + ';font-weight:' + (semSemana === 'rojo' ? '700' : '400') + '" title="Suma de los dias de entrenamiento antes del partido (' + semanaDias + '). Objetivo semanal: ' + pdzCgFmt(objS[0], conf.dec) + ' - ' + pdzCgFmt(objS[1], conf.dec) + ' (' + bandas.SEMANA[m][0] + '-' + bandas.SEMANA[m][1] + '%)">' + Math.round(semanaPct) + '%' + (semSemana ? ' ●' : '') + '</div>'
                + '<div style="font-size:9px;color:' + (dS === 0 ? '#22c55e' : (dS < 0 ? '#f87171' : '#fbbf24')) + '">' + (dS === 0 ? 'ok' : fmtDelta(dS)) + '</div>';
        }
        html += '<td style="padding:5px 8px;text-align:center;color:#e2e8f0;font-weight:700;' + (algunEst ? 'font-style:italic;opacity:0.75' : '') + '">' + (total > 0 ? (algunEst ? '≈' : '') + pdzCgFmt(total, conf.dec) : '—') + (diasConDato > 0 ? '<div style="font-size:9px;color:#64748b;font-weight:400">' + diasConDato + ' d</div>' : '') + semanaHtml + '</td>';
        html += '</tr>';
    });

    // Media del equipo (solo datos reales, nunca estimados) con semaforo contra la banda del dia
    html += '<tr style="border-top:2px solid #334155;background:#1e293b">';
    html += '<td style="padding:6px 10px;color:#94a3b8;font-weight:600;position:sticky;left:0;background:#1e293b">Media equipo</td>';
    var totalMedia = 0, semanaEq = 0, semanaEqDias = 0, semanaEqVal = 0;
    D.dias.forEach(function(f) {
        var media = cuentaDia[f] ? totalesDia[f] / cuentaDia[f] : 0;
        totalMedia += media;
        var pct = '', sem = null;
        if (media > 0 && refEquipo > 0 && !D.fechasPartido[f]) {
            var pctV = media / refEquipo * 100;
            var banda = bandaDe(f, null);
            sem = semaforo(pctV, banda);
            pct = pctHtml(pctV, sem, false, banda, media, refEquipo);
            if (diaSemana(f)) { semanaEq += pctV; semanaEqDias++; semanaEqVal += media; }
        }
        var borde = sem === 'rojo' ? 'box-shadow:inset 0 0 0 2px ' + SEM_COLOR.rojo + ';' : (sem === 'ambar' ? 'box-shadow:inset 0 0 0 1px ' + SEM_COLOR.ambar + ';' : '');
        html += '<td style="padding:5px 4px;text-align:center;' + borde + 'color:' + (media > 0 ? '#e2e8f0' : '#334155') + ';font-weight:600">' + (media > 0 ? pdzCgFmt(media, conf.dec) : '—') + (cuentaDia[f] ? '<div style="font-size:9px;color:#64748b;font-weight:400">' + cuentaDia[f] + ' jug</div>' : '') + pct + '</td>';
    });
    var semanaEqHtml = '';
    if (conSemana && semanaEqDias > 0) {
        var semEq = semaforo(semanaEq, bandas.SEMANA[m]);
        var objEqS = objetivo(bandas.SEMANA[m], refEquipo);
        var dEqS = delta(semanaEqVal, objEqS);
        semanaEqHtml = '<div style="font-size:9px;color:' + (semEq ? SEM_COLOR[semEq] : '#94a3b8') + ';font-weight:' + (semEq === 'rojo' ? '700' : '400') + '" title="Banda semanal ' + bandas.SEMANA[m][0] + '-' + bandas.SEMANA[m][1] + '%">' + Math.round(semanaEq) + '%' + (semEq ? ' ●' : '') + '</div>'
            + '<div style="font-size:9px;color:' + (dEqS === 0 ? '#22c55e' : (dEqS < 0 ? '#f87171' : '#fbbf24')) + '">' + (dEqS === 0 ? 'ok' : fmtDelta(dEqS)) + '</div>';
    }
    html += '<td style="padding:5px 8px;text-align:center;color:#e2e8f0;font-weight:700">' + (totalMedia > 0 ? pdzCgFmt(totalMedia, conf.dec) : '—') + semanaEqHtml + '</td>';
    html += '</tr></tbody></table></div>';

    // ---- Leyenda ----
    var leyenda = '';
    if (esExterna) {
        leyenda += 'Datos GPS de Preparacion Fisica. Las celdas con <span style="color:#a78bfa">≈</span> son estimaciones tomadas del gemelo asignado (no son datos reales y no entran en la media del equipo). ';
        if (hayPerfil) {
            leyenda += 'El % es respecto al <strong style="color:#cbd5e1">perfil de partido a 90\'</strong> de cada jugador (Preparacion Fisica &rsaquo; Perfil partido); si no tiene perfil, respecto a la media del equipo (<span style="color:#a78bfa">≈morado</span>). Referencia de equipo: <strong style="color:#cbd5e1">' + pdzCgFmt(refEquipo, conf.dec) + '</strong>. ';
        } else {
            leyenda += 'El % es respecto al partido del propio jugador (>= ' + MIN_PARTIDO_COMPLETO + ' min) o a la media del equipo (<span style="color:#a78bfa">≈morado</span>). ';
        }
        if (bandas) {
            var bl = [];
            ['MD-4','MD-3','MD-2','MD-1','MD+1','MD+1C','SEMANA'].forEach(function(k) { if (bandas[k] && bandas[k][m]) bl.push('<span style="color:#38bdf8">' + (k === 'MD+1C' ? 'MD+1 comp.' : k) + '</span> ' + bandas[k][m][0] + '-' + bandas[k][m][1] + '%'); });
            leyenda += '<br>Semaforo: <span style="color:' + SEM_COLOR.ok + '">●</span> dentro de la banda del dia &middot; <span style="color:' + SEM_COLOR.ambar + '">●</span> hasta ' + tol + ' puntos fuera &middot; <span style="color:' + SEM_COLOR.rojo + '">●</span> mas alla. Bandas (' + conf.label + '): ' + bl.join(' &middot; ') + '. Primera sesion tras el partido (MD+1 o MD+2): RECUP. si jugo >= ' + (D.minRec || 45) + '\' (banda recuperacion), COMP. si jugo menos (banda compensatoria), sin semaforo si no hay minutos registrados; ese dia la media del equipo no lleva semaforo porque mezcla los dos grupos. Debajo del %: <span style="color:#f87171">−</span> lo que falta / <span style="color:#fbbf24">+</span> lo que sobra respecto al objetivo del dia (pasa el raton para ver el objetivo). SEMANA = suma de todos los dias de entrenamiento antes del partido.';
        }
    } else {
        leyenda += 'sRPE = RPE del jugador x minutos (sesion: duracion real; partido: minutos jugados). Pasa el raton por una celda para ver el RPE. El % es respecto al partido del propio jugador (>= ' + MIN_PARTIDO_COMPLETO + ' min); si no lo tiene, respecto a la media del equipo (<span style="color:#a78bfa">≈morado</span>).'
            + (refEquipo > 0 ? ' Referencia del equipo en partido: <strong style="color:#cbd5e1">' + pdzCgFmt(refEquipo, conf.dec) + '</strong>.' : ' Sin partido completo en este periodo: no hay referencia para el %.');
    }
    html += '<div style="font-size:10px;color:#64748b;margin-top:6px;line-height:1.5">' + leyenda + '</div>';

    cont.innerHTML = html;
}

// ---------- Gemelos ----------
function pdzCgAbrirGemelos() {
    var D = pdzCg.datos; if (!D) return;
    var viejo = document.getElementById('pdz-cg-modal-gemelos'); if (viejo) viejo.remove();

    // Jugadores CON algun dato GPS real en el periodo (candidatos a gemelo)
    var conGps = D.jugadores.filter(function(j) {
        var fila = D.datos[j.id] || {};
        return Object.keys(fila).some(function(f) { return fila[f].gpsReal; });
    });
    var sinGps = D.jugadores.filter(function(j) { return conGps.indexOf(j) === -1; });

    var html = '<div id="pdz-cg-modal-gemelos" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px" onclick="if(event.target===this)this.remove()">';
    html += '<div style="background:#0f172a;border:1px solid #334155;border-radius:12px;max-width:640px;width:100%;max-height:85vh;overflow:auto;padding:20px;color:#e2e8f0">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="font-size:16px;font-weight:700">👥 Perfiles gemelos</div><button onclick="document.getElementById(\'pdz-cg-modal-gemelos\').remove()" style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer">×</button></div>';
    html += '<div style="font-size:12px;color:#94a3b8;margin-bottom:14px;line-height:1.5">A cada jugador sin dispositivo GPS le asignas un gemelo (misma posicion y perfil) que si lo lleva. Su carga externa se mostrara como estimacion (≈), siempre marcada y sin entrar en la media del equipo. La asignacion se guarda para el club y vale para todos los microciclos.</div>';

    if (conGps.length === 0) {
        html += '<div style="color:#94a3b8;font-size:12px">No hay jugadores con GPS en este periodo para usar como gemelo.</div>';
    } else if (sinGps.length === 0) {
        html += '<div style="color:#94a3b8;font-size:12px">Todos los jugadores de la plantilla tienen datos GPS en este periodo.</div>';
    } else {
        html += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
        html += '<thead><tr style="color:#94a3b8"><th style="text-align:left;padding:6px">Sin GPS</th><th style="text-align:left;padding:6px">Gemelo (con GPS)</th></tr></thead><tbody>';
        sinGps.forEach(function(j) {
            html += '<tr style="border-top:1px solid #1e293b"><td style="padding:6px">' + j.nombre + (j.pos ? ' <span style="color:#64748b;font-size:10px">' + j.pos + '</span>' : '') + '</td><td style="padding:6px">';
            html += '<select data-jid="' + j.id + '" style="width:100%;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:5px"><option value="">— Sin gemelo —</option>';
            conGps.forEach(function(g) {
                var sel = D.gemelos[j.id] === g.id ? ' selected' : '';
                var mismaPos = j.pos && g.pos && pdzCgNorm(j.pos) === pdzCgNorm(g.pos);
                html += '<option value="' + g.id + '"' + sel + '>' + g.nombre + (g.pos ? ' (' + g.pos + ')' : '') + (mismaPos ? ' ★' : '') + '</option>';
            });
            html += '</select></td></tr>';
        });
        html += '</tbody></table>';
        html += '<div style="font-size:10px;color:#64748b;margin-top:6px">★ = misma posicion que el jugador.</div>';
        html += '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px"><button onclick="document.getElementById(\'pdz-cg-modal-gemelos\').remove()" style="padding:8px 14px;border-radius:8px;border:1px solid #334155;background:#1e293b;color:#cbd5e1;cursor:pointer">Cancelar</button><button onclick="pdzCgGuardarGemelos()" style="padding:8px 14px;border-radius:8px;border:none;background:#7c3aed;color:#fff;font-weight:700;cursor:pointer">Guardar</button></div>';
    }
    html += '</div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
}

async function pdzCgGuardarGemelos() {
    var D = pdzCg.datos; if (!D) return;
    var selects = document.querySelectorAll('#pdz-cg-modal-gemelos select[data-jid]');
    var filas = [], quitar = [];
    selects.forEach(function(s) {
        var jid = s.getAttribute('data-jid');
        if (s.value) filas.push({ club_id: clubId, player_id: jid, gemelo_id: s.value });
        else quitar.push(jid);
    });
    try {
        if (quitar.length > 0) {
            var r1 = await supabaseClient.from('pdz_gemelos').delete().eq('club_id', clubId).in('player_id', quitar);
            if (r1.error) throw r1.error;
        }
        if (filas.length > 0) {
            var r2 = await supabaseClient.from('pdz_gemelos').upsert(filas, { onConflict: 'club_id,player_id' });
            if (r2.error) throw r2.error;
        }
        D.gemelos = {};
        filas.forEach(function(f) { D.gemelos[f.player_id] = f.gemelo_id; });
        var modal = document.getElementById('pdz-cg-modal-gemelos'); if (modal) modal.remove();
        showToast('Gemelos guardados', 'success');
        pdzCgRender();
    } catch (e) {
        console.error('Error guardando gemelos:', e);
        showToast('Error al guardar gemelos: ' + e.message, 'error');
    }
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
