const { Command, Stopwatch, Type, util } = require('klasa');
const { inspect } = require('util');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['ev'],
			permissionLevel: 10,
			guarded: true,
			description: 'Evaluates arbitrary Javascript. Reserved for bot owner.',
			extendedHelp: [
				'The eval command evaluates code as-in, any error thrown from it will be handled.',
				'It also uses the flags feature. Write --silent, --depth=number or --async to customize the output.',
				'The --silent flag will make it output nothing.',
				"The --depth flag accepts a number, for example, --depth=2, to customize util.inspect's depth.",
				'The --async flag will wrap the code into an async function where you can enjoy the use of await, however, if you want to return something, you will need the return keyword.',
				'The --showHidden flag will enable the showHidden option in util.inspect.',
				'If the output is too large, it\'ll send the output as a file, or in the console if the bot does not have the ATTACH_FILES permission.'
			].join('\n'),
			usage: '<expression:str>',
			enabled: false
		});
	}

	async run(message, [code]) {
		const { success, result, time, type } = await this.eval(message, code);
		const footer = util.codeBlock('ts', type);
		const output = message.language.get(success ? 'COMMAND_EVAL_OUTPUT' : 'COMMAND_EVAL_ERROR',
			time, util.codeBlock('js', result), footer);

		if ('silent' in message.flagArgs) return null;

		// Handle too-long-messages
		if (output.length > 2000) {
			if (message.guild && message.channel.attachable) {
				return message.channel.sendFile(Buffer.from(result), 'output.txt', message.language.get('COMMAND_EVAL_SENDFILE', time, footer));
			}
			this.client.emit('log', result);
			return message.sendLocale('COMMAND_EVAL_SENDCONSOLE', [time, footer]);
		}

		// If it's a message that can be sent correctly, send it
		return message.sendMessage(output);
	}

	// Eval the input
	async eval(message, code) {
		// eslint-disable-next-line no-unused-vars
		const msg = message;
		const { flagArgs: flags } = message;
		code = code.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
		const stopwatch = new Stopwatch();
		let success, syncTime, asyncTime, result;
		let thenable = false;
		let type;
		try {
			if (flags.async) code = `(async () => {\n${code}\n})();`;
			result = eval(code);
			syncTime = stopwatch.toString();
			type = new Type(result);
			if (util.isThenable(result)) {
				thenable = true;
				stopwatch.restart();
				result = await result;
				asyncTime = stopwatch.toString();
			}
			success = true;
		} catch (error) {
			if (!syncTime) syncTime = stopwatch.toString();
			if (!type) type = new Type(error);
			if (thenable && !asyncTime) asyncTime = stopwatch.toString();
			if (error && error.stack) this.client.emit('error', error.stack);
			result = error;
			success = false;
		}

		stopwatch.stop();
		if (typeof result !== 'string') {
			result = inspect(result, {
				depth: flags.depth ? parseInt(flags.depth) || 0 : 0,
				showHidden: Boolean(flags.showHidden)
			});
		}
		return { success, type, time: this.formatTime(syncTime, asyncTime), result: util.clean(result) };
	}

	formatTime(syncTime, asyncTime) {
		return asyncTime ? `⏱ ${asyncTime}<${syncTime}>` : `⏱ ${syncTime}`;
	}

};
