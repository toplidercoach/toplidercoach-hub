// ========== MODO-CLUB-PROMO.JS - TopLiderCoach HUB (v2) ==========
// Escaparate del Modo Club en PRODUCCION: una sola pestana desplegable
// "Modo Club PRO" con todos los modulos dentro; al tocar cualquiera se
// abre el modal invitando a contactar.
// En staging y en local NO hace nada (el Club Mode real sigue funcionando).

(function() {
    var host = window.location.hostname;
    var esProduccion = (host === 'toplidercoach.com' || host === 'www.toplidercoach.com' || host === 'toplidercoach.github.io');
    if (!esProduccion) return; // en staging/local, fuera

    // Modulos del escaparate, agrupados como la arquitectura real del Modo Club.
    // Los modulos futuros se anaden aqui con una linea.
    var GRUPOS_PROMO = [
        {
            titulo: 'El club',
            items: [
                { icono: '&#127963;', nombre: 'Club (miembros y roles)' }
            ]
        },
        {
            titulo: 'Campo',
            items: [
                { icono: '&#129658;', nombre: 'M&eacute;dico' },
                { icono: '&#129657;', nombre: 'Fisio' },
                { icono: '&#127939;', nombre: 'Prep. F&iacute;sica' },
                { icono: '&#128230;', nombre: 'Utillero' },
                { icono: '&#128270;', nombre: 'Scouting' }
            ]
        },
        {
            titulo: 'Oficina',
            items: [
                { icono: '&#127913;', nombre: 'Dir. Deportiva' },
                { icono: '&#128182;', nombre: 'Pagos y cuotas' },
                { icono: '&#128106;', nombre: 'Familias' },
                { icono: '&#128202;', nombre: 'Econ&oacute;mico' },
                { icono: '&#129309;', nombre: 'Patrocinadores' },
                { icono: '&#128737;', nombre: 'Control RFEF' }
            ]
        }
    ];

    var btnPromo = null;
    var panelPromo = null;

    function inyectarEstilos() {
        if (document.getElementById('mcp-styles')) return;
        var st = document.createElement('style');
        st.id = 'mcp-styles';
        st.textContent =
            '.mcp-panel{display:none;position:fixed;min-width:250px;background:#1e293b;border:1px solid #334155;border-radius:0 0 10px 10px;box-shadow:0 10px 25px rgba(0,0,0,.45);z-index:9500;padding:8px;flex-direction:column}' +
            '.mcp-panel.open{display:flex}' +
            '.mcp-grupo-titulo{font-size:10px;font-weight:700;letter-spacing:.08em;color:#64748b;text-transform:uppercase;padding:8px 10px 4px}' +
            '.mcp-item{display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:#e2e8f0;font-size:13px;font-weight:600;padding:8px 10px;border-radius:6px;cursor:pointer;text-align:left}' +
            '.mcp-item:hover{background:#334155}' +
            '.mcp-badge{font-size:9px;background:#f59e0b;color:#1f2937;border-radius:4px;padding:1px 4px;font-weight:700;margin-left:auto}';
        document.head.appendChild(st);
    }

    function posicionarPanel() {
        if (!btnPromo || !panelPromo) return;
        var r = btnPromo.getBoundingClientRect();
        panelPromo.style.top = r.bottom + 'px';
        var left = r.left;
        var ancho = Math.max(250, panelPromo.offsetWidth || 250);
        if (left + ancho > window.innerWidth - 8) left = window.innerWidth - ancho - 8;
        panelPromo.style.left = Math.max(8, left) + 'px';
    }

    function cerrarPanel() {
        if (panelPromo) panelPromo.classList.remove('open');
    }

    function insertarPestana() {
        var barra = document.querySelector('.main-tabs');
        if (!barra) return;
        // Evitar duplicados si se llama dos veces
        if (document.getElementById('mcp-tab-promo')) return;
        // Si el usuario YA es de un club real (Club Mode activo), no mostrar promo
        if (typeof cmEsClubMode === 'function' && cmEsClubMode()) return;
        if (typeof cmState !== 'undefined' && cmState && cmState.activo) return;

        inyectarEstilos();

        // Boton unico en la barra
        btnPromo = document.createElement('button');
        btnPromo.className = 'main-tab mcp-tab';
        btnPromo.id = 'mcp-tab-promo';
        btnPromo.type = 'button';
        btnPromo.innerHTML = '&#10024; Modo Club <span style="font-size:9px;background:#f59e0b;color:#1f2937;border-radius:4px;padding:1px 4px;vertical-align:middle;font-weight:700;">PRO</span> <span style="font-size:9px;opacity:.7">&#9660;</span>';
        btnPromo.addEventListener('click', function(e) {
            e.stopPropagation();
            var estaba = panelPromo.classList.contains('open');
            cerrarPanel();
            if (!estaba) {
                panelPromo.classList.add('open');
                posicionarPanel();
            }
        });
        barra.appendChild(btnPromo);

        // Panel colgado del body (posicion fija: inmune al scroll de la barra)
        panelPromo = document.createElement('div');
        panelPromo.className = 'mcp-panel';
        panelPromo.addEventListener('click', function(e) { e.stopPropagation(); });
        var h = '';
        GRUPOS_PROMO.forEach(function(g) {
            h += '<div class="mcp-grupo-titulo">' + g.titulo + '</div>';
            g.items.forEach(function(p) {
                h += '<button type="button" class="mcp-item" onclick="abrirModalModoClub()">' +
                     '<span>' + p.icono + '</span><span>' + p.nombre + '</span>' +
                     '<span class="mcp-badge">PRO</span></button>';
            });
        });
        panelPromo.innerHTML = h;
        panelPromo.querySelectorAll('.mcp-item').forEach(function(b) {
            b.addEventListener('click', cerrarPanel);
        });
        document.body.appendChild(panelPromo);

        document.addEventListener('click', cerrarPanel);
        window.addEventListener('resize', cerrarPanel);
        window.addEventListener('scroll', cerrarPanel, true);
    }

    window.abrirModalModoClub = function() {
        var existente = document.getElementById('mcp-modal-ov');
        if (existente) existente.remove();

        var ov = document.createElement('div');
        ov.id = 'mcp-modal-ov';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9600;padding:20px;';
        ov.onclick = function(e) { if (e.target === ov) ov.remove(); };
        ov.innerHTML =
            '<div style="background:#fff;border-radius:16px;max-width:440px;width:100%;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
                '<div style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:26px 24px;text-align:center;">' +
                    '<div style="font-size:40px;margin-bottom:8px;">&#127963;</div>' +
                    '<div style="color:#fff;font-size:20px;font-weight:800;">Modo Club</div>' +
                    '<div style="color:#f59e0b;font-size:12px;font-weight:700;letter-spacing:0.08em;margin-top:4px;">LA PLATAFORMA COMPLETA PARA CLUBES</div>' +
                '</div>' +
                '<div style="padding:22px 24px;text-align:center;">' +
                    '<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">Esta secci&oacute;n pertenece al <strong>Modo Club</strong>: gesti&oacute;n m&eacute;dica, fisioterapia, preparaci&oacute;n f&iacute;sica, utiller&iacute;a, scouting, direcci&oacute;n deportiva, pagos, econom&iacute;a y mucho m&aacute;s, con un espacio privado para cada miembro del cuerpo t&eacute;cnico.</p>' +
                    '<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 18px;">Si tu club est&aacute; interesado en acceder, <strong>ponte en contacto con nosotros</strong>.</p>' +
                    '<a href="mailto:administracion@toplidercoach.com?subject=Interesados%20en%20el%20Modo%20Club" style="display:inline-block;background:#f59e0b;color:#1f2937;font-weight:800;text-decoration:none;border-radius:10px;padding:13px 26px;font-size:15px;">&#9993; Contactar</a>' +
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
            setTimeout(insertarPestana, 1200);
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
