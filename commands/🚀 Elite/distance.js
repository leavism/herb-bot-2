/* eslint-disable no-throw-literal */
const { Command } = require('klasa')
const fetch = require('node-fetch')
const FuzzySet = require('fuzzyset.js')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'distance',
      aliases: ['dist'],
      runIn: ['dm', 'text'],
      description: 'Find the distance between two systems.',
      usage: '<System_Name:string> <System_Name:string>',
      usageDelim: ',',
      extendedHelp: 'Don\'t forget the comma between the two system names.'
    })
  }

  async init () {
    this.jegin = this.client.providers.get('jegin')
    this.fuzzySet = FuzzySet(await this.constructSystemNameArray())
  }

  async run (message, [systemAName, systemBName]) {
    const systemA = await this.getCoords(systemAName) || await this.getEDSMCoords(systemAName)
    const systemB = await this.getCoords(systemBName) || await this.getEDSMCoords(systemBName)
    const errorMessages = this.checkSystemsExist([systemA, systemB])
    if (errorMessages.length > 0) return message.send(errorMessages.join('\n'))

    const x = systemA.x - systemB.x
    const y = systemA.y - systemB.y
    const z = systemA.z - systemB.z

    const distance = Math.sqrt(x * x + y * y + z * z)
    await message.send(`The distance between ${systemA.name} and ${systemB.name} is **${distance.toFixed(2)}**LY`)
  };

  /**
   * Calls the EDSM API to find the coordinates of a system
   * @param {string} system - The name of the system
   */
  async getEDSMCoords (system) {
    const systemURL = system.replace('+', '%2B').replace(' ', '+')
    const url = `https://www.edsm.net/api-v1/system?sysname=${systemURL}&coords=1`
    const response = await fetch(url)
      .then((response) => {
        if (response.status === 200) {
          return response.json()
        } else {
          return null
        }
      })

    if (Array.isArray(response)) return { name: system, exist: false }
    if (!response) return { name: system, exist: false }

    return { // Made it return this way to match the object properties of getting coords through SQL. That way the run code doesn't change
      name: response.name,
      exist: true,
      x: response.coords.x,
      y: response.coords.y,
      z: response.coords.z
    }
  }

  async getCoords (system) {
    const coordinates = await this.jegin.get('system', 'name', system)
    if (!coordinates) {
      return { name: system, exist: false }
    }
    coordinates.exist = true
    return coordinates
  }

  async constructSystemNameArray () {
    const systemObjects = await this.jegin.runAll('SELECT name FROM jegin.system')
    return systemObjects.map(system => system.name)
  }

  makeSystemNameSuggestions (systemName) {
    const suggestions = this.fuzzySet.get(systemName, [], 0.7)
    return suggestions.map(system => `\`${system[1]}\``) || []
  }

  checkSystemsExist (systems) {
    const errorArray = []
    systems.forEach(system => {
      let msg = ''
      if (!system.exist) {
        const systemSuggestions = this.makeSystemNameSuggestions(system.name)
        msg += `I couldn't find the coordinates for \`${system.name}\` system.`
        msg += (systemSuggestions.length > 0) ? ` Did you mean: ${systemSuggestions.join(', ')}` : ''
        errorArray.push(msg)
      }
    })
    return errorArray
  }
}
