export interface position {
  x: number
  y: number
}

export interface entity_state {
  id: number
  type: string
  name: string
  position: position
  velocity: position
  owner: number | undefined
}

export interface entity {
  initialize: (new_state?: Partial<entity_state>) => void
  update: (delta_time: number) => void
  get_state: () => entity_state
}
