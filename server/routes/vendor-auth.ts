import { Router } from "express";
import db from "../lib/db";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken, generateSessionId } from "../lib/auth-utils";

const router = Router();

// Login de vendedor
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email e senha são obrigatórios" 
      });
    }

    // Buscar vendedor
    const [vendors] = await db.execute(
      "SELECT * FROM vendors WHERE email = ? AND active = 1",
      [email]
    );

    const vendor = (vendors as any[])[0];
    if (!vendor) {
      return res.status(401).json({ 
        error: "Credenciais inválidas" 
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, vendor.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        error: "Credenciais inválidas" 
      });
    }

    // Gerar token JWT
    const token = generateToken({
      id: vendor.id,
      email: vendor.email,
      type: 'vendor'
    });

    // Criar sessão
    const sessionId = generateSessionId();
    await db.execute(
      `INSERT INTO vendor_sessions (vendor_id, session_id, expires_at) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [vendor.id, sessionId]
    );

    // Atualizar último login
    await db.execute(
      "UPDATE vendors SET last_login = NOW() WHERE id = ?",
      [vendor.id]
    );

    res.json({
      message: "Login realizado com sucesso",
      token,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        avatar_url: vendor.avatar_url,
        commission_percentage: vendor.commission_percentage
      }
    });

  } catch (error) {
    console.error("Erro no login do vendedor:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Logout de vendedor
router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'vendor') {
      return res.status(401).json({ error: "Token inválido" });
    }

    // Remover sessões do vendedor
    await db.execute(
      "DELETE FROM vendor_sessions WHERE vendor_id = ?",
      [decoded.id]
    );

    res.json({ message: "Logout realizado com sucesso" });

  } catch (error) {
    console.error("Erro no logout:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Verificar token e obter dados do vendedor
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'vendor') {
      return res.status(401).json({ error: "Token inválido" });
    }

    // Buscar dados do vendedor
    const [vendors] = await db.execute(
      "SELECT id, name, email, phone, commission_percentage, avatar_url, bio, active, created_at, last_login FROM vendors WHERE id = ? AND active = 1",
      [decoded.id]
    );

    const vendor = (vendors as any[])[0];
    if (!vendor) {
      return res.status(404).json({ error: "Vendedor não encontrado" });
    }

    res.json({ vendor });

  } catch (error) {
    console.error("Erro ao obter dados do vendedor:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Atualizar perfil do vendedor
router.put("/profile", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'vendor') {
      return res.status(401).json({ error: "Token inválido" });
    }

    const { name, phone, bio, avatar_url } = req.body;

    await db.execute(
      "UPDATE vendors SET name = ?, phone = ?, bio = ?, avatar_url = ? WHERE id = ?",
      [name, phone, bio, avatar_url, decoded.id]
    );

    res.json({ message: "Perfil atualizado com sucesso" });

  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Alterar senha
router.put("/change-password", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'vendor') {
      return res.status(401).json({ error: "Token inválido" });
    }

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ 
        error: "Senha atual e nova senha são obrigatórias" 
      });
    }

    // Buscar vendedor
    const [vendors] = await db.execute(
      "SELECT password FROM vendors WHERE id = ?",
      [decoded.id]
    );

    const vendor = (vendors as any[])[0];
    if (!vendor) {
      return res.status(404).json({ error: "Vendedor não encontrado" });
    }

    // Verificar senha atual
    const passwordMatch = await bcrypt.compare(current_password, vendor.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Senha atual incorreta" });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Atualizar senha
    await db.execute(
      "UPDATE vendors SET password = ? WHERE id = ?",
      [hashedPassword, decoded.id]
    );

    res.json({ message: "Senha alterada com sucesso" });

  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
