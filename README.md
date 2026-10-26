# 🥊 Creia Fight

> Beat 'em up 2.5D e jogo de luta em pixel art, feito em JavaScript puro sobre HTML5 Canvas. Sem frameworks, sem engine pronta e sem dependências no navegador.

🌐 **Jogar:** [bangu.kryventech.com.br](https://bangu.kryventech.com.br/)

A galera da igreja Creia, de Bangu (Rio de Janeiro), sai na porrada contra a **Fome**, as **Calorias** e a **Gordura Trans**. São 20 lutadores, 10 fases pelas ruas do bairro e 10 chefões "Podrão". Dá para jogar a aventura em até 4 pessoas ou se enfrentar no X1, no mesmo aparelho ou online.

---

## 🎮 Modos de jogo

| Modo | Como funciona |
|---|---|
| **Aventura** | De 1 a 4 jogadores no mesmo aparelho. Com um jogador só, os outros lutadores do time são controlados pela IA, que segue quem está jogando. A dificuldade cresce com o tamanho do time. São 10 fases com rolagem lateral e um chefão no fim de cada uma. |
| **X1 local** | Um contra um, em melhor de 3 rounds, contra um amigo ou contra a IA (fácil, médio ou difícil). |
| **X1 online** | Uma pessoa cria a sala e a outra entra com o código de 5 letras. Se a conexão cair, dá para voltar à mesma partida. Tem ranking. |

### O gato de rua

Em cada fase existe um **gato de rua**, que funciona como checkpoint. Fazer carinho nele (tecla **E** perto do gato) levanta quem caiu e recupera um pouco da vida do time.

### Instalação no celular

O jogo é um PWA: dá para instalar na tela inicial e jogar em tela cheia. No celular aparecem um joystick analógico e os botões de ação na tela.

---

## ⌨️ Controles

| Ação | Jogador 1 | Jogador 2 |
|---|---|---|
| Andar | W A S D | Setas |
| Ataque principal | J | Numpad 1 ou `,` |
| Pular | K | Numpad 2 ou `.` |
| Especial (com a barra cheia) | L | Numpad 3 ou `/` |
| Ataque secundário | I ou U | Numpad 4 ou `;` |
| Defesa / carinho no gato | E | Numpad 0 ou `'` |
| Pausa | P | — |

**Defesa:** a guarda segura os golpes que vêm de frente e empurra para trás quem bate de perto. Golpe pelas costas fura a defesa.

**Especiais:** os especiais que causam dano congelam a tela com uma cena de destaque. No X1, só se defende de um especial quem já estava de guarda **antes** da cena começar.

---

## 👥 Lutadores

Todo lutador tem três golpes:

- **ataque principal**;
- **ataque secundário**, que tem tempo de recarga;
- **especial**, que só pode ser usado com a barra cheia.

Quem ataca de longe dá um golpe de perto quando o inimigo está colado na frente.

| # | Lutador | Profissão | Ataque principal | Ataque secundário | Especial |
|---|---|---|---|---|---|
| 1 | **Bispo André** | Bispo | Bíblia girando em arco | Oração: recupera 5 de vida | **"INDESCULPÁVEIS!"**: grita no microfone e chove bola de fogo do céu, na diagonal, sobre os adversários |
| 2 | **Lucas Garcia** | CreiaCast | Microfone do CreiaCast girando | Fralda cagada: arremessa o inimigo longe | **"PORCOS NA SALA!"**: os alvos ficam rodando e perdendo vida, enquanto ele já pode andar e bater |
| 3 | **Marcos Felipe** | Lutador | Combo de socos (muay thai); no ar, voadora | Halter arremessado, que puxa o inimigo para perto | **Solo de guitarra**: escudo por 9 s e golpes fortalecidos. Na aventura, se a Lorrany estiver no time, ela vira **Hiper-Nutri** |
| 4 | **Douglas Feijó** | Cavaquinista | Claves de sol e de fá, que voam ondulando (alcance curto) | Arremessa o cavaquinho girando, que atravessa os inimigos | **"Farmar aura"**: close no rosto pegando fogo, e todo monstro à vista queima |
| 5 | **Rafinha** | Baterista | Pratos de ataque e de condução, alternados | Investida rápida com invencibilidade curta | **"4, 4, 5, 6 e 1… CHUVA DE PRATO!"**: conta no close e chovem pratos do céu |
| 6 | **Duda Souza** | Cantora | Choques do microfone até meia distância | Pose fashion: recupera 30 de vida (recarga de 30 s) | **"CORAM DEO"**: os céus se abrem e ela recupera 50% da vida (na aventura, o time inteiro) |
| 7 | **Lucas Cardoso** | Baixista | Slap no baixo: onda grave de curto alcance | Barrigada | **"LIMADOS COM SUCESSO!"**: proteção total por 5 s (na aventura, protege o time inteiro) |
| 8 | **Fidelis** | Gamer | Controle de videogame arremessado | Pancada de perto | **"Inversão de acorde"**: giros do contrabaixo que avançam pela tela, com uma pancada final |
| 9 | **Pedro Guilherme** | Tecladista | Semínimas disparadas pelo teclado | Disparo curto e forte do teclado, com onda de equalizador | **"Harmonia bizarramente torta"**: raio arco-íris que atravessa a tela |
| 10 | **Naju** | Cantora | Microfone no fio: vai e volta, acerta na ida e na volta e puxa o inimigo | Gira o microfone em volta de si | **Grito no microfone**: ondas de som atravessam a tela e atordoam todo mundo |
| 11 | **Enzo Gabriel** | Basquete e música | Bola de basquete que quica | Arremesso de três: vai alto e bate mais forte | **Chuva de basquete**: tempestade de bolas de basquete atravessando a tela |
| 12 | **Grazi** | Professora | Pistola de cola quente: o inimigo grudado fica lento | Furacão girando | **"VÃO, MINHAS CRIANÇAS!"**: as crianças saem correndo e atropelam os monstros |
| 13 | **Thiago (TH)** | Repórter | Gravação "REC" | iPhone arremessado em arco, que atravessa os inimigos | **Anúncios da semana**: depois dos anúncios, uma TV OLED cai sobre o adversário |
| 14 | **Douglinhas** | Tricolor | Chute de bola de futebol, que quica | Tapa que lança o inimigo para o meio da tela | **"QUE TENHAMOS LÁGRIMAS!"**: os céus se abrem e uma cruz gigante cai sobre o alvo |
| 15 | **Lorrany** | Nutricionista | Frutas variadas arremessadas | Pancada com a xícara de café | **"RESTRIÇÃO ALIMENTAR, LOW CARB!"**: come a maçã e drena 20% da vida dos adversários à vista, recuperando 20% da dela |
| 16 | **Arthur** | Cantor | Canto: ondinha sonora curta que empurra para trás | Come bolo: recupera 20 de vida | **"VÁ ESTUDAR"**: fica 3x mais rápido (na aventura, o time inteiro) |
| 17 | **Lohan** | Fotógrafo | Flash do celular na ponta do estabilizador, que ofusca de perto | Câmera voadora que persegue o inimigo mais próximo | **Super flash**: três flashes estouram a tela e machucam todo monstro à vista |
| 18 | **Emanuelly** | Estudante | Lápis ou caneta, reto e rápido, que atravessa um inimigo | Borracha em arco, que atordoa mais | **Redação nota mil**: ela lê a redação e as letras chovem sobre os inimigos |
| 19 | **Ricardo** | Karatê e louvor | Soco | Rolagem pelo chão, acertando quem estiver no caminho | **"NÃO HÁ FERROLHOS… NEM PORRRTAAAAS!"**: despenca do céu com uma porta sobre o adversário |
| 20 | **Adriene** | Confeiteira | Brigadeiro arremessado em arco curto | Colher de pau, que empurra o inimigo longe | **"É HORA DO BRIGADEIRO!"**: os ingredientes voam e prendem todo mundo na tela num brigadeiro gigante, que vai tirando vida |

A Adriene é cadeirante. Ela anda com as mãos nos aros, as rodas girando, e no pulo empina a cadeira nas rodas de trás.

---

## 🗺️ Fases

| # | Fase |
|---|---|
| 1 | Figueiredo Camargo 1233 |
| 2 | Praça Guilherme da Silveira |
| 3 | Bangu Shopping |
| 4 | Largo de Bangu |
| 5 | Calçadão de Bangu |
| 6 | Estádio de Moça Bonita |
| 7 | Plataforma do trem |
| 8 | Rua Bela Flor |
| 9 | Serra do Mendanha |
| 10 | Quiosque do Geleia |

### Inimigos

Os monstros são comidas que ganharam vida:
- pastel, brigadeiro, salsicha, pipoca, sorvete, donut e chips;
- nugget, milkshake, pizzinha, açúcar, bala e churros.

A **Gordura Trans** se defende e precisa ter a guarda quebrada. Pelo caminho também aparecem bichos de rua que atrapalham.

### Chefões Podrão

1. O X-Tudo Furioso
2. O Cachorro-Quente Turbinado
3. O Pastelão de Feira Encharcado
4. A Batata Frita Tsunami
5. A Pizza Gigante de Calabresa
6. O Churrasquinho de Gato Mutante
7. O Açaí Hipercalórico
8. A Torre de Salgadinhos
9. O Caldo de Cana
10. O Imperador Podrão de Bangu

---

## ⚙️ O motor

Tudo roda em JavaScript puro, sem build, sem bundler e sem biblioteca no navegador. O servidor online usa só a biblioteca padrão do Node.js. Esta seção explica as peças, para quem quiser estudar ou criar o seu próprio jogo do zero com a mesma base.

### Tela e laço principal

- **Resolução lógica:** a tela tem resolução fixa de **480×270**, ampliada sem suavização (pixel art nítida) e ajustada para caber em qualquer tela.
- **Laço:** um único `requestAnimationFrame` atualiza a simulação com `dt` em segundos e desenha tudo no mesmo Canvas 2D.
- **Cenas:** o jogo funciona como uma máquina de cenas: título, menu, seleção, jogo, X1, online e fim de jogo.

### Mundo 2.5D

Cada entidade tem três coordenadas:
- `x`: posição horizontal na fase;
- `y`: profundidade, numa faixa do chão;
- `z`: altura do pulo, com gravidade.

Os golpes só acertam quem está numa faixa parecida de `y`. Um projétil reto passa por baixo de quem está pulando. O desenho é ordenado por `y`, então quem está mais à frente cobre quem está atrás.

### Estados de lutador

Cada lutador é uma máquina de estados: `idle`, `walk`, `jump`, `attack1`, `attack2`, `throw`, `guard`, `hurt`, `special`, `ko` e estados próprios de alguns personagens.

O contador de tempo do estado (`st`) controla quando o golpe acerta, quando termina e qual quadro da arte aparece. Assim, a mesma lógica serve para humano, IA e partida online.

### Combate

| Peça | Como funciona |
|---|---|
| **Regras num lugar só** | `js/combate-config.js` guarda recarga, dano e alcance do ataque principal e do secundário de cada lutador, além dos níveis da IA. Aventura, X1, IA e a ficha de atributos da seleção leem dessa mesma tabela. |
| **Golpes de perto** | Cada golpe define duração, momento do acerto, dano, alcance, empurrão e atordoamento. |
| **Projéteis** | Cada projétil é um objeto com velocidade, gravidade, vida útil, quantos inimigos atravessa e a lista de quem já acertou (para não bater duas vezes). |
| **Especiais** | O especial abre uma cena de destaque e congela a ação. Depois aplica o efeito: dano em área, dreno de vida, cura, escudo, velocidade ou prisão. No X1, o dano total de um especial tem teto, para não decidir a luta sozinho. |
| **Defesa** | A guarda tem vida própria e recarga, e só protege a frente. |

### Desenho dos personagens

- **Base:** `js/rig.js` desenha os lutadores por partes (tronco, cabeça, braços, pernas) com pivôs e ângulos por pose.
- **Arte própria:** os personagens com arte própria se encaixam por cima com um **adaptador**. Cada `js/artes-*.js` "embrulha" as funções de desenho do Rig (`draw`, `big`, `portrait`, `ready`) e responde só pelo seu lutador, repassando o resto para o próximo da corrente.
- **Novo personagem:** para criar um lutador novo sem tocar no desenho dos outros, basta acrescentar um adaptador.
- **Caminhada:** a passada é feita cortando as pernas da arte abaixo da virilha e balançando em faixas, ou girando a perna em volta do quadril.
- **Peso das artes:** as artes ficam em WebP. Os arquivos `*-assets-*.js` trazem as imagens embutidas, para carregar tudo de uma vez.

### Som

Os efeitos sonoros são sintetizados na hora com a Web Audio API (osciladores e ruído), sem arquivos de áudio. As exceções são as músicas do menu e do X1 e alguns efeitos do Fidelis.

### IA

A IA dos companheiros e dos adversários lê o mesmo estado que o jogador vê:
- distância, profundidade e se está encurralada;
- recarga dos golpes e barra de especial.

Ela decide entre aproximar, recuar, atacar, defender ou soltar o especial. Os níveis fácil, médio e difícil mudam o tempo de reação, a frequência de defesa e o erro de posicionamento.

### Online

- **Servidor:** `server/index.js` é um servidor WebSocket escrito à mão (RFC 6455, só com a biblioteca padrão do Node). Ele só **repassa mensagens** entre os dois jogadores da sala e guarda o ranking.
- **Simulação:** quem cria a sala **simula a partida**. Quem entra manda só os comandos e recebe instantâneos (snapshots) do estado. Para não sentir atraso, o visitante prevê o próprio movimento até o próximo instantâneo chegar. Quando a rede permite, os dois aparelhos se ligam direto por WebRTC, e o servidor fica só como ponte e reserva.
- **Reconexão:** um token secreto por jogador permite voltar à mesma sala se a conexão cair.

### Abertura

O vídeo de abertura foi feito com **HyperFrames**: composições em HTML animadas com GSAP, que o próprio CLI renderiza em MP4. As fontes estão em `cutscenes/abertura/`.

---

## 📁 Estrutura

```
index.html / jogo.html   página do jogo
manifest.webmanifest     PWA
sw.js                    service worker (cache para jogar offline)
js/
  game.js                simulação: cenas, física 2.5D, combate, especiais, IA, online
  combate-config.js      números do combate (dano, alcance, recarga) e níveis da IA
  rig.js                 desenho por partes dos lutadores
  artes-*.js             adaptadores de arte de cada lutador
  *-visual.js            efeitos e cenas dos especiais
  viloes.js / bosses.js  inimigos e chefões
  backgrounds.js         fases e parallax
  cenarios-arte.js       fundos ilustrados das fases
  interface.js           tela de seleção e ficha de atributos
  online.js              cliente do X1 online
  abertura.js            vídeo de abertura
assets/                  artes, fundos, sons e vídeo
server/index.js          servidor WebSocket (salas do X1 e ranking)
cutscenes/abertura/      projeto HyperFrames do vídeo de abertura
tests/                   testes automatizados em Node, sem navegador
```

## ▶️ Rodar no seu computador

Não tem instalação nem build: o jogo é um site estático.

```bash
python3 -m http.server 8765     # ou qualquer servidor estático
# abra http://localhost:8765
```

O X1 online precisa do servidor. Para testar, rode `node server/index.js` (Node 18 ou mais novo).

---

## 📄 Licença

O **código** é aberto sob a licença [MIT](LICENSE): pode estudar, copiar, modificar e usar no seu próprio jogo, mantendo o aviso de copyright.

As **artes não entram na licença** (veja [LICENCA-ARTES.md](LICENCA-ARTES.md)). Os personagens são inspirados em pessoas reais da comunidade Creia, então nomes, imagens, sprites, fundos, vídeo de abertura, músicas e falas são todos os direitos reservados. Para criar o seu jogo, use o motor com as suas próprias artes.
