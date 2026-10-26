# Origem dos recursos do Fidelis v1

Referências definitivas fornecidas pelo usuário: `referencias-artes/personagens/fidelis/`.
Atlas gerado com a ferramenta integrada **imagegen**, em duas chamadas, com fundo
transparente. `atlas.png` é o resultado original; `atlas.webp` é sua conversão sem
perdas pelo FFmpeg. A engine seleciona as poses por retângulos desse atlas.

## Prompt de criação

Use case: identity-preserve / background-extraction. Asset: a SINGLE production game sprite atlas on a truly transparent background, 1536x1024, 3 columns x 2 rows of equal 512x512 cells. Reference 1 is definitive identity and default pose. References 2-5 supply action poses. Preserve this exact Brazilian male pixel-art character: brown skin, short dense curly black hair, short beard, dark navy open jacket over black shirt, black jeans and black shoes, cyan electric BASS GUITAR with 4 strings. Same chunky crisp hard-edged pixel illustration as reference 1, same head/body ratio, no realistic rendering. All six full-body poses at consistent scale and centered in their respective cells with empty margins, nothing overlaps another cell, no grid lines, no text, no decorations. Left-to-right top row: 1) IDLE facing right holding black game controller, cyan bass strapped on back (reference1). 2) GUARD facing right holding the bass vertically like a shield as reference2. 3) WINDUP facing right, pulls bass above and behind shoulder, about to swing, reference5. Left-to-right bottom row: 4) IMPACT facing right, powerful two-handed downward side swing using the bass body as a club (reference3). 5) SPIN BACK, torso twists left, swings the bass around his back towards left with bent knees, a distinctly different fully drawn pose. 6) SPIN FRONT torso turns right driving the bass horizontally towards right as reference4, distinct follow-through. Give the pose silhouettes energy with real bent elbows, shoulder rotation, jacket motion and planted/braced legs; preserve recognizable face and instrument in every pose. Strip ALL street backgrounds, ground shadows, energy arcs, white streaks, rubble and effects from the reference art: only character, bass, strap and controller are opaque. Strictly isolated true transparent alpha background. Six separate characters, exactly one per cell, equal baseline for standing poses with enough head and instrument margin. No words or labels.

## Prompt da revisão escolhida

Edit target: this exact single RGBA game sprite atlas. Preserve all six character designs, faces, clothes, bass guitar, six poses and pixel art. Change ONLY spacing/scaling so every entire character AND ENTIRE BASS fit STRICTLY inside its own 512x512 tile with 28px clear transparent margin on EVERY side. Output remains exactly1536x1024 3 columns x 2 rows, true transparent alpha. The bottom-left bass currently crosses into the bottom-middle tile: fix by making the entire bottom-left sprite smaller enough to fit; no anatomy or instrument clipping. Likewise keep bottom-right entire guitar inside canvas with padding. Make ALL SIX characters consistently scaled to the same approximate body size, standing figure height about420px. No glow, shadow or background visible; background alpha zero. Do not add grid lines, words, new poses, or effects. Only rearrange/scale within their original cells to produce a clean game atlas with no sprites touching or crossing cell boundaries. Each sprite centered horizontally in its own cell, feet baseline aroundcell y480.

A revisão ainda ultrapassou a célula inferior esquerda em alguns pixels. Os
retângulos de leitura de `js/fidelis-visual.js` acomodam as larguras reais, mantendo
inteiro o corpo do baixo. Não se pressupõe uma divisão uniforme na linha inferior.

## Áudio

Texto: **Inversão de acooordee!** Voz sintética provisória para avaliação, gerada
localmente pelo Kokoro-82M, voz `pm_alex`, idioma `pt-br`, velocidade 1.1, com o
comando `hyperframes tts`. Não é uma gravação nem clonagem de Fidelis.
Foi aplicado `atempo=0.8`, passa-altas de 100 Hz, reforço de graves, compressão e
limitação. O grito e os efeitos têm faixas separadas para respeitar os volumes do jogo.
Os efeitos foram sintetizados localmente com senos amortecidos e ruído com semente
fixa 81: entrada do baixo em 1.14 s, passagem em 1.55 s e impacto em 2.27 s.

## V2 — arremesso preservando a identidade

