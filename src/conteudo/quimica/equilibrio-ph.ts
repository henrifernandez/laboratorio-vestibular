import type { PareEPense, SecaoResumo } from '../tipos'

export type VisualEq = { tipo: 'dinamico' } | { tipo: 'kc' } | { tipo: 'chatelier' } | { tipo: 'forcas' } | { tipo: 'escala' } | { tipo: 'titulacao' }

export interface PassoEq {
  titulo: string
  texto: string[]
  pare?: PareEPense
  visual: VisualEq
}

export const PASSOS_EQ: PassoEq[] = [
  {
    titulo: 'Equilíbrio químico: dinâmico, não parado',
    texto: [
      'Em uma reação reversível, os reagentes formam produtos (reação direta) e os produtos voltam a formar reagentes (reação inversa). No início só a direta acontece, depois a inversa cresce, e chega um momento em que as duas têm a mesma velocidade: é o equilíbrio químico.',
      'No equilíbrio as concentrações param de mudar, mas as reações continuam acontecendo nos dois sentidos. Concentração constante não quer dizer concentração igual: reagentes e produtos podem ter valores muito diferentes.',
    ],
    pare: {
      pergunta: 'No equilíbrio químico, o que é verdade?',
      opcoes: ['As velocidades direta e inversa são iguais', 'As reações param', 'As concentrações de reagentes e produtos são iguais'],
      certa: 0,
      explicacao: 'No equilíbrio as duas reações continuam, com velocidades iguais, e por isso as concentrações ficam constantes. Elas não precisam ser iguais entre si.',
    },
    visual: { tipo: 'dinamico' },
  },
  {
    titulo: 'A constante de equilíbrio (Kc)',
    texto: [
      'Para aA + bB ⇌ cC + dD, a constante de equilíbrio em concentração é Kc = [C]ᶜ[D]ᵈ ÷ ([A]ᵃ[B]ᵇ): produtos em cima, reagentes embaixo, cada concentração elevada ao seu coeficiente. Sólidos e líquidos puros não entram.',
      'Kc grande (muito maior que 1) significa equilíbrio com muito produto; Kc pequeno, com pouco produto. Só a temperatura muda o valor de Kc. Para achar as concentrações no equilíbrio, é comum usar uma tabela com o que há no início, o que reage (proporcional aos coeficientes) e o que sobra.',
    ],
    pare: {
      pergunta: 'Em H₂ + I₂ ⇌ 2 HI, no equilíbrio [H₂] = [I₂] = 0,5 mol/L e [HI] = 1 mol/L. Qual é Kc?',
      opcoes: ['4', '2', '0,25'],
      certa: 0,
      explicacao: 'Kc = [HI]² ÷ ([H₂][I₂]) = 1² ÷ (0,5 × 0,5) = 4. O 2 esquece o expoente do HI (1 ÷ 0,5), e 0,25 inverte a fração.',
    },
    visual: { tipo: 'kc' },
  },
  {
    titulo: 'Princípio de Le Chatelier',
    texto: [
      'Quando se perturba um sistema em equilíbrio, ele reage para minimizar a perturbação. Acrescentar um reagente desloca o equilíbrio para os produtos (que o consomem); retirar um produto também. Aumentar a pressão favorece o lado com menos mols de gás. Aquecer favorece a reação endotérmica; resfriar, a exotérmica.',
      'Três coisas NÃO deslocam o equilíbrio: o catalisador (acelera igualmente os dois sentidos), a adição de sólido ou líquido puro e a adição de um gás inerte a volume constante. E só a mudança de temperatura altera o valor de Kc.',
    ],
    pare: {
      pergunta: 'Em N₂(g) + 3 H₂(g) ⇌ 2 NH₃(g), ΔH < 0, o que acontece ao se aumentar a pressão?',
      opcoes: ['Desloca para a direita (mais NH₃)', 'Desloca para a esquerda', 'Não desloca'],
      certa: 0,
      explicacao: 'Há 4 mol de gás nos reagentes e 2 mol nos produtos. Aumentar a pressão favorece o lado com menos mols de gás, ou seja, a formação de NH₃.',
    },
    visual: { tipo: 'chatelier' },
  },
  {
    titulo: 'Ácidos, bases e força',
    texto: [
      'Segundo Arrhenius, ácido libera H⁺ em água e base libera OH⁻. Na definição de Brønsted–Lowry, ácido doa H⁺ e base recebe H⁺ (por exemplo, a água recebe H⁺ do HCl e forma H₃O⁺).',
      'A força depende do grau de ionização: ácido forte (HCl, HNO₃, H₂SO₄ na primeira ionização) ioniza quase por completo; ácido fraco (como o acético) ioniza só um pouco, e seu equilíbrio HA ⇌ H⁺ + A⁻ tem constante Ka pequena. Força não é concentração: um ácido fraco pode estar concentrado, e um forte, diluído.',
    ],
    pare: {
      pergunta: 'Uma solução de ácido acético 0,1 mol/L tem [H⁺] bem menor que 0,1 mol/L. Isso acontece porque o ácido:',
      opcoes: ['É fraco e ioniza só parcialmente', 'É forte e está diluído', 'É uma base'],
      certa: 0,
      explicacao: 'Ácido fraco ioniza só um pouco, então [H⁺] fica bem abaixo da concentração do ácido (cerca de 1,3 % nesse caso). Um ácido forte teria [H⁺] igual a 0,1 mol/L.',
    },
    visual: { tipo: 'forcas' },
  },
  {
    titulo: 'pH, pOH e a escala',
    texto: [
      'A água se ioniza muito pouco: [H⁺][OH⁻] = Kw = 10⁻¹⁴ a 25 °C. O pH é pH = −log [H⁺], e o pOH é pOH = −log [OH⁻], de modo que pH + pOH = 14. Em água pura, [H⁺] = [OH⁻] = 10⁻⁷ mol/L e o pH é 7 (neutro). Abaixo de 7, a solução é ácida; acima de 7, básica.',
      'Cada unidade de pH é um fator 10 na concentração de H⁺: pH 3 é 100 vezes mais ácido que pH 5. Dica de cálculo: para [H⁺] = a × 10⁻ᵏ, pH = k − log a. E uma pegadinha: diluir um ácido nunca o leva além de pH 7, porque a própria água fornece 10⁻⁷ mol/L de H⁺.',
    ],
    pare: {
      pergunta: 'Uma solução tem [H⁺] = 2 × 10⁻⁴ mol/L. Com log 2 = 0,30, o pH é:',
      opcoes: ['3,7', '4,3', '4,0'],
      certa: 0,
      explicacao: 'pH = 4 − log 2 = 4 − 0,30 = 3,7. O 4,3 soma o log em vez de subtrair, e o 4,0 ignora o fator 2.',
    },
    visual: { tipo: 'escala' },
  },
  {
    titulo: 'Neutralização, titulação e indicadores',
    texto: [
      'Ácido + base → sal + água. Na neutralização de um ácido forte por uma base forte, no ponto de equivalência (mols de H⁺ = mols de OH⁻) o pH é 7. Se o ácido for fraco, o ponto de equivalência fica em pH maior que 7, porque o sal formado se hidrolisa e deixa a solução levemente básica.',
      'Na titulação, o pH muda devagar e depois salta perto do ponto de equivalência. Um indicador ácido-base muda de cor numa faixa de pH: a fenolftaleína é incolor abaixo de 8,2 e rosa acima; o azul de bromotimol é amarelo abaixo de 6,0 e azul acima de 7,6; o alaranjado de metila é vermelho abaixo de 3,1 e amarelo acima de 4,4. O indicador certo é aquele que muda de cor onde a curva salta.',
    ],
    pare: {
      pergunta: 'Ao titular ácido acético (fraco) com NaOH, o pH no ponto de equivalência é:',
      opcoes: ['Maior que 7', 'Igual a 7', 'Menor que 7'],
      certa: 0,
      explicacao: 'O sal formado (acetato de sódio) vem de ácido fraco com base forte e deixa a solução levemente básica, em torno de 8,7. Por isso a fenolftaleína é uma boa escolha.',
    },
    visual: { tipo: 'titulacao' },
  },
]

