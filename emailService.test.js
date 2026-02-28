const nodemailer = require('nodemailer');

// Mock nodemailer module
jest.mock('nodemailer');

// Create the mock function for sendMail
const sendMailMock = jest.fn();

// Configure createTransport to return an object with our sendMail mock
// This must happen BEFORE require('./emailService') because the service 
// calls createTransport at the top level.
nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

const { sendEmail } = require('./emailService');

describe('Email Service', () => {
    beforeEach(() => {
        // Clear mock usage data between tests
        sendMailMock.mockClear();
    });

    it('should send an email successfully', async () => {
        sendMailMock.mockResolvedValue({ response: '250 OK' });

        const to = 'test@example.com';
        const subject = 'Test Subject';
        const text = 'Test Body';

        const result = await sendEmail(to, subject, text);

        expect(sendMailMock).toHaveBeenCalledWith({
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            text: text,
        });
        expect(result).toEqual({ response: '250 OK' });
    });

    it('should throw an error if sending fails', async () => {
        sendMailMock.mockRejectedValue(new Error('Failed to send'));

        await expect(sendEmail('test@example.com', 'Sub', 'Txt')).rejects.toThrow('Failed to send');
    });
});
