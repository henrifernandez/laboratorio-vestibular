import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, type Rng } from '@/lib/rng'
import { massaMolar } from '../comum/elementos'
import { formulaTexto } from '../comum/Formula'
import { curva, misturaSalAgua, misturar, molaridadeDeTitulo, precipitado, precipitadoPorEvaporacao, solubilidade, type CurvaSol } from './calculo'

const fn = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const bonito = (x: number, casas = 1) => Math.abs(x * 10 ** casas - Math.round(x * 10 ** casas)) < 1e-9
const tolerancia = (x: number) => Math.max(0.02, Math.abs(x) * 0.005)

function limpar(erros: ErroTipico[], resposta: number, tol: number): ErroTipico[] {
  const saida: ErroTipico[] = []
  for (const e of erros) {
    if (!Number.isFinite(e.valor) || !(e.valor > 0)) continue
    if (Math.abs(e.valor - resposta) <= 2 * tol) continue
    if (saida.some((x) => Math.abs(x.valor - e.valor) <= tol)) continue
    saida.push(e)
  }
  return saida
}

/* ================================================================== concentração */

export interface DadosConc {
  variante: 'gL' | 'molL' | 'titulo' | 'ppm'
  /** massa dissolvida (g) ou, em ppm, massa de poluente (mg) */
  massa: number
  volumeMl: number
  substancia?: string
  titulo?: number
  densidade?: number
}

const SOLIDOS = [
  { f: 'NaCl', nome: 'cloreto de sódio' },
  { f: 'NaOH', nome: 'hidróxido de sódio' },
  { f: 'KOH', nome: 'hidróxido de potássio' },
  { f: 'C6H12O6', nome: 'glicose' },
  { f: 'C12H22O11', nome: 'sacarose' },
  { f: 'NaHCO3', nome: 'bicarbonato de sódio' },
  { f: 'KCl', nome: 'cloreto de potássio' },
  { f: 'Na2CO3', nome: 'carbonato de sódio' },
]

const mm = massaMolar

/** rótulos de ácidos e bases concentrados: [fórmula, nome, título %, densidade g/mL] */
const ROTULOS: [string, string, number, number][] = [
  ['HCl', 'ácido clorídrico', 36.5, 1.2],
  ['HCl', 'ácido clorídrico', 18.25, 1.1],
  ['H2SO4', 'ácido sulfúrico', 98, 1.8],
  ['H2SO4', 'ácido sulfúrico', 49, 1.4],
  ['NaOH', 'hidróxido de sódio', 20, 1.2],
  ['NaOH', 'hidróxido de sódio', 40, 1.4],
  ['HNO3', 'ácido nítrico', 63, 1.4],
  ['HNO3', 'ácido nítrico', 31.5, 1.2],
  ['KOH', 'hidróxido de potássio', 28, 1.3],
]

