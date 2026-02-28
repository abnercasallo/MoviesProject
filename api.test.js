const request = require('supertest');
const app = require('./server');
const emailService = require('./emailService');

jest.mock('./emailService');

describe('API Endpoint /api/send-welcome-email', () => {
    it('should send a welcome email when valid email is provided', async () => {
        emailService.sendEmail.mockResolvedValue({ response: '250 OK' });

        const res = await request(app)
            .post('/api/send-welcome-email')
            .send({ email: 'newuser@example.com' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ message: 'Welcome email sent successfully' });
        expect(emailService.sendEmail).toHaveBeenCalledWith(
            'newuser@example.com',
            'Welcome to Netflix Clone!',
            'Thanks for signing up! Enjoy unlimited movies and TV shows.'
        );
    });

    it('should return 400 if email is missing', async () => {
        const res = await request(app).post('/api/send-welcome-email').send({});

        expect(res.statusCode).toEqual(400);
        expect(res.body).toEqual({ error: 'Email is required' });
    });

    it('should return 500 if email service fails', async () => {
        emailService.sendEmail.mockRejectedValue(new Error('Service Error'));

        const res = await request(app)
            .post('/api/send-welcome-email')
            .send({ email: 'fail@example.com' });

        expect(res.statusCode).toEqual(500);
        expect(res.body).toEqual({ error: 'Failed to send email' });
    });
});
