function EvolveCtrl($scope) {
  var IMG_INIT ="mona_lisa_crop.jpg"; // mona_lisa_crop.jpg mondrian.jpg
  var DEPTH = 4;

  var INIT_TYPE = "color"; // random color
  var INIT_R = 0;
  var INIT_G = 0;
  var INIT_B = 0;
  var INIT_A = 0.001;

  var mutateDNA = mutate_medium; // mutate_soft mutate_medium mutate_hard

  var CANVAS_INPUT = 0;
  var CANVAS_OUTPUT = 0;
  var CANVAS_BEST = 0;

  var CONTEXT_INPUT = 0;
  var CONTEXT_TEST = 0;
  var CONTEXT_BEST = 0;

  var IMAGE = new Image();
  var IWIDTH = 0;
  var IHEIGHT = 0;
  var SUBPIXELS = 0;

  var EV_TIMEOUT = 0;
  var EV_ID = 0;

  var COUNTER_TOTAL = 0;
  var COUNTER_BENEFIT = 0;

  var LAST_COUNTER = 0;
  var LAST_START = 0.0;
  var ELAPSED_TIME = 0.0;

  var EL_STEP_TOTAL = 0;
  var EL_STEP_BENEFIT = 0;
  var EL_FITNESS = 0;
  var EL_ELAPSED_TIME = 0;
  var EL_MUTSEC = 0;

  var MAX_SHAPES = 50;    // max capacity
  var MAX_POINTS = 6;

  var ACTUAL_SHAPES = MAX_SHAPES; // current size
  var ACTUAL_POINTS = MAX_POINTS;

  var DNA_BEST = new Array(MAX_SHAPES);
  var DNA_TEST = new Array(MAX_SHAPES);

  var CHANGED_SHAPE_INDEX = 0;

  var FITNESS_MAX = 999923400656;
  var FITNESS_TEST = FITNESS_MAX;
  var FITNESS_BEST = FITNESS_MAX;

  var FITNESS_BEST_NORMALIZED = 0; // pixel match: 0% worst - 100% best
  var NORM_COEF = IWIDTH*IHEIGHT*3*255; // maximum distance between black and white images

  var DATA_INPUT = 0;
  var DATA_TEST = 0;

  var CHOSEN_FILE_ENTRY = null;

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  $scope.originalText = chrome.i18n.getMessage("original");
  $scope.bestText = chrome.i18n.getMessage("best");
  $scope.evolvingText = chrome.i18n.getMessage("evolving");
  $scope.chooseFileText = chrome.i18n.getMessage("chooseFile");
  $scope.fitnessText = chrome.i18n.getMessage("fitness");
  $scope.improvementsText = chrome.i18n.getMessage("improvements");
  $scope.mutationsText = chrome.i18n.getMessage('mutations');
  $scope.startText = chrome.i18n.getMessage('start');
  $scope.stopText = chrome.i18n.getMessage('stop');
  $scope.elapsedTimeText = chrome.i18n.getMessage('elapsedTime');
  $scope.mutationsPerSecondText = chrome.i18n.getMessage('mutationsPerSecond');
  $scope.exportDnaText = chrome.i18n.getMessage('exportDna');
  $scope.exportSvgText = chrome.i18n.getMessage('exportSvg');
  $scope.importDnaText = chrome.i18n.getMessage('importDna');
  $scope.mutationText = chrome.i18n.getMessage('mutation');
  $scope.gaussianText = chrome.i18n.getMessage('gaussian');
  $scope.softText = chrome.i18n.getMessage('soft');
  $scope.mediumText = chrome.i18n.getMessage('medium');
  $scope.hardText = chrome.i18n.getMessage('hard');
  $scope.initializeDnaText = chrome.i18n.getMessage('initializeDna');
  $scope.colourText = chrome.i18n.getMessage('colour');
  $scope.whiteText = chrome.i18n.getMessage('white');
  $scope.blackText = chrome.i18n.getMessage('black');
  $scope.polygonsText = chrome.i18n.getMessage('polygons');
  $scope.verticesText = chrome.i18n.getMessage('vertices');

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  function hide(id) {
    var el = document.getElementById(id);
    if(el)
      el.style.display = "none";
  }

  function show(id) {
    var el = document.getElementById(id);
    if(el)
      el.style.display = "block";
  }

  function setElement(id, value) {
    var el = document.getElementById(id);
    if(el)
      el.innerHTML = value;
  }

  function setButtonHighlight(highlighted, others) {
    for(var i in others) {
      var el = document.getElementById(others[i]);
      if(el) {
        el.style.color = "white";
        el.style.background = "black";
      }
    }
    var elHighighted = document.getElementById(highlighted);
    if(elHighighted) {
      elHighighted.style.color = "white";
      elHighighted.style.background = "orange";
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  function rand_int(maxval) {
    return Math.round(maxval*Math.random());
  }

  function rand_float(maxval) {
    return maxval*Math.random();
  }

  function clamp(val, minval, maxval) {
    if(val<minval) return minval;
    if(val>maxval) return maxval;
    return val;
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  $scope.stop = function() {
    clearTimeout(EV_ID);

    ELAPSED_TIME += get_timestamp() - LAST_START;

    hide("stop");
    show("start");
  };

  $scope.start = function () {
    EV_ID = setInterval(evolve, EV_TIMEOUT);

    LAST_START = get_timestamp();
    LAST_COUNTER = COUNTER_TOTAL;

    hide("start");
    show("stop");
  };

  function get_timestamp() {
    return 0.001*(new Date).getTime();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  $scope.addPolygon = function () {
    ACTUAL_SHAPES = clamp(ACTUAL_SHAPES+1, 1, 1000);
    if(ACTUAL_SHAPES>MAX_SHAPES) {
      extend_dna_polygons(DNA_TEST);
      extend_dna_polygons(DNA_BEST);
      MAX_SHAPES++;
      pass_gene_mutation(DNA_BEST, DNA_TEST, DNA_BEST.length-1);
    }
    setElement("polygons", ACTUAL_SHAPES);

    redrawDNA();
    refreshStats();
  };

  $scope.removePolygon = function () {
    ACTUAL_SHAPES = clamp(ACTUAL_SHAPES-1, 1, 1000);
    setElement("polygons", ACTUAL_SHAPES);

    redrawDNA();
    refreshStats();
  };

  $scope.addVertex = function () {
    ACTUAL_POINTS = clamp(ACTUAL_POINTS+1, 3, 1000);
    if(ACTUAL_POINTS>MAX_POINTS) {
      extend_dna_vertices(DNA_TEST);
      extend_dna_vertices(DNA_BEST);
      MAX_POINTS++;
      copyDNA(DNA_BEST, DNA_TEST);
    }
    setElement("vertices", ACTUAL_POINTS);

    redrawDNA();
    refreshStats();
  };

  $scope.removeVertex = function () {
    ACTUAL_POINTS = clamp(ACTUAL_POINTS-1, 3, 1000);
    setElement("vertices", ACTUAL_POINTS);

    redrawDNA();
    refreshStats();
  };

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  $scope.setMutation = function (m) {
    var trans = { 'gauss':[mutate_gauss,"b_mut_gauss"], 'soft':[mutate_soft,"b_mut_soft"], 'medium':[mutate_medium,"b_mut_med"], 'hard':[mutate_hard,"b_mut_hard"] };
    mutateDNA = trans[m][0];
    setButtonHighlight(trans[m][1], ["b_mut_gauss", "b_mut_soft", "b_mut_med", "b_mut_hard"]);
  };

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  $scope.setDnaRandom =  function () {
    INIT_TYPE = "random";
    resetDna();
    refreshStats();
    setButtonHighlight("b_dna_random", ["b_dna_random", "b_dna_white", "b_dna_black"]);
  };

  $scope.setDnaColor = function (r,g,b) {
    INIT_TYPE = "color";
    INIT_R = r;
    INIT_G = g;
    INIT_B = b;
    resetDna();
    refreshStats();
    if(r==0&&g==0&&b==0)
      setButtonHighlight("b_dna_black", ["b_dna_random", "b_dna_white", "b_dna_black"]);
    else
      setButtonHighlight("b_dna_white", ["b_dna_random", "b_dna_white", "b_dna_black"]);
  };

  function resetDna() {
    init_dna(DNA_TEST);
    init_dna(DNA_BEST);
    copyDNA(DNA_BEST, DNA_TEST);

    FITNESS_TEST = FITNESS_MAX;
    FITNESS_BEST = FITNESS_MAX;

    COUNTER_BENEFIT = 0;
    COUNTER_TOTAL = 0;

    redrawDNA();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  function refreshStats() {
    FITNESS_TEST = compute_fitness(DNA_TEST);
    FITNESS_BEST = FITNESS_TEST;
    FITNESS_BEST_NORMALIZED = 100*(1-FITNESS_BEST/NORM_COEF);
    EL_FITNESS.innerHTML = FITNESS_BEST_NORMALIZED.toFixed(2)+"%";

    EL_STEP_BENEFIT.innerHTML = COUNTER_BENEFIT;
    EL_STEP_TOTAL.innerHTML = COUNTER_TOTAL;
  }

  function redrawDNA() {
    drawDNA(CONTEXT_TEST, DNA_TEST);
    drawDNA(CONTEXT_BEST, DNA_BEST);
  }

  function render_nice_time(s) {
    if(s<60) {
      return Math.floor(s).toFixed(0)+"s";
    }
    else if(s<3600) {
      var m = Math.floor(s/60);
      return m+"m"+" "+render_nice_time(s-m*60);
    }
    else if(s<86400) {
      var h = Math.floor(s/3600);
      return h+"h"+" "+render_nice_time(s-h*3600);
    }
    else {
      var d = Math.floor(s/86400);
      return d+"d"+" "+render_nice_time(s-d*86400);
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  function drawShape(ctx, shape, color) {
    ctx.fillStyle = "rgba("+color.r+","+color.g+","+color.b+","+color.a+")";
    ctx.beginPath();
    ctx.moveTo(shape[0].x, shape[0].y);
    for(var i=1;i<ACTUAL_POINTS;i++) {
      ctx.lineTo(shape[i].x, shape[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawDNA(ctx, dna) {
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(0, 0, IWIDTH, IHEIGHT);
    for(var i=0;i<ACTUAL_SHAPES;i++) {
      drawShape(ctx, dna[i].shape, dna[i].color);
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  var bell_distributions = new Array(0);
  var bell_offsets = new Array(0);

  function rand_bell(range, center) {
    var dist = bell_distributions[range];
    if (!dist) {
      dist = bell_precompute(range, range/6, 40);
    }
    var off = bell_offsets[range];
    return center + dist[off[-center]+Math.floor((off[range-center+1]-off[-center])*Math.random())];
  }

  function bell_precompute(range, spread, resolution) {
    var accumulator = 0;
    var step = 1 / resolution;
    var dist = new Array();
    var off = new Array();
    var index = 0;

    for (var x = -range-1; x <= range+1; x++) {
      off[x] = index;
      accumulator = step + Math.exp(-x*x/2/spread/spread);
      while (accumulator >= step) {
        if (x != 0) dist[index++] = x;
        accumulator -= step;
      }
    }
    bell_offsets[range] = off;
    return bell_distributions[range] = dist;
  }

  function test_bell(count, range, center) {
    var bell_tests = new Array(0);
    for (var i = 0; i < count; i++) {
      var r = rand_bell(range, center);
      if (bell_tests[r]) bell_tests[r]=bell_tests[r]+1;
      else bell_tests[r] = 1;
    }
    draw_dist(CONTEXT_TEST, bell_tests);
  }

  function draw_dist(ctx, dist) {
    var current = dist[0];
    var count = 0;
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(0, 0, IWIDTH, IHEIGHT);
    ctx.fillStyle = "rgb(0,0,255)";

    var max = 0;
    for (var i in dist) { if (dist[i] > max) max = dist[i]; }
    for (var i in dist) {
      current = Math.round((dist[i] / max) * IHEIGHT);
      i = parseInt(i);
      ctx.beginPath();
      ctx.moveTo(i,   IHEIGHT+1);
      ctx.lineTo(i,   IHEIGHT-current);
      ctx.lineTo(i+1, IHEIGHT-current);
      ctx.lineTo(i+1, IHEIGHT+1);
      ctx.closePath();
      ctx.fill();
    }
  }

  function mutate_gauss(dna_out) {
    CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES-1);

    var roulette = rand_float(2.0);

    // mutate color
    if(roulette<1) {
      // red
      if(roulette<0.25) {
        dna_out[CHANGED_SHAPE_INDEX].color.r = rand_bell(255, dna_out[CHANGED_SHAPE_INDEX].color.r);
      }
      // green
      else if(roulette<0.5) {
        dna_out[CHANGED_SHAPE_INDEX].color.g = rand_bell(255, dna_out[CHANGED_SHAPE_INDEX].color.g);
      }
      // blue
      else if(roulette<0.75) {
        dna_out[CHANGED_SHAPE_INDEX].color.b = rand_bell(255, dna_out[CHANGED_SHAPE_INDEX].color.b);
      }
      // alpha
      else if(roulette<1.0) {
        dna_out[CHANGED_SHAPE_INDEX].color.a = 0.00390625 * rand_bell(255, Math.floor(dna_out[CHANGED_SHAPE_INDEX].color.a*255));
      }
    }

    // mutate shape
    else {
      var CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS-1);

      // x-coordinate
      if(roulette<1.5) {
        dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_bell(IWIDTH, dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x);
      }

      // y-coordinate
      else {
        dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_bell(IHEIGHT, dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y);
      }
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  function mutate_medium(dna_out) {
    CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES-1);

    var roulette = rand_float(2.0);

    // mutate color
    if(roulette<1) {
      // red
      if(roulette<0.25) {
        dna_out[CHANGED_SHAPE_INDEX].color.r = rand_int(255);
      }
      // green
      else if(roulette<0.5) {
        dna_out[CHANGED_SHAPE_INDEX].color.g = rand_int(255);
      }
      // blue
      else if(roulette<0.75) {
        dna_out[CHANGED_SHAPE_INDEX].color.b = rand_int(255);
      }
      // alpha
      else if(roulette<1.0) {
        dna_out[CHANGED_SHAPE_INDEX].color.a = rand_float(1.0);
      }
    }

    // mutate shape
    else {
      var CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS-1);

      // x-coordinate
      if(roulette<1.5) {
        dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_int(IWIDTH);
      }

      // y-coordinate
      else {
        dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_int(IHEIGHT);
      }
    }
  }

  function mutate_hard(dna_out) {
    CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES-1);

    dna_out[CHANGED_SHAPE_INDEX].color.r = rand_int(255);
    dna_out[CHANGED_SHAPE_INDEX].color.g = rand_int(255);
    dna_out[CHANGED_SHAPE_INDEX].color.b = rand_int(255);
    dna_out[CHANGED_SHAPE_INDEX].color.a = rand_float(1.0);
    var CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS-1);

    dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = rand_int(IWIDTH);
    dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = rand_int(IHEIGHT);
  }

  function mutate_soft(dna_out) {
    CHANGED_SHAPE_INDEX = rand_int(ACTUAL_SHAPES-1);

    var roulette = rand_float(2.0);

    var delta = -1+rand_int(3);

    // mutate color
    if(roulette<1) {
      // red
      if(roulette<0.25) {
        dna_out[CHANGED_SHAPE_INDEX].color.r = clamp(dna_out[CHANGED_SHAPE_INDEX].color.r+delta, 0, 255);
      }
      // green
      else if(roulette<0.5) {
        dna_out[CHANGED_SHAPE_INDEX].color.g = clamp(dna_out[CHANGED_SHAPE_INDEX].color.g+delta, 0, 255);
      }
      // blue
      else if(roulette<0.75) {
        dna_out[CHANGED_SHAPE_INDEX].color.b = clamp(dna_out[CHANGED_SHAPE_INDEX].color.b+delta, 0, 255);
      }
      // alpha
      else if(roulette<1.0) {
        dna_out[CHANGED_SHAPE_INDEX].color.a = clamp(dna_out[CHANGED_SHAPE_INDEX].color.a+0.1*delta, 0.0, 1.0);
      }
    }

    // mutate shape
    else {
      var CHANGED_POINT_INDEX = rand_int(ACTUAL_POINTS-1);

      // x-coordinate
      if(roulette<1.5) {
        dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x = clamp(dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].x+delta, 0, IWIDTH);
      }

      // y-coordinate
      else {
        dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y = clamp(dna_out[CHANGED_SHAPE_INDEX].shape[CHANGED_POINT_INDEX].y+delta, 0, IHEIGHT);
      }
    }
  }

  function compute_fitness(dna) {
    var fitness = 0;

    DATA_TEST = CONTEXT_TEST.getImageData(0, 0, IWIDTH, IHEIGHT).data;

    for(var i=0;i<SUBPIXELS;++i) {
      if(i%DEPTH!=3)
        fitness += Math.abs(DATA_INPUT[i]-DATA_TEST[i]);
    }

    return fitness;
  }

  function pass_gene_mutation(dna_from, dna_to, gene_index) {
    dna_to[gene_index].color.r = dna_from[gene_index].color.r;
    dna_to[gene_index].color.g = dna_from[gene_index].color.g;
    dna_to[gene_index].color.b = dna_from[gene_index].color.b;
    dna_to[gene_index].color.a = dna_from[gene_index].color.a;

    for(var i=0;i<MAX_POINTS;i++) {
      dna_to[gene_index].shape[i].x = dna_from[gene_index].shape[i].x;
      dna_to[gene_index].shape[i].y = dna_from[gene_index].shape[i].y;
    }
  }

  function copyDNA(dna_from, dna_to) {
    for(var i=0;i<MAX_SHAPES;i++)
      pass_gene_mutation(dna_from, dna_to, i);
  }

  function evolve() {
    mutateDNA(DNA_TEST);
    drawDNA(CONTEXT_TEST, DNA_TEST);

    FITNESS_TEST = compute_fitness(DNA_TEST);

    if(FITNESS_TEST<FITNESS_BEST) {
      pass_gene_mutation(DNA_TEST, DNA_BEST, CHANGED_SHAPE_INDEX);

      FITNESS_BEST = FITNESS_TEST;
      FITNESS_BEST_NORMALIZED = 100*(1-FITNESS_BEST/NORM_COEF);
      EL_FITNESS.innerHTML = FITNESS_BEST_NORMALIZED.toFixed(2)+"%";

      COUNTER_BENEFIT++;
      EL_STEP_BENEFIT.innerHTML = COUNTER_BENEFIT;

      drawDNA(CONTEXT_BEST, DNA_BEST);
    }
    else {
      pass_gene_mutation(DNA_BEST, DNA_TEST, CHANGED_SHAPE_INDEX);
    }

    COUNTER_TOTAL++;
    EL_STEP_TOTAL.innerHTML = COUNTER_TOTAL;

    if(COUNTER_TOTAL%10==0) {
      var passed = get_timestamp() - LAST_START;
      EL_ELAPSED_TIME.innerHTML = render_nice_time(ELAPSED_TIME+passed);
    }
    if(COUNTER_TOTAL%50==0) {
      var mutsec = (COUNTER_TOTAL-LAST_COUNTER)/(get_timestamp() - LAST_START);
      EL_MUTSEC.innerHTML = mutsec.toFixed(1);
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  function init_dna(dna) {
    for(var i=0;i<MAX_SHAPES;i++) {
      var points = new Array(MAX_POINTS);
      for(var j=0;j<MAX_POINTS;j++) {
        points[j] = {'x':rand_int(IWIDTH),'y':rand_int(IHEIGHT)};
      }
      var color = {};
      if(INIT_TYPE=="random")
        color = {'r':rand_int(255),'g':rand_int(255),'b':rand_int(255),'a':0.001};
      else
        color = {'r':INIT_R,'g':INIT_G,'b':INIT_B,'a':INIT_A};
      var shape = {
        'color':color,
        'shape':points
      };
      dna[i] = shape;
    }
  }

  function extend_dna_polygons(dna) {
    var points = new Array(MAX_POINTS);
    for(var j=0;j<MAX_POINTS;j++) {
      points[j] = {'x':rand_int(IWIDTH),'y':rand_int(IHEIGHT)};
    }
    var color = {};
    if(INIT_TYPE=="random")
      color = {'r':rand_int(255),'g':rand_int(255),'b':rand_int(255),'a':0.001};
    else
      color = {'r':INIT_R,'g':INIT_G,'b':INIT_B,'a':INIT_A};
    var shape = {'color':color, 'shape':points};
    dna.push(shape);
  }

  function extend_dna_vertices(dna) {
    for(var i=0;i<MAX_SHAPES;i++) {
      var point = {'x':rand_int(IWIDTH),'y':rand_int(IHEIGHT)};
      dna[i].shape.push(point);
    }
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  function init_canvas() {
    CANVAS_INPUT = document.getElementById('canvas_input');
    CONTEXT_INPUT = CANVAS_INPUT.getContext('2d');

    CANVAS_TEST = document.getElementById('canvas_test');
    CONTEXT_TEST = CANVAS_TEST.getContext('2d');

    CANVAS_BEST = document.getElementById('canvas_best');
    CONTEXT_BEST = CANVAS_BEST.getContext('2d');

    IWIDTH = IMAGE.width;
    IHEIGHT = IMAGE.height;

    SUBPIXELS = IWIDTH*IHEIGHT*DEPTH;
    NORM_COEF = IWIDTH*IHEIGHT*3*255;

    CANVAS_INPUT.setAttribute('width',IWIDTH);
    CANVAS_INPUT.setAttribute('height',IHEIGHT);

    CANVAS_TEST.setAttribute('width',IWIDTH);
    CANVAS_TEST.setAttribute('height',IHEIGHT);

    CANVAS_BEST.setAttribute('width',IWIDTH);
    CANVAS_BEST.setAttribute('height',IHEIGHT);

    // draw the image onto the canvas
    CONTEXT_INPUT.drawImage(IMAGE, 0, 0, IWIDTH, IHEIGHT);

    DATA_INPUT = CONTEXT_INPUT.getImageData(0, 0, IWIDTH, IHEIGHT).data;

    EL_STEP_TOTAL = document.getElementById("step_total");
    EL_STEP_BENEFIT = document.getElementById("step_benefit");
    EL_FITNESS = document.getElementById("fitness");
    EL_ELAPSED_TIME = document.getElementById("time");
    EL_MUTSEC = document.getElementById("mutsec");

    init_dna(DNA_TEST);
    init_dna(DNA_BEST);
    copyDNA(DNA_BEST, DNA_TEST);

    redrawDNA();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  function serializeDNA(dna) {
    var dna_string = "";

    // header
    dna_string += ACTUAL_POINTS+" ";
    dna_string += ACTUAL_SHAPES+" ";

    // shapes
    for(var i=0;i<ACTUAL_SHAPES;i++) {
      dna_string += dna[i].color.r+" ";
      dna_string += dna[i].color.g+" ";
      dna_string += dna[i].color.b+" ";
      dna_string += dna[i].color.a+" ";
      for(var j=0;j<ACTUAL_POINTS;j++) {
        dna_string += dna[i].shape[j].x+" ";
        dna_string += dna[i].shape[j].y+" ";
      }
    }
    return dna_string;
  }

  function serializeDNAasSVG(dna) {
    // output DNA string in SVG format
    var dna_string = "";

    // header
    dna_string += "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
    dna_string += "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n";
    dna_string += "<svg xmlns=\"http://www.w3.org/2000/svg\"\n";
    dna_string += "xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:ev=\"http://www.w3.org/2001/xml-events\"\n";
    dna_string += "version=\"1.1\" baseProfile=\"full\"\n";
    dna_string += "width=\"800mm\" height=\"600mm\">\n";

    // shapes
    for(var i=0;i<ACTUAL_SHAPES;i++) {
      dna_string += "<polygon points=\"";
      for(var j=0;j<ACTUAL_POINTS;j++) {
        dna_string += dna[i].shape[j].x+" ";
        dna_string += dna[i].shape[j].y+" ";
      }
      dna_string += "\" fill=\"rgb(";
      dna_string += dna[i].color.r+",";
      dna_string += dna[i].color.g+",";
      dna_string += dna[i].color.b+")\" opacity=\"";
      dna_string += dna[i].color.a+"\" />\n";
    }
    dna_string +=  "<\/svg>\n";
    return dna_string;
  }

  function deserializeDNA(dna, text) {
    var data = text.split(" ");

    MAX_POINTS = parseInt(data[0]);
    MAX_SHAPES = parseInt(data[1]);

    ACTUAL_SHAPES = MAX_SHAPES;
    ACTUAL_POINTS = MAX_POINTS;

    init_dna(dna);

    var shape_size = 4+2*MAX_POINTS;

    for(var i=0;i<MAX_SHAPES;i++) {
      dna[i].color.r = parseInt(data[2+i*shape_size+0]);
      dna[i].color.g = parseInt(data[2+i*shape_size+1]);
      dna[i].color.b = parseInt(data[2+i*shape_size+2]);
      dna[i].color.a = parseFloat(data[2+i*shape_size+3]);
      for(var j=0;j<MAX_POINTS;j++) {
        dna[i].shape[j].x = parseInt(data[2+i*shape_size+4+j*2]);
        dna[i].shape[j].y = parseInt(data[2+i*shape_size+4+j*2+1]);
      }
    }
  }

  $scope.export_dna = function () {
    $scope.exportingText = serializeDNA(DNA_BEST);
  };

  $scope.export_dna_as_svg = function () {
      $scope.exportingText = serializeDNAasSVG(DNA_BEST);
  };

  $scope.import_dna = function () {
    deserializeDNA(DNA_BEST, $scope.exportingText);

    init_dna(DNA_TEST);
    copyDNA(DNA_BEST, DNA_TEST);

    redrawDNA();
    refreshStats();

    setElement("polygons", ACTUAL_SHAPES);
    setElement("vertices", ACTUAL_POINTS);
  };

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  $scope.set_image = function (imageFile) {
    init_canvas();
    IMAGE.src = imageFile;
  };

  function loadFileEntry() {
    if (!CHOSEN_FILE_ENTRY) {
      $scope.dropText = chrome.i18n.getMessage('loadFileFailure');
    }
    else {
      CHOSEN_FILE_ENTRY.file(function(file) {
        $scope.set_image(window.URL.createObjectURL(file));
      });

      $scope.dropText = chrome.i18n.getMessage('loadFileSuccess');
    }
  };

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  function select_all()
  {
    var text_val = document.dnaform.clipboard;
    text_val.focus();
    text_val.select();
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  $scope.init = function() {
    IMAGE.onload = function() {
      // hack to work around ugly, ugly bug
      // onload event firing is unreliable
      // as image data may not be ready yet!!!
      if(IMAGE.complete) {
        init_canvas();
      }
      else {
        setTimeout(init_canvas, 100);
      }
    };
    IMAGE.src = IMG_INIT;

    setButtonHighlight("b_dna_black", ["b_dna_random", "b_dna_white", "b_dna_black"]);
    setButtonHighlight("b_mut_med", ["b_mut_gauss", "b_mut_soft", "b_mut_med", "b_mut_hard"]);
  };

  $scope.chooseFile = function() {
    var accepts = [{
      mimeTypes: ['image/*'],
      extensions: ['jpeg', 'png']
    }];
    chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function(readOnlyEntry) {
      if (!readOnlyEntry) {
        return;
      }
      try { // TODO remove try once retain is in stable.
        chrome.storage.local.set(
          {'chosenFile': chrome.fileSystem.retainEntry(readOnlyEntry)});
      } catch (e) {}
      CHOSEN_FILE_ENTRY = readOnlyEntry;
      loadFileEntry();
    });
  };

  $scope.dropText = chrome.i18n.getMessage('dragImagePrompt');

  var dragOver = function(e) {
    e.stopPropagation();
    e.preventDefault();
    var valid = e.dataTransfer && e.dataTransfer.types
          && (e.dataTransfer.types.indexOf('Files') >= 0);
    $scope.$apply(function() {
      $scope.dropText = valid ?
        chrome.i18n.getMessage('dragImageValid')
        : chrome.i18n.getMessage('dragImageInvalid');
      $scope.dropClass = valid ? "dragging" : "invalid-dragging";
    });
  };

  var dragLeave = function(e) {
    $scope.$apply(function() {
      $scope.dropText = chrome.i18n.getMessage('dragImagePrompt');
      $scope.dropClass = '';
    });
  };

  var drop = function(e) {
    e.preventDefault();
    e.stopPropagation();

    var data = e.dataTransfer;

    for (var i = 0; i < data.items.length; i++) {
      var item = data.items[i];
      if (item.kind == 'file' &&
          item.type.match('image/*') &&
          item.webkitGetAsEntry()) {
        CHOSEN_FILE_ENTRY = item.webkitGetAsEntry();
        break;
      }
    }

    loadFileEntry(CHOSEN_FILE_ENTRY);

    $scope.$apply(function() {
      $scope.dropText = chrome.i18n.getMessage('dragImagePrompt');
      $scope.dropClass =  '';
    });
  };

  document.body.addEventListener("dragover", dragOver, false);
  document.body.addEventListener("dragleave", dragLeave, false);
  document.body.addEventListener("drop", drop, false);

  $scope.init();
};
