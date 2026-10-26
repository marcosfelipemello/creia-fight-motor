// gera as composições da abertura do Creia Fight (HTML editável no HyperFrames)
import fs from 'node:fs';
const D = new URL('.', import.meta.url).pathname;
const B = 0.4137, B0 = 0.98, beat = i => +(B0 + i * B).toFixed(3);
const F = [
['bispo','BISPO ANDRÉ','BISPO','INDESCULPÁVEIS!','#e85d04',1],
['lutador','MARCOS FELIPE','LUTADOR','SOLO DE GUITARRA','#d62828',2],
['nutri','LORRANY','NUTRICIONISTA','RESTRIÇÃO ALIMENTAR, LOW CARB!','#ff4f9a',2],
['emanuelly','EMANUELLY','ESTUDANTE','REDAÇÃO NOTA MIL','#e9b616',1],
['enzo','ENZO GABRIEL','BASQUETE E MÚSICA','CHUVA DE BASQUETE','#ff7a1a',1],
['pedro','PEDRO GUILHERME','TECLADISTA','HARMONIA BIZARRAMENTE TORTA','#7b4dff',1],
['naju','NAJU','CANTORA','GRITO NO MICROFONE','#13a596',1],
['grazi','GRAZI','PROFESSORA','VÃO, MINHAS CRIANÇAS!','#ff3d7f',1],
['lohan','LOHAN','FOTÓGRAFO','SUPER FLASH','#2bb24c',1],
['rafinha','RAFINHA','BATERISTA','CHUVA DE PRATO','#f4a300',1],
['douglas','DOUGLAS FEIJÓ','CAVAQUINISTA','FARMAR AURA','#9b5de5',1],
['fidelis','FIDELIS','GAMER','INVERSÃO DE ACORDE','#1e88e5',1],
['arthur','ARTHUR','CANTOR','VÁ ESTUDAR','#e63946',1],
['lucas','LUCAS GARCIA','CREIACAST','PORCOS NA SALA!','#6fae1c',1],
['duda','DUDA SOUZA','CANTORA','CORAM DEO','#ff70a6',1],
['adriene','ADRIENE','CONFEITEIRA','É HORA DO BRIGADEIRO!','#b5651d',1],
['cardoso','LUCAS CARDOSO','BAIXISTA','LIMADOS COM SUCESSO!','#6a4c93',1],
['th','THIAGO (TH)','REPÓRTER','ANÚNCIOS DA SEMANA','#00a6d6',1],
['douglinhas','DOUGLINHAS','TRICOLOR','QUE TENHAMOS LÁGRIMAS!','#8a1538',1],
['ricardo','RICARDO','KARATÊ E LOUVOR','NEM PORRRTAAAAS!','#ff8c1a',1]
];
const FONTS = `@font-face{font-family:'Press Start 2P';src:url('assets/fonts/PressStart2P.woff2') format('woff2')}
@font-face{font-family:'OswaldLocal';src:url('assets/fonts/Oswald.woff2') format('woff2');font-weight:200 700}`;

