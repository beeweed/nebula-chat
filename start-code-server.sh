#!/bin/bash

# CONFIG
PORT=8080
AUTH="password"   # change to "none" if you don't want password

echo "🚀 Starting code-server setup..."

# Install if not installed
if ! command -v code-server &> /dev/null
then
    echo "📦 Installing code-server..."
    curl -fsSL https://code-server.dev/install.sh | sh
fi

# Create config if not exists
CONFIG_DIR="$HOME/.config/code-server"
CONFIG_FILE="$CONFIG_DIR/config.yaml"

mkdir -p $CONFIG_DIR

if [ ! -f "$CONFIG_FILE" ]; then
    echo "⚙️ Creating default config..."
    cat <<EOF > $CONFIG_FILE
bind-addr: 0.0.0.0:$PORT
auth: $AUTH
password: 123456
cert: false
EOF
fi

# Start server
echo "🔥 Running code-server on http://localhost:$PORT"
code-server
