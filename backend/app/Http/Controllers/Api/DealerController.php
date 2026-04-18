<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ProfileUpdateRequest;
use App\Models\DealerProgramPrice;
use App\Models\TrainingProgram;
use App\Models\Transaction;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class DealerController extends Controller
{
    // List dealers
    // Admin: all top-level dealers (no parent)
    // Main dealer: their own sub-dealers
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            $query = User::where('role', 'dealer')->whereNull('parent_id')->where(function($q) {
                $q->where('is_active', true)->orWhereNull('is_active');
            });

            if ($request->has('status')) {
                if ($request->status === 'pending') {
                    $query->where('is_approved', false);
                } else if ($request->status === 'approved') {
                    $query->where('is_approved', true);
                }
            }

            return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
        }

        // Main dealer: list their sub-dealers
        if ($user->role === 'dealer' && $user->is_main_dealer) {
            return response()->json(
                User::where('role', 'dealer')->where('parent_id', $user->id)
                    ->orderBy('created_at', 'desc')->paginate(20)
            );
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'admin' && !($user->role === 'dealer' && $user->is_main_dealer)) {
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
            // Sub-dealer: parent is the main dealer creating them
            'parent_id' => ($user->role === 'dealer' && $user->is_main_dealer) ? $user->id : null,
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
        $user = $request->user();

        if ($user->role !== 'admin' && !($user->role === 'dealer' && $user->is_main_dealer)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = User::where('role', 'dealer');
        // Main dealer can only edit their own sub-dealers
        if ($user->role === 'dealer') {
            $query->where('parent_id', $user->id);
        }
        $dealer = $query->findOrFail($id);

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
            if ($dealer->photo_path) Storage::disk('public')->delete($dealer->photo_path);
            $dealer->photo_path = $request->file('photo')->store('dealers/photos', 'public');
        }

        if ($request->hasFile('logo')) {
            if ($dealer->logo_path) Storage::disk('public')->delete($dealer->logo_path);
            $dealer->logo_path = $request->file('logo')->store('dealers/logos', 'public');
        }

        $dealer->save();

        return response()->json($dealer);
    }

    // Approve/Reject Dealer (admin only)
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

        return response()->json($dealer);
    }

    // Toggle is_main_dealer flag (admin only)
    public function updateMainDealerStatus(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $dealer = User::where('role', 'dealer')->whereNull('parent_id')->findOrFail($id);

        $request->validate(['is_main_dealer' => 'required|boolean']);

        $dealer->is_main_dealer = $request->is_main_dealer;
        $dealer->save();

        return response()->json($dealer);
    }

    // Update Quota
    public function updateQuota(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $dealer = User::where('role', 'dealer')->findOrFail($id);

        $request->validate(['quota' => 'required|integer|min:0']);

        $dealer->student_quota = $request->quota;
        $dealer->save();

        return response()->json($dealer);
    }

    public function assignTemplate(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $dealer = User::where('role', 'dealer')->findOrFail($id);

            $request->validate([
                'template_id' => 'required|exists:certificate_templates,id',
            ]);

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

    // --- Bank Info (Main Dealer) ---

    // Get main dealer's bank info — accessible by the main dealer themselves or their sub-dealers
    public function getBankInfo(Request $request, $id)
    {
        $user = $request->user();

        // Main dealer viewing their own info, or sub-dealer viewing parent's info, or admin
        if ($user->role !== 'admin' && $user->id != $id && $user->parent_id != $id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $dealer = User::where('role', 'dealer')->where('is_main_dealer', true)->findOrFail($id);

        return response()->json([
            'bank_account_name' => $dealer->bank_account_name,
            'bank_iban'         => $dealer->bank_iban,
            'bank_name'         => $dealer->bank_name,
            'bank_description'  => $dealer->bank_description,
        ]);
    }

    // Update main dealer's bank info (main dealer only)
    public function updateBankInfo(Request $request, $id)
    {
        $user = $request->user();

        if ($user->role !== 'admin' && $user->id != $id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $dealer = User::where('role', 'dealer')->where('is_main_dealer', true)->findOrFail($id);

        $request->validate([
            'bank_account_name' => 'nullable|string|max:255',
            'bank_iban'         => 'nullable|string|max:50',
            'bank_name'         => 'nullable|string|max:255',
            'bank_description'  => 'nullable|string|max:500',
        ]);

        $dealer->bank_account_name = $request->bank_account_name;
        $dealer->bank_iban         = $request->bank_iban;
        $dealer->bank_name         = $request->bank_name;
        $dealer->bank_description  = $request->bank_description;
        $dealer->save();

        return response()->json(['message' => 'Banka bilgileri güncellendi.', 'dealer' => $dealer]);
    }

    // --- Program Prices (Main Dealer) ---

    // Get custom prices for a dealer (admin: any dealer; main dealer: own)
    public function getProgramPrices(Request $request, $id)
    {
        $user = $request->user();

        if ($user->role !== 'admin' && $user->id != $id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $dealer = User::where('role', 'dealer')->findOrFail($id);

        $prices = $dealer->programPrices()->with('trainingProgram')->get();
        return response()->json($prices);
    }

    // Set/update a custom price (admin: any dealer; main dealer: own)
    public function setProgramPrice(Request $request, $id)
    {
        $user = $request->user();

        if ($user->role !== 'admin' && $user->id != $id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $dealer = User::where('role', 'dealer')->findOrFail($id);

        $request->validate([
            'training_program_id' => 'required|exists:training_programs,id',
            'price' => 'required|numeric|min:0',
        ]);

        $price = DealerProgramPrice::updateOrCreate(
            ['dealer_id' => $dealer->id, 'training_program_id' => $request->training_program_id],
            ['price' => $request->price]
        );

        return response()->json($price->load('trainingProgram'));
    }

    // Delete a custom price (fall back to default)
    public function deleteProgramPrice(Request $request, $id, $programId)
    {
        $user = $request->user();

        if ($user->role !== 'admin' && $user->id != $id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        DealerProgramPrice::where('dealer_id', $id)
            ->where('training_program_id', $programId)
            ->delete();

        return response()->json(['message' => 'Özel fiyat kaldırıldı.']);
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

        if (isset($requestedData['company_name'])) $dealer->company_name = $requestedData['company_name'];
        if (isset($requestedData['tax_number'])) $dealer->tax_number = $requestedData['tax_number'];
        if (isset($requestedData['tax_office'])) $dealer->tax_office = $requestedData['tax_office'];
        if (isset($requestedData['city'])) $dealer->city = $requestedData['city'];

        $dealer->save();

        $updateRequest->status = 'approved';
        $updateRequest->save();

        return response()->json(['message' => 'Talep onaylandı ve bilgiler güncellendi.']);
    }

    /**
     * Dealer transaction history (for reporting modal).
     * Admin can view any dealer. Main dealer can view own sub-dealers.
     */
    /** List inactive (soft-deleted) dealers */
    public function inactive(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $dealers = User::where('role', 'dealer')
            ->whereNull('parent_id')
            ->where('is_active', false)
            ->whereNotNull('is_active')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($dealers);
    }

    /** Restore a soft-deleted dealer (set is_active = true) */
    public function restore(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $dealer = User::where('role', 'dealer')->where('is_active', false)->findOrFail($id);
        $dealer->is_active = true;
        $dealer->save();

        return response()->json(['message' => 'Bayi geri getirildi.']);
    }

    /** Permanently delete a dealer and all related data */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $dealer = User::where('role', 'dealer')->findOrFail($id);

        // Delete media files
        if ($dealer->photo_path) Storage::disk('public')->delete($dealer->photo_path);
        if ($dealer->logo_path) Storage::disk('public')->delete($dealer->logo_path);

        $dealer->delete();

        return response()->json(['message' => 'Bayi kalıcı olarak silindi.']);
    }

    public function transactions(Request $request, $id)
    {
        $user = $request->user();
        $dealer = \App\Models\User::where('role', 'dealer')->findOrFail($id);

        if ($user->role === 'admin') {
            // OK
        } elseif ($user->role === 'dealer' && $user->is_main_dealer && $dealer->parent_id === $user->id) {
            // OK
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // All dealer IDs to include (dealer + its sub-dealers if main)
        $dealerIds = [$dealer->id];
        $subIds = \App\Models\User::where('parent_id', $dealer->id)->pluck('id')->toArray();
        $allIds = array_merge($dealerIds, $subIds);

        $transactions = \App\Models\Transaction::whereIn('user_id', $allIds)
            ->with('user:id,name,company_name,parent_id')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'date' => $t->created_at->format('d.m.Y H:i'),
                    'type' => $t->type,
                    'amount' => (float) $t->amount,
                    'method' => $t->method,
                    'status' => $t->status,
                    'description' => $t->description,
                    'dealer_name' => $t->user?->company_name ?: $t->user?->name,
                    'is_sub_dealer' => !is_null($t->user?->parent_id),
                ];
            });

        return response()->json($transactions);
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

    /**
     * Dealer stats for reporting: cert count + total spend per dealer.
     * Admin → all top-level dealers (+ their sub-dealers aggregated)
     * Main dealer → their own sub-dealers
     */
    public function stats(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            // Top-level dealers
            $dealers = User::where('role', 'dealer')->whereNull('parent_id')->get();
        } elseif ($user->role === 'dealer' && $user->is_main_dealer) {
            $dealers = User::where('role', 'dealer')->where('parent_id', $user->id)->get();
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $result = $dealers->map(function ($dealer) {
            $dealerIds = [$dealer->id];
            $subIds = \App\Models\User::where('parent_id', $dealer->id)->pluck('id')->toArray();
            $allIds = array_merge($dealerIds, $subIds);

            // Certificates linked via students
            $studentIds = \App\Models\Student::whereIn('user_id', $allIds)->pluck('id')->toArray();
            $certCount = empty($studentIds) ? 0 : \App\Models\Certificate::whereIn('student_id', $studentIds)->count();

            $totalSpend = \App\Models\Transaction::whereIn('user_id', $allIds)
                ->where('type', 'expense')
                ->where('status', 'approved')
                ->sum('amount');

            // Sub-dealer breakdown
            $subStats = \App\Models\User::where('parent_id', $dealer->id)->get()->map(function ($sub) {
                $subStudentIds = \App\Models\Student::where('user_id', $sub->id)->pluck('id')->toArray();
                $subCertCount = empty($subStudentIds) ? 0 : \App\Models\Certificate::whereIn('student_id', $subStudentIds)->count();
                $subTotalSpend = \App\Models\Transaction::where('user_id', $sub->id)
                    ->where('type', 'expense')
                    ->where('status', 'approved')
                    ->sum('amount');
                return [
                    'id' => $sub->id,
                    'name' => $sub->name,
                    'company_name' => $sub->company_name,
                    'balance' => $sub->balance,
                    'cert_count' => $subCertCount,
                    'total_spend' => (float) $subTotalSpend,
                ];
            });

            return [
                'id' => $dealer->id,
                'name' => $dealer->name,
                'company_name' => $dealer->company_name,
                'balance' => $dealer->balance,
                'is_main_dealer' => (bool) $dealer->is_main_dealer,
                'cert_count' => $certCount,
                'total_spend' => (float) $totalSpend,
                'sub_dealers' => $subStats,
            ];
        });

        return response()->json($result);
    }

    /**
     * Add balance to a dealer.
     * Admin can top up any top-level dealer.
     * Main dealer can top up their own sub-dealers.
     */
    public function addBalance(Request $request, $id)
    {
        $user = $request->user();

        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'note' => 'nullable|string|max:255',
        ]);

        $dealer = User::where('role', 'dealer')->findOrFail($id);

        // Authorization
        if ($user->role === 'admin') {
            // Admin can top up any dealer
        } elseif ($user->role === 'dealer' && $user->is_main_dealer) {
            if ($dealer->parent_id !== $user->id) {
                return response()->json(['message' => 'Bu bayiye ödeme ekleyemezsiniz.'], 403);
            }
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        DB::beginTransaction();
        try {
            $dealer->increment('balance', $request->amount);

            Transaction::create([
                'user_id' => $dealer->id,
                'amount' => $request->amount,
                'type' => 'deposit',
                'method' => 'wire_transfer',
                'status' => 'approved',
                'description' => $request->note ?: 'Manuel bakiye yükleme',
            ]);

            DB::commit();
            return response()->json([
                'message' => 'Bakiye başarıyla eklendi.',
                'new_balance' => $dealer->fresh()->balance,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'İşlem başarısız.'], 500);
        }
    }
}
