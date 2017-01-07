const fs = require('fs');
const express = require('express');
const spawn = require('child_process').spawn;
const path = require('path');
const bodyParser = require('body-parser')
const mime = require('mime');
const request = require('request');
const targz = require('tar.gz');

const app = express();
const BIN_DIR = path.join(__dirname, '.bin');
const GRAPHVIZ_DIR = path.join(__dirname, '.bin/graphviz');
const GRAPHVIZ_BIN_URL = 'https://cdn.hyperdev.com/29e9a5ba-f214-4010-8083-7358607f3893%2Fgraphviz.tar.gz';
const utils = require('./utils');

// Index
app.use(express.static('public'));
app.use(bodyParser());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.all('/graphviz', (req, res) => {
  const mode = req.query.mode || 'render';
  const format = req.query.format || 'svg';
  const graph = req.query.graph || req.body.graph;
  let layout = req.query.layout || 'dot';
  let out = {success: true, data: ''};
  
  if (utils.layout.indexOf(layout) < 0) {
    return res.json(Object.assign(out, {success: false, error: `Layout engine ${format} isn't supported`}));
  }
  
  if (utils.format.indexOf(format) < 0) {
    return res.json(Object.assign(out, {success: false, error: `Output format ${format} isn't supported`}));
  }
  
  if (['render', 'download'].indexOf(mode) < 0) {
    res.json(Object.assign(out, {success: false, error: `Mode ${format} isn't supported`}));
    return;
  }
  
  const dot = spawn(path.join(GRAPHVIZ_DIR, layout), [`-T${format}`]);
  
  dot.stdin.write(graph);
  dot.stdin.end();
  
  if (mode === 'download') {
    res.header('Content-Type', mime.lookup(format));
    res.header('Content-disposition', `attachment; filename=graph.${format}`);
    dot.stdout.pipe(res);
    dot.stderr.on('data', (err) => {
      res.header('Content-Type', 'text/plain');
      res.end(err);
    });
    return;
  }
  
  dot.stdout.on('data', function (data) {
    out.data = out.data.concat(data);
  });
  
  dot.stderr.on('data', function (err) {
    out = Object.assign(out, {success: false, error: err.toString()});
  });
  
  dot.on('close', function () {
    res.json(out);
  });
});

prepare((err) => {
  if (!err) {
    app.listen(process.env.PORT, () => {
      console.log(`App listen on port ${process.env.PORT}`)
    });    
  } else {
    throw err;
  }
})

function prepare(callback) {
  if (!fs.existsSync(path.join(GRAPHVIZ_DIR, 'dot'))) {
    var response = request(GRAPHVIZ_BIN_URL).pipe(targz().createWriteStream(BIN_DIR));
    
    response.on('error', (err) => {
      callback(err);
    });
    
    response.on('end', function () {
      callback();
    });    
  } else {
    callback(null);
  }
}

