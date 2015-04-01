var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

//define bcrypt
var bcrypt = require('bcrypt-nodejs');

// To logout the user (must install express-password-logout)
var logout = require('express-passport-logout');

//enable sessions
//$ npm install express-session
var session = require('express-session');
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

//protect by checking user
app.get('/', util.checkUser,
function(req, res) {
  res.render('index');
});


//Get login
app.get('/login', 
function(req, res) {
  res.render('login');
});

// Logout the user 
app.get('/logout', function(req, res) {
  logout();
  res.render('login');
});

//Sign up
app.get('/signup', 
function(req, res) {
  res.render('signup');
});

//protect by checking user
app.get('/create', util.checkUser, 
function(req, res) {
  res.render('index');
});

//protect by checking user
app.get('/links', util.checkUser,
function(req, res) {
  Links.reset().fetch().then(function(links) {

    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {

  var uri = req.body.url;
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/login', function(req,res) {
    
  var username = req.body.username;
  var password = req.body.password;
  //get username 
  new User({'username': username}).fetch().then(function(user){
    //if no user
    if (!user) {
      //redicrect to sign up page - user doesn't exist
      res.redirect('/login');
    } else {
      //get user password and compare
      bcrypt.compare(password, user.get('password'), function(err, valid){
        //check user password
        if (valid) {
          //if matched DO SOMETHING
          util.createSession(req, res, user);
        } else {
          //if not send user to login page
          res.redirect('/login');   
        }
      })
    }
  });
});


// sign up
app.post('/signup', function(req,res) {
    
  var username = req.body.username;
  var password = req.body.password;

  //get username and password
  new User({username: username}).fetch().then(function(found){
    //if user exist
    if (!found) {
      bcrypt.hash(password, null, null, function(err, hash){

        var newUser = new User({
          username: username,
          password: hash
        });

        newUser.save().then(function(newUser) {
          //create session for new user
          util.createSession(req, res, newUser);
          Users.add(newUser);
        })     
      });

    } else {
      //redirect to singup page
      console.log("The following username already exists!!!");
      res.redirect('/signup');

    }
  });
});



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {

  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
