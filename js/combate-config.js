/* Regras compartilhadas por humanos, IA, aventura, X1 e ficha de atributos. */
(function(root){
 'use strict';
 var primary={nutri:[0.72,0.72,3.8,6,310],emanuelly:[0.68,0.68,4.2,6,360],enzo:[0.75,0.75,4.5,7,340],pedro:[0.65,0.65,4,6,330],naju:[0.8,0.8,5,8,400],grazi:[0.72,0.72,4,6,300],bispo:[0.85,0.85,4.5,8,290],lohan:[0.7,0.7,4.2,6,150],rafinha:[0.78,0.78,4.8,10,340],douglas:[0.7,0.7,4,8,100],fidelis:[0.75,0.75,4.5,8,300],arthur:[0.72,0.72,4,5,95],lucas:[0.75,0.75,4.2,9,320],duda:[0.8,0.8,3.5,7,150],cardoso:[0.7,0.7,4.2,8,100],th:[0.75,0.75,4,6,310],douglinhas:[0.78,0.78,4.2,6,320],ricardo:[0.45,0.45,8,16,48],adriene:[0.72,0.72,4.2,7,300],lutador:[0.713,0.713,33.6,44.8,40]};
 var secondary={nutri:[0.45,12,28],lutador:[1.35,10,320],emanuelly:[1.15,7.5,240],enzo:[1.25,8.5,300],pedro:[1.15,12,150],naju:[1.2,8.7,34],grazi:[1.5,6,50],bispo:[3,0,0],lohan:[1.4,8.5,320],rafinha:[1.15,0,0],douglas:[1.35,9,300],fidelis:[1.25,12,68],arthur:[9.2,0,0],lucas:[1.15,14,40],duda:[30,0,0],cardoso:[1.4,13,45],th:[1.35,8.5,330],douglinhas:[1.25,12,50],ricardo:[2.4,10,190],adriene:[1.1,13,44]};
 var levels={facil:{reaction:.42,think:.22,attackGap:.48,guardChance:.2,specialChance:.35,guardHold:.22,spacingError:24},medio:{reaction:.22,think:.13,attackGap:.27,guardChance:.58,specialChance:.7,guardHold:.38,spacingError:10},dificil:{reaction:.1,think:.065,attackGap:.13,guardChance:.9,specialChance:1,guardHold:.5,spacingError:2}};
 // Contrato único para desenho, simulação e prévia HyperFrames do Fidelis.
 function pointSegmentSq(x,z,a,b){var dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz,u=length?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/length)):0;return Math.pow(x-a[0]-u*dx,2)+Math.pow(z-a[1]-u*dz,2);}
 function segmentBox(a,b,x0,x1,z0,z1){
  var low=0,high=1;
  for(var axis=0;axis<2;axis++){var min=axis?z0:x0,max=axis?z1:x1,delta=b[axis]-a[axis];if(Math.abs(delta)<1e-8){if(a[axis]<min||a[axis]>max)return false;}else{var u=(min-a[axis])/delta,v=(max-a[axis])/delta;if(u>v){var swap=u;u=v;v=swap;}low=Math.max(low,u);high=Math.min(high,v);if(low>high)return false;}}
  return true;
 }
 var fidelis={throwRelease:.12,throwDuration:.36,muzzle:{x:38,z:50},spinStart:.26,spinEnd:1.8,spinTravel:100,
  advanceAt:function(t){var u=Math.max(0,Math.min(1,(t-this.spinStart)/(this.spinEnd-this.spinStart)));return this.spinTravel*u*u*(3-2*u);},
  volume:function(kind){return kind==='strike'?{a:[10,42],b:[57,12],radius:10,depth:18,front:true}:kind==='final'?{a:[8,44],b:[62,10],radius:12,depth:20,front:true}:{a:[-48,34],b:[48,34],radius:12,depth:23,front:false};},
  projectileContact:function(shot,target,fromX){var half=(target.w||24)/2;return Math.abs(target.y-shot.y)<=16&&shot.z+8>=(target.z||0)&&shot.z-8<=(target.z||0)+(target.h||70)&&Math.min(fromX,shot.x)-8<=target.x+half&&Math.max(fromX,shot.x)+8>=target.x-half;},
  contact:function(p,target,kind){
   var box=this.volume(kind),dx=(target.x-p.x)*(p.facing||1),dy=Math.abs(target.y-p.y);
   if(dy>box.depth || box.front&&dx<0)return false;
   var half=(target.w||24)/2,z=(target.z||0)-(p.z||0),height=target.h||70;
   var x0=dx-half,x1=dx+half,z0=z,z1=z+height;
   if(segmentBox(box.a,box.b,x0,x1,z0,z1))return true;
   var distance=Math.min(pointSegmentSq(x0,z0,box.a,box.b),pointSegmentSq(x0,z1,box.a,box.b),pointSegmentSq(x1,z0,box.a,box.b),pointSegmentSq(x1,z1,box.a,box.b));
   [box.a,box.b].forEach(function(point){var x=Math.max(x0,Math.min(x1,point[0])),h=Math.max(z0,Math.min(z1,point[1]));distance=Math.min(distance,Math.pow(x-point[0],2)+Math.pow(h-point[1],2));});
   return distance<=box.radius*box.radius*(1-dy*dy/(box.depth*box.depth));
  }
 };
 function profile(who,vs){var p=primary[who],s=secondary[who];if(!p||!s)return null;var threat=(p[2]*.4/p[0])*.7+(s[1]*.4/s[0])*.3,attack=Math.max(1,Math.min(who==='lutador'?4:5,Math.round(1+threat*.7)));return {attack:attack,mobility:who==='rafinha'?5:who==='ricardo'?4:3,defense:who==='duda'||who==='nutri'||who==='cardoso'?5:who==='lutador'||who==='bispo'||who==='arthur'?4:3,primaryCooldown:p[vs?0:1],secondaryCooldown:s[0],primaryDamage:p[vs?2:3]*(vs?.4:1),speed:who==='lutador'?92:who==='emanuelly'?97:100};}
 var api={specialDamageLimit:24,primary:primary,secondary:secondary,levels:levels,profile:profile,primaryCooldown:function(who,vs){return (primary[who]||primary.nutri)[vs?0:1];},secondaryCooldown:function(who,vs){if(who==='bispo'&&!vs)return 1.5;if(who==='arthur'&&!vs)return 9;return (secondary[who]||secondary.nutri)[0];},primaryRange:function(who){return (primary[who]||primary.nutri)[4];}};
 api.fidelis=fidelis;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CreiaCombat=api;
}(typeof window!=='undefined'?window:globalThis));
