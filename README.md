# BuddyTok

An OpenTok 1-to-1 solution focussed on adding Presence to an application


## Installation

1. Clone the repository.
1. Copy the `config/development/opentok.php.sample` file to `config/development/opentok.php` and
   use your own values for the `key` and `secret` from the [TokBox
   Dashboard](https://dashboard.tokbox.com). Also, generate one relayed session (you can use the
   Project Tools in the Dashboard for this) and use the Session ID as the value for the
   `presenceSession`.
1. Use [Composer](https://getcomposer.org/) to install dependencies: `composer install`
1. Use a webserver (such as Apache, nginx, etc) to the `web` directory as the document root. In the
   case of Apache, the provided `.htaccess` file will help properly handle URL rewriting. See the
   [Slim Route URL Rewriting Guide](http://docs.slimframework.com/#Route-URL-Rewriting) for more
   detail.

## Usage

1. Visit the URL mapped to the application by your webserver.
1. Input a name to be identified with. You will now see a list of available users, which will start
   as empty.
1. Have another user (possibly in another window or tab) visit the same URL and input a name to be
   identified with.
1. Observe that each of the users are able to see one another as "online".
1. In order to start a chat with a user who is online, click the "invite" button next to their name.
1. An invited user will recieve an invitation to chat, which they can either "accept" or "decline"
   and if "accepted", the chat will begin.
1. Once either of the users chooses to "end chat", both users will return to the list of users.
1. You may change your status to "away" using the menu. If you do so, your status will change from
   "online" to "away" in all other users' list. An "away" user cannot recieve invitations.

## Requirements

*  **TODO**

## What's Missing

There are some concepts that are intentionally left out.

*  User authentication and authorization: Typically, before allowing a user to access a session you
   would want to ask them to identify themselves through a signup process. This could be verified
   using an email address or some other type of identification. Then, before allowing access to the
   session (by generating a token or even the page on which they would land) the server would
   authorize the user, often times by checking a session cookie. This sample is open to anonymous
   access and doesn't intend to add those concepts.

*  Background notification

*  Mobile

*  State persistence

## Code and Conceptual Walkthrough

*  **TODO**

## TODOs

*  Testing?
*  Separate boilerplate from actual substance (routing) in `web/index.php`
*  script to generate presence session, perhaps on build for heroku
*  synchronize client assets using something like bower?
*  lower log level when done with development
*  rename variables for consistency
   -  should we use css classes instead of super-high-specificity id's?
*  problems with code structure
   -  should we separate by visual component (eg. connectForm, userList, userInfo, currentChat, invite, etc)?
   -  as soon as we separate, we need to establish how objects communicate (eg. event bus,
      dependency injection, DOM events, etc)
*  add `/about` page
*  add a connected/disconnected icon to the user info
*  add statuses (see some comments in code), also add dropdown UI to user info
*  possibly add a landing page so that the user has some idea of what they are doing before they use
   the app
*  allow for shared configuration (such as validation parameters) between the server and the client.
*  run this through jshint with javascript style guideline

## Appendix

### Deploying to Heroku

Heroku is a PaaS (Platform as a Service) that makes deploying applications simple and for smaller
applications free. For that reason, you may choose to experiment with this code  and deploy it using
Heroku.

*  The provided `Procfile` already decribes a web process which can launch this application.
*  You should avoid commiting configuration and secrets to your code, and instead use Heroku's
   config functionality.
*  In order to configure the OpenTok details you need to set the following keys:
   -  `OPENTOK_KEY` - Your OpenTok API Key
   -  `OPENTOK_SECRET` - Your OpenTok API Secret
   -  `OPENTOK_PRESENCE_SESSION` - A Relayed Session ID that is used exclusively for presence in the
      application.
*  The Slim application will only start reading its Heroku's config when its mode is set to
   `'production'`. This can be done using Heroku config by setting the following key:
   -  `SLIM_MODE` - Set this to `production` when the environment variables should be used to
      configure the application.
