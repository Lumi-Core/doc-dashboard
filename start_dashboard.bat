@echo off
echo Starting Document Management Dashboard...
echo.
cd /d "%~dp0"
python serve.py 3000
pause
