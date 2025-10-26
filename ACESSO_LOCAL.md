# Configuração de Acesso Local por IP

## Configuração Aplicada

A aplicação está configurada para aceitar conexões pelo IP local **192.168.1.250**.

## Como Iniciar a Aplicação

### 1. Iniciar o Vite (Frontend)
```bash
npm run dev
```

### 2. Iniciar o Laravel (Backend)
Em outro terminal, execute:
```bash
php artisan serve --host=0.0.0.0 --port=8000
```

## Acessar a Aplicação

Você pode acessar a aplicação através de:

- **Localhost:** http://127.0.0.1:8000
- **IP Local:** http://192.168.1.250:8000
- **Rede Local:** Outros dispositivos na mesma rede também podem acessar via http://192.168.1.250:8000

## Configuração do .env

Certifique-se de que o arquivo `.env` contenha:

```env
APP_URL=http://192.168.1.250:8000
VITE_APP_URL=http://192.168.1.250:8000
```

**Importante:** Após alterar o `.env`, execute:
```bash
php artisan config:clear
php artisan cache:clear
```

## Configurações Aplicadas

### vite.config.js
- **host:** `0.0.0.0` - Aceita conexões de qualquer interface de rede
- **port:** `5173` - Porta padrão do Vite
- **hmr.host:** `192.168.1.250` - Hot Module Replacement configurado para o IP local

### Laravel Server
- Usando `--host=0.0.0.0` permite que o servidor aceite conexões de qualquer IP
- Porta `8000` (padrão do Laravel)

## Firewall

Se não conseguir acessar, verifique o firewall:

### Linux (UFW)
```bash
sudo ufw allow 8000
sudo ufw allow 5173
```

### Linux (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --permanent --add-port=5173/tcp
sudo firewall-cmd --reload
```

## Troubleshooting

### Problema: Não consigo acessar pelo IP
**Solução:** Verifique se ambos os servidores estão rodando com `--host=0.0.0.0`

### Problema: Assets não carregam
**Solução:** Verifique se o Vite está rodando e se o HMR está configurado corretamente

### Problema: Hot Reload não funciona
**Solução:** Certifique-se de que `hmr.host` no `vite.config.js` está com o IP correto

## Comandos Úteis

### Verificar portas em uso
```bash
sudo netstat -tlnp | grep -E '(8000|5173)'
```

### Ver IP local
```bash
ip addr show | grep 'inet '
```
