<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

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

    protected $appends = ['document_url'];

    public function getDocumentUrlAttribute(): ?string
    {
        if (!$this->document_path) return null;
        return Storage::disk('public')->url($this->document_path);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