export function gerarConcentracao(rng: Rng, nivel: Nivel): InstanciaNum<DadosConc> {
  const variante: DadosConc['variante'] = nivel === 1 ? 'gL' : nivel === 2 ? (rng() < 0.65 ? 'molL' : 'ppm') : 'titulo'
  let enunciado: string
  let resposta: number
  let unidade: string
  let erros: ErroTipico[]
  let resolucao: string
  let dados: DadosConc
  let licao: string
  let dicas: string[]

  if (variante === 'gL') {
    const opcoes: [number, number][] = []
    for (const C of [10, 20, 25, 30, 40, 50, 60, 80, 100, 120])
      for (const V of [100, 200, 250, 300, 400, 500, 600, 750, 800, 1000]) if (bonito((C * V) / 1000, 1)) opcoes.push([C, V])
    const [C, V] = escolher(rng, opcoes)
    const m = (C * V) / 1000
    const s = escolher(rng, SOLIDOS)
    resposta = C
    unidade = 'g/L'
    enunciado = `Dissolvem-se ${fn(m)} g de ${s.nome} em água suficiente para completar ${fn(V, 0)} mL de solução. Qual é a concentração, em g/L?`
    erros = [
      { valor: m / V, frase: `Você dividiu a massa pelo volume em mL (${fn(m)} ÷ ${fn(V, 0)}). A unidade g/L pede o volume em litros: ${fn(V, 0)} mL = ${fn(V / 1000)} L.`, motivo: 'não converteu mL em L' },
      { valor: m * (V / 1000), frase: 'Você multiplicou a massa pelo volume. Concentração é massa dividida pelo volume.', motivo: 'multiplicou em vez de dividir' },
      { valor: C / 10, frase: `${fn(C / 10)} seria a concentração em g por 100 mL. Para g/L, divida por ${fn(V / 1000)} L, que é o volume em litros.`, motivo: 'confundiu g/100 mL com g/L' },
    ]
    resolucao = `${fn(V, 0)} mL = ${fn(V / 1000)} L. C = m ÷ V = ${fn(m)} g ÷ ${fn(V / 1000)} L = ${fn(C)} g/L.`
    dados = { variante, massa: m, volumeMl: V, substancia: s.f }
    licao = 'Concentração comum = massa do soluto ÷ volume da solução, com o volume em litros.'
    dicas = ['Converta o volume de mL para L (divida por 1000).', 'C = massa ÷ volume.', `Faça ${fn(m)} ÷ ${fn(V / 1000)}.`]
  } else if (variante === 'molL') {
    const opcoes: [string, number, number][] = []
    for (const s of SOLIDOS)
      for (const M of [0.1, 0.2, 0.25, 0.4, 0.5, 1, 2])
        for (const V of [100, 200, 250, 500, 1000, 2000]) {
          const m = M * mm(s.f) * (V / 1000)
          if (bonito(m, 1) && m >= 1 && m <= 400 && V !== 1000) opcoes.push([s.f, M, V])
        }
    const [f, M, V] = escolher(rng, opcoes)
    const s = SOLIDOS.find((x) => x.f === f) as (typeof SOLIDOS)[number]
    const MMs = mm(f)
    const m = M * MMs * (V / 1000)
    resposta = M
    unidade = 'mol/L'
    enunciado = `Dissolvem-se ${fn(m)} g de ${s.nome} (${formulaTexto(f)}, massa molar ${fn(MMs)} g/mol) em água até completar ${fn(V, 0)} mL de solução. Qual é a concentração, em mol/L?`
    erros = [
      { valor: m / (V / 1000), frase: `${fn(m / (V / 1000))} é a concentração em g/L. Para mol/L, divida também pela massa molar (${fn(MMs)} g/mol).`, motivo: 'parou em g/L, sem converter a massa em mols' },
      { valor: m / MMs, frase: `${fn(m / MMs)} é o número de mols. Falta dividir pelo volume em litros (${fn(V / 1000)} L).`, motivo: 'esqueceu de dividir pelo volume' },
      { valor: m / MMs / V, frase: 'Você usou o volume em mL. Em mol/L o volume entra em litros.', motivo: 'não converteu mL em L' },
      { valor: ((MMs * (V / 1000)) / m), frase: 'Você inverteu a divisão da massa pela massa molar.', motivo: 'inverteu a razão massa/massa molar' },
    ]
    resolucao = `n = m ÷ M = ${fn(m)} ÷ ${fn(MMs)} = ${fn(m / MMs, 3)} mol. V = ${fn(V, 0)} mL = ${fn(V / 1000)} L. Concentração = ${fn(m / MMs, 3)} ÷ ${fn(V / 1000)} = ${fn(M)} mol/L.`
    dados = { variante, massa: m, volumeMl: V, substancia: f }
    licao = 'mol/L = (massa ÷ massa molar) ÷ volume em litros.'
    dicas = ['Primeiro converta a massa em mols (÷ massa molar).', 'Converta o volume para litros.', 'Concentração em mol/L = mols ÷ litros.']
  } else if (variante === 'ppm') {
    const opcoes: [number, number][] = []
    for (const p of [0.5, 1, 2, 3, 4, 5, 8, 10, 20])
      for (const V of [250, 500, 1000, 2000, 4000, 5000]) if (bonito((p * V) / 1000, 2) && V !== 1000) opcoes.push([p, V])
    const [p, V] = escolher(rng, opcoes)
    const mg = (p * V) / 1000
    resposta = p
    unidade = 'ppm'
    enunciado = `Uma amostra de ${fn(V, 0)} mL de água contém ${fn(mg)} mg de um poluente dissolvido. Qual é a concentração do poluente em ppm? (Em soluções aquosas diluídas, 1 ppm = 1 mg por litro.)`
    erros = [
      { valor: mg / V, frase: 'Você dividiu pelos mL. Em ppm (mg/L) o volume entra em litros.', motivo: 'não converteu mL em L' },
      { valor: mg * (V / 1000), frase: 'Você multiplicou pelo volume. É preciso dividir: concentração = massa ÷ volume.', motivo: 'multiplicou em vez de dividir' },
      { valor: mg, frase: `${fn(mg)} é a massa em mg. Falta dividir pelo volume em litros (${fn(V / 1000)} L).`, motivo: 'esqueceu de dividir pelo volume' },
    ]
    resolucao = `${fn(V, 0)} mL = ${fn(V / 1000)} L. ppm = mg ÷ L = ${fn(mg)} ÷ ${fn(V / 1000)} = ${fn(p)} ppm.`
    dados = { variante, massa: mg, volumeMl: V }
    licao = '1 ppm = 1 mg de soluto por litro de solução aquosa diluída: divida mg por litros.'
    dicas = ['A unidade é mg por litro.', 'Converta o volume de mL para L.', `Faça ${fn(mg)} ÷ ${fn(V / 1000)}.`]
  } else {
    const [f, nome, tit, d] = escolher(rng, ROTULOS)
    const MMs = mm(f)
    const M = molaridadeDeTitulo(tit, d, MMs)
    resposta = M
    unidade = 'mol/L'
    enunciado = `O rótulo de um frasco de ${nome} (${formulaTexto(f)}, massa molar ${fn(MMs)} g/mol) indica título de ${fn(tit)} % em massa e densidade de ${fn(d)} g/mL. Qual é a concentração, em mol/L?`
    erros = [
      { valor: (10 * tit) / MMs, frase: 'Você esqueceu a densidade. Ela relaciona o volume com a massa da solução: 1 L de solução tem 1000·d gramas.', motivo: 'esqueceu a densidade' },
      { valor: (d * tit) / MMs, frase: 'Faltou o fator 10: 1 L tem 1000·d g de solução e o título é uma porcentagem (÷ 100), então M = 10·d·τ ÷ massa molar.', motivo: 'esqueceu o fator 10 (1000 mL ÷ 100 %)' },
      { valor: 10 * d * tit, frase: `${fn(10 * d * tit)} é a concentração em g/L. Falta dividir pela massa molar (${fn(MMs)} g/mol).`, motivo: 'parou em g/L, sem dividir pela massa molar' },
      { valor: (d * tit) / MMs / 10, frase: 'O fator 10 entra multiplicando, não dividindo.', motivo: 'dividiu por 10 em vez de multiplicar' },
    ]
    resolucao = `1 L de solução tem massa 1000 mL × ${fn(d)} g/mL = ${fn(1000 * d)} g. Soluto: ${fn(tit)} % de ${fn(1000 * d)} g = ${fn((1000 * d * tit) / 100)} g. Mols: ${fn((1000 * d * tit) / 100)} ÷ ${fn(MMs)} = ${fn(M)} mol. Logo ${fn(M)} mol/L (fórmula: M = 10·d·τ ÷ MM).`
    dados = { variante, massa: 0, volumeMl: 1000, substancia: f, titulo: tit, densidade: d }
    licao = 'Título e densidade → mol/L: M = 10 · d (g/mL) · τ (%) ÷ massa molar.'
    dicas = ['Imagine 1 L (1000 mL) de solução e calcule a massa dele com a densidade.', 'Tire a parte que é soluto usando o título.', 'Converta essa massa de soluto em mols com a massa molar.']
  }
  const tol = tolerancia(resposta)
  return { enunciado, resposta, tolerancia: tol, unidade, erros: limpar(erros, resposta, tol), resolucao, dicas, licao, dados }
}

/* ================================================================== diluição e mistura */

export interface BequerEtapa {
  rotulo: string
  /** volume em mL; null = a pergunta */
  volume: number | null
  /** concentração (mol/L); null = a pergunta */
  c: number | null
  /** texto no lugar de "? mol/L" quando a pergunta é outra (por exemplo, "pH = ?") */
  rotuloC?: string
}

export interface DadosDiluicao {
  variante: 'c2' | 'agua' | 'v2' | 'mistura' | 'evaporar' | 'dupla'
  etapas: BequerEtapa[]
  /** símbolo entre uma etapa e a seguinte */
  ligacoes: string[]
}

