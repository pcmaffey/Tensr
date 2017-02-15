FlowRouter.route('/:_id', {
    name: 'game',
    action: function(params, queryParams) {
        Meteor.call("joinGame", params._id);
        BlazeLayout.render("tensr", {body: "game"});
    }
});


FlowRouter.route('/', {
    name: 'home',
    action: function(params, queryParams) {
      BlazeLayout.render("tensr", {body: "games"});

    }
});

FlowRouter.route('/like/tears/in/rain', {
    name: 'error',
    action: function(params, queryParams) {
      BlazeLayout.render("tensr", {body: "error"});

    }
});
