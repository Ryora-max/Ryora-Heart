import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jjlgnxufrpqydzuwdbzn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_OW9myJ7VBbGvYiUWPNHR7w_ChHjJqv8";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAccounts() {
  console.log("Creating accounts...\n");

  const accounts = [
    {
      email: "ryo@ryora.app",
      password: "11122004",
      name: "Ahmad Rio Prawiro",
      username: "Ryo",
      role: "owner" as const,
      relationship: "Cowo Ara ❤️",
    },
    {
      email: "ara@ryora.app",
      password: "09062004",
      name: "Tiara Pertiwi",
      username: "Ara",
      role: "partner" as const,
      relationship: "Cewe Rio ❤️",
    },
  ];

  for (const account of accounts) {
    try {
      console.log(`Creating account: ${account.email}...`);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            name: account.name,
            username: account.username,
            role: account.role,
            relationship: account.relationship,
          },
        },
      });

      if (authError) {
        console.error(`Error creating auth user ${account.email}:`, authError.message);
        continue;
      }

      if (authData.user) {
        console.log(`Auth user created: ${authData.user.id}`);

        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          name: account.name,
          username: account.username,
          role: account.role,
          relationship: account.relationship,
          avatar_url: null,
        });

        if (profileError) {
          console.error(`Error creating profile for ${account.email}:`, profileError.message);
        } else {
          console.log(`Profile created for ${account.email}`);
        }
      }
    } catch (error) {
      console.error(`Unexpected error for ${account.email}:`, error);
    }
  }

  console.log("\nAccount creation completed!");
}

createAccounts();
