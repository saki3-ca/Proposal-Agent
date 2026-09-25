@echo off
title Proposal Agent - Startup Script
echo ====================================================
echo Starting Proposal Agent (Frontend + Backend)...
echo ====================================================

:: Check if node_modules exists
if not exist "node_modules\" (
    echo Installing frontend dependencies...
    call npm install
)

:: Check if python is available
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Python is not found in PATH! Backend may not start.
)

:: Start both frontend and backend concurrently
echo Launching Frontend on http://localhost:5173 and Backend on http://127.0.0.1:8000 ...
npm run dev

pause
