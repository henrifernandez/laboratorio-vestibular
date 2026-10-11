import type { Correcao, Desafio, Nivel } from '@/desafios/tipos'
import { criarRng, escolher } from '@/lib/rng'

export type ForcaId = 'peso' | 'normal' | 'atrito' | 'tracao' | 'movimento'
export type Direcao = 'nenhuma' | 'cima' | 'baixo' | 'esquerda' | 'direita' | 'perpPlano' | 'subindoPlano' | 'descendoPlano'
export type CenarioId = 'mesa' | 'pendurado' | 'subindo' | 'puxado' | 'planoParado' | 'planoDescendo' | 'planoPuxado'

export type RespostaDCL = Record<ForcaId, Direcao>

export const FORCAS: { id: ForcaId; nome: string; cor: string }[] = [
  { id: 'peso', nome: 'Peso (P)', cor: 'var(--erro)' },
  { id: 'normal', nome: 'Normal (N)', cor: 'var(--ok)' },
  { id: 'atrito', nome: 'Atrito (f)', cor: 'var(--aviso)' },
  { id: 'tracao', nome: 'Tração / força aplicada (T)', cor: 'var(--accent)' },
  { id: 'movimento', nome: '"Força do movimento"', cor: 'var(--ink-muted)' },
]

/** inclinação do plano nas figuras (descendo para a direita) */
export const ANGULO_PLANO = 30

export const NOME_DIRECAO: Record<Direcao, string> = {
  nenhuma: 'não atua',
  cima: 'para cima',
  baixo: 'para baixo',
  esquerda: 'para a esquerda',
  direita: 'para a direita',
  perpPlano: 'perpendicular ao plano (saindo dele)',
  subindoPlano: 'paralela ao plano, para cima',
  descendoPlano: 'paralela ao plano, para baixo',
}

/** vetor unitário no plano da tela (x para a direita, y para BAIXO, como no SVG) */
export function vetorDe(d: Direcao): [number, number] {
  const a = (ANGULO_PLANO * Math.PI) / 180
  switch (d) {
    case 'cima':
      return [0, -1]
    case 'baixo':
      return [0, 1]
    case 'esquerda':
      return [-1, 0]
    case 'direita':
      return [1, 0]
    case 'perpPlano':
      return [Math.sin(a), -Math.cos(a)]
    case 'subindoPlano':
      return [-Math.cos(a), -Math.sin(a)]
    case 'descendoPlano':
      return [Math.cos(a), Math.sin(a)]
    case 'nenhuma':
      return [0, 0]
  }
}

const SEM_FORCAS: RespostaDCL = { peso: 'nenhuma', normal: 'nenhuma', atrito: 'nenhuma', tracao: 'nenhuma', movimento: 'nenhuma' }

const GABARITOS: Record<CenarioId, RespostaDCL> = {
  mesa: { ...SEM_FORCAS, peso: 'baixo', normal: 'cima' },
  pendurado: { ...SEM_FORCAS, peso: 'baixo', tracao: 'cima' },
  subindo: { ...SEM_FORCAS, peso: 'baixo', tracao: 'cima' },
  puxado: { ...SEM_FORCAS, peso: 'baixo', normal: 'cima', atrito: 'esquerda', tracao: 'direita' },
  planoParado: { ...SEM_FORCAS, peso: 'baixo', normal: 'perpPlano', atrito: 'subindoPlano' },
  planoDescendo: { ...SEM_FORCAS, peso: 'baixo', normal: 'perpPlano', atrito: 'subindoPlano' },
  planoPuxado: { ...SEM_FORCAS, peso: 'baixo', normal: 'perpPlano', atrito: 'descendoPlano', tracao: 'subindoPlano' },
}

