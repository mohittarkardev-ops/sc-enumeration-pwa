@echo off
echo ========================================================
echo    GitHub Repository Push Helper
echo ========================================================
echo.
set /p REPO_URL="Enter your new GitHub repository URL (e.g. https://github.com/username/repo.git): "

if "%REPO_URL%"=="" (
    echo Error: Repository URL cannot be empty.
    pause
    exit /b
)

echo.
echo Adding remote origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo Pushing to main branch...
git push -u origin main

echo.
echo ========================================================
echo    Push completed! Now import this repo in Vercel.
echo ========================================================
pause
