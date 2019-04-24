const sha256 = require('js-sha256')

module.exports = {


  friendlyName: 'Encode password',


  description: 'Encode the password in database format',


  inputs: {
    password: {
      type: 'string',
      description: 'Password to encode',
      required: true
    }
  },


  exits: {

  },


  fn: async function (inputs, exits) {
    const hashPassword = sha256(inputs.password)
    const lowerCasePassword = hashPassword.toLocaleLowerCase()
    const base64Password = new Buffer(lowerCasePassword).toString('base64')
    const hexPassword = new Buffer(base64Password, 'base64').toString('hex') // Est-ce necessaire?
    const escapeSpecialCharPassword = hexPassword.replace(/(OD|OA|od|oa| )/gi, '') // Est-ce necessaire?
    const base64WithoutEscape = new Buffer(escapeSpecialCharPassword, 'hex').toString('base64') // Est-ce necessaire?
    // All done.
    return exits.success(base64WithoutEscape);
  }


};

