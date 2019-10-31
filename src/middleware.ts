const jwt = require('jsonwebtoken')
import { JWT_SECRET } from '../config';

export const loggedInGuard = (req, res, next) => {
    const accessToken = req.headers['authorization']
    if (!accessToken) {
      res.status(511).send({ error: "You need to be authenticated" })
    } else {
      jwt.verify(accessToken.split('Bearer ')[1], JWT_SECRET, function(err, decoded) {
        if (err) {
          return res.status(511).send({ error: "You need to be authenticated" })
        }
        req.userId = decoded.id
        next()
      })
    }
  }