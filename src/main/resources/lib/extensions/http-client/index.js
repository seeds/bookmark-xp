const libs = {
  task: require('/lib/xp/task'),
  httpClient: require('/lib/http-client'),
  extra: require('/lib/util/extra')
}

module.exports = {
  syncHttpRequest,
  asyncHttpRequest
}

/**
 * Sends an HTTP request and returns the response received from the remote server. The request is sent synchronously, the execution blocks until the response is received.
 * @param {JSON} request
 * @returns the response received from the remote server
 */
function syncHttpRequest (request) {
  return tryRequestRepeatedly(
    () => {
      return libs.httpClient.request(request)
    },
    3,
    message => libs.extra.reportError(__FILE__, `Unexpected error on HTTP request: ${message}`)
  )
}

/**
 * Sends an HTTP request and returns the response received from the remote server. The request is sent synchronously, the execution blocks until the response is received.
 * @param {JSON} request
 */
function asyncHttpRequest (request) {
  libs.task.executeFunction({
    description: 'Async http request',
    func () {
      syncHttpRequest(request)
    }
  })
}

function tryRequestRepeatedly (callback, attempts = 1, onError) {
  let result
  if (typeof callback === 'function') {
    while (attempts > 0) {
      try {
        result = callback()
        if (result && result.status && result.status !== 200) {
          attempts -= 1
          log.warning(`${attempts} attempts remaining: the response does not have a status 200.`)
          libs.task.sleep(1000)
        } else {
          attempts = 0
        }
      } catch (e) {
        libs.extra.handleError(onError, e.message)
        attempts -= 1
        libs.task.sleep(1000)
      }
    }
  }

  return result
}
