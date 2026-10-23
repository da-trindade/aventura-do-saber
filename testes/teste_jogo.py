"""
Aventura do Saber · testes automatizados

Joga o jogo num navegador Chromium controlado pelo Playwright e confere:
  T1 partida completa nos três níveis, com erros propositais: respostas,
     estrelas, falas tocadas, realce da M07 e arquivo .txt do registro
  T2 toque duplo não conta duas vezes
  T3 partida inteira só com o teclado
  T4 partida com toque, inclusive o arrastar da M03
  T5 botão de sair
  T6 jogo aberto direto do arquivo (file://), sem servidor
  T7 navegador que bloqueia o armazenamento
  T8 tamanhos de tela, de celular a notebook, sem rolagem indevida

Como executar, na pasta do projeto:
    pip install playwright
    python -m playwright install chromium
    python testes/teste_jogo.py

O roteiro sobe sozinho um servidor local temporário. As capturas de tela
ficam numa pasta temporária, indicada no final.
"""
import asyncio, functools, http.server, pathlib, re, sys, tempfile, threading
from playwright.async_api import async_playwright

RAIZ = pathlib.Path(__file__).resolve().parent.parent

class _Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

_servidor = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Silencioso, directory=str(RAIZ)))
threading.Thread(target=_servidor.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/" % _servidor.server_address[1]
ARQ = (RAIZ / "index.html").as_uri()
OUT = pathlib.Path(tempfile.mkdtemp(prefix="aventura-telas-"))
falhas = 0
def ok(cond, msg):
    global falhas
    print(("OK   " if cond else "FALHA") + " " + msg)
    if not cond: falhas += 1

GANCHO_AUDIO = """
window.__tocados = [];
const _play = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function () { window.__tocados.push(this.src.split('/').pop()); return _play.call(this); };
"""

async def nova(browser, **kw):
    ctx = await browser.new_context(accept_downloads=True, **kw)
    await ctx.add_init_script(GANCHO_AUDIO)
    pg = await ctx.new_page()
    pg.erros = []
    pg.on("pageerror", lambda e: pg.erros.append(str(e)))
    return ctx, pg

async def visivel(pg, sel, timeout=8000):
    await pg.wait_for_selector(sel, state="visible", timeout=timeout)

async def comecar(pg, nome="Ana B."):
    await pg.goto(URL)
    await pg.fill("#nomeCrianca", nome)
    await pg.click("#formNome button[type=submit]")
    await visivel(pg, "#btnComecar"); await pg.click("#btnComecar")
    await visivel(pg, "#btnIniciar"); await pg.click("#btnIniciar")
    await visivel(pg, "#tela-pergunta")

async def centro(pg, sel):
    b = await pg.locator(sel).bounding_box()
    return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2

async def parada(pg, sel):
    # espera o elemento parar de se mover (depois de um erro, a bola volta à origem com animação de 0,35 s)
    antes = None
    for _ in range(30):
        caixa = await pg.locator(sel).bounding_box()
        if caixa == antes: return
        antes = caixa
        await pg.wait_for_timeout(100)

async def arrastar_mouse(pg, zona_idx):
    await parada(pg, ".arrastar .objeto")
    x0, y0 = await centro(pg, ".arrastar .objeto")
    x1, y1 = await centro(pg, f".arrastar .zona >> nth={zona_idx}")
    await pg.mouse.move(x0, y0); await pg.mouse.down()
    for k in range(1, 13):
        await pg.mouse.move(x0 + (x1 - x0) * k / 12, y0 + (y1 - y0) * k / 12)
        await pg.wait_for_timeout(15)
    await pg.mouse.up()

async def arrastar_toque(pg, zona_idx):
    cdp = await pg.context.new_cdp_session(pg)
    await parada(pg, ".arrastar .objeto")
    x0, y0 = await centro(pg, ".arrastar .objeto")
    x1, y1 = await centro(pg, f".arrastar .zona >> nth={zona_idx}")
    await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x0, "y": y0}]})
    for k in range(1, 13):
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x0 + (x1 - x0) * k / 12, "y": y0 + (y1 - y0) * k / 12}]})
        await pg.wait_for_timeout(15)
    await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})

async def responder(pg, idx, toque=False):
    p = await pg.evaluate("({tipo: Jogo.perguntaAtual().tipo})")
    if p["tipo"] == "arrastar":
        await (arrastar_toque(pg, idx) if toque else arrastar_mouse(pg, idx))
    elif toque:
        await pg.tap(f"#pergAlternativas .alt >> nth={idx}")
    else:
        await pg.click(f"#pergAlternativas .alt >> nth={idx}")

