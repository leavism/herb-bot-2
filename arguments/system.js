const { Argument } = require('klasa');


module.exports = class extends Argument {
  async run(arg, possible, message) {
    return arg
    // Eventually have this check whether system exists
  }
}