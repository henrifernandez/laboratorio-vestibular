import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { Alternador, Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { useAnimacao } from '@/sim/useAnimacao'
import {
  ESTRUTURAS,
  FASES_MEIOSE,
  FASES_MITOSE,
  OSMOLARIDADE_CELULA,
  SOLUTOS,
  balancoDiario,
  contagem,
  fotossinteseBruta,
  fotossinteseLiquida,
  luzDoDia,
  osmolaridade,
  pontoDeCompensacao,
  presentesEm,
  pressaoOsmotica,
  sentidoDaAgua,
  tonicidade,
  volumeNoTempo,
  volumeRelativoEquilibrio,
  type TipoCelular,
  type TipoDivisao,
} from './calculo'
import { DEFINICOES_CELULAR } from './definicoes'
import { PISTAS } from './geradoresDivisao'
import { CelulaDivisaoSvg, GraficoDna, LegendaCromossomos, NOME_TIPO, OsmoseSvg, PainelCelula, TEXTO_ESTADO, type EstadoCelula } from './Visuais'
import { CurvaLuzSvg, GraficoDia } from './VisuaisEnergia'

const fmt = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const limitar = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))

/* ------------------------------------------------------------------ Introdução: a célula e suas estruturas */

const PADRAO_CELULA = { tipo: 'animal', sel: '' }

function TelaCelula() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_CELULA)
  const tipo: TipoCelular = e.tipo === 'vegetal' || e.tipo === 'bacteria' ? e.tipo : 'animal'
  const sel = presentesEm(tipo).some((x) => x.id === e.sel) ? e.sel : null
  const exclusivas = ESTRUTURAS.filter((x) => x.presente[tipo] && (['animal', 'vegetal', 'bacteria'] as TipoCelular[]).filter((t) => t !== tipo).every((t) => !x.presente[t]))
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <PainelCelula tipo={tipo} selecionada={sel} onSelecionar={(id) => atualizar({ sel: id })} onTipo={(t) => atualizar({ tipo: t, sel: '' })} />
      <div className="grid content-start gap-3">
        <Cartao vivo>
          <p className="m-0 text-lg">
            Em {NOME_TIPO[tipo]}: <strong>{presentesEm(tipo).length}</strong> das {ESTRUTURAS.length} estruturas.
          </p>
          <p className="m-0">{exclusivas.length ? `Só neste tipo de célula (entre os três): ${exclusivas.map((x) => x.nome.toLowerCase()).join(', ')}.` : 'Todas as estruturas deste tipo de célula existem também em pelo menos outro tipo.'}</p>
          {tipo === 'bacteria' && <p className="m-0 text-sm text-[var(--ink-muted)]">A bactéria não tem núcleo nem organelas membranosas: o DNA fica solto, no nucleoide.</p>}
        </Cartao>
        <p className="m-0 text-sm text-[var(--ink-muted)]">Clique numa estrutura do desenho ou use os botões. Troque o tipo de célula para ver o que aparece e o que some.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: osmose e divisão celular */

const PADRAO_OSMOSE = { cel: 'hemacia', sol: 'nacl', c: 0.15, tp: 0 }
const K_OSMOSE = 0.5
const DURACAO = 10

/** Instante em que a hemácia atinge 1,4 vez o volume inicial (e estoura), ou null se isso não ocorre. */
const instanteDaLise = (veq: number) => (veq > 1.4 ? -Math.log((1.4 - veq) / (1 - veq)) / K_OSMOSE : null)

