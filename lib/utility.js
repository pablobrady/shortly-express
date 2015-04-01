var request = require('request');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/

//check if user is login
exports.Login = function(req, res) {
  return req.session ? !!req.session.user : false;
}

//CHECK USER
exports.checkUser = function(req, res, next) {
  //check if user is logged in
  if(exports.Login(req)){
    //if not logged in then send user to login page
    res.redirect('/login');   
  } else { 
    //if user logged in, continue
    next();
  }
}

//CREATE NEW SESSION
exports.createSession = function(req, res, user) {

  //creating a new session 
  return req.session.regenerate(function(){
    //set current session to current user 
    req.session.user = user;
    //directing user to "homepage"
    res.redirect('/');
  });
}
