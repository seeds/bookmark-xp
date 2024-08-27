const libs = {
  auth: require('/lib/xp/auth'),
  objects: require('/lib/util/objects'),
  extContext: require('/lib/extensions/context'),
  constants: require('/lib/util/constants')
}

module.exports = {
  modifyUserProfile,
  getCurrentLoggedInUser,
  getUserProfile,
  userLogout,
  userLogin,
  hasMembership,
  getMemberships,
  addMember,
  removeMember,
  createUser,
  deleteUser
}

/**
 * This function retrieves the profile of a user and updates it
 * @param {String} userKey the user key
 * @param {Function} editor callback function
 * @returns modified user profile
 */
function modifyUserProfile (userKey, editor) {
  try {
    const modifiedUserProfile = libs.extContext.runInsideContext(libs.constants.default.repository, 'draft', () => {
      return libs.auth.modifyProfile({
        key: userKey,
        editor: editor
      })
    })
    return modifiedUserProfile
  } catch (error) {
    log.error(`Unexpected error modifying user's profile: ${error}`)
  }
}

/**
 * Returns the logged-in user. If not logged-in, this will return undefined
 * @returns Information for logged-in user.
 */
function getCurrentLoggedInUser () {
  try {
    return libs.auth.getUser()
  } catch (error) {
    log.error(`Unexpected error getting logged-user: ${error}`)
  }
}

/**
 * This function retrieves the profile of a user.
 * @param {String} userKey user key to find the profile
 * @returns the user profile
 */
function getUserProfile (userKey) {
  try {
    return libs.auth.getProfile({ key: userKey })
  } catch (error) {
    log.error(`Unexpected error getting user profile: ${error}`)
  }
}

/**
 * Logout an already logged-in user
 */
function userLogout () {
  try {
    libs.auth.logout()
  } catch (error) {
    log.error(`Unexpected error logging out user: ${error}`)
  }
}

/**
 * Login a user with the specified idProvider, userName, password and scope.
 * @param {String} user
 * @param {String} password
 * @param {String} idProvider
 * @returns {JSON}
 */
function userLogin (user, password, idProvider, sessionTimeout = undefined, scope = 'SESSION', skipAuth = false) {
  try {
    return libs.auth.login({
      user,
      password,
      idProvider,
      sessionTimeout,
      scope,
      skipAuth
    })
  } catch (error) {
    log.error(`Unexpected error logging in user: ${error}`)
  }
}

/**
 * gets the user roles
 * @param {String} userKey
 * @returns {Array<JSON>} array of roles
 */
function getMemberships (userKey) {
  if (userKey) {
    return libs.extContext.runInsideContext(libs.constants.default.repository, 'draft', () => {
      return libs.objects.trySafe(function () { return libs.objects.forceArray(libs.auth.getMemberships(userKey)) }) || []
    })
  }
  return []
}

/**
 * Function to check if a user has the role allowed to do login
 * @param {String} userKey
 * @param {Array<String>} roles allowed roles
 * @returns {Boolean}
 */
function hasMembership (userKey, roles) {
  if (userKey && roles && roles.length) {
    const memberships = getMemberships(userKey)

    if (memberships.length > 0) {
      for (const membership of memberships) {
        if (roles.some(role => role === membership.key)) return true
      }
    }
  }
  return false
}

/**
 * adds a role to the specified user keys.
 * @param {String} role
 * @param {Array<String>} userKeys
 */
function addMember (role, userKeys) {
  libs.extContext.runInsideContext(libs.constants.default.repository, 'draft', () => {
    try {
      libs.auth.addMembers(role, userKeys)
    } catch (error) {
      log.error(`Unexpected error adding member for a user: ${error}`)
    }
  })
}

/**
 * removes a role to the specified user keys.
 * @param {String} role
 * @param {Array<String>} userKeys
 */
function removeMember (role, userKeys) {
  libs.extContext.runInsideContext(libs.constants.default.repository, 'draft', () => {
    try {
      libs.auth.removeMembers(role, userKeys)
    } catch (error) {
      log.error(`Unexpected error removing member for a user: ${error}`)
    }
  })
}

/**
 * creates an user in Enonic
 * @param {Object} params
 * @param {String} params.displayName
 * @param {String=} params.idProvider
 * @param {String} params.name
 * @param {String} params.email
 * @param {String} params.actorId
 */
function createUser (params) {
  return libs.extContext.runInsideContext('system-repo', 'master', () => {
    try {
      return libs.auth.createUser({
        displayName: libs.objects.trySafe(function () { return params.displayName }),
        idProvider: libs.objects.trySafe(function () { return params.idProvider }),
        name: libs.objects.trySafe(function () { return params.name }),
        email: libs.objects.trySafe(function () { return params.email })
      })
    } catch (error) {
      log.error(`Unexpected error creating an user: ${error}`)
    }
  })
}

function deleteUser (userKey) {
  return libs.extContext.runInsideContext('system-repo', 'master', () => {
    try {
      return libs.auth.deletePrincipal(userKey)
    } catch (error) {
      log.error(`Unexpected error deleting user: ${error}`)
    }
  })
}
