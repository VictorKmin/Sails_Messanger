/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
   *                                                                          *
   * Make the view located at `views/homepage.ejs` your home page.            *
   *                                                                          *
   * (Alternatively, remove this and add an `index.html` file in your         *
   * `assets` directory)                                                      *
   *                                                                          *
   ***************************************************************************/

  '/': {view: 'pages/homepage'},

  // TOKEN. WILL BE DELETE
  'GET /t': 'MessageController.gener',


  // INFORMATION ROUTER
  'GET /info/messageInfo': 'InfoController.getInfoOnLogin',
  'GET /info/getUsersAndRooms': 'InfoController.getUsersOrRoomsByName',
  'GET /info/getUsers/:id': 'InfoController.getAvailableUserByRoom',

  // FOLDER ROUTES
  'POST /folder': 'FolderController.create',
  'PUT /folder': 'FolderController.edit',
  'DELETE /folder/:id': 'FolderController.delete',

  // ROOM ROUTER
  'POST /room': 'RoomController.create',
  'PUT /room': 'RoomController.edit',
  'DELETE /room/:id': 'RoomController.delete',
  'GET /room/:id': 'RoomController.getRoomInfo',

  // MESSAGE ROUTER
  'POST /message': 'MessageController.create',


  /***************************************************************************
   *                                                                          *
   * More custom routes here...                                               *
   * (See https://sailsjs.com/config/routes for examples.)                    *
   *                                                                          *
   * If a request to a URL doesn't match any of the routes in this file, it   *
   * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
   * not match any of those, it is matched against static assets.             *
   *                                                                          *
   ***************************************************************************/


};
