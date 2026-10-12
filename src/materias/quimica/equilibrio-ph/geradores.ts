import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { formulaTexto } from '../comum/Formula'
import type { BequerEtapa } from '../solucoes/geradores'
import { deslocamento, especies, kc, reacaoEq, type Perturbacao, type ReacaoEq, type Sentido } from './calculo'

const fn = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const bonito = (x: number, casas = 1) => Math.abs(x * 10 ** casas - Math.round(x * 10 ** casas)) < 1e-9
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const sup = (n: number) => `${n < 0 ? '⁻' : ''}${String(Math.abs(n)).split('').map((d) => SUP[Number(d)]).join('')}`

/** número em notação científica legível: 2 × 10⁻⁴ */
export function sci(x: number): string {
  if (x === 0) return '0'
  const e = Math.floor(Math.log10(x) + 1e-12)
  const m = Math.round((x / 10 ** e) * 100) / 100
  if (m === 1) return `10${sup(e)}`
  return `${fn(m)} × 10${sup(e)}`
}

const LOGS = '(Dados: log 2 = 0,30; log 3 = 0,48; log 5 = 0,70.)'
const MANTISSAS: Record<number, number> = { 1: 0, 2: 0.3, 3: 0.48, 4: 0.6, 5: 0.7, 6: 0.78, 8: 0.9 }

function limpar(erros: ErroTipico[], resposta: number, tol: number): ErroTipico[] {
  const saida: ErroTipico[] = []
  for (const e of erros) {
    if (!Number.isFinite(e.valor)) continue
    if (Math.abs(e.valor - resposta) <= 2 * tol) continue
    if (saida.some((x) => Math.abs(x.valor - e.valor) <= tol)) continue
    saida.push(e)
  }
  return saida
}

/* ================================================================== qual é o pH? */

export interface DadosPh {
  variante: 'forte' | 'log' | 'diluicao' | 'neutralizacao'
  etapas?: BequerEtapa[]
  ligacoes?: string[]
  /** classificação do resultado, para conferência nos testes */
  base?: boolean
  /** expoente e fator do enunciado (a × 10⁻ᵏ), quando houver */
  k?: number
  a?: number
  /** número de íons liberados por fórmula (diácido, dibase) */
  fator?: number
}

