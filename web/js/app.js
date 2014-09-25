/* -----------------------------------------------------------------------------------------------
 * BuddyTok Application
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports, doc,            // Environment
           $, OT, log,              // External libraries
           ConnectModalView,        // Application modules
           UserInfoView,
           BuddyListView,
           otConfig,                // Server config
           undefined                // Misc
         ) {

  // Application singleton references

  exports.me = null;
    // should contain: chat, invitations
    //    chat should contain: inviter, invitee, session, publisher, subscriber
    //    invitations should be a collection of chats

  exports.buddyList = null;
    // should be a collection or users (without their chats or invitations)

  var presenceSession = exports.presenceSession = OT.initSession(otConfig.apiKey, otConfig.presenceSessionId);

  var init = function() {
    var connectModalView = new ConnectModalView({
      el: '#connect-modal',
      presenceSession: presenceSession
    });
    connectModalView.show();
    connectModalView.on('userConnected', userConnected);

    var buddyListView = new BuddyListView({
      el: '#user-list',
      presenceSession: presenceSession
    });
    buddyListView.render();
  };

  var userConnected = function(user) {
    exports.me = user;
    var userInfoView = new UserInfoView({
      el: '#user-info',
      model: user
    });
  };

  $(doc).ready(init);

}(window, window.document, jQuery, OT, log, ConnectModalView, UserInfoView, BuddyListView, opentokConfig));
