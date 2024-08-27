module.exports = {
  between: between,
  inRange: inRange
}

function between (self, greaterOrEqual, less) {
  return self >= greaterOrEqual && self < less
}

function inRange (self, greaterOrEqual, lessOrEqual) {
  return self >= greaterOrEqual && self <= lessOrEqual
}
