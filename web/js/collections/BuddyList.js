/* -----------------------------------------------------------------------------------------------
 * Buddy List Collection
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
           RemoteUser,              // Application modules
           undefined
         ) {

  exports.BuddyList = Backbone.Collection.extend({

    model: RemoteUser,

    initialize: function(models, options) {
      if (!options.dispatcher) {
        log.error('ConnectModalView: initialize() cannot be called without a dispatcher');
        return;
      }
      options.dispatcher.once('presenceSessionReady', this.presenceSessionReady, this);

    },

    addRemoteUser: function(connection) {
      var newUser = new RemoteUser({},{
        presenceSession: this.presenceSession,
        connection: connection
      });

      log.info('BuddyList: addRemoteUser', newUser);
      this.push(newUser);
    },

    removeRemoteUser: function(connection) {
      var removingUser = this.find(function(remoteUser) {
        return remoteUser.connection === connection;
      });
      if (!removingUser) {
        log.warn('BuddyList: removeRemoteUser could not find remote user based on connection');
        return;
      }
      log.info('BuddyList: removeRemoteUser', removingUser);
      this.remove(removingUser);
    },

    presenceConnectionCreated: function(event) {
      if (event.connection.connectionId !== this.presenceSession.connection.connectionId) {
        this.addRemoteUser(event.connection);
      }
    },

    presenceConnectionDestroyed: function(event) {
      if (event.connection.connectionId !== this.presenceSession.connection.connectionId) {
        this.removeRemoteUser(event.connection);
      }
    },

    presenceSessionReady: function(presenceSession) {
      this.presenceSession = presenceSession;

      this.presenceSession.on('connectionCreated', this.presenceConnectionCreated, this);
      this.presenceSession.on('connectionDestroyed', this.presenceConnectionDestroyed, this);
    }

  });

}(window, Backbone, _, log, RemoteUser));
