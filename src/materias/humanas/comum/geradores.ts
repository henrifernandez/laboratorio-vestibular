import type { Autor } from '@/conteudo/humanas'
import type { InstanciaLigar } from '@/desafios/ligar'
import type { InstanciaMulti } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, type Rng } from '@/lib/rng'
import { montar, type Opc } from '@/materias/biologia/comum/auxiliares'
import { faixaDoBanco } from '@/materias/geografia/comum/banco'

/** Dados enviados ao desenho: o autor da resposta, para mostrar o cartão depois que a pessoa responde. */
export interface DadosAutor {
  autorId?: string
}

const NOTA_PARAFRASE = '(É uma paráfrase, não uma citação literal.)'

/** Escolhe `n` autores diferentes do alvo, fora os que dividem a ideia com ele. */
function distratores(rng: Rng, autores: Autor[], alvo: Autor, excluir: string[], n = 3): Autor[] {
  const base = autores.filter((a) => a.id !== alvo.id && !excluir.includes(a.id))
  return embaralhar(rng, base).slice(0, n)
}

const dados = (a: Autor): DadosAutor => ({ autorId: a.id })

/** Frase que lembra quem é o autor, para o feedback das alternativas erradas. */
const quemE = (a: Autor) => `${a.nome} (${a.tradicao}): ${a.resumo}`

/* ------------------------------------------------------------------ qual autor defende esta ideia? */

export interface OpcoesQuem {
  /** ids dos autores sorteados no nível 1 (os mais conhecidos) */
  nivel1?: string[]
}

export function gerarQuem(rng: Rng, nivel: Nivel, autores: Autor[], opcoes: OpcoesQuem = {}): InstanciaMulti<DadosAutor> {
  const pool = nivel === 1 && opcoes.nivel1 ? autores.filter((a) => opcoes.nivel1?.includes(a.id)) : autores
  const alvo = escolher(rng, pool)
  const afirmacao = escolher(rng, faixaDoBanco(alvo.afirmacoes, nivel, 1))
  const outros = distratores(rng, autores, alvo, afirmacao.tambem ?? [])
  const certa: Opc = { texto: alvo.nome, porque: `${alvo.nome}: ${alvo.resumo}` }
  const erradas: Opc[] = outros.map((o) => ({ texto: o.nome, porque: `Esta não é uma ideia de ${o.nome}. ${quemE(o)}`, motivo: `atribuiu a ideia a ${o.nome}` }))
  return montar<DadosAutor>(rng, certa, erradas, {
    enunciado: `Qual autor defende a seguinte ideia? ${NOTA_PARAFRASE} ${afirmacao.texto}`,
    resolucao: `A ideia é de ${alvo.nome} (${alvo.tradicao}). ${alvo.ideia}`,
    dicas: [`Pense na corrente: ${alvo.tradicao}.`, `Um conceito ligado a este autor: ${(alvo.conceitos[0] ?? { termo: '' }).termo}.`, `Uma obra importante: ${(alvo.obras[0] ?? { titulo: 'sem obra escrita' }).titulo}.`],
    licao: `${alvo.nome}: ${alvo.resumo}`,
    dados: dados(alvo),
  })
}

/* ------------------------------------------------------------------ conceitos */

