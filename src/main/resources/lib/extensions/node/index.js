const libs = {
  io: require('/lib/xp/io'),
  node: require('/lib/xp/node'),
  objects: require('/lib/util/objects'),
  strings: require('/lib/util/strings'),
  constants: require('/lib/util/constants'),
  extra: require('/lib/util/extra')
}

const repo = {
  draft: libs.node.connect({
    repoId: libs.constants.default,
    branch: 'draft',
    principals: ['role:system.admin']
  }),
  master: libs.node.connect({
    repoId: libs.constants.default,
    branch: 'master',
    principals: ['role:system.admin']
  })
}

module.exports = {
  compareObjectStream,
  singleDelete,
  getIDfromPath,
  override,
  getBinary,
  cleanFolder
}

function cleanFolder (path) {
  const toDelete = repo.draft.query({
    count: -1,
    query: `_parentPath = '${libs.strings.parseContentPath(path)}'`
  }).hits.map(obj => obj.id)

  if (toDelete.length > 0) singleDelete(toDelete)
}

function compareObjectStream (current, streamCmp) {
  if (current && current._path && current.fileName) {
    const stream = repo.draft.getBinary({
      key: current._path,
      binaryReference: current.fileName
    })
    return libs.io.readText(stream) !== libs.io.readText(streamCmp)
  }
  return undefined
}

function singleDelete (IdArr) {
  try {
    return {
      draft: repo.draft.delete(libs.objects.forceArray(IdArr)),
      master: repo.master.delete(libs.objects.forceArray(IdArr))
    }
  } catch (e) {
    libs.extra.reportError(__FILE__, 'Unexpected error on delete operation: ' + e.message)
  }
}

function getIDfromPath (_path, branch = 'draft') {
  const queryResult = repo[branch].query({
    query: `_path = '${libs.strings.parseContentPath(_path)}'`
  })
  return queryResult && queryResult.hits && queryResult.hits[0] && queryResult.hits[0].id
}

function override (newData, path, branch = 'draft') {
  if (!newData || !path) {
    return undefined
  }

  try {
    // Modify content by path
    const modified = repo[branch].modify({
      key: libs.strings.parseContentPath(path),
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
      }
    })

    // Force _path field in the contentLib-like format
    if (modified && modified._path) {
      modified._path = libs.strings.unParseContentPath(modified._path)
    }
    return modified
  } catch (e) {
    libs.extra.reportError(__FILE__, 'Unexpected error on override operation: ' + e.message)
  }

  return undefined
}

function getBinary (key, binaryReference, branch = 'draft') {
  return repo[branch].getBinary({
    key,
    binaryReference
  })
}
