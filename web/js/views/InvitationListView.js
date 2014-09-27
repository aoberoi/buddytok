/* -----------------------------------------------------------------------------------------------
 * Invitation List View
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
                                    // Application modules
           undefined
         ) {

  exports.InvitationListView = Backbone.View.extend({

    className: 'invitation-list',

    events: {
      'click .invite-accept': 'inviteAccept',
      'click .invite-decline': 'inviteDecline',
      'click .invite-cancel': 'inviteCancel'
    },

    initialize: function(options) {
      this.listenTo(this.collection, 'add remove', this.render);
    },

    // TODO: eliminate global DOM query
    incomingTemplate: _.template($('#tpl-incoming-invite').html()),
    outgoingTemplate: _.template($('#tpl-outgoing-invite').html()),

    render: function() {
      var self = this;

      // TODO: could be optimized by constructing a new detached DOM element and swapping it in once
      // at the end
      this.$el.empty();
      this.collection.each(function(invitation) {
        var template = invitation.get('incoming') ? self.incomingTemplate : self.outgoingTemplate;
        this.$el.append(template(invitation.attributes));
      });

      return this;
    },

    inviteAccept: function(event) {
      // TODO: figure out index
      log.info('InvitationListView: inviteAccept');
      this.collection.acceptInvitation(index);
    },
    inviteDecline: function(event) {
      // TODO: figure out index
      log.info('InvitationListView: inviteDecline');
      this.collection.declineInvitation(index);
    },
    inviteCancel: function(event) {
      // TODO: figure out index
      log.info('InvitationListView: inviteCancel');
      this.collection.cancelInvitation(index);
    },

  });

}(window, Backbone, _, log));
