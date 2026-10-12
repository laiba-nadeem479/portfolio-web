(function () {
  'use strict';

  var wrap = document.getElementById('globe');
  var svgEl = document.getElementById('globeSvg');
  if (!wrap || !svgEl || !window.d3) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LAHORE = [74.3587, 31.5204]; // [lng, lat]

  var svg = d3.select(svgEl);
  var projection = d3.geoOrthographic().precision(0.1);
  var path = d3.geoPath(projection);

  // Rotation [lambda, phi]
  var rotation = [-74, -20];
  var size = 280;
  var dragging = false;
  var lastPos = [0, 0];
  var velocity = [0.4, 0];
  var raf = null;
  var landGeo = null;
  var countriesMesh = null;
  var graticule = d3.geoGraticule10();

  // Color constants: Ember Orange Theme
  var STROKE_OUTLINE = '#f97316';
  var STROKE_LAND = '#fb923c';
  var FILL_LAND = 'rgba(249, 115, 22, 0.22)';
  var FILL_OCEAN = '#0b0f1a';
  var STROKE_GRAT = 'rgba(251, 146, 60, 0.16)';

  svg.selectAll('*').remove();

  // Glow filter definition
  var defs = svg.append('defs');
  var filter = defs.append('filter').attr('id', 'globe-glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
  filter.append('feGaussianBlur').attr('stdDeviation', '3.5').attr('result', 'coloredBlur');
  var feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'coloredBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  // SVG Elements
  // 1. Ocean background circle
  var gOcean = svg.append('path')
    .attr('class', 'g-ocean')
    .attr('fill', FILL_OCEAN)
    .attr('stroke', STROKE_OUTLINE)
    .attr('stroke-width', 1.5)
    .attr('filter', 'url(#globe-glow)');

  // 2. Graticule
  var gGrat = svg.append('path')
    .attr('class', 'g-grat')
    .attr('fill', 'none')
    .attr('stroke', STROKE_GRAT)
    .attr('stroke-width', 0.55);

  // 3. Land polygons (solid fill)
  var gLand = svg.append('path')
    .attr('class', 'g-land')
    .attr('fill', FILL_LAND)
    .attr('stroke', STROKE_LAND)
    .attr('stroke-width', 0.85)
    .attr('stroke-linejoin', 'round');

  // 4. Country interior borders
  var gBorders = svg.append('path')
    .attr('class', 'g-borders')
    .attr('fill', 'none')
    .attr('stroke', 'rgba(251, 146, 60, 0.4)')
    .attr('stroke-width', 0.45);

  // 5. Outer sphere rim
  var gSphere = svg.append('path')
    .attr('class', 'g-sphere')
    .attr('fill', 'none')
    .attr('stroke', STROKE_OUTLINE)
    .attr('stroke-width', 2);

  // 6. Lahore Location Marker
  var gMarker = svg.append('g').attr('class', 'g-marker');
  var beaconPulse = gMarker.append('circle')
    .attr('class', 'beacon-pulse')
    .attr('fill', 'none')
    .attr('stroke', '#fdba74')
    .attr('stroke-width', 1.6);
  var beaconDot = gMarker.append('circle')
    .attr('class', 'beacon-dot')
    .attr('r', 5)
    .attr('fill', '#f97316');
  var beaconLabel = gMarker.append('text')
    .attr('class', 'beacon-label')
    .attr('font-size', '11px')
    .attr('font-family', 'var(--font-display), sans-serif')
    .attr('font-weight', '700')
    .attr('fill', '#ffffff')
    .attr('text-anchor', 'middle')
    .attr('dy', -9)
    .text('📍 Lahore, PK');

  function fit() {
    size = wrap.offsetWidth || 280;
    if (size < 200) size = 280;
    svg.attr('width', size).attr('height', size).attr('viewBox', '0 0 ' + size + ' ' + size);
    projection.translate([size / 2, size / 2]).scale((size / 2) * 0.88);
    draw();
  }

  var pulseR = 4;
  function draw() {
    if (!size) return;
    projection.rotate([rotation[0], rotation[1]]);

    var sphereData = { type: 'Sphere' };
    gOcean.attr('d', path(sphereData));
    gSphere.attr('d', path(sphereData));
    gGrat.attr('d', path(graticule));

    if (landGeo) gLand.attr('d', path(landGeo));
    if (countriesMesh) gBorders.attr('d', path(countriesMesh));

    // Lahore visibility check on front hemisphere
    var center = projection.invert([size / 2, size / 2]);
    var distance = d3.geoDistance(center, LAHORE);
    var isVisible = distance < 1.57; // Front 90 degrees

    if (isVisible) {
      var coords = projection(LAHORE);
      if (coords) {
        gMarker.attr('display', 'block').attr('transform', 'translate(' + coords[0] + ',' + coords[1] + ')');
        pulseR = (pulseR >= 16) ? 4 : pulseR + 0.25;
        beaconPulse.attr('r', pulseR).attr('opacity', Math.max(0, 1 - (pulseR / 16)));
      }
    } else {
      gMarker.attr('display', 'none');
    }
  }

  function tick() {
    if (!dragging && !reduced) {
      rotation[0] = (rotation[0] + velocity[0]) % 360;
      rotation[1] = Math.max(-60, Math.min(60, rotation[1] + velocity[1]));
      // Gradual damping
      velocity[0] = velocity[0] * 0.96 + 0.35 * 0.04;
      velocity[1] = velocity[1] * 0.92;
    }
    draw();
    raf = requestAnimationFrame(tick);
  }

  // Pointer Drag Interaction
  svgEl.style.cursor = 'grab';
  svgEl.style.touchAction = 'none';

  svgEl.addEventListener('pointerdown', function (e) {
    dragging = true;
    lastPos = [e.clientX, e.clientY];
    velocity = [0, 0];
    svgEl.style.cursor = 'grabbing';
    try { svgEl.setPointerCapture(e.pointerId); } catch (_) {}
  });

  svgEl.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastPos[0];
    var dy = e.clientY - lastPos[1];
    rotation[0] += dx * 0.45;
    rotation[1] = Math.max(-65, Math.min(65, rotation[1] - dy * 0.45));
    velocity = [dx * 0.4, -dy * 0.3];
    lastPos = [e.clientX, e.clientY];
    draw();
  });

  function release() {
    dragging = false;
    svgEl.style.cursor = 'grab';
  }
  svgEl.addEventListener('pointerup', release);
  svgEl.addEventListener('pointercancel', release);

  // Resize handler
  window.addEventListener('resize', fit);
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(wrap);

  // Process and load land data
  function initWorldData(world) {
    if (!window.topojson || !world) return;
    if (world.objects && world.objects.land) {
      landGeo = topojson.feature(world, world.objects.land);
    }
    if (world.objects && world.objects.countries) {
      countriesMesh = topojson.mesh(world, world.objects.countries);
    }
    draw();
  }

  // Check if world data is preloaded locally in window.WORLD_ATLAS
  if (window.WORLD_ATLAS) {
    initWorldData(window.WORLD_ATLAS);
  } else {
    // Fallback fetch
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { initWorldData(data); })
      .catch(function () { draw(); });
  }

  fit();
  raf = requestAnimationFrame(tick);
})();
