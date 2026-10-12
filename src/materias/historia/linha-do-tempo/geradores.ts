import { ERAS, EVENTOS, PERSONAGENS, RELACOES, evento } from '@/conteudo/historia/linhaDoTempo'
import { rotuloAno, type Acontecimento, type Personagem, type Regiao, type Relacao } from '@/conteudo/historia/tipos'
import type { Correcao, Desafio, Nivel } from '@/desafios/tipos'
import type { InstanciaMulti } from '@/desafios/simples'
import { criarRng, embaralhar, escolher, type Rng } from '@/lib/rng'
import { lista, montar, type Opc } from '../../biologia/comum/auxiliares'
import { anoFinal, distanciaAnos, sobrepoe } from './calculo'

/* ------------------------------------------------------------------ utilidades */

const ano = (e: Acontecimento) => rotuloAno(e)
const nome = (e: Acontecimento) => `${e.titulo} (${ano(e)})`
const duracao = (e: Acontecimento) => anoFinal(e) - e.inicio
const NOME_REGIAO: Record<Regiao, string> = { brasil: 'no Brasil', mundo: 'no mundo' }

/** Acontecimentos com data bem definida, sem "c." (bons para ordenar e comparar). */
const exatos = EVENTOS.filter((e) => !e.aprox)

function sortearVarios<T>(rng: Rng, itens: readonly T[], n: number): T[] {
  return embaralhar(rng, itens).slice(0, n)
}

const relacoesDe = (id: string): Relacao[] => RELACOES.filter((r) => r.de === id)
const relacoesPara = (id: string): Relacao[] => RELACOES.filter((r) => r.para === id)
const relacionados = (a: string, b: string) => RELACOES.some((r) => (r.de === a && r.para === b) || (r.de === b && r.para === a))

/** "5 anos antes" / "12 anos depois" / "ao mesmo tempo" de `a` em relação a `b`. */
function relativo(a: Acontecimento, b: Acontecimento): string {
  if (sobrepoe(a, b)) return 'ao mesmo tempo'
  const d = distanciaAnos(a, b)
  return `${d} ano${d === 1 ? '' : 's'} ${a.inicio < b.inicio ? 'antes' : 'depois'}`
}

/* ================================================================== lado a lado: o que acontecia ao mesmo tempo */

export interface DadosLado {
  base: string
  opcoes: string[]
}

export function gerarLado(rng: Rng, nivel: Nivel): InstanciaMulti<DadosLado> {
  const dicas = ['Compare os anos: o que você procura aconteceu durante o período indicado (ou no mesmo ano).', 'Descarte as opções que aconteceram muitas décadas antes ou depois.', 'Lembre as eras: o Brasil colonial convive com o absolutismo e as revoluções; o Império, com o imperialismo; Vargas, com as guerras.']
  const licao = 'Para comparar o Brasil e o mundo, compare os anos. Ex.: a Independência do Brasil (1822) é contemporânea das independências hispano-americanas; a Era Vargas, da crise de 1929 e da Segunda Guerra.'
  const doBrasil = nivel < 3
  const regiaoBase: Regiao = doBrasil ? 'brasil' : 'mundo'
  const regiaoOpc: Regiao = doBrasil ? 'mundo' : 'brasil'
  const margem = nivel === 1 ? 40 : nivel === 2 ? 20 : 15
  const bases = exatos.filter((e) => e.regiao === regiaoBase && (nivel === 1 ? e.peso === 1 : e.peso <= 2) && duracao(e) <= 30)
  const pool = exatos.filter((e) => e.regiao === regiaoOpc && duracao(e) <= 30)
  // tenta bases até achar uma com uma opção certa e três distantes
  for (const base of embaralhar(rng, bases)) {
    const certas = pool.filter((p) => sobrepoe(p, base))
    const longe = pool.filter((p) => distanciaAnos(p, base) >= margem)
    if (certas.length === 0 || longe.length < 3) continue
    const certa = escolher(rng, certas)
    const erradas = sortearVarios(rng, longe, 3)
    const opcoes: Opc[] = erradas.map((p) => ({
      texto: p.titulo,
      porque: `${nome(p)} aconteceu ${relativo(p, base)} de ${nome(base)}, e não ao mesmo tempo.`,
      motivo: `${p.titulo} é de outra época`,
    }))
    return montar<DadosLado>(rng, { texto: certa.titulo, porque: `${nome(certa)} ocorreu ao mesmo tempo que ${nome(base)}.` }, opcoes, {
      enunciado: `${doBrasil ? 'Enquanto' : 'No mundo,'} ${nome(base)}${doBrasil ? ' ocorria no Brasil, que acontecimento do mundo estava em curso?' : ' ocorria. Qual acontecimento brasileiro era contemporâneo dele?'}`,
      resolucao: `${nome(base)} e ${nome(certa)} têm anos em comum. As outras opções: ${erradas.map((p) => nome(p)).join('; ')}.`,
      dicas,
      licao,
      dados: { base: base.id, opcoes: [certa.id, ...erradas.map((p) => p.id)] },
    })
  }
  throw new Error('sem combinação para o desafio lado a lado')
}

