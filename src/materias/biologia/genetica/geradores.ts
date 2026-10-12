import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { fn, limpar, maiuscula, montar, type ItemBanco, type Opc } from '../comum/auxiliares'
import {
  GENOTIPOS_ABO,
  TIPOS_ABO,
  aglutinogenios,
  aglutininas,
  cruzar,
  distanciaCM,
  distribuicaoFenotipos,
  distribuicaoPoligenica,
  doadoresCompativeis,
  gametas,
  gametasLigados,
  hardyWeinbergX,
  podeReceber,
  porcento,
  probAfetadoXR,
  probFenotipo,
  prole,
  proleX,
  rotuloSangue,
  tiposDeGametas,
  tiposPossiveisDosFilhos,
  type Fracao,
  type TipoABO,
  type TipoSangue,
} from './calculo'

export { type ItemBanco }

const pct = (f: Fracao) => porcento(f)
/** Valor percentual com até 2 casas, arredondado para evitar ruído numérico. */
const r2 = (x: number) => Math.round(x * 100) / 100
const fenotipoTexto = (rotulo: string, nomes: { dom: string; rec: string }[]) =>
  rotulo
    .split(',')
    .map((f, i) => (f === 'dominante' ? nomes[i]?.dom : f === 'recessivo' ? nomes[i]?.rec : 'intermediário'))
    .join(' e ')

/* ================================================================== cruzamentos (porcentagens) */

export interface DadosCruzamento {
  variante: 'proporcao' | 'gametas' | 'incompleta' | 'di' | 'condicional' | 'filhos' | 'poligenia' | 'letal' | 'tres'
  pai?: string
  mae?: string
  /** classe pedida: genótipo ("Aa"), fenótipo ("dominante", "dominante,recessivo") ou padrão com alelos ("A_B_C_") */
  classe?: string
  extra?: Record<string, number>
}

const TRACOS = [
  { org: 'ervilhas', dom: 'sementes lisas', rec: 'sementes rugosas' },
  { org: 'ervilhas', dom: 'flores púrpuras', rec: 'flores brancas' },
  { org: 'cobaias', dom: 'pelagem preta', rec: 'pelagem marrom' },
  { org: 'drosófilas', dom: 'asas normais', rec: 'asas vestigiais' },
  { org: 'seres humanos', dom: 'pigmentação normal', rec: 'albinismo' },
  { org: 'tomateiros', dom: 'frutos vermelhos', rec: 'frutos amarelos' },
]

/** Classes genotípicas e fenotípicas de um cruzamento de um gene, com a porcentagem de cada uma. */
function classesMono(pai: string, mae: string, dom: string, rec: string) {
  const c = cruzar(pai, mae)
  const fen = distribuicaoFenotipos(pai, mae)
  const classes: { rotulo: string; valor: number; tipo: 'genotipo' | 'fenotipo' }[] = []
  for (const [g, f] of c) classes.push({ rotulo: `genótipo ${g}`, valor: pct(f), tipo: 'genotipo' })
  for (const [k, f] of fen) classes.push({ rotulo: k === 'dominante' ? `fenótipo ${dom}` : `fenótipo ${rec}`, valor: pct(f), tipo: 'fenotipo' })
  return classes
}

