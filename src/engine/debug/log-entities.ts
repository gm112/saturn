import type { entity_state } from '../types/entity'

export function debug_log_stuff(entities: entity_state[], status_element: HTMLElement) {
  const entities_to_log = []
  for (const current_entity of entities) {
    entities_to_log.push(
      `Entity ID[${current_entity.id}]@Worker[${current_entity.owner}] - x: ${current_entity.position.x}, ${current_entity.position.y}`
    )
  }

  const entity_json = entities_to_log.join('\n')
  requestAnimationFrame(() => (status_element.innerText = entity_json))
}
