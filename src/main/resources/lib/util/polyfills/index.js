String.prototype.padStart = String.prototype.padStart ? String.prototype.padStart : function (targetLength, padString) {
  targetLength = Math.floor(targetLength) || 0
  if (targetLength < this.length) return String(this)

  padString = padString ? String(padString) : ' '

  var pad = ''
  var len = targetLength - this.length
  var i = 0
  while (pad.length < len) {
    if (!padString[i]) {
      i = 0
    }
    pad += padString[i]
    i++
  }

  return pad + String(this).slice(0)
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = String.prototype.padStart
}

// All credits go to the contributers on MDN
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
if (typeof Object.assign !== 'function') {
  Object.assign = function (target, varArgs) { // .length of function is 2
    'use strict'
    if (target == null) { // TypeError if undefined or null
      throw new TypeError('Cannot convert undefined or null to object')
    }

    const to = Object(target)

    for (let index = 1; index < arguments.length; index++) {
      const nextSource = arguments[index]

      if (nextSource != null) { // Skip over if undefined or null
        for (const nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey]
          }
        }
      }
    }
    return to
  }
}
