/* Substitui todas as superfícies ativas do Fidelis; os demais rigs continuam próprios. */
(function(root){
  'use strict';
  var rig=root.Rig,v=root.FidelisVisual;
  var original={draw:rig.draw,big:rig.big,portrait:rig.portrait,ready:rig.ready};
  v.load('assets/fidelis-v1/atlas.webp?v=2');
  rig.ready=function(who){return who==='fidelis'?v.ready():original.ready.apply(rig,arguments);};
  rig.draw=function(ctx,who,state,t,x,y,facing,opts){return who==='fidelis'?v.draw(ctx,state,t,x,y,facing,opts):original.draw.apply(rig,arguments);};
  rig.big=function(ctx,who,state,t,x,y,facing,scale){
    if(who!=='fidelis')return original.big.apply(rig,arguments);
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);v.draw(ctx,state,t,0,0,facing,{});ctx.restore();return true;
  };
  rig.portrait=function(ctx,who,x,y){return who==='fidelis'?v.portrait(ctx,x,y):original.portrait.apply(rig,arguments);};
}(window));
