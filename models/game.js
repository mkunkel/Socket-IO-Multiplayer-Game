var mongoose = require('mongoose');
var __ = require('lodash');

var Game = mongoose.Schema({
  name:      String,
  players:   [{type: mongoose.Schema.Types.ObjectId, ref: 'Player'}],
  walls:     [{}],
  potions:   [{}],
  createdAt: {type: Date, default: Date.now}
});


function randomize() {
  return __.sample(__.range(10));
}

Game.pre('save', function(next){
  if(!this.walls.length) {
    for(var x = 0; x < 10; x++) {
      for(var y = 0; y < 10; y++) {
        var wall = {};
        wall.x = x;
        wall.y = y;
        wall.left = 0;
        wall.right = 0;
        wall.top = 0;
        wall.bottom = 0;
        this.walls.push(wall);
      }
    }

    var game = this;
    setInterval(function(){
      var potion = {};
      potion.x = randomize();
      potion.y = randomize();
      potion.strength = randomize();
      game.potions.push(potion);
      game.markModified();
      game.save();
    },30000);
  }
  next();
});

mongoose.model('Game', Game);

