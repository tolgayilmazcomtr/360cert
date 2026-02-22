<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Language;
use Illuminate\Http\Request;

class LanguageController extends Controller
{
    public function index()
    {
        return response()->json(Language::all());
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'is_active' => 'required|boolean' // We might also want to update name/code later, but stick to toggle for now
        ]);

        $language = Language::findOrFail($id);
        $language->is_active = $request->is_active;
        $language->save();

        return response()->json($language);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:10|unique:languages,code',
            'name' => 'required|string|max:255',
            'is_active' => 'boolean'
        ]);

        $language = Language::create([
            'code' => $request->code,
            'name' => $request->name,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json($language, 201);
    }

    public function destroy($id)
    {
        $language = Language::findOrFail($id);
        $language->delete();

        return response()->json(['message' => 'Dil başarıyla silindi.']);
    }
}
