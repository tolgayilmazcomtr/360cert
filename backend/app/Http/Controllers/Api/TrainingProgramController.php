<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrainingProgram;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\TrainingProgramsImport;
use Exception;

class TrainingProgramController extends Controller
{
    public function index(Request $request)
    {
        $query = TrainingProgram::where('is_active', true);

        // Optional search filtering
        if ($request->has('search') && !empty($request->search)) {
            $search = strtolower($request->search);
            // Search in JSON 'name' column (example: {"tr": "Sertifika", "en": "Certificate"})
            $query->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                  ->orWhere('description', 'LIKE', "%{$request->search}%");
        }

        // Return paginated or all
        if ($request->boolean('paginate')) {
            return response()->json($query->paginate(15));
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        // Only admin can create training programs
        if ($request->user()->role !== 'admin') {
             return response()->json(['message' => 'Yetkisiz işlem.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required', // Remove string|max:255 since it can be JSON/array
            'description' => 'nullable|string',
            'duration_hours' => 'required|integer|min:1',
            'default_price' => 'required|numeric|min:0',
        ]);

        $program = TrainingProgram::create($validated);
        return response()->json($program, 201);
    }

    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
             return response()->json(['message' => 'Yetkisiz işlem.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required', // Assuming it's an array/json
            'description' => 'nullable|string',
            'duration_hours' => 'required|integer|min:1',
            'default_price' => 'required|numeric|min:0',
        ]);

        $program = TrainingProgram::findOrFail($id);
        $program->update($validated);
        return response()->json($program);
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
             return response()->json(['message' => 'Yetkisiz işlem.'], 403);
        }

        $program = TrainingProgram::findOrFail($id);
        
        // Optionally, check if program is in use in certificates before deleting.
        if ($program->certificates()->count() > 0) {
             return response()->json(['message' => 'Bu eğitim programına ait sertifikalar bulunduğu için silinemez.'], 400);
        }

        $program->delete();
        return response()->json(['message' => 'Eğitim programı silindi.']);
    }

    public function importTemplate()
    {
        // Generate a blank Excel file with required headers
        $headers = [
            'Eğitim Adı (TR)',
            'Eğitim Adı (EN)',
            'Eğitim Adı (DE)',
            'Eğitim Adı (FR)',
            'Eğitim Adı (RU)',
            'Eğitim Adı (AR)',
            'Eğitim Süresi (Saat)',
            'Fiyat',
            'Açıklama'
        ];

        // Using a basic array export via Maatwebsite Excel
        $exportData = new class($headers) implements \Maatwebsite\Excel\Concerns\FromArray {
            protected $data;
            public function __construct(array $data) { $this->data = [$data]; }
            public function array(): array { return $this->data; }
        };

        return Excel::download($exportData, 'egitim_sablonu.xlsx');
    }

    public function import(Request $request)
    {
        if ($request->user()->role !== 'admin') {
             return response()->json(['message' => 'Yetkisiz işlem.'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls'
        ]);

        try {
            Excel::import(new TrainingProgramsImport, $request->file('file'));
            return response()->json(['message' => 'Eğitimler başarıyla içe aktarıldı.']);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'İçe aktarma sırasında bir hata oluştu.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