/* ================================================================== causa e consequência */

export interface DadosCausa {
  evento: string
  tipo: 'consequenciaEvento' | 'causaEvento' | 'causaTexto' | 'consequenciaTexto'
}

const DICAS_CAUSA = ['A causa vem antes; a consequência vem depois. Compare as datas.', 'Pergunte se o fato poderia ter contribuído para o outro, e se os anos permitem isso.', 'Cuidado: dois fatos próximos no tempo não são necessariamente ligados por causa e efeito.']
const LICAO_CAUSA = 'Causa é o que ajuda a produzir um fato e vem antes dele; consequência é o que decorre dele e vem depois. Um acontecimento posterior nunca pode ser causa de um anterior.'

export function gerarCausa(rng: Rng, nivel: Nivel): InstanciaMulti<DadosCausa> {
  if (nivel === 1) {
    // consequência: relação X → Y; as erradas começaram antes de X
    const opcoesX = [...new Set(RELACOES.map((r) => r.de))].map(evento).filter((x) => x.peso <= 2 && x.inicio >= 1600)
    for (const x of embaralhar(rng, opcoesX)) {
      const antes = EVENTOS.filter((e) => e.id !== x.id && anoFinal(e) < x.inicio - 10 && e.regiao === x.regiao)
      if (antes.length < 3) continue
      const rel = escolher(rng, relacoesDe(x.id))
      const y = evento(rel.para)
      const errados = sortearVarios(rng, antes, 3)
      return montar<DadosCausa>(
        rng,
        { texto: y.titulo, porque: `${rel.texto} (${nome(x)} → ${nome(y)}).` },
        errados.map((e) => ({ texto: e.titulo, porque: `${nome(e)} aconteceu antes de ${nome(x)}; um fato não pode ser consequência de algo que ainda não tinha acontecido.`, motivo: 'um fato anterior não pode ser consequência' })),
        {
          enunciado: `Qual destes acontecimentos foi uma CONSEQUÊNCIA de «${x.titulo}» (${ano(x)})?`,
          resolucao: `${rel.texto} As outras opções começaram antes: ${errados.map(nome).join('; ')}.`,
          dicas: DICAS_CAUSA,
          licao: LICAO_CAUSA,
          dados: { evento: x.id, tipo: 'consequenciaEvento' },
        },
      )
    }
    throw new Error('sem consequência')
  }
  if (nivel === 2) {
    // causa: relação Y → X; as erradas começaram depois de X
    const opcoesX = [...new Set(RELACOES.map((r) => r.para))].map(evento).filter((x) => x.peso <= 2 && x.inicio <= 1990)
    for (const x of embaralhar(rng, opcoesX)) {
      const depois = EVENTOS.filter((e) => e.id !== x.id && e.inicio > anoFinal(x) + 10 && e.regiao === x.regiao)
      if (depois.length < 3) continue
      const rel = escolher(rng, relacoesPara(x.id))
      const y = evento(rel.de)
      const errados = sortearVarios(rng, depois, 3)
      return montar<DadosCausa>(
        rng,
        { texto: y.titulo, porque: `${rel.texto} (${nome(y)} → ${nome(x)}).` },
        errados.map((e) => ({ texto: e.titulo, porque: `${nome(e)} aconteceu depois de ${nome(x)}; um fato posterior não pode ser causa de um anterior.`, motivo: 'um fato posterior não pode ser causa' })),
        {
          enunciado: `Qual destes acontecimentos foi uma CAUSA de «${x.titulo}» (${ano(x)})?`,
          resolucao: `${rel.texto} As outras opções começaram depois: ${errados.map(nome).join('; ')}.`,
          dicas: DICAS_CAUSA,
          licao: LICAO_CAUSA,
          dados: { evento: x.id, tipo: 'causaEvento' },
        },
      )
    }
    throw new Error('sem causa')
  }
  // nível 3: textos de causas e consequências, com a armadilha de trocar causa por consequência
  const pedeCausa = rng() < 0.5
  const candidatos = EVENTOS.filter((x) => x.peso <= 2 && x.inicio >= 1550 && x.inicio <= 1960 && x.causas.length >= 2 && x.consequencias.length >= 2)
  for (const x of embaralhar(rng, candidatos)) {
    // textos de acontecimentos que ainda nem tinham começado (para causa) ou que já tinham terminado (para consequência)
    const fora = EVENTOS.filter((e) => (pedeCausa ? e.inicio > anoFinal(x) + 30 : anoFinal(e) < x.inicio - 30)).flatMap((e) => [...e.causas, ...e.consequencias].map((t) => ({ t, e })))
    if (fora.length < 4) continue
    const certaLista = pedeCausa ? x.causas : x.consequencias
    const armadilhaLista = pedeCausa ? x.consequencias : x.causas
    const certa = escolher(rng, certaLista)
    const armadilha = escolher(rng, armadilhaLista)
    const outros = sortearVarios(rng, fora, 2)
    const opcoes: Opc[] = [
      { texto: armadilha, porque: `Isso foi ${pedeCausa ? 'um efeito (consequência)' : 'uma origem (causa)'} de «${x.titulo}», e não ${pedeCausa ? 'uma causa' : 'uma consequência'}: ${pedeCausa ? 'veio depois' : 'veio antes'} dele.`, motivo: 'trocou causa por consequência' },
      ...outros.map(({ t, e }) => ({ texto: t, porque: `Isso pertence a outro acontecimento, «${e.titulo}» (${ano(e)}), ${pedeCausa ? 'que ocorreu bem depois' : 'que ocorreu bem antes'} de «${x.titulo}».`, motivo: 'fato de outra época' })),
    ]
    const certaTxt = certa
    // evita textos repetidos entre as opções
    if (new Set([certaTxt, ...opcoes.map((o) => o.texto)]).size < 4) continue
    return montar<DadosCausa>(rng, { texto: certaTxt, porque: `Isso foi ${pedeCausa ? 'uma causa' : 'uma consequência'} de «${x.titulo}» (${ano(x)}).` }, opcoes, {
      enunciado: `Sobre «${x.titulo}» (${ano(x)}), qual das afirmações é ${pedeCausa ? 'uma CAUSA' : 'uma CONSEQUÊNCIA'} do acontecimento?`,
      resolucao: `${pedeCausa ? 'Causas' : 'Consequências'} de «${x.titulo}»: ${lista(certaLista.map((t) => t.toLowerCase()))}.`,
      dicas: ['A causa acontece ou existe antes; a consequência, depois.', 'Uma das alternativas descreve o oposto do que se pede (causa no lugar de consequência).', 'Verifique se o fato descrito pertence ao período do acontecimento citado.'],
      licao: LICAO_CAUSA,
      dados: { evento: x.id, tipo: pedeCausa ? 'causaTexto' : 'consequenciaTexto' },
    })
  }
  throw new Error('sem texto de causa')
}

