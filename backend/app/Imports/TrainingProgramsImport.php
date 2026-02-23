<?php

namespace App\Imports;

use App\Models\TrainingProgram;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class TrainingProgramsImport implements ToModel, WithHeadingRow, WithValidation, SkipsEmptyRows
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        // Headers are automatically slugified by default in WithHeadingRow
        // e.g. "Eğitim Adı (TR)" becomes "egitim_adi_tr"
        $nameTr = $row['egitim_adi_tr'] ?? null;
        if (!$nameTr) {
            return null; // Skip if no TR name
        }

        $duration = $row['egitim_suresi_saat'] ?? 10;
        $price = $row['fiyat'] ?? 0.00;
        $description = $row['aciklama'] ?? null;

        // Build the localized name JSON array
        $nameJson = [
            'tr' => $nameTr,
            'en' => $row['egitim_adi_en'] ?? null,
            'de' => $row['egitim_adi_de'] ?? null,
            'fr' => $row['egitim_adi_fr'] ?? null,
            'ru' => $row['egitim_adi_ru'] ?? null,
            'ar' => $row['egitim_adi_ar'] ?? null,
        ];

        // Filter out nulls
        $nameJson = array_filter($nameJson);

        return new TrainingProgram([
            'name' => $nameJson,
            'duration_hours' => (int) $duration,
            'default_price' => (float) $price,
            'description' => $description,
            'is_active' => true,
        ]);
    }

    public function rules(): array
    {
        return [
            'egitim_adi_tr' => 'required|string|max:255',
            'egitim_suresi_saat' => 'required|numeric|min:1',
            'fiyat' => 'nullable|numeric|min:0',
        ];
    }
}
