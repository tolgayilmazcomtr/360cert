import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import api from "@/api/axios";
import { Loader2 } from "lucide-react";

export default function DynamicPage() {
    const { slug } = useParams();
    const [page, setPage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                setIsLoading(true);
                setError(false);
                const res = await api.get(`/public/pages/${slug}`);
                setPage(res.data);

                // Update document meta
                if (res.data.meta_title) document.title = res.data.meta_title;
            } catch (err) {
                console.error("Sayfa bulunamadı:", err);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) {
            fetchPage();
        }
    }, [slug]);

    if (isLoading) {
        return (
            <div className="flex-1 flex justify-center items-center py-32">
                <Loader2 className="animate-spin text-primary h-12 w-12" />
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center py-32 space-y-4">
                <h1 className="text-4xl font-bold text-slate-800">404</h1>
                <p className="text-lg text-slate-500">Aradığınız sayfa bulunamadı.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Minimalist Page Header */}
            <div className="bg-slate-900 border-b border-slate-800 text-white py-16 px-6">
                <div className="max-w-4xl mx-auto space-y-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                        {page.title}
                    </h1>
                </div>
            </div>

            {/* Content Area uses tailwind typography prose ideally, but we'll simulate generic HTML styles */}
            <div className="max-w-4xl mx-auto px-6 py-16 text-slate-700">
                <div
                    className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-a:text-blue-600 hover:prose-a:text-blue-500"
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />
            </div>
        </div>
    );
}
