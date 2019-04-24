module.exports = {


  friendlyName: 'Add user to chat',


  description: `This helper build query using for INSERT VALUES statement. We get query like 
                 INSERT INTO mess_user_to_chat(user_id, chat_id) VALUES
                 and have array of id's. Than we iterate this array and add to query`,

  inputs: {
    chat_id: {
      type: 'number',
      description: "Chat id for witch we add users",
      required: true
    },
    ids: {
      type: ['ref'],
      description: "Array of id's",
      required: true,
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs) {
    let query = `INSERT INTO sch$1.mess_user_to_chat(user_id, chat_id) VALUES`;
    inputs.ids.forEach(id => {
      query += `(${id}, ${inputs.chat_id}), `
    });

    query = query.slice(0, -2) + `;`;
    return query
  }
};

