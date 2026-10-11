import { useEffect, useState, type ReactNode } from 'react'
import { Coordinates, Mafs } from 'mafs'

export interface JanelaMundo {
  xmin: number
  xmax: number
  ymin: number
  ymax: number
}

interface Props {
  janela: JanelaMundo
  rotulo: string
  children?: ReactNode
  /** mudar esta chave volta o zoom e o deslocamento ao início */
  chaveReinicio?: number
  grade?: boolean
  zoom?: boolean
  /** espaçamento das linhas da grade em cada eixo (padrão: 1) */
  passoX?: number
  passoY?: number
  /** altura em pixels (padrão: responsiva) */
  altura?: number
  /** mantém a proporção entre os eixos (círculos continuam círculos) */
  proporcao?: boolean
}

/** Altura da cena: menor no celular para sobrar espaço para os controles. */
function useAltura() {
  const calc = () => (typeof window !== 'undefined' && window.innerWidth < 640 ? 320 : 440)
  const [h, setH] = useState(calc)
  useEffect(() => {
    const f = () => setH(calc())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return h
}

/** Área de simulação responsiva, com zoom (roda, pinça, teclado) e coordenadas do mundo real. */
export function Cena({ janela, rotulo, children, chaveReinicio = 0, grade = true, zoom = false, passoX, passoY, altura: alturaFixa, proporcao = false }: Props) {
  const alturaAuto = useAltura()
  const altura = alturaFixa ?? alturaAuto
  return (
    <div
      role="group"
      aria-label={rotulo}
      className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)]"
      
    >
      <Mafs
        key={chaveReinicio}
        height={altura}
        preserveAspectRatio={proporcao ? 'contain' : false}
        viewBox={{ x: [janela.xmin, janela.xmax], y: [janela.ymin, janela.ymax], padding: 0 }}
        pan={zoom}
        zoom={zoom ? { min: 0.4, max: 4 } : false}
      >
        {grade && <Coordinates.Cartesian subdivisions={false} xAxis={passoX ? { lines: passoX } : undefined} yAxis={passoY ? { lines: passoY } : undefined} />}
        {children}
      </Mafs>
    </div>
  )
}
