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
      inviter: null
    }

  });

}(window, Backbone, _, log));
