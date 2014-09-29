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
      // TODO: save the invitation (so that it gets a sessionId), when done sendInvitation
      var self = this;
      log.info('InvitationList: inviteRemoteUser');
      var outgoingInvitation = new Invitation({
        incoming: false,
        invitee: remoteUser
      });
      outgoingInvitation.save({}, {
        success: function() {
          self.add(outgoingInvitation);
          self.sendInvitation(outgoingInvitation);
        },
        error: function() {
          // TODO: error handling
        }
      });
    },

    sendInvitation: function(invitation) {
      // TODO: send invitation using signal
      // TODO: let dispatcher know that an outgoing invitation has been sent (so that local user
      // status can be updated)
      var self = this;
      var signal = {
        type: 'invitation',
        to: invitation.get('invitee').connection,
        data: invitation.toSignal()
      };
      this.presenceSession.signal(signal, function(err) {
        if (err) {
          // TODO: error handling
          log.error('InvitationList: sendInvitation failed', err);
          self.remove(invitation);
          return;
        }
        log.info('InvitationList: invitation sent');
        self.dispatcher.trigger('invitationSent', invitation);
        // TODO: decline any incoming invitations
      });
    },

    receiveInvitation: function(event) {
      // TODO: instantiate Invitation and add it to self
      // TODO: query local user and do not add it to self if self is unavailable
      // if unavailable, decline it
      var self = this;
      log.info('InvitationList: invitation received');
      this.dispatcher.once('userAvailability', function(available) {
        log.info('InvitationList: user availability', available);
        if (available) {
          self.dispatcher.once('remoteUser~'+event.from.connectionId, function(remoteUser) {
            log.info('InvitationList: remote user', remoteUser);
            var incomingInvitation = new Invitation({
              incoming: true,
              inviter: remoteUser
            });
            incomingInvitation.fromSignal(event.data);
            self.add(incomingInvitation);
          });
          self.dispatcher.trigger('getRemoteUser', event.from);
        } else {
          self.declineInvitation(event.from);
        }
      });
      this.dispatcher.trigger('getUserAvailability');
    },

    cancelInvitation: function(index) {
      // TODO: send invitation cancellation using signal
      // TODO: let dispatcher know that an outgoing invitation has been cancelled (so that local
      // user status can be updated)
      var self = this;
      var invitation = this.at(index);
      // TODO: is there ever a situation where the invitation wouldn't be found?
      var signal = {
        type: 'cancelInvitation',
        to: invitation.get('invitee').connection,
        data: invitation.toSignal()
      };
      this.presenceSession.signal(signal, function(err) {
        if (err) {
          // TODO: error handling
          log.error('InvitationList: cancelInvitation failed', err);
          return;
        }
        self.remove(invitation);
        self.dispatcher.trigger('invitationCancelled', invitation);
      });
    },

    receiveCancellation: function(event) {
      // TODO: find the invitation to be cancelled and remove it
      // if its not there, show some sort of warning, it might have been declined just before
      // TODO: how does a chat get cleaned up once the invitation has been declined?
      // chats can be instantiated by a ChatView who listens for events using the dispatcher
      var invitation = this.find(function(invitation) {
        return invitation.get('incoming')  &&
               invitation.get('inviter').connection.connectionId === event.from.connectionId &&
               event.data === invitation.toSignal();
      });
      if (!invitation) {
        log.warn('InvitationList: receiveCancellation could not find an invitation to cancel');
        return;
      }
      this.remove(invitation);
    },

    acceptInvitation: function(index) {
      // TODO: find the invitation to be accepted, if its not there warn, it might have been cancelled
      // TODO: send invitation acceptance using signal
      // TODO: let dispatcher know that an incoming invitation has been accepted
      // *  local user status should be updated
      // *  chat view should create a chat based on this invitation
      // TODO: decline all other incoming invitations, shouldn't be any outgoing since local user
      // wouldn't be available
      var self = this;
      var invitation = this.at(index);
      // TODO: is there ever a situation where the invitation wouldn't be found?
      var signal = {
        type: 'acceptInvitation',
        to: invitation.get('inviter').connection,
        data: invitation.toSignal()
      };
      this.presenceSession.signal(signal, function(err) {
        if (err) {
          // TODO: error handling
          log.error('InvitationList: acceptInvitation failed', err);
          return;
        }
        self.remove(invitation);
        self.each(function(otherInvitation, index) {
          // TODO: assert that any otherInvitation must be incoming?
          self.declineInvitation(index);
        });
        self.dispatcher.trigger('invitationAccepted', invitation);
      });
    },

    receiveAcceptance: function(event) {
      // TODO: find the invitation to accept
      // TODO: let the dispatcher know that an outgoing invitation has been accepted
      // *  local user status should be updated
      // *  chat view should create a chat based on this invitation
      var invitation = this.find(function(invitation) {
        return !invitation.get('incoming')  &&
               invitation.get('invitee').connection.connectionId === event.from.connectionId &&
               event.data === invitation.toSignal();
      });
      if (!invitation) {
        log.warn('InvitationList: receiveAcceptance could not find an invitation to accept');
        return;
      }
      this.remove(invitation);
      this.dispatcher.trigger('invitationAccepted', invitation);
    },

    declineInvitation: function(/* index | connection */) {
      // TODO: find the invitation to be declined, if its not there warn, it might have been cancelled
      // TODO: send invitation declination using signal
      // TODO: remove the declined invitation from self
      var self = this;
      var invitation;
      if (typeof arguments[0] === 'number') {
        invitation = this.at(arguments[0]);
      } else if (arguments[0] instanceof OT.Connection) {
        invitation = this.find(function(i) { return i.get('inviter').connection === arguments[0]; });
      }
      if (!invitation) {
        log.warn('InvitationList: declineInvitation could not find an invitation to decline');
        return;
      }
      var signal = {
        type: 'declineInvitation',
        to: invitation.get('inviter').connection,
        data: invitation.toSignal()
      };
      this.presenceSession.signal(signal, function(err) {
        if (err) {
          // TODO: error handling
          log.error('InvitationList: declineInvitation failed', err);
          return;
        }
        self.remove(invitation);
      });
    },

    receiveDeclination: function(event) {
      // TODO: find the invitation to decline, and remove it. the collection should now be empty
      // TODO: let the dispatcher know that an outgoing invitation has been declined
      // *  local user status should be updated
      var invitation = this.find(function(invitation) {
        return !invitation.get('incoming')  &&
               invitation.get('invitee').connection.connectionId === event.from.connectionId &&
               event.data === invitation.toSignal();
      });
      if (!invitation) {
        log.warn('InvitationList: receiveDeclination could not find an invitation to decline');
        return;
      }
      this.remove(invitation);
      // TODO: assert that the collection is empty?
      this.dispatcher.trigger('invitationDeclined', invitation);
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
