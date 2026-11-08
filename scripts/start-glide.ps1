# Builds and serves Glide in the background, then opens it in its own app
# window. Closing that window stops the server. Meant to be launched hidden
# (see README), so problems are reported in a message box.
$ErrorActionPreference = "Stop"
trap {
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.MessageBox]::Show("Glide could not start: $_", "Glide", "OK", "Error") | Out-Null
  exit 1
}
Set-Location (Split-Path $PSScriptRoot)

$port = 4300
$url = "http://localhost:$port/"
$dataDir = Join-Path $env:LOCALAPPDATA "Glide"
New-Item -ItemType Directory -Force $dataDir | Out-Null
$log = Join-Path $dataDir "server.log"

function Show-Error($message) {
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.MessageBox]::Show($message, "Glide", "OK", "Error") | Out-Null
  exit 1
}

function Test-Server {
  try {
    Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 2 | Out-Null
    return $true
  } catch {
    return $false
  }
}

$browser = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { Show-Error "Microsoft Edge or Google Chrome is required to open Glide." }

# A dedicated profile keeps the app window in its own browser processes, so we
# can tell when it closes. Extensions and sync would keep those processes alive.
$profileDir = Join-Path $dataDir "browser"
$appArgs = @(
  "--app=$url",
  "--user-data-dir=`"$profileDir`"",
  "--window-size=1440,900",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "--disable-sync"
)

function Get-AppProcesses {
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" |
    Where-Object { $_.CommandLine -like "*$profileDir*" }
}

function Test-AppWindow {
  foreach ($process in Get-AppProcesses) {
    $handle = (Get-Process -Id $process.ProcessId -ErrorAction SilentlyContinue).MainWindowHandle
    if ($handle -and $handle -ne [IntPtr]::Zero) { return $true }
  }
  return $false
}

if (Test-Server) {
  Start-Process $browser -ArgumentList $appArgs
  exit
}

# Through cmd: Windows PowerShell treats native stderr output as errors.
cmd /c "vp build > `"$log`" 2>&1"
if ($LASTEXITCODE -ne 0) { Show-Error "Glide failed to build. Details: $log" }

$server = Start-Process vp -ArgumentList "preview", "--port", $port, "--strictPort" `
  -WindowStyle Hidden -PassThru -RedirectStandardOutput $log -RedirectStandardError "$log.err"
for ($i = 0; -not (Test-Server); $i++) {
  if ($server.HasExited -or $i -ge 40) { Show-Error "Glide's server did not start. Details: $log" }
  Start-Sleep -Milliseconds 250
}

try {
  Start-Process $browser -ArgumentList $appArgs
  for ($i = 0; -not (Test-AppWindow) -and $i -lt 60; $i++) { Start-Sleep -Milliseconds 250 }
  while (Test-AppWindow) { Start-Sleep -Seconds 1 }
} finally {
  cmd /c "taskkill /PID $($server.Id) /T /F >nul 2>&1"
  foreach ($process in Get-AppProcesses) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }
}
