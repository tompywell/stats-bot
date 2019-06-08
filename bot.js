let discord = require('discord.js');
let auth = require('./auth.json');
let https = require('https');

let authToken;

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
        let perspective
        if (mode != 'all'){
          perspective = words[3]
        }
        let path = '/shards/pc-eu/players?filter[playerNames]=' + player
        getRequest(path, (raw) => {
          try {
            id = JSON.parse(raw).data[0].id
            let path = '/shards/pc-eu/players/' + id + '/seasons/lifetime'
            getRequest(path, (raw) => {
              let allStats = JSON.parse(raw)
              if (mode == 'solo'){
                if (perspective == 'fpp'){
                  stats = allStats.data.attributes.gameModeStats['solo-fpp']
                } else if (perspective == 'tpp') {
                  stats = allStats.data.attributes.gameModeStats['solo']
                }
              } else if (mode == 'duo'){
                if (perspective == 'fpp'){
                  stats = allStats.data.attributes.gameModeStats['duo-fpp']
                } else if (perspective == 'tpp'){
                  stats = allStats.data.attributes.gameModeStats['duo']
                }
              } else if (mode =='squad') {
                if (perspective == 'fpp'){
                  stats = allStats.data.attributes.gameModeStats['squad-fpp']
                } else if (perspective == 'tpp'){
                  stats = allStats.data.attributes.gameModeStats['squad']
                }
              } else if (mode =='all'){
                stats = makeAll(allStats.data.attributes.gameModeStats)
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

makeAll = (stats) => {
  let all = {}
  for (let mode in stats){
    if (stats.hasOwnProperty(mode)){
      for (let stat in stats[mode]){
        if(!all[stat]) {
          all[stat] = []
        }
        all[stat].push(stats[mode][stat])
      }
    }
  }
  for (let stat in all){
    toMax = ['bestRankPoint', 'longestKill', 'longestTimeSurvived', 'maxKillStreaks', 'roundMostKills']
    if (all.hasOwnProperty(stat)){
      if (toMax.includes(stat)){
        all[stat] = arrayMax(all[stat])
      } else {
        all[stat] = arraySum(all[stat])
      }
    }
  }
  return all
}

let arrayMax = array => Math.max(...array)
let arraySum = array => array.reduce((a, b) => a + b, 0)

bot.login(discordToken);
