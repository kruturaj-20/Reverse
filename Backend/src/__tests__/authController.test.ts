import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import User from '../models/User';

let mongo!: MongoMemoryServer; // definite assignment from beforeAll

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth routes', () => {
  it('should sign up a user and return tokens', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'P@ssw0rd!',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should not allow duplicate signup', async () => {
    await User.create({
      name: 'Existing',
      email: 'dup@example.com',
      password: 'P@ssw0rd!',
    });

    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Existing',
      email: 'dup@example.com',
      password: 'P@ssw0rd!',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should login existing user with correct password', async () => {
    await request(app)
      .post('/api/v1/auth/signup')
      .send({ name: 'Login User', email: 'login@example.com', password: 'P@ssw0rd!' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'P@ssw0rd!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    await request(app)
      .post('/api/v1/auth/signup')
      .send({ name: 'Login User', email: 'login2@example.com', password: 'P@ssw0rd!' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login2@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should refresh tokens and rotate', async () => {
    const signup = await request(app)
      .post('/api/v1/auth/signup')
      .send({ name: 'Refresh User', email: 'refresh@example.com', password: 'P@ssw0rd!' });
    const { refreshToken } = signup.body.data;

    const refreshRes = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();

    // using same token again should cause 401
    const reuse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(reuse.status).toBe(401);
  });
});
