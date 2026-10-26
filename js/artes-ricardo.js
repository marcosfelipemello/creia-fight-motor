/* Poses do Ricardo; somente desenho, sem alterar combate ou controles. */
(function () {
  'use strict';
  var rig=window.Rig, meta=window.RicardoArtAssets, images={};
  var original={draw:rig.draw,big:rig.big,portrait:rig.portrait,ready:rig.ready,item:rig.item};
  Object.keys(meta).forEach(function (name) {
    var image=new Image();
    image.src=window.RicardoArtEmbedded[name];
    images[name]=image;
  });
  function loaded() {
    return Object.keys(images).every(function (name) {return images[name].complete && images[name].naturalWidth>0;});
  }
  window.RicardoArtPreview={
    ready:loaded,
    failed:function(){return Object.keys(images).filter(function(name){return images[name].complete && !images[name].naturalWidth;});}
  };
  function poseFor(state,opts) {
    if(opts.guard || state==='guard')return 'defesa';
    if(state==='cutin')return 'cena-especial';
    if(state==='special')return 'especial';
    if(state==='roll')return 'secundario';
    if(state==='attack2')return 'secundario';
    if(state==='throw')return 'primario';
    if(opts.airThrow && (state==='jump' || state==='idle' || state==='walk'))return 'primario';
    if(state==='attack1' || state==='attack3' || state==='jumpkick')return 'primario';
    return 'base';
  }
  var walkLayers=null;
  function prepareWalk(img,m) {
    function canvas(){var c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;return c;}
    function polygon(c){c.beginPath();m.walk.legs.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.closePath();}
    var legs=canvas(),body=canvas(),l=legs.getContext('2d'),b=body.getContext('2d');
    l.save();polygon(l);l.clip();l.drawImage(img,0,0);l.restore();
    b.drawImage(img,0,0);b.globalCompositeOperation='destination-out';polygon(b);b.fill();b.globalCompositeOperation='source-over';
    return {legs:legs,body:body};
  }
  function walk(ctx,img,m,k,t) {
    if(!walkLayers)walkLayers=prepareWalk(img,m);
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
        ctx.drawImage(walkLayers.legs,sx,sy,sw,sh,dx,dy,sw*k,sh*k*compression+0.03);
      }
    }
    ctx.drawImage(walkLayers.body,-m.feet[0]*k,-m.feet[1]*k,img.naturalWidth*k,img.naturalHeight*k);
  }
  function draw(ctx,state,t,x,y,facing,opts) {
    opts=opts || {};
    var name=poseFor(state,opts),m=meta[name],img=images[name],k=rig.height/m.bodyHeight;
    var rolling=state==='roll',rollRadius=rig.height*.31;
    if(rolling)k=rollRadius/213; // raio medido na arte; bola compacta com 62% da altura em pé
    var bob=state==='walk'?-Math.abs(Math.sin(t*22))*0.5:state==='idle'?-Math.abs(Math.sin(t*5))*0.5:0;
    var lean=state==='walk'?Math.sin(t*11)*0.012:state==='hurt'?-0.12*Math.max(0,1-t/0.3):0;
    if(state==='ko')lean=-Math.PI/2*Math.min(1,t/0.3);
    ctx.save();ctx.translate(x,y+bob);ctx.scale(facing<0?-1:1,1);ctx.rotate(lean);
    if(rolling){ctx.translate(0,-rollRadius);ctx.rotate(t*12);}
    if(opts.alpha!=null)ctx.globalAlpha*=opts.alpha;
    ctx.imageSmoothingEnabled=false;
    if(opts.flash){ctx.shadowColor='#fff';ctx.shadowBlur=3;}
    if(rolling)ctx.drawImage(img,-265.5*k,-281*k,img.naturalWidth*k,img.naturalHeight*k);
    else if(state==='walk' && m.walk)walk(ctx,img,m,k,t);
    else ctx.drawImage(img,-m.feet[0]*k,-m.feet[1]*k,img.naturalWidth*k,img.naturalHeight*k);
    ctx.restore();return true;
  }
  rig.ready=function (who) {return who==='ricardo'?loaded():original.ready.apply(rig,arguments);};
  rig.draw=function (ctx,who,state,t,x,y,facing,opts) {
    if(who!=='ricardo')return original.draw.apply(rig,arguments);
    return loaded()?draw(ctx,state,t||0,x,y,facing,opts):true;
  };
  rig.big=function (ctx,who,state,t,x,y,facing,scale) {
    if(who!=='ricardo')return original.big.apply(rig,arguments);
    if(!loaded())return true;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);draw(ctx,state,t||0,0,0,facing,{});ctx.restore();return true;
  };
  rig.portrait=function (ctx,who,x,y) {
    if(who!=='ricardo')return original.portrait.apply(rig,arguments);
    if(!loaded())return true;
    var crop=meta.base.head;
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(images.base,crop[0],crop[1],crop[2],crop[3],x,y,28,28);ctx.restore();return true;
  };
  rig.ricardoCine=function(ctx,x,y,w,h,progress) {
    if(!loaded())return false;
    var m=meta['cena-especial'],u=Math.max(0,Math.min(1,progress||0)),a=m.face,b=m.bible;
    var crop=a.map(function(v,i){return v+(b[i]-v)*u;}),k=Math.min(w/crop[2],h/crop[3]);
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(images['cena-especial'],crop[0],crop[1],crop[2],crop[3],x+(w-crop[2]*k)/2,y+(h-crop[3]*k)/2,crop[2]*k,crop[3]*k);
    ctx.restore();return true;
  };
  rig.ricardoDoorSize=function(){var k=rig.height/meta.especial.bodyHeight;return {half:256*k,contact:(461-256)*k};};
  rig.item=function(ctx,kind,x,y,rot,scale){
    if(kind!=='ric-porta')return original.item.apply(rig,arguments);
    if(!loaded())return true;
    var img=images.especial,k=rig.height/meta.especial.bodyHeight;
    ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.scale(scale==null?1:scale,scale==null?1:scale);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(img,-img.naturalWidth*k/2,-img.naturalHeight*k/2,img.naturalWidth*k,img.naturalHeight*k);ctx.restore();return true;
  };
}());
