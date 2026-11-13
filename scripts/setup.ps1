$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22.12+ or a supported newer LTS, then reopen Cursor.' }
node -e "const [a,b]=process.versions.node.split('.').map(Number);if(a<22||(a===22&&b<12)){console.error('Node.js 22.12+ required');process.exit(1)}"
if ($LASTEXITCODE -ne 0) { throw 'Upgrade Node.js before continuing.' }
if (-not (Test-Path '.env.local')) { Copy-Item '.env.example' '.env.local' }
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Review the npm output.' }
npm.cmd run check
if ($LASTEXITCODE -ne 0) { throw 'Verification failed. Review the output before starting.' }
Write-Host 'Setup complete. Edit .env.local, then run npm run dev. Open http://127.0.0.1:3000.'
