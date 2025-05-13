export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const status = err.status || 500;
    const message = err.message || 'Algo deu errado!';

    res.status(status).json({
        status: 'error',
        statusCode: status,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};