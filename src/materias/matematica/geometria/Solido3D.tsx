import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { apotema, type Dimensoes, type Solido } from './calculo'

export interface Solido3DProps {
  solido: Solido
  dim: Dimensoes
  /** gira sozinho */
  girar?: boolean
  /** 0..1: nível da água dentro do sólido (undefined = sem água, sólido opaco) */
  agua?: number
  /** 0..1: quanto a planificação está dobrada (só prisma e pirâmide); undefined = sólido fechado */
  dobra?: number
  altura?: number
}

/** Lê uma variável CSS (cor do tema) e acompanha a troca claro/escuro. */
function useCorCss(nome: string, padrao: string): string {
  const ler = () => (typeof document === 'undefined' ? padrao : getComputedStyle(document.documentElement).getPropertyValue(nome).trim() || padrao)
  const [cor, setCor] = useState(ler)
  useEffect(() => {
    const atualizar = () => setCor(ler())
    const obs = new MutationObserver(atualizar)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-materia'] })
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', atualizar)
    atualizar()
    return () => {
      obs.disconnect()
      mq.removeEventListener('change', atualizar)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nome])
  return cor
}

function tamanhoMax(s: Solido, d: Dimensoes): number {
  switch (s) {
    case 'prisma':
      return Math.max(d.a ?? 1, d.b ?? 1, d.h ?? 1)
    case 'cilindro':
    case 'cone':
      return Math.max(2 * (d.r ?? 1), d.h ?? 1)
    case 'esfera':
      return 2 * (d.r ?? 1)
    case 'piramide':
      return Math.max(d.a ?? 1, d.h ?? 1)
  }
}

/** Extensão da planificação aberta: define a escala enquanto o sólido pode ser desdobrado. */
function tamanhoRede(s: Solido, d: Dimensoes): number {
  if (s === 'prisma') return Math.max((d.a ?? 1) + 2 * (d.h ?? 1), 2 * (d.h ?? 1) + 2 * (d.b ?? 1))
  if (s === 'piramide') return (d.a ?? 1) + 2 * apotema(d.a ?? 1, d.h ?? 1)
  return tamanhoMax(s, d)
}

function Corpo({ solido, dim, cor, transparente }: { solido: Solido; dim: Dimensoes; cor: string; transparente: boolean }) {
  const material = (
    <meshStandardMaterial color={cor} roughness={0.55} metalness={0.05} transparent={transparente} opacity={transparente ? 0.22 : 1} side={THREE.DoubleSide} depthWrite={!transparente} />
  )
  switch (solido) {
    case 'prisma':
      return (
        <mesh>
          <boxGeometry args={[dim.a, dim.h, dim.b]} />
          {material}
          <Edges color="#1f1b16" />
        </mesh>
      )
    case 'cilindro':
      return (
        <mesh>
          <cylinderGeometry args={[dim.r, dim.r, dim.h, 56]} />
          {material}
          <Edges threshold={30} color="#1f1b16" />
        </mesh>
      )
    case 'cone':
      return (
        <mesh>
          <coneGeometry args={[dim.r, dim.h, 56]} />
          {material}
          <Edges threshold={30} color="#1f1b16" />
        </mesh>
      )
    case 'esfera':
      return (
        <mesh>
          <sphereGeometry args={[dim.r, 56, 36]} />
          {material}
        </mesh>
      )
    case 'piramide':
      return (
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[(dim.a ?? 1) / Math.SQRT2, dim.h, 4]} />
          {material}
          <Edges color="#1f1b16" />
        </mesh>
      )
  }
}

/** Água até a fração t da altura (t em 0..1), como um tronco do próprio sólido. */
function Agua({ solido, dim, t }: { solido: Solido; dim: Dimensoes; t: number }) {
  const cor = '#3b82f6'
  const mat = <meshStandardMaterial color={cor} transparent opacity={0.75} roughness={0.2} />
  const nivel = Math.max(0.001, Math.min(1, t))
  switch (solido) {
    case 'prisma': {
      const hh = (dim.h ?? 1) * nivel
      return (
        <mesh position={[0, -(dim.h ?? 1) / 2 + hh / 2, 0]}>
          <boxGeometry args={[(dim.a ?? 1) * 0.985, hh, (dim.b ?? 1) * 0.985]} />
          {mat}
        </mesh>
      )
    }
    case 'cilindro': {
      const hh = (dim.h ?? 1) * nivel
      return (
        <mesh position={[0, -(dim.h ?? 1) / 2 + hh / 2, 0]}>
          <cylinderGeometry args={[(dim.r ?? 1) * 0.985, (dim.r ?? 1) * 0.985, hh, 48]} />
          {mat}
        </mesh>
      )
    }
    case 'cone': {
      const h = dim.h ?? 1
      const r = (dim.r ?? 1) * 0.985
      const hh = h * nivel
      return (
        <mesh position={[0, -h / 2 + hh / 2, 0]}>
          <cylinderGeometry args={[r * (1 - nivel), r, hh, 48]} />
          {mat}
        </mesh>
      )
    }
    case 'piramide': {
      const h = dim.h ?? 1
      const r = ((dim.a ?? 1) / Math.SQRT2) * 0.985
      const hh = h * nivel
      return (
        <mesh position={[0, -h / 2 + hh / 2, 0]} rotation={[0, Math.PI / 4, 0]}>
          <cylinderGeometry args={[r * (1 - nivel), r, hh, 4]} />
          {mat}
        </mesh>
      )
    }
    case 'esfera': {
      const r = (dim.r ?? 1) * 0.985
      const altura = 2 * r * nivel
      const phi = Math.acos(Math.max(-1, Math.min(1, 1 - altura / r)))
      const raioSuperficie = Math.sqrt(Math.max(0, r * r - (r - altura) ** 2))
      return (
        <group>
          <mesh>
            <sphereGeometry args={[r, 48, 24, 0, Math.PI * 2, Math.PI - phi, phi]} />
            <meshStandardMaterial color={cor} transparent opacity={0.75} roughness={0.2} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -r + altura, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[raioSuperficie, 40]} />
            <meshStandardMaterial color={cor} transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )
    }
  }
}