function GraficoVolume({ veq, t, celula }: { veq: number; t: number; celula: 'hemacia' | 'vegetal' }) {
  const X = (m: number) => 44 + (m / DURACAO) * 280
  const Y = (v: number) => 140 - ((v - 0.4) / 1.2) * 124
  const tLise = celula === 'hemacia' ? instanteDaLise(veq) : null
  const lisou = tLise !== null
  const fim = tLise ?? DURACAO
  const pts = Array.from({ length: 41 }, (_, j) => (j / 40) * fim).map((m) => `${X(m)},${Y(volumeNoTempo(1, veq, K_OSMOSE, m))}`).join(' ')
  const vAgora = volumeNoTempo(1, veq, K_OSMOSE, Math.min(t, fim))
  return (
    <svg viewBox="0 0 340 176" role="img" aria-label={`Volume relativo da célula ao longo de ${DURACAO} minutos: parte de 1 e tende a ${fmt(veq)}${lisou ? `; a hemácia estoura aos ${fmt(tLise ?? 0, 1)} minutos` : ''}`} className="mx-auto block w-full max-w-lg">
      <line x1={44} x2={44} y1={10} y2={140} stroke="var(--ink-muted)" strokeWidth={1.5} />
      <line x1={44} x2={326} y1={140} y2={140} stroke="var(--ink-muted)" strokeWidth={1.5} />
      {[0.5, 1, 1.5].map((v) => (
        <g key={v}>
          <line x1={40} x2={44} y1={Y(v)} y2={Y(v)} stroke="var(--ink-muted)" />
          <text x={36} y={Y(v) + 3.5} textAnchor="end" fontSize={10} fill="var(--ink-muted)" className="num">{fmt(v, 1)}</text>
        </g>
      ))}
      {[0, 5, 10].map((m) => (
        <text key={m} x={X(m)} y={156} textAnchor="middle" fontSize={10} fill="var(--ink-muted)" className="num">{m}</text>
      ))}
      <text x={326} y={172} textAnchor="end" fontSize={10.5} fill="var(--ink-muted)">tempo (min)</text>
      <text x={4} y={9} fontSize={10.5} fill="var(--ink-muted)">volume relativo</text>
      <line x1={44} x2={326} y1={Y(1)} y2={Y(1)} stroke="var(--line-strong)" strokeDasharray="4 4" />
      {celula === 'hemacia' && (
        <g>
          <line x1={44} x2={326} y1={Y(1.4)} y2={Y(1.4)} stroke="var(--erro)" strokeDasharray="5 4" />
          <text x={324} y={Y(1.4) - 4} textAnchor="end" fontSize={10} fill="var(--erro)">limite: estoura</text>
        </g>
      )}
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinejoin="round" />
      <circle cx={X(Math.min(t, fim))} cy={Y(vAgora)} r={5} fill="var(--ink)" stroke="var(--surface)" strokeWidth={1.5} />
    </svg>
  )
}

