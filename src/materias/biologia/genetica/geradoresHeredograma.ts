import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, type Rng } from '@/lib/rng'
import { fn, limpar, lista, maiuscula, montar, type Opc } from '../comum/auxiliares'
import {
  ESTRUTURAS,
  ESTRUTURA_DUAS_FAMILIAS,
  ESTRUTURA_SIMPLES,
  ESTRUTURA_TRES_GERACOES,
  MODELOS,
  NOME_MODELO,
  analisar,
  comFenotipos,
  modelosCompativeis,
  rotuloGenotipo,
  simular,
  type Heredograma,
  type Modelo,
  type Pessoa,
} from './heredograma'

const por = (ped: Heredograma, id: string) => ped.pessoas.find((p) => p.id === id) as Pessoa
const nomeSexo = (p: Pessoa) => (p.sexo === 'M' ? 'homem' : 'mulher')
const afetadosDe = (ped: Heredograma) => ped.pessoas.filter((p) => p.afetado).map((p) => p.id)

/** Retira de um heredograma todas as pessoas de uma geração (usado para perguntar sobre o "próximo filho"). */
export function semGeracao(ped: Heredograma, geracao: number): Heredograma {
  return { ...ped, pessoas: ped.pessoas.filter((p) => p.geracao !== geracao) }
}

export const estrutura = (nome: string): Heredograma => ESTRUTURAS.find((e) => e.nome === nome) ?? ESTRUTURA_SIMPLES

/** Reconstrói o heredograma de um desafio a partir do nome da estrutura, da geração retirada (se houver) e dos afetados. */
export function reconstruir(nome: string, afetados: string[], semGeracaoNum?: number): Heredograma {
  const base = estrutura(nome)
  return comFenotipos(semGeracaoNum === undefined ? base : semGeracao(base, semGeracaoNum), afetados)
}

/* ------------------------------------------------------------------ regras que explicam por que um modelo não serve */

interface Violacao {
  texto: string
}

const afet = (p?: Pessoa) => !!p?.afetado

/** Procura uma contradição simples entre o heredograma e o modelo, e a descreve citando as pessoas envolvidas. */
export function violacao(ped: Heredograma, modelo: Modelo): Violacao | null {
  const filhos = ped.pessoas.filter((p) => p.pais)
  for (const f of filhos) {
    const pai = por(ped, (f.pais as [string, string])[0])
    const mae = por(ped, (f.pais as [string, string])[1])
    const dominante = modelo === 'AD' || modelo === 'XD'
    if (dominante && f.afetado && !afet(pai) && !afet(mae)) return { texto: `${f.id} é afetado, mas os pais (${pai.id} e ${mae.id}) são normais; numa doença dominante, quem é afetado tem pelo menos um genitor afetado` }
    if (!dominante && afet(pai) && afet(mae) && !f.afetado) return { texto: `${pai.id} e ${mae.id} são afetados e ${f.id} é normal; numa doença recessiva, filhos de dois afetados seriam todos afetados` }
    if (modelo === 'XD' && afet(pai) && f.sexo === 'F' && !f.afetado) return { texto: `${pai.id} é um homem afetado e sua filha ${f.id} é normal; na herança dominante ligada ao X, o pai afetado passa o X com o alelo a todas as filhas` }
    if (modelo === 'XD' && f.sexo === 'M' && f.afetado && !afet(mae)) return { texto: `${f.id} é um homem afetado de mãe normal (${mae.id}); na herança dominante ligada ao X, o X do filho vem da mãe, que teria de ser afetada` }
    if (modelo === 'XR' && f.sexo === 'F' && f.afetado && !afet(pai)) return { texto: `${f.id} é uma mulher afetada e o pai (${pai.id}) é normal; na herança recessiva ligada ao X, a filha afetada recebe Xᵃ do pai, que seria afetado` }
    if (modelo === 'XR' && afet(mae) && f.sexo === 'M' && !f.afetado) return { texto: `${mae.id} é uma mulher afetada (XᵃXᵃ) e seu filho ${f.id} é normal; na herança recessiva ligada ao X, todos os filhos homens de mulher afetada são afetados` }
  }
  return null
}