export function gerarDiluicao(rng: Rng, nivel: Nivel): InstanciaNum<DadosDiluicao> {
  let enunciado: string
  let resposta: number
  let unidade: string
  let erros: ErroTipico[]
  let resolucao: string
  let dados: DadosDiluicao
  let licao: string
  let dicas: string[]

  if (nivel === 1) {
    const opcoes: { C1: number; V1: number; f: number }[] = []
    for (const C1 of [0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12])
      for (const V1 of [20, 25, 50, 100, 200, 250])
        for (const f of [2, 3, 4, 5, 10]) if (bonito(C1 / f, 2) && C1 / f >= 0.05) opcoes.push({ C1, V1, f })
    const { C1, V1, f } = escolher(rng, opcoes)
    const V2 = V1 * f
    const C2 = C1 / f
    const variante = escolher(rng, ['c2', 'agua', 'v2'] as const)
    const cabecalho = `Uma solução de ${fn(C1)} mol/L, com volume de ${fn(V1, 0)} mL, é diluída com água`
    if (variante === 'c2') {
      enunciado = `${cabecalho} até o volume final de ${fn(V2, 0)} mL. Qual é a nova concentração, em mol/L?`
      resposta = C2
      unidade = 'mol/L'
      erros = [
        { valor: C1 * f, frase: `Você multiplicou: diluir reduz a concentração. O volume foi multiplicado por ${f}, então a concentração é dividida por ${f}.`, motivo: 'multiplicou em vez de dividir' },
        { valor: C1, frase: 'A concentração muda ao diluir: a mesma quantidade de soluto agora está num volume maior.', motivo: 'achou que a concentração não muda' },
        { valor: C1 / 2, frase: `Você dividiu por 2 por hábito. Calcule C₂ = C₁·V₁ ÷ V₂ = ${fn(C1)} × ${fn(V1, 0)} ÷ ${fn(V2, 0)}.`, motivo: 'dividiu por 2 sem usar os volumes' },
      ]
      resolucao = `O soluto não muda: C₁V₁ = C₂V₂. C₂ = ${fn(C1)} × ${fn(V1, 0)} ÷ ${fn(V2, 0)} = ${fn(C2)} mol/L.`
      dicas = ['A quantidade de soluto (mols) não muda ao diluir.', 'C₁·V₁ = C₂·V₂.', `O volume foi multiplicado por ${f}.`]
    } else if (variante === 'agua') {
      enunciado = `${cabecalho} até a concentração ficar em ${fn(C2)} mol/L. Que volume de água, em mL, foi adicionado?`
      resposta = V2 - V1
      unidade = 'mL'
      erros = [
        { valor: V2, frase: `${fn(V2, 0)} mL é o volume final da solução. A água adicionada é o final menos o inicial (${fn(V1, 0)} mL).`, motivo: 'deu o volume final, não a água adicionada' },
        { valor: V1 / f, frase: 'Você inverteu a razão entre as concentrações. Diluir aumenta o volume.', motivo: 'inverteu a razão C₁/C₂' },
        { valor: V1, frase: `Você respondeu o volume inicial. O volume final é ${f} vezes maior e a água adicionada é a diferença.`, motivo: 'confundiu volume inicial com água adicionada' },
      ]
      resolucao = `V₂ = C₁V₁ ÷ C₂ = ${fn(C1)} × ${fn(V1, 0)} ÷ ${fn(C2)} = ${fn(V2, 0)} mL. Água adicionada = V₂ − V₁ = ${fn(V2, 0)} − ${fn(V1, 0)} = ${fn(V2 - V1, 0)} mL.`
      dicas = ['Primeiro ache o volume final com C₁V₁ = C₂V₂.', 'A água adicionada não é o volume final.', 'Água = V₂ − V₁.']
    } else {
      enunciado = `${cabecalho} até a concentração ficar em ${fn(C2)} mol/L. Qual é o volume final da solução, em mL?`
      resposta = V2
      unidade = 'mL'
      erros = [
        { valor: V2 - V1, frase: `${fn(V2 - V1, 0)} mL é só a água adicionada. O volume final inclui também os ${fn(V1, 0)} mL iniciais.`, motivo: 'deu a água adicionada, não o volume final' },
        { valor: V1 / f, frase: 'Você inverteu a razão entre as concentrações. Ao diluir, o volume aumenta.', motivo: 'inverteu a razão C₁/C₂' },
        { valor: V1 + f, frase: 'Você somou o fator ao volume. O volume final é o inicial vezes a razão C₁/C₂.', motivo: 'somou em vez de multiplicar' },
      ]
      resolucao = `C₁V₁ = C₂V₂ → V₂ = ${fn(C1)} × ${fn(V1, 0)} ÷ ${fn(C2)} = ${fn(V2, 0)} mL.`
      dicas = ['A quantidade de soluto não muda: C₁V₁ = C₂V₂.', 'Isole V₂.', `A razão C₁ ÷ C₂ é ${f}.`]
    }
    licao = 'Ao diluir, a quantidade de soluto é a mesma: C₁·V₁ = C₂·V₂. A água adicionada é V₂ − V₁.'
    dados = {
      variante,
      etapas: [
        { rotulo: 'Inicial', volume: V1, c: C1 },
        { rotulo: 'Final', volume: variante === 'c2' ? V2 : null, c: variante === 'c2' ? null : C2 },
      ],
      ligacoes: ['+ água'],
    }
  } else if (nivel === 2) {
    const opcoes: { C1: number; C2: number; V1: number; V2: number }[] = []
    for (const C1 of [0.5, 1, 2, 3, 4, 5, 6])
      for (const C2 of [0.5, 1, 2, 3, 4, 5, 6, 8])
        for (const V1 of [100, 200, 250, 300, 400, 500])
          for (const V2 of [100, 200, 250, 300, 400, 500]) if (C1 !== C2 && V1 !== V2 && bonito(misturar(C1, V1, C2, V2), 2)) opcoes.push({ C1, C2, V1, V2 })
    const { C1, C2, V1, V2 } = escolher(rng, opcoes)
    const C = misturar(C1, V1, C2, V2)
    resposta = C
    unidade = 'mol/L'
    enunciado = `Misturam-se ${fn(V1, 0)} mL de uma solução ${fn(C1)} mol/L de NaCl com ${fn(V2, 0)} mL de outra solução ${fn(C2)} mol/L de NaCl. Qual é a concentração final, em mol/L? (Considere os volumes aditivos.)`
    erros = [
      { valor: (C1 + C2) / 2, frase: 'Você tirou a média simples das concentrações. Ela só vale se os volumes forem iguais; aqui eles são diferentes, então a média precisa ser ponderada pelos volumes.', motivo: 'média simples das concentrações' },
      { valor: C1 + C2, frase: 'Você somou as concentrações. O que se soma são os mols (C·V) e os volumes.', motivo: 'somou as concentrações' },
      { valor: (C1 * V1 + C2 * V2) / Math.max(V1, V2), frase: 'Você dividiu os mols totais por um dos volumes. O volume final é a soma V₁ + V₂.', motivo: 'dividiu pelo volume errado' },
      { valor: (C1 * V1 + C2 * V2) / 1000, frase: 'Você dividiu pelo número 1000 sem somar os volumes. Divida os mols totais pelo volume final em litros.', motivo: 'não usou o volume final' },
    ]
    resolucao = `Mols 1: ${fn(C1)} × ${fn(V1 / 1000)} L = ${fn((C1 * V1) / 1000, 3)} mol. Mols 2: ${fn(C2)} × ${fn(V2 / 1000)} L = ${fn((C2 * V2) / 1000, 3)} mol. Total: ${fn((C1 * V1 + C2 * V2) / 1000, 3)} mol em ${fn(V1 + V2, 0)} mL = ${fn((V1 + V2) / 1000)} L → ${fn(C)} mol/L.`
    licao = 'Mistura do mesmo soluto: some os mols (C·V) e divida pelo volume total. Não faça média simples.'
    dicas = ['Calcule os mols de cada solução (C × V em litros).', 'Some os mols e some os volumes.', 'C final = mols totais ÷ volume total.']
    dados = { variante: 'mistura', etapas: [{ rotulo: '1', volume: V1, c: C1 }, { rotulo: '2', volume: V2, c: C2 }, { rotulo: 'Mistura', volume: V1 + V2, c: null }], ligacoes: ['+', '='] }
  } else {
    const variante = rng() < 0.5 ? 'evaporar' : 'dupla'
    if (variante === 'evaporar') {
      const opcoes: { C1: number; V1: number; V2: number }[] = []
      for (const C1 of [0.5, 1, 2, 3, 4, 5])
        for (const V1 of [200, 400, 500, 800, 1000])
          for (const f of [1.25, 1.5, 2, 2.5, 4]) {
            const V2 = V1 / f
            if (Number.isInteger(V2) && bonito(C1 * f, 2)) opcoes.push({ C1, V1, V2 })
          }
      const { C1, V1, V2 } = escolher(rng, opcoes)
      const C2 = (C1 * V1) / V2
      resposta = C2
      unidade = 'mol/L'
      enunciado = `Evaporam-se ${fn(V1 - V2, 0)} mL de água de ${fn(V1, 0)} mL de uma solução ${fn(C1)} mol/L de um sal não volátil. Qual é a nova concentração, em mol/L?`
      erros = [
        { valor: C1 * (V1 / (V1 - V2)), frase: 'Você usou o volume evaporado no lugar do volume que restou. Depois de evaporar, a solução fica com V₁ − (evaporado).', motivo: 'usou o volume evaporado como volume final' },
        { valor: C1 * (V2 / V1), frase: 'Você inverteu a razão: ao evaporar, o volume diminui e a concentração aumenta.', motivo: 'inverteu a razão dos volumes' },
        { valor: C1, frase: 'A quantidade de soluto não muda, mas o volume diminuiu, então a concentração aumenta.', motivo: 'achou que a concentração não muda' },
      ]
      resolucao = `O sal não evapora: C₁V₁ = C₂V₂. Volume final = ${fn(V1, 0)} − ${fn(V1 - V2, 0)} = ${fn(V2, 0)} mL. C₂ = ${fn(C1)} × ${fn(V1, 0)} ÷ ${fn(V2, 0)} = ${fn(C2)} mol/L.`
      licao = 'Evaporar tira só água: o soluto é o mesmo e o volume diminui, então a concentração aumenta (C₁V₁ = C₂V₂).'
      dicas = ['O soluto não evapora.', 'Calcule o volume que restou.', 'C₁V₁ = C₂V₂.']
      dados = { variante, etapas: [{ rotulo: 'Inicial', volume: V1, c: C1 }, { rotulo: 'Final', volume: V2, c: null }], ligacoes: ['− água'] }
    } else {
      const opcoes: { C1: number; C2: number; V1: number; V2: number; Va: number }[] = []
      for (const C1 of [1, 2, 3, 4, 6])
        for (const C2 of [0.5, 1, 2, 5])
          for (const V1 of [100, 200, 300])
            for (const V2 of [100, 200, 300])
              for (const Va of [100, 200, 300, 400, 500]) {
                const final = (C1 * V1 + C2 * V2) / (V1 + V2 + Va)
                if (C1 !== C2 && bonito(final, 2) && final > 0.1) opcoes.push({ C1, C2, V1, V2, Va })
              }
      const { C1, C2, V1, V2, Va } = escolher(rng, opcoes)
      const Vt = V1 + V2 + Va
      const C = (C1 * V1 + C2 * V2) / Vt
      resposta = C
      unidade = 'mol/L'
      enunciado = `Misturam-se ${fn(V1, 0)} mL de solução ${fn(C1)} mol/L e ${fn(V2, 0)} mL de solução ${fn(C2)} mol/L do mesmo soluto. Em seguida, adicionam-se ${fn(Va, 0)} mL de água. Qual é a concentração final, em mol/L?`
      erros = [
        { valor: misturar(C1, V1, C2, V2), frase: 'Esse é o valor logo depois de misturar as duas soluções. Faltou considerar a água adicionada, que aumenta o volume total.', motivo: 'esqueceu de considerar a água adicionada' },
        { valor: (C1 * V1 + C2 * V2) / (V1 + V2 + Va) / 2, frase: 'Você dividiu por 2 sem necessidade.', motivo: 'dividiu por 2 sem necessidade' },
        { valor: ((C1 + C2) / 2) * ((V1 + V2) / Vt), frase: 'Você tirou a média simples das concentrações antes de diluir. Some os mols (C·V) e divida pelo volume total.', motivo: 'média simples das concentrações' },
      ]
      resolucao = `Mols: ${fn(C1)} × ${fn(V1 / 1000)} + ${fn(C2)} × ${fn(V2 / 1000)} = ${fn((C1 * V1 + C2 * V2) / 1000, 3)} mol. Volume final: ${fn(V1, 0)} + ${fn(V2, 0)} + ${fn(Va, 0)} = ${fn(Vt, 0)} mL = ${fn(Vt / 1000)} L. C = ${fn((C1 * V1 + C2 * V2) / 1000, 3)} ÷ ${fn(Vt / 1000)} = ${fn(C)} mol/L.`
      licao = 'Em qualquer mistura ou diluição, some todos os mols e divida pelo volume final (incluindo a água).'
      dicas = ['Calcule os mols de cada solução antes de misturar.', 'A água adicionada não tem soluto, mas entra no volume final.', 'C = mols totais ÷ volume total.']
      dados = { variante, etapas: [{ rotulo: '1', volume: V1, c: C1 }, { rotulo: '2', volume: V2, c: C2 }, { rotulo: 'Final', volume: Vt, c: null }], ligacoes: ['+', '+ água'] }
    }
  }
  const tol = tolerancia(resposta)
  return { enunciado, resposta, tolerancia: tol, unidade, erros: limpar(erros, resposta, tol), resolucao, dicas, licao, dados }
}

