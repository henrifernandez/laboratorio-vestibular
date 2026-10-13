import { BANCO_ORDEM, BANCO_ORGANIZACOES, BLOCOS, ESTAGIOS, FORA_DOS_BLOCOS, PONTOS, type Bloco, type Estagio } from '@/conteudo/geografia/geopolitica'
import type { InstanciaMulti } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, type Rng } from '@/lib/rng'
import { montar, type Opc } from '@/materias/biologia/comum/auxiliares'
import { doBanco, faixaDoBanco } from '../comum/banco'
import { classificarIntegracao, descreverCaracteristicas, exigencias } from './calculo'

export const gerarOrganizacoes = (rng: Rng, nivel: Nivel): InstanciaMulti<undefined> => doBanco(rng, faixaDoBanco(BANCO_ORGANIZACOES, nivel))
export const gerarOrdem = (rng: Rng, nivel: Nivel): InstanciaMulti<undefined> => doBanco(rng, faixaDoBanco(BANCO_ORDEM, nivel))

const estagio = (id: string) => ESTAGIOS.find((e) => e.id === id) as Estagio
const bloco = (id: string) => BLOCOS.find((b) => b.id === id) as Bloco

/* ------------------------------------------------------------------ estágios de integração */

export function gerarIntegracao(rng: Rng, nivel: Nivel): InstanciaMulti<undefined> {
  const todos = embaralhar(rng, ESTAGIOS)
  if (nivel === 1) {
    const alvo = escolher(rng, ESTAGIOS)
    const c = exigencias(alvo.id)
    const outros = todos.filter((e) => e.id !== alvo.id)
    return montar<undefined>(
      rng,
      { texto: alvo.nome, porque: `${alvo.definicao}` },
      outros.map((o) => ({
        texto: o.nome,
        porque:
          o.numero < alvo.numero
            ? `O bloco já passou de ${o.nome.toLowerCase()}: tem também ${ESTAGIOS.slice(o.numero, alvo.numero).map((e) => e.acrescenta).join(' e ')}.`
            : `Para ser ${o.nome.toLowerCase()}, o bloco precisaria ter também ${ESTAGIOS.slice(alvo.numero, o.numero).map((e) => e.acrescenta).join(' e ')}.`,
        motivo: `confundiu com ${o.nome.toLowerCase()}`,
      })),
      {
        enunciado: `Alguns países ${descreverCaracteristicas(c)}. Em que estágio de integração econômica eles estão?`,
        resolucao: `${alvo.nome}: ${alvo.definicao} Cada estágio inclui os anteriores, e este é o mais avançado cujas exigências foram cumpridas.`,
        dicas: ['Cada estágio inclui os anteriores.', 'Veja qual é a característica mais avançada que o bloco já tem.', 'Livre-comércio → tarifa externa comum → circulação de pessoas, capitais e serviços → moeda única.'],
        licao: 'Estágios: zona de livre-comércio, união aduaneira, mercado comum, união econômica e monetária, cada um incluindo o anterior.',
      },
    )
  }
  if (nivel === 2) {
    // o que o estágio acrescenta ao anterior
    const alvo = escolher(rng, ESTAGIOS.slice(1))
    const anterior = estagio(ESTAGIOS[alvo.numero - 2]?.id as string)
    const outras = todos.filter((e) => e.id !== alvo.id)
    return montar<undefined>(
      rng,
      { texto: alvo.acrescenta, porque: `${alvo.nome} = ${anterior.nome.toLowerCase()} + ${alvo.acrescenta}.` },
      outras.map((o) => ({ texto: o.acrescenta, porque: `Isso é o que ${o.nome.toLowerCase()} acrescenta (${o.acrescenta}), e não o que distingue ${alvo.nome.toLowerCase()} de ${anterior.nome.toLowerCase()}.`, motivo: `trocou o que cada estágio acrescenta` })),
      {
        enunciado: `O que um(a) ${alvo.nome.toLowerCase()} tem a mais do que um(a) ${anterior.nome.toLowerCase()}?`,
        resolucao: `${alvo.nome}: ${alvo.definicao} A diferença para ${anterior.nome.toLowerCase()} é ${alvo.acrescenta}.`,
        dicas: ['Cada estágio inclui o anterior e acrescenta uma característica.', `O estágio anterior é ${anterior.nome.toLowerCase()}.`, 'Compare os quatro estágios na escada.'],
        licao: 'Acréscimos: livre-comércio; tarifa externa comum; livre circulação de pessoas, capitais e serviços; moeda única e políticas coordenadas.',
      },
    )
  }
  // nível 3: blocos reais
  const real = escolher(rng, BLOCOS.filter((b) => ['mercosul', 'ue', 'usmca'].includes(b.id)))
  const alvo = estagio(real.estagio)
  const porqueBloco: Record<string, string> = {
    mercosul: 'O Mercosul tem tarifa externa comum, mas com muitas exceções; não tem livre circulação plena de capitais e serviços nem moeda única.',
    ue: 'A União Europeia tem mercado único, com livre circulação de pessoas, capitais, bens e serviços, e moeda comum, o euro, em boa parte dos países.',
    usmca: 'O USMCA elimina tarifas entre os três países, mas cada um mantém a própria política comercial com os de fora.',
  }
  const outros = todos.filter((e) => e.id !== alvo.id)
  return montar<undefined>(
    rng,
    { texto: alvo.nome, porque: `${porqueBloco[real.id]} Por isso, é ${alvo.nome.toLowerCase()}.` },
    outros.map((o) => ({ texto: o.nome, porque: `${porqueBloco[real.id]} Isso não corresponde a ${o.nome.toLowerCase()}.`, motivo: `errou o estágio do ${real.sigla}` })),
    {
      enunciado: `Em que estágio de integração econômica se encontra o bloco ${real.sigla}? (${real.resumo})`,
      resolucao: `${real.sigla}: ${alvo.nome.toLowerCase()}. ${porqueBloco[real.id]}`,
      dicas: ['Compare as características do bloco com a escada dos estágios.', 'O Mercosul não tem moeda única nem livre circulação plena.', 'O estágio mais avançado cujas exigências foram cumpridas é a resposta.'],
      licao: 'USMCA: zona de livre-comércio. Mercosul: união aduaneira (incompleta). União Europeia: união econômica e monetária (mercado único e euro).',
    },
  )
}

