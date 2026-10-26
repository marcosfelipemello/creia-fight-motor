/* Equalizador de impacto: desenho em Canvas, sem projéteis ou dano adicionais. */
(function () {
  'use strict';
  var colors=['#94ef45','#ffdb58','#ff932f','#ff3c32'];
  function burst(ctx,x,y,facing,t,power) {
    ctx.save();ctx.translate(x,y);ctx.scale(facing,1);
    var pulse=1+Math.sin(t*48)*.12,r=power*(9+pulse*3);
    ctx.fillStyle='#ff8a28';ctx.beginPath();
    for(var i=0;i<16;i++){var a=i*Math.PI/8,d=i%2?r*.4:r;var px=Math.cos(a)*d,py=Math.sin(a)*d*.8;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}
    ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff9c5';ctx.beginPath();ctx.ellipse(1,0,r*.45,r*.32,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#e2ffff';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(5,0,3+pulse,9*power,0,-1.25,1.25);ctx.stroke();
    for(var j=0;j<10;j++){
      var phase=(t*2.8+j*.137)%1,ang=(j-4.5)*.22,d2=5+phase*28*power;
      ctx.globalAlpha=1-phase;ctx.fillStyle=j%2?'#fff2a1':'#ffaf32';
      ctx.fillRect(Math.cos(ang)*d2,Math.sin(ang)*d2,3,1.5);
    }
    ctx.restore();
  }
  function beam(ctx,x,y,facing,length,t,alpha) {
    var front=Math.min(length,Math.max(0,t)*2400);
    if(front<=0 || alpha<=0)return;
    ctx.save();ctx.translate(x,y);ctx.scale(facing,1);ctx.globalAlpha*=alpha;
    // O núcleo fino nasce no cano; a onda abre conforme avança.
    ctx.fillStyle='rgba(255,216,82,.22)';ctx.beginPath();ctx.moveTo(0,-2);ctx.lineTo(front,-24);ctx.lineTo(front,24);ctx.lineTo(0,2);ctx.closePath();ctx.fill();
    for(var i=0;i<Math.min(70,Math.ceil(front/7));i++){
      var dx=i*7,spread=Math.min(1,dx/60),energy=.55+.45*Math.sin(i*1.7-t*34);
      var blocks=1+Math.floor(spread*(2+energy*3));
      for(var row=-blocks;row<=blocks;row++){
        var edge=Math.abs(row)/Math.max(1,blocks),col=colors[Math.min(3,Math.floor(edge*4))];
        ctx.fillStyle=col;ctx.fillRect(dx,row*4,5,3);
      }
    }
    ctx.fillStyle='#fffbd5';ctx.fillRect(0,-1,front,2);
    ctx.strokeStyle='#fff3a4';ctx.lineWidth=2;
    for(var k=0;k<3;k++){
      var at=((t*310+k*53)%Math.max(1,front));
      ctx.beginPath();ctx.ellipse(at,0,3,7+Math.min(16,at*.16),0,-1.2,1.2);ctx.stroke();
    }
    ctx.restore();burst(ctx,x,y,facing,t,1.15);
  }
  function projectile(ctx,x,y,facing,t) {
    ctx.save();ctx.translate(x,y);ctx.scale(facing,1);
    for(var i=0;i<5;i++){
      var h=2+Math.round((Math.sin(t*25+i*2)+1)*2);
      ctx.fillStyle=colors[Math.min(3,i)];ctx.fillRect(i*3-7,-h,2,h*2);
    }
    ctx.fillStyle='#fff7bd';ctx.fillRect(-9,-1,18,2);
    ctx.globalAlpha*=.35;ctx.fillStyle='#ffbb3e';ctx.fillRect(-21,-1,11,2);ctx.restore();
  }
  function blueFire(ctx,x,y,facing,t,power) {
    ctx.save();ctx.translate(x,y);ctx.scale(facing,1);ctx.globalAlpha*=Math.max(0,power);
    var size=35+Math.min(1,t*15)*22;
    ['#18419d','#117fdf','#3edbff','#e8ffff'].forEach(function(color,layer){
      var length=size*(1-layer*.16),height=(18-layer*4);
      ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-5,0);
      for(var i=0;i<=12;i++){
        var u=i/12,wave=.7+.3*Math.sin(i*2.8-t*65+layer),edge=Math.sin(u*Math.PI*.85)*height*wave;
        ctx.lineTo(u*length,-edge);
      }
      ctx.lineTo(length+5,0);
      for(var j=12;j>=0;j--){var v=j/12;ctx.lineTo(v*length,Math.sin(v*Math.PI*.85)*height*(.7+.3*Math.cos(j*2.1+t*55)));}
      ctx.closePath();ctx.fill();
    });
    ctx.strokeStyle='#a7f6ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(9+t*90,0,3,12,0,-1.2,1.2);ctx.stroke();
    for(var k=0;k<8;k++){
      var phase=(t*3+k*.13)%1;ctx.fillStyle=k%2?'#72e7ff':'#268bff';
      ctx.fillRect(10+phase*size,(k%2?1:-1)*(4+phase*15),3,2);
    }
    ctx.restore();
  }
  window.PedroFX={beam:beam,burst:burst,projectile:projectile,blueFire:blueFire,duration:2.2};
}());
