//server side helper functions

//On server startup, set config for https://atmospherejs.com/artwells/accounts-guest
//set anonymous to true, so not to require random username and email

Meteor.startup(function () {
  AccountsGuest.anonymous = true; //do not require acccounts-password and make guests anonymous

});

//if player ends their session, drop their cell and terminate from current game.
//Where do I watch for this? onclose callback for Meteor.onConnection?
quit = function() {

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
    };

    Field.update({
      //query coordinates
      "location.x": x,
      "location.y": y
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
      "location.y": y
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
};




//create a new message
setMessage = function(playerId, template, team) {

  var message = Messages.findOne({playerId: playerId, template: template, read: false});

  if (!message) {
    //set other messages to read
      Messages.update({playerId: playerId, read: false}, {$set: {read: true}});

      Messages.insert({
        playerId: playerId,
        read: false,
        template: template,
        team: team,
        createdAt: new Date()
        });
      };
};

//set a new message to read
readMessage = function(playerId, template) {
Messages.update({
  read: false,
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

  Moves.insert({
    gameId: gameId,
    cellId: cellId,
    location: {x:x, y:y},
    direction: dir, //1, 2, 3, 4  = top, right, bottom, left. 0 = new cell
    team: team,
    createdAt: new Date()
  });
};

getRandomLocation = function (gameId, fieldSize) {

  var field = Field.find({gameId: gameId, space: -1});
  field = field.fetch();
  var rnd = getRandomInt(0, field.length);

return field[rnd].location;

};