export function gerarCruzamentos(rng: Rng, nivel: Nivel): InstanciaNum<DadosCruzamento> {
  const tol = 0.1
  const dicasMendel = ['Escreva os gametas de cada genitor.', 'Monte o quadro de Punnett (ou multiplique as probabilidades dos gametas).', 'Some só as casas que têm o genótipo ou o fenótipo pedido.']
  const licaoMendel = 'Cada genitor passa um alelo de cada gene com probabilidade 1/2. Genes em cromossomos diferentes se combinam de modo independente (2ª lei de Mendel).'

  if (nivel === 1) {
    const v = escolher(rng, ['proporcao', 'proporcao', 'gametas', 'incompleta'] as const)
    if (v === 'proporcao') {
      const t = escolher(rng, TRACOS)
      const [pai, mae] = escolher(rng, [
        ['Aa', 'Aa'],
        ['Aa', 'Aa'],
        ['Aa', 'aa'],
        ['AA', 'Aa'],
      ] as const)
      const classes = classesMono(pai, mae, t.dom, t.rec).filter((c) => c.valor < 100 && c.valor > 0)
      const alvo = escolher(rng, classes)
      const resposta = r2(alvo.valor)
      const erros = classes.filter((c) => c.rotulo !== alvo.rotulo).map((c) => ({ valor: r2(c.valor), frase: `${fn(c.valor)} % é a porcentagem de descendentes com ${c.rotulo}, e a pergunta é sobre ${alvo.rotulo}.`, motivo: 'trocou a classe pedida' }))
      erros.push({ valor: 100 - resposta, frase: `${fn(100 - resposta)} % é o complemento: a porcentagem dos que NÃO têm ${alvo.rotulo}.`, motivo: 'deu o complemento' })
      erros.push({ valor: r2(resposta / 2), frase: 'Você dividiu pelo número de gametas diferentes. As probabilidades vêm do quadro de Punnett, em que as 4 casas somam 100 %.', motivo: 'dividiu a porcentagem por 2' })
      erros.push({ valor: 25, frase: '25 % é a fração de uma só casa do quadro de Punnett (1 em 4). A classe pedida pode ocupar mais de uma casa.', motivo: 'contou uma só casa do quadro de Punnett' })
      erros.push({ valor: 75, frase: '75 % é a proporção de fenótipo dominante no cruzamento de dois heterozigotos (3 : 1), que não é o caso deste cruzamento.', motivo: 'aplicou 3 : 1 a outro cruzamento' })
      erros.push({ valor: 100, frase: '100 % supõe que todos os descendentes pertencem à classe pedida, o que só ocorre quando o cruzamento não tem variação.', motivo: 'supôs que todos os descendentes seriam iguais' })
      return {
        enunciado: `Em ${t.org}, ${t.dom} é dominante sobre ${t.rec}. No cruzamento ${pai} × ${mae}, que porcentagem dos descendentes terá ${alvo.rotulo}?`,
        resposta,
        tolerancia: tol,
        unidade: '%',
        erros: limpar(erros, resposta, tol),
        resolucao: `Gametas: ${[...gametas(pai).keys()].join(' e ')} × ${[...gametas(mae).keys()].join(' e ')}. Cruzando: ${[...cruzar(pai, mae)].map(([g, f]) => `${g} = ${fn(pct(f))} %`).join('; ')}. Para ${alvo.rotulo}: ${fn(resposta)} %.`,
        dicas: dicasMendel,
        licao: licaoMendel,
        dados: { variante: 'proporcao', pai, mae, classe: alvo.tipo === 'genotipo' ? alvo.rotulo.replace('genótipo ', '') : alvo.rotulo === `fenótipo ${t.dom}` ? 'dominante' : 'recessivo' },
      }
    }
    if (v === 'gametas') {
      const k = sortear(rng, 1, 3)
      const genes = ['A', 'B', 'C']
      const heterozigotos = embaralhar(rng, [0, 1, 2]).slice(0, k)
      const geno = genes.map((g, i) => (heterozigotos.includes(i) ? `${g}${g.toLowerCase()}` : escolher(rng, [`${g}${g}`, `${g.toLowerCase()}${g.toLowerCase()}`]))).join('')
      const resposta = tiposDeGametas(geno)
      return {
        enunciado: `Quantos tipos diferentes de gametas forma um indivíduo de genótipo ${geno}? (Os genes estão em cromossomos diferentes.)`,
        resposta,
        tolerancia: 0.01,
        unidade: 'tipos',
        erros: limpar(
          [
            { valor: 3, frase: 'Você contou o número de genes. Cada gene heterozigoto dobra o número de gametas; os homozigotos não alteram.', motivo: 'contou os genes' },
            { valor: k, frase: `Você contou ${k} gene${k > 1 ? 's' : ''} heterozigoto${k > 1 ? 's' : ''}; o número de gametas é 2 elevado a esse número.`, motivo: 'esqueceu de elevar 2 ao número de genes heterozigotos' },
            { valor: 2 * 3, frase: 'Você contou os alelos (2 por gene). O número de gametas depende dos genes heterozigotos: 2ᵏ.', motivo: 'contou os alelos' },
            { valor: 2 ** 3, frase: 'Você tratou todos os genes como heterozigotos. Os homozigotos (como AA ou bb) produzem um só tipo de alelo.', motivo: 'contou os homozigotos como heterozigotos' },
          ],
          resposta,
          0.01,
        ),
        resolucao: `Cada gene heterozigoto dá 2 alelos possíveis; os homozigotos, 1. Genes heterozigotos: ${k}. Gametas: 2^${k} = ${resposta}.`,
        dicas: ['Veja quais genes são heterozigotos (letras diferentes).', 'Cada gene heterozigoto dobra o número de tipos de gametas.', 'Número de gametas = 2 elevado ao número de genes heterozigotos.'],
        licao: 'Um indivíduo com n genes heterozigotos (em cromossomos diferentes) forma 2ⁿ tipos de gametas.',
        dados: { variante: 'gametas', pai: geno },
      }
    }
    // dominância incompleta
    const alvo = escolher(rng, ['intermediário', 'vermelhas'] as const)
    const resposta = alvo === 'intermediário' ? 50 : 25
    return {
      enunciado: `Em uma planta, a cor das flores tem dominância incompleta: VV é vermelha, BB é branca e VB é rosa. Cruzando duas plantas de flores rosa (VB × VB), que porcentagem dos descendentes terá flores ${alvo === 'intermediário' ? 'rosa' : 'vermelhas'}?`,
      resposta,
      tolerancia: tol,
      unidade: '%',
      erros: limpar(
        alvo === 'intermediário'
          ? [
              { valor: 25, frase: '25 % é a porcentagem de cada homozigoto (vermelhas ou brancas). As rosa são os heterozigotos: 2 das 4 casas.', motivo: 'deu a porcentagem de um homozigoto' },
              { valor: 75, frase: '75 % seria a proporção 3:1 da dominância completa. Com dominância incompleta, os 3 fenótipos aparecem na razão 1:2:1.', motivo: 'aplicou 3:1 à dominância incompleta' },
              { valor: 100, frase: 'Os descendentes de duas plantas rosa não são todos rosa: os heterozigotos geram também homozigotos.', motivo: 'achou que todos seriam iguais aos pais' },
            ]
          : [
              { valor: 50, frase: '50 % é a porcentagem de rosas (heterozigotos). As vermelhas são só os VV: 1 das 4 casas.', motivo: 'deu a porcentagem de heterozigotos' },
              { valor: 75, frase: '75 % seria a proporção de fenótipo dominante da dominância completa; aqui o heterozigoto é rosa, e não vermelho.', motivo: 'aplicou 3:1 à dominância incompleta' },
              { valor: 12.5, frase: 'O quadro de Punnett tem 4 casas iguais: cada homozigoto ocupa 1 (25 %).', motivo: 'errou a fração do quadro de Punnett' },
            ],
        resposta,
        tol,
      ),
      resolucao: 'VB × VB → 1 VV (vermelha) : 2 VB (rosa) : 1 BB (branca), isto é, 25 % : 50 % : 25 %.',
      dicas: dicasMendel,
      licao: 'Na dominância incompleta, o heterozigoto tem fenótipo intermediário e a razão fenotípica é igual à genotípica (1 : 2 : 1).',
      dados: { variante: 'incompleta', pai: 'Aa', mae: 'Aa' },
    }
  }

  if (nivel === 2) {
    const v = escolher(rng, ['di', 'di', 'condicional', 'filhos'] as const)
    if (v === 'di') {
      const nomes = [
        { dom: 'flores vermelhas', rec: 'flores brancas' },
        { dom: 'frutos redondos', rec: 'frutos alongados' },
      ]
      const pares: [string, string][] = [
        ['AaBb', 'AaBb'],
        ['AaBb', 'aabb'],
        ['AaBb', 'Aabb'],
        ['Aabb', 'aaBb'],
        ['AaBb', 'aaBb'],
      ]
      for (let t = 0; t < 40; t++) {
        const [pai, mae] = escolher(rng, pares)
        const dist = [...distribuicaoFenotipos(pai, mae)].map(([k, f]) => ({ k, valor: pct(f) }))
        const alvo = escolher(rng, dist)
        if (alvo.valor >= 100) continue
        const resposta = r2(alvo.valor)
        const fenAlvo = fenotipoTexto(alvo.k, nomes)
        const [f1, f2] = alvo.k.split(',')
        const p1 = pct(probFenotipo(pai.slice(0, 2), mae.slice(0, 2), f1 as string))
        const p2 = pct(probFenotipo(pai.slice(2), mae.slice(2), f2 as string))
        const erros = dist
          .filter((d) => d.k !== alvo.k)
          .map((d) => ({ valor: r2(d.valor), frase: `${fn(d.valor)} % é a porcentagem de ${fenotipoTexto(d.k, nomes)}; a pergunta é sobre ${fenAlvo}.`, motivo: 'trocou o fenótipo pedido' }))
        erros.push({ valor: r2(p1), frase: `Você considerou só o 1º gene (${fn(p1)} %). Para dois genes independentes, multiplicam-se as probabilidades de cada gene.`, motivo: 'considerou um só gene' })
        erros.push({ valor: r2(p2), frase: `Você considerou só o 2º gene (${fn(p2)} %). Para dois genes independentes, multiplicam-se as probabilidades de cada gene.`, motivo: 'considerou um só gene' })
        erros.push({ valor: r2(Math.min(100, p1 + p2)), frase: 'As probabilidades de genes independentes se multiplicam (evento “e”), e não se somam.', motivo: 'somou em vez de multiplicar' })
        return {
          enunciado: `Em certa espécie, ${nomes[0]!.dom} (A) dominam ${nomes[0]!.rec} (a) e ${nomes[1]!.dom} (B) dominam ${nomes[1]!.rec} (b), com genes em cromossomos diferentes. No cruzamento ${pai} × ${mae}, que porcentagem dos descendentes terá ${fenAlvo}?`,
          resposta,
          tolerancia: tol,
          unidade: '%',
          erros: limpar(erros, resposta, tol),
          resolucao: `Genes independentes: multiplicam-se as probabilidades. 1º gene (${pai.slice(0, 2)} × ${mae.slice(0, 2)}): ${fn(p1)} %; 2º gene (${pai.slice(2)} × ${mae.slice(2)}): ${fn(p2)} %. Juntos: ${fn(p1 / 100, 4)} × ${fn(p2 / 100, 4)} = ${fn(resposta)} %.`,
          dicas: ['Trate cada gene separadamente.', 'Calcule a probabilidade do fenótipo em cada gene.', 'Multiplique as probabilidades (genes independentes).'],
          licao: 'Genes em cromossomos diferentes segregam independentemente: P(A e B) = P(A) × P(B).',
          dados: { variante: 'di', pai, mae, classe: alvo.k },
        }
      }
    }
    if (v === 'condicional') {
      const t = escolher(rng, TRACOS)
      const alvo = escolher(rng, ['heterozigoto', 'homozigoto'] as const)
      const resposta = alvo === 'heterozigoto' ? 200 / 3 : 100 / 3
      return {
        enunciado: `Em ${t.org}, ${t.dom} é dominante sobre ${t.rec}. Do cruzamento Aa × Aa nasceu um descendente com ${t.dom}. Qual a probabilidade de ele ser ${alvo}?`,
        resposta,
        tolerancia: tol,
        unidade: '%',
        erros: limpar(
          alvo === 'heterozigoto'
            ? [
                { valor: 50, frase: '50 % é a porcentagem de heterozigotos entre TODOS os descendentes. Aqui já se sabe que o indivíduo tem fenótipo dominante, e isso exclui o aa: o “universo” passa a ser só os 3/4 dominantes.', motivo: 'ignorou a informação do fenótipo' },
                { valor: 75, frase: '75 % é a porcentagem de descendentes com fenótipo dominante; a pergunta é qual fração deles é heterozigota.', motivo: 'deu a porcentagem de fenótipo dominante' },
                { valor: 25, frase: '25 % é a porcentagem de cada homozigoto. Entre os de fenótipo dominante, os heterozigotos são 2 em 3.', motivo: 'deu a porcentagem de um homozigoto' },
                { valor: 100 / 3, frase: '33,3 % é a probabilidade de ser homozigoto dominante (AA): 1 em cada 3 dos de fenótipo dominante. A pergunta pede o heterozigoto (Aa).', motivo: 'trocou heterozigoto por homozigoto' },
              ]
            : [
                { valor: 25, frase: '25 % é a porcentagem de AA entre TODOS os descendentes; como se sabe que o fenótipo é dominante (aa foi excluído), o universo é 3/4.', motivo: 'ignorou a informação do fenótipo' },
                { valor: 50, frase: '50 % é a porcentagem de heterozigotos entre todos os descendentes, e a pergunta é sobre os homozigotos dominantes entre os de fenótipo dominante.', motivo: 'trocou a classe pedida' },
                { valor: 200 / 3, frase: '66,7 % é a probabilidade de ser heterozigoto (Aa). A pergunta pede o homozigoto (AA): 1 em cada 3.', motivo: 'trocou homozigoto por heterozigoto' },
                { valor: 75, frase: '75 % é a porcentagem de fenótipo dominante entre todos os descendentes.', motivo: 'deu a porcentagem de fenótipo dominante' },
              ],
          resposta,
          tol,
        ),
        resolucao: `Aa × Aa → 1 AA : 2 Aa : 1 aa. Como o descendente tem fenótipo dominante, descarta-se aa: restam AA (1) e Aa (2), 3 casos. Probabilidade de ser ${alvo}: ${alvo === 'heterozigoto' ? '2/3' : '1/3'} ≈ ${fn(resposta, 1)} %.`,
        dicas: ['Escreva as 4 combinações de Aa × Aa.', 'A informação sobre o fenótipo elimina uma delas.', 'A probabilidade é calculada só entre as que sobram.'],
        licao: 'Probabilidade condicional: restrinja o espaço amostral ao que já se sabe (fenótipo dominante exclui aa) e conte só aí.',
        dados: { variante: 'condicional', pai: 'Aa', mae: 'Aa' },
      }
    }
    const t = escolher(rng, TRACOS)
    const cena = escolher(rng, ['doisRec', 'recDom', 'umDeCada'] as const)
    const resposta = cena === 'doisRec' ? 6.25 : cena === 'recDom' ? 18.75 : 37.5
    const descr = cena === 'doisRec' ? `os dois com ${t.rec}` : cena === 'recDom' ? `o primeiro com ${t.rec} e o segundo com ${t.dom}` : `um com ${t.dom} e outro com ${t.rec} (em qualquer ordem)`
    return {
      enunciado: `Em ${t.org}, ${t.dom} é dominante sobre ${t.rec}. Um casal Aa × Aa terá dois descendentes. Qual a probabilidade de serem ${descr}?`,
      resposta,
      tolerancia: tol,
      unidade: '%',
      erros: limpar(
        cena === 'doisRec'
          ? [
              { valor: 25, frase: '25 % é a probabilidade de UM descendente ser recessivo. Para dois descendentes, multiplicam-se as probabilidades (1/4 × 1/4).', motivo: 'considerou só um descendente' },
              { valor: 50, frase: 'As probabilidades de eventos independentes se multiplicam (1/4 × 1/4), e não se somam (1/4 + 1/4).', motivo: 'somou em vez de multiplicar' },
              { valor: 56.25, frase: '56,25 % é (3/4)², a probabilidade de os dois terem fenótipo dominante.', motivo: 'deu a probabilidade de os dois serem dominantes' },
            ]
          : cena === 'recDom'
            ? [
                { valor: 6.25, frase: '6,25 % é a probabilidade de os dois serem recessivos (1/4 × 1/4). O segundo deve ser dominante: 3/4.', motivo: 'tratou o segundo como recessivo' },
                { valor: 37.5, frase: '37,5 % é a probabilidade de um de cada, em qualquer ordem. Aqui a ordem é fixa: recessivo e depois dominante.', motivo: 'contou as duas ordens' },
                { valor: 25, frase: '25 % é a probabilidade só do primeiro. Falta multiplicar pela probabilidade do segundo (3/4).', motivo: 'esqueceu o segundo descendente' },
                { valor: 56.25, frase: '56,25 % é (3/4)², a probabilidade de os dois terem fenótipo dominante.', motivo: 'deu a probabilidade de os dois serem dominantes' },
              ]
            : [
                { valor: 18.75, frase: '18,75 % é a probabilidade de uma ordem só (recessivo e depois dominante). O enunciado aceita qualquer ordem, então há duas ordens: 2 × 3/16.', motivo: 'contou uma só ordem' },
                { valor: 6.25, frase: '6,25 % é a probabilidade de os dois serem recessivos.', motivo: 'deu a probabilidade de os dois serem recessivos' },
                { valor: 75, frase: '75 % é a probabilidade de um descendente ter fenótipo dominante. Faltam o segundo descendente e as ordens.', motivo: 'considerou só um descendente' },
                { valor: 56.25, frase: '56,25 % é a probabilidade de os dois serem dominantes.', motivo: 'deu a probabilidade de os dois serem dominantes' },
              ],
        resposta,
        tol,
      ),
      resolucao: `Em cada descendente: P(${t.rec}) = 1/4 e P(${t.dom}) = 3/4. Descendentes independentes: ${cena === 'doisRec' ? '1/4 × 1/4 = 1/16 = 6,25 %' : cena === 'recDom' ? '1/4 × 3/4 = 3/16 = 18,75 %' : '2 × (1/4 × 3/4) = 6/16 = 37,5 %'}.`,
      dicas: ['Calcule a probabilidade de cada descendente separadamente.', 'Eventos independentes: multiplique.', 'Se a ordem não importa, some as possibilidades de ordem.'],
      licao: 'Descendentes diferentes são eventos independentes: multiplica-se (regra do “e”) e soma-se quando há mais de uma ordem possível (regra do “ou”).',
      dados: { variante: 'filhos', pai: 'Aa', mae: 'Aa', extra: { cena: cena === 'doisRec' ? 0 : cena === 'recDom' ? 1 : 2 } },
    }
  }

  // nível 3
  const v = escolher(rng, ['poligenia', 'letal', 'tres'] as const)
  if (v === 'poligenia') {
    const n = escolher(rng, [2, 3])
    const dist = distribuicaoPoligenica(n)
    const alvo = escolher(rng, ['extremo', 'intermediario'] as const)
    const f = alvo === 'extremo' ? dist[0]! : dist[n]!
    const resposta = r2(pct(f))
    const outros = dist.map((x, i) => ({ valor: r2(pct(x)), i })).filter((x) => x.i !== (alvo === 'extremo' ? 0 : n))
    return {
      enunciado: `A cor da pele em uma espécie depende de ${n} pares de genes de efeito aditivo, sem dominância: cada alelo “maiúsculo” soma uma unidade de pigmento. Do cruzamento entre dois indivíduos ${n === 2 ? 'duplo' : 'triplo'}-heterozigotos (${n === 2 ? 'AaBb × AaBb' : 'AaBbCc × AaBbCc'}), que porcentagem dos descendentes terá ${alvo === 'extremo' ? `o fenótipo mais claro (nenhum alelo “maiúsculo”: ${n === 2 ? 'aabb' : 'aabbcc'})` : 'o fenótipo intermediário (metade dos alelos “maiúsculos”)'}?`,
      resposta,
      tolerancia: tol,
      unidade: '%',
      erros: limpar(
        [
          ...(alvo === 'extremo'
            ? [
                { valor: 25, frase: `25 % é a probabilidade de um só par ser aa (1/4). Com ${n} pares, o descendente recebe ${2 * n} alelos e todos precisam ser recessivos: (1/2)^${2 * n}.`, motivo: 'considerou um só par de genes' },
                { valor: 100 / 2 ** n, frase: `Você elevou 1/2 ao número de pares (${n}), mas cada par tem 2 alelos: são ${2 * n} alelos recessivos, (1/2)^${2 * n}.`, motivo: 'contou pares em vez de alelos' },
              ]
            : [{ valor: 50, frase: 'Ter metade dos alelos “maiúsculos” não significa metade dos descendentes: essa classe é só a mais frequente (central), com probabilidade dada pela binomial.', motivo: 'confundiu “metade dos alelos” com “metade dos descendentes”' }]),
          ...outros.map((o) => ({ valor: o.valor, frase: `${fn(o.valor)} % é a porcentagem da classe com ${o.i} alelo${o.i === 1 ? '' : 's'} “maiúsculo${o.i === 1 ? '' : 's'}”, e não da classe pedida.`, motivo: 'trocou a classe fenotípica' })),
          { valor: r2(100 / (2 * n + 1)), frase: `${fn(100 / (2 * n + 1))} % supõe que as ${2 * n + 1} classes fenotípicas têm a mesma frequência. Elas seguem a distribuição binomial, com as classes extremas mais raras.`, motivo: 'supôs classes igualmente frequentes' },
        ],
        resposta,
        tol,
      ),
      resolucao: `Cada descendente recebe 2·${n} = ${2 * n} alelos, cada um “maiúsculo” com probabilidade 1/2. O número de alelos maiúsculos segue a binomial: ${dist.map((x) => `${x.n}/${x.d}`).join(', ')}. ${alvo === 'extremo' ? `Nenhum alelo maiúsculo: 1/${2 ** (2 * n)}` : `${n} alelos maiúsculos: ${dist[n]!.n}/${dist[n]!.d}`} = ${fn(resposta)} %.`,
      dicas: [`São ${2 * n} alelos no total.`, 'Cada alelo é “maiúsculo” com probabilidade 1/2.', 'Use as combinações: o nº de formas de ter k alelos maiúsculos entre 2n.'],
      licao: 'Herança poligênica aditiva com n genes: 2n + 1 classes fenotípicas, com frequências dadas pelas combinações (1, 2n, …, 2n, 1) divididas por 4ⁿ.',
      dados: { variante: 'poligenia', extra: { n, alvo: alvo === 'extremo' ? 0 : 1 } },
    }
  }
  if (v === 'letal') {
    const alvo = escolher(rng, ['morrem', 'amarelos', 'cinza'] as const)
    const resposta = alvo === 'morrem' ? 25 : alvo === 'amarelos' ? 200 / 3 : 100 / 3
    return {
      enunciado: `Em camundongos, o alelo A, que determina pelagem amarela, é dominante sobre a (cinza), mas em homozigose (AA) é letal e o embrião morre antes de nascer. Do cruzamento de dois camundongos amarelos (Aa × Aa), ${alvo === 'morrem' ? 'que porcentagem dos embriões morre' : alvo === 'amarelos' ? 'que porcentagem dos filhotes nascidos vivos é amarela' : 'que porcentagem dos filhotes nascidos vivos é cinza'}?`,
      resposta,
      tolerancia: tol,
      unidade: '%',
      erros: limpar(
        alvo === 'morrem'
          ? [
              { valor: 75, frase: '75 % é a porcentagem de fenótipo amarelo no cruzamento sem letalidade. Aqui a pergunta é a fração que morre: só os AA (1 em 4).', motivo: 'aplicou 3:1 sem considerar a letalidade' },
              { valor: 50, frase: '50 % é a porcentagem de heterozigotos (Aa), que sobrevivem.', motivo: 'deu a porcentagem de heterozigotos' },
              { valor: 100 / 3, frase: '33,3 % é a fração dos NASCIDOS que são cinza; a pergunta é a porcentagem dos embriões (todos os zigotos) que morre.', motivo: 'usou só os nascidos como universo' },
            ]
          : alvo === 'amarelos'
            ? [
                { valor: 75, frase: '75 % seria a proporção de amarelos se AA sobrevivesse. Como AA morre, o universo dos nascidos é só Aa e aa (3/4 do total).', motivo: 'ignorou a letalidade' },
                { valor: 50, frase: '50 % é a porcentagem de Aa entre todos os zigotos; entre os nascidos vivos, o universo é menor (3/4 do total) e a fração de amarelos é 2/3.', motivo: 'usou todos os zigotos como universo' },
                { valor: 100 / 3, frase: '33,3 % é a porcentagem de cinza entre os nascidos, e a pergunta é sobre os amarelos.', motivo: 'trocou amarelo por cinza' },
                { valor: 25, frase: '25 % é a fração dos zigotos que morre (AA).', motivo: 'deu a porcentagem dos que morrem' },
              ]
            : [
                { valor: 25, frase: '25 % é a porcentagem de cinza (aa) entre todos os zigotos; entre os nascidos vivos (3/4 do total), os cinza são 1 em 3.', motivo: 'usou todos os zigotos como universo' },
                { valor: 200 / 3, frase: '66,7 % é a porcentagem de amarelos entre os nascidos, e a pergunta é sobre os cinza.', motivo: 'trocou cinza por amarelo' },
                { valor: 50, frase: '50 % é a porcentagem de Aa entre todos os zigotos.', motivo: 'deu a porcentagem de heterozigotos' },
                { valor: 75, frase: '75 % é a fração de nascidos vivos entre os zigotos, e não a de cinza entre os nascidos.', motivo: 'deu a fração de sobreviventes' },
              ],
        resposta,
        tol,
      ),
      resolucao: `Aa × Aa → 1 AA (morre) : 2 Aa (amarelos) : 1 aa (cinza). Morrem 1/4 = 25 %. Dos nascidos (3/4 do total), 2/3 ≈ 66,7 % são amarelos e 1/3 ≈ 33,3 % são cinza.`,
      dicas: ['Faça o quadro de Punnett normalmente.', 'Risque o genótipo letal.', 'A porcentagem entre os nascidos usa só os que sobram como universo.'],
      licao: 'Com gene letal em homozigose, a razão de Aa × Aa passa de 3 : 1 para 2 : 1 entre os nascidos.',
      dados: { variante: 'letal', pai: 'Aa', mae: 'Aa', extra: { alvo: alvo === 'morrem' ? 0 : alvo === 'amarelos' ? 1 : 2 } },
    }
  }
  const alvo = escolher(rng, ['A_B_C_', 'aabbcc', 'A_bbC_', 'AaBbCc'] as const)
  const rotulos: Record<string, string> = { 'A_B_C_': 'dominante,dominante,dominante', aabbcc: 'recessivo,recessivo,recessivo', 'A_bbC_': 'dominante,recessivo,dominante' }
  const f = alvo === 'AaBbCc' ? cruzar('AaBbCc', 'AaBbCc').get('AaBbCc')! : probFenotipo('AaBbCc', 'AaBbCc', rotulos[alvo] as string)
  const resposta = r2(pct(f))
  const nomeAlvo = alvo === 'A_B_C_' ? 'dominante nos três genes' : alvo === 'aabbcc' ? 'recessivo nos três genes (aabbcc)' : alvo === 'A_bbC_' ? 'dominante para A e C e recessivo para B' : 'triplo-heterozigoto (AaBbCc)'
  return {
    enunciado: `Três genes (A, B e C) segregam independentemente, e cada um tem dominância completa. No cruzamento AaBbCc × AaBbCc, que porcentagem dos descendentes será ${nomeAlvo}?`,
    resposta,
    tolerancia: tol,
    unidade: '%',
    erros: limpar(
      alvo === 'A_B_C_'
        ? [
            { valor: 56.25, frase: '56,25 % é (3/4)², isto é, vale para só dois genes. Com três genes, multiplica-se (3/4)³.', motivo: 'considerou dois genes' },
            { valor: 75, frase: '75 % vale para um só gene.', motivo: 'considerou um gene' },
            { valor: 12.5, frase: '12,5 % é a porcentagem de triplo-heterozigotos (1/2)³.', motivo: 'deu a porcentagem de triplo-heterozigotos' },
            { valor: 1.56, frase: '1,56 % é a porcentagem do triplo recessivo, (1/4)³.', motivo: 'deu a porcentagem do triplo recessivo' },
          ]
        : alvo === 'aabbcc'
          ? [
              { valor: 6.25, frase: '6,25 % é (1/4)², isto é, vale para dois genes. Com três genes, é (1/4)³.', motivo: 'considerou dois genes' },
              { valor: 25, frase: '25 % vale para um só gene.', motivo: 'considerou um gene' },
              { valor: 42.19, frase: '42,19 % é a porcentagem de dominante nos três genes, (3/4)³.', motivo: 'deu a porcentagem de dominante nos três genes' },
              { valor: 12.5, frase: '12,5 % é a porcentagem de triplo-heterozigotos, (1/2)³.', motivo: 'deu a porcentagem de triplo-heterozigotos' },
            ]
          : alvo === 'A_bbC_'
            ? [
                { valor: 42.19, frase: '42,19 % é a porcentagem de dominante nos três genes, (3/4)³; aqui o gene B deve ser recessivo (1/4).', motivo: 'tratou B como dominante' },
                { valor: 18.75, frase: '18,75 % é 3/4 × 1/4: só dois genes.', motivo: 'considerou dois genes' },
                { valor: 56.25, frase: '56,25 % é (3/4)², isto é, dois genes dominantes.', motivo: 'considerou dois genes' },
                { valor: 1.56, frase: '1,56 % é a porcentagem do triplo recessivo, (1/4)³.', motivo: 'deu a porcentagem do triplo recessivo' },
              ]
            : [
                { valor: 25, frase: '25 % é a porcentagem de AaBb no cruzamento com 2 genes: (1/2)². Com 3 genes é (1/2)³.', motivo: 'considerou dois genes' },
                { valor: 50, frase: '50 % é a porcentagem de heterozigotos para um só gene.', motivo: 'considerou um gene' },
                { valor: 42.19, frase: '42,19 % é a porcentagem de fenótipo dominante nos três genes (3/4)³, que inclui vários genótipos.', motivo: 'confundiu genótipo com fenótipo' },
                { valor: 6.25, frase: '6,25 % é (1/4)², isto é, dois genes recessivos.', motivo: 'deu a porcentagem de dois recessivos' },
              ],
      resposta,
      tol,
    ),
    resolucao: `Genes independentes: multiplicam-se as probabilidades de cada gene. ${alvo === 'A_B_C_' ? '3/4 × 3/4 × 3/4 = 27/64' : alvo === 'aabbcc' ? '1/4 × 1/4 × 1/4 = 1/64' : alvo === 'A_bbC_' ? '3/4 × 1/4 × 3/4 = 9/64' : '1/2 × 1/2 × 1/2 = 1/8'} = ${fn(resposta)} %.`,
    dicas: ['Calcule a probabilidade em cada gene.', 'Aa × Aa: dominante 3/4, recessivo 1/4, heterozigoto 1/2.', 'Multiplique as probabilidades dos três genes.'],
    licao: 'Com n genes independentes, multiplica-se a probabilidade de cada gene. Aa × Aa: dominante 3/4; recessivo 1/4; heterozigoto 1/2.',
    dados: { variante: 'tres', pai: 'AaBbCc', mae: 'AaBbCc', classe: alvo },
  }
}

