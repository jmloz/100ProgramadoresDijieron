@echo off
rem Inicia el servidor local para usar el juego con OBS (ver README, seccion "Usarlo con OBS").
rem Al abrirlo pregunta el puerto (Enter = 8100). Tambien: "iniciar-servidor.bat 8200".
title 100 Programadores Dijeron - servidor OBS
set ARGS=
if not "%~1"=="" set ARGS=-Puerto %~1
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0servidor-obs.ps1" %ARGS%
pause
