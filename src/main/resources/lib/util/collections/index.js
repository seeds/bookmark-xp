var java = {
  util: {
    List: Java.type('java.util.ArrayList'),
    Set: Java.type('java.util.LinkedHashSet')
  }
}

const libs = {
  objects: require('/lib/util/objects'),
  strings: require('/lib/util/strings'),
  extPortal: require('/lib/extensions/portal'),
  content: require('/lib/xp/content'),
  constants: require('/lib/util/constants')
}

module.exports = {
  unique,
  itemExists,
  whereAll,
  whereAny,
  sortObjectByKeyRecursive,
  sortBy,
  chunk,
  chunkIntoArrayObjects,
  customJoin,
  getMediaDocumentFormattedSize,
  getDocumentFormat,
  getShareButtonList
}

// Split array into chunks with size = n
function chunk (arr, n) {
  var R = []
  for (var i = 0; i < arr.length; i += n) { R.push(arr.slice(i, i + n)) }
  return R
}

// Split array into chunks with size = n
function chunkIntoArrayObjects (arr, n) {
  if (arr && arr.length) {
    var R = {}
    for (var i = 0, j = 0; i < arr.length; i += n, j++) { R[`chunk_${j}`] = (arr.slice(i, i + n)) }
    return R
  }
}

/**
 * Receives an array and joins the elements using the 'characterJoin' property. It's also possible to join the last element by using a different character.
 * @param {Object} params
 * @param {String[]} params.array
 * @param {String?} [params.characterJoin] string used to separate all characters. Default is comma + space `,`
 * @param {String?} [params.lastCharacterJoin] string used to separate the last character. Default is the same value as 'characterJoin' property
 * @returns {String}
 */
function customJoin (params) {
  if (!params.array) return ''

  const arrayLength = params.array.length
  const characterJoin = libs.objects.trySafe(() => params.characterJoin || ', ')
  const lastCharacterJoin = libs.objects.trySafe(() => params.lastCharacterJoin || characterJoin)

  if (arrayLength === 1) return params.array.toString()

  let lastElement = params.array.pop()
  lastElement = `${lastCharacterJoin}${lastElement}`

  if (arrayLength === 2) return `${params.array[0]} ${lastElement}`

  return `${params.array.join(characterJoin)} ${lastElement}`
}

function unique (sourceArray) {
  const array = this || sourceArray
  const set = new java.util.Set(__.toScriptObject(array))
  return __.toNativeObject(new java.util.List(set))
}

/**
 * Check if the searchArray contains a object with the same properties as the wantedObject
 * @param {Array} searchArray
 * @param {*} wantedObject
 */
function itemExists (searchArray, wantedObject) {
  for (var i = 0; i < searchArray.length; i++) if (libs.objects.isEquivalent(searchArray[i], wantedObject)) return true
  return false
}

// /**
//  * Return a function that can be used as parameter for Array.some or Array.every.
//  * The returned function compares properties from searchMap with the given element and, if all of them match, it returns true
//  * @param {*} searchMap
//  */
function whereAll (searchMap) {
  return function (element) {
    var success = true
    var i, k
    var keys = Object.keys(searchMap)
    if (keys.length === 0) {
      // Nothing to search, so any object matches
      return true
    }
    for (i in keys) {
      k = keys[i]
      success &= element && searchMap && (searchMap[k] === undefined /* which means: "skip that property" */ || isEquivalent(element[k], searchMap[k]))
    }
    return success
  }
}

/**
 * Return a function that can be used as parameter for Array.some or Array.every.
 * The returned function compares properties from searchMap with the given element and, if any of them match, it returns true
 * @param {*} searchMap
 */
function whereAny (searchMap) {
  return function (element) {
    var success = false
    var i, k
    var keys = Object.keys(searchMap)
    if (keys.length === 0) {
      // Nothing to search, so any object matches
      return true
    }
    for (i in keys) {
      k = keys[i]
      success |= element && searchMap && libs.objects.isEquivalent(element[k], searchMap[k])
    }
    return success
  }
}

function sortObjectByKeyRecursive (object) {
  var sortedObj = {}
  var keys = Object.keys(object)

  keys.sort(function (key1, key2) {
    key1 = key1.toLowerCase()
    key2 = key2.toLowerCase()
    if (key1 < key2) return -1
    if (key1 > key2) return 1
    return 0
  })

  for (var index in keys) {
    var key = keys[index]
    if (typeof object[key] === 'object' && !(object[key] instanceof Array)) {
      sortedObj[key] = sortObjectByKeyRecursive(object[key])
    } else {
      sortedObj[key] = object[key]
    }
  }

  return sortedObj
}

function sortBy (property) {
  var sortOrder = 1
  if (property[0] === '-') {
    sortOrder = -1
    property = property.substr(1)
  }
  return function (a, b) {
    var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0
    return result * sortOrder
  }
}

function getMediaDocumentFormattedSize (content) {
  const bytesSize =
    content &&
    content.attachments &&
    content.data &&
    content.data.media &&
    content.data.media.attachment &&
    content.attachments[content.data.media.attachment] &&
    content.attachments[content.data.media.attachment].size

  return bytesSize ? libs.strings.formatFileSize(bytesSize, 0) : false
}

function getDocumentFormat (content) {
  const nameArr = content && content._name ? content._name.split('.') : []
  const lowerCaseType = nameArr[nameArr.length - 1]
  return lowerCaseType ? lowerCaseType.toUpperCase() : ''
}

/**
 * Generate links to social medias including the current content URL on their sharer feature. Facebook, LinkedIn and Twitter are supported.
 *
 * @param {String} contentId Enonic content ID
 * @returns {{ facebook: String, linkedin: String, twitter: String, mailTo: String, link: url } | {}} list of social medias URL or an empty object if no content is informed
 */
function getShareButtonList (contentId) {
  if (!contentId) return {}

  const content = libs.content.get({ key: contentId })
  const url = libs.extPortal.pageUrl({ key: contentId, type: 'absolute' })
  const email = {
    subject: encodeURI(libs.objects.trySafe(() => content.displayName)),
    body: url
  }

  return {
    facebook: `${libs.objects.trySafe(() => libs.constants.shareList.facebook)}${url}`,
    linkedin: `${libs.objects.trySafe(() => libs.constants.shareList.linkedin)}${url}`,
    twitter: `${libs.objects.trySafe(() => libs.constants.shareList.twitter)}${url}`,
    mailTo: `mailto:?subject=${email.subject}&body=${email.body}`,
    link: url
  }
}
