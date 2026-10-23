/* =====================================================================
   Aventura do Saber · áudio

   - Toca as falas da pasta audio/ em sequência (ex.: as 5 partes do M07).
   - Uma fala nova sempre interrompe a anterior, para as vozes não se sobreporem.
   - Se um arquivo não carregar (internet fraca), o jogo continua sem travar.
   - Os navegadores só liberam som depois do primeiro toque da pessoa na
     página; por isso o jogo chama Som.desbloquear() no primeiro botão.
   ===================================================================== */

window.Som = (function () {
  "use strict";

  const cache = new Map();   // um elemento <audio> por arquivo, reaproveitado
  let atual = null;          // elemento tocando agora
  let rodada = 0;            // muda a cada nova fala; serve para cancelar a anterior
  let contexto = null;       // Web Audio, só para o sininho de acerto

  function elemento(nome) {
    if (!cache.has(nome)) {
      const a = new Audio("audio/" + nome + ".mp3");
      a.preload = "auto";
      cache.set(nome, a);
    }
    return cache.get(nome);
  }

  /* Começa a baixar os arquivos antes de precisar deles */
  function preparar(nomes) {
    (nomes || []).forEach(function (n) { elemento(n); });
  }

  function avisar(tocando) {
    document.documentElement.classList.toggle("tocando-audio", tocando);
  }

  function parar() {
    rodada++;
    if (atual) {
      atual.pause();
      try { atual.currentTime = 0; } catch (e) { /* arquivo ainda não carregado */ }
    }
    atual = null;
    avisar(false);
  }

  function tocarUm(a, minhaRodada) {
    return new Promise(function (resolver) {
      let vigia = null;
      function fim() {
        a.removeEventListener("ended", fim);
        a.removeEventListener("error", fim);
        clearInterval(vigia);
        resolver();
      }
      a.addEventListener("ended", fim);
      a.addEventListener("error", fim);
      vigia = setInterval(function () { if (minhaRodada !== rodada) fim(); }, 150);
      try { a.currentTime = 0; } catch (e) { /* ignora */ }
      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(fim);
    });
  }

  /* Toca uma lista de falas. aoMudarParte(i) é chamado no início de cada parte
     e com -1 no fim (usado para acender a imagem da palavra que está sendo dita). */
  async function tocar(nomes, aoMudarParte) {
    parar();
    const minhaRodada = rodada;
    avisar(true);
    for (let i = 0; i < nomes.length; i++) {
      if (minhaRodada !== rodada) return false;
      if (aoMudarParte) aoMudarParte(i);
      atual = elemento(nomes[i]);
      await tocarUm(atual, minhaRodada);
    }
    if (minhaRodada !== rodada) return false;
    atual = null;
    if (aoMudarParte) aoMudarParte(-1);
    avisar(false);
    return true;
  }

  /* Deve ser chamado dentro de um clique: libera o som no navegador */
  function desbloquear() {
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (C && !contexto) contexto = new C();
      if (contexto && contexto.state === "suspended") contexto.resume();
    } catch (e) { contexto = null; }
  }

  /* Sininho curto de acerto, gerado no próprio navegador (sem arquivo) */
  function sininho() {
    if (!contexto) return;
    try {
      const t0 = contexto.currentTime + 0.02;
      [523.25, 659.25, 783.99].forEach(function (freq, i) {
        const osc = contexto.createOscillator();
        const vol = contexto.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const t = t0 + i * 0.11;
        vol.gain.setValueAtTime(0.0001, t);
        vol.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
        vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        osc.connect(vol).connect(contexto.destination);
        osc.start(t);
        osc.stop(t + 0.5);
      });
    } catch (e) { /* sem som, sem problema */ }
  }

  return { tocar: tocar, parar: parar, preparar: preparar, desbloquear: desbloquear, sininho: sininho };
})();
