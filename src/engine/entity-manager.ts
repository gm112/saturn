import type { entity, entity_state } from './types/entity.js'

let current_entity_id = 0
export function new_id(worker_id: number = 1) {
  return worker_id * current_entity_id++
}

export const create_entity = async (entity_name: string, entity_params?: Partial<entity_state>): Promise<entity> => {
  const { default: entity_factory } = await import(`../entities/${entity_name}.ts`)
  return entity_factory(entity_params)
}
