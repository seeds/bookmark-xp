"use strict";

function main() {
  window.addEventListener('hashchange', function (e) {
    var newURL = e.newURL;
    var repositoryName = newURL.split('main#/')[1].split('/')[0];
    updateBookmarkTree("com.enonic.cms.".concat(repositoryName));
    disableHeaderButtons();
  });
  if (!window.location.hash.includes('widget/bookmark/bookmark-list')) {
    var bookmarkContextPanelElement = document.getElementById('bookmark__context-panel');
    var favoriteContentButtonElement = document.querySelector('[data-id="favorite-content-button"]');
    var unfavoriteContentButtonElement = document.querySelector('[data-id="unfavorite-content-button"]');
    var setPriorityButtonElement = document.querySelector('[data-id="set-priority-button"]');
    var contentId = bookmarkContextPanelElement.getAttribute('data-content-id');
    var bookmarkServiceURL = bookmarkContextPanelElement.getAttribute('data-bookmark-service-url');
    addUploadLicenseListener(bookmarkContextPanelElement);
    if (!bookmarkServiceURL) return;
    if (favoriteContentButtonElement) {
      favoriteContentButtonElement.addEventListener('click', function () {
        favoriteContentButtonElement.setAttribute('disabled', true);
        fetch(bookmarkServiceURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'favorite',
            contentId: contentId
          })
        }).then(function (response) {
          return response.json();
        }).then(function (data) {
          favoriteContentButtonElement.removeAttribute('disabled');
          if (data && data._id) {
            updateBookmarkTree();
            favoriteContentButtonElement.style.display = 'none';
            unfavoriteContentButtonElement.style.display = 'block';
            setPriorityButtonElement.style.display = 'block';
            setPriorityButtonElement.classList.remove('selected');
          } else {
            bookmarkContextPanelElement.insertAdjacentHTML('beforeend', '<p class="bookmark__context-panel__error">It was not possible to bookmark this content</p>');
          }
        });
      });
    }
    if (unfavoriteContentButtonElement) {
      unfavoriteContentButtonElement.addEventListener('click', function () {
        unfavoriteContentButtonElement.setAttribute('disabled', true);
        fetch(bookmarkServiceURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'unfavorite',
            contentId: contentId
          })
        }).then(function (response) {
          return response.json();
        }).then(function (data) {
          unfavoriteContentButtonElement.removeAttribute('disabled');
          if (data && data._id) {
            updateBookmarkTree();
            unfavoriteContentButtonElement.style.display = 'none';
            favoriteContentButtonElement.style.display = 'block';
            setPriorityButtonElement.style.display = 'none';
          } else {
            bookmarkContextPanelElement.insertAdjacentHTML('beforeend', '<p class="bookmark__context-panel__error">It was not possible to remove the bookmark</p>');
          }
        });
      });
    }
    handlePriorityButtonListener({
      contentId: contentId,
      bookmarkServiceURL: bookmarkServiceURL,
      bookmarkContextPanelElement: bookmarkContextPanelElement
    });
  } else {
    var bookmarkTopMenuElement = document.getElementById('bookmark__top-menu');
    var itemsWithChildren = document.querySelectorAll('[data-content-id]');
    if (!bookmarkTopMenuElement) return;
    if (!itemsWithChildren) return;
    addGetChildrenEventListener();
    checkBoxEventListener();
    addRemoveBookmarkEventListener();
    addPriorityBookmarkEventListener();
    addRefreshTreeEventListener();
    addUploadLicenseListener(bookmarkTopMenuElement);
  }
}
function addGetChildrenEventListener() {
  var bookmarkTopMenuElement = document.getElementById('bookmark__top-menu');
  var bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url');
  var repositoryId = bookmarkTopMenuElement.getAttribute('data-repository-id');
  var branch = bookmarkTopMenuElement.getAttribute('data-branch');
  var itemsWithChildren = document.querySelectorAll('[data-content-id].expandable');
  if (!itemsWithChildren.length) return;
  itemsWithChildren.forEach(function (item) {
    if (item.classList.contains('expandable')) {
      item.addEventListener('click', function () {
        return getChildrenEventListener({
          bookmarkServiceURL: bookmarkServiceURL,
          branch: branch,
          repositoryId: repositoryId,
          item: item
        });
      });
    }
  });
}
function addPriorityBookmarkEventListener() {
  var deprioritizeSelectedButton = document.querySelector('[data-id="deprioritizeSelected"]');
  var prioritizeSelectedButton = document.querySelector('[data-id="prioritizeSelected"]');
  var bookmarkTopMenuElement = document.getElementById('bookmark__top-menu');
  var bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url');
  deprioritizeSelectedButton && deprioritizeSelectedButton.addEventListener('click', function () {
    var checkboxes = document.querySelectorAll('.item-wrapper label.checked');
    if (!checkboxes.length) return;
    var contentIds = [];
    checkboxes.forEach(function (checkbox) {
      if (checkbox.nextElementSibling.nextElementSibling.classList.contains('priority')) contentIds.push(checkbox.getAttribute('id'));
    });
    fetch(bookmarkServiceURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'remove_priority',
        contentIds: contentIds
      })
    }).then(function (response) {
      return response.json();
    }).then(function (data) {
      if (data && data._id) {
        updateBookmarkTree();
        disableHeaderButtons();
      }
    });
  });
  prioritizeSelectedButton && prioritizeSelectedButton.addEventListener('click', function () {
    var checkboxes = document.querySelectorAll('.item-wrapper label.checked');
    if (!checkboxes.length) return;
    var contentIds = [];
    checkboxes.forEach(function (checkbox) {
      if (!checkbox.nextElementSibling.nextElementSibling.classList.contains('priority')) contentIds.push(checkbox.getAttribute('id'));
    });
    fetch(bookmarkServiceURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'add_priority',
        contentIds: contentIds
      })
    }).then(function (response) {
      return response.json();
    }).then(function (data) {
      if (data && data._id) {
        updateBookmarkTree();
        disableHeaderButtons();
      }
    });
  });
}

