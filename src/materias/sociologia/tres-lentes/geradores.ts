import { AUTORES_SOCIOLOGIA, CATEGORIAS, EXEMPLOS, SITUACOES, type CategoriaTipo } from '@/conteudo/sociologia/tresLentes'
import { autorPorId } from '@/conteudo/humanas'
import type { InstanciaMulti } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, type Rng } from '@/lib/rng'
import { montar, type Opc } from '@/materias/biologia/comum/auxiliares'
import { gerarConceito, gerarObra, gerarQuem, type DadosAutor } from '../../humanas/comum/geradores'

const CLASSICOS = ['durkheim', 'weber', 'marx']
const nomeDe = (id: string) => autorPorId(AUTORES_SOCIOLOGIA, id)?.nome ?? id

export const gerarQuemSociologia = (rng: Rng, nivel: Nivel) => gerarQuem(rng, nivel, AUTORES_SOCIOLOGIA, { nivel1: CLASSICOS })
export const gerarConceitoSociologia = (rng: Rng, nivel: Nivel) => gerarConceito(rng, nivel, AUTORES_SOCIOLOGIA)
export const gerarObraSociologia = (rng: Rng, nivel: Nivel) => gerarObra(rng, nivel, AUTORES_SOCIOLOGIA)

/* ------------------------------------------------------------------ mesma situação, lentes diferentes */

export interface DadosSituacao extends DadosAutor {
  situacao?: string
}

export function gerarSituacao(rng: Rng, nivel: Nivel): InstanciaMulti<DadosSituacao> {
  const situacao = escolher(rng, nivel === 1 ? SITUACOES.filter((s) => s.leituras.some((l) => CLASSICOS.includes(l.autor))) : SITUACOES)
  const candidatas = nivel === 1 ? situacao.leituras.filter((l) => CLASSICOS.includes(l.autor)) : situacao.leituras
  const leitura = escolher(rng, candidatas)
  const autor = autorPorId(AUTORES_SOCIOLOGIA, leitura.autor)!
  const lentes = (id: string) => situacao.leituras.find((l) => l.autor === id)
  const dados: DadosSituacao = { autorId: autor.id, situacao: situacao.id }
  const quemE = (id: string) => {
    const a = autorPorId(AUTORES_SOCIOLOGIA, id)!
    return `${a.nome} (${a.tradicao}): ${a.resumo}`
  }
  if (nivel === 3) {
    // dado o autor, escolher a leitura que ele faria
    const outras = embaralhar(rng, situacao.leituras.filter((l) => l.autor !== autor.id)).slice(0, 3)
    const certa: Opc = { texto: leitura.texto, porque: `${autor.nome} (${autor.tradicao}): ${autor.resumo}` }
    const erradas: Opc[] = outras.map((o) => ({ texto: o.texto, porque: `Essa é a lente de ${nomeDe(o.autor)}. ${quemE(o.autor)}`, motivo: `escolheu a lente de ${nomeDe(o.autor)}` }))
    return montar<DadosSituacao>(rng, certa, erradas, {
      enunciado: `Situação: ${situacao.descricao} Qual leitura é a mais próxima da lente de ${autor.nome}? (Leitura ilustrativa, e não uma afirmação do próprio autor sobre o caso.)`,
      resolucao: `${autor.nome} (${autor.tradicao}) leria assim: ${leitura.texto}`,
      dicas: [`Pense na ideia central do autor: ${autor.resumo}`, `Conceitos do autor: ${autor.conceitos.map((c) => c.termo).join('; ')}.`, 'Procure a leitura que usa esses conceitos.'],
      licao: `${autor.nome}: ${autor.resumo}`,
      dados,
    })
  }
  const extras = embaralhar(rng, AUTORES_SOCIOLOGIA.filter((a) => !situacao.leituras.some((l) => l.autor === a.id)))
  const comLeitura = embaralhar(rng, situacao.leituras.filter((l) => l.autor !== autor.id))
  const outros = [...comLeitura.map((l) => l.autor), ...extras.map((a) => a.id)].slice(0, 3)
  const certa: Opc = { texto: autor.nome, porque: `${autor.nome} (${autor.tradicao}): ${autor.resumo}` }
  const erradas: Opc[] = outros.map((id) => {
    const l = lentes(id)
    return {
      texto: nomeDe(id),
      porque: l ? `${nomeDe(id)} leria o caso de outro modo: ${l.texto}` : `Essa leitura não usa os conceitos de ${nomeDe(id)}. ${quemE(id)}`,
      motivo: `atribuiu a leitura a ${nomeDe(id)}`,
    }
  })
  return montar<DadosSituacao>(rng, certa, erradas, {
    enunciado: `Situação: ${situacao.descricao} Uma análise do caso afirma: ${leitura.texto} Qual autor, em sua lente, faria essa leitura? (Leitura ilustrativa, e não uma afirmação do próprio autor sobre o caso.)`,
    resolucao: `Essa é a lente de ${autor.nome} (${autor.tradicao}). ${autor.ideia}`,
    dicas: ['Procure o conceito-chave da análise.', `Corrente do autor: ${autor.tradicao}.`, `Conceitos do autor: ${autor.conceitos.map((c) => c.termo).join('; ')}.`],
    licao: `${autor.nome}: ${autor.resumo}`,
    dados,
  })
}

