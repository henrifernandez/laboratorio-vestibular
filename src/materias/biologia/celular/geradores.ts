import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { escolher, embaralhar, type Rng } from '@/lib/rng'
import { fn, limpar, lista, montar, type ItemBanco, type Opc } from '../comum/auxiliares'
import {
  ESTRUTURAS,
  OSMOLARIDADE_CELULA,
  SOLUTOS,
  TRANSPORTES,
  efeitoCelulaVegetal,
  efeitoHemacia,
  osmolaridade,
  pressaoOsmotica,
  tonicidade,
  volumeFinalDiluicao,
  type Estrutura,
  type Tonicidade,
  type Transporte,
} from './calculo'

export type { ItemBanco }

const arred3 = (x: number) => Math.round(x * 1000) / 1000

/** Pergunta de banco escrita à mão: embaralha as alternativas e liga cada explicação à sua letra. */
export function doBanco<D = undefined>(rng: Rng, banco: ItemBanco[], dados?: D): InstanciaMulti<D> {
  const item = escolher(rng, banco)
  return montar<D>(rng, { texto: item.certa.texto, porque: item.certa.porque }, item.erradas, {
    enunciado: item.pergunta,
    resolucao: item.certa.porque,
    dicas: item.dicas,
    licao: item.licao,
    dados,
  })
}

/* ================================================================== organelas */

const onde = (e: Estrutura) => {
  const t = [e.presente.animal && 'células animais', e.presente.vegetal && 'células vegetais', e.presente.bacteria && 'bactérias'].filter(Boolean) as string[]
  return `presente em ${lista(t)}`
}
/** Os fatos da tabela sobre uma estrutura, em uma frase. */
export const fatos = (e: Estrutura) => `${e.nome}: ${onde(e)}; número de membranas: ${e.membranas === 0 ? 'nenhuma' : e.membranas}; DNA próprio: ${e.dnaProprio ? 'sim' : 'não'}.`

/** Pares que um aluno pode confundir de boa-fé quando a pergunta fala só de "sintetizar proteínas". */
const AMBIGUOS: Record<string, string> = { ribossomo: 'rer', rer: 'ribossomo' }

export const PROPRIEDADES_ORGANELAS: { id: string; texto: string; ok: (e: Estrutura) => boolean }[] = [
  { id: 'soVegetal', texto: 'existe na célula vegetal, mas não na célula animal', ok: (e) => e.presente.vegetal && !e.presente.animal },
  { id: 'soAnimal', texto: 'existe na célula animal, mas não na vegetal', ok: (e) => e.presente.animal && !e.presente.vegetal },
  { id: 'bacteria', texto: 'existe também nas bactérias', ok: (e) => e.presente.bacteria },
  { id: 'semBacteria', texto: 'não existe nas bactérias', ok: (e) => !e.presente.bacteria },
  { id: 'dna', texto: 'tem DNA próprio', ok: (e) => e.dnaProprio },
  { id: 'duasMembranas', texto: 'é delimitada por duas membranas', ok: (e) => e.membranas === 2 },
  { id: 'semMembrana', texto: 'não é delimitada por membrana', ok: (e) => e.membranas === 0 },
]

