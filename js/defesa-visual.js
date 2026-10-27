/* Defesa perfeita: efeito local em coordenadas do mundo; sem regras de combate ou áudio. */
(function(root){
  'use strict';
  var effects=[],sheet=null,attempted=false,LIFE=.45,MAX=32,TAU=Math.PI*2;
  function finite(n,fallback){return typeof n==='number'&&isFinite(n)?n:fallback;}
  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
  function load(src){
    attempted=true;sheet=null;
    if(typeof src!=='string'||!src||!root.Image)return false;
    try{
      var image=new root.Image();sheet=image;
      image.onerror=function(){if(sheet===image)sheet=null;};image.src=src;return true;
    }catch(_){sheet=null;return false;}
  }
  function spawn(x,y,facing){
    if(!isFinite(x)||!isFinite(y)||typeof x!=='number'||typeof y!=='number')return;
    if(!attempted)load('assets/efeitos/perfeita.webp');
    if(effects.length>=MAX)effects.shift();
    effects.push({x:x+(finite(facing,1)<0?-22:22),y:y-36,facing:finite(facing,1)<0?-1:1,age:0});
  }
  function update(dt){
    dt=finite(dt,0);if(dt<=0)return;
    effects.forEach(function(e){e.age+=dt;});
    effects=effects.filter(function(e){return e.age<LIFE;});
  }
  function reset(){effects=[];}
  function star(ctx,x,y,r,color){
    x=Math.round(x);y=Math.round(y);r=Math.max(1,Math.round(r));ctx.fillStyle=color;
    ctx.fillRect(x-r,y-1,r*2+1,3);ctx.fillRect(x-1,y-r,3,r*2+1);ctx.fillRect(x-2,y-2,5,5);
  }
  function ring(ctx,x,y,r){
    for(var i=0;i<64;i++){var a=i*TAU/64;ctx.fillRect(Math.round(x+Math.cos(a)*r),Math.round(y+Math.sin(a)*r),2,2);}
  }
  function fallback(ctx,x,y,u,facing){
    var core=Math.max(1,(1-u)*13);
    star(ctx,x,y,core,'#ffd34d');star(ctx,x,y,core*.55,'#ffffff');
    for(var i=0;i<6;i++){
      var a=i*TAU/6+.24,dist=5+u*27;
      star(ctx,x+Math.cos(a)*dist*facing,y+Math.sin(a)*dist+u*u*7,Math.max(1,3*(1-u)),i%2?'#ffe066':'#ffffff');
    }
  }
  function draw(ctx,camX){
    if(!effects.length)return;camX=finite(camX,0);
    ctx.save();ctx.imageSmoothingEnabled=false;
    effects.forEach(function(e){
      var u=e.age/LIFE,x=Math.round(e.x-camX),y=Math.round(e.y),fade=clamp((1-u)*1.5,0,1);
      ctx.globalAlpha=.72*fade;ctx.fillStyle='#ffe066';ring(ctx,x,y,4+u*27);
      var usable=sheet&&sheet.complete&&sheet.naturalWidth===384&&sheet.naturalHeight===64;
      ctx.globalAlpha=fade;
      if(usable){
        try{ctx.drawImage(sheet,Math.min(5,Math.floor(u*6))*64,0,64,64,x-24,y-24,48,48);}
        catch(_){sheet=null;fallback(ctx,x,y,u,e.facing);}
      }else fallback(ctx,x,y,u,e.facing);
      if(e.age<.10){ctx.globalAlpha=(1-e.age/.10)*.9;star(ctx,x,y,5,'#ffffff');}
    });
    ctx.restore();
  }
  // x/y já são o ponto da mão na tela; t é o restante da janela de contra-ataque.
  function contra(ctx,x,y,t){
    t=finite(t,0);if(t<=0||!isFinite(x)||!isFinite(y))return;
    x=Math.round(x);y=Math.round(y);var age=.6-clamp(t,0,.6),fade=clamp(t/.10,0,1),pulse=.65+.35*Math.sin(age*32);
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=.18*fade*pulse;ctx.fillStyle='#ffd34d';ctx.fillRect(x-7,y-5,15,11);
    ctx.globalAlpha=.42*fade*pulse;star(ctx,x,y,4,'#ffe066');ctx.globalAlpha=.8*fade;ctx.fillStyle='#fff4ce';ctx.fillRect(x-1,y-1,3,3);ctx.restore();
  }
  var api={spawn:spawn,update:update,draw:draw,contra:contra,reset:reset,load:load};
  root.DefesaVisual=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
}(typeof window!=='undefined'?window:globalThis));
