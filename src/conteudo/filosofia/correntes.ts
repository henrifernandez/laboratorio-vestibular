/**
 * Correntes da Filosofia e os pensadores de cada uma, para os desafios de ligar, de teses e do intruso.
 * Mesmas regras editoriais dos pensadores: ideias em palavras próprias, sem aspas e sem citações literais.
 */

export interface Corrente {
  id: string
  nome: string
  /** a ideia central, em uma frase */
  sintese: string
  /** teses (paráfrases) que um defensor da corrente aceitaria; cada uma só serve a esta corrente */
  teses: string[]
  /** correntes que podem ser confundidas com esta nas perguntas de tese (não entram como alternativas erradas) */
  parecidas: string[]
}

export const CORRENTES: Corrente[] = [
  {
    id: 'socratico',
    nome: 'Filosofia socrática (diálogo e ética)',
    sintese: 'Filosofar é examinar a si mesmo e aos outros pelo diálogo, reconhecendo a própria ignorância para buscar a virtude.',
    teses: ['O conhecimento começa quando reconhecemos que não sabemos, e se busca pelo diálogo, perguntando e examinando as respostas.', 'A virtude está ligada ao conhecimento do bem, e por isso uma vida sem exame de si mesmo perde o sentido.'],
    parecidas: [],
  },
  {
    id: 'idealismo-platonico',
    nome: 'Idealismo platônico',
    sintese: 'A realidade mais verdadeira é o mundo das Ideias, eterno e inteligível; o mundo sensível é uma cópia imperfeita.',
    teses: ['A realidade verdadeira é o mundo das Ideias, eterno e acessível só à razão; o mundo sensível é uma cópia imperfeita.', 'Conhecer é se libertar das aparências e subir até as Ideias, como quem sai de uma caverna para a luz.', 'O governo ideal caberia a quem conhece o Bem, e não a quem apenas detém riqueza ou força.'],
    parecidas: ['realismo-aristotelico'],
  },
  {
    id: 'realismo-aristotelico',
    nome: 'Realismo aristotélico',
    sintese: 'O conhecimento parte do mundo real e a forma das coisas está nelas mesmas, e não em um mundo separado.',
    teses: ['Toda substância é composta de matéria e forma, e a forma não está em um mundo separado: está na própria coisa.', 'O conhecimento parte da experiência dos sentidos, e a lógica organiza os raciocínios corretos.', 'O ser humano é por natureza um ser político, e a felicidade está em viver segundo a virtude.'],
    parecidas: ['idealismo-platonico'],
  },
  {
    id: 'realismo-politico',
    nome: 'Realismo político',
    sintese: 'A política deve ser analisada como ela é na prática, e o governante precisa de eficácia diante das circunstâncias.',
    teses: ['A política deve ser examinada como funciona na prática, e não como deveria ser em um modelo ideal.', 'O governante precisa de virtù, a capacidade de agir com eficácia, para enfrentar a fortuna, isto é, os acasos da história.'],
    parecidas: [],
  },
  {
    id: 'racionalismo',
    nome: 'Racionalismo',
    sintese: 'A razão é a fonte mais segura do conhecimento, e é preciso duvidar do que não for evidente.',
    teses: ['A razão é a fonte mais segura do conhecimento, e é preciso duvidar de tudo o que não for evidente para chegar a certezas.', 'A primeira certeza é a do próprio pensamento: mesmo duvidando de tudo, quem duvida está pensando e, portanto, existe.', 'A mente possui ideias inatas, que não vêm da experiência.'],
    parecidas: ['idealismo-critico'],
  },
  {
    id: 'empirismo',
    nome: 'Empirismo',
    sintese: 'Todo conhecimento vem da experiência: sensações e hábitos, e não ideias já presentes na mente.',
    teses: ['Todo conhecimento vem da experiência: ao nascer, a mente é como uma folha em branco.', 'Ideias que não podem ser ligadas a impressões vindas da experiência merecem desconfiança.', 'Nunca observamos a causa em si, só um fato seguindo outro várias vezes; é o hábito que nos faz esperar a ligação.'],
    parecidas: ['idealismo-critico'],
  },
  {
    id: 'contratualismo',
    nome: 'Contratualismo',
    sintese: 'O poder político e a sociedade se justificam por um pacto entre os indivíduos.',
    teses: ['O governo e a sociedade política nascem de um acordo entre os indivíduos, e não de uma ordem divina ou natural.', 'O pacto social justifica o poder político e define seus limites.'],
    parecidas: ['iluminismo'],
  },
  {
    id: 'iluminismo',
    nome: 'Iluminismo',
    sintese: 'Confiança na razão, na liberdade de pensar e no progresso, contra a superstição e o dogma.',
    teses: ['A razão e a liberdade de pensar devem guiar a vida humana, contra a superstição e o dogma.', 'O progresso do conhecimento e a educação podem melhorar a sociedade.', 'O poder dos governantes deve ser limitado por leis e pelos direitos dos indivíduos.'],
    parecidas: ['contratualismo', 'idealismo-critico'],
  },
  {
    id: 'idealismo-critico',
    nome: 'Criticismo kantiano (idealismo crítico)',
    sintese: 'Conhecemos o mundo como ele aparece à nossa mente, que molda a experiência; e a moral se baseia no dever.',
    teses: ['O conhecimento resulta da união entre o que a experiência fornece e as formas que a própria mente impõe: só conhecemos fenômenos, e não a coisa em si.', 'A ação moral vale pelo dever, e não pelas consequências: deve seguir uma regra que pudesse valer para todos.'],
    parecidas: ['racionalismo', 'empirismo', 'iluminismo'],
  },
  {
    id: 'materialismo-historico',
    nome: 'Materialismo histórico',
    sintese: 'A forma de produzir a vida material condiciona a política, a cultura e as ideias; a história é movida pela luta de classes.',
    teses: ['A forma como a sociedade produz a vida material condiciona a política, a cultura e as ideias de cada época.', 'A história é movida pela luta entre classes sociais com interesses opostos.'],
    parecidas: [],
  },
  {
    id: 'genealogia',
    nome: 'Crítica da moral e da metafísica (genealogia)',
    sintese: 'Os valores têm história e origem; é preciso investigar de onde vêm e a quem serviram.',
    teses: ['Os valores morais têm história e origem, e não são verdades eternas: é preciso investigar como surgiram e a quem serviram.', 'A moral dominante pode ter nascido do ressentimento dos fracos, e cabe criar valores que afirmem a vida.'],
    parecidas: [],
  },
  {
    id: 'existencialismo',
    nome: 'Existencialismo',
    sintese: 'A existência precede a essência: cada pessoa se define por suas escolhas e responde por elas.',
    teses: ['A existência vem antes da essência: não há natureza humana pronta, e cada pessoa se define pelo que escolhe fazer.', 'Somos livres e, por isso, responsáveis por nossas escolhas, e não podemos nos desculpar com a natureza ou com o destino.'],
    parecidas: [],
  },
  {
    id: 'filosofia-politica-sec-xx',
    nome: 'Filosofia política do século XX (ação e espaço público)',
    sintese: 'A política nasce da ação e do diálogo entre pessoas no espaço público; o totalitarismo destrói essa possibilidade.',
    teses: ['A política depende da ação em conjunto e do diálogo no espaço público, e o totalitarismo destrói essa possibilidade.', 'Males enormes podem ser cometidos por pessoas comuns que deixam de pensar, e não apenas por pessoas monstruosas.'],
    parecidas: [],
  },
]

