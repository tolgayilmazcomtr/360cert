<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SystemSettingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Temporary route for debugging cert types
Route::get('/test-cert-types', function() {
    return response()->json(\App\Models\CertificateType::all());
});

// Public API Routes
Route::get('/public/settings', [SystemSettingController::class, 'index']);
Route::get('/public/certificates/search', [\App\Http\Controllers\Api\CertificateController::class, 'searchByNo']);
Route::get('/public/certificates/search-tc', [\App\Http\Controllers\Api\CertificateController::class, 'searchByTc']);
Route::get('/public/pages', [\App\Http\Controllers\Api\PageController::class, 'publicIndex']);
Route::get('/public/pages/{slug}', [\App\Http\Controllers\Api\PageController::class, 'publicShow']);
Route::get('/public/training-programs', [\App\Http\Controllers\Api\TrainingProgramController::class, 'index']);
Route::get('/public/accreditations', [\App\Http\Controllers\Api\AccreditationController::class, 'publicIndex']);

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
    Route::get('/finance/stats', [\App\Http\Controllers\Api\FinanceController::class, 'stats']);

    // Settings
    Route::get('/settings', [SystemSettingController::class, 'index']);
    Route::post('/settings', [SystemSettingController::class, 'update']);

    // Languages
    Route::get('/languages', [\App\Http\Controllers\Api\LanguageController::class, 'index']);
    Route::post('/languages', [\App\Http\Controllers\Api\LanguageController::class, 'store']);
    Route::put('/languages/{id}', [\App\Http\Controllers\Api\LanguageController::class, 'update']);
    Route::delete('/languages/{id}', [\App\Http\Controllers\Api\LanguageController::class, 'destroy']);

    // Students
    Route::post('/students/import', [\App\Http\Controllers\Api\StudentController::class, 'import']);
    Route::apiResource('students', \App\Http\Controllers\Api\StudentController::class);

    // Training Programs
    Route::get('/training-programs', [\App\Http\Controllers\Api\TrainingProgramController::class, 'index']);
    Route::post('/training-programs', [\App\Http\Controllers\Api\TrainingProgramController::class, 'store']);
    Route::post('/training-programs/import', [\App\Http\Controllers\Api\TrainingProgramController::class, 'import']);
    Route::get('/training-programs/import/template', [\App\Http\Controllers\Api\TrainingProgramController::class, 'importTemplate']);
    Route::put('/training-programs/{id}', [\App\Http\Controllers\Api\TrainingProgramController::class, 'update']);
    Route::delete('/training-programs/{id}', [\App\Http\Controllers\Api\TrainingProgramController::class, 'destroy']);

    // Certificate Types
    Route::apiResource('certificate-types', \App\Http\Controllers\Api\CertificateTypeController::class);

    // CMS Pages
    Route::apiResource('pages', \App\Http\Controllers\Api\PageController::class);

    // Accreditations
    Route::apiResource('accreditations', \App\Http\Controllers\Api\AccreditationController::class);

    // Certificates
    Route::get('/certificates', [\App\Http\Controllers\Api\CertificateController::class, 'index']);
    Route::post('/certificates', [\App\Http\Controllers\Api\CertificateController::class, 'store']);
    Route::put('/certificates/{id}/status', [\App\Http\Controllers\Api\CertificateController::class, 'updateStatus']);
    Route::get('/certificates/{id}/download', [\App\Http\Controllers\Api\CertificateController::class, 'download']);
    Route::get('/certificates/{id}/id-card', [\App\Http\Controllers\Api\CertificateController::class, 'downloadIdCard']);
    Route::get('/certificates/{id}', [\App\Http\Controllers\Api\CertificateController::class, 'show']);
    Route::put('/certificates/{id}', [\App\Http\Controllers\Api\CertificateController::class, 'update']);
    Route::delete('/certificates/{id}', [\App\Http\Controllers\Api\CertificateController::class, 'destroy']);
    Route::put('/certificates/{id}/transcript', [\App\Http\Controllers\Api\CertificateController::class, 'saveTranscript']);
    Route::get('/certificates/{id}/transcript/pdf', [\App\Http\Controllers\Api\CertificateController::class, 'downloadTranscriptData']);
    Route::get('/certificate-templates', [\App\Http\Controllers\Api\CertificateTemplateController::class, 'index']);
    Route::post('/certificate-templates', [\App\Http\Controllers\Api\CertificateTemplateController::class, 'store']);
    Route::put('/certificate-templates/{id}', [\App\Http\Controllers\Api\CertificateTemplateController::class, 'update']);
    Route::delete('/certificate-templates/{id}', [\App\Http\Controllers\Api\CertificateTemplateController::class, 'destroy']);

    // Dealers
    Route::get('/dealers', [\App\Http\Controllers\Api\DealerController::class, 'index']);
    Route::post('/dealers', [\App\Http\Controllers\Api\DealerController::class, 'store']);
    Route::put('/dealers/{id}', [\App\Http\Controllers\Api\DealerController::class, 'update']);
    Route::put('/dealers/{id}/status', [\App\Http\Controllers\Api\DealerController::class, 'updateStatus']);
    Route::get('/dealers/{id}/templates', [\App\Http\Controllers\Api\DealerController::class, 'getTemplates']);
    Route::post('/dealers/{id}/templates', [\App\Http\Controllers\Api\DealerController::class, 'assignTemplate']);
    Route::delete('/dealers/{id}/templates/{templateId}', [\App\Http\Controllers\Api\DealerController::class, 'revokeTemplate']);
    
    // Dealer Admin Review Requests
    Route::get('/dealers/update-requests/pending-count', [\App\Http\Controllers\Api\DealerController::class, 'getPendingUpdateRequestsCount']);
    Route::get('/dealers/update-requests', [\App\Http\Controllers\Api\DealerController::class, 'getUpdateRequests']);
    Route::post('/dealers/update-requests/{id}/approve', [\App\Http\Controllers\Api\DealerController::class, 'approveUpdateRequest']);
    Route::post('/dealers/update-requests/{id}/reject', [\App\Http\Controllers\Api\DealerController::class, 'rejectUpdateRequest']);

    // Profile (Dealer)
    Route::post('/profile/update', [\App\Http\Controllers\Api\ProfileController::class, 'update']);
    Route::get('/profile/update-request', [\App\Http\Controllers\Api\ProfileController::class, 'getUpdateRequest']);
    Route::post('/profile/update-request', [\App\Http\Controllers\Api\ProfileController::class, 'createUpdateRequest']);
    // Admin Profile & User Management
    Route::get('/admin/profile', [\App\Http\Controllers\Api\AdminController::class, 'getProfile']);
    Route::put('/admin/profile', [\App\Http\Controllers\Api\AdminController::class, 'updateProfile']);
    Route::get('/admin/users', [\App\Http\Controllers\Api\AdminController::class, 'listAdmins']);
    Route::post('/admin/users', [\App\Http\Controllers\Api\AdminController::class, 'createAdmin']);
    Route::put('/admin/users/{id}/status', [\App\Http\Controllers\Api\AdminController::class, 'toggleAdminStatus']);

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [\App\Http\Controllers\Api\NotificationController::class, 'unreadCount']);
    Route::put('/notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllRead']);
    Route::put('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markRead']);
    Route::delete('/notifications/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);
    Route::post('/notifications/announce', [\App\Http\Controllers\Api\NotificationController::class, 'announce']);

    // Packages
    Route::get('/packages', [\App\Http\Controllers\Api\PackageController::class, 'index']);
    Route::post('/packages', [\App\Http\Controllers\Api\PackageController::class, 'store']);
    Route::put('/packages/{id}', [\App\Http\Controllers\Api\PackageController::class, 'update']);
    Route::delete('/packages/{id}', [\App\Http\Controllers\Api\PackageController::class, 'destroy']);
    Route::post('/packages/{id}/purchase', [\App\Http\Controllers\Api\PackageController::class, 'purchase']);

    // Payment Processing
    Route::post('/payment/process', [\App\Http\Controllers\Api\PaymentController::class, 'process']);
});

// Public Routes
Route::get('/certificates/verify/{hash}', [\App\Http\Controllers\Api\CertificateController::class, 'verify']);
Route::get('/certificates/verify/{hash}/download', [\App\Http\Controllers\Api\CertificateController::class, 'downloadByHash']);

Route::match(['get', 'post'], '/payment/callback', [\App\Http\Controllers\Api\PaymentController::class, 'callback']);
