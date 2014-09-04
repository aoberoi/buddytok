# BuddyTok

An OpenTok 1-to-1 solution focussed on adding Presence to an application


## Installation

1. Clone the repository.
1. Copy the `config/development/opentok.php.sample` file to `config/development/opentok.php` and
   replace the key and secret with your own values from the [TokBox
   Dashboard](https://dashboard.tokbox.com)
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

## Code and Conceptual Walkthrough

*  **TODO**

## TODOs

## Appendix

### Deploying to Heroku

Heroku is a PaaS (Platform as a Service) that makes deploying applications simple and for smaller
applications free. For that reason, you may choose to experiment with this code  and deploy it using
Heroku.

*  The provided `Procfile` already decribes a web process which can launch this application.
*  You should avoid commiting configuration and secrets to your code, and instead use Heroku's
   config functionality. In order to configure the OpenTok details you need to set the following
   keys:
   -  `OPENTOK_KEY` - Your OpenTok API Key
   -  `OPENTOK_SECRET` - Your OpenTok API Secret
*  The Slim application will only start reading its Heroku's config when its mode is set to
   `'production'`. This can be done using Heroku config by setting the following key/value:
   -  `SLIM_MODE` - Set this to `'production'` when the environment variables should be used to
      configure the application.
