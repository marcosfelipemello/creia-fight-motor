/* Poses da Emanuelly; somente desenho, sem alterar combate ou controles. */
(function () {
  'use strict';
  var rig=window.Rig, meta=window.EmanuellyArtAssets, images={};
  var original={draw:rig.draw,big:rig.big,portrait:rig.portrait,ready:rig.ready,item:rig.item};
  Object.keys(window.EmanuellyArtEmbedded).forEach(function (name) {
    var image=new Image();
    image.src=window.EmanuellyArtEmbedded[name];
    images[name]=image;
  });
  function loaded() {
    return Object.keys(images).every(function (name) {return images[name].complete && images[name].naturalWidth>0;});
  }
  window.EmanuellyArtPreview={
    ready:loaded,
    failed:function(){return Object.keys(images).filter(function(name){return images[name].complete && !images[name].naturalWidth;});}
  };
  function poseFor(state,opts) {
    if(opts.guard || state==='guard')return 'defesa';
    if(state==='cutin')return 'cena-especial';
    if(state==='special')return 'especial';
    if(state==='attack2' || state==='jumpkick')return 'secundario';
    if(state==='throw')return 'primario';
    if(opts.airThrow && (state==='jump' || state==='idle' || state==='walk'))return 'primario';
    if(state==='attack1' || state==='attack3')return 'primario';
    return 'base';
  }
  function walk(ctx,img,m,k,t) {
    // Corte horizontal completo: nenhuma borda antiga da perna fica no tronco.
    // Uma chamada por perna evita as emendas escuras entre tiras fracionárias.
    var waist=Math.round(m.walk.waist),split=Math.round(m.walk.split),span=m.feet[1]-waist;
    var bottom=Math.min(img.naturalHeight,Math.ceil(m.feet[1]+2)),legHeight=bottom-waist;
    for(var leg=0;leg<2;leg++){
      var phase=t*11+leg*Math.PI,lift=Math.max(0,Math.cos(phase))*3;
      var sx=leg?split:0,sw=leg?img.naturalWidth-split:split,hip=split+(leg?12:-12);
      ctx.save();ctx.translate((hip-m.feet[0])*k,(waist-m.feet[1])*k);
      ctx.rotate(Math.sin(phase)*.11);ctx.scale(1,1-lift/(span*k));
      ctx.drawImage(img,sx,waist,sw,legHeight,(sx-hip)*k,0,sw*k,legHeight*k);ctx.restore();
    }
    ctx.drawImage(img,0,0,img.naturalWidth,waist+1,-m.feet[0]*k,-m.feet[1]*k,img.naturalWidth*k,(waist+1)*k);
  }
  function draw(ctx,state,t,x,y,facing,opts) {
    opts=opts || {};
    var name=poseFor(state,opts),m=meta[name],img=images[name],k=rig.height*m.heightScale/m.bodyHeight;
    var bob=state==='walk'?-Math.abs(Math.sin(t*22))*0.5:state==='idle'?-Math.abs(Math.sin(t*5))*0.5:0;
    var lean=state==='walk'?Math.sin(t*11)*0.012:state==='hurt'?-0.12*Math.max(0,1-t/0.3):0;
    if(state==='ko')lean=-Math.PI/2*Math.min(1,t/0.3);
    ctx.save();ctx.translate(x,y+bob);ctx.scale(facing<0?-1:1,1);ctx.rotate(lean);
    if(opts.alpha!=null)ctx.globalAlpha*=opts.alpha;
    ctx.imageSmoothingEnabled=false;
    if(opts.flash){ctx.shadowColor='#fff';ctx.shadowBlur=3;}
    if(state==='walk' && m.walk)walk(ctx,img,m,k,t);
    else ctx.drawImage(img,-m.feet[0]*k,-m.feet[1]*k,img.naturalWidth*k,img.naturalHeight*k);
    ctx.restore();return true;
  }
  rig.ready=function (who) {return who==='emanuelly'?(loaded() || original.ready.apply(rig,arguments)):original.ready.apply(rig,arguments);};
  rig.draw=function (ctx,who,state,t,x,y,facing,opts) {
    if(who!=='emanuelly')return original.draw.apply(rig,arguments);
    return loaded()?draw(ctx,state,t||0,x,y,facing,opts):original.draw.apply(rig,arguments);
  };
  rig.big=function (ctx,who,state,t,x,y,facing,scale) {
    if(who!=='emanuelly')return original.big.apply(rig,arguments);
    if(!loaded())return original.big.apply(rig,arguments);
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);draw(ctx,state,t||0,0,0,facing,{});ctx.restore();return true;
  };
  rig.portrait=function (ctx,who,x,y) {
    if(who!=='emanuelly')return original.portrait.apply(rig,arguments);
    if(!loaded())return original.portrait.apply(rig,arguments);
    var crop=meta.base.head;
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(images.base,crop[0],crop[1],crop[2],crop[3],x,y,28,28);ctx.restore();return true;
  };
  function muzzle(state) {
    var m=meta[state==='attack2'?'secundario':'primario'],k=rig.height*m.heightScale/m.bodyHeight;
    return {x:(m.muzzle[0]-m.feet[0])*k,y:(m.muzzle[1]-m.feet[1])*k};
  }
  window.EmanuellyArt={img:function(name){return images[name];},meta:meta,poseFor:function(state,opts){return poseFor(state,opts||{});},ready:loaded,muzzle:muzzle};
  rig.emanuellyMuzzle=muzzle;
  rig.emanuellyShot=function(ctx,s,cam,t){
    var dir=s.vx<0?-1:1;
    ctx.save();ctx.translate(s.x-cam,s.y-s.z);ctx.scale(dir,1);ctx.imageSmoothingEnabled=false;
    if(s.k==='manu-lamina'){
      // A lâmina original aponta na diagonal; giro de 47 graus deixa o voo horizontal.
      ctx.rotate(.82);var im=images.lamina;
      if(im.complete&&im.naturalWidth)ctx.drawImage(im,47,112,288,288,-18,-18,36,36);
    }else{
      var wide=s.k==='manu-curto';ctx.shadowColor=wide?'#3b8bff':'#ffd34d';ctx.shadowBlur=wide?6:3;
      ctx.fillStyle=wide?'#3b8bff':'#ffd34d';ctx.fillRect(wide?-19:-10,wide?-8:-2,wide?26:14,wide?16:4);
      ctx.fillStyle='#ffffff';ctx.fillRect(wide?-12:-5,wide?-3:-1,wide?18:10,wide?6:2);
    }
    ctx.restore();return true;
  };
}());
