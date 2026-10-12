import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, type Rng } from '@/lib/rng'
import { massaMolar } from '../comum/elementos'
import { formulaTexto } from '../comum/Formula'
import {
  COMBUSTIVEIS,
  co2PorGrama,
  co2PorMol,
  economiaAtomica,
  fatorE,
  h2so4DeEnxofre,
  massaDesejada,
  massaReagentes,
  reacaoVerde,
  so2DeEnxofre,
  type Combustivel,
  type ReacaoVerde,
} from './calculo'

const fn = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const bonito = (x: number, casas = 1) => Math.abs(x * 10 ** casas - Math.round(x * 10 ** casas)) < 1e-9
const ft = formulaTexto

function limpar(erros: ErroTipico[], resposta: number, tol: number): ErroTipico[] {
  const saida: ErroTipico[] = []
  for (const e of erros) {
    if (!Number.isFinite(e.valor) || e.valor < 0) continue
    if (Math.abs(e.valor - resposta) <= 2 * tol) continue
    if (saida.some((x) => Math.abs(x.valor - e.valor) <= tol)) continue
    saida.push(e)
  }
  return saida
}

/* ================================================================== emissões na combustão */

export interface DadosEmissao {
  variante: 'mol' | 'massa' | 'so2' | 'mj' | 'h2so4'
  combustivel?: string
  /** quantidade dada: mol, kg de combustível ou kg de carvão */
  quantidade: number
  /** teor de enxofre do carvão (%) */
  enxofre?: number
}

