import http.server, socketserver, webbrowser, threading, socket, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
def free_port(start=3047):
    for port in range(start,start+50):
        with socket.socket() as s:
            try: s.bind(("127.0.0.1",port)); return port
            except OSError: pass
    return 0
port=free_port()
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control","no-store, no-cache, must-revalidate")
        super().end_headers()
url=f"http://127.0.0.1:{port}/"
threading.Timer(0.8,lambda:webbrowser.open(url)).start()
print(f"GTA MANUCHO abierto en {url}")
with socketserver.ThreadingTCPServer(("127.0.0.1",port),Handler) as httpd: httpd.serve_forever()
