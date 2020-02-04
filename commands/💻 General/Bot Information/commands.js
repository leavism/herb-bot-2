const { Command, util: { isFunction, toTitleCase } } = require('klasa');
const { MessageEmbed } = require('discord.js');
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function removeEmojis (string) {
  var regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
  return string.replace(regex, '');
}

function cleanUpName(string){
  return removeEmojis(string).toLowerCase().trim();
}

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      aliases: ['command', 'comands', 'comand'],
      guarded: true,
      description: 'Lists all the commands in a category.',
      usage: '<Category:category>',
      extendedHelp: `This only works with command categories. Use the \`help\` command to see all categories.`
    });

    this.createCustomResolver('category', (arg, possible, message) => {
			return this.client.arguments.get('category').run(arg, possible, message)
    });
  }

  async run(message, [category]) {
		const help = await this.buildHelp(message, category);
		const categories = Object.keys(help);
		const helpMessage = [];
		for (let cat = 0; cat < categories.length; cat++) {
			helpMessage.push(`**${categories[cat]} Commands**:`, '```asciidoc');
			const subCategories = Object.keys(help[categories[cat]]);
			for (let subCat = 0; subCat < subCategories.length; subCat++) helpMessage.push(`= ${subCategories[subCat]} =`, `${help[categories[cat]][subCategories[subCat]].join('\n')}\n`);
			helpMessage.push(`Use ${this.client.options.prefix}help <command> for detailed information on a command. \`\`\``);
    }
    return message.send(helpMessage, { split: { char: '\u200b' } })
  }

  async buildHelp(message, category) {
		const help = {};
		// These two lines are for padding the message to be evenly spaced
		const commandNames = [...this.client.commands.keys()];
		const longest = commandNames.reduce((long, str) => Math.max(long, str.length), 0);

		await Promise.all(this.client.commands.map((command) =>
			this.client.inhibitors.run(message, command, true)
				.then(() => {
					if (!has(help, command.category) & cleanUpName(command.category) == cleanUpName(category)) help[command.category] = {};
					if (!has(help[command.category], command.subCategory)) help[command.category][command.subCategory] = [];
					const description = isFunction(command.description) ? command.description(message.language) : command.description;
					help[command.category][command.subCategory].push(`• ${command.name.padEnd(longest)} :: ${description}`);
				})
				.catch(() => {
					// To pass over commands to not include
				})
		));

		return help;
	}
}