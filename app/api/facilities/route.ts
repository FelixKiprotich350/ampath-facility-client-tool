import { NextRequest, NextResponse } from 'next/server'
import { addFacility, getAllFacilities } from '@/lib/local-db'

export async function GET() {
  try {
    const facilities = await getAllFacilities()
    return NextResponse.json(facilities)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, location, data } = await request.json()
    const facility = await addFacility(name, location, data)
    return NextResponse.json(facility, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create facility' }, { status: 500 })
  }
}