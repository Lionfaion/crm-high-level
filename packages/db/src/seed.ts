import { prisma } from "./client";

async function main() {
  const agency = await prisma.agency.upsert({
    where: { email: "admin@crm.dev" },
    update: {},
    create: {
      name: "Demo Agency",
      email: "admin@crm.dev",
      phone: "+1-555-0100",
    },
  });

  const account = await prisma.account.upsert({
    where: { id: "seed-account-001" },
    update: {},
    create: {
      id: "seed-account-001",
      agencyId: agency.id,
      name: "Acme Corp",
      email: "hello@acme.com",
      timezone: "America/New_York",
    },
  });

  const pipeline = await prisma.pipeline.upsert({
    where: { id: "seed-pipeline-001" },
    update: {},
    create: {
      id: "seed-pipeline-001",
      accountId: account.id,
      name: "Sales Pipeline",
    },
  });

  const stageNames = ["Lead", "Qualified", "Proposal Sent", "Negotiation", "Closed Won"];
  for (let i = 0; i < stageNames.length; i++) {
    await prisma.stage.upsert({
      where: { id: `seed-stage-00${i + 1}` },
      update: {},
      create: {
        id: `seed-stage-00${i + 1}`,
        pipelineId: pipeline.id,
        name: stageNames[i],
        position: i,
      },
    });
  }

  console.log("Seed completed:", { agency: agency.name, account: account.name, pipeline: pipeline.name });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
