<?php

// Composer autoloader
$autoloader = __DIR__.'/../vendor/autoload.php';
if (!file_exists($autoloader)) {
  die('You must run `composer install` in the sample app directory');
}
require_once $autoloader;

use \Slim\Slim;

// Slim application
$app = new Slim(array(
    'templates.path' => '../templates'
));


// Routing
$app->get('/foo', function () use ($app) {
    $app->render('foo.php', array(
        'foo' => 'bar'
    ));
});

// Initialization
$app->run();
