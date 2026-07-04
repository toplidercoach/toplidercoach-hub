// ============================================================
// CM-FISIO-CALENDARIO.JS · Calendario de citas v2
// TopLiderCoach HUB · Club Mode · Fase F.2
// ============================================================
// Carga DESPUES de cm-fisio.js y cm-fisio-extras.js
// Vistas: semanal, diaria, mensual. Filtros equipo/fisio. Print.
// ============================================================

var cmFisioCal = {
    semanaInicio: null, diaActual: null, mesActual: null, anioActual: null,
    citas: [], fisios: [], fisioSeleccionado: null, horario: null,
    vistaActiva: 'jugadores', vistaCalendario: 'semanal',
    filtroEquipo: 'all', horaInicio: 8, horaFin: 21, intervalo: 30,
    jugadoresMap: {}
};

var CMFCAL_COLORS = {
    treatment:   { bg: '#fecaca', border: '#ef4444', text: '#991b1b', label: 'Tratamiento' },
    preventive:  { bg: '#bbf7d0', border: '#22c55e', text: '#166534', label: 'Preventivo' },
    assessment:  { bg: '#bfdbfe', border: '#3b82f6', text: '#1e3a5f', label: 'Valoracion' },
    maintenance: { bg: '#fde68a', border: '#f59e0b', text: '#78350f', label: 'Mantenimiento' }
};
var CMFCAL_DIAS = ['mon','tue','wed','thu','fri','sat','sun'];
var CMFCAL_DIAS_LABEL = ['Lun','Mar','Mie','Jue','Vie','Sab','Dom'];



function cmFisioCalToggleVista() {
    if (cmFisioCal.vistaActiva === 'jugadores') {
        cmFisioCal.vistaActiva = 'calendario';
        document.getElementById('cmfisio-btn-calendario').textContent = 'Jugadores';
        document.getElementById('cmfisio-btn-calendario').className = 'cmfisio-btn cmfisio-btn-primary cmfisio-btn-sm';
        var sb = document.getElementById('cmfisio-stats-bar');
        var fc = document.getElementById('cmfisio-filter-count');
        if (sb) sb.style.display = 'none'; if (fc) fc.style.display = 'none';
        var grid = document.getElementById('cmfisio-player-grid');
        if (grid) grid.style.display = 'block';
        cmFisioCalInit();
    } else {
        cmFisioCal.vistaActiva = 'jugadores';
        document.getElementById('cmfisio-btn-calendario').textContent = 'Calendario';
        document.getElementById('cmfisio-btn-calendario').className = 'cmfisio-btn cmfisio-btn-secondary cmfisio-btn-sm';
        var sb = document.getElementById('cmfisio-stats-bar');
        var fc = document.getElementById('cmfisio-filter-count');
        if (sb) sb.style.display = ''; if (fc) fc.style.display = '';
        var grid = document.getElementById('cmfisio-player-grid');
        if (grid) grid.style.display = '';
        cmFisioCargarJugadores();
    }
}

async function cmFisioCalInit() {
    var hoy = new Date();
    if (!cmFisioCal.semanaInicio) {
        var dia = hoy.getDay(), diff = (dia === 0 ? -6 : 1 - dia);
        var l = new Date(hoy); l.setDate(hoy.getDate() + diff); l.setHours(0,0,0,0);
        cmFisioCal.semanaInicio = l;
    }
    if (!cmFisioCal.diaActual) cmFisioCal.diaActual = new Date(hoy);
    if (cmFisioCal.mesActual === null) cmFisioCal.mesActual = hoy.getMonth();
    if (cmFisioCal.anioActual === null) cmFisioCal.anioActual = hoy.getFullYear();
    var fRes = await supabaseClient.from('club_members').select('wp_user_id, display_name, club_roles(name)').eq('club_id', clubId).eq('active', true);
    cmFisioCal.fisios = (fRes.data || []).filter(function(m) {
        return m.club_roles && (m.club_roles.name.toLowerCase().indexOf('fisio') !== -1 || m.club_roles.name.toLowerCase().indexOf('physio') !== -1);
    });
    if (cmFisioCal.fisios.length === 0 && usuario) cmFisioCal.fisios = [{ wp_user_id: usuario.id, display_name: usuario.display_name || usuario.name || 'Yo' }];
    if (!cmFisioCal.fisioSeleccionado) cmFisioCal.fisioSeleccionado = usuario ? usuario.id : null;
    var sIds = cmFisioTemporadas.map(function(s) { return s.id; });
    if (sIds.length > 0) {
        var spRes = await supabaseClient.from('season_players').select('player_id, team_id, shirt_number, players(id, name)').in('season_id', sIds);
        cmFisioCal.jugadoresMap = {};
        (spRes.data || []).forEach(function(sp) { if (sp.players && !cmFisioCal.jugadoresMap[sp.players.id]) cmFisioCal.jugadoresMap[sp.players.id] = { name: sp.players.name, dorsal: sp.shirt_number || '', teamId: sp.team_id }; });
    }
    await cmFisioCalCargarHorario();
    cmFisioCalRenderVista();
}

async function cmFisioCalCargarHorario() {
    var h = new Date().toISOString().split('T')[0];
    var r = await supabaseClient.from('cm_fisio_working_hours').select('*').eq('club_id', clubId).eq('physio_wp_user_id', cmFisioCal.fisioSeleccionado).lte('effective_from', h).order('effective_from', { ascending: false }).limit(1);
    cmFisioCal.horario = (r.data && r.data.length > 0) ? r.data[0] : null;
}

function cmFisioCalRenderVista() {
    if (cmFisioCal.vistaCalendario === 'semanal') cmFisioCalRenderSemanal();
    else if (cmFisioCal.vistaCalendario === 'diaria') cmFisioCalRenderDiaria();
    else if (cmFisioCal.vistaCalendario === 'mensual') cmFisioCalRenderMensual();
}

