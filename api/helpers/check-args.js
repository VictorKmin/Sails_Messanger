const _ = require('lodash')

module.exports = {


  friendlyName: 'Check args',


  description: 'Check if args sent are ok or not',


  inputs: {
    req: {
      type: 'ref',
      description: "The request object",
      required: false
    },
    args: {
      type: ['string'],
      description: "Args that are mandatory",
      required: true
    },
    allValues: {
      type: "boolean",
      description: "If should return all body, in case of an args is not required",
      required: false,
      defaultsTo: false
    },
    obj: {
      type: {},
      description: "The object to check",
      required: false
    }
  },


  exits: {
    MissingArgumentError: {
      description: "An argument or multiple args are missing",
    }
  },


  fn: async function (inputs, exits) {
    const body = _.get(inputs.req, 'body', false)
    const query = _.get(inputs.req, 'query', false)
    const obj = inputs.obj
    const missingArgument = []
    const requiredObject = {}
    const objectToSearchOn = obj || body || query
    if (objectToSearchOn) {
      inputs.args.forEach(arg => {
        const value = _.get(objectToSearchOn, arg, false)
        if (!value) {
          missingArgument.push(arg)
        } else {
          requiredObject[arg] = value
        }
      });
    } else {
      return exits.MissingArgumentError({code: 'MissingArgumentError', message: 'missing_args'})
    }
    if (missingArgument.length > 0) {
      return exits.MissingArgumentError({code: 'MissingArgumentError', message: `missing_args`, missing_argument: missingArgument})
    }
    if (inputs.allValues) {
      return exits.success(objectToSearchOn);
    }
    return exits.success(requiredObject);
  }


};

