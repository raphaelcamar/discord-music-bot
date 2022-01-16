const {
	AudioPlayerStatus,
	createAudioPlayer,
	entersState,
	VoiceConnectionDisconnectReason,
	VoiceConnectionStatus,
} = require( '@discordjs/voice');
const { promisify } = require('node:util');

const wait = promisify(setTimeout);

module.exports = class MusicSubscription {
	voiceConnection
	audioPlayer
	queue
	queueLock = false;
	readyLock = false;

	constructor(voiceConnection) {
		this.voiceConnection = voiceConnection;
		this.audioPlayer = createAudioPlayer();
		this.queue = [];

		this.voiceConnection.on('stateChange', async (_, newState) => {
			if (newState.status === VoiceConnectionStatus.Disconnected) {
				if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
					try {
						await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000);
					} catch {
						this.voiceConnection.destroy();
					}
				} else if (this.voiceConnection.rejoinAttempts < 5) {
					await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000);
					this.voiceConnection.rejoin();
				} else {

					this.voiceConnection.destroy();
				}
			} else if (newState.status === VoiceConnectionStatus.Destroyed) {

				this.stop();

			} else if (
				!this.readyLock &&
				(newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
			) {

				this.readyLock = true;

				try {

					await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20_000);

				} catch {

					if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) this.voiceConnection.destroy();

				} finally {

					this.readyLock = false;

				}
			}
		});

		this.audioPlayer.on('stateChange', (oldState, newState) => {
			if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {

				(oldState.resource).metadata.onFinish();

				this.processQueue();

			} else if (newState.status === AudioPlayerStatus.Playing) {

				(newState.resource).metadata.onStart();

			}
		});

		this.audioPlayer.on('error', (error) => (error.resource).metadata.onError(error));

		voiceConnection.subscribe(this.audioPlayer);
	}

	enqueue(track) {
		this.queue.push(track);
		this.processQueue();
	}

	stop() {
		this.queueLock = true;
		this.queue = [];
		this.audioPlayer.stop(true);
	}

	async processQueue() {

		if (this.queueLock || this.audioPlayer.state.status !== AudioPlayerStatus.Idle || this.queue.length === 0) {
			return;
		}

		this.queueLock = true;

		const nextTrack = this.queue.shift();
		try {

			const resource = await nextTrack.createAudioResource();

			this.audioPlayer.play(resource);

			this.queueLock = false;

		} catch (error) {

			nextTrack.onError(error);
			this.queueLock = false;
			return this.processQueue();
		}
	}
}