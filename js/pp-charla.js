// ============================================================
// PP-CHARLA.JS — Charla de vestuario del Plan de Partido
// Sustituye el boton "Charla" por una presentacion profesional a pantalla
// completa centrada en la CONFRONTACION (pantalla partida: rival | nosotros),
// con miniaturas que se abren en grande junto a su texto, dibujos de la
// pizarra o imagenes PNG en cada fase, y un preparador donde el entrenador
// elige y ordena que diapositivas entran en la charla.
// Cargar DESPUES de planpartido.js. No toca la base de datos mas alla de
// match_plans.weekly_map.charla (seleccion/orden) y los media de cada fase
// (tactical_phases / weekly_map.our_phases), que ya existian.
// ============================================================
(function () {
    'use strict';
    var ROJO = '#ef4444', VERDE = '#22c55e', AMBAR = '#f59e0b', MORADO = '#a855f7';
    var C = { slides: [], idx: 0, cfg: null, visor: null, touchX: null };

    /* ---------- CSS ---------- */
    var CSS = ''
        + '#ch-ov{position:fixed;inset:0;z-index:99999;background:#070b14;color:#e2e8f0;display:flex;flex-direction:column;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;user-select:none}'
        + '#ch-ov *{box-sizing:border-box}'
        + '.ch-top{flex-shrink:0;display:flex;align-items:center;gap:14px;padding:10px 22px;background:#0b1220;border-bottom:1px solid #1e293b}'
        + '.ch-top img{width:40px;height:40px;object-fit:contain}'
        + '.ch-top .eq{font-size:17px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#fff}'
        + '.ch-top .vs{font-size:13px;font-weight:800;color:#f59e0b;padding:0 6px}'
        + '.ch-top .info{margin-left:auto;font-size:12.5px;color:#94a3b8;text-align:right;line-height:1.3}'
        + '.ch-prog{height:3px;background:#1e293b;flex-shrink:0}.ch-prog i{display:block;height:100%;background:linear-gradient(90deg,#f59e0b,#ef4444);transition:width .25s}'
        + '.ch-body{flex:1;min-height:0;position:relative;overflow:hidden}'
        + '.ch-slide{position:absolute;inset:0;padding:28px 44px;overflow-y:auto;animation:chIn .28s ease}'
        + '@keyframes chIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}'
        + '.ch-sec{font-size:12.5px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:6px}'
        + '.ch-h1{font-size:clamp(26px,3.6vw,44px);font-weight:800;color:#fff;line-height:1.1;margin:0 0 18px}'
        + '.ch-txt{font-size:clamp(17px,1.9vw,24px);line-height:1.6;color:#e2e8f0;white-space:pre-wrap}'
        + '.ch-txt.l{font-size:clamp(15px,1.5vw,19px)}'
        + '.ch-split{display:grid;grid-template-columns:1fr 1fr;gap:22px;height:100%;min-height:0}'
        + '.ch-col{display:flex;flex-direction:column;min-height:0;border-radius:16px;padding:22px 24px;background:#0f172a;border:1px solid #1e293b;position:relative;overflow:hidden}'
        + '.ch-col::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px}'
        + '.ch-col.r::before{background:' + ROJO + '}.ch-col.n::before{background:' + VERDE + '}'
        + '.ch-col .tag{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:4px 12px;border-radius:999px;margin-bottom:10px;width:max-content}'
        + '.ch-col.r .tag{background:rgba(239,68,68,.15);color:#fca5a5;border:1px solid rgba(239,68,68,.5)}'
        + '.ch-col.n .tag{background:rgba(34,197,94,.15);color:#86efac;border:1px solid rgba(34,197,94,.5)}'
        + '.ch-col .tit{font-size:clamp(20px,2.3vw,30px);font-weight:800;color:#fff;line-height:1.15;margin-bottom:12px}'
        + '.ch-col .cuerpo{flex:1;min-height:0;overflow-y:auto;padding-right:4px}'
        + '.ch-col .vacio{color:#475569;font-style:italic;font-size:16px}'
        + '.ch-minis{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin-top:16px}'
        + '.ch-mini{position:relative;aspect-ratio:16/10;border-radius:10px;overflow:hidden;border:2px solid #334155;background:#0b1220;cursor:pointer;transition:transform .15s,border-color .15s}'
        + '.ch-mini:hover{transform:scale(1.04);border-color:#f59e0b}'
        + '.ch-mini img{width:100%;height:100%;object-fit:cover;display:block}'
        + '.ch-mini .cap{position:absolute;left:0;right:0;bottom:0;padding:4px 8px;font-size:11px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.8));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
        + '.ch-mini .vid{display:flex;align-items:center;justify-content:center;height:100%;font-size:34px;color:#f97316}'
        + '.ch-mini .lupa{position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,.55);display:grid;place-items:center;font-size:12px;color:#fff}'
        + '.ch-bot{flex-shrink:0;display:flex;align-items:center;gap:10px;padding:8px 16px;background:#0b1220;border-top:1px solid #1e293b}'
        + '.ch-bot button{padding:8px 16px;border-radius:8px;border:1px solid #334155;background:#1e293b;color:#cbd5e1;font-size:14px;cursor:pointer;font-weight:600}'
        + '.ch-bot button.p{background:#2563eb;border-color:#2563eb;color:#fff}'
        + '.ch-bot button.x{background:#7f1d1d;border-color:#991b1b;color:#fecaca}'
        + '.ch-dots{flex:1;display:flex;gap:5px;justify-content:center;flex-wrap:wrap;min-width:0}'
        + '.ch-dot{width:22px;height:7px;border-radius:4px;background:#334155;cursor:pointer;border:none;padding:0}'
        + '.ch-dot.r{background:#7f1d1d}.ch-dot.n{background:#14532d}.ch-dot.a{background:#f59e0b!important;width:34px}'
        + '.ch-cnt{font-size:13px;color:#64748b;min-width:60px;text-align:center}'
        + '.ch-grid{position:absolute;inset:0;background:#070b14;overflow-y:auto;padding:28px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;align-content:start;z-index:5}'
        + '.ch-gi{background:#0f172a;border:2px solid #1e293b;border-radius:12px;padding:12px;cursor:pointer;min-height:110px;display:flex;flex-direction:column;gap:6px}'
        + '.ch-gi:hover,.ch-gi.a{border-color:#f59e0b}'
        + '.ch-gi .n{font-size:11px;color:#64748b}.ch-gi .t{font-size:14px;font-weight:700;color:#fff;line-height:1.25}.ch-gi .s{font-size:11px;color:#94a3b8;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}'
        + '.ch-centro{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:18px}'
        + '.ch-kv{display:grid;grid-template-columns:1fr 1fr;gap:26px;height:100%}'
        + '.ch-kv>div{background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:22px 26px;overflow-y:auto}'
        + '.ch-kv h3{margin:0 0 12px;font-size:22px}'
        + '.ch-pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700}'
        // visor (lightbox)
        + '#ch-visor{position:fixed;inset:0;z-index:999999;background:rgba(3,7,18,.96);display:flex;flex-direction:column;padding:18px 22px;gap:12px;animation:chFade .2s}'
        + '@keyframes chFade{from{opacity:0}to{opacity:1}}'
        + '#ch-visor .cab{display:flex;align-items:center;gap:12px;flex-shrink:0}'
        + '#ch-visor .cab .t{font-size:18px;font-weight:800;color:#fff}'
        + '#ch-visor .cab .c{font-size:13px;color:#94a3b8}'
        + '#ch-visor .cab button{margin-left:auto;background:#1e293b;border:1px solid #334155;color:#fff;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:14px}'
        + '#ch-visor .med{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;position:relative}'
        + '#ch-visor .med img{max-width:100%;max-height:100%;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.6);object-fit:contain}'
        + '#ch-visor .fl{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border-radius:50%;background:rgba(15,23,42,.85);border:1px solid #334155;color:#fff;font-size:22px;cursor:pointer;display:grid;place-items:center}'
        + '#ch-visor .fl.i{left:8px}#ch-visor .fl.d{right:8px}'
        + '#ch-visor .txt{flex-shrink:0;max-height:26vh;overflow-y:auto;background:#0f172a;border:1px solid #1e293b;border-left:6px solid #f59e0b;border-radius:12px;padding:14px 20px;font-size:clamp(16px,1.7vw,21px);line-height:1.55;color:#e2e8f0;white-space:pre-wrap}'
        + '#ch-visor .txt.r{border-left-color:' + ROJO + '}#ch-visor .txt.n{border-left-color:' + VERDE + '}'
        // preparador
        + '#ch-prep{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px}'
        + '#ch-prep .box{background:#0f172a;border:1px solid #1e3a5f;border-radius:14px;width:100%;max-width:860px;max-height:92vh;display:flex;flex-direction:column;color:#e2e8f0;font-family:inherit}'
        + '#ch-prep .cab{padding:16px 20px;border-bottom:1px solid #1e3a5f;display:flex;align-items:center;gap:12px}'
        + '#ch-prep h3{margin:0;font-size:16px;color:#fff}#ch-prep .cab p{margin:2px 0 0;font-size:12px;color:#94a3b8}'
        + '#ch-prep .lst{flex:1;overflow-y:auto;padding:12px 20px}'
        + '#ch-prep .it{display:flex;align-items:center;gap:10px;padding:9px 10px;border:1px solid #1e293b;border-radius:10px;margin-bottom:6px;background:#111c33}'
        + '#ch-prep .it.off{opacity:.45}'
        + '#ch-prep .it input{width:18px;height:18px;accent-color:#22c55e;cursor:pointer}'
        + '#ch-prep .it .k{font-size:10.5px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:2px 8px;border-radius:999px;min-width:92px;text-align:center}'
        + '#ch-prep .it .t{flex:1;font-size:13px;color:#e2e8f0;min-width:0}#ch-prep .it .t small{display:block;color:#64748b;font-size:11px;margin-top:2px}'
        + '#ch-prep .it .mv button{background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:6px;width:28px;height:26px;cursor:pointer;font-size:12px}'
        + '#ch-prep .pie{padding:12px 20px;border-top:1px solid #1e3a5f;display:flex;gap:10px;align-items:center;flex-wrap:wrap}'
        + '#ch-prep .pie button{padding:9px 16px;border-radius:8px;border:1px solid #334155;background:#1e293b;color:#cbd5e1;cursor:pointer;font-size:13px;font-weight:600}'
        + '#ch-prep .pie button.p{background:#059669;border-color:#10b981;color:#fff;font-size:14px;padding:10px 22px}'
        + '#ch-prep .pie .n{margin-left:auto;font-size:12px;color:#94a3b8}'
        // botones en la pestana confrontacion
        + '.ch-acc{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}'
        + '.ch-acc button{padding:4px 10px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#94a3b8;font-size:11px;cursor:pointer}'
        + '.ch-acc button:hover{border-color:#7c3aed;color:#c4b5fd}'
        + '.ch-mm{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}'
        + '.ch-mm .m{position:relative;width:84px;height:56px;border-radius:5px;overflow:hidden;border:1px solid #334155}'
        + '.ch-mm .m img{width:100%;height:100%;object-fit:cover;cursor:pointer}'
        + '.ch-mm .m a{display:flex;align-items:center;justify-content:center;height:100%;background:#0f172a;color:#94a3b8;font-size:18px;text-decoration:none}'
        + '.ch-mm .m b{position:absolute;top:2px;right:2px;width:16px;height:16px;border-radius:50%;background:rgba(127,29,29,.9);color:#fff;font-size:10px;line-height:16px;text-align:center;cursor:pointer}'
        + '@media (max-width:760px){.ch-split{grid-template-columns:1fr;grid-template-rows:1fr 1fr}.ch-slide{padding:14px}.ch-kv{grid-template-columns:1fr}.ch-top .info{display:none}}';

    function css() { if (!document.getElementById('ch-css')) { var s = document.createElement('style'); s.id = 'ch-css'; s.textContent = CSS; document.head.appendChild(s); } }
    function esc(t) { return typeof ppEsc === 'function' ? ppEsc(t) : String(t || ''); }
    function clubNombre() { return (typeof clubData !== 'undefined' && clubData && clubData.name) ? clubData.name : 'Nosotros'; }
    function clubLogo() { return (typeof clubData !== 'undefined' && clubData && clubData.logo_url) ? clubData.logo_url : ''; }
    function rivalLogo() { return (pp.rivalActual && pp.rivalActual.logo_url) ? pp.rivalActual.logo_url : ''; }
    function tamTexto(t) { t = t || ''; return t.length > 420 ? 'ch-txt l' : 'ch-txt'; }
    function medias(m) { return (m || []).filter(function (x) { return x && x.url; }); }

    /* ---------- Catalogo de diapositivas posibles ---------- */
    // Cada candidata: {key, tipo, titulo, sub, equipo, build()}
    function candidatas() {
        var plan = pp.planActual, par = pp.partidoActual, L = [];
        var fases = ppGetFases(), our = ppGetOurPhases();
        L.push({ key: 'portada', tipo: 'Portada', titulo: 'Portada', sub: esc(par.opponent) + ' · ' + (par.competition || ''), equipo: '', fijo: true });
        if (plan.rival_formation && ppParseFormacion(plan.rival_formation)) L.push({ key: 'sistema', tipo: 'Rival', titulo: 'Sistema del rival', sub: plan.rival_formation, equipo: 'rival' });
        if (plan.rival_strengths || plan.rival_weaknesses || plan.rival_style) L.push({ key: 'scouting', tipo: 'Rival', titulo: 'Scouting: fuertes y débiles', sub: (plan.rival_style || '').slice(0, 80), equipo: 'rival' });
        var usadas = {};
        fases.forEach(function (f, i) {
            var pid = ppPairDe(f), sec = pid ? ppSeccionPropia(pid) : null; if (sec) usadas[sec.id] = true;
            var od = sec ? (our[sec.id] || {}) : {};
            var tiene = (f.notes && f.notes.trim()) || medias(f.media).length || (od.notes && od.notes.trim()) || medias(od.media).length;
            if (!tiene) return;
            L.push({ key: 'conf:' + (f.id || i), tipo: 'Confrontación', titulo: f.title + (sec ? '  ⇄  ' + sec.title : ''), sub: (f.notes || od.notes || '').slice(0, 90), equipo: 'conf', fi: i, sec: sec });
        });
        PP_OUR_SECTIONS.forEach(function (s) {
            if (s.type || usadas[s.id]) return;
            var d = our[s.id]; if (!d || (!(d.notes && d.notes.trim()) && !medias(d.media).length)) return;
            L.push({ key: 'our:' + s.id, tipo: 'Nosotros', titulo: s.title, sub: (d.notes || '').slice(0, 90), equipo: 'own', sec: s });
        });
        var abps = ppGetAbpCards();
        abps.forEach(function (c, i) { L.push({ key: 'abp:' + (c.id || i), tipo: 'ABP', titulo: (c.name || 'ABP') + ' · ' + (c.tipo || ''), sub: (c.explicacion || '').slice(0, 90), equipo: 'own', abp: c }); });
        L.push({ key: 'cierre', tipo: 'Cierre', titulo: 'Cierre: ¡vamos a por ellos!', sub: '', equipo: '', fijo: true });
        return L;
    }
    function cfgLeer() {
        var wm = pp.planActual.weekly_map || {};
        var c = wm.charla && typeof wm.charla === 'object' ? wm.charla : {};
        return { off: c.off || {}, orden: Array.isArray(c.orden) ? c.orden : [] };
    }
    async function cfgGuardar(cfg) {
        var wm = pp.planActual.weekly_map || {}; wm.charla = { off: cfg.off, orden: cfg.orden };
        try { await supabaseClient.from('match_plans').update({ weekly_map: wm, updated_at: new Date().toISOString() }).eq('id', pp.planActual.id); pp.planActual.weekly_map = wm; }
        catch (e) { showToast('No se pudo guardar la selección: ' + e.message); }
    }
    // Lista ordenada segun la configuracion guardada (las nuevas van al final, antes del cierre)
    function ordenadas() {
        var cand = candidatas(), cfg = cfgLeer(), pos = {};
        cfg.orden.forEach(function (k, i) { pos[k] = i; });
        cand.forEach(function (c) { c.on = !cfg.off[c.key]; });
        var fijasIni = cand.filter(function (c) { return c.key === 'portada'; }), fijasFin = cand.filter(function (c) { return c.key === 'cierre'; });
        var resto = cand.filter(function (c) { return !c.fijo; });
        resto.sort(function (a, b) { var pa = pos[a.key], pb = pos[b.key]; if (pa === undefined && pb === undefined) return 0; if (pa === undefined) return 1; if (pb === undefined) return -1; return pa - pb; });
        return fijasIni.concat(resto, fijasFin);
    }

    /* ---------- Preparador ---------- */
    function abrirPreparador() {
        css();
        var prev = document.getElementById('ch-prep'); if (prev) prev.remove();
        C.lista = ordenadas();
        var ov = document.createElement('div'); ov.id = 'ch-prep';
        ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
        document.body.appendChild(ov);
        pintarPreparador();
    }
    function colorTipo(t) { return t === 'Rival' ? ROJO : (t === 'Nosotros' ? VERDE : (t === 'Confrontación' ? AMBAR : (t === 'ABP' ? MORADO : '#64748b'))); }
    function pintarPreparador() {
        var ov = document.getElementById('ch-prep'); if (!ov) return;
        var L = C.lista, n = L.filter(function (c) { return c.on; }).length;
        var h = '<div class="box"><div class="cab"><div><h3>📺 Preparar la charla</h3><p>Marca qué entra en la presentación y ordénala con las flechas. Portada y cierre van siempre. Se guarda para este partido.</p></div><button onclick="document.getElementById(\'ch-prep\').remove()" style="margin-left:auto;background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer">×</button></div><div class="lst">';
        L.forEach(function (c, i) {
            var col = colorTipo(c.tipo);
            h += '<div class="it' + (c.on ? '' : ' off') + '"><input type="checkbox"' + (c.on ? ' checked' : '') + (c.fijo ? ' disabled' : '') + ' onchange="chPrepToggle(' + i + ',this.checked)">'
               + '<span class="k" style="background:' + col + '22;color:' + col + ';border:1px solid ' + col + '66">' + esc(c.tipo) + '</span>'
               + '<div class="t">' + esc(c.titulo) + (c.sub ? '<small>' + esc(c.sub) + '</small>' : '') + '</div>'
               + (c.fijo ? '' : '<div class="mv"><button onclick="chPrepMover(' + i + ',-1)" title="Subir">▲</button> <button onclick="chPrepMover(' + i + ',1)" title="Bajar">▼</button></div>')
               + '</div>';
        });
        h += '</div><div class="pie"><button onclick="chPrepTodas(true)">Marcar todas</button><button onclick="chPrepTodas(false)">Solo portada y cierre</button><span class="n">' + n + ' diapositiva' + (n === 1 ? '' : 's') + '</span><button class="p" onclick="chPrepEmpezar()">▶ Empezar charla</button></div></div>';
        ov.innerHTML = h;
    }
    window.chPrepToggle = function (i, v) { C.lista[i].on = !!v; pintarPreparador(); };
    window.chPrepMover = function (i, d) {
        var L = C.lista, j = i + d; if (j < 1 || j > L.length - 2 || L[i].fijo || L[j].fijo) return;
        var t = L[i]; L[i] = L[j]; L[j] = t; pintarPreparador();
    };
    window.chPrepTodas = function (v) { C.lista.forEach(function (c) { if (!c.fijo) c.on = v; }); pintarPreparador(); };
    window.chPrepEmpezar = function () {
        var cfg = { off: {}, orden: [] };
        C.lista.forEach(function (c) { if (!c.on) cfg.off[c.key] = true; if (!c.fijo) cfg.orden.push(c.key); });
        cfgGuardar(cfg);
        var ov = document.getElementById('ch-prep'); if (ov) ov.remove();
        presentar(C.lista.filter(function (c) { return c.on; }));
    };

    /* ---------- Construccion de diapositivas ---------- */
    function minis(ms, lado, texto, titulo) {
        ms = medias(ms); if (!ms.length) return '';
        C.visorData = C.visorData || {};
        var id = 'v' + (++C.vid);
        C.visorData[id] = { items: ms, lado: lado, texto: texto || '', titulo: titulo || '' };
        var h = '<div class="ch-minis">';
        ms.forEach(function (m, i) {
            if (m.type === 'image') h += '<div class="ch-mini" onclick="chVisor(\'' + id + '\',' + i + ')"><img src="' + esc(m.url) + '" alt=""><span class="lupa">🔍</span>' + (m.title ? '<span class="cap">' + esc(m.title) + '</span>' : '') + '</div>';
            else h += '<a class="ch-mini" href="' + esc(m.url) + '" target="_blank" rel="noopener" style="text-decoration:none"><div class="vid">🎬</div><span class="cap">' + esc(m.title || 'Ver vídeo') + '</span></a>';
        });
        return h + '</div>';
    }
    function columna(lado, etiqueta, titulo, texto, ms) {
        var cuerpo = (texto && texto.trim()) ? '<div class="' + tamTexto(texto) + '">' + esc(texto) + '</div>' : '<div class="vacio">Sin anotaciones</div>';
        return '<div class="ch-col ' + lado + '"><span class="tag">' + (lado === 'r' ? '🔴 ' : '🟢 ') + esc(etiqueta) + '</span><div class="tit">' + esc(titulo) + '</div><div class="cuerpo">' + cuerpo + minis(ms, lado, texto, titulo) + '</div></div>';
    }
    function construir(sel) {
        var plan = pp.planActual, par = pp.partidoActual, our = ppGetOurPhases(), fases = ppGetFases();
        var rN = par.opponent || 'Rival', pN = clubNombre(), rL = rivalLogo(), pL = clubLogo();
        var fe = new Date(par.match_date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        var S = []; C.vid = 0; C.visorData = {};
        var logo = function (u, big) { var s = big ? 150 : 44; return u ? '<img src="' + esc(u) + '" style="width:' + s + 'px;height:' + s + 'px;object-fit:contain">' : '<div style="width:' + s + 'px;height:' + s + 'px;border-radius:18px;background:#1e293b;display:grid;place-items:center;font-size:' + (s / 2) + 'px">⚽</div>'; };
        sel.forEach(function (c) {
            if (c.key === 'portada') {
                S.push({ c: c, html: '<div class="ch-centro"><div style="display:flex;align-items:center;gap:40px"><div style="text-align:center">' + logo(pL, true) + '<div style="margin-top:10px;font-size:20px;font-weight:800;color:#86efac;text-transform:uppercase">' + esc(pN) + '</div></div><div style="font-size:54px;font-weight:900;color:#f59e0b">VS</div><div style="text-align:center">' + logo(rL, true) + '<div style="margin-top:10px;font-size:20px;font-weight:800;color:#fca5a5;text-transform:uppercase">' + esc(rN) + '</div></div></div><div style="font-size:clamp(28px,4vw,52px);font-weight:900;color:#fff;letter-spacing:1px;text-transform:uppercase">Plan de partido</div><div style="font-size:20px;color:#94a3b8">' + (par.competition ? esc(par.competition) + ' · ' : '') + fe + (par.kick_off_time ? ' · ' + String(par.kick_off_time).slice(0, 5) + 'h' : '') + '</div></div>' });
            } else if (c.key === 'sistema') {
                var sP = ppParseFormacion(plan.rival_formation);
                S.push({ c: c, html: '<div class="ch-sec" style="color:#fca5a5">Rival</div><h1 class="ch-h1">' + esc(rN) + ' · ' + esc(plan.rival_formation) + '</h1><div style="display:flex;justify-content:center;align-items:center;height:calc(100% - 90px)">' + ppRenderCampo(sP, (plan.weekly_map && plan.weekly_map.rival_lineup) || {}, plan.rival_players || [], 'big') + '</div>' });
            } else if (c.key === 'scouting') {
                S.push({ c: c, html: '<div class="ch-sec" style="color:#fca5a5">Rival · Scouting</div><h1 class="ch-h1">' + esc(rN) + (plan.rival_style ? ' <span style="font-size:.5em;color:#94a3b8;font-weight:500">· ' + esc(plan.rival_style) + '</span>' : '') + '</h1><div class="ch-kv" style="height:calc(100% - 100px)"><div><h3 style="color:#22c55e">💪 Puntos fuertes</h3><div class="' + tamTexto(plan.rival_strengths) + '">' + esc(plan.rival_strengths || '—') + '</div></div><div><h3 style="color:#ef4444">🎯 Puntos débiles</h3><div class="' + tamTexto(plan.rival_weaknesses) + '">' + esc(plan.rival_weaknesses || '—') + '</div></div></div>' });
            } else if (c.key.indexOf('conf:') === 0) {
                var f = fases[c.fi]; if (!f) return;
                var sec = c.sec, od = sec ? (our[sec.id] || {}) : null;
                var der = sec ? columna('n', pN, sec.title, od.notes, od.media) : '<div class="ch-col n" style="justify-content:center;align-items:center"><div class="vacio">Sin respuesta emparejada</div></div>';
                S.push({ c: c, html: '<div class="ch-split">' + columna('r', rN, f.title, f.notes, f.media) + der + '</div>', split: true });
            } else if (c.key.indexOf('our:') === 0) {
                var d = our[c.sec.id] || {};
                S.push({ c: c, html: '<div class="ch-split"><div class="ch-col n" style="grid-column:1 / -1">' + '<span class="tag">🟢 ' + esc(pN) + '</span><div class="tit">' + esc(c.sec.title) + '</div><div class="cuerpo"><div class="' + tamTexto(d.notes) + '">' + esc(d.notes || '') + '</div>' + minis(d.media, 'n', d.notes, c.sec.title) + '</div></div></div>', split: true });
            } else if (c.key.indexOf('abp:') === 0) {
                var a = c.abp, col = a.tipo === 'ofensiva' ? VERDE : '#3b82f6', roles = [];
                if (a.tipo === 'ofensiva') { PP_ABP_ROLES_OF.forEach(function (r) { var pls = a['of_' + r] || []; if (pls.length) roles.push('<b style="color:' + col + '">' + PP_ABP_ROLES_OF_LABELS[r] + ':</b> ' + pls.map(function (pid) { return esc(ppAbpPlayerName(pid, pp.plantilla)); }).join(', ')); }); if (a.sena) roles.push('<b style="color:#a855f7">Seña:</b> ' + esc(a.sena)); }
                else { (a.marcas || []).forEach(function (m, i) { if (m.rival_idx || m.propio_id) { var rn = ppAbpPlayerName(m.rival_idx, (plan.rival_players || []).map(function (j, k) { return { id: 'r_' + k, number: j.number, name: j.name }; })); roles.push('<b style="color:#f59e0b">Marca ' + (i + 1) + ':</b> ' + esc(rn) + ' ⚔️ ' + esc(ppAbpPlayerName(m.propio_id, pp.plantilla))); } }); PP_ABP_ROLES_DF.forEach(function (r) { var pls = a['df_' + r] || []; if (pls.length) roles.push('<b style="color:' + col + '">' + PP_ABP_ROLES_DF_LABELS[r] + ':</b> ' + pls.map(function (pid) { return esc(ppAbpPlayerName(pid, pp.plantilla)); }).join(', ')); }); }
                var img = a.imagen && a.imagen.length > 50 ? [{ type: 'image', url: a.imagen, title: a.pizarra_nombre || a.name || 'ABP' }] : [];
                var tags = [a.subtipo, a.espacio, a.perfil].filter(Boolean).join(' · ');
                S.push({ c: c, html: '<div class="ch-sec" style="color:' + col + '">ABP ' + esc(a.tipo || '') + (tags ? ' · <span style="color:#64748b">' + esc(tags) + '</span>' : '') + '</div><h1 class="ch-h1">' + esc(a.name || 'ABP') + '</h1><div style="display:grid;grid-template-columns:' + (img.length ? '1.3fr 1fr' : '1fr') + ';gap:26px;height:calc(100% - 100px)">' + (img.length ? '<div style="min-height:0;display:flex;align-items:center;justify-content:center"><img src="' + esc(img[0].url) + '" onclick="chVisorDirecto(this.src,\'' + esc(a.name || 'ABP').replace(/'/g, '') + '\')" style="max-width:100%;max-height:100%;border-radius:12px;border:3px solid ' + col + ';cursor:zoom-in"></div>' : '') + '<div style="overflow-y:auto">' + (roles.length ? '<div style="font-size:clamp(16px,1.7vw,21px);line-height:1.9;color:#e2e8f0">' + roles.join('<br>') + '</div>' : '') + (a.explicacion ? '<div class="' + tamTexto(a.explicacion) + '" style="margin-top:14px;color:#cbd5e1">' + esc(a.explicacion) + '</div>' : '') + '</div></div>' });
            } else if (c.key === 'cierre') {
                S.push({ c: c, html: '<div class="ch-centro">' + logo(pL, true) + '<div style="font-size:clamp(34px,5vw,64px);font-weight:900;color:#f59e0b;letter-spacing:2px">VAMOS A POR ELLOS</div><div style="font-size:22px;color:#94a3b8">' + esc(pN) + ' · ' + fe + '</div></div>' });
            }
        });
        return S;
    }

    /* ---------- Presentacion ---------- */
    function presentar(sel) {
        css();
        C.slides = construir(sel); C.idx = 0;
        if (!C.slides.length) { showToast('Sin contenido para la charla'); return; }
        var prev = document.getElementById('ch-ov'); if (prev) prev.remove();
        var par = pp.partidoActual, rN = par.opponent || 'Rival', pN = clubNombre();
        var fe = new Date(par.match_date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
        var lg = function (u, emoji) { return u ? '<img src="' + esc(u) + '" alt="">' : '<span style="font-size:26px">' + emoji + '</span>'; };
        var ov = document.createElement('div'); ov.id = 'ch-ov';
        ov.innerHTML = '<div class="ch-top">' + lg(clubLogo(), '⚽') + '<span class="eq" style="color:#86efac">' + esc(pN) + '</span><span class="vs">VS</span>' + lg(rivalLogo(), '🛡️') + '<span class="eq" style="color:#fca5a5">' + esc(rN) + '</span><div class="info">' + esc(par.competition || '') + '<br>' + fe + (par.kick_off_time ? ' · ' + String(par.kick_off_time).slice(0, 5) + 'h' : '') + '</div></div>'
            + '<div class="ch-prog"><i id="ch-prog"></i></div><div class="ch-body" id="ch-body"></div>'
            + '<div class="ch-bot"><button onclick="chNav(-1)">← Anterior</button><div class="ch-dots" id="ch-dots"></div><span class="ch-cnt" id="ch-cnt"></span><button onclick="chGrid()" title="Ver todas (G)">▦ Índice</button><button onclick="chFull()" title="Pantalla completa (F)">⛶</button><button class="p" onclick="chNav(1)">Siguiente →</button><button class="x" onclick="chCerrar()">✕ Salir</button></div>';
        document.body.appendChild(ov);
        ov.addEventListener('touchstart', function (e) { C.touchX = e.touches[0].clientX; }, { passive: true });
        ov.addEventListener('touchend', function (e) { if (C.touchX === null || document.getElementById('ch-visor')) return; var dx = e.changedTouches[0].clientX - C.touchX; if (Math.abs(dx) > 70) chNav(dx < 0 ? 1 : -1); C.touchX = null; }, { passive: true });
        document.addEventListener('keydown', teclas);
        pintar();
        try { if (ov.requestFullscreen) { var fp = ov.requestFullscreen(); if (fp && fp.catch) fp.catch(function () {}); } } catch (e) {}
    }
    function pintar() {
        var s = C.slides[C.idx], b = document.getElementById('ch-body'); if (!b) return;
        b.innerHTML = '<div class="ch-slide" id="ch-slide">' + s.html + '</div>';
        var p = document.getElementById('ch-prog'); if (p) p.style.width = ((C.idx + 1) / C.slides.length * 100) + '%';
        var cnt = document.getElementById('ch-cnt'); if (cnt) cnt.textContent = (C.idx + 1) + ' / ' + C.slides.length;
        var d = document.getElementById('ch-dots'); if (d) d.innerHTML = C.slides.map(function (x, i) { var eq = x.c.equipo === 'rival' ? 'r' : (x.c.equipo === 'own' ? 'n' : ''); return '<button class="ch-dot ' + eq + (i === C.idx ? ' a' : '') + '" onclick="chIr(' + i + ')" title="' + esc(x.c.titulo) + '"></button>'; }).join('');
    }
    window.chNav = function (d) { var n = C.idx + d; if (n < 0 || n >= C.slides.length) return; C.idx = n; pintar(); };
    window.chIr = function (i) { var g = document.getElementById('ch-grid'); if (g) g.remove(); C.idx = i; pintar(); };
    window.chGrid = function () {
        var g = document.getElementById('ch-grid'); if (g) { g.remove(); return; }
        var b = document.getElementById('ch-body'); if (!b) return;
        var h = '<div class="ch-grid" id="ch-grid">';
        C.slides.forEach(function (s, i) { var col = colorTipo(s.c.tipo); h += '<div class="ch-gi' + (i === C.idx ? ' a' : '') + '" onclick="chIr(' + i + ')"><span class="n">' + (i + 1) + ' · <span style="color:' + col + ';font-weight:700">' + esc(s.c.tipo) + '</span></span><span class="t">' + esc(s.c.titulo) + '</span>' + (s.c.sub ? '<span class="s">' + esc(s.c.sub) + '</span>' : '') + '</div>'; });
        b.insertAdjacentHTML('beforeend', h + '</div>');
    };
    window.chFull = function () { var ov = document.getElementById('ch-ov'); try { if (document.fullscreenElement) document.exitFullscreen(); else if (ov && ov.requestFullscreen) ov.requestFullscreen(); } catch (e) {} };
    window.chCerrar = function () { var ov = document.getElementById('ch-ov'); if (ov) ov.remove(); var v = document.getElementById('ch-visor'); if (v) v.remove(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} document.removeEventListener('keydown', teclas); };
    function teclas(e) {
        var v = document.getElementById('ch-visor');
        if (v) { if (e.key === 'Escape') { v.remove(); } else if (e.key === 'ArrowRight') chVisorNav(1); else if (e.key === 'ArrowLeft') chVisorNav(-1); e.preventDefault(); return; }
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); chNav(1); }
        else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); chNav(-1); }
        else if (e.key === 'Escape') { var g = document.getElementById('ch-grid'); if (g) g.remove(); else chCerrar(); }
        else if (e.key === 'g' || e.key === 'G') chGrid();
        else if (e.key === 'f' || e.key === 'F') chFull();
        else if (e.key === 'Home') chIr(0);
        else if (e.key === 'End') chIr(C.slides.length - 1);
    }

    /* ---------- Visor (imagen en grande + texto) ---------- */
    window.chVisor = function (id, i) {
        var d = C.visorData && C.visorData[id]; if (!d) return;
        C.visor = { d: d, i: i };
        var prev = document.getElementById('ch-visor'); if (prev) prev.remove();
        var v = document.createElement('div'); v.id = 'ch-visor';
        v.onclick = function (e) { if (e.target === v || e.target.classList.contains('med')) v.remove(); };
        // dentro de #ch-ov: en pantalla completa solo se ve lo que cuelga del elemento a pantalla completa
        (document.getElementById('ch-ov') || document.body).appendChild(v);
        pintarVisor();
    };
    window.chVisorDirecto = function (src, titulo) {
        C.visorData = C.visorData || {}; C.visorData.__d = { items: [{ type: 'image', url: src, title: titulo }], lado: '', texto: '', titulo: titulo };
        chVisor('__d', 0);
    };
    function pintarVisor() {
        var v = document.getElementById('ch-visor'), x = C.visor; if (!v || !x) return;
        var imgs = x.d.items.filter(function (m) { return m.type === 'image'; });
        var m = x.d.items[x.i]; if (!m) return;
        var n = imgs.length;
        v.innerHTML = '<div class="cab"><span class="t">' + esc(x.d.titulo) + '</span><span class="c">' + esc(m.title || '') + (n > 1 ? ' · ' + (imgs.indexOf(m) + 1) + ' / ' + n : '') + '</span><button onclick="document.getElementById(\'ch-visor\').remove()">✕ Cerrar (Esc)</button></div>'
            + '<div class="med"><img src="' + esc(m.url) + '" alt="">' + (n > 1 ? '<button class="fl i" onclick="chVisorNav(-1)">‹</button><button class="fl d" onclick="chVisorNav(1)">›</button>' : '') + '</div>'
            + (x.d.texto ? '<div class="txt ' + x.d.lado + '">' + esc(x.d.texto) + '</div>' : '');
    }
    window.chVisorNav = function (d) {
        var x = C.visor; if (!x) return;
        var imgs = x.d.items.map(function (m, i) { return m.type === 'image' ? i : -1; }).filter(function (i) { return i >= 0; });
        var k = imgs.indexOf(x.i); if (k < 0) return;
        x.i = imgs[(k + d + imgs.length) % imgs.length]; pintarVisor();
    };

    /* ---------- Pestana Confrontacion: imagenes y pizarra en cada fase ---------- */
    function pickerPizarra(cb) {
        var prev = document.getElementById('ch-piz'); if (prev) prev.remove();
        var ov = document.createElement('div'); ov.id = 'ch-piz';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
        ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
        ov.innerHTML = '<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:14px;max-width:780px;width:100%;max-height:85vh;display:flex;flex-direction:column"><div style="padding:14px 18px;border-bottom:1px solid #1e3a5f;display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0;color:#c4b5fd;font-size:15px">🎨 Elegir un dibujo de la pizarra</h3><button onclick="document.getElementById(\'ch-piz\').remove()" style="background:none;border:none;color:#9ca3af;font-size:20px;cursor:pointer">×</button></div><div id="ch-piz-body" style="padding:16px;overflow-y:auto;color:#94a3b8;font-size:13px">Cargando proyectos...</div></div>';
        document.body.appendChild(ov);
        (async function () {
            try {
                var cId = window.clubId || clubId;
                var rp = await supabaseClient.from('pizarra_proyectos').select('id, nombre').or('club_id.eq.' + cId + ',coach_id.eq.' + String(usuario.id)).order('updated_at', { ascending: false });
                if (rp.error) throw rp.error;
                var proys = rp.data || [];
                if (!proys.length) { document.getElementById('ch-piz-body').innerHTML = 'No tienes proyectos de pizarra. Dibuja en Ejercicios → Pizarra y guarda las fases en un proyecto.'; return; }
                var ri = await supabaseClient.from('pizarra_proyecto_items').select('id, proyecto_id, orden, nombre, thumbnail_svg').in('proyecto_id', proys.map(function (p) { return p.id; })).order('orden');
                if (ri.error) throw ri.error;
                var items = ri.data || [], h = '';
                C.pizItems = {};
                proys.forEach(function (p) {
                    var its = items.filter(function (i) { return i.proyecto_id === p.id; }); if (!its.length) return;
                    h += '<div style="margin-bottom:16px"><div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:8px">📁 ' + esc(p.nombre) + '</div><div style="display:flex;flex-wrap:wrap;gap:10px">';
                    its.forEach(function (it, k) {
                        var src = it.thumbnail_svg ? (it.thumbnail_svg.trim().indexOf('data:') === 0 ? it.thumbnail_svg.trim() : 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(it.thumbnail_svg)))) : '';
                        var nombre = (p.nombre || '') + ' / ' + (it.nombre || ('Fase ' + (k + 1)));
                        C.pizItems[it.id] = { svg: it.thumbnail_svg, nombre: nombre };
                        h += '<div onclick="chPizElegir(\'' + it.id + '\')" style="width:150px;cursor:pointer;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:6px;text-align:center" onmouseenter="this.style.borderColor=\'#7c3aed\'" onmouseleave="this.style.borderColor=\'#334155\'">' + (src ? '<img src="' + src + '" style="width:100%;aspect-ratio:8/5;object-fit:cover;border-radius:4px;background:#0f4c2a">' : '<div style="width:100%;aspect-ratio:8/5;background:#0f4c2a;border-radius:4px"></div>') + '<div style="font-size:11px;color:#cbd5e1;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(it.nombre || ('Fase ' + (k + 1))) + '</div></div>';
                    });
                    h += '</div></div>';
                });
                document.getElementById('ch-piz-body').innerHTML = h || 'Tus proyectos no tienen fases guardadas todavía.';
                C.pizCb = cb;
            } catch (e) { document.getElementById('ch-piz-body').innerHTML = 'Error: ' + esc(e.message); }
        })();
    }
    window.chPizElegir = async function (itemId) {
        var ov = document.getElementById('ch-piz'); if (ov) ov.remove();
        var it = C.pizItems && C.pizItems[itemId]; if (!it) return;
        var img = await ppThumbADataUrl(it.svg);
        if (!img) { showToast('Ese dibujo no tiene miniatura; guarda la fase en la pizarra primero'); return; }
        if (C.pizCb) C.pizCb(img, it.nombre, itemId);
    };
    // Guardar media en fase rival (indice) o apartado propio (id)
    async function addMediaRival(i, url, title, tipo, pizId) {
        var f = ppGetFases(); if (!f[i].media) f[i].media = [];
        if (f[i].media.length >= PP_MAX_MEDIA_POR_FASE) { showToast('Máximo ' + PP_MAX_MEDIA_POR_FASE + ' por fase'); return; }
        var m = { url: url, title: title || '', type: tipo }; if (pizId) m.pizarra_item_id = pizId;
        f[i].media.push(m);
        if (await ppGuardarFasesArray(f)) { showToast('Añadido'); ppMostrarTab('confront'); }
    }
    async function addMediaOur(secId, url, title, tipo, pizId) {
        var ph = ppGetOurPhases(); if (!ph[secId]) ph[secId] = { notes: '', media: [] }; if (!ph[secId].media) ph[secId].media = [];
        if (ph[secId].media.length >= PP_MAX_MEDIA_POR_FASE) { showToast('Máximo ' + PP_MAX_MEDIA_POR_FASE + ' por apartado'); return; }
        var m = { url: url, title: title || '', type: tipo }; if (pizId) m.pizarra_item_id = pizId;
        ph[secId].media.push(m);
        await ppSaveOurPhases(ph); showToast('Añadido'); ppMostrarTab('confront');
    }
    window.chImgRival = function (i) { ppAbrirModalMedia('ch-media-ov', function (url, title, tipo) { addMediaRival(i, url, title, tipo); }); };
    window.chImgOur = function (secId) { ppAbrirModalMedia('ch-media-ov', function (url, title, tipo) { addMediaOur(secId, url, title, tipo); }); };
    window.chPizRival = function (i) { pickerPizarra(function (img, nombre, id) { addMediaRival(i, img, nombre, 'image', id); }); };
    window.chPizOur = function (secId) { pickerPizarra(function (img, nombre, id) { addMediaOur(secId, img, nombre, 'image', id); }); };
    window.chQuitarRival = async function (i, mi) { if (!confirm('¿Quitar esta imagen de la fase?')) return; var f = ppGetFases(); f[i].media.splice(mi, 1); if (await ppGuardarFasesArray(f)) ppMostrarTab('confront'); };
    window.chQuitarOur = async function (secId, mi) { if (!confirm('¿Quitar esta imagen del apartado?')) return; var ph = ppGetOurPhases(); if (ph[secId] && ph[secId].media) { ph[secId].media.splice(mi, 1); await ppSaveOurPhases(ph); ppMostrarTab('confront'); } };
    window.chVerImg = function (src, texto) { if (typeof ppMostrarVisor === 'function') ppMostrarVisor(src, texto); };

    function miniEdit(ms, texto, onQuitar) {
        ms = ms || []; if (!ms.length) return '';
        var h = '<div class="ch-mm">';
        ms.forEach(function (m, k) {
            if (!m || !m.url) return;
            h += '<div class="m">' + (m.type === 'image' ? '<img src="' + esc(m.url) + '" title="' + esc(m.title || '') + '" onclick="chVerImg(this.src,' + JSON.stringify(texto || '').replace(/"/g, '&quot;') + ')">' : '<a href="' + esc(m.url) + '" target="_blank" title="' + esc(m.title || 'Vídeo') + '">🎬</a>') + '<b onclick="' + onQuitar(k) + '" title="Quitar">×</b></div>';
        });
        return h + '</div>';
    }
    // Envuelve ppRenderConfront: añade botones de imagen/pizarra y miniaturas con borrado a cada tarjeta
    var origConfront = window.ppRenderConfront;
    window.ppRenderConfront = function () {
        css();
        var html = origConfront();
        try {
            var tmp = document.createElement('div'); tmp.innerHTML = html;
            var fases = ppGetFases(), our = ppGetOurPhases();
            var filas = Array.prototype.filter.call(tmp.firstChild.children, function (el) { return el.style && el.style.gridTemplateColumns === '1fr 1fr' && el.querySelector('textarea'); });
            // Las primeras N filas con dos tarjetas corresponden a las fases rivales en orden
            var k = 0;
            filas.forEach(function (fila) {
                var cards = fila.children; if (cards.length < 2) return;
                var izq = cards[0], der = cards[1];
                if (!izq.querySelector('textarea') || izq.style.borderLeftColor !== 'rgb(239, 68, 68)') return; // filas de "apartados sueltos" no entran
                var i = k++; var f = fases[i]; if (!f) return;
                // quitar las miniaturas que ya pinta el original (dentro de la tarjeta) y poner las editables
                Array.prototype.forEach.call(izq.querySelectorAll('div[style*="flex-wrap"]'), function (d) { d.remove(); });
                izq.insertAdjacentHTML('beforeend', miniEdit(f.media, f.notes, function (mi) { return 'chQuitarRival(' + i + ',' + mi + ')'; }) + '<div class="ch-acc"><button onclick="chImgRival(' + i + ')">📷 Imagen / vídeo</button><button onclick="chPizRival(' + i + ')">🎨 Dibujo de pizarra</button></div>');
                var pid = ppPairDe(f), sec = pid ? ppSeccionPropia(pid) : null;
                if (sec && der.querySelector('textarea')) {
                    var od = our[sec.id] || {};
                    Array.prototype.forEach.call(der.querySelectorAll('div[style*="flex-wrap"]'), function (d) { if (!d.querySelector('select')) d.remove(); });
                    der.insertAdjacentHTML('beforeend', miniEdit(od.media, od.notes, function (mi) { return 'chQuitarOur(\'' + sec.id + '\',' + mi + ')'; }) + '<div class="ch-acc"><button onclick="chImgOur(\'' + sec.id + '\')">📷 Imagen / vídeo</button><button onclick="chPizOur(\'' + sec.id + '\')">🎨 Dibujo de pizarra</button></div>');
                }
            });
            // aviso arriba
            var p = tmp.querySelector('p'); if (p) p.insertAdjacentHTML('afterend', '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:-6px 0 14px;padding:10px 12px;background:#111c33;border:1px solid #1e3a5f;border-radius:10px;font-size:12px;color:#94a3b8">📺 Lo que escribas y las imágenes de cada tarjeta son lo que verán los jugadores en la <b style="color:#e2e8f0">charla</b> (pantalla partida). <button onclick="ppPresentacion()" style="margin-left:auto;padding:6px 14px;background:#065f46;border:1px solid #10b981;color:#6ee7b7;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700">📺 Preparar charla</button></div>');
            return tmp.innerHTML;
        } catch (e) { console.warn('[charla] confrontacion', e); return html; }
    };

    /* ---------- Boton Charla ---------- */
    window.ppPresentacion = function () {
        if (!pp.planActual || !pp.partidoActual) { showToast('Selecciona un partido primero'); return; }
        abrirPreparador();
    };
})();
