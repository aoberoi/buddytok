<?php

/* -----------------------------------------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------------------------------------*/

function parseMemcachedServers($serverString)
{
    $serversArray = array();
    $servers = explode(",", $serverString);
    foreach ($servers as $s) {
        $serversArray[] = explode(":", $s);
    }
    return $serversArray;
}

