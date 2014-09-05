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

$config->load(array('opentok'), true);

/* ------------------------------------------------------------------------------------------------
 * OpenTok Initialization
 * -----------------------------------------------------------------------------------------------*/
$opentok = new OpenTok($config->opentok('key'), $config->opentok('secret'));

/* ------------------------------------------------------------------------------------------------
 * Routing
 * -----------------------------------------------------------------------------------------------*/
$app->get('/', function () use ($app, $config) {
    $app->render('index.html', array(
        'apiKey' => $config->opentok('key'),
        'sessionId' => $config->opentok('presenceSession')
    ));
});

// NOTE: there is no enforced uniqueness on 'name' values for users
$app->post('/user', function () use ($app, $opentok, $config) {
    // TODO: validation
    $token = $opentok->generateToken($config->opentok('presenceSession'), array(
        'data' => json_encode(array( 'name' => $app->request->params('name') ))
    ));
    $responseData = array( 'token' => $token );

    $app->response->headers->set('Content-Type', 'application/json');
    $app->response->setBody(json_encode($responseData));
});

/* ------------------------------------------------------------------------------------------------
 * Application Start
 * -----------------------------------------------------------------------------------------------*/
$app->run();

