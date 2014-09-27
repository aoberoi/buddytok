/* -----------------------------------------------------------------------------------------------
 * Buddy List View
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
                                    // Application modules
           undefined
         ) {

  exports.BuddyListView = Backbone.View.extend({

    className: 'panel panel-default',

    events: {
      'click .invite-button': 'inviteButtonClicked'
    },

    initialize: function(options) {
      if (!options.dispatcher) {
        log.error('BuddyListView: initialize() cannot be called without a dispatcher');
        return;
      }
      this.dispatcher = options.dispatcher;

      this.listenTo(this.collection, 'add remove change:available', this.render);
    },

    // TODO: eliminate global DOM query
    template: _.template($('#tpl-buddy-list').html()),

    render: function() {
      this.$el.html(this.template({
        users: this.collection.toJSON()
      }));
      return this;
    },

    inviteButtonClicked: function(event) {
      var index = this.$('.invite-button').index(event.currentTarget);
      var remoteUser = this.collection.at(index);
      this.dispatcher.trigger('inviteRemoteUser', remoteUser);
    }

  });

}(window, Backbone, _, log));
