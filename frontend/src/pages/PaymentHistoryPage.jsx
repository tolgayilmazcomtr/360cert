import React from 'react';
import { Card } from "@/components/ui/card";
import { History } from "lucide-react";

export default function PaymentHistoryPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="bg-slate-100 p-6 rounded-full">
                <History size={48} className="text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700">Ödeme Geçmişi</h2>
            <p className="text-muted-foreground max-w-md">
                Bu sayfa henüz yapım aşamasındadır. Yakında geçmiş ödemelerinizi buradan görüntüleyebileceksiniz.
            </p>
        </div>
    );
}
