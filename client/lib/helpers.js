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

        //set controls position
        $('.controls').css({
          'bottom': '2rem',
          'right': (y + 1.5) + 'rem'
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

        //set controls position
        $('.controls').css({
          'right': '1rem',
          'bottom': (y + 2.5) + 'rem'
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






      //var m = 9; //size mulitplier default: (9)
      var m = 100 / (2.3 * field); // was using 1.8
      //limit on size
      if (m < .9) {m = .9;}

      if (! Session.get("m")) {
        Session.set("m", m);
      };

      //check if zoom by seeing if difference is whole
      var modulus = Math.abs(Math.round(Session.get("m")*100)/100 - Math.round(m * 100) / 100) % 1;

      //check if zoomed
      if (modulus == 0) {
        m = Session.get("m");
      } else {
        Session.set("m", m);


      };


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

        //is this even working?
      //center the field within the fieldBox, using velocity.js to scroll the div (only applies to when not playing)
      //if playing, scroll to center .me

  if(top == 0) {
    var y = (fieldBoxH * rem / 2) - ((m * rem) / 2);
    $(".me").velocity("scroll", {duration: 0, axis: "y", offset: -y, container: $('.fieldBox') });
  }
  if(left == 0) {
    var x = (fieldBoxW * rem / 2) - ((m * rem) / 2);
    $(".me").velocity("scroll", {duration: 0, axis: "x", offset: -x, container: $('.fieldBox') });
  }


};

centerMe = function() {
//doesn't work
  var me = $(".me").outerWidth();
  var x = $(".me").offset().left;
  var y = $(".me").offset().top;
  var width = $(".field").width();
  var height = $(".field").height();
  var fieldBoxW= $(".fieldBox").width();
  var fieldBoxH = $(".fieldBox").height();
  var infoW = $(".info").width();
  var infoH = $(".info").height();
  var fieldL = $(".field").offset().left;
  var p = $(".me").position();

//console.log(p.left  + me/2);





//this only sortof works

  x = (width/2) - x + (me/2);
  y = (height/2) - y + (me/2);

//$(".field").offset({left: x});


    $(".me").velocity("scroll", {duration: 0, axis: "x", offset: -x, container: $('.fieldBox') });
    $(".me").velocity("scroll", {duration: 0, axis: "y", offset: -y, container: $('.fieldBox') });

};



move = function (dir) {

  //make sure there's a move and an active cell
  if (! dir || Session.get("state") != 1) {return false;}

  var cell = $('#' + Session.get("activeCellId")).parent();

//  var x = 0;
//  var y = 0;
  var x = cell.data("x");
  var y = cell.data("y");

  //check edges, calc move
  if (dir == 4) { //left
    if (cell.hasClass("bLeft") || cell.hasClass("bTopLeft") || cell.hasClass("bBottomLeft")) {
      bump();
      return false;
    };

    x = -1 + x;
    var adj = $("[data-x='" + x + "'][data-y='" + y + "']");
    if (adj.children().hasClass("cell")) {
      bump();
      return false;
    };

  } else if (dir == 1) { //up
    if (cell.hasClass("bTop") || cell.hasClass("bTopLeft") || cell.hasClass("bTopRight")) {
      bump();
      return false;
    };

    y = 1 + y;
    var adj = $("[data-x='" + x + "'][data-y='" + y + "']");

    if (adj.children().hasClass("cell")) {
      bump();
      return false;
    };

  } else if (dir == 2) { //right
    if (cell.hasClass("bRight") || cell.hasClass("bTopRight") || cell.hasClass("bBottomRight")) {
      bump();
      return false;
    };

    x = 1 + x;
    var adj = $("[data-x='" + x + "'][data-y='" + y + "']");
    if (adj.children().hasClass("cell")) {
      bump();
      return false;
    };

  } else if (dir == 3) { //down
    if (cell.hasClass("bBottom") || cell.hasClass("bBottomLeft") || cell.hasClass("bBottomRight")) {
      bump();
      return false;
    };
    y = -1 + y;
    var adj = $("[data-x='" + x + "'][data-y='" + y + "']");
    if (adj.children().hasClass("cell")) {
      bump();
      return false;
    };

  };

   Meteor.call("move", FlowRouter.getParam("_id"), Session.get("activeCellId"), x, y, dir, Session.get("team"));
};

//ran into something?
bump = function () {
  $(".fieldBox").addClass("bump");
  Meteor.setTimeout(function(){
     $(".fieldBox").removeClass("bump");
  }, 800);
  return false;
};


aniMoveCell = function (cellId, dir) {
  //apply to cells as they move
  //turend off because zoom gets positions messed up
    cellId = '#' + cellId;
    var x; var y;
    var space = parseFloat($('.space').outerWidth());


    if (dir == 1) {
      x = 0;
      y = -space;
    } else if (dir == 2) {
      x = space;
      y = 0;
    } else if (dir == 3) {
      x = 0;
      y = space;
    } else if (dir == 4) {
      x = -space;
      y = 0;
    };

      //Set offset for original location, to move to current.
      //If render offset location without js, remove this and negative values from translate.
    $(cellId).css({
      'top': y,
      'left': x
      });

    $(cellId).velocity({
      translateZ: 0, //trigger hardware acceleration
      translateX: -x,
      translateY: -y,
      duration: 500
      });
  };


  zoom = function (m) {
    m = Session.get("m") + m;

    if (m < .9) {
      m = .9;
    } else if (m > 9) {
      m = 9;
    }
    Session.set("m", m);

  };
