import { CIDADES, CLIMAS, NOTA_DADOS } from '@/conteudo/geografia/climogramas'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { Alternador, Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import { MESES, MESES_CURTOS, NOME_ESTACAO, amplitude, cidade, estacaoExtrema, gerarSintetico, hemisferioPelaTemperatura, maisParecida, mediaAnual, mesMaisChuvoso, mesMaisFrio, mesMaisQuente, mesesSecos, totalAnual, type Hemisferio } from './calculo'
import { DEFINICOES_CLIMOGRAMAS } from './definicoes'
import { Climograma, Indicadores, TabelaMeses } from './Visuais'

const fmt = (n: number, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
const OPCOES_CIDADE = CIDADES.map((c) => ({ id: c.id, rotulo: `${c.nome} (${c.pais})` }))

/* ------------------------------------------------------------------ Introdução: leia uma cidade */

const PADRAO_LEITURA = { cid: 'brasilia', mes: -1, secos: true }

function TelaLeitura() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_LEITURA)
  const c = cidade(CIDADES.some((x) => x.id === e.cid) ? e.cid : 'brasilia')
  const mes = e.mes >= 0 && e.mes < 12 ? Math.floor(e.mes) : null
  const secos = mesesSecos(c)
  const h = hemisferioPelaTemperatura(c)
  const info = CLIMAS[c.clima]
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <Climograma dados={c} nome={`${c.nome}, ${c.pais}`} mesSel={mes} marcarSecos={e.secos} />
        <div role="group" aria-label="Escolher um mês" className="flex flex-wrap gap-1">
          {MESES_CURTOS.map((m, i) => (
            <button key={m} type="button" className={`btn num ${mes === i ? 'btn-primario' : ''}`} aria-pressed={mes === i} onClick={() => atualizar({ mes: mes === i ? -1 : i })}>
              {m}
            </button>
          ))}
        </div>
        <Cartao vivo>
          {mes === null ? (
            <p className="m-0">Escolha um mês para ver os valores. Meses secos têm contorno vermelho (chuva menor que o dobro da temperatura).</p>
          ) : (
            <p className="m-0">
              <strong>{MESES[mes]}</strong>: {fmt(c.temp[mes] as number)} °C e {fmt(c.chuva[mes] as number, 0)} mm. Dobro da temperatura: {fmt(2 * (c.temp[mes] as number))}. {secos.includes(mes) ? 'Chuva menor: mês seco.' : 'Chuva igual ou maior: não é seco.'}
            </p>
          )}
        </Cartao>
        <TabelaMeses dados={c} destacarSecos />
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Cidade" valor={c.id} opcoes={OPCOES_CIDADE} onChange={(v) => atualizar({ cid: v, mes: -1 })} />
        <Cartao vivo>
          <p className="m-0 text-lg font-semibold">{info.nome}</p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">{info.onde}</p>
          <p className="m-0">{info.assinatura}.</p>
        </Cartao>
        <Indicadores dados={c} />
        <Cartao>
          <p className="m-0 text-sm">
            Mês mais quente: <strong>{MESES[mesMaisQuente(c)]}</strong> {h ? `(indica o Hemisfério ${h === 'S' ? 'Sul' : 'Norte'})` : '(a amplitude é pequena ou a época é ambígua: não dá para concluir o hemisfério pela temperatura)'}. Mês mais frio: <strong>{MESES[mesMaisFrio(c)]}</strong>. Mês mais chuvoso: <strong>{MESES[mesMaisChuvoso(c)]}</strong>.
          </p>
        </Cartao>
        <PainelDeVisibilidade itens={[{ id: 'secos', rotulo: 'Contorno nos meses secos', ativo: e.secos }]} onChange={(id, ativo) => atualizar({ [id]: ativo })} />
        <p className="m-0 text-xs text-[var(--ink-muted)]">{NOTA_DADOS}</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: compare duas cidades */

const PADRAO_COMPARAR = { a: 'manaus', b: 'moscou' }

function TelaComparar() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_COMPARAR)
  const a = cidade(CIDADES.some((x) => x.id === e.a) ? e.a : 'manaus')
  const b = cidade(CIDADES.some((x) => x.id === e.b) ? e.b : 'moscou')
  const linha = (nome: string, va: number, vb: number, un: string, casas = 1) => {
    const d = vb - va
    return { nome, va, vb, un, casas, texto: Math.abs(d) < 1e-9 ? 'iguais' : `${d > 0 ? b.nome : a.nome} é maior em ${fmt(Math.abs(d), casas)} ${un}` }
  }
  const linhas = [
    linha('Temperatura média', mediaAnual(a), mediaAnual(b), '°C'),
    linha('Amplitude térmica', amplitude(a), amplitude(b), '°C'),
    linha('Chuva por ano', totalAnual(a), totalAnual(b), 'mm', 0),
    linha('Meses secos', mesesSecos(a).length, mesesSecos(b).length, 'meses', 0),
  ]
  const sec = (c: typeof a) => {
    const h = hemisferioPelaTemperatura(c)
    if (!h) return '—'
    const r = estacaoExtrema(c, h, 'seca')
    return r.folga >= 1.3 ? NOME_ESTACAO[r.estacao] : 'sem estação seca nítida'
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="grid content-start gap-3">
        {[a, b].map((c, i) => (
          <div key={i} className="grid gap-1">
            <Climograma dados={c} nome={`${c.nome}, ${c.pais}: ${CLIMAS[c.clima].nome}`} />
          </div>
        ))}
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Cidade A" valor={a.id} opcoes={OPCOES_CIDADE} onChange={(v) => atualizar({ a: v })} />
        <Seletor rotulo="Cidade B" valor={b.id} opcoes={OPCOES_CIDADE} onChange={(v) => atualizar({ b: v })} />
        <div className="cartao overflow-x-auto p-3">
          <table className="num w-full border-collapse text-sm">
            <caption className="mb-1 text-left font-semibold text-[var(--ink-muted)]">Comparação</caption>
            <thead>
              <tr className="border-b border-[var(--line-strong)] text-left">
                <th scope="col" className="py-1 pr-2" />
                <th scope="col" className="px-1">{a.nome}</th>
                <th scope="col" className="px-1">{b.nome}</th>
              </tr>
            </thead>
            <tbody aria-live="polite">
              {linhas.map((l) => (
                <tr key={l.nome} className="border-b border-[var(--line)] align-top">
                  <th scope="row" className="py-1 pr-2 text-left font-normal">{l.nome}</th>
                  <td className="px-1">{fmt(l.va, l.casas)} {l.un}</td>
                  <td className="px-1">{fmt(l.vb, l.casas)} {l.un}</td>
                </tr>
              ))}
              <tr className="border-b border-[var(--line)]">
                <th scope="row" className="py-1 pr-2 text-left font-normal">Estação mais seca</th>
                <td className="px-1">{sec(a)}</td>
                <td className="px-1">{sec(b)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="m-0 grid gap-1 pl-5 text-sm">
          {linhas.map((l) => (
            <li key={l.nome}>
              <strong>{l.nome}:</strong> {l.texto}.
            </li>
          ))}
        </ul>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: monte seu climograma */

const PADRAO_MONTAR = { media: 24, amp: 4, hem: 'S', total: 1500, conc: 0.7, verao: true }

function TelaMontar() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_MONTAR)
  const hem: Hemisferio = e.hem === 'N' ? 'N' : 'S'
  const dados = gerarSintetico({ media: e.media, amp: e.amp, hem, total: e.total, conc: e.conc, chuvaNoVerao: e.verao })
  const parecida = maisParecida(dados)
  const secos = mesesSecos(dados)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="grid content-start gap-3">
        <Climograma dados={dados} nome="Climograma montado por você" marcarSecos />
        <Indicadores dados={dados} />
        <Cartao vivo>
          <p className="m-0">
            O mais parecido entre os dez modelos é <strong>{parecida.nome}</strong> ({CLIMAS[parecida.clima].nome}).
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">
            {secos.length ? `Meses secos: ${secos.map((i) => MESES[i]).join(', ')}.` : 'Nenhum mês seco.'} A comparação usa temperatura média, amplitude, chuva por ano e meses secos. Os dados reais variam mais do que esta curva suave.
          </p>
        </Cartao>
        <TabelaMeses dados={dados} destacarSecos />
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Temperatura média anual" valor={e.media} onChange={(v) => atualizar({ media: v })} min={0} max={30} passo={1} unidade="°C" marcas={[0, 15, 30]} />
        <ControleDeslizante rotulo="Amplitude térmica anual" valor={e.amp} onChange={(v) => atualizar({ amp: v })} min={0} max={30} passo={1} unidade="°C" marcas={[0, 15, 30]} />
        <ControleDeslizante rotulo="Chuva por ano" valor={e.total} onChange={(v) => atualizar({ total: v })} min={100} max={3000} passo={100} unidade="mm" marcas={[100, 1500, 3000]} />
        <ControleDeslizante rotulo="Concentração da chuva" valor={e.conc} onChange={(v) => atualizar({ conc: v })} min={0} max={1} passo={0.1} marcas={[0, 0.5, 1]} descricao="0 = chuva igual todos os meses; 1 = muito concentrada na estação chuvosa" />
        <Alternador
          rotulo="Hemisfério"
          valor={hem}
          opcoes={[
            { id: 'S', rotulo: 'Sul' },
            { id: 'N', rotulo: 'Norte' },
          ]}
          onChange={(v) => atualizar({ hem: v })}
        />
        <Alternador
          rotulo="Estação mais chuvosa"
          valor={e.verao ? 'verao' : 'inverno'}
          opcoes={[
            { id: 'verao', rotulo: 'Verão' },
            { id: 'inverno', rotulo: 'Inverno' },
          ]}
          onChange={(v) => atualizar({ verao: v === 'verao' })}
        />
        <p className="m-0 text-sm text-[var(--ink-muted)]">Experimente: temperatura média 27 °C, amplitude 2 °C e chuva 2.300 mm fazem um climograma equatorial. Com 550 mm, chuva concentrada e média 26 °C, aparece o semiárido. Com amplitude 25 °C e média 6 °C, o continental.</p>
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
        { id: 'explorar', conteudo: <TelaComparar /> },
        { id: 'lab', conteudo: <TelaMontar /> },
      ]}
      desafios={DEFINICOES_CLIMOGRAMAS}
    />
  )
}
