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
use Illuminate\Support\Str;

class CertificateController extends Controller
{
    public function index(Request $request) 
    {
        $user = $request->user();
        $query = Certificate::with(['student', 'training_program'])->orderBy('created_at', 'desc');

        if ($user->role !== 'admin') {
            $query->whereHas('student', function($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        return $query->paginate(20);
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'training_program_id' => 'required|exists:training_programs,id',
            'certificate_template_id' => 'required|exists:certificate_templates,id',
            'issue_date' => 'required|date',
        ]);

        $user = $request->user();
        $program = TrainingProgram::findOrFail($request->training_program_id);
        
        // Balance Check for Dealers
        if ($user->role !== 'admin') {
            if ($user->balance < $program->default_price) {
                return response()->json(['message' => 'Yetersiz bakiye. Lütfen bakiye yükleyiniz.'], 402);
            }
        }

        DB::beginTransaction();
        try {
            // Deduct Balance
            if ($user->role !== 'admin') {
                $user->decrement('balance', $program->default_price);
                
                // Log Transaction (Expense)
                \App\Models\Transaction::create([
                    'user_id' => $user->id,
                    'amount' => $program->default_price,
                    'type' => 'expense',
                    'method' => 'system',
                    'status' => 'approved',
                    'description' => $program->name . ' sertifikası üretimi',
                ]);
            }

            // Generate Certificate
            $hash = Str::random(16);
            $certNo = 'CERT-' . date('Y') . '-' . strtoupper(Str::random(6));

            $certificate = Certificate::create([
                'certificate_no' => $certNo,
                'student_id' => $request->student_id,
                'training_program_id' => $request->training_program_id,
                'certificate_template_id' => $request->certificate_template_id,
                'issue_date' => $request->issue_date,
                'qr_code_hash' => $hash,
                'status' => 'approved', // Auto approve for now
                'cost' => $program->default_price,
            ]);

            DB::commit();
            
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

    public function download(Request $request, $id)
    {
        $certificate = Certificate::with(['student', 'training_program', 'template'])->findOrFail($id);
        
        // Check Authorization
        $user = $request->user();
        if ($user->role !== 'admin' && $certificate->student->user_id !== $user->id) {
            return response()->json(['message' => 'Yetkisiz erişim.'], 403);
        }

        // Generate QR Code
        $verifyUrl = config('app.url') . "/verify/" . $certificate->qr_code_hash;
        $qrCode = base64_encode(QrCode::format('svg')->size(100)->generate($verifyUrl));

        // Get Background Image Base64
        $bgPath = storage_path('app/public/' . $certificate->template->background_path);

        // Check for file existence
        if (!file_exists($bgPath)) {
            return response()->json(['message' => 'Arkaplan dosyası bulunamadı.'], 404);
        }

        // Get Layout Config
        $config = $certificate->template->layout_config;
        
        // Determine PDF Dimensions
        // If canvas dimensions are set in config, use them. Otherwise fallback to image dimensions.
        if (!empty($config['canvasWidth']) && !empty($config['canvasHeight'])) {
            $width = $config['canvasWidth'];
            $height = $config['canvasHeight'];
        } else {
             list($width, $height) = getimagesize($bgPath);
        }
        
        $customPaper = [0, 0, $width, $height];

        $bgBase64 = 'data:image/' . pathinfo($bgPath, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($bgPath));

        $data = [
            'certificate' => $certificate,
            'qrCode' => $qrCode,
            'bgImage' => $bgBase64,
            'config' => $config,
            'width' => $width,
            'height' => $height
        ];

        $pdf = Pdf::loadView('certificates.dynamic', $data);
        
        $pdf->setPaper($customPaper);
        
        $pdf->setOptions(['isRemoteEnabled' => true, 'dpi' => 96, 'defaultFont' => 'sans-serif']);

        return $pdf->download($certificate->certificate_no . '.pdf');
    }
    
    public function templates()
    {
        return response()->json(CertificateTemplate::where('is_active', true)->get());
    }
}
