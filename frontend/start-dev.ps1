# PowerShell script to start Next.js dev server
# If you get execution policy error, run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Write-Host "Starting Next.js development server..." -ForegroundColor Green
Set-Location $PSScriptRoot

# Use npm.cmd to avoid execution policy issues
if (Get-Command npm.cmd -ErrorAction SilentlyContinue) {
    npm.cmd run dev
} else {
    npm run dev
}

