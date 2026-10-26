/* Bangu scenery: cached, pixel-rendered layers for a 480 x 270 viewport. */
(function () {
  'use strict';

  var CACHE = Object.create(null);
  var WIDTH = 480, HEIGHT = 270;
  var INK = '#302936';
  var PLACES = [
    'Praça Guilherme da Silveira', 'Calçadão de Bangu', 'Largo de Bangu',
    'Fábrica / Bangu Shopping', 'Estádio de Moça Bonita', 'Feira livre',
    'Plataforma do trem', 'Rua Bela Flor', 'Serra do Mendanha', 'Bangu à noite'
  ];
  var FONT = {
    A: ['010','101','111','101','101'], B: ['110','101','110','101','110'],
    C: ['011','100','100','100','011'], D: ['110','101','101','101','110'],
    E: ['111','100','110','100','111'], F: ['111','100','110','100','100'],
    G: ['011','100','101','101','011'], H: ['101','101','111','101','101'],
    I: ['111','010','010','010','111'], J: ['001','001','001','101','010'],
    K: ['101','101','110','101','101'], L: ['100','100','100','100','111'],
    M: ['101','111','111','101','101'], N: ['101','111','111','111','101'],
    O: ['010','101','101','101','010'], P: ['110','101','110','100','100'],
    Q: ['010','101','101','111','011'], R: ['110','101','110','101','101'],
    S: ['011','100','010','001','110'], T: ['111','010','010','010','010'],
    U: ['101','101','101','101','111'], V: ['101','101','101','101','010'],
    W: ['101','101','111','111','101'], X: ['101','101','010','101','101'],
    Y: ['101','101','010','010','010'], Z: ['111','001','010','100','111'],
    '0': ['111','101','101','101','111'], '1': ['010','110','010','010','111'],
    '2': ['110','001','010','100','111'], '3': ['110','001','010','001','110'],
    '4': ['101','101','111','001','001'], '5': ['111','100','110','001','110'],
    '6': ['011','100','110','101','010'], '7': ['111','001','010','010','010'],
    '8': ['010','101','010','101','010'], '9': ['010','101','011','001','110'],
    ' ': ['000','000','000','000','000'], '-': ['000','000','111','000','000']
  };

  function r(c, x, y, w, h, color) {
    c.fillStyle = color;
    c.fillRect(Math.round(x * 2) / 2, Math.round(y * 2) / 2,
      Math.round(w * 2) / 2, Math.round(h * 2) / 2);
  }
  function frame(c, x, y, w, h, fill, rim) {
    r(c, x, y, w, h, rim || INK);
    r(c, x + 1, y + 1, w - 2, h - 2, fill);
  }
  function label(c, str, x, y, color, scale) {
    var size = scale || 1;
    str = String(str).toUpperCase();
    for (var i = 0; i < str.length; i++) {
      var glyph = FONT[str[i]] || FONT[' '];
      for (var row = 0; row < 5; row++) {
        for (var col = 0; col < 3; col++) {
          if (glyph[row][col] === '1') r(c, x + i * size * 4 + col * size,
            y + row * size, size, size, color);
        }
      }
    }
  }
  function line(c, x1, y1, x2, y2, color, thickness) {
    var n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2));
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      r(c, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t,
        thickness || 2, thickness || 2, color);
    }
  }
  function makeCanvas(w, hd) {
    var canvas = document.createElement('canvas');
    var c = canvas.getContext('2d');
    var doubled = hd !== false && typeof c.scale === 'function';
    canvas.width = w * (doubled ? 2 : 1);
    canvas.height = HEIGHT * (doubled ? 2 : 1);
    c = canvas.getContext('2d');
    if (doubled) c.scale(2, 2);
    c.imageSmoothingEnabled = false;
    return { canvas: canvas, ctx: c, hd: doubled };
  }
  function ellipse(c, cx, cy, rx, ry, color) {
    for (var yy = -ry; yy <= ry; yy += 0.5) {
      var span = rx * Math.sqrt(Math.max(0, 1 - yy * yy / (ry * ry)));
      r(c, cx - span, cy + yy, span * 2, 0.5, color);
    }
  }
  function shade(color, amt) {
    var n = parseInt(color.slice(1), 16), rr = n >> 16,
      gg = n >> 8 & 255, bb = n & 255;
    function mix(v) { return Math.max(0, Math.min(255, Math.round(v + amt))); }
    return '#' + [mix(rr), mix(gg), mix(bb)].map(function (v) {
      return v.toString(16).padStart(2, '0');
    }).join('');
  }
  function palette(stage) {
    var skies = [
      ['#75b9dc','#a9d5e3','#f9e0a7'],
      ['#5cb6e2','#a3dafa','#f5e6ba'],
      ['#db8e74','#efb17b','#ffe0ae'],
      ['#65b7dc','#9ed8e2','#f5dbab'],
      ['#68bfe1','#a4d9e6','#f5dcb0'],
      ['#edb27d','#f2c18c','#ffe1ac'],
      ['#d47d71','#e7a47e','#f5ca91'],
      ['#ac667a','#db8a7b','#eda77b'],
      ['#514c78','#837096','#b7808b'],
      ['#252b52','#465077','#625978']
    ];
    var night = stage >= 9, deep = stage === 10;
    return {
      sky: skies[stage - 1],
      far: deep ? '#43455f' : night ? '#695d79' : stage === 8 ? '#a47483' : '#a8a4a1',
      farLight: deep ? '#626680' : night ? '#81748d' : '#c6bbb0',
      wall: deep ? '#61576c' : night ? '#8c7481' : '#d5a478',
      wallLight: deep ? '#8a7180' : night ? '#ae8790' : '#f2c48e',
      ground: deep ? '#565462' : night ? '#716877' : '#a7998b',
      edge: deep ? '#817787' : night ? '#a88c91' : '#d0b99d',
      dark: deep ? '#25283d' : night ? '#3c344e' : INK,
      window: deep ? '#ffd78a' : night ? '#f6cf86' : '#93a9a8',
      leaf: deep ? '#36575a' : night ? '#527370' : stage === 3 || stage === 7 ? '#648d5a' : '#49915d',
      leafLight: deep ? '#557c70' : night ? '#779587' : '#7ebb6d'
    };
  }
  function cloud(c, x, y, color) {
    r(c, x + 6, y, 28, 5, color);
    r(c, x, y + 5, 48, 8, color);
    r(c, x + 9, y + 13, 34, 4, color);
    r(c, x + 16, y - 4, 16, 4, color);
  }
  function sky(c, stage, p) {
    var stops = [p.sky[0], p.sky[1], p.sky[2]];
    for (var band = 0; band < 171; band += 0.5) {
      var section = band < 75 ? 0 : 1;
      var start = section ? 75 : 0, end = section ? 171 : 75;
      var a = parseInt(stops[section].slice(1), 16), b = parseInt(stops[section + 1].slice(1), 16);
      var t = (band - start) / (end - start);
      var color = '#';
      for (var channel = 16; channel >= 0; channel -= 8) {
        var component = Math.round(((a >> channel) & 255) * (1 - t) + ((b >> channel) & 255) * t);
        color += component.toString(16).padStart(2, '0');
      }
      r(c, 0, band, WIDTH, 0.5, color);
      if (band % 4 === 0) for (var d = 0; d < 18; d++) {
        r(c, (d * 83 + band * 37) % WIDTH, band, 0.5, 0.5,
          shade(color, d % 2 ? 9 : -9));
      }
    }
    if (stage === 10) {
      ellipse(c, 385, 33, 16, 16, '#d8d3c9');
      ellipse(c, 384, 31, 14, 14, '#fff3d0');
      ellipse(c, 379, 25, 5, 3, '#fffbea');
      for (var s = 0; s < 35; s++) {
        var xx = (s * 137 + 31) % 480, yy = (s * 73 + 13) % 110;
        r(c, xx, yy, s % 5 ? 1 : 2, 1, '#dcd6de');
      }
    } else {
      var sunColor = stage >= 8 ? '#ffca86' : '#fff2b3';
      var sunY = stage === 9 ? 109 :
        stage === 3 || stage === 7 || stage === 8 ? 96 : 33;
      ellipse(c, 385, sunY + 15, 19, 19, shade(sunColor, -16));
      ellipse(c, 385, sunY + 15, 16, 16, sunColor);
      ellipse(c, 380, sunY + 8, 5, 3, '#fff8d5');
    }
  }
  function clouds(c, stage) {
    for (var i = 0; i < 9; i++) {
      var x = i * 122 + 14, y = 24 + i % 4 * 17;
      var color = stage === 10 ? '#8988a8' : stage === 9 ? '#b6a8b5' :
        stage >= 7 ? '#e6b6a1' : '#f0e9dc';
      ellipse(c, x + 26, y + 6, 24, 7, shade(color, -17));
      ellipse(c, x + 18, y, 14, 8, color);
      ellipse(c, x + 37, y + 2, 17, 9, color);
      r(c, x + 12, y + 9, 36, 1, shade(color, 16));
    }
  }
  function distantBlocks(c, width, stage, p) {
    r(c, 0, 165, width, 13, p.far);
    for (var x = 0; x < width; x += 73) {
      var h = 22 + ((x / 73 * 17) % 29);
      r(c, x, 166 - h, 66, h, p.far);
      r(c, x + 4, 170 - h, 58, 3, p.farLight);
      for (var j = 0; j < 3; j++) r(c, x + 9 + j * 17, 174 - h + j % 2 * 9,
        5, 6, stage >= 9 && j % 2 === 0 ? p.window : p.farLight);
    }
  }
  function shopping(c, x, y, p) {
    frame(c, x, y, 192, 104, '#a05e53', p.dark);
    r(c, x + 2, y + 3, 188, 4, '#c47761');
    for (var row = 0; row < 12; row++) {
      var offset = row % 2 ? 7 : 0;
      for (var bx = x + 3 + offset; bx < x + 187; bx += 15) {
        r(c, bx, y + 10 + row * 7, 11, 1, '#d18a71');
        r(c, bx + 10, y + 10 + row * 7, 1, 5, '#6f4850');
      }
    }
    frame(c, x + 21, y + 25, 150, 22, '#654555', '#dfad72');
    label(c, 'BANGU SHOPPING', x + 40, y + 32, '#ffe3a3', 2);
  }
  function tree(c, x, base, p, size) {
    var s = size || 1;
    frame(c, x - 5 * s, base - 51 * s, 11 * s, 51 * s, '#70513d', p.dark);
    r(c, x + 1 * s, base - 45 * s, 2 * s, 34 * s, '#a7784d');
    var leaves = [[-27,-87,34,22],[-13,-102,36,25],[10,-88,29,24],[-31,-68,39,22],[1,-71,37,25]];
    for (var i = 0; i < leaves.length; i++) {
      var v = leaves[i];
      var cx = x + (v[0] + v[2] / 2) * s;
      var cy = base + (v[1] + v[3] / 2) * s;
      ellipse(c, cx, cy, v[2] * s / 2 + 1, v[3] * s / 2 + 1, p.dark);
      ellipse(c, cx, cy - s, (v[2] / 2 - 1) * s, (v[3] / 2 - 1) * s,
        i % 2 ? p.leaf : shade(p.leaf, -13));
      ellipse(c, cx - 3 * s, cy - 4 * s, 8 * s, 4 * s, p.leafLight);
      ellipse(c, cx + 5 * s, cy + 5 * s, 5 * s, 3 * s, shade(p.leaf, 14));
    }
    for (var j = 0; j < 8; j++) r(c, x + ((j * 17) % 55 - 26) * s,
      base - (84 - (j * 13) % 26) * s, 5 * s, 3 * s, p.leafLight);
  }
  function lamp(c, x, top, base, p, lit, cone) {
    r(c, x - 3, top, 7, base - top, p.dark);
    r(c, x - 1, top + 7, 2, base - top - 8, '#869097');
    frame(c, x - 10, top - 7, 21, 9, lit ? '#ffe3a0' : '#d7d5ba', p.dark);
    r(c, x - 7, top - 5, 15, 2, '#fff4bd');
    r(c, x - 7, base - 5, 15, 5, p.dark);
    if (cone) {
      for (var i = 0; i < 8; i++) {
        c.globalAlpha = 0.07;
        r(c, x - 8 - i * 6, top + 7 + i * 13, 16 + i * 12, 13, '#ffe4a1');
      }
      c.globalAlpha = 1;
    }
  }
  function wire(c, x1, y1, x2, y2, color) {
    for (var x = x1; x <= x2; x += 3) {
      var t = (x - x1) / (x2 - x1);
      r(c, x, y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 9, 4, 1, color);
    }
  }
  function bench(c, x, y, p) {
    frame(c, x, y, 67, 8, '#b5aea0', p.dark);
    r(c, x + 5, y + 8, 7, 12, '#787878');
    r(c, x + 55, y + 8, 7, 12, '#787878');
    frame(c, x + 4, y - 18, 59, 12, '#c7c0af', p.dark);
    r(c, x + 7, y - 15, 53, 3, '#e5d8ba');
  }
  function cart(c, x, y, p) {
    frame(c, x + 5, y + 1, 66, 18, '#a34a39', p.dark);
    r(c, x + 9, y + 3, 57, 3, '#de8762');
    frame(c, x, y - 31, 76, 10, '#d76543', p.dark);
    for (var i = 0; i < 6; i++) r(c, x + i * 12 + 3, y - 29, 7, 6, '#f4c985');
    r(c, x + 8, y - 21, 3, 24, p.dark);
    r(c, x + 64, y - 21, 3, 24, p.dark);
    frame(c, x + 12, y + 16, 12, 12, '#535057', p.dark);
    frame(c, x + 54, y + 16, 12, 12, '#535057', p.dark);
    r(c, x + 22, y - 5, 7, 5, '#e4b668');
    r(c, x + 35, y - 7, 8, 7, '#e4b668');
    r(c, x + 49, y - 5, 8, 5, '#e4b668');
  }
  function fence(c, x, y, w, p) {
    r(c, x, y, w, 3, p.dark);
    r(c, x, y + 16, w, 3, p.dark);
    for (var k = 0; k <= w; k += 12) {
      r(c, x + k, y - 4, 2, 26, p.dark);
      r(c, x + k - 2, y - 6, 6, 3, '#8f8b84');
    }
  }
  function station(c, width, p) {
    r(c, 0, 147, width, 14, '#717b80');
    r(c, 0, 148, width, 2, '#c4bcab');
    for (var x = 0; x < width; x += 105) {
      frame(c, x, 103, 98, 44, '#9caeaa', p.dark);
      frame(c, x + 7, 108, 84, 27, '#789297', p.dark);
      for (var j = 0; j < 8; j++) r(c, x + 10 + j * 10, 109, 2, 25, '#3c4d56');
      r(c, x + 43, 135, 12, 12, '#5b676b');
    }
    r(c, 0, 95, width, 7, '#65676b');
    r(c, 0, 100, width, 2, '#d9c9a3');
    for (var q = 0; q < width; q += 280) {
      r(c, q + 23, 73, 6, 28, p.dark);
      r(c, q + 18, 70, 16, 5, p.dark);
    }
  }
  function plazaMid(c, width, p) {
    station(c, width, p);
    for (var x = 0; x < width; x += 260) {
      tree(c, x + 104, 185, p, 1);
      tree(c, x + 227, 181, p, 0.72);
      fence(c, x + 16, 156, 145, p);
    }
    frame(c, 46, 66, 101, 18, '#17515c', p.dark);
    label(c, 'GUILHERME DA SILVEIRA', 54, 72, '#f6e4b9', 1);
    r(c, 92, 84, 4, 81, p.dark);
    frame(c, 404, 91, 104, 17, '#17515c', p.dark);
    label(c, 'ESTACAO BANGU', 415, 97, '#f5e4b2', 1);
  }
  function church(c, x, p) {
    var white = '#fff2d2', gold = '#d9ad59', wall = '#eac56f', shadow = '#987445';
    // Broad colonial facade: the pale corners and cornices stay distinct at 1x.
    frame(c, x + 2, 74, 246, 103, wall, p.dark);
    r(c, x + 5, 78, 240, 5, white);
    r(c, x + 5, 101, 240, 5, white);
    r(c, x + 4, 164, 242, 6, white);
    r(c, x + 9, 84, 8, 80, white);
    r(c, x + 233, 84, 8, 80, white);
    r(c, x + 20, 84, 3, 80, '#bd8e49');
    r(c, x + 227, 84, 3, 80, '#bd8e49');
    for (var col = 0; col < 2; col++) {
      var wx = x + (col ? 192 : 40);
      frame(c, wx, 114, 24, 41, '#71908a', shadow);
      r(c, wx + 3, 118, 18, 14, '#cde0cc');
      r(c, wx + 10, 115, 3, 39, shadow);
      r(c, wx + 3, 134, 18, 3, shadow);
      r(c, wx - 5, 107, 34, 4, white);
      r(c, wx - 6, 157, 36, 4, white);
    }
    // Curved stepped pediment above the central entrance.
    for (var py = 54; py <= 75; py += 0.5) {
      var span = 18 + 92 * Math.sqrt((py - 54) / 21);
      r(c, x + 125 - span, py, span * 2, 0.5,
        py < 57 || py > 71 ? white : gold);
    }
    r(c, x + 38, 72, 174, 5, white);
    r(c, x + 45, 77, 160, 3, '#fff9e4');
    // Central bell tower, visible bell and iron cross.
    frame(c, x + 95, 14, 60, 61, wall, p.dark);
    r(c, x + 99, 17, 52, 5, white);
    r(c, x + 101, 28, 48, 3, white);
    r(c, x + 100, 68, 50, 5, white);
    frame(c, x + 108, 34, 34, 29, '#4d5b59', shadow);
    r(c, x + 112, 37, 26, 4, '#88958a');
    r(c, x + 119, 44, 12, 13, '#d5a455');
    r(c, x + 122, 42, 6, 4, '#f2d48b');
    r(c, x + 124, 55, 2, 5, p.dark);
    r(c, x + 104, 10, 42, 5, white);
    r(c, x + 111, 5, 28, 5, '#e9ce8d');
    r(c, x + 123, 0, 4, 10, p.dark);
    r(c, x + 118, 4, 14, 3, p.dark);
    // Large wooden double doors with a white arched surround.
    frame(c, x + 86, 111, 78, 65, white, shadow);
    r(c, x + 91, 110, 68, 5, white);
    r(c, x + 94, 106, 62, 5, white);
    r(c, x + 99, 102, 52, 5, white);
    frame(c, x + 94, 119, 62, 57, '#704639', p.dark);
    r(c, x + 100, 124, 22, 48, '#906047');
    r(c, x + 128, 124, 22, 48, '#906047');
    r(c, x + 124, 120, 3, 54, p.dark);
    for (var grain = 0; grain < 8; grain++) {
      var gx = x + 101 + grain % 4 * 13;
      r(c, gx, 124 + grain % 3 * 3, 0.5, 44 - grain % 4 * 3,
        grain % 2 ? '#ad7c55' : '#54372f');
      r(c, gx + 2, 128 + grain % 4 * 2, 0.5, 18, '#c79767');
    }
    r(c, x + 116, 150, 3, 3, '#e4bd76');
    r(c, x + 132, 150, 3, 3, '#e4bd76');
    label(c, 'SAO SEBASTIAO E SANTA CECILIA', x + 61, 89, '#8d6639', 1);
    // Stair treads project from the doorway and remain above the ground layer.
    r(c, x + 85, 151, 80, 3, '#a78d68');
    r(c, x + 81, 154, 88, 3, white);
    r(c, x + 75, 157, 100, 3, '#c9b99a');
    r(c, x + 68, 160, 114, 3, white);
    r(c, x + 61, 163, 128, 3, '#c9b99a');
    r(c, x + 54, 166, 142, 4, white);
  }
  function storefront(c, x, y, w, p, name, color) {
    frame(c, x, y, w, 176 - y, p.wall, p.dark);
    r(c, x + 3, y + 3, w - 6, 5, p.wallLight);
    for (var col = 0; col < 2; col++) {
      var wx = x + 12 + col * (w / 2);
      frame(c, wx, y + 18, 23, 27, '#6f8b85', p.dark);
      r(c, wx + 3, y + 20, 17, 8, '#b7d0c0');
      r(c, wx + 11, y + 19, 2, 25, p.dark);
    }
    frame(c, x + 4, 126, w - 8, 16, color, p.dark);
    label(c, name, x + 8, 131, '#fff4d0', 1);
    r(c, x + 5, 142, w - 10, 2, '#392e35');
    for (var awn = 0; awn < w - 12; awn += 12) {
      r(c, x + 6 + awn, 143, 7, 5, name === 'PADARIA' ? '#f5d79b' : '#e8e4d0');
      r(c, x + 13 + awn, 143, 5, 5, color);
    }
    var bakery = name === 'PADARIA';
    frame(c, x + 12, 144, bakery ? 78 : w - 24, 32,
      bakery ? '#576d6d' : '#9a9b98', p.dark);
    if (bakery) {
      r(c, x + 15, 147, 72, 8, '#91b9b5');
      r(c, x + 15, 156, 72, 2, '#eee3c2');
      for (var bread = 0; bread < 6; bread++) {
        ellipse(c, x + 22 + bread * 10, 166, 5, 4, '#ad713e');
        ellipse(c, x + 22 + bread * 10, 164.5, 4, 2, '#ecc486');
        r(c, x + 19 + bread * 10, 163.5, 2.5, 0.5, '#fff1c6');
      }
    }
    var shutterX = bakery ? x + 94 : x + 15;
    var shutterW = bakery ? w - 107 : w - 30;
    frame(c, shutterX, 144, shutterW, 32, '#858787', p.dark);
    for (var slat = 147; slat < 175; slat += 3.5) {
      r(c, shutterX + 2, slat, shutterW - 4, 0.5, '#dee0d3');
      r(c, shutterX + 2, slat + 0.5, shutterW - 4, 1, '#5d6969');
    }
    for (var rail = shutterX + 9; rail < shutterX + shutterW - 4; rail += 15) {
      r(c, rail, 145, 1, 29, '#454d50');
    }
  }
  function largoMid(c, width, p) {
    for (var x = 0; x < width; x += 190) {
      storefront(c, x, 80 + ((x / 190) % 2) * 8, 183, p,
        x % 380 === 0 ? 'PADARIA' : 'LOJAS BANGU', x % 380 === 0 ? '#a44237' : '#417e79');
    }
    church(c, 115, p);  // Centre of the opening view.
    church(c, 620, p);  // Reappears along the scrolling street.
    church(c, 1375, p); // Centre of the boss fight.
  }
  function fruitStall(c, x, y, p) {
    frame(c, x + 4, y + 4, 77, 21, '#8c5d37', p.dark);
    r(c, x + 7, y + 7, 71, 4, '#bf8650');
    for (var i = 0; i < 9; i++) {
      var fruit = i % 3 === 0 ? '#c7473c' : i % 3 === 1 ? '#e1b44e' : '#6ba44b';
      frame(c, x + 10 + i * 7, y - 3 + i % 2 * 2, 7, 7, fruit, p.dark);
    }
    r(c, x + 8, y - 26, 3, 30, p.dark);
    r(c, x + 74, y - 26, 3, 30, p.dark);
    frame(c, x, y - 31, 85, 10, '#cb5145', p.dark);
    for (var j = 0; j < 7; j++) r(c, x + 4 + j * 12, y - 29, 7, 6, '#f2d58a');
    r(c, x + 1, y - 21, 83, 1.5, '#f9dfaa');
    for (var crate = 0; crate < 3; crate++) {
      frame(c, x + 8 + crate * 24, y + 8, 22, 15, '#a36a3c', '#5c3d30');
      r(c, x + 10 + crate * 24, y + 12, 18, 1, '#dfae71');
      r(c, x + 18 + crate * 24, y + 9, 2, 12, '#6b4830');
      for (var fruit = 0; fruit < 3; fruit++) {
        ellipse(c, x + 12 + crate * 24 + fruit * 6, y + 6, 3, 2.5,
          crate === 0 ? '#d54a3b' : crate === 1 ? '#e6b34b' : '#86aa49');
      }
    }
  }
  function house(c, x, y, w, p, index, stage) {
    var colors = ['#bd8976','#b9a37d','#8eaf9e','#a17c9e','#d0a47d'];
    var wall = stage === 10 ? p.wall : colors[index % colors.length];
    frame(c, x, y, w, 177 - y, wall, p.dark);
    r(c, x + 3, y + 3, w - 6, 4, p.wallLight);
    r(c, x - 3, y - 6, w + 6, 8, '#714f55');
    r(c, x + 7, y - 2, w - 14, 3, '#bb8473');
    for (var tile = x; tile < x + w; tile += 10) {
      r(c, tile + 2, y - 5, 5, 1, '#c17f62');
      r(c, tile + 6, y - 3, 0.5, 3, '#44353c');
    }
    for (var floor = 0; floor < 2; floor++) {
      for (var col = 0; col < 2; col++) {
        var wx = x + 18 + col * (w - 45);
        var wy = y + 17 + floor * 48;
        frame(c, wx, wy, 25, 28, stage >= 9 && (index + col + floor) % 3 !== 0 ? p.window : '#6a8390', p.dark);
        r(c, wx + 11, wy + 2, 2, 24, p.dark);
        r(c, wx + 2, wy + 12, 21, 2, p.dark);
        if (stage >= 9 && (index + col + floor) % 3 !== 0) r(c, wx + 3, wy + 3, 5, 4, '#fff2bf');
      }
    }
    frame(c, x + w / 2 - 14, 136, 28, 41, '#56494c', p.dark);
    r(c, x + w / 2 + 6, 156, 2, 2, '#d6b67e');
    for (var balcony = 0; balcony < 2; balcony++) {
      var bx = x + 15 + balcony * (w - 45);
      r(c, bx, y + 46, 32, 2, '#443c43');
      for (var bar = 0; bar < 5; bar++) r(c, bx + 2 + bar * 6, y + 47, 0.5, 6, '#51454b');
    }
    r(c, x + 5, 174, w - 10, 3, p.dark);
  }
  function belaMid(c, width, p, stage) {
    for (var x = 0, i = 0; x < width; x += 154, i++) house(c, x, 59 + i % 3 * 7,
      149, p, i, stage);
    frame(c, 600, 120, 110, 51, '#6f504c', p.dark);
    frame(c, 605, 115, 100, 17, '#a2483e', p.dark);
    label(c, 'BOTECO BELA FLOR', 614, 121, '#ffe3a1', 1);
    r(c, 615, 137, 80, 4, '#eccb92');
    for (var j = 0; j < 3; j++) {
      frame(c, 614 + j * 26, 143, 20, 27, '#7094a1', p.dark);
      r(c, 617 + j * 26, 146, 14, 5, '#bfd0c5');
    }
    frame(c, 1200, 118, 111, 53, '#64525c', p.dark);
    frame(c, 1205, 113, 101, 17, '#9f463e', p.dark);
    label(c, 'BOTECO', 1229, 119, '#ffe3a1', 1);
  }
  function plazaGround(c, p) {
    r(c, 0, 170, 3000, 39, '#c4b59d');
    r(c, 0, 170, 3000, 3, '#efe0bc');
    r(c, 0, 207, 3000, 6, '#777a77');
    r(c, 0, 213, 3000, 57, '#898a86');
    for (var x = 0; x < 3000; x += 38) {
      r(c, x, 190, 1, 17, '#998f80');
      r(c, x + 19, 174, 1, 15, '#998f80');
      if (x % 152 === 0) r(c, x + 8, 244, 23, 2, '#d9c9a1');
    }
    r(c, 0, 209, 3000, 2, '#e5d2b1');
    for (var y = 226; y < 270; y += 14) r(c, 0, y, 3000, 1, '#9b9c94');
    roadWear(c, 213, '#6f716e');
  }
  function roadWear(c, top, color) {
    for (var i = 0; i < 950; i++) {
      var xx = (i * 317 + Math.floor(i / 7) * 29) % 3000;
      var yy = top + 3 + (i * 73) % (267 - top);
      r(c, xx, yy, i % 4 ? 0.5 : 1.5, 0.5, i % 3 ? color : '#b5aba0');
    }
    for (var mark = 115; mark < 3000; mark += 390) {
      r(c, mark, top + 34, 41, 2.5, '#d7cab0');
      r(c, mark + 4, top + 34.5, 28, 0.5, '#f3e5c5');
      r(c, mark + 37, top + 34, 5, 2.5, color);
    }
  }
  function largoGround(c, p) {
    r(c, 0, 170, 3000, 100, '#777976');
    r(c, 0, 170, 3000, 37, '#e1d0ad');
    r(c, 0, 170, 3000, 4, '#f4e3bd');
    for (var y = 177; y < 206; y += 9) {
      var shift = Math.floor(y / 9) % 2 ? 6 : 0;
      for (var x = -shift; x < 3000; x += 13) {
        r(c, x, y, 7, 2, '#8e8881');
        r(c, x + 5, y + 3, 5, 2, '#c4b69b');
      }
    }
    for (var stripe = 0; stripe < 3000; stripe += 240) {
      for (var yy = 182; yy < 206; yy += 8) r(c, stripe + (yy % 16 ? 7 : 0), yy, 4, 2, '#605f62');
    }
    r(c, 0, 205, 3000, 1.5, '#f6e2ba');
    r(c, 0, 206.5, 3000, 2, '#877e70');
    r(c, 0, 208.5, 3000, 2, '#515b5b');
    for (var sc = 0; sc < 3000; sc += 37) {
      r(c, sc + 9, 174, 1, 18, '#a99f8e');
      r(c, sc + 25, 190, 1, 16, '#a99f8e');
    }
    roadWear(c, 210, '#5c6665');
  }
  function belaGround(c, p, stage) {
    r(c, 0, 170, 3000, 35, stage >= 9 ? '#99909a' : '#c4afa0');
    r(c, 0, 170, 3000, 3, '#dbbeb0');
    r(c, 0, 205, 3000, 5, '#6d6770');
    r(c, 0, 210, 3000, 60, stage === 10 ? '#454658' : stage === 9 ? '#666170' : '#7d7477');
    for (var x = 0; x < 3000; x += 31) {
      r(c, x, 186, 1, 19, '#8d8285');
      if (x % 155 === 0) r(c, x + 11, 248, 31, 2, stage === 10 ? '#b0a48d' : '#d0c0a4');
    }
    r(c, 0, 209, 3000, 2, '#c1aca0');
    for (var y = 221; y < 270; y += 15) r(c, 0, y, 3000, 1, '#6e6870');
    roadWear(c, 210, stage === 10 ? '#393d50' : '#696266');
  }
  function streetPole(c, x, p, stage) {
    lamp(c, x, 66, 171, p, stage >= 9, stage === 10);
    r(c, x - 3, 73, 54, 3, p.dark);
    for (var i = 0; i < 3; i++) wire(c, x + 42, 76 + i * 5, x + 300,
      74 + i * 4, p.dark);
  }
  function plazaNear(c, p) {
    plazaGround(c, p);
    for (var x = 0; x < 3000; x += 490) {
      bench(c, x + 142, 165, p);
      cart(c, x + 316, 152, p);
      streetPole(c, x + 30, p, 1);
      r(c, x + 262, 164, 3, 22, p.dark);
      frame(c, x + 248, 155, 33, 11, '#dfbc76', p.dark);
      label(c, 'BANGU', x + 252, 159, '#674e3f', 1);
    }
    frame(c, 76, 149, 120, 18, '#14505b', p.dark);
    label(c, 'GUILHERME DA SILVEIRA', 85, 155, '#ffe8bb', 1);
    r(c, 132, 167, 5, 23, p.dark);
  }
  function largoNear(c, p, stage) {
    largoGround(c, p);
    for (var seat = 0; seat < 3000; seat += 650) bench(c, seat + 60, 165, p);
    for (var x = 0; x < 3000; x += 420) {
      var group = Math.round(x / 420);
      if (group === 1 || group === 2 || group === 3 || group === 5 || group === 6) continue;
      fruitStall(c, x + 96, 158, p);
      lamp(c, x + 320, 96, 175, p, false, false);
      frame(c, x + 360, 155, 45, 11, '#a2443b', p.dark);
      label(c, 'PADARIA', x + 365, 159, '#ffe0a3', 1);
      r(c, x + 380, 166, 3, 20, p.dark);
    }
  }
  function car(c, x, y, p, color) {
    frame(c, x + 10, y - 21, 79, 24, color, p.dark);
    frame(c, x + 26, y - 35, 47, 18, color, p.dark);
    frame(c, x + 31, y - 32, 36, 12, '#7da0a6', p.dark);
    r(c, x + 47, y - 32, 2, 12, p.dark);
    r(c, x + 13, y - 17, 72, 3, '#d8afa0');
    frame(c, x + 21, y - 3, 14, 11, '#3d3e46', p.dark);
    frame(c, x + 65, y - 3, 14, 11, '#3d3e46', p.dark);
    r(c, x + 83, y - 15, 7, 4, '#ffe6aa');
  }
  function table(c, x, y, p) {
    frame(c, x, y, 31, 5, '#f2cf68', p.dark);
    r(c, x + 8, y - 4, 4, 4, '#f1d188');
    r(c, x + 8.5, y - 3.5, 3, 1, '#fff4c2');
    r(c, x + 10, y - 5, 0.5, 1.5, '#f7edce');
    r(c, x + 14, y + 5, 3, 14, '#d8b450');
    r(c, x - 8, y + 5, 5, 13, '#dbbc54');
    r(c, x - 12, y + 17, 13, 3, '#d5af4a');
    r(c, x + 34, y + 5, 5, 13, '#dbbc54');
    r(c, x + 32, y + 17, 13, 3, '#d5af4a');
  }
  function belaNear(c, p, stage) {
    belaGround(c, p, stage);
    for (var x = 0; x < 3000; x += 480) {
      frame(c, x + 48, 152, 112, 31, p.wall, p.dark);
      r(c, x + 54, 156, 104, 3, p.wallLight);
      frame(c, x + 75, 144, 61, 39, '#5c5b65', p.dark);
      for (var bar = 0; bar < 7; bar++) r(c, x + 81 + bar * 8, 146, 2, 35, '#b5aaa0');
      car(c, x + 270, 198, p, x % 960 ? '#a74c4c' : '#7b8196');
      streetPole(c, x + 225, p, stage);
      table(c, x + 181, 166, p);
      table(c, x + 396, 165, p);
    }
    frame(c, 621, 151, 113, 15, '#a94f44', p.dark);
    label(c, 'BOTECO BELA FLOR', 632, 156, '#ffe6aa', 1);
  }
  function speaker(c, x, y, p) {
    frame(c, x, y - 35, 26, 37, '#292a33', p.dark);
    ellipse(c, x + 13, y - 11, 9, 9, '#10141e');
    ellipse(c, x + 13, y - 11, 5, 5, '#62616c');
    ellipse(c, x + 13, y - 26, 4, 4, '#81818a');
    r(c, x + 4, y - 33, 17, 1, '#9a9da8');
  }
  function calcadaoMid(c, width, p) {
    var names = ['MODAS BANGU','PADARIA','CASAS BAHIA','LOJA DE 1,99','SAPATOS','ELETRONICOS'];
    var colors = ['#9b4050','#bd7042','#367e89','#c0643e','#5d6492','#668653'];
    for (var x = 0, i = 0; x < width; x += 145, i++) {
      storefront(c, x, 65 + i % 3 * 5, 139, p,
        names[i % names.length], colors[i % colors.length]);
      frame(c, x + 13, 82, 110, 26, i % 2 ? '#b88b69' : '#9d7773', p.dark);
      for (var rail = 0; rail < 6; rail++) r(c, x + 18 + rail * 17, 86, 2, 19, p.dark);
      r(c, x + 9, 108, 122, 3, '#e7d3ac');
      r(c, x + 14, 112, 112, 1, '#765d55');
    }
  }
  function calcadaoNear(c, p) {
    r(c, 0, 170, 3000, 100, '#c7b9a5');
    r(c, 0, 170, 3000, 3, '#f9e4b8');
    for (var x = 0; x < 3000; x += 34) {
      r(c, x, 175, 1, 95, '#9c9288');
      for (var y = 183; y < 270; y += 17) {
        r(c, x + 3, y, 29, 1, '#a89b8b');
        r(c, x + 12, y + 6, 8, 1, '#e3d3b8');
      }
    }
    for (var stall = 0; stall < 3000; stall += 350) {
      cart(c, stall + 38, 151, p);
      speaker(c, stall + 164, 170, p);
      frame(c, stall + 225, 154, 68, 18, '#8f6245', p.dark);
      r(c, stall + 230, 157, 56, 2, '#e3bd7d');
      for (var item = 0; item < 5; item++) {
        frame(c, stall + 233 + item * 10, 148, 8, 7,
          item % 2 ? '#e2bd62' : '#b9584d', p.dark);
      }
    }
  }
  function factoryMid(c, width, p) {
    for (var x = 0; x < width; x += 300) {
      frame(c, x, 56, 296, 120, '#a75a4d', '#50373b');
      r(c, x + 3, 59, 290, 4, '#cf826a');
      for (var row = 0; row < 13; row++) {
        for (var brick = x + 3 + row % 2 * 8; brick < x + 292; brick += 17) {
          r(c, brick, 68 + row * 8, 13, 1, '#d28b70');
          r(c, brick + 13, 69 + row * 8, 0.5, 5, '#784742');
        }
      }
      for (var win = 0; win < 5; win++) {
        var wx = x + 20 + win * 54;
        frame(c, wx, 84, 34, 65, '#4d6770', '#e0b48a');
        ellipse(c, wx + 17, 85, 17, 9, '#e0b48a');
        ellipse(c, wx + 17, 88, 14, 7, '#7192a1');
        r(c, wx + 16, 87, 2, 60, '#e0b48a');
        for (var pane = 0; pane < 3; pane++) r(c, wx + 2, 103 + pane * 13, 30, 2, '#e0b48a');
      }
      // The old mill chimney and its clock distinguish this facade from shops.
      frame(c, x + 244, 3, 29, 66, '#9d5148', '#533b3e');
      r(c, x + 239, 2, 39, 5, '#d19474');
      ellipse(c, x + 150, 71, 23, 23, '#e8c491');
      ellipse(c, x + 150, 71, 19, 19, '#fff2ce');
      r(c, x + 149, 59, 2, 14, '#553f3b');
      line(c, x + 150, 71, x + 160, 76, '#553f3b', 1);
      frame(c, x + 105, 148, 90, 28, '#604a49', '#2f3038');
      for (var gate = 0; gate < 9; gate++) r(c, x + 110 + gate * 10, 150, 1.5, 24, '#aa8d7c');
    }
    frame(c, 398, 109, 199, 33, '#633b3d', '#e5b886');
    label(c, 'BANGU SHOPPING', 412, 120, '#ffe3ae', 2);
  }
  function factoryNear(c, p) {
    plazaGround(c, p);
    for (var x = 0; x < 3000; x += 400) {
      frame(c, x + 30, 157, 80, 15, '#94614d', p.dark);
      label(c, 'FABRICA', x + 38, 161, '#ffdbad', 1);
      r(c, x + 45, 173, 3, 16, '#5c4441');
      r(c, x + 99, 173, 3, 16, '#5c4441');
      bench(c, x + 210, 165, p);
      r(c, x + 300, 163, 37, 4, '#d7a47b');
      r(c, x + 306, 167, 4, 18, '#72534a');
      r(c, x + 328, 167, 4, 18, '#72534a');
    }
  }
  function floodlight(c, x, p) {
    r(c, x - 3, 15, 6, 149, p.dark);
    r(c, x - 17, 13, 34, 6, '#62646a');
    for (var bulb = 0; bulb < 4; bulb++) {
      frame(c, x - 14 + bulb * 8, 8, 7, 9, '#fff2b1', p.dark);
      r(c, x - 12 + bulb * 8, 9, 2, 3, '#ffffff');
    }
    line(c, x - 2, 64, x + 21, 95, '#74767a', 1);
    line(c, x + 2, 64, x - 21, 95, '#74767a', 1);
  }
  function stadiumMid(c, width, p) {
    r(c, 0, 83, width, 92, '#c9c5bb');
    for (var stand = 0; stand < width; stand += 12) {
      r(c, stand, 89 + stand % 4 * 3, 9, 1, '#8b8581');
      r(c, stand + 3, 106 + stand % 3 * 2, 8, 1, '#e9e2d0');
    }
    r(c, 0, 136, width, 40, '#a92e35');
    for (var x = 0; x < width; x += 55) {
      r(c, x + 3, 138, 25, 38, '#faf2dc');
      r(c, x + 28, 138, 24, 38, '#bb3540');
    }
    r(c, 0, 134, width, 5, '#f5e7d8');
    for (var pole = 0; pole < width; pole += 22) {
      r(c, pole, 95, 1, 72, '#65656a');
      for (var mesh = 98; mesh < 137; mesh += 9) {
        line(c, pole, mesh, pole + 21, mesh + 9, '#8b8988', 0.5);
        line(c, pole + 21, mesh, pole, mesh + 9, '#8b8988', 0.5);
      }
    }
    r(c, 0, 95, width, 2, '#44464c');
    for (var light = 195; light < width; light += 480) floodlight(c, light, p);
    for (var flag = 80; flag < width; flag += 235) {
      r(c, flag, 37, 2, 61, p.dark);
      r(c, flag + 2, 40, 24, 8, '#c2323b');
      r(c, flag + 2, 48, 24, 8, '#f4ebdb');
      r(c, flag + 2, 56, 24, 8, '#c2323b');
    }
    frame(c, 365, 105, 225, 31, '#9f2934', '#fff0df');
    label(c, 'BANGU AC MOCA BONITA', 380, 116, '#fff4d9', 2);
  }
  function stadiumNear(c, p) {
    r(c, 0, 170, 3000, 100, '#ad705b');
    r(c, 0, 170, 3000, 4, '#f3e8d0');
    r(c, 0, 175, 3000, 3, '#6f5e5b');
    for (var lane = 197; lane < 270; lane += 28) {
      r(c, 0, lane, 3000, 1.5, '#e9d9c6');
      r(c, 0, lane + 3, 3000, 0.5, '#895f55');
    }
    for (var spot = 0; spot < 700; spot++) {
      r(c, (spot * 179 + spot % 7 * 31) % 3000,
        180 + (spot * 47) % 88, 0.5, 0.5, spot % 2 ? '#c6896e' : '#805a50');
    }
    for (var x = 0; x < 3000; x += 430) {
      frame(c, x + 65, 153, 94, 16, '#9c3037', '#fff0e1');
      label(c, 'BANGU AC', x + 78, 158, '#fff0e1', 1);
      r(c, x + 75, 169, 3, 17, '#eee0ca');
      r(c, x + 148, 169, 3, 17, '#eee0ca');
    }
  }
  function fairBooth(c, x, y, p, type, color) {
    r(c, x + 6, y - 28, 3, 37, p.dark);
    r(c, x + 100, y - 28, 3, 37, p.dark);
    frame(c, x, y - 38, 111, 14, color, p.dark);
    for (var stripe = 3; stripe < 106; stripe += 15) {
      r(c, x + stripe, y - 35, 9, 8, '#f5e9c4');
    }
    frame(c, x + 7, y + 1, 97, 17, '#8f6040', p.dark);
    r(c, x + 10, y + 4, 90, 2, '#e1ac6c');
    for (var item = 0; item < 10; item++) {
      var px = x + 14 + item * 9;
      if (type === 2) {
        ellipse(c, px, y - 1, 4, 2.5, '#b9d2d4');
        r(c, px + 2, y - 2, 1, 1, '#526d73');
      } else ellipse(c, px, y - 1, 4, 4,
        type === 0 ? item % 2 ? '#d44d42' : '#f0bb4f' :
          item % 2 ? '#4d9f59' : '#8eb45d');
    }
    for (var crate = 0; crate < 3; crate++) {
      frame(c, x + 10 + crate * 32, y + 16, 28, 12, '#b7814d', '#624532');
      r(c, x + 13 + crate * 32, y + 21, 22, 1, '#e3ad6b');
    }
  }
  function fairMid(c, width, p) {
    for (var x = 0; x < width; x += 124) {
      frame(c, x, 82 + x % 3 * 5, 119, 94,
        x % 248 ? '#d8b892' : '#b8a5a0', p.dark);
      frame(c, x + 18, 104, 28, 30, '#799aa0', p.dark);
      frame(c, x + 72, 104, 28, 30, '#799aa0', p.dark);
      r(c, x, 143, 119, 5, '#8a6b68');
    }
    for (var stall = 0; stall < width; stall += 170) {
      fairBooth(c, stall + 18, 150, p, Math.floor(stall / 170) % 3,
        ['#ce6548','#6b9b69','#637fa0'][Math.floor(stall / 170) % 3]);
    }
    frame(c, 722, 74, 208, 23, '#c35444', '#fff0cd');
    label(c, 'FEIRA LIVRE DE BANGU', 735, 82, '#fff1d6', 2);
  }
  function fairNear(c, p) {
    largoGround(c, p);
    for (var x = 0; x < 3000; x += 440) {
      fairBooth(c, x + 35, 148, p, x % 3, x % 880 ? '#5c92a4' : '#d87946');
      fruitStall(c, x + 240, 154, p);
      for (var basket = 0; basket < 3; basket++) {
        ellipse(c, x + 170 + basket * 24, 170, 11, 5, '#8e613f');
        ellipse(c, x + 170 + basket * 24, 167, 9, 4,
          basket === 2 ? '#7baa5d' : '#e2b74d');
      }
    }
  }
  function trainMid(c, width, p) {
    r(c, 0, 45, width, 11, '#54616b');
    r(c, 0, 55, width, 3, '#c1c0b5');
    for (var beam = 0; beam < width; beam += 135) {
      line(c, beam, 55, beam + 68, 74, '#65717a', 2);
      line(c, beam + 68, 74, beam + 135, 55, '#65717a', 2);
      r(c, beam + 65, 56, 5, 118, '#5c656d');
    }
    r(c, 0, 93, width, 80, '#e3e4de');
    r(c, 0, 98, width, 7, '#3677a6');
    r(c, 0, 145, width, 6, '#eaa83c');
    r(c, 0, 164, width, 8, '#5e6770');
    for (var car = 0; car < width; car += 220) {
      r(c, car, 94, 3, 76, '#727d82');
      for (var window = 0; window < 4; window++) {
        frame(c, car + 12 + window * 47, 110, 35, 30, '#577d91', '#415763');
        r(c, car + 15 + window * 47, 113, 8, 4, '#b5d2d0');
        r(c, car + 40 + window * 47, 114, 3, 24, '#94b5bc');
      }
      frame(c, car + 194, 106, 23, 59, '#d0d5d2', '#5b6870');
      r(c, car + 205, 108, 2, 53, '#658196');
      label(c, 'SUPERVIA', car + 67, 152, '#286a97', 1);
    }
    for (var sign = 250; sign < width; sign += 520) {
      frame(c, sign, 65, 117, 22, '#245d81', '#dae4d5');
      label(c, 'BANGU', sign + 31, 72, '#fff2cb', 2);
      r(c, sign + 56, 87, 3, 14, '#5c646d');
    }
  }
  function trainNear(c, p) {
    r(c, 0, 170, 3000, 100, '#9ca6a2');
    r(c, 0, 170, 3000, 5, '#e8d8a4');
    for (var x = 0; x < 3000; x += 6) {
      r(c, x, 171, 3, 2, '#91856a');
      if (x % 30 === 0) r(c, x, 192, 1, 78, '#6f7776');
    }
    r(c, 0, 176, 3000, 2, '#5e6770');
    for (var y = 206; y < 270; y += 22) r(c, 0, y, 3000, 1, '#747e7b');
    for (var gate = 0; gate < 3000; gate += 480) {
      frame(c, gate + 40, 149, 31, 29, '#79838a', p.dark);
      r(c, gate + 54, 142, 4, 35, '#5d686f');
      r(c, gate + 29, 151, 55, 3, '#c2c5bb');
      r(c, gate + 45, 156, 5, 8, '#9fc3b8');
      bench(c, gate + 247, 166, p);
      frame(c, gate + 347, 155, 81, 13, '#2d6384', '#d3dcdb');
      label(c, 'PLATAFORMA', gate + 354, 159, '#f8eecd', 1);
      r(c, gate + 383, 168, 3, 17, '#707d84');
    }
  }
  function forestFar(c, width, p) {
    r(c, 0, 135, width, 43, '#4b6973');
    for (var x = 0; x < width; x += 2) {
      var peak = 71 + 16 * Math.sin(x * 0.009) + 13 * Math.sin(x * 0.022);
      r(c, x, peak, 2, 105 - peak, '#557077');
      r(c, x, peak + 9, 2, 105 - peak, '#657f79');
    }
    for (var fall = 250; fall < width; fall += 480) {
      r(c, fall - 13, 95, 57, 74, '#344f58');
      r(c, fall, 95, 23, 72, '#b4cbd0');
      r(c, fall + 4, 97, 5, 67, '#e0e8df');
      r(c, fall + 16, 103, 3, 58, '#7babb4');
      ellipse(c, fall + 11, 167, 37, 7, '#8faeb1');
      ellipse(c, fall + 11, 169, 27, 4, '#dae5d9');
    }
  }
  function forestMid(c, width, p) {
    r(c, 0, 155, width, 21, '#345a4f');
    for (var x = 0; x < width; x += 107) {
      tree(c, x + 47, 178, p, 0.75 + x % 3 * 0.08);
      ellipse(c, x + 89, 164, 19, 13, '#253e42');
      ellipse(c, x + 85, 159, 14, 8, '#577364');
      for (var leaf = 0; leaf < 5; leaf++) {
        ellipse(c, x + leaf * 22, 169, 13, 8,
          leaf % 2 ? '#41684e' : '#6f8f63');
      }
    }
    for (var fall = 260; fall < width; fall += 620) {
      ellipse(c, fall + 12, 164, 43, 13, '#263f44');
      r(c, fall - 8, 102, 40, 64, '#37575c');
      r(c, fall, 99, 23, 66, '#aacdd1');
      r(c, fall + 4, 100, 4, 59, '#e4eadd');
      r(c, fall + 14, 105, 3, 54, '#5e9faa');
      ellipse(c, fall + 12, 165, 34, 8, '#92b9b7');
      ellipse(c, fall + 12, 168, 23, 4, '#e0e6d8');
    }
  }
  function forestNear(c, p) {
    r(c, 0, 170, 3000, 100, '#665d56');
    r(c, 0, 170, 3000, 4, '#7c8d64');
    for (var y = 179; y < 270; y += 19) {
      for (var x = 0; x < 3000; x += 37) {
        r(c, x + y % 13, y, 17, 2, '#8a7967');
        r(c, x + 7, y + 5, 3, 1, '#463f40');
      }
    }
    for (var rock = 0; rock < 3000; rock += 145) {
      ellipse(c, rock + 36, 195 + rock % 4 * 11, 17, 7, '#343f43');
      ellipse(c, rock + 32, 193 + rock % 4 * 11, 12, 5, '#8c9183');
      r(c, rock + 96, 172, 2, 9, '#587154');
      r(c, rock + 92, 174, 10, 3, '#7d9b68');
      for (var firefly = 0; firefly < 4; firefly++) {
        var fx = rock + 19 + firefly * 26, fy = 127 + firefly % 3 * 11;
        ellipse(c, fx, fy, 3, 3, '#b4ba82');
        ellipse(c, fx, fy, 1.5, 1.5, '#fff7b6');
      }
    }
  }
  function nightMid(c, width, p) {
    var colors = ['#4a5870','#514360','#3c5b62','#5e465d'];
    var neon = ['#ee728f','#83d5ce','#f2c45e','#a69aec'];
    for (var x = 0, i = 0; x < width; x += 150, i++) {
      frame(c, x, 37 + i % 3 * 14, 146, 139 - i % 3 * 14,
        colors[i % 4], '#222b3d');
      r(c, x + 4, 42 + i % 3 * 14, 138, 3, '#74839a');
      for (var row = 0; row < 4; row++) for (var col = 0; col < 5; col++) {
        frame(c, x + 12 + col * 26, 56 + i % 3 * 14 + row * 20,
          15, 11, (i + row + col) % 3 ? '#ebc283' : '#5b7790', '#242d3e');
      }
      frame(c, x + 8, 139, 130, 24, '#282b41', neon[i % 4]);
      label(c, ['LANCHES','BANGU NIGHT','PODRAO','24 HORAS'][i % 4],
        x + 17, 147, neon[i % 4], 1.5);
      r(c, x + 14, 164, 118, 2, neon[i % 4]);
    }
  }
  function nightNear(c, p) {
    belaGround(c, p, 10);
    for (var x = 0; x < 3000; x += 390) {
      cart(c, x + 45, 149, p);
      r(c, x + 45, 119, 76, 2, '#ffb77b');
      label(c, 'X TUDO', x + 56, 122, '#ffe1a0', 1);
      lamp(c, x + 256, 56, 172, p, true, true);
      frame(c, x + 166, 155, 60, 13, '#293244', '#ee758d');
      label(c, 'BANGU', x + 181, 159, '#f69db7', 1);
      car(c, x + 284, 198, p, x % 780 ? '#9c3e5c' : '#477b88');
    }
  }
  function crowdSprite(index, frameNo, stage) {
    var canvas = document.createElement('canvas');
    canvas.width = 48; canvas.height = 80;
    var c = canvas.getContext('2d');
    if (c.scale) c.scale(2, 2);
    var skins = ['#c68d61','#704735','#e6ba85','#a96a49','#8b573c','#d29e72','#b67750','#edc59a'];
    var shirts = ['#6a9c9e','#db8367','#e2cf86','#7587a8','#b786a1','#89a26f','#ca7961','#8c7d9f'];
    var hair = ['#29232b','#54352c','#3e3031','#241f26','#764b36','#393039','#473129','#a9683b'];
    var skin = stage >= 9 ? shade(skins[index], -25) : skins[index];
    var shirt = stage >= 9 ? shade(shirts[index], -25) : shirts[index];
    var height = 33 + index % 4 * 2, breathe = frameNo % 4 === 1 ? 0.5 : 0;
    var base = 39, headY = base - height + 5 + breathe;
    ellipse(c, 12, base - 2, 6, 1.5, '#776c70');
    r(c, 7, base - 11, 4, 9, '#46404b');
    r(c, 13, base - 11, 4, 9, '#46404b');
    r(c, 7.5, base - 3, 4, 1.5, '#302d35');
    r(c, 13, base - 3, 4, 1.5, '#302d35');
    ellipse(c, 12, base - 18 + breathe, 8, 9, '#292630');
    ellipse(c, 12, base - 19 + breathe, 7, 8, shirt);
    r(c, 4, base - 18 + breathe, 3.5, 10, skin);
    r(c, 16.5, base - 18 + breathe, 3.5, frameNo === 2 ? 7 : 10, skin);
    if (frameNo === 2) r(c, 18, base - 18 + breathe, 6, 3, skin);
    ellipse(c, 12, headY + 5, 6.5, 7.5, '#2b2630');
    ellipse(c, 12, headY + 5, 5.5, 6.5, skin);
    ellipse(c, 11, headY + 0.5, 6.5, index % 3 ? 3.5 : 5, hair[index]);
    if (index % 3 === 0) r(c, 5, headY + 3, 2, 8, hair[index]);
    if (frameNo !== 3) {
      r(c, 9, headY + 6, 1.5, 1.5, '#2b2530');
      r(c, 14, headY + 6, 1.5, 1.5, '#2b2530');
    } else {
      r(c, 9, headY + 7, 2, 0.5, '#2b2530');
      r(c, 14, headY + 7, 2, 0.5, '#2b2530');
    }
    r(c, 11, headY + 10, 2, 0.5, '#6b3d39');
    return canvas;
  }
  function crowdSet(stage) {
    var result = [];
    for (var i = 0; i < 8; i++) {
      result[i] = [];
      for (var f = 0; f < 4; f++) result[i][f] = crowdSprite(i, f, stage);
    }
    return result;
  }
  function render(stage) {
    var p = palette(stage);
    var skyLayer = makeCanvas(480), hd = skyLayer.hd;
    var cloudLayer = hd ? makeCanvas(1024) : null, far = makeCanvas(1024, hd);
    var mid = makeCanvas(1800, hd), near = makeCanvas(3000, hd);
    sky(skyLayer.ctx, stage, p);
    if (hd) clouds(cloudLayer.ctx, stage);
    if (stage === 9) forestFar(far.ctx, 1024, p);
    else distantBlocks(far.ctx, 1024, stage, p);
    if (stage === 1) { plazaMid(mid.ctx, 1800, p); plazaNear(near.ctx, p); }
    else if (stage === 2) { calcadaoMid(mid.ctx, 1800, p); calcadaoNear(near.ctx, p); }
    else if (stage === 3) { largoMid(mid.ctx, 1800, p); largoNear(near.ctx, p, stage); }
    else if (stage === 4) { factoryMid(mid.ctx, 1800, p); factoryNear(near.ctx, p); }
    else if (stage === 5) { stadiumMid(mid.ctx, 1800, p); stadiumNear(near.ctx, p); }
    else if (stage === 6) { fairMid(mid.ctx, 1800, p); fairNear(near.ctx, p); }
    else if (stage === 7) { trainMid(mid.ctx, 1800, p); trainNear(near.ctx, p); }
    else if (stage === 8) { belaMid(mid.ctx, 1800, p, stage); belaNear(near.ctx, p, stage); }
    else if (stage === 9) { forestMid(mid.ctx, 1800, p); forestNear(near.ctx, p); }
    else { nightMid(mid.ctx, 1800, p); nightNear(near.ctx, p); }
    return { sky: skyLayer.canvas, clouds: hd ? cloudLayer.canvas : null, far: far.canvas,
      mid: mid.canvas, near: near.canvas, crowd: hd ? crowdSet(stage) : null,
      hd: hd };
  }
  function safeStage(stage) {
    stage = Number(stage);
    return Number.isFinite(stage) ? Math.max(1, Math.min(10, Math.floor(stage))) : 1;
  }
  window.Backgrounds = {
    places: PLACES,
    drawFront: function () {},
    draw: function (ctx, stage, camX, time) {
      stage = safeStage(stage);
      if (!CACHE[stage]) CACHE[stage] = render(stage);
      camX = Number.isFinite(camX) ? Math.max(0, Math.min(2520, camX)) : 0;
      var l = CACHE[stage];
      ctx.imageSmoothingEnabled = false;
      if (!l.hd) {
        ctx.drawImage(l.sky, 0, 0);
        ctx.drawImage(l.far, Math.round(-camX * 0.2), 0);
        ctx.drawImage(l.mid, Math.round(-camX * 0.5), 0);
        ctx.drawImage(l.near, Math.round(-camX), 0);
        return;
      }
      ctx.drawImage(l.sky, 0, 0, 480, 270);
      var cloudX = -((Math.max(0, Number(time) || 0) * 4) % 512);
      ctx.drawImage(l.clouds, cloudX, 0, 1024, 270);
      ctx.drawImage(l.clouds, cloudX + 1024, 0, 1024, 270);
      ctx.drawImage(l.far, -camX * 0.2, 0, 1024, 270);
      ctx.drawImage(l.mid, -camX * 0.5, 0, 1800, 270);
      var tick = Math.floor((Number(time) || 0) * 3);
      for (var person = 0; person < 26; person++) {
        var worldX = 38 + person * 68 + person % 3 * 7;
        var screenX = worldX - camX * 0.5;
        if (screenX < -24 || screenX > 480) continue;
        var variant = person % 8;
        var pose = (tick + person * 2) % 16;
        var picture = l.crowd[variant][pose === 0 ? 3 : pose < 5 ? 1 : pose < 8 ? 2 : 0];
        ctx.drawImage(picture, screenX, 129 + person % 3 * 2, 24, 40);
      }
      ctx.drawImage(l.near, -camX, 0, 3000, 270);
    }
  };
}());
