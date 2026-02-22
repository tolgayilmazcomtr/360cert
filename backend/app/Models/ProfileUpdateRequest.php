<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfileUpdateRequest extends Model
{
    protected $fillable = [
        'user_id',
        'requested_data',
        'status',
    ];

    protected $casts = [
        'requested_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
