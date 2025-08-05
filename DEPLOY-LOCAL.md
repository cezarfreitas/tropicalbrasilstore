# Deploy Local - Seu Computador

🚀 **Instruções para fazer deploy da aplicação no seu computador**

## Opção 1: Docker (Recomendado)

### 1. Build da imagem Docker
```bash
docker build -t chinelos-store .
```

### 2. Executar o container
```bash
docker run -d \
  --name chinelos-store \
  -p 80:80 \
  -e NODE_ENV=production \
  -e PORT=80 \
  -e DATABASE_URL="mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical" \
  -e JWT_SECRET=tropical-brasil-secret-key-2025 \
  -e CORS_ORIGIN=http://localhost \
  -v $(pwd)/public/uploads:/app/public/uploads \
  chinelos-store
```

### 3. Verificar se está funcionando
```bash
# Ver logs
docker logs chinelos-store

# Testar aplicação
curl http://localhost/health
```

## Opção 2: Docker Compose

### 1. Usar o arquivo de produção
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Ver logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

## Opção 3: Node.js Direto

### 1. Build da aplicação
```bash
npm run build
```

### 2. Configurar variáveis de ambiente
```bash
export NODE_ENV=production
export PORT=80
export DATABASE_URL="mysql://tropical:805ce7692e5b4d6ced5f@5.161.52.206:3232/tropical"
export JWT_SECRET=tropical-brasil-secret-key-2025
```

### 3. Executar
```bash
# Com sudo para porta 80
sudo npm start

# Ou usar porta 8080
export PORT=8080
npm start
```

## URLs de Acesso

- **Aplicação**: http://localhost (porta 80) ou http://localhost:8080
- **Admin**: http://localhost/admin
- **Loja**: http://localhost/loja
- **Health Check**: http://localhost/health

## Comandos Úteis

### Para parar containers
```bash
# Docker run
docker stop chinelos-store
docker rm chinelos-store

# Docker compose
docker-compose -f docker-compose.prod.yml down
```

### Para ver logs
```bash
# Docker
docker logs chinelos-store

# Docker compose
docker-compose -f docker-compose.prod.yml logs -f
```

### Para rebuild
```bash
# Rebuild imagem
docker build -t chinelos-store . --no-cache

# Restart container
docker stop chinelos-store
docker rm chinelos-store
# (executar novamente o docker run)
```

## Troubleshooting

### Porta 80 em uso
```bash
# Ver o que está usando a porta
sudo netstat -tulpn | grep :80

# Ou usar porta diferente
docker run -p 8080:80 ...
```

### Problemas de permissão
```bash
# Para porta 80, use sudo
sudo docker run ...

# Ou use porta > 1024
docker run -p 8080:80 ...
```

### Container não inicia
```bash
# Ver logs detalhados
docker logs chinelos-store

# Verificar se a imagem foi criada
docker images | grep chinelos
```

## Próximos Passos

1. **Escolher uma opção** (Docker recomendado)
2. **Executar os comandos** no terminal
3. **Testar** acessando http://localhost
4. **Verificar logs** se houver problemas

A aplicação já está pronta com todas as funcionalidades implementadas!
