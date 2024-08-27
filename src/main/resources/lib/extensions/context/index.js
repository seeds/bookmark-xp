const libs = {
  context: require('/lib/xp/context')
}

module.exports = {
  runInsideContext
}

/**
 * Allow Context.run reuse
 * @param {String} repository
 * @param {String} branch
 * @param {Function} callback
 * @param {*} callbackParams
 * @returns
 */
function runInsideContext (repository, branch, callback, callbackParams) {
  try {
    return libs.context.run({
      repository,
      branch,
      user: {
        login: 'su',
        idProvider: 'system'
      },
      principals: ['role:system.admin']
    }, () => {
      return callback(callbackParams)
    })
  } catch (error) {
    log.error(`Unexpected error running inside context: ${error}`)
  }
}
