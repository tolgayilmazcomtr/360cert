<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'type', // deposit, expense, refund
        'method', // credit_card, wire_transfer, system
        'status', // pending, approved, rejected
        'description',
        'document_path',
        'meta'
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
