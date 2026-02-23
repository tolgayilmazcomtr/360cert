import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const result = await login(email, password);
        if (result.success) {
            navigate("/dashboard"); // Dashboard'a yönlendir
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="absolute top-4 left-4 text-sm text-slate-500">
                IAC
            </div>

            <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">IAC Yönetim Paneli</CardTitle>
                    <CardDescription className="text-center">
                        IAC Bayi ve Yönetim Paneli
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ornek@sirket.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-500 font-medium">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            Giriş Yap
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-2 text-xs text-muted-foreground mt-4 border-t pt-4">
                </CardFooter>
            </Card>
        </div>
    );
}
