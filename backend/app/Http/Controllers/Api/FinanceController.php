<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    /**
     * Get financial statistics and chart data.
     */
    public function stats(Request $request)
    {
        $user = $request->user();

        // 1. Core Metrics
        $totalIncome = 0;
        $pendingPayments = 0;
        $pendingPaymentsCount = 0;

        // If admin, show all system revenue (sum of approved transactions)
        // If dealer, show their total spent/deposited
        $transactionQuery = Transaction::query();
        if ($user->role !== 'admin') {
            $transactionQuery->where('user_id', $user->id);
        }

        $totalIncome = (clone $transactionQuery)
            ->where('status', 'approved')
            ->sum('amount');

        $pendingTransactions = (clone $transactionQuery)
            ->where('status', 'pending');
        $pendingPayments = $pendingTransactions->sum('amount');
        $pendingPaymentsCount = $pendingTransactions->count();

        // Admin sees total active dealer balances
        $activeDealerBalance = 0;
        if ($user->role === 'admin') {
            $activeDealerBalance = User::where('role', 'dealer')->where('is_active', true)->sum('balance');
        } else {
            $activeDealerBalance = collect([$user])->sum('balance');
        }

        // 2. Trend Data (Last 6 Months Income/Expense)
        // For admin: Income = deposits/package purchases. Expense = (abstract concept, maybe refunds, we'll keep it 0 or track certificate cost as expense)
        $chartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = Carbon::now()->subMonths($i)->startOfMonth();
            $monthEnd = Carbon::now()->subMonths($i)->endOfMonth();
            $monthLabel = $monthStart->locale('tr')->isoFormat('MMMM');

            $monthlyIncome = (clone $transactionQuery)
                ->where('status', 'approved')
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->sum('amount');

            // For now, expense is mocked as 0 or a nominal relation to income for visual flavor since we don't have explicit expenses tables.
            // Let's use certificate creation counts * base cost if admin, else 0.
            $monthlyExpense = 0;
            if ($user->role === 'admin') {
                $monthlyExpense = DB::table('certificates')
                    ->where('status', 'approved')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->sum('cost');
            }

            $chartData[] = [
                'name' => mb_convert_case($monthLabel, MB_CASE_TITLE, "UTF-8"),
                'income' => $monthlyIncome,
                'expense' => $monthlyExpense
            ];
        }

        // 3. Package Sales Data
        // Aggregate descriptions that look like package names in transactions
        $packageQuery = (clone $transactionQuery)
            ->select('description as name', DB::raw('count(*) as count'))
            ->where('status', 'approved')
            ->where('description', 'like', '%Paket%')
            ->where('created_at', '>=', Carbon::now()->startOfMonth())
            ->groupBy('description')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        // If no package stats yet this month, return some empty structure or fallback
        if ($packageQuery->isEmpty()) {
            $packageQuery = [
                ['name' => 'Henüz Paket Satışı Yok', 'count' => 0]
            ];
        }

        return response()->json([
            'metrics' => [
                'total_income' => $totalIncome,
                'pending_amount' => $pendingPayments,
                'pending_count' => $pendingPaymentsCount,
                'active_dealer_balance' => $activeDealerBalance,
                'trend' => '+0%' // Example logic placeholder
            ],
            'chart_data' => $chartData,
            'package_data' => $packageQuery
        ]);
    }
}
