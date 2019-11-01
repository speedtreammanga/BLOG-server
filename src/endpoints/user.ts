import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as passport from "passport";
import { prisma, User, Blog } from '../../generated/prisma-client/index';
// import { JWT_SECRET } from '../../config';
import { loggedInGuard } from '../middleware';

const JWT_SECRET = process.env.JWT_SECRET;

const isEmpty = s => (s && s.length == 0) || s === ""
const saltRounds = 10

const endpoints = [
	{
		method: 'post',
		url: '/user/signup',
		callback: (req, res, next) => {
			const { password, ...restBody } = req.body
			if (isEmpty(password) || isEmpty(restBody.email)) {
				res.status(400).send({ error: 'missing credentials'})
				return
			}
			bcrypt.hash(password, saltRounds, function(err, hash) {
				if (err) {
					res.status(500).send({ error: 'internal error while creating a user' })
					next(err)
				}

				prisma
				.createUser({ password: hash, ...restBody })
				.then((user: User) => res.json(user))
				.catch(err => res.status(500).send({ error: 'internal error while creating user' }))
			})
		}
	},
	{
		method: 'post',
		url: '/user/login',
		callback: (req, res) => {
			const { email, password } = req.body
			prisma
			.user({ email: email })
			.then((user:User) => {
				if (!user) {
					return res.status(400).send({ error: 'invalid email'})
				}
		
				bcrypt
				.compare(password, user.password)
				.then(match => {
					if (!match) {
						return res.status(400).send({ error: 'invalid password'})
					}
			
					const payload = { id: user.id }
					jwt.sign(payload, JWT_SECRET, { expiresIn: 36000 }, function (err, token) {
						if (err) {
							res.status(500).json({ error: "Error signing token", raw: err })
						} 
						res.json({ success: true, token: `Bearer ${token}` })

						passport.authenticate('local', {session:false}, (err,user,info) => {
							if(err || !user) {
								return res.status(400).json({ message: info ? info.message : 'Login failed', user })
							}
							req.login(user, { session: false }, err => {
								if (err) { res.send(err) }
								const token = jwt.sign(user, JWT_SECRET)
								res.json({ user, token })
							})
						})
					});
				})
				.catch(err => {
					return res.status(500).send({ error: 'Something went wrong', err })
				})
			})
			.catch(err => {
				return res.status(500).send({ error: 'Something went wrong', err })
			})
		}
	},
	{
		method: 'get',
		url: '/user/logout',
		middleware: [loggedInGuard],
		callback: (req, res) => {
			req.logout()
			res.status(200).send({success: true})
		}
	},
	{
		method: 'get',
		url: '/user',
		middleware: [loggedInGuard],
		callback: (req, res) => {
			prisma
			.user({ id: req.userId })
			.then((user: User) => {
				res.json(user)
			})
			.catch(err => {
				return res.status(500).send({error: 'something went wrong'})
			})
		}
	},
	{
		method: 'get',
		url: '/user/posts',
		middleware: [loggedInGuard],
		callback: (req, res) => {
			prisma.user({id: req.userId}).$fragment(`
				fragment usersBlogDetailsAndPosts on User {
					blog{
						id
						name
						description
						logoUrl
						posts{
							id
							title
							published
							updatedAt
							content
						}
					}
				}
			`)
			.then((obj: { blog }) => {
				if (obj.blog) {
					obj = {
						blog: {
							...obj.blog,
							posts: obj.blog.posts
								.sort((a: Blog, b: Blog) => a.updatedAt < b.updatedAt ? 1 : -1)
						}
					}
				}
				res.json(obj)
			})
			.catch(err => res.status(500).send({error: 'something went wrong'}))
		}
	}
]

export default endpoints;