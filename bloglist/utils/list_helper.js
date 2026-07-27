const array = require('lodash/array')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
    const reducer = (sum, item) => {
        return sum + item
    }
    return blogs.length === 0
    ? 0
    : blogs.map(b => b.likes).reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
    const reducer = (currentBest, item) => {
        return (currentBest.likes > item.likes ? currentBest : item)
    }
    return blogs.length === 0
    ? null
    : blogs.reduce(reducer)
}

const mostBlogs = (blogs) => {
    const reducer = (currentBest, item) => {
        return (currentBest.blogs > item.blogs ? currentBest : item)
    }
    if (blogs.length === 0) {
        return null
    }
    const authors = array.uniq(blogs.map(b => b.author))
    const authorsAndBlogs = authors.map(author => {
        return({   
            author: author,
            blogs: blogs.filter(b => b.author === author).length
        })
    })
    return authorsAndBlogs.reduce(reducer)
}

const mostLikes = (blogs) => {
    const reducer = (currentBest, item) => {
        return (currentBest.likes > item.likes ? currentBest : item)
    }
    if (blogs.length === 0) {
        return null
    }
    const authors = array.uniq(blogs.map(b => b.author))
    const authorsAndLikes = authors.map(author => {
        return({   
            author: author,
            likes: blogs.filter(b => b.author === author).reduce((acc, cv) => acc + cv.likes, 0)
        })
    })
    return authorsAndLikes.reduce(reducer)
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}