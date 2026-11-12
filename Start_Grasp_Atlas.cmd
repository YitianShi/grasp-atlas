@echo off
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 atlas_server.py
) else (
  python atlas_server.py
)
if errorlevel 1 pause