export const BANCO_ORGANELAS: ItemBanco[] = [
  {
    pergunta: 'Qual observação mais apoia a hipótese de que mitocôndrias e cloroplastos descendem de bactérias que foram englobadas por uma célula ancestral (endossimbiose)?',
    certa: { texto: 'Ambos têm DNA próprio e ribossomos parecidos com os de bactérias, e se multiplicam por divisão independente da divisão da célula', porque: 'Tudo isso lembra uma bactéria que vive dentro da célula: DNA circular próprio, ribossomos próprios e reprodução por divisão. É a evidência clássica da endossimbiose.' },
    erradas: [
      { texto: 'Ambos são as únicas organelas que contêm proteínas', porque: 'Todas as organelas contêm proteínas. Isso não distingue mitocôndrias e cloroplastos nem sugere origem bacteriana.', motivo: 'proteínas existem em todas as organelas' },
      { texto: 'Ambos existem em todas as células de todos os seres vivos', porque: 'Bactérias não têm mitocôndrias nem cloroplastos, e os animais não têm cloroplastos. Além disso, estar em todas as células não seria evidência de origem bacteriana.', motivo: 'achou que são universais' },
      { texto: 'Ambos são envolvidos por um envoltório nuclear, como o núcleo', porque: 'Eles são envolvidos por duas membranas, mas isso não os liga a bactérias, e o envoltório nuclear é do núcleo, não dessas organelas.', motivo: 'confundiu com o núcleo' },
    ],
    licao: 'Mitocôndrias e cloroplastos têm DNA circular e ribossomos próprios e se dividem sozinhos: por isso se supõe que vieram de bactérias englobadas (endossimbiose).',
    dicas: ['Pense no que uma bactéria tem: DNA próprio, ribossomos, reprodução independente.', 'Quais organelas têm DNA próprio?', 'Uma evidência de origem bacteriana precisa lembrar uma bactéria, não só ser comum a todas as organelas.'],
  },
  {
    pergunta: 'Uma proteína de secreção (por exemplo, a insulina) é produzida e liberada da célula. Qual é a ordem correta do caminho que ela percorre?',
    certa: { texto: 'Retículo endoplasmático rugoso → complexo de Golgi → vesícula de secreção → exocitose pela membrana plasmática', porque: 'A proteína é sintetizada nos ribossomos do retículo rugoso, segue em vesículas até o Golgi, onde é modificada e empacotada, e uma vesícula de secreção a leva à membrana, onde é liberada por exocitose.' },
    erradas: [
      { texto: 'Complexo de Golgi → retículo endoplasmático rugoso → vesícula de secreção → exocitose pela membrana plasmática', porque: 'A ordem está invertida: a síntese ocorre primeiro no retículo rugoso, e só depois o Golgi modifica e empacota a proteína.', motivo: 'inverteu retículo e Golgi' },
      { texto: 'Mitocôndria → complexo de Golgi → lisossomo → exocitose pela membrana plasmática', porque: 'A mitocôndria produz ATP e não sintetiza proteínas de secreção para exportar; e o lisossomo digere material, não secreta a proteína ao meio.', motivo: 'incluiu organelas que não participam' },
      { texto: 'Núcleo → peroxissomo → retículo endoplasmático liso → endocitose', porque: 'O núcleo guarda o DNA, mas a proteína não passa por ele; o peroxissomo decompõe H₂O₂ e a saída da proteína é por exocitose, e não por endocitose (que é a entrada de material).', motivo: 'confundiu exocitose com endocitose' },
    ],
    licao: 'Via secretória: ribossomos do retículo rugoso (síntese) → Golgi (modificação e empacotamento) → vesícula → exocitose.',
    dicas: ['Onde estão os ribossomos aderidos que sintetizam proteínas para exportação?', 'Quem modifica e empacota as proteínas antes de enviá-las?', 'Sair da célula por vesícula é exocitose; entrar é endocitose.'],
  },
  {
    pergunta: 'Qual organela contém enzimas hidrolíticas e é responsável pela digestão intracelular de partículas englobadas e de organelas velhas?',
    certa: { texto: 'Lisossomo', porque: 'O lisossomo contém enzimas hidrolíticas em pH ácido e digere o material trazido por endocitose e as organelas gastas.' },
    erradas: [
      { texto: 'Peroxissomo', porque: 'O peroxissomo decompõe o peróxido de hidrogênio (pela catalase) e oxida ácidos graxos; não é a organela da digestão intracelular geral.', motivo: 'confundiu com peroxissomo' },
      { texto: 'Complexo de Golgi', porque: 'O Golgi forma os lisossomos e empacota as enzimas neles, mas não faz a digestão: quem digere é o lisossomo.', motivo: 'confundiu quem forma com quem digere' },
      { texto: 'Ribossomo', porque: 'O ribossomo sintetiza proteínas. Ele não digere nada.', motivo: 'confundiu síntese com digestão' },
    ],
    licao: 'Lisossomo = digestão intracelular (enzimas hidrolíticas). O Golgi o forma; o peroxissomo trata o H₂O₂.',
    dicas: ['Enzimas hidrolíticas quebram moléculas com água.', 'O Golgi forma essa organela, mas não é ele que digere.', 'O peroxissomo decompõe H₂O₂, um assunto diferente.'],
  },
  {
    pergunta: 'As células do fígado que metabolizam álcool e medicamentos têm grande quantidade de qual estrutura, associada à desintoxicação?',
    certa: { texto: 'Retículo endoplasmático liso', porque: 'O retículo liso participa da desintoxicação (álcool, medicamentos) e da síntese de lipídios e esteroides; é abundante nos hepatócitos.' },
    erradas: [
      { texto: 'Retículo endoplasmático rugoso', porque: 'O rugoso tem ribossomos e é abundante em células que fabricam proteínas para exportar (como as do pâncreas). A desintoxicação é do retículo liso.', motivo: 'confundiu liso com rugoso' },
      { texto: 'Centríolo', porque: 'O centríolo organiza o fuso de divisão e forma cílios e flagelos; não participa da desintoxicação.', motivo: 'função errada' },
      { texto: 'Vacúolo central', porque: 'O vacúolo central é típico de células vegetais e armazena água e substâncias; não é a estrutura da desintoxicação nas células do fígado.', motivo: 'associou a célula errada' },
    ],
    licao: 'Retículo liso: lipídios, esteroides e desintoxicação (fígado). Retículo rugoso: proteínas para exportação.',
    dicas: ['Um dos retículos tem ribossomos; o outro, não.', 'A desintoxicação não envolve síntese de proteínas.', 'Pense na diferença entre rugoso (ribossomos) e liso.'],
  },
  {
    pergunta: 'Qual característica distingue uma bactéria de uma célula eucariótica?',
    certa: { texto: 'O material genético fica solto no citoplasma, sem envoltório nuclear', porque: 'Células procarióticas não têm núcleo delimitado por membrana: o DNA fica em uma região do citoplasma (nucleoide).' },
    erradas: [
      { texto: 'Não tem ribossomos', porque: 'Bactérias têm ribossomos, e é neles que produzem as proteínas (só são menores do que os dos eucariotos).', motivo: 'achou que não há ribossomos' },
      { texto: 'Não tem membrana plasmática', porque: 'Todas as células, inclusive as bactérias, têm membrana plasmática, que delimita a célula e controla o que entra e sai.', motivo: 'esqueceu a membrana plasmática' },
      { texto: 'Não tem parede celular', porque: 'A maioria das bactérias tem parede celular, de peptideoglicano.', motivo: 'achou que bactéria não tem parede' },
    ],
    licao: 'Procariontes: sem núcleo delimitado e sem organelas membranosas; têm ribossomos, membrana plasmática e (em geral) parede celular.',
    dicas: ['O que significa “pro-cariótica” (antes do núcleo)?', 'Ribossomos existem em todas as células.', 'Membrana plasmática também existe em todas.'],
  },
  {
    pergunta: 'O espermatozoide humano tem muitas mitocôndrias na parte intermediária da cauda. Qual é a explicação mais adequada?',
    certa: { texto: 'Ele precisa de muito ATP para o movimento do flagelo, e as mitocôndrias o produzem pela respiração celular', porque: 'O batimento do flagelo gasta muito ATP, e a maior parte do ATP vem da respiração aeróbica nas mitocôndrias.' },
    erradas: [
      { texto: 'Elas fazem a fotossíntese, que fornece glicose ao espermatozoide', porque: 'A fotossíntese ocorre nos cloroplastos, que não existem em células animais.', motivo: 'confundiu mitocôndria com cloroplasto' },
      { texto: 'Elas sintetizam o DNA que será entregue ao óvulo', porque: 'O DNA do espermatozoide está no núcleo e foi replicado antes. A mitocôndria produz ATP, não é a organela que “fabrica” o DNA nuclear.', motivo: 'função errada' },
      { texto: 'Elas digerem os restos celulares, como os lisossomos', porque: 'A digestão intracelular é função dos lisossomos. A mitocôndria produz ATP.', motivo: 'confundiu com lisossomo' },
    ],
    licao: 'Mitocôndria = respiração aeróbica = ATP. Células que gastam muita energia (músculo, espermatozoide) têm muitas mitocôndrias.',
    dicas: ['Para que serve o ATP no movimento de um flagelo?', 'Qual organela produz a maior parte do ATP?', 'Cloroplastos não existem em células animais.'],
  },
  {
    pergunta: 'Em eucariotos, onde ocorre a tradução, a síntese de proteínas a partir do mRNA?',
    certa: { texto: 'No citoplasma, em ribossomos livres ou aderidos ao retículo rugoso', porque: 'O mRNA sai do núcleo e é traduzido pelos ribossomos, que ficam livres no citoplasma ou aderidos ao retículo endoplasmático rugoso.' },
    erradas: [
      { texto: 'No interior do núcleo, dentro do nucléolo', porque: 'O nucléolo produz o RNA ribossômico e monta as subunidades dos ribossomos, mas a tradução ocorre no citoplasma.', motivo: 'confundiu a montagem do ribossomo com a tradução' },
      { texto: 'Exclusivamente no complexo de Golgi', porque: 'O Golgi modifica e empacota proteínas já sintetizadas; não as sintetiza a partir do mRNA.', motivo: 'confundiu Golgi com ribossomo' },
      { texto: 'Exclusivamente nos lisossomos', porque: 'Os lisossomos digerem material; não sintetizam proteínas.', motivo: 'função errada' },
    ],
    licao: 'Transcrição: no núcleo. Tradução: nos ribossomos do citoplasma (livres ou no retículo rugoso).',
    dicas: ['Qual estrutura lê o mRNA?', 'O nucléolo apenas monta as subunidades do ribossomo.', 'O Golgi trabalha depois da síntese.'],
  },
  {
    pergunta: 'De qual substância é formada a parede celular das células vegetais?',
    certa: { texto: 'Celulose', porque: 'A parede das células vegetais é feita principalmente de celulose, um polissacarídeo estrutural.' },
    erradas: [
      { texto: 'Quitina', porque: 'A quitina forma a parede dos fungos e o exoesqueleto dos artrópodes, e não a das plantas.', motivo: 'confundiu com fungos' },
      { texto: 'Peptideoglicano', porque: 'O peptideoglicano forma a parede das bactérias.', motivo: 'confundiu com bactérias' },
      { texto: 'Amido', porque: 'O amido é a reserva de energia das plantas; a função estrutural da parede é da celulose.', motivo: 'confundiu reserva com estrutura' },
    ],
    licao: 'Parede celular: celulose (plantas), quitina (fungos), peptideoglicano (bactérias). Amido é reserva.',
    dicas: ['Parede é estrutural, não reserva de energia.', 'Cada grupo tem um material próprio na parede.', 'Quitina e peptideoglicano são de outros grupos.'],
  },
]

export interface DadosOrganelas {
  tipo: 'funcao' | 'propriedade' | 'banco'
}

export function gerarOrganelas(rng: Rng, nivel: Nivel): InstanciaMulti<DadosOrganelas> {
  if (nivel === 1) {
    const e = escolher(rng, ESTRUTURAS)
    const candidatas = ESTRUTURAS.filter((x) => x.id !== e.id && x.id !== AMBIGUOS[e.id])
    const erradas = embaralhar(rng, candidatas).slice(0, 3)
    return montar<DadosOrganelas>(
      rng,
      { texto: e.nome, porque: `${e.nome} ${e.funcao}.` },
      erradas.map((x) => ({ texto: x.nome, porque: `${x.nome} ${x.funcao}, que não é o que o enunciado descreve.`, motivo: `confundiu com ${x.nome.toLowerCase()}` })),
      {
        enunciado: `Qual estrutura celular ${e.funcao}?`,
        resolucao: `${e.nome} ${e.funcao}.`,
        dicas: ['Lembre o nome da estrutura pela sua função principal.', 'Elimine as opções cuja função você sabe que é outra.', 'Tente associar a função a uma palavra-chave: respiração, fotossíntese, síntese de proteínas, empacotamento, digestão.'],
        licao: 'Cada estrutura tem uma função principal: mitocôndria (ATP), cloroplasto (fotossíntese), ribossomo (proteínas), Golgi (empacotamento), retículos, peroxissomo (H₂O₂), núcleo (DNA).',
        dados: { tipo: 'funcao' },
      },
    )
  }
  if (nivel === 2) {
    const prop = escolher(rng, PROPRIEDADES_ORGANELAS)
    const membros = ESTRUTURAS.filter(prop.ok)
    const outros = ESTRUTURAS.filter((e) => !prop.ok(e))
    const certa = escolher(rng, membros)
    // quando só existem 3 que não satisfazem, todos entram (caso "não existe nas bactérias")
    const erradas = embaralhar(rng, prop.id === 'semBacteria' ? ESTRUTURAS.filter((e) => e.presente.bacteria) : outros).slice(0, 3)
    return montar<DadosOrganelas>(
      rng,
      { texto: certa.nome, porque: `${fatos(certa)} Logo, ${certa.nome.toLowerCase()} ${prop.texto}.` },
      erradas.map((x) => ({ texto: x.nome, porque: `${fatos(x)} Isso não atende à condição do enunciado.`, motivo: `escolheu ${x.nome.toLowerCase()}, que não atende à condição` })),
      {
        enunciado: `Qual das estruturas abaixo ${prop.texto}?`,
        resolucao: `${fatos(certa)}`,
        dicas: ['Monte mentalmente uma tabela: em que tipos de célula cada estrutura aparece?', 'Conte as membranas de cada uma e lembre quais têm DNA próprio.', 'Bactérias só têm ribossomo, parede celular e membrana plasmática.'],
        licao: 'Só vegetais: cloroplasto, vacúolo central e parede. Só animais: centríolo. Bactérias: ribossomo, parede e membrana. Duas membranas: núcleo, mitocôndria e cloroplasto. DNA próprio: mitocôndria e cloroplasto.',
        dados: { tipo: 'propriedade' },
      },
    )
  }
  return doBanco<DadosOrganelas>(rng, BANCO_ORGANELAS, { tipo: 'banco' })
}

