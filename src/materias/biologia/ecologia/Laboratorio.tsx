import { useId, useMemo, type ReactNode } from 'react'
import { Line, Plot, Point, Polyline } from 'mafs'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { BotaoLink } from '@/sim/BotaoLink'
import { BotaoReiniciar } from '@/sim/BotaoReiniciar'
import { Cena } from '@/sim/Cena'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { ControlesDeTempo } from '@/sim/ControlesDeTempo'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { SeletorNumerico } from '@/sim/SeletorNumerico'
import { useAnimacao } from '@/sim/useAnimacao'
import {
  AMBIENTES_PIRAMIDE,
  FRACAO_ATMOSFERA,
  PARAMETROS_LV,
  TEIAS,
  ambientePiramide,
  balancoCarbono,
  cadeias,
  concentracaoNoNivel,
  energiaPorNivel,
  equilibrioLV,
  invertida,
  logistico,
  niveis,
  nomeEspecie,
  pontoEm,
  remover,
  taxaLogistica,
  taxaMaximaLogistica,
  teia,
  trajetoriaLV,
} from './calculo'
import { DEFINICOES_ECOLOGIA } from './definicoes'
import { PiramideBarras, TeiaSvg, legendaMarcas, type Marca } from './Visuais'

const fmt = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
/** Passo de grade "redondo" (1, 2, 5 × potência de 10) perto de v. */
const bonito = (v: number) => {
  const pot = 10 ** Math.floor(Math.log10(Math.max(v, 1e-9)))
  const m = v / pot
  return (m <= 1.5 ? 1 : m <= 3.5 ? 2 : m <= 7.5 ? 5 : 10) * pot
}
const lista = (itens: string[]) => (itens.length <= 1 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`)

/* ------------------------------------------------------------------ peças comuns */

interface OpcaoAlternador {
  id: string
  rotulo: string
}

/** Escolha entre poucas opções, como botões: setas do teclado trocam a opção. */
function Alternador({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor: string; opcoes: OpcaoAlternador[]; onChange: (id: string) => void }) {
  const nome = useId()
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-1 text-sm font-semibold text-[var(--ink-muted)]">{rotulo}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <label
            key={o.id}
            className={`btn cursor-pointer has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${o.id === valor ? 'btn-primario' : ''}`}
          >
            <input type="radio" name={nome} value={o.id} checked={o.id === valor} onChange={() => onChange(o.id)} className="sr-only" />
            {o.rotulo}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Seletor({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor: string; opcoes: OpcaoAlternador[]; onChange: (id: string) => void }) {
  const id = useId()
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="font-semibold">
        {rotulo}
      </label>
      <select id={id} value={valor} onChange={(ev) => onChange(ev.target.value)} className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3">
        {opcoes.map((o) => (
          <option key={o.id} value={o.id}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </div>
  )
}

function Rodape({ onReiniciar }: { onReiniciar: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BotaoReiniciar onClick={onReiniciar} />
      <BotaoLink />
    </div>
  )
}

const Cartao = ({ children, vivo = false }: { children: ReactNode; vivo?: boolean }) => (
  <div className="cartao num grid gap-1 p-3" aria-live={vivo ? 'polite' : undefined}>
    {children}
  </div>
)

/* ------------------------------------------------------------------ Introdução: retirar espécies da teia */

const PADRAO_TEIA = { amb: 'lago', rem: '', cad: false }

function TelaTeia() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_TEIA)
  const t = teia(e.amb)
  const removidas = e.rem ? e.rem.split(',').filter((id) => t.especies.some((x) => x.id === id)) : []
  const c = remover(t, removidas)
  const nome = (id: string) => nomeEspecie(t, id)
  const marcas: Record<string, Marca> = {}
  for (const id of c.perdemPredador) marcas[id] = 'sobe'
  for (const id of c.ganhamAlimento) marcas[id] ??= 'sobe'
  for (const id of c.perdemFonte) marcas[id] = 'fonte'
  for (const id of c.semAlimentoEmCadeia) marcas[id] = 'sem'
  for (const id of removidas) marcas[id] = 'removida'
  const maior = cadeias(t).reduce((m, x) => (x.length > m.length ? x : m))
  const alterna = (id: string) => atualizar({ rem: (removidas.includes(id) ? removidas.filter((x) => x !== id) : [...removidas, id]).join(',') })
  const imediatos = c.semAlimento
  const emCadeia = c.semAlimentoEmCadeia.filter((id) => !imediatos.includes(id))
  const nivelTexto = (id: string) => {
    const n = niveis(t, id)
    return n.length === 1 ? `${n[0]}º` : `${lista(n.map((x) => `${x}º`))}`
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <TeiaSvg t={t} marcas={marcas} cadeia={e.cad ? maior : undefined} onAlternar={alterna} rotulo={`Teia alimentar do ambiente ${t.nome}. Cada espécie é uma caixa de seleção: marque para retirá-la.`} />
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">As setas vão de quem é comido para quem come. Clique numa espécie (ou use Tab e Enter) para retirá-la da teia.</p>
          {legendaMarcas(marcas)}
        </div>
        <Cartao vivo>
          {removidas.length === 0 ? (
            <p className="m-0">Nenhuma espécie retirada. Escolha uma para ver o que acontece com as outras.</p>
          ) : (
            <>
              <p className="m-0 text-lg">
                Retirada{removidas.length > 1 ? 's' : ''}: <strong>{lista(removidas.map(nome))}</strong>
              </p>
              {imediatos.length > 0 && (
                <p className="m-0">
                  Ficam sem nenhum alimento na hora: <strong>{lista(imediatos.map(nome))}</strong>
                </p>
              )}
              {emCadeia.length > 0 && (
                <p className="m-0">
                  Ficam sem alimento depois, em cadeia: <strong>{lista(emCadeia.map(nome))}</strong>
                </p>
              )}
              {c.perdemFonte.length > 0 && (
                <p className="m-0">
                  Perdem uma ou mais fontes, mas ainda têm outras: <strong>{lista(c.perdemFonte.map(nome))}</strong>
                </p>
              )}
              {c.perdemPredador.length > 0 && (
                <p className="m-0">
                  Perdem um predador (tendem a aumentar no início): <strong>{lista(c.perdemPredador.map(nome))}</strong>
                </p>
              )}
              {c.ganhamAlimento.length > 0 && (
                <p className="m-0">
                  Dividiam alimento com a espécie retirada (mais alimento disponível): <strong>{lista(c.ganhamAlimento.map(nome))}</strong>
                </p>
              )}
              <p className="m-0 text-sm text-[var(--ink-muted)]">Efeitos qualitativos, só pela estrutura da teia: na natureza, a intensidade depende de quanto cada espécie depende da outra.</p>
            </>
          )}
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Ambiente" valor={t.id} opcoes={TEIAS.map((x) => ({ id: x.id, rotulo: x.nome }))} onChange={(id) => atualizar({ amb: id, rem: '' })} />
        <PainelDeVisibilidade titulo="Mostrar" itens={[{ id: 'cad', rotulo: `Realçar a cadeia mais longa (${maior.length} níveis)`, ativo: e.cad }]} onChange={(_, ativo) => atualizar({ cad: ativo })} />
        <div className="cartao overflow-x-auto p-3">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="pb-1 text-left font-semibold">Níveis tróficos</caption>
            <thead>
              <tr className="border-b border-[var(--line-strong)]">
                <th scope="col" className="py-1 pr-2">Espécie</th>
                <th scope="col" className="py-1 pr-2">Nível</th>
                <th scope="col" className="py-1">Se alimenta de</th>
              </tr>
            </thead>
            <tbody>
              {[...t.especies]
                .sort((a, b) => (niveis(t, a.id)[0] as number) - (niveis(t, b.id)[0] as number))
                .map((s) => {
                  const a = t.come.filter(([q]) => q === s.id).map(([, x]) => x)
                  const fora = removidas.includes(s.id)
                  return (
                    <tr key={s.id} className="border-b border-[var(--line)] align-top" style={{ opacity: fora ? 0.5 : 1, textDecoration: fora ? 'line-through' : undefined }}>
                      <th scope="row" className="py-1 pr-2 font-semibold">{s.nome}</th>
                      <td className="num py-1 pr-2">{nivelTexto(s.id)}{niveis(t, s.id).length > 1 ? ' (onívoro)' : ''}</td>
                      <td className="py-1">{a.length ? lista(a.map(nome)) : 'produtor'}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: pirâmides, acúmulo e ciclo do carbono */

const NOMES_NIVEL = ['Produtores', 'Cons. primário', 'Cons. secundário', 'Cons. terciário', 'Cons. quaternário']
const PADRAO_PIRAMIDE = { pp: 10_000, ef: 10, n: 4, tipo: 'energia', amb: 'campo', c0: 0.01, ret: true, fm: 10 }

function ExplorarPiramide() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_PIRAMIDE)
  const n = Math.min(5, Math.max(3, Math.round(e.n)))
  const ef = e.ef / 100
  const amb = ambientePiramide(e.amb)
  const energia = energiaPorNivel(e.pp, ef, n)
  const fator = e.ret ? 1 / ef : e.fm
  const conc = Array.from({ length: n }, (_, i) => concentracaoNoNivel(e.c0, fator, i))
  const tipo = e.tipo === 'biomassa' || e.tipo === 'numeros' ? e.tipo : 'energia'
  const valores = tipo === 'energia' ? energia : tipo === 'biomassa' ? amb.biomassa : amb.numeros
  const rotulos = tipo === 'energia' ? NOMES_NIVEL.slice(0, n) : amb.niveis
  const unidade = tipo === 'energia' ? 'kJ/m²·ano' : tipo === 'biomassa' ? 'g/m²' : amb.unidadeNumeros
  const inv = invertida(valores)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <PiramideBarras
            titulo={tipo === 'energia' ? 'Pirâmide de energia' : tipo === 'biomassa' ? `Pirâmide de biomassa: ${amb.nome}` : `Pirâmide de números: ${amb.nome}`}
            itens={valores.map((v, i) => ({ rotulo: rotulos[i] as string, valor: v, texto: `${fmt(v, tipo === 'energia' ? 2 : 0)}` }))}
            cor={inv ? 'var(--aviso)' : 'var(--accent)'}
          />
          <p className="num m-0 text-sm text-[var(--ink-muted)]">Unidade: {unidade}. {tipo !== 'energia' && 'Valores ilustrativos de ambientes típicos.'}</p>
          <p className="m-0 text-lg" aria-live="polite">
            {inv ? (
              <>
                <strong>Pirâmide invertida:</strong> um nível supera o anterior.
              </>
            ) : (
              <>
                <strong>Pirâmide “de pé”:</strong> cada nível é menor que o anterior.
              </>
            )}
          </p>
          {tipo === 'energia' ? (
            <p className="m-0 text-sm text-[var(--ink-muted)]">Mexa nos controles: a energia nunca fica invertida, qualquer que seja a eficiência, porque a cada passagem parte se perde.</p>
          ) : (
            <p className="m-0 text-sm text-[var(--ink-muted)]">{tipo === 'biomassa' ? 'No mar, a biomassa de fitoplâncton num instante pode ser menor que a do zooplâncton: o fitoplâncton se reproduz e é consumido muito depressa.' : 'Uma árvore sustenta milhares de insetos: a pirâmide de números fica invertida, apesar de a energia continuar em pirâmide.'}</p>
          )}
        </div>
        <div className="cartao grid gap-2 p-3">
          <PiramideBarras
            titulo={`Acúmulo de um poluente persistente (mg/kg), fator ×${fmt(fator, 1)} por nível`}
            itens={conc.map((v, i) => ({ rotulo: NOMES_NIVEL[i] as string, valor: v, texto: `${fmt(v, 3)} mg/kg` }))}
            cor="var(--erro)"
          />
          <p className="num m-0" aria-live="polite">
            Nos produtores: {fmt(conc[0] as number, 3)} mg/kg · no topo: <strong>{fmt(conc[n - 1] as number, 3)} mg/kg</strong> ({fmt((conc[n - 1] as number) / (conc[0] as number), 1)} vezes mais).
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {e.ret ? `Como o poluente fica retido e só ${fmt(e.ef, 0)} % da massa ingerida vira massa do predador, a concentração sobe 1 ÷ ${fmt(ef, 2)} = ${fmt(fator, 1)} vezes a cada nível.` : 'Fator escolhido por você. Em geral, ele é maior quando a eficiência de transferência é menor.'}
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <Alternador
          rotulo="Tipo de pirâmide"
          valor={tipo}
          opcoes={[
            { id: 'energia', rotulo: 'Energia' },
            { id: 'biomassa', rotulo: 'Biomassa' },
            { id: 'numeros', rotulo: 'Números' },
          ]}
          onChange={(id) => atualizar({ tipo: id })}
        />
        {tipo !== 'energia' && <Seletor rotulo="Ambiente" valor={amb.id} opcoes={AMBIENTES_PIRAMIDE.map((a) => ({ id: a.id, rotulo: a.nome }))} onChange={(id) => atualizar({ amb: id })} />}
        <ControleDeslizante rotulo="Energia fixada pelos produtores" valor={e.pp} onChange={(v) => atualizar({ pp: v })} min={1000} max={20_000} passo={500} unidade="kJ/m²·ano" marcas={[1000, 10_000, 20_000]} />
        <ControleDeslizante rotulo="Eficiência de transferência entre níveis" valor={e.ef} onChange={(v) => atualizar({ ef: v })} min={5} max={25} passo={1} unidade="%" marcas={[5, 10, 25]} />
        <div className="grid gap-1">
          <span className="font-semibold">Níveis tróficos na cadeia</span>
          <SeletorNumerico rotulo="níveis tróficos" valor={n} onChange={(v) => atualizar({ n: v })} min={3} max={5} />
        </div>
        <ControleDeslizante rotulo="Poluente nos produtores" valor={e.c0} onChange={(v) => atualizar({ c0: v })} min={0.001} max={0.1} passo={0.001} unidade="mg/kg" marcas={[0.001, 0.05, 0.1]} />
        <PainelDeVisibilidade titulo="Fator de acúmulo" itens={[{ id: 'ret', rotulo: 'Poluente todo retido: fator = 1 ÷ eficiência', ativo: e.ret }]} onChange={(_, ativo) => atualizar({ ret: ativo })} />
        {!e.ret && <ControleDeslizante rotulo="Fator por nível" valor={e.fm} onChange={(v) => atualizar({ fm: v })} min={2} max={20} passo={1} marcas={[2, 10, 20]} />}
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

const ANOS_MAX = 50
const PPM_ATUAL = 420 // ordem de grandeza da concentração atual de CO₂ (ppm)
const PADRAO_CARBONO = { fossil: 9.5, solo: 1.2, refl: 0, anos: 0 }

function BarraDestino({ itens }: { itens: { rotulo: string; valor: number; cor: string }[] }) {
  const total = itens.reduce((s, i) => s + i.valor, 0) || 1
  return (
    <div className="grid gap-2">
      <div className="flex h-8 overflow-hidden rounded-lg border border-[var(--line)]" role="img" aria-label={`Destino do carbono emitido: ${itens.map((i) => `${i.rotulo} ${fmt(i.valor, 1)} GtC`).join('; ')}`}>
        {itens.map((i) => (
          <div key={i.rotulo} style={{ width: `${(i.valor / total) * 100}%`, background: i.cor, transition: 'width var(--dur-media)' }} />
        ))}
      </div>
      <ul className="m-0 grid list-none gap-1 p-0 text-sm">
        {itens.map((i) => (
          <li key={i.rotulo} className="num flex items-center gap-2">
            <span aria-hidden="true" className="inline-block size-3 rounded-sm" style={{ background: i.cor }} />
            {i.rotulo}: <strong>{fmt(i.valor, 1)} GtC/ano</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ExplorarCarbono() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_CARBONO)
  const b = balancoCarbono(e.fossil, e.solo, e.refl)
  const ppm = PPM_ATUAL + b.ppmPorAno * e.anos
  const liquidoAtm = Math.max(0, b.naAtmosfera)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <h3 className="m-0 text-base">Para onde vai o carbono emitido em um ano</h3>
          <BarraDestino
            itens={[
              { rotulo: 'Fica na atmosfera', valor: liquidoAtm, cor: 'var(--erro)' },
              { rotulo: 'Absorvido por oceanos e vegetação', valor: b.sumidourosNaturais, cor: 'var(--ok)' },
              { rotulo: 'Retirado por reflorestamento extra', valor: Math.min(e.refl, b.emissoes * FRACAO_ATMOSFERA), cor: 'var(--accent)' },
            ]}
          />
        </div>
        <Cartao vivo>
          <p className="m-0 text-lg">
            Emissões: <strong>{fmt(b.emissoes, 1)} GtC/ano</strong> · acúmulo na atmosfera: <strong>{fmt(b.naAtmosfera, 2)} GtC/ano</strong>
          </p>
          <p className="m-0">
            Isso eleva o CO₂ em cerca de <strong>{fmt(b.ppmPorAno, 2)} ppm por ano</strong>. Em {e.anos} ano{e.anos === 1 ? '' : 's'}, mantidas as taxas: <strong>{fmt(ppm, 0)} ppm</strong> (hoje, ≈ {PPM_ATUAL} ppm).
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            Modelo de ordem de grandeza: cerca de {fmt(FRACAO_ATMOSFERA * 100, 0)} % do CO₂ emitido permanece no ar (fração observada nos balanços globais recentes); 1 ppm ≈ 2,13 GtC. Os valores são arredondados e servem para comparar cenários.
          </p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Queima de combustíveis fósseis" valor={e.fossil} onChange={(v) => atualizar({ fossil: v })} min={0} max={14} passo={0.1} unidade="GtC/ano" marcas={[0, 9.5, 14]} />
        <ControleDeslizante rotulo="Desmatamento e uso da terra" valor={e.solo} onChange={(v) => atualizar({ solo: v })} min={0} max={3} passo={0.1} unidade="GtC/ano" marcas={[0, 1.2, 3]} />
        <ControleDeslizante rotulo="Reflorestamento extra (retirada de carbono)" valor={e.refl} onChange={(v) => atualizar({ refl: v })} min={0} max={3} passo={0.1} unidade="GtC/ano" marcas={[0, 1.5, 3]} />
        <ControleDeslizante rotulo="Anos à frente" valor={e.anos} onChange={(v) => atualizar({ anos: v })} min={0} max={ANOS_MAX} passo={1} marcas={[0, 25, 50]} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Experimente zerar o desmatamento ou aumentar o reflorestamento e compare com cortar a queima de fósseis. GtC = bilhão de toneladas de carbono.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

function TelaExplorar() {
  const [v, atualizar] = useEstadoUrl({ vista: 'piramide' })
  return (
    <div className="grid gap-4">
      <Alternador
        rotulo="O que explorar"
        valor={v.vista === 'carbono' ? 'carbono' : 'piramide'}
        opcoes={[
          { id: 'piramide', rotulo: 'Pirâmides e acúmulo' },
          { id: 'carbono', rotulo: 'Ciclo do carbono' },
        ]}
        onChange={(id) => atualizar({ vista: id })}
      />
      {v.vista === 'carbono' ? <ExplorarCarbono /> : <ExplorarPiramide />}
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: populações no tempo */

const T_LOG = 60
const PADRAO_LOG = { n0: 20, r: 0.2, k: 1000, tl: 0, exp: true }

function Logistico() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_LOG)
  const anim = useAnimacao(e.tl, T_LOG, (v) => atualizar({ tl: v }), 2)
  const t = Math.min(T_LOG, Math.max(0, e.tl))
  const n = logistico(e.n0, e.r, e.k, t)
  const taxa = taxaLogistica(e.r, n, e.k)
  const tMeio = Math.log((e.k - e.n0) / e.n0) / e.r
  const maxima = taxaMaximaLogistica(e.r, e.k)
  const ex = e.n0 * Math.exp(e.r * t)
  const yMax = e.k * 1.15
  const rampa = Math.max(t, 0.001)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <Cena janela={{ xmin: -T_LOG * 0.05, xmax: T_LOG, ymin: -yMax * 0.05, ymax: yMax }} passoX={10} passoY={bonito(yMax / 5)} rotulo="População em função do tempo: curva logística, capacidade de suporte e, opcionalmente, o crescimento exponencial" altura={260}>
          <Line.Segment point1={[0, e.k]} point2={[T_LOG, e.k]} color="var(--erro)" style="dashed" weight={1.5} />
          <Line.Segment point1={[0, e.k / 2]} point2={[Math.min(T_LOG, tMeio), e.k / 2]} color="var(--ink-muted)" style="dashed" weight={1.2} />
          {e.exp && <Plot.OfX y={(x) => e.n0 * Math.exp(e.r * x)} domain={[0, rampa]} color="var(--aviso)" weight={2.5} style="dashed" />}
          <Plot.OfX y={(x) => logistico(e.n0, e.r, e.k, x)} domain={[0, rampa]} color="var(--accent)" weight={3.5} />
          <Point x={t} y={n} color="var(--ink)" />
        </Cena>
        <p className="m-0 text-sm text-[var(--ink-muted)]">Eixo horizontal: tempo (anos). Eixo vertical: indivíduos. Linha vermelha tracejada: capacidade de suporte (K). Linha cinza: K/2.{e.exp && ' Laranja tracejado: crescimento exponencial, sem limites.'}</p>
        <Cena janela={{ xmin: -e.k * 0.04, xmax: e.k, ymin: -maxima * 0.12, ymax: maxima * 1.2 }} passoX={bonito(e.k / 4)} passoY={bonito(maxima / 4)} rotulo="Velocidade de crescimento em função do tamanho da população: uma parábola com máximo em K sobre 2" altura={200}>
          <Plot.OfX y={(x) => taxaLogistica(e.r, x, e.k)} domain={[0, e.k]} color="var(--accent)" weight={3} />
          <Line.Segment point1={[e.k / 2, 0]} point2={[e.k / 2, maxima]} color="var(--ink-muted)" style="dashed" weight={1.2} />
          <Point x={n} y={taxa} color="var(--ink)" />
        </Cena>
        <p className="m-0 text-sm text-[var(--ink-muted)]">Eixo horizontal: tamanho N. Eixo vertical: velocidade dN/dt. O ponto preto é a situação do instante atual: a velocidade é máxima quando N = K/2.</p>
        <Cartao vivo>
          <p className="m-0 text-lg">
            t = <strong>{fmt(t, 1)}</strong> anos · N = <strong>{fmt(n, 0)}</strong> · dN/dt = <strong>{fmt(taxa, 1)}</strong> indivíduos/ano
          </p>
          <p className="m-0">
            N = K/2 = {fmt(e.k / 2, 0)} em t ≈ {fmt(tMeio, 1)} anos. Velocidade máxima: r·K/4 = <strong>{fmt(maxima, 1)}</strong> indivíduos/ano.
          </p>
          {e.exp && (
            <p className="m-0 text-sm text-[var(--ink-muted)]">
              Sem resistência ambiental, N seria {fmt(ex, 0)}{ex > e.k ? ' (já passou de K)' : ''}.
            </p>
          )}
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(0.5)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        <ControleDeslizante rotulo="Tempo" valor={t} onChange={(v) => atualizar({ tl: v })} min={0} max={T_LOG} passo={0.5} unidade="anos" marcas={[0, 30, 60]} />
        <ControleDeslizante rotulo="População inicial (N₀)" valor={e.n0} onChange={(v) => atualizar({ n0: v })} min={5} max={200} passo={5} marcas={[5, 100, 200]} />
        <ControleDeslizante rotulo="Taxa de crescimento (r)" valor={e.r} onChange={(v) => atualizar({ r: v })} min={0.05} max={0.5} passo={0.01} unidade="por ano" marcas={[0.05, 0.25, 0.5]} />
        <ControleDeslizante rotulo="Capacidade de suporte (K)" valor={e.k} onChange={(v) => atualizar({ k: v })} min={200} max={2000} passo={50} marcas={[200, 1000, 2000]} />
        <PainelDeVisibilidade itens={[{ id: 'exp', rotulo: 'Comparar com o crescimento exponencial', ativo: e.exp }]} onChange={(_, ativo) => atualizar({ exp: ativo })} />
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

const T_LV = 45
const PADRAO_LV = { x0: 40, y0: 10, al: 1, ga: 0.5, tp: 0 }

function PresaPredador() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_LV)
  const anim = useAnimacao(e.tp, T_LV, (v) => atualizar({ tp: v }), 3)
  const params = useMemo(() => ({ ...PARAMETROS_LV, alfa: e.al, gama: e.ga }), [e.al, e.ga])
  const tr = useMemo(() => trajetoriaLV(e.x0, e.y0, params, T_LV), [e.x0, e.y0, params])
  const eq = equilibrioLV(params)
  const t = Math.min(T_LV, Math.max(0, e.tp))
  const agora = pontoEm(tr, t)
  const ate = tr.filter((p) => p.t <= t)
  const comAtual = [...ate, agora]
  const yMax = Math.max(...tr.map((p) => Math.max(p.presas, p.predadores))) * 1.1
  const xs = tr.map((p) => p.presas)
  const ys = tr.map((p) => p.predadores)
  const xMax = Math.max(...xs) * 1.1
  const yMaxFase = Math.max(...ys) * 1.1
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <div className="grid content-start gap-3">
        <Cena janela={{ xmin: -T_LV * 0.05, xmax: T_LV, ymin: -yMax * 0.05, ymax: yMax }} passoX={10} passoY={bonito(yMax / 5)} rotulo="Presas e predadores em função do tempo" altura={240}>
          <Line.Segment point1={[0, eq.presas]} point2={[T_LV, eq.presas]} color="var(--accent)" style="dashed" weight={1} opacity={0.5} />
          <Line.Segment point1={[0, eq.predadores]} point2={[T_LV, eq.predadores]} color="var(--erro)" style="dashed" weight={1} opacity={0.5} />
          <Polyline points={comAtual.map((p) => [p.t, p.presas] as [number, number])} color="var(--accent)" weight={3.5} />
          <Polyline points={comAtual.map((p) => [p.t, p.predadores] as [number, number])} color="var(--erro)" weight={3} />
          <Point x={t} y={agora.presas} color="var(--accent)" />
          <Point x={t} y={agora.predadores} color="var(--erro)" />
        </Cena>
        <p className="m-0 text-sm text-[var(--ink-muted)]">Linha verde e grossa: presas. Linha vermelha e mais fina: predadores. Tracejado: valores de equilíbrio. Eixo horizontal: tempo; vertical: indivíduos.</p>
        <Cena janela={{ xmin: -xMax * 0.05, xmax: xMax, ymin: -yMaxFase * 0.05, ymax: yMaxFase }} passoX={bonito(xMax / 5)} passoY={bonito(yMaxFase / 5)} rotulo="Plano de fase: predadores em função das presas; a trajetória é uma volta fechada em torno do ponto de equilíbrio" altura={240}>
          <Polyline points={comAtual.map((p) => [p.presas, p.predadores] as [number, number])} color="var(--ink-muted)" weight={2.5} />
          <Point x={eq.presas} y={eq.predadores} color="var(--ok)" />
          <Point x={agora.presas} y={agora.predadores} color="var(--ink)" />
        </Cena>
        <p className="m-0 text-sm text-[var(--ink-muted)]">Eixo horizontal: presas. Eixo vertical: predadores. O ponto verde é o equilíbrio; o preto, o instante atual. A trajetória gira em volta do equilíbrio.</p>
        <Cartao vivo>
          <p className="m-0 text-lg">
            t = <strong>{fmt(t, 1)}</strong> · presas = <strong>{fmt(agora.presas, 0)}</strong> · predadores = <strong>{fmt(agora.predadores, 0)}</strong>
          </p>
          <p className="m-0">
            Equilíbrio: presas = γ/δ = <strong>{fmt(eq.presas, 1)}</strong>, predadores = α/β = <strong>{fmt(eq.predadores, 1)}</strong>.
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Repare: aumentar o crescimento das presas (α) eleva o equilíbrio dos predadores, e não o das presas; já a mortalidade dos predadores (γ) define o equilíbrio das presas. Modelo simplificado de Lotka-Volterra, com β = 0,1 e δ = 0,02 fixos.</p>
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <ControlesDeTempo rodando={anim.rodando} onAlternar={anim.alternar} onPasso={() => anim.passo(0.25)} velocidade={anim.velocidade} onVelocidade={anim.setVelocidade} />
        <ControleDeslizante rotulo="Tempo" valor={t} onChange={(v) => atualizar({ tp: v })} min={0} max={T_LV} passo={0.25} marcas={[0, 22.5, 45]} />
        <ControleDeslizante rotulo="Presas no início" valor={e.x0} onChange={(v) => atualizar({ x0: v })} min={10} max={60} passo={1} marcas={[10, 35, 60]} />
        <ControleDeslizante rotulo="Predadores no início" valor={e.y0} onChange={(v) => atualizar({ y0: v })} min={2} max={30} passo={1} marcas={[2, 16, 30]} />
        <ControleDeslizante rotulo="Crescimento das presas (α)" valor={e.al} onChange={(v) => atualizar({ al: v })} min={0.5} max={1.5} passo={0.05} marcas={[0.5, 1, 1.5]} />
        <ControleDeslizante rotulo="Mortalidade dos predadores (γ)" valor={e.ga} onChange={(v) => atualizar({ ga: v })} min={0.2} max={1} passo={0.05} marcas={[0.2, 0.5, 1]} />
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

function TelaPopulacoes() {
  const [v, atualizar] = useEstadoUrl({ pop: 'logistico' })
  return (
    <div className="grid gap-4">
      <Alternador
        rotulo="Modelo"
        valor={v.pop === 'presapredador' ? 'presapredador' : 'logistico'}
        opcoes={[
          { id: 'logistico', rotulo: 'Crescimento de uma população' },
          { id: 'presapredador', rotulo: 'Presa e predador' },
        ]}
        onChange={(id) => atualizar({ pop: id })}
      />
      {v.pop === 'presapredador' ? <PresaPredador /> : <Logistico />}
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaTeia /> },
        { id: 'explorar', conteudo: <TelaExplorar /> },
        { id: 'lab', conteudo: <TelaPopulacoes /> },
      ]}
      desafios={DEFINICOES_ECOLOGIA}
    />
  )
}
