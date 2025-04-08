import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Assuming auth setup exists
import { prisma } from '@/lib/prisma'; // Import prisma directly
import { Prisma } from '@prisma/client';

export const runtime = 'edge'; // Added Edge runtime config

const DEFAULT_PAGE_LIMIT = 9; // Number of phrases per page
const UNTAGGED_FILTER_VALUE = '__untagged__';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || DEFAULT_PAGE_LIMIT.toString(), 10);
  const skip = (page - 1) * limit;
  const tagFilter = searchParams.get('tag');
  const sortParam = searchParams.get('sort') || 'createdAt_desc'; // Default: newest first

  let orderBy: Prisma.PhraseOrderByWithRelationInput = {};
  if (sortParam === 'createdAt_desc') {
    orderBy = { createdAt: 'desc' };
  } else if (sortParam === 'createdAt_asc') {
    orderBy = { createdAt: 'asc' };
  } else if (sortParam === 'starCount_desc') {
    // Note: starCount is not yet implemented in the schema based on tasks.md
    // Assuming it will be added later. For now, it might sort unpredictably or can be removed.
    orderBy = { starCount: 'desc' };
  }
  // Add more sort options if needed

  const whereClause: Prisma.PhraseWhereInput = {
    userId: session.user.id,
  };

  if (tagFilter) {
    if (tagFilter === UNTAGGED_FILTER_VALUE) {
      // Handle the special case for untagged phrases
      whereClause.tags = {
        none: {}, // Select phrases with no associated tags
      };
    } else {
      // Original logic for filtering by a specific tag name
      whereClause.tags = {
        some: {
          name: tagFilter,
        },
      };
    }
  }

  try {
    // Fetch total count and phrases in parallel
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
          isPublic: true,
          createdAt: true,
          tags: {
            select: { id: true, name: true }
          }
        },
      })
    ]);

    const totalPages = Math.ceil(totalPhrases / limit);

    // Also fetch all unique tags for the current user to populate the filter dropdown
    const allUserTags = await prisma.tag.findMany({
        where: {
            phrases: {
                some: { userId: session.user.id }
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
          availableTags: allUserTags.map(t => t.name)
      }
    });
  } catch (error) {
    console.error('Error fetching user phrases:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