function cmFisioCalCabecera(tit) {
    var fOpts = ''; cmFisioCal.fisios.forEach(function(f) { fOpts += '<option value="'+f.wp_user_id+'"'+(f.wp_user_id===cmFisioCal.fisioSeleccionado?' selected':'')+'>'+(f.display_name||'Fisio')+'</option>'; });
    var fSel = cmFisioCal.fisios.length > 1 ? '<select onchange="cmFisioCalCambiarFisio(parseInt(this.value))" style="background:#fff;border:1px solid #d1d5db;color:#1f2937;padding:5px 10px;border-radius:6px;font-size:12px">' + fOpts + '</select>' : '';
    var eOpts = '<option value="all">Todos</option>'; cmFisioEquipos.forEach(function(t) { eOpts += '<option value="'+t.id+'"'+(cmFisioCal.filtroEquipo===t.id?' selected':'')+'>'+t.name+'</option>'; });
    var vBtns = '<button class="cmfcal-vb'+(cmFisioCal.vistaCalendario==='diaria'?' ac':'')+'" onclick="cmFisioCal.vistaCalendario=\'diaria\';cmFisioCalRenderVista()">Dia</button>'+
        '<button class="cmfcal-vb'+(cmFisioCal.vistaCalendario==='semanal'?' ac':'')+'" onclick="cmFisioCal.vistaCalendario=\'semanal\';cmFisioCalRenderVista()">Semana</button>'+
        '<button class="cmfcal-vb'+(cmFisioCal.vistaCalendario==='mensual'?' ac':'')+'" onclick="cmFisioCal.vistaCalendario=\'mensual\';cmFisioCalRenderVista()">Mes</button>';
    return '<style>'+
        '.cmfcal-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px}'+
        '.cmfcal-nb{background:#fff;border:1px solid #d1d5db;color:#1f2937;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px}.cmfcal-nb:hover{border-color:#14b8a6;color:#14b8a6}'+
        '.cmfcal-t{color:#1f2937;font-weight:600;font-size:16px}'+
        '.cmfcal-vb{background:#f3f4f6;border:1px solid #d1d5db;color:#6b7280;padding:5px 12px;font-size:12px;cursor:pointer;border-radius:0;font-weight:600}'+
        '.cmfcal-vb:first-child{border-radius:6px 0 0 6px}.cmfcal-vb:last-child{border-radius:0 6px 6px 0}'+
        '.cmfcal-vb.ac{background:#14b8a6;color:#fff;border-color:#14b8a6}'+
        '.cmfcal-g{display:grid;grid-template-columns:56px repeat(7,1fr);border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;width:100%}'+
        '.cmfcal-gh{background:#f9fafb;padding:8px 4px;text-align:center;border-bottom:2px solid #e5e7eb;border-right:1px solid #f3f4f6}'+
        '.cmfcal-gh .d{color:#1f2937;font-weight:600;font-size:13px}.cmfcal-gh .n{color:#6b7280;font-size:11px}'+
        '.cmfcal-gh.hoy{background:#f0fdfa}.cmfcal-gh.hoy .d{color:#0d9488}'+
        '.cmfcal-tm{background:#fafafa;padding:2px 6px;font-size:10px;color:#9ca3af;text-align:right;border-bottom:1px solid #f3f4f6;border-right:1px solid #e5e7eb;height:26px;display:flex;align-items:flex-start;justify-content:flex-end}'+
        '.cmfcal-c{background:#fff;border-bottom:1px solid #f3f4f6;border-right:1px solid #f3f4f6;height:26px;position:relative;cursor:pointer}.cmfcal-c:hover{background:#f0fdfa}'+
        '.cmfcal-c.off{background:#f9fafb;cursor:default}.cmfcal-c.off:hover{background:#f9fafb}'+
        '.cmfcal-a{position:absolute;left:1px;right:1px;border-radius:3px;padding:1px 4px;font-size:10px;font-weight:600;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;cursor:pointer;z-index:2;border-left:3px solid}.cmfcal-a:hover{opacity:.85;z-index:5}'+
        '.cmfcal-dg{display:grid;grid-template-columns:56px 1fr;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;width:100%}'+
        '.cmfcal-dc{background:#fff;border-bottom:1px solid #f3f4f6;min-height:40px;position:relative;cursor:pointer;padding:2px 4px}.cmfcal-dc:hover{background:#f0fdfa}.cmfcal-dc.off{background:#f9fafb;cursor:default}'+
        '.cmfcal-da{background:#fff;border:1px solid #e5e7eb;border-left:4px solid;border-radius:6px;padding:6px 10px;margin:2px 0;font-size:12px;cursor:pointer}.cmfcal-da:hover{box-shadow:0 2px 8px rgba(0,0,0,.1)}'+
        '.cmfcal-mg{display:grid;grid-template-columns:repeat(7,1fr);border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;width:100%}'+
        '.cmfcal-mh{background:#f9fafb;padding:8px;text-align:center;font-size:12px;font-weight:600;color:#6b7280;border-bottom:1px solid #e5e7eb}'+
        '.cmfcal-md{background:#fff;border-bottom:1px solid #f3f4f6;border-right:1px solid #f3f4f6;min-height:80px;padding:4px;cursor:pointer}.cmfcal-md:hover{background:#f0fdfa}'+
        '.cmfcal-md.hoy{background:#f0fdfa}.cmfcal-md.ot{background:#fafafa}'+
        '.cmfcal-mn{font-size:13px;font-weight:600;color:#374151;margin-bottom:2px}.cmfcal-md.ot .cmfcal-mn{color:#d1d5db}.cmfcal-md.hoy .cmfcal-mn{color:#0d9488}'+
        '.cmfcal-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin:1px}'+
        '.cmfcal-leg{display:flex;gap:14px;margin-top:10px;flex-wrap:wrap}'+
        '.cmfcal-li{display:flex;align-items:center;gap:5px;font-size:11px;color:#6b7280}'+
        '.cmfcal-ld{width:10px;height:10px;border-radius:3px}'+
        '@media print{.cmfisio-header,.cmfisio-stats-bar,.cmfisio-filter-count,.cmfcal-nb,.cmfcal-vb{display:none!important}.cmfcal-h{justify-content:center}.cmfcal-t{font-size:18px}}'+
    '</style>'+
    '<div class="cmfcal-h"><div style="display:flex;gap:6px"><button class="cmfcal-nb" onclick="cmFisioCalNav(-1)">&#8592;</button><button class="cmfcal-nb" onclick="cmFisioCalNavHoy()">Hoy</button><button class="cmfcal-nb" onclick="cmFisioCalNav(1)">&#8594;</button></div>'+
    '<div class="cmfcal-t">'+tit+'</div><div style="display:flex;gap:6px">'+vBtns+'</div></div>'+
    '<div class="cmfcal-h"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+fSel+
    '<select onchange="cmFisioCal.filtroEquipo=this.value;cmFisioCalRenderVista()" style="background:#fff;border:1px solid #d1d5db;color:#1f2937;padding:5px 10px;border-radius:6px;font-size:12px">'+eOpts+'</select>'+
    '<button class="cmfcal-nb" onclick="cmFisioCalConfigHorario()">Horario</button>'+
    '<button class="cmfcal-nb" onclick="cmFisioCalImprimirPDF()">Imprimir</button></div></div>';
}

