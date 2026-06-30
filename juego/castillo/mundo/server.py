from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import socket, threading, time, webbrowser
ROOT=Path(__file__).resolve().parent
GAME='/examples/dungeon_soldier.html'
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.glb':'model/gltf-binary','.gltf':'model/gltf+json; charset=utf-8','.wasm':'application/wasm','.jpg':'image/jpeg'}
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT),**kw)
    def end_headers(self): self.send_header('Cache-Control','no-store'); super().end_headers()
    def log_message(self,fmt,*args): print('[Dungeon Museo]',fmt%args)
def free_port():
    for p in range(8000,8041):
        with socket.socket() as s:
            try:s.bind(('127.0.0.1',p));return p
            except OSError:pass
    raise RuntimeError('No hay puertos libres entre 8000 y 8040.')
def open_game(url): time.sleep(.9); webbrowser.open(url,new=2)
if __name__=='__main__':
    required=['examples/dungeon_soldier.html','examples/models/gltf/dungeon_warkarma.glb','examples/models/gltf/Soldier.glb','examples/jsm/loaders/GLTFLoader.js','examples/jsm/loaders/UltraHDRLoader.js','examples/jsm/utils/BufferGeometryUtils.js','examples/jsm/utils/SkeletonUtils.js','build/three.module.js']
    missing=[x for x in required if not (ROOT/x).is_file()]
    if missing:
        print('\nERROR: faltan archivos:');[print(' -',x) for x in missing];print('\nExtrae TODO el ZIP en una carpeta nueva.');input('Pulsa Enter para cerrar...');raise SystemExit(1)
    port=free_port();url=f'http://127.0.0.1:{port}{GAME}'
    print('\n==============================================\n  DUNGEON - MUSEO INTERACTIVO DEL PLANETA\n==============================================')
    print('Abriendo:',url);print('No cierres esta ventana mientras juegas.\n')
    threading.Thread(target=open_game,args=(url,),daemon=True).start();ThreadingHTTPServer(('127.0.0.1',port),Handler).serve_forever()
