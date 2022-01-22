const express = require('express')
const router = express.Router();
const { Customer, validate } = require('../models/customers')

router.get('/', async (req, res) => {
  res.send(await Customer.find().sort('name'));
});

router.get('/:id', async (req, res) => {
  let id = req.params.id;
  const customer = await Customer.findById(id);
  if (customer){
    res.send(customer)
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
  let customer = new Customer({
    name: bodyReq.name,
    phone: bodyReq.phone,
    isGold: bodyReq.isGold
  });
  res.send(await customer.save());
});

router.put('/:id',async (req, res) => {
  const bodyReq = req.body;
  const { error } = validate(bodyReq);
  if (error) return res.status(400).send(error.details[0].message);

  let customer = await Customer.findByIdAndUpdate(req.params.id, {
    name: bodyReq.name,
    phone: bodyReq.phone,
    isGold: bodyReq.isGold
  }, { new: true });
  if (!customer) return res.status(404).send('The customer with the given ID was not found');
  else {
    res.send(await customer.save());
  }
});

router.delete('/:id',async (req, res) => {
  const id = req.params.id;
  let customer = await Customer.findByIdAndRemove(id)

  if (!customer) return res.status(404).send('The customer with the given ID was not found');
  else {
    res.send(customer);
  }
});

module.exports = router;
