module.exports = {


  friendlyName: 'Add user to chat',


  description: `This helper build query using for INSERT VALUES statement. We get query like 
                 INSERT INTO mess_l_room_user(user_id, room_id) VALUES
                 and have array of id's. Than we iterate this array and add to query`,

  inputs: {
    room_id: {
      type: 'number',
      description: "Room id for witch we add users",
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
    let query = `INSERT INTO sch$1.mess_l_room_user(user_id, room_id) VALUES`;
    inputs.ids.forEach(id => {
      query += `(${id}, ${inputs.room_id}), `
    });

    query = query.slice(0, -2) + `;`;
    return query
  }
};

