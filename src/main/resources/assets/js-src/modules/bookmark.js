function main () {
  window.addEventListener('hashchange', function (e) {
    const newURL = e.newURL
    const repositoryName = newURL.split('main#/')[1].split('/')[0]

    updateBookmarkTree(`com.enonic.cms.${repositoryName}`)
    disableHeaderButtons()
  })

  if (!window.location.hash.includes('widget/bookmark/bookmark-list')) {
    const bookmarkContextPanelElement = document.getElementById('bookmark__context-panel')
    const favoriteContentButtonElement = document.querySelector('[data-id="favorite-content-button"]')
    const unfavoriteContentButtonElement = document.querySelector('[data-id="unfavorite-content-button"]')
    const setPriorityButtonElement = document.querySelector('[data-id="set-priority-button"]')

    const contentId = bookmarkContextPanelElement.getAttribute('data-content-id')
    const bookmarkServiceURL = bookmarkContextPanelElement.getAttribute('data-bookmark-service-url')

    addUploadLicenseListener(bookmarkContextPanelElement)

    if (!bookmarkServiceURL) return

    if (favoriteContentButtonElement) {
      favoriteContentButtonElement.addEventListener('click', function () {
        favoriteContentButtonElement.setAttribute('disabled', true)
        fetch(bookmarkServiceURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'favorite', contentId })
        }).then(response => response.json()).then(data => {
          favoriteContentButtonElement.removeAttribute('disabled')
          if (data && data._id) {
            updateBookmarkTree()
            favoriteContentButtonElement.style.display = 'none'
            unfavoriteContentButtonElement.style.display = 'block'
            setPriorityButtonElement.style.display = 'block'
            setPriorityButtonElement.classList.remove('selected')
          } else {
            bookmarkContextPanelElement.insertAdjacentHTML('beforeend', '<p class="bookmark__context-panel__error">It was not possible to bookmark this content</p>')
          }
        })
      })
    }

    if (unfavoriteContentButtonElement) {
      unfavoriteContentButtonElement.addEventListener('click', function () {
        unfavoriteContentButtonElement.setAttribute('disabled', true)
        fetch(bookmarkServiceURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'unfavorite', contentId })
        }).then(response => response.json()).then(data => {
          unfavoriteContentButtonElement.removeAttribute('disabled')
          if (data && data._id) {
            updateBookmarkTree()
            unfavoriteContentButtonElement.style.display = 'none'
            favoriteContentButtonElement.style.display = 'block'
            setPriorityButtonElement.style.display = 'none'
          } else {
            bookmarkContextPanelElement.insertAdjacentHTML('beforeend', '<p class="bookmark__context-panel__error">It was not possible to remove the bookmark</p>')
          }
        })
      })
    }

    handlePriorityButtonListener({ contentId, bookmarkServiceURL, bookmarkContextPanelElement })
  } else {
    const bookmarkTopMenuElement = document.getElementById('bookmark__top-menu')
    const itemsWithChildren = document.querySelectorAll('[data-content-id]')

    if (!bookmarkTopMenuElement) return
    if (!itemsWithChildren) return

    addGetChildrenEventListener()
    checkBoxEventListener()
    addRemoveBookmarkEventListener()
    addPriorityBookmarkEventListener()
    addRefreshTreeEventListener()
    addUploadLicenseListener(bookmarkTopMenuElement)
  }
}

function addGetChildrenEventListener () {
  const bookmarkTopMenuElement = document.getElementById('bookmark__top-menu')
  const bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url')
  const repositoryId = bookmarkTopMenuElement.getAttribute('data-repository-id')
  const branch = bookmarkTopMenuElement.getAttribute('data-branch')

  const itemsWithChildren = document.querySelectorAll('[data-content-id].expandable')

  if (!itemsWithChildren.length) return

  itemsWithChildren.forEach(item => {
    if (item.classList.contains('expandable')) {
      item.addEventListener('click', () => getChildrenEventListener({ bookmarkServiceURL, branch, repositoryId, item }))
    }
  })
}

function addPriorityBookmarkEventListener () {
  const deprioritizeSelectedButton = document.querySelector('[data-id="deprioritizeSelected"]')
  const prioritizeSelectedButton = document.querySelector('[data-id="prioritizeSelected"]')
  const bookmarkTopMenuElement = document.getElementById('bookmark__top-menu')
  const bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url')

  deprioritizeSelectedButton && deprioritizeSelectedButton.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.item-wrapper label.checked')

    if (!checkboxes.length) return

    const contentIds = []
    checkboxes.forEach(checkbox => {
      if (checkbox.nextElementSibling.nextElementSibling.classList.contains('priority')) contentIds.push(checkbox.getAttribute('id'))
    })

    fetch(bookmarkServiceURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_priority', contentIds })
    }).then(response => response.json()).then(data => {
      if (data && data._id) {
        updateBookmarkTree()
        disableHeaderButtons()
      }
    })
  })

  prioritizeSelectedButton && prioritizeSelectedButton.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.item-wrapper label.checked')

    if (!checkboxes.length) return

    const contentIds = []
    checkboxes.forEach(checkbox => {
      if (!checkbox.nextElementSibling.nextElementSibling.classList.contains('priority')) contentIds.push(checkbox.getAttribute('id'))
    })

    fetch(bookmarkServiceURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_priority', contentIds })
    }).then(response => response.json()).then(data => {
      if (data && data._id) {
        updateBookmarkTree()
        disableHeaderButtons()
      }
    })
  })
}

