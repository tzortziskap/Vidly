const express = require('express');
const router = express.Router();
const { Users, validateUser} = require('../models/users')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const auth = require('../middleware/auth')

router.get('/me', auth, async (req, res) => {
  res.send(await Users.findById(req.user._id).select('-password'));
})

router.post('/', async (req,res) => {
  const { error } = validateUser(req.body)
  if (error) return res.status(400).send(error.details[0].message);

  let user = await Users.findOne({ email: req.body.email })
  if (user) return res.status(400).send('User already registered');

  user = new Users (_.pick(req.body, ['name', 'email', 'password']));

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt)

  await user.save()

  const token = user.generateAuthToken();

  res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
})

module.exports = router;
