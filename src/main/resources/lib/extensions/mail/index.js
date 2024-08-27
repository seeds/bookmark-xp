const libs = {
  mail: require('/lib/xp/mail'),
  objects: require('/lib/util/objects')
}

module.exports = {
  send
}

// Remember: Filter production/customer mails to here
function send (_params) {
  const params = libs.objects.deepClone(_params)
  return libs.mail.send(params)
}
