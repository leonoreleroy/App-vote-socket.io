
var app = require('express')();

// Création du serveur
var http = require('http').createServer(app);

//// SOCKET.IO ////
var io = require('socket.io')(http);

// Variables globales
var votes = [];
var allVotes = [];
var voteDuration = 60 * 1000;
var clients = [];
var score;

sizeObject = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

// On lit notre fichier index.html
app.get('/', function(req, res){
	res.sendFile(__dirname + "/index.html")
});

// Quand une personne se connecte au serveur
io.on('connection', function(socket){
	console.log("socket.id");
	console.log(socket.id);
	clients.push(socket.id);
	io.sockets.connected[socket.id].emit('client-login', {connected:true});

	socket.on('vote', function(vote){
		vote.socketID = socket.id;
		votes[socket.id] = vote;
		allVotes.push(vote);
		io.emit('score-update', updateScore());
	});

	// Quand une personne se déconnecte du serveur
	socket.on('disconnect', function(response){
		var where = clients.indexOf(socket.id);
		clients.splice(where, 1);
	});
});

// On ajoute un vote à jade
function updateScore(){
	var sum = 0;
	var plusCount = 0;
	var minusCount = 0;
	var weight, vote;
	for (var i in votes) {
		vote = votes[i];
		weight = weightVote(vote);
		if(weight == 0){
			delete votes[i];
			console.log("removed vote: ", vote);
		} else {
			sum += (vote.qty * weight);
			if(vote.qty > 0){
				plusCount++;
			}
			if(vote.qty < 0){
				minusCount++;
			}
		}
	}

	// On retourne les nouveaux scores
	var voteLength = sizeObject(votes);
	var newScore = voteLength == 0 ? 0 : sum / voteLength;
	console.log("Updated Score: " + newScore);
	return {
		clients:sizeObject(clients),
		score:newScore,
		plusCount:plusCount,
		minusCount:minusCount,
	};
}

function weightVote(vote){
	var now = new Date().getTime();
	var then = vote.timestamp;
	var elapsed = now - then;

	decay = elapsed / voteDuration;
	weightedVote = 1 - decay
	weightedVote = weightedVote <= 0 ? 0 : weightedVote;
	console.log('voteDuration: ', voteDuration, ' now: ', now, ' then: ', then, ' elapsed: ', elapsed, ' decay: ', decay, ' weightedVote: ', weightedVote);
	return weightedVote;
}

setInterval(function(){
	newScore = updateScore();
	console.log(newScore);
	io.emit('score-update', newScore);
}, 1000);


// Notre application écoute sur le port 7000
http.listen(7000, function(){
	console.log('listening on *:7000');
});