export function gerarEmissao(rng: Rng, nivel: Nivel): InstanciaNum<DadosEmissao> {
  const nomeEq = (c: Combustivel) => `${c.coefs[0] === 1 ? '' : c.coefs[0]}${ft(c.formula)} + ${c.coefs[1]} O₂ → ${c.coefs[2]} CO₂ + ${c.coefs[3]} H₂O`
  const erroCoef = (c: Combustivel) => c.coefs
  if (nivel === 1) {
    // metano forma 1 mol de CO₂ por mol, o que tornaria vários erros típicos iguais à resposta
    const c = escolher(rng, COMBUSTIVEIS.filter((x) => x.id !== 'metano'))
    const X = escolher(rng, [0.5, 1, 2, 3, 4, 5, 10])
    const resposta = X * co2PorMol(c)
    const [a, b, p, q] = erroCoef(c)
    return {
      enunciado: `A combustão completa do ${c.nome.split(' (')[0]} (${ft(c.formula)}) é representada por ${nomeEq(c)}. Quantos mol de CO₂ são liberados na queima completa de ${fn(X)} mol de ${ft(c.formula)}?`,
      resposta,
      tolerancia: 0.02,
      unidade: 'mol',
      erros: limpar(
        [
          { valor: X, frase: `Você supôs 1 mol de CO₂ para cada mol de combustível. A equação diz que ${a === 1 ? '1' : a} mol de ${ft(c.formula)} formam ${p} mol de CO₂.`, motivo: 'ignorou a proporção dos coeficientes' },
          { valor: (X * q) / a, frase: `${fn((X * q) / a)} mol é a quantidade de H₂O formada, não de CO₂.`, motivo: 'deu a quantidade de água' },
          { valor: (X * b) / a, frase: `${fn((X * b) / a)} mol é o oxigênio consumido, não o CO₂ formado.`, motivo: 'deu o oxigênio consumido' },
          { valor: (X * a) / p, frase: 'Você inverteu a razão dos coeficientes: o CO₂ está no numerador.', motivo: 'inverteu a razão dos coeficientes' },
        ],
        resposta,
        0.02,
      ),
      resolucao: `Proporção: ${a} ${ft(c.formula)} : ${p} CO₂. Para ${fn(X)} mol de combustível: ${fn(X)} × ${p} ÷ ${a} = ${fn(resposta)} mol de CO₂.`,
      dicas: ['Os coeficientes da equação dão a proporção em mols.', `Compare o coeficiente do ${ft(c.formula)} com o do CO₂.`, 'Multiplique o número de mols dado pela razão dos coeficientes.'],
      licao: 'Na combustão completa, todo o carbono do combustível vira CO₂: mol de CO₂ = mol de combustível × (coeficiente do CO₂ ÷ coeficiente do combustível).',
      dados: { variante: 'mol', combustivel: c.id, quantidade: X },
    }
  }
  if (nivel === 2) {
    if (rng() < 0.4) {
      const pct = escolher(rng, [1, 2, 3, 4, 5])
      const t = escolher(rng, [500, 1000, 2000, 4000])
      const massaS = (t * pct) / 100
      const resposta = so2DeEnxofre(massaS)
      return {
        enunciado: `Uma usina queima ${fn(t, 0)} kg de carvão que contém ${pct} % de enxofre em massa. Todo o enxofre queima, S + O₂ → SO₂. Qual é a massa de SO₂, em kg, lançada na atmosfera? (S = 32; O = 16)`,
        resposta,
        tolerancia: 0.1,
        unidade: 'kg',
        erros: limpar(
          [
            { valor: massaS, frase: `${fn(massaS)} kg é a massa de enxofre. O SO₂ inclui também o oxigênio do ar: 1 mol de S (32 g) forma 1 mol de SO₂ (64 g).`, motivo: 'deu a massa de enxofre, sem o oxigênio' },
            { valor: t, frase: 'Você usou a massa total do carvão, mas só o enxofre (a porcentagem dada) forma SO₂.', motivo: 'usou a massa total do carvão' },
            { valor: massaS * (98 / 32), frase: 'Essa seria a massa de H₂SO₄ que poderia se formar depois. A pergunta é sobre o SO₂ (64 g/mol).', motivo: 'deu a massa de H₂SO₄' },
            { valor: (massaS * 32) / 64, frase: 'Você inverteu a razão das massas molares. O SO₂ tem mais massa que o S (64 > 32).', motivo: 'inverteu a razão das massas molares' },
          ],
          resposta,
          0.1,
        ),
        resolucao: `Massa de S: ${fn(t, 0)} kg × ${pct} % = ${fn(massaS)} kg. S + O₂ → SO₂: 32 g de S formam 64 g de SO₂, então ${fn(massaS)} × 64 ÷ 32 = ${fn(resposta)} kg.`,
        dicas: ['Primeiro ache a massa de enxofre no carvão.', '1 mol de S forma 1 mol de SO₂.', 'Massas molares: S = 32 g/mol e SO₂ = 64 g/mol.'],
        licao: 'Só o enxofre (a parte indicada pela porcentagem) forma SO₂, na proporção 1 mol : 1 mol, ou 32 g : 64 g. Esse gás é o precursor da chuva ácida.',
        dados: { variante: 'so2', quantidade: t, enxofre: pct },
      }
    }
    const opcoes: { c: Combustivel; M: number }[] = []
    for (const c of COMBUSTIVEIS) for (let k = 5; k <= 600; k++) {
      const M = k / 10
      if (bonito(M * co2PorGrama(c), 1)) opcoes.push({ c, M })
    }
    const { c, M } = escolher(rng, opcoes)
    const resposta = M * co2PorGrama(c)
    const MMc = massaMolar(c.formula)
    const [a, , p, q] = c.coefs
    return {
      enunciado: `Um veículo queima ${fn(M)} kg de ${c.nome.split(' (')[0]} (${ft(c.formula)}, massa molar ${fn(MMc)} g/mol) em combustão completa: ${nomeEq(c)}. Qual é a massa de CO₂ lançada, em kg? (C = 12; O = 16)`,
      resposta,
      tolerancia: 0.1,
      unidade: 'kg',
      erros: limpar(
        [
          { valor: M, frase: 'Você supôs que 1 kg de combustível forma 1 kg de CO₂. As massas só seguem a proporção em mols: converta pela massa molar.', motivo: 'supôs proporção 1:1 em massa' },
          { valor: (M * (p / a) * 1000) / MMc, frase: `${fn((M * (p / a) * 1000) / MMc)} é o número de mols de CO₂ (em mol, de ${fn(M)} kg = ${fn(M * 1000)} g). Falta converter em massa: × 44 g/mol.`, motivo: 'parou em mols, sem converter para massa' },
          { valor: (M * q * 18) / (a * MMc), frase: 'Essa é a massa de água formada, não de CO₂.', motivo: 'deu a massa de água' },
          { valor: (M * a * 44) / (p * MMc), frase: 'Você inverteu a razão dos coeficientes (CO₂ vai no numerador).', motivo: 'inverteu a razão dos coeficientes' },
        ],
        resposta,
        0.1,
      ),
      resolucao: `Mols de combustível: ${fn(M * 1000)} g ÷ ${fn(MMc)} g/mol = ${fn((M * 1000) / MMc, 3)} mol. Proporção ${a} : ${p}, então mols de CO₂ = ${fn(((M * 1000) / MMc) * (p / a), 3)}. Massa: × 44 g/mol = ${fn(resposta * 1000, 1)} g = ${fn(resposta)} kg.`,
      dicas: ['Converta a massa de combustível em mols com a massa molar.', 'Use os coeficientes da equação para achar os mols de CO₂.', 'Converta de volta para massa (44 g/mol).'],
      licao: 'Massa → mol (÷ massa molar) → proporção da equação → massa (× massa molar). Todo o carbono do combustível termina como CO₂.',
      dados: { variante: 'massa', combustivel: c.id, quantidade: M },
    }
  }
  // nível 3
  if (rng() < 0.5) {
    const c = escolher(rng, COMBUSTIVEIS)
    const resposta = (co2PorMol(c) * 44) / (c.entalpia / 1000)
    const [a, , p] = c.coefs
    return {
      enunciado: `A combustão completa do ${c.nome.split(' (')[0]} (${ft(c.formula)}) é ${nomeEq(c)} e libera ${fn(c.entalpia, 0)} kJ por mol de ${ft(c.formula)}. Qual é a massa de CO₂, em gramas, emitida por megajoule (MJ) de energia liberada? (C = 12; O = 16; 1 MJ = 1000 kJ)`,
      resposta,
      tolerancia: 0.3,
      unidade: 'g/MJ',
      erros: limpar(
        [
          { valor: resposta / 1000, frase: 'Você deu a massa por kJ. A pergunta é por MJ (1 MJ = 1000 kJ).', motivo: 'deu por kJ em vez de por MJ' },
          { valor: co2PorMol(c) * 44, frase: `${fn(co2PorMol(c) * 44)} g é a massa de CO₂ por mol de combustível queimado. Falta dividir pela energia liberada por esse mol (${fn(c.entalpia / 1000, 3)} MJ).`, motivo: 'deu por mol de combustível, sem dividir pela energia' },
          { valor: (p * 44) / (c.entalpia / 1000), frase: `Você usou o coeficiente ${p} do CO₂ sem dividir pelo coeficiente do combustível (${a}). A energia dada é por mol de ${ft(c.formula)}.`, motivo: 'não dividiu pelo coeficiente do combustível' },
          { valor: (c.entalpia / 1000) / (co2PorMol(c) * 44), frase: 'Você inverteu a razão: é massa de CO₂ ÷ energia.', motivo: 'inverteu massa e energia' },
        ],
        resposta,
        0.3,
      ),
      resolucao: `Por mol de ${ft(c.formula)}: ${fn(co2PorMol(c))} mol de CO₂ = ${fn(co2PorMol(c) * 44)} g, com ${fn(c.entalpia, 0)} kJ = ${fn(c.entalpia / 1000, 3)} MJ. Razão: ${fn(co2PorMol(c) * 44)} ÷ ${fn(c.entalpia / 1000, 3)} = ${fn(resposta, 1)} g de CO₂ por MJ.`,
      dicas: ['Ache a massa de CO₂ formada por 1 mol de combustível.', 'Passe os kJ para MJ.', 'Divida: massa de CO₂ ÷ energia (MJ).'],
      licao: 'Para comparar combustíveis, use a emissão por energia (g de CO₂/MJ): massa de CO₂ por mol ÷ energia liberada por mol.',
      dados: { variante: 'mj', combustivel: c.id, quantidade: 1 },
    }
  }
  const pct = escolher(rng, [1, 2, 3, 4, 5])
  const t = escolher(rng, [1000, 2000, 4000])
  const massaS = (t * pct) / 100
  const resposta = h2so4DeEnxofre(massaS)
  return {
    enunciado: `Um carvão tem ${pct} % de enxofre em massa. Ao queimar ${fn(t, 0)} kg dele, todo o enxofre vira SO₂, que na atmosfera se oxida a SO₃ e reage com água: SO₃ + H₂O → H₂SO₄. Admitindo que todo o enxofre chegue a H₂SO₄, que massa desse ácido, em kg, pode se formar? (H = 1; O = 16; S = 32)`,
    resposta,
    tolerancia: 0.15,
    unidade: 'kg',
    erros: limpar(
      [
        { valor: massaS, frase: 'Essa é a massa de enxofre. 1 mol de S (32 g) forma 1 mol de H₂SO₄ (98 g).', motivo: 'deu a massa de enxofre' },
        { valor: so2DeEnxofre(massaS), frase: `${fn(so2DeEnxofre(massaS))} kg é a massa de SO₂, o primeiro produto da cadeia. Falta chegar ao H₂SO₄ (98 g/mol).`, motivo: 'parou no SO₂' },
        { valor: (massaS * 98) / 64, frase: 'Você partiu da massa molar do SO₂ (64) em vez da do enxofre (32). A massa de S é a que foi calculada a partir da porcentagem.', motivo: 'usou a massa molar do SO₂ no lugar da do S' },
        { valor: (t * 98) / 32, frase: 'Você usou a massa de todo o carvão. Só o enxofre (a porcentagem dada) forma o ácido.', motivo: 'usou a massa total do carvão' },
      ],
      resposta,
      0.15,
    ),
    resolucao: `Massa de S: ${fn(t, 0)} × ${pct} % = ${fn(massaS)} kg. Cada mol de S leva a 1 mol de H₂SO₄ (S → SO₂ → SO₃ → H₂SO₄): 32 g de S ⇒ 98 g de ácido. Massa = ${fn(massaS)} × 98 ÷ 32 = ${fn(resposta, 2)} kg.`,
    dicas: ['O enxofre se conserva ao longo da cadeia: 1 mol de S dá 1 mol de H₂SO₄.', 'Ache a massa de S pela porcentagem.', 'Massas molares: S = 32 g/mol; H₂SO₄ = 98 g/mol.'],
    licao: 'Ao longo de S → SO₂ → SO₃ → H₂SO₄ o número de mols de enxofre se conserva: 1 mol de S origina 1 mol de H₂SO₄ (32 g ⇒ 98 g).',
    dados: { variante: 'h2so4', quantidade: t, enxofre: pct },
  }
}

