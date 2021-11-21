const stream = require('youtube-audio-stream');


module.exports = class AudioStream{
  constructor(){
    this.handleView()
  }

  async handleView (req, res) {
    try {
      for await (const chunk of stream(`http://youtube.com/watch?v=34aQNMvGEZQ`)) {
        // console.log(chunk)
      }
      // res.end()
    } catch (err) {
      console.error(err)
      // if (!res.headersSent) {
      //   // res.writeHead(500)
      //   // res.end('internal system error')
      // }
    }
  }

}