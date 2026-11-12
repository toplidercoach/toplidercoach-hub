// ========== EQUIPOS-EJERCICIO.JS - TopLiderCoach HUB ==========
// Montador de equipos por ejercicio dentro de la sesion (series, comodines, reparto automatico)
// Los equipos se guardan DENTRO del objeto del ejercicio en sesion[seccion][idx].equipos
// Estructura: { series: [ { nombre, equipos: [ {nombre, jugadores:[spIds]} ], comodines: [spIds] } ] }

let eqSeccionActual = null;
let eqIdxActual = null;
let eqDatos = null;          // copia de trabajo de ej.equipos
let eqSerieActiva = 0;
let eqEquipoActivo = null;   // indice del equipo activo (-1 = comodines)

(function() {
    if (document.getElementById('eq-styles')) return;
    const st = document.createElement('style');
    st.id = 'eq-styles';
    st.textContent = `
        .eq-ov { position:fixed; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; z-index:1400; padding:16px; }
        .eq-modal { background:#fff; border-radius:14px; max-width:820px; width:100%; max-height:90vh; overflow-y:auto; }
        .eq-cab { padding:14px 18px; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; background:#fff; z-index:5; border-radius:14px 14px 0 0; }
        .eq-titulo { font-size:16px; font-weight:700; color:#1f2937; }
        .eq-cerrar { background:none; border:none; font-size:22px; color:#9ca3af; cursor:pointer; }
        .eq-body { padding:16px 18px; }
        .eq-series { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin-bottom:14px; }
        .eq-serie-tab { background:#f3f4f6; border:1px solid #d1d5db; color:#374151; border-radius:8px; padding:6px 14px; font-size:13px; cursor:pointer; }
        .eq-serie-tab.activa { background:#7c3aed; color:#fff; border-color:#7c3aed; }
        .eq-serie-add { background:#ede9fe; border:1px dashed #7c3aed; color:#7c3aed; border-radius:8px; padding:6px 12px; font-size:12px; cursor:pointer; }
        .eq-serie-del { background:none; border:none; color:#dc2626; font-size:13px; cursor:pointer; }
        .eq-config { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:14px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; }
        .eq-config label { font-size:13px; color:#374151; }
        .eq-config input { width:60px; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; font-size:14px; text-align:center; }
        .eq-btn { background:#7c3aed; color:#fff; border:none; border-radius:8px; padding:7px 13px; font-size:13px; cursor:pointer; font-weight:600; }
        .eq-btn-sec { background:#fff; border:1px solid #d1d5db; color:#374151; border-radius:8px; padding:7px 13px; font-size:13px; cursor:pointer; }
        .eq-pool-tit { font-size:13px; font-weight:700; color:#374151; margin-bottom:6px; }
        .eq-pool { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:10px; min-height:48px; }
        .eq-chip { background:#fff; border:1px solid #d1d5db; border-radius:20px; padding:4px 12px 4px 5px; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px; user-select:none; }
        .eq-chip:hover { border-color:#7c3aed; }
        .eq-chip.muteado { opacity:0.32; cursor:not-allowed; }
        .eq-chip .dorsal { background:#26215C; color:#fff; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; }
        .eq-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px; }
        .eq-equipo { background:#fff; border:2px solid #e5e7eb; border-radius:12px; overflow:hidden; }
        .eq-equipo.activo { border-color:#7c3aed; box-shadow:0 0 0 2px rgba(124,58,237,0.15); }
        .eq-equipo-cab { padding:8px 12px; font-size:13px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between; align-items:center; }
        .eq-equipo-cab .pista { font-size:10px; font-weight:400; color:#9ca3af; }
        .eq-equipo-body { padding:8px 10px; min-height:60px; display:flex; flex-direction:column; gap:5px; }
        .eq-jug { background:#f3f4f6; border-radius:7px; padding:4px 9px; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:6px; }
        .eq-jug:hover { background:#fee2e2; }
        .eq-jug .dorsal { background:#26215C; color:#fff; border-radius:50%; width:19px; height:19px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; }
        .eq-vacio-eq { font-size:11px; color:#c4c8cf; text-align:center; padding:8px 0; }
        .eq-pie { display:flex; justify-content:flex-end; gap:8px; padding:14px 18px; border-top:1px solid #e5e7eb; position:sticky; bottom:0; background:#fff; border-radius:0 0 14px 14px; }
        .eq-badge-btn { background:#ede9fe; border:1px solid #c4b5fd; color:#7c3aed; border-radius:6px; padding:2px 8px; font-size:11px; cursor:pointer; font-weight:600; }
    `;
    document.head.appendChild(st);
})();

