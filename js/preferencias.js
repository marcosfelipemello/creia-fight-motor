/* Preferências locais: valores limitados e compatíveis com saves anteriores. */
(function(root){
  'use strict';
  var key='creia-preferences-v1',version=0,persisted=true;
  var defaults={music:.2,effects:1,voices:1},value={audio:{},touch:{landscape:{},portrait:{}}};
  var defaultKeys=[{up:['KeyW'],down:['KeyS'],left:['KeyA'],right:['KeyD'],atk:['KeyJ'],jump:['KeyK'],spc:['KeyL'],alt:['KeyI','KeyU'],use:['KeyE'],taunt:['KeyO']},
    {up:['ArrowUp'],down:['ArrowDown'],left:['ArrowLeft'],right:['ArrowRight'],atk:['Numpad1','Comma'],jump:['Numpad2','Period'],spc:['Numpad3','Slash'],alt:['Numpad4','Semicolon'],use:['Numpad0','Quote'],taunt:['Numpad5','BracketLeft']}];
  function validKey(code){return typeof code==='string'&&/^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|Arrow(Up|Down|Left|Right)|Comma|Period|Slash|Semicolon|Quote|BracketLeft|BracketRight|Backslash|Minus|Equal|Backquote)$/.test(code)&&code!=='KeyP'&&code!=='KeyM';}
  function bindings(custom){return defaultKeys.map(function(player,i){var out={};Object.keys(player).forEach(function(action){out[action]=custom[i]&&custom[i][action]?[custom[i][action]]:player[action].slice();});return out;});}
  function uniqueKeys(custom){var seen=new Set();return bindings(custom).every(function(player){return Object.keys(player).every(function(action){return player[action].every(function(code){if(seen.has(code))return false;seen.add(code);return true;});});});}
  function clamp(n,a,b,fallback){return typeof n==='number'&&isFinite(n)?Math.max(a,Math.min(b,n)):fallback;}
  function clean(raw){
    raw=raw&&typeof raw==='object'?raw:{};var out={audio:{},touch:{landscape:{},portrait:{}},keyboard:[{},{}]};
    defaultKeys.forEach(function(player,i){Object.keys(player).forEach(function(action){var code=raw.keyboard&&raw.keyboard[i]&&raw.keyboard[i][action];if(validKey(code))out.keyboard[i][action]=code;});});
    // Save antigo pode já usar O, Num 5 ou [. Preserva as ações existentes.
    var used=new Set();bindings(out.keyboard).forEach(function(player){Object.keys(player).forEach(function(action){if(action!=='taunt')player[action].forEach(function(code){used.add(code);});});});
    out.keyboard.forEach(function(player){if(player.taunt)used.add(player.taunt);});
    out.keyboard.forEach(function(player,i){
      if(player.taunt)return;
      var candidates=defaultKeys[i].taunt;
      if(candidates.some(function(code){return used.has(code);})){
        var spare=candidates.concat('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(function(c){return 'Key'+c;}));
        player.taunt=spare.find(function(code){return validKey(code)&&!used.has(code);});
      }
      (player.taunt?[player.taunt]:candidates).forEach(function(code){used.add(code);});
    });
    if(!uniqueKeys(out.keyboard))out.keyboard=[{},{}];
    Object.keys(defaults).forEach(function(k){out.audio[k]=clamp(raw.audio&&raw.audio[k],0,1,defaults[k]);});
    ['landscape','portrait'].forEach(function(layout){
      var src=raw.touch&&raw.touch[layout]||{};
      ['KeyJ','KeyK','KeyL','KeyI','KeyE','KeyO','JOY'].forEach(function(k){var c=src[k];if(!c)return;
        out.touch[layout][k]={x:clamp(c.x,0,1,.5),y:clamp(c.y,0,1,.5),size:clamp(c.size,k==='JOY'?96:44,k==='JOY'?160:96,k==='JOY'?120:64),opacity:clamp(c.opacity,.25,1,.75)};
      });
    });return out;
  }
  try{var stored=root.localStorage.getItem(key);value=clean(JSON.parse(stored));if(!stored){var legacy=JSON.parse(root.localStorage.getItem('bangu-save'))||{};if(legacy.music===false)value.audio.music=0;if(legacy.sfx===false){value.audio.effects=0;value.audio.voices=0;}}}catch(_){value=clean({});}
  function commit(){version++;try{root.localStorage.setItem(key,JSON.stringify(value));persisted=true;}catch(_){persisted=false;}return persisted;}
  root.CreiaPreferences={
    get:function(){return JSON.parse(JSON.stringify(value));},
    audio:function(k){return value.audio[k];},
    setAudio:function(k,n){if(!(k in defaults))return false;value.audio[k]=clamp(n,0,1,defaults[k]);return commit();},
    control:function(layout,k){var c=value.touch[layout]&&value.touch[layout][k];return c?Object.assign({},c):null;},
    setControl:function(layout,k,c){if(!value.touch[layout]||['KeyJ','KeyK','KeyL','KeyI','KeyE','KeyO','JOY'].indexOf(k)<0)return false;var raw=this.get();raw.touch[layout][k]=c;value=clean(raw);return commit();},
    resetControls:function(layout){if(!value.touch[layout])return false;value.touch[layout]={};return commit();},
    bindings:function(){return bindings(value.keyboard);},
    setBinding:function(slot,action,code){
      if(!defaultKeys[slot]||!Object.prototype.hasOwnProperty.call(defaultKeys[slot],action)||!validKey(code))return {ok:false,message:'Tecla reservada ou não suportada. Escolha outra.'};
      var next=this.get().keyboard;next[slot][action]=code;
      if(!uniqueKeys(next))return {ok:false,message:'Essa tecla já está em uso. Escolha outra.'};
      value.keyboard=next;commit();return {ok:true};
    },
    resetBindings:function(){value.keyboard=[{},{}];return commit();},
    get version(){return version;},get persisted(){return persisted;}
  };
}(typeof window!=='undefined'?window:globalThis));
