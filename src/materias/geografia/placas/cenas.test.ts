import { larguraTexto } from '@/lib/rotulos'
import { ALTURA, LARGURA, NIVEL_MAR, cenaDoLimite, type Cena, type IdCena, type Ponto } from './cenas'

const IDS: IdCena[] = ['dorsal', 'rifte', 'subducao-continental', 'subducao-oceanica', 'colisao', 'transformante']
const PROGRESSOS = [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1]

const dentro = ([x, y]: Ponto, folga = 1) => x >= -folga && x <= LARGURA + folga && y >= -folga && y <= ALTURA + folga
const forma = (c: Cena, id: string) => c.formas.find((f) => f.id === id)?.pontos ?? []

/** Interseções de uma reta vertical com as arestas do polígono: [y mínimo, y máximo] (onde a forma começa e termina naquele x). */
function corteVertical(poly: Ponto[], x: number): [number, number] {
  const ys: number[] = []
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i] as Ponto
    const [xj, yj] = poly[j] as Ponto
    if ((xi <= x && xj > x) || (xj <= x && xi > x)) ys.push(yi + ((yj - yi) * (x - xi)) / (xj - xi))
  }
  return [Math.min(...ys), Math.max(...ys)]
}
const espessuraEm = (poly: Ponto[], x: number) => {
  const [a, b] = corteVertical(poly, x)
  return b - a
}

/** Ponto dentro de polígono (raio par-ímpar). */
function noPoligono([x, y]: Ponto, poly: Ponto[]): boolean {
  let d = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i] as Ponto
    const [xj, yj] = poly[j] as Ponto
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d
  }
  return d
}

describe('Cortes geológicos: tudo cabe no quadro', () => {
  it('formas, sismos, gotas, câmaras, condutos, fluxo e alvos dos rótulos ficam dentro do desenho', () => {
    for (const id of IDS)
      for (const p of PROGRESSOS)
        for (const inv of [false, true]) {
          const c = cenaDoLimite(id, p, inv)
          const tag = `${id} p=${p}${inv ? ' espelhado' : ''}`
          for (const f of c.formas) {
            expect(f.pontos.length, `${tag} ${f.id} vazio`).toBeGreaterThanOrEqual(3)
            for (const q of f.pontos) expect(dentro(q), `${tag} ${f.id} (${q})`).toBe(true)
          }
          for (const q of [...c.sismos, ...c.gotas, ...c.condutos.flat(), ...c.fluxo.flat(), ...c.linhas.flatMap((l) => l.pontos)]) expect(dentro(q, 2), `${tag} (${q})`).toBe(true)
          for (const m of c.camaras) expect(dentro([m.x, m.y]), tag).toBe(true)
          for (const r of c.rotulos) {
            if (r.alvo) expect(dentro(r.alvo), `${tag} alvo de “${r.texto}”`).toBe(true)
            // o texto inteiro (largura aproximada, fonte 14) cabe na largura do desenho
            const w = larguraTexto(r.texto, 14, true)
            const x0 = r.ancora === 'end' ? r.x - w : r.ancora === 'middle' ? r.x - w / 2 : r.x
            expect(x0, `${tag} “${r.texto}” sai pela esquerda`).toBeGreaterThanOrEqual(0)
            expect(x0 + w, `${tag} “${r.texto}” sai pela direita`).toBeLessThanOrEqual(LARGURA)
          }
        }
  })
  it('no celular (fonte ~23 unidades), os rótulos essenciais ainda cabem na largura do desenho', () => {
    for (const id of IDS)
      for (const p of PROGRESSOS)
        for (const inv of [false, true])
          for (const r of cenaDoLimite(id, p, inv).rotulos.filter((r) => r.prioridade !== 2)) {
            const w = larguraTexto(r.texto, 23, true)
            const x0 = r.ancora === 'end' ? r.x - w : r.ancora === 'middle' ? r.x - w / 2 : r.x
            expect(x0, `${id} p=${p} “${r.texto}”`).toBeGreaterThanOrEqual(0)
            expect(x0 + w, `${id} p=${p} “${r.texto}”`).toBeLessThanOrEqual(LARGURA)
          }
  })
  it('os rótulos essenciais (prioridade 1) não se sobrepõem entre si', () => {
    for (const id of IDS)
      for (const p of PROGRESSOS) {
        const caixas = cenaDoLimite(id, p)
          .rotulos.filter((r) => r.prioridade !== 2)
          .map((r) => {
            // em tela estreita a fonte chega a ~21 unidades do desenho
            const f = 21
            const w = larguraTexto(r.texto, f, true)
            const x0 = r.ancora === 'end' ? r.x - w : r.ancora === 'middle' ? r.x - w / 2 : r.x
            return { t: r.texto, x0, x1: x0 + w, y0: r.y - f * 0.8, y1: r.y + 2 }
          })
        for (let i = 0; i < caixas.length; i++)
          for (let j = i + 1; j < caixas.length; j++) {
            const a = caixas[i]!
            const b = caixas[j]!
            const sep = a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0
            expect(sep, `${id} p=${p}: “${a.t}” × “${b.t}”`).toBe(true)
          }
      }
  })
})

