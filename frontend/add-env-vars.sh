#!/bin/sh

_replaceFrontendEnvVars() {
    echo "Procurando arquivos JS na pasta src para substituição de variáveis..."

    # Encontra apenas arquivos .js dentro da pasta src
    FILES=$(find ./src -type f -name "*.js")

    if [ -z "$FILES" ]; then
        echo "Nenhum arquivo .js encontrado na pasta src."
        exit 1
    fi

    # Escapa caracteres especiais nas variáveis
    ESCAPED_BACKEND_URL=$(printf '%s\n' "$REACT_APP_BACKEND_URL" | sed 's/[\/&]/\\&/g')
    ESCAPED_HOURS_CLOSE=$(printf '%s\n' "$REACT_APP_HOURS_CLOSE_TICKETS_AUTO" | sed 's/[\/&]/\\&/g')

    # Substitui os valores nos arquivos
    for FILE in $FILES; do
        echo "Modificando $FILE..."
        sed -i "s|http://localhost:8081|${ESCAPED_BACKEND_URL}|g" "$FILE"
        sed -i "s|24|${ESCAPED_HOURS_CLOSE}|g" "$FILE"
    done
}

# Executa a função
_replaceFrontendEnvVars
