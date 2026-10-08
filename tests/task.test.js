const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Task = require('../models/Task');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Task.deleteMany({});
});

describe('Task API', () => {
    describe('POST /api/tasks', () => {
        it('should create a new task', async () => {
            const taskData = {
                title: 'Test Task',
                description: 'Test Description',
                status: 'pending',
                priority: 'medium'
            };

            const response = await request(app)
                .post('/api/tasks')
                .send(taskData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Test Task');
            expect(response.body.data.description).toBe('Test Description');
        });

        it('should return 400 if title is missing', async () => {
            const taskData = {
                description: 'Test Description'
            };

            const response = await request(app)
                .post('/api/tasks')
                .send(taskData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/tasks', () => {
        it('should return all tasks', async () => {
            await Task.create([
                { title: 'Task 1', description: 'Description 1' },
                { title: 'Task 2', description: 'Description 2' }
            ]);

            const response = await request(app)
                .get('/api/tasks')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(2);
        });

        it('should return empty array when no tasks exist', async () => {
            const response = await request(app)
                .get('/api/tasks')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(0);
            expect(response.body.data).toEqual([]);
        });
    });

    describe('GET /api/tasks/:id', () => {
        it('should return a single task', async () => {
            const task = await Task.create({
                title: 'Test Task',
                description: 'Test Description'
            });

            const response = await request(app)
                .get('/api/tasks/' + task._id)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Test Task');
        });

        it('should return 404 for non-existent task', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get('/api/tasks/' + fakeId)
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/tasks/:id', () => {
        it('should update a task', async () => {
            const task = await Task.create({
                title: 'Original Title',
                description: 'Original Description'
            });

            const response = await request(app)
                .put('/api/tasks/' + task._id)
                .send({ title: 'Updated Title', status: 'completed' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Updated Title');
            expect(response.body.data.status).toBe('completed');
        });
    });

    describe('DELETE /api/tasks/:id', () => {
        it('should delete a task', async () => {
            const task = await Task.create({
                title: 'Task to Delete',
                description: 'Will be deleted'
            });

            const response = await request(app)
                .delete('/api/tasks/' + task._id)
                .expect(200);

            expect(response.body.success).toBe(true);

            const deletedTask = await Task.findById(task._id);
            expect(deletedTask).toBeNull();
        });
    });

    describe('GET /api/health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('API is running');
        });
    });
});