/* =====================================================================
   Aventura do Saber · fluxo do jogo

   Telas, em ordem: nome (adulto) > abertura > introdução do nível >
   7 perguntas (cada uma seguida da tela de acerto) > resultado do nível >
   próximo nível. Depois do Difícil, o jogo pode recomeçar.

   Regras principais
   - O erro nunca aparece em vermelho: abre o aviso "Vamos tentar de novo?",
     e a alternativa tocada fica apagada. Com 3 alternativas, a pergunta
     termina no máximo na 3ª tentativa.
   - Enquanto um retorno aparece, novos toques são ignorados (estado.bloqueado),
     para o mesmo toque não ser registrado duas vezes.
   - Cada desafio concluído rende uma estrela dourada, mesmo depois de uma nova
     tentativa. Se a criança acertou de primeira ou depois fica só no registro
     do professor (decisão de 22/10/2026).
   ===================================================================== */

(function () {
  "use strict";

  const P = window.PERGUNTAS, N = window.NIVEIS;
  const $ = function (id) { return document.getElementById(id); };

  const ACERTO = [["Isso aí!", "acerto-1"], ["Excelente!", "acerto-2"], ["Muito bem!", "acerto-3"], ["Parabéns!", "acerto-4"]];
  const TENTAR = [
    { titulo: "Vamos tentar de novo?", texto: "Você consegue!", audio: "tentar-1" },
    { titulo: "Boa tentativa!", texto: "Olhe com atenção.", audio: "tentar-2" }
  ];
  const DICAS = {
    numero: "Toque na resposta que você escolheu.",
    imagem: "Toque na imagem que você escolheu.",
    arrastar: "Arraste a bola até o lugar certo."
  };

  const estado = {
    crianca: "", nivel: 0, indice: 0, tentativa: 1, estrelas: 0,
    bloqueado: false, acertos: 0, tentarVez: 0, descartar: null,
    botoes: [], arrasto: null, audioTela: null, tela: null
  };

  function perguntasDoNivel(i) { return P.filter(function (p) { return p.nivel === N[i].id; }); }
  function perguntaAtual() { return perguntasDoNivel(estado.nivel)[estado.indice]; }
  function svg(id) { return '<svg aria-hidden="true"><use href="#' + id + '"/></svg>'; }

  /* ---------------- telas ---------------- */
  function mostrar(id, audios) {
    Som.parar();
    if (id !== "tela-resultado") $("confete").replaceChildren();
    document.querySelectorAll(".tela").forEach(function (t) { t.hidden = t.id !== id; });
    estado.tela = id;
    document.body.dataset.tela = id;
    $("btnSair").hidden = ["tela-nivel", "tela-pergunta", "tela-acerto", "tela-resultado"].indexOf(id) < 0;
    window.scrollTo(0, 0);
    const foco = document.querySelector("#" + id + " [data-foco]");
    if (foco) foco.focus({ preventScroll: true });
    estado.audioTela = audios || null;
    if (audios) Som.tocar(audios);
  }

  function irParaNome() {
    estado.crianca = "";
    $("nomeCrianca").value = "";
    mostrar("tela-nome");
  }

  function irParaAbertura() { mostrar("tela-abertura", ["abertura"]); }

  function irParaNivel(i) {
    estado.nivel = i; estado.indice = 0; estado.estrelas = 0;
    const n = N[i], lista = perguntasDoNivel(i);
    document.documentElement.style.setProperty("--cor-nivel", n.cor);
    $("tituloNivel").textContent = n.nome;
    $("nivelLinha1").textContent = n.linha1;
    $("nivelLinha2").textContent = n.linha2;
    $("nivelFala").textContent = n.fala;
    $("nivelEstrelas").replaceChildren.apply($("nivelEstrelas"), lista.map(function () {
      const e = Cenas.imagem("estrela", "", "vazia"); return e;
    }));
    Cenas.preCarregar(lista[0]);
    Som.preparar(lista[0].audio);
    mostrar("tela-nivel", [n.audio]);
  }

  /* ---------------- pergunta ---------------- */
  function rotulo(p, i) {
    const a = p.alternativas[i];
    return typeof a === "string" ? a : a.alt;
  }

  function mostrarPergunta() {
    const p = perguntaAtual(), lista = perguntasDoNivel(estado.nivel);
    estado.tentativa = 1; estado.bloqueado = false; estado.botoes = []; estado.arrasto = null;

    $("pergNumero").textContent = "Pergunta " + (estado.indice + 1) + " de " + lista.length;
    $("pergBarra").style.width = ((estado.indice + 1) / lista.length * 100) + "%";
    const barra = document.querySelector("#tela-pergunta .progresso");
    barra.setAttribute("aria-valuemax", lista.length);
    barra.setAttribute("aria-valuenow", estado.indice + 1);
    $("pergComando").textContent = p.comando;
    $("pergDica").textContent = p.cena && p.cena.marcar
      ? "Toque em cada estrela enquanto conta. Depois, toque na resposta."
      : DICAS[p.tipo];

    const cena = $("pergCena"), alts = $("pergAlternativas");
    cena.replaceChildren(); alts.replaceChildren();
    alts.className = "alternativas tipo-" + p.tipo;
    document.querySelector("#tela-pergunta .cartao-pergunta").className =
      "cartao cartao-pergunta tipo-" + p.tipo + (p.cena && p.tipo !== "arrastar" ? " tem-cena" : "");

    if (p.tipo === "arrastar") {
      estado.arrasto = Cenas.arrastar(p, responder);
      cena.appendChild(estado.arrasto.elemento);
    } else {
      const c = Cenas.montarCena(p.cena);
      if (c) cena.appendChild(c);
      p.alternativas.forEach(function (a, i) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "alt " + (p.tipo === "numero" ? "alt-numero" : "alt-imagem");
        if (p.tipo === "numero") b.textContent = a;
        else { b.setAttribute("aria-label", a.alt); b.appendChild(Cenas.conteudoAlternativa(a)); }
        b.addEventListener("click", function () { responder(i); });
        alts.appendChild(b);
        estado.botoes.push(b);
      });
    }

    mostrar("tela-pergunta");
    tocarComando();

    // adianta a próxima pergunta
    const prox = lista[estado.indice + 1];
    Som.preparar([p.audioReforco].concat(prox ? prox.audio : []));
    Cenas.preCarregar(prox);
  }

  function realcar(p, parte) {
    const alvo = p.realce && parte >= 0 ? p.realce[parte] : null;
    estado.botoes.forEach(function (b, i) { b.classList.toggle("falando", i === alvo); });
  }

  function tocarComando() {
    const p = perguntaAtual();
    Som.tocar(p.audio, function (parte) { realcar(p, parte); });
  }

  function responder(i) {
    if (estado.bloqueado) return;
    const p = perguntaAtual();
    const certa = i === p.correta;
    estado.bloqueado = true;
    Som.parar();
    realcar(p, -1);

    Registro.adicionar({
      crianca: estado.crianca, nivel: N[estado.nivel].curto, pergunta: p.id,
      area: p.area, assunto: p.assunto, habilidade: p.habilidade + " · BNCC " + p.bncc,
      tentativa: estado.tentativa, resposta: rotulo(p, i), resultado: certa ? "acerto" : "erro"
    });

    if (estado.arrasto) {
      estado.arrasto.bloquear(true);
      estado.arrasto.moverParaZona(i);
    }
    const botao = estado.botoes[i];

    if (certa) {
      if (botao) botao.classList.add("certa");
      if (estado.arrasto) estado.arrasto.marcarCerta(i);
      estado.botoes.forEach(function (b) { b.disabled = true; });
      Som.sininho();
      estado.estrelas++;
      setTimeout(irParaAcerto, 1000);
    } else {
      if (botao) { botao.classList.remove("balanco"); void botao.offsetWidth; botao.classList.add("balanco"); }
      estado.descartar = i;
      setTimeout(abrirTentar, 650);
    }
  }

  function abrirTentar() {
    const t = TENTAR[estado.tentarVez++ % TENTAR.length];
    $("tentarTitulo").textContent = t.titulo;
    $("tentarTexto").textContent = t.texto;
    $("modalTentar").hidden = false;
    $("btnTentar").focus({ preventScroll: true });
    Som.tocar([t.audio]);
  }

  function fecharTentar() {
    if ($("modalTentar").hidden) return;
    $("modalTentar").hidden = true;
    Som.parar();
    const i = estado.descartar;
    if (estado.arrasto) {
      estado.arrasto.descartarZona(i);
      estado.arrasto.voltarOrigem();
      estado.arrasto.bloquear(false);
    } else if (estado.botoes[i]) {
      const b = estado.botoes[i];
      b.disabled = true;
      b.classList.add("descartada");
      b.classList.remove("balanco");
      b.setAttribute("aria-label", (b.getAttribute("aria-label") || b.textContent) + " (já tentada)");
    }
    estado.tentativa++;
    estado.bloqueado = false;
    $("btnRepetir").focus({ preventScroll: true });
    tocarComando();
  }

  /* ---------------- acerto e resultado ---------------- */
  function irParaAcerto() {
    const p = perguntaAtual(), lista = perguntasDoNivel(estado.nivel);
    const par = ACERTO[estado.acertos++ % ACERTO.length];
    $("acertoTitulo").textContent = par[0];
    $("acertoImagem").replaceChildren(Cenas.imagemAcerto(p));
    $("acertoReforco").textContent = p.reforco;
    const ultima = estado.indice === lista.length - 1;
    $("btnProxima").querySelector("span").textContent = ultima ? "Ver resultado" : "Próxima pergunta";
    mostrar("tela-acerto", [par[1], p.audioReforco]);
  }

  function proxima() {
    const lista = perguntasDoNivel(estado.nivel);
    if (estado.indice >= lista.length - 1) mostrarResultado();
    else { estado.indice++; mostrarPergunta(); }
  }

  function mostrarResultado() {
    const n = N[estado.nivel];
    const ultimoNivel = estado.nivel === N.length - 1;
    $("resTexto").textContent = ultimoNivel ? "Você completou a Aventura do Saber!" : "Você concluiu o " + n.nome + "!";
    const box = $("resEstrelas");
    box.replaceChildren();
    for (let i = 0; i < estado.estrelas; i++) {
      const e = Cenas.imagem("estrela", "estrela dourada", "");
      e.style.animationDelay = (0.15 + i * 0.12) + "s";
      box.appendChild(e);
    }
    $("resFala").textContent = "Você conquistou " + estado.estrelas + (estado.estrelas === 1 ? " estrela!" : " estrelas!");
    const btn = $("btnResPrincipal");
    btn.innerHTML = ultimoNivel ? "<span>Jogar de novo</span> " + svg("i-denovo") : "<span>Próximo nível</span> " + svg("i-seta");
    mostrar("tela-resultado", [n.audioFim]);
    confete();
  }

  function confete() {
    const box = $("confete");
    box.replaceChildren();
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cores = ["#4F7DF3", "#FFD166", "#4CC38A", "#EC6F9A", "#F4A300"];
    for (let i = 0; i < 40; i++) {
      const s = document.createElement("span");
      s.style.left = ((i * 37) % 100) + "%";
      s.style.background = cores[i % cores.length];
      s.style.animationDelay = ((i % 10) * 0.11) + "s";
      s.style.setProperty("--deriva", (((i * 53) % 140) - 70) + "px");
      box.appendChild(s);
    }
    setTimeout(function () { box.replaceChildren(); }, 4200);
  }

  /* ---------------- área do professor ---------------- */
  let limparArmado = null;
  function atualizarProfessor() {
    const t = Registro.total();
    $("profResumo").textContent = t
      ? t + (t === 1 ? " registro" : " registros") + " de " + Registro.criancas() + (Registro.criancas() === 1 ? " criança." : " crianças.")
      : "Nenhum registro ainda.";
    $("profAviso").hidden = Registro.persistente();
    $("profPrevia").textContent = t ? "Últimos registros:\n" + Registro.ultimas(5).join("\n") : "";
    $("profPrevia").hidden = !t;
    $("btnBaixar").disabled = !t;
    $("btnLimpar").disabled = !t;
    desarmarLimpar();
  }
  function desarmarLimpar() {
    clearTimeout(limparArmado); limparArmado = null;
    $("btnLimpar").textContent = "Apagar registros";
    $("btnLimpar").classList.remove("alerta");
  }

  /* ---------------- eventos ---------------- */
  function ligar() {
    $("formNome").addEventListener("submit", function (ev) {
      ev.preventDefault();
      Som.desbloquear();
      estado.crianca = $("nomeCrianca").value.replace(/\s+/g, " ").trim().slice(0, 40);
      irParaAbertura();
    });
    $("btnProfessor").addEventListener("click", function () { atualizarProfessor(); mostrar("tela-professor"); });
    $("btnProfVoltar").addEventListener("click", irParaNome);
    $("btnBaixar").addEventListener("click", function () { Registro.baixar(); });
    $("btnLimpar").addEventListener("click", function () {
      if (!limparArmado) {
        $("btnLimpar").textContent = "Toque de novo para apagar tudo";
        $("btnLimpar").classList.add("alerta");
        limparArmado = setTimeout(desarmarLimpar, 5000);
        return;
      }
      Registro.limpar();
      atualizarProfessor();
    });

    $("btnComecar").addEventListener("click", function () { Som.desbloquear(); irParaNivel(0); });
    $("btnIniciar").addEventListener("click", mostrarPergunta);
    $("btnRepetir").addEventListener("click", function () { if (!estado.bloqueado) tocarComando(); });
    document.querySelectorAll("[data-repetir]").forEach(function (b) {
      b.addEventListener("click", function () { if (estado.audioTela) Som.tocar(estado.audioTela); });
    });
    $("btnTentar").addEventListener("click", fecharTentar);
    $("btnProxima").addEventListener("click", proxima);
    $("btnResPrincipal").addEventListener("click", function () {
      irParaNivel(estado.nivel === N.length - 1 ? 0 : estado.nivel + 1);
    });
    $("btnResInicio").addEventListener("click", irParaNome);

    $("btnSair").addEventListener("click", function () {
      Som.parar();
      $("modalSair").hidden = false;
      $("btnContinuar").focus({ preventScroll: true });
    });
    $("btnContinuar").addEventListener("click", function () { $("modalSair").hidden = true; });
    $("btnConfirmaSair").addEventListener("click", function () { $("modalSair").hidden = true; irParaNome(); });

    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      if (!$("modalSair").hidden) $("modalSair").hidden = true;
      else if (!$("modalTentar").hidden) fecharTentar();
    });
    // o primeiro toque em qualquer lugar já libera o som
    document.addEventListener("pointerdown", Som.desbloquear, { once: true });
  }

  ligar();
  irParaNome();

  // usado nos testes automatizados (somente leitura)
  window.Jogo = { estado: estado, perguntaAtual: perguntaAtual };
})();
