<?php

// Composer autoloader
$autoloader = __DIR__.'/../vendor/autoload.php';
if (!file_exists($autoloader)) {
  die('You must run `composer install` in the sample app directory');
}
require_once $autoloader;

// Import classes
use \Slim\Slim;
use \OpenTok\OpenTok;
use \werx\Config\Providers\ArrayProvider;
use \werx\Config\Container;

// Slim application
$app = new Slim(array(
    'templates.path' => '../templates'
));

// Configuration
$provider = new ArrayProvider('../config');
$config = new Container($provider);
// Environment Selection
// TODO: perhaps switch which mode should be explicitly conifigured, since development is already
// the default and we know its set for free...?
$app->configureMode('development', function () use ($config) {
    $config->setEnvironment('development');
});
$config->load(['opentok'], true);

// Routing
$app->get('/foo', function () use ($app, $config) {
    $opentok = new OpenTok($config->opentok('key'), $config->opentok('secret'));
    $session = $opentok->createSession();
    $app->render('foo.php', array(
        'sessionId' => $session->getSessionId(),
        'token' => $session->generateToken()
    ));
});

// Initialization
$app->run();
