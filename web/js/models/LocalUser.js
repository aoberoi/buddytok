/* -----------------------------------------------------------------------------------------------
 * Local User Model
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
                                    // Application modules
           undefined
         ) {

  exports.LocalUser = Backbone.Model.extend({

    defaults: {
      name : null,
      status: 'offline',
      // NOTE: this is a derived property but it makes templating easier
      connected: false,
      // NOTE: 'token' set by server after 'sync'
      token: null
    },

    allStatuses: ['online', 'offline', 'outgoingInvitePending', 'chatting'],
    // Statuses where the Remote User representation of this user will appear invitable
    availableStatuses: ['online'],

    NAME_MAX_LENGTH: 100,

    urlRoot: '/users',

    initialize: function(attrs, options) {
      if (!options.dispatcher) {
        log.error('LocalUser: initialize() cannot be called without a dispatcher');
        return;
      }
      this.dispatcher = options.dispatcher;
      this.dispatcher.once('presenceSessionReady', this.presenceSessionReady, this);
      this.dispatcher.on('getUserAvailability', this.getUserAvailability, this);
      this.dispatcher.on('invitationSent', this.invitationSent, this);
      this.dispatcher.on('invitationCancelled', this.invitationCancelled, this);
      this.dispatcher.on('invitationAccepted', this.invitationAccepted, this);
      this.dispatcher.on('invitationDeclined', this.invitationDeclined, this);
      this.dispatcher.on('chatEnded', this.chatEnded, this);

      this.on('change:status', this.statusChanged, this);
      this.once('sync', this.connect, this);

    },

    validate: function(attrs, options) {
      log.info('LocalUser: validate');
      if (!attrs.name || attrs.name.length === 0) {
        return [{
          attribute: 'name',
          reason: 'User must have a name property'
        }];
      }

      if (attrs.name.length > this.NAME_MAX_LENGTH) {
        return [{
          attribute: 'name',
          reason: 'User name must be shorter than ' + constConfig.NAME_MAX_LENGTH +
                  ' characters'
        }];
      }
    },

    presenceSessionReady: function(presenceSession) {
      this.presenceSession = presenceSession;
      this.presenceSession.on('sessionConnected', this.connected, this);
      this.presenceSession.on('sessionDisconnected', this.disconnected, this);
      this.presenceSession.on('connectionCreated', this.connectionCreated, this);
    },

    connect: function() {
      log.info('LocalUser: connect');
      if (!this.presenceSession) {
        log.error('LocalUser: connect() cannot be invoked when there is no presenceSession set');
        return;
      }
      // TODO: connection error handling
      this.presenceSession.connect(this.get('token'));
    },

    disconnect: function() {
      log.info('LocalUser: disconnect');
      if (!this.presenceSession) {
        log.error('LocalUser: disconnect() cannot be invoked when there is no presenceSession set');
        return;
      }
      this.presenceSession.disconnect();
    },

    connected: function(event) {
      this.set('status', 'online');
    },

    disconnected: function(event) {
      this.set('status', 'offline');
    },

    connectionCreated: function(event) {
      if (event.connection !== this.presenceSession.connection) {
        this.sendRemoteStatus(this.get('status'), event.connection);
      }
    },

    statusChanged: function(self, status) {
      log.info('LocalUser: statusChanged', status);
      // compute derived properties that are based on status
      this.set('connected', _.include(this.connectedStatuses, status));

      this.getUserAvailability();
      this.sendRemoteStatus(status);
    },

    sendRemoteStatus: function(status, connection) {
      log.info('LocalUser: sendRemoteStatus');
      // an 'offline' status update is sent to remote users as a connectionDestroyed
      if (status === 'offline') {
        return;
      }
      var signal = {
        type: this.presenceSession.connection.connectionId + '~status'
      };
      if (_.include(this.availableStatuses, status)) {
        signal.data = 'online';
      } else {
        signal.data = 'unavailable';
      }
      if (connection) {
        signal.to = connection;
      }
      // TODO: handle errors via completion
      this.presenceSession.signal(signal);
    },

    getUserAvailability: function() {
      log.info('LocalUser: getUserAvailability');
      var self = this;
      var triggerUserAvailability = function() {
        self.dispatcher.trigger('userAvailability', _.include(self.availableStatuses, self.get('status')));
      };
      setTimeout(triggerUserAvailability, 0);
    },

    invitationSent: function() {
      this.set('status', 'outgoingInvitePending');
    },

    invitationCancelled: function() {
      this.set('status', 'online');
    },

    invitationAccepted: function() {
      this.set('status', 'chatting');
    },

    invitationDeclined: function() {
      this.set('status', 'online');
    },

    chatEnded: function() {
      this.set('status', 'online');
    }
  });

  // NOTE: Because of how Backbone creates prototypes, there is no way to refer to the allStatuses
  // property inside the call to extend(). The prototype only exists after that call completes.
  exports.LocalUser.prototype.connectedStatuses = _.without(LocalUser.prototype.allStatuses, 'offline');

}(window, Backbone, _, log));
