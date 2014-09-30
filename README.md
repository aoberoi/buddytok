# BuddyTok

An OpenTok 1-to-1 solution focussed on adding presence to an application


## Installation

1. Clone the repository.

2. Copy the `config/development/opentok.php.sample` file to `config/development/opentok.php` and
   replace the `key` and `secret` settings with your OpenTok API key and secret, from the [TokBox
   Dashboard](https://dashboard.tokbox.com). Also, generate one relayed session (you may use the
   Project Tools in the Dashboard) and use the Session ID to replace the`presenceSession` setting.

3. Use [Composer](https://getcomposer.org/) to install dependencies: `composer install`

4. Set the document root for your web server (such as Apache, nginx, etc.) to the `web` directory
   of this project. In the case of Apache, the provided `web\.htaccess` file handles URL rewriting.
   See the [Slim Route URL Rewriting Guide](http://docs.slimframework.com/#Route-URL-Rewriting)
   for more details.

## Usage

1. Visit the URL mapped to the application by your webserver.

2. Input a name to be identified with. You will now see a list of available users, which will start
   as empty.

3. Have another user (possibly in another window or tab) visit the same URL, and input a new user
   name.

   Each of the users will see one another in the Buddy List.

4. In order to start a chat with a user who is available, click the "invite" button next to their name.

   A user who has sent an invitation cannot receive invitations from other users. Unavailable users
   do not have an "invite" button next to their name.

   While waiting for a response to an invitation, the user can use the "cancel" button to stop the
   invitation.

5. An invited user will recieve an invitation to chat, which they can either accept or decline.
   If accepted, the chat will begin. If declined, the invitation will disappear.

   An invited user can continue to receive invitations from other users. If any of the invitations 
   are accepted, all other invitations are automatically declined.

6. Once either of the users chooses to "end chat," both users will return to being available.

## Code and Conceptual Walkthrough

### Technologies

This application uses some of the same frameworks and libraries as the
[HelloWorld](https://github.com/opentok/OpenTok-PHP-SDK/tree/master/sample/HelloWorld) sample. If
you have not already gotten familiar with the code in that project, consider doing so before
continuing. Slim is a minimalistic PHP framework, so its patterns can be applied to other
frameworks and even other languages.

In addition, the [Backbone.js](http://documentcloud.github.io/backbone/) library is used for client
side functionality. It is a basic MV* library, and while its helpful in laying some groundwork for
the client, the same functionality could be achieved with other libraries and frameworks or even
with no framework at all. Along with Backbone, the client makes use of its dependencies:
[jQuery](http://jquery.com/), and [Lodash](http://lodash.com/). Lodash is a library that is
compatible with Underscore.js but has better performance, and its also used for view templating.

Lastly, [Bootstrap](http://getbootstrap.com/) is used to help style the UI and for reusable
components such as buttons and modals.

### Concepts

In order to achieve the presence functionality, each user needs to be aware of the state of each of
the other users. In this implementation, we approach this from a distributed point of view, which
means there is no central authority required so there's less overhead in storing each users state.
The implementation requires a basic messaging channel where each user can be addressed as well as
the whole group. OpenTok includes that exact funtionality for clients via the Session. With that
said, we solve many of the presence problems in this application using a **presence session**,
a global static session which every client can connect to in order to communicate presence
information and where no video streaming is ever done.

The presence session helps each client build a list of the other users of the application, and keep
it syncrhonized as those users' state changes. A **remote user** is the representation of another
user and its state. This list of remote users is called the **buddy list**.

A **local user** is the user who is using the application at an individual client. While a remote
user representation of a user may only expose what is essential for all the other clients to
know in order to service the rest of the application, the local user representation of the same
user may have more details. One example is a user who has invited another user to a chat and is
waiting for the invitation to be accepted and a user who is actively chatting both appear identital
in their remote user representation on other clients (unavailable) while being in two different
states in their local user representation (outgoingInvitePending and chatting, respectively).

With the state of each remote user visible in the buddy list, the actual service that the rest of
the application uses that information for is to conduct one-to-one chats. These chats begin as an
**invitation** from one user to another. The client who is creating the invitation is in charge of
creating the new chat by requesting it from the server. At the time an invitation is created,
another OpenTok session needs to be created for the video streaming of the chat. The **chat**
contains the OpenTok session ID, API Key, and token for a user that is communicating with another
user. Once the invitation is accepted, the invited user must also request the same chat from the
server, and the server response will contain the same chat information but with a unique token.
Once both parties have this chat, they can connect to it and begin to communicate in a session that
functions much like the Hello World sample.

### Server

The server responds in a RESTful manner to a few different paths. Each path is given its own handler
in the Slim application and is individually described below:

*  `GET /presence` -- The server returns the API key and the session ID for the presence session as
   a JSON encoded response. Notably, the token is not generated. 

*  `POST /users` -- In order for a user to connect to the presence session, they must post the
   required details about themselves to this endpoint. In this case, the required details just
   include a JSON encoded `name`. Its in this handler that the token is generated because the server
   uses OpenTok token's connection data feature to store the name of the user in the token. The
   distinction between the name and the other state (which is sent over the presence session) is
   that the name never changes, so its ideal for storing in the connection data. Also, note that the
   token is given the role `Role::SUBSRCIBER`. This is because no users are allowed to publish into
   the presence session nor are there any streams to subscribe to. If you were interested in adding
   authentication and starting a session for the user, this would be the right handler to create the
   session within.

*  `POST /chats` -- When a user chooses to invite another user to a chat, it recieves its the chat's
   representation from this handler. In this handler, the OpenTok SDK is used to create a new
   session, and return its ID and the details required to connect to it (API key and token). The
   token is unique and not shared between both participants of the chat. Since there is no
   authentication in this application, there is no opportunity to perform authorization for the
   chat. If there was, this handler would be the right place to create a record for the chat in
   a database and then when the invited user were to request the chat data authorization could be
   performed to make sure the requesting user is the invited user for that chat.

*  `GET /chats?sessionId=[sessionId]` -- When the invited user accepts an invitation, it also needs
   the details required to connect to the chat. Since there is no authentication in this
   application, and there are no database records for each chat that is created, the invited user is
   expected to know the sessionId of the chat they want to join already and send it as a query
   string parameter. The handler then returns the same details required to connect to the chat
   (session ID, API Key, token) but with another unique token.

### Client

The client code is divided into separate files that each define a "class". Each one object has some
responsibilities and they are described in detail below.

#### App (web/js/app.js)

This is the main starting point for the application. Its main responsibilities are:
*  initialize all the models and views that are necessary at start up
*  retrieve the presence session on behalf of the other objects that require it
*  allow for event dispatching for decoupled components to communicate with one another

This file exports a global variable `App` that contains properties for the views and models it
creates.


### Connect Modal View (web/js/views/ConnectModalView.js)

The Connect Modal View is responsible for gathering the user details required to connect to the
presence session, and then connecting to it.

The implementation wraps the interface for the basic Bootstrap modal. Within the modal, a form is
used to collect the user name from the user.

This view uses the LocalUser instance as the model to back it. The model assists in validation and
sending the data to the server. Once the server responds with the presence session data, the local
user connects to the presence session, which causes the local user's status to change. When the
modal observes the status changing to 'online', it is dismissed.


### Local User (web/js/models/LocalUser.js)

The Local User's main responsibilities are: 
*  storing and managing state about the user who is connecting to the application
*  requesting presence session details from the server and validating
*  updating other users with its state via the presence session
*  notify and allow other objects to query for its state

## Requirements

*  PHP 5.3 or greater

## What's Missing

There are some concepts that are intentionally left out.

*  User authentication and authorization: Typically, before allowing a user to access a session you
   would want to ask them to identify themselves through a registration and authentication process. 
   Then, before allowing access to the session the server would authorize the user, often times by
   checking a session cookie. This sample is open to anonymous access and doesn't intend to add those
   concepts.

*  Background and push notifications.

*  State persistence

*  Mobile clients

## Appendix

### Deploying to Heroku

Heroku is a PaaS (Platform as a Service) that can be used to deploy simple and small applications
for free. For that reason, you may choose to experiment with this code and deploy it using Heroku.

*  The provided `Procfile` decribes a web process which can launch this application.

*  User Heroku config to set the following keys:

   -  `OPENTOK_KEY` -- Your OpenTok API Key
   -  `OPENTOK_SECRET` -- Your OpenTok API Secret
   -  `OPENTOK_PRESENCE_SESSION` - A Relayed Session ID that is used exclusively for presence in the
      application.
   -  `SLIM_MODE` -- Set this to `production` when the environment variables should be used to
      configure the application. The Slim application will only start reading its Heroku config when
      its mode is set to `'production'`

   You should avoid commiting configuration and secrets to your code, and instead use Heroku's
   config functionality.

