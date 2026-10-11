import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualTer =
  | { tipo: 'curva'; Tini: number; /** calor já recebido por grama (cal/g) */ q: number }
  | { tipo: 'copos'; corpos: { rotulo: string; m: number; T: number; gelo?: boolean }[] }
  | { tipo: 'gas'; processo: 'isotermica' | 'isobarica' | 'isocorica' }

export interface PassoTer {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualTer
}

export const PASSOS_TER: PassoTer[] = [
  {
    titulo: 'Calor e temperatura não são a mesma coisa',
    texto: [
      'Temperatura mede o quão agitadas estão as partículas de um corpo. Calor é a energia que passa de um corpo mais quente para um mais frio, por causa da diferença de temperatura.',
      'Para esquentar um corpo, o calor necessário é Q = m·c·ΔT: cresce com a massa, com o calor específico (quanto o material “resiste” a esquentar) e com a variação de temperatura. A água tem c = 1 cal/g·°C, bem maior que o dos metais.',
    ],
    pare: {
      pergunta: 'Que quantidade de calor é necessária para aquecer 200 g de água de 20 °C até 70 °C? (c = 1 cal/g·°C)',
      opcoes: ['10.000 cal', '14.000 cal', '50 cal'],
      certa: 0,
      explicacao: 'Q = m·c·ΔT = 200·1·(70 − 20) = 10.000 cal. O 14.000 vem de usar a temperatura final (200·70), e o 50 é só o ΔT, sem multiplicar pela massa.',
    },
    visual: { tipo: 'curva', Tini: -20, q: 130 },
  },
  {
    titulo: 'Mudança de fase: o calor não esquenta, transforma',
    texto: [
      'Quando o gelo derrete a 0 °C ou a água ferve a 100 °C, o calor recebido não aumenta a temperatura: ele é gasto para rearranjar as partículas. No gráfico, é o patamar, uma reta horizontal.',
      'A conta é Q = m·L, com L o calor latente: 80 cal/g na fusão e 540 cal/g na vaporização. Por isso o patamar da vaporização é bem mais comprido que o da fusão. Já o gelo e o vapor (c = 0,5) esquentam mais depressa que a água (c = 1): suas retas são mais inclinadas.',
    ],
    pare: {
      pergunta: 'Um bloco de gelo a 0 °C começa a derreter. Durante a fusão, a temperatura da mistura de gelo e água...',
      opcoes: ['sobe devagar', 'permanece em 0 °C', 'cai abaixo de 0 °C'],
      certa: 1,
      explicacao: 'Durante uma mudança de fase de uma substância pura, a temperatura fica constante: o calor é usado na transformação (m·L), e não no aquecimento.',
    },
    visual: { tipo: 'curva', Tini: -20, q: 50 },
  },
  {
    titulo: 'Equilíbrio térmico: o que um perde, o outro ganha',
    texto: [
      'Misture 300 g de água a 80 °C com 100 g de água a 20 °C num recipiente isolado. A quente cede calor, a fria recebe, e param quando as temperaturas se igualam. Como nada escapa, Q₁ + Q₂ = 0.',
      'Isso dá T = (m₁c₁T₁ + m₂c₂T₂)/(m₁c₁ + m₂c₂): uma média ponderada pela capacidade térmica m·c. A temperatura final fica mais perto do corpo de maior m·c.',
    ],
    pare: {
      pergunta: 'Misturam-se 300 g de água a 80 °C com 100 g de água a 20 °C. A temperatura de equilíbrio é...',
      opcoes: ['50 °C', '65 °C', '35 °C'],
      certa: 1,
      explicacao: 'T = (300·80 + 100·20)/(300 + 100) = 26.000/400 = 65 °C. Os 50 °C seriam a média simples, que só vale se as massas fossem iguais.',
    },
    visual: { tipo: 'copos', corpos: [{ rotulo: 'quente', m: 300, T: 80 }, { rotulo: 'fria', m: 100, T: 20 }] },
  },
  {
    titulo: 'Com gelo, a conta ganha uma etapa',
    texto: [
      'Quando um dos corpos é gelo, o calor cedido pela água quente primeiro aquece o gelo até 0 °C e depois o funde (m·L). Só o que sobrar passa a aquecer a mistura.',
      'Se o calor que a água quente pode ceder (até 0 °C) não basta para derreter todo o gelo, o equilíbrio fica em 0 °C, com água e gelo juntos. Aí a pergunta típica é quanto gelo sobra.',
    ],
    pare: {
      pergunta: '100 g de gelo a 0 °C são misturados com 100 g de água a 40 °C. Qual será o estado final? (L = 80 cal/g)',
      opcoes: ['Só água, a 20 °C', 'Água e gelo a 0 °C (restam 50 g de gelo)', 'Só gelo a 0 °C'],
      certa: 1,
      explicacao: 'A água a 40 °C pode ceder 100·1·40 = 4.000 cal ao chegar a 0 °C, e isso derrete 4.000/80 = 50 g. Não basta para fundir os 100 g: sobram 50 g de gelo a 0 °C. Os 20 °C seriam a média simples, ignorando a fusão.',
    },
    visual: { tipo: 'copos', corpos: [{ rotulo: 'gelo', m: 100, T: 0, gelo: true }, { rotulo: 'água', m: 100, T: 40 }] },
  },
  {
    titulo: 'Gases: pressão, volume e temperatura andam juntos',
    texto: [
      'Num gás ideal, p·V/T é constante. Se a temperatura não muda (isotérmica), p·V é constante: comprimir o gás aumenta a pressão. Se a pressão é constante (isobárica), V/T é constante: aquecer o gás o faz expandir. Se o volume é constante (isocórica), p/T é constante.',
      'Atenção: nessas contas, a temperatura precisa estar em kelvin (K = °C + 273). Usar graus Celsius é o erro mais comum.',
    ],
    pare: {
      pergunta: 'Um gás a 27 °C é aquecido a pressão constante até 327 °C. O volume final em relação ao inicial é...',
      opcoes: ['12 vezes maior', 'o dobro', 'o mesmo'],
      certa: 1,
      explicacao: 'Em kelvin: 300 K → 600 K. V/T constante: o volume dobra. Usar °C daria 327/27 ≈ 12, o erro clássico.',
    },
    visual: { tipo: 'gas', processo: 'isobarica' },
  },
]

