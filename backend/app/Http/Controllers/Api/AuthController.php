<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Hash;
use App\Models\Transaction;

class AuthController extends Controller
{
    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $user = Auth::user();

            if (!$user->is_active) {
                Auth::logout();
                return response()->json(['message' => 'Hesabınız pasif duruma alınmıştır.'], 403);
            }

            if ($user->role === 'dealer' && !$user->is_approved) {
                Auth::logout();
                return response()->json(['message' => 'Hesabınız henüz onaylanmamış. Lütfen yönetici onayı bekleyiniz.'], 403);
            }
            
            $token = $user->createToken('auth-token')->plainTextToken;
            return response()->json([
                'user' => $user,
                'token' => $token
            ]);
        }

        return response()->json(['message' => 'Giriş bilgileri hatalı.'], 401);
    }
    
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'company_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'tax_number' => 'required|string',
            'tax_office' => 'required|string',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
            'role' => 'dealer',
            'is_approved' => false, // Default pending
            'company_name' => $validated['company_name'],
            'phone' => $validated['phone'],
            'tax_number' => $validated['tax_number'] ?? null,
            'tax_office' => $validated['tax_office'] ?? null,
            'student_quota' => 0 // Default quota
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Kayıt başarılı. Yönetici onayı bekleniyor.',
            'user' => $user,
            'token' => $token
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Çıkış yapıldı.']);
    }
}