/* ================================================================== poluentes e processos */

interface ItemPoluentes {
  nivel: Nivel
  pergunta: string
  certa: { texto: string; porque: string }
  erradas: { texto: string; porque: string; motivo: string }[]
  licao: string
}

export const ITENS_POLUENTES: ItemPoluentes[] = [
  {
    nivel: 1,
    pergunta: 'Qual gás, liberado principalmente pela queima de combustíveis fósseis, mais contribui para o aumento do efeito estufa?',
    certa: { texto: 'Dióxido de carbono (CO₂)', porque: 'O CO₂ absorve radiação infravermelha e é liberado em grande quantidade pela queima de carvão, petróleo e gás.' },
    erradas: [
      { texto: 'Oxigênio (O₂)', porque: 'O oxigênio do ar não absorve de forma significativa a radiação infravermelha e não é o gás emitido pela queima.', motivo: 'confundiu o gás consumido com o gás emitido' },
      { texto: 'Nitrogênio (N₂)', porque: 'O N₂ é o gás mais abundante do ar, mas não é gás de efeito estufa.', motivo: 'achou que o gás mais abundante é o do efeito estufa' },
      { texto: 'Argônio (Ar)', porque: 'O argônio é um gás nobre, inerte, e não absorve radiação infravermelha de modo relevante.', motivo: 'escolheu um gás nobre' },
    ],
    licao: 'O CO₂, emitido na combustão de combustíveis fósseis, é o principal gás do aumento do efeito estufa.',
  },
  {
    nivel: 1,
    pergunta: 'Quais substâncias, emitidas por indústrias e veículos, são as principais responsáveis pela chuva ácida?',
    certa: { texto: 'Óxidos de enxofre (SO₂, SO₃) e óxidos de nitrogênio (NOₓ)', porque: 'Eles reagem com a água da atmosfera e formam ácido sulfúrico, ácido sulfuroso e ácido nítrico.' },
    erradas: [
      { texto: 'Clorofluorcarbonetos (CFCs)', porque: 'Os CFCs destroem a camada de ozônio, mas não são os principais responsáveis pela chuva ácida.', motivo: 'confundiu chuva ácida com destruição do ozônio' },
      { texto: 'Metano (CH₄) apenas', porque: 'O metano é um gás de efeito estufa, e não forma ácidos fortes ao reagir com a água.', motivo: 'confundiu chuva ácida com efeito estufa' },
      { texto: 'Gás hélio e argônio', porque: 'São gases nobres, inertes, que não reagem com a água.', motivo: 'escolheu gases inertes' },
    ],
    licao: 'Chuva ácida: SO₂/SO₃ e NOₓ (de queima de combustíveis com enxofre e de motores) formam ácidos ao reagir com a água.',
  },
  {
    nivel: 1,
    pergunta: 'Por que os clorofluorcarbonetos (CFCs) preocupam os ambientalistas?',
    certa: { texto: 'Liberam átomos de cloro na estratosfera, que destroem o ozônio', porque: 'A radiação ultravioleta quebra o CFC e libera cloro, que catalisa a destruição das moléculas de O₃.' },
    erradas: [
      { texto: 'Aumentam muito a acidez da chuva', porque: 'O aumento da acidez da chuva vem de SO₂ e NOₓ, não dos CFCs.', motivo: 'confundiu CFC com chuva ácida' },
      { texto: 'Causam a eutrofização dos lagos', porque: 'A eutrofização vem do excesso de nitrogênio e fósforo.', motivo: 'confundiu CFC com eutrofização' },
      { texto: 'São a principal fonte de oxigênio da atmosfera', porque: 'O oxigênio do ar vem principalmente da fotossíntese.', motivo: 'inventou uma função para o CFC' },
    ],
    licao: 'CFCs levam cloro à estratosfera, onde ele destrói ozônio. O Protocolo de Montreal (1987) mandou eliminar seu uso.',
  },
  {
    nivel: 1,
    pergunta: 'A água da chuva sem poluentes tem pH em torno de 5,6 e não 7. Por quê?',
    certa: { texto: 'Dissolve o CO₂ do ar, formando ácido carbônico (H₂CO₃)', porque: 'CO₂ + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻: um ácido fraco que deixa a chuva levemente ácida mesmo sem poluição.' },
    erradas: [
      { texto: 'Dissolve sais de sódio do mar', porque: 'Sais como o NaCl não alteram o pH de modo ácido.', motivo: 'achou que sais deixam a chuva ácida' },
      { texto: 'A água pura sempre tem pH 5,6', porque: 'A água pura a 25 °C tem pH 7. O pH 5,6 aparece quando ela dissolve CO₂.', motivo: 'achou que a água pura tem pH 5,6' },
      { texto: 'Reage com o oxigênio do ar e forma ácido', porque: 'O oxigênio não forma ácido com a água. A acidez natural vem do CO₂.', motivo: 'atribuiu a acidez ao oxigênio' },
    ],
    licao: 'A chuva natural é levemente ácida (pH ≈ 5,6) por causa do CO₂ dissolvido. Chuva ácida é a de pH abaixo disso, por SO₂ e NOₓ.',
  },
  {
    nivel: 1,
    pergunta: 'A eutrofização de lagos e rios é causada principalmente por:',
    certa: { texto: 'excesso de nutrientes (nitrogênio e fósforo) vindos de esgoto e fertilizantes', porque: 'Os nutrientes fazem as algas proliferarem; ao morrer, elas são decompostas e consomem oxigênio.' },
    erradas: [
      { texto: 'excesso de oxigênio dissolvido', porque: 'Na eutrofização o oxigênio dissolvido cai, não aumenta.', motivo: 'inverteu o efeito sobre o oxigênio' },
      { texto: 'aumento da acidez da chuva', porque: 'A chuva ácida é outro problema, com outras causas.', motivo: 'confundiu eutrofização com chuva ácida' },
      { texto: 'falta de nutrientes na água', porque: 'É o excesso de nutrientes que causa a proliferação das algas.', motivo: 'inverteu a causa' },
    ],
    licao: 'Eutrofização: excesso de N e P → proliferação de algas → decomposição consome O₂ → morte de peixes.',
  },
  {
    nivel: 1,
    pergunta: 'O monóxido de carbono (CO), formado na combustão incompleta, é perigoso porque:',
    certa: { texto: 'se liga à hemoglobina e impede o transporte de oxigênio no sangue', porque: 'O CO se liga à hemoglobina com muito mais força que o O₂ e causa asfixia química.' },
    erradas: [
      { texto: 'forma a chuva ácida', porque: 'A chuva ácida vem de SO₂ e NOₓ, não do CO.', motivo: 'confundiu CO com gases da chuva ácida' },
      { texto: 'destrói a camada de ozônio', porque: 'A destruição do ozônio vem do cloro (CFCs), não do CO.', motivo: 'confundiu CO com CFC' },
      { texto: 'é o principal gás do efeito estufa', porque: 'O principal gás do aumento do efeito estufa é o CO₂. O CO é tóxico por outro mecanismo.', motivo: 'confundiu CO com CO₂' },
    ],
    licao: 'CO (combustão incompleta) é tóxico por competir com o O₂ pela hemoglobina; CO₂ (combustão completa) é o gás do efeito estufa.',
  },
  {
    nivel: 2,
    pergunta: 'Qual equação representa a formação do ácido sulfúrico na chuva ácida a partir do trióxido de enxofre?',
    certa: { texto: 'SO₃ + H₂O → H₂SO₄', porque: 'O SO₃ reage com a água e forma H₂SO₄, o ácido sulfúrico, um ácido forte.' },
    erradas: [
      { texto: 'SO₂ + H₂O → H₂SO₄', porque: 'O SO₂ com água forma o ácido sulfuroso (H₂SO₃). O H₂SO₄ vem do SO₃.', motivo: 'confundiu SO₂ com SO₃' },
      { texto: 'SO₃ + 2 H₂O → H₂SO₃', porque: 'Essa equação não conserva os átomos e H₂SO₃ é o ácido sulfuroso, que vem do SO₂.', motivo: 'errou a fórmula do ácido formado' },
      { texto: 'S + H₂O → H₂SO₄', porque: 'Essa equação não está balanceada nem representa o processo: o enxofre primeiro queima a SO₂, que se oxida a SO₃.', motivo: 'ignorou as etapas de oxidação' },
    ],
    licao: 'S + O₂ → SO₂; 2 SO₂ + O₂ → 2 SO₃; SO₃ + H₂O → H₂SO₄. Já SO₂ + H₂O ⇌ H₂SO₃ (ácido sulfuroso).',
  },
  {
    nivel: 2,
    pergunta: 'Nos motores de combustão, os óxidos de nitrogênio (NOₓ) se formam porque:',
    certa: { texto: 'em temperatura muito alta, o N₂ e o O₂ do ar reagem: N₂ + O₂ → 2 NO', porque: 'A alta temperatura da combustão fornece a energia de ativação para o N₂ e o O₂ do ar reagirem. O NO se oxida a NO₂.' },
    erradas: [
      { texto: 'a gasolina é feita de nitrogênio puro', porque: 'A gasolina é uma mistura de hidrocarbonetos; o nitrogênio vem principalmente do ar.', motivo: 'achou que o nitrogênio vem do combustível' },
      { texto: 'o catalisador do escapamento produz NO', porque: 'O catalisador do escapamento REDUZ os NOₓ, convertendo-os em N₂.', motivo: 'inverteu o papel do catalisador' },
      { texto: 'o ozônio reage com a água dentro do motor', porque: 'Não há ozônio relevante dentro do motor, e essa reação não forma NOₓ.', motivo: 'inventou uma reação' },
    ],
    licao: 'NOₓ de motores vêm do ar: a alta temperatura da combustão faz N₂ + O₂ → 2 NO, depois 2 NO + O₂ → 2 NO₂. Contribuem para a chuva ácida.',
  },
  {
    nivel: 2,
    pergunta: 'O efeito estufa natural é importante para a vida porque:',
    certa: { texto: 'sem ele a temperatura média do planeta seria cerca de −18 °C, em vez de aproximadamente 15 °C', porque: 'Gases como o vapor de água e o CO₂ retêm parte da radiação infravermelha e mantêm a superfície mais quente.' },
    erradas: [
      { texto: 'ele destrói o ozônio e deixa passar luz', porque: 'O efeito estufa é a retenção de radiação infravermelha, e não tem relação com a destruição do ozônio.', motivo: 'confundiu efeito estufa com destruição do ozônio' },
      { texto: 'ele é causado só pela atividade humana', porque: 'O efeito estufa natural existe há muito tempo. O que a atividade humana faz é intensificá-lo.', motivo: 'achou que o efeito estufa é só humano' },
      { texto: 'ele impede que a luz do Sol chegue à superfície', porque: 'A luz solar chega à superfície; os gases retêm a radiação infravermelha que a Terra emite.', motivo: 'inverteu o mecanismo' },
    ],
    licao: 'O efeito estufa natural mantém a Terra habitável (≈ 15 °C em vez de ≈ −18 °C). O problema é a intensificação por mais CO₂, CH₄ e N₂O.',
  },
  {
    nivel: 2,
    pergunta: 'Por que estátuas de mármore (CaCO₃) se deterioram com a chuva ácida?',
    certa: { texto: 'O ácido reage com o carbonato de cálcio e forma um sal, água e CO₂', porque: 'Por exemplo, CaCO₃ + H₂SO₄ → CaSO₄ + H₂O + CO₂: o mármore é consumido aos poucos.' },
    erradas: [
      { texto: 'O mármore é um metal e sofre oxidação', porque: 'O mármore é carbonato de cálcio, e o ataque é por reação ácido-base, não oxidação de um metal.', motivo: 'achou que o mármore é metal' },
      { texto: 'O ácido forma uma camada de carbonato que protege a pedra', porque: 'Na reação o carbonato é consumido, e não formado.', motivo: 'inverteu o resultado da reação' },
      { texto: 'A chuva ácida só esquenta a pedra e a faz dilatar', porque: 'O efeito principal é químico: o ácido reage com o CaCO₃.', motivo: 'atribuiu o dano a efeito térmico' },
    ],
    licao: 'Carbonatos reagem com ácidos liberando CO₂: por isso a chuva ácida corrói mármore, calcário e esculturas.',
  },
  {
    nivel: 2,
    pergunta: 'Na eutrofização, os peixes morrem principalmente porque:',
    certa: { texto: 'a decomposição das algas mortas consome o oxigênio dissolvido da água', porque: 'Com a proliferação de algas e a morte delas, as bactérias decompositoras consomem o O₂ e a água fica sem oxigênio.' },
    erradas: [
      { texto: 'as algas liberam gás cloro na água', porque: 'As algas não liberam cloro. O problema é a falta de oxigênio dissolvido.', motivo: 'inventou uma toxina' },
      { texto: 'o excesso de oxigênio faz as brânquias queimarem', porque: 'Na eutrofização falta oxigênio, não sobra.', motivo: 'inverteu o efeito sobre o oxigênio' },
      { texto: 'a água fica sem nutrientes', porque: 'A água fica com excesso de nutrientes, e esse é o ponto de partida do problema.', motivo: 'inverteu a causa' },
    ],
    licao: 'Eutrofização: excesso de nutrientes → algas → decomposição → consumo de O₂ → morte de organismos aeróbicos.',
  },
  {
    nivel: 2,
    pergunta: 'Os catalisadores dos escapamentos dos carros reduzem a poluição porque:',
    certa: { texto: 'aceleram reações que transformam CO, NOₓ e hidrocarbonetos em CO₂, N₂ e H₂O', porque: 'São catalisadores de metais como platina e ródio: o CO é oxidado, os NOₓ são reduzidos a N₂ e os hidrocarbonetos são queimados.' },
    erradas: [
      { texto: 'retêm todo o CO₂ emitido', porque: 'O catalisador não retém CO₂; ele até forma CO₂ ao oxidar o CO.', motivo: 'achou que o catalisador retém CO₂' },
      { texto: 'aumentam a emissão de NOₓ', porque: 'O objetivo é reduzir os NOₓ, convertendo-os em N₂.', motivo: 'inverteu o objetivo' },
      { texto: 'transformam o CO₂ em oxigênio puro', porque: 'Essa transformação exigiria muita energia e não ocorre no escapamento.', motivo: 'inventou uma reação' },
    ],
    licao: 'O conversor catalítico transforma gases tóxicos (CO, NOₓ, hidrocarbonetos) em CO₂, N₂ e H₂O.',
  },
  {
    nivel: 3,
    pergunta: 'Uma amostra de chuva tem pH 4,6. Em relação à chuva natural (pH 5,6), a concentração de H⁺ é:',
    certa: { texto: '10 vezes maior', porque: 'Uma unidade de pH corresponde a um fator 10 na concentração de H⁺, e pH menor significa mais H⁺.' },
    erradas: [
      { texto: '10 vezes menor', porque: 'pH menor significa MAIS H⁺, não menos.', motivo: 'inverteu o sentido do pH' },
      { texto: '1 mol/L maior', porque: 'A diferença de pH é logarítmica: é um fator 10 na concentração, não uma soma de 1 mol/L.', motivo: 'tratou o pH como escala linear' },
      { texto: 'a mesma, pois a diferença é pequena', porque: 'Uma unidade de pH é um fator 10 na concentração de H⁺, o que é grande.', motivo: 'subestimou a escala logarítmica' },
    ],
    licao: 'pH = −log [H⁺]: cada unidade a menos multiplica [H⁺] por 10. Chuva de pH 4,6 tem 10 vezes mais H⁺ que a de pH 5,6.',
  },
  {
    nivel: 3,
    pergunta: 'O etanol de cana-de-açúcar costuma ser apontado como combustível de menor emissão líquida de CO₂ que a gasolina. O argumento é que:',
    certa: { texto: 'o CO₂ liberado na queima foi retirado da atmosfera pela cana durante o crescimento (ciclo do carbono curto), embora cultivo e transporte também emitam', porque: 'O carbono do etanol veio do CO₂ atmosférico recente, ao contrário do carbono fóssil, que estava retido há milhões de anos. A emissão líquida diminui, mas não é zero.' },
    erradas: [
      { texto: 'a queima do etanol não produz CO₂', porque: 'O etanol (C₂H₅OH) tem carbono e, na combustão completa, forma CO₂ e H₂O.', motivo: 'achou que o etanol não emite CO₂' },
      { texto: 'o etanol não contém carbono', porque: 'O etanol é um composto orgânico: tem 2 átomos de carbono por molécula.', motivo: 'achou que o etanol não tem carbono' },
      { texto: 'o etanol libera mais CO₂ por energia, mas isso é irrelevante', porque: 'A comparação em questão é a do balanço de carbono, e o argumento correto é o ciclo curto do carbono.', motivo: 'ignorou o balanço de carbono' },
    ],
    licao: 'Biocombustíveis têm balanço de carbono menor porque o CO₂ emitido foi captado pela planta, mas cultivo, processamento e transporte ainda emitem gases de efeito estufa.',
  },
  {
    nivel: 3,
    pergunta: 'Por que a queima do gás natural (CH₄) emite menos CO₂ por energia liberada do que a da gasolina (representada pelo octano, C₈H₁₈)?',
    certa: { texto: 'o metano tem proporção maior de hidrogênio em relação ao carbono, e a combustão do hidrogênio libera energia sem formar CO₂', porque: 'No CH₄ há 4 H por C, e no C₈H₁₈ há 2,25 H por C. Cada H queimado forma H₂O e libera energia sem produzir CO₂.' },
    erradas: [
      { texto: 'o metano não contém carbono', porque: 'O CH₄ tem 1 carbono por molécula e forma CO₂ na combustão completa.', motivo: 'achou que o metano não tem carbono' },
      { texto: 'o metano forma CO em vez de CO₂ e por isso não conta', porque: 'Na combustão completa o produto é CO₂. O CO aparece na combustão incompleta.', motivo: 'confundiu combustão completa com incompleta' },
      { texto: 'o metano não queima, apenas se evapora', porque: 'O metano queima e libera energia (cerca de 890 kJ/mol).', motivo: 'achou que o metano não queima' },
    ],
    licao: 'Quanto maior a razão H/C do combustível, menos CO₂ por energia: CH₄ (H/C = 4) emite menos CO₂ por MJ que C₈H₁₈ (H/C = 2,25).',
  },
  {
    nivel: 3,
    pergunta: 'Aumentar a altura das chaminés de uma usina a carvão para "dispersar" os gases resolve o problema da chuva ácida?',
    certa: { texto: 'Não: dispersa o SO₂ e o NOₓ, mas não os elimina, e eles podem cair como chuva ácida em regiões distantes', porque: 'A quantidade emitida continua a mesma; só muda onde ocorre a deposição. Soluções reais reduzem a emissão (filtros, combustível sem enxofre, fontes renováveis).' },
    erradas: [
      { texto: 'Sim: gases altos desaparecem da atmosfera', porque: 'Os gases não desaparecem; eles são transportados pelo vento e reagem na atmosfera.', motivo: 'achou que os gases somem em altitude' },
      { texto: 'Sim: no alto os óxidos viram oxigênio puro', porque: 'Os óxidos de enxofre e de nitrogênio não se transformam em O₂; eles formam ácidos.', motivo: 'inventou uma reação' },
      { texto: 'Sim: as chaminés altas produzem catalisadores', porque: 'Chaminés não produzem catalisadores; elas só lançam os gases mais alto.', motivo: 'inventou uma função para a chaminé' },
    ],
    licao: 'Dispersar não é remover: reduzir a chuva ácida exige cortar as emissões (dessulfurização, combustíveis com menos enxofre, fontes renováveis).',
  },
  {
    nivel: 3,
    pergunta: 'O ozônio (O₃) é considerado benéfico na estratosfera e poluente perto do solo. Isso acontece porque:',
    certa: { texto: 'na estratosfera ele absorve a radiação ultravioleta nociva; perto do solo, formado a partir de poluentes e luz, irrita as vias respiratórias', porque: 'A camada de ozônio protege contra o UV; já o ozônio troposférico, componente do smog fotoquímico, é prejudicial a quem respira.' },
    erradas: [
      { texto: 'na estratosfera ele aquece o planeta; no solo, ele o esfria', porque: 'O papel benéfico na estratosfera é absorver o UV. Em ambas as altitudes o ozônio é o mesmo gás, com efeitos diferentes sobre a saúde.', motivo: 'atribuiu o efeito a aquecimento e resfriamento' },
      { texto: 'o ozônio é benéfico em qualquer altitude', porque: 'Perto do solo o ozônio é poluente, irritante respiratório.', motivo: 'ignorou o ozônio troposférico' },
      { texto: 'o ozônio do solo vem dos CFCs', porque: 'O ozônio troposférico é formado por reações de poluentes (NOₓ e compostos orgânicos voláteis) com luz solar; os CFCs destroem o ozônio estratosférico.', motivo: 'confundiu a origem do ozônio' },
    ],
    licao: 'Ozônio estratosférico protege do UV; ozônio troposférico (smog) é poluente. É o mesmo gás em lugares diferentes, com efeitos opostos.',
  },
]

