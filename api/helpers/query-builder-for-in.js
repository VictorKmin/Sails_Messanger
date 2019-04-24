module.exports = {


  friendlyName: 'Query builder for in',


  description: `This helper build query using for IN( statement. We get query like 
                 SELECT * FROM table WHERE id IN( 
                 and have array of id's. Than we iterate this array and add to query`,


  inputs: {
    query: {
      type: 'string',
      description: "Query to edit",
      required: true
    },
    ids: {
      type: ['ref'],
      description: "Array of id's",
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs) {
    inputs.ids.forEach(chat_id => {
      inputs.query += `${chat_id}, `;
    });
    inputs.query = inputs.query.slice(0, -2) + `);`;

    return inputs.query;
  }


};

