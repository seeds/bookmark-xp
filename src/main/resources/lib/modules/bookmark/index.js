const libs = {
  extContext: require('/lib/extensions/context'),
  objects: require('/lib/util/objects'),
  constants: require('/lib/util/constants'),
  content: require('/lib/xp/content'),
  node: require('/lib/xp/node'),
  auth: require('/lib/xp/auth'),
  io: require('/lib/xp/io'),
  encodingLib: require('/lib/text-encoding')
}

module.exports = {
  favoriteContent,
  getContentChildren,
  getContentTypeIconBase64,
  getFavoritesFromLoggedInUser,
  isContentFavorite,
  isContentPriority,
  toggleContentPriority,
  unfavoriteContent
}

/**
 * Init the repositories to start to count the visits and conversions
 * @param {Object} params
 * @param {String} params.contentId
 */
function checkIfNodeExistsAndReturnIt (params) {
  const repo = getRepoConnection()

  const result = repo.query({
    query: `_name = '${params.contentId}'`,
    count: 1
  })

  return result && result.hits[0] && repo.get(result.hits[0].id)
}

/**
 * Receives the user key and uses it to create a new node
 * @param {String} name
 * @returns
 */
function createUserBookmarkNode (name) {
  try {
    const repo = getRepoConnection()

    return repo.create({
      _name: name,
      type: app.name + ':bookmark',
      data: {
        favorites: []
      }
    })
  } catch (error) {
    log.error('Error on createUserBookmarkNode function: ' + error)
  }
}

/**
 * Check the content as favorite on the current logged in user node
 * @param {Object} params
 * @param {String} params.contentId
 * @param {String} params.repositoryId
 */
function favoriteContent (params) {
  const repo = getRepoConnection()

  try {
    const loggedInUserInfo = getLoggedInUserInfo()

    if (!loggedInUserInfo) return

    let userNode = checkIfNodeExistsAndReturnIt({ contentId: loggedInUserInfo.key })

    if (!userNode) {
      userNode = createUserBookmarkNode(loggedInUserInfo.key)
    }

    return repo.modify({
      key: userNode._id,
      editor: function (c) {
        const currentFavoriteContents = libs.objects.forceArray(c.data.favorites || [])

        if (currentFavoriteContents.some(favoriteContent => favoriteContent.id === params.contentId)) {
          log.info(`Content ${params.contentId} is already bookmarked to user ${loggedInUserInfo.key}`)
          return
        }

        currentFavoriteContents.push({ id: params.contentId, repository: params.repositoryId, updatedAt: new Date().toISOString() })
        c.data.favorites = currentFavoriteContents

        return c
      }
    })
  } catch (error) {
    log.error('Error on favoriteContent function: ' + error)
  }
}

/**
 * Get the children of a content
 * @param {Object} params
 * @param {String} params.contentId
 * @param {String} params.repositoryId
 * @param {String} params.branch
 * @param {String} params.editURL host URL used to build the edit link to content studio
 * @returns {Array<Object> | undefined}
 */
function getContentChildren (params) {
  try {
    const result = libs.extContext.runInsideContext(params.repositoryId, params.branch, () => {
      return libs.content.getChildren({
        key: params.contentId,
        start: 0,
        count: -1
      })
    })

    if (!result.total) return

    return result.hits.map(item => {
      const icon = getContentTypeIconBase64(item.type)

      return {
        _id: item._id,
        _path: item._path,
        icon,
        displayName: item.displayName,
        hasChildren: item.hasChildren,
        link: `${params.editURL}/${item._id}`
      }
    })
  } catch (error) {
    log.error('Error on getContentChildren function: ' + error)
  }
}

function getContentTypeIconBase64 (type) {
  const contentType = libs.content.getType(type)
  let mimeType
  let base64

  if (!contentType.icon || !contentType.icon.mimeType || !contentType.icon.data) {
    const defaultIconResource = libs.io.getResource('/assets/images/icons/pencil.svg')
    mimeType = libs.io.getMimeType('/assets/images/icons/pencil.svg')
    base64 = libs.encodingLib.base64Encode(defaultIconResource.getStream())
  } else {
    base64 = libs.encodingLib.base64Encode(contentType.icon.data)
    mimeType = contentType.icon.mimeType
  }

  return `data:${mimeType};base64,${base64}`
}

/**
 *
 * @param {Object} params
 * @param {String} params.repositoryId
 * @param {String} params.branch
 * @param {String} params.editURL host URL used to build the edit link to content studio
 * @returns
 */