/** Planificação articulada: as faces giram em torno das arestas da base. t = 0 (aberta) a 1 (fechada). */
function RedeDobravel({ solido, dim, t, cor }: { solido: 'prisma' | 'piramide'; dim: Dimensoes; t: number; cor: string }) {
  const mat = <meshStandardMaterial color={cor} roughness={0.6} side={THREE.DoubleSide} />
  const contorno = <Edges color="#1f1b16" />
  if (solido === 'prisma') {
    const a = dim.a ?? 1
    const b = dim.b ?? 1
    const h = dim.h ?? 1
    const th = t * (Math.PI / 2)
    const plano = (w: number, l: number) => (
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, l]} />
        {mat}
        {contorno}
      </mesh>
    )
    return (
      <group position={[0, -h / 2, 0]}>
        {/* base */}
        {plano(a, b)}
        {/* frente (z = +b/2) */}
        <group position={[0, 0, b / 2]} rotation={[-th, 0, 0]}>
          <group position={[0, 0, h / 2]}>{plano(a, h)}</group>
        </group>
        {/* fundo (z = −b/2), com a tampa presa na aresta de cima */}
        <group position={[0, 0, -b / 2]} rotation={[th, 0, 0]}>
          <group position={[0, 0, -h / 2]}>{plano(a, h)}</group>
          <group position={[0, 0, -h]} rotation={[th, 0, 0]}>
            <group position={[0, 0, -b / 2]}>{plano(a, b)}</group>
          </group>
        </group>
        {/* direita (x = +a/2) */}
        <group position={[a / 2, 0, 0]} rotation={[0, 0, th]}>
          <group position={[h / 2, 0, 0]}>{plano(h, b)}</group>
        </group>
        {/* esquerda (x = −a/2) */}
        <group position={[-a / 2, 0, 0]} rotation={[0, 0, -th]}>
          <group position={[-h / 2, 0, 0]}>{plano(h, b)}</group>
        </group>
      </group>
    )
  }
  return <RedePiramide dim={dim} t={t} cor={cor} />
}

function RedePiramide({ dim, t, cor }: { dim: Dimensoes; t: number; cor: string }) {
  const mat = <meshStandardMaterial color={cor} roughness={0.6} side={THREE.DoubleSide} />
  const contorno = <Edges color="#1f1b16" />
  const a = dim.a ?? 1
  const h = dim.h ?? 1
  const ap = apotema(a, h)
  const phi = Math.atan2(h, a / 2)
  const th = t * phi
  const triangulo = useMemo(() => {
    const forma = new THREE.Shape()
    forma.moveTo(-a / 2, 0)
    forma.lineTo(a / 2, 0)
    forma.lineTo(0, ap)
    forma.closePath()
    return new THREE.ShapeGeometry(forma)
  }, [a, ap])
  const face = (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={triangulo}>
      {mat}
      {contorno}
    </mesh>
  )
  return (
    <group position={[0, -h / 2, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[a, a]} />
        {mat}
        {contorno}
      </mesh>
      <group position={[0, 0, a / 2]} rotation={[-th, 0, 0]}>{face}</group>
      <group position={[0, 0, -a / 2]} rotation={[0, Math.PI, 0]}>
        <group rotation={[-th, 0, 0]}>{face}</group>
      </group>
      <group position={[a / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <group rotation={[-th, 0, 0]}>{face}</group>
      </group>
      <group position={[-a / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <group rotation={[-th, 0, 0]}>{face}</group>
      </group>
    </group>
  )
}

function Cena3D({ solido, dim, girar, agua, dobra, cor }: Omit<Solido3DProps, 'altura'> & { cor: string }) {
  const grupo = useRef<THREE.Group>(null)
  const emDobra = dobra !== undefined && (solido === 'prisma' || solido === 'piramide')
  const escala = 3 / (emDobra ? tamanhoRede(solido, dim) : tamanhoMax(solido, dim))
  useFrame((_, dt) => {
    if (girar && grupo.current) grupo.current.rotation.y += dt * 0.6
  })
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
      <directionalLight position={[-4, -2, -3]} intensity={0.5} />
      <group ref={grupo} scale={escala} rotation={[0.35, 0.5, 0]}>
        {emDobra ? (
          <RedeDobravel solido={solido as 'prisma'} dim={dim} t={dobra as number} cor={cor} />
        ) : (
          <>
            <Corpo solido={solido} dim={dim} cor={cor} transparente={agua !== undefined} />
            {agua !== undefined && <Agua solido={solido} dim={dim} t={agua} />}
          </>
        )}
      </group>
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.9} />
    </>
  )
}

/** Visualizador 3D de um sólido. Carregado sob demanda (React.lazy), porque o three.js é pesado. */
export default function Solido3D({ solido, dim, girar = true, agua, dobra, altura = 300 }: Solido3DProps) {
  const cor = useCorCss('--accent', '#1d4ed8')
  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)]" style={{ height: altura, touchAction: 'pan-y' }} role="img" aria-label={`Visualização 3D: ${solido}. Arraste para girar.`}>
      <Canvas camera={{ position: [0, 1.2, 6], fov: 38 }} dpr={[1, 2]} style={{ touchAction: 'pan-y' }}>
        <Cena3D solido={solido} dim={dim} girar={girar} agua={agua} dobra={dobra} cor={cor} />
      </Canvas>
    </div>
  )
}
