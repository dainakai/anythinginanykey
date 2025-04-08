import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Update user profile (currently only name)
export async function PATCH(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let nameToUpdate: string | undefined;

  try {
    const body = await request.json();

    // Validate name
    if (typeof body.name === 'string' && body.name.trim().length > 0) {
      nameToUpdate = body.name.trim();
    } else if (body.name !== undefined) { // Allow empty string if sent explicitly?
       // Policy decision: Allow setting name to empty or require non-empty?
       // Current: Requires non-empty if 'name' key is present.
       return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    if (nameToUpdate === undefined) {
         return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: nameToUpdate,
      },
      select: { // Return only necessary fields
        id: true,
        name: true,
        email: true, // Consider if email should be returned
        image: true,
      },
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Error updating user profile:', error);
     if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json({ error: 'Database validation error.', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
