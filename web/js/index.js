/* -----------------------------------------------------------------------------------------------
 * BuddyTok
 * ----------------------------------------------------------------------------------------------*/
// Explicitly declare dependencies and prevent leaking into global scope
(function(window, document, $, OT, otConfig, undefined) {

  // Global state
  var user = {}; // Properties: 'connected', 'status', 'token', 'name'
  var userList = {}; // Map of connectionId : user, where user is an object with keys 'name', 'status'
  var presenceSession = null;
  var connectModal = $('#connectModal');
  var connectForm = $('#connect-form');
  var connectFormButton = $('#connect-form-btn');

  // Form inside the Connect modal that asks for the User's name before connecting
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
    // TODO: check for max length
    if (name.length === 0) {
      connectFormUsername.parents('.form-group').addClass('has-error');
      return errorHandler();
    }

    // Retrieve a token
    $.post('/user', { name: name })
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
    presenceSession.signal({
      type: "userOnline",
      data: JSON.stringify({
        "name" : user.name,
        "status" : "online"
      })
    }, function(err) {
      if (err) {
        // TODO: real error handling. retry?
        console.log('failed to send userOnline signal');
      }
    });
  };

  var presenceSessionDisconnected = function(event) {
    // TODO: if this was unintentional, attempt reconnect
  };

  var userCameOnline = function(event) {
    if ((event.from.connectionId !== presenceSession.connection.connectionId) && !(userList[event.from.connectionId])) {
      userList[event.from.connectionId] = JSON.parse(event.data);
    }
    // TODO: render User List (or just do a smaller add operation)
    console.log(userList);
  };

  var userWentOffline = function(event) {
    if (event.connection.connectionId in userList) {
      delete userList[event.connection.connectionId];
    }
    // TODO: render User List (or just do a smaller remove operation)
    console.log(userList);
  };


  // Initialization function
  var init = function() {
    user.connected = false;
    presenceSession = OT.initSession(otConfig.apiKey, otConfig.presenceSessionId);
    presenceSession.on('sessionConnected', presenceSessionConnected);
    presenceSession.on('sessionDisconnected', presenceSessionDisconnected);
    presenceSession.on('connectionDestroyed', userWentOffline);
    presenceSession.on('signal:userOnline', userCameOnline);

    connectModal.modal('show');
  };

  // Once the DOM is ready we can initialize
  $(document).ready(function() {
    init();
  });

}(window, document, jQuery, OT, opentokConfig));
