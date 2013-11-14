/* global _, getValue, document, window, io */



$(document).ready(initialize);

var socket;
var player;
var color;
var game;

function initialize(){
  $(document).foundation();
  initializeSocketIO();
  $('#start').on('click', clickStart);
  $('body').on('keyup', keypressMove);
}

function keypressMove(e) {
  var isArrow = _.any([37, 38, 39, 40], function(i){return i === e.which});
  if(isArrow) {
    var $td = $('.player:contains(' + player + ')').closest('td');
    var x = $td.data('x');
    var y = $td.data('y');

    switch(e.which) {
      case 37:
        // 37 left
        x--;
        break;
      case 38:
        // 38 up
        y--;
        break;
      case 39:
        // 39 right
        x++;
        break;
      case 40:
        // 40 right
        y++;

    }
    console.log(x + ' - ' + y);
    socket.emit('playermoved', {game: game, player:player, x: x, y: y});
  } else if($('#board:visible').length && e.which !== 32) {

    var prey = findPrey();
    for(var i = 0; i < prey.length; i++) {
      var thisPrey = prey[i];
      socket.emit('attack', {game: game, attacker: player, prey: thisPrey});
    }
  }
}

function findPrey(){
  var $td = $('.player:contains(' + player + ')').closest('td');
  var prey = _.filter($td.children('.player'), function(div) { return $(div).text() !== player; });
  prey = _.map(prey, function(div){ return $(div).text();});
  return prey;
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
    }
  }
}