export interface DadosPoluentes {
  indice: number
}

export function gerarPoluentes(rng: Rng, nivel: Nivel): InstanciaMulti<DadosPoluentes> {
  const candidatos = ITENS_POLUENTES.map((it, i) => ({ it, i })).filter((x) => x.it.nivel === nivel)
  const { it, i } = escolher(rng, candidatos)
  const ids = ['A', 'B', 'C', 'D']
  const ordem = embaralhar(rng, [{ ok: true, ...it.certa, motivo: '' }, ...it.erradas.map((e) => ({ ok: false, ...e }))])
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let certa = 'A'
  ordem.forEach((o, k) => {
    const id = ids[k] as string
    if (o.ok) {
      certa = id
      porque[id] = `Certo. ${o.porque}`
    } else {
      porque[id] = `Não. ${o.porque}`
      motivo[id] = o.motivo
    }
  })
  return {
    enunciado: it.pergunta,
    opcoes: ordem.map((o, k) => ({ id: ids[k] as string, rotulo: o.texto })),
    certa,
    porque,
    motivo,
    resolucao: it.certa.porque,
    dicas: ['Lembre qual problema ambiental está em jogo: efeito estufa, chuva ácida, camada de ozônio ou eutrofização.', 'Associe cada problema ao seu agente: CO₂/CH₄; SO₂/NOₓ; CFCs; nitrogênio e fósforo.', 'Elimine as alternativas que misturam problemas diferentes.'],
    licao: it.licao,
    dados: { indice: i },
  }
}

