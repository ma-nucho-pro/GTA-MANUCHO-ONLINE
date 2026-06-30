from __future__ import annotations

import http.server
import os
import socket
import socketserver
import threading
import webbrowser
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.wasm': 'application/wasm',
        '.glb': 'model/gltf-binary',
    }

    def end_headers(self) -> None:
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def log_message(self, format: str, *args: object) -> None:
        pass

class ReusableThreadingTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(('127.0.0.1', 0))
        return int(sock.getsockname()[1])

port = free_port()
url = f'http://127.0.0.1:{port}/'
def open_game() -> None:
    candidates = [
        os.path.expandvars(r'%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe'),
        os.path.expandvars(r'%ProgramFiles%\Microsoft\Edge\Application\msedge.exe'),
        os.path.expandvars(r'%ProgramFiles%\Google\Chrome\Application\chrome.exe'),
        os.path.expandvars(r'%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe'),
    ]
    flags = ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--enable-features=WebGPUDeveloperFeatures', url]
    for browser in candidates:
        if browser and Path(browser).is_file():
            try:
                subprocess.Popen([browser, *flags], close_fds=True)
                return
            except OSError:
                pass
    webbrowser.open(url)

threading.Timer(0.8, open_game).start()
print('Tutorial y juego iniciados correctamente.')
print(f'Abriendo: {url}')
print('No cierres esta ventana mientras juegas.')
print('Orden: 1) Tutorial  2) EMPEZAR JUEGO  3) Juego principal')
with ReusableThreadingTCPServer(('127.0.0.1', port), Handler) as server:
    server.serve_forever()
