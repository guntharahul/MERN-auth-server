const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

//connect to database
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('connected to DB');
  })
  .catch((err) => {
    console.log('DB not connected', err);
  });

//import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

// application middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());
// app.use(cors()); //allows all orgins
if ((process.env.NODE_ENV = 'development')) {
  app.use(cors({ origin: `http://localhost:3000` }));
}

//middlewares
app.use('/api', authRoutes);
app.use('/api', userRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server listening to port ${PORT}`);
});
