// ============================================================
// CM-DOCS.JS · Documentos del club
// TopLiderCoach HUB · Club Mode
// ============================================================
// Repositorio de documentos (PDF, Word, Excel, imagenes) con
// visibilidad por cargo. Bucket: club-docs · Tabla: cm_docs
// Permiso: 'documentos' (ver = consultar/descargar · editar = subir/archivar)
// Patron archivar-nunca-borrar.
// ============================================================

var cmDocsLista = [];
var cmDocsRoles = [];
var cmDocsFiltroCat = 'all';

var CMDOCS_CATS = [
    ['normativa', 'Normativa'],
    ['convocatorias', 'Convocatorias'],
    ['autorizaciones', 'Autorizaciones'],
    ['viajes', 'Viajes'],
    ['sesiones', 'Sesiones'],
    ['otros', 'Otros']
];
var CMDOCS_CAT_LABEL = {};
CMDOCS_CATS.forEach(function(c) { CMDOCS_CAT_LABEL[c[0]] = c[1]; });

var CMDOCS_ICON = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOC',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLS',
    'image/jpeg': 'IMG', 'image/png': 'IMG', 'image/webp': 'IMG'
};

function cmDocsEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function cmDocsPuedeEditar() {
    if (typeof cmState !== 'undefined' && cmState.esAdmin) return true;
    if (typeof cmPuedeEditar === 'function') return cmPuedeEditar('documentos');
    return false;
}

function cmDocsTamano(b) {
    if (!b) return '';
    if (b < 1024 * 1024) return Math.round(b / 1024) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
}

// ========== INIT ==========
async function cmDocsInit(contenedorId) {
    var cont = document.getElementById(contenedorId);
    if (!cont) return;

    cont.innerHTML =
        '<style>' +
        '.cmdocs-wrap{background:#0f172a;border-radius:12px;padding:20px;min-height:400px}' +
        '.cmdocs-header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px}' +
        '.cmdocs-header h2{color:#e2e8f0;font-size:20px;margin:0}' +
        '.cmdocs-btn{border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer}' +
        '.cmdocs-btn-primary{background:#3b82f6;color:#fff}.cmdocs-btn-primary:hover{background:#2563eb}' +
        '.cmdocs-btn-secondary{background:#1e293b;color:#e2e8f0;border:1px solid #334155}' +
        '.cmdocs-cats{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}' +
        '.cmdocs-cat{background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:20px;padding:5px 14px;font-size:12px;cursor:pointer}' +
        '.cmdocs-cat.ac{background:#3b82f6;color:#fff;border-color:#3b82f6}' +
        '.cmdocs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}' +
        '.cmdocs-card{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px;display:flex;gap:12px;align-items:flex-start}' +
        '.cmdocs-ic{min-width:44px;height:44px;border-radius:8px;background:#334155;color:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800}' +
        '.cmdocs-ic.pdf{background:#7f1d1d;color:#fecaca}.cmdocs-ic.doc{background:#1e3a8a;color:#bfdbfe}' +
        '.cmdocs-ic.xls{background:#14532d;color:#bbf7d0}.cmdocs-ic.img{background:#581c87;color:#e9d5ff}' +
        '.cmdocs-body{flex:1;min-width:0}' +
        '.cmdocs-tit{color:#e2e8f0;font-size:14px;font-weight:600;margin:0 0 3px;word-break:break-word}' +
        '.cmdocs-meta{color:#64748b;font-size:11px;margin-bottom:8px}' +
        '.cmdocs-badge{display:inline-block;background:#0f172a;border:1px solid #334155;color:#94a3b8;border-radius:5px;padding:1px 7px;font-size:10px;margin-right:4px}' +
        '.cmdocs-acts{display:flex;gap:8px;margin-top:6px}' +
        '.cmdocs-lk{color:#60a5fa;font-size:12px;cursor:pointer;text-decoration:none}.cmdocs-lk:hover{text-decoration:underline}' +
        '.cmdocs-lk.rojo{color:#f87171}' +
        '.cmdocs-empty{text-align:center;color:#64748b;padding:50px 20px}' +
        '.cmdocs-empty .icon{font-size:40px;margin-bottom:8px}' +
        '.cmdocs-ov{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:99999}' +
        '.cmdocs-modal{background:#1e293b;border-radius:12px;padding:24px;width:420px;max-width:92%;max-height:88vh;overflow-y:auto;color:#fff}' +
        '.cmdocs-modal h3{margin:0 0 16px;font-size:16px}' +
        '.cmdocs-fld{margin-bottom:12px}' +
        '.cmdocs-fld label{display:block;color:#94a3b8;font-size:12px;margin-bottom:4px}' +
        '.cmdocs-fld input[type=text],.cmdocs-fld select{width:100%;padding:9px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#fff;font-size:13px;box-sizing:border-box}' +
        '.cmdocs-roles{display:flex;flex-direction:column;gap:6px;max-height:150px;overflow-y:auto;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:10px}' +
        '.cmdocs-roles label{display:flex;align-items:center;gap:8px;color:#e2e8f0;font-size:13px;margin:0;cursor:pointer}' +
        '</style>' +
        '<div class="cmdocs-wrap">' +
            '<div class="cmdocs-header">' +
                '<h2>Documentos del club</h2>' +
                (cmDocsPuedeEditar() ? '<button class="cmdocs-btn cmdocs-btn-primary" onclick="cmDocsAbrirSubir()">+ Subir documento</button>' : '') +
            '</div>' +
            '<div class="cmdocs-cats" id="cmdocs-cats"></div>' +
            '<div id="cmdocs-lista"><div class="cmdocs-empty"><div class="icon">📂</div><p>Cargando documentos...</p></div></div>' +
        '</div>';

    cmDocsRenderCats();
    await cmDocsCargarRoles();
    await cmDocsCargar();
}

