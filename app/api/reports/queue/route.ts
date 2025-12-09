import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const queue = await prisma.reportQueue.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    
    return NextResponse.json(queue)
  } catch (error: any) {
    console.error('Error fetching queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue' },
      { status: 500 }
    )
  }
}
