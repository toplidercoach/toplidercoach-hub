// ============================================================
// CM-NOTIFICATIONS.JS · Sistema de avisos internos
// TopLiderCoach HUB · Club Mode
// ============================================================
// Campanita en el header con contador de no leidos
// Se auto-monta cuando Club Mode esta activo
// ============================================================

var cmNotifInterval = null;
var cmNotifOpen = false;
var cmNotifCount = 0;

// ========== AUTO-MONTAJE DE LA CAMPANITA ==========
(function cmNotifAutoMontar() {
    var intentos = 0;
    var intervalo = setInterval(function() {
        intentos++;
        if (intentos > 30) { clearInterval(intervalo); return; }
        if (typeof cmState === 'undefined' || !cmState.activo) return;
        clearInterval(intervalo);

        // Crear campanita en el header
        cmNotifCrearUI();

        // Primera carga
        cmNotifCargar();

        // Polling cada 30 segundos
        cmNotifInterval = setInterval(cmNotifCargar, 30000);

        console.log('[Notificaciones] Sistema de avisos montado');
    }, 600);
})();


function cmNotifCrearUI() {
    // Buscar el header donde insertar la campanita
    var header = document.querySelector('.header-right') ||
                 document.querySelector('.user-section') ||
                 document.getElementById('club-badge');

    if (!header) {
        // Buscar el boton Salir como referencia
        var salirBtn = document.querySelector('button[onclick*="logout"]') ||
                       document.querySelector('.logout-btn');
        if (salirBtn && salirBtn.parentElement) {
            header = salirBtn.parentElement;
        }
    }

    if (!header) {
        console.warn('[Notificaciones] No se encontro header para montar campanita');
        return;
    }

    // No duplicar
    if (document.getElementById('cm-notif-bell')) return;

    // Inyectar estilos
    var style = document.createElement('style');
    style.textContent =
        '#cm-notif-bell{position:relative;cursor:pointer;padding:6px 10px;border-radius:8px;transition:background .2s;display:inline-flex;align-items:center}' +
        '#cm-notif-bell:hover{background:rgba(59,130,246,0.15)}' +
        '#cm-notif-bell .bell-icon{font-size:20px}' +
        '#cm-notif-badge{position:absolute;top:2px;right:4px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px}' +
        '#cm-notif-badge.hidden{display:none}' +
        '#cm-notif-panel{position:absolute;top:100%;right:0;width:360px;max-height:440px;background:#0f172a;border:1px solid #334155;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.5);z-index:9999;overflow:hidden;display:none}' +
        '#cm-notif-panel.open{display:block}' +
        '.cm-notif-header{padding:14px 16px;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center}' +
        '.cm-notif-header h4{margin:0;color:#e2e8f0;font-size:14px}' +
        '.cm-notif-mark-all{background:none;border:none;color:#3b82f6;font-size:12px;cursor:pointer;padding:4px 8px;border-radius:4px}' +
        '.cm-notif-mark-all:hover{background:rgba(59,130,246,0.15)}' +
        '.cm-notif-list{overflow-y:auto;max-height:380px}' +
        '.cm-notif-item{padding:12px 16px;border-bottom:1px solid #1e293b;cursor:pointer;transition:background .15s;display:flex;gap:10px;align-items:flex-start}' +
        '.cm-notif-item:hover{background:#1e293b}' +
        '.cm-notif-item.unread{background:rgba(59,130,246,0.05);border-left:3px solid #3b82f6}' +
        '.cm-notif-item.read{opacity:0.6}' +
        '.cm-notif-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}' +
        '.cm-notif-icon.injury{background:#450a0a;color:#fca5a5}' +
        '.cm-notif-icon.discharge{background:#052e16;color:#86efac}' +
        '.cm-notif-icon.semaphore{background:#451a03;color:#fcd34d}' +
        '.cm-notif-icon.bell{background:#1e293b;color:#94a3b8}' +
        '.cm-notif-content{flex:1;min-width:0}' +
        '.cm-notif-title{color:#e2e8f0;font-size:13px;font-weight:500}' +
        '.cm-notif-msg{color:#94a3b8;font-size:12px;margin-top:2px}' +
        '.cm-notif-time{color:#64748b;font-size:11px;margin-top:3px}' +
        '.cm-notif-empty{padding:40px 20px;text-align:center;color:#64748b;font-size:13px}';
    document.head.appendChild(style);

    // Crear el contenedor de la campanita
    var bellContainer = document.createElement('div');
    bellContainer.id = 'cm-notif-bell';
    bellContainer.style.cssText = 'position:relative;display:inline-flex;margin-right:8px;';
    bellContainer.onclick = function(e) {
        e.stopPropagation();
        cmNotifTogglePanel();
    };
    bellContainer.innerHTML =
        '<span class="bell-icon">&#128276;</span>' +
        '<span id="cm-notif-badge" class="hidden">0</span>' +
        '<div id="cm-notif-panel">' +
            '<div class="cm-notif-header">' +
                '<h4>Notificaciones</h4>' +
                '<button class="cm-notif-mark-all" onclick="event.stopPropagation();cmNotifMarcarTodas()">Marcar todas leidas</button>' +
            '</div>' +
            '<div class="cm-notif-list" id="cm-notif-list"></div>' +
        '</div>';

    // Insertar antes del primer hijo del header (o antes del boton Salir)
    var salirBtn = document.querySelector('button[onclick*="logout"]') ||
                   document.querySelector('.logout-btn') ||
                   document.getElementById('btn-salir');
    if (salirBtn && salirBtn.parentElement) {
        salirBtn.parentElement.insertBefore(bellContainer, salirBtn);
    } else if (header) {
        header.appendChild(bellContainer);
    }

    // Cerrar panel al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (cmNotifOpen && !bellContainer.contains(e.target)) {
            cmNotifCerrarPanel();
        }
    });
}


