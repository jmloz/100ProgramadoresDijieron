@echo off
rem Como iniciar-servidor.bat, pero tambien deja abrir el panel desde un celular
rem u otra computadora de la misma red. Pide permiso de administrador (una ventana
rem de Windows) y abre el puerto en el firewall solo para la red local.
rem Al abrirlo pregunta el puerto (Enter = 8100). Tambien: "iniciar-servidor-red.bat 8200".
title 100 Programadores Dijeron - servidor OBS (red)
set ARGS=
if not "%~1"=="" set ARGS=-Puerto %~1
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor-obs.ps1" %ARGS% -Red
if errorlevel 1 pause
