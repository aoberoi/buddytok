/* -----------------------------------------------------------------------------------------------
 * BuddyTok
 * ----------------------------------------------------------------------------------------------*/
// Explicitly declare dependencies and prevent leaking into global scope
(function(window, document, $, OT, otConfig, undefined) {

  // Global state
  var user = {};
  var presenceSession = null;
  var connectModal = $('#connectModal');
  var connectForm = $('#connect-form');
  var connectFormButton = $('#connect-form-btn');

  // Form inside the Connect modal that asks the User for his name before connecting
  var connectSubmission = function(event) {
    event.preventDefault();
    var btn = connectFormButton;
    var connectFormUsername = $('#connect-form-username');
    btn.button('loading');

    // Result handling functions
    var successHandler = function() {
      // Reset form fields
      connectFormUsername.val('');
      connectModal.modal('hide');
      alwaysHandler();
    };
    var errorHandler = function() {
      // TODO: message error
      alwaysHandler();
    };
    var alwaysHandler = function() {
      // reset button state
      btn.button('reset');
    };

    var name = connectFormUsername.val();

    // Validation
    // TODO: remove error message when new value has begun to be typed
    if (name.length === 0) {
      connectFormUsername.parents('.form-group').addClass('has-error');
      return errorHandler();
    }

    // Retrieve a token
    // TODO: remove sessionId
    $.post('/user', { name: name, sessionId: otConfig.presenceSessionId })
      .done(function(data) {
        user.token = data.token;
        presenceSession.connect(user.token, function(err) {
          if (err) {
            errorHandler();
          } else {
            successHandler();
          }
        });
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        errorHandler();
      });
  };
  connectFormButton.click(connectSubmission);
  connectForm.submit(connectSubmission);


  // Presence Session
  var presenceSessionConnected = function(event) {
    user.connected = true;
  };


  // Initialization function
  var init = function() {
    user.connected = false;
    presenceSession = OT.initSession(otConfig.apiKey, otConfig.presenceSessionId);
    presenceSession.on('sessionConnected', presenceSessionConnected);

    connectModal.modal('show');
  };

  // Once the DOM is ready we can initialize
  $(document).ready(function() {
    init();
  });

}(window, document, jQuery, OT, opentokConfig));
