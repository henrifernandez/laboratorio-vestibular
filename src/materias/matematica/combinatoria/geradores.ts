import type { ErroTipico, InstanciaMulti, InstanciaNum } from '@/desafios/simples'
import type { Nivel } from '@/desafios/tipos'
import { embaralhar, escolher, sortear, type Rng } from '@/lib/rng'
import { anagramas, arranjo, combinacao, fatorial, permutacaoComRepeticao } from './calculo'

export type TipoContagem = 'pfc' | 'arranjo' | 'combinacao' | 'permutacao' | 'permrep'

export const NOME_TIPO: Record<TipoContagem, string> = {
  pfc: 'Princípio multiplicativo',
  arranjo: 'Arranjo',
  combinacao: 'Combinação',
  permutacao: 'Permutação',
  permrep: 'Permutação com repetição',
}

export const REGRA_TIPO: Record<TipoContagem, string> = {
  pfc: 'Escolhas em etapas, de categorias diferentes: multiplique as possibilidades de cada etapa.',
  arranjo: 'Escolhem-se p de n elementos distintos e a ordem importa: A(n, p) = n!/(n − p)!.',
  combinacao: 'Escolhem-se p de n elementos e a ordem não importa: C(n, p) = n!/(p!·(n − p)!).',
  permutacao: 'Todos os n elementos entram, só muda a ordem: n!.',
  permrep: 'Todos os elementos entram, mas alguns se repetem: n!/(a!·b!·…).',
}

export interface Problema {
  tipo: TipoContagem
  /** composto = duas combinações multiplicadas (conta como combinação/PFC) */
  composto?: boolean
  texto: string
  resposta: number
  resolucao: string
  erros: ErroTipico[]
  /** "trocar" os elementos gera outra possibilidade? descrição do teste de ordem */
  testeOrdem: string
}

const NOMES = ['Ana', 'Bia', 'Caio', 'Davi', 'Eva', 'Fábio', 'Gabi', 'Hugo']
const PALAVRAS = ['ARARA', 'BANANA', 'CASACA', 'PARALELA', 'MATEMATICA', 'OVO', 'ARITMETICA']

function pfc(rng: Rng): Problema {
  const a = sortear(rng, 2, 5)
  const b = sortear(rng, 2, 5)
  const c = sortear(rng, 2, 4)
  const r = a * b * c
  return {
    tipo: 'pfc',
    texto: `Uma lanchonete oferece ${a} tipos de pão, ${b} de recheio e ${c} de molho. Quantos sanduíches diferentes é possível montar, escolhendo um de cada?`,
    resposta: r,
    resolucao: `Três escolhas independentes: ${a} × ${b} × ${c} = ${r}.`,
    erros: [{ valor: a + b + c, frase: `Você somou as opções (${a} + ${b} + ${c}). Como o sanduíche leva um de cada categoria, as escolhas se combinam: multiplique.`, motivo: 'somou em vez de multiplicar' }],
    testeOrdem: 'cada escolha vem de uma categoria diferente (pão, recheio, molho): não há "ordem" a trocar',
  }
}

function pfcRoupas(rng: Rng): Problema {
  const a = sortear(rng, 3, 6)
  const b = sortear(rng, 2, 5)
  const c = sortear(rng, 2, 4)
  return {
    tipo: 'pfc',
    texto: `Júlia tem ${a} camisetas, ${b} calças e ${c} pares de tênis. De quantas maneiras diferentes ela pode se vestir usando uma peça de cada?`,
    resposta: a * b * c,
    resolucao: `${a} × ${b} × ${c} = ${a * b * c}.`,
    erros: [{ valor: a + b + c, frase: 'Você somou. Para cada camiseta há todas as calças e, para cada combinação, todos os tênis: multiplica.', motivo: 'somou em vez de multiplicar' }],
    testeOrdem: 'camiseta, calça e tênis são categorias diferentes: não faz sentido trocar a ordem',
  }
}