// ---------- abertura (0 → beat 4) ----------
const T0 = beat(4);
fs.writeFileSync(D + 'compositions/abre.html', `<template>
  <style>${FONTS}
    #root{position:absolute;inset:0;overflow:hidden;background:#000}
    #abre-cam{position:absolute;inset:0}
    #abre-fundo{position:absolute;left:0;top:0;width:1920px;height:1080px;image-rendering:pixelated;object-fit:cover}
    #abre-sombra{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(5,4,10,.6),rgba(5,4,10,.94) 75%)}
    .abre-txt{position:absolute;left:0;right:0;text-align:center;color:#fff}
    #abre-local{top:330px;font:600 58px/1 OswaldLocal,sans-serif;letter-spacing:.32em;color:#f6c16a}
    #abre-num{top:450px;font:96px/1.2 'Press Start 2P',monospace;text-shadow:8px 8px 0 #b3001b}
    #abre-quem{top:640px;font:44px/1.2 'Press Start 2P',monospace;color:#fff}
    #abre-flash{position:absolute;inset:0;background:#fff;opacity:0}
  </style>
  <div id="root" data-composition-id="abre" data-width="1920" data-height="1080">
    <div id="abre-cam">
      <img id="abre-fundo" src="assets/titulo.webp" alt="">
      <div id="abre-sombra"></div>
    </div>
    <div id="abre-local" class="abre-txt clip" data-start="${B0}" data-duration="${(T0 - B0).toFixed(3)}">BANGU · RIO DE JANEIRO</div>
    <div id="abre-num" class="abre-txt clip" data-start="${beat(1)}" data-duration="${(T0 - beat(1)).toFixed(3)}">A IGREJA TODA</div>
    <div id="abre-quem" class="abre-txt clip" data-start="${beat(2)}" data-duration="${(T0 - beat(2)).toFixed(3)}">NO RINGUE. QUEM AGUENTA?</div>
    <div id="abre-flash"></div>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.fromTo('#abre-cam', { scale: 1.0 }, { scale: 1.12, duration: ${T0}, ease: 'power2.inOut' }, 0);
    tl.fromTo('#abre-sombra', { opacity: 1 }, { opacity: 0.75, duration: ${B0}, ease: 'power2.out' }, 0);
    tl.fromTo('#abre-local', { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.18, ease: 'power4.out' }, ${B0});
    tl.fromTo('#abre-num', { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.16, ease: 'expo.out' }, ${beat(1)});
    tl.fromTo('#abre-quem', { opacity: 0, x: -60, filter: 'blur(10px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.15, ease: 'expo.out' }, ${beat(2)});
    ${[[-14,8],[12,-6],[-6,4],[0,0]].map((s, i) => `tl.to('#abre-cam', { x: ${s[0]}, y: ${s[1]}, duration: 0.033, ease: 'none' }, ${(beat(1) + i * 0.033).toFixed(3)});`).join('\n    ')}
    tl.fromTo('#abre-flash', { opacity: 0 }, { opacity: 1, duration: ${(T0 - beat(3) - 0.1).toFixed(3)}, ease: 'power3.in' }, ${(beat(3) + 0.1).toFixed(3)});
    window.__timelines['abre'] = tl;
  </script>
</template>
`);

// ---------- elenco (beat 4 → beat 26), tempos locais à cena ----------
let t = 0; const cards = [], tw = [];
F.forEach(([who, nome, job, esp, cor, nb], i) => {
  const dur = +(nb * B).toFixed(3), s = +t.toFixed(3), id = 'el-' + who;
  cards.push(`    <div id="${id}" class="card clip" data-start="${s}" data-duration="${dur}" style="--cor:${cor}" data-layout-allow-overlap data-layout-allow-overflow>
      <div class="linhas" id="${id}-linhas"></div>
      <div class="faixa" id="${id}-faixa"></div>
      <img class="lutador" id="${id}-img" src="assets/elenco/${who}_special.png" alt="">
      <div class="num">#${String(i + 1).padStart(2, "0")}</div>
      <div class="job" id="${id}-job">${job}</div>
      <div class="nome" id="${id}-nome"${nome.length > 13 ? ' style="font-size:112px"' : ''}>${nome}</div>
      <div class="esp" id="${id}-esp">ESPECIAL: ${esp}</div>
      <div class="flash" id="${id}-flash"></div>
    </div>`);
  tw.push(`tl.fromTo('#${id}-flash', { opacity: 0.85 }, { opacity: 0, duration: 0.12, ease: 'power2.out' }, ${s});`,
    `tl.fromTo('#${id}-linhas', { x: 0 }, { x: -${Math.round(700 * nb)}, duration: ${dur}, ease: 'none' }, ${s});`,
    `tl.fromTo('#${id}-faixa', { x: -1300 }, { x: 0, duration: 0.16, ease: 'expo.out' }, ${s});`,
    `tl.fromTo('#${id}-img', { x: 420, filter: 'blur(14px)' }, { x: 0, filter: 'blur(0px)', duration: 0.18, ease: 'expo.out' }, ${s});`,
    `tl.fromTo('#${id}-img', { scale: 1 }, { scale: ${nb > 1 ? 1.06 : 1.03}, duration: ${(dur - 0.18).toFixed(3)}, ease: 'power1.out' }, ${(s + 0.18).toFixed(3)});`,
    `tl.fromTo('#${id}-job', { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.13, ease: 'power4.out' }, ${(s + 0.04).toFixed(3)});`,
    `tl.fromTo('#${id}-nome', { opacity: 0, x: -80, filter: 'blur(10px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.15, ease: 'expo.out' }, ${(s + 0.06).toFixed(3)});`,
    `tl.fromTo('#${id}-esp', { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'power2.out' }, ${(s + 0.12).toFixed(3)});`);
  t += nb * B;
});
const ELEN = +t.toFixed(3);
fs.writeFileSync(D + 'compositions/elenco.html', `<template>
  <style>${FONTS}
    #root{position:absolute;inset:0;overflow:hidden;background:#000}
    .card{position:absolute;inset:0;overflow:hidden;background:radial-gradient(ellipse at 72% 55%,color-mix(in srgb,var(--cor) 100%,#fff 18%),var(--cor) 45%,color-mix(in srgb,var(--cor) 45%,#000) 100%)}
    .linhas{position:absolute;top:0;left:0;width:4000px;height:1080px;background:repeating-linear-gradient(100deg,rgba(255,255,255,.16) 0 5px,transparent 5px 70px,rgba(0,0,0,.12) 70px 74px,transparent 74px 150px)}
    .faixa{position:absolute;left:-200px;top:0;width:1300px;height:1080px;background:rgba(8,6,14,.88);transform:skewX(-12deg);border-right:14px solid var(--cor)}
    .lutador{position:absolute;right:120px;bottom:20px;height:980px;width:auto;image-rendering:auto;transform-origin:50% 100%;filter:drop-shadow(18px 0 0 rgba(0,0,0,.35))}
    .num{position:absolute;left:120px;top:110px;font:28px/1 'Press Start 2P',monospace;color:rgba(255,255,255,.55)}
    .job{position:absolute;left:120px;top:430px;font:34px/1 'Press Start 2P',monospace;color:var(--cor);filter:brightness(1.25)}
    .nome{position:absolute;left:112px;top:490px;width:1080px;font:700 150px/1 OswaldLocal,sans-serif;white-space:nowrap;color:#fff;text-transform:uppercase;text-shadow:8px 8px 0 #000}
    .esp{position:absolute;left:120px;top:700px;width:840px;font:28px/1.5 'Press Start 2P',monospace;color:#f6c16a}
    .flash{position:absolute;inset:0;background:#fff;opacity:0}
  </style>
  <div id="root" data-composition-id="elenco" data-width="1920" data-height="1080">
${cards.join('\n')}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    ${tw.join('\n    ')}
    window.__timelines['elenco'] = tl;
  </script>
</template>
`);

