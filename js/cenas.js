/* =====================================================================
   Aventura do Saber · cenas e alternativas

   Monta o que aparece na tela a partir dos dados de perguntas.js:
   imagens, montagens em camadas (ex.: ursinho + cama), trenzinho com
   números, objetos repetidos para contar e o arrastar e soltar do M03.

   Imagem que ainda não existe na pasta img/ vira um marcador provisório
   com o nome do objeto, para o jogo funcionar enquanto as imagens são feitas.
   ===================================================================== */

window.Cenas = (function () {
  "use strict";

  function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  }

  function marcador(texto, classe) {
    const m = el("div", "marcador " + (classe || ""), texto);
    m.setAttribute("role", "img");
    m.setAttribute("aria-label", texto);
    m.title = "Imagem ainda não adicionada: " + texto;
    return m;
  }

  /* <img> de img/<nome>.webp; se o arquivo faltar, troca pelo marcador */
  function imagem(nome, alt, classe) {
    const img = el("img", classe || "");
    img.src = "img/" + nome + ".webp";
    img.alt = alt || "";
    img.draggable = false;
    img.decoding = "async";
    img.addEventListener("error", function () {
      const m = marcador(alt || nome, classe);
      m.style.cssText = img.style.cssText;
      img.replaceWith(m);
    }, { once: true });
    return img;
  }

  /* Montagem em camadas: cada camada tem x, y, w (e h) em % do quadro */
  function camadas(lista, alt) {
    const box = el("div", "composicao");
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", alt || "");
    lista.forEach(function (c) {
      const im = imagem(c.img, c.alt, "camada" + (c.fundo ? " fundo" : ""));
      im.style.left = c.x + "%";
      im.style.top = c.y + "%";
      im.style.width = c.w + "%";
      if (c.h) im.style.height = c.h + "%";
      im.setAttribute("aria-hidden", "true");
      box.appendChild(im);
    });
    return box;
  }

  function repetir(c) {
    const box = el("div", "repetir");
    const total = c.linhas.reduce(function (a, b) { return a + b; }, 0);
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", total + " " + c.alt);
    c.linhas.forEach(function (qtd) {
      const linha = el("div", "linha");
      for (let i = 0; i < qtd; i++) {
        const im = imagem(c.img, c.alt, "item");
        im.setAttribute("aria-hidden", "true");
        linha.appendChild(im);
      }
      box.appendChild(linha);
    });
    return box;
  }

  /* Elementos espalhados em posições fixas. Com "marcar", a criança pode tocar
     em cada um enquanto conta (ele ganha um sinal de visto); isso não conta como resposta. */
  function espalhar(c) {
    const box = el("div", "espalhar");
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", c.posicoes.length + " " + c.alt + "s espalhadas");
    c.posicoes.forEach(function (p) {
      const item = el("span", "item-espalhado");
      item.style.left = p.x + "%";
      item.style.top = p.y + "%";
      item.style.width = p.w + "%";
      item.style.setProperty("--giro", (p.r || 0) + "deg");
      const im = imagem(c.img, c.alt, "");
      im.setAttribute("aria-hidden", "true");
      item.appendChild(im);
      if (c.marcar) {
        item.classList.add("marcavel");
        item.addEventListener("click", function () { item.classList.toggle("contada"); });
      }
      box.appendChild(item);
    });
    return box;
  }

  function trem(vagoes, destaque) {
    const t = el("div", "trem");
    t.setAttribute("role", "img");
    t.setAttribute("aria-label", "trenzinho com os números " + vagoes.map(function (v) { return v == null ? "faltando" : v; }).join(", "));
    const loco = el("div", "locomotiva");
    loco.appendChild(imagem("trem-locomotiva", "locomotiva", ""));
    t.appendChild(loco);
    vagoes.forEach(function (v, i) {
      const w = el("div", "vagao" + (v == null ? " falta" : "") + (i === destaque ? " destaque" : ""));
      w.appendChild(imagem("trem-vagao", "vagão", ""));
      w.appendChild(el("span", "numero", v == null ? "?" : String(v)));
      t.appendChild(w);
    });
    return t;
  }

  function palavra(c) {
    const box = el("div", "palavra");
    box.appendChild(imagem(c.img, c.alt, "palavra-img"));
    const txt = el("p", "silabas", c.texto);
    txt.setAttribute("aria-hidden", "true");
    box.appendChild(txt);
    return box;
  }

  function montarCena(c) {
    if (!c) return null;
    switch (c.tipo) {
      case "imagem": {
        const box = el("div", "cena-imagem" + (c.largo ? " largo" : "") + (c.moldura ? " moldura" : ""));
        box.appendChild(imagem(c.img, c.alt, ""));
        return box;
      }
      case "repetir": return repetir(c);
      case "espalhar": return espalhar(c);
      case "trem": return trem(c.vagoes, c.destaque);
      case "palavra": return palavra(c);
      default: return c.camadas ? camadas(c.camadas, c.alt) : null;
    }
  }

  /* Conteúdo de um cartão de alternativa com imagem */
  function conteudoAlternativa(a) {
    if (a.camadas) return camadas(a.camadas, a.alt);
    return imagem(a.img, a.alt, a.cobrir ? "cobrir" : "");
  }

  /* O que aparece na tela de acerto */
  function imagemAcerto(p) {
    if (p.acerto) {
      if (p.acerto.camadas) return camadas(p.acerto.camadas, p.reforco);
      return montarCena(p.acerto);
    }
    if (p.tipo === "numero") return montarCena(p.cena);
    if (p.tipo === "arrastar") return imagem(p.cena.base.img, p.cena.base.alt, "");
    return conteudoAlternativa(p.alternativas[p.correta]);
  }

  /* ---------- Arrastar e soltar (M03) ----------
     Funciona com dedo, mouse e caneta (Pointer Events). Também dá para tocar
     direto numa das áreas, o que permite jogar pelo teclado. */
  function arrastar(p, aoSoltar) {
    const cena = el("div", "arrastar");
    const base = imagem(p.cena.base.img, p.cena.base.alt, "base");
    base.style.left = p.cena.base.x + "%";
    base.style.top = p.cena.base.y + "%";
    base.style.width = p.cena.base.w + "%";
    cena.appendChild(base);

    const zonas = p.alternativas.map(function (z, i) {
      const b = el("button", "zona");
      b.type = "button";
      b.setAttribute("aria-label", "Colocar a bola " + z.alt);
      b.style.left = z.x + "%"; b.style.top = z.y + "%";
      b.style.width = z.w + "%"; b.style.height = z.h + "%";
      b.addEventListener("click", function () { if (!b.disabled) aoSoltar(i); });
      cena.appendChild(b);
      return b;
    });

    const o = p.cena.objeto;
    const bola = el("div", "objeto");
    bola.setAttribute("aria-hidden", "true");
    bola.appendChild(imagem(o.img, o.alt, ""));
    cena.appendChild(bola);

    function irPara(xPct, yPct, animado) {
      bola.classList.toggle("animando", !!animado);
      bola.style.left = xPct + "%";
      bola.style.top = yPct + "%";
      bola.style.width = o.w + "%";
    }
    function voltarOrigem() { irPara(o.x, o.y, true); }
    function moverParaZona(i) {
      const z = p.alternativas[i];
      if (z.bola) { irPara(z.bola.x, z.bola.y, true); return; }   // posição definida no banco
      const r = cena.getBoundingClientRect();
      const alturaBolaPct = r.height ? (bola.getBoundingClientRect().height / r.height) * 100 : o.w * 2;
      irPara(z.x + z.w / 2 - o.w / 2, z.y + z.h - alturaBolaPct - 1, true);
    }
    irPara(o.x, o.y, false);

    let arrasto = null;
    function zonaNoPonto(x, y) {
      for (let i = 0; i < zonas.length; i++) {
        const z = zonas[i];
        if (z.disabled) continue;
        const r = z.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
      }
      return -1;
    }
    bola.addEventListener("pointerdown", function (ev) {
      if (cena.classList.contains("bloqueada")) return;
      ev.preventDefault();
      bola.setPointerCapture(ev.pointerId);
      const rb = bola.getBoundingClientRect();
      arrasto = { id: ev.pointerId, dx: ev.clientX - rb.left, dy: ev.clientY - rb.top, moveu: false };
      bola.classList.add("arrastando");
      bola.classList.remove("animando");
      cena.classList.add("mostrar-zonas");
    });
    bola.addEventListener("pointermove", function (ev) {
      if (!arrasto || ev.pointerId !== arrasto.id) return;
      const r = cena.getBoundingClientRect();
      const x = ((ev.clientX - arrasto.dx - r.left) / r.width) * 100;
      const y = ((ev.clientY - arrasto.dy - r.top) / r.height) * 100;
      arrasto.moveu = true;
      bola.style.left = Math.max(-2, Math.min(100 - o.w + 2, x)) + "%";
      bola.style.top = Math.max(-5, Math.min(95, y)) + "%";
      const rb = bola.getBoundingClientRect();
      const alvo = zonaNoPonto(rb.left + rb.width / 2, rb.top + rb.height / 2);
      zonas.forEach(function (z, i) { z.classList.toggle("alvo", i === alvo); });
    });
    function soltar(ev) {
      if (!arrasto || ev.pointerId !== arrasto.id) return;
      const moveu = arrasto.moveu;
      arrasto = null;
      bola.classList.remove("arrastando");
      zonas.forEach(function (z) { z.classList.remove("alvo"); });
      if (!moveu) { cena.classList.add("mostrar-zonas"); return; }   // só tocou na bola: mostra as áreas
      const rb = bola.getBoundingClientRect();
      const i = zonaNoPonto(rb.left + rb.width / 2, rb.top + rb.height / 2);
      if (i >= 0) aoSoltar(i);
      else { cena.classList.remove("mostrar-zonas"); voltarOrigem(); }
    }
    bola.addEventListener("pointerup", soltar);
    bola.addEventListener("pointercancel", soltar);

    return {
      elemento: cena,
      zonas: zonas,
      moverParaZona: moverParaZona,
      voltarOrigem: function () { cena.classList.remove("mostrar-zonas"); voltarOrigem(); },
      descartarZona: function (i) { zonas[i].disabled = true; zonas[i].classList.add("descartada"); },
      bloquear: function (sim) { cena.classList.toggle("bloqueada", sim); zonas.forEach(function (z) { if (!z.classList.contains("descartada")) z.disabled = sim; }); },
      marcarCerta: function (i) { zonas[i].classList.add("certa"); }
    };
  }

  /* Baixa as imagens da próxima pergunta enquanto a criança responde a atual */
  function preCarregar(p) {
    if (!p) return;
    const nomes = new Set();
    function juntar(o) {
      if (!o) return;
      if (o.img) nomes.add(o.img);
      if (o.camadas) o.camadas.forEach(juntar);
      if (o.base) juntar(o.base);
      if (o.objeto) juntar(o.objeto);
      if (o.tipo === "trem") { nomes.add("trem-locomotiva"); nomes.add("trem-vagao"); }
    }
    juntar(p.cena);
    (p.alternativas || []).forEach(function (a) { if (typeof a === "object") juntar(a); });
    nomes.forEach(function (n) { const i = new Image(); i.src = "img/" + n + ".webp"; });
  }

  return {
    montarCena: montarCena, conteudoAlternativa: conteudoAlternativa, imagemAcerto: imagemAcerto,
    arrastar: arrastar, preCarregar: preCarregar, imagem: imagem
  };
})();