/** Um fato do heredograma que sustenta o modelo correto. */
export function evidencia(ped: Heredograma, modelo: Modelo): string {
  const filhos = ped.pessoas.filter((p) => p.pais)
  const pais = (f: Pessoa) => (f.pais as [string, string]).map((id) => por(ped, id))
  switch (modelo) {
    case 'AR': {
      const f = filhos.find((x) => x.afetado && pais(x).every((p) => !p.afetado))
      return f ? `${f.id} é afetado e os dois pais são normais, o que só ocorre se ambos forem portadores (Aa)` : 'o traço aparece em indivíduos de pais normais, que são portadores'
    }
    case 'AD': {
      const f = filhos.find((x) => x.afetado && pais(x).some((p) => p.afetado))
      return f ? `${f.id} é afetado e tem um genitor afetado; todo afetado tem pelo menos um genitor afetado` : 'todo afetado tem pelo menos um genitor afetado'
    }
    case 'XR': {
      const f = filhos.find((x) => x.sexo === 'M' && x.afetado && pais(x).every((p) => !p.afetado))
      return f ? `${f.id} é um homem afetado de pais normais (a mãe é portadora) e não há homem afetado com pai afetado` : 'afeta principalmente homens, filhos de mães portadoras, sem passar de pai para filho'
    }
    default: {
      const pai = ped.pessoas.find((p) => p.sexo === 'M' && p.afetado && filhos.some((f) => f.pais?.[0] === p.id && f.sexo === 'F'))
      return pai ? `${pai.id} é um homem afetado e todas as suas filhas são afetadas; o pai passa o X com o alelo a todas as filhas` : 'o pai afetado transmite a doença a todas as filhas, e não aos filhos homens'
    }
  }
}

/* ------------------------------------------------------------------ desafios de múltipla escolha */

export interface DadosHeredograma {
  tipo: 'padrao' | 'obrigatorio' | 'genotipo' | 'paisDeAfetado'
  estrutura: string
  afetados: string[]
  modelo?: Modelo
  /** pessoas sobre as quais a pergunta fala */
  foco?: string[]
}

const NOTA = ['Quadrado: homem; círculo: mulher; símbolo preenchido: afetado.', 'Pais e filhos ligam-se por linhas verticais; o casal fica unido por uma linha horizontal.']
const TEXTO_NOTA = NOTA.join(' ')

const dicasPadrao = ['Procure indivíduos afetados filhos de pais normais, e pais afetados com filhos normais.', 'Veja se a doença passa de pai para filho homem (isso exclui as ligadas ao X).', 'Elimine, um a um, os padrões que contradizem algum casal do heredograma.']

function tentarPadrao(rng: Rng, nivel: Nivel): InstanciaMulti<DadosHeredograma> | null {
  const estruturas = nivel === 2 ? [ESTRUTURA_SIMPLES, ESTRUTURA_TRES_GERACOES, ESTRUTURA_DUAS_FAMILIAS] : ESTRUTURAS.filter((e) => e.pessoas.length >= 8)
  const est = escolher(rng, estruturas)
  const modelo = escolher(rng, nivel === 2 ? (['AR', 'AD', 'XR'] as Modelo[]) : MODELOS)
  const ped = simular(est, modelo, modelo === 'AD' || modelo === 'XD' ? 0.12 : 0.3, rng)
  const nAfet = afetadosDe(ped).length
  if (nAfet < 2 || nAfet > ped.pessoas.length - 2) return null
  const compat = modelosCompativeis(ped)
  if (compat.length !== 1 || compat[0] !== modelo) return null
  const erradas: Opc[] = []
  for (const m of MODELOS.filter((x) => x !== modelo)) {
    const v = violacao(ped, m)
    if (!v) return null
    erradas.push({ texto: maiuscula(NOME_MODELO[m]), porque: `Não pode ser: ${v.texto}.`, motivo: `escolheu herança ${NOME_MODELO[m]}` })
  }
  const certa = { texto: maiuscula(NOME_MODELO[modelo]), porque: `${evidencia(ped, modelo)}.` }
  return montar<DadosHeredograma>(rng, certa, erradas, {
    enunciado: `O heredograma abaixo mostra uma família em que algumas pessoas têm uma doença hereditária (símbolos preenchidos). Supondo que os genes envolvidos sigam as leis de Mendel e que as pessoas que entram na família não tenham o alelo da doença, qual é o padrão de herança mais provável? ${TEXTO_NOTA}`,
    resolucao: `Só um padrão é compatível com todos os casais. ${maiuscula(certa.porque)} ${erradas.map((e) => `${e.texto}: ${e.porque.replace('Não pode ser: ', '')}`).join(' ')}`,
    dicas: dicasPadrao,
    licao: 'Para identificar o padrão: pais normais com filho afetado → recessiva; todo afetado com genitor afetado → dominante; passagem de pai para filho homem não ocorre em herança ligada ao X; mulher afetada de pai normal exclui a recessiva ligada ao X.',
    dados: { tipo: 'padrao', estrutura: est.nome, afetados: afetadosDe(ped), modelo },
  })
}