/* ================================================================== grupos sanguíneos */

export interface DadosSangue {
  tipo: 'genotipos' | 'universal' | 'antigenos' | 'filhos' | 'transfusao' | 'rh' | 'paternidade' | 'paisDeO' | 'cenario'
  pai?: TipoABO
  mae?: TipoABO
  filho?: TipoABO
  doador?: string
  receptor?: string
}

const IA = 'Iᴬ'
const IB = 'Iᴮ'
/** Notação das provas para um genótipo ABO: AA → IᴬIᴬ; AO → Iᴬi. */
export const notacaoABO = (g: string) => g.split('').map((a) => (a === 'A' ? IA : a === 'B' ? IB : 'i')).join('')
const textoGenotipos = (t: TipoABO) => GENOTIPOS_ABO[t].map(notacaoABO).join(' ou ')
const sangue = (abo: TipoABO, rh: '+' | '-'): TipoSangue => ({ abo, rh })
const nomeAntigenos = (t: TipoABO) => (aglutinogenios(t).length ? `aglutinogênio${aglutinogenios(t).length > 1 ? 's' : ''} ${aglutinogenios(t).join(' e ')}` : 'nenhum aglutinogênio')
const nomeAnticorpos = (t: TipoABO) => (aglutininas(t).length ? `anti-${aglutininas(t).join(' e anti-')}` : 'nenhuma aglutinina')

