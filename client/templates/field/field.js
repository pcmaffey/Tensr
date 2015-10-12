Template.field.onCreated( function () {
  //subscribe to field
  var self = this;
  self.autorun(function () {
  self.subscribe("field", Session.get("gameId"));
  self.subscribe("cells", Session.get("gameId"));
  });
  });

  Template.field.onRendered( function() {
    $(window).on('keydown', function(e){
      //Get arrow keys and run move() in that direction
      //If SPACEBAR, run drop()
      //Meteor keydown event doesn't work... needs jquery listener
       e.preventDefault();
       var dir;
        if (e.which == 37) { //left
          dir = 4;
        } else if (e.which == 38) { //up
          dir = 1;
        } else if (e.which == 39) { //right
          dir = 2;
        } else if (e.which == 40) { //down
          dir = 3;
        } else if (e.which == 32) {
          //spacebar = drop cell
        } else {
          return false;
        };
        move(dir);
    });

  });



Template.field.helpers({
  spaces: function () {
      return Field.find({}, {sort: {order: 1}});

  },

  bump: function (dir) {
    //blur field if player moves into occupied cell
  }
});

Template.space.helpers({
  //if its the player's turn to place their cell
  selectCell: function () {
    if (this.space == -1) {
      return Session.get("selectCell");
    } else {
      return false;
    };
  },

  isMe: function () {
    //check if cell is active player
    if (this.cellId) {
      if (Cells.findOne({_id: this.cellId})) {
        //set cellId of active cell
        Session.set("activeCellId", this.cellId);

          //check if bumped, is there a better way?
          var decimal = this.space - Math.floor(this.space);
          if (decimal > .5 && decimal < .7) {
            bump();
          };

        return "<div class='nucleus'></div>";
      };
    } else {
      return false;
    };
  },

  isCell: function() {
    //check if space contains cell
    if (this.space > -1) {
      return true;
    } else {
      return false;
    };
  },

  teamName: function () {
    if (Math.floor(this.space) == 0) {
      return "yin";
    } else if (Math.floor(this.space) == 1) {
      return "yang";
    };
  },

  me: function () {
    //needed for click map
    if (Session.get("activeCellId") == this.cellId) {
      return "me";
    };
  }
});

Template.space.events({
  "click .selectCell": function (e) {
    e.preventDefault();
    //I was sending fieldId, but didn't see how using it...?
    Meteor.call("newCell", this.gameId, this.location.x, this.location.y, Session.get("team"));

    Session.set("selectCell", false);
  },

  "click .space": function (event) {
    //Click map that determines which direction to move cell based on relation to player's active cell
    //Unless they click on their cell
    //Run move()

    if (Session.get("state") == 1) { //make sure they're playing
    if (! $(event.target).parent().hasClass("me") && ! $(event.target).hasClass("nucleus")) {
      var dir;
      var me = $('.me').offset();
      var size = $('.me').width();
      var x = event.pageX - (me.left + size/2) ;
      var y = (me.top + size/2) - event.pageY;

      //Check which axis to move based on distance.
      if (Math.abs(x) > Math.abs(y)) {
        //left or right?
        if (x > 0) {dir = 2;}
        else {dir = 4;}
      } else {
        //up or down?
        if (y > 0) {dir = 1;}
        else {dir = 3;}
      };
      move(dir);
    } else {
      // open drop cell dialog
      Meteor.call("setMessage", "drop", Session.get("team"));


    };
  };

  }
  });