/* ================================================================== economia atômica */

export interface DadosAtomos {
  reacao: string
  variante: 'ea' | 'fatorE'
  rendimento?: number
}

const POOL_EA: Record<Nivel, string[]> = {
  1: ['hidrogenacao', 'hidratacao', 'haber', 'adicao-hcl', 'calcario-cao', 'calcario-co2'],
  2: ['esterificacao', 'neutralizacao', 'mg-acido', 'clorometano', 'ferro', 'clorato', 'ca-oh', 'calcario-cao'],
  3: ['esterificacao', 'neutralizacao', 'clorometano', 'calcario-cao', 'ferro', 'ca-oh'],
}

function listaMM(r: ReacaoVerde): string {
  return [...r.reagentes, ...r.produtos].map((f) => `${ft(f)} = ${fn(massaMolar(f))}`).join('; ')
}

export function equacaoVerde(r: ReacaoVerde): string {
  const nr = r.reagentes.length
  const lado = (formulas: string[], inicio: number) => formulas.map((f, i) => `${r.coefs[inicio + i] === 1 ? '' : r.coefs[inicio + i]}${ft(f)}`).join(' + ')
  return `${lado(r.reagentes, 0)} → ${lado(r.produtos, nr)}`
}

export function gerarAtomos(rng: Rng, nivel: Nivel): InstanciaNum<DadosAtomos> {
  const r = reacaoVerde(escolher(rng, POOL_EA[nivel]))
  const todas = [...r.reagentes, ...r.produtos]
  const desejado = todas[r.desejado] as string
  const R = massaReagentes(r)
  const P = massaDesejada(r)
  const ea = economiaAtomica(r)
  const cabeca = `Considere a reação de ${r.nome}: ${equacaoVerde(r)}, em que o produto desejado é o ${ft(desejado)}. Massas molares (g/mol): ${listaMM(r)}.`
  if (nivel < 3) {
    const tol = 0.5
    const um = (r.coefs[0] as number) * massaMolar(r.reagentes[0] as string)
    return {
      enunciado: `${cabeca} Qual é a economia atômica dessa reação para o ${ft(desejado)}, em porcentagem?`,
      resposta: ea,
      tolerancia: tol,
      unidade: '%',
      erros: limpar(
        [
          { valor: 100 - ea, frase: `${fn(100 - ea, 1)} % é a fração da massa que NÃO vai para o produto desejado. A economia atômica é a fração que vai.`, motivo: 'deu a fração de resíduos, não a de aproveitamento' },
          { valor: ea / 100, frase: 'A economia atômica pede porcentagem: multiplique a razão por 100.', motivo: 'deu a razão sem converter em porcentagem' },
          { valor: (P / um) * 100, frase: 'Você dividiu pela massa de só um reagente. A economia atômica compara com a massa de TODOS os reagentes (com os coeficientes).', motivo: 'dividiu pela massa de um só reagente' },
          { valor: (massaMolar(desejado) / (r.reagentes.reduce((s, f) => s + massaMolar(f), 0))) * 100, frase: 'Você ignorou os coeficientes da equação balanceada. Cada massa molar entra multiplicada pelo seu coeficiente.', motivo: 'ignorou os coeficientes da equação' },
        ],
        ea,
        tol,
      ),
      resolucao: `Massa dos reagentes (com coeficientes) = ${fn(R, 1)} g. Massa do ${ft(desejado)} desejado = ${fn(r.coefs[r.desejado] as number, 0)} × ${fn(massaMolar(desejado))} = ${fn(P, 1)} g. Economia atômica = ${fn(P, 1)} ÷ ${fn(R, 1)} × 100 = ${fn(ea, 1)} %.`,
      dicas: ['Some a massa de todos os reagentes, cada uma multiplicada pelo seu coeficiente.', 'Calcule a massa do produto desejado (com o coeficiente).', 'Economia atômica = massa do desejado ÷ massa dos reagentes × 100.'],
      licao: 'Economia atômica (%) = massa molar do produto desejado (× coeficiente) ÷ soma das massas molares dos reagentes (× coeficientes) × 100. Reações de adição chegam a 100 %.',
      dados: { reacao: r.id, variante: 'ea' },
    }
  }
  const rend = escolher(rng, [50, 60, 75, 80, 90])
  const eta = rend / 100
  const E = fatorE(r, eta)
  const tol = 0.02
  return {
    enunciado: `${cabeca} O rendimento real é de ${rend} %. O fator E é a razão entre a massa de resíduos (tudo o que sai e não é o produto desejado obtido) e a massa do produto desejado obtido, sem contar solventes. Qual é o fator E dessa reação?`,
    resposta: E,
    tolerancia: tol,
    erros: limpar(
      [
        { valor: fatorE(r, 1), frase: 'Esse é o fator E com rendimento de 100 %. O rendimento menor gera menos produto e mais resíduo.', motivo: 'ignorou o rendimento' },
        { valor: (R - P * eta) / R, frase: 'Você dividiu pela massa de reagentes. O fator E divide a massa de resíduos pela massa de PRODUTO obtido.', motivo: 'dividiu pela massa de reagentes' },
        { valor: (R - P) / (P * eta), frase: 'Você aplicou o rendimento só ao produto e esqueceu que o que não virou produto também é resíduo (reagente perdido).', motivo: 'não contou o reagente perdido como resíduo' },
        { valor: (P * eta) / (R - P * eta), frase: 'Você inverteu a razão. O fator E é resíduo ÷ produto.', motivo: 'inverteu resíduo e produto' },
      ],
      E,
      tol,
    ),
    resolucao: `Reagentes: ${fn(R, 1)} g. Produto teórico: ${fn(P, 1)} g; obtido com ${rend} %: ${fn(P * eta, 2)} g. Resíduos = ${fn(R, 1)} − ${fn(P * eta, 2)} = ${fn(R - P * eta, 2)} g. E = ${fn(R - P * eta, 2)} ÷ ${fn(P * eta, 2)} = ${fn(E, 2)}.`,
    dicas: ['Ache a massa de produto realmente obtida (teórica × rendimento).', 'Resíduos = massa total de reagentes − massa de produto obtida.', 'E = resíduos ÷ produto obtido.'],
    licao: 'Fator E = (massa de resíduos) ÷ (massa de produto). Quanto menor, mais "verde". Rendimento baixo aumenta o fator E.',
    dados: { reacao: r.id, variante: 'fatorE', rendimento: rend },
  }
}

