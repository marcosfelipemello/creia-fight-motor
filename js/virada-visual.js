/* Unção dobrada: somente desenho, em coordenadas lógicas do canvas do jogo. */
(function(root){
  'use strict';
  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
  function finite(n,fallback){return typeof n==='number'&&isFinite(n)?n:fallback;}
  function ease(a,b,t){var u=clamp((t-a)/(b-a),0,1);return u*u*(3-2*u);}
  function beat(t){
    var phase=((t%1.15)+1.15)%1.15;
    return Math.max(Math.exp(-Math.pow((phase-.10)/.045,2)),.82*Math.exp(-Math.pow((phase-.29)/.06,2)));
  }
  function draw(ctx,W,H,opts){
    opts=opts||{};W=finite(W,0);H=finite(H,0);
    var force=clamp(finite(opts.forca,1),0,1);
    if(W<=0||H<=0||force===0)return;
    ctx.save();ctx.imageSmoothingEnabled=false;
    // O recorte não cria uma borda vertical no meio da luta.
    if(opts.lado==='esquerda'||opts.lado==='direita'){
      ctx.beginPath();ctx.rect(opts.lado==='esquerda'?0:W/2,0,W/2,H);ctx.clip();
    }
    var alpha=(.015+.585*beat(finite(opts.t,0)))*force;
    var width=3,bands=Math.min(6,Math.floor(Math.min(W,H)/(width*2)));
    ctx.fillStyle='#ed243d';
    for(var i=0;i<bands;i++){
      var inset=i*width,w=W-inset*2,h=H-inset*2;
      // Faixas disjuntas: os cantos não somam alfa acima do pico de 0,60.
      ctx.globalAlpha=alpha*Math.pow(.65,i);
      ctx.fillRect(inset,inset,w,width);ctx.fillRect(inset,H-inset-width,w,width);
      if(h>width*2){ctx.fillRect(inset,inset+width,width,h-width*2);ctx.fillRect(W-inset-width,inset+width,width,h-width*2);}
    }
    ctx.restore();
  }
  // Mesma técnica do txt() da engine: mantém Ç, tira o til do glifo e o desenha à mão.
  function label(ctx,s,x,y,size){
    var d=String(s).normalize('NFD'),plain='',marks=[],n=0;
    for(var i=0;i<d.length;i++){
      var cc=d.charCodeAt(i);
      if(cc>=0x300&&cc<=0x36f&&cc!==0x327){if(cc===0x303||cc===0x301||cc===0x302)marks.push([n-1,cc]);continue;}
      if(cc!==0x327)n++;plain+=d[i];
    }
    s=plain.normalize('NFC');ctx.font=size+'px "Press Start 2P",monospace';ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillStyle='#0b0a10';ctx.fillText(s,x-1,y);ctx.fillText(s,x+1,y);ctx.fillText(s,x,y-1);ctx.fillText(s,x,y+1);ctx.fillText(s,x+1,y+1);
    ctx.fillStyle='#fff4d0';ctx.fillText(s,x,y);
    var x0=x-ctx.measureText(s).width/2,u=size/8;
    marks.forEach(function(m){
      var cx=x0+ctx.measureText(s.slice(0,m[0])).width+size/2-u*.5,my=y-u*3;
      var rects=m[1]===0x303?[[-3,1,2,1],[-1,0,2,1],[1,1,2,1],[3,0,1,1]]:m[1]===0x301?[[0,1,2,1],[1,0,2,1]]:[[-2,1,1,1],[-1,0,3,1],[2,1,1,1]];
      ctx.fillStyle='#0b0a10';rects.forEach(function(r){ctx.fillRect(cx+(r[0]-1)*u,my+(r[1]-1)*u,(r[2]+2)*u,(r[3]+2)*u);});
      ctx.fillStyle='#fff4d0';rects.forEach(function(r){ctx.fillRect(cx+r[0]*u,my+r[1]*u,r[2]*u,r[3]*u);});
    });
  }
  function entrada(ctx,W,H,t){
    t=finite(t,-1);if(t<0||t>=.8||W<=0||H<=0)return;
    var zoom=1+.6*(1-ease(0,.22,t)),shake=(1-ease(.08,.4,t))*3,frame=Math.floor(t*60);
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=ease(0,.055,t)*(1-ease(.58,.8,t));
    ctx.translate(Math.round(W/2+Math.sin(frame*2.4)*shake),Math.round(H*.46+Math.cos(frame*3.2)*shake));ctx.scale(zoom,zoom);
    label(ctx,'UNÇÃO DOBRADA!',0,-8,16);ctx.restore();
  }
  var api={draw:draw,entrada:entrada};root.ViradaVisual=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
}(typeof window!=='undefined'?window:globalThis));
