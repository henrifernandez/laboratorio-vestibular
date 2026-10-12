import { useMemo } from 'react'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { Alternador, Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { useAnimacao } from '@/sim/useAnimacao'
import {
  ENZIMAS,
  bandasMeselson,
  classificarMutacao,
  compativelComObservacao,
  copiasAposCiclos,
  copiasDoFragmentoExato,
  fragmentos,
  inserir,
  moleculasComN15,
  moleculasNaGeracao,
  remover,
  substituir,
  transcreverDaCodificadora,
  transcricaoLac,
  traduzir,
  type ModeloReplicacao,
  type MutacaoLac,
  type TipoMutacao,
} from './calculo'
import { DEFINICOES_MOLECULAR } from './definicoes'
import { porqueLac } from './geradores'
import { GelSvg, GradeMeselson, LacSvg, MapaRestricaoSvg, NOME_MODELO, Peptideo, PerfilTermicoSvg, SequenciaAlinhada } from './Visuais'

const fmt = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ Introdução: do DNA à proteína, com mutações */

const SEQ_HB = 'ATGGTGCACCTGACTCCTGAGGAGTAA'
const PADRAO_DOGMA = { seq: SEQ_HB, mut: 'nenhuma', pos: 20, base: 'T' }
const EXEMPLOS = [
  { id: 'hb', rotulo: 'Início do gene da β-globina (simplificado)', seq: SEQ_HB },
  { id: 'curto', rotulo: 'Exemplo curto', seq: 'ATGGCTTTCGGATAA' },
  { id: 'lider', rotulo: 'Com bases antes do ATG', seq: 'GGATGCCTAAATAG' },
]
const limparSeq = (t: string) => t.toUpperCase().replace(/[^ACGT]/g, '').slice(0, 60)

const TEXTO_MUTACAO: Record<TipoMutacao, string> = {
  nenhuma: 'Sem diferença na sequência.',
  silenciosa: 'Mutação silenciosa: o novo códon codifica o mesmo aminoácido (o código é degenerado), então a proteína não muda.',
  troca: 'Mutação de troca de sentido (missense): um aminoácido foi trocado por outro; a proteína tem o mesmo tamanho.',
  semSentido: 'Mutação sem sentido (nonsense): surgiu um códon de parada, e a proteína ficou truncada.',
  quadro: 'Mudança no quadro de leitura (frameshift): a inserção ou perda de bases (não múltiplas de 3) altera todos os aminoácidos seguintes.',
  insercaoNoQuadro: 'Inserção de 3 bases: o quadro de leitura se mantém, e a proteína ganha um aminoácido (os demais não mudam).',
  delecaoNoQuadro: 'Perda de 3 bases: o quadro de leitura se mantém, e a proteína perde um aminoácido (os demais não mudam).',
}

function TelaDogma() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_DOGMA)
  const seq = limparSeq(e.seq)
  const n = seq.length
  const pos = Math.min(Math.max(1, Math.round(e.pos)), Math.max(1, n))
  const i = pos - 1
  const base = ['A', 'C', 'G', 'T'].includes(e.base) ? e.base : 'T'
  const mut = ['nenhuma', 'subst', 'ins1', 'del1', 'ins3', 'del3'].includes(e.mut) ? e.mut : 'nenhuma'
  const mutada = useMemo(() => {
    switch (mut) {
      case 'subst':
        return substituir(seq, i, base)
      case 'ins1':
        return inserir(seq, i, base)
      case 'del1':
        return remover(seq, i, 1)
      case 'ins3':
        return inserir(seq, i, base.repeat(3))
      case 'del3':
        return remover(seq, i, 3)
      default:
        return seq
    }
  }, [seq, mut, i, base])
  const mrna = transcreverDaCodificadora(seq)
  const mrnaM = transcreverDaCodificadora(mutada)
  const orig = traduzir(mrna)
  const mutante = traduzir(mrnaM)
  const tipo = classificarMutacao(mrna, mrnaM)
  const mudou = mutada !== seq
  const inicioMudou = mudou && orig.inicio !== mutante.inicio
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-3 p-3">
          <h3 className="m-0 text-base">Do DNA à proteína</h3>
          {n < 6 ? <p className="m-0 text-[var(--ink-muted)]">Digite pelo menos 6 bases (A, C, G ou T).</p> : <SequenciaAlinhada codificadora={seq} />}
          {orig.inicio < 0 && n >= 6 ? <p className="m-0 text-[var(--erro)]">Não há ATG na fita codificadora: sem AUG no mRNA, a tradução não começa.</p> : <Peptideo rotulo={`Peptídeo (${orig.peptideo.length} aminoácido${orig.peptideo.length === 1 ? '' : 's'})`} aminoacidos={orig.peptideo} />}
        </div>
        {mut !== 'nenhuma' && n >= 6 && (
          <div className="cartao grid gap-3 p-3">
            <h3 className="m-0 text-base">Depois da mutação</h3>
            {mudou ? <SequenciaAlinhada codificadora={mutada} destaque={mut === 'del1' || mut === 'del3' ? [] : mut === 'ins3' ? [i, i + 1, i + 2] : [i]} mostrarMolde={false} /> : <p className="m-0">A base escolhida é igual à original: a sequência não mudou.</p>}
            <Peptideo rotulo={`Peptídeo mutante (${mutante.peptideo.length} aminoácido${mutante.peptideo.length === 1 ? '' : 's'})`} aminoacidos={mutante.peptideo} referencia={orig.peptideo} />
          </div>
        )}
        <Cartao vivo>
          {mut === 'nenhuma' ? (
            <p className="m-0">Escolha uma mutação ao lado para ver o efeito sobre o peptídeo.</p>
          ) : (
            <>
              <p className="m-0 text-lg">
                <strong>{mudou ? TEXTO_MUTACAO[tipo] : TEXTO_MUTACAO.nenhuma}</strong>
              </p>
              {inicioMudou && <p className="m-0 text-sm text-[var(--ink-muted)]">A mutação alterou o primeiro AUG: a tradução passa a começar em outro ponto (ou não começa).</p>}
              {mudou && <p className="m-0 text-sm text-[var(--ink-muted)]">Peptídeo original: {orig.peptideo.length} aminoácidos · mutante: {mutante.peptideo.length}.</p>}
            </>
          )}
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Exemplo" valor={EXEMPLOS.find((x) => x.seq === seq)?.id ?? 'livre'} opcoes={[...EXEMPLOS.map((x) => ({ id: x.id, rotulo: x.rotulo })), { id: 'livre', rotulo: 'Sequência digitada' }]} onChange={(id) => atualizar({ seq: EXEMPLOS.find((x) => x.id === id)?.seq ?? seq, mut: 'nenhuma', pos: 1 })} />
        <div className="grid gap-1">
          <label htmlFor="seq-dna" className="font-semibold">
            Fita codificadora (5′→3′)
          </label>
          <input id="seq-dna" value={seq} onChange={(ev) => atualizar({ seq: limparSeq(ev.target.value) })} spellCheck={false} autoComplete="off" className="num h-12 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 font-mono text-base tracking-wider" aria-describedby="ajuda-seq" />
          <span id="ajuda-seq" className="text-sm text-[var(--ink-muted)]">
            Só A, C, G e T (até 60 bases). A fita molde e o mRNA são calculados.
          </span>
        </div>
        <Alternador
          rotulo="Mutação"
          valor={mut}
          opcoes={[
            { id: 'nenhuma', rotulo: 'Nenhuma' },
            { id: 'subst', rotulo: 'Substituição' },
            { id: 'ins1', rotulo: 'Inserir 1 base' },
            { id: 'del1', rotulo: 'Perder 1 base' },
            { id: 'ins3', rotulo: 'Inserir 3 bases' },
            { id: 'del3', rotulo: 'Perder 3 bases' },
          ]}
          onChange={(id) => atualizar({ mut: id })}
        />
        {mut !== 'nenhuma' && n >= 6 && (
          <>
            <ControleDeslizante rotulo="Posição na fita codificadora" valor={pos} onChange={(v) => atualizar({ pos: v })} min={1} max={n} passo={1} marcas={[1, Math.round(n / 2), n]} />
            {(mut === 'subst' || mut === 'ins1' || mut === 'ins3') && <Seletor rotulo={mut === 'subst' ? 'Nova base' : 'Base inserida'} valor={base} opcoes={['A', 'C', 'G', 'T'].map((b) => ({ id: b, rotulo: b }))} onChange={(b) => atualizar({ base: b })} />}
          </>
        )}
        <p className="m-0 text-sm text-[var(--ink-muted)]">Experimente trocar o 20º nucleotídeo da β-globina (A→T): GAG vira GTG e o ácido glutâmico é trocado por valina, como na anemia falciforme.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: PCR, restrição e eletroforese, óperon lac */

