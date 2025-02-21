import type { entity_state, entity } from '../engine/types/entity.js'

export default function movable_entity(default_state?: Partial<entity_state>): entity {
  const initial_state: entity_state = {
    id: default_state?.id ?? 0,
    type: 'movable',
    name: default_state?.name ?? 'movable',
    position: default_state?.position ?? { x: 0, y: 0 },
    velocity: default_state?.velocity ?? { x: 0, y: 0 },
    owner: default_state?.owner
  }
  let instance = {
    ...initial_state
  }

  function initialize(new_state?: Partial<entity_state>) {
    instance.id = new_state?.id ?? initial_state.id
    instance.name = new_state?.name ?? initial_state.name
    instance.position = new_state?.position ?? initial_state.position
    instance.velocity = new_state?.velocity ?? initial_state.velocity
    instance.owner = new_state?.owner ?? initial_state.owner
  }

  function update(delta_time: number) {
    instance.position.x += instance.velocity.x * delta_time
    instance.position.y += instance.velocity.y * delta_time
  }

  function get_state() {
    return instance
  }

  return {
    initialize,
    update,
    get_state
  }
}
