import { useEffect } from 'react'

const SELETOR = '.overflow-x-auto'
const MARCA = 'data-rolagem-teclado'

/**
 * Regiões com rolagem horizontal (tabelas, fórmulas, gráficos largos) só podem ser roladas com as setas do teclado se puderem receber foco.
 * Esta função dá `tabindex="0"`, papel de grupo e nome às que estão transbordando agora, e desfaz isso nas que deixaram de transbordar
 * (por exemplo, ao alargar a janela). Só mexe nos atributos que ela mesma colocou.
 */
export function ajustarRolagemTeclado(raiz: ParentNode = document): void {
  for (const el of raiz.querySelectorAll<HTMLElement>(SELETOR)) {
    const transborda = el.scrollWidth > el.clientWidth + 1
    const nosso = el.hasAttribute(MARCA)
    if (transborda && !nosso && !el.hasAttribute('tabindex')) {
      el.setAttribute(MARCA, '')
      el.tabIndex = 0
      if (!el.hasAttribute('role')) el.setAttribute('role', 'group')
      if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) el.setAttribute('aria-label', 'Conteúdo que rola na horizontal; use as setas do teclado')
    } else if (!transborda && nosso) {
      el.removeAttribute(MARCA)
      el.removeAttribute('tabindex')
      if (el.getAttribute('role') === 'group') el.removeAttribute('role')
      if (el.getAttribute('aria-label')?.startsWith('Conteúdo que rola')) el.removeAttribute('aria-label')
    }
  }
}

const PONTO_MOVEL = '.mafs-movable-point'
const MARCA_PONTO = 'data-ponto-nomeado'

/**
 * Os pontos arrastáveis dos gráficos (Mafs) recebem o foco e andam com as setas, mas não têm nome: um leitor de tela só diria "grupo".
 * Dá a cada um um nome (numerado, quando o gráfico tem mais de um) e papel de grupo, sem mexer nos que já têm nome próprio.
 */
export function nomearPontosMoveis(raiz: ParentNode = document): void {
  const porGrafico = new Map<Element | null, Element[]>()
  for (const ponto of raiz.querySelectorAll(PONTO_MOVEL)) {
    const grafico = ponto.closest('.MafsView')
    porGrafico.set(grafico, [...(porGrafico.get(grafico) ?? []), ponto])
  }
  for (const pontos of porGrafico.values()) {
    pontos.forEach((ponto, i) => {
      const nosso = ponto.hasAttribute(MARCA_PONTO)
      if (ponto.hasAttribute('aria-label') && !nosso) return
      const nome = pontos.length > 1 ? `Ponto móvel ${i + 1} de ${pontos.length}; use as setas do teclado para mover` : 'Ponto móvel; use as setas do teclado para mover'
      ponto.setAttribute(MARCA_PONTO, '')
      ponto.setAttribute('role', 'group')
      ponto.setAttribute('aria-label', nome)
    })
  }
}

/** Mantém `ajustarRolagemTeclado` e `nomearPontosMoveis` em dia quando a página muda ou a janela é redimensionada. */
export function useRolagemTeclado(): void {
  useEffect(() => {
    // setTimeout, e não requestAnimationFrame: abas em segundo plano não desenham quadros, mas os temporizadores continuam
    let espera: ReturnType<typeof setTimeout> | undefined
    const agendar = () => {
      clearTimeout(espera)
      espera = setTimeout(() => {
        ajustarRolagemTeclado()
        nomearPontosMoveis()
      }, 60)
    }
    agendar()
    const mutacoes = new MutationObserver(agendar)
    mutacoes.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', agendar)
    // o conteúdo pode ficar mais largo sem mudar o DOM: quando as fontes (como as das fórmulas) terminam de carregar, ou a página muda de tamanho
    document.fonts?.addEventListener?.('loadingdone', agendar)
    void document.fonts?.ready.then(agendar)
    const tamanho = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(agendar)
    tamanho?.observe(document.body)
    return () => {
      clearTimeout(espera)
      mutacoes.disconnect()
      tamanho?.disconnect()
      window.removeEventListener('resize', agendar)
      document.fonts?.removeEventListener?.('loadingdone', agendar)
    }
  }, [])
}
