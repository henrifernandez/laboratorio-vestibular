import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualVerde = { tipo: 'combustao' } | { tipo: 'estufa' } | { tipo: 'chuva' } | { tipo: 'ozonio' } | { tipo: 'eutrofizacao' } | { tipo: 'verde' }

export interface PassoVerde {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualVerde
}

export const PASSOS_VERDE: PassoVerde[] = [
  {
    titulo: 'Combustão e emissão de CO₂',
    texto: [
      'Na combustão completa de um combustível orgânico, todo o carbono vira CO₂ e todo o hidrogênio vira H₂O. Na combustão incompleta, falta oxigênio e aparecem também CO e fuligem (carbono). A massa de CO₂ lançada sai da estequiometria: de 2 C₈H₁₈ + 25 O₂ → 16 CO₂ + 18 H₂O, cada 228 g de octano geram 704 g de CO₂.',
      'Para comparar combustíveis, usa-se a emissão por energia liberada (g de CO₂ por MJ). O gás natural (CH₄) emite menos que a gasolina e o etanol porque tem mais hidrogênio por carbono: o hidrogênio queima a H₂O, que libera energia sem produzir CO₂.',
    ],
    pare: {
      pergunta: 'Na combustão completa de 1 mol de butano (C₄H₁₀), quantos mols de CO₂ se formam?',
      opcoes: ['4', '8', '5'],
      certa: 0,
      explicacao: 'Cada carbono do butano vira um CO₂, então 4 mol. O 8 é o coeficiente do CO₂ na equação de 2 C₄H₁₀ (para 2 mol), e o 5 é o número de mols de H₂O por mol de butano.',
    },
    visual: { tipo: 'combustao' },
  },
  {
    titulo: 'Efeito estufa',
    texto: [
      'A Terra recebe radiação solar (principalmente visível) e emite radiação infravermelha. Gases como o vapor de água, o CO₂, o CH₄ e o N₂O absorvem parte desse infravermelho e o reemitem em todas as direções, inclusive de volta para a superfície. Esse efeito estufa natural mantém a média em cerca de 15 °C; sem ele seria cerca de −18 °C.',
      'O problema é a intensificação: queimar combustíveis fósseis, desmatar e criar gado aumentam a concentração de CO₂ e de CH₄, o que retém mais calor. Num modelo simples, quanto maior a fração do infravermelho absorvida pela atmosfera, mais quente fica a superfície.',
    ],
    pare: {
      pergunta: 'Sem o efeito estufa natural, a temperatura média da Terra seria:',
      opcoes: ['Muito mais fria, cerca de −18 °C', 'Mais quente que a atual', 'Igual à atual'],
      certa: 0,
      explicacao: 'O efeito estufa natural retém calor e mantém a superfície em torno de 15 °C. Sem ele, a média ficaria perto de −18 °C. O problema atual é a intensificação desse efeito, não a sua existência.',
    },
    visual: { tipo: 'estufa' },
  },
  {
    titulo: 'Chuva ácida',
    texto: [
      'Carvão e derivados de petróleo contêm enxofre, que queima a SO₂ (S + O₂ → SO₂). Na atmosfera, o SO₂ se oxida a SO₃ (2 SO₂ + O₂ → 2 SO₃), que reage com água e forma ácido sulfúrico (SO₃ + H₂O → H₂SO₄). Já os motores formam NO a alta temperatura (N₂ + O₂ → 2 NO), que vira NO₂ e, com água, ácido nítrico.',
      'A chuva "limpa" já é levemente ácida (pH ≈ 5,6) por causa do CO₂ dissolvido. Chama-se ácida a chuva com pH abaixo de 5,6. Ela corrói mármore e metais, acidifica lagos e prejudica solos e florestas. Reduzir a emissão (combustíveis com menos enxofre, filtros, catalisadores nos escapamentos) é o que resolve; chaminés mais altas apenas dispersam o problema.',
    ],
    pare: {
      pergunta: 'Uma chuva é chamada de ácida quando seu pH é:',
      opcoes: ['Menor que 5,6', 'Menor que 7', 'Maior que 7'],
      certa: 0,
      explicacao: 'A chuva natural já tem pH em torno de 5,6 (CO₂ dissolvido), então o limite usual da chuva ácida é 5,6. Todo pH menor que 7 é ácido, mas a chuva sem poluição já está abaixo de 7.',
    },
    visual: { tipo: 'chuva' },
  },
  {
    titulo: 'Camada de ozônio',
    texto: [
      'O ozônio (O₃) na estratosfera absorve a radiação ultravioleta nociva do Sol. Os CFCs (clorofluorcarbonetos), usados em geladeiras e aerossóis, chegam à estratosfera, onde a radiação ultravioleta os quebra e libera átomos de cloro.',
      'O cloro atua como catalisador: Cl· + O₃ → ClO· + O₂ e depois ClO· + O → Cl· + O₂. Como o cloro é regenerado, um só átomo destrói muitas moléculas de ozônio. O Protocolo de Montreal (1987) determinou a eliminação do uso dos CFCs, e a camada tem se recuperado devagar.',
    ],
    pare: {
      pergunta: 'Por que um único átomo de cloro pode destruir muitas moléculas de ozônio?',
      opcoes: ['Porque ele é regenerado e age como catalisador', 'Porque ele é consumido em cada reação', 'Porque ele forma mais ozônio a cada ciclo'],
      certa: 0,
      explicacao: 'No segundo passo do ciclo o cloro volta a ser Cl·, pronto para atacar outro O₃. Ele é catalisador: acelera a reação sem ser consumido.',
    },
    visual: { tipo: 'ozonio' },
  },
  {
    titulo: 'Eutrofização e poluição da água',
    texto: [
      'Esgoto e fertilizantes levam excesso de nitrogênio e fósforo aos rios e lagos. Esses nutrientes fazem as algas proliferarem (a água fica verde). Quando as algas morrem, bactérias decompõem a matéria orgânica e consomem o oxigênio dissolvido: peixes e outros organismos aeróbicos morrem por falta de O₂.',
      'Por isso o oxigênio dissolvido e a demanda bioquímica de oxigênio (DBO, o oxigênio que os microrganismos consomem para degradar a matéria orgânica) indicam a qualidade da água. Tratar o esgoto e usar fertilizantes com cuidado reduz o problema.',
    ],
    pare: {
      pergunta: 'Na eutrofização, a morte dos peixes ocorre principalmente por:',
      opcoes: ['Falta de oxigênio dissolvido', 'Excesso de oxigênio dissolvido', 'Excesso de luz solar'],
      certa: 0,
      explicacao: 'A decomposição da biomassa das algas mortas consome o oxigênio dissolvido. O excesso de nutrientes é a causa; a falta de O₂ é a consequência que mata os peixes.',
    },
    visual: { tipo: 'eutrofizacao' },
  },
  {
    titulo: 'Química Verde: economia de átomos e fator E',
    texto: [
      'A Química Verde propõe 12 princípios (de Anastas e Warner) para processos que gerem menos resíduos e menos risco: prevenir resíduos, economizar átomos, usar substâncias menos perigosas, solventes inofensivos, menos energia, matérias-primas renováveis, evitar etapas extras, preferir catalisadores, projetar produtos biodegradáveis, monitorar em tempo real e escolher substâncias mais seguras.',
      'Duas medidas ajudam a comparar processos. A economia atômica é (massa do produto desejado ÷ massa de todos os reagentes) × 100: reações de adição chegam a 100 %. O fator E é a massa de resíduos ÷ massa do produto: quanto menor, mais "verde". Exemplo: na esterificação do etanol com ácido acético, 106 g de reagentes dão 88 g de éster e 18 g de água: economia atômica ≈ 83 %.',
    ],
    pare: {
      pergunta: 'A economia atômica de uma reação de adição, em que todos os átomos dos reagentes vão para o produto, é:',
      opcoes: ['100 %', '50 %', '0 %'],
      certa: 0,
      explicacao: 'Se todos os átomos dos reagentes entram no produto, a massa do produto é igual à dos reagentes: 100 %. Reações em que sobra subproduto têm economia atômica menor.',
    },
    visual: { tipo: 'verde' },
  },
]

