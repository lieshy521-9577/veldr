param(
  [string[]]$Servers = @("8.159.128.180"),
  [string]$ServerUser = "root",
  [string]$SshKey = "",
  [string]$RemoteVeldrPath = "/var/www/veldr",
  [string]$RemoteCmsPath = "/var/www/veldr-cms",
  [string]$CmsApiBase = "/api/cms",
  [string]$CmsUploadBase = "/uploads/cms",
  [switch]$Deploy,
  [switch]$SkipBuild,
  [switch]$KeepPackages
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $repoRoot "frontend"
$cmsFrontendPath = Join-Path $repoRoot "cms-frontend"

$packages = @(
  @{
    Name = "veldr"
    ProjectPath = $frontendPath
    RemotePath = $RemoteVeldrPath
    Archive = "veldr-dist.tgz"
  },
  @{
    Name = "cms"
    ProjectPath = $cmsFrontendPath
    RemotePath = $RemoteCmsPath
    Archive = "veldr-cms-dist.tgz"
  }
)

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

function ConvertTo-JsString {
  param([string]$Value)
  return ($Value -replace "\\", "\\") -replace "'", "\'"
}

function Invoke-InProject {
  param(
    [string]$Path,
    [scriptblock]$Script
  )

  Push-Location $Path
  try {
    & $Script
  }
  finally {
    Pop-Location
  }
}

function New-DistArchive {
  param(
    [hashtable]$Package
  )

  Invoke-InProject $Package.ProjectPath {
    if (-not (Test-Path -LiteralPath "dist")) {
      throw "Missing dist folder in $($Package.ProjectPath)"
    }

    if (Test-Path -LiteralPath $Package.Archive) {
      Remove-Item -LiteralPath $Package.Archive -Force
    }

    tar -czf $Package.Archive --exclude="dist/logs" dist
  }
}

function Remove-LocalArchive {
  param([hashtable]$Package)
  $archivePath = Join-Path $Package.ProjectPath $Package.Archive
  if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }
}

Assert-Command "npm"
Assert-Command "tar"

if (-not $SkipBuild) {
  Invoke-Checked "Building Veldr frontend" {
    Invoke-InProject $frontendPath {
      npm run build
    }
  }

  Invoke-Checked "Building CMS frontend" {
    Invoke-InProject $cmsFrontendPath {
      npm run build
    }
  }
}

Invoke-Checked "Writing CMS runtime config" {
  $configPath = Join-Path $cmsFrontendPath "dist\config.js"
  $api = ConvertTo-JsString $CmsApiBase
  $upload = ConvertTo-JsString $CmsUploadBase
  @"
window.CMS_CONFIG = {
  apiBase: '$api',
  uploadBase: '$upload'
};
"@ | Set-Content -LiteralPath $configPath -Encoding UTF8
}

foreach ($package in $packages) {
  Invoke-Checked "Packing $($package.Name) frontend" {
    New-DistArchive $package
  }
}

if (-not $Deploy) {
  Write-Host ""
  Write-Host "Build packages are ready:" -ForegroundColor Green
  foreach ($package in $packages) {
    Write-Host "  $(Join-Path $package.ProjectPath $package.Archive)"
  }
  Write-Host ""
  Write-Host "Run with -Deploy to upload to: $($Servers -join ', ')"
  exit 0
}

Assert-Command "scp"
Assert-Command "ssh"

$sshArgs = @()
if ($SshKey) {
  $sshArgs += @("-i", $SshKey)
}

foreach ($server in $Servers) {
  $target = Get-Target $server

  foreach ($package in $packages) {
    $archivePath = Join-Path $package.ProjectPath $package.Archive
    $remotePath = $package.RemotePath

    Invoke-Checked "Ensuring remote path for $($package.Name) on $target" {
      $remoteCommand = "mkdir -p $(Quote-Sh $remotePath)"
      & ssh @sshArgs $target $remoteCommand
    }

    Invoke-Checked "Uploading $($package.Archive) to $target" {
      & scp @sshArgs $archivePath "${target}:${remotePath}/$($package.Archive)"
    }

    $remoteCommand = @(
      "set -e",
      "cd $(Quote-Sh $remotePath)",
      "rm -rf dist-logs-temp",
      "BACKUP=`$(date +%Y%m%d-%H%M%S)",
      "if [ -d dist ]; then if [ -d dist/logs ]; then mv dist/logs dist-logs-temp; fi; mv dist dist-`$BACKUP; fi",
      "tar -xzf $(Quote-Sh $package.Archive)",
      "rm $(Quote-Sh $package.Archive)",
      "if [ -d dist-logs-temp ]; then mkdir -p dist; mv dist-logs-temp dist/logs; fi"
    ) -join " && "

    Invoke-Checked "Activating $($package.Name) frontend on $target" {
      & ssh @sshArgs $target $remoteCommand
    }
  }
}

if (-not $KeepPackages) {
  foreach ($package in $packages) {
    Remove-LocalArchive $package
  }
}

Write-Host ""
Write-Host "Frontend deployment complete." -ForegroundColor Green
