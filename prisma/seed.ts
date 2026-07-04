import { db } from "@/lib/db";

const PREDEFINED_TAGS = ["aim", "mechanics", "decision", "communication"];

async function main() {
  for (const name of PREDEFINED_TAGS) {
    const existing = await db.tag.findFirst({
      where: { name, type: "PREDEFINED" },
    });

    if (!existing) {
      await db.tag.create({
        data: { id: crypto.randomUUID(), name, type: "PREDEFINED" },
      });
      console.log(`Created tag: ${name}`);
    } else {
      console.log(`Tag already exists: ${name}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
