const bcrypt = require('bcrypt')
const User = require('../models/user')

const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app)

describe('when there is initially one user in db', () => {

  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  describe('adding new users', async ()=>{
    test('creation succeeds with a fresh username and valid password', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
            password: 'salainen',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        assert(usernames.includes(newUser.username))
    })

    test('creation fails with statuscode 400 if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'Superuser',
            password: 'salainen',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert(result.body.error.includes('expected `username` to be unique'))

        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('creation fails with statuscode 400 if password is invalid or missing', async () => {
        const usersAtStart = await helper.usersInDb()

        const noPWUser = {
            username: 'juuri',
            name: 'Megauser',
        }

        const invalidPWUser = {
            username: 'juuri',
            name: 'Megauser',
            password: "ei"
        }

        const result1 = await api
            .post('/api/users')
            .send(noPWUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        
        const result2 = await api
            .post('/api/users')
            .send(invalidPWUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()

        assert(result1.body.error.includes('invalid password'))
        assert(result2.body.error.includes('invalid password'))

        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
  })

})

after(async () => {
  await mongoose.connection.close()
})