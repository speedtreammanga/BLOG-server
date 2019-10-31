import { prisma, Blog } from '../../generated/prisma-client';
import { loggedInGuard } from "../middleware";

const endpoints = [
  {
    method: 'get',
    url: '/blog/posts',
    callback: (req, res) => {
      const { id, page, } = req.query;
      let { query } = req.query;
      const take = 10
      const skip = take * (page - 1 >= 0 ? page - 1 : 0)
      if (!query) { query = "" }
    
      prisma.postsConnection({
        first: take,
        skip,
        where:{
          title_contains: query,
          published: true,
          blog: { id }
        },
        orderBy: "createdAt_DESC"
      })
      .then(result => res.json(result))
      .catch(error => res.status(500).send({ error }))
    }
  },
  {
    method: 'get',
    url: '/blog',
    callback: (req, res) => {
      const { id } = req.query;
      prisma.blogs({
        where: {
          id,
          manager: { id: req.userId }
        }
      })
      .then(blogAndPosts => res.json(blogAndPosts))
      .catch(error => res.status(500).send({ error }))
    }
  },
  {
    method: 'get',
    url: '/blogs',
    callback: (req, res) => {
      let { page, query } = req.query;
      if(!query) { query = "" }
    
      const take = 10
      const skip = take * (page - 1 >= 0 ? page - 1 : 0)
    
      prisma.blogsConnection({
        skip,
        first: take,
        where: {
          name_contains: query
        }
      })
      .then(blogs => res.json(blogs))
      .catch(error => res.status(500).send({ error }))
    }
  },
  {
    method: 'post',
    url: '/blog',
    middleware: [loggedInGuard],
    callback: (req, res) => {
      const { description, name, logoUrl } = req.body
      if (!logoUrl.match(/(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g)) {
        return res.status(500).send({ error: { message: 'Invalid path for image URL' } } )
      }
      prisma.createBlog({
        description,
        name,
        logoUrl,
        manager: { connect: { id: req.userId } }
      })
      .then(newBlog => res.json(newBlog))
      .catch(error => res.status(400).send({ error }))
    }
  },
  {
    method: 'put',
    url: '/blog',
    middleware: [loggedInGuard],
    callback: async(req, res) => {
      await prisma.blogs({
        where:{
          id: req.query.id,
          manager:{
            id: req.userId
          }
        }
      })
      .then(blog => {
        if (blog.length === 0) {
          return res.status(401).send({ error: 'unauthorized access' })
        }
        const { name, description, logoUrl } = req.body;
        prisma.updateBlog({
          where: { id: blog[0].id },
          data: { name, description, logoUrl },
        })
        .then(updatedBlog => res.json(updatedBlog) )
        .catch(error => res.status(500).send({ error }))
      })
      .catch(error => res.status(500).send({ error }))
    }
  },
  {
    method: 'delete',
    url: '/blog',
    middleware: [loggedInGuard],
    callback: (req, res) => {
      const { id } = req.query.id;
      prisma.blogs({
        where:{
          id,
          manager:{
            id: req.userId
          }
        }
      })
      .then(blog => {
        if (blog.length === 0) {
          res.status(401).send({ error: 'unauthorized access' })
          return
        }
        prisma.deleteBlog({ id })
        .then(deletedBlog => res.json(deletedBlog))
        .catch(error => res.status(500).send({ error }))
      })
      .catch(error => res.status(500).send({ error }))
    }
  }
]

export default endpoints