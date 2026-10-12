import { ARESTAS, BANCO_DEBATES, PENSADORES, type Aresta, type Epoca } from '@/conteudo/filosofia/pensadores'
import { autorPorId } from '@/conteudo/humanas'
import type { InstanciaMulti } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, type Rng } from '@/lib/rng'
import { montar, type Opc } from '@/materias/biologia/comum/auxiliares'
import { doBanco, faixaDoBanco } from '@/materias/geografia/comum/banco'
import { gerarConceito, gerarObra, gerarQuem, type DadosAutor } from '../../humanas/comum/geradores'

const nomeDe = (id: string) => autorPorId(PENSADORES, id)?.nome ?? id
const pensador = (id: string) => PENSADORES.find((p) => p.id === id)!

export const gerarQuemFilosofia = (rng: Rng, nivel: Nivel) => gerarQuem(rng, nivel, PENSADORES)
export const gerarConceitoFilosofia = (rng: Rng, nivel: Nivel) => gerarConceito(rng, nivel, PENSADORES)
export const gerarObraFilosofia = (rng: Rng, nivel: Nivel) => gerarObra(rng, nivel, PENSADORES)
export const gerarDebate = (rng: Rng, nivel: Nivel): InstanciaMulti<DadosAutor> => doBanco<DadosAutor>(rng, faixaDoBanco(BANCO_DEBATES, nivel))

/* ------------------------------------------------------------------ época e cronologia */

const resumoPeriodo = (id: string) => `${nomeDe(id)} (${pensador(id).periodo})`

export function gerarEpoca(rng: Rng, nivel: Nivel): InstanciaMulti<DadosAutor> {
  if (nivel === 1) {
    const quatro = embaralhar(rng, PENSADORES).slice(0, 4)
    const primeiro = [...quatro].sort((a, b) => a.nascimento - b.nascimento)[0]!
    return montar<DadosAutor>(
      rng,
      { texto: primeiro.nome, porque: `${resumoPeriodo(primeiro.id)} é o mais antigo do grupo.` },
      quatro.filter((p) => p.id !== primeiro.id).map((p) => ({ texto: p.nome, porque: `${resumoPeriodo(p.id)} viveu depois de ${primeiro.nome}.`, motivo: 'errou a ordem cronológica' })),
      {
        enunciado: 'Qual destes pensadores viveu primeiro?',
        resolucao: quatro.map((p) => resumoPeriodo(p.id)).join('; ') + `. O primeiro é ${primeiro.nome}.`,
        dicas: ['Compare os séculos: a.C. vem antes de d.C.', 'Antiguidade, depois Idade Moderna, depois Contemporânea.', 'Dentro da mesma época, compare as datas de nascimento.'],
        licao: 'Ordem geral: Sócrates, Platão e Aristóteles; Maquiavel, Descartes, Hobbes, Locke, Hume, Rousseau e Kant; Marx, Nietzsche, Sartre e Arendt.',
        dados: { autorId: primeiro.id },
      },
    )
  }
  if (nivel === 2) {
    const epoca = escolher<Epoca>(rng, ['Antiguidade', 'Idade Moderna', 'Contemporânea'])
    const alvo = escolher(rng, PENSADORES.filter((p) => p.epoca === epoca))
    const outros = embaralhar(rng, PENSADORES.filter((p) => p.epoca !== epoca)).slice(0, 3)
    return montar<DadosAutor>(
      rng,
      { texto: alvo.nome, porque: `${resumoPeriodo(alvo.id)} pertence à ${epoca === 'Antiguidade' ? 'Antiguidade' : epoca}.` },
      outros.map((p) => ({ texto: p.nome, porque: `${resumoPeriodo(p.id)} pertence à ${p.epoca === 'Antiguidade' ? 'Antiguidade' : p.epoca}, e não à ${epoca === 'Antiguidade' ? 'Antiguidade' : epoca}.`, motivo: `confundiu a época de ${p.nome}` })),
      {
        enunciado: `Qual destes pensadores pertence à ${epoca === 'Antiguidade' ? 'Antiguidade' : epoca}?${epoca === 'Idade Moderna' ? ' (Conte o Renascimento e os séculos XVI a XVIII.)' : epoca === 'Contemporânea' ? ' (Conte os séculos XIX e XX.)' : ''}`,
        resolucao: `${resumoPeriodo(alvo.id)} é da ${epoca === 'Antiguidade' ? 'Antiguidade' : epoca}.`,
        dicas: ['Antiguidade: antes do ano 0.', 'Idade Moderna: Renascimento e séculos XVI a XVIII.', 'Contemporânea: a partir do século XIX.'],
        licao: 'Antiguidade: Sócrates, Platão, Aristóteles. Idade Moderna: Maquiavel a Kant. Contemporânea: Marx, Nietzsche, Sartre, Arendt.',
        dados: { autorId: alvo.id },
      },
    )
  }
  const tres = embaralhar(rng, PENSADORES).slice(0, 3)
  const ordenados = [...tres].sort((a, b) => a.nascimento - b.nascimento)
  const texto = (lista: typeof tres) => lista.map((p) => p.nome).join(' → ')
  const certa = texto(ordenados)
  const permutacoes = [
    [ordenados[1]!, ordenados[0]!, ordenados[2]!],
    [ordenados[2]!, ordenados[1]!, ordenados[0]!],
    [ordenados[0]!, ordenados[2]!, ordenados[1]!],
    [ordenados[1]!, ordenados[2]!, ordenados[0]!],
    [ordenados[2]!, ordenados[0]!, ordenados[1]!],
  ].filter((l) => texto(l) !== certa)
  const erradas: Opc[] = embaralhar(rng, permutacoes)
    .slice(0, 3)
    .map((l) => ({ texto: texto(l), porque: `A ordem correta é ${certa}. ${resumoPeriodo(ordenados[0]!.id)}; ${resumoPeriodo(ordenados[1]!.id)}; ${resumoPeriodo(ordenados[2]!.id)}.`, motivo: 'errou a ordem cronológica' }))
  return montar<DadosAutor>(rng, { texto: certa, porque: `${ordenados.map((p) => resumoPeriodo(p.id)).join('; ')}.` }, erradas, {
    enunciado: `Qual é a ordem cronológica correta, do mais antigo ao mais recente, destes três pensadores: ${tres.map((p) => p.nome).join(', ')}?`,
    resolucao: `${ordenados.map((p) => resumoPeriodo(p.id)).join('; ')}. Ordem: ${certa}.`,
    dicas: ['Separe primeiro por época: Antiguidade, Idade Moderna, Contemporânea.', 'Dentro da mesma época, compare as datas de nascimento.', 'Lembre as datas aproximadas de cada pensador.'],
    licao: 'Ordem geral: Sócrates, Platão e Aristóteles; Maquiavel, Descartes, Hobbes, Locke, Hume, Rousseau e Kant; Marx, Nietzsche, Sartre e Arendt.',
    dados: { autorId: ordenados[0]!.id },
  })
}

