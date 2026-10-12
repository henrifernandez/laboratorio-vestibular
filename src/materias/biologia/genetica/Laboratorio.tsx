import { useMemo } from 'react'
import { criarRng } from '@/lib/rng'
import { useEstadoUrl } from '@/lib/useEstadoUrl'
import { ControleDeslizante } from '@/sim/ControleDeslizante'
import { Alternador, Cartao, Rodape, Seletor } from '@/sim/ComunsLab'
import { LaboratorioTelas } from '@/sim/LaboratorioTelas'
import { PainelDeVisibilidade } from '@/sim/PainelDeVisibilidade'
import {
  GENOTIPOS_ABO,
  TIPOS_ABO,
  aglutinogenios,
  aglutininas,
  autocruzamentoLigado,
  cruzar,
  distribuicaoFenotipos,
  doadoresCompativeis,
  emEquilibrio,
  freqAlelicaDeContagens,
  gametasLigados,
  hardyWeinberg,
  hardyWeinbergX,
  prole,
  razao,
  rotuloSangue,
  valor,
  fracao,
  type Dominancia,
  type Fracao,
  type TipoABO,
  type TipoSangue,
} from './calculo'
import { DEFINICOES_GENETICA } from './definicoes'
import { notacaoABO } from './geradores'
import { reconstruir, violacao } from './geradoresHeredograma'
import { ESTRUTURAS, MODELOS, NOME_MODELO, analisar, compativel, ehLigadoAoX, rotuloGenotipo, simular, type Modelo } from './heredograma'
import { sortearProle } from './simulacao'
import { BarrasClasses, CromossomosSvg, HeredogramaSvg, MatrizTransfusao, QuadroPunnett, legendaHeredograma, rotuloClasse } from './Visuais'

