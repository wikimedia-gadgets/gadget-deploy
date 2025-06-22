import express from "express";
import conf from "../conf.ts";

const router = express.Router();

router.get('/initiate', async (req, res) => {
	const {gadget, wiki} = req.query;

	res.redirect(302, conf.restApiUrl + '/oauth2/authorize' +
		'?response_type=code' +
		'&client_id=' + conf.clientId +
		'&redirect_uri=' + conf.redirectUrl +
		'&state=' + gadget + '@' + wiki);
});

export default router;