/* ================================================================== solubilidade: classificar */

export interface Marca {
  T: number
  /** g de sal por 100 g de água */
  S: number
  rotulo: string
}

export interface DadosSolubilidade {
  curva: 'A' | 'B' | 'C'
  marcas: Marca[]
  /** sal e água (g) quando o enunciado dá as massas */
  sal?: number
  agua?: number
  T1: number
  T2?: number
}

type EstadoFinal = 'insaturada' | 'saturada' | 'corpo' | 'super'
const NOME_ESTADO: Record<EstadoFinal, string> = {
  insaturada: 'Insaturada, sem sal no fundo',
  saturada: 'Saturada, sem sal no fundo',
  corpo: 'Saturada, com sal no fundo',
  super: 'Supersaturada (instável)',
}
const ORDEM_ESTADOS: EstadoFinal[] = ['insaturada', 'saturada', 'corpo', 'super']

function opcoesEstado(rng: Rng, certa: EstadoFinal, porque: Record<EstadoFinal, string>, motivo: Record<EstadoFinal, string>) {
  const ids = ['A', 'B', 'C', 'D']
  const lista = embaralhar(rng, ORDEM_ESTADOS)
  const porqueId: Record<string, string> = {}
  const motivoId: Record<string, string> = {}
  let certaId = 'A'
  lista.forEach((e, i) => {
    porqueId[ids[i] as string] = porque[e]
    if (e === certa) certaId = ids[i] as string
    else motivoId[ids[i] as string] = motivo[e]
  })
  return { opcoes: lista.map((e, i) => ({ id: ids[i] as string, rotulo: NOME_ESTADO[e] })), certa: certaId, porque: porqueId, motivo: motivoId }
}

