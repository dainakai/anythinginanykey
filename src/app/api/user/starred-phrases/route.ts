import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const runtime = 'edge';

const DEFAULT_PAGE_LIMIT = 9;
const UNTAGGED_FILTER_VALUE = '__untagged__';

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || DEFAULT_PAGE_LIMIT.toString(), 10);
  const skip = (page - 1) * limit;
  const tagFilter = searchParams.get('tag');
  const sortParam = searchParams.get('sort') || 'starredAt_desc'; // Default sort by when it was starred

  // First, get the IDs of the phrases starred by the user
  const starredEntries = await prisma.star.findMany({
      where: { userId: userId },
      select: { phraseId: true, createdAt: true }, // Select phraseId and when it was starred
      orderBy: { createdAt: 'desc' } // Default sort by starred date
  });

  if (starredEntries.length === 0) {
      // No starred phrases, return empty results
      return NextResponse.json({
          phrases: [],
          pagination: { currentPage: 1, totalPages: 0, totalPhrases: 0, limit },
          filters: { availableTags: [] }
      });
  }

  const starredPhraseIds = starredEntries.map(star => star.phraseId);

  // Define where clause for filtering starred phrases
  const whereClause: Prisma.PhraseWhereInput = {
    id: {
      in: starredPhraseIds,
    },
  };

  // Add tag filtering if requested
  if (tagFilter) {
    if (tagFilter === UNTAGGED_FILTER_VALUE) {
      whereClause.tags = { none: {} };
    } else {
      whereClause.tags = { some: { name: tagFilter } };
    }
  }

  // Define order based on sortParam
  let orderBy: Prisma.PhraseOrderByWithRelationInput[] = []; // Use array for potential multiple sort criteria

  if (sortParam === 'createdAt_desc') {
    orderBy.push({ createdAt: 'desc' });
  } else if (sortParam === 'starCount_desc') {
    orderBy.push({ starCount: 'desc' });
    orderBy.push({ createdAt: 'desc' }); // Secondary sort
  }
  // Add starredAt sorting (requires joining or specific query structure)
  // Since we fetched starredEntries already, we can sort the final results based on that order
  // For simplicity with Prisma pagination, sorting by phrase fields is easier here.
  // Defaulting to createdAt desc if sortParam is starredAt (needs adjustment if strict starredAt sort required)
  if (sortParam === 'starredAt_desc' || orderBy.length === 0) {
     orderBy = [{ createdAt: 'desc' }]; // Fallback/default sort
  }


  try {
    // Fetch total count and phrases based on the filtered starred phrase IDs
    const [totalPhrases, phrases] = await Promise.all([
      prisma.phrase.count({ where: whereClause }),
      prisma.phrase.findMany({
        where: whereClause,
        orderBy: orderBy,
        skip: skip,
        take: limit,
        select: {
          id: true,
          abcNotation: true,
          originalKey: true,
          comment: true,
          createdAt: true,
          starCount: true,
          isPublic: true, // Include public status
          user: { // Include author info
            select: { id: true, name: true, image: true }
          },
          tags: { // Include tags
            select: { id: true, name: true }
          },
          // We know the user starred these, userHasStarred is implicitly true
          // Include comment count if needed
          // _count: { select: { comments: true } }
        },
      })
    ]);

    // If sorting strictly by 'starredAt' is needed, re-sort 'phrases' here
    // based on the order in 'starredEntries'. This might conflict with pagination.
    if (sortParam === 'starredAt_desc') {
        const starredOrderMap = new Map(starredEntries.map((entry, index) => [entry.phraseId, index]));
        phrases.sort((a, b) => (starredOrderMap.get(a.id) ?? Infinity) - (starredOrderMap.get(b.id) ?? Infinity));
    }


    const totalPages = Math.ceil(totalPhrases / limit);

    // Fetch unique tags present in the user's starred phrases
    const uniqueTagsInStarred = await prisma.tag.findMany({
        where: {
            phrases: {
                some: { id: { in: starredPhraseIds } }
            }
        },
        distinct: ['name']
    });

    return NextResponse.json({
      phrases,
      pagination: {
        currentPage: page,
        totalPages,
        totalPhrases,
        limit,
      },
      filters: {
          availableTags: uniqueTagsInStarred.map(t => t.name)
      }
    });

  } catch (error) {
    console.error('Error fetching starred phrases:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
