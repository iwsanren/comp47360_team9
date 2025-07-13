#!/bin/bash

# Git hooks setup script
# This script sets up pre-commit hooks and other git automation

echo "🔧 Setting up Git Hooks..."

# Function to install pre-commit based on system
install_precommit() {
    if command -v pip3 >/dev/null 2>&1; then
        echo "📦 Installing pre-commit with pip3..."
        pip3 install --user pre-commit
    elif command -v pip >/dev/null 2>&1; then
        echo "📦 Installing pre-commit with pip..."
        pip install --user pre-commit
    else
        echo "❌ No pip found. Please install Python and pip first."
        exit 1
    fi
}

# Check if pre-commit is already installed
if ! command -v pre-commit >/dev/null 2>&1; then
    echo "📦 Pre-commit not found, installing..."
    install_precommit
    
    # Add user bin to PATH if not already there
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo "🔧 Adding ~/.local/bin to PATH..."
        export PATH="$HOME/.local/bin:$PATH"
    fi
fi

# Verify pre-commit is accessible
if ! command -v pre-commit >/dev/null 2>&1; then
    echo "❌ Pre-commit installation failed or not in PATH"
    echo "💡 Try running: export PATH=\"\$HOME/.local/bin:\$PATH\""
    exit 1
fi

# Install pre-commit hooks
echo "🔧 Installing pre-commit hooks..."
pre-commit install

# Install commit-msg hook for conventional commits
echo "🔧 Installing commit-msg hook..."
pre-commit install --hook-type commit-msg

# Run pre-commit on all files to test
echo "🧪 Testing pre-commit hooks..."
pre-commit run --all-files

echo "✅ Git hooks setup completed!"
echo "📋 Pre-commit will now run automatically on every commit"
