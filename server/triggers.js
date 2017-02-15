//Update collections as data gets updated.

//watch play and update games {players, spirits, cells, activeCells}
Play.after.insert(function (userId, doc) {
//a new player added to game

  //When a player becomes a spirit, send message
  setMessage(doc.gameId, doc.playerId, "waiting", doc.team);

  if (doc.team == 0) {
    Games.update({_id: doc.gameId}, {$set: {updatedAt: new Date()}, $inc: {'players.yin': 1, 'spirits.yin': 1}});
  } else if (doc.team == 1) {
    Games.update({_id: doc.gameId}, {$set: {updatedAt: new Date()}, $inc: {'players.yang': 1, 'spirits.yang': 1}});
  };
});

Play.after.update(function (userId, doc, fieldNames, modifier, options) {
//player state updated
  if (doc.state != this.previous.state) {
    var players; var spirits; var cells; var activeCells;
    var timer;
    if (doc.state == 1) {
      //a cell is born
      players = 0;
      spirits = -1;
      cells = 1;
      activeCells = 1;
      timer = 0;

      //remove all messages... kind of a catch all now. Should be more specific
      //for when a player is logged out then added
            Messages.update({
            gameId: doc.gameId,
            playerId: doc.playerId,
            read: false},
            {$set: {read: true}},
            {multi: true});

    } else if (doc.state == 0) {
      //becomes a spirit
      spirits = 1;
      cells = 0;
        //if they were playing
        if (this.previous.state == 1) {
          activeCells = -1;
          players = 0;
        } else {
          players = 1;
          activeCells = 0;
        };

      //When a player becomes a spirit, send message
      setMessage(doc.gameId, doc.playerId, "waiting", doc.team);


    } else if (doc.state == -1) {
      //quits
      players = -1;
      cells = 0;
      //as a spirit
      if (this.previous.state == 0) {
        spirits = -1;
        activeCells = 0;
        //as active player
      } else {
        spirits = 0;
        activeCells = -1;
      };

    };

//not sure if timer is needed here anymore as clearing in heartbeat...

    if (doc.team == 0) {
      if (timer == 0) {
        Games.update({_id: doc.gameId}, {$set: {timer: timer, updatedAt: new Date()}, $inc: {'players.yin': players, 'spirits.yin': spirits, 'cells.yin': cells, 'activeCells.yin': activeCells}});
      } else {
        Games.update({_id: doc.gameId}, {$set: {updatedAt: new Date()}, $inc: {'players.yin': players, 'spirits.yin': spirits, 'cells.yin': cells, 'activeCells.yin': activeCells}});
      };
    } else if (doc.team == 1) {
      if (timer == 0) {
        Games.update({_id: doc.gameId}, {$set: {timer: timer, updatedAt: new Date()}, $inc: {'players.yang': players, 'spirits.yang': spirits, 'cells.yang': cells, 'activeCells.yang': activeCells}});
      } else {
        Games.update({_id: doc.gameId}, {$set: {updatedAt: new Date()}, $inc: {'players.yang': players, 'spirits.yang': spirits, 'cells.yang': cells, 'activeCells.yang': activeCells}});
      };
    };
  };
});


//Update freedoms of adjacent cells on move / capture
//then update devour state of current cell
Field.after.update(function (userId, doc, fieldNames, modifier, options) {
  //make sure there's a change in state (move or devour)
  if (doc.location != this.previous.location || doc.space != this.previous.space) {
    var up = {x:doc.location.x,y:doc.location.y+1};
    var right = {x:doc.location.x+1,y:doc.location.y};
    var down = {x:doc.location.x,y:doc.location.y-1};
    var left = {x:doc.location.x-1,y:doc.location.y};

    //get adjacent cells
  //  var adj = Field.find({gameId: doc.gameId, space: {$ne: -1}, location: {$in: [up, right, down, left]}});
  var adj = Field.find({gameId: doc.gameId, location: {$in: [up, right, down, left]}});

    adj.forEach(function (space){

      //get freedoms for each adjacent space
      var freedoms = getFreedoms(doc.gameId, space.location);

      if (space.freedoms != freedoms) {
        Field.update({_id: space._id}, {$set: {freedoms: freedoms}});
      };


    });

  };
});
