jest.mock('../config/firebase', () => {
    const addMock = jest.fn().mockResolvedValue({ id: 'mock-doc-id' });
    const collectionMock = jest.fn(() => ({ add: addMock }));

    return {
        db: {
            collection: collectionMock
        },
        admin: {
            firestore: {
                FieldValue: {
                    serverTimestamp: jest.fn(() => 'mock-timestamp')
                }
            }
        },
        __mocks: {
            addMock,
            collectionMock
        }
    };
});

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue(true)
    }))
}));

const request = require('supertest');
const app = require('../server');
const firebaseModule = require('../config/firebase');

describe('POST /api/contact', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns 200 for a valid payload', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({
                name: 'Mohamed Yasser',
                email: 'mohamed@example.com',
                message: 'Hello, this is a valid message with enough length.'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(firebaseModule.__mocks.collectionMock).toHaveBeenCalledWith('messages');
        expect(firebaseModule.__mocks.addMock).toHaveBeenCalledTimes(1);
    });

    test('returns 400 when required fields are missing', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({
                email: 'mohamed@example.com',
                message: 'Missing name should fail validation.'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(firebaseModule.__mocks.addMock).not.toHaveBeenCalled();
    });

    test('accepts XSS payload after sanitization and returns 200', async () => {
        const res = await request(app)
            .post('/api/contact')
            .send({
                name: '<script>alert("xss")</script>Mo',
                email: 'mohamed@example.com',
                message: '<img src=x onerror=alert(1)>This message is long enough after sanitization.'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(firebaseModule.__mocks.addMock).toHaveBeenCalledTimes(1);

        const savedDoc = firebaseModule.__mocks.addMock.mock.calls[0][0];
        expect(savedDoc.name).toBe('Mo');
        expect(savedDoc.message).toContain('This message is long enough after sanitization.');
        expect(savedDoc.message).not.toContain('<script>');
        expect(savedDoc.message).not.toContain('onerror');
    });

    test('returns 429 when rate limit is exceeded', async () => {
        let status;
        for (let i = 0; i < 4; i++) {
            const res = await request(app)
                .post('/api/contact')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    message: 'This is a test message to trigger rate limit.'
                });
            status = res.statusCode;
            if (status === 429) break;
        }
        
        expect(status).toBe(429);
    });
});
