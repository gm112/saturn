/// <reference types="vite/client" />
import './debug/override-console.js'

import { debug_log_stuff } from './debug/log-entities.js'
import { log_worker_threads } from './debug/log-worker-threads.js'
import { new_id } from './entity-manager.js'
import type { entity_state } from './types/entity.js'
import type { worker_message } from './types/worker-message.js'
import type { worker_response } from './types/worker-response.js'
import { webgl_renderer } from './webgl-renderer.js'
import { triangle_thing } from '../entities/triangle-thing.js'

import Worker from './worker.js?worker'

const worker_count = navigator.hardwareConcurrency ?? 4
const workers: Map<number, Worker> = new Map()
let worker_ready_count = 0
let ready = false

// DEBUG STUFF
let logged_count = 0
const DEBUG_ONLY_worker_entity_states: Map<number, entity_state[]> = new Map()
const status_element = document.getElementById('status')
const entities_element = document.getElementById('entities')

let triangle_thing_entity: triangle_thing | undefined
let renderer: webgl_renderer | undefined
let animation_frame_id: number | undefined
// END DEBUG STUFF

function process_frame(current_time: number, previous_time: number) {
  if (!ready) return
  const delta_time = (current_time - previous_time) / 1000
  for (const [_, worker] of workers.entries()) {
    const message: worker_message = {
      action: 'request_current_state',
      delta_time
    }
    worker.postMessage(message)
  }

  if (!renderer || !triangle_thing_entity || !renderer.context) return //GPU isn't ready to render yet.
  renderer.start_frame()
  triangle_thing_entity.render(renderer, delta_time)

  const entities_to_log: entity_state[] = []
  for (const entities of DEBUG_ONLY_worker_entity_states.values()) entities_to_log.push(...entities)

  debug_log_stuff(entities_to_log, entities_element!)
  animation_frame_id = requestAnimationFrame((timestamp) => process_frame(timestamp, current_time))
}

function on_engine_ready() {
  if (!ready) ready = worker_ready_count >= worker_count
  if (!ready) return

  log_worker_threads(workers, status_element!)

  requestAnimationFrame((timestamp) => {
    console.debug('[main-thread] start_game_loop(): kicking off first frame.')
    process_frame(timestamp, 0)
  })
}

function process_worker_message(worker: Worker, event: MessageEvent) {
  const message = event.data as worker_response
  switch (message?.action) {
    case 'initialize':
      console.debug('[main-thread] onmessage(): Creating new worker', message.worker_id)
      worker_ready_count++
      workers.set(message.worker_id, worker)
      on_engine_ready()

      break
    case 'request_current_state':
      if (!ready) return
      DEBUG_ONLY_worker_entity_states.set(message.worker_id, message.entities)
      if (logged_count > worker_count) return

      logged_count++
      console.table([message], ['worker_id', 'action', 'entities'])
      break
    default:
      console.error('[main-thread] onmessage(): unknown message', message)
  }
}

async function init_worker(index: number = 0) {
  try {
    const worker = new Worker()
    worker.onmessage = (event: MessageEvent) => process_worker_message(worker, event)
    worker.onerror = (error: ErrorEvent) => console.error('Error in worker:', error.message)

    const make_moveable = index === 0 || index === 2
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
    return worker
  } catch (error) {
    console.error('[main-thread] Failed to create worker:', error)
    return
  }
}

export function start_game_loop() {
  // This sucks, but whatever its a demo.
  worker_ready_count = 0
  logged_count = 0
  ready = false
  DEBUG_ONLY_worker_entity_states.clear()
  renderer = undefined
  triangle_thing_entity = undefined

  for (const [_, worker] of workers.entries()) worker.terminate()
  workers.clear()
  renderer = new webgl_renderer()
  triangle_thing_entity = new triangle_thing(renderer)

  for (let index = 0; index < worker_count; index++) init_worker(index)
}

export function handle_hmr() {
  let handling = false
  if (import.meta.hot) {
    import.meta.hot.accept((new_module) => {
      if (animation_frame_id) cancelAnimationFrame(animation_frame_id)
      if (handling) return
      try {
        handling = true
        console.clear()
        const module = new_module as unknown as typeof import('./saturn.js')
        console.log('Reloading...', module)
        if (!module?.start_game_loop) import.meta.hot?.invalidate()
        else module.start_game_loop()
      } catch {
        if (location) location.reload()
      }

      handling = false
    })
  }
}

/*

Notes:

This approach has a couple flaws. First, workers should request their own frame. And there should be a more architected protocol for orchestrating jobs across workers. This also doesn't make use of transfer objects, which would be faster than cow operations.
*/
