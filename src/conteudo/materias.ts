export type Materia =
  | 'matematica'
  | 'fisica'
  | 'quimica'
  | 'biologia'
  | 'historia'
  | 'geografia'
  | 'filosofia'
  | 'sociologia'

export interface TemaInfo {
  id: string
  titulo: string
  descricao: string
  /** false = ainda não publicado: aparece como "em breve" */
  disponivel: boolean
  /** total de desafios × níveis, para calcular o progresso do tema */
  totalNiveis?: number
}

export interface MateriaInfo {
  id: Materia
  nome: string
  descricao: string
  temas: TemaInfo[]
}

const t = (id: string, titulo: string, descricao: string, disponivel = false, totalNiveis?: number): TemaInfo => ({
  id,
  titulo,
  descricao,
  disponivel,
  totalNiveis,
})

export const MATERIAS: MateriaInfo[] = [
  {
    id: 'matematica',
    nome: 'Matemática',
    descricao: 'Funções, juros, geometria, probabilidade e mais, mexendo nos gráficos.',
    temas: [
      t('funcoes', 'Funções', 'Afim, quadrática, exponencial e logarítmica: veja o gráfico mudar com os coeficientes.', true, 15),
      t('porcentagem-juros', 'Porcentagem e juros', 'Juros simples e compostos lado a lado.', true, 12),
      t('geometria', 'Geometria plana e espacial', 'Sólidos, planificações, semelhança e Pitágoras.', true, 12),
      t('combinatoria', 'Análise combinatória e probabilidade', 'Árvores de possibilidades e experimentos.', true, 12),
      t('pa-pg', 'PA e PG', 'Sequências que crescem como escadas e blocos.', true, 12),
      t('trigonometria', 'Trigonometria', 'O círculo trigonométrico desenhando seno e cosseno.', true, 12),
      t('geometria-analitica', 'Geometria analítica', 'Retas e circunferências por pontos arrastáveis.', true, 12),
      t('estatistica', 'Estatística', 'Média, mediana e moda mudando com os dados.', true, 12),
    ],
  },
  {
    id: 'fisica',
    nome: 'Física',
    descricao: 'Cinemática, dinâmica, termologia e eletricidade em simulações.',
    temas: [
      t('cinematica', 'Cinemática', 'Posição, velocidade, aceleração e lançamentos.', true, 12),
      t('dinamica', 'Dinâmica', 'Forças, atrito e plano inclinado.', true, 12),
      t('termologia', 'Termologia e calorimetria', 'Curvas de aquecimento, misturas e gases.', true, 12),
      t('eletricidade', 'Eletricidade', 'Circuitos em série e paralelo, consumo.', true, 12),
    ],
  },
  {
    id: 'quimica',
    nome: 'Química',
    descricao: 'Estequiometria, soluções, orgânica, equilíbrio e cinética.',
    temas: [
      t('estequiometria', 'Estequiometria', 'Balanceamento e reagente limitante.', true, 12),
      t('solucoes', 'Soluções e concentração', 'Béquer e curva de solubilidade.', true, 12),
      t('organica', 'Química orgânica', 'Grupos funcionais, isômeros e nomes.', true, 12),
      t('equilibrio-ph', 'Equilíbrio, ácidos, bases e pH', 'Le Chatelier e escala de pH.', true, 12),
      t('cinetica', 'Cinética química', 'Colisões, energia de ativação e catalisador.', true, 12),
      t('quimica-verde', 'Meio ambiente e química verde', 'Chuva ácida, efeito estufa e práticas sustentáveis.', true, 12),
    ],
  },
  {
    id: 'biologia',
    nome: 'Biologia',
    descricao: 'Ecologia, genética, biologia molecular e celular.',
    temas: [
      t('ecologia', 'Ecologia', 'Teias alimentares, pirâmides e ciclos.', true, 15),
      t('genetica', 'Genética', 'Cruzamentos, heredogramas e grupos sanguíneos.', true, 18),
      t('molecular', 'Biologia molecular e biotecnologia', 'Do DNA à proteína, mutações e PCR.', true, 21),
      t('celular', 'Biologia celular', 'Organelas, membrana, divisão e metabolismo.', true, 21),
    ],
  },
  {
    id: 'historia',
    nome: 'História',
    descricao: 'Linha do tempo com zoom e desafios de causa e consequência.',
    temas: [t('linha-do-tempo', 'Linha do tempo', 'Do mundo moderno ao Brasil contemporâneo, com zoom, causas e consequências.', true, 18)],
  },
  {
    id: 'geografia',
    nome: 'Geografia',
    descricao: 'Mapas, climas, população e fenômenos em ação.',
    temas: [
      t('placas', 'Placas tectônicas', 'Aproxime, afaste e deslize placas e veja o que se forma.', true, 12),
      t('climogramas', 'Climogramas', 'Leia, compare e monte climogramas de dez cidades.', true, 15),
      t('fenomenos', 'Fenômenos em ação', 'Chuva de relevo, massas de ar, El Niño, ilha de calor e inversão térmica.', true, 15),
      t('populacao', 'Pirâmide etária', 'Leia pirâmides, calcule razões de dependência e veja a transição demográfica.', true, 15),
      t('fusos', 'Fusos horários', 'Calcule a hora em outro lugar, a duração de voos e o fuso de cada longitude.', true, 15),
      t('mapa-desafio', 'Mapa-desafio', 'Clique no país certo.'),
    ],
  },
  {
    id: 'filosofia',
    nome: 'Filosofia',
    descricao: 'Mapa dos pensadores, debates e conceitos.',
    temas: [t('pensadores', 'Mapa dos pensadores', 'Linha do tempo com influências.')],
  },
  {
    id: 'sociologia',
    nome: 'Sociologia',
    descricao: 'Três lentes para a mesma situação social.',
    temas: [t('tres-lentes', 'Três lentes', 'Durkheim, Weber e Marx.')],
  },
]

export function acharMateria(id: string | undefined): MateriaInfo | undefined {
  return MATERIAS.find((m) => m.id === id)
}

export function acharTema(materia: string | undefined, tema: string | undefined) {
  return acharMateria(materia)?.temas.find((x) => x.id === tema)
}
