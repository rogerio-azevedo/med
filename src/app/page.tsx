import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CircleCheckBig,
  ClipboardPlus,
  FileText,
  HeartPulse,
  Hospital,
  MessageCircleMore,
  ShieldCheck,
  SquareKanban,
  Stethoscope,
  TestTube2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Gestão de Médicos e Pacientes",
    description:
      "Centralize cadastros, histórico e relacionamento assistencial em uma única operação.",
    icon: UsersRound,
  },
  {
    title: "Gestão de Tarefas",
    description:
      "Organize fluxos internos com clareza para recepção, equipe clínica e administração.",
    icon: SquareKanban,
  },
  {
    title: "Agendamentos",
    description:
      "Visualize a agenda completa da clínica e conduza atendimentos com mais previsibilidade.",
    icon: CalendarDays,
  },
  {
    title: "Prontuário",
    description:
      "Acompanhe a evolução do paciente com contexto clínico acessível e bem estruturado.",
    icon: HeartPulse,
  },
  {
    title: "Convênios",
    description:
      "Gerencie vínculos e dados assistenciais sem espalhar informações entre múltiplas planilhas.",
    icon: Hospital,
  },
  {
    title: "Pedidos de Exames",
    description:
      "Registre solicitações com mais fluidez e mantenha o atendimento conectado à rotina médica.",
    icon: TestTube2,
  },
  {
    title: "Atestados",
    description:
      "Emita documentos com agilidade dentro do mesmo ambiente operacional da consulta.",
    icon: FileText,
  },
  {
    title: "E muito mais",
    description:
      "Um ecossistema pensado para crescer com clínicas e consultórios sem perder simplicidade.",
    icon: ClipboardPlus,
  },
] as const;

const trustHighlights = [
  "Operação centralizada",
  "Experiência intuitiva",
  "Fluxo clínico organizado",
  "Base pronta para escalar",
] as const;

const benefits = [
  {
    title: "Da recepção ao prontuário, tudo conversa",
    description:
      "A clínica trabalha com menos retrabalho quando agenda, cadastro, atendimento e documentos fazem parte do mesmo fluxo.",
  },
  {
    title: "Mais clareza para a equipe no dia a dia",
    description:
      "Cada etapa fica visível, reduzindo gargalos e melhorando o ritmo entre atendimento, gestão e acompanhamento.",
  },
  {
    title: "Estrutura moderna para crescer com segurança",
    description:
      "O med nasce para apoiar consultórios e clínicas que querem profissionalizar a operação sem abrir mão de agilidade.",
  },
] as const;

