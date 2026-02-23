<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Storage;

class SystemSettingController extends Controller
{
    /**
     * Get all system settings as a key-value object.
     */
    public function index()
    {
        $settings = SystemSetting::all();
        $formatted = [];
        foreach ($settings as $setting) {
            $value = $setting->value;
            // Provide full URL for image types
            if ($setting->type === 'image' && $value) {
                $value = asset('storage/' . $value);
            }
            $formatted[$setting->key] = $value;
        }

        return response()->json($formatted);
    }

    /**
     * Bulk update system settings.
     */
    public function update(Request $request)
    {
        $settingsData = $request->except(['logo', '_method']);

        foreach ($settingsData as $key => $value) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        // Handle Logo Upload specifically
        if ($request->hasFile('logo')) {
            $request->validate([
                'logo' => 'image|mimes:jpeg,png,jpg,svg|max:2048'
            ]);

            $path = $request->file('logo')->store('settings', 'public');
            
            SystemSetting::updateOrCreate(
                ['key' => 'site_logo'],
                [
                    'value' => $path,
                    'type' => 'image'
                ]
            );
        }

        return response()->json(['message' => 'Ayarlar başarıyla güncellendi.']);
    }
}