async function cmFisioCalRenderSemanal() {
    var g = document.getElementById('cmfisio-player-grid'); if (!g) return;
    var l = cmFisioCal.semanaInicio, fs = [], hS = new Date().toISOString().split('T')[0];
    for (var i=0;i<7;i++){var d=new Date(l);d.setDate(l.getDate()+i);fs.push(d);}
    var mt = fs[0].toLocaleDateString('es-ES',{month:'long',year:'numeric'});
    var tit = fs[0].getDate()+' - '+fs[6].getDate()+' '+mt.charAt(0).toUpperCase()+mt.slice(1);
    var hm={}; if(cmFisioCal.horario&&cmFisioCal.horario.schedule) CMFCAL_DIAS.forEach(function(d){hm[d]=cmFisioCal.horario.schedule[d]||[];});
    var sl=[]; for(var h=cmFisioCal.horaInicio;h<cmFisioCal.horaFin;h++){sl.push(('0'+h).slice(-2)+':00');sl.push(('0'+h).slice(-2)+':30');}
    var html=cmFisioCalCabecera(tit)+'<div class="cmfcal-g">';
    html+='<div class="cmfcal-gh"><div class="d" style="font-size:10px">Hora</div></div>';
    fs.forEach(function(f,i){var s=f.toISOString().split('T')[0];html+='<div class="cmfcal-gh'+(s===hS?' hoy':'')+'"><div class="d">'+CMFCAL_DIAS_LABEL[i]+'</div><div class="n">'+f.getDate()+'</div></div>';});
    sl.forEach(function(s){html+='<div class="cmfcal-tm">'+(s.endsWith(':00')?s:'')+'</div>';
        fs.forEach(function(f,i){var ds=f.toISOString().split('T')[0],dk=CMFCAL_DIAS[i],off=false;
            if(cmFisioCal.horario){var fr=hm[dk]||[];if(fr.length===0)off=true;else{off=true;fr.forEach(function(x){if(s>=x.start&&s<x.end)off=false;});}}
            html+='<div class="cmfcal-c'+(off?' off':'')+'" id="cmfcal-'+ds+'-'+s.replace(':','')+'"'+(!off?' onclick="cmFisioCalNuevaCita(\''+ds+'\',\''+s+'\')"':'')+'></div>';});});
    html+='</div>'+cmFisioCalLeyenda(); g.innerHTML=html;
    await cmFisioCalCargarCitasRango(fs[0],fs[6],'semanal');
}

async function cmFisioCalRenderDiaria() {
    var g=document.getElementById('cmfisio-player-grid');if(!g)return;
    var d=cmFisioCal.diaActual,ds=d.toISOString().split('T')[0];
    var tit=d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    tit=tit.charAt(0).toUpperCase()+tit.slice(1);
    var dw=d.getDay(),dk=CMFCAL_DIAS[dw===0?6:dw-1];
    var hf=[];if(cmFisioCal.horario&&cmFisioCal.horario.schedule)hf=cmFisioCal.horario.schedule[dk]||[];
    var sl=[];for(var h=cmFisioCal.horaInicio;h<cmFisioCal.horaFin;h++){sl.push(('0'+h).slice(-2)+':00');sl.push(('0'+h).slice(-2)+':30');}
    var html=cmFisioCalCabecera(tit)+'<div class="cmfcal-dg">';
    sl.forEach(function(s){var off=false;if(cmFisioCal.horario){if(hf.length===0)off=true;else{off=true;hf.forEach(function(x){if(s>=x.start&&s<x.end)off=false;});}}
        html+='<div class="cmfcal-tm" style="height:40px;align-items:center">'+(s.endsWith(':00')?s:'')+'</div>';
        html+='<div class="cmfcal-dc'+(off?' off':'')+'" id="cmfcal-day-'+s.replace(':','')+'"'+(!off?' onclick="cmFisioCalNuevaCita(\''+ds+'\',\''+s+'\')"':'')+'></div>';});
    html+='</div>'+cmFisioCalLeyenda();g.innerHTML=html;
    await cmFisioCalCargarCitasRango(d,d,'diaria');
}

async function cmFisioCalRenderMensual() {
    var g=document.getElementById('cmfisio-player-grid');if(!g)return;
    var m=cmFisioCal.mesActual,a=cmFisioCal.anioActual,hS=new Date().toISOString().split('T')[0];
    var meses=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var p1=new Date(a,m,1),uD=new Date(a,m+1,0),iS=p1.getDay();if(iS===0)iS=7;iS--;
    var html=cmFisioCalCabecera(meses[m]+' '+a)+'<div class="cmfcal-mg">';
    CMFCAL_DIAS_LABEL.forEach(function(d){html+='<div class="cmfcal-mh">'+d+'</div>';});
    for(var i=0;i<iS;i++){var pd=new Date(a,m,-(iS-1-i));html+='<div class="cmfcal-md ot"><div class="cmfcal-mn">'+pd.getDate()+'</div></div>';}
    for(var d=1;d<=uD.getDate();d++){var fd=new Date(a,m,d),fds=fd.toISOString().split('T')[0],eh=fds===hS;
        html+='<div class="cmfcal-md'+(eh?' hoy':'')+'" id="cmfcal-mes-'+fds+'" onclick="cmFisioCal.diaActual=new Date(\''+fds+'T12:00:00\');cmFisioCal.vistaCalendario=\'diaria\';cmFisioCalRenderVista()"><div class="cmfcal-mn">'+d+'</div><div id="cmfcal-dots-'+fds+'"></div></div>';}
    var tc=iS+uD.getDate(),rm=(7-(tc%7))%7;
    for(var i=1;i<=rm;i++)html+='<div class="cmfcal-md ot"><div class="cmfcal-mn">'+i+'</div></div>';
    html+='</div>'+cmFisioCalLeyenda();g.innerHTML=html;
    await cmFisioCalCargarCitasRango(p1,uD,'mensual');
}

function cmFisioCalLeyenda(){var h='<div class="cmfcal-leg">';Object.keys(CMFCAL_COLORS).forEach(function(t){h+='<div class="cmfcal-li"><div class="cmfcal-ld" style="background:'+CMFCAL_COLORS[t].border+'"></div>'+CMFCAL_COLORS[t].label+'</div>';});return h+'</div>';}