const PADRAO_PCR = { ini: 1, n: 10, tp: 0 }

function GraficoCopias({ ini, n, t }: { ini: number; n: number; t: number }) {
  const W = 340
  const H = 170
  const completos = Math.min(n, Math.floor(t + 1e-9))
  const X = (c: number) => 48 + (c / n) * 270
  const alto = Math.log2(ini) + n
  const Y = (log2: number) => 140 - ((log2 - Math.log2(ini)) / (alto - Math.log2(ini))) * 116
  const pts = Array.from({ length: completos + 1 }, (_, c) => `${X(c)},${Y(Math.log2(ini) + c)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Número de moléculas depois de cada ciclo, em escala logarítmica: dobra a cada ciclo; depois de ${completos} ciclos, ${fmt(copiasAposCiclos(ini, completos), 0)} moléculas`} className="mx-auto block w-full max-w-lg">
      <line x1={48} x2={48} y1={14} y2={140} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={48} x2={324} y1={140} y2={140} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={48} x2={X(n)} y1={Y(Math.log2(ini))} y2={Y(Math.log2(ini) + n)} stroke="var(--line-strong)" strokeDasharray="4 4" />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={3.2} strokeLinejoin="round" />
      <circle cx={X(completos)} cy={Y(Math.log2(ini) + completos)} r={5} fill="var(--ink)" stroke="var(--surface)" strokeWidth={1.5} />
      <text x={324} y={158} textAnchor="end" fontSize={10.5} fill="var(--ink-muted)">
        ciclos
      </text>
      <text x={4} y={12} fontSize={10.5} fill="var(--ink-muted)">
        moléculas (escala log₂)
      </text>
      <text x={X(0)} y={154} textAnchor="middle" fontSize={10} fill="var(--ink-muted)" className="num">
        0
      </text>
      <text x={X(n)} y={154} textAnchor="middle" fontSize={10} fill="var(--ink-muted)" className="num">
        {n}
      </text>
    </svg>
  )
}

