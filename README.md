# Goal Slide Editor & Onboarding Flow

Una herramienta premium y "local-first" para la creación, edición y presentación de diapositivas interactivas para **Goal Systems**. Este proyecto incluye un flujo de Onboarding visualmente impactante y un editor de diapositivas potente que funciona directamente en el navegador.

![Onboarding Preview](assets/onboarding_preview.png) *(Nota: Puedes capturar una imagen y colocarla aquí)*

## 🚀 Características principales

- **Editor de Diapositivas Pro**: Creación y edición en tiempo real de diapositivas con métricas, líneas de tiempo y listas de verificación.
- **Onboarding Flow**: Una experiencia de bienvenida inmersiva con estética futurista y animaciones fluidas.
- **Local-First**: Todos tus proyectos se guardan automáticamente en el `localStorage` de tu navegador. No necesitas base de datos.
- **Exportación Versátil**: Exporta tus presentaciones como archivos JSON para compartir o como HTML estático para presentaciones offline.
- **Modo Presentación**: Visualización a pantalla completa optimizada para proyecciones.
- **Diseño Premium**: Estética moderna con modo oscuro, tipografía *Space Grotesk* y micro-animaciones.

## 🛠️ Cómo usar en local

Este proyecto es puramente frontend y utiliza componentes React cargados vía CDN. Por seguridad del navegador (restricciones de CORS para archivos `.jsx`), **debe ejecutarse a través de un servidor HTTP local**.

### Opción 1: Usando Python (Preinstalado en la mayoría de sistemas)
```bash
python3 -m http.server 8000
```
Luego abre: [http://localhost:8000/Onboarding%20Flow.html](http://localhost:8000/Onboarding%20Flow.html)

### Opción 2: Usando Node.js (Recomendado)
```bash
npx serve .
```
Luego abre: [http://localhost:3000/Onboarding%20Flow.html](http://localhost:3000/Onboarding%20Flow.html)

---

## 📂 Estructura del Proyecto

- `Onboarding Flow.html`: Punto de entrada para la experiencia de bienvenida.
- `Goal Slide Editor.html`: La aplicación principal del editor.
- `editor/`: Contiene los componentes lógicos en formato JSX.
  - `Blocks.jsx`: Definición de los bloques de contenido (Checklists, Timelines, Charts).
  - `EditorShell.jsx`: La interfaz principal del editor y gestión de estado.
  - `Presenter.jsx`: Lógica para el modo presentación.
- `assets/`: Recursos estáticos (logos, imágenes).
- `COMO_USAR_LOCAL.md`: Instrucciones rápidas de ejecución.

## 🧰 Tecnologías utilizadas

- **React 18**: Librería principal de UI.
- **Babel Standalone**: Para transpilar JSX directamente en el navegador.
- **Chart.js**: Para las visualizaciones de datos dinámicas.
- **Google Fonts (Space Grotesk)**: Tipografía personalizada.
- **Material Symbols**: Iconografía moderna.
- **Vanilla CSS**: Sistema de diseño personalizado con variables CSS.

---

Desarrollado por [rgomezqbllos](https://github.com/rgomezqbllos)
