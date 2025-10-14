# Clean up LogiCode project structure

# Move documentation files to docs/
$docs = @("info.txt", "todo.txt", "piston_docs.md", "file-tree.txt")
if (!(Test-Path "docs")) { New-Item -ItemType Directory -Path "docs" }
foreach ($doc in $docs) {
    if (Test-Path $doc) { Move-Item $doc docs/ }
}

# Remove root node_modules and package files if not using monorepo
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "package.json") { Remove-Item "package.json" }
if (Test-Path "package-lock.json") { Remove-Item "package-lock.json" }

# Remove unnecessary files/folders from root (except backend, frontend, docs, .git, README.md)
$keep = @("backend", "frontend", "docs", ".git", ".gitignore", "README.md")
Get-ChildItem -Directory | Where-Object { $keep -notcontains $_.Name } | Remove-Item -Recurse -Force
Get-ChildItem -File | Where-Object { $keep -notcontains $_.Name } | Remove-Item -Force

Write-Host "Project structure cleaned up for deployment."