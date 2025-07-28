import db from "../lib/db";

// Color corrections mapping with better color matches
const colorCorrections = [
  { name: "Verde Brasil", correctHex: "#228B22" },     // Forest Green
  { name: "Verde", correctHex: "#008000" },            // Green
  { name: "Amarelo Canário", correctHex: "#FFFF99" }, // Canary Yellow
  { name: "Amarelo", correctHex: "#FFFF00" },          // Yellow
  { name: "Azul", correctHex: "#0000FF" },             // Blue
  { name: "Azul Marinho", correctHex: "#000080" },     // Navy Blue
  { name: "Azul Céu", correctHex: "#87CEEB" },         // Sky Blue
  { name: "Vermelho", correctHex: "#FF0000" },         // Red
  { name: "Rosa", correctHex: "#FFC0CB" },             // Pink
  { name: "Rosa Choque", correctHex: "#FF1493" },      // Deep Pink
  { name: "Roxo", correctHex: "#800080" },             // Purple
  { name: "Lilás", correctHex: "#DDA0DD" },            // Plum
  { name: "Laranja", correctHex: "#FFA500" },          // Orange
  { name: "Marrom", correctHex: "#8B4513" },           // Saddle Brown
  { name: "Bege", correctHex: "#F5F5DC" },             // Beige
  { name: "Preto", correctHex: "#000000" },            // Black
  { name: "Branco", correctHex: "#FFFFFF" },           // White
  { name: "Cinza", correctHex: "#808080" },            // Gray
  { name: "Dourado", correctHex: "#FFD700" },          // Gold
  { name: "Prata", correctHex: "#C0C0C0" },            // Silver
  { name: "Nude", correctHex: "#E6C2A6" },             // Nude
  { name: "Coral", correctHex: "#FF7F50" },            // Coral
  { name: "Turquesa", correctHex: "#40E0D0" },         // Turquoise
  { name: "Vinho", correctHex: "#722F37" },            // Wine
];

async function fixColors() {
  try {
    console.log("🎨 Starting color fix process...");
    
    // Get all current colors
    const [currentColors] = await db.execute("SELECT id, name, hex_code FROM colors");
    const colors = currentColors as any[];
    
    console.log(`Found ${colors.length} colors in database`);
    
    let updatedCount = 0;
    
    for (const color of colors) {
      console.log(`\nChecking: ${color.name} (${color.hex_code})`);
      
      // Find correction for this color (exact match or partial match)
      const correction = colorCorrections.find(c => 
        c.name.toLowerCase() === color.name.toLowerCase() ||
        color.name.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(color.name.toLowerCase())
      );
      
      if (correction && color.hex_code !== correction.correctHex) {
        console.log(`  ⚠️  Mismatch detected!`);
        console.log(`     Current: ${color.hex_code}`);
        console.log(`     Should be: ${correction.correctHex}`);
        
        // Update the color
        await db.execute(
          "UPDATE colors SET hex_code = ? WHERE id = ?",
          [correction.correctHex, color.id]
        );
        updatedCount++;
        console.log(`  ✅ Updated ${color.name}: ${color.hex_code} -> ${correction.correctHex}`);
      } else if (correction) {
        console.log(`  ✓ Already correct`);
      } else {
        console.log(`  ℹ️  No correction rule found`);
      }
    }
    
    console.log(`\n🎉 Color fix completed! Updated ${updatedCount} colors.`);
    
    return {
      success: true,
      totalColors: colors.length,
      updatedCount
    };
  } catch (error) {
    console.error("❌ Error fixing colors:", error);
    throw error;
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixColors()
    .then(result => {
      console.log("\n" + "=".repeat(50));
      console.log(`✅ SUCCESS: Fixed ${result.updatedCount}/${result.totalColors} colors`);
      console.log("=".repeat(50));
      process.exit(0);
    })
    .catch(error => {
      console.error("\n" + "=".repeat(50));
      console.error("❌ FAILED:", error);
      console.error("=".repeat(50));
      process.exit(1);
    });
}

export { fixColors };
