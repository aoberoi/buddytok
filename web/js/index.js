/* -----------------------------------------------------------------------------------------------
 * BuddyTok
 * ----------------------------------------------------------------------------------------------*/
// Explicitly declare dependencies and prevent leaking into global scope
(function(window, document, $, _, OT, otConfig, constConfig, log, undefined) {

  // Application state
  var user = {}; // Properties: 'connected', 'status', 'token', 'name'
  var userList = {}; // Map of connectionId : user, where user is an object with keys 'name', 'status'
  var presenceSession;
  var currentChat, currentChatSession;

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
    if (name.length === 0 || name.length > constConfig.NAME_MAX_LENGTH) {
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

  // Invite button event handler
  // TODO: button enabling/disabling
  var inviteUser = function (event) {
    var inviteButton = $(this),
        inviteeConnectionId = inviteButton.data('connectionId');

    log.info('Inviting user at connectionId: ', inviteeConnectionId);

    var invitee = userList[inviteeConnectionId];

    if (invitee === undefined) {
      // TODO: surface an error
      log.error('Invitee not found in user list');
      return;
    }
    log.info('Invitee', invitee);

    $.post('/chats', { invitee: invitee.name })
      .done(function(data) {
        log.info('Retrieved new chat session');
        currentChat = data; // this should include 'chatSessionId' and 'inviterToken'
        var inviteSignal = {
          type: 'chatInvite',
          // TODO: NON-STANDARD
          to: presenceSession.connections.get(inviteeConnectionId),
          data: JSON.stringify(_.pick(currentChat, 'chatSessionId'))
        };
        presenceSession.signal(inviteSignal, function(err) {
          if (err) {
            // TODO: surface an error
            log.error('Error sending invitation signal: ' + err.reason);
          } else {
            // TODO: invitation success
            log.info('Invitation signal sent');
            connectToChat();
          }
        });
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        // TODO: surface an error
        log.error('Error creating a new chat');
      });
  };
  // Invite signal hander
  var inviteReceived = function(event) {
    // TODO: UI
    log.info('Received chat invitation from connection ID:', event.from.connectionId);

    var inviter = userList[event.from.connectionId];
    if (inviter === undefined) {
      // TODO: surface an error
      log.error('Inviter not found in user list');
      return;
    }
    log.info('Inviter', inviter);

    var signalData = JSON.parse(event.data),
        chatSessionId = signalData.chatSessionId;
    if (chatSessionId === undefined) {
      log.error('Chat session ID not found in signal');
      return;
    }

    $.get('/chats', { chatSessionId: chatSessionId })
      .done(function(data) {
        log.info('Retrieved chat');

        currentChat = data;
        // TODO: wait for user to 'accept' or 'decline' in the UI

        connectToChat();
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        // TODO: surface an error
        log.error('Error retrieving chat');
      });


  };


  // Presence Session management
  // TODO: in order to implement switching 'status', there will need to be some signal-based
  // communication of that state when events like connection, disconnection, and update happen
  var presenceSessionConnected = function(event) {
    log.info('Presence session connected');
    user.connected = true;
    user.status = 'online';

    // Reflect connectedness in UI
    userInfoEl.html(userInfoTemplate({ user: _.pick(user, 'name', 'connected') }));
  };
  var presenceSessionDisconnected = function(event) {
    // TODO: if this was unintentional, attempt reconnect
    log.info('Presence session disconnected');
    user.connected = false;
    user.status = 'disconnected';

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

  // Chat management
  // TODO: publish and subscribe
  // TODO: UI: 'waiting for xxx to join'
  // TODO: end chat
  var connectToChat = function() {
    // TODO: draw UI for current chat
    currentChatSession = OT.initSession(otConfig.apiKey, currentChat.chatSessionId);
    currentChatSession.on('sessionConnected', chatSessionConnected);
    currentChatSession.on('sessionDisconnected', chatSessionDisconnected);
    currentChatSession.on('streamCreated', chatStreamCreated);
    currentChatSession.on('streamDestroyed', chatStreamDestroyed);
    var token = currentChat.inviterToken || currentChat.inviteeToken;
    currentChatSession.connect(token, function(err) {
      if (err) {
        // TODO: surface an error
      }
    });
  };
  var chatSessionConnected = function(event) {
    log.info('Chat session connected');
  };
  var chatSessionDisconnected = function(event) {
    log.info('Chat session disconnected');
  };
  var chatStreamCreated = function(event) {
    log.info('Chat session stream created');
  };
  var chatStreamDestroyed = function(event) {
    log.info('Chat session stream destroyed');
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
    userInfoEl.html(userInfoTemplate({ user: _.pick(user, 'name', 'connected') }));

    // Initialize application state
    user.connected = false;
    user.status = 'disconnected';
    presenceSession = OT.initSession(otConfig.apiKey, otConfig.presenceSessionId);

    // Attach event handlers to DOM
    connectFormButtonEl.click(connectSubmission);
    connectFormEl.submit(connectSubmission);
    userListEl.on('click', '.invite-button', inviteUser);

    // Attach other event handlers
    presenceSession.on('sessionConnected', presenceSessionConnected);
    presenceSession.on('sessionDisconnected', presenceSessionDisconnected);
    presenceSession.on('connectionCreated', userCameOnline);
    presenceSession.on('connectionDestroyed', userWentOffline);
    presenceSession.on('signal:chatInvite', inviteReceived);
  };

  // Once the DOM is ready we can initialize
  $(document).ready(function() {
    init();
  });

}(window, document, jQuery, _, OT, opentokConfig, constConfig, log));
