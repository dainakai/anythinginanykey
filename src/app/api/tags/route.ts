import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, Tag } from '@prisma/client'; // Import Tag type

// GET /api/tags - Fetch available tags for the user and preset tags
export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  // Although tags aren't strictly user-owned in the current setup,
  // fetching tags associated with the user's phrases + preset tags
  // provides a relevant list for the UI.

  try {
    // Fetch tags associated with the user's phrases
    const userPhraseTagsQuery: Promise<Tag[]> = userId ? prisma.tag.findMany({
      where: {
        phrases: {
          some: { userId: userId },
        },
      },
      distinct: ['name'], // Get unique tag names used by the user
      orderBy: { name: 'asc' },
    }) : Promise.resolve([]);

    // Fetch all preset tags
    const presetTagsQuery: Promise<Tag[]> = prisma.tag.findMany({
      where: {
        type: 'preset',
      },
      orderBy: { name: 'asc' },
    });

    // Fetch all user-defined tags (not necessarily used by the current user yet)
    // This might be useful for a general tag management UI
    const userDefinedTagsQuery: Promise<Tag[]> = prisma.tag.findMany({
      where: {
        type: 'user_defined',
        // Optionally filter by userId if you add a creator link: userId: userId
      },
      orderBy: { name: 'asc' },
    });


    const [userPhraseTags, presetTags, userDefinedTags] = await Promise.all([
      userPhraseTagsQuery,
      presetTagsQuery,
      userDefinedTagsQuery,
    ]);

    // Combine and deduplicate tags based on name, prioritizing preset and user-defined
    const allTagsMap = new Map<string, Tag>();

    // Add all preset tags first
    presetTags.forEach(tag => allTagsMap.set(tag.name, tag));

    // Add all user-defined tags (overwriting if name conflicts, though unlikely with unique constraint)
    userDefinedTags.forEach(tag => allTagsMap.set(tag.name, tag));

    // Add tags from user's phrases only if they aren't already in the map
    // (This handles cases where a preset tag was used but maybe not fetched otherwise? unlikely)
    userPhraseTags.forEach(tag => {
      if (!allTagsMap.has(tag.name)) {
        allTagsMap.set(tag.name, tag);
      }
    });

    // Sort the combined list alphabetically by name
    const combinedTags = Array.from(allTagsMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(combinedTags);

  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/tags - Create a new user-defined tag
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    // Even though user_defined tags aren't directly linked to a user in the schema,
    // require authentication to create tags to prevent abuse.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Tag name is required and must be a non-empty string' }, { status: 400 });
    }

    const tagName = name.trim();

    // Check if tag already exists (case-insensitive check might be better)
    // Using Prisma's unique constraint on `name` is the primary defense.
    // This check prevents unnecessary DB write attempts.
    const existingTag = await prisma.tag.findUnique({
      where: { name: tagName }, // Prisma unique checks are case-sensitive by default on PostgreSQL
    });

    if (existingTag) {
      // If the tag exists, return it. The client can decide how to handle this.
      // (e.g., inform user, automatically select it)
      // Status 200 OK is appropriate as no new resource was created, but the request is valid.
      return NextResponse.json(existingTag, { status: 200 });
    }

    // Create new user-defined tag
    const newTag = await prisma.tag.create({
      data: {
        name: tagName,
        type: 'user_defined',
        // userId is nullable and not set here based on schema and previous patterns
      },
    });

    return NextResponse.json(newTag, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('Error creating tag:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Explicitly handle unique constraint violation (race condition or case difference)
      if (error.code === 'P2002' && error.meta?.target === 'Tag_name_key') {
         // Fetch the tag that caused the conflict and return it
         const conflictingTag = await prisma.tag.findUnique({ where: { name: name.trim() } });
         if (conflictingTag) {
            return NextResponse.json(conflictingTag, { status: 200 }); // Return the conflicting tag
         } else {
             // Should not happen if P2002 is for name, but handle defensively
            return NextResponse.json({ error: 'Tag already exists' }, { status: 409 });
         }
      }
    }
    // Handle validation errors or other client errors if necessary
    if (error instanceof SyntaxError) { // JSON parsing error
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
