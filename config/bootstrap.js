const pgp = require("pg-promise")();

/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function (done) {
  const cn = {
    host: process.env.MYUNISOFT_DB_HOST,
    port: process.env.MYUNISOFT_DB_PORT,
    database: process.env.MYUNISOFT_DB_NAME,
    user: process.env.MYUNISOFT_DB_USER,
    password: process.env.MYUNISOFT_DB_PASSWORD
  };

  try {
    console.log(cn);
    global.db = await pgp(cn);

    global.checkArgs = async (req, args, allValues) => {
      return await sails.helpers.checkArgs
        .with({req, args, allValues})
        .intercept('MissingArgumentError', (err) => err)
    };
    global.checkObj = async (obj, args, allValues) => {
      return await sails.helpers.checkArgs
        .with({obj, args, allValues})
        .intercept('MissingArgumentError', (err) => err)
    };
    global.getToken = async (req) => {
      return await sails.helpers.getToken.with({req})
        .intercept('MissingArgumentError', (err) => err)
        .intercept('ArgumentError', (err) => err)
    }
  } catch (err) {
    console.log(err)
  }
  return done()
};