function tentarObrigatorio(rng: Rng, nivel: Nivel): InstanciaMulti<DadosHeredograma> | null {
  const modelo: Modelo = nivel === 3 && rng() < 0.5 ? 'XR' : 'AR'
  const est = escolher(rng, [ESTRUTURA_TRES_GERACOES, ESTRUTURA_DUAS_FAMILIAS, ...ESTRUTURAS.filter((e) => e.pessoas.length >= 8)])
  const ped = simular(est, modelo, 0.3, rng)
  if (afetadosDe(ped).length < 1) return null
  const analise = analisar(ped, modelo)
  if (analise.total <= 0) return null
  const marg = (id: string) => analise.marginais.get(id) as number[]
  // heterozigoto/portador sem a doença: AR → Aa normal; XR → mulher XAXa normal
  const portador = (p: Pessoa) => !p.afetado && (modelo === 'AR' || p.sexo === 'F') && (marg(p.id)[1] as number) > 0.9999
  const certos = ped.pessoas.filter(portador)
  const nao = ped.pessoas.filter((p) => !p.afetado && (modelo === 'AR' || p.sexo === 'F') && (marg(p.id)[1] as number) < 0.9)
  if (certos.length < 1 || nao.length < 3) return null
  const certa = escolher(rng, certos)
  const erradas: Opc[] = embaralhar(rng, nao)
    .slice(0, 3)
    .map((p) => {
      const pr = marg(p.id)[1] as number
      const texto = pr < 0.01 ? `${p.id} é uma pessoa sem relação conhecida com a doença; nada indica que seja portadora, então se supõe ${modelo === 'AR' ? 'AA' : 'XᴬXᴬ'}.` : `${p.id} pode ser ${modelo === 'AR' ? 'AA ou Aa' : 'XᴬXᴬ ou XᴬXᵃ'}: a probabilidade de ser portador é de cerca de ${fn(pr * 100, 0)} %, e não 100 %.`
      return { texto: p.id, porque: texto, motivo: 'não é obrigatoriamente heterozigoto' }
    })
  const pais = certa.pais ? certa.pais.map((id) => por(ped, id)) : []
  const filhos = ped.pessoas.filter((f) => f.pais?.includes(certa.id))
  const motivo =
    filhos.some((f) => f.afetado)
      ? `${certa.id} é ${modelo === 'XR' ? 'mulher normal' : 'normal'} e tem ${filhos.length > 1 ? 'um filho' : 'um filho'} afetado (${filhos.filter((f) => f.afetado).map((f) => f.id).join(', ')}), então só pode ser ${modelo === 'AR' ? 'Aa' : 'XᴬXᵃ'}`
      : pais.some((p) => p.afetado)
        ? `${certa.id} é normal e filho${certa.sexo === 'F' ? 'a' : ''} de ${pais.filter((p) => p.afetado).map((p) => p.id).join(' e ')}, que ${pais.filter((p) => p.afetado).length > 1 ? 'são afetados' : 'é afetado'}: recebeu o alelo da doença de um genitor e o normal do outro`
        : `${certa.id} só pode ser ${modelo === 'AR' ? 'Aa' : 'XᴬXᵃ'} para explicar os afetados da família`
  return montar<DadosHeredograma>(rng, { texto: certa.id, porque: `${motivo.charAt(0).toUpperCase()}${motivo.slice(1)}.` }, erradas, {
    enunciado: `O heredograma mostra uma família com uma doença ${NOME_MODELO[modelo]} (símbolos preenchidos). Qual indivíduo normal é obrigatoriamente ${modelo === 'AR' ? 'heterozigoto (Aa)' : 'portador (mulher XᴬXᵃ)'}? ${TEXTO_NOTA}`,
    resolucao: `${motivo.charAt(0).toUpperCase()}${motivo.slice(1)}.`,
    dicas: ['Quem é obrigatoriamente portador: pais normais de afetados e filhos normais de afetados.', 'Quem só tem relação distante com os afetados pode ser homozigoto normal.', modelo === 'XR' ? 'Em herança ligada ao X, mulher normal com filho afetado é portadora.' : 'Um afetado recessivo (aa) recebe um alelo a de cada genitor.'],
    licao: modelo === 'AR' ? 'Em herança recessiva autossômica, são portadores (Aa) obrigatórios: pais normais de um afetado e filhos normais de um afetado.' : 'Em herança recessiva ligada ao X, mulher normal com filho afetado é portadora, e toda filha de homem afetado é portadora ou afetada.',
    dados: { tipo: 'obrigatorio', estrutura: est.nome, afetados: afetadosDe(ped), modelo, foco: [certa.id] },
  })
}

