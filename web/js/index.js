/* -----------------------------------------------------------------------------------------------
 * BuddyTok
 * ----------------------------------------------------------------------------------------------*/
// Explicitly declare dependencies and prevent leaking into global scope
(function(window, document, $, _, OT, otConfig, log, undefined) {

  // Application state
  var user = {}; // Properties: 'connected', 'status', 'token', 'name'
  var userList = {}; // Map of connectionId : user, where user is an object with keys 'name', 'status'
  var presenceSession;

  // DOM references
  var connectModalEl, connectFormEl, connectFormButtonEl, userListEl, userInfoEl;

  // Templates
  var userListTemplate, userInfoTemplate;

  // Connect Form event handler
  var connectSubmission = function(event) {
    event.preventDefault();
    var connectFormUsername = $('#connect-form-username');
    connectFormButtonEl.button('loading');

    // Result handling functions
    var successHandler = function() {
      log.info('Connect form completed');
      // Reset form fields
      connectFormUsername.val('');
      connectModalEl.modal('hide');
      alwaysHandler();
    };
    var errorHandler = function() {
      log.warn('Connect form failed');
      // TODO: message error
      alwaysHandler();
    };
    var alwaysHandler = function() {
      // reset button state
      connectFormButtonEl.button('reset');
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


  // Presence Session management
  // TODO: in order to implement switching 'status', there will need to be some signal-based
  // communication of that state when events like connection, disconnection, and update happen
  var presenceSessionConnected = function(event) {
    log.info('Presence session connected');
    user.connected = true;
    user.status = "online";

    // Reflect connectedness in UI
    userInfoEl.html(userInfoTemplate({ user: _.pick(user, 'name', 'connected') }));
  };
  var presenceSessionDisconnected = function(event) {
    // TODO: if this was unintentional, attempt reconnect
    log.info('Presence session disconnected');

    // Reflect connectedness in UI
    userInfoEl.html(userInfoTemplate({ user: _.pick(user, 'name', 'connected') }));
  };

  // User List management
  var userCameOnline = function(event) {
    if (  (event.connection.connectionId !== presenceSession.connection.connectionId) &&
         !(userList[event.connection.connectionId]) ) {
      userList[event.connection.connectionId] = JSON.parse(event.connection.data);
      log.info('User added to user list');
      log.info(userList);
    }
    userListEl.html(userListTemplate({ users: userList }));
  };
  var userWentOffline = function(event) {
    if (event.connection.connectionId in userList) {
      delete userList[event.connection.connectionId];
      log.info('User removed from user list');
      log.info(userList);
    }
    userListEl.html(userListTemplate({ users: userList }));
  };

  // Initialization function
  var init = function() {
    // Populate DOM references with queries
    connectModalEl = $('#connect-modal');
    connectFormEl = $('#connect-form');
    connectFormButtonEl = $('#connect-form-btn');
    userListEl = $('#user-list');
    userInfoEl = $('#user-info');

    // Populate Templates
    userListTemplate = _.template($('#tpl-user-list').html());
    userInfoTemplate = _.template($('#tpl-user-info').html());

    // DOM initialization
    connectModalEl.modal('show');
    userListEl.html(userListTemplate({ users: userList }));

    // Initialize application state
    user.connected = false;
    presenceSession = OT.initSession(otConfig.apiKey, otConfig.presenceSessionId);

    // Attach event handlers to DOM
    connectFormButtonEl.click(connectSubmission);
    connectFormEl.submit(connectSubmission);

    // Attach other event handlers
    presenceSession.on('sessionConnected', presenceSessionConnected);
    presenceSession.on('sessionDisconnected', presenceSessionDisconnected);
    presenceSession.on('connectionCreated', userCameOnline);
    presenceSession.on('connectionDestroyed', userWentOffline);
  };

  // Once the DOM is ready we can initialize
  $(document).ready(function() {
    init();
  });

}(window, document, jQuery, _, OT, opentokConfig, log));
