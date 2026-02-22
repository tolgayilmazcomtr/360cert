<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PackageController extends Controller
{
    // GET /packages — list active packages (both admin and dealer)
    public function index()
    {
        return response()->json(Package::orderBy('sort_order')->get());
    }

    // POST /packages — admin creates a package
    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'Unauthorized'], 403);

        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'price'         => 'required|numeric|min:1',
            'credit_amount' => 'required|integer|min:1',
            'sort_order'    => 'nullable|integer',
            'is_active'     => 'nullable|boolean',
            'is_featured'   => 'nullable|boolean',
        ]);

        return response()->json(Package::create($data), 201);
    }

    // PUT /packages/{id} — admin updates a package
    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'Unauthorized'], 403);

        $package = Package::findOrFail($id);
        $data = $request->validate([
            'name'          => 'sometimes|required|string|max:255',
            'description'   => 'nullable|string',
            'price'         => 'sometimes|required|numeric|min:1',
            'credit_amount' => 'sometimes|required|integer|min:1',
            'sort_order'    => 'nullable|integer',
            'is_active'     => 'nullable|boolean',
            'is_featured'   => 'nullable|boolean',
        ]);
        $package->update($data);
        return response()->json($package);
    }

    // DELETE /packages/{id} — admin deletes
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') return response()->json(['message' => 'Unauthorized'], 403);
        Package::findOrFail($id)->delete();
        return response()->json(['message' => 'Paket silindi.']);
    }

    // POST /packages/{id}/purchase — dealer purchases a package
    public function purchase(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role === 'admin') return response()->json(['message' => 'Yöneticiler paket satın alamaz.'], 422);

        $package = Package::where('id', $id)->where('is_active', true)->firstOrFail();

        DB::beginTransaction();
        try {
            $transaction = Transaction::create([
                'user_id'     => $user->id,
                'amount'      => $package->price,
                'type'        => 'deposit',
                'method'      => 'package',
                'status'      => 'pending',
                'description' => $package->name . ' - Paket Satın Alma Talebi (Kredi: ' . $package->credit_amount . ' TL)',
                'meta'        => json_encode(['package_id' => $package->id, 'credit_amount' => $package->credit_amount]),
            ]);
            DB::commit();
            return response()->json(['message' => 'Paket satın alma talebiniz oluşturuldu. Ödeme onayından sonra bakiyenize eklenecektir.', 'transaction' => $transaction], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'İşlem hatası: ' . $e->getMessage()], 500);
        }
    }
}
