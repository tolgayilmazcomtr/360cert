<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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

        // Apply Method Filter
        if ($request->has('method') && $request->method !== 'all') {
            $query->where('method', $request->method);
        }

        // Apply Status Filter
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return $query->paginate($request->get('per_page', 20));
    }

    // Create a new deposit request (Wire Transfer with receipt)
    public function store(Request $request)
    {
        $request->validate([
            'amount'      => 'required|numeric|min:1',
            'method'      => 'required|in:wire_transfer',
            'description' => 'nullable|string',
            'receipt'     => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $user = $request->user();

        // Save the receipt file
        $receiptPath = $request->file('receipt')->store('receipts', 'public');

        DB::beginTransaction();
        try {
            $transaction = Transaction::create([
                'user_id'       => $user->id,
                'amount'        => $request->amount,
                'type'          => 'deposit',
                'method'        => 'wire_transfer',
                'status'        => 'pending',
                'description'   => $request->description ?? 'Havale / EFT ile Bakiye Yükleme',
                'document_path' => $receiptPath,
            ]);

            DB::commit();

            // Notify all admins
            $dealerName = $user->company_name ?: $user->name;
            NotificationController::notifyAllAdmins(
                'wire_transfer_request',
                'Yeni Havale Bildirimi',
                "{$dealerName} adlı bayi " . number_format($transaction->amount, 2, ',', '.') . " TL tutarında havale bildirimi gönderdi. Dekont yüklendi, onay bekleniyor.",
                ['transaction_id' => $transaction->id, 'user_id' => $user->id]
            );

            return response()->json($transaction, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            if (isset($receiptPath)) {
                Storage::disk('public')->delete($receiptPath);
            }
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
