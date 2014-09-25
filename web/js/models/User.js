/* -----------------------------------------------------------------------------------------------
 * User Model
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, log,           // External libraries
                                    // Application modules
           constConfig,             // Server config
           undefined                // Misc
         ) {

  var User = exports.User = Backbone.Model.extend({

    defaults: {
      name : '',
      connectionId : '',
      status: 'offline'
    },

    urlRoot: '/users',
    // Typically the attribute specified by idAttribute should be set by the server after sync but
    // in this case its set via the presenceSession
    //idAttribute: 'connectionId',

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
    }
  });

}(window, Backbone, log, constConfig));
