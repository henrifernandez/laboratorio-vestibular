import { useState } from 'react'
import { ArrowDown, ArrowUp, CheckCircle2, GripVertical, XCircle } from 'lucide-react'
import { ERAS, evento } from '@/conteudo/historia/linhaDoTempo'
import { NOME_REGIAO, NOME_TIPO, formatarAno, rotuloAno, type Acontecimento } from '@/conteudo/historia/tipos'
import type { EntradaProps } from '@/desafios/PainelDesafio'
import { eraDoAno, passoDoEixo, rotuloEra } from './calculo'
import { primeiraFrase } from './FichaRapida'
import type { InstanciaLigar, InstanciaOrdem } from './geradores'
import { COR_TIPO, ICONE_TIPO, fundoDaEra } from './LinhaDoTempo'

/* ------------------------------------------------------------------ card do acontecimento */

export function EventoCard({ ev, onSelecionar, onVer }: { ev: Acontecimento; onSelecionar: (id: string) => void; onVer?: (e: Acontecimento) => void }) {
  const Icone = ICONE_TIPO[ev.tipo]
  const era = eraDoAno(ev.regiao, ev.inicio)
  const lista = (titulo: string, itens: string[]) => (
    <div>
      <h4 className="mb-1 text-sm font-semibold text-[var(--ink-muted)]">{titulo}</h4>
      <ul className="m-0 grid gap-1 pl-5 text-[0.95rem]">
        {itens.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  )
  return (
    <article className="cartao grid gap-3 p-4" aria-labelledby={`ev-${ev.id}`} aria-live="polite">
      <header className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border border-[var(--line-strong)] px-2 py-0.5 font-semibold">{NOME_REGIAO[ev.regiao]}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line-strong)] px-2 py-0.5">
            <Icone size={14} aria-hidden="true" style={{ color: COR_TIPO[ev.tipo] }} />
            {NOME_TIPO[ev.tipo]}
          </span>
          {era && (
            <span className="rounded-full px-2 py-0.5" style={{ background: fundoDaEra(era.cor), border: `1px solid ${era.cor}` }}>
              {era.nome}
            </span>
          )}
        </div>
        <h3 id={`ev-${ev.id}`} className="m-0 text-xl">
          {ev.titulo} <span className="num text-[var(--ink-muted)]">({rotuloAno(ev)})</span>
        </h3>
      </header>
      <p className="m-0 max-w-[70ch]">{ev.resumo}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {lista('Causas', ev.causas)}
        {lista('Consequências', ev.consequencias)}
      </div>
      <p className="m-0 max-w-[70ch]">
        <strong>{ev.regiao === 'mundo' ? 'Ligação com o Brasil: ' : 'Ligação com o mundo: '}</strong>
        {ev.ligacao}
      </p>
      {ev.conexoes.length > 0 && (
        <div className="grid gap-1">
          <h4 className="m-0 text-sm font-semibold text-[var(--ink-muted)]">Relacionados</h4>
          <div className="flex flex-wrap gap-2">
            {ev.conexoes.map((id) => {
              const o = evento(id)
              return (
                <button key={id} type="button" className="btn text-sm" onClick={() => onSelecionar(id)}>
                  {o.titulo} <span className="num text-[var(--ink-muted)]">{rotuloAno(o)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      {onVer && (
        <div>
          <button type="button" className="btn" onClick={() => onVer(ev)}>
            Ver na linha do tempo
          </button>
        </div>
      )}
      <p className="m-0 text-xs text-[var(--ink-muted)]">
        <span className="font-semibold">Fontes: </span>
        {ev.fontes.join(' · ')}
      </p>
    </article>
  )
}

/* ------------------------------------------------------------------ lista cronológica (etapas do Entenda) */

export function FaixaCronologica({ ids }: { ids: string[] }) {
  const eventos = ids.map(evento).sort((a, b) => a.inicio - b.inicio)
  return (
    <ol className="cartao m-0 grid list-none gap-0 p-3" aria-label="Acontecimentos da etapa, em ordem cronológica">
      {eventos.map((e, i) => {
        const Icone = ICONE_TIPO[e.tipo]
        const era = eraDoAno(e.regiao, e.inicio)
        return (
          <li key={e.id} className="grid grid-cols-[4.6rem_1fr] gap-3 py-2" style={{ borderTop: i === 0 ? undefined : '1px solid var(--line)' }}>
            <div className="grid content-start justify-items-start gap-1">
              <span className="num text-sm font-bold">{rotuloAno(e)}</span>
              <span className="rounded-full border border-[var(--line-strong)] px-1.5 text-[11px]" style={era ? { background: fundoDaEra(era.cor) } : undefined}>
                {NOME_REGIAO[e.regiao]}
              </span>
            </div>
            <div className="grid gap-0.5">
              <span className="flex items-center gap-1 font-semibold">
                <Icone size={15} aria-hidden="true" style={{ color: COR_TIPO[e.tipo] }} />
                {e.titulo}
              </span>
              <span className="text-sm text-[var(--ink-muted)]">{primeiraFrase(e.resumo)}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------------------------------------------ entrada: ordenar cartões */

export function EntradaOrdenar({ inst, resposta, onChange, correcao, bloqueado }: EntradaProps<InstanciaOrdem, string[]>) {
  const [arrastando, setArrastando] = useState<number | null>(null)
  const mover = (de: number, para: number) => {
    if (para < 0 || para >= resposta.length || de === para) return
    const n = [...resposta]
    const [item] = n.splice(de, 1)
    n.splice(para, 0, item as string)
    onChange(n)
  }
  const revelar = correcao !== null
  return (
    <div className="grid gap-3">
      <p className="m-0 text-lg">{inst.enunciado}</p>
      <ol className="m-0 grid list-none gap-2 p-0" aria-label="Acontecimentos para ordenar">
        {resposta.map((id, i) => {
          const e = evento(id)
          const certo = revelar && inst.certa[i] === id
          return (
            <li
              key={id}
              draggable={!bloqueado}
              onDragStart={() => setArrastando(i)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => {
                if (arrastando !== null) mover(arrastando, i)
                setArrastando(null)
              }}
              onDragEnd={() => setArrastando(null)}
              className="flex items-center gap-2 rounded-[var(--radius-sm)] border bg-[var(--surface)] p-2"
              style={{ borderColor: revelar ? (certo ? 'var(--ok)' : 'var(--erro)') : 'var(--line-strong)', opacity: arrastando === i ? 0.5 : 1 }}
            >
              <GripVertical size={18} aria-hidden="true" className="flex-none text-[var(--ink-muted)]" />
              <span className="num grid size-7 flex-none place-items-center rounded-full bg-[var(--surface-2)] text-sm font-bold">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{e.titulo}</span>
                {revelar && <span className="num text-sm text-[var(--ink-muted)]">{rotuloAno(e)}</span>}
              </span>
              {revelar && (certo ? <CheckCircle2 size={20} aria-label="na posição certa" style={{ color: 'var(--ok)' }} /> : <XCircle size={20} aria-label="fora de lugar" style={{ color: 'var(--erro)' }} />)}
              <button type="button" className="btn size-11 flex-none justify-center p-0" disabled={bloqueado || i === 0} aria-label={`Mover «${e.titulo}» para cima`} onClick={() => mover(i, i - 1)}>
                <ArrowUp size={18} aria-hidden="true" />
              </button>
              <button type="button" className="btn size-11 flex-none justify-center p-0" disabled={bloqueado || i === resposta.length - 1} aria-label={`Mover «${e.titulo}» para baixo`} onClick={() => mover(i, i + 1)}>
                <ArrowDown size={18} aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ol>
      <p className="m-0 text-sm text-[var(--ink-muted)]">Em cima, o mais antigo; embaixo, o mais recente.</p>
    </div>
  )
}

/* ------------------------------------------------------------------ entrada: ligar itens da esquerda a opções da direita */

export function EntradaLigar({ inst, resposta, onChange, correcao, bloqueado }: EntradaProps<InstanciaLigar, Record<string, string>>) {
  const revelar = correcao !== null
  const usadas = new Map<string, number>()
  for (const v of Object.values(resposta)) if (v) usadas.set(v, (usadas.get(v) ?? 0) + 1)
  return (
    <div className="grid gap-3">
      <p className="m-0 text-lg">{inst.enunciado}</p>
      <ul className="m-0 grid list-none gap-3 p-0">
        {inst.esquerda.map((item) => {
          const certo = revelar && resposta[item.id] === inst.certa[item.id]
          const id = `lig-${item.id}`
          return (
            <li key={item.id} className="grid gap-1 rounded-[var(--radius-sm)] border bg-[var(--surface)] p-3" style={{ borderColor: revelar ? (certo ? 'var(--ok)' : 'var(--erro)') : 'var(--line-strong)' }}>
              <label htmlFor={id} className="flex items-start gap-2 font-semibold">
                <span className="flex-1">{item.rotulo}</span>
                {revelar && (certo ? <CheckCircle2 size={20} aria-label="certo" style={{ color: 'var(--ok)' }} /> : <XCircle size={20} aria-label="errado" style={{ color: 'var(--erro)' }} />)}
              </label>
              <select
                id={id}
                value={resposta[item.id] ?? ''}
                disabled={bloqueado}
                onChange={(ev) => onChange({ ...resposta, [item.id]: ev.target.value })}
                className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3"
              >
                <option value="">Escolha…</option>
                {inst.direita.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.rotulo}
                    {(usadas.get(d.id) ?? 0) > 0 && resposta[item.id] !== d.id ? ' (já usada)' : ''}
                  </option>
                ))}
              </select>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ explorar: dois períodos lado a lado */

export function LadoALado({ eventos, selecionado, onSelecionar }: { eventos: Acontecimento[]; selecionado: string | null; onSelecionar: (id: string) => void }) {
  const brasil = eventos.filter((e) => e.regiao === 'brasil').sort((a, b) => a.inicio - b.inicio)
  const mundo = eventos.filter((e) => e.regiao === 'mundo').sort((a, b) => a.inicio - b.inicio)
  const coluna = (titulo: string, lista: Acontecimento[]) => (
    <div className="grid content-start gap-2">
      <h3 className="m-0 text-base">{titulo}</h3>
      <ol className="m-0 grid list-none gap-2 p-0">
        {lista.length === 0 && <li className="text-[var(--ink-muted)]">Nenhum acontecimento neste período.</li>}
        {lista.map((e) => {
          const Icone = ICONE_TIPO[e.tipo]
          const era = eraDoAno(e.regiao, e.inicio)
          return (
            <li key={e.id}>
              <button
                type="button"
                aria-pressed={selecionado === e.id}
                onClick={() => onSelecionar(e.id)}
                className="grid min-h-11 w-full grid-cols-[4.4rem_1fr] gap-2 rounded-[var(--radius-sm)] border bg-[var(--surface)] p-2 text-left hover:bg-[var(--surface-2)]"
                style={{ borderColor: selecionado === e.id ? 'var(--accent)' : 'var(--line-strong)', borderLeft: `4px solid ${era?.cor ?? 'var(--line-strong)'}`, outline: selecionado === e.id ? '2px solid var(--accent)' : undefined }}
              >
                <span className="num text-sm font-bold">{rotuloAno(e)}</span>
                <span className="flex items-start gap-1">
                  <Icone size={14} aria-hidden="true" style={{ color: COR_TIPO[e.tipo], marginTop: 3, flex: 'none' }} />
                  {e.titulo}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {coluna('No Brasil', brasil)}
      {coluna('No mundo', mundo)}
    </div>
  )
}

/* ------------------------------------------------------------------ máquina do tempo: faixas de eras com um cursor */

export function FaixasComCursor({ ano, min = 1450, max = 2025 }: { ano: number; min?: number; max?: number }) {
  const MIN = min
  const MAX = max
  const X = (a: number) => 14 + ((a - MIN) / (MAX - MIN)) * 312
  const passo = passoDoEixo(MAX - MIN)
  const marcas: number[] = []
  for (let a = Math.ceil(MIN / passo) * passo; a <= MAX; a += passo) if (a !== 0) marcas.push(a)
  const faixa = (regiao: 'mundo' | 'brasil', y: number, titulo: string) => (
    <g>
      <text x={14} y={y - 4} fontSize={10.5} fontWeight={700} fill="var(--ink-muted)">
        {titulo}
      </text>
      {ERAS.filter((e) => e.regiao === regiao).map((e) => {
        const a = X(Math.max(e.inicio, MIN))
        const b = X(Math.min(e.fim, MAX))
        const ativa = eraDoAno(regiao, ano)?.id === e.id
        return (
          <g key={e.id}>
            <rect x={a} y={y} width={Math.max(0, b - a - 1)} height={20} fill={e.cor} fillOpacity={ativa ? 0.85 : 0.25} stroke={e.cor} strokeWidth={ativa ? 2 : 1} />
          </g>
        )
      })}
    </g>
  )
  const ativaM = eraDoAno('mundo', ano)
  const ativaB = eraDoAno('brasil', ano)
  return (
    <svg viewBox="0 0 340 112" role="img" aria-label={`Ano ${formatarAno(ano)}${ano < 0 ? '' : '.'} Mundo: ${ativaM?.nome ?? 'antes da escrita'}. Brasil: ${ativaB?.nome ?? 'antes das eras mostradas'}.`} className="mx-auto block w-full max-w-xl">
      {faixa('mundo', 22, 'Mundo')}
      {faixa('brasil', 66, 'Brasil')}
      <line x1={X(ano)} x2={X(ano)} y1={10} y2={92} stroke="var(--ink)" strokeWidth={2} />
      <polygon points={`${X(ano) - 5},8 ${X(ano) + 5},8 ${X(ano)},15`} fill="var(--ink)" />
      {marcas.map((a) => (
        <text key={a} x={X(a)} y={106} textAnchor="middle" fontSize={10} fill="var(--ink-muted)" className="num">
          {formatarAno(a)}
        </text>
      ))}
    </svg>
  )
}


/* ------------------------------------------------------------------ como ler a linha do tempo */

export function LegendaLinha() {
  const tipos = (Object.keys(NOME_TIPO) as (keyof typeof NOME_TIPO)[]).map((t) => ({ t, Icone: ICONE_TIPO[t] }))
  return (
    <details open className="cartao p-3">
      <summary className="cursor-pointer font-semibold">Como ler esta linha do tempo</summary>
      <ul className="m-0 mt-2 grid gap-1.5 pl-5">
        <li>
          <strong>Mundo em cima, Brasil embaixo.</strong> No meio fica o eixo com os anos.
        </li>
        <li>
          <strong>Faixas coloridas</strong> são as eras (períodos históricos). Clique numa faixa, ou num botão de período abaixo, para ampliar aquele período.
        </li>
        <li>
          <strong>Ponto + haste:</strong> o ponto marca o ano em que o acontecimento <em>começou</em> e a haste o liga ao cartão com o ano e o nome. A borda esquerda do cartão tem a cor da era.
        </li>
        <li>
          <strong>Clique num acontecimento</strong> para abrir a ficha rápida: o que foi, o gatilho, os marcos e as pessoas. Causas, consequências e relações ficam no card completo, embaixo.
        </li>
        <li>
          <strong>Acontecimentos que duram anos:</strong> o cartão mostra o intervalo (por exemplo, 1789–1799), e uma barra grossa ao lado da faixa mostra a duração. “c.” quer dizer “por volta de”; “a.C.”, antes de Cristo.
        </li>
        <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <strong>Ícones, o tipo de acontecimento:</strong>
          {tipos.map(({ t, Icone }) => (
            <span key={t} className="inline-flex items-center gap-1">
              <Icone size={15} aria-hidden="true" style={{ color: COR_TIPO[t] }} />
              {NOME_TIPO[t]}
            </span>
          ))}
        </li>
        <li>
          <strong>Andar e aproximar:</strong> arraste a linha ou role a roda do mouse para andar no tempo; Ctrl + roda, pinça com dois dedos ou os botões aproximam e afastam. O resumo, logo abaixo da linha, mostra onde você está, da Antiguidade até hoje.
        </li>
        <li>Cartões que não cabem na tela aparecem quando você aproxima: os mais importantes aparecem primeiro.</li>
      </ul>
    </details>
  )
}

/** Botões para ir direto a um período do Brasil ou do mundo. */
export function PeriodosRapidos({ onEscolher }: { onEscolher: (inicio: number, fim: number) => void }) {
  const grupo = (titulo: string, regiao: 'brasil' | 'mundo') => (
    <div className="grid gap-1">
      <h3 className="m-0 text-sm font-semibold text-[var(--ink-muted)]">{titulo}</h3>
      <div className="flex flex-wrap gap-2">
        {ERAS.filter((e) => e.regiao === regiao).map((e) => (
          <button key={e.id} type="button" className="btn text-sm" style={{ borderLeft: `6px solid ${e.cor}`, background: fundoDaEra(e.cor) }} onClick={() => onEscolher(e.inicio, e.fim)} title={e.resumo}>
            {e.nome} <span className="num text-[var(--ink-muted)]">{rotuloEra(e)}</span>
          </button>
        ))}
      </div>
    </div>
  )
  return (
    <div className="grid gap-3">
      {grupo('Períodos do mundo', 'mundo')}
      {grupo('Períodos do Brasil', 'brasil')}
    </div>
  )
}
