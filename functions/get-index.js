'use strict';

const fs = require("fs")
const Mustache = require('mustache')
const http = require('axios')
const aws4 = require('aws4');
const URL = require('url')

const awsRegion = process.env.AWS_REGION;
const cognitoUserPoolId = process.env.cognito_user_pool_id;
const cognitoClientId = process.env.cognito_client_id

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const restaurantsApiRoot = process.env.restaurants_api


var html;

function loadHtml() {
  if (!html) {
    html = fs.readFileSync('static/index.html', 'utf-8')
  }

  return html;
}

async function getRestaurants() {
  let url = URL.parse(restaurantsApiRoot);
  let opts = {
    host: url.hostname,
    path: url.pathname
  };

  aws4.sign(opts);

  const httpReq = http.get(restaurantsApiRoot, {
    headers: {
      'Host': opts.headers['Host'],
      'X-Amz-Date': opts.headers['X-Amz-Date'],
      'Authorization': opts.headers['Authorization'],
      'X-Amz-Security-Token': opts.headers['X-Amz-Security-Token']
    }
  })

  return (await httpReq).data
}

module.exports.handler = async (event) => {  
  let template = loadHtml();
  let restaurants = await getRestaurants();
  let dayOfWeek = days[new Date().getDay()];

  let view = {
    dayOfWeek,
    restaurants,
    awsRegion,
    cognitoUserPoolId,
    cognitoClientId,
    searchUrl: `${restaurantsApiRoot}/search`
  }
  let html = Mustache.render(template, view);

  const response = {
    statusCode: 200,
    body: html,
    headers: {
      'Content-Type': 'text/html; charset=UTF-8'
    }
  };
  return response
}