/* ================================================================== transporte pela membrana */

const frasePassivo = (t: Transporte) => (t.passivo ? 'a favor do gradiente de concentração' : 'contra o gradiente de concentração')
const fraseProteina = (t: Transporte) => (t.proteina ? 'com a ajuda de proteínas da membrana' : 'sem a ajuda de proteínas')
const fraseAtp = (t: Transporte) => (t.atp ? 'com gasto de ATP' : 'sem gasto de ATP')

/** Em que o transporte `outro` difere do descrito no enunciado (`real`). */
function diferencas(real: Transporte, outro: Transporte): string {
  const partes: string[] = []
  if (real.passivo !== outro.passivo) partes.push(outro.passivo ? 'ocorre a favor do gradiente, mas o enunciado fala em transporte contra o gradiente' : 'ocorre contra o gradiente, mas o enunciado fala em transporte a favor do gradiente')
  if (real.proteina !== outro.proteina) partes.push(outro.proteina ? 'usa proteínas da membrana, e o enunciado diz que não há proteína' : 'não usa proteínas, e o enunciado diz que há proteína')
  if (real.atp !== outro.atp) partes.push(outro.atp ? 'gasta ATP, e o enunciado diz que não há gasto' : 'não gasta ATP, e o enunciado diz que há gasto')
  return `${outro.nome} ${partes.join('; ')}.`
}

export interface CenarioTransporte {
  nome: string
  dentro: number
  fora: number
  unidade: string
  sentido: 'entra' | 'sai'
  modo: 'simples' | 'facilitada' | 'ativo'
  explicacao: string
}

export const CENARIOS_TRANSPORTE: CenarioTransporte[] = [
  { nome: 'gás oxigênio (O₂) em uma célula de um tecido', dentro: 20, fora: 100, unidade: 'unidades arbitrárias', sentido: 'entra', modo: 'simples', explicacao: 'O₂ é pequeno e apolar: atravessa a bicamada lipídica diretamente, a favor do gradiente' },
  { nome: 'gás oxigênio (O₂) em uma célula de folha iluminada, que o produz', dentro: 120, fora: 80, unidade: 'unidades arbitrárias', sentido: 'sai', modo: 'simples', explicacao: 'O₂ é pequeno e apolar: atravessa a bicamada lipídica diretamente, a favor do gradiente' },
  { nome: 'gás carbônico (CO₂) em uma célula que respira', dentro: 60, fora: 40, unidade: 'unidades arbitrárias', sentido: 'sai', modo: 'simples', explicacao: 'CO₂ é pequeno e apolar: atravessa a bicamada lipídica diretamente, a favor do gradiente' },
  { nome: 'gás carbônico (CO₂) em uma célula de folha iluminada, que o consome', dentro: 10, fora: 40, unidade: 'unidades arbitrárias', sentido: 'entra', modo: 'simples', explicacao: 'CO₂ é pequeno e apolar: atravessa a bicamada lipídica diretamente, a favor do gradiente' },
  { nome: 'glicose em uma hemácia', dentro: 1, fora: 5, unidade: 'mmol/L', sentido: 'entra', modo: 'facilitada', explicacao: 'a glicose é polar e grande demais para atravessar a bicamada sozinha, mas o movimento é a favor do gradiente: passa por proteínas carregadoras, sem gasto de ATP' },
  { nome: 'íons Na⁺ passando por canais abertos de um neurônio', dentro: 12, fora: 145, unidade: 'mmol/L', sentido: 'entra', modo: 'facilitada', explicacao: 'íons são carregados e não atravessam a bicamada sozinhos; passam por canais proteicos a favor do gradiente, sem gasto de ATP' },
  { nome: 'íons K⁺ passando por canais abertos de um neurônio', dentro: 140, fora: 5, unidade: 'mmol/L', sentido: 'sai', modo: 'facilitada', explicacao: 'íons são carregados e não atravessam a bicamada sozinhos; passam por canais proteicos a favor do gradiente, sem gasto de ATP' },
  { nome: 'íons Na⁺ expulsos da célula pela bomba de sódio e potássio', dentro: 12, fora: 145, unidade: 'mmol/L', sentido: 'sai', modo: 'ativo', explicacao: 'o Na⁺ vai do meio menos concentrado para o mais concentrado: contra o gradiente, isso exige uma bomba e gasto de ATP' },
  { nome: 'íons K⁺ levados para dentro da célula pela bomba de sódio e potássio', dentro: 140, fora: 5, unidade: 'mmol/L', sentido: 'entra', modo: 'ativo', explicacao: 'o K⁺ vai do meio menos concentrado para o mais concentrado: contra o gradiente, isso exige uma bomba e gasto de ATP' },
  { nome: 'íons Ca²⁺ expulsos de uma célula muscular em repouso', dentro: 0.0001, fora: 1.5, unidade: 'mmol/L', sentido: 'sai', modo: 'ativo', explicacao: 'o Ca²⁺ vai do meio menos concentrado para o mais concentrado: contra o gradiente, isso exige uma bomba e gasto de ATP' },
]

