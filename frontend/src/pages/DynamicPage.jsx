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

    const isCustomLayout = page && page.content && (page.content.includes('class="bg-') || page.content.includes("class='bg-"));

    return (
        <div className="w-full bg-slate-50 min-h-screen pb-16">
            {/* Minimalist Page Header */}
            <div className="bg-slate-900 border-b border-slate-800 text-white py-16 px-6">
                <div className="max-w-5xl mx-auto space-y-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                        {page.title}
                    </h1>
                </div>
            </div>

            {/* Content Area with smart formatting */}
            <div className={`w-full ${isCustomLayout ? 'mt-8' : 'max-w-5xl mx-auto px-6 py-16'}`}>
                <div
                    className={`w-full
                        [&_p:not([class])]:mb-4 [&_p:not([class])]:text-slate-600 [&_p:not([class])]:leading-relaxed [&_p:not([class])]:text-lg
                        [&_h1:not([class])]:text-4xl [&_h1:not([class])]:font-bold [&_h1:not([class])]:text-slate-900 [&_h1:not([class])]:mb-6
                        [&_h2:not([class])]:text-3xl [&_h2:not([class])]:font-bold [&_h2:not([class])]:text-slate-900 [&_h2:not([class])]:mb-4 [&_h2:not([class])]:mt-8
                        [&_h3:not([class])]:text-2xl [&_h3:not([class])]:font-bold [&_h3:not([class])]:text-slate-900 [&_h3:not([class])]:mb-3 [&_h3:not([class])]:mt-6
                        [&_ul:not([class])]:list-disc [&_ul:not([class])]:pl-6 [&_ul:not([class])]:mb-4 [&_ul:not([class])]:text-slate-700
                        [&_ol:not([class])]:list-decimal [&_ol:not([class])]:pl-6 [&_ol:not([class])]:mb-4 [&_ol:not([class])]:text-slate-700
                        [&_li:not([class])]:mb-2
                        [&_a:not([class])]:text-blue-600 [&_a:not([class])]:underline
                        [&_strong:not([class])]:font-bold [&_strong:not([class])]:text-slate-900
                    `}
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />
            </div>
        </div>
    );
}
