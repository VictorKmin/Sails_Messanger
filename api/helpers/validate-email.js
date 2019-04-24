module.exports = {


  friendlyName: 'Validate email',


  description: 'Function to validate if passed string is as an email format',


  inputs: {
    email: {
      type: 'string',
      description: 'Email to verify',
      required: true
    }
  },


  exits: {
    ArgumentError: {
      description: "Email is in bad format",
    }
  },


  fn: async function (inputs, exits) {
    const regexEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (regexEmail.test(String(inputs.email).toLowerCase()))
      return exits.success();
    return exits.ArgumentError({code: 'ArgumentError', message: 'bad_email_format'});
  }


};

