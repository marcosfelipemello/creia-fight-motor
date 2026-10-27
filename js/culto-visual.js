/* Culto X1: desenho determinístico, compartilhado com cutscenes/culto-x1.
   Nenhum relógio, entrada, carregamento ou estado de combate pertence a este módulo. */
(function (root) {
  'use strict';
  var C = {ink:'#0b0a10',surface:'#181521',line:'#493346',paper:'#ffffff',muted:'#c9c4d6',gold:'#ffd34d',red:'#e8323c'};
  function px(ctx, s, x, y, col, align, size) {
    var sz = size || 8, d = String(s).normalize('NFD'), plain = '', marks = [], n = 0;
    for (var i = 0; i < d.length; i++) {
      var cc = d.charCodeAt(i);
      if (cc >= 0x300 && cc <= 0x36f && cc !== 0x327) { if (cc === 0x303 || cc === 0x301 || cc === 0x302) marks.push([n - 1, cc]); continue; }
      if (cc !== 0x327) n++;
      plain += d[i];
    }
    s = plain.normalize('NFC');
    ctx.font = sz + 'px "Press Start 2P", monospace'; ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = C.ink;
    ctx.fillText(s, x - 1, y); ctx.fillText(s, x + 1, y); ctx.fillText(s, x, y - 1); ctx.fillText(s, x, y + 1); ctx.fillText(s, x + 1, y + 1);
    ctx.fillStyle = col || C.paper; ctx.fillText(s, x, y);
    if (!marks.length) return;
    var tw = ctx.measureText(s).width, x0 = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x, u = sz / 8;
    marks.forEach(function (m) {
      var cx = x0 + ctx.measureText(s.slice(0, m[0])).width + sz / 2 - u * 0.5, my = y - u * 3;
      var r = m[1] === 0x303 ? [[-3, 1, 2, 1], [-1, 0, 2, 1], [1, 1, 2, 1], [3, 0, 1, 1]] : m[1] === 0x301 ? [[0, 1, 2, 1], [1, 0, 2, 1]] : [[-2, 1, 1, 1], [-1, 0, 3, 1], [2, 1, 1, 1]];
      ctx.fillStyle = C.ink; r.forEach(function (q) { ctx.fillRect(cx + (q[0] - 1) * u, my + (q[1] - 1) * u, (q[2] + 2) * u, (q[3] + 2) * u); });
      ctx.fillStyle = col || C.paper; r.forEach(function (q) { ctx.fillRect(cx + q[0] * u, my + q[1] * u, q[2] * u, q[3] * u); });
    });
  }

  // Fala: divide o texto em sílabas pelas vogais; cada sílaba abre a boca no formato da vogal e revela o texto até ela.
  var SILABA=0.18, PAUSA=0.35, ABRE='aoeuiy';   // ABRE: da vogal mais aberta para a mais fechada
  function silabas(texto) {
    var out=[], plain=String(texto).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(), i=0, ini=0;
    var vogal=function(ch){return 'aeiouy'.indexOf(ch)>=0;};
    while(i<plain.length) {
      var ch=plain[i];
      if(vogal(ch)){var v=ch;while(i<plain.length&&vogal(plain[i])){if(ABRE.indexOf(plain[i])<ABRE.indexOf(v))v=plain[i];i++;}out.push({fim:i,vogal:v,dur:SILABA});continue;}   // ditongo: vale a vogal mais aberta (qu-E, fOi)
      if(/[0-9x]/.test(ch)&&(i===0||!/[a-z]/.test(plain[i-1]))&&(i+1>=plain.length||!/[a-z]/.test(plain[i+1]))){i++;out.push({fim:i,vogal:ch==='x'?'i':'u',dur:SILABA*1.6});continue;}   // "X1": xis, um
      if(/[!?.,…:]/.test(texto[i]||'')&&out.length)out.push({fim:i+1,vogal:null,dur:PAUSA});
      i++;
    }
    return out;
  }
  function fala(texto,t) {
    var sil=silabas(texto), acc=0, AMP={a:1,o:0.85,e:0.7,u:0.6,i:0.55,y:0.55};
    for(var i=0;i<sil.length;i++) {
      var s=sil[i];
      if(t<acc+s.dur){var u=(t-acc)/s.dur;return {visivel:texto.slice(0,s.vogal?Math.max(s.fim,1):s.fim),boca:s.vogal?Math.sin(Math.PI*u)*(AMP[s.vogal]||0.7):0,vogal:s.vogal};}
      acc+=s.dur;
    }
    return {visivel:texto,boca:0,vogal:null,fim:true};
  }
  function falaFim(texto){return silabas(texto).reduce(function(a,s){return a+s.dur;},0);}
  function hud(ctx,s,x,y,size,col,align) {
    ctx.font='700 '+size+'px CreiaDisplay';ctx.textAlign=align||'left';ctx.textBaseline='top';ctx.fillStyle=col||C.paper;ctx.fillText(s,x,y);
  }
  function faixa(ctx,x,y,w,h,col) {
    ctx.fillStyle=C.ink;ctx.beginPath();ctx.moveTo(x+5,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w,y+h-5);ctx.lineTo(x+w-5,y+h);ctx.lineTo(x,y+h);ctx.lineTo(x,y+5);ctx.closePath();ctx.fill();
    ctx.fillStyle=C.surface;ctx.fillRect(x+2,y+2,w-4,h-4);ctx.fillStyle=col;ctx.fillRect(x,y+4,2,h-8);ctx.fillRect(x+5,y,w-5,1);
  }
  function fundo(ctx,W,H,o) {
    ctx.fillStyle=C.ink;ctx.fillRect(0,0,W,H);ctx.imageSmoothingEnabled=false;
    if(o.cenario)o.cenario(ctx);
    ctx.fillStyle='rgba(11,10,16,.72)';ctx.fillRect(0,0,W,H);
    var t=o.t||0;
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(var i=0;i<5;i++) {
      var x=106+i*9+Math.sin(t*.65+i)*5;
      var g=ctx.createLinearGradient(x,0,x,216);g.addColorStop(0,'rgba(255,211,77,.02)');g.addColorStop(.7,'rgba(255,211,77,.09)');g.addColorStop(1,'rgba(255,211,77,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+90+i*8,216);ctx.lineTo(x-75-i*7,216);ctx.closePath();ctx.fill();
    }
    ctx.restore();
    for(var j=0;j<45;j++) {
      var xx=(j*73.37+Math.sin(t*.5+j)*7)%W, yy=((j*41.71-t*(5+j%6))%H+H)%H;
      ctx.fillStyle='rgba(255,211,77,'+(.18+.3*(.5+.5*Math.sin(j+t)))+')';ctx.fillRect(Math.round(xx),Math.round(yy),1,1);
    }
    var v=ctx.createRadialGradient(240,135,80,240,135,265);v.addColorStop(0,'rgba(11,10,16,0)');v.addColorStop(1,'rgba(11,10,16,.85)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  }
  function pulpito(ctx) {
    // Madeira escura: tons da paleta, veios e quinas em pixels; microfone ao lado do rosto.
    ctx.fillStyle=C.ink;ctx.fillRect(69,211,100,5);ctx.fillRect(82,146,74,68);
    ctx.fillStyle=C.line;ctx.fillRect(83,147,72,65);ctx.fillStyle=C.surface;ctx.fillRect(88,151,61,59);
    ctx.fillStyle=C.line;for(var i=0;i<6;i++)ctx.fillRect(92+i*10,157+(i%2)*5,1,46-(i%3)*4);
    ctx.fillStyle=C.ink;ctx.fillRect(76,140,86,9);ctx.fillStyle=C.line;ctx.fillRect(77,141,84,4);
    ctx.fillStyle=C.gold;ctx.fillRect(78,141,82,1);ctx.fillRect(90,154,57,1);ctx.fillRect(90,204,57,1);
    ctx.fillRect(117,166,3,25);ctx.fillRect(109,174,19,3);
    ctx.fillStyle=C.surface;ctx.fillRect(71,209,95,4);ctx.fillStyle=C.gold;ctx.fillRect(73,209,91,1);
    ctx.fillStyle=C.ink;ctx.fillRect(150,116,3,24);ctx.fillRect(142,113,11,3);ctx.fillStyle=C.muted;ctx.fillRect(143,113,8,1);
    ctx.fillStyle=C.ink;ctx.fillRect(137,110,8,6);ctx.fillStyle=C.line;ctx.fillRect(138,111,5,3);
  }
  function apresentador(ctx,o,f) {
    var R=root.Rig;if(R&&f)R.falando={who:o.apresentador,boca:f.boca,vogal:f.vogal};   // a arte de cada um lê a boca daqui
    try{if(o.big)o.big(ctx,o.apresentador,'idle',o.t||0,119,215,1,1.65,f?{boca:f.boca,vogal:f.vogal}:null);}finally{if(R)R.falando=null;}
    pulpito(ctx);
  }
  function quadro(ctx,W,H,o,draw) {ctx.save();ctx.scale(W/480,H/270);fundo(ctx,480,270,o);draw();ctx.restore();}
  function abertura(ctx,W,H,o) {
    // LUTEM fica sobre a arena viva: a luta já pode receber comandos.
    if(o.contagem==='LUTEM!') {
      ctx.save();ctx.scale(W/480,H/270);px(ctx,'LUTEM!',240,102,C.gold,'center',24);ctx.restore();return;
    }
    var FRASE='Que vença o mais ungido!', fl=o.contagem==null?fala(FRASE,o.t||0):null;
    quadro(ctx,W,H,o,function(){
      apresentador(ctx,o,fl);
      px(ctx,'ROUND 1',240,22,C.gold,'center',12);
      var n=o.contagem;
      if(n!==undefined && n!==null) {
        var f=((o.t||0)/0.4)%1, z=1+.24*Math.exp(-f*9), shake=Math.sin(f*75)*Math.exp(-f*12)*2;
        ctx.save();ctx.translate(331+shake,101);ctx.scale(z,z);px(ctx,String(n),0,0,C.gold,'center',n==='LUTEM!'?18:48);ctx.restore();
        hud(ctx,'X1',331,165,12,C.muted,'center');
      } else {
        faixa(ctx,214,89,240,77,C.red);
        ctx.font='700 17px CreiaDisplay';var fw=ctx.measureText(FRASE).width;   // o texto cresce da esquerda, já no lugar final
        hud(ctx,fl.visivel,334-fw/2,109,17,C.paper,'left');
        hud(ctx,'QUALQUER BOTÃO: PULAR',334,143,9,C.muted,'center');
      }
      faixa(ctx,24,230,432,25,C.line);
      hud(ctx,(o.nomes||[]).join('  ×  '),240,234,12,C.paper,'center');
    });
  }
  function encerramento(ctx,W,H,o) {
    var FRASE='A vitória é do Senhor… mas o X1 foi de '+o.nome+'!', f=fala(FRASE,(o.t||0)-0.3);
    quadro(ctx,W,H,o,function(){
      px(ctx,'VITÓRIA!',240,22,C.gold,'center',14);
      apresentador(ctx,o,f);
      if(o.big)o.big(ctx,o.vencedor,'victory',o.t||0,337,215,-1,1.6);
      faixa(ctx,24,225,432,39,C.gold);
      ctx.font='700 13px CreiaDisplay';var fw=ctx.measureText(FRASE).width;
      hud(ctx,f.visivel,240-fw/2,235,13,C.paper,'left');
    });
  }
  root.CultoVisual={abertura:abertura,encerramento:encerramento,fala:fala,falaFim:falaFim};
}(typeof window!=='undefined'?window:globalThis));
