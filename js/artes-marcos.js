/* Artes em revisão: só Marcos. Carregado exclusivamente pela prévia. */
(function () {
  'use strict';
  var rig=window.Rig, meta=window.MarcosArtAssets, images={}, height=rig.height;
  Object.keys(meta).forEach(function (name) {
    var img=new Image(); img.src='assets/marcos-revisao/'+name+'.png'; images[name]=img;
  });
  function loaded() {
    return Object.keys(images).every(function (key) { return images[key].complete && images[key].naturalWidth; });
  }
  function poseFor(state,t,opts) {
    if (state==='cutin' || state==='victory') return 'especial';
    if (opts.guard || state==='guard') return 'defesa';
    if (state==='attack1') return 'primario-1';
    if (state==='attack2') return 'primario-2';
    if (state==='attack3' || state==='jumpkick') return 'primario-3';
    if (state==='throw') return 'secundario';
    if (state==='special') return opts.shielded || t>=1.3 ? 'especial-2' : 'especial';
    if (opts.shielded && state!=='ko' && state!=='hurt') return 'especial-2';
    return 'base';
  }
  function drawWalk(ctx,img,m,k,t) {
    var waist=m.walk.waist, split=m.walk.split, span=m.feet[1]-waist;
    // Deforma só a área das próprias pernas. O movimento cresce a partir da
    // cintura fixa: cada pé avança, levanta e volta em oposição ao outro.
    for (var leg=0;leg<2;leg++) {
      var phase=t*11+leg*Math.PI, stride=Math.sin(phase)*6;
      var lift=Math.max(0,Math.cos(phase))*3, flex=lift*0.75;
      var compression=1-lift/(span*k), sx=leg?split:0;
      var sw=leg?img.naturalWidth-split:split;
      for(var sy=waist;sy<img.naturalHeight;sy+=24) {
        var sh=Math.min(24,img.naturalHeight-sy);
        var depth=Math.min(1,Math.max(0,(sy+sh/2-waist)/span));
        var dx=(sx-m.feet[0])*k+stride*depth+flex*Math.sin(depth*Math.PI);
        var dy=(waist-m.feet[1])*k+(sy-waist)*k*compression;
        ctx.drawImage(img,sx,sy,sw,sh,dx,dy,sw*k,sh*k*compression+0.03);
      }
    }
    // O tronco cobre a emenda na cintura, sem duplicar as pernas estáticas.
    ctx.drawImage(img,0,0,img.naturalWidth,waist+2,
      -m.feet[0]*k,-m.feet[1]*k,img.naturalWidth*k,(waist+2)*k);
  }
  function draw(ctx,state,t,x,y,facing,opts) {
    opts=opts || {};
    var name=poseFor(state,t,opts), m=meta[name], img=images[name], k=height/m.bodyHeight;
    var bob=state==='walk' ? -Math.abs(Math.sin(t*22))*0.5 : state==='idle' ? -Math.abs(Math.sin(t*5))*0.5 : 0;
    var lean=state==='walk' ? Math.sin(t*11)*0.012 : state==='hurt' ? -0.12*Math.max(0,1-t/0.3) : 0;
    if (state==='ko') lean=-Math.PI/2*Math.min(1,t/0.3);
    ctx.save();ctx.translate(x,y+bob);ctx.scale(facing<0?-1:1,1);ctx.rotate(lean);
    if (opts.alpha!=null) ctx.globalAlpha*=opts.alpha;
    ctx.imageSmoothingEnabled=false;
    // Somente desenho: física, dano, alcance, animação de estados e escudos
    // continuam sob controle do motor original.
    if (m.clip) {
      ctx.beginPath();m.clip.forEach(function (point,i) {
        var px=(point[0]-m.feet[0])*k,py=(point[1]-m.feet[1])*k;
        if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
      });ctx.closePath();ctx.clip();
    }
    if (opts.flash) {ctx.shadowColor='#fff';ctx.shadowBlur=3;}
    if(state==='walk' && m.walk) drawWalk(ctx,img,m,k,t);
    else ctx.drawImage(img,-m.feet[0]*k,-m.feet[1]*k,img.naturalWidth*k,img.naturalHeight*k);
    ctx.restore();return true;
  }
  var original={draw:rig.draw,big:rig.big,portrait:rig.portrait,ready:rig.ready,item:rig.item};
  rig.item=function (ctx,kind,x,y,rot,scale) {
    if(kind!=='halter' || !loaded())return original.item.apply(rig,arguments);
    var crop=meta.halter.rect, k=24/Math.max(crop[2],crop[3]);
    ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.scale(scale==null?1:scale,scale);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(images.halter,crop[0],crop[1],crop[2],crop[3],-crop[2]*k/2,-crop[3]*k/2,crop[2]*k,crop[3]*k);
    ctx.restore();return true;
  };
  rig.ready=function (who) { return who==='lutador' ? loaded() : original.ready.apply(rig,arguments); };
  rig.draw=function (ctx,who,state,t,x,y,facing,opts) {
    if(who!=='lutador')return original.draw.apply(rig,arguments);
    return loaded() ? draw(ctx,state,t||0,x,y,facing,opts) : false;
  };
  rig.big=function (ctx,who,state,t,x,y,facing,scale) {
    if(who!=='lutador')return original.big.apply(rig,arguments);
    if(!loaded())return false;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);draw(ctx,state,t||0,0,0,facing,{});ctx.restore();return true;
  };
  rig.portrait=function (ctx,who,x,y) {
    if(who!=='lutador')return original.portrait.apply(rig,arguments);
    if(!loaded())return false;
    var crop=meta.base.head;
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(images.base,crop[0],crop[1],crop[2],crop[3],x,y,28,28);ctx.restore();return true;
  };
  rig.marcosShield=function (ctx,x,y,left,t,facing) {
    if(!loaded())return false;
    if(left<1.5 && Math.floor(t*12)%2)return true;
    var img=images.efeitos,m=meta.efeitos,k=height*1.28/m.bodyHeight;
    ctx.save();ctx.translate(x,y+3);ctx.scale(facing<0?-1:1,1);
    ctx.globalAlpha*=0.78+0.2*Math.sin(t*16)*Math.sin(t*16);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(img,-m.feet[0]*k,-m.feet[1]*k,img.naturalWidth*k,img.naturalHeight*k);
    ctx.restore();return true;
  };
  window.MarcosArtPreview={ready:loaded,poseFor:poseFor};
}());
