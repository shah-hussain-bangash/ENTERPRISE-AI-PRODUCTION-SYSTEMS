$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path 'node_modules/next/package.json')) { throw 'Run npm ci or scripts/setup.ps1 first.' }
npm.cmd run dev
exit $LASTEXITCODE