export const RESUMO_EQ: SecaoResumo[] = [
  {
    titulo: 'Equilíbrio químico',
    formulas: [
      { rotulo: 'Constante de equilíbrio', tex: 'K_c = \\dfrac{[C]^c\\,[D]^d}{[A]^a\\,[B]^b}' },
      { rotulo: 'Quociente de reação', tex: 'Q < K_c \\Rightarrow \\text{direta};\\quad Q > K_c \\Rightarrow \\text{inversa}' },
    ],
    ideias: [
      'No equilíbrio, as velocidades direta e inversa são iguais e as concentrações são constantes (não necessariamente iguais).',
      'Sólidos e líquidos puros não entram em Kc. Só a temperatura altera Kc.',
      'Le Chatelier: o sistema minimiza a perturbação. Pressão: lado com menos mols de gás. Temperatura: endotérmica ao aquecer.',
    ],
    pegadinhas: ['Achar que o catalisador desloca o equilíbrio (ele só o acelera).', 'Esquecer que sólidos e gás inerte a volume constante não deslocam.', 'Usar mols no lugar de mol/L em Kc (só dá o mesmo se Δn = 0).'],
  },
  {
    titulo: 'pH e escala',
    formulas: [
      { rotulo: 'Definição', tex: '\\text{pH} = -\\log[\\text{H}^+],\\quad \\text{pOH} = -\\log[\\text{OH}^-]' },
      { rotulo: 'Produto iônico da água', tex: '[\\text{H}^+][\\text{OH}^-] = 10^{-14},\\quad \\text{pH} + \\text{pOH} = 14' },
      { rotulo: 'Para a × 10⁻ᵏ', tex: '\\text{pH} = k - \\log a' },
    ],
    ideias: ['pH < 7 ácido, 7 neutro, > 7 básico (a 25 °C).', 'Cada unidade de pH muda [H⁺] por um fator 10.', 'Ácido forte: [H⁺] = concentração. Diácidos e dibases liberam 2 íons por fórmula.'],
    pegadinhas: ['Diluir um ácido não leva o pH acima de 7.', 'Dar o pOH quando se pede o pH (base).'],
  },
  {
    titulo: 'Ácidos fracos e titulação',
    formulas: [
      { rotulo: 'Ácido fraco', tex: '[\\text{H}^+] = \\sqrt{K_a\\,C},\\quad \\alpha = \\dfrac{[\\text{H}^+]}{C}' },
      { rotulo: 'pKa', tex: 'pK_a = -\\log K_a = 2\\,\\text{pH} + \\log C' },
      { rotulo: 'Neutralização', tex: 'n_{\\text{H}^+} = n_{\\text{OH}^-}\\ \\text{no ponto de equivalência}' },
    ],
    ideias: ['Neutralização: compare mols (C × V); o excesso dividido pelo volume total dá [H⁺] ou [OH⁻].', 'Forte × forte: equivalência em pH 7. Ácido fraco × base forte: pH > 7.', 'O indicador deve virar na região do salto da curva de titulação.'],
    pegadinhas: ['Tirar a média das concentrações em vez de comparar mols.', 'Confundir força (grau de ionização) com concentração.'],
  },
]
