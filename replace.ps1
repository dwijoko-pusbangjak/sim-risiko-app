$lines = Get-Content -Path "src\app\dashboard\mr-konteks\page.tsx"
$newChunk = Get-Content -Path "table_replacement.txt"
$before = $lines[0..385]
$after = $lines[549..($lines.Length - 1)]
$newLines = $before + $newChunk + $after
$newLines | Set-Content -Path "src\app\dashboard\mr-konteks\page.tsx" -Encoding UTF8
