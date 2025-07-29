import db from "../lib/db";

async function checkTables() {
  try {
    console.log("🔍 Checking database tables...\n");

    // Check if product_variants table exists
    const [variantsTable] = await db.execute("SHOW TABLES LIKE 'product_variants'");
    console.log("product_variants table exists:", (variantsTable as any[]).length > 0);

    // Check if products table has the new columns
    const [genderColumn] = await db.execute("SHOW COLUMNS FROM products LIKE 'gender_id'");
    console.log("products.gender_id exists:", (genderColumn as any[]).length > 0);

    const [typeColumn] = await db.execute("SHOW COLUMNS FROM products LIKE 'type_id'");
    console.log("products.type_id exists:", (typeColumn as any[]).length > 0);

    const [stockColumn] = await db.execute("SHOW COLUMNS FROM products LIKE 'sell_without_stock'");
    console.log("products.sell_without_stock exists:", (stockColumn as any[]).length > 0);

    // Check if genders table exists
    const [gendersTable] = await db.execute("SHOW TABLES LIKE 'genders'");
    console.log("genders table exists:", (gendersTable as any[]).length > 0);

    // Show products table structure
    console.log("\n📋 Products table structure:");
    const [columns] = await db.execute("SHOW COLUMNS FROM products");
    (columns as any[]).forEach((col: any) => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key} ${col.Default || ''} ${col.Extra || ''}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error checking tables:", error);
    process.exit(1);
  }
}

checkTables();
