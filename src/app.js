const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const methodOverride = require('method-override');
const path = require('path');

const registerRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(expressLayouts);
  app.set('layout', 'layouts/main');

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(methodOverride('_method'));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use((req, res, next) => {
    res.locals.flash = null;
    next();
  });

  app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.status(204).end();
  });

  registerRoutes(app);

  app.use((req, res) => {
    res.status(404).render('error', {
      title: 'Pagina nao encontrada',
      message: 'A pagina que voce esta procurando nao existe.',
      currentPage: '',
      layout: 'layouts/auth'
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
