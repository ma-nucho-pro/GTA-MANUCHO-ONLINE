from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import os, socket, webbrowser, threading
os.chdir(os.path.dirname(os.path.abspath(__file__)))
class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin','*')
        super().end_headers()

def free_port(start=8765):
    for port in range(start,start+30):
        with socket.socket() as s:
            try:s.bind(('127.0.0.1',port));return port
            except OSError:pass
    return 8765
port=free_port()
url=f'http://127.0.0.1:{port}/'
threading.Timer(.6,lambda:webbrowser.open(url)).start()
print('GTA MANUCHO abierto en',url)
ThreadingHTTPServer(('127.0.0.1',port),Handler).serve_forever()
