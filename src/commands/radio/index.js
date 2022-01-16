// require('module-alias/register');

const { Client } = require('discord.js');
const prism = require('prism-media');
const config = require('./config.json');
const {
	StreamType,
	createAudioResource,
	entersState,
	VoiceConnectionStatus,
	joinVoiceChannel,
} = require('@discordjs/voice');

exports.attachRecorder = function attachRecorder(player) {
	player.play(
		createAudioResource(
			new prism.FFmpeg({
				args: [
					'-analyzeduration',
					'0',
					'-loglevel',
					'0',
					'-f',
					config.type,
					'-i',
					config.type === 'dshow' ? `audio=${config.device}` : config.device,
					'-acodec',
					'libopus',
					'-f',
					'opus',
					'-ar',
					'48000',
					'-ac',
					'2',
				],
			}),
			{
				inputType: StreamType.OggOpus,
			},
		),
	);
	console.log('Attached recorder - ready to go!');
}

exports.connectToChannel = async function connectToChannel(channel) {
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});
	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
		return connection;
	} catch (error) {
		connection.destroy();
		throw error;
	}
}

const client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'] });

void client.login(config.token);