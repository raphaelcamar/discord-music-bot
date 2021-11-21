const {
  Constants,
} = require("discord.js");

const adapters = new Map();
const trackedClients = new Set();
const trackedShards = new Map();

function trackClient(client){
  if(trackedClients.has(client)) return

  trackedClients.add(client);

  client.ws.on(Constants.WSEvents.VOICE_SERVER_UPDATE, (payload) => {
		adapters.get(payload.guild_id).onVoiceServerUpdate(payload);
	});

  client.ws.on(Constants.WSEvents.VOICE_STATE_UPDATE, (payload) => {
     if(payload.guild_id && payload.session_id && payload.user_id === client.user.id){

      adapters.get(payload.guild_id).onVoiceStateUpdate(payload);

     }
  });

  client.on(Constants.Events.SHARD_DISCONNECT, (_, shardID) => {
		const guilds = trackedShards.get(shardID);
		if (guilds) {
			for (const guildID of guilds.values()) {
				adapters.get(guildID).destroy();
			}
		}
		trackedShards.delete(shardID);
	});
}

function trackGuild(guild) {
  let guilds = trackedShards.get(guild.shardID);
  if (!guilds) {
    guilds = new Set();
    trackedShards.set(guild.shardID, guilds);
  }
  guilds.add(guild.id);
}

exports.createDiscordJSAdapter =  function createDiscordJSAdapter(channel) {
  return (methods) => {
    adapters.set(channel.guild.id, methods);
    trackClient(channel.client);
    trackGuild(channel.guild);
    return {
      sendPayload(data) {
        if (channel.guild.shard.status === Constants.Status.READY) {
          channel.guild.shard.send(data);
          return true;
        }
        return false;
      },
      destroy() {
        return adapters.delete(channel.guild.id);
      },
    };
  };
}