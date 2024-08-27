'use strict'

const Strings = require('/lib/util/strings')
const Throwables = Java.type('com.google.common.base.Throwables')

module.exports = {
  formatErrorStackTrace,
  formatErrorMessage,
  wrapErrorForRethrow
}

function formatErrorStackTrace (origException) {
  let exceptionString
  // 1) Try get exception string using java
  if (!exceptionString) {
    try {
      exceptionString = Throwables.getStackTraceAsString(origException)
    } catch (e) {
      // Do nothing
    }
  }
  // 2) Try get exception string using nashorn extended properties
  if (!exceptionString && exceptionString !== 'undefined' && exceptionString !== 'null') {
    try {
      exceptionString = origException.stack ? `${origException.fileName || 'Unknown file'}:${origException.lineNumber || 'Unknown line'}\n${origException.stack}` : (origException.fileName && origException.lineNumber ? `${origException.fileName}:${origException.lineNumber}` : '')
    } catch (e) {
      // Do nothing
    }
  }
  // 3) Try get exception string using safeStringify
  if (!exceptionString && exceptionString !== 'undefined' && exceptionString !== 'null') {
    try {
      exceptionString = Strings.safeStringify(origException, null, 2)
      if (exceptionString === '{}' || exceptionString === '[]') {
        exceptionString = ''
      }
    } catch (e) {
      // Do nothing
    }
  }
  // 4) Try get exception string using toString
  if (!exceptionString && exceptionString !== 'undefined' && exceptionString !== 'null') {
    try {
      exceptionString = origException.toString()
    } catch (e) {
      // Otherwise, empty string
      exceptionString = String(origException)
    }
  }

  return exceptionString
}

function formatErrorMessage (errorObject, optionalFileName, optionalLineNumber) {
  const fileAndLine = (optionalFileName ? `${optionalFileName}: ` : '') + (errorObject.lineNumber || optionalLineNumber)
  const errMsg = errorObject.cause ? (`${fileAndLine} - ${errorObject.cause.message || String(errorObject.cause)} `) : (`${fileAndLine} - ${errorObject.message || String(errorObject)} `)
  return errMsg
}

function wrapErrorForRethrow (errorObject) {
  const errorWrapper = new Error()
  errorWrapper.isReported = true
  errorWrapper.cause = errorObject
  return errorWrapper
}
