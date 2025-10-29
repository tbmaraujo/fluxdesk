# 🔐 Configurar Sudoers para Deploy Sem Senha

Guia para permitir que o usuário de deploy reinicie workers sem precisar de senha.

---

## 🎯 Por Que Fazer Isso?

Permite rodar o script de deploy **SEM sudo**, mas ainda conseguir reiniciar os workers automaticamente.

**Benefícios:**
- ✅ Evita criar arquivos com dono `root`
- ✅ Evita problemas de permissões
- ✅ Script roda automaticamente sem pedir senha
- ✅ Mais seguro (permissão apenas para comandos específicos)

---

## ⚙️ Configuração

### 1. Editar Sudoers

```bash
sudo visudo
```

### 2. Adicionar no Final do Arquivo

**Se seu usuário é `ubuntu`:**
```bash
# Permitir ubuntu reiniciar workers sem senha
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl restart fluxdesk-worker:*
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl status fluxdesk-worker:*
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl stop fluxdesk-worker:*
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl start fluxdesk-worker:*
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart fluxdesk-queue
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/systemctl status fluxdesk-queue
```

**Se seu usuário é diferente** (ex: `deploy`, `www-data`), substitua `ubuntu` pelo seu usuário.

### 3. Salvar

- **No visudo:** Pressione `Ctrl+X` → `Y` → `Enter`

### 4. Testar

```bash
# Deve funcionar SEM pedir senha:
sudo supervisorctl status fluxdesk-worker:*
```

Se pedir senha, algo está errado. Verifique:
- Nome do usuário está correto?
- Caminho do supervisorctl está correto? (`which supervisorctl`)

---

## 🔍 Verificar Caminho dos Comandos

Se não funcionar, verifique o caminho completo:

```bash
# Encontrar caminho do supervisorctl
which supervisorctl
# Resultado: /usr/bin/supervisorctl

# Encontrar caminho do systemctl
which systemctl
# Resultado: /usr/bin/systemctl
```

Use esses caminhos no sudoers.

---

## 🧪 Testar Deploy Após Configurar

```bash
# Agora pode rodar SEM sudo:
cd /var/www/fluxdesk/current
bash deploy-mailgun.sh
```

O script conseguirá reiniciar os workers automaticamente! ✅

---

## 🔒 Segurança

Esta configuração é **segura** porque:
- ✅ Permissão apenas para comandos específicos
- ✅ Apenas para o projeto fluxdesk (`fluxdesk-worker:*`)
- ✅ Usuário não pode rodar `sudo su` ou outros comandos perigosos
- ✅ Wildcards limitados (`*` só funciona depois de `fluxdesk-worker:`)

---

## 🔄 Alternativa: Usar systemd em vez de Supervisor

Se você preferir usar systemd:

### 1. Criar arquivo de service

```bash
sudo nano /etc/systemd/system/fluxdesk-queue.service
```

```ini
[Unit]
Description=Fluxdesk Queue Worker
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/fluxdesk/current/artisan queue:work --sleep=1 --tries=3 --max-time=3600 --max-jobs=1000

[Install]
WantedBy=multi-user.target
```

### 2. Habilitar e iniciar

```bash
sudo systemctl daemon-reload
sudo systemctl enable fluxdesk-queue
sudo systemctl start fluxdesk-queue
```

### 3. Configurar sudoers

```bash
sudo visudo
```

```bash
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart fluxdesk-queue
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/systemctl status fluxdesk-queue
```

### 4. No script, usar:

```bash
sudo systemctl restart fluxdesk-queue
```

---

## 📝 Exemplo Completo de Sudoers

Arquivo `/etc/sudoers.d/fluxdesk` (alternativa ao visudo):

```bash
# Criar arquivo específico
sudo nano /etc/sudoers.d/fluxdesk
```

**Conteúdo:**
```bash
# Fluxdesk Deploy Permissions
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl restart fluxdesk-worker:*
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl status fluxdesk-worker:*
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl stop fluxdesk-worker:*
ubuntu ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl start fluxdesk-worker:*
```

**Permissões:**
```bash
sudo chmod 0440 /etc/sudoers.d/fluxdesk
```

**Validar:**
```bash
sudo visudo -c -f /etc/sudoers.d/fluxdesk
```

---

## ✅ Checklist

- [ ] Executou `sudo visudo` ou criou arquivo em `/etc/sudoers.d/`
- [ ] Adicionou permissões para seu usuário
- [ ] Salvou e validou (`visudo -c`)
- [ ] Testou: `sudo supervisorctl status fluxdesk-worker:*` sem senha
- [ ] Executou script: `bash deploy-mailgun.sh` sem sudo
- [ ] Script reiniciou workers automaticamente

---

**Pronto! Agora você pode fazer deploys sem sudo e sem pedir senha! 🎉**

