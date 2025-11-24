import { prisma } from './prisma'

export async function addIndicator(facilityId: string, indicatorId: string, name: string, value: string, period: string, data: any) {
  return prisma.indicator.create({
    data: { facilityId, indicatorId, name, value, period, data }
  })
}

export async function addLineList(facilityId: string, patientId: string | null, data: any) {
  return prisma.lineList.create({
    data: { facilityId, patientId, data }
  })
}

export async function getUnsyncedIndicators() {
  return prisma.indicator.findMany({
    where: { synced: false }
  })
}

export async function getUnsyncedLineList() {
  return prisma.lineList.findMany({
    where: { synced: false }
  })
}

export async function markIndicatorsAsSynced(ids: number[]) {
  return prisma.indicator.updateMany({
    where: { id: { in: ids } },
    data: { synced: true, syncedAt: new Date() }
  })
}

export async function markLineListAsSynced(ids: number[]) {
  return prisma.lineList.updateMany({
    where: { id: { in: ids } },
    data: { synced: true, syncedAt: new Date() }
  })
}

export async function getDataSummary() {
  const [indicators, lineList, unsyncedIndicators, unsyncedLineList] = await Promise.all([
    prisma.indicator.count(),
    prisma.lineList.count(),
    prisma.indicator.count({ where: { synced: false } }),
    prisma.lineList.count({ where: { synced: false } })
  ])
  
  return {
    indicators: { total: indicators, unsynced: unsyncedIndicators },
    lineList: { total: lineList, unsynced: unsyncedLineList }
  }
}