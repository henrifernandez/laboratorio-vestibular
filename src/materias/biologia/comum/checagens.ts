import { corrigirMulti, corrigirNum, type InstanciaMulti, type InstanciaNum } from '@/desafios/simples'
import { criarRng } from '@/lib/rng'

/* Conferências compartilhadas pelos testes dos geradores de Biologia. */

export const NIVEIS = [1, 2, 3] as const
export const SEMENTES = Array.from({ length: 150 }, (_, i) => i + 1)
export const rngTeste = (s: number, n: number) => criarRng(s * 7919 + n * 31)
export const arred = (x: number) => String(Math.round(x * 1e6) / 1e6).replace('.', ',')
export const textoCerto = (inst: InstanciaMulti) => (inst.opcoes.find((o) => o.id === inst.certa) as { rotulo: string }).rotulo

/** Estrutura de uma pergunta de múltipla escolha: alternativas diferentes, explicação e motivo para cada erro, dicas e lição. */
export function checarMulti(inst: InstanciaMulti, rotulo: string) {
  const ids = inst.opcoes.map((o) => o.id)
  expect(new Set(ids).size, rotulo).toBe(ids.length)
  expect(new Set(inst.opcoes.map((o) => o.rotulo)).size, `${rotulo}: alternativas repetidas`).toBe(ids.length)
  expect(ids.length, rotulo).toBeGreaterThanOrEqual(4)
  expect(ids).toContain(inst.certa)
  for (const id of ids) expect((inst.porque[id] ?? '').length, `${rotulo}: falta explicação da ${id}`).toBeGreaterThan(10)
  for (const id of ids.filter((x) => x !== inst.certa)) expect((inst.motivo?.[id] ?? '').length, `${rotulo}: falta motivo da ${id}`).toBeGreaterThan(3)
  expect(inst.dicas.length).toBeGreaterThanOrEqual(3)
  expect(inst.licao.length).toBeGreaterThan(10)
  expect(inst.resolucao.length).toBeGreaterThan(10)
  expect(corrigirMulti(inst, inst.certa).correto).toBe(true)
  for (const id of ids.filter((x) => x !== inst.certa)) {
    const c = corrigirMulti(inst, id)
    expect(c.correto).toBe(false)
    expect(c.feedback.length).toBeGreaterThan(10)
  }
}

/** Resposta numérica: pelo menos dois erros típicos válidos, nenhum aceito como certo, e a resposta certa aceita. */
export function checarNum(inst: InstanciaNum, rotulo: string, minErros = 2) {
  expect(Number.isFinite(inst.resposta), rotulo).toBe(true)
  expect(inst.resposta, rotulo).toBeGreaterThan(0)
  expect(inst.erros.length, `${rotulo}: erros típicos`).toBeGreaterThanOrEqual(minErros)
  for (const e of inst.erros) {
    expect(Math.abs(e.valor - inst.resposta), `${rotulo}: erro igual à resposta`).toBeGreaterThan(inst.tolerancia)
    expect(corrigirNum(inst, arred(e.valor)).correto, `${rotulo}: erro aceito`).toBe(false)
    expect(e.frase.length).toBeGreaterThan(10)
  }
  expect(corrigirNum(inst, arred(inst.resposta)).correto, rotulo).toBe(true)
  expect(inst.dicas.length).toBeGreaterThanOrEqual(3)
  expect(inst.licao.length).toBeGreaterThan(10)
}