/**
 * Event listener added to the refresh button in order to update the favorite contents tree
 */
function addRefreshTreeEventListener() {
  var refreshButtonElement = document.getElementById('refreshContent');
  refreshButtonElement && refreshButtonElement.addEventListener('click', function () {
    var repositoryName = window.location.href.split('main#/')[1].split('/')[0];
    updateBookmarkTree("com.enonic.cms.".concat(repositoryName));
    disableHeaderButtons();
  });
}
function addRemoveBookmarkEventListener() {
  var removeSelection = document.getElementById('removeSelection');
  var bookmarkTopMenuElement = document.getElementById('bookmark__top-menu');
  var bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url');
  removeSelection && removeSelection.addEventListener('click', function () {
    var checkboxes = document.querySelectorAll('.item-wrapper label.checked');
    var contentIds = [];
    if (!checkboxes.length) return;
    checkboxes.forEach(function (checkbox) {
      return contentIds.push(checkbox.getAttribute('id'));
    });
    fetch(bookmarkServiceURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'unfavorite',
        contentIds: contentIds
      })
    }).then(function (response) {
      return response.json();
    }).then(function (data) {
      if (data && data._id) {
        checkboxes.forEach(function (checkbox) {
          if (contentIds.some(function (id) {
            return id === checkbox.getAttribute('id');
          })) {
            checkbox.closest('.item').remove();
          }
        });
        disableHeaderButtons();
      }
    });
  });
}

/**
 *
 * @param {Element} widgetElement
 * @returns
 */
