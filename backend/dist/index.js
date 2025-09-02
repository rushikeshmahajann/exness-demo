import express from 'express';
import cors from 'cors';
import candlesRouter from './routes/candles.js';
const app = express();
const port = 3001;
app.use(cors());
app.use('/api', candlesRouter);
app.listen(port, () => {
    console.log(`API server is listening on port: ${port}`);
});