// ---------- final: todo mundo junto + logo ----------
const FIM0 = +(T0 + ELEN).toFixed(3), TOTAL = 16.5, FD = +(TOTAL - FIM0).toFixed(3);
const L = b => +(beat(b) - FIM0).toFixed(3);           // batida em tempo local da cena
// fila da frente fixa (casal no meio); quem entrar novo em F vai para a fila de trás sozinho
const front = ['douglinhas','fidelis','arthur','lutador','nutri','lucas','duda','cardoso','ricardo'].filter(w => F.some(f => f[0] === w));
const back = F.map(f => f[0]).filter(w => !front.includes(w));
const row = (list, h, bottom, x0, gap, cls) => list.map((w, i) => `      <img id="fim-${w}" class="fim-lut ${cls}" src="assets/elenco/${w}_idle.png" alt="" style="height:${h}px;left:${x0 + i * gap}px;bottom:${bottom}px">`).join('\n');
const all = [...back, ...front];
fs.writeFileSync(D + 'compositions/fim.html', `<template>
  <style>${FONTS}
    #root{position:absolute;inset:0;overflow:hidden;background:#05040a}
    #fim-cam{position:absolute;inset:0}
    #fim-fundo{position:absolute;left:0;top:0;height:1080px;width:auto;image-rendering:pixelated}
    #fim-sombra{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,4,10,.92) 0%,rgba(5,4,10,.55) 45%,rgba(5,4,10,.7) 100%)}
    .fim-lut{position:absolute;width:auto;transform-origin:50% 100%}
    .tras{filter:brightness(.72)}
    #fim-logo{position:absolute;left:0;right:0;top:70px;text-align:center;font:124px/1.15 'Press Start 2P',monospace;color:#fff;text-shadow:10px 10px 0 #b3001b}
    #fim-barra{position:absolute;left:560px;width:800px;top:236px;height:12px;background:#d62828;transform-origin:50% 50%}
    #fim-sub{position:absolute;left:0;right:0;top:272px;text-align:center;font:36px/1.3 'Press Start 2P',monospace;color:#f6c16a}
    #fim-sub span{display:inline-block;margin:0 .35em}
    #fim-flash{position:absolute;inset:0;background:#fff;opacity:0}
  </style>
  <div id="root" data-composition-id="fim" data-width="1920" data-height="1080" data-layout-allow-overlap data-layout-allow-overflow>
    <div id="fim-cam">
      <img id="fim-fundo" src="assets/creia_back.webp" alt="">
      <div id="fim-sombra"></div>
${row(back, Math.min(370, 3800 / back.length), 300, 190, Math.round(1540 / Math.max(1, back.length - 1)), 'tras')}
${row(front, 500, 10, 230, 182, 'frente')}
    </div>
    <div id="fim-logo" class="clip" data-start="${L(28)}" data-duration="${(FD - L(28)).toFixed(3)}">CREIA FIGHT</div>
    <div id="fim-barra" class="clip" data-start="${L(28)}" data-duration="${(FD - L(28)).toFixed(3)}"></div>
    <div id="fim-sub" class="clip" data-start="${L(30)}" data-duration="${(FD - L(30)).toFixed(3)}"><span id="fim-w1">Deus,</span><span id="fim-w2">fé</span><span id="fim-w3">e</span><span id="fim-w4">muita</span><span id="fim-w5">resenha</span></div>
    <div id="fim-flash"></div>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.fromTo('#fim-fundo', { x: -600 }, { x: -1000, duration: ${FD}, ease: 'none' }, 0);
    ${all.map((w, i) => `tl.fromTo('#fim-${w}', { xPercent: -50, y: 700 }, { xPercent: -50, y: 0, duration: 0.36, ease: 'back.out(1.3)' }, ${(i < back.length ? 0.04 + i * 0.03 : 0.2 + (i - back.length) * 0.035).toFixed(3)});`).join('\n    ')}
    tl.set('#fim-flash', { opacity: 0.9 }, 0); tl.to('#fim-flash', { opacity: 0, duration: 0.2, ease: 'power2.out' }, 0);
    tl.set('#fim-flash', { opacity: 0.95 }, ${L(28)}); tl.to('#fim-flash', { opacity: 0, duration: 0.35, ease: 'power2.out' }, ${L(28)});
    tl.fromTo('#fim-logo', { scale: 2.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'expo.out' }, ${L(28)});
    tl.fromTo('#fim-barra', { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'expo.out' }, ${(L(28) + 0.12).toFixed(3)});
    ${[[-22,12],[18,-10],[-12,8],[8,-4],[-4,2],[0,0]].map((s, i) => `tl.to('#fim-cam', { x: ${s[0]}, y: ${s[1]}, duration: 0.033, ease: 'none' }, ${(L(28) + i * 0.033).toFixed(3)});`).join('\n    ')}
    ${[1,2,3,4,5].map(i => `tl.fromTo('#fim-w${i}', { opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.13, ease: 'power4.out' }, ${(L(30) + (i - 1) * 0.1).toFixed(3)});`).join('\n    ')}
    window.__timelines['fim'] = tl;
  </script>
</template>
`);

