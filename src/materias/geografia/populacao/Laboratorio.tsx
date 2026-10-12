import { CENSOS, FASES, NOTA_MODELO } from '@/conteudo/geografia/populacao'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { Alternador, Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { useAnimacao } from '@/sim/useAnimacao'
import {
  FAIXAS,
  NOME_FORMA,
  PARAMETROS_FASE,
  crescimentoNatural,
  faseDasTaxas,
  formaDaPiramide,
  grupos,
  parametrosNoTempo,
  piramideModelo,
  taxaMedia,
  taxasNoTempo,
  tempoDuplicacao70,
  type Fase,
} from './calculo'
import { DEFINICOES_POPULACAO } from './definicoes'
import { GraficoTransicao, Indicadores, LegendaGrupos, PiramideSvg, TabelaFaixas } from './Visuais'

const fmt = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })

/* ------------------------------------------------------------------ Introdução: leia uma pirâmide */

const PADRAO_LEITURA = { fase: 3, grupos: true, faixa: -1 }
const OPCOES_FAIXA = [{ id: '-1', rotulo: 'Nenhuma' }, ...FAIXAS.map((x, i) => ({ id: String(i), rotulo: `${x} anos` }))]

function TelaLeitura() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_LEITURA)
  const fase = (e.fase >= 1 && e.fase <= 4 ? Math.round(e.fase) : 3) as Fase
  const p = piramideModelo(PARAMETROS_FASE[fase])
  const g = grupos(p)
  const faixa = e.faixa >= 0 && e.faixa < FAIXAS.length ? Math.floor(e.faixa) : null
  const info = FASES[fase - 1]
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <PiramideSvg piramide={p} grupos={e.grupos} faixaSel={faixa} titulo={`do modelo da fase ${fase}`} />
        {e.grupos && <LegendaGrupos g={g} />}
        <Cartao vivo>
          {faixa === null ? (
            <p className="m-0">Escolha uma faixa de idade para ver os valores dos homens e das mulheres.</p>
          ) : (
            <p className="m-0">
              <strong>{FAIXAS[faixa]} anos</strong>: homens {fmt(p.homens[faixa] as number)}% e mulheres {fmt(p.mulheres[faixa] as number)}% do total da população, somando {fmt((p.homens[faixa] as number) + (p.mulheres[faixa] as number))}%.
            </p>
          )}
        </Cartao>
        <TabelaFaixas piramide={p} />
      </div>
      <div className="grid content-start gap-4">
        <Alternador
          rotulo="Fase da transição"
          valor={String(fase)}
          opcoes={[1, 2, 3, 4].map((n) => ({ id: String(n), rotulo: `Fase ${n}` }))}
          onChange={(v) => atualizar({ fase: Number(v) })}
        />
        <Cartao vivo>
          <p className="m-0 text-lg font-semibold">{info?.nome}</p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Natalidade {info?.natalidade}; mortalidade {info?.mortalidade}.</p>
          <p className="m-0 text-sm">{info?.explicacao}</p>
        </Cartao>
        <Indicadores g={g} />
        <Cartao>
          <p className="m-0 text-sm">Forma da pirâmide: <strong>{NOME_FORMA[formaDaPiramide(g)]}</strong>.</p>
        </Cartao>
        <Seletor rotulo="Faixa de idade" valor={String(faixa ?? -1)} opcoes={OPCOES_FAIXA} onChange={(v) => atualizar({ faixa: Number(v) })} />
        <PainelDeVisibilidade itens={[{ id: 'grupos', rotulo: 'Colorir jovens, adultos e idosos', ativo: e.grupos }]} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_MODELO}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: a transição no tempo */

const PADRAO_TRANSICAO = { t: 0.2 }
const SEGUNDOS_REAIS = 24