const fmt = (n: number, c = 2) => n.toLocaleString('pt-BR', { maximumFractionDigits: c })
/** Porcentagem de uma classe numa distribuição (0 se a classe não existe). */
const pctDe = (m: Map<string, Fracao>, k: string) => valor(m.get(k) ?? fracao(0)) * 100
const lista = (itens: string[]) => (itens.length <= 1 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`)

/* ------------------------------------------------------------------ Introdução: um gene e o quadro de Punnett */

const GENOTIPOS1 = ['AA', 'Aa', 'aa']
const PADRAO_PUNNETT = { pai: 'Aa', mae: 'Aa', dom: 'completa', n: 100, sem: 1 }

function TelaPunnett() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_PUNNETT)
  const pai = GENOTIPOS1.includes(e.pai) ? e.pai : 'Aa'
  const mae = GENOTIPOS1.includes(e.mae) ? e.mae : 'Aa'
  const modo: Dominancia = e.dom === 'incompleta' ? 'incompleta' : 'completa'
  const geno = cruzar(pai, mae)
  const fen = distribuicaoFenotipos(pai, mae, modo)
  const obs = useMemo(() => sortearProle(pai, mae, e.n, e.sem), [pai, mae, e.n, e.sem])
  const classesFen = [...fen].map(([k, p]) => ({ rotulo: rotuloClasse(k, pai, modo), valor: valor(p) * 100 }))
  const maiorDesvio = Math.max(...[...geno].map(([g, p]) => Math.abs(((obs.get(g) ?? 0) / e.n) * 100 - valor(p) * 100)))
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <QuadroPunnett pai={pai} mae={mae} modo={modo} />
          <p className="num m-0 text-lg" aria-live="polite">
            Razão fenotípica: <strong>{razao(fen).join(' : ')}</strong> · razão genotípica: <strong>{razao(geno).join(' : ')}</strong>
          </p>
        </div>
        <div className="cartao grid gap-3 p-3">
          <BarrasClasses titulo="Genótipos esperados" itens={[...geno].map(([g, p]) => ({ rotulo: g, valor: valor(p) * 100 }))} />
          <BarrasClasses titulo="Fenótipos esperados" itens={classesFen} />
        </div>
        <div className="cartao grid gap-2 p-3">
          <BarrasClasses
            titulo={`Sorteio de ${e.n} descendentes (a marca preta é o valor esperado)`}
            itens={[...geno].map(([g, p]) => ({ rotulo: g, valor: ((obs.get(g) ?? 0) / e.n) * 100, esperado: valor(p) * 100, cor: 'var(--aviso)' }))}
          />
          <p className="num m-0" aria-live="polite">
            {[...geno].map(([g]) => `${g}: ${obs.get(g) ?? 0}`).join(' · ')} · maior desvio do esperado: <strong>{fmt(maiorDesvio, 1)} pontos percentuais</strong>
          </p>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Com poucos descendentes, o acaso afasta o resultado do esperado; com muitos, ele se aproxima. As proporções de Mendel são probabilidades, e não garantias para cada família.</p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Genótipo do pai" valor={pai} opcoes={GENOTIPOS1.map((g) => ({ id: g, rotulo: g }))} onChange={(g) => atualizar({ pai: g })} />
        <Seletor rotulo="Genótipo da mãe" valor={mae} opcoes={GENOTIPOS1.map((g) => ({ id: g, rotulo: g }))} onChange={(g) => atualizar({ mae: g })} />
        <Alternador
          rotulo="Dominância"
          valor={modo}
          opcoes={[
            { id: 'completa', rotulo: 'Completa' },
            { id: 'incompleta', rotulo: 'Incompleta' },
          ]}
          onChange={(id) => atualizar({ dom: id })}
        />
        <ControleDeslizante rotulo="Descendentes sorteados" valor={e.n} onChange={(v) => atualizar({ n: v })} min={10} max={2000} passo={10} marcas={[10, 1000, 2000]} />
        <button type="button" className="btn" onClick={() => atualizar({ sem: e.sem + 1 })}>
          Sortear de novo
        </button>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Explorar: dois genes, ABO e Hardy-Weinberg */

const GENOTIPOS2 = ['AaBb', 'AABb', 'AaBB', 'Aabb', 'aaBb', 'aabb', 'AABB']
const PADRAO_DOIS = { pai: 'AaBb', mae: 'AaBb', lig: false, r: 0.2, arr: 'cis' }

function ExplorarDois() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_DOIS)
  const pai = GENOTIPOS2.includes(e.pai) ? e.pai : 'AaBb'
  const mae = GENOTIPOS2.includes(e.mae) ? e.mae : 'AaBb'
  const arr = e.arr === 'trans' ? 'trans' : 'cis'
  const independente = distribuicaoFenotipos('AaBb', 'AaBb')
  const esperado = (k: string) => pctDe(independente, k)
  if (e.lig) {
    const lig = autocruzamentoLigado(e.r, arr)
    const g = gametasLigados(e.r, arr)
    const classes: [string, string][] = [
      ['A_B_', 'dominante,dominante'],
      ['A_bb', 'dominante,recessivo'],
      ['aaB_', 'recessivo,dominante'],
      ['aabb', 'recessivo,recessivo'],
    ]
    return (
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="grid content-start gap-3">
          <div className="cartao grid gap-3 p-3">
            <CromossomosSvg arranjo={arr} distancia={e.r * 100} />
            <BarrasClasses titulo="Gametas do duplo-heterozigoto" itens={[...g.freq].map(([n, fr]) => ({ rotulo: `${n}${g.parentais.includes(n) ? ' (parental)' : ' (recomb.)'}`, valor: fr * 100, cor: g.parentais.includes(n) ? 'var(--accent)' : 'var(--aviso)' }))} max={50} />
          </div>
          <div className="cartao grid gap-2 p-3">
            <BarrasClasses titulo="Fenótipos de AaBb × AaBb (marca preta: valor com genes independentes)" itens={classes.map(([nome, k]) => ({ rotulo: nome, valor: (lig.get(nome) as number) * 100, esperado: esperado(k) }))} max={70} />
            <p className="num m-0" aria-live="polite">
              {e.r >= 0.5 - 1e-9 ? 'Com 50 % de recombinação os genes se comportam como independentes: 9 : 3 : 3 : 1.' : `Genes ligados a ${fmt(e.r * 100, 0)} cM: mais descendentes com as combinações parentais (${arr === 'cis' ? 'A_B_ e aabb' : 'A_bb e aaB_'}) do que o esperado para genes independentes.`}
            </p>
          </div>
        </div>
        <div className="grid content-start gap-4">
          <PainelDeVisibilidade titulo="Genes" itens={[{ id: 'lig', rotulo: 'Genes ligados (mesmo cromossomo)', ativo: true }]} onChange={(_, ativo) => atualizar({ lig: ativo })} />
          <ControleDeslizante rotulo="Taxa de recombinação (distância)" valor={e.r} onChange={(v) => atualizar({ r: v })} min={0} max={0.5} passo={0.01} marcas={[0, 0.25, 0.5]} />
          <Alternador
            rotulo="Disposição dos alelos"
            valor={arr}
            opcoes={[
              { id: 'cis', rotulo: 'Cis (AB / ab)' },
              { id: 'trans', rotulo: 'Trans (Ab / aB)' },
            ]}
            onChange={(id) => atualizar({ arr: id })}
          />
          <p className="m-0 text-sm text-[var(--ink-muted)]">A taxa de recombinação vai de 0 (nunca há crossing-over entre os genes) a 0,5 (50 %: como se estivessem em cromossomos diferentes). A distância em cM é a taxa em %.</p>
          <Rodape onReiniciar={reiniciar} />
        </div>
      </div>
    )
  }
  const fen = distribuicaoFenotipos(pai, mae)
  const nomes: [string, string][] = [
    ['A_B_', 'dominante,dominante'],
    ['A_bb', 'dominante,recessivo'],
    ['aaB_', 'recessivo,dominante'],
    ['aabb', 'recessivo,recessivo'],
  ]
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <QuadroPunnett pai={pai} mae={mae} />
          <p className="num m-0 text-lg" aria-live="polite">
            Razão fenotípica: <strong>{razao(fen).join(' : ')}</strong> · {[...cruzar(pai, mae)].length} genótipos diferentes
          </p>
        </div>
        <div className="cartao grid gap-2 p-3">
          <BarrasClasses titulo="Fenótipos esperados" itens={nomes.filter(([, k]) => fen.has(k)).map(([nome, k]) => ({ rotulo: nome, valor: pctDe(fen, k) }))} />
          <p className="m-0 text-sm text-[var(--ink-muted)]">Cada gene é calculado separadamente e as probabilidades se multiplicam: genes em cromossomos diferentes segregam de modo independente.</p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Genótipo do pai" valor={pai} opcoes={GENOTIPOS2.map((g) => ({ id: g, rotulo: g }))} onChange={(g) => atualizar({ pai: g })} />
        <Seletor rotulo="Genótipo da mãe" valor={mae} opcoes={GENOTIPOS2.map((g) => ({ id: g, rotulo: g }))} onChange={(g) => atualizar({ mae: g })} />
        <PainelDeVisibilidade titulo="Genes" itens={[{ id: 'lig', rotulo: 'Genes ligados (mesmo cromossomo)', ativo: false }]} onChange={(_, ativo) => atualizar({ lig: ativo, pai: 'AaBb', mae: 'AaBb' })} />
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

const GENOS_ABO = ['AA', 'AO', 'BB', 'BO', 'AB', 'OO']
const RECEPTORES = TIPOS_ABO.flatMap((abo) => (['+', '-'] as const).map((rh) => ({ abo, rh })))
const PADRAO_SANGUE = { pa: 'AO', ma: 'BO', pr: 'Dd', mr: 'dd', rec: 'AB+' }
const tipoSangue = (txt: string): TipoSangue => ({ abo: txt.replace(/[+-]/g, '') as TipoABO, rh: txt.endsWith('+') ? '+' : '-' })
const rotuloGenoABO = (g: string) => {
  const t = GENOTIPOS_ABO.A.includes(g) ? 'A' : GENOTIPOS_ABO.B.includes(g) ? 'B' : g === 'AB' ? 'AB' : 'O'
  return `${notacaoABO(g)} (tipo ${t})`
}

function ExplorarSangue() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_SANGUE)
  const pa = GENOS_ABO.includes(e.pa) ? e.pa : 'AO'
  const ma = GENOS_ABO.includes(e.ma) ? e.ma : 'BO'
  const pr = ['DD', 'Dd', 'dd'].includes(e.pr) ? e.pr : 'Dd'
  const mr = ['DD', 'Dd', 'dd'].includes(e.mr) ? e.mr : 'dd'
  const rec = RECEPTORES.map((r) => `${r.abo}${r.rh}`).includes(e.rec) ? e.rec : 'AB+'
  const filhos = prole(pa, ma)
  const rh = cruzar(pr, mr)
  const rhMais = [...rh].filter(([g]) => g.includes('D')).reduce((s, [, p]) => s + valor(p), 0)
  const risco = mr === 'dd' && rhMais > 0
  const receptor = tipoSangue(rec)
  const doadores = doadoresCompativeis(receptor)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-3 p-3">
          <BarrasClasses titulo="Grupo ABO dos filhos" itens={TIPOS_ABO.map((t) => ({ rotulo: `Tipo ${t}`, valor: valor(filhos.get(t) ?? { n: 0, d: 1 }) * 100 }))} />
          <p className="num m-0" aria-live="polite">
            Fator Rh: <strong>{fmt(rhMais * 100, 0)} %</strong> dos filhos Rh+ e {fmt((1 - rhMais) * 100, 0)} % Rh−.
          </p>
          <p className="m-0" aria-live="polite">
            {risco ? (
              <>
                <strong>Risco de eritroblastose fetal:</strong> a mãe é Rh− e os filhos podem ser Rh+ ({fmt(rhMais * 100, 0)} %). Depois da sensibilização, os anticorpos anti-Rh podem atacar um filho Rh+ nas gestações seguintes.
              </>
            ) : (
              <>Sem risco de eritroblastose neste casal: {mr === 'dd' ? 'todos os filhos são Rh−, como a mãe.' : 'a mãe é Rh+ e não produz anticorpos anti-Rh.'}</>
            )}
          </p>
        </div>
        <div className="grid gap-2">
          <MatrizTransfusao receptor={receptor} />
          <p className="num m-0 text-center" aria-live="polite">
            {rotuloSangue(receptor)} pode receber de: <strong>{lista(doadores.map(rotuloSangue))}</strong>
          </p>
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">
            Plasma de {rotuloSangue(receptor)}: {aglutininas(receptor.abo).length ? aglutininas(receptor.abo).map((x) => `anti-${x}`).join(' e ') : 'sem aglutininas'}. Hemácias com {aglutinogenios(receptor.abo).length ? aglutinogenios(receptor.abo).join(' e ') : 'nenhum aglutinogênio'}.
          </p>
        </div>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Genótipo ABO do pai" valor={pa} opcoes={GENOS_ABO.map((g) => ({ id: g, rotulo: rotuloGenoABO(g) }))} onChange={(g) => atualizar({ pa: g })} />
        <Seletor rotulo="Genótipo ABO da mãe" valor={ma} opcoes={GENOS_ABO.map((g) => ({ id: g, rotulo: rotuloGenoABO(g) }))} onChange={(g) => atualizar({ ma: g })} />
        <Seletor rotulo="Genótipo Rh do pai" valor={pr} opcoes={[{ id: 'DD', rotulo: 'DD (Rh+)' }, { id: 'Dd', rotulo: 'Dd (Rh+)' }, { id: 'dd', rotulo: 'dd (Rh−)' }]} onChange={(g) => atualizar({ pr: g })} />
        <Seletor rotulo="Genótipo Rh da mãe" valor={mr} opcoes={[{ id: 'DD', rotulo: 'DD (Rh+)' }, { id: 'Dd', rotulo: 'Dd (Rh+)' }, { id: 'dd', rotulo: 'dd (Rh−)' }]} onChange={(g) => atualizar({ mr: g })} />
        <Seletor rotulo="Receptor de transfusão" valor={rec} opcoes={RECEPTORES.map((r) => ({ id: `${r.abo}${r.rh}`, rotulo: rotuloSangue(r) }))} onChange={(g) => atualizar({ rec: g })} />
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

const PADRAO_HARDY = { aa0: 64, ab0: 32, bb0: 4, x: false }
const PRESETS_HARDY: { rotulo: string; v: [number, number, number] }[] = [
  { rotulo: 'Em equilíbrio (64 / 32 / 4)', v: [64, 32, 4] },
  { rotulo: 'Só heterozigotos (0 / 100 / 0)', v: [0, 100, 0] },
  { rotulo: 'Sem heterozigotos (50 / 0 / 50)', v: [50, 0, 50] },
]

function ExplorarHardy() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_HARDY)
  const total = e.aa0 + e.ab0 + e.bb0
  if (total === 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Cartao vivo>
          <p className="m-0">Defina pelo menos um indivíduo para calcular as frequências.</p>
        </Cartao>
        <div className="grid content-start gap-4">
          <button type="button" className="btn" onClick={() => atualizar({ aa0: 64, ab0: 32, bb0: 4 })}>
            Voltar ao exemplo em equilíbrio
          </button>
        </div>
      </div>
    )
  }
  const { p, q } = freqAlelicaDeContagens(e.aa0, e.ab0, e.bb0)
  const obs = { AA: (e.aa0 / total) * 100, Aa: (e.ab0 / total) * 100, aa: (e.bb0 / total) * 100 }
  const esp = hardyWeinberg(q)
  const equilibrio = emEquilibrio(e.aa0, e.ab0, e.bb0, 0.005)
  const x = hardyWeinbergX(q)
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-3 p-3">
          <BarrasClasses
            titulo="Geração atual (barras) e esperado após cruzamentos ao acaso (marca preta)"
            itens={[
              { rotulo: 'AA', valor: obs.AA, esperado: esp.AA * 100 },
              { rotulo: 'Aa', valor: obs.Aa, esperado: esp.Aa * 100, cor: 'var(--aviso)' },
              { rotulo: 'aa', valor: obs.aa, esperado: esp.aa * 100, cor: 'var(--erro)' },
            ]}
          />
          <p className="num m-0 text-lg" aria-live="polite">
            p = <strong>{fmt(p, 3)}</strong> (A) · q = <strong>{fmt(q, 3)}</strong> (a)
          </p>
          <p className="m-0" aria-live="polite">
            {equilibrio ? (
              <>
                <strong>Em equilíbrio de Hardy-Weinberg:</strong> as frequências observadas coincidem com p², 2pq e q².
              </>
            ) : (
              <>
                <strong>Fora do equilíbrio.</strong> Depois de uma geração de cruzamentos ao acaso, as frequências genotípicas passam a p² = {fmt(esp.AA * 100, 1)} %, 2pq = {fmt(esp.Aa * 100, 1)} % e q² = {fmt(esp.aa * 100, 1)} %, e as frequências dos alelos (p e q) não mudam.
              </>
            )}
          </p>
        </div>
        {e.x && (
          <Cartao vivo>
            <p className="m-0 text-lg">Se o gene fosse ligado ao X, com q = {fmt(q, 3)}:</p>
            <p className="m-0">
              homens afetados = q = <strong>{fmt(x.homensAfetados * 100, 1)} %</strong> · mulheres afetadas = q² = <strong>{fmt(x.mulheresAfetadas * 100, 2)} %</strong> · mulheres portadoras = 2pq = <strong>{fmt(x.mulheresPortadoras * 100, 1)} %</strong>
            </p>
            <p className="m-0 text-sm text-[var(--ink-muted)]">Por isso os homens são afetados cerca de {fmt(1 / q, 1)} vezes mais que as mulheres.</p>
          </Cartao>
        )}
        <p className="m-0 text-sm text-[var(--ink-muted)]">Condições do equilíbrio: população grande, cruzamentos ao acaso, sem mutação, migração nem seleção. Se alguma falha, as frequências podem mudar.</p>
      </div>
      <div className="grid content-start gap-4">
        <ControleDeslizante rotulo="Indivíduos AA" valor={e.aa0} onChange={(v) => atualizar({ aa0: v })} min={0} max={100} passo={1} marcas={[0, 50, 100]} />
        <ControleDeslizante rotulo="Indivíduos Aa" valor={e.ab0} onChange={(v) => atualizar({ ab0: v })} min={0} max={100} passo={1} marcas={[0, 50, 100]} />
        <ControleDeslizante rotulo="Indivíduos aa" valor={e.bb0} onChange={(v) => atualizar({ bb0: v })} min={0} max={100} passo={1} marcas={[0, 50, 100]} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Exemplos">
          {PRESETS_HARDY.map((pr) => (
            <button key={pr.rotulo} type="button" className="btn" onClick={() => atualizar({ aa0: pr.v[0], ab0: pr.v[1], bb0: pr.v[2] })}>
              {pr.rotulo}
            </button>
          ))}
        </div>
        <PainelDeVisibilidade titulo="Mostrar" itens={[{ id: 'x', rotulo: 'Comparar com um gene ligado ao X', ativo: e.x }]} onChange={(_, ativo) => atualizar({ x: ativo })} />
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

function TelaExplorar() {
  const [v, atualizar] = useEstadoUrl({ vista: 'dois' })
  return (
    <div className="grid gap-4">
      <Alternador
        rotulo="O que explorar"
        valor={['dois', 'sangue', 'hardy'].includes(v.vista) ? v.vista : 'dois'}
        opcoes={[
          { id: 'dois', rotulo: 'Dois genes e ligação' },
          { id: 'sangue', rotulo: 'Grupos sanguíneos' },
          { id: 'hardy', rotulo: 'Hardy-Weinberg' },
        ]}
        onChange={(id) => atualizar({ vista: id })}
      />
      {v.vista === 'sangue' ? <ExplorarSangue /> : v.vista === 'hardy' ? <ExplorarHardy /> : <ExplorarDois />}
    </div>
  )
}

/* ------------------------------------------------------------------ Laboratório: heredograma interativo */

const PADRAO_HRD = { est: 'Família simples', mod: 'AR', af: 'II-2', sem: 0, cas: 0 }

function TelaHeredograma() {
  const [e, atualizar, reiniciar] = useEstadoUrl(PADRAO_HRD)
  const base = ESTRUTURAS.find((s) => s.nome === e.est) ?? (ESTRUTURAS[0] as (typeof ESTRUTURAS)[number])
  const modelo = (MODELOS as string[]).includes(e.mod) ? (e.mod as Modelo) : 'AR'
  const afetados = e.af ? e.af.split(',').filter((id) => base.pessoas.some((p) => p.id === id)) : []
  const chaveAfetados = afetados.join(',')
  const ped = useMemo(() => reconstruir(base.nome, chaveAfetados ? chaveAfetados.split(',') : []), [base.nome, chaveAfetados])
  const compat = MODELOS.map((m) => ({ m, ok: compativel(ped, m), razao: violacao(ped, m)?.texto }))
  const casais = useMemo(() => {
    const vistos = new Map<string, [string, string]>()
    for (const p of ped.pessoas) if (p.pais) vistos.set(p.pais.join('|'), p.pais)
    // casais sem filhos na estrutura também interessam (a pergunta é sobre o próximo filho)
    return [...vistos.values()]
  }, [ped])
  const casal = casais.length ? (casais[Math.min(e.cas, casais.length - 1)] as [string, string]) : undefined
  const analise = analisar(ped, modelo, 1e-6, casal ? { pai: casal[0], mae: casal[1] } : undefined)
  const analiseMenino = casal && ehLigadoAoX(modelo) ? analisar(ped, modelo, 1e-6, { pai: casal[0], mae: casal[1], sexo: 'M' }) : null
  const analiseMenina = casal && ehLigadoAoX(modelo) ? analisar(ped, modelo, 1e-6, { pai: casal[0], mae: casal[1], sexo: 'F' }) : null
  const ok = analise.total > 0
  const rotulos: Record<string, string> = {}
  if (ok)
    for (const p of ped.pessoas) {
      const m = analise.marginais.get(p.id) as number[]
      const k = m.indexOf(Math.max(...m))
      const prob = m[k] as number
      rotulos[p.id] = prob > 0.9995 ? rotuloGenotipo(modelo, p.sexo, k) : `${rotuloGenotipo(modelo, p.sexo, k)}? ${fmt(prob * 100, 0)}%`
    }
  const alterna = (id: string) => atualizar({ af: (afetados.includes(id) ? afetados.filter((x) => x !== id) : [...afetados, id]).join(',') })
  const sortear = () => {
    const rng = criarRng((e.sem + 1) * 7919 + 13)
    const sim = simular({ ...base, pessoas: base.pessoas.map((p) => ({ ...p, afetado: false })) }, modelo, modelo === 'AD' || modelo === 'XD' ? 0.12 : 0.3, rng)
    atualizar({ af: sim.pessoas.filter((p) => p.afetado).map((p) => p.id).join(','), sem: e.sem + 1 })
  }
  const nomeCasal = (c: [string, string]) => `${c[0]} × ${c[1]}`
  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
      <div className="grid content-start gap-3">
        <div className="cartao grid gap-2 p-3">
          <HeredogramaSvg ped={ped} rotulos={rotulos} onAlternar={alterna} rotulo={`Heredograma ${base.nome}. Cada pessoa é uma caixa de seleção: marque para torná-la afetada.`} />
          {legendaHeredograma()}
          <p className="m-0 text-center text-sm text-[var(--ink-muted)]">Clique numa pessoa (ou use Tab e Enter) para alternar entre afetada e normal. Sob cada símbolo, o genótipo no modelo escolhido; “?” indica o mais provável.</p>
        </div>
        <Cartao vivo>
          <h3 className="m-0 text-base">Padrões de herança compatíveis</h3>
          <ul className="m-0 grid list-none gap-1 p-0">
            {compat.map((c) => (
              <li key={c.m} className="flex items-start gap-2">
                <span aria-hidden="true" className="font-bold" style={{ color: c.ok ? 'var(--ok)' : 'var(--erro)' }}>
                  {c.ok ? '✓' : '✗'}
                </span>
                <span>
                  <strong>{NOME_MODELO[c.m].charAt(0).toUpperCase() + NOME_MODELO[c.m].slice(1)}</strong>: {c.ok ? 'compatível com este heredograma.' : c.razao ? `incompatível: ${c.razao}.` : 'incompatível: nenhuma atribuição de genótipos explica o heredograma.'}
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-sm text-[var(--ink-muted)]">Pressuposto das provas: quem entra na família vindo de fora não tem o alelo da doença, a menos que o heredograma obrigue.</p>
        </Cartao>
        <Cartao vivo>
          {casal ? (
            <>
              <h3 className="m-0 text-base">Próximo filho de {nomeCasal(casal)} ({NOME_MODELO[modelo]})</h3>
              {ok ? (
                <>
                  <p className="m-0 text-lg">
                    Probabilidade de ser afetado: <strong>{fmt((analise.filhoAfetado as number) * 100, 1)} %</strong>
                  </p>
                  {analiseMenino && analiseMenina && (
                    <p className="m-0">
                      Se for menino: <strong>{fmt((analiseMenino.filhoAfetado as number) * 100, 1)} %</strong> · se for menina: <strong>{fmt((analiseMenina.filhoAfetado as number) * 100, 1)} %</strong>
                    </p>
                  )}
                </>
              ) : (
                <p className="m-0">O modelo {NOME_MODELO[modelo]} é incompatível com este heredograma: não há probabilidade a calcular.</p>
              )}
            </>
          ) : (
            <p className="m-0">Esta estrutura não tem casais com filhos.</p>
          )}
        </Cartao>
      </div>
      <div className="grid content-start gap-4">
        <Seletor rotulo="Família" valor={base.nome} opcoes={ESTRUTURAS.map((s) => ({ id: s.nome, rotulo: s.nome }))} onChange={(id) => atualizar({ est: id, af: '', cas: 0 })} />
        <Alternador rotulo="Padrão de herança para os genótipos" valor={modelo} opcoes={MODELOS.map((m) => ({ id: m, rotulo: m }))} onChange={(id) => atualizar({ mod: id })} />
        <p className="m-0 text-sm text-[var(--ink-muted)]">AD: autossômica dominante · AR: autossômica recessiva · XD: dominante ligada ao X · XR: recessiva ligada ao X.</p>
        {casais.length > 0 && <Seletor rotulo="Casal (para o próximo filho)" valor={String(Math.min(e.cas, casais.length - 1))} opcoes={casais.map((c, i) => ({ id: String(i), rotulo: nomeCasal(c) }))} onChange={(id) => atualizar({ cas: Number(id) })} />}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primario" onClick={sortear}>
            Sortear heredograma ({modelo})
          </button>
          <button type="button" className="btn" onClick={() => atualizar({ af: '' })}>
            Limpar afetados
          </button>
        </div>
        <p className="m-0 text-sm text-[var(--ink-muted)]">“Sortear” gera os fenótipos de uma família segundo o padrão escolhido; depois você pode alterar as pessoas e ver quais padrões continuam possíveis.</p>
        <Rodape onReiniciar={reiniciar} />
      </div>
    </div>
  )
}

export default function Laboratorio() {
  return (
    <LaboratorioTelas
      telas={[
        { id: 'intro', conteudo: <TelaPunnett /> },
        { id: 'explorar', conteudo: <TelaExplorar /> },
        { id: 'lab', conteudo: <TelaHeredograma /> },
      ]}
      desafios={DEFINICOES_GENETICA}
    />
  )
}
