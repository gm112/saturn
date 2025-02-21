export function log_worker_threads(workers: Map<number, Worker>, status_element: HTMLElement) {
  requestAnimationFrame(() => {
    status_element.innerText = `Running...`
    let index = 0
    for (const worker_id of workers.keys()) {
      status_element.innerText += `
      Worker # ${index}, ID: ${worker_id}`
      index++
    }
  })
}
