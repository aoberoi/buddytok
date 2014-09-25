/* -----------------------------------------------------------------------------------------------
 * User Model
 * ----------------------------------------------------------------------------------------------*/

// TODO: this could be renamed LocalUser and the common User functionality can be factored out into
// a super class

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
                                    // Application modules
           constConfig,             // Server config
           undefined                // Misc
         ) {

  exports.User = Backbone.Model.extend({

    defaults: {
      name : null,
      status: 'offline',
      // NOTE: this is a derived property but it makes templating easier
      connected: false,
      // NOTE: 'token' set by server after 'sync'
      token: null
    },

    // NOTE: this could be eliminated if considered as all statuses except 'offline', but having this
    // here also serves as documentation for the possible values of status
    onlineStatuses: ['online', 'invitePending', 'chatting'],
    availableStatuses: ['online'],

    urlRoot: '/users',

    initialize: function(attrs, options) {
      if (!options.presenceSession) {
        throw Error('User cannot be initialized without a presence session');
      }

      this.presenceSession = options.presenceSession;
      this.presenceSession.on('sessionConnected', this.connected, this);
      this.presenceSession.on('sessionDisconnected', this.disconnected, this);

      this.on('change:status', this.statusChanged, this);
      this.on('change:status', this.sendRemoteStatus, this);
    },

    validate: function(attrs, options) {
      if (!attrs.name || attrs.name.length === 0) {
        return [{
          attribute: 'name',
          reason: 'User must have a name property'
        }];
      }

      if (attrs.name.length > constConfig.NAME_MAX_LENGTH) {
        return [{
          attribute: 'name',
          reason: 'User name must be shorter than ' + constConfig.NAME_MAX_LENGTH +
                  ' characters'
        }];
      }
    },

    connect: function(done) {
      this.presenceSession.connect(this.get('token'), done);
    },

    connected: function(event) {
      this.set('status', 'online');
    },

    disconnected: function(event) {
      this.set('status', 'offline');
    },

    statusChanged: function(self, status) {
      this.set('connected', _.include(this.onlineStatuses, status));
    },

    // TODO: send new connections my own status
    sendRemoteStatus: function(self, status) {
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
      // TODO: handle errors via completion
      this.presenceSession.signal(signal);
    }
  });

}(window, Backbone, _, log, constConfig));
