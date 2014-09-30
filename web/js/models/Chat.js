/* -----------------------------------------------------------------------------------------------
 * Chat Model
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           OT, Backbone, _, log,    // External libraries
                                    // Application modules
           undefined
         ) {

  // TODO: statically assign the video options
  exports.Chat = Backbone.Model.extend({

    defaults: {
      subscriberName: null
    },

    initialize: function(attrs, options) {
      if (!options.localUser) {
        log.error('Chat: initialize() cannot be called without a local user');
        return;
      }
      this.localUser = options.localUser;

      if (!options.invitation) {
        log.error('Chat: initialize() cannot be called without an invitation');
        return;
      }
      this.invitation = options.invitation;

      this.remoteUser = this.invitation.get('incoming') ? this.invitation.get('inviter') : this.invitation.get('invitee');
      this.set('subscriberName', this.remoteUser.get('name'));

      if (this.invitation.get('incoming')) {
        // An incoming invitation won't have sessionId information yet, therefore it needs to be
        // requested
      }
    },

    start: function(publisherEl, subscriberEl) {
      log.info('Chat: start');
      var self = this;

      var _start = function _start() {
        self.subscriberEl = subscriberEl;

        self.session = OT.initSession(self.invitation.get('apiKey'), self.invitation.get('sessionId'));
        self.session.on('sessionConnected', self.sessionConnected, self)
                    .on('sessionDisconnected', self.sessionDisconnected, self)
                    .on('streamCreated', self.streamCreated, self)
                    .on('streamDestroyed', self.streamDestroyed, self);
        self.session.connect(self.invitation.get('token'));

        self.publisher = OT.initPublisher(publisherEl, { insertMode: 'append', width: '100%', height: '100%' });

        self.trigger('started');
      };

      // TODO: make a verifyInvitationReady or something like that
      if (this.invitation.get('token')) {
        this.verifyUserStatus(_start);
      } else {
        this.invitation.once('chatInfoReady', function() {
          this.verifyUserStatus(_start);
        }, this);
        this.invitation.once('chatInfoError', this.errorHandler, this);
        this.invitation.getChatInfo();
      }
    },

    end: function() {
      log.info('Chat: end');
      this.session.disconnect();
    },

    sessionConnected: function(event) {
      log.info('Chat: sessionConnected');
      this.session.publish(this.publisher);
    },

    sessionDisconnected: function(event) {
      log.info('Chat: sessionDisconnected');
      this.session.off();
      this.session = null;
      this.subscriberEl = null;
      this.publisher = null;
      this.subscriber = null;
      this.trigger('ended');
    },

    streamCreated: function(event) {
      log.info('Chat: streamCreated');
      this.subscriber = this.session.subscribe(event.stream, this.subscriberEl, { insertMode: 'append', width: '100%', height: '100%' });
      this.trigger('subscriberJoined');
    },

    streamDestroyed: function(event) {
      log.info('Chat: streamDestroyed');
      if (event.stream.streamId === this.subscriber.stream.streamId) {
        log.info('Chat: remote user has left the chat, ending');
        this.end();
      } else {
        log.warn('Chat: streamDestroyed but was not equal to subscriber stream');
      }
    },

    verifyUserStatus: function(done) {
      if (this.localUser.get('status') === 'chatting') {
        done();
      } else {
        this.localUser.on('change:status', function waitForStatus(status) {
          if (status === 'chatting') {
            done();
            this.localUser.off('change:status', waitForStatus);
          }
        }, this);
      }
    },

    errorHandler: function() {
      log.error('Chat: an error occurred, chat ending');
      this.end();
    }

  });

}(window, OT, Backbone, _, log));
