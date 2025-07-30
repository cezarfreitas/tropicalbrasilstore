# Sistema de Links de Referência para Vendedores

## 📋 Visão Geral

Cada vendedor agora possui um link personalizado que permite que clientes se cadastrem automaticamente atribuídos a ele, com aprovação automática.

## 🚀 Funcionalidades Implementadas

### 1. **Link Personalizado por Vendedor**
- Cada vendedor tem um link único: `/cadastro/vendedor/{vendorId}`
- Exemplo: `http://localhost:8080/cadastro/vendedor/1`

### 2. **Cadastro com Auto-Atribuição**
- Clientes que se cadastram via link do vendedor são automaticamente:
  - ✅ **Atribuídos ao vendedor** (vendor_id)
  - ✅ **Aprovados automaticamente** (status = 'approved')
  - ✅ **Marcados como referência** (vendor_assigned_by = 'auto_referral')

### 3. **Interface para Vendedores**
- **Dashboard:** Estatísticas de indicações
- **Perfil:** Link de referência + estatísticas detalhadas
- **Cópia rápida:** Botão para copiar link

### 4. **Página de Cadastro Personalizada**
- Mostra informações do vendedor
- Interface amigável com aprovação automática
- Redirecionamento automático após cadastro

### 5. **Estatísticas de Referência**
- Total de indicações
- Indicações do mês
- Histórico de clientes indicados

## 🔧 Como Funciona

### Para o Vendedor:
1. **Acessa seu perfil** em `/vendor/profile`
2. **Copia seu link** de referência
3. **Compartilha** com clientes potenciais
4. **Acompanha estatísticas** no dashboard

### Para o Cliente:
1. **Acessa o link** do vendedor
2. **Vê informações** do vendedor
3. **Preenche o formulário** de cadastro
4. **É aprovado automaticamente**
5. **Fica atribuído** ao vendedor

## 📊 Dados Armazenados

### Tabela `customers`:
```sql
- vendor_id: ID do vendedor
- vendor_assigned_at: Data da atribuição
- vendor_assigned_by: 'auto_referral' (para indicações via link)
```

### Tabela `customer_auth`:
```sql
- status: 'approved' (aprovação automática para indicações)
```

## 🌐 Rotas da API

### Backend:
- `GET /api/vendor/referral/vendor/:vendorId` - Informações do vendedor
- `GET /api/vendor/referral/stats/:vendorId` - Estatísticas de indicações
- `POST /api/customers/register` - Cadastro com suporte a referência

### Frontend:
- `/cadastro/vendedor/:vendorId` - Página de cadastro por vendedor
- `/vendor/profile` - Perfil do vendedor com link
- `/vendor` - Dashboard com estatísticas

## 🎯 Exemplo de Uso

### 1. Vendedor obtém seu link:
```
http://localhost:8080/cadastro/vendedor/1
```

### 2. Cliente acessa o link e vê:
- Nome do vendedor: "João Silva"
- Badge: "Vendedor Oficial"
- Aviso: "Cadastro com aprovação automática"

### 3. Cliente se cadastra:
```json
{
  "name": "Cliente Teste",
  "email": "cliente@teste.com",
  "whatsapp": "11999999999",
  "vendor_ref": "1"
}
```

### 4. Sistema responde:
```json
{
  "message": "Cadastro realizado e aprovado automaticamente! Você foi atribuído ao vendedor João Silva.",
  "customerId": 123,
  "vendor_assigned": true,
  "auto_approved": true
}
```

## 📈 Benefícios

### Para Vendedores:
- ✅ **Crescimento automático** da base de clientes
- ✅ **Comissões garantidas** de indicações
- ✅ **Processo simplificado** de indicação
- ✅ **Estatísticas em tempo real**

### Para a Empresa:
- ✅ **Motivação dos vendedores** para indicar
- ✅ **Crescimento da base** de clientes
- ✅ **Rastreamento completo** de indicações
- ✅ **Aprovação automática** reduz trabalho manual

### Para Clientes:
- ✅ **Aprovação imediata**
- ✅ **Vendedor dedicado** desde o início
- ✅ **Processo simplificado**

## 🔒 Segurança

- ✅ **Validação do vendedor** (ativo e válido)
- ✅ **Prevenção de duplicatas** (email/WhatsApp únicos)
- ✅ **Links seguros** (IDs de vendedores válidos)
- ✅ **Rastreamento completo** de origem

## 📱 Interface Responsiva

- ✅ **Mobile-first design**
- ✅ **Interface amigável**
- ✅ **Feedback visual** claro
- ✅ **Redirecionamento automático**

---

## 🚀 Status: Implementado e Funcionando!

O sistema está pronto para uso. Vendedores podem começar a compartilhar seus links imediatamente.

### Próximos Passos Sugeridos:
1. **Treinamento** dos vendedores
2. **Materiais de divulgação** com links
3. **Campanhas de incentivo** para indicações
4. **Relatórios** de performance de vendedores
