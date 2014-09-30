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

A **local user** is the user who using the application at an individual client. While a the remote
user representation of a user may only expose what is essential for all the other clients to know
in order to service the rest of the application, the local user may have more details.  One example
is that a user who has invited another user to a chat and is waiting for the invitation to be
accepted and a user who is actively chatting both appear identital in their remote user
representation on other clients: unavailable.

With the state of each remote user visible in the buddy list, the actual service that the rest of
the application uses that information for is to conduct one-to-one chats. These chats start off
as an **invitation** from one user to another. At the time an invitation is created, another OpenTok
session needs to be created for the video streaming of the chat. The client who is creating the
invitation is in charge of creating the new chat by requesting it from the server. The **chat**
contains the OpenTok session ID, API Key, and token for a user that is communicating with another
user. Once the invitation is accepted, the invited user must also request the same chat from the
server, and the server response will contain the same chat information but with a unique token.
Once both parties have this chat, they can connect to it and begin to communicate in a session that
functions much like the Hello World sample.

### Server



### Client

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

