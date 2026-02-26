<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PageController extends Controller
{
    /**
     * Display a listing of the resource. (Admin)
     */
    public function index()
    {
        $pages = Page::orderBy('order')->get();
        return response()->json($pages);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:pages,slug',
            'content' => 'nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:1000',
            'is_published' => 'boolean',
            'is_external' => 'boolean',
            'external_url' => 'nullable|string|max:255',
            'show_in_header' => 'boolean',
            'show_in_footer' => 'boolean',
            'order' => 'integer',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        $page = Page::create($validated);

        return response()->json(['message' => 'Sayfa başarıyla oluşturuldu.', 'page' => $page], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $page = Page::findOrFail($id);
        return response()->json($page);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $page = Page::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:pages,slug,' . $page->id,
            'content' => 'nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:1000',
            'is_published' => 'boolean',
            'is_external' => 'boolean',
            'external_url' => 'nullable|string|max:255',
            'show_in_header' => 'boolean',
            'show_in_footer' => 'boolean',
            'order' => 'integer',
        ]);

        $page->update($validated);

        return response()->json(['message' => 'Sayfa başarıyla güncellendi.', 'page' => $page]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $page = Page::findOrFail($id);
        $page->delete();

        return response()->json(['message' => 'Sayfa başarıyla silindi.']);
    }

    /**
     * Get published pages for public navigation (header/footer).
     */
    public function publicIndex()
    {
        $pages = Page::where('is_published', true)
                     ->orderBy('order')
                     ->get(['title', 'slug', 'is_external', 'external_url', 'show_in_header', 'show_in_footer', 'order']);
        return response()->json($pages);
    }

    /**
     * Get a specific published page by slug.
     */
    public function publicShow($slug)
    {
        $page = Page::where('slug', $slug)
                    ->where('is_published', true)
                    ->where('is_external', false)
                    ->firstOrFail();

        return response()->json($page);
    }
}
