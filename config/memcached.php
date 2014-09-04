<?php

/* -----------------------------------------------------------------------------------------------
 * Memcached Default Configuration
 *
 * This configuration is used as fallback when no other environment has been chosen. As a default,
 * the values are read from the environment variables, and there is no need to change this file.
 * -----------------------------------------------------------------------------------------------*/

use \Memcached;

function parseServers($serverString)
{
    $serversArray = array();
    $servers = explode(",", $serverString);
    foreach ($servers as $s) {
        $serversArray[] = explode(":", $s);
    }
    return $serversArray;
}

return array(
    'servers' => parseServers(getenv('MEMCACHIER_SERVERS')),
    'sasl' => array(
        'username' => getenv('MEMCACHIER_USERNAME'),
        'password' => getenv('MEMCACHIER_PASSWORD')
    ),
    'options' => array(
        array(Memcached::OPT_BINARY_PROTOCOL, TRUE),
        array(Memcached::OPT_NO_BLOCK, TRUE),
        array(Memcached::OPT_AUTO_EJECT_HOSTS, TRUE),
        array(Memcached::OPT_CONNECT_TIMEOUT, 2000),
        array(Memcached::OPT_POLL_TIMEOUT, 2000),
        array(Memcached::OPT_RETRY_TIMEOUT, 2)
    )
);
