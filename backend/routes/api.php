<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Transactions
    Route::get('/transactions', [\App\Http\Controllers\Api\TransactionController::class, 'index']);
    Route::post('/transactions', [\App\Http\Controllers\Api\TransactionController::class, 'store']);
    Route::get('/transactions', [\App\Http\Controllers\Api\TransactionController::class, 'index']);
    Route::post('/transactions', [\App\Http\Controllers\Api\TransactionController::class, 'store']);
    Route::put('/transactions/{id}/status', [\App\Http\Controllers\Api\TransactionController::class, 'updateStatus']);

    // Dashboard
    Route::get('/dashboard/stats', [\App\Http\Controllers\Api\DashboardController::class, 'index']);

    // Students
    Route::post('/students/import', [\App\Http\Controllers\Api\StudentController::class, 'import']);
    Route::apiResource('students', \App\Http\Controllers\Api\StudentController::class);

    // Training Programs
    Route::get('/training-programs', [\App\Http\Controllers\Api\TrainingProgramController::class, 'index']);
    Route::post('/training-programs', [\App\Http\Controllers\Api\TrainingProgramController::class, 'store']);

    // Certificates
    Route::get('/certificates', [\App\Http\Controllers\Api\CertificateController::class, 'index']);
    Route::post('/certificates', [\App\Http\Controllers\Api\CertificateController::class, 'store']);
    Route::put('/certificates/{id}/status', [\App\Http\Controllers\Api\CertificateController::class, 'updateStatus']);
    Route::get('/certificates/{id}/download', [\App\Http\Controllers\Api\CertificateController::class, 'download']);
    Route::get('/certificate-templates', [\App\Http\Controllers\Api\CertificateTemplateController::class, 'index']);
    Route::post('/certificate-templates', [\App\Http\Controllers\Api\CertificateTemplateController::class, 'store']);
    Route::put('/certificate-templates/{id}', [\App\Http\Controllers\Api\CertificateTemplateController::class, 'update']);
    Route::delete('/certificate-templates/{id}', [\App\Http\Controllers\Api\CertificateTemplateController::class, 'destroy']);

    // Dealers
    Route::get('/dealers', [\App\Http\Controllers\Api\DealerController::class, 'index']);
    Route::put('/dealers/{id}/status', [\App\Http\Controllers\Api\DealerController::class, 'updateStatus']);
    Route::get('/dealers/{id}/templates', [\App\Http\Controllers\Api\DealerController::class, 'getTemplates']);
    Route::post('/dealers/{id}/templates', [\App\Http\Controllers\Api\DealerController::class, 'assignTemplate']);
    Route::delete('/dealers/{id}/templates/{templateId}', [\App\Http\Controllers\Api\DealerController::class, 'revokeTemplate']);
});

// Public Routes
Route::get('/certificates/verify/{hash}', [\App\Http\Controllers\Api\CertificateController::class, 'verify']);
