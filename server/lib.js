//server side helper functions

//On server startup, set config for https://atmospherejs.com/artwells/accounts-guest
//set anonymous to true, so not to require random username and email

Meteor.startup(function () {
  AccountsGuest.anonymous = true; //do not require acccounts-password and make guests anonymous

});

//Connection saved to Play. On close, quit player from game. (They can reconnect)
//Added timeout to prevent quit on refresh, !important for hot code push
Meteor.onConnection(function(connection){

  connection.onClose(function() {
    var play = Play.findOne({connId: connection.id});

    if (play) {
      var refresh = Meteor.setTimeout(function(){
          var reconnected = Play.findOne({gameId: play.gameId, playerId: play.playerId, connId: {$ne: connection.id}});
          if (reconnected) {
            Meteor.clearTimeout(refresh);
          } else {
            quit(play.playerId, play.gameId, play.state);
          };
      }, 2000);

    };
    });
});


//if player ends their session, drop their cell and terminate from current game.
quit = function(playerId, gameId, state) {

//check to see if they are actively playing or a spirit
if (state == 0) {
  //spirit
  //delete unread messages
  /*
  Messages.remove({
    read: false,
    playerId: playerId,
    gameId: gameId
    });
    */
} else if (state == 1) {
  //playing
  //drop cell
 Cells.update({
    playerId: playerId,
    gameId: gameId,
    droppedAt: null
    }, {$set:{
      droppedAt: new Date()
      }});
};

//update play to quit
Play.update({
  gameId: gameId,
  playerId: playerId
  }, {$set:{
    state: -1,
    stateUpdatedAt: new Date(),
    connId: null
    }});


};


endGame = function (gameId, team) {
  //team wins
  //update game and players
  Games.update({_id: gameId}, {$set: {endedAt: new Date()}});
  Cells.update({gameId: gameId, droppedAt: null}, {$set: {droppedAt: new Date()}}, {multi:true});

  var players = Play.find({gameId: gameId, state: {$in: [1, 0]}});

  players.forEach(function (player) {

    if (team == player.team) {
      //winner
        setMessage(gameId, player.playerId, "winner", player.team);

    } else {
      //loser
      setMessage(gameId, player.playerId, "loser", player.team);

    };

    });



};

//Most of these are called from heartbeat.js
//These are meant to be server methods... logic is in heartbeat.

//build the field
setField = function(gameId, fieldSize) {
  var edge = "";
  var cellId;
  var space = -1; //define state
    // -1 = empty; 0 = yin; 1 = yang;
    //0.1, 1.1 = cell moved from top; 0.2, 1.2 = cell moved from right; etc
    //0.9, 1.9 = cell devoured
    //0.6, 1.6 = cell bumped;?


  var spaces = fieldSize * fieldSize;
  var fieldCo = Math.floor(fieldSize / 2); //get size of field coordinates
  //start at top left
  var x = -fieldCo;
  var y = fieldCo;
  var i;

  //Loop through each space in field
  for	(i = 0; i < spaces; i++) {
    //Define edges
    if (y == fieldCo && x == fieldCo) {
      edge = "bTopRight";
    } else if (y == fieldCo && x == -fieldCo) {
      edge = "bTopLeft";
    } else if (y == -fieldCo && x == -fieldCo) {
      edge = "bBottomLeft";
    } else if (y == -fieldCo && x == fieldCo) {
      edge = "bBottomRight";
    } else if (y == fieldCo) {
      edge = "bTop";
    } else if (y == -fieldCo) {
      edge = "bBottom";
    } else if (x == fieldCo) {
      edge = "bRight";
    } else if (x == -fieldCo) {
      edge = "bLeft";
    } else if (x == 0 && y == 0){
      edge = "bCenter";
    };

    Field.update({
      //query coordinates
      "location.x": x,
      "location.y": y,
      gameId: gameId
      },{$set: {
      //update values
      gameId: gameId,
      "location.x": x,
      "location.y": y,
      edge: edge,
      order: i,
      cellId: cellId,
      space: space
      }},{
      //params
      upsert: true
      });

      //iterate coordinates
      if (x == fieldCo) {
        //start a new row
        y = y - 1;
        x = -fieldCo;
      } else {
      x = x + 1;
      };

      edge = "";
  };
};

