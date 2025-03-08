// Util Module
export function isNullOrEmpty(val) {
  return (
    val === '' ||
    val === undefined ||
    val === null ||
    val.length === 0
  )
}
export function eventLog({ request, status, message }) {
  const response = JSON.stringify({ request, status, message })
  console.log(response)
}