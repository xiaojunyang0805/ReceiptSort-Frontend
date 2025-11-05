# PowerShell script to set Vercel environment variables correctly
# This avoids the echo/newline issues

Write-Host "🔧 Setting Vercel Environment Variables" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read from .env.local
$envFile = Get-Content .env.local
$env_vars = @{}

foreach ($line in $envFile) {
    if ($line -match '^([A-Z_]+)=(.+)$') {
        $key = $matches[1]
        $value = $matches[2].Trim('"').Trim("'")
        $env_vars[$key] = $value
    }
}

# Variables to update
$varsToUpdate = @(
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_PRICE_STARTER',
    'STRIPE_PRICE_BASIC',
    'STRIPE_PRICE_PRO',
    'STRIPE_PRICE_BUSINESS'
)

foreach ($var in $varsToUpdate) {
    if ($env_vars.ContainsKey($var)) {
        Write-Host "📝 Processing $var..." -ForegroundColor Yellow

        # Remove existing
        Write-Host "   Removing old value..." -ForegroundColor Gray
        $remove = "y" | vercel env rm $var production 2>&1

        # Add new - write to temp file to avoid shell escaping issues
        $tempFile = [System.IO.Path]::GetTempFileName()
        $env_vars[$var] | Set-Content -Path $tempFile -NoNewline

        Write-Host "   Adding new value..." -ForegroundColor Gray
        Get-Content $tempFile -Raw | vercel env add $var production

        Remove-Item $tempFile
        Write-Host "   ✅ Updated $var" -ForegroundColor Green
        Write-Host ""
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Done! Triggering deployment..." -ForegroundColor Green
Write-Host ""

git commit --allow-empty -m "Trigger redeploy with clean env (PowerShell)"
git push

Write-Host ""
Write-Host "⏳ Wait 1-2 minutes for deployment" -ForegroundColor Yellow
Write-Host "🌐 Test at: https://receiptsort.vercel.app/credits" -ForegroundColor Cyan