export const DESCRICAO: Record<CenarioId, string> = {
  mesa: 'Um bloco está em repouso sobre uma mesa horizontal e perfeitamente lisa (sem atrito).',
  pendurado: 'Um bloco está pendurado por um fio, em repouso.',
  subindo: 'Um bloco é erguido por um fio, subindo com velocidade constante.',
  puxado: 'Um bloco é puxado para a direita por uma força horizontal sobre uma mesa com atrito, e acelera para a direita.',
  planoParado: 'Um bloco está em repouso sobre um plano inclinado com atrito (o plano desce para a direita).',
  planoDescendo: 'Um bloco desliza para baixo sobre um plano inclinado com atrito (o plano desce para a direita).',
  planoPuxado: 'Um bloco é puxado por um fio paralelo ao plano inclinado com atrito e sobe com velocidade constante.',
}

const POR_NIVEL: Record<Nivel, CenarioId[]> = {
  1: ['mesa', 'pendurado', 'subindo'],
  2: ['puxado', 'planoParado'],
  3: ['planoDescendo', 'planoPuxado'],
}

export interface InstanciaDCL {
  semente: number
  nivel: Nivel
  cenario: CenarioId
}

const REGRAS: Record<ForcaId, string> = {
  peso: 'O peso é a atração da Terra: aponta sempre verticalmente para baixo, a partir do centro do bloco.',
  normal: 'A normal é a reação da superfície: é perpendicular à superfície de contato e sai dela em direção ao bloco.',
  atrito: 'O atrito é paralelo à superfície e se opõe ao movimento (ou à tendência de movimento) do bloco.',
  tracao: 'A tração (ou a força aplicada) atua ao longo do fio, ou na direção em que o bloco é puxado.',
  movimento: 'Não existe "força do movimento". Um corpo em movimento continua se movendo por inércia; só uma variação da velocidade exige uma força resultante.',
}

const AUSENTE: Record<CenarioId, Partial<Record<ForcaId, string>>> = {
  mesa: { atrito: 'A mesa é lisa, então não há atrito.', tracao: 'Não há fio nem ninguém puxando o bloco.' },
  pendurado: { normal: 'O bloco não encosta em nenhuma superfície: não há normal.', atrito: 'Não há superfície de contato para gerar atrito.' },
  subindo: { normal: 'O bloco não encosta em nenhuma superfície: não há normal.', atrito: 'Não há superfície de contato para gerar atrito.' },
  puxado: {},
  planoParado: { tracao: 'Não há fio nem força aplicada: o bloco só é segurado pelo atrito.' },
  planoDescendo: { tracao: 'Não há fio nem força aplicada: o bloco desce só por causa do peso.' },
  planoPuxado: {},
}

const ESPECIFICO: Partial<Record<CenarioId, Partial<Record<ForcaId, string>>>> = {
  puxado: { atrito: 'O bloco vai para a direita, então o atrito (contra o movimento) aponta para a esquerda.' },
  planoParado: { atrito: 'O bloco tende a descer o plano, então o atrito aponta para cima do plano e o segura.' },
  planoDescendo: { atrito: 'O bloco desce o plano, então o atrito (contra o movimento) aponta para cima do plano.' },
  planoPuxado: { atrito: 'O bloco sobe o plano, então o atrito (contra o movimento) aponta para baixo, ao longo do plano.' },
}

