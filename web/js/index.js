/* -----------------------------------------------------------------------------------------------
 * BuddyTok
 * ----------------------------------------------------------------------------------------------*/
// Explicitly declare dependencies and prevent leaking into global scope
(function(window, document, $, _, OT, otConfig, constConfig, log, undefined) {

  // Application state
  var user = {}; // Properties: 'connected', 'status', 'token', 'name'
  // possible statuses:
  // *  'disconnected' - not connected, not on others' userList
  // *  'online' - available for invitation
  // *  'invitePending' - cannot send any other invitations, but can still recieve them (inviter only)
  // *  'chatting' - cannot send nor recieve any invitation
  var userList = {}; // Map of connectionId : user, where user is an object with keys 'name', 'status'
  var presenceSession; // OpenTok Session
  var currentChat; // 'chatSessionId', 'inviterToken' | 'inviteeToken', 'invitee' | 'inviter' (ref to object stored in userList)
  var currentChatSession; // OpenTok Session
  var invitedChats = {}; // invitedChats is a map from chatSessionId to chat objects (as seen in currentChat)

  // DOM references
  var connectModalEl, connectFormEl, connectFormButtonEl, connectFormUsernameEl, userListEl, userInfoEl, invitationInfoEl;

  // Templates
  var userListTemplate, userInfoTemplate, sendInviteTemplate, receiveInviteTemplate;

  // Connect Form event handler
  var connectSubmission = function(event) {
    event.preventDefault();
    connectFormButtonEl.button('loading');

    // Result handling functions
    var successHandler = function() {
      log.info('Connect form completed');
      // Reset form fields
      connectFormUsernameEl.val('');
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

    var name = connectFormUsernameEl.val();

    // Validation
    // TODO: remove error message when new value has begun to be typed
    if (name.length === 0 || name.length > constConfig.NAME_MAX_LENGTH) {
      connectFormUsernameEl.parents('.form-group').addClass('has-error');
      return errorHandler();
    }
    user.name = name;
    log.info('Connect form validation passed');

    // Retrieve a token...
    $.post('/user', { name: name })
      .done(function(data) {
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
  var inviteUser = function (event) {
    var inviteButton = $(this),
        inviteeConnectionId = inviteButton.data('connectionId'),
        inviteButtons = userListEl.find('.invite-button');

    if (user.status !== 'online') {
      log.warn('Cannot send invitation because status is not \'online\'');
      return;
    }

    log.info('Inviting user at connectionId: ', inviteeConnectionId);

    inviteButtons.attr('disabled', 'disabled');

    // Result handling functions
    var successHandler = function() {
      log.info('Invitation signal sent');
      user.status = 'invitePending';
      invitationInfoEl.append(sendInviteTemplate({ invitee: invitee }));
      connectToChat();
      alwaysHandler();
    };
    var errorHandler = function() {
      // TODO: surface an error
      log.warn('Invitation failed');
      alwaysHandler();
    };
    var alwaysHandler = function() {
      inviteButtons.removeAttr('disabled');
    };

    var invitee = userList[inviteeConnectionId];

    if (invitee === undefined) {
      log.error('Invitee not found in user list');
      errorHandler();
      return;
    }
    invitee.presenceConnectionId = inviteeConnectionId;
    log.info('Invitee', invitee);

    $.post('/chats', { invitee: invitee.name })
      .done(function(data) {
        log.info('Retrieved new chat session');
        currentChat = data; // this should include 'chatSessionId' and 'inviterToken'
        currentChat.invitee = invitee;
        var inviteSignal = {
          type: 'chatInvite',
          // TODO: NON-STANDARD
          to: presenceSession.connections.get(inviteeConnectionId),
          data: JSON.stringify(_.pick(currentChat, 'chatSessionId'))
        };
        presenceSession.signal(inviteSignal, function(err) {
          if (err) {
            log.error('Error sending invitation signal: ' + err.reason);
            errorHandler();
          } else {
            successHandler();
          }
        });
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        log.error('Error creating a new chat');
        errorHandler();
      });
  };
  // Cancel invite button event handler
  var cancelInvitation = function(event) {
    var cancelButtonEl = $(this);

    cancelButtonEl.attr('disabled', 'disabled');

    log.info('Cancelling invitation to current chat', currentChat);

    var cancelInviteSignal = {
      type: 'chatInviteCancel',
      // TODO: NON-STANDARD
      to: presenceSession.connections.get(currentChat.invitee.presenceConnectionId)
    };
    presenceSession.signal(cancelInviteSignal, function(err) {
      if (err) {
        // TODO: surface error
        log.error('Failed to send invitation cancellation signal');
        return;
      }
      cancelButtonEl.parents('.alert').remove();
      user.status = 'online';
    });
  };
  // Decline invite button handler
  var declineInvitation = function(event) {
    var declineButtonEl = $(this),
        alertEl = declineButtonEl.parents('.alert');
    declineButtonEl.attr('disabled', 'disabled');

    var chatSessionId = alertEl.data('chatSessionId');

    log.info('Declining invitation to chat with session ID', chatSessionId);

    var declineInviteSignal = {
      type: 'chatDecline',
      // TODO: NON-STANDARD
      to: presenceSession.connections.get(invitedChats[chatSessionId].inviter.presenceConnectionId)
    };
    presenceSession.signal(declineInviteSignal, function(err) {
      if (err) {
        // TODO: surface error
        log.error('Failed to send invitation declining signal');
        return;
      }
      alertEl.remove();
    });
  };
  // Accept invite button handler
  var acceptInvitation = function(event) {
    var acceptButtonEl = $(this),
        alertEl = acceptButtonEl.parents('.alert');

    var chatSessionId = alertEl.data('chatSessionId');
    currentChat = invitedChats[chatSessionId];
    if (currentChat === undefined) {
      log.error('Invitation acceptance failed, chatSessionId not found in invitedChats');
      return;
    }
    delete invitedChats[chatSessionId];
    alertEl.remove();

    log.info('Accepting invitation to chat', currentChat);

    $('.invite-decline').trigger('click');
    if (user.status === 'invitePending') {
      $('invite-cancel').trigger('click');
    }

    user.status = 'chatting';

    connectToChat();
  };
  // Invite signal hander
  // TODO: factor out response handler functions
  var inviteReceived = function(event) {
    log.info('Received chat invitation from connection ID:', event.from.connectionId);

    var inviter = userList[event.from.connectionId];
    if (inviter === undefined) {
      // TODO: surface an error
      log.error('Inviter not found in user list');
      return;
    }
    inviter.presenceConnectionId = event.from.connectionId;
    log.info('Inviter', inviter);

    var signalData = JSON.parse(event.data),
        chatSessionId = signalData.chatSessionId;
    if (chatSessionId === undefined) {
      log.error('Chat session ID not found in signal');
      return;
    }

    if (user.status !== 'online' && user.status !== 'invitePending') {
      var declineSignal = {
        type: 'chatDecline',
        to: event.from
      };
      presenceSession.signal(declineSignal, function(err) {
        if (err) {
          log.error('Failed to send invitation decline signal', err.reason);
          return;
        }
        log.info('Declined invitation');
      });
      log.warn('Recieved an invitation but cannot accept becuse status is \'' + user.status + '\'');
      return;
    }

    $.get('/chats', { chatSessionId: chatSessionId })
      .done(function(data) {
        log.info('Retrieved chat');

        var newChat = data;
        newChat.inviter = inviter;
        invitedChats[newChat.chatSessionId] = newChat;
        // wait for user to 'accept' or 'decline' in the UI
        invitationInfoEl.append(receiveInviteTemplate({ chat: newChat }));
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        // TODO: surface an error
        log.error('Error retrieving chat');
      });
  };
  // Invite cancelled signal handler
  var inviteCancelled = function(event) {
    log.info('Invitation to chat has been cancelled by user at connection ID: ' + event.from.connectionId);
    // Find the chat associated with the inviter who is now cancelling
    var cancelledChat = _.find(invitedChats, function(chat) { 
      return (chat.inviter.presenceConnectionId === event.from.connectionId);
    });
    // Remove invitation alert from DOM
    $('.alert[data-chat-session-id=' + cancelledChat.chatSessionId + ']').remove();
    // Remove chat from invitedChats
    delete invitedChats[cancelledChat.chatSessionId];
  };
  // Chat declined signal handler
  var chatDeclined = function(event) {
    log.info('Invitation to chat has been declined by user at connection ID:' + event.from.connectionId);
    currentChatSession.disconnect();
    // If the chat invite was declined quickly (like when the other user was not 'online' or
    // 'invitePending'), the currentChatSession never connected so the disconnect handler doesn't
    // set the status back to 'online'. Just to be certain, we set it back here too.
    user.status = 'online';
    $('.invite-cancel').parents('.alert').remove();
    currentChat = undefined;
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
    currentChatSession.on('connectionCreated', chatConnectionCreated);
    currentChatSession.on('connectionDestroyed', chatConnectionDestroyed);
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
    user.status = 'online';
    // TODO: cleanup UI
  };
  var chatStreamCreated = function(event) {
    log.info('Chat session stream created');
  };
  var chatStreamDestroyed = function(event) {
    log.info('Chat session stream destroyed');
  };
  var chatConnectionCreated = function(event) {
    // If this user is an inviter, set the status to chatting (invitee did this when they accepted)
    if (currentChat.inviterToken !== undefined && event.connection.connectionId !== currentChatSession.connection.connectionId) {
      user.status = 'chatting';
      $('.invite-cancel').parents('.alert').remove();
    }
  };
  var chatConnectionDestroyed = function(event) {
    // If the other participant leaves, the chat is done.
    if (event.connection.connectionId !== currentChatSession.connection.connectionId) {
      currentChatSession.disconnect();
    }
  };

  // Initialization function
  var init = function() {
    // Populate DOM references with queries
    connectModalEl = $('#connect-modal');
    connectFormEl = $('#connect-form');
    connectFormButtonEl = $('#connect-form-btn');
    connectFormUsernameEl = $('#connect-form-username');
    userListEl = $('#user-list');
    userInfoEl = $('#user-info');
    invitationInfoEl = $('.invitation-info');

    // Populate Templates
    userListTemplate = _.template($('#tpl-user-list').html());
    userInfoTemplate = _.template($('#tpl-user-info').html());
    sendInviteTemplate = _.template($('#tpl-send-invite').html());
    receiveInviteTemplate = _.template($('#tpl-receive-invite').html());

    // DOM initialization
    connectModalEl.modal('show');
    connectModalEl.on('shown.bs.modal', function() {
      connectFormUsernameEl.focus();
    });
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
    invitationInfoEl.on('click', '.invite-cancel', cancelInvitation);
    invitationInfoEl.on('click', '.invite-decline', declineInvitation);
    invitationInfoEl.on('click', '.invite-accept', acceptInvitation);


    // Attach other event handlers
    presenceSession.on('sessionConnected', presenceSessionConnected);
    presenceSession.on('sessionDisconnected', presenceSessionDisconnected);
    presenceSession.on('connectionCreated', userCameOnline);
    presenceSession.on('connectionDestroyed', userWentOffline);
    presenceSession.on('signal:chatInvite', inviteReceived);
    presenceSession.on('signal:chatInviteCancel', inviteCancelled);
    presenceSession.on('signal:chatDecline', chatDeclined);
  };

  // Once the DOM is ready we can initialize
  $(document).ready(function() {
    init();
  });

}(window, document, jQuery, _, OT, opentokConfig, constConfig, log));
