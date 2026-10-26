# ============================================================
#  SERVIDOR LOCAL PARA OBS
# ============================================================
#  OBS no deja abrir ventanas emergentes, y una "Fuente de
#  navegador" de OBS no puede hablar con el navegador normal
#  (son programas distintos). Este servidor sirve los archivos
#  del juego y pasa los mensajes entre el panel y el proyector.
#
#  No necesita instalar nada: usa PowerShell, que ya trae Windows.
#  Se inicia con iniciar-servidor.bat (doble clic): solo esta computadora.
#  Con iniciar-servidor-red.bat (parametro -Red) tambien se puede abrir el
#  panel desde un celular u otra computadora de la misma red: pide permiso
#  de administrador y abre el puerto en el firewall solo para la red local.
#
#  Al iniciar pregunta el puerto (Enter = 8100). Tambien se puede dar
#  de una vez:  iniciar-servidor.bat 8200
#
#    Panel:      http://localhost:8100/
#    Proyector:  http://localhost:8100/proyector.html  (fuente de navegador en OBS)
#
#  API del canal (la usa js/canal.js):
#    GET  /api/ping                          -> "ok"
#    POST /api/canal?de=panel|proyector      cuerpo: el mensaje en JSON
#    GET  /api/canal?para=panel|proyector&desde=N
#         -> { ultimo, mensajes: [...] } con los mensajes del otro lado posteriores a N
# ============================================================
param([int]$Puerto = 0, [switch]$Red)

$ErrorActionPreference = "Stop"
$raiz = [System.IO.Path]::GetFullPath($PSScriptRoot)
$utf8 = New-Object System.Text.UTF8Encoding($false)
$tipos = @{
    ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript; charset=utf-8"
    ".css" = "text/css; charset=utf-8"; ".json" = "application/json; charset=utf-8"
    ".webp" = "image/webp"; ".png" = "image/png"; ".jpg" = "image/jpeg"; ".jpeg" = "image/jpeg"
    ".svg" = "image/svg+xml"; ".ico" = "image/x-icon"; ".woff2" = "font/woff2"; ".woff" = "font/woff"
    ".ttf" = "font/ttf"; ".otf" = "font/otf"; ".md" = "text/plain; charset=utf-8"
}
$MAX_MENSAJES = 200          # los mensajes viejos se descartan
$MAX_CUERPO = 2MB
$PUERTO_DEFECTO = 8100

