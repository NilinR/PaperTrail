$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = $projectRoot
$frontendRoot = Join-Path $projectRoot 'papertrail-frontend'
$venvActivate = Join-Path $projectRoot 'venv\Scripts\Activate.ps1'
$pythonExe = Join-Path $projectRoot 'venv\Scripts\python.exe'

if (-not (Test-Path $venvActivate)) {
    throw "Python virtual environment not found at $venvActivate"
}

if (-not (Test-Path $pythonExe)) {
    throw "Python executable not found at $pythonExe"
}

if (-not (Test-Path (Join-Path $frontendRoot 'package.json'))) {
    throw "Frontend package.json not found at $frontendRoot"
}

$backendCommand = "Set-Location '$backendRoot'; & '$venvActivate'; uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
$frontendCommand = "Set-Location '$frontendRoot'; npm run dev"

Start-Process -FilePath 'powershell.exe' `
    -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $backendCommand) `
    -WorkingDirectory $projectRoot

Start-Process -FilePath 'powershell.exe' `
    -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $frontendCommand) `
    -WorkingDirectory $projectRoot

Write-Host 'PaperTrail backend and frontend are starting in separate PowerShell windows.'
Write-Host 'Backend:  http://127.0.0.1:8000/'
Write-Host 'Frontend: http://localhost:5173/'
