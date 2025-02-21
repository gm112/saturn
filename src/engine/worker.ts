import type { worker_message } from './types/worker-message.js'
import type { worker_response } from './types/worker-response.js'
import type { entity_state, entity } from './types/entity.js'

import { new_id } from './entity-manager.js'

const worker_entities: entity[] = []
const worker_id = Math.floor(Math.random() * 1000000) // Fully rounded worker ID

self.onmessage = async (e) => {
  const message: worker_message = e.data
  switch (message.action) {
    case 'initialize':
      await initialize_entities(message.entity_name!, message.entity_params!)
      break

    case 'request_current_state':
      yield_current_state(message.delta_time)
      break

    default:
      console.error('[worker-thread]', worker_id, 'Unknown action:', message.action)
  }
}

const initialize_entities = async (entity_name: string, entity_params?: Partial<entity_state>): Promise<void> => {
  const { create_entity } = await import('./entity-manager.js')

  const entity_instance = await create_entity(entity_name, entity_params)
  entity_instance.initialize({
    owner: worker_id,
    id: entity_params?.id! ?? new_id(worker_id)
  })
  worker_entities.push(entity_instance)

  console.debug(`[worker-thread] ${worker_id}: initialized entity ${entity_instance.get_state().id}`)
  const entities = worker_entities.map((entity_instance) => {
    return entity_instance.get_state()
  })

  const response: worker_response = {
    worker_id,
    action: 'initialize',
    entities
  }

  postMessage(response)
}

const yield_current_state = (delta_time: number): void => {
  const entities = worker_entities.map((entity_instance) => {
    entity_instance.update(delta_time)
    return entity_instance.get_state()
  })

  const response: worker_response = {
    worker_id,
    action: 'request_current_state',
    entities
  }

  postMessage(response)
}
