var keystone = require('keystone');
var Slack = require('node-slack');
var slack = new Slack(process.env.DOMAIN,process.env.TOKEN);

var Student = keystone.list('Student');

exports = module.exports = function(req, res) {

    /*slack.send({
        text: 'Howdy!',
        channel: '#random',
        username: 'Bot'
    });*/

    //Student.model.find().

    var reply = slack.respond(req.body,function(hook) {

      var arr = hook.text.split(" ");

      if (arr[0].toLowerCase() == "translated") {

        var name = arr.slice(2);
        console.log(name);

        Student.model.findOne()
          .where('name.first', name)
          .exec().then( function(student) {
            if (!student) {
              res.json({
                text: "I'm sorry, but I couldn't find a student named " + name,
                username: "Bot"
              });
            } else {
              console.log("student found");
              res.json({
                text: "I'm happy to hear that " + student.name.first + " " + student.name.last + " (" + student.matricola + ") translated something",
                username: "Bot"
              });
            }
          }, function(err) {
            console.log(err);
          });
      } else {
        res.json({
          text: "I don't know what you are talking about, " + hook.user_name,
          username: 'Bot'
        });
      }
    });

    //res.json(reply);

}
