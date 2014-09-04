/* -----------------------------------------------------------------------------------------------
 * BuddyTok
 * ----------------------------------------------------------------------------------------------*/
// Explicitly declare dependencies and prevent leaking into global scope
(function(window, document, $, OT, otConfig, undefined) {

  // Global state
  var user = {};
  var presenceSession = null;

  // Initialization function
  function init() {
    user.connected = false;
    presenceSession = OT.initSession(otConfig.apiKey, otConfig.sessionId);

    $('#connectModal').modal('show');
  }

  // Once the DOM is ready we can initialize
  $(document).ready(function() {
    init();
  });

}(window, document, jQuery, OT, opentokConfig));
