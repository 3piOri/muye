Remove-Item todo.xml -ErrorAction SilentlyContinue
"<proyecto>" | Out-File -Encoding utf8 todo.xml
Get-ChildItem -Recurse -Include *.html,*.js,*.css | ForEach-Object {
  "<archivo nombre=`"$($_.Name)`">" | Add-Content todo.xml
  Get-Content $_.FullName -Raw | Add-Content todo.xml
  "</archivo>" | Add-Content todo.xml
}
"</proyecto>" | Add-Content todo.xml
Write-Host "Listo! todo.xml creado"