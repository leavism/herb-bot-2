const { Command, RichDisplay } = require('klasa')
const { MessageEmbed } = require('discord.js')
const fetch = require('node-fetch')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      name: 'stations',
      aliases: ['station'],
      runIn: ['text', 'dm'],
      usage: '<SystemName:string>',
      description: 'Get information on the stations of a system.',
      extendedHelp: 'Provide the name of the system.'
    })
    this.db = this.client.providers.get('jegin')
  }

  async run (message, [systemName, days]) {
    const system = await this.db.get('system', 'name', systemName)
    if (system === null) return message.send(`I couldn't find the '${systemName}' system.`)
    const stationData = await this.getStationData(system)
    const stationRichDisplay = await this.buildStationRichDisplay(stationData)

    return stationRichDisplay.run(await message.send('Loading'))
  }

  async getStationData (systemObj) {
    const url = `https://www.edsm.net/api-system-v1/stations?systemName=${systemObj.name}`
    const response = await fetch(url)
    return response.json()
  }

  async buildStationEmbed (stationData) {
    const stationEmbed = new MessageEmbed()
      .setTitle(`${stationData.name} Asset Overview`)
      .setDescription(`[EDSM Link](${stationData.url})`)
    return stationEmbed
  }

  async buildStationRichDisplay (stationData) {
    const stationsPerPage = 5
    const stationRichDisplay = new RichDisplay(
      new MessageEmbed()
        .setTitle(`${stationData.name} Stations Overview`)
        .setDescription(`[EDSM Link](${stationData.url})`)
    )

    for (let pageCount = 0; pageCount < stationData.stations.length; pageCount += stationsPerPage) {
      const stations = stationData.stations
      const difference = (stationData.stations.length - pageCount)

      if (difference <= stationsPerPage) {
        // Adds remaining fields on the last page
        stationRichDisplay.addPage((page) => {
          for (let fieldCount = pageCount; fieldCount < stationData.stations.length; fieldCount++) {
            const station = stations[fieldCount]
            page.addField(
              `**${station.name}** - ${station.type} (${station.distanceToArrival.toFixed(2)} ls)`,
              `**CF:** ${station.controllingFaction.name}\n**Market:** ${station.haveMarket ? '✅' : '❌'}\n**Shipyard:** ${station.haveShipyard ? '✅' : '❌'}\n**Outfitting:** ${station.haveOutfitting ? '✅' : '❌'}\n**Services:** ${station.otherServices.sort().join(', ')}`,
              false
            )
          }
          return page
        })
      } else {
        // Adds the fields of every page except the last
        stationRichDisplay.addPage((page) => {
          for (let fieldCount = pageCount; fieldCount < pageCount + stationsPerPage; fieldCount++) {
            const station = stations[fieldCount]
            page.addField(
              `**${station.name}** - ${station.type} (${station.distanceToArrival.toFixed(2)} ls)`,
              `**CF:** ${station.controllingFaction.name}\n**Market:** ${station.haveMarket ? '✅' : '❌'}\n**Shipyard:** ${station.haveShipyard ? '✅' : '❌'}\n**Outfitting:** ${station.haveOutfitting ? '✅' : '❌'}\n**Services:** ${station.otherServices.sort().join(', ')}`,
              false
            )
          }
          return page
        })
      }
    }
    return stationRichDisplay
  }
}