export const correnteDe = (id: string) => CORRENTES.find((c) => c.id === id)

/** Corrente mais associada a cada pensador e as demais correntes a que ele também costuma ser ligado nos manuais. */
export const CORRENTE_DOS_PENSADORES: Record<string, { principal: string; tambem: string[] }> = {
  socrates: { principal: 'socratico', tambem: [] },
  platao: { principal: 'idealismo-platonico', tambem: [] },
  aristoteles: { principal: 'realismo-aristotelico', tambem: [] },
  maquiavel: { principal: 'realismo-politico', tambem: [] },
  descartes: { principal: 'racionalismo', tambem: [] },
  hobbes: { principal: 'contratualismo', tambem: [] },
  locke: { principal: 'empirismo', tambem: ['contratualismo', 'iluminismo'] },
  rousseau: { principal: 'contratualismo', tambem: ['iluminismo'] },
  hume: { principal: 'empirismo', tambem: ['iluminismo'] },
  kant: { principal: 'idealismo-critico', tambem: ['iluminismo'] },
  marx: { principal: 'materialismo-historico', tambem: [] },
  nietzsche: { principal: 'genealogia', tambem: [] },
  sartre: { principal: 'existencialismo', tambem: [] },
  arendt: { principal: 'filosofia-politica-sec-xx', tambem: [] },
}

/** Todas as correntes a que um pensador pode ser ligado. */
export const correntesAceitas = (pensadorId: string): string[] => {
  const c = CORRENTE_DOS_PENSADORES[pensadorId]
  return c ? [c.principal, ...c.tambem] : []
}

/** Grupos para a pergunta do intruso: três ou mais membros e pensadores que ficam de fora por poderem gerar dúvida. */
export interface GrupoIntruso {
  id: string
  nome: string
  membros: string[]
  /** pensadores que não entram como intruso porque poderiam, a depender do manual, pertencer ao grupo */
  duvidosos: string[]
  nota: string
}

export const GRUPOS_INTRUSO: GrupoIntruso[] = [
  { id: 'antiga', nome: 'filosofia antiga (Grécia)', membros: ['socrates', 'platao', 'aristoteles'], duvidosos: [], nota: 'Sócrates, Platão e Aristóteles viveram na Grécia antiga, entre os séculos V e IV a.C.' },
  { id: 'contemporanea', nome: 'filosofia contemporânea (séculos XIX e XX)', membros: ['marx', 'nietzsche', 'sartre', 'arendt'], duvidosos: [], nota: 'Marx, Nietzsche, Sartre e Arendt viveram entre os séculos XIX e XX.' },
  { id: 'contratualismo', nome: 'contratualismo', membros: ['hobbes', 'locke', 'rousseau'], duvidosos: ['kant'], nota: 'Hobbes, Locke e Rousseau explicam o poder político por um pacto entre os indivíduos.' },
  { id: 'iluminismo', nome: 'Iluminismo', membros: ['locke', 'hume', 'rousseau', 'kant'], duvidosos: ['hobbes', 'descartes', 'marx', 'maquiavel'], nota: 'Locke, Hume, Rousseau e Kant são ligados ao Iluminismo, com a confiança na razão e na liberdade de pensar.' },
]