const workspaceSignals = [
  "Agenda inteligente por profissional",
  "Painel clínico com visão rápida do dia",
  "Documentação e tarefas no mesmo ambiente",
] as const;

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_32%),linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f8fafc_100%)]">
      <div className="landing-noise landing-grid absolute inset-0 opacity-70" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/70 to-transparent" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-16 sm:px-8 lg:px-12">
        <div className="grid w-full gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="landing-fade-up flex flex-col items-start">
            <span className="landing-chip mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/70 px-4 py-2 text-xs font-semibold tracking-[0.24em] text-blue-700 uppercase">
              <ShieldCheck className="size-4" />
              Gestão clínica premium
            </span>

            <h1 className="landing-heading max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              O sistema mais moderno e completo para{" "}
              <span className="bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                clínicas e consultórios
              </span>
              .
            </h1>

            <p className="landing-copy mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              O <span className="font-semibold text-slate-900">med</span>{" "}
              centraliza agenda, prontuário, cadastros, tarefas e rotinas
              assistenciais em uma experiência elegante, organizada e pronta
              para acelerar sua operação.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-slate-950 px-7 text-base shadow-lg shadow-slate-950/15 hover:bg-slate-800"
              >
                <Link href="/login">
                  Entrar no sistema
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              {/*
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-slate-200 bg-white/80 px-7 text-base text-slate-700 shadow-sm hover:bg-white"
              >
                <Link href="/register">Criar conta</Link>
              </Button>
              */}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {trustHighlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur"
                >
                  <CircleCheckBig className="size-4 text-blue-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="landing-fade-up-delay relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-200/50 via-white to-cyan-100/40 blur-2xl" />
            <Card className="landing-card overflow-hidden rounded-[2rem] border-white/70 py-0">
              <CardContent className="p-0">
                <div className="border-b border-slate-200/70 bg-white/80 px-6 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Plataforma med
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                        Visão central da clínica
                      </h2>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Operação em ordem
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.24em] text-blue-200 uppercase">
                          Hoje
                        </p>
                        <p className="mt-2 text-xl font-semibold">
                          Agenda assistencial
                        </p>
                      </div>
                      <Activity className="size-5 text-blue-300" />
                    </div>

                    <div className="mt-6 space-y-3">
                      {[
                        ["08:00", "Consulta confirmada", "Cardiologia"],
                        ["10:30", "Retorno clínico", "Prontuário pronto"],
                        ["14:00", "Exames e documentos", "Fluxo integrado"],
                      ].map(([time, title, tag]) => (
                        <div
                          key={time}
                          className="rounded-2xl border border-white/10 bg-white/8 p-4"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-semibold text-blue-200">
                              {time}
                            </span>
                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200">
                              {tag}
                            </span>
                          </div>
                          <p className="mt-3 text-sm font-medium text-white">
                            {title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                          <Stethoscope className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            Fluxo clínico conectado
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Agenda, atendimento e documentação em sincronia.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-5 shadow-sm">
                      <p className="text-sm font-semibold text-slate-950">
                        Recursos que sustentam a rotina
                      </p>
                      <div className="mt-4 space-y-3">
                        {workspaceSignals.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 text-sm text-slate-600"
                          >
                            <div className="size-2 rounded-full bg-blue-500" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm">
                      <p className="text-sm font-semibold text-slate-950">
                        Mais organização, menos atrito operacional
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Um ambiente pensado para dar velocidade ao time sem
                        sacrificar controle, contexto clínico ou experiência.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative border-y border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 text-sm text-slate-600 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-12">
          {[
            {
              title: "Segurança operacional",
              text: "Informações organizadas em um fluxo central e mais confiável.",
            },
            {
              title: "Atendimento fluido",
              text: "Menos fricção entre recepção, equipe clínica e gestão.",
            },
            {
              title: "Visão completa",
              text: "Rotina da clínica acompanhada com clareza em um só lugar.",
            },
            {
              title: "Base moderna",
              text: "Estrutura pronta para crescer junto com a operação.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-3">
              <div className="mt-1 rounded-full bg-blue-100 p-2 text-blue-700">
                <CircleCheckBig className="size-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 leading-6">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <span className="landing-chip inline-flex rounded-full border border-blue-200/70 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-blue-700 uppercase">
            Recursos essenciais
          </span>
          <h2 className="landing-heading mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Tudo o que a clínica precisa para operar com mais consistência
          </h2>
          <p className="landing-copy mt-5 text-lg leading-8 text-slate-600">
            O med reúne as frentes que mais impactam a rotina da equipe em uma
            experiência clara, bonita e funcional.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ title, description, icon: Icon }) => (
            <Card
              key={title}
              className="landing-card rounded-[1.75rem] border-white/70 py-0 transition-transform duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-950">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="landing-card rounded-[2rem] border-white/70 py-0">
            <CardContent className="p-8">
              <span className="landing-chip inline-flex rounded-full border border-blue-200/70 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-blue-700 uppercase">
                Benefícios reais
              </span>
              <h2 className="landing-heading mt-6 text-4xl font-semibold tracking-tight text-slate-950">
                Uma operação clínica mais leve, organizada e preparada
              </h2>
              <p className="landing-copy mt-5 text-base leading-8 text-slate-600">
                Mais do que listar módulos, a proposta do med é dar ritmo para a
                rotina da clínica com uma experiência unificada.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            {benefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="landing-card rounded-[1.75rem] border-white/70 py-0"
              >
                <CardContent className="flex gap-4 p-6">
                  <div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <CircleCheckBig className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-950">
                      {benefit.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {benefit.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <Card className="overflow-hidden rounded-[2.25rem] border-slate-200/80 bg-slate-950 py-0 text-white shadow-2xl shadow-slate-950/15">
            <CardContent className="relative p-8 sm:p-10 lg:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.18),_transparent_26%)]" />
              <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <span className="inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-blue-200 uppercase">
                    Pronto para começar
                  </span>
                  <h2 className="landing-heading mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
                    Entre na plataforma e acompanhe a operação da sua clínica
                    com mais clareza.
                  </h2>
                  <p className="landing-copy mt-5 max-w-2xl text-base leading-8 text-slate-300">
                    O med já está pronto para centralizar atendimento, agenda,
                    prontuário e gestão em um ambiente moderno e confiável.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button
                      asChild
                      size="lg"
                      className="h-12 rounded-full bg-white px-7 text-base font-semibold text-slate-950 hover:bg-slate-100"
                    >
                      <Link href="/login">
                        Acessar plataforma
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    {/*
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-full border-white/20 bg-white/5 px-7 text-base text-white hover:bg-white/10"
                    >
                      <Link href="/register">Criar conta</Link>
                    </Button>
                    */}
                  </div>
                </div>

                <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
                  {[
                    {
                      label: "Cadastro e atendimento",
                      text: "Dados organizados para acompanhar toda a jornada clínica.",
                    },
                    {
                      label: "Rotina interna",
                      text: "Tarefas, documentos e agenda trabalhando em conjunto.",
                    },
                    {
                      label: "Expansão da operação",
                      text: "Estrutura preparada para consultórios e clínicas em evolução.",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                    >
                      <p className="text-sm font-semibold text-white">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Link
        href="https://wa.me/5565999112805"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed right-5 bottom-5 z-50 inline-flex size-15 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_40px_rgba(37,211,102,0.32)] transition-all duration-300 hover:scale-105 hover:bg-[#22c55e] focus-visible:ring-4 focus-visible:ring-[#25D366]/30 focus-visible:outline-none sm:right-6 sm:bottom-6"
      >
        <MessageCircleMore className="size-7" />
      </Link>
    </main>
  );
}
