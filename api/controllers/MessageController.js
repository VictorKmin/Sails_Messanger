/**
 * MessageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

let jwt = require('jsonwebtoken');


module.exports = {
  create: async (req, res) => {
    console.log(req.body);
    res.ok('OK')
  },


  // TOKEN
  gener: (req, res) => {
    const access_token = jwt.sign({
      pers_physique_id: parseInt('46'),
      member_group_id: 1
    }, process.env.MYUNISOFT_JWT_SECRET, {expiresIn: '7d'});

    res.ok({
      access_token,
      token_type: "bearer"
    })
  }

};

