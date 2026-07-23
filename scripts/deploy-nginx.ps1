param(
  [string[]]$Servers = @("43.133.91.197"),
  [string]$ServerUser = "root",
  [string]$SshKey = "",
  [string]$ConfigFile = "deploy\nginx\veldr-frontends.conf",
  [string]$RemoteConfigPath = "/etc/nginx/conf.d/veldr-frontends.conf"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$localConfigPath = Join-Path $repoRoot $ConfigFile

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

function Get-PosixParent {
  param([string]$Path)
  $normalized = $Path.TrimEnd("/")
  $index = $normalized.LastIndexOf("/")
  if ($index -le 0) {
    return "/"
  }
  return $normalized.Substring(0, $index)
}

if (-not (Test-Path -LiteralPath $localConfigPath)) {
  throw "Missing nginx config: $localConfigPath"
}

Assert-Command "scp"
Assert-Command "ssh"

$sshArgs = @()
if ($SshKey) {
  $sshArgs += @("-i", $SshKey)
}

foreach ($server in $Servers) {
  $target = Get-Target $server
  $remoteTmpPath = "/tmp/veldr-frontends.conf"

  Invoke-Checked "Uploading nginx config to $target" {
    & scp @sshArgs $localConfigPath "${target}:${remoteTmpPath}"
  }

  $remoteCommand = @(
    "set -e",
    "command -v nginx >/dev/null 2>&1",
    "mkdir -p $(Quote-Sh (Get-PosixParent $RemoteConfigPath))",
    "if [ -f $(Quote-Sh $RemoteConfigPath) ]; then cp $(Quote-Sh $RemoteConfigPath) $(Quote-Sh "$RemoteConfigPath.bak-`$(date +%Y%m%d-%H%M%S)"); fi",
    "mv $(Quote-Sh $remoteTmpPath) $(Quote-Sh $RemoteConfigPath)",
    "nginx -t",
    "systemctl reload nginx"
  ) -join " && "

  Invoke-Checked "Installing and reloading nginx on $target" {
    & ssh @sshArgs $target $remoteCommand
  }
}

Write-Host ""
Write-Host "Nginx deployment complete." -ForegroundColor Green
