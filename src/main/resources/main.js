const context = require('/lib/xp/context')
const repo = require('/lib/xp/repo')

context.run({
  repository: 'com.enonic.cms.default',
  branch: 'draft',
  user: {
    login: 'su',
    idProvider: 'system'
  },
  principals: ['role:system.admin'],
  attributes: {
    ignorePublishTimes: true
  }
}, onStart)

function onStart () {
  try {
    createRepo('no.seeds.bookmark')
  } catch (err) {
    log.error('Error on starting main controller. More details:  ' + err)
  }
}

function createRepo (repoId) {
  try {
    if (!repo.get(repoId)) {
      const result = repo.create({
        id: repoId
      })

      log.info('Branch [' + result.id + '] created')
    }
  } catch (err) {
    log.error('Unexpected error: ' + err.message)
  }
}