function permutacao(rng: Rng): Problema {
  const n = sortear(rng, 4, 7)
  return {
    tipo: 'permutacao',
    texto: `De quantas formas ${n} pessoas podem se sentar em uma fila de ${n} cadeiras?`,
    resposta: fatorial(n),
    resolucao: `Todas as ${n} pessoas entram e só muda a ordem: ${n}! = ${fatorial(n)}.`,
    erros: [
      { valor: n * n, frase: `Você calculou ${n} × ${n}. A cada pessoa que senta, sobra uma opção a menos: ${n} × ${n - 1} × … × 1 = ${n}!.`, motivo: 'esqueceu que as opções diminuem' },
      { valor: fatorial(n - 1), frase: `Você calculou ${n - 1}!. Todas as ${n} pessoas precisam ser colocadas: ${n}!.`, motivo: 'fatorial do número errado' },
    ],
    testeOrdem: 'todas as pessoas entram e trocar quem senta onde gera uma fila diferente',
  }
}

function arranjoPodio(rng: Rng): Problema {
  const n = sortear(rng, 5, 9)
  return {
    tipo: 'arranjo',
    texto: `${n} atletas disputam uma final. De quantas formas podem ser distribuídas as medalhas de ouro, prata e bronze (uma para cada atleta)?`,
    resposta: arranjo(n, 3),
    resolucao: `Escolhem-se 3 dos ${n} atletas e a ordem importa (ouro ≠ prata ≠ bronze): A(${n}, 3) = ${n}·${n - 1}·${n - 2} = ${arranjo(n, 3)}.`,
    erros: [
      { valor: combinacao(n, 3), frase: `Você calculou C(${n}, 3), que ignora a ordem. Aqui "João ouro e Maria prata" é diferente de "Maria ouro e João prata": a ordem importa.`, motivo: 'usou combinação onde a ordem importa' },
      { valor: n ** 3, frase: `Você calculou ${n}³, como se o mesmo atleta pudesse ganhar mais de uma medalha. Cada atleta recebe uma só.`, motivo: 'permitiu repetição' },
    ],
    testeOrdem: 'trocar quem ganhou ouro e quem ganhou prata muda o resultado: a ordem importa',
  }
}

function arranjoSenha(): Problema {
  return {
    tipo: 'arranjo',
    texto: 'Quantas senhas de 4 algarismos distintos podem ser formadas com os algarismos de 0 a 9?',
    resposta: arranjo(10, 4),
    resolucao: 'Escolhem-se 4 dos 10 algarismos e a ordem importa (1234 ≠ 4321): A(10, 4) = 10·9·8·7 = 5040.',
    erros: [
      { valor: combinacao(10, 4), frase: 'Você calculou C(10, 4), que ignora a ordem. Em uma senha, 1234 e 4321 são senhas diferentes.', motivo: 'usou combinação onde a ordem importa' },
      { valor: 10 ** 4, frase: 'Você calculou 10⁴, que permite algarismos repetidos. O enunciado pede algarismos distintos.', motivo: 'permitiu repetição' },
    ],
    testeOrdem: 'a senha 1234 é diferente da 4321: a ordem importa',
  }
}

function combinacaoComissao(rng: Rng): Problema {
  const n = sortear(rng, 6, 10)
  const p = sortear(rng, 2, 4)
  return {
    tipo: 'combinacao',
    texto: `De um grupo de ${n} alunos, quantas comissões de ${p} pessoas podem ser formadas?`,
    resposta: combinacao(n, p),
    resolucao: `Escolhem-se ${p} dos ${n} alunos e a ordem não importa (a comissão {${NOMES.slice(0, p).join(', ')}} é a mesma em qualquer ordem): C(${n}, ${p}) = ${combinacao(n, p)}.`,
    erros: [
      { valor: arranjo(n, p), frase: `Você calculou A(${n}, ${p}), que conta cada ordem como uma comissão diferente. Em uma comissão não há cargos: só quem participa.`, motivo: 'usou arranjo onde a ordem não importa' },
      { valor: n * p, frase: `Você calculou ${n} × ${p}. Para comissões, conte os subconjuntos de ${p} entre ${n}: C(${n}, ${p}).`, motivo: 'fórmula errada' },
    ],
    testeOrdem: 'a comissão formada por Ana, Bia e Caio é a mesma em qualquer ordem: a ordem não importa',
  }
}

