

// api/checkSubscription/route.ts
import db from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Retrieve user information
    const { userId } = await auth();

    // Check if userId is missing or invalid
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
     console.log("valid");
     
    // Check if the user exists in the database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });
 console.log("valid1",user);
    // If user is not found, return a 404 error
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the user's subscription details
    const subscription = await db.subscription.findUnique({
      where: {
        userId:user.id,
      },
    });

    console.log("valid2",subscription);
   
    // If no subscription is found, return a 404 error
    if (!subscription) {
      return NextResponse.json(
        { message: "No subscription found for this user" },
        { status: 404 }
      );
    }

    // Check if the subscription is expired
    const currentDate = new Date();
    if (currentDate > new Date(subscription.endDate)) {
      return NextResponse.json(
        { message: "Subscription expired. Please renew." },
        { status: 200 }
      );
    }

    // If the subscription is active
    return NextResponse.json(
      { message: "Subscription is active" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error checking subscription:", error);

    // Make sure to always return a valid object
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