export function gerarPh(rng: Rng, nivel: Nivel): InstanciaNum<DadosPh> {
  let enunciado: string
  let resposta: number
  let erros: ErroTipico[]
  let resolucao: string
  let dicas: string[]
  let licao: string
  let dados: DadosPh
  const tol = 0.03

  if (nivel === 1) {
    const k = sortear(rng, 1, 6)
    const base = rng() < 0.4
    const tipo = rng() < 0.5
    if (tipo) {
      // dado a concentração de um ácido ou base forte monoprótico
      const nome = base ? escolher(rng, ['NaOH', 'KOH']) : escolher(rng, ['HCl', 'HNO₃'])
      enunciado = `Qual é o pH, a 25 °C, de uma solução aquosa de ${nome} (${base ? 'base' : 'ácido'} forte, ionização total) com concentração 1 × 10${sup(-k)} mol/L?`
      resposta = base ? 14 - k : k
      resolucao = base ? `Base forte: [OH⁻] = 10${sup(-k)} mol/L, então pOH = ${k}. Como pH + pOH = 14, pH = 14 − ${k} = ${14 - k}.` : `Ácido forte: [H⁺] = 10${sup(-k)} mol/L, então pH = −log 10${sup(-k)} = ${k}.`
    } else {
      enunciado = base ? `Uma solução tem [OH⁻] = 1 × 10${sup(-k)} mol/L a 25 °C. Qual é o pH?` : `Uma solução tem [H⁺] = 1 × 10${sup(-k)} mol/L. Qual é o pH?`
      resposta = base ? 14 - k : k
      resolucao = base ? `pOH = −log [OH⁻] = ${k}; pH = 14 − pOH = ${14 - k}.` : `pH = −log [H⁺] = −log 10${sup(-k)} = ${k}.`
    }
    erros = base
      ? [
          { valor: k, frase: `${k} é o pOH. Para chegar ao pH, use pH + pOH = 14.`, motivo: 'deu o pOH no lugar do pH' },
          { valor: -(14 - k), frase: 'O pH não é negativo aqui: o sinal de menos do −log já foi usado ao tirar o logaritmo.', motivo: 'errou o sinal do logaritmo' },
          { valor: 14 + k, frase: 'Você somou o expoente ao 14. Subtraia: pH = 14 − pOH.', motivo: 'somou em vez de subtrair' },
        ]
      : [
          { valor: 14 - k, frase: `${14 - k} seria o pH de uma base com essa concentração. Aqui é um ácido: pH = −log [H⁺] = ${k}.`, motivo: 'confundiu pH com pOH' },
          { valor: -k, frase: 'O pH é −log [H⁺]: o sinal de menos faz o resultado ficar positivo.', motivo: 'errou o sinal do logaritmo' },
          { valor: 10 ** -k, frase: 'Esse número é a própria concentração. O pH é o logaritmo negativo dela.', motivo: 'deu a concentração em vez do pH' },
        ]
    licao = 'pH = −log [H⁺] e pOH = −log [OH⁻]; a 25 °C, pH + pOH = 14. Ácido forte: [H⁺] = concentração; base forte: [OH⁻] = concentração.'
    dicas = ['pH = −log [H⁺]: o expoente com sinal trocado.', base ? 'Para base, calcule primeiro o pOH e depois use pH + pOH = 14.' : 'Para ácido forte, [H⁺] é igual à concentração do ácido.', 'Confira: ácidos têm pH menor que 7; bases, maior.']
    dados = { variante: 'forte', base, k }
  } else if (nivel === 2) {
    const k = sortear(rng, 2, 6)
    const a = escolher(rng, [2, 3, 4, 5, 6, 8])
    const base = rng() < 0.4
    // diácido ou dibase fortes: cada fórmula libera 2 íons
    const fator = rng() < 0.3 ? 2 : 1
    const nomeEspecie = fator === 2 ? (base ? 'Ca(OH)₂' : 'H₂SO₄') : ''
    const conc = (a * 10 ** -k) / fator
    const x = a * 10 ** -k
    const logaritmo = MANTISSAS[a] as number
    const pX = k - logaritmo
    resposta = base ? 14 - pX : pX
    const quem = base ? '[OH⁻]' : '[H⁺]'
    if (fator === 2) {
      enunciado = `Uma solução aquosa de ${nomeEspecie} ${base ? '(base forte, duas hidroxilas)' : '(ácido forte, ionização total dos dois hidrogênios)'} tem concentração ${sci(conc)} mol/L a 25 °C. Qual é o pH? ${LOGS}`
    } else {
      enunciado = `Em uma solução a 25 °C, ${quem} = ${sci(x)} mol/L. Qual é o pH? ${LOGS}`
    }
    resolucao = `${fator === 2 ? `Cada ${nomeEspecie} libera 2 ${base ? 'OH⁻' : 'H⁺'}: ${quem} = 2 × ${sci(conc)} = ${sci(x)} mol/L. ` : ''}${base ? 'pOH' : 'pH'} = −log (${a} × 10${sup(-k)}) = ${k} − log ${a} = ${k} − ${fn(logaritmo)} = ${fn(pX)}.${base ? ` Então pH = 14 − ${fn(pX)} = ${fn(14 - pX)}.` : ''}`
    erros = [
      { valor: k, frase: `Você usou só o expoente (${k}) e esqueceu o fator ${a}: −log (${a} × 10${sup(-k)}) = ${k} − log ${a}.`, motivo: 'ignorou a mantissa do número' },
      { valor: k + logaritmo, frase: `O log do fator ${a} entra subtraindo: −log (${a} × 10${sup(-k)}) = ${k} − ${fn(logaritmo)}, e não ${k} + ${fn(logaritmo)}.`, motivo: 'somou o log da mantissa em vez de subtrair' },
      ...(base
        ? [{ valor: pX, frase: `${fn(pX)} é o pOH. Falta passar para pH com pH + pOH = 14.`, motivo: 'deu o pOH no lugar do pH' }]
        : [{ valor: 14 - pX, frase: `${fn(14 - pX)} seria o pOH. Para o ácido, pH = −log [H⁺] = ${fn(pX)}.`, motivo: 'confundiu pH com pOH' }]),
      ...(fator === 2
        ? [{ valor: base ? 14 - (k - Math.log10(a / 2)) : k - Math.log10(a / 2), frase: `Você esqueceu o fator 2: cada ${nomeEspecie} libera dois ${base ? 'OH⁻' : 'H⁺'}, então a concentração de ${base ? 'OH⁻' : 'H⁺'} é o dobro da do composto.`, motivo: 'esqueceu que há dois H⁺/OH⁻ por fórmula' }]
        : []),
    ]
    licao = 'pH = −log [H⁺]. Para a × 10⁻ᵏ, pH = k − log a. Base: ache o pOH e use pH = 14 − pOH. Diácidos e dibases liberam 2 íons por fórmula.'
    dicas = ['Escreva a concentração como a × 10⁻ᵏ e aplique pH = k − log a.', base ? 'Se for base, o resultado é o pOH; passe para pH com 14 − pOH.' : 'Ácido: o resultado já é o pH.', fator === 2 ? 'Conte quantos H⁺ ou OH⁻ cada fórmula libera.' : 'Os valores de log são dados no enunciado.']
    dados = { variante: 'log', base, k, a, fator }
  } else {
    const modo = rng() < 0.5 ? 'diluicao' : 'neutralizacao'
    if (modo === 'diluicao') {
      const opcoes: { C1: number; V1: number; V2: number }[] = []
      for (const C1 of [1e-1, 1e-2, 1e-3, 5e-2, 2e-2, 5e-3, 2e-3])
        for (const V1 of [1, 10, 20, 50, 100])
          for (const V2 of [100, 200, 500, 1000, 2000]) {
            if (V2 <= V1) continue
            const h = (C1 * V1) / V2
            const e = Math.floor(Math.log10(h) + 1e-12)
            const m = Math.round(h / 10 ** e)
            if (Math.abs(h / 10 ** e - m) < 1e-9 && MANTISSAS[m] !== undefined && -e <= 6 && -e >= 2) opcoes.push({ C1, V1, V2 })
          }
      const { C1, V1, V2 } = escolher(rng, opcoes)
      const h = (C1 * V1) / V2
      const e = Math.floor(Math.log10(h) + 1e-12)
      const m = Math.round(h / 10 ** e)
      resposta = -e - (MANTISSAS[m] as number)
      enunciado = `${fn(V1, 0)} mL de uma solução de HCl ${sci(C1)} mol/L são diluídos com água até ${fn(V2, 0)} mL. Qual é o pH da solução final, a 25 °C? ${LOGS}`
      resolucao = `Mols de H⁺: ${sci(C1)} × ${fn(V1 / 1000)} L = ${sci(C1 * V1 / 1000)} mol. Concentração final: ${sci(C1 * V1 / 1000)} ÷ ${fn(V2 / 1000)} L = ${sci(h)} mol/L. pH = −log (${sci(h)}) = ${fn(resposta)}.`
      const phInicial = -Math.log10(C1)
      erros = [
        { valor: phInicial, frase: `${fn(phInicial)} é o pH da solução antes de diluir. A água acrescentada diminui a concentração e aumenta o pH.`, motivo: 'não considerou a diluição' },
        { valor: 14 - resposta, frase: `${fn(14 - resposta)} seria o pOH. Para um ácido, o pH vem direto de −log [H⁺].`, motivo: 'confundiu pH com pOH' },
        { valor: -Math.log10((C1 * V1) / 1000), frase: 'Você usou os mols de H⁺ no lugar da concentração. Divida pelo volume final em litros.', motivo: 'usou mols em vez de mol/L' },
        { valor: -Math.log10(C1 / V2), frase: 'Você dividiu a concentração inicial pelo volume em mL. Diluição: C₁V₁ = C₂V₂.', motivo: 'dividiu a concentração pelo volume' },
      ]
      licao = 'Diluir muda a concentração (C₁V₁ = C₂V₂) e, por isso, o pH. Cada diluição de 10 vezes de um ácido forte sobe o pH em 1.'
      dicas = ['A quantidade de H⁺ não muda ao diluir: calcule a nova concentração.', 'C₁V₁ = C₂V₂.', 'Depois pH = −log [H⁺].']
      dados = {
        variante: 'diluicao',
        etapas: [
          { rotulo: 'Inicial', volume: V1, c: C1 },
          { rotulo: 'Final', volume: V2, c: null, rotuloC: 'pH = ?' },
        ],
        ligacoes: ['+ água'],
      }
    } else {
      const opcoes: { Ca: number; Cb: number; Va: number; Vb: number }[] = []
      for (const Ca of [0.1, 0.2, 0.05, 0.5, 0.01, 0.02])
        for (const Cb of [0.1, 0.2, 0.05, 0.5, 0.01, 0.02])
          for (const Va of [50, 100, 150, 200, 250, 300])
            for (const Vb of [50, 100, 150, 200, 250, 300]) {
              const nH = (Ca * Va) / 1000
              const nOH = (Cb * Vb) / 1000
              if (Math.abs(nH - nOH) < 1e-12) {
                if (Ca !== Cb) opcoes.push({ Ca, Cb, Va, Vb })
                continue
              }
              const exc = Math.abs(nH - nOH) / ((Va + Vb) / 1000)
              const e = Math.floor(Math.log10(exc) + 1e-9)
              const m = Math.round(exc / 10 ** e)
              if (Math.abs(exc / 10 ** e - m) < 1e-9 && MANTISSAS[m] !== undefined && -e >= 1 && -e <= 4 && nH > 0 && nOH > 0) opcoes.push({ Ca, Cb, Va, Vb })
            }
      const exatos = opcoes.filter((o) => Math.abs((o.Ca * o.Va) / 1000 - (o.Cb * o.Vb) / 1000) < 1e-12)
      const escolhido = rng() < 0.2 && exatos.length ? escolher(rng, exatos) : escolher(rng, opcoes.filter((o) => !exatos.includes(o)))
      const { Ca, Cb, Va, Vb } = escolhido
      const nH = (Ca * Va) / 1000
      const nOH = (Cb * Vb) / 1000
      const Vt = (Va + Vb) / 1000
      const excesso = nH - nOH
      if (Math.abs(excesso) < 1e-12) resposta = 7
      else if (excesso > 0) resposta = -Math.log10(excesso / Vt)
      else resposta = 14 + Math.log10(-excesso / Vt)
      enunciado = `Misturam-se ${fn(Va, 0)} mL de HCl ${fn(Ca)} mol/L com ${fn(Vb, 0)} mL de NaOH ${fn(Cb)} mol/L, a 25 °C. Qual é o pH da solução resultante? ${LOGS}`
      resolucao = `Mols de H⁺: ${fn(Ca)} × ${fn(Va / 1000)} = ${fn(nH, 4)} mol. Mols de OH⁻: ${fn(Cb)} × ${fn(Vb / 1000)} = ${fn(nOH, 4)} mol. ${Math.abs(excesso) < 1e-12 ? 'Quantidades iguais: neutralização exata, pH = 7.' : excesso > 0 ? `Sobram ${fn(excesso, 4)} mol de H⁺ em ${fn(Vt)} L: [H⁺] = ${sci(excesso / Vt)} mol/L, pH = ${fn(resposta)}.` : `Sobram ${fn(-excesso, 4)} mol de OH⁻ em ${fn(Vt)} L: [OH⁻] = ${sci(-excesso / Vt)} mol/L, pOH = ${fn(14 - resposta)} e pH = ${fn(resposta)}.`}`
      const phAcido = -Math.log10(Ca)
      erros = [
        { valor: 7, frase: 'Neutralização não leva sempre a pH 7: só se os mols de H⁺ e de OH⁻ forem iguais. Compare as quantidades (C × V) antes de decidir.', motivo: 'achou que a mistura é sempre neutra' },
        { valor: -Math.log10((nH > nOH ? Math.abs(excesso) / (Va / 1000) : Ca)), frase: 'Você dividiu o excesso só pelo volume de uma das soluções. O volume final é a soma dos dois volumes.', motivo: 'não somou os volumes' },
        { valor: phAcido, frase: 'Você deu o pH do ácido original, sem considerar a base que o neutralizou parcialmente.', motivo: 'ignorou a base' },
        { valor: 14 + Math.log10(Cb), frase: 'Você deu o pH da base original, sem considerar o ácido que a neutralizou parcialmente.', motivo: 'ignorou o ácido' },
        { valor: excesso > 0 ? 14 - resposta : 14 - resposta, frase: `${fn(14 - resposta)} é o oposto do pH: confira se o excesso é de ácido (pH < 7) ou de base (pH > 7).`, motivo: 'confundiu pH com pOH' },
        { valor: -Math.log10(Math.abs(Ca - Cb) || 1), frase: 'Você subtraiu as concentrações. É preciso comparar mols (C × V) e depois dividir o excesso pelo volume total.', motivo: 'subtraiu concentrações em vez de mols' },
      ]
      licao = 'Neutralização: compare mols (C × V) de H⁺ e OH⁻. O excesso, dividido pelo volume total, dá [H⁺] ou [OH⁻] e daí o pH. Iguais: pH 7.'
      dicas = ['Calcule os mols de H⁺ e de OH⁻ (C × V em litros).', 'H⁺ + OH⁻ → H₂O: o menor se esgota, e sobra a diferença.', 'Divida o excesso pelo volume total e aplique −log (ácido) ou pOH → pH (base).']
      dados = {
        variante: 'neutralizacao',
        etapas: [
          { rotulo: 'Ácido', volume: Va, c: Ca },
          { rotulo: 'Base', volume: Vb, c: Cb },
          { rotulo: 'Mistura', volume: Va + Vb, c: null, rotuloC: 'pH = ?' },
        ],
        ligacoes: ['+', '='],
        base: excesso < 0,
      }
    }
  }
  return { enunciado, resposta, tolerancia: tol, unidade: undefined, erros: limpar(erros, resposta, tol), resolucao, dicas, licao, dados }
}

