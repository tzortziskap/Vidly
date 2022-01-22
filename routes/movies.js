const express = require('express')
const router = express.Router();
const { Movie, validate} = require('../models/movies')
const {Genres} = require("../models/genres");

router.get('/', async (req, res) => {
  res.send(await Movie.find().sort('name'));
});

router.get('/:id', async (req, res) => {
  let id = req.params.id;
  const movie = await Movie.findById(id);
  if (movie){
    res.send(movie)
  } else {
    return res.status(404).send('The course with the given ID was not found');
  }
});

router.post('/', async (req, res) => {
  const bodyReq = req.body
  const { error } = validate(bodyReq);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  let genre = await Genres.findById(bodyReq.genreId);
  if (!genre) return res.status(400).send('Invalid genre.');

  let movie = new Movie({
    title: bodyReq.title,
    genre: {
      _id: genre._id,
      name: genre.name
    },
    numberInStock: bodyReq.numberInStock,
    dailyRentalRate: bodyReq.dailyRentalRate
  });
  res.send(await movie.save());
});

router.put('/:id',async (req, res) => {
  const bodyReq = req.body;
  const { error } = validate(bodyReq);
  if (error) return res.status(400).send(error.details[0].message);

  let movie = await Movie.findByIdAndUpdate(req.params.id, { name: bodyReq.name}, { new: true });
  if (!movie) return res.status(404).send('The movie with the given ID was not found');
  else {
    res.send(await movie.save());
  }
});

router.delete('/:id',async (req, res) => {
  const id = req.params.id;
  let movie = await Movie.findByIdAndRemove(id)

  if (!movie) return res.status(404).send('The movie with the given ID was not found');
  else {
    res.send(movie);
  }
});

module.exports = router;
