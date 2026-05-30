$ErrorActionPreference = 'Stop'

function Wait-PortReady {
  param(
    [Parameter(Mandatory = $true)][int]$Port,
    [int]$TimeoutSeconds = 120
  )
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      if (Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue) {
        return $true
      }
    } catch {
      # ignore
    }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Stop-ProcessTree {
  param([int]$ProcessId)
  try {
    & cmd /c "taskkill /PID $ProcessId /T /F >nul 2>nul"
  } catch {
    # ignore
  }
}

function Run-CommandCheck {
  param(
    [hashtable]$Check
  )
  $output = $null
  $stderr = ""
  $errorMessage = ""
  $exitCode = 1

  try {
    if ($Check.scriptPath) {
      foreach ($entry in $Check.env.GetEnumerator()) {
        Set-Item -Path "Env:$($entry.Key)" -Value $entry.Value
      }
      try {
        $output = & node $Check.scriptPath 2>&1
        $exitCode = $LASTEXITCODE
      } finally {
        foreach ($entry in $Check.env.GetEnumerator()) {
          Remove-Item -Path "Env:$($entry.Key)" -ErrorAction SilentlyContinue
        }
      }
    } else {
      $output = & powershell -NoProfile -ExecutionPolicy Bypass -Command $Check.cmd 2>&1
      $exitCode = $LASTEXITCODE
    }
  } catch {
    $errorMessage = $_.Exception.Message
    $stderr = ($_.Exception | Out-String)
  }

  return [PSCustomObject]@{
    exitCode = $exitCode
    stdout = if ($null -ne $output) { ($output | Out-String) } else { "" }
    stderr = $stderr
    error = $errorMessage
  }
}

function Invoke-CheckWithRetries {
  param(
    [hashtable]$Check,
    [int]$MaxAttempts = 2
  )
  $attempt = 0
  $run = $null
  do {
    $attempt += 1
    $run = Run-CommandCheck -Check $Check
    if ($run.exitCode -eq 0) {
      break
    }
    if ($attempt -lt $MaxAttempts) {
      Start-Sleep -Seconds 1
    }
  } while ($attempt -lt $MaxAttempts)

  return [PSCustomObject]@{
    run = $run
    attempts = $attempt
  }
}

$stamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ss-fffZ")
$outDir = Join-Path (Get-Location) "reports\backend-readiness"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$qaPort = 3311
$oldQaBase = $env:QA_BASE_URL
$env:QA_BASE_URL = "http://localhost:$qaPort"

$serverProcess = $null

try {
  $checks = @(
    @{ id = "B01"; name = "Static quality"; cmd = "npm run check:strict" },
    @{ id = "B02"; name = "Core operations"; cmd = "npm run qa:coreops" },
    @{ id = "B03"; name = "Payment exceptions"; cmd = "npm run qa:exceptions" },
    @{ id = "B04"; name = "Campaign impact"; cmd = "npm run qa:campaign:impact" },
    @{ id = "B05"; name = "Finance impact"; cmd = "npm run qa:finance:impact" },
    @{ id = "B06"; name = "Payout ledger"; cmd = "npm run qa:payout:ledger" },
    @{ id = "B07"; name = "Matrix audit"; cmd = "npm run qa:matrix:audit" },
    @{ id = "B08"; name = "Cross-role impact"; cmd = "npm run qa:crossrole:impact" },
    @{ id = "B09"; name = "Blind spots"; cmd = "npm run qa:blindspots" }
  )

  $results = @()
  foreach ($check in $checks) {
    $commandLabel = if ($check.scriptPath) { "node $($check.scriptPath) @QA_BASE_URL=$($env:QA_BASE_URL)" } else { $check.cmd }
    Write-Host "[backend-gate] running $($check.id) - $($check.name): $commandLabel"
    $startedAt = (Get-Date).ToUniversalTime().ToString("o")
    $attempted = Invoke-CheckWithRetries -Check $check -MaxAttempts 2
    $run = $attempted.run
    $endedAt = (Get-Date).ToUniversalTime().ToString("o")
    $ok = ($run.exitCode -eq 0)

    $results += [PSCustomObject]@{
      id = $check.id
      name = $check.name
      cmd = $commandLabel
      startedAt = $startedAt
      endedAt = $endedAt
      ok = $ok
      exitCode = $run.exitCode
      timedOut = $false
      stdout = $run.stdout
      stderr = $run.stderr
      error = $run.error
      attempts = $attempted.attempts
    }

    Write-Host "[backend-gate] $($check.id) status=$($run.exitCode)"
  }

  $passed = ($results | Where-Object { $_.ok }).Count
  $failed = ($results | Where-Object { -not $_.ok }).Count
  $okOverall = ($failed -eq 0)
  $generatedAt = (Get-Date).ToUniversalTime().ToString("o")

  $summary = [PSCustomObject]@{
    generatedAt = $generatedAt
    ok = $okOverall
    passed = $passed
    failed = $failed
    results = $results
  }

  $jsonPath = Join-Path $outDir "backend-gate-$stamp.json"
  $summary | ConvertTo-Json -Depth 8 | Set-Content -Path $jsonPath -Encoding utf8

  $mdLines = @()
  $mdLines += "# Backend Readiness Gate"
  $mdLines += ""
  $mdLines += "- Generated at: $generatedAt"
  $mdLines += "- Overall: $(if ($okOverall) { 'PASS' } else { 'FAIL' })"
  $mdLines += "- Passed: $passed"
  $mdLines += "- Failed: $failed"
  $mdLines += ""
  $mdLines += "## Checks"
  $mdLines += ""

  foreach ($r in $results) {
    $mdLines += "### $($r.id) - $($r.name)"
    $mdLines += "- Command: ``$($r.cmd)``"
    $mdLines += "- Status: $(if ($r.ok) { 'PASS' } else { 'FAIL' }) (exit=$($r.exitCode))"
    $mdLines += "- Timeout: no"
    $mdLines += "- Started: $($r.startedAt)"
    $mdLines += "- Ended: $($r.endedAt)"
    if ($r.error) {
      $mdLines += "- Error: $($r.error)"
    }
    $mdLines += ""
  }

  $mdLines += "## Artifact"
  $mdLines += ""
  $mdLines += "- JSON report: ``$jsonPath``"
  $mdLines += ""

  $mdPath = Join-Path $outDir "backend-gate-$stamp.md"
  $mdLines | Set-Content -Path $mdPath -Encoding utf8

  $resultPayload = [PSCustomObject]@{
    ok = $okOverall
    passed = $passed
    failed = $failed
    jsonPath = $jsonPath
    mdPath = $mdPath
  }
  $resultPayload | ConvertTo-Json -Depth 4

  if (-not $okOverall) {
    exit 1
  }
  exit 0
} finally {
  $env:QA_BASE_URL = $oldQaBase
  if ($null -ne $serverProcess -and $serverProcess.Id) {
    Stop-ProcessTree -ProcessId $serverProcess.Id
  }
}