// Colores de cabecera por equipo (rotan)
const EQ_COLORES = [
    { bg: '#EEF6FF', txt: '#185FA5' },
    { bg: '#FCEBEB', txt: '#A32D2D' },
    { bg: '#E1F5EE', txt: '#0F6E56' },
    { bg: '#FAEEDA', txt: '#854F0B' },
    { bg: '#F3E8FF', txt: '#7c3aed' },
    { bg: '#FDF2F8', txt: '#9d174d' }
];
const EQ_COLOR_COMODIN = { bg: '#f3f4f6', txt: '#374151' };
// Colores de peto que puede elegir el entrenador (clave guardada en equipo.peto)
const EQ_PETOS = {
    amarillo: { nombre: 'Amarillo', hex: '#facc15', rgb: [250, 204, 21] },
    naranja:  { nombre: 'Naranja',  hex: '#f97316', rgb: [249, 115, 22] },
    rojo:     { nombre: 'Rojo',     hex: '#dc2626', rgb: [220, 38, 38] },
    azul:     { nombre: 'Azul',     hex: '#2563eb', rgb: [37, 99, 235] },
    verde:    { nombre: 'Verde',    hex: '#16a34a', rgb: [22, 163, 74] },
    blanco:   { nombre: 'Blanco',   hex: '#ffffff', rgb: [255, 255, 255] },
    negro:    { nombre: 'Negro',    hex: '#111827', rgb: [17, 24, 39] },
    morado:   { nombre: 'Morado',   hex: '#7c3aed', rgb: [124, 58, 237] },
    rosa:     { nombre: 'Rosa',     hex: '#ec4899', rgb: [236, 72, 153] },
    celeste:  { nombre: 'Celeste',  hex: '#38bdf8', rgb: [56, 189, 248] }
};
function eqPetoOpciones(sel) {
    let h = '<option value="">Sin peto</option>';
    Object.keys(EQ_PETOS).forEach(k => { h += '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + EQ_PETOS[k].nombre + '</option>'; });
    return h;
}
function eqPetoPunto(k) {
    const p = k && EQ_PETOS[k];
    if (!p) return '';
    return '<span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:' + p.hex + ';border:1px solid #9ca3af;margin-right:5px;vertical-align:-1px"></span>';
}
function eqSetPeto(i, v) {
    const s = eqSerie();
    if (!s.equipos[i]) return;
    if (v) s.equipos[i].peto = v; else delete s.equipos[i].peto;
    eqRender();
}

function eqSerieNueva(numEquipos) {
    const equipos = [];
    for (let i = 0; i < numEquipos; i++) {
        equipos.push({ nombre: 'Equipo ' + (i + 1), jugadores: [] });
    }
    return { nombre: '', equipos: equipos, comodines: [] };
}

// Abre el montador para el ejercicio sesion[seccion][idx]
function eqAbrirModal(seccion, idx) {
    const ej = sesion[seccion] && sesion[seccion][idx];
    if (!ej) return;

    if (!jugadoresSeleccionados || jugadoresSeleccionados.length === 0) {
        showToast('Primero selecciona los jugadores aptos de la sesión');
        return;
    }

    eqSeccionActual = seccion;
    eqIdxActual = idx;
    // Copia de trabajo (para poder cancelar sin tocar nada)
    eqDatos = ej.equipos ? JSON.parse(JSON.stringify(ej.equipos)) : { series: [eqSerieNueva(2)] };
    if (!eqDatos.series || eqDatos.series.length === 0) eqDatos.series = [eqSerieNueva(2)];
    eqSerieActiva = 0;
    eqEquipoActivo = 0;

    const ov = document.createElement('div');
    ov.className = 'eq-ov';
    ov.id = 'eq-ov';
    ov.innerHTML = `
        <div class="eq-modal">
            <div class="eq-cab">
                <div>
                    <div class="eq-titulo">👥 Equipos · ${eqEscapar(ej.titulo || 'Ejercicio')}</div>
                    <div style="font-size:12px;color:#6b7280;">Pulsa un equipo para activarlo y ve pulsando jugadores para asignarlos</div>
                </div>
                <button class="eq-cerrar" onclick="eqCancelar()">&times;</button>
            </div>
            <div class="eq-body" id="eq-body"></div>
            <div class="eq-pie">
                <button class="eq-btn-sec" onclick="eqCancelar()">Cancelar</button>
                <button class="eq-btn" onclick="eqGuardar()">💾 Guardar equipos</button>
            </div>
        </div>
    `;
    document.body.appendChild(ov);
    eqRender();
}

function eqEscapar(t) {
    const d = document.createElement('div');
    d.textContent = t || '';
    return d.innerHTML;
}

function eqJugadorInfo(spId) {
    const sp = (jugadoresPlantilla || []).find(x => String(x.id) === String(spId));
    if (!sp) return { dorsal: '?', nombre: 'Jugador' };
    return { dorsal: sp.shirt_number || '?', nombre: (sp.players && sp.players.name) ? sp.players.name : 'Jugador' };
}

function eqSerie() {
    return eqDatos.series[eqSerieActiva];
}

function eqAsignadosEnSerie() {
    const s = eqSerie();
    const ids = [];
    s.equipos.forEach(e => e.jugadores.forEach(j => ids.push(String(j))));
    s.comodines.forEach(j => ids.push(String(j)));
    return ids;
}

function eqRender() {
    const body = document.getElementById('eq-body');
    if (!body) return;
    const s = eqSerie();
    const asignados = eqAsignadosEnSerie();

    // Pestañas de series
    let seriesHtml = '';
    eqDatos.series.forEach((serie, i) => {
        seriesHtml += `<button class="eq-serie-tab ${i === eqSerieActiva ? 'activa' : ''}" onclick="eqCambiarSerie(${i})">Serie ${i + 1}</button>`;
    });
    seriesHtml += `<button class="eq-serie-add" onclick="eqAddSerie(false)">➕ Nueva serie</button>`;
    seriesHtml += `<button class="eq-serie-add" onclick="eqAddSerie(true)" title="Crea una serie copiando los equipos de la actual">📋 Duplicar serie</button>`;
    if (eqDatos.series.length > 1) {
        seriesHtml += `<button class="eq-serie-del" onclick="eqBorrarSerie()" title="Borrar esta serie">🗑️ Borrar serie</button>`;
    }

    // Pool de jugadores aptos
    let poolHtml = '';
    (jugadoresSeleccionados || []).forEach(spId => {
        const info = eqJugadorInfo(spId);
        const muteado = asignados.includes(String(spId));
        poolHtml += `
            <div class="eq-chip ${muteado ? 'muteado' : ''}" ${muteado ? '' : `onclick="eqAsignar('${spId}')"`}>
                <span class="dorsal">${info.dorsal}</span>${eqEscapar(info.nombre)}
            </div>
        `;
    });

    // Columnas de equipos
    let equiposHtml = '';
    s.equipos.forEach((e, i) => {
        const color = EQ_COLORES[i % EQ_COLORES.length];
        const activo = eqEquipoActivo === i;
        let jugsHtml = '';
        e.jugadores.forEach(spId => {
            const info = eqJugadorInfo(spId);
            jugsHtml += `<div class="eq-jug" onclick="eqQuitar('${spId}')" title="Pulsar para quitar"><span class="dorsal">${info.dorsal}</span>${eqEscapar(info.nombre)}</div>`;
        });
        if (e.jugadores.length === 0) jugsHtml = '<div class="eq-vacio-eq">Sin jugadores</div>';
        equiposHtml += `
            <div class="eq-equipo ${activo ? 'activo' : ''}">
                <div class="eq-equipo-cab" style="background:${color.bg};color:${color.txt};" onclick="eqActivarEquipo(${i})">
                    <span>${eqPetoPunto(e.peto)}${eqEscapar(e.nombre)} (${e.jugadores.length})</span><select onclick="event.stopPropagation()" onchange="eqSetPeto(${i}, this.value)" title="Color del peto" style="font-size:11px;padding:2px 4px;border:1px solid #d1d5db;border-radius:6px;background:#fff;color:#374151;cursor:pointer;">${eqPetoOpciones(e.peto)}</select>
                    ${activo ? '<span class="pista">← asignando aquí</span>' : ''}
                </div>
                <div class="eq-equipo-body">${jugsHtml}</div>
            </div>
        `;
    });

    // Columna de comodines
    const comodinActivo = eqEquipoActivo === -1;
    let comodinesHtml = '';
    s.comodines.forEach(spId => {
        const info = eqJugadorInfo(spId);
        comodinesHtml += `<div class="eq-jug" onclick="eqQuitar('${spId}')" title="Pulsar para quitar"><span class="dorsal">${info.dorsal}</span>${eqEscapar(info.nombre)}</div>`;
    });
    if (s.comodines.length === 0) comodinesHtml = '<div class="eq-vacio-eq">Sin comodines</div>';
    equiposHtml += `
        <div class="eq-equipo ${comodinActivo ? 'activo' : ''}">
            <div class="eq-equipo-cab" style="background:${EQ_COLOR_COMODIN.bg};color:${EQ_COLOR_COMODIN.txt};" onclick="eqActivarEquipo(-1)">
                <span>🃏 Comodines (${s.comodines.length})</span>
                ${comodinActivo ? '<span class="pista">← asignando aquí</span>' : ''}
            </div>
            <div class="eq-equipo-body">${comodinesHtml}</div>
        </div>
    `;

    const sinAsignar = (jugadoresSeleccionados || []).filter(id => !asignados.includes(String(id))).length;

    body.innerHTML = `
        <div class="eq-series">${seriesHtml}</div>
        <div class="eq-config">
            <label>Nº de equipos:</label>
            <input type="number" id="eq-num" min="1" max="6" value="${s.equipos.length}">
            <button class="eq-btn-sec" onclick="eqCambiarNumEquipos()">Aplicar</button>
            <button class="eq-btn" onclick="eqRepartoAuto()">🎲 Reparto automático (${sinAsignar} sin asignar)</button>
            <button class="eq-btn-sec" onclick="eqVaciarSerie()">Vaciar serie</button>
        </div>
        <div class="eq-pool-tit">Jugadores aptos (pulsa para asignar al equipo activo):</div>
        <div class="eq-pool">${poolHtml}</div>
        <div class="eq-grid">${equiposHtml}</div>
    `;
}

function eqCambiarSerie(i) {
    eqSerieActiva = i;
    eqEquipoActivo = 0;
    eqRender();
}

function eqAddSerie(duplicar) {
    const actual = eqSerie();
    if (duplicar) {
        eqDatos.series.push(JSON.parse(JSON.stringify(actual)));
    } else {
        eqDatos.series.push(eqSerieNueva(actual.equipos.length));
    }
    eqSerieActiva = eqDatos.series.length - 1;
    eqEquipoActivo = 0;
    eqRender();
}

function eqBorrarSerie() {
    if (eqDatos.series.length <= 1) return;
    if (!confirm('¿Borrar la Serie ' + (eqSerieActiva + 1) + '?')) return;
    eqDatos.series.splice(eqSerieActiva, 1);
    eqSerieActiva = Math.max(0, eqSerieActiva - 1);
    eqEquipoActivo = 0;
    eqRender();
}

function eqActivarEquipo(i) {
    eqEquipoActivo = i;
    eqRender();
}

function eqAsignar(spId) {
    const s = eqSerie();
    if (eqEquipoActivo === -1) {
        s.comodines.push(spId);
    } else if (s.equipos[eqEquipoActivo]) {
        s.equipos[eqEquipoActivo].jugadores.push(spId);
    }
    eqRender();
}

function eqQuitar(spId) {
    const s = eqSerie();
    s.equipos.forEach(e => {
        e.jugadores = e.jugadores.filter(j => String(j) !== String(spId));
    });
    s.comodines = s.comodines.filter(j => String(j) !== String(spId));
    eqRender();
}

function eqCambiarNumEquipos() {
    const n = parseInt(document.getElementById('eq-num').value);
    if (isNaN(n) || n < 1 || n > 6) { showToast('Entre 1 y 6 equipos'); return; }
    const s = eqSerie();
    if (n < s.equipos.length) {
        // Los jugadores de los equipos que desaparecen vuelven al pool
        s.equipos = s.equipos.slice(0, n);
    } else {
        while (s.equipos.length < n) {
            s.equipos.push({ nombre: 'Equipo ' + (s.equipos.length + 1), jugadores: [] });
        }
    }
    eqRender();
}

function eqRepartoAuto() {
    const s = eqSerie();
    const asignados = eqAsignadosEnSerie();
    const libres = (jugadoresSeleccionados || []).filter(id => !asignados.includes(String(id)));
    // Mezclar aleatoriamente
    for (let i = libres.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [libres[i], libres[j]] = [libres[j], libres[i]];
    }
    // Repartir en ronda empezando por el equipo con menos jugadores
    libres.forEach(spId => {
        let menor = 0;
        s.equipos.forEach((e, i) => {
            if (e.jugadores.length < s.equipos[menor].jugadores.length) menor = i;
        });
        s.equipos[menor].jugadores.push(spId);
    });
    eqRender();
}

function eqVaciarSerie() {
    if (!confirm('¿Vaciar todos los equipos de esta serie?')) return;
    const s = eqSerie();
    s.equipos.forEach(e => { e.jugadores = []; });
    s.comodines = [];
    eqRender();
}

function eqGuardar() {
    const ej = sesion[eqSeccionActual] && sesion[eqSeccionActual][eqIdxActual];
    if (ej) {
        ej.equipos = eqDatos;
        showToast('Equipos guardados en el ejercicio. Recuerda guardar la sesión.');
    }
    eqCerrar();
    if (typeof renderizarSesion === 'function') renderizarSesion();
}

function eqCancelar() {
    eqCerrar();
}

function eqCerrar() {
    const ov = document.getElementById('eq-ov');
    if (ov) ov.remove();
    eqDatos = null;
}

// ========== CAPA 2: DIBUJAR LOS EQUIPOS EN EL PDF DE LA SESION ==========
// Llamado desde exportarSesionPDF. Devuelve la nueva posicion Y.
// Una linea por equipo: punto del color del peto + nombre + jugadores separados por comas.

function eqDibujarEquiposPDF(doc, ej, jugadoresSesion, y, espacioAmplio) {
    if (!ej.equipos || !ej.equipos.series || ej.equipos.series.length === 0) return y;

    function nombreDe(spId) {
        const j = (jugadoresSesion || []).find(x => String(x.id) === String(spId));
        if (!j) return '?';
        return (j.shirt_number ? j.shirt_number + '. ' : '') + (j.name || 'Jugador');
    }

    const coloresEq = [[24, 95, 165], [163, 45, 45], [15, 110, 86], [133, 79, 11], [124, 58, 237], [157, 23, 77]];
    const margen = 10, anchoTotal = 190, xTexto = margen + 5;
    const fuente = espacioAmplio ? 8 : 7.5;
    const altoLinea = espacioAmplio ? 4.2 : 3.8;
    const factorLinea = altoLinea / (fuente * 0.3528);

    ej.equipos.series.forEach((serie, si) => {
        const filas = serie.equipos.map((e, i) => {
            const peto = (e.peto && EQ_PETOS[e.peto]) ? EQ_PETOS[e.peto] : null;
            return {
                titulo: e.nombre + (peto ? ' (' + peto.nombre.toLowerCase() + ')' : ''),
                jugadores: e.jugadores,
                color: peto ? peto.rgb : coloresEq[i % coloresEq.length],
                borde: e.peto === 'blanco'
            };
        });
        if (serie.comodines && serie.comodines.length > 0) {
            filas.push({ titulo: 'Comodines', jugadores: serie.comodines, color: [107, 114, 128], borde: false });
        }
        if (filas.every(f => f.jugadores.length === 0)) return; // serie vacia

        // Preparar las lineas de cada equipo
        doc.setFontSize(fuente);
        const bloques = filas.filter(f => f.jugadores.length > 0).map(f => {
            doc.setFont('helvetica', 'bold');
            const tit = f.titulo + ':';
            const wTit = doc.getTextWidth(tit) + 2;
            doc.setFont('helvetica', 'normal');
            const lineas = doc.splitTextToSize(f.jugadores.map(nombreDe).join(', '), anchoTotal - 5 - wTit);
            return { f: f, tit: tit, wTit: wTit, lineas: lineas };
        });
        const altoSerie = 5 + bloques.reduce((a, b) => a + b.lineas.length * altoLinea, 0) + 2;
        if (y + altoSerie > 280) { doc.addPage(); y = 20; }

        // Etiqueta de la serie
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text(ej.equipos.series.length > 1 ? ('EQUIPOS - SERIE ' + (si + 1)) : 'EQUIPOS', margen, y + 3);
        y += 5;

        doc.setFontSize(fuente);
        bloques.forEach(b => {
            doc.setFillColor(b.f.color[0], b.f.color[1], b.f.color[2]);
            doc.setDrawColor(150, 150, 150);
            doc.circle(margen + 2, y + 1.7, 1.4, b.f.borde ? 'FD' : 'F');
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(b.tit, xTexto, y + 2.6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            doc.text(b.lineas, xTexto + b.wTit, y + 2.6, { lineHeightFactor: factorLinea });
            y += b.lineas.length * altoLinea;
        });
        y += 2;
    });

    return y;
}