function ExplorarPcr() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_PCR)
  const anim = useAnimacao(e.tp, e.n, (v) => atualizar({ tp: v }), 1.2)
  const t = Math.min(e.n, Math.max(0, e.tp))
  const completos = Math.min(e.n, Math.floor(t + 1e-9))
  const frac = t - Math.floor(t)
  const terminou = t >= e.n
  const fase = terminou ? 'Reação concluída.' : frac < 0.34 ? 'Desnaturação (cerca de 95 °C): as duas fitas se separam.' : frac < 0.66 ? 'Anelamento (cerca de 55 °C): os primers se ligam às extremidades do trecho-alvo.' : 'Extensão (cerca de 72 °C): a DNA polimerase sintetiza as novas fitas a partir dos primers.'
  const copias = copiasAposCiclos(e.ini, completos)
  const exatas = e.ini * copiasDoFragmentoExato(completos)
  const ciclosPerfil = Math.min(e.n, 4)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <PerfilTermicoSvg ciclos={ciclosPerfil} atual={t < ciclosPerfil ? t : undefined} />
          <p className="m-0 text-sm text-[var(--ink-muted)]">Perfil de temperatura dos primeiros {ciclosPerfil} ciclos. A linha vermelha mostra o instante atual.</p>
        </div>
        <Cartao vivo>
          <p className="m-0 text-lg">
            Ciclo <strong>{terminou ? e.n : completos + 1}</strong> de {e.n}: {fase}
          </p>
          <p className="m-0">
            Moléculas depois de {completos} ciclo{completos === 1 ? '' : 's'} completo{completos === 1 ? '' : 's'}: <strong>{fmt(copias, 0)}</strong> ({fmt(e.ini, 0)} × 2^{completos}).
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            Detalhe: as moléculas com exatamente o tamanho do trecho entre os primers aparecem só a partir do 3º ciclo: ao todo, {fmt(exatas, 0)} (2ⁿ − 2n para cada molécula inicial). Como o número cresce muito depressa, em poucos ciclos elas dominam a mistura.
          </p>
        </Cartao>
        <div className="cartao grid gap-1 p-3">
          <GraficoCopias ini={e.ini} n={e.n} t={t} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Em escala logarítmica, o crescimento exponencial (duplicação a cada ciclo) vira uma reta.</p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(0.34)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        <ControleDeslizante rotulo="Instante" valor={t} onChange={(v) => atualizar({ tp: v })} min={0} max={e.n} passo={0.1} unidade="ciclos" marcas={[0, Math.round(e.n / 2), e.n]} />
        <ControleDeslizante rotulo="Número de ciclos" valor={e.n} onChange={(v) => atualizar({ n: v, tp: 0 })} min={2} max={35} passo={1} marcas={[2, 20, 35]} />
        <ControleDeslizante rotulo="Moléculas iniciais" valor={e.ini} onChange={(v) => atualizar({ ini: v })} min={1} max={1000} passo={1} marcas={[1, 500, 1000]} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Eficiência de 100 %: cada ciclo duplica o número de moléculas. Na prática a eficiência é menor e a reação satura quando os reagentes se esgotam.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

