<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Helper: create a notification for a specific user.
     */
    public static function createFor(int $userId, string $type, string $title, string $body = '', array $data = []): void
    {
        Notification::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'body'    => $body,
            'data'    => $data,
        ]);
    }

    /**
     * Helper: create a notification for all admin users.
     */
    public static function notifyAllAdmins(string $type, string $title, string $body = '', array $data = []): void
    {
        $admins = User::where('role', 'admin')->where('is_active', true)->pluck('id');
        foreach ($admins as $adminId) {
            self::createFor($adminId, $type, $title, $body, $data);
        }
    }

    /**
     * Helper: create a notification for all active dealer users.
     */
    public static function notifyAllDealers(string $type, string $title, string $body = '', array $data = []): void
    {
        $dealers = User::where('role', 'dealer')
            ->where('is_active', true)
            ->where('is_approved', true)
            ->pluck('id');
        foreach ($dealers as $dealerId) {
            self::createFor($dealerId, $type, $title, $body, $data);
        }
    }

    /**
     * GET /notifications — list for authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        return response()->json($notifications);
    }

    /**
     * GET /notifications/unread-count
     */
    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();
        return response()->json(['count' => $count]);
    }

    /**
     * PUT /notifications/{id}/read
     */
    public function markRead(Request $request, $id)
    {
        $n = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $n->update(['read_at' => now()]);
        return response()->json(['message' => 'Okundu olarak işaretlendi.']);
    }

    /**
     * PUT /notifications/read-all
     */
    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        return response()->json(['message' => 'Tümü okundu olarak işaretlendi.']);
    }

    /**
     * DELETE /notifications/{id}
     */
    public function destroy(Request $request, $id)
    {
        $n = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $n->delete();
        return response()->json(['message' => 'Bildirim silindi.']);
    }

    /**
     * POST /notifications/announce — Admin: send announcement to all/specific dealers
     */
    public function announce(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title'   => 'required|string|max:255',
            'body'    => 'required|string',
            'target'  => 'required|in:all,active', // 'all' = all dealers, 'active' = active+approved
        ]);

        if ($validated['target'] === 'active') {
            self::notifyAllDealers('announcement', $validated['title'], $validated['body']);
        } else {
            // all dealers (active or not, but is_approved)
            $dealers = User::where('role', 'dealer')->where('is_approved', true)->pluck('id');
            foreach ($dealers as $dealerId) {
                self::createFor($dealerId, 'announcement', $validated['title'], $validated['body']);
            }
        }

        // Also save in admin's own sent history (so they can see what they sent)
        Notification::create([
            'user_id' => $user->id,
            'type'    => 'announcement_sent',
            'title'   => '[Gönderildi] ' . $validated['title'],
            'body'    => $validated['body'],
            'data'    => ['target' => $validated['target']],
        ]);

        return response()->json(['message' => 'Duyuru başarıyla gönderildi.']);
    }
}