export const RESUMO_VERDE: SecaoResumo[] = [
  {
    titulo: 'Combustão, efeito estufa e chuva ácida',
    formulas: [
      { rotulo: 'Combustão completa de hidrocarboneto', tex: 'C_xH_y + \\left(x+\\tfrac{y}{4}\\right)\\,O_2 \\rightarrow x\\,CO_2 + \\tfrac{y}{2}\\,H_2O' },
      { rotulo: 'Formação do ácido sulfúrico', tex: 'S \\rightarrow SO_2 \\rightarrow SO_3 \\xrightarrow{H_2O} H_2SO_4' },
    ],
    ideias: [
      'CO₂ (combustão completa) é o gás do aumento do efeito estufa; CO (combustão incompleta) é tóxico.',
      'Chuva ácida: SO₂/SO₃ e NOₓ. A chuva natural tem pH ≈ 5,6 por causa do CO₂; ácida é a de pH menor.',
      'Menos CO₂ por energia: combustíveis com maior razão H/C (gás natural) e fontes renováveis.',
    ],
    pegadinhas: ['Confundir efeito estufa (CO₂, CH₄) com destruição do ozônio (CFCs).', 'Achar que chaminés mais altas eliminam a chuva ácida: elas só dispersam.'],
  },
  {
    titulo: 'Ozônio e eutrofização',
    formulas: [{ rotulo: 'Ciclo catalítico do cloro', tex: '\\text{Cl}\\cdot + O_3 \\rightarrow \\text{ClO}\\cdot + O_2,\\quad \\text{ClO}\\cdot + O \\rightarrow \\text{Cl}\\cdot + O_2' }],
    ideias: ['O ozônio estratosférico protege do ultravioleta; o troposférico é poluente.', 'CFCs liberam cloro, que é catalisador da destruição do ozônio (Protocolo de Montreal, 1987).', 'Eutrofização: excesso de N e P → algas → decomposição → falta de O₂.'],
    pegadinhas: ['Achar que o excesso de nutrientes aumenta o oxigênio da água.', 'Dizer que o cloro é consumido na destruição do ozônio.'],
  },
  {
    titulo: 'Química Verde',
    formulas: [
      { rotulo: 'Economia atômica', tex: '\\text{EA} = \\dfrac{m_{\\text{produto desejado}}}{\\sum m_{\\text{reagentes}}} \\times 100\\,\\%' },
      { rotulo: 'Fator E', tex: 'E = \\dfrac{m_{\\text{resíduos}}}{m_{\\text{produto}}}' },
    ],
    ideias: ['12 princípios: prevenção, economia de átomos, sínteses menos perigosas, produtos mais seguros, solventes seguros, eficiência energética, renováveis, menos derivados, catálise, degradação, análise em tempo real e segurança.', 'Adições têm 100 % de economia atômica.', 'Rendimento baixo aumenta o fator E.'],
    pegadinhas: ['Esquecer os coeficientes ao somar a massa dos reagentes.', 'Confundir prevenção de resíduos (1) com economia de átomos (2).'],
  },
]