/* ================================================================== intruso */

export interface DadosIntruso {
  era: string
  intruso: string
}

export function gerarIntruso(rng: Rng, nivel: Nivel): InstanciaMulti<DadosIntruso> {
  const margem = nivel === 1 ? 80 : nivel === 2 ? 40 : 15
  for (const era of embaralhar(rng, ERAS)) {
    const janela = { inicio: era.inicio, fim: era.fim }
    const dentro = EVENTOS.filter((e) => e.regiao === era.regiao && e.inicio > era.inicio && e.inicio < era.fim)
    const fora = EVENTOS.filter((e) => e.regiao === era.regiao && distanciaAnos(e, janela) >= margem)
    if (dentro.length < 3 || fora.length < 1) continue
    const membros = sortearVarios(rng, dentro, 3)
    const intruso = escolher(rng, fora)
    const opcoes: Opc[] = membros.map((m) => ({
      texto: m.titulo,
      porque: `${nome(m)} está dentro do período «${era.nome}» (${era.inicio}–${era.fim}), então não é o intruso.`,
      motivo: `${m.titulo} pertence ao período`,
    }))
    return montar<DadosIntruso>(rng, { texto: intruso.titulo, porque: `${nome(intruso)} aconteceu ${intruso.inicio < era.inicio ? 'antes' : 'depois'} de «${era.nome}» (${era.inicio}–${era.fim}): é o intruso.` }, opcoes, {
      enunciado: `Estes acontecimentos ${NOME_REGIAO[era.regiao]} pertencem ao período «${era.nome}» (${era.inicio}–${era.fim}), exceto um. Qual é o intruso?`,
      resolucao: `${era.resumo} Dentro do período: ${membros.map(nome).join('; ')}. Fora: ${nome(intruso)}.`,
      dicas: ['Lembre as datas que delimitam o período.', 'Procure o acontecimento cujo ano cai antes do começo ou depois do fim.', era.resumo],
      licao: `${era.nome} (${NOME_REGIAO[era.regiao]}): ${era.inicio}–${era.fim}. ${era.resumo}`,
      dados: { era: era.id, intruso: intruso.id },
    })
  }
  throw new Error('sem intruso')
}

