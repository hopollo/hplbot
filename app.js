var tmi = require('tmi.js');

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
		password: '???????'
	},
	channels: ['hopollo']
};

var timerOptions = {
    queue: [],
    position: {
        index: 0
    },
    defaultDelay: {
        defaultDelay: 3000
    }
}

var client = new tmi.client(options);
//var timer = new tmi.timer(timerOptions);

client.connect();

client.on('connected', function (adress, port) {
    console.log('Address: ' + adress + ':' + port);
    console.log('Info : Timers started');
    timer();
});

function timer() {
    function addTimer(command, delay) {
        var fn = command;
        var delay = delay * 60000;
        setInterval(command, delay);
    }

    function social() {
        client.action("hopollo", 'Retrouvez moi sur les réseaux ► https://www.twitter.com/HoPolloTV • https://www.youtube.com/HoPollo (!last) • https://www.facebook.com/HoPollo •');
    }

    addTimer(social, 15);
}

client.on('chat', function (channel, userstate, message, self) {
    var user = userstate['username'];
    var rank = userstate['badges']; //TODO (hopollo): Add user grade detection (sub, mod, follower, owner, etc)
    var blackListedNames = ['hplbot', 'streamelements', 'hnlbot'];
    var cooldown = 60;
    var currentCooldown = 0;
    var debug = true;

    if (self) { return;}
    for (var i = 0, len = blackListedNames.length; i < len; i++) { if (user.includes(blackListedNames[i])) { return; } }

    function log(message) {
        if (debug) {
            console.log(message);
        }
    }

    function send(message) {
        client.action(channel, message);
    }

    function reply(user, message) {
        client.action(channel, user, message);
    }

    function whisper(user, message) {
        var username = user;
        client.whisper(username, message);
    }

    //log('user : ' + user + '(' + String(rank) + ')');

    // SALUTATION

	var salutationKeywords = ['bonjour', 'hey', 'salut', 'HeyGuys', 'slt', 'yo','coucou'];
    for (var i = 0; i < salutationKeywords.length; i++) {
        var matchSalutationKeywords = new RegExp("\\b" + salutationKeywords[i] + "\\b").test(message);
        if (matchSalutationKeywords) {
            log('Matching word : ' + matchSalutationKeywords);
            reply(user + ' HeyGuys');
			return;
		}
	}
	
	// TROLLING
    var trollingKeywords = ['Kappa', 'KappaPride', 'monkaS', 'LuL', 'Jebaited','TriHard','CoolStoryBob','cmonBruh','BibleThump','<3','DansGame'];
    for (var i = 0, len = trollingKeywords.length; i < len; i++) {
        var matchTrollingKeywords = new RegExp("\\b" + trollingKeywords[i] + "\\b").test(message);
        if (matchTrollingKeywords) {
            log('Matching Emote : ' + matchTrollingKeywords[i]);
            send(trollingKeywords[i]);
            return;
        }
    }
	
	// CONFIG
	var configKeywords = ['!config','comme pc', 'ton setup', 'ta config', 'comme setup', 'ton casque', 'comme casque', 'ton clavier', 'ta cg', 'comme cg', 'carte graphique', 'mic', 'ton micro', 'comme micro', 'matos', 'headset', 'ordi', 'équipements', 'équipement', 'écran', 'ecran', 'ecrans', 'écrans'];
	for(var i=0, len=configKeywords.length; i < len; i++){
        var matchConfigKeywords = new RegExp("\\b" + configKeywords[i] + "\\b").test(message); 
        if (matchConfigKeywords) {
            log('Matching word/cmd :' + configKeywords[i]);
			send('Config PC ► goo.gl/LNaxad ou en description, pour les configs jeux utilise !(nomdujeu)config (ex: !rustconfig)');
			return;
		}
	}
	
	// VOCAL Discord, Curse
	var vocalKeywords = ['!discord','vocal', 'discord', 'teamspeak', 'mumble', 'curse', 'skype'];
    for (var i = 0, len = vocalKeywords.length; i < len; i++) {
        var matchVocalKeywords = new RegExp("\\b" + vocalKeywords[i] + "\\b").test(message);
		if (matchVocalKeywords) {
            send('Serveur Discord ► goo.gl/uRqQn0 (conditions : Mature, Bon micro, 0 bruit de fond)');
			return;
		}
	}
	
	//Background
	var backgroundCommand = '!background';
    if (message.includes(backgroundCommand)) {
        reply(user + ' Mon background ► bit.ly/2a4MRiY');
		return;
    }

    //Link detection
    var linkWhitelist = ["https://clips.twitch.tv/","https://www.youtube.com/watch?v="]

    for (var i = 0, len = linkWhitelist.length; i < len; i++) {
        if (message.includes(linkWhitelist[i])) {
            var source = linkWhitelist.indexOf(linkWhitelist[i]);
            var user = user;
            linkAnswer(source, user);
        }

    }

    function linkAnswer(source, user) {
        switch (source) {
            case 0:
                reply('Merci pour le clip ' + user + ' !');
                break;
            case 1:
                // youtube link
            default:
                timeout(user);
        }
    }

    // Timeout and Bans
    function timeout(user) {
        console.log(user, ' should be timed out for link violation (' + message + ')');
        // TODO (hopollo) : ADD mods, owner, sub, follower check to avoid or not timeout
        client.timeout(channel, user, 30)
        reply('Timeout : ' + user + '(link violation)');
    }

	// StreamStatus
	var streamCommand = ['!setgame','!settitle','!addfilter','!delfilter'];
	
    for (var i = 0, len = streamCommand.length; i < len; i++) {
        var matchStreamCommand = new RegExp("\\b" + message + "\\b").test(streamCommand[i]);
        // REMARK (hopollo): Should stay in this order to make sure the command is on a new line
		if(matchStreamCommand){
			var e = streamCommand[i];
			var userRank = userstate['user-type']; // REMARK (hopollo) : return null on broadcaster
			
			log('Edit cmd : ' + user + '(' + userRank + ') -> ' + e);
            editChannelInfo(command);
		}
	}
	
	function editChannelInfo(command){
		switch (command) {
			case '!setgame':
							// TODO(hopollo) : ADD editing game to mods and owner
			case '!settitle':
							// TODO(hopollo) : ADD editing title to owner only
			case 'addFilter':
							// TODO(hopollo) : ADD editing (add) filter to mods and owner
			case 'delfilter':
							// TODO(hopollo) : ADD editing (remove) filter to mods and owner
			
			default:
				console.log('default');
		}
	}
	
	//Social
    var socialKeywords = ['!social','!facebook','!twitter','!youtube','facebook', 'youtube', 'twitter'];
    for (var i = 0, len = socialKeywords.length; i < len; i++) {
        var matchSocialKeywords = new RegExp("\\b" + socialKeywords[i] + "\\b").test(message);
        if (matchSocialKeywords) {
            log('Matching word/cmd: ' + matchSocialKeywords[i]);
            send('Retrouvez moi sur les réseaux ► https://www.twitter.com/HoPolloTV • https://www.youtube.com/HoPollo (!last) • https://www.facebook.com/HoPollo •');
        }
    }

    var lastCommand = '!last';
    if (message.includes(lastCommand)) {
        //TODO (hopollo): return links from lastest youtube video (+ latest twitch vod)
        return;
    }

    var hostCommand = '!host';
    if (message.includes(hostCommand)) {
        whisper(user, 'Pour host HoPollo rdv sur : twitch.tv/' + user + ' et écrire (ou copier/coller) dans ton tchat : /host hopollo');
        return;
    }

    // Events
    // TODO(hopollo) : MOVE THIS PART TO THE PROPER SECTION (OUT OF MESSAGE POST EVENT)
    // host
    client.on('hosted', function (channel, username, viewers, autohost) {
        var viewersLimit = 4;
        if (viewers < viewersLimit) {
            send('HOST : ' + username + '(' + viewers + '), bienvenue !');
        }
    });
    // cheer
    client.on('cheer', function (channel, userstate, message) {
        var user = userstate['username'];
        var bits = userstate.bits;
        send('CHEER : ' + user + ' (' + bits + '), merci !');
    });
    // subs
    client.on("subscription", function (channel, username, method, message, userstate) {
        // TOOD(hopollo) : work on this when sub button is enabled
        send('SUB : ' + user + '(' + method + ')');
    });
});
