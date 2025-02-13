import { NextResponse } from 'next/server';
import { addValidSession } from '@/app/utils/session';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Verify the missionary password
    if (password !== process.env.MISSIONARY_ACCESS_CODE) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate a secure random session token
    const sessionToken = crypto.randomBytes(32).toString('base64');
    
    // Add the token to valid sessions
    addValidSession(sessionToken);
    
    return NextResponse.json({ 
      success: true,
      sessionToken 
    });
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 