function addUploadLicenseListener(widgetElement) {
  var uploadLicenseButtonElement = widgetElement.querySelector('#bookmark_upload_input');
  if (!uploadLicenseButtonElement) return;
  uploadLicenseButtonElement.addEventListener('click', function () {
    this.querySelector('input').click();
  }, false);
  uploadLicenseButtonElement.querySelector('input').addEventListener('change', function (e) {
    var serviceUrl = this.getAttribute('data-license-service-url');
    var licenseFile = e.target.files[0];
    if (licenseFile) {
      var formData = new FormData();
      formData.append('license', licenseFile);
      fetch(serviceUrl, {
        method: 'POST',
        body: formData
      }).then(function (response) {
        if (response.ok) {
          document.querySelector('.bookmark_license .error-message').style.display = 'none';
          reloadWidget();
        } else {
          document.querySelector('.bookmark_license .error-message').style.display = 'block';
        }
      })["catch"](function () {
        document.querySelector('.bookmark_license .error-message').style.display = 'none';
      });
    }
  });
}
function updateBookmarkTree(repositoryName) {
  var bookmarkTopMenuElement = document.getElementById('bookmark__top-menu');
  if (!bookmarkTopMenuElement) return;
  var bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url');
  var repositoryId = repositoryName || bookmarkTopMenuElement.getAttribute('data-repository-id');
  bookmarkTopMenuElement.setAttribute('data-repository-id', repositoryId);
  var branch = bookmarkTopMenuElement.getAttribute('data-branch');
  fetch(bookmarkServiceURL + "?repositoryId=".concat(repositoryId, "&branch=").concat(branch, "&action=get-all")).then(function (response) {
    return response.json();
  }).then(function (data) {
    var listElement = document.querySelector('.bookmark-list');
    if (!listElement) return;
    listElement.innerHTML = '';
    var sublistElement = buildBookmarkTree({
      data: data,
      reset: true
    });
    listElement.insertAdjacentElement('beforeend', sublistElement);
  }).then(function () {
    return checkBoxEventListener();
  });
}
function checkBoxEventListener() {
  var checkboxes = document.querySelectorAll('.item-wrapper label');
  var checkAll = document.querySelector('#checkAll');
  var removeSelection = document.querySelector('#removeSelection');
  var deprioritizeSelectedButton = document.querySelector('[data-id="deprioritizeSelected"]');
  var prioritizeSelectedButton = document.querySelector('[data-id="prioritizeSelected"]');
  checkboxes.forEach(function (item) {
    if (item.getAttribute('listener') !== 'true') {
      item.addEventListener('click', function (event) {
        event.preventDefault();
        item.setAttribute('listener', 'true');
        if (checkAll.classList.contains('checked') && item.classList.contains('checked')) {
          checkAll.classList.remove('checked');
        }
        item.classList.toggle('checked');
        updateSelectionStatus();
      });
    }
  });
  if (checkAll && checkAll.getAttribute('listener') !== 'true') {
    checkAll.setAttribute('listener', 'true');
    checkAll.addEventListener('click', function (event) {
      event.preventDefault();
      checkboxes = document.querySelectorAll('.item-wrapper label');
      if (!checkAll.classList.contains('checked')) {
        checkAll.classList.add('checked');
        checkboxes.forEach(function (item) {
          if (!item.classList.contains('checked')) {
            item.classList.add('checked');
          }
        });
        removeSelection.classList.remove('disabled');
      } else {
        checkAll.classList.remove('checked');
        checkboxes.forEach(function (item) {
          if (item.classList.contains('checked')) {
            item.classList.remove('checked');
          }
        });
      }
      updateSelectionStatus();
    });
  }

  /**
   * Disable/Enable the header buttons based on the current status of the checkboxes and priority defined
   */
  function updateSelectionStatus() {
    checkboxes = document.querySelectorAll('.item-wrapper label');
    var items = {
      checked: 0,
      checkedPriority: 0,
      checkedNoPriority: 0
    };
    checkboxes.forEach(function (item) {
      var priorityElement = item.nextElementSibling.nextElementSibling;
      var isChecked = item.classList.contains('checked');
      var isPriority = priorityElement.classList.contains('priority');
      if (isChecked) {
        items.checked++;
        if (isPriority) items.checkedPriority++;else items.checkedNoPriority++;
      }
    });
    if (items.checked > 0) toggleDisableElement({
      element: removeSelection,
      disable: false
    });else toggleDisableElement({
      element: removeSelection,
      disable: true
    });
    if (items.checked === 0) {
      toggleDisableElement({
        element: deprioritizeSelectedButton,
        disable: true
      });
      toggleDisableElement({
        element: prioritizeSelectedButton,
        disable: true
      });
    } else {
      if (items.checkedPriority > 0) toggleDisableElement({
        element: deprioritizeSelectedButton,
        disable: false
      });else toggleDisableElement({
        element: deprioritizeSelectedButton,
        disable: true
      });
      if (items.checkedNoPriority > 0) toggleDisableElement({
        element: prioritizeSelectedButton,
        disable: false
      });else toggleDisableElement({
        element: prioritizeSelectedButton,
        disable: true
      });
    }
  }
}

