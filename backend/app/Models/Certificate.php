<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'certificate_no',
        'student_id',
        'training_program_id',
        'certificate_template_id',
        'issue_date',
        'expiry_date',
        'status',
        'mernis_status',
        'qr_code_hash',
        'rejection_reason',
        'cost',
        'certificate_language',
        'duration_hours',
        'start_date',
        'end_date',
        'transcript_path',
        'transcript_data',
    ];

    protected $casts = [
        'transcript_data' => 'array',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
    
    public function training_program()
    {
        return $this->belongsTo(TrainingProgram::class);
    }
    
    public function template()
    {
        return $this->belongsTo(CertificateTemplate::class, 'certificate_template_id');
    }

    public function certificateType()
    {
        return $this->belongsTo(CertificateType::class, 'certificate_type_id');
    }
}

