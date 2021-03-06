var dotenv = require('dotenv');
var tmi = require('tmi.js');
var fetch = require("node-fetch");

dotenv.config();

var options = {
	options: {
		debug: true
	},
	connection: {
        cluster: 'aws',
		reconnect: true
    },
	identity: {
		username: 'HoPoBot',
        password: process.env.AUTH_KEY
    },
	channels: ['hopollo']
};

var client = new tmi.client(options);
client.connect();

client.on('connected', function (adress, port) {
    this.log.info(`Address : ${adress} : ${port}`);
    this.log.info(`Timers started on  ${this.opts.channels[0]}`);
    timer(this.opts.channels[0]);

    //REMARK : hardcoding the channel array index to avoid sending my timers to others channels;
});

client.on('disconnected', function(reason){
    this.log.info(this.opts.channels,`Disconnected : ${reason}`);
});

function timer(channel) {
    function addTimer(command, delay) {
        var delay = delay * 60000;
        setInterval(command, delay);
    }

    function social() {
        client.action(channel, 'Retrouvez moi sur les réseaux ► https://www.twitter.com/HoPolloTV • https://www.youtube.com/HoPollo (!last) • https://www.facebook.com/HoPollo •');
    }
    function song() {
        client.action(channel, 'Utilisez !song pour connaitre son titre en temps réel :)');
    }

    addTimer(social, 15);
    addTimer(song, 20);
}

