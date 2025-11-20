import { prisma } from './prisma'

export async function addFacility(name: string, location: string | null, data: any) {
  return prisma.facility.create({
    data: { name, location, data }
  })
}

export async function getUnsyncedData() {
  return prisma.facility.findMany({
    where: { synced: false }
  })
}

export async function markAsSynced(ids: number[]) {
  return prisma.facility.updateMany({
    where: { id: { in: ids } },
    data: { synced: true, syncedAt: new Date() }
  })
}

export async function getAllFacilities() {
  return prisma.facility.findMany()
}