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
		password: '???????????????????????????????????????'
	},
	channels: ['hopollo']
};

var client = new tmi.client(options);
client.connect();

client.on('connected', function (adress, port) {
	console.log('Address: ' + adress + ':' + port);
});

client.on('chat', function (channel, userstate, message) {
    var user = userstate['username'];
    var rank = ''; //TODO (hopollo): Add user grade detection (sub, mod, follower, owner, etc)
    var blackListedNames = ['hplbot', 'streamelements', 'hnlbot'];
    var cooldown = 60;
    var currentCooldown = 0;

    if (user = self) { return; }
    for (var i = 0, len = blackListedNames.length; i < len; i++) { if (user.includes(blackListedNames[i])) { return; } }


    function send(message) {
        client.action(channel, message);
    }

    function reply(user, message) {
        client.action(channel, user, message);
    }

    function whisper(user, message) {
        client.whisper(username, message);
    }

    function addTimer(command, time) {
        var command = fn;
        var delay = timer * 60000;
        timer.queue.push(fn, delay);
    }

    // SALUTATION

	var salutation = ['bonjour', 'hey', 'salut', 'HeyGuys', 'slt', 'coucou'];
	for(var i=0; i < salutation.length; i++) {
		if (message.includes(salutation[i])) {
			reply(user, ' HeyGuys');
			return;
		}
	}
	
	
	// TROLLING
	var trolling = ['Kappa', 'kappapride', 'monkaS', 'lul', 'coolstorybob'];
	
	// CONFIG
	var configCommand = '!config';
	var configKeywords = ['comme pc', 'ton setup', 'ta config', 'comme setup', 'ton casque', 'comme casque', 'ton clavier', 'ta cg', 'comme cg', 'carte graphique', 'mic', 'ton micro', 'comme micro', 'matos', 'headset', 'ordi', 'équipements', 'équipement', 'écran', 'ecran', 'ecrans', 'écrans'];
	
	for(var i=0, len=configKeywords.length; i < len; i++){
		if (message.includes(configCommand) || message.includes(configKeywords[i])) {
			send('Config PC ► goo.gl/LNaxad ou en description, pour les configs jeux utilise !(nomdujeu)config (ex: !rustconfig)');
			return;
		}
	}
	
	// VOCAL Discord, Curse
	// REMARK(hopollo) : Surprisingly message.search ne trouve pas !config dans les keyword, séparation obligatoire ??
	var vocalCommand = '!discord';
	var vocalKeywords = ['vocal', 'discord', 'teamspeak', 'mumble', 'curse', 'skype'];
	
	for(var i=0, len=vocalKeywords.length; i < len; i++) {
		if (message.includes(vocalCommand) || message.includes(vocalKeywords[i])) {
            send('Serveur Discord ► goo.gl/uRqQn0 (conditions : Mature, Bon micro, 0 bruit de fond)');
			return;
		}
	}
	
	//Background
	var backgroundCommand = '!background';
	
    if (message.includes(backgroundCommand)) {
        send('Mon background ► bit.ly/2a4MRiY');
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
    	
	//StreamStatus
	var streamCommand = ['!setgame','!settitle','!addfilter','!delfilter'];
	
	for (var i=0, len=streamCommand.length; i < len; i++) {
		if(message.includes(streamCommand[i])){
			var e = streamCommand[i];
			var userRank = userstate['user-type']; // REMARK (hopollo) : return null on broadcaster
			
			console.log('result ' + user + ' ' + userRank + ' cmd ' + e);
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
    var socialCommand = '!social';
    if (message.includes(socialCommand) || user != self) {
		social();
	}
	
    function social() {
        send('Retrouvez moi sur les réseaux ► https://www.twitter.com/HoPolloTV • https://www.youtube.com/HoPollo (!last) • https://www.facebook.com/HoPollo •');
    }

    var lastCommand = '!last';
    if (message.includes(lastCommand)) {
        //TODO (hopollo): return links from lastest youtube video (+ latest twitch vod)
        return;
    }

    // Events
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
	
	//TIMERS
    addTimer(social, 15);

});
