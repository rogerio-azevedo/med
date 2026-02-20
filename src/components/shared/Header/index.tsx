import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function Header() {
    return (
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <form
                action={async () => {
                    "use server";
                    await signOut();
                }}
            >
                <Button variant="outline" size="sm">
                    Sair
                </Button>
            </form>
        </header>
    );
}
