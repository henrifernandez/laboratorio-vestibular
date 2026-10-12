import { EFEITOS_ENSO, MASSAS, type IdMassa } from '@/conteudo/geografia/fenomenos'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { Alternador, Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { useAnimacao } from '@/sim/useAnimacao'
import { GRAD_SECO, GRAD_UMIDO, MEDIDAS_URBANAS, NOME_FASE, SUPERFICIES, alturaCondensacaoKm, camadasDeInversao, faseEnso, intensidadeEnso, nivelComMedidas, resultadoOrografico, temperaturaNoCaminho, type FaseEnso } from './calculo'
import { DEFINICOES_FENOMENOS } from './definicoes'
import { ALTURAS_PERFIL, perfilDe } from './geradores'
import { EnsoSvg, GraficoSuperficies, LegendaMedidas, MapaMassas, OrograficaSvg, PerfilSvg, TabelaPerfil } from './Visuais'

const fmt = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const SEGUNDOS = 12

/* ------------------------------------------------------------------ Introdução: chuva de relevo */

const PADRAO_ORO = { t0: 28, dif: 8, h: 3, s: 0 }

function TelaOrografica() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_ORO)
  const zc = alturaCondensacaoKm(e.t0, e.t0 - e.dif)
  const mont = { t0: e.t0, altura: e.h, zc }
  const r = resultadoOrografico(mont)
  const c = temperaturaNoCaminho(mont, e.s)
  const anim = useAnimacao(e.s, 2, (v) => atualizar({ s: v }), 2 / SEGUNDOS)
  const mudar = (p: Partial<typeof PADRAO_ORO>) => {
    anim.setRodando(false)
    atualizar({ ...p, s: p.s ?? e.s })
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <OrograficaSvg montanha={mont} posicao={e.s} />
        <Cartao vivo>
          <p className="m-0">
            Agora: <strong>{fmt(c.t)} °C</strong> a {fmt(c.z, 2)} km de altura {c.nuvem ? '(dentro da nuvem: gradiente de 6 °C/km)' : e.s > 1 ? '(descendo, ar seco: esquenta 10 °C/km)' : '(ar não saturado: esfria 10 °C/km)'}.
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {r.chove ? `Condensação a ${fmt(zc * 1000, 0)} m (125 m × ${fmt(e.dif, 0)}). Topo: ${fmt(r.tTopo)} °C. Do outro lado, o ar chega com ${fmt(r.tSotavento)} °C: ${fmt(r.aquecimento)} °C a mais que na entrada (4 × ${fmt(e.h - zc, 2)}).` : `A condensação (${fmt(zc * 1000, 0)} m) fica acima do topo: não há nuvem nem chuva, e o ar volta com a mesma temperatura.`}
          </p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Temperatura do ar na entrada" valor={e.t0} onChange={(v) => mudar({ t0: v })} min={20} max={36} passo={1} unidade="°C" marcas={[20, 28, 36]} />
        <ControleDeslizante rotulo="Temperatura menos ponto de orvalho" valor={e.dif} onChange={(v) => mudar({ dif: v })} min={2} max={14} passo={1} unidade="°C" marcas={[2, 8, 14]} descricao="Quanto menor a diferença, mais úmido o ar e mais baixa a condensação." />
        <ControleDeslizante rotulo="Altura da serra" valor={e.h} onChange={(v) => mudar({ h: v })} min={1} max={4} passo={0.5} unidade="km" marcas={[1, 2.5, 4]} />
        <ControleDeslizante rotulo="Posição do ar no caminho" valor={e.s} onChange={(v) => atualizar({ s: v })} min={0} max={2} passo={0.05} marcas={[0, 1, 2]} descricao="0 = antes da serra; 1 = no topo; 2 = depois da serra, ao nível do mar" />
        <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(0.1)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">
          Gradientes de exercício: {GRAD_SECO} °C/km no ar não saturado e {GRAD_UMIDO} °C/km no saturado. Experimente diminuir a diferença com o orvalho: a nuvem se forma mais baixo, o ar esfria menos na subida e sai mais quente do outro lado.
        </p>
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

/* ------------------------------------------------------------------ Explorar: massas de ar */

const PADRAO_MASSA = { m: 'todas' }

function TelaMassas() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_MASSA)
  const massa = MASSAS.find((x) => x.id === e.m)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <MapaMassas destaque={massa?.id ?? null} mostrarTodas />
      <div className="grid content-start gap-4">
        <Seletor rotulo="Massa de ar" valor={massa ? massa.id : 'todas'} opcoes={[{ id: 'todas', rotulo: 'Todas as cinco' }, ...MASSAS.map((x) => ({ id: x.id, rotulo: `${x.id}: ${x.nome}` }))]} onChange={(v) => atualizar({ m: v })} />
        {massa ? (
          <Cartao vivo>
            <p className="m-0 text-lg font-semibold">
              {massa.nome} ({massa.id})
            </p>
            <p className="m-0">
              <strong>{massa.temperatura}</strong> e <strong>{massa.umidade}</strong>
            </p>
            <p className="m-0 text-sm">Origem: {massa.origem}.</p>
            <p className="m-0 text-sm">Atua em: {massa.regioes}.</p>
            <ul className="m-0 grid gap-1 pl-5 text-sm">
              {massa.efeitos.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Cartao>
        ) : (
          <Cartao vivo>
            <p className="m-0">Escolha uma massa para destacá-la no mapa. Três são quentes e úmidas (mEc, mEa e mTa), uma é quente e seca (mTc) e uma é fria e úmida (mPa).</p>
          </Cartao>
        )}
        <p className="m-0 text-xs text-[var(--ink-muted)]">As elipses e as setas são esquemáticas. As massas de ar não têm limites fixos. Mapa: Natural Earth (domínio público), pelo pacote world-atlas.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: El Niño, ilha de calor e inversão */

const PADRAO_FEN = { f: 'enso', an: 1.5, arv: false, tel: false, t0: 10, base: 200, esp: 300, dl: 3 }

function TelaFenomeno() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_FEN)
  const fenomeno = e.f === 'urbano' || e.f === 'inversao' ? e.f : 'enso'
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid content-start gap-3">
        {fenomeno === 'enso' && <PainelEnso anomalia={e.an} />}
        {fenomeno === 'urbano' && <PainelUrbano medidas={[e.arv && 'arvores', e.tel && 'telhado'].filter(Boolean) as string[]} />}
        {fenomeno === 'inversao' && <PainelInversao t0={e.t0} base={e.base} esp={e.esp} dl={e.dl} />}
      </div>
      <div className="grid content-start gap-4">
        <Alternador
          rotulo="Fenômeno"
          valor={fenomeno}
          opcoes={[
            { id: 'enso', rotulo: 'El Niño e La Niña' },
            { id: 'urbano', rotulo: 'Ilha de calor' },
            { id: 'inversao', rotulo: 'Inversão térmica' },
          ]}
          onChange={(v) => atualizar({ f: v })}
        />
        {fenomeno === 'enso' && (
          <ControleDeslizante rotulo="Anomalia da temperatura do mar (Niño 3.4)" valor={e.an} onChange={(v) => atualizar({ an: v })} min={-3} max={3} passo={0.1} unidade="°C" marcas={[-3, 0, 3]} descricao="Positiva: Pacífico central mais quente que o normal (El Niño). Negativa: mais frio (La Niña)." />
        )}
        {fenomeno === 'urbano' && (
          <>
            <PainelDeVisibilidade
              itens={MEDIDAS_URBANAS.map((m) => ({ id: m.id === 'arvores' ? 'arv' : 'tel', rotulo: m.nome, ativo: m.id === 'arvores' ? e.arv : e.tel }))}
              onChange={(id, ativo) => atualizar({ [id]: ativo })}
            />
            <LegendaMedidas />
          </>
        )}
        {fenomeno === 'inversao' && (
          <>
            <ControleDeslizante rotulo="Temperatura na superfície" valor={e.t0} onChange={(v) => atualizar({ t0: v })} min={0} max={20} passo={1} unidade="°C" marcas={[0, 10, 20]} />
            <ControleDeslizante rotulo="Altura da base da inversão" valor={e.base} onChange={(v) => atualizar({ base: v })} min={100} max={400} passo={100} unidade="m" marcas={[100, 250, 400]} />
            <ControleDeslizante rotulo="Espessura da camada" valor={e.esp} onChange={(v) => atualizar({ esp: v })} min={100} max={500} passo={100} unidade="m" marcas={[100, 300, 500]} />
            <ControleDeslizante rotulo="Aquecimento ao longo da camada" valor={e.dl} onChange={(v) => atualizar({ dl: v })} min={0} max={6} passo={1} unidade="°C" marcas={[0, 3, 6]} descricao="Zero: sem inversão (o ar continua esfriando com a altura)." />
          </>
        )}
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

