<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CertificateTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CertificateTemplateController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            return response()->json(CertificateTemplate::with('certificateType')->orderBy('created_at', 'desc')->get());
        }

        return response()->json($user->templates()->with('certificateType')->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'background_image' => 'required|image|mimes:jpeg,png,jpg|max:2048',
            'type' => 'required|in:standard,card',
            'certificate_type_id' => 'nullable|exists:certificate_types,id',
        ]);

        if ($request->hasFile('background_image')) {
            $file = $request->file('background_image');
            $path = $file->store('templates', 'public');

            // Default layout config based on type
            $defaultConfig = [
                'orientation' => $request->type === 'card' ? 'landscape' : 'landscape',
                'elements' => [
                    [
                        'type' => 'student_name',
                        'label' => 'Öğrenci Adı',
                        'x' => 100, 'y' => 100,
                        'font_size' => 24, 'color' => '#000000',
                        'font_family' => 'DejaVu Sans'
                    ],
                    [
                        'type' => 'certificate_no',
                        'label' => 'Sertifika No',
                        'x' => 100, 'y' => 150,
                        'font_size' => 14, 'color' => '#333333',
                         'font_family' => 'DejaVu Sans'
                    ],
                    [
                        'type' => 'issue_date',
                        'label' => 'Tarih',
                        'x' => 100, 'y' => 180,
                        'font_size' => 14, 'color' => '#333333',
                         'font_family' => 'DejaVu Sans'
                    ],
                     [
                        'type' => 'training_name',
                        'label' => 'Eğitim Adı',
                        'x' => 100, 'y' => 130,
                        'font_size' => 18, 'color' => '#333333',
                        'font_family' => 'DejaVu Sans'
                    ],
                     [
                        'type' => 'qr_code',
                        'label' => 'QR Kod',
                        'x' => 200, 'y' => 200,
                        'width' => 100, 'height' => 100
                    ]
                ]
            ];

            $template = CertificateTemplate::create([
                'name' => $request->name,
                'background_path' => $path,
                'type' => $request->type,
                'layout_config' => $defaultConfig,
                'is_active' => true,
                'certificate_type_id' => $request->certificate_type_id,
            ]);

            return response()->json($template, 201);
        }

        return response()->json(['message' => 'Dosya yükleme hatası.'], 400);
    }

    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $template = CertificateTemplate::findOrFail($id);
        
        $request->validate([
            'name' => 'sometimes|string',
            'layout_config' => 'sometimes|array',
            'is_active' => 'sometimes|boolean',
            'certificate_type_id' => 'nullable|exists:certificate_types,id',
        ]);

        $template->update($request->only(['name', 'layout_config', 'is_active', 'certificate_type_id']));

        return response()->json($template);
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        try {
            $template = CertificateTemplate::findOrFail($id);
            // Optional: Delete file from storage
            // Storage::disk('public')->delete($template->background_path);
            
            $template->delete();
            return response()->json(['message' => 'Şablon başarıyla silindi.']);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == "23000") {
                return response()->json(['message' => 'Bu şablon kullanıldığı için silinemez. Önce ilişkili sertifikaları silmelisiniz.'], 409);
            }
            return response()->json(['message' => 'Silme işlemi sırasında bir hata oluştu.'], 500);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Silme işlemi başarısız: ' . $e->getMessage()], 500);
        }
    }
}
