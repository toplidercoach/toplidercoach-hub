// ========== CLUB-UTILS.JS — TopLiderCoach HUB ==========
// Utilidades compartidas para todos los módulos del Club Mode
// No tiene dependencias propias, lo usan los demás archivos club-*.js

// ========== CONFIGURACIÓN STORAGE ==========
const CLUB_STORAGE_BUCKET = 'club-photos';

// ========== SUBIDA DE FOTOS ==========
// Sube una foto a Supabase Storage y devuelve la URL pública
// folder: 'players', 'members', 'scouting', 'staff'
async function clubSubirFoto(file, folder) {
    if (!file) return null;
    try {
        const ext = file.name.split('.').pop().toLowerCase();
        const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (!allowed.includes(ext)) {
            showToast('Formato no permitido. Usa JPG, PNG o WEBP', 'error');
            return null;
        }
        // Limitar a 5MB
        if (file.size > 5 * 1024 * 1024) {
            showToast('La foto es demasiado grande (max 5MB)', 'error');
            return null;
        }
        const fileName = folder + '/' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '.' + ext;
        const { data, error } = await supabaseClient.storage
            .from(CLUB_STORAGE_BUCKET)
            .upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (error) {
            console.error('Error subiendo foto:', error);
            showToast('Error subiendo foto: ' + error.message, 'error');
            return null;
        }
        return SUPABASE_URL + '/storage/v1/object/public/' + CLUB_STORAGE_BUCKET + '/' + fileName;
    } catch (e) {
        console.error('Error en clubSubirFoto:', e);
        showToast('Error subiendo foto', 'error');
        return null;
    }
}

// ========== AVATARES ==========
// Obtiene las iniciales de un nombre: "Juan García" → "JG"
function clubGetInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Genera el HTML de un avatar (con foto o iniciales)
// cls: 'club-avatar', 'club-avatar-sm', 'club-avatar-lg'
function clubAvatarHTML(photoUrl, name, cls) {
    cls = cls || 'club-avatar';
    if (photoUrl) {
        return '<img src="' + photoUrl + '" class="' + cls + '" alt="" loading="lazy">';
    }
    return '<div class="' + cls + ' club-avatar-placeholder">' + clubGetInitials(name) + '</div>';
}

