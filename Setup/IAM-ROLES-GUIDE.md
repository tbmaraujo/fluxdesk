# 🔒 Guia de IAM Roles para EC2

Este guia explica como configurar **IAM Roles (Instance Profiles)** para que sua aplicação Laravel na EC2 acesse AWS SES e S3 **sem precisar de Access Keys**.

---

## 🎯 Por que usar IAM Roles?

### ✅ Vantagens

| Aspecto | IAM Roles | Access Keys |
|---------|-----------|-------------|
| **Segurança** | 🔒 Alta | ⚠️ Moderada |
| **Rotação de credenciais** | ✅ Automática | ❌ Manual |
| **Risco de vazamento** | ✅ Zero (sem secrets em disco) | ❌ Alto (secrets no `.env`) |
| **Compliance** | ✅ Atende normas | ⚠️ Requer rotação manual |
| **Auditoria** | ✅ CloudTrail completo | ⚠️ Limitado |
| **Configuração** | ⚠️ Requer setup AWS | ✅ Simples |

### 🔐 Como funciona

```
┌─────────────────────────────────────────────────┐
│           EC2 Instance (Laravel)                │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Aplicação faz chamada AWS SDK              │
│     ↓                                           │
│  2. SDK busca credenciais automaticamente:     │
│     ├─ Variáveis de ambiente (.env)?    ❌     │
│     ├─ Arquivo ~/.aws/credentials?      ❌     │
│     └─ IAM Role via metadata service?   ✅     │
│     ↓                                           │
│  3. SDK consulta metadata service:             │
│     http://169.254.169.254/latest/meta-data/   │
│     ↓                                           │
│  4. Recebe credenciais temporárias:            │
│     - AccessKeyId (válida por 6h)              │
│     - SecretAccessKey (válida por 6h)          │
│     - SessionToken                              │
│     ↓                                           │
│  5. SDK usa credenciais temporárias            │
│  6. AWS renova automaticamente antes expirar   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Resultado:** Sua aplicação acessa AWS SES e S3 **sem nenhuma credencial no `.env`**!

---

## 🚀 Passo a Passo: Criar IAM Role

### 1️⃣ Criar IAM Role

1. Acesse **AWS Console** → **IAM** → **Roles**
2. Clique em **Create role**
3. **Trusted entity type:** AWS service
4. **Use case:** EC2
5. Clique em **Next**

### 2️⃣ Criar Policy Customizada (Recomendado)

Em vez de usar policies gerenciadas, crie uma policy com **princípio do menor privilégio**:

1. Na tela de permissões, clique em **Create policy**
2. Selecione **JSON** e cole:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowSESSendEmail",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:GetSendQuota",
        "ses:GetSendStatistics"
      ],
      "Resource": "*"
    },
    {
      "Sid": "AllowS3ForEmailStorage",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::sincro8-tickets-emails-inbound",
        "arn:aws:s3:::sincro8-tickets-emails-inbound/*"
      ]
    },
    {
      "Sid": "AllowCloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

3. Nome da policy: `Sincro8-Tickets-App-Policy`
4. Clique em **Create policy**

### 3️⃣ Anexar Policy à Role

1. Volte à criação da role
2. Atualize a lista de policies (🔄)
3. Busque e selecione: `Sincro8-Tickets-App-Policy`
4. Clique em **Next**

### 4️⃣ Nomear e Criar Role

1. **Role name:** `EC2-Sincro8-Tickets-App-Role`
2. **Description:** "IAM Role para aplicação Sincro8 Tickets acessar SES e S3"
3. Revise as permissões
4. Clique em **Create role**

---

## 🖥️ Anexar Role à Instância EC2

### Para Nova Instância

1. Ao criar a instância EC2, em **Configure Instance Details**
2. **IAM role:** Selecione `EC2-Sincro8-Tickets-App-Role`
3. Continue com a criação normalmente

### Para Instância Existente

1. No console EC2, selecione a instância
2. **Actions** → **Security** → **Modify IAM role**
3. Selecione `EC2-Sincro8-Tickets-App-Role`
4. Clique em **Update IAM role**

**⚠️ IMPORTANTE:** A instância **não precisa reiniciar**. A mudança é aplicada imediatamente.

---

## ⚙️ Configurar Aplicação Laravel

### 1️⃣ Remover Credenciais do `.env`

**Remova ou comente estas linhas:**

```bash
# ❌ NÃO configure em produção EC2:
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

**Mantenha apenas:**

```bash
# ✅ Configure apenas a região:
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=sincro8-tickets-emails-inbound
AWS_SES_S3_BUCKET=sincro8-tickets-emails-inbound
```

### 2️⃣ Verificar Configuração

O Laravel SDK automaticamente detectará as credenciais da IAM Role.

**Teste via SSH na EC2:**

```bash
# Conectar via SSH
ssh -i sua-chave.pem ec2-user@seu-ip

# Acessar diretório da aplicação
cd /var/www/html/sincro8-tickets

# Testar credenciais
php artisan tinker

>>> use Aws\Credentials\CredentialProvider;
>>> $provider = CredentialProvider::defaultProvider();
>>> $credentials = $provider()->wait();
>>> $credentials->getAccessKeyId()
=> "ASIA..." // Credenciais temporárias da IAM Role!

>>> $credentials->getExpiration()
=> 2025-10-24T20:30:00+00:00 // Expira em ~6 horas
```

