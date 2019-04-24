module.exports = {


  friendlyName: 'Get token',


  description: '',


  inputs: {
    req: {
      type: 'ref',
      description: 'The request param',
      required: true
    }
  },


  exits: {
    MissingArgumentError: {
      description: "An argument or multiple args are missing",
    },
    ArgumentError: {
      description: "The given argument is not in the good format"
    }
  },


  fn: async function (inputs, exits) {
    if (!(inputs.req.headers && inputs.req.headers.authorization))
      return exits.MissingArgumentError({code: 'MissingArgumentError', message: "missing_auth_header"})
    const parts = inputs.req.headers.authorization.split(' ');
    if (parts.length === 2) {
      let [scheme, token] = parts;
      if (/^bearer$/i.test(scheme)) {
        return exits.success(token);
      }
    }
    return exits.ArgumentError({code: 'ArgumentError', message: "bad_auth_header_format"})
  }
};