/**
 * Event listener added to the refresh button in order to update the favorite contents tree
 */
function addRefreshTreeEventListener () {
  const refreshButtonElement = document.getElementById('refreshContent')
  refreshButtonElement && refreshButtonElement.addEventListener('click', () => {
    const repositoryName = window.location.href.split('main#/')[1].split('/')[0]

    updateBookmarkTree(`com.enonic.cms.${repositoryName}`)
    disableHeaderButtons()
  })
}

function addRemoveBookmarkEventListener () {
  const removeSelection = document.getElementById('removeSelection')
  const bookmarkTopMenuElement = document.getElementById('bookmark__top-menu')
  const bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url')

  removeSelection && removeSelection.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.item-wrapper label.checked')
    const contentIds = []

    if (!checkboxes.length) return

    checkboxes.forEach(checkbox => contentIds.push(checkbox.getAttribute('id')))

    fetch(bookmarkServiceURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unfavorite', contentIds })
    }).then(response => response.json()).then(data => {
      if (data && data._id) {
        checkboxes.forEach(checkbox => {
          if (contentIds.some(id => id === checkbox.getAttribute('id'))) {
            checkbox.closest('.item').remove()
          }
        })

        disableHeaderButtons()
      }
    })
  })
}

/**
 *
 * @param {Element} widgetElement
 * @returns
 */
function addUploadLicenseListener (widgetElement) {
  const uploadLicenseButtonElement = widgetElement.querySelector('#bookmark_upload_input')

  if (!uploadLicenseButtonElement) return

  uploadLicenseButtonElement.addEventListener('click', function () {
    this.querySelector('input').click()
  }, false)

  uploadLicenseButtonElement.querySelector('input').addEventListener('change', function (e) {
    const serviceUrl = this.getAttribute('data-license-service-url')
    const licenseFile = e.target.files[0]

    if (licenseFile) {
      const formData = new FormData()
      formData.append('license', licenseFile)

      fetch(serviceUrl, {
        method: 'POST',
        body: formData
      })
        .then(response => {
          if (response.ok) {
            document.querySelector('.bookmark_license .error-message').style.display = 'none'
            reloadWidget()
          } else {
            document.querySelector('.bookmark_license .error-message').style.display = 'block'
          }
        })
        .catch(() => {
          document.querySelector('.bookmark_license .error-message').style.display = 'none'
        })
    }
  })
}

function updateBookmarkTree (repositoryName) {
  const bookmarkTopMenuElement = document.getElementById('bookmark__top-menu')

  if (!bookmarkTopMenuElement) return

  const bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url')
  const repositoryId = repositoryName || bookmarkTopMenuElement.getAttribute('data-repository-id')
  bookmarkTopMenuElement.setAttribute('data-repository-id', repositoryId)
  const branch = bookmarkTopMenuElement.getAttribute('data-branch')

  fetch(bookmarkServiceURL + `?repositoryId=${repositoryId}&branch=${branch}&action=get-all`).then(response => response.json()).then(data => {
    const listElement = document.querySelector('.bookmark-list')

    if (!listElement) return

    listElement.innerHTML = ''
    const sublistElement = buildBookmarkTree({ data, reset: true })
    listElement.insertAdjacentElement('beforeend', sublistElement)
  }).then(() => checkBoxEventListener())
}

