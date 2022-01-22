const express = require('express')
const router = express.Router();
const { Genres, validate} = require('../models/genres')
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')
const validateObjectId = require('../middleware/validateObjectId');

router.get('/', async (req, res, next) => {
  // throw new Error('Could not get the genres.');
  res.send(await Genres.find().sort('name'));
});

router.get('/:id', validateObjectId,async (req, res) => {
  let id = req.params.id;
  const genre = await Genres.findById(id);
  if (genre){
    res.send(genre)
  } else {
      return res.status(404).send('The course with the given ID was not found');
  }
});

router.post('/', auth, async (req, res) => {

  const bodyReq = req.body
  const { error } = validate(bodyReq);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  let genre = new Genres({
    name: bodyReq.name
  });
  res.send(await genre.save());
});

router.put('/:id',async (req, res) => {
  const bodyReq = req.body;
  const { error } = validate(bodyReq);
  if (error) return res.status(400).send(error.details[0].message);

  let genre = await Genres.findByIdAndUpdate(req.params.id, { name: bodyReq.name}, { new: true });
  if (!genre) return res.status(404).send('The genre with the given ID was not found');
  else {
    res.send(await genre.save());
  }
});

router.delete('/:id', [auth, admin], async (req, res) => {
  const id = req.params.id;
  let genre = await Genres.findByIdAndRemove(id)

  if (!genre) return res.status(404).send('The genre with the given ID was not found');
  else {
    res.send(genre);
  }
});

module.exports = router;
