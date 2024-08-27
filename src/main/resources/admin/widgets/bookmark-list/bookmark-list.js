const libs = {
  thymeleaf: require('/lib/thymeleaf'),
  portal: require('/lib/xp/portal'),
  content: require('/lib/xp/content'),
  bookmarkLib: require('/lib/modules/bookmark'),
  licenseLib: require('/lib/modules/license'),
  strings: require('/lib/util/strings')
}

exports.get = function (req) {
  const view = resolve('bookmark-list.html')

  if (!libs.licenseLib.isCurrentLicenseValid()) {
    const licenseServiceURL = libs.portal.serviceUrl({ service: 'license', type: 'absolute' })

    return {
      contentType: 'text/html',
      body: libs.thymeleaf.render(view, {
        licenseServiceURL,
        widgetURL: req.url,
        hasLicense: false,
        strings: {
          licenseTitle: libs.strings.translate('bookmark.widget.bookmark_license_title'),
          licenseUpload: libs.strings.translate('bookmark.widget.bookmark_license_upload'),
          licenseIsInvalid: libs.strings.translate('bookmark.widget.bookmark_license_is_invalid')
        }
      })
    }
  }

  const repositoryId = req.repositoryId
  const branch = req.branch
  const hostURL = req.headers.Referer
  const siteName = String(repositoryId).split('.').slice(-1)
  const editURL = `${hostURL}/${siteName}/edit`

  const items = libs.bookmarkLib.getFavoritesFromLoggedInUser({ repositoryId, branch, editURL })

  const bookmarkServiceURL = libs.portal.serviceUrl({ service: 'bookmark', type: 'absolute' })

  const model = {
    widgetURL: req.url,
    hasLicense: true,
    items,
    bookmarkServiceURL,
    repositoryId,
    branch,
    strings: {
      removeSelectedText: libs.strings.translate('bookmark.widget.top_menu.remove_selected_text'),
      removePriorityText: libs.strings.translate('bookmark.widget.top_menu.remove_priority_text'),
      addPriorityText: libs.strings.translate('bookmark.widget.top_menu.add_priority_text'),
      refreshText: libs.strings.translate('bookmark.widget.top_menu.refresh_text')
    }
  }

  return {
    body: libs.thymeleaf.render(view, model),
    contentType: 'text/html'
  }
}
