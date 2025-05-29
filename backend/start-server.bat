@echo off
echo Starting Karaoke Management Backend Server...
echo.

cd /d "%~dp0"

echo Checking TypeScript compilation...
npx tsc --noEmit
if %errorlevel% neq 0 (
    echo ❌ TypeScript compilation failed!
    pause
    exit /b 1
)

echo ✅ TypeScript compilation successful!
echo.

echo Starting server with ts-node...
npx ts-node src/server.ts

pause
