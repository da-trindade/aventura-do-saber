/* =====================================================================
   Aventura do Saber · banco de perguntas (versão 1.0)

   Este arquivo guarda só o conteúdo pedagógico. Para revisar uma pergunta,
   altere aqui; a lógica do jogo (jogo.js) não precisa mudar.

   Campos de cada pergunta
   - id, nivel ........ identificação e nível (facil, medio, dificil)
   - area, assunto, habilidade, bncc ... vínculo pedagógico pedido pela Secretaria
   - tipo ............. "numero" (botões com números), "imagem" (cartões com
                        imagens) ou "arrastar" (arrastar e soltar)
   - comando .......... texto mostrado na tela (o mesmo que a voz fala)
   - audio ............ arquivos da pasta audio/ tocados em sequência
   - realce ........... (opcional) para cada parte do áudio, qual alternativa
                        acende enquanto a palavra é dita
   - cena ............. o que aparece acima das alternativas
   - alternativas ..... na ordem em que aparecem na tela
   - correta .......... posição da resposta certa (0 = esquerda, 1 = centro,
                        2 = direita). O banco tem 7 corretas em cada posição.
   - reforco, audioReforco ... frase da tela de acerto
   - acerto ........... (opcional) imagem da tela de acerto

   Imagens: só o nome do arquivo, sem pasta e sem extensão (img/<nome>.webp).
   Posições em camadas (x, y, w): porcentagens do quadro da imagem.
   ===================================================================== */

