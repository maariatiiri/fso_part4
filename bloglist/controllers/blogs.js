const jwt = require('jsonwebtoken')

const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const mw = require('../utils/middleware')


blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', mw.userExtractor, async (request, response) => {
  const body = request.body
  const user = request.user
  
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes ? body.likes : 0,
    user: user
  })

  const savedBlog = await blog.save()

  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  response.status(201).json(savedBlog)
})

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

blogsRouter.delete('/:id', mw.userExtractor, async (request, response) => {
  const user = request.user
  const userid = user._id

  const blog = await Blog.findById(request.params.id)

  if (blog) {
    if ( blog.user.toString() === userid.toString() ) {
      await Blog.findByIdAndDelete(request.params.id)
      response.status(204).end()
    }
    else {
      return response.status(401).json({ error: 'blog can only be deleted by the user who added it' })
    }
  } else {
    response.status(404).end()
  }
})

blogsRouter.put('/:id', async (request, response) => {

  const body = request.body
  const blog = await Blog.findById(request.params.id)

  if (!blog) {
        return response.status(404).end()
    }
  blog.title = body.title
  blog.author = body.author
  blog.url = body.url
  blog.likes = body.likes
  const updatedBlog = await blog.save()
  response.json(updatedBlog)
})

module.exports = blogsRouter