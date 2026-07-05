// ========== MODELO-JUEGO.JS - TopLiderCoach HUB ==========
// Capa 1: Arbol del modelo de juego (Momentos -> Principios -> Subprincipios -> Sub-subprincipios)

const MJ_MOMENTOS = [
    { key: 'ataque',       nombre: 'Ataque organizado',     icono: '⚔️', color: '#0F6E56', bg: '#E1F5EE' },
    { key: 'defensa',      nombre: 'Defensa organizada',    icono: '🛡️', color: '#A32D2D', bg: '#FCEBEB' },
    { key: 'trans_of_def', nombre: 'Transición of-def',     icono: '🔻', color: '#854F0B', bg: '#FAEEDA' },
    { key: 'trans_def_of', nombre: 'Transición def-of',     icono: '🔺', color: '#185FA5', bg: '#E6F1FB' }
];

const MJ_NIVELES = {
    principio: { label: 'Principio', siguiente: 'subprincipio' },
    subprincipio: { label: 'Subprincipio', siguiente: 'subsubprincipio' },
    subsubprincipio: { label: 'Sub-subprincipio', siguiente: null }
};

const MJ_SISTEMAS_CATALOGO = ['1-4-3-3','1-4-2-3-1','1-4-4-2','1-4-4-1-1','1-4-1-4-1','1-4-5-1','1-4-3-1-2','1-4-2-2-2','1-4-3-2-1','1-4-2-4','1-3-5-2','1-3-4-3','1-3-4-2-1','1-3-4-1-2','1-3-2-4-1','1-3-1-4-2','1-5-3-2','1-5-4-1'];

let mjClubId = null;
let mjConceptos = [];
let mjSistemasClub = [];
let mjSistemaFiltro = null; // null = todos los sistemas

(function() {
    if (document.getElementById('mj-styles')) return;
    const st = document.createElement('style');
    st.id = 'mj-styles';
    st.textContent = `
        .mj-cab { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:8px; }
        .mj-cab h2 { font-size:20px; color:#1f2937; margin:0; }
        .mj-vista-btn { background:#f3f4f6; border:1px solid #d1d5db; color:#374151; border-radius:8px; padding:8px 14px; font-size:13px; cursor:pointer; margin-left:6px; }
        .mj-vista-btn.activa { background:#7c3aed; color:#fff; border-color:#7c3aed; }
        .mj-info { font-size:13px; color:#6b7280; margin-bottom:16px; }
        .mj-momento { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; margin-bottom:12px; }
        .mj-momento-cab { padding:12px 16px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; }
        .mj-momento-cab .titulo { font-weight:600; font-size:15px; }
        .mj-momento-cab .cuenta { font-size:12px; opacity:0.8; }
        .mj-momento-body { padding:8px 16px 14px; }
        .mj-principio { border-left:3px solid #cbd5e1; padding-left:12px; margin-bottom:14px; }
        .mj-fila { display:flex; justify-content:space-between; align-items:center; padding:5px 0; gap:8px; }
        .mj-fila .nombre { font-size:14px; color:#1f2937; flex:1; }
        .mj-fila .nivel-tag { font-size:10px; color:#9ca3af; letter-spacing:0.04em; }
        .mj-fila .acc { display:flex; gap:4px; opacity:0; transition:opacity 0.15s; }
        .mj-fila:hover .acc { opacity:1; }
        .mj-fila .acc button { background:none; border:none; cursor:pointer; font-size:13px; padding:2px 5px; border-radius:5px; }
        .mj-fila .acc button:hover { background:#f3f4f6; }
        .mj-sub { margin-left:18px; }
        .mj-subsub { margin-left:18px; }
        .mj-subsub .nombre { font-size:13px; color:#4b5563; }
        .mj-add { font-size:13px; color:#7c3aed; cursor:pointer; padding:4px 0; display:inline-block; }
        .mj-add:hover { text-decoration:underline; }
        .mj-vacio-momento { font-size:13px; color:#9ca3af; padding:6px 0; }
        .mj-modal-ov { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1200; padding:20px; }
        .mj-modal { background:#fff; border-radius:14px; padding:22px; max-width:460px; width:100%; }
        .mj-modal h3 { margin:0 0 4px; font-size:17px; color:#1f2937; }
        .mj-modal .ctx { font-size:13px; color:#6b7280; margin-bottom:14px; }
        .mj-modal label { display:block; font-size:13px; color:#374151; margin:10px 0 4px; }
        .mj-modal input, .mj-modal textarea { width:100%; padding:9px 11px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; font-family:inherit; }
        .mj-modal textarea { min-height:60px; resize:vertical; }
        .mj-modal-btns { display:flex; gap:8px; justify-content:flex-end; margin-top:18px; }
        .mj-btn-cancel { background:#f3f4f6; border:1px solid #d1d5db; color:#374151; border-radius:8px; padding:9px 16px; font-size:14px; cursor:pointer; }
        .mj-btn-ok { background:#7c3aed; border:none; color:#fff; border-radius:8px; padding:9px 16px; font-size:14px; font-weight:600; cursor:pointer; }
        .mj-sist-bar { display:flex; gap:6px; align-items:center; flex-wrap:wrap; margin:-6px 0 14px; }
        .mj-sist-bar .lbl { font-size:12px; color:#6b7280; }
        .mj-sist-btn { background:#f3f4f6; border:1px solid #d1d5db; color:#374151; border-radius:8px; padding:5px 12px; font-size:12px; cursor:pointer; }
        .mj-sist-btn.activa { background:#26215C; color:#fff; border-color:#26215C; }
        .mj-sist-gear { background:#ede9fe; border:1px dashed #7c3aed; color:#7c3aed; border-radius:8px; padding:5px 10px; font-size:12px; cursor:pointer; }
        .mj-sist-tag { font-size:9px; background:#e0e7ff; color:#3730a3; border-radius:4px; padding:1px 5px; margin-left:4px; white-space:nowrap; font-weight:600; }
        .mj-sist-checks { display:flex; flex-wrap:wrap; gap:8px; margin-top:4px; }
        .mj-sist-checks label { display:flex; align-items:center; gap:4px; font-size:12px; margin:0; background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:4px 8px; cursor:pointer; white-space:nowrap; }
    `;
    document.head.appendChild(st);
})();

registrarSubTab('planificador', 'modelo-juego', function() {
    cargarModeloJuego();
});

async function cargarModeloJuego() {
    const cont = document.getElementById('modelo-juego-contenido');
    if (!cont) return;
    cont.innerHTML = '<div class="mj-vacio-momento">Cargando modelo de juego...</div>';

    try {
        const { data: clubInfo } = await supabaseClient
            .from('clubs').select('id, sistemas_juego').eq('wp_user_id', usuario.id).single();
        if (!clubInfo) throw new Error('Club no encontrado');
        mjClubId = clubInfo.id;
        mjSistemasClub = clubInfo.sistemas_juego || [];

        const { data, error } = await supabaseClient
            .from('modelo_conceptos')
            .select('*')
            .eq('club_id', mjClubId)
            .eq('archived', false)
            .order('orden');
        if (error) throw error;

        mjConceptos = data || [];
        mjRender();
    } catch (e) {
        console.error('Error cargando modelo de juego:', e);
        cont.innerHTML = '<div class="mj-vacio-momento">Error al cargar: ' + e.message + '</div>';
    }
}

function mjHijos(parentId, nivel) {
    return mjConceptos.filter(c => c.parent_id === parentId && c.nivel === nivel);
}

function mjPrincipios(momentoKey) {
    return mjConceptos.filter(c => c.momento === momentoKey && c.nivel === 'principio' && !c.parent_id);
}

