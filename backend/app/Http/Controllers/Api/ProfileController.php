<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProfileUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'photo' => 'nullable|image|max:2048',
            'logo' => 'nullable|image|max:2048',
        ]);

        if ($request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        if ($request->hasFile('photo')) {
            if ($user->photo_path) {
                Storage::disk('public')->delete($user->photo_path);
            }
            $user->photo_path = $request->file('photo')->store('dealers/photos', 'public');
        }

        if ($request->hasFile('logo')) {
            if ($user->logo_path) {
                Storage::disk('public')->delete($user->logo_path);
            }
            $user->logo_path = $request->file('logo')->store('dealers/logos', 'public');
        }

        $user->save();

        return response()->json($user);
    }

    public function getUpdateRequest(Request $request)
    {
        $requestData = ProfileUpdateRequest::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->latest()
            ->first();
            
        return response()->json($requestData);
    }

    public function createUpdateRequest(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'company_name' => 'required|string',
            'tax_number' => 'nullable|string',
            'tax_office' => 'nullable|string',
            'city' => 'nullable|string',
        ]);

        $pendingRequest = ProfileUpdateRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($pendingRequest) {
            return response()->json(['message' => 'Zaten bekleyen bir güncelleme talebiniz var.'], 400);
        }

        $updateRequest = ProfileUpdateRequest::create([
            'user_id' => $user->id,
            'requested_data' => $request->only(['company_name', 'tax_number', 'tax_office', 'city']),
            'status' => 'pending',
        ]);

        return response()->json($updateRequest, 201);
    }
}
