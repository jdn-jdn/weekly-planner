const path    = require('path');
const PORT    = process.env.PORT || 5000;
const express = require('express');
const app     = express();

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
	res.render('pages/result');
});

app.listen(PORT, function() { 
	console.log(`Listening on port ${ PORT }`);
});