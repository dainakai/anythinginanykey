import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
// export const runtime = 'edge';

const DEFAULT_PAGE_LIMIT = 10; // Number of phrases per page
const UNTAGGED_FILTER_VALUE = '__untagged__';

// Fetch globally shared phrases
export async function GET(request: Request) {
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
    orderBy = { starCount: 'desc' }; // Order by stars
  }
  // Add more sort options if needed (e.g., popularity based on forks?)

  const whereClause: Prisma.PhraseWhereInput = {
    isPublic: true, // Only fetch public phrases
  };

  if (tagFilter) {
    if (tagFilter === UNTAGGED_FILTER_VALUE) {
      whereClause.tags = {
        none: {},
      };
    } else {
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
        include: {
          tags: true, // Include associated tags
          user: { // Include basic user info (author)
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        },
      })
    ]);

    const totalPages = Math.ceil(totalPhrases / limit);

    // Fetch all unique tags used in *public* phrases for filtering
    const allPublicTags = await prisma.tag.findMany({
        where: {
            phrases: {
                some: { isPublic: true }
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
          availableTags: allPublicTags.map(t => t.name)
      }
    });
  } catch (error) {
    console.error('Error fetching global phrases:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