function Pedir-Puerto {
    while ($true) {
        $respuesta = Read-Host "  Puerto del servidor (Enter = $PUERTO_DEFECTO)"
        if ([string]::IsNullOrWhiteSpace($respuesta)) { return $PUERTO_DEFECTO }
        $numero = 0
        if ([int]::TryParse($respuesta.Trim(), [ref]$numero) -and $numero -ge 1024 -and $numero -le 65535) { return $numero }
        Write-Host "  Escribe un numero entre 1024 y 65535, o solo Enter para usar $PUERTO_DEFECTO." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "  100 PROGRAMADORES DIJERON - servidor para OBS" -ForegroundColor Cyan
Write-Host ""
if ($Puerto -lt 1024 -or $Puerto -gt 65535) { $Puerto = Pedir-Puerto }

# En la red (celular u otra computadora) Windows exige administrador para escuchar en el puerto
# y para abrirlo en el firewall. Si falta, se vuelve a lanzar este script pidiendo permiso.
if ($Red) {
    $yo = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
    if (-not $yo.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host "Pidiendo permiso de administrador para abrir el puerto $Puerto a la red local..."
        try {
            # Ya lleva el puerto: la ventana de administrador no lo vuelve a preguntar
            Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -NoExit -File `"$PSCommandPath`" -Puerto $Puerto -Red"
        } catch {
            Write-Host "No se dio el permiso: sin el, el celular no se puede conectar." -ForegroundColor Red
            exit 1
        }
        exit 0
    }
}

function Abrir-Firewall([int]$puerto) {
    $regla = "100ProgramadoresDijeron-$puerto"
    $existe = netsh advfirewall firewall show rule name=$regla | Select-String $regla
    if (-not $existe) {
        # Solo equipos de la misma red (localsubnet), no internet
        netsh advfirewall firewall add rule name=$regla dir=in action=allow protocol=TCP localport=$puerto remoteip=localsubnet profile=any | Out-Null
        Write-Host "  Se permitio el puerto $puerto en el firewall de Windows (solo red local): regla $regla" -ForegroundColor DarkGray
    }
}

# Si el puerto esta ocupado se pregunta otro en vez de cerrar la ventana
while ($true) {
    if ($Red) { Abrir-Firewall $Puerto }
    $servidor = New-Object System.Net.HttpListener
    $servidor.Prefixes.Add($(if ($Red) { "http://+:$Puerto/" } else { "http://localhost:$Puerto/" }))
    try { $servidor.Start(); break } catch {
        Write-Host "  El puerto $Puerto esta ocupado por otro programa (o por otro servidor del juego abierto)." -ForegroundColor Red
        $Puerto = Pedir-Puerto
    }
}

$mensajes = New-Object System.Collections.Generic.List[object]
$siguiente = 0

function Responder($ctx, [int]$codigo, [string]$tipo, [byte[]]$bytes) {
    $r = $ctx.Response
    $r.StatusCode = $codigo
    $r.ContentType = $tipo
    $r.Headers["Cache-Control"] = "no-store"
    $r.ContentLength64 = $bytes.Length
    $r.OutputStream.Write($bytes, 0, $bytes.Length)
    $r.OutputStream.Close()
}

function Texto($ctx, [int]$codigo, [string]$texto, [string]$tipo = "text/plain; charset=utf-8") {
    Responder $ctx $codigo $tipo ($utf8.GetBytes($texto))
}

Write-Host ""
Write-Host "  Servidor listo en el puerto $Puerto" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Panel del moderador:   http://localhost:$Puerto/"
Write-Host "  Proyector (OBS):       http://localhost:$Puerto/proyector.html"
if ($Red) {
    # La IP de la red con salida a internet (wifi o cable); las de adaptadores virtuales no sirven al celular
    $ips = @(Get-NetIPConfiguration -ErrorAction SilentlyContinue |
        Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up" } |
        ForEach-Object { $_.IPv4Address.IPAddress })
    if (-not $ips) {
        $ips = @([System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
            Where-Object { $_.AddressFamily -eq "InterNetwork" -and -not $_.ToString().StartsWith("127.") } |
            ForEach-Object { $_.ToString() })
    }
    Write-Host ""
    if ($ips) {
        $linea = "  " + ("=" * 62)
        Write-Host $linea -ForegroundColor Green
        Write-Host "    PARA ENTRAR DESDE OTRA PC O CELULAR (misma red):" -ForegroundColor Green
        Write-Host ""
        foreach ($ip in $ips) {
            Write-Host "    Panel:      " -NoNewline
            Write-Host " http://$($ip):$Puerto/ " -ForegroundColor Black -BackgroundColor Green
        }
        foreach ($ip in $ips) { Write-Host "    Proyector:   http://$($ip):$Puerto/proyector.html  (si OBS esta en otra PC)" }
        Write-Host ""
        Write-Host "    La otra PC o el celular debe estar en la misma red (wifi o cable) que esta." -ForegroundColor DarkGray
        Write-Host $linea -ForegroundColor Green
        $Host.UI.RawUI.WindowTitle = "100 Programadores Dijeron - servidor en http://$($ips[0]):$Puerto/"
    } else {
        Write-Host "  No se encontro la IP de esta PC: revisa que este conectada a una red (wifi o cable)." -ForegroundColor Red
    }
} else {
    Write-Host "  (Solo en esta computadora. Para el celular usa iniciar-servidor-red.bat)" -ForegroundColor DarkGray
}
Write-Host ""
Write-Host "  Deja esta ventana abierta mientras dure el juego. Para detenerlo, cierrala." -ForegroundColor Yellow
Write-Host ""

try {
    while ($servidor.IsListening) {
        $ctx = $servidor.GetContext()
        try {
            $req = $ctx.Request
            $ruta = $req.Url.AbsolutePath

            if ($ruta -eq "/api/ping") { Texto $ctx 200 "ok"; continue }

            if ($ruta -eq "/api/canal") {
                if ($req.HttpMethod -eq "POST") {
                    $de = $req.QueryString["de"]
                    if (($de -ne "panel" -and $de -ne "proyector") -or $req.ContentLength64 -gt $MAX_CUERPO) {
                        Texto $ctx 400 "mensaje invalido"; continue
                    }
                    $lector = New-Object System.IO.StreamReader($req.InputStream, $utf8)
                    $json = $lector.ReadToEnd()
                    $lector.Close()
                    $siguiente++
                    $mensajes.Add([pscustomobject]@{ id = $siguiente; de = $de; json = $json })
                    if ($mensajes.Count -gt $MAX_MENSAJES) { $mensajes.RemoveRange(0, $mensajes.Count - $MAX_MENSAJES) }
                    Texto $ctx 200 "{`"id`":$siguiente}" "application/json"
                } else {
                    $para = $req.QueryString["para"]
                    $lista = @()
                    $desdeTexto = $req.QueryString["desde"]
                    $desde = 0
                    # Sin "desde" (primera consulta) solo se informa el ultimo id, para no repetir mensajes viejos
                    if ($desdeTexto -ne $null -and [int]::TryParse($desdeTexto, [ref]$desde)) {
                        if ($desde -gt $siguiente) { $desde = 0 }   # el servidor se reinicio
                        $lista = @($mensajes | Where-Object { $_.id -gt $desde -and $_.de -ne $para } | ForEach-Object { $_.json })
                    }
                    Texto $ctx 200 ("{`"ultimo`":$siguiente,`"mensajes`":[" + ($lista -join ",") + "]}") "application/json"
                }
                continue
            }

            # Archivos del juego
            $rel = [Uri]::UnescapeDataString($ruta.TrimStart("/"))
            if ($rel -eq "") { $rel = "index.html" }
            $archivo = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($raiz, $rel))
            $dentro = $archivo.StartsWith($raiz + [System.IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)
            $oculto = $rel -match '(^|[\\/])\.'      # .git y similares
            if (-not $dentro -or $oculto -or -not [System.IO.File]::Exists($archivo)) {
                Texto $ctx 404 "No encontrado"; continue
            }
            $tipo = $tipos[[System.IO.Path]::GetExtension($archivo).ToLower()]
            if (-not $tipo) { $tipo = "application/octet-stream" }
            Responder $ctx 200 $tipo ([System.IO.File]::ReadAllBytes($archivo))
        } catch {
            # El navegador cerro la conexion a medio envio, etc.: se ignora y se sigue atendiendo
            try { $ctx.Response.Abort() } catch { }
        }
    }
} finally {
    $servidor.Stop()
}