/* ------------------------------------------------------------------ blocos e seus países */

export interface DadosBloco {
  /** bloco da resposta: o mapa dele aparece depois que a pessoa responde */
  blocoId?: string
}

export function gerarBlocoMembros(rng: Rng, nivel: Nivel): InstanciaMulti<DadosBloco> {
  if (nivel === 3) {
    const alvo = escolher(rng, BLOCOS)
    const tres = embaralhar(rng, alvo.membros).slice(0, 3)
    const outros = embaralhar(rng, BLOCOS.filter((b) => b.id !== alvo.id)).slice(0, 3)
    const nomes = tres.map((m) => m.nome)
    return montar<DadosBloco>(
      rng,
      { texto: alvo.sigla, porque: `${alvo.sigla} (${alvo.lista}): ${alvo.membros.map((m) => m.nome).join(', ')}.` },
      outros.map((o) => ({ texto: o.sigla, porque: `${o.sigla} (${o.lista}) reúne ${o.membros.slice(0, 4).map((m) => m.nome).join(', ')}${o.membros.length > 4 ? ' e outros' : ''}; não inclui ${nomes.join(', ')}.`, motivo: `ligou os países ao ${o.sigla}` })),
      {
        enunciado: `Qual bloco econômico reúne estes três países: ${nomes.slice(0, 2).join(', ')} e ${nomes[2]}?`,
        resolucao: `Os três fazem parte do ${alvo.sigla}. ${alvo.resumo}`,
        dicas: ['Pense na região do mundo em que os três ficam.', `Os quatro blocos estudados: ${BLOCOS.map((b) => b.sigla).join(', ')}.`, 'Elimine os blocos cujos membros ficam em outros continentes.'],
        licao: BLOCOS.map((b) => `${b.sigla}: ${b.membros.map((m) => m.nome).slice(0, 4).join(', ')}${b.membros.length > 4 ? ' e outros' : ''}`).join('. ') + '.',
        dados: { blocoId: alvo.id },
      },
    )
  }
  const alvo = bloco(escolher(rng, nivel === 1 ? ['mercosul', 'usmca'] : ['ue', 'asean']))
  const membro = escolher(rng, alvo.membros)
  const fora = embaralhar(rng, FORA_DOS_BLOCOS[alvo.id] ?? []).slice(0, 3)
  const certa: Opc = { texto: membro.nome, porque: `${membro.nome} é um dos países do ${alvo.sigla} (${alvo.lista}).` }
  const erradas: Opc[] = fora.map((f) => ({ texto: f.nome, porque: `${f.nome} não faz parte do ${alvo.sigla} (${alvo.lista}).`, motivo: `achou que ${f.nome} fazia parte do ${alvo.sigla}` }))
  return montar<DadosBloco>(rng, certa, erradas, {
    enunciado: `Qual destes países faz parte do ${alvo.sigla} (${alvo.lista})?`,
    resolucao: `${alvo.sigla} (${alvo.lista}): ${alvo.membros.map((m) => m.nome).join(', ')}.`,
    dicas: [`O ${alvo.sigla} fica na região: ${alvo.regiao.replace(/-/g, ' ')}.`, `Criado em ${alvo.criacao}.`, alvo.resumo],
    licao: `${alvo.sigla} (${alvo.lista}): ${alvo.membros.map((m) => m.nome).join(', ')}.`,
    dados: { blocoId: alvo.id },
  })
}

