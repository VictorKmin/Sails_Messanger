/**
 * StartController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  /**
   * This method using to get all folders and chats available to current user
   * and get count of unread messages by every chat
   * Firstly we validate body
   * Then we have queries for data base
   * Then we get all needed values like
   * all basic rooms, folders with chats available to current user,
   * chats without folders with this user and chats in folders
   * Then we need to build response object
   * For that we use basicRooms object
   * We itar it and check if basic room id is equals to basic room in folder object
   * and check if basic room id in folder without folder is equals to basic room id.
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  getInfoOnLogin: async (req, res) => {
    try {
      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;

      let getUserChats =
        `SELECT count(u.id) AS unread_message, c.*
         FROM sch$1.mess_chat c
                  JOIN sch$1.mess_unread_message u
                       ON c.id = u.chat_id
         WHERE c.id IN (SELECT chat_id FROM sch$1.mess_user_to_chat WHERE user_id = 10)
           AND is_archived = FALSE
         GROUP BY c.id;`;

      const getAvailableFolders =
        `SELECT f.*
         FROM sch$1.mess_chat_folder f
         WHERE f.id IN (SELECT folder_id
                        FROM sch$1.mess_chat mc
                                 JOIN sch$1.mess_user_to_chat utc on mc.id = utc.chat_id
                        WHERE utc.user_id = $2)
            OR f.user_id = $2`;

      const getChatsWithoutRoom =
        `SELECT c.*, ctb.basic_id
         FROM sch$1.mess_chat c
                  JOIN sch$1.mess_user_to_chat utc ON c.id = utc.chat_id
                  JOIN sch$1.mess_chat_to_basic ctb on c.id = ctb.chat_id
         WHERE folder_id IS NULL
           AND utc.user_id = $2`;

      const getBasicRooms = `SELECT * FROM sch$1.mess_basic_rooms`;

      let basicRooms = await db.any(getBasicRooms, [1]);
      let availableFolders = await db.any(getAvailableFolders, [1, user_id]);
      let chatsWithoutRoom = await db.any(getChatsWithoutRoom, [1, user_id]);
      let userChats = await db.any(getUserChats, [1, user_id]);

      availableFolders.map(folder => {
        folder.chats = [];
        userChats.forEach(chat => {
          if (folder.id === chat.folder_id) {
            folder.chats.push(chat)
          }
        })
      });

      basicRooms.map(room => {
        room.folders = [];
        room.chats = [];
        chatsWithoutRoom.forEach(chat => {
          if (chat.basic_id === room.id) {
            room.chats.push(chat)
          }
        });
        availableFolders.forEach(folder => {
          if (room.id === folder.basic_id) {
            room.folders.push(folder)
          }
        });
      });

      res.ok(basicRooms);
    } catch (e) {
      console.log(e);
      res.badRequest(e.message);
    }
  },

  /**
   * This method using when we want to add user,
   * room or folder of rooms members to new chat.
   * We find all by name and get count of users inside.
   * @param req
   * @param res
   * @return {Promise<void>}
   */

  getUsersOrRoomsByName: async (req, res) => {
    try {
      let {w = ''} = req.query;
      console.log(w);
      w = `%${w}%`;
      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;

      const findUsers =
        `SELECT nom, prenom, id_pers_physique
         FROM sch$1.pers_physique
         WHERE nom ILIKE $2'
            OR prenom LIKE $2;`;

      const findRooms =
        `SELECT count(r2u.l_room_user_id) AS member_count, r.*
         FROM sch$1.mess_room r
                  JOIN sch$1.mess_l_room_user r2u on r.room_id = r2u.room_id
         WHERE title ILIKE $2
           AND r2u.user_id = $3
           AND r.is_archived = FALSE
         GROUP BY r.room_id;`;

      const findFolders =
        `SELECT DISTINCT f.title                   AS folder_title,
                         r.title                   AS room_title,
                         r.room_id,
                         count(r2u.l_room_user_id) AS members_count
         FROM sch$1.mess_room r
                  LEFT JOIN sch$1.mess_l_folder f2f ON f2f.child_id = r.folder_id
                  JOIN sch$1.mess_l_room_user r2u on r.room_id = r2u.room_id
                  LEFT JOIN sch$1.mess_folder f on f2f.child_id = f.folder_id
         WHERE r.folder_id IN (SELECT folder_id FROM sch$1.mess_folder WHERE title LIKE $2)
            OR f2f.parent_id IN (SELECT folder_id FROM sch$1.mess_folder WHERE title LIKE $2)
             AND r2u.user_id = $3
         GROUP BY f.title, r.title, r.room_id;`;

      const users = await db.any(findUsers, [1, w]);
      const rooms = await db.any(findRooms, [1, w, user_id]);
      const folders = await db.any(findFolders, [1, w, user_id]);

      res.ok({users, rooms, folders})
    } catch (e) {
      res.badRequest(e.message);
    }
  },


  /**
   * This method using when we want to add new users to room
   * In query require param is id -> id of room where we need to add user
   * In query param w we can send ford to find user by name or surname
   * If this param is empty database return all available users
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  getAvailableUserByRoom: async (req, res) => {
    try {
      const {id} = req.params;
      let {w = ''} = req.query;
      w = `%${w}%`;
      if (!id) return req.badRequest('Select room id first');

      const getAvaliableUsers =
        `SELECT DISTINCT pp.prenom, pp.nom, pp.id_pers_physique
         FROM sch$1.pers_physique pp
         WHERE pp.id_pers_physique NOT IN (SELECT user_id FROM sch$1.mess_l_room_user WHERE room_id = $2)
             AND pp.nom ILIKE $3'
            OR pp.prenom ILIKE $3;`;

      const users = db.any(getAvaliableUsers, [1, id, w]);

      res.ok(users);
    } catch (e) {
      res.badRequest(e.message);
    }
  }


};

