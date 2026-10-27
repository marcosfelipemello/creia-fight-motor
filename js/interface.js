/* Interface moderna. O motor continua sendo a autoridade da seleção e das recargas. */
(function(){
  'use strict';
  if(!document.querySelector)return;
  var root=document.createElement('section');root.id='creia-ui';root.hidden=true;
  root.setAttribute('aria-label','Menu e seleção de Creia Fight');document.body.appendChild(root);
  var hud=document.createElement('aside');hud.id='creia-recargas';hud.hidden=true;hud.setAttribute('aria-label','Recarga das habilidades');document.body.appendChild(hud);
  var style=document.createElement('style');style.textContent=`@font-face{font-family:CreiaDisplay;src:url('assets/fonts/Oswald.woff2') format('woff2');font-display:swap;font-weight:200 700}
@font-face{font-family:CreiaSans;src:url('assets/fonts/Karla.woff2') format('woff2');font-display:swap;font-weight:200 800}
#creia-ui{--paper:#ffffff;--muted:#c9c4d6;--accent:#e8323c;--gold:#ffd34d;--ground:#0b0a10;--line:#493346;--cursor-color:#ff3b3b;position:fixed;inset:0;z-index:7;overflow:hidden;background:radial-gradient(ellipse at 50% 100%,#360e19,transparent 75%),var(--ground);color:var(--paper);font:16px/1.25 CreiaSans,sans-serif;touch-action:manipulation;color-scheme:dark}
#creia-ui[hidden],#creia-recargas[hidden],[hidden]{display:none!important}#creia-ui *{box-sizing:border-box}#creia-ui ::selection{background:var(--accent);color:#fff}#creia-ui button,#creia-ui select{font:inherit;touch-action:manipulation;cursor:pointer}#creia-ui button{color:#fff;background:#181521;border:1px solid var(--line);border-radius:7px;padding:8px 12px;min-height:42px}#creia-ui button:hover{background:#38202e;border-color:#e8323c}#creia-ui :focus-visible{outline:3px solid var(--gold);outline-offset:3px}#creia-ui button:disabled{opacity:.45;cursor:default}#creia-ui .primary{background:var(--accent);border-color:var(--accent);font-weight:700}#creia-ui .primary:hover{background:#ff4751}#creia-ui h1,#creia-ui h2{font-family:CreiaDisplay,sans-serif;line-height:1.05;margin:0;font-weight:700}#creia-ui h1{font-size:32px}#creia-ui h2{font-size:28px}#creia-ui p{margin:6px 0;color:var(--muted)}#creia-ui .hint{font-size:12px;color:var(--muted)}
#creia-ui .shell{position:absolute;left:50%;top:50%;width:960px;height:480px;padding:18px 24px;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:12px;transform:translate(-50%,-50%) scale(var(--ui-scale,1));transform-origin:center}#creia-ui header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:10px;border-bottom:2px solid var(--accent)}#creia-ui header button{min-height:38px}#creia-ui .select-main{display:grid;grid-template-columns:300px minmax(0,1fr);gap:28px;min-height:0}#creia-ui .fighter-profile{position:relative;min-height:0;display:grid;grid-template-columns:1fr 105px;grid-template-rows:34px 83px 28px auto auto;column-gap:8px;align-content:start}#creia-ui .fighter-title{grid-column:1/-1;color:var(--gold);font-size:27px;white-space:nowrap}#creia-ui .attributes{grid-column:1;display:grid;gap:6px;align-content:start;padding-top:5px}#creia-ui .attribute-label{display:flex;justify-content:space-between;gap:5px;font-size:12px;color:var(--muted)}#creia-ui meter{display:block;width:100%;height:4px;margin-top:3px;border:0;background:#352333}#creia-ui meter::-webkit-meter-bar{background:#352333;border:0;border-radius:0;height:4px}#creia-ui meter::-webkit-meter-optimum-value{background:var(--gold)}#creia-ui meter::-moz-meter-bar{background:var(--gold)}#creia-ui .fighter-stage{grid-column:2;grid-row:2/4;display:flex;align-items:end;justify-content:center;min-height:0;border-bottom:1px solid var(--line)}#creia-ui canvas{aspect-ratio:auto;image-rendering:pixelated;image-rendering:crisp-edges;display:block}#creia-ui .fighter-stage canvas{width:105px;height:110px}#creia-ui .attacks{grid-column:1;display:flex;gap:4px;align-items:center;flex-wrap:wrap;font-size:10px}#creia-ui .attacks span{padding:3px 4px;border:1px solid var(--line);border-radius:3px}#creia-ui .special-block{grid-column:1/-1;margin-top:10px;max-height:98px}#creia-ui .special-name{font-size:14px;color:var(--gold);font-weight:700}#creia-ui .special-desc{font-size:13px}#creia-ui .fighter-profile>.hint{grid-column:1/-1;margin-top:8px;font-size:11px}
#creia-ui .roster-area{min-width:0;display:flex;flex-direction:column;justify-content:center;gap:4px}#creia-ui .diamond{display:flex;flex-direction:column;gap:4px}#creia-ui .roster-row{display:flex;justify-content:center;gap:6px}#creia-ui button.fighter{position:relative;flex:0 0 74px;width:74px;height:60px;min-height:0;padding:3px 2px;background:#181521;border:1px solid #493346;border-radius:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}#creia-ui button.fighter canvas{width:32px;height:32px}#creia-ui .fighter-name{font-size:10px;line-height:1.05;max-width:100%;text-align:center;overflow-wrap:anywhere}#creia-ui button.fighter[data-picked=true]{border:2px solid var(--picked-color);background:#241c2a}#creia-ui button.fighter[data-cursor=true]{outline:3px solid var(--cursor-color);outline-offset:1px;background:#35212e}#creia-ui .pick-tag{font-size:10px;font-weight:700;color:var(--picked-color);background:#0b0a10;position:absolute;top:1px;right:2px;padding:0 2px;border-radius:2px}#creia-ui .team-line{display:flex;flex-wrap:wrap;gap:4px 12px;min-height:20px;margin-top:6px;font-size:11px;line-height:1.2}#creia-ui .notice{min-height:14px;margin:0;font-size:12px;color:var(--gold)}#creia-ui .roster-area>.hint{margin:0;font-size:11px}#creia-ui .selection-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--line);padding-top:10px}#creia-ui .selection-instructions{font-size:12px;color:var(--muted)}#creia-ui .actions{display:flex;gap:8px;flex-shrink:0}#creia-ui .sort-rest{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:5px 10px;white-space:nowrap}#creia-ui .sort-rest small{font-size:10px;line-height:1;color:var(--muted)}#creia-ui .sort-rest[hidden]{display:none}#creia-ui [data-go-cursor=true]{outline:3px solid #ff3b3b;outline-offset:3px}
#creia-ui .x1-layout{display:grid;grid-template-columns:1.4fr 1fr;gap:32px;align-content:center;min-height:0}#creia-ui .x1-layout h2{margin-bottom:12px;color:var(--gold)}#creia-ui .x1-layout .tour-title{margin-top:24px}#creia-ui .mode-options{display:flex;gap:6px}#creia-ui .mode-options button{padding:8px 10px;font-size:14px}#creia-ui .mode-options [aria-pressed=true]{background:var(--accent);color:#fff;border-color:var(--accent)}#creia-ui .difficulty{display:flex;gap:12px;margin:14px 0;min-height:0}#creia-ui .difficulty[hidden]{display:none}#creia-ui .difficulty label{flex:1;font-size:14px;color:var(--muted)}#creia-ui select{display:block;margin-top:5px;width:100%;padding:9px;border:1px solid var(--line);border-radius:6px;background:#181521;color:#fff}#creia-ui .online-options{display:grid;gap:8px;margin-top:12px}#creia-ui .x1-layout .hint{font-size:12px;margin-top:10px}#creia-ui button[data-selected=true]{outline:2px solid var(--gold);outline-offset:2px}
#creia-ui[data-layout=portrait] .shell{width:480px;height:780px;padding:16px;gap:12px;grid-template-rows:48px minmax(0,1fr) 64px}#creia-ui[data-layout=portrait] h1{font-size:31px}#creia-ui[data-layout=portrait] .select-main{display:grid;grid-template-columns:1fr;grid-template-rows:224px minmax(0,1fr);gap:12px}#creia-ui[data-layout=portrait] .fighter-profile{grid-template-columns:1fr 145px;grid-template-rows:36px 86px 30px auto auto;column-gap:14px}#creia-ui[data-layout=portrait] .fighter-title{font-size:32px}#creia-ui[data-layout=portrait] .attribute-label{font-size:15px}#creia-ui[data-layout=portrait] .fighter-stage{grid-row:1/4}#creia-ui[data-layout=portrait] .fighter-stage canvas{width:140px;height:144px}#creia-ui[data-layout=portrait] .attacks{font-size:12px}#creia-ui[data-layout=portrait] .special-block{margin-top:8px}#creia-ui[data-layout=portrait] .special-name{font-size:15px}#creia-ui[data-layout=portrait] .special-desc{font-size:14px}#creia-ui[data-layout=portrait] .fighter-profile>.hint{display:none}#creia-ui[data-layout=portrait] .roster-area{gap:6px;justify-content:center}#creia-ui[data-layout=portrait] .diamond{gap:7px}#creia-ui[data-layout=portrait] .roster-row{gap:5px}#creia-ui[data-layout=portrait] button.fighter{width:65px;flex-basis:65px;height:68px}#creia-ui[data-layout=portrait] button.fighter canvas{width:37px;height:37px}#creia-ui[data-layout=portrait] .fighter-name{font-size:11px}#creia-ui[data-layout=portrait] .team-line{font-size:13px}#creia-ui[data-layout=portrait] .selection-instructions{font-size:13px;max-width:200px}#creia-ui[data-layout=portrait] .actions button{font-size:17px;min-height:48px}#creia-ui[data-layout=portrait] .x1-layout{grid-template-columns:1fr;gap:28px;align-content:center}#creia-ui[data-layout=portrait] .mode-options button{font-size:16px}#creia-ui[data-layout=portrait] .x1-layout h2{font-size:30px}#creia-ui[data-layout=portrait] .x1-layout .hint{font-size:14px}

#creia-ui[data-device=desktop] .x1-layout{width:800px;max-width:100%;margin:auto;gap:28px}#creia-ui[data-device=desktop] .x1-layout h2{font-size:27px}
#creia-ui[data-layout=portrait] .select-main{grid-template-rows:260px minmax(0,1fr)}#creia-ui[data-layout=portrait] .fighter-profile{grid-template-columns:1fr 180px;grid-template-rows:36px 112px 34px auto auto;column-gap:10px}#creia-ui[data-layout=portrait] .fighter-stage canvas{width:180px;height:184px}#creia-ui[data-layout=portrait] .roster-area{transform:translateX(6px)}#creia-ui[data-layout=portrait] button.fighter{height:60px}#creia-ui[data-layout=portrait] button.fighter canvas{width:32px;height:32px}#creia-ui[data-layout=portrait] .diamond{gap:5px}#creia-ui[data-layout=portrait] .roster-area>.hint{display:none}

.tc[data-wait=true]{box-shadow:inset 0 0 0 100px rgba(0,0,0,.55)}.creia-cd-badge{position:absolute;top:-5px;right:-4px;min-width:24px;padding:3px;background:#0b0a10;color:#ffd34d;border:1px solid #e8323c;border-radius:6px;font:700 13px sans-serif;font-variant-numeric:tabular-nums;pointer-events:none}@media(prefers-reduced-motion:reduce){#creia-ui *{animation:none!important;transition:none!important}}
`;
  // Um único eixo alinha nome, arte e informações; a faixa esquerda fica livre para o analógico.
  style.textContent+=`
#creia-ui .notice:empty,#creia-ui .team-line:empty{display:none}
#creia-ui[data-device=mobile][data-screen=select] .shell{grid-template-rows:minmax(0,1fr) auto;gap:12px;padding-top:16px}
#creia-ui[data-device=mobile][data-screen=select] header{position:absolute;top:16px;left:24px;right:auto;z-index:1;border:0;padding:0}
#creia-ui[data-device=mobile][data-screen=select] header button{min-height:40px;padding:8px 12px;font-size:14px}
#creia-ui[data-device=mobile][data-screen=select] .selection-instructions,#creia-ui[data-device=mobile][data-screen=select] .roster-area>.hint,#creia-ui[data-device=mobile][data-screen=select] .fighter-profile>.hint{display:none}
#creia-ui[data-device=mobile][data-screen=select] .actions{width:100%;justify-content:flex-end;gap:12px}
#creia-ui[data-device=mobile][data-screen=select] .fighter-profile{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto 120px auto auto auto;align-content:start;row-gap:12px;padding:0 8px 0 112px;min-width:0}
#creia-ui[data-device=mobile][data-screen=select] .fighter-profile>*{grid-column:1;margin-left:0;margin-right:0;min-width:0}
#creia-ui[data-device=mobile][data-screen=select] .fighter-title{grid-row:1;padding:0;text-align:center;white-space:normal;font-size:26px;line-height:1.15;text-wrap:balance}
#creia-ui[data-device=mobile][data-screen=select] .fighter-stage{grid-row:2;justify-content:center;align-items:center;border:0;padding:0}
#creia-ui[data-device=mobile][data-screen=select] .fighter-stage canvas{width:126px;height:120px}
#creia-ui[data-device=mobile][data-screen=select] .attributes{grid-row:3;padding:0;gap:8px}
#creia-ui[data-device=mobile][data-screen=select] .attribute-label{font-size:12px;line-height:1.2;gap:8px}
#creia-ui[data-device=mobile][data-screen=select] .attribute-value{flex-shrink:0}
#creia-ui[data-device=mobile][data-screen=select] .attacks{grid-row:4;justify-content:center;align-content:start;gap:6px;font-size:10px;line-height:1.2}
#creia-ui[data-device=mobile][data-screen=select] .attacks span{padding:4px 6px}
#creia-ui[data-device=mobile][data-screen=select] .special-block{grid-row:5;margin-top:0;max-height:none;text-align:center}
#creia-ui[data-device=mobile][data-screen=select] .special-name{font-size:13px;line-height:1.2}
#creia-ui[data-device=mobile][data-screen=select] .special-desc{font-size:12px;line-height:1.35;margin:6px 0 0;text-wrap:pretty}
#creia-ui[data-device=mobile][data-screen=select] .selection-footer{padding-top:8px}
#creia-ui[data-device=mobile][data-layout=landscape][data-screen=select] .select-main{grid-template-columns:380px minmax(0,1fr);gap:20px}
#creia-ui[data-device=mobile][data-layout=landscape][data-screen=select] .roster-area{transform:none}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] .shell{grid-template-rows:minmax(0,1fr) 56px}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] .select-main{grid-template-rows:352px minmax(0,1fr);gap:12px}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] .fighter-profile{padding:0 20px 0 112px;grid-template-rows:auto 120px auto auto auto;row-gap:10px}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] .fighter-stage canvas{width:126px;height:120px}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] .roster-area{transform:none;justify-content:flex-start}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] .team-line{padding-left:190px}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] .actions{gap:8px}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] .actions button{font-size:14px;padding:8px 10px;min-height:44px}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] button.fighter{height:54px}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] button.fighter canvas{width:26px;height:26px}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] .fighter-name{font-size:10px}
@media(max-height:640px) and (max-aspect-ratio:19/20){
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] .select-main{grid-template-rows:336px minmax(0,1fr)}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] .fighter-profile{grid-template-rows:auto 112px auto auto auto;row-gap:8px}
#creia-ui[data-device=mobile][data-layout=portrait][data-screen=select] .fighter-stage canvas{width:118px;height:112px}
}
/* Mesma posição e tamanho de repouso da gameplay, incluindo safe areas. */
.creia-character-select #creia-direction-zone{z-index:8!important;left:var(--creia-joy-left,calc(24px + env(safe-area-inset-left,0px)))!important;top:var(--creia-joy-top,auto)!important;bottom:var(--creia-joy-bottom,calc(24px + env(safe-area-inset-bottom,0px)))!important;width:var(--creia-joy-size,120px)!important;height:var(--creia-joy-size,120px)!important}
.creia-character-select #creia-direction-base{z-index:8!important;left:var(--creia-joy-left,calc(24px + env(safe-area-inset-left,0px)))!important;top:var(--creia-joy-top,auto)!important;bottom:var(--creia-joy-bottom,calc(24px + env(safe-area-inset-bottom,0px)))!important;width:var(--creia-joy-size,120px)!important;height:var(--creia-joy-size,120px)!important}
.creia-combat-screen #fsbtn,.creia-combat-screen .tc[data-creia-action="KeyP"]{top:var(--creia-combat-tools-top)!important}
.creia-combat-screen #instbtn{display:none}
.creia-cinematic .tc,.creia-cinematic #creia-direction-zone,.creia-cinematic #fsbtn,.creia-cinematic #instbtn,.creia-cinematic #creia-recargas,.creia-cinematic .creia-net{display:none!important}
`;
  // Tela do X1: cartões lado a lado (passa para o lado no dedo, nas setas ou no controle)
  style.textContent+=`
#creia-ui .x1-carrossel{position:relative;min-height:0;display:grid;grid-template-rows:minmax(0,1fr) auto;gap:8px}
#creia-ui .x1-trilho{display:flex;gap:18px;min-height:0;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;padding:4px calc(50% - 180px);scrollbar-width:none;overscroll-behavior-x:contain}
#creia-ui .x1-trilho::-webkit-scrollbar{display:none}
#creia-ui .x1-card{flex:0 0 360px;min-height:0;scroll-snap-align:center;display:flex;flex-direction:column;background:#181521;border:1px solid var(--line);border-radius:10px;overflow:hidden;opacity:.5;transform:scale(.9);transition:transform .25s,opacity .25s,border-color .25s,box-shadow .25s;cursor:pointer}
#creia-ui .x1-card[data-ativo=true]{opacity:1;transform:none;border-color:var(--gold);box-shadow:0 0 0 1px var(--gold),0 8px 28px rgba(232,50,60,.3);cursor:default}
#creia-ui .x1-arte{position:relative;flex:1 1 0;min-height:120px;border-bottom:2px solid var(--accent);background:#0b0a10}
#creia-ui .x1-arte canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 85%}
#creia-ui .x1-info{flex:0 0 auto;padding:7px 14px 10px;display:flex;flex-direction:column;gap:5px}
#creia-ui .x1-info h2{font-size:26px;color:var(--gold);letter-spacing:.5px}
#creia-ui .x1-info p{margin:0;font-size:13px}
#creia-ui .x1-info .primary{min-height:36px}
#creia-ui .x1-opcoes{display:flex;flex-wrap:wrap;align-items:center;gap:5px;min-height:28px}
#creia-ui .x1-opcoes span{font-size:12px;color:var(--muted);margin-right:2px}
#creia-ui .x1-opcoes button{min-height:28px;padding:2px 10px;font-size:13px}
#creia-ui .x1-opcoes [aria-pressed=true]{background:var(--accent);border-color:var(--accent);font-weight:700}
#creia-ui .x1-card[data-ativo=false] .x1-info button{pointer-events:none}
#creia-ui .x1-card[data-card="3"] .x1-opcoes button{flex:1;min-height:40px;font-size:14px}
#creia-ui .x1-seta{position:absolute;top:calc(50% - 46px);z-index:2;width:42px;min-height:0;height:62px;padding:0;font:700 28px/1 CreiaDisplay,sans-serif;background:rgba(24,21,33,.88)}
#creia-ui .x1-seta.esq{left:0}#creia-ui .x1-seta.dir{right:0}
#creia-ui .x1-pontos{display:flex;justify-content:center;align-items:center;gap:10px;min-height:14px}
#creia-ui .x1-pontos span{width:8px;height:8px;background:var(--line);transform:rotate(45deg);transition:background .2s,transform .2s}
#creia-ui .x1-pontos span[data-ativo=true]{background:var(--gold);transform:rotate(45deg) scale(1.35)}
#creia-ui .x1-rodape{display:flex;justify-content:space-between;gap:12px;border-top:1px solid var(--line);padding-top:8px}
#creia-ui .x1-rodape p{margin:0}
#creia-ui[data-layout=portrait] .x1-trilho{padding:4px calc(50% - 190px)}
#creia-ui[data-layout=portrait] .x1-card{flex-basis:380px}
#creia-ui[data-layout=portrait] .x1-arte{min-height:200px}
#creia-ui[data-layout=portrait] .x1-seta{top:calc(40% - 31px)}
`;
  style.textContent+=`
/* Coop: a arte divide o cartão com as opções; o selo ocupa espaço no rodapé. */
#creia-ui .coop-main{min-width:0;min-height:0;display:grid}
#creia-ui .coop-card{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,3fr);width:100%;height:100%;margin:0;transform:none;opacity:1}
#creia-ui .coop-card .x1-arte{min-height:0;border-bottom:0;border-right:2px solid var(--accent)}
#creia-ui .coop-card .x1-arte canvas{object-fit:contain;object-position:center}
#creia-ui .coop-card .x1-info{min-width:0;min-height:0;padding:12px 16px;gap:8px;justify-content:center}
#creia-ui .coop-choice{flex-wrap:nowrap;min-width:0;border-radius:6px}
#creia-ui .coop-choice>span{flex:0 0 70px}
#creia-ui .coop-choice button{min-height:40px;padding:4px 8px}
#creia-ui .coop-ally-pick{flex:1;min-width:0;overflow-wrap:anywhere}
#creia-ui .coop-ally button:not(.coop-ally-pick){flex:0 0 40px;font:700 24px/1 CreiaDisplay,sans-serif}
#creia-ui .coop-card [data-cursor=true]{outline:2px solid var(--gold);outline-offset:2px}
#creia-ui .coop-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:32px}
#creia-ui .coop-footer p{margin:0;max-width:510px}
#creia-ui .coop-network{flex-shrink:0;min-height:30px;max-width:270px}
.creia-coop-screen .creia-net{position:relative;left:auto;bottom:auto;transform:none;z-index:auto;max-width:100%;margin:0;padding:4px 10px}
#creia-ui .coop-network .creia-net button{min-height:0;padding:0;border:0;background:none;font:inherit}
#creia-ui .coop-network .creia-net p{font-size:12px;line-height:1.25;margin:6px 0}
#creia-ui[data-layout=portrait][data-screen=coopSetup] .shell{grid-template-rows:auto minmax(0,1fr) auto}
#creia-ui[data-layout=portrait] .coop-card{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(130px,1fr) auto;flex-basis:auto}
#creia-ui[data-layout=portrait] .coop-card .x1-arte{min-height:0;border-right:0;border-bottom:2px solid var(--accent)}
#creia-ui[data-layout=portrait] .coop-card .x1-info{padding:14px 16px;gap:10px}
#creia-ui[data-layout=portrait] .coop-footer{flex-direction:column;align-items:stretch;gap:8px}
#creia-ui[data-layout=portrait] .coop-network{align-self:center}
`;
  style.textContent+=`#creia-ui.adventure-cards .x1-card[data-card="1"] .x1-opcoes button{flex:1;min-height:40px;font-size:14px}
`;
  document.head.appendChild(style);
  var profiles={
    nutri:[3,3,5,'Distância','Corpo a corpo','Low carb: drena 20% da vida dos adversários e recupera 20% da dela.'],
    lutador:[4,3,4,'Corpo a corpo','Distância','Solo de guitarra: escudo e golpes fortalecidos por 9 segundos.'],
    emanuelly:[3,3,3,'Distância','Distância','Letras da redação caem sobre os inimigos.'],
    enzo:[4,3,3,'Distância','Distância','Uma tempestade horizontal de bolas de basquete.'],
    pedro:[4,3,3,'Distância','Distância','O teclado dispara uma onda de impacto em forma de equalizador.'],
    naju:[3,3,3,'Distância','Corpo a corpo','O grito espalha ondas sonoras que atingem os adversários.'],
    grazi:[4,3,3,'Distância','Corpo a corpo','As crianças avançam para atacar os inimigos.'],
    bispo:[4,3,4,'Distância','Suporte','Oração e fogo do céu sobre os adversários.'],
    lohan:[3,3,3,'Distância','Distância','Super Flash causa uma explosão de luz.'],
    rafinha:[4,5,4,'Distância','Corpo a corpo','Uma chuva de pratos atravessa a arena.'],
    douglas:[4,3,3,'Distância','Distância','Aura com ondas e golpes de cavaquinho.'],
    fidelis:[4,3,3,'Distância','Corpo a corpo','Inversão de Acorde: giros do contrabaixo e uma pancada final.'],
    arthur:[3,3,4,'Distância','Suporte','Vá estudar: aumenta a velocidade por alguns segundos.'],
    lucas:[4,3,3,'Distância','Corpo a corpo','Porcos fazem os adversários girarem.'],
    duda:[3,3,5,'Distância','Suporte','Coram Deo abre os céus e recupera vida.'],
    cardoso:[4,3,5,'Distância','Corpo a corpo','Limados com sucesso: proteção por 5 segundos.'],
    th:[4,3,3,'Distância','Distância','Após os anúncios, uma TV OLED cai sobre o adversário.'],
    douglinhas:[4,3,3,'Distância','Corpo a corpo','Os céus se abrem e uma cruz gigante cai sobre o alvo.'],
    ricardo:[4,4,3,'Corpo a corpo','Corpo a corpo','Ricardo despenca do céu com uma porta sobre o adversário.'],
    adriene:[4,3,4,'Distância','Corpo a corpo','Os ingredientes voam e prendem os adversários num brigadeiro gigante que vai tirando vida.']
  };
  if(window.CreiaCombat)Object.keys(profiles).forEach(function(who){var a=window.CreiaCombat.profile(who,true);profiles[who].splice(0,3,a.attack,a.mobility,a.defense);});
  var humanColors=['#ff3b3b','#3b8bff','#3bff6a','#ffd23b'],aiColors=['#3bff6a','#a875ff','#ff72bd'];
  function participant(team,index){var member=team[index];if(member.ctl!=null)return {label:'P'+(member.ctl+1),color:humanColors[member.ctl]};var ai=team.slice(0,index+1).filter(function(m){return m.ctl==null;}).length-1;return {label:'IA '+(ai+1),color:aiColors[ai%3]};}
  var current='',bridge=null,lastState=null,tiles=[],portrait=null,profileWho='',cooldowns={},cooldownKey='';
  function el(tag,className,text){var node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=text;return node;}
  function button(text,action,className){var node=el('button',className,text);node.type='button';node.onclick=action;return node;}
  function releaseCoopNetwork(){var badge=document.querySelector('.creia-net');if(badge&&badge.parentElement&&badge.parentElement.className==='coop-network')document.body.appendChild(badge);}
  function shell(title){releaseCoopNetwork();root.replaceChildren();root.className='';var body=el('div','shell'),head=el('header');head.append(el('h1','',title),button('Voltar',function(){bridge.back();}));body.append(head);root.append(body);return body;}
  var coopShownCursor=-1;
  function buildCoop(state){
    var setup=state.scene==='coopSetup',box=shell(setup?'Seu time em Bangu':'Aventura online (BETA)'),main=el('main','coop-main'),card=el('article','x1-card coop-card'),art=el('div','x1-arte'),cv=document.createElement('canvas'),info=el('div','x1-info');
    coopShownCursor=-1;card.dataset.ativo='true';
    cv.width=480;cv.height=270;art.append(cv);card.append(art,info);main.append(card);box.append(main);
    info.append(el('h2','',setup?'Prepare a aventura':'Dois jogadores, um time'),el('p','',setup?'Comece na fase 1 com até dois aliados de IA.':'Cada um joga no seu aparelho. O anfitrião conduz a aventura.'));
    function action(label,fn,row,className){var b=button(label,fn,className);b.onfocus=function(){bridge.coop('focus',row);};return b;}
    if(!setup){info.append(button('Criar sala',function(){bridge.coop('create');},'primary'),button('Entrar com código',function(){bridge.coop('join');}));}
    else{
      for(var slot=0;slot<2;slot++)(function(i){
        var row=el('div','x1-opcoes coop-choice coop-ally');row.dataset.coopRow=i;row.setAttribute('role','group');row.setAttribute('aria-label','Aliado IA '+(i+1));row.append(el('span','','Aliado IA '+(i+1)));
        function cycle(dir){bridge.coop('focus',i);bridge.coop('cycleAlly',{slot:i,dir:dir});}
        var prev=action('‹',function(){cycle(-1);},i),pick=action('',function(){bridge.coop('focus',i);if(lastState.coop.allies[i])bridge.coop('clearAlly',i);else cycle(1);},i,'coop-ally-pick'),next=action('›',function(){cycle(1);},i);
        prev.setAttribute('aria-label','Aliado IA '+(i+1)+' anterior');next.setAttribute('aria-label','Próximo aliado IA '+(i+1));pick.dataset.coopAlly=i;row.append(prev,pick,next);info.append(row);
      })(slot);
      var start=action('Iniciar aventura',function(){bridge.coop('start');},2,'primary');start.dataset.coopRow='2';info.append(start);
    }
    var foot=el('footer','coop-footer');foot.append(el('p','hint',setup?'▲ ▼ escolhem a linha · ◀ ▶ mudam a opção · ENTER inicia':'Crie a sala e compartilhe o código com seu parceiro.'),el('div','coop-network'));box.append(foot);
  }
  function syncCoop(state){
    var cv=root.querySelector('.x1-arte canvas');if(cv)try{x1Arte(cv,1,state.time||0,state.scene==='coopSetup'?state.coop:null);}catch(_){}
    var dock=root.querySelector('.coop-network'),badge=document.querySelector('.creia-net');if(dock&&badge&&badge.parentElement!==dock)dock.appendChild(badge);
    if(state.coop&&state.scene==='coopSetup'){
      var c=state.coop,focusTarget=null;
      root.querySelectorAll('[data-coop-row]').forEach(function(row){row.dataset.cursor=String(Number(row.dataset.coopRow)===c.cursor);if(c.cursor===2&&row.dataset.coopRow==='2')focusTarget=row;});
      root.querySelectorAll('[data-coop-ally]').forEach(function(b){var i=Number(b.dataset.coopAlly),who=c.allies[i],fighter=state.roster.find(function(r){return r.who===who;});b.textContent=fighter?fighter.name:'Sem aliado';b.setAttribute('aria-pressed',String(!!who));b.setAttribute('aria-label',fighter?'Remover aliado IA '+(i+1)+': '+fighter.name:'Adicionar aliado IA '+(i+1));if(c.cursor===i)focusTarget=b;});
      if(coopShownCursor!==c.cursor&&focusTarget&&Array.from(root.querySelectorAll('button')).some(function(b){return b===document.activeElement;}))focusTarget.focus({preventScroll:true});
      coopShownCursor=c.cursor;
    }
  }
  function buildMenu(){root.replaceChildren();root.className='menu-world';var box=el('main','shell home');box.append(el('h1','','Creia Fight'),el('p','','Deus, fé e muita resenha'));var nav=el('nav');nav.setAttribute('aria-label','Modos de jogo');
    ['X1','Modo Aventura em Bangu'].forEach(function(name,index){var b=button(name,function(){bridge.menu(index);});b.dataset.menu=index;b.onfocus=function(){bridge.menuFocus(index);};nav.append(b);});box.append(nav);
    var minor=el('div','menu-minor');['Controles','Configurações','Ranking'].forEach(function(name,index){var b=button(name,function(){bridge.menu(index+2);});b.dataset.menu=index+2;b.onfocus=function(){bridge.menuFocus(index+2);};minor.append(b);});box.append(minor);
    box.append(el('p','hint','Setas para escolher · Enter para confirmar · M para som'));root.append(box);
  }
  // Arte dos cartões do X1: arena real escurecida e os lutadores de verdade (Rig.big)
  var X1_ART=[
    {stage:1,lutas:[['lutador','P1','#ff3b3b'],['nutri','IA','#3bff6a']]},
    {stage:2,lutas:[['pedro','P1','#ff3b3b'],['enzo','P2','#3b8bff']]},
    {stage:4,lutas:[['bispo','IA 1','#3bff6a'],['lucas','IA 2','#a875ff']]},
    {stage:5,lutas:[['fidelis','P1','#ff3b3b'],['rafinha','P2','#3b8bff']]},
    {stage:3,fila:['grazi','lohan','duda','th']},
    {stage:7,heroi:'lutador',rivais:['naju','douglas','ricardo','adriene']}
  ],carousel=null,x1Sombra=null;
  function x1Tag(g,text,x,y,col){g.font='8px "Press Start 2P", monospace';g.textAlign='center';g.textBaseline='top';var w=g.measureText(text).width+10;
    g.fillStyle='rgba(11,10,16,.85)';g.fillRect(x-w/2,y-3,w,14);g.fillStyle=col;g.fillRect(x-w/2,y+11,w,2);g.fillText(text,x,y);}
  function x1Arte(cv,i,t,coop,art){
    var g=cv.getContext('2d'),a=art||(coop?{stage:coop.stage,coop:coop}:X1_ART[i]),R=window.Rig;g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;
    if(!(bridge&&bridge.cenario&&bridge.cenario(g,a.stage))){var bgr=g.createLinearGradient(0,0,0,270);bgr.addColorStop(0,'#0d0a14');bgr.addColorStop(1,'#2a0a10');g.fillStyle=bgr;g.fillRect(0,0,480,270);}
    g.fillStyle='rgba(11,10,16,.38)';g.fillRect(0,0,480,270);
    var v=g.createRadialGradient(240,175,50,240,150,300);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.7)');g.fillStyle=v;g.fillRect(0,0,480,270);
    if(!R||!R.big)return;
    if(a.coop){
      // Aliados menores primeiro; todos pisam na mesma linha do cenário.
      (a.coop.allies||[]).forEach(function(w,k){R.big(g,w,'idle',t+k*.29,k?392:88,244,k?-1:1,1.3);});
      [a.coop.choice,a.coop.other].forEach(function(w,k){if(w)R.big(g,w,'idle',t+k*.37,k?304:176,244,k?-1:1,2);});
      // As plaquinhas ficam ao lado das cabeças, com margem dentro do quadro inteiro.
      if(a.coop.choice)x1Tag(g,'P1',110,110,'#ff3b3b');
      if(a.coop.other)x1Tag(g,'P2',370,110,'#3b8bff');
    }else if(a.lutas){
      a.lutas.forEach(function(f,k){var x=k?322:158;R.big(g,f[0],'idle',t+k*.37,x,244,k?-1:1,2);x1Tag(g,f[1],x+(k?62:-62),98,f[2]);});
      var z=1+Math.sin(t*3)*.05;g.save();g.translate(240,150);g.scale(z,z);g.font='16px "Press Start 2P", monospace';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#0b0a10';g.fillText('VS',2,2);g.fillStyle='#e8323c';g.fillText('VS',0,0);g.restore();
    }else if(a.fila){
      a.fila.forEach(function(w,k){R.big(g,w,'idle',t+k*.29,96+k*96,244,k<2?1:-1,1.45);});
    }else{   // escalada: os rivais apagados atrás (a própria arte tingida, como na escadaria) e o lutador no holofote
      x1Sombra=x1Sombra||document.createElement('canvas');x1Sombra.width=480;x1Sombra.height=270;
      var s=x1Sombra.getContext('2d');s.setTransform(1,0,0,1,0,0);s.globalCompositeOperation='source-over';s.clearRect(0,0,480,270);s.imageSmoothingEnabled=false;
      a.rivais.forEach(function(w,k){R.big(s,w,'idle',t+k*.31,[70,150,330,410][k],[214,200,200,214][k],k<2?1:-1,1.25);});
      s.globalCompositeOperation='source-atop';s.fillStyle='rgba(20,12,24,.86)';s.fillRect(0,0,480,270);g.drawImage(x1Sombra,0,0);
      var luz=g.createRadialGradient(240,250,10,240,170,150);luz.addColorStop(0,'rgba(255,211,77,.35)');luz.addColorStop(1,'rgba(255,211,77,0)');g.fillStyle=luz;g.fillRect(0,0,480,270);
      R.big(g,a.heroi,'idle',t,240,250,1,2.1);
    }
  }
  function x1Niveis(sides,label){var row=el('div','x1-opcoes');row.append(el('span','',label));
    [['facil','Fácil'],['medio','Médio'],['dificil','Difícil']].forEach(function(o){var b=button(o[1],function(){sides.forEach(function(sd){bridge.level(sd,o[0]);});});b.dataset.nivel=o[0];b.dataset.lado=String(sides[0]);row.append(b);});return row;}
  // Um carrossel para X1 e aventura: mesmos cartões, pontos, setas e gesto de deslizar.
  function buildCarousel(title,data,config){
    var box=shell(title),main=el('main','x1-carrossel'),trilho=el('div','x1-trilho'),pontos=el('div','x1-pontos');
    var model=carousel={shown:-1,auto:0,tick:0};root.className=config.className||'';
    data.forEach(function(d,i){
      var card=el('article','x1-card'),arte=el('div','x1-arte'),cv=document.createElement('canvas'),info=el('div','x1-info');
      cv.width=480;cv.height=270;arte.append(cv);card.dataset.card=String(i);card.dataset.ativo='false';info.append(el('h2','',d[0]),el('p','',d[1]));
      config.options(info,i);
      if(d[2])info.append(button(d[2],function(){config.go(i);},'primary'));
      card.onclick=function(){if(card.dataset.ativo!=='true')config.focus(i);};
      card.append(arte,info);trilho.append(card);pontos.append(el('span'));
    });
    var esq=button('‹',function(){config.focus((config.current()+data.length-1)%data.length);},'x1-seta esq'),dir=button('›',function(){config.focus((config.current()+1)%data.length);},'x1-seta dir');
    esq.setAttribute('aria-label','Modo anterior');dir.setAttribute('aria-label','Próximo modo');
    var parado=null;trilho.addEventListener('scroll',function(){
      if(Date.now()<model.auto)return;clearTimeout(parado);parado=setTimeout(function(){
        if(carousel!==model)return;
        var meio=trilho.scrollLeft+trilho.clientWidth/2,best=0,dist=1e9;
        trilho.querySelectorAll('.x1-card').forEach(function(c,k){var d=Math.abs(c.offsetLeft+c.offsetWidth/2-meio);if(d<dist){dist=d;best=k;}});
        if(best!==config.current()){model.shown=best;config.focus(best);}
      },90);
    });
    main.append(trilho,esq,dir,pontos);
    var rod=el('footer','x1-rodape');rod.append(el('p','hint',config.hint||'◀ ▶ trocam o modo · ▲ ▼ mudam a opção · ENTER escolhe'),el('p','gamepad-status hint'));box.append(main,rod);
  }
  function buildX1(){
    var data=[['P1 × IA','Você contra o computador.','Escolher lutadores'],['P1 × P2','Dois jogadores na mesma tela, no teclado ou no controle.','Escolher lutadores'],
      ['IA × IA','Escolha os dois lutadores e assista à resenha.','Escolher lutadores'],['X1 ONLINE','Cada um no seu aparelho, em qualquer lugar.',''],
      ['TORNEIO','Chave sorteada, melhor de 3 em cada luta.','Escolher lutadores'],['ESCALADA','Você contra os outros 19, um por vez. Perdeu, perdeu.','Escolher lutador']];
    buildCarousel('X1',data,{focus:function(i){bridge.x1Focus(i);},current:function(){return lastState.x1;},go:function(i){bridge.x1Go(i);},options:function(info,i){
      if(i===0)info.append(x1Niveis([1],'IA'));
      if(i===1)info.append(el('div','x1-opcoes'));
      if(i===2)info.append(x1Niveis([0],'IA 1'),x1Niveis([1],'IA 2'));
      if(i===3){var on=el('div','x1-opcoes');['Criar sala','Entrar com código'].forEach(function(t,k){var b=button(t,function(){bridge.x1Opt('online',k);bridge.x1Go(3);});b.dataset.online=String(k);on.append(b);});info.append(on);}
      if(i===4){var tam=el('div','x1-opcoes'),mod=el('div','x1-opcoes');tam.append(el('span','','Lutadores'));mod.append(el('span','','Lutas'));
        (lastState&&lastState.tourSizes||[4,8,12,16]).forEach(function(n,k){var b=button(String(n),function(){bridge.x1Opt('torneio',k);});b.dataset.tsize=String(k);tam.append(b);});
        [['pve','P1 × IA'],['pvp','P1 × P2'],['eve','IA × IA']].forEach(function(m){var b=button(m[1],function(){bridge.mode(m[0]);});b.dataset.mode=m[0];mod.append(b);});info.append(tam,mod);}
      if(i===5)info.append(el('div','x1-opcoes'));
    }});
  }
  function buildAdventure(){
    buildCarousel('Modo Aventura em Bangu',[
      ['NA MESMA TELA','De 1 a 4 jogadores no mesmo aparelho, no teclado ou no controle.','Escolher lutadores'],
      ['AVENTURA ONLINE (BETA)','Cada um no seu aparelho, juntos contra a fome.','']
    ],{className:'adventure-cards',hint:'◀ ▶ trocam o cartão · ▲ ▼ mudam a opção · ENTER escolhe · ESC volta',focus:function(i){bridge.adventureFocus(i);},current:function(){return lastState.adventure.card;},go:function(i){bridge.adventureGo(i);},options:function(info,i){
      if(i===1){var row=el('div','x1-opcoes');['Criar sala','Entrar com código'].forEach(function(label,k){var b=button(label,function(){bridge.adventureOpt(k);bridge.adventureGo(1);});b.dataset.adventureOnline=String(k);row.append(b);});info.append(row);}
    }});
  }
  function syncCarousel(state,index,draw){
    var cards=root.querySelectorAll('.x1-card'),model=carousel;if(!cards.length||!model)return;
    cards.forEach(function(c,i){c.dataset.ativo=String(i===index);});
    root.querySelectorAll('.x1-pontos span').forEach(function(p,i){p.dataset.ativo=String(i===index);});
    if(index!==model.shown&&cards[index]){var first=model.shown<0;model.shown=index;model.auto=Date.now()+(first?150:700);
      var tr=cards[index].parentElement,c=cards[index],left=c.offsetLeft+c.offsetWidth/2-tr.clientWidth/2;
      if(tr.scrollTo)tr.scrollTo({left:left,behavior:first?'auto':'smooth'});else tr.scrollLeft=left;}
    var t=state.time||0;model.tick++;
    cards.forEach(function(c,i){if(i===index||model.tick%30===1){var cv=c.querySelector('canvas');try{draw(cv,i,t);}catch(e){}}});
  }
  function syncX1(state){
    root.querySelectorAll('[data-nivel]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.nivel===state.local.levels[Number(b.dataset.lado)]));});
    root.querySelectorAll('[data-online]').forEach(function(b){b.setAttribute('aria-pressed',String(Number(b.dataset.online)===(state.x1Opt?state.x1Opt.online:0)));});
    root.querySelectorAll('[data-tsize]').forEach(function(b){b.setAttribute('aria-pressed',String(Number(b.dataset.tsize)===(state.x1Opt?state.x1Opt.torneio:0)));});
    root.querySelectorAll('[data-mode]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.mode===state.local.mode));});
    syncCarousel(state,state.x1,x1Arte);
  }
  function syncAdventure(state){
    root.querySelectorAll('[data-adventure-online]').forEach(function(b){b.setAttribute('aria-pressed',String(Number(b.dataset.adventureOnline)===state.adventure.online));});
    syncCarousel(state,state.adventure.card,function(cv,i,t){
      var a=i===0?{stage:state.stage,fila:['lutador','nutri','bispo','duda']}:{stage:state.stage,coop:{choice:'lutador',other:'nutri',allies:[]}};
      x1Arte(cv,0,t,null,a);
    });
  }
  function buildSelect(state){var box=shell('Escolha seu lutador'),main=el('main','select-main'),profile=el('section','fighter-profile');profile.setAttribute('aria-label','Perfil do lutador');profile.append(el('h2','fighter-title'));var attrs=el('div','attributes');
    ['Ataque / Ofensivo','Velocidade / Mobilidade','Defesa / Resistência'].forEach(function(name,index){var row=el('div'),line=el('div','attribute-label'),value=el('span','attribute-value');line.append(el('span','',name),value);var meter=el('meter');meter.min=0;meter.max=5;meter.setAttribute('aria-label',name);row.dataset.attribute=index;row.append(line,meter);attrs.append(row);});profile.append(attrs,el('div','attacks'));
    var special=el('div','special-block');special.append(el('div','special-name'),el('p','special-desc'));profile.append(special);
    var stage=el('div','fighter-stage');portrait=el('canvas');portrait.width=440;portrait.height=420;portrait.setAttribute('aria-label','Personagem em destaque');stage.append(portrait);profile.append(stage,el('p','hint','Perfil relativo · 100 de vida base'));main.append(profile);
    var roster=el('section','roster-area');roster.setAttribute('aria-label','Lutadores disponíveis');var diamond=el('div','diamond');tiles=[];var offset=0,counts=[4,5,6,5];while(counts.reduce(function(a,b){return a+b;},0)<state.roster.length)counts.push(6);
    counts.forEach(function(count){var row=el('div','roster-row');state.roster.slice(offset,offset+count).forEach(function(r){var index=offset+row.children.length,b=button('',function(){if(root.dataset.device==='mobile')bridge.hover(index);else bridge.pick(index);},'fighter'),c=el('canvas');c.width=56;c.height=56;b.setAttribute('aria-label',r.name);b.onpointerenter=function(e){if(e.pointerType==='mouse')bridge.hover(index);};b.onfocus=function(){bridge.hover(index);};b.append(c,el('span','fighter-name',r.name),el('span','pick-tag'));row.append(b);tiles.push({button:b,canvas:c,who:r.who});});offset+=count;diamond.append(row);});roster.append(diamond,el('div','team-line'),el('p','notice'),el('p','hint gamepad-status','Setas navegam · Enter escolhe · K desfaz · L inicia'));main.append(roster);box.append(main);
    var footer=el('footer','selection-footer'),instructions=el('span','selection-instructions'),actions=el('div','actions');actions.append(button('Desfazer',function(){bridge.undo();}),button('Sortear o resto',function(){bridge.sortTourRest();},'sort-rest'),button('Selecionar IA',function(){bridge.pick(lastState.selection.cursor);},'choose-more'),button('Selecionar',function(){var s=lastState.selection,ready=!s.online&&s.locked&&(s.escalada?s.team.length===1:(!s.vs||s.team.length===2)&&(!s.tour||s.team.length===s.tour));bridge.pick(ready?lastState.roster.length:Math.min(s.cursor,lastState.roster.length-1));},'primary start'));footer.append(instructions,actions);box.append(footer);root.querySelector('.sort-rest').append(el('small','','R · X / Quadrado'));profileWho='';
  }
  root.addEventListener('keydown',function(e){if(e.target.tagName==='SELECT'){e.stopPropagation();return;}if(e.key==='Enter'&&(e.target.className.split(' ').indexOf('fighter')>=0||e.target.dataset.menu!=null||e.target.dataset.x1!=null)){e.preventDefault();return;}if((e.key==='Enter'||e.key===' ')&&e.target.tagName==='BUTTON'){e.preventDefault();e.stopPropagation();e.target.click();}});
  function updateProfile(state){var s=state.selection,index=s.cursor<state.roster.length?s.cursor:s.slots[0].pick||0,r=state.roster[index],p=profiles[r.who];if(profileWho!==r.who){
      profileWho=r.who;root.querySelector('.fighter-title').textContent=r.name;root.querySelectorAll('[data-attribute]').forEach(function(row,i){row.querySelector('meter').value=p[i];row.querySelector('.attribute-value').textContent=p[i]+'/5';});
      var attacks=root.querySelector('.attacks');attacks.replaceChildren(el('span','','1 Atk · '+p[3]),el('span','','2 Atk · '+p[4]));root.querySelector('.special-name').textContent=r.special;root.querySelector('.special-desc').textContent=p[5];
    }
    var context=portrait.getContext('2d');context.clearRect(0,0,440,420);context.save();context.scale(2,2);if(window.Rig)Rig.big(context,r.who,'idle',state.time,110,205,1,2.35);context.restore();
    tiles.forEach(function(t,i){var picked=s.team.findIndex(function(m){return m.who===t.who;});t.button.disabled=!!(s.online&&(s.blocked||s.locked));t.button.dataset.cursor=String(i===s.cursor);t.button.tabIndex=i===s.cursor?0:-1;t.button.dataset.picked=String(picked>=0);t.button.setAttribute('aria-pressed',String(picked>=0));var tag=picked<0?null:s.tour?{label:'#'+(picked+1),color:'#ffd34d'}:participant(s.team,picked);t.button.style.setProperty('--picked-color',tag?tag.color:'#ffffff');t.button.querySelector('.pick-tag').textContent=tag?tag.label:'';var c=t.canvas.getContext('2d');c.clearRect(0,0,56,56);c.save();c.scale(2,2);if(window.Rig)Rig.portrait(c,t.who,0,0);c.restore();});
    var next=s.team.length,cursorColor=s.online?humanColors[s.localCtl||0]:s.vs&&state.local.mode==='eve'?aiColors[Math.min(next,2)]:!s.locked?'#ff3b3b':!s.vs?aiColors[Math.max(0,next-1)%3]:state.local.mode==='pvp'?'#3b8bff':aiColors[state.local.mode==='eve'?Math.min(next,2):0];root.style.setProperty('--cursor-color',cursorColor);
    var teamLine=root.querySelector('.team-line');teamLine.replaceChildren();s.team.forEach(function(m,i){var tag=s.tour?{label:'#'+(i+1),color:'#ffd34d'}:participant(s.team,i),name=state.roster.find(function(r){return r.who===m.who;}).name,span=el('span','',tag.label+' · '+name);span.style.color=tag.color;teamLine.append(span);});
    root.querySelector('.notice').textContent=s.message;root.querySelector('.selection-instructions').textContent=s.online?'Sala '+s.code+(state.coop?' · Seu parceiro joga em outra tela.':' · Seu rival joga em outra tela.'):s.escalada?'Escalada: enfrente os 19 lutadores em sequência.':s.tour?'Torneio: escolha '+s.tour+' lutadores ('+s.team.length+'/'+s.tour+'). A chave é sorteada.':s.vs?'Escolha dois lutadores para o X1.':'Jogue sozinho ou adicione até três companheiros.';
    var focused=document.activeElement;if(focused&&tiles.some(function(t){return t.button===focused;})&&tiles[s.cursor]&&tiles[s.cursor].button!==focused)tiles[s.cursor].button.focus({preventScroll:true});
    var random=root.querySelector('.sort-rest');random.hidden=!s.tour||!!s.online;random.disabled=!s.tour||s.team.length>=s.tour;
    var ready=!s.online&&s.locked&&(s.escalada?s.team.length===1:(!s.vs||s.team.length===2)&&(!s.tour||s.team.length===s.tour)),start=root.querySelector('.start');start.textContent=s.online&&s.locked?'Aguardando rival':ready?'Iniciar':'Selecionar';start.disabled=!!(s.online&&(s.locked||s.blocked))||!ready&&s.cursor>=state.roster.length;var choose=root.querySelector('.choose-more');choose.hidden=!!s.online||!!s.vs||!!s.tour||!!s.escalada||!s.locked||s.team.length>=4;choose.disabled=s.cursor>=state.roster.length||s.team.some(function(m){return m.who===r.who;});start.dataset.goCursor=String(s.cursor===state.roster.length);root.querySelector('.actions button').disabled=!!s.online||s.team.length===0;
  }
  function cooldownText(value){return value>=1?Math.ceil(value)+'s':value>0?value.toFixed(1)+'s':'Pronto';}
  function updateCooldowns(state){hud.hidden=true;
    var visible=state.scene==='play'||state.scene==='onlinePlay';if(!visible)return;
    var p=state.scene==='onlinePlay'?state.players[1]:state.players.find(function(p){return !p.ai&&p.ctl===0;});
    document.querySelectorAll('[data-creia-action]').forEach(function(button){var key=button.getAttribute('data-creia-action'),value=p?(key==='KeyJ'?p.primary:key==='KeyI'?p.secondary:0):0,text='';if(value>0)text=cooldownText(value);if(p&&key==='KeyL'&&p.special<100)text=Math.floor(p.special)+'%';button.dataset.wait=String(!!text);var badge=button.querySelector('.creia-cd-badge');if(!badge){badge=el('span','creia-cd-badge');button.append(badge);}badge.hidden=!text;badge.textContent=text;});
  }
  function fitViewport(){var viewport=window.visualViewport,w=viewport?viewport.width:window.innerWidth||960,h=viewport?viewport.height:window.innerHeight||480,portrait=w/h<0.95,designW=portrait?480:960,designH=portrait?780:480,mobile=w<681||!!(window.navigator&&window.navigator.maxTouchPoints>0)||!!(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches);root.dataset.device=mobile?'mobile':'desktop';root.dataset.layout=portrait?'portrait':'landscape';var scale=Math.min((w-12)/designW,(h-12)/designH,mobile?1.3:1);root.style.setProperty('--ui-scale',String(Math.max(0.1,scale)));return {width:designW*scale,height:designH*scale,viewportWidth:w,viewportHeight:h};}
  window.CreiaUI={fit:fitViewport,profiles:profiles,sync:function(state,commands){bridge=commands;lastState=state;var viewportFit=fitViewport();var screen=(state.scene==='select'||state.scene==='onlineSelect')&&state.selection&&!state.selection.transition?'select':state.scene==='x1menu'?'x1':state.scene==='adventuremenu'?'adventure':state.scene==='coopSetup'?'coopSetup':'';if(screen!=='coopSetup')releaseCoopNetwork();root.hidden=!screen;root.dataset.screen=screen;if(document.documentElement){document.documentElement.classList.toggle('creia-modern-screen',!!screen);document.documentElement.classList.toggle('creia-coop-screen',screen==='coopSetup');document.documentElement.classList.toggle('creia-character-select',screen==='select'&&root.dataset.device==='mobile');var combat=state.scene==='play'||state.scene==='onlinePlay'||state.scene==='gameover';document.documentElement.classList.toggle('creia-combat-screen',combat);document.documentElement.classList.toggle('creia-cinematic',!!state.cinematic);if(combat&&document.documentElement.style){var gw=Math.min(viewportFit.viewportWidth,viewportFit.viewportHeight*16/9),toolsTop=(viewportFit.viewportHeight-gw*9/16)/2+(state.combat==='x1'?74:105)*gw/480;document.documentElement.style.setProperty('--creia-combat-tools-top',toolsTop+'px');}}
    if(screen!==current){current=screen;if(screen==='menu')buildMenu();else if(screen==='x1')buildX1();else if(screen==='adventure')buildAdventure();else if(screen==='select')buildSelect(state);else if(screen==='coopSetup')buildCoop(state);}
    if(screen==='menu'){root.querySelectorAll('[data-menu]').forEach(function(b){b.dataset.selected=String(Number(b.dataset.menu)===state.menu);if(document.activeElement&&document.activeElement.dataset.menu!=null&&Number(b.dataset.menu)===state.menu&&document.activeElement!==b)b.focus({preventScroll:true});});}
    if(screen==='coopSetup')syncCoop(state);
    if(screen==='x1')syncX1(state);
    if(screen==='adventure')syncAdventure(state);
    var padNote=root.querySelector('.gamepad-status');if(padNote){var connected=(state.gamepads||[]).filter(function(p){return p.connected;});padNote.textContent=connected.length?connected.map(function(p){return 'P'+p.player+': '+p.name;}).join(' · ')+' · A / Cruz escolhe · B / Círculo desfaz · Menu / Options entra ou inicia':'Controle: conecte por Bluetooth ou USB e aperte um botão.';}
    if(screen==='select'){root.querySelector('header h1').hidden=root.dataset.device==='mobile';updateProfile(state);}updateCooldowns(state);
  }};
}());
