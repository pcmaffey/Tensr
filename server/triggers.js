//Update collections as data gets updated.

//watch play and update games {players, spirits, cells, activeCells}
Play.after.insert(function (userId, doc) {
//a new player added to game

  if (doc.team == 0) {
    Games.update({_id: doc.gameId}, {$inc: {'players.yin': 1, 'spirits.yin': 1}});
  } else if (doc.team == 1) {
    Games.update({_id: doc.gameId}, {$inc: {'players.yang': 1, 'spirits.yang': 1}});
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
    } else if (doc.state == 0) {
      //becomes a spirit
      players = 0;
      spirits = 1;
      cells = 0;
      activeCells = -1;
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



    if (doc.team == 0) {
      if (timer == 0) {
        Games.update({_id: doc.gameId}, {$set: {timer: timer}, $inc: {'players.yin': players, 'spirits.yin': spirits, 'cells.yin': cells, 'activeCells.yin': activeCells}});
      } else {
        Games.update({_id: doc.gameId}, {$inc: {'players.yin': players, 'spirits.yin': spirits, 'cells.yin': cells, 'activeCells.yin': activeCells}});
      };
    } else if (doc.team == 1) {
      if (timer == 0) {
        Games.update({_id: doc.gameId}, {$set: {timer: timer}, $inc: {'players.yang': players, 'spirits.yang': spirits, 'cells.yang': cells, 'activeCells.yang': activeCells}});
      } else {
        Games.update({_id: doc.gameId}, {$inc: {'players.yang': players, 'spirits.yang': spirits, 'cells.yang': cells, 'activeCells.yang': activeCells}});
      };
    };
  };
});

//watch players presence, and if logged out, or connection ends, run quit()
//https://github.com/dburles/meteor-presence/ ?
