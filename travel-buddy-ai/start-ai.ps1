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

Write-Host "Activating virtual environment..."
& ".\.venv\Scripts\Activate.ps1"

Write-Host "Installing API dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements-api.txt

Write-Host "Starting Travel-Buddy AI API on http://localhost:8000"
python -m uvicorn api:app --host 0.0.0.0 --port 8000
