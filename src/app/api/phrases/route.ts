import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';
import { parseAbcNotation } from '@/lib/abcParser';


const prisma = new PrismaClient();

export async function POST(request: Request) {

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.id;

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
        create: { name, type: 'user_defined', userId },
    }));

    // --- Create Phrase in DB ---
    const newPhrase = await prisma.phrase.create({
        data: {
            abcNotation,
            originalKey,
            comment: comment || null,
            userId,
            tags: {
                connectOrCreate: tagConnectOrCreate,
            }
        },
        include: {
            tags: true,
        }
    });

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

// GET handler example (needs implementation)
// export async function GET(request: Request) {
//   const cookieStore = cookies();
//   const supabase = createSupabaseRouteHandlerClient({ cookies: () => cookieStore });
//   const { data: { user } } = await supabase.auth.getUser();

//   if (!user) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   // Fetch phrases for the logged-in user
//   const phrases = await prisma.phrase.findMany({
//       where: { userId: user.id },
//       include: { tags: true },
//       orderBy: { createdAt: 'desc' },
//   });

//   return NextResponse.json(phrases);
// }