/* ------------------------------------------------------------------ classificar exemplos */

const GRUPOS_POR_NIVEL: Record<Nivel, string[]> = {
  1: ['weber-acao'],
  2: ['weber-dominacao', 'durkheim'],
  3: ['marx', 'marx-classes'],
}

export interface DadosTipos extends DadosAutor {
  grupo?: string
}

export function gerarTipos(rng: Rng, nivel: Nivel): InstanciaMulti<DadosTipos> {
  const grupo = escolher(rng, GRUPOS_POR_NIVEL[nivel])
  const exemplo = escolher(rng, EXEMPLOS.filter((e) => CATEGORIAS.find((c) => c.id === e.categoria)?.grupo === grupo))
  const alvo = CATEGORIAS.find((c) => c.id === exemplo.categoria) as CategoriaTipo
  const irmas = CATEGORIAS.filter((c) => c.grupo === grupo && c.id !== alvo.id)
  const extras = embaralhar(rng, CATEGORIAS.filter((c) => c.grupo !== grupo && !(grupo.startsWith('marx') && c.grupo.startsWith('marx'))))
  const outras = [...irmas, ...extras].slice(0, 3)
  const certa: Opc = { texto: alvo.nome, porque: `Caso de ${alvo.nome.toLowerCase()} (${alvo.definicao}): ${exemplo.razao}` }
  const erradas: Opc[] = outras.map((o) => ({ texto: o.nome, porque: `Não é ${o.nome.toLowerCase()} (${o.definicao}). Neste caso, ${exemplo.razao}`, motivo: `confundiu com ${o.nome.toLowerCase()}` }))
  const autor = grupo === 'durkheim' ? 'durkheim' : grupo.startsWith('weber') ? 'weber' : 'marx'
  return montar<DadosTipos>(rng, certa, erradas, {
    enunciado: `Classifique o caso. ${exemplo.texto}`,
    resolucao: `É um caso de ${alvo.nome.toLowerCase()}: ${alvo.definicao}. Aqui, ${exemplo.razao}`,
    dicas: ['Pergunte: qual é o motivo central da ação ou o que sustenta a situação?', `Compare as definições: ${irmas.map((c) => `${c.nome.toLowerCase()} (${c.definicao})`).join('; ') || alvo.definicao}.`, 'Procure no texto a palavra que lembra a definição.'],
    licao: `${alvo.nome}: ${alvo.definicao}.`,
    dados: { autorId: autor, grupo },
  })
}
