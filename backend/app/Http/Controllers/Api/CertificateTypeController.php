<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CertificateType;
use Illuminate\Http\Request;

class CertificateTypeController extends Controller
{
    public function index()
    {
        return response()->json(CertificateType::where('is_active', true)->get());
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
             return response()->json(['message' => 'Yetkisiz işlem.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|array', // JSON localized names
            'name.tr' => 'required|string', // At least TR is required
            'is_active' => 'boolean',
        ]);

        $type = CertificateType::create([
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
        ]);
        
        return response()->json($type, 201);
    }

    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
             return response()->json(['message' => 'Yetkisiz işlem.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|array',
            'name.tr' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $type = CertificateType::findOrFail($id);
        $type->update([
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? $type->is_active,
        ]);

        return response()->json($type);
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
             return response()->json(['message' => 'Yetkisiz işlem.'], 403);
        }

        $type = CertificateType::findOrFail($id);
        
        // Check if type is in use
        if (\App\Models\Certificate::where('certificate_type_id', $id)->exists()) {
             return response()->json(['message' => 'Bu sertifika türü kullanıldığı için silinemez.'], 400);
        }

        $type->delete();
        return response()->json(['message' => 'Sertifika türü silindi.']);
    }
}
