const COMMANDS = require('../Commands')

class MessageInterceptor{
  constructor(message){
    this.message = message;
    this.command = '';
  }

  getCommand(){
    
    if(!this.message.content.startsWith(process.env.PREFIX)) return

    this.command = this._splitMessage(this.message)

    if(!this._isValid()) return false
    return this.command
  }

  _isValid(){
    return COMMANDS.includes(this.command);
  }

  _isMessagePrefix(message){
    if(!message.content.startsWith(process.env.PREFIX)) return
  }

  _splitMessage(message){
   const splittedMessage = message.content.substring(process.env.PREFIX.length).split(/ +/);
   return splittedMessage.shift();
  }
  

  getMessageAtribute(message, command){
    const arrMessage = message.split(`${process.env.PREFIX}${command}`);
    return arrMessage[arrMessage.length -1]
  }
}

module.exports = MessageInterceptor;