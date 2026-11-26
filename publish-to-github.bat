@echo off
setlocal
title Publish Warehouse IQ to GitHub
cd /d "%~dp0"
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI"

echo === 1/5  Checking Git and GitHub CLI ===
where git >nul 2>nul || winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
where gh  >nul 2>nul || winget install -e --id GitHub.cli --accept-source-agreements --accept-package-agreements
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI"
where git >nul 2>nul || (echo Git could not be installed. & pause & exit /b 1)
where gh  >nul 2>nul || (echo GitHub CLI could not be installed. & pause & exit /b 1)

echo.
echo === 2/5  Logging in to GitHub (a browser window will open; enter the code shown here) ===
gh auth status >nul 2>nul || gh auth login --hostname github.com --git-protocol https --web
gh auth status >nul 2>nul || (echo Login did not finish. Run this file again. & pause & exit /b 1)
for /f "delims=" %%u in ('gh api user -q .login') do set "GHUSER=%%u"
echo Logged in as %GHUSER%

echo.
echo === 3/5  Saving the project with Git ===
if not exist ".git" git init -b main
git config user.name "%GHUSER%"
git config user.email "%GHUSER%@users.noreply.github.com"
git add -A
git commit -m "Warehouse IQ: AVL interval index for Problem Statement 09 (3D demo, tests, story mode)" || echo (nothing new to commit)

echo.
echo === 4/5  Creating the public repository and uploading ===
gh repo view "%GHUSER%/warehouse-iq" >nul 2>nul
if errorlevel 1 (
  gh repo create warehouse-iq --public --description "Problem Statement 09: The Warehouse's Broken Number Ranges - AVL interval index with a 3D web demo" --source . --remote origin --push
) else (
  git remote get-url origin >nul 2>nul || git remote add origin "https://github.com/%GHUSER%/warehouse-iq.git"
  git push -u origin main
)

echo.
echo === 5/5  Inviting collaborators ===
for %%c in (Syed-Asim18 Yashasajayhmh-png bhaveshpyth264) do (
  gh api -X PUT "repos/%GHUSER%/warehouse-iq/collaborators/%%c" -f permission=push >nul && echo Invited %%c || echo Could not invite %%c - check the username
)

echo.
echo Done! Your repository: https://github.com/%GHUSER%/warehouse-iq
echo Each collaborator gets an email invite and must click Accept.
start "" "https://github.com/%GHUSER%/warehouse-iq"
pause
