// ============================================================
// CM-PF-INFORME-JUGADOR.JS — Informe individual completo del jugador (Preparacion Fisica › ficha › Informe)
// Sustituye la pestana "Informe" por un informe profesional: estado de hoy, objetivos por dia MD y
// semana (cumplidos o no), tendencia de carga, perfil de partido, comparativa con equipo y posicion,
// wellness / RPE / peso diarios, zonas de velocidad y tabla completa de sesiones. Con filtros por
// periodo, tipo de sesion y dia MD, y exportacion a PDF (vista de impresion).
// Datos: cm_pf_gps_player_data (TOTAL), cm_pf_gps_sessions, cm_pf_perfil_partido, cm_pf_gps_config
// (md_bands), matches, club_players, asistencia_sesiones + training_sessions (via legacy_player_id).
// Cargar DESPUES de cm-prepfisica.js. Requiere Chart.js (ya esta en el HUB).
// ============================================================
(function () {
    'use strict';
    var MET = [
        { k: 'td',     lbl: 'Distancia',      uni: 'm',  col: '#3b82f6', dec: 0, prof: 'total_distance_90', val: function (d) { return num(d.total_distance_m); } },
        { k: 'hsr',    lbl: 'HSR >19',        uni: 'm',  col: '#0d9488', dec: 0, prof: 'hsr_90',            val: function (d) { return num(d.hsr_distance_m); } },
        { k: 'sprint', lbl: 'Sprint >24',     uni: 'm',  col: '#9333ea', dec: 0, prof: 'sprint_90',         val: function (d) { return num(d.sprint_distance_m); } },
        { k: 'accdec', lbl: 'Acel + Desacel', uni: '',   col: '#e11d48', dec: 0, prof: ['accel_90', 'decel_90'], val: function (d) { return num(d.accel_count) + num(d.decel_count); } }
    ];
    var EXTRA = [
        { k: 'mmin',   lbl: 'm/min',        dec: 1, val: function (d) { var m = num(d.duration_min); return m > 0 ? num(d.total_distance_m) / m : null; } },
        { k: 'vmax',   lbl: 'Vel. máx',     dec: 1, uni: 'km/h', val: function (d) { return d.max_speed_kmh !== null ? num(d.max_speed_kmh) : null; } },
        { k: 'nsprint',lbl: 'Nº sprints',   dec: 0, val: function (d) { return d.sprint_count !== null && d.sprint_count !== undefined ? num(d.sprint_count) : null; } },
        { k: 'min',    lbl: 'Minutos',      dec: 0, val: function (d) { return num(d.duration_min) || null; } }
    ];
    var WELL = [
        { k: 'sueno',  lbl: 'Sueño',   col: '#3b82f6' },
        { k: 'fatiga', lbl: 'Fatiga (10 = fresco)', col: '#0d9488' },
        { k: 'estres', lbl: 'Estrés (10 = relajado)', col: '#9333ea' },
        { k: 'musc',   lbl: 'Daño muscular (10 = lesión)', col: '#e11d48', invertida: true }
    ];
    var ST = { ok: '#22c55e', ambar: '#f59e0b', rojo: '#ef4444', gris: '#64748b' };
    var S = { j: null, cont: null, cargado: null, rango: 28, tipo: 'all', md: '', metrica: 'td', charts: [], cmp: { p2: '', p3: '', met: 'td', tipo: 'all', md: '', vista: 'sesion', rango: 56 } };
    var CMPCOL = ['#3b82f6', '#e11d48', '#0d9488'];

    function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
    function esc(t) { return String(t === null || t === undefined ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function fmt(v, dec) {
        if (v === null || v === undefined || isNaN(v)) return '—';
        var p = Math.pow(10, dec || 0), n = Math.round(v * p) / p, s = String(n).split('.');
        s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return s.join(',');
    }
    function fecha(f, largo) { var d = new Date(f + 'T12:00:00'); return largo ? d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }); }
    function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function addDias(f, n) { var d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); }
    function lunesDe(f) { var d = new Date(f + 'T12:00:00'); var w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return iso(d); }
    function media(a) { var v = a.filter(function (x) { return x !== null && !isNaN(x); }); return v.length ? v.reduce(function (s, x) { return s + x; }, 0) / v.length : null; }
    function sd(a) { var v = a.filter(function (x) { return x !== null && !isNaN(x); }); if (v.length < 2) return null; var m = media(v); return Math.sqrt(v.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (v.length - 1)); }
    function edad(f) { if (!f) return null; var d = new Date(f), h = new Date(); var e = h.getFullYear() - d.getFullYear(); if (h < new Date(h.getFullYear(), d.getMonth(), d.getDate())) e--; return e; }
    function grupoPos(p) {
        p = String(p || '').toLowerCase();
        if (!p) return 'otro';
        if (p.indexOf('portero') >= 0 || p === 'por' || p === 'gk') return 'Porteros';
        if (p.indexOf('central') >= 0 || p.indexOf('lateral') >= 0 || p.indexOf('defens') >= 0 || /^(dc[di]?|ld|li|dfc)$/.test(p)) return 'Defensas';
        if (p.indexOf('medio') >= 0 || p.indexOf('pivote') >= 0 || p.indexOf('interior') >= 0 || p.indexOf('mediapunta') >= 0 || /^(mc[di]?|mcd|mp|piv|i[di])$/.test(p)) return 'Centrocampistas';
        if (p.indexOf('extrem') >= 0 || p.indexOf('delant') >= 0 || p.indexOf('punt') >= 0 || /^(dc|e[di]|ca[di])$/.test(p)) return 'Atacantes';
        return 'otro';
    }

    /* ---------- CSS ---------- */
    var CSS = ''
        + '.ij{color:#e2e8f0;font-size:13px}'
        + '.ij .hd{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:14px}'
        + '.ij .foto{width:76px;height:76px;border-radius:14px;object-fit:cover;background:#1e293b;border:2px solid #334155;flex-shrink:0}'
        + '.ij .foto.ini{display:grid;place-items:center;font-size:30px;font-weight:800;color:#94a3b8}'
        + '.ij .nm{font-size:22px;font-weight:800;color:#fff;line-height:1.1}'
        + '.ij .sub{color:#94a3b8;font-size:12.5px;margin-top:4px}'
        + '.ij .sub b{color:#cbd5e1;font-weight:600}'
        + '.ij .flt{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-left:auto}'
        + '.ij .cl{display:flex;flex-direction:column;gap:2px;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em}.ij .cl select{text-transform:none;letter-spacing:0}'
        + '.ij select,.ij button.b{background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:6px 10px;border-radius:7px;font:inherit;font-size:12px;cursor:pointer}'
        + '.ij button.b.p{background:#2563eb;border-color:#2563eb;color:#fff;font-weight:700}'
        + '.ij .sem{display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:12px;border:1px solid #334155;background:#111c33;margin-bottom:14px}'
        + '.ij .sem .dot{width:14px;height:14px;border-radius:50%;flex-shrink:0;box-shadow:0 0 0 4px rgba(255,255,255,.06)}'
        + '.ij .sem b{color:#fff}'
        + '.ij .sem small{color:#94a3b8;display:block;margin-top:2px;font-size:12px}'
        + '.ij .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:14px}'
        + '.ij .kpi{background:#1e293b;border-radius:10px;padding:10px 12px;border-top:3px solid #334155}'
        + '.ij .kpi .l{font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8}'
        + '.ij .kpi .v{font-size:22px;font-weight:800;color:#fff;margin-top:2px;line-height:1.1}'
        + '.ij .kpi .v small{font-size:11px;font-weight:500;color:#94a3b8;margin-left:3px}'
        + '.ij .kpi .d{font-size:11.5px;margin-top:3px;color:#94a3b8}'
        + '.ij h4{margin:18px 0 8px;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;display:flex;align-items:center;gap:10px}'
        + '.ij h4 span{color:#64748b;text-transform:none;letter-spacing:0;font-weight:500}'
        + '.ij .card{background:#111c33;border:1px solid #1e3a5f;border-radius:12px;padding:12px 14px}'
        + '.ij .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}'
        + '.ij .t{width:100%;border-collapse:collapse;font-size:12px}'
        + '.ij .t th{color:#94a3b8;font-size:10px;text-transform:uppercase;text-align:right;padding:6px 7px;border-bottom:1px solid #334155;white-space:nowrap}'
        + '.ij .t td{padding:6px 7px;border-bottom:1px solid #1e293b;text-align:right;white-space:nowrap}'
        + '.ij .t th:first-child,.ij .t td:first-child{text-align:left}'
        + '.ij .t tr.sem td{background:#0b2a3a;font-weight:700;color:#38bdf8}'
        + '.ij .t tr.par td{color:#fbbf24}'
        + '.ij .pill{display:inline-block;min-width:54px;text-align:center;padding:2px 7px;border-radius:999px;font-size:11px;font-weight:700}'
        + '.ij .pill small{font-weight:500;opacity:.85}'
        + '.ij .bul{display:flex;align-items:center;gap:8px;margin:7px 0}'
        + '.ij .bul .l{width:120px;font-size:12px;color:#cbd5e1;flex-shrink:0}'
        + '.ij .bul .bar{flex:1;height:14px;background:#1e293b;border-radius:4px;position:relative;overflow:hidden}'
        + '.ij .bul .obj{position:absolute;top:0;bottom:0;background:rgba(56,189,248,.22);border-left:1px solid #38bdf8;border-right:1px solid #38bdf8}'
        + '.ij .bul .val{position:absolute;top:3px;bottom:3px;left:0;border-radius:3px}'
        + '.ij .bul .n{width:112px;text-align:right;font-size:12px;font-weight:700;flex-shrink:0}'
        + '.ij .bul .n small{color:#94a3b8;font-weight:500}'
        + '.ij .cv{position:relative;height:230px}'
        + '.ij .cv.s{height:190px}'
        + '.ij .zs{display:flex;align-items:center;gap:8px;margin:6px 0}'
        + '.ij .zs .l{width:120px;font-size:12px;color:#cbd5e1;flex-shrink:0}'
        + '.ij .zs .ax{flex:1;height:16px;position:relative;background:#1e293b;border-radius:4px}'
        + '.ij .zs .ax::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:1px;background:#64748b}'
        + '.ij .zs .ax i{position:absolute;top:3px;bottom:3px;border-radius:3px}'
        + '.ij .zs .n{width:150px;font-size:11.5px;text-align:right;flex-shrink:0;color:#cbd5e1}'
        + '.ij .leg{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:#94a3b8;margin-top:6px}'
        + '.ij .leg i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:4px;vertical-align:-1px}'
        + '.ij .nota{font-size:11.5px;color:#94a3b8;margin-top:6px;line-height:1.5}'
        + '.ij .vacio{color:#94a3b8;text-align:center;padding:24px;font-size:13px}'
        + '.ij .alertas{display:flex;flex-direction:column;gap:6px}'
        + '.ij .al{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;padding:6px 10px;border-radius:8px;background:#1e293b}'
        + '.ij .al i{width:8px;height:8px;border-radius:50%;margin-top:5px;flex-shrink:0}'
        + '@media (max-width:760px){.ij .g2{grid-template-columns:1fr}.ij .flt{margin-left:0}.ij .bul .l,.ij .zs .l{width:84px}.ij .zs .n{width:110px}.ij .bul .n{width:90px}}';

    /* ---------- Carga de datos ---------- */
    async function cargar(j) {
        var cid = clubId;
        var r = {};
        var q = await Promise.all([
            supabaseClient.from('club_players').select('id,name,photo_url,birth_date,dominant_foot,height_cm,weight_kg,positions_main,position_detail,position_secondary,legacy_player_id,nationality').eq('id', j.id).maybeSingle(),
            supabaseClient.from('cm_pf_gps_player_data').select('player_id,session_id,total_distance_m,hsr_distance_m,sprint_distance_m,sprint_count,accel_count,decel_count,max_speed_kmh,player_load,duration_min,z1_distance_m,z2_distance_m,z3_distance_m,z4_distance_m,z5_distance_m,extra_metrics').eq('club_id', cid).eq('segment_name', 'TOTAL').or('archived.is.null,archived.eq.false').range(0, 19999),
            supabaseClient.from('cm_pf_gps_sessions').select('id,session_date,session_type,title,opponent,duration_min').eq('club_id', cid).or('archived.is.null,archived.eq.false').range(0, 4999),
            supabaseClient.from('cm_pf_perfil_partido').select('*').eq('club_id', cid),
            supabaseClient.from('cm_pf_gps_config').select('md_bands,md_tolerancia,md_min_recuperacion,zone_names,zone_thresholds,acwr_chronic_weeks,hsr_threshold_kmh,sprint_threshold_kmh').eq('club_id', cid).maybeSingle(),
            supabaseClient.from('matches').select('match_date,opponent').eq('club_id', cid).range(0, 999),
            supabaseClient.from('club_players').select('id,name,positions_main,position_detail').eq('club_id', cid).eq('active', true).range(0, 999)
        ]);
        r.cp = q[0].data || {};
        r.gps = q[1].data || [];
        r.ses = {}; (q[2].data || []).forEach(function (s) { r.ses[s.id] = s; });
        r.perfiles = {}; (q[3].data || []).forEach(function (p) { r.perfiles[p.player_id] = p; });
        r.cfg = q[4].data || {};
        r.matches = q[5].data || [];
        r.jug = {}; (q[6].data || []).forEach(function (p) { r.jug[p.id] = p; });

        // Wellness / RPE / peso: por el jugador del HUB (legacy_player_id o por nombre)
        r.well = [];
        try {
            var pid = r.cp.legacy_player_id;
            if (!pid) { var pr = await supabaseClient.from('players').select('id').eq('club_id', cid).ilike('name', j.name).limit(1); if (pr.data && pr.data.length) pid = pr.data[0].id; }
            if (pid) {
                var w = await supabaseClient.from('asistencia_sesiones').select('sesion_id,asistio,sueno,fatiga,estres,estado_muscular,horas_sueno,peso,rpe,duracion_real,grupo_muscular,training_sessions(session_date,name,duration_minutes)').eq('jugador_id', pid).range(0, 1999);
                r.well = (w.data || []).filter(function (x) { return x.training_sessions && x.training_sessions.session_date; }).map(function (x) {
                    return { f: x.training_sessions.session_date, asistio: x.asistio, sueno: x.sueno, fatiga: x.fatiga, estres: x.estres, musc: x.estado_muscular, horas: x.horas_sueno, peso: x.peso !== null ? num(x.peso) : null, rpe: x.rpe, dur: x.duracion_real || x.training_sessions.duration_minutes, gm: x.grupo_muscular };
                }).sort(function (a, b) { return a.f < b.f ? -1 : 1; });
            }
        } catch (e) { console.warn('[informe] wellness no disponible', e); }
        return r;
    }

    /* ---------- Modelo ---------- */
    function construir(j, D) {
        var M = { j: j, cp: D.cp, cfg: D.cfg, perfil: D.perfiles[j.id] || null };
        M.posGrupo = grupoPos(D.cp.position_detail || (D.cp.positions_main && D.cp.positions_main[0]) || j.position);
        // Fechas de partido (HUB + sesiones GPS de partido)
        var fm = {};
        D.matches.forEach(function (m) { if (m.match_date) fm[m.match_date] = m.opponent || 'Partido'; });
        Object.keys(D.ses).forEach(function (id) { var s = D.ses[id]; if (s.session_type === 'match' && s.session_date && !fm[s.session_date]) fm[s.session_date] = s.opponent || 'Partido'; });
        M.fechasPartido = fm;
        var fechasM = Object.keys(fm).sort();
        M.md = function (f) {
            if (fm[f]) return 'MD';
            var t = new Date(f + 'T12:00:00').getTime(), prev = null, next = null;
            fechasM.forEach(function (x) { var tx = new Date(x + 'T12:00:00').getTime(); if (tx < t && (prev === null || t - tx < prev)) prev = t - tx; else if (tx > t && (next === null || tx - t < next)) next = tx - t; });
            var dP = prev === null ? null : Math.round(prev / 864e5), dN = next === null ? null : Math.round(next / 864e5);
            if (dP === 1) return 'MD+1'; if (dP === 2) return 'MD+2';
            if (dN !== null && dN <= 6) return 'MD-' + dN;
            if (dP !== null && dP <= 3) return 'MD+' + dP;
            return '';
        };
        // Sesiones del jugador
        var mias = D.gps.filter(function (d) { return d.player_id === j.id && D.ses[d.session_id]; }).map(function (d) {
            var s = D.ses[d.session_id];
            var o = { f: s.session_date, tipo: s.session_type, titulo: s.title || '', rival: s.opponent || '', d: d, min: num(d.duration_min) || num(s.duration_min) };
            MET.forEach(function (m) { o[m.k] = m.val(d); });
            EXTRA.forEach(function (m) { o[m.k] = m.val(d); });
            o.md = o.tipo === 'match' ? 'MD' : M.md(o.f);
            o.z = [num(d.z1_distance_m), num(d.z2_distance_m), num(d.z3_distance_m), num(d.z4_distance_m), num(d.z5_distance_m)];
            return o;
        }).sort(function (a, b) { return a.f < b.f ? -1 : (a.f > b.f ? 1 : 0); });
        // Varias sesiones el mismo dia (p. ej. recuperacion + compensatorio): se suman para objetivos y tendencia
        var porDia = {};
        mias.forEach(function (s) {
            var k = s.f + '|' + s.tipo;
            if (!porDia[k]) { porDia[k] = Object.assign({}, s, { partes: [s] }); return; }
            var a = porDia[k]; a.partes.push(s); a.min += s.min;
            MET.forEach(function (m) { a[m.k] += s[m.k]; });
            a.vmax = Math.max(a.vmax || 0, s.vmax || 0); a.nsprint = (a.nsprint || 0) + (s.nsprint || 0);
            a.mmin = a.min > 0 ? a.td / a.min : null;
            a.z = a.z.map(function (v, i) { return v + s.z[i]; });
            a.titulo = a.titulo + ' + ' + s.titulo;
        });
        M.todas = Object.keys(porDia).map(function (k) { return porDia[k]; }).sort(function (a, b) { return a.f < b.f ? -1 : 1; });
        M.sesionesSueltas = mias;
        // Referencia (perfil de partido a 90') por metrica; si no tiene, media de su grupo de posicion; si no, equipo
        M.ref = {}; M.refOrigen = 'perfil';
        var perfilDe = function (p, m) { if (!p) return 0; if (Array.isArray(m.prof)) return num(p[m.prof[0]]) + num(p[m.prof[1]]); return num(p[m.prof]); };
        MET.forEach(function (m) { M.ref[m.k] = perfilDe(M.perfil, m); });
        if (!M.ref.td) {
            var cand = Object.keys(D.perfiles).filter(function (pid) { var p = D.jug[pid]; return p && grupoPos(p.position_detail || (p.positions_main && p.positions_main[0])) === M.posGrupo; });
            if (cand.length < 2) { cand = Object.keys(D.perfiles); M.refOrigen = 'equipo'; } else M.refOrigen = 'posicion';
            MET.forEach(function (m) { M.ref[m.k] = media(cand.map(function (pid) { return perfilDe(D.perfiles[pid], m) || null; })) || 0; });
        }
        // Bandas por MD
        var bands = (D.cfg && D.cfg.md_bands) || {};
        M.tol = (D.cfg && D.cfg.md_tolerancia) || 10;
        M.minRec = (D.cfg && D.cfg.md_min_recuperacion) || 45;
        M.minutosPartido = function (f) { var p = M.todas.filter(function (s) { return s.tipo === 'match' && s.f === f; })[0]; return p ? p.min : null; };
        M.banda = function (s, k) {
            if (s.tipo === 'match') return null;
            var lab = s.md;
            if (lab === 'MD+1' || lab === 'MD+2') {
                var fp = Object.keys(fm).filter(function (x) { return x < s.f; }).sort().pop();
                var min = fp ? M.minutosPartido(fp) : null;
                if (min === null) return null;
                var b = bands[min >= M.minRec ? 'MD+1' : 'MD+1C'];
                return b && b[k] ? b[k] : null;
            }
            var bb = bands[lab]; return bb && bb[k] ? bb[k] : null;
        };
        M.bandaSemana = function (k) { var b = bands.SEMANA; return b && b[k] ? b[k] : null; };
        M.estado = function (pct, banda) {
            if (banda === null || pct === null) return null;
            if (pct >= banda[0] && pct <= banda[1]) return 'ok';
            if (pct >= banda[0] - M.tol && pct <= banda[1] + M.tol) return 'ambar';
            return pct < banda[0] ? 'bajo' : 'alto';
        };
        // Equipo y posicion: medias por jugador (sesiones de entreno) para comparar
        var porJug = {};
        D.gps.forEach(function (d) {
            var s = D.ses[d.session_id]; if (!s) return;
            if (!porJug[d.player_id]) porJug[d.player_id] = { training: [], match: [] };
            var o = { min: num(d.duration_min) }; MET.forEach(function (m) { o[m.k] = m.val(d); }); EXTRA.forEach(function (m) { o[m.k] = m.val(d); });
            o.f = s.session_date; o.md = s.session_type === 'match' ? 'MD' : M.md(s.session_date);
            porJug[d.player_id][s.session_type === 'match' ? 'match' : 'training'].push(o);
        });
        M.porJug = porJug;
        M.grupoDe = function (pid) { var p = D.jug[pid]; return p ? grupoPos(p.position_detail || (p.positions_main && p.positions_main[0])) : 'otro'; };
        M.well = D.well;
        return M;
    }

    /* ---------- Filtros ---------- */
    function filtradas(M) {
        var desde = S.rango ? addDias(iso(new Date()), -S.rango) : '0000-00-00';
        return M.todas.filter(function (s) {
            if (s.f < desde) return false;
            if (S.tipo === 'training' && s.tipo === 'match') return false;
            if (S.tipo === 'match' && s.tipo !== 'match') return false;
            if (S.md && s.md !== S.md) return false;
            return true;
        });
    }
    function colorEstado(e) { return e === 'ok' ? ST.ok : (e === 'ambar' ? ST.ambar : (e ? ST.rojo : ST.gris)); }
    function pillEstado(e, pct) {
        if (e === null) return '<span class="pill" style="background:#1e293b;color:#64748b">' + (pct === null ? '—' : fmt(pct, 0) + '%') + '</span>';
        var txt = e === 'ok' ? 'OK' : (e === 'ambar' ? '≈' : (e === 'bajo' ? '▼' : '▲'));
        return '<span class="pill" style="background:' + colorEstado(e) + '22;color:' + colorEstado(e) + '">' + fmt(pct, 0) + '% <small>' + txt + '</small></span>';
    }

    /* ---------- Render ---------- */
    function destruirCharts() { S.charts.forEach(function (c) { try { c.destroy(); } catch (e) {} }); S.charts = []; if (S.chartCmp) { try { S.chartCmp.destroy(); } catch (e) {} S.chartCmp = null; } }

    function render() {
        var M = S.m; if (!M || !S.cont) return;
        destruirCharts();
        var F = filtradas(M);
        var hoy = iso(new Date());
        var h = '<div class="ij" id="ij-root">';

        // ---- Cabecera ----
        var cp = M.cp, j = M.j;
        var ed = edad(cp.birth_date);
        h += '<div class="hd">' + (cp.photo_url || j.photo_url ? '<img class="foto" src="' + esc(cp.photo_url || j.photo_url) + '" alt="">' : '<div class="foto ini">' + esc((j.name || '?').charAt(0)) + '</div>')
           + '<div><div class="nm">' + esc(j.name) + (j.dorsal ? ' <span style="color:#64748b;font-weight:600;font-size:16px">#' + j.dorsal + '</span>' : '') + '</div>'
           + '<div class="sub"><b>' + esc(j.position || cp.position_detail || '') + '</b>' + (cp.position_secondary ? ' · ' + esc(cp.position_secondary) : '') + (j.team_name ? ' · ' + esc(j.team_name) : '')
           + (ed ? ' · ' + ed + ' años' : '') + (cp.dominant_foot ? ' · ' + esc(cp.dominant_foot) : '') + (cp.height_cm ? ' · ' + cp.height_cm + ' cm' : '') + '</div>'
           + '<div class="sub">Grupo de posición: <b>' + esc(M.posGrupo) + '</b> · ' + M.todas.length + ' sesiones GPS · ' + M.well.length + ' registros de wellness</div></div>'
           + '<div class="flt">'
           + '<select onchange="cmIjSet(\'rango\',this.value)">' + [[14, 'Últimas 2 semanas'], [28, 'Últimas 4 semanas'], [56, 'Últimas 8 semanas'], [0, 'Toda la temporada']].map(function (o) { return '<option value="' + o[0] + '"' + (S.rango === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'
           + '<select onchange="cmIjSet(\'tipo\',this.value)"><option value="all"' + (S.tipo === 'all' ? ' selected' : '') + '>Entrenos y partidos</option><option value="training"' + (S.tipo === 'training' ? ' selected' : '') + '>Solo entrenos</option><option value="match"' + (S.tipo === 'match' ? ' selected' : '') + '>Solo partidos</option></select>'
           + '<select onchange="cmIjSet(\'md\',this.value)"><option value="">Todos los días</option>' + ['MD-5', 'MD-4', 'MD-3', 'MD-2', 'MD-1', 'MD', 'MD+1', 'MD+2'].map(function (d) { return '<option value="' + d + '"' + (S.md === d ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select>'
           + '<button class="b p" onclick="cmIjPdf()">Exportar PDF</button></div></div>';

        if (!M.todas.length) { h += '<div class="vacio">Este jugador todavía no tiene sesiones GPS. Impórtalas desde Preparación Física › Sesiones GPS.</div></div>'; S.cont.innerHTML = h; return; }

        // ---- Estado hoy ----
        var ult = M.todas[M.todas.length - 1];
        var acwr = calcAcwr(M);
        var alertas = [];
        var ultTrain = M.todas.filter(function (s) { return s.tipo !== 'match'; }).slice(-1)[0];
        var cumplUlt = null;
        if (ultTrain && M.ref.td) {
            var est = MET.map(function (m) { var b = M.banda(ultTrain, m.k); var pct = M.ref[m.k] ? ultTrain[m.k] / M.ref[m.k] * 100 : null; return M.estado(pct, b); }).filter(function (x) { return x; });
            if (est.length) { cumplUlt = est; var malos = est.filter(function (e) { return e === 'bajo' || e === 'alto'; }).length; if (malos) alertas.push({ c: ST.rojo, t: 'Última sesión (' + fecha(ultTrain.f, true) + ', ' + ultTrain.md + '): ' + malos + ' de ' + est.length + ' métricas fuera del objetivo del día.' }); }
        }
        if (acwr && acwr.td !== null) {
            if (acwr.td > 1.5) alertas.push({ c: ST.rojo, t: 'ACWR distancia ' + fmt(acwr.td, 2) + ': carga aguda muy por encima de la crónica (riesgo).' });
            else if (acwr.td > 1.3) alertas.push({ c: ST.ambar, t: 'ACWR distancia ' + fmt(acwr.td, 2) + ': por encima de 1,3, vigilar.' });
            else if (acwr.td < 0.8) alertas.push({ c: ST.ambar, t: 'ACWR distancia ' + fmt(acwr.td, 2) + ': por debajo de 0,8, carga reciente baja.' });
        }
        // z-score ultima sesion de entreno vs sus 10 anteriores del mismo MD
        if (ultTrain) {
            var prev = M.todas.filter(function (s) { return s.tipo !== 'match' && s.f < ultTrain.f && s.md === ultTrain.md; }).slice(-10);
            if (prev.length >= 4) {
                var mu = media(prev.map(function (s) { return s.td; })), sg = sd(prev.map(function (s) { return s.td; }));
                if (sg) { var z = (ultTrain.td - mu) / sg; if (Math.abs(z) >= 1.5) alertas.push({ c: z > 0 ? ST.ambar : ST.ambar, t: 'Distancia de la última sesión ' + (z > 0 ? 'muy por encima' : 'muy por debajo') + ' de lo normal para un ' + ultTrain.md + ' (z = ' + fmt(z, 1) + ').' }); }
            }
        }
        var wUlt = M.well.filter(function (w) { return w.sueno !== null || w.fatiga !== null; }).slice(-1)[0];
        if (wUlt) {
            var ib = media([wUlt.sueno, wUlt.fatiga, wUlt.estres].map(function (v) { return v === null ? null : num(v); }));
            var prevW = M.well.filter(function (w) { return w.f < wUlt.f && (w.sueno !== null); }).slice(-14);
            var muW = media(prevW.map(function (w) { return media([w.sueno, w.fatiga, w.estres].map(function (v) { return v === null ? null : num(v); })); }));
            if (ib !== null && muW !== null && ib < muW - 1.5) alertas.push({ c: ST.ambar, t: 'Wellness del ' + fecha(wUlt.f) + ' (' + fmt(ib, 1) + '/10) por debajo de su media de dos semanas (' + fmt(muW, 1) + ').' });
            if (wUlt.musc !== null && num(wUlt.musc) >= 5) alertas.push({ c: ST.rojo, t: 'Daño muscular ' + wUlt.musc + '/10 el ' + fecha(wUlt.f) + (wUlt.gm ? ' (' + esc(wUlt.gm) + ')' : '') + '.' });
        }
        var pesos = M.well.filter(function (w) { return w.peso !== null && w.peso > 30; });
        if (pesos.length >= 5) {
            var base = media(pesos.slice(0, Math.min(10, pesos.length - 1)).map(function (w) { return w.peso; }));
            var pUlt = pesos[pesos.length - 1];
            var varPct = (pUlt.peso - base) / base * 100;
            if (Math.abs(varPct) >= 2) alertas.push({ c: ST.ambar, t: 'Peso ' + fmt(pUlt.peso, 1) + ' kg el ' + fecha(pUlt.f) + ': ' + (varPct > 0 ? '+' : '') + fmt(varPct, 1) + '% respecto a su referencia (' + fmt(base, 1) + ' kg).' });
        }
        var nivel = alertas.some(function (a) { return a.c === ST.rojo; }) ? 'rojo' : (alertas.length ? 'ambar' : 'ok');
        h += '<div class="sem"><span class="dot" style="background:' + ST[nivel] + '"></span><div><b>' + (nivel === 'ok' ? 'Sin alertas' : (nivel === 'rojo' ? 'Atención' : 'Vigilar')) + '</b>'
           + '<small>Última sesión GPS: ' + fecha(ult.f, true) + ' (' + (ult.tipo === 'match' ? 'partido' + (ult.rival ? ' vs ' + esc(ult.rival) : '') : ult.md || 'entreno') + ', ' + fmt(ult.min, 0) + ' min)'
           + (acwr && acwr.td !== null ? ' · ACWR ' + fmt(acwr.td, 2) : '') + ' · Referencia: ' + (M.refOrigen === 'perfil' ? 'su perfil de partido a 90\' (' + (M.perfil ? M.perfil.n_partidos : 0) + ' partidos)' : 'media de ' + (M.refOrigen === 'posicion' ? 'su posición' : 'el equipo') + ' (sin perfil propio)') + '</small></div></div>';
        if (alertas.length) { h += '<div class="alertas" style="margin-bottom:14px">' + alertas.map(function (a) { return '<div class="al"><i style="background:' + a.c + '"></i><span>' + a.t + '</span></div>'; }).join('') + '</div>'; }

        // ---- KPIs del periodo ----
        var ent = F.filter(function (s) { return s.tipo !== 'match'; });
        h += '<div class="kpis">';
        MET.forEach(function (m) {
            var tot = F.reduce(function (a, s) { return a + s[m.k]; }, 0), med = ent.length ? media(ent.map(function (s) { return s[m.k]; })) : null;
            h += '<div class="kpi" style="border-top-color:' + m.col + '"><div class="l">' + m.lbl + (m.uni ? ' (' + m.uni + ')' : '') + '</div><div class="v">' + fmt(tot, 0) + '</div><div class="d">' + F.length + ' ses. · media entreno ' + fmt(med, 0) + (M.ref[m.k] ? ' · ' + fmt(med / M.ref[m.k] * 100, 0) + '% del partido' : '') + '</div></div>';
        });
        var vm = Math.max.apply(null, F.map(function (s) { return s.vmax || 0; }).concat([0]));
        var vmT = Math.max.apply(null, M.todas.map(function (s) { return s.vmax || 0; }).concat([0]));
        h += '<div class="kpi" style="border-top-color:#d97706"><div class="l">Vel. máxima</div><div class="v">' + fmt(vm, 1) + '<small>km/h</small></div><div class="d">' + (vmT ? fmt(vm / vmT * 100, 0) + '% de su máximo (' + fmt(vmT, 1) + ')' : '') + '</div></div>';
        h += '<div class="kpi"><div class="l">Intensidad media</div><div class="v">' + fmt(media(ent.map(function (s) { return s.mmin; })), 1) + '<small>m/min</small></div><div class="d">' + fmt(ent.reduce(function (a, s) { return a + s.min; }, 0), 0) + ' min de entreno</div></div>';
        h += '</div>';

        // ---- Objetivos por dia ----
        h += '<h4>Objetivos por día <span>· ' + (S.md ? 'solo ' + S.md : 'cada día frente a su banda MD') + ' · % de la referencia de partido</span></h4><div class="card">';
        if (!M.ref.td) h += '<div class="nota">Sin perfil de partido ni referencia de equipo: no se pueden calcular objetivos. Importa partidos con GPS.</div>';
        else {
            var cumpl = { ok: 0, ambar: 0, mal: 0 };
            h += '<div style="overflow-x:auto"><table class="t obj"><thead><tr><th>Día</th><th>MD</th><th>Min</th>' + MET.map(function (m) { return '<th style="color:' + m.col + '">' + m.lbl + '</th>'; }).join('') + '<th>Cumple</th></tr></thead><tbody>';
            var semanas = {};
            F.slice().reverse().forEach(function (s) {
                var fila = '<tr' + (s.tipo === 'match' ? ' class="par"' : '') + '><td>' + fecha(s.f, true) + (s.tipo === 'match' ? ' <span style="color:#fbbf24">⚽ ' + esc(s.rival) + '</span>' : '') + '</td><td>' + (s.md || '—') + '</td><td>' + fmt(s.min, 0) + '</td>';
                var nOk = 0, nTot = 0;
                MET.forEach(function (m) {
                    var pct = M.ref[m.k] ? s[m.k] / M.ref[m.k] * 100 : null, b = M.banda(s, m.k), e = M.estado(pct, b);
                    if (e) { nTot++; if (e === 'ok') nOk++; }
                    fila += '<td title="' + (b ? 'Objetivo ' + b[0] + '-' + b[1] + '% = ' + fmt(M.ref[m.k] * b[0] / 100, 0) + '-' + fmt(M.ref[m.k] * b[1] / 100, 0) : 'Sin objetivo para este día') + '">' + fmt(s[m.k], 0) + ' ' + pillEstado(e, pct) + '</td>';
                });
                if (nTot) { if (nOk === nTot) cumpl.ok++; else if (nOk >= nTot / 2) cumpl.ambar++; else cumpl.mal++; }
                fila += '<td>' + (nTot ? '<span class="pill" style="background:' + (nOk === nTot ? ST.ok : (nOk >= nTot / 2 ? ST.ambar : ST.rojo)) + '22;color:' + (nOk === nTot ? ST.ok : (nOk >= nTot / 2 ? ST.ambar : ST.rojo)) + '">' + nOk + '/' + nTot + '</span>' : '—') + '</td></tr>';
                var lun = lunesDe(s.f); if (!semanas[lun]) semanas[lun] = []; semanas[lun].push(s);
                h += fila;
            });
            h += '</tbody></table></div>';
            var nd = cumpl.ok + cumpl.ambar + cumpl.mal;
            if (nd) h += '<div class="nota">Días con objetivo: <b style="color:#fff">' + nd + '</b> · cumplidos del todo <b style="color:' + ST.ok + '">' + cumpl.ok + '</b> · a medias <b style="color:' + ST.ambar + '">' + cumpl.ambar + '</b> · fallados <b style="color:' + ST.rojo + '">' + cumpl.mal + '</b>. OK = dentro de la banda; ≈ = a menos de ' + M.tol + ' puntos; ▼ por debajo; ▲ por encima. Pasa el ratón por una celda para ver la banda.</div>';
            // Semana
            var bs = M.bandaSemana('td');
            if (bs && !S.md) {
                h += '<h4 style="margin-top:14px">Objetivo semanal <span>· suma de entrenos de cada semana frente a la banda SEMANA (' + bs[0] + '-' + bs[1] + '% del partido en distancia)</span></h4>';
                Object.keys(semanas).sort().reverse().slice(0, 6).forEach(function (lun) {
                    var ss = semanas[lun].filter(function (s) { return s.tipo !== 'match'; }); if (!ss.length) return;
                    var enCurso = lun === lunesDe(hoy);
                    h += '<div style="font-size:12px;color:#cbd5e1;margin:8px 0 2px"><b>Semana del ' + fecha(lun) + '</b> · ' + ss.length + ' entrenos' + (enCurso ? ' <span style="color:#fbbf24">(en curso · aún no se evalúa)</span>' : '') + '</div>';
                    MET.forEach(function (m) {
                        var b = M.bandaSemana(m.k); if (!b || !M.ref[m.k]) return;
                        var tot = ss.reduce(function (a, s) { return a + s[m.k]; }, 0), pct = tot / M.ref[m.k] * 100, e = enCurso ? 'curso' : M.estado(pct, b);
                        var col = enCurso ? '#94a3b8' : colorEstado(e);
                        var max = Math.max(b[1] * 1.25, pct * 1.05);
                        h += '<div class="bul"><span class="l">' + m.lbl + '</span><div class="bar"><div class="obj" style="left:' + (b[0] / max * 100) + '%;width:' + ((b[1] - b[0]) / max * 100) + '%"></div><div class="val" style="width:' + Math.min(100, pct / max * 100) + '%;background:' + col + '"></div></div><span class="n" style="color:' + col + '">' + fmt(pct, 0) + '% <small>' + fmt(tot, 0) + (m.uni ? ' ' + m.uni : '') + '</small></span></div>';
                    });
                });
            }
        }
        h += '</div>';

        // ---- Tendencia ----
        h += '<h4>Tendencia de carga <span>· por sesión, con media móvil de 5 y referencia de partido</span>'
           + '<span style="margin-left:auto"><select onchange="cmIjSet(\'metrica\',this.value)">' + MET.concat([{ k: 'mmin', lbl: 'm/min' }, { k: 'vmax', lbl: 'Vel. máx' }]).map(function (m) { return '<option value="' + m.k + '"' + (S.metrica === m.k ? ' selected' : '') + '>' + m.lbl + '</option>'; }).join('') + '</select></span></h4>'
           + '<div class="card"><div class="cv"><canvas id="ij-c-tend"></canvas></div><div class="leg"><span><i style="background:' + (MET.filter(function (m) { return m.k === S.metrica; })[0] || { col: '#d97706' }).col + '"></i>Sesión</span><span><i style="background:#fbbf24"></i>Partido</span><span><i style="background:#94a3b8;height:2px"></i>Media móvil (5)</span><span><i style="background:#38bdf8;height:2px"></i>Referencia de partido</span></div></div>';

        // ---- Perfil de partido + comparativa ----
        h += '<div class="g2" style="margin-top:14px"><div>';
        h += '<h4 style="margin-top:0">Perfil de partido a 90\' <span>· él frente a su posición y al equipo</span></h4><div class="card" id="ij-perfil">';
        if (!M.perfil) h += '<div class="nota">Sin partidos con GPS suficientes para un perfil propio (mínimo ' + ((M.cfg && M.cfg.perfil_min_minutes) || 30) + ' min).</div>';
        else {
            var cands = Object.keys(S.d.perfiles);
            var pos = cands.filter(function (pid) { return pid !== j.id && M.grupoDe(pid) === M.posGrupo; });
            var eq = cands.filter(function (pid) { return pid !== j.id; });
            var pf = function (pid, m) { var p = S.d.perfiles[pid]; return Array.isArray(m.prof) ? num(p[m.prof[0]]) + num(p[m.prof[1]]) : num(p[m.prof]); };
            MET.concat([{ k: 'vmax', lbl: 'Vel. máx', col: '#d97706', prof: 'max_speed_kmh', dec: 1 }, { k: 'nsprint', lbl: 'Nº sprints', col: '#ec4899', prof: 'sprint_count_90', dec: 1 }]).forEach(function (m) {
                var yo = pf(j.id, m), mp = media(pos.map(function (p) { return pf(p, m) || null; })), me = media(eq.map(function (p) { return pf(p, m) || null; }));
                var max = Math.max(yo, mp || 0, me || 0) * 1.1 || 1;
                h += '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:#cbd5e1">' + m.lbl + '</span><span style="color:#fff;font-weight:700">' + fmt(yo, m.dec) + (mp ? ' <span style="color:#94a3b8;font-weight:500">· ' + fmt(yo / mp * 100, 0) + '% de su posición</span>' : '') + '</span></div>'
                   + '<div style="display:grid;gap:3px;margin-top:3px">'
                   + '<div style="height:9px;background:#1e293b;border-radius:3px"><div style="height:100%;width:' + (yo / max * 100) + '%;background:' + m.col + ';border-radius:3px"></div></div>'
                   + (mp ? '<div style="height:5px;background:#1e293b;border-radius:3px"><div style="height:100%;width:' + (mp / max * 100) + '%;background:#94a3b8;border-radius:3px" title="Media de su posición: ' + fmt(mp, m.dec) + '"></div></div>' : '')
                   + (me ? '<div style="height:5px;background:#1e293b;border-radius:3px"><div style="height:100%;width:' + (me / max * 100) + '%;background:#475569;border-radius:3px" title="Media del equipo: ' + fmt(me, m.dec) + '"></div></div>' : '')
                   + '</div></div>';
            });
            h += '<div class="leg"><span><i style="background:#3b82f6"></i>Él (barra gruesa)</span><span><i style="background:#94a3b8"></i>Media de ' + esc(M.posGrupo.toLowerCase()) + ' (' + pos.length + ')</span><span><i style="background:#475569"></i>Media del equipo (' + eq.length + ')</span></div>'
               + '<div class="nota">Perfil = media de sus partidos proyectada a 90 minutos (' + M.perfil.n_partidos + ' partidos, ' + fmt(M.perfil.min_totales, 0) + ' min). Vel. máx = su máximo absoluto.</div>';
        }
        h += '</div></div><div>';
        // Comparativa entrenos (z-score vs posicion)
        h += '<h4 style="margin-top:0">Comparativa en entrenos <span>· z-score frente a su posición, mismo periodo</span></h4><div class="card">';
        var desde = S.rango ? addDias(hoy, -S.rango) : '0000-00-00';
        var misE = ent;
        var otrosPos = Object.keys(M.porJug).filter(function (pid) { return pid !== j.id && M.grupoDe(pid) === M.posGrupo; });
        if (otrosPos.length < 2) otrosPos = Object.keys(M.porJug).filter(function (pid) { return pid !== j.id; });
        var refNombre = otrosPos.length && M.grupoDe(otrosPos[0]) === M.posGrupo && otrosPos.length >= 2 ? M.posGrupo.toLowerCase() : 'equipo';
        if (!misE.length || !otrosPos.length) h += '<div class="nota">Sin sesiones de entreno suficientes en el periodo.</div>';
        else {
            MET.concat([{ k: 'mmin', lbl: 'm/min', col: '#d97706', dec: 1 }, { k: 'vmax', lbl: 'Vel. máx', col: '#d97706', dec: 1 }]).forEach(function (m) {
                var mio = media(misE.map(function (s) { return s[m.k]; }));
                var medias = otrosPos.map(function (pid) { return media(M.porJug[pid].training.filter(function (s) { return s.f >= desde && (!S.md || s.md === S.md); }).map(function (s) { return s[m.k]; })); }).filter(function (x) { return x !== null; });
                var mu = media(medias), sg = sd(medias);
                if (mio === null || mu === null) return;
                var z = sg ? (mio - mu) / sg : 0, zc = Math.max(-3, Math.min(3, z));
                var col = Math.abs(z) < 1 ? '#94a3b8' : (Math.abs(z) < 2 ? ST.ambar : (z > 0 ? m.col : ST.rojo));
                h += '<div class="zs"><span class="l">' + m.lbl + '</span><div class="ax"><i style="background:' + col + ';' + (zc >= 0 ? 'left:50%;width:' + (zc / 3 * 50) + '%' : 'right:50%;width:' + (-zc / 3 * 50) + '%') + '"></i></div><span class="n"><b style="color:#fff">' + fmt(mio, m.dec || 0) + '</b> <span style="color:#64748b">vs ' + fmt(mu, m.dec || 0) + '</span> · z ' + (z > 0 ? '+' : '') + fmt(z, 1) + '</span></div>';
            });
            h += '<div class="nota">Su media por sesión frente a la media de los ' + otrosPos.length + ' jugadores de ' + refNombre + ' en el mismo periodo' + (S.md ? ' y mismo día (' + S.md + ')' : '') + '. z entre −1 y +1 es normal; más de ±2 destaca mucho.</div>';
        }
        h += '</div></div></div>';

        // ---- Comparar jugadores ----
        h += '<h4>Comparar con otros jugadores <span>· elige con quién, qué métrica y en qué sesiones</span></h4><div class="card" id="ij-cmp"></div>';

        // ---- Wellness, RPE, peso ----
        var wF = M.well.filter(function (w) { return w.f >= desde; });
        h += '<h4>Wellness diario <span>· lo que responde el jugador antes de entrenar (1-10)</span></h4><div class="card">';
        if (!wF.filter(function (w) { return w.sueno !== null; }).length) h += '<div class="nota">Sin respuestas de wellness en el periodo. Se recogen desde el enlace wellness de cada jugador.</div>';
        else h += '<div class="cv s"><canvas id="ij-c-well"></canvas></div><div class="leg">' + WELL.map(function (w) { return '<span><i style="background:' + w.col + '"></i>' + w.lbl + '</span>'; }).join('') + '</div>';
        h += '</div>';
        h += '<div class="g2" style="margin-top:14px"><div><h4 style="margin-top:0">RPE y carga interna <span>· sRPE = RPE × minutos</span></h4><div class="card">';
        if (!wF.filter(function (w) { return w.rpe !== null; }).length) h += '<div class="nota">Sin RPE en el periodo.</div>';
        else h += '<div class="cv s"><canvas id="ij-c-rpe"></canvas></div><div class="nota">Barras: sRPE (UA). Punto: RPE 1-10. Media del periodo: RPE ' + fmt(media(wF.map(function (w) { return w.rpe === null ? null : num(w.rpe); })), 1) + '.</div>';
        h += '</div></div><div><h4 style="margin-top:0">Peso <span>· variación respecto a su referencia</span></h4><div class="card">';
        var pF = pesos.filter(function (w) { return w.f >= desde; });
        if (pesos.length < 2) h += '<div class="nota">Sin registros de peso suficientes.</div>';
        else {
            var baseP = media(pesos.slice(0, Math.min(10, pesos.length - 1)).map(function (w) { return w.peso; }));
            var pu = pesos[pesos.length - 1];
            h += '<div style="display:flex;gap:16px;align-items:baseline;margin-bottom:4px;flex-wrap:wrap"><span style="font-size:24px;font-weight:800;color:#fff;white-space:nowrap">' + fmt(pu.peso, 1) + ' kg</span><span style="color:' + (Math.abs((pu.peso - baseP) / baseP * 100) >= 2 ? ST.ambar : '#94a3b8') + ';font-size:12.5px">' + ((pu.peso - baseP) >= 0 ? '+' : '') + fmt(pu.peso - baseP, 1) + ' kg (' + ((pu.peso - baseP) >= 0 ? '+' : '') + fmt((pu.peso - baseP) / baseP * 100, 1) + '%) vs referencia ' + fmt(baseP, 1) + ' kg · ' + fecha(pu.f) + '</span></div>'
               + '<div class="cv s"><canvas id="ij-c-peso"></canvas></div>';
        }
        h += '</div></div></div>';

        // ---- Zonas de velocidad ----
        var zn = (M.cfg && M.cfg.zone_names) || ['Andando', 'Trote', 'Carrera', 'Alta intensidad', 'Sprint'];
        var zt = (M.cfg && M.cfg.zone_thresholds) || [0, 7, 14, 19, 25];
        var conZ = F.filter(function (s) { return s.z.some(function (v) { return v > 0; }); });
        h += '<h4>Distancia por zonas de velocidad <span>· metros en cada zona por sesión</span></h4><div class="card">';
        if (!conZ.length) h += '<div class="nota">Las sesiones del periodo no traen distancia por zonas.</div>';
        else h += '<div class="cv"><canvas id="ij-c-zonas"></canvas></div><div class="leg">' + zn.map(function (n, i) { return '<span><i style="background:' + ['#334155', '#3b82f6', '#0d9488', '#d97706', '#e11d48'][i] + '"></i>' + esc(n) + (zt[i] !== undefined ? ' (' + zt[i] + (zt[i + 1] !== undefined ? '-' + zt[i + 1] : '+') + ' km/h)' : '') + '</span>'; }).join('') + '</div>';
        h += '</div>';

        // ---- Tabla completa ----
        h += '<h4>Todas las sesiones del periodo <span>· ' + F.length + '</span></h4><div class="card" style="padding:0;overflow-x:auto"><table class="t"><thead><tr><th>Día</th><th>Sesión</th><th>MD</th><th>Min</th><th>Dist.</th><th>m/min</th><th>HSR</th><th>Sprint</th><th>Nº spr.</th><th>Acel</th><th>Desac.</th><th>V máx</th><th>% part.</th></tr></thead><tbody>';
        F.slice().reverse().forEach(function (s) {
            h += '<tr' + (s.tipo === 'match' ? ' class="par"' : '') + '><td>' + fecha(s.f, true) + '</td><td style="text-align:left;max-width:170px;overflow:hidden;text-overflow:ellipsis">' + esc(s.tipo === 'match' ? 'vs ' + s.rival : s.titulo) + '</td><td>' + (s.md || '—') + '</td><td>' + fmt(s.min, 0) + '</td><td>' + fmt(s.td, 0) + '</td><td>' + fmt(s.mmin, 1) + '</td><td>' + fmt(s.hsr, 0) + '</td><td>' + fmt(s.sprint, 0) + '</td><td>' + fmt(s.nsprint, 0) + '</td><td>' + fmt(num(s.d.accel_count), 0) + '</td><td>' + fmt(num(s.d.decel_count), 0) + '</td><td>' + fmt(s.vmax, 1) + '</td><td>' + (M.ref.td ? fmt(s.td / M.ref.td * 100, 0) + '%' : '—') + '</td></tr>';
        });
        h += '</tbody></table></div>';
        h += '<div class="nota" style="margin-top:10px">Informe generado el ' + new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + '. Umbrales del club: HSR > ' + ((M.cfg && M.cfg.hsr_threshold_kmh) || 19) + ' km/h, sprint > ' + ((M.cfg && M.cfg.sprint_threshold_kmh) || 24) + ' km/h. Las varias sesiones GPS de un mismo día se suman.</div>';
        h += '</div>';
        S.cont.innerHTML = h;
        pintarCharts(M, F, wF, pF, conZ, zn);
        renderCmp();
    }

    /* ---------- Comparar jugadores ---------- */
    function sesionesDe(pid, M) {
        // sesiones de un jugador sumadas por dia y tipo (igual que las del informe)
        var pj = M.porJug[pid]; if (!pj) return [];
        var porDia = {};
        pj.training.concat(pj.match).forEach(function (s) {
            var tipo = s.md === 'MD' ? 'match' : 'training', k = s.f + '|' + tipo;
            if (!porDia[k]) { porDia[k] = Object.assign({ tipo: tipo }, s); return; }
            var a = porDia[k]; a.min += s.min;
            MET.forEach(function (m) { a[m.k] += s[m.k]; });
            a.vmax = Math.max(a.vmax || 0, s.vmax || 0); a.nsprint = (a.nsprint || 0) + (s.nsprint || 0);
            a.mmin = a.min > 0 ? a.td / a.min : null;
        });
        return Object.keys(porDia).map(function (k) { return porDia[k]; }).sort(function (a, b) { return a.f < b.f ? -1 : 1; });
    }
    function sesionesGrupo(pids, M) {
        var acc = {}, keys = ['min', 'vmax', 'nsprint', 'mmin'].concat(MET.map(function (m) { return m.k; }));
        pids.forEach(function (pid) {
            sesionesDe(pid, M).forEach(function (s) {
                var k = s.f + '|' + s.tipo;
                if (!acc[k]) { acc[k] = { f: s.f, tipo: s.tipo, md: s.md, n: 0, sum: {}, cnt: {} }; }
                var a = acc[k]; a.n++;
                keys.forEach(function (x) { var v = s[x]; if (v === null || v === undefined || isNaN(v)) return; a.sum[x] = (a.sum[x] || 0) + v; a.cnt[x] = (a.cnt[x] || 0) + 1; });
            });
        });
        return Object.keys(acc).map(function (k) {
            var a = acc[k], o = { f: a.f, tipo: a.tipo, md: a.md, n: a.n };
            keys.forEach(function (x) { o[x] = a.cnt[x] ? a.sum[x] / a.cnt[x] : null; });
            return o;
        }).filter(function (o) { return o.n >= 2; }).sort(function (a, b) { return a.f < b.f ? -1 : 1; });
    }
    function serieVirtual(id, M, j) {
        // 'equipo' o 'grp:Centrocampistas' -> media de ese grupo (sin el propio jugador)
        var pids = Object.keys(M.porJug).filter(function (pid) { return pid !== j.id; });
        var nombre = 'Media del equipo';
        if (id.indexOf('grp:') === 0) { var g = id.slice(4); pids = pids.filter(function (pid) { return M.grupoDe(pid) === g; }); nombre = 'Media ' + g.toLowerCase(); }
        return { nombre: nombre + ' (' + pids.length + ')', ss: sesionesGrupo(pids, M), virtual: true };
    }
    function cmpMetricas() { return MET.concat(EXTRA.map(function (m) { return { k: m.k, lbl: m.lbl, dec: m.dec, uni: m.uni || '' }; })); }
    function renderCmp() {
        var c = document.getElementById('ij-cmp'); if (!c || !S.m) return;
        var M = S.m, j = S.j, C = S.cmp, hoy = iso(new Date());
        var ids = [j.id].concat([C.p2, C.p3].filter(function (x) { return x && x !== j.id; }));
        ids = ids.filter(function (x, i) { return ids.indexOf(x) === i; });
        var desde = C.rango ? addDias(hoy, -C.rango) : '0000-00-00';
        var met = cmpMetricas().filter(function (m) { return m.k === C.met; })[0] || MET[0];
        var filtrar = function (ss) { return ss.filter(function (s) { if (s.f < desde) return false; if (C.tipo === 'training' && s.tipo === 'match') return false; if (C.tipo === 'match' && s.tipo !== 'match') return false; if (C.md && s.md !== C.md) return false; return s[met.k] !== null && s[met.k] !== undefined; }); };
        var series = ids.map(function (pid, i) {
            if (pid === 'equipo' || pid.indexOf('grp:') === 0) { var v = serieVirtual(pid, M, j); return { pid: pid, nombre: v.nombre, col: CMPCOL[i], ss: filtrar(v.ss), virtual: true }; }
            var pj = S.d.jug[pid] || { name: pid === j.id ? j.name : '?' }; return { pid: pid, nombre: pj.name, col: CMPCOL[i], ss: filtrar(sesionesDe(pid, M)) };
        });
        // selects
        var jugadores = Object.keys(S.d.jug).filter(function (pid) { return pid !== j.id; }).map(function (pid) { return S.d.jug[pid]; }).sort(function (a, b) { var ga = grupoPos(a.position_detail || (a.positions_main && a.positions_main[0])), gb = grupoPos(b.position_detail || (b.positions_main && b.positions_main[0])); return ga === gb ? (a.name < b.name ? -1 : 1) : (ga < gb ? -1 : 1); });
        var grupos = {}; Object.keys(M.porJug).forEach(function (pid) { if (pid !== j.id) grupos[M.grupoDe(pid)] = (grupos[M.grupoDe(pid)] || 0) + 1; });
        var optJug = function (sel) { var h = '<option value="">— nadie —</option>', g = '';
            h += '<optgroup label="Medias"><option value="equipo"' + (sel === 'equipo' ? ' selected' : '') + '>Media del equipo</option>' + Object.keys(grupos).sort().map(function (gp) { return '<option value="grp:' + esc(gp) + '"' + (sel === 'grp:' + gp ? ' selected' : '') + '>Media ' + esc(gp.toLowerCase()) + ' (' + grupos[gp] + ')</option>'; }).join('') + '</optgroup>'; jugadores.forEach(function (p) { var gp = grupoPos(p.position_detail || (p.positions_main && p.positions_main[0])); if (gp !== g) { if (g) h += '</optgroup>'; h += '<optgroup label="' + esc(gp) + '">'; g = gp; } var tiene = M.porJug[p.id] ? '' : ' (sin GPS)'; h += '<option value="' + p.id + '"' + (sel === p.id ? ' selected' : '') + '>' + esc(p.name) + tiene + '</option>'; }); if (g) h += '</optgroup>'; return h; };
        var mds = {}; Object.keys(M.porJug).forEach(function (pid) { M.porJug[pid].training.forEach(function (s) { if (s.md) mds[s.md] = 1; }); });
        var ordenMd = ['MD-6', 'MD-5', 'MD-4', 'MD-3', 'MD-2', 'MD-1', 'MD', 'MD+1', 'MD+2', 'MD+3'];
        var h = '<div class="flt" style="margin-left:0;margin-bottom:10px">'
            + '<label class="cl"><span>Jugador 2</span><select onchange="cmIjCmp(\'p2\',this.value)">' + optJug(C.p2) + '</select></label>'
            + '<label class="cl"><span>Jugador 3</span><select onchange="cmIjCmp(\'p3\',this.value)">' + optJug(C.p3) + '</select></label>'
            + '<label class="cl"><span>Métrica</span><select onchange="cmIjCmp(\'met\',this.value)">' + cmpMetricas().map(function (m) { return '<option value="' + m.k + '"' + (C.met === m.k ? ' selected' : '') + '>' + m.lbl + '</option>'; }).join('') + '</select></label>'
            + '<label class="cl"><span>Sesiones</span><select onchange="cmIjCmp(\'tipo\',this.value)"><option value="all"' + (C.tipo === 'all' ? ' selected' : '') + '>Entrenos y partidos</option><option value="training"' + (C.tipo === 'training' ? ' selected' : '') + '>Solo entrenos</option><option value="match"' + (C.tipo === 'match' ? ' selected' : '') + '>Solo partidos</option></select></label>'
            + '<label class="cl"><span>Día</span><select onchange="cmIjCmp(\'md\',this.value)"><option value="">Todos</option>' + ordenMd.filter(function (k) { return k === 'MD' || mds[k]; }).map(function (k) { return '<option value="' + k + '"' + (C.md === k ? ' selected' : '') + '>' + (k === 'MD' ? 'Partidos (MD)' : k) + '</option>'; }).join('') + '</select></label>'
            + '<label class="cl"><span>Periodo</span><select onchange="cmIjCmp(\'rango\',this.value)">' + [[28, 'Últimas 4 semanas'], [56, 'Últimas 8 semanas'], [112, 'Últimas 16 semanas'], [0, 'Toda la temporada']].map(function (o) { return '<option value="' + o[0] + '"' + (C.rango === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>'
            + '<label class="cl"><span>Vista</span><select onchange="cmIjCmp(\'vista\',this.value)"><option value="sesion"' + (C.vista === 'sesion' ? ' selected' : '') + '>Sesión a sesión</option><option value="media"' + (C.vista === 'media' ? ' selected' : '') + '>Medias</option></select></label>'
            + '</div>';
        if (ids.length < 2) h += '<div class="nota">Elige al menos un jugador más para comparar.</div>';
        else {
            var conDatos = series.filter(function (x) { return x.ss.length; });
            if (!conDatos.length) h += '<div class="nota">Sin sesiones con esos filtros.</div>';
            else {
                h += '<div class="cv"><canvas id="ij-c-cmp"></canvas></div><div class="leg">' + series.map(function (x) { return '<span><i style="background:' + x.col + '"></i>' + esc(x.nombre) + ' (' + x.ss.length + ' ses.)</span>'; }).join('') + '</div>';
                // tabla resumen
                var mia = media(series[0].ss.map(function (s) { return s[met.k]; }));
                h += '<div style="overflow-x:auto;margin-top:10px"><table class="t"><thead><tr><th style="text-align:left">Jugador</th><th>Sesiones</th><th>Media</th><th>Máximo</th><th>Mínimo</th><th>Total</th><th>vs ' + esc(j.name.split(' ')[0]) + '</th></tr></thead><tbody>';
                series.forEach(function (x) {
                    var v = x.ss.map(function (s) { return s[met.k]; }), mu = media(v);
                    var dif = (mia && mu !== null && x.pid !== j.id) ? (mu - mia) / mia * 100 : null;
                    h += '<tr><td style="text-align:left"><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:' + x.col + ';margin-right:6px;vertical-align:middle"></i>' + esc(x.nombre) + '</td><td>' + v.length + '</td><td style="color:#fff;font-weight:700">' + fmt(mu, met.dec) + '</td><td>' + (v.length ? fmt(Math.max.apply(null, v), met.dec) : '—') + '</td><td>' + (v.length ? fmt(Math.min.apply(null, v), met.dec) : '—') + '</td><td>' + (met.k === 'vmax' || met.k === 'mmin' ? '—' : fmt(v.reduce(function (a, b) { return a + b; }, 0), met.dec)) + '</td><td style="color:' + (dif === null ? '#64748b' : (dif > 0 ? ST.ok : ST.rojo)) + '">' + (dif === null ? '—' : (dif > 0 ? '+' : '') + fmt(dif, 0) + '%') + '</td></tr>';
                });
                h += '</tbody></table></div><div class="nota">' + met.lbl + (met.uni ? ' (' + met.uni + ')' : '') + ' por sesión (las sesiones del mismo día se suman; las "medias" de equipo o posición no incluyen a ' + esc(j.name) + ' y solo cuentan días con 2 o más jugadores con GPS). "vs" = diferencia de la media frente a ' + esc(j.name) + '. Pasa el ratón por la gráfica para ver cada sesión.</div>';
            }
        }
        c.innerHTML = h;
        // grafica
        var ctx = document.getElementById('ij-c-cmp'); if (!ctx || typeof Chart === 'undefined') return;
        if (S.chartCmp) { try { S.chartCmp.destroy(); } catch (e) {} S.chartCmp = null; }
        if (C.vista === 'media') {
            S.chartCmp = new Chart(ctx, { type: 'bar', data: { labels: series.map(function (x) { return x.nombre; }), datasets: [{ label: met.lbl, data: series.map(function (x) { return media(x.ss.map(function (s) { return s[met.k]; })); }), backgroundColor: series.map(function (x) { return x.col; }), borderRadius: 4, barPercentage: .45, categoryPercentage: .7 }] },
                options: base({ indexAxis: 'y', plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (it) { var x = series[it.dataIndex]; return 'Media: ' + fmt(it.raw, met.dec) + (met.uni ? ' ' + met.uni : '') + ' · ' + x.ss.length + ' sesiones'; } } } }, scales: { x: { grid: { color: gridCol() }, ticks: { color: tickCol(), font: { size: 10 } }, beginAtZero: true }, y: { grid: { display: false }, ticks: { color: cc('#cbd5e1', '#1e293b'), font: { size: 12 } } } } }) });
        } else {
            var fechas = {}; series.forEach(function (x) { x.ss.forEach(function (s) { fechas[s.f + '|' + s.tipo] = s; }); });
            var keys = Object.keys(fechas).sort();
            var ds = series.map(function (x) { var map = {}; x.ss.forEach(function (s) { map[s.f + '|' + s.tipo] = s; }); return { label: x.nombre, data: keys.map(function (k) { return map[k] ? map[k][met.k] : null; }), borderColor: x.col, backgroundColor: x.col, borderWidth: 2, pointRadius: keys.map(function (k) { return fechas[k].tipo === 'match' ? 6 : 4; }), pointStyle: keys.map(function (k) { return fechas[k].tipo === 'match' ? 'rectRot' : 'circle'; }), tension: .2, spanGaps: false, _map: map }; });
            S.chartCmp = new Chart(ctx, { type: 'line', data: { labels: keys.map(function (k) { return fecha(k.slice(0, 10)); }), datasets: ds },
                options: base({ plugins: { legend: { display: false }, tooltip: { callbacks: { title: function (it) { var s = fechas[keys[it[0].dataIndex]]; return fecha(s.f, true) + ' · ' + (s.tipo === 'match' ? 'Partido' : s.md); }, label: function (it) { var s = it.dataset._map[keys[it.dataIndex]]; return it.dataset.label + ': ' + fmt(it.raw, met.dec) + (met.uni ? ' ' + met.uni : '') + (s && s.n ? ' · ' + s.n + ' jugadores' : (s && s.min ? ' · ' + fmt(s.min, 0) + ' min' : '')); } } } } }) });
        }
    }
    window.cmIjCmp = function (k, v) { if (k === 'rango') v = parseInt(v, 10) || 0; S.cmp[k] = v; renderCmp(); };

    function calcAcwr(M) {
        var hoy = iso(new Date()), sem = (M.cfg && M.cfg.acwr_chronic_weeks) || 4;
        var ag = addDias(hoy, -7), cr = addDias(hoy, -7 * sem);
        var r = {};
        MET.forEach(function (m) {
            var a = 0, c = 0;
            M.todas.forEach(function (s) { if (s.f > ag && s.f <= hoy) a += s[m.k]; if (s.f > cr && s.f <= hoy) c += s[m.k]; });
            var cs = c / sem; r[m.k] = cs > 0 ? a / cs : null;
        });
        return r;
    }

    /* ---------- Graficos (Chart.js) ---------- */
    function cc(oscuro, claro) { return S.luz ? claro : oscuro; }
    function gridCol() { return S.luz ? 'rgba(15,23,42,.1)' : 'rgba(148,163,184,.08)'; }
    function tickCol() { return S.luz ? '#475569' : '#94a3b8'; }
    function base(extra) {
        return Object.assign({ responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', borderColor: cc('#334155', '#cbd5e1'), borderWidth: 1, titleColor: '#fff', bodyColor: '#cbd5e1', padding: 10 } },
            scales: { x: { grid: { color: gridCol() }, ticks: { color: tickCol(), font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } }, y: { grid: { color: gridCol() }, ticks: { color: tickCol(), font: { size: 10 } }, beginAtZero: true } } }, extra || {});
    }
    function pintarCharts(M, F, wF, pF, conZ, zn) {
        if (typeof Chart === 'undefined') return;
        var ctx;
        // Tendencia
        ctx = document.getElementById('ij-c-tend');
        if (ctx && F.length) {
            var m = MET.filter(function (x) { return x.k === S.metrica; })[0] || { k: S.metrica, col: '#d97706', lbl: S.metrica === 'mmin' ? 'm/min' : 'Vel. máx' };
            var labels = F.map(function (s) { return fecha(s.f); });
            var vals = F.map(function (s) { return s[m.k]; });
            var mm = vals.map(function (v, i) { var sl = F.slice(Math.max(0, i - 4), i + 1).filter(function (s) { return s.tipo !== 'match'; }).map(function (s) { return s[m.k]; }); return sl.length >= 3 ? media(sl) : null; });
            var ref = M.ref[m.k] || (m.k === 'vmax' ? (M.perfil ? num(M.perfil.max_speed_kmh) : null) : null);
            var ds = [
                { type: 'bar', data: vals, backgroundColor: F.map(function (s) { return s.tipo === 'match' ? cc('#fbbf24', '#d97706') : m.col; }), borderRadius: 3, barPercentage: .7, categoryPercentage: .8, order: 3, label: m.lbl },
                { type: 'line', data: mm, borderColor: cc('#94a3b8', '#64748b'), borderWidth: 2, borderDash: [4, 3], pointRadius: 0, tension: .3, spanGaps: true, order: 2, label: 'Media móvil 5' }
            ];
            if (ref) ds.push({ type: 'line', data: vals.map(function () { return ref; }), borderColor: cc('#38bdf8', '#0284c7'), borderWidth: 1.5, pointRadius: 0, order: 1, label: 'Referencia partido' });
            S.charts.push(new Chart(ctx, { data: { labels: labels, datasets: ds }, options: base({ plugins: { legend: { display: false }, tooltip: { callbacks: { title: function (it) { var s = F[it[0].dataIndex]; return fecha(s.f, true) + ' · ' + (s.tipo === 'match' ? 'Partido vs ' + s.rival : s.md + ' · ' + s.titulo); }, label: function (it) { return it.dataset.label + ': ' + fmt(it.raw, m.dec || 1); } } } } }) }));
        }
        // Wellness
        ctx = document.getElementById('ij-c-well');
        if (ctx) {
            var ws = wF.filter(function (w) { return w.sueno !== null || w.fatiga !== null || w.estres !== null || w.musc !== null; });
            S.charts.push(new Chart(ctx, { type: 'line', data: { labels: ws.map(function (w) { return fecha(w.f); }), datasets: WELL.map(function (w) { return { label: w.lbl, data: ws.map(function (x) { return x[w.k] === null ? null : num(x[w.k]); }), borderColor: w.col, backgroundColor: w.col, borderWidth: 2, pointRadius: 3, tension: .3, spanGaps: true }; }) }, options: base({ scales: { x: { grid: { color: gridCol() }, ticks: { color: tickCol(), font: { size: 10 }, maxTicksLimit: 12 } }, y: { min: 0, max: 10, grid: { color: gridCol() }, ticks: { color: tickCol(), font: { size: 10 }, stepSize: 2 } } } }) }));
        }
        // RPE
        ctx = document.getElementById('ij-c-rpe');
        if (ctx) {
            var rs = wF.filter(function (w) { return w.rpe !== null; });
            S.charts.push(new Chart(ctx, { data: { labels: rs.map(function (w) { return fecha(w.f); }), datasets: [
                { type: 'bar', label: 'sRPE (UA)', data: rs.map(function (w) { return num(w.rpe) * num(w.dur); }), backgroundColor: '#d97706', borderRadius: 3, barPercentage: .7, yAxisID: 'y' }
            ] }, options: base({ plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (it) { var w = rs[it.dataIndex]; return 'RPE ' + w.rpe + ' × ' + fmt(w.dur, 0) + ' min = ' + fmt(it.raw, 0) + ' UA'; } } } } }) }));
        }
        // Peso
        ctx = document.getElementById('ij-c-peso');
        if (ctx && pF.length) {
            var todosP = M.well.filter(function (w) { return w.peso !== null && w.peso > 30; });
            var baseP = media(todosP.slice(0, Math.min(10, todosP.length - 1)).map(function (w) { return w.peso; }));
            var ps = pF.length >= 2 ? pF : todosP.slice(-10);
            var vmin = Math.min.apply(null, ps.map(function (w) { return w.peso; }).concat([baseP])) - 1, vmax = Math.max.apply(null, ps.map(function (w) { return w.peso; }).concat([baseP])) + 1;
            S.charts.push(new Chart(ctx, { type: 'line', data: { labels: ps.map(function (w) { return fecha(w.f); }), datasets: [
                { label: 'Peso', data: ps.map(function (w) { return w.peso; }), borderColor: '#3b82f6', backgroundColor: '#3b82f6', borderWidth: 2, pointRadius: 3, tension: .25 },
                { label: 'Referencia', data: ps.map(function () { return baseP; }), borderColor: '#94a3b8', borderWidth: 1.5, borderDash: [4, 3], pointRadius: 0 }
            ] }, options: base({ scales: { x: { grid: { color: gridCol() }, ticks: { color: tickCol(), font: { size: 10 }, maxTicksLimit: 10 } }, y: { min: Math.floor(vmin), max: Math.ceil(vmax), grid: { color: gridCol() }, ticks: { color: tickCol(), font: { size: 10 }, callback: function (v) { return v + ' kg'; } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (it) { return it.dataset.label + ': ' + fmt(it.raw, 1) + ' kg'; } } } } }) }));
        }
        // Zonas
        ctx = document.getElementById('ij-c-zonas');
        if (ctx && conZ.length) {
            var cols = [cc('#334155', '#cbd5e1'), '#3b82f6', '#0d9488', '#d97706', '#e11d48'];
            S.charts.push(new Chart(ctx, { type: 'bar', data: { labels: conZ.map(function (s) { return fecha(s.f); }), datasets: zn.map(function (n, i) { return { label: n, data: conZ.map(function (s) { return s.z[i]; }), backgroundColor: cols[i], borderColor: '#111c33', borderWidth: 1, borderRadius: 2, barPercentage: .75 }; }) }, options: base({ scales: { x: { stacked: true, grid: { color: gridCol() }, ticks: { color: tickCol(), font: { size: 10 }, maxTicksLimit: 12 } }, y: { stacked: true, grid: { color: gridCol() }, ticks: { color: tickCol(), font: { size: 10 } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: function (it) { var s = conZ[it[0].dataIndex]; return fecha(s.f, true) + ' · ' + (s.md || '') + ' · ' + fmt(s.td, 0) + ' m'; }, label: function (it) { return it.dataset.label + ': ' + fmt(it.raw, 0) + ' m (' + fmt(it.raw / (conZ[it.dataIndex].td || 1) * 100, 0) + '%)'; } } } } }) }));
        }
    }

    /* ---------- PDF: vista de impresion con los graficos como imagen ---------- */
    var PRINT_CSS = ''
        + 'body{margin:0;padding:14px;background:#fff;color:#0f172a;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
        + '.ij{color:#1e293b}.ij .nm,.ij .sem b,.ij .kpi .v{color:#0f172a}.ij .sub,.ij .sub b,.ij .kpi .l,.ij .kpi .d,.ij .kpi .v small,.ij h4,.ij .leg,.ij .nota,.ij .t th,.ij .bul .n small,.ij .sem small,.ij .cl{color:#475569}'
        + '.ij h4 span{color:#64748b}.ij .foto{background:#f1f5f9;border-color:#cbd5e1}.ij .foto.ini{color:#64748b}'
        + '.ij .sem{background:#f8fafc;border-color:#cbd5e1}.ij .sem .dot{box-shadow:0 0 0 4px rgba(0,0,0,.05)}'
        + '.ij .kpi{background:#f8fafc;border-top-color:#cbd5e1}.ij .card{background:#fff;border-color:#cbd5e1}'
        + '.ij .t td{border-bottom-color:#e2e8f0;color:#1e293b}.ij .t th{border-bottom-color:#cbd5e1}.ij .t tr.par td{color:#b45309}.ij .t tr.sem td{background:#e0f2fe;color:#0369a1}'
        + '.ij .bul .l,.ij .zs .l,.ij .zs .n{color:#1e293b}.ij .bul .bar,.ij .zs .ax{background:#e2e8f0}.ij .bul .obj{background:rgba(2,132,199,.18);border-color:#0284c7}.ij .zs .ax::before{background:#94a3b8}'
        + '.ij .al{background:#f1f5f9;color:#1e293b}.ij .pill{filter:saturate(1.1)}'
        + '.ij .cv{height:auto}.ij .card{break-inside:auto}.ij .kpis,.ij .g2,.ij .cv,.ij .bul,.ij tr{break-inside:avoid}.ij h4{break-after:avoid}@page{size:A4;margin:10mm}'
        + '.ij .t td,.ij .t th{white-space:normal}.ij .t td:nth-child(2),.ij .t.obj td{white-space:nowrap}';
    var MAPA_CLARO = [['#ffffff', '#0f172a'], ['#fff', '#0f172a'], ['#e2e8f0', '#1e293b'], ['#cbd5e1', '#1e293b'], ['#94a3b8', '#475569'], ['#1e293b', '#e2e8f0'], ['#111c33', '#ffffff'], ['#0f172a', '#ffffff'], ['#334155', '#cbd5e1'], ['#475569', '#94a3b8'], ['#fbbf24', '#d97706'], ['#38bdf8', '#0284c7'], ['rgba(255,255,255,.06)', 'rgba(0,0,0,.05)']];
    function aclarar(style) {
        // sustituye colores de tema oscuro por su equivalente claro en estilos en linea (de una vez, sin encadenar)
        return style.replace(/#[0-9a-fA-F]{3,6}\b|rgba\([^)]*\)/g, function (c) { var lc = c.toLowerCase(); for (var i = 0; i < MAPA_CLARO.length; i++) if (MAPA_CLARO[i][0] === lc) return MAPA_CLARO[i][1]; return c; });
    }
    window.cmIjPdf = function () {
        var root = document.getElementById('ij-root'); if (!root) return;
        // 1) repintar las graficas en modo claro, 2) clonar, 3) volver al modo oscuro
        S.luz = true;
        try { render(); } catch (e) { S.luz = false; render(); return; }
        var clon = root.cloneNode(true);
        Array.prototype.forEach.call(clon.querySelectorAll('canvas'), function (c) {
            var orig = document.getElementById(c.id); var img = document.createElement('img');
            try { img.src = orig.toDataURL('image/png'); } catch (e) {}
            img.style.cssText = 'width:100%;height:auto;display:block'; c.parentNode.replaceChild(img, c);
        });
        S.luz = false; render();
        Array.prototype.forEach.call(clon.querySelectorAll('.flt, select, button'), function (e) { e.remove(); });
        Array.prototype.forEach.call(clon.querySelectorAll('[style]'), function (e) { e.setAttribute('style', aclarar(e.getAttribute('style'))); });
        var w = window.open('', '_blank'); if (!w) { alert('El navegador ha bloqueado la ventana. Permite las ventanas emergentes para exportar.'); return; }
        w.document.write('<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Informe · ' + esc(S.j.name) + '</title><style>'
            + CSS + PRINT_CSS
            + '</style></head><body>' + clon.outerHTML
            + '<div style="margin-top:16px;color:#64748b;font-size:11px">TopLiderCoach · Informe individual de carga · ' + new Date().toLocaleDateString('es-ES') + '</div>'
            + '<script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script></body></html>');
        w.document.close();
    };

    /* ---------- Publico ---------- */
    window.cmIjSet = function (k, v) {
        if (k === 'rango') v = parseInt(v, 10) || 0;
        S[k] = v; render();
    };
    var origInforme = window.cmPfCargarInforme;
    window.cmPfCargarInforme = async function () {
        var c = document.getElementById('cmpf-tab-informe');
        if (!c || !window.cmPfJugadorActual) return;
        var j = window.cmPfJugadorActual;
        S.cont = c; S.j = j;
        if (!document.getElementById('ij-css')) { var st = document.createElement('style'); st.id = 'ij-css'; st.textContent = CSS; document.head.appendChild(st); }
        c.innerHTML = '<div class="cmpf-empty"><div class="icon">...</div><p>Preparando el informe...</p></div>';
        try {
            S.d = await cargar(j);
            S.m = construir(j, S.d);
            S.md = ''; S.metrica = 'td';
            render();
        } catch (e) {
            console.error('[informe jugador]', e);
            if (typeof origInforme === 'function') { try { return origInforme(); } catch (e2) {} }
            c.innerHTML = '<div class="cmpf-empty"><p>No se ha podido preparar el informe.</p></div>';
        }
    };
})();