/* ================================================================== deslocamento do equilíbrio */

export interface DadosEq {
  reacao: string
  perturbacao: Perturbacao
  pergunta: 'sentido' | 'constante'
}

const FASE_TXT = { g: '(g)', s: '(s)', l: '(l)', aq: '(aq)' } as const

export function equacaoEq(r: ReacaoEq): string {
  const lado = (es: typeof r.reag) => es.map((e) => `${e.c === 1 ? '' : e.c} ${formulaTexto(e.f)}${FASE_TXT[e.fase]}`.trim()).join(' + ')
  return `${lado(r.reag)} ⇌ ${lado(r.prod)}`
}

const RAZAO_DH = (r: ReacaoEq) => (r.dH > 0 ? 'ΔH > 0 (endotérmica)' : 'ΔH < 0 (exotérmica)')

function textoPerturbacao(r: ReacaoEq, p: Perturbacao): string {
  const todas = especies(r)
  switch (p.tipo) {
    case 'add':
      return `se acrescenta mais ${formulaTexto((todas[p.especie] as { f: string }).f)}${FASE_TXT[(todas[p.especie] as { fase: 'g' | 's' | 'l' | 'aq' }).fase]}, a temperatura e volume constantes`
    case 'remove':
      return `se retira parte do ${formulaTexto((todas[p.especie] as { f: string }).f)}${FASE_TXT[(todas[p.especie] as { fase: 'g' | 's' | 'l' | 'aq' }).fase]} do sistema`
    case 'T':
      return p.sobe ? 'a temperatura é elevada' : 'o sistema é resfriado'
    case 'P':
      return p.aumenta ? 'a pressão total é aumentada por redução do volume do recipiente' : 'a pressão total é reduzida por aumento do volume do recipiente'
    case 'cat':
      return 'se adiciona um catalisador'
    default:
      return 'se adiciona um gás inerte (como o hélio) a volume constante'
  }
}