function ExplorarOsmose() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_OSMOSE)
  const celula: 'hemacia' | 'vegetal' = e.cel === 'vegetal' ? 'vegetal' : 'hemacia'
  const soluto = SOLUTOS.find((s) => s.id === e.sol) ?? (SOLUTOS[2] as (typeof SOLUTOS)[number])
  const c = limitar(e.c, 0, 0.8)
  const osm = Math.round(osmolaridade(c, soluto.i) * 1e6) / 1e6
  const ton = tonicidade(osm, OSMOLARIDADE_CELULA)
  const sentido = sentidoDaAgua(osm, OSMOLARIDADE_CELULA)
  const t = limitar(e.tp, 0, DURACAO)
  const anim = useAnimacao(e.tp, DURACAO, (v) => atualizar({ tp: v }), 1.5)
  const veq = osm > 0 ? limitar(volumeRelativoEquilibrio(OSMOLARIDADE_CELULA, osm), 0.45, 3) : 3
  // célula vegetal: o protoplasto só encolhe (a parede limita a expansão)
  const veqCelula = celula === 'hemacia' ? veq : Math.min(1, veq)
  const v = volumeNoTempo(1, veqCelula, K_OSMOSE, t)
  const estado: EstadoCelula = celula === 'hemacia' ? (v >= 1.4 ? 'lise' : v > 1.12 ? 'inchada' : v <= 0.82 ? 'crenacao' : 'normal') : ton === 'hipotonico' ? 'turgida' : ton === 'isotonico' ? 'flacida' : 'plasmolise'
  const agua: 'entra' | 'sai' | 'equilibrio' = celula === 'hemacia' ? (Math.abs(v - veq) < 0.02 || estado === 'lise' ? 'equilibrio' : veq > 1 ? 'entra' : 'sai') : t >= 6 || ton === 'isotonico' ? 'equilibrio' : ton === 'hipotonico' ? 'entra' : 'sai'
  const pi = pressaoOsmotica(c, soluto.i, 37)
  const tLise = celula === 'hemacia' ? instanteDaLise(veqCelula) : null
  const textoTon = ton === 'hipotonico' ? 'hipotônico (menos solutos que a célula)' : ton === 'isotonico' ? 'isotônico (mesma osmolaridade da célula)' : 'hipertônico (mais solutos que a célula)'
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <OsmoseSvg estado={estado} volume={celula === 'hemacia' ? v : limitar(v, 0.3, 1)} agua={agua} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">As setas mostram o sentido do fluxo de água; no equilíbrio, as duas se compensam.</p>
        </div>
        <div className="cartao grid gap-2 p-3">
          <GraficoVolume veq={veqCelula} t={t} celula={celula} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Modelo simplificado: o volume se aproxima do equilíbrio de forma exponencial. A hemácia estoura quando passa de 1,4 vez o volume inicial.</p>
        </div>
        <Cartao vivo>
          <p className="m-0 text-lg">
            Meio externo: <strong>{fmt(osm, 3)} osmol/L</strong> ({fmt(c, 2)} mol/L × {soluto.i} partícula{soluto.i > 1 ? 's' : ''}) · interior da célula: {fmt(OSMOLARIDADE_CELULA, 2)} osmol/L
          </p>
          <p className="m-0">
            O meio é <strong>{textoTon}</strong>. {sentido === 'nenhum' ? 'Não há fluxo líquido de água.' : sentido === 'A→B' ? 'A água entra na célula (do meio de menor para o de maior osmolaridade).' : 'A água sai da célula (do meio de menor para o de maior osmolaridade).'}
          </p>
          <p className="m-0">
            {estado === 'lise' ? (
              <>
                A hemácia passou de 1,4 vez o volume inicial aos {fmt(tLise ?? 0, 1)} min e estourou. Efeito: <strong>{TEXTO_ESTADO[estado]}</strong>.
              </>
            ) : (
              <>
                Volume relativo agora: <strong>{fmt(celula === 'hemacia' ? v : limitar(v, 0, 1), 2)}</strong> (tende a {fmt(veqCelula, 2)}). Efeito: <strong>{TEXTO_ESTADO[estado]}</strong>.
              </>
            )}
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Pressão osmótica da solução a 37 °C: {fmt(pi, 2)} atm (π = i · M · R · T).</p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <Alternador
          rotulo="Célula"
          valor={celula}
          opcoes={[
            { id: 'hemacia', rotulo: 'Hemácia (animal)' },
            { id: 'vegetal', rotulo: 'Célula vegetal' },
          ]}
          onChange={(id) => atualizar({ cel: id, tp: 0 })}
        />
        <Seletor rotulo="Soluto na solução" valor={soluto.id} opcoes={SOLUTOS.map((s) => ({ id: s.id, rotulo: `${s.nome} (${s.i} partícula${s.i > 1 ? 's' : ''})` }))} onChange={(id) => atualizar({ sol: id, tp: 0 })} />
        <ControleDeslizante rotulo="Concentração da solução" valor={c} onChange={(x) => atualizar({ c: x, tp: 0 })} min={0} max={0.8} passo={0.01} unidade="mol/L" marcas={[0, 0.15, 0.3, 0.8]} />
        <button type="button" className="btn" onClick={() => atualizar({ c: Math.round((OSMOLARIDADE_CELULA / soluto.i) * 1000) / 1000, tp: 0 })}>
          Deixar o meio isotônico
        </button>
        <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(1)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        <ControleDeslizante rotulo="Tempo" valor={t} onChange={(x) => atualizar({ tp: x })} min={0} max={DURACAO} passo={0.1} unidade="min" marcas={[0, 5, 10]} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">O interior das células tem cerca de 0,30 osmol/L. Cada partícula dissolvida conta: o NaCl a 0,15 mol/L é isotônico às hemácias (soro fisiológico).</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

const PADRAO_DIVISAO = { tipo: 'mitose', n2: 4, tp: 0 }
const VALORES_2N = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 46]
const TEXTO_INTERFASE: Record<string, string> = {
  G1: 'Interfase (G1): a célula cresce e o DNA ainda não foi duplicado; cada cromossomo tem uma cromátide.',
  'S/G2': 'Fase S e G2: o DNA é duplicado e a célula se prepara para dividir; cada cromossomo tem duas cromátides-irmãs.',
}

