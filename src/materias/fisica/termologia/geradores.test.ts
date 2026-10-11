import { criarRng } from '@/lib/rng'
import { corrigirMulti, corrigirNum } from '@/desafios/simples'
import { estadoAposCalor } from './calculo'
import { gerarCalor, gerarCurva, gerarEquilibrio, gerarGas } from './geradores'

const NIVEIS = [1, 2, 3] as const
const SEMENTES = Array.from({ length: 120 }, (_, i) => i + 1)
const rng = (s: number, n: number) => criarRng(s * 6151 + n)

/** Entalpia específica da água em relação ao gelo a 0 °C (cal/g): formulação por função de estado. */
function h(fase: 'gelo' | 'fusao' | 'agua' | 'vaporizacao' | 'vapor', T: number, fracao = 0): number {
  if (fase === 'gelo') return 0.5 * T
  if (fase === 'fusao') return 80 * fracao
  if (fase === 'agua') return 80 + T
  if (fase === 'vaporizacao') return 180 + 540 * fracao
  return 720 + 0.5 * (T - 100)
}

describe('Quanto calor?', () => {
  it('o calor total é a diferença de entalpia entre o estado final e o inicial', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarCalor(rng(s, n), n)
        const d = inst.dados!
        const hIni = d.inicio.fase === 'gelo' ? h('gelo', d.inicio.T) : h('agua', d.inicio.T)
        // fim em água: fase líquida; fim em vapor a 100 °C significa vapor saturado (toda a massa vaporizada)
        const hFim = d.fim.fase === 'agua' ? h('agua', d.fim.T) : h('vapor', d.fim.T)
        // início em gelo a 0 °C: ainda sólido; início em água a 100 °C: ainda líquida
        const hIni2 = d.inicio.fase === 'agua' && d.inicio.T === 100 ? h('agua', 100) : hIni
        const q = d.m * (hFim - hIni2)
        const esperado = d.kcal ? q / 1000 : q
        expect(inst.resposta).toBeCloseTo(esperado, 6)
      }
    }
  })
  it('bate com a curva de aquecimento (estado ao receber exatamente esse calor)', () => {
    for (const s of SEMENTES) {
      const inst = gerarCalor(rng(s, 3), 3)
      const d = inst.dados!
      const q = (d.kcal ? inst.resposta * 1000 : inst.resposta)
      const e = estadoAposCalor(d.m, d.inicio.T, q)
      if (d.fim.fase === 'agua') {
        expect(['agua']).toContain(e.fase)
        expect(e.T).toBeCloseTo(d.fim.T, 6)
      } else if (d.fim.T === 100) {
        // exatamente ao fim da vaporização (fração = 1): ainda marcado como vaporização completa
        expect(e.fase === 'vaporizacao' && Math.abs(e.fracao - 1) < 1e-9).toBe(true)
      } else {
        expect(e.fase).toBe('vapor')
        expect(e.T).toBeCloseTo(d.fim.T, 6)
      }
    }
  })
  it('erros típicos diferem da resposta, explicam e a resposta certa passa', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarCalor(rng(s, n), n)
        expect(inst.erros.length).toBeGreaterThanOrEqual(1)
        for (const e of inst.erros) {
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
          expect(e.frase.length).toBeGreaterThan(25)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
      }
    }
  })
  it('o nível 3 sempre passa por mais de duas etapas e o nível 1 por apenas uma', () => {
    for (const s of SEMENTES) {
      expect(gerarCalor(rng(s, 1), 1).dados!.etapas).toHaveLength(1)
      expect(gerarCalor(rng(s, 3), 3).dados!.etapas.length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('Temperatura de equilíbrio', () => {
  /** inverte a curva de entalpia específica do conjunto: devolve T e a fração de gelo */
  function resolver(corpos: { m: number; T: number; gelo?: boolean }[]) {
    const total = corpos.reduce((s, c) => s + c.m, 0)
    const H0 = corpos.reduce((s, c) => s + c.m * (c.gelo ? 0.5 * c.T : 80 + c.T), 0)
    const hm = H0 / total
    if (hm < 0) return { T: hm / 0.5, gelo: total }
    if (hm <= 80) return { T: 0, gelo: total * (1 - hm / 80) }
    return { T: hm - 80, gelo: 0 }
  }
  it('níveis 1 e 3 conferem com a inversão da curva de entalpia', () => {
    for (const n of [1, 3] as const) {
      for (const s of SEMENTES) {
        const inst = gerarEquilibrio(rng(s, n), n)
        const d = inst.dados!
        const r = resolver(d.corpos)
        expect(inst.resposta).toBeCloseTo(d.pede === 'T' ? r.T : r.gelo, 6)
      }
    }
  })
  it('nível 2: calor cedido igual ao recebido', () => {
    for (const s of SEMENTES) {
      const inst = gerarEquilibrio(rng(s, 2), 2)
      const d = inst.dados!
      const m = d.corpos
      // pelo enunciado: c do metal está no texto; recupera pelo balanço usando c = 0,2 ou 0,1
      const ok = [0.2, 0.1].some((c) => {
        const Te = inst.resposta
        const soma = m[0]!.m * c * (Te - m[0]!.T) + m[1]!.m * 1 * (Te - m[1]!.T)
        return Math.abs(soma) < 1e-6
      })
      expect(ok).toBe(true)
    }
  })
  it('o nível 3 mostra os dois tipos de pergunta e nunca cai no caso de congelar', () => {
    const pede = new Set<string>()
    for (const s of SEMENTES) {
      const d = gerarEquilibrio(rng(s, 3), 3).dados!
      pede.add(d.pede)
    }
    expect(pede.has('T')).toBe(true)
    expect(pede.has('gelo')).toBe(true)
  })
  it('erros típicos válidos', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarEquilibrio(rng(s, n), n)
        expect(inst.erros.length).toBeGreaterThanOrEqual(1)
        for (const e of inst.erros) expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
      }
    }
  })
})

describe('Gráfico de aquecimento', () => {
  const interp = (pts: { x: number; y: number }[], x: number) => {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!
      const b = pts[i]!
      if (x >= a.x - 1e-9 && x <= b.x + 1e-9) return b.x === a.x ? b.y : a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x)
    }
    return NaN
  }
  it('níveis 1 e 2: a opção certa reproduz a curva física', () => {
    for (const n of [1, 2] as const) {
      for (const s of SEMENTES) {
        const inst = gerarCurva(rng(s, n), n)
        const d = inst.dados!
        const certa = d.opcoes[inst.certa]!.pontos
        const Tini = certa[0]!.y
        const xf = certa[certa.length - 1]!.x
        for (let k = 0; k <= 40; k++) {
          const x = (xf * k) / 40
          const e = estadoAposCalor(100, Tini, x * 100)
          expect(interp(certa, x)).toBeCloseTo(e.T, 1)
        }
      }
    }
  })
  it('nível 3: a certa é a curva de referência esticada ao dobro no tempo', () => {
    for (const s of SEMENTES) {
      const inst = gerarCurva(rng(s, 3), 3)
      const d = inst.dados!
      const certa = d.opcoes[inst.certa]!.pontos
      const ref = d.referencia!
      const Tini = ref[0]!.y
      const xf = certa[certa.length - 1]!.x
      for (let k = 0; k <= 40; k++) {
        const x = (xf * k) / 40
        // 200 g com a mesma fonte: o calor acumulado no instante x (em unidades de calor/100 g) é x·100
        const e = estadoAposCalor(200, Tini, x * 100)
        expect(interp(certa, x)).toBeCloseTo(e.T, 1)
      }
    }
  })
  it('as erradas diferem da certa e cada uma é explicada', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarCurva(rng(s, n), n)
        const d = inst.dados!
        const certa = d.opcoes[inst.certa]!.pontos
        expect(inst.opcoes).toHaveLength(4)
        for (const o of inst.opcoes) {
          if (o.id === inst.certa) {
            expect(corrigirMulti(inst, o.id).correto).toBe(true)
            continue
          }
          const errada = d.opcoes[o.id]!.pontos
          let maior = 0
          for (let k = 0; k <= 60; k++) {
            const x = (certa[certa.length - 1]!.x * k) / 60
            const a = interp(certa, x)
            const b = interp(errada, Math.min(x, errada[errada.length - 1]!.x))
            if (Number.isFinite(a) && Number.isFinite(b)) maior = Math.max(maior, Math.abs(a - b))
          }
          expect(maior).toBeGreaterThan(2)
          expect(inst.porque[o.id]!.length).toBeGreaterThan(30)
          expect(inst.motivo![o.id]!.length).toBeGreaterThan(5)
        }
      }
    }
  })
})

