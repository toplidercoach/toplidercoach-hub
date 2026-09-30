// ============================================================
// CLUB MODE - CESIONES (cm-cesiones.js)
// Un jugador pertenece a su equipo (season_players.team_id) y puede estar
// "convocado" por otro equipo del club durante un periodo (club_player_loans).
// Mientras dura, aparece en la plantilla, sesiones, asistencia y convocatorias
// del equipo receptor, marcado como "Cedido de <equipo>".
//
// Ofrece a los demas modulos:
//   cmFiltroEquipoOr()           -> string para .or() de season_players (equipo + cedidos) o null
//   cmAplicarFiltroEquipo(q)     -> aplica ese filtro a un query builder de season_players
//   cmEsCedido(playerId)         -> nombre del equipo de origen si el jugador esta cedido al equipo seleccionado
//   cmCesionesAbrirModal()       -> modal para convocar / terminar cesiones (Mi Club > Plantilla)
// ============================================================
(function () {
    'use strict';

    var estado = { cesiones: [], cargadas: false, cargando: null };

    function hoy() { return new Date().toISOString().slice(0, 10); }
    function equipoNombre(id) { var e = (window.cmState && cmState.equipos || []).find(function (x) { return x.id === id; }); return e ? e.name : ''; }
    function equiposAccesoIds() { return (window.cmState && cmState.equiposAcceso || []).map(function (e) { return e.id; }); }

    // ---------- Carga de cesiones vigentes del club ----------
    async function cargar() {
        if (!window.cmState || !cmState.activo || !window.clubId) { estado.cesiones = []; estado.cargadas = true; return; }
        try {
            var h = hoy();
            var r = await supabaseClient.from('club_player_loans')
                .select('id, player_id, from_team_id, to_team_id, start_date, end_date, note')
                .eq('club_id', clubId).eq('active', true).lte('start_date', h).or('end_date.is.null,end_date.gte.' + h);
            estado.cesiones = r.data || [];
        } catch (e) { console.warn('[Cesiones] no se pudieron cargar:', e.message); estado.cesiones = []; }
        estado.cargadas = true;
        document.dispatchEvent(new CustomEvent('cmCesionesChanged'));
    }
    window.cmCesionesRecargar = cargar;

    // ---------- Filtro compartido ----------
    function cedidosA(teamIds) {
        return estado.cesiones.filter(function (c) { return teamIds.indexOf(c.to_team_id) >= 0; }).map(function (c) { return c.player_id; });
    }
    window.cmFiltroEquipoOr = function () {
        if (!window.cmState || !cmState.activo) return null;
        var ids, base;
        if (cmState.equipoSeleccionado) {
            base = 'team_id.eq.' + cmState.equipoSeleccionado.id + ',team_id.is.null';
            ids = cedidosA([cmState.equipoSeleccionado.id]);
        } else if (cmState.esAdmin || cmState.teamScope === 'all') {
            return null; // todo el club
        } else {
            var acc = equiposAccesoIds();
            if (!acc.length) return 'team_id.is.null';
            base = 'team_id.in.(' + acc.join(',') + '),team_id.is.null';
            ids = cedidosA(acc);
        }
        return ids.length ? base + ',player_id.in.(' + ids.join(',') + ')' : base;
    };
    window.cmAplicarFiltroEquipo = function (q) { var f = window.cmFiltroEquipoOr(); return f ? q.or(f) : q; };
    window.cmEsCedido = function (playerId) {
        if (!window.cmState || !cmState.activo) return '';
        var teams = cmState.equipoSeleccionado ? [cmState.equipoSeleccionado.id] : equiposAccesoIds();
        var c = estado.cesiones.find(function (x) { return x.player_id === playerId && teams.indexOf(x.to_team_id) >= 0; });
        return c ? (equipoNombre(c.from_team_id) || 'otro equipo') : '';
    };

    // ---------- UI: modal de cesiones ----------
    var css = '#cmces-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9600;display:flex;align-items:center;justify-content:center;padding:16px}'
        + '#cmces-modal{background:#1e293b;color:#e2e8f0;border-radius:14px;width:min(640px,100%);max-height:92vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.5);font-family:system-ui,sans-serif}'
        + '#cmces-modal .hd{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #334155}'
        + '#cmces-modal .hd b{font-size:17px}#cmces-modal .hd button{background:none;border:0;color:#94a3b8;font-size:22px;cursor:pointer}'
        + '#cmces-modal .bd{padding:18px 20px}'
        + '#cmces-modal label{display:block;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 6px}'
        + '#cmces-modal select,#cmces-modal input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#fff;font-size:14px}'
        + '#cmces-modal .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}'
        + '#cmces-modal .btn{padding:11px 18px;border-radius:8px;border:0;font-weight:700;cursor:pointer;font-size:14px}'
        + '#cmces-modal .btn.p{background:#f59e0b;color:#1a1200}#cmces-modal .btn.s{background:#334155;color:#fff}#cmces-modal .btn.d{background:none;color:#fca5a5;padding:6px 8px}'
        + '#cmces-modal .lista{margin-top:18px;border-top:1px solid #334155;padding-top:12px}'
        + '#cmces-modal .it{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1f2937;font-size:14px}'
        + '#cmces-modal .it small{color:#94a3b8;display:block;font-size:12px}#cmces-modal .it .sp{flex:1}'
        + '#cmces-modal .hint{font-size:13px;color:#94a3b8;margin:0 0 6px}'
        + '.pcard-cedido{position:absolute;left:0;right:0;bottom:0;background:#7c3aed;color:#fff;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;text-align:center;padding:3px 4px;z-index:6}'
        + '.add-cesion-card{border:2px dashed #7c3aed;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;color:#a78bfa;font-weight:700;font-size:13px;min-height:160px;padding:12px;text-align:center;background:rgba(124,58,237,.06)}'
        + '.add-cesion-card .icon{font-size:26px}.add-cesion-card:hover{background:rgba(124,58,237,.14)}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    function cerrar() { var o = document.getElementById('cmces-overlay'); if (o) o.remove(); }

    window.cmCesionesAbrirModal = async function () {
        if (!window.cmState || !cmState.activo) return;
        var destino = cmState.equipoSeleccionado;
        if (!destino) { if (typeof showToast === 'function') showToast('Selecciona un equipo arriba para convocar jugadores a el.'); return; }
        cerrar();
        var o = document.createElement('div'); o.id = 'cmces-overlay';
        o.innerHTML = '<div id="cmces-modal"><div class="hd"><b>Convocar jugador de otro equipo → ' + destino.name + '</b><button type="button" id="cmces-x">×</button></div>'
            + '<div class="bd"><p class="hint">El jugador seguira en su equipo y, mientras dure la convocatoria, aparecera tambien en la plantilla, sesiones, asistencia y convocatorias de <b>' + destino.name + '</b>.</p>'
            + '<label>Equipo de origen</label><select id="cmces-equipo"><option value="">Cargando…</option></select>'
            + '<label>Jugador</label><select id="cmces-jugador" disabled><option value="">Elige primero el equipo</option></select>'
            + '<div class="row"><div><label>Desde</label><input type="date" id="cmces-desde" value="' + hoy() + '"></div><div><label>Hasta (vacio = indefinido)</label><input type="date" id="cmces-hasta"></div></div>'
            + '<label>Nota (opcional)</label><input type="text" id="cmces-nota" placeholder="Ej.: entrena martes y jueves, disponible para el partido del sabado">'
            + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px"><button class="btn s" type="button" id="cmces-cancel">Cancelar</button><button class="btn p" type="button" id="cmces-save">Convocar</button></div>'
            + '<div class="lista"><label>Convocados actualmente en ' + destino.name + '</label><div id="cmces-lista"><small style="color:#94a3b8">Cargando…</small></div></div></div></div>';
        document.body.appendChild(o);
        o.addEventListener('click', function (e) { if (e.target === o) cerrar(); });
        document.getElementById('cmces-x').onclick = cerrar; document.getElementById('cmces-cancel').onclick = cerrar;

        // Equipos de origen: todos los del club menos el destino
        var selE = document.getElementById('cmces-equipo');
        selE.innerHTML = '<option value="">Elige un equipo</option>' + (cmState.equipos || []).filter(function (e) { return e.id !== destino.id; }).map(function (e) { return '<option value="' + e.id + '">' + e.name + '</option>'; }).join('');
        selE.onchange = async function () {
            var selJ = document.getElementById('cmces-jugador');
            selJ.disabled = true; selJ.innerHTML = '<option value="">Cargando…</option>';
            if (!selE.value) { selJ.innerHTML = '<option value="">Elige primero el equipo</option>'; return; }
            var r = await supabaseClient.from('season_players').select('player_id, shirt_number, players(id, name, position)')
                .eq('season_id', seasonId).eq('team_id', selE.value).order('shirt_number');
            var ya = estado.cesiones.filter(function (c) { return c.to_team_id === destino.id; }).map(function (c) { return c.player_id; });
            var opts = (r.data || []).filter(function (sp) { return sp.players && ya.indexOf(sp.player_id) < 0; })
                .map(function (sp) { return '<option value="' + sp.player_id + '">' + (sp.shirt_number ? sp.shirt_number + ' · ' : '') + sp.players.name + (sp.players.position ? ' (' + sp.players.position + ')' : '') + '</option>'; });
            selJ.innerHTML = opts.length ? '<option value="">Elige un jugador</option>' + opts.join('') : '<option value="">Este equipo no tiene jugadores disponibles</option>';
            selJ.disabled = !opts.length;
        };

        document.getElementById('cmces-save').onclick = async function () {
            var pid = document.getElementById('cmces-jugador').value, desde = document.getElementById('cmces-desde').value, hasta = document.getElementById('cmces-hasta').value;
            if (!selE.value || !pid) { if (typeof showToast === 'function') showToast('Elige equipo y jugador.'); return; }
            if (hasta && hasta < desde) { if (typeof showToast === 'function') showToast('La fecha "hasta" no puede ser anterior a "desde".'); return; }
            var r = await supabaseClient.from('club_player_loans').insert({
                club_id: clubId, season_id: seasonId, player_id: pid, from_team_id: selE.value, to_team_id: destino.id,
                start_date: desde, end_date: hasta || null, note: document.getElementById('cmces-nota').value || null,
                created_by: (window.usuario && (usuario.display_name || usuario.name)) || null
            });
            if (r.error) { if (typeof showToast === 'function') showToast('No se pudo guardar: ' + r.error.message); return; }
            await cargar(); await pintarLista(destino); refrescarPlantilla();
            if (typeof showToast === 'function') showToast('Jugador convocado a ' + destino.name);
            document.getElementById('cmces-jugador').value = ''; selE.onchange();
        };
        await pintarLista(destino);
    };

    async function pintarLista(destino) {
        var cont = document.getElementById('cmces-lista'); if (!cont) return;
        var mias = estado.cesiones.filter(function (c) { return c.to_team_id === destino.id; });
        if (!mias.length) { cont.innerHTML = '<small style="color:#94a3b8">Ningun jugador convocado de otros equipos.</small>'; return; }
        var ids = mias.map(function (c) { return c.player_id; });
        var r = await supabaseClient.from('players').select('id, name').in('id', ids);
        var nombres = {}; (r.data || []).forEach(function (p) { nombres[p.id] = p.name; });
        cont.innerHTML = mias.map(function (c) {
            return '<div class="it"><div class="sp"><b>' + (nombres[c.player_id] || 'Jugador') + '</b><small>de ' + (equipoNombre(c.from_team_id) || '—') + ' · desde ' + c.start_date + (c.end_date ? ' hasta ' + c.end_date : ' · indefinido') + (c.note ? ' · ' + c.note : '') + '</small></div>'
                + '<button class="btn d" type="button" data-fin="' + c.id + '">Terminar</button></div>';
        }).join('');
        cont.querySelectorAll('[data-fin]').forEach(function (b) {
            b.onclick = async function () {
                if (!confirm('¿Terminar esta convocatoria? El jugador dejara de aparecer en ' + destino.name + '.')) return;
                var r2 = await supabaseClient.from('club_player_loans').update({ active: false, end_date: hoy() }).eq('id', b.dataset.fin);
                if (r2.error) { if (typeof showToast === 'function') showToast('No se pudo terminar: ' + r2.error.message); return; }
                await cargar(); await pintarLista(destino); refrescarPlantilla();
            };
        });
    }
    function refrescarPlantilla() { try { if (typeof cargarPlantilla === 'function') cargarPlantilla(); } catch (e) {} }

    // ---------- Arranque y refresco ----------
    var t0 = Date.now();
    (function esperar() {
        if (window.cmState && cmState.activo && window.clubId) { cargar(); return; }
        if (Date.now() - t0 < 600000) setTimeout(esperar, Date.now() - t0 < 30000 ? 100 : 500);
    })();
    // Las cesiones son de todo el club: se cargan una vez y se refrescan al crear/terminar.
    // Al cambiar de equipo no hace falta recargar (evita carreras con los modulos que repintan).
})();