export function gerarConceito(rng: Rng, nivel: Nivel, autores: Autor[]): InstanciaMulti<DadosAutor> {
  const comConceitos = autores.filter((a) => a.conceitos.length >= 2)
  const alvo = escolher(rng, comConceitos)
  const conceito = escolher(rng, alvo.conceitos)
  if (nivel === 1) {
    const outros = distratores(rng, autores, alvo, [])
    return montar<DadosAutor>(
      rng,
      { texto: alvo.nome, porque: `${conceito.termo} é um conceito de ${alvo.nome}: ${conceito.sentido}` },
      outros.map((o) => ({ texto: o.nome, porque: `${o.nome} não é o autor deste conceito. ${quemE(o)}`, motivo: `associou o conceito a ${o.nome}` })),
      {
        enunciado: `Com qual autor o conceito “${conceito.termo}” é associado?`,
        resolucao: `${conceito.termo}: ${conceito.sentido} É um conceito de ${alvo.nome}.`,
        dicas: [`O conceito aparece na corrente: ${alvo.tradicao}.`, 'Pense no assunto da obra mais conhecida do autor.', `Uma obra do autor: ${(alvo.obras[0] ?? { titulo: 'obras reunidas' }).titulo}.`],
        licao: `${conceito.termo} (${alvo.nome}): ${conceito.sentido}`,
        dados: dados(alvo),
      },
    )
  }
  if (nivel === 2) {
    const outros = embaralhar(rng, autores.filter((a) => a.id !== alvo.id).flatMap((a) => a.conceitos.map((c) => ({ c, a })))).slice(0, 3)
    return montar<DadosAutor>(
      rng,
      { texto: conceito.sentido, porque: `Esse é o sentido de ${conceito.termo} em ${alvo.nome}.` },
      outros.map(({ c, a }) => ({ texto: c.sentido, porque: `Esse é o sentido de ${c.termo}, conceito de ${a.nome}.`, motivo: `confundiu com ${c.termo}` })),
      {
        enunciado: `O que significa o conceito “${conceito.termo}”, de ${alvo.nome}?`,
        resolucao: `${conceito.termo}: ${conceito.sentido}`,
        dicas: ['Desconfie das alternativas que parecem descrever outro assunto.', `Lembre a ideia central do autor: ${alvo.resumo}`, 'Elimine as definições que pertencem a outros autores.'],
        licao: `${conceito.termo} (${alvo.nome}): ${conceito.sentido}`,
        dados: dados(alvo),
      },
    )
  }
  // nível 3: a definição é dada e as alternativas são conceitos do mesmo autor (e de outros), para exigir precisão
  const mesmoAutor = alvo.conceitos.filter((c) => c.termo !== conceito.termo)
  const demais = embaralhar(rng, autores.filter((a) => a.id !== alvo.id).flatMap((a) => a.conceitos))
  const alternativas = [...embaralhar(rng, mesmoAutor), ...demais].slice(0, 3)
  const dono = (termo: string) => autores.find((a) => a.conceitos.some((c) => c.termo === termo))?.nome ?? ''
  return montar<DadosAutor>(
    rng,
    { texto: conceito.termo, porque: `${conceito.termo} é exatamente isso: ${conceito.sentido}` },
    alternativas.map((c) => ({ texto: c.termo, porque: `${c.termo} (${dono(c.termo)}) significa: ${c.sentido}`, motivo: `confundiu com ${c.termo}` })),
    {
      enunciado: `Qual conceito corresponde à seguinte descrição? ${conceito.sentido}`,
      resolucao: `O conceito é ${conceito.termo}, de ${alvo.nome}.`,
      dicas: [`É um conceito de ${alvo.nome}.`, `Corrente: ${alvo.tradicao}.`, 'Compare com os outros conceitos do mesmo autor: o que muda?'],
      licao: `${conceito.termo} (${alvo.nome}): ${conceito.sentido}`,
      dados: dados(alvo),
    },
  )
}

/* ------------------------------------------------------------------ obras */

export function gerarObra(rng: Rng, nivel: Nivel, autores: Autor[]): InstanciaMulti<DadosAutor> {
  const comObras = autores.filter((a) => a.obras.length > 0)
  const alvo = escolher(rng, comObras)
  const obra = escolher(rng, alvo.obras)
  const titulo = (o: { titulo: string; ano?: string }) => (o.ano ? `${o.titulo} (${o.ano})` : o.titulo)
  if (nivel === 1) {
    const outros = distratores(rng, comObras, alvo, [])
    return montar<DadosAutor>(
      rng,
      { texto: alvo.nome, porque: `${titulo(obra)} é de ${alvo.nome}.` },
      outros.map((o) => ({ texto: o.nome, porque: `${o.nome} escreveu obras como ${(o.obras[0] ?? { titulo: '' }).titulo}, e não ${obra.titulo}.`, motivo: `atribuiu a obra a ${o.nome}` })),
      {
        enunciado: `Quem é o autor da obra “${obra.titulo}”?`,
        resolucao: `${titulo(obra)} é de ${alvo.nome}.`,
        dicas: ['Associe o título ao tema central do livro.', `Corrente do autor: ${alvo.tradicao}.`, `Período: ${alvo.periodo}.`],
        licao: `${alvo.nome} escreveu, entre outras, ${alvo.obras.map((o) => o.titulo).join('; ')}.`,
        dados: dados(alvo),
      },
    )
  }
  if (nivel === 2) {
    const outras = embaralhar(rng, comObras.filter((a) => a.id !== alvo.id).flatMap((a) => a.obras.map((o) => ({ o, a })))).slice(0, 3)
    return montar<DadosAutor>(
      rng,
      { texto: obra.titulo, porque: `${titulo(obra)} é de ${alvo.nome}.` },
      outras.map(({ o, a }) => ({ texto: o.titulo, porque: `${titulo(o)} é de ${a.nome}.`, motivo: `atribuiu a obra de ${a.nome}` })),
      {
        enunciado: `Qual das obras abaixo é de ${alvo.nome}?`,
        resolucao: `${titulo(obra)} é de ${alvo.nome}. Obras do autor: ${alvo.obras.map((o) => o.titulo).join('; ')}.`,
        dicas: [`Corrente: ${alvo.tradicao}.`, `Ideia central: ${alvo.resumo}`, 'Qual título combina com esse tema?'],
        licao: `${alvo.nome}: ${alvo.obras.map((o) => o.titulo).join('; ')}.`,
        dados: dados(alvo),
      },
    )
  }
  const outros = distratores(rng, comObras, alvo, [])
  return montar<DadosAutor>(
    rng,
    { texto: alvo.resumo, porque: `${obra.titulo} é de ${alvo.nome}, e a ideia central é essa: ${alvo.resumo}` },
    outros.map((o) => ({ texto: o.resumo, porque: `Essa é a ideia de ${o.nome} (${o.obras.map((x) => x.titulo)[0] ?? 'sem obra escrita'}).`, motivo: `ligou a obra à ideia de ${o.nome}` })),
    {
      enunciado: `Qual ideia central se associa à obra “${obra.titulo}”?`,
      resolucao: `${titulo(obra)} é de ${alvo.nome}: ${alvo.resumo}`,
      dicas: [`Quem escreveu a obra? Um autor da corrente: ${alvo.tradicao}.`, `Período: ${alvo.periodo}.`, 'Compare a ideia de cada alternativa com o título.'],
      licao: `${alvo.nome}: ${alvo.resumo}`,
      dados: dados(alvo),
    },
  )
}

