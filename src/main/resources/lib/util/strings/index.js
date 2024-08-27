const libs = {
  portal: require('/lib/xp/portal'),
  i18n: require('/lib/xp/i18n')
}

module.exports = {
  stripInvalidQueryChars,
  translate,
  formatFileSize,
  removeFileExtension,
  parseContentPath,
  unParseContentPath,
  getFileNameFromURL,
  parseBrTag,
  unParseBrTag,
  removeBrTag,
  randomStr,
  getParentPath,
  buildScriptTag,
  buildStyleSheetTag,
  unparseChars,
  beforeComma,
  removeLabel,
  getContentTypeParsed,
  singleCapitalize,
  setImageWrapper,
  setTableWrapper,
  formatMoney,
  capitalize,
  putImgWrapperIntoFigure,
  toStringOrDefault,
  removeExtraMillisecondsFromDateTime,
  validateEmail,
  validatePassword,
  zeroPad,
  safeStringify
}

function singleCapitalize (s) {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getContentTypeParsed (type) {
  return type && type.replace(`${app.name}:`, '')
}

function stripInvalidQueryChars (queryString) {
  let cleanQuery = queryString.replace(/&&|\|\|/gi, ' ') // Replace operation tokens
  cleanQuery = cleanQuery.replace(/[+|\-*()"'{}[\]^?:\\]/gi, ' ') // Replace special characters
  cleanQuery = cleanQuery.replace(/\s+/gi, ' ') // Replace all whitespaces with plain spaces
  return cleanQuery
}

function translate (key, values = []) {
  return libs.i18n.localize({ key: key, locale: 'no', values })
}

function formatFileSize (bytes, dm = 1) {
  if (bytes === 0) return '0B'
  const k = 1000
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)).toString() + ' ' + sizes[i]
}

function removeFileExtension (fileName) {
  return fileName.replace(/\.[^/.]+$/, '')
}

function parseContentPath (_path) {
  return _path.startsWith('/content') ? _path : `/content${_path}`
}

function unParseContentPath (_path) {
  return _path.startsWith('/content') ? `${_path.split('/content')[1]}` : _path
}

function getFileNameFromURL (url) {
  return url.split('/').slice(-1)[0]
}

function parseBrTag (str) {
  return str && str.replace(/<br \/>|<br\/>|<br>/gi, '\n')
}

function unParseBrTag (str) {
  return str && str.replace(/\n/g, '<br>')
}

function removeBrTag (str) {
  return str && str.replace(/<br \/>|<br\/>|<br>/gi, '')
}

function setImageWrapper (html = '') {
  return html
    .replace(/<figure/g, '<div class="imageWrapper"><figure')
    .replace(/<\/figure>/g, '</figure></div>')
}

function setTableWrapper (html = '') {
  return html
    .replace(/<table/g, '<div class="tableWrapper"><table')
    .replace(/<\/table>/g, '</table></div>')
}

function randomStr (len, arr) {
  let ans = ''
  for (let i = len; i > 0; i--) {
    ans += arr[Math.floor(Math.random() * arr.length)]
  }
  return ans
}

function getParentPath (_path) {
  return (_path && _path.split('/').slice(0, -1).join('/')) || ''
}

function buildScriptTag (assetPath) {
  return `<script src="${libs.portal.assetUrl({ path: assetPath })}" ></script>`
}

function buildStyleSheetTag (assetPath) {
  return `<link rel="stylesheet" href="${libs.portal.assetUrl({ path: assetPath })}">`
}

function unparseChars (body) {
  if (!body) return
  body = body.replace(new RegExp('ø', 'g'), 'o')
  body = body.replace(new RegExp('&amp;oslash;', 'g'), 'ø')

  body = body.replace(new RegExp('Ø', 'g'), 'O')
  body = body.replace(new RegExp('&amp;Oslash;', 'g'), 'Ø')

  body = body.replace(new RegExp('Æ', 'g'), 'AE')
  body = body.replace(new RegExp('&amp;Aelig;', 'g'), 'AE')

  body = body.replace(new RegExp('&AElig;', 'g'), 'AE')
  body = body.replace(new RegExp('&amp;AElig;', 'g'), 'AE')

  body = body.replace(new RegExp('æ', 'g'), 'ae')
  body = body.replace(new RegExp('&amp;aelig;', 'g'), 'ae')

  body = body.replace(new RegExp('å', 'g'), 'a')
  body = body.replace(new RegExp('&amp;aring;', 'g'), 'a')

  body = body.replace(new RegExp('Å', 'g'), 'A')
  body = body.replace(new RegExp('&amp;Aring;', 'g'), 'Å')

  body = body.replace(new RegExp('Ä', 'g'), 'A')
  body = body.replace(new RegExp('&amp;Auml;', 'g'), 'Ä')

  body = body.replace(new RegExp('ä', 'g'), 'a')
  body = body.replace(new RegExp('&amp;auml;', 'g'), 'ä')

  body = body.replace(new RegExp('Ð', 'g'), 'ETH')
  body = body.replace(new RegExp('&amp;ETH;', 'g'), 'Ð')

  body = body.replace(new RegExp('ð', 'g'), 'eth')
  body = body.replace(new RegExp('&amp;eth;', 'g'), 'ð')

  body = body.replace(new RegExp('Ö', 'g'), 'O')
  body = body.replace(new RegExp('&amp;Ouml;', 'g'), 'Ö')

  body = body.replace(new RegExp('ö', 'g'), 'o')
  body = body.replace(new RegExp('&amp;ouml;', 'g'), 'ö')

  body = body.replace(new RegExp('Þ', 'g'), 'Þ')
  body = body.replace(new RegExp('&amp;THORN;', 'g'), 'Þ')

  body = body.replace(new RegExp('á', 'g'), 'a')
  body = body.replace(new RegExp('Á', 'g'), 'A')

  body = body.replace(new RegExp('é', 'g'), 'e')
  body = body.replace(new RegExp('É', 'g'), 'E')

  body = body.replace(new RegExp('í;', 'g'), 'i')
  body = body.replace(new RegExp('Í', 'g'), 'I')

  body = body.replace(new RegExp('ó', 'g'), 'o')
  body = body.replace(new RegExp('Ó', 'g'), 'O')

  body = body.replace(new RegExp('ú', 'g'), 'u')
  body = body.replace(new RegExp('Ú', 'g'), 'U')

  body = body.replace(new RegExp('à', 'g'), 'a')
  body = body.replace(new RegExp('À', 'g'), 'A')

  body = body.replace(new RegExp('è', 'g'), 'e')
  body = body.replace(new RegExp('È', 'g'), 'E')

  body = body.replace(new RegExp('ì', 'g'), 'i')
  body = body.replace(new RegExp('Ì', 'g'), 'I')

  body = body.replace(new RegExp('ò', 'g'), 'o')
  body = body.replace(new RegExp('Ò', 'g'), 'O')

  body = body.replace(new RegExp('ù', 'g'), 'u')
  body = body.replace(new RegExp('Ù', 'g'), 'U')

  body = body.replace(new RegExp('â', 'g'), 'a')
  body = body.replace(new RegExp('Â', 'g'), 'A')

  body = body.replace(new RegExp('ê', 'g'), 'e')
  body = body.replace(new RegExp('Ê', 'g'), 'E')

  body = body.replace(new RegExp('î', 'g'), 'i')
  body = body.replace(new RegExp('Î', 'g'), 'I')

  body = body.replace(new RegExp('ô', 'g'), 'o')
  body = body.replace(new RegExp('Ô', 'g'), 'O')

  body = body.replace(new RegExp('û', 'g'), 'u')
  body = body.replace(new RegExp('Û', 'g'), 'U')

  return body
}

function beforeComma (str) {
  return str && str.toString().split(',')[0]
}

function removeLabel (str, label) {
  if (str && str.toString()) {
    if (str.toString().split(':').length > 1) {
      if (label) {
        return str.toString().split(':')[0] === label ? str.toString().split(':').slice(1).join(':').trim() : str.toString()
      } else {
        return str.toString().split(':').slice(1).join(':').trim()
      }
    } else {
      return str.toString()
    }
  }
}

function formatMoney (amount, decimalCount = 2, decimal = ',', thousands = ' ') {
  try {
    decimalCount = Math.abs(decimalCount)
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount

    const negativeSign = amount < 0 ? '-' : ''

    const i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString()
    const j = (i.length > 3) ? i.length % 3 : 0

    const newAmount = negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : '')
    const newAmountWithMask = (`kr ${newAmount}`).replace(',00', ',-')
    return newAmountWithMask
  } catch (e) {
    log.info(e)
  }
}