function ExplorarDivisao() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_DIVISAO)
  const tipo: TipoDivisao = e.tipo === 'meiose' ? 'meiose' : 'mitose'
  const fases = tipo === 'mitose' ? FASES_MITOSE : FASES_MEIOSE
  const N = fases.length
  const n2 = VALORES_2N.includes(e.n2) ? e.n2 : 4
  const anim = useAnimacao(e.tp, N - 1, (x) => atualizar({ tp: x }), 0.7)
  const t = limitar(e.tp, 0, N - 1)
  const idx = Math.min(N - 1, Math.floor(t + 1e-9))
  const fase = fases[idx] as string
  const c = contagem(tipo, fase, n2)
  const descricao = TEXTO_INTERFASE[fase] ?? `${(PISTAS[tipo][fase] as string).charAt(0).toUpperCase()}${(PISTAS[tipo][fase] as string).slice(1)}.`
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <CelulaDivisaoSvg tipo={tipo} fase={fase} />
          <LegendaCromossomos />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">O desenho usa sempre 2n = 4; as contagens ao lado seguem o 2n escolhido.</p>
        </div>
        <Cartao vivo>
          <p className="m-0 text-lg">
            Fase: <strong>{fase}</strong> ({idx + 1} de {N}, {tipo === 'mitose' ? 'mitose' : 'meiose'})
          </p>
          <p className="m-0">{descricao}</p>
          <p className="m-0">
            Células: <strong>{c.celulas}</strong> · cromossomos por célula: <strong>{fmt(c.cromossomosPorCelula, 0)}</strong> · cromátides por célula: <strong>{fmt(c.cromatidesPorCelula, 0)}</strong> · DNA por célula: <strong>{fmt(c.dnaPorCelula, 0)} C</strong>
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Com 2n = {n2}: {fmt(n2 / 2, 0)} pares de homólogos. {tipo === 'meiose' && idx === N - 1 ? `Cada gameta fica com n = ${fmt(n2 / 2, 0)} cromossomos.` : ''}</p>
        </Cartao>
        <div className="cartao grid gap-2 p-3">
          <GraficoDna tipo={tipo} atual={fase} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">DNA por célula (C): dobra na fase S e cai a cada divisão do citoplasma.</p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <Alternador
          rotulo="Tipo de divisão"
          valor={tipo}
          opcoes={[
            { id: 'mitose', rotulo: 'Mitose' },
            { id: 'meiose', rotulo: 'Meiose' },
          ]}
          onChange={(id) => atualizar({ tipo: id, tp: 0 })}
        />
        <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(1)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        <ControleDeslizante rotulo={`Fase (${fase})`} valor={idx} onChange={(x) => atualizar({ tp: x })} min={0} max={N - 1} passo={1} marcas={[0, N - 1]} />
        <Seletor rotulo="Número de cromossomos da espécie (2n)" valor={String(n2)} opcoes={VALORES_2N.map((x) => ({ id: String(x), rotulo: `2n = ${x}${x === 46 ? ' (ser humano)' : ''}` }))} onChange={(id) => atualizar({ n2: Number(id) })} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Use o botão de reproduzir, o passo ou o controle de fase. Compare a metáfase I com a metáfase II, e a anáfase I com a anáfase II.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

