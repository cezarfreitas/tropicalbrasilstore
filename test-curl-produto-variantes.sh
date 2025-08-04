#!/bin/bash

echo "Testing produto/variantes format with curl..."
echo "======================================"

curl -X POST http://localhost:8080/api/products/bulk \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "produto": {
      "codigo": "TEST001",
      "nome": "Produto Teste Curl",
      "categoria": "Testes",
      "tipo": "Teste",
      "marca": "TestMarca",
      "genero": "Unissex",
      "descricao": "Produto criado via curl para teste",
      "preco_sugerido": 50.00,
      "vender_infinito": false,
      "tipo_estoque": "grade"
    },
    "variantes": [
      {
        "cor": "Verde",
        "preco": 45.00,
        "foto": "https://exemplo.com/produto-verde.jpg",
        "grades": {
          "P": 10,
          "M": 15,
          "G": 20
        }
      }
    ]
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTotal time: %{time_total}s\n"

echo ""
echo "======================================"
echo "Teste concluído!"
