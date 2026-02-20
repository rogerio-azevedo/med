import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Bem-vindo ao <span className="text-blue-600">med</span>
        </h1>

        <p className="mt-3 text-2xl">
          Sistema de gestão médica inteligente.
        </p>

        <div className="flex mt-6 gap-4">
          <Link href="/login">
            <Button size="lg">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg">
              Criar conta
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
