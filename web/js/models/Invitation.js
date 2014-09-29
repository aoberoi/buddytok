/* -----------------------------------------------------------------------------------------------
 * Invitation Model
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
                                    // Application modules
           undefined
         ) {

  exports.Invitation = Backbone.Model.extend({

    defaults: {
      incoming: false,
      invitee: null,
      inviter: null,
      sessionId: null
    },

    urlRoot: '/chats',

    parse: function(response, options) {
      var copy = _.clone(this.attributes);
      return _.extend(copy, response);
    },

    toSignal: function() {
      return JSON.stringify({
        sessionId: this.get('sessionId')
      });
    },

    fromSignal: function(signalData) {
      this.set(JSON.parse(signalData));
    }

  });

}(window, Backbone, _, log));