/* ================================================================== princípios da química verde */

export interface Principio {
  id: number
  nome: string
  definicao: string
}

export const PRINCIPIOS: Principio[] = [
  { id: 1, nome: 'Prevenção de resíduos', definicao: 'é melhor evitar a formação de resíduos do que tratá-los depois' },
  { id: 2, nome: 'Economia de átomos', definicao: 'maximizar a incorporação de todos os átomos dos reagentes no produto final' },
  { id: 3, nome: 'Sínteses menos perigosas', definicao: 'usar e gerar substâncias com pouca ou nenhuma toxicidade para a saúde e o ambiente' },
  { id: 4, nome: 'Produtos mais seguros', definicao: 'projetar produtos que cumprem sua função com a menor toxicidade possível' },
  { id: 5, nome: 'Solventes e auxiliares mais seguros', definicao: 'evitar solventes e auxiliares ou usar os inócuos, como a água' },
  { id: 6, nome: 'Eficiência energética', definicao: 'reduzir o consumo de energia, de preferência à temperatura e à pressão ambientes' },
  { id: 7, nome: 'Matérias-primas renováveis', definicao: 'preferir matérias-primas renováveis a esgotáveis, quando viável' },
  { id: 8, nome: 'Redução de derivados', definicao: 'evitar etapas de bloqueio, proteção e modificações temporárias' },
  { id: 9, nome: 'Catálise', definicao: 'preferir reagentes catalíticos (seletivos) a estequiométricos' },
  { id: 10, nome: 'Projeto para a degradação', definicao: 'projetar produtos que, no fim da vida útil, se degradem em substâncias inócuas' },
  { id: 11, nome: 'Análise em tempo real', definicao: 'monitorar o processo para evitar a formação de substâncias perigosas' },
  { id: 12, nome: 'Química intrinsecamente segura', definicao: 'escolher substâncias e formas que minimizem o risco de acidentes' },
]

