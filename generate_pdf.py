#!/usr/bin/env python3
"""
Script para gerar um PDF de teste com estrutura similar ao Profile.pdf
usando bibliotecas básicas do Python.
"""

import subprocess
import sys
import os

def html_to_pdf_chrome():
    """Converte HTML para PDF usando o Chrome/Chromium em modo headless"""
    html_file = "/Users/arkady/Projects/test-resume/pdf-parser/test_resume.html"
    pdf_file = "/Users/arkady/Projects/test-resume/pdf-parser/test_resume.pdf"

    # Tenta usar o Chrome/Chromium
    chrome_paths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        'google-chrome',
        'chromium',
        'chromium-browser'
    ]

    for chrome_path in chrome_paths:
        try:
            if os.path.exists(chrome_path) or chrome_path in ['google-chrome', 'chromium', 'chromium-browser']:
                cmd = [
                    chrome_path,
                    '--headless',
                    '--disable-gpu',
                    '--print-to-pdf=' + pdf_file,
                    '--print-to-pdf-no-header',
                    '--run-all-compositor-stages-before-draw',
                    '--virtual-time-budget=1000',
                    '--no-margins',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-features=TranslateUI',
                    '--disable-extensions',
                    html_file
                ]

                result = subprocess.run(cmd, capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"PDF gerado com sucesso: {pdf_file}")
                    return True
                else:
                    print(f"Erro ao usar {chrome_path}: {result.stderr}")
        except Exception as e:
            print(f"Erro ao executar {chrome_path}: {e}")
            continue

    return False

def main():
    print("Gerando PDF de teste com dados fictícios...")

    # Verifica se o arquivo HTML existe
    html_file = "/Users/arkady/Projects/test-resume/pdf-parser/test_resume.html"
    if not os.path.exists(html_file):
        print(f"Arquivo HTML não encontrado: {html_file}")
        return False

    # Tenta converter usando Chrome
    if html_to_pdf_chrome():
        print("✅ PDF gerado com sucesso!")
        return True

    print("❌ Não foi possível gerar o PDF automaticamente.")
    print("💡 Você pode abrir o arquivo test_resume.html em um navegador")
    print("   e usar 'Imprimir > Salvar como PDF' para criar o PDF manualmente.")

    return False

if __name__ == "__main__":
    main()