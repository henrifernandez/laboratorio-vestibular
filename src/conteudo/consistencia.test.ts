import { MATERIAS } from './materias'
import { MODULOS, carregarTema } from '@/materias/registro'

const publicados = MATERIAS.flatMap((m) => m.temas.filter((t) => t.disponivel).map((t) => ({ materia: m.id, tema: t })))

describe('Consistência entre o catálogo e os módulos dos temas', () => {
  it('todo tema marcado como disponível está registrado, e vice-versa', () => {
    const registrados = new Set(Object.keys(MODULOS))
    const marcados = new Set(publicados.map((p) => `${p.materia}/${p.tema.id}`))
    expect([...marcados].filter((k) => !registrados.has(k))).toEqual([])
    expect([...registrados].filter((k) => !marcados.has(k))).toEqual([])
  })

  it.each(publicados.map((p) => [`${p.materia}/${p.tema.id}`, p] as const))('%s: totalNiveis = nº de desafios × 3 e os ids dos desafios seguem o tema', async (chave, p) => {
    const modulo = (await carregarTema(p.materia, p.tema.id)).default
    expect(modulo.desafios.length, chave).toBeGreaterThanOrEqual(3)
    expect(p.tema.totalNiveis, `${chave}: totalNiveis`).toBe(modulo.desafios.length * 3)
    for (const d of modulo.desafios) {
      expect(d.desafio.id.startsWith(`${p.materia}/${p.tema.id}/`), `${chave}: id ${d.desafio.id}`).toBe(true)
      expect(d.desafio.materia).toBe(p.materia)
      expect(d.desafio.tema).toBe(p.tema.id)
    }
    expect(new Set(modulo.desafios.map((d) => d.desafio.id)).size, `${chave}: ids repetidos`).toBe(modulo.desafios.length)
  }, 30_000)
})