/* ================================================================== ordem cronológica */

export interface InstanciaOrdem {
  /** ordem em que os cartões aparecem */
  ids: string[]
  /** ordem cronológica correta */
  certa: string[]
  enunciado: string
  nivel: Nivel
}

const LACUNA: Record<Nivel, number> = { 1: 40, 2: 8, 3: 2 }
const QUANTOS: Record<Nivel, number> = { 1: 4, 2: 5, 3: 6 }

export function sortearConjuntoOrdenavel(rng: Rng, n: number, lacuna: number): Acontecimento[] {
  for (let tentativa = 0; tentativa < 200; tentativa++) {
    const escolhidos: Acontecimento[] = []
    for (const e of embaralhar(rng, exatos)) {
      if (escolhidos.every((x) => Math.abs(x.inicio - e.inicio) >= lacuna)) escolhidos.push(e)
      if (escolhidos.length === n) return escolhidos
    }
  }
  throw new Error('sem conjunto ordenável')
}

export const ordenar = (eventos: Acontecimento[]) => [...eventos].sort((a, b) => a.inicio - b.inicio)

export const desafioOrdem: Desafio<InstanciaOrdem, string[]> = {
  id: 'historia/linha-do-tempo/ordem',
  materia: 'historia',
  tema: 'linha-do-tempo',
  titulo: 'Ordene os fatos',
  gerar(semente, nivel) {
    const rng = criarRng(semente * 2654435761 + nivel * 97)
    const eventos = sortearConjuntoOrdenavel(rng, QUANTOS[nivel], LACUNA[nivel])
    const certa = ordenar(eventos).map((e) => e.id)
    let ids = embaralhar(rng, certa)
    if (ids.join() === certa.join()) ids = [...certa].reverse()
    return {
      ids,
      certa,
      nivel,
      enunciado: 'Coloque os acontecimentos em ordem cronológica, do mais antigo (em cima) para o mais recente (embaixo). Use as setas de cada cartão ou arraste.',
    }
  },
  corrigir(inst, resposta) {
    const posicao = new Map(resposta.map((id, i) => [id, i]))
    let paresCertos = 0
    let pares = 0
    const trocas: string[] = []
    for (let i = 0; i < inst.certa.length; i++)
      for (let j = i + 1; j < inst.certa.length; j++) {
        pares++
        const a = inst.certa[i] as string
        const b = inst.certa[j] as string
        if ((posicao.get(a) as number) < (posicao.get(b) as number)) paresCertos++
        else trocas.push(`${a}|${b}`)
      }
    if (trocas.length === 0) return { correto: true, parcial: 1, feedback: 'Ordem certa! ' + inst.certa.map((id) => nome(evento(id))).join(' → ') + '.' }
    // pares fora de ordem: prefere os vizinhos na sua resposta, que são os mais fáceis de explicar
    const lista = trocas.map((t) => t.split('|') as [string, string])
    const [a, b] = lista[0] as [string, string]
    const ea = evento(a)
    const eb = evento(b)
    const rel = RELACOES.find((r) => (r.de === a && r.para === b) || (r.de === b && r.para === a))
    const extra = rel ? ` Além disso, ${rel.texto.charAt(0).toLowerCase()}${rel.texto.slice(1)}` : ''
    return {
      correto: false,
      parcial: paresCertos / pares,
      feedback: `${nome(ea)} veio antes de ${nome(eb)}, mas na sua ordem ${eb.titulo} aparece primeiro.${extra} Ao todo, ${lista.length} par${lista.length === 1 ? '' : 'es'} de cartões ${lista.length === 1 ? 'está' : 'estão'} fora de ordem.`,
      motivo: 'ordem cronológica errada',
      licao: 'Compare os anos de início: é o ano em que o acontecimento começa que define a posição. Causas vêm antes das consequências.',
    }
  },
  dicas: (inst) => [
    'Comece pelos extremos: qual é, com certeza, o mais antigo? E o mais recente?',
    inst.nivel === 1 ? 'Os fatos estão separados por séculos: pense nas grandes eras (Colônia, Império, República, ditadura).' : 'Quando as datas são próximas, procure relações de causa e consequência: a causa vem antes.',
    `O primeiro da lista correta é: ${evento(inst.certa[0] as string).titulo}.`,
  ],
  explicar: (inst) => `Ordem cronológica: ${inst.certa.map((id) => nome(evento(id))).join(' → ')}.`,
}

