const Discord = require('discord.js')
const MessageInterceptor = require('../src/interceptors/MessageInterceptor');
const intents = new Discord.Intents(32767) // All intentions
const client = new Discord.Client({ intents });
const Play = require('./commands/play/index');
const {token} = require('./config');
const config = require('./commands/radio/config.json');
const { connectToChannel, attachRecorder } = require('./commands/radio/index');
const axios = require('axios').default

const {
	NoSubscriberBehavior,
	createAudioPlayer,
	AudioPlayerStatus,
} = require('@discordjs/voice');

const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Play,
		maxMissedFrames: Math.round(config.maxTransmissionGap / 20),
	},
});

player.on('stateChange', (oldState, newState) => {
	if (oldState.status === AudioPlayerStatus.Idle && newState.status === AudioPlayerStatus.Playing) {
		console.log('Playing audio output on audio player');
	} else if (newState.status === AudioPlayerStatus.Idle) {
		console.log('Playback has stopped. Attempting to restart.');
		attachRecorder(player);
	}
});

client.login(token);

const interactions = new Map();

client.on('ready', async () => {
	console.log('discord.js client is ready!');
	attachRecorder(player);
});

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

	if(command === 'listen-contanova'){
		const channel = message.member?.voice.channel;
		if (channel) {
			try {
				const connection = await connectToChannel(channel);
				connection.subscribe(player);
				await message.reply('Playing now!');
			} catch (error) {
				console.error(error);
			}
		} else {
			await message.reply('Join a voice channel then try again!');
		}
	}

	if(command === 'spotify'){
		axios.get()
	}
});
