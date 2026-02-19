import React from 'react';
import { Card } from "@/components/ui/card";
import { Hammer } from "lucide-react";

export default function PackagesPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="bg-slate-100 p-6 rounded-full">
                <Hammer size={48} className="text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700">Paketler Sayfası</h2>
            <p className="text-muted-foreground max-w-md">
                Bu sayfa henüz yapım aşamasındadır. Yakında paket satın alma ve yönetme özellikleri eklenecektir.
            </p>
        </div>
    );
}
