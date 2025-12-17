import 'dotenv/config.js';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { indexRoute } from './routes/indexRoute.js';
import { authRoute } from './routes/authRoute.js';
import { routeThree } from './routes/routeThree.js';
import { authApp } from './lib/auth.js'; 
import authController from './controllers/authController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.set("views", join(__dirname, "views"));
app.set("view engine", "ejs");

const assetsPath = join(__dirname, "public");
app.use(express.static(assetsPath));
app.use(express.urlencoded({ extended: true }));

app.use(authApp);

app.use("/", indexRoute);
app.use("/auth", authRoute);
app.use("/three", routeThree);

app.get('/{*splat}', (req, res, next) => {
  const err = new Error(`Page not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

const PORT = 3000;
app.listen(PORT, (error) => {
  if (error) throw error;
  console.log(`My Express app - listening on port ${PORT}!`);
});

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).render('error', { title: 'Error', error: err });
});