export const diagrama = {
  id: 'fisica/dinamica/dcl',
  materia: 'fisica',
  tema: 'dinamica',
  titulo: 'Diagrama de corpo livre',

  gerar(semente: number, nivel: Nivel): InstanciaDCL {
    const rng = criarRng(semente * 2654435761 + nivel * 53)
    return { semente, nivel, cenario: escolher(rng, POR_NIVEL[nivel]) }
  },

  gabarito(c: CenarioId): RespostaDCL {
    return { ...GABARITOS[c] }
  },

  respostaInicial(): RespostaDCL {
    return { ...SEM_FORCAS }
  },

  corrigir(inst: InstanciaDCL, resposta: RespostaDCL): Correcao {
    const gab = GABARITOS[inst.cenario]
    const destaque = { gabarito: gab, resposta }
    let acertos = 0
    const problemas: { motivo: string; frase: string; licao: string }[] = []
    for (const f of FORCAS) {
      const esperado = gab[f.id]
      const dado = resposta[f.id]
      if (esperado === dado) {
        acertos++
        continue
      }
      if (f.id === 'movimento') {
        problemas.unshift({ motivo: 'inventou uma "força do movimento"', frase: `${REGRAS.movimento} Retire essa força do diagrama.`, licao: 'não existe força do movimento: velocidade não precisa de força, aceleração precisa' })
      } else if (esperado === 'nenhuma') {
        const porque = AUSENTE[inst.cenario][f.id] ?? 'Ela não atua neste caso.'
        problemas.push({ motivo: f.id === 'atrito' ? 'colocou atrito onde não há' : `colocou ${f.id === 'tracao' ? 'tração' : f.nome.split(' ')[0]!.toLowerCase()} onde não há`, frase: `${f.nome.replace(/ \(.*/, '')} não atua aqui. ${porque}`, licao: 'desenhe só forças que têm um agente: contato (normal, atrito, tração) ou campo (peso)' })
      } else if (dado === 'nenhuma') {
        problemas.push({ motivo: `faltou ${f.id === 'tracao' ? 'a tração' : `o ${f.id === 'peso' ? 'peso' : f.id}`.replace('o normal', 'a normal').replace('o atrito', 'o atrito')}`, frase: `Faltou a ${f.nome.replace(/ \(.*/, '').toLowerCase()}. ${REGRAS[f.id]}`, licao: REGRAS[f.id] })
      } else {
        const extra = ESPECIFICO[inst.cenario]?.[f.id]
        problemas.push({
          motivo: `${f.id === 'tracao' ? 'tração' : f.id} com direção errada`,
          frase: `${f.nome.replace(/ \(.*/, '')}: você apontou ${NOME_DIRECAO[dado]}, mas ela aponta ${NOME_DIRECAO[esperado]}. ${extra ?? REGRAS[f.id]}${f.id === 'atrito' ? ' Lembre: o atrito é oposto ao movimento.' : ''}`,
          licao: REGRAS[f.id],
        })
      }
    }
    const parcial = acertos / FORCAS.length
    if (problemas.length === 0) {
      return { correto: true, parcial: 1, feedback: 'Isso! Todas as forças certas, cada uma na direção certa, e nenhuma "força do movimento".', destaque }
    }
    const [primeiro, ...resto] = problemas
    return {
      correto: false,
      parcial,
      feedback: [primeiro?.frase, ...resto.slice(0, 1).map((p) => p.frase)].join(' '),
      motivo: primeiro?.motivo,
      licao: primeiro?.licao,
      destaque,
    }
  },

  dicas(i: InstanciaDCL): string[] {
    return [
      'Liste as interações do bloco: com a Terra (peso), com a superfície (normal e atrito) e com fios ou pessoas (tração, força aplicada).',
      'Cada força tem um agente. Se não há ninguém fazendo uma força, ela não entra no diagrama.',
      `${DESCRICAO[i.cenario]} Para o atrito, pergunte: para onde o bloco vai (ou tenta ir)? O atrito aponta no sentido oposto.`,
    ]
  },

  explicar(i: InstanciaDCL): string {
    const g = GABARITOS[i.cenario]
    const partes = FORCAS.filter((f) => g[f.id] !== 'nenhuma').map((f) => `${f.nome.replace(/ \(.*/, '')}: ${NOME_DIRECAO[g[f.id]]}`)
    const ausentes = FORCAS.filter((f) => f.id !== 'movimento' && g[f.id] === 'nenhuma').map((f) => `${f.nome.replace(/ \(.*/, '')} (${AUSENTE[i.cenario][f.id] ?? 'não atua'})`)
    return `${DESCRICAO[i.cenario]} Forças: ${partes.join('; ')}.${ausentes.length ? ` Não atuam: ${ausentes.join(' ')}` : ''} Nunca há "força do movimento".`
  },
} satisfies Desafio<InstanciaDCL, RespostaDCL> & {
  gabarito(c: CenarioId): RespostaDCL
  respostaInicial(): RespostaDCL
}
