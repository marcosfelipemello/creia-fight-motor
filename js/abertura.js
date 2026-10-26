// Abertura em vídeo (feita no HyperFrames, cutscenes/abertura). Toca por cima do jogo ao abrir; não mexe no motor:
// enquanto passa, o jogo "acha" que a aba está escondida (fica mudo) e não recebe toque nem tecla.
// No celular o toque do "TOQUE PARA JOGAR" já dá o play com som; no PC, se o navegador barrar o som, pede um clique.
// Pula com o botão PULAR ou Enter/Esc/Espaço. Link de sala (?sala=) pula a abertura para não atrasar a entrada na partida.
// Carrega logo depois do <canvas>, antes dos scripts pesados, para o vídeo baixar junto com o jogo e não depois dele.
(function () {
  var doc = document;
  if (/[?&]sala=/.test(location.search)) return;
  var realHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
  var playing = true;
  try { Object.defineProperty(doc, 'hidden', { configurable: true, get: function () { return playing || realHidden.get.call(doc); } }); } catch (e) { return; }

  var css = doc.createElement('style');
  css.textContent = '#abertura{position:fixed;inset:0;z-index:8;background:#000;display:flex;align-items:center;justify-content:center;transition:opacity .4s}' +
    '#abertura video{width:100%;height:100%;object-fit:contain}' +
    '#abertura .ab-btn{position:absolute;font:12px "Press Start 2P",monospace;color:#fff;background:rgba(0,0,0,.55);border:2px solid rgba(255,255,255,.5);border-radius:8px;padding:10px 14px;cursor:pointer}' +
    '#ab-pular{right:calc(16px + env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));display:none}' +
    '#ab-play{left:50%;top:50%;transform:translate(-50%,-50%);font-size:14px;border-color:#e8323c;display:none}';
  doc.head.appendChild(css);
  var box = doc.createElement('div'); box.id = 'abertura';
  box.innerHTML = '<video playsinline preload="auto" src="assets/abertura.mp4?v=5"></video>' +
    '<div class="ab-btn" id="ab-play">▶ TOQUE PARA COMEÇAR</div><div class="ab-btn" id="ab-pular">PULAR ▶▶</div>';
  doc.body.appendChild(box);
  var video = box.querySelector('video'), play = box.querySelector('#ab-play'), pular = box.querySelector('#ab-pular');
  // no celular quem dá o play é o "TOQUE PARA JOGAR" (telacheia.js, que só aparece depois que o jogo carrega)
  var root = doc.documentElement, standalone = window.matchMedia && matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
  var waitGate = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && !!(root.requestFullscreen || root.webkitRequestFullscreen) && !standalone;
  var events = ['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend', 'keydown', 'keyup'];

  function start() {
    play.style.display = 'none';
    var p = video.play();
    if (p && p.catch) p.catch(function () { play.style.display = 'block'; });   // navegador barrou: espera um toque
  }
  function end() {
    if (!playing) return;
    playing = false; video.pause();
    events.forEach(function (n) { removeEventListener(n, guard, true); });
    box.style.opacity = '0'; setTimeout(function () { box.remove(); }, 450);
    doc.dispatchEvent(new Event('visibilitychange'));   // o jogo volta a tocar a música do menu
  }
  // nada chega ao jogo enquanto a abertura passa; o toque serve para começar ou pular
  function guard(e) {
    var gate = doc.getElementById('fsgate');
    if (gate && gate.contains(e.target)) { if (e.type === 'click') { waitGate = false; start(); } return; }   // "TOQUE PARA JOGAR" segue normal e dá o play
    e.stopPropagation(); if (e.cancelable) e.preventDefault();
    if (e.type === 'pointerup') { if (pular.contains(e.target)) end(); else if (video.paused && !waitGate) start(); }   // no fim do toque: o click não vem (toque cancelado acima)
    if (e.type === 'keydown' && !e.repeat) { if (video.paused) start(); else if (/^(Enter|Escape| )$/.test(e.key)) end(); }
  }
  events.forEach(function (n) { addEventListener(n, guard, true); });
  video.addEventListener('playing', function () { pular.style.display = 'block'; });   // PULAR só aparece depois que a abertura começou
  video.addEventListener('ended', end);
  video.addEventListener('error', end);   // sem vídeo (offline, erro): vai direto pro jogo
  if (!waitGate) start();
  else addEventListener('load', function () { if (!doc.getElementById('fsgate')) { waitGate = false; start(); } });   // carregou sem a tela de toque: começa já
}());