// ========== CÁLCULOS ==========
// Calcula la edad a partir de una fecha de nacimiento (formato YYYY-MM-DD)
function clubCalcEdad(birthDate) {
    if (!birthDate) return '';
    var hoy = new Date();
    var nac = new Date(birthDate + 'T12:00:00'); // T12:00:00 para evitar bug UTC
    var edad = hoy.getFullYear() - nac.getFullYear();
    if (hoy.getMonth() < nac.getMonth() || 
        (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) {
        edad--;
    }
    return edad;
}

// Devuelve el año fiscal de una fecha (periodo 01/07 a 30/06)
// Ej: 15/09/2025 → "2025-26", 15/03/2026 → "2025-26"
function clubFiscalYear(fecha) {
    if (!fecha) return '';
    var d = new Date(fecha + 'T12:00:00');
    var mes = d.getMonth(); // 0-11
    var anio = d.getFullYear();
    if (mes >= 6) { // julio (6) en adelante
        return anio + '-' + String(anio + 1).slice(2);
    }
    return (anio - 1) + '-' + String(anio).slice(2);
}

// ========== COLORES POR POSICIÓN ==========
var CLUB_POS_COLORS = {
    portero: '#f59e0b',
    defensa: '#3b82f6',
    centrocampista: '#06d6a0',
    delantero: '#ef4444'
};

// ========== ESTADOS DE JUGADOR ==========
var CLUB_STATUS_LABELS = {
    activo: 'Activo',
    lesionado: 'Lesionado',
    baja: 'Baja',
    prueba: 'En prueba',
    cedido: 'Cedido'
};

var CLUB_STATUS_COLORS = {
    activo: '#06d6a0',
    lesionado: '#f59e0b',
    baja: '#ef4444',
    prueba: '#a78bfa',
    cedido: '#94a3b8'
};

// ========== CATEGORÍAS ==========
var CLUB_CATEGORIAS = [
    { value: 'prebenjamin', label: 'Prebenjamín' },
    { value: 'benjamin', label: 'Benjamín' },
    { value: 'alevin', label: 'Alevín' },
    { value: 'infantil', label: 'Infantil' },
    { value: 'cadete', label: 'Cadete' },
    { value: 'juvenil', label: 'Juvenil' },
    { value: 'senior', label: 'Senior' }
];

// ========== HELPERS DE FORMULARIO ==========
// Lee el valor de un input/select por ID, devuelve null si vacío
function clubGetVal(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    var val = el.value.trim();
    return val === '' ? null : val;
}

// Establece el valor de un input/select por ID
function clubSetVal(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value || '';
}

// ========== PHOTO PICKER ==========
// Genera el HTML del componente para subir fotos
// previewId: ID del div de preview
// inputId: ID del input file
// onChangeFunc: nombre de la función que se llama al cambiar
function clubPhotoPickerHTML(previewId, inputId, onChangeFunc, currentPhotoUrl) {
    var previewContent = currentPhotoUrl 
        ? '<img src="' + currentPhotoUrl + '"><span class="club-photo-change">Cambiar</span>'
        : '<span class="club-photo-icon">&#128247;</span><span class="club-photo-change">Subir foto</span>';
    
    return '<div class="club-photo-picker">' +
        '<div class="club-photo-preview" id="' + previewId + '" onclick="document.getElementById(\'' + inputId + '\').click()">' +
        previewContent +
        '</div>' +
        '<input type="file" id="' + inputId + '" accept="image/*" onchange="' + onChangeFunc + '(this)" style="display:none">' +
        '</div>';
}

// ========== ESTILOS CSS DEL CLUB MODE ==========
// Se inyectan una sola vez al cargar
(function inyectarEstilosClub() {
    if (document.getElementById('club-mode-styles')) return;
    var style = document.createElement('style');
    style.id = 'club-mode-styles';
    style.textContent = [
        '.club-avatar { width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid rgba(255,255,255,0.1); flex-shrink:0; }',
        '.club-avatar-sm { width:32px; height:32px; border-radius:50%; object-fit:cover; border:2px solid rgba(255,255,255,0.1); flex-shrink:0; }',
        '.club-avatar-lg { width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid rgba(255,255,255,0.1); flex-shrink:0; }',
        '.club-avatar-xl { width:64px; height:64px; border-radius:50%; object-fit:cover; border:2px solid rgba(255,255,255,0.1); flex-shrink:0; }',
        '.club-avatar-placeholder { display:flex; align-items:center; justify-content:center; background:#162040; color:#7b8fad; font-weight:700; }',
        '.club-avatar-sm.club-avatar-placeholder { font-size:12px; }',
        '.club-avatar-placeholder { font-size:14px; }',
        '.club-avatar-lg.club-avatar-placeholder { font-size:16px; }',
        '.club-avatar-xl.club-avatar-placeholder { font-size:20px; }',
        '.club-photo-picker { display:flex; flex-direction:column; align-items:center; gap:8px; margin-bottom:14px; }',
        '.club-photo-preview { width:90px; height:90px; border-radius:50%; border:2px dashed rgba(56,130,246,0.3); display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; transition:all 0.3s; background:#0b1120; position:relative; }',
        '.club-photo-preview:hover { border-color:#3b82f6; box-shadow:0 0 20px rgba(56,130,246,0.25); }',
        '.club-photo-preview img { width:100%; height:100%; object-fit:cover; }',
        '.club-photo-icon { font-size:28px; color:#4a5b78; }',
        '.club-photo-change { font-size:10px; color:#4a5b78; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }',
        '.club-photo-preview:hover .club-photo-icon, .club-photo-preview:hover .club-photo-change { color:#3b82f6; }',
        '.club-photo-uploading { position:absolute; inset:0; background:rgba(6,8,13,0.8); display:flex; align-items:center; justify-content:center; border-radius:50%; }',
        '.club-photo-uploading::after { content:""; width:22px; height:22px; border:3px solid rgba(56,130,246,0.2); border-top-color:#3b82f6; border-radius:50%; animation:clubSpin 0.8s linear infinite; }',
        '@keyframes clubSpin { to { transform:rotate(360deg); } }'
    ].join('\n');
    document.head.appendChild(style);
})();

console.log('Club Utils cargado');
