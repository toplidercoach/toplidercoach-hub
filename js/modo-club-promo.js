// ========== MODO-CLUB-PROMO.JS - TopLiderCoach HUB ==========
// Escaparate del Modo Club en PRODUCCION: muestra las pestanas del club bloqueadas
// y al tocarlas abre un modal invitando a contactar.
// En staging y en local NO hace nada (el Club Mode real sigue funcionando).

(function() {
    var host = window.location.hostname;
    var esProduccion = (host === 'toplidercoach.com' || host === 'www.toplidercoach.com' || host === 'toplidercoach.github.io');
    if (!esProduccion) return; // en staging/local, fuera

    var PESTANAS_PROMO = [
        { icono: '🏛️', nombre: 'Club' },
        { icono: '🩺', nombre: 'Médico' },
        { icono: '🩹', nombre: 'Fisio' },
        { icono: '🏃', nombre: 'Prep. Física' },
        { icono: '🔎', nombre: 'Scouting' },
        { icono: '🎩', nombre: 'Dir. Deportiva' },
        { icono: '💶', nombre: 'Pagos' },
        { icono: '👨‍👩‍👧', nombre: 'Familias' }
    ];

    function insertarPestanas() {
        var barra = document.querySelector('.main-tabs');
        if (!barra) return;
        // Evitar duplicados si se llama dos veces
        if (document.querySelector('.mcp-tab')) return;
        // Si el usuario YA es de un club real (Club Mode activo), no mostrar promo
        if (typeof cmEsClubMode === 'function' && cmEsClubMode()) return;

        PESTANAS_PROMO.forEach(function(p) {
            var btn = document.createElement('button');
            btn.className = 'main-tab mcp-tab';
            btn.innerHTML = p.icono + ' ' + p.nombre + ' <span style="font-size:9px;background:#f59e0b;color:#1f2937;border-radius:4px;padding:1px 4px;vertical-align:middle;font-weight:700;">PRO</span>';
            btn.onclick = function() { abrirModalModoClub(); };
            barra.appendChild(btn);
        });
    }

    window.abrirModalModoClub = function() {
        var existente = document.getElementById('mcp-modal-ov');
        if (existente) existente.remove();

        var ov = document.createElement('div');
        ov.id = 'mcp-modal-ov';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:2000;padding:20px;';
        ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
        ov.innerHTML =
            '<div style="background:#fff;border-radius:16px;max-width:440px;width:100%;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
                '<div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:26px 24px;text-align:center;">' +
                    '<div style="font-size:40px;margin-bottom:8px;">🏛️</div>' +
                    '<div style="color:#fff;font-size:20px;font-weight:800;">Modo Club</div>' +
                    '<div style="color:#f59e0b;font-size:12px;font-weight:700;letter-spacing:0.08em;margin-top:4px;">LA PLATAFORMA COMPLETA PARA CLUBES</div>' +
                '</div>' +
                '<div style="padding:22px 24px;text-align:center;">' +
                    '<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">Esta sección pertenece al <strong>Modo Club</strong>: gestión médica, fisioterapia, preparación física, scouting, dirección deportiva, pagos y mucho más, con un espacio privado para cada miembro del cuerpo técnico.</p>' +
                    '<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 18px;">Si tu club está interesado en acceder, <strong>ponte en contacto con nosotros</strong>.</p>' +
                    '<a href="mailto:administracion@toplidercoach.com?subject=Interesados%20en%20el%20Modo%20Club" style="display:inline-block;background:#f59e0b;color:#1f2937;font-weight:800;text-decoration:none;border-radius:10px;padding:13px 26px;font-size:15px;">✉️ Contactar</a>' +
                    '<div style="margin-top:10px;font-size:12px;color:#9ca3af;">administracion@toplidercoach.com</div>' +
                '</div>' +
                '<button onclick="document.getElementById(\'mcp-modal-ov\').remove()" style="position:absolute;top:14px;right:18px;background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;">&times;</button>' +
            '</div>';
        document.body.appendChild(ov);
    };

    // Insertar cuando el HUB este cargado (esperar a que exista la barra y al posible Club Mode)
    function intentar(reintentos) {
        var barra = document.querySelector('.main-tabs');
        if (barra) {
            // Esperar un poco mas por si cm-core activa Club Mode real
            setTimeout(insertarPestanas, 1200);
        } else if (reintentos > 0) {
            setTimeout(function() { intentar(reintentos - 1); }, 500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { intentar(10); });
    } else {
        intentar(10);
    }
})();
