const moment = require('moment');
const request = require('supertest');
const { Rental } = require("../../models/rentals");
const { Users } = require("../../models/users");
const { Movie } = require("../../models/movies");
const mongoose = require('mongoose');


describe('/api/returns', function () {
  let server;
  let customerId;
  let movieId;
  let rental;
  let token;
  let movie;

  beforeEach(() => {
    server = require('../../index');
  });

  afterEach(async() => {
    await Rental.remove({});
    await server.close();
  });

  beforeEach(async () => {
    customerId = mongoose.Types.ObjectId();
    movieId = mongoose.Types.ObjectId();
    movie = await new Movie({
      _id: movieId,
      title: '12345',
      dailyRentalRate: 2,
      genre: { name: '12345' },
      numberInStock: 10
    }).save();
    rental = await new Rental({
      customer: {
        _id: customerId,
        name: '12345',
        phone: '12345'
      },
      movie: {
        _id: movieId,
        title: '12345',
        dailyRentalRate: 2
      }
    }).save();
    token = await new Users().generateAuthToken();
  })

  const exec = () => {
    return request(server)
      .post('/api/returns')
      .set('x-auth-token', token)
      .send({ customerId, movieId });
  }

  it('should return 401 if client is not logged in', async function () {
    token = '';

    const res = await exec();

    expect(res.status).toBe(401);
  });

  it('should return 400 if customerId is not provided', async function () {
    customerId = '';

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it('should return 400 if movieId is not provided', async function () {
    movieId = '';

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it('should return 404 if no rental found for this customer/movie', async function () {
    await Rental.remove({});

    const res = await exec();

    expect(res.status).toBe(404);
  });

  it('should return 400 if rental already processed', async function () {
    rental.dateReturned = new Date();
    await rental.save();

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it('should return 200 if return is a valid request', async function () {
    const res = await exec();

    expect(res.status).toBe(200);
  });

  it('should set the returnDate if input is valid ', async function () {
    await exec();
    const rentalInDb = await Rental.findById(rental._id);
    const diff = new Date() - rentalInDb.dateReturned;
    expect(diff).toBeLessThan(10 * 1000);
  });

  it('should calculate the rental fee if input is valid ', async function () {
    rental.dateOut = moment().add(-7, 'days').toDate();
    await rental.save();
    await exec();
    const rentalInDb = await Rental.findById(rental._id);
    expect(rentalInDb.rentalFee).toBe(14);
  });

  it('should increase the movie stock if input is valid ', async function () {
    await exec();
    const movieInDb = await Movie.findById(movieId);
    expect(movieInDb.numberInStock).toBe(movie.numberInStock + 1);
  });

  it('should return the rental if input is valid ', async function () {
    const res = await exec();
    const rentalInDb = await Rental.findById(rental._id);
    expect(res.body).toHaveProperty('dateOut');
    expect(res.body).toHaveProperty('dateReturned');
    expect(res.body).toHaveProperty('rentalFee');
    expect(res.body).toHaveProperty('customer');
    expect(res.body).toHaveProperty('movie');

    expect(Object.keys(res.body)).toEqual(
      expect.arrayContaining(['dateOut', 'dateReturned', 'rentalFee', 'customer', 'movie']));
  });

});
