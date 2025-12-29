import path from "node:path";
import createError from "http-errors";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import {morganStream} from "./logger.ts";
import streamRouter from './stream.ts';
import initiateRouter from "./initiate.ts";

const app = express();

app.use(morgan('dev', { stream: morganStream }));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(import.meta.dirname, '../../client/dist')));
app.use('/', initiateRouter);
app.use('/', streamRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.type('text').end(err.stack);
});

export default app;
