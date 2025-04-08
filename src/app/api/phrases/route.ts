import { NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client'; // Removed direct import
import prisma from '@/lib/prisma'; // Changed to import from lib
import { auth } from "@/auth";
import { parseAbcNotation } from '@/lib/abcParser';

// const prisma = new PrismaClient(); // Removed direct instantiation

export async function POST(request: Request) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { abcNotation, comment, tags: tagNames } = body;

    if (!abcNotation || typeof abcNotation !== 'string' || !abcNotation.trim()) {
      return NextResponse.json({ error: 'abcNotation is required and must be a non-empty string' }, { status: 400 });
    }
    if (comment && typeof comment !== 'string') {
        return NextResponse.json({ error: 'comment must be a string' }, { status: 400 });
    }
    if (!Array.isArray(tagNames) || !tagNames.every(tag => typeof tag === 'string')) {
        return NextResponse.json({ error: 'tags must be an array of strings' }, { status: 400 });
    }

    let originalKey = 'C';
    const parsed = parseAbcNotation(abcNotation);
    if (parsed && parsed.header?.key) {
        originalKey = parsed.header.key;
    }

    console.log(`User ${userId} creating phrase. Key: ${originalKey}, Comment: ${comment}, Tags: ${tagNames.join(', ')}`);

    // --- Process Tags --- Find existing or create new tags
    const tagConnectOrCreate = tagNames.map(name => ({
        where: { name }, // Find tag by unique name
        create: { name, type: 'user_defined', userId }, // Create if not found
    }));

    // --- Create Phrase in DB --- (Now including tag connection)
    const newPhrase = await prisma.phrase.create({
        data: {
            abcNotation,
            originalKey,
            comment: comment || null,
            userId,
            tags: {
                connectOrCreate: tagConnectOrCreate, // Use connectOrCreate for tags
            }
        },
        include: { // Optionally include tags in the response
            tags: true,
        }
    });

    // Return the full created phrase object including tags
    return NextResponse.json(newPhrase, { status: 201 });

  } catch (error) {
    console.error(`Error creating phrase for user ${userId}:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    } else if (error instanceof Error && error.name === 'PrismaClientValidationError') {
        return NextResponse.json({ error: 'Database validation error.', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// You might want to add a GET handler later to fetch phrases
// export async function GET(request: Request) {
//   // ... implementation ...
// }