export interface DadosTransporte {
  tipo: 'transporte'
  dentro: number
  fora: number
  unidade: string
  sentido: 'entra' | 'sai'
  substancia: string
}

const OPCAO_NOME: Record<CenarioTransporte['modo'], string> = { simples: 'Difusão simples', facilitada: 'Difusão facilitada', ativo: 'Transporte ativo' }

/** Por que cada tipo de transporte NÃO serve num cenário. */
function motivoErrado(c: CenarioTransporte, modo: CenarioTransporte['modo'] | 'osmose'): { porque: string; motivo: string } {
  const contra = c.modo === 'ativo'
  if (modo === 'osmose') return { porque: 'Osmose é a passagem de ÁGUA pela membrana semipermeável. Aqui o que atravessa é um soluto (gás ou íon), então não é osmose.', motivo: 'confundiu com osmose' }
  if (modo === 'ativo') return { porque: 'O transporte ativo é contra o gradiente e gasta ATP. Aqui a substância se move a favor do gradiente (do meio mais concentrado para o menos concentrado), então não precisa de energia.', motivo: 'achou que gasta ATP' }
  if (contra) return { porque: `${OPCAO_NOME[modo]} só ocorre a favor do gradiente. Aqui a substância vai do meio menos concentrado para o mais concentrado, o que exige bomba e ATP: transporte ativo.`, motivo: 'ignorou o sentido do gradiente' }
  if (modo === 'facilitada') return { porque: 'A difusão facilitada usa proteínas, mas esta substância é pequena e apolar e atravessa a bicamada lipídica diretamente, sem proteína.', motivo: 'achou que precisa de proteína' }
  return { porque: 'A difusão simples ocorre direto pela bicamada lipídica, mas íons e moléculas polares como esta não a atravessam sozinhos: precisam de canais ou proteínas carregadoras (difusão facilitada).', motivo: 'ignorou que é polar ou carregada' }
}

export type DadosMembrana = DadosTransporte | DadosTonicidade | undefined

export function gerarMembrana(rng: Rng, nivel: Nivel): InstanciaMulti<DadosMembrana> {
  if (nivel === 1) {
    const real = escolher(rng, TRANSPORTES)
    const outros = TRANSPORTES.filter((t) => t.id !== real.id)
    const erradas: Opc[] = [
      ...outros.map((t) => ({ texto: t.nome, porque: diferencas(real, t), motivo: `confundiu com ${t.nome.toLowerCase()}` })),
      { texto: 'Endocitose', porque: 'A endocitose engloba partículas ou gotículas em uma vesícula formada pela própria membrana. O enunciado descreve a passagem de uma substância através da membrana, sem vesícula.', motivo: 'confundiu com endocitose' },
    ]
    return montar<DadosMembrana>(
      rng,
      { texto: real.nome, porque: `${real.nome}: ${real.descricao}.` },
      erradas,
      {
        enunciado: `Uma substância atravessa a membrana plasmática ${frasePassivo(real)}, ${fraseProteina(real)} e ${fraseAtp(real)}. Que tipo de transporte é esse?`,
        resolucao: `${frasePassivo(real)[0]?.toUpperCase()}${frasePassivo(real).slice(1)}, ${fraseProteina(real)} e ${fraseAtp(real)} é a descrição da ${real.nome.toLowerCase()}. Exemplo: ${real.exemplo}.`,
        dicas: ['Pergunte: a favor ou contra o gradiente? Precisa de proteína? Gasta ATP?', 'Contra o gradiente sempre exige energia (ATP) e uma bomba.', 'A difusão simples passa pela bicamada de lipídios; a facilitada, por proteínas, mas sem gastar ATP.'],
        licao: 'Difusão simples: a favor do gradiente, sem proteína, sem ATP. Facilitada: a favor, com proteína, sem ATP. Ativo: contra o gradiente, com proteína (bomba) e com ATP.',
      },
    )
  }
  if (nivel === 2) {
    const c = escolher(rng, CENARIOS_TRANSPORTE)
    const fmt = (v: number) => fn(v, 4)
    const erradas: Opc[] = (['simples', 'facilitada', 'ativo'] as const)
      .filter((m) => m !== c.modo)
      .map((m) => ({ texto: OPCAO_NOME[m], ...motivoErrado(c, m) }))
    erradas.push({ texto: 'Osmose', ...motivoErrado(c, 'osmose') })
    const gradiente = c.dentro > c.fora ? 'mais concentrada dentro' : 'mais concentrada fora'
    return montar<DadosMembrana>(
      rng,
      { texto: OPCAO_NOME[c.modo], porque: `${c.nome[0]?.toUpperCase()}${c.nome.slice(1)}: ${c.explicacao}.` },
      erradas,
      {
        enunciado: `A concentração de ${c.nome} é ${fmt(c.dentro)} ${c.unidade} dentro da célula e ${fmt(c.fora)} ${c.unidade} fora. A substância ${c.sentido === 'entra' ? 'entra na célula' : 'sai da célula'}. Qual é o tipo de transporte?`,
        resolucao: `A substância é ${gradiente}, e ${c.sentido === 'entra' ? 'entra' : 'sai'}: ${c.modo === 'ativo' ? 'vai contra o gradiente' : 'vai a favor do gradiente'}. ${c.explicacao}.`,
        dicas: ['Compare as concentrações e o sentido do movimento: a substância vai do meio mais concentrado para o menos concentrado, ou o contrário?', 'Contra o gradiente: transporte ativo. A favor: difusão (simples ou facilitada).', 'Moléculas pequenas e apolares (O₂, CO₂) atravessam sozinhas; íons e moléculas polares precisam de proteínas.'],
        licao: 'Primeiro o gradiente: contra = transporte ativo (ATP). A favor = difusão; se a substância é apolar e pequena, é simples; se é polar ou iônica, é facilitada. Osmose é só a passagem de água.',
        dados: { tipo: 'transporte', dentro: c.dentro, fora: c.fora, unidade: c.unidade, sentido: c.sentido, substancia: c.nome },
      },
    )
  }
  // nível 3: tonicidade
  return gerarTonicidade(rng)
}

