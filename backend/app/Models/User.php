<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'balance',
        'is_approved',
        'student_quota',
        'phone',
        'company_name',
        'tax_number',
        'tax_office',
        'city',
        'photo_path',
        'logo_path',
    ];

    public function profileUpdateRequests()
    {
        return $this->hasMany(ProfileUpdateRequest::class);
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    public function templates()
    {
        return $this->belongsToMany(CertificateTemplate::class, 'certificate_template_user')
                    ->withPivot('assigned_at')
                    ->withTimestamps();
    }
}
