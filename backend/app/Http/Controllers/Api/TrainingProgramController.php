<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrainingProgram;
use Illuminate\Http\Request;

class TrainingProgramController extends Controller
{
    public function index()
    {
        return response()->json(TrainingProgram::where('is_active', true)->get());
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
}
