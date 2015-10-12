//Client side helper functions

//Adjust view on window.resize
$(window).resize(function() {
  view();
});




//view() sets window size and orientation.
//run on template.body.onRendered and window.resize
//Needs to be reactive, for when field expands
//center window on center of .field if not playing,
//otherwise, center on .me
view = function() {

    var h = $(window).height();
    var w = $(window).width();
    var rem = parseFloat($('html').css('font-size'));
    var y = 5; //width of .info
    var fieldBoxW; var fieldBoxH;
    var field;

    //set team scoreboards' orientation
    if ((y*rem*2) + w > h && w > h) {

      $('.yin').height('100vh').width(y+'rem').css({
        'float': 'left',
        });
      $('.yang').height('100vh').width(y+'rem').css({
        'float': 'right',
        'top': 0,
        'bottom': 'auto',
        'right': 0
        });

        //set fieldSize based on orientation
        fieldBoxW = w - (y*rem*2);
        fieldBoxH = h;

        //position
        top = 0;
        left = y;

        //adjust score width
        var sW = $('.yang .inner').outerWidth();
        if (sW/rem > y) {
          $('.yang .inner').css({'left':-(((sW/rem - y) - .5)*rem)});
        }
        sW = $('.yin .inner').outerWidth();
        if (sW/rem > y) {
          $('.yin .inner').css({'left':-(.5*rem)});
        }

    } else {
      $('.yin').width('100vw').height(y+'rem').css({
        'float': 'none',
        });
      $('.yang').width('100vw').height(y+'rem').css({
        'float': 'none',
        'bottom': 0,
        'top': 'auto',
        'right': 'auto',
        });
        //set fieldSize based on orientation
        fieldBoxH = h - (y*rem*2);
        fieldBoxW = w;

        //position
        top = y;
        left = 0;
    };




    fieldBoxW = fieldBoxW / rem;
    fieldBoxH = fieldBoxH / rem;

  //set fieldBox size as leftover space. It is a scrollable div set to overflow: scroll.
    $('.fieldBox').height(fieldBoxH+'rem').width(fieldBoxW+'rem').css({
      'top': top+'rem',
      'left': left+'rem'
      });

      //get the field dimensions. "field" comes from Game collection.
      field = Session.get('fieldSize');






      var m = 9; //size mulitplier default: (9)

      //set vars to center it
      var top = '50%';
      var left = '50%';
      var marginLeft =  -(field*m/2) +'rem';
      var marginTop = -(field*m/2) +'rem';
      //mobile sizing using heavy drop in rem in media queries...

      //if field is larger than fieldBox, center differently
      if (field*m > fieldBoxW) {
        left = 0;
        marginLeft = 0;
      };
      if (field*m > fieldBoxH) {
        top = 0;
        marginTop = 0;
      };

      //apply styles
      $('.field').height(field*m+'rem').width(field*m+'rem').css({
        //set rem -> em scale
        'font-size': m/10 + 'rem',
        //center field within fieldBox
        'top': top,
        'left': left,
        'margin-left': marginLeft,
        'margin-top': marginTop
        });


      //center the field within the fieldBox, using velocity.js to scroll the div (only applies to when not playing)
      //if playing, scroll to center .me
  if(top == 0) {
    var y = (fieldBoxH * rem / 2) - ((m * rem) / 2);
    $('.bCenter').velocity("scroll", {duration: 0, axis: "y", offset: -y, container: $('.fieldBox') });
  }
  if(left == 0) {
    var x = (fieldBoxW * rem / 2) - ((m * rem) / 2);
    $('.bCenter').velocity("scroll", {duration: 0, axis: "x", offset: -x, container: $('.fieldBox') });
  }


};

move = function (dir) {

  var cell = $('#' + Session.get("activeCellId")).parent();

  var x = 0;
  var y = 0;
  //check edges, calc move
  if (dir == 4) { //left
    if (cell.hasClass("bLeft") || cell.hasClass("bTopLeft") || cell.hasClass("bBottomLeft")) {
      bump();
      return false;
    };
    x = -1;
  } else if (dir == 1) { //up
    if (cell.hasClass("bTop") || cell.hasClass("bTopLeft") || cell.hasClass("bTopRight")) {
      bump();
      return false;
    };
    y = 1;
  } else if (dir == 2) { //right
    if (cell.hasClass("bRight") || cell.hasClass("bTopRight") || cell.hasClass("bBottomRight")) {
      bump();
      return false;
    };
    x = 1;
  } else if (dir == 3) { //down
    if (cell.hasClass("bBottom") || cell.hasClass("bBottomLeft") || cell.hasClass("bBottomRight")) {
      bump();
      return false;
    };
    y = -1;
  };

    x = x + cell.data("x");
    y = y + cell.data("y");

//check if cell is taken on client? and bump?


   Meteor.call("move", Session.get("gameId"), Session.get("activeCellId"), x, y, dir, Session.get("team"));
};

//ran into something?
bump = function () {
  $(".fieldBox").addClass("bump");
  Meteor.setTimeout(function(){
     $(".fieldBox").removeClass("bump");
  }, 800);
  return false;
};