//rebuild the field
// join these functions into 1, with less code
growField = function(gameId, fieldSize) {
  var edge = "";
  var cellId;
  var space = -1; //define state
    // -1 = empty; 0 = yin; 1 = yang;
    //0.1, 1.1 = cell moved from top; 0.2, 1.2 = cell moved from right; etc
    //0.9, 1.9 = cell devoured
    //0.6, 1.6 = cell bumped;?



  var spaces = fieldSize * fieldSize;
  var fieldCo = Math.floor(fieldSize / 2); //get size of field coordinates
  //start at top left
  var x = -fieldCo;
  var y = fieldCo;
  var i;

  //Loop through each space in field
  for	(i = 0; i < spaces; i++) {
    //Define edges
    if (y == fieldCo && x == fieldCo) {
      edge = "bTopRight";
    } else if (y == fieldCo && x == -fieldCo) {
      edge = "bTopLeft";
    } else if (y == -fieldCo && x == -fieldCo) {
      edge = "bBottomLeft";
    } else if (y == -fieldCo && x == fieldCo) {
      edge = "bBottomRight";
    } else if (y == fieldCo) {
      edge = "bTop";
    } else if (y == -fieldCo) {
      edge = "bBottom";
    } else if (x == fieldCo) {
      edge = "bRight";
    } else if (x == -fieldCo) {
      edge = "bLeft";
    };

  if (edge) {
    //add new empty spaces
    Field.update({
      //query coordinates
      "location.x": x,
      "location.y": y,
      gameId: gameId
      },{$set: {
      //update values
      gameId: gameId,
      "location.x": x,
      "location.y": y,
      edge: edge,
      order: i,
      cellId: cellId,
      space: space
      }},{
      //params
      upsert: true
      });
  } else {
    Field.update({
      //query coordinates
      "location.x": x,
      "location.y": y,
      gameId: gameId
      },{$set: {
      //update values
      edge: null,
      order: i
      }});
  };



      //iterate coordinates
      if (x == fieldCo) {
        //start a new row
        y = y - 1;
        x = -fieldCo;
      } else {
      x = x + 1;
      };

      edge = "";
  };

return false;

};




//create a new message
setMessage = function(gameId, playerId, template, team) {

  var message = Messages.findOne({gameId: gameId, playerId: playerId, template: template, read: false});

  if (!message) {
    //set other messages to read
      Messages.update({
      gameId: gameId,
      playerId: playerId,
      read: false},
      {$set: {read: true}},
      {multi: true});

      Messages.insert({
        playerId: playerId,
        gameId: gameId,
        read: false,
        template: template,
        team: team,
        createdAt: new Date()
        });
      };
};

//set a new message to read
readMessage = function(gameId, playerId, template) {
Messages.update({
  read: false,
  gameId: gameId,
  template: template,
  playerId: playerId
  }, {$set: {
  read: true
  }});
};


newCell = function(playerId, gameId, x, y, team) {

  var cellId = Cells.insert({
    playerId: playerId,
    gameId: gameId,
    location: {x:x,y:y},
    team: team,
    createdAt: new Date()
    },

    function(err, records){
          //get cellId of new cell
          return records;

    });

    return cellId;
  //  move(gameId, cellId, x, y, 0, team);
};

move = function (gameId, cellId, x, y, dir, team) {
//changed to upsert to update last move...

  Moves.upsert({
    gameId: gameId,
    cellId: cellId,
    renderedAt: null
      },{
    gameId: gameId,
    cellId: cellId,
    location: {x:x, y:y},
    direction: dir, //1, 2, 3, 4  = top, right, bottom, left. 0 = new cell
    team: team,
    createdAt: new Date()
  });
};

