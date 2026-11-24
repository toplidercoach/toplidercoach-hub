// ========== EJ-TLC.JS (v2) - Publicar ejercicios en la biblioteca TopLiderCoach ==========
// La biblioteca TopLiderCoach (ejercicios de los mejores entrenadores) es distinta de "Mis ejercicios" y de la Comunidad.
// Solo los administradores publican en ella, desde la ficha de un ejercicio de su banco ya dibujado con la pizarra.
// Tabla de Supabase: tlc_ejercicios (ids a partir de 1.000.000, para no chocar con los de WordPress).
// Entrenador y equipo se guardan tambien en el ejercicio del banco (custom_exercises.entrenador / equipo): son datos
// de esta biblioteca y no aparecen en la ficha de los usuarios.
var ejTlc = { pub: null, opciones: null };

function ejTlcEsc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function ejTlcLimpio(v) { return String(v === null || v === undefined ? '' : v).replace(/_/g, ' ').replace(/\s+/g, ' ').trim(); }

// Si el texto ya existe en la lista (sin mirar mayusculas ni acentos), se devuelve escrito como en la lista
function ejTlcCanon(v, lista) {
    v = ejTlcLimpio(v);
    if (!v) return '';
    var llano = function (t) { return String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    var k = llano(v);
    for (var i = 0; i < (lista || []).length; i++) if (llano(lista[i]) === k) return lista[i];
    return v;
}
function ejTlcTemaAlternar(b) { b.className = 'ej-tlc-chip' + (/\bon\b/.test(b.className) ? '' : ' on'); }
function ejTlcTemaNuevo() {
    var inp = document.getElementById('ej-tlc-tema-nuevo'), caja = document.getElementById('ej-tlc-temas');
    if (!inp || !caja) return;
    var op = ejTlc.opciones || { temas: [] };
    String(inp.value || '').split(',').forEach(function (t) {
        t = ejTlcCanon(t, op.temas);
        if (!t) return;
        var chips = caja.querySelectorAll('.ej-tlc-chip'), ya = null;
        for (var i = 0; i < chips.length; i++) if (chips[i].getAttribute('data-t').toLowerCase() === t.toLowerCase()) ya = chips[i];
        if (!ya) {
            if (!chips.length) caja.innerHTML = '';
            ya = document.createElement('button'); ya.type = 'button'; ya.setAttribute('data-t', t); ya.textContent = t;
            ya.onclick = function () { ejTlcTemaAlternar(ya); };
            caja.appendChild(ya);
        }
        ya.className = 'ej-tlc-chip on';
        ya.scrollIntoView({ block: 'nearest' });
    });
    inp.value = '';
}

// Boton de la ficha: solo para administradores (los mismos que publican en la Comunidad)
function ejTlcBoton() {
    var ref = document.getElementById('ej-btn-comunidad');
    if (!ref || typeof ejComunidadEsAdmin !== 'function') return;
    var b = document.getElementById('ej-btn-tlc');
    if (!ejComunidadEsAdmin()) { if (b) b.style.display = 'none'; return; }
    if (!b) {
        b = document.createElement('button');
        b.id = 'ej-btn-tlc'; b.type = 'button';
        b.textContent = 'TopLiderCoach';
        b.title = 'Publicar este ejercicio en la biblioteca TopLiderCoach (ejercicios de entrenadores)';
        b.style.cssText = 'padding:9px 16px;background:#b45309;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600';
        b.onclick = function () { ejTlcAbrir(); };
        ref.parentNode.insertBefore(b, ref.nextSibling);
    }
    b.style.display = '';
}

// Entrenadores, equipos y temas ya usados (WordPress + nuestra tabla), para escribirlos siempre igual
async function ejTlcOpciones() {
    if (ejTlc.opciones) return ejTlc.opciones;
    var o = { entrenadores: {}, equipos: {}, temas: {} };
    try {
        if (typeof API_BASE !== 'undefined') {
            var d = await (await fetch(API_BASE + '/filtros')).json();
            if (d && d.filtros) ['entrenadores', 'equipos', 'temas'].forEach(function (k) { (d.filtros[k] || []).forEach(function (v) { v = ejTlcLimpio(v); if (v) o[k][v.toLowerCase()] = v; }); });
        }
    } catch (e) { /* sin WordPress se sigue con lo nuestro */ }
    try {
        var r = await supabaseClient.from('tlc_ejercicios').select('entrenador, equipo, tema').range(0, 999);
        (r.data || []).forEach(function (x) {
            [['entrenadores', x.entrenador], ['equipos', x.equipo]].forEach(function (p) { var v = ejTlcLimpio(p[1]); if (v) o[p[0]][v.toLowerCase()] = v; });
            String(x.tema || '').split(',').forEach(function (t) { t = ejTlcLimpio(t); if (t) o.temas[t.toLowerCase()] = t; });
        });
    } catch (e) { /* sin lista de sugerencias */ }
    var lista = function (m) { return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a, b) { return a.localeCompare(b, 'es'); }); };
    ejTlc.opciones = { entrenadores: lista(o.entrenadores), equipos: lista(o.equipos), temas: lista(o.temas) };
    return ejTlc.opciones;
}

