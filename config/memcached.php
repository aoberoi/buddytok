<?php

/* -----------------------------------------------------------------------------------------------
 * Memcached Default Configuration
 *
 * This configuration is used as fallback when no other environment has been chosen. As a default,
 * the values are read from the environment variables, and there is no need to change this file.
 * -----------------------------------------------------------------------------------------------*/

use \Memcached;

require_once '../lib/helpers.php';

return array(
    'servers' => parseMemcachedServers(getenv('MEMCACHIER_SERVERS')),
    'sasl' => array(
        'username' => getenv('MEMCACHIER_USERNAME'),
        'password' => getenv('MEMCACHIER_PASSWORD')
    ),
    'options' => array(
        Memcached::OPT_BINARY_PROTOCOL => TRUE,
        Memcached::OPT_NO_BLOCK => TRUE,
        Memcached::OPT_AUTO_EJECT_HOSTS => TRUE,
        Memcached::OPT_CONNECT_TIMEOUT => 2000,
        Memcached::OPT_POLL_TIMEOUT => 2000,
        Memcached::OPT_RETRY_TIMEOUT => 2
    )
);
