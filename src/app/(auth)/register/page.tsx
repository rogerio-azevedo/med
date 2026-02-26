import { Suspense } from "react";
import dynamic from "next/dynamic";
import {
    Card,
    CardContent,
} from "@/components/ui/card";

const RegisterForm = dynamic(
    () => import("@/components/auth/RegisterForm").then((m) => m.RegisterForm),
    {
        ssr: false,
        loading: () => (
            <Card className="w-full max-w-md shadow-lg">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Carregando formulário...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }
);

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] bg-[radial-gradient(#e9ecef_1px,transparent_1px)] [background-size:20px_20px] p-4">
            <Suspense fallback={
                <Card className="w-full max-w-md shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    </CardContent>
                </Card>
            }>
                <RegisterForm />
            </Suspense>
        </div>
    );
}
