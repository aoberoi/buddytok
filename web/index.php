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

/* ------------------------------------------------------------------------------------------------
 * Slim Application Initialization
 * -----------------------------------------------------------------------------------------------*/
$app = new Slim(array(
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

$config->load(['opentok'], true);

/* ------------------------------------------------------------------------------------------------
 * OpenTok Initialization
 * -----------------------------------------------------------------------------------------------*/
$opentok = new OpenTok($config->opentok('key'), $config->opentok('secret'));

/* ------------------------------------------------------------------------------------------------
 * Routing
 * -----------------------------------------------------------------------------------------------*/
$app->get('/', function () use ($app, $config, $opentok) {
    $session = $opentok->createSession();
    $app->render('index.html', array(
        'apiKey' => $config->opentok('key'),
        'sessionId' => $session->getSessionId(),
        'token' => $session->generateToken()
    ));
});

$app->post('/user', function () use ($app, $opentok) {
    $app->response->headers->set('Content-Type', 'application/json');
    // TODO: enforce uniqueness on names?
    $token = $opentok->generateToken($app->request->params('sessionId'), array(
        'data' => json_encode(array( 'name' => $app->request->params('name') ))
    ));
    $responseData = array( 'token' => $token );
    $app->response->setBody(json_encode($responseData));
});

/* ------------------------------------------------------------------------------------------------
 * Application Start
 * -----------------------------------------------------------------------------------------------*/
$app->run();
