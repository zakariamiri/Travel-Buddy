$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$VenvPath = Join-Path $PSScriptRoot ".venv"
$VenvPython = Join-Path $VenvPath "Scripts\python.exe"
$RequirementsFile = Join-Path $PSScriptRoot "requirements-api.txt"
$DepsMarker = Join-Path $VenvPath ".api-deps-installed"

function Show-PythonInstallHelp {
  Write-Host ""
  Write-Host "Python 3.12 is not installed or is not available in PATH."
  Write-Host "Install Python 3.12, then reopen PowerShell and run: npm run ai"
  Write-Host ""
  Write-Host "Recommended install command:"
  Write-Host "winget install Python.Python.3.12"
}

function Test-VenvPython {
  if (-not (Test-Path $VenvPython)) {
    return $false
  }

  try {
    & $VenvPython --version *> $null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Test-ApiDependencies {
  try {
    & $VenvPython -c "import fastapi, pydantic, uvicorn" *> $null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

if ((Test-Path $VenvPath) -and (-not (Test-VenvPython))) {
  Write-Host "Existing Python virtual environment is invalid. Recreating it..."
  Remove-Item -LiteralPath $VenvPath -Recurse -Force
}

if (-not (Test-VenvPython)) {
  Write-Host "Creating Python virtual environment..."

  if (Get-Command py -ErrorAction SilentlyContinue) {
    py -3.12 -m venv $VenvPath
  }

  if ((-not (Test-VenvPython)) -and (Get-Command python -ErrorAction SilentlyContinue)) {
    python -m venv $VenvPath
  }

  if (-not (Test-VenvPython)) {
    Show-PythonInstallHelp
    exit 1
  }
}

Write-Host "Checking API dependencies..."
$requirementsHash = (Get-FileHash -Algorithm SHA256 $RequirementsFile).Hash
$installedHash = if (Test-Path $DepsMarker) { Get-Content -Raw $DepsMarker } else { "" }

if (($installedHash.Trim() -ne $requirementsHash) -or (-not (Test-ApiDependencies))) {
  Write-Host "Installing API dependencies..."
  & $VenvPython -m pip install -r $RequirementsFile
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
  Set-Content -LiteralPath $DepsMarker -Value $requirementsHash
} else {
  Write-Host "API dependencies are already installed."
}

Write-Host "Starting Travel-Buddy AI API on http://localhost:8000"
& $VenvPython -m uvicorn api:app --host 0.0.0.0 --port 8000
