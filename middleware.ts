import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply to /api/check-appointments
  if (request.nextUrl.pathname === '/api/check-appointments') {
    const authHeader = request.headers.get('authorization')
    const apiKey = process.env.API_SECRET_KEY

    if (!apiKey) {
      console.error('API_SECRET_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/check-appointments']
} 