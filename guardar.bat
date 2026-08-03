@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
set "FE=C:\emprende"
set "BE=C:\xampp\htdocs\emprende-back"

set /p "MSG=Describe el cambio (Enter = 'Cambios'): "
if "!MSG!"=="" set "MSG=Cambios"

for %%D in ("%FE%" "%BE%") do (
  echo.
  echo ===== %%~D =====
  pushd %%~D
  del /f /q ".git\HEAD.lock" ".git\index.lock" ".git\objects\maintenance.lock" >nul 2>&1
  git add -A
  git commit -m "!MSG!"
  popd
)
echo.
echo Guardado. Pulsa una tecla para cerrar.
pause >nul
