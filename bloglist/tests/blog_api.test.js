const assert = require('node:assert')
const { test, after, beforeEach } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  assert.strictEqual(response.body.length, helper.initialBlogs.length)
})

test('blogs have an unique "id" component', async () => {
  const response = await api.get('/api/blogs')
  assert(response.body.every(b => b.id !== null))
})

test('a valid blog can be added ', async () => {
  const newBlog = {
    title: 'What do Dark Souls games and studying physics have in common?',
    author: 'Maaria Tiiri',
    url: 'fyysikkokilta.fi',
    likes: '1'
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

  const titles = blogsAtEnd.map(b => b.title)
  assert(titles.includes('What do Dark Souls games and studying physics have in common?'))
})

test.only('likes are set to zero if they are missing', async () => {
  const newBlog = {
    title: 'Why Elden Ring is better without summons',
    author: 'Maaria Tiiri',
    url: 'fyysikkokilta.fi',
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()

  const likelessBlog = blogsAtEnd.filter(b => b.title === 'Why Elden Ring is better without summons')[0]
  assert.strictEqual(likelessBlog.likes, 0)
})

test.only('missing title or url results in 400 bad request', async () => {
  const blogWithoutTitle = {
    author: 'Maaria Tiiri',
    url: 'fyysikkokilta.fi',
  }
  const blogWithoutUrl = {
    title: 'Shouting into the void',
    author: 'Maaria Tiiri'
  }

  await api
    .post('/api/blogs')
    .send(blogWithoutTitle)
    .expect(400)

  await api
    .post('/api/blogs')
    .send(blogWithoutUrl)
    .expect(400)

  const blogsAtEnd = await helper.blogsInDb()

  assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
})

after(async () => {
  await mongoose.connection.close()
})