/**
 * Adds 'disabled' class and disabled attribute to the HTML element
 * @param {Object} params
 * @param {HTMLElement} params.element
 * @param {Boolean} params.disable
 */
function toggleDisableElement(params) {
  if (!params.element) return;
  if (params.disable) {
    params.element.classList.add('disabled');
    params.element.setAttribute('disabled', '');
    return;
  }
  params.element.classList.remove('disabled');
  params.element.removeAttribute('disabled');
}

/**
 * Add event listener to the priority button from context panel widget and handle the checked/unchecked button state
 * @param {Object} params
 * @param {String} params.contentId
 * @param {String} params.bookmarkServiceURL
 * @param {HTMLElement} params.bookmarkContextPanelElement
 */
function handlePriorityButtonListener(params) {
  var contentId = params.contentId,
    bookmarkServiceURL = params.bookmarkServiceURL,
    bookmarkContextPanelElement = params.bookmarkContextPanelElement;
  var setPriorityButtonElement = document.querySelector('[data-id="set-priority-button"]');
  var tooltip = document.querySelector('.priority-tooltip');
  if (setPriorityButtonElement.getAttribute('listener') === 'true') return;
  setPriorityButtonElement.addEventListener('click', function () {
    if (bookmarkContextPanelElement.querySelector('.bookmark__context-panel__error')) {
      bookmarkContextPanelElement.querySelector('.bookmark__context-panel__error').remove();
    }
    fetch(bookmarkServiceURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'toggle_priority',
        contentId: contentId
      })
    }).then(function (response) {
      return response.json();
    }).then(function (data) {
      setPriorityButtonElement.removeAttribute('disabled');
      if (!data || !data._id) {
        bookmarkContextPanelElement.insertAdjacentHTML('beforeend', '<p class="bookmark__context-panel__error">It was not possible to remove priority from this content</p>');
        return;
      }
      updateBookmarkTree();
      if (setPriorityButtonElement.classList.contains('selected')) tooltip.innerHTML = tooltip.getAttribute('data-add-priority-text');else tooltip.innerHTML = tooltip.getAttribute('data-remove-priority-text');
      setPriorityButtonElement.classList.toggle('selected');
    });
  });
  setPriorityButtonElement.setAttribute('listener', 'true');
}

/**
 * Create each child and attach the 'click' event listener
 * @param {Object} params
 * @param {String} params.bookmarkServiceURL
 * @param {String} params.repositoryId
 * @param {String} params.branch
 * @param {HTMLElement} params.item
 */
function getChildrenEventListener(params) {
  var bookmarkServiceURL = params.bookmarkServiceURL,
    branch = params.branch,
    repositoryId = params.repositoryId,
    item = params.item;
  var contentId = item.getAttribute('data-content-id');
  if (!item.classList.contains('expanded')) {
    fetch(bookmarkServiceURL + "?contentId=".concat(contentId, "&repositoryId=").concat(repositoryId, "&branch=").concat(branch, "&action=get-children")).then(function (response) {
      return response.json();
    }).then(function (data) {
      var sublistElement = buildBookmarkTree({
        data: data
      });
      item.parentElement.parentElement.insertAdjacentElement('beforeend', sublistElement);
      item.classList.add('expanded');
    });
  } else {
    item.classList.remove('expanded');
    item.parentElement.parentElement.querySelector('.bookmark-sublist').remove();
  }
}

/**
 *
 * @param {Object} params
 * @param {Object[]} params.data
 * @param {Boolean} [params.reset=false] if true, the bookmark-list element should be reset before
 * @returns
 */