/* ------------------------------------------------------------------ canais e estreitos */

export interface DadosPonto {
  /** ponto da resposta: o mapa o mostra sem rótulo no nível 3 e com rótulo depois da resposta */
  pontoId?: string
  mostrarNoMapa?: boolean
}

const BEM_CONHECIDOS = ['suez', 'panama', 'ormuz', 'gibraltar']

export function gerarPonto(rng: Rng, nivel: Nivel): InstanciaMulti<DadosPonto> {
  const universo = nivel === 1 ? PONTOS.filter((p) => BEM_CONHECIDOS.includes(p.id)) : PONTOS
  const alvo = escolher(rng, universo)
  const outros = embaralhar(rng, universo.filter((p) => p.id !== alvo.id))
  // se o universo tiver poucos pontos, completa com os demais
  const erradas3 = [...outros, ...embaralhar(rng, PONTOS.filter((p) => p.id !== alvo.id && !outros.some((o) => o.id === p.id)))].slice(0, 3)
  const erradas: Opc[] = erradas3.map((o) => ({ texto: o.nome, porque: `${o.nome} liga ${o.liga[0]} e ${o.liga[1]} (${o.paises}). ${o.importancia}`, motivo: `confundiu com o ${o.nome}` }))
  const certa: Opc = { texto: alvo.nome, porque: `${alvo.nome} liga ${alvo.liga[0]} e ${alvo.liga[1]} (${alvo.paises}). ${alvo.importancia}` }
  if (nivel === 1) {
    return montar<DadosPonto>(rng, certa, erradas, {
      enunciado: `Qual canal ou estreito liga ${alvo.liga[0]} e ${alvo.liga[1]}?`,
      resolucao: `${alvo.nome} (${alvo.tipo}, ${alvo.paises}): liga ${alvo.liga[0]} e ${alvo.liga[1]}. ${alvo.importancia}`,
      dicas: ['Procure a região do mundo em que ficam os dois mares.', `Fica em: ${alvo.paises}.`, alvo.nota],
      licao: `${alvo.nome}: ${alvo.liga[0]} ↔ ${alvo.liga[1]}.`,
      dados: { pontoId: alvo.id },
    })
  }
  if (nivel === 2) {
    return montar<DadosPonto>(rng, certa, erradas, {
      enunciado: `Qual ponto estratégico é descrito assim? ${alvo.importancia}`,
      resolucao: `${alvo.nome} (${alvo.tipo}, ${alvo.paises}): liga ${alvo.liga[0]} e ${alvo.liga[1]}. ${alvo.importancia}`,
      dicas: [`É um ${alvo.tipo}.`, `Fica em: ${alvo.paises}.`, `Liga ${alvo.liga[0]} e ${alvo.liga[1]}.`],
      licao: `${alvo.nome}: ${alvo.importancia}`,
      dados: { pontoId: alvo.id },
    })
  }
  return montar<DadosPonto>(rng, certa, erradas, {
    enunciado: 'O ponto marcado no mapa é um canal ou estreito. Qual?',
    resolucao: `${alvo.nome} (${alvo.tipo}, ${alvo.paises}): liga ${alvo.liga[0]} e ${alvo.liga[1]}. ${alvo.importancia}`,
    dicas: ['Veja em que região do mundo está o ponto.', `Fica em: ${alvo.paises}.`, `Liga ${alvo.liga[0]} e ${alvo.liga[1]}.`],
    licao: `${alvo.nome}: ${alvo.liga[0]} ↔ ${alvo.liga[1]} (${alvo.paises}).`,
    dados: { pontoId: alvo.id, mostrarNoMapa: true },
  })
}

/** Usado nos testes: classifica o conjunto de características da resposta certa do nível 1. */
export const estagioDasCaracteristicas = (id: string) => classificarIntegracao(exigencias(estagio(id).id)).estagio?.id
