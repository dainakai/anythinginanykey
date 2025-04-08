import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const runtime = 'edge';

// Define context type with Promise for params
interface RouteContext {
  params: Promise<{ phraseId: string }>; // Params is now a Promise
}

// Star a phrase
export async function POST(
    request: NextRequest, // Use NextRequest
    context: RouteContext // Use context object
) {
  const { params } = context; // Access params Promise from context
  const { phraseId } = await params; // Await params to get the actual value

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!phraseId) {
    return NextResponse.json({ error: 'Phrase ID is required' }, { status: 400 });
  }

  try {
    // Use a transaction to ensure atomicity: create Star and increment starCount
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if the phrase exists and is public (or owned by user?)
      //    Only public phrases should be starrable by others.
      const phrase = await tx.phrase.findUnique({
        where: { id: phraseId },
        select: { isPublic: true, userId: true },
      });

      if (!phrase) {
        throw new Error('PhraseNotFound'); // Custom error to handle in catch block
      }

      // Uncomment if only public phrases can be starred by others
      // if (!phrase.isPublic && phrase.userId !== userId) {
      //   throw new Error('CannotStarPrivatePhrase');
      // }

      // 2. Create the Star record (or handle if it already exists)
      await tx.star.upsert({
          where: {
              userId_phraseId: { userId, phraseId }
          },
          create: { userId, phraseId },
          update: {} // Do nothing if it already exists
      });

      // 3. Increment the starCount on the Phrase model
      //    We fetch the count *after* potentially creating the star to ensure accuracy
      const starCount = await tx.star.count({
          where: { phraseId: phraseId }
      });

      const updatedPhrase = await tx.phrase.update({
        where: { id: phraseId },
        data: { starCount: starCount }, // Update with the fresh count
        select: { starCount: true } // Return the new star count
      });

      return updatedPhrase;
    });

    return NextResponse.json({ starCount: result.starCount }, { status: 200 }); // Return new star count

  } catch (error: unknown) {
    console.error('Error starring phrase:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Handle case where the Star record to delete doesn't exist
        return NextResponse.json({ error: 'Not starred or phrase not found' }, { status: 404 });
    }
    // Handle other potential errors like unique constraint violations if upsert wasn't used
    // Or the custom 'CannotStarPrivatePhrase' error
    // if (error.message === 'CannotStarPrivatePhrase') {
    //     return NextResponse.json({ error: 'Cannot star a private phrase you do not own' }, { status: 403 });
    // }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Unstar a phrase
export async function DELETE(
    request: NextRequest, // Use NextRequest
    context: RouteContext // Use context object
) {
  const { params } = context; // Access params Promise from context
  const { phraseId } = await params; // Await params to get the actual value

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!phraseId) {
    return NextResponse.json({ error: 'Phrase ID is required' }, { status: 400 });
  }

  try {
    // Use a transaction to ensure atomicity: delete Star and decrement starCount
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete the Star record (if it exists)
      //    We use deleteMany which doesn't throw if the record doesn't exist.
      await tx.star.deleteMany({
        where: {
          userId: userId,
          phraseId: phraseId,
        },
      });

      // 2. Decrement the starCount on the Phrase model
      //    We fetch the count *after* deleting the star
      const starCount = await tx.star.count({
          where: { phraseId: phraseId }
      });

      const updatedPhrase = await tx.phrase.update({
        where: { id: phraseId },
        data: { starCount: starCount }, // Update with the fresh count
        select: { starCount: true } // Return the new star count
      });

      // Check if phrase exists after update, maybe not necessary if deleteMany succeeded or did nothing
      if (!updatedPhrase) {
           throw new Error('PhraseNotFoundAfterUpdate'); // Should ideally not happen
      }

      return updatedPhrase;
    });

    return NextResponse.json({ starCount: result.starCount }, { status: 200 }); // Return new star count

  } catch (error: unknown) {
    console.error('Error unstarring phrase:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // Handle case where the Star record to delete doesn't exist
        return NextResponse.json({ error: 'Not starred or phrase not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
