const winston = require ('winston');

module.exports = function (err, req, res, next){
  //Logs the exception
  // winston.log('error', err.message)
  winston.error(err.message, err);

  // Levels
  // error
  // warn
  // info
  // verbose
  // debug
  // silly
  res.status(500).send('Something failed.');
}
