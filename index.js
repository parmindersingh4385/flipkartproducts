const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());

const port = process.env.PORT || 5000;

app.get('/', function(req, res){
    res.json({
        success: true,
        message: 'Product saved successfully'
    });
});

app.get('/:id', async function(req, res){
    const productId = req.params.id;
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