async def total_registros(pg):
    return await pg.evaluate("Registro.total()")

# ---------------------------------------------------------------- T1
async def partida_completa(browser):
    print("== T1 partida completa nos 3 níveis (mouse), errando de propósito em algumas perguntas")
    ctx, pg = await nova(browser, viewport={"width": 1366, "height": 650})
    await comecar(pg)
    toques = 0; esperado_estrelas = {"facil": [], "medio": [], "dificil": []}
    titulos = set(); realce_m07 = None
    for nivel in ["facil", "medio", "dificil"]:
        for q in range(7):
            p = await pg.evaluate("(() => { const p = Jogo.perguntaAtual(); return {id: p.id, correta: p.correta, tipo: p.tipo, n: p.alternativas.length}; })()")
            if p["id"] == "M07":
                # espera o comando inteiro e registra a ordem em que as imagens acenderam
                realce_m07 = await pg.evaluate("""() => new Promise(res => {
                    const ordem = []; const bs = [...document.querySelectorAll('#pergAlternativas .alt')];
                    const obs = new MutationObserver(() => { bs.forEach((b, i) => { if (b.classList.contains('falando') && ordem[ordem.length - 1] !== i) ordem.push(i); }); });
                    bs.forEach(b => obs.observe(b, {attributes: true, attributeFilter: ['class']}));
                    const fim = setInterval(() => { if (!document.documentElement.classList.contains('tocando-audio')) { clearInterval(fim); obs.disconnect(); res(ordem); } }, 200);
                    setTimeout(() => { clearInterval(fim); obs.disconnect(); res(ordem); }, 25000);
                })""")
            erra = q in (1, 4) or p["id"] == "M03"   # erra 1 vez nas perguntas 2 e 5 de cada nível e no M03
            erra_duas = q == 6          # erra 2 vezes na última
            erros_fazer = 2 if erra_duas else (1 if erra else 0)
            erradas = [i for i in range(p["n"]) if i != p["correta"]][:erros_fazer]
            for e in erradas:
                await responder(pg, e); toques += 1
                await visivel(pg, "#modalTentar")
                await pg.click("#btnTentar")
                await pg.wait_for_selector("#modalTentar", state="hidden")
            await responder(pg, p["correta"]); toques += 1
            esperado_estrelas[nivel].append("ouro" if erros_fazer == 0 else "prata")
            await visivel(pg, "#tela-acerto")
            titulos.add(await pg.inner_text("#acertoTitulo"))
            await pg.click("#btnProxima")
            if q < 6: await visivel(pg, "#tela-pergunta")
        await visivel(pg, "#tela-resultado")
        total = await pg.locator("#resEstrelas img").count()
        fala = await pg.inner_text("#resFala")
        # uma estrela dourada por desafio concluído, com ou sem erro (decisão de 22/10/2026)
        ok(total == len(esperado_estrelas[nivel]) and fala == f"Você conquistou {total} estrelas!",
           f"{nivel}: {total} estrelas douradas, uma por desafio, mesmo nos que tiveram erro ({fala})")
        if nivel != "dificil":
            ok("Próximo nível" in await pg.inner_text("#btnResPrincipal"), f"{nivel}: botão Próximo nível")
            await pg.click("#btnResPrincipal"); await visivel(pg, "#btnIniciar"); await pg.click("#btnIniciar"); await visivel(pg, "#tela-pergunta")
    ok("Jogar de novo" in await pg.inner_text("#btnResPrincipal"), "fim do Difícil: botão Jogar de novo")
    ok("Aventura do Saber" in await pg.inner_text("#resTexto"), "fim do Difícil: mensagem de conclusão da aventura")
    ok(await total_registros(pg) == toques, f"registro: {toques} toques = {await total_registros(pg)} linhas")
    ok(len(titulos) == 4, "títulos de acerto variam: " + ", ".join(sorted(titulos)))
    ok(realce_m07 == [0, 1, 2], f"M07: imagens acenderam na ordem das palavras faladas {realce_m07}")
    tocados = await pg.evaluate("window.__tocados")
    ok("f01-comando.mp3" in tocados and "abertura.mp3" in tocados and "nivel-medio.mp3" in tocados, "áudios de abertura, nível e comando tocaram")
    seq = [t for t in tocados if t.startswith("m07-comando")]
    ok(seq[:5] == [f"m07-comando-{i}.mp3" for i in range(1, 6)], "M07: as 5 partes do comando tocaram em ordem")
    ok("fim-dificil.mp3" in tocados and "tentar-1.mp3" in tocados and "tentar-2.mp3" in tocados, "áudios de nova tentativa e de fim tocaram")
    # área do professor e arquivo .txt
    await pg.click("#btnResInicio"); await visivel(pg, "#tela-nome")
    ok(await pg.input_value("#nomeCrianca") == "", "Voltar ao início limpa o nome para a próxima criança")
    await pg.click("#btnProfessor"); await visivel(pg, "#tela-professor")
    ok(f"{toques} registros de 1 criança" in await pg.inner_text("#profResumo"), "área do professor mostra o total")
    async with pg.expect_download() as d:
        await pg.click("#btnBaixar")
    dl = await d.value
    txt = open(await dl.path(), encoding="utf-8-sig").read()
    linhas = [l for l in txt.splitlines() if re.match(r"^\d+;", l)]
    nums = [int(l.split(";")[0]) for l in linhas]
    ok(dl.suggested_filename.startswith("registros-aventura-do-saber-") and dl.suggested_filename.endswith(".txt"), "nome do arquivo: " + dl.suggested_filename)
    ok(nums == list(range(1, toques + 1)), f"numeração sequencial de 1 a {toques}")
    ok(all(len(l.split(";")) == 12 for l in linhas), "todas as linhas com 12 colunas")
    ok("nº;data;hora;criança;nível;pergunta;área;assunto;habilidade;tentativa;resposta escolhida;resultado" in txt, "cabeçalho das colunas presente")
    primeira = linhas[0].split(";")
    ok(primeira[3] == "Ana B." and primeira[4] == "Fácil" and primeira[5] == "F01" and re.match(r"\d\d/\d\d/\d{4}", primeira[1]) and re.match(r"\d\d:\d\d:\d\d", primeira[2]), "linha 1 tem nome, nível, pergunta, data e hora: " + ";".join(primeira[:6]))
    m03 = [l for l in linhas if ";M03;" in l]
    ok(len(m03) == 2 and m03[0].endswith(";erro") and "em cima do assento" in m03[0] and "embaixo da cadeira" in m03[1] and m03[1].endswith(";acerto"), "M03 (arrastar): erro e acerto registrados com a área escolhida")
    ok("RESUMO POR CRIANÇA E DIA" in txt and re.search(r"Ana B\. · \d{2}/\d{2}/\d{4}: Contagem e quantidades", txt) is not None,
       "resumo por criança, dia e área no fim do arquivo")
    ok("· BNCC EI03ET07" in txt and "(EI03ET07)" not in txt, "habilidade com a referência da BNCC sem parênteses duplos")
    print("     amostra do .txt:", linhas[0][:110], "…")
    await pg.click("#btnLimpar")
    ok("Toque de novo" in await pg.inner_text("#btnLimpar"), "apagar pede confirmação")
    await pg.click("#btnLimpar")
    ok(await total_registros(pg) == 0 and "Nenhum registro" in await pg.inner_text("#profResumo"), "registros apagados após a confirmação")
    ok(not pg.erros, "sem erros de JavaScript " + str(pg.erros))
    await ctx.close()

