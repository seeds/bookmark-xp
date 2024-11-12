const libs = {
  thymeleaf: require('/lib/thymeleaf'),
  portal: require('/lib/xp/portal'),
  content: require('/lib/xp/content'),
  bookmarkLib: require('/lib/modules/bookmark'),
  licenseLib: require('/lib/modules/license'),
  strings: require('/lib/util/strings')
}

exports.get = function (req) {
  const contentId = req.params.contentId
  const repository = req.repositoryId

  if (!contentId) {
    return {
      contentType: 'text/html',
      body: `<widget class="error">${libs.strings.translate('bookmark.widget.context_panel.no_content_selected')}</widget>`
    }
  }

  if (!libs.licenseLib.isCurrentLicenseValid()) {
    const licenseServiceURL = libs.portal.serviceUrl({ service: 'license', type: 'absolute' })

    return {
      contentType: 'text/html',
      body: libs.thymeleaf.render(resolve('bookmark.html'), {
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

  const content = libs.content.get({ key: contentId })
  const bookmarkServiceURL = libs.portal.serviceUrl({ service: 'bookmark', type: 'absolute' })

  content.icon = libs.bookmarkLib.getContentTypeIconBase64(content.type)
  const isContentPriority = libs.bookmarkLib.isContentPriority({ contentId, repository })

  const model = {
    hasLicense: true,
    content,
    isContentFavorite: libs.bookmarkLib.isContentFavorite({ contentId, repository }),
    isContentPriority,
    strings: {
      bookmarkContentText: libs.strings.translate('bookmark.widget.context_panel.bookmark_content'),
      removeBookmarkText: libs.strings.translate('bookmark.widget.context_panel.remove_bookmark'),
      addPriorityText: libs.strings.translate('bookmark.widget.context_panel.add_priority_text'),
      removePriorityText: libs.strings.translate('bookmark.widget.context_panel.remove_priority_text')
    },
    bookmarkServiceURL
  }

  return {
    body: libs.thymeleaf.render(resolve('bookmark.html'), model),
    contentType: 'text/html'
  }
}
