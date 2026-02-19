<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

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
}