function tentarGenotipo(rng: Rng): InstanciaMulti<DadosHeredograma> | null {
  const modelo: Modelo = rng() < 0.65 ? 'AR' : 'AD'
  const est = escolher(rng, [ESTRUTURA_SIMPLES, ESTRUTURA_TRES_GERACOES])
  const ped = simular(est, modelo, modelo === 'AD' ? 0.12 : 0.3, rng)
  const analise = analisar(ped, modelo)
  if (analise.total <= 0) return null
  const marg = (id: string) => analise.marginais.get(id) as number[]
  const nomeG = (g: number) => rotuloGenotipo(modelo, 'M', g)
  const todas = ['AA', 'Aa', 'aa']
  // pessoa cujo genótipo é determinado pelos fenótipos
  const certeza = (id: string) => [0, 1, 2].find((g) => (marg(id)[g] as number) > 0.9999)
  const candidatos = ped.pessoas.filter((p) => certeza(p.id) !== undefined && p.pais)
  if (candidatos.length < 1) return null
  const alvo = escolher(rng, candidatos)
  const g = certeza(alvo.id) as number
  const certa = nomeG(g)
  const explica =
    modelo === 'AR'
      ? alvo.afetado
        ? `${alvo.id} é afetado por uma doença recessiva, então é ${certa}`
        : `${alvo.id} é normal, mas ${lista(ped.pessoas.filter((f) => f.pais?.includes(alvo.id) && f.afetado).map((f) => f.id)) || 'um genitor'} é afetado (aa), então ${alvo.id} é obrigatoriamente ${certa}`
      : alvo.afetado
        ? `${alvo.id} é afetado e um dos genitores é normal (aa): recebeu o alelo A de um genitor e o a do outro, então é ${certa}`
        : `${alvo.id} é normal, e numa doença dominante isso só ocorre com o genótipo ${certa}`
  const erradas: Opc[] = todas
    .filter((x) => x !== certa)
    .map((x) => {
      const gi = [0, 1, 2].find((k) => nomeG(k) === x) as number
      const afet = modelo === 'AR' ? gi === 2 : gi >= 1
      return {
        texto: x,
        porque: afet !== alvo.afetado ? `${x} ${afet ? 'manifestaria' : 'não manifestaria'} a doença (${modelo === 'AR' ? 'recessiva' : 'dominante'}), mas ${alvo.id} ${alvo.afetado ? 'é afetado' : 'é normal'}.` : `${x} não é possível: ${explica}.`,
        motivo: `genótipo ${x} não é possível`,
      } as Opc
    })
  erradas.push({ texto: 'Não é possível determinar', porque: `É possível sim: ${explica}.`, motivo: 'achou que faltavam dados' })
  return montar<DadosHeredograma>(rng, { texto: certa, porque: `${explica}.` }, erradas, {
    enunciado: `O heredograma mostra uma doença ${NOME_MODELO[modelo]} (símbolos preenchidos). Qual é o genótipo de ${alvo.id}, ${nomeSexo(alvo)} ${alvo.afetado ? 'afetado' : 'normal'}? ${TEXTO_NOTA}`,
    resolucao: `${explica}.`,
    dicas: ['Qual alelo é dominante?', 'Pessoas normais em doença recessiva podem ser AA ou Aa; afetadas são aa.', 'Use os pais e os filhos para saber de onde veio cada alelo.'],
    licao: modelo === 'AR' ? 'Doença recessiva: afetado = aa. Pais normais de afetado e filhos normais de afetado são Aa.' : 'Doença dominante: normal = aa. Afetado com um genitor normal é Aa.',
    dados: { tipo: 'genotipo', estrutura: est.nome, afetados: afetadosDe(ped), modelo, foco: [alvo.id] },
  })
}

function tentarPaisDeAfetado(rng: Rng): InstanciaMulti<DadosHeredograma> | null {
  const afetado = escolher(rng, ['II-1', 'II-2', 'II-3'])
  const ped = comFenotipos(ESTRUTURA_SIMPLES, [afetado])
  const certa = 'Aa e Aa'
  const erradas: Opc[] = [
    { texto: 'AA e Aa', porque: 'Um genitor AA só passa o alelo A, e o filho não seria aa.', motivo: 'um dos pais é homozigoto dominante' },
    { texto: 'AA e AA', porque: 'Pais AA só têm filhos AA.', motivo: 'os dois pais são homozigotos dominantes' },
    { texto: 'aa e Aa', porque: 'Um genitor aa seria afetado, e os pais do heredograma são normais.', motivo: 'um dos pais seria afetado' },
  ]
  return montar<DadosHeredograma>(rng, { texto: certa, porque: 'O filho afetado é aa: recebeu um alelo a de cada genitor. Como os pais são normais, os dois são Aa (portadores).' }, erradas, {
    enunciado: `Em uma família, o casal I-1 e I-2, ambos de fenótipo normal, tem três filhos, e ${afetado} tem uma doença autossômica recessiva (símbolo preenchido). Quais são os genótipos de I-1 e I-2? ${TEXTO_NOTA}`,
    resolucao: 'Afetado = aa. Cada genitor passou um alelo a, mas nenhum deles é afetado: logo, ambos são heterozigotos, Aa.',
    dicas: ['Qual o genótipo de quem tem a doença recessiva?', 'De quem veio cada alelo a?', 'Os pais são normais, então não são aa.'],
    licao: 'Pais normais com filho afetado por doença recessiva autossômica são heterozigotos (Aa × Aa), com 25 % de risco de novo filho afetado.',
    dados: { tipo: 'paisDeAfetado', estrutura: ESTRUTURA_SIMPLES.nome, afetados: afetadosDe(ped), modelo: 'AR', foco: ['I-1', 'I-2'] },
  })
}

