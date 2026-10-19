// ============================================================
// PP-CAMBIOS.JS — Gestión de cambios y sistemas del rival en sus últimos partidos
// En Scouting › Últimos partidos del rival, cada partido tiene una línea de tiempo de "momentos":
// minuto, marcador en ese momento, sistema, cambios (sale → entra) y el once resultante sobre el campo.
// Abajo, un resumen de cómo gestiona el rival los cambios (cuándo, con qué marcador, a qué sistema pasa,
// quién entra y quién sale más). Se guarda en match_plans.weekly_map.rival_recent[i].momentos.
// Cargar DESPUÉS de planpartido.js.
// ============================================================
(function () {
    'use strict';
    var CSS = ''
        + '.pc-wrap{margin-top:14px;border-top:1px dashed #334155;padding-top:12px}'
        + '.pc-cab{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px}'
        + '.pc-cab h5{margin:0;font-size:13px;color:#e2e8f0}'
        + '.pc-cab p{margin:2px 0 0;font-size:11px;color:#64748b}'
        + '.pc-add{padding:5px 11px;background:#1e3a5f;border:1px solid #3b82f6;color:#93c5fd;border-radius:6px;font-size:12px;cursor:pointer;font-weight:600}'
        + '.pc-tl{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}'
        + '.pc-chip{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:6px 10px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#cbd5e1;cursor:pointer;min-width:84px;font-size:11px;line-height:1.25}'
        + '.pc-chip b{font-size:13px;color:#fff}.pc-chip small{color:#94a3b8}'
        + '.pc-chip.a{border-color:#f59e0b;background:#2a1d05}'
        + '.pc-chip .sis{color:#38bdf8;font-weight:700}'
        + '.pc-ed{background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:10px}'
        + '.pc-ed label{font-size:11px;color:#9ca3af;display:block;margin-bottom:3px}'
        + '.pc-ed input,.pc-ed select{width:100%;padding:7px 10px;background:#1e293b;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:13px;font-family:inherit}'
        + '.pc-g{display:grid;grid-template-columns:90px 110px 1fr 2fr;gap:10px;margin-bottom:10px}'
        + '.pc-cb{display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:12px;color:#cbd5e1;flex-wrap:wrap}'
        + '.pc-cb select{width:auto;min-width:150px}'
        + '.pc-cb .x{background:none;border:none;color:#f87171;cursor:pointer;font-size:14px}'
        + '.pc-btn{padding:5px 10px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;font-size:11px;cursor:pointer}'
        + '.pc-btn.del{border-color:#7f1d1d;color:#fca5a5}'
        + '.pc-res{margin-top:16px;background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:14px}'
        + '.pc-res h5{margin:0 0 4px;font-size:13px;color:#e2e8f0}.pc-res p{margin:0 0 10px;font-size:11px;color:#64748b}'
        + '.pc-res .kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:12px}'
        + '.pc-res .k{background:#1e293b;border-radius:8px;padding:8px 10px}.pc-res .k .l{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px}.pc-res .k .v{font-size:18px;font-weight:800;color:#fff}.pc-res .k .d{font-size:11px;color:#94a3b8}'
        + '.pc-res table{width:100%;border-collapse:collapse;font-size:12px}.pc-res th{text-align:left;color:#94a3b8;font-size:10px;text-transform:uppercase;padding:5px 6px;border-bottom:1px solid #334155}.pc-res td{padding:6px;border-bottom:1px solid #1e293b;color:#e2e8f0;vertical-align:top}'
        + '.pc-res .ev{display:inline-block;background:#1e293b;border-radius:6px;padding:2px 7px;margin:2px 4px 2px 0;font-size:11px;white-space:nowrap}'
        + '.pc-res .ev.sis{border:1px solid #0ea5e9;color:#7dd3fc}'
        + '.pc-res .ev.v{color:#86efac}.pc-res .ev.e{color:#fca5a5}'
        + '@media (max-width:760px){.pc-g{grid-template-columns:1fr 1fr}}';
    function css() { if (!document.getElementById('pc-css')) { var s = document.createElement('style'); s.id = 'pc-css'; s.textContent = CSS; document.head.appendChild(s); } }
    function esc(t) { return typeof ppEsc === 'function' ? ppEsc(t) : String(t || ''); }
    function recs() { return ((pp.planActual && pp.planActual.weekly_map) || {}).rival_recent || []; }
    function jugadores() { return (pp.planActual && pp.planActual.rival_players) || []; }
    function nombre(idx) { var j = jugadores()[idx]; if (!j) return '?'; return (j.number ? j.number + ' ' : '') + (j.name || '?'); }
    function moms(r) { return Array.isArray(r.momentos) ? r.momentos : []; }
    // El equipo que estamos analizando (el rival de nuestro proximo partido)
    function nombreRival(corto) { var n = (pp.partidoActual && pp.partidoActual.opponent) || 'Rival'; return corto ? n.split(' ').filter(function (w) { return w.length > 2 && !/^(de|del|la|el|los|las|c\.d\.|cf|ud|cd|sd|ad)$/i.test(w); })[0] || n : n; }
    function sel(i) { pp.pcSel = pp.pcSel || {}; return pp.pcSel[i] || 0; }
    function clon(o) { return JSON.parse(JSON.stringify(o || {})); }
    // Estado del partido en el momento k (k=0 es el inicio)
    function estado(r, k) {
        var m = moms(r);
        if (k <= 0) return { min: 0, marcador: '0-0', formation: r.formation || '', lineup: r.lineup || {}, cambios: [], notas: '' };
        return m[k - 1];
    }
    async function guardar(rec, i, k) {
        pp.recentOpen = i; pp.pcSel = pp.pcSel || {}; pp.pcSel[i] = k;
        await ppGuardarRecientes(rec);
    }
    function marcadorValido(s) { s = (s || '').trim(); return /^\d{1,2}\s*-\s*\d{1,2}$/.test(s) ? s.replace(/\s+/g, '') : s; }
    // Aplica un cambio (sale -> entra) sobre un once: busca el hueco del que sale y pone al que entra
    function aplicarCambio(lineup, sale, entra) {
        var lu = clon(lineup), hecho = false;
        Object.keys(lu).forEach(function (slot) {
            var arr = Array.isArray(lu[slot]) ? lu[slot] : (lu[slot] === null || lu[slot] === undefined ? [] : [lu[slot]]);
            var p = arr.indexOf(sale);
            if (p >= 0 && !hecho) { arr[p] = entra; hecho = true; }
            lu[slot] = arr;
        });
        return { lineup: lu, hecho: hecho };
    }

    /* ---------- Acciones ---------- */
    window.pcSel = function (i, k) { pp.pcSel = pp.pcSel || {}; pp.pcSel[i] = k; pp.recentOpen = i; ppMostrarTab('scouting'); };
    window.pcAdd = function (i) {
        var rec = recs().slice(); var r = rec[i]; if (!r) return;
        if (!r.formation) { showToast('Elige primero el sistema inicial del partido'); return; }
        var m = moms(r).slice(), prev = m.length ? m[m.length - 1] : estado(r, 0);
        var minSug = m.length ? Math.min(90, (prev.min || 0) + 10) : 46;
        m.push({ min: minSug, marcador: prev.marcador || '0-0', formation: prev.formation || r.formation, lineup: clon(prev.lineup), cambios: [], notas: '' });
        r.momentos = m; guardar(rec, i, m.length);
    };
    window.pcDel = async function (i, k) {
        if (!confirm('¿Eliminar este momento del partido?')) return;
        var rec = recs().slice(); var r = rec[i]; var m = moms(r).slice(); m.splice(k - 1, 1); r.momentos = m; guardar(rec, i, Math.max(0, k - 1));
    };
    window.pcCampo = function (i, k, campo, v) {
        var rec = recs().slice(); var r = rec[i]; var m = moms(r).slice(); var mo = m[k - 1]; if (!mo) return;
        if (campo === 'min') { mo.min = parseInt(v, 10) || 0; m.sort(function (a, b) { return (a.min || 0) - (b.min || 0); }); k = m.indexOf(mo) + 1; }
        else if (campo === 'marcador') mo.marcador = marcadorValido(v);
        else if (campo === 'formation') { if (v !== mo.formation) { mo.formation = v; mo.lineup = {}; showToast('Sistema cambiado: coloca el once pulsando en las posiciones'); } }
        else mo[campo] = v;
        r.momentos = m; guardar(rec, i, k);
    };
    window.pcCambioAdd = function (i, k) {
        var rec = recs().slice(); var r = rec[i]; var m = moms(r).slice(); var mo = m[k - 1]; if (!mo) return;
        mo.cambios = (mo.cambios || []).concat([{ sale: null, entra: null }]); r.momentos = m; guardar(rec, i, k);
    };
    window.pcCambioSet = function (i, k, c, lado, v) {
        var rec = recs().slice(); var r = rec[i]; var m = moms(r).slice(); var mo = m[k - 1]; if (!mo || !mo.cambios || !mo.cambios[c]) return;
        var idx = v === '' ? null : parseInt(v, 10);
        mo.cambios[c][lado] = idx;
        var cb = mo.cambios[c];
        if (cb.sale !== null && cb.entra !== null && cb.sale !== undefined && cb.entra !== undefined) {
            var res = aplicarCambio(mo.lineup, cb.sale, cb.entra);
            if (res.hecho) mo.lineup = res.lineup; else showToast('El que sale no estaba en el once de este momento: coloca al que entra a mano');
        }
        r.momentos = m; guardar(rec, i, k);
    };
    window.pcCambioDel = function (i, k, c) {
        var rec = recs().slice(); var r = rec[i]; var m = moms(r).slice(); var mo = m[k - 1]; if (!mo) return;
        var cb = (mo.cambios || [])[c];
        if (cb && cb.sale !== null && cb.entra !== null) { var res = aplicarCambio(mo.lineup, cb.entra, cb.sale); if (res.hecho) mo.lineup = res.lineup; }
        mo.cambios.splice(c, 1); r.momentos = m; guardar(rec, i, k);
    };

    /* ---------- Once editable por momento: destino 'mI_K' ---------- */
    var origGet = window.ppGetLineup, origSet = window.ppSetLineup;
    function parseT(t) { var mm = /^m(\d+)_(\d+)$/.exec(String(t || '')); return mm ? { i: +mm[1], k: +mm[2] } : null; }
    window.ppGetLineup = function (wm) {
        var t = parseT(pp.lineupTarget);
        if (!t) return origGet(wm);
        var r = ((wm || {}).rival_recent || [])[t.i]; var mo = r ? moms(r)[t.k - 1] : null;
        return ppMigrarLineup((mo && mo.lineup) || {});
    };
    window.ppSetLineup = function (wm, lu) {
        var t = parseT(pp.lineupTarget);
        if (!t) return origSet(wm, lu);
        var r = ((wm || {}).rival_recent || [])[t.i]; if (!r) return; var m = moms(r); if (!m[t.k - 1]) return;
        m[t.k - 1].lineup = lu; r.momentos = m;
        pp.pcSel = pp.pcSel || {}; pp.pcSel[t.i] = t.k; pp.recentOpen = t.i;
    };

    /* ---------- Render ---------- */
    function selJug(i, k, c, lado, val) {
        var jug = jugadores();
        var h = '<select onchange="pcCambioSet(' + i + ',' + k + ',' + c + ',\'' + lado + '\',this.value)"><option value="">' + (lado === 'sale' ? '— sale —' : '— entra —') + '</option>';
        jug.forEach(function (j, idx) { h += '<option value="' + idx + '"' + (val === idx ? ' selected' : '') + '>' + esc(nombre(idx)) + '</option>'; });
        return h + '</select>';
    }
    function bloque(r, i) {
        var m = moms(r), k = Math.min(sel(i), m.length), st = estado(r, k);
        var h = '<div class="pc-wrap"><div class="pc-cab"><div><h5>⏱️ Cambios y sistemas durante el partido</h5><p>Añade un momento por cada cambio de jugadores o de sistema, con el minuto y el marcador que había. El campo de arriba muestra el once del momento seleccionado.</p></div><div style="display:flex;gap:6px"><button class="pc-btn" onclick="pcPdf(' + i + ')" title="PDF imprimible de este partido: campos por momento, cambios y marcador">🖨️ PDF del partido</button><button class="pc-add" onclick="pcAdd(' + i + ')">+ Añadir momento</button></div></div>';
        h += '<div class="pc-tl">';
        h += '<div class="pc-chip' + (k === 0 ? ' a' : '') + '" onclick="pcSel(' + i + ',0)"><b>0\'</b><span class="sis">' + esc(r.formation || '—') + '</span><small>once inicial</small></div>';
        m.forEach(function (mo, idx) {
            var cambios = (mo.cambios || []).filter(function (c) { return c.sale !== null && c.entra !== null; });
            var txt = cambios.map(function (c) { var a = jugadores()[c.entra], b = jugadores()[c.sale]; return (a && a.number ? a.number : '?') + '×' + (b && b.number ? b.number : '?'); }).join(' · ');
            var prev = estado(r, idx), cambiaSis = mo.formation && mo.formation !== prev.formation;
            h += '<div class="pc-chip' + (k === idx + 1 ? ' a' : '') + '" onclick="pcSel(' + i + ',' + (idx + 1) + ')"><b>' + (mo.min || 0) + '\' <span style="color:#fbbf24">' + esc(mo.marcador || '') + '</span></b>' + (cambiaSis ? '<span class="sis">→ ' + esc(mo.formation) + '</span>' : '') + '<small>' + (txt || (cambiaSis ? 'cambio de sistema' : 'sin cambios')) + '</small></div>';
        });
        h += '</div>';
        if (k > 0) {
            var mo = st;
            h += '<div class="pc-ed"><div class="pc-g">'
                + '<div><label>Minuto</label><input type="number" min="1" max="130" value="' + (mo.min || 0) + '" onchange="pcCampo(' + i + ',' + k + ',\'min\',this.value)"></div>'
                + '<div><label title="Primero los goles de ' + esc(nombreRival()) + ', después los de ' + esc(r.opponent || 'su rival') + '">Marcador (' + esc(nombreRival(true)) + ' - ' + esc(r.opponent ? r.opponent.split(' ')[0] : 'ellos') + ')</label><input type="text" value="' + esc(mo.marcador || '') + '" placeholder="1-0" onchange="pcCampo(' + i + ',' + k + ',\'marcador\',this.value)"></div>'
                + '<div><label>Sistema en ese momento</label>' + ppSelectFormacion('pc-f' + i + '_' + k, mo.formation || '', 'pcCampo(' + i + ',' + k + ',\'formation\',this.value)') + '</div>'
                + '<div><label>Notas</label><input type="text" value="' + esc(mo.notas || '') + '" placeholder="Por qué cambia, lesión, qué busca..." onchange="pcCampo(' + i + ',' + k + ',\'notas\',this.value)"></div>'
                + '</div>';
            h += '<label>Cambios de jugadores</label>';
            (mo.cambios || []).forEach(function (c, ci) {
                h += '<div class="pc-cb"><span style="color:#f87171">Sale</span>' + selJug(i, k, ci, 'sale', c.sale) + '<span style="color:#4ade80">Entra</span>' + selJug(i, k, ci, 'entra', c.entra) + '<button class="x" onclick="pcCambioDel(' + i + ',' + k + ',' + ci + ')" title="Quitar">×</button></div>';
            });
            h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><button class="pc-btn" onclick="pcCambioAdd(' + i + ',' + k + ')">+ Cambio (sale → entra)</button><button class="pc-btn del" onclick="pcDel(' + i + ',' + k + ')">🗑 Eliminar momento</button></div>'
                + '<div style="font-size:11px;color:#64748b;margin-top:8px">Al elegir sale → entra, el que entra ocupa el sitio del que sale en el campo. Si cambia el sistema, coloca el once pulsando en las posiciones del campo (arriba).</div></div>';
        }
        return h;
    }
    function campoMomento(r, i, k) {
        var st = estado(r, k), s = ppParseFormacion(st.formation);
        if (!s) return '<div style="padding:12px;background:#0f172a;border-radius:8px;text-align:center;color:#475569;font-size:12px">Elige el sistema de este momento</div>';
        return '<div style="font-size:12px;color:#fbbf24;margin:6px 0 4px;text-align:center">Minuto ' + (st.min || 0) + ' · ' + esc(st.marcador || '') + ' · ' + esc(st.formation) + '</div>' + ppRenderCampo(s, st.lineup || {}, jugadores(), 'normal', "'m" + i + "_" + k + "'");
    }

    /* ---------- Resumen de gestión de cambios ---------- */
    function resumen() {
        var rec = recs(), jug = jugadores();
        var conDatos = rec.filter(function (r) { return moms(r).length; });
        if (!conDatos.length) return '';
        var primeros = [], nCambios = [], entran = {}, salen = {}, sisCambios = [], filas = '';
        rec.forEach(function (r) {
            var m = moms(r); if (!m.length) return;
            var evs = [], total = 0, primero = null, prevF = r.formation || '';
            m.forEach(function (mo) {
                var cs = (mo.cambios || []).filter(function (c) { return c.sale !== null && c.entra !== null; });
                total += cs.length; if (cs.length && primero === null) primero = mo.min || 0;
                cs.forEach(function (c) { entran[c.entra] = (entran[c.entra] || 0) + 1; salen[c.sale] = (salen[c.sale] || 0) + 1; });
                var cambiaSis = mo.formation && mo.formation !== prevF;
                var cl = 'ev';
                var mk = (mo.marcador || '').split('-').map(Number);
                if (mk.length === 2 && !isNaN(mk[0]) && !isNaN(mk[1])) cl += mk[0] > mk[1] ? ' v' : (mk[0] < mk[1] ? ' e' : '');
                evs.push('<span class="' + cl + (cambiaSis ? ' sis' : '') + '" title="' + esc(mo.notas || '') + '">' + (mo.min || 0) + '\' (' + esc(mo.marcador || '?') + ')' + (cs.length ? ' ' + cs.map(function (c) { return esc(nombre(c.entra)) + ' por ' + esc(nombre(c.sale)); }).join(', ') : '') + (cambiaSis ? ' → ' + esc(mo.formation) : '') + '</span>');
                if (cambiaSis) { sisCambios.push({ de: prevF, a: mo.formation, min: mo.min, marcador: mo.marcador, estado: (mk.length === 2 && !isNaN(mk[0]) && !isNaN(mk[1])) ? (mk[0] > mk[1] ? 'ganando' : (mk[0] < mk[1] ? 'perdiendo' : 'empatando')) : '' }); prevF = mo.formation; }
            });
            if (primero !== null) primeros.push(primero); nCambios.push(total);
            filas += '<tr><td style="white-space:nowrap"><b>' + (r.opponent ? 'vs ' + esc(r.opponent) : 'Partido') + '</b><br><span style="color:#94a3b8">' + esc(r.resultado || '') + (r.local === 'visitante' ? ' · fuera' : ' · casa') + ' · ' + esc(r.formation || '') + '</span></td><td>' + evs.join('') + '</td></tr>';
        });
        var med = function (a) { return a.length ? Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length) : null; };
        var top = function (o) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }).slice(0, 3).map(function (k) { return esc(nombre(+k)) + ' (' + o[k] + ')'; }).join(', '); };
        var sisTxt = sisCambios.length ? sisCambios.map(function (s) { return esc(s.de) + ' → <b>' + esc(s.a) + '</b> en el ' + s.min + '\' ' + (s.estado ? s.estado + ' ' : '') + esc(s.marcador || ''); }).join('<br>') : 'No cambia de sistema en los partidos registrados';
        return '<div class="pc-res"><h5>📊 Cómo gestiona los cambios el rival</h5><p>A partir de los momentos que has registrado en ' + conDatos.length + ' partido' + (conDatos.length > 1 ? 's' : '') + '. El marcador se lee siempre con los goles de ' + esc(nombreRival()) + ' primero. Verde = iba ganando en ese momento, rojo = perdiendo; borde azul = cambio de sistema.</p>'
            + '<div class="kp"><div class="k"><div class="l">Primer cambio</div><div class="v">' + (med(primeros) !== null ? med(primeros) + '\'' : '—') + '</div><div class="d">minuto medio</div></div>'
            + '<div class="k"><div class="l">Cambios por partido</div><div class="v">' + (med(nCambios) !== null ? (nCambios.reduce(function (a, b) { return a + b; }, 0) / nCambios.length).toFixed(1) : '—') + '</div><div class="d">de media</div></div>'
            + '<div class="k"><div class="l">Entran más</div><div class="d" style="color:#86efac;font-size:12px;margin-top:3px">' + (top(entran) || '—') + '</div></div>'
            + '<div class="k"><div class="l">Salen más</div><div class="d" style="color:#fca5a5;font-size:12px;margin-top:3px">' + (top(salen) || '—') + '</div></div>'
            + '<div class="k" style="grid-column:span 2"><div class="l">Cambios de sistema</div><div class="d" style="color:#e2e8f0;font-size:12px;margin-top:3px;line-height:1.5">' + sisTxt + '</div></div></div>'
            + '<table><thead><tr><th style="width:170px">Partido</th><th>Momentos (minuto · marcador · cambios)</th></tr></thead><tbody>' + filas + '</tbody></table></div>';
    }

    /* ---------- PDF imprimible del partido (campos por momento) ---------- */
    function campoSvg(formation, lineup, jug, w) {
        var slots = ppParseFormacion(formation); if (!slots) return '';
        var W = w || 300, H = Math.round(W * 1.45), lu = ppMigrarLineup(lineup || {});
        var h = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="display:block;border-radius:8px;width:100%;height:auto">'
            + '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#2f9e4f"/>'
            + '<rect x="' + (W * .04) + '" y="' + (H * .03) + '" width="' + (W * .92) + '" height="' + (H * .94) + '" fill="none" stroke="#fff" stroke-width="1.5"/>'
            + '<line x1="' + (W * .04) + '" y1="' + (H / 2) + '" x2="' + (W * .96) + '" y2="' + (H / 2) + '" stroke="#fff" stroke-width="1.5"/>'
            + '<circle cx="' + (W / 2) + '" cy="' + (H / 2) + '" r="' + (W * .12) + '" fill="none" stroke="#fff" stroke-width="1.5"/>'
            + '<rect x="' + (W * .25) + '" y="' + (H * .03) + '" width="' + (W * .5) + '" height="' + (H * .14) + '" fill="none" stroke="#fff" stroke-width="1.5"/>'
            + '<rect x="' + (W * .25) + '" y="' + (H * .83) + '" width="' + (W * .5) + '" height="' + (H * .14) + '" fill="none" stroke="#fff" stroke-width="1.5"/>';
        slots.forEach(function (sl) {
            var ids = lu[sl.slotId] || [], j = jug[ids[0]];
            var cx = W * sl.x / 100, cy = H * sl.y / 100 * .9 + H * .05, r = W * .055;
            h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (j ? (sl.lineIdx === 0 ? '#f59e0b' : '#1d4ed8') : '#ffffff55') + '" stroke="#fff" stroke-width="1.5"/>';
            if (j) {
                h += '<text x="' + cx + '" y="' + (cy + r * .38) + '" text-anchor="middle" font-size="' + (r * 1.05) + '" font-weight="800" fill="#fff" font-family="Arial,sans-serif">' + esc(j.number || '') + '</text>'
                   + '<text x="' + cx + '" y="' + (cy + r + W * .04) + '" text-anchor="middle" font-size="' + (W * .034) + '" font-weight="700" fill="#0f172a" font-family="Arial,sans-serif" style="paint-order:stroke;stroke:#fff;stroke-width:2.5px">' + esc(String(j.name || '').split(' ').slice(0, 2).join(' ')) + '</text>';
                if (ids.length > 1) h += '<text x="' + cx + '" y="' + (cy + r + W * .075) + '" text-anchor="middle" font-size="' + (W * .028) + '" fill="#1e293b" font-family="Arial,sans-serif" style="paint-order:stroke;stroke:#fff;stroke-width:2px">o ' + esc(ids.slice(1).map(function (x) { var q = jug[x]; return q ? (q.number || q.name) : ''; }).join(', ')) + '</text>';
            }
        });
        return h + '</svg>';
    }
    window.pcPdf = function (i) {
        var r = recs()[i]; if (!r) return;
        var jug = jugadores(), m = moms(r), rN = nombreRival();
        var pasos = [estado(r, 0)].concat(m);
        var fecha = r.fecha ? r.fecha.split('-').reverse().join('/') : '';
        var h = '<div class="cab"><div><div class="k">Scouting · ' + esc(rN) + '</div><h1>' + esc(rN) + ' <span>vs</span> ' + esc(r.opponent || 'Rival') + '</h1><div class="sub">' + fecha + (r.local === 'visitante' ? ' · Visitante' : ' · Local') + ' · Sistema inicial <b>' + esc(r.formation || '—') + '</b>' + (r.notas ? ' · ' + esc(r.notas) : '') + '</div></div><div class="res">' + esc(r.resultado || '') + '</div></div>';
        var cols = Math.min(5, Math.max(2, pasos.length));
        h += '<div class="grid" style="grid-template-columns:repeat(' + cols + ',1fr)">';
        pasos.forEach(function (st, k) {
            var prev = k ? pasos[k - 1] : null, cambiaSis = prev && st.formation && st.formation !== prev.formation;
            var cs = (st.cambios || []).filter(function (c) { return c.sale !== null && c.entra !== null; });
            h += '<div class="mom"><div class="mh"><span class="min">' + (k ? st.min + "'" : "0'") + '</span><span class="mk">' + esc(st.marcador || (k ? '' : '0-0')) + '</span><span class="sis">' + esc(st.formation || '') + (cambiaSis ? ' <em>(cambio de sistema, antes ' + esc(prev.formation) + ')</em>' : '') + '</span></div>'
               + campoSvg(st.formation, st.lineup, jug, 240)
               + (k === 0 ? '<div class="nt">Once inicial</div>' : '<div class="nt">' + (cs.length ? cs.map(function (c) { return '<span class="cb"><b style="color:#15803d">↑ ' + esc(nombre(c.entra)) + '</b> por <b style="color:#b91c1c">↓ ' + esc(nombre(c.sale)) + '</b></span>'; }).join('') : '<span class="cb">Sin cambios de jugadores</span>') + (st.notas ? '<div class="no">' + esc(st.notas) + '</div>' : '') + '</div>')
               + '</div>';
        });
        h += '</div>';
        // tabla cronologica
        if (m.length) {
            h += '<div class="cron"><h2>Cronología de cambios</h2><table><thead><tr><th>Min</th><th>Marcador</th><th>Sistema</th><th>Entra</th><th>Sale</th><th>Notas</th></tr></thead><tbody>';
            var prevF = r.formation;
            m.forEach(function (mo) {
                var cs = (mo.cambios || []).filter(function (c) { return c.sale !== null && c.entra !== null; });
                var sisTxt = mo.formation && mo.formation !== prevF ? '<b>' + esc(prevF) + ' → ' + esc(mo.formation) + '</b>' : esc(mo.formation || '');
                if (mo.formation) prevF = mo.formation;
                h += '<tr><td><b>' + mo.min + "'" + '</b></td><td>' + esc(mo.marcador || '') + '</td><td>' + sisTxt + '</td><td>' + (cs.map(function (c) { return esc(nombre(c.entra)); }).join('<br>') || '—') + '</td><td>' + (cs.map(function (c) { return esc(nombre(c.sale)); }).join('<br>') || '—') + '</td><td>' + esc(mo.notas || '') + '</td></tr>';
            });
            h += '</tbody></table></div>';
        }
        var CSSP = 'body{margin:0;padding:9mm 10mm;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#0f172a;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
            + '.cab{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0f172a;padding-bottom:8px;margin-bottom:12px}.cab .k{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#64748b}.cab h1{margin:2px 0;font-size:22px}.cab h1 span{color:#94a3b8;font-weight:500;font-size:16px}.cab .sub{font-size:12px;color:#475569}.cab .res{font-size:34px;font-weight:900;color:#0f172a;border:2px solid #0f172a;border-radius:10px;padding:4px 14px}'
            + '.grid{display:grid;gap:8px}.mom{break-inside:avoid;border:1px solid #cbd5e1;border-radius:10px;padding:6px;display:flex;flex-direction:column;align-items:center;min-width:0}.mh{display:flex;gap:6px;align-items:baseline;width:100%;margin-bottom:4px;flex-wrap:wrap}.mh .min{font-size:16px;font-weight:900}.mh .mk{font-size:14px;font-weight:800;color:#b45309}.mh .sis{font-size:11px;color:#1d4ed8;font-weight:700}.mh em{color:#64748b;font-weight:500;font-style:normal;font-size:10px}'
            + '.nt{width:100%;margin-top:5px;font-size:10.5px}.cb{display:block;margin:1px 0}.no{color:#475569;font-size:10px;margin-top:3px;border-left:3px solid #cbd5e1;padding-left:6px}'
            + 'h2{font-size:14px;margin:16px 0 6px;text-transform:uppercase;letter-spacing:1px;color:#334155}table{width:100%;border-collapse:collapse;font-size:11.5px}th{text-align:left;background:#f1f5f9;padding:5px 7px;border-bottom:1px solid #cbd5e1;font-size:10px;text-transform:uppercase;color:#475569}td{padding:5px 7px;border-bottom:1px solid #e2e8f0;vertical-align:top}'
            + 'h2,table{break-inside:avoid}.cron{break-inside:avoid}.pie{margin-top:10px;font-size:10px;color:#94a3b8;text-align:right}@page{size:A4 landscape;margin:0}';
        var w = window.open('', '_blank'); if (!w) { alert('El navegador ha bloqueado la ventana. Permite las ventanas emergentes.'); return; }
        w.document.write('<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>' + esc(rN) + ' vs ' + esc(r.opponent || '') + ' · cambios</title><style>' + CSSP + '</style></head><body>' + h + '<div class="pie">TopLiderCoach · Scouting · ' + new Date().toLocaleDateString('es-ES') + '</div><script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script></body></html>');
        w.document.close();
    };

    /* ---------- Enganche en ppRenderRecientes ---------- */
    var orig = window.ppRenderRecientes;
    window.ppRenderRecientes = function () {
        css();
        var html = orig();
        try {
            var rec = recs(); if (!rec.length) return html;
            var tmp = document.createElement('div'); tmp.innerHTML = html;
            var root = tmp.firstChild;
            // tarjetas de partidos: los hijos con borde que contienen la cabecera "vs ..."
            var cards = Array.prototype.filter.call(root.children, function (el) { return el.style && el.style.borderRadius === '10px'; });
            cards.forEach(function (card, i) {
                var r = rec[i]; if (!r) return;
                var cuerpo = card.children[1]; if (!cuerpo) return; // solo el abierto tiene cuerpo
                var k = Math.min(sel(i), moms(r).length);
                if (k > 0) {
                    // sustituir el campo del once inicial por el del momento seleccionado
                    var campo = cuerpo.lastElementChild;
                    if (campo) campo.outerHTML = campoMomento(r, i, k);
                }
                cuerpo.insertAdjacentHTML('beforeend', bloque(r, i));
            });
            root.insertAdjacentHTML('beforeend', resumen());
            return tmp.innerHTML;
        } catch (e) { console.warn('[cambios rival]', e); return html; }
    };
})();
