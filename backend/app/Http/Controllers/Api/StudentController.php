<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Student::query()->orderBy('created_at', 'desc');

        // If dealer, show only their students
        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request)
    {
        $request->validate([
            'tc_number' => 'required|string|min:11|max:11|unique:students,tc_number',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'city' => 'nullable|string',
        ]);
        
        $user = $request->user();

        // Quota Check
        if ($user->role !== 'admin') {
            $currentStudents = Student::where('user_id', $user->id)->count();
            if ($user->student_quota <= $currentStudents) {
                return response()->json(['message' => 'Öğrenci kota limitine ulaştınız. (Limit: ' . $user->student_quota . ')'], 403);
            }
        }

        $student = Student::create([
            'user_id' => $user->id,
            'tc_number' => $request->tc_number,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'city' => $request->city,
        ]);

        return response()->json($student, 201);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        
        $header = fgetcsv($handle); // Skip header or map it
        $importedCount = 0;
        $errors = [];

        $user = $request->user();
        
        // Calculate potential import count (rough check)
        // Ideally we should count valid rows first, but for now we check per row or pre-check
        // Let's do a quick count of lines
        $lineCount = 0;
        while(fgets($handle)) $lineCount++;
        rewind($handle);
        fgetcsv($handle); // Skip header

        if ($user->role !== 'admin') {
             $currentStudents = Student::where('user_id', $user->id)->count();
             if (($currentStudents + ($lineCount - 1)) > $user->student_quota) {
                 return response()->json(['message' => 'Yüklemek istediğiniz liste kotanızı aşıyor.'], 403);
             }
        }

        while (($row = fgetcsv($handle)) !== false) {
            // Expected format: TC, First Name, Last Name, Email, Phone, City
            if (count($row) < 3) continue; 

            try {
                Student::create([
                    'user_id' => $user->id,
                    'tc_number' => $row[0],
                    'first_name' => $row[1],
                    'last_name' => $row[2],
                    'email' => $row[3] ?? null,
                    'phone' => $row[4] ?? null,
                    'city' => $row[5] ?? null,
                ]);
                $importedCount++;
            } catch (\Exception $e) {
                $errors[] = "Satır " . ($importedCount + 2) . ": " . $e->getMessage();
            }
        }

        fclose($handle);

        return response()->json([
            'message' => "$importedCount öğrenci başarıyla eklendi.",
            'errors' => $errors
        ]);
    }
    
    public function show(Request $request, $id)
    {
        $student = Student::findOrFail($id);
        if ($request->user()->id !== $student->user_id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Yetkisiz erişim.'], 403);
        }
        return response()->json($student);
    }

    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);
        
        // Simple authorization check
        if ($request->user()->id !== $student->user_id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Yetkisiz işlem.'], 403);
        }

        $validated = $request->validate([
            'tc_number' => 'required|string|size:11|unique:students,tc_number,' . $id,
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'city' => 'nullable|string',
        ]);

        $student->update($validated);

        return response()->json($student);
    }

    public function destroy(Request $request, $id)
    {
        $student = Student::findOrFail($id);
        
        if ($request->user()->id !== $student->user_id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Yetkisiz işlem.'], 403);
        }

        $student->delete();

        return response()->json(['message' => 'Öğrenci silindi.']);
    }
}