const OPCOES_SENTIDO: Record<Sentido, string> = { direta: 'Para a direita (favorece os produtos)', inversa: 'Para a esquerda (favorece os reagentes)', nenhum: 'Não há deslocamento' }
const OPCOES_K: Record<'aumenta' | 'diminui' | 'igual', string> = { aumenta: 'Kc aumenta', diminui: 'Kc diminui', igual: 'Kc não se altera' }

export function gerarEquilibrio(rng: Rng, nivel: Nivel): InstanciaMulti<DadosEq> {
  const pool1 = ['haber', 'n2o4', 'so3', 'co', 'pcl5', 'hi', 'shift']
  const pool2 = [...pool1]
  const pool3 = [...pool1, 'calcario', 'calcario']
  const r = reacaoEq(escolher(rng, nivel === 1 ? pool1 : nivel === 2 ? pool2 : pool3))
  const todas = especies(r)
  const gasosas = todas.map((e, i) => ({ e, i })).filter((x) => x.e.fase !== 's' && x.e.fase !== 'l')
  let p: Perturbacao
  const tipos = nivel === 1 ? ['add', 'remove'] : nivel === 2 ? ['add', 'remove', 'T', 'T', 'P', 'P', 'cat'] : ['T', 'P', 'cat', 'inerte', 'add', 'remove', 'solido']
  const tipo = escolher(rng, tipos)
  if (tipo === 'solido') {
    const solidos = todas.map((e, i) => ({ e, i })).filter((x) => x.e.fase === 's')
    p = solidos.length ? { tipo: rng() < 0.5 ? 'add' : 'remove', especie: escolher(rng, solidos).i } : { tipo: 'cat' }
  } else if (tipo === 'add' || tipo === 'remove') p = { tipo, especie: escolher(rng, gasosas).i }
  else if (tipo === 'T') p = { tipo, sobe: rng() < 0.5 }
  else if (tipo === 'P') p = { tipo, aumenta: rng() < 0.5 }
  else p = { tipo: tipo as 'cat' | 'inerte' }
  const d = deslocamento(r, p)
  const pergK = nivel === 3 && rng() < 0.35
  const cabecalho = `No equilíbrio ${equacaoEq(r)}, ${RAZAO_DH(r)}, o que ocorre quando ${textoPerturbacao(r, p)}?`
  const base = {
    dicas: [
      p.tipo === 'T' ? 'Veja se a reação direta absorve ou libera calor (sinal de ΔH).' : p.tipo === 'P' ? 'Conte os mols de gás de cada lado da equação.' : p.tipo === 'cat' ? 'Pense no que o catalisador faz com as velocidades das duas reações.' : 'O sistema reage para minimizar a perturbação (princípio de Le Chatelier).',
      'Só substâncias gasosas ou dissolvidas contam; sólidos e líquidos puros não entram na constante de equilíbrio.',
      'Pergunte: o que o sistema precisa fazer para anular a mudança?',
    ],
    licao: 'Le Chatelier: o sistema reage para minimizar a perturbação. Concentração: consome o que foi adicionado. Pressão: favorece o lado com menos mols de gás. Temperatura: o calor aquecido é "consumido" pela reação endotérmica. Catalisador, sólidos e gás inerte a V constante não deslocam.',
  }
  if (!pergK) {
    const ordem: Sentido[] = embaralhar(rng, ['direta', 'inversa', 'nenhum'] as Sentido[])
    const ids = ['A', 'B', 'C']
    const porque: Record<string, string> = {}
    const motivo: Record<string, string> = {}
    let certa = 'A'
    ordem.forEach((s, i) => {
      const id = ids[i] as string
      if (s === d.sentido) {
        certa = id
        porque[id] = `Certo. ${d.porque}`
      } else if (d.sentido === 'nenhum') {
        porque[id] = `Não. Aqui não há deslocamento: ${d.porque}`
        motivo[id] = { catalisador: 'achou que o catalisador desloca o equilíbrio', solido: 'contou o sólido no equilíbrio', 'pressao-igual': 'esqueceu que os dois lados têm o mesmo número de mols de gás', inerte: 'achou que gás inerte desloca o equilíbrio' }[d.codigo] ?? 'viu deslocamento onde não há'
      } else if (s === 'nenhum') {
        porque[id] = `Não. Existe deslocamento: ${d.porque}`
        motivo[id] = 'não viu o deslocamento'
      } else {
        porque[id] = `Não, o sentido é o oposto. ${d.porque}`
        motivo[id] = { concentracao: 'inverteu o efeito da concentração', temperatura: 'confundiu o efeito da temperatura (endotérmica/exotérmica)', pressao: 'inverteu o efeito da pressão' }[d.codigo] ?? 'inverteu o sentido do deslocamento'
      }
    })
    return {
      enunciado: cabecalho,
      opcoes: ordem.map((s, i) => ({ id: ids[i] as string, rotulo: OPCOES_SENTIDO[s] })),
      certa,
      porque,
      motivo,
      resolucao: d.porque,
      ...base,
      dados: { reacao: r.id, perturbacao: p, pergunta: 'sentido' },
    }
  }
  // pergunta sobre a constante: só a temperatura muda Kc
  const correta: 'aumenta' | 'diminui' | 'igual' = p.tipo === 'T' ? ((r.dH > 0) === p.sobe ? 'aumenta' : 'diminui') : 'igual'
  const ordem = embaralhar(rng, ['aumenta', 'diminui', 'igual'] as const)
  const ids = ['A', 'B', 'C']
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let certa = 'A'
  const expl = p.tipo === 'T' ? `Kc só muda com a temperatura. Como a reação direta é ${r.dH > 0 ? 'endotérmica' : 'exotérmica'} e ${p.sobe ? 'o sistema foi aquecido' : 'o sistema foi resfriado'}, o equilíbrio se desloca para ${(r.dH > 0) === p.sobe ? 'os produtos' : 'os reagentes'} e Kc ${correta === 'aumenta' ? 'aumenta' : 'diminui'}.` : 'Kc só depende da temperatura. Concentração, pressão, catalisador e gás inerte podem deslocar o equilíbrio (ou não), mas depois de atingido o novo equilíbrio o valor de Kc é o mesmo.'
  ordem.forEach((k, i) => {
    const id = ids[i] as string
    if (k === correta) {
      certa = id
      porque[id] = `Certo. ${expl}`
    } else {
      porque[id] = `Não. ${expl}`
      motivo[id] = p.tipo === 'T' ? 'confundiu o efeito da temperatura sobre Kc' : 'achou que a perturbação muda Kc'
    }
  })
  return {
    enunciado: `No equilíbrio ${equacaoEq(r)}, ${RAZAO_DH(r)}, o que acontece com o valor da constante Kc quando ${textoPerturbacao(r, p)}?`,
    opcoes: ordem.map((k, i) => ({ id: ids[i] as string, rotulo: OPCOES_K[k] })),
    certa,
    porque,
    motivo,
    resolucao: expl,
    ...base,
    dados: { reacao: r.id, perturbacao: p, pergunta: 'constante' },
  }
}

