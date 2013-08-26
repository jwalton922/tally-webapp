module.exports = function(app) {

  //Index page
  app.get('/', function(req, res) {
    
    res.render('index', { title: 'Awsome' });
    
  });

  // User Routes
  var users = require('../app/controllers/users');
  app.get( '/user', users.userHome );
}