/* ================================================================== ligar (causa → consequência; personagem → feito) */

export interface ItemLigar {
  id: string
  rotulo: string
}

export interface InstanciaLigar {
  titulo: string
  enunciado: string
  /** itens da esquerda, na ordem mostrada */
  esquerda: ItemLigar[]
  /** opções da direita (as certas e, nos níveis altos, alguns distratores) */
  direita: ItemLigar[]
  /** resposta certa: id da esquerda → id da direita */
  certa: Record<string, string>
  /** explicação de cada ligação certa */
  porque: Record<string, string>
  nivel: Nivel
}

function corrigirLigar(inst: InstanciaLigar, resposta: Record<string, string>, tipo: 'causa' | 'personagem'): Correcao {
  const nomeDe = (id: string) => (inst.esquerda.find((x) => x.id === id) as ItemLigar).rotulo
  const erros = inst.esquerda.filter((x) => resposta[x.id] !== inst.certa[x.id])
  const certos = inst.esquerda.length - erros.length
  if (erros.length === 0) return { correto: true, parcial: 1, feedback: 'Todas as ligações estão certas.' }
  const vazio = erros.filter((x) => !resposta[x.id])
  const explicacoes = erros.slice(0, 2).map((x) => {
    const escolhido = resposta[x.id]
    if (!escolhido) return `Você não ligou «${nomeDe(x.id)}».`
    const dono = inst.esquerda.find((y) => inst.certa[y.id] === escolhido)
    const sobre = dono ? (tipo === 'causa' ? ` A opção escolhida é consequência de «${dono.rotulo}».` : ` A opção escolhida pertence a «${dono.rotulo}».`) : tipo === 'causa' ? ' A opção escolhida não tem relação direta com nenhum dos fatos.' : ''
    return `«${nomeDe(x.id)}» não ${tipo === 'causa' ? 'provocou o acontecimento' : 'fez o que'} que você marcou.${sobre} Certo: ${inst.porque[x.id]}`
  })
  return {
    correto: false,
    parcial: certos / inst.esquerda.length,
    feedback: `${certos} de ${inst.esquerda.length} ligações certas. ${explicacoes.join(' ')}${vazio.length > 2 ? ' Faltam outras ligações.' : ''}`.trim(),
    motivo: tipo === 'causa' ? 'ligou causa e consequência erradas' : 'ligou personagem ao feito errado',
    licao: tipo === 'causa' ? 'A causa vem antes e ajuda a produzir a consequência; confira se a explicação do vínculo faz sentido, e não só as datas.' : 'Associe cada personagem ao período e à decisão: quem fez o quê, em que contexto.',
  }
}

