@echo off
echo Block Hash Verification Tool
echo ==========================

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo npm is not installed. Please install npm first.
    exit /b 1
)

REM Install axios if not already installed
echo Installing axios dependency...
call npm install axios

REM Run the verification script
echo Running block hash verification...
node verify_block_terminal.js

echo Verification complete.
pause 