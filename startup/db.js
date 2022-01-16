const mongoose = require("mongoose");
const winston = require('winston');

module.exports = function() {
  mongoose.connect('mongodb://localhost/vidly')
    .then(() => winston.info("Connect to MongoDB..."))
}
