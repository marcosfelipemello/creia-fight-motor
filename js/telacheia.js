// Tela cheia: botão no canto (e tecla F); no celular, virar de lado arma a tela cheia e o primeiro toque entra nela
// (o navegador só deixa entrar em tela cheia a partir de um toque/clique). No iPhone o Safari não tem tela cheia
// para sites: o botão explica como instalar na tela de início, que abre sem a barra do navegador.
(function () {
  var doc = document, root = doc.documentElement;
  var canFS = !!(root.requestFullscreen || root.webkitRequestFullscreen);
  var touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var standalone = window.matchMedia && matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
  if (standalone) {   // aberto como app instalado: já vem em tela cheia; só trava deitado no primeiro toque
    addEventListener('pointerdown', function () { try { screen.orientation.lock('landscape').catch(function () {}); } catch (e) { /* sem trava */ } }, { once: true, capture: true });
    return;
  }
  // botão "INSTALAR" quando o navegador oferece instalar o app (Android/Chrome/Edge); some depois de instalado
  var promptEv = null, ibtn = null;
  addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); promptEv = e;
    if (ibtn) return;
    ibtn = doc.createElement('div'); ibtn.id = 'instbtn'; ibtn.setAttribute('role', 'button'); ibtn.textContent = 'INSTALAR';
    ibtn.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); });
    ibtn.addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopPropagation(); if (!promptEv) return;
      promptEv.prompt(); promptEv.userChoice.then(function () { promptEv = null; ibtn.remove(); ibtn = null; });
    });
    doc.body.appendChild(ibtn);
  });
  addEventListener('appinstalled', function () { if (ibtn) { ibtn.remove(); ibtn = null; } });

  function isFS() { return !!(doc.fullscreenElement || doc.webkitFullscreenElement); }
  var pending = false;   // pedido de tela cheia em andamento: não pede de novo nem sai sem querer
  function enter() {
    if (pending || isFS()) return;
    pending = true;
    var p = root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : root.webkitRequestFullscreen();
    if (p && p.then) p.then(function () { pending = false; lock(); }, function () { pending = false; }); else { pending = false; lock(); }
  }
  function lock() { try { screen.orientation.lock('landscape').catch(function () {}); } catch (e) { /* sem trava de orientação: segue */ } }
  function exit() { (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc); }
  function toggle() { if (!canFS) return showTip(); if (pending) return; isFS() ? exit() : enter(); }

  // botão no canto de cima (no celular fica ao lado do botão de pausa)
  var css = doc.createElement('style');
  css.textContent = '#fsbtn{position:fixed;z-index:6;top:calc(16px + env(safe-area-inset-top,0px));right:calc(' + (touch ? 58 : 16) + 'px + env(safe-area-inset-right,0px));' +
    'width:34px;height:34px;border-radius:8px;border:2px solid rgba(255,255,255,.35);background:rgba(0,0,0,.35);display:flex;align-items:center;' +
    'justify-content:center;cursor:pointer;touch-action:none;-webkit-tap-highlight-color:transparent}#fsbtn:hover{background:rgba(232,50,60,.6)}' +
    '#instbtn{position:fixed;z-index:6;top:calc(16px + env(safe-area-inset-top,0px));right:calc(' + (touch ? 100 : 58) + 'px + env(safe-area-inset-right,0px));height:34px;padding:0 10px;border-radius:8px;border:2px solid #e8323c;background:rgba(232,50,60,.85);color:#fff;font:9px "Press Start 2P",monospace;display:flex;align-items:center;cursor:pointer;touch-action:none}' +
    '#fsbtn svg{width:18px;height:18px}#fstip{position:fixed;z-index:7;left:50%;top:50%;transform:translate(-50%,-50%);max-width:300px;padding:16px;' +
    'background:#14121c;border:2px solid #e8323c;color:#fff;font:10px/1.8 "Press Start 2P",monospace;text-align:center;border-radius:6px}';
  doc.head.appendChild(css);
  var btn = doc.createElement('div');
  btn.id = 'fsbtn'; btn.setAttribute('role', 'button'); btn.setAttribute('aria-label', 'Tela cheia');
  var ICON_IN = '<svg viewBox="0 0 18 18" fill="none" stroke="#fff" stroke-width="2.4"><path d="M1 6V1h5M12 1h5v5M17 12v5h-5M6 17H1v-5"/></svg>';
  var ICON_OUT = '<svg viewBox="0 0 18 18" fill="none" stroke="#fff" stroke-width="2.4"><path d="M6 1v5H1M17 6h-5V1M12 17v-5h5M1 12h5v5"/></svg>';
  function refresh() { btn.innerHTML = isFS() ? ICON_OUT : ICON_IN; }
  btn.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); });
  btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); toggle(); });
  doc.body.appendChild(btn); refresh();
  doc.addEventListener('fullscreenchange', refresh); doc.addEventListener('webkitfullscreenchange', refresh);

  // tecla F no PC
  addEventListener('keydown', function (e) { if (e.code === 'KeyF' && !e.repeat) toggle(); });

  // celular deitado: o próximo toque em qualquer lugar entra em tela cheia
  function landscape() { return (screen.orientation && /landscape/.test(screen.orientation.type)) || innerWidth > innerHeight; }
  if (touch && canFS) {
    addEventListener('pointerup', function (e) { if (landscape() && !isFS() && !btn.contains(e.target)) enter(); }, true);   // fim do toque (libera tela cheia)
  }

  // ao abrir o link no celular: tela "TOQUE PARA JOGAR"; esse primeiro toque (o navegador exige um toque) já entra em
  // tela cheia e trava deitado, mesmo com o celular em pé
  if (touch && canFS && !isFS()) {
    var gate = doc.createElement('div'); gate.id = 'fsgate';
    gate.innerHTML = '<div class="g1">Creia Fight</div><svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#fff" stroke-width="3">' +
      '<rect x="20" y="8" width="24" height="44" rx="4"/><path d="M8 40a24 24 0 0 0 20 16M8 40l-2 6M8 40l6 2" stroke="#e8323c"/></svg>' +
      '<div class="g2">TOQUE PARA JOGAR</div><div class="g3">ABRE EM TELA CHEIA, DE LADO</div>';
    var gcss = doc.createElement('style');
    gcss.textContent = '#fsgate{position:fixed;inset:0;z-index:9;background:#0b0a10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;' +
      'color:#fff;font-family:"Press Start 2P",monospace;text-align:center;touch-action:none;-webkit-tap-highlight-color:transparent}' +
      '#fsgate .g1{font-size:14px;color:#ffd34d}#fsgate .g2{font-size:13px;animation:fspisca 1s steps(2) infinite}#fsgate .g3{font-size:8px;color:#9a98a8}' +
      '@keyframes fspisca{50%{opacity:.25}}';
    doc.head.appendChild(gcss);
    gate.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); });
    gate.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); enter(); gate.remove(); });
    doc.body.appendChild(gate);
  }

  // iPhone (sem tela cheia para sites): instrução de instalar na tela de início
  var tip = null;
  function showTip() {
    if (tip) { tip.remove(); tip = null; return; }
    tip = doc.createElement('div'); tip.id = 'fstip';
    tip.innerHTML = 'NO IPHONE:<br>TOQUE EM COMPARTILHAR<br>E DEPOIS EM<br>"ADICIONAR A TELA DE INICIO".<br><br>O JOGO ABRE SEM A BARRA<br>DO NAVEGADOR.<br><br>(TOQUE PARA FECHAR)';
    tip.addEventListener('pointerdown', function (e) { e.stopPropagation(); tip.remove(); tip = null; });
    doc.body.appendChild(tip);
  }
}());