describe('Cortes geológicos: todos os rótulos, a partir de 420 px de largura', () => {
  it('nenhum rótulo se sobrepõe a outro com a fonte de uma tela de 420 px (~17 unidades)', () => {
    for (const id of IDS)
      for (const p of PROGRESSOS)
        for (const inv of [false, true]) {
          const caixas = cenaDoLimite(id, p, inv).rotulos.map((r) => {
            const f = 17
            const w = larguraTexto(r.texto, f, true)
            const x0 = r.ancora === 'end' ? r.x - w : r.ancora === 'middle' ? r.x - w / 2 : r.x
            return { t: r.texto, x0, x1: x0 + w, y0: r.y - f * 0.8, y1: r.y + 2 }
          })
          for (let i = 0; i < caixas.length; i++)
            for (let j = i + 1; j < caixas.length; j++) {
              const a = caixas[i]!
              const b = caixas[j]!
              const sep = a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0
              expect(sep, `${id} p=${p}${inv ? ' espelhado' : ''}: “${a.t}” × “${b.t}”`).toBe(true)
            }
        }
  })
})

describe('Subducção', () => {
  it('a placa que desce mergulha cada vez mais (a inclinação nunca diminui) e fica mais funda com o progresso', () => {
    const c = cenaDoLimite('subducao-continental', 1)
    const laje = forma(c, 'placa-slab')
    // o topo da placa: primeira metade dos pontos (antes da volta pela base)
    const topo = laje.slice(0, laje.findIndex((q, i) => i > 0 && q[0] < (laje[i - 1] as Ponto)[0]))
    let incl = -Infinity
    for (let i = 2; i < topo.length; i++) {
      const [x0, y0] = topo[i - 2] as Ponto
      const [x1, y1] = topo[i] as Ponto
      const a = Math.atan2(y1 - y0, x1 - x0)
      expect(a, `ponto ${i}`).toBeGreaterThanOrEqual(incl - 0.05)
      incl = Math.max(incl, a)
    }
    expect(incl).toBeGreaterThan((40 * Math.PI) / 180)
  })
  it('há fossa: o fundo do mar desce até a frente da placa de cima', () => {
    for (const id of ['subducao-continental', 'subducao-oceanica'] as const) {
      const mar = forma(cenaDoLimite(id, 0.7), 'mar')
      const maisFundo = Math.max(...mar.map((q) => q[1]))
      expect(maisFundo, id).toBeGreaterThan(NIVEL_MAR + 26 + 10) // abaixo da planície abissal
    }
  })
  it('vulcão só depois que a placa chega à profundidade de fusão; o magma sai de cima da placa e sobe até o vulcão', () => {
    expect(cenaDoLimite('subducao-continental', 0).vulcoes).toHaveLength(0)
    for (const id of ['subducao-continental', 'subducao-oceanica'] as const) {
      const c = cenaDoLimite(id, 0.8)
      expect(c.vulcoes, id).toHaveLength(1)
      const v = c.vulcoes[0]!
      const fusao = forma(c, 'fusao')
      const cx = fusao.reduce((s, q) => s + q[0], 0) / fusao.length
      // o vulcão fica sobre a zona de fusão (não na fossa)
      expect(Math.abs(v.x + v.w / 2 - cx), id).toBeLessThan(40)
      // as gotas sobem: de baixo (fusão) para cima (vulcão)
      const ys = c.gotas.map((g) => g[1])
      expect(Math.max(...ys)).toBeGreaterThan(Math.min(...ys) + 25)
      // a câmara magmática fica abaixo da boca do vulcão e acima da fusão
      const cam = c.camaras[0]!
      expect(cam.y).toBeGreaterThan(v.base - v.h)
      expect(cam.y).toBeLessThan(Math.min(...fusao.map((q) => q[1])))
    }
  })
  it('os terremotos ficam cada vez mais fundos ao longo da placa (zona de Wadati-Benioff), dentro da faixa marcada', () => {
    const c = cenaDoLimite('subducao-continental', 1)
    const ys = c.sismos.map((s) => s[1])
    for (let i = 1; i < ys.length; i++) expect(ys[i]!).toBeGreaterThan(ys[i - 1]!)
    expect(ys[ys.length - 1]! - ys[0]!).toBeGreaterThan(100)
    for (const s of c.sismos) expect(noPoligono(s, c.zonaSismica as Ponto[]), `${s}`).toBe(true)
  })
  it('espelhada, a placa oceânica entra pela direita', () => {
    const c = cenaDoLimite('subducao-continental', 0.6, true)
    const laje = forma(c, 'placa-slab')
    const xm = laje.reduce((s, q) => s + q[0], 0) / laje.length
    expect(xm).toBeGreaterThan(LARGURA / 2)
    expect(c.rotulos.find((r) => r.texto === 'fossa')?.ancora).toBe('start')
  })
})

