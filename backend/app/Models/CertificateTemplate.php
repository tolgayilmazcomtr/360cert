<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CertificateTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'background_path',
        'type',
        'layout_config',
        'is_active',
        'certificate_type_id',
    ];

    protected $casts = [
        'layout_config' => 'array',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'certificate_template_user')
                    ->withPivot('assigned_at')
                    ->withTimestamps();
    }

    public function certificateType()
    {
        return $this->belongsTo(CertificateType::class, 'certificate_type_id');
    }
}
