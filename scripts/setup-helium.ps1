# Install the official portable release for this Windows user.
param([string]$Archive)
$ErrorActionPreference = 'Stop'
$node = (Get-Command node.exe).Source
$arch = switch ($env:PROCESSOR_ARCHITECTURE) {
  'AMD64' { 'x64' }
  'ARM64' { 'arm64' }
  default { throw 'Helium for Windows requires x64 or ARM64.' }
}
$root = Join-Path $env:LOCALAPPDATA 'PlaygroundMeet\Helium'
$release = Invoke-RestMethod 'https://api.github.com/repos/imputnet/helium-windows/releases/latest'
$asset = $release.assets | Where-Object { $_.name -match ('^helium_[0-9.]+_' + $arch + '-windows\.zip$') } | Select-Object -First 1
if (!$asset -or $asset.digest -notmatch '^sha256:[0-9a-fA-F]{64}$') { throw 'Verified upstream release unavailable.' }
$stem = [IO.Path]::GetFileNameWithoutExtension($asset.name)
$exe = Join-Path $root "$stem\chrome.exe"
New-Item -ItemType Directory -Force -Path $root | Out-Null
if (!(Test-Path -LiteralPath $exe)) {
  $zip = if ($Archive) { (Resolve-Path -LiteralPath $Archive).Path } else { Join-Path $root $asset.name }
  if (!$Archive) {
    & curl.exe --fail --location --retry 2 --output $zip $asset.browser_download_url
    if ($LASTEXITCODE) { throw 'Helium download failed.' }
  }
  $stream = [IO.File]::OpenRead($zip)
  $sha = [Security.Cryptography.SHA256]::Create()
  try { $hash = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '') }
  finally { $stream.Dispose(); $sha.Dispose() }
  if ($hash -ne $asset.digest.Substring(7)) { throw 'Helium checksum mismatch.' }
  $stage = Join-Path $root ([guid]::NewGuid().ToString())
  New-Item -ItemType Directory -Path $stage | Out-Null
  & tar.exe -xf $zip -C $stage
  if ($LASTEXITCODE -or !(Test-Path -LiteralPath (Join-Path $stage "$stem\chrome.exe"))) { throw 'Incomplete Helium archive.' }
  $source = (Resolve-Path -LiteralPath (Join-Path $stage $stem)).Path
  $dest = [IO.Path]::GetFullPath((Join-Path $root $stem))
  if ([IO.Path]::GetDirectoryName($source) -ne $stage -or [IO.Path]::GetDirectoryName($dest) -ne $root) { throw 'Unexpected release directory.' }
  [IO.Directory]::Move($source,$dest)
  [IO.Directory]::Delete($stage)
  if (!$Archive) { Remove-Item -LiteralPath $zip }
}
$launcher = Join-Path $root 'helium-window.mjs'
Copy-Item -Force -LiteralPath (Join-Path $PSScriptRoot 'helium-window.mjs') -Destination $launcher
[IO.File]::WriteAllText((Join-Path $root 'helium-install.json'), (@{executable=$exe} | ConvertTo-Json))
$scheme = 'HKCU:\Software\Classes\meet-helium'
New-Item -Path "$scheme\shell\open\command" -Force | Out-Null
Set-Item -Path $scheme -Value 'URL:Playground Meet Helium'
New-ItemProperty -Path $scheme -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
Set-Item -Path "$scheme\shell\open\command" -Value ('"{0}" "{1}" "%1"' -f $node,$launcher)
Write-Output "Helium $($release.tag_name) is ready for Meet."
