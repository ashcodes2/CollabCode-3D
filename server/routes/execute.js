const express = require('express');
const axios = require('axios');
const router = express.Router();

// JDoodle language map: frontend language → { language, versionIndex }
const LANGUAGE_MAP = {
  javascript: { language: 'nodejs',    versionIndex: '4' },  // Node.js 17.x
  python:     { language: 'python3',   versionIndex: '4' },  // Python 3.11.x
  java:       { language: 'java',      versionIndex: '4' },  // JDK 17.x
  cpp:        { language: 'cpp17',     versionIndex: '1' },  // GCC 17
  c:          { language: 'c',         versionIndex: '5' },  // GCC 11.x
};

router.post('/', async (req, res) => {
  const { language, sourceCode, stdin = '' } = req.body;

  const lang = LANGUAGE_MAP[language];

  if (!lang) {
    return res.json({ run: { output: `Language '${language}' is not supported for execution.` } });
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
        timeout: 20000,
      }
    );

    const data = response.data;

    // JDoodle response fields: output, statusCode, memory, cpuTime
    const output = data.output || 'Execution finished with no output.';
    res.json({ run: { output } });

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
