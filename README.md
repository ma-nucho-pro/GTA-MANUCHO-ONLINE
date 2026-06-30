<div align="center">

<img src="docs/media/Portada.png" alt="Portada de GTA MANUCHO" width="100%">

# GTA MANUCHO V84

### Mundo abierto 3D para navegador · ARKEA AI

**Creado e integrado por Roberto Manuel Jara Peche**  
GitHub: **[ma-nucho-pro](https://github.com/ma-nucho-pro)**

[Instagram](https://www.instagram.com/robertmanuchojp/) · [YouTube ma-nucho / @ManuchoAI](https://www.youtube.com/@ManuchoAI) · [LinkedIn](https://www.linkedin.com/in/roberto-manuel-jara-peche-10867240b/)

</div>

## Sobre el juego

GTA MANUCHO es un juego 3D de mundo abierto creado para ejecutarse directamente en el navegador. Incluye ciudad, personajes, NPC, tráfico, policía, bandas, coches, bicicletas, barcos, aeronaves, helicópteros, tanques, propiedades, cámaras en primera y tercera persona, mar, islas y vida submarina.

La versión V84 corrige el comportamiento del agua: el jugador entra en modo natación en mar abierto, mientras que los NPC, policías, coches, patrullas y tanques permanecen en tierra. El océano usa el addon `Water` de Three.js y las nubes utilizan una textura local ligera inspirada en el enfoque del ejemplo oficial de nubes volumétricas de Three.js.

> Este repositorio no necesita un archivo `.bat` ni `.cmd` para publicarse. Es un sitio web estático preparado para GitHub Pages o un hosting convencional.

## Clips del juego

<p align="center">
  <img src="docs/media/GTA-MANUCHO-VIDEO-1.webp" alt="Clip animado 1 de GTA MANUCHO" width="31%">
  <img src="docs/media/GTA-MANUCHO-VIDEO-2.webp" alt="Clip animado 2 de GTA MANUCHO" width="31%">
  <img src="docs/media/GTA-MANUCHO-VIDEO-3.webp" alt="Clip animado 3 de GTA MANUCHO" width="31%">
</p>

La presentación inicial selecciona aleatoriamente las capturas y clips animados proporcionados, acompañándolos con textos sobre coches, policía, mar, aeronaves y exploración.

## Capturas

<p align="center">
  <img src="docs/media/GTA-MANUCHO-1.png" alt="GTA MANUCHO captura 1" width="48%">
  <img src="docs/media/GTA-MANUCHO-2.png" alt="GTA MANUCHO captura 2" width="48%">
</p>

<p align="center">
  <img src="docs/media/GTA-MANUCHO-3.png" alt="GTA MANUCHO captura 3" width="48%">
  <img src="docs/media/GTA-MANUCHO-4.png" alt="GTA MANUCHO captura 4" width="48%">
</p>

<p align="center">
  <img src="docs/media/GTA-MANUCHO-5.png" alt="GTA MANUCHO captura 5" width="31%">
  <img src="docs/media/GTA-MANUCHO-6.png" alt="GTA MANUCHO captura 6" width="31%">
  <img src="docs/media/GTA-MANUCHO-7.png" alt="GTA MANUCHO captura 7" width="31%">
</p>

<details>
<summary>Ver más capturas</summary>

<p align="center">
  <img src="docs/media/GTA-MANUCHO-8.png" alt="GTA MANUCHO captura 8" width="31%">
  <img src="docs/media/GTA-MANUCHO-9.png" alt="GTA MANUCHO captura 9" width="31%">
  <img src="docs/media/GTA-MANUCHO-10.png" alt="GTA MANUCHO captura 10" width="31%">
</p>

</details>

## Cambios principales de la V84

- Natación automática y animación reforzada de brazos, piernas y cuerpo en mar abierto.
- El agua visual queda fuera de las colisiones y de los raycasts usados para detectar el suelo.
- Los NPC y policías que intenten entrar al mar regresan a su última posición segura.
- Los coches, patrullas y tanques no pueden circular por el agua.
- Reflejos del océano con actualización adaptativa para reducir congelaciones y tirones.
- Nubes texturizadas realistas y ligeras, sin depender de una imagen externa durante la partida.
- Presentación aleatoria con imágenes y clips WebP del juego.
- Proyecto preparado para GitHub Pages y hosting web, sin lanzadores CMD/BAT.
- Créditos, licencia de código abierto y documentación incorporados.

## Jugar desde GitHub Pages

### 1. Crear el repositorio

En GitHub, crea un repositorio nuevo. Un nombre recomendado es:

```text
GTA-MANUCHO
```

No marques la opción de crear otro README, porque este proyecto ya lo incluye.

### 2. Subir el proyecto completo

Sube **todo el contenido de esta carpeta**, no solamente `index.html`. Debes conservar exactamente carpetas como:

```text
assets/
docs/
juego/
menu-animations/
.github/
index.html
README.md
LICENSE
NOTICE.md
```

El archivo principal del sitio es `index.html`. El juego principal también puede abrirse directamente desde `juego/index.html?noprogressive=1`.

### 3. Activar GitHub Pages

En el repositorio, abre:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

El archivo `.github/workflows/pages.yml` publicará automáticamente el proyecto después de cada cambio enviado a las ramas `main` o `master`.

### 4. Abrir el enlace

Cuando la acción termine correctamente, GitHub mostrará una dirección parecida a:

```text
https://ma-nucho-pro.github.io/GTA-MANUCHO/
```

El nombre final depende del nombre real del repositorio.

## Publicar en un hosting propio

El proyecto es estático. Funciona en un hosting que permita servir archivos HTML, CSS, JavaScript, imágenes, WebP, audio y modelos 3D.

1. Entra al administrador de archivos o al FTP de tu hosting.
2. Abre la carpeta pública, normalmente `public_html`, `www` o `htdocs`.
3. Sube **el contenido completo** del proyecto conservando todas las carpetas.
4. Comprueba que `index.html` quede directamente dentro de la carpeta pública.
5. Visita tu dominio con HTTPS.

Ejemplo de estructura:

```text
public_html/
├── index.html
├── project-credits.js
├── startup-intro.js
├── assets/
├── docs/
├── juego/
└── menu-animations/
```

No se necesita PHP, una base de datos ni Node.js para publicar esta versión. El servidor debe respetar las rutas relativas y servir correctamente archivos `.js`, `.glb`, `.gltf`, `.bin`, `.webp`, `.png`, `.jpg`, `.mp3` y `.wav`.

## Probarlo localmente sin BAT ni CMD

La forma gráfica más sencilla es abrir la carpeta con Visual Studio Code, instalar la extensión **Live Server** y pulsar **Go Live**. Luego abre la dirección que muestre la extensión.

Los módulos JavaScript y los modelos 3D deben cargarse mediante `http://` o `https://`; abrir `index.html` directamente con `file://` puede bloquear recursos por seguridad del navegador.

## Controles principales

| Acción | Control |
|---|---|
| Moverse | W, A, S, D o flechas |
| Correr / nadar más rápido | Shift |
| Saltar / subir en el agua | Espacio |
| Sumergirse | Mantener clic del ratón |
| Interactuar / subir o bajar | E |
| Cambiar cámara | V |
| Cámara alternativa de vehículo | C |
| Reiniciar cámara | R |
| Primera / tercera persona | V según el estado |

Los controles adicionales aparecen dentro de la interfaz del juego según el vehículo, arma o zona activa.

## Estructura técnica

```text
GTA-MANUCHO/
├── index.html                         # Tutorial y presentación inicial
├── startup-intro.js                  # Galería aleatoria de imágenes y clips
├── project-credits.js                # Firma pública y metadatos del creador
├── juego/
│   ├── index.html                    # Juego principal
│   ├── assets/index-CXrFrkSv.js      # Compilación completa del juego
│   ├── marine-world-v84.js           # Natación, mar, barcos, nubes y seguridad
│   ├── city-extras-loader.js         # Carga progresiva de sistemas
│   └── marine-assets/                # Water, normales y textura local de nubes
├── docs/media/                       # Portada, capturas y clips WebP
├── .github/workflows/pages.yml       # Publicación automática
├── LICENSE
└── NOTICE.md
```

## Rendimiento

La V84 conserva los sistemas existentes y reduce bloqueos en el entorno marino mediante reflejos limitados según la carga del fotograma, nubes formadas por planos instanciados y comprobaciones de seguridad repartidas en intervalos cortos. Los modelos marinos continúan cargándose por turnos para evitar concentrar todo el trabajo en un solo fotograma.

En equipos con pocos recursos, cierra otras pestañas pesadas y utiliza los ajustes gráficos incluidos en el propio juego.

## Autor y redes oficiales

**Roberto Manuel Jara Peche**  
Creador e integrador de **GTA MANUCHO**  
Marca: **ARKEA AI / Manucho**  
GitHub: **[ma-nucho-pro](https://github.com/ma-nucho-pro)**  
Instagram: **[robertmanuchojp](https://www.instagram.com/robertmanuchojp/)**  
YouTube: **[ma-nucho · @ManuchoAI](https://www.youtube.com/@ManuchoAI)**  
LinkedIn: **[Roberto Manuel Jara Peche](https://www.linkedin.com/in/roberto-manuel-jara-peche-10867240b/)**

## Licencia y uso

El código original creado para este proyecto se distribuye bajo la licencia MIT. Puedes estudiar, usar, modificar y compartir el código, pero debes conservar el aviso de copyright, el archivo `LICENSE`, el archivo `NOTICE.md` y los créditos a:

```text
Roberto Manuel Jara Peche
GitHub: ma-nucho-pro
ARKEA AI / Manucho
```

Las bibliotecas, modelos, texturas, sonidos, tipografías y demás recursos de terceros conservan sus respectivas licencias y autores. Consulta [LICENSE](LICENSE) y [NOTICE.md](NOTICE.md).

---

<div align="center">

**GTA MANUCHO V84 · HECHO POR ROBERTO MANUEL JARA PECHE · ARKEA AI**

</div>
