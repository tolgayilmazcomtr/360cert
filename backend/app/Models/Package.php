<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = [
        'name', 'description', 'price', 'credit_amount',
        'sort_order', 'is_active', 'is_featured',
    ];

    protected $casts = [
        'is_active'   => 'boolean',
        'is_featured' => 'boolean',
        'price'       => 'float',
    ];
}
