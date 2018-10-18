require('dotenv').config();
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
        password: process.env.AUTH_KEY
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
        client.action('hopollo', 'Retrouvez moi sur les réseaux ► https://www.twitter.com/HoPolloTV • https://www.youtube.com/HoPollo (!last) • https://www.facebook.com/HoPollo •');
    }
    function song() {
        client.action('hopollo', 'Utilisez !song pour connaitre son titre en temps réel :)');
    }

    addTimer(social, 15);
    addTimer(song, 20);
}

client.on('chat', function (channel, userstate, message, self) {
    var user = userstate['username'];
    var rank = userstate['badges']; //TODO (hopollo): Add user grade detection (sub, mod, follower, owner, etc)
    var blackListedNames = /(^|\W)(hplbot|streamelements|hnlbot|moobot|wizebot)($|\W)/i;
    var debug = true;

    if (self || blackListedNames.test(user)) { return;}

    function log(message) {
        if (debug) {
            console.log(message);
        }
    }

    function send(message) {
        client.action(channel, message);
    }

    function reply(message) {
        client.action(channel, `${user} ${message}`);
    }

    function whisper(user, message) {
        client.whisper(user, message);
    }

    function customApi(url){
        //TODO(hopollo) : CREATE THE FUNCTION TO READ FROM LINKS
    }

    // SONG
    const songKeywords =  /(^|\W)(!song|musique|song|zik|morceaux)($|\W)/i;
    if (songKeywords.test(message)) {
            log(`Matching word/cmd : ${songKeywords}`);
            //TODO(Hopollo): Add function customApi(UrlOfLastFm)
    }

    // SALUTATION
    const salutationKeywords = /(^|\W)(yo|salut|bonjour)($|\W)/i;
    if(salutationKeywords.test(message)) {
        reply(`HeyGuys`);
    }

	// TROLLING
    const trollingKeywords = /(^|\W)(KappaPride|monkaS|LuL|Jebaited|TriHard|CoolStoryBob|cmonBruh|BibleThump|<3|DansGame)($|\W)/i;
    if (trollingKeywords.test(message)) {
        send(trollingKeywords);
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
	
	//Background
	const backgroundCommand = '!background';
    if (message.includes(backgroundCommand)) {
        reply('Mon background ► bit.ly/2a4MRiY');
    }

    //Link detection
    const linkWhitelist = ["https://clips.twitch.tv/","https://www.youtube.com/watch?v="];
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
                // youtube link
                reply(`Merci pour la video !`);
                break;
            default:
                timeout(user);
        }
    }

	// StreamStatus
	const streamCommand = /(^|\W)(!setgame|!settitle|!addfilter|!delfilter)($|\W)/i;
    // REMARK (hopollo): Should stay in this order to make sure the command is on a new line
    if(streamCommand.test(message)){
        var userRank = userstate['user-type']; // REMARK (hopollo) : return null on broadcaster
        var message = message.split(' ');
        var args = [];

        for(var i=1, len=message.length; i < len; i++) {
            args.push(message[i]);
        }
        log(`Edit cmd : ${user} (${userRank}) -> ${message[0]}`);
        var command = message[0];
        editChannelInfo(command, args);
    }
	
	function editChannelInfo(command, args) {
        if (args.length == 0) { reply(`la commande ${command} est incomplète`); }
        switch (command) {
            case '!setgame':
                log(`${user} just !setgame -> ${args}`);
                break;
                            // TODO(hopollo) : ADD editing game to mods and owner
                            // TODO(hopollo) : ADD Twitch game depending on their choises
            case '!settitle':
                log(`${user} just !settitle -> ${args}`);
                break;
                            // TODO(hopollo) : ADD editing title to owner only
            case 'addFilter':
                log(`${user} just !addfilter -> ${args}`);
                break;
                            // TODO(hopollo) : ADD editing (add) filter to mods and owner
            case 'delfilter':
                log(`${user} just !delfilter -> ${args}`);
                break;
                            // TODO(hopollo) : ADD editing (remove) filter to mods and owner
            
            default:
                log('Default EditChannelInfo');
        }
    }
    
    //Stats
    const statsCommands = ['!viewers','!subs','!follows','!views'];
    //TODO(hopollo) : Implement those API when customAPI is done;
	
	//Social
    const socialKeywords = /(^|\W)(!social|!facebook|!twitter|!youtube|facebook|twitter)($|\W)/i;
    if (socialKeywords.test(message)) {
        log(`Matching word/cmd ${socialKeywords}`);
        send('Retrouvez moi sur les réseaux ► https://www.twitter.com/HoPolloTV • https://www.youtube.com/HoPollo (!last) • https://www.facebook.com/HoPollo •');
    }

    const lastCommand = '!last';
    if (message.includes(lastCommand)) {
        //TODO (hopollo): return links from lastest youtube video + latest twitch vod
    }

    const hostCommand = '!host';
    if (message.includes(hostCommand)) {
        whisper(user, `Pour host HoPollo rdv sur : twitch.tv/${user} et écrire (ou copier/coller) dans ton tchat : /host hopollo`);
    }
});

// Timeout and Bans
function timeout(user) {
    console.log(`${user} should be timed out for link violation (${message})`);
    // TODO (hopollo) : ADD mods, owner, sub, follower check to avoid or not timeout
    client.timeout(channel, user, 30)
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