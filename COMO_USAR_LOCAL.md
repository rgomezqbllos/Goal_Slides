# Cómo correr Goal Slide Editor en local

## Requisitos
Solo necesitas un servidor HTTP local (el navegador bloquea archivos `.jsx` cargados directamente desde `file://`).

---

## Opción 1 — Python (sin instalar nada extra)

```bash
# Navega a la carpeta del proyecto
cd /ruta/a/tu/proyecto

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Abre en el navegador: **http://localhost:8000/Goal%20Slide%20Editor.html**

---

## Opción 2 — Node.js (npx, sin instalar nada extra)

```bash
cd /ruta/a/tu/proyecto
npx serve .
```

Abre la URL que aparece en la terminal (normalmente http://localhost:3000).

---

## Opción 3 — VS Code (recomendado para desarrollo)

1. Instala la extensión **Live Server** (Ritwick Dey)
2. Abre la carpeta del proyecto en VS Code
3. Clic derecho sobre `Goal Slide Editor.html` → **"Open with Live Server"**
4. Se abre automáticamente en el navegador con hot-reload

---

## Estructura de archivos necesaria

```
tu-proyecto/
├── Goal Slide Editor.html      ← entrada principal
├── editor/
│   ├── Blocks.jsx
│   ├── EditorShell.jsx
│   └── Presenter.jsx
└── assets/
    └── goal-logo-white.png
```

## Notas
- Los datos se guardan automáticamente en **localStorage** del navegador.
- Para exportar el proyecto usa el botón **Export JSON** y guarda el archivo.
- Para recuperarlo en otra máquina usa **Import JSON**.
- No se necesita backend, base de datos ni Node instalado (salvo para el servidor HTTP).

python3 -m http.server 3000 --bind 127.0.0.1
