/* -----------------------------------------------------------------------------------------------
 * BuddyTok
 * ----------------------------------------------------------------------------------------------*/
// Explicitly declare dependencies and prevent leaking into global scope
(function(window, document, $, OT, otConfig, log, undefined) {

  // Global state
  var user = {}; // Properties: 'connected', 'status', 'token', 'name'
  var userList = {}; // Map of connectionId : user, where user is an object with key 'name'
  var presenceSession;

  // DOM queries
  var connectModal = $('#connectModal');
  var connectForm = $('#connect-form');
  var connectFormButton = $('#connect-form-btn');

  // Connect Form event handler
  var connectSubmission = function(event) {
    event.preventDefault();
    var btn = connectFormButton;
    var connectFormUsername = $('#connect-form-username');
    btn.button('loading');

    // Result handling functions
    var successHandler = function() {
      log.info('Connect form completed');
      // Reset form fields
      connectFormUsername.val('');
      connectModal.modal('hide');
      alwaysHandler();
    };
    var errorHandler = function() {
      log.warn('Connect form failed');
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
    user.name = name;
    log.info('Connect form validation passed');

    // Retrieve a token...
    $.post('/user', { name: name })
      .done(function(data) {
        // TODO: check that token exists
        log.info('Retreived token for presence session', data.token);
        user.token = data.token;
        // ... then connect to the OpenTok Session
        presenceSession.connect(user.token, function(err) {
          if (err) {
            errorHandler();
          } else {
            successHandler();
          }
        });
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        log.error('Failed to retreive token for presence session', textStatus);
        errorHandler();
      });
  };
  // Attach event handler to DOM events
  connectFormButton.click(connectSubmission);
  connectForm.submit(connectSubmission);


  // Presence Session management
  // TODO: in order to implement switching 'status', there will need to be some signal-based
  // communication of that state when events like connection, disconnection, and update happen
  var presenceSessionConnected = function(event) {
    log.info('Presence session connected');
    user.connected = true;
    user.status = "online";
  };
  var presenceSessionDisconnected = function(event) {
    // TODO: if this was unintentional, attempt reconnect
    log.info('Presence session disconnected');
  };

  // User List management
  var userCameOnline = function(event) {
    if (  (event.connection.connectionId !== presenceSession.connection.connectionId) &&
         !(userList[event.connection.connectionId]) ) {
      userList[event.connection.connectionId] = JSON.parse(event.connection.data);
      log.info('User added to user list');
      log.info(userList);
    }
    // TODO: render User List (or just do a smaller add operation)
  };
  var userWentOffline = function(event) {
    if (event.connection.connectionId in userList) {
      delete userList[event.connection.connectionId];
      log.info('User removed from user list');
      log.info(userList);
    }
    // TODO: render User List (or just do a smaller remove operation)
  };

  // Initialization function
  var init = function() {
    user.connected = false;
    presenceSession = OT.initSession(otConfig.apiKey, otConfig.presenceSessionId);
    presenceSession.on('sessionConnected', presenceSessionConnected);
    presenceSession.on('sessionDisconnected', presenceSessionDisconnected);
    presenceSession.on('connectionCreated', userCameOnline);
    presenceSession.on('connectionDestroyed', userWentOffline);

    connectModal.modal('show');
  };

  // Once the DOM is ready we can initialize
  $(document).ready(function() {
    init();
  });

}(window, document, jQuery, OT, opentokConfig, log));
