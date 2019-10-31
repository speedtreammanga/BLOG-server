import { prisma, Blog, Post, User } from '../../generated/prisma-client'
import { loggedInGuard } from '../middleware';


const endpoints = [
  {
    method: 'get',
    url: '/post',
    callback: (req, res) => {
      const { id } = req.query;

      prisma
      .posts({ where: { id, published: true } })
      .then(post => {
        if (post.length === 0) {
          return res.status(404).send({ error: 'record not found' })
        }
        res.json(post)
      })
      .catch(err => res.status(500))
    }
  },
  {
    method: 'post',
    url: '/post',
    middleware: [loggedInGuard],
    callback: (req, res) => {
      const { published, blogId, title, content } = req.body
      prisma
      .blogs({
        where: { id: blogId, manager: { id: req.userId } }
      })
      .then(blog => {
        if (blog.length === 0) {
          return res.status(401).send({ error: 'unauthorized access' })
        }
        prisma.createPost({
          blog: { connect: { id: blogId } },
          published,
          title,
          content
        })
        .then(newPost => res.json(newPost))
        .catch(error => res.status(500).send({ error }))
      })
      .catch(error => res.status(500).send({ error }))
    }
  },
  {
    method: 'put',
    url: '/post',
    middleware: [loggedInGuard],
    callback: (req, res) => {
      prisma
      .posts({
        where:{
          id:req.query.id,
          blog:{ manager: { id: req.userId } }
        }
      })
      .then(post => {
        if (post.length === 0) {
          res.status(401).send({ error: 'unauthorized access' })
          return
        }
        const { content, title, published } = req.body
        prisma.updatePost({
          where: { id: post[0].id },
          data: { content, title, published }
        })
        .then(updatedPost => res.json(updatedPost))
        .catch(error => res.status(500).send({ error }))
      })
      .catch(error => res.status(500).send({ error }))
    }
  },
  {
    method: 'delete',
    url: '/post',
    middleware: [loggedInGuard],
    callback: (req, res) => {
      const { id } = req.query;
      prisma.posts({
        where:{
          id,
          blog:{ manager: { id: req.userId } }
        }
      })
      .then(post => {
        if (post.length === 0) {
          res.status(401).send({ error: 'unauthorized access' })
          return
        }
          prisma.deletePost({ id })
          .then(deletedPost => res.json(deletedPost))
          .catch(error => res.status(500).send({ error }))
      })
      .catch(error => res.status(500).send({ error }))
    }
  }
]

export default endpoints;