/* ---------- cadeia de causas */

export const desafioCadeia: Desafio<InstanciaLigar, Record<string, string>> = {
  id: 'historia/linha-do-tempo/cadeia',
  materia: 'historia',
  tema: 'linha-do-tempo',
  titulo: 'Cadeia de causas',
  gerar(semente, nivel) {
    const rng = criarRng(semente * 2246822519 + nivel * 131)
    const n = nivel === 1 ? 3 : nivel === 2 ? 4 : 5
    for (let tentativa = 0; tentativa < 300; tentativa++) {
      // relações com causas e consequências todas diferentes e sem cadeias entre elas
      const escolhidas: Relacao[] = []
      for (const r of embaralhar(rng, RELACOES)) {
        const de = evento(r.de)
        const para = evento(r.para)
        if (nivel === 1 && (de.peso === 3 || para.peso === 3)) continue
        const ocupados = new Set(escolhidas.flatMap((x) => [x.de, x.para]))
        if (ocupados.has(r.de) || ocupados.has(r.para)) continue
        // nenhuma outra relação ligando as causas escolhidas às consequências escolhidas
        const futuras = [...escolhidas, r]
        const ambiguo = futuras.some((a) => futuras.some((b) => a !== b && (relacionados(a.de, b.para) || evento(a.de).conexoes.includes(b.para))))
        if (ambiguo) continue
        escolhidas.push(r)
        if (escolhidas.length === n) break
      }
      if (escolhidas.length < n) continue
      const causas = escolhidas.map((r) => r.de)
      let direita = escolhidas.map((r) => r.para)
      if (nivel === 3) {
        const livres = EVENTOS.filter((e) => !causas.includes(e.id) && !direita.includes(e.id) && causas.every((c) => !relacionados(c, e.id) && !evento(c).conexoes.includes(e.id)) && e.peso <= 2)
        direita = [...direita, ...sortearVarios(rng, livres, 2).map((e) => e.id)]
      }
      return {
        titulo: 'Cadeia de causas',
        enunciado: 'Ligue cada acontecimento (a causa) ao acontecimento que ele ajudou a provocar (a consequência). ' + (nivel === 3 ? 'Atenção: há alternativas que não são consequência de nenhum dos fatos.' : 'Cada alternativa serve a um único fato.'),
        esquerda: embaralhar(rng, causas).map((id) => ({ id, rotulo: nome(evento(id)) })),
        direita: embaralhar(rng, direita).map((id) => ({ id, rotulo: nome(evento(id)) })),
        certa: Object.fromEntries(escolhidas.map((r) => [r.de, r.para])),
        porque: Object.fromEntries(escolhidas.map((r) => [r.de, r.texto])),
        nivel,
      }
    }
    throw new Error('sem cadeia')
  },
  corrigir: (inst, resposta) => corrigirLigar(inst, resposta, 'causa'),
  dicas: (inst) => [
    'A consequência vem depois da causa: use as datas para descartar opções.',
    'Pergunte "o que A mudou, para que B acontecesse?". Se não houver resposta, não é a ligação.',
    `Uma das ligações certas: «${evento(Object.keys(inst.certa)[0] as string).titulo}» → «${evento(Object.values(inst.certa)[0] as string).titulo}».`,
  ],
  explicar: (inst) => Object.entries(inst.certa).map(([d, p]) => `${evento(d).titulo} → ${evento(p).titulo}: ${inst.porque[d]}`).join(' '),
}