function combinacaoLivros(rng: Rng): Problema {
  const n = sortear(rng, 6, 9)
  const p = sortear(rng, 2, 4)
  return {
    tipo: 'combinacao',
    texto: `Pedro tem ${n} livros e quer levar ${p} deles para a viagem. De quantas maneiras pode escolher quais levar?`,
    resposta: combinacao(n, p),
    resolucao: `Ele escolhe ${p} dos ${n} livros e a ordem não importa: C(${n}, ${p}) = ${combinacao(n, p)}.`,
    erros: [{ valor: arranjo(n, p), frase: `Você calculou A(${n}, ${p}), que conta a ordem. Levar os livros A e B é o mesmo que levar B e A.`, motivo: 'usou arranjo onde a ordem não importa' }],
    testeOrdem: 'levar o livro A e o livro B é o mesmo que levar B e A: a ordem não importa',
  }
}

function permrep(rng: Rng): Problema {
  const palavra = escolher(rng, PALAVRAS)
  const cont = new Map<string, number>()
  for (const c of palavra) cont.set(c, (cont.get(c) ?? 0) + 1)
  const rep = [...cont.entries()].filter(([, v]) => v > 1)
  const r = anagramas(palavra)
  return {
    tipo: 'permrep',
    texto: `Quantos anagramas (permutações das letras, com sentido ou não) tem a palavra ${palavra}?`,
    resposta: r,
    resolucao: `A palavra tem ${palavra.length} letras${rep.length ? `, com ${rep.map(([l, v]) => `${v} letras ${l}`).join(' e ')}` : ''}. Anagramas = ${palavra.length}!/(${rep.map(([, v]) => `${v}!`).join('·') || '1'}) = ${r}.`,
    erros: [{ valor: fatorial(palavra.length), frase: `Você calculou ${palavra.length}!, que trata as letras repetidas como se fossem diferentes. Divida pelo fatorial das repetições (${rep.map(([l, v]) => `${v}! para o ${l}`).join(', ')}).`, motivo: 'ignorou as letras repetidas' }].filter((e) => e.valor !== r),
    testeOrdem: 'todas as letras entram e só muda a ordem, mas há letras repetidas que não geram anagramas novos ao trocar',
  }
}

function composto(rng: Rng): Problema {
  const h = sortear(rng, 4, 6)
  const m = sortear(rng, 3, 5)
  const r = combinacao(h, 2) * combinacao(m, 1)
  return {
    tipo: 'combinacao',
    composto: true,
    texto: `Em uma sala há ${h} meninos e ${m} meninas. Quantas comissões de 3 pessoas, com 2 meninos e 1 menina, podem ser formadas?`,
    resposta: r,
    resolucao: `Escolhem-se 2 dos ${h} meninos (C(${h}, 2) = ${combinacao(h, 2)}) e 1 das ${m} meninas (C(${m}, 1) = ${m}); as escolhas são independentes, então multiplicam: ${combinacao(h, 2)} × ${m} = ${r}.`,
    erros: [
      { valor: combinacao(h + m, 3), frase: `Você calculou C(${h + m}, 3), que não respeita "2 meninos e 1 menina". Faça uma escolha para os meninos e outra para as meninas, e multiplique.`, motivo: 'ignorou a restrição de grupos' },
      { valor: combinacao(h, 2) + m, frase: 'Você somou as duas escolhas. Elas acontecem juntas, então multiplicam.', motivo: 'somou em vez de multiplicar' },
    ].filter((e) => e.valor !== r),
    testeOrdem: 'em cada grupo escolhido, a ordem não importa: usa-se combinação em cada etapa e multiplica',
  }
}

