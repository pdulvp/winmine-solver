# Author: inutilarium

. .\Get-Window.ps1
Get-Window $args[0] | ConvertTo-Json -Compress