/* ================================================================== constante de equilíbrio */

export interface DadosKc {
  reacao: string
  variante: 'direto' | 'ice' | 'resolver'
  /** concentrações iniciais (mol/L) ou null se for o enunciado do "direto" */
  inicial?: number[]
  /** concentrações no equilíbrio (mol/L) mostradas no enunciado; null = pergunta */
  equilibrio?: (number | null)[]
  volumeL?: number
  /** Kc dado no enunciado (nível 3) */
  K?: number
}

export function gerarKc(rng: Rng, nivel: Nivel): InstanciaNum<DadosKc> {
  const tol = 0.02
  let enunciado: string
  let resposta: number
  let erros: ErroTipico[]
  let resolucao: string
  let dicas: string[]
  let licao: string
  let dados: DadosKc

  if (nivel === 1) {
    // concentrações no equilíbrio dadas → Kc
    const r = reacaoEq(escolher(rng, ['hi', 'haber', 'so3', 'n2o4', 'co']))
    const n = especies(r).length
    const nr = r.reag.length
    for (let t = 0; t < 400; t++) {
      const conc = Array.from({ length: n }, () => escolher(rng, [0.1, 0.2, 0.25, 0.5, 1, 2, 3, 4]))
      const K = kc(r, conc)
      if (!(bonito(K, 2) && K >= 0.05 && K <= 500 && K !== 1)) continue
      const nomes = especies(r).map((e, i) => `[${formulaTexto(e.f)}] = ${fn(conc[i] as number)} mol/L`)
      const somaProd = conc.slice(nr).reduce((s, c) => s + c, 0)
      const somaReag = conc.slice(0, nr).reduce((s, c) => s + c, 0)
      let semExp = 1
      let multCoef = 1
      conc.forEach((c, i) => {
        semExp *= i < nr ? 1 / c : c
        multCoef *= i < nr ? 1 / ((especies(r)[i] as { c: number }).c * c) : (especies(r)[i] as { c: number }).c * c
      })
      return {
        enunciado: `No equilíbrio ${equacaoEq(r)}, a certa temperatura, as concentrações são ${nomes.join(', ')}. Qual é o valor de Kc?`,
        resposta: K,
        tolerancia: tol,
        erros: limpar(
          [
            { valor: 1 / K, frase: 'Você inverteu a fração: Kc tem os produtos no numerador e os reagentes no denominador.', motivo: 'inverteu produtos e reagentes' },
            { valor: semExp, frase: 'Você esqueceu os expoentes: cada concentração é elevada ao seu coeficiente na equação.', motivo: 'esqueceu os expoentes (coeficientes)' },
            { valor: somaProd / somaReag, frase: 'Você somou as concentrações. Kc usa produtos de concentrações, não somas.', motivo: 'somou concentrações em vez de multiplicar' },
            { valor: multCoef, frase: 'Você multiplicou cada concentração pelo coeficiente. O coeficiente é o EXPOENTE da concentração, não um fator.', motivo: 'multiplicou pelo coeficiente em vez de elevar' },
          ],
          K,
          tol,
        ),
        resolucao: `Escreva Kc com os produtos em cima e os reagentes embaixo, cada concentração elevada ao seu coeficiente. Substituindo os valores: Kc = ${fn(K)}.`,
        dicas: ['Produtos no numerador, reagentes no denominador.', 'Eleve cada concentração ao coeficiente dela na equação balanceada.', 'Substitua os valores e calcule.'],
        licao: 'Kc = (produtos elevados aos coeficientes) ÷ (reagentes elevados aos coeficientes). Sólidos e líquidos puros ficam fora.',
        dados: { reacao: r.id, variante: 'direto', equilibrio: conc },
      }
    }
    throw new Error('sem cenário')
  }
  if (nivel === 2) {
    // tabela de equilíbrio: iniciais e uma concentração no equilíbrio → Kc
    const ids = ['hi', 'haber', 'so3', 'n2o4', 'pcl5']
    for (let t = 0; t < 600; t++) {
      const r = reacaoEq(escolher(rng, ids))
      const nr = r.reag.length
      const V = escolher(rng, [2, 4])
      const xi = escolher(rng, [0.1, 0.2, 0.25, 0.5, 1])
      const molsIni = r.reag.map(() => escolher(rng, [1, 2, 3, 4, 6, 8]))
      const inicial = molsIni.map((m) => m / V)
      // quantidade que reage: xi (mol/L) de "avanço"
      const consumo = r.reag.map((e) => e.c * xi)
      if (consumo.some((c, i) => c >= (inicial[i] as number) - 1e-9)) continue
      const eqReag = r.reag.map((_, i) => (inicial[i] as number) - (consumo[i] as number))
      const eqProd = r.prod.map((e) => e.c * xi)
      const conc = [...eqReag, ...eqProd]
      const K = kc(r, conc)
      if (!(bonito(K, 2) && K >= 0.05 && K <= 400 && K !== 1)) continue
      if (!inicial.every((c) => bonito(c, 2)) || !conc.every((c) => bonito(c, 2)) || !molsIni.every((m) => bonito(m, 1))) continue
      resposta = K
      const quem = r.prod[0] as { f: string; c: number }
      const molsProdutoEq = quem.c * xi * V
      const nomesIni = r.reag.map((e, i) => `${fn(molsIni[i] as number)} mol de ${formulaTexto(e.f)}`).join(' e ')
      enunciado = `Em um recipiente de ${fn(V, 0)} L, ${nomesIni} reagem segundo ${equacaoEq(r)}. No equilíbrio, há ${fn(molsProdutoEq)} mol de ${formulaTexto(quem.f)}. Qual é o valor de Kc?`
      const eqSemVolume = especies(r).map((e, i) => (i < nr ? ((molsIni[i] as number) - (consumo[i] as number) * V) : (e.c * xi * V)))
      erros = [
        { valor: kc(r, eqSemVolume), frase: 'Você usou números de mols no lugar de concentrações. Kc usa mol/L: divida pelo volume do recipiente (isso só não importa quando Δn = 0).', motivo: 'usou mols em vez de concentrações' },
        { valor: kc(r, [...inicial, ...r.prod.map(() => 0)].map((c, i) => (i < nr ? c : (r.prod[i - nr] as { c: number }).c * xi))), frase: 'Você usou as concentrações iniciais dos reagentes. No equilíbrio, parte deles já foi consumida.', motivo: 'usou as concentrações iniciais dos reagentes' },
        { valor: 1 / K, frase: 'Você inverteu a fração: produtos em cima, reagentes embaixo.', motivo: 'inverteu produtos e reagentes' },
        { valor: (() => {
          let v = 1
          especies(r).forEach((e, i) => (v *= i < nr ? 1 / (e.c * (conc[i] as number)) : e.c * (conc[i] as number)))
          return v
        })(), frase: 'Você multiplicou cada concentração pelo coeficiente. O coeficiente é o EXPOENTE da concentração, não um fator.', motivo: 'multiplicou pelo coeficiente em vez de elevar' },
      ]
      resolucao = `Concentrações iniciais: ${r.reag.map((e, i) => `[${formulaTexto(e.f)}] = ${fn(inicial[i] as number)}`).join(', ')} mol/L. Formou-se ${fn(molsProdutoEq / V)} mol/L de ${formulaTexto(quem.f)}, então o avanço foi ${fn(xi)} mol/L e a tabela fica: ${especies(r).map((e, i) => `[${formulaTexto(e.f)}] = ${fn(conc[i] as number)}`).join(', ')}. Kc = ${fn(K)}.`
      licao = 'Tabela de equilíbrio: concentração inicial − consumo = equilíbrio (reagentes); formação = equilíbrio (produtos). O consumo segue os coeficientes. Kc usa concentrações no equilíbrio, em mol/L.'
      dicas = ['Converta mols em mol/L dividindo pelo volume.', 'Use a quantidade formada do produto para achar quanto cada reagente foi consumido (proporção dos coeficientes).', 'Monte Kc com as concentrações no equilíbrio.']
      dados = { reacao: r.id, variante: 'ice', inicial, equilibrio: conc, volumeL: V }
      return { enunciado, resposta, tolerancia: tol, erros: limpar(erros, resposta, tol), resolucao, dicas, licao, dados }
    }
    throw new Error('sem cenário')
  }
  // nível 3: Kc dado → concentração no equilíbrio (reações com Δn = 0, que têm solução por raiz quadrada)
  const combos: { rid: string; raiz: number; a: number; x: number }[] = []
  for (const rid of ['hi', 'shift'])
    for (const raiz of [1.5, 2, 3, 4, 6])
      for (const a of [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8]) {
        const x = rid === 'hi' ? (a * raiz) / (2 + raiz) : (a * raiz) / (1 + raiz)
        if (bonito(x, 2) && bonito(a - x, 2)) combos.push({ rid, raiz, a, x })
      }
  const { rid, raiz, a, x } = escolher(rng, combos)
  const r = reacaoEq(rid)
  const K = raiz * raiz
  const pedirProduto = rng() < 0.5
  const inicial = r.reag.map(() => a)
  const eq = rid === 'hi' ? [a - x, a - x, 2 * x] : [a - x, a - x, x, x]
  const quemIdx = pedirProduto ? r.reag.length : 0
  const quem = (especies(r)[quemIdx] as { f: string }).f
  resposta = eq[quemIdx] as number
  enunciado = `Em um recipiente de 1 L colocam-se ${fn(a)} mol de ${formulaTexto((r.reag[0] as { f: string }).f)} e ${fn(a)} mol de ${formulaTexto((r.reag[1] as { f: string }).f)}, que reagem segundo ${equacaoEq(r)}. A certa temperatura, Kc = ${fn(K)}. Qual é a concentração de ${formulaTexto(quem)} no equilíbrio, em mol/L?`
  erros = [
    { valor: x, frase: rid === 'hi' ? `${fn(x)} é o avanço x. Como a equação tem coeficiente 2 para o HI, [HI] = 2x.` : `${fn(x)} é o avanço x, que é também a concentração do produto; confira se a pergunta é sobre o reagente (a − x).`, motivo: 'confundiu o avanço com a concentração' },
    { valor: a, frase: `${fn(a)} mol/L é a concentração inicial. No equilíbrio parte já reagiu.`, motivo: 'deu a concentração inicial' },
    { valor: raiz, frase: `${fn(raiz)} é a raiz de Kc, não uma concentração. A equação ${rid === 'hi' ? '(2x)² ÷ (a − x)² = Kc → 2x ÷ (a − x) = √Kc' : 'x² ÷ (a − x)² = Kc → x ÷ (a − x) = √Kc'} precisa ser resolvida para x.`, motivo: 'parou na raiz quadrada de Kc' },
    { valor: pedirProduto ? a - x : rid === 'hi' ? 2 * x : x, frase: 'Você deu a concentração da outra substância. Releia o que o enunciado pede.', motivo: 'respondeu a espécie errada' },
    { valor: Math.abs(a - 2 * x), frase: 'Você subtraiu 2x do reagente. Cada reagente perde apenas x (o coeficiente de H₂, I₂, CO e H₂O é 1); só o HI aparece com 2x.', motivo: 'aplicou o coeficiente 2 ao reagente' },
    { valor: K * a, frase: 'Você multiplicou Kc pela concentração inicial. Kc é uma razão de produtos de concentrações; resolva a equação em x.', motivo: 'multiplicou Kc por uma concentração' },
  ]
  resolucao = rid === 'hi' ? `Avanço x: [H₂] = [I₂] = ${fn(a)} − x e [HI] = 2x. Kc = (2x)² ÷ (${fn(a)} − x)² = ${fn(K)} → 2x ÷ (${fn(a)} − x) = ${fn(raiz)} → x = ${fn(x)}. Então [H₂] = [I₂] = ${fn(a - x)} mol/L e [HI] = ${fn(2 * x)} mol/L.` : `Avanço x: [CO] = [H₂O] = ${fn(a)} − x e [CO₂] = [H₂] = x. Kc = x² ÷ (${fn(a)} − x)² = ${fn(K)} → x ÷ (${fn(a)} − x) = ${fn(raiz)} → x = ${fn(x)}. Então [CO] = [H₂O] = ${fn(a - x)} mol/L e [CO₂] = [H₂] = ${fn(x)} mol/L.`
  licao = 'Quando Δn = 0 e as concentrações iniciais são iguais, tire a raiz quadrada dos dois lados de Kc e resolva para o avanço x. Lembre dos coeficientes (2x para HI).'
  dicas = ['Chame de x o avanço (quanto de cada reagente reagiu).', 'Escreva as concentrações no equilíbrio com x (cuidado com o coeficiente 2 no HI).', 'Como os dois lados são quadrados, tire a raiz quadrada de Kc.']
  dados = { reacao: r.id, variante: 'resolver', K, inicial, equilibrio: eq.map((c, i) => (i === quemIdx ? null : c)) as (number | null)[] }
  return { enunciado, resposta, tolerancia: tol, erros: limpar(erros, resposta, tol), resolucao, dicas, licao, dados }
}

