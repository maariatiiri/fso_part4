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

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}