/* ------------------------------------------------------------------ ligar autores a conceitos e a correntes */

const QUANTOS: Record<Nivel, number> = { 1: 3, 2: 4, 3: 5 }

/**
 * Ligar cada autor a um conceito dele. No nível 3 sobram dois conceitos de outros autores, que não servem a ninguém.
 * (Os termos de conceito são únicos no tema, então cada ligação tem uma só resposta.)
 */
export function gerarLigarConceito(rng: Rng, nivel: Nivel, autores: Autor[]): InstanciaLigar<DadosAutor> {
  const escolhidos = embaralhar(rng, autores.filter((a) => a.conceitos.length > 0)).slice(0, QUANTOS[nivel])
  const par = escolhidos.map((a) => ({ a, c: escolher(rng, a.conceitos) }))
  const sobra = nivel === 3 ? embaralhar(rng, autores.filter((a) => !escolhidos.some((e) => e.id === a.id)).flatMap((a) => a.conceitos)).slice(0, 2) : []
  const direita = embaralhar(rng, [...par.map(({ c }) => ({ id: c.termo, rotulo: c.termo })), ...sobra.map((c) => ({ id: c.termo, rotulo: c.termo }))])
  return {
    titulo: 'Autor e conceito',
    enunciado: `Ligue cada autor a um conceito dele. ${nivel === 3 ? 'Atenção: há conceitos que não pertencem a nenhum destes autores.' : 'Cada conceito serve a um único autor.'}`,
    esquerda: escolhidos.map((a) => ({ id: a.id, rotulo: a.nome })),
    direita,
    certa: Object.fromEntries(par.map(({ a, c }) => [a.id, c.termo])),
    porque: Object.fromEntries(par.map(({ a, c }) => [a.id, `${c.termo} é um conceito de ${a.nome}: ${c.sentido}`])),
    nivel,
    dicas: ['Pense na ideia central de cada autor e no assunto de suas obras.', `Um deles: ${par[0]?.a.nome} (${par[0]?.a.tradicao}): ${par[0]?.a.resumo}`, 'Elimine os conceitos que já têm dono e veja o que sobrou.'],
  }
}

/** Ligar cada autor à sua corrente (tradição). Cada corrente é de um só autor do tema. */
export function gerarLigarTradicao(rng: Rng, nivel: Nivel, autores: Autor[]): InstanciaLigar<DadosAutor> {
  const escolhidos = embaralhar(rng, autores).slice(0, QUANTOS[nivel])
  const sobra = nivel === 3 ? embaralhar(rng, autores.filter((a) => !escolhidos.some((e) => e.id === a.id))).slice(0, 2) : []
  const direita = embaralhar(rng, [...escolhidos, ...sobra].map((a) => ({ id: a.id, rotulo: a.tradicao })))
  return {
    titulo: 'Autor e corrente',
    enunciado: `Ligue cada autor à corrente a que ele pertence. ${nivel === 3 ? 'Atenção: há correntes que não pertencem a nenhum destes autores.' : 'Cada corrente serve a um único autor.'}`,
    esquerda: escolhidos.map((a) => ({ id: a.id, rotulo: a.nome })),
    direita,
    certa: Object.fromEntries(escolhidos.map((a) => [a.id, a.id])),
    porque: Object.fromEntries(escolhidos.map((a) => [a.id, `${a.nome} pertence à corrente: ${a.tradicao}. ${a.resumo}`])),
    nivel,
    dicas: ['O nome da corrente costuma indicar o método ou o assunto principal do autor.', `Um deles: ${escolhidos[0]?.nome}: ${escolhidos[0]?.resumo}`, 'Compare o resumo de cada autor com o nome da corrente.'],
  }
}
