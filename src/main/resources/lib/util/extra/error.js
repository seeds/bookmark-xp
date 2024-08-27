'use strict'

module.exports = {
  formatErrorMessage
}

function formatErrorMessage (errorObject, optionalFileName, optionalLineNumber) {
  const fileAndLine = (optionalFileName ? optionalFileName + ':' : '') + (errorObject.lineNumber || optionalLineNumber)
  const errMsg = errorObject.cause ? (fileAndLine + ' - ' + errorObject.cause.message) : (fileAndLine + ' - ' + errorObject.message)
  return errMsg
}
