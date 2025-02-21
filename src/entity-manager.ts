import movable_entity from './entities/movable.js'
import type { entity, entity_state } from './types/entity.js'

let current_entity_id = 0
export function new_id(worker_id: number = 1) {
  return worker_id * current_entity_id++
}

export const create_entity = async (entity_name: string, entity_params?: Partial<entity_state>): Promise<entity> => {
  switch (entity_name) {
    case 'movable':
      return movable_entity(entity_params)
    default:
      throw new Error(`Entity type ${entity_name} is not recognized`)
  }
}
