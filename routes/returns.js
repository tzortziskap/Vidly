const express = require('express');
const router = express.Router();
const { Rental } = require('../models/rentals');
const { Movie } = require('../models/movies');
const auth = require('../middleware/auth');
const Joi = require("joi");
const validate = require('../middleware/validator');

router.post('/', [auth, validate(validateReturn)], async (req, res) => {
  const rental = await Rental.lookup(req.body.customerId, req.body.movieId);

  if (!rental) res.status(404).send('Rental Not Found');

  if (rental.dateReturned) res.status(400).send('Return Already Processed');

  rental.return();
  await rental.save();

  await Movie.update({ _id: rental.movie._id }, {
    $inc: { numberInStock: 1 }
  });
  
  res.send(rental);
});

function validateReturn(req){
  const schema = Joi.object({
    customerId: Joi.objectId().required(),
    movieId: Joi.objectId().required()
  });
  return schema.validate(req);
}

module.exports = router;
