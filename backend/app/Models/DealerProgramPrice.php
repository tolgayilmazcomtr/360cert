<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DealerProgramPrice extends Model
{
    protected $fillable = ['dealer_id', 'training_program_id', 'price'];

    public function dealer()
    {
        return $this->belongsTo(User::class, 'dealer_id');
    }

    public function trainingProgram()
    {
        return $this->belongsTo(TrainingProgram::class);
    }
}
