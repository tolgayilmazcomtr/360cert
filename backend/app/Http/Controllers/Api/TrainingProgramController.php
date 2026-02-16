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
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_hours' => 'required|integer|min:1',
            'default_price' => 'required|numeric|min:0',
        ]);

        $program = TrainingProgram::create($validated);
        return response()->json($program, 201);
    }
}
