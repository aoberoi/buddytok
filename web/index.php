<?php

/* ------------------------------------------------------------------------------------------------
 * Composer Autoloader
 * -----------------------------------------------------------------------------------------------*/
require_once __DIR__.'/../vendor/autoload.php';

/* ------------------------------------------------------------------------------------------------
 * Class Imports
 * -----------------------------------------------------------------------------------------------*/
use \Slim\Slim;
use \Slim\Views\Twig;
use \OpenTok\OpenTok;
use \werx\Config\Providers\ArrayProvider;
use \werx\Config\Container;
use \Memcached;

/* ------------------------------------------------------------------------------------------------
 * Slim Application Initialization
 * -----------------------------------------------------------------------------------------------*/
$app = new Slim(array(
    'log.enabled' => true,
    'templates.path' => '../templates',
    'view' => new Twig()
));

/* ------------------------------------------------------------------------------------------------
 * Configuration
 * -----------------------------------------------------------------------------------------------*/
$provider = new ArrayProvider('../config');
$config = new Container($provider);

// Environment Selection
$app->configureMode('development', function () use ($config) {
    $config->setEnvironment('development');
});

$config->load(['opentok', 'memcached'], true);

/* ------------------------------------------------------------------------------------------------
 * Storage Initialization
 * -----------------------------------------------------------------------------------------------*/
$storage = new Memcached('memcached_pool');
$storage->setOptions($config->memcached('options', array()));
if (is_array($config->memcached('sasl'))) {
    $storage->setSaslAuthData($config->memcached('options')['username'],
                              $config->memcached('options')['password']);
}
if (!$storage->getServerList()) {
    $storage->addServers($config->memcached('servers'));
}


/* ------------------------------------------------------------------------------------------------
 * OpenTok Initialization
 * -----------------------------------------------------------------------------------------------*/
$opentok = new OpenTok($config->opentok('key'), $config->opentok('secret'));
if (!($presenceSessionId = $storage->get('presenceSessionId'))) {
    $presenceSessionId = $opentok->createSession()->getSessionId();
    $storage->set('presenceSessionId', $presenceSessionId);
    $app->log->debug('New Presence Session created: ' . $presenceSessionId);
}

/* ------------------------------------------------------------------------------------------------
 * Routing
 * -----------------------------------------------------------------------------------------------*/
$app->get('/', function () use ($app, $config, $presenceSessionId) {
    $app->render('index.html', array(
        'apiKey' => $config->opentok('key'),
        'sessionId' => $presenceSessionId,
    ));
});

$app->post('/user', function () use ($app, $opentok, $presenceSessionId) {
    $app->response->headers->set('Content-Type', 'application/json');
    // TODO: enforce uniqueness on names?
    $token = $opentok->generateToken($presenceSessionId, array(
        'data' => json_encode(array( 'name' => $app->request->params('name') ))
    ));
    $responseData = array( 'token' => $token );
    $app->response->setBody(json_encode($responseData));
});

/* ------------------------------------------------------------------------------------------------
 * Application Start
 * -----------------------------------------------------------------------------------------------*/
$app->run();
