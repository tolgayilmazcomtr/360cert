<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'user_id',
        'tc_number',
        'first_name',
        'last_name',
        'email',
        'phone',
        'city',
        'photo_path'
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