describe('Gás no pistão', () => {
  it('estado inicial e final obedecem à lei geral p·V/T', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const d = gerarGas(rng(s, n), n).dados!
        const a = (d.ini.p * d.ini.V) / d.ini.T
        const b = (d.fim.p * d.fim.V) / d.fim.T
        expect(a).toBeCloseTo(b, 9)
      }
    }
  })
  it('a resposta é a grandeza pedida, na unidade pedida', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarGas(rng(s, n), n)
        const d = inst.dados!
        const esperado = d.pede === 'p' ? d.fim.p : d.pede === 'V' ? d.fim.V : d.fim.T - 273
        expect(inst.resposta).toBeCloseTo(esperado, 6)
      }
    }
  })
  it('o tipo de transformação vale: isotérmica mantém T, isobárica mantém p, isocórica mantém V', () => {
    for (const s of SEMENTES) {
      const a = gerarGas(rng(s, 1), 1).dados!
      expect(a.tipo).toBe('isotermica')
      expect(a.ini.T).toBe(a.fim.T)
      const b = gerarGas(rng(s, 2), 2).dados!
      if (b.tipo === 'isobarica') expect(b.ini.p).toBe(b.fim.p)
      else expect(b.ini.V).toBe(b.fim.V)
    }
  })
  it('as respostas são "redondas" e os erros típicos nunca coincidem com a certa', () => {
    for (const n of NIVEIS) {
      for (const s of SEMENTES) {
        const inst = gerarGas(rng(s, n), n)
        expect(Math.abs(inst.resposta * 10 - Math.round(inst.resposta * 10))).toBeLessThan(1e-6)
        expect(inst.erros.length).toBeGreaterThanOrEqual(1)
        for (const e of inst.erros) {
          expect(Number.isFinite(e.valor)).toBe(true)
          expect(Math.abs(e.valor - inst.resposta)).toBeGreaterThan(inst.tolerancia)
        }
        expect(corrigirNum(inst, String(inst.resposta).replace('.', ',')).correto).toBe(true)
      }
    }
  })
  it('níveis 2 e 3 exigem converter para kelvin: usar °C direto dá erro típico explicado', () => {
    let achou = 0
    for (const n of [2, 3] as const) {
      for (const s of SEMENTES) {
        const inst = gerarGas(rng(s, n), n)
        if (inst.erros.some((e) => e.motivo === 'usou °C na lei dos gases')) achou++
      }
    }
    expect(achou).toBeGreaterThan(100)
  })
})
