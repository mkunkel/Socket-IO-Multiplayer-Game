var mongoose = require('mongoose');
var __ = require('lodash');
var Game = mongoose.model('Game');
var Player = mongoose.model('Player');

exports.findGame = function(name, fn){
  Game.findOne({name:name}).populate('players').exec(function(err, game){
    fn(err, game);
  });
};

exports.newGame = function(name, fn){
  new Game({name:name}).save(function(err, game){
    Game.findById(game.id).populate('players').exec(function(err, game){
      fn(err, game);
    });
  });
};

exports.findPlayer = function(name, fn){
  Player.findOne({name:name}, function(err, player){
    fn(err, player);
  });
};

exports.newPlayer = function(name, color, fn){
  new Player({name:name, color:color}).save(function(err, player){
    fn(err, player);
  });
};

exports.resetPlayer = function(player, socket, fn){
  player.socketId = socket.id;
  player.health = 100;
  player.isZombie = false;
  player.save(function(err, player){
    fn(err, player);
  });
};

exports.updateCoordinates = function(player, x, y, fn){
  player.x = x;
  player.y = y;
  player.save(function(err, player){
    fn(err, player);
  });
};

exports.attachPlayer = function(game, player, fn){
  game.players.push(player);
  game.save(function(err, game){
    fn(err, game);
  });
};

exports.takeHit = function(player, fn) {
   player.health -= 10;

  if(player.health <= 0 ){
    player.health = 0;
    player.isZombie = true;
  }

  player.save(function(err, player){
    fn(err, player);
  });
};

exports.buildWall = function(game, x, y, direction, fn) {
  var td = __.where(game.walls, {'x':x, 'y':y});

  td[0][direction] = 100;
  game.markModified('walls');
  game.save(function(err, game) {
    fn(err, game);
  });
};

exports.attackWall = function(game, x, y, direction, fn) {
  var td = __.where(game.walls, {'x':x, 'y':y});
  // console.log(td);
  td[0][direction] -= 10;
  if(td[0][direction] < 0) {td[0][direction] = 0;}
  console.log(td);
  game.markModified('walls');
  game.save(function(err, game) {
    fn(err, game);
  });
};

exports.attackOppositeWall = function(game, x, y, direction, fn) {
  switch(direction) {
    case 'left':
      direction = 'right';
      x--;
      break;
    case 'right':
      direction = 'left';
      x++;
      break;
    case 'top':
      direction = 'bottom';
      y--;
      break;
    case 'bottom':
      direction = 'top';
      y++;
  }
  var td = __.where(game.walls, {'x':x, 'y':y});
  if(td.length) {
    td[0][direction] -= 10;
    if(td[0][direction] < 0) {td[0][direction] = 0;}
    console.log(td);
    game.markModified('walls');
  }
  game.save(function(err, game) {
    fn(err, game);
  });
}

exports.takeZombieHit = function(player, fn) {
  player.health = 0;
  player.isZombie = true;
  player.save(function(err, player){
    fn(err, player);
  });
};
exports.emitPlayers = function(sockets, players, walls, potions, fn){
  for(var i = 0; i < players.length; i++){
    if(sockets[players[i].socketId]){
      sockets[players[i].socketId].emit('playerjoined', {players:players, walls:walls, potions:potions});
    }
  }
  fn();
};