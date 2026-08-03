@echo off
chcp 65001 >nul
set "FE=C:\emprende"
set "BE=C:\xampp\htdocs\emprende-back"

echo Esto DESCARTA los cambios sin guardar y vuelve al ultimo commit guardado.
echo (No borra archivos nuevos que no esten en git.)
set /p "OK=Continuar? (s/N): "
if /i not "%OK%"=="s" goto fin

for %%D in ("%FE%" "%BE%") do (
  echo.
  echo ===== %%~D =====
  pushd %%~D
  del /f /q ".git\HEAD.lock" ".git\index.lock" ".git\objects\maintenance.lock" >nul 2>&1
  git reset --hard HEAD
  popd
)
:fin
echo.
echo Pulsa una tecla para cerrar.
pause >nul
