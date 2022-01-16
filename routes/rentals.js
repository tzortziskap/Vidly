const {Rental, validateRental} = require('../models/rentals');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {Movie} = require('../models/movies');
const {Customer} = require('../models/customers');
const Fawn = require('fawn');

Fawn.init(mongoose)

router.get('/', async (req, res) => {
  res.send(await Rental.find().sort('-dateOut'));
});

router.post('/', async (req, res) => {
  const {error} = validateRental(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // if ( !mongoose.Types.ObjectId.isValid(req.body.customerId)) return res.status(400).send('Invalid customer.')
  const customer = await Customer.findById(req.body.customerId);
  if (!customer) return res.status(400).send('Invalid customer.');

  const movie = await Movie.findById(req.body.movieId);
  if (!movie) return res.status(400).send('Invalid movie.');

  if (movie.numberInStock === 0) return res.status(400).send('Movie not in stock');

  let rental = new Rental({
    customer: {
      _id: customer._id,
      name: customer.name,
      phone: customer.phone
    },
    movie: {
      _id: movie._id,
      title: movie.title,
      dailyRentalRate: movie.dailyRentalRate
    }
  });

  // rental = await rental.save();
  //
  // movie.numberInStock--;
  // movie.save();

  try {
    new Fawn.Task()
      .save('rentals', rental)
      .update('movies', {_id: movie._id}, {$inc: {numberInStock: -1}})
      .run();
    res.send(rental);
  } catch (e) {
    res.status(500).send('Something failed')
    console.log(e.message)
  }
});

module.exports = router;
