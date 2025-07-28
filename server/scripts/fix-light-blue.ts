import db from "../lib/db";

async function fixLightBlue() {
  try {
    console.log("🔵 Fixing Light Blue color...");
    
    // Update "Azul Claro" to use Sky Blue instead of regular Blue
    const [result] = await db.execute(
      "UPDATE colors SET hex_code = ? WHERE name = ?",
      ["#87CEEB", "Azul Claro"]
    );
    
    console.log("✅ Updated Azul Claro to Sky Blue (#87CEEB)");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixLightBlue();
