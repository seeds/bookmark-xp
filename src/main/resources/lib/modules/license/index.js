const libs = {
  license: require('/lib/license')
}

module.exports = {
  isCurrentLicenseValid,
  isValidLicense,
  installLicense
}

/**
 * Checks if the current installed license is valid
 * @returns {Boolean}
 */
function isCurrentLicenseValid () {
  const licenseDetails = libs.license.validateLicense({ appKey: app.name })
  return licenseDetails && !licenseDetails.expired
}

/**
 * Receives a license and checks if it is valid
 * @param {any} license
 * @returns
 */
function isValidLicense (license) {
  const licenseDetails = libs.license.validateLicense({ appKey: app.name, license })
  return licenseDetails && !licenseDetails.expired
}

/**
 * Install a license to the application
 * @param {any} license
 */
function installLicense (license) {
  libs.license.installLicense({ appKey: app.name, license })
}
