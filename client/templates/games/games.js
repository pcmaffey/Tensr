Template.games.onCreated( function () {
  var self = this;
  self.autorun(function () {
  var gameSub = self.subscribe("games");
/*
  if (gameSub.ready()) {
    var games = Games.find({}, {sort: {fieldSize: 1}});
    if (games.count() == 0) {
      Meteor.call("createGame");
    }
  };
*/
  });
  });

Template.games.helpers({
    games: function () {
      var games = Games.find({}, {sort: {fieldSize: 1}});
/*
      if (games.count() == 1) {
        var game = games.fetch();
        FlowRouter.go("/" + game[0]._id);
      } else {
        return games;
      };
*/
  if (games) {
    return games;
  }

  return false;

  }
  });

Template.games.events({
  "click .newGame": function (e) {
    e.preventDefault();

    Meteor.call("createGame", function(err, data) {
  var gameId = data;
  if (gameId) {
   FlowRouter.go("/" + gameId);
  };
  });


    return false;
  }
  });

  Template.joinGame.events({
    "click .game": function (e) {
      e.preventDefault();

      FlowRouter.go("/" + this._id);
      return false;
    }
    });

  Template.joinGame.helpers({
    playerCount: function () {
      return this.players.yin + this.players.yang;
    }
    });
