let infoOnLogin = require('./InfoController').getInfoOnLogin;
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
      let {users, rooms, folders, title, type_id, folder_id} = req.body;
      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;
      // Check if it useful
      users = users || [];
      rooms = rooms || [];
      folders = folders || [];
      title = title || '';
      folder_id = folder_id || null;

      if (!users.length && !rooms.length && !folders.length) return res.badRequest('Add some users first');
      if (!title.trim()) return res.badRequest('Title must be not empty');
      if (!type_id) return res.badRequest('Room must have a type');

      const createdRoom = `INSERT INTO sch$1.mess_room (title, user_id, folder_id, room_type_id) 
                          VALUES ($2, $3, $4, $5) RETURNING *;`;
      let getRoomMembers = `SELECT DISTINCT user_id FROM sch$1.mess_l_room_user WHERE room_id IN ($2:csv);`;
      const getFolderMembers =
        `SELECT DISTINCT r2u.user_id
         FROM sch$1.mess_room r
                  LEFT JOIN sch$1.mess_l_room_user r2u on r.room_id = r2u.room_id
         WHERE r.folder_id IN (SELECT child_id FROM sch$1.mess_l_folder WHERE parent_id IN ($2:csv))
            OR r.folder_id IN ($2:csv)
             AND r2u.room_id IN (SELECT r2u.room_id FROM sch$1.mess_l_room_user r2u WHERE r2u.user_id = $3);`;

      // If we want add all user from chat to another chat
      if (rooms.length > 0) {
        const allUsersOfRoom = await db.any(getRoomMembers, [1, rooms]);
        allUsersOfRoom.forEach(u => users.push(u.user_id))
      }
      if (folders.length > 0) {
        const allFolderUsers = await db.any(getFolderMembers, [1, folders, user_id]);
        allFolderUsers.forEach(u => users.push(u.user_id))
      }
      // Add creator to room
      users.push(user_id);
      let insertedValue = await db.one(createdRoom, [1, title, user_id, folder_id, type_id]);

      const addUsersQuery = await sails.helpers.addUserToChat.with({chat_id: insertedValue.id, ids: users});
      await db.any(addUsersQuery, [1]);

      res.ok(insertedValue);
    } catch (e) {
      console.log(e);
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
      const {title = '', type_id, is_archived, room_id} = req.body;
      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;
      if (!title.trim()) return res.badRequest('Title cant be empty');
      if (!type_id) return res.badRequest('Select type ID first');

      const isRoomPresent = `SELECT * FROM sch$1.mess_room WHERE user_id = $2 AND room_id = $3`;

      const updateRoomQuery =
        `UPDATE sch$1.mess_room 
         SET title = $2, room_type_id = $3, is_archived = $4, updated_at = now() 
               WHERE room_id = $5 AND user_id = $6  
           RETURNING *;`;

      await db.one(isRoomPresent, [1, user_id, room_id]);
      const updatedRoom = await db.any(updateRoomQuery, [1, title, type_id, !!is_archived, room_id, user_id]);

      res.ok(updatedRoom)

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
      const {id} = req.params;
      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;
      const isRoomPresent = `SELECT * FROM sch$1.mess_room WHERE user_id = $2 AND room_id = $3`;
      const deleteChat = `DELETE FROM sch$1.mess_room WHERE user_id = $2 AND room_id = $3`;

      await db.one(isRoomPresent, [1, user_id, id]);
      await db.none(deleteChat, [1, user_id, id]);
      infoOnLogin(req, res)
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
  addUsersToRoom: async (req, res) => {
    try {
      let {users, room_id} = req.body;
      users = users || [];

      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;

      let getChatMembers = `SELECT DISTINCT user_id FROM sch$1.mess_l_room_user WHERE room_id IN ($2:csv)`;

      // If we want add all user from chat to another chat
      if (rooms.length > 0) {
        const allUsersOfRoom = await db.any(getChatMembers, [1, rooms]);
        allUsersOfRoom.forEach(u => users.push(u.user_id))
      }

      const addUsersQuery = await sails.helpers.addUserToChat.with({chat_id, ids: users});
      await db.any(addUsersQuery, [1]);

    } catch (e) {
      res.badRequest(e.message)
    }
  },


  /**
   * This method return all info about room.
   * We have basic room info, members of room, tags of room and files
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  getRoomInfo: async (req, res) => {
    try {
      const {id} = req.params;

      const getRoomTags =
        `SELECT t.label
         FROM sch$1.mess_tag t
                  LEFT JOIN sch$1.mess_l_tag_message t2m on t.tag_id = t2m.tag_id
                  LEFT JOIN sch$1.mess_message mm on t2m.message_id = mm.message_id
         WHERE mm.room_id = $2`;

      const getRoomFiles =
        `SELECT d.id_document, d.libelle, m.user_id, m.created_at, pp.nom, pp.prenom
         FROM sch$1.document d
                  LEFT JOIN sch$1.mess_l_doc_message d2m on d.id_document = d2m.doc_id
                  LEFT JOIN sch$1.mess_message m on d2m.message_id = m.message_id
                  LEFT JOIN sch$1.pers_physique pp on m.user_id = pp.id_pers_physique
         WHERE d2m.room_id = $2`;

      const getRoomMembers =
        `SELECT p.nom, p.prenom, p.id_pers_physique
         FROM sch$1.pers_physique p
                  LEFT JOIN sch$1.mess_l_room_user mr on p.id_pers_physique = mr.user_id
         WHERE mr.room_id = $2`;

      const getRoomInfo =
        `SELECT COUNT(u2r.l_room_user_id) AS member_count,
                r.*,
                t.label,
                p.nom,
                p.prenom
         FROM sch$1.mess_room r
                  JOIN sch$1.mess_l_room_user u2r on r.room_id = u2r.room_id
                  JOIN sch$1.mess_room_type t on r.room_type_id = t.room_type_id
                  JOIN sch$1.pers_physique p ON r.user_id = p.id_pers_physique
         WHERE r.room_id = $2
         GROUP BY r.room_id, t.label, p.nom, p.prenom`;

      const info = await db.any(getRoomInfo, [1, id]);
      const members = await db.any(getRoomMembers, [1, id]);
      const tags = await db.any(getRoomTags, [1, id]);
      const files = await db.any(getRoomFiles, [1, id]);

      res.ok({info, members, tags, files})
    } catch (e) {
      res.badRequest(e.message)

    }
  }
};