describe('Dorsal, rifte e colisão', () => {
  it('dorsal: a litosfera é fina na dorsal e engrossa com a distância (com a idade)', () => {
    const lito = forma(cenaDoLimite('dorsal', 0.6), 'lito-b')
    const e = (x: number) => espessuraEm(lito, x)
    expect(e(325)).toBeLessThan(e(600) / 4)
    expect(e(600)).toBeGreaterThan(55)
    expect(e(470)).toBeGreaterThan(e(360))
  })
  it('rifte: sob o vale, a crosta é mais fina; o fundo do vale fica abaixo dos ombros; a câmara fica dentro da crosta', () => {
    for (const p of [0.3, 0.6, 0.9]) {
      const c = cenaDoLimite('rifte', p)
      const crosta = forma(c, 'crosta-continental')
      expect(espessuraEm(crosta, 320), `p=${p}`).toBeLessThan(espessuraEm(crosta, 40) - 10)
      const cam = c.camaras[0]!
      expect(noPoligono([cam.x, cam.y], crosta), `p=${p}`).toBe(true)
    }
  })
  it('colisão: as camadas de rocha ficam dentro da crosta e a raiz cresce com a montanha', () => {
    for (const p of [0.2, 0.6, 1]) {
      const c = cenaDoLimite('colisao', p)
      const crosta = (x: number) => corteVertical(forma(c, x < 320 ? 'placa-a' : 'placa-b'), x)
      for (const l of c.linhas.filter((l) => l.tipo === 'dobra'))
        for (const [x, y] of l.pontos.filter((q, i) => i % 10 === 0 && q[0] > 2 && q[0] < 638 && Math.abs(q[0] - 320) > 2)) {
          const [yMin, yMax] = crosta(x)
          expect(y, `p=${p} x=${x}`).toBeGreaterThan(yMin - 3)
          expect(y, `p=${p} x=${x}`).toBeLessThan(yMax + 3)
        }
    }
    const raiz = (p: number) => Math.max(...forma(cenaDoLimite('colisao', p), 'montanha').map((q) => q[1]))
    expect(raiz(1)).toBeGreaterThan(raiz(0.3))
  })
})
