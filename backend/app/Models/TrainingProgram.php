<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingProgram extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'duration_hours',
        'default_price',
        'is_active',
    ];
}
