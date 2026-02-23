<?php

return [
    /*
    |--------------------------------------------------------------------------
    | ParamPOS API Credentials
    |--------------------------------------------------------------------------
    |
    | These credentials are provided by Param. Do not hardcode them here;
    | always use environment variables.
    |
    */

    'client_code' => env('PARAMPOS_CLIENT_CODE', ''),
    'client_username' => env('PARAMPOS_CLIENT_USERNAME', ''),
    'password' => env('PARAMPOS_PASSWORD', ''),
    'guid' => env('PARAMPOS_GUID', ''),

    /*
    |--------------------------------------------------------------------------
    | ParamPOS API Mode
    |--------------------------------------------------------------------------
    |
    | Set to 'test' for development and testing. Set to 'production' for live.
    |
    */
    'mode' => env('PARAMPOS_MODE', 'test'),

    /*
    |--------------------------------------------------------------------------
    | ParamPOS API Endpoints
    |--------------------------------------------------------------------------
    */
    'endpoints' => [
        'test' => 'https://test-api.param.com.tr', // Example test endpoint
        'production' => 'https://posws.param.com.tr', // Example prod endpoint, adjust based on actual docs
    ]
];
