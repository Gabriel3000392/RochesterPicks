import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { env } from "../lib/env";

const demoEmails = ["alex@example.test", "sam@example.test", "jordan@example.test"];
const demoMarketTitles = ["Crusaders beat Blues", "Top points scorer this weekend"];
const demoInviteCodes = ["FRIENDS-ONE", "FRIENDS-TEN", "RUGBY-NIGHT"];

async function main() {
  const adminPasswordHash = await bcrypt.hash(env.DEFAULT_ADMIN_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: env.DEFAULT_ADMIN_EMAIL },
    update: {
      name: env.DEFAULT_ADMIN_NAME,
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true
    },
    create: {
      email: env.DEFAULT_ADMIN_EMAIL,
      name: env.DEFAULT_ADMIN_NAME,
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      balance: 0,
      isActive: true
    }
  });

  await removeDemoData();

  console.log("Seed complete.");
  console.log(`Admin name: ${env.DEFAULT_ADMIN_NAME}`);
  console.log(`Admin email: ${env.DEFAULT_ADMIN_EMAIL}`);
  console.log(`Admin password: ${env.DEFAULT_ADMIN_PASSWORD}`);
  console.log("Change the default admin password immediately after first login.");
}

async function removeDemoData() {
  await prisma.inviteCode.deleteMany({
    where: { code: { in: demoInviteCodes } }
  });

  await prisma.market.deleteMany({
    where: {
      title: { in: demoMarketTitles },
      predictions: { none: {} }
    }
  });

  const demoUsers = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    include: {
      _count: {
        select: {
          predictions: true,
          marketsCreated: true,
          inviteCodesCreated: true
        }
      }
    }
  });

  for (const user of demoUsers) {
    const canDelete =
      user._count.predictions === 0 &&
      user._count.marketsCreated === 0 &&
      user._count.inviteCodesCreated === 0;

    if (canDelete) {
      await prisma.$transaction(async (tx) => {
        await tx.balanceTransaction.deleteMany({ where: { userId: user.id } });
        await tx.user.delete({ where: { id: user.id } });
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false }
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