function cmDocsRenderCats() {
    var c = document.getElementById('cmdocs-cats');
    if (!c) return;
    var h = '<div class="cmdocs-cat' + (cmDocsFiltroCat === 'all' ? ' ac' : '') + '" onclick="cmDocsFiltrar(\'all\')">Todos</div>';
    CMDOCS_CATS.forEach(function(cat) {
        h += '<div class="cmdocs-cat' + (cmDocsFiltroCat === cat[0] ? ' ac' : '') + '" onclick="cmDocsFiltrar(\'' + cat[0] + '\')">' + cat[1] + '</div>';
    });
    c.innerHTML = h;
}

function cmDocsFiltrar(cat) {
    cmDocsFiltroCat = cat;
    cmDocsRenderCats();
    cmDocsRenderLista();
}

async function cmDocsCargarRoles() {
    try {
        var r = await supabaseClient.from('club_roles')
            .select('id, name')
            .eq('club_id', clubId)
            .order('name');
        cmDocsRoles = r.data || [];
    } catch (e) { cmDocsRoles = []; }
}

// ========== CARGAR ==========
async function cmDocsCargar() {
    try {
        var r = await supabaseClient.from('cm_docs')
            .select('*')
            .eq('club_id', clubId)
            .eq('archived', false)
            .order('created_at', { ascending: false });
        if (r.error) throw r.error;
        var docs = r.data || [];

        // Filtro de visibilidad por cargo (el admin ve todo)
        var esAdmin = (typeof cmState !== 'undefined' && cmState.esAdmin);
        var miRol = (typeof cmState !== 'undefined' && cmState.miembro) ? cmState.miembro.role_id : null;
        cmDocsLista = docs.filter(function(d) {
            if (esAdmin) return true;
            if (d.visibility !== 'roles') return true;
            if (!d.visible_roles || !d.visible_roles.length) return true;
            return miRol && d.visible_roles.indexOf(miRol) !== -1;
        });
        cmDocsRenderLista();
    } catch (e) {
        console.error('[Docs] Error al cargar:', e);
        var l = document.getElementById('cmdocs-lista');
        if (l) l.innerHTML = '<div class="cmdocs-empty"><p>Error al cargar los documentos.</p></div>';
    }
}

