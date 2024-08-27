module.exports = {
  forceArray,
  trySafe,
  deepClone,
  isNullOrUndefined,
  isBlankOrEmpty,
  isArrayNotEmpty,
  toEmptyOrString,
  isStructured,
  visitDeep,
  isEquivalent,
  isObject,
  isEmpty,
  isPublished,
  wasNeverPublished,
  equalSetArray,
  sortByIndexList,
  compareObjects,
  removeDuplicatesFromArrayByProperty
}

/**
 * Guarantee that supplied argument is an array by encapsulating it, if required
 * @param {*} data Target object
 */
function forceArray (data) {
  if (!Array.isArray(data) && (data)) {
    data = [data]
  } else if (!data) {
    data = []
  }
  return data
}

/**
 * Executes a callback in a safe way, discarding errors and returning undefined
 * @param {Function} callback Function to be executed in a safe way
 * @param {Function} onFail Function to be executed if an error occurs on the main callback
 * @param {Array} args Arguments array to supply the function callback - Optional
 */
function trySafe (callback, onFail, args) {
  if (typeof onFail !== 'function') {
    onFail = function () { }
  }
  if (typeof callback === 'function') {
    try {
      return callback.apply(this, forceArray(args))
    } catch (e) {
      return onFail.apply(this, Array.isArray(args) ? (() => { args = args.slice(0); args.unshift(e); return args })() : [e])
    }
  }
}

/**
 * Performs a deep cloning. Works only with JSON-able property types
 * @param {*} obj Source
 */
function deepClone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Checks if the supplied object is null or undefined, and optionally executes true or false callbacks, if any
 * @param {*} obj Target
 * @param {Function} trueCallback Function that will be executed if target object is actually null or undefined
 * @param {Function} falseCallback Function that will be executed if target object isn't null nor undefined
 */
function isNullOrUndefined (obj, trueCallback, falseCallback) {
  if (obj === null || obj === undefined) {
    if (typeof trueCallback === 'function') {
      return trueCallback(obj)
    }
    return true
  } else {
    if (typeof falseCallback === 'function') {
      return falseCallback(obj)
    }
    return false
  }
}

function isBlankOrEmpty (obj, trueCallback, falseCallback) {
  if (!String(obj).trim()) {
    if (typeof trueCallback === 'function') {
      return trueCallback(obj)
    }
    return true
  } else {
    if (typeof falseCallback === 'function') {
      return falseCallback(obj)
    }
    return false
  }
}

function isArrayNotEmpty (array) {
  return Array.isArray(array) && array.length > 0
}

function isStructured (obj) {
  return Array.isArray(obj) || (!isNullOrUndefined(obj) && typeof (obj) === 'object')
}

/**
 * Null or empty values turn into empty string. All other values turn into string
 * @param {*} value Plain value or object, if accessor is provided
 * @param {Function} optionalAccessor Optional function to extract data from value property. If not provided, value is used as is
 */
function toEmptyOrString (value, optionalAccessor) {
  const actualValue = typeof optionalAccessor === 'function' ? optionalAccessor(value) : value
  let result
  if (actualValue || actualValue === 0) {
    result = String(actualValue)
  } else {
    result = ''
  }
  return result
}

/**
 * Tree searching on object, executing callback when the keyword is found
 * @param {Object} params
 * @param {String} params.keyword term to be searched
 * @param {any} params.target target element where the keyword will search
 * @param {Function} [params.callback] options function to be called when the keyword is found
 * @param {Boolean} [params.shouldBeIdentical=false] if true, the check will use the identical operator
 */
function visitDeep (params) {
  if (!params.target || !params.keyword) return

  const target = params.target
  const keyword = params.keyword
  const shouldBeIdentical = params.shouldBeIdentical || false

  const itemExists = (searchArray, wantedObject) => {
    for (const item of searchArray) if (isEquivalent(item, wantedObject)) return true
    return false
  }

  const recursiveFind = (toSearch, obj, callback) => {
    if (isNullOrUndefined(obj)) return

    if (Array.isArray(obj)) {
      for (const item of obj) {
        recursiveFind(toSearch, item, callback)
      }
    } else if (typeof obj === 'object') {
      for (const key in obj) {
        recursiveFind(toSearch, obj[key], callback)
      }
    } else {
      if (shouldBeIdentical && String(obj) === toSearch) return callback(obj)

      if (!shouldBeIdentical && String(obj).indexOf(toSearch) !== -1) {
        callback(obj)
      }
    }
  }

  const result = []
  recursiveFind(keyword, target, function (found) {
    if (!itemExists(result, found)) result.push(found)
    if (params.callback && typeof params.callback === 'function') params.callback(found)
  })
  return result
}

