/* Composições alternadas por encontro; não mudam HP nem dano dos inimigos. */
(function(root){
  'use strict';
  var patterns=[{name:'Pressão alternada',gap:.85,cap:0},{name:'Cerco pelas laterais',gap:.7,cap:0},{name:'Fôlego e contra-ataque',gap:1.15,cap:-1},{name:'Linha de resistência',gap:.9,cap:0}];
  root.CreiaEncounters={plan:function(stage,index,kinds,count,rng){
    rng=rng||Math.random;var p=patterns[(stage+index-1)%patterns.length],pool=[];
    // Alternar os tipos impede uma onda inteira do mesmo inimigo por azar.
    var offset=Math.floor(rng()*kinds.length);
    for(var i=0;i<count;i++)pool.push(kinds[(offset+i)%kinds.length]);
    if(stage>=4&&index%3===1&&kinds.indexOf('batata')<0)pool[Math.floor(pool.length/2)]='batata';
    if(stage>=7&&index%3===2&&kinds.indexOf('gordura')<0)pool[Math.floor(pool.length/2)]='gordura';
    return {name:p.name,gap:p.gap,cap:p.cap,pool:pool,side:index%2?-1:1};
  }};
}(typeof window!=='undefined'?window:globalThis));
