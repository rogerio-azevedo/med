import type { AppointmentCardData } from "../AppointmentCard"

export type OverlapSlotLayout = {
  columnIndex: number
  totalColumns: number
}

function appointmentEnd(appt: AppointmentCardData): Date {
  const start = new Date(appt.scheduledAt)
  return new Date(start.getTime() + appt.durationMinutes * 60 * 1000)
}

function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd
}

function appointmentsOverlap(a: AppointmentCardData, b: AppointmentCardData): boolean {
  const aStart = new Date(a.scheduledAt)
  const aEnd = appointmentEnd(a)
  const bStart = new Date(b.scheduledAt)
  const bEnd = appointmentEnd(b)
  return intervalsOverlap(aStart, aEnd, bStart, bEnd)
}

/**
 * Componentes conectados por sobreposição (transitiva).
 * Ex.: A 9–10, B 11–12, C 9:30–11:30 une A, B e C num único cluster.
 */
function buildOverlapClusters(appts: AppointmentCardData[]): AppointmentCardData[][] {
  const n = appts.length
  if (n === 0) return []

  const parent = Array.from({ length: n }, (_, i) => i)

  function find(i: number): number {
    if (parent[i] !== i) parent[i] = find(parent[i])
    return parent[i]
  }

  function union(i: number, j: number) {
    const ri = find(i)
    const rj = find(j)
    if (ri !== rj) parent[ri] = rj
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (appointmentsOverlap(appts[i], appts[j])) union(i, j)
    }
  }

  const rootToCluster = new Map<number, AppointmentCardData[]>()
  for (let i = 0; i < n; i++) {
    const r = find(i)
    const list = rootToCluster.get(r) ?? []
    list.push(appts[i])
    rootToCluster.set(r, list)
  }

  return [...rootToCluster.values()]
}

/**
 * Dentro de um cluster, atribui colunas greedy por horário de início (ótimo para intervalos).
 */
function assignColumnsInCluster(
  cluster: AppointmentCardData[],
): Map<string, { columnIndex: number; totalColumns: number }> {
  const result = new Map<string, { columnIndex: number; totalColumns: number }>()
  if (cluster.length === 0) return result

  const sorted = [...cluster].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )

  const columnEnds: Date[] = []
  const columnIndexById = new Map<string, number>()

  for (const appt of sorted) {
    const start = new Date(appt.scheduledAt)
    const end = appointmentEnd(appt)

    let colIdx = columnEnds.findIndex((ce) => ce.getTime() <= start.getTime())
    if (colIdx === -1) {
      colIdx = columnEnds.length
      columnEnds.push(end)
    } else {
      columnEnds[colIdx] = end
    }

    columnIndexById.set(appt.id, colIdx)
  }

  const totalColumns = Math.max(columnEnds.length, 1)
  for (const appt of cluster) {
    result.set(appt.id, {
      columnIndex: columnIndexById.get(appt.id) ?? 0,
      totalColumns,
    })
  }

  return result
}

/**
 * Mapa id → posição horizontal (estilo Google Calendar) para um único dia.
 */
export function computeOverlapLayout(
  dayAppts: AppointmentCardData[],
): Map<string, OverlapSlotLayout> {
  const out = new Map<string, OverlapSlotLayout>()
  if (dayAppts.length === 0) return out

  const clusters = buildOverlapClusters(dayAppts)
  for (const cluster of clusters) {
    const partial = assignColumnsInCluster(cluster)
    for (const [id, layout] of partial) out.set(id, layout)
  }
  return out
}
