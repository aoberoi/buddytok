/* -----------------------------------------------------------------------------------------------
 * Buddy List View
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
           RemoteUser,                    // Application modules
                                    // Server config
           undefined                // Misc
         ) {

  exports.BuddyListView = Backbone.View.extend({

    initialize: function(options) {
      if (!options.presenceSession) {
        throw Error('Buddy List View cannot be initialized without a presence session');
      }

      this.presenceSession = options.presenceSession;
      this.presenceSession.on('connectionCreated', this.presenceConnectionCreated, this);
      this.presenceSession.on('connectionDestroyed', this.presenceConnectionDestroyed, this);

      this.collection = new Backbone.Collection();
      this.listenTo(this.collection, 'add remove change:available', this.render);
    },

    template: _.template($('#tpl-user-list').html()),

    render: function() {
      this.$el.html(this.template({
        users: this.collection.toJSON()
      }));
      return this;
    },

    addRemoteUser: function(connection) {
      var connectionData = JSON.parse(connection.data);

      this.collection.push(new RemoteUser({
        name: connectionData.name
      },{
        presenceSession: this.presenceSession,
        connection: connection
      }));
    },

    removeRemoteUser: function(connection) {
      var removingUser = this.collection.find(function(remoteUser) {
        return remoteUser.connection === connection;
      });
      if (!removingUser) {
        log.warn('BuddyListView: removeRemoteUser could not find remote user based on connection');
        return;
      }
      this.collection.remove(removingUser);
    },

    presenceConnectionCreated: function(event) {
      if (event.connection.connectionId !== presenceSession.connection.connectionId) {
        this.addRemoteUser(event.connection);
      }
    },

    presenceConnectionDestroyed: function(event) {
      if (event.connection.connectionId !== presenceSession.connection.connectionId) {
        this.removeRemoteUser(event.connection);
      }
    }

  });

}(window, Backbone, _, log, RemoteUser));
