//api/todo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Set up Prisma client

export async function POST(request: NextRequest) {
  try {
    const { userId, content } = await request.json();

    // Fetch user with subscription and todos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { todos: true, subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const maxTodos = getMaxTodos(user.subscription?.type);

    // Check if subscription exists and if the counter is within the limit
    if (user.subscription?.type) {
      // Ensure counter exists and is within limits
      const counter = user.subscription.position || 0;
      if (counter >= maxTodos) {
        return NextResponse.json({ error: 'Todo limit reached' }, { status: 403 });
      }
    }

    // Check if the number of todos exceeds the limit
    if (user.todos.length >= maxTodos) {
      return NextResponse.json({ error: 'Todo limit reached' }, { status: 403 });
    }

    // Create a new todo
    const todo = await prisma.todo.create({
      data: { content, userId },
    });

    // Update the subscription counter
    if (user.subscription) {
      const updatedSubscription = await prisma.subscription.update({
        where: { userId },
        data: { position: (user.subscription.position || 0) + 1 },
      });
    }

    return NextResponse.json(todo, { status: 201 });
  } catch (error: any) {
    console.error('Error adding todo:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

function getMaxTodos(subscriptionType?: string) {
  switch (subscriptionType) {
    case 'daily':
      return 10;
    case 'weekly':
      return 20;
    case 'monthly':
      return 100;
    case 'yearly':
      return Infinity;
    default:
      return 5;
  }
}
