from __future__ import annotations
import http.server, socketserver, socket, threading, webbrowser, os
from pathlib import Path
os.chdir(Path(__file__).resolve().parent)
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma','no-cache')
        self.send_header('Expires','0')
        super().end_headers()
    def log_message(self, fmt, *args):
        pass

def free_port(start=8765):
    for p in range(start,start+40):
        with socket.socket() as s:
            try:s.bind(('127.0.0.1',p));return p
            except OSError:pass
    raise RuntimeError('No hay un puerto disponible')
port=free_port()
url=f'http://127.0.0.1:{port}/?nogate=1&preset=low&dpr=1&fast=1&walk=1&ablate=veg,grass,particles,froxels,shell,canopygi,caustics,wind,gi,water'
threading.Timer(.45,lambda:webbrowser.open(url)).start()
print(f'GTA MANUCHO abierto en {url}')
print('Mantén esta ventana abierta mientras juegas.')
with socketserver.ThreadingTCPServer(('127.0.0.1',port),Handler) as httpd:
    httpd.serve_forever()