function cmDocsRenderLista() {
    var l = document.getElementById('cmdocs-lista');
    if (!l) return;
    var lista = cmDocsLista.filter(function(d) {
        return cmDocsFiltroCat === 'all' || d.category === cmDocsFiltroCat;
    });
    if (!lista.length) {
        l.innerHTML = '<div class="cmdocs-empty"><div class="icon">📂</div><p>No hay documentos' +
            (cmDocsFiltroCat !== 'all' ? ' en esta categoria' : '') + '.</p></div>';
        return;
    }
    var editable = cmDocsPuedeEditar();
    var h = '<div class="cmdocs-grid">';
    lista.forEach(function(d) {
        var tipo = CMDOCS_ICON[d.mime_type] || 'DOC';
        var fecha = d.created_at ? new Date(d.created_at).toLocaleDateString('es-ES') : '';
        var vis = (d.visibility === 'roles') ? 'Cargos concretos' : 'Todo el club';
        h += '<div class="cmdocs-card">' +
            '<div class="cmdocs-ic ' + tipo.toLowerCase() + '">' + tipo + '</div>' +
            '<div class="cmdocs-body">' +
                '<p class="cmdocs-tit">' + cmDocsEsc(d.title) + '</p>' +
                '<div class="cmdocs-meta">' + fecha + (d.uploaded_by_name ? ' · ' + cmDocsEsc(d.uploaded_by_name) : '') + (d.file_size ? ' · ' + cmDocsTamano(d.file_size) : '') + '</div>' +
                '<span class="cmdocs-badge">' + (CMDOCS_CAT_LABEL[d.category] || d.category) + '</span>' +
                '<span class="cmdocs-badge">' + vis + '</span>' +
                '<div class="cmdocs-acts">' +
                    '<a class="cmdocs-lk" onclick="cmDocsDescargar(\'' + d.id + '\')">Ver / Descargar</a>' +
                    (editable ? '<a class="cmdocs-lk rojo" onclick="cmDocsArchivar(\'' + d.id + '\')">Archivar</a>' : '') +
                '</div>' +
            '</div>' +
        '</div>';
    });
    h += '</div>';
    l.innerHTML = h;
}

// ========== DESCARGAR ==========
function cmDocsDescargar(id) {
    var d = null;
    cmDocsLista.forEach(function(x) { if (x.id === id) d = x; });
    if (!d) return;
    var pub = supabaseClient.storage.from('club-docs').getPublicUrl(d.file_path);
    var url = pub && pub.data ? pub.data.publicUrl : null;
    if (url) window.open(url, '_blank');
    else showToast('No se pudo obtener el enlace', 'error');
}

