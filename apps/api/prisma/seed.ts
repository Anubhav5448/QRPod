import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, PlatformRole } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME ?? 'Platform SuperAdmin';

  if (!email || !password) {
    console.error(
      '❌ SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in .env',
    );
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('❌ SUPERADMIN_PASSWORD must be at least 12 characters');
    process.exit(1);
  }

  console.log(`🔐 Hashing password for ${email}...`);

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      platformRole: PlatformRole.SUPERADMIN,
      isActive: true,
    },
    create: {
      name,
      email,
      passwordHash,
      platformRole: PlatformRole.SUPERADMIN,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      platformRole: true,
    },
  });

  console.log('✅ SuperAdmin seeded successfully');
  console.log(`   ID:    ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Name:  ${user.name}`);
  console.log(`   Role:  ${user.platformRole}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });