import { NextResponse } from 'next/server';

export async function GET() {
  const hasPassword = !!process.env.MISSIONARY_ACCESS_CODE;
  
  return NextResponse.json({
    hasPassword,
    envVarsLoaded: true
  });
} 