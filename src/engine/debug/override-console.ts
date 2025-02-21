const original_console_log = console.log
const original_console_table = console.table
const original_console_clear = console.clear
const original_console_debug = console.debug
const original_console_error = console.error
const console_div = document.getElementById('console_output')
type primitive = string | number

function handle_table(table_data: Array<Record<string, primitive>>) {
  // Early return if no data is provided
  if (!Array.isArray(table_data) || table_data.length === 0) return

  // Extract headers from the first row
  const headers = Object.keys(table_data[0]!)
  let table_html = `<table><thead><tr>`

  // Build table headers
  for (let i = 0; i < headers.length; i++) {
    table_html += `<th>${headers[i]}</th>`
  }
  table_html += `</tr></thead><tbody>`

  // Build table rows
  for (let i = 0; i < table_data.length; i++) {
    table_html += '<tr>'
    for (let j = 0; j < headers.length; j++) {
      table_html += `<td><pre>${JSON.stringify(table_data[i]![headers[j]!], null, 2)}</pre></td>`
    }
    table_html += '</tr>'
  }

  table_html += '</tbody></table>'

  try {
    if (!console_div) return table_html
    requestAnimationFrame(() => {
      console_div.innerHTML += table_html + '<br>'
      console_div.scrollTop = console_div.scrollHeight
    })
  } catch {}
  return table_html
}
console.log = function () {
  original_console_log(...arguments)
  try {
    if (!console_div) return
    const message = [...arguments].join(' ')
    requestAnimationFrame(() => {
      console_div.innerHTML += message + '<br>'
      console_div.scrollTop = console_div.scrollHeight
    })
  } catch {}
}
console.debug = function () {
  original_console_debug(...arguments)
  try {
    if (!console_div) return
    const message = [...arguments].join(' ')
    requestAnimationFrame(() => {
      console_div.innerHTML += message + '<br>'
      console_div.scrollTop = console_div.scrollHeight
    })
  } catch {}
}
console.error = function () {
  original_console_error(...arguments)
  try {
    if (!console_div) return
    const message = [...arguments].join(' ')
    requestAnimationFrame(() => {
      console_div.innerHTML += message + '<br>'
      console_div.scrollTop = console_div.scrollHeight
    })
  } catch {}
}
console.table = function (data, properties) {
  original_console_table(...data, properties)
  return handle_table(data)
}

console.clear = function () {
  original_console_clear()
  if (!console_div) return
  requestAnimationFrame(() => (console_div.innerHTML = '<br>'))
}
