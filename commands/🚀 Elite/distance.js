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

    this.createCustomResolver('system', (arg, possible, message) => {
      return this.client.arguments.get('system').run(arg, possible, message)
    })
  }

  async run (message, [systemA, systemB]) {
    const systemACoords = await this.getCoords(systemA.trim())
    const systemBCoords = await this.getCoords(systemB.trim())

    // EDSM does not have HTTP statuses, so they all return code 200
    if (Array.isArray(systemACoords)) {
      throw `Could not find coordinates for '${systemA}' system.`
    } else if (Array.isArray(systemBCoords)) {
      throw `Could not find coordinates for '${systemB}' system.`
    }

    const x = systemACoords.coords.x - systemBCoords.coords.x
    const y = systemACoords.coords.y - systemBCoords.coords.y
    const z = systemACoords.coords.z - systemBCoords.coords.z

    const distance = Math.sqrt(x * x + y * y + z * z)
    await message.send(`The distance between ${systemACoords.name} and ${systemBCoords.name} is **${distance.toFixed(2)}**LY`)
  };

  /**
   * Calls the EDSM API to find the coordinates of a system
   * @param {string} system - The name of the system
   */
  async getCoords (system) {
    system = system.replace('+', '%2B').replace(' ', '+')
    const url = `https://www.edsm.net/api-v1/system?sysname=${system}&coords=1`
    const response = await fetch(url)
    return response.json()
  }
}
