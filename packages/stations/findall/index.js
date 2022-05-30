const connect = require('./mongodb-client');
const { StatusCodes, getReasonPhrase } = require('http-status-codes');

async function main(args) {
  try {
    // const userId = args.__ow_headers['x-user-id'];
    // if (!userId) {
    //   return {
    //     error: {
    //       statusCode: StatusCodes.UNAUTHORIZED,
    //       body: {
    //         message: 'user id header required'
    //       }
    //     }
    //   }
    // }

    const client = await connect();
    const db = await client.db(process.env.DATABASE);
    const stationsCollection = await db.collection("stations");
    const stations = await stationsCollection.find().toArray();

    return {
      body: {
        stations
      }
    }
  } catch (error) {
    console.error(error)
    return {
      error: {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        body: {
          message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR)
        }
      }
    }
  }
}

exports.main = main;
// const qrcode = require('qrcode')

// exports.main = (args) => {
//   return qrcode.toDataURL(args.text).then(res => ({
//     headers:  { 'content-type': 'text/html; charset=UTF-8' },
//     body: args.img == undefined ? res : `<img src="${res}">`
//   }))
// }

// if (process.env.TEST) exports.main({text:"hello"}).then(console.log)
