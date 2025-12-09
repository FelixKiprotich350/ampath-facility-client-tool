import { prisma } from './prisma'

export type ReportRequest = {
  id: number
  kenyaEmrReportUuid: string
  reportPeriod: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  createdAt: Date
  processedAt?: Date
  error?: string
}

export async function addReportToQueue(kenyaEmrReportUuid: string, reportPeriod: string) {
  const existing = await prisma.reportQueue.findFirst({
    where: { kenyaEmrReportUuid, reportPeriod, status: { in: ['PENDING', 'PROCESSING'] } }
  })
  
  if (existing) return existing
  
  return await prisma.reportQueue.create({
    data: { kenyaEmrReportUuid, reportPeriod, status: 'PENDING' }
  })
}

export async function getNextPendingReport() {
  return await prisma.reportQueue.findFirst({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' }
  })
}

export async function markReportProcessing(id: number) {
  return await prisma.reportQueue.update({
    where: { id },
    data: { status: 'PROCESSING' }
  })
}

export async function markReportCompleted(id: number) {
  return await prisma.reportQueue.update({
    where: { id },
    data: { status: 'COMPLETED', processedAt: new Date() }
  })
}

export async function markReportFailed(id: number, error: string) {
  return await prisma.reportQueue.update({
    where: { id },
    data: { status: 'FAILED', processedAt: new Date(), error }
  })
}
