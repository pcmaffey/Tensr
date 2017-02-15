//This is the heart beat of the game. It runs on an interval (test time for performance)
//and processes all moves in a sequence.
//Only one move per cell, per heartbeat.
//Should give the appearance of real time.
//unblock and defer functions as possible to enable performance.

//1. interval
//2. move

  //2a. read moves and new cells

  //2b. determine order

  //2c. update location
  //render and notify client of bump() or other effects

//3. devour
//tricky tricky

//4. endGame
//check game conditions and if matched, endGame

//5. expand field
//check if total cells played >= fieldSize dimensions minus 1 (so on 5x5 field, check for (4x4=) 24 cells)


var interval = 500;

//Use to force interval to wait until finished before rerunning.
var run = [];

//Use to set timer on abandoned games
var endCount = {};

var heartbeat = Meteor.setInterval(function() {


    var games = Games.find({endedAt:null});

    games.forEach(function (game) {
      //check if interval is still running for that game
      if (run.indexOf(game._id) == -1) {
        run.push(game._id);



        //why doesn't this stay constant?
        var beat = new Date();

      //set turn to play new cells when ready
      var yin = Play.findOne({gameId: game._id, state: 0, team: 0}, {sort: {createdAt: 1}}, {$limit: 1});
      var yang = Play.findOne({gameId: game._id, state: 0, team: 1}, {sort: {createdAt: 1}}, {$limit: 1});


//Meteor.clearInterval(heartbeat); //for testing
      if (yin && yang) {
        //check timer.
        //when it reaches 5000, play both cells
            if (game.timer >= 5000) {
              //trigger resets the timer on play

              //check to see if a cell has been played
              //then add cell to move queue
              var yinCell = Cells.findOne({gameId: game._id, playerId: yin.playerId, bornAt: {$exists: false}});


              if (! yinCell) {
                  //Get new spot
                  //Later check for max freedoms..

                  var yinL = getLocation(game._id, game.fieldSize);
                  var yinCellId = newCell(yin.playerId, game._id, yinL.x, yinL.y, 0);

                  move(game._id, yinCellId, yinL.x, yinL.y, 0, 0);
             } else {
                move(game._id, yinCell._id, yinCell.location.x, yinCell.location.y, 0, 0);
              };


              var yangCell = Cells.findOne({gameId: game._id, playerId: yang.playerId, bornAt: {$exists: false}});

              if (! yangCell) {
                  var yangL = getLocation(game._id, game.fieldSize);
                  var yangCellId = newCell(yang.playerId, game._id, yangL.x, yangL.y, 1);

                  move(game._id, yangCellId, yangL.x, yangL.y, 0, 1);
              } else {
                move(game._id, yangCell._id, yangCell.location.x, yangCell.location.y, 0, 1);
              };


              Meteor.defer(function() {
                readMessage(game._id, yin.playerId, "timer");
                readMessage(game._id, yang.playerId, "timer");
              });

              //reset timer
              //duplicated in triggers, but not fast enough?
              Games.update({_id:game._id}, {$set: {timer: 0}});


            } else {

                  //start timer
                  if (game.timer == 0) {

                    setMessage(game._id, yin.playerId, "timer", yin.team);
                    setMessage(game._id, yang.playerId, "timer", yang.team);
                  };

                  Games.update({_id:game._id}, {$inc: {timer: interval}});
            };
/* Added to trigger
        } else if (yin) {

      //set message to "wait for opponent"
          //unless there is only 1 player
        //  var yinPlayers = Play.find({gameId: game._id, state: 0, team: 0}, {sort: {createdAt: 1}}).count();
          var yinSpirit = Messages.find({gameId: game._id, playerId: yin.playerId, template: "newSpirit", read: false}).count();
          if (yinSpirit == 0) {
            //readMessage(yin.playerId, "newSpirit");
            setMessage(gameId: game._id, yin.playerId, "waiting", yin.team);
          };

        } else if (yang) {
          //set message to "wait for opponent"
        //  var yangPlayers = Play.find({gameId: game._id, state: 0, team: 0}, {sort: {createdAt: 1}}).count();
          var yangSpirit = Messages.find({gameId: game._id, playerId: yang.playerId, template: "newSpirit", read: false}).count();
          if (yangSpirit == 0) {

            //readMessage(yang.playerId, "newSpirit");
            setMessage(gameId: game._id, yang.playerId, "waiting", yang.team);
          };
  */
        };


      //get moves
      var moves = Moves.find({gameId:game._id, renderedAt: null}, {sort: {createdAt: -1}});

      var movedCells = [];
      //Loop through moves (and new cells, added to moves)
      //Check field for freedom. (what if piece moves after? for now, bump it)
      //update field both new space and old space.
      moves.forEach(function(move) {
        //make sure cell has not already been moved. Not working?


        if(movedCells.indexOf(move.cellId) == -1) {
          //check if location is taken
          var field = Field.findOne({gameId: move.gameId, location: move.location, space: {$ne: -1}});
          var offField = Field.findOne({gameId: move.gameId, location: move.location});
          var location = move.location;
          var space = move.team;



          //if taken or offField
          if (field || ! offField) {
            //check if move or new cell
            if (move.direction == 0) {
              //newcell location take. Throw to new.
              //Later check for max freedoms
              location = getLocation(move.gameId, game.fieldSize);

            } else {
              //Move location taken. Bump it back to previous.
              var cell = Cells.findOne({_id: move.cellId});
              location = cell.location;
              //space = space + .6;
            };

          } else {

            if (move.direction != 0){

              var cell = Cells.findOne({_id: move.cellId});
              oldLocation = cell.location;



               //Update old field for moved cells
               Field.update({
                 gameId: move.gameId,
                 location: oldLocation
                   }, {$set: {
                     cellId: null,
                     space: -1,
                     //reset freedoms?
                     freedoms: 3,
                     direction: null
               }});
            };
          };

          var freedoms = getFreedoms(move.gameId, location);

          //update new field
          Field.update({
            gameId: move.gameId,
            location: location
              }, {$set: {
                cellId: move.cellId,
                space: space,
                freedoms: freedoms,
                direction: move.direction

          }});




          //update moves as rendered, and if location, changed, update for preservation
          //Outside defer so that move doesn't get picked up on next interval

        Moves.update({_id: move._id}, {$set: {renderedAt: beat, location: location}});

        //remove multiple moves made within interval
        Moves.remove({cellId: move.cellId, renderedAt: null});

        movedCells.push(move.cellId);


        Meteor.defer(function() {
          //if direction = 0 (newcell), update cell born date (and location, just in case)
            if (move.direction == 0) {
              Cells.update({_id: move.cellId},{$set: {bornAt: beat, location: location}});
              //update player state
                //get playerId from cells
                var player = Cells.findOne({_id: move.cellId});
                var playerId = player.playerId;

                Play.update({playerId: playerId, gameId: move.gameId}, {$set: {state: 1}, $inc: {cells: 1}});

            } else {
              //update location
              Cells.update({_id: move.cellId},{$set: {location: location, movedAt: beat}});
            };
        });
      };
      });

      //put after devour algorhithm so that no cells are devoured in process.?
      //though is better for play to happen first.
      //instead, try removing from defer, and adding a var to wait for finish before running devour
        //    Meteor.defer(function () {
                  //check cells in field and grow field size if conditions
                  //get updated game
                  var growing = false;
                  var gameNew = Games.findOne({_id: game._id});
                  if (gameNew) {
                      var allCells = gameNew.devouredCells.yin + gameNew.devouredCells.yang + gameNew.cells.yin + gameNew.cells.yang;
                    //  var fieldLimit = gameNew.fieldSize - 1.6; // experiment with this #
                    //  fieldLimit = fieldLimit * fieldLimit;
                        var fieldLimit = ((gameNew.fieldSize * gameNew.fieldSize) / 2) - 1; //try 50%
                      if (allCells >= fieldLimit) {
                        //grow by 2 (from center)
                        growing = true;
                        //message all players
                        var players = Play.find({gameId: gameNew._id});
                        players.forEach(function(player){
                          setMessage(gameNew._id, player.playerId, "growing", player.team);
                          });

                        //grow field
                        Games.update({_id: gameNew._id}, {$inc: {fieldSize: 2}});
                        growing = growField(gameNew._id, (gameNew.fieldSize + 2)); //set to false when finished

                        //set messages to read
                        var read = Meteor.setTimeout(function (){
                          players.forEach(function(player){
                            readMessage(gameNew._id, player.playerId, "growing");
                            });
                          }, 1800);
                      }
                  };
          //  });

      //run devour algorhithm
      //make sure field isn't still growing
    if (! growing) {
      freed = [];

      //check adjacent spaces in field for freedoms
      var noFreedoms = Field.find({gameId: game._id, space: {$ne: -1}, freedoms: 0});
      var devourCells = noFreedoms;

      noFreedoms.forEach( function(space) {
        //v2
        if (freed.indexOf(space._id) == -1) {
          this.unblock;
          var up = {x:space.location.x,y:space.location.y+1};
          var right = {x:space.location.x+1,y:space.location.y};
          var down = {x:space.location.x,y:space.location.y-1};
          var left = {x:space.location.x-1,y:space.location.y};
          var team = space.space;

            //check for adjacent teammates to set free
          var free = Field.find({ gameId: space.gameId, freedoms: {$gt: 0}, space: team, location: {$in: [up, right, down, left]}}).count();

          if (free != 0) {
              setFree(space);
          };

        };


      });

  //  var devourCells = Field.find({gameId: game._id, space: {$ne: -1}, freedoms: -1});

      devourCells.forEach(function (space) {
        this.unblock;
        if (freed.indexOf(space._id) == -1) {
          devourCell(space.gameId, space._id, space.cellId, beat);
      //for testing devour
      //  Field.update({_id: space._id}, {$set: {devour: 1}});
        };
      });

    };


      //run endgame conditions
      Meteor.defer(function () {
        //get updated game
        var g = Games.findOne({_id: game._id});

        var d1 = new Date(g.updatedAt);

        //if 0 players, end the game after 3 minutes of no play
        if ((g.players.yin == 0 && g.players.yang == 0) &&
    //    (g.cells.yin > 0 || g.cells.yang > 0) &&
        (beat - d1 > 180000)) {
            Games.update({_id: g._id}, {$set: {endedAt: beat}});
        };


        //if devoured all cells played
        if ((g.devouredCells.yin > 0 && g.cells.yin == 0) ||

        //if team has 80% of cells in play
        (g.cells.yang / 4 > g.cells.yin && g.cells.yin > 1) ||

        //if team has 90% of players
        (g.players.yang / 9 > g.players.yin && g.players.yin > 0) ) {

          //if met, yang wins...
          endGame(game._id, 1);
        };


        if ((g.devouredCells.yang > 0 && g.cells.yang == 0) ||

        //if team has 80% of cells in play
        (g.cells.yin / 4 > g.cells.yang && g.cells.yang > 1) ||

        //if team has 90% of players
        (g.players.yin / 9 > g.players.yang && g.players.yang > 0) ) {
          //if met, yin wins...
          endGame(game._id, 0);
        };

        });



                //queue finished for that game, remove from run.
                var r = run.indexOf(game._id);
                run.splice(r,1);
        };


      }); //close games loop




//Meteor.clearInterval(heartbeat);


}, interval);

