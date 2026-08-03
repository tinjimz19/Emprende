@echo off
chcp 65001 >nul
set "FE=C:\emprende"
set "BE=C:\xampp\htdocs\emprende-back"

for %%D in ("%FE%" "%BE%") do (
  echo.
  echo ===== %%~D =====
  pushd %%~D
  del /f /q ".git\HEAD.lock" ".git\index.lock" ".git\objects\maintenance.lock" >nul 2>&1
  git status -s
  popd
)
echo.
echo (Si no aparece nada, no hay cambios desde el ultimo commit.)
echo Pulsa una tecla para cerrar.
pause >nul
