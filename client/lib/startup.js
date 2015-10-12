//On startup of client, create a new guest userId,
//check to see if a game is running, and create one if not, --joinGame()
//and add them to the current game as spirit.

Meteor.startup(function () {

  Meteor.call("joinGame");

});
