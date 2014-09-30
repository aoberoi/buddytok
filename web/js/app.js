/* -----------------------------------------------------------------------------------------------
 * BuddyTok Application
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports, doc,            // Environment
           $, OT, log,              // External libraries
           LocalUser,               // Application modules
           BuddyList,
           InvitationList,
           UserInfoView,
           ConnectModalView,
           BuddyListView,
           InvitationListView,
           ChatView,
           undefined
         ) {

  var App = exports.App = {

    // Models
    presenceSession: null,
    me: null,
    buddyList: null,
    invitationList: null,

    // Views
    userInfoView: null,
    connectModalView: null,
    buddyListView: null,
    invitationListView: null,
    chatView: null,

    initialize: function() {
      // Presence session initialization
      App.once('presenceSessionReady', App.presenceSessionReady, this);
      App.retrievePresenceConfig();

      // Model initialization
      App.me = new LocalUser({}, { dispatcher: App });
      App.buddyList = new BuddyList([], { dispatcher: App });
      App.invitationList = new InvitationList([], { dispatcher: App });

      // View initialization
      App.connectModalView = new ConnectModalView({
        model: App.me,
        el: $('#connect-modal'),
        dispatcher: App
      });
      App.userInfoView = new UserInfoView({ model: App.me });
      App.buddyListView = new BuddyListView({
        collection: App.buddyList,
        dispatcher: App
      });
      App.invitationListView = new InvitationListView({ collection: App.invitationList });
      App.chatView = new ChatView({
        dispatcher: App,
        localUser: App.me
      });
      $(doc).ready(App.domReady);
    },

    retrievePresenceConfig: function() {
      $.get('/presence')
        .done(function(presenceConfig) {
          log.info('App: presenceSessionReady');
          App.presenceSession = OT.initSession(presenceConfig.apiKey, presenceConfig.sessionId);
          App.trigger('presenceSessionReady', App.presenceSession);
        })
        .fail(function() {
          // TODO: error handling, maybe a retry
        });
    },

    domReady: function() {
      log.info('App: domReady');
      // NOTE: App.connectModalView is already in the DOM and does not need to be rendered
      App.connectModalView.show();
      App.userInfoView.render().$el.appendTo('.navbar-right');
      App.buddyListView.render().$el.appendTo('.sidebar-left');
      App.invitationListView.render().$el.appendTo('.row-top');
      App.chatView.render().$el.appendTo('.content-right');
    },

  };
  _.extend(App, Backbone.Events);
  App.initialize();

}(window, window.document, jQuery, OT, log, LocalUser, BuddyList, InvitationList, UserInfoView,
  ConnectModalView, BuddyListView, InvitationListView, ChatView));
