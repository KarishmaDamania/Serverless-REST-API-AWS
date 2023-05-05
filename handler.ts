'use strict';
// const DynamoDB = require("aws-sdk/clients/dynamodb");
import { DynamoDB } from 'aws-sdk'
import { APIGatewayEvent, Context, APIGatewayProxyCallback } from 'aws-lambda'
const documentClient = new DynamoDB.DocumentClient({
  region: 'us-east-1',
  maxRetries: 3,
  httpOptions: {
    timeout: 5000
  }
})

const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode, data) =>{
  return {
    statusCode,
    body: JSON.stringify(data)
  }
}

export const createNote = async (event: APIGatewayEvent , context: Context , callback: APIGatewayProxyCallback) => {
  context.callbackWaitsForEmptyEventLoop = false
  let data = JSON.parse(event.body!)
  try {
    const params = {
      TableName: NOTES_TABLE_NAME!,
      Item: {
        notesId: data.id,
        title: data.title,
        body: data.body
      },
      ConditionExpression: "attribute_not_exists(notesId)"
    }
    await documentClient.put(params).promise()
    callback(null, send(201, data))
  }
  catch(err){
    send(500, err.message)
  }
};

export const updateNote = async (event: APIGatewayEvent , context: Context , callback: APIGatewayProxyCallback) => {
  let notesId = event.pathParameters?.id
  context.callbackWaitsForEmptyEventLoop = false
  let data = JSON.parse(event.body!)
  try{
    const params = {
      TableName: NOTES_TABLE_NAME!,
      Key: {
        notesId: notesId
      },
      UpdateExpression: 'set #title = :title, #body = :body',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#body' : 'body'
      },
      ExpressionAttributeValues: {
        ':title': data.title,
        ':body': data.body
      },
      ConditionExpression: 'attribute_exists(notesId)'
    }
    await documentClient.update(params).promise()
    callback(null, send(200, data))
  }
  catch(err){
    callback(null, send(500, err.message))
  }
};

export const deleteNote = async (event: APIGatewayEvent , context: Context , callback: APIGatewayProxyCallback) => {
  context.callbackWaitsForEmptyEventLoop = false
  let notesId = event.pathParameters?.id
  try {
    const params = {
      TableName: NOTES_TABLE_NAME!,
      Key: {
        notesId: notesId
      }
    }
    await documentClient.delete(params).promise()
    callback(null, send(200, notesId))
  }
  catch(err){
    callback(null, send(500, err.message))
  }
};

export const getAllNotes = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false
  try {
    const params = {
      TableName: NOTES_TABLE_NAME!,
    }
    const notes = await documentClient.scan(params).promise()
    callback(null, send(200, notes))
  }
  catch(err){
    callback(null, send(500, err.message))
  }
};
