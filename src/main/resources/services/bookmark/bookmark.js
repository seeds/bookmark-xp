const libs = {
  objects: require('/lib/util/objects'),
  bookmarkLib: require('/lib/modules/bookmark')
}

exports.post = function handler (request) {
  const body = libs.objects.trySafe(() => JSON.parse(request.body))
  const repositoryId = request.repositoryId

  let response

  switch (body.action) {
    case 'favorite': {
      response = libs.bookmarkLib.favoriteContent({ contentId: body.contentId, repositoryId })
      break
    }

    case 'unfavorite': {
      if (body.contentIds) {
        response = libs.bookmarkLib.unfavoriteContent({ contentId: body.contentIds, repositoryId })
      } else if (body.contentId) {
        response = libs.bookmarkLib.unfavoriteContent({ contentId: body.contentId, repositoryId })
      }
      break
    }

    case 'toggle_priority': {
      response = libs.bookmarkLib.toggleContentPriority({ contentId: body.contentId, repositoryId })
      break
    }

    case 'add_priority': {
      response = libs.bookmarkLib.toggleContentPriority({ contentId: body.contentIds, state: true, repositoryId })
      break
    }

    case 'remove_priority': {
      response = libs.bookmarkLib.toggleContentPriority({ contentId: body.contentIds, state: false, repositoryId })
      break
    }
    default: {
      response = {
        message: 'Error'
      }
    }
  }

  return {
    status: !response ? 500 : 200,
    contentType: 'application/json',
    body: response
  }
}

exports.get = function handler (request) {
  const params = request.params
  const branch = params.branch
  const repositoryId = params.repositoryId
  const hostURL = request.headers.Referer
  const siteName = String(repositoryId).split('.').slice(-1)
  const editURL = `${hostURL}/${siteName}/edit`

  let items

  switch (params.action) {
    case 'get-children': {
      items = libs.bookmarkLib.getContentChildren({ branch, repositoryId, contentId: params.contentId, editURL })
      break
    }
    case 'get-all': {
      items = libs.bookmarkLib.getFavoritesFromLoggedInUser({ branch, repositoryId, editURL })
    }
  }

  return {
    contentType: 'application/json',
    body: items || []
  }
}