export const principio = (id: number) => PRINCIPIOS.find((p) => p.id === id) as Principio

interface Cenario {
  principio: number
  nivel: Nivel
  texto: string
}

export const CENARIOS: Cenario[] = [
  { principio: 1, nivel: 1, texto: 'Uma indústria mudou o processo para que o subproduto tóxico deixe de ser formado, em vez de construir uma estação para tratá-lo.' },
  { principio: 1, nivel: 3, texto: 'Em vez de neutralizar e descartar o ácido residual, a empresa alterou a rota de síntese para que ele nem seja gerado.' },
  { principio: 2, nivel: 1, texto: 'Em uma rota nova, 95 % da massa dos reagentes termina no produto desejado; a rota antiga aproveitava só 40 %.' },
  { principio: 2, nivel: 3, texto: 'Um químico escolhe uma reação de adição, em que todos os átomos dos reagentes entram no produto, em vez de uma substituição que libera um sal como subproduto.' },
  { principio: 3, nivel: 2, texto: 'A rota nova substitui um reagente muito tóxico por outro de baixa toxicidade para os trabalhadores e para o ambiente.' },
  { principio: 3, nivel: 3, texto: 'O processo foi modificado para não usar cianeto nem gerar compostos de mercúrio.' },
  { principio: 4, nivel: 2, texto: 'Um herbicida foi reformulado para manter a eficácia, mas ficar muito menos tóxico para abelhas e peixes.' },
  { principio: 4, nivel: 3, texto: 'Uma tinta passou a usar pigmentos sem metais pesados, mantendo cor e durabilidade.' },
  { principio: 5, nivel: 1, texto: 'Uma lavanderia trocou o solvente clorado da limpeza a seco por CO₂ supercrítico.' },
  { principio: 5, nivel: 3, texto: 'Uma reação que usava benzeno como solvente passou a ser feita em água.' },
  { principio: 6, nivel: 2, texto: 'O processo foi redesenhado para operar à temperatura ambiente, e não a 300 °C.' },
  { principio: 6, nivel: 3, texto: 'Uma fábrica passou a recuperar o calor liberado pela reação para pré-aquecer os reagentes, reduzindo o consumo de combustível.' },
  { principio: 7, nivel: 1, texto: 'Um plástico passou a ser produzido a partir da cana-de-açúcar no lugar do petróleo.' },
  { principio: 7, nivel: 3, texto: 'Um biodiesel é feito a partir de óleo vegetal em vez de diesel de petróleo.' },
  { principio: 8, nivel: 2, texto: 'A síntese deixou de exigir bloquear um grupo funcional com uma etapa extra e depois desbloqueá-lo.' },
  { principio: 8, nivel: 3, texto: 'Com uma enzima seletiva, evitou-se proteger e desproteger grupos da molécula durante a síntese.' },
  { principio: 9, nivel: 1, texto: 'Uma reação que usava grande excesso de um reagente passou a usar uma pequena quantidade de catalisador reutilizável.' },
  { principio: 9, nivel: 3, texto: 'Um oxidante usado em quantidade estequiométrica foi trocado por oxigênio do ar com um catalisador.' },
  { principio: 10, nivel: 1, texto: 'Uma sacola plástica foi projetada para se decompor em CO₂ e água por ação de microrganismos depois de descartada.' },
  { principio: 10, nivel: 3, texto: 'Um surfactante novo se degrada rapidamente em substâncias inofensivas nos rios.' },
  { principio: 11, nivel: 2, texto: 'Sensores acompanham a reação durante o processo e interrompem a adição de reagente antes que se forme o subproduto perigoso.' },
  { principio: 11, nivel: 3, texto: 'A planta mede continuamente a concentração do poluente para ajustar o processo e evitar emissões.' },
  { principio: 12, nivel: 2, texto: 'A empresa trocou um gás inflamável e explosivo por uma substância de baixo risco no processo.' },
  { principio: 12, nivel: 3, texto: 'Uma substância volátil e inflamável foi substituída por uma forma sólida que reduz o risco de incêndio e de vazamento.' },
]

