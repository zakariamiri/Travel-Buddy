$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

function Show-PythonInstallHelp {
  Write-Host ""
  Write-Host "Python 3.12 is not installed or is not available in PATH."
  Write-Host "Install Python 3.12, then reopen PowerShell and run: npm run ai"
  Write-Host ""
  Write-Host "Recommended install command:"
  Write-Host "winget install Python.Python.3.12"
}

if (-not (Test-Path ".venv\Scripts\python.exe")) {
  Write-Host "Creating Python virtual environment..."

  if (Get-Command py -ErrorAction SilentlyContinue) {
    py -3.12 -m venv .venv
  }

  if ((-not (Test-Path ".venv\Scripts\python.exe")) -and (Get-Command python -ErrorAction SilentlyContinue)) {
    python -m venv .venv
  }

  if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Show-PythonInstallHelp
    exit 1
  }
}

Write-Host "Activating virtual environment..."
& ".\.venv\Scripts\Activate.ps1"

Write-Host "Installing API dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements-api.txt

Write-Host "Starting Travel-Buddy AI API on http://localhost:8000"
python -m uvicorn api:app --host 0.0.0.0 --port 8000