setFree = function (space) {
  if (freed.indexOf(space._id) == -1) {

    var up = {x:space.location.x,y:space.location.y+1};
    var right = {x:space.location.x+1,y:space.location.y};
    var down = {x:space.location.x,y:space.location.y-1};
    var left = {x:space.location.x-1,y:space.location.y};
    var team = space.space;


    freed.push(space._id);
    var trapped = Field.find({gameId: space.gameId, freedoms: 0, space: team, location: {$in: [up, right, down, left]}});
    trapped.forEach(function (space){
        setFree(space);

        //for testing devour
      //  Field.update({_id: space._id}, {$set: {devour: null}});

    });
  };
};




getFreedoms = function (gameId, location) {
  var up = {x:location.x,y:location.y+1};
  var right = {x:location.x+1,y:location.y};
  var down = {x:location.x,y:location.y-1};
  var left = {x:location.x-1,y:location.y};

  //  var freedom = Field.find({space: {$in: [-1, team]}, location: {$in: [up, right, down, left]}});

  //check each cells freedoms.
//    var freedom = Field.find({gameId: game._id, location: {$in: [up, right, down, left]}}, {$or: [{space: -1}, {freedoms: {$gte: 0}, space: team}]});
  var freedoms = Field.find({gameId: gameId, space: -1, location: {$in: [up, right, down, left]}}).count();
  return freedoms;
};
