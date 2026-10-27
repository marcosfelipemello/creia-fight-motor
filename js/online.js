/* Transporte e campos nativos do X1/ranking. O motor continua autoritativo no anfitrião. */
(function () {
  'use strict';
  var socket = null, onMessage = null, overlay = null, overlayStatus = null;
  var manualClose = false, reconnectTimer = null, retry = 0, credentials = null;
  var STORE = 'bangu-online-room', suspended = false;
  var RECOVERY_AGE = 195000; // Três minutos mais margem para a conexão de volta.
  var local = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  var api = local ? 'http://127.0.0.1:8790' : '';
  var endpoint = local ? 'ws://127.0.0.1:8790/ws' :
    (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  function readRoom() {
    try {
      var value=null;
      try { value=JSON.parse(sessionStorage.getItem(STORE)); } catch (_) {}
      if (!value) {
        value=JSON.parse(localStorage.getItem(STORE));
        if (!value || !Number.isFinite(value.savedAt) || Date.now()-value.savedAt>RECOVERY_AGE) return null;
      }
      if (value && /^[A-Z2-9]{5}$/.test(value.code) && /^[0-9a-f]{64}$/.test(value.token) &&
          (value.role==='host'||value.role==='guest')) return value;
    } catch (_) {}
    return null;
  }
  function saveRoom(value) {
    credentials=value; value.savedAt=Date.now();
    try { localStorage.setItem(STORE,JSON.stringify(value)); } catch (_) {}
    try { sessionStorage.setItem(STORE,JSON.stringify(value)); } catch (_) {}
  }
  function forgetRoom() {
    var previous=credentials; credentials=null;
    try {
      var stored=JSON.parse(localStorage.getItem(STORE));
      if (stored && previous && stored.token===previous.token) localStorage.removeItem(STORE);
    } catch (_) {}
    try { sessionStorage.removeItem(STORE); } catch (_) {}
  }
  credentials=readRoom();
  function stopRetry() { if (reconnectTimer) clearTimeout(reconnectTimer); reconnectTimer=null; }
  var net={rtt:null,jitter:0,sent:0,lost:0,status:'disconnected'},probes={},probeId=0,nextProbe=0,peerKnown=false;
  function emit(value) {
    if(value.type==='net-probe' && Number.isSafeInteger(value.id) && value.id>=0 && value.id<1000000000){send({type:'net-pong',id:value.id});return;}
    if(value.type==='net-pong'){
      var p=probes[value.id];if(!p)return;delete probes[value.id];
      if(p.direct!==rtcReady)return;
      var r=Math.max(0,performance.now()-p.at);net.jitter=net.rtt==null?0:net.jitter*.7+Math.abs(r-net.rtt)*.3;net.rtt=net.rtt==null?r:net.rtt*.65+r*.35;return;
    }
    if(value.type==='peer'||value.type==='joined'||value.type==='back'){peerKnown=true;net.status='connected';nextProbe=0;}
    if(value.type==='created'){peerKnown=false;net.status='waiting';}
    if(value.type==='resumed'){peerKnown=!!value.peerReady;net.status=value.otherAway?'peer-away':'connected';}
    if(value.type==='reconnecting')net.status='reconnecting';
    if(value.type==='away')net.status='peer-away';
    if(value.type==='left'||value.type==='error')net.status='disconnected';
    if (typeof onMessage === 'function') onMessage(value);
  }
  function tick(now){
    Object.keys(probes).forEach(function(id){if(now-probes[id].at>4000){delete probes[id];net.lost++;}});
    if(!peerKnown||net.status!=='connected'||now<nextProbe)return;nextProbe=now+2000;
    var id=(++probeId)%1000000000;if(send({type:'net-probe',id:id})){probes[id]={at:now,direct:rtcReady};net.sent++;}
  }
  function metrics(){return {rtt:net.rtt==null?null:Math.round(net.rtt),jitter:Math.round(net.jitter),loss:net.sent?Math.round(net.lost/net.sent*100):0,status:net.status,route:rtcReady?'Direta':'Servidor',quality:net.rtt==null?'Medindo':net.rtt<100&&net.jitter<35?'Boa':net.rtt<220&&net.jitter<70?'Regular':'Instável'};}


  // Transporte WebRTC P2P (UDP direto entre jogadores) com fallback em WebSocket
  var rtcPeer = null, rtcChannel = null, rtcReady = false;
  var STUN_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  function closeRtc() {
    rtcReady = false;
    if (rtcChannel) {
      try { rtcChannel.close(); } catch (_) {}
      rtcChannel = null;
    }
    if (rtcPeer) {
      try { rtcPeer.close(); } catch (_) {}
      rtcPeer = null;
    }
  }

  function setupChannel(ch) {
    rtcChannel = ch;
    ch.onopen = function () { rtcReady = true; };
    ch.onclose = function () { rtcReady = false; rtcChannel = null; };
    ch.onerror = function () { rtcReady = false; };
    ch.onmessage = function (event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg && typeof msg.type === 'string') emit(msg);
      } catch (_) {}
    };
  }

  function initRtcHost() {
    if (typeof RTCPeerConnection === 'undefined') return;
    closeRtc();
    try {
      rtcPeer = new RTCPeerConnection({ iceServers: STUN_SERVERS });
      var ch = rtcPeer.createDataChannel('bangu-p2p', { ordered: false, maxRetransmits: 0 });
      setupChannel(ch);
      rtcPeer.onicecandidate = function (e) {
        if (e.candidate) sendWs({ type: 'signal', signal: { candidate: e.candidate } });
      };
      rtcPeer.createOffer().then(function (offer) {
        return rtcPeer.setLocalDescription(offer);
      }).then(function () {
        sendWs({ type: 'signal', signal: { sdp: rtcPeer.localDescription } });
      }).catch(function () { closeRtc(); });
    } catch (_) { closeRtc(); }
  }

  function handleRtcSignal(signal) {
    if (typeof RTCPeerConnection === 'undefined' || !signal) return;
    try {
      if (signal.sdp) {
        var desc = signal.sdp;
        if (desc.type === 'offer') {
          closeRtc();
          rtcPeer = new RTCPeerConnection({ iceServers: STUN_SERVERS });
          rtcPeer.ondatachannel = function (e) { setupChannel(e.channel); };
          rtcPeer.onicecandidate = function (e) {
            if (e.candidate) sendWs({ type: 'signal', signal: { candidate: e.candidate } });
          };
          rtcPeer.setRemoteDescription(new RTCSessionDescription(desc)).then(function () {
            return rtcPeer.createAnswer();
          }).then(function (answer) {
            return rtcPeer.setLocalDescription(answer);
          }).then(function () {
            sendWs({ type: 'signal', signal: { sdp: rtcPeer.localDescription } });
          }).catch(function () { closeRtc(); });
        } else if (desc.type === 'answer' && rtcPeer) {
          rtcPeer.setRemoteDescription(new RTCSessionDescription(desc)).catch(function () {});
        }
      } else if (signal.candidate && rtcPeer) {
        rtcPeer.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(function () {});
      }
    } catch (_) {}
  }

  function sendWs(value) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    var data = JSON.stringify(value);
    if (data.length > 7900) return false;
    socket.send(data);
    return true;
  }

  function send(value) {
    var data = JSON.stringify(value);
    if (data.length > 7900) return false;
    // Envio direto via P2P UDP se disponível (latência mínima de 10-25ms)
    if (rtcReady && rtcChannel && rtcChannel.readyState === 'open' && ['input','snapshot','net-probe','net-pong'].indexOf(value.type)>=0) {
      if ((value.type === 'snapshot' || value.type === 'input') && rtcChannel.bufferedAmount > 0) return false;
      try {
        rtcChannel.send(data);
        return true;
      } catch (_) { rtcReady = false; }
    }
    // Fallback: relay pelo WebSocket da VPS
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    if ((value.type === 'snapshot' || value.type === 'input') && socket.bufferedAmount > 0) return false;
    socket.send(data);
    return true;
  }

  function leave() {
    var abandoned=credentials, connected=socket && socket.readyState===WebSocket.OPEN;
    manualClose = true; stopRetry(); forgetRoom(); closeRtc();net={rtt:null,jitter:0,sent:0,lost:0,status:'disconnected'};probes={};peerKnown=false;nextProbe=0;
    if (socket) { var previous=socket; if (previous.readyState===WebSocket.OPEN) sendWs({type:'leave'}); socket=null; previous.close(); }
    // CANCELAR durante a reconexão também comunica a saída ao servidor.
    if (abandoned && !connected) {
      try {
        var cancelSocket=new WebSocket(endpoint);
        cancelSocket.onmessage=function () {};
        cancelSocket.onerror=function () {};
        cancelSocket.onopen=function () {
          cancelSocket.send(JSON.stringify({type:'resume',code:abandoned.code,token:abandoned.token}));
          cancelSocket.send(JSON.stringify({type:'leave'}));
          cancelSocket.close();
        };
      } catch (_) {}
    }
    hideOverlay();
  }
  function scheduleResume() {
    if (suspended || manualClose || !credentials || reconnectTimer) return;
    var delay=Math.min(10000,750*Math.pow(1.7,retry++));
    reconnectTimer=setTimeout(function () { reconnectTimer=null; openSocket('resume'); },delay);
  }
  function openSocket(mode, code, roomType) {
    if (socket) { var previous=socket; socket=null; previous.close(); }
    try { socket = new WebSocket(endpoint); }
    catch (_) { if (mode==='resume') scheduleResume(); else emit({type:'error',message:'SEM CONEXÃO'}); return; }
    var active = socket;
    active.onopen = function () {
      if (socket!==active) return;
      if (mode==='resume' && credentials) send({type:'resume',code:credentials.code,token:credentials.token});
      else send(mode==='create' ? {type:'create',mode:roomType} : {type:'join',code:code,mode:roomType});
    };
    active.onmessage = function (event) {
      if (socket!==active) return;
      try {
        var msg = JSON.parse(event.data);
        if (!msg || typeof msg.type!=='string') return;
        if ((msg.type==='created'||msg.type==='joined'||msg.type==='resumed') && msg.code && msg.token) {
          saveRoom({code:msg.code,token:msg.token,mode:msg.mode||'x1',role:msg.role||(msg.type==='created'?'host':'guest')});
          retry=0; stopRetry();
        }
        if (msg.type==='error' && mode==='resume') {
          manualClose=true; stopRetry(); forgetRoom(); socket=null; active.close();
        }
        if (msg.type==='signal') { handleRtcSignal(msg.signal); return; }
        if (msg.type==='peer') { initRtcHost(); }
        if (msg.type==='left') { manualClose=true; stopRetry(); forgetRoom(); closeRtc(); socket=null; active.close(); hideOverlay(); }
        emit(msg);
      }
      catch (_) { emit({ type:'error', message:'RESPOSTA INVÁLIDA' }); }
    };
    active.onerror = function () { /* onclose exibe a falha uma vez */ };
    active.onclose = function () {
      if (socket !== active) return;
      closeRtc();
      socket = null;
      if (manualClose) return;
      if (credentials) {
        emit({type:'reconnecting'}); setStatus('RECONECTANDO...'); scheduleResume();
      } else emit({type:'error',message:'SEM CONEXÃO'});
    };
  }
  function connect(mode,code,roomType) {
    leave(); suspended=false; manualClose=false; retry=0; openSocket(mode,code,roomType);
  }
  function resume(force) {
    if (manualClose || !credentials) return false;
    if (socket && socket.readyState===WebSocket.OPEN && !force) return true;
    if (force && socket && socket.readyState===WebSocket.OPEN) {
      emit({type:'reconnecting'}); setStatus('RECONECTANDO...');
    }
    stopRetry(); openSocket('resume'); return true;
  }
  function restore() {
    if (!credentials) return false;
    suspended=false; manualClose=false; retry=0; return resume(true);
  }
  function hideOverlay() { if (overlay) { overlay.remove(); overlay = null; overlayStatus=null; } }
  function setStatus(value) { if (overlayStatus) overlayStatus.textContent=value; }
  function box() {
    hideOverlay();
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(5,4,12,.82);font:12px "Press Start 2P",monospace;color:white;text-align:center;';
    el.addEventListener('keydown',function (e) { e.stopPropagation(); });
    var card = document.createElement('div');
    card.style.cssText = 'width:min(92vw,420px);padding:24px 16px;background:#191525;border:3px solid #e8323c;' +
      'box-shadow:0 12px 30px #000;line-height:1.8;';
    el.tabIndex=-1; el.appendChild(card); document.body.appendChild(el); overlay = el; el.focus();
    return card;
  }
  function button(label, fn) {
    var b = document.createElement('button'); b.type='button'; b.textContent=label;
    b.style.cssText = 'font:10px "Press Start 2P",monospace;padding:12px;margin:8px 5px;color:#151018;' +
      'background:#ffe066;border:0;cursor:pointer;'; b.onclick=fn; return b;
  }
  function showLink(code) {
    var coop=credentials&&credentials.mode==='coop';
    var link = 'https://bangu.kryventech.com.br/?sala=' + code+(coop?'&modo=coop':'');
    var card=box(), title=document.createElement('div');
    title.textContent='SALA ' + code; title.style.color='#ffe066'; card.appendChild(title);
    var url=document.createElement('div'); url.textContent=link;
    url.style.cssText='font:12px monospace;overflow-wrap:anywhere;margin:16px 0;'; card.appendChild(url);
    var status=document.createElement('div'); status.textContent=coop?'AGUARDANDO PARCEIRO...':'AGUARDANDO ADVERSÁRIO...'; card.appendChild(status);
    overlayStatus=status;
    card.appendChild(button('COPIAR',function () {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link)
        .then(function () { status.textContent='LINK COPIADO'; })
        .catch(function () { status.textContent=link; });
      else status.textContent=link;
    }));
    card.appendChild(button('COMPARTILHAR',function () {
      if (navigator.share) navigator.share({ title:'X1 no Bangu', url:link }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(link).catch(function () {});
    }));
    card.appendChild(button('CANCELAR',function () { leave(); emit({type:'cancel'}); }));
  }
  function askText(title,max,options) {
    return new Promise(function (resolve) {
      var card=box(), label=document.createElement('label'); label.textContent=title;
      var input=document.createElement('input'); input.type='text'; input.maxLength=max;
      input.autocomplete='off'; input.spellcheck=false;
      input.style.cssText='display:block;box-sizing:border-box;width:100%;margin:18px 0;padding:12px;font:16px monospace;' +
        'color:#fff;background:#282331;border:2px solid #ffe066;text-transform:uppercase;';
      input.addEventListener('keydown',function (e) { e.stopPropagation(); if (e.key==='Enter') done(input.value); });
      card.appendChild(label); card.appendChild(input);
      function done(value) { hideOverlay(); resolve(value); }
      card.appendChild(button('CONFIRMAR',function () { done(input.value); }));
      card.appendChild(button(options&&options.cancelLabel||'CANCELAR',function () { done(null); }));
      setTimeout(function () { input.focus(); },50);
    });
  }
  function ranking() { return fetch(api+'/api/ranking',{cache:'no-store'}).then(function (r) { if (!r.ok) throw Error('offline'); return r.json(); }); }
  function score(row) { return fetch(api+'/api/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(row)})
    .then(function (r) { if (!r.ok) { var e=Error('score '+r.status); e.status=r.status; throw e; } return r.json(); }); }
  // A suspensão nunca equivale a CANCELAR: conserva o token e libera o socket
  // antes de o sistema congelar a página. Só a volta inicia novas tentativas.
  function suspend() {
    if (!credentials || manualClose) return;
    suspended=true; saveRoom(credentials); stopRetry(); closeRtc();
    var previous=socket; socket=null;
    if (previous) previous.close();
    emit({type:'reconnecting'});
  }
  function wake() {
    if (!credentials || manualClose || !onMessage) return;
    suspended=false;
    if (!socket || socket.readyState!==WebSocket.CONNECTING) resume(true);
  }
  document.addEventListener('visibilitychange',function () {
    if (document.hidden) suspend(); else wake();
  });
  document.addEventListener('freeze',suspend);
  window.addEventListener('pagehide',suspend);
  window.addEventListener('pageshow',wake);
  window.BanguOnline = {
    get pendingCode() { return new URLSearchParams(location.search).get('sala'); },
    set onMessage(fn) { onMessage=fn; },
    createCoop:function(){connect('create',null,'coop');},
    joinCoop:function(code){connect('join',String(code||'').trim().toUpperCase(),'coop');},
    get pendingMode(){return new URLSearchParams(location.search).get('modo');},
    scoreCoop:function(row){return score(Object.assign({},row,{modo:'coop'}));},
    create:function () { connect('create'); },
    join:function (code) { connect('join',String(code||'').trim().toUpperCase()); },
    restore:restore, leave:leave, send:send, tick:tick, metrics:metrics, showLink:showLink, hideOverlay:hideOverlay, setStatus:setStatus, askText:askText,
    ranking:ranking, score:score,
    get isP2P() { return rtcReady; }
  };
})();
