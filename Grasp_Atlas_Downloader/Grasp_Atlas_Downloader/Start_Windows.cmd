@echo off
chcp 65001 >nul
set PYTHONUTF8=1
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 goto use_py
where python >nul 2>nul
if not errorlevel 1 goto use_python
echo Please install Python 3.10+ from https://www.python.org/downloads/
echo Enable "Add Python to PATH" during installation.
goto finished
:use_py
py -3 start_download.py %*
goto finished
:use_python
python start_download.py %*
:finished
pause
