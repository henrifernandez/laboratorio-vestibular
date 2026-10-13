import { CORRENTES, CORRENTE_DOS_PENSADORES, GRUPOS_INTRUSO, correnteDe, correntesAceitas, type Corrente } from '@/conteudo/filosofia/correntes'
import { PENSADORES } from '@/conteudo/filosofia/pensadores'
import type { InstanciaLigar } from '@/desafios/ligar'
import type { InstanciaMulti } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, type Rng } from '@/lib/rng'
import { montar, type Opc } from '@/materias/biologia/comum/auxiliares'
import { gerarLigarConceito, type DadosAutor } from '../../humanas/comum/geradores'

const pensador = (id: string) => PENSADORES.find((p) => p.id === id)!
const corrente = (id: string) => correnteDe(id) as Corrente
const principal = (pensadorId: string) => (CORRENTE_DOS_PENSADORES[pensadorId] as { principal: string }).principal
const QUANTOS: Record<Nivel, number> = { 1: 3, 2: 4, 3: 5 }

export const gerarLigarConceitoFilosofia = (rng: Rng, nivel: Nivel) => gerarLigarConceito(rng, nivel, PENSADORES)

/* ------------------------------------------------------------------ ligar pensadores às correntes */

/**
 * Cada pensador é ligado à corrente mais associada a ele. Duas ligações não podem ser ambíguas: nenhuma opção da direita
 * pode ser, além da certa, uma corrente a que o pensador também costuma ser ligado (Locke e o contratualismo, por exemplo).
 */
export function gerarLigarCorrente(rng: Rng, nivel: Nivel): InstanciaLigar<DadosAutor> {
  const n = QUANTOS[nivel]
  for (let tentativa = 0; tentativa < 800; tentativa++) {
    const esc = embaralhar(rng, PENSADORES).slice(0, n)
    const certas = esc.map((p) => principal(p.id))
    if (nivel === 1 && new Set(certas).size !== n) continue
    const noLado = [...new Set(certas)]
    if (!esc.every((p) => noLado.every((r) => r === principal(p.id) || !correntesAceitas(p.id).includes(r)))) continue
    let extras: string[] = []
    if (nivel === 3) {
      const livres = CORRENTES.filter((c) => !noLado.includes(c.id) && esc.every((p) => !correntesAceitas(p.id).includes(c.id)) && noLado.every((r) => !corrente(r).parecidas.includes(c.id) && !c.parecidas.includes(r)))
      if (livres.length < 2) continue
      extras = embaralhar(rng, livres)
        .slice(0, 2)
        .map((c) => c.id)
    }
    return {
      titulo: 'Pensador e corrente',
      enunciado: `Ligue cada pensador à corrente com a qual ele é mais associado. ${nivel === 1 ? 'Cada corrente serve a um único pensador.' : 'Mais de um pensador pode pertencer à mesma corrente.'}${nivel === 3 ? ' Atenção: há correntes que não pertencem a nenhum destes pensadores.' : ''}`,
      esquerda: esc.map((p) => ({ id: p.id, rotulo: p.nome })),
      direita: embaralhar(rng, [...noLado, ...extras]).map((id) => ({ id, rotulo: corrente(id).nome })),
      certa: Object.fromEntries(esc.map((p) => [p.id, principal(p.id)])),
      porque: Object.fromEntries(esc.map((p) => [p.id, `${p.nome} (${p.periodo}): ${p.resumo} Corrente: ${corrente(principal(p.id)).nome}. ${corrente(principal(p.id)).sintese}`])),
      nivel,
      dicas: ['Cada corrente tem uma ideia central: razão, experiência, pacto, existência, classes sociais...', `Um deles: ${esc[0]?.nome}: ${esc[0]?.resumo}`, 'Comece pelos pensadores que você tem certeza e elimine as correntes que já têm dono.'],
    }
  }
  throw new Error('sem ligação de correntes')
}

/* ------------------------------------------------------------------ qual corrente defende esta tese? */

const CLARAS = ['idealismo-platonico', 'racionalismo', 'empirismo', 'materialismo-historico', 'existencialismo', 'contratualismo', 'filosofia-politica-sec-xx']

const semDuvida = (alvo: Corrente) => CORRENTES.filter((c) => c.id !== alvo.id && !alvo.parecidas.includes(c.id) && !c.parecidas.includes(alvo.id))

