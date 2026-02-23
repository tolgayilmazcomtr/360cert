<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    // List transactions for the authenticated user (or all if admin) with advanced filtering
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Transaction::with('user')->orderBy('created_at', 'desc');

        // Filter by user context
        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        // Apply Search (User name or company name) - only makes sense for Admin really
        if ($request->has('search') && $user->role === 'admin') {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        // Apply Date Range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59'
            ]);
        }

        // Apply Type Filter
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Apply Status Filter
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return $query->paginate($request->get('per_page', 20));
    }

    // Create a new deposit request (Credit Card or Wire Transfer)
    public function store(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'method' => 'required|in:credit_card,wire_transfer',
            'description' => 'nullable|string',
        ]);

        $user = $request->user();
        $status = 'pending';
        
        // Mock Credit Card Process: Auto approve if method is credit_card
        if ($request->method === 'credit_card') {
            $status = 'approved';
            // Here you would integrate with Iyzico/PayTR
        }

        DB::beginTransaction();
        try {
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'amount' => $request->amount,
                'type' => 'deposit',
                'method' => $request->method,
                'status' => $status,
                'description' => $request->description ?? 'Bakiye Yükleme',
            ]);

            // If auto-approved (Credit Card), update balance immediately
            if ($status === 'approved') {
                $user->increment('balance', $request->amount);
            }

            DB::commit();

            return response()->json($transaction, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'İşlem sırasında hata oluştu.'], 500);
        }
    }

    // Admin: Manually add balance or approve/reject wire transfers
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Yetkisiz işlem.'], 403);
        }

        $transaction = Transaction::findOrFail($id);

        if ($transaction->status !== 'pending') {
            return response()->json(['message' => 'Bu işlem zaten sonuçlanmış.'], 400);
        }

        DB::beginTransaction();
        try {
            $transaction->update(['status' => $request->status]);

            if ($request->status === 'approved' && $transaction->type === 'deposit') {
                $user = User::findOrFail($transaction->user_id);
                $user->increment('balance', $transaction->amount);
            }

            DB::commit();
            return response()->json($transaction);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Güncelleme hatası.'], 500);
        }
    }
}