function mjEscapar(t) {
    const d = document.createElement('div');
    d.textContent = t || '';
    return d.innerHTML;
}

function mjRender() {
    const cont = document.getElementById('modelo-juego-contenido');
    let html = `
        <div class="mj-cab">
            <h2>📋 Mi modelo de juego</h2>
            <div>
                <button class="mj-vista-btn activa" id="mj-btn-arbol" onclick="mjVistaArbol()">🌳 Árbol</button>
                <button class="mj-vista-btn" id="mj-btn-cuadro" onclick="mjVistaCuadro()">📊 Cuadro de control</button>
            </div>
        </div>
        <div class="mj-info">Define tus principios, subprincipios y sub-subprincipios organizados por los 4 momentos del juego.</div>
        <div class="mj-sist-bar">
            <span class="lbl">Sistema:</span>
            <button class="mj-sist-btn ${!mjSistemaFiltro ? 'activa' : ''}" onclick="mjFiltrarSistema(null)">Todos</button>
            ${mjSistemasClub.map(s => `<button class="mj-sist-btn ${mjSistemaFiltro === s ? 'activa' : ''}" onclick="mjFiltrarSistema('${s}')">${s}</button>`).join('')}
            <button class="mj-sist-gear" onclick="mjAbrirSistemas()" title="Elegir los sistemas del club">⚙️ Sistemas</button>
        </div>
    `;

    MJ_MOMENTOS.forEach(m => {
        const principios = mjPrincipios(m.key).filter(mjVisible);
        html += `
            <div class="mj-momento">
                <div class="mj-momento-cab" style="background:${m.bg};">
                    <span class="titulo" style="color:${m.color};">${m.icono} ${m.nombre}</span>
                    <span class="cuenta" style="color:${m.color};">${principios.length} principio${principios.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="mj-momento-body">
        `;

        if (principios.length === 0) {
            html += '<div class="mj-vacio-momento">Aún no hay principios en este momento.</div>';
        }

        principios.forEach(p => {
            html += `
                <div class="mj-principio">
                    <div class="mj-fila">
                        <span class="nombre" style="cursor:pointer;" onclick="mjAbrirFicha('${p.id}')" title="Ver ficha"><strong>${mjEscapar(p.nombre)}</strong>${mjTagsSistemas(p)}</span>
                        <span class="nivel-tag">PRINCIPIO</span>
                        <span class="acc">
                            <button onclick="mjAbrirModal('subprincipio','${p.id}','${m.key}')" title="Añadir subprincipio">➕</button>
                            <button onclick="mjEditar('${p.id}')" title="Editar">✏️</button>
                            <button onclick="mjBorrar('${p.id}')" title="Borrar">🗑️</button>
                        </span>
                    </div>
            `;
            const subs = mjHijos(p.id, 'subprincipio').filter(mjVisible);
            subs.forEach(s => {
                html += `
                    <div class="mj-sub">
                        <div class="mj-fila">
                            <span class="nombre" style="cursor:pointer;" onclick="mjAbrirFicha('${s.id}')" title="Ver ficha">— ${mjEscapar(s.nombre)}${mjTagsSistemas(s)}</span>
                            <span class="nivel-tag">SUBPRINCIPIO</span>
                            <span class="acc">
                                <button onclick="mjAbrirModal('subsubprincipio','${s.id}','${m.key}')" title="Añadir sub-subprincipio">➕</button>
                                <button onclick="mjEditar('${s.id}')" title="Editar">✏️</button>
                                <button onclick="mjBorrar('${s.id}')" title="Borrar">🗑️</button>
                            </span>
                        </div>
                `;
                const subsubs = mjHijos(s.id, 'subsubprincipio').filter(mjVisible);
                subsubs.forEach(ss => {
                    html += `
                        <div class="mj-subsub">
                            <div class="mj-fila">
                                <span class="nombre" style="cursor:pointer;" onclick="mjAbrirFicha('${ss.id}')" title="Ver ficha">· ${mjEscapar(ss.nombre)}${mjTagsSistemas(ss)}</span>
                                <span class="nivel-tag">SUB-SUB</span>
                                <span class="acc">
                                    <button onclick="mjEditar('${ss.id}')" title="Editar">✏️</button>
                                    <button onclick="mjBorrar('${ss.id}')" title="Borrar">🗑️</button>
                                </span>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            });
            html += '</div>';
        });

        html += `
                    <span class="mj-add" onclick="mjAbrirModal('principio',null,'${m.key}')">➕ Añadir principio</span>
                </div>
            </div>
        `;
    });

    cont.innerHTML = html;
}

// ---- Sistemas de juego: filtro y gestion ----

function mjCoincideSistema(c) {
    if (!mjSistemaFiltro) return true;
    if (!c.sistemas || c.sistemas.length === 0) return true; // sin etiquetas = general (vale para todos)
    return c.sistemas.indexOf(mjSistemaFiltro) > -1;
}

function mjVisible(c) {
    if (mjCoincideSistema(c)) return true;
    // Se muestra tambien si algun descendiente coincide con el filtro
    const hijos = mjConceptos.filter(x => x.parent_id === c.id);
    return hijos.some(mjVisible);
}

function mjTagsSistemas(c) {
    if (!c.sistemas || c.sistemas.length === 0) return '';
    return c.sistemas.map(s => `<span class="mj-sist-tag">${s}</span>`).join('');
}

function mjFiltrarSistema(s) {
    mjSistemaFiltro = s;
    mjRender();
}

function mjAbrirSistemas() {
    let checks = '';
    MJ_SISTEMAS_CATALOGO.forEach(s => {
        const on = mjSistemasClub.indexOf(s) > -1 ? 'checked' : '';
        checks += `<label><input type="checkbox" class="mj-sist-club-check" value="${s}" ${on}> ${s}</label>`;
    });
    const ov = document.createElement('div');
    ov.className = 'mj-modal-ov';
    ov.id = 'mj-modal-ov';
    ov.innerHTML = `
        <div class="mj-modal">
            <h3>⚙️ Sistemas de juego del club</h3>
            <div class="ctx">Marca los sistemas con los que trabajáis. Aparecerán como filtros del árbol y podrás etiquetar cada principio con sus sistemas.</div>
            <div class="mj-sist-checks">${checks}</div>
            <div class="mj-modal-btns">
                <button class="mj-btn-cancel" onclick="mjCerrarModal()">Cancelar</button>
                <button class="mj-btn-ok" onclick="mjGuardarSistemasClub()">Guardar</button>
            </div>
        </div>
    `;
    document.body.appendChild(ov);
}

async function mjGuardarSistemasClub() {
    const arr = [];
    document.querySelectorAll('.mj-sist-club-check:checked').forEach(ch => arr.push(ch.value));
    try {
        const { error } = await supabaseClient
            .from('clubs')
            .update({ sistemas_juego: arr })
            .eq('id', mjClubId);
        if (error) throw error;
        mjSistemasClub = arr;
        if (mjSistemaFiltro && arr.indexOf(mjSistemaFiltro) === -1) mjSistemaFiltro = null;
        mjCerrarModal();
        showToast('Sistemas guardados');
        mjRender();
    } catch (e) {
        console.error('Error guardando sistemas:', e);
        showToast('Error al guardar: ' + e.message);
    }
}

function mjAbrirModal(nivel, parentId, momentoKey, conceptoExistente) {
    const esEdicion = !!conceptoExistente;
    const nivelLabel = MJ_NIVELES[nivel] ? MJ_NIVELES[nivel].label : nivel;
    let ctx = '';
    if (parentId) {
        const padre = mjConceptos.find(c => c.id === parentId);
        if (padre) ctx = 'Dentro de: ' + padre.nombre;
    } else {
        const m = MJ_MOMENTOS.find(x => x.key === momentoKey);
        if (m) ctx = m.nombre;
    }

    const nombreVal = esEdicion ? mjEscapar(conceptoExistente.nombre) : '';
    const descVal = esEdicion ? mjEscapar(conceptoExistente.descripcion || '') : '';

    const ov = document.createElement('div');
    ov.className = 'mj-modal-ov';
    ov.id = 'mj-modal-ov';
    ov.innerHTML = `
        <div class="mj-modal">
            <h3>${esEdicion ? 'Editar' : 'Nuevo'} ${nivelLabel.toLowerCase()}</h3>
            <div class="ctx">${ctx}</div>
            <label>Nombre</label>
            <input type="text" id="mj-input-nombre" placeholder="Ej: Salida de balón" value="${nombreVal}">
            <label>Descripción (opcional)</label>
            <textarea id="mj-input-desc" placeholder="Notas sobre este concepto...">${descVal}</textarea>
            ${mjSistemasClub.length > 0 ? `
            <label>Sistemas donde se trabaja (vacío = en todos)</label>
            <div class="mj-sist-checks">
                ${mjSistemasClub.map(s => {
                    const marcado = esEdicion
                        ? ((conceptoExistente.sistemas || []).indexOf(s) > -1)
                        : (mjSistemaFiltro === s);
                    return `<label><input type="checkbox" class="mj-sist-concepto-check" value="${s}" ${marcado ? 'checked' : ''}> ${s}</label>`;
                }).join('')}
            </div>` : ''}
            <div class="mj-modal-btns">
                <button class="mj-btn-cancel" onclick="mjCerrarModal()">Cancelar</button>
                <button class="mj-btn-ok" onclick="mjGuardar('${nivel}','${parentId || ''}','${momentoKey}','${esEdicion ? conceptoExistente.id : ''}')">Guardar</button>
            </div>
        </div>
    `;
    document.body.appendChild(ov);
    document.getElementById('mj-input-nombre').focus();
}

function mjCerrarModal() {
    const ov = document.getElementById('mj-modal-ov');
    if (ov) ov.remove();
}

function mjEditar(id) {
    const c = mjConceptos.find(x => x.id === id);
    if (c) mjAbrirModal(c.nivel, c.parent_id, c.momento, c);
}

async function mjGuardar(nivel, parentId, momentoKey, idEdicion) {
    const nombre = document.getElementById('mj-input-nombre').value.trim();
    const desc = document.getElementById('mj-input-desc').value.trim();
    if (!nombre) {
        showToast('Pon un nombre al concepto');
        return;
    }

    const sistemasSel = [];
    document.querySelectorAll('.mj-sist-concepto-check:checked').forEach(ch => sistemasSel.push(ch.value));
    const sistemasVal = sistemasSel.length > 0 ? sistemasSel : null;

    try {
        if (idEdicion) {
            const { error } = await supabaseClient
                .from('modelo_conceptos')
                .update({ nombre: nombre, descripcion: desc || null, sistemas: sistemasVal })
                .eq('id', idEdicion);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient
                .from('modelo_conceptos')
                .insert({
                    club_id: mjClubId,
                    momento: momentoKey,
                    nivel: nivel,
                    nombre: nombre,
                    descripcion: desc || null,
                    sistemas: sistemasVal,
                    parent_id: parentId || null,
                    orden: mjConceptos.length
                });
            if (error) throw error;
        }
        mjCerrarModal();
        showToast('Guardado');
        cargarModeloJuego();
    } catch (e) {
        console.error('Error guardando concepto:', e);
        showToast('Error al guardar: ' + e.message);
    }
}

async function mjBorrar(id) {
    const c = mjConceptos.find(x => x.id === id);
    if (!c) return;
    const hijos = mjConceptos.filter(x => x.parent_id === id);
    let msg = '¿Borrar "' + c.nombre + '"?';
    if (hijos.length > 0) {
        msg += '\n\nSe borrarán también sus ' + hijos.length + ' concepto(s) hijo(s).';
    }
    if (!confirm(msg)) return;

    try {
        const { error } = await supabaseClient
            .from('modelo_conceptos')
            .update({ archived: true })
            .eq('id', id);
        if (error) throw error;
        showToast('Borrado');
        cargarModeloJuego();
    } catch (e) {
        console.error('Error borrando concepto:', e);
        showToast('Error al borrar: ' + e.message);
    }
}

// ========== CAPA 3: FICHA DEL CONCEPTO ==========

(function() {
    if (document.getElementById('mjf-styles')) return;
    const st = document.createElement('style');
    st.id = 'mjf-styles';
    st.textContent = `
        .mjf-ov { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1250; padding:20px; }
        .mjf-modal { background:#fff; border-radius:14px; max-width:560px; width:100%; max-height:85vh; overflow-y:auto; }
        .mjf-cab { padding:18px 20px; border-bottom:1px solid #e5e7eb; position:sticky; top:0; background:#fff; border-radius:14px 14px 0 0; }
        .mjf-cadena { font-size:12px; color:#6b7280; margin-bottom:3px; }
        .mjf-titulo { font-size:19px; font-weight:700; color:#1f2937; }
        .mjf-momento { font-size:12px; margin-top:3px; }
        .mjf-cerrar { position:absolute; top:16px; right:18px; background:none; border:none; font-size:22px; color:#9ca3af; cursor:pointer; }
        .mjf-body { padding:20px; }
        .mjf-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:18px; }
        .mjf-card { background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:12px; text-align:center; }
        .mjf-card .num { font-size:24px; font-weight:800; color:#7c3aed; }
        .mjf-card .lbl { font-size:11px; color:#6b7280; margin-top:2px; }
        .mjf-seccion-tit { font-size:13px; font-weight:700; color:#374151; margin:16px 0 8px; }
        .mjf-barras { display:flex; flex-direction:column; gap:6px; }
        .mjf-barra-row { display:flex; align-items:center; gap:8px; font-size:13px; }
        .mjf-barra-lbl { width:80px; color:#4b5563; }
        .mjf-barra-track { flex:1; background:#f3f4f6; border-radius:6px; height:20px; overflow:hidden; }
        .mjf-barra-fill { height:100%; background:#0F6E56; border-radius:6px; }
        .mjf-barra-num { width:30px; text-align:right; color:#1f2937; font-weight:600; }
        .mjf-sesiones { display:flex; flex-direction:column; gap:6px; }
        .mjf-sesion { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center; font-size:13px; }
        .mjf-sesion .fecha { color:#6b7280; font-size:12px; }
        .mjf-sesion .badge { font-size:11px; padding:2px 8px; border-radius:5px; background:#ede9fe; color:#7c3aed; }
        .mjf-vacio { color:#9ca3af; font-size:13px; padding:10px 0; text-align:center; }
        .mjf-ultima { background:#fef3c7; color:#92400e; border-radius:8px; padding:8px 12px; font-size:13px; margin-bottom:16px; }
        .mjf-nunca { background:#fee2e2; color:#991b1b; border-radius:8px; padding:8px 12px; font-size:13px; margin-bottom:16px; }
    `;
    document.head.appendChild(st);
})();

async function mjAbrirFicha(conceptoId) {
    const c = mjConceptos.find(x => x.id === conceptoId);
    if (!c) return;

    // cadena completa
    function cadena(id) {
        const partes = [];
        let actual = mjConceptos.find(x => x.id === id);
        let g = 0;
        while (actual && g < 10) {
            partes.unshift(actual.nombre);
            actual = actual.parent_id ? mjConceptos.find(x => x.id === actual.parent_id) : null;
            g++;
        }
        return partes;
    }
    const partesCadena = cadena(conceptoId);
    const tituloConcepto = partesCadena[partesCadena.length - 1];
    const cadenaPrevia = partesCadena.slice(0, -1).join(' › ');
    const mom = MJ_MOMENTOS.find(m => m.key === c.momento) || { nombre: '', icono: '', color: '#666' };

    // Modal con "cargando"
    const ov = document.createElement('div');
    ov.className = 'mjf-ov';
    ov.id = 'mjf-ov';
    ov.onclick = function(e) { if (e.target === ov) mjCerrarFicha(); };
    ov.innerHTML = `
        <div class="mjf-modal">
            <div class="mjf-cab">
                <button class="mjf-cerrar" onclick="mjCerrarFicha()">&times;</button>
                ${cadenaPrevia ? `<div class="mjf-cadena">${mjEscapar(cadenaPrevia)}</div>` : ''}
                <div class="mjf-titulo">${mjEscapar(tituloConcepto)}</div>
                <div class="mjf-momento" style="color:${mom.color};">${mom.icono} ${mom.nombre}</div>
            </div>
            <div class="mjf-body" id="mjf-body"><div class="mjf-vacio">Cargando datos...</div></div>
        </div>
    `;
    document.body.appendChild(ov);

    try {
        // Traer los registros de sesiones donde se trabajó este concepto
        const { data, error } = await supabaseClient
            .from('sesion_conceptos')
            .select('nivel_trabajo, training_sessions(id, name, session_date, fase)')
            .eq('concepto_id', conceptoId);
        if (error) throw error;

        const registros = (data || []).filter(r => r.training_sessions);
        mjRenderFicha(registros);
        // Capa 4: cargar y mostrar videos y ejercicios del concepto
        const extras = await mjvCargarExtras(conceptoId);
        const bodyFicha = document.getElementById('mjf-body');
        if (bodyFicha) bodyFicha.insertAdjacentHTML('beforeend', mjvRenderExtras(extras));
    } catch (e) {
        console.error('Error cargando ficha:', e);
        document.getElementById('mjf-body').innerHTML = '<div class="mjf-vacio">Error al cargar los datos.</div>';
    }
}

function mjRenderFicha(registros) {
    const body = document.getElementById('mjf-body');
    if (!body) return;

    const total = registros.length;

    if (total === 0) {
        body.innerHTML = `
            <div class="mjf-nunca">⚠️ Este concepto aún no se ha trabajado en ninguna sesión.</div>
            <div class="mjf-vacio">Cuando lo incluyas en una sesión, aquí verás el control de repeticiones.</div>
        `;
        return;
    }

    // Contar por fase
    let pretemporada = 0, temporada = 0;
    // Contar por nivel
    let individual = 0, sectorial = 0, completo = 0;
    // Fecha más reciente
    let ultimaFecha = null;

    registros.forEach(r => {
        const s = r.training_sessions;
        if (s.fase === 'Pretemporada') pretemporada++;
        else if (s.fase === 'Temporada') temporada++;
        if (r.nivel_trabajo === 'Individual') individual++;
        else if (r.nivel_trabajo === 'Sectorial') sectorial++;
        else if (r.nivel_trabajo === 'Completo') completo++;
        if (s.session_date && (!ultimaFecha || s.session_date > ultimaFecha)) ultimaFecha = s.session_date;
    });

    // Ordenar sesiones por fecha desc
    const sesionesOrden = registros.slice().sort((a, b) => {
        const fa = a.training_sessions.session_date || '';
        const fb = b.training_sessions.session_date || '';
        return fb.localeCompare(fa);
    });

    const maxNivel = Math.max(individual, sectorial, completo, 1);

    let ultimaTxt = '';
    if (ultimaFecha) {
        const fObj = new Date(ultimaFecha + 'T12:00:00');
        const dias = Math.max(0, Math.floor((new Date() - fObj) / (1000 * 60 * 60 * 24)));
        const fFmt = fObj.toLocaleDateString('es-ES');
        if (dias <= 7) {
            ultimaTxt = `<div class="mjf-ultima" style="background:#d1fae5;color:#065f46;">✅ Última vez: ${fFmt} (hace ${dias} día${dias !== 1 ? 's' : ''})</div>`;
        } else if (dias <= 21) {
            ultimaTxt = `<div class="mjf-ultima">🕒 Última vez: ${fFmt} (hace ${dias} días)</div>`;
        } else {
            ultimaTxt = `<div class="mjf-nunca">⚠️ Última vez: ${fFmt} (hace ${dias} días, quizá conviene retomarlo)</div>`;
        }
    }

    let sesionesHtml = '';
    sesionesOrden.forEach(r => {
        const s = r.training_sessions;
        const fFmt = s.session_date ? new Date(s.session_date + 'T12:00:00').toLocaleDateString('es-ES') : 'Sin fecha';
        sesionesHtml += `
            <div class="mjf-sesion" style="cursor:pointer;" onclick="mjIrASesion('${s.id}')" title="Abrir esta sesión para ver sus ejercicios">
                <div>
                    <div><strong>${mjEscapar(s.name || 'Sesión')}</strong> <span style="color:#7c3aed;font-size:11px;">abrir ↗</span></div>
                    <div class="fecha">${fFmt}${s.fase ? ' · ' + s.fase : ''}</div>
                </div>
                <span class="badge">${r.nivel_trabajo || '-'}</span>
            </div>
        `;
    });

    body.innerHTML = `
        ${ultimaTxt}
        <div class="mjf-cards">
            <div class="mjf-card"><div class="num">${total}</div><div class="lbl">Veces total</div></div>
            <div class="mjf-card"><div class="num">${pretemporada}</div><div class="lbl">Pretemporada</div></div>
            <div class="mjf-card"><div class="num">${temporada}</div><div class="lbl">Temporada</div></div>
        </div>

        <div class="mjf-seccion-tit">Por nivel de trabajo</div>
        <div class="mjf-barras">
            <div class="mjf-barra-row"><span class="mjf-barra-lbl">Individual</span><div class="mjf-barra-track"><div class="mjf-barra-fill" style="width:${(individual/maxNivel*100)}%;"></div></div><span class="mjf-barra-num">${individual}</span></div>
            <div class="mjf-barra-row"><span class="mjf-barra-lbl">Sectorial</span><div class="mjf-barra-track"><div class="mjf-barra-fill" style="width:${(sectorial/maxNivel*100)}%;"></div></div><span class="mjf-barra-num">${sectorial}</span></div>
            <div class="mjf-barra-row"><span class="mjf-barra-lbl">Completo</span><div class="mjf-barra-track"><div class="mjf-barra-fill" style="width:${(completo/maxNivel*100)}%;"></div></div><span class="mjf-barra-num">${completo}</span></div>
        </div>

        <div class="mjf-seccion-tit">Sesiones donde se trabajó (${total})</div>
        <div class="mjf-sesiones">${sesionesHtml}</div>
    `;
}

function mjCerrarFicha() {
    const ov = document.getElementById('mjf-ov');
    if (ov) ov.remove();
}

// ========== CUADRO DE CONTROL (vista de doble entrada) ==========

let mjCuadroMes = new Date().getMonth();
let mjCuadroAnio = new Date().getFullYear();
let mjCuadroDesde = null;  // si hay rango libre, manda sobre el mes
let mjCuadroHasta = null;

(function() {
    if (document.getElementById('mjc-styles')) return;
    const st = document.createElement('style');
    st.id = 'mjc-styles';
    st.textContent = `
        .mjc-filtros { display:flex; gap:14px; align-items:center; flex-wrap:wrap; margin-bottom:14px; background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:10px 14px; }
        .mjc-filtros .grupo { display:flex; gap:6px; align-items:center; }
        .mjc-filtros label { font-size:12px; color:#6b7280; }
        .mjc-filtros button.nav { background:#f3f4f6; border:1px solid #d1d5db; border-radius:6px; padding:4px 10px; cursor:pointer; }
        .mjc-mes-txt { font-size:14px; font-weight:600; color:#1f2937; min-width:130px; text-align:center; }
        .mjc-filtros input[type=date] { padding:5px 8px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; }
        .mjc-btn-aplicar { background:#7c3aed; color:#fff; border:none; border-radius:6px; padding:6px 12px; font-size:13px; cursor:pointer; }
        .mjc-btn-limpiar { background:none; border:none; color:#6b7280; font-size:12px; cursor:pointer; text-decoration:underline; }
        .mjc-btn-pdf { background:#7c3aed; color:#fff; border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; margin-left:auto; }
        .mjc-tabla-wrap { overflow-x:auto; background:#fff; border:1px solid #e5e7eb; border-radius:10px; }
        .mjc-tabla { border-collapse:collapse; font-size:12px; width:100%; }
        .mjc-tabla th { background:#26215C; color:#fff; padding:6px 8px; font-weight:600; font-size:11px; text-align:center; white-space:nowrap; }
        .mjc-tabla th.col-concepto { text-align:left; min-width:200px; position:sticky; left:0; background:#26215C; z-index:2; }
        .mjc-tabla td { border:1px solid #e5e7eb; padding:5px 8px; text-align:center; }
        .mjc-tabla td.concepto { text-align:left; color:#26215C; font-weight:600; cursor:pointer; position:sticky; left:0; background:#fff; z-index:1; white-space:nowrap; }
        .mjc-tabla td.concepto:hover { text-decoration:underline; }
        .mjc-tabla tr.momento td { background:#f3f4f6; font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; text-align:left; color:#374151; }
        .mjc-check { color:#1D9E75; font-size:14px; font-weight:700; }
        .mjc-total { font-weight:700; background:#EEEDFE; color:#26215C; }
        .mjc-total.cero { background:#FCEBEB; color:#A32D2D; }
        .mjc-vacio { text-align:center; color:#9ca3af; padding:30px; font-size:13px; }
    `;
    document.head.appendChild(st);
})();

function mjVistaArbol() {
    document.getElementById('mj-btn-arbol').classList.add('activa');
    document.getElementById('mj-btn-cuadro').classList.remove('activa');
    mjRender();
}

function mjVistaCuadro() {
    // Renderizar la estructura del cuadro y cargar datos
    const cont = document.getElementById('modelo-juego-contenido');
    const MESES_C = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    cont.innerHTML = `
        <div class="mj-cab">
            <h2>📋 Mi modelo de juego</h2>
            <div>
                <button class="mj-vista-btn" id="mj-btn-arbol" onclick="mjVistaArbol()">🌳 Árbol</button>
                <button class="mj-vista-btn activa" id="mj-btn-cuadro" onclick="mjVistaCuadro()">📊 Cuadro de control</button>
            </div>
        </div>
        <div class="mjc-filtros">
            <div class="grupo">
                <button class="nav" onclick="mjCuadroMesAnterior()">◀</button>
                <span class="mjc-mes-txt" id="mjc-mes-txt">${MESES_C[mjCuadroMes]} ${mjCuadroAnio}</span>
                <button class="nav" onclick="mjCuadroMesSiguiente()">▶</button>
            </div>
            <div class="grupo">
                <label>Desde</label>
                <input type="date" id="mjc-desde">
                <label>Hasta</label>
                <input type="date" id="mjc-hasta">
                <button class="mjc-btn-aplicar" onclick="mjCuadroAplicarRango()">Aplicar</button>
                <button class="mjc-btn-limpiar" onclick="mjCuadroLimpiarRango()">Volver a mes</button>
            </div>
            <button class="mjc-btn-pdf" onclick="mjCuadroPDF()">📄 PDF</button>
        </div>
        <div id="mjc-tabla-cont"><div class="mjc-vacio">Cargando cuadro...</div></div>
    `;
    mjCargarCuadro();
}

function mjCuadroMesAnterior() {
    mjCuadroDesde = null; mjCuadroHasta = null;
    mjCuadroMes--;
    if (mjCuadroMes < 0) { mjCuadroMes = 11; mjCuadroAnio--; }
    mjVistaCuadro();
}

function mjCuadroMesSiguiente() {
    mjCuadroDesde = null; mjCuadroHasta = null;
    mjCuadroMes++;
    if (mjCuadroMes > 11) { mjCuadroMes = 0; mjCuadroAnio++; }
    mjVistaCuadro();
}

function mjCuadroAplicarRango() {
    const d = document.getElementById('mjc-desde').value;
    const h = document.getElementById('mjc-hasta').value;
    if (!d || !h) { showToast('Elige las dos fechas del rango'); return; }
    mjCuadroDesde = d; mjCuadroHasta = h;
    mjCargarCuadro();
}

function mjCuadroLimpiarRango() {
    mjCuadroDesde = null; mjCuadroHasta = null;
    mjVistaCuadro();
}

function mjCuadroRangoActual() {
    if (mjCuadroDesde && mjCuadroHasta) {
        return { desde: mjCuadroDesde, hasta: mjCuadroHasta };
    }
    const primero = new Date(mjCuadroAnio, mjCuadroMes, 1);
    const ultimo = new Date(mjCuadroAnio, mjCuadroMes + 1, 0);
    const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    return { desde: iso(primero), hasta: iso(ultimo) };
}

let mjCuadroDatos = null; // cache para el PDF

async function mjCargarCuadro() {
    const contTabla = document.getElementById('mjc-tabla-cont');
    if (!contTabla) return;
    contTabla.innerHTML = '<div class="mjc-vacio">Cargando cuadro...</div>';

    const rango = mjCuadroRangoActual();

    try {
        // Sesiones del club en el rango
        const { data: sesiones, error: errS } = await supabaseClient
            .from('training_sessions')
            .select('id, name, session_date')
            .eq('club_id', mjClubId)
            .gte('session_date', rango.desde)
            .lte('session_date', rango.hasta)
            .order('session_date');
        if (errS) throw errS;

        const sesionIds = (sesiones || []).map(s => s.id);

        // Vinculos concepto-sesion de esas sesiones
        let vinculos = [];
        if (sesionIds.length > 0) {
            const { data: v, error: errV } = await supabaseClient
                .from('sesion_conceptos')
                .select('concepto_id, sesion_id')
                .in('sesion_id', sesionIds);
            if (errV) throw errV;
            vinculos = v || [];
        }

        mjCuadroDatos = { sesiones: sesiones || [], vinculos: vinculos, rango: rango };
        mjRenderCuadro();
    } catch (e) {
        console.error('Error cargando cuadro:', e);
        contTabla.innerHTML = '<div class="mjc-vacio">Error al cargar: ' + e.message + '</div>';
    }
}

function mjRenderCuadro() {
    const contTabla = document.getElementById('mjc-tabla-cont');
    if (!contTabla || !mjCuadroDatos) return;
    const { sesiones, vinculos } = mjCuadroDatos;

    if (mjConceptos.length === 0) {
        contTabla.innerHTML = '<div class="mjc-vacio">Aún no tienes conceptos en tu modelo de juego.</div>';
        return;
    }

    // Mapa rapido: "conceptoId_sesionId" -> true
    const marcado = {};
    vinculos.forEach(v => { marcado[v.concepto_id + '_' + v.sesion_id] = true; });

    // Cabecera de columnas: fechas cortas
    let ths = '<th class="col-concepto">Concepto</th>';
    sesiones.forEach(s => {
        const f = s.session_date ? s.session_date.slice(8,10) + '/' + s.session_date.slice(5,7) : '?';
        ths += `<th title="${mjEscapar(s.name || '')}">${f}</th>`;
    });
    ths += '<th style="background:#534AB7;">Total</th>';

    // Filas: por momento, con jerarquia (principio, sub, subsub)
    let filas = '';
    MJ_MOMENTOS.forEach(m => {
        const principios = mjPrincipios(m.key);
        if (principios.length === 0) return;
        filas += `<tr class="momento"><td colspan="${sesiones.length + 2}">${m.icono} ${m.nombre}</td></tr>`;

        function filaConcepto(c, prefijo) {
            let celdas = '';
            let total = 0;
            sesiones.forEach(s => {
                const hay = marcado[c.id + '_' + s.id];
                if (hay) total++;
                celdas += `<td>${hay ? '<span class="mjc-check">✓</span>' : ''}</td>`;
            });
            const clase = total === 0 ? 'mjc-total cero' : 'mjc-total';
            return `<tr><td class="concepto" onclick="mjAbrirFicha('${c.id}')">${prefijo}${mjEscapar(c.nombre)}</td>${celdas}<td class="${clase}">${total}</td></tr>`;
        }

        principios.forEach(p => {
            filas += filaConcepto(p, '');
            mjHijos(p.id, 'subprincipio').forEach(s => {
                filas += filaConcepto(s, '— ');
                mjHijos(s.id, 'subsubprincipio').forEach(ss => {
                    filas += filaConcepto(ss, '&nbsp;&nbsp;· ');
                });
            });
        });
    });

    const avisoSinSesiones = sesiones.length === 0
        ? '<div class="mjc-vacio">No hay sesiones en este periodo. Los totales muestran 0.</div>'
        : '';

    contTabla.innerHTML = `
        ${avisoSinSesiones}
        <div class="mjc-tabla-wrap">
            <table class="mjc-tabla">
                <thead><tr>${ths}</tr></thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
        <div style="font-size:12px;color:#6b7280;margin-top:8px;">Pincha un concepto para abrir su ficha detallada. Totales en rojo = sin trabajar en el periodo.</div>
    `;
}

function mjCuadroPDF() {
    if (!mjCuadroDatos) { showToast('Carga primero el cuadro'); return; }
    const { sesiones, vinculos, rango } = mjCuadroDatos;
    const { jsPDF } = window.jspdf;
    // Horizontal para que quepan mas columnas
    const doc = new jsPDF({ orientation: 'landscape' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const nombreClub = (clubData && clubData.name) ? clubData.name : 'Club';
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(nombreClub + ' - Cuadro de control del modelo de juego', W / 2, 14, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Periodo: ' + rango.desde + ' a ' + rango.hasta, W / 2, 21, { align: 'center' });

    const marcado = {};
    vinculos.forEach(v => { marcado[v.concepto_id + '_' + v.sesion_id] = true; });

    const colConcepto = 70;
    const colTotal = 14;
    const margen = 10;
    const anchoDisponible = W - margen * 2 - colConcepto - colTotal;
    const maxCols = Math.min(sesiones.length, Math.floor(anchoDisponible / 9));
    const sesionesPdf = sesiones.slice(0, maxCols);
    const anchoCol = sesionesPdf.length > 0 ? anchoDisponible / sesionesPdf.length : 0;

    let y = 30;
    const altoFila = 6;

    // Cabecera
    doc.setFillColor(38, 33, 92);
    doc.rect(margen, y, colConcepto, altoFila, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text('Concepto', margen + 2, y + 4);
    sesionesPdf.forEach((s, i) => {
        const x = margen + colConcepto + i * anchoCol;
        doc.setFillColor(38, 33, 92);
        doc.rect(x, y, anchoCol, altoFila, 'F');
        const f = s.session_date ? s.session_date.slice(8,10) + '/' + s.session_date.slice(5,7) : '?';
        doc.text(f, x + anchoCol / 2, y + 4, { align: 'center' });
    });
    const xTotal = margen + colConcepto + sesionesPdf.length * anchoCol;
    doc.setFillColor(83, 74, 183);
    doc.rect(xTotal, y, colTotal, altoFila, 'F');
    doc.text('Total', xTotal + colTotal / 2, y + 4, { align: 'center' });
    y += altoFila;

    function filaPdf(c, prefijo) {
        if (y > H - 12) { doc.addPage({ orientation: 'landscape' }); y = 12; }
        doc.setDrawColor(200, 200, 200);
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(7);
        doc.rect(margen, y, colConcepto, altoFila);
        const nombre = (prefijo + c.nombre).substring(0, 45);
        doc.text(nombre, margen + 2, y + 4);
        let total = 0;
        sesionesPdf.forEach((s, i) => {
            const x = margen + colConcepto + i * anchoCol;
            doc.rect(x, y, anchoCol, altoFila);
            if (marcado[c.id + '_' + s.id]) {
                total++;
                doc.setTextColor(29, 158, 117);
                doc.text('X', x + anchoCol / 2, y + 4, { align: 'center' });
                doc.setTextColor(40, 40, 40);
            }
        });
        doc.rect(xTotal, y, colTotal, altoFila);
        if (total === 0) doc.setTextColor(163, 45, 45);
        else doc.setTextColor(38, 33, 92);
        doc.text(String(total), xTotal + colTotal / 2, y + 4, { align: 'center' });
        doc.setTextColor(40, 40, 40);
        y += altoFila;
    }

    MJ_MOMENTOS.forEach(m => {
        const principios = mjPrincipios(m.key);
        if (principios.length === 0) return;
        if (y > H - 12) { doc.addPage({ orientation: 'landscape' }); y = 12; }
        doc.setFillColor(240, 240, 240);
        doc.rect(margen, y, colConcepto + sesionesPdf.length * anchoCol + colTotal, altoFila, 'F');
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(7);
        doc.text(m.nombre.toUpperCase(), margen + 2, y + 4);
        y += altoFila;

        principios.forEach(p => {
            filaPdf(p, '');
            mjHijos(p.id, 'subprincipio').forEach(s => {
                filaPdf(s, '- ');
                mjHijos(s.id, 'subsubprincipio').forEach(ss => {
                    filaPdf(ss, '  . ');
                });
            });
        });
    });

    if (sesiones.length > maxCols) {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('Nota: se muestran las primeras ' + maxCols + ' sesiones del periodo (' + sesiones.length + ' en total). Usa un rango mas corto para ver todas.', margen, H - 6);
    }

    doc.save('Cuadro_Modelo_Juego_' + rango.desde + '_' + rango.hasta + '.pdf');
    showToast('PDF generado');
}

// Abre una sesión en el editor del planificador (desde la ficha del concepto)
function mjIrASesion(sesionId) {
    mjCerrarFicha();
    // Ir a la sub-pestaña "Crear Sesion" del planificador
    const btnCrear = document.querySelector("#modulo-planificador .sub-tab[onclick*=\"'crear'\"]")
        || document.querySelector('#modulo-planificador .sub-tab');
    if (btnCrear && typeof cambiarSubTab === 'function') {
        cambiarSubTab('planificador', 'crear', btnCrear);
    }
    // Cargar la sesión en el editor (función existente del planificador)
    if (typeof cargarSesionEnEditor === 'function') {
        cargarSesionEnEditor(sesionId);
    } else {
        showToast('No se pudo abrir la sesión');
    }
}

// ========== CAPA 4: VIDEOS Y EJERCICIOS DEL CONCEPTO ==========

(function() {
    if (document.getElementById('mjv-styles')) return;
    const st = document.createElement('style');
    st.id = 'mjv-styles';
    st.textContent = `
        .mjv-video { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:10px 12px; margin-bottom:8px; }
        .mjv-video-cab { display:flex; justify-content:space-between; align-items:center; gap:8px; }
        .mjv-video-titulo { font-size:13px; font-weight:600; color:#1f2937; flex:1; }
        .mjv-video-borrar { background:none; border:none; color:#dc2626; cursor:pointer; font-size:14px; }
        .mjv-embed { margin-top:8px; border-radius:8px; overflow:hidden; aspect-ratio:16/9; }
        .mjv-embed iframe { width:100%; height:100%; border:none; }
        .mjv-link { display:inline-block; margin-top:6px; font-size:13px; color:#7c3aed; }
        .mjv-add-form { background:#f3f4f6; border-radius:8px; padding:10px 12px; margin-bottom:8px; display:none; }
        .mjv-add-form input { width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:6px; font-size:13px; margin-bottom:6px; }
        .mjv-add-form .fila-btns { display:flex; gap:6px; justify-content:flex-end; }
        .mjv-btn-sec { background:#fff; border:1px solid #d1d5db; color:#374151; border-radius:6px; padding:6px 12px; font-size:13px; cursor:pointer; }
        .mjv-btn-pri { background:#7c3aed; border:none; color:#fff; border-radius:6px; padding:6px 12px; font-size:13px; cursor:pointer; }
        .mjv-add-btn { background:#ede9fe; border:1px dashed #7c3aed; color:#7c3aed; border-radius:8px; padding:7px 12px; font-size:13px; cursor:pointer; }
        .mjv-ej { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:9px 12px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; font-size:13px; }
        .mjv-ej .cat { color:#6b7280; font-size:11px; }
        .mjv-sel-lista { max-height:300px; overflow-y:auto; }
        .mjv-sel-item { padding:9px 11px; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:6px; cursor:pointer; font-size:13px; }
        .mjv-sel-item:hover { background:#f3f4f6; }
        .mjv-sel-item .cat { color:#9ca3af; font-size:11px; }
        .mjv-buscador { width:100%; padding:8px 10px; border:1px solid #d1d5db; border-radius:8px; font-size:13px; margin-bottom:10px; }
    `;
    document.head.appendChild(st);
})();

let mjfConceptoActual = null; // concepto abierto en la ficha

// Convierte una URL de YouTube en URL de embed; devuelve null si no es YouTube
function mjvYoutubeEmbed(url) {
    try {
        const u = new URL(url);
        let videoId = null;
        if (u.hostname.includes('youtube.com')) {
            videoId = u.searchParams.get('v');
            if (!videoId && u.pathname.startsWith('/shorts/')) videoId = u.pathname.split('/')[2];
            if (!videoId && u.pathname.startsWith('/embed/')) videoId = u.pathname.split('/')[2];
        } else if (u.hostname === 'youtu.be') {
            videoId = u.pathname.slice(1);
        }
        return videoId ? ('https://www.youtube.com/embed/' + videoId) : null;
    } catch (e) {
        return null;
    }
}

async function mjvCargarExtras(conceptoId) {
    mjfConceptoActual = conceptoId;
    // Videos
    const { data: videos } = await supabaseClient
        .from('modelo_concepto_videos')
        .select('*')
        .eq('concepto_id', conceptoId)
        .order('created_at');
    // Ejercicios vinculados (con datos del ejercicio)
    const { data: ejercicios } = await supabaseClient
        .from('modelo_concepto_ejercicios')
        .select('id, ejercicio_id, custom_exercises(name, category, thumbnail_svg)')
        .eq('concepto_id', conceptoId)
        .order('created_at');
    return { videos: videos || [], ejercicios: ejercicios || [] };
}

function mjvRenderExtras(extras) {
    const { videos, ejercicios } = extras;

    // --- Videos ---
    let videosHtml = '';
    videos.forEach(v => {
        const embed = mjvYoutubeEmbed(v.url);
        videosHtml += `
            <div class="mjv-video">
                <div class="mjv-video-cab">
                    <span class="mjv-video-titulo">🎬 ${mjEscapar(v.titulo || 'Vídeo')}</span>
                    <button class="mjv-video-borrar" onclick="mjvBorrarVideo('${v.id}')" title="Borrar vídeo">🗑️</button>
                </div>
                ${embed
                    ? `<div class="mjv-embed"><iframe src="${embed}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`
                    : `<a class="mjv-link" href="${mjEscapar(v.url)}" target="_blank">Abrir vídeo ↗</a>`}
            </div>
        `;
    });
    if (videos.length === 0) videosHtml = '<div class="mjf-vacio">Sin vídeos todavía.</div>';

    // --- Ejercicios ---
    let ejHtml = '';
    ejercicios.forEach(e => {
        const ej = e.custom_exercises || {};
        const mini = ej.thumbnail_svg
            ? `<div style="width:60px;height:44px;border-radius:6px;overflow:hidden;background:#e5e7eb;flex-shrink:0;">${ej.thumbnail_svg}</div>`
            : `<div style="width:60px;height:44px;border-radius:6px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;flex-shrink:0;">⚽</div>`;
        ejHtml += `
            <div class="mjv-ej" style="cursor:pointer;" onclick="mjvVerEjercicio('${e.ejercicio_id}')" title="Ver detalle del ejercicio">
                <div style="display:flex;align-items:center;gap:10px;flex:1;">
                    ${mini}
                    <div>
                        <div><strong>${mjEscapar(ej.name || 'Ejercicio')}</strong> <span style="color:#7c3aed;font-size:11px;">ver ↗</span></div>
                        <div class="cat">${mjEscapar(ej.category || '')}</div>
                    </div>
                </div>
                <button class="mjv-video-borrar" onclick="event.stopPropagation(); mjvDesvincularEjercicio('${e.id}')" title="Quitar vínculo">🗑️</button>
            </div>
        `;
    });
    if (ejercicios.length === 0) ejHtml = '<div class="mjf-vacio">Sin ejercicios vinculados todavía.</div>';

    return `
        <div class="mjf-seccion-tit">🎬 Vídeos del concepto (${videos.length})</div>
        <div class="mjv-add-form" id="mjv-form-video">
            <input type="text" id="mjv-input-titulo" placeholder="Título (opcional, ej: Ejemplo salida en corto)">
            <input type="text" id="mjv-input-url" placeholder="Pega el enlace (YouTube, Vimeo, Veo...)">
            <div class="fila-btns">
                <button class="mjv-btn-sec" onclick="document.getElementById('mjv-form-video').style.display='none'">Cancelar</button>
                <button class="mjv-btn-pri" onclick="mjvGuardarVideo()">Guardar vídeo</button>
            </div>
        </div>
        <div>${videosHtml}</div>
        <button class="mjv-add-btn" onclick="document.getElementById('mjv-form-video').style.display='block'">➕ Añadir vídeo</button>

        <div class="mjf-seccion-tit" style="margin-top:20px;">⚽ Ejercicios para trabajarlo (${ejercicios.length})</div>
        <div>${ejHtml}</div>
        <button class="mjv-add-btn" onclick="mjvAbrirSelectorEjercicios()">➕ Vincular ejercicio</button>
    `;
}

async function mjvGuardarVideo() {
    const titulo = document.getElementById('mjv-input-titulo').value.trim();
    const url = document.getElementById('mjv-input-url').value.trim();
    if (!url) { showToast('Pega el enlace del vídeo'); return; }
    try {
        const { error } = await supabaseClient
            .from('modelo_concepto_videos')
            .insert({ concepto_id: mjfConceptoActual, titulo: titulo || null, url: url });
        if (error) throw error;
        showToast('Vídeo añadido');
        mjvRefrescarFicha();
    } catch (e) {
        console.error('Error guardando vídeo:', e);
        showToast('Error al guardar: ' + e.message);
    }
}

async function mjvBorrarVideo(id) {
    if (!confirm('¿Borrar este vídeo del concepto?')) return;
    try {
        await supabaseClient.from('modelo_concepto_videos').delete().eq('id', id);
        showToast('Vídeo borrado');
        mjvRefrescarFicha();
    } catch (e) {
        showToast('Error al borrar');
    }
}

async function mjvAbrirSelectorEjercicios() {
    // Cargar ejercicios de la biblioteca del club
    let ejercicios = [];
    try {
        const { data } = await supabaseClient
            .from('custom_exercises')
            .select('id, name, category, thumbnail_svg')
            .eq('coach_id', String(usuario.id))
            .order('name')
            .limit(300);
        ejercicios = data || [];
    } catch (e) {
        console.error('Error cargando ejercicios:', e);
    }

    let lista = '';
    if (ejercicios.length === 0) {
        lista = '<div class="mjf-vacio">No se encontraron ejercicios en tu biblioteca.</div>';
    } else {
        ejercicios.forEach(e => {
            const mini = e.thumbnail_svg
                ? `<div style="width:56px;height:40px;border-radius:5px;overflow:hidden;background:#e5e7eb;flex-shrink:0;">${e.thumbnail_svg}</div>`
                : `<div style="width:56px;height:40px;border-radius:5px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;flex-shrink:0;">⚽</div>`;
            lista += `
                <div class="mjv-sel-item" data-nombre="${mjEscapar((e.name || '').toLowerCase())}" onclick="mjvVincularEjercicio('${e.id}')" style="display:flex;align-items:center;gap:10px;">
                    ${mini}
                    <div>
                        <strong>${mjEscapar(e.name || 'Ejercicio')}</strong>
                        <div class="cat">${mjEscapar(e.category || '')}</div>
                    </div>
                </div>
            `;
        });
    }

    const ov = document.createElement('div');
    ov.className = 'mjf-ov';
    ov.id = 'mjv-sel-ov';
    ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
    ov.innerHTML = `
        <div class="mjf-modal" style="max-width:480px;">
            <div class="mjf-cab">
                <button class="mjf-cerrar" onclick="document.getElementById('mjv-sel-ov').remove()">&times;</button>
                <div class="mjf-titulo" style="font-size:16px;">Vincular ejercicio</div>
            </div>
            <div class="mjf-body">
                <input type="text" class="mjv-buscador" placeholder="Buscar ejercicio..." oninput="mjvFiltrarEjercicios(this.value)">
                <div class="mjv-sel-lista" id="mjv-sel-lista">${lista}</div>
            </div>
        </div>
    `;
    document.body.appendChild(ov);
}

function mjvFiltrarEjercicios(texto) {
    const t = texto.toLowerCase();
    document.querySelectorAll('#mjv-sel-lista .mjv-sel-item').forEach(item => {
        item.style.display = item.dataset.nombre.includes(t) ? 'block' : 'none';
    });
}

async function mjvVincularEjercicio(ejercicioId) {
    try {
        const { error } = await supabaseClient
            .from('modelo_concepto_ejercicios')
            .insert({ concepto_id: mjfConceptoActual, ejercicio_id: ejercicioId });
        if (error) throw error;
        const ov = document.getElementById('mjv-sel-ov');
        if (ov) ov.remove();
        showToast('Ejercicio vinculado');
        mjvRefrescarFicha();
    } catch (e) {
        console.error('Error vinculando ejercicio:', e);
        showToast('Error al vincular: ' + e.message);
    }
}

async function mjvDesvincularEjercicio(vinculoId) {
    if (!confirm('¿Quitar este ejercicio del concepto?')) return;
    try {
        await supabaseClient.from('modelo_concepto_ejercicios').delete().eq('id', vinculoId);
        showToast('Ejercicio desvinculado');
        mjvRefrescarFicha();
    } catch (e) {
        showToast('Error al desvincular');
    }
}

// Vuelve a abrir la ficha del concepto actual (refresco tras cambios)
function mjvRefrescarFicha() {
    if (!mjfConceptoActual) return;
    const id = mjfConceptoActual;
    mjCerrarFicha();
    mjAbrirFicha(id);
}

// Modal de detalle de un ejercicio vinculado
async function mjvVerEjercicio(ejercicioId) {
    try {
        const { data: ej, error } = await supabaseClient
            .from('custom_exercises')
            .select('name, category, duration_min, players_count, difficulty, objectives, description, materials, thumbnail_svg')
            .eq('id', ejercicioId)
            .single();
        if (error || !ej) { showToast('No se pudo cargar el ejercicio'); return; }

        const mini = ej.thumbnail_svg
            ? `<div style="border-radius:10px;overflow:hidden;background:#e5e7eb;margin-bottom:14px;">${ej.thumbnail_svg}</div>`
            : '';

        let datos = '';
        if (ej.category) datos += `<span style="background:#ede9fe;color:#7c3aed;border-radius:6px;padding:3px 10px;font-size:12px;margin-right:6px;">${mjEscapar(ej.category)}</span>`;
        if (ej.duration_min) datos += `<span style="background:#f3f4f6;color:#374151;border-radius:6px;padding:3px 10px;font-size:12px;margin-right:6px;">⏱ ${ej.duration_min} min</span>`;
        if (ej.players_count) datos += `<span style="background:#f3f4f6;color:#374151;border-radius:6px;padding:3px 10px;font-size:12px;margin-right:6px;">👥 ${ej.players_count}</span>`;
        if (ej.difficulty) datos += `<span style="background:#f3f4f6;color:#374151;border-radius:6px;padding:3px 10px;font-size:12px;">${mjEscapar(ej.difficulty)}</span>`;

        let secciones = '';
        if (ej.objectives) secciones += `<div class="mjf-seccion-tit">🎯 Objetivos</div><div style="font-size:13px;color:#4b5563;line-height:1.5;">${mjEscapar(ej.objectives)}</div>`;
        if (ej.description) secciones += `<div class="mjf-seccion-tit">📝 Descripción</div><div style="font-size:13px;color:#4b5563;line-height:1.5;white-space:pre-wrap;">${mjEscapar(ej.description)}</div>`;
        if (ej.materials) secciones += `<div class="mjf-seccion-tit">🧰 Material</div><div style="font-size:13px;color:#4b5563;">${mjEscapar(ej.materials)}</div>`;

        const ov = document.createElement('div');
        ov.className = 'mjf-ov';
        ov.id = 'mjv-ejdetalle-ov';
        ov.style.zIndex = '1300';
        ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
        ov.innerHTML = `
            <div class="mjf-modal" style="max-width:500px;">
                <div class="mjf-cab">
                    <button class="mjf-cerrar" onclick="document.getElementById('mjv-ejdetalle-ov').remove()">&times;</button>
                    <div class="mjf-titulo" style="font-size:17px;">⚽ ${mjEscapar(ej.name || 'Ejercicio')}</div>
                </div>
                <div class="mjf-body">
                    ${mini}
                    <div style="margin-bottom:12px;">${datos}</div>
                    ${secciones}
                </div>
            </div>
        `;
        document.body.appendChild(ov);
    } catch (e) {
        console.error('Error mostrando ejercicio:', e);
        showToast('Error al abrir el ejercicio');
    }
}
