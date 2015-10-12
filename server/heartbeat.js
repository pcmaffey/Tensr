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

var interval = 300;

var heartbeat = Meteor.setInterval(function() {
    var game = Games.findOne({endedAt:null}, {_id:1});
    if (game) {
      var date = new Date();


      //set turn to play new cells when ready
      var yin = Play.findOne({gameId: game._id, state: 0, team: 0}, {sort: {createdAt: 1}}, {$limit: 1});
      var yang = Play.findOne({gameId: game._id, state: 0, team: 1}, {sort: {createdAt: 1}}, {$limit: 1});


//Meteor.clearInterval(heartbeat); for testing
      if (yin && yang) {
        //check timer.
        //when it reaches 3000, play both cells randomly
            if (game.timer >= 3000) {
              //trigger resets the timer on play

              //check to see if a cell has been played
              //then add cell to move queue
              var yinCell = Cells.findOne({gameId: game._id, playerId: yin.playerId, bornAt:null});
              console.log(yinCell);

              if (! yinCell) {
                  //Get random spot
                  //Later check for max freedoms...
                  var yinL = getRandomLocation(game._id, game.fieldSize);
                  var yinCellId = newCell(yin.playerId, game._id, yinL.x, yinL.y, 0);

                  move(game._id, yinCellId, yinL.x, yinL.y, 0, 0);
              } else {
                move(game._id, yinCell._id, yinCell.location.x, yinCell.location.y, 0, 0);
              };

              var yangCell = Cells.findOne({gameId: game._id, playerId: yang.playerId, bornAt:null});
                    console.log(yangCell);
              if (! yangCell) {
                  var yangL = getRandomLocation(game._id, game.fieldSize);
                  var yangCellId = newCell(yang.playerId, game._id, yangL.x, yangL.y, 1);

                  move(game._id, yangCellId, yangL.x, yangL.y, 0, 1);
              } else {
                move(game._id, yangCell._id, yangCell.location.x, yangCell.location.y, 0, 1);
              };


              Meteor.defer(function() {
                readMessage(yin.playerId, "timer");
                readMessage(yang.playerId, "timer");
              });


            } else {

                  //start timer
                  if (game.timer == 0) {

                    setMessage(yin.playerId, "timer", yin.team);
                    setMessage(yang.playerId, "timer", yang.team);
                  };

                  Games.update({_id:game._id}, {$inc: {timer: interval}});
            };
        } else if (yin) {
          //set message to "wait for opponent"
          //unless there is only 1 player
        //  var yinPlayers = Play.find({gameId: game._id, state: 0, team: 0}, {sort: {createdAt: 1}}).count();
          var yinSpirit = Messages.find({playerId: yin.playerId, template: "newSpirit", read: false}).count();
          if (yinSpirit == 0) {
            //readMessage(yin.playerId, "newSpirit");
            setMessage(yin.playerId, "waiting", yin.team);
          };

        } else if (yang) {
          //set message to "wait for opponent"
        //  var yangPlayers = Play.find({gameId: game._id, state: 0, team: 0}, {sort: {createdAt: 1}}).count();
          var yangSpirit = Messages.find({playerId: yang.playerId, template: "newSpirit", read: false}).count();
          if (yangSpirit == 0) {

            //readMessage(yang.playerId, "newSpirit");
            setMessage(yang.playerId, "waiting", yang.team);
          };
        };


      //get moves
      var moves = Moves.find({gameId:game._id, renderedAt: null}, {sort: {createdAt: -1}});

      var movedCells = [];
      //Loop through moves (and new cells, added to moves)
      //Check field for freedom. (what if piece moves after? for now, bump it)
      //update field both new space and old space.
      moves.forEach(function(move) {

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
              //newcell location take. Throw to random.
              //Later check for max freedoms
              location = getRandomLocation(move.gameId, game.fieldSize);

            } else {
              //Move location taken. Bump it back to previous.
              var cell = Cells.findOne({_id: move.cellId});
              location = cell.location;
              space = space + .6;
            };

          } else {
            //set UI hooks for moves.
            if (move.direction != 0){
              space = space + (move.direction/10);

              var cell = Cells.findOne({_id: move.cellId});
              oldLocation = cell.location;

               //Update old field
               Field.update({
                 gameId: move.gameId,
                 location: oldLocation
                   }, {$set: {
                     cellId: null,
                     space: -1
               }});
            };
          };

          //update new field
          Field.update({
            gameId: move.gameId,
            location: location
              }, {$set: {
                cellId: move.cellId,
                space: space
          }});




          //update moves as rendered, and if location, changed, update for preservation
          //Outside defer so that move doesn't get picked up on next interval

        Moves.update({_id: move._id}, {$set: {renderedAt: date, location: location}});

        //remove multiple moves made within interval
        Moves.remove({cellId: move.cellId, renderedAt: null});
        movedCells.push(move.cellId);


        Meteor.defer(function() {
          //if direction = 0 (newcell), update cell born date
            if (move.direction == 0) {
              Cells.update({_id: move.cellId},{$set: {bornAt: date}});
              //update player state
                //get playerId from cells
                var player = Cells.findOne({_id: move.cellId});
                var playerId = player.playerId;

                Play.update({playerId: playerId, gameId: move.gameId}, {$set: {state: 1}, $inc: {cells: 1}});

            } else {
              //update location
              Cells.update({_id: move.cellId},{$set: {location: location, movedAt: date}});
            };
        });
      };
      });

      //check cells in field and grow field size if conditions Meteor
      //get updated game
      var game = Games.findOne({_id: game._id});
      if (game) {
          var allCells = game.devouredCells.yin + game.devouredCells.yang + game.cells.yin + game.cells.yang;
          var fieldLimit = game.fieldSize - 1;
          fieldLimit = fieldLimit * fieldLimit;
          if (allCells >= fieldLimit) {
            //grow by 2 (from center)
            Games.update({_id: game._id}, {$inc: {fieldSize: 2}});
            growField(game._id, (game.fieldSize + 2));
          }
      };

      //run devour algorhithm
      //check adjacent spaces in field for freedoms
      var spaces = Field.find({gameId: game._id, space: {$ne: -1}});
      spaces.forEach(function(space) {

            var up = {x:space.location.x,y:space.location.y+1};
            var right = {x:space.location.x+1,y:space.location.y};
            var down = {x:space.location.x,y:space.location.y-1};
            var left = {x:space.location.x-1,y:space.location.y};
            var team = space.space;
        

            if (team >= 0 && team < 1) {
              team = 0;
            } else if (team >= 1){
              team = 1;
            };

            //check for freedoms or adjacent team cells
            var freedom = Field.find({space: {$in: [-1, team]}, location: {$in: [up, right, down, left]}});
            if (freedom.count() == 0) {
              //devour it
              Field.update({_id: space._id}, {$set: {space: -1}});
              Cells.update({_id: space.cellId},  {$set: {devouredAt: date}});
              var cellUp = Cells.findOne({_id: space.cellId});
              var playerId = cellUp.playerId;
              //if it was their active cell, update player state
              if (! cellUp.droppedAt) {
                Play.update({gameId: game._id, playerId: playerId}, {$set: {state: 0, stateUpdatedAt: date}});
              };
              if (team == 0) {
                Games.update({_id: game._id}, {$inc: {'devouredCells.yin': 1, 'cells.yin': -1}});
              } else if (team == 1) {
                  Games.update({_id: game._id}, {$inc: {'devouredCells.yang': 1, 'cells.yang': -1}});
              };
            };
          });





    };
}, interval);
