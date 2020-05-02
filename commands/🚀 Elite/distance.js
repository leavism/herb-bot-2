/* eslint-disable no-throw-literal */
const { Command } = require('klasa')
const fetch = require('node-fetch')

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
  }

  async run (message, [systemAName, systemBName]) {
    const systemA = await this.getCoords(systemAName) || await this.getEDSMCoords(systemAName)
    const systemB = await this.getCoords(systemBName) || await this.getEDSMCoords(systemBName)
    if (!systemA) return message.send(`I couldn't find coordinates for the '${systemAName}' system.`)
    if (!systemB) return message.send(`I couldn't find coordinates for the '${systemBName}' system.`)

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
    system = system.replace('+', '%2B').replace(' ', '+')
    const url = `https://www.edsm.net/api-v1/system?sysname=${system}&coords=1`
    const response = await fetch(url)
      .then((response) => {
        if (response.status === 200) {
          return response.json()
        } else {
          return null
        }
      })

    if (Array.isArray(response)) return null
    if (!response) return null

    return { // Made it return this way to match the object properties of getting coords through SQL. That way the run code doesn't change
      name: response.name,
      x: response.coords.x,
      y: response.coords.y,
      z: response.coords.z
    }
  }

  async getCoords (system) {
    return this.jegin.get('system', 'name', system)
  }
}