export const MOLARES = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]

export interface DadosTonicidade {
  tipo: 'tonicidade'
  celula: 'hemacia' | 'vegetal'
  osmolaridadeExterna: number
}

const TEXTO_TONICIDADE: Record<Tonicidade, string> = { hipotonico: 'hipotônico', isotonico: 'isotônico', hipertonico: 'hipertônico' }
const SENTIDO_AGUA: Record<Tonicidade, string> = { hipotonico: 'a água entra na célula', isotonico: 'a água entra e sai na mesma proporção', hipertonico: 'a água sai da célula' }

type EfeitoId = 'lise' | 'normal' | 'crenacao' | 'turgida' | 'flacida' | 'plasmolise' | 'lise-vegetal' | 'plasmolise-hemacia'

const TEXTO_EFEITO: Record<EfeitoId, string> = {
  lise: 'Ganha água, incha e pode estourar (lise)',
  normal: 'Mantém o volume: entra e sai a mesma quantidade de água',
  crenacao: 'Perde água e murcha (crenação)',
  turgida: 'Ganha água e fica túrgida (a parede impede que estoure)',
  flacida: 'Fica flácida: sem ganho nem perda líquida de água',
  plasmolise: 'Perde água e sofre plasmólise: a membrana se descola da parede celular',
  'lise-vegetal': 'Ganha água e estoura (lise), como a célula animal',
  'plasmolise-hemacia': 'Sofre plasmólise: a membrana se descola da parede celular',
}

/** Tonicidade do meio que produziria cada efeito, para explicar as opções erradas. */
const MEIO_DO_EFEITO: Partial<Record<EfeitoId, Tonicidade>> = { lise: 'hipotonico', normal: 'isotonico', crenacao: 'hipertonico', turgida: 'hipotonico', flacida: 'isotonico', plasmolise: 'hipertonico' }

export const COMBINACOES_TONICIDADE = SOLUTOS.flatMap((s) => MOLARES.map((m) => ({ soluto: s, molar: m, osm: arred3(osmolaridade(m, s.i)) })))

function gerarTonicidade(rng: Rng): InstanciaMulti<DadosMembrana> {
  const alvo = escolher(rng, ['hipotonico', 'isotonico', 'hipertonico'] as Tonicidade[])
  const candidatas = COMBINACOES_TONICIDADE.filter((c) => tonicidade(c.osm, OSMOLARIDADE_CELULA, 1e-6) === alvo)
  const { soluto, molar, osm } = escolher(rng, candidatas)
  const celula = rng() < 0.5 ? 'hemacia' : 'vegetal'
  const ton = tonicidade(osm, OSMOLARIDADE_CELULA, 1e-6)
  const efeito: EfeitoId = celula === 'hemacia' ? efeitoHemacia(ton) : efeitoCelulaVegetal(ton)
  const opcoesIds: EfeitoId[] = celula === 'hemacia' ? ['lise', 'normal', 'crenacao', 'plasmolise-hemacia'] : ['turgida', 'flacida', 'plasmolise', 'lise-vegetal']
  const situacao = `A solução tem ${fn(osm, 3)} osmol/L (${fn(molar, 3)} mol/L × ${soluto.i} partícula${soluto.i > 1 ? 's' : ''}), contra 0,30 osmol/L dentro da célula: o meio é ${TEXTO_TONICIDADE[ton]} e ${SENTIDO_AGUA[ton]}`
  const explicarErrada = (id: EfeitoId): Opc => {
    if (id === 'plasmolise-hemacia') return { texto: TEXTO_EFEITO[id], porque: `${situacao}. Além disso, a hemácia não tem parede celular: plasmólise (descolamento da membrana da parede) só existe em células com parede.`, motivo: 'plasmólise em célula sem parede' }
    if (id === 'lise-vegetal') return { texto: TEXTO_EFEITO[id], porque: `${situacao}. Além disso, a parede celular resiste à entrada de água e impede que a célula vegetal estoure: ela só fica túrgida.`, motivo: 'esqueceu a parede celular' }
    const meio = MEIO_DO_EFEITO[id] as Tonicidade
    return { texto: TEXTO_EFEITO[id], porque: `Isso aconteceria num meio ${TEXTO_TONICIDADE[meio]}, mas ${situacao.replace(/^A solução/, 'aqui a solução')}.`, motivo: `trocou hipotônico, isotônico e hipertônico (${TEXTO_TONICIDADE[meio]})` }
  }
  const nomeCelula = celula === 'hemacia' ? 'Uma hemácia humana' : 'Uma célula vegetal com parede celular'
  return montar<DadosMembrana>(
    rng,
    { texto: TEXTO_EFEITO[efeito], porque: `${situacao}.` },
    opcoesIds.filter((i) => i !== efeito).map(explicarErrada),
    {
      enunciado: `${nomeCelula} (osmolaridade interna de 0,30 osmol/L) é colocada em uma solução de ${soluto.nome} ${fn(molar, 3)} mol/L, com dissociação completa. O que acontece com a célula?`,
      resolucao: `${situacao}. ${celula === 'hemacia' ? 'Sem parede celular, a hemácia incha e pode estourar em meio hipotônico, fica normal em meio isotônico e murcha em meio hipertônico.' : 'Com parede celular, a célula vegetal fica túrgida em meio hipotônico, flácida em meio isotônico e sofre plasmólise em meio hipertônico.'}`,
      dicas: ['Calcule a osmolaridade da solução: concentração × número de partículas liberadas por fórmula (i).', 'Compare com 0,30 osmol/L: menor = hipotônico (água entra); igual = isotônico; maior = hipertônico (água sai).', 'Célula animal pode estourar; a vegetal tem parede, que a protege da lise.'],
      licao: 'Osmolaridade = concentração × i. A água vai do meio de menor para o de maior osmolaridade. Hemácia: lise (hipotônico), normal (isotônico), crenação (hipertônico). Célula vegetal: túrgida, flácida, plasmólise.',
      dados: { tipo: 'tonicidade', celula, osmolaridadeExterna: osm },
    },
  )
}