function cmNotifTogglePanel() {
    var panel = document.getElementById('cm-notif-panel');
    if (!panel) return;
    cmNotifOpen = !cmNotifOpen;
    panel.classList.toggle('open', cmNotifOpen);
    if (cmNotifOpen) cmNotifCargar();
}

function cmNotifCerrarPanel() {
    var panel = document.getElementById('cm-notif-panel');
    if (panel) panel.classList.remove('open');
    cmNotifOpen = false;
}


async function cmNotifCargar() {
    if (!clubId || !usuario) return;

    // Cargar ultimas 20 notificaciones que el usuario puede ver
    // Filtrar por permisos del usuario actual
    var permisosUsuario = [];
    if (typeof cmState !== 'undefined' && cmState.permisos) {
        Object.keys(cmState.permisos).forEach(function(k) {
            if (cmState.permisos[k] && cmState.permisos[k].ver) permisosUsuario.push(k);
        });
    }
    // Admin ve todo
    if (typeof cmState !== 'undefined' && cmState.esAdmin) {
        permisosUsuario = ['entrenamientos', 'asistencia', 'modulo_medico', 'matchstats', 'pizarra', 'periodizacion', 'analisis_postpartido', 'cuerpo_tecnico_ia'];
    }

    if (permisosUsuario.length === 0) return;

    var notifRes = await supabaseClient.from('cm_notifications')
        .select('*')
        .eq('club_id', clubId)
        .in('target_permission', permisosUsuario)
        .order('created_at', { ascending: false })
        .limit(20);

    var notifications = notifRes.data || [];

    // Cargar estados de lectura del usuario actual
    var readRes = await supabaseClient.from('cm_notification_reads')
        .select('notification_id')
        .eq('wp_user_id', usuario.id);

    var readIds = {};
    (readRes.data || []).forEach(function(r) { readIds[r.notification_id] = true; });

    // Contar no leidas
    var unread = notifications.filter(function(n) { return !readIds[n.id]; }).length;
    cmNotifCount = unread;

    // Actualizar badge
    var badge = document.getElementById('cm-notif-badge');
    if (badge) {
        badge.textContent = unread > 9 ? '9+' : unread;
        badge.classList.toggle('hidden', unread === 0);
    }

    // Renderizar lista si el panel esta abierto
    if (cmNotifOpen) {
        var list = document.getElementById('cm-notif-list');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = '<div class="cm-notif-empty">Sin notificaciones</div>';
            return;
        }

        var html = '';
        notifications.forEach(function(n) {
            var isRead = readIds[n.id];
            var iconClass = n.icon || 'bell';
            var iconEmoji = iconClass === 'injury' ? '🔴' : iconClass === 'check' ? '✅' : iconClass === 'semaphore' ? '🟡' : '🔔';
            var timeAgo = cmNotifTiempoRelativo(n.created_at);

            html +=
                '<div class="cm-notif-item ' + (isRead ? 'read' : 'unread') + '" onclick="cmNotifMarcarLeida(\'' + n.id + '\', this)">' +
                    '<div class="cm-notif-icon ' + iconClass + '">' + iconEmoji + '</div>' +
                    '<div class="cm-notif-content">' +
                        '<div class="cm-notif-title">' + n.title + '</div>' +
                        (n.message ? '<div class="cm-notif-msg">' + n.message + '</div>' : '') +
                        '<div class="cm-notif-time">' + timeAgo + '</div>' +
                    '</div>' +
                '</div>';
        });

        list.innerHTML = html;
    }
}


async function cmNotifMarcarLeida(notifId, element) {
    if (!usuario) return;

    await supabaseClient.from('cm_notification_reads').upsert({
        notification_id: notifId,
        wp_user_id: usuario.id
    }, { onConflict: 'notification_id,wp_user_id' });

    if (element) {
        element.classList.remove('unread');
        element.classList.add('read');
    }

    // Actualizar contador
    cmNotifCount = Math.max(0, cmNotifCount - 1);
    var badge = document.getElementById('cm-notif-badge');
    if (badge) {
        badge.textContent = cmNotifCount > 9 ? '9+' : cmNotifCount;
        badge.classList.toggle('hidden', cmNotifCount === 0);
    }
}


async function cmNotifMarcarTodas() {
    if (!usuario) return;

    // Obtener IDs de notificaciones no leidas
    var notifRes = await supabaseClient.from('cm_notifications')
        .select('id').eq('club_id', clubId).order('created_at', { ascending: false }).limit(20);

    var notifs = notifRes.data || [];
    if (notifs.length === 0) return;

    var inserts = notifs.map(function(n) {
        return { notification_id: n.id, wp_user_id: usuario.id };
    });

    await supabaseClient.from('cm_notification_reads').upsert(inserts, { onConflict: 'notification_id,wp_user_id' });

    // Actualizar UI
    cmNotifCount = 0;
    var badge = document.getElementById('cm-notif-badge');
    if (badge) { badge.textContent = '0'; badge.classList.add('hidden'); }

    document.querySelectorAll('.cm-notif-item.unread').forEach(function(el) {
        el.classList.remove('unread');
        el.classList.add('read');
    });

    showToast('Todas las notificaciones marcadas como leidas');
}


function cmNotifTiempoRelativo(dateStr) {
    var now = new Date();
    var date = new Date(dateStr);
    var diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Ahora mismo';
    if (diff < 3600) return Math.floor(diff / 60) + ' min';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    return date.toLocaleDateString('es-ES');
}

console.log('[Notificaciones] cm-notifications.js cargado');
