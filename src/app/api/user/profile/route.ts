import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// Update user profile name
export async function PUT(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let name: string;
  try {
    const body = await request.json();
    // Basic validation for name
    if (typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.length > 50) { // Example length limit
      return NextResponse.json({ error: 'Invalid value for name. Must be a non-empty string up to 50 characters.' }, { status: 400 });
    }
    name = body.name.trim();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: name,
      },
      select: { // Return only non-sensitive fields
        id: true,
        name: true,
        email: true,
        image: true,
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile name:', error);
    // Consider specific error handling, e.g., if the user wasn't found (though unlikely if authenticated)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
