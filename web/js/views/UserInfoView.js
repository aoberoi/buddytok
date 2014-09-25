/* -----------------------------------------------------------------------------------------------
 * User Info View
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
                                    // Application modules
                                    // Server config
           undefined                // Misc
         ) {

  exports.UserInfoView = Backbone.View.extend({

    initialize: function() {
      if (!this.model) {
        throw Error('User Info View must be initialized with a model');
      }

      this.listenTo(this.model, 'change', this.render);
    },

    // TODO: eliminate global DOM query
    template: _.template($('#tpl-user-info').html()),

    render: function() {
      this.$el.html(this.template(this.model.attributes));
      return this;
    }

  });

}(window, Backbone, _, log));
