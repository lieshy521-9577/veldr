param(
  [string]$ServerHost = "8.159.128.180",
  [string]$ServerUser = "root",
  [string]$SshKey = "",
  [string]$RemoteVeldrPath = "/var/www/veldr",
  [string]$RemoteCmsPath = "/var/www/veldr-cms",
  [string]$CmsApiBase = "/api/cms",
  [string]$CmsUploadBase = "/uploads/cms",
  [switch]$Deploy,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $RepoRoot "frontend"
$CmsFrontendDir = Join-Path $RepoRoot "cms-frontend"
$ArtifactDir = Join-Path $RepoRoot "artifacts"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"

function Invoke-Step {
  param(
    [string]$Title,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "==> $Title" -ForegroundColor Cyan
  & $Action
}

function Assert-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

function Quote-Sh {
  param([string]$Value)
  return "'" + ($Value -replace "'", "'\''") + "'"
}

function ConvertTo-JsString {
  param([string]$Value)
  return ($Value -replace "\\", "\\") -replace "'", "\'"
}

function Build-Frontend {
  param([string]$Path)
  Push-Location $Path
  try {
    npm run build
  }
  finally {
    Pop-Location
  }
}

function New-ZipFromDist {
  param(
    [string]$DistPath,
    [string]$ZipPath
  )

  if (-not (Test-Path -LiteralPath $DistPath)) {
    throw "Missing dist folder: $DistPath"
  }

  if (Test-Path -LiteralPath $ZipPath) {
    Remove-Item -LiteralPath $ZipPath -Force
  }

  Compress-Archive -Path (Join-Path $DistPath "*") -DestinationPath $ZipPath -Force
}

Assert-Command "npm"

Invoke-Step "Preparing artifact folder" {
  New-Item -ItemType Directory -Force -Path $ArtifactDir | Out-Null
}

if (-not $SkipBuild) {
  Invoke-Step "Building Veldr frontend" {
    Build-Frontend $FrontendDir
  }

  Invoke-Step "Building CMS frontend" {
    Build-Frontend $CmsFrontendDir
  }
}

Invoke-Step "Writing CMS runtime config" {
  $ConfigPath = Join-Path $CmsFrontendDir "dist\config.js"
  $Api = ConvertTo-JsString $CmsApiBase
  $Upload = ConvertTo-JsString $CmsUploadBase
  @"
window.CMS_CONFIG = {
  apiBase: '$Api',
  uploadBase: '$Upload'
};
"@ | Set-Content -LiteralPath $ConfigPath -Encoding UTF8
  Write-Host "CMS config: $ConfigPath"
}

$VeldrZip = Join-Path $ArtifactDir "veldr-frontend-$Stamp.zip"
$CmsZip = Join-Path $ArtifactDir "veldr-cms-frontend-$Stamp.zip"

Invoke-Step "Packing Veldr frontend" {
  New-ZipFromDist -DistPath (Join-Path $FrontendDir "dist") -ZipPath $VeldrZip
  Write-Host $VeldrZip
}

Invoke-Step "Packing CMS frontend" {
  New-ZipFromDist -DistPath (Join-Path $CmsFrontendDir "dist") -ZipPath $CmsZip
  Write-Host $CmsZip
}

if (-not $Deploy) {
  Write-Host ""
  Write-Host "Build artifacts are ready." -ForegroundColor Green
  Write-Host "Run again with -Deploy to upload to $ServerUser@$ServerHost."
  exit 0
}

Assert-Command "ssh"
Assert-Command "scp"

$SshArgs = @()
if ($SshKey) {
  $SshArgs += @("-i", $SshKey)
}

$Target = "$ServerUser@$ServerHost"
$RemoteTmp = "/tmp/veldr-frontends-$Stamp"
$RemoteVeldrRelease = "$RemoteVeldrPath/releases/$Stamp"
$RemoteCmsRelease = "$RemoteCmsPath/releases/$Stamp"

Invoke-Step "Creating remote release folders on $Target" {
  $Command = @(
    "set -e",
    "command -v unzip >/dev/null 2>&1 || { echo 'unzip is required on the server'; exit 1; }",
    "mkdir -p $(Quote-Sh $RemoteTmp) $(Quote-Sh $RemoteVeldrRelease) $(Quote-Sh $RemoteCmsRelease)"
  ) -join "; "
  & ssh @SshArgs $Target $Command
}

Invoke-Step "Uploading frontend archives" {
  & scp @SshArgs $VeldrZip "${Target}:${RemoteTmp}/veldr-frontend.zip"
  & scp @SshArgs $CmsZip "${Target}:${RemoteTmp}/veldr-cms-frontend.zip"
}

Invoke-Step "Activating remote release" {
  $Command = @(
    "set -e",
    "unzip -oq $(Quote-Sh "$RemoteTmp/veldr-frontend.zip") -d $(Quote-Sh $RemoteVeldrRelease)",
    "unzip -oq $(Quote-Sh "$RemoteTmp/veldr-cms-frontend.zip") -d $(Quote-Sh $RemoteCmsRelease)",
    "ln -sfn $(Quote-Sh $RemoteVeldrRelease) $(Quote-Sh "$RemoteVeldrPath/current")",
    "ln -sfn $(Quote-Sh $RemoteCmsRelease) $(Quote-Sh "$RemoteCmsPath/current")",
    "rm -rf $(Quote-Sh $RemoteTmp)"
  ) -join "; "
  & ssh @SshArgs $Target $Command
}

Write-Host ""
Write-Host "Deployment complete." -ForegroundColor Green
Write-Host "Veldr frontend current: $RemoteVeldrPath/current"
Write-Host "CMS frontend current:   $RemoteCmsPath/current"
