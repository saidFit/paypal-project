import prisma from '@/lib/prisma'; // Set up Prisma client
// import { NextResponse } from 'next/server';

import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const { clerkId } = await request.json();

  let user = await prisma.user.findUnique({ where: { clerkId },include:{todos:true} });

  if (!user) {
    user = await prisma.user.create({ data: { clerkId },include:{todos:true} });
  }

  return NextResponse.json(user, { status: 201 });
}
