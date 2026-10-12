import { BANCO_FUSOS, CIDADES, type Cidade } from '@/conteudo/geografia/fusos'
import type { InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { fn, limpar, montar, type Opc } from '@/materias/biologia/comum/auxiliares'
import { doBanco } from '../comum/banco'
import { MIN_DIA, chegadaDoVoo, converterHora, duracaoDoVoo, formatarDuracao, formatarHora, formatarUtc, fusoTeorico, nomeDoDia, noExpediente, type Hora } from './calculo'

/** Dados enviados ao desenho: as cidades da pergunta (para a faixa de fusos) ou uma longitude (para o mapa). */
export interface DadosFusos {
  cidades?: string[]
  longitude?: number
}

const INTEIROS = CIDADES.filter((c) => Number.isInteger(c.utc))
const MEIOS = CIDADES.filter((c) => !Number.isInteger(c.utc))
const sinal = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fn(Math.abs(n), 2)}`
const porCidade = (c: Cidade) => `${c.nome} (${formatarUtc(c.utc)})`
const horaDoDia = (h: Hora, dia0: number) => `${formatarHora(h.minutos)} de ${nomeDoDia(dia0 + h.dia)}`

function doisDistintos(rng: Rng, a: readonly Cidade[], b: readonly Cidade[], aceita: (x: Cidade, y: Cidade) => boolean): [Cidade, Cidade] {
  for (let t = 0; t < 400; t++) {
    const x = escolher(rng, a)
    const y = escolher(rng, b)
    if (x.id !== y.id && x.utc !== y.utc && aceita(x, y)) return [x, y]
  }
  return [CIDADES[1] as Cidade, CIDADES[16] as Cidade]
}

/* ------------------------------------------------------------------ que horas são lá? */

export function gerarHora(rng: Rng, nivel: Nivel): InstanciaMulti<DadosFusos> {
  const dia0 = sortear(rng, 0, 6)
  let origem: Cidade
  let destino: Cidade
  let minutos: number
  for (let t = 0; ; t++) {
    if (nivel === 1) {
      ;[origem, destino] = doisDistintos(rng, INTEIROS, INTEIROS, (x, y) => Math.abs(y.utc - x.utc) <= 6)
      minutos = sortear(rng, 7, 16) * 60
    } else if (nivel === 2) {
      ;[origem, destino] = doisDistintos(rng, INTEIROS, INTEIROS, (x, y) => Math.abs(y.utc - x.utc) >= 4)
      minutos = sortear(rng, 0, 23) * 60
    } else {
      ;[origem, destino] = rng() < 0.5 ? doisDistintos(rng, MEIOS, INTEIROS, () => true) : doisDistintos(rng, INTEIROS, MEIOS, () => true)
      minutos = sortear(rng, 0, 47) * 30
    }
    const r = converterHora(minutos, origem.utc, destino.utc)
    if (nivel === 1 ? r.dia === 0 : true) break
    if (t > 500) break
  }
  const dif = destino.utc - origem.utc
  const certa = converterHora(minutos, origem.utc, destino.utc)
  const candidatos: { h: Hora; porque: string; motivo: string }[] = [
    {
      h: converterHora(minutos, destino.utc, origem.utc),
      porque: `Você subtraiu a diferença: ${destino.nome} está ${dif > 0 ? 'a leste' : 'a oeste'}, então a hora é ${dif > 0 ? 'adiantada' : 'atrasada'}, e a diferença é ${sinal(dif)} h (${formatarUtc(destino.utc)} − (${formatarUtc(origem.utc)})).`,
      motivo: 'inverteu o sinal da diferença',
    },
    { h: converterHora(minutos, origem.utc, destino.utc + 1), porque: `A diferença é ${sinal(dif)} h, e não ${sinal(dif + 1)} h: confira os dois fusos.`, motivo: 'errou um fuso na conta' },
    { h: converterHora(minutos, origem.utc, destino.utc - 1), porque: `A diferença é ${sinal(dif)} h, e não ${sinal(dif - 1)} h: confira os dois fusos.`, motivo: 'errou um fuso na conta' },
    { h: { minutos: certa.minutos, dia: 0 }, porque: `A hora está certa, mas a conta passou da meia-noite: o dia é ${nomeDoDia(dia0 + certa.dia)}.`, motivo: 'esqueceu a mudança de dia' },
    { h: { minutos: certa.minutos, dia: certa.dia === 0 ? 1 : -certa.dia }, porque: 'O dia da semana está errado: some 24 h quando passar da meia-noite e subtraia quando ficar negativo.', motivo: 'errou o sentido da mudança de dia' },
    { h: converterHora(minutos, origem.utc, destino.utc + 2), porque: 'Contou fusos a mais na diferença.', motivo: 'errou um fuso na conta' },
  ]
  const texto = (h: Hora) => horaDoDia(h, dia0)
  const correta = texto(certa)
  const vistos = new Set([correta])
  const erradas: Opc[] = []
  for (const c of candidatos) {
    const tx = texto(c.h)
    if (vistos.has(tx)) continue
    vistos.add(tx)
    erradas.push({ texto: tx, porque: c.porque, motivo: c.motivo })
    if (erradas.length === 3) break
  }
  return montar<DadosFusos>(
    rng,
    { texto: correta, porque: `Diferença de fuso: ${formatarUtc(destino.utc)} − (${formatarUtc(origem.utc)}) = ${sinal(dif)} h. ${formatarHora(minutos)} ${sinal(dif)} h = ${formatarHora(certa.minutos)}${certa.dia === 0 ? ', no mesmo dia' : certa.dia > 0 ? ', do dia seguinte' : ', do dia anterior'}.` },
    erradas,
    {
      enunciado: `Em ${porCidade(origem)} são ${formatarHora(minutos)} de ${nomeDoDia(dia0)}. Que horas e que dia são em ${porCidade(destino)}?`,
      resolucao: `Diferença: ${formatarUtc(destino.utc)} − (${formatarUtc(origem.utc)}) = ${sinal(dif)} h. ${formatarHora(minutos)} ${sinal(dif)} h = ${fn((minutos + dif * 60) / 60, 2)} h${certa.dia !== 0 ? `, que passa do dia: ${formatarHora(certa.minutos)} de ${nomeDoDia(dia0 + certa.dia)}` : ''}. Resposta: ${correta}.`,
      dicas: ['Primeiro ache a diferença entre os fusos: fuso do destino menos fuso da origem.', 'Se o destino está a leste (fuso maior), a hora é adiantada: some. Se está a oeste, subtraia.', 'Passou de 24h? Subtraia 24h e some um dia. Ficou negativo? Some 24h e volte um dia.'],
      licao: 'Hora no destino = hora na origem + (fuso do destino − fuso da origem). Corrija o dia da semana quando passar de 24h ou ficar negativo.',
      dados: { cidades: [origem.id, destino.id] },
    },
  )
}

/* ------------------------------------------------------------------ longitude e horas */

const lon = (l: number) => `${Math.abs(l)}°${l < 0 ? 'O' : 'L'}`

type TipoLongitude = 'horas' | 'minutos' | 'graus'
export interface DadosLongitude {
  tipo: TipoLongitude
}

export function gerarLongitude(rng: Rng, nivel: Nivel): InstanciaNum<DadosLongitude> {
  for (let t = 0; t < 200; t++) {
    if (nivel === 1) {
      const a = sortear(rng, -9, 9) * 15
      const b = sortear(rng, -9, 9) * 15
      const d = Math.abs(b - a)
      if (d < 30) continue
      const resposta = d / 15
      const tol = 0.05
      const erros = limpar(
        [
          { valor: d, frase: `${fn(d, 0)} é a diferença em graus. Para achar as horas, divida por 15 (15° por hora).`, motivo: 'deu os graus em vez das horas' },
          { valor: (Math.abs(a) + Math.abs(b)) / 15, frase: 'Você somou as longitudes sem olhar os lados: se estão do mesmo lado de Greenwich, subtraia; se estão em lados opostos, some.', motivo: 'somou longitudes do mesmo lado' },
          { valor: Math.abs(Math.abs(a) - Math.abs(b)) / 15, frase: 'Você subtraiu as longitudes sem olhar os lados: se estão em lados opostos de Greenwich (O e L), some os valores.', motivo: 'subtraiu longitudes de lados opostos' },
          { valor: d / 24, frase: 'Você dividiu por 24. Os graus por hora são 15 (360° ÷ 24).', motivo: 'dividiu pelo número de fusos' },
        ],
        resposta,
        tol,
      )
      if (erros.length < 2) continue
      return {
        enunciado: `Duas cidades estão nos meridianos ${lon(a)} e ${lon(b)}. Quantas horas de diferença há, aproximadamente, entre os horários dessas cidades?`,
        resposta,
        tolerancia: tol,
        unidade: 'horas',
        erros,
        resolucao: `Diferença de longitude: ${a < 0 === b < 0 ? `|${fn(Math.abs(a), 0)} − ${fn(Math.abs(b), 0)}|` : `${fn(Math.abs(a), 0)} + ${fn(Math.abs(b), 0)}`} = ${fn(d, 0)}°. Como 15° valem 1 hora: ${fn(d, 0)} ÷ 15 = ${fn(resposta, 0)} h.`,
        dicas: ['Primeiro ache quantos graus separam os dois meridianos.', 'Cuidado com os lados: O e L em lados opostos de Greenwich somam; do mesmo lado, subtraem.', 'Cada 15° de longitude equivalem a 1 hora.'],
        licao: 'Diferença de horas = diferença de longitude ÷ 15°.',
        dados: { tipo: 'horas' },
      }
    }
    if (nivel === 2) {
      const a = sortear(rng, -150, 140)
      const d = sortear(rng, 5, 38)
      if (d % 15 === 0) continue
      const b = a + d
      const resposta = d * 4
      const tol = 0.5
      const erros = limpar(
        [
          { valor: d * 15, frase: 'Você multiplicou por 15. Cada grau vale 4 minutos (60 min ÷ 15°).', motivo: 'usou 15 minutos por grau' },
          { valor: d / 15, frase: `${fn(d / 15, 2)} são horas (graus ÷ 15). O enunciado pede minutos: multiplique as horas por 60 (ou use 4 min por grau).`, motivo: 'deu horas em vez de minutos' },
          { valor: d / 4, frase: 'Você dividiu por 4. Cada grau vale 4 minutos: multiplique.', motivo: 'dividiu em vez de multiplicar' },
          { valor: d, frase: 'Isso é o número de graus. Cada grau vale 4 minutos.', motivo: 'deu os graus em vez dos minutos' },
        ],
        resposta,
        tol,
      )
      if (erros.length < 2) continue
      return {
        enunciado: `Dois pontos estão nos meridianos ${lon(a)} e ${lon(b)}, separados por ${d}° de longitude. Qual é a diferença entre as horas solares desses pontos, em minutos?`,
        resposta,
        tolerancia: tol,
        unidade: 'minutos',
        erros,
        resolucao: `Como 15° valem 60 min, cada grau vale 4 min. ${d}° × 4 min = ${d * 4} min (${fn(d / 15, 2)} h).`,
        dicas: ['15° equivalem a 60 minutos.', 'Descubra quantos minutos vale 1°: 60 ÷ 15.', `Multiplique os ${d}° pelos minutos de cada grau.`],
        licao: '1° de longitude = 4 minutos de diferença na hora solar.',
        dados: { tipo: 'minutos' },
      }
    }
    const graus = sortear(rng, 6, 48)
    const totalMin = graus * 4
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    if (h < 1 || m === 0) continue
    const tol = 0.5
    const erros = limpar(
      [
        { valor: h * 15, frase: `Você usou só as horas (${h} h = ${h * 15}°) e esqueceu os ${m} minutos (${fn(m / 4, 2)}°).`, motivo: 'esqueceu os minutos' },
        { valor: totalMin / 15, frase: `Você dividiu os minutos por 15. Os minutos se dividem por 4, porque 1° vale 4 minutos.`, motivo: 'usou 15 em vez de 4 minutos' },
        { valor: totalMin * 4, frase: 'Você multiplicou por 4. Para ir de minutos a graus, divida por 4.', motivo: 'multiplicou em vez de dividir' },
        { valor: (totalMin / 60) * 4, frase: 'Você converteu para horas e multiplicou por 4. Cada hora vale 15°.', motivo: 'usou 4° por hora' },
      ],
      graus,
      tol,
    )
    if (erros.length < 2) continue
    return {
      enunciado: `A hora solar de duas cidades difere em ${h} h ${m} min. Qual é a diferença de longitude entre elas, em graus?`,
      resposta: graus,
      tolerancia: tol,
      unidade: 'graus',
      erros,
      resolucao: `${h} h ${m} min = ${totalMin} min. Cada grau vale 4 min: ${totalMin} ÷ 4 = ${graus}°. (Ou: ${h} h × 15° + ${m} min ÷ 4 = ${h * 15}° + ${fn(m / 4, 2)}°.)`,
      dicas: ['Converta tudo para minutos (horas × 60 + minutos).', '1° de longitude vale 4 minutos.', 'Divida os minutos totais por 4.'],
      licao: 'Graus = minutos de diferença ÷ 4 (ou horas × 15).',
      dados: { tipo: 'graus' },
    }
  }
  throw new Error('não foi possível gerar a pergunta de longitude')
}

/* ------------------------------------------------------------------ viagens de avião */

export interface DadosViagem extends DadosFusos {
  duracao: number
}

export function gerarViagem(rng: Rng, nivel: Nivel): InstanciaNum<DadosViagem> {
  for (let t = 0; t < 600; t++) {
    let origem: Cidade
    let destino: Cidade
    let duracao: number
    let partida: number
    if (nivel === 1) {
      ;[origem, destino] = doisDistintos(rng, INTEIROS, INTEIROS, (x, y) => Math.abs(y.utc - x.utc) <= 3)
      duracao = sortear(rng, 1, 6)
      partida = sortear(rng, 6, 14) * 60
    } else if (nivel === 2) {
      ;[origem, destino] = doisDistintos(rng, INTEIROS, INTEIROS, (x, y) => Math.abs(y.utc - x.utc) >= 4)
      duracao = sortear(rng, 4, 16)
      partida = sortear(rng, 0, 23) * 60
    } else {
      ;[origem, destino] = rng() < 0.5 ? doisDistintos(rng, MEIOS, INTEIROS, () => true) : doisDistintos(rng, INTEIROS, MEIOS, () => true)
      duracao = sortear(rng, 7, 31) / 2
      partida = sortear(rng, 0, 47) * 30
    }
    const chegada = chegadaDoVoo(partida, duracao, origem.utc, destino.utc)
    // dia de chegada pelo calendário local: depende do dia de partida e do deslocamento do fuso
    const dif = destino.utc - origem.utc
    const diasDepois = Math.floor((partida + duracao * 60 + dif * 60) / MIN_DIA)
    if (nivel === 1 ? diasDepois !== 0 : diasDepois < 0 || diasDepois > 1) continue
    const resposta = duracaoDoVoo({ partida, chegada: chegada.minutos, diasDepois, utcOrigem: origem.utc, utcDestino: destino.utc })
    if (Math.abs(resposta - duracao) > 1e-9) continue
    const relogios = (chegada.minutos + diasDepois * MIN_DIA - partida) / 60
    const tol = 0.05
    const erros = limpar(
      [
        { valor: relogios, frase: `${fn(relogios, 2)} h é só a diferença entre os relógios. Ela mistura a duração do voo com a diferença de fuso (${sinal(dif)} h): é preciso descontar o fuso.`, motivo: 'não descontou a diferença de fuso' },
        { valor: relogios + dif, frase: `Você somou a diferença de fuso em vez de subtraí-la. O destino está ${dif > 0 ? 'a leste (relógio adiantado)' : 'a oeste (relógio atrasado)'}, e isso precisa ser retirado da diferença dos relógios.`, motivo: 'somou a diferença de fuso' },
        { valor: duracao + Math.abs(dif), frase: 'Você somou o módulo da diferença de fuso. O sinal importa: para o leste, o relógio do destino “ganha” horas; para o oeste, “perde”.', motivo: 'ignorou o sinal do fuso' },
        { valor: Math.abs(duracao - Math.abs(dif)), frase: 'Você subtraiu o módulo da diferença de fuso. Use o sinal: duração = (chegada − partida) − (fuso do destino − fuso da origem).', motivo: 'ignorou o sinal do fuso' },
      ],
      resposta,
      tol,
    )
    if (erros.length < 2) continue
    const diaTxt = diasDepois === 0 ? 'no mesmo dia' : 'no dia seguinte'
    return {
      enunciado: `Um voo parte de ${porCidade(origem)} às ${formatarHora(partida)} e chega a ${porCidade(destino)} às ${formatarHora(chegada.minutos)}, ${diaTxt} (ambas as horas são locais). Qual é a duração do voo, em horas?`,
      resposta,
      tolerancia: tol,
      unidade: 'horas',
      erros,
      resolucao: `Diferença dos relógios: ${formatarHora(chegada.minutos)} ${diasDepois ? '(dia seguinte) ' : ''}− ${formatarHora(partida)} = ${fn(relogios, 2)} h. Diferença de fuso: ${formatarUtc(destino.utc)} − (${formatarUtc(origem.utc)}) = ${sinal(dif)} h. Duração = ${fn(relogios, 2)} − (${sinal(dif)}) = ${fn(resposta, 2)} h (${formatarDuracao(resposta)}).`,
      dicas: ['Os dois horários são locais: eles misturam o tempo de voo e a diferença de fuso.', `Calcule a diferença dos relógios (${diasDepois ? 'some 24 h, pois chegou no dia seguinte' : 'mesmo dia'}).`, 'Duração = diferença dos relógios − (fuso do destino − fuso da origem).'],
      licao: 'Duração do voo = (chegada − partida) − (fuso do destino − fuso da origem).',
      dados: { cidades: [origem.id, destino.id], duracao },
    }
  }
  throw new Error('não foi possível gerar a viagem')
}

/* ------------------------------------------------------------------ fuso teórico (e banco) */

export function gerarFuso(rng: Rng, nivel: Nivel): InstanciaMulti<DadosFusos> {
  if (nivel === 1) return doBanco<DadosFusos>(rng, BANCO_FUSOS.slice(0, 4))
  if (nivel === 3) return doBanco<DadosFusos>(rng, BANCO_FUSOS.slice(4))
  const f = sortear(rng, -11, 11)
  const l = f * 15 + sortear(rng, -5, 5)
  const longitude = Math.max(-179, Math.min(179, l))
  const certa = fusoTeorico(longitude)
  const razao = longitude / 15
  const lado = longitude < 0 ? 'O' : 'L'
  const passo = `${fn(Math.abs(longitude), 0)} ÷ 15 = ${fn(Math.abs(razao), 2)}, que arredonda para ${Math.abs(certa)}; como a longitude é ${longitude < 0 ? 'oeste' : 'leste'}, o fuso é ${formatarUtc(certa)}.`
  const candidatos = [certa + 1, certa - 1, -certa === certa ? certa + 2 : -certa, certa + 2, certa - 2].filter((x) => x >= -12 && x <= 12)
  const unicos = [...new Set(candidatos.filter((x) => x !== certa))]
  const erradas: Opc[] = embaralhar(rng, unicos)
    .slice(0, 3)
    .map((x) => ({
      texto: formatarUtc(x),
      porque: x === -certa ? 'O sinal está trocado: longitudes a oeste de Greenwich têm fuso negativo, e a leste, positivo.' : `O resultado de ${fn(Math.abs(razao), 2)} está mais perto de ${Math.abs(certa)} do que de ${Math.abs(x)}: o arredondamento leva a ${formatarUtc(certa)}.`,
      motivo: x === -certa ? 'trocou o sinal do fuso' : 'errou o arredondamento',
    }))
  return montar<DadosFusos>(
    rng,
    { texto: formatarUtc(certa), porque: passo },
    erradas,
    {
      enunciado: `Qual é o fuso horário teórico (em relação a Greenwich) de um ponto na longitude ${lon(longitude)}?`,
      resolucao: `${passo} O meridiano central do fuso é ${fn(certa * 15, 0)}°, e o fuso vai de ${fn(certa * 15 - 7.5, 1)}° a ${fn(certa * 15 + 7.5, 1)}°.`,
      dicas: ['Cada fuso tem 15° de largura: divida a longitude por 15.', 'Arredonde para o número inteiro mais próximo.', `Oeste (${lado === 'O' ? 'este caso' : 'não este'}) é negativo; leste é positivo.`],
      licao: 'Fuso teórico = longitude ÷ 15°, arredondado; oeste negativo, leste positivo.',
      dados: { longitude },
    },
  )
}

/* ------------------------------------------------------------------ reunião entre cidades */

const REFERENCIA = CIDADES.find((c) => c.id === 'brasilia') as Cidade

export function gerarReuniao(rng: Rng, nivel: Nivel): InstanciaMulti<DadosFusos> {
  for (let t = 0; t < 600; t++) {
    const total = nivel === 1 ? 2 : 3
    const pool = CIDADES.filter((c) => c.id !== REFERENCIA.id)
    const participantes: Cidade[] = nivel === 3 ? [escolher(rng, MEIOS)] : []
    while (participantes.length < total) {
      const c = escolher(rng, pool)
      if (!participantes.some((p) => p.id === c.id || p.utc === c.utc)) participantes.push(c)
    }
    const local = (c: Cidade, h: number) => converterHora(h * 60, REFERENCIA.utc, c.utc).minutos
    const valida = (h: number) => participantes.every((c) => noExpediente(local(c, h)))
    const validas = Array.from({ length: 24 }, (_, h) => h).filter(valida)
    if (validas.length < 1 || validas.length > 4) continue
    const certaH = escolher(rng, validas)
    const naoValidas = Array.from({ length: 24 }, (_, h) => h).filter((h) => !valida(h))
    // erradas: horas em que só uma cidade falha (as mais enganosas); depois, as que ficam mais perto de uma hora válida
    const falhas = (h: number) => participantes.filter((c) => !noExpediente(local(c, h))).length
    const ordenadas = embaralhar(rng, naoValidas).sort((a, b) => falhas(a) - falhas(b))
    const escolhidas = ordenadas.slice(0, 3)
    if (escolhidas.length < 3) continue
    const explicaErro = (h: number) => {
      const c = participantes.find((x) => !noExpediente(local(x, h))) as Cidade
      return `Às ${formatarHora(h * 60)} em Brasília seriam ${formatarHora(local(c, h))} em ${c.nome}: fora do horário das 9h às 17h para começar a reunião.`
    }
    const certa: Opc = {
      texto: `${formatarHora(certaH * 60)} em Brasília`,
      porque: `${participantes.map((c) => `${c.nome}: ${formatarHora(local(c, certaH))}`).join('; ')}. Todos os horários ficam entre 9h e 17h.`,
    }
    const erradas: Opc[] = escolhidas.map((h) => ({ texto: `${formatarHora(h * 60)} em Brasília`, porque: explicaErro(h), motivo: 'pelo menos uma cidade ficou fora do expediente' }))
    const lista = participantes.map((c) => porCidade(c))
    return montar<DadosFusos>(rng, certa, erradas, {
      enunciado: `Uma equipe com pessoas em ${lista.slice(0, -1).join(', ')} e ${lista[lista.length - 1]} quer fazer uma reunião de 1 hora. Cada pessoa só pode participar se a reunião começar entre 9h e 17h no seu horário local (para terminar até as 18h). Em qual horário, medido em Brasília (UTC−3), a reunião pode começar?`,
      resolucao: `Passe o horário de Brasília para cada cidade (diferença de fuso) e confira quem fica fora de 9h–17h. Horários válidos em Brasília: ${validas.map((h) => formatarHora(h * 60)).join(', ')}.`,
      dicas: ['Escolha um horário e converta-o para cada cidade (fuso da cidade − fuso de Brasília).', 'Elimine as opções em que alguém começaria antes das 9h ou depois das 17h.', 'Confira todas as cidades, não só a primeira.'],
      licao: 'Para marcar reuniões entre fusos, converta o mesmo horário para cada cidade e confira o expediente de todas.',
      dados: { cidades: participantes.map((c) => c.id) },
    })
  }
  throw new Error('não foi possível gerar a reunião')
}
