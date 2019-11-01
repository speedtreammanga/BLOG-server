
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import userApi from './endpoints/user';
import blogApi from './endpoints/blog';
import postApi from './endpoints/post';

let origin = 'https://blogr-webapp.herokuapp.com/';
if (process.env.NODE_ENV !== 'production') {
  require('../config');
  origin = 'http://localhost:3000';
}

const PORT = process.env.PORT || 8080;
const app = express()
app.use(cors())
app.use(bodyParser.json())

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Loading routes...
[userApi, blogApi, postApi].forEach(api => {
  api.forEach(route => {
    const middleware = route.middleware || [];
    app[route.method](route.url, middleware, route.callback);
  });
});

app.listen(PORT, () =>
  console.log(`Server is running on Port:${PORT}`),
);