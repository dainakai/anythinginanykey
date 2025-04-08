import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const DEFAULT_PAGE_LIMIT = 9;

// Fetch phrases starred by the current user
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
  // Note: Sorting and filtering might be less common for starred list, but can be added if needed.
  // const sortParam = searchParams.get('sort') || 'starredAt_desc'; // Example: Sort by when starred

  // Define where clause to find stars by the current user
  const starWhereClause: Prisma.StarWhereInput = {
      userId: userId,
  };

  // Define ordering (e.g., by when the phrase was starred)
  const starOrderBy: Prisma.StarOrderByWithRelationInput = {
      createdAt: 'desc' // Show recently starred first
  };

  try {
    // Fetch total count of starred phrases and the starred phrases for the current page
    const [totalStars, stars] = await Promise.all([
        prisma.star.count({ where: starWhereClause }),
        prisma.star.findMany({
            where: starWhereClause,
            orderBy: starOrderBy,
            skip: skip,
            take: limit,
            include: {
                phrase: { // Include the details of the starred phrase
                    include: {
                        tags: true,
                        user: { // Author of the phrase
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            }
                        }
                    }
                }
            }
        })
    ]);

    const totalPages = Math.ceil(totalStars / limit);

    // Extract the phrase details from the star results
    const starredPhrases = stars.map(star => star.phrase);

    // Fetch all unique tags from the user's starred phrases for potential filtering (optional)
    // This query might be complex/slow depending on the number of starred items
    /*
    const starredPhraseIds = starredPhrases.map(p => p.id);
    const allStarredTags = await prisma.tag.findMany({
        where: {
            phrases: {
                some: { id: { in: starredPhraseIds } }
            }
        },
        distinct: ['name']
    });
    */

    return NextResponse.json({
      phrases: starredPhrases, // Return the phrase objects
      pagination: {
        currentPage: page,
        totalPages,
        totalPhrases: totalStars, // Use total star count here
        limit,
      },
      // filters: {
      //     availableTags: allStarredTags.map(t => t.name)
      // }
    });
  } catch (error) {
    console.error('Error fetching starred phrases:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
