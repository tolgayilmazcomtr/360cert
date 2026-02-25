<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    // Find the first certificate
    $cert = \App\Models\Certificate::first();
    if (!$cert) { echo "No certificates found.\n"; exit; }
    
    // Create an instance of the controller
    $controller = new \App\Http\Controllers\Api\CertificateController();
    $response = $controller->downloadIdCard($cert->id);
    
    // Dump response status
    echo "Status code: " . $response->getStatusCode() . "\n";
    if ($response->getStatusCode() == 500) {
        echo "Response content:\n";
        echo $response->getContent() . "\n";
    } else {
        echo "Success, generated PDF.\n";
    }
} catch (\Throwable $e) {
    echo "EXCEPTION THROWN OUTSIDE TRY/CATCH:\n";
    echo $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
