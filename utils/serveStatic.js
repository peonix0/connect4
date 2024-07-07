const fs = require('fs')
const path = require('path')

const gogoServeStatic = (filePath, res) => {
  if (filePath === '/') {
    filePath = './public/index.html'
  }
  else {
    filePath = './public' + filePath
  }

  let extname = String(path.extname(filePath)).toLowerCase()
  let mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.ico': 'image/x-icon'
  }

  let contentType = mimeTypes[extname]

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/html' })
      console.log(error.message, error.path)
      res.end()
    }
    else {
      res.writeHead(200, { 'Content-Type': contentType })
      res.write(content, 'utf-8')
      res.end()
    }
  })
}

module.exports = gogoServeStatic
