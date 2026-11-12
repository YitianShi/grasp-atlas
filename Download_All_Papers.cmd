@echo off
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 Grasp_Atlas_Downloader\Grasp_Atlas_Downloader\start_download.py --output "%~dp0GraspAtlas_Library" --retry
) else (
  python Grasp_Atlas_Downloader\Grasp_Atlas_Downloader\start_download.py --output "%~dp0GraspAtlas_Library" --retry
)
pause
