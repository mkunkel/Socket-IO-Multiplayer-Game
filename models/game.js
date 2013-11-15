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
    function createPotion(){
      var potion = {};
      potion.x = randomize();
      potion.y = randomize();
      potion.strength = randomize();
      game.potions.push(potion);
      if(game.potions.length > 5){
        game.potions.pop();
      }
      game.markModified();
      game.save();
    }
    //starts the board with two potions:
    createPotion();
    createPotion();
    //adds a potion to the board every 30s:
    setInterval(function(){
      createPotion();
    },30000);
  }
  next();
});

mongoose.model('Game', Game);

