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
    // Types: 'section' | 'number' | 'boolean' | 'select' | 'stops'
    schema: [
      { type:'section', label:'Route' },
      { type:'number',  key:'stopsCount',  label:'Stops',     min:3, max:8,  step:1 },
      { type:'number',  key:'curvature',   label:'Curvature', min:0, max:1,  step:0.05 },
      { type:'select',  key:'trackStyle',  label:'Track',     options:['solid','dashed'] },

      { type:'section', label:'Animation' },
      { type:'number',  key:'speed',        label:'Speed', min:0.2, max:3, step:0.1 },
      { type:'boolean', key:'pauseAtStops', label:'Pause at stops' },
      { type:'boolean', key:'loop',         label:'Loop' },
      { type:'boolean', key:'showProgress', label:'Show progress %' },

      { type:'section', label:'Style' },
      { type:'select',  key:'colorMode', label:'Palette',     options:['brand','multi'] },
      { type:'select',  key:'busStyle',  label:'Bus marker',  options:['badge','pin','dot','plate'] },
      { type:'boolean', key:'showLabels', label:'Stop labels' },

      { type:'section', label:'Battery overlay' },
      { type:'boolean', key:'showBattery',  label:'Show battery' },
      { type:'number',  key:'batteryStart', label:'Start %',     min:5, max:100, step:1 },
      { type:'number',  key:'batteryEnd',   label:'End %',       min:0, max:95,  step:1 },
      { type:'number',  key:'batteryHigh',  label:'≥ Green at',  min:1, max:99,  step:1 },
      { type:'number',  key:'batteryMid',   label:'≥ Yellow at', min:1, max:99,  step:1 },

      // Special editor that walks stop1Label/stop1Caption … driven by stopsCount
      { type:'stops', key:'_stops', label:'Stop content',
        countKey:'stopsCount', labelKeyPattern:'stop{N}Label', captionKeyPattern:'stop{N}Caption' },
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
      align: 'center',
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
        easing:       t.easing       || 'ease-out',
        showProgress: !!t.showProgress,
        colorStops:   Array.isArray(t.colorStops) ? t.colorStops : [],
      };
    },
    schema: [
      { type:'section', label:'Value' },
      { type:'number',  key:'from',     label:'From',     min:-1000000, max:1000000, step:0.1 },
      { type:'number',  key:'to',       label:'To',       min:-1000000, max:1000000, step:0.1 },
      { type:'select',  key:'format',   label:'Format',   options:['number','integer','time','date'] },
      { type:'number',  key:'decimals', label:'Decimals', min:0, max:6, step:1 },
      { type:'string',  key:'prefix',   label:'Prefix' },
      { type:'string',  key:'suffix',   label:'Suffix' },

      { type:'section', label:'Animation' },
      { type:'number',  key:'duration',     label:'Duration (ms)', min:0, max:10000, step:50 },
      { type:'select',  key:'easing',       label:'Easing', options:['linear','ease-in','ease-out','ease-in-out'] },
      { type:'boolean', key:'showProgress', label:'Show progress bar' },

      { type:'section', label:'Style' },
      { type:'select',  key:'size',  label:'Size',  options:['sm','md','lg','xl'] },
      { type:'select',  key:'align', label:'Align', options:['left','center','right'] },

      { type:'section', label:'Color thresholds' },
      { type:'colorStops', key:'colorStops', label:'Stops (≥ value → color)' },

      { type:'section', label:'Caption' },
      { type:'string', key:'caption', label:'Caption text' },
    ],
    getComponent() { return window.KPICounter; },
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
