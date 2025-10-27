# 📄 Configuração do Chrome para Geração de PDFs

## Problema
O Spatie Laravel PDF usa o Puppeteer/Browsershot que precisa do Chrome/Chromium instalado para gerar PDFs.

## Solução Local (Desenvolvimento)

### 1. Instalar o Chrome Headless Shell

```bash
cd /home/thiago/Projetos/fludesk
npx puppeteer browsers install chrome-headless-shell
```

Isso instalará o Chrome em: `~/.cache/puppeteer/chrome-headless-shell/`

### 2. Verificar Instalação

```bash
/home/thiago/.cache/puppeteer/chrome-headless-shell/linux-141.0.7390.122/chrome-headless-shell-linux64/chrome-headless-shell --version
```

Deve retornar algo como: `Google Chrome for Testing 141.0.7390.122`

### 3. Configuração no Laravel

O arquivo `config/pdf.php` já está configurado com o caminho padrão.

### 4. Limpar Cache

```bash
php artisan config:clear
php artisan cache:clear
php artisan optimize:clear
```

## Solução para Produção (Servidor)

### Opção 1: Instalar Puppeteer no Servidor

```bash
# No servidor de produção
cd /var/www/fludesk
npx puppeteer browsers install chrome-headless-shell
```

### Opção 2: Instalar Chrome/Chromium via apt (Ubuntu/Debian)

```bash
# Instalar Chrome
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update
sudo apt install -y google-chrome-stable

# Verificar instalação
google-chrome --version
```

Depois, atualize o `.env` em produção:

```env
CHROME_PATH=/usr/bin/google-chrome
```

### Opção 3: Usar Chromium (mais leve)

```bash
sudo apt update
sudo apt install -y chromium-browser

# Verificar
chromium-browser --version
```

Atualize o `.env`:

```env
CHROME_PATH=/usr/bin/chromium-browser
```

## Variáveis de Ambiente (.env)

```env
# Caminho do Chrome (opcional - usa o padrão se não definido)
CHROME_PATH=/home/thiago/.cache/puppeteer/chrome-headless-shell/linux-141.0.7390.122/chrome-headless-shell-linux64/chrome-headless-shell

# Node e NPM (geralmente não precisa alterar)
NODE_PATH=/usr/bin/node
NPM_PATH=/usr/bin/npm

# Timeout para geração de PDF (em segundos)
BROWSERSHOT_TIMEOUT=60

# No Sandbox (necessário em alguns ambientes Docker/containers)
BROWSERSHOT_NO_SANDBOX=true
```

## Troubleshooting

### Erro: "Could not find Chrome"

**Solução**: Execute `npx puppeteer browsers install chrome-headless-shell` e certifique-se que o caminho no `config/pdf.php` está correto.

### Erro: "Failed to launch Chrome" no Docker

**Solução**: Adicione as flags no `.env`:

```env
BROWSERSHOT_NO_SANDBOX=true
```

E instale dependências no Dockerfile:

```dockerfile
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends
```

### Erro de Timeout

**Solução**: Aumente o timeout no `.env`:

```env
BROWSERSHOT_TIMEOUT=120
```

### Erro de Permissões

**Solução**: Certifique-se que o usuário do servidor web (www-data, nginx, etc) tem permissão de executar o Chrome:

```bash
sudo chmod +x /path/to/chrome-headless-shell
```

## Testando a Configuração

### Via Tinker

```bash
php artisan tinker
```

```php
use Spatie\Browsershot\Browsershot;

Browsershot::html('<h1>Teste</h1>')
    ->setChromePath('/home/thiago/.cache/puppeteer/chrome-headless-shell/linux-141.0.7390.122/chrome-headless-shell-linux64/chrome-headless-shell')
    ->noSandbox()
    ->save('/tmp/test.pdf');
```

Se gerar o arquivo `/tmp/test.pdf` sem erros, está funcionando!

## Arquivos Envolvidos

- `config/pdf.php` - Configuração do Spatie PDF
- `app/Http/Controllers/TicketPdfController.php` - Controller que gera os PDFs
- `app/Http/Controllers/TicketController.php` - Também tem geração de PDFs
- `resources/views/reports/rat-new.blade.php` - Template do relatório RAT

## Referências

- [Spatie Laravel PDF](https://github.com/spatie/laravel-pdf)
- [Puppeteer Documentation](https://pptr.dev/)
- [Browsershot Documentation](https://github.com/spatie/browsershot)

