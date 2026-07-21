// ========== WELLNESS-ENLACES.JS - TopLiderCoach HUB ==========
// Pantalla para que el club vea y reparta los enlaces de wellness de cada jugador
// v2: los jugadores se cargan desde la plantilla de la TEMPORADA ACTIVA (season_players),
//     no desde el fichero permanente del club (players).

const WELLNESS_BASE_URL = new URL('wellness/', window.location.href).href;
const RPE_BASE_URL = new URL('rpe.html', window.location.href).href;

(function() {
    if (document.getElementById('wenl-styles')) return;
    const st = document.createElement('style');
    st.id = 'wenl-styles';
    st.textContent = `
        .wenl-cab { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px; }
        .wenl-cab h2 { font-size:20px; color:#1f2937; margin:0; }
        .wenl-temporada { display:inline-block; background:#ede9fe; color:#6d28d9; border-radius:999px; padding:4px 12px; font-size:12px; font-weight:700; margin-left:8px; vertical-align:middle; }
        .wenl-info { font-size:13px; color:#6b7280; margin-bottom:16px; line-height:1.5; }
        .wenl-btn-todos { background:#7c3aed; color:#fff; border:none; border-radius:8px; padding:10px 16px; font-size:14px; font-weight:600; cursor:pointer; }
        .wenl-lista { display:flex; flex-direction:column; gap:10px; }
        .wenl-row { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:12px 16px; display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
        .wenl-foto { width:40px; height:40px; border-radius:50%; background:#e5e7eb; object-fit:cover; flex-shrink:0; }
        .wenl-foto-ph { width:40px; height:40px; border-radius:50%; background:#7c3aed; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0; }
        .wenl-datos { flex:1; min-width:120px; }
        .wenl-nombre { font-size:15px; font-weight:600; color:#1f2937; }
        .wenl-enlace { font-size:12px; color:#6b7280; word-break:break-all; }
        .wenl-acciones { display:flex; gap:8px; flex-shrink:0; }
        .wenl-bcopiar { background:#f3f4f6; border:1px solid #d1d5db; color:#374151; border-radius:8px; padding:8px 12px; font-size:13px; cursor:pointer; white-space:nowrap; }
        .wenl-bwa { background:#25d366; border:none; color:#fff; border-radius:8px; padding:8px 12px; font-size:13px; cursor:pointer; white-space:nowrap; font-weight:600; }
        .wenl-bwa.sin-tel { background:#9ca3af; }
        .wenl-vacio { text-align:center; color:#9ca3af; padding:30px; }
    `;
    document.head.appendChild(st);
})();

registrarSubTab('planificador', 'enlaces-wellness', function() {
    cargarEnlacesWellness();
});

