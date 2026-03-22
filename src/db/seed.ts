import "dotenv/config";
import { db } from "./index";
import { user } from "./schema/auth-schema";
import { team, teamMember } from "./schema/teams";

async function seed() {
  console.log("Seeding database...");

  // Create super admin user
  const [adminUser] = await db
    .insert(user)
    .values({
      id: "user_sam_admin",
      name: "Sam",
      email: "sam.x.njuguna@gmail.com",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  console.log("Created admin user:", adminUser.email);

  // Create default team
  const [defaultTeam] = await db
    .insert(team)
    .values({
      id: "team_default",
      name: "Quark Team",
      slug: "quark-team",
      description: "Default team for Quark",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  console.log("Created team:", defaultTeam.name);

  // Add admin to team as admin role
  await db.insert(teamMember).values({
    id: "member_sam_admin",
    teamId: defaultTeam.id,
    userId: adminUser.id,
    role: "admin",
    joinedAt: new Date(),
  });

  console.log("Added user to team as admin");

  console.log("\nSeed completed!");
  console.log("Email:", adminUser.email);
  console.log("You can now sign in with magic link.");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
