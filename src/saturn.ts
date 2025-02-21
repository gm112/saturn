/// <reference types="vite/client" />

import { debug_log_stuff } from './debug/log-entities.js'
import { log_worker_threads } from './debug/log-worker-threads.js'
import { new_id } from './entity-manager.js'
import type { entity_state } from './types/entity.js'
import type { worker_message } from './types/worker-message.js'
import type { worker_response } from './types/worker-response.js'
import { TriangleThing, WebGLRenderer } from './webgl-renderer.js'
import Worker from './worker.js?worker'

const worker_count = navigator.hardwareConcurrency ?? 4
const workers: Map<number, Worker> = new Map()
let worker_ready_count = 0

const renderer = new WebGLRenderer()
let ready = false

// DEBUG STUFF
let logged_count = 0
const DEBUG_ONLY_worker_entity_states: Record<number, entity_state[]> = {}
const status_element = document.getElementById('status')
const entities_element = document.getElementById('entities')
const triangle_thing = new TriangleThing(renderer)
// END DEBUG STUFF

function process_frame(current_time: number, previous_time: number) {
  const delta_time = (current_time - previous_time) / 1000
  for (const [_, worker] of workers.entries()) {
    const message: worker_message = {
      action: 'request_current_state',
      delta_time
    }
    worker.postMessage(message)
  }

  renderer.startFrame()
  triangle_thing.render(renderer, delta_time)

  requestAnimationFrame((timestamp) => {
    process_frame(timestamp, current_time)
  })

  debug_log_stuff(
    Object.entries(DEBUG_ONLY_worker_entity_states).flatMap(([_, entities]) => entities),
    entities_element!
  )
}

function process_worker_message(worker: Worker, event: MessageEvent) {
  const message = event.data as worker_response
  switch (message?.action) {
    case 'initialize':
      console.debug('[main-thread] onmessage(): Creating new worker', message.worker_id)
      worker_ready_count++
      workers.set(message.worker_id, worker)

      if (worker_ready_count === worker_count && !ready) {
        ready = true
        requestAnimationFrame((timestamp) => {
          console.debug('[main-thread] start_game_loop(): kicking off first frame.')
          process_frame(timestamp, 0)
          log_worker_threads(workers, status_element!)
        })
      }

      break
    case 'request_current_state':
      DEBUG_ONLY_worker_entity_states[message.worker_id] = message.entities

      if (worker_ready_count !== 4) return
      if (logged_count > 4) return

      logged_count++
      console.table([message], ['worker_id', 'action', 'entities'])
      break
    default:
      console.error('[main-thread] onmessage(): unknown message', message)
  }
}

async function init_worker(): Promise<Worker | null> {
  try {
    const worker = new Worker()

    worker.onmessage = (event: MessageEvent) => process_worker_message(worker, event)

    worker.onerror = (error: ErrorEvent) => {
      console.error('Error in worker:', error.message)
    }

    return worker
  } catch (error) {
    console.error('[main-thread] Failed to create worker:', error)
    return null
  }
}

async function start_game_loop() {
  for (let index = 0; index < worker_count; index++) {
    const worker = await init_worker()
    if (!worker) throw new Error('Failed to spin up worker!')

    const make_moveable = index === 0 || index === 4
    const message: worker_message = {
      action: 'initialize',
      entity_name: 'movable',
      entity_params: {
        id: new_id(),
        name: make_moveable ? 'moving fellow' : 'stationary fellow',
        position: { x: 0, y: 0 },
        velocity: make_moveable ? { x: 1, y: 1 } : undefined
      }
    }

    worker.postMessage(message)
  }
}

start_game_loop()

if (import.meta.hot) {
  console.clear()
  console.log('Reloading...')

  import.meta.hot.accept(() => {
    try {
      for (const [_, worker] of workers.entries()) worker.terminate()
      workers.clear()

      start_game_loop()
    } catch {
      if (location) location.reload()
    }
  })
}
