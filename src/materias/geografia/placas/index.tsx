import type { ModuloTema } from '@/materias/registro'
import { DEFINICOES_PLACAS } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'

const modulo: ModuloTema = { Entenda, Laboratorio, Resumo, desafios: DEFINICOES_PLACAS }
export default modulo
