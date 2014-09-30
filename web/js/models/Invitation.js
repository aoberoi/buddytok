/* -----------------------------------------------------------------------------------------------
 * Invitation Model
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           $, Backbone, _, log,     // External libraries
                                    // Application modules
           undefined
         ) {

  // TODO: may not need to have both inviter and invitee fields, better to just use one for
  // remoteUser?
  // TODO: may want to expose a better 'ready' api instead of querying for a token
  exports.Invitation = Backbone.Model.extend({

    defaults: {
      incoming: false,
      invitee: null,
      inviter: null,
      sessionId: null,
      token: null,
      apiKey: null
    },

    urlRoot: '/chats',

    parse: function(response, options) {
      var copy = _.clone(this.attributes);
      return _.extend(copy, response);
    },

    getChatInfo: function() {
      var self = this;
      $.get('/chats', { sessionId: this.get('sessionId') })
        .done(function(data) {
          log.info('Invitation: getChatInfo');
          self.set('token', data.token);
          self.trigger('chatInfoReady');
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          log.error('Invitation: getChatInfo failed', errorThrown);
          self.trigger('chatInfoError');
        });
    },

    toSignal: function() {
      return JSON.stringify({
        sessionId: this.get('sessionId'),
        apiKey: this.get('apiKey')
      });
    },

    fromSignal: function(signalData) {
      this.set(JSON.parse(signalData));
    }

  });

}(window, jQuery, Backbone, _, log));
