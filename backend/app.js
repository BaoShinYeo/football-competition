const express = require('express')
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require("body-parser");
require('dotenv').config()
const app = express()
const port = 4000
const AWS = require('aws-sdk');

// parse application/json
app.use(bodyParser.json())

// enable cors
app.use(cors())

let awsConfig = {
    'region': "ap-southeast-1",
    'endpoint': 'http://dynamodb.ap-southeast-1.amazonaws.com',
    'accessKeyId': process.env.accessKeyId,
    'secretAccessKey': process.env.secretAccessKey
};
AWS.config.update(awsConfig);

const dynamoDB = new AWS.DynamoDB.DocumentClient();