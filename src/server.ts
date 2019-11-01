
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
import userApi from './endpoints/user';
import blogApi from './endpoints/blog';
import postApi from './endpoints/post';

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV !== 'production') {
  require('../config');
}

const PORT = process.env.PORT || 8080;
const app = express()
app.use(cors())
app.use(bodyParser.json())

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  // res.header('Access-Control-Allow-Credentials', true);
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

app.get('/temp', function(req, res){
  return res.json({ response: 'success' })
});

app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`),
);