export function gerarHeredograma(rng: Rng, nivel: Nivel): InstanciaMulti<DadosHeredograma> {
  // o tipo de pergunta é escolhido primeiro; só depois se procura um heredograma que o sustente
  const tentativas: (() => InstanciaMulti<DadosHeredograma> | null)[] =
    nivel === 1
      ? embaralhar(rng, [() => tentarPaisDeAfetado(rng), () => tentarGenotipo(rng)])
      : embaralhar(rng, [() => tentarPadrao(rng, nivel), () => tentarObrigatorio(rng, nivel)])
  for (const tenta of tentativas)
    for (let i = 0; i < 400; i++) {
      const r = tenta()
      if (r) return r
    }
  return tentarPaisDeAfetado(rng) as InstanciaMulti<DadosHeredograma>
}

/* ------------------------------------------------------------------ probabilidades em famílias */

export interface DadosProbabilidade {
  familia: 'arCasal' | 'adAfetado' | 'arIrmao' | 'xrIrma' | 'arDuasFamilias' | 'xrIrmaFilho'
  estrutura: string
  afetados: string[]
  /** geração retirada do desenho (o filho de que se fala ainda não nasceu) */
  semGeracao?: number
  /** pessoas em foco no desenho (casal ou indivíduo) */
  foco: string[]
  modelo: Modelo
  /** o que se pede (quando a família admite mais de uma pergunta) */
  pedido?: string
  /** consulta feita ao motor: "marginal" (genótipo de uma pessoa) ou "filho" (próximo filho do casal) */
  consulta: { tipo: 'marginal'; pessoa: string; genotipo: number } | { tipo: 'filho'; pai: string; mae: string; sexo?: 'M' | 'F' }
}

