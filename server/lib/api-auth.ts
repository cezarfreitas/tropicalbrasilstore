import { Request, Response, NextFunction } from "express";

// Middleware para validar API keys
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "API key is required. Use Authorization: Bearer YOUR_API_KEY"
    });
  }
  
  const apiKey = authHeader.substring(7); // Remove "Bearer "
  
  // Validar formato da chave (deve começar com sk_live_)
  if (!apiKey.startsWith('sk_live_')) {
    return res.status(401).json({
      success: false,
      error: "Invalid API key format",
      message: "API key must start with 'sk_live_'"
    });
  }
  
  // Aqui você pode validar contra um banco de dados de chaves
  // Por agora, vamos aceitar qualquer chave com formato correto
  // Em produção, você deve verificar se a chave existe e está ativa
  
  // Simular validação - aceitar chaves de exemplo da documentação
  const validKeys = [
    'sk_live_abcd1234567890abcdef1234567890abcdef12',
    'sk_live_xyz9876543210xyz9876543210xyz987654321'
  ];
  
  // Aceitar qualquer chave que comece com sk_live_ e tenha pelo menos 20 caracteres
  if (apiKey.length < 20) {
    return res.status(401).json({
      success: false,
      error: "Invalid API key",
      message: "API key is too short"
    });
  }
  
  // Adicionar informações da API key ao request para logs
  (req as any).apiKey = {
    key: apiKey.substring(0, 12) + '...' + apiKey.substring(apiKey.length - 4), // Mascarar para logs
    full: apiKey
  };
  
  console.log(`API request authenticated with key: ${(req as any).apiKey.key}`);
  next();
}

// Middleware opcional - permite tanto autenticação por sessão quanto por API key
export function optionalApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Se há cabeçalho Authorization, validar como API key
    return validateApiKey(req, res, next);
  }
  
  // Se não há cabeçalho, continuar (pode estar usando autenticação por sessão)
  next();
}
