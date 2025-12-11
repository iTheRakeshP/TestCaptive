#!/bin/bash
# Universal test importer for Linux/Mac
# Imports tests from Test-Code folder into all supported frameworks

echo "========================================"
echo "TestCaptive Universal Test Importer"
echo "========================================"
echo ""

cd "$(dirname "$0")"

echo "Importing tests for all frameworks..."
python3 shared/import-all-tests.py
