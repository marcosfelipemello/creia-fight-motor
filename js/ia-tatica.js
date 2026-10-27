/* Decisões locais por situação. Jev pode orientar a tática; nunca altera dano ou recarga. */
(function(root){
 'use strict';
 function decide(o,m,level,rng){
  var C=root.CreiaCombat||(typeof require==='function'?require('./combate-config.js'):null);
  var isNum=typeof level==='number';
  var numLevel=isNum?level:(typeof level==='string'&&level.trim()!==''&&!isNaN(Number(level))&&!C.levels[level]?Number(level):null);
  var isHard=level==='dificil'||(numLevel!=null&&numLevel>=0.9);
  var isEasy=level==='facil'||(numLevel!=null&&numLevel<0.5);
  var isMed=level==='medio'||(numLevel!=null&&!isEasy&&!isHard);
  var cfg=(numLevel!=null&&C.levelAt)?C.levelAt(numLevel):(C.levels[level]||C.levels.medio);
  var now=o.time,c={x:0,y:0,atk:false,alt:false,spc:false,jump:false,use:false,face:o.direction};rng=rng||Math.random;
  if(!m.initialized){m.initialized=true;m.lastAttack=-10;m.lastSpecial=-10;m.lastGuard=-10;m.burst=0;m.spacing=(rng()*2-1)*cfg.spacingError;}
  if(o.threat){if(m.threatAt==null){m.threatAt=now;m.guardRoll=rng();m.perfectRoll=null;}}else m.threatAt=null;
  if(o.foeGuard){if(m.foeGuardAt==null)m.foeGuardAt=now;}else m.foeGuardAt=null;
  var pressureGuard=o.foeGuard&&now-m.foeGuardAt>(isEasy?1.8:isMed?1.1:.6);
  if(o.counterReady)m.guardUntil=0;
  if(now<(m.guardUntil||0)){c.use=true;return c;}
  var reacted=m.threatAt!=null&&now-m.threatAt>=cfg.reaction;
  if(reacted&&o.canGuard&&m.guardRoll<cfg.guardChance&&now-m.lastGuard>1.2){
   if(isHard&&o.perfectReady!==false&&o.perfectThreat!==false&&m.perfectRoll==null)m.perfectRoll=rng();
   var perfect=isHard&&o.perfectReady!==false&&o.perfectThreat!==false&&m.perfectRoll<.2;
   if(perfect&&Number.isFinite(o.impactIn)&&o.impactIn>.09)return c;
   m.perfectAttempt=!!perfect;m.perfectRoll=null;m.guardUntil=now+cfg.guardHold;m.lastGuard=now;c.use=true;return c;
  }
  var close=o.distance<=52,aligned=o.aligned,heal=o.support&&o.hp<.5;
  if(o.sp>=100&&now-m.lastSpecial>2&&now>=(m.nextSpecialCheck||0)&&((o.healSpecial&&o.hp<.55)||(!o.healSpecial&&!o.foeGuard&&!o.foeInv&&(o.foeRecovering||close||o.intent==='special')))){m.nextSpecialCheck=now+(isEasy?2:isMed?1:.4);if(rng()<cfg.specialChance){c.spc=true;m.lastSpecial=now;return c;}}
  if(now<(m.crossUntil||0)){c.x=m.crossDirection;return c;}
  if(o.foeProtected){
   c.x=-o.direction;
   if(o.cornered&&o.canJump&&o.distance<85&&!isEasy){c.x=o.direction;c.jump=true;m.crossDirection=o.direction;m.crossUntil=now+.85;}
   return c;
  }
  if(o.mobilitySecondary&&o.altReady&&o.distance>150&&o.distance<280&&now-m.lastAttack>cfg.attackGap){c.alt=true;m.lastAttack=now;return c;}
  if(heal&&o.altReady&&now-m.lastAttack>cfg.attackGap){c.alt=true;m.lastAttack=now;return c;}
  if(o.intent==='defend'&&o.threat&&reacted&&o.canGuard&&m.guardRoll<cfg.guardChance&&now-m.lastGuard>1.2){m.perfectAttempt=false;m.guardUntil=now+cfg.guardHold;m.lastGuard=now;c.use=true;return c;}
  if(o.intent==='bait'&&!o.foeRecovering){c.x=o.distance<160?-o.direction:0;return c;}
  if(o.foeGuard&&close&&!pressureGuard){c.x=-o.direction;return c;}
  if(o.threat&&isHard&&!o.canGuard&&o.distance>55)c.jump=true;
  if(now<(m.resetUntil||0)){c.x=o.hp<.4?-o.direction:o.direction;return c;}
  var desired=o.melee?30:o.range<=155?65:110,goal=desired+m.spacing;
  var closeForSecondary=o.altReady&&o.secondaryMelee&&o.altRange>0&&m.burst>0&&!o.melee&&o.distance<90;
  if(closeForSecondary)goal=Math.max(12,Math.min(28,o.altRange-12));
  if(o.intent==='approach'||o.intent==='pressure')goal=Math.min(goal,45);
  if(o.intent==='recover'&&o.hp<.4)goal+=55;
  c.x=o.distance>goal+12?o.direction:o.distance<goal-18?-o.direction:0;
  if(!o.horizontal&&!aligned)c.y=o.yDirection;
  if(!aligned||o.foeGuard&&!pressureGuard||o.foeInv||now-m.lastAttack<cfg.attackGap)return c;
  var secondaryOk=o.altReady&&o.altRange>0&&o.distance<=o.altRange&&(o.secondaryMelee?close:o.distance>45);
  if(secondaryOk&&(m.burst>0||o.intent==='counter'||o.melee&&!close)&&rng()<(isEasy?.3:.65)){c.alt=true;m.lastAttack=now;m.burst=0;return c;}
  if(!closeForSecondary&&o.primaryReady&&o.distance<=(o.melee?50:o.range)&&(!o.melee||close)){
   if(isEasy&&rng()<.28){m.lastAttack=now;return c;}
   c.atk=true;m.lastAttack=now;m.burst++;if(!o.melee&&m.burst>=2){m.resetUntil=now+(isEasy?1:.45);m.burst=0;}
  }
  return c;
 }
 function bossAttack(b,G,list,rng){rng=rng||Math.random;var p=G.nearestPlayer?G.nearestPlayer(b.x,b.y):null,dist=p?Math.abs(p.x-b.x):180;
  if(b.jevAttack&&list.indexOf(b.jevAttack)>=0&&b.jevUntil>Date.now()){var chosen=b.jevAttack;b.jevAttack=null;return chosen;}
  var close=['stomp','triple','peck','smoke'],far=['dash','fly','roll','skewers','boulder','flood'];
  var ranked=list.map(function(type){var score=(dist<110?close:far).indexOf(type)>=0?3:1;if(type===b.attack&&list.length>1)score-=3;if(type==='summon'&&b.hp/b.maxHp<.5)score+=2;return {type:type,score:score+rng()*.8};});ranked.sort(function(a,b){return b.score-a.score;});return ranked[0].type;
 }
 var api={decide:decide,bossAttack:bossAttack};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CreiaBrains=api;
}(typeof window!=='undefined'?window:globalThis));
