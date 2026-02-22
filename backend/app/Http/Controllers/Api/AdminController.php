<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminController extends Controller
{
    /**
     * Get the authenticated admin's own profile.
     */
    public function getProfile(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($user);
    }

    /**
     * Update the authenticated admin's own profile.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|nullable|string|min:6|confirmed',
        ]);

        if (isset($validated['name']))  $user->name  = $validated['name'];
        if (isset($validated['email'])) $user->email = $validated['email'];
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
        $user->save();

        return response()->json(['message' => 'Profil güncellendi.', 'user' => $user]);
    }

    /**
     * List all admin users.
     */
    public function listAdmins(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $admins = User::where('role', 'admin')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'created_at', 'is_active']);

        return response()->json($admins);
    }

    /**
     * Create a new admin user.
     */
    public function createAdmin(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $newAdmin = User::create([
            'name'       => $validated['name'],
            'email'      => $validated['email'],
            'password'   => Hash::make($validated['password']),
            'role'       => 'admin',
            'is_active'  => true,
            'is_approved' => true,
        ]);

        return response()->json(['message' => 'Yönetici oluşturuldu.', 'user' => $newAdmin], 201);
    }

    /**
     * Toggle an admin user's active status.
     */
    public function toggleAdminStatus(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ((int)$id === $user->id) {
            return response()->json(['message' => 'Kendi hesabınızı pasifleştiremezsiniz.'], 422);
        }

        $admin = User::where('id', $id)->where('role', 'admin')->firstOrFail();
        $admin->is_active = !$admin->is_active;
        $admin->save();

        return response()->json(['message' => 'Durum güncellendi.', 'user' => $admin]);
    }
}
