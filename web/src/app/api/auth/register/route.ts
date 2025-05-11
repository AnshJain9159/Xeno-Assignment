import { NextResponse } from "next/server";
import UserModel from "@/models/user";
import { signUpSchema } from "@/lib/validations";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import ratelimit from "@/lib/rateLimit";
import { redirect } from "next/navigation";

export async function POST(req: Request) {
  try {
    const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
    const { success } = await ratelimit.limit(ip);

    if (!success) return redirect("/too-fast");

    const body = await req.json();
    const result = signUpSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const existing = await UserModel.findOne({ email: body.email });
    if (existing) {
      return NextResponse.json({ message: "Email already in use" }, { status: 400 });
    }

    const hashedPassword = await hash(body.password, 10);
    await UserModel.create({
      fullName: body.fullName,
      email: body.email,
      password: hashedPassword,
    });

    return NextResponse.json({ message: "User registered" }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}