$file = "js\ejercicios.js"
$content = [System.IO.File]::ReadAllText($file)

$toastConfirm = @"
function ejConfirm(msg, onAceptar) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99998;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:28px 32px;max-width:360px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.6)"><p style="color:#f1f5f9;font-size:15px;margin:0 0 24px">' + msg + '</p><div style="display:flex;gap:12px;justify-content:center"><button id="ejc-cancel" style="padding:9px 22px;border-radius:7px;border:1px solid #475569;background:transparent;color:#94a3b8;cursor:pointer;font-size:14px">Cancelar</button><button id="ejc-ok" style="padding:9px 22px;border-radius:7px;border:none;background:#ef4444;color:#fff;cursor:pointer;font-size:14px;font-weight:600">Aceptar</button></div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#ejc-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#ejc-ok').onclick = () => { overlay.remove(); onAceptar(); };
}

function ejToast(msg, tipo = 'info') {
    const cfg = { info: { bg: '#1e3a5f', icon: 'i' }, success: { bg: '#166534', icon: 'OK' }, error: { bg: '#7f1d1d', icon: 'Error' }, warning: { bg: '#78350f', icon: 'Aviso' } }[tipo] || { bg: '#1e3a5f', icon: 'i' };
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:' + cfg.bg + ';color:#fff;padding:12px 22px;border-radius:8px;font-size:14px;z-index:99999;max-width:380px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,0.5);transition:opacity 0.4s;pointer-events:none;';
    t.textContent = cfg.icon + ' ' + msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 3500);
}

function ejInit() {
"@

$content = $content.Replace("function ejInit() {", $toastConfirm)

[System.IO.File]::WriteAllText($file, $content)
Write-Host "Listo"