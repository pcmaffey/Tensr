Template.body.onCreated( function () {
  var self = this;
  self.autorun(function () {
  self.subscribe("messages");

  var gameSub = self.subscribe("games");
  if (gameSub.ready()) {
    var game = Games.findOne({});
    if (game) {
      Session.set("fieldSize", game.fieldSize);
      Session.set("gameId", game._id);

      var playSub = self.subscribe("play", game._id);
      if (playSub.ready()) {
        var play = Play.findOne({playerId: Meteor.userId()});

        if (play) {
          Session.set("team", play.team);
          Session.set("state", play.state);
          Session.set("stateUpdatedAt", play.stateUpdatedAt);
          if (play.state != 0) {
            Session.set("selectCell", false);
          };
        };
      };
    };
  };

  });
  });

Template.body.onRendered( function () {
  //run view() within reactive autorun
  Meteor.autorun(function () {
    view()
    });
  });

Template.body.helpers({

  getMessage: function () {
    //Determine if a message exists and pass state to template to render that message
    //Might restructure as a template.dynamic
    //Must be reactive
    //return template name
    var msg = Messages.findOne({}, {sort: {createdAt: -1}});

    if (msg) {
      return msg;
    } else {
      return false;
    };
  }
});


Template.registerHelper('getSpirits', function(team) {
  //Returns # of spirits waiting
  //If player is a spirit, shows where they are in the order as "3 of 10" --spiritOrder(), also called from messages
  game = Games.findOne({});
    if (game) {
      var t = team;
      var oTeam;
      //normalize
      if (t == "yin" || t == 0) {t = 0; team = "yin"; oTeam = "yang";}
      else if (t == "yang" || t == 1) {t = 1; team = "yang"; oTeam = "yin";}
      var spirits = game.spirits[team];

      if (Session.get("state") == 0 && Session.get("team") == t) {
        var players = Play.find({state: 0, team: Session.get("team"), stateUpdatedAt: {$lte: Session.get("stateUpdatedAt")}}).count();
          if (players) {
            spirits =  players + " of " + game.spirits[team];

            //It's your turn!
            if (players == 1) {
              //hide message unless the only one in queue
              if (game.spirits[team] > 1) {
                Meteor.call("readMessage", Template.instance().data.template);
              };
              //both players must be ready
              if (game.spirits[oTeam] > 0) {
                Session.set("selectCell", true);
              }
            } else {
              Session.set("selectCell", false);
            };

          };

    };
    return spirits;
  };
});


Template.info.helpers({
alive: function (team) {
  //get # of active cells in game
  game = Games.findOne({});
    if (game) {
      return game.activeCells[team];
    };
},
score: function (team) {
  game = Games.findOne({});
    var oTeam = "yin";
    if (game) {
      if (team == "yin") {oTeam = "yang"}
      return game.devouredCells[oTeam];
    };
}

});


Template.newSpirit.helpers({

  teamColor: function () {
    var color = "black";
    if (Template.instance().data.team == 1) {color = "white"};
    return color;
  },

  opponent: function () {
    var opp = "Yang's white";
    if (Template.instance().data.team == 1) {color = "Yin's black"};
    return opp;
  }
});

Template.newSpirit.events({
  "click .button": function (e) {
   e.preventDefault();
   Meteor.call("readMessage", Template.instance().data.template);
  }
  });

  Template.drop.events({
    "click .yes": function (e) {
     e.preventDefault();
     Meteor.call("drop", Session.get("activeCellId"));
    },

    "click .no": function (e) {
     e.preventDefault();
     Meteor.call("readMessage", Template.instance().data.template);
    }
  });

Template.registerHelper("teamName", function(){
    var team = Template.instance().data.team;

    if (team == 0) { return "Yin"}
    else if (team = 1) {return "Yang"};

});


Template.timer.helpers({
  countdown: function () {
    var game = Games.findOne({});
      if (game) {
        var time = 3000 - game.timer;
        return Math.round(time / 1000);
      } else {
        return false;
      };
  }
  });
