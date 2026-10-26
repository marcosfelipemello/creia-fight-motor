/* Chuva do Bispo: cópias e chamas apenas visuais, sem alterar colisão ou dano. */
(function(){
  'use strict';
  function meteor(ctx,x,y,angle,t,size){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(size,size);
    var flicker=Math.sin(t*36)*3;
    ['#8c2217','#f04a18','#ff9b27','#ffe677'].forEach(function(color,layer){
      var length=50-layer*8+flicker,width=12-layer*2;
      ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(8,-width*.65);
      ctx.quadraticCurveTo(-12,-width*1.3,-length,-width*.25);
      ctx.lineTo(-length+15,0);ctx.lineTo(-length-5,width*.45);
      ctx.quadraticCurveTo(-12,width*1.3,8,width*.65);ctx.closePath();ctx.fill();
    });
    ctx.fillStyle='#ff7226';ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ffe781';ctx.beginPath();ctx.arc(2,-1,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff8dc';ctx.beginPath();ctx.arc(3,-2,4,0,Math.PI*2);ctx.fill();
    for(var i=0;i<5;i++){
      var u=(t*2+i*.19)%1;ctx.globalAlpha=(1-u)*.8;ctx.fillStyle=i%2?'#ffcb52':'#ff6626';
      ctx.fillRect(-16-u*48,(i%2?1:-1)*(5+u*13),3-u*2,2);
    }
    ctx.restore();
  }
  function bispoRain(ctx,x,y,angle,t,seed){
    // A bola central corresponde ao projétil real. As duas acompanhantes não têm hitbox.
    meteor(ctx,x,y,angle,t+seed*.01,1.7);
    ctx.save();ctx.globalAlpha*=.75;
    meteor(ctx,x-83,y-42,angle,t+.37+seed*.01,1.25);
    meteor(ctx,x+97,y-95,angle,t+.71+seed*.01,1.4);ctx.restore();
  }
  function impact(ctx,x,y,age,kind,strong){
    if(age>.23)return;
    var u=age/.23,r=(strong?13:8)*(1+u*.8),block=kind==='block';
    ctx.save();ctx.translate(x,y);ctx.globalAlpha*=1-u;
    ctx.strokeStyle=block?'#d6f6ff':kind==='break'?'#ff4a61':'#ffe19a';ctx.lineWidth=strong?2.5:1.5;
    if(block){ctx.beginPath();ctx.arc(0,0,r,-1.2,1.2);ctx.stroke();}
    else for(var i=0;i<8;i++){
      var a=i*Math.PI/4+.15;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.35,Math.sin(a)*r*.35);
      ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();
    }
    ctx.fillStyle='#fff7da';ctx.fillRect(-2,-2,4,4);ctx.restore();
  }
  window.CreiaCombatFX={bispoRain:bispoRain,impact:impact};
}());
