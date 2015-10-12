//Called from client

Meteor.methods({
  //joinGame creates a new game if none exist, and adds player to that game
  //add player to team with fewer spirits
  joinGame: function () {
    // Make sure the user is logged in
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    //Check if game exists
    var game = Games.findOne({endedAt:null});
    var gameId;
    if (! game) {
      //Create game
      var fieldSize = 5; //default to 5x5
      gameId = Games.insert({
        fieldSize: fieldSize,
        createdAt: new Date(),
        devouredCells: {yin:0, yang:0},
        players: {yin:0, yang:0},
        spirits: {yin:0, yang:0},
        cells: {yin:0, yang:0},
        activeCells: {yin:0, yang:0},
        timer: 0
      },
      function(err, records){
            //get gameId of new game
            return records;

           }
      );

      //Create field for display
      setField(gameId, fieldSize);
    } else {
      gameId = game._id;
    };

    //Add player to game
    //First check if they're already added
    var playing = Play.findOne({playerId:Meteor.userId(), gameId: gameId}, {_id: 1});

    if (! playing) {
      //Determine which team to add them to.
      var yin = Play.find({gameId: gameId, team:0}).count();
      var yang = Play.find({gameId: gameId, team:1}).count();
      var team = Math.floor(Math.random() * 2);
      if (yin > yang) {
        team = 1;
      } else if (yang > yin) {
        team = 0;
      };

      //Add to game
      Play.insert({
        playerId: Meteor.userId(),
        gameId: gameId,
        joinedAt: new Date(),
        state: 0, // 0 = spirit, 1 = born (playing), -1 = quit
        stateUpdatedAt: new Date(),
        cells: 0,
        team: team
      });

      Messages.insert({
        playerId: Meteor.userId(),
        read: false,
        template: "newSpirit",
        team: team,
        createdAt: new Date()
        });
    } else {
      //If already in game, do I need to do anything?
    };
  },

  readMessage: function (template) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Messages.update({
      read: false,
      template: template,
      playerId: Meteor.userId()
      }, {$set: {
      read: true
      }});
  },

  newCell: function(gameId, x, y, team) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    newCell(Meteor.userId(), gameId, x, y, team);

  },

  move: function(gameId, cellId, x, y, dir, team) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    move(gameId, cellId, x, y, dir, team);

  },

  drop: function (cellId) {
    //Don't authorize user, as will be called when they quit


    //update cell
   Cells.update({
      _id: cellId
      }, {$set:{
        droppedAt: new Date()
        }});

//add check for quit
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    //set confirmation to read
    Meteor.call("readMessage", "drop");

    //get updated cell
    var cell = Cells.findOne({_id: cellId});

    //update play
    Play.update({
      gameId: cell.gameId,
      playerId: cell.playerId
      }, {$set:{
        state: 0,
        stateUpdatedAt: new Date()
        }});

  },

  setMessage: function (template, team) {

    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Messages.insert({
      playerId: Meteor.userId(),
      read: false,
      template: template,
      team: team,
      createdAt: new Date()
      });
  }

  });
