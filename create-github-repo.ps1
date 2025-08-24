# Script para crear repositorio en GitHub
$token = "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"
$headers = @{
    "Authorization" = "token $token"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "PowerShell"
}

$body = @{
    "name" = "phorencial-bot-crm"
    "private" = $true
    "description" = "Sistema de gestión de leads integrado con WhatsApp Business para Phorencial"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method POST -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "✅ Repositorio creado exitosamente!" -ForegroundColor Green
    Write-Host "URL: $($response.html_url)" -ForegroundColor Cyan
    Write-Host "Clone URL: $($response.clone_url)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error al crear repositorio:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Respuesta del servidor: $responseBody" -ForegroundColor Yellow
    }
}
