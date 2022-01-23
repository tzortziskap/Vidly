const request = require('supertest');
const { Genres } = require('../../models/genres');
const { Users } = require('../../models/users');
const mongoose = require('mongoose');

let server;

describe('/api/genres', () => {

  beforeEach(() => { server = require('../../index'); });

  afterEach(async() => {
    await Genres.remove({});
    await Users.remove({});
    await server.close();
  });

  describe('GET /', function () {
    it('should return all genres', async () => {
      await Genres.collection.insertMany([
        {name: 'genre1'},
        {name: 'genre2'}
      ]);
      const res = await request(server).get('/api/genres');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(g => g.name === 'genre1')).toBeTruthy();
      expect(res.body.some(g => g.name === 'genre2')).toBeTruthy();
    });

  });

  describe('GET /:id', function () {
    it('should return a genre if valid id is passed', async () => {
      const genre = new Genres({name: 'genre1'});
      await genre.save();
      const res = await request(server).get('/api/genres/' + genre._id);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', genre.name);
    });

    it('should return 404 if invalid id is passed', async () => {
      const res = await request(server).get('/api/genres/1');
      expect(res.status).toBe(404);
    });

    it('should return 404 if id does not exist', async () => {
      const id = mongoose.Types.ObjectId().toHexString();
      const res = await request(server).get('/api/genres/' + id);
      expect(res.status).toBe(404);
    });

  });

  describe('POST /', function () {

    // Define the happy path, and then in each test, we change
    // one parameter that clearly aligns with the name of the
    // test.
    let token;
    let name;

    const exec = async () => {
      return await request(server)
        .post('/api/genres')
        .set('x-auth-token',token)
        .send({ name: name });
    }

    beforeEach(() => {
      token = new Users().generateAuthToken();
      name = 'genre1';
    });

    it('should return 401 if client is not logged in', async function () {
      token = '';

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it('should return 400 if genre is less than 5 characters', async function () {
      name = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if genre is more than 50 characters', async function () {
      name = new Array(52).join('a');

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should save the genre if it is valid', async function () {
      await exec();

      const genre = await Genres.find({name: 'genre1'});

      expect(genre).not.toBeNull();
    });

    it('should return the genre if it is valid', async function () {
      const res = await exec();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name','genre1');
    });

  });

  describe('PUT /:id', () => {

    let genre;
    let name;

    const exec = async () => {
      return await request(server)
        .put('/api/genres/' + genre._id.toHexString())
        .send({name: name});
    }

    beforeEach(async () => {
      name = 'genre2';
      genre = await new Genres({
        name: 'genre1'
      }).save();
    });

    it('should update the genre if it is valid', async function () {
      const res = await exec();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name','genre2');
    });

    it('should return 400 if the genre is invalid', async function () {
      name = '1234';

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 404 if the genre id does not exist', async function () {
     genre._id = mongoose.Types.ObjectId();

     const res = await exec();

     expect(res.status).toBe(404);
    });

  });

  describe('DELETE /:id', () => {

    let genre;
    let user;
    let token


    const exec = async () => {
      return await request(server)
        .delete('/api/genres/' + genre._id.toHexString())
        .set('x-auth-token', token)
        .send();
    }

    beforeEach(async () => {
      genre = await new Genres({
        name: 'genre1'
      }).save();
      user = await new Users({
        name: 'testName',
        email: 'testEmail@example.com',
        password: "12345",
        isAdmin: true
      }).save();
      token = user.generateAuthToken();
    });

    it('should delete the genre if user is admin and has token', async function () {
      const res = await exec();
      const genre2 = await Genres.findById(genre._id);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', 'genre1')
      expect(genre2).toBeNull();
    });

    it('should return 404 if genre does not exist and user is admin and has token', async function () {
      genre._id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404)
    });

    it('should return 403 if user is not admin', async function () {
      user = await Users.findByIdAndUpdate(user._id, {isAdmin: false}, {new: true})
      token = user.generateAuthToken();
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it('should return 401 if user is not authenticated', async function () {
      token = '';
      const res = await exec();
      expect(res.status).toBe(401);
    });

  });

})
