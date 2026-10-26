/* Jev orienta táticas em segundo plano. Falha ou atraso mantém a IA local. */
(function(){
 'use strict';
 var enabled=null,busy=false,next=0,latest=null;
 function update(state){
  latest=state;
  var now=Date.now();if(state.guest||busy||now<next||typeof fetch!=='function'||typeof AbortSignal==='undefined'||typeof AbortSignal.timeout!=='function')return;
  next=now+10000;
  if(enabled===false)return;
  if(enabled===null){busy=true;fetch('/api/ai/status',{signal:AbortSignal.timeout(2000)}).then(function(r){return r.ok?r.json():{};}).then(function(s){enabled=s.enabled===true;if(enabled)next=0;}).catch(function(){next=Date.now()+30000;}).finally(function(){busy=false;});return;}
  var refs=[],actors=[];
  function add(p,boss){
   var foes=state.versus?state.players.filter(function(q){return q!==p&&!q.dead;}):boss?state.players.filter(function(q){return !q.dead;}):(state.enemies||[]).filter(function(q){return !q.dying&&q.hp>0;}).concat(state.bosses.filter(function(q){return !q.dead&&q.hp>0;}));
   var target=foes.sort(function(a,b){return Math.abs(a.x-p.x)-Math.abs(b.x-p.x);})[0];if(!target)return;
   refs.push(p);actors.push({kind:boss?'boss':'fighter',character:p.who,difficulty:p.aiLevel||'medio',health:p.hp/p.maxHp,opponentHealth:target.hp/target.maxHp,distance:Math.abs(target.x-p.x),specialReady:p.sp>=100,opponentGuarding:target.state==='guard',primaryReady:p.cd<=0,secondaryReady:p.altCd<=0,guardReady:state.versus&&p.guardCd<=0&&p.guardHp>0,guardEnergy:(p.guardHp||0)/100,attacks:boss?state.attacks(p):undefined});
  }
  state.players.filter(function(p){return p.ai&&!p.dead;}).forEach(function(p){add(p,false);});
  if(state.attacks)state.bosses.filter(function(b){return !b.dead&&b.hp>0&&!b.vs;}).slice(0,3).forEach(function(b){add(b,true);});
  if(!actors.length)return;
  busy=true;var started=now,epoch=state.players;
  fetch('/api/ai/tactics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:state.versus?'x1':'adventure',actors:actors.slice(0,6)}),signal:AbortSignal.timeout(2000)}).then(function(r){return r.ok?r.json():null;}).then(function(result){
   if(!result||!latest||latest.guest||latest.players!==epoch||Date.now()-started>2200||Math.abs(latest.time-state.time)>2.2)return;
   refs.slice(0,6).forEach(function(p,i){if(p.dead||p.hp<=0)return;var choice=result.choices&&result.choices['actor'+i];if(actors[i].kind==='boss'){if(actors[i].attacks.indexOf(choice)>=0){p.jevAttack=choice;p.jevUntil=Date.now()+3000;}}else if(['approach','pressure','defend','counter','recover','special','bait'].indexOf(choice)>=0){p.jevIntent=choice;p.jevUntil=latest.time+3;}});
  }).catch(function(){}).finally(function(){busy=false;});
 }
 window.CreiaJev={update:update};
}());
