"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const RegisterForm = dynamic(
    () => import("@/components/auth/RegisterForm"),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center min-h-[400px] w-full max-w-lg mx-auto">
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-full flex flex-col items-center justify-center space-y-4 border border-muted">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    <p className="text-sm font-medium text-muted-foreground italic">Inicializando formulário seguro...</p>
                </div>
            </div>
        )
    }
);

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] bg-[radial-gradient(#e9ecef_1px,transparent_1px)] [background-size:20px_20px] p-4">
            <Suspense fallback={
                <div className="flex items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }>
                <RegisterForm />
            </Suspense>
        </div>
    );
}
