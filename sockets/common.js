var async = require('async');
var __ = require('lodash');
var m = require('../lib/mechanics');
var io;

exports.connection = function(socket){
  io = this;
  socket.emit('connected', {status: 'connected'});
  socket.on('disconnect', socketDisconnect);
  socket.on('startgame', socketStartGame);
  socket.on('playermoved', socketPlayerMoved);
  socket.on('attack', socketAttack);
  socket.on('zombieAttack', socketZombieAttack);
  socket.on('buildwall', socketBuildWall);
  socket.on('attackwall', socketAttackWall);
};

function socketStartGame(data){
  var storage = {};
  var socket = this;

  async.waterfall([
    function(fn){m.findGame(data.game,fn);},
    function(game,fn){if(!game){m.newGame(data.game,fn);}else{fn(null,game);}},
    function(game,fn){storage.game=game;fn();},
    function(fn){m.findPlayer(data.player,fn);},
    function(player,fn){if(!player){m.newPlayer(data.player,data.color,fn);}else{fn(null,player);}},
    function(player,fn){m.resetPlayer(player,socket,fn);},
    function(player,fn){storage.player=player;fn();},
    function(fn){fn(null,__.any(storage.game.players,function(p){return p.id===storage.player.id;}));},
    function(isFound,fn){if(!isFound){m.attachPlayer(storage.game,storage.player,fn);}else{fn(null,storage.game);}},
    function(game,fn){m.findGame(data.game,fn);},
    function(game,fn){m.emitPlayers(io.sockets, game.players, game.walls, game.potions, fn);}
  ]);
}

function socketPlayerMoved(data){
  // console.log(data);

  async.waterfall([
    function(fn){m.findPlayer(data.player,fn);},
    function(player,fn){m.updateCoordinates(player,data.x,data.y,fn);},
    function(player,fn){m.findGame(data.game, fn);},
    function(game, fn){m.drinkPotion(game, player, fn);},//***check this line***//
    function(game,fn){m.emitPlayers(io.sockets,game.players, game.walls, game.potions, fn);}
  ]);
}

function socketAttack(data) {
  // console.log(data);

  async.waterfall([
    function(fn){m.findPlayer(data.prey,fn);},
    function(player,fn){m.takeHit(player,fn);},
    function(player,fn){m.findGame(data.game,fn);},
    function(game,fn){m.emitPlayers(io.sockets,game.players, game.walls, game.potions, fn);}
  ]);
}

function socketZombieAttack(data){
  console.log(data);
  async.waterfall([
    function(fn){m.findPlayer(data.prey,fn);},
    function(player,fn){m.takeZombieHit(player,fn);},
    function(player,fn){m.findGame(data.game,fn);},
    function(game,fn){m.emitPlayers(io.sockets,game.players, game.walls, game.potions, fn);}
  ]);
}

function socketBuildWall(data) {
  async.waterfall([
    function(fn){m.findGame(data.game,fn);},
    function(game, fn){m.buildWall(game, data.x, data.y, data.direction,fn);},
    function(game,fn){m.emitPlayers(io.sockets,game.players, game.walls, game.potions, fn);}
  ]);
}

function socketAttackWall(data) {
  async.waterfall([
    function(fn){m.findGame(data.game,fn);},
    function(game,fn){m.attackWall(game, data.x, data.y, data.direction,fn);},
    function(game,fn){m.attackOppositeWall(game, data.x, data.y, data.direction,fn);},
    function(game,fn){m.emitPlayers(io.sockets,game.players, game.walls, game.potions, fn);}
  ]);
}

function socketDisconnect(data){
  console.log(data);
}