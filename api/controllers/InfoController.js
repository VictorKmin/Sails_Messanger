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
  }

  //////////////////////////////////////////////////

  // TODO дістати юзерів по імені або фамілії для додавання в діалог

  // TODO


};