interface Amostra {
  id: string
  nome: string
  tamanho: number
  circular: boolean
  sitios: Record<string, number[]>
}

/** Mapas ilustrativos (posições em kb), inventados para o exercício. */
const AMOSTRAS: Amostra[] = [
  { id: 'pA', nome: 'Plasmídeo A (circular, 6 kb)', tamanho: 6, circular: true, sitios: { EcoRI: [1, 3.5], BamHI: [2], HindIII: [] } },
  { id: 'pB', nome: 'Fragmento B (linear, 8 kb)', tamanho: 8, circular: false, sitios: { EcoRI: [2], BamHI: [3, 6], HindIII: [5] } },
  { id: 'pC', nome: 'Plasmídeo C (circular, 4 kb)', tamanho: 4, circular: true, sitios: { EcoRI: [0.5], BamHI: [], HindIII: [2.5, 3.5] } },
]
const ENZ_GEL = ['EcoRI', 'BamHI', 'HindIII']
const PADRAO_GEL = { am: 'pA', eco: true, bam: false, hind: false }

function ExplorarGel() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_GEL)
  const amostra = AMOSTRAS.find((a) => a.id === e.am) ?? (AMOSTRAS[0] as Amostra)
  const marcadas: Record<string, boolean> = { EcoRI: e.eco, BamHI: e.bam, HindIII: e.hind }
  const usadas = ENZ_GEL.filter((x) => marcadas[x])
  const todos = usadas.flatMap((x) => amostra.sitios[x] ?? []).sort((a, b) => a - b)
  const faixas = [
    { rotulo: 'Intacto', tamanhos: [amostra.tamanho] },
    ...usadas.map((x) => ({ rotulo: x, tamanhos: fragmentos(amostra.tamanho, amostra.sitios[x] ?? [], amostra.circular) })),
    ...(usadas.length > 1 ? [{ rotulo: 'Dupla', tamanhos: fragmentos(amostra.tamanho, todos, amostra.circular) }] : []),
  ]
  const final = fragmentos(amostra.tamanho, todos, amostra.circular)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-3 p-3">
          <GelSvg faixas={faixas} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">O DNA tem carga negativa e migra para o polo positivo (embaixo); quanto menor o fragmento, mais longe ele chega. O marcador tem fragmentos de tamanho conhecido.</p>
        </div>
        <div className="cartao grid gap-2 p-3">
          <MapaRestricaoSvg tamanho={amostra.tamanho} cortes={todos} circular={amostra.circular} enzima={usadas.length ? usadas.join(' + ') : 'nenhuma enzima'} />
        </div>
        <Cartao vivo>
          {usadas.length === 0 ? (
            <p className="m-0">Sem enzima, a molécula fica inteira: uma banda de {fmt(amostra.tamanho, 1)} kb.</p>
          ) : (
            <>
              <p className="m-0 text-lg">
                {todos.length} corte{todos.length === 1 ? '' : 's'} em molécula {amostra.circular ? 'circular' : 'linear'} → <strong>{final.length} fragmento{final.length === 1 ? '' : 's'}</strong>: {final.map((x) => `${fmt(x, 1)} kb`).join(', ')}
              </p>
              <p className="m-0 text-sm text-[var(--ink-muted)]">
                {amostra.circular ? 'Em DNA circular, n cortes dão n fragmentos (um corte só linearizaria o plasmídeo).' : 'Em DNA linear, n cortes dão n + 1 fragmentos.'} Os fragmentos somam {fmt(final.reduce((s, x) => s + x, 0), 1)} kb.
              </p>
            </>
          )}
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Amostra de DNA" valor={amostra.id} opcoes={AMOSTRAS.map((a) => ({ id: a.id, rotulo: a.nome }))} onChange={(id) => atualizar({ am: id })} />
        <PainelDeVisibilidade
          titulo="Enzimas de restrição"
          itens={ENZ_GEL.map((x) => ({ id: x, rotulo: `${x} (${ENZIMAS.find((z) => z.nome === x)?.sitio}): ${amostra.sitios[x]?.length ?? 0} sítio${(amostra.sitios[x]?.length ?? 0) === 1 ? '' : 's'}`, ativo: marcadas[x] ?? false }))}
          onChange={(id, ativo) => atualizar(id === 'EcoRI' ? { eco: ativo } : id === 'BamHI' ? { bam: ativo } : { hind: ativo })}
        />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Mapas ilustrativos (posições em kb), inventados para o exercício. Marque mais de uma enzima para ver a dupla digestão.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

