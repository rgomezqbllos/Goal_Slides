// animation diagrams/diagrams-registry.jsx
// Shared registry of diagram plugins. Both the slide editor and the diagram
// studios consume this object so they agree on ids, default tweaks, the
// tweaks→props mapping and which window component renders each diagram.
//
// Each plugin must register itself here AND expose its renderer on `window`
// (e.g. window.RouteDiagram). Add new diagrams by appending to GS_DIAGRAMS.

(function () {
  const REG = (window.GS_DIAGRAMS = window.GS_DIAGRAMS || {});

  // ─── DIAG-001 · Animated Route ─────────────────────────────────────────────
  REG.route = {
    id: 'route',
    label: 'Animated Route',
    description: 'A bus traverses a parametric path, lighting up each stop. Optional battery overlay drains as it travels.',
    icon: 'route',
    galleryUrl: 'animation diagrams/Diagram Library.html',
    studioUrl: 'animation diagrams/Route Diagram.html',
    // Default tweak set — mirrors TWEAK_DEFAULTS in Route Diagram.html so that
    // inserting from the gallery (without opening the studio) still produces a
    // sensible diagram.
    defaultTweaks: {
      stopsCount: 5,
      speed: 1,
      pauseAtStops: true,
      showLabels: true,
      colorMode: 'brand',
      busStyle: 'badge',
      curvature: 0.55,
      trackStyle: 'dashed',
      showProgress: true,
      loop: true,
      showBattery: true,
      batteryStart: 100,
      batteryEnd: 5,
      batteryHigh: 60,
      batteryMid: 25,
      stop1Label: 'Welcome',         stop1Caption: 'Account & access',
      stop2Label: 'Training',        stop2Caption: 'Required modules',
      stop3Label: 'Parametrization', stop3Caption: 'Operational config',
      stop4Label: 'Configuration',   stop4Caption: 'Integrations & roles',
      stop5Label: 'Support',         stop5Caption: 'SLA & deployment',
      stop6Label: 'Go Live',         stop6Caption: 'Full rollout',
      stop7Label: 'Operate',         stop7Caption: 'Continuous ops',
      stop8Label: 'Optimize',        stop8Caption: 'KPIs & insights',
    },
    // Schema consumed by the slide editor's right-panel inline form.
    // Types: 'section' | 'number' | 'boolean' | 'select' | 'string' | 'stops' | 'colorStops'
    // Labels and option labels accept either a plain string or a per-locale
    // map { en, es, … } resolved at render time using the active editor lang.
    schema: [
      { type:'section', label:{ en:'Route', es:'Ruta' } },
      { type:'number',  key:'stopsCount',  label:{ en:'Stops', es:'Paradas' }, min:3, max:8, step:1 },
      { type:'number',  key:'curvature',   label:{ en:'Curvature', es:'Curvatura' }, min:0, max:1, step:0.05, slider:true },
      { type:'select',  key:'trackStyle',  label:{ en:'Track', es:'Vía' },
        options:['solid','dashed'],
        optionLabels:{ solid:{ en:'Solid', es:'Sólida' }, dashed:{ en:'Dashed', es:'Discontinua' } } },

      { type:'section', label:{ en:'Animation', es:'Animación' } },
      { type:'number',  key:'speed',        label:{ en:'Speed', es:'Velocidad' }, min:0.2, max:3, step:0.1, slider:true },
      { type:'boolean', key:'pauseAtStops', label:{ en:'Pause at stops', es:'Pausar en paradas' } },
      { type:'boolean', key:'loop',         label:{ en:'Loop', es:'Repetir' } },
      { type:'boolean', key:'showProgress', label:{ en:'Show progress %', es:'Mostrar progreso %' } },

      { type:'section', label:{ en:'Style', es:'Estilo' } },
      { type:'select',  key:'colorMode', label:{ en:'Palette', es:'Paleta' },
        options:['brand','multi'],
        optionLabels:{ brand:{ en:'Brand', es:'Marca' }, multi:{ en:'Multi', es:'Multi' } } },
      { type:'select',  key:'busStyle',  label:{ en:'Bus marker', es:'Marcador del bus' },
        options:['badge','pin','dot','plate'],
        optionLabels:{
          badge:{ en:'Badge', es:'Insignia' }, pin:{ en:'Pin', es:'Alfiler' },
          dot:{ en:'Dot', es:'Punto' },        plate:{ en:'Plate', es:'Placa' },
        } },
      { type:'boolean', key:'showLabels', label:{ en:'Stop labels', es:'Etiquetas de paradas' } },

      { type:'section', label:{ en:'Battery overlay', es:'Batería' } },
      { type:'boolean', key:'showBattery',  label:{ en:'Show battery', es:'Mostrar batería' } },
      { type:'number',  key:'batteryStart', label:{ en:'Start %', es:'Inicio %' }, min:5, max:100, step:1 },
      { type:'number',  key:'batteryEnd',   label:{ en:'End %',   es:'Final %'  }, min:0, max:95,  step:1 },
      { type:'number',  key:'batteryHigh',  label:{ en:'≥ Green at',  es:'≥ Verde en'    }, min:1, max:99, step:1 },
      { type:'number',  key:'batteryMid',   label:{ en:'≥ Yellow at', es:'≥ Amarillo en' }, min:1, max:99, step:1 },

      // Special editor that walks stop1Label/stop1Caption … driven by stopsCount
      { type:'stops', key:'_stops', label:{ en:'Stop content', es:'Contenido de paradas' },
        countKey:'stopsCount', labelKeyPattern:'stop{N}Label', captionKeyPattern:'stop{N}Caption',
        i18n:{ en:{ header:'Stop', placeholder:'Stop %s label' },
                es:{ header:'Parada', placeholder:'Etiqueta de la parada %s' } } },
    ],
    // Convert the studio tweak object (flat keys with stopNLabel/stopNCaption)
    // into the props that <RouteDiagram> expects.
    tweaksToProps(t) {
      t = t || {};
      const n = Math.max(1, parseInt(t.stopsCount, 10) || 5);
      const stops = Array.from({ length: n }, (_, i) => ({
        id: `s${i + 1}`,
        label:   t[`stop${i + 1}Label`]   || `Stop ${i + 1}`,
        caption: t[`stop${i + 1}Caption`] || '',
      }));
      return {
        stops,
        speed:        t.speed,
        pauseAtStops: t.pauseAtStops,
        showLabels:   t.showLabels,
        colorMode:    t.colorMode,
        busStyle:     t.busStyle,
        curvature:    t.curvature,
        trackStyle:   t.trackStyle,
        showProgress: t.showProgress,
        loop:         t.loop,
        showBattery:  t.showBattery,
        batteryStart: t.batteryStart,
        batteryEnd:   t.batteryEnd,
        batteryHigh:  t.batteryHigh,
        batteryMid:   t.batteryMid,
      };
    },
    // Resolve the renderer at call time (the plugin script may load after this
    // registry runs).
    getComponent() { return window.RouteDiagram; },
  };

  // ─── DIAG-003 · KPI Counter ────────────────────────────────────────────────
  REG.kpi = {
    id: 'kpi',
    label: 'KPI Counter',
    description: 'Animated number ticker for headline metrics. Ramps from a start to a target value while crossing user-defined color thresholds.',
    icon: 'speed',
    galleryUrl: 'animation diagrams/Diagram Library.html',
    studioUrl:  'animation diagrams/KPI Counter.html',
    defaultTweaks: {
      from: 0,
      to: 94.7,
      duration: 2000,
      decimals: 1,
      format: 'number',          // number | integer | time | date
      prefix: '',
      suffix: '%',
      caption: 'On-time arrivals',
      size: 'xl',                // sm | md | lg | xl
      align: 'center',           // left | center | right (horizontal)
      valign: 'middle',          // top  | middle | bottom (vertical)
      easing: 'ease-out',         // linear | ease-in | ease-out | ease-in-out
      showProgress: false,
      colorStops: [
        { at: 0,  color: '#ff7775' },
        { at: 60, color: '#fae374' },
        { at: 85, color: '#83e287' },
        { at: 95, color: '#42dcc6' },
      ],
    },
    tweaksToProps(t) {
      t = t || {};
      return {
        from:         parseFloat(t.from)         || 0,
        to:           parseFloat(t.to)           || 0,
        duration:     parseInt(t.duration, 10)   || 0,
        decimals:     parseInt(t.decimals, 10)   || 0,
        format:       t.format       || 'number',
        prefix:       t.prefix       || '',
        suffix:       t.suffix       || '',
        caption:      t.caption      || '',
        size:         t.size         || 'lg',
        align:        t.align        || 'center',
        valign:       t.valign       || 'middle',
        easing:       t.easing       || 'ease-out',
        showProgress: !!t.showProgress,
        colorStops:   Array.isArray(t.colorStops) ? t.colorStops : [],
      };
    },
    schema: [
      { type:'section', label:{ en:'Value', es:'Valor' } },
      { type:'number',  key:'from',     label:{ en:'From', es:'Desde' }, min:-1000000, max:1000000, step:0.1 },
      { type:'number',  key:'to',       label:{ en:'To',   es:'Hasta' }, min:-1000000, max:1000000, step:0.1 },
      { type:'select',  key:'format',   label:{ en:'Format', es:'Formato' },
        options:['number','integer','time','date'],
        optionLabels:{
          number:  { en:'Number',  es:'Número' },
          integer: { en:'Integer', es:'Entero' },
          time:    { en:'Time',    es:'Hora' },
          date:    { en:'Date',    es:'Fecha' },
        } },
      { type:'number',  key:'decimals', label:{ en:'Decimals', es:'Decimales' }, min:0, max:6, step:1 },
      { type:'string',  key:'prefix',   label:{ en:'Prefix', es:'Prefijo' } },
      { type:'string',  key:'suffix',   label:{ en:'Suffix', es:'Sufijo' } },

      { type:'section', label:{ en:'Animation', es:'Animación' } },
      { type:'number',  key:'duration',     label:{ en:'Duration (ms)', es:'Duración (ms)' }, min:0, max:10000, step:50 },
      { type:'select',  key:'easing',       label:{ en:'Easing', es:'Curva' },
        options:['linear','ease-in','ease-out','ease-in-out'],
        optionLabels:{
          linear:        { en:'Linear',      es:'Lineal' },
          'ease-in':     { en:'Ease in',     es:'Entrada' },
          'ease-out':    { en:'Ease out',    es:'Salida' },
          'ease-in-out': { en:'Ease in-out', es:'Entrada-salida' },
        } },
      { type:'boolean', key:'showProgress', label:{ en:'Show progress bar', es:'Mostrar barra de progreso' } },

      { type:'section', label:{ en:'Style', es:'Estilo' } },
      { type:'select',  key:'size',  label:{ en:'Size', es:'Tamaño' },
        options:['sm','md','lg','xl'],
        optionLabels:{
          sm:{ en:'SM', es:'SM' }, md:{ en:'MD', es:'MD' },
          lg:{ en:'LG', es:'LG' }, xl:{ en:'XL', es:'XL' },
        } },
      { type:'select',  key:'align', label:{ en:'Horizontal align', es:'Alineación horizontal' },
        options:['left','center','right'],
        optionLabels:{
          left:   { en:'Left',   es:'Izquierda' },
          center: { en:'Center', es:'Centro' },
          right:  { en:'Right',  es:'Derecha' },
        } },
      { type:'select',  key:'valign', label:{ en:'Vertical align', es:'Alineación vertical' },
        options:['top','middle','bottom'],
        optionLabels:{
          top:    { en:'Top',    es:'Arriba' },
          middle: { en:'Middle', es:'Centro' },
          bottom: { en:'Bottom', es:'Abajo' },
        } },

      { type:'section', label:{ en:'Color thresholds', es:'Umbrales de color' } },
      { type:'colorStops', key:'colorStops', label:{ en:'Stops (≥ value → color)', es:'Umbrales (≥ valor → color)' } },

      { type:'section', label:{ en:'Caption', es:'Subtítulo' } },
      { type:'string', key:'caption', label:{ en:'Caption text', es:'Texto del subtítulo' } },
    ],
    getComponent() { return window.KPICounter; },
  };

  // ─── DIAG-006 · Map Route ──────────────────────────────────────────────────
  REG.mapRoute = {
    id: 'mapRoute',
    label: { en: 'Map Route', es: 'Ruta de mapa' },
    description: 'Procedural city street network with an animated shortest-path search between two points.',
    icon: 'map',
    galleryUrl: 'animation diagrams/Diagram Library.html',
    studioUrl:  'animation diagrams/Map Route.html',
    defaultTweaks: {
      density: 24,
      seed: 1,
      searchDuration: 3500,
      pathDuration:   1200,
      pauseDuration:  800,
      loop: true,
      networkColor: '#7a3d10',
      searchColor:  '#ffb066',
      routeColor:   '#ffffff',
      nodeColor:    '#ffffff',
      shape:    'square',
      rotateX:  0,
      rotateY:  0,
    },
    tweaksToProps(t) {
      t = t || {};
      return {
        density:        parseInt(t.density, 10)        || 24,
        seed:           parseInt(t.seed, 10)           || 1,
        searchDuration: parseInt(t.searchDuration, 10) || 0,
        pathDuration:   parseInt(t.pathDuration, 10)   || 0,
        pauseDuration:  parseInt(t.pauseDuration, 10)  || 0,
        loop:           !!t.loop,
        networkColor: t.networkColor || '#7a3d10',
        searchColor:  t.searchColor  || '#ffb066',
        routeColor:   t.routeColor   || '#ffffff',
        nodeColor:    t.nodeColor    || '#ffffff',
        shape:    t.shape   || 'square',
        rotateX:  parseFloat(t.rotateX) || 0,
        rotateY:  parseFloat(t.rotateY) || 0,
      };
    },
    schema: [
      { type:'section', label:{ en:'Network', es:'Red' } },
      { type:'number',  key:'density', label:{ en:'Density', es:'Densidad' }, min:8, max:36, step:1 },
      { type:'number',  key:'seed',    label:{ en:'Random seed', es:'Semilla aleatoria' }, min:1, max:9999, step:1 },

      { type:'section', label:{ en:'Animation', es:'Animación' } },
      { type:'number',  key:'searchDuration', label:{ en:'Search duration (ms)', es:'Duración de búsqueda (ms)' }, min:0, max:10000, step:50 },
      { type:'number',  key:'pathDuration',   label:{ en:'Path duration (ms)',   es:'Duración del trazo (ms)'   }, min:0, max:5000,  step:50 },
      { type:'number',  key:'pauseDuration',  label:{ en:'Pause (ms)',           es:'Pausa (ms)'                }, min:0, max:5000,  step:50 },
      { type:'boolean', key:'loop',           label:{ en:'Loop', es:'Repetir' } },

      { type:'section', label:{ en:'Colors', es:'Colores' } },
      { type:'color',   key:'networkColor', label:{ en:'Streets',          es:'Calles' } },
      { type:'color',   key:'searchColor',  label:{ en:'Search highlight', es:'Resaltado de búsqueda' } },
      { type:'color',   key:'routeColor',   label:{ en:'Found route',      es:'Ruta encontrada' } },
      { type:'color',   key:'nodeColor',    label:{ en:'Endpoints',        es:'Puntos' } },

      { type:'section', label:{ en:'Shape', es:'Forma' } },
      { type:'select',  key:'shape', label:{ en:'Shape', es:'Forma' },
        options:['square','circle','ellipse','triangle','hexagon','diamond','octagon'],
        optionLabels:{
          square:   { en:'Square',    es:'Cuadrado' },
          circle:   { en:'Circle',    es:'Círculo' },
          ellipse:  { en:'Ellipse',   es:'Elipse' },
          triangle: { en:'Triangle',  es:'Triángulo' },
          hexagon:  { en:'Hexagon',   es:'Hexágono' },
          diamond:  { en:'Diamond',   es:'Diamante' },
          octagon:  { en:'Octagon',   es:'Octágono' },
        } },
      { type:'number',  key:'rotateX', label:{ en:'Tilt X (3D)', es:'Inclinación X (3D)' }, min:-60, max:60, step:1, slider:true },
      { type:'number',  key:'rotateY', label:{ en:'Rotate Y (3D)', es:'Rotación Y (3D)' }, min:-60, max:60, step:1, slider:true },
    ],
    getComponent() { return window.MapRouteDiagram; },
  };

  // ─── DIAG-008 · Funnel ────────────────────────────────────────────────────
  REG.funnel = {
    id: 'funnel',
    label: { en: 'Funnel', es: 'Embudo' },
    description: 'Conversion funnel with staggered entrance, particle flow, dynamic glow lights, shimmer sweeps, and draggable labels with arrow connectors.',
    icon: 'filter_alt',
    galleryUrl: 'animation diagrams/Diagram Library.html',
    studioUrl:  'animation diagrams/Funnel.html',
    defaultTweaks: {
      stagesText:
        'Awareness|12,400|Top of funnel\n' +
        'Interest|8,200|Marketing qualified\n' +
        'Consideration|3,600|Product page views\n' +
        'Intent|1,800|Trial starts\n' +
        'Conversion|540|Paid customers',
      colorTop:        '#42dcc6',
      colorBottom:     '#8b5cf6',
      showValues:      true,
      showSub:         true,
      showPercentages: true,
      showArrows:      true,
      particleMode:    'flow',
      particleDensity: 40,
      entranceAnim:    true,
      glowIntensity:   60,
      labelSide:       'right',
      align:           'center',
      valign:          'middle',
    },
    tweaksToProps(t) {
      t = t || {};
      return {
        stagesText:      typeof t.stagesText === 'string' ? t.stagesText : '',
        colorTop:        t.colorTop     || '#42dcc6',
        colorBottom:     t.colorBottom  || '#8b5cf6',
        showValues:      t.showValues      !== false,
        showSub:         t.showSub         !== false,
        showPercentages: t.showPercentages !== false,
        showArrows:      t.showArrows      !== false,
        particleMode:    t.particleMode    || 'flow',
        particleDensity: parseInt(t.particleDensity, 10) !== undefined ? parseInt(t.particleDensity, 10) : 40,
        entranceAnim:    t.entranceAnim    !== false,
        glowIntensity:   parseInt(t.glowIntensity, 10)   !== undefined ? parseInt(t.glowIntensity, 10)   : 60,
        labelSide:       t.labelSide  || 'right',
        align:           t.align      || 'center',
        valign:          t.valign     || 'middle',
      };
    },
    schema: [
      { type:'section', label:{ en:'Stages', es:'Etapas' } },
      { type:'string',  key:'stagesText',
        label:{ en:'Stages (label|value|sublabel)', es:'Etapas (nombre|valor|subtítulo)' },
        multiline:true, rows:7, mono:true,
        placeholder:'Awareness|12,400|Top of funnel\nConversion|540|Paid customers' },

      { type:'section', label:{ en:'Colors', es:'Colores' } },
      { type:'color', key:'colorTop',    label:{ en:'Top color',    es:'Color superior' } },
      { type:'color', key:'colorBottom', label:{ en:'Bottom color', es:'Color inferior' } },

      { type:'section', label:{ en:'Labels', es:'Etiquetas' } },
      { type:'select',  key:'labelSide', label:{ en:'Label side', es:'Lado de etiqueta' },
        options:['right','left'],
        optionLabels:{ right:{ en:'Right', es:'Derecha' }, left:{ en:'Left', es:'Izquierda' } } },
      { type:'boolean', key:'showValues',      label:{ en:'Show values',       es:'Mostrar valores' } },
      { type:'boolean', key:'showSub',         label:{ en:'Show subtitles',    es:'Mostrar subtítulos' } },
      { type:'boolean', key:'showPercentages', label:{ en:'Show % of top',     es:'Mostrar % del total' } },

      { type:'section', label:{ en:'Animation', es:'Animación' } },
      { type:'boolean', key:'entranceAnim',  label:{ en:'Entrance animation', es:'Animación de entrada' } },
      { type:'boolean', key:'showArrows',    label:{ en:'Flow arrows',        es:'Flechas de flujo' } },
      { type:'select',  key:'particleMode',  label:{ en:'Particles', es:'Partículas' },
        options:['flow','none'],
        optionLabels:{ flow:{ en:'Flow', es:'Flujo' }, none:{ en:'None', es:'Ninguna' } } },
      { type:'number',  key:'particleDensity', label:{ en:'Particle density', es:'Densidad de partículas' }, min:0, max:100, step:5, slider:true },
      { type:'number',  key:'glowIntensity',   label:{ en:'Glow intensity',   es:'Intensidad de brillo' },  min:0, max:100, step:5, slider:true },

      { type:'section', label:{ en:'Alignment', es:'Alineación' } },
      { type:'select',  key:'align',  label:{ en:'Horizontal', es:'Horizontal' },
        options:['left','center','right'],
        optionLabels:{ left:{ en:'Left', es:'Izquierda' }, center:{ en:'Center', es:'Centro' }, right:{ en:'Right', es:'Derecha' } } },
      { type:'select',  key:'valign', label:{ en:'Vertical', es:'Vertical' },
        options:['top','middle','bottom'],
        optionLabels:{ top:{ en:'Top', es:'Arriba' }, middle:{ en:'Middle', es:'Centro' }, bottom:{ en:'Bottom', es:'Abajo' } } },
    ],
    getComponent() { return window.FunnelDiagram; },
  };

  // ─── DIAG-007 · Chips ──────────────────────────────────────────────────────
  REG.chips = {
    id: 'chips',
    label: { en: 'Chips', es: 'Etiquetas' },
    description: 'Rows of pill-shaped chips. Responsive to text length, color palette with alternate / random / mono modes, optional pulse animation, and cell-relative alignment.',
    icon: 'label',
    galleryUrl: 'animation diagrams/Diagram Library.html',
    studioUrl:  'animation diagrams/Chips.html',
    defaultTweaks: {
      chipsText:
        'focus\ntech-equipped\ncreativity\ncoffee\ncommunity\n' +
        'coworking\nproductivity\ninspiration\nflexible\n' +
        'workshops\ncollaboration\nstudio',
      rows: 3,
      colorMode: 'alternate',
      bg1: '#5a1f23', fg1: '#f0d871',
      bg2: '#f0d871', fg2: '#5a1f23',
      borderRadius: 999,
      paddingX: 18,
      paddingY: 8,
      gap: 10,
      fontSize: 16,
      fontWeight: 600,
      animation: 'none',
      pulseDuration: 2400,
      align: 'center',
      valign: 'middle',
    },
    tweaksToProps(t) {
      t = t || {};
      const palette = [
        { bg: t.bg1 || '#5a1f23', fg: t.fg1 || '#f0d871' },
        { bg: t.bg2 || '#f0d871', fg: t.fg2 || '#5a1f23' },
      ];
      return {
        chipsText:     typeof t.chipsText === 'string' ? t.chipsText : '',
        rows:          parseInt(t.rows, 10)          || 3,
        colorMode:     t.colorMode     || 'alternate',
        palette,
        borderRadius:  parseInt(t.borderRadius, 10)  || 0,
        paddingX:      parseInt(t.paddingX, 10)      || 0,
        paddingY:      parseInt(t.paddingY, 10)      || 0,
        gap:           parseInt(t.gap, 10)           || 0,
        fontSize:      parseInt(t.fontSize, 10)      || 14,
        fontWeight:    parseInt(t.fontWeight, 10)    || 500,
        animation:     t.animation     || 'none',
        pulseDuration: parseInt(t.pulseDuration, 10) || 2400,
        align:         t.align         || 'center',
        valign:        t.valign        || 'middle',
      };
    },
    schema: [
      { type:'section', label:{ en:'Content', es:'Contenido' } },
      { type:'string',  key:'chipsText',
        label:{ en:'Chips (one per line · optional "text|#bg|#fg")',
                 es:'Chips (uno por línea · opcional "texto|#fondo|#texto")' },
        multiline:true, rows:8, mono:true,
        placeholder:'focus\ntech-equipped\ncreativity\ncoffee|#5a1f23|#f0d871' },
      { type:'number',  key:'rows', label:{ en:'Rows', es:'Filas' }, min:1, max:8, step:1 },

      { type:'section', label:{ en:'Colors', es:'Colores' } },
      { type:'select',  key:'colorMode', label:{ en:'Color mode', es:'Modo de color' },
        options:['alternate','random','mono'],
        optionLabels:{
          alternate:{ en:'Alternate', es:'Alternar' },
          random:   { en:'Random',    es:'Aleatorio' },
          mono:     { en:'Single',    es:'Único' },
        } },
      { type:'color',   key:'bg1', label:{ en:'Color A · background', es:'Color A · fondo' } },
      { type:'color',   key:'fg1', label:{ en:'Color A · text',       es:'Color A · texto' } },
      { type:'color',   key:'bg2', label:{ en:'Color B · background', es:'Color B · fondo' } },
      { type:'color',   key:'fg2', label:{ en:'Color B · text',       es:'Color B · texto' } },

      { type:'section', label:{ en:'Shape & spacing', es:'Forma y espaciado' } },
      { type:'number',  key:'borderRadius', label:{ en:'Border radius', es:'Redondeo' }, min:0, max:999, step:1, slider:true },
      { type:'number',  key:'paddingX', label:{ en:'Padding X', es:'Margen interior X' }, min:4,  max:60, step:1 },
      { type:'number',  key:'paddingY', label:{ en:'Padding Y', es:'Margen interior Y' }, min:2,  max:40, step:1 },
      { type:'number',  key:'gap',      label:{ en:'Gap',       es:'Separación'        }, min:0,  max:48, step:1 },
      { type:'number',  key:'fontSize', label:{ en:'Font size', es:'Tamaño del texto'  }, min:8,  max:48, step:1 },
      { type:'number',  key:'fontWeight', label:{ en:'Font weight', es:'Grosor' }, min:300, max:900, step:100 },

      { type:'section', label:{ en:'Animation', es:'Animación' } },
      { type:'select',  key:'animation', label:{ en:'Animation', es:'Animación' },
        options:['none','pulse','fade'],
        optionLabels:{
          none:  { en:'None',  es:'Ninguna' },
          pulse: { en:'Pulse', es:'Palpitar' },
          fade:  { en:'Fade',  es:'Desvanecer' },
        } },
      { type:'number',  key:'pulseDuration', label:{ en:'Animation duration (ms)', es:'Duración (ms)' }, min:400, max:8000, step:100 },

      { type:'section', label:{ en:'Alignment', es:'Alineación' } },
      { type:'select',  key:'align', label:{ en:'Horizontal align', es:'Alineación horizontal' },
        options:['left','center','right'],
        optionLabels:{
          left:   { en:'Left',   es:'Izquierda' },
          center: { en:'Center', es:'Centro' },
          right:  { en:'Right',  es:'Derecha' },
        } },
      { type:'select',  key:'valign', label:{ en:'Vertical align', es:'Alineación vertical' },
        options:['top','middle','bottom'],
        optionLabels:{
          top:    { en:'Top',    es:'Arriba' },
          middle: { en:'Middle', es:'Centro' },
          bottom: { en:'Bottom', es:'Abajo' },
        } },
    ],
    getComponent() { return window.ChipsDiagram; },
  };
})();

