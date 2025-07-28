import { Router } from "express";
import db from "../lib/db";

const router = Router();

// Color corrections mapping
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

// Fix colors endpoint
router.post("/fix", async (req, res) => {
  try {
    let updatedCount = 0;
    
    // Get all current colors
    const [currentColors] = await db.execute("SELECT id, name, hex_code FROM colors");
    const colors = currentColors as any[];
    
    for (const color of colors) {
      // Find correction for this color
      const correction = colorCorrections.find(c => 
        c.name.toLowerCase() === color.name.toLowerCase() ||
        color.name.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (correction && color.hex_code !== correction.correctHex) {
        // Update the color
        await db.execute(
          "UPDATE colors SET hex_code = ? WHERE id = ?",
          [correction.correctHex, color.id]
        );
        updatedCount++;
        console.log(`Updated ${color.name}: ${color.hex_code} -> ${correction.correctHex}`);
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} colors`,
      updatedCount
    });
  } catch (error) {
    console.error("Error fixing colors:", error);
    res.status(500).json({ error: "Failed to fix colors" });
  }
});

// Get current colors with their issues
router.get("/check", async (req, res) => {
  try {
    const [colors] = await db.execute("SELECT id, name, hex_code FROM colors ORDER BY name");
    const colorList = colors as any[];
    
    const issues = colorList.map(color => {
      const correction = colorCorrections.find(c => 
        c.name.toLowerCase() === color.name.toLowerCase() ||
        color.name.toLowerCase().includes(c.name.toLowerCase())
      );
      
      return {
        id: color.id,
        name: color.name,
        currentHex: color.hex_code,
        suggestedHex: correction?.correctHex,
        needsUpdate: correction && color.hex_code !== correction.correctHex
      };
    });
    
    res.json(issues);
  } catch (error) {
    console.error("Error checking colors:", error);
    res.status(500).json({ error: "Failed to check colors" });
  }
});

export { router as fixColorsRouter };
