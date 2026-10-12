import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import {
  TEIAS,
  alimentos,
  cadeiaValida,
  cadeias,
  efeitoCascata,
  ehProdutor,
  ehTopo,
  niveis,
  nomeEspecie,
  nomeNivel,
  predadores,
  remover,
  taxaLogistica,
  type Teia,
} from './calculo'

const fn = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const lista = (itens: string[]) => (itens.length <= 1 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`)

function limpar(erros: ErroTipico[], resposta: number, tol: number): ErroTipico[] {
  const saida: ErroTipico[] = []
  for (const e of erros) {
    if (!Number.isFinite(e.valor) || e.valor <= 0) continue
    if (Math.abs(e.valor - resposta) <= 2 * tol) continue
    if (saida.some((x) => Math.abs(x.valor - e.valor) <= tol)) continue
    saida.push(e)
  }
  return saida
}

/* ------------------------------------------------------------------ montagem de múltipla escolha */

interface Opc {
  texto: string
  /** feedback quando a pessoa marca esta opção (certa ou errada) */
  porque: string
  motivo?: string
}

type RestoMulti<D> = Omit<InstanciaMulti<D>, 'opcoes' | 'certa' | 'porque' | 'motivo'>

function montar<D>(rng: Rng, certa: Opc, erradas: Opc[], resto: RestoMulti<D>): InstanciaMulti<D> {
  const ids = ['A', 'B', 'C', 'D', 'E']
  const ordem = embaralhar(rng, [{ ok: true, ...certa }, ...erradas.map((e) => ({ ok: false, ...e }))])
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  let id_certa = 'A'
  ordem.forEach((o, k) => {
    const id = ids[k] as string
    if (o.ok) {
      id_certa = id
      porque[id] = `Certo. ${o.porque}`
    } else {
      porque[id] = `Não. ${o.porque}`
      motivo[id] = o.motivo ?? 'opção errada'
    }
  })
  return { ...resto, opcoes: ordem.map((o, k) => ({ id: ids[k] as string, rotulo: o.texto })), certa: id_certa, porque, motivo }
}

/* ================================================================== energia e acúmulo */

export interface EtapaEnergia {
  rotulo: string
  /** valor conhecido; null quando é pedido ou intermediário */
  valor: number | null
}

export interface DadosEnergia {
  variante: 'transferencia' | 'perdida' | 'inversa' | 'ppl' | 'percentual' | 'acumulo' | 'dieta' | 'combinado'
  etapas: EtapaEnergia[]
  /** índice da etapa pedida */
  alvo: number
  eficiencia?: number
  unidade: string
  /** parâmetros do enunciado, usados nos testes para conferir a resposta de forma independente */
  extra?: Record<string, number>
}

const E0S = [1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000]

function etapasDe(n: number, e0: number | null, alvo: number): EtapaEnergia[] {
  return Array.from({ length: n + 1 }, (_, i) => ({ rotulo: maiuscula(nomeNivel(i + 1)), valor: i === 0 ? e0 : null })).map((e, i) => (i === alvo ? { ...e, valor: null } : e))
}

export function gerarEnergia(rng: Rng, nivel: Nivel): InstanciaNum<DadosEnergia> {
  if (nivel === 1) {
    const e0 = escolher(rng, E0S)
    const perdidaSorteada = rng() >= 0.7
    // com uma só passagem, os erros típicos da pergunta "quanto se perde" coincidem entre si; por isso 2 ou 3 passagens
    const n = perdidaSorteada ? sortear(rng, 2, 3) : sortear(rng, 1, 3)
    const alvoNome = nomeNivel(n + 1)
    if (!perdidaSorteada) {
      const resposta = e0 * 0.1 ** n
      const tol = 0.05
      return {
        enunciado: `Os produtores de um ecossistema fixam ${fn(e0)} kJ de energia por ano. Em cada passagem de um nível trófico para o seguinte, apenas 10 % da energia chega ao próximo. Quantos kJ chegam ao ${alvoNome}?`,
        resposta,
        tolerancia: tol,
        unidade: 'kJ',
        erros: limpar(
          [
            { valor: e0 * 0.1 ** (n - 1), frase: `Você aplicou os 10 % uma vez a menos. Do produtor até o ${alvoNome} são ${n} passagens, cada uma multiplicando por 0,1.`, motivo: 'contou uma passagem a menos' },
            { valor: e0 * 0.1 ** (n + 1), frase: `Você aplicou os 10 % uma vez a mais. O ${alvoNome} está a ${n} passagem${n > 1 ? 's' : ''} do produtor.`, motivo: 'contou uma passagem a mais' },
            { valor: e0 * 0.9 ** n, frase: 'Os 90 % são a parte que se perde (calor da respiração, restos não aproveitados), e não a que chega ao nível seguinte.', motivo: 'usou a fração perdida no lugar da transferida' },
            { valor: e0 * 0.1 * n, frase: 'Os 10 % se aplicam a cada passagem, uma depois da outra: multiplica-se por 0,1 várias vezes, e não por 0,1 × n.', motivo: 'somou em vez de compor as passagens' },
          ],
          resposta,
          tol,
        ),
        resolucao: `A cada passagem a energia é multiplicada por 0,1. Do produtor ao ${alvoNome} há ${n} passagem${n > 1 ? 's' : ''}: ${fn(e0)} × 0,1${n > 1 ? `^${n}` : ''} = ${fn(resposta, 3)} kJ.`,
        dicas: ['Conte quantas passagens separam o produtor do nível pedido (produtor → primário é a primeira).', 'A cada passagem a energia é multiplicada por 0,1.', 'Multiplique a energia dos produtores por 0,1 uma vez para cada passagem.'],
        licao: 'Em média, só cerca de 10 % da energia de um nível chega ao seguinte. Depois de n passagens, resta E₀ × 0,1ⁿ.',
        dados: { variante: 'transferencia', etapas: etapasDe(n, e0, n), alvo: n, eficiencia: 0.1, unidade: 'kJ', extra: { e0, n } },
      }
    }
    const resposta = e0 - e0 * 0.1 ** n
    const tol = 0.05
    return {
      enunciado: `Os produtores de um ecossistema fixam ${fn(e0)} kJ de energia por ano, e apenas 10 % da energia de cada nível chega ao nível seguinte. Quantos kJ se perdem (não chegam) até o ${alvoNome}, contando desde os produtores?`,
      resposta,
      tolerancia: tol,
      unidade: 'kJ',
      erros: limpar(
        [
          { valor: e0 * 0.1 ** n, frase: `${fn(e0 * 0.1 ** n, 3)} kJ é o que CHEGA ao ${alvoNome}. A pergunta é quanto NÃO chega: subtraia do total dos produtores.`, motivo: 'deu a energia que chega, não a perdida' },
          { valor: e0 * 0.9 ** n, frase: 'Os 90 % valem para a primeira passagem; nas seguintes, a perda é 90 % do que restava. O mais simples é subtrair do total inicial o que chegou ao final.', motivo: 'aplicou 90 % em todas as passagens' },
          { valor: e0 - e0 * 0.1 ** (n - 1), frase: 'Falta uma passagem: o que chega ao nível pedido é E₀ × 0,1ⁿ, com n igual ao número de passagens até ele.', motivo: 'contou uma passagem a menos' },
          { valor: e0 * 0.9, frase: 'Isso é a perda na primeira passagem apenas. Ela continua nas passagens seguintes.', motivo: 'considerou só a primeira passagem' },
        ],
        resposta,
        tol,
      ),
      resolucao: `Chega ao ${alvoNome}: ${fn(e0)} × 0,1${n > 1 ? `^${n}` : ''} = ${fn(e0 * 0.1 ** n, 3)} kJ. Perdeu-se ${fn(e0)} − ${fn(e0 * 0.1 ** n, 3)} = ${fn(resposta, 3)} kJ.`,
      dicas: ['Primeiro descubra quanto chega ao nível pedido.', 'O que se perdeu é o total fixado pelos produtores menos o que chegou.', 'Calcule E₀ × 0,1ⁿ e subtraia de E₀.'],
      licao: 'Perdido = fixado − que chega ao nível. A maior parte da energia se perde como calor da respiração ou em restos que não são aproveitados.',
      dados: { variante: 'perdida', etapas: etapasDe(n, e0, n), alvo: -1, eficiencia: 0.1, unidade: 'kJ', extra: { e0, n } },
    }
  }

  if (nivel === 2) {
    const v = escolher(rng, ['inversa', 'ppl', 'percentual'] as const)
    if (v === 'inversa') {
      const [ef, n] = escolher(rng, [
        [0.1, 2],
        [0.1, 3],
        [0.2, 2],
        [0.2, 3],
        [0.1, 2],
      ] as const)
      const y = escolher(rng, [5, 10, 20, 40, 50, 100, 200])
      const resposta = Math.round(y / ef ** n)
      const tol = 0.5
      const alvoNome = nomeNivel(n + 1)
      return {
        enunciado: `Em uma cadeia alimentar, cada nível passa ao seguinte ${fn(ef * 100, 0)} % da energia que recebe. Para que o ${alvoNome} receba ${fn(y)} kJ por ano, quantos kJ os produtores precisam fixar por ano?`,
        resposta,
        tolerancia: tol,
        unidade: 'kJ',
        erros: limpar(
          [
            { valor: y * ef ** n, frase: 'Você multiplicou pela fração a cada passagem, mas a conta é no sentido contrário: o produtor tem MAIS energia que o consumidor, então divide-se.', motivo: 'multiplicou em vez de dividir' },
            { valor: y / ef ** (n - 1), frase: `Falta uma passagem: do produtor ao ${alvoNome} são ${n}, e cada uma divide por ${fn(ef)}.`, motivo: 'contou uma passagem a menos' },
            { valor: y / ef ** (n + 1), frase: `Há passagem demais: do produtor ao ${alvoNome} são ${n}.`, motivo: 'contou uma passagem a mais' },
            { valor: y / (ef * n), frase: 'As passagens se compõem (ef × ef × …), e não se somam: divida por efⁿ.', motivo: 'somou as passagens' },
          ],
          resposta,
          tol,
        ),
        resolucao: `Cada passagem multiplica a energia por ${fn(ef)}; para voltar ao produtor, divide-se. São ${n} passagens: ${fn(y)} ÷ ${fn(ef)}${n > 1 ? `^${n}` : ''} = ${fn(resposta)} kJ.`,
        dicas: ['Conte as passagens do produtor ao nível pedido.', 'Se de baixo para cima multiplica por ef, de cima para baixo divide.', 'Produtores = energia do nível pedido ÷ efⁿ.'],
        licao: 'Energia no nível n = E₀ × efⁿ. Para achar a base, divida pela eficiência uma vez por passagem.',
        dados: { variante: 'inversa', etapas: etapasDe(n, null, n).map((e, i) => (i === n ? { ...e, valor: y } : e)), alvo: 0, eficiencia: ef, unidade: 'kJ', extra: { y, n, ef } },
      }
    }
    if (v === 'ppl') {
      const ppb = escolher(rng, [20_000, 40_000, 50_000, 80_000, 100_000])
      const fr = escolher(rng, [0.2, 0.3, 0.4, 0.5, 0.6])
      const r = Math.round(ppb * fr)
      const ppl = ppb - r
      const resposta = ppl * 0.1
      const tol = 0.5
      return {
        enunciado: `Os produtores de um ecossistema têm produtividade primária bruta de ${fn(ppb)} kJ por ano e gastam ${fn(r)} kJ por ano na própria respiração. Considerando que 10 % da produtividade primária líquida chega aos consumidores primários, quantos kJ por ano eles recebem?`,
        resposta,
        tolerancia: tol,
        unidade: 'kJ',
        erros: limpar(
          [
            { valor: ppb * 0.1, frase: 'Você aplicou os 10 % à produtividade bruta. Os produtores usam parte dela na respiração; só a líquida fica disponível como alimento.', motivo: 'ignorou a respiração dos produtores' },
            { valor: ppl, frase: `${fn(ppl)} kJ é a produtividade líquida. Falta aplicar os 10 % que passam para os consumidores primários.`, motivo: 'esqueceu de aplicar os 10 %' },
            { valor: r * 0.1, frase: `Você usou a respiração (${fn(r)} kJ) no lugar da produtividade líquida. A respiração é o que se perde, não o que sobra.`, motivo: 'usou o valor da respiração' },
            { valor: ppl * 0.01, frase: 'Os 10 % entram uma vez só nessa passagem (produtor → consumidor primário).', motivo: 'aplicou os 10 % duas vezes' },
          ],
          resposta,
          tol,
        ),
        resolucao: `Produtividade líquida = bruta − respiração = ${fn(ppb)} − ${fn(r)} = ${fn(ppl)} kJ. Aos consumidores primários chegam 10 %: ${fn(ppl)} × 0,1 = ${fn(resposta)} kJ.`,
        dicas: ['Os produtores gastam parte da energia fixada na própria respiração.', 'Líquida = bruta − respiração.', 'Aplique os 10 % sobre a líquida.'],
        licao: 'PPL = PPB − respiração. É a PPL que fica disponível aos consumidores (e decompositores).',
        dados: { variante: 'ppl', etapas: etapasDe(1, ppl, 1), alvo: 1, eficiencia: 0.1, unidade: 'kJ', extra: { ppb, r } },
      }
    }
    const e1 = escolher(rng, [5000, 10_000, 20_000, 40_000])
    const pct = escolher(rng, [5, 8, 10, 12.5, 15, 20, 25])
    const e2 = (e1 * pct) / 100
    const tol = 0.05
    return {
      enunciado: `Um ecossistema tem ${fn(e1)} kJ de energia disponível no nível dos herbívoros e ${fn(e2)} kJ no nível dos carnívoros que os comem. Qual é a eficiência de transferência de energia do nível dos herbívoros para o dos carnívoros, em porcentagem?`,
      resposta: pct,
      tolerancia: tol,
      unidade: '%',
      erros: limpar(
        [
          { valor: 100 - pct, frase: `${fn(100 - pct, 1)} % é a parte que NÃO passa. A eficiência é a parte que passa para o nível seguinte.`, motivo: 'deu a perda, não a eficiência' },
          { valor: e1 / e2, frase: 'Você dividiu na ordem errada. A eficiência é energia do nível superior ÷ energia do nível inferior.', motivo: 'inverteu a razão' },
          { valor: pct / 100, frase: 'Faltou transformar a razão em porcentagem (× 100).', motivo: 'não converteu em porcentagem' },
          { valor: e1 - e2, frase: 'Isso é a diferença de energia (em kJ), e a pergunta pede uma razão em porcentagem.', motivo: 'deu a diferença em kJ' },
        ],
        pct,
        tol,
      ),
      resolucao: `Eficiência = energia do nível superior ÷ energia do nível inferior × 100 = ${fn(e2)} ÷ ${fn(e1)} × 100 = ${fn(pct, 1)} %.`,
      dicas: ['A eficiência compara o que chegou ao nível de cima com o que havia no de baixo.', 'Divida a energia dos carnívoros pela dos herbívoros.', 'Multiplique por 100 para obter a porcentagem.'],
      licao: 'Eficiência de transferência (%) = energia do nível superior ÷ energia do nível inferior × 100.',
      dados: {
        variante: 'percentual',
        etapas: [
          { rotulo: 'Herbívoros', valor: e1 },
          { rotulo: 'Carnívoros', valor: e2 },
        ],
        alvo: 1,
        unidade: '%',
        extra: { e1, e2 },
      },
    }
  }

  // nível 3
  const v = escolher(rng, ['acumulo', 'dieta', 'combinado'] as const)
  if (v === 'acumulo') {
    const c0 = escolher(rng, [0.001, 0.002, 0.005, 0.01, 0.02, 0.05])
    const f = escolher(rng, [5, 10, 10])
    const n = sortear(rng, 2, 4)
    const resposta = Math.round(c0 * f ** n * 1e6) / 1e6
    const tol = Math.max(0.0005, resposta * 0.002)
    const alvoNome = nomeNivel(n + 1)
    return {
      enunciado: `Um poluente persistente, que não é eliminado pelos organismos, tem concentração de ${fn(c0, 3)} mg/kg nos produtores de um ambiente. A cada passagem de um nível trófico para o seguinte, a concentração no corpo dos consumidores fica ${f} vezes maior que a do nível anterior. Qual é a concentração, em mg/kg, em um ${alvoNome}?`,
      resposta,
      tolerancia: tol,
      unidade: 'mg/kg',
      erros: limpar(
        [
          { valor: c0 * f ** (n - 1), frase: `Falta uma passagem: do produtor ao ${alvoNome} são ${n}, e em cada uma a concentração é multiplicada por ${f}.`, motivo: 'contou uma passagem a menos' },
          { valor: c0 * f ** (n + 1), frase: `Há passagem demais: o ${alvoNome} está a ${n} passagens dos produtores.`, motivo: 'contou uma passagem a mais' },
          { valor: c0 * f * n, frase: `O fator ${f} age em cada passagem, uma sobre a outra (multiplicação repetida), e não ${f} × ${n}.`, motivo: 'somou em vez de compor o acúmulo' },
          { valor: c0 + f * n, frase: 'O acúmulo é multiplicativo (cada nível multiplica a concentração), e não aditivo.', motivo: 'tratou o acúmulo como soma' },
        ],
        resposta,
        tol,
      ),
      resolucao: `A concentração é multiplicada por ${f} a cada passagem. Do produtor ao ${alvoNome} há ${n} passagens: ${fn(c0, 3)} × ${f}${n > 1 ? `^${n}` : ''} = ${fn(resposta, 4)} mg/kg. É a magnificação trófica: o topo da cadeia concentra mais.`,
      dicas: ['Substâncias não eliminadas se acumulam no corpo, e cada consumidor come muitos indivíduos do nível anterior.', 'A concentração é multiplicada pelo fator em cada passagem.', 'Concentração = c₀ × fatorⁿ, com n passagens.'],
      licao: 'Magnificação trófica: substâncias persistentes (DDT, mercúrio, metais pesados) aumentam de concentração ao longo da cadeia, e os predadores de topo são os mais atingidos.',
      dados: { variante: 'acumulo', etapas: etapasDe(n, c0, n), alvo: n, eficiencia: 1 / f, unidade: 'mg/kg', extra: { c0, f, n } },
    }
  }
  if (v === 'dieta') {
    const ef = escolher(rng, [0.1, 0.2, 0.25])
    const ganho = escolher(rng, [1, 2, 4, 5])
    const ingerida = ganho / ef
    const c = escolher(rng, [0.02, 0.04, 0.05, 0.1, 0.2])
    const resposta = Math.round(((c * ingerida) / ganho) * 1e6) / 1e6
    const tol = Math.max(0.0005, resposta * 0.002)
    return {
      enunciado: `Para ganhar ${fn(ganho)} kg de massa corporal, um peixe predador come ${fn(ingerida)} kg de peixes menores (eficiência de ${fn(ef * 100, 0)} %). Cada kg dos peixes menores contém ${fn(c, 3)} mg de um poluente que o predador não elimina: todo o poluente ingerido fica retido no corpo dele. Qual é a concentração do poluente no predador, em mg por kg?`,
      resposta,
      tolerancia: tol,
      unidade: 'mg/kg',
      erros: limpar(
        [
          { valor: c * ingerida, frase: `${fn(c * ingerida, 3)} mg é a quantidade total ingerida. Para a concentração, divida pela massa do predador que ganhou (${fn(ganho)} kg).`, motivo: 'deu a quantidade total, não a concentração' },
          { valor: c, frase: 'A concentração não ficou igual à das presas: o predador acumula o poluente de ' + fn(ingerida) + ' kg de presas num corpo que ganhou só ' + fn(ganho) + ' kg.', motivo: 'supôs concentração igual à da presa' },
          { valor: (c * ganho) / ingerida, frase: 'A razão está invertida: a concentração aumenta (massa ingerida ÷ massa ganha), e não diminui.', motivo: 'inverteu a razão' },
          { valor: c * ganho, frase: 'Você multiplicou pela massa ganha. Primeiro calcule o poluente total ingerido (concentração × massa ingerida) e só então divida pela massa do predador.', motivo: 'montou a conta errada' },
        ],
        resposta,
        tol,
      ),
      resolucao: `Poluente ingerido = ${fn(c, 3)} × ${fn(ingerida)} = ${fn(c * ingerida, 3)} mg, todo retido num corpo que ganhou ${fn(ganho)} kg. Concentração = ${fn(c * ingerida, 3)} ÷ ${fn(ganho)} = ${fn(resposta, 4)} mg/kg, ou seja, ${fn(1 / ef, 1)} vezes a das presas (1 ÷ ${fn(ef)}).`,
      dicas: ['Calcule quanto poluente entrou no predador (concentração × massa ingerida).', 'Esse poluente fica todo no corpo, que ganhou apenas parte da massa ingerida.', 'Concentração = poluente total ÷ massa ganha.'],
      licao: 'Quando o poluente fica retido, a concentração sobe na proporção inversa da eficiência: fator = 1 ÷ eficiência (10 % → ×10).',
      dados: {
        variante: 'dieta',
        etapas: [
          { rotulo: 'Peixes menores', valor: c },
          { rotulo: 'Predador', valor: null },
        ],
        alvo: 1,
        eficiencia: ef,
        unidade: 'mg/kg',
        extra: { c, ingerida, ganho },
      },
    }
  }
  const ppb = escolher(rng, [100_000, 200_000, 500_000])
  const fr = escolher(rng, [0.3, 0.4, 0.5, 0.6])
  const r = Math.round(ppb * fr)
  const ppl = ppb - r
  const n = sortear(rng, 2, 3)
  const resposta = ppl * 0.1 ** n
  const tol = 0.05
  const alvoNome = nomeNivel(n + 1)
  return {
    enunciado: `Os produtores de uma floresta têm produtividade primária bruta de ${fn(ppb)} kJ por ano e usam ${fn(r)} kJ na própria respiração. Se 10 % da energia passa de um nível ao seguinte, quantos kJ por ano chegam ao ${alvoNome}? (Parta da produtividade líquida.)`,
    resposta,
    tolerancia: tol,
    unidade: 'kJ',
    erros: limpar(
      [
        { valor: ppb * 0.1 ** n, frase: 'Você partiu da produtividade bruta. A respiração dos produtores consome parte dela, então a energia disponível como alimento é a líquida.', motivo: 'ignorou a respiração dos produtores' },
        { valor: ppl * 0.1 ** (n - 1), frase: `Falta uma passagem: do produtor ao ${alvoNome} são ${n}.`, motivo: 'contou uma passagem a menos' },
        { valor: ppl * 0.1 ** (n + 1), frase: `Há passagem demais: do produtor ao ${alvoNome} são ${n}.`, motivo: 'contou uma passagem a mais' },
        { valor: r * 0.1 ** n, frase: 'Você usou o valor da respiração. A produtividade líquida é bruta − respiração.', motivo: 'usou a respiração em vez da líquida' },
      ],
      resposta,
      tol,
    ),
    resolucao: `PPL = ${fn(ppb)} − ${fn(r)} = ${fn(ppl)} kJ. Depois de ${n} passagens: ${fn(ppl)} × 0,1^${n} = ${fn(resposta, 3)} kJ.`,
    dicas: ['Comece pela produtividade líquida (bruta − respiração).', `Conte as passagens até o ${alvoNome}.`, 'Multiplique a líquida por 0,1 uma vez por passagem.'],
    licao: 'Energia disponível no nível n = (PPB − respiração) × efⁿ.',
    dados: { variante: 'combinado', etapas: etapasDe(n, ppl, n), alvo: n, eficiencia: 0.1, unidade: 'kJ', extra: { ppb, r, n } },
  }
}

/* ================================================================== teias alimentares */

export type TipoTeia = 'produtor' | 'primario' | 'topo' | 'cadeia' | 'nivel' | 'remocao' | 'aumento' | 'cascata' | 'omnivoro' | 'maiorcadeia'

export interface DadosTeia {
  teia: string
  tipo: TipoTeia
  /** espécies em destaque ao desenhar a teia */
  destaque: Record<string, 'removida' | 'alvo'>
  /** cadeia a realçar depois que a pessoa responde */
  cadeia?: string[]
}

const NIVEIS_TEIA: Record<Nivel, TipoTeia[]> = {
  1: ['produtor', 'primario', 'topo', 'cadeia'],
  2: ['cadeia', 'nivel', 'remocao', 'aumento'],
  3: ['cascata', 'omnivoro', 'maiorcadeia', 'remocao'],
}

const DICAS_TEIA = ['Releia a teia: as setas apontam de quem é comido para quem come (sentido do fluxo de energia).', 'Siga as setas a partir de um produtor, passo a passo.', 'Descarte as alternativas que contrariam o que as setas mostram.']

export function gerarTeia(rng: Rng, nivel: Nivel): InstanciaMulti<DadosTeia> {
  const tipos = NIVEIS_TEIA[nivel]
  // alguns tipos dependem da estrutura sorteada; tenta de novo até encontrar um caso bem definido
  for (let tentativa = 0; tentativa < 60; tentativa++) {
    const t = escolher(rng, TEIAS)
    const tipo = escolher(rng, tipos)
    const r = tentarTipo(rng, t, tipo, nivel)
    if (r) return r
  }
  // sempre existe o caso simples
  const t = TEIAS[0] as Teia
  return tentarTipo(rng, t, 'produtor', nivel) as InstanciaMulti<DadosTeia>
}

const nome = (t: Teia, id: string) => nomeEspecie(t, id)
const seq = (t: Teia, ids: string[]) => ids.map((i) => nome(t, i)).join(' → ')

function tentarTipo(rng: Rng, t: Teia, tipo: TipoTeia, nivel: Nivel): InstanciaMulti<DadosTeia> | null {
  const ids = t.especies.map((e) => e.id)
  const base = { teia: t.id, tipo }
  const dicas = DICAS_TEIA

  if (tipo === 'produtor') {
    const produtores = ids.filter((i) => ehProdutor(t, i))
    const consumidores = ids.filter((i) => !ehProdutor(t, i))
    if (consumidores.length < 3) return null
    const certo = escolher(rng, produtores)
    const erradas = embaralhar(rng, consumidores).slice(0, 3)
    return montar<DadosTeia>(
      rng,
      { texto: nome(t, certo), porque: `${nome(t, certo)} é produtor: não se alimenta de outros seres, é a base da teia e fixa a energia do ambiente.` },
      erradas.map((e) => ({ texto: nome(t, e), porque: `${nome(t, e)} é consumidor: se alimenta de ${lista(alimentos(t, e).map((a) => nome(t, a)))}.`, motivo: 'confundiu consumidor com produtor' })),
      {
        enunciado: `Na teia alimentar do ambiente "${t.nome}", qual dos seres abaixo é produtor?`,
        resolucao: `Produtores não têm setas chegando neles: eles fazem a própria matéria orgânica (por fotossíntese). Nessa teia, são ${lista(produtores.map((p) => nome(t, p)))}.`,
        dicas,
        licao: 'Produtores são a base da teia: nenhuma seta chega neles, pois não comem outros seres.',
        dados: { ...base, destaque: {} },
      },
    )
  }

  if (tipo === 'primario') {
    const unicos = ids.filter((i) => !ehProdutor(t, i) && alimentos(t, i).every((a) => ehProdutor(t, a)))
    const carnivoros = ids.filter((i) => !ehProdutor(t, i) && alimentos(t, i).every((a) => !ehProdutor(t, a)))
    const produtores = ids.filter((i) => ehProdutor(t, i))
    if (unicos.length < 1 || carnivoros.length < 2 || produtores.length < 1) return null
    const certo = escolher(rng, unicos)
    const erradas = [escolher(rng, produtores), ...embaralhar(rng, carnivoros).slice(0, 2)]
    return montar<DadosTeia>(
      rng,
      { texto: nome(t, certo), porque: `${nome(t, certo)} se alimenta só de produtores (${lista(alimentos(t, certo).map((a) => nome(t, a)))}): é consumidor primário.` },
      erradas.map((e) =>
        ehProdutor(t, e)
          ? { texto: nome(t, e), porque: `${nome(t, e)} é produtor (1º nível), e não consumidor.`, motivo: 'confundiu produtor com consumidor primário' }
          : { texto: nome(t, e), porque: `${nome(t, e)} se alimenta de ${lista(alimentos(t, e).map((a) => nome(t, a)))}, que já são consumidores; por isso é consumidor secundário ou de ordem maior.`, motivo: 'confundiu os níveis de consumidor' },
      ),
      {
        enunciado: `Na teia do ambiente "${t.nome}", qual espécie é consumidor primário, isto é, se alimenta apenas de produtores?`,
        resolucao: `Consumidores primários têm setas chegando só de produtores. Aqui, ${lista(unicos.map((u) => nome(t, u)))} se enquadram${unicos.length > 1 ? 'm' : ''}. Entre as alternativas, só ${nome(t, certo)}.`,
        dicas,
        licao: 'Consumidor primário come produtores (herbívoro); secundário come primários; e assim por diante.',
        dados: { ...base, destaque: { [certo]: 'alvo' } },
      },
    )
  }

  if (tipo === 'topo') {
    const topos = ids.filter((i) => ehTopo(t, i))
    const outros = ids.filter((i) => !ehTopo(t, i) && !ehProdutor(t, i))
    if (outros.length < 3) return null
    const certo = escolher(rng, topos)
    const erradas = embaralhar(rng, outros).slice(0, 3)
    return montar<DadosTeia>(
      rng,
      { texto: nome(t, certo), porque: `Nenhuma seta sai de ${nome(t, certo)}: nada na teia se alimenta dela. É predador de topo.` },
      erradas.map((e) => ({ texto: nome(t, e), porque: `${nome(t, e)} é alimento de ${lista(predadores(t, e).map((q) => nome(t, q)))}, então não está no topo.`, motivo: 'confundiu topo com um nível intermediário' })),
      {
        enunciado: `Na teia do ambiente "${t.nome}", qual espécie é predador de topo, ou seja, não é alimento de nenhuma outra?`,
        resolucao: `O predador de topo não tem setas saindo dele. Nessa teia: ${lista(topos.map((p) => nome(t, p)))}.`,
        dicas,
        licao: 'Predador de topo: nenhuma seta sai dele, pois não tem predadores naturais na teia.',
        dados: { ...base, destaque: { [certo]: 'alvo' } },
      },
    )
  }

  if (tipo === 'cadeia') {
    const compr = nivel === 1 ? 3 : 4
    const todas = cadeias(t).filter((c) => c.length >= compr)
    if (todas.length === 0) return null
    const longa = escolher(rng, todas)
    const certa = longa.slice(0, compr)
    const consumidoresAleatorios = ids.filter((i) => !certa.includes(i))
    const candidatos: { ids: string[] }[] = []
    candidatos.push({ ids: [...certa].reverse() })
    // troca o último elo por uma espécie que não se alimenta do anterior
    for (const x of consumidoresAleatorios) candidatos.push({ ids: [...certa.slice(0, -1), x] })
    // retira um elo do meio
    if (certa.length > 3) candidatos.push({ ids: [certa[0] as string, ...certa.slice(2)] })
    // começa em um consumidor
    for (const x of consumidoresAleatorios.filter((i) => !ehProdutor(t, i))) candidatos.push({ ids: [x, ...certa.slice(1)] })
    // troca a ordem de dois elos vizinhos
    const trocada = [...certa]
    ;[trocada[1], trocada[2]] = [trocada[2] as string, trocada[1] as string]
    candidatos.push({ ids: trocada })
    const invalidos: string[][] = []
    for (const c of embaralhar(rng, candidatos)) {
      if (cadeiaValida(t, c.ids)) continue
      if (invalidos.some((x) => x.join('>') === c.ids.join('>'))) continue
      invalidos.push(c.ids)
    }
    if (invalidos.length < 3) return null
    const erradas = invalidos.slice(0, 3)
    const motivoDe = (s: string[]): { porque: string; motivo: string } => {
      if (!ehProdutor(t, s[0] as string)) return { porque: `a cadeia começa em ${nome(t, s[0] as string)}, que é consumidor. Toda cadeia alimentar começa em um produtor.`, motivo: 'cadeia que não começa em produtor' }
      const i = s.findIndex((x, k) => k > 0 && !alimentos(t, x).includes(s[k - 1] as string))
      const a = s[i - 1] as string
      const b = s[i] as string
      if (alimentos(t, a).includes(b)) return { porque: `a ordem está invertida: é ${nome(t, a)} que se alimenta de ${nome(t, b)}, e a seta deve ir de quem é comido para quem come.`, motivo: 'inverteu o sentido da cadeia' }
      return { porque: `${nome(t, b)} não se alimenta de ${nome(t, a)} nessa teia (${nome(t, b)} come ${lista(alimentos(t, b).map((x) => nome(t, x)))}).`, motivo: 'ligou espécies que não se alimentam uma da outra' }
    }
    return montar<DadosTeia>(
      rng,
      { texto: seq(t, certa), porque: `Cada espécie se alimenta da anterior e a cadeia começa no produtor ${nome(t, certa[0] as string)}.` },
      erradas.map((s) => {
        const m = motivoDe(s)
        return { texto: seq(t, s), porque: m.porque.charAt(0).toUpperCase() + m.porque.slice(1), motivo: m.motivo }
      }),
      {
        enunciado: `Na teia do ambiente "${t.nome}" (as setas vão de quem é comido para quem come), qual das sequências abaixo é uma cadeia alimentar?`,
        resolucao: `Uma cadeia começa em um produtor, e cada elo se alimenta do anterior. Aqui: ${seq(t, certa)}.`,
        dicas,
        licao: 'Cadeia alimentar: produtor → consumidor primário → secundário → …, com setas no sentido do fluxo de energia (de quem é comido para quem come).',
        dados: { ...base, destaque: {}, cadeia: certa },
      },
    )
  }

  if (tipo === 'nivel') {
    const todas = cadeias(t).filter((c) => c.length >= 3)
    if (todas.length === 0) return null
    const longa = escolher(rng, todas)
    const compr = sortear(rng, 3, Math.min(5, longa.length))
    const c = longa.slice(0, compr)
    const k = sortear(rng, 1, compr - 1) // posição do elo perguntado (0 = produtor)
    const alvo = c[k] as string
    const certoNome = nomeNivel(k + 1)
    const pool = [1, 2, 3, 4, 5].filter((n) => n !== k + 1).map((n) => nomeNivel(n))
    const erradas = embaralhar(rng, pool).slice(0, 3)
    return montar<DadosTeia>(
      rng,
      { texto: certoNome, porque: `Na cadeia ${seq(t, c)}, ${nome(t, alvo)} está na posição ${k + 1}, contando o produtor como 1ª: é ${certoNome}.` },
      erradas.map((e) => ({ texto: e, porque: `${maiuscula(e)} seria a posição ${[1, 2, 3, 4, 5].find((n) => nomeNivel(n) === e)}, mas ${nome(t, alvo)} está na posição ${k + 1}.`, motivo: 'errou a contagem dos níveis' })),
      {
        enunciado: `Considere a cadeia alimentar ${seq(t, c)}, retirada da teia "${t.nome}". Que nível trófico ${nome(t, alvo)} ocupa nessa cadeia?`,
        resolucao: `Conta-se a partir do produtor: ${c.map((x, i) => `${nome(t, x)} = ${nomeNivel(i + 1)}`).join('; ')}.`,
        dicas: ['O produtor é o 1º nível trófico.', 'O consumidor primário é o 2º nível, o secundário o 3º, o terciário o 4º.', 'Conte as posições na cadeia a partir do produtor.'],
        licao: 'Níveis tróficos: 1º produtor; 2º consumidor primário; 3º secundário; 4º terciário; 5º quaternário.',
        dados: { ...base, destaque: { [alvo]: 'alvo' }, cadeia: c },
      },
    )
  }

  if (tipo === 'remocao') {
    const candidatos = ids.filter((x) => remover(t, [x]).semAlimento.length === 1)
    if (candidatos.length === 0) return null
    const x = escolher(rng, candidatos)
    const c = remover(t, [x])
    const certo = c.semAlimento[0] as string
    const seguem = ids.filter((i) => i !== x && !c.semAlimentoEmCadeia.includes(i))
    const tentarPerdeFonte = c.perdemFonte.filter((i) => alimentos(t, i).includes(x) && seguem.includes(i))
    const tentarPresas = c.perdemPredador.filter((i) => seguem.includes(i) && i !== certo)
    const neutras = seguem.filter((i) => !alimentos(t, i).includes(x) && !predadores(t, i).includes(x) && !ehProdutor(t, i))
    const erradas: Opc[] = []
    for (const i of embaralhar(rng, tentarPerdeFonte)) {
      if (erradas.length >= 1) break
      erradas.push({ texto: nome(t, i), porque: `${nome(t, i)} perde ${nome(t, x)} como alimento, mas ainda se alimenta de ${lista(alimentos(t, i).filter((a) => a !== x).map((a) => nome(t, a)))}.`, motivo: 'ignorou as outras fontes de alimento' })
    }
    for (const i of embaralhar(rng, tentarPresas)) {
      if (erradas.length >= 2) break
      erradas.push({ texto: nome(t, i), porque: `${nome(t, i)} é presa de ${nome(t, x)}: com o desaparecimento de ${nome(t, x)}, perde um predador, e não o alimento.`, motivo: 'confundiu presa com predador' })
    }
    for (const i of embaralhar(rng, neutras)) {
      if (erradas.length >= 3) break
      if (erradas.some((e) => e.texto === nome(t, i))) continue
      erradas.push({ texto: nome(t, i), porque: `${nome(t, i)} não depende de ${nome(t, x)}: nenhum de seus alimentos desaparece.`, motivo: 'escolheu espécie sem relação direta' })
    }
    if (erradas.length < 3) return null
    return montar<DadosTeia>(
      rng,
      { texto: nome(t, certo), porque: `${nome(t, certo)} só se alimenta de ${nome(t, x)}. Sem ele, fica sem nenhum alimento.` },
      erradas,
      {
        enunciado: `Na teia do ambiente "${t.nome}", suponha que ${nome(t, x)} desapareça. Qual espécie perde imediatamente todas as suas fontes de alimento (sem contar efeitos em cadeia que viriam depois)?`,
        resolucao: `Quem fica sem alimento é quem só tinha ${nome(t, x)} no cardápio: ${nome(t, certo)}. As outras espécies que o comiam têm alternativas.`,
        dicas: ['Procure as espécies que têm seta chegando de quem desaparece.', 'Dessas, veja quais não têm nenhuma outra seta chegando.', 'Quem tem outra fonte de alimento não fica sem comida na hora.'],
        licao: 'Espécies com dieta variada resistem melhor à perda de uma presa; as que dependem de uma só fonte são mais vulneráveis.',
        dados: { ...base, destaque: { [x]: 'removida', [certo]: 'alvo' } },
      },
    )
  }

  if (tipo === 'aumento') {
    const candidatos = ids.filter((x) => !ehProdutor(t, x) && alimentos(t, x).length >= 1)
    const x = escolher(rng, candidatos)
    const c = remover(t, [x])
    const presas = alimentos(t, x).filter((a) => !c.semAlimentoEmCadeia.includes(a))
    const naoPresas = ids.filter((i) => i !== x && !alimentos(t, x).includes(i) && !c.semAlimentoEmCadeia.includes(i))
    const seusPredadores = predadores(t, x)
    const outros = naoPresas.filter((i) => !predadores(t, x).includes(i))
    // evita competidoras: dividem alimento com x e poderiam ser lidas como beneficiadas
    const naoCompete = outros.filter((i) => !c.ganhamAlimento.includes(i))
    if (presas.length < 1 || naoCompete.length < 2) return null
    const certo = escolher(rng, presas)
    const erradas: Opc[] = []
    for (const q of embaralhar(rng, seusPredadores).slice(0, 1)) erradas.push({ texto: nome(t, q), porque: `${nome(t, q)} se alimenta de ${nome(t, x)}; sem ele, perde alimento e tende a diminuir.`, motivo: 'inverteu o efeito sobre o predador' })
    for (const i of embaralhar(rng, naoCompete)) {
      if (erradas.length >= 3) break
      erradas.push({ texto: nome(t, i), porque: `${nome(t, i)} não é caçada por ${nome(t, x)}; o desaparecimento dele não tira nenhum predador dessa espécie.`, motivo: 'escolheu espécie que não é presa' })
    }
    if (erradas.length < 3) return null
    return montar<DadosTeia>(
      rng,
      { texto: nome(t, certo), porque: `${nome(t, certo)} é presa de ${nome(t, x)}. Sem ele, deixa de ser caçada por esse predador e tende a aumentar no início.` },
      erradas,
      {
        enunciado: `Na teia do ambiente "${t.nome}", se ${nome(t, x)} desaparecer, qual das espécies abaixo deixa de ser caçada por ele e, por isso, tende a aumentar no início?`,
        resolucao: `As presas de ${nome(t, x)} são ${lista(alimentos(t, x).map((a) => nome(t, a)))}; entre as alternativas, a que aparece é ${nome(t, certo)}. Sem o predador, a pressão de predação diminui.`,
        dicas: DICAS_TEIA,
        licao: 'Retirar um predador tende a aumentar suas presas (menos predação); retirar uma presa tende a diminuir seus predadores (menos alimento).',
        dados: { ...base, destaque: { [x]: 'removida', [certo]: 'alvo' } },
      },
    )
  }

  if (tipo === 'cascata') {
    const todas = cadeias(t).filter((c) => c.length >= 3)
    if (todas.length === 0) return null
    const longa = escolher(rng, todas)
    const compr = sortear(rng, 3, Math.min(4, longa.length))
    const c = longa.slice(0, compr)
    const baixo = rng() < 0.35
    let corretaSinal: 1 | -1
    let enunciado: string
    let explic: string
    let alvo: string
    let removida: string
    if (!baixo) {
      removida = c[compr - 1] as string
      const posAlvo = sortear(rng, 0, compr - 2)
      alvo = c[posAlvo] as string
      corretaSinal = efeitoCascata(compr, compr - 1, posAlvo)
      enunciado = `Considere apenas a cadeia ${seq(t, c)}, sem outras interações. Se ${nome(t, removida)} for eliminada, o que tende a acontecer com a população de ${nome(t, alvo)}?`
      const passos: string[] = []
      for (let p = compr - 2; p >= posAlvo; p--) passos.push(`${nome(t, c[p] as string)} ${efeitoCascata(compr, compr - 1, p) === 1 ? 'aumenta' : 'diminui'}`)
      explic = `Sem ${nome(t, removida)}, ${passos.join('; em seguida, ')}.`
    } else {
      removida = c[0] as string
      const posAlvo = sortear(rng, 2, compr - 1)
      alvo = c[posAlvo] as string
      corretaSinal = -1
      enunciado = `Considere apenas a cadeia ${seq(t, c)}, sem outras interações. Se ${nome(t, removida)} (o produtor) for eliminado, o que tende a acontecer com a população de ${nome(t, alvo)}?`
      explic = `Sem o produtor, falta energia na base e cada nível acima recebe menos: ${c.slice(1).map((x) => nome(t, x)).join(', ')} diminuem.`
    }
    const certo = corretaSinal === 1 ? 'Tende a aumentar' : 'Tende a diminuir'
    const outroSentido = corretaSinal === 1 ? 'Tende a diminuir' : 'Tende a aumentar'
    return montar<DadosTeia>(
      rng,
      { texto: certo, porque: explic },
      [
        { texto: outroSentido, porque: `O sentido do efeito é o oposto. ${explic}`, motivo: 'inverteu o sentido do efeito em cascata' },
        { texto: 'Não se altera', porque: `Numa cadeia, as populações dependem umas das outras: ${explic}`, motivo: 'achou que não haveria efeito' },
        { texto: `${nome(t, alvo)} desaparece imediatamente`, porque: 'O efeito é uma tendência de variação populacional, e não um desaparecimento imediato.', motivo: 'exagerou o efeito' },
      ],
      {
        enunciado,
        resolucao: explic,
        dicas: ['Faça um passo de cada vez, a partir do elo eliminado.', 'Retirar um predador faz sua presa aumentar; com mais presas desse nível, o nível abaixo é mais consumido e diminui.', 'O efeito alterna (aumenta, diminui, aumenta...) à medida que se afasta do elo retirado, quando o elo eliminado é um predador.'],
        licao: 'Cascata trófica: retirar um predador de topo alterna aumentos e diminuições nos níveis abaixo; retirar o produtor reduz todos os níveis acima.',
        dados: { ...base, destaque: { [removida]: 'removida', [alvo]: 'alvo' }, cadeia: c },
      },
    )
  }

  if (tipo === 'omnivoro') {
    const omnis = ids.filter((i) => niveis(t, i).length > 1)
    const simples = ids.filter((i) => niveis(t, i).length === 1 && !ehProdutor(t, i))
    if (omnis.length < 1 || simples.length < 3) return null
    const certo = escolher(rng, omnis)
    const erradas = embaralhar(rng, simples).slice(0, 3)
    const desc = (i: string) => niveis(t, i).map((n) => `${n}º`).join(' e ')
    return montar<DadosTeia>(
      rng,
      { texto: nome(t, certo), porque: `${nome(t, certo)} se alimenta de ${lista(alimentos(t, certo).map((a) => `${nome(t, a)} (${desc(a)} nível)`))}; por isso ocupa mais de um nível: ${desc(certo)}.` },
      erradas.map((e) => ({ texto: nome(t, e), porque: `${nome(t, e)} ocupa só o ${niveis(t, e)[0]}º nível trófico, pois todas as suas fontes de alimento estão no mesmo nível.`, motivo: 'não percebeu que a espécie ocupa um único nível' })),
      {
        enunciado: `Na teia do ambiente "${t.nome}", qual espécie ocupa mais de um nível trófico, porque se alimenta de seres que estão em níveis diferentes?`,
        resolucao: `${nome(t, certo)} ocupa os níveis ${desc(certo)}, pois seus alimentos estão em níveis diferentes.`,
        dicas: ['Veja de quem cada espécie se alimenta.', 'Se os alimentos estão em níveis diferentes, a espécie ocupa mais de um.', 'Calcule o nível de cada alimento e some 1.'],
        licao: 'Em uma teia, onívoros e carnívoros que comem presas de níveis diferentes ocupam mais de um nível trófico.',
        dados: { ...base, destaque: { [certo]: 'alvo' } },
      },
    )
  }

  // maiorcadeia
  const todas = cadeias(t)
  const maior = Math.max(...todas.map((c) => c.length))
  const exemplar = todas.find((c) => c.length === maior) as string[]
  const nConsumidores = ids.filter((i) => !ehProdutor(t, i)).length
  const candidatos = [...new Set([maior - 2, maior - 1, maior + 1, maior + 2, nConsumidores, ids.length])].filter((v) => v >= 2 && v !== maior)
  if (candidatos.length < 3) return null
  const proximos = candidatos.sort((a, b) => Math.abs(a - maior) - Math.abs(b - maior)).slice(0, 3)
  return montar<DadosTeia>(
    rng,
    { texto: String(maior), porque: `A cadeia mais longa tem ${maior} espécies: ${seq(t, exemplar)}.` },
    proximos.map((v) => ({
      texto: String(v),
      porque: v < maior ? `Existe uma cadeia com ${maior} níveis (${seq(t, exemplar)}), então ${v} não é o máximo.` : `Nenhuma cadeia dessa teia chega a ${v} níveis; a mais longa tem ${maior}.`,
      motivo: v < maior ? 'contou uma cadeia mais curta' : 'contou níveis a mais',
    })),
    {
      enunciado: `Qual é o maior número de níveis tróficos de uma cadeia alimentar dessa teia, do produtor até um predador de topo, no ambiente "${t.nome}"?`,
      resolucao: `Percorrendo as setas do produtor ao topo, o caminho mais longo é ${seq(t, exemplar)}: ${maior} níveis.`,
      dicas: ['Escolha um produtor e siga as setas até um predador de topo.', 'Compare os caminhos possíveis e fique com o mais longo.', 'Conte as espécies, produtor incluído.'],
      licao: 'O número de níveis de uma cadeia é limitado pela perda de energia a cada passagem, por isso é raro passar de 5 ou 6.',
      dados: { ...base, destaque: {}, cadeia: exemplar },
    },
  )
}

/* ================================================================== populações */

export interface DadosPopulacao {
  variante: 'saldo' | 'densidade' | 'exponencial' | 'taxa' | 'marcacao' | 'taxaLogistica' | 'maxima' | 'nMaxima'
  r?: number
  k?: number
  n?: number
  n0?: number
  /** parâmetros do enunciado, usados nos testes para conferir a resposta de forma independente */
  extra?: Record<string, number>
}

const COMBOS_DENSIDADE: [number, number][] = (() => {
  const saida: [number, number][] = []
  for (const n of [120, 150, 180, 240, 300, 360, 480, 600, 720, 900])
    for (const a of [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30]) {
      const d = n / a
      if (Math.abs(d * 10 - Math.round(d * 10)) < 1e-9 && d >= 4 && d <= 300) saida.push([n, a])
    }
  return saida
})()

const COMBOS_EXP: [number, number, number, number][] = (() => {
  const saida: [number, number, number, number][] = []
  for (const r of [0.1, 0.2, 0.25, 0.5, 1])
    for (const t of [2, 3, 4])
      for (let n0 = 100; n0 <= 2000; n0 += 50) {
        const v = n0 * (1 + r) ** t
        if (Math.abs(v - Math.round(v)) < 1e-9 && v <= 20000 && v > n0 * 1.2) saida.push([n0, r, t, Math.round(v)])
      }
  return saida
})()

const COMBOS_LINCOLN: [number, number, number, number][] = (() => {
  const saida: [number, number, number, number][] = []
  for (const m of [20, 30, 40, 50, 60, 80, 100])
    for (const c of [30, 40, 50, 60, 80, 100])
      for (const r of [3, 4, 5, 6, 8, 10, 12, 15, 20]) {
        const N = (m * c) / r
        if (Number.isInteger(N) && N >= 200 && N <= 3000 && r < m && r < c) saida.push([m, c, r, N])
      }
  return saida
})()

export function gerarPopulacao(rng: Rng, nivel: Nivel): InstanciaNum<DadosPopulacao> {
  if (nivel === 1) {
    if (rng() < 0.55) {
      const n0 = escolher(rng, [500, 800, 1000, 1500, 2000])
      const nasc = escolher(rng, [100, 120, 150, 200, 250, 300])
      const mort = escolher(rng, [40, 60, 80, 90, 100]) as number
      const imi = escolher(rng, [20, 30, 40, 50])
      const emi = escolher(rng, [10, 20, 30, 60])
      const delta = nasc + imi - mort - emi
      const resposta = n0 + delta
      const tol = 0.5
      return {
        enunciado: `Em uma ilha vive uma população de ${fn(n0)} lagartos. Ao longo de um ano, nasceram ${fn(nasc)} indivíduos e morreram ${fn(mort)}; chegaram ${fn(imi)} vindos de outras ilhas (imigração) e saíram ${fn(emi)} (emigração). Qual é o tamanho da população ao final do ano?`,
        resposta,
        tolerancia: tol,
        unidade: 'indivíduos',
        erros: limpar(
          [
            { valor: n0 + nasc - mort, frase: 'Faltou considerar a migração: imigrantes entram e emigrantes saem, e isso altera o tamanho da população.', motivo: 'ignorou a migração' },
            { valor: delta, frase: `${fn(delta)} é a variação (saldo) da população. A pergunta pede o tamanho final: some ao tamanho inicial.`, motivo: 'deu a variação em vez do tamanho final' },
            { valor: n0 + nasc + imi + mort + emi, frase: 'Mortes e emigração reduzem a população (saem dela); apenas nascimentos e imigração aumentam.', motivo: 'somou também mortes e emigração' },
            { valor: n0 + nasc - mort - imi + emi, frase: 'A imigração aumenta a população (entram indivíduos) e a emigração diminui (saem).', motivo: 'trocou os sinais da migração' },
          ],
          resposta,
          tol,
        ),
        resolucao: `Variação = nascimentos + imigrantes − mortes − emigrantes = ${fn(nasc)} + ${fn(imi)} − ${fn(mort)} − ${fn(emi)} = ${fn(delta)}. Tamanho final = ${fn(n0)} + ${fn(delta)} = ${fn(resposta)}.`,
        dicas: ['Entram na população: nascimentos e imigrantes.', 'Saem da população: mortes e emigrantes.', 'Final = inicial + entradas − saídas.'],
        licao: 'ΔN = nascimentos + imigração − mortes − emigração.',
        dados: { variante: 'saldo', extra: { n0, nasc, mort, imi, emi } },
      }
    }
    const [n, a] = escolher(rng, COMBOS_DENSIDADE)
    const d = n / a
    const tol = 0.05
    return {
      enunciado: `Em uma área de ${fn(a)} hectares de cerrado foram contadas ${fn(n)} árvores de uma mesma espécie. Qual é a densidade populacional, em árvores por hectare?`,
      resposta: d,
      tolerancia: tol,
      unidade: 'árvores/ha',
      erros: limpar(
        [
          { valor: a / n, frase: 'Você dividiu a área pelo número de indivíduos. Densidade é indivíduos por unidade de área: número ÷ área.', motivo: 'inverteu a razão' },
          { valor: n * a, frase: 'Densidade é uma razão (indivíduos por área), e não o produto dos dois valores.', motivo: 'multiplicou em vez de dividir' },
          { valor: n - a, frase: 'Densidade compara indivíduos com área por divisão, e não por subtração.', motivo: 'subtraiu em vez de dividir' },
        ],
        d,
        tol,
      ),
      resolucao: `Densidade = número de indivíduos ÷ área = ${fn(n)} ÷ ${fn(a)} = ${fn(d, 1)} árvores por hectare.`,
      dicas: ['Densidade é quantos indivíduos há em cada unidade de área.', 'Divida o número de indivíduos pela área.', 'Confira a unidade pedida (por hectare).'],
      licao: 'Densidade populacional = número de indivíduos ÷ área (ou volume) ocupada.',
      dados: { variante: 'densidade', extra: { n, a } },
    }
  }

  if (nivel === 2) {
    const v = escolher(rng, ['exponencial', 'taxa', 'marcacao'] as const)
    if (v === 'exponencial') {
      const [n0, r, t, final] = escolher(rng, COMBOS_EXP)
      const tol = 0.5
      return {
        enunciado: `Uma população de bactérias tem ${fn(n0)} indivíduos e cresce ${fn(r * 100, 0)} % a cada hora, sem limitação de alimento ou espaço, sempre sobre o total da hora anterior. Quantos indivíduos há depois de ${t} horas?`,
        resposta: final,
        tolerancia: tol,
        unidade: 'indivíduos',
        erros: limpar(
          [
            { valor: n0 * (1 + r * t), frase: `Você somou ${fn(r * 100, 0)} % do valor inicial a cada hora (crescimento linear). Aqui o aumento é sempre sobre o total da hora anterior: cresce em progressão geométrica.`, motivo: 'tratou o crescimento como linear' },
            { valor: n0 * (1 + r) ** (t - 1), frase: `Faltou uma hora: são ${t} multiplicações por ${fn(1 + r, 2)}.`, motivo: 'contou uma hora a menos' },
            { valor: n0 * (1 + r) ** (t + 1), frase: `Há uma multiplicação a mais: foram ${t} horas.`, motivo: 'contou uma hora a mais' },
            { valor: n0 * r ** t, frase: `A cada hora o total é multiplicado por ${fn(1 + r, 2)} (o que havia mais o acréscimo), e não por ${fn(r, 2)}.`, motivo: 'multiplicou só pela taxa' },
          ],
          final,
          tol,
        ),
        resolucao: `A cada hora, multiplica-se por ${fn(1 + r, 2)}. Depois de ${t} horas: ${fn(n0)} × ${fn(1 + r, 2)}^${t} = ${fn(final)}.`,
        dicas: ['Cada hora o total aumenta em uma porcentagem do total da hora anterior.', `O fator por hora é 1 + ${fn(r, 2)}.`, 'N = N₀ × fatorᵗ.'],
        licao: 'Crescimento exponencial: N = N₀ (1 + r)ᵗ. A cada intervalo, a população é multiplicada pelo mesmo fator.',
        dados: { variante: 'exponencial', n0, r, extra: { n0, r, t } },
      }
    }
    if (v === 'taxa') {
      const pct = escolher(rng, [10, 20, 25, 50, 80, 100, 150])
      const n0 = escolher(rng, [200, 400, 500, 800, 1000, 2000])
      const n1 = n0 * (1 + pct / 100)
      const tol = 0.05
      return {
        enunciado: `Uma população de capivaras passou de ${fn(n0)} para ${fn(n1)} indivíduos em um ano. Qual foi a taxa de crescimento anual, em porcentagem?`,
        resposta: pct,
        tolerancia: tol,
        unidade: '%',
        erros: limpar(
          [
            { valor: (n1 / n0) * 100, frase: `${fn((n1 / n0) * 100, 1)} % é a razão entre o valor final e o inicial. A taxa de crescimento é o aumento relativo: desconte os 100 % de partida.`, motivo: 'deu a razão final/inicial' },
            { valor: n1 - n0, frase: `${fn(n1 - n0)} é o aumento em indivíduos. A taxa pede o aumento em porcentagem do tamanho inicial.`, motivo: 'deu o aumento absoluto' },
            { valor: ((n1 - n0) / n1) * 100, frase: 'Você dividiu pelo tamanho final. A taxa de crescimento é medida em relação ao tamanho inicial.', motivo: 'dividiu pelo valor final' },
          ],
          pct,
          tol,
        ),
        resolucao: `Aumento = ${fn(n1)} − ${fn(n0)} = ${fn(n1 - n0)}. Taxa = ${fn(n1 - n0)} ÷ ${fn(n0)} × 100 = ${fn(pct)} %.`,
        dicas: ['Primeiro calcule o aumento absoluto.', 'Compare o aumento com o tamanho inicial.', 'Multiplique por 100.'],
        licao: 'Taxa de crescimento = (N final − N inicial) ÷ N inicial.',
        dados: { variante: 'taxa', n0, extra: { n0, n1 } },
      }
    }
    const [m, cap, rec, N] = escolher(rng, COMBOS_LINCOLN)
    const tol = 0.5
    return {
      enunciado: `Para estimar o tamanho de uma população de peixes de um lago, pesquisadores capturaram e marcaram ${fn(m)} peixes e os soltaram. Dias depois, capturaram ${fn(cap)} peixes, dos quais ${fn(rec)} estavam marcados. Supondo que os marcados se misturaram à população, qual é o tamanho estimado da população?`,
      resposta: N,
      tolerancia: tol,
      unidade: 'peixes',
      erros: limpar(
        [
          { valor: m * cap, frase: 'Faltou dividir pelo número de marcados recapturados.', motivo: 'esqueceu de dividir' },
          { valor: (m * rec) / cap, frase: 'Os termos estão trocados: N = marcados × capturados na 2ª vez ÷ marcados recapturados.', motivo: 'trocou os termos da proporção' },
          { valor: (m + cap) / rec, frase: 'A estimativa vem de uma proporção (regra de três), e não de uma soma.', motivo: 'somou em vez de usar proporção' },
          { valor: cap - rec + m, frase: 'Isso conta os peixes diferentes que já passaram pelas mãos dos pesquisadores, e não estima a população inteira.', motivo: 'contou só os capturados' },
        ],
        N,
        tol,
      ),
      resolucao: `Proporção de marcados na amostra = proporção na população: ${fn(rec)}/${fn(cap)} = ${fn(m)}/N. Logo N = ${fn(m)} × ${fn(cap)} ÷ ${fn(rec)} = ${fn(N)}.`,
      dicas: ['A fração de marcados na segunda captura estima a fração de marcados na população toda.', 'Monte a proporção: recapturados/capturados = marcados/N.', 'Isole N.'],
      licao: 'Marcação-recaptura: N = (marcados × capturados) ÷ marcados recapturados.',
      dados: { variante: 'marcacao', extra: { m, cap, rec } },
    }
  }

  // nível 3: logístico
  const v = escolher(rng, ['taxaLogistica', 'maxima', 'nMaxima'] as const)
  const r = escolher(rng, [0.1, 0.2, 0.25, 0.5])
  const k = escolher(rng, [200, 400, 500, 800, 1000, 2000])
  if (v === 'taxaLogistica') {
    const fracs = [0.1, 0.2, 0.25, 0.4, 0.6, 0.75, 0.8, 0.9]
    let n = k * escolher(rng, fracs)
    for (let i = 0; i < 20 && Math.abs(taxaLogistica(r, n, k) * 100 - Math.round(taxaLogistica(r, n, k) * 100)) > 1e-9; i++) n = k * escolher(rng, fracs)
    if (Math.abs(taxaLogistica(r, n, k) * 100 - Math.round(taxaLogistica(r, n, k) * 100)) > 1e-9) n = k / 2
    const resposta = Math.round(taxaLogistica(r, n, k) * 1e6) / 1e6
    const tol = Math.max(0.005, resposta * 0.002)
    return {
      enunciado: `O crescimento de uma população em um ambiente com recursos limitados segue dN/dt = r · N · (1 − N/K), com r = ${fn(r, 2)} por ano e capacidade de suporte K = ${fn(k)} indivíduos. Quando a população tem N = ${fn(n)} indivíduos, com que velocidade ela cresce, em indivíduos por ano?`,
      resposta,
      tolerancia: tol,
      unidade: 'indivíduos/ano',
      erros: limpar(
        [
          { valor: r * n, frase: `${fn(r * n, 2)} seria o crescimento sem limitação (exponencial). Falta o fator (1 − N/K), que representa a resistência do ambiente.`, motivo: 'ignorou a resistência do ambiente' },
          { valor: (r * k) / 4, frase: `${fn((r * k) / 4, 2)} é a taxa máxima da curva, que só ocorre quando N = K/2.`, motivo: 'usou a taxa máxima' },
          { valor: r * n * (n / k), frase: 'O fator de resistência é (1 − N/K), e não N/K.', motivo: 'usou N/K no lugar de 1 − N/K' },
          { valor: r * (k - n), frase: 'Faltou multiplicar pelo número de indivíduos e dividir por K: a taxa é r · N · (K − N) ÷ K.', motivo: 'montou a fórmula incompleta' },
        ],
        resposta,
        tol,
      ),
      resolucao: `dN/dt = ${fn(r, 2)} × ${fn(n)} × (1 − ${fn(n)}/${fn(k)}) = ${fn(r * n, 3)} × ${fn(1 - n / k, 3)} = ${fn(resposta, 3)} indivíduos por ano.`,
      dicas: ['Substitua os valores na fórmula.', 'Calcule primeiro 1 − N/K.', 'Multiplique r, N e o fator.'],
      licao: 'No modelo logístico a taxa é r·N·(1 − N/K): o fator (1 − N/K) é a resistência ambiental e vai a zero quando N chega a K.',
      dados: { variante: 'taxaLogistica', r, k, n, extra: { r, k, n } },
    }
  }
  if (v === 'maxima') {
    const resposta = (r * k) / 4
    const tol = Math.max(0.005, resposta * 0.002)
    return {
      enunciado: `Uma população cresce segundo dN/dt = r · N · (1 − N/K), com r = ${fn(r, 2)} por ano e K = ${fn(k)}. Qual é a maior velocidade de crescimento que essa população pode atingir, em indivíduos por ano?`,
      resposta,
      tolerancia: tol,
      unidade: 'indivíduos/ano',
      erros: limpar(
        [
          { valor: r * k, frase: 'r × K ignora o fator N(1 − N/K), cujo valor máximo é K/4. A taxa máxima é r·K/4.', motivo: 'ignorou a forma da curva' },
          { valor: (r * k) / 2, frase: 'K/2 é o tamanho da população em que a taxa é máxima, mas o valor da taxa é r·(K/2)·(1/2) = r·K/4.', motivo: 'confundiu tamanho com taxa' },
          { valor: r * 0.5, frase: 'A taxa máxima depende também de K: r·K/4.', motivo: 'esqueceu K' },
          { valor: k / 2, frase: `${fn(k / 2)} é o tamanho da população (K/2) em que o crescimento é mais rápido, e não a velocidade.`, motivo: 'deu o tamanho em que a taxa é máxima' },
        ],
        resposta,
        tol,
      ),
      resolucao: `A taxa é máxima em N = K/2 = ${fn(k / 2)}: dN/dt = ${fn(r, 2)} × ${fn(k / 2)} × (1 − 1/2) = ${fn(resposta, 3)} indivíduos por ano (r·K/4).`,
      dicas: ['O crescimento logístico é mais rápido na metade da capacidade de suporte.', 'Calcule a taxa para N = K/2.', 'A conta dá r·K/4.'],
      licao: 'No crescimento logístico, a velocidade máxima ocorre em N = K/2 e vale r·K/4.',
      dados: { variante: 'maxima', r, k, extra: { r, k } },
    }
  }
  const resposta = k / 2
  const tol = 0.5
  return {
    enunciado: `Uma população cresce segundo o modelo logístico, com capacidade de suporte K = ${fn(k)} indivíduos e r = ${fn(r, 2)} por ano. Com quantos indivíduos o número de nascimentos menos mortes por ano é máximo, ou seja, em que tamanho a população cresce mais rápido?`,
    resposta,
    tolerancia: tol,
    unidade: 'indivíduos',
    erros: limpar(
      [
        { valor: k, frase: 'Em N = K a população está estável: a resistência do ambiente anula o crescimento e a taxa é zero.', motivo: 'achou que o crescimento é máximo em K' },
        { valor: k / 4, frase: 'Em K/4 a taxa ainda está subindo; a máxima ocorre mais adiante, na metade de K.', motivo: 'escolheu K/4' },
        { valor: (r * k) / 4, frase: `${fn((r * k) / 4, 2)} é o valor da taxa máxima (indivíduos por ano), e não o tamanho em que ela ocorre.`, motivo: 'deu a taxa em vez do tamanho' },
        { valor: (3 * k) / 4, frase: 'Depois de K/2 a resistência do ambiente aumenta e a taxa cai; o máximo está em K/2.', motivo: 'escolheu 3K/4' },
      ],
      resposta,
      tol,
    ),
    resolucao: `A taxa r·N·(1 − N/K) é uma parábola em N com zeros em N = 0 e N = K; o máximo fica no meio: N = K/2 = ${fn(resposta)}.`,
    dicas: ['A taxa vale zero em N = 0 e em N = K.', 'Entre os dois zeros, a taxa sobe e depois desce.', 'O ponto de máximo fica no meio dos dois zeros.'],
    licao: 'No crescimento logístico, a taxa máxima ocorre em N = K/2, o ponto de inflexão da curva em S.',
    dados: { variante: 'nMaxima', r, k, extra: { r, k } },
  }
}

/* ================================================================== relações ecológicas e sucessão */

export interface Relacao {
  id: string
  nome: string
  grupo: 'interespecifica' | 'intraespecifica'
  /** sinais para cada lado: + beneficiado, − prejudicado, 0 sem efeito */
  sinais?: string
  definicao: string
}

export const RELACOES: Relacao[] = [
  { id: 'mutualismo', nome: 'Mutualismo', grupo: 'interespecifica', sinais: '+/+', definicao: 'as duas espécies se beneficiam e dependem uma da outra (a associação é obrigatória)' },
  { id: 'protocooperacao', nome: 'Protocooperação', grupo: 'interespecifica', sinais: '+/+', definicao: 'as duas espécies se beneficiam, mas cada uma consegue viver sem a outra' },
  { id: 'comensalismo', nome: 'Comensalismo', grupo: 'interespecifica', sinais: '+/0', definicao: 'uma espécie se beneficia e a outra não é beneficiada nem prejudicada' },
  { id: 'predacao', nome: 'Predação', grupo: 'interespecifica', sinais: '+/−', definicao: 'um animal captura e mata outro para se alimentar' },
  { id: 'parasitismo', nome: 'Parasitismo', grupo: 'interespecifica', sinais: '+/−', definicao: 'o parasita vive à custa do hospedeiro, prejudicando-o, mas em geral sem matá-lo logo' },
  { id: 'competicao', nome: 'Competição interespecífica', grupo: 'interespecifica', sinais: '−/−', definicao: 'indivíduos de espécies diferentes disputam o mesmo recurso e as duas são prejudicadas' },
  { id: 'amensalismo', nome: 'Amensalismo', grupo: 'interespecifica', sinais: '0/−', definicao: 'uma espécie é prejudicada por substâncias liberadas por outra, que não é afetada' },
  { id: 'colonia', nome: 'Colônia', grupo: 'intraespecifica', definicao: 'indivíduos da mesma espécie unidos anatomicamente, formando uma unidade' },
  { id: 'sociedade', nome: 'Sociedade', grupo: 'intraespecifica', definicao: 'indivíduos da mesma espécie, anatomicamente independentes, que cooperam com divisão de trabalho' },
  { id: 'competicaoIntra', nome: 'Competição intraespecífica', grupo: 'intraespecifica', definicao: 'indivíduos da mesma espécie disputam o mesmo recurso' },
  { id: 'canibalismo', nome: 'Canibalismo', grupo: 'intraespecifica', definicao: 'um indivíduo mata e devora outro da própria espécie' },
]

export const relacao = (id: string) => RELACOES.find((r) => r.id === id) as Relacao

/** Pares que costumam ser confundidos entre si. */
export const CONFUSAVEIS: Record<string, string[]> = {
  mutualismo: ['protocooperacao'],
  protocooperacao: ['mutualismo'],
  comensalismo: ['protocooperacao', 'amensalismo'],
  predacao: ['parasitismo', 'canibalismo'],
  parasitismo: ['predacao'],
  competicao: ['competicaoIntra', 'amensalismo'],
  amensalismo: ['comensalismo', 'competicao'],
  colonia: ['sociedade'],
  sociedade: ['colonia'],
  competicaoIntra: ['competicao'],
  canibalismo: ['predacao', 'competicaoIntra'],
}

export interface ExemploRelacao {
  relacao: string
  texto: string
  /** o que, no texto, decide a classificação */
  pista: string
}

export const EXEMPLOS: ExemploRelacao[] = [
  { relacao: 'mutualismo', texto: 'No intestino dos cupins vivem protozoários que digerem a celulose da madeira e recebem alimento e abrigo. Sem os protozoários, o cupim morre de fome; sem o cupim, eles também não sobrevivem.', pista: 'os dois se beneficiam e nenhum vive sem o outro' },
  { relacao: 'mutualismo', texto: 'Num líquen, as células de uma alga fazem fotossíntese e alimentam o fungo, que as protege da secura e retém água e sais minerais. Os dois vivem tão associados que parecem um só organismo.', pista: 'os dois se beneficiam e vivem associados de modo obrigatório' },
  { relacao: 'protocooperacao', texto: 'O caranguejo-eremita carrega anêmonas-do-mar sobre a concha: elas o protegem com tentáculos urticantes e ganham transporte e restos de comida. Cada um dos dois consegue viver sem o outro.', pista: 'os dois se beneficiam, mas nenhum depende do outro para sobreviver' },
  { relacao: 'protocooperacao', texto: 'Formigas defendem pulgões de predadores e, em troca, bebem o líquido açucarado que eles eliminam. Cada espécie pode viver sem a outra.', pista: 'os dois se beneficiam, mas nenhum depende do outro para sobreviver' },
  { relacao: 'comensalismo', texto: 'A rêmora fixa-se ao corpo de um tubarão, é transportada por ele e aproveita os restos de suas refeições. O tubarão não ganha nem perde nada com isso.', pista: 'a rêmora se beneficia e o tubarão não é afetado' },
  { relacao: 'comensalismo', texto: 'Garças-vaqueiras acompanham o gado e capturam os insetos que se espantam do capim com a passagem dos animais. O gado não é beneficiado nem prejudicado.', pista: 'a garça se beneficia e o gado não é afetado' },
  { relacao: 'predacao', texto: 'Uma onça-pintada caça e mata uma capivara para se alimentar.', pista: 'a onça se beneficia e a capivara é morta' },
  { relacao: 'predacao', texto: 'Uma coruja captura e devora um rato-do-mato.', pista: 'a coruja se beneficia e o rato é morto' },
  { relacao: 'parasitismo', texto: 'A lombriga (Ascaris) vive no intestino de uma pessoa, absorvendo parte dos nutrientes e enfraquecendo-a, mas sem matá-la de imediato.', pista: 'o parasita se beneficia e o hospedeiro é prejudicado, porém continua vivo' },
  { relacao: 'parasitismo', texto: 'A erva-de-passarinho fixa-se nos galhos de uma árvore e retira dela água e sais minerais, enfraquecendo-a aos poucos.', pista: 'a erva se beneficia e a árvore é prejudicada, porém continua viva' },
  { relacao: 'competicao', texto: 'Duas espécies de aves de um bosque se alimentam dos mesmos frutos. Quando os frutos escasseiam, as duas se reproduzem menos.', pista: 'as duas são prejudicadas pela disputa do mesmo recurso' },
  { relacao: 'competicao', texto: 'Duas espécies de gramíneas crescem lado a lado e disputam luz e água. As duas crescem menos do que cresceriam sozinhas.', pista: 'as duas são prejudicadas pela disputa de luz e água' },
  { relacao: 'amensalismo', texto: 'O fungo Penicillium produz uma substância que impede o crescimento de bactérias vizinhas. Para essa classificação, considera-se que o fungo não é afetado.', pista: 'as bactérias são prejudicadas e o fungo não é afetado' },
  { relacao: 'amensalismo', texto: 'Eucaliptos liberam no solo substâncias que dificultam a germinação de outras plantas ao redor. Os eucaliptos não são afetados.', pista: 'as outras plantas são prejudicadas e o eucalipto não é afetado' },
  { relacao: 'colonia', texto: 'Os pólipos de um coral estão ligados pelo corpo, compartilham tecidos e formam uma estrutura única.', pista: 'os indivíduos são da mesma espécie e estão unidos anatomicamente' },
  { relacao: 'colonia', texto: 'Uma caravela-portuguesa é formada por indivíduos da mesma espécie unidos entre si, cada tipo com uma função.', pista: 'os indivíduos são da mesma espécie e estão unidos anatomicamente' },
  { relacao: 'sociedade', texto: 'Numa colmeia, a rainha, as operárias e os zangões da mesma espécie dividem tarefas, mas cada abelha é um indivíduo independente, sem ligação anatômica.', pista: 'os indivíduos são da mesma espécie, cooperam e são anatomicamente independentes' },
  { relacao: 'sociedade', texto: 'Em um formigueiro, umas formigas cuidam das larvas, outras buscam alimento e outras defendem o ninho; os indivíduos são fisicamente separados.', pista: 'os indivíduos são da mesma espécie, cooperam e são anatomicamente independentes' },
  { relacao: 'competicaoIntra', texto: 'Mudas de uma mesma espécie de árvore germinaram muito próximas e disputam luz, água e nutrientes; as menores crescem menos.', pista: 'a disputa ocorre entre indivíduos da mesma espécie' },
  { relacao: 'competicaoIntra', texto: 'Dois machos de uma mesma espécie de ave disputam o mesmo território para se reproduzir.', pista: 'a disputa ocorre entre indivíduos da mesma espécie' },
  { relacao: 'canibalismo', texto: 'Um peixe adulto devora filhotes da própria espécie.', pista: 'o predador e a presa são da mesma espécie' },
  { relacao: 'canibalismo', texto: 'A fêmea do louva-a-deus às vezes devora o macho da própria espécie depois da cópula.', pista: 'o predador e a presa são da mesma espécie' },
]

/** Descrição de cada relação em termos de efeitos, para a pergunta sobre experimentos. */
export const EFEITOS: { relacao: string; texto: string }[] = [
  { relacao: 'comensalismo', texto: 'A espécie A cresce mais quando a espécie B está presente, e a população de B não muda.' },
  { relacao: 'amensalismo', texto: 'A população da espécie A diminui quando a espécie B está presente, e a população de B não muda.' },
  { relacao: 'competicao', texto: 'As populações de A e de B crescem menos quando as duas ocupam o mesmo ambiente do que quando estão separadas, e elas disputam o mesmo alimento.' },
]

export interface ItemBanco {
  pergunta: string
  certa: { texto: string; porque: string }
  erradas: Opc[]
  licao: string
  dicas: string[]
}

/** Sucessão ecológica e comunidades. */
export const SUCESSAO: { nivel: Nivel; item: ItemBanco }[] = [
  {
    nivel: 2,
    item: {
      pergunta: 'Qual dos casos abaixo é um exemplo de sucessão ecológica primária?',
      certa: { texto: 'Líquens e musgos colonizam uma rocha nua recém-exposta e, ao longo de séculos, formam solo e permitem a chegada de plantas maiores.', porque: 'Na sucessão primária o local nunca teve comunidade nem solo: os pioneiros (líquens, musgos) começam do zero.' },
      erradas: [
        { texto: 'Uma pastagem abandonada volta a ser coberta por arbustos e, depois, por mata, a partir do solo e das sementes que já estavam ali.', porque: 'Esse é um caso de sucessão secundária: já havia solo e sementes.', motivo: 'confundiu sucessão primária com secundária' },
        { texto: 'Uma floresta madura mantém, por décadas, a mesma composição de espécies.', porque: 'Isso descreve uma comunidade clímax, estável, e não um processo de sucessão.', motivo: 'confundiu sucessão com clímax' },
        { texto: 'Uma população de coelhos cresce até estabilizar na capacidade de suporte do ambiente.', porque: 'Isso é crescimento populacional de uma espécie, e não a substituição de comunidades.', motivo: 'confundiu sucessão com crescimento populacional' },
      ],
      licao: 'Sucessão primária: começa em substrato sem solo nem comunidade prévia (rocha nua, duna). Secundária: começa onde já havia solo e sementes.',
      dicas: ['Pergunte-se: existia solo e comunidade antes?', 'Primária é a que começa do zero.', 'Rocha nua é o exemplo clássico.'],
    },
  },
  {
    nivel: 2,
    item: {
      pergunta: 'Um trecho de mata é derrubado para pasto e depois abandonado. Com o tempo, a vegetação nativa volta. Esse processo é uma sucessão:',
      certa: { texto: 'Secundária, porque o solo e o banco de sementes permanecem.', porque: 'Houve distúrbio, mas o solo continua lá com sementes e raízes: por isso a recuperação é mais rápida que a sucessão primária.' },
      erradas: [
        { texto: 'Primária, porque a vegetação foi totalmente removida.', porque: 'A sucessão primária exige local sem solo nem vida anterior. Aqui o solo persistiu.', motivo: 'ignorou a presença do solo' },
        { texto: 'Clímax, porque a mata volta à forma original.', porque: 'Clímax é o estágio final e estável da sucessão, e não o nome do processo.', motivo: 'confundiu clímax com sucessão' },
        { texto: 'Um caso de competição entre espécies, e não uma sucessão.', porque: 'Há competição durante a sucessão, mas o processo geral de substituição das comunidades é a sucessão.', motivo: 'confundiu uma interação com o processo' },
      ],
      licao: 'A sucessão secundária se dá onde o solo foi preservado (após queimada, desmatamento, abandono agrícola) e é mais rápida que a primária.',
      dicas: ['O solo ainda existe depois da derrubada?', 'Se existe, o processo não começa do zero.', 'Isso o torna secundário.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'Por que a sucessão secundária costuma ser bem mais rápida que a primária?',
      certa: { texto: 'Porque o solo, o banco de sementes e as raízes remanescentes já existem.', porque: 'Sem precisar formar solo, as plantas germinam e rebrotam logo, acelerando a recuperação.' },
      erradas: [
        { texto: 'Porque a sucessão secundária ocorre em climas mais quentes.', porque: 'O clima não é o fator que distingue os dois tipos de sucessão.', motivo: 'atribuiu a diferença ao clima' },
        { texto: 'Porque a sucessão secundária não passa por espécies pioneiras.', porque: 'Também há pioneiras (ervas, arbustos de crescimento rápido); o que muda é o ponto de partida.', motivo: 'achou que não há pioneiras' },
        { texto: 'Porque a sucessão primária ocorre sempre em ambientes aquáticos.', porque: 'A sucessão primária ocorre em substratos sem vida, como rocha nua ou dunas, e não apenas na água.', motivo: 'associou a sucessão primária à água' },
      ],
      licao: 'Na sucessão secundária o solo e as sementes sobreviveram ao distúrbio, por isso a comunidade se recompõe mais depressa.',
      dicas: ['O que sobra depois de uma queimada ou desmatamento?', 'Na primária, é preciso formar o solo antes de tudo.', 'Menos etapas, mais rapidez.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'O que são espécies pioneiras na sucessão ecológica?',
      certa: { texto: 'As primeiras a colonizar um ambiente, tolerantes a condições difíceis; sua presença modifica o ambiente e favorece outras espécies.', porque: 'Pioneiras abrem caminho: acumulam matéria orgânica, formam solo e dão sombra, permitindo a chegada de espécies de estágios seguintes.' },
      erradas: [
        { texto: 'As espécies dominantes da comunidade clímax.', porque: 'Isso descreve espécies clímax, que aparecem no fim do processo.', motivo: 'confundiu pioneiras com clímax' },
        { texto: 'As espécies que mais competem com os predadores.', porque: 'Ser pioneira diz respeito ao momento de chegada ao ambiente, e não à competição com predadores.', motivo: 'ligou pioneiras à competição' },
        { texto: 'As espécies que só vivem em florestas tropicais.', porque: 'Pioneiras existem em qualquer bioma; o que as define é a chegada inicial.', motivo: 'restringiu o conceito a um bioma' },
      ],
      licao: 'Pioneiras colonizam primeiro e modificam o ambiente; a comunidade clímax é o estágio final, relativamente estável.',
      dicas: ['Pioneira vem do sentido de “ser a primeira”.', 'Pense em líquens sobre rocha nua.', 'Elas preparam o ambiente para as seguintes.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'Ao longo de uma sucessão ecológica, até a comunidade clímax, o que tende a acontecer?',
      certa: { texto: 'A diversidade de espécies, a biomassa e a complexidade das teias alimentares tendem a aumentar.', porque: 'A comunidade se enriquece à medida que o ambiente é modificado, até se estabilizar no clímax.' },
      erradas: [
        { texto: 'A diversidade de espécies diminui, e sobram só as pioneiras.', porque: 'As pioneiras tendem a ser substituídas, e o número de espécies costuma crescer.', motivo: 'inverteu o sentido da diversidade' },
        { texto: 'As teias alimentares ficam mais simples e com menos nichos.', porque: 'Com mais espécies surgem mais nichos e teias mais complexas.', motivo: 'inverteu a complexidade da teia' },
        { texto: 'A comunidade volta ao estado inicial, como num ciclo repetitivo.', porque: 'A sucessão é direcional, rumo a um estágio estável; só um novo distúrbio reinicia o processo.', motivo: 'viu a sucessão como cíclica' },
      ],
      licao: 'Na sucessão, a riqueza de espécies, a biomassa e a complexidade das teias tendem a crescer até a comunidade clímax.',
      dicas: ['Compare uma rocha nua com uma mata madura.', 'Mais espécies significam mais interações.', 'O clímax é estável, mas não parado.'],
    },
  },
]

const ID_OPCOES_RELACAO: Record<Nivel, string[]> = {
  1: ['mutualismo', 'comensalismo', 'predacao', 'parasitismo', 'competicao', 'amensalismo', 'colonia', 'sociedade', 'protocooperacao', 'canibalismo', 'competicaoIntra'],
  2: ['mutualismo', 'comensalismo', 'predacao', 'parasitismo', 'competicao', 'amensalismo', 'colonia', 'sociedade', 'protocooperacao', 'canibalismo', 'competicaoIntra'],
  3: ['mutualismo', 'comensalismo', 'predacao', 'parasitismo', 'competicao', 'amensalismo', 'colonia', 'sociedade', 'protocooperacao', 'canibalismo', 'competicaoIntra'],
}

export interface DadosRelacao {
  tipo: 'nome' | 'exemplo' | 'efeitos' | 'sucessao'
  relacao?: string
}

function explicaErro(certa: Relacao, errada: Relacao, ex: ExemploRelacao): string {
  return `Não é ${errada.nome}: nessa relação ${errada.definicao}. No caso descrito, ${ex.pista}, o que caracteriza ${certa.nome.toLowerCase()}.`
}

export function gerarRelacoes(rng: Rng, nivel: Nivel): InstanciaMulti<DadosRelacao> {
  const dicasBase = ['Identifique se as espécies são iguais ou diferentes.', 'Veja quem ganha, quem perde e quem fica indiferente.', 'Compare com a definição de cada relação.']
  if (nivel >= 2 && rng() < (nivel === 2 ? 0.25 : 0.35)) {
    const candidatos = SUCESSAO.filter((s) => s.nivel === nivel)
    const { item } = escolher(rng, candidatos.length ? candidatos : SUCESSAO)
    return montar<DadosRelacao>(rng, item.certa, item.erradas, { enunciado: item.pergunta, resolucao: item.certa.porque, dicas: item.dicas, licao: item.licao, dados: { tipo: 'sucessao' } })
  }

  if (nivel === 3 && rng() < 0.4) {
    // experimento descrito por efeitos
    const e = escolher(rng, EFEITOS)
    const certa = relacao(e.relacao)
    const outros = embaralhar(
      rng,
      ['mutualismo', 'predacao', 'comensalismo', 'amensalismo', 'competicao'].filter((i) => i !== e.relacao),
    ).slice(0, 3)
    return montar<DadosRelacao>(
      rng,
      { texto: certa.nome, porque: `${certa.nome}: ${certa.definicao}. Os efeitos descritos (${certa.sinais}) são os dessa relação.` },
      outros.map((i) => {
        const o = relacao(i)
        return { texto: o.nome, porque: `Em ${o.nome.toLowerCase()} os efeitos seriam ${o.sinais}: ${o.definicao}. Não é o que o texto descreve.`, motivo: 'trocou os efeitos sobre as espécies' }
      }),
      {
        enunciado: `Em um estudo, observou-se o seguinte: ${e.texto} Que relação ecológica entre A e B esse resultado indica?`,
        resolucao: `${certa.nome} (${certa.sinais}): ${certa.definicao}.`,
        dicas: ['Traduza o texto em sinais: + (ganha), − (perde) e 0 (não muda) para A e para B.', 'Associe o par de sinais a uma relação.', 'Compare com a definição.'],
        licao: 'Mutualismo e protocooperação: +/+; comensalismo: +/0; predação e parasitismo: +/−; competição: −/−; amensalismo: 0/−.',
        dados: { tipo: 'efeitos', relacao: certa.id },
      },
    )
  }

  if (nivel === 3) {
    // qual exemplo representa a relação?
    const alvo = escolher(rng, EXEMPLOS.filter((ex) => relacao(ex.relacao).grupo === 'interespecifica' || rng() < 0.5))
    const certa = relacao(alvo.relacao)
    const conf = CONFUSAVEIS[certa.id] ?? []
    const preferidas = conf.map((c) => EXEMPLOS.filter((ex) => ex.relacao === c)).flat()
    const demais = EXEMPLOS.filter((ex) => ex.relacao !== certa.id && !conf.includes(ex.relacao))
    const erradasEx: ExemploRelacao[] = []
    for (const ex of embaralhar(rng, preferidas)) {
      if (erradasEx.length >= 2) break
      if (erradasEx.some((x) => x.relacao === ex.relacao)) continue
      erradasEx.push(ex)
    }
    for (const ex of embaralhar(rng, demais)) {
      if (erradasEx.length >= 3) break
      if (erradasEx.some((x) => x.relacao === ex.relacao)) continue
      erradasEx.push(ex)
    }
    if (erradasEx.length < 3) return gerarRelacoes(rng, 2)
    return montar<DadosRelacao>(
      rng,
      { texto: alvo.texto, porque: `Aqui ${alvo.pista}: é ${certa.nome.toLowerCase()}.` },
      erradasEx.map((ex) => {
        const o = relacao(ex.relacao)
        return { texto: ex.texto, porque: `Essa situação é ${o.nome.toLowerCase()}: ${ex.pista}. Em ${certa.nome.toLowerCase()}, ${certa.definicao}.`, motivo: `descrição de ${o.nome.toLowerCase()}` }
      }),
      {
        enunciado: `Qual das situações abaixo é um exemplo de ${certa.nome.toLowerCase()}?`,
        resolucao: `${certa.nome}: ${certa.definicao}. ${maiuscula(alvo.pista)}.`,
        dicas: ['Releia a definição da relação pedida.', 'Em cada situação, descubra quem se beneficia, quem é prejudicado e quem fica indiferente.', 'Atenção às pistas: “cada um vive sem o outro”, “mesma espécie”, “unidos anatomicamente”.'],
        licao: `${certa.nome}: ${certa.definicao}.`,
        dados: { tipo: 'exemplo', relacao: certa.id },
      },
    )
  }

  // níveis 1 e 2: dado um caso, qual é a relação?
  const ex = escolher(rng, EXEMPLOS)
  const certa = relacao(ex.relacao)
  const conf = CONFUSAVEIS[certa.id] ?? []
  const pool = ID_OPCOES_RELACAO[nivel].filter((i) => i !== certa.id)
  let outros: string[]
  if (nivel === 1) {
    const livres = pool.filter((i) => !conf.includes(i))
    outros = embaralhar(rng, livres).slice(0, 3)
  } else {
    const dificeis = embaralhar(rng, conf).slice(0, 2)
    const resto = embaralhar(rng, pool.filter((i) => !dificeis.includes(i)))
    outros = [...dificeis, ...resto].slice(0, 3)
  }
  return montar<DadosRelacao>(
    rng,
    { texto: certa.nome, porque: `${certa.nome}: ${certa.definicao}. No caso, ${ex.pista}.` },
    outros.map((i) => {
      const o = relacao(i)
      return { texto: o.nome, porque: explicaErro(certa, o, ex), motivo: `confundiu com ${o.nome.toLowerCase()}` }
    }),
    {
      enunciado: `${ex.texto} Que relação ecológica é essa?`,
      resolucao: `${certa.nome}: ${certa.definicao}. No caso, ${ex.pista}.`,
      dicas: dicasBase,
      licao: `${certa.nome}: ${certa.definicao}.`,
      dados: { tipo: 'nome', relacao: certa.id },
    },
  )
}

/* ================================================================== ciclos biogeoquímicos */

export interface Processo {
  id: string
  ciclo: 'carbono' | 'nitrogenio'
  nome: string
  de: string
  para: string
  quem: string
  /** grupo de organismos (ou agente) que o realiza: processos do mesmo grupo não aparecem juntos como alternativas */
  grupo: 'produtores' | 'todos' | 'decompositores' | 'queima' | 'fixadoras' | 'nitrificantes' | 'desnitrificantes'
  /** descrição que identifica o processo sem ambiguidade */
  descricao: string
}

export const PROCESSOS: Processo[] = [
  { id: 'fotossintese', ciclo: 'carbono', nome: 'fotossíntese', de: 'CO₂ da atmosfera', para: 'matéria orgânica dos produtores', quem: 'plantas e algas', grupo: 'produtores', descricao: 'fixa o carbono do CO₂ do ar em matéria orgânica, com uso de luz' },
  { id: 'respiracao', ciclo: 'carbono', nome: 'respiração celular', de: 'matéria orgânica das células', para: 'CO₂ liberado', quem: 'a maioria dos seres vivos', grupo: 'todos', descricao: 'quebra, dentro das células, a matéria orgânica para obter energia e libera CO₂' },
  { id: 'decomposicao', ciclo: 'carbono', nome: 'decomposição', de: 'restos e cadáveres', para: 'CO₂ e sais minerais no ambiente', quem: 'fungos e bactérias decompositores', grupo: 'decompositores', descricao: 'devolve ao ambiente o carbono de restos e cadáveres, por ação de fungos e bactérias' },
  { id: 'combustao', ciclo: 'carbono', nome: 'combustão', de: 'combustíveis fósseis ou biomassa', para: 'CO₂ lançado na atmosfera', quem: 'a queima (atividade humana e incêndios)', grupo: 'queima', descricao: 'lança CO₂ na atmosfera pela queima de combustíveis ou de biomassa' },
  { id: 'fixacao', ciclo: 'nitrogenio', nome: 'fixação biológica do nitrogênio', de: 'N₂ do ar', para: 'amônia / amônio (NH₃ / NH₄⁺)', quem: 'bactérias fixadoras (como Rhizobium e Azotobacter)', grupo: 'fixadoras', descricao: 'transforma o N₂ do ar em amônia, por ação de bactérias fixadoras' },
  { id: 'nitrificacao', ciclo: 'nitrogenio', nome: 'nitrificação', de: 'amônio (NH₄⁺)', para: 'nitrito e, depois, nitrato (NO₂⁻ e NO₃⁻)', quem: 'bactérias nitrificantes (Nitrosomonas e Nitrobacter)', grupo: 'nitrificantes', descricao: 'oxida o amônio a nitrito e nitrato, por ação de bactérias nitrificantes' },
  { id: 'assimilacao', ciclo: 'nitrogenio', nome: 'assimilação', de: 'nitrato do solo', para: 'proteínas e ácidos nucleicos das plantas', quem: 'plantas (e, depois, os animais que as comem)', grupo: 'produtores', descricao: 'incorpora o nitrato do solo às proteínas e aos ácidos nucleicos das plantas' },
  { id: 'amonificacao', ciclo: 'nitrogenio', nome: 'amonificação', de: 'compostos nitrogenados de restos e excretas', para: 'amônia / amônio (NH₃ / NH₄⁺)', quem: 'decompositores (fungos e bactérias)', grupo: 'decompositores', descricao: 'libera amônia a partir de proteínas e excretas, por ação de decompositores' },
  { id: 'desnitrificacao', ciclo: 'nitrogenio', nome: 'desnitrificação', de: 'nitrato (NO₃⁻)', para: 'N₂ liberado para o ar', quem: 'bactérias desnitrificantes (em solo pobre em oxigênio)', grupo: 'desnitrificantes', descricao: 'devolve nitrogênio ao ar na forma de N₂, a partir do nitrato, em solo pobre em oxigênio' },
]

export const processo = (id: string) => PROCESSOS.find((p) => p.id === id) as Processo

export interface DadosCiclo {
  tipo: 'descricao' | 'quem' | 'transforma' | 'cenario'
  ciclo?: 'carbono' | 'nitrogenio'
  processo?: string
}

export const CENARIOS: { nivel: Nivel; item: ItemBanco }[] = [
  {
    nivel: 3,
    item: {
      pergunta: 'Uma lavoura de soja cresce bem em um solo pobre em nitrogênio, sem adubo nitrogenado. Que processo do ciclo do nitrogênio explica isso?',
      certa: { texto: 'Fixação biológica por bactérias nos nódulos das raízes.', porque: 'Bactérias do gênero Rhizobium vivem nos nódulos da soja e convertem N₂ do ar em amônia, que a planta aproveita; em troca, recebem açúcares.' },
      erradas: [
        { texto: 'Desnitrificação, que acrescenta nitrato ao solo.', porque: 'A desnitrificação retira nitrato do solo e devolve N₂ ao ar: faz o oposto.', motivo: 'inverteu o sentido da desnitrificação' },
        { texto: 'Fotossíntese, que transforma N₂ em proteínas.', porque: 'A fotossíntese usa CO₂ e água; não incorpora N₂.', motivo: 'confundiu os ciclos do carbono e do nitrogênio' },
        { texto: 'Respiração celular, que libera nitrogênio das raízes.', porque: 'A respiração libera CO₂ a partir da matéria orgânica, e não fornece nitrogênio.', motivo: 'confundiu os ciclos do carbono e do nitrogênio' },
      ],
      licao: 'Leguminosas se associam a bactérias fixadoras (mutualismo): é por isso que enriquecem o solo em nitrogênio e são usadas em rotação de culturas.',
      dicas: ['De onde viria o nitrogênio sem adubo?', 'O ar tem 78 % de N₂, mas poucos seres o aproveitam.', 'Quais seres convertem N₂ em amônia?'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'Em solos encharcados, pobres em oxigênio, parte do nitrogênio do solo escapa para a atmosfera. Que processo é o responsável?',
      certa: { texto: 'Desnitrificação, feita por bactérias que transformam nitrato em N₂.', porque: 'Sem oxigênio, certas bactérias usam o nitrato no lugar do O₂ e liberam N₂ para o ar.' },
      erradas: [
        { texto: 'Nitrificação, que transforma amônio em nitrato.', porque: 'A nitrificação é aeróbica e mantém o nitrogênio no solo, na forma de nitrato.', motivo: 'confundiu nitrificação com desnitrificação' },
        { texto: 'Fixação biológica, que converte N₂ em amônia.', porque: 'A fixação traz N₂ para o solo, e não o retira.', motivo: 'inverteu o sentido do processo' },
        { texto: 'Assimilação, em que as plantas absorvem nitrato.', porque: 'A assimilação leva o nitrogênio do solo para as plantas, sem liberá-lo ao ar.', motivo: 'confundiu absorção pelas plantas com perda para o ar' },
      ],
      licao: 'Desnitrificação: nitrato → N₂, por bactérias anaeróbicas. Fecha o ciclo devolvendo o nitrogênio à atmosfera.',
      dicas: ['O nitrogênio vai para o ar na forma de qual substância?', 'Pense em quem usa o nitrato como substituto do oxigênio.', 'É o oposto da fixação.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'Qual é o maior reservatório de nitrogênio do planeta?',
      certa: { texto: 'A atmosfera, onde o N₂ forma cerca de 78 % do ar.', porque: 'O ar é o maior reservatório, mas o N₂ é pouco reativo: só alguns procariontes conseguem fixá-lo.' },
      erradas: [
        { texto: 'Os solos agrícolas, ricos em nitrato.', porque: 'O solo guarda muito menos nitrogênio utilizável que a atmosfera.', motivo: 'superestimou o solo' },
        { texto: 'Os seres vivos, nas proteínas.', porque: 'A biomassa contém pouco nitrogênio perto do que há no ar.', motivo: 'superestimou a biomassa' },
        { texto: 'Os oceanos, na forma de nitrato.', porque: 'Os oceanos guardam nitrogênio dissolvido, mas bem menos que o ar.', motivo: 'superestimou os oceanos' },
      ],
      licao: 'A atmosfera tem cerca de 78 % de N₂, mas a maioria dos organismos não o utiliza diretamente.',
      dicas: ['Qual gás é o mais abundante no ar?', 'Compare a quantidade disponível em cada reservatório.', 'A maior parte está no ar, pouco acessível.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'Por que o ciclo do nitrogênio depende de bactérias?',
      certa: { texto: 'Porque quase nenhum outro ser vivo consegue transformar o N₂ do ar em formas utilizáveis, nem converter amônio em nitrato.', porque: 'Procariontes realizam as etapas-chave: fixação, nitrificação e desnitrificação.' },
      erradas: [
        { texto: 'Porque as plantas não absorvem nitrogênio do solo.', porque: 'As plantas absorvem nitrato e amônio do solo; o gargalo é obter essas formas a partir do N₂.', motivo: 'negou a absorção pelas plantas' },
        { texto: 'Porque o nitrogênio só existe nos organismos mortos.', porque: 'O N₂ está no ar e compostos nitrogenados estão em todos os seres vivos.', motivo: 'restringiu o nitrogênio a organismos mortos' },
        { texto: 'Porque as bactérias produzem o nitrogênio do ar.', porque: 'As bactérias transformam o nitrogênio de uma forma em outra; elas não o criam.', motivo: 'achou que as bactérias criam nitrogênio' },
      ],
      licao: 'Fixação, nitrificação e desnitrificação são realizadas por bactérias; as plantas absorvem nitrato e amônio.',
      dicas: ['Quais etapas só bactérias fazem?', 'Elas não criam nitrogênio, apenas o convertem.', 'Pense na fixação do N₂.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'O excesso de adubo nitrogenado e fosfatado levado pela chuva a um lago pode provocar:',
      certa: { texto: 'Eutrofização: proliferação de algas, queda do oxigênio dissolvido na decomposição e morte de peixes.', porque: 'Os nutrientes estimulam as algas; ao morrerem, os decompositores consomem o oxigênio da água.' },
      erradas: [
        { texto: 'Chuva ácida, por liberar SO₂ no ar.', porque: 'A chuva ácida vem de óxidos de enxofre e nitrogênio lançados ao ar, e não de adubos que escorrem para a água.', motivo: 'confundiu eutrofização com chuva ácida' },
        { texto: 'Aumento do oxigênio dissolvido, porque as algas fazem fotossíntese.', porque: 'No fim do processo, a decomposição das algas mortas reduz o oxigênio.', motivo: 'viu só a fotossíntese e esqueceu a decomposição' },
        { texto: 'Destruição da camada de ozônio.', porque: 'O ozônio é afetado por CFCs, e não por nutrientes na água.', motivo: 'confundiu eutrofização com a camada de ozônio' },
      ],
      licao: 'Eutrofização: nutrientes em excesso → algas → morte e decomposição → queda de O₂ → morte de peixes.',
      dicas: ['O que o excesso de nutrientes estimula nas algas?', 'O que acontece quando elas morrem?', 'Quem consome oxigênio na decomposição?'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'Por que queimar combustíveis fósseis aumenta o CO₂ da atmosfera em relação à respiração dos seres vivos hoje?',
      certa: { texto: 'Porque devolve à atmosfera carbono que estava retido há milhões de anos, e não só o que circula no ciclo atual.', porque: 'A respiração e a decomposição devolvem o carbono que a fotossíntese acabou de fixar; a queima de fósseis acrescenta carbono antes isolado.' },
      erradas: [
        { texto: 'Porque os combustíveis fósseis produzem mais O₂ que CO₂.', porque: 'A combustão consome O₂ e produz CO₂.', motivo: 'inverteu os gases da combustão' },
        { texto: 'Porque a queima de combustíveis fósseis impede a fotossíntese.', porque: 'A queima não bloqueia a fotossíntese; o problema é o carbono extra lançado.', motivo: 'atribuiu o aumento a uma pausa da fotossíntese' },
        { texto: 'Porque a respiração não libera CO₂.', porque: 'A respiração libera CO₂; ela só não acrescenta carbono novo ao sistema.', motivo: 'negou que a respiração libere CO₂' },
      ],
      licao: 'Fósseis liberam carbono armazenado há milhões de anos, desequilibrando o ciclo; a respiração apenas devolve o carbono recém-fixado.',
      dicas: ['De onde vem o carbono da gasolina?', 'Compare com o carbono que a planta fixou no ano passado.', 'Pense em saldo: o que entra a mais?'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'Onde está armazenada a maior parte do carbono da Terra?',
      certa: { texto: 'Nas rochas e sedimentos (calcário, combustíveis fósseis).', porque: 'A litosfera guarda de longe a maior quantidade de carbono, mas ele circula muito devagar.' },
      erradas: [
        { texto: 'Na atmosfera, como CO₂.', porque: 'A atmosfera guarda uma fração pequena do carbono total.', motivo: 'superestimou a atmosfera' },
        { texto: 'Na biomassa das florestas.', porque: 'A biomassa é um reservatório importante e de rápida troca, mas bem menor que as rochas.', motivo: 'superestimou a biomassa' },
        { texto: 'Nos seres humanos e nos animais.', porque: 'A biomassa animal é muito pequena frente aos outros reservatórios.', motivo: 'superestimou a biomassa animal' },
      ],
      licao: 'O maior reservatório de carbono são as rochas sedimentares; os fluxos rápidos envolvem atmosfera, oceanos, solos e seres vivos.',
      dicas: ['Pense em calcário e carvão.', 'Compare a quantidade com a que está no ar.', 'O maior reservatório é também o mais lento.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'O desmatamento seguido de queimada afeta o ciclo do carbono porque:',
      certa: { texto: 'reduz a fotossíntese que retira CO₂ e libera, pela queima e pela decomposição, o carbono antes retido na biomassa.', porque: 'Menos árvores fixam CO₂ e a biomassa queimada ou decomposta lança CO₂ na atmosfera.' },
      erradas: [
        { texto: 'aumenta a fotossíntese, pois há mais luz no solo.', porque: 'Sem as árvores, a fotossíntese total do local cai.', motivo: 'esperava aumento da fotossíntese' },
        { texto: 'transforma CO₂ em O₂ pela queima.', porque: 'A queima consome O₂ e produz CO₂, e não o contrário.', motivo: 'inverteu a combustão' },
        { texto: 'não altera o ciclo, pois o carbono das árvores é diferente do carbono do ar.', porque: 'É o mesmo carbono, que circula entre biomassa e atmosfera.', motivo: 'achou que o carbono das árvores não circula' },
      ],
      licao: 'Desmatar reduz a retirada de CO₂ e, com a queima, devolve à atmosfera o carbono da biomassa.',
      dicas: ['Pense nos dois efeitos: fixar menos e liberar mais.', 'O que a queima produz?', 'Para onde vai o carbono da madeira queimada?'],
    },
  },
]

export function gerarCiclos(rng: Rng, nivel: Nivel): InstanciaMulti<DadosCiclo> {
  const nomeCiclo = (c: 'carbono' | 'nitrogenio') => (c === 'carbono' ? 'carbono' : 'nitrogênio')
  if (nivel === 3) {
    const { item } = escolher(rng, CENARIOS)
    return montar<DadosCiclo>(rng, item.certa, item.erradas, { enunciado: item.pergunta, resolucao: item.certa.porque, dicas: item.dicas, licao: item.licao, dados: { tipo: 'cenario' } })
  }
  if (nivel === 1) {
    const alvo = escolher(rng, PROCESSOS)
    const outros = embaralhar(
      rng,
      PROCESSOS.filter((p) => p.ciclo === alvo.ciclo && p.id !== alvo.id),
    ).slice(0, 3)
    return montar<DadosCiclo>(
      rng,
      { texto: alvo.nome, porque: `Na ${alvo.nome}, ${alvo.de} se transforma em ${alvo.para}, por ação de ${alvo.quem}.` },
      outros.map((o) => ({ texto: o.nome, porque: `${maiuscula(o.nome)}: ${o.de} → ${o.para} (${o.quem}). Não é o processo descrito.`, motivo: `confundiu com ${o.nome}` })),
      {
        enunciado: `No ciclo do ${nomeCiclo(alvo.ciclo)}, que processo ${alvo.descricao}?`,
        resolucao: `${maiuscula(alvo.nome)}: ${alvo.de} → ${alvo.para} (${alvo.quem}).`,
        dicas: ['Veja o que entra e o que sai no processo.', 'Descarte os processos que fazem o caminho contrário.', 'Pense em quem realiza cada processo.'],
        licao: `${maiuscula(alvo.nome)}: ${alvo.de} → ${alvo.para}.`,
        dados: { tipo: 'descricao', ciclo: alvo.ciclo, processo: alvo.id },
      },
    )
  }
  // nível 2: quem realiza o processo, ou qual transformação ocorre no ciclo do nitrogênio
  if (rng() < 0.5) {
    const alvo = escolher(rng, PROCESSOS.filter((p) => p.grupo !== 'todos' && p.grupo !== 'queima'))
    const outros = embaralhar(
      rng,
      PROCESSOS.filter((p) => p.grupo !== 'todos' && p.grupo !== 'queima' && p.grupo !== alvo.grupo),
    )
    const unicos: Processo[] = []
    for (const o of outros) if (!unicos.some((u) => u.grupo === o.grupo)) unicos.push(o)
    return montar<DadosCiclo>(
      rng,
      { texto: alvo.quem, porque: `A ${alvo.nome} (${alvo.de} → ${alvo.para}) é realizada por ${alvo.quem}.` },
      unicos.slice(0, 3).map((o) => ({ texto: o.quem, porque: `Esse grupo realiza a ${o.nome} (${o.de} → ${o.para}), e não a ${alvo.nome}.`, motivo: `trocou com os organismos da ${o.nome}` })),
      {
        enunciado: `Quem realiza a ${alvo.nome}, no ciclo do ${nomeCiclo(alvo.ciclo)}?`,
        resolucao: `${maiuscula(alvo.nome)}: ${alvo.de} → ${alvo.para}, por ${alvo.quem}.`,
        dicas: ['Lembre o que o processo transforma.', 'Associe o processo ao tipo de organismo: produtores, decompositores ou bactérias específicas.', 'Descarte os grupos que fazem outro processo.'],
        licao: `${maiuscula(alvo.nome)}: ${alvo.quem}.`,
        dados: { tipo: 'quem', ciclo: alvo.ciclo, processo: alvo.id },
      },
    )
  }
  const nitrogenio = PROCESSOS.filter((p) => p.ciclo === 'nitrogenio')
  const alvo = escolher(rng, nitrogenio)
  const outros = embaralhar(
    rng,
    nitrogenio.filter((p) => p.id !== alvo.id),
  ).slice(0, 3)
  return montar<DadosCiclo>(
    rng,
    { texto: `${alvo.de} → ${alvo.para}`, porque: `Essa transformação é a ${alvo.nome}, realizada por ${alvo.quem}.` },
    outros.map((o) => ({ texto: `${o.de} → ${o.para}`, porque: `Essa é a transformação da ${o.nome}, e não da ${alvo.nome}.`, motivo: `trocou com a ${o.nome}` })),
    {
      enunciado: `No ciclo do nitrogênio, qual das transformações abaixo corresponde à ${alvo.nome}?`,
      resolucao: `${maiuscula(alvo.nome)}: ${alvo.de} → ${alvo.para} (${alvo.quem}).`,
      dicas: ['Lembre o significado do nome do processo (fixar, nitrificar, assimilar, desnitrificar...).', 'Veja quem entra e quem sai em cada alternativa.', 'Descarte as transformações que pertencem a outro processo.'],
      licao: `${maiuscula(alvo.nome)}: ${alvo.de} → ${alvo.para}.`,
      dados: { tipo: 'transforma', ciclo: 'nitrogenio', processo: alvo.id },
    },
  )
}