function checkBoxEventListener () {
  let checkboxes = document.querySelectorAll('.item-wrapper label')
  const checkAll = document.querySelector('#checkAll')
  const removeSelection = document.querySelector('#removeSelection')
  const deprioritizeSelectedButton = document.querySelector('[data-id="deprioritizeSelected"]')
  const prioritizeSelectedButton = document.querySelector('[data-id="prioritizeSelected"]')

  checkboxes.forEach(item => {
    if (item.getAttribute('listener') !== 'true') {
      item.addEventListener('click', event => {
        event.preventDefault()

        item.setAttribute('listener', 'true')
        if (checkAll.classList.contains('checked') && item.classList.contains('checked')) {
          checkAll.classList.remove('checked')
        }
        item.classList.toggle('checked')

        updateSelectionStatus()
      })
    }
  })

  if (checkAll && checkAll.getAttribute('listener') !== 'true') {
    checkAll.setAttribute('listener', 'true')
    checkAll.addEventListener('click', event => {
      event.preventDefault()
      checkboxes = document.querySelectorAll('.item-wrapper label')

      if (!checkAll.classList.contains('checked')) {
        checkAll.classList.add('checked')
        checkboxes.forEach(item => {
          if (!item.classList.contains('checked')) {
            item.classList.add('checked')
          }
        })

        removeSelection.classList.remove('disabled')
      } else {
        checkAll.classList.remove('checked')
        checkboxes.forEach(item => {
          if (item.classList.contains('checked')) {
            item.classList.remove('checked')
          }
        })
      }

      updateSelectionStatus()
    })
  }

  /**
   * Disable/Enable the header buttons based on the current status of the checkboxes and priority defined
   */
  function updateSelectionStatus () {
    checkboxes = document.querySelectorAll('.item-wrapper label')

    const items = { checked: 0, checkedPriority: 0, checkedNoPriority: 0 }

    checkboxes.forEach(item => {
      const priorityElement = item.nextElementSibling.nextElementSibling

      const isChecked = item.classList.contains('checked')
      const isPriority = priorityElement.classList.contains('priority')
      if (isChecked) {
        items.checked++

        if (isPriority) items.checkedPriority++
        else items.checkedNoPriority++
      }
    })

    if (items.checked > 0) toggleDisableElement({ element: removeSelection, disable: false })
    else toggleDisableElement({ element: removeSelection, disable: true })

    if (items.checked === 0) {
      toggleDisableElement({ element: deprioritizeSelectedButton, disable: true })
      toggleDisableElement({ element: prioritizeSelectedButton, disable: true })
    } else {
      if (items.checkedPriority > 0) toggleDisableElement({ element: deprioritizeSelectedButton, disable: false })
      else toggleDisableElement({ element: deprioritizeSelectedButton, disable: true })

      if (items.checkedNoPriority > 0) toggleDisableElement({ element: prioritizeSelectedButton, disable: false })
      else toggleDisableElement({ element: prioritizeSelectedButton, disable: true })
    }
  }
}

/**
 * Adds 'disabled' class and disabled attribute to the HTML element
 * @param {Object} params
 * @param {HTMLElement} params.element
 * @param {Boolean} params.disable
 */
function toggleDisableElement (params) {
  if (!params.element) return

  if (params.disable) {
    params.element.classList.add('disabled')
    params.element.setAttribute('disabled', '')
    return
  }

  params.element.classList.remove('disabled')
  params.element.removeAttribute('disabled')
}

/**
 * Add event listener to the priority button from context panel widget and handle the checked/unchecked button state
 * @param {Object} params
 * @param {String} params.contentId
 * @param {String} params.bookmarkServiceURL
 * @param {HTMLElement} params.bookmarkContextPanelElement
 */
function handlePriorityButtonListener (params) {
  const { contentId, bookmarkServiceURL, bookmarkContextPanelElement } = params
  const setPriorityButtonElement = document.querySelector('[data-id="set-priority-button"]')
  const tooltip = document.querySelector('.priority-tooltip')

  if (setPriorityButtonElement.getAttribute('listener') === 'true') return

  setPriorityButtonElement.addEventListener('click', () => {
    if (bookmarkContextPanelElement.querySelector('.bookmark__context-panel__error')) {
      bookmarkContextPanelElement.querySelector('.bookmark__context-panel__error').remove()
    }

    fetch(bookmarkServiceURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_priority', contentId })
    }).then(response => response.json()).then(data => {
      setPriorityButtonElement.removeAttribute('disabled')

      if (!data || !data._id) {
        bookmarkContextPanelElement.insertAdjacentHTML('beforeend', '<p class="bookmark__context-panel__error">It was not possible to remove priority from this content</p>')
        return
      }

      updateBookmarkTree()
      if (setPriorityButtonElement.classList.contains('selected')) tooltip.innerHTML = tooltip.getAttribute('data-add-priority-text')
      else tooltip.innerHTML = tooltip.getAttribute('data-remove-priority-text')

      setPriorityButtonElement.classList.toggle('selected')
    })
  })

  setPriorityButtonElement.setAttribute('listener', 'true')
}

/**
 * Create each child and attach the 'click' event listener
 * @param {Object} params
 * @param {String} params.bookmarkServiceURL
 * @param {String} params.repositoryId
 * @param {String} params.branch
 * @param {HTMLElement} params.item
 */
