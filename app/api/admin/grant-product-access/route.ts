import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/admin";
import { applyAdminProductAccess } from "@/lib/admin-product-access-server";
import {
  ADMIN_GRANT_PRODUCTS,
  isAdminGrantProduct,
  type AdminGrantProduct,
} from "@/lib/admin-product-access-shared";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type GrantProductAccessBody = {
  email?: string;
  action?: string;
  product?: string;
  stripePaidOn?: string;
  skipEmail?: boolean;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;
  if (!isAdminEmail(adminEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as GrantProductAccessBody | null;
  const email = body?.email?.trim().toLowerCase();
  const action = body?.action === "remove" ? "remove" : body?.action === "grant" ? "grant" : null;
  const product: AdminGrantProduct | null =
    body?.product && isAdminGrantProduct(body.product) ? body.product : null;

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!action) {
    return NextResponse.json({ error: "action must be grant or remove." }, { status: 400 });
  }

  if (!product) {
    return NextResponse.json(
      { error: `product must be one of: ${ADMIN_GRANT_PRODUCTS.join(", ")}.` },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: "No user found with that email." }, { status: 404 });
  }

  const result = await applyAdminProductAccess({
    userId: user.id,
    product,
    action,
    adminEmail: adminEmail!,
    stripePaidOn: body?.stripePaidOn,
    skipEmail: body?.skipEmail,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: result.message,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
}
