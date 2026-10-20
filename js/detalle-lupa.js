// ============================================================
// DETALLE-LUPA.JS — Lupa en la miniatura del panel "Detalles" del planificador
// Al pasar el raton sale una lupa; al pulsar, la imagen se abre a pantalla completa
// (Esc o clic fuera para cerrar). No toca planificador.js: escucha los clics del panel.
// ============================================================
(function () {
    'use strict';
    var CSS = ''
        + '#detalle-ejercicio img{cursor:zoom-in;transition:transform .15s}'
        + '#detalle-ejercicio img:hover{transform:scale(1.02)}'
        + '#detalle-ejercicio .dl-wrap{position:relative;display:block;margin-bottom:10px}'
        + '#detalle-ejercicio .dl-wrap img{margin-bottom:0}'
        + '#detalle-ejercicio .dl-wrap .dl-lupa{position:absolute;right:8px;bottom:8px;width:30px;height:30px;border-radius:50%;background:rgba(15,23,42,.75);color:#fff;display:grid;place-items:center;font-size:15px;pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,.3)}'
        + '#dl-visor{position:fixed;inset:0;z-index:999999;background:rgba(3,7,18,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;cursor:zoom-out}'
        + '#dl-visor img{max-width:96vw;max-height:86vh;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.6);background:#fff}'
        + '#dl-visor .t{color:#e2e8f0;font-size:16px;font-weight:700;text-align:center}'
        + '#dl-visor .x{position:absolute;top:14px;right:18px;background:#1e293b;border:1px solid #334155;color:#fff;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:14px}';
    function css() { if (!document.getElementById('dl-css')) { var s = document.createElement('style'); s.id = 'dl-css'; s.textContent = CSS; document.head.appendChild(s); } }
    function abrir(src, titulo) {
        var prev = document.getElementById('dl-visor'); if (prev) prev.remove();
        var v = document.createElement('div'); v.id = 'dl-visor';
        v.innerHTML = '<button class="x">✕ Cerrar (Esc)</button><img src="' + src + '" alt="">' + (titulo ? '<div class="t">' + titulo.replace(/</g, '&lt;') + '</div>' : '');
        v.onclick = function () { v.remove(); document.removeEventListener('keydown', tecla); };
        document.body.appendChild(v);
        document.addEventListener('keydown', tecla);
    }
    function tecla(e) { if (e.key === 'Escape') { var v = document.getElementById('dl-visor'); if (v) v.remove(); document.removeEventListener('keydown', tecla); } }
    // Envolver la miniatura con la lupa cada vez que cambie el panel
    function decorar() {
        var d = document.getElementById('detalle-ejercicio'); if (!d) return;
        Array.prototype.forEach.call(d.querySelectorAll('img'), function (img) {
            if (img.parentNode && img.parentNode.classList && img.parentNode.classList.contains('dl-wrap')) return;
            if (img.width && img.width < 60) return; // iconos pequeños, no
            var w = document.createElement('span'); w.className = 'dl-wrap';
            img.parentNode.insertBefore(w, img); w.appendChild(img);
            var l = document.createElement('span'); l.className = 'dl-lupa'; l.textContent = '🔍'; w.appendChild(l);
        });
    }
    function init() {
        css();
        var d = document.getElementById('detalle-ejercicio'); if (!d) return;
        d.addEventListener('click', function (e) {
            var img = e.target && e.target.tagName === 'IMG' ? e.target : null; if (!img || (img.width && img.width < 60)) return;
            var h3 = d.querySelector('h3');
            abrir(img.src, h3 ? h3.textContent : (img.alt || ''));
        });
        new MutationObserver(decorar).observe(d, { childList: true, subtree: true });
        decorar();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
