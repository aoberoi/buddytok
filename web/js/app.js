/* -----------------------------------------------------------------------------------------------
 * BuddyTok Application
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports, doc,            // Environment
           $, OT, log,              // External libraries
           ConnectModalView,        // Application modules
           otConfig,                // Server config
           undefined                // Misc
         ) {

  // Application singleton references

  exports.me = null;
    // should be a user: name, status, connected, token
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
  };

  // DOM ready
  $(doc).ready(init);

}(window, window.document, jQuery, OT, log, ConnectModalView, opentokConfig));
