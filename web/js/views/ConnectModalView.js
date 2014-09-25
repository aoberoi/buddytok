/* -----------------------------------------------------------------------------------------------
 * Connect Modal View
 * ----------------------------------------------------------------------------------------------*/

// Declare dependencies and prevent leaking into global scope
(function(
           exports,                 // Environment
           Backbone, _, log,        // External libraries
                                    // Application modules
                                    // Server config
           undefined                // Misc
         ) {


  var ConnectModalView = exports.ConnectModalView = Backbone.View.extend({

    events: {
      'shown.bs.modal': 'focusInput',
      'hidden.bs.modal': 'clearInputs',
      'submit #connect-form': 'connect',
      'click #connect-btn': 'connect'
    },

    initialize: function(options) {
      this.presenceSession = options.presenceSession;
      this.presenceSession.on('sessionConnected', this.userConnected, this);
      this.model = new User();
      this.listenTo(this.model, 'invalid', this.validationFailed);
      this.listenTo(this.model, 'error', this.saveFailed);
      this.listenTo(this.model, 'sync', this.userSaved);
      this.$form = this.$('#connect-form');
      this.$connectButton = this.$('#connect-btn');
    },

    connect: function(event) {
      log.info('ConnectModalView: connect');
      event.preventDefault();

      this.disableInputs();
      this.resetValidation();

      this.model.save(this.serializeForm());
    },

    userSaved: function() {
      log.info('ConnectModalView: userSaved');
      this.presenceSession.connect(this.model.get('token'));
      // TODO: connection error handling
    },

    userConnected: function(event) {
      log.info('ConnectModalView: userConnected');
      this.hide();
      this.model.set('connectionId', this.presenceSession.connection.connectionId);
      this.trigger('userConnected', this.model);
    },

    validationFailed: function(user, errors) {
      log.warn('ConnectModalView: validationFailed');
      _.each(errors, function(error) {
        var group = this.$form.find('[name=\'user['+error.attribute+']\']').parents('.form-group');
        group.addClass('has-error');
        group.append('<p class="help-block">'+error.reason+'</p>');
      }, this);
      this.enableInputs();
    },

    saveFailed: function(user, xhr) {
      log.error('ConnectModalView: saveFailed');
      log.error(xhr);
      alert('Server error, please try again later: ' + xhr.textStatus);
      this.enableInputs();
    },

    show: function() {
      this.$el.modal('show');
    },

    hide: function() {
      this.$el.modal('hide');
    },

    focusInput: function() {
      this.$form.find(':input').first().focus();
    },

    clearInputs: function() {
      this.$form[0].reset();
    },

    disableInputs: function() {
      this.$form.find(':input').prop('disabled', true);
      this.$connectButton.button('loading');
    },

    enableInputs: function() {
      this.$form.find(':input').prop('disabled', false);
      this.$connectButton.button('reset');
    },

    serializeForm: function() {
      return {
        name: this.$form.find('[name=\'user[name]\']').val()
      };
    },

    resetValidation: function() {
      var groups = this.$form.find('.has-error');
      groups.find('.help-block').remove();
      groups.removeClass('has-error');
    }

  });

}(window, Backbone, _, log));
