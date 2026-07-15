const obsidianmd = require("eslint-plugin-obsidianmd");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");

module.exports = [
    {
        ignores: ["main.js", "node_modules/", "*.config.*"],
    },
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
            obsidianmd,
        },
        rules: {
            ...obsidianmd.default.configs.recommended.rules,
            "obsidianmd/no-undeclared-dependencies": "off",
        },
    },
];