function buildBookmarkTree(params) {
  var data = params.data,
    _params$reset = params.reset,
    reset = _params$reset === void 0 ? false : _params$reset;
  var bookmarkTopMenuElement = document.getElementById('bookmark__top-menu');
  var bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url');
  var repositoryId = bookmarkTopMenuElement.getAttribute('data-repository-id');
  var branch = bookmarkTopMenuElement.getAttribute('data-branch');
  var sublistElement = document.createElement('div');
  if (!reset) sublistElement.classList.add('bookmark-sublist');
  data.forEach(function (child) {
    var itemElement = document.createElement('div');
    itemElement.classList.add('item');
    var itemWrapperElement = document.createElement('div');
    itemWrapperElement.classList.add('item-wrapper');
    itemElement.appendChild(itemWrapperElement);
    var toggleElement = document.createElement('div');
    toggleElement.classList.add('toggle', 'icon', 'expand');
    if (child.hasChildren) {
      toggleElement.setAttribute('data-content-id', child._id);
      toggleElement.classList.add('expandable');
      toggleElement.addEventListener('click', function () {
        return getChildrenEventListener({
          bookmarkServiceURL: bookmarkServiceURL,
          branch: branch,
          repositoryId: repositoryId,
          item: toggleElement
        });
      });
    }
    var itemInfoElement = document.createElement('a');
    itemInfoElement.href = child.link;
    itemInfoElement.target = '_blank';
    itemInfoElement.classList.add('item-info');
    if (child.isPriority) itemInfoElement.classList.add('priority');
    if (reset) {
      var labelElement = document.createElement('label');
      labelElement.id = child._id;
      var checkboxElement = document.createElement('input');
      checkboxElement.type = 'checkbox';
      labelElement.appendChild(checkboxElement);
      itemWrapperElement.appendChild(labelElement);
    }
    itemWrapperElement.appendChild(toggleElement);
    itemWrapperElement.appendChild(itemInfoElement);
    var iconElement = document.createElement('img');
    iconElement.src = child.icon;
    iconElement.width = 32;
    iconElement.height = 32;
    var contentInfoElement = document.createElement('div');
    contentInfoElement.classList.add('content-info');
    itemInfoElement.appendChild(iconElement);
    itemInfoElement.appendChild(contentInfoElement);
    var strongElement = document.createElement('strong');
    strongElement.textContent = child.displayName;
    var paragraphElement = document.createElement('p');
    paragraphElement.textContent = child._path;
    contentInfoElement.appendChild(strongElement);
    contentInfoElement.appendChild(paragraphElement);
    sublistElement.appendChild(itemElement);
  });
  return sublistElement;
}
function reloadWidget() {
  var bookmarkListWidget = document.querySelector('#app-bookmark-list');
  var bookmarkListWidgetURL = bookmarkListWidget && bookmarkListWidget.getAttribute('data-widget-url');
  if (bookmarkListWidgetURL) {
    fetch(bookmarkListWidgetURL, {
      method: 'GET'
    }).then(function (response) {
      return response.text();
    }).then(function (response) {
      if (response) {
        bookmarkListWidget.outerHTML = response;
        main();
      }
    })["catch"](function (error) {
      return console.log(error);
    });
  }
  var bookmarkWidget = document.querySelector('#app-bookmark');
  var bookmarkWidgetURL = bookmarkWidget && bookmarkWidget.getAttribute('data-widget-url');
  if (bookmarkWidgetURL) {
    fetch(bookmarkWidgetURL, {
      method: 'GET'
    }).then(function (response) {
      return response.text();
    }).then(function (response) {
      if (response) {
        bookmarkWidget.parentElement.innerHTML = response;
        main();
      }
    });
  }
}
function disableHeaderButtons() {
  var removeSelectionButton = document.getElementById('removeSelection');
  var deprioritizeSelectedButton = document.querySelector('[data-id="deprioritizeSelected"]');
  var prioritizeSelectedButton = document.querySelector('[data-id="prioritizeSelected"]');
  document.getElementById('checkAll').classList.remove('checked');
  toggleDisableElement({
    element: removeSelectionButton,
    disable: true
  });
  toggleDisableElement({
    element: deprioritizeSelectedButton,
    disable: true
  });
  toggleDisableElement({
    element: prioritizeSelectedButton,
    disable: true
  });
}
main();
//# sourceMappingURL=bookmark.js.map