/* ---------- quem fez o quê */

const personagemDe = (p: Personagem) => evento(p.evento)

export const desafioQuem: Desafio<InstanciaLigar, Record<string, string>> = {
  id: 'historia/linha-do-tempo/quem',
  materia: 'historia',
  tema: 'linha-do-tempo',
  titulo: 'Quem fez o quê',
  gerar(semente, nivel) {
    const rng = criarRng(semente * 3266489917 + nivel * 71)
    const n = nivel === 1 ? 3 : nivel === 2 ? 4 : 5
    for (let tentativa = 0; tentativa < 300; tentativa++) {
      const primeiro = escolher(rng, PERSONAGENS)
      const e0 = personagemDe(primeiro)
      const outros = embaralhar(rng, PERSONAGENS).filter((p) => p.id !== primeiro.id && personagemDe(p).id !== e0.id)
      const escolhidos = [primeiro]
      for (const p of outros) {
        const e = personagemDe(p)
        const ok =
          nivel === 1
            ? escolhidos.every((x) => distanciaAnos(personagemDe(x), e) >= 60)
            : nivel === 2
              ? escolhidos.every((x) => personagemDe(x).id !== e.id)
              : e.regiao === e0.regiao && escolhidos.every((x) => Math.abs(personagemDe(x).inicio - e.inicio) <= 45 && personagemDe(x).id !== e.id)
        if (ok) escolhidos.push(p)
        if (escolhidos.length === n) break
      }
      if (escolhidos.length < n) continue
      return {
        titulo: 'Quem fez o quê',
        enunciado: 'Ligue cada personagem ao que ele fez ou decidiu. Cada alternativa serve a uma única pessoa.',
        esquerda: embaralhar(rng, escolhidos).map((p) => ({ id: p.id, rotulo: p.nome })),
        direita: embaralhar(rng, escolhidos).map((p) => ({ id: p.id, rotulo: `${p.feito.charAt(0).toUpperCase()}${p.feito.slice(1)}` })),
        certa: Object.fromEntries(escolhidos.map((p) => [p.id, p.id])),
        porque: Object.fromEntries(escolhidos.map((p) => [p.id, `${p.nome} ${p.feito} (${nome(personagemDe(p))}).`])),
        nivel,
      }
    }
    throw new Error('sem personagens')
  },
  corrigir: (inst, resposta) => corrigirLigar(inst, resposta, 'personagem'),
  dicas: (inst) => [
    'Situe cada personagem no tempo: em que período e em que país ele atuou?',
    'Cada feito tem uma data ou um contexto que o delimita (por exemplo, "em 1888" ou "Estado Novo").',
    `Um deles: ${(inst.esquerda[0] as ItemLigar).rotulo} ${(PERSONAGENS.find((p) => p.id === (inst.esquerda[0] as ItemLigar).id) as Personagem).feito}.`,
  ],
  explicar: (inst) => Object.values(inst.porque).join(' '),
}