function TelaTransicao() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_TRANSICAO)
  const t = Math.min(1, Math.max(0, e.t))
  const anim = useAnimacao(t, 1, (v) => atualizar({ t: v }), 1 / SEGUNDOS_REAIS)
  const { natalidade, mortalidade } = taxasNoTempo(t)
  const fase = faseDasTaxas(natalidade, mortalidade)
  const cn = crescimentoNatural(natalidade, mortalidade)
  const p = piramideModelo(parametrosNoTempo(t))
  const g = grupos(p)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <GraficoTransicao t={t} />
        <PiramideSvg piramide={p} grupos titulo="do modelo neste momento" />
        <LegendaGrupos g={g} />
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Momento da transição" valor={t} onChange={(v) => atualizar({ t: v })} min={0} max={1} passo={0.01} marcas={[0, 0.5, 1]} descricao="0 = início da transição; 1 = final" />
        <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(1 / 50)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        <Cartao vivo>
          <p className="m-0 text-lg font-semibold">Fase {fase}</p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">{FASES[fase - 1]?.nome}</p>
          <p className="num m-0 text-sm">Natalidade {fmt(natalidade, 0)} por mil · mortalidade {fmt(mortalidade, 0)} por mil</p>
          <p className="num m-0 text-sm">Crescimento natural: {fmt(cn)}% ao ano</p>
        </Cartao>
        <Indicadores g={g} />
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_MODELO}</p>
        <Rodape
          onReiniciar={() => {
            anim.setRodando(false)
            reiniciar()
          }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: monte uma população */

const PADRAO_MONTAR = { fec: 2.4, esp: 72, nat: 24, mor: 7 }

function TelaMontar() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_MONTAR)
  const p = piramideModelo({ fecundidade: e.fec, expectativa: e.esp })
  const g = grupos(p)
  const cn = crescimentoNatural(e.nat, e.mor)
  const censos = CENSOS.slice(1).map((c, i) => {
    const antes = CENSOS[i]
    return antes ? { de: antes.ano, ate: c.ano, taxa: taxaMedia(antes.populacao, c.populacao, c.ano - antes.ano) } : null
  })
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <PiramideSvg piramide={p} grupos titulo="montada por você" />
        <LegendaGrupos g={g} />
        <Indicadores g={g} />
        <Cartao vivo>
          <p className="m-0">
            Forma: <strong>{NOME_FORMA[formaDaPiramide(g)]}</strong>.
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">{e.fec > 2.1 ? 'Fecundidade acima da reposição (2,1): a população tende a crescer.' : e.fec < 2.1 ? 'Fecundidade abaixo da reposição (2,1): a população tende a parar de crescer e a envelhecer.' : 'Fecundidade na reposição (2,1).'}</p>
        </Cartao>
        <TabelaFaixas piramide={p} />
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Fecundidade (filhos por mulher)" valor={e.fec} onChange={(v) => atualizar({ fec: v })} min={1} max={7} passo={0.1} marcas={[1, 2.1, 7]} />
        <ControleDeslizante rotulo="Esperança de vida ao nascer" valor={e.esp} onChange={(v) => atualizar({ esp: v })} min={35} max={90} passo={1} unidade="anos" marcas={[35, 60, 90]} />
        <Cartao vivo>
          <p className="m-0 font-semibold">Crescimento da população</p>
          <p className="num m-0 text-sm">Natalidade {e.nat} por mil · mortalidade {e.mor} por mil</p>
          <p className="num m-0 text-sm">Crescimento natural: {fmt(cn)}% ao ano</p>
          <p className="m-0 text-sm">{cn > 0 ? `Dobra em cerca de ${fmt(tempoDuplicacao70(cn), 0)} anos (70 ÷ ${fmt(cn)}).` : cn < 0 ? `Diminui à metade em cerca de ${fmt(tempoDuplicacao70(-cn), 0)} anos (sem migração).` : 'A população fica estável (sem migração).'}</p>
        </Cartao>
        <ControleDeslizante rotulo="Natalidade" valor={e.nat} onChange={(v) => atualizar({ nat: v })} min={5} max={50} passo={1} unidade="por mil" marcas={[5, 25, 50]} />
        <ControleDeslizante rotulo="Mortalidade" valor={e.mor} onChange={(v) => atualizar({ mor: v })} min={3} max={40} passo={1} unidade="por mil" marcas={[3, 20, 40]} />
        <Cartao>
          <p className="m-0 text-sm font-semibold">No Brasil, entre os censos</p>
          <ul className="m-0 grid list-none gap-1 p-0 text-sm">
            {censos.map((c) => c && (
              <li key={c.ate} className="num">
                {c.de} a {c.ate}: cerca de {fmt(c.taxa, 2)}% ao ano
              </li>
            ))}
          </ul>
        </Cartao>
        <p className="m-0 text-sm text-[var(--ink-muted)]">Experimente: fecundidade 6 e esperança de vida 42 anos fazem uma pirâmide de base muito larga. Com fecundidade 1,4 e esperança de vida 82 anos, a base estreita e o topo fica largo. Natalidade 12 e mortalidade 10 dão um crescimento natural de apenas 0,2% ao ano.</p>
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_MODELO}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaLeitura /> },
        { id: 'explorar', conteudo: <TelaTransicao /> },
        { id: 'lab', conteudo: <TelaMontar /> },
      ]}
      desafios={DEFINICOES_POPULACAO}
    />
  )
}
