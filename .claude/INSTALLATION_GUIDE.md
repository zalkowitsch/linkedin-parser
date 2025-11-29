# 📦 Guia de Instalação - LinkedIn PDF Parser CLI

## 🚀 Instalação via npm

### Instalação Global (Recomendada)
```bash
# Instalar globalmente para usar de qualquer lugar
npm install -g @zalko/linkedin-parser
```

Após a instalação global, você pode usar o comando em qualquer diretório:
```bash
linkedin-pdf-parser /path/to/resume.pdf
```

### Uso com npx (Sem Instalação)
```bash
# Usar diretamente sem instalar
npx @zalko/linkedin-parser /path/to/resume.pdf
```

### Instalação Local em Projeto
```bash
# Adicionar como dependência do projeto
npm install @zalko/linkedin-parser

# Usar via npm scripts ou npx local
npx linkedin-pdf-parser /path/to/resume.pdf
```

## 🔧 Verificação da Instalação

Após instalar, verifique se está funcionando:

```bash
# Verificar se o comando está disponível
linkedin-pdf-parser --help

# Verificar versão
npm list -g @zalko/linkedin-parser
```

## 📋 Exemplo de Uso Completo

### 1. Instalar e Usar
```bash
# Passo 1: Instalar globalmente
npm install -g @zalko/linkedin-parser

# Passo 2: Usar com seu PDF
linkedin-pdf-parser ./meu-curriculo-linkedin.pdf > perfil.json

# Passo 3: Visualizar resultado
cat perfil.json
```

### 2. Pipeline de Dados
```bash
# Extrair dados específicos e salvar
linkedin-pdf-parser resume.pdf > full-profile.json

# Se você tiver jq instalado, pode filtrar dados:
linkedin-pdf-parser resume.pdf | jq '.profile.name' > name.txt
linkedin-pdf-parser resume.pdf | jq '.profile.contact.email' > email.txt
linkedin-pdf-parser resume.pdf | jq '.profile.experience' > experience.json
```

### 3. Processamento em Lote
```bash
# Script para processar múltiplos PDFs
#!/bin/bash

echo "Processing LinkedIn PDFs..."

for pdf_file in linkedin-pdfs/*.pdf; do
    echo "Processing: $pdf_file"

    # Gerar nome do arquivo JSON
    json_file="${pdf_file%.pdf}.json"

    # Processar PDF
    if linkedin-pdf-parser "$pdf_file" > "$json_file"; then
        echo "✅ Success: $json_file"
    else
        echo "❌ Failed: $pdf_file"
    fi
done

echo "Batch processing complete!"
```

## 🐛 Resolução de Problemas

### Erro: Command not found
Se você receber `linkedin-pdf-parser: command not found`:

```bash
# Verificar se npm global bin está no PATH
npm config get prefix
echo $PATH

# Reinstalar globalmente
npm uninstall -g @zalko/linkedin-parser
npm install -g @zalko/linkedin-parser
```

### Erro: Permission denied
Se houver problemas de permissão:

```bash
# No Linux/Mac, usar sudo
sudo npm install -g @zalko/linkedin-parser

# Ou configurar npm para não precisar de sudo
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Erro: PDF parsing failed
Se o parsing falhar:

```bash
# Verificar se é um PDF válido
file meu-arquivo.pdf

# Tentar com --raw-text para debug
linkedin-pdf-parser meu-arquivo.pdf --raw-text

# Verificar tamanho do arquivo
ls -lh meu-arquivo.pdf
```

## 🔗 Integração com Outras Ferramentas

### Com jq (JSON processor)
```bash
# Instalar jq
# Ubuntu/Debian: sudo apt-get install jq
# macOS: brew install jq
# Windows: choco install jq

# Exemplos de uso
linkedin-pdf-parser resume.pdf | jq '.profile.name'
linkedin-pdf-parser resume.pdf | jq '.profile.experience[].company' | sort | uniq
linkedin-pdf-parser resume.pdf | jq '.profile.top_skills | length'
```

### Com Python
```python
import subprocess
import json

# Processar PDF via CLI
result = subprocess.run([
    'linkedin-pdf-parser',
    'resume.pdf',
    '--compact'
], capture_output=True, text=True)

if result.returncode == 0:
    profile_data = json.loads(result.stdout)
    print(f"Nome: {profile_data['profile']['name']}")
    print(f"Email: {profile_data['profile']['contact']['email']}")
else:
    print(f"Erro: {result.stderr}")
```

### Com Node.js
```javascript
const { execSync } = require('child_process');

try {
    const jsonOutput = execSync('linkedin-pdf-parser resume.pdf --compact', {
        encoding: 'utf8'
    });

    const profileData = JSON.parse(jsonOutput);
    console.log('Nome:', profileData.profile.name);
    console.log('Email:', profileData.profile.contact.email);
} catch (error) {
    console.error('Erro ao processar PDF:', error.message);
}
```

## 📊 Monitoramento e Logs

### Logging de Uso
```bash
# Criar log de processamento
echo "$(date): Processing $1" >> pdf-processing.log
linkedin-pdf-parser "$1" > "${1%.pdf}.json" 2>> pdf-processing.log
```

### Validação de Saída
```bash
#!/bin/bash

pdf_file="$1"
json_file="${pdf_file%.pdf}.json"

# Processar PDF
if linkedin-pdf-parser "$pdf_file" > "$json_file"; then
    # Validar JSON
    if jq empty "$json_file" 2>/dev/null; then
        # Verificar se tem dados essenciais
        name=$(jq -r '.profile.name' "$json_file")
        email=$(jq -r '.profile.contact.email' "$json_file")

        if [[ "$name" != "null" && "$email" != "null" ]]; then
            echo "✅ PDF processado com sucesso: $pdf_file"
            echo "   Nome: $name"
            echo "   Email: $email"
        else
            echo "⚠️  PDF processado mas dados incompletos: $pdf_file"
        fi
    else
        echo "❌ JSON inválido gerado: $json_file"
    fi
else
    echo "❌ Falha ao processar PDF: $pdf_file"
fi
```

## 🎯 Dicas de Performance

1. **Processamento em lote**: Use scripts para processar múltiplos arquivos
2. **Cache de resultados**: Evite reprocessar PDFs já processados
3. **Validação prévia**: Verifique se é PDF antes de processar
4. **Timeout**: Para PDFs muito grandes, considere timeout

```bash
# Exemplo com timeout
timeout 30 linkedin-pdf-parser large-resume.pdf > output.json || echo "Timeout!"
```