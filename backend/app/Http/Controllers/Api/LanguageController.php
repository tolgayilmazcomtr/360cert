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
            'is_active' => 'required|boolean'
        ]);

        $language = Language::findOrFail($id);
        $language->is_active = $request->is_active;
        $language->save();

        return response()->json($language);
    }
}