# ---------------------------------------------------------------- T2
async def toque_duplo(browser):
    print("== T2 toques repetidos não duplicam o registro")
    ctx, pg = await nova(browser, viewport={"width": 1366, "height": 650})
    await comecar(pg)
    antes = await total_registros(pg)
    await pg.dblclick("#pergAlternativas .alt >> nth=1")
    await pg.click("#pergAlternativas .alt >> nth=2", force=True)
    await visivel(pg, "#modalTentar")
    ok(await total_registros(pg) - antes == 1, "três toques rápidos durante o retorno geram 1 registro")
    await pg.click("#btnTentar")
    ok(await pg.locator("#pergAlternativas .alt >> nth=1").is_disabled(), "alternativa tentada fica desativada")
    await pg.click("#pergAlternativas .alt >> nth=1", force=True)
    ok(await total_registros(pg) - antes == 1, "tocar na alternativa apagada não registra nada")
    await pg.click("#pergAlternativas .alt >> nth=0")
    await pg.click("#pergAlternativas .alt >> nth=0", force=True)
    await visivel(pg, "#tela-acerto")
    ok(await total_registros(pg) - antes == 2, "acerto registrado uma única vez")
    ok(not pg.erros, "sem erros de JavaScript " + str(pg.erros))
    await ctx.close()

