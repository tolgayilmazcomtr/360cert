<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Package;
use App\Models\Transaction;
use App\Services\ParamPosService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected $paramPos;

    public function __construct(ParamPosService $paramPos)
    {
        $this->paramPos = $paramPos;
    }

    /**
     * Start the payment process for a package
     */
    public function process(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Yöneticiler paket satın alamaz.'], 422);
        }

        $request->validate([
            'package_id' => 'required|exists:packages,id',
            'card_name' => 'required|string',
            'card_number' => 'required|string',
            'expire_month' => 'required|string|size:2',
            'expire_year' => 'required|string|size:4',
            'cvc' => 'required|string|min:3|max:4',
        ]);

        $package = Package::where('id', $request->package_id)->where('is_active', true)->firstOrFail();

        DB::beginTransaction();
        try {
            // Create a pending transaction
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'amount' => $package->price,
                'type' => 'deposit',
                'method' => 'credit_card',
                'status' => 'pending',
                'description' => "{$package->name} - Paket Satın Alma (Kredi: {$package->credit_amount} TL)",
                'meta' => json_encode([
                    'package_id' => $package->id,
                    'credit_amount' => $package->credit_amount,
                ]),
            ]);

            // Construct order info for Param
            $orderId = 'TRX-' . $transaction->id . '-' . time();
            $transaction->meta = json_encode(array_merge(json_decode($transaction->meta, true), ['order_id' => $orderId]));
            $transaction->save();
            DB::commit();

            // Card details
            $card = [
                'card_holder' => $request->card_name,
                'card_number' => $request->card_number,
                'expire_month' => $request->expire_month,
                'expire_year' => $request->expire_year,
                'cvc' => $request->cvc,
            ];

            // Order info
            $frontendUrl = rtrim(env('FRONTEND_URL', config('app.url')), '/');
            $callbackUrl = env('APP_URL') . '/api/payment/callback';

            $orderInfo = [
                'order_id' => $orderId,
                'amount' => $package->price,
                'total_amount' => $package->price,
                'installments' => '1',
                'description' => "Paket: {$package->name}",
                'phone' => '5555555555',
                'success_url' => $callbackUrl,
                'fail_url' => $callbackUrl,
                'data1' => $transaction->id,
                'data2' => $user->id,
            ];

            // Start 3D Secure
            $result = $this->paramPos->start3DPayment($card, $orderInfo);

            if ($result['status'] === 'success') {
                return response()->json([
                    'status' => 'success',
                    'redirect_url' => $result['redirect_url'],
                    'html' => $result['html'] ?? null,
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Ödeme başlatılamadı: ' . $result['message']
                ], 400);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment processing failed: ' . $e->getMessage());
            return response()->json(['message' => 'İşlem hatası oluştu.'], 500);
        }
    }

    /**
     * Handle the callback from ParamPOS (3D Secure result)
     */
    public function callback(Request $request)
    {
        Log::info('ParamPOS Callback Data:', $request->all());

        $frontendUrl = rtrim(env('FRONTEND_URL', config('app.url')), '/');
        
        $transactionId = $request->input('Data1');
        $status = $request->input('TURKPOS_RETVAL_Sonuc');
        $resultMessage = $request->input('TURKPOS_RETVAL_Sonuc_Str');

        if (!$transactionId) {
            return redirect()->to($frontendUrl . '/balance?payment_status=error&message=' . urlencode('Geçersiz işlem sonucu.'));
        }

        $transaction = Transaction::find($transactionId);
        if (!$transaction) {
            return redirect()->to($frontendUrl . '/balance?payment_status=error&message=' . urlencode('İşlem bulunamadı.'));
        }

        if ($transaction->status !== 'pending') {
            return redirect()->to($frontendUrl . '/balance?payment_status=info&message=' . urlencode('Bu işlem zaten sonuçlandırılmış.'));
        }

        if ((int)$status > 0) {
            DB::beginTransaction();
            try {
                $transaction->status = 'approved';
                $transaction->save();
                
                $user = $transaction->user;
                $user->balance += $transaction->amount;
                $user->save();
                
                DB::commit();
                return redirect()->to($frontendUrl . '/balance?payment_status=success');
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Callback Success Processing Failed: ' . $e->getMessage());
                return redirect()->to($frontendUrl . '/balance?payment_status=error&message=' . urlencode('Bakiye eklenirken hata oluştu.'));
            }
        } else {
            $transaction->status = 'failed';
            $transaction->save();
            return redirect()->to($frontendUrl . '/balance?payment_status=error&message=' . urlencode($resultMessage ?? 'Kredi kartı işlemi reddedildi.'));
        }
    }
}