async function cmFisioCalCargarCitasRango(desde,hasta,modo){
    var dS=desde.toISOString().split('T')[0],hS=hasta.toISOString().split('T')[0];
    var r=await supabaseClient.from('cm_fisio_appointments').select('*').eq('club_id',clubId).eq('physio_wp_user_id',cmFisioCal.fisioSeleccionado).gte('appointment_date',dS).lte('appointment_date',hS).eq('archived',false).neq('status','cancelled').order('time_start');
    var citas=r.data||[];
    if(cmFisioCal.filtroEquipo!=='all')citas=citas.filter(function(c){var p=cmFisioCal.jugadoresMap[c.player_id];return p&&p.teamId===cmFisioCal.filtroEquipo;});
    cmFisioCal.citas=citas;
    if(modo==='semanal')citas.forEach(function(c){var col=CMFCAL_COLORS[c.type]||CMFCAL_COLORS.treatment;var tk=c.time_start.substring(0,5).replace(':','');var cl=document.getElementById('cmfcal-'+c.appointment_date+'-'+tk);if(!cl)return;
        var sM=parseInt(c.time_start.substring(0,2))*60+parseInt(c.time_start.substring(3,5)),eM=parseInt(c.time_end.substring(0,2))*60+parseInt(c.time_end.substring(3,5));
        var alt=Math.max(1,Math.round((eM-sM)/cmFisioCal.intervalo))*26-2;var p=cmFisioCal.jugadoresMap[c.player_id];var nm=p?p.name:'Jugador';
        var el=document.createElement('div');el.className='cmfcal-a';el.style.cssText='background:'+col.bg+';border-color:'+col.border+';color:'+col.text+';height:'+alt+'px';
        el.title=nm+' | '+c.time_start.substring(0,5)+'-'+c.time_end.substring(0,5);el.textContent=nm;el.onclick=function(e){e.stopPropagation();cmFisioCalEditarCita(c.id);};cl.appendChild(el);});
    else if(modo==='diaria')citas.forEach(function(c){var col=CMFCAL_COLORS[c.type]||CMFCAL_COLORS.treatment;var tk=c.time_start.substring(0,5).replace(':','');var cl=document.getElementById('cmfcal-day-'+tk);if(!cl)return;
        var p=cmFisioCal.jugadoresMap[c.player_id];var nm=p?(p.dorsal?p.dorsal+' ':'')+p.name:'Jugador';
        var el=document.createElement('div');el.className='cmfcal-da';el.style.borderColor=col.border;
        el.innerHTML='<div style="display:flex;justify-content:space-between"><strong style="color:'+col.text+'">'+nm+'</strong><span style="color:#6b7280;font-size:11px">'+c.time_start.substring(0,5)+'-'+c.time_end.substring(0,5)+'</span></div>'+(c.notes?'<div style="color:#6b7280;font-size:11px">'+c.notes+'</div>':'');
        el.onclick=function(e){e.stopPropagation();cmFisioCalEditarCita(c.id);};cl.appendChild(el);});
    else if(modo==='mensual'){var pf={};citas.forEach(function(c){if(!pf[c.appointment_date])pf[c.appointment_date]=[];pf[c.appointment_date].push(c);});
        Object.keys(pf).forEach(function(f){var de=document.getElementById('cmfcal-dots-'+f);if(!de)return;var ls=pf[f],h='';
            ls.slice(0,5).forEach(function(c){var col=CMFCAL_COLORS[c.type]||CMFCAL_COLORS.treatment;h+='<span class="cmfcal-dot" style="background:'+col.border+'"></span>';});
            if(ls.length>5)h+='<span style="font-size:9px;color:#6b7280">+'+( ls.length-5)+'</span>';
            h+='<div style="font-size:10px;color:#6b7280">'+ls.length+' cita'+(ls.length>1?'s':'')+'</div>';de.innerHTML=h;});}
}

function cmFisioCalNav(dir){if(cmFisioCal.vistaCalendario==='semanal')cmFisioCal.semanaInicio.setDate(cmFisioCal.semanaInicio.getDate()+dir*7);
    else if(cmFisioCal.vistaCalendario==='diaria')cmFisioCal.diaActual.setDate(cmFisioCal.diaActual.getDate()+dir);
    else{cmFisioCal.mesActual+=dir;if(cmFisioCal.mesActual>11){cmFisioCal.mesActual=0;cmFisioCal.anioActual++;}if(cmFisioCal.mesActual<0){cmFisioCal.mesActual=11;cmFisioCal.anioActual--;}}
    cmFisioCalRenderVista();}
function cmFisioCalNavHoy(){var h=new Date();cmFisioCal.diaActual=new Date(h);cmFisioCal.mesActual=h.getMonth();cmFisioCal.anioActual=h.getFullYear();
    var d=h.getDay(),df=(d===0?-6:1-d);var l=new Date(h);l.setDate(h.getDate()+df);l.setHours(0,0,0,0);cmFisioCal.semanaInicio=l;cmFisioCalRenderVista();}
function cmFisioCalCambiarFisio(id){cmFisioCal.fisioSeleccionado=id;cmFisioCalCargarHorario().then(function(){cmFisioCalRenderVista();});}

