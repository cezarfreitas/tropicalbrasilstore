import { Database } from "better-sqlite3";

export function addShowInMenuColumn(db: Database) {
  console.log("🔄 Adding show_in_menu column to categories table...");
  
  try {
    // Check if column already exists
    const tableInfo = db.prepare("PRAGMA table_info(categories)").all() as Array<{
      name: string;
      type: string;
      notnull: number;
      dflt_value: any;
      pk: number;
    }>;
    
    const columnExists = tableInfo.some(col => col.name === 'show_in_menu');
    
    if (!columnExists) {
      // Add the show_in_menu column with default value true
      db.exec(`
        ALTER TABLE categories 
        ADD COLUMN show_in_menu BOOLEAN DEFAULT 1;
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
