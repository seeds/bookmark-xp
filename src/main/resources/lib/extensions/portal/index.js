
const libs = {
  portal: require('/lib/xp/portal'),
  content: require('/lib/xp/content'),
  objects: require('/lib/util/objects')
}

module.exports = {
  pageUrl,
  getAssetURL,
  processHTMLField,
  imageUrl,
  attachmentUrl,
  processTextArea,
  getLink,
  getAssetURLLikeObj,
  getImageAndScale
}

/**
 * Receives an internal link and external to return one of them. Internal link has priority
 *
 * @param {Object} params
 * @param {String} [params.internal]
 * @param {String} [params.external]
 * @returns {{ href: string, target: string, noLink?: boolean }}
 */
function getLink (params) {
  const internal = libs.objects.trySafe(() => params.internal)
  const external = libs.objects.trySafe(() => params.external)

  if (internal) {
    return {
      href: pageUrl({ key: internal }),
      target: '_self'
    }
  }

  if (external) {
    return {
      isExternal: true,
      href: external,
      target: '_blank',
      rel: 'noopener noreferrer'
    }
  }

  return {
    href: 'javascript:void(0)',
    target: '',
    noLink: true
  }
}

/**
 * Generates a page URL
 * @param {Object} props
 * @param {String} props.key
 * @param {'server'|'absolute'} [props.type="absolute"]
 * @param {Object} props.params
 * @returns
 */
function pageUrl (props) {
  return props && props.key && libs.portal.pageUrl({
    id: props.key,
    params: props.params,
    type: props.type || 'absolute'
  })
}

function attachmentUrl (nodeID, params, download = false) {
  return nodeID && libs.portal.attachmentUrl({
    id: nodeID,
    params: params,
    download: download,
    type: 'absolute'
  })
}

function getAssetURL (assetPath) {
  return libs.portal.assetUrl({
    path: assetPath,
    type: 'absolute'
  })
}

function getAssetURLLikeObj (assetPath) {
  return {
    link: getAssetURL(assetPath),
    alt: '',
    caption: '',
    title: ''
  }
}

function adjustTablesInsideHtmlField (html) {
  const contentPageTableClass = 'htmlArea__table'

  html = html.replace(/<table/g, `<div class="${contentPageTableClass}"><table`)
  html = html.replace(/<\/table>/g, '</table></div>')

  return html
}

function processHTMLField (HTMLAreaField) {
  HTMLAreaField = libs.objects.trySafe(function () { return adjustTablesInsideHtmlField(HTMLAreaField) }) || HTMLAreaField
  const processedText = HTMLAreaField && libs.portal.processHtml({
    value: HTMLAreaField,
    type: 'absolute'
  })
  return processedText
}

function processTextArea (textArea) {
  return textArea && textArea.replace(/\n/g, '<br>')
}

/**
 * Generates an image URL using Portal lib
 * @param {Object} props
 * @param {String} props.id
 * @param {String?} [props.scale="width(800)"]
 * @param {String?} props.format
 * @param {number?} props.quality range between 0 and 100 to JPEG image quality
 * @param {String?} props.filter
 * @param {String?} props.altText
 * @returns {{ link: string, alt: string, caption: string, title: string }}
 */
function imageUrl (props) {
  const params = libs.objects.trySafe(() => props) || {}

  const id = params.id

  if (!id) return

  const imageExist = libs.content.exists({ key: id })
  const imgObj = imageExist && libs.content.get({ key: id })

  if (!imgObj) return

  const imgOpts = {
    id,
    scale: params.scale || 'width(800)',
    type: 'absolute',
    filter: params.filter
  }

  const format = params.format
  const quality = params.quality

  if (format || quality) {
    if (imgObj.type !== 'media:vector' && format) imgOpts.format = format
    if (imgObj.type !== 'media:vector' && quality) imgOpts.quality = quality
  }

  // When image/gif do not use imageUrl
  let link = false
  if (libs.objects.trySafe(() => imgObj.x.media.imageInfo.contentType) === 'image/gif') {
    link = attachmentUrl(imgObj._id)
  } else {
    link = libs.portal.imageUrl(imgOpts)
  }

  if (!link || link.indexOf('error/404') >= 0 || link.indexOf('error/500') >= 0) return

  return {
    link,
    alt: (imgObj.data && imgObj.data.altText) || props.altText || '',
    caption: (imgObj.data && imgObj.data.caption) || '',
    title: imgObj.displayName || ''
  }
}

function getImageAndScale (imageId) {
  if (imageId) {
    if (libs.content.exists({ key: imageId })) {
      const imageObj = libs.content.get({
        key: imageId
      })

      const width = imageObj.x.media.imageInfo.imageWidth
      const height = imageObj.x.media.imageInfo.imageHeight

      const imageUrl = libs.portal.imageUrl({
        id: imageId,
        scale: `${width}, ${height}`,
        type: 'absolute'
      })
      return {
        imageUrl,
        scale: `${width}x${height}`
      }
    }
  }
  return undefined
}
