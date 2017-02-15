//Data published to the client
//games, play, cells

Meteor.publish("games", function (gameId) {
  if (gameId) {
    return Games.find({_id: gameId});
  } else {
    return Games.find({endedAt:null}, {sort: {createdAt: -1}});
  };


});

Meteor.publish("field", function (gameId) {

    return Field.find({gameId: gameId}, {sort: {order: 1}});

});

Meteor.publish("messages", function (gameId) {

  return Messages.find({gameId: gameId, playerId: this.userId, read:false}, {sort: {createdAt: -1}});

});

Meteor.publish("play", function (gameId) {

  return Play.find({gameId: gameId});

});

Meteor.publish("cells", function (gameId) {

  return Cells.find({gameId: gameId, playerId: this.userId, droppedAt: null, devouredAt: null});

});