/* ================================================================== osmose em números */

export interface DadosOsmose {
  tipo: 'osmolaridade' | 'isotonica' | 'pressao' | 'diluicao'
}

const partic = (k: number) => `${k} partícula${k === 1 ? '' : 's'}`

export function gerarOsmose(rng: Rng, nivel: Nivel): InstanciaNum<DadosOsmose> {
  const dicas1 = ['Osmolaridade = concentração (mol/L) × número de partículas que cada unidade do soluto libera na água (i).', 'NaCl → Na⁺ + Cl⁻ (2 partículas); CaCl₂ → Ca²⁺ + 2 Cl⁻ (3 partículas); glicose não se dissocia (1).', 'Conte as partículas por fórmula, não por mol de fórmulas.']
  if (nivel === 1) {
    const s = escolher(rng, SOLUTOS)
    const m = escolher(rng, [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5])
    const resposta = arred3(osmolaridade(m, s.i))
    const erros = limpar(
      [1, 2, 3].map((k) => ({
        valor: arred3(m * k),
        frase: k < s.i ? `Você contou ${partic(k)} por fórmula, mas ${s.nome} libera ${partic(s.i)} na água: osmolaridade = ${fn(m, 3)} × ${s.i}.` : `Você contou ${partic(k)} por fórmula, mas ${s.nome} libera apenas ${partic(s.i)} na água${s.i === 1 ? ' (a molécula não se dissocia)' : ''}: osmolaridade = ${fn(m, 3)} × ${s.i}.`,
        motivo: k < s.i ? 'ignorou a dissociação' : 'contou partículas demais',
      })),
      resposta,
      0.005,
    )
    return {
      enunciado: `Uma solução de ${s.nome} tem concentração ${fn(m, 3)} mol/L. Supondo dissociação completa, qual é a osmolaridade da solução, em osmol/L?`,
      resposta,
      tolerancia: 0.005,
      unidade: 'osmol/L',
      erros,
      resolucao: `${s.nome} libera ${partic(s.i)} por fórmula. Osmolaridade = ${fn(m, 3)} mol/L × ${s.i} = ${fn(resposta, 3)} osmol/L.`,
      dicas: dicas1,
      licao: 'Osmolaridade = concentração × i. O que importa na osmose é o número de partículas dissolvidas, não só a concentração em mol/L.',
      dados: { tipo: 'osmolaridade' },
    }
  }
  if (nivel === 2) {
    const s = escolher(rng, SOLUTOS.filter((x) => x.i >= 2))
    const resposta = escolher(rng, [0.05, 0.1, 0.15, 0.2, 0.25])
    const osm = arred3(resposta * s.i)
    const outro = s.i === 2 ? 3 : 2
    const erros = limpar(
      [
        { valor: osm, frase: `Você usou a osmolaridade (${fn(osm, 3)}) como se fosse a concentração. Como ${s.nome} libera ${partic(s.i)}, é preciso dividir: ${fn(osm, 3)} ÷ ${s.i}.`, motivo: 'ignorou a dissociação' },
        { valor: arred3(osm * s.i), frase: `Você multiplicou por ${s.i} em vez de dividir. A concentração em mol/L é menor que a osmolaridade, porque cada fórmula libera ${s.i} partículas.`, motivo: 'multiplicou em vez de dividir' },
        { valor: arred3(osm / outro), frase: `Você dividiu por ${outro}, mas ${s.nome} libera ${s.i} partículas por fórmula.`, motivo: 'número de partículas errado' },
      ],
      resposta,
      0.005,
    )
    return {
      enunciado: `As células de um tecido têm osmolaridade de ${fn(osm, 3)} osmol/L. Qual deve ser a concentração, em mol/L, de uma solução de ${s.nome} isotônica a essas células (dissociação completa)?`,
      resposta,
      tolerancia: 0.005,
      unidade: 'mol/L',
      erros,
      resolucao: `Isotônica: mesma osmolaridade, ${fn(osm, 3)} osmol/L. Como ${s.nome} libera ${partic(s.i)}, concentração = ${fn(osm, 3)} ÷ ${s.i} = ${fn(resposta, 3)} mol/L.`,
      dicas: ['Isotônica significa mesma osmolaridade dentro e fora.', 'osmolaridade = concentração × i; isole a concentração.', `Quantas partículas cada unidade de ${s.nome} libera?`],
      licao: 'Duas soluções são isotônicas quando têm a mesma osmolaridade (e não necessariamente a mesma concentração em mol/L).',
      dados: { tipo: 'isotonica' },
    }
  }
  if (rng() < 0.5) {
    // pressão osmótica: π = i · M · R · T
    const s = escolher(rng, SOLUTOS)
    const m = escolher(rng, [0.05, 0.1, 0.2, 0.25])
    const celsius = escolher(rng, [27, 37, 47])
    const resposta = Math.round(pressaoOsmotica(m, s.i, celsius) * 1000) / 1000
    const tol = 0.02
    const kelvin = celsius + 273
    const maisUm = s.i === 2 ? 3 : 2
    const erros = limpar(
      [
        { valor: Math.round(s.i * m * 0.082 * celsius * 1000) / 1000, frase: `Você usou a temperatura em °C (${celsius}). Na fórmula de van't Hoff, T é a temperatura absoluta, em kelvin: ${celsius} + 273 = ${kelvin} K.`, motivo: 'temperatura em °C, não em K' },
        { valor: Math.round(m * 0.082 * kelvin * 1000) / 1000, frase: `Você esqueceu o fator i: ${s.nome} libera ${partic(s.i)} por fórmula, e a pressão osmótica depende do número de partículas.`, motivo: 'esqueceu o fator i' },
        { valor: Math.round(maisUm * m * 0.082 * kelvin * 1000) / 1000, frase: `Você usou i = ${maisUm}, mas ${s.nome} libera ${partic(s.i)} por fórmula.`, motivo: 'fator i errado' },
      ],
      resposta,
      tol,
    )
    return {
      enunciado: `Qual é a pressão osmótica, em atm, de uma solução de ${s.nome} ${fn(m, 3)} mol/L a ${celsius} °C (dissociação completa)? Use π = i · M · R · T, com R = 0,082 atm·L/(mol·K).`,
      resposta,
      tolerancia: tol,
      unidade: 'atm',
      erros,
      resolucao: `T = ${celsius} + 273 = ${kelvin} K. π = ${s.i} × ${fn(m, 3)} × 0,082 × ${kelvin} ≈ ${fn(resposta, 3)} atm.`,
      dicas: ['A temperatura da fórmula é absoluta (kelvin): some 273 aos graus Celsius.', `i é o número de partículas por fórmula: ${s.nome} libera ${partic(s.i)}.`, 'Substitua e calcule: π = i · M · R · T.'],
      licao: 'Pressão osmótica π = i · M · R · T, com T em kelvin. Ela mede a tendência de a água entrar na solução por osmose.',
      dados: { tipo: 'pressao' },
    }
  }
  // diluição até a isotonicidade com hemácias (NaCl 0,15 mol/L)
  const c1 = escolher(rng, [0.3, 0.6, 0.9, 1.5])
  const v1 = escolher(rng, [50, 100, 200])
  const resposta = Math.round(volumeFinalDiluicao(c1, v1, 0.15) * 1000) / 1000
  const erros = limpar(
    [
      { valor: resposta - v1, frase: `Esse é o volume de água a ADICIONAR (${fn(resposta, 1)} − ${fn(v1, 1)}). O enunciado pede o volume FINAL da solução.`, motivo: 'deu o volume de água adicionada' },
      { valor: Math.round(((v1 * 0.15) / c1) * 1000) / 1000, frase: 'Você inverteu a razão das concentrações: o volume final é maior que o inicial, porque a solução é diluída (C₁ · V₁ = C₂ · V₂).', motivo: 'inverteu a razão das concentrações' },
      { valor: resposta + v1, frase: `Você somou o volume inicial ao volume final. O volume final já inclui os ${fn(v1, 1)} mL da solução original.`, motivo: 'somou o volume inicial' },
    ],
    resposta,
    0.5,
  )
  return {
    enunciado: `Tem-se ${fn(v1, 1)} mL de solução de NaCl ${fn(c1, 2)} mol/L. Para usá-la como soro fisiológico, isotônico às hemácias (NaCl 0,15 mol/L), ela deve ser diluída com água. Qual deve ser o volume final da solução, em mL?`,
    resposta,
    tolerancia: 0.5,
    unidade: 'mL',
    erros,
    resolucao: `C₁ · V₁ = C₂ · V₂ → ${fn(c1, 2)} × ${fn(v1, 1)} = 0,15 × V₂ → V₂ = ${fn(resposta, 1)} mL (adicionam-se ${fn(resposta - v1, 1)} mL de água).`,
    dicas: ['Na diluição, a quantidade de soluto (mol) não muda: C₁ · V₁ = C₂ · V₂.', 'C₂ = 0,15 mol/L é a concentração desejada.', 'O volume final inclui o volume inicial.'],
    licao: 'Diluição: C₁ · V₁ = C₂ · V₂. O soro fisiológico (NaCl 0,15 mol/L ≈ 0,9 %) é isotônico às hemácias.',
    dados: { tipo: 'diluicao' },
  }
}
