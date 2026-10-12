import type { ModuloTema } from '@/materias/registro'
import { DEFINICOES_SOLUCOES } from './definicoes'
import Entenda from './Entenda'
import Laboratorio from './Laboratorio'
import Resumo from './Resumo'

const modulo: ModuloTema = { Entenda, Laboratorio, Resumo, desafios: DEFINICOES_SOLUCOES }
export default modulo
