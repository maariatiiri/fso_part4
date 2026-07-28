const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')

const bcrypt = require('bcrypt')
const User = require('../models/user')

const api = supertest(app)

describe('when there are initially blogs in database', async () => {

    beforeEach(async () => {
        
        await Blog.deleteMany({})
        await Blog.insertMany(helper.initialBlogs)

        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', name: 'Tester', passwordHash })
        await user.save()
        
    })

    test('all blogs are returned', async () => {
        const response = await api.get('/api/blogs')

        assert.strictEqual(response.body.length, helper.initialBlogs.length)
    })

    test('blogs have an unique "id" component', async () => {
        const response = await api.get('/api/blogs')
        assert(response.body.every(b => b.id !== null))
    })

    describe('adding a new blog', ()=> {
        
        test.only('a valid blog can be added ', async () => {

            const loginInfo = await api
                .post('/api/login')
                .send({
                    username: 'root',
                    password: 'sekret'
                })
                .expect(200)

            const newBlog = {
                title: 'What do Dark Souls games and studying physics have in common?',
                author: 'Maaria Tiiri',
                url: 'fyysikkokilta.fi',
                likes: '1'
            }

            await api
                .post('/api/blogs')
                .set('Authorization', `Bearer ${loginInfo.body.token}`)
                .send(newBlog)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            const blogsAtEnd = await helper.blogsInDb()

            assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

            const titles = blogsAtEnd.map(b => b.title)
            assert(titles.includes('What do Dark Souls games and studying physics have in common?'))
        })

        test.only('likes are set to zero if they are missing', async () => {

            const loginInfo = await api
                .post('/api/login')
                .send({
                    username: 'root',
                    password: 'sekret'
                })
                .expect(200)

            const newBlog = {
                title: 'Why Elden Ring is better without summons',
                author: 'Maaria Tiiri',
                url: 'fyysikkokilta.fi',
            }

            await api
                .post('/api/blogs')
                .set('Authorization', `Bearer ${loginInfo.body.token}`)
                .send(newBlog)
                .expect(201)
                .expect('Content-Type', /application\/json/)

            const blogsAtEnd = await helper.blogsInDb()

            const likelessBlog = blogsAtEnd.filter(b => b.title === 'Why Elden Ring is better without summons')[0]
            assert.strictEqual(likelessBlog.likes, 0)
        })

        test.only('missing title or url results in 400 bad request', async () => {
            const loginInfo = await api
                .post('/api/login')
                .send({
                    username: 'root',
                    password: 'sekret'
                })
                .expect(200)
            
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
                .set('Authorization', `Bearer ${loginInfo.body.token}`)
                .send(blogWithoutTitle)
                .expect(400)

            await api
                .post('/api/blogs')
                .set('Authorization', `Bearer ${loginInfo.body.token}`)
                .send(blogWithoutUrl)
                .expect(400)

            const blogsAtEnd = await helper.blogsInDb()

            assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length)
        })

        test.only('not providing a token results in 401 unauthorized request', async () => {
            const newBlog = {
                title: 'Why Elden Ring is better without summons',
                author: 'Maaria Tiiri',
                url: 'fyysikkokilta.fi',
            }

            await api
                .post('/api/blogs')
                .send(newBlog)
                .expect(401)
        })
    })



    describe('viewing a specific blog', ()=> {
        test('a valid blog can be viewed', async () => {
            const initiallyFoundBlogs = await helper.blogsInDb()
            
            const blogToView = initiallyFoundBlogs[0]

            const resultBlog = await api
                .get(`/api/blogs/${blogToView.id}`)
                .expect(200)
                .expect('Content-Type', /application\/json/)

            assert.deepStrictEqual(resultBlog.body, blogToView)
            })

        test('fails with statuscode 404 if note does not exist', async () => {
            const validNonexistingId = await helper.nonExistingId()

            await api.get(`/api/blogs/${validNonexistingId}`).expect(404)
        })

        test('fails with statuscode 400 id is invalid', async () => {
            const invalidId = '5a3d5da59070081a82a3445'

            await api.get(`/api/blogs/${invalidId}`).expect(400)
        })
    })

    describe('deleting a blog', () => {
        test('succeeds with status code 204 if id is valid', async () => {
        const initiallyFoundBlogs = await helper.blogsInDb()
        const blogToDelete = initiallyFoundBlogs[0]

        await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

        const blogsAtEnd = await helper.blogsInDb()

        const ids = blogsAtEnd.map(n => n.id)
        assert(!ids.includes(blogToDelete.id))

        assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)
        })

        test('fails with statuscode 400 id is invalid', async () => {
            const invalidId = '5a3d5da59070081a82a3445'

            await api.delete(`/api/blogs/${invalidId}`).expect(400)
        })

        test('fails with statuscode 404 if note is already deleted', async () => {
            const validNonexistingId = await helper.nonExistingId()

            await api.delete(`/api/blogs/${validNonexistingId}`).expect(404)
        })
    })

    describe('updating blog info', ()=> {
        test('updating likes succeeds if id is valid', async () => {
            const newLikes = 100000

            const initiallyFoundBlogs = await helper.blogsInDb()
            const blogToUpdate = initiallyFoundBlogs[0]

            const updatedBlog = await api
                .put(`/api/blogs/${blogToUpdate.id}`)
                .send({
                    title: blogToUpdate.title,
                    author: blogToUpdate.author,
                    url: blogToUpdate.url,
                    likes: newLikes
                })
                .expect(200)
                .expect('Content-Type', /application\/json/)
            assert.strictEqual(updatedBlog.body.likes, newLikes)
        })

        test('fails with statuscode 400 if new value is invalid', async () => {
            const newLikes = "many"

            const initiallyFoundBlogs = await helper.blogsInDb()
            const blogToUpdate = initiallyFoundBlogs[0]

            const updatedBlog = await api
                .put(`/api/blogs/${blogToUpdate.id}`)
                .send({
                    title: blogToUpdate.title,
                    author: blogToUpdate.author,
                    url: blogToUpdate.url,
                    likes: newLikes
                })
                .expect(400)
        })

        test('fails with statuscode 400 if id is invalid', async () => {
            const invalidId = '5a3d5da59070081a82a3445'

            const updatedBlog = await api
                .put(`/api/blogs/${invalidId}`)
                .send({
                    title: "none",
                    author: "nobody",
                    url: "404.com",
                    likes: 0
                })
                .expect(400)
        })

        test('fails with statuscode 404 if blog is deleted', async () => {
            const validNonexistingId = await helper.nonExistingId()

            const updatedBlog = await api
                .put(`/api/blogs/${validNonexistingId}`)
                .send({
                    title: "none",
                    author: "nobody",
                    url: "404.com",
                    likes: 0
                })
                .expect(404)
        })
    })

})




after(async () => {
  await mongoose.connection.close()
})