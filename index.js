const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const schedule = require('node-schedule');
const mongoose = require('mongoose');

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
mongoose.connect(
	'mongodb+srv://parminder:9988641591%40ptk@cluster0-ix992.mongodb.net/db_products?retryWrites=true&w=majority',
	{
		useNewUrlParser: true,
		useUnifiedTopology: true
	}
)
.then(() => {

});

app.get('/', function(req, res){
    res.json({
        success: true,
        message: 'App working successfully.................'
    });
});

app.post('/:source/:id', async function(req, res){
    const productId = req.params.id,
        source = req.params.source;

    try {
        const result = await PRODUCTS.find({ product_id: productId });
        if (result.length > 0) {
            res.json({
                success: true,
                message: 'Product already exists'
            });
        } else {
            const response = await axios.get('https://affiliate-api.flipkart.net/affiliate/1.0/product.json?id=' + productId, {
                headers:{
                    'Fk-Affiliate-Id': 'singh1par',
                    'Fk-Affiliate-Token': '1d5f2616c8c644f2806fe8da0c40946e'
                }
            }); 
            const dataObj = response.data.productBaseInfoV1;

            var imagesArray =  Object.entries(dataObj.imageUrls).map((e) => ( e[1] ));

            var newProduct = new PRODUCTS({
				title: dataObj.title,
				product_id: productId,
				description: dataObj.productDescription,
				created_date: new Date().toISOString(),
				image_url: imagesArray,
				//brand_url: dataObj.brand_url,
				purchase_url: dataObj.productUrl,
				price: dataObj?.flipkartSpecialPrice?.amount || dataObj?.flipkartSellingPrice?.amount,
				source: source,
				is_active: dataObj.inStock
			});

            const result = await PRODUCTS.find({ product_id: productId });
			if (result.length > 0) {
				res.json({
					success: true,
					message: 'Product already exists'
				});
			} else {
				var retData = await newProduct.save();
				res.json({
					success: true,
					data: retData
				});
			}

        }
    }
    catch (err) { 
        res.json({
            success: false,
            message: err.message
        });
    }

    try{
        const response = await axios.get('https://affiliate-api.flipkart.net/affiliate/1.0/product.json?id=' + productId, {
            headers:{
                'Fk-Affiliate-Id': 'singh1par',
                'Fk-Affiliate-Token': '1d5f2616c8c644f2806fe8da0c40946e'
            }
        }); 
        const dataObj = response.data.productBaseInfoV1;

        res.json({
            success: true,
            data: dataObj
        });
    }
    catch (err) { 
        res.json({
            success: false,
            message: err.message
        });
    }
    
});

app.listen(port, '0.0.0.0', function () {
	console.log('App running on port ' + port);
});