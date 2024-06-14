require('dotenv').config();

const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const { user: User, sequelize } = require('./models')

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan(process.env.LOG_LEVEL || 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true,
}));
app.use(async (req, res, next) => {
  if (req.session.userId) {
    const user = await User.findByPk(req.session.userId);
    res.locals.user = user ? { id: user.id, username: user.username } : null;
  } else {
    res.locals.user = null;
  }
  next();
});
  
app.set('layout', './layouts/main');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/settings', require('./routes/settings'));
app.use('/upload', require('./routes/upload'));
app.use('/gallery', require('./routes/gallery'));

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on ${process.env.DOMAIN}:${port}`);
  });
});