const CONFUSOES: Record<number, number[]> = {
  1: [2, 3, 8],
  2: [1, 9, 8],
  3: [4, 5, 12],
  4: [3, 10, 12],
  5: [3, 12, 1],
  6: [9, 7, 1],
  7: [10, 6, 1],
  8: [2, 9, 1],
  9: [6, 2, 3],
  10: [4, 7, 1],
  11: [1, 12, 3],
  12: [3, 4, 11],
}

export interface DadosPrincipio {
  principio: number
}

export function gerarPrincipios(rng: Rng, nivel: Nivel): InstanciaMulti<DadosPrincipio> {
  const cands = CENARIOS.filter((c) => (nivel === 3 ? c.nivel === 3 : c.nivel <= nivel))
  const c = escolher(rng, cands)
  const certo = principio(c.principio)
  const errados = embaralhar(rng, CONFUSOES[c.principio] as number[]).slice(0, 3).map(principio)
  const ids = ['A', 'B', 'C', 'D']
  const ordem = embaralhar(rng, [{ p: certo, ok: true }, ...errados.map((p) => ({ p, ok: false }))])
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let certa = 'A'
  ordem.forEach((o, i) => {
    const id = ids[i] as string
    if (o.ok) {
      certa = id
      porque[id] = `Certo. "${o.p.nome}": ${o.p.definicao}. É exatamente o que o cenário descreve.`
    } else {
      porque[id] = `Não. "${o.p.nome}" trata de um assunto diferente: ${o.p.definicao}. O cenário descreve outra ideia: ${certo.definicao}.`
      motivo[id] = `confundiu com o princípio "${o.p.nome}"`
    }
  })
  return {
    enunciado: `Qual princípio da Química Verde está sendo aplicado? ${c.texto}`,
    opcoes: ordem.map((o, i) => ({ id: ids[i] as string, rotulo: o.p.nome })),
    certa,
    porque,
    motivo,
    resolucao: `Princípio "${certo.nome}": ${certo.definicao}.`,
    dicas: ['Pergunte: o que mudou no processo? Os resíduos, os átomos, o solvente, a energia, a matéria-prima, o catalisador, a segurança?', 'Os princípios se parecem: separe "evitar resíduo" (1) de "aproveitar átomos" (2) e "usar substância menos tóxica" (3).', 'Pense na palavra-chave do cenário: renovável, catalisador, degradar, solvente, temperatura ambiente, monitorar.'],
    licao: 'Os 12 princípios da Química Verde (Anastas e Warner) orientam processos que geram menos resíduo, usam menos energia e oferecem menos risco.',
    dados: { principio: c.principio },
  }
}