export const BANCO_SANGUE: { nivel: Nivel; item: ItemBanco }[] = [
  {
    nivel: 3,
    item: {
      pergunta: 'Por que a eritroblastose fetal costuma afetar o segundo filho Rh+ de uma mulher Rh−, e raramente o primeiro?',
      certa: { texto: 'Porque, no primeiro parto, o sangue do bebê Rh+ sensibiliza a mãe, que passa a produzir anticorpos anti-Rh; esses anticorpos atacam as hemácias de um filho Rh+ seguinte.', porque: 'A sensibilização ocorre principalmente no parto, quando hemácias fetais passam para o sangue materno. Os anticorpos anti-Rh produzidos depois atravessam a placenta em uma gestação seguinte.' },
      erradas: [
        { texto: 'Porque o primeiro filho sempre é Rh−.', porque: 'Nada impede que o primeiro filho seja Rh+; o problema é que a mãe ainda não está sensibilizada.', motivo: 'achou que o 1º filho seria Rh−' },
        { texto: 'Porque os anticorpos anti-Rh são passados pelo pai ao segundo filho.', porque: 'Os anticorpos vêm da mãe (produzidos após a sensibilização), e não do pai.', motivo: 'atribuiu os anticorpos ao pai' },
        { texto: 'Porque o fator Rh só se manifesta a partir da segunda gestação.', porque: 'O fator Rh está presente nas hemácias do feto desde cedo; o que muda é a presença de anticorpos maternos.', motivo: 'achou que o Rh só se manifesta tardiamente' },
      ],
      licao: 'Eritroblastose fetal: mãe Rh−, feto Rh+. A sensibilização no parto gera anticorpos anti-Rh que atingem fetos Rh+ de gestações seguintes.',
      dicas: ['Quando a mãe Rh− entra em contato com hemácias Rh+?', 'Anticorpos demoram a se formar.', 'Pense em primeira e segunda gestação.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'Como se previne a eritroblastose fetal em mulheres Rh− que deram à luz um bebê Rh+?',
      certa: { texto: 'Aplicando na mãe, logo após o parto, soro com anticorpos anti-Rh (imunoglobulina anti-Rh), que destrói as hemácias fetais antes que ela as sensibilize.', porque: 'Os anticorpos injetados eliminam as hemácias Rh+ do bebê que passaram para a mãe, impedindo que seu sistema imune produza os próprios anticorpos.' },
      erradas: [
        { texto: 'Vacinando o bebê contra o fator Rh após o nascimento.', porque: 'Rh não é um agente infeccioso; a proteção é dada à mãe, para evitar a sensibilização.', motivo: 'achou que se vacina o bebê' },
        { texto: 'Proibindo gestações entre um casal em que a mãe é Rh− e o pai Rh+.', porque: 'A doença é evitável com a imunoglobulina; não é preciso evitar a gestação.', motivo: 'achou que o casal não pode ter filhos' },
        { texto: 'Fazendo transfusão de sangue Rh+ para a mãe durante a gestação.', porque: 'Isso sensibilizaria a mãe, o que seria o oposto do desejado.', motivo: 'propôs algo que sensibiliza a mãe' },
      ],
      licao: 'A prevenção é a aplicação de imunoglobulina anti-Rh na mãe Rh−, em até 72 horas após o parto de bebê Rh+, para impedir a sensibilização.',
      dicas: ['Quem precisa ser protegido: mãe ou bebê?', 'O objetivo é evitar que a mãe produza anticorpos.', 'Ela recebe anticorpos prontos.'],
    },
  },
  {
    nivel: 3,
    item: {
      pergunta: 'No sistema ABO, que relação existe entre os alelos Iᴬ, Iᴮ e i?',
      certa: { texto: 'Iᴬ e Iᴮ são codominantes entre si, e ambos são dominantes sobre i.', porque: 'Iᴬ e Iᴮ se expressam juntos no tipo AB (codominância), e i só se manifesta em homozigose (tipo O).' },
      erradas: [
        { texto: 'Iᴬ é dominante sobre Iᴮ, e Iᴮ é dominante sobre i.', porque: 'Se Iᴬ dominasse Iᴮ, não existiria o tipo AB, em que os dois aglutinogênios aparecem.', motivo: 'ignorou o tipo AB' },
        { texto: 'Os três alelos são codominantes.', porque: 'O alelo i não produz aglutinogênio; só se expressa em homozigose.', motivo: 'tratou i como codominante' },
        { texto: 'i é dominante sobre Iᴬ e Iᴮ.', porque: 'Se i dominasse, todos os heterozigotos seriam O, e o tipo A (Iᴬi) não existiria.', motivo: 'inverteu a dominância de i' },
      ],
      licao: 'Sistema ABO: alelos múltiplos (Iᴬ, Iᴮ, i). Iᴬ = Iᴮ (codominantes) > i. Genótipos: A = IᴬIᴬ ou Iᴬi; B = IᴮIᴮ ou Iᴮi; AB = IᴬIᴮ; O = ii.',
      dicas: ['O que acontece no tipo AB?', 'Como é o genótipo do tipo O?', 'Quem aparece apenas em homozigose?'],
    },
  },
]

export function gerarSangue(rng: Rng, nivel: Nivel): InstanciaMulti<DadosSangue> {
  const dicas = ['Escreva os genótipos possíveis de cada tipo (alelos Iᴬ, Iᴮ e i).', 'Combine um alelo de cada genitor.', 'Descarte as alternativas que contradizem os genótipos.']
  const licao = 'Sistema ABO: A = IᴬIᴬ ou Iᴬi; B = IᴮIᴮ ou Iᴮi; AB = IᴬIᴮ; O = ii. Rh+ tem ao menos um alelo D; Rh− é dd.'

  if (nivel === 1) {
    const v = escolher(rng, ['genotipos', 'universal', 'antigenos'] as const)
    if (v === 'genotipos') {
      const t = escolher(rng, ['A', 'B', 'AB', 'O'] as const)
      const outros = TIPOS_ABO.filter((x) => x !== t)
      const erradas: Opc[] = outros.map((o) => ({ texto: textoGenotipos(o), porque: `Esses são os genótipos do tipo ${o}.`, motivo: `deu os genótipos do tipo ${o}` }))
      erradas.push({ texto: t === 'O' ? 'IᴬIᴮ' : t === 'AB' ? 'ii' : t === 'A' ? 'IᴮIᴮ ou Iᴮi' : 'IᴬIᴬ ou Iᴬi', porque: 'Esse conjunto não corresponde ao tipo pedido.', motivo: 'trocou os alelos' })
      const certa = textoGenotipos(t)
      return montar<DadosSangue>(rng, { texto: certa, porque: `O tipo ${t} ${t === 'O' ? 'é homozigoto recessivo (ii)' : t === 'AB' ? 'tem os dois alelos codominantes' : `pode ser homozigoto (${notacaoABO(GENOTIPOS_ABO[t][0] as string)}) ou heterozigoto (${notacaoABO(GENOTIPOS_ABO[t][1] as string)})`}.` }, embaralhar(rng, erradas.filter((e, i, arr) => e.texto !== certa && arr.findIndex((x) => x.texto === e.texto) === i)).slice(0, 3), {
        enunciado: `Quais são os genótipos possíveis de uma pessoa do grupo sanguíneo ${t}?`,
        resolucao: `Tipo ${t}: ${certa}.`,
        dicas,
        licao,
        dados: { tipo: 'genotipos', pai: t },
      })
    }
    if (v === 'universal') {
      const doa = escolher(rng, ['doador', 'receptor'] as const)
      const certa = doa === 'doador' ? 'O−' : 'AB+'
      const todos = ['A+', 'B+', 'AB+', 'O+', 'A−', 'B−', 'AB−', 'O−'].filter((x) => x !== certa)
      const erradas = embaralhar(rng, todos)
        .slice(0, 3)
        .map((x) => {
          const abo = x.replace(/[+−]/g, '') as TipoABO
          const motivo =
            doa === 'doador'
              ? aglutinogenios(abo).length > 0
                ? `Tem aglutinogênio ${aglutinogenios(abo).join(' e ')}; quem tem anti-${aglutinogenios(abo)[0]} no plasma o aglutinaria.`
                : 'Tem fator Rh; receptores Rh− não podem receber.'
              : aglutininas(abo).length > 0
                ? `Tem anticorpos ${nomeAnticorpos(abo)} no plasma, que atacariam hemácias com esses antígenos.`
                : 'Não tem aglutininas, mas é Rh−: não recebe Rh+.'
          return { texto: x, porque: motivo, motivo: 'não é compatível com todos' } as Opc
        })
      return montar<DadosSangue>(rng, { texto: certa, porque: doa === 'doador' ? 'O− não tem aglutinogênios A nem B nem fator Rh nas hemácias, por isso nenhum receptor tem anticorpos contra elas.' : 'AB+ não tem aglutininas (anti-A e anti-B) e tem o fator Rh, por isso pode receber hemácias de qualquer tipo.' }, erradas, {
        enunciado: doa === 'doador' ? 'Qual grupo sanguíneo (ABO e Rh) é considerado doador universal de hemácias?' : 'Qual grupo sanguíneo (ABO e Rh) é considerado receptor universal de hemácias?',
        resolucao: doa === 'doador' ? 'O−: sem aglutinogênios A e B e sem Rh.' : 'AB+: sem aglutininas e com Rh.',
        dicas: ['Doador: as hemácias não podem ser reconhecidas pelo plasma do receptor.', 'Receptor: o plasma não pode ter anticorpos contra as hemácias recebidas.', 'Pense em quem não tem antígenos e em quem não tem anticorpos.'],
        licao: 'Doador universal: O− (sem antígenos A, B e Rh). Receptor universal: AB+ (sem anticorpos anti-A e anti-B; tem Rh).',
        dados: { tipo: 'universal' },
      })
    }
    const t = escolher(rng, ['A', 'B', 'AB'] as const)
    const certa = aglutinogenios(t).join(' e ')
    const erradas: Opc[] = [
      { texto: t === 'AB' ? 'somente A' : t === 'A' ? 'B' : 'A', porque: t === 'AB' ? 'O tipo AB tem os dois aglutinogênios (A e B), porque tem os dois alelos codominantes.' : `O tipo ${t} tem o aglutinogênio ${t}, e não o ${t === 'A' ? 'B' : 'A'}.`, motivo: 'errou os aglutinogênios' },
      { texto: 'nenhum', porque: 'Só o tipo O não tem aglutinogênios.', motivo: 'confundiu com o tipo O' },
      { texto: t === 'AB' ? 'anti-A e anti-B' : nomeAnticorpos(t), porque: 'Isso descreve (ou imita) as aglutininas, que são anticorpos do plasma; a pergunta é sobre os aglutinogênios, os antígenos das hemácias.', motivo: 'trocou antígeno por anticorpo' },
    ]
    return montar<DadosSangue>(rng, { texto: certa, porque: `As hemácias do tipo ${t} têm ${nomeAntigenos(t)}.` }, erradas.filter((e) => e.texto !== certa && e.texto !== ''), {
      enunciado: `Que aglutinogênios (antígenos) existem nas hemácias de uma pessoa do grupo sanguíneo ${t}?`,
      resolucao: `Tipo ${t}: ${certa}. As aglutininas (no plasma) são ${nomeAnticorpos(t)}.`,
      dicas: ['O nome do tipo indica o antígeno presente.', 'As aglutininas são contra o antígeno que a pessoa NÃO tem.', 'Aglutinogênio = antígeno da hemácia.'],
      licao: 'Tipo A: antígeno A e anti-B; tipo B: antígeno B e anti-A; AB: A e B, sem anticorpos; O: sem antígenos, com anti-A e anti-B.',
      dados: { tipo: 'antigenos', pai: t },
    })
  }

  if (nivel === 2) {
    const v = escolher(rng, ['filhos', 'transfusao', 'rh'] as const)
    if (v === 'filhos') {
      for (let t = 0; t < 40; t++) {
        const pai = escolher(rng, TIPOS_ABO)
        const mae = escolher(rng, TIPOS_ABO)
        const possiveis = tiposPossiveisDosFilhos(pai, mae)
        const impossiveis = TIPOS_ABO.filter((x) => !possiveis.has(x))
        if (impossiveis.length !== 1 || possiveis.size < 2) continue
        const certa = impossiveis[0] as TipoABO
        const erradas: Opc[] = [...possiveis].map((x) => {
          const par = GENOTIPOS_ABO[pai].flatMap((gp) => GENOTIPOS_ABO[mae].map((gm) => [gp, gm] as const)).find(([gp, gm]) => prole(gp, gm).has(x)) as readonly [string, string]
          return { texto: x, porque: `O tipo ${x} pode nascer: por exemplo, de ${notacaoABO(par[0])} × ${notacaoABO(par[1])}.`, motivo: 'excluiu um tipo possível' }
        })
        return montar<DadosSangue>(rng, { texto: certa, porque: `Os pais não têm como passar alelos que formem o tipo ${certa}: ${pai === 'AB' || mae === 'AB' ? 'um genitor AB não passa i' : certa === 'O' ? 'o tipo O exige um alelo i de cada genitor' : 'faltam os alelos necessários'}.` }, erradas, {
          enunciado: `Um homem do grupo ${pai} e uma mulher do grupo ${mae} terão filhos. Qual dos grupos abaixo NÃO pode ocorrer entre os filhos?`,
          resolucao: `Tipos possíveis: ${[...possiveis].join(', ')}. O tipo ${certa} não pode ocorrer.`,
          dicas,
          licao,
          dados: { tipo: 'filhos', pai, mae },
        })
      }
    }
    if (v === 'transfusao') {
      for (let t = 0; t < 60; t++) {
        const receptor = sangue(escolher(rng, TIPOS_ABO), escolher(rng, ['+', '-'] as const))
        const compat = doadoresCompativeis(receptor).filter((d) => rotuloSangue(d) !== rotuloSangue(receptor))
        const nao = [
          ...TIPOS_ABO.flatMap((abo) => (['+', '-'] as const).map((rh) => sangue(abo, rh))),
        ].filter((d) => !podeReceber(d, receptor))
        if (compat.length < 1 || nao.length < 3) continue
        const certa = escolher(rng, compat)
        const erradas = embaralhar(rng, nao)
          .slice(0, 3)
          .map((d) => {
            const motivo = !aglutinogenios(d.abo).every((x) => aglutinogenios(receptor.abo).includes(x)) ? `${rotuloSangue(d)} tem aglutinogênio ${aglutinogenios(d.abo).filter((x) => !aglutinogenios(receptor.abo).includes(x)).join(' e ')}, e o plasma de ${rotuloSangue(receptor)} contém ${nomeAnticorpos(receptor.abo)}: as hemácias seriam aglutinadas.` : `${rotuloSangue(d)} é Rh+ e o receptor ${rotuloSangue(receptor)} é Rh−: produziria anticorpos anti-Rh e reagiria.`
            return { texto: rotuloSangue(d), porque: motivo, motivo: 'incompatibilidade entre doador e receptor' } as Opc
          })
        return montar<DadosSangue>(rng, { texto: rotuloSangue(certa), porque: `${rotuloSangue(certa)} não tem aglutinogênios que o plasma de ${rotuloSangue(receptor)} (${nomeAnticorpos(receptor.abo)}) possa atacar, e a compatibilidade em Rh está respeitada.` }, erradas, {
          enunciado: `Uma pessoa do grupo ${rotuloSangue(receptor)} precisa de transfusão de hemácias. Qual dos doadores abaixo é compatível?`,
          resolucao: `O receptor ${rotuloSangue(receptor)} tem ${nomeAnticorpos(receptor.abo)}${receptor.rh === '-' ? ' e só pode receber sangue Rh−' : ''}. Doadores compatíveis: ${doadoresCompativeis(receptor).map(rotuloSangue).join(', ')}.`,
          dicas: ['Veja as aglutininas (anticorpos) do plasma do receptor.', 'O doador não pode ter o antígeno correspondente.', 'Receptor Rh− só recebe Rh−.'],
          licao: 'Transfusão: as hemácias do doador não podem ter antígenos contra os quais o receptor tenha anticorpos (e Rh+ não é dado a Rh−).',
          dados: { tipo: 'transfusao', receptor: rotuloSangue(receptor) },
        })
      }
    }
    // rh
    const cenas: { texto: string; risco: boolean; porque: string }[] = [
      { texto: 'Mãe Rh− e filho Rh+', risco: true, porque: 'O feto Rh+ pode sensibilizar a mãe Rh−, que produz anticorpos anti-Rh.' },
      { texto: 'Mãe Rh+ e filho Rh−', risco: false, porque: 'A mãe Rh+ tem o fator Rh e não produz anticorpos anti-Rh contra o feto.' },
      { texto: 'Mãe Rh− e filho Rh−', risco: false, porque: 'Sem fator Rh no feto, não há o que sensibilizar a mãe.' },
      { texto: 'Mãe Rh+ e filho Rh+', risco: false, porque: 'A mãe também tem o fator Rh, e não produz anticorpos contra ele.' },
    ]
    const certa = cenas[0] as { texto: string; porque: string }
    return montar<DadosSangue>(rng, { texto: certa.texto, porque: certa.porque }, cenas.slice(1).map((c) => ({ texto: c.texto, porque: c.porque, motivo: 'não há risco de eritroblastose' })), {
      enunciado: 'Em qual das situações abaixo há risco de eritroblastose fetal (doença hemolítica do recém-nascido)?',
      resolucao: 'Há risco quando a mãe é Rh− e o feto é Rh+: a mãe pode se sensibilizar e produzir anticorpos anti-Rh que atacam as hemácias do feto.',
      dicas: ['Quem pode produzir anticorpos anti-Rh?', 'A mãe precisa ter contato com hemácias Rh+.', 'O feto precisa ser Rh+.'],
      licao: 'Eritroblastose fetal: mãe Rh− (dd) e feto Rh+ (herdou D do pai), a partir da segunda gestação, ou na primeira se a mãe já foi sensibilizada.',
      dados: { tipo: 'rh' },
    })
  }

  // nível 3
  const v = escolher(rng, ['paternidade', 'paisDeO', 'cenario'] as const)
  if (v === 'paternidade') {
    for (let t = 0; t < 60; t++) {
      const mae = escolher(rng, TIPOS_ABO)
      const filho = escolher(rng, TIPOS_ABO)
      const pode = TIPOS_ABO.filter((p) => tiposPossiveisDosFilhos(p, mae).has(filho))
      const excluidos = TIPOS_ABO.filter((p) => !pode.includes(p))
      if (excluidos.length !== 1) continue
      const certa = excluidos[0] as TipoABO
      const erradas: Opc[] = pode.map((p) => {
        const par = GENOTIPOS_ABO[p].flatMap((gp) => GENOTIPOS_ABO[mae].map((gm) => [gp, gm] as const)).find(([gp, gm]) => prole(gp, gm).has(filho)) as readonly [string, string]
        return { texto: `Homem do grupo ${p}`, porque: `Poderia ser o pai: ${notacaoABO(par[0])} × ${notacaoABO(par[1])} pode gerar o tipo ${filho}.`, motivo: 'excluiu um possível pai' }
      })
      return montar<DadosSangue>(rng, { texto: `Homem do grupo ${certa}`, porque: `Um homem do grupo ${certa} não tem como fornecer o alelo necessário para um filho do grupo ${filho} com uma mulher do grupo ${mae}.` }, erradas, {
        enunciado: `Uma mulher do grupo ${mae} tem um filho do grupo ${filho}. Pelo sistema ABO, qual destes homens NÃO pode ser o pai da criança?`,
        resolucao: `Possíveis pais: ${pode.join(', ')}. O grupo ${certa} é excluído.`,
        dicas,
        licao: 'O sistema ABO pode excluir a paternidade, mas nunca prova que alguém é o pai (vários homens podem ter o mesmo grupo).',
        dados: { tipo: 'paternidade', mae, filho },
      })
    }
  }
  if (v === 'paisDeO') {
    const pares: [TipoABO, TipoABO][] = [
      ['A', 'B'],
      ['A', 'A'],
      ['B', 'B'],
      ['A', 'B'],
    ]
    const [a, b] = escolher(rng, pares)
    const certa = `${notacaoABO(a === 'A' ? 'AO' : 'BO')} e ${notacaoABO(b === 'A' ? 'AO' : 'BO')}`
    const erradas: Opc[] = [
      { texto: `${notacaoABO(a === 'A' ? 'AA' : 'BB')} e ${notacaoABO(b === 'A' ? 'AA' : 'BB')}`, porque: 'Pais homozigotos só passariam Iᴬ ou Iᴮ; não haveria filho do grupo O (ii).', motivo: 'pais homozigotos não geram o tipo O' },
      { texto: `${notacaoABO(a === 'A' ? 'AA' : 'BB')} e ${notacaoABO(b === 'A' ? 'AO' : 'BO')}`, porque: 'Se um dos pais fosse homozigoto, ele não poderia passar o alelo i, e o filho não seria ii.', motivo: 'um dos pais não passa i' },
      { texto: 'IᴬIᴮ e ii', porque: 'Os pais são dos grupos ' + a + ' e ' + b + ', e não AB e O.', motivo: 'ignorou os grupos dos pais' },
    ]
    return montar<DadosSangue>(rng, { texto: certa, porque: 'O filho ii recebeu um alelo i de cada genitor; logo os dois pais são heterozigotos (têm o alelo i).' }, erradas, {
      enunciado: `Um casal em que o homem é do grupo ${a} e a mulher do grupo ${b} teve um filho do grupo O. Quais são os genótipos mais prováveis dos pais?`,
      resolucao: 'O filho é ii: cada genitor passou um alelo i. Logo, ambos são heterozigotos.',
      dicas: ['Qual o genótipo de uma pessoa do grupo O?', 'De quem veio cada alelo i?', 'Se o pai passou i, ele tem o alelo i.'],
      licao,
      dados: { tipo: 'paisDeO', pai: a, mae: b },
    })
  }
  const { item } = escolher(rng, BANCO_SANGUE)
  return montar<DadosSangue>(rng, item.certa, item.erradas, { enunciado: item.pergunta, resolucao: item.certa.porque, dicas: item.dicas, licao: item.licao, dados: { tipo: 'cenario' } })
}

/* ================================================================== ligação ao sexo e ligação gênica */

export interface DadosLigacao {
  variante: 'xr' | 'xrCondicional' | 'distancia' | 'gameta'
  extra?: Record<string, number>
}

const DOENCAS_X = [
  { nome: 'daltonismo', normal: 'visão normal para cores', afetado: 'daltônico' },
  { nome: 'hemofilia A', normal: 'coagulação normal', afetado: 'hemofílico' },
  { nome: 'distrofia muscular de Duchenne', normal: 'músculos normais', afetado: 'com distrofia' },
]

export function gerarLigacao(rng: Rng, nivel: Nivel): InstanciaNum<DadosLigacao> {
  const tol = 0.1
  const dicas = ['Escreva os genótipos dos pais (alelo recessivo no X).', 'Monte o quadro: o pai dá X ou Y; a mãe dá um de seus X.', 'Conte só o grupo pedido (meninos, meninas ou todos).']
  if (nivel === 1) {
    const d = escolher(rng, DOENCAS_X)
    const cena = escolher(rng, ['meninos', 'todos', 'mulherAfetada'] as const)
    if (cena === 'mulherAfetada') {
      return {
        enunciado: `${maiuscula(d.nome)} é causada por um alelo recessivo ligado ao cromossomo X. Uma mulher ${d.afetado} (XᵃXᵃ) casa com um homem de ${d.normal} (XᴬY). Que porcentagem dos filhos homens será ${d.afetado}?`,
        resposta: 100,
        tolerancia: tol,
        unidade: '%',
        erros: limpar(
          [
            { valor: 50, frase: '50 % ocorreria se a mãe fosse apenas portadora (XᴬXᵃ). Sendo XᵃXᵃ, todo X que ela passa tem o alelo a.', motivo: 'tratou a mãe como portadora' },
            { valor: 25, frase: '25 % é a porcentagem de crianças afetadas num casal em que a mãe é portadora e o pai normal.', motivo: 'tratou a mãe como portadora' },
            { valor: 0, frase: 'Os filhos homens recebem o X da mãe: como ela só tem Xᵃ, todos serão afetados.', motivo: 'achou que a doença não passa de mãe para filho' },
          ],
          100,
          tol,
          true,
        ),
        resolucao: 'O filho homem recebe o X da mãe (XᵃXᵃ → Xᵃ) e o Y do pai: todos são XᵃY, isto é, afetados. As filhas serão XᴬXᵃ, portadoras.',
        dicas,
        licao: 'Em doenças recessivas ligadas ao X, mãe afetada (XᵃXᵃ) × pai normal → todos os filhos homens afetados e todas as filhas portadoras.',
        dados: { variante: 'xr', extra: { cena: 2 } },
      }
    }
    const resposta = cena === 'meninos' ? 50 : 25
    return {
      enunciado: `${maiuscula(d.nome)} é causada por um alelo recessivo ligado ao cromossomo X. Uma mulher portadora (XᴬXᵃ) casa com um homem de ${d.normal} (XᴬY). ${cena === 'meninos' ? `Que porcentagem dos filhos homens será ${d.afetado}?` : `Que porcentagem de todos os filhos (meninos e meninas) será ${d.afetado}?`}`,
      resposta,
      tolerancia: tol,
      unidade: '%',
      erros: limpar(
        cena === 'meninos'
          ? [
              { valor: 25, frase: '25 % é a porcentagem de afetados entre TODOS os filhos (meninos e meninas). Entre os meninos, metade recebe o Xᵃ da mãe.', motivo: 'usou todos os filhos como universo' },
              { valor: 100, frase: '100 % ocorreria se a mãe fosse XᵃXᵃ. Sendo portadora, ela passa Xᵃ para metade dos filhos.', motivo: 'tratou a mãe como afetada' },
              { valor: 75, frase: 'A doença é recessiva ligada ao X: o menino é afetado quando recebe o Xᵃ da mãe, o que ocorre em 1/2 dos casos.', motivo: 'aplicou a razão 3:1 de Mendel' },
            ]
          : [
              { valor: 50, frase: '50 % é a porcentagem de afetados entre os meninos. Nas meninas, ninguém é afetado (todas recebem Xᴬ do pai), então o total é 25 %.', motivo: 'considerou só os meninos' },
              { valor: 100, frase: 'Não são todos afetados: só os meninos que recebem o Xᵃ da mãe.', motivo: 'achou que todos os filhos seriam afetados' },
              { valor: 12.5, frase: 'O quadro de Punnett tem 4 casas iguais: o menino Xᵃ Y ocupa 1 delas (25 %).', motivo: 'errou a fração do quadro de Punnett' },
            ],
        resposta,
        tol,
      ),
      resolucao: `XᴬXᵃ × XᴬY → XᴬXᴬ (menina normal), XᴬXᵃ (menina portadora), XᴬY (menino normal), XᵃY (menino afetado), 1/4 cada. ${cena === 'meninos' ? 'Entre os meninos, 1 em 2 é afetado: 50 %.' : 'Do total, 1 em 4 é afetado: 25 %.'}`,
      dicas,
      licao: 'Mãe portadora × pai normal: 1/2 dos meninos afetados; nenhuma menina afetada (mas 1/2 delas portadoras); 1/4 de todos os filhos afetados.',
      dados: { variante: 'xr', extra: { cena: cena === 'meninos' ? 0 : 1 } },
    }
  }

  if (nivel === 2) {
    const d = escolher(rng, DOENCAS_X)
    const v = escolher(rng, ['paiAfetado', 'condicional'] as const)
    if (v === 'paiAfetado') {
      const resposta = 50
      return {
        enunciado: `${maiuscula(d.nome)} é causada por um alelo recessivo ligado ao X. Um homem ${d.afetado} (XᵃY) casa com uma mulher portadora (XᴬXᵃ). Que porcentagem das filhas será ${d.afetado === 'daltônico' ? 'daltônica' : d.afetado === 'hemofílico' ? 'hemofílica' : 'afetada'}?`,
        resposta,
        tolerancia: tol,
        unidade: '%',
        erros: limpar(
          [
            { valor: 0, frase: 'Uma filha é afetada quando recebe Xᵃ do pai (todas recebem) e Xᵃ da mãe (metade). O pai afetado não impede.', motivo: 'achou que meninas não são afetadas' },
            { valor: 25, frase: '25 % é a porcentagem de meninas afetadas entre TODOS os filhos. A pergunta restringe a universo às filhas: metade delas é XᵃXᵃ.', motivo: 'usou todos os filhos como universo' },
            { valor: 100, frase: 'Todas as filhas recebem Xᵃ do pai, mas só se tornam afetadas se também receberem Xᵃ da mãe (50 %).', motivo: 'esqueceu o alelo materno' },
          ],
          resposta,
          tol,
          true,
        ),
        resolucao: 'Todas as filhas recebem Xᵃ do pai; da mãe XᴬXᵃ recebem Xᴬ ou Xᵃ com igual chance. Filhas: 1/2 XᴬXᵃ (portadoras) e 1/2 XᵃXᵃ (afetadas).',
        dicas,
        licao: 'Pai afetado × mãe portadora: 1/2 das filhas afetadas e 1/2 dos filhos homens afetados.',
        dados: { variante: 'xr', extra: { cena: 3 } },
      }
    }
    const cena = escolher(rng, ['qualquer', 'menino', 'menina'] as const)
    // três perguntas distintas com respostas diferentes
    const perguntas = {
      qualquer: { texto: `Qual a probabilidade de a próxima criança, de qualquer sexo, ser ${d.afetado}?`, valor: probAfetadoXR('XAY', 'XAXa'), cerro: [50, 12.5, 100] },
      menino: { texto: `A próxima criança é um menino. Qual a probabilidade de ele ser ${d.afetado}?`, valor: probAfetadoXR('XAY', 'XAXa', 'M'), cerro: [25, 100, 75] },
      menina: { texto: `Qual a probabilidade de a próxima criança ser uma menina portadora (XᴬXᵃ, sem a doença)?`, valor: proleX('XAY', 'XAXa').find((x) => x.genotipo === 'XAXa')!.p, cerro: [50, 12.5, 100] },
    }[cena]
    const resp = pct(perguntas.valor)
    return {
      enunciado: `${maiuscula(d.nome)} é causada por um alelo recessivo ligado ao X. Um casal com ${d.normal} tem um filho ${d.afetado}. Considere que o pai é XᴬY e a mãe é portadora (XᴬXᵃ). ${perguntas.texto}`,
      resposta: resp,
      tolerancia: tol,
      unidade: '%',
      erros: limpar(
        perguntas.cerro.map((valor) => ({
          valor,
          frase:
            cena === 'menino'
              ? valor === 25
                ? '25 % é a probabilidade de a criança ser menino E afetado (1/2 × 1/2). Como já se sabe que é menino, só falta a metade que recebe Xᵃ.'
                : valor === 100
                  ? 'Nem todo menino é afetado: ele precisa receber o Xᵃ da mãe (1/2).'
                  : 'A herança ligada ao X recessiva não segue 3 : 1; o menino é afetado em 1/2 dos casos.'
              : cena === 'qualquer'
                ? valor === 50
                  ? '50 % é a porcentagem de afetados entre os meninos. Entre todas as crianças, só 1/2 são meninos e metade deles é afetada: 1/4.'
                  : valor === 12.5
                    ? 'O quadro de Punnett tem 4 casas iguais: o menino XᵃY ocupa 1 (25 %).'
                    : 'Nem todas as crianças são afetadas: as meninas nunca (recebem Xᴬ do pai) e só metade dos meninos.'
                : valor === 50
                  ? '50 % é a porcentagem de portadoras entre as meninas. Entre todas as crianças, as meninas são 1/2: 1/2 × 1/2 = 1/4.'
                  : valor === 12.5
                    ? 'A menina portadora ocupa 1 das 4 casas do quadro (25 %).'
                    : 'Nem toda criança é menina portadora.',
          motivo: 'errou o universo da probabilidade',
        })),
        resp,
        tol,
      ),
      resolucao: `XᴬXᵃ × XᴬY → XᴬXᴬ, XᴬXᵃ, XᴬY, XᵃY (1/4 cada). ${cena === 'qualquer' ? 'Afetados: só XᵃY → 1/4 = 25 %.' : cena === 'menino' ? 'Entre os meninos (XᴬY e XᵃY), 1 em 2 é afetado: 50 %.' : 'Meninas portadoras: XᴬXᵃ → 1/4 = 25 %.'}`,
      dicas,
      licao: 'Defina o universo antes de contar: “qualquer criança” (4 casas), “menino” (2 casas) ou “menina” (2 casas).',
      dados: { variante: 'xrCondicional', extra: { cena: cena === 'qualquer' ? 0 : cena === 'menino' ? 1 : 2 } },
    }
  }

  // nível 3: ligação gênica
  const v = escolher(rng, ['distancia', 'gameta'] as const)
  if (v === 'distancia') {
    const total = escolher(rng, [500, 1000, 2000])
    const cM = escolher(rng, [8, 10, 12, 15, 16, 18, 20, 24, 25, 30])
    const rec = (total * cM) / 100
    const par = total - rec
    const r1 = Math.round(rec / 2)
    const r2c = rec - r1
    const p1 = Math.round(par / 2)
    const p2 = par - p1
    const resposta = distanciaCM(r1 + r2c, total)
    return {
      enunciado: `Um duplo-heterozigoto (AaBb) foi cruzado com um duplo-recessivo (aabb) e gerou ${fn(total, 0)} descendentes: ${fn(p1, 0)} A_B_, ${fn(p2, 0)} aabb, ${fn(r1, 0)} A_bb e ${fn(r2c, 0)} aaB_. Qual a distância entre os genes A e B, em centimorgans (cM)?`,
      resposta,
      tolerancia: 0.5,
      unidade: 'cM',
      erros: limpar(
        [
          { valor: 100 - cM, frase: `${fn(100 - cM)} % é a porcentagem de descendentes com fenótipos PARENTAIS (os mais frequentes). A distância é a porcentagem de recombinantes (os menos frequentes).`, motivo: 'usou os parentais em vez dos recombinantes' },
          { valor: (r1 / total) * 100, frase: 'Você usou só uma das classes recombinantes. A taxa de recombinação soma as duas (A_bb e aaB_).', motivo: 'contou uma só classe recombinante' },
          { valor: (p1 / total) * 100, frase: 'Você usou só uma das classes parentais. Os recombinantes são as duas classes MENOS frequentes.', motivo: 'usou uma classe parental' },
          { valor: cM / 2, frase: 'Você dividiu a taxa de recombinação por 2. Cada classe recombinante vale metade, mas a distância usa a soma das duas.', motivo: 'dividiu por 2' },
        ],
        resposta,
        0.5,
      ),
      resolucao: `Recombinantes (menos frequentes): ${fn(r1, 0)} + ${fn(r2c, 0)} = ${fn(rec, 0)}. Distância = ${fn(rec, 0)} ÷ ${fn(total, 0)} × 100 = ${fn(cM, 1)} cM.`,
      dicas: ['Os recombinantes são as duas classes menos numerosas.', 'Some as duas.', 'Divida pelo total e multiplique por 100: 1 % = 1 cM.'],
      licao: 'Distância (cM) = % de descendentes recombinantes no cruzamento-teste. 1 cM = 1 % de recombinação.',
      dados: { variante: 'distancia', extra: { total, cM } },
    }
  }
  const cM = escolher(rng, [10, 12, 16, 20, 24, 30, 40])
  const arranjo = escolher(rng, ['cis', 'trans'] as const)
  const gamAlvo = escolher(rng, ['AB', 'ab'] as const)
  const g = gametasLigados(cM / 100, arranjo)
  const resposta = (g.freq.get(gamAlvo) as number) * 100
  return {
    enunciado: `Os genes A e B estão no mesmo cromossomo, a ${cM} cM de distância. Um indivíduo duplo-heterozigoto tem os alelos dispostos em ${arranjo === 'cis' ? 'cis (AB/ab)' : 'trans (Ab/aB)'}. Que porcentagem de seus gametas é ${gamAlvo}?`,
    resposta,
    tolerancia: 0.1,
    unidade: '%',
    erros: limpar(
      [
        { valor: 25, frase: '25 % vale para genes independentes (cada um dos 4 gametas com 1/4). Genes ligados formam mais gametas parentais que recombinantes.', motivo: 'tratou como genes independentes' },
        { valor: cM, frase: `${fn(cM)} % é a taxa de recombinação total. Ela se divide entre os DOIS gametas recombinantes (${fn(cM / 2)} % cada).`, motivo: 'esqueceu de dividir a recombinação entre as duas classes' },
        { valor: 100 - cM, frase: `${fn(100 - cM)} % é a porcentagem total de gametas parentais. Ela se divide entre os DOIS gametas parentais.`, motivo: 'esqueceu de dividir os parentais entre as duas classes' },
        { valor: (g.freq.get(gamAlvo === 'AB' ? 'Ab' : 'AB') as number) * 100, frase: `${fn((g.freq.get(gamAlvo === 'AB' ? 'Ab' : 'AB') as number) * 100)} % é a frequência de ${gamAlvo === 'AB' ? 'Ab' : 'AB'}. Em ${arranjo}, ${gamAlvo} é ${g.parentais.includes(gamAlvo) ? 'parental' : 'recombinante'}.`, motivo: 'trocou parentais e recombinantes' },
      ],
      resposta,
      0.1,
    ),
    resolucao: `Em ${arranjo === 'cis' ? 'cis (AB/ab)' : 'trans (Ab/aB)'}, os gametas parentais são ${g.parentais.join(' e ')} (${fn((100 - cM) / 2)} % cada) e os recombinantes ${g.recombinantes.join(' e ')} (${fn(cM / 2)} % cada). ${gamAlvo} é ${g.parentais.includes(gamAlvo) ? 'parental' : 'recombinante'}: ${fn(resposta)} %.`,
    dicas: ['Identifique os gametas parentais (os que mantêm a disposição dos alelos).', 'A recombinação total é a distância em %, dividida entre os dois recombinantes.', 'O restante se divide entre os dois parentais.'],
    licao: 'Genes ligados: gametas parentais (100 − d)/2 % cada; recombinantes d/2 % cada, com d a distância em cM.',
    dados: { variante: 'gameta', extra: { cM, trans: arranjo === 'trans' ? 1 : 0 } },
  }
}

/* ================================================================== Hardy-Weinberg */

export interface DadosHardy {
  variante: 'q' | 'p' | 'heterozigotos' | 'portadoresNumero' | 'xMulheres' | 'xPortadoras' | 'dominantes'
  extra?: Record<string, number>
}

export function gerarHardy(rng: Rng, nivel: Nivel): InstanciaNum<DadosHardy> {
  const dicas = ['Em equilíbrio: p² + 2pq + q² = 1 e p + q = 1.', 'q² é a frequência do fenótipo recessivo.', 'Tire a raiz quadrada para achar q.']
  const licao = 'Hardy-Weinberg: p + q = 1; AA = p², Aa = 2pq, aa = q². A frequência de afetados recessivos (q²) permite achar q = √q².'
  const qs = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]
  if (nivel === 1) {
    const q = escolher(rng, qs)
    const aa = Math.round(q * q * 10000) / 100
    const v = escolher(rng, ['q', 'p'] as const)
    const resposta = v === 'q' ? q : Math.round((1 - q) * 100) / 100
    return {
      enunciado: `Em uma população em equilíbrio de Hardy-Weinberg, ${fn(aa)} % dos indivíduos têm um fenótipo recessivo (aa). Qual é a frequência ${v === 'q' ? 'do alelo recessivo (a)' : 'do alelo dominante (A)'}, como número entre 0 e 1?`,
      resposta,
      tolerancia: 0.005,
      unidade: '',
      erros: limpar(
        v === 'q'
          ? [
              { valor: aa / 100, frase: `${fn(aa / 100, 3)} é q², a frequência do genótipo aa. Para achar q, tire a raiz quadrada.`, motivo: 'esqueceu a raiz quadrada' },
              { valor: Math.round((1 - q) * 100) / 100, frase: `${fn(1 - q)} é a frequência do alelo dominante (p = 1 − q), e a pergunta é sobre o recessivo.`, motivo: 'deu a frequência do alelo dominante' },
              { valor: aa / 200, frase: 'Você dividiu q² por 2. O correto é a raiz quadrada de q².', motivo: 'dividiu por 2 em vez de extrair a raiz' },
              { valor: Math.round(2 * q * (1 - q) * 100) / 100, frase: `${fn(2 * q * (1 - q))} é 2pq, a frequência dos heterozigotos.`, motivo: 'deu a frequência de heterozigotos' },
            ]
          : [
              { valor: Math.sqrt(aa / 100) , frase: `${fn(q)} é a frequência do alelo recessivo (q). O dominante é p = 1 − q.`, motivo: 'deu a frequência do alelo recessivo' },
              { valor: 1 - aa / 100, frase: `${fn(1 - aa / 100, 3)} é 1 − q², a frequência do fenótipo dominante, e não do alelo.`, motivo: 'deu a frequência do fenótipo dominante' },
              { valor: aa / 100, frase: `${fn(aa / 100, 3)} é q², a frequência do genótipo aa.`, motivo: 'deu a frequência do genótipo aa' },
              { valor: Math.round((1 - q) ** 2 * 100) / 100, frase: `${fn((1 - q) ** 2)} é p², a frequência do genótipo AA.`, motivo: 'deu a frequência do genótipo AA' },
            ],
        resposta,
        0.005,
      ),
      resolucao: `q² = ${fn(aa / 100, 4)} ⇒ q = √${fn(aa / 100, 4)} = ${fn(q)}. p = 1 − q = ${fn(1 - q)}. Pedido: ${v === 'q' ? `q = ${fn(q)}` : `p = ${fn(1 - q)}`}.`,
      dicas,
      licao,
      dados: { variante: v, extra: { q, aa } },
    }
  }
  if (nivel === 2) {
    const v = escolher(rng, ['heterozigotos', 'portadoresNumero', 'dominantes'] as const)
    const q = escolher(rng, [0.1, 0.2, 0.3, 0.4])
    if (v === 'heterozigotos') {
      const aa = Math.round(q * q * 10000) / 100
      const resposta = Math.round(2 * q * (1 - q) * 10000) / 100
      return {
        enunciado: `Em uma população em equilíbrio, ${fn(aa)} % das pessoas apresentam uma doença recessiva (aa). Que porcentagem da população é formada por portadores heterozigotos (Aa), sem a doença?`,
        resposta,
        tolerancia: 0.1,
        unidade: '%',
        erros: limpar(
          [
            { valor: 200 * q, frase: `${fn(200 * q)} % é 2q; faltou o fator p: os heterozigotos são 2pq.`, motivo: 'esqueceu o fator p' },
            { valor: Math.round((1 - q) ** 2 * 10000) / 100, frase: 'Isso é p², a frequência dos homozigotos dominantes AA.', motivo: 'deu a frequência de AA' },
            { valor: 100 * q, frase: `${fn(100 * q)} % é a frequência do alelo recessivo q (em %), e não a de heterozigotos.`, motivo: 'deu a frequência do alelo' },
            { valor: aa, frase: `${fn(aa)} % é q²: a frequência dos afetados (aa).`, motivo: 'deu a frequência dos afetados' },
          ],
          resposta,
          0.1,
        ),
        resolucao: `q² = ${fn(aa / 100, 4)} ⇒ q = ${fn(q)}; p = ${fn(1 - q)}. Heterozigotos: 2pq = 2 × ${fn(1 - q)} × ${fn(q)} = ${fn(2 * q * (1 - q), 4)} = ${fn(resposta)} %.`,
        dicas,
        licao,
        dados: { variante: 'heterozigotos', extra: { q } },
      }
    }
    if (v === 'portadoresNumero') {
      const N = escolher(rng, [1000, 2000, 5000, 10000])
      const aa = Math.round(q * q * 10000) / 100
      const resposta = Math.round(2 * q * (1 - q) * N)
      return {
        enunciado: `Em uma população de ${fn(N, 0)} pessoas em equilíbrio de Hardy-Weinberg, ${fn(aa)} % têm uma doença recessiva (aa). Quantas pessoas são portadoras heterozigotas (Aa)?`,
        resposta,
        tolerancia: 0.5,
        unidade: 'pessoas',
        erros: limpar(
          [
            { valor: Math.round(q * q * N), frase: `${fn(Math.round(q * q * N), 0)} é o número de afetados (aa = q² × N).`, motivo: 'deu o número de afetados' },
            { valor: Math.round((1 - q) ** 2 * N), frase: `${fn(Math.round((1 - q) ** 2 * N), 0)} é o número de homozigotos dominantes (AA = p² × N).`, motivo: 'deu o número de homozigotos dominantes' },
            { valor: Math.round(2 * q * N), frase: 'Faltou o fator p: heterozigotos = 2pq × N.', motivo: 'esqueceu o fator p' },
            { valor: Math.round(q * N), frase: 'q × N é o número de alelos recessivos aproximados em haploide, e não o de heterozigotos.', motivo: 'deu q × N' },
          ],
          resposta,
          0.5,
        ),
        resolucao: `q = √${fn(aa / 100, 4)} = ${fn(q)}; p = ${fn(1 - q)}. 2pq = ${fn(2 * q * (1 - q), 4)}. Portadores: ${fn(2 * q * (1 - q), 4)} × ${fn(N, 0)} = ${fn(resposta, 0)}.`,
        dicas: [...dicas, 'Multiplique a frequência de heterozigotos pelo tamanho da população.'],
        licao,
        dados: { variante: 'portadoresNumero', extra: { q, N } },
      }
    }
    // dominantes → q
    const dom = Math.round((1 - q * q) * 10000) / 100
    return {
      enunciado: `Em uma população em equilíbrio, ${fn(dom)} % dos indivíduos têm o fenótipo dominante. Qual a frequência do alelo recessivo, como número entre 0 e 1?`,
      resposta: q,
      tolerancia: 0.005,
      unidade: '',
      erros: limpar(
        [
          { valor: Math.round((1 - q * q) * 100) / 100, frase: `${fn(1 - q * q, 2)} é a frequência do fenótipo dominante (p² + 2pq), e não do alelo recessivo.`, motivo: 'deu a frequência do fenótipo dominante' },
          { valor: Math.round(q * q * 100) / 100, frase: `${fn(q * q, 2)} é q², a frequência de aa. Para q, tire a raiz.`, motivo: 'esqueceu a raiz quadrada' },
          { valor: Math.round((1 - q) * 100) / 100, frase: `${fn(1 - q)} é p (alelo dominante). O recessivo é q.`, motivo: 'deu a frequência do alelo dominante' },
          { valor: Math.round(Math.sqrt(1 - q * q) * 100) / 100, frase: `${fn(Math.sqrt(1 - q * q))} é a raiz de 1 − q². Primeiro ache q² = 1 − (fenótipo dominante); depois a raiz.`, motivo: 'extraiu a raiz da frequência do fenótipo dominante' },
        ],
        q,
        0.005,
      ),
      resolucao: `Fenótipo dominante = p² + 2pq = 1 − q² = ${fn(dom / 100, 4)} ⇒ q² = ${fn(1 - dom / 100, 4)} ⇒ q = ${fn(q)}.`,
      dicas: ['Os que não são dominantes são aa.', 'q² = 1 − (frequência do fenótipo dominante).', 'Tire a raiz quadrada.'],
      licao,
      dados: { variante: 'dominantes', extra: { q, dom } },
    }
  }
  // nível 3: ligado ao X
  const q = escolher(rng, [0.05, 0.1, 0.2, 0.3])
  const v = escolher(rng, ['xMulheres', 'xPortadoras'] as const)
  const x = hardyWeinbergX(q)
  const resposta = v === 'xMulheres' ? Math.round(x.mulheresAfetadas * 10000) / 100 : Math.round(x.mulheresPortadoras * 10000) / 100
  return {
    enunciado: `Em uma população em equilíbrio, ${fn(q * 100)} % dos homens têm uma doença recessiva ligada ao cromossomo X (como o daltonismo). Que porcentagem das MULHERES ${v === 'xMulheres' ? 'tem a doença' : 'é portadora (heterozigota, sem a doença)'}?`,
    resposta,
    tolerancia: 0.05,
    unidade: '%',
    erros: limpar(
      v === 'xMulheres'
        ? [
            { valor: q * 100, frase: `${fn(q * 100)} % é a frequência entre os HOMENS (q): eles têm um só X, então basta um alelo. Nas mulheres são necessários dois: q².`, motivo: 'repetiu a frequência dos homens' },
            { valor: Math.round(2 * q * (1 - q) * 10000) / 100, frase: `${fn(2 * q * (1 - q) * 100)} % é a porcentagem de mulheres portadoras (2pq), e não das afetadas (q²).`, motivo: 'deu a frequência das portadoras' },
            { valor: q * 50, frase: 'Você dividiu por 2; na verdade, nas mulheres a frequência de afetadas é q² (o quadrado da frequência do alelo).', motivo: 'dividiu por 2' },
            { valor: Math.round((1 - q) ** 2 * 10000) / 100, frase: `${fn((1 - q) ** 2 * 100)} % é p², a frequência de mulheres homozigotas normais.`, motivo: 'deu a frequência de homozigotas normais' },
          ]
        : [
            { valor: q * 100, frase: `${fn(q * 100)} % é a frequência de homens afetados (q). Para mulheres portadoras: 2pq.`, motivo: 'repetiu a frequência dos homens' },
            { valor: Math.round(q * q * 10000) / 100, frase: `${fn(q * q * 100)} % é a frequência de mulheres afetadas (q²), e não portadoras.`, motivo: 'deu a frequência das afetadas' },
            { valor: Math.round(2 * q * 10000) / 100, frase: 'Faltou o fator p: portadoras = 2pq.', motivo: 'esqueceu o fator p' },
            { valor: Math.round((1 - q) ** 2 * 10000) / 100, frase: `${fn((1 - q) ** 2 * 100)} % é p², a frequência de mulheres homozigotas normais.`, motivo: 'deu a frequência de homozigotas normais' },
          ],
      resposta,
      0.05,
    ),
    resolucao: `Homens têm um só X: frequência de afetados = q = ${fn(q)}. Nas mulheres (dois X): afetadas = q² = ${fn(q * q, 4)}; portadoras = 2pq = ${fn(2 * q * (1 - q), 4)}. Pedido: ${fn(resposta)} %.`,
    dicas: ['Nos homens, a frequência do fenótipo é igual a q.', 'Nas mulheres valem as proporções de Hardy-Weinberg (p², 2pq, q²).', 'Converta em porcentagem.'],
    licao: 'Genes ligados ao X em equilíbrio: homens afetados = q; mulheres afetadas = q²; portadoras = 2pq. Por isso a doença é bem mais comum nos homens.',
    dados: { variante: v, extra: { q } },
  }
}

