var mongoose = require('mongoose');

var Game = mongoose.Schema({
  name:      String,
  players:   [{type: mongoose.Schema.Types.ObjectId, ref: 'Player'}],
  walls:     [{}],
  potions:   [{}],
  createdAt: {type: Date, default: Date.now}
});

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



  }
  next();
});

mongoose.model('Game', Game);