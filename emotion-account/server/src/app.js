const express = require('express');
const env = require('./config/env');
const errorHandler = require('./middlewares/error-handler');
const routes = require('./routes');

const app = express();

// Full backup payload can grow quickly; keep a conservative but usable limit.
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'up',
      timestamp: new Date().toISOString()
    }
  });
});

app.use('/api/v1', routes);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Emotion Account server listening on port ${env.port}`);
});