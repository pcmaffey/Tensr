Template.field.onCreated( function () {
  //subscribe to field
  var self = this;
  self.autorun(function () {
  self.subscribe("field", FlowRouter.getParam("_id"));
  self.subscribe("cells", FlowRouter.getParam("_id"));
  });
  });

  Template.field.onRendered( function() {
    $(window).on('keydown', function(e){
      //Get arrow keys and run move() in that direction
      //If SPACEBAR, run drop()
      //Meteor keydown event doesn't work... needs jquery listener
       e.preventDefault();
       if (Session.get("state") != 1) {return false;}

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
          Meteor.call("setMessage", FlowRouter.getParam("_id"), "drop", Session.get("team"));
        } else {
          return false;
        };
        move(dir);
    });
    return false;
  });



Template.field.helpers({
  spaces: function () {
      return Field.find({}, {sort: {order: 1}});

  }
});





Template.space.helpers({
  //if its the player's turn to place their cell
  selectCell: function () {
    if (this.space == -1) {
      if (Session.get("state") == 0) {
        return true;
      };
    };
      return false;
  },

  isMe: function () {
    //check if cell is active player
    if (this.cellId) {
      if (Cells.findOne({_id: this.cellId, bornAt: {$ne: null}})) {
        //set cellId of active cell
        Session.set("activeCellId", this.cellId);
      //  centerMe();

        return "<div class='nucleus'></div>";
      };
    } else {
      return false;
    };
  },

  selected: function () {
      var x = this.location.x;
      var y = this.location.y;

      if (Cells.findOne({bornAt: null, location: {x:x,y:y}})) {
        return "selected";
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
    if (this.space == 0) {
      return "yin";
    } else if (this.space == 1) {
      return "yang";
    };
  },

  me: function () {
    //needed for click map
    if (Session.get("activeCellId") && Session.get("activeCellId") == this.cellId) {
      return "me";
    } else {
      return false;
    };
  },

  aniMove: function () {

    if (this.direction == 0) {
      return "fadeIn";
    } else if (this.direction == 1) {
      return "fadeIn up";
    } else if (this.direction == 2) {
      return "fadeIn right";
    } else if (this.direction == 3) {
      return "fadeIn down";
    } else if (this.direction == 4) {
      return "fadeIn left";
    };

}

});

Template.space.events({
  "click .selectCell": function (e) {
    e.preventDefault();

      Meteor.call("newCell", this.gameId, this.location.x, this.location.y, Session.get("team"));

    return false;
  },

  "click .space": function (event) {
    //Click map that determines which direction to move cell based on relation to player's active cell
    //Unless they click on their cell
    //Run move()
    event.preventDefault();


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
      Meteor.call("setMessage", FlowRouter.getParam("_id"), "drop", Session.get("team"));


    };
  };

  return false;
  }
  });