getLocation = function (gameId, fieldSize) {
//Max freedoms, closest to center


  var field = Field.find({gameId: gameId, space: -1, freedoms: {$in: [4, null]}});
  if (field.count() < 2) {
    field = Field.find({gameId: gameId, space: -1, freedoms: 3});
    if (field.count() < 2) {
      field = Field.find({gameId: gameId, space: -1, freedoms: 2});
      if (field.count() < 2) {
        Games.update({_id: gameId}, {$inc: {fieldSize: 2}});
        growField(gameId, (fieldSize + 2));

        return getLocation(gameId, fieldSize);
      }
    }
  }


  field = field.fetch();
/*
  //get closest to middle, without being middle
  var m = getRandomInt(-2, 3);
  if (field.length < 4) {
    m = getRandomInt(-1, 2);
  }
  //down
  if (m == -2) { m = -fieldSize}
  //up
  else if (m == 2) { m = fieldSize}
  else if (m == 0) { return getLocation(gameId, fieldSize);}

  var middle = Math.floor((fieldSize * fieldSize) / 2) + m;
  var x = field[0].order;
  var ind;


  for (var i = 0; i < field.length; i++) {
    if (Math.abs(middle - field[i].order) < Math.abs(middle - x)) {
      x = field[i].order;
      ind = i;
    };
    };
*/

  var ind = getRandomInt(0, field.length);

//check if spot is taken by move?
  var spot = Moves.find({gameId: gameId, location: field[ind].location, renderedAt: null}).count();

  if (spot > 0) {
    return getLocation(gameId, fieldSize);
  }

return field[ind].location;

};

devourCell = function (gameId, fieldId, cellId, date) {

  Field.update({_id: fieldId}, {$set: {space: -1, freedoms: null}});
  Cells.update({_id: cellId},  {$set: {devouredAt: date}});
  var cellUp = Cells.findOne({_id: cellId});
  var playerId = cellUp.playerId;
  //if it was their active cell, update player state
  if (! cellUp.droppedAt) {
    Play.update({gameId: gameId, playerId: playerId}, {$set: {state: 0, stateUpdatedAt: date}});
  };
  if (cellUp.team == 0) {
    Games.update({_id: gameId}, {$set: {updatedAt: date}, $inc: {'devouredCells.yin': 1, 'cells.yin': -1}});
  } else if (cellUp.team == 1) {
      Games.update({_id: gameId}, {$set: {updatedAt: date}, $inc: {'devouredCells.yang': 1, 'cells.yang': -1}});
  };
};

getName = function () {
  var names = [];
  names = ["Mercury", "Venus", "Jupiter", "Mars", "Neptune", "Pluto", "Saturn",
  "Acrux", "Adhara", "Ain", "Alamak", "Alcor", "Alcyone", "Aludra", "Ancha", "Atik", "Atlas", "Atria", "Auva", "Avior", "Baten Kaitos", "Becrux", "Bellatrix", "Caphir", "Chara", "Cor Hydrae", "Denebola", "Diadem", "Dubhe", "Duhr", "Electra", "Errai",
   "Furud", "Gacrux", "Gatria", "Gemma", "Girtab", "Heka", "Izar", "Kraz", "Ksora", "Kullat Nunu", "Kuma", "Menkar", "Miram", "Sadira", "Segin", "Sinistra", "Sirius", "Syrma", "Tabit", "Tseen Kee", "Tyl", "Vega", "Wasat", "Zelpha", "Zosma"
  ];
  var rnd = getRandomInt(0, names.length);
  var name = names[rnd];
  var game = Games.findOne({"name": name, "endedAt": null});

  if (game) {
    var r = getRandomInt(1,13);
    name = name + r.toString();
  };

  return name;
};
