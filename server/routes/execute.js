const express = require('express');
const axios = require('axios');
const router = express.Router();

// JDoodle language map: frontend language key → { language, versionIndex }
// Full reference: https://docs.jdoodle.com/integrating-compiler-ide-to-your-application/compiler-api
const LANGUAGE_MAP = {
  // Web / Scripting
  javascript:  { language: 'nodejs',        versionIndex: '4' },  // Node.js 17.x
  typescript:  { language: 'typescript',    versionIndex: '1' },  // TypeScript 5.x
  python:      { language: 'python3',       versionIndex: '4' },  // Python 3.11.x
  ruby:        { language: 'ruby',          versionIndex: '4' },  // Ruby 3.x
  php:         { language: 'php',           versionIndex: '4' },  // PHP 8.x
  perl:        { language: 'perl',          versionIndex: '3' },  // Perl 5.x

  // Systems / Compiled
  c:           { language: 'c',             versionIndex: '5' },  // GCC 11.x
  cpp:         { language: 'cpp17',         versionIndex: '1' },  // GCC 17 (C++17)
  java:        { language: 'java',          versionIndex: '4' },  // JDK 17.x
  go:          { language: 'go',            versionIndex: '4' },  // Go 1.19
  rust:        { language: 'rust',          versionIndex: '4' },  // Rust 1.x
  kotlin:      { language: 'kotlin',        versionIndex: '3' },  // Kotlin 1.x
  swift:       { language: 'swift',         versionIndex: '4' },  // Swift 5.x
  csharp:      { language: 'csharp',        versionIndex: '4' },  // C# (.NET 6)
  scala:       { language: 'scala',         versionIndex: '4' },  // Scala 3.x

  // Functional / Other
  haskell:     { language: 'haskell',       versionIndex: '4' },  // GHC 9.x
  r:           { language: 'r',             versionIndex: '4' },  // R 4.x
  bash:        { language: 'bash',          versionIndex: '4' },  // Bash 5.x
  sql:         { language: 'sql',           versionIndex: '4' },  // SQLite
};

router.post('/', async (req, res) => {
  const { language, sourceCode, stdin = '' } = req.body;

  const lang = LANGUAGE_MAP[language];

  if (!lang) {
    return res.json({
      run: {
        output: `❌ Language '${language}' is not supported.\n\nSupported: ${Object.keys(LANGUAGE_MAP).join(', ')}`,
      },
    });
  }

  const clientId     = process.env.JDOODLE_CLIENT_ID;
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'your_jdoodle_client_id_here') {
    return res.json({
      run: {
        output:
          'ERROR: JDoodle credentials not found.\n' +
          'Please add JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET to server/.env and restart the server.',
      },
    });
  }

  try {
    const response = await axios.post(
      'https://api.jdoodle.com/v1/execute',
      {
        clientId,
        clientSecret,
        script:       sourceCode,
        stdin:        stdin,
        language:     lang.language,
        versionIndex: lang.versionIndex,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const data = response.data;

    // JDoodle response fields: output, statusCode, memory, cpuTime
    const output    = data.output    || 'Execution finished with no output.';
    const cpuTime   = data.cpuTime   || '?';
    const memory    = data.memory    || '?';

    res.json({ run: { output, cpuTime, memory } });

  } catch (error) {
    console.error('JDoodle execution error:', error.response?.data || error.message);

    const errMsg =
      error.response?.status === 401
        ? 'Invalid JDoodle credentials. Check JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET in server/.env'
        : `Execution failed: ${error.message}`;

    res.json({ run: { output: errMsg } });
  }
});

module.exports = router;