/* ================================================================== ácido fraco */

export interface DadosFraco {
  variante: 'ph' | 'alfa' | 'pka'
  ka?: number
  c: number
  ph?: number
}

export function gerarFraco(rng: Rng, nivel: Nivel): InstanciaNum<DadosFraco> {
  let enunciado: string
  let resposta: number
  let erros: ErroTipico[]
  let resolucao: string
  let dicas: string[]
  let licao: string
  let dados: DadosFraco
  let tol = 0.03
  if (nivel === 1) {
    // Ka·C = 10^(-2m): [H⁺] = 10^-m
    const opcoes: { ka: number; c: number; m: number }[] = []
    for (const ka of [1e-4, 1e-5, 1e-6, 1e-7, 1e-8])
      for (const c of [1, 0.1, 0.01, 1e-3, 1e-4]) {
        const lg = Math.log10(ka * c)
        if (Math.abs(lg - Math.round(lg)) < 1e-9 && Math.round(lg) % 2 === 0 && -lg / 2 >= 2 && -lg / 2 <= 5) {
          const alfa = 10 ** (lg / 2) / c
          if (alfa < 0.06) opcoes.push({ ka, c, m: -lg / 2 })
        }
      }
    const { ka, c, m } = escolher(rng, opcoes)
    resposta = m
    enunciado = `Um ácido fraco HA tem Ka = ${sci(ka)} a 25 °C. Qual é o pH de uma solução ${sci(c).replace('10⁰', '1')} mol/L desse ácido? (Use a aproximação [H⁺] = √(Ka · C).)`
    erros = [
      { valor: -Math.log10(c), frase: `${fn(-Math.log10(c))} seria o pH de um ácido FORTE com essa concentração. O ácido é fraco: ioniza só um pouco, então [H⁺] é bem menor que C.`, motivo: 'tratou o ácido fraco como forte' },
      { valor: -Math.log10(ka * c), frase: 'Você esqueceu a raiz quadrada: [H⁺] = √(Ka·C), e o logaritmo da raiz é a metade do expoente.', motivo: 'esqueceu a raiz quadrada' },
      { valor: -Math.log10(ka), frase: `${fn(-Math.log10(ka))} é o pKa, não o pH.`, motivo: 'deu o pKa no lugar do pH' },
      { valor: 14 - m, frase: `${fn(14 - m)} seria o pOH. O pH de um ácido vem de −log [H⁺].`, motivo: 'confundiu pH com pOH' },
    ]
    resolucao = `[H⁺] = √(Ka · C) = √(${sci(ka)} × ${fn(c)}) = √(${sci(ka * c)}) = 10${sup(-m)} mol/L. pH = ${m}.`
    licao = 'Ácido fraco: [H⁺] = √(Ka · C) (ioniza pouco). O pH é maior que o de um ácido forte de mesma concentração.'
    dicas = ['Ácido fraco não ioniza por completo.', '[H⁺] = √(Ka · C).', 'Depois pH = −log [H⁺].']
    dados = { variante: 'ph', ka, c }
  } else if (nivel === 2) {
    const opcoes: { c: number; a: number }[] = []
    for (const c of [0.1, 0.2, 0.5, 0.05, 0.01])
      for (const a of [0.005, 0.01, 0.02, 0.05]) {
        const ka = a * a * c
        if (bonito(ka * 1e8, 1) && ka < 1e-2) opcoes.push({ c, a })
      }
    const { c, a } = escolher(rng, opcoes)
    const ka = a * a * c
    resposta = a * 100
    enunciado = `Um ácido fraco HA tem Ka = ${sci(ka)} a certa temperatura. Qual é o grau de ionização, em porcentagem, de uma solução ${fn(c)} mol/L desse ácido? (Use a aproximação [H⁺] = √(Ka · C).)`
    const h = Math.sqrt(ka * c)
    erros = [
      { valor: a, frase: `${fn(a, 3)} é o grau de ionização como fração. O enunciado pede em porcentagem: multiplique por 100.`, motivo: 'deu a fração, não a porcentagem' },
      { valor: h * 100, frase: `${fn(h, 4)} é a concentração de H⁺ em mol/L, não o grau de ionização. O grau é [H⁺] ÷ C.`, motivo: 'deu [H⁺] em vez do grau de ionização' },
      { valor: h * c * 100, frase: 'Você multiplicou [H⁺] por C. O grau de ionização é a razão [H⁺] ÷ C.', motivo: 'multiplicou em vez de dividir' },
      { valor: Math.sqrt(ka) * 100, frase: 'Você esqueceu a concentração dentro da raiz: [H⁺] = √(Ka · C).', motivo: 'esqueceu a concentração' },
    ]
    resolucao = `[H⁺] = √(Ka · C) = √(${sci(ka)} × ${fn(c)}) = ${sci(h)} mol/L. Grau de ionização = [H⁺] ÷ C = ${sci(h)} ÷ ${fn(c)} = ${fn(a, 3)} = ${fn(a * 100)} %.`
    licao = 'Grau de ionização α = [H⁺] ÷ C (ou fração que ionizou). Em %, multiplique por 100.'
    dicas = ['Primeiro ache [H⁺] = √(Ka · C).', 'α = [H⁺] ÷ C.', 'Passe para porcentagem multiplicando por 100.']
    dados = { variante: 'alfa', ka, c }
    tol = 0.03
  } else {
    const opcoes: { c: number; phv: number }[] = []
    for (const c of [0.1, 0.01, 0.2, 0.5, 0.05]) for (const phv of [2, 3, 4, 5, 2.7, 3.7, 3.4, 4.7]) opcoes.push({ c, phv })
    const { c, phv } = escolher(rng, opcoes)
    const h = 10 ** -phv
    const ka = (h * h) / c
    const pka = -Math.log10(ka)
    resposta = pka
    const comLog = !Number.isInteger(phv)
    enunciado = `Uma solução ${fn(c)} mol/L de um ácido fraco HA tem pH ${fn(phv)} a 25 °C. Calcule o pKa do ácido (pKa = −log Ka), considerando [H⁺] = [A⁻] e desprezando a ionização da água.${comLog ? ' (Dado: log 2 = 0,30.)' : ''}`
    erros = [
      { valor: 2 * phv, frase: 'Você usou pKa = 2·pH, esquecendo a concentração do ácido: Ka = [H⁺]² ÷ C, então pKa = 2·pH + log C.', motivo: 'esqueceu a concentração do ácido' },
      { valor: phv, frase: 'O pKa não é igual ao pH. Ka = [H⁺][A⁻] ÷ [HA], e [HA] ≈ C.', motivo: 'confundiu pKa com pH' },
      { valor: 2 * phv - Math.log10(c), frase: 'O sinal do log C está trocado: pKa = 2·pH + log C.', motivo: 'errou o sinal do log da concentração' },
      { valor: -Math.log10(h), frase: 'Isso é o pH. O pKa vem de Ka = [H⁺]² ÷ C.', motivo: 'repetiu o pH' },
    ]
    resolucao = `[H⁺] = [A⁻] = ${Number.isInteger(phv) ? `10${sup(-phv)}` : `10${sup(-Math.ceil(phv))} × ${fn(10 ** (Math.ceil(phv) - phv))}`} ≈ ${fn(h, 6)} mol/L. Ka = [H⁺]² ÷ C = ${fn(h * h, 10)} ÷ ${fn(c)} = ${sci(ka)}. pKa = −log Ka = ${fn(pka)}. Atalho: pKa = 2·pH + log C = ${fn(2 * phv)} + (${fn(Math.log10(c))}) = ${fn(pka)}.`
    licao = 'Ka = [H⁺]² ÷ C para ácido fraco. Assim, pKa = 2·pH + log C.'
    dicas = ['Ka = [H⁺][A⁻] ÷ [HA] com [H⁺] = [A⁻] e [HA] ≈ C.', 'Ache [H⁺] pelo pH.', 'pKa = 2·pH + log C.']
    dados = { variante: 'pka', c, ph: phv }
  }
  return { enunciado, resposta, tolerancia: tol, unidade: undefined, erros: limpar(erros, resposta, tol), resolucao, dicas, licao, dados }
}
