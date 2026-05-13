import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@nebs.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@nebs.com",
      password,
      designation: "Super Administrator",
      role: "SUPER_ADMIN",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@nebs.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@nebs.com",
      password,
      designation: "BD Manager",
      role: "ADMIN",
      createdById: superAdmin.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@nebs.com" },
    update: {},
    create: {
      name: "BD Executive",
      email: "user@nebs.com",
      password,
      designation: "Business Developer",
      role: "USER",
      createdById: admin.id,
    },
  });

  console.log("Seed complete. Default credentials:");
  console.log("  Super Admin: superadmin@nebs.com / admin123");
  console.log("  Admin:       admin@nebs.com / admin123");
  console.log("  User:        user@nebs.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