/* ------------------------------------------------------------------ influências */

const relacionados = (id: string) => ARESTAS.filter((a) => a.de === id || a.para === id).flatMap((a) => [a.de, a.para])
const semRelacao = (id: string) => PENSADORES.filter((p) => p.id !== id && !relacionados(id).includes(p.id))

function montarAresta(rng: Rng, aresta: Aresta, pivo: string, resposta: string, enunciado: string, dicas: string[]): InstanciaMulti<DadosAutor> {
  const outros = embaralhar(rng, semRelacao(pivo).filter((p) => p.id !== resposta)).slice(0, 3)
  return montar<DadosAutor>(
    rng,
    { texto: nomeDe(resposta), porque: aresta.explicacao },
    outros.map((p) => ({ texto: p.nome, porque: `${p.nome} (${p.tradicao}) não é apontado como interlocutor de ${nomeDe(pivo)} neste mapa de influências.`, motivo: `escolheu ${p.nome}, sem relação direta` })),
    {
      enunciado,
      resolucao: aresta.explicacao,
      dicas,
      licao: `${nomeDe(aresta.de)} → ${nomeDe(aresta.para)} (${aresta.tipo}): ${aresta.explicacao}`,
      dados: { autorId: resposta },
    },
  )
}

export function gerarInfluencia(rng: Rng, nivel: Nivel): InstanciaMulti<DadosAutor> {
  if (nivel === 1) {
    const aresta = escolher(rng, ARESTAS.filter((a) => a.tipo === 'mestre e discípulo'))
    return montarAresta(rng, aresta, aresta.de, aresta.para, `Quem foi discípulo de ${nomeDe(aresta.de)}?`, ['Pense em quem estudou na escola ou ao lado do mestre.', `O discípulo viveu depois de ${nomeDe(aresta.de)}, na Antiguidade.`, 'Sócrates, Platão e Aristóteles formam uma sequência de mestre e discípulo.'])
  }
  if (nivel === 2) {
    const aresta = escolher(rng, ARESTAS.filter((a) => a.tipo === 'crítica'))
    return montarAresta(rng, aresta, aresta.de, aresta.para, `Qual destes pensadores criticou ideias de ${nomeDe(aresta.de)}?`, ['Procure quem defende uma posição oposta à de ' + nomeDe(aresta.de) + '.', `Corrente de ${nomeDe(aresta.de)}: ${pensador(aresta.de).tradicao}.`, 'O crítico viveu depois do criticado.'])
  }
  const candidatas = PENSADORES.filter((p) => ARESTAS.filter((a) => a.para === p.id).length >= 2)
  const alvo = escolher(rng, candidatas)
  const aresta = escolher(rng, ARESTAS.filter((a) => a.para === alvo.id))
  return montarAresta(rng, aresta, alvo.id, aresta.de, `Qual destes pensadores é apontado como influência, interlocutor ou alvo de crítica de ${alvo.nome}?`, [`Corrente de ${alvo.nome}: ${alvo.tradicao}.`, 'O interlocutor viveu antes do pensador citado.', 'Elimine os pensadores sem relação direta de tema.'])
}