async function ejTlcAbrir() {
    if (typeof ejComunidadEsAdmin !== 'function' || !ejComunidadEsAdmin()) return;
    if (!ejEditandoId) { ejToast('Guarda primero el ejercicio para poder publicarlo.', 'warning'); return; }
    var o, pub = null, op;
    try {
        var r = await supabaseClient.from('custom_exercises').select('*').eq('id', ejEditandoId).single();
        if (r.error) throw r.error;
        o = r.data;
        var p = await supabaseClient.from('tlc_ejercicios').select('id, activo, updated_at, tema, dificultad').eq('origen_id', ejEditandoId).limit(1);
        if (p.error) throw p.error;
        pub = (p.data || [])[0] || null;
        op = await ejTlcOpciones();
    } catch (e) { ejToast('No se ha podido abrir: ' + (e.message || e), 'error'); return; }
    ejTlc.pub = pub;
    var bt = 'border:none;border-radius:8px;padding:9px 16px;cursor:pointer;font-size:13px;font-weight:700';
    var gris = bt + ';background:#0b1220;color:#e2e8f0;border:1px solid #2f405c';
    var cab = '<div style="display:flex;align-items:center;justify-content:space-between"><b style="font-size:16px">Publicar en TopLiderCoach</b>'
        + '<button type="button" onclick="ejComunidadCerrar()" title="Cerrar" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer"><i class="ej-ico ej-ico-nueva"></i></button></div>'
        + '<div style="font-size:13px;color:#94a3b8;margin-top:4px">Biblioteca de ejercicios de entrenadores. La ven todos los usuarios en la pestaña TopLiderCoach.</div>';
    var estado = '';
    if (pub) {
        var f = new Date(pub.updated_at);
        estado = pub.activo
            ? '<div style="font-size:13px;color:#4ade80;margin-top:8px"><i class="ej-ico ej-ico-ok"></i> Ya está publicado' + (isNaN(f) ? '' : ' (última vez el ' + f.toLocaleDateString('es-ES') + ')') + '. Puedes actualizarlo con la versión de ahora o retirarlo.</div>'
            : '<div style="font-size:13px;color:#fbbf24;margin-top:8px">Estuvo publicado y lo retiraste. Si lo publicas, vuelve a verse.</div>';
    }
    var sinDibujo = ejComunidadDibujoFalta(o), faltan = [];
    if (sinDibujo) faltan.push(sinDibujo);
    if (!String(o.name || '').trim()) faltan.push('Nombre del ejercicio');
    if (String(o.description || '').trim().length < 40) faltan.push('Descripción / desarrollo (al menos 40 letras)');
    if (faltan.length) {
        ejComunidadCaja(cab + estado + '<div style="font-size:13px;color:#cbd5e1;margin-top:10px">Antes de publicarlo, completa en la ficha y <b>guarda</b>:</div>'
            + '<ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:#fca5a5;line-height:1.7">' + faltan.map(function (x) { return '<li>' + ejTlcEsc(x) + '</li>'; }).join('') + '</ul>'
            + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;flex-wrap:wrap">'
            + (pub && pub.activo ? '<button type="button" onclick="ejTlcRetirar()" style="' + bt + ';background:#7f1d1d;color:#fecaca">Retirar de TopLiderCoach</button>' : '')
            + '<button type="button" onclick="ejComunidadCerrar()" style="' + gris + '">Entendido</button></div>', 540);
        return;
    }
    var campo = 'width:100%;box-sizing:border-box;background:#0b1220;border:1px solid #2f405c;border-radius:7px;color:#e2e8f0;padding:8px 10px;font-size:13px';
    var rot = 'display:block;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px';
    var lista = function (id, vals) { return '<datalist id="' + id + '">' + vals.map(function (v) { return '<option value="' + ejTlcEsc(v) + '">'; }).join('') + '</datalist>'; };
    var dif = parseInt(pub && pub.dificultad) || parseInt(o.difficulty) || 3;
    // Temas: los que ya existen en la biblioteca se eligen pulsando; el de la ficha del banco solo se propone si ya existe
    var temasIni = [];
    if (pub && pub.tema) temasIni = String(pub.tema).split(',').map(ejTlcLimpio).filter(Boolean);
    else { var canon = ejTlcCanon(o.tema, op.temas); if (canon && op.temas.indexOf(canon) !== -1) temasIni = [canon]; }
    var temasLista = op.temas.slice();
    temasIni.forEach(function (t) { if (temasLista.indexOf(t) === -1) temasLista.push(t); });
    var chipsTema = temasLista.map(function (t) {
        return '<button type="button" class="ej-tlc-chip' + (temasIni.indexOf(t) !== -1 ? ' on' : '') + '" data-t="' + ejTlcEsc(t) + '" onclick="ejTlcTemaAlternar(this)">' + ejTlcEsc(t) + '</button>';
    }).join('');
    var espacio = (parseFloat(o.field_width) > 0 && parseFloat(o.field_length) > 0) ? (o.field_width + ' x ' + o.field_length + ' m') : '';
    var resumen = [o.duration_min ? o.duration_min + ' min' : 'sin duración', o.players_count ? o.players_count + ' jugadores' : 'sin nº de jugadores', espacio || 'sin espacio'].join(' · ');
    var vista = null;
    try { vista = ejMiniaturaDeDatos(ejComunidadAnonimizar(o.board_data), true) || o.thumbnail_svg; } catch (e) { vista = o.thumbnail_svg || null; }
    ejComunidadCaja(cab + estado
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 12px;margin-top:14px">'
        + '<div><label style="' + rot + '">Entrenador *</label><input id="ej-tlc-entrenador" list="ej-tlc-l-ent" maxlength="80" placeholder="Ej: Guardiola" style="' + campo + '" value="' + ejTlcEsc(ejTlcLimpio(o.entrenador)) + '">' + lista('ej-tlc-l-ent', op.entrenadores) + '</div>'
        + '<div><label style="' + rot + '">Equipo</label><input id="ej-tlc-equipo" list="ej-tlc-l-eq" maxlength="80" placeholder="Ej: Manchester City" style="' + campo + '" value="' + ejTlcEsc(ejTlcLimpio(o.equipo)) + '">' + lista('ej-tlc-l-eq', op.equipos) + '</div>'
        + '<div style="grid-column:1 / -1"><label style="' + rot + '">Tema <span style="text-transform:none;letter-spacing:0;font-weight:400">(pulsa uno o varios)</span></label>'
        + '<style>.ej-tlc-chip{background:#0b1220;border:1px solid #2f405c;color:#cbd5e1;border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer}.ej-tlc-chip.on{background:#f59e0b;border-color:#f59e0b;color:#1a1200;font-weight:700}</style>'
        + '<div id="ej-tlc-temas" style="display:flex;flex-wrap:wrap;gap:5px;max-height:104px;overflow:auto;background:#0b1220;border:1px solid #2f405c;border-radius:7px;padding:7px">' + (chipsTema || '<span style="font-size:12px;color:#64748b">Todavía no hay temas: escribe el primero abajo.</span>') + '</div>'
        + '<div style="display:flex;gap:6px;margin-top:6px"><input id="ej-tlc-tema-nuevo" maxlength="60" placeholder="¿Tema nuevo? Escríbelo y pulsa Añadir" style="' + campo + '" onkeydown="if(event.key===\'Enter\'){event.preventDefault();ejTlcTemaNuevo();}">'
        + '<button type="button" onclick="ejTlcTemaNuevo()" style="' + gris + ';white-space:nowrap">Añadir</button></div></div>'
        + '<div><label style="' + rot + '">Dificultad</label><select id="ej-tlc-dificultad" style="' + campo + '">' + [1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (n === dif ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></div>'
        + '</div>'
        + '<div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;margin-top:14px">Así se verá</div>'
        + '<div style="display:flex;gap:12px;margin-top:4px;align-items:flex-start">'
        + '<div style="flex:0 0 230px;aspect-ratio:8/5;border-radius:8px;overflow:hidden;background:#0f4c2a"><img id="ej-tlc-vista" alt="" style="width:100%;height:100%;object-fit:contain;display:block"></div>'
        + '<div style="flex:1;min-width:0;font-size:13px;color:#cbd5e1;line-height:1.5"><b style="color:#fff">' + ejTlcEsc(o.name) + '</b><br>' + ejTlcEsc(resumen)
        + '<div style="color:#94a3b8;font-size:12px;margin-top:6px">Se copian el dibujo, el objetivo, la descripción, las variantes y el material de la ficha. Las fichas van sin nombres ni fotos.</div></div></div>'
        + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;flex-wrap:wrap">'
        + (pub && pub.activo ? '<button type="button" onclick="ejTlcRetirar()" style="' + bt + ';background:#7f1d1d;color:#fecaca;margin-right:auto">Retirar</button>' : '')
        + '<button type="button" onclick="ejComunidadCerrar()" style="' + gris + '">Cancelar</button>'
        + '<button type="button" id="ej-tlc-publicar" onclick="ejTlcPublicar()" style="' + bt + ';background:#f59e0b;color:#1a1200">' + (pub && pub.activo ? 'Actualizar' : 'Publicar') + '</button></div>', 600);
    var iv = document.getElementById('ej-tlc-vista');
    if (iv && vista) iv.src = vista.indexOf('data:') === 0 ? vista : URL.createObjectURL(new Blob([vista], { type: 'image/svg+xml' }));
    var ie = document.getElementById('ej-tlc-entrenador'); if (ie && !ie.value) ie.focus();
}

async function ejTlcPublicar() {
    if (!ejComunidadEsAdmin() || !ejEditandoId) return;
    var op = ejTlc.opciones || { entrenadores: [], equipos: [], temas: [] };
    var ent = ejTlcCanon((document.getElementById('ej-tlc-entrenador') || {}).value, op.entrenadores);
    var eq = ejTlcCanon((document.getElementById('ej-tlc-equipo') || {}).value, op.equipos);
    var pendiente = ejTlcLimpio((document.getElementById('ej-tlc-tema-nuevo') || {}).value);
    if (pendiente) ejTlcTemaNuevo();      // un tema escrito y sin añadir tambien cuenta
    var marcados = document.querySelectorAll('#ej-tlc-temas .ej-tlc-chip.on'), temas = [];
    for (var i = 0; i < marcados.length; i++) temas.push(marcados[i].getAttribute('data-t'));
    var tema = temas.join(', ');
    var dif = parseInt((document.getElementById('ej-tlc-dificultad') || {}).value) || null;
    if (!ent) { ejToast('Escribe el entrenador del ejercicio.', 'warning'); var ie = document.getElementById('ej-tlc-entrenador'); if (ie) ie.focus(); return; }
    var boton = document.getElementById('ej-tlc-publicar'), rotulo = boton ? boton.textContent : '';
    if (boton) { if (boton.disabled) return; boton.disabled = true; boton.textContent = 'Publicando...'; }
    try {
        var r = await supabaseClient.from('custom_exercises').select('*').eq('id', ejEditandoId).single();
        if (r.error) throw r.error;
        var o = r.data, sinDibujo = ejComunidadDibujoFalta(o);
        if (sinDibujo) throw new Error('falta ' + sinDibujo);
        var bd = ejComunidadAnonimizar(o.board_data);
        var ahora = new Date().toISOString();
        var org = String(o.description || '').trim();
        if (String(o.variants || '').trim()) org += '\n\nVariantes: ' + String(o.variants).trim();
        var fila = {
            titulo: String(o.name || '').trim(), entrenador: ent, equipo: eq || null, tema: tema || null, dificultad: dif,
            jugadores: parseInt(o.players_count) || null, duracion: parseInt(o.duration_min) || null,
            espacio: (parseFloat(o.field_width) > 0 && parseFloat(o.field_length) > 0) ? (o.field_width + ' x ' + o.field_length + ' m') : null,
            material: o.materials || null, objetivo: o.objectives || null, organizacion: org || null,
            board_data: bd, imagen: await ejComunidadMiniatura(bd, o),
            origen_id: o.id, activo: true, updated_at: ahora,
            publicado_por: String((typeof usuario !== 'undefined' && usuario && usuario.id != null) ? usuario.id : (window.ejCoachId || ''))
        };
        // el entrenador y el equipo se quedan tambien en el ejercicio del banco
        var g = await supabaseClient.from('custom_exercises').update({ entrenador: ent, equipo: eq || null }).eq('id', o.id);
        if (g.error) throw g.error;
        var pub = ejTlc.pub;
        var w = pub ? await supabaseClient.from('tlc_ejercicios').update(fila).eq('id', pub.id)
                    : await supabaseClient.from('tlc_ejercicios').insert(fila);
        if (w.error) throw w.error;
        ejTlc.opciones = null;
        ejComunidadCerrar();
        ejToast(pub && pub.activo ? 'Ejercicio de TopLiderCoach actualizado.' : 'Publicado en TopLiderCoach.', 'success');
    } catch (e) {
        console.error('ejTlcPublicar:', e);
        if (boton) { boton.disabled = false; boton.textContent = rotulo; }
        ejToast('No se ha podido publicar: ' + (e.message || e), 'error');
    }
}

// Retirar no borra: lo deja oculto, para que las sesiones que ya lo usan no pierdan la referencia
function ejTlcRetirar() {
    var pub = ejTlc.pub;
    if (!pub || !ejComunidadEsAdmin()) return;
    ejConfirm('¿Retirar este ejercicio de la biblioteca TopLiderCoach? Dejará de verse; puedes volver a publicarlo cuando quieras.', async function () {
        try {
            var w = await supabaseClient.from('tlc_ejercicios').update({ activo: false, updated_at: new Date().toISOString() }).eq('id', pub.id);
            if (w.error) throw w.error;
            ejComunidadCerrar();
            ejToast('Retirado de TopLiderCoach.', 'success');
        } catch (e) { ejToast('No se ha podido retirar: ' + (e.message || e), 'error'); }
    });
}

// El boton se muestra a la vez que el de la Comunidad (al abrir la pestaña Ficha)
(function () {
    if (typeof ejComunidadBoton !== 'function' || window.__ejTlcEnganchado) return;
    window.__ejTlcEnganchado = true;
    var original = ejComunidadBoton;
    ejComunidadBoton = function () { original.apply(this, arguments); try { ejTlcBoton(); } catch (e) {} };
})();

console.log('[EjTlc] ej-tlc.js v2 cargado');
