/* HUD de combate: apresentação pura, alimentada pelo estado autoritativo do motor. */
(function(root){
 'use strict';
 var C={ground:'#0b0a10',surface:'#181521',line:'#493346',paper:'#ffffff',muted:'#c9c4d6',gold:'#ffd34d',red:'#e8323c',blue:'#3b8bff',green:'#3bff6a',purple:'#a875ff',pink:'#ff72bd'};
 function frac(v,max){return Math.max(0,Math.min(1,(Number(v)||0)/(max||100)));}
 function text(ctx,value,x,y,size,color,align,display){ctx.font=(display?'700 ':'600 ')+size+'px '+(display?'CreiaDisplay':'CreiaSans')+',sans-serif';ctx.textAlign=align||'left';ctx.textBaseline='top';ctx.fillStyle=color||C.paper;ctx.fillText(String(value),x,y);}
 function fit(ctx,value,width,size){ctx.font='700 '+size+'px CreiaDisplay,sans-serif';var s=String(value);if(ctx.measureText(s).width<=width)return s;while(s.length&&ctx.measureText(s+'…').width>width)s=s.slice(0,-1);return s+'…';}
 function rect(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
 function polygon(ctx,points,color){ctx.beginPath();points.forEach(function(p,i){if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);});ctx.closePath();ctx.fillStyle=color;ctx.fill();}
 function meter(ctx,x,y,w,h,value,color,right,sections){
  rect(ctx,x,y,w,h,'#352333');var fill=w*frac(value,1);rect(ctx,right?x+w-fill:x,y,fill,h,color);
  if(sections)for(var i=1;i<sections;i++)rect(ctx,x+w*i/sections-.5,y,1,h,C.ground);
 }
 function portrait(ctx,p,x,y,size,color,draw){
  rect(ctx,x-1,y-1,size+2,size+2,color);rect(ctx,x,y,size,size,C.surface);
  ctx.save();ctx.translate(x,y);ctx.scale(size/28,size/28);draw(p.who,0,0);ctx.restore();
  if(p.dead){rect(ctx,x,y,size,size,'rgba(11,10,16,.78)');text(ctx,'K.O.',x+size/2,y+size/2-5,10,C.paper,'center',true);}
 }
 function status(p){if(p.dead)return '';if(p.limadoT>0)return 'LIMADOS '+Math.ceil(p.limadoT)+'s';if(p.shield>0)return 'ESCUDO '+Math.ceil(p.shield)+'s';if(p.turbo>0)return 'TURBO '+Math.ceil(p.turbo)+'s';return '';}
 function roundMarks(ctx,r){[0,1].forEach(function(side){for(var i=0;i<2;i++){var x=side?247+i*11:222+i*11,y=44;polygon(ctx,[[x,y-3],[x+3,y],[x,y+3],[x-3,y]],i<(r.wins[side]||0)?(side?C.blue:C.red):C.line);}});}
 function x1(ctx,s,draw){
  ctx.save();rect(ctx,0,0,480,56,'rgba(11,10,16,.55)');
  polygon(ctx,[[0,56],[202,56],[208,50],[272,50],[278,56],[480,56],[480,58],[0,58]],C.line);
  s.players.slice(0,2).forEach(function(p,i){
   var right=i===1,color=right?C.blue:C.red,bx=right?282:44,anchor=right?436:44,align=right?'right':'left',hp=frac(p.hp,p.maxHp),def=p.guardHp==null?100:p.guardHp;
   portrait(ctx,p,right?444:8,8,28,color,draw);
   text(ctx,fit(ctx,(i?'P2 ':'P1 ')+(s.names[p.who]||p.who)+(p.ai?' · IA':''),114,9),anchor,5,9,C.paper,align,true);
   meter(ctx,bx,19,154,10,hp,color,right);rect(ctx,bx,29,154,1,hp<.25?C.gold:color);
   text(ctx,'HP '+Math.ceil(Math.max(0,p.hp)),right?bx:bx+154,6,6.5,C.paper,right?'left':'right');
   text(ctx,p.dead?'ESP —':p.sp>=100?'ESPECIAL PRONTO':'ESP '+Math.floor(p.sp)+'%',anchor,34,6.5,p.sp>=100?C.gold:C.muted,align);
   meter(ctx,right?282:128,35,70,3,p.dead?0:frac(p.sp),p.sp>=100?C.gold:'#7fe8ff',right);
   text(ctx,p.dead?'DEF —':p.guardCd>0?'DEF QUEBRADA':'DEF '+Math.ceil(def)+'%',anchor,44,6.5,p.guardCd>0?C.paper:C.muted,align);
   meter(ctx,right?282:128,45,70,3,p.dead?0:frac(def),p.guardCd>0?C.red:C.gold,right,5);
   var active=status(p);if(active){ctx.font='700 6.5px CreiaDisplay,sans-serif';var aw=ctx.measureText(active).width;rect(ctx,right?anchor-aw-3:anchor-3,60,aw+6,11,C.ground);text(ctx,active,anchor,62,6.5,C.gold,align,true);}
  });
  text(ctx,'X1',240,5,12,C.gold,'center',true);text(ctx,'ROUND '+s.round.number,240,23,7.5,C.paper,'center',true);roundMarks(ctx,s.round);
  ctx.restore();
 }
 function participant(players,index){var p=players[index];if(!p.ai)return {label:'P'+((p.ctl||0)+1),color:[C.red,C.blue,C.green,C.gold][p.ctl||0]||C.red};var n=players.slice(0,index+1).filter(function(q){return q.ai;}).length;return {label:'IA '+n,color:[C.green,C.purple,C.pink][(n-1)%3]};}
 function adventure(ctx,s,draw){
  ctx.save();rect(ctx,0,0,480,68,'rgba(11,10,16,.55)');
  var count=Math.max(1,s.players.length),width=Math.min(180,(464-(count-1)*7)/count);
  s.players.slice(0,4).forEach(function(p,i){
   var x=8+i*(width+7),tag=participant(s.players,i),barX=x+43,barW=width-65;
   portrait(ctx,p,x,7,24,tag.color,draw);
   text(ctx,fit(ctx,tag.label+' '+(s.names[p.who]||p.who),width-29,8),x+29,5,8,C.paper,'left',true);
   text(ctx,'HP',x+29,18,5.5,C.muted);meter(ctx,barX,19,barW,6,frac(p.hp,p.maxHp),tag.color,false);
   text(ctx,Math.ceil(Math.max(0,p.hp)),x+width,17,6.5,C.paper,'right');
   text(ctx,'ESP',x+29,29,5.5,p.sp>=100?C.gold:C.muted);meter(ctx,barX,30,barW,3,p.dead?0:frac(p.sp),p.sp>=100?C.gold:'#7fe8ff',false);
   text(ctx,p.dead?'—':Math.floor(p.sp)+'%',x+width,28,6,C.gold,'right');
   var active=status(p);if(active)text(ctx,active,x+29,38,5.5,C.gold,'left',true);
  });
  if(count<3)text(ctx,'AVENTURA',472,7,10,C.gold,'right',true);
  rect(ctx,8,46,45,15,C.gold);text(ctx,'FASE '+String(s.stage).padStart(2,'0'),30.5,49,7,C.ground,'center',true);
  text(ctx,fit(ctx,s.place,240,7.5),62,46,7.5,C.paper,'left',true);
  text(ctx,s.bossOn?'CHEFE EM CAMPO':'ONDA '+s.wave+' / '+s.waves,62,57,6,C.muted);
  text(ctx,'PONTOS '+s.score,472,45,8,C.paper,'right',true);text(ctx,'RECORDE '+s.hi,472,57,5.5,C.muted,'right');
  rect(ctx,8,67,464,1,C.line);
  var live=s.bosses.filter(function(b){return !b.dead&&!b.vs;});
  if(live.length)rect(ctx,0,69,480,24,'rgba(11,10,16,.55)');
  live.forEach(function(b,i){var w=(464-8*(live.length-1))/live.length,x=8+i*(w+8);text(ctx,fit(ctx,String(b.name||'CHEFE').toUpperCase(),w-64,7),x,73,7,C.paper,'left',true);text(ctx,Math.ceil(Math.max(0,b.hp))+' / '+b.maxHp,x+w,74,5.5,C.muted,'right');meter(ctx,x,84,w,5,frac(b.hp,b.maxHp),C.red,false);});
  if(s.combo>1){var y=live.length?97:74;rect(ctx,395,y-2,85,15,C.ground);text(ctx,'COMBO '+s.combo+' ×'+s.mult,472,y,9,C.gold,'right',true);}
  ctx.restore();
 }
 root.CreiaHUD={x1:x1,adventure:adventure,colors:C};
}(typeof window!=='undefined'?window:globalThis));