Nova tira `arremesso.png` (2172×724), convertida sem perdas para `arremesso.webp`.
Ferramenta integrada imagegen, usando o atlas v1 e `fidelis-base.jpeg` como referências.
As outras seis poses do atlas v1 não foram redesenhadas.

Prompt:

Use case: identity-preserve. ONE transparent production sprite animation strip for a pixel-art game, exactly1536x512, three equal512x512 cells arranged horizontally, with32px transparent gutters inside every cell. Reference1 TOP LEFT character is the exact locked identity and art style to preserve; reference2 is original identity support. Do NOT redesign. Keep precisely the same face, curly short black hair, short beard, brown skin, dark navy open jacket, black shirt, black jeans, black shoes, body proportions and cyan 4-string bass slung ON HIS BACK. FULL-BODY side/three-quarter view facing RIGHT. The animation is throwing a small black gamepad, NEVER swinging the bass. Frame1, left: windup, holds a small BLACK VIDEO GAME CONTROLLER in right hand beside/behind shoulder, elbow bent ready to throw, left arm balances. Frame2,middle: RELEASE, right arm whips forward and is fully extended to right at chest height, fingers now OPEN AND EMPTY, controller has just left his hand and is NOT DRAWN (game engine supplies projectile), slight forward torso rotation, left arm trails. Frame3,right: recovery/follow-through, right arm still forward but relaxed, hand EMPTY, torso settling back, knees braced, bass remains on back. Feet at same baseline y480, body consistently centered and equally scaled across all three cells, standing figure approx430px high, no cropping. KEEP THE EXACT original reference1 top-left face, clothes, cyan bass and hard-edged chunky pixel illustration; do not smooth into vector/cel-shaded art. No glowing background, no shadows, no scenery, no streaks, no floating gamepad in frames2-3, no words, no grid. Genuine transparent alpha around every figure. Exactly3 full-body poses, one per cell, crisp pixel art preserving identity.

A passada usa recortes do próprio atlas v1 em canvas: tronco/quadril, coxas e
canelas. O pé de apoio determina a altura do corpo e os recortes se sobrepõem
nas juntas. Não foi substituída a identidade visual para fazer a caminhada.

## V3 — correção da defesa de impacto

Arquivo exclusivo `defesa-impacto-v3.png` (1084×1451), convertido sem perdas para
`defesa-impacto-v3.webp`. A pose incorreta do atlas deixou de ser usada na defesa.
Fonte única: `referencias-artes/personagens/fidelis/fidelis-defesa.jpg`.
Ferramenta integrada imagegen, modo de extração de fundo. A defesa é desenhada com
escala uniforme de 80/1314, sem rotação ou alongamento do instrumento. Âncora dos
pés no recorte: (490, 1406).

Prompt:

Use case: background-extraction. Edit target: the single provided original pixel-art Fidelis defending image. Produce ONE clean transparent-background full-body cutout of EXACTLY this original character, his hands and the instrument IN THIS EXACT POSE. This is extraction, NOT redesign. Preserve face, hairstyle, clothes, pixel art, body proportions, all original details and most critically the precise silhouette, dimensions, orientation and hand positions of the CYAN BASS. The BASS BODY is UPPER RIGHT BESIDE HIS FACE, its NECK points straight DOWN toward his right thigh, with the neck/headstock BELOW the bass body. Do NOT invert the instrument. It is held upside-down as a shield exactly as in the original. One hand grips near the upper/body area and the other wraps around its right edge. Keep the controller at his belt, original wide braced stance and both whole shoes. Remove ONLY the street/building/ground background and ground shadow. Maintain the original aspect ratio 896:1200, with the full figure centered and 24px clear transparent margins; do not crop hair, bass or shoes. No new scenery, no glow, no extra parts, no added strings or invented instrument shapes, no flipped orientation, no wind effects, no text. True RGBA transparency. The supplied original is the sole authority: match its exact upward cyan bass body and downward neck rather than any ordinary bass-playing pose.

O furacão do especial é desenhado em canvas com faixas de vento e poeira em pixel
art, em duas camadas. Ativo apenas entre 0.26 e 1.8 s do especial, usando o tempo
local e a posição do personagem. Não acrescenta dano nem altera hitboxes.
