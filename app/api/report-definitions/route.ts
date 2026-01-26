import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const serverUrl = process.env.AMPATH_SERVER_URL;
    if (!serverUrl) {
      console.warn('SERVER_URL not set - returning empty list');
      return NextResponse.json([]);
    }
    
    const response = await fetch(`${serverUrl}/report-definitions`, {
      headers: { Accept: 'application/json' },
    });
    
    const reports = await response.json();
    return NextResponse.json(Array.isArray(reports) ? reports : []);
  } catch (error) {
    console.error('Failed to fetch reports definitions:', (error as Error).message);
    return NextResponse.json([]);
  }
}