/* -----------------------------------------------------------------------------------------------
 * User Model
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
                                    // Application modules
           constConfig,             // Server config
           undefined                // Misc
         ) {

  var User = exports.User = Backbone.Model.extend({

    defaults: {
      name : null,
      status: 'offline',
      // NOTE: this is functionally a derived property but it makes templating easier
      connected: false,
      // NOTE: 'token' set by server after 'sync'
      token: null
    },

    // NOTE: this could be eliminated if considered as all statuses except 'offline', but having this
    // here also serves as documentation for the possible values of status
    onlineStatuses: ['online', 'invitePending', 'chatting'],

    urlRoot: '/users',

    initialize: function(attrs, options) {
      if (!options.presenceSession) {
        throw Error('User cannot be initialized without a presence session');
      }

      this.presenceSession = options.presenceSession;
      this.presenceSession.on('sessionConnected', this.connected, this);
      this.presenceSession.on('sessionDisconnected', this.disconnected, this);

      this.on('change:status', this.statusChanged, this);
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
      if (_.include(this.onlineStatuses, status)) {
        this.set('connected', true);
      } else {
        this.set('connected', false);
      }
    }
  });

}(window, Backbone, _, log, constConfig));