function getChildrenEventListener (params) {
  const { bookmarkServiceURL, branch, repositoryId, item } = params
  const contentId = item.getAttribute('data-content-id')

  if (!item.classList.contains('expanded')) {
    fetch(bookmarkServiceURL + `?contentId=${contentId}&repositoryId=${repositoryId}&branch=${branch}&action=get-children`).then(response => response.json()).then(data => {
      const sublistElement = buildBookmarkTree({ data })
      item.parentElement.parentElement.insertAdjacentElement('beforeend', sublistElement)

      item.classList.add('expanded')
    })
  } else {
    item.classList.remove('expanded')
    item.parentElement.parentElement.querySelector('.bookmark-sublist').remove()
  }
}

/**
 *
 * @param {Object} params
 * @param {Object[]} params.data
 * @param {Boolean} [params.reset=false] if true, the bookmark-list element should be reset before
 * @returns
 */
function buildBookmarkTree (params) {
  const { data, reset = false } = params

  const bookmarkTopMenuElement = document.getElementById('bookmark__top-menu')
  const bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url')
  const repositoryId = bookmarkTopMenuElement.getAttribute('data-repository-id')
  const branch = bookmarkTopMenuElement.getAttribute('data-branch')

  const sublistElement = document.createElement('div')
  if (!reset) sublistElement.classList.add('bookmark-sublist')

  data.forEach(child => {
    const itemElement = document.createElement('div')
    itemElement.classList.add('item')

    const itemWrapperElement = document.createElement('div')
    itemWrapperElement.classList.add('item-wrapper')

    itemElement.appendChild(itemWrapperElement)

    const toggleElement = document.createElement('div')
    toggleElement.classList.add('toggle', 'icon', 'expand')
    if (child.hasChildren) {
      toggleElement.setAttribute('data-content-id', child._id)
      toggleElement.classList.add('expandable')
      toggleElement.addEventListener('click', () => getChildrenEventListener({ bookmarkServiceURL, branch, repositoryId, item: toggleElement }))
    }

    const itemInfoElement = document.createElement('a')
    itemInfoElement.href = child.link
    itemInfoElement.target = '_blank'
    itemInfoElement.classList.add('item-info')
    if (child.isPriority) itemInfoElement.classList.add('priority')

    if (reset) {
      const labelElement = document.createElement('label')
      labelElement.id = child._id
      const checkboxElement = document.createElement('input')
      checkboxElement.type = 'checkbox'
      labelElement.appendChild(checkboxElement)
      itemWrapperElement.appendChild(labelElement)
    }

    itemWrapperElement.appendChild(toggleElement)
    itemWrapperElement.appendChild(itemInfoElement)

    const iconElement = document.createElement('img')
    iconElement.src = child.icon
    iconElement.width = 32
    iconElement.height = 32

    const contentInfoElement = document.createElement('div')
    contentInfoElement.classList.add('content-info')

    itemInfoElement.appendChild(iconElement)
    itemInfoElement.appendChild(contentInfoElement)

    const strongElement = document.createElement('strong')
    strongElement.textContent = child.displayName

    const paragraphElement = document.createElement('p')
    paragraphElement.textContent = child._path

    contentInfoElement.appendChild(strongElement)
    contentInfoElement.appendChild(paragraphElement)

    sublistElement.appendChild(itemElement)
  })

  return sublistElement
}

function reloadWidget () {
  const bookmarkListWidget = document.querySelector('#app-bookmark-list')
  const bookmarkListWidgetURL = bookmarkListWidget && bookmarkListWidget.getAttribute('data-widget-url')

  if (bookmarkListWidgetURL) {
    fetch(bookmarkListWidgetURL, {
      method: 'GET'
    })
      .then(response => response.text())
      .then(response => {
        if (response) {
          bookmarkListWidget.outerHTML = response
          main()
        }
      }).catch(error => console.log(error))
  }

  const bookmarkWidget = document.querySelector('#app-bookmark')
  const bookmarkWidgetURL = bookmarkWidget && bookmarkWidget.getAttribute('data-widget-url')

  if (bookmarkWidgetURL) {
    fetch(bookmarkWidgetURL, {
      method: 'GET'
    })
      .then(response => response.text())
      .then(response => {
        if (response) {
          bookmarkWidget.parentElement.innerHTML = response
          main()
        }
      })
  }
}

function disableHeaderButtons () {
  const removeSelectionButton = document.getElementById('removeSelection')
  const deprioritizeSelectedButton = document.querySelector('[data-id="deprioritizeSelected"]')
  const prioritizeSelectedButton = document.querySelector('[data-id="prioritizeSelected"]')

  const checkAllCheckboxElement = document.getElementById('checkAll')
  if (checkAllCheckboxElement) {
    checkAllCheckboxElement.classList.remove('checked')

    toggleDisableElement({ element: removeSelectionButton, disable: true })
    toggleDisableElement({ element: deprioritizeSelectedButton, disable: true })
    toggleDisableElement({ element: prioritizeSelectedButton, disable: true })
  }
}

main()
