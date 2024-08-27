const libs = {
  portal: require('/lib/xp/portal'),
  io: require('/lib/xp/io'),
  licenseLib: require('/lib/modules/license')
}

exports.post = function (req) {
  const stream = libs.portal.getMultipartStream('license')
  const license = libs.io.readText(stream)
  const isValid = libs.licenseLib.isValidLicense(license)

  if (!isValid) {
    return {
      status: 400
    }
  }

  libs.licenseLib.installLicense(license)

  return {
    status: 204
  }
}
