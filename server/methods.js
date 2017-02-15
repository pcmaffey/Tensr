//Called from client

Meteor.methods({
  //joinGame creates a new game if none exist, and adds player to that game
  //add player to team with fewer spirits
  createGame: function () {
    // Make sure the user is logged in
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    var gameId;

    //Check if game exists
    //deprecated
    //var game = Games.findOne({endedAt:null});

    //if (! game) {
      //Create game
      var fieldSize = 5; //default to 5x5
      var name = getName();

      gameId = Games.insert({
        fieldSize: fieldSize,
        createdAt: new Date(),
        devouredCells: {yin:0, yang:0},
        players: {yin:0, yang:0},
        spirits: {yin:0, yang:0},
        cells: {yin:0, yang:0},
        activeCells: {yin:0, yang:0},
        updatedAt: new Date(),
        name: name,
        timer: 0
      },
      function(err, records){
            //get gameId of new game
            return records;

           }
      );

      //Create field for display
      setField(gameId, fieldSize);
/*
    } else {
      gameId = game._id;
    };
  */
    return gameId;
},

joinGame: function (gameId, play, team) {
  // Make sure the user is logged in
  if (! Meteor.userId()) {
    throw new Meteor.Error("not-authorized");
  }

    //check gameId
    if (! gameId) {
      gameId = Meteor.call("createGame");
    } else {
      //if a player refreshes a finished game... removed endedAt: null
      //if someone visits game route
      var game = Games.findOne({_id: gameId});
      if (! game) {
        gameId = Meteor.call("createGame");
        game = Games.findOne({_id: gameId});
      };
    }

    //get connection Id
    var connId = this.connection.id;

    //Add player to game
    //First check if they're already added
    var playing = Play.findOne({playerId:Meteor.userId(), gameId: gameId}, {_id: 1});

    if (! playing) {
      //Send welcome message first
      //play set from welcome message

      if (! play) {
        if (! game.endedAt) {
          //check which team to add player to, if uneven.


          setMessage(gameId, Meteor.userId(), "welcome");
        } else {
          //could set a game over messsage here... currently just redirecting
        };
      } else {

          //Determine which team to add them to, if not specified.
          if (! team) {
            if (game.players.yin > game.players.yang) {
              //yang
              team = 1;
            } else if (game.players.yin < game.players.yang) {
              //yin
              team = 0;
            };
          };


          readMessage(gameId, Meteor.userId(), "welcome");

          //Add to game
          Play.insert({
            playerId: Meteor.userId(),
            gameId: gameId,
            joinedAt: new Date(),
            state: 0, // 0 = spirit, 1 = born (playing), -1 = quit
            stateUpdatedAt: new Date(),
            cells: 0,
            team: team,
            connId: connId
            });
        };

    } else if (! game.endedAt) {
      //Only update state if game is still playing
      //Re-connect to game as spirit, unless playing
      var state = 0;
      if (playing.state == 1) {
        state = 1;
      };

      Play.update({
        playerId: Meteor.userId(),
        gameId: gameId},
        {$set: {
          state: state,
          stateUpdatedAt: new Date(),
          connId: connId
          }});


    };
  },

  readMessage: function (gameId, template) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    readMessage(gameId, Meteor.userId(), template);
  },

  newCell: function(gameId, x, y, team) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    //switched to upsert, to support player changing where they want to play their cell
    //Have to do manual upsert, in order to get cellId.
    var cell = Cells.findOne({playerId: Meteor.userId(), gameId: gameId, bornAt: null});
    if (cell) {
      Cells.update({_id: cell._id}, {$set: {location: {x:x, y:y}, createdAt: new Date()}});
      var cellId = cell._id;
    } else {
      var cellId = newCell(Meteor.userId(), gameId, x, y, team);
    }

    //removed for timer, added to heartbeat
    //move(gameId, cellId, x, y, 0, team);
  },

  move: function(gameId, cellId, x, y, dir, team) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    move(gameId, cellId, x, y, dir, team);

  },

  drop: function (cellId) {

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

    //get updated cell
    var cell = Cells.findOne({_id: cellId});

    //set confirmation to read
    Meteor.call("readMessage", cell.gameId, "drop");

    //update play
    Play.update({
      gameId: cell.gameId,
      playerId: cell.playerId
      }, {$set:{
        state: 0,
        stateUpdatedAt: new Date()
        }});

  },

  setMessage: function (gameId, template, team) {

    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

  setMessage(gameId, Meteor.userId(), template, team);
  }

  });
