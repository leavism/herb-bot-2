const { Command } = require('klasa')

module.exports = class extends Command {
  constructor (...args) {
    super(...args, {
      permissionLevel: 9,
      guarded: true,
      description: 'Re-disables/temp. disables a piece. Default state restored on reboot.',
      usage: '<Piece:piece>'
    })
  }

  async run (message, [piece]) {
    if ((piece.type === 'event' && piece.name === 'message') || (piece.type === 'monitor' && piece.name === 'commandHandler')) {
      return message.sendLocale('COMMAND_DISABLE_WARN')
    }
    piece.disable()
    if (this.client.shard) {
      await this.client.shard.broadcastEval(`
				if (String(this.shard.id) !== '${this.client.shard.id}') this.${piece.store}.get('${piece.name}').disable();
			`)
    }
    return message.sendLocale('COMMAND_DISABLE', [piece.type, piece.name], { code: 'diff' })
  }
}