client.on('chat', function (channel, userstate, message, self) {
    // TODO (hopollo) : find a way to know if the channel type (affiliate | partner | null)
    var room = {
        channelName: function() { var deash = channel.replace('#',''); return deash; },
        channelID: userstate['room-id'],
        /*
        channelType: function() {
            var url = `https://api.twitch.tv/helix/users?login=${this.channelName()}`;
            var options = {
                headers: {
                    'Client-ID' : process.env.TWITCH_CLIENT_ID
                }
            };
            return fetch(url, options)
                .then(res => res.json())
                .then(data => { return data.data[0].broadcaster_type; })
                .catch(err => log(`Error : ${err}`))
        },
        */

        toString() { return this.channelName(); }
    }

    var user = {
        Type: userstate['user-type'],
        Login: userstate['login'],
        ID: userstate['user-id'],
        DisplayName: userstate['display-name'],
        Type:userstate['user-type'],
        Color: userstate['color'],
        Badges: {
            value: userstate['badges'],
            raw: userstate['badges-raw']
        },

        toString() { return this.DisplayName; }
    };

    var isBroadcaster = 'broadcaster/1';
    var isModerator = 'moderator/1';
    var isViewer = null;

    var blackListedNames = /(^|\W)(hplbot|streamelements|hnlbot|moobot|wizebot)($|\W)/i;
    var debug = true;

    if (self || blackListedNames.test(user.Login)) { return; }

    function log(message) {
        if (debug) {
            console.log(message);
        }
    }

    function send(message) {
        client.action(channel, message);
    }

    function reply(message) {
        client.action(channel, `${user.DisplayName} ${message}`);
    }

    function whisper(message) {
        client.whisper(`${user.DisplayName} ${message}`);
    }

    function customApi(url, desc, source) {
        var token = {
            headers: {
            'Client-ID' : process.env.TWITCH_API_KEY
            }
        };

        switch(source) {
            case 'twitch':
                twitchApiCall(url);
                break;
            default:
                defaultApiCall(url);
        }

        function twitchApiCall(url) {
            log(`Twitch API Call : ${url}`);
            client.api({
                url: url,
                token
            }, function(err, res, body){
                if(!err) {
                    var data = body;
                    send(`${desc} ${data}`);
                }
            });
        }

        function defaultApiCall() {
            log(`API Call : ${url}`);
            fetch(url)
            .then(res => res.text())
            .then(data => { send(`${desc} ${data}`); })
            .catch(err => log(err))
        }
    }
    
    // SONG
    const songKeywords =  /(^|\W)(!song|musique|song|zik|morceaux|titre|artiste|artist)($|\W)/i;
    if (songKeywords.test(message)) {
        log(`Matching word/cmd : ${message}`);
        customApi(`https://4head.xyz/lastfm/?name=${room.toString()}`, 'Musique actuelle ► ');
    }

    // SALUTATION
    const salutationKeywords = /(^|\W)(yo|salut|bonjour|coucou|bjr|hoi)($|\W)/i;
    if(salutationKeywords.test(message)) {
        reply(`HeyGuys`);
    }

	// TROLLING
    const trollingKeywords = /(^|\W)(KappaPride|monkaS|LuL|Jebaited|TriHard|CoolStoryBob|cmonBruh|BibleThump|<3|DansGame)($|\W)/i;
    if (trollingKeywords.test(message)) {
        log(`Matching emote : ${message}`);
        send(message);
    }
	
	// CONFIG
	const configKeywords = /(^|\W)(!config|comme pc|ton setup|ta config|comme setup|ton casque|comme casque|ton clavier|ta cg|comme cg|carte graphique|mic|ton micro|comme micro|matos|headset|ordi|équipements|équipement|écran|ecran|ecrans|écrans)($|\W)/i;
	if(configKeywords.test(message)) {
        log(`Matching word/cmd :${configKeywords}`);
        send('Config PC ► goo.gl/LNaxad ou en description, pour les configs jeux utilise !(nomdujeu)config (ex: !rustconfig)');
	}
	
	// VOCAL Discord, Curse
	const vocalKeywords = /(^|\W|\!)(discord|vocal|discord|teamspeak|mumble|curse|skype)($|\W)/i;
    if (vocalKeywords.test(message)) {
        send('Serveur Discord ► goo.gl/uRqQn0 (conditions : Mature, Bon micro, 0 bruit de fond)');
    }
	
	// Background
	const backgroundCommand = '!background';
    if (message.includes(backgroundCommand)) {
        reply('Mon background ► bit.ly/2a4MRiY');
    }

    // Clip creation
    const clipCommand = '!clip';
    if(message.includes(clipCommand)) {
        var title = message.split(`${clipCommand} `);
        createClip(title[1], userDisplayName);
    }

    function createClip(title, author) {
        var titleMaxLenght = 100;
        var template = `${title} (${userDisplayName})`;
        if(template.length > titleMaxLenght) {
            reply(`Titre de clip trop long ! ${template.length}/100`);
        } else {
            log(`Clip : ${userDisplayName} - ${template} (${template.length}/100)`);

            customApi(`https://api.twitch.tv/helix/clips?broadcaster_id=${room.ID}`, '');
        }
    }

    // Link detection
    const linkWhitelist = ["https://clips.twitch.tv/", "https://www.youtube.com/watch?v=", "https://youtu.be/"];
    for (var i = 0, len = linkWhitelist.length; i < len; i++) {
        if (message.includes(linkWhitelist[i])) {
            var source = linkWhitelist.indexOf(linkWhitelist[i]);
            linkAnswer(source, user);
        }
    }

    function linkAnswer(source, user) {
        switch (source) {
            case 0:
                // twitch clip link
                reply(`Merci pour le clip !`);
                break;
            case 1:
            case 2:
                // youtube link
                reply(`Merci pour la video !`);
                break;
            default:
                if (!user.Badges === null) {
                    timeout(user, 30);
                }
                break;
        }
    }

	// StreamStatus
	const streamCommand = /(^|\W)(!setgame|!settitle|!addfilter|!delfilter)($|\W)/i;
    if(streamCommand.test(message)){
        var message = message.split(' ');
        var args = [];

        for(var i=1, len=message.length; i < len; i++) {
            args.push(message[i]);
        }
        log(`Edit cmd : ${user.DisplayName} (${user.Badges}) -> ${message[0]}`);
        var command = message[0];
        editChannelInfo(command, args);
    }
	
	function editChannelInfo(command, args) {
        if (args.length == 0) { reply(`la commande ${command} est incomplète`); }
        switch (command) {
            case '!setgame':
                log(`${user.DisplayName} just !setgame -> ${args}`);
                break;
            case '!settitle':
                log(`${user.DisplayName} just !settitle -> ${args}`);
                var newTitle = `${args} - Twitter: @HoPolloTV`;
                if (user.Badges.raw = isBroadcaster && user.Badges.raw !=isModerator && user.Badges.raw != isViewer) { // ISSUE (hopollo) : user.isMod() not working
                    var url = `https://api.twitch.tv/helix/streams?user_login=${room.toString()}`;
                    var token = {
                        headers: {
                            'Client-ID': process.env.TWITCH_CLIENT_ID
                        }
                    };
                    fetch(url, token)
                        .then(res => res.json())
                        .then(data => {
                            if (data.data.length == 1) {
                                data.data[0].title = newTitle;
                                reply(`Title updated => ${newTitle}`);
                            } else {
                                reply('Title not updated, stream is offline.');
                            }
                        })
                        .catch(err => console.error(err));
                } else {
                    log(`!setTitle (denied) from ${user.DisplayName} => ${args}`);
                    return;
                }
                break;
            case 'addFilter':
                log(`${user.DisplayName} just !addfilter -> ${args}`);
                break;
                            // TODO(hopollo) : ADD editing (add) filter to mods and owner
            case 'delfilter':
                log(`${user.DisplayName} just !delfilter -> ${args}`);
                break;
                            // TODO(hopollo) : ADD editing (remove) filter to mods and owner
            
            default:
                return;
        }
    }

    // Stats
    const statsCommands = ['!viewers','!subs','!follows','!views','!followers'];
    for (var i=0, len=statsCommands.length; i < len; i++){
        if(message.includes(statsCommands[i])) {
            switch(statsCommands[i]) {
                case '!viewers':
                    customApi(`https://decapi.me/twitch/viewercount/${room.toString()}`, 'Viewers (actuels) ► ');
                   break;
                /*
                   case '!subs':
                    if(room.channelType().then(res => {return res;}) == 'partner' || room.channelType().then(res => {return res;}) == 'affiliate') {
                        customApi(`https://decapi.me/twitch/subcount/tfue`, 'Subs (total) ► ');
                    } else { reply(`${room.channelName()} n'a pas encore accès aux subs.`); }
                    break;
                */
                case '!followers':
                case '!follows':
                    customApi(`http://leshopiniacs.ovh/hopollo/streamtool/followerCount/${room.toString()}`, 'Follows (total) ► ', 'twitch');
                    break;
                case '!views':
                    customApi(`https://decapi.me/twitch/total_views/${room.toString()}`, 'Vues (totales) ► ');
                    break;
                default:
                    return;
            }
        }
    }
	
	// Socials
    const socialKeywords = /(^|\W)(!social|!facebook|!twitter|!youtube|facebook|twitter)($|\W)/i;
    if (socialKeywords.test(message)) {
        log(`Matching word/cmd ${message}`);
        send('Retrouvez moi sur les réseaux ► https://www.twitter.com/HoPolloTV • https://www.youtube.com/HoPollo (!last) • https://www.facebook.com/HoPollo •');
    }

    const lastCommand = '!last';
    if (message.includes(lastCommand)) {
        //TODO (hopollo): return links from lastest youtube video + latest twitch vod
    }

    const hostCommand = '!host';
    if (message.includes(hostCommand)) {
        whisper(user.Login, `Pour host HoPollo rdv sur : twitch.tv/${user.Login} et écrire (ou copier/coller) dans ton tchat : /host hopollo`);
    }
});

// Timeout and Bans
function timeout(user, timer) {
    console.log(`${user} should be timed out for link violation (${message})`);
    client.timeout(channel, user, timer)
    reply(`Timeout : ${user} (link violation)`);
}

// Events
// TODO(hopollo) : MOVE THIS PART TO THE PROPER SECTION (OUT OF MESSAGE POST EVENT)
// host
client.on('hosted', function (channel, username, viewers, autohost) {
    var viewersLimit = 4;
    if (viewers < viewersLimit) {
        send(`HOST : ${username} (${viewers}), bienvenue !`);
    }
});
// cheer
client.on('cheer', function (channel, userstate, message) {
    var user = userstate['username'];
    var bits = userstate.bits;
    send(`CHEER : ${user} (${bits}), merci !`);
});
// subs
client.on("subscription", function (channel, username, method, message, userstate) {
    // TOOD(hopollo) : work on this when sub button is enabled
    send(`SUB : ${user} (${method})`);
});