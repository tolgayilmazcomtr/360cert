<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Base queries
        $certificatesQuery = Certificate::query();
        $studentsQuery = Student::query();

        // Filter for dealers
        if ($user->role !== 'admin') {
            $certificatesQuery->whereHas('student', function($q) use ($user) {
                $q->where('user_id', $user->id);
            });
            $studentsQuery->where('user_id', $user->id);
        }

        // 1. Key Metrics
        $totalCertificates = $certificatesQuery->count();
        $totalStudents = $studentsQuery->count();
        
        $pendingCertificates = (clone $certificatesQuery)->where('status', 'pending')->count();
        $approvedCertificates = (clone $certificatesQuery)->where('status', 'approved')->count();

        // Calculate revenue (cost sum)
        $totalRevenue = 0;
        if ($user->role === 'admin') {
             // For admin, maybe sum all costs? Or transaction sums?
             // Let's sum certificate costs for now as a proxy for revenue/volume
             $totalRevenue = Certificate::sum('cost');
        } else {
             // For dealer, maybe spent amount?
             $totalRevenue = (clone $certificatesQuery)->sum('cost');
        }

        // 2. Monthly Trend (Last 6 Months)
        $monthlyStats = (clone $certificatesQuery)
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                DB::raw('count(*) as count')
            )
            ->where('created_at', '>=', Carbon::now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();
            
        // Fill missing months
        $chartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i)->format('Y-m');
            $found = $monthlyStats->firstWhere('month', $month);
            $chartData[] = [
                'name' => Carbon::now()->subMonths($i)->locale('tr')->isoFormat('MMMM'),
                'date' => $month,
                'count' => $found ? $found->count : 0
            ];
        }

        // 3. Recent Activity (Last 5 Certificates)
        $recentActivity = (clone $certificatesQuery)
            ->with(['student', 'training_program'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'metrics' => [
                'total_certificates' => $totalCertificates,
                'total_students' => $totalStudents,
                'pending_certificates' => $pendingCertificates,
                'total_volume' => $totalRevenue,
                'balance' => $user->balance,
                'quota' => $user->student_quota
            ],
            'chart_data' => $chartData,
            'recent_activity' => $recentActivity
        ]);
    }
}
