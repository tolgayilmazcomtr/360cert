<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'content',
        'meta_title',
        'meta_description',
        'is_published',
        'is_external',
        'external_url',
        'show_in_header',
        'show_in_footer',
        'order',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_external' => 'boolean',
        'show_in_header' => 'boolean',
        'show_in_footer' => 'boolean',
        'order' => 'integer',
    ];
}
