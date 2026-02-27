<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Accreditation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AccreditationController extends Controller
{
    public function publicIndex()
    {
        return response()->json(Accreditation::where('is_active', true)->get());
    }

    public function index()
    {
        return response()->json(Accreditation::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'website' => 'nullable|url|max:255',
            'is_active' => 'boolean',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('accreditations', 'public');
        }

        $accreditation = Accreditation::create([
            'name' => $validated['name'],
            'website' => $validated['website'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'logo_path' => $logoPath ? '/storage/' . $logoPath : null,
        ]);

        return response()->json(['message' => 'Akreditasyon eklendi.', 'accreditation' => $accreditation], 201);
    }

    public function update(Request $request, $id)
    {
        $accreditation = Accreditation::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'website' => 'nullable|url|max:255',
            'is_active' => 'boolean',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        $data = [
            'name' => $validated['name'],
            'website' => $validated['website'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];

        if ($request->hasFile('logo')) {
            if ($accreditation->logo_path) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $accreditation->logo_path));
            }
            $logoPath = $request->file('logo')->store('accreditations', 'public');
            $data['logo_path'] = '/storage/' . $logoPath;
        }

        $accreditation->update($data);

        return response()->json(['message' => 'Akreditasyon güncellendi.', 'accreditation' => $accreditation]);
    }

    public function destroy($id)
    {
        $accreditation = Accreditation::findOrFail($id);
        
        if ($accreditation->logo_path) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $accreditation->logo_path));
        }
        
        $accreditation->delete();

        return response()->json(['message' => 'Akreditasyon silindi.']);
    }
}