// ─── postMessage protocol (between editor host and library/studio iframes) ──
// Editor → iframe (optional, sent on iframe load):
//   { type: 'gs:diagram-pick:hello', currentDiagramId, currentTweaks }
// Iframe → editor:
//   { type: 'gs:diagram-pick:select', diagramId, tweaks }
//   { type: 'gs:diagram-pick:cancel' }
//   { type: 'gs:diagram-pick:nav',    diagramId }   // gallery → studio
//
// Studios load initial tweaks from location.hash:
//   #tweaks=<encodeURIComponent(JSON.stringify(tweaks))>
window.GS_DIAGRAM_PICK = {
  parseTweaksHash() {
    try {
      const m = (location.hash || '').match(/(?:^#|&)tweaks=([^&]+)/);
      if (!m) return null;
      return JSON.parse(decodeURIComponent(m[1]));
    } catch (e) { return null; }
  },
  buildTweaksHash(tweaks) {
    return '#tweaks=' + encodeURIComponent(JSON.stringify(tweaks || {}));
  },
  fromEditor() {
    return /(?:^|[?&])from=editor(?:&|$)/.test(location.search || '');
  },
  postSelect(diagramId, tweaks) {
    try {
      window.parent.postMessage({ type: 'gs:diagram-pick:select', diagramId, tweaks }, '*');
    } catch (e) { /* ignore */ }
  },
  postCancel() {
    try { window.parent.postMessage({ type: 'gs:diagram-pick:cancel' }, '*'); }
    catch (e) { /* ignore */ }
  },
  postNav(diagramId, tweaks) {
    try { window.parent.postMessage({ type: 'gs:diagram-pick:nav', diagramId, tweaks }, '*'); }
    catch (e) { /* ignore */ }
  },
};