export function gerarProbabilidade(rng: Rng, nivel: Nivel): InstanciaNum<DadosProbabilidade> {
  const tol = 0.1
  const dicasPadrao = ['Descubra o genótipo dos pais (ou a probabilidade de cada genótipo).', 'Calcule a chance de cada gameta e de cada combinação.', 'Multiplique as probabilidades dos eventos independentes.']

  if (nivel === 1) {
    if (rng() < 0.6) {
      const afetado = escolher(rng, ['II-1', 'II-2', 'II-3'])
      const pedido = escolher(rng, ['afetado', 'portador'] as const)
      const resposta = pedido === 'afetado' ? 25 : 50
      return {
        enunciado: `Em uma família, o casal I-1 e I-2, ambos normais, tem um filho (${afetado}) com uma doença autossômica recessiva. Qual a probabilidade de o próximo filho do casal ${pedido === 'afetado' ? 'ter a doença' : 'ser normal, mas portador do alelo da doença (heterozigoto)'}?`,
        resposta,
        tolerancia: tol,
        unidade: '%',
        erros: limpar(
          pedido === 'afetado'
            ? [
                { valor: 50, frase: '50 % seria a chance se um dos pais fosse aa e o outro Aa. Aqui os dois são Aa × Aa: 1/4 de aa.', motivo: 'supôs um genitor afetado' },
                { valor: 75, frase: '75 % é a probabilidade de a criança ser NORMAL (AA ou Aa).', motivo: 'deu a probabilidade de ser normal' },
                { valor: 100, frase: 'Ter um filho afetado não significa que todos os próximos serão: cada filho tem 1/4 de chance de ser aa.', motivo: 'achou que todos os filhos seriam afetados' },
                { valor: 12.5, frase: '1/4 é a probabilidade do filho ser aa. Você parece ter dividido o valor por 2 (considerando o sexo), mas o sexo não influencia essa doença autossômica.', motivo: 'dividiu por 2 por causa do sexo' },
              ]
            : [
                { valor: 25, frase: '25 % é a probabilidade de ser afetado (aa) ou homozigoto normal (AA), cada um. Os heterozigotos são 1/2.', motivo: 'deu a probabilidade de um homozigoto' },
                { valor: 75, frase: '75 % é a probabilidade de ser normal (AA ou Aa); a pergunta é só dos portadores (Aa).', motivo: 'deu a probabilidade de ser normal' },
                { valor: 100 / 3, frase: '33,3 % é a probabilidade de ser AA entre os de fenótipo normal. Aqui o universo é toda a prole do casal, em que os Aa são 1/2.', motivo: 'trocou portador por homozigoto normal' },
                { valor: 200 / 3, frase: '66,7 % é a probabilidade de ser portador sabendo que a criança já é normal (2/3). Aqui o universo é toda a prole do casal: Aa = 1/2.', motivo: 'usou só os normais como universo' },
              ],
          resposta,
          tol,
        ),
        resolucao: `O filho afetado é aa, então os pais, normais, são Aa × Aa → ${fn(25)} % AA, ${fn(50)} % Aa e ${fn(25)} % aa. ${pedido === 'afetado' ? 'Afetado = aa: 25 %.' : 'Portador normal = Aa: 50 %.'}`,
        dicas: dicasPadrao,
        licao: 'Pais normais de um afetado recessivo são Aa × Aa: 25 % aa (afetado), 50 % Aa (portador), 25 % AA.',
        dados: {
          familia: 'arCasal',
          estrutura: ESTRUTURA_SIMPLES.nome,
          afetados: [afetado],
          foco: ['I-1', 'I-2'],
          modelo: 'AR',
          pedido,
          consulta: { tipo: 'filho', pai: 'I-1', mae: 'I-2' },
        },
      }
    }
    return {
      enunciado: 'Uma doença autossômica dominante é causada pelo alelo A. Um homem afetado (I-1) casa com uma mulher normal (I-2); eles têm três filhos: a filha II-2, afetada, e os filhos II-1 e II-3, normais. Qual a probabilidade de o próximo filho do casal ser afetado?',
      resposta: 50,
      tolerancia: tol,
      unidade: '%',
      erros: limpar(
        [
          { valor: 25, frase: '25 % seria a chance se os dois pais fossem Aa. Aqui só o pai é afetado (Aa), e a mãe, normal, é aa: Aa × aa → 1/2 Aa.', motivo: 'supôs dois pais heterozigotos' },
          { valor: 75, frase: '75 % seria a probabilidade de fenótipo dominante em Aa × Aa. O casal é Aa × aa.', motivo: 'aplicou 3 : 1' },
          { valor: 100, frase: '100 % ocorreria se o pai fosse AA. Como já nasceu um filho normal (aa), o pai é Aa.', motivo: 'achou que o pai seria AA' },
        ],
        50,
        tol,
      ),
      resolucao: 'A mãe, normal numa doença dominante, é aa. O pai afetado teve um filho normal (aa), então é Aa. Aa × aa → 1/2 Aa (afetado) e 1/2 aa (normal): 50 %.',
      dicas: ['Qual o genótipo de quem é normal numa doença dominante?', 'O filho normal mostra que o pai é heterozigoto.', 'Faça o cruzamento Aa × aa.'],
      licao: 'Aa × aa dá 50 % de afetados. Um afetado dominante que tem filho normal é heterozigoto.',
      dados: {
        familia: 'adAfetado',
        estrutura: ESTRUTURA_SIMPLES.nome,
        afetados: ['I-1', 'II-2'],
        foco: ['I-1', 'I-2'],
        modelo: 'AD',
        consulta: { tipo: 'filho', pai: 'I-1', mae: 'I-2' },
      },
    }
  }

  if (nivel === 2) {
    const v = escolher(rng, ['arIrmao', 'xrIrma'] as const)
    if (v === 'arIrmao') {
      const afetado = escolher(rng, ['II-1', 'II-2', 'II-3'])
      const normais = ['II-1', 'II-2', 'II-3'].filter((x) => x !== afetado)
      const alvo = escolher(rng, normais)
      return {
        enunciado: `Em uma família, o casal I-1 e I-2, normais, tem três filhos; ${afetado} tem uma doença autossômica recessiva e os outros dois são normais. Qual a probabilidade de ${alvo}, que é normal, ser portador do alelo da doença (heterozigoto)?`,
        resposta: 200 / 3,
        tolerancia: tol,
        unidade: '%',
        erros: limpar(
          [
            { valor: 50, frase: '50 % é a porcentagem de heterozigotos entre todos os filhos de Aa × Aa. Como ' + alvo + ' é normal, aa está excluído, e o universo passa a ser AA, Aa e Aa: 2 em 3.', motivo: 'ignorou que o filho é normal' },
            { valor: 75, frase: '75 % é a probabilidade de ser normal (AA ou Aa); a pergunta é a probabilidade de ser Aa dado que é normal.', motivo: 'deu a probabilidade de ser normal' },
            { valor: 100 / 3, frase: '33,3 % é a probabilidade de ser AA entre os normais. Os heterozigotos são 2 em 3.', motivo: 'trocou portador por homozigoto normal' },
            { valor: 25, frase: '25 % é a porcentagem de cada homozigoto no cruzamento Aa × Aa, sem considerar a informação de que o filho é normal.', motivo: 'ignorou que o filho é normal' },
          ],
          200 / 3,
          tol,
        ),
        resolucao: 'Como há um filho afetado (aa), os pais são Aa × Aa → 1 AA : 2 Aa : 1 aa. Sabendo que a pessoa é normal, descarta-se aa: restam 3 casos (AA, Aa, Aa). Probabilidade de ser Aa: 2/3 ≈ 66,7 %.',
        dicas: ['Qual o genótipo dos pais?', 'A informação de que a pessoa é normal elimina um dos 4 casos.', 'Conte os heterozigotos entre os que sobram.'],
        licao: 'Normal filho de Aa × Aa tem 2/3 de chance de ser portador (probabilidade condicional).',
        dados: {
          familia: 'arIrmao',
          estrutura: ESTRUTURA_SIMPLES.nome,
          afetados: [afetado],
          foco: [alvo],
          modelo: 'AR',
          consulta: { tipo: 'marginal', pessoa: alvo, genotipo: 1 },
        },
      }
    }
    const resposta = 50
    return {
      enunciado: 'A hemofilia é uma doença recessiva ligada ao cromossomo X. Em uma família, o casal I-1 e I-2 é normal e tem três filhos: o menino II-1, afetado, a menina II-2, normal, e o menino II-3, normal. Qual a probabilidade de a filha II-2 ser portadora do alelo da hemofilia?',
      resposta,
      tolerancia: tol,
      unidade: '%',
      erros: limpar(
        [
          { valor: 200 / 3, frase: '66,7 % seria a resposta para uma doença autossômica recessiva. Em herança ligada ao X, a filha recebe o X normal do pai com certeza; o que varia é o X da mãe (portadora): 1/2.', motivo: 'tratou como doença autossômica' },
          { valor: 25, frase: '25 % é a probabilidade de uma criança qualquer ser afetada. Para uma filha ser portadora, basta receber o Xᵃ da mãe (1/2).', motivo: 'confundiu portadora com afetada' },
          { valor: 100, frase: 'A filha só é portadora se receber o Xᵃ da mãe, o que ocorre em metade dos casos.', motivo: 'achou que toda filha seria portadora' },
          { valor: 75, frase: '75 % não corresponde a nenhuma classe: a mãe é XᴬXᵃ e o pai XᴬY; a filha recebe Xᴬ do pai e Xᴬ ou Xᵃ da mãe (1/2 cada).', motivo: 'aplicou 3 : 1' },
        ],
        resposta,
        tol,
      ),
      resolucao: 'O filho afetado (XᵃY) recebeu o Xᵃ da mãe, que é portadora (XᴬXᵃ). O pai, normal, é XᴬY. A filha recebe Xᴬ do pai e, da mãe, Xᴬ ou Xᵃ com 1/2 cada: 50 % de ser portadora.',
      dicas: ['Quem passou o Xᵃ ao filho afetado?', 'Qual o genótipo do pai normal?', 'A filha sempre recebe o X do pai.'],
      licao: 'Mãe portadora × pai normal: 1/2 das filhas são portadoras (XᴬXᵃ) e 1/2 normais (XᴬXᴬ).',
      dados: {
        familia: 'xrIrma',
        estrutura: ESTRUTURA_SIMPLES.nome,
        afetados: ['II-1'],
        foco: ['II-2'],
        modelo: 'XR',
        consulta: { tipo: 'marginal', pessoa: 'II-2', genotipo: 1 },
      },
    }
  }

  // nível 3
  const v = escolher(rng, ['arDuasFamilias', 'xrIrmaFilho'] as const)
  if (v === 'arDuasFamilias') {
    return {
      enunciado: 'Em duas famílias, os casais I-1 × I-2 e I-3 × I-4 são normais e cada um tem um filho afetado (II-1 e II-4) por uma doença autossômica recessiva e um filho normal (II-2 e II-3). Os filhos normais II-2 e II-3 se casam. Qual a probabilidade de o primeiro filho do casal II-3 × II-2 ter a doença?',
      resposta: 100 / 9,
      tolerancia: tol,
      unidade: '%',
      erros: limpar(
        [
          { valor: 25, frase: '25 % supõe que II-2 e II-3 são certamente Aa. Cada um só tem 2/3 de chance de ser portador (é normal, filho de Aa × Aa).', motivo: 'supôs que os dois são portadores certos' },
          { valor: 100 / 6, frase: '16,7 % (2/3 × 1/4) considera só um dos dois como possível portador. Os dois precisam ser portadores: 2/3 × 2/3 × 1/4.', motivo: 'considerou só um portador' },
          { valor: 400 / 9, frase: '44,4 % é (2/3)², a probabilidade de os dois serem portadores. Falta multiplicar por 1/4, a chance de o filho de Aa × Aa ser aa.', motivo: 'esqueceu de multiplicar por 1/4' },
          { valor: 50, frase: '50 % corresponderia a um casal Aa × aa; aqui os dois são normais.', motivo: 'supôs um genitor afetado' },
        ],
        100 / 9,
        tol,
      ),
      resolucao: 'Pais de afetado são Aa × Aa. Cada filho normal (II-2, II-3) é Aa com probabilidade 2/3. O filho do casal é aa só se os dois forem Aa (2/3 × 2/3) e ambos passarem a (1/2 × 1/2): 2/3 × 2/3 × 1/4 = 1/9 ≈ 11,1 %.',
      dicas: ['Cada casal de pais é Aa × Aa.', 'Cada filho normal tem 2/3 de chance de ser portador.', 'Para um filho aa: os dois são Aa E ambos passam o alelo a.'],
      licao: 'Probabilidade composta: P(portador) × P(portador) × P(filho aa) = 2/3 × 2/3 × 1/4 = 1/9.',
      dados: {
        familia: 'arDuasFamilias',
        estrutura: ESTRUTURA_DUAS_FAMILIAS.nome,
        afetados: ['II-1', 'II-4'],
        semGeracao: 2,
        foco: ['II-3', 'II-2'],
        modelo: 'AR',
        consulta: { tipo: 'filho', pai: 'II-3', mae: 'II-2' },
      },
    }
  }
  const pedido = escolher(rng, ['qualquer', 'menino'] as const)
  const resposta = pedido === 'qualquer' ? 12.5 : 25
  return {
    enunciado: `A distrofia muscular de Duchenne é uma doença recessiva ligada ao X. Em uma família, o casal I-1 e I-2, normal, tem três filhos: o menino II-2, afetado, e as meninas II-1 e II-3, normais. A filha II-3 se casa com um homem normal (II-4), sem histórico da doença na família dele. ${pedido === 'qualquer' ? 'Qual a probabilidade de o primeiro filho do casal (de qualquer sexo) ser afetado?' : 'Se o primeiro filho do casal for menino, qual a probabilidade de ele ser afetado?'}`,
    resposta,
    tolerancia: tol,
    unidade: '%',
    erros: limpar(
      pedido === 'qualquer'
        ? [
            { valor: 25, frase: '25 % é a probabilidade para uma mulher portadora CERTA (1/4 das crianças). II-3 só tem 1/2 de chance de ser portadora; falta multiplicar por 1/2.', motivo: 'supôs que a mulher é portadora certa' },
            { valor: 50, frase: '50 % é a probabilidade de um menino de mãe portadora ser afetado. Falta considerar o sexo (1/2) e que II-3 só tem 1/2 de chance de ser portadora.', motivo: 'ignorou o sexo e a incerteza sobre a mãe' },
            { valor: 6.25, frase: '6,25 % considera um fator 1/2 a mais. O sexo já está incluído em 1/4 (menino afetado = 1/4 das crianças de uma mãe portadora).', motivo: 'contou o sexo duas vezes' },
            { valor: 100 / 3, frase: 'Em herança ligada ao X, o filho afetado da mulher II-3 depende de ela ser portadora (1/2), de a criança ser menino (1/2) e de receber Xᵃ (1/2).', motivo: 'aplicou a lógica de doença autossômica' },
          ]
        : [
            { valor: 12.5, frase: '12,5 % é a probabilidade para uma criança qualquer. Como já se sabe que é menino, o sexo não entra: 1/2 (portadora) × 1/2 (Xᵃ).', motivo: 'incluiu o sexo duas vezes' },
            { valor: 50, frase: '50 % vale se a mãe for portadora certa. II-3 só tem 1/2 de chance de ser portadora.', motivo: 'supôs que a mulher é portadora certa' },
            { valor: 100 / 6, frase: '16,7 % mistura frações de herança autossômica. Aqui: 1/2 (mãe portadora) × 1/2 (menino recebe Xᵃ).', motivo: 'aplicou a lógica de doença autossômica' },
            { valor: 6.25, frase: '6,25 % tem um fator 1/2 a mais. O sexo já é dado (menino).', motivo: 'contou um fator a mais' },
          ],
      resposta,
      tol,
    ),
    resolucao: `II-3 é filha de uma mulher portadora (XᴬXᵃ) e de um homem normal: recebe Xᴬ do pai e Xᴬ ou Xᵃ da mãe, então é portadora com probabilidade 1/2. O marido, de fora e normal, é XᴬY. ${pedido === 'qualquer' ? 'Criança afetada: 1/2 (II-3 portadora) × 1/4 (criança XᵃY de mãe portadora) = 1/8 = 12,5 %.' : 'Menino afetado: 1/2 (II-3 portadora) × 1/2 (menino recebe Xᵃ) = 1/4 = 25 %.'}`,
    dicas: ['Qual a chance de II-3 ser portadora?', 'O marido é XᴬY.', pedido === 'qualquer' ? 'Numa mãe portadora, 1/4 das crianças (meninos com Xᵃ) são afetadas.' : 'O sexo é dado: só falta o Xᵃ da mãe.'],
    licao: 'Probabilidade composta em herança ligada ao X: P(mãe portadora) × P(criança afetada | mãe portadora). Para mãe portadora × pai normal: 1/4 de qualquer criança, 1/2 de um menino.',
    dados: {
      familia: 'xrIrmaFilho',
      estrutura: ESTRUTURA_TRES_GERACOES.nome,
      afetados: ['II-2'],
      semGeracao: 2,
      foco: ['II-4', 'II-3'],
      modelo: 'XR',
      pedido,
      consulta: pedido === 'qualquer' ? { tipo: 'filho', pai: 'II-4', mae: 'II-3' } : { tipo: 'filho', pai: 'II-4', mae: 'II-3', sexo: 'M' },
    },
  }
}
