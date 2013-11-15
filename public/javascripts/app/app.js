/* global _, getValue, document, alert, window, io */

$(document).ready(initialize);

var socket;
var player;
var color;
var game;
var players = [];

function initialize(){
  $(document).foundation();
  initializeSocketIO();
  $('#start').on('click', clickStart);
  $('body').on('keyup', keypressMove);
}

function keypressMove(e) {
  if(e.which === 13 || e.which === 32) {return false;}
  // console.log(e);
  var isArrow = _.any([37, 38, 39, 40], function(i){return i === e.which;});
  var x;
  var y;
  var oldX;
  var oldY;

  if(isArrow) {
    var $td = $('.player:contains(' + player + ')').closest('td');
    x = $td.data('x');
    y = $td.data('y');
    oldX = x;
    oldY = y;
    var direction;

    switch(e.which) {
      case 37:
        // 37 left
        direction = 'left';
        if(!e.shiftKey && !e.ctrlKey && !$td.hasClass('leftWall') && x > 0) {
          x--;
        }
        break;
      case 38:
        // 38 up
        direction = 'top';
        if(!e.shiftKey && !e.ctrlKey && !$td.hasClass('topWall') && y > 0) {
          y--;
        }
        break;
      case 39:
        // 39 right
        direction = 'right';
        if(!e.shiftKey && !e.ctrlKey && !$td.hasClass('rightWall') && x < 9) {
          x++;
        }
        break;
      case 40:
        // 40 down
        direction = 'bottom';
        if(!e.shiftKey && !e.ctrlKey && !$td.hasClass('bottomWall') && y < 9) {
          y++;
        }

    }

    if(e.shiftKey) {
      socket.emit('buildwall', {game: game, player:player, x: x, y: y, direction:direction});
    } else if(e.ctrlKey) {
      socket.emit('attackwall', {game: game, player:player, x: x, y: y, direction:direction});
      attackOppositeWall(game, player, x, y, direction);
    } else if(oldX !== x || oldY !== y) {
      socket.emit('playermoved', {game: game, player:player, x: x, y: y});
    }

  } else if($('#board:visible').length && e.which !== 32) {

    var prey = findPrey();
    var attacker = findPlayer();
    for(var i = 0; i < prey.length; i++) {
      var thisPrey = prey[i];
      if(attacker.isZombie){
        alert('Zombie Attack!');
        socket.emit('zombieAttack', {game:game, attacker: player, prey: thisPrey});
      }else{
        socket.emit('attack', {game: game, attacker: player, prey: thisPrey});
      }
    }
    // var $currentCell = $('.player').parent();
    // if($currentCell.hasClass('potion')){
    //   // socket.emit('drinkPotion', {game: game, player: player, x:x, y:y});
    //   alert('the potion condition works!');
    // }
  }
}

function attackOppositeWall(game, player, x, y, direction) {
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
  if($('td[data-x=' + x + '][data-y=' + y + ']').length) {
    socket.emit('attackwall', {game: game, player:player, x: x, y: y, direction:direction});
    console.log(x + ', ' + y);
  }
}

function findPrey(){
  var $td = $('.player:contains(' + player + ')').closest('td');
  var prey = _.filter($td.children('.player'), function(div) { return $(div).text() !== player; });
  prey = _.map(prey, function(div){ return $(div).text();});
  return prey;
}

function findPlayer(){
  return _.find(players, function(p){return p.name === player;});
}

function clickStart() {
  player = getValue('#player');
  color = getValue('#color');
  game = getValue('#name');
  $('#currentPlayer').text(player).css('background-color', color);
  // $('#form').hide();
  $('#board').show();
  socket.emit('startgame', {player: player, color: color, game: game});
}


function initializeSocketIO(){
  var port = window.location.port ? window.location.port : '80';
  var url = window.location.protocol + '//' + window.location.hostname + ':' + port + '/app';

  socket = io.connect(url);
  socket.on('connected', socketConnected);
  socket.on('playerjoined', socketPlayerJoined);

}

function socketConnected(data){
  console.log(data);
}

function socketPlayerJoined(data) {
  console.log(data);
  players = data.players;
  var x, y, $td, $player, $outerHealth;
  $('td').empty()
        .removeClass('leftWall')
        .removeClass('rightWall')
        .removeClass('topWall')
        .removeClass('bottomWall')
        .removeClass('potion')
        .css('border', 'none');
  for(var i = 0; i < data.players.length; i++) {
    if(data.players[i].health > 0) {
      x = data.players[i].x;
      y = data.players[i].y;
      $td = $('td[data-x=' + x + '][data-y=' + y + ']');
      $player = $('<div>').addClass('player');
      $player.css('background-color', data.players[i].color);
      $player.text(data.players[i].name);
      $player.append($('<img>').attr('src','../images/player.png').addClass('icon'));
      $outerHealth = $('<div>').addClass('outerHealth');
      $outerHealth.append($('<div>').addClass('innerHealth').css('width', data.players[i].health + '%'));
      $player.append($outerHealth).appendTo($td);
    } else{
      x = data.players[i].x;
      y = data.players[i].y;
      $td = $('td[data-x=' + x + '][data-y=' + y + ']');
      $player = $('<div>').addClass('player');
      $player.css('background-color', 'grey');
      $player.text(data.players[i].name);
      $player.append($('<img>').attr('src','../images/zombie.png').addClass('icon'));
      $outerHealth = $('<div>').addClass('outerHealth');
      $outerHealth.append($('<div>').addClass('innerHealth').css('width', data.players[i].health + '%'));
      $player.append($outerHealth).appendTo($td);
    }
  }
  for(i = 0; i < data.walls.length; i++) {
    $td = $('td[data-x=' + data.walls[i].x + '][data-y=' + data.walls[i].y + ']');
    if(data.walls[i].left) {
      $td.addClass('leftWall').css('border-left', getBorderColor(data.walls[i].left));
      if($td.prev().length){$td.prev().addClass('rightWall');}
    }
    if (data.walls[i].right) {
      $td.addClass('rightWall').css('border-right', getBorderColor(data.walls[i].right));
      if($td.next().length){$td.next().addClass('leftWall');}
    }

    if(data.walls[i].top) {
      $td.addClass('topWall').css('border-top', getBorderColor(data.walls[i].top));
      if($('td[data-x=' + data.walls[i].x + '][data-y=' + (data.walls[i].y - 1) + ']').length) {
        $('td[data-x=' + data.walls[i].x + '][data-y=' + (data.walls[i].y - 1) + ']').addClass('bottomWall');
      }
    }
    if(data.walls[i].bottom) {
      $td.addClass('bottomWall').css('border-bottom', getBorderColor(data.walls[i].bottom));
      if($('td[data-x=' + data.walls[i].x + '][data-y=' + (data.walls[i].y + 1) + ']').length) {
        $('td[data-x=' + data.walls[i].x + '][data-y=' + (data.walls[i].y + 1) + ']').addClass('topWall');
      }
    }
  }
  for(var i = 0; i < data.potions.length; i++) {
    var $td = $('td[data-x=' + data.potions[i].x + '][data-y=' + data.potions[i].y + ']');
    $td.addClass('potion');
  }
}

function getBorderColor(health) {
  health = health / 100;
  return '4px ridge rgba(255, 0, 0, ' + health + ')';
}