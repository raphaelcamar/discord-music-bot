const Discord = require('discord.js')
const MessageInterceptor = require('../src/interceptors/MessageInterceptor');
const intents = new Discord.Intents(32767) // All intentions
const client = new Discord.Client({ intents });
const Play = require('./commands/play/index');
const {token} = require('./config');

client.login(token);

const interactions = new Map();

client.on('messageCreate', async (message) => {

	const MI = new MessageInterceptor(message);
  const command = await MI.getCommand();

	if(command === undefined) return;
	if(command === false) message.reply('Not valid command');

	//TODO: send message withou prefix and command
	const play = new Play(message, interactions);

	if(command === 'play'){
		await play.execute();
	}

	if(command === 'next'){
		await play.next();
	}
	
	if(command === 'queue'){
		await play.queue()
	}

	if(command === 'leave'){
		await play.leave()
	}
});