async function cmFisioCalNuevaCita(fecha,hora){
    var hp=hora.split(':'),he=parseInt(hp[0]),me=parseInt(hp[1])+30;if(me>=60){me-=60;he++;}var hf=('0'+he).slice(-2)+':'+('0'+me).slice(-2);
    var ps=[];Object.keys(cmFisioCal.jugadoresMap).forEach(function(pid){var p=cmFisioCal.jugadoresMap[pid];if(cmFisioCal.filtroEquipo!=='all'&&p.teamId!==cmFisioCal.filtroEquipo)return;ps.push({id:pid,name:p.name,dorsal:p.dorsal});});
    ps.sort(function(a,b){return a.name.localeCompare(b.name);});
    var opts=ps.map(function(p){return'<option value="'+p.id+'">'+(p.dorsal?p.dorsal+' ':'')+p.name+'</option>';}).join('');
    var dl=new Date(fecha+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
    var ov=document.createElement('div');ov.className='cmfisio-ficha-overlay';ov.id='cmfcal-fov';ov.style.zIndex='9600';
    ov.onclick=function(e){if(e.target===ov)ov.remove();};
    ov.innerHTML='<div style="background:#0f172a;border-radius:14px;width:100%;max-width:480px;border:1px solid #14b8a6;padding:24px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">Nueva cita - '+dl+'</h3><button style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer" onclick="document.getElementById(\'cmfcal-fov\').remove()">x</button></div>'+
        '<div class="cmfisio-form-group"><label>Jugador *</label><select id="cmfcal-p">'+opts+'</select></div>'+
        '<div class="cmfisio-form-row"><div class="cmfisio-form-group"><label>Inicio</label><input type="time" id="cmfcal-s" value="'+hora+'"></div><div class="cmfisio-form-group"><label>Fin</label><input type="time" id="cmfcal-e" value="'+hf+'"></div></div>'+
        '<div class="cmfisio-form-group"><label>Tipo</label><select id="cmfcal-t"><option value="treatment">Tratamiento</option><option value="preventive">Preventivo</option><option value="assessment">Valoracion</option><option value="maintenance">Mantenimiento</option></select></div>'+
        '<div class="cmfisio-form-group"><label>Notas</label><textarea id="cmfcal-n" placeholder="Observaciones..."></textarea></div>'+
        '<input type="hidden" id="cmfcal-d" value="'+fecha+'">'+
        '<div style="display:flex;gap:10px;justify-content:flex-end"><button class="cmfisio-btn cmfisio-btn-secondary" onclick="document.getElementById(\'cmfcal-fov\').remove()">Cancelar</button><button class="cmfisio-btn cmfisio-btn-primary" onclick="cmFisioCalGuardarCita()">Guardar</button></div></div>';
    document.body.appendChild(ov);}

async function cmFisioCalGuardarCita(){var p=document.getElementById('cmfcal-p').value,f=document.getElementById('cmfcal-d').value,s=document.getElementById('cmfcal-s').value,e=document.getElementById('cmfcal-e').value;
    if(!p||!s||!e){showToast('Completa jugador y horario','error');return;}
    var r=await supabaseClient.from('cm_fisio_appointments').insert({club_id:clubId,player_id:p,physio_wp_user_id:cmFisioCal.fisioSeleccionado||(usuario?usuario.id:0),appointment_date:f,time_start:s,time_end:e,type:document.getElementById('cmfcal-t').value,notes:document.getElementById('cmfcal-n').value.trim()||null,status:'scheduled'});
    if(r.error){showToast('Error: '+r.error.message,'error');return;}showToast('Cita creada');document.getElementById('cmfcal-fov').remove();cmFisioCalRenderVista();}

async function cmFisioCalEditarCita(cid){
    var r=await supabaseClient.from('cm_fisio_appointments').select('*').eq('id',cid).single();if(r.error||!r.data){showToast('Error','error');return;}var c=r.data;
    var p=cmFisioCal.jugadoresMap[c.player_id],nm=p?p.name:'Jugador';
    var dl=new Date(c.appointment_date+'T12:00:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
    var sO=['scheduled','completed','cancelled','no_show'].map(function(st){var l={scheduled:'Programada',completed:'Completada',cancelled:'Cancelada',no_show:'No asistio'};return'<option value="'+st+'"'+(c.status===st?' selected':'')+'>'+l[st]+'</option>';}).join('');
    var tO=['treatment','preventive','assessment','maintenance'].map(function(t){return'<option value="'+t+'"'+(c.type===t?' selected':'')+'>'+CMFCAL_COLORS[t].label+'</option>';}).join('');
    var ov=document.createElement('div');ov.className='cmfisio-ficha-overlay';ov.id='cmfcal-eov';ov.style.zIndex='9600';
    ov.onclick=function(e){if(e.target===ov)ov.remove();};
    ov.innerHTML='<div style="background:#0f172a;border-radius:14px;width:100%;max-width:480px;border:1px solid #f59e0b;padding:24px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">'+nm+'</h3><button style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer" onclick="document.getElementById(\'cmfcal-eov\').remove()">x</button></div>'+
        '<p style="color:#94a3b8;font-size:13px;margin:0 0 16px">'+dl+'</p><input type="hidden" id="cmfcal-ei" value="'+c.id+'">'+
        '<div class="cmfisio-form-row"><div class="cmfisio-form-group"><label>Inicio</label><input type="time" id="cmfcal-es" value="'+(c.time_start||'').substring(0,5)+'"></div><div class="cmfisio-form-group"><label>Fin</label><input type="time" id="cmfcal-ee" value="'+(c.time_end||'').substring(0,5)+'"></div></div>'+
        '<div class="cmfisio-form-row"><div class="cmfisio-form-group"><label>Tipo</label><select id="cmfcal-et">'+tO+'</select></div><div class="cmfisio-form-group"><label>Estado</label><select id="cmfcal-est">'+sO+'</select></div></div>'+
        '<div class="cmfisio-form-group"><label>Fecha</label><input type="date" id="cmfcal-ed" value="'+c.appointment_date+'"></div>'+
        '<div class="cmfisio-form-group"><label>Notas</label><textarea id="cmfcal-en">'+(c.notes||'')+'</textarea></div>'+
        '<div style="display:flex;gap:10px;justify-content:space-between"><button class="cmfisio-btn cmfisio-btn-danger cmfisio-btn-sm" onclick="cmFisioCalBorrar(\''+c.id+'\')">Eliminar</button><div style="display:flex;gap:10px"><button class="cmfisio-btn cmfisio-btn-secondary" onclick="document.getElementById(\'cmfcal-eov\').remove()">Cancelar</button><button class="cmfisio-btn cmfisio-btn-primary" onclick="cmFisioCalActCita()">Guardar</button></div></div></div>';
    document.body.appendChild(ov);}

async function cmFisioCalActCita(){var id=document.getElementById('cmfcal-ei').value;
    var r=await supabaseClient.from('cm_fisio_appointments').update({time_start:document.getElementById('cmfcal-es').value,time_end:document.getElementById('cmfcal-ee').value,type:document.getElementById('cmfcal-et').value,status:document.getElementById('cmfcal-est').value,appointment_date:document.getElementById('cmfcal-ed').value,notes:document.getElementById('cmfcal-en').value.trim()||null,updated_at:new Date().toISOString()}).eq('id',id);
    if(r.error){showToast('Error: '+r.error.message,'error');return;}showToast('Cita actualizada');document.getElementById('cmfcal-eov').remove();cmFisioCalRenderVista();}

function cmFisioCalBorrar(id){cmFisioConfirmarAccion('Vas a eliminar esta cita.',async function(){
    await supabaseClient.from('cm_fisio_appointments').update({archived:true,archived_at:new Date().toISOString()}).eq('id',id);
    showToast('Cita eliminada');var o=document.getElementById('cmfcal-eov');if(o)o.remove();cmFisioCalRenderVista();});}

function cmFisioCalConfigHorario(){
    var sc=(cmFisioCal.horario&&cmFisioCal.horario.schedule)?cmFisioCal.horario.schedule:{},ie=cmFisioCal.horario?cmFisioCal.horario.is_external:false;
    var dh='';CMFCAL_DIAS.forEach(function(d,i){var f=sc[d]||[],s1=f[0]?f[0].start:'',e1=f[0]?f[0].end:'',s2=f[1]?f[1].start:'',e2=f[1]?f[1].end:'';
        var sty='background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:4px 6px;border-radius:4px;font-size:11px;width:80px';
        dh+='<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px"><span style="color:#e2e8f0;font-weight:600;font-size:12px;width:30px">'+CMFCAL_DIAS_LABEL[i]+'</span>'+
            '<input type="time" class="cmfcal-hs1" data-d="'+d+'" value="'+s1+'" style="'+sty+'"><span style="color:#64748b;font-size:11px">a</span><input type="time" class="cmfcal-he1" data-d="'+d+'" value="'+e1+'" style="'+sty+'">'+
            '<span style="color:#64748b;font-size:10px;margin:0 4px">|</span>'+
            '<input type="time" class="cmfcal-hs2" data-d="'+d+'" value="'+s2+'" style="'+sty+'"><span style="color:#64748b;font-size:11px">a</span><input type="time" class="cmfcal-he2" data-d="'+d+'" value="'+e2+'" style="'+sty+'"></div>';});
    var ov=document.createElement('div');ov.className='cmfisio-ficha-overlay';ov.id='cmfcal-hov';ov.style.zIndex='9600';
    ov.onclick=function(e){if(e.target===ov)ov.remove();};
    ov.innerHTML='<div style="background:#0f172a;border-radius:14px;width:100%;max-width:580px;border:1px solid #14b8a6;padding:24px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="margin:0;color:#e2e8f0;font-size:16px">Configurar horario</h3><button style="background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer" onclick="document.getElementById(\'cmfcal-hov\').remove()">x</button></div>'+
        '<p style="color:#94a3b8;font-size:12px;margin:0 0 12px">Hasta 2 franjas por dia. Deja vacios los dias que no trabajas.</p>'+dh+
        '<label style="display:flex;align-items:center;gap:8px;margin-top:12px;color:#e2e8f0;font-size:13px;cursor:pointer"><input type="checkbox" id="cmfcal-ie"'+(ie?' checked':'')+' style="accent-color:#14b8a6"> Fisio externo</label>'+
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px"><button class="cmfisio-btn cmfisio-btn-secondary" onclick="document.getElementById(\'cmfcal-hov\').remove()">Cancelar</button><button class="cmfisio-btn cmfisio-btn-primary" onclick="cmFisioCalGuardarH()">Guardar</button></div></div>';
    document.body.appendChild(ov);}

async function cmFisioCalGuardarH(){var sc={};CMFCAL_DIAS.forEach(function(d){
    var s1=document.querySelector('.cmfcal-hs1[data-d="'+d+'"]').value,e1=document.querySelector('.cmfcal-he1[data-d="'+d+'"]').value;
    var s2=document.querySelector('.cmfcal-hs2[data-d="'+d+'"]').value,e2=document.querySelector('.cmfcal-he2[data-d="'+d+'"]').value;
    var fr=[];if(s1&&e1)fr.push({start:s1,end:e1});if(s2&&e2)fr.push({start:s2,end:e2});sc[d]=fr;});
    var r=await supabaseClient.from('cm_fisio_working_hours').upsert({club_id:clubId,physio_wp_user_id:cmFisioCal.fisioSeleccionado||(usuario?usuario.id:0),schedule:sc,effective_from:new Date().toISOString().split('T')[0],is_external:document.getElementById('cmfcal-ie').checked,updated_at:new Date().toISOString()},{onConflict:'club_id,physio_wp_user_id,effective_from'});
    if(r.error){showToast('Error: '+r.error.message,'error');return;}showToast('Horario guardado');document.getElementById('cmfcal-hov').remove();
    await cmFisioCalCargarHorario();cmFisioCalRenderVista();}
// ========== IMPRIMIR CALENDARIO EN PDF ==========
// Pegar al final de cm-fisio-calendario.js, antes del console.log
// Luego hacer Ctrl+H: cmFisioCalImprimirPDF() → cmFisioCalImprimirPDF()

async function cmFisioCalImprimirPDF() {
    if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') { showToast('jsPDF no disponible', 'error'); return; }
    var _jsPDF = (typeof jspdf !== 'undefined') ? jspdf.jsPDF : jsPDF;

    var fisioName = '';
    cmFisioCal.fisios.forEach(function(f) { if (f.wp_user_id === cmFisioCal.fisioSeleccionado) fisioName = f.display_name || 'Fisio'; });
    if (!fisioName && usuario) fisioName = usuario.display_name || usuario.name || 'Fisioterapeuta';

    var techMap = {};
    cmFisioTecnicasCatalog.forEach(function(t) { techMap[t.code] = t.name_es; });

    var equipoNombre = 'Todos los equipos';
    if (cmFisioCal.filtroEquipo !== 'all') {
        cmFisioEquipos.forEach(function(t) { if (t.id === cmFisioCal.filtroEquipo) equipoNombre = t.name; });
    }

    // Colores para PDF (CMYK-safe)
    var colPDF = {
        treatment:   { r: 220, g: 38, b: 38, label: 'Tratamiento' },
        preventive:  { r: 22, g: 163, b: 74, label: 'Preventivo' },
        assessment:  { r: 37, g: 99, b: 235, label: 'Valoracion' },
        maintenance: { r: 217, g: 119, b: 6, label: 'Mantenimiento' }
    };

    if (cmFisioCal.vistaCalendario === 'semanal') {
        cmFisioCalPDFSemanal(_jsPDF, fisioName, equipoNombre, colPDF, techMap);
    } else if (cmFisioCal.vistaCalendario === 'diaria') {
        cmFisioCalPDFDiaria(_jsPDF, fisioName, equipoNombre, colPDF, techMap);
    } else if (cmFisioCal.vistaCalendario === 'mensual') {
        cmFisioCalPDFMensual(_jsPDF, fisioName, equipoNombre, colPDF);
    }
}


// ========== PDF SEMANAL ==========
function cmFisioCalPDFSemanal(_jsPDF, fisioName, equipoNombre, colPDF, techMap) {
    var doc = new _jsPDF('l', 'mm', 'a4'); // Landscape
    var W = 297, H = 210, mL = 10, mR = 10, mT = 10;
    var contentW = W - mL - mR;

    var lunes = cmFisioCal.semanaInicio;
    var fechas = [];
    for (var i = 0; i < 7; i++) { var d = new Date(lunes); d.setDate(lunes.getDate() + i); fechas.push(d); }
    var mt = fechas[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    var titulo = fechas[0].getDate() + ' - ' + fechas[6].getDate() + ' ' + mt.charAt(0).toUpperCase() + mt.slice(1);

    // Cabecera
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 22, 'F');
    doc.setTextColor(20, 184, 166);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CALENDARIO SEMANAL', mL, 10);
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(titulo + '  |  ' + fisioName + '  |  ' + equipoNombre, mL, 18);
    doc.text('TopLiderCoach HUB', W - mR, 18, { align: 'right' });

    var y = 28;
    var timeColW = 14;
    var dayColW = (contentW - timeColW) / 7;
    var slotH = 5.5;

    // Cabecera dias
    doc.setFillColor(243, 244, 246);
    doc.rect(mL, y, contentW, 8, 'F');
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Hora', mL + 2, y + 5.5);
    var diasLabel = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    fechas.forEach(function(f, idx) {
        var x = mL + timeColW + idx * dayColW;
        doc.text(diasLabel[idx] + ' ' + f.getDate(), x + dayColW / 2, y + 5.5, { align: 'center' });
    });
    y += 8;

    // Lineas de grid y horas
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);

    var slots = [];
    for (var h = cmFisioCal.horaInicio; h < cmFisioCal.horaFin; h++) {
        slots.push(('0' + h).slice(-2) + ':00');
        slots.push(('0' + h).slice(-2) + ':30');
    }

    slots.forEach(function(slot, si) {
        var sy = y + si * slotH;
        if (sy > H - 15) return;
        doc.setDrawColor(240, 240, 240);
        doc.line(mL, sy, mL + contentW, sy);
        if (slot.endsWith(':00')) {
            doc.setDrawColor(220, 220, 220);
            doc.line(mL, sy, mL + contentW, sy);
            doc.setTextColor(156, 163, 175);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.text(slot, mL + 1, sy + 3.5);
        }
    });

    // Lineas verticales
    for (var d = 0; d <= 7; d++) {
        var lx = mL + timeColW + d * dayColW;
        doc.setDrawColor(229, 231, 235);
        doc.line(lx, y, lx, y + slots.length * slotH);
    }

    // Pintar citas
    cmFisioCal.citas.forEach(function(c) {
        var col = colPDF[c.type] || colPDF.treatment;
        var fechaCita = c.appointment_date;
        var diaIdx = -1;
        fechas.forEach(function(f, idx) {
            if (f.toISOString().split('T')[0] === fechaCita) diaIdx = idx;
        });
        if (diaIdx === -1) return;

        var startMin = parseInt(c.time_start.substring(0, 2)) * 60 + parseInt(c.time_start.substring(3, 5));
        var endMin = parseInt(c.time_end.substring(0, 2)) * 60 + parseInt(c.time_end.substring(3, 5));
        var slotStart = (startMin - cmFisioCal.horaInicio * 60) / 30;
        var slotEnd = (endMin - cmFisioCal.horaInicio * 60) / 30;

        var cx = mL + timeColW + diaIdx * dayColW + 1;
        var cy = y + slotStart * slotH;
        var cw = dayColW - 2;
        var ch = (slotEnd - slotStart) * slotH;

        doc.setFillColor(col.r, col.g, col.b);
        doc.roundedRect(cx, cy, cw, ch, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        var p = cmFisioCal.jugadoresMap[c.player_id];
        var nombre = p ? p.name : 'Jugador';
        var hora = c.time_start.substring(0, 5);
        doc.text(nombre, cx + 1.5, cy + 3.5);
        if (ch > 6) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(5);
            doc.text(hora, cx + 1.5, cy + 7);
        }
    });

    // Leyenda
    var ly = H - 10;
    doc.setFontSize(6);
    var lx2 = mL;
    Object.keys(colPDF).forEach(function(t) {
        var c = colPDF[t];
        doc.setFillColor(c.r, c.g, c.b);
        doc.circle(lx2 + 2, ly, 1.5, 'F');
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'normal');
        doc.text(c.label, lx2 + 5, ly + 1);
        lx2 += 30;
    });

    // Pie
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(6);
    doc.text('Generado: ' + new Date().toLocaleString('es-ES'), W - mR, ly + 1, { align: 'right' });

    doc.save('Calendario-Semanal-' + fechas[0].toISOString().split('T')[0] + '.pdf');
    showToast('PDF semanal descargado');
}


// ========== PDF DIARIO ==========
function cmFisioCalPDFDiaria(_jsPDF, fisioName, equipoNombre, colPDF, techMap) {
    var doc = new _jsPDF('p', 'mm', 'a4');
    var W = 210, mL = 15, mR = 15, contentW = W - mL - mR;

    var dia = cmFisioCal.diaActual;
    var titulo = dia.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);

    // Cabecera
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 28, 'F');
    doc.setTextColor(20, 184, 166);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CALENDARIO DIARIO', mL, 12);
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(titulo, mL, 20);
    doc.setFontSize(10);
    doc.text(fisioName + '  |  ' + equipoNombre, mL, 26);
    doc.text('TopLiderCoach HUB', W - mR, 26, { align: 'right' });

    var y = 36;

    // Filtrar citas del dia
    var diaStr = dia.toISOString().split('T')[0];
    var citasDia = cmFisioCal.citas.filter(function(c) { return c.appointment_date === diaStr; });
    citasDia.sort(function(a, b) { return a.time_start.localeCompare(b.time_start); });

    if (citasDia.length === 0) {
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(12);
        doc.text('No hay citas programadas para este dia.', mL, y + 20);
    } else {
        // Resumen rapido
        doc.setTextColor(20, 184, 166);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen: ' + citasDia.length + ' cita' + (citasDia.length > 1 ? 's' : '') + ' programada' + (citasDia.length > 1 ? 's' : ''), mL, y);
        y += 8;

        // Tabla resumen
        doc.setFillColor(243, 244, 246);
        doc.rect(mL, y, contentW, 7, 'F');
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('Hora', mL + 2, y + 5);
        doc.text('Jugador', mL + 25, y + 5);
        doc.text('Tipo', mL + 90, y + 5);
        doc.text('Estado', mL + 125, y + 5);
        doc.text('Notas', mL + 150, y + 5);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        citasDia.forEach(function(c, idx) {
            if (y > 270) { doc.addPage(); y = 20; }
            var col = colPDF[c.type] || colPDF.treatment;
            var p = cmFisioCal.jugadoresMap[c.player_id];
            var nombre = p ? (p.dorsal ? p.dorsal + ' ' : '') + p.name : 'Jugador';
            var hora = c.time_start.substring(0, 5) + '-' + c.time_end.substring(0, 5);
            var statusL = { scheduled: 'Programada', completed: 'Completada', cancelled: 'Cancelada', no_show: 'No asistio' };

            if (idx % 2 === 0) {
                doc.setFillColor(249, 250, 251);
                doc.rect(mL, y - 3, contentW, 8, 'F');
            }

            // Punto de color
            doc.setFillColor(col.r, col.g, col.b);
            doc.circle(mL + 1.5, y, 1.5, 'F');

            doc.setTextColor(31, 41, 55);
            doc.text(hora, mL + 5, y + 1);
            doc.text(nombre.substring(0, 30), mL + 25, y + 1);
            doc.setTextColor(col.r, col.g, col.b);
            doc.setFont('helvetica', 'bold');
            doc.text(col.label, mL + 90, y + 1);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(107, 114, 128);
            doc.text(statusL[c.status] || c.status, mL + 125, y + 1);
            if (c.notes) doc.text(c.notes.substring(0, 25), mL + 150, y + 1);
            y += 8;
        });

        // Detalle por cita
        y += 6;
        doc.setTextColor(20, 184, 166);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Detalle de citas', mL, y);
        y += 8;

        citasDia.forEach(function(c) {
            if (y > 250) { doc.addPage(); y = 20; }
            var col = colPDF[c.type] || colPDF.treatment;
            var p = cmFisioCal.jugadoresMap[c.player_id];
            var nombre = p ? (p.dorsal ? p.dorsal + '  ' : '') + p.name : 'Jugador';
            var hora = c.time_start.substring(0, 5) + ' - ' + c.time_end.substring(0, 5);

            // Barra de color
            doc.setFillColor(col.r, col.g, col.b);
            doc.rect(mL, y - 4, 3, 14, 'F');

            // Contenido
            doc.setFillColor(249, 250, 251);
            doc.rect(mL + 3, y - 4, contentW - 3, 14, 'F');

            doc.setTextColor(31, 41, 55);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(nombre, mL + 6, y);
            doc.setTextColor(107, 114, 128);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(hora + '  |  ' + col.label, mL + 6, y + 5);
            if (c.notes) {
                doc.text(c.notes.substring(0, 60), mL + 6, y + 9);
            }

            y += 18;
        });
    }

    // Leyenda
    var ly = Math.max(y + 10, 275);
    if (ly > 285) { doc.addPage(); ly = 20; }
    doc.setFontSize(6);
    var lx = mL;
    Object.keys(colPDF).forEach(function(t) {
        var c = colPDF[t];
        doc.setFillColor(c.r, c.g, c.b);
        doc.circle(lx + 2, ly, 1.5, 'F');
        doc.setTextColor(107, 114, 128);
        doc.text(c.label, lx + 5, ly + 1);
        lx += 30;
    });
    doc.setTextColor(156, 163, 175);
    doc.text('Generado: ' + new Date().toLocaleString('es-ES'), W - mR, ly + 1, { align: 'right' });

    doc.save('Calendario-Diario-' + diaStr + '.pdf');
    showToast('PDF diario descargado');
}


