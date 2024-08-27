"use strict";

function main() {
  var bookmarkTopMenuElement = document.getElementById('bookmark__top-menu');
  var itemsWithChildren = document.querySelectorAll('[data-content-id]');
  if (!bookmarkTopMenuElement) return;
  if (!itemsWithChildren) return;
  addGetChildrenEventListener();
  checkBoxEventListener();
  addRemoveBookmarkEventListener();
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
function addRemoveBookmarkEventListener() {
  var removeSelection = document.getElementById('removeSelection');
  var bookmarkTopMenuElement = document.getElementById('bookmark__top-menu');
  var bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url');
  removeSelection.addEventListener('click', function () {
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
        if (!document.querySelectorAll('.item-wrapper label.checked').length) {
          removeSelection.classList.add('disabled');
        }
      }
    });
  });
}
function updateBookmarkTree() {
  var bookmarkTopMenuElement = document.getElementById('bookmark__top-menu');
  var bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url');
  var repositoryId = bookmarkTopMenuElement.getAttribute('data-repository-id');
  var branch = bookmarkTopMenuElement.getAttribute('data-branch');
  fetch(bookmarkServiceURL + "?repositoryId=".concat(repositoryId, "&branch=").concat(branch, "&action=get-all")).then(function (response) {
    return response.json();
  }).then(function (data) {
    var listElement = document.querySelector('.bookmark-list');
    listElement.innerHTML = '';
    var sublistElement = buildBookmarkTree(data);
    listElement.insertAdjacentElement('beforeend', sublistElement);
  });
}
function checkBoxEventListener() {
  var checkboxes = document.querySelectorAll('.item-wrapper label');
  var checkAll = document.querySelector('#checkAll');
  var removeSelection = document.querySelector('#removeSelection');
  checkboxes.forEach(function (item) {
    item.addEventListener('click', function (event) {
      event.preventDefault();
      if (checkAll.classList.contains('checked') && item.classList.contains('checked')) {
        checkAll.classList.remove('checked');
      }
      item.classList.toggle('checked');
      if (boolAnyItemsChecked()) {
        removeSelection.classList.remove('disabled');
      } else {
        removeSelection.classList.add('disabled');
      }
    });
  });
  checkAll.addEventListener('click', function (event) {
    event.preventDefault();
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
    if (boolAnyItemsChecked()) {
      removeSelection.classList.remove('disabled');
    } else {
      removeSelection.classList.add('disabled');
    }
  });
  function boolAnyItemsChecked() {
    var isAnyItemChecked = false;
    checkboxes.forEach(function (item) {
      if (item.classList.contains('checked')) {
        isAnyItemChecked = true;
      }
    });
    return isAnyItemChecked;
  }
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
      var sublistElement = buildBookmarkTree(data);
      item.parentElement.parentElement.insertAdjacentElement('beforeend', sublistElement);
      item.classList.add('expanded');
    });
  } else {
    item.classList.remove('expanded');
    item.parentElement.parentElement.querySelector('.bookmark-sublist').remove();
  }
}
function buildBookmarkTree(data) {
  var bookmarkTopMenuElement = document.getElementById('bookmark__top-menu');
  var bookmarkServiceURL = bookmarkTopMenuElement.getAttribute('data-bookmark-service-url');
  var repositoryId = bookmarkTopMenuElement.getAttribute('data-repository-id');
  var branch = bookmarkTopMenuElement.getAttribute('data-branch');
  var sublistElement = document.createElement('div');
  sublistElement.classList.add('bookmark-sublist');
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
main();
//# sourceMappingURL=bookmark-list.js.map
