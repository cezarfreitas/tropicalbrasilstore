import db from "./db";

export async function addShowInMenuColumn() {
  console.log("🔄 Adding show_in_menu column to categories table...");

  try {
    // Check if column already exists
    const [tableInfo] = await db.execute("SHOW COLUMNS FROM categories LIKE 'show_in_menu'");
    const columnExists = (tableInfo as any[]).length > 0;

    if (!columnExists) {
      // Add the show_in_menu column with default value true
      await db.execute(`
        ALTER TABLE categories
        ADD COLUMN show_in_menu BOOLEAN DEFAULT TRUE;
      `);

      console.log("✅ Successfully added show_in_menu column to categories table");
    } else {
      console.log("✅ show_in_menu column already exists in categories table");
    }
  } catch (error) {
    console.error("❌ Error adding show_in_menu column:", error);
    throw error;
  }
}
