// ============================================================
// EJ-FAVORITOS.JS — Favoritos en la biblioteca de ejercicios TopLiderCoach (planificador)
// Estrella en cada tarjeta para marcar/desmarcar y una pestaña "⭐ Favoritos" con los guardados.
// Se guardan por entrenador en Supabase (tabla ejercicios_favoritos, RLS por identidad WP).
// Cargar DESPUÉS de planificador.js. No modifica planificador.js: observa la lista y añade la estrella.
// ============================================================
(function () {
    'use strict';
    var F = { map: null, cargando: null };
    var CSS = ''
        + '.ejercicio-card{position:relative}'
        + '.ejf-star{position:absolute;top:6px;right:8px;background:none;border:none;font-size:18px;line-height:1;cursor:pointer;color:#cbd5e1;padding:2px 4px;border-radius:6px;transition:transform .12s,color .12s;z-index:2}'
        + '.ejf-star:hover{transform:scale(1.2);color:#f59e0b}'
        + '.ejf-star.on{color:#f59e0b;text-shadow:0 0 6px rgba(245,158,11,.5)}'
        + '.ejercicio-card .btn-agregar{margin-top:14px}'
        + '.ejf-vacio{text-align:center;color:#9ca3af;font-size:13px;padding:24px 10px;line-height:1.6}'
        + '.ejf-vacio b{color:#f59e0b;font-size:18px}';
    function css() { if (!document.getElementById('ejf-css')) { var s = document.createElement('style'); s.id = 'ejf-css'; s.textContent = CSS; document.head.appendChild(s); } }
    function esc(t) { return String(t === null || t === undefined ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function coachId() { return (typeof usuario !== 'undefined' && usuario && usuario.id) ? String(usuario.id) : null; }

    /* ---------- Datos ---------- */
    function cargar() {
        if (F.map) return Promise.resolve(F.map);
        if (F.cargando) return F.cargando;
        F.cargando = supabaseClient.from('ejercicios_favoritos').select('*').order('created_at', { ascending: false })
            .then(function (r) { F.map = {}; (r.data || []).forEach(function (x) { F.map[String(x.ej_id)] = x; }); F.cargando = null; return F.map; })
            .catch(function () { F.map = {}; F.cargando = null; return F.map; });
        return F.cargando;
    }
    function esFav(id) { return !!(F.map && F.map[String(id)]); }
    async function marcar(ej) {
        var cid = coachId(); if (!cid) { showToast('Inicia sesión para guardar favoritos'); return false; }
        var fila = { coach_id: cid, ej_id: parseInt(ej.id, 10), titulo: ej.titulo || '', imagen: ej.imagen || '', tema: ej.tema || '', dificultad: ej.dificultad || '', num_jugadores: ej.num_jugadores || '' };
        var r = await supabaseClient.from('ejercicios_favoritos').upsert(fila, { onConflict: 'coach_id,ej_id' }).select().single();
        if (r.error) { showToast('No se pudo guardar: ' + r.error.message); return false; }
        F.map[String(ej.id)] = r.data; return true;
    }
    async function quitar(id) {
        var r = await supabaseClient.from('ejercicios_favoritos').delete().eq('ej_id', parseInt(id, 10));
        if (r.error) { showToast('No se pudo quitar: ' + r.error.message); return false; }
        delete F.map[String(id)]; return true;
    }

    /* ---------- Estrella en las tarjetas de la biblioteca ---------- */
    function datosDeTarjeta(card) {
        var btn = card.querySelector('.btn-agregar[data-ejercicio]'); if (!btn) return null;
        var d; try { d = JSON.parse(btn.getAttribute('data-ejercicio')); } catch (e) { return null; }
        if (!d || !/^\d+$/.test(String(d.id))) return null; // solo ejercicios TopLiderCoach (id numérico)
        var tags = Array.prototype.map.call(card.querySelectorAll('.tag'), function (t) { return t.textContent.trim(); });
        d.tema = tags.filter(function (t) { return !/^Dif:/.test(t) && !/^👥/.test(t); }).join(', ');
        var dif = tags.filter(function (t) { return /^Dif:/.test(t); })[0]; d.dificultad = dif ? dif.replace('Dif:', '').trim() : '';
        var nj = tags.filter(function (t) { return /^👥/.test(t); })[0]; d.num_jugadores = nj ? nj.replace('👥', '').trim() : '';
        var img = card.querySelector('img'); if (img && !d.imagen) d.imagen = img.src;
        return d;
    }
    function decorar() {
        var lista = document.getElementById('lista-ejercicios'); if (!lista) return;
        var cards = lista.querySelectorAll('.ejercicio-card'); if (!cards.length) return;
        cargar().then(function () {
            Array.prototype.forEach.call(cards, function (card) {
                if (card.querySelector('.ejf-star')) return;
                var d = datosDeTarjeta(card); if (!d) return;
                var b = document.createElement('button'); b.className = 'ejf-star' + (esFav(d.id) ? ' on' : ''); b.type = 'button';
                b.title = esFav(d.id) ? 'Quitar de favoritos' : 'Marcar como favorito'; b.textContent = esFav(d.id) ? '★' : '☆';
                b.setAttribute('data-ej', JSON.stringify(d));
                b.onclick = function (e) { e.stopPropagation(); e.preventDefault(); ejfToggle(b); };
                card.appendChild(b);
            });
        });
    }
    window.ejfToggle = async function (b) {
        var d; try { d = JSON.parse(b.getAttribute('data-ej')); } catch (e) { return; }
        await cargar();
        b.disabled = true;
        var ok;
        if (esFav(d.id)) { ok = await quitar(d.id); if (ok) { b.classList.remove('on'); b.textContent = '☆'; b.title = 'Marcar como favorito'; showToast('Quitado de favoritos'); if (typeof bibliotecaFuente !== 'undefined' && bibliotecaFuente === 'fav') renderFavoritos(); } }
        else { ok = await marcar(d); if (ok) { b.classList.add('on'); b.textContent = '★'; b.title = 'Quitar de favoritos'; showToast('⭐ Guardado en favoritos'); } }
        b.disabled = false;
    };

    /* ---------- Pestaña Favoritos ---------- */
    function tarjeta(x) {
        var data = { id: x.ej_id, titulo: x.titulo, imagen: x.imagen, duracion: 10 };
        return '<div class="ejercicio-card" onclick="seleccionarEjercicio(\'' + x.ej_id + '\')">'
            + '<img src="' + esc(x.imagen || 'https://via.placeholder.com/80x60?text=Sin+img') + '" alt="">'
            + '<div class="info"><div class="titulo">' + esc(x.titulo) + '</div><div class="tags">'
            + (x.tema ? '<span class="tag">' + esc(x.tema) + '</span>' : '') + (x.dificultad ? '<span class="tag dificultad">Dif: ' + esc(x.dificultad) + '</span>' : '') + (x.num_jugadores ? '<span class="tag">👥 ' + esc(x.num_jugadores) + '</span>' : '')
            + '</div></div>'
            + '<button class="btn-agregar" data-ejercicio=\'' + JSON.stringify(data).replace(/'/g, '&#39;') + '\' onclick="event.stopPropagation(); agregarEjercicioDesdeBoton(this)">+ Anadir</button>'
            + '</div>';
    }
    async function renderFavoritos() {
        var lista = document.getElementById('lista-ejercicios'), pag = document.getElementById('paginacion-ejercicios'); if (!lista) return;
        lista.innerHTML = '<div class="loading">Cargando favoritos...</div>'; if (pag) pag.innerHTML = '';
        F.map = null; await cargar();
        var favs = Object.keys(F.map).map(function (k) { return F.map[k]; }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
        if (!favs.length) { lista.innerHTML = '<div class="ejf-vacio"><b>☆</b><br>Todavía no tienes favoritos.<br>Pulsa la estrella de cualquier ejercicio de la biblioteca TopLiderCoach para guardarlo aquí.</div>'; return; }
        lista.innerHTML = '<div style="font-size:11px;color:#9ca3af;margin:0 0 8px">' + favs.length + ' favorito' + (favs.length === 1 ? '' : 's') + ' · los más recientes arriba</div>' + favs.map(tarjeta).join('');
        decorar();
    }
    var origCambiar = window.cambiarFuenteBiblioteca;
    window.cambiarFuenteBiblioteca = function (fuente, btn) {
        if (fuente !== 'fav') return origCambiar(fuente, btn);
        bibliotecaFuente = 'fav';
        document.querySelectorAll('.bib-tab').forEach(function (b) { b.style.background = 'transparent'; b.style.color = '#7c3aed'; b.classList.remove('active'); });
        btn.style.background = '#7c3aed'; btn.style.color = 'white'; btn.classList.add('active');
        ['filtros-toggle', 'filtros-biblioteca', 'filtros-mis-ejercicios'].forEach(function (id) { var e = document.getElementById(id); if (e) e.style.display = 'none'; });
        renderFavoritos();
    };

    /* ---------- Arranque ---------- */
    function init() {
        css();
        var tabMis = document.getElementById('bib-tab-mis');
        if (tabMis && !document.getElementById('bib-tab-fav')) {
            var b = document.createElement('button'); b.className = 'bib-tab'; b.id = 'bib-tab-fav'; b.textContent = '⭐ Favoritos';
            b.setAttribute('style', tabMis.getAttribute('style')); b.onclick = function () { cambiarFuenteBiblioteca('fav', b); };
            tabMis.parentNode.appendChild(b);
        }
        var lista = document.getElementById('lista-ejercicios');
        if (lista) { new MutationObserver(function () { decorar(); }).observe(lista, { childList: true }); decorar(); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
