#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
npm install
npm --prefix frontend install
npm --prefix backend install
npm run dev
