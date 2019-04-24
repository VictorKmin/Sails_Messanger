/**
 * FolderController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  /**
   * This method using for create new folder.
   * In body we have all data for create folder.
   * Then we need to validate is this data present
   * Then we have queries for data base
   * After successful table creation we find all folders
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  create: async (req, res) => {
    try {
      const {basic_id, title = ''} = req.body;
      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;
      if (!basic_id || !title.trim()) return res.badRequest('Some of params in body is missing');

      const createNewFolder = `INSERT INTO sch$1.mess_chat_folder(title, basic_id, user_id) VALUES($2, $3, $4) RETURNING *`;
      const insertedValue = await db.any(createNewFolder, [1, title, basic_id, user_id]);
      res.ok(insertedValue)
    } catch (e) {
      res.badRequest(e.message)
    }
  },


  /**
   * This method using for edit folder by ID.
   * In body we have all data for update folder.
   * Then we need to validate is this data present
   * Then we have queries for data base
   * We check is this folder is present and if current user create it
   * If folder is present we update it.
   * After successful update we find updated folder and return it to front-end
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  edit: async (req, res) => {
    try {
      const {folder_id, title = ''} = req.body;
      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;

      if (!folder_id || !title.trim()) return res.badRequest('Some of params in body is missing');

      const isFolderPresent = `SELECT * FROM sch$1.mess_chat_folder WHERE user_id = $2 AND id = $3`;
      const updateFolder =
        `UPDATE sch$1.mess_chat_folder 
         SET title = $2, updated_at = now() 
              WHERE id = $3 AND user_id = $4
           RETURNING *`;

      await db.one(isFolderPresent, [1, user_id, folder_id]);
      const updatedFolder = await db.one(updateFolder, [1, title, folder_id, user_id]);

      res.ok(updatedFolder)
    } catch (e) {
      res.badRequest(e.message);
    }
  },

  /**
   * This method using for delete folder and all folder relations
   * In body we have values to delete
   * Then we need to validate is this data present
   * We check if this folder is present.
   * Is this folder is present we delete it. Relations is delete automatically
   * because in database we have cascade delete and update
   * After delete we find all folders and return it to front-end
   * @param req
   * @param res
   * @return {Promise<void>}
   */
  delete: async (req, res) => {
    try {
      const {folder_id} = req.query;
      const token = req.token;
      const {pers_physique_id: user_id, member_group_id} = token;
      if (!folder_id) return res.badRequest('Folder ID is missing');

      const isFolderPresent = `SELECT * FROM sch$1.mess_chat_folder WHERE user_id = $2 AND id = $3`;
      const deleteFolder = `DELETE FROM sch$1.mess_chat_folder WHERE id = $2 AND user_id = $3`;
      const getAllFolders =
        `SELECT f.*
         FROM sch$1.mess_chat_folder f
         WHERE f.id IN (SELECT folder_id
                        FROM sch$1.mess_chat mc
                                 JOIN sch$1.mess_user_to_chat utc on mc.id = utc.chat_id
                        WHERE utc.user_id = $2)
            OR f.user_id = $2`;

      await db.one(isFolderPresent, [1, user_id, folder_id]);
      await db.none(deleteFolder, [1, folder_id, user_id]);

      const allFolders = await db.any(getAllFolders, [1, user_id]);

      res.ok(allFolders)
    } catch (e) {
      res.badRequest(e.message);
    }
  }

};

