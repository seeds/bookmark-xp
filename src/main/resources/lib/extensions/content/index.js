const libs = {
  content: require('/lib/xp/content'),
  context: require('/lib/xp/context'),
  io: require('/lib/xp/io'),
  objects: require('/lib/util/objects'),
  strings: require('/lib/util/strings'),
  extra: require('/lib/util/extra'),
  constants: require('/lib/util/constants')
}

const SITE_PATH = libs.constants.default.sitePath

// Wrapper for the content lib, in order to allow use the branch parameter
// this customization of lib content exports is extremely useful, it allows passing the branch as a parameter of any method (query, get ...)
for (var libFunctionIterator in libs.content) {
  var libFunction = String(libFunctionIterator)
  exports[libFunction] = (function (funcName) {
    return function () {
      var arg = arguments
      if (arg && arg[0] && arg[0].branch) {
        return libs.context.run({
          branch: arg[0].branch,
          user: {
            login: 'su',
            idProvider: 'system'
          },
          principals: ['role:system.admin']
        }, () => {
          return libs.content[funcName](arg[0])
        })
      } else { return libs.content[funcName](arg[0]) }
    }
  })(libFunction)
}

module.exports.getNodeContent = function (nodeID) {
  let nodeContent
  if (nodeID) {
    try {
      nodeContent = libs.content.get({
        key: nodeID
      })
    } catch (error) {
      libs.extra.reportError(__FILE__, 'getNodeContent error %s', error)
    }
  }
  return nodeContent
}

module.exports.override = function (newData, path) {
  if (!newData || !path) {
    return undefined
  }

  try {
    // Modify content by path
    return module.exports.modify({
      key: libs.strings.unParseContentPath(path),
      editor: function (c) {
        function updateContent (oldC, newC) {
          for (const prop in newC) {
            if (libs.objects.isObject(newC[prop])) {
              if (oldC[prop]) { updateContent(oldC[prop], newC[prop]) } else { oldC[prop] = newC[prop] }
            } else {
              oldC[prop] = newC[prop]
            }
          }
        }
        updateContent(c, newData)
        return c
      },
      branch: 'draft'
    })
  } catch (e) {
    libs.extra.reportError(__FILE__, 'Unexpected error on override operation: ' + e.message)
  }

  return undefined
}

function editor (c) {
  if (c.workflow.state !== 'READY') {
    c.workflow.state = 'READY'
  }

  return c
}

module.exports.publishToMaster = function (ids, forcePublish = true, forcePublishChildren = false) {
  const keys = libs.objects.forceArray(ids)
  if (!keys || keys.length === 0) {
    return undefined
  }

  if (forcePublish) {
    keys.forEach(id => {
      try {
        libs.content.modify({
          key: id,
          editor: editor
        })
      } catch (error) {
        log.error(`Unexpected error setting workflow.state to READY: ${error}`)
      }

      if (forcePublishChildren) {
        try {
          const keyPath = libs.objects.trySafe(() => libs.content.get({ key: id })._path)

          if (keyPath) {
            const query = `_path LIKE '/content${keyPath}/*'`

            const childrenIds = libs.content.query({
              start: 0,
              count: 10000,
              query: query
            }).hits.map(item => item._id).filter(Boolean)

            childrenIds.forEach(childId => {
              libs.content.modify({
                key: childId,
                editor: editor
              })
            })
          }
        } catch (error) {
          log.error(`Unexpected error setting child workflow.state to READY: ${error}`)
        }
      }
    })
  }

  // Publish content by path or key
  try {
    // var result = repo.draft.push({
    //   keys,
    //   target: 'master'
    // })
    var result = module.exports.publish({
      keys,
      sourceBranch: 'draft',
      targetBranch: 'master'
    })
  } catch (e) {
    libs.extra.reportError(__FILE__, 'Unexpected error on publish operation: ' + e.message)
    return undefined
  }

  if (result) {
    if (result.failedContents && result.failedContents.length) {
      libs.extra.reportError(__FILE__, `Publish failed: ${result.failedContents.join(' ')}`)
      return undefined
    }
    return true
  } else {
    libs.extra.reportError(__FILE__, `Publish failed: ${keys.join(' ')}`)
    return undefined
  }
}

module.exports.getUnusedName = function (parentPath, _name = libs.constants.default.unnamed) {
  let checkedName = _name

  while (
    module.exports.exists({
      key: libs.strings.unParseContentPath(parentPath) + `/${checkedName}`
    })
  ) {
    checkedName = `${_name}-${libs.strings.randomStr(19, '1234567890')}`
  }

  return checkedName
}

// Used for debug purposes
module.exports.writeJSON = function (jsonData) {
  const site = module.exports.getNodeContent(SITE_PATH)

  const newStream = libs.io.newStream(JSON.stringify(jsonData, null, 4))
  try {
    const result2 = module.exports.create({
      name: 'json-parsed',
      parentPath: `${site._path}`,
      displayName: 'JSON Parsed',
      contentType: 'media:code',
      data: {},
      branch: 'draft'
    })
    libs.strings.debugLog('Content created with id ' + result2._id)

    module.exports.addAttachment({
      key: result2._id,
      name: 'parsed.json',
      mimeType: 'application/json',
      label: 'JSON',
      data: newStream,
      branch: 'draft'
    })
  } catch (e) {
    if (e.code === 'contentAlreadyExists') {
      libs.extra.reportError(__FILE__, 'There is already a content with that name')
    } else {
      libs.extra.reportError(__FILE__, 'Unexpected error: ' + e.message)
    }
  }
}
