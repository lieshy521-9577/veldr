param(
  [string[]]$Servers = @("43.133.91.197"),
  [string]$ServerUser = "root",
  [string]$SshKey = "",
  [string[]]$Domains = @("notes.lifetip.top", "cms.lifetip.top"),
  [string]$Email = "duan41912@gmail.com"
)

# 在服务器上安装 certbot 并为域名签发 Let's Encrypt 证书。
# certbot --nginx 会自动改写 nginx 配置（加 443 server 块 + HTTP 跳转），
# 续期由 apt 包自带的 certbot.timer 负责（每天两次检查，到期前 30 天自动续）。
# 注意：签发成功后请把服务器上的 /etc/nginx/conf.d/veldr-frontends.conf
# 同步回仓库 deploy/nginx/，否则下次 deploy-nginx.ps1 会把 TLS 配置覆盖掉。

$ErrorActionPreference = "Stop"

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

Assert-Command "ssh"

$sshArgs = @()
if ($SshKey) {
  $sshArgs += @("-i", $SshKey)
}

$domainArgs = ($Domains | ForEach-Object { "-d $_" }) -join " "

foreach ($server in $Servers) {
  $target = Get-Target $server

  Invoke-Checked "Installing certbot on $target" {
    $remoteCommand = @(
      "set -e",
      "export DEBIAN_FRONTEND=noninteractive",
      "apt-get update -qq",
      "apt-get install -y -qq certbot python3-certbot-nginx"
    ) -join " && "
    & ssh @sshArgs $target $remoteCommand
  }

  Invoke-Checked "Issuing certificates for $($Domains -join ', ')" {
    $remoteCommand = @(
      "set -e",
      "certbot --nginx $domainArgs --non-interactive --agree-tos -m $Email --redirect",
      "nginx -t",
      "systemctl reload nginx"
    ) -join " && "
    & ssh @sshArgs $target $remoteCommand
  }

  Invoke-Checked "Verifying auto-renewal on $target" {
    $remoteCommand = @(
      "set -e",
      "systemctl list-timers certbot.timer --no-pager",
      "certbot renew --dry-run"
    ) -join " && "
    & ssh @sshArgs $target $remoteCommand
  }
}

Write-Host ""
Write-Host "HTTPS setup complete." -ForegroundColor Green
