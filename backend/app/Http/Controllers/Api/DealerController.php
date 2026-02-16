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
}