/**
 * Return true if the comparison result is positive
 * @param {*} o1
 * @param {*} o2
 */
function isEquivalent (o1, o2) {
  if (o1 === o2) return true
  if (isNullOrUndefined(o1) || isNullOrUndefined(o2)) return false
  let k = ''
  for (k in o1) if (o1[k] !== o2[k]) return false
  for (k in o2) if (o1[k] !== o2[k]) return false
  return true
}

function isObject (x) {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function isEmpty (obj) {
  for (const prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      return false
    }
  }

  return JSON.stringify(obj) === JSON.stringify({})
}

function isEqual (a, b) {
  const typeA = isObject(a)
  const typeB = isObject(b)

  if (typeA !== typeB) return false
  if (typeA) return isEquivalent(a, b) // object
  return a === b // primitive type
}

// Not optimized complexity, but works fine for few elements
function equalSetArray (a, b) {
  return a.length === b.length &&
    a.every(
      eleA => b.filter(
        eleB => isEqual(eleA, eleB)
      ).length === a.filter(
        eleC => isEqual(eleA, eleC)
      ).length
    )
}

/**
 * Sorts the objectArray by an specific array of indexes (the same property on all objects on array)
 * @param {String[]} indexList i.e. id list.
 * @param {String} indexProperty property name, i.e. "data.id" or "_id"
 * @param {Object[]} objectArray array of objects containing the indexProperty
 */

function sortByIndexList (indexList, indexProperty, objectArray) {
  let i; let j; let len; let obj; const sortedArray = []
  objectArray = objectArray.slice() // copy
  for (i = 0, len = indexList.length; i < len && objectArray.length !== 0; i++) {
    for (j = 0; j < objectArray.length; j++) { // Performance improved with splice
      obj = objectArray[j]
      if (obj && (obj.data[indexProperty] || obj[indexProperty]) === indexList[i]) {
        sortedArray.push(objectArray.splice(j, 1)[0]) // Removes the matching and returns it, at same time
        break
      }
    }
  }
  return sortedArray.length !== 0 ? sortedArray : objectArray
}

function compareObjects (field) {
  return function (a, b) {
    const checkA = isObject(a)
    const checkB = isObject(b)

    if (checkA && checkB) {
      const fieldA = a[field] && a[field].toLowerCase()
      const fieldB = b[field] && b[field].toLowerCase()
      if (fieldA > fieldB) {
        return 1
      } else if (fieldA < fieldB) {
        return -1
      }
    } else {
      if (checkA) {
        return 1
      } else if (checkB) {
        return -1
      }
    }

    return 0
  }
}

function removeDuplicatesFromArrayByProperty (originalArray, prop) {
  const newArray = []
  const lookupObject = {}

  for (const i in originalArray) {
    lookupObject[originalArray[i][prop]] = originalArray[i]
  }

  for (const i in lookupObject) {
    newArray.push(lookupObject[i])
  }
  return newArray
}

/**
 * Checks if a content is published based on the publish property.
 * If publish.from doesn't exist, the object is not published.
 *
 * @param {Object} content Enonic content type object
 * @returns {Boolean} true if the object is published
 */
function isPublished (content) {
  return !!(content && content.publish && content.publish.from)
}

/**
 * Checks if a content was never published. Contents with "New" status are the target.
 * If publish.from and publish.first don't exist, the object is new.
 *
 * @param {Object} content Enonic content type object
 * @returns {Boolean} true if the object is new
 */
function wasNeverPublished (content) {
  return !!(content && content.publish && (!content.publish.first && !content.publish.from))
}