export function gerarTese(rng: Rng, nivel: Nivel): InstanciaMulti<DadosAutor> {
  const alvo = escolher(rng, nivel === 1 ? CLARAS.map(corrente) : CORRENTES)
  const tese = escolher(rng, alvo.teses)
  const pensadoresDe = (c: Corrente) => PENSADORES.filter((p) => correntesAceitas(p.id).includes(c.id)).map((p) => p.nome)
  const quem = (c: Corrente) => (pensadoresDe(c).length > 0 ? ` Pensadores ligados a ela: ${pensadoresDe(c).join(', ')}.` : '')
  if (nivel === 3) {
    // inverso: dada a corrente, reconhecer a tese
    const outras = embaralhar(rng, semDuvida(alvo)).slice(0, 3)
    return montar<DadosAutor>(
      rng,
      { texto: tese, porque: `${alvo.nome}: ${alvo.sintese}` },
      outras.map((o) => ({ texto: escolher(rng, o.teses), porque: `Essa tese é típica de ${o.nome}: ${o.sintese}`, motivo: `atribuiu ao ${o.nome} uma tese de outra corrente` })),
      {
        enunciado: `Qual das teses abaixo é típica de ${alvo.nome}?`,
        resolucao: `${alvo.nome}: ${alvo.sintese}${quem(alvo)}`,
        dicas: [`Ideia central: ${alvo.sintese}`, `Pensadores ligados à corrente: ${pensadoresDe(alvo).join(', ') || 'veja o mapa de pensadores'}.`, 'Elimine as teses que lembram outra corrente.'],
        licao: `${alvo.nome}: ${alvo.sintese}`,
        dados: {},
      },
    )
  }
  const universo = nivel === 1 ? CLARAS.map(corrente) : CORRENTES
  const outras = embaralhar(rng, semDuvida(alvo).filter((c) => universo.some((u) => u.id === c.id))).slice(0, 3)
  const certa: Opc = { texto: alvo.nome, porque: `${alvo.sintese}${quem(alvo)}` }
  const erradas: Opc[] = outras.map((o) => ({ texto: o.nome, porque: `Essa não é a corrente da tese. ${o.nome}: ${o.sintese}`, motivo: `confundiu com ${o.nome}` }))
  return montar<DadosAutor>(rng, certa, erradas, {
    enunciado: `Qual corrente de pensamento defende a seguinte tese? (É uma paráfrase, não uma citação literal.) ${tese}`,
    resolucao: `A tese é de ${alvo.nome}. ${alvo.sintese}${quem(alvo)}`,
    dicas: ['Procure a palavra-chave da tese: razão, experiência, pacto, classes, existência, ideias...', 'Pergunte: a tese trata do conhecimento, da política, da moral ou da natureza da realidade?', 'Elimine as correntes cuja ideia central é outra.'],
    licao: `${alvo.nome}: ${alvo.sintese}`,
    dados: {},
  })
}

/* ------------------------------------------------------------------ o intruso */

export function gerarIntrusoFilosofia(rng: Rng, nivel: Nivel): InstanciaMulti<DadosAutor> {
  const grupos = GRUPOS_INTRUSO.filter((g) => (nivel === 1 ? g.id === 'antiga' || g.id === 'contemporanea' : nivel === 2 ? g.id === 'contratualismo' : g.id === 'iluminismo'))
  const grupo = escolher(rng, grupos)
  const membros = embaralhar(rng, grupo.membros).slice(0, 3)
  const fora = PENSADORES.filter((p) => !grupo.membros.includes(p.id) && !grupo.duvidosos.includes(p.id))
  const intruso = escolher(rng, fora)
  const descrever = (id: string) => `${pensador(id).nome} (${pensador(id).periodo}): ${pensador(id).resumo}`
  return montar<DadosAutor>(
    rng,
    { texto: intruso.nome, porque: `${descrever(intruso.id)} Não pertence a este grupo (${grupo.nome}): ${intruso.tradicao}.` },
    membros.map((id) => ({ texto: pensador(id).nome, porque: `${descrever(id)} Pertence ao grupo: ${grupo.nome}.`, motivo: `achou que ${pensador(id).nome} era o intruso` })),
    {
      enunciado: `Três destes pensadores pertencem ao grupo «${grupo.nome}». Qual é o intruso?`,
      resolucao: `${grupo.nota} O intruso é ${intruso.nome} (${intruso.tradicao}).`,
      dicas: ['Pense na época em que cada pensador viveu e no tema de sua obra.', `Ideia que une o grupo: ${grupo.nota}`, 'Descarte os que você sabe que pertencem ao grupo.'],
      licao: grupo.nota,
      dados: { autorId: intruso.id },
    },
  )
}