const PADRAO_LAC = { lac: true, gli: false, mut: 'nenhuma' }
const MUTACOES_LAC: { id: MutacaoLac; rotulo: string }[] = [
  { id: 'nenhuma', rotulo: 'Bactéria normal' },
  { id: 'repressor', rotulo: 'Repressor defeituoso' },
  { id: 'operador', rotulo: 'Operador mutante' },
  { id: 'superrepressor', rotulo: 'Super-repressor' },
  { id: 'promotor', rotulo: 'Promotor mutante' },
]

function ExplorarLac() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_LAC)
  const mut = (MUTACOES_LAC.map((m) => m.id) as string[]).includes(e.mut) ? (e.mut as MutacaoLac) : 'nenhuma'
  const nivel = transcricaoLac({ lactose: e.lac, glicose: e.gli, mutacao: mut })
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <LacSvg lactose={e.lac} glicose={e.gli} mutacao={mut} />
        </div>
        <Cartao vivo>
          <p className="m-0 text-lg">
            Transcrição de lacZ, lacY e lacA: <strong>{nivel === 'alta' ? 'alta' : nivel === 'baixa' ? 'baixa' : 'nenhuma'}</strong>
          </p>
          <p className="m-0">{porqueLac({ lactose: e.lac, glicose: e.gli, mutacao: mut }, nivel)}</p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">{nivel === 'nenhuma' ? 'Sem mRNA, não há β-galactosidase nem permease: a bactéria não consegue usar a lactose.' : 'Com mRNA, a bactéria produz β-galactosidase e permease e passa a usar a lactose.'}</p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <PainelDeVisibilidade
          titulo="Ambiente"
          itens={[
            { id: 'lac', rotulo: 'Há lactose no meio', ativo: e.lac },
            { id: 'gli', rotulo: 'Há glicose no meio', ativo: e.gli },
          ]}
          onChange={(id, ativo) => atualizar(id === 'lac' ? { lac: ativo } : { gli: ativo })}
        />
        <Seletor rotulo="Mutação" valor={mut} opcoes={MUTACOES_LAC.map((m) => ({ id: m.id, rotulo: m.rotulo }))} onChange={(id) => atualizar({ mut: id })} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Repressor ligado ao operador bloqueia a RNA polimerase; a lactose o inativa. O complexo CAP–AMPc só atua na ausência de glicose.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