# ---------------------------------------------------------------- T3
async def teclado(browser):
    print("== T3 só teclado")
    ctx, pg = await nova(browser, viewport={"width": 1366, "height": 650})
    await pg.goto(URL)
    await pg.keyboard.type("Bia")
    await pg.keyboard.press("Enter")
    await visivel(pg, "#btnComecar")
    ok(await pg.evaluate("document.activeElement.id") == "btnComecar", "foco vai para o botão Começar")
    await pg.keyboard.press("Enter"); await visivel(pg, "#btnIniciar")
    await pg.keyboard.press("Enter"); await visivel(pg, "#tela-pergunta")
    ok(await pg.evaluate("document.activeElement.id") == "btnRepetir", "na pergunta, o foco começa no botão de ouvir")
    await pg.keyboard.press("Tab"); await pg.keyboard.press("Tab")   # vai para a 2ª alternativa (errada no F01)
    await pg.keyboard.press("Enter"); await visivel(pg, "#modalTentar")
    ok(await pg.evaluate("document.activeElement.id") == "btnTentar", "aviso de nova tentativa recebe o foco")
    await pg.keyboard.press("Escape"); await pg.wait_for_selector("#modalTentar", state="hidden")
    ok(True, "Esc fecha o aviso")
    await pg.keyboard.press("Tab"); await pg.keyboard.press("Space"); await visivel(pg, "#tela-acerto")
    ok(await pg.evaluate("document.activeElement.id") == "btnProxima", "acerto pelo teclado; foco no botão Próxima pergunta")
    ok(not pg.erros, "sem erros de JavaScript " + str(pg.erros))
    await ctx.close()

# ---------------------------------------------------------------- T4
async def toque(browser):
    print("== T4 tela de toque (Chromebook) incluindo arrastar com o dedo no M03")
    ctx, pg = await nova(browser, viewport={"width": 1366, "height": 650}, has_touch=True)
    await pg.goto(URL)
    await pg.tap("#nomeCrianca"); await pg.keyboard.type("Caio")
    await pg.tap("#formNome button[type=submit]"); await visivel(pg, "#btnComecar")
    await pg.tap("#btnComecar"); await visivel(pg, "#btnIniciar"); await pg.tap("#btnIniciar"); await visivel(pg, "#tela-pergunta")
    for nivel in range(2):
        for q in range(7):
            c = await pg.evaluate("Jogo.perguntaAtual().correta")
            pid = await pg.evaluate("Jogo.perguntaAtual().id")
            if pid == "M03":
                await responder(pg, 2, toque=True); await visivel(pg, "#modalTentar")
                ok(True, "M03: bola arrastada com o dedo até a área errada abre o aviso")
                await pg.tap("#btnTentar"); await pg.wait_for_selector("#modalTentar", state="hidden"); await pg.wait_for_timeout(450)
                pos = await pg.evaluate("(() => { const o = document.querySelector('.arrastar .objeto'); return [o.style.left, o.style.top]; })()")
                inicio = await pg.evaluate("(() => { const o = Jogo.perguntaAtual().cena.objeto; return [o.x + '%', o.y + '%']; })()")
                ok(pos == inicio, f"M03: a bola volta ao ponto de partida {pos}")
                ok(await pg.locator(".arrastar .zona >> nth=2").is_disabled(), "M03: área já tentada fica desativada")
            await responder(pg, c, toque=True)
            await visivel(pg, "#tela-acerto"); await pg.tap("#btnProxima")
            if q < 6: await visivel(pg, "#tela-pergunta")
        await visivel(pg, "#tela-resultado")
        if nivel == 0:
            await pg.tap("#btnResPrincipal"); await visivel(pg, "#btnIniciar"); await pg.tap("#btnIniciar"); await visivel(pg, "#tela-pergunta")
    ok(True, "níveis Fácil e Médio concluídos só com toques")
    ok(not pg.erros, "sem erros de JavaScript " + str(pg.erros))
    await ctx.close()

# ---------------------------------------------------------------- T5
async def sair(browser):
    print("== T5 botão de sair (para o adulto)")
    ctx, pg = await nova(browser, viewport={"width": 1366, "height": 650})
    await comecar(pg)
    await pg.click("#btnSair"); await visivel(pg, "#modalSair")
    await pg.click("#btnContinuar"); await pg.wait_for_selector("#modalSair", state="hidden")
    ok(await pg.is_visible("#tela-pergunta"), "Continuar jogando volta para a mesma pergunta")
    await pg.click("#btnSair"); await pg.click("#btnConfirmaSair"); await visivel(pg, "#tela-nome")
    ok(await pg.is_hidden("#btnSair"), "na tela de nome o botão de sair some")
    ok(not pg.erros, "sem erros de JavaScript " + str(pg.erros))
    await ctx.close()

