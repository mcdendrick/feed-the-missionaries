import { NextResponse } from 'next/server';
import { addValidSession } from '../appointments/route';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Check if environment variable is loaded
    const storedPassword = process.env.MISSIONARY_ACCESS_CODE;
    if (!storedPassword) {
      console.error('Missing MISSIONARY_ACCESS_CODE environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify the missionary password
    if (password !== storedPassword) {
      console.log('Password verification failed:', {
        provided: password,
        expected: storedPassword
      });
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