(function () {
"use strict";

window.NIVEIS = [
  {
    id: "facil", nome: "Nível Fácil", curto: "Fácil", cor: "#4CC38A",
    audio: "nivel-facil", audioFim: "fim-facil",
    linha1: "Vamos começar!",
    linha2: "Temos 7 desafios divertidos. Você consegue!",
    fala: "Observe com atenção e escute cada pergunta."
  },
  {
    id: "medio", nome: "Nível Médio", curto: "Médio", cor: "#F4A300",
    audio: "nivel-medio", audioFim: "fim-medio",
    linha1: "Que legal, você chegou até aqui!",
    linha2: "Temos mais 7 desafios.",
    fala: "Observe com atenção e escute cada pergunta."
  },
  {
    id: "dificil", nome: "Nível Difícil", curto: "Difícil", cor: "#EC6F9A",
    audio: "nivel-dificil", audioFim: "fim-dificil",
    linha1: "Agora vêm os grandes desafios!",
    linha2: "Temos mais 7.",
    fala: "Vá com calma e escute cada pergunta."
  }
];

/* Peças reaproveitadas nas montagens */
const CAMA = "cama", URSINHO = "ursinho", ARVORE = "arvore", COELHO = "coelho";
const fundo = (img, alt) => ({ img: img, alt: alt, x: 0, y: 0, w: 100, h: 100, fundo: true });

window.PERGUNTAS = [
  /* ============================ NÍVEL FÁCIL ============================ */
  {
    id: "F01", nivel: "facil",
    area: "Contagem e quantidades", assunto: "Contagem até 5",
    habilidade: "Contar até 5 e relacionar número e quantidade", bncc: "EI03ET07",
    tipo: "numero",
    comando: "Quantas maçãs aparecem na tela?",
    audio: ["f01-comando"],
    cena: { tipo: "imagem", img: "f01-tres-macas", alt: "três maçãs", largo: true },
    alternativas: ["3", "4", "5"], correta: 0,
    reforco: "Há 3 maçãs na tela.", audioReforco: "f01-reforco"
  },
  {
    id: "F02", nivel: "facil",
    area: "Contagem e quantidades", assunto: "Contagem até 5 em duas linhas",
    habilidade: "Contar até 5 elementos organizados em duas linhas", bncc: "EI03ET07",
    tipo: "numero",
    comando: "Quantos balões estão voando?",
    audio: ["f02-comando"],
    cena: { tipo: "repetir", img: "balao", alt: "balão", linhas: [3, 2] },
    alternativas: ["3", "4", "5"], correta: 2,
    reforco: "Há 5 balões voando.", audioReforco: "f02-reforco"
  },
  {
    id: "F03", nivel: "facil",
    area: "Noções espaciais", assunto: "Dentro",
    habilidade: "Reconhecer a posição \"dentro\"", bncc: "EI02ET04 (consolidação)",
    tipo: "imagem",
    comando: "Em qual imagem o gato está dentro da caixa?",
    audio: ["f03-comando"],
    alternativas: [
      { img: "f03-gato-dentro-caixa", alt: "gato dentro da caixa" },
      { img: "f03-gato-em-cima-caixa", alt: "gato em cima da caixa fechada" },
      { img: "f03-gato-ao-lado-caixa", alt: "gato ao lado da caixa" }
    ],
    correta: 0,
    reforco: "O gato está dentro da caixa.", audioReforco: "f03-reforco"
  },
  {
    id: "F04", nivel: "facil",
    area: "Noções espaciais", assunto: "Em cima",
    habilidade: "Reconhecer a posição \"em cima\"", bncc: "EI02ET04 (consolidação)",
    tipo: "imagem",
    comando: "Em qual imagem o ursinho está em cima da cama?",
    audio: ["f04-comando"],
    alternativas: [
      /* embaixo: o ursinho vem antes da cama na lista, para ficar atrás dela */
      { alt: "ursinho embaixo da cama", camadas: [
        { img: URSINHO, alt: "ursinho", x: 26.6, y: 67, w: 23 },
        { img: CAMA, alt: "cama", x: 4, y: 6.2, w: 92 } ] },
      { alt: "ursinho ao lado da cama", camadas: [
        { img: CAMA, alt: "cama", x: 1, y: 18, w: 72 },
        { img: URSINHO, alt: "ursinho", x: 74, y: 63, w: 24 } ] },
      { alt: "ursinho em cima da cama", camadas: [
        { img: CAMA, alt: "cama", x: 4, y: 6.2, w: 92 },
        { img: URSINHO, alt: "ursinho", x: 37.4, y: 15.3, w: 23 } ] }
    ],
    correta: 2,
    reforco: "O ursinho está em cima da cama.", audioReforco: "f04-reforco"
  },
  {
    id: "F05", nivel: "facil",
    area: "Animais e seus habitats", assunto: "Animais aquáticos",
    habilidade: "Associar um animal aquático ao seu ambiente", bncc: "EI03ET03 (aproximação)",
    tipo: "imagem",
    comando: "Onde o peixe vive?",
    audio: ["f05-comando"],
    cena: { tipo: "imagem", img: "peixe", alt: "peixe" },
    alternativas: [
      { img: "ambiente-floresta", alt: "floresta", cobrir: true },
      { img: "ambiente-mar", alt: "água", cobrir: true },
      { img: "ambiente-deserto", alt: "deserto", cobrir: true }
    ],
    correta: 1,
    reforco: "O peixe vive na água.", audioReforco: "f05-reforco",
    acerto: { camadas: [fundo("ambiente-mar", "água"), { img: "peixe", alt: "peixe", x: 22, y: 30, w: 56 }] }
  },
  {
    id: "F06", nivel: "facil",
    area: "Animais e seus habitats", assunto: "Animais da floresta",
    habilidade: "Reconhecer um animal que vive na floresta", bncc: "EI03ET03 (aproximação)",
    tipo: "imagem",
    comando: "Qual destes animais vive na floresta?",
    audio: ["f06-comando"],
    cena: { tipo: "imagem", img: "ambiente-floresta", alt: "floresta", moldura: true },
    alternativas: [
      { img: "macaco", alt: "macaco" },
      { img: "peixe", alt: "peixe" },
      { img: "pinguim", alt: "pinguim" }
    ],
    correta: 0,
    reforco: "O macaco vive na floresta.", audioReforco: "f06-reforco",
    acerto: { camadas: [fundo("ambiente-floresta", "floresta"), { img: "macaco", alt: "macaco", x: 24, y: 26, w: 52 }] }
  },
  {
    id: "F07", nivel: "facil",
    area: "Consciência silábica", assunto: "Palavras de 2 sílabas",
    habilidade: "Perceber que uma palavra tem 2 sílabas", bncc: "Campo Escuta, fala, pensamento e imaginação",
    tipo: "numero",
    comando: "Quantos pedacinhos você ouviu?",
    audio: ["f07-comando"],
    cena: { tipo: "palavra", img: "bola", alt: "bola", texto: "BO - LA" },
    alternativas: ["1", "2", "3"], correta: 1,
    reforco: "BO-LA tem 2 pedacinhos.", audioReforco: "f07-reforco"
  },

  /* ============================ NÍVEL MÉDIO ============================ */
  {
    id: "M01", nivel: "medio",
    area: "Contagem e quantidades", assunto: "Contagem até 7",
    habilidade: "Contar até 7 elementos distribuídos", bncc: "EI03ET07",
    tipo: "numero",
    comando: "Quantas joaninhas aparecem?",
    audio: ["m01-comando"],
    cena: { tipo: "repetir", img: "joaninha", alt: "joaninha", linhas: [4, 3] },
    alternativas: ["5", "6", "7"], correta: 2,
    reforco: "Há 7 joaninhas.", audioReforco: "m01-reforco"
  },
  {
    id: "M02", nivel: "medio",
    area: "Contagem e quantidades", assunto: "Sequência numérica",
    habilidade: "Identificar o número que falta numa sequência", bncc: "EI03ET07",
    tipo: "numero",
    comando: "Qual número está faltando no trenzinho?",
    audio: ["m02-comando"],
    cena: { tipo: "trem", vagoes: [4, 5, null, 7] },
    alternativas: ["6", "8", "9"], correta: 0,
    reforco: "4, 5, 6, 7: faltava o 6!", audioReforco: "m02-reforco",
    acerto: { tipo: "trem", vagoes: [4, 5, 6, 7], destaque: 2 }
  },
  {
    id: "M03", nivel: "medio",
    area: "Noções espaciais", assunto: "Embaixo",
    habilidade: "Colocar um objeto embaixo de outro", bncc: "EI02ET04 (consolidação)",
    tipo: "arrastar",
    comando: "Arraste a bola para embaixo da cadeira.",
    audio: ["m03-comando"],
    cena: {
      base: { img: "cadeira", alt: "cadeira", x: 31, y: 4, w: 33 },
      objeto: { img: "bola", alt: "bola", x: 5, y: 60.5, w: 9 }
    },
    /* Áreas onde a bola pode ser solta (x, y, w, h em % da cena) e
       onde ela fica depois de solta (bola: x, y do canto superior esquerdo) */
    alternativas: [
      { alt: "em cima do assento", x: 38, y: 4, w: 24, h: 44, bola: { x: 43.7, y: 23.6 } },
      { alt: "embaixo da cadeira", x: 44, y: 50, w: 20, h: 40, bola: { x: 49.9, y: 60.5 } },
      { alt: "ao lado da cadeira", x: 67, y: 30, w: 25, h: 60, bola: { x: 68, y: 63 } }
    ],
    correta: 1,
    reforco: "A bola está embaixo da cadeira.", audioReforco: "m03-reforco",
    acerto: { camadas: [
      { img: "cadeira", alt: "cadeira", x: 12, y: 8, w: 70 },
      { img: "bola", alt: "bola", x: 52.1, y: 65.1, w: 19.1 } ] }
  },
  {
    id: "M04", nivel: "medio",
    area: "Noções espaciais", assunto: "Entre",
    habilidade: "Reconhecer a posição \"entre\"", bncc: "EI02ET04 (consolidação)",
    tipo: "imagem",
    comando: "Em qual imagem o coelho está entre as duas árvores?",
    audio: ["m04-comando"],
    alternativas: [
      /* as árvores podem passar da borda do cartão: o cartão corta o excesso */
      { alt: "coelho ao lado das duas árvores", camadas: [
        { img: ARVORE, alt: "árvore", x: -8, y: 16, w: 56 },
        { img: ARVORE, alt: "árvore", x: 26, y: 16, w: 56 },
        { img: COELHO, alt: "coelho", x: 73, y: 42, w: 24 } ] },
      { alt: "coelho na frente de uma árvore", camadas: [
        { img: ARVORE, alt: "árvore", x: -8, y: 16, w: 56 },
        { img: ARVORE, alt: "árvore", x: 52, y: 16, w: 56 },
        { img: COELHO, alt: "coelho", x: 67.7, y: 49, w: 24 } ] },
      { alt: "coelho entre as duas árvores", camadas: [
        { img: ARVORE, alt: "árvore", x: -8, y: 16, w: 56 },
        { img: ARVORE, alt: "árvore", x: 52, y: 16, w: 56 },
        { img: COELHO, alt: "coelho", x: 37.7, y: 42, w: 24 } ] }
    ],
    correta: 2,
    reforco: "O coelho está entre as duas árvores.", audioReforco: "m04-reforco"
  },
  {
    id: "M05", nivel: "medio",
    area: "Animais e seus habitats", assunto: "Animais do deserto",
    habilidade: "Associar o camelo ao deserto", bncc: "EI03ET03 (aproximação)",
    tipo: "imagem",
    comando: "Onde o camelo vive?",
    audio: ["m05-comando"],
    cena: { tipo: "imagem", img: "camelo", alt: "camelo" },
    alternativas: [
      { img: "ambiente-deserto", alt: "deserto", cobrir: true },
      { img: "ambiente-mar", alt: "mar", cobrir: true },
      { img: "ambiente-neve", alt: "neve", cobrir: true }
    ],
    correta: 0,
    reforco: "O camelo vive no deserto.", audioReforco: "m05-reforco",
    acerto: { camadas: [fundo("ambiente-deserto", "deserto"), { img: "camelo", alt: "camelo", x: 4, y: 34.5, w: 58 }] }
  },
  {
    id: "M06", nivel: "medio",
    area: "Consciência silábica", assunto: "Palavras de 3 sílabas",
    habilidade: "Contar 3 sílabas sem apoio do texto", bncc: "Campo Escuta, fala, pensamento e imaginação",
    tipo: "numero",
    comando: "Quantos pedacinhos essa palavra tem?",
    audio: ["m06-comando"],
    cena: { tipo: "imagem", img: "macaco", alt: "macaco" },
    alternativas: ["2", "3", "4"], correta: 1,
    reforco: "MA-CA-CO tem 3 pedacinhos.", audioReforco: "m06-reforco",
    acerto: { tipo: "palavra", img: "macaco", alt: "macaco", texto: "MA - CA - CO" }
  },
  {
    id: "M07", nivel: "medio",
    area: "Consciência silábica", assunto: "Comparação de sílabas",
    habilidade: "Comparar palavras pelo número de sílabas", bncc: "Campo Escuta, fala, pensamento e imaginação",
    tipo: "imagem",
    comando: "Qual palavra tem dois pedacinhos?",
    audio: ["m07-comando-1", "m07-comando-2", "m07-comando-3", "m07-comando-4", "m07-comando-5"],
    realce: [null, 0, 1, 2, null],
    alternativas: [
      { img: "banana", alt: "banana" },
      { img: "sol", alt: "sol" },
      { img: "casa", alt: "casa" }
    ],
    correta: 2,
    reforco: "CA-SA tem 2 pedacinhos.", audioReforco: "m07-reforco",
    acerto: { tipo: "palavra", img: "casa", alt: "casa", texto: "CA - SA" }
  },

  /* =========================== NÍVEL DIFÍCIL =========================== */
  {
    id: "D01", nivel: "dificil",
    area: "Contagem e quantidades", assunto: "Contagem até 9 com elementos espalhados",
    habilidade: "Contar até 9 elementos espalhados", bncc: "EI03ET07",
    tipo: "numero",
    comando: "Conte com atenção. Quantas estrelas aparecem?",
    audio: ["d01-comando"],
    /* Posições fixas (x, y em % da cena; w em % da largura): sem sorteio e sem sobreposição */
    cena: { tipo: "espalhar", img: "estrela", alt: "estrela", marcar: true, posicoes: [
      { x: 2, y: 30, w: 10, r: -12 }, { x: 14, y: 2, w: 9.5, r: 8 }, { x: 17, y: 62, w: 9, r: 14 },
      { x: 31, y: 34, w: 10.5, r: -6 }, { x: 44, y: 4, w: 9, r: 10 }, { x: 48, y: 60, w: 10, r: -14 },
      { x: 62, y: 26, w: 9.5, r: 6 }, { x: 77, y: 2, w: 10, r: -8 }, { x: 82, y: 52, w: 9.5, r: 12 }
    ] },
    alternativas: ["8", "9", "10"], correta: 1,
    reforco: "Há 9 estrelas.", audioReforco: "d01-reforco"
  },
  {
    id: "D02", nivel: "dificil",
    area: "Contagem e quantidades", assunto: "Número entre dois números",
    habilidade: "Identificar o número que fica entre outros dois", bncc: "EI03ET07",
    tipo: "numero",
    comando: "Qual número fica entre o 7 e o 9?",
    audio: ["d02-comando"],
    cena: { tipo: "trem", vagoes: [7, null, 9] },
    alternativas: ["5", "6", "8"], correta: 2,
    reforco: "O 8 fica entre o 7 e o 9.", audioReforco: "d02-reforco",
    acerto: { tipo: "trem", vagoes: [7, 8, 9], destaque: 1 }
  },
  {
    id: "D03", nivel: "dificil",
    area: "Noções espaciais", assunto: "Atrás",
    habilidade: "Reconhecer a posição \"atrás\"", bncc: "EI02ET04 (consolidação)",
    tipo: "imagem",
    comando: "Em qual imagem o cachorro está atrás da casinha?",
    audio: ["d03-comando"],
    alternativas: [
      { img: "d03-cachorro-frente-casinha", alt: "cachorro na frente da casinha" },
      { img: "d03-cachorro-atras-casinha", alt: "cachorro atrás da casinha" },
      { img: "d03-cachorro-dentro-casinha", alt: "cachorro dentro da casinha" }
    ],
    correta: 1,
    reforco: "O cachorro está atrás da casinha.", audioReforco: "d03-reforco"
  },
  {
    id: "D04", nivel: "dificil",
    area: "Animais e seus habitats", assunto: "Animais da lagoa",
    habilidade: "Relacionar um animal ao ambiente da lagoa", bncc: "EI03ET03 (aproximação)",
    tipo: "imagem",
    comando: "Qual destes animais pode viver perto desta lagoa?",
    audio: ["d04-comando"],
    cena: { tipo: "imagem", img: "cena-lagoa", alt: "lagoa", largo: true, moldura: true },
    alternativas: [
      { img: "sapo", alt: "sapo" },
      { img: "urso-polar", alt: "urso-polar" },
      { img: "camelo", alt: "camelo" }
    ],
    correta: 0,
    reforco: "O sapo vive perto da lagoa.", audioReforco: "d04-reforco",
    acerto: { camadas: [fundo("cena-lagoa", "lagoa"), { img: "sapo", alt: "sapo", x: 40, y: 50.5, w: 34 }] }
  },
  {
    id: "D05", nivel: "dificil",
    area: "Animais e seus habitats", assunto: "Animal e ambiente",
    habilidade: "Avaliar se o animal está no ambiente certo", bncc: "EI03ET03 (aproximação)",
    tipo: "imagem",
    comando: "Qual dupla mostra o animal no lugar certo?",
    audio: ["d05-comando"],
    alternativas: [
      { alt: "macaco no mar", camadas: [fundo("ambiente-mar", "mar"), { img: "macaco", alt: "macaco", x: 25, y: 30, w: 50 }] },
      { alt: "pinguim no deserto", camadas: [fundo("ambiente-deserto", "deserto"), { img: "pinguim", alt: "pinguim", x: 10, y: 32.4, w: 46 }] },
      { alt: "baleia no mar", camadas: [fundo("ambiente-mar", "mar"), { img: "baleia", alt: "baleia", x: 18, y: 30, w: 64 }] }
    ],
    correta: 2,
    reforco: "A baleia vive no mar.", audioReforco: "d05-reforco"
  },
  {
    id: "D06", nivel: "dificil",
    area: "Consciência silábica", assunto: "Palavras de 4 sílabas",
    habilidade: "Segmentar sozinho uma palavra de 4 sílabas", bncc: "Campo Escuta, fala, pensamento e imaginação",
    tipo: "numero",
    comando: "Quantos pedacinhos você contou?",
    audio: ["d06-comando"],
    cena: { tipo: "imagem", img: "borboleta", alt: "borboleta" },
    alternativas: ["4", "5", "6"], correta: 0,
    reforco: "BOR-BO-LE-TA tem 4 pedacinhos.", audioReforco: "d06-reforco",
    acerto: { tipo: "palavra", img: "borboleta", alt: "borboleta", texto: "BOR - BO - LE - TA" }
  },
  {
    id: "D07", nivel: "dificil",
    area: "Consciência silábica", assunto: "Comparação de sílabas",
    habilidade: "Comparar palavras sem se guiar pelo tamanho do objeto", bncc: "Campo Escuta, fala, pensamento e imaginação",
    tipo: "imagem",
    comando: "Qual palavra tem mais pedacinhos?",
    audio: ["d07-comando-1", "d07-comando-2", "d07-comando-3", "d07-comando-4", "d07-comando-5"],
    realce: [null, 0, 1, 2, null],
    alternativas: [
      { img: "cavalo", alt: "cavalo" },
      { img: "formiguinha", alt: "formiguinha" },
      { img: "boi", alt: "boi" }
    ],
    correta: 1,
    reforco: "FOR-MI-GUI-NHA tem 4 pedacinhos.", audioReforco: "d07-reforco",
    acerto: { tipo: "palavra", img: "formiguinha", alt: "formiguinha", texto: "FOR - MI - GUI - NHA" }
  }
];

})();
