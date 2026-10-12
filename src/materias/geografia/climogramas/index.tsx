import type { ModuloTema } from '@/materias/registro'
import { DEFINICOES_CLIMOGRAMAS } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'

const modulo: ModuloTema = { Entenda, Laboratorio, Resumo, desafios: DEFINICOES_CLIMOGRAMAS }
export default modulo