function arranjoCadeiras(rng: Rng): Problema {
  const n = sortear(rng, 6, 8)
  const p = sortear(rng, 3, 4)
  return {
    tipo: 'arranjo',
    texto: `${n} pessoas disputam ${p} cadeiras numeradas (cada cadeira recebe uma pessoa). De quantas formas as cadeiras podem ser ocupadas?`,
    resposta: arranjo(n, p),
    resolucao: `Escolhem-se ${p} das ${n} pessoas e a ordem importa (cadeiras numeradas): A(${n}, ${p}) = ${arranjo(n, p)}.`,
    erros: [{ valor: combinacao(n, p), frase: `Você calculou C(${n}, ${p}), que só diz quem senta. Como as cadeiras são numeradas, também importa quem fica em cada uma.`, motivo: 'usou combinação onde a ordem importa' }],
    testeOrdem: 'trocar duas pessoas de cadeira (numeradas) gera uma configuração diferente: a ordem importa',
  }
}

const POR_NIVEL: Record<Nivel, ((rng: Rng) => Problema)[]> = {
  1: [pfc, pfcRoupas, permutacao],
  2: [arranjoPodio, arranjoSenha, combinacaoComissao, combinacaoLivros],
  3: [permrep, composto, arranjoCadeiras, permrep],
}

export function sortearProblema(rng: Rng, nivel: Nivel): Problema {
  return (escolher(rng, POR_NIVEL[nivel]) as (rng: Rng) => Problema)(rng)
}

/* ------------------------------------------------------------------ classificar */

export interface DadosClassificar {
  problema: Problema
}

export function gerarClassificar(rng: Rng, nivel: Nivel): InstanciaMulti<DadosClassificar> {
  const p = sortearProblema(rng, nivel)
  const tipoCerto: TipoContagem = p.composto ? 'pfc' : p.tipo
  const tipos = (nivel === 3 ? ['pfc', 'arranjo', 'combinacao', 'permutacao', 'permrep'] : nivel === 1 ? ['pfc', 'arranjo', 'combinacao', 'permutacao'] : ['pfc', 'arranjo', 'combinacao', 'permutacao']) as TipoContagem[]
  const rotulo = (t: TipoContagem) => (p.composto && t === 'pfc' ? 'Princípio multiplicativo (com combinações em cada etapa)' : NOME_TIPO[t])
  const porque: Record<string, string> = {}
  const motivo: Record<string, string> = {}
  for (const t of tipos) {
    if (t === tipoCerto) porque[t] = `Isso! ${REGRA_TIPO[t]} Aqui: ${p.testeOrdem}.`
    else {
      motivo[t] = `confundiu ${NOME_TIPO[t].toLowerCase()} com ${NOME_TIPO[tipoCerto].toLowerCase()}`
      porque[t] = `Não é ${NOME_TIPO[t].toLowerCase()}. ${REGRA_TIPO[t]} Aqui, ${p.testeOrdem}. Então é ${NOME_TIPO[tipoCerto].toLowerCase()}.`
    }
  }
  return {
    enunciado: `${p.texto} (Não calcule: só classifique o problema.)`,
    opcoes: embaralhar(rng, tipos).map((t) => ({ id: t, rotulo: rotulo(t) })),
    certa: tipoCerto,
    porque,
    motivo,
    resolucao: `${REGRA_TIPO[tipoCerto]} Aqui: ${p.testeOrdem}. (Para calcular: ${p.resolucao})`,
    dicas: [
      'Pergunte: todos os elementos entram, ou escolhemos só alguns? E há etapas de categorias diferentes?',
      'Teste da ordem: se trocar a ordem dos elementos escolhidos gera uma situação diferente, a ordem importa (arranjo); senão, combinação.',
      p.testeOrdem.charAt(0).toUpperCase() + p.testeOrdem.slice(1) + '.',
    ],
    licao: 'ordem importa → arranjo; ordem não importa → combinação; todos entram → permutação; etapas diferentes → multiplicar',
    dados: { problema: p },
  }
}

/* ------------------------------------------------------------------ contar */

