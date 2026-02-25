<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\TrainingProgram;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CertificateController extends Controller
{
    public function index(Request $request) 
    {
        $user = $request->user();
        // Eager load student.user to get dealer info
        $query = Certificate::with(['student.user', 'training_program', 'certificateType']);

        // 1. Search (Student Name, TC, Certificate No)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('certificate_no', 'like', "%{$search}%")
                  ->orWhereHas('student', function($subQ) use ($search) {
                      $subQ->where('first_name', 'like', "%{$search}%")
                           ->orWhere('last_name', 'like', "%{$search}%")
                           ->orWhere('tc_number', 'like', "%{$search}%");
                  });
            });
        }

        // 2. Status Filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // 3. Date Range Filter
        if ($request->filled('startDate') && $request->filled('endDate')) {
            $query->whereBetween('issue_date', [$request->startDate, $request->endDate]);
        }

        // 4. Role-Based Access & Dealer Filter
        if ($user->role !== 'admin') {
            // Dealers only see their own students' certificates
            $query->whereHas('student', function($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } else {
            // Admins can filter by specific dealer
            if ($request->filled('dealer_id') && $request->dealer_id !== 'all') {
                $query->whereHas('student', function($q) use ($request) {
                    $q->where('user_id', $request->dealer_id);
                });
            }
        }

        // Sorting
        $sortField = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortField, $sortOrder);

        return $query->paginate($request->input('per_page', 20));
    }

    public function searchByNo(Request $request)
    {
        $request->validate([
            'no' => 'required|string'
        ]);

        $certificate = Certificate::where('certificate_no', $request->no)
            ->where('status', 'approved') // Only allow verifying approved certificates
            ->first();

        if (!$certificate) {
            return response()->json(['message' => 'Sertifika bulunamadı veya henüz onaylanmadı.'], 404);
        }

        return response()->json([
            'hash' => $certificate->qr_code_hash
        ]);
    }

    public function show(Request $request, $id)
    {
        $certificate = Certificate::with(['student', 'training_program', 'template'])
            ->findOrFail($id);

        $user = $request->user();
        
        // Authorization
        if ($user->role !== 'admin' && $certificate->student->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Add transcript URL if exists
        $data = $certificate->toArray();
        if ($certificate->transcript_path) {
            $data['transcript_url'] = url('storage/' . $certificate->transcript_path);
        }

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tc_number' => 'required|string|max:11',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'birth_year' => 'required|string|max:4',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:5120', // Öğrenci Resmi
            
            'training_program_id' => 'required|exists:training_programs,id',
            'certificate_template_id' => 'required|exists:certificate_templates,id',
            'certificate_language' => 'required|string|max:10',
            
            'duration_hours' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'issue_date' => 'required|date', // This acts as END DATE based on UI/logic mapping, or we take end_date
            'end_date' => 'required|date',
            
            'transcript' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240', // Max 10MB
        ]);

        $user = $request->user();
        $program = TrainingProgram::findOrFail($request->training_program_id);
        $template = CertificateTemplate::findOrFail($request->certificate_template_id);
        
        // Balance Check for Dealers
        if ($user->role !== 'admin') {
            if ($user->balance < $program->default_price) {
                return response()->json(['message' => 'Yetersiz bakiye. Lütfen bakiye yükleyiniz.'], 402);
            }
        }

        DB::beginTransaction();
        try {
            // Find or Create Student based on TC Number under this dealer/admin
            $student = Student::where('tc_number', $request->tc_number)->first();
            
            if (!$student) {
                // Determine user_id to assign the student to. If admin creates it, we just attach to admin, or you can have a dealer_id picker later.
                // Assuming it binds to whoever is creating it.
                $student = new Student();
                $student->user_id = $user->id;
                $student->tc_number = $request->tc_number;
            } else {
                // Optional: Ensure the dealer owns the student or the user is admin
                if ($user->role !== 'admin' && $student->user_id !== $user->id) {
                     // In a real multi-tenant you would block, but maybe they belong to another dealer?
                     // Return generic error or create logic. For now, let's update if allowed or error.
                     if ($student->user_id !== $user->id) {
                         return response()->json(['message' => 'Bu TC kimlik numarası başka bir bayiye aittir.'], 403);
                     }
                }
            }

            $student->first_name = $request->first_name;
            $student->last_name = $request->last_name;
            $student->birth_year = $request->birth_year;

            // Handle Student Photo
            if ($request->hasFile('photo')) {
                // If there's an old photo, could delete it here
                $file = $request->file('photo');
                $filename = 'student_' . time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
                $photoPath = $file->storeAs('student_photos', $filename, 'public');
                $student->photo_path = $photoPath;
            }

            $student->save();


            // Deduct Balance
            if ($user->role !== 'admin') {
                $user->decrement('balance', $program->default_price);
                
                $programNameStr = is_array($program->name) ? ($program->name['tr'] ?? current($program->name) ?? '') : $program->name;
                
                // Log Transaction (Expense)
                \App\Models\Transaction::create([
                    'user_id' => $user->id,
                    'amount' => $program->default_price,
                    'type' => 'expense',
                    'method' => 'system',
                    'status' => 'approved',
                    'description' => $programNameStr . ' sertifikası üretimi (' . $student->first_name . ' ' . $student->last_name . ')',
                ]);
            }

            // Upload Transcript
            $transcriptPath = null;
            if ($request->hasFile('transcript')) {
                $file = $request->file('transcript');
                $filename = 'transcript_' . time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
                $transcriptPath = $file->storeAs('transcripts', $filename, 'public');
            }

            // Generate Certificate
            $hash = Str::random(16);
            $certNo = 'IAC-' . date('Y') . '-' . strtoupper(Str::random(6));

            $certificate = Certificate::create([
                'certificate_no' => $certNo,
                'student_id' => $student->id,
                'training_program_id' => $request->training_program_id,
                'certificate_template_id' => $request->certificate_template_id,
                'certificate_type_id' => $template->certificate_type_id,
                'certificate_language' => $request->certificate_language,
                'duration_hours' => $request->duration_hours,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'issue_date' => $request->issue_date,
                'qr_code_hash' => $hash,
                'status' => $user->role === 'admin' ? 'approved' : 'pending',
                'cost' => $program->default_price,
                'transcript_path' => $transcriptPath,
            ]);

            DB::commit();

            // Notify all admins about new certificate submission (if submitted by dealer)
            if ($user->role !== 'admin') {
                $dealerName = $user->name ?? $user->company_name ?? 'Bayi';
                $programNameStr = is_array($program->name) ? ($program->name['tr'] ?? current($program->name) ?? '') : $program->name;
                NotificationController::notifyAllAdmins(
                    'certificate_submitted',
                    'Yeni Sertifika Talebi',
                    "{$dealerName} tarafından {$programNameStr} programı için yeni bir sertifika talebi oluşturuldu.",
                    ['certificate_id' => $certificate->id, 'certificate_no' => $certNo]
                );
            }

            return response()->json($certificate, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Sertifika üretimi başarısız: ' . $e->getMessage()], 500);
        }
    }

    public function verify($hash)
    {
        $certificate = Certificate::with(['student', 'training_program'])
            ->where('qr_code_hash', $hash)
            ->firstOrFail();
            
        return response()->json($certificate);
    }

    public function downloadByHash(Request $request, $hash)
    {
        $certificate = Certificate::with(['student', 'training_program', 'template'])
            ->where('qr_code_hash', $hash)
            ->firstOrFail();

        // Language Override Support
        $overrideLang = $request->input('lang');
        if ($overrideLang) {
            $certificate->certificate_language = $overrideLang;
        }

        // Generate QR Code
        $frontendUrl = env('FRONTEND_URL', config('app.url'));
        $frontendUrl = rtrim($frontendUrl, '/');
        $verifyUrl = $frontendUrl . "/verify/" . $certificate->qr_code_hash;
        $qrCode = base64_encode(QrCode::format('svg')->size(100)->generate($verifyUrl));

        // Get Background Image Base64
        $bgPath = storage_path('app/public/' . $certificate->template->background_path);

        if (!file_exists($bgPath)) {
            return response()->json(['message' => 'Arkaplan dosyası bulunamadı.'], 404);
        }

        $config = $certificate->template->layout_config;
        
        list($width, $height) = getimagesize($bgPath);
        
        if (!$width || !$height) {
             if (!empty($config['canvasWidth']) && !empty($config['canvasHeight'])) {
                $width = $config['canvasWidth'];
                $height = $config['canvasHeight'];
            } else {
                $width = 842;
                $height = 595;
            }
        }
        
        $customPaper = [0, 0, $width * 72 / 96, $height * 72 / 96];
        $bgBase64 = 'data:image/' . pathinfo($bgPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($bgPath));

        $dealerLogoBase64 = null;
        if ($certificate->student && $certificate->student->user && $certificate->student->user->logo_path) {
            $logoPath = $certificate->student->user->logo_path;
            if (Storage::disk('public')->exists($logoPath)) {
                $ext = pathinfo($logoPath, PATHINFO_EXTENSION);
                $content = Storage::disk('public')->get($logoPath);
                $dealerLogoBase64 = 'data:image/' . $ext . ';base64,' . base64_encode($content);
            }
        }

        $data = [
            'certificate' => $certificate,
            'qrCode' => $qrCode,
            'bgImage' => $bgBase64,
            'dealerLogo' => $dealerLogoBase64,
            'config' => $config,
            'width' => $width,
            'height' => $height
        ];

        ini_set('memory_limit', '512M');
        set_time_limit(300);

        if (!file_exists(storage_path('fonts'))) {
            mkdir(storage_path('fonts'), 0775, true);
        }

        try {
            $pdf = Pdf::loadView('certificates.dynamic', $data);
            $pdf->setPaper($customPaper);
            $pdf->setOptions([
                'isRemoteEnabled' => true, 
                'dpi' => 96, 
                'defaultFont' => 'sans-serif',
                'fontDir' => storage_path('fonts'),
                'fontCache' => storage_path('fonts'),
            ]);

            return $pdf->download($certificate->certificate_no . '.pdf');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('PDF Generation Error: ' . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            return response()->json(['message' => 'PDF oluşturulurken hata oluştu: ' . $e->getMessage()], 500);
        }
    }

    public function download(Request $request, $id)
    {
        $certificate = Certificate::with(['student', 'training_program', 'template', 'certificateType'])->findOrFail($id);
        
        // Check Authorization
        $user = $request->user();
        if ($user->role !== 'admin' && $certificate->student->user_id !== $user->id) {
            return response()->json(['message' => 'Yetkisiz erişim.'], 403);
        }

        // Allow Admins to download PENDING certificates for preview
        if ($certificate->status !== 'approved' && $user->role !== 'admin') {
             return response()->json(['message' => 'Sertifika henüz onaylanmamış.'], 403);
        }

        // Language Override Support
        $overrideLang = $request->input('lang');
        if ($overrideLang) {
            $certificate->certificate_language = $overrideLang;
        }

        // Generate QR Code
        // Generate QR Code
        $frontendUrl = env('FRONTEND_URL', config('app.url'));
        // Ensure no trailing slash
        $frontendUrl = rtrim($frontendUrl, '/');
        $verifyUrl = $frontendUrl . "/verify/" . $certificate->qr_code_hash;
        $qrCode = base64_encode(QrCode::format('svg')->size(100)->generate($verifyUrl));

        // Get Background Image Base64
        $bgPath = storage_path('app/public/' . $certificate->template->background_path);

        // Check for file existence
        if (!file_exists($bgPath)) {
            return response()->json(['message' => 'Arkaplan dosyası bulunamadı.'], 404);
        }

        // Get Layout Config
        $config = $certificate->template->layout_config;
        
        // Increase memory limit for PDF generation
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        // Ensure fonts directory exists for DomPDF
        if (!file_exists(storage_path('fonts'))) {
            mkdir(storage_path('fonts'), 0775, true);
        }

        try {
            $imgSize = @getimagesize($bgPath);
            if ($imgSize) {
                list($width, $height) = $imgSize;
            } else {
                if (!empty($config['canvasWidth']) && !empty($config['canvasHeight'])) {
                    $width = $config['canvasWidth'];
                    $height = $config['canvasHeight'];
                } else {
                    $width = 842; // Fallback A4 Landscape
                    $height = 595;
                }
            }
            $customPaper = [0, 0, $width * 72 / 96, $height * 72 / 96];

            $dealerLogoBase64 = null;
            if ($certificate->student && $certificate->student->user && $certificate->student->user->logo_path) {
                $logoPath = $certificate->student->user->logo_path;
                if (Storage::disk('public')->exists($logoPath)) {
                    $ext = pathinfo($logoPath, PATHINFO_EXTENSION);
                    $content = Storage::disk('public')->get($logoPath);
                    $dealerLogoBase64 = 'data:image/' . $ext . ';base64,' . base64_encode($content);
                }
            }

            $studentPhotoBase64 = null;
            if ($certificate->student && $certificate->student->photo_path) {
                $photoPath = $certificate->student->photo_path;
                if (Storage::disk('public')->exists($photoPath)) {
                    $ext = pathinfo($photoPath, PATHINFO_EXTENSION);
                    $content = Storage::disk('public')->get($photoPath);
                    $studentPhotoBase64 = 'data:image/' . $ext . ';base64,' . base64_encode($content);
                }
            }

            $data = [
                'certificate' => $certificate,
                'qrCode' => $qrCode,
                'bgImage' => $bgBase64,
                'dealerLogo' => $dealerLogoBase64,
                'studentPhoto' => $studentPhotoBase64,
                'config' => $config,
                'width' => $width,
                'height' => $height
            ];

            $pdf = Pdf::loadView('certificates.dynamic', $data);
            
            $pdf->setPaper($customPaper);
            
            $pdf->setOptions([
                'isRemoteEnabled' => true, 
                'dpi' => 96, 
                'defaultFont' => 'sans-serif',
                'fontDir' => storage_path('fonts'),
                'fontCache' => storage_path('fonts'),
            ]);

            return $pdf->download($certificate->certificate_no . '.pdf');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('PDF Generation Error: ' . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            return response()->json(['message' => 'PDF oluşturulurken hata oluştu: ' . $e->getMessage()], 500);
        }
    }

    public function downloadIdCard($id)
    {
        $certificate = Certificate::with(['student.user', 'training_program', 'certificateType'])->findOrFail($id);
        
        // Find best ID card template
        // 1. Try to find a card template specific to this Certificate's Type
        $cardTemplate = \App\Models\CertificateTemplate::where('type', 'card')
                        ->where('is_active', true)
                        ->where('certificate_type_id', $certificate->certificate_type_id)
                        ->first();
                        
        // 2. If no specific card template exists, grab the first fallback active card template
        if (!$cardTemplate) {
            $cardTemplate = \App\Models\CertificateTemplate::where('type', 'card')
                            ->where('is_active', true)
                            ->first();
        }

        if (!$cardTemplate) {
            return response()->json(['message' => 'Sistemde aktif bir Kimlik Kartı şablonu bulunmamaktadır.'], 404);
        }

        // --- Standard PDF Generation Logic ---
        $frontendUrl = rtrim(env('FRONTEND_URL', config('app.url')), '/');
        $qrUrl = $frontendUrl . '/verify/' . $certificate->qr_code_hash;
        $qrCode = base64_encode(\SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(200)->generate($qrUrl));
        
        $bgPath = storage_path('app/public/' . $cardTemplate->background_path);
        
        try {
            if (!file_exists($bgPath)) {
                return response()->json(['message' => 'Kimlik kartı arkaplan dosyası bulunamadı.'], 404);
            }

            $config = $cardTemplate->layout_config;
            $width = 0;
            $height = 0;
            
            $imgSize = @getimagesize($bgPath);
            if ($imgSize) {
                list($width, $height) = $imgSize;
            }
            
            if (!$width || !$height) {
                $width = $config['canvasWidth'] ?? 842;
                $height = $config['canvasHeight'] ?? 595;
            }
            
            $customPaper = [0, 0, $width * 72 / 96, $height * 72 / 96];
            $bgBase64 = 'data:image/' . pathinfo($bgPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($bgPath));

            $dealerLogoBase64 = null;
            if ($certificate->student && $certificate->student->user && $certificate->student->user->logo_path) {
                $logoPath = $certificate->student->user->logo_path;
                if (Storage::disk('public')->exists($logoPath)) {
                    $ext = pathinfo($logoPath, PATHINFO_EXTENSION);
                    $content = Storage::disk('public')->get($logoPath);
                    $dealerLogoBase64 = 'data:image/' . $ext . ';base64,' . base64_encode($content);
                }
            }

            $studentPhotoBase64 = null;
            if ($certificate->student && $certificate->student->photo_path) {
                $photoPath = $certificate->student->photo_path;
                if (Storage::disk('public')->exists($photoPath)) {
                    $ext = pathinfo($photoPath, PATHINFO_EXTENSION);
                    $content = Storage::disk('public')->get($photoPath);
                    $studentPhotoBase64 = 'data:image/' . $ext . ';base64,' . base64_encode($content);
                }
            }

            $data = [
                'certificate' => $certificate,
                'qrCode' => $qrCode,
                'bgImage' => $bgBase64,
                'dealerLogo' => $dealerLogoBase64,
                'studentPhoto' => $studentPhotoBase64,
                'config' => $config,
                'width' => $width,
                'height' => $height
            ];

            ini_set('memory_limit', '512M');
            set_time_limit(300);

            if (!file_exists(storage_path('fonts'))) {
                mkdir(storage_path('fonts'), 0775, true);
            }

            // We can reuse certificates.dynamic as it parses generic $config['elements'] via absolute positioning
            $pdf = Pdf::loadView('certificates.dynamic', $data);
            $pdf->setPaper($customPaper);
            $pdf->setOptions([
                'isRemoteEnabled' => true, 
                'dpi' => 96, 
                'defaultFont' => 'sans-serif',
                'fontDir' => storage_path('fonts'),
                'fontCache' => storage_path('fonts'),
            ]);

            return $pdf->download($certificate->certificate_no . '_kimlik.pdf');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('ID Card PDF Generation Error: ' . $e->getMessage());
            return response()->json(['message' => 'Kimlik Kartı oluşturulurken hata: ' . $e->getMessage()], 500);
        }
    }
    
    public function updateStatus(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $certificate = Certificate::findOrFail($id);
        
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|string|nullable',
            'mernis_status' => 'nullable|string'
        ]);

        $certificate->status = $request->status;
        if ($request->has('mernis_status')) {
            $certificate->mernis_status = $request->mernis_status;
        }

        if ($request->status === 'rejected') {
            $certificate->rejection_reason = $request->rejection_reason;
            // Refund balance if rejected? For now, no automatic refund logic specified.
        }
        $certificate->save();

        // Notify the dealer who owns this certificate
        $certificate->load('student.user');
        $dealerUserId = $certificate->student->user_id ?? null;
        if ($dealerUserId) {
            if ($request->status === 'approved') {
                NotificationController::createFor(
                    $dealerUserId,
                    'certificate_approved',
                    'Sertifikanız Onaylandı ✅',
                    "No: {$certificate->certificate_no} numaralı sertifikanız onaylandı. Artık indirebilirsiniz.",
                    ['certificate_id' => $certificate->id, 'certificate_no' => $certificate->certificate_no]
                );
            } elseif ($request->status === 'rejected') {
                NotificationController::createFor(
                    $dealerUserId,
                    'certificate_rejected',
                    'Sertifikanız Reddedildi ❌',
                    "No: {$certificate->certificate_no} numaralı sertifikanız reddedildi. Neden: " . ($request->rejection_reason ?? '-'),
                    ['certificate_id' => $certificate->id, 'certificate_no' => $certificate->certificate_no]
                );
            }
        }

        return response()->json($certificate);
    }

    public function saveTranscript(Request $request, $id)
    {
        $certificate = Certificate::findOrFail($id);
        $user = $request->user();

        // Check if user is admin or the dealer who owns the student
        if ($user->role !== 'admin' && $certificate->student->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'transcript_data' => 'required|array'
        ]);

        $certificate->transcript_data = $request->transcript_data;
        $certificate->save();

        return response()->json(['message' => 'Transkript verisi başarıyla kaydedildi.', 'data' => $certificate->transcript_data]);
    }

    public function downloadTranscriptData(Request $request, $id)
    {
        $certificate = Certificate::with(['student.user', 'training_program'])->findOrFail($id);
        $user = $request->user();

        // Check if user is admin or the dealer who owns the student
        if ($user->role !== 'admin' && $certificate->student->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$certificate->transcript_data) {
            return response()->json(['message' => 'Bu sertifikaya ait transkript verisi bulunamadı.'], 404);
        }

        $data = [
            'certificate' => $certificate,
            'transcriptData' => $certificate->transcript_data,
        ];

        // Increase memory limit for PDF generation
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        try {
            $pdf = Pdf::loadView('transcripts.pdf', $data);
            
            // Generate A4 Portrait PDF
            $pdf->setPaper('a4', 'portrait');
            
            $pdf->setOptions([
                'isRemoteEnabled' => true, 
                'dpi' => 150, 
            ]);

            return $pdf->download('Transkript_' . $certificate->certificate_no . '.pdf');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Transcript PDF Generation Error: ' . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            return response()->json(['message' => 'Transkript PDF oluşturulurken hata oluştu: ' . $e->getMessage()], 500);
        }
    }
    public function update(Request $request, $id)
    {
        $certificate = Certificate::findOrFail($id);
        $user = $request->user();

        // Check if user is admin or the dealer who owns the student
        if ($user->role !== 'admin' && $certificate->student->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'certificate_template_id' => 'sometimes|exists:certificate_templates,id',
            // Can add more fields later if needed
        ]);

        if (isset($validated['certificate_template_id'])) {
            $template = CertificateTemplate::findOrFail($validated['certificate_template_id']);
            $certificate->certificate_template_id = $template->id;
            $certificate->certificate_type_id = $template->certificate_type_id;
        }

        $certificate->save();

        return response()->json($certificate);
    }

    public function destroy(Request $request, $id)
    {
        $certificate = Certificate::findOrFail($id);
        $user = $request->user();

        // Check if user is admin or the dealer who owns the student
        if ($user->role !== 'admin' && $certificate->student->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete associated files if necessary (optional depending on retention policy)
        if ($certificate->transcript_path) {
            Storage::disk('public')->delete($certificate->transcript_path);
        }

        $certificate->delete();

        return response()->json(['message' => 'Sertifika başarıyla silindi.']);
    }
}
