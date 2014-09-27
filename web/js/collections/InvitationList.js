/* -----------------------------------------------------------------------------------------------
 * Invitation List Collection
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
           Invitation,              // Application modules
           undefined
         ) {

  exports.InvitationList = Backbone.Collection.extend({

    model: Invitation,

    initialize: function(models, options) {
      if (!options.dispatcher) {
        log.error('InvitationList: initialize() cannot be called without a dispatcher');
        return;
      }
      this.dispatcher = options.dispatcher;
      this.dispatcher.once('presenceSessionReady', this.presenceSessionReady, this);
      this.dispatcher.on('inviteRemoteUser', this.inviteRemoteUser, this);
    },

    inviteRemoteUser: function(remoteUser) {
      // TODO: add a new outgoing invite to the collection
      // TODO: grab a reference to the local user and make it the inviter
      // do i really ever need a reference to the local user? its not part of what has to be
      // rendered, can it just remain null?
      log.info('InvitationList: inviteRemoteUser');
      // TODO: save the invitation (so that it gets a sessionId), when done:
      this.sendInvitation(invitation);
    },

    sendInvitation: function(invitation) {
      // TODO: send invitation using signal
      // TODO: let dispatcher know that an outgoing invitation has been sent (so that local user
      // status can be updated)
    },

    receiveInvitation: function(event) {
      // TODO: instantiate Invitation and add it to self
      // TODO: query local user and do not add it to self if self is unavailable
      // if unavailable, decline it
    },

    cancelInvitation: function(index) {
      // TODO: send invitation cancellation using signal
      // TODO: let dispatcher know that an outgoing invitation has been cancelled (so that local
      // user status can be updated)
    },

    receiveCancellation: function(event) {
      // TODO: find the invitation to be cancelled and remove it
      // if its not there, show some sort of warning, it might have been declined just before
      // TODO: how does a chat get cleaned up once the invitation has been declined?
      // chats can be instantiated by a ChatView who listens for events using the dispatcher
    },

    acceptInvitation: function(index) {
      // TODO: find the invitation to be accepted, if its not there warn, it might have been cancelled
      // TODO: send invitation acceptance using signal
      // TODO: let dispatcher know that an incoming invitation has been accepted
      // *  local user status should be updated
      // *  chat view should create a chat based on this invitation
      // TODO: decline all other incoming invitations
    },

    receiveAcceptance: function(event) {
      // TODO: find the invitation to accept
      // TODO: let the dispatcher know that an outgoing invitation has been accepted
      // *  local user status should be updated
      // *  chat view should create a chat based on this invitation
    },

    declineInvitation: function(index) {
      // TODO: find the invitation to be declined, if its not there warn, it might have been cancelled
      // TODO: send invitation declination using signal
      // TODO: remove the declined invitation from self
    },

    receiveDeclination: function(event) {
      // TODO: find the invitation to decline, and remove it. the collection should now be empty
      // TODO: let the dispatcher know that an outgoing invitation has been declined
      // *  local user status should be updated
    },

    presenceSessionReady: function(presenceSession) {
      this.presenceSession = presenceSession;

      this.presenceSession.on('signal:invitation', this.receiveInvitation, this);
      this.presenceSession.on('signal:cancelInvitation', this.receiveCancellation, this);
      this.presenceSession.on('signal:acceptInvitation', this.receiveAcceptance, this);
      this.presenceSession.on('signal:declineInvitation', this.receiveDeclination, this);
    }

  });

}(window, Backbone, _, log, Invitation));
