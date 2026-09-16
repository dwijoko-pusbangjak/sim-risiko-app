$lines = Get-Content -Path "src\app\dashboard\laporan\page.tsx"
$newChunk = Get-Content -Path "table_replacement_laporan.txt"
$before = $lines[0..583]
$after = $lines[664..($lines.Length - 1)]
$newLines = $before + $newChunk + $after
$newLines | Set-Content -Path "src\app\dashboard\laporan\page.tsx" -Encoding UTF8