export function gerarContar(rng: Rng, nivel: Nivel): InstanciaNum<DadosClassificar> {
  const p = sortearProblema(rng, nivel)
  return {
    enunciado: p.texto,
    resposta: p.resposta,
    tolerancia: 0.001,
    erros: p.erros.filter((e) => e.valor !== p.resposta),
    resolucao: p.resolucao,
    dicas: [
      'Primeiro classifique: a ordem importa? Todos os elementos entram? Há etapas diferentes?',
      REGRA_TIPO[p.composto ? 'pfc' : p.tipo],
      `Teste: ${p.testeOrdem}.`,
    ],
    licao: REGRA_TIPO[p.composto ? 'pfc' : p.tipo],
    dados: { problema: p },
  }
}

/* ------------------------------------------------------------------ probabilidade */

const mdc = (a: number, b: number): number => (b === 0 ? a : mdc(b, a % b))
export const fracao = (num: number, den: number) => {
  const g = mdc(num, den)
  return den / g === 1 ? `${num / g}` : `${num / g}/${den / g}`
}
const arred = (x: number) => Math.round(x * 10000) / 10000

export interface DadosProb {
  descricao: string
}

export function gerarProbabilidade(rng: Rng, nivel: Nivel): InstanciaNum<DadosProb> {
  const ajuda = 'Você pode digitar fração (1/6) ou decimal (0,1667).'
  if (nivel === 1) {
    const caso = sortear(rng, 0, 2)
    if (caso === 0) {
      const k = sortear(rng, 2, 5)
      const fav = 6 - k + 1
      return {
        enunciado: `Um dado honesto de 6 faces é lançado. Qual é a probabilidade de sair um número maior ou igual a ${k}? ${ajuda}`,
        resposta: arred(fav / 6),
        tolerancia: 0.0006,
        erros: [{ valor: arred((k - 1) / 6), frase: `Você contou os números menores que ${k}. Os favoráveis são ${k}, …, 6 (${fav} números).`, motivo: 'contou os casos errados' }].filter((e) => Math.abs(e.valor - fav / 6) > 0.0006),
        resolucao: `Favoráveis: ${fav} (de ${k} a 6). Possíveis: 6. P = ${fracao(fav, 6)} ≈ ${String(arred(fav / 6)).replace('.', ',')}.`,
        dicas: ['Probabilidade = casos favoráveis ÷ casos possíveis.', 'Liste os números do dado que atendem ao pedido.', `São ${fav} favoráveis entre 6 possíveis.`],
        licao: 'P = casos favoráveis ÷ casos possíveis',
        dados: { descricao: 'dado' },
      }
    }
    if (caso === 1) {
      const n = sortear(rng, 2, 3)
      return {
        enunciado: `Uma moeda honesta é lançada ${n} vezes. Qual é a probabilidade de sair cara em todos os lançamentos? ${ajuda}`,
        resposta: arred(1 / 2 ** n),
        tolerancia: 0.0006,
        erros: [{ valor: arred(1 / 2), frase: 'Você usou a probabilidade de um só lançamento. Os lançamentos são independentes: multiplique as probabilidades de cada um.', motivo: 'esqueceu de multiplicar os lançamentos' }],
        resolucao: `Cada lançamento dá cara com probabilidade 1/2, e os lançamentos são independentes: (1/2)^${n} = 1/${2 ** n}.`,
        dicas: ['Os lançamentos não influenciam um ao outro (eventos independentes).', 'Para "e" com eventos independentes, multiplique as probabilidades.', `(1/2) × … (${n} vezes).`],
        licao: 'eventos independentes: P(A e B) = P(A)·P(B)',
        dados: { descricao: 'moeda' },
      }
    }
    const v = sortear(rng, 2, 5)
    const a = sortear(rng, 2, 5)
    const t = v + a + sortear(rng, 1, 3)
    return {
      enunciado: `Uma urna tem ${v} bolas vermelhas, ${a} azuis e ${t - v - a} verdes. Sorteando uma bola ao acaso, qual é a probabilidade de ela ser vermelha? ${ajuda}`,
      resposta: arred(v / t),
      tolerancia: 0.0006,
      erros: [{ valor: arred(v / (t - v)), frase: 'Você comparou vermelhas com as bolas de outra cor. A probabilidade usa o total de bolas na urna como denominador.', motivo: 'denominador errado' }].filter((e) => Math.abs(e.valor - v / t) > 0.0006),
      resolucao: `Favoráveis: ${v}. Total de bolas: ${t}. P = ${fracao(v, t)}.`,
      dicas: ['Probabilidade = favoráveis ÷ total.', 'O total é a soma de todas as bolas.', `Total: ${v} + ${a} + ${t - v - a} = ${t}.`],
      licao: 'P = casos favoráveis ÷ casos possíveis',
      dados: { descricao: 'urna' },
    }
  }
  if (nivel === 2) {
    if (rng() < 0.5) {
      const r = sortear(rng, 3, 5)
      const b = sortear(rng, 2, 4)
      const t = r + b
      const p = (r / t) * ((r - 1) / (t - 1))
      return {
        enunciado: `Uma urna tem ${r} bolas vermelhas e ${b} azuis. Duas bolas são sorteadas, uma de cada vez, SEM devolver a primeira. Qual é a probabilidade de ambas serem vermelhas? ${ajuda}`,
        resposta: arred(p),
        tolerancia: 0.0006,
        erros: [{ valor: arred((r / t) ** 2), frase: 'Você considerou que a primeira bola volta para a urna (com reposição). Sem reposição, a segunda extração acontece com uma bola a menos, vermelha ou não.', motivo: 'ignorou que não há reposição' }],
        resolucao: `1ª vermelha: ${r}/${t}. Com ela fora da urna, sobram ${r - 1} vermelhas em ${t - 1}: ${r - 1}/${t - 1}. P = (${r}/${t})·(${r - 1}/${t - 1}) = ${fracao(r * (r - 1), t * (t - 1))}.`,
        dicas: ['Sem reposição: a composição da urna muda depois da primeira bola.', 'Multiplique a probabilidade da 1ª pela da 2ª, já com a urna alterada.', `Depois de tirar uma vermelha, restam ${r - 1} vermelhas entre ${t - 1} bolas.`],
        licao: 'sem reposição, a 2ª probabilidade usa a urna já modificada',
        dados: { descricao: 'urna sem reposição' },
      }
    }
    const s = sortear(rng, 5, 9)
    const fav = s <= 7 ? s - 1 : 13 - s
    return {
      enunciado: `Dois dados honestos são lançados. Qual é a probabilidade de a soma dos resultados ser ${s}? ${ajuda}`,
      resposta: arred(fav / 36),
      tolerancia: 0.0006,
      erros: [{ valor: arred(fav / 12), frase: 'Você usou 12 como total (6 + 6). Com dois dados há 6 × 6 = 36 resultados possíveis (pares ordenados).', motivo: 'total de casos errado' }],
      resolucao: `Casos possíveis: 6 × 6 = 36. Pares com soma ${s}: ${fav}. P = ${fracao(fav, 36)}.`,
      dicas: ['Conte os pares (dado 1, dado 2) possíveis: 6 × 6.', `Liste os pares cuja soma é ${s}.`, `Há ${fav} pares com soma ${s}.`],
      licao: 'dois dados: 36 resultados equiprováveis (pares ordenados)',
      dados: { descricao: 'dois dados' },
    }
  }
  const caso = sortear(rng, 0, 1)
  if (caso === 0) {
    const n = sortear(rng, 3, 4)
    return {
      enunciado: `Uma moeda honesta é lançada ${n} vezes. Qual é a probabilidade de sair pelo menos uma cara? ${ajuda}`,
      resposta: arred(1 - 1 / 2 ** n),
      tolerancia: 0.0006,
      erros: [{ valor: arred(1 / 2 ** n), frase: 'Esse é o valor de "nenhuma cara". "Pelo menos uma" é o complementar: 1 menos a probabilidade de nenhuma.', motivo: 'esqueceu o complementar' }],
      resolucao: `"Pelo menos uma cara" é o complementar de "nenhuma cara" (só coroas): P = 1 − (1/2)^${n} = 1 − 1/${2 ** n} = ${fracao(2 ** n - 1, 2 ** n)}.`,
      dicas: ['"Pelo menos um" costuma ser mais fácil pelo complementar.', 'Calcule a probabilidade de nenhuma cara (todas coroas).', 'Subtraia de 1.'],
      licao: 'pelo menos um: P = 1 − P(nenhum)',
      dados: { descricao: 'complementar' },
    }
  }
  return {
    enunciado: `Um dado honesto é lançado 2 vezes. Qual é a probabilidade de sair pelo menos um 6? ${ajuda}`,
    resposta: arred(11 / 36),
    tolerancia: 0.0006,
    erros: [
      { valor: arred(2 / 6), frase: 'Você somou 1/6 + 1/6. Os eventos "6 no 1º" e "6 no 2º" não são exclusivos (podem ocorrer juntos), então somar conta o caso (6, 6) duas vezes.', motivo: 'somou eventos não exclusivos' },
      { valor: arred(25 / 36), frase: 'Esse é o valor de "nenhum 6". "Pelo menos um" é o complementar: 1 − 25/36.', motivo: 'esqueceu o complementar' },
    ],
    resolucao: 'Nenhum 6: (5/6)·(5/6) = 25/36. Pelo menos um 6 = 1 − 25/36 = 11/36.',
    dicas: ['Use o complementar: "pelo menos um 6" é o contrário de "nenhum 6".', 'Probabilidade de não sair 6 em um lançamento: 5/6. São dois lançamentos independentes.', '1 − (5/6)².'],
    licao: 'pelo menos um: P = 1 − P(nenhum)',
    dados: { descricao: 'complementar' },
  }
}