// ========== SUBIR ==========
function cmDocsAbrirSubir() {
    var catOpts = CMDOCS_CATS.map(function(c) {
        return '<option value="' + c[0] + '">' + c[1] + '</option>';
    }).join('');
    var rolesChecks = cmDocsRoles.map(function(r) {
        return '<label><input type="checkbox" class="cmdocs-rol-chk" value="' + r.id + '"> ' + cmDocsEsc(r.name) + '</label>';
    }).join('');

    var ov = document.createElement('div');
    ov.className = 'cmdocs-ov';
    ov.id = 'cmdocs-modal-subir';
    ov.innerHTML =
        '<div class="cmdocs-modal">' +
            '<h3>Subir documento</h3>' +
            '<div class="cmdocs-fld"><label>Archivo (PDF, Word, Excel o imagen · max 10 MB)</label>' +
                '<input type="file" id="cmdocs-file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp" style="color:#e2e8f0;font-size:13px"></div>' +
            '<div class="cmdocs-fld"><label>Titulo *</label><input type="text" id="cmdocs-titulo" placeholder="Ej: Normativa interna 2026/27"></div>' +
            '<div class="cmdocs-fld"><label>Categoria</label><select id="cmdocs-cat">' + catOpts + '</select></div>' +
            '<div class="cmdocs-fld"><label>Visibilidad</label>' +
                '<select id="cmdocs-vis" onchange="document.getElementById(\'cmdocs-roles-box\').style.display=(this.value===\'roles\'?\'block\':\'none\')">' +
                    '<option value="club">Todo el club</option>' +
                    '<option value="roles">Solo estos cargos</option>' +
                '</select></div>' +
            '<div class="cmdocs-fld" id="cmdocs-roles-box" style="display:none"><label>Cargos con acceso</label>' +
                '<div class="cmdocs-roles">' + (rolesChecks || '<span style="color:#64748b;font-size:12px">Sin cargos definidos</span>') + '</div></div>' +
            '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">' +
                '<button class="cmdocs-btn cmdocs-btn-secondary" onclick="document.getElementById(\'cmdocs-modal-subir\').remove()">Cancelar</button>' +
                '<button class="cmdocs-btn cmdocs-btn-primary" id="cmdocs-btn-guardar" onclick="cmDocsSubir()">Subir</button>' +
            '</div>' +
        '</div>';
    ov.addEventListener('click', function(e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
}

async function cmDocsSubir() {
    var inp = document.getElementById('cmdocs-file');
    var titulo = document.getElementById('cmdocs-titulo').value.trim();
    var cat = document.getElementById('cmdocs-cat').value;
    var vis = document.getElementById('cmdocs-vis').value;
    var file = inp && inp.files && inp.files[0];

    if (!file) { showToast('Elige un archivo', 'error'); return; }
    if (!titulo) { showToast('Pon un titulo al documento', 'error'); return; }
    if (file.size > 10 * 1024 * 1024) { showToast('El archivo supera los 10 MB', 'error'); return; }

    var roles = null;
    if (vis === 'roles') {
        roles = [];
        document.querySelectorAll('.cmdocs-rol-chk:checked').forEach(function(c) { roles.push(c.value); });
        if (!roles.length) { showToast('Marca al menos un cargo', 'error'); return; }
    }

    var btn = document.getElementById('cmdocs-btn-guardar');
    if (btn) { btn.disabled = true; btn.textContent = 'Subiendo...'; }

    try {
        var ext = (file.name.split('.').pop() || 'bin').toLowerCase();
        var path = clubId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;

        var up = await supabaseClient.storage.from('club-docs').upload(path, file, { contentType: file.type || undefined });
        if (up.error) throw up.error;

        var quien = null;
        var miembroId = null;
        if (typeof cmState !== 'undefined' && cmState.miembro) {
            quien = cmState.miembro.display_name || null;
            miembroId = cmState.miembro.id || null;
        }
        if (!quien && typeof usuario !== 'undefined' && usuario) quien = usuario.display_name || usuario.name || null;

        var ins = await supabaseClient.from('cm_docs').insert({
            club_id: clubId,
            title: titulo,
            category: cat,
            file_path: path,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || null,
            visibility: vis,
            visible_roles: roles,
            uploaded_by_name: quien,
            created_by_member: miembroId
        });
        if (ins.error) throw ins.error;

        showToast('Documento subido');
        var m = document.getElementById('cmdocs-modal-subir');
        if (m) m.remove();
        await cmDocsCargar();
    } catch (e) {
        console.error('[Docs] Error al subir:', e);
        showToast('Error al subir: ' + (e.message || e), 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Subir'; }
    }
}

// ========== ARCHIVAR ==========
async function cmDocsArchivar(id) {
    if (!confirm('¿Archivar este documento? Dejara de verse en el listado.')) return;
    var r = await supabaseClient.from('cm_docs').update({ archived: true }).eq('id', id);
    if (r.error) { showToast('Error: ' + r.error.message, 'error'); return; }
    showToast('Documento archivado');
    await cmDocsCargar();
}

// ========== AUTO-MONTAJE ==========
// Mismo patron que cm-pagos.js / cm-familias.js.
(function cmDocsAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 20) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        if (typeof cmPuedeVer !== 'function' || !cmPuedeVer('documentos')) { clearInterval(intervalo); return; }
        clearInterval(intervalo);

        if (document.getElementById('cm-tab-docs')) return;
        var mainTabs = document.querySelector('.main-tabs');
        if (!mainTabs) return;

        var tab = document.createElement('button');
        tab.className = 'main-tab';
        tab.id = 'cm-tab-docs';
        tab.setAttribute('onclick', "cambiarModulo('docs', this)");
        tab.innerHTML = '<span class="tab-icon">📂</span><span>Documentos</span>';
        mainTabs.appendChild(tab);

        if (!document.getElementById('modulo-docs')) {
            var vista = document.createElement('div');
            vista.className = 'vista-modulo';
            vista.id = 'modulo-docs';
            var ultModulo = document.querySelector('.vista-modulo:last-of-type');
            if (ultModulo && ultModulo.parentElement) { ultModulo.parentElement.insertBefore(vista, ultModulo.nextSibling); }
            else { document.body.appendChild(vista); }
        }

        if (typeof registrarModulo === 'function') {
            registrarModulo('docs', function() { cmDocsInit('modulo-docs'); });
        }

        var pd = document.getElementById('cm-pantalla-desarrollo');
        if (pd) {
            pd.style.display = 'none';
            var mt = document.querySelector('.main-tabs');
            if (mt) mt.style.display = '';
            document.querySelectorAll('.vista-modulo').forEach(function(v) { v.style.display = ''; });
        }

        var tv = Array.from(document.querySelectorAll('.main-tab')).filter(function(t) { return t.style.display !== 'none'; });
        if (tv.length === 1 && tv[0].id === 'cm-tab-docs') { cambiarModulo('docs', tab); }

        console.log('[Modulo Documentos] Auto-montado y registrado');
    }, 500);
})();
