<?php

namespace App\Helpers;

class StringMasker
{
    public static function maskLastName($lastName)
    {
        if (empty($lastName)) {
            return '';
        }

        $length = mb_strlen($lastName, 'UTF-8');
        
        if ($length <= 2) {
            return mb_substr($lastName, 0, 1, 'UTF-8') . str_repeat('*', max(1, $length - 1));
        }

        return mb_substr($lastName, 0, 2, 'UTF-8') . str_repeat('*', $length - 2);
    }
}