// ---------- raiz ----------
fs.writeFileSync(D + 'index.html', `<!doctype html>
<html lang="pt-BR" data-resolution="landscape">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <title>Creia Fight — Abertura</title>
  <script src="assets/vendor/gsap.min.js"></script>
  <style>*{box-sizing:border-box;margin:0}html,body{width:1920px;height:1080px;overflow:hidden;background:#000}</style>
</head>
<body>
  <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-fps="30" data-width="1920" data-height="1080">
    <div id="abre" class="clip" data-composition-id="abre" data-composition-src="compositions/abre.html" data-start="0" data-duration="${T0}" data-track-index="0" data-track-kind="graphics" data-width="1920" data-height="1080"></div>
    <div id="elenco" class="clip" data-composition-id="elenco" data-composition-src="compositions/elenco.html" data-start="${T0}" data-duration="${ELEN}" data-track-index="0" data-track-kind="graphics" data-width="1920" data-height="1080"></div>
    <div id="fim" class="clip" data-composition-id="fim" data-composition-src="compositions/fim.html" data-start="${FIM0}" data-duration="${FD}" data-track-index="0" data-track-kind="graphics" data-width="1920" data-height="1080"></div>
    <audio id="musica" src="assets/musica.m4a" data-start="0" data-duration="${TOTAL}" data-track-index="1" data-volume="1" data-fade-out="1.4"></audio>
  </div>
  <script>
    window.__timelines = window.__timelines || {};
    window.__timelines['main'] = gsap.timeline({ paused: true });
  </script>
</body>
</html>
`);
console.log({ T0, ELEN, FIM0, FD, logo: beat(28), sub: beat(30) });
