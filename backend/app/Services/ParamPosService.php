<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;

class ParamPosService
{
    protected $clientCode;
    protected $clientUsername;
    protected $password;
    protected $guid;
    protected $mode;
    protected $wsdlUrl;

    public function __construct()
    {
        $this->clientCode = config('parampos.client_code');
        $this->clientUsername = config('parampos.client_username');
        $this->password = config('parampos.password');
        $this->guid = config('parampos.guid');
        $this->mode = config('parampos.mode', 'test');

        // Always use production WSDL for schema as test WSDL is sometimes blocked by Cloudflare 403
        $this->wsdlUrl = 'https://posws.param.com.tr/turkpos.ws/service_turkpos_prod.asmx?WSDL';

        $this->endpointUrl = $this->mode === 'production' 
            ? 'https://posws.param.com.tr/turkpos.ws/service_turkpos_prod.asmx' 
            : 'https://testposws.param.com.tr/turkpos.ws/service_turkpos_prod.asmx';
    }

    /**
     * Hash algorithm for 3D Secure parameters (SHA2B64)
     */
    protected function generateHash($orderId, $amount, $totalAmount, $installments, $successUrl, $failUrl)
    {
        $hashString = $this->clientCode . $this->guid . $installments . $amount . $totalAmount . $orderId . $failUrl . $successUrl;
        
        // SHA2B64 hash: base64 of sha256
        $hashObj = hash('sha256', $this->clientCode . $this->guid . $installments . $amount . $totalAmount . $orderId . $failUrl . $successUrl);
        return base64_encode(pack('H*', $hashObj)); // Pack standard for Param
    }

    /**
     * Start a 3D Secure payment
     */
    public function start3DPayment($card, $orderInfo)
    {
        try {
            // Replace dots/commas format to standardized float format then to string
            $amountStr = number_format((float)$orderInfo['amount'], 2, ',', '');
            $totalAmountStr = number_format((float)$orderInfo['total_amount'], 2, ',', '');

            $securityString = $this->clientCode . $this->guid . $orderInfo['installments'] . $amountStr . $totalAmountStr . $orderInfo['order_id'] . $orderInfo['fail_url'] . $orderInfo['success_url'];
            
            $hashObj = hash('sha256', $securityString);
            $islemHash = base64_encode(pack('H*', $hashObj));

            $params = [
                'G' => [
                    'CLIENT_CODE' => $this->clientCode,
                    'CLIENT_USERNAME' => $this->clientUsername,
                    'CLIENT_PASSWORD' => $this->password,
                ],
                'GUID' => $this->guid,
                'KK_Sahibi' => $card['card_holder'],
                'KK_No' => str_replace(' ', '', $card['card_number']),
                'KK_SK_Ay' => $card['expire_month'],
                'KK_SK_Yil' => $card['expire_year'],
                'KK_CVC' => $card['cvc'],
                'KK_Sahibi_GSM' => $orderInfo['phone'] ?? '5555555555',
                'Hata_URL' => $orderInfo['fail_url'],
                'Basarili_URL' => $orderInfo['success_url'],
                'Siparis_ID' => $orderInfo['order_id'],
                'Siparis_Aciklama' => $orderInfo['description'] ?? 'Paket Odeme',
                'Taksit' => $orderInfo['installments'],
                'Islem_Tutar' => $amountStr,
                'Toplam_Tutar' => $totalAmountStr,
                'Islem_Hash' => $islemHash,
                'Islem_Guvenlik_Tip' => '3D', // Important for 3D Secure
                'IPAdr' => request()->ip(),
                'Ref_URL' => request()->url(),
                'Data1' => $orderInfo['data1'] ?? '', // Extra data passed to callback
                'Data2' => $orderInfo['data2'] ?? '',
                'Data3' => '',
                'Data4' => '',
                'Data5' => '',
            ];

            $client = new \SoapClient($this->wsdlUrl, [
                'trace' => 1,
                'location' => $this->endpointUrl
            ]);
            $response = $client->Pos_Odeme($params);

            if (isset($response->Pos_OdemeResult)) {
                $result = $response->Pos_OdemeResult;
                
                if ($result->Islem_ID > 0 && !empty($result->UCD_URL)) {
                    // Success initiating 3D
                    return [
                        'status' => 'success',
                        'redirect_url' => $result->UCD_URL, // User should redirect to this URL to complete 3D
                        'html' => $result->UCD_HTML ?? null,
                    ];
                } else {
                    return [
                        'status' => 'error',
                        'message' => $result->Sonuc_Str ?? 'Payment failed',
                        'code' => $result->Sonuc ?? '-1',
                    ];
                }
            }

            return ['status' => 'error', 'message' => 'Invalid API Response'];

        } catch (Exception $e) {
            Log::error('ParamPOS Error: ' . $e->getMessage());
            return ['status' => 'error', 'message' => 'Payment service error: ' . $e->getMessage()];
        }
    }
}