function TelaExplorar() {
  const [v, atualizar] = useEstadoUrl({ vista: 'osmose' })
  return (
    <div className="grid gap-4">
      <Alternador
        rotulo="O que explorar"
        valor={v.vista === 'divisao' ? 'divisao' : 'osmose'}
        opcoes={[
          { id: 'osmose', rotulo: 'Osmose' },
          { id: 'divisao', rotulo: 'Mitose e meiose' },
        ]}
        onChange={(id) => atualizar({ vista: id })}
      />
      {v.vista === 'divisao' ? <ExplorarDivisao /> : <ExplorarOsmose />}
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: fotossíntese e respiração ao longo de um dia */

const PADRAO_DIA = { pmax: 24, k: 60, r: 6, imax: 600, hr: 0 }

function TelaDia() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_DIA)
  const anim = useAnimacao(e.hr, 24, (x) => atualizar({ hr: x }), 2.4)
  const hora = limitar(e.hr, 0, 24)
  const pmax = e.pmax
  const k = e.k
  const r = Math.min(e.r, 40)
  const imax = e.imax
  const luz = luzDoDia(hora, imax)
  const bruta = fotossinteseBruta(pmax, k, luz)
  const liquida = fotossinteseLiquida(pmax, k, r, luz)
  const compensa = pmax > r
  const ic = compensa ? pontoDeCompensacao(pmax, k, r) : null
  // saldo acumulado desde 0 h até agora e saldo do dia inteiro
  let acumulado = 0
  for (let h = 0; h < hora; h += 0.05) acumulado += fotossinteseLiquida(pmax, k, r, luzDoDia(Math.min(hora, h + 0.025), imax)) * Math.min(0.05, hora - h)
  const dia = balancoDiario(pmax, k, r, imax)
  const horasPositivas = ic !== null && imax > ic ? 12 - (24 / Math.PI) * Math.asin(ic / imax) : 0
  const estado = liquida > 1e-9 ? 'produz mais O₂ do que consome' : liquida < -1e-9 ? 'consome mais O₂ do que produz' : 'está exatamente no ponto de compensação'
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <GraficoDia pmax={pmax} k={k} r={r} imax={imax} hora={hora} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Curva verde: fotossíntese bruta. Linha vermelha tracejada: respiração. Área verde: saldo positivo de O₂; área vermelha: saldo negativo.</p>
        </div>
        <div className="cartao grid gap-2 p-3">
          <CurvaLuzSvg pmax={pmax} k={k} r={r} luz={luz} mostrarIc />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Resposta da folha à luz; o ponto marcado é a luz da hora escolhida.</p>
        </div>
        <Cartao vivo>
          <p className="m-0 text-lg">
            Às <strong>{fmt(hora, 1)} h</strong>: luz de {fmt(luz, 0)} µmol de fótons/(m²·s) → fotossíntese bruta <strong>{fmt(bruta, 2)}</strong>, respiração {fmt(r, 0)}, taxa líquida <strong>{fmt(liquida, 2)}</strong>.
          </p>
          <p className="m-0">A planta {estado} neste momento.</p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Saldo de O₂ acumulado desde 0 h: {fmt(acumulado, 0)} (µmol por m², aproximado).</p>
        </Cartao>
        <Cartao vivo>
          <p className="m-0">
            Ponto de compensação luminoso: <strong>{ic === null ? 'não existe (a fotossíntese máxima não supera a respiração)' : `${fmt(ic, 1)} µmol de fótons/(m²·s)`}</strong>. {ic !== null && imax > ic ? `A luz passa dele por cerca de ${fmt(horasPositivas, 1)} h por dia.` : ic !== null ? 'A luz do meio-dia nem chega a ele.' : ''}
          </p>
          <p className="m-0 text-lg">
            Saldo do dia (24 h): <strong style={{ color: dia >= 0 ? 'var(--ok)' : 'var(--erro)' }}>{fmt(dia, 0)}</strong> µmol de O₂ por m² — {dia > 0 ? 'a planta produz mais do que consome (acumula matéria orgânica e cresce).' : dia < 0 ? 'a planta consome mais do que produz (perde reservas).' : 'saldo nulo.'}
          </p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(1)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        <ControleDeslizante rotulo="Hora do dia" valor={hora} onChange={(x) => atualizar({ hr: x })} min={0} max={24} passo={0.1} unidade="h" marcas={[0, 6, 12, 18, 24]} />
        <ControleDeslizante rotulo="Luz ao meio-dia" valor={imax} onChange={(x) => atualizar({ imax: x })} min={0} max={1500} passo={10} unidade="µmol fótons/(m²·s)" marcas={[0, 300, 600, 1500]} />
        <ControleDeslizante rotulo="Fotossíntese máxima (Pmax)" valor={pmax} onChange={(x) => atualizar({ pmax: x })} min={4} max={40} passo={1} marcas={[4, 24, 40]} />
        <ControleDeslizante rotulo="Meia saturação (K)" valor={k} onChange={(x) => atualizar({ k: x })} min={10} max={200} passo={5} marcas={[10, 60, 200]} />
        <ControleDeslizante rotulo="Respiração (R)" valor={r} onChange={(x) => atualizar({ r: x })} min={1} max={20} passo={1} marcas={[1, 6, 20]} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">A luz segue uma senoide entre 6 h e 18 h. A respiração é constante, dia e noite. Reduza a luz do meio-dia ou aumente R e veja o saldo do dia ficar negativo.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaCelula /> },
        { id: 'explorar', conteudo: <TelaExplorar /> },
        { id: 'lab', conteudo: <TelaDia /> },
      ]}
      desafios={DEFINICOES_CELULAR}
    />
  )
}
