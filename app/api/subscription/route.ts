// api/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Set up Prisma client

export async function POST(request: NextRequest) {
    try {
      const { userId, type } = await request.json();
      const position = 1;
      // Validate userId and type
      if (typeof userId !== 'string' || typeof type !== 'string') {
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
      }
  
      // Check if the user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
  
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
  
      const startDate = new Date();
      let endDate = new Date();
  
      // Determine the subscription end date based on the type
      switch (type) {
        case 'daily':
          endDate.setDate(startDate.getDate() + 1);
          break;
        case 'weekly':
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(startDate.getMonth() + 1);
          break;
        case 'yearly':
          endDate.setFullYear(startDate.getFullYear() + 1);
          break;
        default:
          return NextResponse.json({ error: 'Invalid subscription type' }, { status: 400 });
      }
  
      // Check if a subscription already exists
      const subscriptionExist = await prisma.subscription.findUnique({
        where: { userId },
      });
  
      let subscription;
      if (subscriptionExist) {
        // Update the subscription if it exists, make sure to include position
        subscription = await prisma.subscription.update({
          where: { userId },
          data: {
            type,
            startDate,
            endDate,
            position: subscriptionExist.position,  // Keep the position value intact
          },
        });
      } else {
        // Create a new subscription if it doesn't exist
        subscription = await prisma.subscription.create({
          data: {
            userId,
            type,
            startDate,
            endDate,
           
          },
        });
      }
  
      // Check if the subscription is correctly created or updated
      if (!subscription) {
        return NextResponse.json({ error: 'Failed to create or update subscription' }, { status: 500 });
      }
  
      return NextResponse.json(subscription, { status: 201 });
  
    } catch (error: any) {
      console.error('Error processing subscription:', error);
      return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
  }
  