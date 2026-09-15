#!/usr/bin/env node

const { resolve } = require("node:path");
const ROOT_DIR = resolve(__dirname, "..");
require(resolve(ROOT_DIR, "scripts/test-affiliates.js"));
