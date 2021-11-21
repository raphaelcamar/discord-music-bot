const {GuildMember} = require('discord.js');
const {
	entersState,
	joinVoiceChannel,
	VoiceConnectionStatus,
  AudioPlayerStatus,
} = require('@discordjs/voice');
const Track = require('./music/track');
const MusicSubscription = require('./music/subscription');
const getVideosByQueryString = require('../../api/Youtube');
const {prefix} = require('../../config');
// const data = require('../../mock/index') // mock data for tests

module.exports = class Play{
  constructor(message, interactions){
    this.message = message
    this.interactions = interactions
    //TODO make a better logic
    this.prefix = this.message.content.replace(`${prefix}play`, '');
  }
  
  async execute(){
    const data = await this.getUrlLink();
    const { id, snippet } = data;
      let subscription = this.interactions.get(this.message.guildId);
			if (!subscription) {
				if (this.message.member instanceof GuildMember && this.message.member.voice.channel) {
					const channel = this.message.member.voice.channel;
					const joinVoice = joinVoiceChannel({
						channelId: channel.id,
						guildId: channel.guild.id,
						adapterCreator: channel.guild.voiceAdapterCreator,
					}),
					subscription = new MusicSubscription(joinVoice);
					subscription.voiceConnection.on('error', console.warn);
					this.interactions.set(this.message.guildId, subscription);

					try {
						await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
					} catch (error) {
						console.warn(error);
						await this.message.reply('Failed to join voice channel within 20 seconds, please try again later!');
						return;
					}
			
          this.createTrack(id, subscription);
				}else{
          await this.message.reply('Join a voice channel and then try that again!');
          return;
        }
			}else {
        this.createTrack(id, subscription)
      }
  }

  async next(){
    const subscription = this.interactions.get(this.message.guildId);
    subscription.audioPlayer.stop();
  }

  async createTrack(id, subscription){
    try {
      const interaction = this.message
      const track = await Track.from(`https://www.youtube.com/watch?v=${id.videoId}`, {
        onStart() {
          interaction.reply({
            content: `Now playing ${track.title} \n ${track.url}`,
            ephemeral: true
          })
          .catch(console.warn);
        },
        onFinish() {
          // interaction.reply({ content: 'Now finished!', ephemeral: true }).catch(console.warn);
          // subscription.processQueue()
        },
        onError(error) {
          console.warn(error);
          interaction.reply({
            content: `Error: ${error.message}`,
            ephemeral: true
          })
          .catch(console.warn);
          
        },
      });
      subscription.enqueue(track);
      await this.message.reply(`Enqueued ${track.title}`);
      return subscription
    } catch (error) {
      console.warn(error);
      await this.message.reply('Failed to play track, please try again later!');
      subscription.audioPlayer.stop();
      subscription.voiceConnection.destroy();
    }
  }

  async queue(){
    const subscription = this.interactions.get(this.message.guildId);
    if (subscription) {
      const current =
			subscription.audioPlayer.state.status === AudioPlayerStatus.Idle
				? `Nothing is currently playing!`
				: `Playing **${(subscription.audioPlayer.state.resource).metadata.title}**`;
        
        const queue = subscription.queue
        .slice(0, 5)
        .map((track, index) => `${index + 1}) ${track.title}`)
        .join('\n');
        
        await this.message.reply(`${current}\n\n${queue}`);
      }
    }
    
  async leave(){
  const subscription = this.interactions.get(this.message.guildId);
    if(subscription) {
      try{
        subscription.voiceConnection.destroy();

        this.interactions.delete(this.interactions.guildId);

        await this.message.reply({
          content: `Left channel!`,
          ephemeral: true
        });

      } catch(err){
        await this.message.reply({
          content: 'Can´t disconnect. I´m already disconnected',
          ephemeral: true
        })
      }
    } else {
      await this.message.reply('Not playing in this server!');
    }
  }

  async getUrlLink(){
    try{
      const data = await getVideosByQueryString(`${this.prefix} audio`);
      const { items } = data;
      return items[0]
    }catch(err){
      await this.message.reply('Something went wrong. Probably your Youtube API expires the limit.')
    }
  }
}