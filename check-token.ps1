# Script para verificar permisos del token
$token = "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"
$headers = @{
    "Authorization" = "token $token"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "PowerShell"
}

try {
    Write-Host "🔍 Verificando token..." -ForegroundColor Yellow
    $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Method GET -Headers $headers
    Write-Host "✅ Token válido para usuario: $($user.login)" -ForegroundColor Green
    
    Write-Host "🔍 Verificando repositorios..." -ForegroundColor Yellow
    $repos = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method GET -Headers $headers
    Write-Host "✅ Tienes acceso a $($repos.Count) repositorios" -ForegroundColor Green
    
    # Verificar si el repo ya existe
    $existingRepo = $repos | Where-Object { $_.name -eq "phorencial-bot-crm" }
    if ($existingRepo) {
        Write-Host "⚠️ El repositorio 'phorencial-bot-crm' ya existe!" -ForegroundColor Yellow
        Write-Host "URL: $($existingRepo.html_url)" -ForegroundColor Cyan
    } else {
        Write-Host "ℹ️ El repositorio 'phorencial-bot-crm' no existe aún" -ForegroundColor Blue
    }
    
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