// ========== PDF MENSUAL ==========
function cmFisioCalPDFMensual(_jsPDF, fisioName, equipoNombre, colPDF) {
    var doc = new _jsPDF('l', 'mm', 'a4'); // Landscape
    var W = 297, H = 210, mL = 10, mR = 10;
    var contentW = W - mL - mR;

    var m = cmFisioCal.mesActual, a = cmFisioCal.anioActual;
    var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    var titulo = meses[m] + ' ' + a;

    // Cabecera
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, W, 22, 'F');
    doc.setTextColor(20, 184, 166);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CALENDARIO MENSUAL', mL, 10);
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(titulo + '  |  ' + fisioName + '  |  ' + equipoNombre, mL, 18);
    doc.text('TopLiderCoach HUB', W - mR, 18, { align: 'right' });

    var y = 28;
    var dayW = contentW / 7;
    var diasLabel = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

    // Cabecera dias
    doc.setFillColor(243, 244, 246);
    doc.rect(mL, y, contentW, 8, 'F');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    diasLabel.forEach(function(d, idx) {
        doc.text(d, mL + idx * dayW + dayW / 2, y + 5.5, { align: 'center' });
    });
    y += 8;

    // Calcular grid del mes
    var p1 = new Date(a, m, 1);
    var uD = new Date(a, m + 1, 0);
    var iS = p1.getDay();
    if (iS === 0) iS = 7;
    iS--;

    var hoyStr = new Date().toISOString().split('T')[0];
    var rowH = 24;

    // Agrupar citas por fecha
    var citasPorFecha = {};
    cmFisioCal.citas.forEach(function(c) {
        if (!citasPorFecha[c.appointment_date]) citasPorFecha[c.appointment_date] = [];
        citasPorFecha[c.appointment_date].push(c);
    });

    var cellIdx = 0;
    var totalDias = iS + uD.getDate();
    var totalRows = Math.ceil(totalDias / 7);

    for (var row = 0; row < totalRows; row++) {
        var ry = y + row * rowH;
        if (ry + rowH > H - 15) { doc.addPage(); y = 15; ry = y + 0; row = 0; /* simplified - won't paginate months */ }

        for (var col = 0; col < 7; col++) {
            var idx = row * 7 + col;
            var cx = mL + col * dayW;

            // Bordes
            doc.setDrawColor(229, 231, 235);
            doc.rect(cx, ry, dayW, rowH);

            var diaNum = idx - iS + 1;
            if (diaNum < 1 || diaNum > uD.getDate()) {
                // Dia fuera del mes
                doc.setFillColor(249, 250, 251);
                doc.rect(cx + 0.2, ry + 0.2, dayW - 0.4, rowH - 0.4, 'F');
                continue;
            }

            var fechaDia = new Date(a, m, diaNum);
            var fechaStr = fechaDia.toISOString().split('T')[0];
            var esHoy = fechaStr === hoyStr;

            if (esHoy) {
                doc.setFillColor(240, 253, 250);
                doc.rect(cx + 0.2, ry + 0.2, dayW - 0.4, rowH - 0.4, 'F');
            }

            // Numero del dia
            doc.setTextColor(esHoy ? 13 : 55, esHoy ? 148 : 65, esHoy ? 136 : 81);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(String(diaNum), cx + 2, ry + 5.5);

            // Citas de ese dia
            var citasDia = citasPorFecha[fechaStr] || [];
            if (citasDia.length > 0) {
                var dotY = ry + 10;
                citasDia.slice(0, 3).forEach(function(c) {
                    var col2 = colPDF[c.type] || colPDF.treatment;
                    var p = cmFisioCal.jugadoresMap[c.player_id];
                    var nm = p ? p.name.split(' ')[0] : '';

                    doc.setFillColor(col2.r, col2.g, col2.b);
                    doc.circle(cx + 3, dotY, 1.2, 'F');
                    doc.setTextColor(55, 65, 81);
                    doc.setFontSize(5.5);
                    doc.setFont('helvetica', 'normal');
                    doc.text(c.time_start.substring(0, 5) + ' ' + nm, cx + 5.5, dotY + 1);
                    dotY += 4;
                });
                if (citasDia.length > 3) {
                    doc.setTextColor(107, 114, 128);
                    doc.setFontSize(5);
                    doc.text('+' + (citasDia.length - 3) + ' mas', cx + 3, dotY + 1);
                }
            }
        }
    }

    // Leyenda
    var ly = H - 8;
    doc.setFontSize(6);
    var lx = mL;
    Object.keys(colPDF).forEach(function(t) {
        var c = colPDF[t];
        doc.setFillColor(c.r, c.g, c.b);
        doc.circle(lx + 2, ly, 1.5, 'F');
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'normal');
        doc.text(c.label, lx + 5, ly + 1);
        lx += 30;
    });
    doc.setTextColor(156, 163, 175);
    doc.text('Generado: ' + new Date().toLocaleString('es-ES'), W - mR, ly + 1, { align: 'right' });

    doc.save('Calendario-Mensual-' + a + '-' + ('0' + (m + 1)).slice(-2) + '.pdf');
    showToast('PDF mensual descargado');
}
console.log('[Panel Fisio] cm-fisio-calendario.js v2 cargado');
