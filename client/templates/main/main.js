Template.game.onCreated( function () {
    var self = this;
    self.autorun(function () {
    self.subscribe("messages", FlowRouter.getParam("_id"));
    var gameSub = self.subscribe("games", FlowRouter.getParam("_id"));

  if (gameSub.ready()) {
    var game = Games.findOne({});
    if (game) {

      Session.set("fieldSize", game.fieldSize);
      var playSub = self.subscribe("play", game._id);
      if (playSub.ready()) {
          var play = Play.findOne({playerId: Meteor.userId()});

          //check if game ended
          if (! game.endedAt) {

            if (play) {
              Session.set("team", play.team);
              Session.set("state", play.state);
              Session.set("stateUpdatedAt", play.stateUpdatedAt);
            };

          } else {
          //show game over for a player... with winner / loser message (don't have to do anything?)
          //also, show game over for someone who didn't play, but comes to the game, possibly from an invite link
            if (! play) {
                FlowRouter.go("/like/tears/in/rain");

            } else {
              if (! play.connId) {
                FlowRouter.go("/like/tears/in/rain");

              };
              Session.set("state", 9); //use this for game ended...
            };
          };
      };
    } else {
      FlowRouter.go("/like/tears/in/rain");
    };
  };

  });
  });

Template.game.onRendered( function () {
  //run view() within reactive autorun
  Meteor.autorun(function () {
    view()
    });

  $(window).on('keydown', function(e){
    if (e.which == 189) {
      //zoom out
      zoom(-1);
      return false;
    } else if (e.which == 187) {
      zoom(1);
      return false;
    };
  });
  });

Template.game.helpers({

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

Template.tensr.events({
  "click .gameMenu": function (e) {
    e.preventDefault();
    FlowRouter.go("/");
  }
  })


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
            if (players == 1) {
              Session.set("spiritOrder", false);
            } else {
              Session.set("spiritOrder", true);
            }
          };

    };
    return spirits;
  };
});


Template.info.helpers({
players: function (team) {
  //get # of active cells in game
  game = Games.findOne({});
    if (game) {
      return game.players[team];
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



  Template.welcome.events({
    "click .cell": function (e) {
     e.preventDefault();
     var team;
     if($(e.target).hasClass("yinCell") || $(e.target).parent().hasClass("yinCell")) {
       team = 0;
       Meteor.call("joinGame", FlowRouter.getParam("_id"), true, team);
     } else if($(e.target).hasClass("yangCell") || $(e.target).parent().hasClass("yangCell")) {
       team = 1;
       Meteor.call("joinGame", FlowRouter.getParam("_id"), true, team);
     }

     return false;
    }
    });

  Template.drop.events({
    "click .yes": function (e) {
     e.preventDefault();
     if (Session.get("state") != 1) {return false;}
     Meteor.call("drop", Session.get("activeCellId"));

     return false;
    },

    "click .no": function (e) {
     e.preventDefault();
     Meteor.call("readMessage", FlowRouter.getParam("_id"), Template.instance().data.template);

     return false;
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
        var time = 5000 - game.timer;
        return Math.round(time / 1000);
      } else {
        return false;
      };
  }
  });

Template.controls.helpers({
  gameName: function () {
    var game = Games.findOne({});
      if (game) {
        return game.name;
      }
      return false;
    }
  })


  Template.controls.events({
    "click .fa-arrows": function (e) {
      e.preventDefault();
      $(".control").toggle(100);
      if ($(".fa-arrows").css("opacity") == "1") {
        $(".fa-arrows").css({"opacity":.4});
      } else {
        $(".fa-arrows").css({"opacity":1});
      };

      return false;
    },

    "click .fa-arrow-down": function (e) {
      e.preventDefault();
      move(3);

      return false;
    },

    "click .fa-arrow-up": function (e) {
      e.preventDefault();
      move(1);

      return false;
    },

    "click .fa-arrow-right": function (e) {
      e.preventDefault();
      move(2);
    },

    "click .fa-arrow-left": function (e) {
      e.preventDefault();
      move(4);

      return false;
    },

    "click .fa-tint": function (e) {
      e.preventDefault();
      if (Session.get("state") != 1) {return false;}

      Meteor.call("setMessage", FlowRouter.getParam("_id"), "drop", Session.get("team"));

      return false;
    },

    "click .fa-search-minus": function (e) {
      e.preventDefault();
      zoom(-1);

      return false;
    },

    "click .fa-search-plus": function (e) {
      e.preventDefault();
      zoom(1);

      return false;
    },

    "click .fa-sign-out": function (e) {
      e.preventDefault();
      FlowRouter.go("/");

      return false;
    }

  });

  Template.welcome.helpers({
    getTeam: function () {
      var team = {};
      var game = Games.findOne({});
        if (game) {
          if (game.players.yin > game.players.yang) {
            //yang
            team = {"yin": false, "yang":true};
          } else if (game.players.yin < game.players.yang) {
            //yin
            team = {"yin": true, "yang":false};
          } else {
            //choose
            team = {"yin": false, "yang":false};
          };
          return team;
        };
        return false;
    }
    });

Template.registerHelper("getUrl", function(){
    return window.location.href;
});

Template.waiting.events({
  "click .share": function (e) {
    $(".shareUrl").toggle();
  },

  "click .closeMessage": function (e) {
    $(".smallMessage").toggle();
    return false;
  }
  });

Template.waiting.helpers({
  spiritOrder: function () {
    return Session.get("spiritOrder");
  }
  })