function PainelEnso({ anomalia }: { anomalia: number }) {
  const fase = faseEnso(anomalia)
  const inten = intensidadeEnso(anomalia)
  const coluna = fase === 'el-nino' ? 'elNino' : fase === 'la-nina' ? 'laNina' : null
  return (
    <>
      <EnsoSvg anomalia={anomalia} />
      <Cartao vivo>
        <p className="m-0 text-lg font-semibold">
          {NOME_FASE[fase]}
          {inten ? ` ${inten}` : ''}
        </p>
        <p className="m-0 text-sm text-[var(--ink-muted)]">Anomalia de {fmt(anomalia)} °C. Limiares: ≥ +0,5 °C (El Niño) e ≤ −0,5 °C (La Niña).</p>
      </Cartao>
      <div className="cartao overflow-x-auto p-3">
        <table className="w-full border-collapse text-sm">
          <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">Tendências por região {coluna ? `(${NOME_FASE[fase]})` : '(sem efeito típico em condições neutras)'}</caption>
          <tbody>
            {EFEITOS_ENSO.map((r) => (
              <tr key={r.regiao} className="border-b border-[var(--line)] align-top">
                <th scope="row" className="py-1 pr-2 text-left font-semibold">{r.regiao}</th>
                <td className="px-1">{coluna ? r[coluna] : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="m-0 mt-2 text-xs text-[var(--ink-muted)]">São tendências estatísticas, não previsões para um ano específico.</p>
      </div>
    </>
  )
}

function PainelUrbano({ medidas }: { medidas: string[] }) {
  const centro = SUPERFICIES.find((s) => s.id === 'centro')!
  return (
    <>
      <GraficoSuperficies medidas={medidas} />
      <Cartao vivo>
        <p className="m-0">
          O centro com asfalto e concreto está no nível <strong>{nivelComMedidas(centro.nivel, medidas)}</strong> de 4 {medidas.length ? '(reduzido pelas medidas escolhidas)' : '(sem medidas)'}.
        </p>
        <p className="m-0 text-sm text-[var(--ink-muted)]">{centro.porque}</p>
      </Cartao>
    </>
  )
}

function PainelInversao({ t0, base, esp, dl }: { t0: number; base: number; esp: number; dl: number }) {
  const perfil = perfilDe({ t0, base, espessura: esp, delta: dl })
  const camadas = camadasDeInversao(perfil)
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
        <PerfilSvg perfil={perfil} camadas={camadas} />
        <TabelaPerfil perfil={perfil} />
      </div>
      <Cartao vivo>
        {camadas.length ? (
          <p className="m-0">
            Inversão entre <strong>{camadas[0]!.de} m</strong> e <strong>{camadas[0]!.ate} m</strong> ({camadas[0]!.ate - camadas[0]!.de} m de espessura). O ar frio e denso fica preso embaixo, e a poluição não sobe.
          </p>
        ) : (
          <p className="m-0">Sem inversão: a temperatura cai com a altura em toda a camada, o ar quente sobe e a poluição se dispersa.</p>
        )}
        <p className="m-0 text-sm text-[var(--ink-muted)]">Fora da inversão, a queda é de 6,5 °C por km (valor médio); a tabela vai de {ALTURAS_PERFIL[0]} a {fmt(ALTURAS_PERFIL[ALTURAS_PERFIL.length - 1] as number, 0)} m.</p>
      </Cartao>
    </>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaOrografica /> },
        { id: 'explorar', conteudo: <TelaMassas /> },
        { id: 'lab', conteudo: <TelaFenomeno /> },
      ]}
      desafios={DEFINICOES_FENOMENOS}
    />
  )
}

export type { FaseEnso, IdMassa }
