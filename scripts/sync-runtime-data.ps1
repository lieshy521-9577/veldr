param(
  [string[]]$Servers = @("43.133.91.197"),
  [string]$ServerUser = "root",
  [string]$SshKey = "",
  [string]$RemoteBackendPath = "/opt/veldr/backend",
  [string]$ServiceName = "veldr-backend",
  [switch]$KeepPackage
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot "backend"
$archiveName = "veldr-runtime.tgz"
$archivePath = Join-Path $backendPath $archiveName

function Invoke-Checked {
  param(
    [string]$Title,
    [scriptblock]$Script
  )

  Write-Host ""
  Write-Host "==> $Title" -ForegroundColor Cyan
  $global:LASTEXITCODE = $null
  & $Script
  if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

function Assert-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

function Get-Target {
  param([string]$Server)
  if ($Server -match "@") {
    return $Server
  }
  return "${ServerUser}@${Server}"
}

function Quote-Sh {
  param([string]$Value)
  return "'" + ($Value -replace "'", "'\''") + "'"
}

function Invoke-InBackend {
  param([scriptblock]$Script)
  Push-Location $backendPath
  try {
    & $Script
  }
  finally {
    Pop-Location
  }
}

Assert-Command "tar"
Assert-Command "scp"
Assert-Command "ssh"

if (-not (Test-Path -LiteralPath $backendPath)) {
  throw "Missing backend folder: $backendPath"
}

Invoke-Checked "Packing backend runtime data and uploads" {
  Invoke-InBackend {
    if (Test-Path -LiteralPath $archiveName) {
      Remove-Item -LiteralPath $archiveName -Force
    }

    tar -czf $archiveName public/data public/uploads
  }
}

$sshArgs = @()
if ($SshKey) {
  $sshArgs += @("-i", $SshKey)
}

foreach ($server in $Servers) {
  $target = Get-Target $server

  Invoke-Checked "Uploading runtime archive to $target" {
    & scp @sshArgs $archivePath "${target}:/tmp/$archiveName"
  }

  $remoteCommand = @(
    "set -e",
    "trap 'systemctl start $(Quote-Sh $ServiceName) >/dev/null 2>&1 || true' EXIT",
    "systemctl stop $(Quote-Sh $ServiceName) || true",
    "cd $(Quote-Sh $RemoteBackendPath)",
    "BACKUP=`$(date +%Y%m%d-%H%M%S)",
    "if [ -d public/data ]; then cp -a public/data public/data-backup-`$BACKUP; fi",
    "if [ -d public/uploads ]; then cp -a public/uploads public/uploads-backup-`$BACKUP; fi",
    "tar -xzf /tmp/$(Quote-Sh $archiveName) -C $(Quote-Sh $RemoteBackendPath)",
    "rm /tmp/$(Quote-Sh $archiveName)",
    "chown -R www-data:www-data public/data public/uploads",
    "chmod -R 750 public/data",
    "chmod -R 755 public/uploads",
    "trap - EXIT",
    "systemctl start $(Quote-Sh $ServiceName)",
    "systemctl --no-pager --full status $(Quote-Sh $ServiceName)"
  ) -join " && "

  Invoke-Checked "Activating runtime data on $target" {
    & ssh @sshArgs $target $remoteCommand
  }
}

if (-not $KeepPackage -and (Test-Path -LiteralPath $archivePath)) {
  Remove-Item -LiteralPath $archivePath -Force
}

Write-Host ""
Write-Host "Runtime data sync complete." -ForegroundColor Green
