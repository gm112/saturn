import type { entity_state } from './entity.js'
import type { worker_message } from './worker-message.js'

export interface worker_response {
  worker_id: number
  action: worker_message['action']
  entities: entity_state[]
}
