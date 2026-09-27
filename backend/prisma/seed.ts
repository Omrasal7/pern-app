import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

// Use the pg adapter (required by Prisma 7)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 10);
  const salesPassword = await bcrypt.hash("sales123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password_hash: adminPassword,
      role: "ADMIN",
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: "sales@example.com" },
    update: {},
    create: {
      name: "Sales User",
      email: "sales@example.com",
      password_hash: salesPassword,
      role: "SALES",
    },
  });

  console.log(`✅ Users created: ${admin.name}, ${sales.name}`);

  // ── Products + Inventory ───────────────────────────────────────────────────
  // We use upsert so re-running the seed won't duplicate data
  const productsData = [
    {
      product_code: "P001",
      name: "Heavy Duty Pump",
      category: "Machinery",
      unit: "Pieces",
      base_price: 15000.0,
      physical_quantity: 50,
    },
    {
      product_code: "P002",
      name: "Industrial Valve DN100",
      category: "Valves",
      unit: "Pieces",
      base_price: 3500.0,
      physical_quantity: 200,
    },
    {
      product_code: "P003",
      name: "Steel Pipe 6 inch",
      category: "Pipes",
      unit: "Meters",
      base_price: 850.0,
      physical_quantity: 500,
    },
    {
      product_code: "P004",
      name: "Pressure Gauge 0-100 PSI",
      category: "Instruments",
      unit: "Pieces",
      base_price: 1200.0,
      physical_quantity: 150,
    },
    {
      product_code: "P005",
      name: "Electric Motor 5HP",
      category: "Electrical",
      unit: "Pieces",
      base_price: 22000.0,
      physical_quantity: 30,
    },
    {
      product_code: "P006",
      name: "Conveyor Belt 10m",
      category: "Material Handling",
      unit: "Pieces",
      base_price: 8500.0,
      physical_quantity: 20,
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { product_code: p.product_code },
      update: {},
      create: {
        product_code: p.product_code,
        name: p.name,
        category: p.category,
        unit: p.unit,
        base_price: p.base_price,
        inventory: {
          create: {
            physical_quantity: p.physical_quantity,
            reserved_quantity: 0,
          },
        },
      },
    });
    console.log(`✅ Product: ${product.name}`);
  }

  // ── Sample Customer ────────────────────────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { email: "contact@abc.com" },
    update: {},
    create: {
      company_name: "ABC Engineering Pvt. Ltd.",
      contact_person: "Rahul Sharma",
      mobile: "9876543210",
      email: "contact@abc.com",
      city: "Mumbai",
    },
  });

  console.log(`✅ Customer: ${customer.company_name}`);
  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });