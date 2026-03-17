"use client"

import { useMemo, useEffect, useState } from "react"
import { format, addDays, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AppointmentCard, type AppointmentCardData } from "../AppointmentCard"

const HOUR_HEIGHT = 96 // px por hora para acomodar melhor cards de 30 min em duas linhas
const START_HOUR = 7 // 07:00
const END_HOUR = 20 // 20:00
const TOTAL_HOURS = END_HOUR - START_HOUR

interface AppointmentCalendarProps {
  appointments: AppointmentCardData[]
  weekStart: Date
  onAppointmentClick: (appointment: AppointmentCardData) => void
  onSlotClick?: (date: Date) => void
}

export function AppointmentCalendar({
  appointments,
  weekStart,
  onAppointmentClick,
  onSlotClick,
}: AppointmentCalendarProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const hours = useMemo(
    () => Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i),
    [],
  )

  // Agrupar agendamentos por dia
  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, AppointmentCardData[]>()
    for (const appt of appointments) {
      const key = format(new Date(appt.scheduledAt), "yyyy-MM-dd")
      if (!map.has(key)) map.set(key, [])
      const dayAppts = map.get(key)
      if (dayAppts) dayAppts.push(appt)
    }
    return map
  }, [appointments])

  function getSlotStyle(appt: AppointmentCardData): React.CSSProperties {
    const start = new Date(appt.scheduledAt)
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const offsetMinutes = startMinutes - START_HOUR * 60
    const top = (offsetMinutes / 60) * HOUR_HEIGHT
    const height = Math.max((appt.durationMinutes / 60) * HOUR_HEIGHT - 2, 44)
    return {
      position: "absolute",
      top: `${top}px`,
      left: "2px",
      right: "2px",
      height: `${height}px`,
      zIndex: 10,
    }
  }

  const today = new Date()
  const isCurrentWeek = days.some((d) => isSameDay(d, today))

  // Calcula posição da linha do tempo atual se estiver na janela visível
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowOffsetMinutes = nowMinutes - START_HOUR * 60
  const nowTop = (nowOffsetMinutes / 60) * HOUR_HEIGHT
  const showNowLine =
    isCurrentWeek && now.getHours() >= START_HOUR && now.getHours() < END_HOUR

  return (
    <div className="flex flex-col overflow-hidden border border-border/60 rounded-xl bg-card shadow-sm">
      {/* Header: dias da semana */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/40 relative z-20">
        <div className="h-14" />
        {days.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div
              key={day.toISOString()}
              className={`h-14 flex flex-col items-center justify-center text-xs border-l border-border/50 ${isToday ? "text-primary bg-primary/5" : "text-muted-foreground"}`}
            >
              <span className="uppercase tracking-wider font-semibold text-[10px] mb-0.5">
                {format(day, "eee", { locale: ptBR })}
              </span>
              <span
                className={`text-sm font-bold ${isToday ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center shadow-sm" : ""}`}
              >
                {format(day, "d")}
              </span>
            </div>
          )
        })}
      </div>

      {/* Grid body */}
      <div className="flex-1 overflow-y-auto max-h-[600px] bg-background scroll-smooth custom-scrollbar relative">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] min-w-[700px]">
          {/* Linha do tempo atual cruzando todo o grid */}
          {showNowLine && (
            <div
              className="absolute left-[60px] right-0 h-px bg-red-500 z-30 pointer-events-none"
              style={{ top: nowTop }}
            >
              <div className="absolute -left-[54px] -top-2.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                {format(now, "HH:mm")}
              </div>
              <div className="absolute -left-[2px] -top-1 size-2 rounded-full bg-red-500" />
            </div>
          )}

          {/* Coluna de horas */}
          <div
            className="relative border-r border-border/50 bg-muted/10"
            style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
          >
            {hours.map((h) => (
              <div
                key={h}
                className="absolute w-full flex items-start justify-end pr-3 text-[11px] font-medium text-muted-foreground"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 8 }}
              >
                {h}:00
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd")
            const dayAppts = appointmentsByDay.get(key) ?? []
            const isToday = isSameDay(day, today)

            return (
              <div
                key={key}
                className={`relative border-r border-border/50 transition-colors hover:bg-muted/30 cursor-pointer ${isToday ? "bg-primary/[0.02]" : ""}`}
                style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
                onKeyDown={() => {}}
                onClick={() => onSlotClick?.(day)}
              >
                {/* Linhas de hora e meia-hora */}
                {hours.map((h) => (
                  <div key={h} className="pointer-events-none">
                    {/* Hora cheia */}
                    <div
                      className="absolute w-full border-t border-border/60"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                    />
                    {/* Meia hora (tracejado sutil) */}
                    <div
                      className="absolute w-full border-t border-dashed border-border/30"
                      style={{
                        top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                      }}
                    />
                  </div>
                ))}

                {/* Agendamentos */}
                {dayAppts.map((appt) => (
                  <AppointmentCard
                    key={appt.id}
                    appointment={appt}
                    onClick={onAppointmentClick}
                    style={getSlotStyle(appt)}
                    compact
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
