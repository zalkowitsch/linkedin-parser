# 🚀 LinkedIn PDF Parser CLI

Uma ferramenta de linha de comando para extrair dados estruturados de PDFs de currículos do LinkedIn.

## 📦 Instalação

### Instalação Global
```bash
npm install -g @zalko/linkedin-parser
```

### Uso Temporário (npx)
```bash
npx @zalko/linkedin-parser path/to/resume.pdf
```

## 💻 Uso da CLI

### Sintaxe Básica
```bash
linkedin-pdf-parser <pdf-file-path> [options]
```

### Argumentos
- `<pdf-file-path>` - Caminho para o arquivo PDF do LinkedIn a ser analisado

### Opções
- `--raw-text` - Inclui o texto bruto extraído na saída
- `--pretty` - Saída JSON formatada (padrão: true)
- `--compact` - Saída JSON compacta (sem formatação)
- `--help, -h` - Mostra a mensagem de ajuda

## 📋 Exemplos de Uso

### 1. Parsing Básico
```bash
linkedin-pdf-parser ./meu-curriculo.pdf
```

### 2. Saída Compacta
```bash
linkedin-pdf-parser /path/to/linkedin-resume.pdf --compact
```

### 3. Incluindo Texto Bruto
```bash
linkedin-pdf-parser resume.pdf --raw-text
```

### 4. Salvando em Arquivo
```bash
linkedin-pdf-parser resume.pdf > profile-data.json
```

### 5. Usando com jq para Filtrar Dados
```bash
# Extrair apenas o nome e email
linkedin-pdf-parser resume.pdf | jq '{name: .profile.name, email: .profile.contact.email}'

# Listar apenas as experiências
linkedin-pdf-parser resume.pdf | jq '.profile.experience[]'

# Contar número de skills
linkedin-pdf-parser resume.pdf | jq '.profile.top_skills | length'
```

## 📊 Estrutura de Saída JSON

```json
{
  "profile": {
    "name": "Nome da Pessoa",
    "headline": "Título/Headline profissional",
    "location": "Cidade, Estado, País",
    "contact": {
      "email": "email@exemplo.com",
      "phone": "+55 (11) 99999-9999",
      "linkedin_url": "https://linkedin.com/in/usuario"
    },
    "top_skills": ["Skill 1", "Skill 2", "Skill 3"],
    "languages": [
      {
        "language": "Português",
        "proficiency": "Native or Bilingual"
      }
    ],
    "summary": "Resumo profissional...",
    "experience": [
      {
        "title": "Cargo/Posição",
        "company": "Nome da Empresa",
        "duration": "Jan 2020 - Present",
        "location": "Cidade, Estado",
        "description": "Descrição das responsabilidades..."
      }
    ],
    "education": [
      {
        "degree": "Grau Acadêmico",
        "institution": "Nome da Instituição",
        "year": "2020",
        "location": "Cidade, Estado"
      }
    ]
  }
}
```

## 🔧 Casos de Uso Comuns

### 1. Integração com Scripts
```bash
#!/bin/bash
# Script para processar múltiplos PDFs

for pdf in *.pdf; do
    echo "Processing: $pdf"
    linkedin-pdf-parser "$pdf" --compact > "${pdf%.pdf}.json"
done
```

### 2. Extração de Dados Específicos
```bash
# Extrair todas as empresas onde a pessoa trabalhou
linkedin-pdf-parser resume.pdf | jq -r '.profile.experience[].company' | sort -u

# Extrair skills em formato de lista
linkedin-pdf-parser resume.pdf | jq -r '.profile.top_skills[]'

# Verificar se tem experiência em determinada empresa
linkedin-pdf-parser resume.pdf | jq '.profile.experience[] | select(.company == "Google")'
```

### 3. Validação de Dados
```bash
# Verificar se o PDF foi processado com sucesso
if linkedin-pdf-parser resume.pdf >/dev/null 2>&1; then
    echo "PDF processed successfully"
else
    echo "Error processing PDF"
fi
```

## 🚨 Tratamento de Erros

A CLI retorna códigos de saída apropriados:

- `0` - Sucesso
- `1` - Erro (arquivo não encontrado, formato inválido, erro de parsing, etc.)

Mensagens de erro são enviadas para `stderr`, enquanto o JSON é enviado para `stdout`.

### Exemplo de Tratamento de Erro
```bash
linkedin-pdf-parser non-existent.pdf 2>/dev/null || echo "Arquivo não encontrado"
```

## 🔍 Debugging

Para debug, você pode usar a opção `--raw-text` para ver o texto bruto extraído:

```bash
linkedin-pdf-parser resume.pdf --raw-text | jq '.rawText'
```

## 📝 Notas Importantes

1. **Formatos Suportados**: Apenas arquivos PDF são aceitos
2. **Compatibilidade**: Funciona com PDFs de currículos do LinkedIn
3. **Tamanho de Arquivo**: Não há limite específico, mas PDFs muito grandes podem demorar mais para processar
4. **Encoding**: A saída JSON usa encoding UTF-8

## 🔗 Links Úteis

- [jq Manual](https://stedolan.github.io/jq/manual/) - Para filtrar e manipular JSON
- [Repositório do Projeto](https://github.com/zalkowitsch/linkedin-parser)

## 🐛 Reportando Bugs

Se encontrar problemas, por favor reporte em: https://github.com/zalkowitsch/linkedin-parser/issues