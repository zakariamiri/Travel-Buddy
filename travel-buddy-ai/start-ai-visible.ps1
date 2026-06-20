$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (-not (Test-Path ".venv\Scripts\python.exe")) {
  Write-Host "Creating Python virtual environment..."
  try {
    py -3.12 -m venv .venv
  } catch {
    python -m venv .venv
  }
}

& ".\.venv\Scripts\Activate.ps1"

Write-Host "Checking API dependencies..."
python -m pip install -r requirements-api.txt

Write-Host "Starting Travel-Buddy AI API..."
Write-Host "Open http://localhost:8000/health to verify."
python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
