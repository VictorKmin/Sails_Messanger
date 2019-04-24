module.exports = {

  /**
   * This method using to create new chat
   * In request we have all params of new chat and token
   * Then we set to users and chats values as empty arrays if they not exist
   * and check does they are correct
   * Then we check if chats array is not empty we find all users of this chat
   * and concat with already present users ids.
   * Then we insert new chat and get inserted chat back from query
   * After that we check if chat is in basic room or in folder
   * If chat is not in folder we create relation chat_to_basic
   * If all success we create relation user_to_chat
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  create: async (req, res) => {
    try {
      let {users, title, is_private, chats, folder_id, basic_id} = req.body;
      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;
      // Check if it useful
      users = users || [];
      chats = chats || [];
      title = title || '';
      folder_id = folder_id || null;

      if (!users.length && !chats.length) return res.badRequest('Add some users first');
      if (!title.trim()) return res.badRequest('Title must be not empty');
      if (!basic_id) return res.badRequest('Please enter basic folder ID');

      const createChat = `INSERT INTO sch$1.mess_chat (title, user_id, folder_id, is_private) 
                          VALUES ($2, $3, $4, $5) RETURNING *;`;
      const createChatInBasic = `INSERT INTO sch$1.mess_chat_to_basic(basic_id, chat_id) VALUES($2, $3)`;
      let getChatMembers = `SELECT DISTINCT user_id FROM sch$1.mess_user_to_chat WHERE chat_id IN (`;

      // If we want add all user from chat to another chat
      if (chats.length > 0) {
        getChatMembers = await sails.helpers.queryBuilderForIn.with({query: getChatMembers, ids: chats});
        const allUsersOfChats = await db.any(getChatMembers, [1]);
        allUsersOfChats.forEach(u => users.push(u.user_id))
      }

      let insertedValue = await db.one(createChat, [1, title, user_id, folder_id, !!is_private]);

      if (folder_id === null) {
        await db.any(createChatInBasic, [1, basic_id, insertedValue.id])
      }

      const addUsersQuery = await sails.helpers.addUserToChat.with({chat_id: insertedValue.id, ids: users});
      await db.any(addUsersQuery, [1]);

      res.ok(insertedValue);
    } catch (e) {
      res.badRequest(e.message)
    }
  },

  /**
   * This method using for update chat.
   * In req.body we have all values for update it.
   * Then we check if title is not empty
   * Check if folder what we want to edit is present.
   * If folder is present update it and return updated value to front-end
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  edit: async (req, res) => {
    try {
      const {title = '', is_private, is_archived, chat_id} = req.body;
      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;
      if (!title.trim()) return res.badRequest('Title cant be empty');

      const isChatPresent = `SELECT * FROM sch$1.mess_chat WHERE user_id = $2 AND id = $3`;
      const updateChatQuery =
        `UPDATE sch$1.mess_chat 
         SET title = $2, is_private = $3, is_archived = $4, updated_at = now() 
               WHERE id = $5 AND user_id = $6  
           RETURNING *;`;

      await db.one(isChatPresent, [1, user_id, chat_id]);
      const updatedChat = await db.any(updateChatQuery, [1, title, !!is_private, !!is_archived, chat_id, user_id]);

      res.ok(updatedChat)

    } catch (e) {
      res.badRequest(e.message)
    }
  },

  /**
   * This method using for delete chat
   * We have chat_id which we want to delete.
   * Check if this chat is present and delete it
   * Then i try to return all info about all chats. But something went wrong
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  delete: async (req, res) => {
    try {
      const {chat_id} = req.query;
      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;
      const isChatPresent = `SELECT * FROM sch$1.mess_chat WHERE user_id = $2 AND id = $3`;
      const deleteChat = `DELETE FROM sch$1.mess_chat WHERE user_id = $2 AND id = $3`;

      await db.one(isChatPresent, [1, user_id, chat_id]);
      await db.none(deleteChat, [1, user_id, chat_id]);
      // TODO CANT READ PROPERTY OF UNDEFINED
      sails.controllers.InfoController.getInfoOnLogin(req, res)
    } catch (e) {
      res.badRequest(e.message)
    }
  },


  /**
   * This method using for adding users to chat
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  addUsers: async (req, res) => {
    try {
      let {users, chats, chat_id} = req.body;
      users = users || [];
      chats = chats || [];

      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;

      let getChatMembers = `SELECT DISTINCT user_id FROM sch$1.mess_user_to_chat WHERE chat_id IN (`;

      // If we want add all user from chat to another chat
      if (chats.length > 0) {
        getChatMembers = await sails.helpers.queryBuilderForIn.with({query: getChatMembers, ids: chats});
        const allUsersOfChats = await db.any(getChatMembers, [1]);
        allUsersOfChats.forEach(u => users.push(u.user_id))
      }

      const addUsersQuery = await sails.helpers.addUserToChat.with({chat_id, ids: users});
      await db.any(addUsersQuery, [1]);

    } catch (e) {
      res.badRequest(e.message)
    }
  }
};