const AGUAS = [100, 200, 250, 400, 500]

export function gerarSolubilidade(rng: Rng, nivel: Nivel): InstanciaMulti<DadosSolubilidade> {
  const LICAO = 'Compare a massa de sal com o que a água dissolve àquela temperatura (a curva): menos = insaturada; igual = saturada; mais = saturada com sal no fundo. Supersaturada só se a solução saturada mudou de temperatura sem cristalizar.'
  const dicasBase = ['Leia a solubilidade na curva, na temperatura do enunciado (g de sal por 100 g de água).', 'Ajuste para a massa de água do enunciado.', 'Compare com a massa de sal colocada.']

  // --- cenário 1 (níveis 1 e 2): mistura sal + água
  const cenarioMistura = (): InstanciaMulti<DadosSolubilidade> => {
    const c = curva(escolher(rng, ['A', 'B']))
    const T = escolher(rng, [20, 40, 60, 80])
    const agua = escolher(rng, AGUAS)
    const S = solubilidade(c, T)
    const cap = (S * agua) / 100
    const razoes = [0.4, 0.5, 0.75, 1, 1.25, 1.5, 2]
    const candidatas = razoes.filter((r) => bonito(cap * r, 1) && cap * r <= 600)
    const r = rng() < 0.22 && candidatas.includes(1) ? 1 : escolher(rng, candidatas.filter((x) => x !== 1))
    const sal = Math.round(cap * r * 10) / 10
    const res = misturaSalAgua(c, T, sal, agua)
    const certa: EstadoFinal = res.estado === 'insaturada' ? 'insaturada' : res.estado === 'saturada' ? 'saturada' : 'corpo'
    const base = `${fn(S)} g de ${c.nome} por 100 g de água a ${T} °C, ou seja, ${fn(cap)} g em ${fn(agua, 0)} g de água.`
    const porque: Record<EstadoFinal, string> = {
      insaturada: certa === 'insaturada' ? `Certo. A curva mostra ${base} Foram colocados só ${fn(sal)} g, menos que a capacidade, e tudo dissolve com folga.` : `Não. A curva mostra ${base} ${certa === 'saturada' ? 'Foram colocados exatamente isso: não há folga, a solução já está saturada.' : `Foram colocados ${fn(sal)} g, mais que isso: o excesso (${fn(res.depositado)} g) não dissolve.`}`,
      saturada: certa === 'saturada' ? `Certo. A curva mostra ${base} Foi colocado exatamente isso: tudo dissolve e não sobra nada, a solução está saturada sem corpo de fundo.` : `Não. A curva mostra ${base} ${certa === 'insaturada' ? `Foram colocados só ${fn(sal)} g: ainda cabe mais, então é insaturada.` : `Foram colocados ${fn(sal)} g, e ${fn(res.depositado)} g sobram sem dissolver: há sal no fundo.`}`,
      corpo: certa === 'corpo' ? `Certo. A curva mostra ${base} Foram colocados ${fn(sal)} g: dissolvem ${fn(cap)} g e sobram ${fn(res.depositado)} g no fundo. A solução fica saturada, com corpo de fundo.` : `Não. A curva mostra ${base} ${certa === 'insaturada' ? `Foram colocados só ${fn(sal)} g: tudo dissolve, não sobra nada no fundo.` : 'Foi colocado exatamente isso: tudo dissolve, e não sobra sal no fundo.'}`,
      super: `Não. Supersaturada é uma situação instável, que só aparece quando uma solução saturada muda de temperatura sem cristalizar. Aqui o sal foi simplesmente misturado com a água.`,
    }
    const motivo: Record<EstadoFinal, string> = {
      insaturada: 'achou que cabia mais sal do que a curva permite',
      saturada: certa === 'corpo' ? 'ignorou o excesso de sal que sobra no fundo' : 'não comparou a massa de sal com a capacidade da água',
      corpo: certa === 'insaturada' ? 'achou que o sal não dissolveria tudo' : 'não comparou a massa de sal com a capacidade da água',
      super: 'confundiu corpo de fundo com supersaturada',
    }
    const o = opcoesEstado(rng, certa, porque, motivo)
    return {
      enunciado: `Misturam-se ${fn(sal)} g do ${c.nome} com ${fn(agua, 0)} g de água a ${T} °C, sob agitação. A solubilidade desse sal está no gráfico. Como se classifica o sistema obtido?`,
      ...o,
      resolucao: `${base} Foram colocados ${fn(sal)} g. ${certa === 'insaturada' ? 'Como é menos que a capacidade, a solução é insaturada.' : certa === 'saturada' ? 'Como é exatamente a capacidade, a solução é saturada sem corpo de fundo.' : `Como é mais que a capacidade, dissolvem ${fn(cap)} g e ${fn(res.depositado)} g ficam no fundo: saturada com corpo de fundo.`}`,
      dicas: dicasBase,
      licao: LICAO,
      dados: { curva: c.id, marcas: [{ T, S, rotulo: `${T} °C` }], sal, agua, T1: T },
    }
  }

  // --- cenário 2 (níveis 2 e 3): solução saturada muda de temperatura
  const cenarioTemperatura = (): InstanciaMulti<DadosSolubilidade> => {
    const c = curva(escolher(rng, nivel === 2 ? ['A', 'B', 'C'] : ['A', 'C']))
    const [T1, T2] = escolher(rng, [[20, 60], [60, 20], [40, 80], [80, 40], [20, 80], [80, 20], [0, 40], [40, 0]] as [number, number][])
    const agua = escolher(rng, AGUAS)
    const S1 = solubilidade(c, T1)
    const S2 = solubilidade(c, T2)
    const sobe = S2 > S1
    const certa: EstadoFinal = sobe ? 'insaturada' : 'corpo'
    const dep = ((S1 - S2) * agua) / 100
    const verbo = T2 > T1 ? 'aquecida' : 'resfriada'
    const fatos = `A ${T1} °C a solubilidade do ${c.nome} é ${fn(S1)} g/100 g de água e a ${T2} °C é ${fn(S2)} g/100 g de água. Em ${fn(agua, 0)} g de água: ${fn((S1 * agua) / 100)} g a ${T1} °C e ${fn((S2 * agua) / 100)} g a ${T2} °C.`
    const porque: Record<EstadoFinal, string> = {
      insaturada: sobe ? `Certo. ${fatos} Agora cabe mais sal do que o que está dissolvido, então fica insaturada.` : `Não. ${fatos} A capacidade diminui, então o sal em excesso (${fn(dep)} g) se separa.`,
      saturada: `Não. Quando a temperatura muda, a capacidade da água muda (de ${fn((S1 * agua) / 100)} g para ${fn((S2 * agua) / 100)} g), e a quantidade de sal continua a mesma. Por isso ${sobe ? 'sobra espaço' : 'sobra sal'}, e o sistema não fica exatamente saturado.`,
      corpo: !sobe ? `Certo. ${fatos} A capacidade diminui, então ${fn(dep)} g de sal se separam e ficam no fundo: saturada com corpo de fundo.` : `Não. ${fatos} A capacidade aumenta, então todo o sal continua dissolvido e ainda cabe mais: nada se separa.`,
      super: `Não. A solução supersaturada só existe se o sal, que deveria cristalizar, ficar dissolvido (por exemplo, no resfriamento lento e sem agitação). O enunciado não diz isso: o sal que não cabe se separa.`,
    }
    const motivo: Record<EstadoFinal, string> = {
      insaturada: 'achou que aquecer/resfriar sempre dissolve mais (ou menos) sal, sem olhar a curva',
      saturada: 'achou que continua saturada sem comparar com a nova solubilidade',
      corpo: sobe ? 'achou que o sal se separa quando a solubilidade aumenta' : 'confundiu o sentido da curva',
      super: 'confundiu corpo de fundo com supersaturada',
    }
    const o = opcoesEstado(rng, certa, porque, motivo)
    return {
      enunciado: `Uma solução saturada de ${c.nome}, sem sal no fundo, contém ${fn(agua, 0)} g de água a ${T1} °C. Ela é ${verbo} lentamente até ${T2} °C. Como fica o sistema, observando a curva no gráfico?`,
      ...o,
      resolucao: `${fatos} ${sobe ? 'A capacidade aumenta: todo o sal continua dissolvido e ainda cabe mais, a solução fica insaturada.' : `A capacidade diminui: ${fn(dep)} g de sal se separam e a solução fica saturada, com corpo de fundo.`}`,
      dicas: ['Veja se a curva sobe ou desce entre as duas temperaturas.', 'Se a solubilidade aumenta, cabe mais sal; se diminui, sobra sal.', 'O sentido da curva depende do sal: nem todos dissolvem mais a quente.'],
      licao: LICAO,
      dados: { curva: c.id, marcas: [{ T: T1, S: S1, rotulo: `${T1} °C` }, { T: T2, S: S2, rotulo: `${T2} °C` }], agua, T1, T2 },
    }
  }

  // --- cenário 3 (nível 3): supersaturada
  const cenarioSuper = (): InstanciaMulti<DadosSolubilidade> => {
    const c = curva(escolher(rng, ['A', 'C']))
    const [T1, T2] = c.decrescente ? escolher(rng, [[20, 60], [20, 80], [40, 80]] as [number, number][]) : escolher(rng, [[60, 20], [80, 40], [80, 20]] as [number, number][])
    const agua = escolher(rng, AGUAS)
    const S1 = solubilidade(c, T1)
    const S2 = solubilidade(c, T2)
    const excesso = ((S1 - S2) * agua) / 100
    const verbo = T2 > T1 ? 'aquecida' : 'resfriada'
    const modo = rng() < 0.5 ? 'classifica' : 'cristal'
    if (modo === 'classifica') {
      const porque: Record<EstadoFinal, string> = {
        super: `Certo. A ${T2} °C a água só dissolve ${fn((S2 * agua) / 100)} g, mas há ${fn((S1 * agua) / 100)} g dissolvidos: um excesso de ${fn(excesso)} g que "deveria" ter se separado. Como não cristalizou, a solução é supersaturada (instável).`,
        corpo: `Não. O enunciado diz que NÃO há sal sólido: o excesso (${fn(excesso)} g) permaneceu dissolvido. Se houvesse sal no fundo, seria saturada com corpo de fundo.`,
        saturada: `Não. Saturada seria ter exatamente ${fn((S2 * agua) / 100)} g dissolvidos a ${T2} °C. Há ${fn((S1 * agua) / 100)} g, mais do que a água comporta.`,
        insaturada: `Não. Há ${fn((S1 * agua) / 100)} g dissolvidos e a água a ${T2} °C só comporta ${fn((S2 * agua) / 100)} g: está acima da capacidade, não abaixo.`,
      }
      const motivo: Record<EstadoFinal, string> = {
        super: '',
        corpo: 'confundiu supersaturada com saturada com corpo de fundo',
        saturada: 'achou que estava no limite exato da curva',
        insaturada: 'achou que cabe mais sal sem olhar a curva',
      }
      const o = opcoesEstado(rng, 'super', porque, motivo)
      return {
        enunciado: `Uma solução saturada de ${c.nome} contém ${fn(agua, 0)} g de água a ${T1} °C. Ela é ${verbo} com muito cuidado, sem agitar, até ${T2} °C, e nenhum sólido aparece. Como se classifica a solução final?`,
        ...o,
        resolucao: `A ${T1} °C há ${fn((S1 * agua) / 100)} g dissolvidos. A ${T2} °C a água só comporta ${fn((S2 * agua) / 100)} g. O excesso de ${fn(excesso)} g deveria cristalizar, mas não cristalizou: a solução está supersaturada (instável).`,
        dicas: ['Compare o que está dissolvido com o que a curva permite na nova temperatura.', 'Há sólido no fundo?', 'Acima da curva, mas sem sólido, é supersaturada.'],
        licao: LICAO,
        dados: { curva: c.id, marcas: [{ T: T1, S: S1, rotulo: `${T1} °C` }, { T: T2, S: S2, rotulo: `${T2} °C` }], agua, T1, T2 },
      }
    }
    const opcoes = [
      { id: 'A', rotulo: 'Nada acontece: a solução continua igual' },
      { id: 'B', rotulo: `Precipita o excesso (${fn(excesso)} g) e a solução fica saturada` },
      { id: 'C', rotulo: 'O cristal se dissolve e a solução fica insaturada' },
      { id: 'D', rotulo: `Precipita todo o sal dissolvido (${fn((S1 * agua) / 100)} g)` },
    ]
    return {
      enunciado: `Uma solução supersaturada de ${c.nome} (obtida da saturada a ${T1} °C, com ${fn(agua, 0)} g de água, ${verbo} sem agitar até ${T2} °C) recebe um pequeno cristal de ${c.nome}. O que acontece?`,
      opcoes,
      certa: 'B',
      porque: {
        A: 'Não. A supersaturada é instável: um cristal serve de ponto de partida para a cristalização do excesso.',
        B: `Certo. O cristal dispara a cristalização do excesso: a ${T2} °C a água só mantém ${fn((S2 * agua) / 100)} g dissolvidos, e os ${fn(excesso)} g a mais precipitam. O que fica é uma solução saturada com sal no fundo.`,
        C: 'Não. Numa solução supersaturada há mais sal dissolvido do que a água comporta; o cristal não se dissolve, cresce.',
        D: `Não. Só o excesso precipita. A solução continua com ${fn((S2 * agua) / 100)} g dissolvidos, que é o que a água comporta a ${T2} °C.`,
      },
      motivo: { A: 'achou que a supersaturada é estável', C: 'achou que o cristal dissolveria', D: 'achou que todo o sal precipita' },
      resolucao: `A ${T2} °C a água comporta ${fn((S2 * agua) / 100)} g. Há ${fn((S1 * agua) / 100)} g dissolvidos. O cristal desencadeia a saída do excesso: ${fn((S1 * agua) / 100)} − ${fn((S2 * agua) / 100)} = ${fn(excesso)} g precipitam. A solução fica saturada, com corpo de fundo.`,
      dicas: ['Supersaturada = instável: tem mais soluto do que a água comporta.', 'Quanto precipita? Só o que passa da capacidade.', 'Depois de precipitar, a solução volta a ser saturada.'],
      licao: 'Solução supersaturada é instável: um pequeno choque (um cristal, agitação) faz o excesso precipitar até ficar saturada.',
      dados: { curva: c.id, marcas: [{ T: T1, S: S1, rotulo: `${T1} °C` }, { T: T2, S: S2, rotulo: `${T2} °C` }], agua, T1, T2 },
    }
  }

  if (nivel === 1) return cenarioMistura()
  if (nivel === 2) return rng() < 0.5 ? cenarioMistura() : cenarioTemperatura()
  const r = rng()
  return r < 0.34 ? cenarioTemperatura() : cenarioSuper()
}

