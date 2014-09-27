/* -----------------------------------------------------------------------------------------------
 * Buddy List View
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
                                    // Application modules
                                    // Server config
           undefined                // Misc
         ) {

  exports.BuddyListView = Backbone.View.extend({

    className: 'panel panel-default',

    initialize: function(options) {
      this.listenTo(this.collection, 'add remove change:available', this.render);
    },

    // TODO: eliminate global DOM query
    template: _.template($('#tpl-buddy-list').html()),

    render: function() {
      this.$el.html(this.template({
        users: this.collection.toJSON()
      }));
      return this;
    }

  });

}(window, Backbone, _, log));
