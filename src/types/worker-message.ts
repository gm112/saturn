// src/types/worker-message.ts

import type { entity_state } from './entity.js'

export type worker_message =
  | {
      action: 'initialize'
      entity_name?: string
      entity_params?: Omit<Partial<entity_state>, 'owner'>
    }
  | {
      action: 'request_current_state'
      delta_time: number
    }
  | {
      action: ''
      entity_name?: string
      entity_params?: entity_state
    }
