/* =====================================================================
   Aventura do Saber · registro das tentativas

   Atende ao escopo da Secretaria: cada toque da criança numa alternativa
   vira uma linha numerada (auto incremento) com nome, data, hora, pergunta,
   área, assunto, habilidade, tentativa e resultado. O professor baixa tudo
   num único arquivo .txt.

   Privacidade: os registros ficam apenas no navegador deste computador
   (localStorage). Nada é enviado pela internet. Se o navegador não permitir
   guardar (janela anônima, por exemplo), os registros ficam só até a página
   ser fechada, e a Área do professor avisa isso.
   ===================================================================== */

window.Registro = (function () {
  "use strict";

  const CHAVE_LISTA = "aventura-do-saber:registros";
  const CHAVE_CONTADOR = "aventura-do-saber:contador";
  let memoria = [];
  let contadorMemoria = 0;
  let persistente = testar();

  function testar() {
    try {
      localStorage.setItem("aventura-do-saber:teste", "1");
      localStorage.removeItem("aventura-do-saber:teste");
      return true;
    } catch (e) { return false; }
  }

  function ler() {
    if (!persistente) return memoria.slice();
    try { return JSON.parse(localStorage.getItem(CHAVE_LISTA) || "[]"); }
    catch (e) { return []; }
  }

  function gravar(lista) {
    if (persistente) {
      try { localStorage.setItem(CHAVE_LISTA, JSON.stringify(lista)); return; }
      catch (e) { persistente = false; }   // armazenamento cheio ou bloqueado
    }
    memoria = lista.slice();
  }

  function proximoNumero() {
    if (persistente) {
      try {
        const n = (parseInt(localStorage.getItem(CHAVE_CONTADOR) || "0", 10) || 0) + 1;
        localStorage.setItem(CHAVE_CONTADOR, String(n));
        return n;
      } catch (e) { persistente = false; }
    }
    contadorMemoria = Math.max(contadorMemoria, memoria.length) + 1;
    return contadorMemoria;
  }

  function doisDigitos(n) { return String(n).padStart(2, "0"); }
  function dataHora(d) {
    return {
      data: doisDigitos(d.getDate()) + "/" + doisDigitos(d.getMonth() + 1) + "/" + d.getFullYear(),
      hora: doisDigitos(d.getHours()) + ":" + doisDigitos(d.getMinutes()) + ":" + doisDigitos(d.getSeconds())
    };
  }

  /* Uma tentativa = um toque numa alternativa (ou a bola solta numa área) */
  function adicionar(dados) {
    const dh = dataHora(new Date());
    const lista = ler();
    lista.push({
      n: proximoNumero(), data: dh.data, hora: dh.hora,
      crianca: dados.crianca || "Sem nome",
      nivel: dados.nivel, pergunta: dados.pergunta,
      area: dados.area, assunto: dados.assunto, habilidade: dados.habilidade,
      tentativa: dados.tentativa, resposta: dados.resposta, resultado: dados.resultado
    });
    gravar(lista);
  }

  function limpar() {
    gravar([]);
    contadorMemoria = 0;
    if (persistente) { try { localStorage.removeItem(CHAVE_CONTADOR); } catch (e) { /* ignora */ } }
  }

  function campo(v) { return String(v == null ? "" : v).replace(/[;\r\n\t]+/g, ", ").trim(); }

  const COLUNAS = ["nº", "data", "hora", "criança", "nível", "pergunta", "área", "assunto", "habilidade", "tentativa", "resposta escolhida", "resultado"];
  function linha(r) {
    return [r.n, r.data, r.hora, r.crianca, r.nivel, r.pergunta, r.area, r.assunto, r.habilidade, r.tentativa, r.resposta, r.resultado].map(campo).join(";");
  }

  /* Resumo por criança e área: acertos na 1ª tentativa / perguntas concluídas */
  /* Resumo por criança e por dia: partidas de dias diferentes não se misturam. */
  function resumo(lista) {
    const grupos = new Map();
    lista.forEach(function (r) {
      if (r.resultado !== "acerto") return;
      const chave = campo(r.crianca) + " · " + r.data;
      if (!grupos.has(chave)) grupos.set(chave, new Map());
      const areas = grupos.get(chave);
      const a = areas.get(r.area) || { concluidas: 0, primeira: 0 };
      a.concluidas++;
      if (Number(r.tentativa) === 1) a.primeira++;
      areas.set(r.area, a);
    });
    const linhas = [];
    grupos.forEach(function (areas, chave) {
      const partes = [];
      areas.forEach(function (a, area) { partes.push(area + " " + a.primeira + "/" + a.concluidas); });
      linhas.push(chave + ": " + partes.join(" · "));
    });
    return linhas;
  }

  function gerarTexto() {
    const lista = ler();
    const agora = dataHora(new Date());
    const partes = [
      "AVENTURA DO SABER · REGISTRO DE TENTATIVAS",
      "Gerado em " + agora.data + " às " + agora.hora.slice(0, 5) + " · " + lista.length + " registro(s)",
      "Cada linha é um toque da criança numa resposta. As colunas são separadas por ponto e vírgula.",
      "",
      COLUNAS.join(";")
    ];
    lista.forEach(function (r) { partes.push(linha(r)); });
    const res = resumo(lista);
    if (res.length) {
      partes.push("", "RESUMO POR CRIANÇA E DIA", "Acertos na primeira tentativa / perguntas concluídas, por área:");
      res.forEach(function (l) { partes.push(l); });
    }
    return partes.join("\r\n") + "\r\n";
  }

  function baixar() {
    const blob = new Blob(["﻿" + gerarTexto()], { type: "text/plain;charset=utf-8" });
    const d = new Date();
    const nome = "registros-aventura-do-saber-" + d.getFullYear() + "-" + doisDigitos(d.getMonth() + 1) + "-" + doisDigitos(d.getDate()) + ".txt";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    return nome;
  }

  function ultimas(k) { return ler().slice(-k).map(linha); }

  return {
    adicionar: adicionar, limpar: limpar, baixar: baixar, gerarTexto: gerarTexto,
    total: function () { return ler().length; },
    criancas: function () { return new Set(ler().map(function (r) { return r.crianca; })).size; },
    ultimas: ultimas,
    persistente: function () { return persistente; }
  };
})();