function getFavoritesFromLoggedInUser (params) {
  const repo = getRepoConnection()

  try {
    const user = getLoggedInUserInfo()
    let result = repo.query({
      query: `_name = '${user.key}'`
    })

    if (!result.total) return

    const userNode = repo.get(result.hits[0].id)
    const favorites = libs.objects.forceArray(userNode.data.favorites || [])
    const favoriteContentIds = favorites.map(favorite => `'${favorite.id}'`).toString()

    if (!favoriteContentIds) return

    result = libs.extContext.runInsideContext(params.repositoryId, params.branch, () => {
      return libs.content.query({
        query: `_id IN (${favoriteContentIds})`,
        start: 0,
        count: -1
      })
    })

    if (!result.total) return

    // const itemsNoFoundInResult = favorites.filter(favorite => !result.hits.some(item => favorite.id === item._id))

    // if (itemsNoFoundInResult.length) unfavoriteContent({ contentId: itemsNoFoundInResult.map(item => item.id) })

    return result.hits.map(item => {
      const icon = getContentTypeIconBase64(item.type)

      return {
        _id: item._id,
        _path: item._path,
        icon,
        displayName: item.displayName,
        hasChildren: item.hasChildren,
        link: `${params.editURL}/${item._id}`,
        isPriority: favorites.some(favorite => favorite.id === item._id && favorite.priority)
      }
    }).sort((a, b) => Number(b.isPriority || false) - Number(a.isPriority || false))
  } catch (error) {
    log.error('Error on getFavoritesFromLoggedInUser function: ' + error)
  }
}

/**
 * Get info from the current logged in user
 * @returns {{ key: String } | undefined}
 */
function getLoggedInUserInfo () {
  try {
    const user = libs.auth.getUser()

    if (!user) return

    return {
      key: user.key
    }
  } catch (error) {
    log.error('Error on getLoggedInUserInfo function: ' + error)
  }
}

function getRepoConnection (repoId = libs.constants.default.repository) {
  try {
    return libs.node.connect({
      repoId,
      branch: 'master',
      principals: ['role:system.admin']
    })
  } catch (error) {
    log.error('Error: ' + error)
    return null
  }
}

/**
 * Check if a content is already bookmarked
 * @param {Object} params
 * @param {String} params.contentId
 * @returns {Boolean}
 */
function isContentFavorite (params) {
  try {
    const loggedInUserInfo = getLoggedInUserInfo()

    if (!loggedInUserInfo) return

    const userNode = checkIfNodeExistsAndReturnIt({ contentId: loggedInUserInfo.key })

    if (!userNode) return

    return libs.objects.forceArray(userNode.data.favorites).some(favorite => favorite.id === params.contentId)
  } catch (error) {
    log.error('Error on isContentFavorite function: ' + error)
  }
}

/**
 * Check if a content is set as priority
 * @param {Object} params
 * @param {String} params.contentId
 * @returns {Boolean}
 */
function isContentPriority (params) {
  try {
    const loggedInUserInfo = getLoggedInUserInfo()

    if (!loggedInUserInfo) return

    const userNode = checkIfNodeExistsAndReturnIt({ contentId: loggedInUserInfo.key })

    if (!userNode) return

    return libs.objects.forceArray(userNode.data.favorites).some(favorite => favorite.id === params.contentId && favorite.priority)
  } catch (error) {
    log.error('Error on isContentPriority function: ' + error)
  }
}

/**
 * Toggle the priority property from a content. Set true if it's false or undefined, and set false if it's true.
 * @param {Object} params
 * @param {String|String[]} params.contentId
 * @param {Boolean} params.state
 */
function toggleContentPriority (params) {
  const repo = getRepoConnection()

  try {
    const loggedInUserInfo = getLoggedInUserInfo()

    if (!loggedInUserInfo) return

    let userNode = checkIfNodeExistsAndReturnIt({ contentId: loggedInUserInfo.key })

    if (!userNode) {
      userNode = createUserBookmarkNode(loggedInUserInfo.key)
    }

    return repo.modify({
      key: userNode._id,
      editor: function (c) {
        const currentFavoriteContents = libs.objects.forceArray(c.data.favorites || [])

        if (typeof params.contentId === 'object') {
          c.data.favorites = currentFavoriteContents.map(item => {
            if (params.contentId.some(contentId => contentId === item.id)) {
              item.priority = params.state
              item.updatedAt = new Date().toISOString()
            }

            return item
          })
        }

        if (typeof params.contentId === 'string') {
          c.data.favorites = currentFavoriteContents.map(item => {
            if (item.id === params.contentId) {
              item.priority = !item.priority
              item.updatedAt = new Date().toISOString()
            }

            return item
          })
        }

        return c
      }
    })
  } catch (error) {
    log.error('Error on toggleContentPriority function: ' + error)
  }
}

/**
 * Uncheck the content fron the current logged in user node list
 * @param {Object} params
 * @param {String|String[]} params.contentId
 */
function unfavoriteContent (params) {
  if (libs.objects.trySafe(() => !params.contentId || !params.contentId.length)) return

  const repo = getRepoConnection()

  try {
    const loggedInUserInfo = getLoggedInUserInfo()

    if (!loggedInUserInfo) return

    const userNode = checkIfNodeExistsAndReturnIt({ contentId: loggedInUserInfo.key })

    if (!userNode) return

    if (typeof params.contentId === 'string') {
      if (!isContentFavorite({ contentId: params.contentId })) return
    }

    return repo.modify({
      key: userNode._id,
      editor: function (c) {
        c.data.favorites = libs.objects.forceArray(c.data.favorites).filter(favorite => !libs.objects.forceArray(params.contentId).some(idToRemove => favorite.id === idToRemove))

        return c
      }
    })
  } catch (error) {
    log.error('Error on unfavoriteContent function: ' + error)
  }
}