Se ver credenciais começando com `ASIA...` = **✅ IAM Role funcionando!**

### 3️⃣ Testar Envio de E-mail

```bash
php artisan mail:test-ses seu@email.com
```

**Resultado esperado:**
```
✅ E-mail de teste enviado com sucesso!
```

---

## 🔍 Troubleshooting

### ❌ Erro: "Unable to locate credentials"

**Causa:** IAM Role não está anexada à instância ou configuração incorreta.

**Solução:**

1. Verifique se a role está anexada:
   ```bash
   curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
   ```
   Deve retornar o nome da role.

2. Verifique as credenciais:
   ```bash
   curl http://169.254.169.254/latest/meta-data/iam/security-credentials/EC2-Sincro8-Tickets-App-Role
   ```
   Deve retornar JSON com AccessKeyId, SecretAccessKey e Token.

3. Se estiver vazio, verifique no console EC2 se a role está anexada.

---

### ❌ Erro: "Access Denied" ao acessar SES ou S3

**Causa:** Policy da IAM Role não tem as permissões necessárias.

**Solução:**

1. Acesse **IAM** → **Roles** → `EC2-Sincro8-Tickets-App-Role`
2. Verifique se a policy `Sincro8-Tickets-App-Policy` está anexada
3. Revise as permissões da policy (SES e S3)
4. Teste novamente (não precisa reiniciar a instância)

---

### ❌ Aplicação ainda usa Access Keys do `.env`

**Causa:** Variáveis `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` ainda estão configuradas.

**Solução:**

1. Edite o `.env` e remova/comente essas variáveis
2. Limpe o cache de configuração:
   ```bash
   php artisan config:clear
   php artisan config:cache
   ```
3. Teste novamente

---

## 📊 Monitoramento e Auditoria

### CloudTrail

Todas as ações realizadas pela IAM Role são registradas no CloudTrail:

1. Acesse **AWS Console** → **CloudTrail** → **Event history**
2. Filtre por:
   - **User name:** Role name
   - **Event source:** ses.amazonaws.com ou s3.amazonaws.com
3. Veja todas as chamadas API feitas pela aplicação

### Exemplo de log:

```json
{
  "eventName": "SendEmail",
  "userIdentity": {
    "type": "AssumedRole",
    "principalId": "AROA...:i-0123456789abcdef",
    "arn": "arn:aws:sts::123456789012:assumed-role/EC2-Sincro8-Tickets-App-Role/i-0123456789abcdef"
  },
  "sourceIPAddress": "18.231.XXX.XXX",
  "requestParameters": {
    "destination": {
      "toAddresses": ["cliente@example.com"]
    }
  }
}
```

---

## 🔄 Rotação de Credenciais

### Credenciais Temporárias

As credenciais fornecidas pela IAM Role:
- ✅ **Expiram automaticamente** após ~6 horas
- ✅ **São renovadas automaticamente** pelo SDK
- ✅ **Não precisam ser gerenciadas** manualmente

### Ciclo de Vida

```
1. SDK solicita credenciais → Metadata Service retorna
2. Aplicação usa credenciais (válidas por 6h)
3. SDK detecta expiração próxima (15 min antes)
4. SDK solicita novas credenciais automaticamente
5. Ciclo continua indefinidamente
```

**Você não precisa fazer nada!** O SDK gerencia tudo automaticamente.

---

## 📚 Comparação: Ambientes

### Produção (EC2)

```bash
# .env
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=sincro8-tickets-emails-inbound
# Sem AWS_ACCESS_KEY_ID
# Sem AWS_SECRET_ACCESS_KEY
```

**Credenciais:** IAM Role via metadata service ✅

---

### Desenvolvimento Local

```bash
# .env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=sincro8-tickets-emails-inbound
```

**Credenciais:** Access Keys ⚠️

---

### CI/CD (GitHub Actions, GitLab CI)

**Opção 1 - OIDC (Recomendado):**
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v1
  with:
    role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
    aws-region: us-east-1
```

**Opção 2 - Secrets:**
```yaml
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

---

## ✅ Checklist de Segurança

- [ ] IAM Role criada com policy de menor privilégio
- [ ] Role anexada à instância EC2
- [ ] Variáveis `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` removidas do `.env`
- [ ] Teste de envio de e-mail funcionando
- [ ] CloudTrail habilitado para auditoria
- [ ] Política de backup do `.env` (sem secrets)
- [ ] Documentação atualizada para o time

---

## 🎓 Recursos Adicionais

- **AWS IAM Roles:** https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html
- **EC2 Instance Profiles:** https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2_instance-profiles.html
- **AWS SDK Credentials:** https://docs.aws.amazon.com/sdk-for-php/v3/developer-guide/guide_credentials.html
- **Best Practices:** https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html

---

**Última atualização:** Outubro 2025  
**Sistema:** Sincro8 Tickets  
**Recomendação:** Use IAM Roles em **TODOS** os ambientes de produção!