export const RESUMO_TER: SecaoResumo[] = [
  {
    titulo: 'Calor sensível e latente',
    formulas: [
      { rotulo: 'Calor sensível', tex: 'Q = m\\,c\\,\\Delta T' },
      { rotulo: 'Calor latente', tex: 'Q = m\\,L' },
      { rotulo: 'Água (cal, g, °C)', tex: 'c_{gelo}=c_{vapor}=0{,}5 \\;\\; c_{\\text{água}}=1 \\;\\; L_F=80 \\;\\; L_V=540' },
    ],
    ideias: ['Onde a temperatura varia: m·c·ΔT. Na mudança de fase: m·L, com T constante (patamar).', 'Gelo e vapor esquentam mais depressa que a água (c menor).', 'Vaporizar exige muito mais calor que fundir.'],
    pegadinhas: ['ΔT é final menos inicial (e não a temperatura final).', '1 kcal = 1.000 cal.', 'Esquecer uma etapa (fusão, por exemplo) ao somar.'],
  },
  {
    titulo: 'Equilíbrio térmico',
    formulas: [
      { rotulo: 'Balanço', tex: '\\sum Q = 0' },
      { rotulo: 'Temperatura final', tex: 'T = \\dfrac{\\sum m\\,c\\,T}{\\sum m\\,c}' },
    ],
    ideias: ['O que um corpo cede, o outro recebe (sistema isolado).', 'O peso de cada corpo é a capacidade térmica m·c.', 'Com gelo: aquecer até 0 °C, fundir e só então aquecer a mistura.'],
    pegadinhas: ['Média simples só vale com massas e calores específicos iguais.', 'Se não há calor para fundir todo o gelo, T = 0 °C e resta gelo.'],
  },
  {
    titulo: 'Gases ideais',
    formulas: [
      { rotulo: 'Lei geral', tex: '\\dfrac{p_1 V_1}{T_1} = \\dfrac{p_2 V_2}{T_2}' },
      { rotulo: 'Escala absoluta', tex: 'T(\\text{K}) = T(^\\circ\\text{C}) + 273' },
      { rotulo: 'Trabalho (isobárica)', tex: '\\tau = p\\,\\Delta V' },
    ],
    ideias: ['Isotérmica: p·V = constante. Isobárica: V/T = constante. Isocórica: p/T = constante.', 'No diagrama p × V, o trabalho é a área sob a curva.', 'Expansão: o gás realiza trabalho; compressão: recebe trabalho.'],
    pegadinhas: ['Sempre kelvin nas leis dos gases.', 'Na isotérmica, pressão e volume variam em sentidos opostos.'],
  },
]