function wenlIniciales(nombre) {
    const partes = (nombre || '?').trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function wenlMensajeWhatsApp(nombre, enlace) {
    return encodeURIComponent('Hola ' + nombre + ' 👋\nEste es tu enlace personal para rellenar tu wellness antes de cada entrenamiento. Guárdalo en tu móvil:\n\n' + enlace + '\n\nÁbrelo cada mañana de día de sesión. ¡Gracias!');
}

async function cargarEnlacesWellness() {
    const cont = document.getElementById('enlaces-wellness-contenido');
    if (!cont) return;
    cont.innerHTML = '<div class="wenl-vacio">Cargando jugadores...</div>';

    try {
        const { data: clubInfo } = await supabaseClient
            .from('clubs').select('id').eq('wp_user_id', usuario.id).single();
        if (!clubInfo) throw new Error('Club no encontrado');

        // 1. Temporada activa del club
        const { data: temporada, error: errTemp } = await supabaseClient
            .from('seasons')
            .select('id, name')
            .eq('club_id', clubInfo.id)
            .eq('is_active', true)
            .single();

        if (errTemp || !temporada) {
            cont.innerHTML = '<div class="wenl-vacio">No hay ninguna temporada activa.<br>Activa una en Mi Club → Temporadas.</div>';
            return;
        }

        // 2. Jugadores de la plantilla de esa temporada (igual que la pantalla Plantilla)
        const { data: plantilla, error } = await supabaseClient
            .from('season_players')
            .select('player_id, players(id, name, photo_url, phone, wellness_token)')
            .eq('season_id', temporada.id);

        if (error) throw error;

        const jugadores = (plantilla || [])
            .map(sp => sp.players)
            .filter(Boolean)
            .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));

        if (jugadores.length === 0) {
            cont.innerHTML = '<div class="wenl-vacio">No hay jugadores en la plantilla de la temporada <strong>' + temporada.name + '</strong>.<br>Añádelos en Mi Club → Plantilla.</div>';
            return;
        }

        // Auto-arreglo: generar token a los jugadores que no lo tengan
        const sinToken = jugadores.filter(j => !j.wellness_token);
        for (const j of sinToken) {
            const nuevo = Array.from(crypto.getRandomValues(new Uint8Array(9))).map(b => b.toString(16).padStart(2, '0')).join('');
            const { error: errT } = await supabaseClient.from('players').update({ wellness_token: nuevo }).eq('id', j.id);
            if (!errT) j.wellness_token = nuevo;
        }

        let html = `
            <div class="wenl-cab">
                <h2>🔗 Enlaces de wellness<span class="wenl-temporada">${temporada.name}</span></h2>
                <button class="wenl-btn-todos" onclick="wenlCopiarTodos()">📋 Copiar todos los enlaces</button>
            </div>
            <div class="wenl-info">
                Cada jugador tiene un enlace personal y permanente. Mándaselo una vez por WhatsApp y lo usará cada mañana de entrenamiento. El enlace no caduca. Se muestran solo los jugadores de la plantilla de la temporada activa.
            </div>
            <div class="wenl-lista">
        `;

        window._wenlDatos = [];

        jugadores.forEach(j => {
            const enlace = WELLNESS_BASE_URL + '?j=' + j.wellness_token;
            const enlaceRpe = RPE_BASE_URL + '?j=' + j.wellness_token;
            window._wenlDatos.push({ nombre: j.name, enlace: enlace, enlaceRpe: enlaceRpe });

            const foto = j.photo_url
                ? `<img src="${j.photo_url}" class="wenl-foto" alt="">`
                : `<div class="wenl-foto-ph">${wenlIniciales(j.name)}</div>`;

            const tieneTel = j.phone && j.phone.trim().length > 0;
            const telLimpio = tieneTel ? j.phone.replace(/[^0-9]/g, '') : '';
            const waUrl = tieneTel
                ? `https://wa.me/${telLimpio}?text=${wenlMensajeWhatsApp(j.name, enlace)}`
                : `https://wa.me/?text=${wenlMensajeWhatsApp(j.name, enlace)}`;
            const waUrlRpe = tieneTel
                ? `https://wa.me/${telLimpio}?text=${encodeURIComponent('Hola ' + j.name + ' 👋\nEste es tu enlace personal para valorar tu esfuerzo (RPE) después de cada entrenamiento. Guárdalo en tu móvil:\n\n' + enlaceRpe + '\n\nÁbrelo al terminar cada sesión. ¡Gracias!')}`
                : `https://wa.me/?text=${encodeURIComponent('Hola ' + j.name + ' 👋\nEste es tu enlace personal para valorar tu esfuerzo (RPE) después de cada entrenamiento. Guárdalo en tu móvil:\n\n' + enlaceRpe + '\n\nÁbrelo al terminar cada sesión. ¡Gracias!')}`;

            html += `
                <div class="wenl-row">
                    ${foto}
                    <div class="wenl-datos">
                        <div class="wenl-nombre">${j.name}</div>
                        <div class="wenl-enlace">${enlace}</div>
                    </div>
                    <div class="wenl-acciones" style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
                        <div style="display:flex;gap:6px;align-items:center">
                            <span style="font-size:10px;color:#6b7280;font-weight:700">🌅 WELLNESS</span>
                            <button class="wenl-bcopiar" onclick="wenlCopiar('${enlace}', this)">📋 Copiar</button>
                            <a href="${waUrl}" target="_blank" class="wenl-bwa ${tieneTel ? '' : 'sin-tel'}" title="${tieneTel ? 'Enviar por WhatsApp' : 'Sin teléfono: se abre WhatsApp para elegir contacto'}">📱 WhatsApp</a>
                        </div>
                        <div style="display:flex;gap:6px;align-items:center">
                            <span style="font-size:10px;color:#6b7280;font-weight:700">🏃 RPE</span>
                            <button class="wenl-bcopiar" onclick="wenlCopiar('${enlaceRpe}', this)">📋 Copiar</button>
                            <a href="${waUrlRpe}" target="_blank" class="wenl-bwa ${tieneTel ? '' : 'sin-tel'}" title="${tieneTel ? 'Enviar por WhatsApp' : 'Sin teléfono: se abre WhatsApp para elegir contacto'}">📱 WhatsApp</a>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        cont.innerHTML = html;

    } catch (e) {
        console.error('Error cargando enlaces wellness:', e);
        cont.innerHTML = '<div class="wenl-vacio">Error al cargar: ' + e.message + '</div>';
    }
}

function wenlCopiar(enlace, btn) {
    navigator.clipboard.writeText(enlace).then(() => {
        const txt = btn.textContent;
        btn.textContent = '✓ Copiado';
        setTimeout(() => { btn.textContent = txt; }, 1500);
    }).catch(() => {
        showToast('No se pudo copiar');
    });
}

function wenlCopiarTodos() {
    if (!window._wenlDatos || window._wenlDatos.length === 0) return;
    const texto = window._wenlDatos.map(d => d.nombre + '\n  Wellness: ' + d.enlace + '\n  RPE: ' + (d.enlaceRpe || '')).join('\n');
    navigator.clipboard.writeText(texto).then(() => {
        showToast('Todos los enlaces copiados (' + window._wenlDatos.length + ' jugadores)');
    }).catch(() => {
        showToast('No se pudo copiar');
    });
}