function TelaExplorar() {
  const [v, atualizar] = useEstadoUrl({ vista: 'pcr' })
  return (
    <div className="grid gap-4">
      <Alternador
        rotulo="O que explorar"
        valor={['pcr', 'gel', 'lac'].includes(v.vista) ? v.vista : 'pcr'}
        opcoes={[
          { id: 'pcr', rotulo: 'PCR' },
          { id: 'gel', rotulo: 'Enzimas de restrição e gel' },
          { id: 'lac', rotulo: 'Óperon lac' },
        ]}
        onChange={(id) => atualizar({ vista: id })}
      />
      {v.vista === 'gel' ? <ExplorarGel /> : v.vista === 'lac' ? <ExplorarLac /> : <ExplorarPcr />}
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: Meselson e Stahl */

const GERACOES = [0, 1, 2, 3, 4]
const PADRAO_MESELSON = { mod: 'conservativa', tm: 0 }

function TelaMeselson() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_MESELSON)
  const modelo: ModeloReplicacao = e.mod === 'semiconservativa' || e.mod === 'dispersiva' ? e.mod : 'conservativa'
  const anim = useAnimacao(e.tm, 4, (v) => atualizar({ tm: v }), 0.5)
  const t = Math.min(4, Math.max(0, e.tm))
  const g = Math.min(4, Math.floor(t + 1e-9))
  const obs = bandasMeselson('semiconservativa', g)
  const prev = bandasMeselson(modelo, g)
  const ok = compativelComObservacao(modelo, g)
  const primeiraFalha = GERACOES.find((x) => !compativelComObservacao(modelo, x))
  const linha = (b: ReturnType<typeof bandasMeselson>, mod: ModeloReplicacao) => (mod === 'dispersiva' && b.fracaoN15 !== undefined ? `uma só banda, de densidade intermediária (${fmt(b.fracaoN15 * 100, 1)} % de ¹⁵N)` : `pesado ${fmt(b.pesado * 100, 1)} % · híbrido ${fmt(b.hibrido * 100, 1)} % · leve ${fmt(b.leve * 100, 1)} %`)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <GradeMeselson modelo={modelo} geracaoAtual={g} ate={g} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Cada tubo mostra onde o DNA para num gradiente de densidade: leve em cima, pesado embaixo. As colunas só são reveladas conforme o tempo avança.</p>
        </div>
        <Cartao vivo>
          <p className="m-0 text-lg">
            Geração <strong>{g}</strong>: {moleculasNaGeracao(g)} molécula{moleculasNaGeracao(g) === 1 ? '' : 's'} de DNA, {moleculasComN15(g)} com ¹⁵N.
          </p>
          <p className="m-0">
            Observado: <strong>{linha(obs, 'semiconservativa')}</strong>.
          </p>
          <p className="m-0">
            Previsto ({NOME_MODELO[modelo].toLowerCase()}): <strong>{linha(prev, modelo)}</strong>.
          </p>
          <p className="m-0 text-lg" style={{ color: ok ? 'var(--ok)' : 'var(--erro)' }}>
            {ok ? '✓ Compatível com o que foi observado nesta geração.' : '✗ Incompatível: esta hipótese está refutada.'}
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {primeiraFalha === undefined ? 'A hipótese semiconservativa prevê o observado em todas as gerações.' : `Esta hipótese falha já na geração ${primeiraFalha}: ${modelo === 'conservativa' ? 'prevê uma banda pesada e outra leve onde se viu uma só banda intermediária' : 'prevê uma única banda mais leve onde se viram duas (híbrida e leve)'}.`}
          </p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <Alternador
          rotulo="Hipótese a testar"
          valor={modelo}
          opcoes={[
            { id: 'conservativa', rotulo: 'Conservativa' },
            { id: 'semiconservativa', rotulo: 'Semiconservativa' },
            { id: 'dispersiva', rotulo: 'Dispersiva' },
          ]}
          onChange={(id) => atualizar({ mod: id })}
        />
        <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(1)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        <ControleDeslizante rotulo="Tempo" valor={t} onChange={(v) => atualizar({ tm: v })} min={0} max={4} passo={0.1} unidade="gerações" marcas={[0, 2, 4]} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Bactérias com DNA de ¹⁵N (pesado) são transferidas para meio com ¹⁴N (leve). Em cada geração, o DNA se replica uma vez. Compare o resultado observado com o que cada hipótese prevê.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaDogma /> },
        { id: 'explorar', conteudo: <TelaExplorar /> },
        { id: 'lab', conteudo: <TelaMeselson /> },
      ]}
      desafios={DEFINICOES_MOLECULAR}
    />
  )
}