/* ------------------------------------------------------------------ frequência x probabilidade */

export interface DadosFreq {
  tema: string
}

export function gerarFrequencia(rng: Rng, nivel: Nivel): InstanciaMulti<DadosFreq> {
  if (nivel === 1) {
    const caras = sortear(rng, 6, 8)
    return {
      enunciado: `Uma moeda honesta é lançada 10 vezes e saem ${caras} caras (${caras * 10}%). Se ela for lançada 10.000 vezes, o que se espera para a frequência relativa de caras?`,
      opcoes: embaralhar(rng, [
        { id: 'meio', rotulo: 'Perto de 50%' },
        { id: 'igual', rotulo: `Perto de ${caras * 10}%, como no início` },
        { id: 'exato', rotulo: 'Exatamente 5.000 caras' },
        { id: 'mais', rotulo: `Mais de ${caras * 10}%, porque a moeda "pega o jeito"` },
      ]),
      certa: 'meio',
      porque: {
        meio: 'Isso! Com muitos lançamentos, a frequência relativa se aproxima da probabilidade teórica (50%). É a lei dos grandes números.',
        igual: `Com poucos lançamentos a frequência varia muito (${caras * 10}% é normal em 10 lançamentos). Com 10.000, as variações se diluem e a frequência fica perto de 50%.`,
        exato: 'A frequência fica perto de 50%, mas não exatamente: o número de caras flutua em torno de 5.000, sem garantia de acertar o valor exato.',
        mais: 'A moeda não "aprende": cada lançamento é independente. O que acontece é que a frequência relativa se aproxima de 50%.',
      },
      motivo: { igual: 'achou que a frequência inicial se mantém', exato: 'esperou um valor exato', mais: 'achou que a moeda tem memória' },
      resolucao: 'Lei dos grandes números: quanto mais repetições, mais a frequência relativa se aproxima da probabilidade teórica. Em 10 lançamentos é normal ver 70% de caras; em 10.000, a proporção fica bem perto de 50%.',
      dicas: ['Pense: poucos lançamentos variam muito; muitos lançamentos "se compensam".', 'A frequência relativa tende à probabilidade teórica quando o número de repetições cresce.', 'A probabilidade teórica de cara é 1/2 = 50%.'],
      licao: 'lei dos grandes números: a frequência relativa tende à probabilidade',
      dados: { tema: 'lei dos grandes números' },
    }
  }
  if (nivel === 2) {
    return {
      enunciado: 'Num dado honesto, a probabilidade teórica de sair 6 é 1/6 (≈ 16,7%). Em qual situação a frequência relativa de 6 tende a ficar MAIS perto de 16,7%?',
      opcoes: embaralhar(rng, [
        { id: 'muitos', rotulo: '6.000 lançamentos' },
        { id: 'poucos', rotulo: '12 lançamentos' },
        { id: 'igual', rotulo: 'O número de lançamentos não faz diferença' },
        { id: 'seis', rotulo: '6 lançamentos, porque o dado tem 6 faces' },
      ]),
      certa: 'muitos',
      porque: {
        muitos: 'Isso! Quanto maior o número de lançamentos, mais a frequência relativa se aproxima da probabilidade teórica.',
        poucos: 'Com poucos lançamentos, a frequência oscila muito (em 12 lançamentos é normal sair 6 uma ou quatro vezes, 8% ou 33%).',
        igual: 'Faz diferença, sim: as oscilações da frequência relativa diminuem quando o número de repetições aumenta.',
        seis: 'O número de faces não determina a quantidade ideal de lançamentos. Precisamos de muitos lançamentos para a frequência se estabilizar.',
      },
      motivo: { poucos: 'achou que poucos lançamentos bastam', igual: 'ignorou o efeito do número de repetições', seis: 'confundiu o número de faces com o de lançamentos' },
      resolucao: 'Quanto maior a amostra, menor a variação da frequência relativa em torno da probabilidade teórica.',
      dicas: ['Imagine repetir o experimento muitas vezes: as variações pequenas se diluem.', 'Frequência relativa = (vezes que saiu 6) ÷ (lançamentos).', 'Mais lançamentos → mais estável.'],
      licao: 'mais repetições → frequência relativa mais próxima da probabilidade',
      dados: { tema: 'estabilidade' },
    }
  }
  const seq = sortear(rng, 4, 6)
  return {
    enunciado: `Uma moeda honesta caiu cara ${seq} vezes seguidas. Qual é a probabilidade de sair cara no próximo lançamento?`,
    opcoes: embaralhar(rng, [
      { id: 'meio', rotulo: '1/2, como em qualquer lançamento' },
      { id: 'menor', rotulo: 'Menor que 1/2: agora "deve" sair coroa para compensar' },
      { id: 'maior', rotulo: 'Maior que 1/2: a moeda está "viciada" em cara' },
      { id: 'pot', rotulo: `1/${2 ** (seq + 1)}, pois seriam ${seq + 1} caras seguidas` },
    ]),
    certa: 'meio',
    porque: {
      meio: 'Isso! Os lançamentos são independentes: a moeda não tem memória. O próximo lançamento tem probabilidade 1/2, não importa o que saiu antes.',
      menor: 'Esse é o erro do apostador: achar que a sorte "compensa". Cada lançamento é independente.',
      maior: 'Com uma moeda honesta, uma sequência de caras não a torna viciada: cada lançamento continua com probabilidade 1/2.',
      pot: `1/${2 ** (seq + 1)} seria a probabilidade de sair ${seq + 1} caras seguidas, antes de lançar. Mas as ${seq} primeiras já aconteceram: resta só o próximo, com probabilidade 1/2.`,
    },
    motivo: { menor: 'falácia do apostador', maior: 'achou que a moeda estava viciada', pot: 'confundiu probabilidade condicional com a da sequência inteira' },
    resolucao: 'Eventos independentes: o resultado anterior não altera o próximo. A probabilidade de cara continua 1/2.',
    dicas: ['A moeda tem memória?', 'Lançamentos independentes: P(próximo | anteriores) = P(próximo).', 'A probabilidade de cara em um lançamento honesto é 1/2.'],
    licao: 'lançamentos independentes: o passado não muda a probabilidade do próximo',
    dados: { tema: 'independência' },
  }
}

export { permutacaoComRepeticao }
