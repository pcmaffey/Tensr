//Data published to the client
//games, play, cells

Meteor.publish("games", function () {
  //Can't publish via findOne...?
  return Games.find({endedAt:null}, {sort: {createdAt: -1}});

});

Meteor.publish("field", function (gameId) {

    return Field.find({gameId: gameId}, {sort: {order: 1}});

});

Meteor.publish("messages", function () {

  return Messages.find({playerId: this.userId, read:false}, {sort: {createdAt: -1}});

});

Meteor.publish("play", function (gameId) {

  return Play.find({gameId: gameId});

});

Meteor.publish("cells", function (gameId) {

  return Cells.find({gameId: gameId, playerId: this.userId, bornAt: {$ne: null}, droppedAt: null, devouredAt: null});

});
