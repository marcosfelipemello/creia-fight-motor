/* Faixas locais sincronizadas ao relógio da cena (inclusive pausa e convidado online). */
(function(root){
  'use strict';
  if(typeof root.Audio!=='function'){root.FidelisAudio={sync:function(){},stop:function(){}};return;}
  var previous=null;
  var tracks=[
    {audio:new Audio('assets/fidelis-v1/grito.mp3'),offset:.72,bus:'voices',attempted:false},
    {audio:new Audio('assets/fidelis-v1/efeitos.mp3'),offset:0,bus:'effects',attempted:false}
  ];
  tracks.forEach(function(track){track.audio.preload='auto';});
  function stop(){tracks.forEach(function(track){track.audio.pause();track.attempted=false;});previous=null;}
  function sync(t,enabled){
    if(t==null){stop();return;}
    if(previous!=null && t<previous-.2)stop();
    tracks.forEach(function(track){
      var a=track.audio,target=t-track.offset;
      a.volume=root.CreiaPreferences?root.CreiaPreferences.audio(track.bus):1;
      var valid=enabled&&!document.hidden&&target>=0&&target<(isFinite(a.duration)?a.duration:3);
      if(!valid){a.pause();track.attempted=false;return;}
      if(a.readyState<1)return;
      if(Math.abs(a.currentTime-target)>.18)a.currentTime=target;
      if(a.paused&&!track.attempted){
        track.attempted=true;var p=a.play();if(p&&p.catch)p.catch(function(){/* Texto e cena continuam se o navegador recusar áudio. */});
      }
    });
    previous=t;
  }
  if(root.document&&document.addEventListener)document.addEventListener('visibilitychange',function(){if(document.hidden)stop();});
  root.FidelisAudio={sync:sync,stop:stop};
}(window));
