const libs = {
  error: require('/lib/util/extra/error')
}

module.exports = {
  currentTimeMillis,
  tryRepeatedly,
  reportError,
  formatErrorMessage: libs.error.formatErrorMessage,
  handleError
}

function currentTimeMillis () {
  return Java.type('java.lang.System').currentTimeMillis()
}

function handleError (onError, message) {
  if (typeof onError === 'function') {
    onError(message)
  } else {
    log.error(message)
  }
}

function tryRepeatedly (callback, attempts = 1, onError) {
  let result
  if (typeof callback === 'function') {
    while (attempts > 0) {
      try {
        result = callback()
        attempts = 0
      } catch (e) {
        handleError(onError, e.message)
        attempts -= 1
      }
    }
  }
  return result
}

function reportError (title = '', message = '') {
  log.error(message)
}
