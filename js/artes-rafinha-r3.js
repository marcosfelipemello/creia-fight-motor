/* Poses do Rafinha; somente desenho, sem alterar combate ou controles. */
(function () {
  'use strict';
  var rig=window.Rig, meta=window.RafinhaArtAssets, images={};
  var original={draw:rig.draw,big:rig.big,portrait:rig.portrait,ready:rig.ready,item:rig.item};
  Object.keys(meta).forEach(function (name) {
    var image=new Image();
    image.src=window.RafinhaArtEmbedded[name];
    images[name]=image;
  });
  function loaded() {
    return Object.keys(images).every(function (name) {return images[name].complete && images[name].naturalWidth>0;});
  }
  window.RafinhaArtPreview={
    ready:loaded,
    failed:function(){return Object.keys(images).filter(function(name){return images[name].complete && !images[name].naturalWidth;});}
  };
  function poseFor(state,opts) {
    if(opts.guard || state==='guard')return 'defesa';
    if(state==='dash' || state==='attack2')return 'secundario';
    if(state==='cutin')return 'primario';
    if(state==='special' || state==='victory')return 'especial';
    if(opts.airThrow && (state==='jump' || state==='idle' || state==='walk'))return 'primario';
    if(state==='throw' || state==='attack1' || state==='attack2' || state==='attack3' || state==='jumpkick')return 'primario';
    return 'base';
  }
  function walk(ctx,img,m,k,t) {
    var waist=m.walk.waist,split=m.walk.split,span=m.feet[1]-waist;
    for(var leg=0;leg<2;leg++) {
      var phase=t*11+leg*Math.PI,stride=Math.sin(phase)*6;
      var lift=Math.max(0,Math.cos(phase))*3,compression=1-lift/(span*k);
      var sx=leg?split:0,sw=leg?img.naturalWidth-split:split;
      var strip=m.walk.strip;
      for(var sy=waist;sy<img.naturalHeight;sy+=strip) {
        var sh=Math.min(strip,img.naturalHeight-sy),depth=Math.min(1,Math.max(0,(sy+sh/2-waist)/span));
        var dx=(sx-m.feet[0])*k+stride*depth+lift*0.75*Math.sin(depth*Math.PI);
        var dy=(waist-m.feet[1])*k+(sy-waist)*k*compression;
        ctx.drawImage(img,sx,sy,sw,sh,dx,dy,sw*k,sh*k*compression+0.03);
      }
    }
    ctx.drawImage(img,0,0,img.naturalWidth,waist+2,-m.feet[0]*k,-m.feet[1]*k,img.naturalWidth*k,(waist+2)*k);
  }
  function draw(ctx,state,t,x,y,facing,opts) {
    opts=opts || {};
    var name=poseFor(state,opts),m=meta[name],img=images[name],k=rig.height/m.bodyHeight;
    var bob=state==='walk'?-Math.abs(Math.sin(t*22))*0.5:state==='idle'?-Math.abs(Math.sin(t*5))*0.5:0;
    var lean=state==='walk'?Math.sin(t*11)*0.012:state==='hurt'?-0.12*Math.max(0,1-t/0.3):0;
    if(state==='ko')lean=-Math.PI/2*Math.min(1,t/0.3);
    ctx.save();ctx.translate(x,y+bob);ctx.scale(facing<0?-1:1,1);ctx.rotate(lean);
    if(opts.alpha!=null)ctx.globalAlpha*=opts.alpha;
    ctx.imageSmoothingEnabled=false;
    if(opts.flash){ctx.shadowColor='#fff';ctx.shadowBlur=3;}
    if(state==='walk')walk(ctx,img,m,k,t);
    else ctx.drawImage(img,-m.feet[0]*k,-m.feet[1]*k,img.naturalWidth*k,img.naturalHeight*k);
    ctx.restore();return true;
  }
  rig.ready=function (who) {return who==='rafinha'?loaded():original.ready.apply(rig,arguments);};
  rig.draw=function (ctx,who,state,t,x,y,facing,opts) {
    if(who!=='rafinha')return original.draw.apply(rig,arguments);
    return loaded()?draw(ctx,state,t||0,x,y,facing,opts):true;
  };
  rig.big=function (ctx,who,state,t,x,y,facing,scale) {
    if(who!=='rafinha')return original.big.apply(rig,arguments);
    if(!loaded())return true;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);draw(ctx,state,t||0,0,0,facing,{});ctx.restore();return true;
  };
  rig.portrait=function (ctx,who,x,y) {
    if(who!=='rafinha')return original.portrait.apply(rig,arguments);
    if(!loaded())return true;
    var crop=meta.base.head;
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(images.base,crop[0],crop[1],crop[2],crop[3],x,y,28,28);ctx.restore();return true;
  };
  // No palco, mostra a figura inteira com baquetas e bateria sem cobrir o texto.
  rig.rafinhaStage=function (ctx,shout,x,y,w,h) {
    if(!loaded())return false;
    var name=shout?'especial':'primario',rect=meta[name].frame;
    var k=Math.min(w/rect[2],h/rect[3]);
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(images[name],rect[0],rect[1],rect[2],rect[3],
      x+(w-rect[2]*k)/2,y+(h-rect[3]*k)/2,rect[2]*k,rect[3]*k);
    ctx.restore();return true;
  };
}());
