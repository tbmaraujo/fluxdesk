<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default PDF Engine
    |--------------------------------------------------------------------------
    |
    | This option controls the default PDF engine that will be used to
    | generate PDF files.
    |
    */

    'default' => env('PDF_ENGINE', 'browsershot'),

    /*
    |--------------------------------------------------------------------------
    | Browsershot Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the Browsershot engine for generating PDFs.
    |
    */

    'browsershot' => [
        'chrome_path' => env('CHROME_PATH', '/home/thiago/.cache/puppeteer/chrome-headless-shell/linux-141.0.7390.122/chrome-headless-shell-linux64/chrome-headless-shell'),
        'node_path' => env('NODE_PATH', '/usr/bin/node'),
        'npm_path' => env('NPM_PATH', '/usr/bin/npm'),
        'timeout' => env('BROWSERSHOT_TIMEOUT', 60),
        'disable_javascript' => false,
        'no_sandbox' => env('BROWSERSHOT_NO_SANDBOX', true), // Necessário em alguns ambientes
        'disable_gpu' => true,
    ],
];

