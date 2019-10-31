
import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as cors from 'cors';
import userApi from './endpoints/user';
import blogApi from './endpoints/blog';
import postApi from './endpoints/post';

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Loading routes...
[userApi, blogApi, postApi].forEach(api => {
  api.forEach(route => {
    const middleware = route.middleware || [];
    app[route.method](route.url, middleware, route.callback)
  })
})

app.listen(8080, () =>
  console.log('Server is running on http://localhost:8080'),
)