const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'distance',
      aliases: ['dist'],
      runIn: ['dm', 'text'],
      description: 'Find the distance between two systems.',
      usage: '<SystemA:string> <SystemB:string>',
      usageDelim: ', '
    });

    this.createCustomResolver('system', (arg, possible, message) => {
      return this.client.arguments.get('system').run(arg, possible, message);
    });
  }

  async run(message, [systemA, systemB]) {
    let systemACoords = await this.getCoords(systemA);
    let systemBCoords = await this.getCoords(systemB);

    // EDSM does not have HTTP statuses, so they all return code 200
    if (Array.isArray(systemACoords)) {
      throw `Could not find coordinates for ${systemA}.`
    } else if (Array.isArray(systemBCoords)) {
      throw `Could not find coordinates for ${systemB}.`
    }

    let x = systemACoords.coords.x - systemBCoords.coords.x;
    let y = systemACoords.coords.y - systemBCoords.coords.y;
    let z = systemACoords.coords.z - systemBCoords.coords.z;

    let distance = Math.sqrt(x * x + y * y + z * z)
    await message.send(`The distance between ${systemACoords.name} and ${systemBCoords.name} is **${distance.toFixed(2)}**LY`)
  };

  async getCoords(system) {
    system = system.replace('+', '%2B').replace(' ', '+');
    let url = `https://www.edsm.net/api-v1/system?sysname=${system}&coords=1`;
    const response = await fetch(url)
    let coords = response.json();
    return coords
  }
}