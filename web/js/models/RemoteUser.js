/* -----------------------------------------------------------------------------------------------
 * Remote User Model
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
                                    // Application modules
                                    // Server config
           undefined                // Misc
         ) {

  exports.RemoteUser = Backbone.Model.extend({

    defaults: {
      name: null,
      status: 'online',
      // NOTE: this is a derived property but it makes templating easier
      available: true
    },

    // NOTE: choosing to describe the unavailable statuses leaves room for other types of
    // unavailable statuses in the future (e.g. 'away')
    // NOTE: 'offline' isn't valid because the remote user object would be destroyed
    unavailableStatuses: ['unavailable'],

    initialize: function(attrs, options) {
      if (!options.presenceSession) {
        throw Error('Remote user cannot be initialized without a presence session');
      }
      this.presenceSession = options.presenceSession;

      if (!options.connection) {
        throw Error('Remote user cannot be initialized without a connection');
      }
      this.connection = options.connection;

      this.presenceSession.on('signal:' + this.connection.connectionId + '~status', this.remoteStatusUpdated, this);
      this.on('change:status', this.statusChanged, this);
    },

    statusChanged: function(self, status) {
      this.set('available', !_.include(this.unavailableStatuses, status));
    },

    remoteStatusUpdated: function(event) {
      this.set('status', event.data);
    }

  });

}(window, Backbone, _, log));
