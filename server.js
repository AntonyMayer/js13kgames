const express = require('express'),
      app = express(),
      router = express.Router();

router.get('/', function(req, res) {
    console.log('Connected');
});

app.use(express.static(__dirname + '/public'));
app.use(router);

app.listen(3300);