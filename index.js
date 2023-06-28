const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const schedule = require('node-schedule');
const mongoose = require('mongoose');
const telegram = require('telegram-bot-api');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = process.env.PORT || 5000;

//products model
const PRODUCTS = mongoose.model('tbl_products', {
	title: String,
	product_id: String,
	description: String,
	created_date: String,
	image_url: Object,
	brand_url: String,
	purchase_url: String,
	price: String,
	source: String,
	is_active: Boolean
});

// Load the session data
mongoose
	.connect(
		'mongodb+srv://parminder:9988641591%40ptk@cluster0-ix992.mongodb.net/db_products?retryWrites=true&w=majority',
		{
			useNewUrlParser: true,
			useUnifiedTopology: true
		}
	)
	.then(() => {
		scheduleJobForGf();
	});

function scheduleJobForGf() {
	schedule.scheduleJob('*/1 * * * *', function () {
		const groupName = 'GirlsFab';
		sendToTelegramChannel(groupName);
	});
}

async function sendToTelegramChannel(groupName) {
	try {
		let randomProduct = await PRODUCTS.find({
			source: groupName.toLowerCase()
		}).limit(1);

		if (randomProduct && randomProduct.length > 0) {
			let retData = randomProduct[0];

			var api = new telegram({
				token: '6158204123:AAGoADPhxzS8wQGO8DeLWwZr6g8gpoQbSLo',
				async_requests: true,
				updates: {
					enabled: true,
					get_interval: 1000
				}
			});

			api.sendPhoto({
				chat_id: '@' + groupName, //'@GirlsFab',
				caption: `${retData.title} ${retData.purchase_url}`,
				photo: retData.image_url[retData.image_url.length - 1]
			}).then(function (data) {
				deleteAfterSent(retData.product_id);
			});
		}
	} catch (err) {}
}

async function deleteAfterSent(productId) {
	const result = await PRODUCTS.findOneAndDelete({
		product_id: productId
	});
	if (!result) {
	} else {
	}
}

app.get('/', function (req, res) {
	res.status(200).json({
		success: true,
		message: 'App working successfully................TEST'
	});
});

app.post('/:source/:id', async function (req, res) {
	console.log('qqqqqqqqqqqqqqq');
	const productId = req.params.id,
		source = req.params.source;

	try {
		const result = await PRODUCTS.find({ product_id: productId });
		console.log(result);
		if (result.length > 0) {
			res.status(200).json({
				success: true,
				message: 'Product already exists'
			});
		} else {

			const config = {
				headers: {
					'Fk-Affiliate-Id': 'singh1par',
					'Fk-Affiliate-Token': '1d5f2616c8c644f2806fe8da0c40946e'
				}
			};

			const response = await axios.get('https://affiliate-api.flipkart.net/affiliate/1.0/product.json?id=' + productId, config);
 
			if(response.data){
				const dataObj = response.data.productBaseInfoV1;

				var imagesArray = Object.entries(dataObj.imageUrls).map(
					(e) => e[1]
				);

				var newProduct = new PRODUCTS({
					title: dataObj.title,
					product_id: productId,
					description: dataObj.productDescription,
					created_date: new Date().toISOString(),
					image_url: imagesArray,
					//brand_url: dataObj.brand_url,
					purchase_url: dataObj.productUrl,
					price:
						dataObj?.flipkartSpecialPrice?.amount ||
						dataObj?.flipkartSellingPrice?.amount,
					source: source,
					is_active: dataObj.inStock
				});

				const result = await PRODUCTS.find({ product_id: productId });
				if (result.length > 0) {
					res.status(200).json({
						success: true,
						message: 'Product already exists'
					});
				} else {
					var retData = await newProduct.save();
					res.status(200).json({
						success: true,
						data: retData
					});
				}
			}
		}
	} catch (err) {
		res.status(200).json({
			success: false,
			message: err.message
		});
	}
});

app.listen(port, '0.0.0.0', function () {
	console.log('App running on port ' + port);
});
