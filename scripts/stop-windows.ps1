$ErrorActionPreference = "Stop"
Set-Location -Path (Split-Path -Path $PSScriptRoot -Parent)
docker compose down
Write-Host "Prelegal stopped."
