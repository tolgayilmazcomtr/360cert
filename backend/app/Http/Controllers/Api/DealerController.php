<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ProfileUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DealerController extends Controller
{
    // List all dealers (for Admin)
    public function index(Request $request)
    {
        // Manual Admin Check
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = User::where('role', 'dealer');

        if ($request->has('status')) {
            if ($request->status === 'pending') {
                $query->where('is_approved', false);
            } else if ($request->status === 'approved') {
                $query->where('is_approved', true);
            }
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string',
            'company_name' => 'nullable|string',
            'tax_number' => 'required|string',
            'tax_office' => 'required|string',
            'city' => 'nullable|string',
            'photo' => 'nullable|image|max:2048',
            'logo' => 'nullable|image|max:2048',
        ]);

        $dealer = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'dealer',
            'is_approved' => true,
            'phone' => $request->phone,
            'company_name' => $request->company_name,
            'tax_number' => $request->tax_number,
            'tax_office' => $request->tax_office,
            'city' => $request->city,
        ]);

        if ($request->hasFile('photo')) {
            $dealer->photo_path = $request->file('photo')->store('dealers/photos', 'public');
        }

        if ($request->hasFile('logo')) {
            $dealer->logo_path = $request->file('logo')->store('dealers/logos', 'public');
        }

        $dealer->save();

        return response()->json($dealer, 201);
    }

    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $dealer = User::where('role', 'dealer')->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $dealer->id,
            'password' => 'nullable|string|min:6',
            'phone' => 'nullable|string',
            'company_name' => 'nullable|string',
            'tax_number' => 'nullable|string',
            'tax_office' => 'nullable|string',
            'city' => 'nullable|string',
            'photo' => 'nullable|image|max:2048',
            'logo' => 'nullable|image|max:2048',
        ]);

        $dealer->name = $request->name;
        $dealer->email = $request->email;
        $dealer->phone = $request->phone;
        $dealer->company_name = $request->company_name;
        $dealer->tax_number = $request->tax_number;
        $dealer->tax_office = $request->tax_office;
        $dealer->city = $request->city;

        if ($request->filled('password')) {
            $dealer->password = Hash::make($request->password);
        }

        if ($request->hasFile('photo')) {
            if ($dealer->photo_path) {
                Storage::disk('public')->delete($dealer->photo_path);
            }
            $dealer->photo_path = $request->file('photo')->store('dealers/photos', 'public');
        }

        if ($request->hasFile('logo')) {
            if ($dealer->logo_path) {
                Storage::disk('public')->delete($dealer->logo_path);
            }
            $dealer->logo_path = $request->file('logo')->store('dealers/logos', 'public');
        }

        $dealer->save();

        return response()->json($dealer);
    }

    // Approve/Reject Dealer
    public function updateStatus(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $dealer = User::where('role', 'dealer')->findOrFail($id);

        $request->validate([
            'is_approved' => 'required|boolean',
            'student_quota' => 'nullable|integer|min:0'
        ]);

        $dealer->is_approved = $request->is_approved;
        
        if ($request->has('student_quota')) {
            $dealer->student_quota = $request->student_quota;
        }

        $dealer->save();

        // Send notification email here (Queue)

        return response()->json($dealer);
    }
    
    // Update Quota
    public function updateQuota(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $dealer = User::where('role', 'dealer')->findOrFail($id);
        
        $request->validate([
            'quota' => 'required|integer|min:0'
        ]);

        $dealer->student_quota = $request->quota;
        $dealer->save();

        return response()->json($dealer);
    }
    public function assignTemplate(Request $request, $id)
    {
        // Admin check
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $dealer = User::where('role', 'dealer')->findOrFail($id);
            
            $request->validate([
                'template_id' => 'required|exists:certificate_templates,id',
            ]);

            // Explicitly pass assigned_at to avoid any DB default value issues
            $dealer->templates()->syncWithoutDetaching([
                $request->template_id => ['assigned_at' => now()]
            ]);

            return response()->json(['message' => 'Şablon bayiye atandı.']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Template Assignment Error: ' . $e->getMessage());
            return response()->json(['message' => 'Atama başarısız: ' . $e->getMessage()], 500);
        }
    }

    public function revokeTemplate($id, $templateId)
    {
        $dealer = User::where('role', 'dealer')->findOrFail($id);
        $dealer->templates()->detach($templateId);

        return response()->json(['message' => 'Şablon ataması kaldırıldı.']);
    }

    public function getTemplates($id)
    {
        $dealer = User::where('role', 'dealer')->findOrFail($id);
        return response()->json($dealer->templates);
    }

    // Update Requests Management
    public function getPendingUpdateRequestsCount(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['count' => 0]);
        }

        $count = ProfileUpdateRequest::where('status', 'pending')->count();
        return response()->json(['count' => $count]);
    }

    public function getUpdateRequests(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $requests = ProfileUpdateRequest::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json($requests);
    }

    public function approveUpdateRequest(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $updateRequest = ProfileUpdateRequest::with('user')->findOrFail($id);
        
        if ($updateRequest->status !== 'pending') {
            return response()->json(['message' => 'Bu talep daha önce işlenmiş.'], 400);
        }

        $dealer = $updateRequest->user;
        $requestedData = $updateRequest->requested_data;

        // Apply changes
        if (isset($requestedData['company_name'])) $dealer->company_name = $requestedData['company_name'];
        if (isset($requestedData['tax_number'])) $dealer->tax_number = $requestedData['tax_number'];
        if (isset($requestedData['tax_office'])) $dealer->tax_office = $requestedData['tax_office'];
        if (isset($requestedData['city'])) $dealer->city = $requestedData['city'];
        
        $dealer->save();

        $updateRequest->status = 'approved';
        $updateRequest->save();

        return response()->json(['message' => 'Talep onaylandı ve bilgiler güncellendi.']);
    }

    public function rejectUpdateRequest(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $updateRequest = ProfileUpdateRequest::findOrFail($id);
        
        if ($updateRequest->status !== 'pending') {
            return response()->json(['message' => 'Bu talep daha önce işlenmiş.'], 400);
        }

        $updateRequest->status = 'rejected';
        $updateRequest->save();

        return response()->json(['message' => 'Talep reddedildi.']);
    }
}
