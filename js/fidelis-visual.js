/* Fidelis: o mesmo desenho determinístico na engine e na composição HyperFrames. */
(function (root) {
  'use strict';
  var atlas = null, throws = null, defense = null, walkLayers = null, failed = false;
  var cells = {base:[0,0,512,512],guard:[512,0,512,512],prepare:[1024,0,512,512],strike:[0,512,540,512],back:[540,512,484,512],front:[1024,512,512,512]};
  var anchors = {base:[270,500],guard:[246,500],prepare:[280,500],strike:[240,452],back:[240,476],front:[230,470]};
  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
  function ease(a,b,t){var u=clamp((t-a)/(b-a),0,1);return u*u*(3-2*u);}
  function load(src,throwSrc,defenseSrc) {
    atlas=new Image();throws=new Image();defense=new Image();walkLayers=null;failed=false;
    atlas.onerror=throws.onerror=defense.onerror=function(){failed=true;};atlas.src=src;
    throws.src=throwSrc||src.replace(/atlas\.webp.*$/,'arremesso.webp?v=2');
    defense.src=defenseSrc||src.replace(/atlas\.webp.*$/,'defesa-impacto-v3.webp');
    return atlas;
  }
  function ready(){return !!(atlas && atlas.complete && atlas.naturalWidth>0 && throws && throws.complete && throws.naturalWidth>0 && defense && defense.complete && defense.naturalWidth>0);}
  function whenReady(){return Promise.all([atlas,throws,defense].map(function(image){return new Promise(function(resolve,reject){if(image.complete){if(image.naturalWidth)resolve();else reject(new Error('Arte do Fidelis indisponível'));}else{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',reject,{once:true});}});}));}
  function rules(){return root.CreiaCombat.fidelis;}
  function prepareWalk(){
    function canvas(){var c=document.createElement('canvas');c.width=c.height=512;return c;}
    function legs(c,cut){c.beginPath();[[180,cut||348],[340,cut||348],[512,380],[512,512],[80,512],[120,460],[174,382]].forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.closePath();}
    var body=canvas(),lower=canvas(),b=body.getContext('2d'),l=lower.getContext('2d');
    l.save();legs(l);l.clip();l.drawImage(atlas,0,0,512,512,0,0,512,512);l.restore();
    b.drawImage(atlas,0,0,512,512,0,0,512,512);b.globalCompositeOperation='destination-out';legs(b,368);b.fill();b.globalCompositeOperation='source-over';
    walkLayers={body:body,legs:lower};
  }
  function walk(ctx,t,k){   // a coxa gira a partir da virilha (y 368), não da cintura
    if(!ready())return;if(!walkLayers)prepareWalk();
    var waist=368,knee=414,split=256,a=anchors.base,motions=[],support=-Infinity;
    for(var leg=0;leg<2;leg++){
      var phase=t*11+leg*Math.PI,hip=leg?282:222,sx=leg?split:0,width=leg?512-split:split;
      var lift=Math.max(0,Math.cos(phase)),swing=Math.sin(phase)*.22,bend=lift*.38;
      var footX=leg?374:168,kneeX=leg?317:198,endY=(kneeX-hip)*Math.sin(swing)+(knee-waist)*Math.cos(swing)+(footX-kneeX)*Math.sin(swing+bend)+(500-knee)*Math.cos(swing+bend);
      support=Math.max(support,(waist-a[1]+endY)*k-lift*.55);
      motions.push({hip:hip,kneeX:kneeX,sx:sx,width:width,lift:lift,swing:swing,bend:bend});
    }
    // O pé de apoio define o balanço do corpo inteiro; os quadris nunca se separam do tronco.
    ctx.save();ctx.translate(0,-support+Math.abs(Math.sin(t*11))*.7);
    motions.forEach(function(m){
      ctx.save();ctx.translate((m.hip-a[0])*k,(waist-a[1])*k-m.lift*.55);ctx.rotate(m.swing);
      ctx.drawImage(walkLayers.legs,m.sx,waist-20,m.width,knee-waist+28,(m.sx-m.hip)*k,-20*k,m.width*k,(knee-waist+28)*k);
      ctx.translate((m.kneeX-m.hip)*k,(knee-waist)*k);ctx.rotate(m.bend);
      ctx.drawImage(walkLayers.legs,m.sx,knee-8,m.width,520-knee,(m.sx-m.kneeX)*k,-8*k,m.width*k,(520-knee)*k);ctx.restore();
    });
    ctx.drawImage(walkLayers.body,-a[0]*k,-a[1]*k,512*k,512*k);ctx.restore();
  }
  function throwing(ctx,t,k){
    if(!ready())return;
    var frame=t<rules().throwRelease?0:t<.25?1:2,u=ease(0,rules().throwRelease,t);
    var width=throws.naturalWidth/3,height=throws.naturalHeight,rot=frame===0?-.08*u:.045*(1-ease(.25,.36,t));
    ctx.save();ctx.translate(frame===0?-2*u:3*(1-ease(.24,.36,t)),0);ctx.rotate(rot);
    ctx.drawImage(throws,frame*width,0,width,height,-256*k,-487*k,512*k,512*k);ctx.restore();
  }
  function defending(ctx,dy){
    if(!ready())return;
    // Recorte exclusivo da referência de impacto: corpo do baixo para cima, braço para baixo.
    // Escala uniforme mantém as proporções do instrumento e das mãos.
    var scale=80/1314;
    ctx.save();ctx.translate(0,dy);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(defense,-490*scale,-1406*scale,defense.naturalWidth*scale,defense.naturalHeight*scale);ctx.restore();
  }
  function tile(ctx,name,x,y,k,rotation,sx,sy) {
    if(!ready())return;
    var p=cells[name],a=anchors[name];
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation||0);ctx.scale(sx==null?1:sx,sy==null?1:sy);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(atlas,p[0],p[1],p[2],p[3],-a[0]*k,-a[1]*k,p[2]*k,p[3]*k);ctx.restore();
  }
  function arc(ctx,u,reverse,heavy) {
    // Escada de segmentos: energia acompanha o baixo, sem suavizar a pixel art.
    var start=-2.9+(reverse?-1:1)*u*5.2,r=heavy?64:53;
    ctx.save();ctx.translate(0,-35);ctx.scale(1,.52);
    for(var j=0;j<18;j++){
      var ang=start+(reverse?1:-1)*j*.065;
      ctx.fillStyle=j<5?'#edffff':j<11?'#83eaff':'#308bad';
      ctx.globalAlpha*=.96;var z=j<6?4:2;
      ctx.fillRect(Math.round(Math.cos(ang)*r),Math.round(Math.sin(ang)*r),z,z);
    }
    ctx.restore();
  }
  function whirlwind(ctx,t,front){
    var strength=ease(.26,.4,t)*(1-ease(1.64,1.8,t));
    if(strength<=0)return;
    ctx.save();var inheritedAlpha=ctx.globalAlpha;
    // Faixas em espiral passam atrás e à frente do personagem, no mesmo espaço do golpe.
    for(var ring=0;ring<5;ring++){
      var radius=25+ring*5.5,height=7+ring*14;
      for(var piece=0;piece<64;piece++){
        var angle=piece*Math.PI/32+t*19+ring*.85,near=Math.sin(angle)>0;
        if(near!==front)continue;
        var tail=(piece%16)/16;if(tail>.77)continue;
        var x=Math.round(Math.cos(angle)*radius),y=Math.round(-height+Math.sin(angle)*radius*.24);
        ctx.globalAlpha=inheritedAlpha*strength*(front?.64:.32)*(1-tail*.65);
        ctx.fillStyle=tail<.22?'#edffff':tail<.48?'#8ce8ff':'#3a9fc5';
        ctx.fillRect(x,y,tail<.22?4:3,tail<.22?2:1);
      }
    }
    if(front)for(var dust=0;dust<12;dust++){
      var phase=t*15+dust*2.4,r=25+(dust%4)*5;
      ctx.globalAlpha=inheritedAlpha*strength*.42;ctx.fillStyle=dust%3?'#91c3d3':'#d9eff2';
      ctx.fillRect(Math.round(Math.cos(phase)*r),Math.round(-3-Math.abs(Math.sin(phase))*8),2,2);
    }
    ctx.restore();
  }
  function draw(ctx,state,t,x,y,facing,opts) {
    opts=opts||{};t=Math.max(0,t||0);
    var name='base',dx=0,dy=0,rot=0,sx=1,sy=1,k=76/430,trail=null;
    if(opts.guard||state==='guard'){name='guard';dy=Math.sin(t*8)*.35;}
    else if(state==='cutin'){name='prepare';}
    else if(state==='special'){
      if(t<.26){name='prepare';rot=-.1*ease(0,.26,t);dy=2*ease(0,.26,t);}
      else if(t<1.8){
        var phase=(t-.26)/.25,turn=Math.floor(phase),u=phase-turn;
        name=turn%2?'front':'back';rot=(turn%2?1:-1)*(.12-.24*u);
        sx=.82+.18*Math.sin(u*Math.PI);dy=-3*Math.sin(u*Math.PI);trail=[u,!(turn%2),false];
      }else if(t<1.9){name='prepare';rot=-.15;dy=-2;}
      else {var end=ease(1.9,2.06,t);name='strike';rot=-.1+.19*end;dy=3*end;dx=6*end;trail=[end,false,true];}
    }else if(state==='attack2'||state==='jumpkick'){
      if(t<.17){name='prepare';rot=-.15*ease(0,.17,t);dx=-3;}
      else{var hit=ease(.17,.29,t);name=t>.47?'base':'strike';rot=-.1+.18*hit;dx=5*hit*(1-ease(.36,.58,t));dy=2*hit;trail=t<.36?[hit,false,true]:null;}
    }else if(state==='walk'){
      dy=-Math.abs(Math.sin(t*11))*.7;rot=Math.sin(t*11)*.018;
      sx=1+Math.sin(t*12)*.025;sy=1-Math.abs(Math.sin(t*12))*.015;
    }else if(state==='throw'){
      // A mão segura o controle apenas na preparação; projétil nasce no quadro de soltura.
      dx=0;
    }else if(state==='attack1'){
      dx=Math.sin(clamp(t/.24,0,1)*Math.PI)*4;rot=.06*Math.sin(clamp(t/.24,0,1)*Math.PI);
    }else if(state==='hurt'){dx=-3*(1-ease(0,.3,t));rot=-.14*(1-ease(0,.3,t));}
    else if(state==='ko'){rot=-Math.PI*.48*ease(0,.35,t);}
    else if(state==='jump'){rot=-.06;sy=1.025;}
    else if(state==='pet'){rot=.15;sy=.8;}
    else if(state==='victory'){name='prepare';dy=-Math.abs(Math.sin(t*7))*3;}
    else{dy=-Math.abs(Math.sin(t*4))*.55;sy=1+Math.sin(t*4)*.004;}
    ctx.save();ctx.translate(x,y);ctx.scale(facing<0?-1:1,1);
    if(opts.alpha!=null)ctx.globalAlpha*=opts.alpha;
    if(state==='special'&&!opts.guard)whirlwind(ctx,t,false);
    if(trail){ctx.save();ctx.globalAlpha*=.16;tile(ctx,name,dx-8,dy,k,rot-.13,sx,sy);ctx.restore();}
    if(opts.guard||state==='guard')defending(ctx,dy);
    else if(state==='walk'){ctx.save();ctx.translate(0,dy);walk(ctx,t,k);ctx.restore();}
    else if(state==='throw'&&!opts.guard)throwing(ctx,t,k);
    else tile(ctx,name,dx,dy,k,rot,sx,sy);
    if(trail)arc(ctx,trail[0],trail[1],trail[2]);
    if(state==='special'&&!opts.guard)whirlwind(ctx,t,true);
    if(opts.flash){ctx.globalAlpha*=.3;ctx.fillStyle='#c9faff';ctx.fillRect(-12,-48,24,4);}
    ctx.restore();return true;
  }
  function label(ctx,text,x,y,size,color,align){
    ctx.font='900 '+size+'px monospace';ctx.textAlign=align||'left';ctx.textBaseline='alphabetic';
    ctx.lineJoin='miter';ctx.strokeStyle='#07131e';ctx.lineWidth=3;ctx.strokeText(text,x,y);
    ctx.fillStyle=color;ctx.fillText(text,x,y);
  }
  function cinematic(ctx,t,w,h) {
    ctx.save();ctx.scale(w/480,h/270);ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#06111d';ctx.fillRect(0,0,480,270);
    for(var i=0;i<24;i++){
      var xx=((i*83-Math.floor(t*100))%560+560)%560-40;
      ctx.fillStyle=i%3?'#102a3c':'#1d4e64';ctx.fillRect(xx,36+i%7*26,34+i%4*18,2);
    }
    ctx.save();ctx.beginPath();ctx.rect(0,23,480,198);ctx.clip();
    if(t<.82){
      // Rosto precede o gesto: close a partir da própria pose nova.
      var zoom=1+ease(0,.82,t)*.12;
      ctx.save();ctx.translate(240,122);ctx.scale(zoom,zoom);
      if(ready())ctx.drawImage(atlas,128,42,222,224,-140,-112,280,280);
      ctx.restore();
    }else{
      var u=ease(.82,1.15,t),pull=ease(1.15,1.65,t),scale=1.95+.25*pull;
      var camera=Math.floor(t*24),hit=ease(2.25,2.32,t)*(1-ease(2.32,2.62,t));
      ctx.translate(Math.sin(camera*2.3)*hit*3,Math.cos(camera*3.1)*hit*2);
      ctx.save();ctx.translate(255+(1-u)*150,218);ctx.scale(scale,scale);
      var pose=t<1.18?'base':t<2.26?'prepare':'front';
      tile(ctx,pose,0,0,76/430,t<2.26?-.06*pull:.06,1,1);
      if(t>1.65)arc(ctx,ease(1.65,2.65,t),false,true);
      ctx.restore();
      if(hit>.4){ctx.globalAlpha=.08*hit;ctx.fillStyle='#c9faff';ctx.fillRect(0,0,480,270);}
    }
    ctx.restore();
    ctx.fillStyle='#03101a';ctx.fillRect(0,0,480,23);ctx.fillRect(0,221,480,49);
    ctx.fillStyle='#70eaff';ctx.fillRect(22,221,436,2);
    label(ctx,'FIDELIS',24,17,11,'#a5edff');
    if(t<.78)label(ctx,'INVERSÃO',32,251,18,'#f1ffff');
    else label(ctx,'INVERSÃO DE ACOOORDEE!',240,252,19,'#f1ffff','center');
    var fade=ease(2.84,3,t);
    if(fade){ctx.globalAlpha=fade;ctx.fillStyle='#06111d';ctx.fillRect(0,0,480,270);}
    ctx.restore();
  }
  root.FidelisVisual={duration:3,specialDuration:2.2,load:load,ready:ready,whenReady:whenReady,failed:function(){return failed;},draw:draw,cinematic:cinematic,
    portrait:function(ctx,x,y){if(ready()){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(atlas,162,38,178,188,x,y,28,28);ctx.restore();}return true;}};
}(typeof window!=='undefined'?window:globalThis));
