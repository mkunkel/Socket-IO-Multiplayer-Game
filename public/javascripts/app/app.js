/* global _, getValue, document, window, io */
var __ = require('lodash');


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

  // console.log(e);
  var isArrow = _.any([37, 38, 39, 40], function(i){return i === e.which;});

  if(isArrow) {
    var $td = $('.player:contains(' + player + ')').closest('td');
    var x = $td.data('x');
    var y = $td.data('y');
    var direction;

    switch(e.which) {
      case 37:
        // 37 left
        direction = 'left';
        if(!e.shiftKey && !e.ctrlKey) {
          x--;
        }
        break;
      case 38:
        // 38 up
        direction = 'top';
        if(!e.shiftKey && !e.ctrlKey) {
          y--;
        }
        break;
      case 39:
        // 39 right
        direction = 'right';
        if(!e.shiftKey && !e.ctrlKey) {
          x++;
        }
        break;
      case 40:
        // 40 down
        direction = 'bottom';
        if(!e.shiftKey && !e.ctrlKey) {
          y++;
        }

    }

    if(e.shiftKey) {
      socket.emit('buildwall', {game: game, player:player, x: x, y: y, direction:direction});
    } else if(e.ctrlKey) {
      socket.emit('attackwall', {game: game, player:player, x: x, y: y, direction:direction});
    } else {
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
    //var x and y are already stated above


    // need to search the potions array for a potion with the same x&y,
    // grab it's strength
    // apply it's strength to player;
    // save the player
    // delete the potion
    // save the game state
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
  // console.log('received');
  players = data.players;
  $('td').empty();
  for(var i = 0; i < data.players.length; i++) {
    if(data.players[i].health > 0) {
      var x = data.players[i].x;
      var y = data.players[i].y;
      var $td = $('td[data-x=' + x + '][data-y=' + y + ']');
      var $player = $('<div>').addClass('player');
      $player.css('background-color', data.players[i].color);
      $player.text(data.players[i].name);
      var $outerHealth = $('<div>').addClass('outerHealth');
      $outerHealth.append($('<div>').addClass('innerHealth').css('width', data.players[i].health + '%'));
      $player.append($outerHealth).appendTo($td);
    } else{
      var x = data.players[i].x;
      var y = data.players[i].y;
      var $td = $('td[data-x=' + x + '][data-y=' + y + ']');
      var $player = $('<div>').addClass('player');
      $player.css('background-color', 'grey');
      $player.text(data.players[i].name);
      var $outerHealth = $('<div>').addClass('outerHealth');
      $outerHealth.append($('<div>').addClass('innerHealth').css('width', data.players[i].health + '%'));
      $player.append($outerHealth).appendTo($td);
    }
  }
  for(var i = 0; i < data.walls.length; i++) {
    var $td = $('td[data-x=' + data.walls[i].x + '][data-y=' + data.walls[i].y + ']');
    data.walls[i].left ? $td.addClass('leftWall') : $td.removeClass('leftWall');
    data.walls[i].right ? $td.addClass('rightWall') : $td.removeClass('rightWall');
    data.walls[i].top ? $td.addClass('topWall') : $td.removeClass('topWall');
    data.walls[i].bottom ? $td.addClass('bottomWall') : $td.removeClass('bottomWall');
  }
  for(var i = 0; i < data.potions.length; i++) {
    var $td = $('td[data-x=' + data.potions[i].x + '][data-y=' + data.potions[i].y + ']');
    $td.append($('<div>').addClass('potion'));
  }
}