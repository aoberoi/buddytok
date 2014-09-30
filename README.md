# BuddyTok

An OpenTok 1-to-1 solution focussed on adding presence to an application


## Installation

1. Clone the repository.

2. Copy the `config/development/opentok.php.sample` file to `config/development/opentok.php` and
   replace the `key` and `secret` settings with your OpenTok API key and secret, from the [TokBox
   Dashboard](https://dashboard.tokbox.com). Also, generate one relayed session (you may use the
   Project Tools in the Dashboard) and use the Session ID to replace the`presenceSession` setting.

3. Use [Composer](https://getcomposer.org/) to install dependencies: `composer install`

4. Set the document root for your web server (such as Apache, nginx, etc.) to the root directory
   of this project. In the case of Apache, the provided `.htaccess` file handles URL rewriting.
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

## Requirements

*  **TODO**

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


## Code and Conceptual Walkthrough

*  **TODO**

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