function capitalize (str, lower = false) {
  return (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase())
}

function putImgWrapperIntoFigure (html = '') {
  return html
    .replace(/<figure/g, '<div class="imageWrapper"><figure')
    .replace(/<\/figure>/g, '</figure></div>')
}

/**
 * @returns {String}
 */
function toStringOrDefault (strObj, defaultValue) {
  if (strObj === null || strObj === undefined) {
    return defaultValue
  }
  return (typeof strObj.toISOString === 'function') ? strObj.toISOString() : String(strObj)
}

function removeExtraMillisecondsFromDateTime (dataString) {
  if (dataString.length > 20) {
    dataString = `${dataString.substring(0, 23)}Z`
  }
  return dataString
}

/**
 * Function to validate an email address
 * @param {String} email
 * @returns {Boolean}
 */
function validateEmail (email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}

/**
 * checks if the password follow the defined business rules
 * @param {String} pw the password
 * @returns {Boolean}
 */
function validatePassword (pw) {
  return (/[A-Z]/.test(pw) ||
    /[a-z]/.test(pw)) &&
    /[0-9]/.test(pw) &&
    pw.length >= 8
}

function zeroPad (base, targetLength, padString) {
  targetLength = targetLength || 2
  padString = padString || '0'
  targetLength = targetLength >> 0 // truncate if number or convert non-number to 0;
  padString = String((typeof padString !== 'undefined' ? padString : ' '))
  if (base.length > targetLength) {
    return String(base)
  } else {
    targetLength = targetLength - base.length
    if (targetLength > padString.length) {
      padString += padString.repeat(targetLength / padString.length) // append to original to ensure we are longer than needed
    }
    return padString.slice(0, targetLength) + String(base)
  }
}

/**
 * @param {object} source
 * @param {function} handler
 * @param {number} tabs
 * @returns {string} `string`
 */
function safeStringify (source, handler, tabs) {
  let result
  try {
    result = JSON.stringify(source, handler, tabs)
  } catch (e) {
    result = ''
  }
  return result
}