# ---------------------------------------------------------------- T6
async def arquivo_local(browser):
    print("== T6 aberto direto do arquivo (file://), sem servidor")
    ctx, pg = await nova(browser, viewport={"width": 1366, "height": 650})
    await pg.goto(ARQ)
    await pg.fill("#nomeCrianca", "Teste"); await pg.click("#formNome button[type=submit]")
    await visivel(pg, "#btnComecar"); await pg.click("#btnComecar"); await visivel(pg, "#btnIniciar"); await pg.click("#btnIniciar")
    await visivel(pg, "#tela-pergunta"); await pg.click("#pergAlternativas .alt >> nth=0"); await visivel(pg, "#tela-acerto")
    ok(True, "funciona por file:// (sem servidor)")
    ok(not pg.erros, "sem erros de JavaScript " + str(pg.erros))
    await ctx.close()

# ---------------------------------------------------------------- T7
async def sem_armazenamento(browser):
    print("== T7 navegador que bloqueia o armazenamento")
    ctx, pg = await nova(browser, viewport={"width": 1366, "height": 650})
    await ctx.add_init_script("Object.defineProperty(window, 'localStorage', { get() { throw new Error('bloqueado'); } });")
    await comecar(pg)
    await pg.click("#pergAlternativas .alt >> nth=0"); await visivel(pg, "#tela-acerto")
    ok(await total_registros(pg) == 1, "registro continua funcionando na memória")
    await pg.click("#btnSair"); await pg.click("#btnConfirmaSair"); await pg.click("#btnProfessor")
    ok(await pg.is_visible("#profAviso"), "área do professor avisa que os dados não ficarão guardados")
    ok(not pg.erros, "sem erros de JavaScript " + str(pg.erros))
    await ctx.close()

# ---------------------------------------------------------------- T8
async def tamanhos(browser):
    print("== T8 tamanhos de tela (sem rolagem lateral; sem rolagem vertical a partir de 1024 x 600)")
    alvos = {"F05": "pergunta com cena e imagens", "M02": "trenzinho", "M03": "arrastar", "D01": "estrelas espalhadas", "D05": "montagens"}
    for (w, h) in [(1366, 650), (1280, 720), (1024, 600), (768, 1024), (390, 844)]:
        ctx, pg = await nova(browser, viewport={"width": w, "height": h})
        await comecar(pg)
        problemas = []
        while True:
            pid = await pg.evaluate("Jogo.perguntaAtual().id")
            m = await pg.evaluate("({sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight})")
            if m["sw"] > m["iw"] + 1: problemas.append(f"{pid} rolagem lateral {m['sw']}>{m['iw']}")
            if w >= 1024 and m["sh"] > m["ih"] + 1: problemas.append(f"{pid} rolagem vertical {m['sh']}>{m['ih']}")
            if pid in alvos and (w, h) in [(1366, 650), (390, 844)]:
                await pg.screenshot(path=str(OUT / f"tam-{w}x{h}-{pid}.png"))
            c = await pg.evaluate("Jogo.perguntaAtual().correta")
            await responder(pg, c); await visivel(pg, "#tela-acerto")
            m = await pg.evaluate("({sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight})")
            if m["sw"] > m["iw"] + 1: problemas.append(f"acerto {pid} rolagem lateral")
            if w >= 1024 and m["sh"] > m["ih"] + 1: problemas.append(f"acerto {pid} rolagem vertical {m['sh']}>{m['ih']}")
            await pg.click("#btnProxima")
            await pg.wait_for_timeout(250)
            if await pg.is_visible("#tela-resultado"):
                nivel = await pg.evaluate("Jogo.estado.nivel")
                if nivel == 2: break
                await pg.click("#btnResPrincipal"); await visivel(pg, "#btnIniciar"); await pg.click("#btnIniciar")
            await visivel(pg, "#tela-pergunta")
        ok(not problemas, f"{w}x{h}: " + ("sem rolagem indevida" if not problemas else "; ".join(problemas[:6])))
        ok(not pg.erros, f"{w}x{h}: sem erros de JavaScript " + str(pg.erros))
        await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        for t in [partida_completa, toque_duplo, teclado, toque, sair, arquivo_local, sem_armazenamento, tamanhos]:
            await t(b)
        await b.close()
    print("\nfalhas:", falhas)
    print("capturas de tela em:", OUT)

asyncio.run(main())
_servidor.shutdown()
sys.exit(1 if falhas else 0)
