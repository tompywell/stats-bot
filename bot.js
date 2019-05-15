let discord = require('discord.js');
let auth = require('./auth.json');
let https = require('https');

let bot = new discord.Client();

try {
  let auth = require('./auth.json');
  discordToken = auth.discord;
  pubgToken = auth.pubg;
} catch (err) {
  discordToken = process.env.DISCORD_AUTH_TOKEN
  pubgToken = process.env.PUBG_AUTH_TOKEN
}

bot.on('ready', () => {
  console.log(`Logged in as ${bot.user.tag}!`, 'at', new Date());
});

bot.on('message', msg => {
  if (!msg.author.bot && msg.content){
    try {
      let words = msg.content.split(' ');
      if (words[0] == '!stats-bot'){
        let player = words[1]
        let mode = words[2]
        let perspective = words[3]
        let path = '/shards/pc-eu/players?filter[playerNames]=' + player
        getRequest(path, (raw) => {
          try {
            id = JSON.parse(raw).data[0].id
            let path = '/shards/pc-eu/players/' + id + '/seasons/lifetime'
            getRequest(path, (raw) => {
              let allStats = JSON.parse(raw)
              if (perspective == 'tpp'){
                if (mode == 'solo'){
                  stats = allStats.data.attributes.gameModeStats['solo']
                } else if (mode == 'duo'){
                  stats = allStats.data.attributes.gameModeStats['duo']
                } else if (mode == 'squad'){
                  stats = allStats.data.attributes.gameModeStats['squad']
                }
              } else if (perspective == 'fpp'){
                if (mode == 'solo'){
                  stats = allStats.data.attributes.gameModeStats['solo-fpp']
                } else if (mode == 'duo'){
                  stats = allStats.data.attributes.gameModeStats['duo-fpp']
                } else if (mode == 'squad'){
                  stats = allStats.data.attributes.gameModeStats['squad-fpp']
                }
              }
              msg.channel.send(JSON.stringify(stats).replace(/,|\{|\}/g, '\n').replace(/\"/g, ''))
            })
          } catch (e){
            msg.channel.send(e)
            console.log(err)
            return
          }
        })
      }
    } catch (e) {
      msg.channel.send(e)
    }
  }
});

getRequest = (path, cb) => {
  let options = {
    hostname: 'api.playbattlegrounds.com',
    path: path,
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: 'Bearer ' + pubgToken,
    }
  }

  let req = https.get(options, res => {
    res.setEncoding('utf8');
    let raw = ''

    res.on('data', (d) => {
      raw += d
    })

    res.on('end', () => {
      cb(raw)
    })
  })

  req.on('error', e => {
    console.log(e)
  })

  req.end()
}

bot.login(discordToken);