/* ================================================================== quanto cristaliza */

export interface DadosCristal {
  curva: 'A' | 'B' | 'C'
  variante: 'resfriar' | 'aquecer' | 'solucao' | 'evaporar' | 'resfriar-evaporar'
  T1: number
  T2?: number
  agua: number
  /** massa da solução saturada inicial (g), no enunciado "solucao" */
  massaSolucao?: number
  evaporada?: number
}

/** massas de água dos exercícios de cristalização (100 g tornaria vários erros típicos iguais à resposta) */
const AGUAS_CRISTAL = [200, 250, 400, 500]

export function gerarCristal(rng: Rng, nivel: Nivel): InstanciaNum<DadosCristal> {
  const base = 'Use os valores da curva de solubilidade do gráfico.'
  const variantes: DadosCristal['variante'][] = nivel === 1 ? ['resfriar', 'aquecer'] : nivel === 2 ? ['solucao', 'evaporar'] : ['resfriar-evaporar']
  const variante = escolher(rng, variantes)
  let c: CurvaSol = curva('A')
  let T1 = 0
  let T2: number | undefined
  let agua = 0
  let massaSolucao: number | undefined
  let evaporada: number | undefined
  let resposta: number
  let enunciado: string
  let erros: ErroTipico[]
  let resolucao: string
  let dicas: string[]
  let licao: string

  const sorteia = (cond: () => boolean, gera: () => void) => {
    for (let i = 0; i < 500; i++) {
      gera()
      if (cond()) return
    }
    throw new Error('sem cenário')
  }

  if (variante === 'resfriar' || variante === 'aquecer') {
    c = curva(variante === 'aquecer' ? 'C' : escolher(rng, ['A', 'B']))
    sorteia(
      () => precipitado(c, agua, T1, T2 as number) > 0 && bonito(precipitado(c, agua, T1, T2 as number), 1),
      () => {
        const par = escolher(rng, (variante === 'aquecer' ? [[0, 40], [20, 60], [20, 80], [40, 80], [0, 80]] : [[60, 20], [80, 40], [80, 20], [40, 0], [60, 0], [80, 60]]) as [number, number][])
        T1 = par[0]
        T2 = par[1]
        agua = escolher(rng, AGUAS_CRISTAL)
      },
    )
    const S1 = solubilidade(c, T1)
    const S2 = solubilidade(c, T2 as number)
    resposta = ((Math.abs(S1 - S2)) * agua) / 100
    const verbo = variante === 'aquecer' ? 'aquecida' : 'resfriada'
    enunciado = `Uma solução saturada de ${c.nome}, preparada com ${fn(agua, 0)} g de água a ${T1} °C, é ${verbo} até ${T2} °C. ${base} Que massa de sal se separa da solução, em gramas?`
    erros = [
      { valor: Math.abs(S1 - S2), frase: `${fn(Math.abs(S1 - S2))} g é a diferença por 100 g de água. Aqui há ${fn(agua, 0)} g de água: multiplique por ${fn(agua / 100)}.`, motivo: 'não ajustou para a massa de água' },
      { valor: (S1 * agua) / 100, frase: 'Você deu todo o sal dissolvido na temperatura inicial. Só se separa a diferença entre o que dissolve antes e depois.', motivo: 'deu o sal total, não a diferença' },
      { valor: (S2 * agua) / 100, frase: `Você deu o sal que continua dissolvido a ${T2} °C. O que se separa é a diferença entre as duas capacidades.`, motivo: 'deu o sal que continua dissolvido' },
      { valor: ((S1 + S2) * agua) / 100, frase: 'Você somou as capacidades. Subtraia: separa-se o que passa da nova capacidade.', motivo: 'somou em vez de subtrair' },
    ]
    resolucao = `A ${T1} °C: ${fn(S1)} g/100 g → ${fn((S1 * agua) / 100)} g em ${fn(agua, 0)} g de água. A ${T2} °C: ${fn(S2)} g/100 g → ${fn((S2 * agua) / 100)} g. Separam-se ${fn((S1 * agua) / 100)} − ${fn((S2 * agua) / 100)} = ${fn(resposta)} g.`
    dicas = ['Leia a solubilidade nas duas temperaturas.', 'Ajuste cada uma para a massa de água do enunciado.', 'O que se separa é a diferença.']
    licao = 'Cristais = (solubilidade inicial − solubilidade final) × massa de água ÷ 100.'
  } else if (variante === 'solucao') {
    c = curva(escolher(rng, ['A', 'B']))
    sorteia(
      () => bonito(massaSolucao as number, 1) && bonito(precipitado(c, agua, T1, T2 as number), 1) && precipitado(c, agua, T1, T2 as number) > 0,
      () => {
        const par = escolher(rng, [[60, 20], [80, 40], [80, 20], [60, 40], [40, 20]] as [number, number][])
        T1 = par[0]
        T2 = par[1]
        agua = escolher(rng, AGUAS_CRISTAL)
        massaSolucao = agua + (solubilidade(c, T1) * agua) / 100
      },
    )
    const S1 = solubilidade(c, T1)
    const S2 = solubilidade(c, T2 as number)
    resposta = ((S1 - S2) * agua) / 100
    enunciado = `${fn(massaSolucao as number)} g de uma solução saturada de ${c.nome} a ${T1} °C são resfriados até ${T2} °C. ${base} Que massa de sal cristaliza?`
    erros = [
      { valor: ((S1 - S2) * (massaSolucao as number)) / 100, frase: `Você usou a massa da solução como se fosse a massa de água. A solução tem sal e água: a massa de água é ${fn(agua)} g (${fn(massaSolucao as number)} ÷ ${fn(1 + S1 / 100)}).`, motivo: 'usou a massa da solução como massa de água' },
      { valor: S1 - S2, frase: 'Esse é o valor por 100 g de água. Falta ajustar à massa de água da solução.', motivo: 'não ajustou para a massa de água' },
      { valor: (S2 * agua) / 100, frase: 'Esse é o sal que continua dissolvido a ' + T2 + ' °C. Cristaliza a diferença.', motivo: 'deu o sal que continua dissolvido' },
    ]
    resolucao = `Em ${fn(100 + S1)} g de solução saturada a ${T1} °C há 100 g de água. Então ${fn(massaSolucao as number)} g de solução têm ${fn(agua)} g de água. Cristaliza (${fn(S1)} − ${fn(S2)}) × ${fn(agua)} ÷ 100 = ${fn(resposta)} g.`
    dicas = ['A massa dada é de solução, não de água.', `Cada 100 g de água dissolvem ${fn(S1)} g de sal a ${T1} °C: a solução tem 100 + ${fn(S1)} g.`, 'Ache a massa de água e use a diferença de solubilidades.']
    licao = 'Massa de solução saturada = água + sal dissolvido. Ache primeiro a massa de água.'
  } else if (variante === 'evaporar') {
    c = curva(escolher(rng, ['A', 'B']))
    sorteia(
      () => (evaporada as number) < agua && bonito(precipitadoPorEvaporacao(c, T1, evaporada as number), 1),
      () => {
        T1 = escolher(rng, [20, 40, 60, 80])
        agua = escolher(rng, AGUAS_CRISTAL)
        evaporada = escolher(rng, [20, 40, 50, 150, 200])
      },
    )
    const S1 = solubilidade(c, T1)
    resposta = (S1 * (evaporada as number)) / 100
    enunciado = `Uma solução saturada de ${c.nome} a ${T1} °C, com ${fn(agua, 0)} g de água, perde ${fn(evaporada as number, 0)} g de água por evaporação, mantida a ${T1} °C. ${base} Que massa de sal cristaliza?`
    erros = [
      { valor: (S1 * agua) / 100, frase: 'Você usou toda a água da solução. Só a água que evaporou deixa de dissolver sal.', motivo: 'usou toda a água, não só a que evaporou' },
      { valor: S1, frase: 'Esse é o valor por 100 g de água. A água que evaporou foi diferente de 100 g: ajuste.', motivo: 'não ajustou para a massa evaporada' },
      { valor: (S1 * ((agua as number) - (evaporada as number))) / 100, frase: 'Esse é o sal que continua dissolvido na água que restou. Cristaliza o sal que estava na água evaporada.', motivo: 'deu o sal que continua dissolvido' },
      { valor: evaporada as number, frase: 'Você deu a massa de água que evaporou. O sal que cristaliza é a solubilidade vezes essa massa de água, dividida por 100.', motivo: 'confundiu a água evaporada com o sal que cristaliza' },
    ]
    resolucao = `A ${T1} °C, 100 g de água dissolvem ${fn(S1)} g. A água que evaporou (${fn(evaporada as number, 0)} g) deixa de dissolver ${fn(S1)} × ${fn(evaporada as number, 0)} ÷ 100 = ${fn(resposta)} g, que cristalizam.`
    dicas = ['A temperatura não muda: a solubilidade é a mesma.', 'O sal que cristaliza é o que estava dissolvido na água que evaporou.', 'Use a solubilidade para a massa de água evaporada.']
    licao = 'Evaporando água de uma saturada a T constante, cristaliza o sal que a água evaporada dissolvia: S × massa evaporada ÷ 100.'
  } else {
    c = curva(escolher(rng, ['A', 'B']))
    sorteia(
      () => (evaporada as number) < agua && bonito(((solubilidade(c, T1) * agua) - solubilidade(c, T2 as number) * (agua - (evaporada as number))) / 100, 1),
      () => {
        const par = escolher(rng, [[60, 20], [80, 40], [80, 20], [60, 40], [40, 20]] as [number, number][])
        T1 = par[0]
        T2 = par[1]
        agua = escolher(rng, [200, 250, 400, 500])
        evaporada = escolher(rng, [40, 50, 100, 150])
      },
    )
    const S1 = solubilidade(c, T1)
    const S2 = solubilidade(c, T2 as number)
    const ev = evaporada as number
    resposta = (S1 * agua - S2 * (agua - ev)) / 100
    enunciado = `Uma solução saturada de ${c.nome} com ${fn(agua, 0)} g de água a ${T1} °C perde ${fn(ev, 0)} g de água por evaporação e, ao mesmo tempo, é resfriada até ${T2} °C. ${base} Que massa de sal cristaliza no total?`
    erros = [
      { valor: ((S1 - S2) * agua) / 100, frase: 'Você considerou só o resfriamento. A água que evaporou também deixa de dissolver sal.', motivo: 'ignorou a evaporação' },
      { valor: (S2 * ev) / 100, frase: 'Você considerou só a evaporação. Também há o efeito do resfriamento sobre a água restante.', motivo: 'ignorou o resfriamento' },
      { valor: ((S1 - S2) * (agua - ev)) / 100, frase: 'Você usou a água que restou nos dois lados. No início a água era toda a água do enunciado; só no final ela diminuiu.', motivo: 'usou a massa de água final nas duas temperaturas' },
    ]
    resolucao = `Sal dissolvido no início: ${fn(S1)} × ${fn(agua, 0)} ÷ 100 = ${fn((S1 * agua) / 100)} g. No final restam ${fn(agua - ev, 0)} g de água a ${T2} °C, que dissolvem ${fn(S2)} × ${fn(agua - ev, 0)} ÷ 100 = ${fn((S2 * (agua - ev)) / 100)} g. Cristalizam ${fn((S1 * agua) / 100)} − ${fn((S2 * (agua - ev)) / 100)} = ${fn(resposta)} g.`
    dicas = ['Sal dissolvido antes − sal que ainda cabe depois.', 'Depois, a água é menor (evaporou) e a temperatura é outra.', 'Faça duas contas de capacidade e subtraia.']
    licao = 'Quando muda a temperatura e a massa de água, compare a capacidade inicial com a final: (S₁·m₁ − S₂·m₂) ÷ 100.'
  }
  const tol = 0.05
  return {
    enunciado,
    resposta,
    tolerancia: tol,
    unidade: 'g',
    erros: limpar(erros, resposta, tol),
    resolucao,
    dicas,
    licao,
    dados: { curva: c.id, variante, T1, T2, agua, massaSolucao, evaporada },
  }
}

